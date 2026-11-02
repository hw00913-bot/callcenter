/* New integration boundary around unchanged original AI page controllers. */
(function () {
  'use strict';
  const boot=DNativeContext;
  const routeMap=boot.routeMap;
  let activeRoute='', dirty=false;
  const originalProfileNames=new Map((window.MockRechargeIteration?.tenants||[]).map(row=>[String(row.id),row.name]));
  const host=()=>parent.DModuleHost;
  function contextValid() {const c=parent.DSession.context();return c&&c.account.id===boot.context.account.id&&c.scope.id===boot.context.scope.id;}
  function applyFixtureContext() {
    const data=window.MockRechargeIteration;
    if(!data)return;
    // Approved independent finance profiles, never cloned from an existing ledger.
    if(boot.context.account.id==='SYN-FIN-ADMIN-1028'){
      (parent.DSeed.financialAcceptanceFixtures||[]).forEach(f=>{
        if(!data.tenants.some(t=>String(t.id)===f.aiId))data.tenants.push({id:f.aiId,name:f.name,type:'门店',commercialFlag:f.commercialFlag,commercialFlagLabel:f.commercialFlag==='trial'?'试用':'商用',entitlement:{productType:'',status:'not_opened',effectiveAt:'',expiresAt:'',durationDays:0},unifiedMinutePool:{availableMinutes:0,frozenMinutes:0,consumedMinutes:0,accountVersion:f.id+'-MP-0'},rechargeState:'empty_history',usageState:'empty'});
        if(!window.MockTenantRows.some(t=>String(t.tenantId)===f.aiId))window.MockTenantRows.push({no:window.MockTenantRows.length+1,name:f.name,consumedAmount:0,type:'门店',tenantId:f.aiId,desc:'独立本地验收',status:'启用',updater:'synthetic-fin-admin-1028',updateTime:''});
      });
    }
    // Explicit fixture correspondence, not a claim of matching production IDs.
    const fixtures=parent.DSeed.aiTenantIds||{};
    const s=boot.context.scope, fixture=fixtures[s.id];
    const auth={id:boot.context.account.id,username:boot.context.account.id,displayName:boot.context.account.name,role:parent.DSession.isPlatformContext(boot.context)&&s.grant.role==='super'?'super_admin':s.kind==='tenant'?'tenant_user':'recharge_admin',currentTenantId:fixture||null,accessibleTenantIds:fixture?[fixture]:[]};
    if(s.kind==='platform')auth.accessibleTenantIds=(s.grant.tenantIds||[]).map(id=>fixtures[id]).filter(Boolean);
    data.authContexts.integrated=auth;data.activeAuthKey='integrated';
    const t=data.tenants.find(t=>String(t.id)===fixture);if(t)t.name=s.label;
    // Original no-tenant task fixtures are instantiated separately in this scope.
    (window.MockSceneList||[]).forEach(row=>{row.integrationTenantId=s.id;});
  }
  applyFixtureContext();
  // The retired home keeps its original source-fragment rights inside usage.
  // Super-admin's home is a management shortcut, never tenant daily/task usage.
  const usageRender=Pages.usage?.render;
  if(usageRender)Pages.usage.render=function(){
    const c=parent.DSession.context(),esc=parent.DUI.esc;
    if(!contextValid()||!parent.DSession.allowed('PAGE-2102'))return '<div class="usage-page"><div class="usage-state-card"><h2>当前使用范围已变化</h2><p>请重新进入有权的AI服务页面。</p></div></div>';
    if(parent.DSession.isPlatformContext(c)&&c.scope.grant.role==='super')return Pages.home.render().replace(/平台工作台/g,'AI服务与用量')
      .replace('在租户管理中维护租户套餐、服务有效期及充值记录。','查看服务账户与充值流水，或进入AI充值管理办理套餐、服务期与分钟调整。')
      .replace("window.Nav.navigateTo('sys-tenant', 'sys-tenant')","parent.DApp.openPage('PAGE-2112')")
      .replace('进入租户管理','进入AI充值管理');
    if(c.scope.kind!=='tenant')return usageRender.apply(this,arguments);
    const aiId=parent.DSeed.aiTenantIds?.[c.scope.id];
    if(!aiId)return '<div class="usage-page"><div class="usage-state-card"><h2>尚未关联AI服务账户</h2><p>请联系管理员完成当前租户的AI账户关联后查看套餐与用量。</p></div></div>';
    try{
      window.DNativeServices?.load();
      const data=window.MockRechargeIteration,auth=data?.authContexts?.[data.activeAuthKey],matches=(data?.tenants||[]).filter(row=>String(row.id)===aiId);
      if(auth?.role!=='tenant_user'||String(auth.currentTenantId)!==aiId||!(auth.accessibleTenantIds||[]).some(id=>String(id)===aiId)||matches.length!==1)return usageRender.apply(this,arguments);
      const tenant=matches[0],status=RechargeService.status(tenant.entitlement),pool=tenant.unifiedMinutePool,controls=(window.MockTenantCallControlStates||[]).filter(row=>String(row.tenantId||'')===aiId||!row.tenantId&&row.tenantName===originalProfileNames.get(aiId));
      let callStatus='暂不可外呼',hint='请联系管理员核对或开通有效套餐';
      if(!pool||!Number.isFinite(pool.availableMinutes)||pool.availableMinutes<0||controls.length>1||controls.length&&typeof controls[0].enabled!=='boolean'){callStatus='状态待核';hint='服务分钟或呼叫控制状态尚未核定，请联系管理员核对。';}
      else if(status==='pending')hint='服务尚未开始，待生效期间不能发起新外呼';
      else if(status==='expired')hint='服务已过期，请联系管理员处理';
      else if(status==='active'&&pool.availableMinutes<=0)hint='可用分钟不足，请联系管理员充值';
      else if(status==='active'&&controls[0]?.enabled===false)hint='外呼已被管理员暂停';
      else if(status==='active'){callStatus='可发起外呼';hint='服务有效且可用分钟充足';}
      const body=usageRender.apply(this,arguments);
      if(!body.includes('usage-overview'))return body;
      const summary='<section class="usage-daily-card" data-ai-call-control-summary><div class="usage-section-heading"><div><h2>呼叫状态</h2><p>'+esc(hint)+'</p></div><span class="tenant-call-status '+(callStatus==='可发起外呼'?'tenant-call-status-ok':'tenant-call-status-disabled')+'">'+esc(callStatus)+'</span></div></section>';
      return body.replace('<section class="usage-daily-card"',summary+'<section class="usage-daily-card"');
    }catch(error){return '<div class="usage-page"><div class="usage-state-card"><h2>AI服务信息暂时无法读取</h2><p>'+esc(error.message||'请保留原资料后重试。')+'</p></div></div>';}
  };
  const usageWithSummary=Pages.usage?.render;
  if(usageWithSummary)Pages.usage.render=function(){const body=usageWithSummary.apply(this,arguments);return parent.DSession.can('F53')?'<div class="list-toolbar"><button class="btn" onclick="DNativeServices.openCurrent()">服务账户与充值流水</button></div>'+body:body;};
  const original=Nav.navigateTo;
  function navigate(route, options) {
    if(!contextValid())return false;
    if(boot.context.scope.kind==='platform'&&boot.context.scope.grant.role==='finance'&&route!=='finance-export')return false;
    const id=routeMap[route];if(id&&!parent.DSession.allowed(id))return false;
    if(['sys-scene','sys-tags','scene-list'].includes(route)&&window.DAIConfigStore&&!DAIConfigStore.ready()){document.getElementById('page-content').textContent=DAIConfigStore.error();DAIConfigStore.banner();activeRoute=route;return true;}
    if(route==='scene-block'&&(options?.blacklistPosition||options?.specialPosition))Pages['scene-block'].integrationRestorePosition(options.blacklistPosition||options.specialPosition);original(route,route);activeRoute=route;
    if(route==='scene-block'&&options?.blacklistPrefill)Pages['scene-block'].integrationPrefill(options.blacklistPrefill);
    if(route==='result-records'&&options?.sourceCallRef)requestAnimationFrame(()=>Pages['result-records'].openByReference(options.sourceCallRef.id,options.sourceCallRef.platform));
    if(false&&route==='sys-tags'&&options?.commonCategoryId)requestAnimationFrame(()=>Pages['sys-tags'].openSceneModal({categoryId:options.commonCategoryId,categoryScope:options.categoryScope,sceneIds:options.sceneIds||[]}));
    if(options?.nativeFilterValues){document.querySelectorAll('#page-content .filter-bar input,#page-content .filter-bar select').forEach((input,index)=>{if(Object.hasOwn(options.nativeFilterValues,index))input.value=options.nativeFilterValues[index];});if(Pages[route]?.doQuery)Pages[route].doQuery();else if(route==='report-billing')Pages[route]?.query?.();}
    return true;
  }
  Nav.navigateTo=function(route){if(route==='scene-block'&&parent.DModuleHost.isReady('ai')&&parent.DModuleHost.isActive('ai')&&parent.DApp.currentPage()!=='PAGE-2007')return parent.DContacts.showSpecial();const id=routeMap[route];if(id&&id!==parent.DApp.currentPage()&&parent.DModuleHost.isReady('ai')&&parent.DModuleHost.isActive('ai'))return parent.DApp.openPage(id);return navigate(route);};
  // Read-only fixture roles retain queries/detail controls; native mutators are denied.
  const mutations=/^(save|submit|delete|remove|create|update|start|stop|pause|resume|doStart|handleFile|onMenuAction)/i;
  Object.entries(Pages).forEach(([route,page])=>Object.keys(page).forEach(name=>{
    if(typeof page[name]!=='function'||!mutations.test(name))return;
    const method=page[name];page[name]=function(){const target=route==='scene-block'?'PAGE-2007':routeMap[route]||parent.DApp.currentPage(),sourceConfirmation=route==='scene-block'&&name==='submitNumber'&&parent.DContactPolicy.canSpecial(parent.DContactPolicy.specialScope(),'record.confirm');if(!contextValid()||!parent.DSession.canWrite(target)&&!sourceConfirmation){showToast('当前账号没有此操作权限','warning');return false;}return method.apply(this,arguments);};
  }));
  // Recording playback is a scoped read operation, independent of page editing.
  const recordAudio=Pages['result-records'];
  recordAudio.integrationCanPlayAudio=function(){return contextValid()&&parent.DApp.currentPage()==='PAGE-2108'&&parent.DSession.allowed('PAGE-2108')&&parent.DSession.can('F31');};
  ['toggleAudio','seekAudio'].forEach(name=>{
    const originalAudio=recordAudio[name];
    recordAudio[name]=function(){if(!recordAudio.integrationCanPlayAudio()){showToast('当前没有此通话录音的查看权限，请重新核对使用范围。','warning');return false;}return originalAudio.apply(this,arguments);};
  });
  const sourceSpecialExport=Pages['scene-block'].exportRows;
  Pages['scene-block'].exportRows=function(){const scope=parent.DContactPolicy.specialScope();if(!contextValid()||!parent.DContactPolicy.canSpecial(scope,'record.export')){showToast('当前没有此租户黑名单的导出权限','warning');return false;}return sourceSpecialExport.apply(this,arguments);};
  function getFilters(){if(activeRoute==='scene-block')return {blacklistPosition:Pages['scene-block'].integrationPosition()};const values={};document.querySelectorAll('#page-content .filter-bar input,#page-content .filter-bar select').forEach((input,index)=>{values[index]=input.value;});return {nativeFilterValues:values};}
  Pages['scene-list'].integrationResetFilters=function(){
    if(!contextValid()||activeRoute!=='scene-list'||parent.DApp.currentPage()!=='PAGE-2103'||!parent.DSession.allowed('PAGE-2103'))return false;
    const bar=document.querySelector('#page-content .scene-list-page .filter-bar');if(!bar)return false;
    bar.querySelectorAll('input:not([type="checkbox"])').forEach(input=>{input.value='';});
    bar.querySelectorAll('select').forEach(select=>{select.selectedIndex=0;});
    Pages['scene-list'].doQuery();parent.DApp.saveFilters(getFilters());return true;
  };
  ['input','change'].forEach(name=>document.addEventListener(name,event=>{if(event.target.closest('.import-modal-backdrop,.intent-config-backdrop,.biz-dialog-backdrop,.biz-drawer-backdrop'))dirty=true;}));
  window.DAdapter={navigate,ready:true,getFilters,beforeLeave(next,proceed){
    if(activeRoute==='scene-list'&&document.getElementById('intentConfigBackdrop')){
      const guard=Pages['scene-list'].integrationIntentGuard();
      if(guard.isDirty()){parent.DApp.setDraftGuard(guard);proceed();return;}
      if(Pages['scene-list'].closeIntentConfig()===false)return;
      dirty=false;
    }
    if(activeRoute==='sys-scene'&&Pages['sys-scene'].integrationSceneGuard){
      const guard=Pages['sys-scene'].integrationSceneGuard();
      if(guard.isDirty()){parent.DApp.setDraftGuard(guard);proceed();return;}
      dirty=false;
    }
    if(window.DAIConfigStore?.guard().isDirty())parent.DApp.setDraftGuard(DAIConfigStore.guard());
    if(activeRoute==='scene-block')parent.DApp.setDraftGuard(Pages['scene-block'].integrationGuard());
    if(!document.querySelector('.import-modal-backdrop,.intent-config-backdrop,.biz-dialog-backdrop,.biz-drawer-backdrop'))dirty=false;
    if(dirty){parent.DUI.toast('请先保存或关闭当前编辑内容，再离开。');return;}proceed();
  }};
  document.addEventListener('DOMContentLoaded',()=>{applyFixtureContext();host().ready('ai',window);});
})();



