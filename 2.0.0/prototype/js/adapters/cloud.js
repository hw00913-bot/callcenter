/* Cloud source keeps its native state, route guards, phone and page controllers. */
(function () {
  'use strict';
  const boot=DNativeContext, original=window.navigateTo;
  const valid=()=>{const c=parent.DSession.context();return c&&c.account.id===boot.context.account.id&&c.scope.id===boot.context.scope.id;};
  const routeMap=boot.routeMap;
  let parentNavigation=false;
  function returnToCurrentLanding(){
    if(!valid())return false;
    const active=parent.DApp.currentPage(),landing=parent.DSession.landing?.(),available=parent.DSession.available?.()||[];
    const candidates=['PAGE-2202','PAGE-2209','PAGE-2004',...(landing&&landing!==active?[landing]:[]),...available.map(p=>p.id).filter(id=>id!==active)];
    const target=[...new Set(candidates)].find(id=>parent.DSession.allowed(id));
    if(!target){showToast('当前没有可返回的有权页面，请重新选择使用范围','warning');return false;}
    return parent.DApp.openPage(target);
  }
  function navigate(route,options){
    if(!valid())return false;
    if((route==='home'||route==='operations-monitor')&&parent.DModuleHost.isReady('cloud')&&parent.DModuleHost.isActive('cloud'))return returnToCurrentLanding();
    const id=routeMap[route];if(id&&!parent.DSession.allowed(id))return false;
    parentNavigation=true;try{const result=original(route,{...options,primaryNavigation:true});if(result!==false&&route==='cloud-call-records'&&options?.sourceCallRef)requestAnimationFrame(()=>Pages['cloud-call-records'].openCall(options.sourceCallRef.id));return result;}finally{parentNavigation=false;}
  }
  window.navigateTo=function(route,options){
    if(!valid())return false;
    if((route==='home'||route==='operations-monitor')&&parent.DModuleHost.isReady('cloud')&&parent.DModuleHost.isActive('cloud'))return returnToCurrentLanding();
    const id=routeMap[route];
    if(id&&!parent.DSession.allowed(id)){showToast('当前账号没有此页面权限','warning');return false;}
    if(id&&id!==parent.DApp.currentPage()&&!parentNavigation&&parent.DModuleHost.isReady('cloud')&&parent.DModuleHost.isActive('cloud')&&!parent.DModuleHost.isSeatLinkActive())return parent.DApp.openPage(id,{nativeOptions:{...options,...(id==='PAGE-2209'?{reportRoute:route}:{})}});
    return original(route,options);
  };
  // Parent controls login/scope; source profile-switching tools are not exposed.
  AppState.logout=()=>{parent.DApp.leave(null,()=>{parent.DSession.logout();parent.DModuleHost.dispose();parent.DApp.refresh();});return true;};
  window.DAdapter={ready:true,navigate,getFilters(){const o=window.RouteRuntime?.snapshot()?.options||{},out={};for(const key of ['recordId','batchKey','batchId','mechanism','assignmentView','view','physicalGroupId','tenantId'])if(['string','number','boolean'].includes(typeof o[key]))out[key]=o[key];if(o.originBatch&&typeof o.originBatch==='object')out.originBatch=Object.fromEntries(['batchKey','batchId','mechanism','sourceBatchId'].filter(k=>typeof o.originBatch[k]==='string').map(k=>[k,o.originBatch[k]]));if(window.RouteRuntime?.snapshot()?.key==='customer-directory'){const directoryState=window.Pages?.['customer-directory']?.captureNavigationState?.();if(['business','contacts'].includes(directoryState?.fourNodeDirectoryView))out.fourNodeDirectoryView=directoryState.fourNodeDirectoryView;}return out;},beforeLeave(next,proceed){
    if(!valid()){parent.DUI.toast('当前使用权限已变化，请重新进入。');return;}
    if(AppState.get().hasUnsavedChanges||window.PlatformUI?.hasUnsavedLayers?.()){parent.DUI.toast('请先保存或关闭当前编辑内容，再离开。');return;}
    // Telephone state does not block navigation, scope changes or system logout.
    proceed();
  }};
  document.addEventListener('DOMContentLoaded',()=>{if(boot.route)window.DAdapter.navigate(boot.route);parent.DModuleHost.ready('cloud',window);});
})();

/* Reuse the original call identity checks when a delayed local CDR has settled. */
(function(){
  window.addEventListener('call-data-sync',event=>{
    const detail=event.detail;if(!detail?.callId||window.HistorySnapshot?.read_only===true||window.DBusinessRegulation?.current())return;
    const active=parent.DSession.context(),owner=DNativeContext.context;
    if(!active||active.account.id!==owner.account.id||active.scope.id!==owner.scope.id||active.scope.grant?.moduleRoles?.cloud==='reader')return;
    const rows=(window.CloudCallData?.calls||[]).filter(call=>call.callId===detail.callId&&call.tenantId===detail.tenantId&&String(call.enterpriseId)===String(detail.enterpriseId));
    if(rows.length!==1)return;const call=rows[0];
    if(call.dataSync?.status==='synced'&&call.alictiCdr?.mock===true&&call.callSource==='NATIVE_WORKBENCH'&&call.workbenchKind==='predictive')window.DccRuntime?.syncWorkbenchCall(call);
  });
})();

