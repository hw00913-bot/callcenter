/* Current eight-column service export, on the original PAGE-2106 financial tool. */
(function(){
  'use strict';
  const headers=['租户名称','租户ID','租户类型','可用分钟','冻结分钟','累计消耗分钟','有效期','呼叫控制状态'];
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function scope(){
    const c=parent.DSession.context();
    if(!c||c.account.id!==DNativeContext.context.account.id||c.scope.id!==DNativeContext.context.scope.id||parent.DSession.roleKey(c)!=='super'||!parent.DSession.can('F56',c)||!parent.DSession.allowed('PAGE-2112'))throw Error('仅超级管理员可导出AI服务汇总。');
    const authorized=parent.DSession.serviceTenantIds('service.export',c),ids=parent.DApp.currentPage()==='PAGE-2112'?window.DNativeServices.exportTenantIds():authorized;
    if(!Array.isArray(ids)||ids.some(id=>!authorized.includes(id)))throw Error('服务导出范围已变化，请重新读取。');
    if(!ids.length)throw Error('当前筛选条件没有可导出的AI服务账户。');return {c,ids};
  }
  function snapshot(){
    window.DNativeServices?.load();
    const {c,ids}=scope(),profiles=window.MockRechargeIteration?.tenants,rows=window.MockTenantRows;
    if(!Array.isArray(profiles)||!Array.isArray(rows))throw Error('服务信息尚未完整读取，未生成文件。');
    return ids.map(id=>{
      const target=parent.DSeed.tenants.find(t=>t.id===id&&t.enabled),aiId=parent.DSeed.aiTenantIds?.[id];
      const matches=profiles.filter(t=>String(t.id)===aiId),native=rows.filter(t=>String(t.tenantId)===aiId);
      if(!target||!aiId||matches.length!==1||native.length!==1)throw Error('租户与AI服务信息尚未准确对应，未生成文件。');
      const p=matches[0],pool=p.unifiedMinutePool,ent=p.entitlement;
      if(!pool||!ent||!['availableMinutes','frozenMinutes','consumedMinutes'].every(k=>Number.isFinite(pool[k])&&pool[k]>=0))throw Error('分钟或服务信息待核对，未生成文件。');
      const controls=(window.MockTenantCallControlStates||[]).filter(x=>String(x.tenantId||'')===aiId||!x.tenantId&&x.tenantName===native[0].name);
      if(controls.length>1||controls.length&&typeof controls[0].enabled!=='boolean')throw Error('呼叫控制状态待核对，未生成文件。');
      const active=RechargeService.status(ent)==='active',manual=controls.length?controls[0].enabled:true;
      const validity=ent.effectiveAt&&ent.expiresAt?ent.effectiveAt+' ~ '+ent.expiresAt:(ent.status==='not_opened'?'未开通':'待核对');
      if(validity==='待核对')throw Error('服务有效期尚未核定，未生成文件。');
      return [target.name,aiId,target.organization,pool.availableMinutes,pool.frozenMinutes,pool.consumedMinutes,validity,active&&pool.availableMinutes>0&&manual?'可发起':'不可发起'];
    });
  }
  function csvCell(value){let s=String(value??'');if(/^[=+@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function buildCsv(){const rows=snapshot();return {count:rows.length,text:'\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\n')};}
  function exportCurrent(){let url='';try{const result=buildCsv();scope();const blob=new Blob([result.text],{type:'text/csv;charset=utf-8;'}),a=document.createElement('a');url=URL.createObjectURL(blob);a.href=url;a.download='AI服务汇总.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('已生成 '+result.count+' 条租户服务记录，请在浏览器下载中保存。','success');return true;}catch(error){if(url)URL.revokeObjectURL(url);showToast(error.message,'warning');return false;}}
  function render(){try{const rows=snapshot();return '<section class="platform-page"><div class="page-title-row"><div><h1>智能服务汇总</h1><p>仅显示当前有权导出的租户服务信息。</p></div></div><div class="filter-panel"><span>共 '+rows.length+' 个有权租户</span><button class="btn btn-primary" onclick="DNativeFinance.exportCurrent()">导出服务汇总</button></div><div class="table-card table-scroll"><table class="platform-table"><thead><tr>'+headers.map(x=>'<th>'+e(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+e(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></section>';}catch(error){return '<section class="platform-page"><h1>智能服务汇总</h1><div class="platform-alert warning">'+e(error.message)+'</div></section>';}}
  window.DNativeFinance={buildCsv,snapshot,exportCurrent,scope};
  Pages['finance-export']={render,init(){}};
  Pages['sys-tenant'].exportTenantBilling=exportCurrent;
})();

/* Approved PAGE-2112 bridge: original service forms + one local transaction journal. */
(function(){
  'use strict';
  const S=window.RechargeService,page=Pages['sys-tenant'],owner=DNativeContext.context;
  const clone=v=>JSON.parse(JSON.stringify(v)),key=parent.DSession.prefix+'ai-service-ledger';
  const data=()=>window.MockRechargeIteration,actions={trial_package:'service.trial',standard_annual:'service.annual',call_credit_pack:'service.credit'};
  let loadedRaw,loadError='',selectedTenant='',readOnlyDrawer=false;
  const emptyServiceFilters=()=>({name:'',commercialFlag:'all',serviceStatus:'all',tenantType:'all'});
  let serviceFilters=emptyServiceFilters();
  const ctx=()=>parent.DSession.context();
  const valid=()=>{const c=ctx();return c&&c.account.id===owner.account.id&&c.scope.id===owner.scope.id;};
  function access(action,aiId){const c=ctx();if(!valid())return null;const fid={'service.view':'F53','service.history':'F53','service.trial':'F54','service.annual':'F54','service.credit':'F54','service.adjust':'F55','service.export':'F56'}[action];if(!fid||!parent.DSession.can(fid,c))return null;const ids=parent.DSession.serviceTenantIds(action,c);if(aiId!==undefined&&!ids.some(id=>parent.DSeed.aiTenantIds[id]===String(aiId)))return null;const account=parent.DSeed.accounts.find(a=>a.id===c.account.id),fixture=parent.DSeed.demoLogin?.accounts?.[c.account.id];return {c,ids,g:{operatorUsername:account?.login&&account.login!==account.id?account.login:fixture?.username||c.account.id}};}
  function readableIds(){return valid()?parent.DSession.serviceTenantIds('service.view',ctx()):[];}
  function read(){const raw=localStorage.getItem(key);if(raw===null)return {raw,doc:{version:1,revision:0,tenants:{}}};const doc=JSON.parse(raw);if(doc?.version!==1||!Number.isSafeInteger(doc.revision)||doc.revision<0||!doc.tenants||Array.isArray(doc.tenants))throw Error('服务账务记录格式待核，原数据已保留。');for(const [id,row] of Object.entries(doc.tenants)){const aiId=parent.DSeed.aiTenantIds[id];if(!aiId||row.tenantId!==id||row.aiTenantId!==aiId||String(row.profile?.id)!==aiId||!row.profile.entitlement||!row.profile.unifiedMinutePool||!['availableMinutes','frozenMinutes','consumedMinutes'].every(k=>Number.isFinite(row.profile.unifiedMinutePool[k])&&row.profile.unifiedMinutePool[k]>=0)||!['rechargeRecords','adjustmentRecords','operationResults'].every(k=>Array.isArray(row[k])&&row[k].every(r=>r&&String(r.tenantId)===aiId)))throw Error('服务账务归属或内容待核，原数据已保留。');}return {raw,doc};}
  // Common tenant metadata is owned by the organization transaction only.
  // Reading a service projects that label; it never creates an account or writes a second ledger.
  function projectTenantMetadata(){
    const profiles=data()?.tenants;if(!Array.isArray(profiles))throw Error('原AI服务资料暂未完整读取。');
    const tenants=parent.DSeed.tenants||[],mapping=parent.DSeed.aiTenantIds||{};
    for(const id of readableIds()){
      const common=tenants.filter(row=>row.id===id);if(common.length!==1)throw Error('当前租户资料无法唯一核对。');
      if(!Object.hasOwn(common[0],'commercialFlag'))continue;
      const flag=common[0].commercialFlag;if(!['commercial','trial'].includes(flag))throw Error('租户商用或试用标记待核，请先核对租户资料。');
      const aiId=mapping[id];if(!aiId)continue;
      const matched=profiles.filter(row=>String(row.id)===aiId);if(matched.length!==1)throw Error('租户与原AI服务账户尚未唯一对应。');
      matched[0].commercialFlag=flag;matched[0].commercialFlagLabel=flag==='commercial'?'商用':'试用';
    }
  }
  function apply(doc){const d=data();for(const id of readableIds()){const row=doc.tenants[id];if(!row)continue;const index=d.tenants.findIndex(t=>String(t.id)===row.aiTenantId);if(index<0)throw Error('原AI服务账户尚未准确对应。');d.tenants[index]=clone(row.profile);for(const field of ['rechargeRecords','adjustmentRecords','operationResults'])d[field]=(d[field]||[]).filter(r=>String(r.tenantId)!==row.aiTenantId).concat(clone(row[field]));}projectTenantMetadata();}
  function load(){try{const state=read();if(state.raw!==loadedRaw)apply(state.doc);projectTenantMetadata();loadedRaw=state.raw;loadError='';return state;}catch(error){loadError=/^[\u4e00-\u9fff]/.test(error.message||'')?error.message:'服务账务暂时无法可靠读取，原数据已保留。';throw Error(loadError);}}
  function take(id){const aiId=parent.DSeed.aiTenantIds[id],p=S.profile(aiId);if(!p)throw Error('原服务账户未能准确读取。');return {tenantId:id,aiTenantId:aiId,profile:clone(p),...Object.fromEntries(['rechargeRecords','adjustmentRecords','operationResults'].map(field=>[field,clone((data()[field]||[]).filter(r=>String(r.tenantId)===aiId))]))};}
  function restore(row){const doc={tenants:{[row.tenantId]:row}};apply(doc);}
  function persist(state,id){if(localStorage.getItem(key)!==state.raw)throw Error('其他窗口已更新账务，请核对当前结果。');const doc=clone(state.doc);doc.revision++;doc.tenants[id]=take(id);const written=JSON.stringify(doc);localStorage.setItem(key,written);try{if(localStorage.getItem(key)!==written)throw Error();loadedRaw=written;return true;}catch(_){return false;}}
  function activate(){const c=ctx(),g=access('service.view'),financial=parent.DApp.currentPage()==='PAGE-2112'&&!!g;const auth=data().authContexts.integrated;if(auth){auth.role=financial||parent.DSession.isPlatformContext(c)&&c?.scope.grant.role==='super'?'super_admin':c?.scope.kind==='tenant'?'tenant_user':'recharge_admin';if(financial){auth.accessibleTenantIds=g.ids.map(id=>parent.DSeed.aiTenantIds[id]);auth.username=g.g.operatorUsername||c.account.id;}}return financial;}
  function updateSummary(){for(const el of document.querySelectorAll?.('[data-service-minutes]')||[]){const id=el.dataset.serviceMinutes;if(access('service.view',parent.DSeed.aiTenantIds[id]))el.textContent=String(S.profile(parent.DSeed.aiTenantIds[id]).unifiedMinutePool.availableMinutes);}for(const el of document.querySelectorAll?.('[data-service-status]')||[]){const id=el.dataset.serviceStatus;if(access('service.view',parent.DSeed.aiTenantIds[id]))el.textContent=S.statusText(S.status(S.profile(parent.DSeed.aiTenantIds[id]).entitlement));}}
  const originalManage=S.mayManage;
  S.mayManage=function(id){return parent.DApp.currentPage()==='PAGE-2112'&&!!access('service.view',id)&&originalManage(id);};
  function transaction(original,action,request){const g=access(action,request?.tenantId);if(!g||parent.DApp.currentPage()!=='PAGE-2112')return {status:'denied',errors:['没有本租户的这项财务操作权限。']};let state,before,id;try{state=load();id=g.ids.find(x=>parent.DSeed.aiTenantIds[x]===String(request.tenantId));before=take(id);}catch(error){return {status:'failed',errors:[error.message]};}const result=original(request);if(!['success','unknown'].includes(result.status))return result;try{if(!access(action,request.tenantId))throw Error('权限已变化，本次未保存。');if(!persist(state,id))return {status:'unknown',errors:['保存结果尚未核定，请核对同次流水，不重复提交。']};if(result.status==='success')updateSummary();return result;}catch(error){restore(before);return {status:'failed',errors:[/^[\u4e00-\u9fff]/.test(error.message||'')?error.message:'本地账务保存失败，修改未提交，请保留填写后重试。']};}}
  const recharge=S.commitRecharge,adjust=S.commitAdjustment,reconcile=S.reconcile;
  S.commitRecharge=request=>transaction(recharge,actions[request?.productType]||'denied',request);
  S.commitAdjustment=request=>transaction(adjust,'service.adjust',request);
  S.reconcile=function(businessKey){let state,row,id,before;try{state=load();row=(data().operationResults||[]).find(r=>r.businessKey===businessKey);if(!row)return {status:'not_found'};const action=row.kind==='adjustment'?'service.adjust':actions[row.request?.productType],g=access(action,row.tenantId);if(!g||parent.DApp.currentPage()!=='PAGE-2112')return {status:'denied',errors:['没有此流水的核对权限。']};id=g.ids.find(x=>parent.DSeed.aiTenantIds[x]===String(row.tenantId));before=take(id);const result=reconcile(businessKey);if(result.status==='success'&&!persist(state,id))return {status:'unknown',errors:['核对结果保存待确认，请继续核对同次流水。']};if(result.status==='success')updateSummary();return result;}catch(error){if(before)restore(before);return {status:'unknown',errors:[error.message||'暂时无法核对，请勿重复办理。']};}};
  function open(commonId){try{const g=access('service.view'),aiId=parent.DSeed.aiTenantIds[commonId];if(!g?.ids.includes(commonId)||!access('service.history',aiId))throw Error('没有此租户的AI服务查看权限。');load();activate();const p=data().tenants.filter(x=>String(x.id)===aiId),rows=(window.MockTenantRows||[]).filter(x=>String(x.tenantId)===aiId),tenant=parent.DSeed.tenants.find(x=>x.id===commonId);if(p.length!==1||rows.length!==1||!tenant)throw Error('租户与原服务账户尚未唯一对应。');if((window.MockTenantRows||[]).some(x=>String(x.tenantId)!==aiId&&x.name===tenant.name)||data().tenants.some(x=>String(x.id)!==aiId&&x.name===tenant.name))throw Error('原服务名称存在冲突，请先核对稳定标识。');rows[0].name=tenant.name;p[0].name=tenant.name;selectedTenant=commonId;document.getElementById('tenantBillingBackdrop')?.remove();readOnlyDrawer=parent.DApp.currentPage()!=='PAGE-2112'||!parent.DSession.can('F54');page.showBillingDrawer(tenant.name);if(readOnlyDrawer){const drawer=document.getElementById('tenantBillingDrawer');drawer?.querySelectorAll('.tenant-recharge-actions,[onclick*="retryRechargeWrite"],[onclick*="retryAdjustmentWrite"]').forEach(n=>n.remove());const title=drawer?.querySelector('.biz-drawer-title'),subtitle=drawer?.querySelector('.tenant-drawer-subtitle');if(title)title.textContent='AI服务账户与充值流水';if(subtitle)subtitle.textContent='查看当前账户的服务信息及已记录流水。';}if(parent.DApp.currentPage()==='PAGE-2112')parent.DApp.saveFilters({serviceTenantId:commonId,serviceFilters:clone(serviceFilters)});return true;}catch(error){showToast(error.message,'warning');return false;}}
  function canReadDrawer(name){if(!readOnlyDrawer||!valid()||!selectedTenant||!access('service.history',parent.DSeed.aiTenantIds[selectedTenant]))return false;return parent.DSeed.tenants.some(t=>t.id===selectedTenant&&t.name===name);}
  function drawerHtml(profile,content){if(!readOnlyDrawer)return content;if(String(profile.id)!==parent.DSeed.aiTenantIds[selectedTenant]||!access('service.history',profile.id))throw Error('服务查看范围已变化，请重新打开。');const box=document.createElement('div');box.innerHTML=content;box.querySelectorAll('.tenant-recharge-actions,[onclick*="retryRechargeWrite"],[onclick*="retryAdjustmentWrite"]').forEach(n=>n.remove());const title=box.querySelector('.biz-drawer-title'),subtitle=box.querySelector('.tenant-drawer-subtitle');if(title)title.textContent='AI服务账户与充值流水';if(subtitle)subtitle.textContent='查看当前账户的服务信息及已记录流水。';return box.innerHTML;}
  const financeMethods=new Set(['showBillingDrawer','retryRechargeOverview','openRechargeForm','closeRechargeForm','updateRechargePreview','submitRechargeForm','simulateRechargeWriteFailure','simulateRechargeConflict','simulateRechargeUnknown','retryRechargeWrite','openIterationAdjustmentForm','closeIterationAdjustmentForm','updateIterationAdjustmentPreview','submitIterationAdjustment','simulateAdjustmentConflict','simulateAdjustmentFailure','simulateAdjustmentUnknown','retryAdjustmentWrite','closeBillingDrawer','switchBillingTab','onAuthChanged']);
  Object.keys(page).forEach(name=>{if(typeof page[name]!=='function')return;const fn=page[name];page[name]=function(...args){if(parent.DApp.currentPage()==='PAGE-2112'&&!financeMethods.has(name)){showToast('此入口只办理已授权的服务与充值业务。','warning');return false;}if(parent.DApp.currentPage()==='PAGE-2112'&&!access('service.view')){showToast('服务权限已变化，请重新进入。','warning');return false;}if(/^(?:openRechargeForm|openIterationAdjustmentForm|submitRechargeForm|submitIterationAdjustment|retryRechargeWrite|retryAdjustmentWrite|simulate)/.test(name)&&(parent.DApp.currentPage()!=='PAGE-2112'||!parent.DSession.can(name.includes('Adjustment')?'F55':'F54'))){showToast('当前没有此服务办理权限。','warning');return false;}if(name==='openRechargeForm'&&!access(actions[args[0]]||'denied',document.getElementById('tenantBillingDrawer')?.dataset.tenantId))return false;if(name==='openIterationAdjustmentForm'&&!access('service.adjust',document.getElementById('tenantBillingDrawer')?.dataset.tenantId))return false;return fn.apply(this,args);};});
  function checkedServiceFilters(input={}){
    const next={name:String(input.name||'').trim(),commercialFlag:input.commercialFlag||'all',serviceStatus:input.serviceStatus||'all',tenantType:input.tenantType||'all'};
    if(next.name.length>50||!['all','commercial','trial'].includes(next.commercialFlag)||!['all','not_opened','pending','active','expired','invalid'].includes(next.serviceStatus)||!['all','总部','门店'].includes(next.tenantType))throw Error('服务筛选条件待核，请重置后重试。');return next;
  }
  function serviceUpdated(row){
    const charges=[...(data().rechargeRecords||[]),...(data().adjustmentRecords||[])].filter(entry=>String(entry.tenantId)===String(row.profile.id));
    return DListOrder.time({profile:row.profile,tenant:row.tenant,charges},{
      keys:[...DListOrder.updateKeys.map(key=>'profile.'+key),...DListOrder.updateKeys.map(key=>'tenant.'+key),'charges[].updatedAt','charges[].operatedAt'],
      fallbackKeys:['profile.createdAt','profile.createTime','tenant.createdAt']
    });
  }
  function serviceRows(g){
      const source=g.ids.map(id=>{const profiles=data().tenants.filter(row=>String(row.id)===parent.DSeed.aiTenantIds[id]),tenants=parent.DSeed.tenants.filter(row=>row.id===id);if(profiles.length!==1||tenants.length!==1)throw Error('租户与AI服务资料尚未唯一对应。');return {id,profile:profiles[0],tenant:tenants[0]};});
      return DListOrder.rows(source.filter(({profile:p,tenant:t})=>(!serviceFilters.name||t.name.includes(serviceFilters.name))&&(serviceFilters.commercialFlag==='all'||p.commercialFlag===serviceFilters.commercialFlag)&&(serviceFilters.serviceStatus==='all'||S.status(p.entitlement)===serviceFilters.serviceStatus)&&(serviceFilters.tenantType==='all'||t.organization===serviceFilters.tenantType)).map(row=>({...row,_serviceUpdatedAt:serviceUpdated(row)})),{keys:['_serviceUpdatedAt']});
  }
  function exportTenantIds(){const g=access('service.export');if(!g||!parent.DSession.can('F56'))throw Error('仅超级管理员可导出AI服务汇总。');load();serviceFilters=checkedServiceFilters(serviceFilters);return serviceRows(g).map(row=>row.id);}
  function render(){
    try{
      const g=access('service.view');if(!g)throw Error('没有AI服务管理权限。');load();serviceFilters=checkedServiceFilters(serviceFilters);const esc=parent.DUI.esc;
      const choices=(id,label,options,current)=>'<label class="field"><span>'+label+'</span><select id="'+id+'">'+options.map(([value,text])=>'<option value="'+value+'" '+(value===current?'selected':'')+'>'+text+'</option>').join('')+'</select></label>';
      const filters='<div class="filter-panel"><label class="field"><span>租户名称</span><input id="d-service-name" maxlength="50" value="'+esc(serviceFilters.name)+'" placeholder="请输入租户名称"></label>'+choices('d-service-commercial','商用/试用',[['all','全部'],['commercial','商用'],['trial','试用']],serviceFilters.commercialFlag)+choices('d-service-status','服务状态',[['all','全部'],['not_opened','未开通'],['pending','待生效'],['active','有效'],['expired','已过期'],['invalid','区间异常']],serviceFilters.serviceStatus)+choices('d-service-type','租户类型',[['all','全部'],['总部','总部'],['门店','门店']],serviceFilters.tenantType)+'<button class="btn" onclick="DNativeServices.resetFilters()">重置</button><button class="btn btn-primary" onclick="DNativeServices.query()">查询</button></div>';
      const rows=serviceRows(g);
      const body=rows.map(({id,profile:p,tenant:t})=>{const ent=p.entitlement,pool=p.unifiedMinutePool;if(!pool||!ent)throw Error('服务信息尚未完整读取。');const validity=ent.effectiveAt&&ent.expiresAt?S.format(ent.effectiveAt)+' 至 '+S.format(ent.expiresAt):S.status(ent)==='not_opened'?'未开通':'待核';return '<tr><td>'+esc(t.name)+'</td><td>'+esc(p.commercialFlag==='commercial'?'商用':p.commercialFlag==='trial'?'试用':'待核')+'</td><td data-service-status="'+esc(id)+'">'+esc(S.statusText(S.status(ent)))+'</td><td>'+esc(validity)+'</td><td data-service-minutes="'+esc(id)+'">'+esc(pool.availableMinutes)+'</td><td>'+esc(pool.frozenMinutes)+'</td><td>'+esc(t.organization)+'</td><td>'+esc(p.id)+'</td><td><button class="btn" onclick="DNativeServices.open('+esc(JSON.stringify(id))+')">充值管理</button></td></tr>';}).join('')||'<tr><td colspan="9"><div class="empty-state compact">'+(g.ids.length?'没有符合当前筛选条件的AI服务账户。':'暂无已关联且可用的AI服务账户，请先核对租户账户关联。')+'</div></td></tr>';
      return '<section class="platform-page"><div class="page-title-row"><div><h1>AI充值管理</h1><p>选择租户，查看AI服务、分钟余额及充值记录。</p></div>'+(parent.DSession.can('F56')?'<button class="btn" onclick="DNativeFinance.exportCurrent()">导出服务汇总</button>':'')+'</div>'+filters+'<div class="table-card table-scroll"><table class="platform-table"><thead><tr><th>租户</th><th>商用/试用</th><th>服务状态</th><th>有效期</th><th>可用分钟</th><th>冻结分钟</th><th>租户类型</th><th>AI租户ID</th><th>操作</th></tr></thead><tbody>'+body+'</tbody></table></div><p class="field-hint">共 '+rows.length+' 条</p></section>';
    }catch(error){return '<section class="platform-page"><h1>AI充值管理</h1><div class="platform-alert warning">'+parent.DUI.esc(error.message)+'</div><button class="btn" onclick="DNativeServices.retry()">重新读取</button></section>';}
  }
  function queryServices(reset=false){
    try{if(!access('service.view'))throw Error('当前没有AI服务管理权限。');serviceFilters=checkedServiceFilters(reset?emptyServiceFilters():{name:document.getElementById('d-service-name')?.value,commercialFlag:document.getElementById('d-service-commercial')?.value,serviceStatus:document.getElementById('d-service-status')?.value,tenantType:document.getElementById('d-service-type')?.value});selectedTenant='';document.getElementById('page-content').innerHTML=render();parent.DApp.saveFilters({serviceTenantId:'',serviceFilters:clone(serviceFilters)});return true;}catch(error){showToast(error.message,'warning');return false;}
  }
  Pages['finance-service']={render,init(){if(selectedTenant)open(selectedTenant);}};
  const navigate=DAdapter.navigate,filters=DAdapter.getFilters,leave=DAdapter.beforeLeave;
  DAdapter.navigate=function(route,options={}){activate();try{load();}catch(_){}if(route==='finance-service'){selectedTenant=options.serviceTenantId||'';try{serviceFilters=checkedServiceFilters(options.serviceFilters||serviceFilters);}catch(_){serviceFilters=emptyServiceFilters();}}return navigate(route,options);};
  DAdapter.getFilters=function(){return parent.DApp.currentPage()==='PAGE-2112'?{serviceTenantId:selectedTenant,serviceFilters:clone(serviceFilters)}:filters();};
  DAdapter.beforeLeave=function(next,proceed){if(parent.DApp.currentPage()==='PAGE-2112'&&document.querySelector('#rechargeFormModal,#iterationAdjustmentModal'))return parent.DUI.toast('请先完成、核对或关闭当前财务表单，再离开。');return leave(next,proceed);};
  const exportSnapshot=DNativeFinance.snapshot,exportCsv=DNativeFinance.buildCsv;
  DNativeFinance.snapshot=function(){load();return exportSnapshot();};DNativeFinance.buildCsv=function(){load();return exportCsv();};
  window.DNativeServices={access,load,open,render,key,canReadDrawer,drawerHtml,exportTenantIds,openCurrent(){const id=ctx()?.scope.tenant?.id;if(!id)return showToast('请先选择业务租户。','warning');return open(id);},query:queryServices,resetFilters:()=>queryServices(true),retry(){if(!access('service.view'))return false;const host=document.getElementById('page-content');if(!host)return false;host.innerHTML=render();return true;}};
  try{load();}catch(_){}
})();
