/** 系统设置：业务系统接入、通话数据异常和操作审计。 */
(function () {
  'use strict';
  const ui = PlatformUI;
  const esc = ui.escape;
  let view = 'systems';
  let systemKeyword = '';

  function scoped(rows) { return AppState.scoped(rows || []); }
  function tenantName(id) { return CloudCallRuntime.tenant(id)?.name || id; }
  function nowText() { return new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-'); }
  function renderSystems() {
    if(!AppState.isSuper())return renderAuthorizedSystems();
    const key = systemKeyword.toLowerCase();
    const rows = CloudCallData.businessSystems.filter(row => BusinessSystemAccess.canManage(row)&&(!key || `${row.name} ${row.owner}`.toLowerCase().includes(key)));
    return `<section class="platform-page system-page" data-anno-page="business-systems" data-anno-label="业务系统接入与身份映射" data-anno-kind="region" data-anno-fields="FLD-017,FLD-018,FLD-019,FLD-020,FLD-025,FLD-026,FLD-089,FLD-093">
      ${ui.pageHeader('业务系统', '管理技术对接的业务系统及其租户授权。')}
      <div class="filter-panel"><label class="field grow"><span>系统名称 / 服务对象</span><input id="systemKeyword" value="${esc(systemKeyword)}" placeholder="输入业务系统或客户名称"></label><div class="filter-actions"><button class="btn" onclick="window.Pages['system-center'].resetSystems()">重置</button><button class="btn btn-primary" onclick="window.Pages['system-center'].querySystems()">查询</button></div></div>
      <div class="management-list-shell">${ui.toolbar('',ui.help('超级管理员通过“租户授权”指定可使用该系统的租户；租户管理员在“已授权系统”选择系统，按手机号查询并确认平台账号与业务账号的关联。','操作说明'))}${ui.table([
        { key: 'name', label: '业务系统', render: (value, row) => `<button class="table-link" onclick="window.Pages['system-center'].openSystem('${row.businessSystemId}')"><strong>${esc(value)}</strong><small>${esc(row.owner)}</small></button>` },
        { key: 'owner', label: '服务对象' }, { key: 'authorizedTenantIds', label: '授权租户', render: value => (value||[]).map(id=>esc(tenantName(id))).join('、')||'尚未授权' }, { key: 'status', label: '接入状态', render: value => ui.status(value) },
        { key: 'accountQueryStatus', label: '手机号查询', render: value => ui.status(value || '未配置') }, { key: 'businessSystemId', label: '已关联平台账号', render: value => scoped(CloudCallData.businessAccountBindings).filter(a => a.businessSystemId === value).length },
        { key: 'callCapability', label: '人工呼叫', render: value => ui.status(value) }, { key: 'phoneBarPocStatus', label: '呼叫组件', render: value => ui.status(value) },
        { key: 'callbackStatus', label: '结果回传', render: value => ui.status(value) }, { key: 'lastSyncAt', label: '最近更新' },
        { key: 'businessSystemId', label: '操作', className: 'action-column', render: value => `<div class="table-actions"><button onclick="window.Pages['system-center'].openSystem('${value}')">配置</button><button onclick="window.Pages['system-center'].openAuthorization('${value}')">租户授权</button></div>` }
      ], rows)}</div>
    </section>`;
  }

  function renderEvents() {
    return CallDataIssues.render();
  }

  let auditFilter={keyword:'',action:'全部动作'};
  function renderAudit() {
    const rows = scoped(CloudCallData.audits).filter(r=>(!auditFilter.keyword||[r.operator,r.object,r.action].join(' ').includes(auditFilter.keyword))&&(auditFilter.action==='全部动作'||r.action===auditFilter.action));
    return `<section class="platform-page audit-page" data-anno-page="audit" data-anno-label="关键操作审计" data-anno-kind="region" data-anno-fields="FLD-103,FLD-104,FLD-105,FLD-106">${ui.pageHeader('操作审计', '记录关键配置、状态变更、导出和重试行为，包括操作前后差异。', '<button class="btn" onclick="doExport(event)">导出审计</button>')}<div class="filter-panel"><label class="field grow"><span>操作人 / 对象</span><input id="auditKeyword" value="${esc(auditFilter.keyword)}" placeholder="输入关键词"></label><label class="field"><span>动作</span><select id="auditAction">${['全部动作',...new Set(scoped(CloudCallData.audits).map(r=>r.action))].map(a=>`<option ${a===auditFilter.action?'selected':''}>${esc(a)}</option>`).join('')}</select></label><button class="btn" onclick="window.Pages['system-center'].resetAudit()">重置</button><button class="btn btn-primary" onclick="window.Pages['system-center'].queryAudit()">查询</button></div>${ui.table([{ key: 'auditId', label: '审计编号', render: value => `<code>${esc(value)}</code>` }, { key: 'operator', label: '操作人' }, { key: 'action', label: '动作' }, { key: 'object', label: '对象', render: value => `<code>${esc(value)}</code>` }, { key: 'before', label: '操作前' }, { key: 'after', label: '操作后' }, { key: 'at', label: '操作时间' }, { key: 'auditId', label: '操作', render: value => `<button class="btn-link" onclick="window.Pages['system-center'].openAudit('${value}')">查看差异</button>` }], rows)}</section>`;
  }

  function render(options) {
    view = options?.view || view;
    if(view==='authorized')return renderAuthorizedSystems(options?.businessSystemId);
    if(view==='business-accounts')return renderBusinessAccounts(options?.businessSystemId);
    if (view === 'events') return renderEvents();
    if (view === 'audit') return renderAudit();
    return renderSystems();
  }

  function openSystem(id) {
    if(!AppState.isSuper()||!AppState.effectiveAccess().valid||AppState.get().activeDomain!=='CLOUD_CONTACT_CENTER')return;
    if(!id||!BusinessSystemAccess.canManage(BusinessSystemAccess.system(id)))return;
    const row = BusinessSystemAccess.system(id);
    const mappings = scoped(CloudCallData.businessAccountBindings).filter(item => item.businessSystemId === row.businessSystemId);
    const basic = `<div class="form-grid"><label class="field"><span>业务系统名称</span><input value="${esc(row.name)}"></label><label class="field"><span>服务对象</span><input value="${esc(row.owner || '')}" placeholder="例如：东风日产"></label><label class="field"><span>接入状态</span><input value="${esc(row.status)}" readonly></label><label class="field"><span>已关联平台账号</span><input value="${mappings.length} 人" readonly></label></div>`;
    const capability = `<div class="check-grid"><div><span>手机号查询</span>${ui.status(row.accountQueryStatus || '未配置')}<small>管理员在云呼叫页面主动查询业务账号</small></div><div><span>已关联平台账号</span><strong>${mappings.length} 人</strong><small>管理员确认后绑定双方账号 ID</small></div><div><span>人工呼叫</span>${ui.status(row.callCapability)}<small>业务系统可通过呼叫组件发起</small></div><div><span>呼叫组件</span>${ui.status(row.phoneBarPocStatus)}<small>PhoneBar 由业务系统页面承载</small></div><div><span>结果回传</span>${ui.status(row.callbackStatus)}<small>通话状态与处理结果回到来源业务</small></div></div>`;
    const technical = `<details class="technical-details"><summary>技术信息</summary><dl class="detail-grid"><dt>业务系统编号</dt><dd><code>${esc(row.businessSystemId)}</code></dd><dt>用户关联规则</dt><dd>业务系统编号 + 业务用户编号</dd><dt>账号关联规则</dt><dd>管理员按手机号查询后确认，绑定业务用户编号与平台账号编号；双方资料独立维护，外呼前只校验关联有效性</dd></dl></details>`;
    ui.openLayer('system-detail', `<div class="layer-header"><div><h2>${esc(row.name)}</h2><p>${esc(row.status)}</p></div><button onclick="PlatformUI.closeLayer('system-detail')">×</button></div><div class="layer-body">${ui.detailSection('基本信息', basic)}${ui.detailSection('可用能力', capability)}${technical}</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('system-detail')">关闭</button><button class="btn btn-primary" onclick="PlatformUI.closeLayer('system-detail');showToast('业务系统配置已保存','success')">保存</button></div>`, 'wide');
  }

  function reconcile(id) {
    CallDataIssues.open(id);
  }


  function querySystems() { systemKeyword = document.getElementById('systemKeyword')?.value || ''; navigateTo('business-systems'); }
  function resetSystems() { systemKeyword = ''; navigateTo('business-systems'); }

  function queryAudit(){auditFilter={keyword:document.getElementById('auditKeyword').value.trim(),action:document.getElementById('auditAction').value};navigateTo('audit');}
  function resetAudit(){auditFilter={keyword:'',action:'全部动作'};navigateTo('audit');}
  function openAudit(id) {
    const row = CloudCallData.audits.find(item => item.auditId === id);
    if (!row) return;
    ui.openLayer('audit-detail', `<div class="layer-header"><div><h2>${esc(row.action)}</h2><p>${esc(row.auditId)} · ${esc(row.at)}</p></div><button onclick="PlatformUI.closeLayer('audit-detail')">×</button></div><div class="layer-body"><dl class="detail-grid"><dt>操作人</dt><dd>${esc(row.operator)}</dd><dt>对象</dt><dd><code>${esc(row.object)}</code></dd><dt>租户</dt><dd>${esc(tenantName(row.tenantId) || '实例级')}</dd></dl><div class="diff-grid"><div><span>操作前</span><strong>${esc(row.before)}</strong></div><i>→</i><div><span>操作后</span><strong>${esc(row.after)}</strong></div></div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('audit-detail')">关闭</button></div>`, 'small');
  }

  let authorizationContext=null;
  function openAuthorization(id){
    const system=BusinessSystemAccess.system(id);if(!BusinessSystemAccess.canManage(system))return;
    authorizationContext={id,context:BusinessSystemAccess.context(),previous:JSON.stringify(system.authorizedTenantIds||[])};
    const tenants=CloudCallData.tenants.filter(t=>t.instanceId===system.instanceId&&t.status==='启用'&&t.capabilitySet.includes('CLOUD_CONTACT_CENTER'));
    const selected=tenants.filter(t=>(system.authorizedTenantIds||[]).includes(t.tenantId)).length;
    const rows=tenants.map((t,index)=>({...t,orderNo:index+1,authorized:(system.authorizedTenantIds||[]).includes(t.tenantId)}));
    ui.openLayer('business-authorization',`<div class="layer-header"><div><h2>租户授权 · ${esc(system.name)}</h2><p>选择可使用该业务系统的租户，保存后生效。</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer('business-authorization')">×</button></div><div class="layer-body"><div class="business-grant-search"><label class="field grow"><span>租户名称</span><input id="businessGrantKeyword" placeholder="输入租户名称搜索" oninput="window.Pages['system-center'].filterAuthorizationTenants()"></label></div><div class="business-grant-summary"><strong>可授权租户 <span>${tenants.length}</span></strong><span id="businessGrantSelection">已选 ${selected} 个租户</span></div><div class="business-grant-table">${ui.table([
      {key:'tenantId',label:'选择',width:'64px',render:(v,t)=>`<input type="checkbox" name="businessAuthorizedTenant" value="${esc(v)}" data-search="${esc(t.name.toLowerCase())}" aria-label="授权 ${esc(t.name)}" ${t.authorized?'checked':''} onchange="window.Pages['system-center'].updateAuthorizationSelection()">`},
      {key:'orderNo',label:'序号',width:'64px'},
      {key:'name',label:'租户名称',render:v=>`<strong class="business-grant-name">${esc(v)}</strong>`},
      {key:'organizationLabel',label:'组织类型'},
      {key:'authorized',label:'当前授权',render:v=>ui.status(v?'已授权':'未授权')}
    ],rows,{emptyText:'暂无可授权租户，请先配置当前品牌下已开通云呼叫的租户。'})}<div id="businessGrantEmpty" hidden>${ui.empty('没有匹配的租户','请调整搜索条件。')}</div></div><p class="business-grant-hint">授权后，租户管理员可在“已授权系统”中关联账号。取消授权后，该租户不能再通过此系统查询、关联或发起外呼，已有绑定记录保留。</p></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('business-authorization')">取消</button><button class="btn btn-primary" onclick="window.Pages['system-center'].saveAuthorization()">保存授权</button></div>`,'wide');
  }
  function filterAuthorizationTenants(){
    const keyword=(document.getElementById('businessGrantKeyword')?.value||'').trim().toLowerCase();
    let visible=0;
    // 只隐藏不匹配行，保留跨搜索的勾选，保存时仍包含全部已选租户。
    document.querySelectorAll('input[name="businessAuthorizedTenant"]').forEach(input=>{
      const matched=(input.dataset.search||'').includes(keyword),row=input.closest('tr');
      if(row)row.hidden=!matched;if(matched)visible++;
    });
    const empty=document.getElementById('businessGrantEmpty');if(empty)empty.hidden=!keyword||visible>0;
  }
  function updateAuthorizationSelection(){
    const counter=document.getElementById('businessGrantSelection');
    if(counter)counter.textContent='已选 '+document.querySelectorAll('input[name="businessAuthorizedTenant"]:checked').length+' 个租户';
  }

  function saveAuthorization(){
    const c=authorizationContext,s=c&&BusinessSystemAccess.system(c.id);
    if(!c||c.context!==BusinessSystemAccess.context()||!BusinessSystemAccess.canManage(s))return showToast('当前权限或工作范围已变化，请重新打开授权页面','warning');
    if(JSON.stringify(s.authorizedTenantIds||[])!==c.previous)return showToast('授权内容已变化，请重新打开核对','warning');
    const ids=[...new Set([...document.querySelectorAll('input[name="businessAuthorizedTenant"]:checked')].map(n=>n.value))];
    if(ids.some(id=>{const t=CloudCallRuntime.tenant(id);return !t||t.instanceId!==s.instanceId||t.status!=='启用'||!t.capabilitySet.includes('CLOUD_CONTACT_CENTER');}))return showToast('只能授权当前品牌下已开通云呼叫的有效租户','warning');
    const before=s.authorizedTenantIds||[];s.authorizedTenantIds=ids;
    try{BusinessSystemAccess.persist();}catch(error){s.authorizedTenantIds=before;return showToast('演示授权保存失败，请重试','warning');}
    CloudCallRuntime.addAudit('业务系统租户授权',s.businessSystemId,'',before.map(tenantName).join('、')||'无',ids.map(tenantName).join('、')||'无');
    authorizationContext=null;ui.closeLayer('business-authorization');showToast('租户授权已保存','success');AppState.notify();
  }
  let selectedBusinessSystem='',businessPageContext='';
  function renderAuthorizedSystems(requestedId){
    if(!AppState.canMenu('business.accounts'))return ui.empty('当前身份无权访问');
    const context=BusinessSystemAccess.context();
    if(context!==businessPageContext){businessPageContext=context;selectedBusinessSystem='';}
    const systems=BusinessSystemAccess.forTenant(AppState.get().tenantId);
    if(requestedId&&!systems.some(s=>s.businessSystemId===requestedId))return ui.empty('当前租户未获授权','请联系超级管理员确认业务系统使用授权。');
    if(requestedId)selectedBusinessSystem=requestedId;
    if(!systems.some(s=>s.businessSystemId===selectedBusinessSystem))selectedBusinessSystem=systems[0]?.businessSystemId||'';
    const header=ui.pageHeader('已授权系统','当前租户：'+tenantName(AppState.get().tenantId)+'。在本页选择业务系统，完成平台账号关联与有效性校验。');
    if(!systems.length)return `<section class="platform-page">${header}${ui.empty('当前租户暂无获授权的业务系统','请联系超级管理员授权。')}</section>`;
    return `<section class="platform-page">${header}<div class="filter-panel"><label class="field grow"><span>业务系统</span><select id="authorizedBusinessSystem" onchange="window.Pages['system-center'].selectBusinessSystem(this.value)">${systems.map(s=>`<option value="${esc(s.businessSystemId)}" ${s.businessSystemId===selectedBusinessSystem?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label></div>${renderBusinessAccounts(selectedBusinessSystem,true)}</section>`;
  }
  function selectBusinessSystem(id){
    if(!BusinessSystemAccess.canUse(id))return showToast('当前租户未获授权','warning');
    BusinessAccountBinding.closeBinding();
    navigateTo('tenant-business-systems',{businessSystemId:id});
  }
  function renderBusinessAccounts(id,embedded=false){
    if(!BusinessSystemAccess.canUse(id))return ui.empty('当前租户未获授权','请联系超级管理员确认业务系统使用授权。');
    const s=BusinessSystemAccess.system(id),rows=BusinessAccountBinding.accounts(id).filter(a=>!a.businessBinding).map((a,index)=>({...a,orderNo:index+1,validity:{state:'未关联'}}));
    return `${embedded?'':`<section class="platform-page">${ui.pageHeader(s.name,'按手机号查询此业务系统，核对后关联双方账号。')}`}<div class="management-list-shell">${ui.toolbar(`<button class="btn btn-primary" onclick="BusinessAccountBinding.openBinding('', '${esc(id)}')">搜索手机号关联</button>`,ui.help('由超级管理员授权系统使用范围；本页固定查询当前系统，确认后保存双方已有账号 ID。双方资料各自维护，外呼前校验关联有效性。'))}${ui.table([{key:'orderNo',label:'序号',width:'64px'},{key:'loginUsername',label:'平台账号'},{key:'userName',label:'姓名'},{key:'mobile',label:'手机号'},{key:'validity',label:'关联状态',render:v=>ui.status(v.state)},{key:'businessBinding',label:'业务账号姓名（关联时）',render:(v,r)=>esc(r.businessUserId?(v?.businessUserName||r.userName):'—')},{key:'accountId',label:'操作',render:(value,r)=>r.businessUserId?`<button class="table-link" onclick="window.Pages['system-center'].openAccountBinding('${esc(id)}','${value}')">查看关联</button>`:`<button class="table-link" onclick="BusinessAccountBinding.openBinding('${value}','${esc(id)}')">关联账号</button>`}],rows,{emptyText:'当前租户在此业务系统中暂无未关联的平台账号。'})}</div>${embedded?'':'</section>'}`;
  }
  function openAccountBinding(systemId,identityId){
    if(!BusinessSystemAccess.canUse(systemId))return;
    const a=BusinessAccountBinding.reviewAccounts(systemId).find(a=>a.accountId===identityId&&a.businessUserId);if(!a)return;
    ui.openLayer('business-account-detail',`<div class="layer-header"><h2>账号关联详情</h2><button onclick="PlatformUI.closeLayer('business-account-detail')">×</button></div><div class="layer-body"><dl class="detail-grid"><dt>业务系统</dt><dd>${esc(BusinessSystemAccess.system(systemId).name)}</dd><dt>平台账号</dt><dd>${esc(a.userName)}</dd><dt>业务账号（关联时）</dt><dd>${esc(a.businessBinding?.businessUserName||'—')}</dd><dt>所属租户</dt><dd>${esc(tenantName(a.tenantId))}</dd><dt>关联状态</dt><dd>${ui.status(a.validity.state)}</dd><dt>校验说明</dt><dd>${esc(a.validity.reason)}</dd></dl><p class="field-hint">双方资料各自维护；外呼前重新校验，不自动改绑或停用另一方账号。</p><details class="technical-details"><summary>账号 ID</summary><dl class="detail-grid"><dt>平台账号 ID</dt><dd>${esc(a.accountId)}</dd><dt>业务账号 ID</dt><dd>${esc(a.businessUserId)}</dd></dl></details></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('business-account-detail')">关闭</button><button class="btn btn-primary" onclick="window.Pages['system-center'].openAccountBinding('${esc(systemId)}','${esc(identityId)}')">重新校验</button></div>`,'wide');
  }
  window.Pages = window.Pages || {};
  window.Pages['system-center'] = { render, init() {}, openSystem, openAuthorization,saveAuthorization,filterAuthorizationTenants,updateAuthorizationSelection,openAccountBinding,selectBusinessSystem, reconcile, querySystems, resetSystems, queryAudit, resetAudit, openAudit };
})();