/* D_ORG_BOOT_BEGIN */
window.applyDOrganizationIdentity=function(){
  const unified=parent.DOrganization?.snapshot?.()||DNativeContext.management,d=window.CloudCallData;if(!unified||!d)return;
  for(const t of unified.tenants){let old=d.tenants.find(x=>x.tenantId===t.id);if(!old){old={tenantId:t.id,enterpriseId:t.enterpriseId||'',hasBusinessData:!!t.hasBusinessData};d.tenants.push(old);}Object.assign(old,{name:t.name,enterpriseId:t.enterpriseId||'',brandId:t.brandId||'',organizationScope:t.organization==='总部'?'HEADQUARTERS':'STORE',organizationLabel:t.organization,status:t.enabled?'启用':'停用',capabilitySet:t.modules.cloud?['CLOUD_CONTACT_CENTER']:[]});}
  const managedIds=new Set(unified.accounts.map(a=>a.id));
  d.memberships=d.memberships.filter(m=>!managedIds.has(m.accountId)||m.tenantId==='TENANT-SUPER-BUILTIN');
  for(const a of unified.accounts){let old=d.accounts.find(x=>x.accountId===a.id);if(!old){old={accountId:a.id,loginUsername:a.login,name:a.name,builtIn:false,password:''};d.accounts.push(old);}Object.assign(old,{name:a.name,status:a.enabled?'启用':'停用'});
    // The source super role is reused only for an explicit isolated test actor.
    // Its original credentials, account ID and saved records are never copied.
    const fixture=parent.DSeed.syntheticLegacy?.accounts.find(x=>x.id===a.id&&x.sourceRoleFixture==='super');
    if(fixture&&DNativeContext.context.account.id===a.id&&DNativeContext.storagePrefix===parent.DSession.prefix+'cloud:synthetic-resources:'){
      const sourceMember=d.memberships.find(x=>x.accountId==='ACC-SUPER-001'&&x.tenantId==='TENANT-SUPER-BUILTIN'&&x.roleCode==='SUPER_ADMIN');
      const sourceProfile=d.demoProfiles.find(x=>x.profileId==='super'&&x.accountId==='ACC-SUPER-001');
      if(sourceMember&&sourceProfile){old.builtIn=true;if(!d.memberships.some(x=>x.membershipId==='SYN-MEM-SUPER'&&x.accountId===a.id))d.memberships.push({...sourceMember,membershipId:'SYN-MEM-SUPER',accountId:a.id});if(!d.demoProfiles.some(x=>x.profileId===fixture.nativeProfile))d.demoProfiles.push({...sourceProfile,profileId:fixture.nativeProfile,accountId:a.id,label:fixture.label});}
    }
    for(const m of a.memberships){if(!m.modules.includes('cloud'))continue;d.memberships.push({membershipId:'UM-'+a.id+'-'+m.tenantId,accountId:a.id,tenantId:m.tenantId,roleCode:m.role==='admin'?'ADMIN':'OPERATOR',status:m.enabled?'启用':'停用'});}
    if(!d.demoProfiles.some(p=>p.accountId===a.id)&&a.memberships.some(m=>m.modules.includes('cloud')))d.demoProfiles.push({profileId:'integrated-'+a.id,accountId:a.id,label:a.label,roleCode:'OPERATOR',defaultTenantId:a.memberships[0].tenantId});
  }
};
window.applyDOrganizationBinding=function(ledger){
  const u=parent.DOrganization?.snapshot?.()||DNativeContext.management;if(!u)return ledger;
  u.brands.forEach(b=>{const old=ledger.brands.find(x=>x.brandId===b.id);if(old)old.name=b.name;else ledger.brands.push({brandId:b.id,name:b.name,remark:''});});
  u.tenants.forEach(t=>{const old=ledger.bindings.find(x=>x.tenantId===t.id);const fields={tenantId:t.id,brandId:t.brandId||'',kind:t.organization==='总部'?'HQ':'STORE',known:!!t.brandId,...(Object.hasOwn(t,'storeCode')?{storeCode:t.organization==='门店'?t.storeCode:''}:{})};if(old)Object.assign(old,fields);else ledger.bindings.push({hasLeads:!!t.hasBusinessData,storeCode:'',...fields});});
  return ledger;
};
/* D_ORG_BOOT_END */

(function(){
  let portal=false,observer;
  DAdapter.openSeatLink=function(accountId,tenantId){
    const tenant=CloudCallData.tenants.find(t=>t.tenantId===tenantId),error=AccountSeat.scopeError(tenantId,tenant?.enterpriseId,accountId);
    if(error){parent.DUI.toast(error);parent.DModuleHost.closeSeatLink();return false;}
    portal=true;const style=document.createElement('style');style.id='d-seat-link-skin';style.textContent='body{background:transparent!important}.main-layout,.native-call-dock{visibility:hidden!important}#account-seat .account-seat-tabs button:nth-child(2){display:none!important}';document.head.appendChild(style);
    AccountSeat.open(accountId,tenantId,tenant.enterpriseId);
    observer?.disconnect();observer=new MutationObserver(()=>{
      document.querySelectorAll('#account-seat .account-seat-muted').forEach(n=>{if(n.textContent.includes('新建并关联'))n.textContent='暂无可关联坐席，请在坐席维护中检查当前租户的坐席。';});
      if(!document.querySelector('.platform-layer')){portal=false;style.remove();observer.disconnect();parent.DModuleHost.closeSeatLink();}
    });observer.observe(document.body,{childList:true,subtree:true});return true;
  };
  const mode=AccountSeat.setMode;AccountSeat.setMode=function(value){if(portal&&value!=='existing')return showToast('请在坐席维护中创建坐席','warning');return mode(value);};
  const retry=AccountSeat.retry;AccountSeat.retry=function(id){if(portal){const c=DNativeContext.context,t=c.scope.tenant;const item=AccountSeat.attempts(c.account.id,t.id,t.enterpriseId).find(x=>x.id===id);if(item?.input)return showToast('新建坐席的重试请在原坐席维护中办理','warning');}return retry(id);};
})();

(function(){
  let limitedCallId='';
  const action=AppState.canAction;
  AppState.canAction=function(permission){if(limitedCallId)return false;try{parent.DOrganization?.load?.();window.applyDOrganizationIdentity();}catch(_){return false;}const c=parent.DSession.context();if(!c||c.account.id!==DNativeContext.context.account.id||c.scope.id!==DNativeContext.context.scope.id)return false;if(c.scope.grant.moduleRoles?.cloud==='reader')return false;return action(permission);};
  DAdapter.restrictToCurrentCall=function(){
    const call=AgentWorkbench.current();
    if(!call.call||!['connected','wrap'].includes(call.phase))return false;
    limitedCallId=call.call.callId||call.call.id;
    if(!limitedCallId)return false;
    AgentWorkbench.openDialog();
    document.addEventListener('click',event=>{if(limitedCallId&&!DAdapter.allowLimitedExitInput?.(event.target,event)&&!event.target.closest('#assigned-call-dialog')){event.preventDefault();event.stopImmediatePropagation();}},true);
    document.addEventListener('keydown',event=>{if(limitedCallId&&!DAdapter.allowLimitedExitInput?.(event.target,event)&&(event.key==='Escape'||!event.target.closest('#assigned-call-dialog'))){event.preventDefault();event.stopImmediatePropagation();}},true);
    return true;
  };
  ['dial','signIn','openTemporary','selectAssigned','receiveOffer','answerIncoming','bindAccount'].forEach(name=>{const fn=AgentWorkbench[name];if(typeof fn==='function')AgentWorkbench[name]=function(){if(limitedCallId)return showToast('当前仅可完成本通电话及话后记录','warning');if(parent.DSession.roleKey()? !parent.DSession.can('F37'):parent.DSession.context()?.scope.grant.moduleRoles?.cloud==='reader')return showToast('请先关联本租户有效坐席并具备电话作业权限','warning');return fn.apply(this,arguments);};});
  ['minimizeDialog','closeDialog'].forEach(name=>{const fn=AgentWorkbench[name];AgentWorkbench[name]=function(){if(limitedCallId&&AgentWorkbench.current().busy)return showToast('请先完成本通电话及必要话后记录','warning');return fn.apply(this,arguments);};});
  const save=AgentWorkbench.saveDisposition;
  AgentWorkbench.saveDisposition=function(){if(limitedCallId){const c=AgentWorkbench.current();if((c.call?.callId||c.call?.id)!==limitedCallId)return false;}const result=save.apply(this,arguments);
    if(limitedCallId&&!AgentWorkbench.current().busy)Promise.resolve(AgentWorkbench.signOut()).then(r=>{if(r?.ok){limitedCallId='';parent.DApp.finishRevoked();}});
    return result;
  };
})();

