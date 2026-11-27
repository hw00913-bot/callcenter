(() => {
  'use strict';

  const storagePrefix = 'd-contact-cloud-v210-review:quality-inspection-jobs-v1:';
  const timeZone = 'Asia/Shanghai';
  const dayMs = 24*60*60*1000;
  const checkInterval = 60*1000;
  const cutoffTime = '02:00:00';
  const batchSize = 50;
  const wallTime = new Intl.DateTimeFormat('sv-SE',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const running = new Set();
  const listeners = new Set();
  const lastProbe = new Map();
  const jobStates = new Set(['pending','failed','succeeded']);
  const runStates = new Set(['completed','partial','blocked','failed']);
  const fail = error => ({ok:false,error});
  const requestIdFor = call => 'QAR-'+call.id;
  const callIdentityFields = ['id','callId','tenantId','brandId','taskId','roundId','seatId','accountId'];
  const isText = value => typeof value==='string' && value.trim().length>0;
  const isTime = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value);
  const keyOf = scope => storagePrefix+encodeURIComponent(scope.brandId)+':'+encodeURIComponent(scope.tenantId);
  const now = () => wallTime.format(new Date());

  function current(context = window.DSession?.context()) {
    const scope = window.DQualityModelConfig?.access(context);
    return scope ? {context,scope,key:keyOf(scope)} : null;
  }

  function validJob(job) {
    return job && isText(job.id) && isText(job.callId) && jobStates.has(job.status) &&
      Number.isSafeInteger(job.attempts) && job.attempts>=0 && isTime(job.endedAt);
  }

  function validRun(run) {
    return run && isText(run.id) && runStates.has(run.status) && isTime(run.startedAt) && isTime(run.endedAt);
  }

  function read(key) {
    try {
      const original = localStorage.getItem(key);
      const data = original===null ? {version:1,jobs:[],runs:[],lastScheduledAt:''} : JSON.parse(original);
      if (data?.version!==1 || !Array.isArray(data.jobs) || !Array.isArray(data.runs) ||
          (data.lastScheduledAt!=='' && !isTime(data.lastScheduledAt)) ||
          !data.jobs.every(validJob) || new Set(data.jobs.map(row=>row.id)).size!==data.jobs.length ||
          !data.runs.every(validRun)) return fail('质检任务记录无法读取，请刷新后重试。');
      return {ok:true,original,data};
    } catch (_) {
      return fail('质检任务记录无法读取，请刷新后重试。');
    }
  }

  function agentStatus(context) {
    return window.DIntegrationApplications?.status(context,'qualityInspection') ||
      {status:'unavailable',message:'无法读取智能质检 Agent 的接入状态。'};
  }

  function schedule() {
    const instant = new Date();
    const today = wallTime.format(instant).slice(0,10)+' '+cutoffTime;
    const passed = wallTime.format(instant)>=today;
    return {dueAt:passed?today:wallTime.format(new Date(instant.getTime()-dayMs)).slice(0,10)+' '+cutoffTime,
      nextAt:passed?wallTime.format(new Date(instant.getTime()+dayMs)).slice(0,10)+' '+cutoffTime:today};
  }

  function counts(values) {
    const totals = {pending:0,failed:0,succeeded:0};
    for (const job of values) totals[job.status]++;
    return totals;
  }

  function status(context) {
    const task = current(context);
    if (!task) return null;
    const saved = read(task.key);
    const jobs = saved.ok ? saved.data.jobs.slice().sort((a,b)=>b.endedAt.localeCompare(a.endedAt)) : [];
    const runs = saved.ok ? saved.data.runs : [];
    const active = DQualityModelConfig.active(task.context);
    return {tenantId:task.scope.tenantId,agent:agentStatus(task.context),
      model:active?{id:active.id,version:active.version}:null,nextAt:schedule().nextAt,
      lastRun:runs[0]||null,runs,jobs,...counts(jobs),busy:running.has(task.key),error:saved.error||''};
  }

  function notify() {
    for (const listener of [...listeners]) {
      try { listener(); } catch (_) { /* A view never interrupts a scheduled write. */ }
    }
  }

  function subscribe(listener) {
    listeners.add(listener);
    return ()=>listeners.delete(listener);
  }

  function validCall(call,scope) {
    return call?.tenantId===scope.tenantId && call.brandId===scope.brandId &&
      isText(call.id) && isText(call.callId) && isText(call.seatId) &&
      isTime(call.callAt) && isTime(call.endedAt) && call.callAt<=call.endedAt &&
      (call.duration===null || Number.isFinite(call.duration) && call.duration>=0);
  }

  function createJob(call) {
    const {id,callId,seatId,seatName,accountId,taskId,roundId,endedAt,sourceType,sourceName,callMode} = call;
    return {id,callId,seatId,seatName,accountId,taskId,roundId,endedAt,sourceType,sourceName,callMode,
      attempts:0,status:'pending'};
  }

  function simulatedRatio(callId,itemId) {
    let seed = 0;
    for (const character of callId+'|'+itemId) seed = (Math.imul(seed,31)+character.codePointAt(0))>>>0;
    return 35+seed%66;
  }

  // Simulate the configured application response locally until the real Agent contract is confirmed.
  async function callAgent(application,model,batch,qualityAt) {
    await new Promise(resolve=>window.setTimeout(resolve,180));
    if (application.id==='DEMO-QA-TIMEOUT') return {error:'智能质检 Agent 调用超时，可重试。'};
    if (application.id==='DEMO-QA-EMPTY') return {error:'智能质检 Agent 未返回可用结果，可重试。'};
    const agent = {id:application.id,name:application.name};
    return {rows:batch.map(call=>{
      const shared = {call,agent,model,qualityAt,requestId:requestIdFor(call)};
      const connected = call.connected===true || call.connected!==false && ['已接通','正常接通'].includes(call.contact);
      if (!connected) {
        return {...shared,outcome:'notInspected',reason:call.connected===false || call.contact==='未接通'?
          '通话未接通，Agent 返回无需质检。':'缺少接通结果，Agent 返回无需质检。',items:[]};
      }
      const items = [];
      for (const category of model.categories) {
        const dimensionId = category.catalogId||category.id;
        for (const group of category.groups) {
          const groupId = dimensionId+'/'+(group.catalogId||group.id);
          for (const item of group.items) {
            const id = groupId+'/'+(item.catalogId||item.id);
            const ratio = simulatedRatio(call.callId,id);
            const tier = item.tiers.find(row=>(row.lower===null || ratio>row.lower) &&
              (row.upper===null || ratio<=row.upper));
            const maxScore = category.weight*group.weight*item.weight/10000;
            if (!tier && maxScore>0) return {...shared,error:'细项「'+item.name+'」的模拟比率未命中模型档位，请核对配置后重试。'};
            const passed = !maxScore || tier?.score===100;
            items.push({id,name:item.name,description:item.description,dimensionId,groupId,
              ratio,maxScore,score:Math.min(maxScore,maxScore*(tier?.score||0)/100),passed,appealable:!passed,
              evidenceTime:'',evidence:'Agent 模拟返回比率 '+ratio+'%'+(tier?'，档位分值 '+tier.score+'。':'。')});
          }
        }
      }
      return {...shared,outcome:'inspected',reason:'',items};
    })};
  }

  function agentStillCurrent(task,expected) {
    const state = agentStatus(task.context);
    return current(task.context)?.key===task.key && state.status==='connected' &&
      state.application?.id===expected.id &&
      (state.application.connectionKey || state.application.id)===(expected.connectionKey || expected.id);
  }

  function previousResult(call,context) {
    const prior = window.DQualityInspection?.record?.(call.id,context);
    return prior?.requestId && prior.callId===call.callId && prior.tenantId===call.tenantId &&
      prior.brandId===call.brandId && prior.accountId===call.accountId ? prior : null;
  }

  function indexResponse(rows) {
    const byRequest = new Map();
    if (!Array.isArray(rows)) return byRequest;
    for (const result of rows) {
      const id = result?.requestId;
      if (!isText(id)) continue;
      byRequest.set(id,byRequest.has(id)?null:result);
    }
    return byRequest;
  }

  function verifyResponse(result,call,application,model) {
    return result?.requestId===requestIdFor(call) &&
      callIdentityFields.every(field=>(result.call?.[field]??'')===(call[field]??'')) &&
      result.agent?.id===application.id && result.model?.id===model.id &&
      result.model?.version===model.version;
  }

  function commit(task,saved,values,summary,{scheduledCompleted=false} = {}) {
    try {
      if (current(task.context)?.key!==task.key ||
          localStorage.getItem(task.key)!==saved.original) return fail('租户或质检任务记录已变化，请刷新后重试。');
      const run = {...summary,endedAt:now()};
      localStorage.setItem(task.key,JSON.stringify({version:1,jobs:[...values],
        runs:[run,...saved.data.runs].slice(0,30),
        lastScheduledAt:scheduledCompleted?summary.scheduledAt:saved.data.lastScheduledAt}));
      return {ok:summary.status==='completed' || summary.status==='partial',run,
        ...(summary.status==='blocked' || summary.status==='failed'?{error:summary.message}:{})};
    } catch (_) {
      return fail('质检任务记录尚未保存，请刷新后重试。');
    }
  }

  async function execute(task,trigger,scheduledAt='') {
    const saved = read(task.key);
    if (!saved.ok) return saved;
    if (scheduledAt && saved.data.lastScheduledAt>=scheduledAt) return {ok:true,skipped:true};
    const jobs = new Map(saved.data.jobs.map(job=>[job.id,job]));
    const startedAt = now();
    const metrics = {id:'QA-RUN-'+window.crypto.randomUUID(),trigger,scheduledAt,startedAt,
      status:'completed',collected:0,submitted:0,succeeded:0,failed:0,pending:0,skipped:0,message:'',jobIds:[]};
    const saveRun = (status,message,scheduledCompleted=false) => {
      metrics.pending = metrics.jobIds.filter(id=>jobs.get(id)?.status==='pending').length;
      return commit(task,saved,jobs.values(),{...metrics,status,message},{scheduledCompleted});
    };
    let source;
    try { source = await window.DQualityCallSource?.collect(task.context); }
    catch (_) { return saveRun('failed','通话记录暂时无法读取，可刷新后重试。'); }
    if (current(task.context)?.key!==task.key) return fail('当前租户或质检权限已变化。');
    if (!source?.ok || !Array.isArray(source.calls)) return saveRun('failed',source?.error||'通话记录暂时无法读取。');
    const candidates = new Map();
    for (const call of source.calls) {
      if (validCall(call,task.scope) && (!scheduledAt || call.endedAt<=scheduledAt)) candidates.set(call.id,call);
    }
    metrics.collected = candidates.size;
    const waiting = [];
    let needsAttribution = 0;
    for (const call of candidates.values()) {
      let job = jobs.get(call.id);
      if (trigger==='retry' && job?.status!=='failed') continue;
      const prior = previousResult(call,task.context);
      if (job?.status==='succeeded' || prior) {
        if (job?.status!=='succeeded') {
          jobs.set(call.id,{...createJob(call),...job,
            status:'succeeded',qualityRecordId:prior.id,outcome:prior.inspected?'inspected':'notInspected',error:'',
            reason:prior.notInspectedReason||'',
            requestId:prior.requestId||job?.requestId,
            agentId:prior.agentId||job?.agentId,modelId:prior.modelId||job?.modelId,
            modelVersion:prior.modelVersion??job?.modelVersion,lastAttemptAt:prior.qualityAt||job?.lastAttemptAt});
          metrics.jobIds.push(call.id);
        }
        metrics.skipped++;
        continue;
      }
      job = {...(job || createJob(call)),accountId:call.accountId || ''};
      metrics.jobIds.push(call.id);
      if (isText(call.accountId)) {
        waiting.push(call);
        jobs.set(call.id,job);
      } else {
        needsAttribution++;
        jobs.set(call.id,{...job,status:'pending',error:'尚无法核对原坐席账号，待补充归属后提交。'});
      }
    }
    if (!waiting.length) {
      const message = needsAttribution ? needsAttribution+' 条结束通话待核对坐席归属。' :
        trigger==='retry'?'暂无可重试的质检任务。':'暂无需要提交的已结束通话。';
      return saveRun(needsAttribution ? 'partial' : 'completed',message,Boolean(scheduledAt));
    }
    const blockPending = message => {
      for (const call of waiting) {
        const job = jobs.get(call.id);
        if (job.status==='pending') jobs.set(call.id,{...job,error:message});
      }
      return saveRun('blocked',message);
    };
    const connection = agentStatus(task.context);
    if (connection.status!=='connected' || !isText(connection.application?.id)) {
      return blockPending(connection.message||'请在「智能体关联」配置本租户的智能质检阿里百炼接口。');
    }
    const active = DQualityModelConfig.active(task.context);
    if (!active) return blockPending('当前租户的质检评分规则无法读取。');
    const {id,version,categories} = active;
    const model = {id,version,categories};
    Object.assign(metrics,{agentId:connection.application.id,modelId:id,modelVersion:version});

    for (let offset=0;offset<waiting.length;offset+=batchSize) {
      if (!agentStillCurrent(task,connection.application)) return saveRun('blocked','智能质检 Agent 配置已变化，请重新执行。');
      const batch = waiting.slice(offset,offset+batchSize);
      metrics.submitted += batch.length;
      const response = await callAgent(connection.application,model,batch,now());
      if (!agentStillCurrent(task,connection.application)) return saveRun('blocked','智能质检 Agent 配置已变化，请重新执行。');
      const results = indexResponse(response.rows);
      for (const call of batch) {
        const returned = results.get(requestIdFor(call));
        const job = jobs.get(call.id);
        const attempted = {...job,attempts:job.attempts+1,agentId:connection.application.id,
          modelId:id,modelVersion:version,requestId:requestIdFor(call),lastAttemptAt:now()};
        const matched = verifyResponse(returned,call,connection.application,model);
        let result;
        try {
          if (!response.error && matched && !returned.error) {
            result = window.DQualityInspection?.acceptScheduledResult?.(
              {...returned,call,agent:connection.application,model},task.context
            );
          }
        } catch (_) { result = fail('质检结果暂时无法保存，可重试。'); }
        if (!result?.ok) {
          metrics.failed++;
          jobs.set(call.id,{...attempted,status:'failed',
            error:response.error || (matched && (returned.error || result?.error)) ||
              (matched?'Agent 返回结果暂时无法处理，可重试。':'Agent 返回结果无法与本次提交对应，可重试。')});
          continue;
        }
        metrics.succeeded++;
        jobs.set(call.id,{...attempted,status:'succeeded',qualityRecordId:result.record?.id||call.id,outcome:returned.outcome,
          reason:returned.reason,error:''});
      }
    }
    const status = metrics.failed ? metrics.succeeded?'partial':'failed' : needsAttribution?'partial':'completed';
    const message = '已处理 '+metrics.succeeded+' 条通话' +
      (metrics.failed?'，'+metrics.failed+' 条未能处理，可重试':'') +
      (needsAttribution?'，'+needsAttribution+' 条待核对坐席归属':'')+'。';
    return saveRun(status,message,Boolean(scheduledAt));
  }

  async function start(context,trigger,scheduledAt) {
    const task = current(context);
    if (!task) return fail('当前账号无权执行质检任务。');
    if (running.has(task.key)) return fail('本租户已有质检任务正在执行。');
    running.add(task.key);
    notify();
    try {
      const locks = window.navigator?.locks;
      const work = ()=>execute(task,trigger,scheduledAt);
      return await (locks?.request ? locks.request(task.key,{ifAvailable:true},lock=>
        lock?work():fail('本租户已有质检任务正在执行。')) : work());
    } catch (_) {
      return fail('质检任务执行失败，请刷新后重试。');
    } finally {
      running.delete(task.key);
      notify();
    }
  }

  function run(context,{retryFailedOnly=false} = {}) {
    return start(context,retryFailedOnly?'retry':'manual');
  }

  async function checkDue(context) {
    const task = current(context);
    if (!task || running.has(task.key)) return {ok:true,skipped:true};
    const saved = read(task.key);
    if (!saved.ok) return saved;
    const {dueAt} = schedule();
    if (saved.data.lastScheduledAt>=dueAt || Date.now()-(lastProbe.get(task.key)||0)<checkInterval) {
      return {ok:true,skipped:true};
    }
    lastProbe.set(task.key,Date.now());
    return start(task.context,'scheduled',dueAt);
  }

  window.DQualityInspectionScheduler = Object.freeze({status,run,checkDue,subscribe});
  const auto = ()=>{ void checkDue(); };
  window.DSession?.subscribe?.(()=>window.setTimeout(auto,0));
  window.document?.addEventListener('DOMContentLoaded',auto,{once:true});
  window.document?.addEventListener('visibilitychange',()=>{
    if (window.document.visibilityState==='visible') auto();
  });
  window.setInterval(auto,checkInterval);
})();
