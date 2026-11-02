/* Read-only execution arrangement for the four-node local prototype. No provider calls. */
(function(){
  'use strict';
  const copy=v=>JSON.parse(JSON.stringify(v)),stamp=()=>{const c=parent.DSession.context();return c?.account.id+'|'+c?.scope.id;};
  let sceneCache={identity:'',scenes:[]},sceneError='',taskCache={identity:'',tasks:[]};
  const sceneSource=scene=>(window.DAISceneImportSource||parent.DAISceneImportSource)?.mode?.(scene)||'UNKNOWN';
  const requiredSceneEntry=ctx=>(window.DAISceneImportSource||parent.DAISceneImportSource)?.forHandlingMode?.(ctx.handlingMode)||'UNKNOWN';
  const sceneEligible=(scene,entry)=>(window.DAISceneImportSource||parent.DAISceneImportSource)?.eligibleForEntry?.(scene,entry)===true;
  async function prepare(){
    const before=stamp();sceneError='';
    try{const [result,tasks]=await Promise.all([parent.DModuleHost.readWorkflowScenes(),parent.DModuleHost.readWorkflowTasks?.()]);if(before!==stamp())throw Error('范围已变化');sceneCache=copy(result);taskCache=tasks?copy(tasks):{identity:before,tasks:[]};return {ok:true};}
    catch(e){sceneCache={identity:before,scenes:[]};taskCache={identity:before,tasks:[]};sceneError=e.message;return {ok:false,message:sceneError};}
  }
  function taskUsable(row){return row.enabled!==false&&!row.autoStartOnAdd&&!row.autoStart&&!row.startOnAssign&&!row.running&&!row.alictiTaskControlPending&&!row.pendingRequestId&&!['RUNNING','running','执行中','运行中','进行中','已完成','已结束','已终止','已删除','草稿','创建中','待核','unknown'].includes(row.status);}
  function aiTaskUsable(row){
    if(!Object.hasOwn(row,'taskStatusCode'))return taskUsable(row);
    return Number.isSafeInteger(row.taskStatusCode)&&[1,3,6].includes(row.taskStatusCode)&&taskUsable({...row,status:row.taskStatusCode===3?'已暂停':'待启动'});
  }
  function taskDirectSnapshot(ctx){
    const r=ctx.record,a=r?.arrangement,s=r?.taskImportSource,e=r?.entrySource;
    return ctx.method==='AI'&&ctx.handlingMode==='DIRECT'&&r?.handlingMode==='DIRECT'&&r.directMethod==='AI'&&e?.schema===1&&e.kind==='TASK'&&s?.schema===2&&s.method==='AI'&&a?.arrangementSchema===2&&s.tenantId===ctx.tenantId&&r.ownerTenantId===ctx.tenantId&&s.brandId===ctx.brandId&&r.brandId===ctx.brandId&&s.categoryId===ctx.categoryId&&r.categoryId===ctx.categoryId&&s.importChannel===e.importChannel&&s.taskId===a.resourceId&&s.taskId===ctx.resourceId&&String(s.aiSceneId)===String(a.aiSceneId)&&a.method==='AI'&&a.tenantId===ctx.tenantId?a:null;
  }
  function executionScene(scene,ctx={},requirements=[]){
    let configurationFingerprint=requirements.length?scene.configurationFingerprint:scene.executionConfigurationFingerprint||scene.configurationFingerprint;
    const captured=taskDirectSnapshot(ctx)?.sceneSnapshot;
    if(!requirements.length&&captured&&String(captured.id||captured.sceneId)===String(scene.id||scene.sceneId)&&['tenantId','brandId','categoryId','platform','professionalTaskId','dataImportSource','importType'].every(key=>captured[key]===scene[key])&&captured.executionConfigurationFingerprint===scene.executionConfigurationFingerprint&&captured.configurationFingerprint===scene.configurationFingerprint){
      // Previously captured TASK imports used this exact complete wrapper. Keep
      // that representation only when both current configuration parts still match.
      try{const value=JSON.parse(scene.configurationFingerprint);if(value&&!Array.isArray(value)&&Object.keys(value).length===2&&Object.hasOwn(value,'executionConfigurationFingerprint')&&Object.hasOwn(value,'aiContexts')&&typeof value.executionConfigurationFingerprint==='string'&&value.executionConfigurationFingerprint===scene.executionConfigurationFingerprint&&JSON.stringify(value.aiContexts)===JSON.stringify(scene.aiContexts||[])&&JSON.stringify(captured.aiContexts||[])===JSON.stringify(scene.aiContexts||[]))configurationFingerprint=captured.configurationFingerprint;}catch(_){}
    }
    return {...scene,configurationFingerprint};
  }
  const aiTaskBasisKeys=new Set(['taskId','remoteTaskId','platform','status','taskStatusCode','taskStatus','remoteStatus','statusType','dataImportSource','importType','sceneId','categoryId','tenantId','brandId','revision','updatedAt','autoStart','importEligibility']);
  const taskConfigurationPrefix='AI-TASK-CONFIG-1:';
  function taskConfiguration(task){
    const raw=task?.configurationFingerprint;if(typeof raw!=='string'||!raw)return null;
    try{const value=JSON.parse(raw.startsWith(taskConfigurationPrefix)?raw.slice(taskConfigurationPrefix.length):raw),id=String(task.taskId||task.resourceId||'');
      if(!value||Array.isArray(value)||Object.keys(value).some(key=>!aiTaskBasisKeys.has(key)||key!=='importEligibility'&&value[key]!==null&&typeof value[key]==='object')||String(value.taskId)!==id||value.tenantId!==task.tenantId||value.platform!==task.platform||!['MANUAL','AUTO'].includes(value.dataImportSource))return null;
      if(Object.hasOwn(value,'importEligibility')){const proof=value.importEligibility;if(!proof||Array.isArray(proof)||Object.keys(proof).some(key=>!['known','allowed','reason'].includes(key))||proof.known!==true||proof.allowed!==true||proof.reason!=='')return null;}
      const configuration=Object.fromEntries(Object.keys(value).filter(key=>key!=='importEligibility').sort().map(key=>[key,value[key]]));return taskConfigurationPrefix+JSON.stringify(configuration);
    }catch(_){return null;}
  }
  function executionAITask(task,ctx={}){
    const canonical=taskConfiguration(task);if(!canonical)return {...task};let configurationFingerprint=canonical;
    const previous=taskDirectSnapshot(ctx)?.resourceSnapshot;
    if(previous&&String(previous.resourceId||previous.taskId)===String(task.resourceId||task.taskId)&&previous.tenantId===task.tenantId&&previous.platform===task.platform&&taskConfiguration(previous)===canonical)configurationFingerprint=previous.configurationFingerprint;
    return {...task,configurationFingerprint};
  }
  function predictiveCategory(row,brandId){
    const normalize=window.DUnifiedCategories?.canonical||parent.DUnifiedCategories?.canonical||window.CustomerBusiness?.canonicalType||((id)=>id),raw=[row.categoryId,row.unifiedCategoryId].filter(value=>value!==undefined&&value!==null&&value!=='');
    if(raw.some(value=>typeof value!=='string'||!value.trim()||value.trim().length>160))return {ok:false,message:'预外呼任务的业务分类格式待核'};
    const ids=[...new Set(raw.map(value=>normalize(value.trim())))];if(ids.length>1||ids.some(value=>typeof value!=='string'||!value))return {ok:false,message:'预外呼任务的业务分类配置冲突'};
    const brands=[row.brandId,row.unifiedCategoryBrandId].filter(value=>value!==undefined&&value!==null&&value!=='');if(brands.some(value=>typeof value!=='string'||!brandId||value!==brandId))return {ok:false,message:'预外呼任务的业务分类品牌与当前业务不一致'};
    return {ok:true,categoryId:ids[0]||'',brandId:brandId||'',rawCategoryId:row.categoryId??null,rawUnifiedCategoryId:row.unifiedCategoryId??null,unifiedCategoryBrandId:row.unifiedCategoryBrandId??null};
  }
  function predictiveCategoryMatches(info,categoryId){const normalize=window.DUnifiedCategories?.canonical||parent.DUnifiedCategories?.canonical||window.CustomerBusiness?.canonicalType||((id)=>id);return info.ok===true&&(!info.categoryId||typeof categoryId==='string'&&info.categoryId===normalize(categoryId.trim()));}
  function predictiveTasks(tenantId,enterpriseId,importChannel){
    const rows=[...(window.CloudCallData?.predictiveTasks||[]),...(window.CloudCallData?.tasks||[])],unique=new Map(),expected=importChannel==='API'?'api':importChannel==='MANUAL'?'manual':'',brandId=parent.DSession.context()?.scope.tenant?.brandId;
    for(const row of rows){
      if(!row.taskId||unique.has(String(row.taskId))||row.tenantId!==tenantId||String(row.enterpriseId)!==String(enterpriseId)||row.callType!=='预外呼'||!['待分配客户','待启动','已暂停'].includes(row.status)||!taskUsable(row)||row.alictiTaskUpdatePending||Number(row.providerStatusCode)===3)continue;
      const nativeSource=row.dccImportSource;
      if(nativeSource&&!['manual','api'].includes(nativeSource)||row.dccManaged===true&&(row.dccSourceLocked!==true||!['manual','api'].includes(nativeSource)))continue;
      if(expected==='api'&&nativeSource!=='api'||expected==='manual'&&nativeSource==='api')continue;
      const sourceGuard=window.DccRuntime?.guardTaskUpdate?.(row);if(sourceGuard?.ok===false)continue;
      if(row.status==='待分配客户'&&nativeSource!=='api'){
        const reason=window.CloudTaskWorkspace?.customerImportReason?.(row);if(reason!=='')continue;
      }
      const config=row.executionConfig||row.planSnapshot||(window.CloudCallData?.callPlans||[]).find(plan=>plan.callPlanId===(row.planId||row.callPlanId)&&plan.tenantId===tenantId&&String(plan.enterpriseId)===String(enterpriseId));
      if(!config||window.CloudResourceRules?.validatePlan?.(config,true)||window.AppState?.authorizeObject?.('task.create',row)===false)continue;
      const category=predictiveCategory(row,brandId);if(!category.ok)continue;
      const actualChannel=nativeSource==='api'?'API':'MANUAL';
      unique.set(String(row.taskId),{resourceId:String(row.taskId),taskId:String(row.taskId),kind:'TASK',type:'TASK',name:row.name||row.taskId,tenantId,enterpriseId,brandId:category.brandId,categoryId:category.categoryId,method:'PREDICTIVE',status:row.status,planId:row.planId||row.callPlanId||config.callPlanId||'',configurationRevision:row._localTaskRevision||0,configurationFingerprint:JSON.stringify({taskId:String(row.taskId),tenantId,enterpriseId,category,config,status:row.status,revision:row._localTaskRevision??null,source:nativeSource??null,sourceLocked:row.dccSourceLocked??null}),scheduleAt:row.scheduleAt||'',enabled:true,importChannel:actualChannel,dataImportSource:actualChannel==='API'?'AUTO':'MANUAL',...(row.provider?{provider:row.provider}:{}),...(row.platform?{platform:row.platform}:{})});
    }return [...unique.values()];
  }
  function taskImportUsable(task){return task?.enabled!==false&&task?.importEligibility?.known===true&&task.importEligibility.allowed===true;}
  function taskMatchesScene(task,scene){
    if(!scene)return true;
    if(scene.professionalTaskId&&String(task.remoteTaskId||'')!==String(scene.professionalTaskId))return false;
    if(task.categoryId&&task.categoryId!==scene.categoryId)return false;
    if(task.sceneId&&![''+scene.id,''+scene.sceneId,''+scene.executionSceneId].includes(''+task.sceneId))return false;
    if(task.platform&&scene.platform&&String(task.platform)!==String(scene.platform))return false;
    if(task.supplierId&&scene.supplierId&&String(task.supplierId)!==String(scene.supplierId))return false;
    return true;
  }
  function taskImportSceneDirectory(rows,task){
    const remote=String(task.remoteTaskId||''),source=sceneSource(task),sameRemote=scene=>!!remote&&[scene.professionalTaskId,scene.executionSceneId].filter(Boolean).map(String).includes(remote),exact=rows.filter(sameRemote);
    return rows.map(scene=>{
      if(sceneSource(scene)!=='UNKNOWN'||scene.sourceConfigurationState!=='ABSENT'||!([undefined,null,''].includes(scene.importType))||!([undefined,null,'','UNKNOWN'].includes(scene.dataImportSource))||exact.length!==1||exact[0]!==scene||!['MANUAL','AUTO'].includes(source)||!taskImportUsable(task)||String(task.sceneId||'')!==String(scene.sceneId||scene.id)||!task.configurationFingerprint)return scene;
      const sourceResolution={authority:'TASK_SOURCE',taskId:String(task.taskId||task.resourceId),sceneId:String(scene.sceneId||scene.id),remoteTaskId:remote,configurationFingerprint:task.configurationFingerprint};
      return {...copy(scene),dataImportSource:source,importType:task.importType,sourceResolution,executionConfigurationFingerprint:JSON.stringify([scene.executionConfigurationFingerprint||'',sourceResolution]),configurationFingerprint:JSON.stringify([scene.configurationFingerprint||scene.executionConfigurationFingerprint||'',sourceResolution])};
    });
  }
  function choices(ctx={}){
    const c=parent.DSession.context(),tenantId=ctx.tenantId||c?.scope.id;
    if(c?.scope.kind!=='tenant'||tenantId!==c.scope.id||ctx.brandId&&ctx.brandId!==c.scope.tenant.brandId)return {ok:false,people:[],scenes:[],resources:[],message:'当前租户范围与呼叫安排不一致'};
    const accounts=parent.DOrganization.snapshot().accounts||[],candidates=accounts.filter(a=>a.enabled!==false&&a.memberships?.some(m=>m.tenantId===tenantId&&m.enabled!==false&&['admin','operator','seat'].includes(m.role)&&m.modules?.includes('cloud')&&m.moduleRoles?.cloud!=='reader')).map(a=>({accountId:a.id,id:a.id,name:a.name}));
    const method=ctx.method||ctx.node?.methods?.[0],unavailablePeople=[],entry=requiredSceneEntry(ctx);
    if(method==='AI'&&!['TEMPLATE','DIRECT'].includes(entry))return {ok:false,people:[],unavailablePeople:[],scenes:[],resources:[],legacyResources:[],message:'请先明确按模板流转或直接跟进，再选择对应导入方式的AI场景'};
    const people=method==='MANUAL'?candidates.filter(person=>{
      const seats=(window.CloudCallData?.agents||[]).filter(a=>a.accountId===person.accountId&&a.tenantId===tenantId&&String(a.enterpriseId)===String(c.scope.tenant.enterpriseId)&&a.lifecycleStatus!=='已删除');
      const seat=seats.length===1?seats[0]:null,member=accounts.find(a=>a.id===person.accountId)?.memberships?.find(m=>m.tenantId===tenantId),nativeAccount=window.CloudCallData?.accounts?.find(a=>a.accountId===person.accountId);
      let valid=!!seat&&seat.lifecycleStatus==='已启用'&&seat.callEnabled!==false&&!!seat.contactCenterIdentityId&&!!seat.cno&&(!nativeAccount||nativeAccount.status==='启用'),reason=seats.length>1?'坐席绑定不唯一，请先核对':!seat?'尚未关联本租户电话坐席':'坐席未启用或缺少有效电话身份';
      if(valid&&window.SeatPhoneConfig){const config=SeatPhoneConfig.read(seat);if(!config?.ok||!config.value){valid=false;reason='坐席电话参数尚未完整配置';}}
      if(valid&&window.ManualSkillAccess){const access={...(window.AppState?.effectiveAccess?.()||{}),accountId:person.accountId,tenantId,enterpriseId:c.scope.tenant.enterpriseId,roleCode:member?.role==='admin'?'ADMIN':'OPERATOR'};if(!(ManualSkillAccess.numbers(access)||[]).some(n=>/^\d+$/.test(String(n.alictiNumber?.hotline||n.number||'')))){valid=false;reason='尚无本租户可用的人工外呼主叫号码／技能资格';}}
      if(!valid)unavailablePeople.push({...person,reason});
      return valid;
    }):candidates;
    let scenes=[];try{const live=parent.DModuleHost.currentWorkflowScenes({entry});if(live.identity===stamp()){sceneCache=copy(live);sceneError='';}else sceneCache={identity:'',scenes:[]};}catch(e){sceneCache={identity:'',scenes:[]};sceneError=e.message;}
    const requirements=ctx.aiSourceRequirements===undefined?[]:ctx.aiSourceRequirements,keys=['supplierId','tenantId','tagSceneId','tenantType'];
    if(!Array.isArray(requirements)||requirements.some(item=>!item||keys.some(key=>typeof item[key]!=='string'||!item[key])||!Number.isSafeInteger(item.revision)||item.revision<0||item.tagIds!==undefined&&(!Array.isArray(item.tagIds)||item.tagIds.some(id=>typeof id!=='string'||!id)||new Set(item.tagIds).size!==item.tagIds.length)))return {ok:false,people:copy(people),unavailablePeople:copy(unavailablePeople),scenes:[],resources:[],message:'本次呼叫的意向标签条件来源不完整，请核对流程配置'};
    if(sceneCache.identity===stamp())scenes=sceneCache.scenes.filter(scene=>{
      if(!sceneEligible(scene,entry)||(ctx.categoryId&&scene.categoryId!==ctx.categoryId)||scene.tenantId!==tenantId||ctx.brandId&&scene.brandId!==ctx.brandId||scene.enabled===false)return false;
      return requirements.every(required=>keys.every(key=>required[key]===scene[key])&&(scene.aiContexts||[]).some(actual=>actual.categoryId===ctx.categoryId&&actual.tenantId===tenantId&&(!ctx.brandId||actual.brandId===ctx.brandId)&&keys.every(key=>actual[key]===required[key])&&actual.revision===required.revision&&Array.isArray(actual.tags)&&actual.tags.length>0&&(required.tagIds||[]).every(id=>actual.tags.some(tag=>tag.id===id))));
    }).map(scene=>executionScene(scene,ctx,requirements));
    if(method==='AI'&&requirements.length&&!scenes.length)sceneError='当前AI场景或标签配置无法满足本节点及后续分支所需的准确标签上下文，请核对实际业务分类、场景和标签配置';
    const legacyResources=(window.BrandLeadStore?.resources?.(method)||[]).flatMap(r=>{
      const source=(window.CloudCallData?.tasks||[]).find(t=>(t.taskId||t.id)===r.resourceId)||(window.CloudCallData?.callPlans||[]).find(t=>t.callPlanId===r.resourceId)||r;
      if(!(r.tenantId===tenantId&&r.enabled!==false&&!source.autoStartOnAdd&&!source.autoStart&&!source.startOnAssign&&!source.running&&!['RUNNING','running','执行中','运行中','进行中'].includes(source.status)))return [];
      if(method==='PREDICTIVE'){const category=predictiveCategory(source,c.scope.tenant.brandId);if(!predictiveCategoryMatches(category,ctx.categoryId))return [];return [{...r,categoryId:category.categoryId,brandId:category.brandId,configurationFingerprint:JSON.stringify({resource:r,category})}];}return [r];
    });
    let resources=[];
    // Assignment authority does not require the administrator to own a phone.
    // Every candidate's own phone identity and numbers were checked above.
    if(method==='MANUAL')resources=(window.CloudCallData?.agents||[]).filter(row=>row.tenantId===tenantId&&String(row.enterpriseId)===String(c.scope.tenant.enterpriseId)&&row.lifecycleStatus==='已启用'&&row.syncStatus==='同步成功'&&row.callEnabled!==false&&row.acceptNewTasks!==false&&!row.currentCall&&people.some(person=>person.accountId===row.accountId)).map(row=>({resourceId:String(row.agentRecordId),seatId:String(row.agentRecordId),name:(row.userName||people.find(person=>person.accountId===row.accountId)?.name||row.accountId)+' · '+row.cno,tenantId,enterpriseId:row.enterpriseId,accountId:row.accountId,method:'MANUAL',kind:'SEAT',type:'SEAT',enabled:true}));
    if(method==='PREDICTIVE')resources=predictiveTasks(tenantId,c.scope.tenant.enterpriseId).filter(row=>predictiveCategoryMatches({ok:true,categoryId:row.categoryId},ctx.categoryId));
    if(method==='AI'){
      try{const live=parent.DModuleHost.currentWorkflowTasks?.();if(live?.identity===stamp())taskCache=copy(live);else taskCache={identity:'',tasks:[]};}catch(_){taskCache={identity:'',tasks:[]};}
      if(taskCache.identity===stamp())resources=taskCache.tasks.filter(row=>row.tenantId===tenantId&&(!ctx.brandId||!row.brandId||row.brandId===ctx.brandId)&&(!row.categoryId||row.categoryId===ctx.categoryId)&&aiTaskUsable(row)&&scenes.some(scene=>taskMatchesScene(row,scene))&&window.AppState?.authorizeObject?.('task.create',row)!==false).map(row=>executionAITask({...row,resourceId:String(row.taskId||row.resourceId),taskId:String(row.taskId||row.resourceId),method:'AI',kind:'TASK',type:'TASK'},ctx));
      const selected=scenes.find(scene=>String(scene.id||scene.sceneId)===String(ctx.aiSceneId||''));if(selected)resources=resources.filter(task=>taskMatchesScene(task,selected));
    }
    return {ok:true,people:copy(people),unavailablePeople:copy(unavailablePeople),scenes:copy(scenes),resources:copy(resources),legacyResources:copy(legacyResources),directoryReady:sceneCache.identity===stamp(),taskDirectoryReady:method!=='AI'||taskCache.identity===stamp(),message:method==='AI'&&!scenes.length?(sceneError||'本租户尚无匹配此业务分类的有效AI场景'):''};
  }
  function resolve(ctx={}){
    const available=choices(ctx);if(!available.ok)return available;
    const method=ctx.method||ctx.node?.methods?.[0],accountId=parent.DSession.context()?.account.id;
    const selectedId=String(ctx.resourceId||ctx.record?.arrangement?.resourceId||'');
    let scene=null,resources=selectedId?available.resources:available.resources.length?available.resources:available.legacyResources;
    if(method==='AI'){
      scene=available.scenes.find(s=>s.sceneId===String(ctx.aiSceneId||''));
      if(!scene)return {ok:false,message:available.message||'请在导入与分配选定本租户当前有效的AI呼叫场景'};
      resources=resources.filter(r=>taskMatchesScene(r,scene));
    }else if(method==='MANUAL')resources=resources.filter(r=>r.accountId===accountId);
    else if(method!=='PREDICTIVE')return {ok:false,message:'当前节点未明确呼叫方式'};
    if(selectedId)resources=resources.filter(row=>String(row.resourceId)===selectedId);
    if(resources.length!==1)return {ok:false,message:selectedId?'原指定任务或坐席已失效、不属于当前本人或不适配，请重新分配':resources.length?'存在多个执行配置，请在导入与分配指定具体任务或坐席':'本租户没有当前方式可用的具体任务或坐席'};
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
  function canUseTask(ctx={}){
    const a=window.AppState?.effectiveAccess?.(),c=parent.DSession.context(),resourceId=String(ctx.resourceId||'');
    if(!a?.valid||!['ADMIN','OPERATOR'].includes(a.roleCode)||a.accountId!==c?.account.id||a.tenantId!==c?.scope.id||ctx.tenantId!==a.tenantId||!['AI','PREDICTIVE'].includes(ctx.method)||!resourceId||window.AppState?.canAction?.('task.create')!==true)return false;
    try{return choices(ctx).resources.some(row=>String(row.resourceId)===resourceId&&row.tenantId===a.tenantId&&row.method===ctx.method&&window.AppState?.authorizeObject?.('task.create',row)!==false);}catch(_){return false;}
  }
  function taskImportTarget(spec={},options={}){
    try{
      const c=parent.DSession.context(),a=window.AppState?.effectiveAccess?.(),method=spec.method,taskId=String(spec.taskId??'').trim();
      const importChannel=spec.importChannel===undefined?'MANUAL':spec.importChannel,dataImportSource=importChannel==='API'?'AUTO':'MANUAL',entry=importChannel==='API'?'TASK_AUTO':'TASK_MANUAL';if(!['MANUAL','API'].includes(importChannel))throw Error('任务导入通道须明确为手工或原接口通道');
      if(!a?.valid||c?.scope.kind!=='tenant'||a.tenantId!==c.scope.id||a.accountId!==c.account.id||!taskId||!['AI','PREDICTIVE'].includes(method))throw Error('当前任务、登录身份或租户范围无法确认');
      if(!options.readOnly&&(a.roleCode!=='ADMIN'||window.AppState?.canAction?.('customer.import')!==true||window.AppState?.canAction?.('task.create')!==true))throw Error('任务内统一业务导入需当前租户有权管理员办理');
      if(method==='PREDICTIVE'){
        const rows=[...(window.CloudCallData?.predictiveTasks||[]),...(window.CloudCallData?.tasks||[])],matches=rows.filter(row=>String(row.taskId)===taskId&&row.tenantId===c.scope.id&&String(row.enterpriseId)===String(c.scope.tenant.enterpriseId)&&row.callType==='预外呼'),row=matches[0];
        if(!row||matches.some(item=>item.tenantId!==row.tenantId||String(item.enterpriseId)!==String(row.enterpriseId)||item.callType!==row.callType))throw Error('当前租户不存在准确的预外呼任务');
        if(window.AppState?.authorizeObject?.(options.readOnly?'':'task.create',row)!==true)throw Error('没有当前预外呼任务的读取或导入权限');
        if(!options.readOnly){
          const expected=importChannel==='API'?'api':'manual';if(importChannel==='API'&&row.dccImportSource!=='api'||importChannel==='MANUAL'&&row.dccImportSource==='api'||row.dccImportSource&&!['manual','api'].includes(row.dccImportSource)||row.dccManaged===true&&(row.dccSourceLocked!==true||row.dccImportSource!==expected))throw Error('当前预外呼任务创建时的导入来源与所选通道不一致，不能混入另一来源名单');
          const guard=window.DccRuntime?.guardTaskUpdate?.(row);if(guard?.ok===false)throw Error(guard.reason||'任务锁定来源与当前保存状态不一致');
        }
        const rawCategoryId=row.categoryId??'',rawUnifiedCategoryId=row.unifiedCategoryId??'',category=predictiveCategory(row,c.scope.tenant.brandId),categoryId=category.ok?category.categoryId:'';
        if(!options.readOnly&&!category.ok)return {ok:false,message:category.message,categoryId:'',issues:[category.message],target:{resourceId:taskId,taskId,kind:'TASK',method:'PREDICTIVE',name:row.name||taskId,tenantId:c.scope.id,enterpriseId:row.enterpriseId,categoryId:rawCategoryId||rawUnifiedCategoryId||'',unifiedCategoryId:rawUnifiedCategoryId||rawCategoryId||''}};
        const resource=options.readOnly?{resourceId:taskId,taskId,name:row.name||taskId,tenantId:c.scope.id,enterpriseId:row.enterpriseId,method:'PREDICTIVE',kind:'TASK',status:row.status,configurationRevision:row._localTaskRevision||0}:predictiveTasks(c.scope.id,c.scope.tenant.enterpriseId,importChannel).find(item=>item.resourceId===taskId);
        if(!resource)throw Error('当前预外呼任务不允许手工导入，请核对任务状态、来源和执行配置');
        const sourceLock={dccManaged:row.dccManaged===true,dccSourceLocked:row.dccSourceLocked===true,dccImportSource:row.dccImportSource||'',dccSupplierTaskId:row.dccSupplierTaskId||'',listSource:row.listSource||'',categoryId:rawCategoryId,unifiedCategoryId:rawUnifiedCategoryId,taskRevision:row._localTaskRevision??null},target={...resource,brandId:c.scope.tenant.brandId,sourceLock,importChannel,dataImportSource,categoryId:rawCategoryId||rawUnifiedCategoryId||'',unifiedCategoryId:rawUnifiedCategoryId||rawCategoryId||''};
        return {ok:true,target,importChannel,dataImportSource,aiScenes:[],aiSceneId:'',categoryId,issues:!category.ok?[category.message]:categoryId?[]:['请先在任务配置中关联业务分类'],targetFingerprint:JSON.stringify({target,sourceLock,importChannel,dataImportSource,category,categoryId})};
      }
      const directory=parent.DModuleHost.currentWorkflowTasks(options.readOnly?{readOnly:true,taskId}:{forImport:true,taskId,importChannel});
      if(directory?.identity!==stamp())throw Error('AI任务目录范围已变化，请重新打开');
      const matches=directory.tasks.filter(row=>String(row.taskId||row.resourceId)===taskId&&row.tenantId===c.scope.id),task=matches[0];if(matches.length!==1||!task)throw Error('本租户准确AI任务不存在、已失效或当前不可导入');
      if(window.AppState?.authorizeObject?.(options.readOnly?'':'task.create',task)!==true)throw Error('没有当前AI任务的读取或导入权限');
      const actualTaskSource=sceneSource(task);
      if(options.readOnly)return {ok:true,target:{...copy(task),resourceId:taskId,taskId,method:'AI',kind:'TASK',importChannel,dataImportSource:actualTaskSource},importChannel,dataImportSource:actualTaskSource,aiScenes:[],aiSceneId:'',categoryId:spec.categoryId||'',issues:[],targetFingerprint:JSON.stringify({taskId,tenantId:c.scope.id,method:'AI',readOnly:true,importChannel,dataImportSource:actualTaskSource,importType:task.importType})};
      if(actualTaskSource!==dataImportSource)throw Error('当前AI任务自身的导入方式与所选手工或接口通道不一致，或任务来源待核；不能改选场景混入另一来源名单');
      const scenesDirectory=parent.DModuleHost.currentWorkflowScenes();
      if(directory?.identity!==stamp()||scenesDirectory?.identity!==stamp())throw Error('AI任务或场景目录范围已变化，请重新打开');
      if(!taskImportUsable(task))throw Error(task.importEligibility?.reason||task.importEligibility?.issue||'当前AI任务原导入资格尚未核定，请先核对任务状态和配置');
      const target=executionAITask({...copy(task),resourceId:taskId,taskId,method:'AI',kind:'TASK',importChannel,dataImportSource}),failure=(code,message)=>({ok:false,code,message:(task.name||taskId)+'：'+message,configurationRequired:true,target,issues:[message]});
      const owned=scenesDirectory.scenes.filter(scene=>scene.tenantId===c.scope.id&&(!scene.brandId||scene.brandId===c.scope.tenant.brandId)&&task.platform&&scene.platform&&String(task.platform)===String(scene.platform));
      const configured=String(task.sceneId||task.aiSceneId||''),remote=String(task.remoteTaskId||''),identity=scene=>[scene.id,scene.sceneId,scene.executionSceneId].filter(value=>value!==undefined&&value!==null&&String(value)!=='').map(String);
      const bound=owned.filter(scene=>configured?identity(scene).includes(configured):!!remote&&[scene.professionalTaskId,scene.executionSceneId].filter(Boolean).map(String).includes(remote));
      if(bound.length!==1)return failure('TASK_IMPORT_SCENE_CONFIG',bound.length?'关联了多个AI业务场景，请先到任务配置核对唯一关联':'请先在任务配置关联AI业务场景和业务分类，再导入客户');
      const sceneId=String(bound[0].id||bound[0].sceneId),taskScenes=taskImportSceneDirectory(owned,task),scene=taskScenes.find(item=>String(item.id||item.sceneId)===sceneId);
      if(!scene||scene.enabled===false||!sceneEligible(scene,entry)||sceneSource(scene)!==dataImportSource||!taskMatchesScene(task,scene))return failure('TASK_IMPORT_SCENE_CONFIG','关联AI场景已失效、分类或传入方式不匹配，请先核对任务配置');
      if(spec.aiSceneId&&String(spec.aiSceneId)!==sceneId)return failure('TASK_IMPORT_SCENE_LOCKED','导入场景由任务配置锁定，不能临时替换；请刷新任务配置');
      if(typeof scene.categoryId!=='string'||!scene.categoryId)return failure('TASK_IMPORT_CATEGORY_CONFIG','关联AI场景尚未配置业务分类，请先到任务配置补齐');
      if(spec.categoryId&&String(spec.categoryId)!==String(scene.categoryId))return failure('TASK_IMPORT_CATEGORY_LOCKED','导入分类由任务关联场景确定，不能临时替换；请刷新任务配置');
      const categoryId=scene.categoryId;
      return {ok:true,target,importChannel,dataImportSource,aiScenes:[copy(executionScene(scene))],aiSceneId:sceneId,aiSceneLocked:true,categoryId,categoryLocked:true,issues:[],targetFingerprint:JSON.stringify({target,importChannel,dataImportSource,scene:{id:sceneId,categoryId:scene.categoryId,dataImportSource:sceneSource(scene),importType:scene.importType,configurationFingerprint:scene.executionConfigurationFingerprint||scene.configurationFingerprint}})};
    }catch(error){return {ok:false,message:error.message||'当前任务导入范围尚待核对',issues:[error.message]};}
  }
  function validateTaskImportParameters(spec,fields,values,customValues){
    if(spec.method==='PREDICTIVE')return {ok:true,fingerprint:'PREDICTIVE_NO_AI_PARAMETERS',mappings:[],parameters:{}};
    try{const result=parent.DModuleHost.reviewAIImportParameters?.(spec,fields,values,customValues);if(!result||result.then)return {ok:false,message:'AI场景专业参数映射尚未准备，请重新读取场景配置'};return copy(result);}catch(error){return {ok:false,message:error.message||'AI专业参数映射无法核对'};}
  }
  function extraContactFacts(ctx={}){return parent.DModuleHost.readContactExecutionFacts?.(ctx.tenantId,ctx.phone)||{known:false,facts:[],active:[],message:'专业联系事实尚未就绪'};}
  window.DFourNodeExecution={prepare,choices,resolve,validateAnswer,canUseTask,taskImportTarget,validateTaskImportParameters,extraContactFacts};
})();
