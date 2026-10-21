/** Interface-backed business fields, using the existing follow-up draft and save handlers. */
(function (root) {
  'use strict';
  const contexts = new Map(), esc = value => root.PlatformUI.escape(value), clone = value => structuredClone(value);
  let writeOrigin = null;
  const present = value => Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== '';
  const storeItems = value => Array.isArray(value) ? value : [];
  const itemKey = item => JSON.stringify([item?.type || '', item?.code || '']);
  const data = () => root.BusinessData;
  const scopeOf = call => ({ enterpriseId: String(call?.enterpriseId || ''), tenantId: String(call?.tenantId || '') });
  const appContext = () => {
    const s = root.AppState.get(), a = root.AppState.effectiveAccess?.() || {};
    return JSON.stringify([s.accountId, s.sessionId, s.enterpriseId, s.tenantId, s.activeDomain, a.roleCode, a.valid]);
  };
  const identity = call => root.CustomerFollowup?.identity(call) || '';
  const fieldsOf = (call, values) => root.CustomerBusiness.fields(call?.businessType || values?.businessType || '', call || {}).filter(field => field.type === 'interface');
  const fieldKind = field => data()?.capability(data()?.entry(field?.dictionaryId)?.capabilityId)?.kind || '';
  const version = (field, call) => field?.dictionaryId ? data()?.sourceVersion(field.dictionaryId, scopeOf(call)) : null;
  const available = (field, call) => !!data()?.available(field?.dictionaryId, scopeOf(call));
  const multiple = field => root.CustomerBusiness.selectionMode(field) === 'multiple';
  const selectionItems = (field, value) => multiple(field) ? storeItems(value) : present(value) ? [value] : [];
  const usesConditions = field => root.CustomerBusiness.usesQueryConditions(field);
  const dependenciesOf = field => root.CustomerBusiness.activeDependencies(field);
  const bindingOf = field => root.CustomerBusiness.parameterBinding(field) || {};
  const configKey = fields => JSON.stringify(fields.map(field => [field.id, field.dictionaryId, usesConditions(field), dependenciesOf(field), usesConditions(field) ? bindingOf(field) : null, fieldKind(field)]));
  const configurationRevision = call => root.CustomerBusiness.catalog?.(call || {})?.revision ?? null;
  const queryEmpty = () => ({ status: 'idle', items: [], message: '', filter: '', stamp: '', request: 0 });
  function selectionValid(field, value, values, call, trail = new Set()) {
    if (!field || !value || typeof value !== 'object' || Array.isArray(value) || value.state !== 'valid' ||
      typeof value.code !== 'string' || !value.code || typeof value.name !== 'string' || !value.name ||
      value.entryId !== field.dictionaryId || !available(field,call) || value.sourceVersion !== version(field,call)) return false;
    if (usesConditions(field) || multiple(field) || value.verifiedScope) {
      const scope = conditions(field,values,call,trail);
      return scope.ready && value.verifiedScope === scope.stamp;
    }
    return true;
  }
  function conditions(field, values, call, trail = new Set()) {
    const ids = [...new Set(dependenciesOf(field))], enabled = usesConditions(field), binding = bindingOf(field) || {}, fields = fieldsOf(call,values);
    const bindingValid = !enabled || (typeof binding.required === 'boolean' && typeof binding.parameterName === 'string' && !!binding.parameterName.trim() && typeof binding.sourceValueKey === 'string' && !!binding.sourceValueKey.trim());
    if (trail.has(field.id)) return {ready:false,cycle:true,stamp:'invalid-cycle:'+field.id,params:{},code:'',hasConditions:enabled};
    const visited = new Set(trail); visited.add(field.id);
    const source = ids.length === 1 ? fields.find(row=>row.id===ids[0]) : null, value = source ? values?.[source.id] : null;
    const declaredSource=source || root.CustomerBusiness.getField?.(ids[0],call);
    const compatibility=enabled ? root.CustomerBusiness.queryBindingCompatibility?.(field,declaredSource) || {ok:false,code:'missing_metadata',message:'接口查询条件缺少兼容性声明'} : {ok:true};
    const populated = present(value), upstreamScope = source ? conditions(source,values,call,visited) : null;
    const valid = populated && selectionValid(source,value,values,call,visited);
    const supplied = valid ? (Object.prototype.hasOwnProperty.call(value.sourceValues || {},binding.sourceValueKey) ? value.sourceValues[binding.sourceValueKey] : value[binding.sourceValueKey]) : undefined;
    const actualType=typeof supplied,expectedType=compatibility.expected?.valueType;
    const typeMismatch=enabled && compatibility.ok && valid && (actualType!==expectedType || actualType==='number' && !Number.isFinite(supplied));
    const issue=enabled && !compatibility.ok ? compatibility : upstreamScope?.configurationError || (typeMismatch ? {ok:false,code:'value_type_mismatch',message:'关联字段实际返回值的类型与接口条件声明不符'} : null);
    const configurationError=issue ? {...issue,ok:false,category:'configuration',nonRetryable:true,message:(fieldKind(field)==='store' && fieldKind(declaredSource)==='series'?'当前车系编码与门店接口不兼容，请管理员调整字段配置':'查询条件配置不兼容，请管理员调整字段配置')+(issue.message?'。'+issue.message:'')} : null;
    const hasInput = supplied !== '' && (typeof supplied === 'string' || typeof supplied === 'boolean' || typeof supplied === 'number' && Number.isFinite(supplied));
    const ready = !configurationError && bindingValid && !upstreamScope?.cycle && (!enabled || (ids.length === 1 && (populated ? valid && hasInput : binding.required !== true)));
    const params = enabled && ready && populated && hasInput ? {[binding.parameterName]:supplied} : {};
    return {code:enabled && hasInput ? supplied : '',params,ready,configurationError,cycle:!!upstreamScope?.cycle,hasConditions:enabled,required:binding.required === true,
      dependencyName:source?.label || root.CustomerBusiness.getField?.(ids[0],call)?.label || '关联字段',
      stamp:JSON.stringify({scope:scopeOf(call),call:identity(call),businessType:call?.businessType || values?.businessType || '',
        field:field.id,dictionary:field.dictionaryId,sourceVersion:version(field,call),enabled,
        binding:enabled ? binding : null,compatibility:enabled ? [compatibility.code || '',compatibility.expected || null,compatibility.actual || null,configurationError?.code || ''] : null,ids,dependencies:source ? [[source.id,source.dictionaryId,version(source,call),upstreamScope?.stamp,
          value?.code || '',value?.entryId || '',value?.state || '',supplied ?? null]] : [],params})};
  }
  function validate(field, raw, values, call) {
    const kind = fieldKind(field), invalid = message => ({ ok: false, field: field.id, message: field.label + message });
    if (!multiple(field) && Array.isArray(raw)) return invalid('只能选择一项');
    if (multiple(field) && present(raw) && !Array.isArray(raw)) return invalid('须使用多选列表，请清空后重新选择');
    if (!present(raw)) return { ok: true, value: multiple(field) || Array.isArray(raw) ? [] : '' };
    const items = multiple(field) ? storeItems(raw) : [raw], selected = new Map();
    const current = conditions(field, values, call);
    if(current.configurationError)return {ok:false,field:field.id,...current.configurationError};
    for (const item of items) {
      if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.code !== 'string' || !item.code || typeof item.name !== 'string' || !item.name) return invalid('请从接口查询结果中选择');
      const label = kind === 'store' ? '中的“' + item.name + '”' : '';
      if (!available(field, call) || item.state === 'unavailable') return invalid(label + '来源不可用，请恢复后重查确认或移除');
      if (item.entryId !== field.dictionaryId || item.sourceVersion !== version(field, call) || item.state !== 'valid') return invalid(label + '尚未有效确认，请重查确认或移除');
      if ((multiple(field) || usesConditions(field) || item.verifiedScope) && (!current.ready || item.verifiedScope !== current.stamp)) return invalid(label + '尚未按当前查询条件查全确认，请重新查询');
      if (!kind) return invalid('的取数能力不可用');
      selected.set(itemKey(item), clone(item));
    }
    return { ok: true, value: multiple(field) ? [...selected.values()] : clone(raw) };
  }
  function host(ctx) {
    const nodes = root.document?.querySelectorAll?.('[data-interface-prefix]') || [];
    const node = [...nodes].find(node => node.dataset.interfacePrefix === ctx.prefix && node.dataset.interfaceCall === ctx.identity && node.isConnected &&
      !node.closest?.('[inert], [aria-hidden="true"], .drawer-exit-visual'));
    if (!node) return null;
    // Field controls redraw independently. Bind to the editor form, whose removal
    // ends this session even when the same call and prefix are opened again.
    const owner = node.closest?.('.customer-followup-form') || node.closest?.('.platform-layer') || node.parentElement || node;
    if (!ctx.owner) ctx.owner = owner;
    return ctx.owner === owner && owner.isConnected ? node : null;
  }
  function active(ctx) {
    return contexts.get(ctx.prefix) === ctx && ctx.app === appContext() && identity(ctx.call) === ctx.identity &&
      configKey(fieldsOf(ctx.call, ctx.values)) === ctx.config && !!host(ctx);
  }
  function interactive(ctx) {
    if (!ctx || !active(ctx) || !ctx.identity || !root.AppState.authorizeObject('', ctx.call)) return false;
    const s = root.AppState.get();
    if (s.activeDomain !== 'CLOUD_CONTACT_CENTER') return false;
    if (ctx.handler === 'AgentWorkbench.setFollowup') return ctx.call.accountId === s.accountId && ctx.call.tenantId === s.tenantId && ctx.call.enterpriseId === s.enterpriseId;
    return ctx.handler === 'CustomerFollowup.updateEditor' && root.CustomerFollowup.canEdit(ctx.call);
  }
  function fieldOf(ctx, id) { return fieldsOf(ctx.call, ctx.values).find(field => field.id === id); }
  function notify(message) { if (message) root.showToast?.(message, 'warning'); }
  function cancelBring(ctx) { const action=ctx.bringing;ctx.draftRevision++;ctx.bringing=null;if(action) root.CustomerFollowup?.setImportStatus?.(ctx.prefix,ctx.call,false,'本次核对已停止，保留你刚才填写的内容。',action.owner); }
  function write(ctx, id, value, origin = { kind: 'user' }) {
    if (!interactive(ctx)) return false;
    const parts = ctx.handler.split('.'), owner = root[parts[0]], callback = owner?.[parts[1]];
    if (parts.length !== 2 || typeof callback !== 'function') return false;
    const previous = writeOrigin; writeOrigin = origin;
    try { callback.call(owner, id, value); return true; }
    finally { writeOrigin = previous; }
  }
  function schedule(ctx) {
    if (ctx.scheduled) return;
    ctx.scheduled = true;
    root.setTimeout(() => { ctx.scheduled = false; if (active(ctx)) redraw(ctx); }, 0);
  }
  function register(prefix, call, values, handler) {
    const fields = fieldsOf(call, values), id = identity(call), config = configKey(fields), app = appContext();
    // A form render starts a distinct editing session; never revive an action
    // from a removed editor merely because its call identity still matches.
    const ctx = { prefix, call, values, handler, identity: id, config, app, queries: {}, counter: 0, owner: null, draftRevision: 0, bringing: null };
    contexts.set(prefix, ctx); schedule(ctx); return ctx;
  }
  function updated(values, call, changedField) {
    const id = identity(call);
    for (const ctx of contexts.values()) {
      if (ctx.identity !== id || ctx.app !== appContext()) continue;
      const ownedImport = writeOrigin?.kind === 'import' && writeOrigin.ctx === ctx && writeOrigin.action === ctx.bringing;
      if (writeOrigin?.kind !== 'system' && !ownedImport) cancelBring(ctx);
      ctx.values = values;
      const queue = [changedField], visited = new Set();
      while (queue.length) {
        const upstream = queue.shift(); if (visited.has(upstream)) continue; visited.add(upstream);
        for (const field of fieldsOf(call,values).filter(row=>dependenciesOf(row).includes(upstream))) {
          ctx.queries[field.id] = queryEmpty();
          const parent = values[upstream], mustReconfirm = (bindingOf(field).required && !present(parent)) || (present(parent) && ['pending','unavailable'].includes(parent?.state));
          if (mustReconfirm && present(values[field.id])) {
            if (multiple(field) && !Array.isArray(values[field.id])) continue;
            const next = selectionItems(field,values[field.id]).map(item=>item && typeof item==='object' ? {...item,state:item.state==='unavailable'?'unavailable':'pending'} : item);
            values[field.id] = multiple(field) ? next : next[0];
          }
          queue.push(field.id);
        }
      }
      schedule(ctx);
    }
  }
  function syncSources(ctx) {
    if (!interactive(ctx)) return;
    for (const field of fieldsOf(ctx.call, ctx.values)) {
      const raw = ctx.values[field.id];
      if (!present(raw) || typeof raw !== 'object') continue;
      const isMultiple = multiple(field);
      if (isMultiple && !Array.isArray(raw)) continue;
      const items = selectionItems(field,raw);
      let changed = false;
      const next = items.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
        const state = !available(field, ctx.call) ? 'unavailable' : item.entryId !== field.dictionaryId || item.sourceVersion !== version(field, ctx.call) ? 'pending' : item.state;
        if (state === item.state) return item;
        changed = true; return { ...item, state };
      });
      if (changed) write(ctx, field.id, isMultiple ? next : next[0], { kind: 'system' });
    }
  }
  function currentQuery(ctx, field) {
    const q = ctx.queries[field.id] || queryEmpty();
    const stamp = conditions(field,ctx.values,ctx.call).stamp;
    return q.stamp && (q.stamp !== stamp || q.configurationRevision !== configurationRevision(ctx.call)) ? queryEmpty() : q;
  }
  const action = (name, prefix, id, extra = '') => esc('BusinessInterfaceField.' + name + '(' + JSON.stringify(prefix) + ',' + JSON.stringify(id) + extra + ')');
  let dropdown = null;
  function fieldNode(ctx, id) {
    return [...(root.document?.querySelectorAll?.('[data-interface-prefix]') || [])].find(node => node.dataset.interfacePrefix === ctx.prefix && node.dataset.interfaceField === id && node.dataset.interfaceCall === ctx.identity);
  }
  function focusTrigger(ctx, id) { fieldNode(ctx, id)?.querySelector?.('[data-interface-trigger]')?.focus?.({ preventScroll: true }); }
  function dependencyTarget(ctx, field, seen = new Set()) {
    if (!field || seen.has(field.id)) return null;
    seen.add(field.id);
    const source = fieldOf(ctx,dependenciesOf(field)[0]);
    if (!source) return null;
    return !conditions(source,ctx.values,ctx.call).ready ? dependencyTarget(ctx,source,seen) : source;
  }
  function focusDependency(prefix, id) {
    const ctx=contexts.get(prefix), field=ctx && fieldOf(ctx,id);
    if(!field || !interactive(ctx)) return false;
    const condition=conditions(field,ctx.values,ctx.call);
    if(condition.configurationError){notify(condition.configurationError.message);return false;}
    const source=dependencyTarget(ctx,field);
    if(!source) { notify('关联字段尚未配置完成，请联系管理员检查业务分类。');return false; }
    if(!available(source,ctx.call)) { notify('“'+source.label+'”的数据来源暂不可用，请联系管理员恢复后重试；已填内容保留。');return false; }
    fieldNode(ctx,source.id)?.scrollIntoView?.({block:'center',behavior:'smooth'});
    focusTrigger(ctx,source.id);open(prefix,source.id);return true;
  }
  function control(field, value, prefix, handler, call, values) {
    const ctx = contexts.get(prefix), kind = fieldKind(field), usable = available(field, call), isStore = multiple(field);
    const condition = conditions(field,values,call), entries = isStore ? storeItems(value).filter(item => item && typeof item === 'object' && !Array.isArray(item)) : [];
    const current = !isStore && value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    const hasSelection = isStore ? entries.length > 0 : !!current;
    const checked = hasSelection && validate(field, value, values, call).ok;
    const configurationError=condition.configurationError || (ctx && currentQuery(ctx,field).configurationError);
    const disabled = !usable || !kind || !condition.ready && !configurationError;
    const next = ctx && !condition.ready && !configurationError ? dependencyTarget(ctx,field) : null;
    const invalidShape = present(value) && (isStore ? !Array.isArray(value) : typeof value !== 'object' || Array.isArray(value));
    let message = invalidShape ? '填写格式与本字段不一致，请清空后从接口重新选择。' : !usable ? '数据来源暂不可用，已选内容保留。请联系管理员恢复后重试，或移除本次选择。' : configurationError ? configurationError.message : !condition.ready ? '请先填写或确认“'+(next?.label || condition.dependencyName)+'”，再选择“'+field.label+'”。' : '';
    if (hasSelection && !checked && usable && !configurationError) {
      const pending = (isStore ? entries.some(item => item.state === 'pending') : current.state === 'pending') ? '待重选' : '待确认';
      message = message ? pending + '，' + message : isStore ? '部分门店' + pending + '，请打开后确认或移除' : pending + '，请打开后重新确认';
    }
    if (!message && isStore) {
      const sourceValue=values?.[dependenciesOf(field)[0]];
      message=condition.hasConditions && Object.keys(condition.params || {}).length ? '按“'+(sourceValue?.name || condition.dependencyName)+'”查找可用门店。' : condition.hasConditions ? '“'+condition.dependencyName+'”未填写，可直接查找当前租户全部可用门店。' : '可直接查找当前租户全部可用门店。';
    }
    const opened = !!dropdown?.node.isConnected && dropdown.ctx === ctx && dropdown.id === field.id;
    const label = current ? current.name : isStore ? entries.length ? '已选 ' + entries.length + ' 家门店' : '请选择门店（可多选）' : '请选择'+field.label;
    const tags = isStore && entries.length ? '<div class="business-interface-store-tags">' + entries.map(item => {
      const valid = validate(field,[item],values,call).ok, status = !usable || item.state === 'unavailable' ? '来源不可用' : configurationError ? '配置待调整' : item.state === 'pending' ? '待重选' : valid ? '' : '待确认';
      return '<span class="business-interface-store-tag' + (valid ? '' : ' is-pending') + '" title="' + esc(item.name + ' · ' + item.code + (status ? ' · ' + status : '')) + '"><span>' + esc(item.name || item.code) + (status ? '<small>' + esc(status) + '</small>' : '') + '</span><button type="button" aria-label="移除门店' + esc(item.name || item.code) + '" onclick="' + action('removeStore',prefix,field.id,',' + JSON.stringify(itemKey(item))) + '">×</button></span>';
    }).join('') + '</div>' : '';
    return '<div class="business-interface-control" id="' + esc(prefix + '-' + field.id) + '" tabindex="-1" role="group" aria-label="' + esc(field.label) + '"' + (field.required ? ' data-followup-required-field' + (root.CustomerFollowup?.isUnansweredOutbound(call) ? '' : ' aria-required="true"') : '') + ' data-interface-prefix="' + esc(prefix) + '" data-interface-field="' + esc(field.id) + '" data-interface-call="' + esc(identity(call)) + '"><div class="business-interface-input' + (hasSelection && !checked ? ' is-pending' : '') + (isStore && entries.length ? ' business-interface-store-box' : '') + '"><button type="button" data-interface-trigger class="business-interface-trigger' + (!hasSelection ? ' is-placeholder' : '') + (isStore && entries.length ? ' has-store-tags' : '') + '" role="combobox" aria-label="' + esc(field.label) + '" aria-haspopup="' + (isStore ? 'dialog' : 'listbox') + '" aria-expanded="' + opened + '"' + (disabled ? ' disabled' : '') + ' onclick="' + action('open', prefix, field.id) + '" onkeydown="' + action('triggerKey', prefix, field.id, ',event') + '"><span>' + esc(label) + '</span><span class="business-interface-chevron" aria-hidden="true">⌄</span></button>' + tags + (present(value) ? '<button type="button" class="business-interface-clear" aria-label="清除' + esc(field.label) + '" title="清空" onclick="' + action('clear', prefix, field.id) + '">×</button>' : '') + '</div>' + (message ? '<div class="business-interface-message" role="status">' + esc(message) + (next && usable && available(next,call) ? ' <button type="button" class="btn-link" onclick="'+action('focusDependency',prefix,field.id)+'">去填写'+esc(next.label)+'</button>' : '') + '</div>' : '') + '</div>';
  }
  function redraw(ctx) {
    if (!active(ctx)) { if (dropdown?.ctx === ctx) closeDropdown(false); root.BusinessStorePicker?.refresh(); return; }
    for (const field of fieldsOf(ctx.call, ctx.values)) {
      const node = fieldNode(ctx, field.id);
      if (!node) continue;
      const hadFocus = node.querySelector?.('[data-interface-trigger]') === root.document.activeElement;
      node.outerHTML = control(field, ctx.values[field.id], ctx.prefix, ctx.handler, ctx.call, ctx.values);
      if (hadFocus) focusTrigger(ctx, field.id);
    }
    refreshDropdown(); root.BusinessStorePicker?.refresh();
  }
  function pickerState(ctx, id) {
    const field = fieldOf(ctx, id), q = field ? currentQuery(ctx, field) : queryEmpty();
    const condition = field ? conditions(field, ctx.values, ctx.call) : { ready: false, stamp: '' };
    const configurationError=condition.configurationError || q.configurationError;
    return { active: !!field && interactive(ctx), available: !!field && available(field, ctx.call), ready: condition.ready && !configurationError, stamp: condition.stamp,
      status: configurationError?'configuration':q.status, configurationError, message: configurationError?.message || q.message, items: configurationError?[]:q.items, current: storeItems(ctx.values[id]), demoProfile: data()?.demoProfile?.(),
      hasConditions:condition.hasConditions,conditionRequired:condition.required,hasConditionValue:!!Object.keys(condition.params || {}).length,dependencyLabel:'关联字段',dependencyName:condition.dependencyName,
      series: dependenciesOf(field).map(dep => ctx.values[dep]).filter(value => value && typeof value === 'object').map(value => ({ code: value.code, name: value.name })) };
  }
  function open(prefix, id) {
    const ctx = contexts.get(prefix), field = ctx && fieldOf(ctx, id);
    if (!field || !interactive(ctx) || !available(field, ctx.call)) return;
    if (fieldKind(field) === 'store') {
      closeDropdown(false);
      const condition=conditions(field,ctx.values,ctx.call);
      if (!condition.ready && !condition.configurationError) return notify('请先填写或确认关联字段');
      root.BusinessStorePicker?.open({ key: prefix + ':' + id, title: '选择' + field.label,
        getState: () => pickerState(ctx, id), query: () => query(prefix, id), choose: keys => chooseMany(prefix, id, keys),
        restoreFocus: () => focusTrigger(ctx, id) });
      return;
    }
    const condition=conditions(field,ctx.values,ctx.call);
    if (!condition.ready) return notify(condition.configurationError?.message || '请先填写或确认关联字段');
    if (dropdown?.node.isConnected && dropdown.ctx === ctx && dropdown.id === id) { closeDropdown(true); return; }
    closeDropdown(false);
    const node = root.document.createElement('div');
    node.className = 'business-series-dropdown'; node.id = 'business-series-dropdown';
    node.innerHTML = '<div class="business-series-search"><input type="search" autocomplete="off" placeholder="搜索名称或编码" aria-label="搜索' + esc(field.label) + '" role="combobox" aria-expanded="true" aria-controls="business-series-options" aria-autocomplete="list"></div><div id="business-series-options" class="business-series-options" role="listbox" aria-label="接口查询选项"></div><div class="business-series-feedback" role="status"></div>';
    const anchor = fieldNode(ctx, id), layer = anchor?.closest?.('.platform-layer');
    (layer || root.document.body).appendChild(node);
    node.style.zIndex = String(root.PlatformUI.nextLayerZIndex?.() || 11000);
    dropdown = { ctx, id, node, input: node.querySelector('input'), index: -1, items: [], text: '' };
    dropdown.input.addEventListener('input', event => { if (!dropdown || dropdown.node !== node) return; dropdown.text = event.target.value; dropdown.index = -1; refreshDropdown(); });
    node.addEventListener('keydown', dropdownKey);
    node.addEventListener('click', event => {
      const option = event.target.closest('[data-series-option]');
      if (option && dropdown?.node === node && choose(prefix, id, option.dataset.seriesOption)) closeDropdown(true);
      if (event.target.closest('[data-series-retry]')) query(prefix, id);
    });
    redraw(ctx); dropdown?.input.focus({ preventScroll: true });
    query(prefix, id);
  }
  function closeDropdown(restoreFocus = false) {
    const old = dropdown; if (!old) return;
    dropdown = null; old.node.remove();
    fieldNode(old.ctx, old.id)?.querySelector?.('[data-interface-trigger]')?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) focusTrigger(old.ctx, old.id);
  }
  function positionDropdown() {
    const d = dropdown; if (!d) return;
    const anchor = fieldNode(d.ctx, d.id)?.querySelector?.('[data-interface-trigger]');
    if (!anchor?.getBoundingClientRect) return;
    const rect = anchor.getBoundingClientRect(), width = Math.min(Math.max(rect.width, 300), root.innerWidth - 24);
    const height = Math.min(340, Math.max(160, root.innerHeight - 40));
    const below = root.innerHeight - rect.bottom - 12, above = rect.top - 12, flip = below < Math.min(height, 220) && above > below;
    const availableHeight = Math.max(120, Math.min(height, flip ? above : below));
    Object.assign(d.node.style, { width: width + 'px', maxHeight: availableHeight + 'px', left: Math.max(12, Math.min(rect.left, root.innerWidth - width - 12)) + 'px', top: (flip ? Math.max(12, rect.top - Math.min(d.node.scrollHeight || height, availableHeight) - 6) : rect.bottom + 6) + 'px' });
  }
  function refreshDropdown() {
    const d = dropdown; if (!d) return;
    if (!d.node.isConnected) { closeDropdown(false); return; }
    const field = fieldOf(d.ctx, d.id);
    if (!field || !interactive(d.ctx) || !available(field, d.ctx.call)) { closeDropdown(false); return; }
    const q = currentQuery(d.ctx, field), list = d.node.querySelector('[role="listbox"]'), feedback = d.node.querySelector('[role="status"]');
    const term = d.text.trim().toLocaleLowerCase();
    d.items = q.status === 'complete' ? q.items.filter(item => (item.name + ' ' + item.code).toLocaleLowerCase().includes(term)) : [];
    if (d.index >= d.items.length) d.index = -1;
    list.innerHTML = d.items.map((item, index) => '<button type="button" tabindex="-1" role="option" id="business-series-option-' + index + '" aria-selected="' + (d.ctx.values[d.id]?.code === item.code && d.ctx.values[d.id]?.type === item.type) + '" class="business-series-option' + (index === d.index ? ' is-active' : '') + '" data-series-option="' + esc(JSON.stringify([item.type || '', item.code])) + '"><span>' + esc(item.name) + '</span><small>' + esc(item.code) + '</small></button>').join('');
    feedback.innerHTML = q.status === 'loading' ? '正在加载…' : q.status === 'configuration' ? esc(q.message) : q.status === 'failed' ? '加载未完成 <button type="button" class="business-series-retry" data-series-retry>重试</button>' : !d.items.length ? q.items.length ? '没有匹配项，请调整关键词' : '暂无可选项' : '';
    feedback.hidden = !feedback.innerHTML;
    if (d.index >= 0) { d.input.setAttribute('aria-activedescendant', 'business-series-option-' + d.index); list.children[d.index]?.scrollIntoView?.({ block: 'nearest' }); }
    else d.input.removeAttribute('aria-activedescendant');
    positionDropdown();
  }
  function dropdownKey(event) {
    if (!dropdown) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeDropdown(true); return; }
    if (event.key === 'Tab') { closeDropdown(true); return; }
    if (event.isComposing || event.target !== dropdown.input) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); const d = dropdown;
      if (d.items.length) d.index = (d.index + (event.key === 'ArrowDown' ? 1 : -1) + d.items.length) % d.items.length;
      refreshDropdown();
    } else if (event.key === 'Enter') {
      event.preventDefault(); const d = dropdown, item = d.items[d.index >= 0 ? d.index : 0];
      if (item && choose(d.ctx.prefix, d.id, JSON.stringify([item.type || '', item.code]))) closeDropdown(true);
    }
  }
  function triggerKey(prefix, id, event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(prefix, id); }
  }
  async function query(prefix, id, actionCurrent) {
    const ctx = contexts.get(prefix), field = ctx && fieldOf(ctx, id);
    if (!field || !interactive(ctx)) { notify('当前填写范围或字段配置已变化，请重新打开'); return { ok: false, message: '当前填写范围已变化，请重新打开' }; }
    syncSources(ctx);
    if (!available(field, ctx.call)) { redraw(ctx); return { ok: false, message: '来源不可用' }; }
    const kind=fieldKind(field), condition=conditions(field,ctx.values,ctx.call);
    if(condition.configurationError){ctx.queries[id]={...queryEmpty(),status:'configuration',configurationError:condition.configurationError,message:condition.configurationError.message,stamp:condition.stamp,configurationRevision:configurationRevision(ctx.call)};redraw(ctx);return {...condition.configurationError,complete:false,items:[]};}
    if (!condition.ready) {redraw(ctx);return {ok:false,message:'请先填写或确认关联字段“'+condition.dependencyName+'”'};}
    if (!kind) return {ok:false,message:'取数能力不可用'};
    const stamp=condition.stamp,request=++ctx.counter,configuredAt=configurationRevision(ctx.call);
    ctx.queries[id]={status:'loading',items:[],message:'正在查询'+field.label,filter:'',stamp,request,configurationRevision:configuredAt};
    redraw(ctx);
    let result;
    try { result = await data().queryOptions(field.dictionaryId,condition.params,scopeOf(ctx.call)); }
    catch (_) { result = { ok: false, complete: false, items: [], message: '查询失败，请保留当前填写并重试' }; }
    const current=fieldOf(ctx,id),nextStamp=current && conditions(current,ctx.values,ctx.call).stamp;
    if ((actionCurrent && !actionCurrent()) || !interactive(ctx) || !current || ctx.queries[id]?.request !== request || nextStamp !== stamp || configuredAt !== configurationRevision(ctx.call) || !available(current, ctx.call)) return { ok: false, message: '旧查询已失效，未用于新选择' };
    const complete = result.ok && result.complete === true;
    const items = complete ? [...new Map((result.items || []).filter(item => typeof item.code === 'string' && item.code && typeof item.name === 'string' && item.name).map(item => [JSON.stringify([item.type || '', item.code]), clone(item)])).values()] : [];
    const configurationError=!complete && result.category==='configuration' ? result : null;
    ctx.queries[id] = { status: complete ? 'complete' : configurationError ? 'configuration' : 'failed', configurationError, items, message: complete ? result.message || (items.length ? '查询完成，请选择或确认' : '查询完成，暂无匹配结果') : configurationError ? configurationError.message : '查询未完成，请重试；已填内容保留，查全后才能新选。' + (result.message || ''), stamp, request, filter: '', configurationRevision: configuredAt };
    if (complete) {
      const old = selectionItems(current,ctx.values[id]); let changed = false;
      const next = old.map(value => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
        const match = items.some(item => item.code === value.code && (item.type || '') === (value.type || ''));
        if (!match || value.state === 'unavailable') { if (value.state !== 'pending') { changed = true; return { ...value, state: 'pending' }; } }
        else if (value.state === 'valid' && value.entryId === current.dictionaryId && value.sourceVersion === version(current, ctx.call) && value.verifiedScope !== stamp) { changed = true; return { ...value, verifiedScope: stamp }; }
        return value;
      });
      if (changed) write(ctx,id,multiple(current)?next:next[0],{kind:'system'});
    }
    redraw(ctx); return { ...result, ok: !!complete, items };
  }
  function outputValues(field,item) {
    const keys=root.CustomerBusiness.returnFields(field).map(row=>row.key).filter(key=>!['__proto__','prototype','constructor'].includes(key));
    return Object.fromEntries(keys.filter(key=>Object.prototype.hasOwnProperty.call(item,key)).map(key=>[key,clone(item[key])]));
  }
  function chooseMany(prefix, id, keys, origin) {
    const ctx = contexts.get(prefix), field = ctx && fieldOf(ctx,id);
    if (!field || !multiple(field) || !interactive(ctx) || !available(field,ctx.call) || !Array.isArray(keys)) return false;
    const q = currentQuery(ctx,field), current = conditions(field,ctx.values,ctx.call);
    if (q.status !== 'complete' || !current.ready || q.stamp !== current.stamp) return false;
    const selected = new Map();
    for (const key of keys) {
      let parsed; try { parsed = JSON.parse(key); } catch (_) { return false; }
      if (!Array.isArray(parsed) || parsed.length !== 2) return false;
      const item = q.items.find(value => value.code === parsed[1] && (value.type || '') === parsed[0]);
      if (!item) return false;
      selected.set(itemKey(item), { code:item.code, name:item.name, type:item.type || '', entryId:field.dictionaryId, state:'valid', sourceVersion:version(field,ctx.call), verifiedScope:current.stamp,sourceValues:outputValues(field,item) });
    }
    return write(ctx,id,[...selected.values()],origin);
  }
  function choose(prefix, id, key, origin) {
    const ctx = contexts.get(prefix), field = ctx && fieldOf(ctx, id);
    if (multiple(field)) return chooseMany(prefix,id,[key],origin);
    if (!field || !interactive(ctx) || !available(field, ctx.call)) return false;
    const q = currentQuery(ctx, field); let parsed; try { parsed = JSON.parse(key); } catch (_) { return false; }
    const item = q.items.find(value => value.code === parsed?.[1] && (value.type || '') === parsed?.[0]);
    if (q.status !== 'complete' || !item) return false;
    const current=conditions(field,ctx.values,ctx.call);
    if(!current.ready || q.stamp!==current.stamp) return false;
    const selected = { code:item.code,name:item.name,type:item.type || '',entryId:field.dictionaryId,state:'valid',sourceVersion:version(field,ctx.call),verifiedScope:current.stamp,sourceValues:outputValues(field,item) };
    return write(ctx, id, selected, origin);
  }
  function confirm(prefix, id) {
    const ctx = contexts.get(prefix), field = ctx && fieldOf(ctx,id), value = ctx?.values[id];
    if (multiple(field)) return Array.isArray(value) && chooseMany(prefix,id,value.map(itemKey));
    return value ? choose(prefix, id, itemKey(value)) : false;
  }
  function clear(prefix, id) {
    const ctx = contexts.get(prefix), field = ctx && fieldOf(ctx,id);
    return ctx && write(ctx,id,multiple(field) ? [] : '');
  }
  function removeStore(prefix,id,key) {
    const ctx = contexts.get(prefix), field = ctx && fieldOf(ctx,id);
    if (!field || !multiple(field) || !Array.isArray(ctx.values[id])) return false;
    return write(ctx,id,storeItems(ctx.values[id]).filter(item => itemKey(item) !== key));
  }
  function filter(prefix, id, text) {
    const ctx = contexts.get(prefix), field = ctx && fieldOf(ctx, id); if (!field || !interactive(ctx)) return;
    const q = currentQuery(ctx, field); if (q.status !== 'complete') return;
    q.filter = String(text);
    if (dropdown?.ctx === ctx && dropdown.id === id) { dropdown.text = String(text); dropdown.input.value = String(text); refreshDropdown(); }
  }
  function originalControl(prefix, call, values) {
    const fields = fieldsOf(call, values);
    if (!fields.length) return '';
    const series = fields.some(field => fieldKind(field) === 'series'), store = fields.some(field => fieldKind(field) === 'store');
    const hint = series && !store ? '按导入车系编码查询，匹配并确认后带入本次意向车系；原导入信息和计划到店门店保留。' :
      store && !series ? '按导入门店编码查询，匹配并确认后带入本次意向门店；原导入信息与计划到店门店保留。' :
      '按导入编码查询，匹配后带入本次意向车系及门店；原导入信息与计划到店门店保留。';
    return '<div class="business-interface-original"><button type="button" class="btn btn-sm" data-followup-import-action onclick="' + esc('BusinessInterfaceField.bringOriginal(' + JSON.stringify(prefix) + ')') + '">核对导入信息并确认带入</button><p class="table-sub">' + esc(hint) + '</p></div>';
  }
  async function bringOriginal(prefix) {
    const ctx = contexts.get(prefix); if (!interactive(ctx) || ctx.bringing) return;
    let outcome='';
    const report=message=>{outcome=message;root.CustomerFollowup?.setImportStatus?.(prefix,ctx.call,false,message,ctx.owner);return notify(message);};
    const fields = fieldsOf(ctx.call, ctx.values), store = fields.find(field => fieldKind(field) === 'store');
    const series = fields.find(field => fieldKind(field) === 'series' && (!store || !usesConditions(store) || dependenciesOf(store).includes(field.id)));
    const independentStore=store && (!usesConditions(store) || bindingOf(store).required!==true);
    if ((!series || !ctx.call.intentionSeriesCode) && !(independentStore && ctx.call.intentionStoreCode)) return report('原导入信息未提供可核对的编码，请手动查询确认');
    const action = { owner: ctx.owner, revision: ctx.draftRevision };
    ctx.bringing = action;
    root.CustomerFollowup?.setImportStatus?.(prefix,ctx.call,true,'正在核对接口数据，请稍候；导入原值不会被修改。',ctx.owner);
    const current = () => ctx.bringing === action && ctx.draftRevision === action.revision && ctx.owner === action.owner && interactive(ctx);
    const origin = { kind: 'import', ctx, action };
    try {
      let seriesIssue = '';
      if(series && ctx.call.intentionSeriesCode) {
        const result = await query(prefix, series.id, current);
        if (!current()) return;
        const item = result.ok && result.items.find(row => row.code === ctx.call.intentionSeriesCode);
        if (!result.ok) seriesIssue = result.message;
        else if (!item) seriesIssue = '未匹配到原意向车系，请手动查询确认；原信息保留';
        else if (!choose(prefix, series.id, JSON.stringify([item.type || '', item.code]), origin)) return;
        if (seriesIssue && !independentStore) return report(seriesIssue);
      }
      if (store && ctx.call.intentionStoreCode) {
        const stores = await query(prefix, store.id, current);
        if (!current()) return;
        if (!stores.ok) return report(stores.message);
        const matched = stores.items.find(row => row.code === ctx.call.intentionStoreCode);
        if (!matched) return report('原意向门店不在当前查询完整结果中，请重新选择；原信息保留');
        if (!choose(prefix, store.id, JSON.stringify([matched.type || '', matched.code]), origin)) return;
      }
      if (!current()) return;
      outcome=(seriesIssue ? seriesIssue+'；有效门店已单独核对带入，' : '匹配信息已确认带入本次填写，')+'请检查本次填写，保存后生效。';
      root.CustomerFollowup?.setImportStatus?.(prefix,ctx.call,false,outcome,ctx.owner);
      root.CustomerFollowup?.revealField?.(prefix,ctx.call,ctx.owner);
      root.showToast?.(outcome,seriesIssue?'warning':'success');
    } finally {
      if(ctx.bringing===action) {ctx.bringing=null;root.CustomerFollowup?.setImportStatus?.(prefix,ctx.call,false,outcome || '核对未完成或当前条件已变化，已填内容保留，请重试。',ctx.owner);}
    }
  }
  function cancelBringFromInput(event) {
    for (const ctx of contexts.values()) {
      if (!ctx.bringing || !active(ctx)) continue;
      const owner = ctx.owner.closest?.('.platform-layer') || ctx.owner.closest?.('.seat-record-form') || ctx.owner;
      if (owner.contains?.(event.target)) cancelBring(ctx);
    }
  }
  root.document?.addEventListener?.('input', cancelBringFromInput, true);
  root.document?.addEventListener?.('change', cancelBringFromInput, true);
  root.addEventListener?.('business-data-change', () => { for (const ctx of contexts.values()) if (active(ctx)) { syncSources(ctx); redraw(ctx); } });
  root.document?.addEventListener?.('pointerdown', event => { if (dropdown && !dropdown.node.contains(event.target) && !fieldNode(dropdown.ctx, dropdown.id)?.contains(event.target)) closeDropdown(false); }, true);
  root.document?.addEventListener?.('scroll', () => { if (dropdown) positionDropdown(); }, true);
  root.addEventListener?.('resize', positionDropdown);
  root.BusinessInterfaceField = { register, updated, control, validate, query, choose, chooseMany, confirm, clear, removeStore, filter, open, triggerKey, closeDropdown, originalControl, bringOriginal, conditions, focusDependency };
})(window);