(function(){
  // A read-only module grant must not inherit the original operator's write buttons.
  const reader=target=>!DAdapter.allowLimitedCallInput?.(target)&&!DAdapter.allowLimitedExitInput?.(target)&&!window.DSharedConfiguration?.active()&&(parent.DSession.regulation?.()?.pages.includes(parent.DApp.currentPage())||parent.DSession.context()?.scope.grant.moduleRoles?.cloud==='reader');
  const readers={
    'report-center':new Set(['query','reset','setPage','drill','drillPage','openCall','openCustomer','openLead','openTask','openLeadCall','openLeadCustomer','openLeadTask']),
    'customer-directory':new Set(['query','resetFilters','refresh','openDetail','setPage','setCallPage','setBatchPage','setCallFilter','openImportRecord','openCall']),
    CustomerProfiles:new Set(['query','reset','setPage','reload','openDetail','openSource','close','refreshDetail']),
    'cloud-call-records':new Set(['query','resetFilters','setPage','setType','openCall']),
    BusinessFlow:new Set(['query','resetFilters','open','back','refresh','closeDialog','locateBatch','legacy']),
    FourNodeWorkspace:new Set(['query','reset','setPage','setQueue','setDirectoryView','directoryTabKey','refreshDirectory','setDirectoryPage','queryBusinessDirectory','setTimelinePage','setBatchPage','showBatch','clearBatch','openLegacyRecords','loadValueDifferences','openRecord','back','openFollowupSnapshot','openCall','openBusinessTimeline','closeHistory']),
    CustomerTasks:new Set(['query','reset','open','history','detail','openList','openUnified','openBatchProjection','openBatchRecord','viewBatchBusinessData','setAssignmentView','unifiedQuery','unifiedReset','unifiedAssignmentView','restoreBatchContext']),
    CloudCallRecords:new Set(['reviewTab','returnTask','switchView']),
    DccRecords:new Set(['switchTab','openCalls','openDetail','openResultDetail','openDeletionDetail','openArchive','openDirectoryRecord','openDirectoryCall','closeManual']),
    CloudTaskWorkspace:new Set(['setTaskTab']),
    DTaskRosterView:new Set(['refresh','setPage','openDetails','closeDetails']),
    PlatformUI:new Set(['closeLayer','closeLayerFromBackdrop','showHelp','hideHelp','showCapabilityDetail','openCapabilityCenter']),
    RouteRuntime:new Set(['back','openSecondary','refreshCurrent'])
  };
  function readHandler(handler){
    const strings=[],code=handler.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,value=>'__str'+(strings.push(value)-1)+'__');
    const parts=code.split(';').map(x=>x.trim()).filter(Boolean);if(!parts.length)return false;
    return parts.every(part=>{
      if(/^event\.(preventDefault|stopPropagation)\(\)$/.test(part))return true;
      const match=/^(?:return\s+)?(?:window\.)?(?:Pages\[__str(\d+)__\]|([A-Za-z]\w*))\.(\w+)\(([\s\S]*)\)$/.exec(part);
      if(!match){const nav=/^(?:window\.)?navigateTo\(__str(\d+)__\)$/.exec(part);return !!nav&&/^['"](?:cloud-(overview|lead|customer|outbound|agent|inbound|skill)-report|home|operations-monitor)['"]$/.test(strings[Number(nav[1])]||'');}
      const target=match[1]===undefined?match[2]:strings[Number(match[1])]?.slice(1,-1),method=match[3];
      const args=match[4].replace(/__str\d+__/g,'0').replace(/\b(?:this|event|true|false|null|undefined)\b/g,'0').replace(/\b[A-Za-z_]\w*\s*:/g,':');
      if(!/^[\s\d.,:+\-\[\]{}]*$/.test(args))return false;
      const owner=['business-records','business-record-detail'].includes(target)?'BusinessFlow':target;
      return readers[owner]?.has(method)===true;
    });
  }
  document.addEventListener('click',event=>{
    if(!reader(event.target))return;const control=event.target.closest('button,a,[onclick]');if(!control)return;
    if(!readHandler(control.getAttribute('onclick')||'')){event.preventDefault();event.stopImmediatePropagation();showToast('当前账号为只读权限','warning');}
  },true);
  document.addEventListener('submit',event=>{if(reader(event.target)){event.preventDefault();event.stopImmediatePropagation();showToast('当前账号为只读权限','warning');}},true);
})();

(function(){
  const displayStyle=document.createElement('style');displayStyle.textContent='body.d-shared-config>.app-main-layout{visibility:visible!important;padding-top:0!important}body.d-shared-config .native-call-dock{display:none!important}';document.head.appendChild(displayStyle);
  const configPages=['PAGE-2006','PAGE-2223','PAGE-2228'];let readOnly=false,configRoute='',configOptions={},restoringFilter=false;
  const c=()=>parent.DSession.context();
  const active=()=>readOnly||configPages.includes(parent.DApp.currentPage());
  function tenants(){const context=c();if(!context)return [];const ids=context.scope.kind==='tenant'?[context.scope.id]:(context.scope.grant.tenantIds||[]);return CloudCallData.tenants.filter(t=>ids.includes(t.tenantId)&&t.status==='启用');}
  function access(){const context=c(),list=tenants();if(!context)return {valid:false};const role=readOnly?'OPERATOR':context.scope.grant.role==='super'?'SUPER_ADMIN':context.scope.grant.role==='admin'?'ADMIN':'OPERATOR';return {valid:readOnly?parent.DSession.allowed('PAGE-2111')||parent.DSession.allowed('PAGE-2006')||parent.DSession.can('F15')&&parent.DSession.allowed('PAGE-2110'):parent.DSession.allowed(parent.DApp.currentPage()),roleCode:role,accountId:context.account.id,userId:context.account.id,tenantId:context.scope.kind==='tenant'?context.scope.id:'TENANT-SUPER-BUILTIN',tenantIds:list.map(t=>t.tenantId),enterpriseId:context.scope.tenant?.enterpriseId||list[0]?.enterpriseId||'',configurationOnly:true};}
  window.DSharedConfiguration={active,access,tenants,canManage:()=>!readOnly&&active()&&parent.DSession.canWrite(parent.DApp.currentPage())&&['admin','super'].includes(c()?.scope.grant.role),state:()=>({...access(),sessionId:'shared-config-'+c()?.account.id,activeDomain:readOnly?'BUSINESS_CONFIG_READ':'BUSINESS_CONFIG'})};
  DSharedConfiguration.canLinkAI=function(id){try{return parent.DSession.allowed('PAGE-2111')&&parent.DCatalog.links(id,DSharedConfiguration.legacySource?.()?'tenant':'brand').length>0;}catch(_){return false;}};
  DSharedConfiguration.openAIAssociation=function(id){if(!DSharedConfiguration.canLinkAI(id))return showToast('当前没有可定位的有权AI关联，请在AI标签管理中核对','warning');const categoryScope=DSharedConfiguration.legacySource?.()?'tenant':'brand',links=parent.DCatalog.links(id,categoryScope);return parent.DApp.openPage('PAGE-2111',{nativeOptions:{commonCategoryId:id,categoryScope,sceneIds:links.map(r=>r.sceneId)}});};
  function catalogChoices(){return CustomerBusiness.legacyTenants().map(t=>({id:'legacy:'+t.tenantId,name:t.name+' · 原租户目录',tenantId:t.tenantId,enterpriseId:t.enterpriseId||'',legacy:true}));}
  DSharedConfiguration.legacySource=function(){const selected=catalogChoices().find(t=>t.id===configOptions.catalogScope);return selected?{tenantId:selected.tenantId,enterpriseId:selected.enterpriseId,legacy:true}:null;};
  DSharedConfiguration.selectCatalog=function(value){if(value!=='brand'&&!catalogChoices().some(t=>t.id===value))return parent.DUI.toast('原目录范围已变化，请重新读取。');return parent.DApp.openPage(parent.DApp.currentPage(),{nativeOptions:{view:configOptions.view,catalogScope:value}});};
  function renderConfig(route,options={}){
    document.body.classList.add('d-shared-config');configRoute=route;
    const context=c(),defaultScope=context?.scope.kind==='tenant'&&!context.scope.tenant.brandId?'legacy:'+context.scope.id:'brand';
    configOptions={view:['category','field','dictionary'].includes(options.view)?options.view:route==='business-fields'?'field':'category',catalogScope:options.catalogScope||defaultScope};
    const available=catalogChoices();if(configOptions.catalogScope!=='brand'&&!available.some(t=>t.id===configOptions.catalogScope)){document.getElementById('page-content').textContent='原目录暂时无法可靠读取，请重新核对使用范围。';return false;}
    const selector=route!=='flow-templates'&&available.length?'<div class="filter-panel"><label class="field"><span>配置目录</span><select onchange="DSharedConfiguration.selectCatalog(this.value)">'+(CustomerBusiness.brands().length?'<option value="brand" '+(configOptions.catalogScope==='brand'?'selected':'')+'>品牌共用目录</option>':'')+available.map(t=>'<option value="'+PlatformUI.escape(t.id)+'" '+(configOptions.catalogScope===t.id?'selected':'')+'>'+PlatformUI.escape(t.name)+'</option>').join('')+'</select></label></div>':'';
    document.getElementById('page-content').innerHTML=selector+(route==='flow-templates'?Pages['flow-templates'].render({view:'template'}):Pages['brand-business-categories'].render({view:configOptions.view}));
    if(options.fieldFilter&&!restoringFilter){const input=document.getElementById('business-config-keyword'),status=document.getElementById('business-config-status');if(input)input.value=options.fieldFilter.keyword||'';if(status)status.value=options.fieldFilter.status||'';restoringFilter=true;BusinessConfiguration.query(configOptions.view);restoringFilter=false;}
    AgentWorkbench?.updateDock();const dock=document.getElementById('native-call-dock');if(dock)dock.hidden=true;return true;
  }

  const navigate=DAdapter.navigate;DAdapter.navigate=function(route,options){if(configPages.includes(parent.DApp.currentPage())&&['brand-business-categories','business-categories','business-fields','flow-templates'].includes(route))return renderConfig(route,{...configOptions,...options});document.body.classList.remove('d-shared-config');const dock=document.getElementById('native-call-dock');if(dock)dock.hidden=false;return navigate(route,options);};
  const nativeFilters=DAdapter.getFilters;DAdapter.getFilters=function(){if(active()&&!readOnly)return {...configOptions,fieldFilter:{keyword:document.getElementById('business-config-keyword')?.value||'',status:document.getElementById('business-config-status')?.value||''}};return nativeFilters();};
  const refresh=RouteRuntime.refreshCurrent;RouteRuntime.refreshCurrent=function(){if(active()&&!readOnly&&configRoute)return renderConfig(configRoute,configOptions);return refresh();};
  const nav=window.navigateTo;window.navigateTo=function(route,options){const id={'brand-business-categories':'PAGE-2006','business-categories':'PAGE-2006','business-fields':'PAGE-2223','flow-templates':'PAGE-2228'}[route];if(id&&active()&&parent.DModuleHost.isReady('cloud')&&parent.DModuleHost.isActive('cloud'))return parent.DApp.openPage(id,{nativeOptions:{...configOptions,...options}});return nav(route,options);};
  DAdapter.readCatalog=function(options={}){readOnly=true;try{const context=c(),t=context?.scope.tenant;if(!t)return {ok:false,message:'请选择有权业务租户。'};const source={tenantId:t.id,enterpriseId:t.enterpriseId||''},legacyAvailable=CustomerBusiness.legacyTenants().some(x=>x.tenantId===t.id);if(options.legacy&&t.brandId&&!legacyAvailable)return {ok:false,message:'当前租户没有可读取的原目录。'};const result=options.legacy||!t.brandId?CustomerBusiness.legacyCatalog({...source,legacy:true}):CustomerBusiness.brandCatalog({...source,brandId:t.brandId});return {...result,legacyAvailable};}finally{readOnly=false;}};
  const before=DAdapter.beforeLeave;DAdapter.beforeLeave=function(next,proceed){if(active()&&!readOnly){if(AppState.get().hasUnsavedChanges||PlatformUI.hasUnsavedLayers?.())return parent.DUI.toast('请先保存或关闭当前配置，再离开。');proceed();return;}return before(next,proceed);};
})();

(function(){
  let cached;
  function templates(){if(!cached){const r=BusinessFlowStore.catalogs();cached=r.status==='success'?r.data.templates:[];queueMicrotask(()=>{cached=null;});}return cached;}
  function version(ref){if(!ref?.templateId)return null;return templates().find(t=>t.templateId===ref.templateId)?.versions?.find(v=>Number(v.version)===Number(ref.version));}
  window.DReadableFlow={
    brand:id=>parent.DOrganization.snapshot().brands.find(b=>b.id===id)?.name||'品牌信息待核',
    template:ref=>!ref?'未配置':(version(ref)?.name||ref.name||'模板信息待核'),
    node:(ref,id)=>!id?'':version(ref)?.nodes?.find(n=>n.nodeId===id)?.name||'节点信息待核',
    eventNode:(row,event)=>{const runs=(row.nodeRuns||[]).filter(r=>r.nodeId===event.nodeId&&(!event.nodeRunId||r.nodeRunId===event.nodeRunId));return runs.length===1?runs[0].name||'历史节点':'历史节点';},
    round:(row,id)=>{const r=row.rounds?.find(r=>r.roundId===id);return r?'第 '+r.number+' 轮':'轮次待核';},
    unstarted:row=>!(row.rounds?.at(-1)?.segments?.length)&&row.execution?.state==='ended'&&row.execution?.noMoreCalls===true,
    execution:(row,names)=>!(row.rounds?.at(-1)?.segments?.length)&&row.execution?.state==='ended'&&row.execution?.noMoreCalls===true?'本轮尚未主动启动':names[row.execution?.state]||'待核'
  };
})();

(function(){
  window.DNativeContact={
    checkTask(row,method){
      let records=null;
      if(window.DccRuntime?.isManagedTask?.(row)){const result=DccRuntime.taskRecords(row.taskId);if(result?.ok&&Array.isArray(result.data?.records))records=result.data.records.filter(r=>r.importState==='accepted'&&r.supplierDeleted!==true&&r.deletionState!=='succeeded');}
      else if(window.CustomerTasks?.taskExecutionCustomers)records=CustomerTasks.taskExecutionCustomers(row);
      const validRows=Array.isArray(records)?records.filter(r=>r.tenantId===row.tenantId&&(!r.enterpriseId||r.enterpriseId===row.enterpriseId)):[];
      const complete=Array.isArray(records)&&validRows.length===records.length&&Number.isInteger(Number(row.total))&&Number(row.total)===validRows.length;
      return parent.DContactPolicy.checkBatch(row.tenantId,validRows.map(r=>r.phone||r.customerPhone||r.callee||''),method,complete);
    }
  };
})();

/* Explicit read-only business regulation; it does not grant a business membership. */
(function(){
  const nativeAccess=AppState.effectiveAccess,nativeMenu=AppState.canMenu,nativeAction=AppState.canAction;
  function current(){const c=parent.DSession.context(),r=parent.DSession.regulation?.();return c&&r&&c.account.id===DNativeContext.context.account.id&&c.scope.id===DNativeContext.context.scope.id&&r.pages.includes(parent.DApp.currentPage())?r:null;}
  AppState.effectiveAccess=function(){const r=current();return r?{...nativeAccess(),valid:true,accountId:r.accountId,userId:r.accountId,roleCode:'SUPER_ADMIN',roleId:'SUPER_ADMIN',roleLabel:'业务监管',tenantIds:r.tenantIds,brandIds:r.brandIds,regulationOnly:true}:nativeAccess();};
  AppState.canMenu=function(permission){if(current()){if(['business.flow.view','business.flow.regulate','business.imports.view'].includes(permission))return true;if(permission==='business.flow.configure')return false;}return nativeMenu(permission);};
  AppState.canAction=function(permission){return current()?false:nativeAction(permission);};
  window.DBusinessRegulation={current};
})();

/* Expose the original seven reports inside the existing report page. */
(function(){
  const views={overview:['通话总览','cloud-overview-report'],leads:['线索成效','cloud-lead-report'],customers:['客户跟进','cloud-customer-report'],outbound:['外呼任务','cloud-outbound-report'],agents:['坐席成效','cloud-agent-report'],inbound:['呼入服务','cloud-inbound-report'],skills:['服务技能','cloud-skill-report']};
  const report=Pages['report-center'],render=report.render,nav=DAdapter.navigate,filters=DAdapter.getFilters;
  report.render=function(options){const body=render(options);if(!CloudReportData.valid())return body;const current=views[options?.view]?options.view:'overview';return '<nav class="platform-tabs" role="tablist" aria-label="云呼叫报表类型">'+Object.entries(views).filter(([,v])=>RouteRuntime.canRoute(v[1])).map(([key,v])=>'<button type="button" role="tab" aria-selected="'+(key===current)+'" class="platform-tab '+(key===current?'active':'')+'" onclick="navigateTo(\''+v[1]+'\')">'+v[0]+'</button>').join('')+'</nav>'+body;};
  DAdapter.navigate=function(route,options={}){if(Object.values(views).some(v=>v[1]===route)){if(Object.values(views).some(v=>v[1]===options.reportRoute))route=options.reportRoute;if(options.reportState?.context===CloudReportData.scopeKey())report.restoreNavigationState(options.reportState);}return nav(route,options);};
  DAdapter.getFilters=function(){const result=filters();if(parent.DApp.currentPage()==='PAGE-2209'){const state=report.captureNavigationState();return {...result,reportRoute:views[state.view]?.[1]||views.overview[1],reportState:state};}return result;};
})();

/* Restore only authorized existing task detail positions, never an unsaved wizard. */
(function(){
  const navigate=DAdapter.navigate,filters=DAdapter.getFilters;
  DAdapter.navigate=function(route,options={}){const result=navigate(route,options);if(result!==false&&['predictive-tasks','ivr-tasks'].includes(route)&&options.taskPosition)CloudTaskWorkspace.restoreIntegratedPosition(options.taskPosition);return result;};
  DAdapter.getFilters=function(){const result=filters();if(['PAGE-2205','PAGE-2206'].includes(parent.DApp.currentPage())){const position=CloudTaskWorkspace.captureIntegratedPosition();if(position)return {...result,taskPosition:position};}return result;};
})();

/* Retired Cloud-home fragments stay on their confirmed existing target pages. */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape;
  const active=()=>{const c=parent.DSession.context(),owner=DNativeContext.context;return !!c&&c.account.id===owner.account.id&&c.scope.id===owner.scope.id&&AppState.effectiveAccess().valid&&AppState.canMenu('home');};
  const current=()=>parent.DApp.currentPage();
  function scopedSeat(id){
    if(!active()||!['PAGE-2202','PAGE-2210'].includes(current())||!parent.DSession.allowed(current()))return null;
    const state=AppState.get(),target=parent.DSession.context()?.scope.tenant;
    if(!target?.id||!target.enterpriseId||String(state.enterpriseId)!==String(target.enterpriseId))return null;
    const rows=CloudCallData.agents.filter(a=>a.agentRecordId===id&&a.tenantId===target.id&&String(a.enterpriseId)===String(target.enterpriseId)&&a.lifecycleStatus!=='已删除'&&AppState.authorizeObject('',a));
    return rows.length===1?rows[0]:null;
  }
  function seatDetailsAllowed(id){return !!scopedSeat(id);}
  function fullCallAllowed(id){return seatDetailsAllowed(id)&&parent.DSession.allowed('PAGE-2208')&&AppState.canMenu('records.cloud')&&CloudReportData.valid();}
  function openSeat(id,page){
    if(!seatDetailsAllowed(id))return showToast('当前没有此坐席状态与通话摘要的查看权限','warning');
    const result=originalAgent(id,page),node=document.getElementById('dashboard-agent');
    if(!fullCallAllowed(id))for(const button of node?.querySelectorAll('button[onclick*="WorkbenchOverview.inspectCall"]')||[]){button.disabled=true;button.title='当前可查看来源摘要，未授完整通话详情权限';}
    if(!parent.DSession.allowed('PAGE-2210'))for(const button of node?.querySelectorAll('button[onclick*="WorkbenchOverview.stopNew"]')||[]){button.disabled=true;button.title='坐席维护需独立授权';}
    return result;
  }
  const originalAgent=WorkbenchOverview.agent,originalInspectCall=WorkbenchOverview.inspectCall,originalStop=WorkbenchOverview.stopNew;
  WorkbenchOverview.agent=function(id,page){if(['PAGE-2202','PAGE-2210'].includes(current()))return openSeat(id,page);return originalAgent(id,page);};
  WorkbenchOverview.inspectCall=function(agentId,callId){if(['PAGE-2202','PAGE-2210'].includes(current())&&!fullCallAllowed(agentId))return false;return originalInspectCall(agentId,callId);};
  WorkbenchOverview.stopNew=function(id){if(['PAGE-2202','PAGE-2210'].includes(current())&&(!parent.DSession.allowed('PAGE-2210')||!scopedSeat(id)))return false;return originalStop(id);};
  function workload(){
    if(!active()||current()!=='PAGE-2202'||!parent.DSession.allowed('PAGE-2202')||AppState.effectiveAccess().roleCode!=='OPERATOR')return '';
    const model=WorkbenchOverview.model(false),rows=model.seats.filter(a=>scopedSeat(a.agentRecordId)),count=s=>rows.filter(a=>WorkbenchOverview.seatState(a)===s).length;
    const metrics=[['坐席总数',rows.length],['上线数',rows.length-count('未上线')],['空闲',count('空闲')],['忙碌',count('忙碌')],['话后处理',count('话后处理')],['未上线',count('未上线')]];
    return '<section class="panel-card" data-source-fragment="MIG-CLOUD-05 MIG-CLOUD-06"><div class="panel-header"><div><h2>坐席负荷与当前通话</h2><p>当前租户已取得的坐席状态；查看无需本人电话坐席。</p></div></div><div class="panel-body"><div class="kpi-grid">'+metrics.map(([name,value])=>ui.kpi(name,value,'当前坐席状态')).join('')+'</div>'+ui.table([{key:'userName',label:'坐席'},{key:'agentStatus',label:'当前状态',render:(_,a)=>esc(WorkbenchOverview.seatState(a))},{key:'currentCall',label:'当前通话',render:v=>v?'通话中':'—'},{key:'agentRecordId',label:'操作',render:id=>'<button class="btn-link" '+(seatDetailsAllowed(id)?'':'disabled title="当前没有此坐席来源摘要查看权限"')+' onclick="DCloudSourceFragments.openSeat('+esc(JSON.stringify(id))+')">查看状态与通话</button>'}],ui.sortByUpdated?.(rows,['statusUpdatedAt','lastSyncAt'])||rows,{emptyText:'当前范围暂无坐席'})+'</div></section>';
  }
  const seatPage=Pages['seat-workbench'],renderSeat=seatPage.render;
  seatPage.render=function(options){return renderSeat(options)+workload();};
  function businessShare(){
    if(!active()||current()!=='PAGE-2209'||!parent.DSession.allowed('PAGE-2209')||!CloudReportData.valid())return '';
    const report=Pages['report-center'],state=report.captureNavigationState();if(state.view!=='overview')return '';
    const model=report.getModel('overview');if(!model||model.error)return '';
    const total=model.summary.total,groups=model.businessGroups||[];
    const list=groups.map(group=>'<li><div><span>'+esc(group.label)+'</span><strong>'+esc(total?(100*group.total/total).toFixed(1)+'%':'—')+'</strong></div><progress class="workbench-progress" aria-label="'+esc(group.label)+'呼叫占比" max="'+Math.max(1,total)+'" value="'+group.total+'"></progress><span>'+esc(group.total)+' 次</span></li>').join('');
    return '<section class="panel-card" data-source-fragment="MIG-CLOUD-01"><div class="panel-header"><div><h2>业务占比</h2><p>沿当前通话总览的统计周期和筛选，按业务分类的呼叫量统计。</p></div>'+ui.help('业务呼叫量 ÷ 当前筛选呼叫总量。缺少分类归入未分类；与名单量及接通率口径分别计算。','业务占比统计口径')+'</div><div class="panel-body">'+(list?'<ul class="super-business-shares">'+list+'</ul>':ui.empty('当前周期暂无业务占比'))+'</div></section>';
  }
  const reportPage=Pages['report-center'],renderReport=reportPage.render;
  reportPage.render=function(options){return renderReport(options)+businessShare();};
  const agentPage=Pages['agent-center'],openAgent=agentPage.openAgent;
  agentPage.openAgent=function(id){
    const result=openAgent.apply(this,arguments),node=document.getElementById('agent-detail'),row=CloudCallData.agents.find(a=>a.contactCenterIdentityId===id);
    if(current()==='PAGE-2210'&&node?._navigation?.objectKey===id&&row&&seatDetailsAllowed(row.agentRecordId)&&!node.querySelector('[data-source-fragment="MIG-CLOUD-07"]'))node.querySelector('.layer-body')?.insertAdjacentHTML('afterbegin','<div class="panel-header" data-source-fragment="MIG-CLOUD-07"><span>查看已取得的坐席状态及通话记录</span><button class="btn" onclick="DCloudSourceFragments.openSeat('+esc(JSON.stringify(row.agentRecordId))+')">状态与通话</button></div>');
    return result;
  };
  function numberSummary(){
    if(!active()||current()!=='PAGE-2215'||!parent.DSession.allowed('PAGE-2215')||!AppState.isSuper()||!AppState.canMenu('resources.numbers'))return '';
    const enterprise=AppState.get().enterpriseId,rows=CloudCallData.phoneNumbers.filter(n=>n.enterpriseId===enterprise),stopped=n=>n.alictiNumber&&Object.hasOwn(n.alictiNumber,'status')?n.alictiNumber.status===0||n.alictiNumber.status==='0':n.businessStatus==='已隔离';
    return '<section class="panel-card" data-source-fragment="MIG-CLOUD-10"><div class="panel-header"><h2>接入号码</h2></div><div class="panel-body"><div class="kpi-grid">'+ui.kpi('已接入号码',rows.length,'当前云呼叫账号')+ui.kpi('允许本地使用',rows.filter(n=>n.localEnabled!==false).length,'本地使用许可')+ui.kpi('本地已停用',rows.filter(n=>n.localEnabled===false).length,'不修改供应商状态')+ui.kpi('AliCti 已停用',rows.filter(stopped).length,'供应商已确认状态')+'</div></div></section>';
  }
  const numberPage=Pages['resource-lines'],renderNumbers=numberPage.render;
  numberPage.render=function(options){return renderNumbers(options)+numberSummary();};
  window.DCloudSourceFragments={openSeat,workload,businessShare,numberSummary};
})();

