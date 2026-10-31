/* Read-only execution arrangement for the four-node local prototype. No provider calls. */
(function(){
  'use strict';
  const copy=v=>JSON.parse(JSON.stringify(v)),stamp=()=>{const c=parent.DSession.context();return c?.account.id+'|'+c?.scope.id;};
  let sceneCache={identity:'',scenes:[]},sceneError='';
  async function prepare(){
    const before=stamp();sceneError='';
    try{const result=await parent.DModuleHost.readWorkflowScenes();if(before!==stamp())throw Error('范围已变化');sceneCache=copy(result);return {ok:true};}
    catch(e){sceneCache={identity:before,scenes:[]};sceneError=e.message;return {ok:false,message:sceneError};}
  }
  function choices(ctx={}){
    const c=parent.DSession.context(),tenantId=ctx.tenantId||c?.scope.id;
    if(c?.scope.kind!=='tenant'||tenantId!==c.scope.id||ctx.brandId&&ctx.brandId!==c.scope.tenant.brandId)return {ok:false,people:[],scenes:[],resources:[],message:'当前租户范围与呼叫安排不一致'};
    const accounts=parent.DOrganization.snapshot().accounts||[],candidates=accounts.filter(a=>a.enabled!==false&&a.memberships?.some(m=>m.tenantId===tenantId&&m.enabled!==false&&['admin','operator','seat'].includes(m.role)&&m.modules?.includes('cloud')&&m.moduleRoles?.cloud!=='reader')).map(a=>({accountId:a.id,id:a.id,name:a.name}));
    const method=ctx.method||ctx.node?.methods?.[0],unavailablePeople=[];
    const people=method==='MANUAL'?candidates.filter(person=>{
      const seats=(window.CloudCallData?.agents||[]).filter(a=>a.accountId===person.accountId&&a.tenantId===tenantId&&String(a.enterpriseId)===String(c.scope.tenant.enterpriseId)&&a.lifecycleStatus!=='已删除');
      const seat=seats.length===1?seats[0]:null,member=accounts.find(a=>a.id===person.accountId)?.memberships?.find(m=>m.tenantId===tenantId),nativeAccount=window.CloudCallData?.accounts?.find(a=>a.accountId===person.accountId);
      let valid=!!seat&&seat.lifecycleStatus==='已启用'&&seat.callEnabled!==false&&!!seat.contactCenterIdentityId&&!!seat.cno&&(!nativeAccount||nativeAccount.status==='启用'),reason=seats.length>1?'坐席绑定不唯一，请先核对':!seat?'尚未关联本租户电话坐席':'坐席未启用或缺少有效电话身份';
      if(valid&&window.SeatPhoneConfig){const config=SeatPhoneConfig.read(seat);if(!config?.ok||!config.value){valid=false;reason='坐席电话参数尚未完整配置';}}
      if(valid&&window.ManualSkillAccess){const access={...(window.AppState?.effectiveAccess?.()||{}),accountId:person.accountId,tenantId,enterpriseId:c.scope.tenant.enterpriseId,roleCode:member?.role==='admin'?'ADMIN':'OPERATOR'};if(!(ManualSkillAccess.numbers(access)||[]).some(n=>/^\d+$/.test(String(n.alictiNumber?.hotline||n.number||'')))){valid=false;reason='尚无本租户可用的人工外呼主叫号码／技能资格';}}
      if(!valid)unavailablePeople.push({...person,reason});
      return valid;
    }):candidates;
    let scenes=[];try{const live=parent.DModuleHost.currentWorkflowScenes();if(live.identity===stamp()){sceneCache=copy(live);sceneError='';}else sceneCache={identity:'',scenes:[]};}catch(e){sceneCache={identity:'',scenes:[]};sceneError=e.message;}
    const requirements=ctx.aiSourceRequirements===undefined?[]:ctx.aiSourceRequirements,keys=['supplierId','tenantId','tagSceneId','tenantType'];
    if(!Array.isArray(requirements)||requirements.some(item=>!item||keys.some(key=>typeof item[key]!=='string'||!item[key])||!Number.isSafeInteger(item.revision)||item.revision<0||item.tagIds!==undefined&&(!Array.isArray(item.tagIds)||item.tagIds.some(id=>typeof id!=='string'||!id)||new Set(item.tagIds).size!==item.tagIds.length)))return {ok:false,people:copy(people),unavailablePeople:copy(unavailablePeople),scenes:[],resources:[],message:'本次呼叫的意向标签条件来源不完整，请核对流程配置'};
    if(sceneCache.identity===stamp())scenes=sceneCache.scenes.filter(scene=>{
      if((ctx.categoryId&&scene.categoryId!==ctx.categoryId)||scene.tenantId!==tenantId||ctx.brandId&&scene.brandId!==ctx.brandId||scene.enabled===false)return false;
      return requirements.every(required=>keys.every(key=>required[key]===scene[key])&&(scene.aiContexts||[]).some(actual=>actual.categoryId===ctx.categoryId&&actual.tenantId===tenantId&&(!ctx.brandId||actual.brandId===ctx.brandId)&&keys.every(key=>actual[key]===required[key])&&actual.revision===required.revision&&Array.isArray(actual.tags)&&actual.tags.length>0&&(required.tagIds||[]).every(id=>actual.tags.some(tag=>tag.id===id))));
    }).map(scene=>({...scene,configurationFingerprint:requirements.length?scene.configurationFingerprint:scene.executionConfigurationFingerprint||scene.configurationFingerprint}));
    if(method==='AI'&&requirements.length&&!scenes.length)sceneError='当前AI场景或标签配置无法满足本节点及后续分支所需的准确标签上下文，请核对实际业务分类、场景和标签配置';
    const resources=(window.BrandLeadStore?.resources?.(method)||[]).filter(r=>{
      const source=(window.CloudCallData?.tasks||[]).find(t=>(t.taskId||t.id)===r.resourceId)||(window.CloudCallData?.callPlans||[]).find(t=>t.callPlanId===r.resourceId)||r;
      return r.tenantId===tenantId&&r.enabled!==false&&!source.autoStartOnAdd&&!source.autoStart&&!source.startOnAssign&&!source.running&&!['RUNNING','running','执行中','运行中','进行中'].includes(source.status);
    });
    return {ok:true,people:copy(people),unavailablePeople:copy(unavailablePeople),scenes:copy(scenes),resources:copy(resources),directoryReady:sceneCache.identity===stamp(),message:method==='AI'&&!scenes.length?(sceneError||'本租户尚无匹配此业务分类的有效AI场景'):''};
  }
  function resolve(ctx={}){
    const available=choices(ctx);if(!available.ok)return available;
    const method=ctx.method||ctx.node?.methods?.[0],accountId=parent.DSession.context()?.account.id;
    let scene=null,resources=available.resources;
    if(method==='AI'){
      scene=available.scenes.find(s=>s.sceneId===String(ctx.aiSceneId||''));
      if(!scene)return {ok:false,message:available.message||'请在导入与分配选定本租户当前有效的AI呼叫场景'};
      // A single existing local executor may run the explicitly selected scene; no task picker is introduced.
      resources=resources.filter(r=>!r.sceneId||String(r.sceneId)===scene.sceneId||r.sceneId===scene.executionSceneId);
    }else if(method==='MANUAL')resources=resources.filter(r=>r.accountId===accountId);
    else if(method!=='PREDICTIVE')return {ok:false,message:'当前节点未明确呼叫方式'};
    if(resources.length!==1)return {ok:false,message:resources.length?'存在多个执行配置，请先在专业配置中明确唯一方案':'本租户没有当前方式可用的执行配置'};
    return {ok:true,resource:copy(resources[0]),...(scene?{sceneSnapshot:copy(scene)}:{})};
  }
  function validateAnswer(ctx={}){
    const c=parent.DSession.context(),seg=ctx.segment,input=ctx.input||{},call=seg?.calls?.find(a=>a.attemptId===input.attemptId);
    if(c?.scope.kind!=='tenant'||seg?.tenantId!==c.scope.id||input.actualAnswerAccountId!==c.account.id||!['MANUAL','PREDICTIVE'].includes(seg?.method)||!call?.dialed||call.tenantId!==seg.tenantId||seg.simulation!==true||call.simulation!==true)return {ok:false,message:'接听结果未准确关联当前本人、原跟进和实际拨打'};
    if(seg.method==='MANUAL'&&seg.assignedAccountId!==c.account.id||seg.actualAnswerAccountId&&seg.actualAnswerAccountId!==c.account.id||call.actualAnswerAccountId&&call.actualAnswerAccountId!==c.account.id)return {ok:false,message:'实际接听身份已固定，不能替换原事实'};
    const seats=(window.CloudCallData?.agents||[]).filter(a=>a.accountId===c.account.id&&a.tenantId===c.scope.id&&String(a.enterpriseId)===String(c.scope.tenant.enterpriseId)&&a.lifecycleStatus!=='已删除');
    if(seats.length!==1||seats[0].lifecycleStatus!=='已启用'||seats[0].callEnabled===false||!seats[0].contactCenterIdentityId||!seats[0].cno)return {ok:false,message:'当前本人没有唯一有效的接听坐席映射'};
    return {ok:true,simulation:true,source:'LOCAL_MOCK_ANSWER',accountId:c.account.id,seatId:seats[0].agentRecordId,attemptId:call.attemptId,followupId:seg.followupId,runId:seg.runId};
  }
  function extraContactFacts(ctx={}){return parent.DModuleHost.readContactExecutionFacts?.(ctx.tenantId,ctx.phone)||{known:false,facts:[],active:[],message:'专业联系事实尚未就绪'};}
  window.DFourNodeExecution={prepare,choices,resolve,validateAnswer,extraContactFacts};
})();
