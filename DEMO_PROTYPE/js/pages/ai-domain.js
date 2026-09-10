/** 智能外呼通道管理；拦截、标签、记录与报表由各自的继承页面负责。 */
(function () {
  'use strict';
  const ui = PlatformUI;
  const esc = ui.escape;
  let channelKeyword = '';
  let editingChannelId = '';

  const channels = [
    { id: 'CH-AI-HQ-01', tenantId: 'TEN-NISSAN-HQ', name: '日产总部大模型通道', provider: '一知科技', account: '一知账号·日产总部', model: '大模型', concurrency: 80, today: 6248, status: '正常' },
    { id: 'CH-AI-SH-01', tenantId: 'TEN-NISSAN-SH', name: '上海门店邀约通道', provider: '一知科技', account: '一知账号·上海门店', model: '小模型', concurrency: 30, today: 1840, status: '正常' },
    { id: 'CH-AI-HQ-02', tenantId: 'TEN-NISSAN-HQ', name: '总部备用通道', provider: '一知科技', account: '一知账号·日产总部', model: '小模型', concurrency: 20, today: 0, status: '已停用' }
  ];
  const config = {
    channels: ['通道管理', '维护第三方 AI 厂商账号、模型类型与并发使用情况。']
  };

  function scoped(rows) { const ids = AppState.effectiveAccess().tenantIds; return rows.filter(row => ids.includes(row.tenantId)); }
  function tenantName(id) { return CloudCallRuntime.tenant(id)?.name || id; }
  function header(view, actions) { const [title, detail] = config[view]; return ui.pageHeader(title, detail, `<span class="domain-badge ai">第三方 AI / 非 CCC</span>${actions || ''}`); }
  function filters(extra) { return `<div class="filter-panel"><label class="field grow"><span>关键词</span><input id="aiKeyword" value="${esc(channelKeyword)}" placeholder="任务、手机号或名称"></label>${extra || ''}<button class="btn" onclick="window.Pages['ai-domain'].reset()">重置</button><button class="btn btn-primary" onclick="window.Pages['ai-domain'].query()">查询</button></div>`; }
  function renderChannels() {
    const rows = scoped(channels).filter(row => !channelKeyword || [row.id,row.name,row.provider,row.account].join(' ').toLowerCase().includes(channelKeyword.toLowerCase()));
    const scope = AppState.effectiveAccess();
    return `<section class="platform-page ai-domain-page" data-anno="ai-channel-management" data-anno-page="ai-channels" data-anno-label="第三方 AI 通道管理" data-anno-kind="region" data-anno-fields="FLD-037,FLD-038">${header('channels','<button class="btn btn-primary" data-anno-page="ai-channels" data-anno-label="新增 AI 通道" data-anno-kind="action" data-anno-fields="FLD-082,FLD-083" onclick="window.Pages[\'ai-domain\'].openChannel()">新增通道</button>')}<div class="scope-bar" style="margin-left:0;margin-right:0"><div><strong>当前配置范围</strong><span>${esc(scope.dataScopeLabel)}</span></div><div class="scope-note">通道只承载第三方 AI 厂商账号，不代表 CCC 线路或号码。</div></div>${ui.alert('info','现有智能外呼账号继续独立管理','第三方 AI 通道与阿里云 CCC 实例、号码和技能组无直接继承关系。')}${filters()}${ui.table([
      {key:'name',label:'通道名称',render:(v,r)=>`<div class="table-main">${esc(v)}</div><div class="table-sub">${esc(r.id)}</div>`},{key:'tenantId',label:'所属租户',render:v=>esc(tenantName(v))},{key:'provider',label:'厂商'},{key:'account',label:'厂商账号'},{key:'model',label:'模型类型'},{key:'concurrency',label:'并发上限'},{key:'today',label:'今日呼叫'},{key:'status',label:'状态',render:v=>ui.status(v)},{key:'id',label:'操作',render:v=>`<div class="table-actions"><button onclick="window.Pages['ai-domain'].openChannel('${v}')">配置</button></div>`}
    ],rows)}</section>`;
  }
  const annotationContracts = {
    channels: '<section data-anno-page="ai-channels" data-anno-label="第三方 AI 通道管理" data-anno-kind="region" data-anno-fields="FLD-037,FLD-038">'
  };
  function annotate(html, view) {
    const attributes = annotationContracts[view].slice('<section'.length, -1).trim();
    return html.replace('<section ', `<section ${attributes} `);
  }
  function render() { return annotate(renderChannels(), 'channels'); }
  function query() {
    channelKeyword = document.getElementById('aiKeyword')?.value.trim() || '';
    navigateTo('ai-channels');
    showToast('已按当前租户范围完成查询', 'success');
  }
  function reset() {
    channelKeyword = '';
    navigateTo('ai-channels');
  }
  function openChannel(id){
    const row=id?scoped(channels).find(x=>x.id===id):null;
    if(id&&!row){showToast('当前租户范围无权配置该通道','warning');return;}
    editingChannelId=row?.id||'';
    const access=AppState.effectiveAccess();
    const tenantOptions=(CloudCallData.tenants||[]).filter(t=>access.tenantIds.includes(t.tenantId)&&t.status==='启用').map(t=>`<option value="${esc(t.tenantId)}" ${t.tenantId===(row?.tenantId||access.tenantIds[0])?'selected':''}>${esc(t.name)}（${esc(t.organizationLabel)}）</option>`).join('');
    const providerOptions=(window.MockPlatforms||[]).map(p=>`<option value="${esc(p.name)}" ${p.name===(row?.provider||'一知科技')?'selected':''}>${esc(p.name)}</option>`).join('');
    const accounts=(CloudCallData.providerAccounts||[]).filter(a=>(access.providerAccountIds||[]).includes(a.providerAccountId));
    const accountOptions=accounts.map(a=>`<option value="${esc(a.providerAccountId)}" ${a.name===(row?.account||'')?'selected':''}>${esc(a.name)} · ${esc(a.modelType)}</option>`).join('');
    ui.openLayer('ai-channel-detail',`<div class="layer-header"><div><h2>${row?'通道配置':'新增 AI 通道'}</h2><p>${esc(row?.id||'保存后生成通道编号')}</p></div><button onclick="PlatformUI.closeLayer('ai-channel-detail')">×</button></div><div class="layer-body">${ui.alert('info','第三方 AI 能力边界','该配置沿用现有 AI 厂商账号体系，不创建阿里云 CCC 线路或号码。')}<div class="form-grid" data-anno-page="ai-channels" data-anno-label="AI 通道配置" data-anno-kind="form" data-anno-fields="FLD-082,FLD-083"><label class="field"><span>所属租户</span><select id="aiChannelTenant" ${AppState.isSuper()?'':'disabled'}>${tenantOptions}</select></label><label class="field"><span>通道名称</span><input id="aiChannelName" value="${esc(row?.name||'')}"></label><label class="field"><span>厂商</span><select id="aiChannelProvider">${providerOptions}</select></label><label class="field"><span>厂商账号</span><select id="aiChannelAccount">${accountOptions}</select><small class="field-hint">账号在租户能力中授权，这里只做通道引用。</small></label><label class="field"><span>模型类型</span><select id="aiChannelModel"><option ${row?.model==='大模型'?'selected':''}>大模型</option><option ${row?.model==='小模型'?'selected':''}>小模型</option></select></label><label class="field"><span>并发上限</span><input id="aiChannelConcurrency" type="number" min="1" value="${row?.concurrency||20}"></label><label class="field"><span>状态</span><select id="aiChannelStatus"><option ${row?.status!=='已停用'?'selected':''}>正常</option><option ${row?.status==='已停用'?'selected':''}>已停用</option></select></label></div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('ai-channel-detail')">取消</button><button class="btn btn-primary" onclick="window.Pages['ai-domain'].saveChannel()">保存</button></div>`,'small');
  }
  function saveChannel(){
    const name=document.getElementById('aiChannelName')?.value.trim();
    const concurrency=Number(document.getElementById('aiChannelConcurrency')?.value||0);
    const accountId=document.getElementById('aiChannelAccount')?.value;
    const account=(CloudCallData.providerAccounts||[]).find(x=>x.providerAccountId===accountId);
    if(!name){showToast('请输入通道名称','warning');return;}
    if(!account){showToast('请选择厂商账号','warning');return;}
    if(!Number.isInteger(concurrency)||concurrency<1){showToast('并发上限必须为正整数','warning');return;}
    const values={tenantId:document.getElementById('aiChannelTenant')?.value||AppState.effectiveAccess().tenantIds[0],name,provider:document.getElementById('aiChannelProvider')?.value,account:account.name,providerAccountId:accountId,model:document.getElementById('aiChannelModel')?.value,concurrency,status:document.getElementById('aiChannelStatus')?.value};
    const row=channels.find(x=>x.id===editingChannelId);
    if(row)Object.assign(row,values);else channels.unshift({id:`CH-AI-${String(channels.length+1).padStart(3,'0')}`,today:0,...values});
    ui.closeLayer('ai-channel-detail');
    showToast(row?'通道配置已更新':'AI 通道已创建','success');
    navigateTo('ai-channels');
  }
  window.Pages = window.Pages || {};
  window.Pages['ai-domain'] = { render, init(){}, query, reset, openChannel, saveChannel };
})();
