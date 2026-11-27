(() => {
  'use strict';
  const jobs = new Map();
  const demos = new WeakMap();
  const engine = () => window.DLeadRatingRules;
  const choices = schema => (schema?.fields || []).filter(field =>
    window.DReview21DccFollowupFields.fieldKey(field) === 'intentLevel').flatMap(field =>
    (field.options || []).filter(option => option.enabled !== false).map(option =>
      ({id:option.id,fieldId:field.id,value:option.businessKey || option.label || option.id,label:option.label})));
  const current = record => record?.ratingEvaluation?.version===2 &&
    record.ratingEvaluation.request?.roundId === record.roundId ? record.ratingEvaluation : null;
  const pending = record => current(record)?.status === 'pending';
  const assignmentScope = record => ({assignmentRuleId:record?.skynet?.assignmentRuleId || '',
    assignmentRuleVersion:record?.skynet?.assignmentRuleVersion || ''});
  const sameAssignment = (record,scope) => {
    const actual=assignmentScope(record);
    return actual.assignmentRuleId===scope.assignmentRuleId && actual.assignmentRuleVersion===scope.assignmentRuleVersion;
  };
  function normalizedCallMode(value) {
    const mode=typeof value==='string'?value.replace(/\s+/g,'').toLowerCase():'';
    if (['ai','ai外呼','ai会话','ai通话'].includes(mode)) return 'AI 外呼';
    if (['manual','human','人工外呼','人工通话'].includes(mode)) return '人工外呼';
    if (['predictive','预外呼','预测外呼','预外呼通话'].includes(mode)) return '预外呼';
    return '';
  }
  const modeGroup = mode => mode==='AI 外呼'?'ai':['人工外呼','预外呼'].includes(mode)?'human':'';
  function currentCallMode(record) {
    const helper=window.DFieldLinkageWorkbench?.callModeOf;
    if (typeof helper==='function') return helper(record);
    const explicit=record?.callMode || record?.callType;
    if (explicit) return normalizedCallMode(explicit);
    const visit=(record?.followupHistory || []).findLast(item=>item?.roundId===(record.roundId || record.skynet?.roundId));
    return normalizedCallMode(visit?.callMode || visit?.callType || record?.requiredMode || record?.skynet?.processing?.method);
  }
  function originalCallModeScope(record,evaluation,visit) {
    const mode=normalizedCallMode(evaluation?.request?.mode || visit?.callMode || visit?.callType) || currentCallMode(record);
    return {callMode:mode,callModeGroup:modeGroup(mode)};
  }
  const restore = (target,before) => {
    for (const key of Object.keys(target)) if (!Object.hasOwn(before,key)) delete target[key];
    Object.assign(target,before);
  };
  function demo(record,schema,ui) {
    if (!engine()?.readConfig(DSession.context())?.enabled) return '';
    const options = choices(schema);
    const selected = demos.get(record) || {status:'success',value:options.find(option=>option.value==='B')?.value || options[0]?.value || ''};
    const e = ui.esc;
    return '<details class="wb-context-disclosure" data-lead-rule-demo="' + e(record.id) + '"><summary>评级演示工具</summary>' +
      '<p class="wb-meta">仅在本轮正式提交且命中调用条件时使用，本地模拟不连接真实智能体。</p>' +
      '<label>模拟 AI 返回方式<select data-lead-rule-demo-status>' +
      [['success','返回评级'],['failure','调用失败'],['timeout','调用超时'],['empty','未返回评级']].map(([value,label]) =>
        '<option value="' + value + '"' + (value===selected.status?' selected':'') + '>' + label + '</option>').join('') +
      '</select></label><label>模拟 AI 评级<select data-lead-rule-demo-value>' +
      [...options,{value:'INVALID-DEMO',label:'无效评级（不在字典）'}].map(option =>
        '<option value="' + e(option.value) + '"' + (option.value===selected.value?' selected':'') + '>' + e(option.label) + '</option>').join('') +
      '</select></label></details>';
  }
  function bindDemo(root,owned) {
    root.querySelectorAll('[data-lead-rule-demo]').forEach(panel => panel.addEventListener('change',() => {
      const record = owned(panel.dataset.leadRuleDemo);
      if (record) demos.set(record,{status:panel.querySelector('[data-lead-rule-demo-status]').value,
        value:panel.querySelector('[data-lead-rule-demo-value]').value});
    }));
  }
  function card(record,ui) {
    const value = current(record);
    if (!value) return '';
    const e = ui.esc, request = value.request, rule = request.rule;
    const scene = engine()?.fixedScenes.find(item=>item.id===request.sceneId);
    const aiLabels = {pending:'等待返回',success:'已返回',failure:'调用失败',timeout:'调用超时',empty:'未返回评级',invalid:'返回无效评级'};
    const leadCode = record.localLeadCode || record.originalKey || record.id;
    const humanMatch = value.manualMatched ? '命中人工配置' : '未命中人工配置';
    const aiMatch = value.status==='pending' ? '待判断' : value.aiMatched ? '命中 AI 配置' : '未命中 AI 配置';
    const outputLabels = {ai:'采用 AI 返回值',manual:'输出人工实际填写值',fallback:'输出未命中默认值'};
    return '<section class="wb-delivery" aria-label="规则评级结果" data-lead-rule-result><h3>' +
      (value.status==='pending'?'线索评级中':value.historical?'本次评级未应用':'线索评级结果') + '</h3><dl class="wb-dcc-fields">' +
      [['人工填写值',(value.manual || '未填写') + ' · ' + humanMatch],
        ['AI 返回值',(value.aiValue || aiLabels[value.aiStatus] || '等待返回') + ' · ' + aiMatch],
        ['最终输出',value.status==='pending'?'结算中':value.historical?'未应用（历史留存）':value.finalValue || '待核对'],
        ['输出方式',value.historical?'仅保存原回访结果':value.status==='pending'?'等待智能体结果':outputLabels[value.outputSource] || '待核对'],
        ['对应线索',leadCode],['回填状态',value.backfill?.status==='applied'?'已回填意向级别 ' + value.backfill.value:
          value.historical?'未回填当前线索':'等待结算后回填']].map(([label,text]) =>
        '<div><dt>' + e(label) + '</dt><dd>' + e(text) + '</dd></div>').join('') + '</dl>' +
      '<p class="wb-meta">固定条目：' + e(scene?.label || request.sceneId) + '；人工配置 ' + e((rule.manualValues || []).join(' / ') || '无') +
      '；AI 配置 ' + e(rule.aiValues.join(' / ') || '无') + '；未命中默认 ' + e(rule.fallback) + '；v' + e(request.configRevision) + '</p>' +
      '<p class="wb-meta">' + e(value.resumeError || value.reason || '') + '</p>' +
      (value.status==='pending'?'<p class="wb-meta">评级完成后自动继续本轮办理，无需人工确认。</p>':'') +
      (value.resumeError && value.status==='pending'?'<button type="button" class="button secondary" data-lead-rule-retry="' +
        e(record.id) + '">重试评级结算</button>':'') + '</section>';
  }
  function history(value,ui) {
    if (!value?.request) return '';
    const e = ui.esc;
    return '<p class="wb-meta">评级规则 v' + e(value.request.configRevision) + ' · 人工 ' + e(value.manual || '未填写') +
      ' · AI ' + e(value.aiValue || value.aiStatus || '等待返回') + ' · 输出 ' + e(value.finalValue || '结算中') +
      (value.reason?' · ' + e(value.reason):'') + '</p>';
  }
  function hold(record) {
    const evaluation = current(record);
    if (!evaluation || evaluation.status !== 'pending') return;
    evaluation.assignmentRuleScope ||= assignmentScope(record);
    if (!Object.hasOwn(evaluation,'callModeScope')) {
      const visit=(record.followupHistory || []).find(item=>item.visitId===evaluation.request.visitId && item.roundId===evaluation.request.roundId);
      evaluation.callModeScope=originalCallModeScope(record,evaluation,visit);
    }
    evaluation.resume = {taskStatus:record.taskStatus,waitReason:record.waitReason,
      processing:structuredClone(record.skynet?.processing || null)};
    evaluation.simulation = demos.get(record) || {status:'success',value:evaluation.request.allowed.includes('B')?'B':evaluation.request.allowed[0]};
    record.taskStatus = '待处理';
    record.waitReason = '回访已保存，正在按评级规则结算；完成后自动继续本轮办理。';
    if (record.skynet) record.skynet = {...record.skynet,processing:{...record.skynet.processing,
      status:'待处理',destination:'线索评级中',waitingForLeadRating:true,leadRatingRequestId:evaluation.request.id,followupRoundId:record.roundId}};
  }
  function bindRetry(state,root,ui,owned) {
    root.querySelectorAll('[data-lead-rule-retry]').forEach(button=>button.addEventListener('click',()=>{
      const record = owned(button.dataset.leadRuleRetry);
      if (record && ui.canSave?.()!==false) schedule(state,record,root,ui,{retry:true});
    }));
  }
  function schedule(state,record,root,ui,{retry=false}={}) {
    const evaluation = current(record), context = DSession.context();
    if (!pending(record) || !evaluation?.request || !engine()) return;
    const key = [context.account.id,context.scope.id,evaluation.request.id].join('|');
    if (jobs.has(key) || evaluation.resumeError && !retry) return;
    const savedVisit=(record.followupHistory || []).find(visit=>visit.visitId===evaluation.request.visitId);
    const savedScope=savedVisit?.fieldLinkageSnapshot;
    const originalScope=evaluation.assignmentRuleScope || (savedScope?.scopeType==='assignmentRule' || savedScope?.assignmentRuleId ?
      {assignmentRuleId:savedScope.assignmentRuleId || '',assignmentRuleVersion:savedScope.assignmentRuleVersion || ''} : assignmentScope(record));
    const originalMode=evaluation.callModeScope || originalCallModeScope(record,evaluation,savedVisit);
    const job = {recordId:record.id,taskId:record.taskId,ownerId:record.ownerId,request:structuredClone(evaluation.request),
      assignmentRuleScope:structuredClone(originalScope),
      callModeScope:structuredClone(originalMode),
      simulation:structuredClone(evaluation.simulation || {status:'success',value:evaluation.request.allowed[0]}),
      context:[context.account.id,context.scope.id,context.scope.tenant?.brandId],native:root.ownerDocument.defaultView};
    jobs.set(key,job);
    if (retry && evaluation.resumeError) {
      const previousError = evaluation.resumeError;
      delete evaluation.resumeError;
      if (!ui.save('正在重试本轮评级结算。',()=>{evaluation.resumeError=previousError;})) {
        jobs.delete(key);return;
      }
    }
    window.setTimeout(async () => {
      let latestState, before;
      const visible = () => root.isConnected && window.DApp?.currentPage?.()==='PAGE-2202' && latestState===state;
      const failed = message => {
        if (!latestState || !before) return;
        restore(latestState,before);
        const currentRecord = latestState.records.find(item=>item.id===job.recordId && item.taskId===job.taskId);
        if (currentRecord?.ratingEvaluation?.request?.id!==job.request.id) return;
        currentRecord.ratingEvaluation.resumeError=message;
        currentRecord.waitReason=message;
        if (visible()) ui.save(message,()=>restore(latestState,before));
        else if (!window.DReview21.save(latestState)) restore(latestState,before);
      };
      try {
        const sameScope = () => {
          const latest = DSession.context();
          return job.context.every((value,index)=>value === [latest?.account?.id,latest?.scope?.id,latest?.scope?.tenant?.brandId][index]);
        };
        if (!sameScope()) return;
        latestState = await window.DReview21.ensureState({reload:true});
        if (!sameScope() || !latestState || !window.DReview21.isLatest(latestState)) return;
        const latestRecord = latestState.records.find(item=>item.id===job.recordId && item.taskId===job.taskId &&
          item.tenant===job.context[1] && (!item.brandId || item.brandId===job.context[2]));
        if (!latestRecord) return;
        before = structuredClone(latestState);
        const resume = structuredClone(latestRecord.ratingEvaluation?.resume || null);
        const schema = window.DReview21DccFollowupFields.taskForm(latestRecord,job.native,DSession.context());
        const options = choices(schema);
        const visit = latestRecord.followupHistory?.find(item=>item.visitId===job.request.visitId);
        const output = engine().settle(latestRecord,DSession.context(),{
          requestId:job.request.id,roundId:job.request.roundId,visitId:job.request.visitId,factsVersion:job.request.factsVersion,
          value:job.simulation.status==='success'?job.simulation.value:null,status:job.simulation.status,
          raw:job.simulation.status==='success'?{rating:job.simulation.value,simulated:true}:{status:job.simulation.status,simulated:true},
          evidence:visit?.note ? ['本地演示参考：' + visit.note.slice(0,120)] : ['本地演示结果'],
          categoryId:schema?.categoryId,allowed:options.map(option=>option.value),
          historicalOnly:latestRecord.ownerId!==job.ownerId || !sameAssignment(latestRecord,job.assignmentRuleScope) ||
            modeGroup(currentCallMode(latestRecord))!==job.callModeScope.callModeGroup
        });
        if (!output?.ok) {
          failed(output?.error || '评级规则或字段已变化，请核对配置后重试结算。');
          return;
        }
        if (output.applied) {
          const option = options.find(item=>item.value===output.finalValue);
          if (!option || !resume) { failed('本轮评级字段或办理状态无法核对，请核对后重试结算。'); return; }
          // Only new submissions carry this contract. Older pending visits keep
          // their original behavior instead of adopting rules configured later.
          if (visit?.fieldLinkageSnapshot) {
            const linkage = window.DFieldLinkageRules;
            const fieldValues = window.DFieldLinkageWorkbench?.values;
            const categoryId = schema?.categoryId || latestRecord.categoryContext || latestRecord.categoryId ||
              window.DReview21DccFollowupFields?.categoryId?.(latestRecord.category);
            if (!linkage?.validate || !fieldValues || !categoryId || !visit) {
              failed('本轮填写联动规则或字段资料无法核对，评级未回填，请保留原回访后核对。'); return;
            }
            const values = {...fieldValues(schema.fields,visit),...visit.fieldLinkageSnapshot.values};
            values[option.fieldId] = option.id;
            const checked = linkage.validate({context:DSession.context(),categoryId,
              ...assignmentScope(latestRecord),callMode:job.callModeScope.callMode,
              fields:schema.fields,values,snapshot:visit.fieldLinkageSnapshot});
            if (!checked?.ok) {
              const reason = checked?.errors?.map(error=>typeof error==='string'?error:error.message).filter(Boolean).join('；');
              failed('AI 评级未通过填写联动校验，原回访未改写。' + (reason || '请核对规则与当前字段。')); return;
            }
          }
          latestRecord.intentLevel = output.finalValue;
          latestRecord.visitDetails = {...latestRecord.visitDetails,intentLevel:option.label};
          latestRecord.visitOptionValues = {...latestRecord.visitOptionValues,intentLevel:option.id};
          const backfill = {status:'applied',recordId:latestRecord.id,taskId:latestRecord.taskId,
            leadCode:latestRecord.localLeadCode || latestRecord.originalKey || latestRecord.id,
            categoryId:job.request.categoryId,
            fieldId:option.fieldId,optionId:option.id,value:output.finalValue,at:new Date().toISOString()};
          latestRecord.ratingEvaluation.backfill = backfill;
          latestRecord.followupHistory = latestRecord.followupHistory.map(item=>item.visitId===job.request.visitId ?
            {...item,details:{...item.details,intentLevel:output.finalValue},
              ratingEvaluation:{...item.ratingEvaluation,backfill:structuredClone(backfill)}} : item);
          latestRecord.taskStatus = resume.taskStatus;
          latestRecord.waitReason = resume.waitReason;
          if (latestRecord.skynet) {
            latestRecord.skynet = {...latestRecord.skynet,processing:resume.processing};
            const outcome = window.DSkynetIntake.completeRound(latestState,DSession.context(),latestRecord,{nativeWindow:job.native});
            if (!outcome || outcome.error) { failed(outcome?.error || '评级已返回，本轮办理状态需要核对，请重试结算。'); return; }
          }
        } else if (latestRecord.roundId===job.request.roundId &&
            latestRecord.ratingEvaluation?.request?.id===job.request.id &&
            latestRecord.skynet?.processing?.waitingForLeadRating &&
            latestRecord.skynet.processing.leadRatingRequestId===job.request.id &&
            latestRecord.skynet.processing.followupRoundId===job.request.roundId &&
            !latestRecord.skynet.delivery) {
          const {waitingForLeadRating,leadRatingRequestId,...processing} = latestRecord.skynet.processing;
          latestRecord.skynet={...latestRecord.skynet,processing:{...processing,destination:'待处理队列'}};
          latestRecord.waitReason='本轮办理人或回访资料已变化，原评级结果只保留历史，请核对当前任务后继续。';
        }
        if (visible()) ui.save(output.applied?'评级已结算并回填对应线索，已继续本轮办理。':'原回访评级结果已归档。',()=>restore(latestState,before));
        else if (!window.DReview21.save(latestState)) restore(latestState,before);
      } catch (_) {
        failed('本轮评级结算未完成，可在原任务重试。');
        // The saved pending request is recovered when its task is reopened.
      } finally { if (jobs.get(key)===job) jobs.delete(key); }
    },650);
  }
  window.DLeadRatingWorkbench = Object.freeze({choices,current,pending,demo,bindDemo,bindRetry,card,history,hold,schedule});
})();
