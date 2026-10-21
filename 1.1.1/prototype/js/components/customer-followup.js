/** Local customer business information, indexed by the full call/customer identity. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, key = 'customer-followup-v111-current', storageVersion=1;
  let editor = null;
  const formContexts = new Map();
  let formContextToken = 0;
  const recoveryDraftKey = '__callFormRecovery';
  const context = () => { const s = AppState.get(); return [s.accountId, s.enterpriseId, s.tenantId, s.activeDomain].join(':'); };
  const nonempty = value => Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value).trim() !== '';
  const typeOf = (call, values = {}) => String(call?.businessType || values.businessType || '');
  const unavailableOriginalType = '该业务类型的表单暂不可用，请保留当前内容并联系管理员';
  const definitions = (call, values = {}) => CustomerBusiness.fields(typeOf(call, values), call || {});
  function bindCallForm(call) {
    if(!call || typeof call!=='object')return {ok:false,message:'无法确认本次通话身份'};
    const captured=CustomerBusiness.captureCallForm(call);
    if(!captured.ok)return {ok:false,message:captured.message || '本次业务表单暂时无法绑定，请保留当前通话并核对'};
    call.businessFormVersion=structuredClone(captured.version);return {ok:true};
  }
  function currentVersionIssue(call) {
    const bound=CustomerBusiness.callForm(call || {});
    if(bound.present&&!bound.ok)return bound.message;
    return call?.callSource==='NATIVE_WORKBENCH' && call.processingStatus==='待填写' && !bound.present ? '本通填写表单未能恢复，已填内容已保留。请打开客户与记录，重新载入表单并核对后保存' : '';
  }
  function activeFormType(call,values) {if(call?.businessFormVersion)call.businessFormType=typeOf(call,values);}
  function recoveryPending(values,call) {
    const stored=values?.[recoveryDraftKey];
    const pending=stored?.identity===identity(call) ? stored.kind==='missing-form' ? Object.values(stored.types || {}).flatMap(row=>row.pending || []) : stored.types?.[typeOf(call,values)]?.pending : null;
    return Array.isArray(pending) ? pending.filter(item=>nonempty(values?.[item.fieldId])) : [];
  }
  function clearRecoveryMarker(next,previous,call,field) {
    const marker=previous[recoveryDraftKey],types={...marker?.types};
    for(const type of marker?.kind==='missing-form'?Object.keys(types):[typeOf(call,previous)]) {
      const pending=(types[type]?.pending || []).filter(item=>item.fieldId!==field && nonempty(next[item.fieldId]));
      if(pending.length)types[type]={pending};else delete types[type];
    }
    if(Object.keys(types).length)next[recoveryDraftKey]={...marker,identity:identity(call),types};else delete next[recoveryDraftKey];
  }
  function missingRecoveryDraft(values,previous,updated) {
    const fields=definitions(updated,values),metadata=new Set(['businessType','updatedAt','updatedBy','businessFieldSnapshot']);
    const display=value=>{
      const named=item=>item && !Array.isArray(item) && typeof item.name==='string' && typeof item.code==='string';
      if(named(value))return value.name+' · '+value.code;
      if(Array.isArray(value) && value.every(named))return value.map(item=>item.name+' · '+item.code).join('、');
      return typeof value==='object'?JSON.stringify(value):String(value);
    };
    const pending=Object.entries(values || {}).filter(([id,value])=>!metadata.has(id) && !id.startsWith('__') && nonempty(value)).map(([id,value])=>({
      fieldId:id,label:fields.find(field=>field.id===id)?.label || id+'（原字段）',
      display:display(value),reason:'原表单未能恢复，请清空原值后按载入的表单重新填写'
    }));
    const next=structuredClone(values);
    if(pending.length)next[recoveryDraftKey]={identity:identity(previous),kind:'missing-form',types:{[typeOf(previous,values)]:{pending}}};
    else delete next[recoveryDraftKey];
    return next;
  }
  function isUnansweredOutbound(call) {
    return !!call && !!call.endedAt && call.endedAt !== '—' && call.direction === '呼出' &&
      ['人工外呼', '预外呼'].includes(call.callType) && window.CallState?.view(call).answered === false;
  }
  const optionId = option => typeof option === 'object' && option !== null ? String(option.id ?? '') : String(option);
  const optionLabel = option => typeof option === 'object' && option !== null ? String(option.label ?? '') : String(option);
  const optionText = (_field, option) => optionLabel(option);
  const selectedLabel = (field, value) => {
    const option = field.options.find(item => optionId(item) === String(value));
    return option ? optionLabel(option)+(option.businessKey?' · '+option.businessKey:'') : String(value);
  };
  const interfaceItems = (field,value) => {
    const mode=field.selectionMode || CustomerBusiness.selectionMode(field);
    return mode==='multiple' ? (Array.isArray(value)?value:[]) : value && typeof value==='object' && !Array.isArray(value) ? [value] : [];
  };
  function interfaceText(field,value) {
    if(!nonempty(value))return '未填写';
    const mode=field.selectionMode || CustomerBusiness.selectionMode(field);
    if(mode==='multiple'?!Array.isArray(value):!value || typeof value!=='object' || Array.isArray(value))return '资料格式异常';
    const selected=interfaceItems(field,value);
    return selected.every(item=>item && typeof item.name==='string' && typeof item.code==='string') ? selected.map(item=>item.name+' · '+item.code).join('、') || '未填写' : '资料格式异常';
  }
  function empty(call) {
    return { businessType: call?.businessType || '', ...Object.fromEntries((currentVersionIssue(call)?[]:definitions(call)).map(field => [field.id, field.type === 'multiselect' || field.type === 'interface' && CustomerBusiness.selectionMode(field) === 'multiple' ? [] : ''])), plannedStoreId: '' };
  }
  function update(values, call, field, value) {
    if(currentVersionIssue(call))return null;
    if (field === 'businessType') {
      if(values?.[recoveryDraftKey]?.kind==='missing-form' && recoveryPending(values,call).length)return null;
      if (call?.businessType || value && !CustomerBusiness.list(call).some(type => type.id === value)) return null;
      const next = { ...values, businessType: value };
      activeFormType(call,next);
      window.BusinessInterfaceField?.updated(next,call,field);
      syncFormDraft(next,call,values);
      return next;
    }
    const definition = definitions(call, values).find(item => item.id === field);
    const recovery=recoveryPending(values,call).find(item=>item.fieldId===field);
    if(recovery && nonempty(value))return null;
    if (!definition) {
      if(value!=='' || !recovery)return null;
      const next={...values,[field]:''};clearRecoveryMarker(next,values,call,field);
      window.BusinessInterfaceField?.updated(next,call,field);syncFormDraft(next,call,values);return next;
    }
    let nextValue;
    if (definition.type === 'interface') {
      if (CustomerBusiness.selectionMode(definition) === 'multiple') {
        if(value!==undefined && value!==null && value!=='' && !Array.isArray(value))return null;
        nextValue=Array.isArray(value)?structuredClone(value):[];
      } else {
        if (Array.isArray(value)) return null;
        nextValue = value && typeof value === 'object' ? structuredClone(value) : '';
      }
    } else nextValue = definition.type === 'multiselect' ? (Array.isArray(value) ? value.map(String) : []) : String(value ?? '');
    const next = { ...values, [field]: nextValue };
    if(recovery)clearRecoveryMarker(next,values,call,field);
    window.BusinessInterfaceField?.updated(next,call,field);
    syncFormDraft(next,call,values);
    return next;
  }
  function identity(call) {
    const phone = window.CustomerDirectory?.phoneOf(call);
    return phone && call.callId && call.tenantId && call.enterpriseId ? JSON.stringify([call.enterpriseId, call.tenantId, phone, call.callId]) : '';
  }
  function read() {
    const value = JSON.parse(localStorage.getItem(key) || '{"version":1,"entries":[]}');
    if (value.version !== storageVersion || !Array.isArray(value.entries)) throw Error('Invalid followup journal');
    return value;
  }
  function overlay(calls) {
    let entries; try { entries = new Map(read().entries.map(row => [row.key, row])); } catch (_) { return; }
    calls.forEach(call => { const saved = entries.get(identity(call)); if (saved) { call.customerFollowup = structuredClone(saved.values); if (!call.businessType) call.businessType = saved.values.businessType || ''; } });
  }
  function aggregateFields(values) {
    const recorded=values.businessFieldSnapshot?.fields;
    return Array.isArray(recorded) ? recorded.filter(row=>row && typeof row.fieldId==='string').map(row=>({id:row.fieldId,type:row.type,interfaceKind:row.interfaceKind,selectionMode:row.selectionMode,snapshot:row,value:row.value})) : [];
  }
  function savedDefinitions(values) {
    const recorded=values.businessFieldSnapshot?.fields;
    return Array.isArray(recorded) ? recorded.filter(row=>row && typeof row.fieldId==='string' && typeof row.type==='string').map(row=>({id:row.fieldId,label:row.fieldName || row.fieldId,type:row.type,dictionaryId:row.dictionaryId,interfaceKind:row.interfaceKind,selectionMode:row.selectionMode,snapshot:row,options:(row.selectedOptions || []).map(option=>({id:option.optionId,label:option.optionName,businessKey:option.businessOptionCode || ''}))})) : [];
  }
  const intention = field => field.type==='interface' && ['series','store'].includes(field.interfaceKind);
  function aggregateIntentValues(target, previous, fields, ordinary) {
    for (const [id,kind] of previous) if (!ordinary.has(id)) target[id] = kind === 'store' ? [] : '';
    previous.clear();
    for (const field of fields) {
      target[field.id] = field.value === undefined || field.value === null ? (field.kind==='store'?[]:'') : structuredClone(field.value);
      previous.set(field.id,field.kind);
    }
  }
  function aggregateDisplaySnapshot(target,current,related,contributions) {
    const ordinary=new Map(current.filter(field=>!intention(field)).map(field=>[field.id,field]));
    for(const [id,field]of contributions)if(nonempty(target[id]))ordinary.set(id,field);
    const snapshot=field=>structuredClone(field.snapshot);
    return {businessType:target.businessType,businessTypeLabel:target.businessTypeLabel || '',fields:[...[...ordinary.values()].map(snapshot),...related.map(snapshot)]};
  }
  function aggregate(calls) {
    const result={businessType:'lead',plannedStoreId:'',groups:[]},grouped=new Map(),leadIntents=new Map(),leadOrdinary=new Map();
    let leadRelated=[];
    [...calls].filter(call=>call.customerFollowup).sort((a,b)=>String(a.customerFollowup.updatedAt || '').localeCompare(String(b.customerFollowup.updatedAt || ''))).forEach(call=>{
      const values=call.customerFollowup,type=typeOf(call,values);if(!type)return;
      const current=savedDefinitions(values),recorded=aggregateFields(values);if(!Array.isArray(values.businessFieldSnapshot?.fields))return;
      const key=JSON.stringify([call.enterpriseId,call.tenantId,type,call.externalDocumentId || '']);
      let state=grouped.get(key);if(!state){state={group:{enterpriseId:call.enterpriseId,tenantId:call.tenantId,businessType:type,externalDocumentId:call.externalDocumentId || '',values:{businessType:type,plannedStoreId:''}},intents:new Map(),ordinary:new Map(),related:[]};grouped.set(key,state);}
      const group=state.group,label=values.businessFieldSnapshot.businessTypeLabel || type;
      group.businessTypeLabel=label;group.values.businessTypeLabel=label;if(type==='lead')result.businessTypeLabel=label;
      const ordinary=new Set(recorded.filter(field=>!intention(field)).map(field=>field.id));
      const related=recorded.filter(intention).map(field=>({...field,kind:field.interfaceKind}));
      for(const field of current)if(nonempty(field.snapshot.value)){
        group.values[field.id]=structuredClone(field.snapshot.value);if(type==='lead')result[field.id]=structuredClone(field.snapshot.value);
        if(!intention(field)){state.ordinary.set(field.id,field);if(type==='lead')leadOrdinary.set(field.id,field);}
        else {state.ordinary.delete(field.id);if(type==='lead')leadOrdinary.delete(field.id);}
      }
      if(related.length){aggregateIntentValues(group.values,state.intents,related,ordinary);state.related=related;if(type==='lead'){aggregateIntentValues(result,leadIntents,related,ordinary);leadRelated=related;}}
      else for(const id of ordinary){state.intents.delete(id);if(type==='lead')leadIntents.delete(id);}
      group.values.businessFieldSnapshot=aggregateDisplaySnapshot(group.values,current,state.related,state.ordinary);
      if(type==='lead')result.businessFieldSnapshot=aggregateDisplaySnapshot(result,current,leadRelated,leadOrdinary);
      group.values.updatedAt=values.updatedAt;result.updatedAt=values.updatedAt;
    });
    result.groups=[...grouped.values()].map(state=>state.group);return result;
  }
  function stores(call) {
    const tenant = CloudCallData.tenants.find(t => t.tenantId === call?.tenantId && t.enterpriseId === call?.enterpriseId);
    return CloudCallData.tenants.filter(t => !t.builtIn && t.enterpriseId === call?.enterpriseId && t.organizationScope === 'STORE' && t.status === '启用' && (tenant?.organizationScope === 'HEADQUARTERS' || t.tenantId === tenant?.tenantId));
  }
  function canEdit(call, wrapping = false) {
    if (!call || !identity(call) || AppState.isReady?.()!==true || AppState.effectiveAccess?.().valid!==true || AppState.get().activeDomain !== 'CLOUD_CONTACT_CENTER' || !AppState.authorizeObject('', call) || !(call.endedAt && call.endedAt !== '—')) return false;
    if (call.callSource === 'NATIVE_WORKBENCH' && call.processingStatus === '待填写') return wrapping && call.accountId === AppState.get().accountId;
    const customer = CustomerDirectory.list().find(row => row.tenantId === call.tenantId && row.enterpriseId === call.enterpriseId && row.phone === CustomerDirectory.phoneOf(call));
    return !!customer?.calls.some(row => identity(row) === identity(call));
  }
  function validate(values, call, previous = {}) {
    const type = typeOf(call, values), result = { businessType:type, plannedStoreId:'' };
    const optionalBusinessFields = isUnansweredOutbound(call);
    const versionIssue=currentVersionIssue(call);
    if(versionIssue)return {ok:false,field:'businessType',message:versionIssue};
    if(values?.[recoveryDraftKey]?.kind==='missing-form' && recoveryPending(values,call).length)return {ok:false,field:recoveryPending(values,call)[0].fieldId,message:'原填写仍待核对，请先逐项清空原值，再按载入的表单填写。'};
    activeFormType(call,values);
    if (!type) return { ok:true, values:result };
    if (!CustomerBusiness.get(type, call)) return { ok:false, field:'businessType', message:call?.businessType ? unavailableOriginalType : '业务分类已不可用，请重新选择' };
    const recovery=recoveryPending(values,call);
    if(recovery.length)return {ok:false,field:recovery[0].fieldId,message:'修复后的配置中有字段含义发生变化，原填写已保留；请先清空提示的原值，再按新配置填写。'};
    const configurationIssue = currentVersionIssue(call) || CustomerBusiness.configurationIssue?.(type,call) || '';
    if (configurationIssue && (!optionalBusinessFields || definitions(call,values).some(field => field.type === 'interface' && nonempty(values?.[field.id])))) return {ok:false,field:'businessType',message:'业务分类配置需修复：' + configurationIssue + '。请联系管理员，当前填写已保留'};
    for (const field of definitions(call, values)) {
      const raw = values?.[field.id];
      if (field.type === 'interface') {
        if (field.required && !optionalBusinessFields && !nonempty(raw)) return {ok:false,field:field.id,message:'请填写' + field.label};
        if(CustomerBusiness.selectionMode(field)==='multiple' && nonempty(raw) && !Array.isArray(raw))return {ok:false,field:field.id,message:'请重新选择'+field.label+'，多选值须为数组'};
        const checked = window.BusinessInterfaceField?.validate(field,raw,values,call) || {ok:false,field:field.id,message:'接口字段暂不可用，请保留当前填写并重试'};
        if (!checked.ok) return checked;
        result[field.id] = checked.value; continue;
      }
      const value = field.type === 'multiselect' ? (Array.isArray(raw) ? [...new Set(raw.map(String))] : []) : String(raw ?? '').trim();
      if (field.required && !optionalBusinessFields && !nonempty(value)) return {ok:false,field:field.id,message:'请填写' + field.label};
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
    if (!checked.ok)return checked;
    if (window.BusinessData?.env?.saveFail) return {ok:false,message:'模拟保存失败，当前填写已保留，请重试'};
    const snapshot = { ...checked.values, updatedAt: new Date().toISOString(), updatedBy: AppState.get().accountId };
    if(window.CustomerBusiness?.callbackSnapshot)snapshot.businessFieldSnapshot=CustomerBusiness.callbackSnapshot(snapshot,call);
    const next = { key: id, values: snapshot };
    journal.entries = journal.entries.filter(row => row.key !== id).concat(next);
    try { localStorage.setItem(key, JSON.stringify(journal)); } catch (_) { return { ok: false, message: '业务信息未能保存，请保留当前填写内容并重试' }; }
    call.customerFollowup = structuredClone(snapshot);
    if (!call.businessType) call.businessType = snapshot.businessType;
    const live = CloudCallData.calls.find(row => identity(row) === id);
    if (live) { live.customerFollowup = structuredClone(snapshot); if (!live.businessType) live.businessType = snapshot.businessType; }
    return { ok: true, values: snapshot };
  }
  function fieldControl(field, value, prefix, handler, optionalBusinessFields = false, call, values) {
    if (field.type === 'interface') return window.BusinessInterfaceField?.control(field,value,prefix,handler,call,values) || '<p class="customer-followup-hint">接口字段暂不可用</p>';
    const id = prefix + '-' + field.id, invoke = handler + '(' + JSON.stringify(field.id) + ',this.value)', required = field.required ? ' data-followup-required-field' + (optionalBusinessFields ? '' : ' aria-required="true"') : '';
    const start = ' id="' + esc(id) + '"' + required;
    if (field.type === 'textarea') return '<textarea' + start + ' rows="3" maxlength="2000" oninput="' + esc(invoke) + '">' + esc(value || '') + '</textarea>';
    if (field.type === 'multiselect') {
      const selected = Array.isArray(value) ? value : [];
      const action = handler + '(' + JSON.stringify(field.id) + ',Array.from(this.closest("[data-followup-multiple]").querySelectorAll("input:checked")).map(option=>option.value))';
      return '<div' + start + ' role="group" tabindex="-1" aria-label="' + esc(field.label) + '" data-followup-multiple class="customer-followup-multiple">' + field.options.map(option => '<label><input type="checkbox" value="' + esc(optionId(option)) + '"' + (selected.includes(optionId(option)) ? ' checked' : '') + ' onchange="' + esc(action) + '">' + esc(optionLabel(option)) + '</label>').join('') + '</div>';
    }
    if (field.type === 'select') {
      return '<select' + start + ' onchange="' + esc(invoke) + '"><option value="">请选择</option>' + field.options.map(option => '<option value="' + esc(optionId(option)) + '"' + (value === optionId(option) ? ' selected' : '') + '>' + esc(optionText(field,option)) + '</option>').join('') + '</select>';
    }
    const inputType = {text:'text',number:'number',date:'date',datetime:'datetime-local'}[field.type] || 'text';
    return '<input' + start + ' type="' + inputType + '"' + (inputType === 'number' ? ' step="any"' : ' maxlength="200"') + ' value="' + esc(value ?? '') + '" oninput="' + esc(invoke) + '">';
  }
  function tabContext() {
    const state=AppState.get(),access=AppState.effectiveAccess?.() || {};
    return JSON.stringify([state.accountId,state.sessionId,state.enterpriseId,state.tenantId,state.activeDomain,access.roleCode,access.valid]);
  }
  function tabForm(prefix, expectedIdentity, source) {
    const explicit=source && (source.dataset?.followupPrefix!==undefined ? source : source.closest?.('[data-followup-tabs]'));
    const forms=source ? explicit?[explicit]:[] : [...(document.querySelectorAll?.('[data-followup-tabs]') || [])];
    return forms.find(node=>node.isConnected!==false && node.dataset?.followupPrefix===prefix &&
      node.dataset.followupContext===tabContext() && (!expectedIdentity || node.dataset.followupIdentity===expectedIdentity) &&
      !node.closest?.('[inert], [aria-hidden="true"], .drawer-exit-visual')) || null;
  }
  function showTab(prefix, view, source) {
    if(!['current','imported'].includes(view)) return false;
    const form=tabForm(prefix,'',source);if(!form) return false;
    if(form.dataset.followupTab!==view) window.BusinessInterfaceField?.closeDropdown?.(false);
    form.dataset.followupTab=view;
    form.querySelectorAll('[data-followup-panel]').forEach(panel=>{panel.hidden=panel.dataset.followupPanel!==view;});
    form.querySelectorAll('[data-followup-tab-button]').forEach(button=>{
      const selected=button.dataset.followupTabButton===view;
      button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
    });
    return true;
  }
  function tabKey(prefix,event) {
    if(event.isComposing || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    const button=event.currentTarget || event.target,form=tabForm(prefix,'',button);if(!form) return;
    const view=event.key==='Home'?'current':event.key==='End'?'imported':form.dataset.followupTab==='current'?'imported':'current';
    event.preventDefault();event.stopPropagation?.();
    if(showTab(prefix,view,button)) form.querySelector('[data-followup-tab-button="'+view+'"]')?.focus();
  }
  function revealField(prefix,call,source) {
    const form=tabForm(prefix,identity(call),source);
    return form ? showTab(prefix,'current',form) : false;
  }
  function setImportStatus(prefix,call,busy,message,source) {
    const form=tabForm(prefix,identity(call),source);if(!form) return false;
    const status=form.querySelector('[data-followup-import-status]');
    if(status) {status.textContent=message || '';status.hidden=!message;status.setAttribute('aria-busy',String(!!busy));}
    form.querySelectorAll('[data-followup-import-action]').forEach(button=>{button.disabled=!!busy;button.setAttribute('aria-busy',String(!!busy));});
    return true;
  }
  function syncFormDraft(values,call,previous) {
    for (const ctx of formContexts.values()) if (ctx.identity===identity(call) && ctx.app===tabContext() && (ctx.values===previous || ctx.sourceValues===previous)) {
      ctx.values=values;ctx.sourceValues=values;
    }
  }
  function registerFormContext(prefix,call,values,handler,sourceValues) {
    if(!identity(call)){formContexts.delete(prefix);return '';}
    const ctx={prefix,call,values,sourceValues,handler,identity:identity(call),app:tabContext(),token:String(++formContextToken),owner:null,
      missingState:window.AgentWorkbench?.missingBusinessFormContext?.(call) || '',draftBytes:JSON.stringify(sourceValues)};
    formContexts.set(prefix,ctx);return ctx.token;
  }
  function formContext(prefix,source) {
    const ctx=formContexts.get(prefix);
    if(!ctx || ctx.app!==tabContext() || ctx.identity!==identity(ctx.call)) return null;
    const form=tabForm(prefix,ctx.identity,source),state=AppState.get();
    if(!form || form.dataset.followupFormToken!==ctx.token || ctx.owner && ctx.owner!==form || state.activeDomain!=='CLOUD_CONTACT_CENTER' || AppState.effectiveAccess?.().valid!==true || !AppState.authorizeObject('',ctx.call)) return null;
    const seat=ctx.handler==='AgentWorkbench.setFollowup' && ctx.call.accountId===state.accountId && ctx.call.tenantId===state.tenantId && ctx.call.enterpriseId===state.enterpriseId;
    const archive=ctx.handler==='CustomerFollowup.updateEditor' && canEdit(ctx.call);
    if(!seat&&!archive) return null;
    ctx.owner=form;return {ctx,form};
  }
  function changedRecoveryFields(before,after,values) {
    const meaning=(field,raw)=>({type:field.type,businessKey:field.businessKey || '',
      options:['select','multiselect'].includes(field.type) ? (Array.isArray(raw)?raw:[raw]).map(value=>{const option=field.options.find(item=>optionId(item)===String(value));return [String(value),option?.label,option?.businessKey || ''];}) : [],
      ...(field.type==='interface'?{dictionaryId:field.dictionaryId,depends:field.depends,parameterBinding:field.parameterBinding,useQueryConditions:field.useQueryConditions}:{})});
    return before.filter(field=>nonempty(values[field.id])).flatMap(field=>{
      const next=after.find(row=>row.id===field.id),raw=values[field.id];
      if(next && JSON.stringify(meaning(field,raw))===JSON.stringify(meaning(next,raw)))return [];
      const display=field.type==='interface' ? interfaceItems(field,raw).map(item=>item?.name || item?.code || '').join('、') : ['select','multiselect'].includes(field.type) ? (Array.isArray(raw)?raw:[raw]).map(value=>selectedLabel(field,value)).join('、') : String(raw);
      return [{fieldId:field.id,label:field.label,display,reason:!next?'此字段已不再显示':field.type!==next.type?'填写方式已改变':'选项含义或字段映射已改变'}];
    });
  }
  function reloadRepairedCallForm(prefix,source) {
    const active=formContext(prefix,source);if(!active)return false;
    const {ctx,form:owner}=active,type=typeOf(ctx.call,ctx.values),proposed=CustomerBusiness.repairedCallForm?.(ctx.call,type);
    const report=message=>{const node=owner.querySelector('[data-followup-form-version-status]');if(node){node.textContent=message;node.hidden=false;}window.showToast?.(message,'warning');return false;};
    if(!proposed?.ok)return report(proposed?.message || '修复配置暂时无法重新载入，当前填写已保留。');
    const updated={...ctx.call,businessFormVersion:proposed.version,businessFormType:type};
    const pending=changedRecoveryFields(definitions(ctx.call,ctx.values),definitions(updated,ctx.values),ctx.values);
    const previous=ctx.sourceValues[recoveryDraftKey],previousRender=ctx.values[recoveryDraftKey],types={...(previous?.identity===ctx.identity?previous.types:{})};
    if(pending.length)types[type]={pending};else delete types[type];
    const marker=Object.keys(types).length ? {identity:ctx.identity,types} : null;
    if(marker){ctx.sourceValues[recoveryDraftKey]=marker;ctx.values[recoveryDraftKey]=marker;}else {delete ctx.sourceValues[recoveryDraftKey];delete ctx.values[recoveryDraftKey];}
    const committed=window.AgentWorkbench?.persistBusinessForm?.(updated) || {ok:false,message:'重新载入暂未就绪，请保留当前填写并重试。'};
    if(!committed.ok) {
      if(previous===undefined)delete ctx.sourceValues[recoveryDraftKey];else ctx.sourceValues[recoveryDraftKey]=previous;
      if(previousRender===undefined)delete ctx.values[recoveryDraftKey];else ctx.values[recoveryDraftKey]=previousRender;
      return report(committed.message || '修复版本未能保存，原表单和填写内容已保留。');
    }
    ctx.call.businessFormVersion=structuredClone(proposed.version);ctx.call.businessFormType=type;
    owner.outerHTML=form(ctx.sourceValues,ctx.call,prefix,ctx.handler);
    window.showToast?.(pending.length?'已载入修复配置，原填写已保留；请处理提示的变化字段。':'已载入修复配置，原填写已保留。','success');return true;
  }
  function reloadMissingCallForm(prefix,source) {
    const active=formContext(prefix,source);if(!active)return false;
    const {ctx,form:owner}=active;
    const report=message=>{window.showToast?.(message,'warning');let current=owner;if(window.AgentWorkbench?.missingBusinessFormContext?.(ctx.call)){owner.outerHTML=form(ctx.sourceValues,ctx.call,prefix,ctx.handler);current=tabForm(prefix,ctx.identity);}const node=current?.querySelector('[data-followup-form-version-status]');if(node){node.textContent=message;node.hidden=false;}return false;};
    if(ctx.handler!=='AgentWorkbench.setFollowup' || Object.hasOwn(ctx.call,'businessFormVersion') || JSON.stringify(ctx.sourceValues)!==ctx.draftBytes)return report('当前填写已变化，请重新打开客户与记录后核对，原填写已保留。');
    const proposed=window.AgentWorkbench?.missingBusinessFormProposal?.(ctx.call,ctx.missingState,ctx.missingRevision);
    if(!proposed?.ok)return report(proposed?.message || '表单暂时无法恢复，请保留填写并重试。');
    const updated={...ctx.call,businessFormVersion:proposed.version,businessFormType:typeOf(ctx.call,ctx.sourceValues)};
    const committed=window.AgentWorkbench?.recoverMissingBusinessForm?.(updated,ctx.missingState,ctx.missingRevision);
    if(!committed?.ok)return report(committed?.message || '表单未能完整暂存，原填写已保留，请重试。');
    ctx.call.businessFormVersion=structuredClone(proposed.version);ctx.call.businessFormRecovery=structuredClone(committed.recovery);
    ctx.sourceValues=committed.values;ctx.values=committed.values;
    owner.outerHTML=form(committed.values,ctx.call,prefix,ctx.handler);
    window.showToast?.('表单已载入，原填写已暂存；请逐项核对后重新填写。','success');return true;
  }
  function clearRepairedField(prefix,fieldId,source) {
    const active=formContext(prefix,source);if(!active)return false;
    const {ctx,form:owner}=active;
    if(!recoveryPending(ctx.values,ctx.call).some(item=>item.fieldId===fieldId))return false;
    const parts=ctx.handler.split('.'),handler=window[parts[0]]?.[parts[1]],previous=ctx.values;
    if(parts.length!==2 || typeof handler!=='function')return false;
    handler.call(window[parts[0]],fieldId,'');
    if(ctx.values===previous || nonempty(ctx.values[fieldId]) || formContexts.get(prefix)!==ctx || tabForm(prefix,ctx.identity,owner)!==owner)return false;
    owner.outerHTML=form(ctx.sourceValues,ctx.call,prefix,ctx.handler);return true;
  }
  function form(values, call, prefix, handler) {
    activeFormType(call,values);
    const versionIssue=currentVersionIssue(call);
    const current = { ...empty(call), ...values }, type = typeOf(call, current), meta = CustomerBusiness.get(type,call), fields = versionIssue?[]:definitions(call,current);
    const configurationIssue = versionIssue || (type ? CustomerBusiness.configurationIssue(type,call) || '' : '');
    const recovery=recoveryPending(current,call),held=new Set(recovery.map(item=>item.fieldId));
    const compatibilityOnly=!versionIssue && CustomerBusiness.bindingConfigurationStatus?.(type,call)?.compatibilityOnly===true;
    const visibleFields = (configurationIssue && !compatibilityOnly ? fields.filter(field => field.type !== 'interface') : fields).filter(field=>!held.has(field.id));
    window.BusinessInterfaceField?.register(prefix,call,current,handler);
    const formToken=registerFormContext(prefix,call,current,handler,values);
    const originalTypeUnavailable = !!call?.businessType && !meta;
    const optionalBusinessFields = isUnansweredOutbound(call);
    const selector = call?.businessType ? '<p class="customer-followup-type">业务类型：<strong>' + esc(meta?.label || call?.businessTypeLabel || type) + '</strong></p>' : '<label class="field customer-followup-type"><span>业务类型</span><select id="' + esc(prefix+'-businessType') + '"'+(versionIssue || current[recoveryDraftKey]?.kind==='missing-form'&&recovery.length?' disabled':'')+' onchange="' + esc(handler + "('businessType',this.value)") + '"><option value="">请选择业务类型</option>' + CustomerBusiness.list(call).map(item => '<option value="' + esc(item.id) + '"' + (item.id === type ? ' selected' : '') + '>' + esc(item.label) + '</option>').join('') + '</select></label>';
    const fieldsHtml = visibleFields.map(field => '<div class="field"><label for="' + esc(prefix+'-'+field.id) + '">' + (field.required ? '<em data-followup-required-marker' + (optionalBusinessFields ? ' hidden' : '') + '>*</em> ' : '') + esc(field.label) + (field.required ? ' <small data-followup-optional-marker' + (optionalBusinessFields ? '' : ' hidden') + '>（选填）</small>' : ' <small>（选填）</small>') + '</label>' + fieldControl(field,current[field.id],prefix,handler,optionalBusinessFields,call,current) + '</div>').join('');
    const bound=CustomerBusiness.callForm?.(call || {}),repairable=CustomerBusiness.callFormRepairable?.(call,type)===true;
    const versionNote=bound?.ok && bound.present ? '<p class="customer-followup-hint">'+(call.businessFormRecovery?.versionId===bound.version.id?'本次表单已由您明确重新载入，原填写已暂存供核对；后续配置更新从下一通生效。':'本次填写沿用本通话开始时的表单，配置更新从后续通话生效。')+'</p>' : '';
    const reload=repairable ? '<button type="button" class="btn btn-sm" data-followup-reload-repaired onclick="'+esc('CustomerFollowup.reloadRepairedCallForm('+JSON.stringify(prefix)+',this)')+'">重新载入已修复配置</button><p class="table-sub">请先由管理员修复本分类，再点击重新载入；全部填写会保留，变化字段需您重新填写。</p>' : '';
    const missing=!bound?.present && versionIssue && handler==='AgentWorkbench.setFollowup' ? window.AgentWorkbench?.missingBusinessFormAvailability?.(call) : null;
    if(missing?.ok)formContexts.get(prefix).missingRevision=missing.revision;
    const missingAction=missing?.ok ? '<p>'+(missing.origin==='saved'?'将重新载入本通已暂存的原表单。':'将采用当前业务分类配置重新载入表单。')+'原填写、沟通备注及处理结果会保留。载入后请逐项清空原业务值，再重新填写；接口字段需重新查询选择。</p><button type="button" class="btn btn-sm" data-followup-reload-missing onclick="'+esc('CustomerFollowup.reloadMissingCallForm('+JSON.stringify(prefix)+',this)')+'">重新载入表单并核对</button>' : missing?.message?'<p>'+esc(missing.message)+'</p>':'';
    const warning = configurationIssue ? '<div class="customer-followup-hint" role="status"'+(versionIssue?' data-followup-version-error':'')+'>'+(versionIssue&&!bound?.present?'本通填写表单未能恢复，已填内容已保留。':'业务分类配置需修复：'+esc(configurationIssue)+'。请联系管理员，当前填写已保留。')+reload+missingAction+'<p data-followup-form-version-status role="status" hidden></p></div>' : '';
    const recoveryNotice=recovery.length ? '<div class="customer-followup-hint" role="status"><p>'+(current[recoveryDraftKey]?.kind==='missing-form'?'原填写已暂存。以下内容需要核对，请清空原值后按当前表单重新填写。':'已保留修复前的填写。以下字段已变化，请清空原值后按新配置重新填写。')+'</p>'+recovery.map(item=>'<p>'+esc(item.label+'：'+item.display+'（'+item.reason+'）')+' <button type="button" class="btn btn-sm" data-followup-recovery-clear="'+esc(item.fieldId)+'" onclick="'+esc('CustomerFollowup.clearRepairedField('+JSON.stringify(prefix)+','+JSON.stringify(item.fieldId)+',this)')+'">清空后重新填写</button></p>').join('')+'</div>' : '';
    const fieldBody = warning + recoveryNotice + '<p data-followup-form-version-status class="customer-followup-hint" role="status" hidden></p>' + (visibleFields.length ? '<div class="customer-followup-grid">' + fieldsHtml + '</div>' : configurationIssue || recovery.length ? '' : '<p class="customer-followup-hint">此业务分类暂未配置补充字段。</p>');
    const prior=tabForm(prefix,identity(call)), selected=prior?.dataset.followupTab==='imported'?'imported':'current';
    const tab=(view,label)=>'<button type="button" id="'+esc(prefix+'-tab-'+view)+'" role="tab" aria-selected="'+(selected===view)+'" aria-controls="'+esc(prefix+'-panel-'+view)+'" tabindex="'+(selected===view?'0':'-1')+'" data-followup-tab-button="'+view+'" onclick="'+esc('CustomerFollowup.showTab('+JSON.stringify(prefix)+','+JSON.stringify(view)+',this)')+'" onkeydown="'+esc('CustomerFollowup.tabKey('+JSON.stringify(prefix)+',event)')+'">'+label+'</button>';
    const currentBody=versionNote+selector+(versionIssue?warning:originalTypeUnavailable?'<p class="customer-followup-hint" role="status">'+unavailableOriginalType+'</p>':type?fieldBody:'<p class="customer-followup-hint">选择本次业务类型后，填写对应的客户信息。</p>');
    const importedBody='<p class="customer-followup-hint">这里保留导入时的原始信息，仅供核对。匹配并确认带入后会回到“本次填写”，请检查后再保存。</p><div class="customer-followup-source"><h4>导入时的客户信息</h4>'+CustomerBusiness.importedDetail(call || {})+(!configurationIssue && window.BusinessInterfaceField?.originalControl(prefix,call,current) || '')+'</div><p id="'+esc(prefix+'-import-status')+'" class="customer-followup-import-status" data-followup-import-status role="status" aria-live="polite" hidden></p>';
    return '<section class="customer-followup-form" data-followup-tabs data-followup-prefix="'+esc(prefix)+'" data-followup-identity="'+esc(identity(call))+'" data-followup-context="'+esc(tabContext())+'"'+(formToken?' data-followup-form-token="'+formToken+'"':'')+' data-followup-tab="'+selected+'"><div class="customer-followup-heading"><h3>客户业务信息</h3><span data-followup-requirement>'+(originalTypeUnavailable?'表单暂不可用':configurationIssue?'配置待修复':requirementHint(call,fields))+'</span></div><div class="customer-followup-tabs" role="tablist" aria-label="客户业务信息查看方式">'+tab('current','本次填写')+tab('imported','导入信息')+'</div><div id="'+esc(prefix+'-panel-current')+'" role="tabpanel" aria-labelledby="'+esc(prefix+'-tab-current')+'" data-followup-panel="current"'+(selected==='current'?'':' hidden')+'>'+currentBody+'</div><div id="'+esc(prefix+'-panel-imported')+'" role="tabpanel" aria-labelledby="'+esc(prefix+'-tab-imported')+'" data-followup-panel="imported"'+(selected==='imported'?'':' hidden')+'>'+importedBody+'</div></section>';
  }
  function requirementHint(call, fields) {
    return isUnansweredOutbound(call) ? '本次未接通，业务信息可稍后补充' : fields.some(field => field.required) ? '标 * 的字段保存时必填' : '全部选填';
  }
  function syncRequirements(host, call, values = {}) {
    if (!host) return;
    const optionalBusinessFields = isUnansweredOutbound(call);
    // Change only hints and attributes; keep draft input nodes and composition intact.
    host.querySelectorAll('[data-followup-required-field]').forEach(node => {
      if (optionalBusinessFields) node.removeAttribute('aria-required'); else node.setAttribute('aria-required','true');
    });
    host.querySelectorAll('[data-followup-required-marker]').forEach(node => { node.hidden = optionalBusinessFields; });
    host.querySelectorAll('[data-followup-optional-marker]').forEach(node => { node.hidden = !optionalBusinessFields; });
    const hint = host.querySelector('[data-followup-requirement]');
    if (hint) hint.textContent = currentVersionIssue(call)?'表单版本待核对':CustomerBusiness.configurationIssue(typeOf(call,values),call) ? '配置待修复' : requirementHint(call,definitions(call,values));
  }
  function detail(values, source = {}) {
    if (Array.isArray(values?.groups)) return values.groups.length ? values.groups.map(group => '<section class="customer-business-group"><h4>' + esc(group.businessTypeLabel || group.values?.businessFieldSnapshot?.businessTypeLabel || group.businessType) + (group.externalDocumentId ? ' · ' + esc(CustomerBusiness.codeLabel(group)) + '：' + esc(group.externalDocumentId) : '') + '</h4>' + detail(group.values,group) + '</section>').join('') : '<p class="table-sub">暂无已填写的业务信息</p>';
    const recorded = values?.businessFieldSnapshot?.fields;
    const fields = Array.isArray(recorded) ? recorded.filter(row => row && typeof row.fieldId === 'string' && typeof row.fieldName === 'string').map(row => ({ id: row.fieldId, label: row.fieldName, type: row.type, dictionaryId:row.dictionaryId,interfaceKind:row.interfaceKind,selectionMode:row.selectionMode, options: (row.selectedOptions || []).map(option => ({ id: option.optionId, label: option.optionName, businessKey:option.businessOptionCode })) })) : [];
    const imported = source.callId ? CustomerBusiness.importedDetail(source) : ''; // Customer summaries combine calls; imported fields belong only to an exact call.
    if (!fields.length) return imported + '<p class="table-sub">暂无已填写的业务信息</p>';
    return imported + '<dl class="customer-followup-details">' + fields.map(field => {
      const raw = values?.[field.id], value = field.type === 'interface' ? interfaceText(field,raw) : Array.isArray(raw) ? raw.map(item => selectedLabel(field,item)).join('、') : field.type === 'select' ? (nonempty(raw) ? selectedLabel(field,raw) : raw) : field.type === 'datetime' ? raw?.replace('T',' ') : raw;
      return '<div><dt>' + esc(field.label) + '</dt><dd' + (!nonempty(value) ? ' class="is-empty"' : '') + '>' + esc(nonempty(value) ? value : '未填写') + '</dd></div>';
    }).join('') + '</dl>';
  }
  function openEditor(id) {
    CustomerDirectory.sync();
    const canonical = CloudCallData.calls.find(row => row.callId === id && AppState.authorizeObject('',row)),call=canonical && CustomerBusiness.liveFormSource(canonical);
    if (!canEdit(call)) return showToast('当前通话已不在可处理范围内', 'warning');
    editor = { id, identity: identity(call), context: context(), values: { ...empty(call), ...call.customerFollowup }, version: call.customerFollowup?.updatedAt || '' };
    ui.openLayer('customer-followup-editor', '<div class="layer-header"><div><h2>填写客户业务信息</h2><p>' + esc((call.customerName || '客户') + ' · ' + CustomerDirectory.phoneOf(call)) + '</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer(\'customer-followup-editor\')">×</button></div><div class="layer-body">' + form(editor.values, call, 'followup', 'CustomerFollowup.updateEditor') + '<p class="customer-followup-error" id="followup-error" role="alert"></p></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'customer-followup-editor\')">取消</button><button class="btn btn-primary" id="followup-save" onclick="CustomerFollowup.saveEditor()">保存业务信息</button></div>', 'large');
  }
  function updateEditor(field,value) {
    if (!editor || context() !== editor.context) return;
    const canonical = CloudCallData.calls.find(row => identity(row) === editor.identity),call=canonical && CustomerBusiness.liveFormSource(canonical),next = update(editor.values,call,field,value);
    if (!next) return; editor.values = next;
    const error=document.getElementById('followup-error');if(error) error.textContent='';
    if (field === 'businessType') { const box = document.querySelector('#customer-followup-editor .customer-followup-form'); if (box) box.outerHTML = form(editor.values,call,'followup','CustomerFollowup.updateEditor'); }
  }
  function saveEditor() {
    if (!editor || !document.getElementById('customer-followup-editor')) return;
    const canonical = CloudCallData.calls.find(row => identity(row) === editor.identity),call=canonical && CustomerBusiness.liveFormSource(canonical);
    const result = context() === editor.context ? save(call, editor.values, { expectedVersion: editor.version }) : { ok: false, message: '当前工作范围已改变，请返回后重新填写' };
    if (!result.ok) { document.getElementById('followup-error').textContent = result.message; if (result.field) {revealField('followup',call);document.getElementById('followup-' + result.field)?.focus();} return; }
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
  window.CustomerFollowup = { storageKey:key,storageVersion,empty, update, identity, overlay, aggregate, stores, canEdit, validate, save, form, detail, openEditor, updateEditor, saveEditor, isUnansweredOutbound, syncRequirements, showTab, tabKey, revealField, setImportStatus, bindCallForm, reloadRepairedCallForm, reloadMissingCallForm, missingRecoveryDraft, clearRepairedField };
})();
