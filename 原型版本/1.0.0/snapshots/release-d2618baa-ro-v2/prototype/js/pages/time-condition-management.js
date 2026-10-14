/** Supplier time conditions for the account’s sole business tenant. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, layerId = 'time-condition-detail', pageSize = 10;
  const service = () => window.AliCtiTimeConditions;
  const text = value => value == null ? '' : String(value);
  const copy = value => value == null ? value : structuredClone(value);
  const context = () => service()?.context();
  const scopeKey = value => JSON.stringify(value === undefined ? context() : value);
  const superUser = () => !!AppState.isSuper();
  const command = (method, ...args) => esc(`TimeConditionManagement.${method}(${args.map(value => JSON.stringify(value)).join(',')})`);
  const weekdays = [['2', '周一'], ['3', '周二'], ['4', '周三'], ['5', '周四'], ['6', '周五'], ['7', '周六'], ['1', '周日']];
  const fields = ['name', 'type', 'timeType', 'priority', 'dayOfWeek', 'startTime', 'endTime', 'fromDay', 'toDay', 'tenantId'];
  let filters = { keyword: '', type: '', tenantId: '' }, page = 1, listContext = '', editor = null;
  const allowed = key => !!service()?.canAccess() && (key === undefined || key === scopeKey());
  const denied = () => showToast('当前工作范围已变化，请重新打开时间条件。', 'warning');
  const tenantRows = () => { const rows = service()?.tenants?.(); return Array.isArray(rows) ? rows : []; };
  const tenantName = id => tenantRows().find(row => text(row.tenantId) === text(id))?.name || id;
  const owners = row => (Array.isArray(row?.tenantIds) ? row.tenantIds : []).map(tenantName).join('、') || '未关联租户';
  const dateModeName = value => ({ '1': '按星期', '2': '固定日期' })[text(value)] || '未记录';
  const summary = row => service()?.summary?.(row) || '未记录';
  const canEdit = row => !!service()?.canEdit?.(row);
  function usage(row) { return service().usage(row); }
  function blockingReason(row, operation) {
    if (!canEdit(row)) return '当前租户无权维护此时间条件。';
    const used = usage(row);
    if (!used?.ok) return used?.message || '暂时无法核对使用情况，请刷新后重试。';
    if (operation === 'remove' && used.count > 0) return '此时间条件仍在使用，请先移除任务或呼入规则中的引用。';
    if (operation === 'edit' && used.blockedActive) return '执行中或已暂停的任务正在使用此条件。请先结束相关任务，或新增一个时间条件。';
    return '';
  }
  function render() {
    if (!allowed()) return ui.empty('当前账号无时间条件管理权限');
    const key = scopeKey();
    if (listContext !== key) { filters = { keyword: '', type: '', tenantId: '' }; page = 1; listContext = key; }
    if (editor && editor.key !== key) invalidate();
    const catalog = service().catalog(), keyword = filters.keyword.toLowerCase();
    let rows = (catalog?.ok ? catalog.rows : []).filter(row => (!keyword || text(row.name).toLowerCase().includes(keyword)) && (!filters.type || text(row.type) === filters.type) && (!filters.tenantId || (row.tenantIds || []).some(id => text(id) === filters.tenantId)));
    rows = ui.sortByUpdated?.(rows, []) || rows;
    page = Math.min(Math.max(1, page), Math.ceil(rows.length / pageSize) || 1); const offset = (page - 1) * pageSize;
    const columns = [
      { key: 'name', label: '条件名称', render: value => `<strong class="time-condition-name">${esc(value)}</strong>` },
      { key: 'type', label: '日期范围', render: value => esc(dateModeName(value)) },
      { key: 'id', label: '适用时间', render: (_, row) => `<span class="time-condition-summary">${esc(summary(row))}</span>` },
      { key: 'priority', label: '优先级' },
      ...(superUser() ? [{ key: 'tenantIds', label: '所属租户', render: (_, row) => `<span class="time-condition-owner">${esc(owners(row))}</span>` }] : []),
      { key: 'id', label: '操作', render: (id, row) => `<div class="table-actions"><button onclick="${command('open', 'view', id, key)}">查看</button>${canEdit(row) ? `<button onclick="${command('open', 'edit', id, key)}">编辑</button><button onclick="${command('open', 'remove', id, key)}">删除</button>` : ''}</div>` }
    ];
    return `<section class="platform-page time-condition-management-page">${ui.pageHeader('时间条件', '维护外呼任务和呼入服务使用的日期与时间范围。')}
      <div class="filter-panel"><label class="field grow"><span>条件名称</span><input id="time-condition-filter-keyword" value="${esc(filters.keyword)}" placeholder="输入条件名称"></label><label class="field"><span>日期范围</span><select id="time-condition-filter-type"><option value="">全部范围</option><option value="1" ${filters.type === '1' ? 'selected' : ''}>按星期</option><option value="2" ${filters.type === '2' ? 'selected' : ''}>固定日期</option></select></label><div class="filter-actions"><button class="btn" onclick="TimeConditionManagement.reset()">重置</button><button class="btn btn-primary" onclick="TimeConditionManagement.query()">查询</button></div></div>
      ${!catalog?.ok ? ui.alert('warning', '时间条件暂时无法读取', catalog?.message || '请刷新后重试。') : ''}<div class="management-list-shell">${ui.toolbar(`<button class="btn btn-primary" ${catalog?.ok ? '' : 'disabled'} onclick="${command('open', 'create', null, key)}">新增时间条件</button>`, '<button class="btn" onclick="TimeConditionManagement.refresh()">刷新</button>')}${ui.table(columns, rows.slice(offset, offset + pageSize), { rowOffset: offset, emptyText: catalog?.ok ? '暂无符合条件的时间条件' : '请刷新后重试' })}${ui.pagination(rows.length, page, pageSize, 'TimeConditionManagement.setPage')}</div></section>`;
  }
  function query() {
    if (!allowed(listContext)) return denied();
    filters = { keyword: document.getElementById('time-condition-filter-keyword')?.value.trim() || '', tenantId: superUser() ? document.getElementById('time-condition-filter-tenant')?.value || '' : '', type: document.getElementById('time-condition-filter-type')?.value || '' }; page = 1; RouteRuntime.refreshCurrent();
  }
  function reset() { if (!allowed(listContext)) return denied(); filters = { keyword: '', type: '', tenantId: '' }; page = 1; RouteRuntime.refreshCurrent(); }
  function setPage(value) { if (!allowed(listContext)) return denied(); page = Math.max(1, Number(value) || 1); RouteRuntime.refreshCurrent(); }
  function refresh() { if (!allowed(listContext)) return denied(); RouteRuntime.refreshCurrent(); }
  function dirty(value) { if (editor) editor.dirty = value; try { AppState.setDirty(value); } catch (_) {} }
  function error(message) { const node = document.getElementById('time-condition-error'); if (node) { node.textContent = message; if (message) node.scrollIntoView?.({ block: 'nearest' }); } else if (message) showToast(message, 'warning'); return false; }
  function invalidate() { const owned = editor?.dirty; editor = null; ui.closeLayer(layerId, false); if (owned) dirty(false); }
  function close(force = false) {
    if (editor?.pending) return error('正在保存，请稍候。');
    if (editor?.dirty && !force) { const node = document.getElementById('time-condition-discard'); if (node) node.hidden = false; return false; }
    if (editor?.dirty) dirty(false); editor = null; ui.closeLayer(layerId); return true;
  }
  function cancelClose() { const node = document.getElementById('time-condition-discard'); if (node) node.hidden = true; }
  function canOpen() {
    if (editor && !allowed(editor.key)) invalidate();
    if (editor?.pending || editor?.dirty) return error('请先保存或关闭当前时间条件设置。');
    if (editor) close(true); return true;
  }
  function newValues() { return { name: '', type: '1', timeType: '1', priority: '', dayOfWeek: '2,3,4,5,6', startTime: '09:00', endTime: '18:00', fromDay: '', toDay: '', tenantId: text(tenantRows().length===1?tenantRows()[0].tenantId:'') }; }
  function open(mode, id, key) {
    if (!allowed(key)) return denied();
    if (!['create', 'view', 'edit', 'remove'].includes(mode) || !canOpen()) return false;
    const catalog = service().catalog(); if (!catalog?.ok) return error(catalog?.message || '暂时无法读取时间条件，请刷新后重试。');
    const row = mode === 'create' ? null : catalog.rows.find(item => text(item.id) === text(id));
    if (mode !== 'create' && !row) return error('当前范围内没有此时间条件，请刷新列表。');
    if (['edit', 'remove'].includes(mode) && !canEdit(row)) return error('当前租户无权维护此时间条件。');
    const values = row ? Object.fromEntries(fields.map(field => [field, field === 'tenantId' ? '' : text(row[field])])) : newValues();
    editor = { mode, id: row?.id, row: row ? copy(row) : null, context: copy(context()), key: scopeKey(), revision: catalog.revision, values, initial: JSON.stringify(values), dirty: false, pending: false, routeHash: location.hash };
    draw(); return true;
  }
  function tenantField() {
    const value=editor.mode==='create'?tenantName(editor.values.tenantId):owners(editor.row);
    return `<div class="field full"><span>所属租户</span><strong>${esc(value||'未绑定租户')}</strong></div>`;
  }
  function selectField(key, label, choices) {
    const value = editor.values[key];
    return `<label class="field"><span>${label} <b class="time-condition-required">*</b></span><select id="time-condition-${key}" onchange="TimeConditionManagement.setField('${key}',this.value)">${choices.some(([code]) => code === value) ? '' : '<option value="">请选择</option>'}${choices.map(([code, name]) => `<option value="${code}" ${value === code ? 'selected' : ''}>${name}</option>`).join('')}</select></label>`;
  }
  function scheduleFields() {
    const value = editor.values;
    let dateFields = '';
    if (value.type === '1') dateFields = `<fieldset class="time-condition-weekdays field full"><legend>适用星期 <b class="time-condition-required">*</b></legend><div class="time-condition-weekday-options">${weekdays.map(([code, name]) => `<label><input type="checkbox" value="${code}" ${(value.dayOfWeek || '').split(',').includes(code) ? 'checked' : ''} onchange="TimeConditionManagement.toggleDay('${code}',this.checked)"><span>${name}</span></label>`).join('')}</div></fieldset>`;
    else if (value.type === '2') dateFields = `<label class="field"><span>开始日期 <b class="time-condition-required">*</b></span><input id="time-condition-fromDay" type="date" value="${esc(value.fromDay)}" onchange="TimeConditionManagement.setField('fromDay',this.value)"></label><label class="field"><span>结束日期 <b class="time-condition-required">*</b></span><input id="time-condition-toDay" type="date" value="${esc(value.toDay)}" onchange="TimeConditionManagement.setField('toDay',this.value)"></label>`;
    return `${dateFields}<label class="field"><span>开始时间 <b class="time-condition-required">*</b></span><input id="time-condition-startTime" type="time" step="60" value="${esc(value.startTime)}" onchange="TimeConditionManagement.setField('startTime',this.value)"></label><label class="field"><span>结束时间 <b class="time-condition-required">*</b></span><input id="time-condition-endTime" type="time" step="60" value="${esc(value.endTime)}" onchange="TimeConditionManagement.setField('endTime',this.value)"><small>请设置同一天内的时间范围。</small></label>`;
  }
  function form() {
    const value = editor.values;
    return `<div class="form-grid time-condition-form"><label class="field full"><span>条件名称 <b class="time-condition-required">*</b></span><input id="time-condition-name" value="${esc(value.name)}" placeholder="例如：工作日营业时间" ${editor.mode === 'create' ? 'oninput="TimeConditionManagement.setField(\'name\',this.value)"' : 'readonly'}><small>${editor.mode === 'create' ? '同一 AliCti 账号内，名称不可重复。' : '名称创建后不可修改，如需更名请另建条件。'}</small></label>${tenantField()}${selectField('type', '日期范围', [['1', '按星期'], ['2', '固定日期']])}${selectField('timeType', '时间类型', [['1', '连续'], ['2', '间隔']])}</div><div id="time-condition-schedule" class="form-grid time-condition-form time-condition-schedule">${scheduleFields()}</div><div class="form-grid time-condition-form"><label class="field full"><span>优先级 <b class="time-condition-required">*</b></span><input id="time-condition-priority" type="number" min="1" step="1" required value="${esc(value.priority)}" placeholder="请输入大于或等于 1 的整数" oninput="TimeConditionManagement.setField('priority',this.value)"><small>数值越小，优先级越高；同一 AliCti 账号内不可重复。</small></label></div>`;
  }
  function details() {
    const row = editor.row;
    const attrs = [['日期范围', dateModeName(row.type)], ['优先级', text(row.priority)], ['所属租户', owners(row)], ['适用时间', summary(row)]];
    return `<div class="time-condition-detail-summary"><small>时间条件</small><strong>${esc(row.name)}</strong></div><dl class="time-condition-attributes">${attrs.map(([label, value]) => `<div ${label === '适用时间' ? 'class="full"' : ''}><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${!canEdit(row) ? '<p class="time-condition-usage-note">由平台管理员维护。</p>' : ''}`;
  }
  function draw() {
    if (!editor || !allowed(editor.key)) return invalidate();
    const title = { create: '新增时间条件', edit: '编辑时间条件', view: '时间条件详情', remove: '删除时间条件' }[editor.mode];
    let body = '', button = '', reason = '';
    if (['create', 'edit'].includes(editor.mode)) { body = form(); button = editor.mode === 'create' ? '创建时间条件' : '保存修改'; if (editor.row) reason = blockingReason(editor.row, 'edit'); }
    else if (editor.mode === 'view') body = details();
    else if (editor.mode === 'remove') { reason = blockingReason(editor.row, 'remove'); body = `<p class="time-condition-delete-note">确认删除时间条件 <strong>${esc(editor.row.name)}</strong>？</p><p class="time-condition-delete-note">删除后，创建任务或配置呼入规则时将无法再选择此条件。</p>`; button = '确认删除'; }
    body = `${reason ? `<p class="time-condition-usage-note time-condition-blocked">${esc(reason)}</p>` : ''}${body}<div id="time-condition-error" class="time-condition-error" role="alert"></div><div id="time-condition-discard" class="time-condition-discard" hidden><p>当前内容尚未保存，是否放弃修改？</p><button class="btn" onclick="TimeConditionManagement.cancelClose()">继续编辑</button><button class="btn btn-primary" onclick="TimeConditionManagement.close(true)">放弃修改并关闭</button></div>`;
    ui.openLayer(layerId, `<div class="layer-header"><h2>${title}</h2><button type="button" aria-label="关闭" onclick="TimeConditionManagement.close()">×</button></div><div class="layer-body time-condition-body">${body}</div><div class="layer-footer"><button class="btn" onclick="TimeConditionManagement.close()">${editor.mode === 'view' ? '关闭' : '取消'}</button>${button ? `<button id="time-condition-save" class="btn btn-primary ${editor.mode === 'remove' ? 'btn-danger' : ''}" ${reason ? 'disabled' : ''} onclick="TimeConditionManagement.save()">${button}</button>` : ''}</div>`, 'wide', { objectKey: `time-condition:${editor.mode}:${editor.id ?? ''}` });
    if (reason && editor.mode === 'edit') document.querySelectorAll(`#${layerId} .layer-body input,#${layerId} .layer-body select`).forEach(node => { node.disabled = true; });
  }
  function setField(key, value) {
    if (!editor || editor.pending || !['create', 'edit'].includes(editor.mode) || !allowed(editor.key) || !fields.includes(key)) return;
    if (key === 'name' && editor.mode !== 'create' || key === 'tenantId' && (editor.mode !== 'create' || !superUser())) return;
    if (editor.row && blockingReason(editor.row, 'edit')) return;
    editor.values[key] = text(value); dirty(JSON.stringify(editor.values) !== editor.initial);
    if (key === 'type') { const node = document.getElementById('time-condition-schedule'); if (node) node.innerHTML = scheduleFields(); }
  }
  function toggleDay(code, checked) {
    if (!editor || editor.values.type !== '1' || !weekdays.some(([day]) => day === code)) return;
    const days = new Set((editor.values.dayOfWeek || '').split(',').filter(Boolean));
    if (checked) days.add(code); else days.delete(code);
    setField('dayOfWeek', Array.from(days).sort((a, b) => Number(a) - Number(b)).join(','));
  }
  function setPending(value) {
    if (!editor) return; editor.pending = value;
    document.querySelectorAll(`#${layerId} .layer-body input,#${layerId} .layer-body select,#${layerId} .layer-footer button`).forEach(node => { if (value) { node.dataset.timeConditionDisabled = node.disabled ? '1' : '0'; node.disabled = true; } else { node.disabled = node.dataset.timeConditionDisabled === '1'; delete node.dataset.timeConditionDisabled; } });
    const button = document.getElementById('time-condition-save'); if (button) { if (value) { button.dataset.timeConditionText = button.textContent; button.textContent = '正在保存…'; } else if (button.dataset.timeConditionText) button.textContent = button.dataset.timeConditionText; }
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`); return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }
  function formInput(active) {
    const value = active.values, input = { name: value.name.trim(), type: Number(value.type), timeType: Number(value.timeType), priority: Number(value.priority), startTime: value.startTime, endTime: value.endTime };
    if (!input.name) return { message: '请填写条件名称。' };
    if (active.mode === 'create' && !value.tenantId) return { message: '请选择所属租户。' };
    if (!value.priority.trim()) return { message: '请填写优先级。' };
    if (!Number.isSafeInteger(input.priority) || input.priority < 1) return { message: '优先级应为大于或等于 1 的整数。' };
    if (![1, 2].includes(input.type) || ![1, 2].includes(input.timeType)) return { message: '请选择日期范围和时间类型。' };
    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (!timePattern.test(input.startTime) || !timePattern.test(input.endTime)) return { message: '请填写有效的开始时间和结束时间。' };
    if (input.startTime > input.endTime) return { message: '结束时间不能早于开始时间，请设置同一天内的时间范围。' };
    if (input.type === 1) {
      const days = value.dayOfWeek.split(',').filter(Boolean);
      if (!days.length || days.some(day => !weekdays.some(([code]) => code === day))) return { message: '请至少选择一个适用星期。' };
      input.dayOfWeek = Array.from(new Set(days)).sort((a, b) => Number(a) - Number(b)).join(',');
    } else {
      if (!validDate(value.fromDay) || !validDate(value.toDay)) return { message: '请填写有效的开始日期和结束日期。' };
      if (value.fromDay > value.toDay) return { message: '结束日期不能早于开始日期。' };
      input.fromDay = value.fromDay; input.toDay = value.toDay;
    }
    if (active.mode === 'create') input.tenantId = value.tenantId;
    return { input };
  }
  async function save() {
    const active = editor;
    if (!active || active.pending || active.mode === 'view') return false;
    if (!allowed(active.key)) return error('当前工作范围已变化，请关闭后重新打开。');
    const current = service().catalog();
    if (!current?.ok) return error(current?.message || '暂时无法核对时间条件，请稍后重试。');
    if (current.revision !== active.revision) return error('时间条件已更新，请关闭后重新打开。');
    if (active.mode !== 'create') {
      const row = current.rows.find(item => text(item.id) === text(active.id));
      if (!row) return error('当前范围内没有此时间条件，请刷新列表。');
      const reason = blockingReason(row, active.mode); if (reason) return error(reason);
    }
    const prepared = active.mode === 'remove' ? {} : formInput(active);
    if (prepared.message) return error(prepared.message);
    const opts = { expectedContext: copy(active.context), expectedRevision: active.revision };
    setPending(true); error('');
    try {
      const result = active.mode === 'create' ? await service().create(prepared.input, opts) : active.mode === 'edit' ? await service().update(active.id, prepared.input, opts) : await service().remove(active.id, opts);
      if (editor !== active) return false;
      setPending(false);
      if (!allowed(active.key)) { invalidate(); RouteRuntime.refreshCurrent(); return false; }
      if (!result?.ok) return error(result?.message || '保存失败，原内容已保留，请重试。');
      dirty(false); close(true); RouteRuntime.refreshCurrent(); showToast(result.message || '已保存', 'success'); return true;
    } catch (_) {
      if (editor === active) { setPending(false); if (!allowed(active.key)) { invalidate(); RouteRuntime.refreshCurrent(); } else error('暂时无法完成操作，原内容已保留，请稍后重试。'); }
      return false;
    }
  }
  function captureNavigationState() { return { filters: { ...filters }, page, listContext }; }
  function restoreNavigationState(saved) { if (saved?.listContext === scopeKey()) { filters = { ...saved.filters }; page = saved.page; listContext = saved.listContext; } }
  window.addEventListener('app:save-draft', event => { if (!editor?.dirty || !document.getElementById(layerId)) return; event.preventDefault(); showToast('请先保存或关闭时间条件设置，再切换工作范围。', 'warning'); });
  window.addEventListener('popstate', event => { if (!editor?.dirty || !document.getElementById(layerId)) return; event.stopImmediatePropagation(); history.pushState(history.state, '', editor.routeHash || '#time-conditions'); error('请先保存修改，或关闭并放弃修改，再返回上一页。'); }, true);
  AppState.subscribe?.(() => { if (editor && !allowed(editor.key)) invalidate(); });
  window.TimeConditionManagement = { render, query, reset, refresh, setPage, open, setField, toggleDay, save, close, cancelClose, captureNavigationState, restoreNavigationState };
  window.Pages['time-condition-management'] = window.TimeConditionManagement;
})();
