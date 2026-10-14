/** 应用接入：PAGE-001/003/004/005；FUNC-018/019/020/001，删除FUNC-021；FUNC-002为后台身份能力。 */
(function () {
  'use strict';
  window.Pages = window.Pages || {};
  const ui = () => window.PlatformUI;
  const runtime = () => window.DccRuntime;
  const esc = value => ui().escape(value);
  const command = (name, ...args) => esc("window.Pages['application-access']." + name + '(' + args.map(value => JSON.stringify(value)).join(',') + ')');
  const tenantRows = () => (window.CloudCallData?.tenants || []).filter(row => row.builtIn !== true && row.status === '启用');
  const tenantName = id => tenantRows().find(row => row.tenantId === id)?.name || id;
  const contextKey = () => { const state = window.AppState?.get?.() || {}; return [state.accountId, state.tenantId, state.enterpriseId, state.activeDomain].join('|'); };
  let context = '', view = 'list', selectedId = '', keyword = '', page = 1, revealed = false, saving = false;
  const pageSize = 10;
  const allowed = () => runtime()?.canManageApplications() && context === contextKey();
  const notify = (message, tone) => window.showToast?.(message, tone);
  const denied = () => '<section class="platform-page"><div class="route-denied"><div class="denied-mark">!</div><h1>当前身份无权访问</h1><p>仅超级管理员可管理应用接入。</p><button class="btn btn-primary" onclick="navigateTo(\'home\')">返回工作台</button></div></section>';
  function dateLabel(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString('zh-CN', { hour12: false }) : '—';
  }
  function application(id) {
    if (!allowed()) return null;
    return runtime().listApplications().data?.find(row => row.applicationId === id) || null;
  }
  function refresh() { if (window.RouteRuntime?.refreshCurrent) return window.RouteRuntime.refreshCurrent(); return window.navigateTo?.('application-access', { applicationView: view, applicationId: selectedId, preserveFilters: true }); }
  function go(nextView, id) {
    if (!allowed() || saving) return false;
    view = nextView; selectedId = id || ''; revealed = false;
    return window.navigateTo('application-access', { applicationView: view, applicationId: selectedId, preserveFilters: true });
  }
  function backButton() { return '<button class="btn btn-default" type="button" onclick="' + command('back') + '">返回应用列表</button>'; }
  function renderList(applications) {
    const filtered = applications.filter(row => !keyword || [row.name, row.applicationId].join(' ').toLowerCase().includes(keyword.toLowerCase()));
    const rows = ui().sortByUpdated?.(filtered, ['createdAt']) || filtered;
    page = Math.min(page, Math.max(1, Math.ceil(rows.length / pageSize)));
    const start = (page - 1) * pageSize;
    return ui().pageHeader('应用接入', '创建应用，获取用于申请 token 的接入密钥。', '<button class="btn btn-primary" type="button" onclick="' + command('openCreate') + '">新增应用</button>') +
      '<form class="filter-panel" onsubmit="event.preventDefault();' + command('query') + '"><label class="field"><span>应用名称 / appId</span><input id="dccApplicationKeyword" value="' + esc(keyword) + '" placeholder="输入应用名称或 appId"></label><div class="filter-actions"><button class="btn btn-primary" type="submit">查询</button><button class="btn btn-default" type="button" onclick="' + command('resetFilters') + '">重置</button></div></form>' +
      '<div class="management-list-shell dcc-application-list">' + ui().toolbar('<span class="dcc-application-count">共 ' + rows.length + ' 个应用</span>', '<button class="btn btn-default" type="button" onclick="' + command('refreshList') + '">刷新</button>') +
      ui().table([
        { key: 'name', label: '应用名称', render: (value, row) => '<button class="table-link" type="button" onclick="' + command('openDetail', row.applicationId) + '">' + esc(value || row.applicationId) + '</button>' },
        { key: 'applicationId', label: 'appId', render: value => '<code>' + esc(value) + '</code>' },
        { key: 'callbackUrl', label: '结果回传', render: value => esc(runtime().validCallbackUrl(value) ? '已配置回调地址' : value ? '地址待修正' : '未配置') },
        { key: 'createdAt', label: '创建时间', render: value => esc(dateLabel(value)) },
        { key: 'applicationId', label: '操作', width: '220px', render: id => '<div class="table-actions"><button class="btn-link" type="button" onclick="' + command('openDetail', id) + '">详情</button><button class="btn-link" type="button" onclick="' + command('openEdit', id) + '">修改</button><button class="btn-link dcc-application-delete" type="button" onclick="' + command('remove', id) + '">删除</button></div>' }
      ], rows.slice(start, start + pageSize), { numbered: false, emptyText: keyword ? '暂无符合条件的应用' : '暂无应用', emptyDetail: keyword ? '调整查询条件后重试。' : '点击“新增应用”获取接入密钥。' }) + ui().pagination(rows.length, page, pageSize, "window.Pages['application-access'].setPage") + '</div>';
  }
  function tenantChoices(selected) {
    return tenantRows().map(row => '<label class="dcc-application-tenant-choice"><input name="dccAuthorizedTenant" type="checkbox" value="' + esc(row.tenantId) + '"' + (selected.includes(row.tenantId) ? ' checked' : '') + '><span>' + esc(row.name) + '</span></label>').join('');
  }
  function renderForm(row) {
    const editing = view === 'edit';
    return '<div class="dcc-application-back">' + backButton() + '</div>' + ui().pageHeader(editing ? '修改应用' : '新增应用', editing ? '' : '填写应用名称，保存后生成 appId 和 appSecret。') +
      '<section class="panel-card dcc-application-form-card" data-func-id="' + (editing ? 'FUNC-001' : 'FUNC-019') + '"><form id="dccApplicationForm" onsubmit="' + command('save') + ';return false;" class="dcc-application-form">' +
      '<label class="field"><span>应用名称 <b class="dcc-application-required">*</b></span><input id="dccApplicationName" value="' + esc(row?.name || '') + '" placeholder="请输入应用名称" required maxlength="60" autocomplete="off"></label>' +
      '<fieldset class="dcc-application-tenant-field"><legend>可访问租户 <b class="dcc-application-required">*</b></legend><div class="dcc-application-tenant-options">' + tenantChoices(row?.authorizedTenantIds || []) + '</div></fieldset>' +
      '<label class="field"><span>回调地址</span><input id="dccApplicationCallbackUrl" type="url" value="' + esc(row?.callbackUrl || '') + '" placeholder="https://业务系统地址/回调路径" autocomplete="off"><small>用于回传通话结果和客户业务信息。配置后才可通过接口导入客户。</small></label>' +
      '<div id="dccApplicationFormError" class="form-error" role="alert" aria-live="polite"></div><div class="dcc-application-form-actions"><button class="btn btn-default" type="button" onclick="' + command('back') + '">取消</button><button class="btn btn-primary" id="dccApplicationSave" type="submit">' + (editing ? '保存修改' : '创建应用') + '</button></div></form></section>';
  }
  function renderDetail(row) {
    const tenants = (row.authorizedTenantIds || []).map(id => '<span class="dcc-application-tenant-tag">' + esc(tenantName(id)) + '</span>').join('');
    return '<div class="dcc-application-back">' + backButton() + '</div>' + ui().pageHeader('应用详情', '', '<button class="btn btn-default" type="button" onclick="' + command('openEdit', row.applicationId) + '">修改应用</button><button class="btn btn-default dcc-application-delete" type="button" onclick="' + command('remove', row.applicationId) + '">删除应用</button>') +
      '<section class="panel-card dcc-application-detail-card" data-func-id="FUNC-020"><div class="panel-header"><h2>' + esc(row.name || row.applicationId) + '</h2></div><div class="panel-body"><dl class="dcc-application-details">' +
      '<div><dt>appId</dt><dd class="dcc-application-credential"><code>' + esc(row.applicationId) + '</code><button class="btn btn-default" type="button" aria-label="复制 appId" onclick="' + command('copy', 'applicationId') + '">复制</button></dd></div>' +
      '<div data-func-id="FUNC-020"><dt>appSecret</dt><dd><div class="dcc-application-credential"><code id="dccApplicationSecret">' + (revealed ? esc(row.credentialPlaceholder) : '••••••••••••••••••••••••') + '</code><button class="btn btn-default" type="button" id="dccApplicationReveal" aria-pressed="' + revealed + '" onclick="' + command('toggleSecret') + '">' + (revealed ? '隐藏' : '显示') + '</button><button class="btn btn-default" type="button" aria-label="复制 appSecret" onclick="' + command('copy', 'credentialPlaceholder') + '">复制</button></div><p class="dcc-application-secret-note">当前为本地演示密钥。</p></dd></div>' +
      '<div><dt>回调地址</dt><dd style="overflow-wrap:anywhere" data-application-callback>' + esc(row.callbackUrl || '未配置') + (!runtime().validCallbackUrl(row.callbackUrl) ? '<p class="dcc-application-secret-note">请先配置回调地址，再通过接口导入客户。</p>' : '') + '</dd></div>' +
      '<div><dt>可访问租户</dt><dd class="dcc-application-tenants">' + tenants + '</dd></div><div><dt>创建时间</dt><dd>' + esc(dateLabel(row.createdAt)) + '</dd></div>' +
      '</dl></div></section>';
  }
  function render(options = {}) {
    if (!runtime()?.canManageApplications()) return denied();
    const nextContext = contextKey();
    const contextChanged = context !== nextContext;
    if (contextChanged) { context = nextContext; view = 'list'; selectedId = ''; keyword = ''; page = 1; revealed = false; saving = false; }
    if (!contextChanged && !options.preserveFilters && !options.applicationView) { view = 'list'; selectedId = ''; keyword = ''; page = 1; revealed = false; }
    if (!contextChanged && options.applicationView) {
      const nextView = ['list', 'create', 'detail', 'edit'].includes(options.applicationView) ? options.applicationView : 'list';
      if (selectedId !== (options.applicationId || '') || view !== nextView) revealed = false;
      view = nextView; selectedId = options.applicationId || '';
    }
    const result = runtime().listApplications();
    if (!result.ok) return denied();
    const row = result.data.find(item => item.applicationId === selectedId);
    if (['detail', 'edit'].includes(view) && !row) { view = 'list'; selectedId = ''; revealed = false; }
    const body = view === 'list' ? renderList(result.data) : view === 'detail' ? renderDetail(row) : renderForm(row);
    const pageId={list:'PAGE-001',create:'PAGE-003',detail:'PAGE-004',edit:'PAGE-005'}[view],functionId={list:'FUNC-018',create:'FUNC-019',detail:'FUNC-020',edit:'FUNC-001'}[view];
    return '<section class="platform-page dcc-application-page" data-page-id="'+pageId+'" data-func-id="'+functionId+'" data-application-view="' + view + '" data-application-id="' + esc(selectedId) + '">' + body + '</section>';
  }
  function openCreate() { return go('create'); }
  function openDetail(id) { return application(id) ? go('detail', id) : false; }
  function openEdit(id) { return application(id) ? go('edit', id) : false; }
  function back() { return go('list'); }
  function query() { if (!allowed()) return false; keyword = document.getElementById('dccApplicationKeyword')?.value.trim() || ''; page = 1; return refresh(); }
  function resetFilters() { if (!allowed()) return false; keyword = ''; page = 1; return refresh(); }
  function setPage(value) { if (!allowed()) return false; page = Math.max(1, Number(value) || 1); return refresh(); }
  function refreshList() { if (!allowed()) return false; return refresh(); }
  function formError(message) { const node = document.getElementById('dccApplicationFormError'); if (node) node.textContent = message || ''; }
  function save() {
    if (!allowed() || saving || !['create', 'edit'].includes(view)) return false;
    const form = document.getElementById('dccApplicationForm');
    if (!form?.reportValidity()) return false;
    const input = { name: document.getElementById('dccApplicationName')?.value.trim() || '', callbackUrl: document.getElementById('dccApplicationCallbackUrl')?.value.trim() || '', authorizedTenantIds: Array.from(form.querySelectorAll('input[name="dccAuthorizedTenant"]:checked')).map(node => node.value) };
    if (!input.name) { formError('请输入应用名称。'); return false; }
    if (!input.authorizedTenantIds.length) { formError('请选择至少一个可访问租户。'); return false; }
    const editing = view === 'edit';
    if (editing && !application(selectedId)) { formError('应用已不存在，请返回列表。'); return false; }
    if (editing) input.applicationId = selectedId;
    const button = document.getElementById('dccApplicationSave');
    saving = true; if (button) button.disabled = true;
    const result = editing ? runtime().saveApplication(input) : runtime().createApplication(input);
    saving = false; if (button?.isConnected) button.disabled = false;
    if (!result.ok) { formError(result.reason || '保存失败，请重试。'); return result; }
    go('detail', result.data.applicationId);
    notify(editing ? '应用已修改' : '应用已创建，接入密钥已生成', 'success');
    return result;
  }
  function remove(id) {
    const row = application(id);
    if (!row || saving) return false;
    const originalContext = context;
    ui().confirm({ id: 'dcc-application-delete-confirm', title: '删除应用', body: '<div data-func-id="FUNC-021"><p>确定删除“' + esc(row.name || row.applicationId) + '”？</p><p>删除后，该应用的接入密钥将无法继续获取 token。</p></div>', confirmText: '删除应用', danger: true, onConfirm() {
      if (!allowed() || context !== originalContext || !application(id)) { notify('应用或当前账号已变化，请重新打开', 'warning'); return false; }
      const result = runtime().deleteApplication({ applicationId: id });
      if (!result.ok) { notify(result.reason || '删除失败，请重试', 'warning'); return false; }
      go('list'); notify('应用已删除', 'success'); return true;
    } });
    return true;
  }
  function toggleSecret() {
    const row = application(selectedId);
    if (!row || view !== 'detail') return false;
    revealed = !revealed;
    const secret = document.getElementById('dccApplicationSecret'), button = document.getElementById('dccApplicationReveal');
    if (secret) secret.textContent = revealed ? row.credentialPlaceholder : '••••••••••••••••••••••••';
    if (button) { button.textContent = revealed ? '隐藏' : '显示'; button.setAttribute('aria-pressed', String(revealed)); }
    return true;
  }
  async function copy(field) {
    const row = application(selectedId), originalContext = context;
    if (!row || view !== 'detail' || !['applicationId', 'credentialPlaceholder'].includes(field)) return false;
    try {
      if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(String(row[field] || ''));
      if (allowed() && context === originalContext && view === 'detail' && selectedId === row.applicationId) notify(field === 'applicationId' ? 'appId 已复制' : 'appSecret 已复制', 'success');
      return true;
    } catch (_) {
      if (allowed() && context === originalContext && view === 'detail' && selectedId === row.applicationId) notify(field === 'applicationId' ? '复制失败，请选中 appId 后手动复制' : '复制失败，请显示密钥后手动复制', 'warning');
      return false;
    }
  }
  window.Pages['application-access'] = { render, init() {}, openCreate, openDetail, openEdit, back, query, resetFilters, setPage, refreshList, save, remove, toggleSecret, copy };
}());
