/** Tenant-scoped softphone resources. Passwords exist only in the open input. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, layerId = 'extension-resource-detail', pageSize = 10;
  const service = () => window.AliCtiExtensions;
  const text = value => value == null ? '' : String(value);
  const copy = value => value == null ? value : structuredClone(value);
  const context = () => service()?.context();
  const scopeKey = value => JSON.stringify(value === undefined ? context() : value);
  const superUser = () => !!AppState.isSuper();
  const command = (method, ...args) => esc(`ExtensionManagement.${method}(${args.map(value => JSON.stringify(value)).join(',')})`);
  const fields = ['exten', 'areaCode', 'active', 'callPower', 'isOb', 'isDirect', 'ibRecord', 'obRecord', 'allow', 'jitterBuffer', 'denoise'];
  const options = {
    active: [['1', '启用'], ['0', '停用']],
    callPower: [['0', '不限制'], ['1', '国内长途'], ['2', '国内本市'], ['3', '内部呼叫']],
    isOb: [['1', '允许'], ['0', '不允许']],
    isDirect: [['1', '允许'], ['0', '不允许']],
    ibRecord: [['1', '录音'], ['0', '不录音']],
    obRecord: [['1', '录音'], ['0', '不录音']],
    jitterBuffer: [['0', '关闭'], ['1', '开启']],
    denoise: [['0', '关闭'], ['1', '开启']],
    allow: [['alaw,ulaw', '公网软电话'], ['myopus,alaw,ulaw', '专线软电话']]
  };
  let filters = { keyword: '', active: '' }, page = 1, listContext = '', editor = null;
  const allowed = key => !!service()?.canAccess() && (key === undefined || key === scopeKey());
  const denied = () => showToast('当前工作范围已变化，请重新打开分机管理。', 'warning');
  const tenantRows = () => { const rows = service()?.tenants?.(); return Array.isArray(rows) ? rows : []; };
  const tenantName = id => id ? (tenantRows().find(row => row.tenantId === id)?.name || id) : '账号尚未绑定业务租户';
  const typeName = value => ({ '1': 'IAD 分机', '2': '软电话', '3': '远程话机' })[text(value)] || '未记录';
  const settingName = (key, value) => options[key]?.find(([code]) => code === text(value))?.[1] || '未记录';
  const status = row => ui.status(text(row.active) === '1' ? '已启用' : text(row.active) === '0' ? '已停用' : '待确认');
  function usage(row) { return service().usage(row); }
  function names(result) {
    if (!result?.ok) return '待核对';
    return (result.agents || []).map(agent => text(agent.userName || agent.name || agent.cno || '未命名坐席')).join('、') || (result.count > 0 ? result.message || '已有坐席使用' : '尚未使用');
  }
  function snapshot(id) {
    if (!allowed()) return null;
    const catalog = service().catalog();
    if (!catalog?.ok) return null;
    const row = catalog.rows.find(item => text(item.id) === text(id));
    return row ? { row, revision: catalog.revision } : null;
  }
  function render() {
    if (!allowed()) return ui.empty('当前账号无分机管理权限');
    const key = scopeKey();
    if (listContext !== key) { filters = { keyword: '', active: '' }; page = 1; listContext = key; }
    if (editor && editor.key !== key) invalidate();
    const catalog = service().catalog(), keyword = filters.keyword.toLowerCase(), canCreate = catalog?.ok && tenantRows().length === 1;
    let rows = (catalog?.ok ? catalog.rows : []).filter(row => (!keyword || text(row.exten).toLowerCase().includes(keyword)) && (filters.active === '' || text(row.active) === filters.active));
    rows = ui.sortByUpdated?.(rows, ['importedAt']) || rows;
    page = Math.min(Math.max(1, page), Math.ceil(rows.length / pageSize) || 1); const offset = (page - 1) * pageSize;
    const columns = [
      { key: 'exten', label: '分机号', render: value => `<span class="extension-number">${esc(value)}</span>` },
      { key: 'type', label: '接听设备', render: typeName },
      ...(superUser() ? [{ key: 'tenantId', label: '所属租户', render: value => `<span class="${value ? '' : 'extension-unassigned'}">${esc(tenantName(value))}</span>` }] : []),
      { key: 'active', label: '启用状态', render: (_, row) => status(row) },
      { key: 'exten', label: '使用坐席', render: (_, row) => `<span class="extension-seat-names">${esc(names(usage(row)))}</span>` },
      { key: 'id', label: '操作', render: (id, row) => `<div class="table-actions"><button onclick="${command('open', 'view', id, key)}">查看</button><button ${text(row.type) === '2' ? '' : 'disabled title="当前仅维护软电话分机"'} onclick="${command('open', 'edit', id, key)}">编辑</button><button onclick="${command('open', 'remove', id, key)}">删除</button></div>` }
    ];
    return `<section class="platform-page extension-management-page">${ui.pageHeader('分机管理', '维护当前账号的软电话分机，分机自动归属该账号绑定的业务租户。')}
      <div class="filter-panel"><label class="field grow"><span>分机号</span><input id="extension-filter-keyword" value="${esc(filters.keyword)}" placeholder="输入分机号"></label><label class="field"><span>启用状态</span><select id="extension-filter-active"><option value="">全部状态</option>${options.active.map(([value, label]) => `<option value="${value}" ${filters.active === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><div class="filter-actions"><button class="btn" onclick="ExtensionManagement.reset()">重置</button><button class="btn btn-primary" onclick="ExtensionManagement.query()">查询</button></div></div>
      ${!catalog?.ok ? ui.alert('warning', '分机资料暂时无法读取', catalog?.message || '请刷新后重试。') : !canCreate ? ui.alert('warning', '当前账号暂无可用业务租户', '请先为当前 AliCti 账号绑定已启用云呼叫的业务租户。') : ''}<div class="management-list-shell">${ui.toolbar(`<button class="btn btn-primary" ${canCreate ? '' : 'disabled'} onclick="${command('open', 'create', null, key)}">新增分机</button>${superUser() ? `<button class="btn" ${canCreate ? '' : 'disabled'} onclick="${command('openImport', key)}">从 AliCti 导入</button>` : ''}`, '<button class="btn" onclick="ExtensionManagement.refresh()">刷新</button>')}${ui.table(columns, rows.slice(offset, offset + pageSize), { rowOffset: offset, emptyText: catalog?.ok ? '暂无符合条件的分机' : '请刷新后重试' })}${ui.pagination(rows.length, page, pageSize, 'ExtensionManagement.setPage')}</div></section>`;
  }
  function query() {
    if (!allowed(listContext)) return denied();
    filters = { keyword: document.getElementById('extension-filter-keyword')?.value.trim() || '', active: document.getElementById('extension-filter-active')?.value || '' }; page = 1; RouteRuntime.refreshCurrent();
  }
  function reset() { if (!allowed(listContext)) return denied(); filters = { keyword: '', active: '' }; page = 1; RouteRuntime.refreshCurrent(); }
  function setPage(value) { if (!allowed(listContext)) return denied(); page = Math.max(1, Number(value) || 1); RouteRuntime.refreshCurrent(); }
  function refresh() { if (!allowed(listContext)) return denied(); RouteRuntime.refreshCurrent(); }
  function dirty(value) { if (editor) editor.dirty = value; try { AppState.setDirty(value); } catch (_) {} }
  function error(message) { const node = document.getElementById('extension-resource-error'); if (node) { node.textContent = message; node.scrollIntoView?.({ block: 'nearest' }); } else showToast(message, 'warning'); return false; }
  function clearPassword() { const input = document.getElementById('extension-password'); if (input) input.value = ''; }
  function invalidate() { const owned = editor?.dirty; clearPassword(); editor = null; ui.closeLayer(layerId, false); if (owned) dirty(false); }
  function close(force = false) {
    if (editor?.pending) return error('正在保存，请稍候。');
    if (editor?.dirty && !force) { const node = document.getElementById('extension-discard'); if (node) node.hidden = false; return false; }
    clearPassword(); if (editor?.dirty) dirty(false); editor = null; ui.closeLayer(layerId); return true;
  }
  function cancelClose() { const node = document.getElementById('extension-discard'); if (node) node.hidden = true; }
  function canOpen() {
    if (editor && !allowed(editor.key)) invalidate();
    if (editor?.pending || editor?.dirty) return error('请先保存或关闭当前分机设置。');
    if (editor) close(true); return true;
  }
  function newValues() { return { exten: '', areaCode: '', active: '1', callPower: '0', isOb: '1', isDirect: '1', ibRecord: '1', obRecord: '1', jitterBuffer: '0', denoise: '0', allow: 'alaw,ulaw', tenantId: tenantRows()[0]?.tenantId || '' }; }
  function open(mode, id, key) {
    if (!allowed(key)) return denied();
    if (!['create', 'view', 'edit', 'remove'].includes(mode)) return denied();
    if (!canOpen()) return false;
    const catalog = service().catalog(); if (!catalog?.ok) return error(catalog?.message || '暂时无法读取分机，请刷新后重试。');
    const row = mode === 'create' ? null : catalog.rows.find(item => text(item.id) === text(id));
    if (mode !== 'create' && !row) return error('当前范围内没有此分机，请刷新列表。');
    if (mode === 'create' && !tenantRows().length) return error('请先为当前 AliCti 账号绑定已启用云呼叫的业务租户。');
    if (mode === 'edit' && text(row.type) !== '2') return error('当前仅维护软电话分机。');
    const values = row ? Object.fromEntries([...fields, 'tenantId'].map(field => [field, text(row[field])])) : newValues();
    editor = { mode, id: row?.id, row: row ? copy(row) : null, context: copy(context()), key: scopeKey(), revision: catalog.revision, values, initial: JSON.stringify(values), dirty: false, pending: false, routeHash: location.hash };
    draw(); return true;
  }
  function tenantField(value) {
    return `<div class="field full"><span>所属租户</span><strong>${esc(tenantName(value))}</strong><small>随当前 AliCti 账号自动确定。</small></div>`;
  }
  function selectField(key, label) {
    const value = text(editor.values[key]), choices = options[key];
    return `<label class="field"><span>${label}</span><select id="extension-${key}" onchange="ExtensionManagement.setField('${key}',this.value)">${choices.some(([code]) => code === value) ? '' : `<option value="${esc(value)}" selected>${value ? '当前设置（保持）' : '未记录（保持）'}</option>`}${choices.map(([code, name]) => `<option value="${esc(code)}" ${code === value ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label>`;
  }
  function form() {
    const create = editor.mode === 'create';
    return `<div class="form-grid extension-form"><label class="field"><span>分机号 <b class="extension-required">*</b></span><input id="extension-exten" inputmode="numeric" maxlength="11" value="${esc(editor.values.exten)}" ${create ? 'oninput="ExtensionManagement.setField(\'exten\',this.value)"' : 'readonly'} placeholder="输入 3–11 位分机号"><small>${create ? '保留完整分机号，包括开头的 0。' : '分机号创建后不可修改。'}</small></label><div class="field"><span>接听设备</span><strong>软电话</strong></div><label class="field"><span>${create ? '分机密码 <b class="extension-required">*</b>' : '修改分机密码 <small>（选填）</small>'}</span><input id="extension-password" type="password" autocomplete="new-password" placeholder="${create ? '输入分机密码' : '留空保留原密码'}" oninput="ExtensionManagement.passwordChanged()"><small>${create ? '用于软电话连接。' : '不显示原密码；仅填写时更新。'}</small></label><label class="field"><span>区号 <b class="extension-required">*</b></span><input id="extension-areaCode" inputmode="numeric" value="${esc(editor.values.areaCode)}" placeholder="例如 021" oninput="ExtensionManagement.setField('areaCode',this.value)"></label>${create ? tenantField(editor.values.tenantId) : `<div class="field"><span>所属租户</span><strong>${esc(tenantName(editor.row.tenantId))}</strong></div>`}${selectField('active', '启用状态')}</div><details class="extension-disclosure"><summary>更多设置</summary><div class="form-grid extension-form">${selectField('callPower', '可呼叫范围')}${selectField('isOb', '允许外呼')}${selectField('isDirect', '允许摘机外呼')}${selectField('ibRecord', '呼入录音')}${selectField('obRecord', '外呼录音')}${selectField('allow', '接入网络')}${selectField('jitterBuffer', '网络防抖')}${selectField('denoise', '降噪')}</div></details>`;
  }
  function details() {
    const row = editor.row, used = usage(row);
    const attrs = [['接听设备', typeName(row.type)], ['所属租户', tenantName(row.tenantId)], ['区号', row.areaCode || '未记录'], ['可呼叫范围', settingName('callPower', row.callPower)], ['允许外呼', settingName('isOb', row.isOb)], ['呼入录音', settingName('ibRecord', row.ibRecord)], ['外呼录音', settingName('obRecord', row.obRecord)]];
    return `<div class="extension-detail-summary"><div><small>分机号</small><strong>${esc(row.exten)}</strong></div>${status(row)}</div><dl class="extension-attributes">${attrs.map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}<div class="full"><dt>使用坐席</dt><dd>${esc(names(used))}</dd></div></dl><details class="extension-disclosure"><summary>更多设置</summary><dl class="extension-attributes">${[['接入网络', 'allow'], ['网络防抖', 'jitterBuffer'], ['降噪', 'denoise'], ['允许摘机外呼', 'isDirect']].map(([label, key]) => `<div><dt>${label}</dt><dd>${esc(settingName(key, row[key]))}</dd></div>`).join('')}</dl></details>`;
  }
  function draw() {
    if (!editor || !allowed(editor.key)) return invalidate();
    const title = { create: '新增分机', edit: '编辑分机', view: '分机详情', remove: '删除分机', import: '从 AliCti 导入分机' }[editor.mode];
    let body = '', button = '', blocked = false;
    if (['create', 'edit'].includes(editor.mode)) { body = form(); button = editor.mode === 'create' ? '创建分机' : '保存修改'; }
    else if (editor.mode === 'view') body = details();
    else if (editor.mode === 'remove') {
      const used = usage(editor.row); blocked = !used.ok || used.count > 0;
      body = `<p class="extension-delete-note">确认删除分机 <strong>${esc(editor.row.exten)}</strong>？</p><p class="extension-delete-note">删除后，该分机将不能再用于坐席接听。</p>${blocked ? `<p class="extension-usage-note">${esc(!used.ok ? used.message || '暂时无法核对使用情况，请刷新后重试。' : `使用坐席：${names(used)}。请先在坐席资料中解除使用关系。`)}</p>` : ''}`; button = '确认删除';
    } else if (editor.mode === 'import') { body = importForm(); button = '导入所选分机'; blocked = !editor.candidates?.ok || !editor.candidates.rows.length; }
    body += '<div id="extension-resource-error" class="extension-error" role="alert"></div><div id="extension-discard" class="extension-discard" hidden><p>当前内容尚未保存，是否放弃修改？</p><button class="btn" onclick="ExtensionManagement.cancelClose()">继续编辑</button><button class="btn btn-primary" onclick="ExtensionManagement.close(true)">放弃修改并关闭</button></div>';
    ui.openLayer(layerId, `<div class="layer-header"><h2>${title}</h2><button type="button" aria-label="关闭" onclick="ExtensionManagement.close()">×</button></div><div class="layer-body extension-resource-body">${body}</div><div class="layer-footer"><button class="btn" onclick="ExtensionManagement.close()">${editor.mode === 'view' ? '关闭' : '取消'}</button>${button ? `<button id="extension-save" class="btn btn-primary ${editor.mode === 'remove' ? 'btn-danger' : ''}" ${blocked ? 'disabled' : ''} onclick="ExtensionManagement.save()">${button}</button>` : ''}</div>`, 'wide', { objectKey: `extension:${editor.mode}:${editor.id ?? ''}` });
  }
  function setField(key, value) {
    if (!editor || editor.pending || !allowed(editor.key) || !fields.includes(key)) return;
    if (key === 'exten' && editor.mode !== 'create') return;
    editor.values[key] = value; dirty(JSON.stringify(editor.values) !== editor.initial || !!document.getElementById('extension-password')?.value || !!editor.selected?.length);
  }
  function passwordChanged() { if (!editor || editor.pending || !allowed(editor.key)) return; dirty(JSON.stringify(editor.values) !== editor.initial || !!document.getElementById('extension-password')?.value); }
  function setPending(value) {
    if (!editor) return; editor.pending = value;
    document.querySelectorAll(`#${layerId} .layer-body input,#${layerId} .layer-body select,#${layerId} .layer-footer button`).forEach(node => { if (value) { node.dataset.extensionDisabled = node.disabled ? '1' : '0'; node.disabled = true; } else { node.disabled = node.dataset.extensionDisabled === '1'; delete node.dataset.extensionDisabled; } });
    const button = document.getElementById('extension-save'); if (button) { if (value) { button.dataset.extensionText = button.textContent; button.textContent = '正在保存…'; } else if (button.dataset.extensionText) button.textContent = button.dataset.extensionText; }
  }
  async function save() {
    const active = editor;
    if (!active || active.pending || active.mode === 'view') return false;
    if (!allowed(active.key)) return error('当前工作范围已变化，请关闭后重新打开。');
    const current = service().catalog();
    if (!current?.ok) return error(current?.message || '暂时无法核对分机资料，请稍后重试。');
    if (current.revision !== active.revision) return error('分机资料已更新，请关闭后重新打开。');
    const opts = { expectedContext: copy(active.context), expectedRevision: active.revision };
    let input, password;
    if (['create', 'edit'].includes(active.mode)) {
      const exten = text(active.values.exten).trim(), areaCode = text(active.values.areaCode).trim();
      password = document.getElementById('extension-password')?.value || '';
      if (!exten || !areaCode) return error('请填写分机号和区号。');
      if (active.mode === 'create' && !password) return error('请填写分机密码。');
      input = { exten, areaCode, type: 2 };
      for (const key of fields.filter(key => !['exten', 'areaCode'].includes(key))) {
        if (text(active.values[key]) !== '' && (active.mode === 'create' || text(active.values[key]) !== text(active.row[key]))) input[key] = active.values[key];
      }
      if (password) input.password = password;
    }
    if (active.mode === 'import' && !active.selected.length) return error('请至少选择一个分机。');
    setPending(true); error('');
    try {
      let result;
      if (active.mode === 'create') result = await service().create(input, opts);
      else if (active.mode === 'edit') result = await service().update(active.id, input, opts);
      else if (active.mode === 'remove') result = await service().remove(active.id, opts);
      else if (active.mode === 'import') result = await service().importExisting(active.selected.slice(), opts);
      if (editor !== active) return false;
      setPending(false);
      if (!allowed(active.key)) { invalidate(); RouteRuntime.refreshCurrent(); return false; }
      if (!result?.ok) return error(result?.message || '保存失败，原内容已保留，请重试。');
      dirty(false); close(true); RouteRuntime.refreshCurrent(); showToast(result.message || '已保存', 'success'); return true;
    } catch (_) {
      if (editor === active) { setPending(false); error('暂时无法完成操作，原内容已保留，请稍后重试。'); }
      return false;
    } finally { if (input) delete input.password; password = undefined; }
  }
  function openImport(key) {
    if (!allowed(key) || !superUser()) return denied();
    if (!canOpen()) return false;
    const catalog = service().catalog(); if (!catalog?.ok) return error(catalog?.message || '暂时无法读取分机。');
    if (!tenantRows().length) return error('请先为当前 AliCti 账号绑定已启用云呼叫的业务租户。');
    const candidates = service().importCandidates();
    editor = { mode: 'import', context: copy(context()), key: scopeKey(), revision: catalog.revision, values: { tenantId: tenantRows()[0].tenantId }, initial: JSON.stringify({ tenantId: tenantRows()[0].tenantId }), selected: [], candidates, dirty: false, pending: false, routeHash: location.hash };
    draw(); return true;
  }
  function importForm() {
    const candidates = editor.candidates;
    return `<p class="extension-form-intro">选择当前 AliCti 账号已有的软电话分机，导入后自动归属账号绑定的业务租户。</p><div class="form-grid extension-form">${tenantField(editor.values.tenantId)}</div>${!candidates?.ok ? ui.alert('warning', '暂时无法查询分机', candidates?.message || '请关闭后重试。') : `<div class="extension-import-list">${ui.table([{ key: 'id', label: '选择', render: (id, row) => `<input type="checkbox" aria-label="选择分机 ${esc(row.exten)}" ${text(row.type) === '2' ? '' : 'disabled'} ${editor.selected.some(value => text(value) === text(id)) ? 'checked' : ''} onchange="${command('selectCandidate', id)}">` }, { key: 'exten', label: '分机号', render: value => esc(value) }, { key: 'type', label: '接听设备', render: typeName }, { key: 'areaCode', label: '区号' }, { key: 'active', label: '启用状态', render: (_, row) => status(row) }], ui.sortByUpdated?.(candidates.rows) || candidates.rows, { emptyText: '没有可导入的分机' })}</div><p id="extension-selected-count" class="extension-usage-note">已选择 ${editor.selected.length} 个分机</p>`}`;
  }
  function selectCandidate(id) {
    if (!editor || editor.mode !== 'import' || editor.pending || !allowed(editor.key)) return;
    const candidate = editor.candidates?.rows?.find(row => text(row.id) === text(id)); if (!candidate || text(candidate.type) !== '2') return;
    editor.selected = editor.selected.some(value => text(value) === text(id)) ? editor.selected.filter(value => text(value) !== text(id)) : [...editor.selected, candidate.id];
    dirty(editor.selected.length > 0 || JSON.stringify(editor.values) !== editor.initial);
    const count = document.getElementById('extension-selected-count'); if (count) count.textContent = `已选择 ${editor.selected.length} 个分机`;
  }
  function captureNavigationState() { return { filters: { ...filters }, page, listContext }; }
  function restoreNavigationState(saved) { if (saved?.listContext === scopeKey()) { filters = { ...saved.filters }; page = saved.page; listContext = saved.listContext; } }
  window.addEventListener('app:save-draft', event => { if (!editor?.dirty || !document.getElementById(layerId)) return; event.preventDefault(); showToast('请先保存或关闭分机设置，再切换工作范围。', 'warning'); });
  window.addEventListener('popstate', event => { if (!editor?.dirty || !document.getElementById(layerId)) return; event.stopImmediatePropagation(); history.pushState(history.state, '', editor.routeHash || '#extensions'); error('请先保存修改，或关闭并放弃修改，再返回上一页。'); }, true);
  window.ExtensionManagement = { render, query, reset, refresh, setPage, open, openImport, selectCandidate, setField, passwordChanged, save, close, cancelClose, captureNavigationState, restoreNavigationState };
  window.Pages['extension-management'] = window.ExtensionManagement;
})();
