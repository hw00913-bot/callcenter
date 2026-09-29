/** Local customer business information, indexed by the full call/customer identity. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, key = 'customer-followup-v1';
  let editor = null;
  const context = () => { const s = AppState.get(); return [s.accountId, s.enterpriseId, s.tenantId, s.activeDomain].join(':'); };
  const nonempty = value => Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value).trim() !== '';
  const typeOf = (call, values = {}) => String(call?.businessType || values.businessType || '');
  const definitions = (call, values = {}) => CustomerBusiness.fields(typeOf(call, values), call || {});
  const optionId = option => typeof option === 'object' && option !== null ? String(option.id ?? '') : String(option);
  const optionLabel = option => typeof option === 'object' && option !== null ? String(option.label ?? '') : String(option);
  const selectedLabel = (field, value) => {
    const option = field.options.find(item => optionId(item) === String(value));
    return option ? optionLabel(option) : String(value);
  };
  function empty(call) {
    return { businessType: call?.businessType || '', ...Object.fromEntries(definitions(call).map(field => [field.id, field.type === 'multiselect' ? [] : ''])), plannedStoreId: '' };
  }
  function update(values, call, field, value) {
    if (field === 'businessType') {
      if (call?.businessType || value && !CustomerBusiness.list(call).some(type => type.id === value)) return null;
      return { ...values, businessType: value };
    }
    const definition = definitions(call, values).find(item => item.id === field);
    return definition ? { ...values, [field]: definition.type === 'multiselect' ? (Array.isArray(value) ? value.map(String) : []) : String(value ?? '') } : null;
  }
  function identity(call) {
    const phone = window.CustomerDirectory?.phoneOf(call);
    return phone && call.callId && call.tenantId && call.enterpriseId ? JSON.stringify([call.enterpriseId, call.tenantId, phone, call.callId]) : '';
  }
  function read() {
    const value = JSON.parse(localStorage.getItem(key) || '{"version":1,"entries":[]}');
    if (value.version !== 1 || !Array.isArray(value.entries)) throw Error('Invalid followup journal');
    return value;
  }
  function overlay(calls) {
    let entries; try { entries = new Map(read().entries.map(row => [row.key, row])); } catch (_) { return; }
    calls.forEach(call => { const saved = entries.get(identity(call)); if (saved) { call.customerFollowup = structuredClone(saved.values); if (!call.businessType) call.businessType = saved.values.businessType || ''; } });
  }
  function aggregate(calls) {
    const result = { ...empty({...calls[0], businessType:'lead'}), groups: [] }, grouped = new Map();
    [...calls].filter(call => call.customerFollowup).sort((a,b) => String(a.customerFollowup.updatedAt || '').localeCompare(String(b.customerFollowup.updatedAt || ''))).forEach(call => {
      const values = call.customerFollowup, type = typeOf(call, values);
      if (!type) return;
      const key = JSON.stringify([call.enterpriseId, call.tenantId, type, call.externalDocumentId || '']);
      let group = grouped.get(key);
      if (!group) { group = { enterpriseId:call.enterpriseId, tenantId:call.tenantId, businessType:type, externalDocumentId:call.externalDocumentId || '', values:empty({...call,businessType:type}) }; grouped.set(key, group); }
      for (const field of definitions(call, values)) if (nonempty(values[field.id])) {
        group.values[field.id] = structuredClone(values[field.id]);
        if (type === 'lead') result[field.id] = structuredClone(values[field.id]);
      }
      group.values.updatedAt = values.updatedAt;
      result.updatedAt = values.updatedAt;
    });
    result.groups = [...grouped.values()];
    return result;
  }
  function stores(call) {
    const tenant = CloudCallData.tenants.find(t => t.tenantId === call?.tenantId && t.enterpriseId === call?.enterpriseId);
    return CloudCallData.tenants.filter(t => !t.builtIn && t.enterpriseId === call?.enterpriseId && t.organizationScope === 'STORE' && t.status === '启用' && (tenant?.organizationScope === 'HEADQUARTERS' || t.tenantId === tenant?.tenantId));
  }
  function canEdit(call, wrapping = false) {
    if (!call || !identity(call) || AppState.get().activeDomain !== 'CLOUD_CONTACT_CENTER' || !AppState.authorizeObject('', call) || !(call.endedAt && call.endedAt !== '—')) return false;
    if (call.callSource === 'NATIVE_WORKBENCH' && call.processingStatus === '待填写') return wrapping && call.accountId === AppState.get().accountId;
    const customer = CustomerDirectory.list().find(row => row.tenantId === call.tenantId && row.enterpriseId === call.enterpriseId && row.phone === CustomerDirectory.phoneOf(call));
    return !!customer?.calls.some(row => identity(row) === identity(call));
  }
  function validate(values, call, previous = {}) {
    const type = typeOf(call, values), result = { businessType:type, plannedStoreId:'' };
    if (!type) return { ok:true, values:result };
    if (!CustomerBusiness.get(type, call)) return { ok:false, field:'businessType', message:'业务分类已不可用，请重新选择' };
    for (const field of definitions(call, values)) {
      const raw = values?.[field.id], value = field.type === 'multiselect' ? (Array.isArray(raw) ? [...new Set(raw.map(String))] : []) : String(raw ?? '').trim();
      if (field.required && !nonempty(value)) return {ok:false,field:field.id,message:'请填写' + field.label};
      if (nonempty(value)) {
        if (['select','multiselect'].includes(field.type) && (Array.isArray(value) ? value : [value]).some(item => !field.options.some(option => optionId(option) === item))) return {ok:false,field:field.id,message:'请重新选择' + field.label};
        if (field.type === 'number' && !Number.isFinite(Number(value))) return {ok:false,field:field.id,message:'请为' + field.label + '填写有效数字'};
        if (['date','datetime'].includes(field.type)) {
          const parts = value.match(field.type === 'date' ? /^(\d{4})-(\d{2})-(\d{2})$/ : /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
          const date = new Date(field.type === 'date' ? value + 'T00:00:00' : value);
          const components = [date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes()].slice(0,field.type === 'date' ? 3 : 5);
          if (!parts || !Number.isFinite(date.getTime()) || components.some((part,i) => part !== Number(parts[i+1]))) return {ok:false,field:field.id,message:'请为' + field.label + '填写有效时间'};
        }
        if (typeof value === 'string' && value.length > (field.type === 'textarea' ? 2000 : 200)) return {ok:false,field:field.id,message:field.label + '内容过长，请精简后保存'};
      }
      result[field.id] = value;
    }
    if (result.plannedStoreName && result.plannedStoreName === String(previous.plannedStoreName || '').trim()) result.plannedStoreId = previous.plannedStoreId || '';
    return { ok:true, values:result };
  }
  function save(call, values, options = {}) {
    if (!canEdit(call, options.wrapping)) return { ok: false, message: '当前通话已不在可处理范围内，请返回后重新选择' };
    let journal;
    try { journal = read(); } catch (_) { return { ok: false, message: '业务信息暂时无法读取，请保留当前填写内容并重试' }; }
    const id = identity(call);
    const canonical = CloudCallData.calls.find(row => identity(row) === id);
    // A first edit can start from a bundled snapshot before a journal entry exists.
    // Never use an incoming clone as the current version; persisted values win.
    const previous = journal.entries.find(row => row.key === id)?.values || canonical?.customerFollowup || {};
    if (options.expectedVersion !== undefined && options.expectedVersion !== (previous.updatedAt || '')) return { ok: false, message: '这通电话的业务信息已更新，请刷新后再处理' };
    const checked = validate(values, call, previous);
    if (!checked.ok) return checked;
    const snapshot = { ...checked.values, updatedAt: new Date().toISOString(), updatedBy: AppState.get().accountId };
    const next = { key: id, values: snapshot };
    journal.entries = journal.entries.filter(row => row.key !== id).concat(next);
    try { localStorage.setItem(key, JSON.stringify(journal)); } catch (_) { return { ok: false, message: '业务信息未能保存，请保留当前填写内容并重试' }; }
    call.customerFollowup = structuredClone(snapshot);
    if (!call.businessType) call.businessType = snapshot.businessType;
    const live = CloudCallData.calls.find(row => identity(row) === id);
    if (live) { live.customerFollowup = structuredClone(snapshot); if (!live.businessType) live.businessType = snapshot.businessType; }
    return { ok: true, values: snapshot };
  }
  function fieldControl(field, value, prefix, handler) {
    const id = prefix + '-' + field.id, invoke = handler + '(' + JSON.stringify(field.id) + ',this.value)', required = field.required ? ' aria-required="true"' : '';
    const start = ' id="' + esc(id) + '"' + required;
    if (field.type === 'textarea') return '<textarea' + start + ' rows="3" maxlength="2000" oninput="' + esc(invoke) + '">' + esc(value || '') + '</textarea>';
    if (field.type === 'multiselect') {
      const selected = Array.isArray(value) ? value : [];
      const action = handler + '(' + JSON.stringify(field.id) + ',Array.from(this.closest("[data-followup-multiple]").querySelectorAll("input:checked")).map(option=>option.value))';
      return '<div' + start + ' role="group" tabindex="-1" aria-label="' + esc(field.label) + '" data-followup-multiple class="customer-followup-multiple">' + field.options.map(option => '<label><input type="checkbox" value="' + esc(optionId(option)) + '"' + (selected.includes(optionId(option)) ? ' checked' : '') + ' onchange="' + esc(action) + '">' + esc(optionLabel(option)) + '</label>').join('') + '</div>';
    }
    if (field.type === 'select') {
      return '<select' + start + ' onchange="' + esc(invoke) + '"><option value="">请选择</option>' + field.options.map(option => '<option value="' + esc(optionId(option)) + '"' + (value === optionId(option) ? ' selected' : '') + '>' + esc(optionLabel(option)) + '</option>').join('') + '</select>';
    }
    const inputType = {text:'text',number:'number',date:'date',datetime:'datetime-local'}[field.type] || 'text';
    return '<input' + start + ' type="' + inputType + '"' + (inputType === 'number' ? ' step="any"' : ' maxlength="200"') + ' value="' + esc(value ?? '') + '" oninput="' + esc(invoke) + '">';
  }
  function form(values, call, prefix, handler) {
    const current = { ...empty(call), ...values }, type = typeOf(call, current), meta = CustomerBusiness.get(type,call), fields = definitions(call,current);
    const selector = call?.businessType ? '<p class="customer-followup-type">业务类型：<strong>' + esc(meta?.label || type) + '</strong></p>' : '<label class="field customer-followup-type"><span>业务类型</span><select id="' + esc(prefix+'-businessType') + '" onchange="' + esc(handler + "('businessType',this.value)") + '"><option value="">请选择业务类型</option>' + CustomerBusiness.list(call).map(item => '<option value="' + esc(item.id) + '"' + (item.id === type ? ' selected' : '') + '>' + esc(item.label) + '</option>').join('') + '</select></label>';
    const fieldsHtml = fields.map(field => '<div class="field"><label for="' + esc(prefix+'-'+field.id) + '">' + (field.required ? '<em>*</em> ' : '') + esc(field.label) + (field.required ? '' : ' <small>（选填）</small>') + '</label>' + fieldControl(field,current[field.id],prefix,handler) + '</div>').join('');
    return '<section class="customer-followup-form"><div class="customer-followup-heading"><h3>客户业务信息</h3><span>' + (fields.some(field => field.required) ? '标 * 的字段保存时必填' : '全部选填') + '</span></div>' + selector + (type ? (fields.length ? '<div class="customer-followup-grid">' + fieldsHtml + '</div>' : '<p class="customer-followup-hint">此业务分类暂未配置补充字段。</p>') : '<p class="customer-followup-hint">选择本次业务类型后，填写对应的客户信息。</p>') + '</section>';
  }
  function detail(values, source = {}) {
    if (Array.isArray(values?.groups)) return values.groups.length ? values.groups.map(group => '<section class="customer-business-group"><h4>' + esc(CustomerBusiness.typeLabel(group) || group.businessType) + (group.externalDocumentId ? ' · ' + esc(CustomerBusiness.codeLabel(group)) + '：' + esc(group.externalDocumentId) : '') + '</h4>' + detail(group.values,group) + '</section>').join('') : '<p class="table-sub">暂无已填写的业务信息</p>';
    const fields = definitions(source,values || {});
    if (!fields.length) return '<p class="table-sub">暂无已填写的业务信息</p>';
    return '<dl class="customer-followup-details">' + fields.map(field => {
      const raw = values?.[field.id], value = Array.isArray(raw) ? raw.map(item => selectedLabel(field,item)).join('、') : field.type === 'select' ? (nonempty(raw) ? selectedLabel(field,raw) : raw) : field.type === 'datetime' ? raw?.replace('T',' ') : raw;
      return '<div><dt>' + esc(field.label) + '</dt><dd' + (!nonempty(value) ? ' class="is-empty"' : '') + '>' + esc(nonempty(value) ? value : '未填写') + '</dd></div>';
    }).join('') + '</dl>';
  }
  function openEditor(id) {
    CustomerDirectory.sync();
    const call = CloudCallData.calls.find(row => row.callId === id && AppState.authorizeObject('',row));
    if (!canEdit(call)) return showToast('当前通话已不在可处理范围内', 'warning');
    editor = { id, identity: identity(call), context: context(), values: { ...empty(call), ...call.customerFollowup }, version: call.customerFollowup?.updatedAt || '' };
    ui.openLayer('customer-followup-editor', '<div class="layer-header"><div><h2>填写客户业务信息</h2><p>' + esc((call.customerName || '客户') + ' · ' + CustomerDirectory.phoneOf(call)) + '</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer(\'customer-followup-editor\')">×</button></div><div class="layer-body">' + form(editor.values, call, 'followup', 'CustomerFollowup.updateEditor') + '<p class="customer-followup-error" id="followup-error" role="alert"></p></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'customer-followup-editor\')">取消</button><button class="btn btn-primary" id="followup-save" onclick="CustomerFollowup.saveEditor()">保存业务信息</button></div>', 'large');
  }
  function updateEditor(field,value) {
    if (!editor || context() !== editor.context) return;
    const call = CloudCallData.calls.find(row => identity(row) === editor.identity), next = update(editor.values,call,field,value);
    if (!next) return; editor.values = next;
    if (field === 'businessType') { const box = document.querySelector('#customer-followup-editor .customer-followup-form'); if (box) box.outerHTML = form(editor.values,call,'followup','CustomerFollowup.updateEditor'); }
  }
  function saveEditor() {
    if (!editor || !document.getElementById('customer-followup-editor')) return;
    const call = CloudCallData.calls.find(row => identity(row) === editor.identity);
    const result = context() === editor.context ? save(call, editor.values, { expectedVersion: editor.version }) : { ok: false, message: '当前工作范围已改变，请返回后重新填写' };
    if (!result.ok) { document.getElementById('followup-error').textContent = result.message; if (result.field) document.getElementById('followup-' + result.field)?.focus(); return; }
    const id = editor.id; editor = null;
    CustomerDirectory.sync();
    ui.closeLayer('customer-followup-editor');
    Pages['customer-directory']?.refreshSummary?.();
    // Refresh an open archive underneath without moving it ahead of the call drawer.
    const archive = document.getElementById('customer-directory-detail');
    if (archive) {
      const customer = CustomerDirectory.list().find(row => row.calls.some(item => identity(item) === identity(call)));
      if (customer) { const z = archive.style.zIndex; Pages['customer-directory'].openDetail(customer.id, true); document.getElementById('customer-directory-detail').style.zIndex = z; }
    }
    Pages['cloud-call-records'].openCall(id);
    showToast('业务信息已保存，客户档案与本次通话详情已更新', 'success');
  }
  window.CustomerFollowup = { empty, update, identity, overlay, aggregate, stores, canEdit, validate, save, form, detail, openEditor, updateEditor, saveEditor };
})();
