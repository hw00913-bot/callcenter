/** 呼入路由：共享号码先识别唯一租户，再进入租户服务团队。 */
(function(){
  'use strict';const ui=PlatformUI,esc=ui.escape;let keyword='';let editingId='';
  function visibleRoutes(){const access=AppState.effectiveAccess();return CloudCallData.inboundRoutes.filter(x=>x.instanceId===access.instanceId).filter(x=>AppState.isSuper()||x.defaultTenantId===access.tenantId||x.branches.some(b=>b.tenantId===access.tenantId));}
  function numberLabel(id){return CloudCallData.phoneNumbers.find(x=>x.numberId===id)?.number||id;}
  function render(){const key=keyword.toLowerCase();const rows=visibleRoutes().map(x=>({...x,number:numberLabel(x.numberId),branchCount:AppState.isSuper()?x.branches.length:x.branches.filter(b=>b.tenantId===AppState.get().tenantId).length,defaultTenant:CloudCallRuntime.tenant(x.defaultTenantId)?.name||'未配置'})).filter(row=>!key||`${row.number} ${row.defaultTenant}`.toLowerCase().includes(key));const actions=AppState.isSuper()?'<button class="btn btn-primary" onclick="window.Pages[\'inbound-routing\'].openRoute()">新建呼入路由</button>':'';return `<section class="platform-page inbound-route-page" data-anno-page="inbound-routes" data-anno-label="共享号码呼入租户锁定" data-anno-kind="region" data-anno-fields="FLD-048,FLD-058,FLD-060,FLD-061,FLD-062,FLD-063,FLD-064,FLD-065">${ui.pageHeader('呼入路由','配置客户来电后的按键导航、所属租户、服务团队和超时处理。')}<div class="filter-panel"><label class="field grow"><span>号码 / 默认租户</span><input id="routeKeyword" value="${esc(keyword)}" placeholder="输入号码或租户名称"></label><div class="filter-actions"><button class="btn" onclick="window.Pages['inbound-routing'].resetFilters()">重置</button><button class="btn btn-primary" onclick="window.Pages['inbound-routing'].query()">查询</button></div></div><div class="business-route-preview"><span>客户来电</span><i>→</i><span>按键选择服务</span><i>→</i><span>确定所属租户</span><i>→</i><span>进入服务团队</span><i>→</i><span>坐席接听</span></div><div class="management-list-shell">${ui.toolbar(actions,ui.help('客户未选择或无法识别时，进入预先设置的默认租户；确定租户后不会再跨租户分配坐席。'))}${ui.table([
    {key:'number',label:'呼入号码'},{key:'routeVersion',label:'当前版本',render:v=>`<span class="version-pill">${esc(v)}</span>`},{key:'branchCount',label:'服务分支'},{key:'defaultTenant',label:'默认租户'},{key:'status',label:'状态',render:v=>ui.status(v)},{key:'updatedAt',label:'更新时间'},{key:'routeId',label:'操作',className:'action-column',render:v=>`<div class="table-actions"><button onclick="window.Pages['inbound-routing'].openRoute('${v}')">${AppState.isSuper()?'配置':'查看'}</button></div>`}
  ],rows)}</div></section>`;}
  function openRoute(id){editingId=id||'';const row=CloudCallData.inboundRoutes.find(x=>x.routeId===id)||{routeId:'',numberId:'',routeVersion:'草稿',status:'待发布',contactFlowId:'',defaultTenantId:'',branches:[],overrides:{}};const ownTenant=AppState.get().tenantId;const branches=AppState.isSuper()?row.branches:row.branches.filter(x=>x.tenantId===ownTenant);const instance=AppState.get().instance;const branchRows=`<div class="route-branch-list">${branches.map(x=>{const group=CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===x.physicalGroupId);return `<div><span>按 ${esc(x.branchCode)}</span><strong>${esc(x.label)}</strong><i>→</i><span>${esc(CloudCallRuntime.tenant(x.tenantId)?.name||'—')}</span><i>→</i><span>${esc(group?.name||'未配置服务团队')}</span></div>`;}).join('')||ui.empty('当前租户没有可见分支')}</div>`;const fallback=AppState.isSuper()?`<div class="form-grid"><label class="field"><span>未选择或无法识别时进入</span><select id="routeDefaultTenant">${AppState.availableTenants().map(x=>`<option value="${x.tenantId}" ${x.tenantId===row.defaultTenantId?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label></div>`:'';const rules=`<div class="rule-grid">${Object.entries(row.overrides||{}).filter(([id])=>AppState.isSuper()||id===ownTenant).map(([tenantId,value])=>`<div><span>${esc(CloudCallRuntime.tenant(tenantId)?.name||tenantId)}</span><label class="field"><span>服务时间</span><input data-route-time="${tenantId}" value="${esc(value.serviceTime)}"></label><label class="field"><span>排队超时（秒）</span><input type="number" min="1" max="3600" data-route-queue="${tenantId}" value="${value.queueTimeoutSeconds}"></label></div>`).join('')}<div><span>客户 / 品牌默认</span><strong>${esc(instance?.defaultService.timeRange||'—')}</strong><small>排队 ${instance?.defaultService.queueTimeoutSeconds||'—'} 秒</small></div></div>`;ui.openLayer('route-detail',`<div class="layer-header"><div><h2>${id?esc(numberLabel(row.numberId))+' 呼入路由':'新建呼入路由'}</h2><p>${esc(row.routeVersion)} · ${esc(row.status)}</p></div><button onclick="PlatformUI.closeLayer('route-detail')">×</button></div><div class="layer-body">${!id?ui.detailSection('呼入入口',newRouteFields()):''}${ui.detailSection('按键导航与服务团队',branchRows)}${fallback?ui.detailSection('默认处理',fallback):''}${ui.detailSection('服务时间与排队',rules)}<details class="technical-details"><summary>技术信息</summary><dl class="detail-grid"><dt>自动语音流程</dt><dd><code>${esc(row.contactFlowId)}</code></dd><dt>证据范围</dt><dd>本地配置演示；真实分支、团队和号码生效须回查。</dd><dt>路由编号</dt><dd><code>${esc(row.routeId)}</code></dd></dl></details></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('route-detail')">关闭</button>${AppState.isSuper()?'<button class="btn btn-primary" onclick="window.Pages[\'inbound-routing\'].publish()">发布新版本</button>':'<button class="btn btn-primary" onclick="window.Pages[\'inbound-routing\'].saveOverrides()">保存</button>'}</div>`,'wide');}

  function newRouteFields(){
    const numbers=CloudCallData.phoneNumbers.filter(n=>n.instanceId===AppState.get().instanceId&&!CloudCallData.inboundRoutes.some(r=>r.numberId===n.numberId)&&n.authorizedTenantIds.some(t=>CloudResourceRules.usableNumber(n,t,'呼入')));
    const flows=CloudCallData.contactFlows.filter(f=>f.instanceId===AppState.get().instanceId&&f.status==='已发布'&&f.usage==='呼入入口');
    return '<div class="form-grid"><label class="field"><span>呼入号码</span><select id="routeNumber"><option value="">请选择尚未配置路由的可用号码</option>'+numbers.map(n=>'<option value="'+n.numberId+'">'+esc(n.number)+'</option>').join('')+'</select></label><label class="field"><span>已发布的导航流程</span><select id="routeFlow"><option value="">请选择</option>'+flows.map(f=>'<option value="'+f.contactFlowId+'">'+esc(f.name)+'</option>').join('')+'</select></label></div><p class="form-help">导航按键与分支沿用云平台已发布流程，不在此编辑语音流程。</p>';
  }
  function readOverrides(row){
    const overrides=structuredClone(row.overrides||{});
    for(const el of document.querySelectorAll('[data-route-time]')){
      const tenantId=el.dataset.routeTime,time=el.value.trim(),queue=Number(document.querySelector('[data-route-queue="'+tenantId+'"]').value);
      if(!time||!Number.isInteger(queue)||queue<1||queue>3600){CloudResourceRules.error('route-detail','请填写服务时间；排队超时应为 1–3600 秒的整数');return null;}
      overrides[tenantId]={...(overrides[tenantId]||{}),serviceTime:time,queueTimeoutSeconds:queue,source:'租户覆盖'};
    }
    return overrides;
  }
  function saveOverrides(){
    const row=CloudCallData.inboundRoutes.find(r=>r.routeId===editingId);if(!row)return;
    const overrides=readOverrides(row);if(!overrides)return;
    const own=AppState.get().tenantId;
    row.overrides[own]=overrides[own];row.updatedAt=new Date().toLocaleString('zh-CN');
    CloudResourceRules.changed(own,['INBOUND']);ui.closeLayer('route-detail');showToast('本租户演示规则已保存；阿里实际流程一致性待核验','success');navigateTo('inbound-routes');
  }
  function publish(){
    if(!AppState.effectiveAccess().valid||!AppState.isSuper()||!AppState.canMenu('settings.routes'))return;
    const instanceId=AppState.get().instanceId;
    const row=CloudCallData.inboundRoutes.find(r=>r.routeId===editingId);
    if(editingId&&(!row||row.instanceId!==instanceId))return CloudResourceRules.error('route-detail','路由不属于当前客户 / 品牌，请重新打开配置');
    const numberId=row?.numberId||document.getElementById('routeNumber')?.value,contactFlowId=row?.contactFlowId||document.getElementById('routeFlow')?.value,defaultTenantId=document.getElementById('routeDefaultTenant')?.value;
    const number=CloudCallData.phoneNumbers.find(n=>n.numberId===numberId);
    const authorizedTenant=id=>{const tenant=CloudCallRuntime.tenant(id);return tenant&&tenant.instanceId===instanceId&&tenant.status==='启用'&&(tenant.capabilitySet||[]).includes('CLOUD_CONTACT_CENTER')&&CloudResourceRules.usableNumber(number,id,'呼入');};
    if(!number||number.instanceId!==instanceId||!authorizedTenant(defaultTenantId))return CloudResourceRules.error('route-detail','请选择可用呼入号码，默认租户须为同品牌已启用且获号码授权的云呼叫租户');
    if(!CloudCallData.contactFlows.some(f=>f.contactFlowId===contactFlowId&&f.instanceId===instanceId&&f.usage==='呼入入口'&&f.status==='已发布'))return CloudResourceRules.error('route-detail','请选择同品牌已发布的呼入导航流程');
    if(!row&&CloudCallData.inboundRoutes.some(r=>r.numberId===numberId))return CloudResourceRules.error('route-detail','该号码已有路由，请打开原路由配置');
    const reference=row||CloudCallData.inboundRoutes.find(r=>r.contactFlowId===contactFlowId&&r.instanceId===instanceId&&r.status==='已发布');
    if(!reference?.branches?.length)return CloudResourceRules.error('route-detail','此导航流程的分支尚未同步，请先完成云平台配置与同步');
    // Validate a detached candidate in full before touching routes/history/number.
    const branches=structuredClone(reference.branches);
    for(const branch of branches){
      const label=branch.label||branch.branchCode||'未命名分支';
      if(!authorizedTenant(branch.tenantId))return CloudResourceRules.error('route-detail',`${label}：分支租户未获该号码授权，或不属于当前品牌的已启用云呼叫租户`);
      const group=CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===branch.physicalGroupId);
      if(!group||group.instanceId!==instanceId||group.tenantId!==branch.tenantId||group.status!=='已启用')return CloudResourceRules.error('route-detail',`${label}：服务团队须为当前品牌、分支租户下的已启用技能组`);
    }
    const overrides=readOverrides(row||{});if(!overrides)return;
    if(!Object.keys(overrides).every(authorizedTenant))return CloudResourceRules.error('route-detail','服务规则覆盖包含未授权、已停用或跨品牌租户，请先调整规则');
    const previous=row||{routeId:CloudResourceRules.id('ROUTE'),instanceId,numberId,contactFlowId,routeVersion:'V0'};
    const version=Number(previous.routeVersion.replace('V',''));
    if(!Number.isInteger(version)||version<0)return CloudResourceRules.error('route-detail','路由版本无效，请先核查原配置');
    const next={...previous,branches,history:[...(previous.history||[]),{version:previous.routeVersion,defaultTenantId:previous.defaultTenantId,overrides:structuredClone(previous.overrides||{})}],defaultTenantId,overrides,status:'已发布',routeVersion:'V'+(version+1),updatedAt:new Date().toLocaleString('zh-CN')};
    const affectedTenantIds=[...new Set([previous.defaultTenantId,defaultTenantId,...branches.map(branch=>branch.tenantId)].filter(Boolean))];
    if(row)Object.assign(row,next);else CloudCallData.inboundRoutes.push(next);
    number.contactFlowId=contactFlowId;affectedTenantIds.forEach(id=>CloudResourceRules.changed(id,['INBOUND']));
    ui.closeLayer('route-detail');showToast('呼入路由演示版本已发布；未提交阿里变更','success');navigateTo('inbound-routes');
  }
  function query(){keyword=document.getElementById('routeKeyword')?.value||'';navigateTo('inbound-routes');}
  function resetFilters(){keyword='';navigateTo('inbound-routes');}
  window.Pages=window.Pages||{};window.Pages['inbound-routing']={render,init(){},openRoute,publish,saveOverrides,query,resetFilters};
})();