/* Refresh native authorization before projecting changes that could clear an active call. */
(function(){
  'use strict';
  const native={};
  for(const name of ['effectiveAccess','canAction','canMenu','canSensitive','authorizeObject'])native[name]=AppState[name];
  const project=window.applyDOrganizationIdentity,restrict=DAdapter.restrictToCurrentCall;
  const clone=value=>JSON.parse(JSON.stringify(value)),owner=DNativeContext.context;
  let depth=0,latest=null,lastValid=null,finish=null;
  const denied=()=>({valid:false,accountId:owner.account.id,roleCode:'',roleId:'',roleLabel:'',tenantId:'',tenantIds:[],enterpriseId:'',enterpriseIds:[],capabilitySet:[],authorizationError:'当前权限暂时无法可靠核对'});
  const identity=call=>call&&[String(call.callId||call.id||''),call.accountId,call.tenantId,String(call.enterpriseId||'')];
  const same=(a,b)=>!!a&&!!b&&!!a[0]&&a.every((value,index)=>value===b[index]);
  // This accessor must not call current()/get()/ensureScope() or any permission query.
  const raw=()=>AgentWorkbench.authorizationSnapshot();
  const own=c=>!!c&&c.account.id===owner.account.id&&c.scope.id===owner.scope.id;
  const executable=c=>own(c)&&c.scope.kind==='tenant'&&c.scope.tenant.modules.cloud===true&&c.scope.grant.modules.includes('cloud')&&['admin','operator'].includes(c.scope.grant.moduleRoles?.cloud);
  function ownerCanExecute(snapshot){
    if(owner.scope.kind!=='tenant')return false;
    const a=snapshot.accounts.find(a=>a.id===owner.account.id),t=snapshot.tenants.find(t=>t.id===owner.scope.id),m=a?.memberships.find(m=>m.tenantId===owner.scope.id);
    return !!(a?.enabled&&t?.enabled&&m?.enabled&&String(t.enterpriseId||'')===String(owner.scope.tenant.enterpriseId||'')&&t.modules.cloud===true&&m.modules.includes('cloud')&&['admin','operator','seat'].includes(m.role));
  }
  function finishing(){
    if(!finish)return false;
    try{const current=raw();return ['connected','wrap'].includes(current.phase)&&same(identity(current.call),finish.identity);}catch(_){return false;}
  }
  const finiteAccess=()=>finishing()?{...clone(finish.access),valid:true,roleCode:'OPERATOR',roleId:'OPERATOR',roleLabel:'本通话有限收尾',limitedToCall:finish.identity[0]}:denied();
  function remember(c){
    if(!executable(c))return;
    const access=native.effectiveAccess.call(AppState);
    if(access?.valid===true&&access.accountId===owner.account.id&&access.tenantId===owner.scope.id&&String(access.enterpriseId||'')===String(c.scope.tenant.enterpriseId||'')&&String(access.enterpriseId||'')===String(owner.scope.tenant.enterpriseId||''))lastValid=clone(access);
  }
  function captureFinish(){
    if(finish)return finishing();
    if(!lastValid?.valid||owner.scope.kind!=='tenant'||typeof restrict!=='function')return false;
    try{
      const current=raw(),target=identity(current.call);
      if(!['connected','wrap'].includes(current.phase)||!target?.[0]||target[1]!==owner.account.id||target[2]!==owner.scope.id||target[3]!==String(owner.scope.tenant.enterpriseId||'')||target[1]!==lastValid.accountId||target[2]!==lastValid.tenantId||target[3]!==String(lastValid.enterpriseId||''))return false;
      finish={identity:target,access:clone(lastValid)};
      // Keep the existing native context until the exact call has saved and signed out.
      if(restrict.call(DAdapter)!==true){finish=null;return false;}
      return true;
    }catch(_){finish=null;return false;}
  }
  function refresh(){
    if(finish)return finishing();
    if(depth)return !!latest;
    latest=null;
    try{
      if(typeof parent.DOrganization?.load!=='function'||typeof parent.DOrganization?.snapshot!=='function'||typeof project!=='function')return false;
      const snapshot=parent.DOrganization.load();
      const current=parent.DSession.context();
      // Never lend a previous call's scope to a different logged-in account or tenant.
      if(current&&!own(current))return false;
      if(!ownerCanExecute(snapshot)&&captureFinish())return true;
      if(!own(current))return false;
      depth++;
      try{project();latest=current;remember(current);return true;}finally{depth--;}
    }catch(_){latest=null;return false;}
  }
  function invoke(name,args,fallback){
    if(!refresh()||finish)return fallback;
    depth++;
    try{return native[name].apply(AppState,args);}catch(_){return fallback;}finally{depth--;}
  }
  AppState.effectiveAccess=function(){
    if(finish)return finiteAccess();
    if(!refresh())return denied();
    if(finish)return finiteAccess();
    depth++;
    try{return native.effectiveAccess.apply(AppState,arguments);}catch(_){return denied();}finally{depth--;}
  };
  AppState.canAction=function(){
    if(finish||!refresh()||finish||latest.scope.grant.moduleRoles?.cloud==='reader')return false;
    depth++;
    try{return native.canAction.apply(AppState,arguments);}catch(_){return false;}finally{depth--;}
  };
  AppState.canMenu=function(){return finish?false:invoke('canMenu',arguments,false);};
  AppState.canSensitive=function(){
    if(finish||!refresh()||finish||latest.scope.grant.moduleRoles?.cloud==='reader')return false;
    depth++;
    try{return native.effectiveAccess.call(AppState)?.valid===true&&native.canSensitive.apply(AppState,arguments);}catch(_){return false;}finally{depth--;}
  };
  AppState.authorizeObject=function(permission,object){
    if(!finish&&!refresh())return false;
    if(finish)return !permission&&finishing()&&same(identity(object),finish.identity);
    depth++;
    try{return native.authorizeObject.apply(AppState,arguments);}catch(_){return false;}finally{depth--;}
  };
  AppState.isBusinessContext=()=>AppState.effectiveAccess().valid===true;
  AppState.scoped=rows=>(rows||[]).filter(row=>AppState.authorizeObject('',row));
  DAdapter.allowLimitedCallInput=target=>!!finish&&finishing()&&!!target?.closest?.('#assigned-call-dialog');
  DAdapter.restrictToCurrentCall=function(){
    if(finish)return finishing()||finish.exitStarted===true&&finish.exited!==true;
    try{
      const snapshot=parent.DOrganization.load();
      const current=parent.DSession.context();
      if(current&&!own(current))return false;
      if(!current&&ownerCanExecute(snapshot))return false;
      return captureFinish();
    }catch(_){return false;}
  };
  // Saving clears the call before asynchronous telephone sign-out settles. Keep a
  // single visible retry control; it can only repeat the existing signOut operation.
  const signOut=AgentWorkbench.signOut;
  let exitPanel=null,exitStatus=null,exitRetry=null;
  function exitContext(){
    if(!finish?.exitStarted||finish.exited)return false;
    try{const current=raw();return current.phase==='idle'&&!current.call;}catch(_){return false;}
  }
  function canRetryExit(){return exitContext()&&finish.exitPending!==true;}
  function renderExit(){
    if(!exitContext()){exitPanel?.remove();return;}
    if(!exitPanel){
      exitPanel=document.createElement('section');exitPanel.id='d-limited-exit-panel';
      exitPanel.setAttribute('role','region');exitPanel.setAttribute('aria-label','电话退出');
      Object.assign(exitPanel.style,{position:'fixed',right:'24px',bottom:'24px',zIndex:'2147483647',maxWidth:'min(420px, calc(100vw - 48px))',padding:'20px',background:'#fff',color:'#172033',border:'1px solid #d6deea',borderRadius:'12px',boxShadow:'0 8px 32px rgba(0,0,0,.18)'});
      exitStatus=document.createElement('p');exitStatus.id='d-limited-exit-status';exitStatus.setAttribute('role','status');exitStatus.setAttribute('aria-live','polite');
      exitRetry=document.createElement('button');exitRetry.id='d-limited-exit-retry';exitRetry.type='button';exitRetry.className='btn btn-primary';
      exitRetry.onclick=()=>{if(canRetryExit())AgentWorkbench.signOut();};
      exitPanel.append(exitStatus,exitRetry);document.body.append(exitPanel);
    }
    const pending=finish.exitPending===true;
    exitStatus.textContent=pending?'本通话记录已保存，正在退出电话。':'本通话记录已保存，电话尚未退出。请重试退出。';
    exitRetry.textContent=pending?'正在退出电话…':'重试退出电话';exitRetry.disabled=pending;
    if(!pending)exitRetry.focus({preventScroll:true});
  }
  DAdapter.allowLimitedExitInput=function(target,event){
    return canRetryExit()&&target===exitRetry&&exitRetry?.isConnected===true&&!exitRetry.disabled&&
      (event?.type!=='keydown'||['Enter',' '].includes(event.key));
  };
  AgentWorkbench.signOut=async function(){
    let completing=false;
    try{const current=finish&&raw();completing=!!current&&current.phase==='idle'&&!current.call;}catch(_){return {ok:false,message:'当前电话退出状态暂时无法核对'};}
    if(!completing)return signOut.apply(this,arguments);
    const closing=finish;
    if(closing.exitPending)return {ok:false,pending:true,message:'电话正在退出，请等待结果'};
    if(closing.exited)return {ok:true};
    closing.exitStarted=true;closing.exitPending=true;closing.exitAttempts=(closing.exitAttempts||0)+1;renderExit();
    try{
      const result=await signOut.apply(this,arguments);closing.exitPending=false;
      if(result?.ok===true){closing.exited=true;renderExit();if(closing.exitAttempts>1)parent.DApp.finishRevoked();}
      else renderExit();
      return result;
    }catch(_){closing.exitPending=false;renderExit();return {ok:false,message:'电话退出尚未确认，请保留当前页面并重试'};}
  };
  // Integration reads and the earlier canAction adapter also use this projection entry.
  window.applyDOrganizationIdentity=refresh;
  // Establish a previous authorization only from a successful, fresh identity check.
  refresh();
})();
