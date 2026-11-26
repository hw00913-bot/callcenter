(() => {
  'use strict';

  const unavailable = message => ({status:'unavailable',message});
  function binding(context,categoryId) {
    try { return window.DIntegrationApplications?.resolveScenarioBinding(context,'优秀话术',categoryId) || {ok:false}; }
    catch (_) { return {ok:false,message:'优秀话术应用配置暂不可读取。'}; }
  }

  function simulatedScripts(record) {
    const model = String(record.series || record.visitDetails?.series || record.model || '意向车型').slice(0,80);
    return [
      {title:'确认客户需求',content:'您关注'+model+'时，最希望先了解配置、购车预算，还是到店体验？我可以按您的关注点介绍。'},
      {title:'回应车型比较',content:'我们可以围绕您最在意的使用场景对比车型，先确认日常出行人数、使用频率和配置需求，再选择适合的方案。'},
      {title:'约定下一步',content:'如果您希望进一步了解，我可以协助确认门店和可预约时间。您更方便哪一天沟通或到店？'}
    ];
  }

  async function readWorkbench(context,request = {}) {
    const service = window.DSkynetPreRating;
    const record = service?.recordForRequest(context,request);
    if (!record) return unavailable('当前任务或使用范围已变化，请重新选择线索。');
    const categoryId = service.categoryOf(record);
    if (!categoryId) return {status:'unconfigured',message:'当前线索缺少业务分类，无法确定推荐话术来源。'};
    const selected = binding(context,categoryId), application = selected.application;
    if (!selected.ok || !application) return {status:'unconfigured',message:selected.message || '请在业务分类的“场景应用”中关联优秀话术来源。'};
    await new Promise(resolve=>window.setTimeout(resolve,300));
    const latest = service.recordForRequest(context,request);
    if (!latest || service.categoryOf(latest) !== categoryId) return unavailable('当前任务或分类已变化，请重新获取推荐话术。');
    const current = binding(context,categoryId);
    if (!current.ok || current.application?.id !== application.id || current.application.revision !== application.revision ||
        current.application.connectionKey !== application.connectionKey) return unavailable('优秀话术来源配置已变化，请重新查询。');
    const result = application.appId === 'DEMO-EXCELLENT-SCRIPTS-TIMEOUT' ?
      {status:'timeout',message:'推荐话术查询超时，请重新点击查询。'} : {status:'available',items:simulatedScripts(latest)};
    let logged;
    try { logged = window.DIntegrationApplications.recordScenarioCall(context,{
      scenario:'优秀话术',applicationId:application.id,connectionKey:application.connectionKey,operation:'查询优秀话术',
      taskId:request.taskId,roundId:request.roundId,status:result.status,
      message:result.status === 'available' ? '本地模拟返回 '+result.items.length+' 条话术。' : result.message
    }); } catch (_) { /* A missing audit is visible and cannot produce a success result. */ }
    if (!logged?.ok) return unavailable('调用记录未保存，请重新查询优秀话术。');
    return {...result,applicationId:application.id,applicationName:current.application.name,
      applicationRevision:application.revision,connectionKey:application.connectionKey,queriedAt:new Date().toISOString(),simulated:true};
  }

  window.DSkynetExcellentScripts = Object.freeze({readWorkbench});
})();
