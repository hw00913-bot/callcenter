(() => {
  'use strict';

  const pending = new Map();
  const rows = value => Array.isArray(value) ? value : [];
  const text = value => typeof value==='string' ? value.trim() : '';
  const number = value => {
    const normalized = text(value).replace(/[\s()-]/g,'').replace(/^(?:\+?86|0086)(?=1[3-9]\d{9}$)/,'');
    return /^\d{7,15}$/.test(normalized) ? normalized : '';
  };
  const marker = context => JSON.stringify([context?.account?.id,context?.scope?.id,context?.scope?.tenant?.brandId]);
  const keyFor = (tenant,brand) => DSession.prefix+'task-call-analysis-v1:'+encodeURIComponent(brand)+':'+encodeURIComponent(tenant);

  function scope(state,task,context) {
    const current = DSession.context();
    const tenant = current?.scope?.id, brand = current?.scope?.tenant?.brandId;
    if (!tenant || !brand || marker(context)!==marker(current) || state?.tenant!==tenant || task?.tenant!==tenant ||
        task.brandId && task.brandId!==brand || !task.taskId || !state.records?.includes(task) ||
        !DSession.allowed('PAGE-2202',current) || !DSession.can('F37',current)) return null;
    const seat = rows(state.seats).find(row=>row.id===state.seatId && row.id===task.ownerId &&
      row.accountId===current.account.id && row.tenant===tenant && (!row.brandId || row.brandId===brand));
    return seat ? {tenant,brand,account:seat.accountId,seatId:seat.id,key:keyFor(tenant,brand),context:current} : null;
  }

  function read(key) {
    const original = localStorage.getItem(key);
    const data = original===null ? {version:1,rows:[]} : JSON.parse(original);
    if (data?.version!==1 || !Array.isArray(data.rows)) throw Error('通话分析记录暂时无法读取。');
    return {original,rows:data.rows};
  }

  function callsFor(state,task,access) {
    return rows(state.qualityCallAttempts).filter(call=>call?.tenantId===access.tenant && call.brandId===access.brand &&
      call.taskId===task.taskId && text(call.accountId) && text(call.callId) && text(call.endedAt));
  }

  const tagsOf = value => (Array.isArray(value) ? value : typeof value==='string' ? value.split(/[、，,]/) : [])
    .map(tag=>text(typeof tag==='object' ? tag?.value || tag?.label || tag?.name : tag)).filter(Boolean);

  function payload(state,task,call,access,native,analyses) {
    const phone = number(task.phone) || number(task.customerPhone);
    const matches = rows(state.records).filter(row=>row.tenant===access.tenant && (!row.brandId || row.brandId===access.brand) &&
      (row===task || phone && (number(row.phone) || number(row.customerPhone))===phone));
    const calls = rows(state.qualityCallAttempts).filter(row=>row?.tenantId===access.tenant &&
      row.brandId===access.brand && row.endedAt<=call.endedAt);
    const history = [];
    for (const row of matches) {
      for (const finished of calls.filter(item=>item.taskId===row.taskId)) {
        if (finished.callId===call.callId) continue;
        const visit = rows(row.followupHistory).find(item=>(item.qualityCallId || item.callId)===finished.callId);
        const analysis = analyses.find(item=>item?.status==='available' && item.callId===finished.callId &&
          item.taskId===finished.taskId && item.roundId===finished.roundId);
        history.push({callId:finished.callId,taskId:row.taskId,roundId:finished.roundId,endedAt:finished.endedAt,
          tags:[...new Set([...tagsOf(finished.tags),...tagsOf(analysis?.tags)])],
          summary:text(analysis?.summary || finished.summary || visit?.note),fields:visit?.details || {}});
      }
      for (const visit of rows(row.followupHistory)) {
        if (visit.wecom || !(visit.callMode || visit.callType) || visit.qualityCallId || !visit.roundId || visit.roundId===call.roundId ||
            calls.some(item=>item.taskId===row.taskId && item.roundId===visit.roundId)) continue;
        history.push({callId:visit.callId || '',taskId:row.taskId,roundId:visit.roundId,endedAt:visit.at,
          tags:tagsOf(visit.tags),summary:text(visit.summary || visit.note),fields:visit.details || {}});
      }
    }
    if (phone && marker(native?.DNativeContext?.context)===marker(access.context)) {
      for (const item of rows(native?.CloudCallData?.calls)) {
        const ended = item?.endedAt || item?.endTime;
        const id = text(item?.callId);
        if (!ended || !id || id===call.callId || item.tenantId!==access.tenant ||
            item.brandId && item.brandId!==access.brand || number(item.callee || item.customerPhone)!==phone ||
            history.some(row=>row.callId===id)) continue;
        history.push({callId:id,taskId:item.taskId,roundId:item.roundId,endedAt:ended,
          tags:tagsOf(item.tags || item.labels),summary:text(item.summary || item.followupNote || item.dispositionRemark),
          fields:item.visitDetails || item.followupDetails || {}});
      }
    }
    return {call,taskCalls:calls.filter(item=>item.taskId===task.taskId),history};
  }

  async function simulate(application,request) {
    await new Promise(resolve=>window.setTimeout(resolve,220));
    if (application.id==='DEMO-ANALYSIS-TIMEOUT') return {status:'timeout'};
    if (application.id==='DEMO-ANALYSIS-EMPTY') return {status:'unavailable'};
    const contact = text(request.call.contact) || '接触状态待核对';
    return {status:'available',tags:[...new Set([contact,...tagsOf(request.call.tags)])],
      summary:'【模拟】本次'+contact+'，已对照当前任务 '+request.taskCalls.length+' 条通话和同手机号 '+request.history.length+' 条历史资料。',
      taskCallCount:request.taskCalls.length,historyCount:request.history.length};
  }

  function list(state,task,context) {
    const access = scope(state,task,context);
    if (!access) return [];
    let saved = [];
    try { saved = read(access.key).rows; } catch (_) { /* Existing records are kept for recovery. */ }
    return callsFor(state,task,access).slice().reverse().map(call=>{
      const result = saved.find(row=>row && row.callId===call.callId && row.taskId===task.taskId &&
        row.roundId===call.roundId && row.accountId===call.accountId);
      return {call,result:result || {status:pending.has(access.key+'|'+call.callId)?'pending':
        call.accountId===access.account?'notStarted':'unavailable'}};
    });
  }

  async function analyze(state,task,call,context,native) {
    const access = scope(state,task,context);
    if (!access || !call || call.accountId!==access.account || !callsFor(state,task,access).includes(call)) return;
    const token = access.key+'|'+call.callId;
    if (pending.has(token)) return pending.get(token);
    const action = (async()=>{
      try {
        const existing = read(access.key).rows;
        if (existing.some(row=>row?.callId===call.callId)) return;
        const configured = DIntegrationApplications.status(access.context,'callAnalysis');
        const application = configured.application;
        const result = configured.status==='connected' ? await simulate(application,payload(state,task,call,access,native,existing)) :
          {status:'unconfigured'};
        if (!scope(state,task,context) || !window.DReview21.isLatest(state)) return;
        const latest = DIntegrationApplications.status(access.context,'callAnalysis');
        if (latest.status!==configured.status || latest.application?.id!==application?.id ||
            (latest.application?.connectionKey || latest.application?.id)!==(application?.connectionKey || application?.id)) return;
        const saved = read(access.key);
        if (saved.rows.some(row=>row?.callId===call.callId) || localStorage.getItem(access.key)!==saved.original) return;
        const entry = {...result,applicationId:application?.id,connectionKey:application?.connectionKey || application?.id,callId:call.callId,taskId:task.taskId,
          roundId:call.roundId,accountId:access.account,completedAt:new Date().toISOString()};
        localStorage.setItem(access.key,JSON.stringify({version:1,rows:[...saved.rows,entry]}));
      } catch (_) { /* Unavailable results never interrupt the seat's work. */ }
    })();
    pending.set(token,action);
    try { await action; } finally { pending.delete(token); }
  }

  window.DSkynetCallAnalysis = Object.freeze({list,analyze});
})();
