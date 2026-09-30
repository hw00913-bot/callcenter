/** Numbers belong to the sole tenant of their AliCti account; supplier permissions remain separate. */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape;
  let detail=null;
  const filters={numbers:{keyword:'',status:'全部状态'}},pages={numbers:1},pageSize=8;
  const numberStateKey='cloud-number-resource-state-v1';
  const stateFields=['updatedAt','localEnabled','businessStatus','status','usage','aliyunUsage','contactFlowId','authorizedTenantIds','restoreSnapshot','alictiNumber'];
  let savedNumbers=[];
  const number=id=>CloudCallData.phoneNumbers.find(n=>n.numberId===id);
  const context=()=>{const s=AppState.get();return [s.accountId,s.sessionId,s.tenantId,s.enterpriseId,s.activeDomain,AppState.effectiveAccess().roleCode].join('|');};
  const can=()=>AppState.effectiveAccess().valid&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.isSuper()&&AppState.canMenu('resources.numbers');
  const canManageNumber=row=>can()&&!!row&&row.enterpriseId===AppState.get().enterpriseId;
  const command=(method,...args)=>esc(`window.Pages['resource-lines'].${method}(${args.map(v=>JSON.stringify(v)).join(',')})`);
  const tenantNames=ids=>(ids||[]).map(id=>CloudCallRuntime.tenant(id)?.name||id).join('、');
  const inboundOnly=row=>String(row.number||'').startsWith('400')||String(row.alictiNumber?.hotline||'').startsWith('400');
  const usageText=row=>inboundOnly(row)?'仅呼入':row.usage||'—';
  const usageCell=row=>esc(usageText(row));
  const stale=()=>showToast('当前工作范围或登录状态已变化，请重新打开号码详情','warning');
  function validDetail(id){return !!detail&&detail.id===id&&detail.context===context()&&!!document.getElementById('number-detail')&&canManageNumber(number(id));}
  function actionAllowed(row,key){if(!canManageNumber(row)||key&&key!==context()){stale();return false;}return true;}
  function outbound(row){return !inboundOnly(row)&&row.aliyunUsage!=='Inbound'&&String(row.usage).includes('呼出')&&(!row.alictiNumber||['isInUse','isPredictiveLeft','isSipLeft','isWebCallLeft'].some(k=>Number(row.alictiNumber[k])===1));}
  // Restore supported fields only; obsolete skill bindings do not affect number state.
  try{
    const rows=JSON.parse(sessionStorage.getItem(numberStateKey)||'[]');
    if(Array.isArray(rows))savedNumbers=rows.filter(saved=>{
      const row=number(saved?.numberId);
      return row&&(!Object.hasOwn(saved,'localEnabled')||typeof saved.localEnabled==='boolean')&&saved.enterpriseId===row.enterpriseId&&['正常','已隔离','待配置'].includes(saved.businessStatus)&&Array.isArray(saved.authorizedTenantIds)&&saved.authorizedTenantIds.length===1&&saved.authorizedTenantIds[0]===boundTenant(row)?.tenantId&&saved.authorizedTenantIds.every(id=>CloudCallRuntime.tenant(id)?.enterpriseId===row.enterpriseId)&&(saved.businessStatus!=='已隔离'||row.importedFrom==='ALICTI'&&Number(saved.alictiNumber?.status)===0||saved.restoreSnapshot&&Array.isArray(saved.restoreSnapshot.authorizedTenantIds)&&saved.restoreSnapshot.authorizedTenantIds.every(id=>CloudCallRuntime.tenant(id)?.enterpriseId===row.enterpriseId));
    }).map(saved=>Object.fromEntries(['numberId','enterpriseId',...stateFields].filter(key=>Object.hasOwn(saved,key)).map(key=>[key,structuredClone(saved[key])])));
    savedNumbers.forEach(saved=>{
      stateFields.forEach(key=>{if(Object.hasOwn(saved,key))number(saved.numberId)[key]=structuredClone(saved[key]);});
    });
  }catch(error){}
  CloudCallData.phoneNumbers.forEach((n,i)=>{
    // Current numbers allow local use by default; supplier state and grants are separate gates.
    if(typeof n.localEnabled!=='boolean')n.localEnabled=true;
    if(n.alictiNumber||n.businessStatus==='待配置')return;
    const inbound=String(n.number).startsWith('400'),hotline=inbound?'400000'+String(1000+i):'0210000'+String(1000+i);
    n.alictiNumber={id:960000+i,hotline,displayNumber:hotline,numberType:inbound?1:2,status:n.businessStatus==='已隔离'?0:1,isIbRight:1,isInUse:n.usage.includes('呼出')?1:0,isPredictiveLeft:n.usage.includes('呼出')?1:0,isPredictiveRight:0,isPreviewRight:0,isIntl:0,isSipLeft:0,isWebCallLeft:0,isWebCallRight:0};
    n.numberEvidence='独立模拟响应，非真实号码资源';
  });
  function persistNumber(row,changes){
    changes={...changes,updatedAt:new Date().toISOString()};
    const saved={numberId:row.numberId,enterpriseId:row.enterpriseId};
    stateFields.forEach(key=>saved[key]=structuredClone(Object.hasOwn(changes,key)?changes[key]:row[key]));
    const rows=savedNumbers.filter(n=>n.numberId!==row.numberId||n.enterpriseId!==row.enterpriseId).concat(saved);
    try{sessionStorage.setItem(numberStateKey,JSON.stringify(rows));}
    catch(error){showToast('保存失败，当前配置未更改，请重试','error');return false;}
    savedNumbers=rows;Object.assign(row,changes);return true;
  }
  const serviceStatus=row=>row.localEnabled===false?'本地已停用':row.businessStatus==='已隔离'?'AliCti 已停用':row.businessStatus;
  function filterPanel(){const f=filters.numbers;return `<div class="filter-panel"><label class="field grow"><span>号码</span><input id="numbersKeyword" value="${esc(f.keyword)}" placeholder="输入号码"></label><label class="field"><span>状态</span><select id="numbersStatus"><option>全部状态</option>${['正常','本地已停用','AliCti 已停用','待配置','待验证'].map(v=>`<option ${f.status===v?'selected':''}>${v}</option>`).join('')}</select></label><div class="filter-actions"><button class="btn" onclick="${command('resetFilters','numbers',context())}">重置</button><button class="btn btn-primary" onclick="${command('query','numbers',context())}">查询</button></div></div>`;}
  function numberActions(row,key){
    const settings=`<button class="na-primary-action" onclick="${command('openNumber',row.numberId,{context:key})}">查看</button>`;
    return settings+`<button onclick="${command('setLocalEnabled',row.numberId,row.localEnabled===false,key)}">${row.localEnabled===false?'启用本地使用':'停用本地使用'}</button>`;
  }
  function boundTenant(row){const rows=CloudCallData.tenants.filter(t=>!t.builtIn&&t.tenantId!=='TENANT-SUPER-BUILTIN'&&t.enterpriseId===row.enterpriseId);return rows.length===1?rows[0]:null;}
  function currentReferences(row,includeInactive=false){
    const routes=window.AliCtiInbound?.numberReferences?.(row,includeInactive);
    if(!routes?.ok)return {ok:false,message:routes?.message||'暂时无法核对呼入规则，请刷新后重试。'};
    const tasks=(CloudCallData.tasks||[]).filter(task=>{
      if(task.enterpriseId!==row.enterpriseId||['已删除','已终止','已完成','已结束'].includes(task.status))return false;
      const plan=(CloudCallData.callPlans||[]).find(plan=>plan.callPlanId===task.planId&&plan.enterpriseId===row.enterpriseId);
      const ids=task.planSnapshot?.callerNumberIds||(task.callerNumberId?[task.callerNumberId]:task.executionConfig?.allowedCallerNumberIds||plan?.allowedCallerNumberIds||[]);
      return ids.includes(row.numberId);
    });
    return {ok:true,tasks,routes:routes.rows,total:tasks.length+routes.rows.length};
  }
  function referenceSummary(row){const refs=currentReferences(row);return refs.ok?`${refs.tasks.length} 个任务 · ${refs.routes.length} 条呼入规则`:'待核对';}
  function renderNumbers(){
    if(!can())return ui.empty('当前账号无号码管理权限');
    const f=filters.numbers,key=context(),keyword=f.keyword.toLowerCase();
    let rows=CloudCallData.phoneNumbers.filter(r=>r.enterpriseId===AppState.get().enterpriseId&&(!keyword||`${r.number} ${tenantNames(r.authorizedTenantIds)}`.toLowerCase().includes(keyword))&&(f.status==='全部状态'||serviceStatus(r)===f.status));
    rows = ui.sortByUpdated?.(rows, ['importedAt','alictiNumber.updateTime','alictiNumber.createTime']) || rows;
    pages.numbers=Math.max(1,Math.min(pages.numbers,Math.ceil(rows.length/pageSize)||1));const start=(pages.numbers-1)*pageSize;
    const columns=[{key:'number',label:'号码',render:(v,r)=>`<button class="table-link" onclick="${command('openNumber',r.numberId,{context:key})}"><strong>${esc(v)}</strong></button>`},{key:'usage',label:'用途',render:(v,r)=>usageCell(r)},{key:'enterpriseId',label:'所属租户',render:(_,r)=>esc(boundTenant(r)?.name||'未绑定租户')},{key:'numberId',label:'使用中业务',render:(_,row)=>referenceSummary(row)},{key:'businessStatus',label:'使用状态',render:(_,row)=>ui.status(serviceStatus(row))},{key:'numberId',label:'操作',className:'action-column',render:(v,r)=>`<div class="table-actions">${numberActions(r,key)}</div>`}];
    return `<section class="platform-page resource-page">${ui.pageHeader('号码管理','从当前 AliCti 账号导入已开通号码，自动归属该账号绑定的租户。')}${filterPanel()}<div class="management-list-shell">${ui.toolbar(`<button class="btn btn-primary" onclick="AliCtiNumberImport.open(${esc(JSON.stringify(key))})">从 AliCti 导入</button><button class="btn" onclick="NumberImportHistory.open(${esc(JSON.stringify(key))})">导入记录</button>`,`<button class="btn" onclick="${command('refresh','numbers',key)}">刷新</button>${ui.help('本地停用仅限制本平台后续外呼，保留号码资料、租户授权及通话记录。号码仍需满足 AliCti 的启用状态和外显权限。')}`)}${ui.table(columns,rows.slice(start,start+pageSize),{emptyText:'没有符合条件的数据',rowOffset:start})}${ui.pagination(rows.length,pages.numbers,pageSize,`window.Pages['resource-lines'].setPage.bind(null,'numbers')`)}</div></section>`;
  }
  function render(){return renderNumbers();}
  function openNumber(id,options){
    const row=number(id);if(!actionAllowed(row,options?.context))return;
    detail={id,context:context()};const tenant=boundTenant(row),saved={...detail};
    const info=`<div class="na-number-overview"><div><span>所属租户</span><strong>${esc(tenant?.name||'未绑定租户')}</strong></div><div><span>号码用途</span><strong>${esc(usageText(row))}</strong></div><div><span>本地使用</span>${ui.status(row.localEnabled===false?'已停用':'已启用')}</div></div>`;
    ui.openLayer('number-detail',`<div class="layer-header"><div><h2>号码详情</h2><p>${esc(row.number)}</p></div><button aria-label="关闭" onclick="${command('closeNumber')}">×</button></div><div class="layer-body number-assignment-body">${info}</div><div class="layer-footer"><button class="btn" onclick="${command('closeNumber')}">关闭</button></div>`,'wide',{objectKey:id,onRestore(){detail={...saved};}});
  }
  function closeNumber(){detail=null;ui.closeLayer('number-detail');}
  function openGrant(id,options){return openNumber(id,options);}
  function applyNumberUpdate(row,changes,localChanges){
    const request=AliCtiFields.numberUpdateFields([row.alictiNumber?.hotline],changes),auth=AliCtiFields.authFields(row.enterpriseId);
    if(request.pending.length||auth.pending.length){showToast([...auth.pending,...request.pending].join('；'),'warning');return false;}
    const response=AliCtiDemo.numberOutcome==='failure'?{result:-1,description:'修改失败（模拟）'}:AliCtiDemo.numberOutcome==='unknown'?null:{result:0,description:'成功'};
    const raw={...row.alictiNumber,...changes};
    const query={endpoint:'enterpriseHotline/listPage',method:'POST',fields:auth.fields,body:{number:row.alictiNumber.hotline,offset:0,limit:10},response:response?.result===0?{result:0,totalCount:'1',pageSize:'10',data:[raw]}:null,mock:true};
    AliCtiDemo.lastNumberUpdate={request:{...request,fields:auth.fields},response,query,mock:true};AliCtiAdapter.lastRequest=AliCtiDemo.lastNumberUpdate.request;
    if(response?.result!==0){showToast(response?'号码修改失败，原配置保留':'修改结果待核对，原配置保留，请先查询确认','warning');return false;}
    const verified=query.response.data.find(n=>n.id===row.alictiNumber.id&&n.hotline===row.alictiNumber.hotline);
    if(!verified||!Object.entries(changes).every(([k,v])=>verified[k]===v))return false;
    return persistNumber(row,{...localChanges,alictiNumber:verified});
  }
  function isolate(id,key){
    const row=number(id);if(!actionAllowed(row,key))return;const opened=context();
    if(row.businessStatus!=='正常')return showToast('当前号码不是正常状态，请先核对','warning');
    ui.confirm({id:'number-isolate',title:'在 AliCti 停用号码',danger:true,confirmText:'确认停用',body:`<p>AliCti 停用后，后续选号不再使用此号码。${row.authorizedTenantIds.length} 个租户的号码授权和已配置路由保留。</p><p>已经使用此号码发起的通话正常继续。本平台同时限制关联任务的新拨号，保留历史记录。</p>`,onConfirm(){
      if(!actionAllowed(row,opened)||row.businessStatus!=='正常')return;
      const restoreSnapshot={snapshotId:'NS-'+Date.now(),supplierStatus:row.alictiNumber.status,previousStatus:row.status,authorizedTenantIds:[...row.authorizedTenantIds],createdAt:new Date().toLocaleString('sv-SE'),kind:'alicti-number-status'};
      if(!applyNumberUpdate(row,{status:0},{restoreSnapshot,businessStatus:'已隔离',status:'已隔离'}))return;
      const affected=CloudTaskWorkspace.pauseForNumber(id);row.authorizedTenantIds.forEach(t=>CloudResourceRules.changed(t));CloudCallRuntime.addAudit('AliCti 停用号码（演示）',id,'','启用','status=0；本地禁止新外呼');
      showToast(`AliCti 号码已停用；${affected} 个关联任务停止新拨号`,'success');closeNumber();RouteRuntime.refreshCurrent();
    }});
  }
  function restore(id,key){
    const row=number(id);if(!actionAllowed(row,key)||row.businessStatus!=='已隔离')return;const opened=context();
    ui.confirm({id:'number-restore',title:'在 AliCti 启用号码',confirmText:'确认启用',body:'<p>重新启用 AliCti 号码，保留当前外显用途、租户授权和路由。本地使用若已停用，仍需单独启用。关联任务不会自动恢复。</p>',onConfirm(){
      if(!actionAllowed(row,opened)||row.businessStatus!=='已隔离')return;
      if(!applyNumberUpdate(row,{status:1},{businessStatus:'正常',status:row.restoreSnapshot?.previousStatus||'正常',restoreSnapshot:null}))return;
      row.authorizedTenantIds.forEach(t=>CloudResourceRules.changed(t));CloudCallRuntime.addAudit('AliCti 启用号码（演示）',id,'','停用','status=1；任务不自动恢复');showToast('AliCti 号码已启用；本地使用与任务仍需单独核对','success');closeNumber();RouteRuntime.refreshCurrent();
    }});
  }
  function setLocalEnabled(id,enabled,key){
    const row=number(id);if(!actionAllowed(row,key)||typeof enabled!=='boolean'||(row.localEnabled!==false)===enabled)return;
    const opened=context(),wasEnabled=row.localEnabled!==false;
    ui.confirm({id:'number-local-use',title:enabled?'启用本地使用':'停用本地使用',danger:!enabled,confirmText:enabled?'确认启用':'确认停用',body:enabled?'<p>恢复本平台的号码使用许可。仍需满足 AliCti 启用状态、外显用途和租户授权；关联任务不会自动恢复。</p>':'<p>停止在本平台使用此号码发起新外呼，并暂停关联任务后续拨号。</p><p>已发起的通话正常继续，号码资料、租户授权、呼入规则和历史记录保留。此操作不修改 AliCti 号码状态，也不关闭供应商来电入口。</p>',onConfirm(){
      if(!actionAllowed(row,opened)||(row.localEnabled!==false)!==wasEnabled)return;
      if(!persistNumber(row,{localEnabled:enabled}))return;
      const affected=enabled?0:CloudTaskWorkspace.pauseForNumber(id);
      row.authorizedTenantIds.forEach(t=>CloudResourceRules.changed(t));
      CloudCallRuntime.addAudit(enabled?'启用号码本地使用':'停用号码本地使用',id,'',wasEnabled?'启用':'停用',enabled?'本地允许使用；供应商状态、用途和租户授权仍生效；任务不自动恢复':'本地禁止新外呼；在途通话继续');
      showToast(enabled?'已启用本地使用；关联任务需单独核对后继续':`已停用本地使用；${affected} 个关联任务停止新拨号`,'success');closeNumber();RouteRuntime.refreshCurrent();
    }});
  }
  function query(key,scope){if(!can()||scope&&scope!==context())return;filters.numbers.keyword=document.getElementById('numbersKeyword')?.value||'';filters.numbers.status=document.getElementById('numbersStatus')?.value||'全部状态';pages.numbers=1;navigateTo('numbers');}
  function resetFilters(key,scope){if(!can()||scope&&scope!==context())return;filters.numbers={keyword:'',status:'全部状态'};pages.numbers=1;navigateTo('numbers');}
  function setPage(key,value){if(!can())return;pages.numbers=Math.max(1,Number(value)||1);navigateTo('numbers');}
  function refresh(key,scope){if(!can()||scope&&scope!==context())return;showToast('数据已刷新','success');navigateTo('numbers');}
  function captureNavigationState(){return {detail:detail&&{...detail},filters:structuredClone(filters),pages:{...pages}};}
  function restoreNavigationState(state){if(!state)return;({detail}=state);Object.assign(filters,structuredClone(state.filters));Object.assign(pages,state.pages);}
  window.Pages=window.Pages||{};window.Pages['resource-lines']={render,captureNavigationState,restoreNavigationState,init(){},openNumber,closeNumber,openGrant,isolate,restore,setLocalEnabled,query,resetFilters,setPage,refresh};
})();
