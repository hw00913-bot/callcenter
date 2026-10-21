/** Global local administration of AliCti account profiles. Supplier credentials are never entered here. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, PAGE = 'alicti-accounts', pageSize = 10;
  const service = () => window.AliCtiAccounts;
  const can = () => !!service() && AppState.isReady() && AppState.isSuper();
  const action = (method, ...args) => esc(`window.Pages['${PAGE}'].${method}(${args.map(v => JSON.stringify(v)).join(',')})`);
  const clone = value => structuredClone(value);
  const text = value => value == null ? '' : String(value);
  let filters = { keyword: '', status: '' }, draftFilters = { ...filters }, page = 1;
  let editor = null, detail = null, inspector = null, statusDialog = null, listMessage = '';
  const historyNames = { tenants: '绑定租户', seats: '关联坐席', numbers: '关联号码', tasks: '历史任务', calls: '历史通话' };

  function currentContext() { return service()?.captureContext(); }
  function sameContext(context) { return can() && JSON.stringify(context) === JSON.stringify(currentContext()); }
  function statusLabel(value) { return value === 'RUNNING' ? '启用' : value === 'STOPPED' ? '停用' : '未设置'; }
  function usage(row) { return service().usage(row.configId) || {}; }
  function count(value) { return Number.isFinite(Number(value)) ? Number(value) : 0; }
  function tenantRows(row) {
    const tenant = AppState.tenantForEnterprise(row.enterpriseId);
    return tenant ? [tenant] : [];
  }
  function filteredRows() {
    return service().list().filter(row => (!filters.keyword || [row.name, row.enterpriseId].some(v => text(v).toLocaleLowerCase().includes(filters.keyword.toLocaleLowerCase()))) && (!filters.status || row.status === filters.status));
  }
  function readFilterDraft() {
    const root = document.querySelector('.alicti-accounts-page');
    if (root) draftFilters = { keyword: root.querySelector('#aliAccountKeyword')?.value || '', status: root.querySelector('#aliAccountStatus')?.value || '' };
  }
  function refresh() { if (can()) RouteRuntime.refreshCurrent(); }
  function render() {
    if (!can()) return ui.empty('当前账号无权管理 AliCti 账号');
    const filtered = filteredRows(), rows = ui.sortByUpdated?.(filtered) || filtered; page = Math.min(Math.max(1, page), Math.max(1, Math.ceil(rows.length / pageSize)));
    const offset = (page - 1) * pageSize, key = currentContext(), error = service().storageError;
    const storageMessage = typeof error === 'function' ? error.call(service()) : error;
    return `<section class="platform-page alicti-accounts-page">${ui.pageHeader('AliCti 账号管理', '维护接入账号资料，每个账号最多绑定一个业务租户。')}
      <section class="filter-panel ali-account-filter"><label class="field ali-account-search"><span>账号名称 / ID</span><input id="aliAccountKeyword" value="${esc(draftFilters.keyword)}" placeholder="输入账号名称或 ID" oninput="${action('setFilter', 'keyword')}" onkeydown="if(event.key==='Enter')window.Pages['${PAGE}'].query()"></label><label class="field"><span>使用状态</span><select id="aliAccountStatus" onchange="${action('setFilter', 'status')}"><option value="">全部状态</option><option value="RUNNING" ${draftFilters.status === 'RUNNING' ? 'selected' : ''}>启用</option><option value="STOPPED" ${draftFilters.status === 'STOPPED' ? 'selected' : ''}>停用</option></select></label><div class="filter-actions"><button class="btn" onclick="${action('resetFilters')}">重置</button><button class="btn btn-primary" onclick="${action('query')}">查询</button></div></section>
      ${(storageMessage || listMessage) ? `<div class="ali-account-notice" role="status">${esc(storageMessage || listMessage)}</div>` : ''}
      <section class="management-list-shell">${ui.toolbar(`<button class="btn btn-primary" onclick="${action('openEditor', '', key)}">新增账号</button>`, `<button class="btn" onclick="${action('refresh')}">刷新</button>`)}${ui.table([
        { key: 'name', label: '账号名称', render: (v, row) => `<button class="table-link" onclick="${action('openDetail', row.configId, key)}"><strong>${esc(v)}</strong></button>${row.brandCustomerName && row.brandCustomerName !== v ? `<small class="ali-account-subtext">${esc(row.brandCustomerName)}</small>` : ''}` },
        { key: 'enterpriseId', label: 'AliCti 账号 ID', render: v => `<span class="ali-account-id">${esc(v)}</span>` },
        { key: 'status', label: '使用状态', render: v => ui.status(statusLabel(v)) },
        { key: 'configId', label: '绑定租户', render: (_, row) => { const tenant = tenantRows(row)[0]; return tenant ? `<span>${esc(tenant.name)}</span><small class="ali-account-subtext">${esc(tenant.organizationLabel || (tenant.organizationScope === 'HEADQUARTERS' ? '总部' : '门店'))} · ${esc(tenant.status)}</small>` : '<span class="ali-account-muted">未绑定</span>'; } },
        { key: 'credentialConfigured', label: '凭据配置', render: v => ui.status(v === true ? '已配置' : '未配置') },
        { key: 'configId', label: '操作', render: (_, row) => `<div class="table-actions ali-account-actions"><button onclick="${action('openDetail', row.configId, key)}">查看</button><button onclick="${action('openEditor', row.configId, key)}">编辑</button><button class="${row.status === 'RUNNING' ? 'danger' : ''}" onclick="${action('changeStatus', row.configId, row.status === 'RUNNING' ? 'STOPPED' : 'RUNNING', key)}">${row.status === 'RUNNING' ? '停用' : '启用'}</button></div>` }
      ], rows.slice(offset, offset + pageSize), { rowOffset: offset, emptyText: '没有符合条件的 AliCti 账号', emptyDetail: rows.length ? '' : '可调整筛选条件，或新增接入账号。', footer: ui.pagination(rows.length, page, pageSize, `window.Pages['${PAGE}'].setPage`) })}</section></section>`;
  }
  function setFilter(field) { if (['keyword', 'status'].includes(field)) readFilterDraft(); }
  function query() { readFilterDraft(); filters = { keyword: draftFilters.keyword.trim(), status: draftFilters.status }; page = 1; listMessage = ''; refresh(); }
  function resetFilters() { filters = { keyword: '', status: '' }; draftFilters = { ...filters }; page = 1; listMessage = ''; refresh(); }
  function setPage(next) { if (!can()) return; readFilterDraft(); page = Math.max(1, Number(next) || 1); refresh(); }
  function field(name, label, control, required = false, help = '') {
    return `<div class="ali-account-field"><label for="aliAccount-${name}">${esc(label)}${required ? '<b aria-hidden="true"> *</b>' : ' <span>（选填）</span>'}</label>${control}${help ? `<small class="ali-account-help">${esc(help)}</small>` : ''}<div class="ali-account-field-error" id="aliAccount-error-${name}" aria-live="polite"></div></div>`;
  }
  function input(name, value, extra = '') { return `<input id="aliAccount-${name}" value="${esc(value)}" ${extra} oninput="window.Pages['${PAGE}'].setField('${name}',this.value)">`; }
  function openEditor(configId = '', context) {
    if (!can() || (context !== undefined && !sameContext(context))) return false;
    const row = configId ? service().find(configId) : null;
    if (configId && !row) return showToast('该账号暂时无法读取，请刷新后重试', 'warning');
    const current = { configId, context: currentContext(), expectedVersion: row?.version, busy: false, dirty: false, locked: !!row, values: row ? clone(row) : { name: '', enterpriseId: '', brandCustomerName: '', status: 'RUNNING', credentialConfigured: false, callerNavigations: [], remark: '' } };
    editor = current; drawEditor(current); return true;
  }
  function drawEditor(current) {
    const row = current.values;
    const fields = field('name', '账号名称', input('name', row.name, 'maxlength="80" placeholder="例如：总部联络中心"'), true) +
      field('enterpriseId', 'AliCti 账号 ID', input('enterpriseId', row.enterpriseId, `${current.locked ? 'readonly' : ''} inputmode="numeric" autocomplete="off" placeholder="填写 AliCti 提供的账号 ID"`), true, current.locked ? '账号 ID 在登记时确定。如需更正，请新增登记一个账号。' : '使用 AliCti 提供的账号 ID，例如 7522240。') +
      field('brandCustomerName', '客户 / 品牌名称', input('brandCustomerName', row.brandCustomerName || '', `${current.locked ? 'readonly' : ''} maxlength="80" placeholder="例如：东风日产"`), false, current.locked ? '客户 / 品牌在登记时确定。如需更正，请新增登记一个账号。' : '用于客户和线索的品牌归类；未填写时使用账号名称。') +
      `<div class="ali-account-field ali-account-field-wide"><label>接入凭据配置</label><label class="ali-account-checkbox"><input type="checkbox" id="aliAccount-credentialConfigured" ${row.credentialConfigured ? 'checked' : ''} onchange="window.Pages['${PAGE}'].setField('credentialConfigured',this.checked)"><span>已完成接入凭据配置</span></label><small class="ali-account-help">这里只登记配置状态，无需填写密码或密钥。</small><div class="ali-account-field-error" id="aliAccount-error-credentialConfigured" aria-live="polite"></div></div>` +
      `<section class="ali-account-field-wide ali-account-navigations"><div class="ali-account-section-head"><h3>外显导航 <small>（选填）</small></h3><button class="btn" type="button" onclick="${action('addNavigation')}">添加外显导航</button></div><p class="ali-account-help">登记 AliCti 已配置的导航名称与标识，创建任务时从中选择一个。</p><div id="aliAccount-callerNavigations" tabindex="-1">${navigationRows(current)}</div><div class="ali-account-field-error" id="aliAccount-error-callerNavigations" aria-live="polite"></div></section>` +
      `<div class="ali-account-field-wide">${field('remark', '备注', `<textarea id="aliAccount-remark" maxlength="500" rows="3" placeholder="填写账号用途或管理备注" oninput="window.Pages['${PAGE}'].setField('remark',this.value)">${esc(row.remark || '')}</textarea>`)}</div>`;
    ui.openLayer('alicti-account-editor', `<div class="layer-header"><div><h2>${current.configId ? '编辑 AliCti 账号' : '新增 AliCti 账号'}</h2><p>${current.configId ? esc(row.name) : '填写账号资料，租户关联在租户管理中设置。'}</p></div><button aria-label="关闭" onclick="${action('closeEditor')}">×</button></div><div class="layer-body ali-account-editor"><div class="ali-account-form-grid">${fields}</div><div id="aliAccountFormError" class="ali-account-error" role="alert"></div></div><div class="layer-footer"><button class="btn" onclick="${action('closeEditor')}">取消</button><button class="btn btn-primary" id="aliAccountSave" onclick="${action('save')}">保存账号</button></div>`, 'wide', { objectKey: current.configId || 'new', onRestore() { editor = current; drawErrors(current.errors || {}); } });
  }
  function navigationRows(current) {
    const rows=current.values.callerNavigations || [];
    if(!rows.length)return '<div class="ali-account-navigations-empty">暂未配置外显导航</div>';
    return rows.map((row,index)=>`<div class="ali-account-navigation-row"><div class="ali-account-field"><label for="aliAccount-navigation-name-${index}">导航名称<b aria-hidden="true"> *</b></label><input id="aliAccount-navigation-name-${index}" aria-label="外显导航 ${index+1} 名称" value="${esc(row.name)}" placeholder="例如：销售外呼" oninput="window.Pages['${PAGE}'].setNavigation(${index},'name',this.value)"></div><div class="ali-account-field"><label for="aliAccount-navigation-group-${index}">导航标识<b aria-hidden="true"> *</b></label><input id="aliAccount-navigation-group-${index}" aria-label="外显导航 ${index+1} 标识" value="${esc(row.customerClidsGroup)}" placeholder="填写 AliCti 已配置的标识" oninput="window.Pages['${PAGE}'].setNavigation(${index},'customerClidsGroup',this.value)"></div><button class="btn" type="button" aria-label="删除外显导航 ${index+1}" onclick="${action('removeNavigation',index)}">删除</button></div>`).join('');
  }
  function navigationChanged(redraw=false) {
    editor.dirty=true;AppState.setDirty(true);
    if(editor.errors)delete editor.errors.callerNavigations;
    const error=document.getElementById('aliAccount-error-callerNavigations');if(error)error.textContent='';
    if(redraw){const container=document.getElementById('aliAccount-callerNavigations');if(container)container.innerHTML=navigationRows(editor);}
  }
  function addNavigation() {
    if(!editor || editor.busy || !sameContext(editor.context))return false;
    editor.values.callerNavigations.push({name:'',customerClidsGroup:''});navigationChanged(true);
    document.getElementById('aliAccount-navigation-name-'+(editor.values.callerNavigations.length-1))?.focus();return true;
  }
  function setNavigation(index,key,value) {
    if(!editor || editor.busy || !sameContext(editor.context) || !Number.isInteger(index) || !editor.values.callerNavigations[index] || !['name','customerClidsGroup'].includes(key))return false;
    editor.values.callerNavigations[index][key]=text(value);navigationChanged();return true;
  }
  function removeNavigation(index) {
    if(!editor || editor.busy || !sameContext(editor.context) || !Number.isInteger(index) || !editor.values.callerNavigations[index])return false;
    editor.values.callerNavigations.splice(index,1);navigationChanged(true);return true;
  }
  function setField(name, value) {
    if (!editor || editor.busy || !['name', 'enterpriseId', 'brandCustomerName', 'credentialConfigured', 'remark'].includes(name)) return;
    if (['enterpriseId', 'brandCustomerName'].includes(name) && editor.locked) return;
    const changed = name === 'credentialConfigured' ? editor.values[name] !== value : text(editor.values[name]) !== text(value);
    editor.values[name] = value;
    if (changed) { editor.dirty = true; AppState.setDirty(true); }
    const error = document.getElementById('aliAccount-error-' + name); if (error) error.textContent = '';
  }
  function errorMap(result) {
    const mapped = {};
    if (Array.isArray(result.errors)) result.errors.forEach(error => { if (error && typeof error === 'object') mapped[error.field || error.name || 'form'] = error.message || error.error || '请检查填写内容'; else mapped.form = text(error); });
    else if (result.errors && typeof result.errors === 'object') Object.entries(result.errors).forEach(([name, value]) => { mapped[name] = typeof value === 'string' ? value : value?.message || text(value); });
    if (!Object.keys(mapped).length || result.message) mapped.form = result.message || '请检查填写内容后重试';
    return mapped;
  }
  function drawErrors(errors) {
    document.querySelectorAll('#alicti-account-editor .ali-account-field-error').forEach(el => { el.textContent = ''; });
    const general = document.getElementById('aliAccountFormError'); if (general) general.textContent = '';
    let first;
    Object.entries(errors).forEach(([name, message]) => { const target = document.getElementById('aliAccount-error-' + name); if (target) { target.textContent = message; first ||= document.getElementById('aliAccount-' + name); } else if (general) general.textContent = [general.textContent, message].filter(Boolean).join('；'); });
    first?.focus();
  }
  async function save() {
    const current = editor; if (!current || current.busy || !document.getElementById('alicti-account-editor')) return false;
    if (!sameContext(current.context)) { current.errors = { form: '工作范围已变化，请关闭后重新打开账号资料。' }; drawErrors(current.errors); return false; }
    const values = current.values, errors = {};
    if (!text(values.name).trim()) errors.name = '请填写账号名称';
    if (!text(values.enterpriseId).trim()) errors.enterpriseId = '请填写 AliCti 账号 ID';
    if (Object.keys(errors).length) { current.errors = errors; drawErrors(errors); return false; }
    current.busy = true; const button = document.getElementById('aliAccountSave'); if (button) { button.disabled = true; button.textContent = '正在保存…'; }
    drawErrors({});
    try {
      const payload = Object.fromEntries(['name', 'enterpriseId', 'brandCustomerName', 'credentialConfigured', 'callerNavigations', 'remark'].map(key => [key, values[key]]));
      const result = await service().save(payload, { ...(current.configId ? { configId: current.configId, expectedVersion: current.expectedVersion } : {}), context: current.context });
      if (editor !== current) return false;
      if (!result.ok) { current.errors = errorMap(result); drawErrors(current.errors); return false; }
      current.busy = false; closeEditor(true); refresh(); showToast(current.configId ? '账号资料已更新' : '账号已新增', 'success');
      return true;
    } catch (_) { current.errors = { form: '暂时无法保存，填写内容已保留，请稍后重试。' }; if (editor === current) drawErrors(current.errors); return false; }
    finally { current.busy = false; const button = document.getElementById('aliAccountSave'); if (editor === current && button) { button.disabled = false; button.textContent = '保存账号'; } }
  }
  function closeEditor(discard = false) {
    if (editor?.busy) return false;
    if (editor?.dirty && !discard) {
      ui.openLayer('alicti-account-discard', `<div class="layer-header"><h2>放弃未保存的修改？</h2><button aria-label="关闭" onclick="${action('keepEditing')}">×</button></div><div class="layer-body ali-account-status"><p>账号资料尚未保存。返回可继续编辑，放弃后本次填写内容不会保存。</p></div><div class="layer-footer"><button class="btn" onclick="${action('keepEditing')}">继续编辑</button><button class="btn btn-primary" onclick="${action('discardEditor')}">放弃修改</button></div>`, 'normal', { objectKey: editor.configId || 'new' });
      return false;
    }
    if (editor) AppState.setDirty(false);
    editor = null; ui.closeLayer('alicti-account-editor'); return true;
  }
  function keepEditing() { ui.closeLayer('alicti-account-discard'); }
  function discardEditor() { if (editor?.busy) return false; keepEditing(); return closeEditor(true); }
  function openDetail(configId, context) {
    if (!can() || (context !== undefined && !sameContext(context))) return false;
    const row = service().find(configId); if (!row) return showToast('该账号暂时无法读取，请刷新后重试', 'warning');
    const current = { configId, context: currentContext() }; detail = current;
    const tenants = tenantRows(row);
    const attributes = [['AliCti 账号 ID', row.enterpriseId], ['使用状态', statusLabel(row.status)], ['凭据配置', row.credentialConfigured ? '已配置' : '未配置'], ['客户 / 品牌名称', row.brandCustomerName || '未填写']];
    const body = `<dl class="ali-account-details">${attributes.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><section class="ali-account-navigations ali-account-navigation-detail"><div class="ali-account-section-head"><h3>外显导航</h3></div>${row.callerNavigations?.length ? `<dl class="ali-account-navigation-list">${row.callerNavigations.map(navigation=>`<div><dt>${esc(navigation.name)}</dt><dd>${esc(navigation.customerClidsGroup)}</dd></div>`).join('')}</dl>` : '<p class="ali-account-muted">未配置</p>'}</section>${row.remark ? `<div class="ali-account-remark"><span>备注</span><p>${esc(row.remark)}</p></div>` : ''}<section class="ali-account-tenants"><div class="ali-account-section-head"><h3>绑定租户</h3><span class="ali-account-muted">每个账号最多一个业务租户</span></div>${ui.table([{ key: 'name', label: '租户名称' }, { key: 'organizationLabel', label: '类型', render: (v, r) => esc(v || (r.organizationScope === 'HEADQUARTERS' ? '总部' : '门店')) }, { key: 'status', label: '租户状态', render: v => ui.status(v) }], tenants, { numbered: false, emptyText: '尚未绑定租户', emptyDetail: '请在租户管理中设置唯一绑定，总部和门店分别使用独立账号。' })}</section>`;
    ui.openLayer('alicti-account-detail', `<div class="layer-header"><div><h2>${esc(row.name)}</h2><p>AliCti 账号资料</p></div><button aria-label="关闭" onclick="${action('closeDetail')}">×</button></div><div class="layer-body ali-account-detail">${body}</div><div class="layer-footer"><button class="btn" onclick="${action('closeDetail')}">关闭</button></div>`, 'wide', { objectKey: configId, onRestore() { detail = current; } });
    return true;
  }
  function closeDetail() { detail = null; ui.closeLayer('alicti-account-detail'); }
  function maskPhone(value) {
    const phone = text(value); if (!phone) return '—';
    if (phone.includes('*')) return phone;
    return phone.length > 7 ? phone.slice(0, 3) + '****' + phone.slice(-4) : phone.slice(0, 1) + '***' + phone.slice(-1);
  }
  function historyColumns(kind, tenants, tasks) {
    const tenantName = row => tenants.find(t => t.tenantId === row.tenantId)?.name || row.tenantName || row.tenantId || '—';
    const shared = { key: 'tenantId', label: '所属租户', render: (_, row) => esc(tenantName(row)) };
    if (kind === 'tenants') return [{ key: 'name', label: '租户名称' }, { key: 'tenantId', label: '租户 ID' }, { key: 'organizationLabel', label: '类型', render: (v, row) => esc(v || (row.organizationScope === 'HEADQUARTERS' ? '总部' : row.organizationScope === 'STORE' ? '门店' : '—')) }, { key: 'status', label: '状态', render: value => ui.status(value ?? '未记录') }];
    if (kind === 'seats') return [{ key: 'name', label: '坐席姓名', render: (value, row) => esc(value || row.userName || row.agentName || '—') }, { key: 'agentId', label: '坐席工号', render: (value, row) => esc(value ?? row.alictiAgent?.agentId ?? row.alictiSeat?.cno ?? row.cno ?? row.employeeNo ?? row.workNo ?? '—') }, shared, { key: 'lifecycleStatus', label: '状态', render: (value, row) => ui.status(value ?? row.status ?? '未记录') }];
    if (kind === 'numbers') return [{ key: 'number', label: '号码', render: (value, row) => esc(maskPhone(value || row.alictiNumber?.number)) }, { key: 'usage', label: '用途', render: value => esc(value || '未记录') }, { key: 'status', label: '状态', render: (value, row) => ui.status(value ?? row.alictiNumber?.status ?? '未记录') }, { key: 'numberId', label: '号码记录 ID', render: (value, row) => esc(value || row.alictiNumber?.id || '—') }];
    if (kind === 'tasks') return [{ key: 'name', label: '任务名称', render: (value, row) => esc(value || row.taskName || '—') }, { key: 'taskId', label: '任务 ID' }, shared, { key: 'callType', label: '呼叫类型', render: value => esc(value || '未记录') }, { key: 'status', label: '任务状态', render: value => ui.status(value ?? '未记录') }, { key: 'scheduleAt', label: '计划时间', render: (value, row) => esc(value || row.createdAt || '—') }];
    return [{ key: 'callId', label: '通话编号', render: (value, row) => esc(value || row.contactId || '—') }, { key: 'taskId', label: '所属任务', render: (value, row) => esc(tasks.find(t => t.taskId === value)?.name || row.taskName || value || '—') }, shared, { key: 'callee', label: '被叫号码', render: value => esc(maskPhone(value)) }, { key: 'ringingAt', label: '通话时间', render: (value, row) => esc(value || row.recordedAt || row.startTime || '—') }, { key: 'result', label: '接听结果', render: (value, row) => ui.status(window.CallState?.view(row)?.answerLabel || value || '未记录') }];
  }
  function openHistory(configId, kind, context) {
    if (!can() || !sameContext(context) || !Object.hasOwn(historyNames, kind) || !service().find(configId)) return false;
    inspector = { configId, kind, context: currentContext(), page: 1 }; drawHistory(); return true;
  }
  function drawHistory() {
    const current = inspector;
    if (!current || !sameContext(current.context)) return false;
    const row = service().find(current.configId); if (!row) return false;
    const records = service().history(current.configId, current.kind);
    const rows = ui.sortByUpdated?.(records, ['endTime', 'callEndedAt', 'startTime', 'callStartedAt', 'importedAt']) || records;
    current.page = Math.min(Math.max(1, current.page), Math.max(1, Math.ceil(rows.length / pageSize)));
    const offset = (current.page - 1) * pageSize;
    const tenants = service().history(current.configId, 'tenants'), tasks = current.kind === 'calls' ? service().history(current.configId, 'tasks') : [];
    const content = ui.table(historyColumns(current.kind, tenants, tasks), rows.slice(offset, offset + pageSize), { rowOffset: offset, emptyText: '暂无' + historyNames[current.kind] + '记录', footer: ui.pagination(rows.length, current.page, pageSize, `window.Pages['${PAGE}'].setHistoryPage`) });
    ui.openLayer('alicti-account-history', `<div class="layer-header"><div><h2>${historyNames[current.kind]}</h2><p>${esc(row.name)} · ${esc(row.enterpriseId)}</p></div><button aria-label="关闭" onclick="${action('closeHistory')}">×</button></div><div class="layer-body ali-account-history">${content}</div><div class="layer-footer"><button class="btn" onclick="${action('closeHistory')}">关闭</button></div>`, 'wide', { objectKey: current.configId + ':' + current.kind, onRestore() { inspector = current; } });
    return true;
  }
  function setHistoryPage(next) { if (!inspector || !sameContext(inspector.context)) return false; inspector.page = Math.max(1, Number(next) || 1); return drawHistory(); }
  function closeHistory() { inspector = null; ui.closeLayer('alicti-account-history'); }

  async function changeStatus(configId, nextStatus, context) {
    if (!can() || !sameContext(context) || !['RUNNING', 'STOPPED'].includes(nextStatus) || statusDialog?.busy) return false;
    const row = service().find(configId); if (!row || row.status === nextStatus) return false;
    const current = { configId, status: nextStatus, expectedVersion: row.version, context: currentContext(), busy: false }; statusDialog = current;
    if (nextStatus === 'RUNNING') return applyStatus(current);
    const used = usage(row);
    ui.openLayer('alicti-account-status', `<div class="layer-header"><h2>停用 AliCti 账号</h2><button aria-label="关闭" onclick="${action('closeStatus')}">×</button></div><div class="layer-body ali-account-status"><p>停用 <strong>${esc(row.name)}</strong> 后，该账号将不能用于新的业务操作。</p><p>当前租户绑定，以及原有坐席、号码、任务和通话历史仍保留。之后可在本页重新启用。</p><div id="aliAccountStatusError" class="ali-account-error" role="alert"></div></div><div class="layer-footer"><button class="btn" onclick="${action('closeStatus')}">取消</button><button class="btn btn-primary" id="aliAccountStatusSave" onclick="${action('confirmStatus')}">确认停用</button></div>`, 'normal', { objectKey: configId, onRestore() { statusDialog = current; } });
    return true;
  }
  function closeStatus() { if (statusDialog?.busy) return; statusDialog = null; ui.closeLayer('alicti-account-status'); }
  function confirmStatus() { return statusDialog ? applyStatus(statusDialog) : false; }
  async function applyStatus(current) {
    if (!current || current.busy || !sameContext(current.context)) return false;
    current.busy = true; const button = document.getElementById('aliAccountStatusSave'); if (button) { button.disabled = true; button.textContent = '正在保存…'; }
    try {
      const result = await service().setStatus(current.configId, current.status, { expectedVersion: current.expectedVersion, context: current.context });
      if (!result.ok) {
        const message = result.message || Object.values(errorMap(result)).join('；') || '状态未能更新，请重试。';
        const target = document.getElementById('aliAccountStatusError') || document.getElementById('aliAccountDetailError');
        if (target) target.textContent = message; else { listMessage = message; refresh(); }
        return false;
      }
      current.busy = false; closeStatus(); refresh();
      if (detail?.configId === current.configId && document.getElementById('alicti-account-detail') && can()) openDetail(current.configId);
      showToast(current.status === 'RUNNING' ? '账号已启用' : '账号已停用', 'success'); return true;
    } catch (_) { const target = document.getElementById('aliAccountStatusError'); if (target) target.textContent = '状态未能保存，请稍后重试。'; else { listMessage = '状态未能保存，请稍后重试。'; refresh(); } return false; }
    finally { current.busy = false; const button = document.getElementById('aliAccountStatusSave'); if (button) { button.disabled = false; button.textContent = '确认停用'; } }
  }
  function captureNavigationState() { readFilterDraft(); return { filters: { ...filters }, draftFilters: { ...draftFilters }, page }; }
  function restoreNavigationState(saved) { if (!saved) return; filters = { keyword: text(saved.filters?.keyword), status: text(saved.filters?.status) }; draftFilters = { keyword: text(saved.draftFilters?.keyword ?? filters.keyword), status: text(saved.draftFilters?.status ?? filters.status) }; page = Math.max(1, Number(saved.page) || 1); }
  window.addEventListener('app:save-draft', event => {
    if (!editor?.dirty || !document.getElementById('alicti-account-editor')) return;
    event.preventDefault();
    showToast('请先保存账号资料或关闭编辑窗口，再切换业务域。', 'warning');
  });
  window.Pages = window.Pages || {};
  window.Pages[PAGE] = { render, init() {}, refresh, setFilter, query, resetFilters, setPage, openEditor, setField, addNavigation, setNavigation, removeNavigation, save, closeEditor, keepEditing, discardEditor, openDetail, closeDetail, openHistory, setHistoryPage, closeHistory, changeStatus, confirmStatus, closeStatus, captureNavigationState, restoreNavigationState };
})();
