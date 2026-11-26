(() => {
  'use strict';

  const sampleResults = new Map([['TW-PRERATING-A','A'],['TW-PRERATING-B','B']]);
  const workbenchSamples = [
    {level:'低',score:45,summary:'购车时间待确认，客户主要询问天籁·鸿蒙座舱相关方案，已有一次跟进。建议下次沟通时确认购车计划。'},
    {level:'中',score:68,summary:'客户正在对比车型配置与价格，愿意继续沟通。建议下一次跟进时提供配置对比和门店信息。'},
    {level:'高',score:87,summary:'客户已明确意向车型，希望近期到店试驾。建议尽快确认门店和可预约时间。'}
  ];
  const text = value => typeof value === 'string' ? value.trim() : '';
  const leadKey = record => text(record.sourceLeadCode) || text(record.originalKey) || record.id;
  const categoryOf = record => text(record?.categoryId || record?.skynet?.categoryId);
  const unavailable = message => ({status:'unavailable',message});

  function access(context,categoryId) {
    if (!text(categoryId)) return {ok:false,message:'当前线索缺少业务分类，无法确定预评分应用。'};
    try { return window.DIntegrationApplications?.resolveScenarioBinding(context,'预评分',categoryId) || {ok:false}; }
    catch (_) { return {ok:false,message:'预评分应用配置暂不可读取。'}; }
  }

  function audit(context,application,request,result) {
    try {
      return window.DIntegrationApplications?.recordScenarioCall(context,{
        scenario:'预评分',applicationId:application.id,connectionKey:application.connectionKey,
        operation:'查询预评分',taskId:request.taskId,roundId:request.roundId,status:result.status,
        message:result.status === 'available' ? '本地模拟预评分查询完成。' : result.message || '本次未取得预评分。'
      })?.ok === true;
    } catch (_) { return false; }
  }

  function query(context, request = {}) {
    const selected = access(context,request.categoryId);
    const application = selected.application;
    if (!selected.ok || !application || application.id !== request.applicationId ||
        application.connectionKey !== request.connectionKey || application.revision !== request.revision) {
      return unavailable(selected.message || '预评分应用关联已变化，请重新核对业务分类配置。');
    }
    const value = sampleResults.get(request.leadId);
    const result = request.leadId === 'TW-PRERATING-TIMEOUT' ? {status:'timeout',message:'预评分查询超时。'} :
      value ? {status:'available',value} : {status:'missing',message:'预评分系统未返回该线索的结果。'};
    if (!audit(context,application,request,result)) return unavailable('调用记录未保存，请重新查询预评分。');
    return {...result,applicationId:application.id,applicationName:application.name,
      applicationRevision:application.revision,connectionKey:application.connectionKey,queriedAt:new Date().toISOString(),simulated:true};
  }

  function recordForRequest(context,request) {
    const session = window.DSession;
    const current = session.context();
    if (!current?.account?.id || current.account.id !== context?.account?.id || current.scope.kind !== 'tenant' ||
        current.scope.id !== context?.scope?.id || current.scope.tenant?.brandId !== context.scope.tenant?.brandId ||
        window.DApp.currentPage() !== 'PAGE-2202' || !session.allowed('PAGE-2202',current) || !session.can('F37',current)) return null;
    const state = window.DReview21?.state?.({reload:true});
    if (state?.tenant !== current.scope.id || !state.seatId || !request.recordId || !request.taskId) return null;
    const seat = state.seats?.find(item => item.id === state.seatId && item.accountId === current.account.id &&
      item.tenant === state.tenant && item.enabled && item.bindingState === '已关联');
    if (!seat) return null;
    const matches = state.records.filter(record => record.id === request.recordId && record.taskId === request.taskId &&
      text(record.roundId || record.skynet?.roundId) === text(request.roundId) && record.ownerId === seat.id &&
      record.tenant === state.tenant && (!record.brandId || record.brandId === current.scope.tenant.brandId));
    return matches.length === 1 ? matches[0] : null;
  }

  function simulatedWorkbenchResult(record) {
    const lead = leadKey(record);
    const sample = record.sourceApplicationId === 'WORKBENCH-DEMO' && /^工作台模拟线索 0([1-3])$/.exec(record.name);
    if (sample) return workbenchSamples[Number(sample[1])-1];
    if (sampleResults.has(lead)) return workbenchSamples[sampleResults.get(lead) === 'A' ? 2 : 1];
    let bucket = 0;
    for (const character of lead) bucket = (bucket * 31 + character.codePointAt(0)) % workbenchSamples.length;
    return workbenchSamples[bucket];
  }

  async function readWorkbench(context,{recordId,taskId,roundId} = {}) {
    const request = {recordId,taskId,roundId};
    const invalidTask = unavailable('当前任务或使用范围已变化，请重新选择线索。');
    const record = recordForRequest(context,request);
    if (!record) return invalidTask;
    const categoryId = categoryOf(record);
    const selected = access(context,categoryId);
    if (!selected.ok || !selected.application) return {status:'unconfigured',message:selected.message || '请在业务分类的“场景应用”中关联预评分来源。'};
    const lead = leadKey(record), application = selected.application;
    await new Promise(resolve => window.setTimeout(resolve,300));
    const latest = recordForRequest(context,request);
    if (!latest || leadKey(latest) !== lead || categoryOf(latest) !== categoryId) return invalidTask;
    const current = access(context,categoryId);
    if (!current.ok || current.application?.id !== application.id ||
        current.application.connectionKey !== application.connectionKey || current.application.revision !== application.revision) {
      return unavailable('预评分应用配置已变化，请重新点击智能预评。');
    }
    const result = lead === 'TW-PRERATING-TIMEOUT' || application.appId === 'DEMO-PRE-RATING-TIMEOUT' ?
      {status:'timeout',message:'预评分查询超时，请重新点击智能预评。'} : application.appId === 'DEMO-PRE-RATING-UNAVAILABLE' ?
      unavailable('预评分系统暂不可用，请稍后重试。') : {status:'available',...simulatedWorkbenchResult(latest)};
    if (!audit(context,application,request,result)) return unavailable('调用记录未保存，请重新查询预评分。');
    return {...result,applicationName:current.application.name,applicationId:application.id,applicationRevision:application.revision,
      connectionKey:application.connectionKey,queriedAt:new Date().toISOString(),simulated:true};
  }

  window.DSkynetPreRating = Object.freeze({query,readWorkbench,recordForRequest,categoryOf});
})();
