/** Independent queue management. Queue ownership stays within the active tenant/account. */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape,data=CloudCallData;
  const api=()=>AliCtiQueues,context=()=>api().contextKey();
  let filters={keyword:'',tenantId:'',status:''},page=1,listContext='',picker=null;
  const size=8,command=(method,...args)=>esc(`QueueManagement.${method}(${args.map(v=>JSON.stringify(v)).join(',')})`);
  const allowed=key=>api().canAccess()&&(!key||key===context());
  const denied=()=>showToast('工作范围已变化或没有队列管理权限，请重新打开页面','warning');
  const tenants=()=>{const owners=data.tenants.filter(t=>!t.builtIn&&t.tenantId!=='TENANT-SUPER-BUILTIN'&&t.enterpriseId===AppState.get().enterpriseId);return owners.length===1?owners.filter(t=>t.status==='启用'&&(t.capabilitySet||[]).includes('CLOUD_CONTACT_CENTER')&&AppState.authorizeObject('',t)):[];};
  const groups=tenantId=>data.physicalSkillGroups.filter(g=>g.tenantId===tenantId&&g.status==='已启用'&&g.syncStatus==='同步成功'&&api().canManage(g));
  const freeGroups=tenantId=>groups(tenantId).filter(g=>!api().describe(g)?.binding);
  const linkedGroups=info=>info?.groups || (info?.group ? [info.group] : []);
  const groupIds=info=>linkedGroups(info).map(g=>g.physicalGroupId);
  function render(){
    if(!allowed())return ui.empty('当前账号无队列管理权限');
    if(listContext!==context()){filters={keyword:'',tenantId:'',status:''};page=1;listContext=context();}
    const catalog=api().catalog(),error=api().storageError();
    let rows=catalog.filter(q=>(!filters.keyword||[q.name,q.qno,...(q.groupNames||[q.groupName])].join(' ').toLowerCase().includes(filters.keyword.toLowerCase()))&&(!filters.tenantId||q.tenantId===filters.tenantId)&&(!filters.status||(filters.status==='unbound'?!q.physicalGroupId:filters.status==='bound'?!!q.physicalGroupId:q.status===filters.status)));
    rows = ui.sortByUpdated?.(rows, []) || rows;
    page=Math.max(1,Math.min(page,Math.ceil(rows.length/size)||1));const start=(page-1)*size,key=context();
    const columns=[{key:'name',label:'队列',render:(v,q)=>`<button class="table-link queue-list-link" onclick="${command('openDetails',q.qno,false,key)}"><strong>${esc(v)}</strong><small>编号 ${esc(q.qno)}</small></button>`},...(AppState.isSuper()?[{key:'tenantName',label:'所属租户'}]:[]),{key:'groupNames',label:'关联技能',render:(v,q)=>(v?.length?v:[q.groupName].filter(Boolean)).map(name=>`<span class="queue-skill-tag">${esc(name)}</span>`).join('')||'尚未关联'},{key:'strategy',label:'接听分配方式',render:v=>esc(AliCtiQueueContracts.strategies[v]||'未提供')},{key:'weight',label:'优先级'},{key:'memberCount',label:'成员数',help:'成员通过关联技能维护。',render:v=>`${v} 人`},{key:'bindingStatusLabel',label:'配置状态',render:(v,q)=>`<span class="queue-badge">${esc(q.status==='STOPPED'?'暂停接听':v)}</span>`},{key:'qno',label:'操作',render:(v,q)=>`<div class="table-actions"><button onclick="${command('openDetails',v,false,key)}">查看</button>${q.status==='ACTIVE'?`<button onclick="${command('openDetails',v,true,key)}">编辑</button><button onclick="${command('openAssociation',v,key)}">${q.physicalGroupId?'关联设置':'关联技能'}</button>`:''}${q.physicalGroupId?`<button onclick="${command('openMembers',v,key)}">成员</button>`:''}</div>`}];
    return `<section class="platform-page queue-management-page">${ui.pageHeader('队列管理',AppState.isSuper()?'管理当前账号绑定租户的接听队列、优先级和等待规则。':'管理本租户的接听队列、分配方式和等待规则。')}
      <div class="filter-panel"><label class="field grow"><span>队列 / 编号 / 技能</span><input id="queue-list-keyword" value="${esc(filters.keyword)}" placeholder="输入队列、编号或技能"></label><label class="field"><span>关联 / 状态</span><select id="queue-list-status">${[['','全部'],['bound','已关联技能'],['unbound','未关联技能'],['ACTIVE','可用'],['STOPPED','暂停接听']].map(([v,label])=>`<option value="${v}" ${filters.status===v?'selected':''}>${label}</option>`).join('')}</select></label><div class="filter-actions"><button class="btn" onclick="QueueManagement.reset()">重置</button><button class="btn btn-primary" onclick="QueueManagement.query()">查询</button></div></div>
      ${error?ui.alert('warning','队列资料暂时无法读取',error):''}<div class="management-list-shell">${ui.toolbar(`<button class="btn btn-primary" ${error?'disabled':''} onclick="${command('openCreate',key)}">新增队列</button>`,`<button class="btn" onclick="QueueManagement.refresh()">刷新</button>`)}${ui.table(columns,rows.slice(start,start+size),{emptyText:error?'请刷新后重试':'暂无符合条件的队列',rowOffset:start})}${ui.pagination(rows.length,page,size,'QueueManagement.setPage')}</div></section>`;
  }
  function query(){if(!allowed(listContext))return denied();filters={keyword:document.getElementById('queue-list-keyword')?.value.trim()||'',tenantId:AppState.isSuper()?document.getElementById('queue-list-tenant')?.value||'':'',status:document.getElementById('queue-list-status')?.value||''};page=1;RouteRuntime.refreshCurrent();}
  function reset(){if(!allowed(listContext))return denied();filters={keyword:'',tenantId:'',status:''};page=1;RouteRuntime.refreshCurrent();}
  function setPage(value){if(!allowed(listContext))return denied();page=Math.max(1,Number(value)||1);RouteRuntime.refreshCurrent();}
  function refresh(){if(!allowed(listContext))return denied();api().refresh();RouteRuntime.refreshCurrent();}
  function openDetails(qno,editable,key){if(!allowed(key))return denied();QueueDetail.open(qno,editable,context());}
  function dirtyPicker(value){if(picker)picker.dirty=value;try{AppState.setDirty(value);}catch(_){}}
  function closePicker(force=false){
    if(picker?.dirty&&!force){ui.confirm({id:'queue-picker-decision',title:'放弃修改？',body:'<p>当前选择尚未保存，是否放弃？</p>',confirmText:'放弃修改并关闭',onConfirm:()=>closePicker(true)});return;}
    if(picker?.dirty)dirtyPicker(false);picker=null;ui.closeLayer('queue-scope-picker');
  }
  function cancelClose(){ui.closeLayer('queue-picker-decision');}
  function validPicker(){return picker&&allowed(picker.context)&&document.getElementById('queue-scope-picker');}
  function beginPicker(value){
    if(picker&&!document.getElementById('queue-scope-picker')){if(picker.dirty)dirtyPicker(false);picker=null;}
    if(picker?.dirty)return pickerError('请先保存或关闭当前技能选择。');
    picker={...value,dirty:false,routeHash:location.hash};drawPicker();return true;
  }
  function openCreate(key){
    if(!allowed(key))return denied();
    if(!api().refresh())return showToast(api().storageError(),'warning');
    const scope=tenants();if(scope.length!==1)return showToast('请先为当前账号绑定唯一的有效租户','warning');beginPicker({kind:'create',context:context(),tenantId:scope[0].tenantId,selectedIds:[],initialIds:[]});
  }
  function setTenant(id){if(!validPicker()||picker.kind!=='create'||!AppState.isSuper()||!tenants().some(t=>t.tenantId===id))return denied();if(picker.tenantId===id)return;picker.tenantId=id;picker.selectedIds=[];dirtyPicker(false);drawPicker();}
  function openAssociation(qno,key){
    if(!allowed(key))return denied();const info=api().describeQueue(qno);if(!info||info.queue.status!=='ACTIVE')return denied();
    const ids=groupIds(info);beginPicker({kind:'association',qno,context:context(),tenantId:info.queue.tenantId,revision:info.revision,selectedIds:ids.slice(),initialIds:ids.slice()});
  }
  function availableGroups(){
    if(!picker)return[];const current=picker.kind==='association'?groupIds(api().describeQueue(picker.qno)):[];
    return data.physicalSkillGroups.filter(g=>g.tenantId===picker.tenantId&&api().canManage(g)&&(current.includes(g.physicalGroupId)||(g.status==='已启用'&&g.syncStatus==='同步成功'&&!api().describe(g)?.binding)));
  }
  function selectGroup(id,selected){
    if(!validPicker()||picker.kind==='members')return denied();
    if(!availableGroups().some(g=>g.physicalGroupId===id))return pickerError('请选择本租户可关联的技能。');
    picker.selectedIds=selected?[...new Set([...picker.selectedIds,id])]:picker.selectedIds.filter(value=>value!==id);
    dirtyPicker(JSON.stringify(picker.selectedIds.slice().sort())!==JSON.stringify(picker.initialIds.slice().sort()));
    const count=document.getElementById('queue-selected-count');if(count)count.textContent=`已选择 ${picker.selectedIds.length} 个技能`;
    const error=document.getElementById('queue-picker-error');if(error)error.textContent='';
  }
  function drawPicker(){
    if(!picker||!allowed(picker.context))return denied();
    const create=picker.kind==='create',members=picker.kind==='members',info=create?null:api().describeQueue(picker.qno),tenant=tenants().find(t=>t.tenantId===picker.tenantId);
    if(!tenant||!create&&!info)return denied();
    const available=members?linkedGroups(info):availableGroups();
    let body=`<p class="queue-muted">${members?'选择需要维护成员的技能。':create?'选择一个或多个技能，再填写队列名称和接听规则。':'可选择多个技能。保存后，未选中的原有技能将移除。'}</p><div class="form-grid queue-form">`;
    body+=`<div class="field"><span>所属租户</span><strong>${esc(tenant.name)}</strong></div>`;
    if(!create)body+=`<div class="field"><span>队列</span><strong>${esc(info.queue.name)} · ${esc(info.queue.qno)}</strong></div>`;
    body+='</div>';
    if(members){body+=`<div class="queue-skill-choices">${available.map(g=>`<button class="btn queue-member-choice" onclick="${command('openGroupMembers',g.physicalGroupId)}"><strong>${esc(g.name)}</strong><span>维护成员 →</span></button>`).join('')}</div>`;}
    else{
      body+=`<fieldset class="queue-skill-fieldset"><legend>关联技能${create?' <b class="queue-required">*</b>':''}</legend><p id="queue-selected-count" class="queue-muted">已选择 ${picker.selectedIds.length} 个技能</p><div class="queue-skill-choices">${available.map(g=>`<label class="queue-skill-choice"><input type="checkbox" name="queue-skills" value="${esc(g.physicalGroupId)}" ${picker.selectedIds.includes(g.physicalGroupId)?'checked':''} onchange="QueueManagement.selectGroup(this.value,this.checked)"><span>${esc(g.name)}</span></label>`).join('')}</div><p class="queue-muted">已关联其他队列的技能需先在原队列解除关联。</p></fieldset>`;
      if(!available.length)body+='<p class="queue-muted">当前没有可关联的技能。可先创建技能，再新增或关联队列。</p><button class="btn" onclick="QueueManagement.createSkill()">创建技能</button>';
      if(!create&&linkedGroups(info).length){body+=`${info.blockedReason?`<p class="queue-muted">${esc(info.blockedReason)}</p>`:''}${QueueConfig.summary(linkedGroups(info)[0].physicalGroupId)}`;}
    }
    body+='<div id="queue-picker-error" class="queue-error" role="alert"></div><div id="queue-picker-confirm" class="queue-inline-confirm" hidden></div>';
    const footer=members?'':`${!create&&linkedGroups(info).length?'<button class="btn" onclick="QueueManagement.verifyCurrent()">重新核对成员</button>':''}<button class="btn btn-primary" ${create&&!available.length?'disabled':''} onclick="QueueManagement.${create?'continueCreate':'saveAssociation'}()">${create?'下一步':'保存关联'}</button>`;
    ui.openLayer('queue-scope-picker',`<div class="layer-header"><h2>${members?'队列成员':create?'新增队列':'队列关联设置'}</h2><button aria-label="关闭" onclick="QueueManagement.closePicker()">×</button></div><div class="layer-body queue-content">${body}</div><div class="layer-footer"><button class="btn" onclick="QueueManagement.closePicker()">${members?'关闭':'取消'}</button>${footer}</div>`,'wide');
  }
  function pickerError(message){const el=document.getElementById('queue-picker-error');if(el)el.textContent=message;else showToast(message,'warning');return false;}
  function selectedGroups(){const available=availableGroups();return picker.selectedIds.every(id=>available.some(g=>g.physicalGroupId===id))?picker.selectedIds.slice():null;}
  function continueCreate(){
    if(!validPicker()||picker.kind!=='create')return denied();const ids=selectedGroups();if(!ids?.length)return pickerError('请至少选择一个当前租户可关联的技能。');
    const key=picker.context;closePicker(true);QueueConfig.openCreate(ids,key);
  }
  function saveAssociation(confirmed=false){
    if(!validPicker()||picker.kind!=='association')return denied();const ids=selectedGroups();if(!ids)return pickerError('技能关联已变化，请重新打开。');
    if(!ids.length&&picker.initialIds.length&&!confirmed){ui.confirm({id:'queue-picker-decision',title:'解除全部关联？',body:'<p>解除全部技能关联后，队列将不再有本地关联技能。确认解除？</p>',confirmText:'确认解除全部关联',onConfirm:()=>saveAssociation(true)});return;}
    const result=api().saveQueueGroups(picker.qno,ids,picker.context,picker.revision);if(!result.ok)return pickerError(result.message);
    closePicker(true);RouteRuntime.refreshCurrent();showToast(result.message,'success');return true;
  }
  function verify(qno,key){
    if(!allowed(key))return denied();const info=api().describeQueue(qno),first=linkedGroups(info)[0];if(!first)return denied();
    const result=api().verify(first.physicalGroupId,context(),info.revision);if(!result.ok)return showToast(result.message,'warning');RouteRuntime.refreshCurrent();showToast(result.message,'success');return true;
  }
  function verifyCurrent(){if(!validPicker()||picker.kind!=='association')return denied();if(picker.dirty)return pickerError('请先保存技能选择，再核对成员。');if(verify(picker.qno,picker.context)){picker.revision=api().revision();drawPicker();}}
  function askUnlink(){if(!validPicker()||picker.kind!=='association')return denied();picker.selectedIds=[];dirtyPicker(true);drawPicker();saveAssociation();}
  function openMembers(qno,key){
    if(!allowed(key))return denied();const info=api().describeQueue(qno),related=linkedGroups(info);if(!related.length)return denied();
    if(related.length===1)return RouteRuntime.openSecondary('agent-skills',{physicalGroupId:related[0].physicalGroupId,tenantId:info.queue.tenantId});
    beginPicker({kind:'members',qno,context:context(),tenantId:info.queue.tenantId,selectedIds:[],initialIds:[]});
  }
  function openGroupMembers(id){
    if(!validPicker()||picker.kind!=='members')return denied();const info=api().describeQueue(picker.qno);if(!linkedGroups(info).some(g=>g.physicalGroupId===id))return denied();
    const tenantId=info.queue.tenantId;closePicker(true);RouteRuntime.openSecondary('agent-skills',{physicalGroupId:id,tenantId});
  }
  function createSkill(){if(!validPicker())return denied();const tenantId=picker.tenantId;closePicker(true);Pages['contact-center-settings'].openMapping();const select=document.getElementById('mappingTenant');if(select&&[...select.options].some(o=>o.value===tenantId))select.value=tenantId;}
  function captureNavigationState(){return {filters:{...filters},page,listContext};}
  function restoreNavigationState(saved){if(saved?.listContext===context()){filters={...saved.filters};page=saved.page;listContext=saved.listContext;}}
  window.addEventListener('app:save-draft',event=>{if(!picker?.dirty||!document.getElementById('queue-scope-picker'))return;event.preventDefault();showToast('请先保存或关闭技能选择，再切换业务域。','warning');});
  window.addEventListener('popstate',event=>{if(!picker?.dirty||!document.getElementById('queue-scope-picker'))return;event.stopImmediatePropagation();history.pushState(history.state,'',picker.routeHash||'#queue-management');pickerError('请先保存选择，或关闭并放弃修改，再返回上一页。');},true);
  AppState.subscribe?.(()=>{if(picker&&!allowed(picker.context)){picker=null;ui.closeLayer('queue-scope-picker',false);}});
  const exported={render,init(){},query,reset,setPage,refresh,openCreate,setTenant,selectGroup,continueCreate,openAssociation,saveAssociation,openDetails,openMembers,openGroupMembers,verify,verifyCurrent,askUnlink,closePicker,cancelClose,createSkill,captureNavigationState,restoreNavigationState};
  window.QueueManagement=exported;window.Pages=window.Pages||{};window.Pages['queue-management']=exported;
})();