(function(){
  // Only reviewed read handlers may pass. Labels and role=tab never grant access.
  const readers={
    'scene-list':new Set(['showDetail','closeDetail','switchMainTab','switchSubTab','switchCallRecordTab','showCallRecordList','closeCallRecordList','showCallRecordDetail','closeCallRecordDetail','toggleFocus','doQuery','integrationResetFilters','closeImportModal','closeIntentConfig']),
    'result-records':new Set(['showDetail','closeDetail','switchDetailTab','doQuery','resetFilters','toggleExpand','toggleSort']),
    'report-call':new Set(['switchTab','doQuery','resetFilters']),
    'report-clue':new Set(['switchTab','switchSubTab','changePage','prevPage','nextPage','changePageSize','jumpPage','doQuery','doRefresh','resetFilter','toggleMultiSelect','handleAllOptions','handleOptionItem']),
    'result-clue':new Set(['showCustomerTags','showClueDetail','closeModal','doQuery','resetFilters','toggleExpand']),
    'scene-block':new Set(['applyFilters','resetFilters','selectGroup','setGroupKeyword','openRecordDetail','openPlatformDetail','openSyncSettings','integrationReload','closeModal','clearSelection','toggleAllRows','toggleRowSelection']),
    usage:new Set(['openDailyDetail','backToDailyList','retryTaskDetail','retry']),
    'report-billing':new Set(['query','resetFilters','refresh','showDetail','showCallDetail','closeDetail','closeCallDetail']),
    'sys-tenant':new Set(['showBillingDrawer','retryRechargeOverview','closeBillingDrawer','switchBillingTab']),
    home:new Set(['retry'])
  };
  function readHandler(handler){
    if(/^DNativeServices\.openCurrent\(\);?$/.test(handler.trim()))return parent.DSession.can('F53');
    if(handler.trim()==="parent.DApp.openPage('PAGE-2112')"){
      const c=parent.DSession.context(),owner=DNativeContext.context;
      return c?.account.id===owner.account.id&&c?.scope.id===owner.scope.id&&parent.DApp.currentPage()==='PAGE-2102'&&parent.DSession.isGlobalAdministrator()&&parent.DSession.allowed('PAGE-2112');
    }
    const strings=[];
    // Remove string contents before checking calls; semicolons in row JSON stay data.
    const code=handler.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,value=>'__str'+(strings.push(value)-1)+'__');
    const parts=code.split(';').map(x=>x.trim()).filter(Boolean);
    if(!parts.length)return false;
    return parts.every(part=>{
      if(/^event\.(preventDefault|stopPropagation)\(\)$/.test(part))return true;
      const roster=/^(?:return\s+)?(?:window\.)?DTaskRosterView\.(refresh|setPage|openDetails|closeDetails)\(([\s\S]*)\)$/.exec(part);
      if(roster){const args=roster[2].replace(/__str\d+__/g,'0').replace(/\b(?:this|event|true|false|null|undefined)\b/g,'0').replace(/\b[A-Za-z_]\w*\s*:/g,':');return /^[\s\d.,:+\-\[\]{}]*$/.test(args);}
      const match=/^(?:return\s+)?(?:window\.)?Pages(?:\[__str(\d+)__\]|\.(\w+))\.(\w+)\(([\s\S]*)\)$/.exec(part);
      if(!match)return part==='doRefresh()';
      const route=match[1]===undefined?match[2]:strings[Number(match[1])]?.slice(1,-1),method=match[3];
      const args=match[4].replace(/__str\d+__/g,'0').replace(/\b(?:this|event|true|false|null|undefined)\b/g,'0').replace(/\b[A-Za-z_]\w*\s*:/g,':');
      if(!/^[\s\d.,:+\-\[\]{}]*$/.test(args))return false; // No nested calls or executable expressions.
      if(route==='result-records'&&['toggleAudio','seekAudio'].includes(method))return Pages['result-records'].integrationCanPlayAudio()===true;
      if(route==='result-records'&&method==='confirmRefusal')return parent.DContactPolicy.canPublic(parent.DSession.context()?.scope.id,'add');
      if(route==='scene-block'&&method==='submitNumber')return parent.DContactPolicy.canSpecial(parent.DContactPolicy.specialScope(),'record.confirm');
      return readers[route]?.has(method)===true;
    });
  }
  document.addEventListener('click',event=>{
    const el=event.target.closest('button,a,[onclick]');if(!el)return;
    const handler=el.getAttribute('onclick')||'';
    const recording=/(?:^|;)\s*(?:return\s+)?(?:window\.)?Pages\[['"]result-records['"]\]\.(?:toggleAudio|seekAudio)\s*\(/.test(handler);
    if(recording){
      if(readHandler(handler))return;
      event.preventDefault();event.stopImmediatePropagation();showToast('当前没有此通话录音的查看权限，请重新核对使用范围。','warning');return;
    }
    if(parent.DSession.canWrite(parent.DApp.currentPage()))return;
    if(readHandler(handler))return;
    event.preventDefault();event.stopImmediatePropagation();showToast('当前账号为只读权限','warning');
  },true);
})();
