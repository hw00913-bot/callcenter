/** 技能管理：已有成员和业务引用的统一查询入口。 */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape,data=CloudCallData,pageSize=8;
  let view='plans',page=1,listContext='',editContext='',editingId='',detail=null;
  const filters={skills:{keyword:'',tenantId:'',status:'全部状态'}};
  const storagePrefix='skill-groups-v2:',restoreErrors=new Map();
  const templateFields=['skillTemplateId','enterpriseId','name','code','description','status','mappedTenantCount','updatedAt'];
  const groupFields=['physicalGroupId','skillGroupId','skillTemplateId','tenantId','enterpriseId','name','status','syncStatus','memberCount','referenceCount','simulation','localUpdatedAt','createdAt'];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const clean=(row,fields)=>Object.fromEntries(fields.filter(key=>Object.hasOwn(row,key)).map(key=>[key,clone(row[key])]));
  function storageError(){return Error('本地技能记录格式或归属异常，原记录未改动，请先核对');}
  function validateSaved(saved,enterpriseId){
    if(!saved||saved.version!==2||saved.enterpriseId!==enterpriseId||!Array.isArray(saved.templates)||!Array.isArray(saved.groups)||saved.templates.length>1000||saved.groups.length>1000||!data.instances.some(i=>i.enterpriseId===enterpriseId))throw storageError();
    const string=value=>typeof value==='string'&&value.length>0&&value.length<=160;
    const templates=new Map(data.skillTemplates.map(t=>[t.skillTemplateId,t])),groups=new Map(data.physicalSkillGroups.map(g=>[g.physicalGroupId,g])),seenTemplates=new Set(),seenGroups=new Set();
    for(const t of saved.templates){
      if(!t||Object.keys(t).some(k=>!templateFields.includes(k))||!string(t.skillTemplateId)||t.enterpriseId!==enterpriseId||!string(t.name)||!string(t.code)||typeof t.description!=='string'||t.description.length>500||typeof t.status!=='string'||seenTemplates.has(t.skillTemplateId))throw storageError();
      const existing=templates.get(t.skillTemplateId);if(existing&&existing.enterpriseId!==enterpriseId)throw storageError();
      seenTemplates.add(t.skillTemplateId);templates.set(t.skillTemplateId,t);
    }
    for(const g of saved.groups){
      if(!g||Object.keys(g).some(k=>!groupFields.includes(k))||!string(g.physicalGroupId)||!string(g.skillGroupId)||!string(g.name)||!string(g.tenantId)||g.enterpriseId!==enterpriseId||typeof g.status!=='string'||typeof g.syncStatus!=='string'||seenGroups.has(g.physicalGroupId))throw storageError();
      const tenant=data.tenants.find(t=>t.tenantId===g.tenantId),template=templates.get(g.skillTemplateId),existing=groups.get(g.physicalGroupId);
      if(!tenant||tenant.enterpriseId!==enterpriseId||!tenant.capabilitySet?.includes('CLOUD_CONTACT_CENTER')||(g.skillTemplateId&&(!template||template.enterpriseId!==enterpriseId))||(existing&&(existing.tenantId!==g.tenantId||existing.enterpriseId!==enterpriseId||existing.skillGroupId!==g.skillGroupId)))throw storageError();
      seenGroups.add(g.physicalGroupId);groups.set(g.physicalGroupId,g);
    }
    const templateNames=new Set(),templateCodes=new Set(),groupNames=new Set(),cloudGroups=new Set();
    for(const t of templates.values())if(t.enterpriseId===enterpriseId){if(templateNames.has(t.name)||templateCodes.has(t.code))throw storageError();templateNames.add(t.name);templateCodes.add(t.code);}
    for(const g of groups.values()){
      if(cloudGroups.has(g.skillGroupId))throw storageError();cloudGroups.add(g.skillGroupId);
      if(g.enterpriseId===enterpriseId){const key=JSON.stringify([g.tenantId,g.name.trim()]);if(groupNames.has(key))throw storageError();groupNames.add(key);}
    }
    return saved;
  }
  function readSaved(enterpriseId){
    const raw=localStorage.getItem(storagePrefix+enterpriseId);
    let saved={version:2,enterpriseId,templates:[],groups:[]};if(raw)try{saved=JSON.parse(raw);}catch(_){throw storageError();}
    return validateSaved(saved,enterpriseId);
  }
  function applySaved(saved){
    for(const [collection,rows,id,fields] of [[data.skillTemplates,saved.templates,'skillTemplateId',templateFields],[data.physicalSkillGroups,saved.groups,'physicalGroupId',groupFields]])for(const row of rows){const current=collection.find(x=>x[id]===row[id]);if(current)Object.assign(current,clean(row,fields));else collection.push(clean(row,fields));}
  }
  function persistRow(type,row){
    if(!['templates','groups'].includes(type)||!(type==='templates'?canEditTemplate(row):canEdit(row))||row.enterpriseId!==AppState.get().enterpriseId)return false;
    try{
      const saved=readSaved(row.enterpriseId),field=type==='templates'?'skillTemplateId':'physicalGroupId',fields=type==='templates'?templateFields:groupFields;
      const record={...row,...(type==='groups'?{localUpdatedAt:new Date().toISOString()}: {})};
      const next={...saved,[type]:saved[type].filter(x=>x[field]!==row[field]).concat(clean(record,fields))};validateSaved(next,row.enterpriseId);
      localStorage.setItem(storagePrefix+row.enterpriseId,JSON.stringify(next));applySaved(next);restoreErrors.delete(row.enterpriseId);return true;
    }catch(error){if(error.message.includes('格式或归属'))restoreErrors.set(row.enterpriseId,error.message);showToast('未保存：'+(error.message.includes('格式或归属')?error.message:'本地存储暂不可用，请保留表单重试'),'warning');return false;}
  }
  // This script loads before number-resource and AccountSeat restoration in index.html.
  // Each storage bucket must match its own instance and each group's tenant/template.
  for(const instance of data.instances)try{applySaved(readSaved(instance.enterpriseId));}catch(error){restoreErrors.set(instance.enterpriseId,error.message);}
  function contextKey(){const s=AppState.get();return [s.accountId,s.sessionId,s.tenantId,s.enterpriseId,s.activeDomain,s.roleCode].join('|');}
  function canView(row){return AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.canMenu('settings.skills')&&(!row||AppState.authorizeObject('',row));}
  function canEditTemplate(row){return AppState.isSuper()&&canView(row);}
  function canEdit(row){return canView(row)&&(AppState.isSuper()||(AppState.effectiveAccess().roleCode==='ADMIN'&&(!row||row.tenantId===AppState.get().tenantId)));}
  function groupById(id){return data.physicalSkillGroups.find(g=>g.physicalGroupId===id);}
  function tenantName(id){return CloudCallRuntime.tenant(id)?.name||id;}
  function denied(){showToast('当前权限或工作范围已变化，请重新打开页面','warning');}
  function validTenantOptions(){return (AppState.isSuper()?AppState.availableTenants():[AppState.currentTenant()]).filter(t=>t&&canView(t)&&t.enterpriseId===AppState.get().enterpriseId&&t.status==='启用'&&t.capabilitySet.includes('CLOUD_CONTACT_CENTER'));}
  function currentDetail(){const g=detail&&groupById(detail.id);return g&&detail.context===contextKey()&&canView(g)?g:null;}
  function groupMembers(g){return data.agentSkills.filter(r=>r.physicalGroupId===g.physicalGroupId).map(r=>({...r,agent:data.agents.find(a=>a.contactCenterIdentityId===r.identityId)})).filter(r=>r.agent&&r.agent.tenantId===g.tenantId&&r.agent.enterpriseId===g.enterpriseId&&r.agent.lifecycleStatus!=='已删除'&&AppState.authorizeObject('',r.agent));}
  function groupUsage(g){
    const tasks=(data.tasks||[]).filter(t=>t.tenantId===g.tenantId&&t.enterpriseId===g.enterpriseId&&AppState.authorizeObject('',t)).filter(t=>{
      const p=t.planSnapshot||t.executionConfig||data.callPlans.find(p=>p.callPlanId===t.planId&&p.tenantId===g.tenantId&&p.enterpriseId===g.enterpriseId)||{};
      return [p.skillGroupId,p.targetSkillGroupId,p.executionQueueId,t.planSnapshot?'':t.targetSkillGroupId].includes(g.skillGroupId);
    }).map(t=>({...t,name:t.name,type:t.callType,status:t.status,active:!['已完成','已终止','已删除'].includes(t.status)}));
    const routes=(data.inboundRoutes||[]).filter(r=>r.enterpriseId===g.enterpriseId&&(r.branches||[]).some(b=>b.tenantId===g.tenantId&&b.physicalGroupId===g.physicalGroupId)).map(r=>({...r,name:(data.phoneNumbers.find(n=>n.numberId===r.numberId&&(AppState.isSuper()||(n.authorizedTenantIds||[]).includes(g.tenantId)))?.number||'本组')+' 呼入规则',type:'呼入规则',status:r.status,active:r.status==='已发布',branches:r.branches.filter(b=>b.tenantId===g.tenantId&&b.physicalGroupId===g.physicalGroupId).map(b=>b.label).join('、')}));
    return [...tasks,...routes];
  }
  function groupLink(id,tab,label){return `<button class="table-link" onclick="window.Pages['contact-center-settings'].openGroup('${esc(id)}',{tab:'${tab}',context:'${esc(listContext)}'})">${label}</button>`;}
  function renderSkillMappings(){
    if(!canView())return ui.empty('当前工作范围无技能查看权限');
    if(listContext&&listContext!==contextKey()){filters.skills={keyword:'',tenantId:'',status:'全部状态'};page=1;}
    listContext=contextKey();const f=filters.skills,keyword=f.keyword.toLowerCase();
    let groups=data.physicalSkillGroups.filter(canView).map(g=>({...g,tenantName:tenantName(g.tenantId),members:CloudResourceRules.members(g).length,usageCount:groupUsage(g).filter(u=>u.active).length})).filter(g=>(!keyword||[g.name,g.tenantName].join(' ').toLowerCase().includes(keyword))&&(!f.tenantId||g.tenantId===f.tenantId)&&(f.status==='全部状态'||g.status===f.status));
    groups=ui.sortByUpdated?.(groups)||groups;
    page=Math.min(page,Math.max(1,Math.ceil(groups.length/pageSize)));const start=(page-1)*pageSize;
    const actions=(canEdit()?'<button class="btn btn-primary" onclick="window.Pages[\'contact-center-settings\'].openMapping()">创建技能</button>':'');
    return `<section class="platform-page mapping-page rr-page">${ui.pageHeader('技能管理','管理当前租户的技能、坐席成员和关联业务。')}${restoreErrors.has(AppState.get().enterpriseId)?ui.alert('warning','本地技能记录未恢复','保存的记录未能通过归属或格式检查，当前显示已有基础数据。请先核对本地记录后再保存。'):''}${BusinessIssues.section('技能同步')}<div class="filter-panel"><label class="field grow"><span>技能 / 租户</span><input id="skillKeyword" value="${esc(f.keyword)}" placeholder="输入技能或租户名称"></label><label class="field"><span>状态</span><select id="skillFilterStatus">${['全部状态','已启用','已停用','同步失败'].map(s=>`<option ${f.status===s?'selected':''}>${s}</option>`).join('')}</select></label><div class="filter-actions"><button class="btn" onclick="window.Pages['contact-center-settings'].reset('skills')">重置</button><button class="btn btn-primary" onclick="window.Pages['contact-center-settings'].query('skills')">查询</button></div></div><div class="management-list-shell">${ui.toolbar(actions,ui.help('有效成员沿用已生效、已启用且接收新任务的口径，不等于在线。实际呼叫仍检查当前场景和坐席上线状态。'))}${ui.table([
      {key:'name',label:'技能',render:(v,r)=>groupLink(r.physicalGroupId,'members',`<strong>${esc(v)}</strong>`)},{key:'tenantName',label:'所属租户'},{key:'members',label:'有效成员',render:(v,r)=>groupLink(r.physicalGroupId,'members',v)},{key:'usageCount',label:'使用中业务',render:(v,r)=>groupLink(r.physicalGroupId,'usage',v)},{key:'status',label:'状态',render:(v,r)=>`${ui.status(v)}${r.syncStatus!=='同步成功'?`<small>${esc(r.syncStatus)}</small>`:''}`},{key:'physicalGroupId',label:'操作',className:'action-column',render:(v,r)=>`<div class="table-actions">${groupLink(v,'members','查看')}${AppState.canMenu('agents.manage')?`<button onclick="window.Pages['contact-center-settings'].openGroupMembers('${esc(v)}','${esc(listContext)}')">维护成员</button>`:''}${canEdit(r)?`<button onclick="window.Pages['contact-center-settings'].openMapping('${esc(v)}','${esc(listContext)}')">配置</button>`:''}</div>`}
    ],groups.slice(start,start+pageSize),{emptyText:'没有符合条件的技能',rowOffset:start,className:'rr-table'})}${ui.pagination(groups.length,page,pageSize,"window.Pages['contact-center-settings'].setPage")}</div></section>`;
  }
  function openGroup(id,options={}){
    const g=groupById(id);if(!g||!canView(g)||(options.context&&options.context!==contextKey()))return denied();
    const tab=['members','usage'].includes(options.tab)?options.tab:'members';detail={id,tab,context:contextKey()};
    const memberRows=groupMembers(g),usageRows=groupUsage(g);
    const members=ui.sortByUpdated?.(memberRows)||memberRows,usage=ui.sortByUpdated?.(usageRows)||usageRows;
    const summary=`<div class="rr-summary">${[['有效成员',CloudResourceRules.members(g).length],['使用中业务',usage.filter(u=>u.active).length]].map(([label,value])=>`<div class="rr-summary-item"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
    const tabs=`<div class="rr-tabs" role="tablist" aria-label="技能详情">${[['members','成员及等级'],['usage','关联任务 / 呼入规则']].map(([key,label])=>`<button class="rr-tab ${tab===key?'active':''}" role="tab" aria-selected="${tab===key}" onclick="window.Pages['contact-center-settings'].switchGroupTab('${key}')">${label}</button>`).join('')}</div>`;
    let body='';
    if(tab==='members')body=ui.table([{key:'agent',label:'坐席',render:a=>esc(a.userName)},{key:'skillLevel',label:'技能等级',render:v=>`等级 ${esc(v)}`},{key:'status',label:'成员状态',render:v=>ui.status(v)},{key:'agent',label:'坐席状态',render:a=>ui.status(a.lifecycleStatus)},{key:'agent',label:'话务状态',render:a=>ui.status(a.agentStatus)}],members,{emptyText:'尚未添加成员，可在成员维护中添加已有坐席',className:'rr-table'})+'<p class="rr-muted">技能等级为 1–10 整数，数值越小等级越高；实际接听按场景和分配策略执行。有效成员数不等于在线人数。</p>';
    if(tab==='usage')body=ui.table([{key:'name',label:'业务名称'},{key:'type',label:'类型'},{key:'status',label:'状态',render:v=>ui.status(v)},{key:'branches',label:'引用说明',render:(v,r)=>esc(v||(r.active?'关联此技能执行':'历史任务保留原配置'))}],usage,{emptyText:'暂无引用此技能的任务或呼入规则',className:'rr-table'});
    const layerDetail={...detail};
    ui.openLayer('skill-group-detail',`<div class="layer-header"><div><h2>${esc(g.name)}</h2><p>${esc(tenantName(g.tenantId))} · ${esc(g.status)}</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer('skill-group-detail')">×</button></div><div class="layer-body">${summary}${tabs}${body}<details class="technical-details"><summary>技术信息</summary><dl class="detail-grid"><dt>云平台技能编号</dt><dd><code>${esc(g.skillGroupId)}</code></dd><dt>配置状态</dt><dd>${esc(g.syncStatus)}</dd></dl></details></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('skill-group-detail')">关闭</button>${tab==='members'&&AppState.canMenu('agents.manage')?`<button class="btn btn-primary" onclick="window.Pages['contact-center-settings'].openGroupMembers('${esc(id)}','${esc(detail.context)}')">维护成员及等级</button>`:''}</div>`,'wide',{objectKey:id,onRestore(){detail={...layerDetail};}});
  }
  function switchGroupTab(tab){if(!currentDetail())return denied();openGroup(detail.id,{tab,context:detail.context});}
  function openGroupMembers(id,context){const g=groupById(id);if(!g||!canView(g)||!AppState.canMenu('agents.manage')||(context&&context!==contextKey()))return denied();RouteRuntime.openSecondary('agent-skills',{physicalGroupId:id,tenantId:g.tenantId});}
  function render(options){view=options?.view||view;return view==='skill-mappings'?renderSkillMappings():ScenarioCalling.render();}
  function openPlan(id){const row=data.callPlans.find(p=>p.callPlanId===id);if(row&&!AppState.authorizeObject('',row))return denied();if(!row||row.callType==='人工外呼')return ScenarioCalling.openManual(row?.tenantId);RouteRuntime.openSecondary(row.callType==='呼入'?'inbound-routes':row.callType==='预外呼'?'predictive-tasks':'ivr-tasks');}
  function openMapping(id,context){
    const row=id?groupById(id):null;if(!canEdit(row)||(id&&!row)||(context&&context!==contextKey()))return denied();editContext=contextKey();editingId=id||'';
    const form=`<div class="form-grid"><label class="field"><span>所属租户</span><select id="mappingTenant" disabled>${validTenantOptions().map(t=>`<option value="${esc(t.tenantId)}" ${t.tenantId===row?.tenantId?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><label class="field full"><span>技能名称</span><input id="mappingName" maxlength="60" value="${esc(row?.name||'')}"></label></div><details class="technical-details"><summary>技能说明</summary><p>同租户技能名称不可重复；每项技能独立维护成员及等级。</p><dl class="detail-grid"><dt>云平台技能编号</dt><dd><code>${esc(row?.skillGroupId||'保存后自动生成')}</code></dd></dl></details>`;
    ui.openLayer('skill-mapping',`<div class="layer-header"><div><h2>${id?'配置技能':'创建技能'}</h2><p>保存后可继续添加成员及等级</p></div><button onclick="PlatformUI.closeLayer('skill-mapping')">×</button></div><div class="layer-body">${form}</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('skill-mapping')">取消</button><button class="btn btn-primary" onclick="window.Pages['contact-center-settings'].saveMapping('${esc(id||'')}')">保存</button></div>`,'small');
  }
  function saveMapping(id){
    let row=id?groupById(id):null;if(!editContext||editContext!==contextKey()||editingId!==(id||'')||!canEdit(row)||(id&&!row))return denied();
    const name=document.getElementById('mappingName')?.value.trim(),tenantId=document.getElementById('mappingTenant')?.value;
    if(!name||name.length>60||!tenantId)return CloudResourceRules.error('skill-mapping','请填写 60 字以内的技能名称并选择租户');
    if(!validTenantOptions().some(t=>t.tenantId===tenantId)||(row&&row.tenantId!==tenantId))return CloudResourceRules.error('skill-mapping','请选择当前客户 / 品牌内有权使用的租户');
    if(data.physicalSkillGroups.some(g=>g.tenantId===tenantId&&g.enterpriseId===AppState.get().enterpriseId&&g.name.trim()===name&&g.physicalGroupId!==id))return CloudResourceRules.error('skill-mapping','该租户已有同名技能，请使用不同名称');
    const next={...(row||{physicalGroupId:CloudResourceRules.id('PHY'),skillGroupId:CloudResourceRules.id('SG'),enterpriseId:AppState.get().enterpriseId,memberCount:0,referenceCount:0}),name,tenantId,status:'已启用',syncStatus:'本地已保存，真实结果待确认'};
    if(!row&&data.physicalSkillGroups.some(g=>g.physicalGroupId===next.physicalGroupId||g.skillGroupId===next.skillGroupId))return CloudResourceRules.error('skill-mapping','技能标识冲突，请重试');
    if(!persistRow('groups',next))return;AliCtiDemo.skillResource(next,row);editContext='';editingId='';CloudResourceRules.changed(tenantId);ui.closeLayer('skill-mapping');showToast('技能已本地保存，真实结果待确认','success');RouteRuntime.refreshCurrent();openGroup(next.physicalGroupId,{tab:'members'});
  }
  function query(key){if(key==='skills'){if(!canView()||listContext!==contextKey())return denied();filters.skills={keyword:document.getElementById('skillKeyword')?.value.trim()||'',tenantId:document.getElementById('skillFilterTenant')?.value||'',status:document.getElementById('skillFilterStatus')?.value||'全部状态'};page=1;}navigateTo(key==='plans'?'call-plans':'skill-mappings');}
  function reset(key){if(key==='skills'){filters.skills={keyword:'',tenantId:'',status:'全部状态'};page=1;}navigateTo(key==='plans'?'call-plans':'skill-mappings');}
  function setPage(value){if(!canView()||listContext!==contextKey())return denied();page=Math.max(1,Number(value)||1);navigateTo('skill-mappings');}
  function captureNavigationState(){return {view,page,listContext,editContext,editingId,detail:detail&&{...detail},filters:clone(filters)};}
  function restoreNavigationState(state){if(!state)return;({view,page,listContext,editContext,editingId,detail}=state);Object.assign(filters,clone(state.filters));}
  window.Pages=window.Pages||{};window.Pages['contact-center-settings']={render,captureNavigationState,restoreNavigationState,init(){},openPlan,openMapping,saveMapping,query,reset,setPage,openGroup,switchGroupTab,openGroupMembers};
})();
