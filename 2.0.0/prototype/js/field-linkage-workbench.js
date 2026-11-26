/* Project the shared field rules onto the existing round form. Values crossing this
 * boundary always use stable field/option IDs; historical labels remain untouched. */
(() => {
  'use strict';
  const sessions = new WeakMap();
  const own = (value,key) => Boolean(value && Object.hasOwn(value,key));
  const isText=field=>['text','textarea'].includes(field?.type);
  const filled = value => Array.isArray(value) ? value.length>0 : value!=='' && value!=null;
  const same = (first,second) => JSON.stringify(first)===JSON.stringify(second);
  const keyOf = field => window.DReview21DccFollowupFields?.fieldKey?.(field) || 'field:' + field.id;
  const signature = context => JSON.stringify([context?.account?.id,context?.scope?.id,
    context?.scope?.tenant?.brandId,context?.scope?.tenant?.enterpriseId]);
  const assignmentScope = record => ({assignmentRuleId:record?.skynet?.assignmentRuleId || '',
    assignmentRuleVersion:record?.skynet?.assignmentRuleVersion || ''});
  const roundOf = record => record?.roundId || record?.skynet?.roundId || '';
  function normalizedCallMode(value) {
    const mode=typeof value==='string'?value.replace(/\s+/g,'').toLowerCase():'';
    if (['ai','ai外呼','ai会话','ai通话'].includes(mode)) return 'AI 外呼';
    if (['manual','human','人工外呼','人工通话'].includes(mode)) return '人工外呼';
    if (['predictive','预外呼','预测外呼','预外呼通话'].includes(mode)) return '预外呼';
    return '';
  }
  function callModeOf(record,source) {
    // The current round's telephone/visit provenance wins over assignment hints.
    const explicit=record?.callMode || record?.callType;
    if (explicit) return normalizedCallMode(explicit);
    const roundId=roundOf(record);
    const visit=source && typeof source.querySelectorAll!=='function' && source.roundId===roundId ? source :
      (record?.followupHistory || []).findLast(item=>item?.roundId===roundId);
    const actual=visit?.callMode || visit?.callType;
    if (actual) return normalizedCallMode(actual);
    return normalizedCallMode(record?.requiredMode || record?.skynet?.processing?.method);
  }
  const callModeGroup = record => {
    const mode=callModeOf(record);
    return mode==='AI 外呼'?'ai':['人工外呼','预外呼'].includes(mode)?'human':'';
  };
  const formScope = (record,schema) => JSON.stringify([record?.id,record?.taskId,roundOf(record),
    record?.tenant,record?.brandId,record?.ownerId,schema?.categoryId,record?.categoryContext,record?.categoryId,
    assignmentScope(record),callModeGroup(record),schema?.fields || []]);
  const message = error => typeof error==='string' ? error : error?.message || error?.reason || '字段联动规则暂时无法核对。';
  const errorsOf = result => (result?.errors?.length ? result.errors :
    [result?.error || result?.message || '字段联动规则暂时无法核对。']).map(message);
  const isFixed = control => control?.dataset?.wbLinkageFixed==='true';
  const semantic = (field,value) => keyOf(field)==='visitResult' && value==='无人接听下发' ? '无人接下发' : value;

  function optionId(field,value) {
    if (value==null || value==='') return '';
    const text = String(value);
    const options = (field.options || []).filter(option=>option.enabled!==false);
    const exact = options.filter(option=>String(option.id)===text);
    if (exact.length===1) return exact[0].id;
    const matching = options.filter(option=>[option.businessKey,option.label].some(alias=>
      alias!=null && semantic(field,String(alias))===semantic(field,text)));
    return matching.length===1 ? matching[0].id : text;
  }

  function readForm(form) {
    const details={},options={};
    for (const control of form.querySelectorAll('[data-wb-detail]')) {
      if (control.disabled && !isFixed(control) || control.closest('[hidden]')) continue;
      const key=control.dataset.wbDetail;
      if (control.tagName==='SELECT') {
        const selected=[...control.selectedOptions].filter(option=>option.value && !option.disabled);
        options[key]=control.multiple ? selected.map(option=>option.value) : selected[0]?.value || '';
        details[key]=control.multiple ? selected.map(option=>option.textContent) : selected[0]?.textContent || '';
      } else details[key]=control.value;
    }
    const value = name => {
      const control=form.elements?.[name] || form.querySelector('[name="'+name+'"]');
      return !control || control.disabled && !isFixed(control) || control.closest('[hidden]') ? '' : control.value;
    };
    return {details,options,result:value('result'),note:value('note'),nextAt:value('nextAt')};
  }

  function values(fields,source={}) {
    if (typeof source?.querySelectorAll==='function') source=readForm(source);
    const options=source.options || source.optionValues || source.visitOptionValues || {};
    const details=source.details || source.visitDetails || {};
    const result={};
    for (const field of fields || []) {
      const key=keyOf(field);
      let value;
      if (own(source,field.id)) value=source[field.id];
      else if (isText(field) && key==='visitDesc' && typeof (source.note ?? source.followupNote)==='string' &&
          (source.note ?? source.followupNote).trim()) value=source.note ?? source.followupNote;
      else if (!isText(field) && own(options,key)) value=options[key];
      else if (own(details,key)) value=details[key];
      else if (key==='visitResult') value=source.result ?? source.followupResult;
      else if (key==='visitDesc') value=source.note ?? source.followupNote;
      else if (key==='nextVisitTime') value=source.nextAt;
      else if (own(source,key)) value=source[key];
      if (field.type==='multiselect') {
        const items=Array.isArray(value) ? value : filled(value) ? [value] : [];
        result[field.id]=items.map(item=>optionId(field,item));
      } else if (field.type==='select') result[field.id]=optionId(field,value);
      else result[field.id]=value ?? '';
    }
    return result;
  }

  function inputFor(record,schema,source,context,snapshot) {
    return {context,categoryId:schema.categoryId || record.categoryContext || record.categoryId ||
      window.DReview21DccFollowupFields?.categoryId?.(record.category) || '',
      ...assignmentScope(record),callMode:callModeOf(record,source),fields:schema.fields || [],values:values(schema.fields,source),...(snapshot ? {snapshot} : {})};
  }
  function validate(record,schema,source,context=window.DSession?.context?.(),snapshot) {
    try {
      if (!window.DFieldLinkageRules?.validate) return {ok:false,errors:['字段联动模块尚未就绪，请刷新后重试。']};
      return window.DFieldLinkageRules.validate(inputFor(record,schema,source,context,snapshot));
    } catch (_) { return {ok:false,errors:['字段联动规则暂时无法核对，请保留填写内容后重试。']}; }
  }
  function controlFor(form,field) {
    const key=keyOf(field),names={visitResult:'result',visitDesc:'note',nextVisitTime:'nextAt'};
    return [...form.querySelectorAll('[data-wb-detail]')].find(control=>control.dataset.wbDetail===key) ||
      (names[key] ? form.elements?.[names[key]] || form.querySelector('[name="'+names[key]+'"]') : null);
  }
  function currentContext(session) {
    const context=typeof session.context==='function' ? session.context() : session.context;
    return !session.stale && signature(context)===session.identity && session.form.dataset.record===session.record.id &&
      roundOf(session.record)===session.form.dataset.round && formScope(session.record,session.schema)===session.sourceIdentity ? context : null;
  }
  function evaluate(session,candidate) {
    const context=currentContext(session);
    if (!context) return {ok:false,errors:['当前任务、轮次、分配规则或填写字段已变化，请重新打开表单。']};
    try {
      if (!window.DFieldLinkageRules?.evaluate) return {ok:false,errors:['字段联动模块尚未就绪，请刷新后重试。']};
      const input=inputFor(session.record,session.schema,session.form,context);
      if (candidate) input.values=candidate;
      return window.DFieldLinkageRules.evaluate(input);
    } catch (_) { return {ok:false,errors:['字段联动规则暂时无法核对，请保留填写内容后重试。']}; }
  }
  function ensureHint(session,field,control) {
    let hint=session.hints.get(field.id);
    if (!hint) {
      hint=control.ownerDocument.createElement('small');
      hint.className='field-hint wb-field-linkage-hint';
      hint.dataset.wbFieldLinkageHint=field.id;
      (control.closest('label') || control.parentElement || session.form).append(hint);
      session.hints.set(field.id,hint);
    }
    return hint;
  }
  function baseFor(session,control) {
    let base=session.bases.get(control);
    if (!base) {
      base={required:control.required,disabled:control.disabled,readOnly:control.readOnly,
        options:new Map([...(control.options || [])].map(option=>[option,{disabled:option.disabled,hidden:option.hidden}]))};
      session.bases.set(control,base);
    }
    return base;
  }
  function writeValue(field,control,value) {
    const before=control.tagName==='SELECT' && control.multiple ? [...control.selectedOptions].map(option=>option.value) : control.value;
    if (control.tagName==='SELECT') {
      const chosen=Array.isArray(value) ? value : filled(value) ? [value] : [];
      for (const option of control.options) option.selected=Boolean(option.value && chosen.includes(optionId(field,option.value)));
      if (!control.multiple && ![...control.selectedOptions].some(option=>option.value)) control.value='';
    } else control.value=value ?? '';
    const after=control.tagName==='SELECT' && control.multiple ? [...control.selectedOptions].map(option=>option.value) : control.value;
    return !same(before,after);
  }
  function applyConstraint(session,field,control,constraint) {
    const active=Boolean(constraint?.ruleIds?.length || constraint?.ruleNames?.length);
    // Only capture fields this module actually controls. Unrelated controls may
    // have their own dynamic required/disabled rules owned by the workbench.
    if (!active && !session.bases.has(control)) return;
    const base=baseFor(session,control);
    const allowed=Array.isArray(constraint?.allowedValues) ? constraint.allowedValues : null;
    for (const option of control.options || []) {
      const old=base.options.get(option) || {disabled:option.disabled,hidden:option.hidden};
      const outside=active && option.value && allowed && !allowed.includes(optionId(field,option.value));
      option.disabled=Boolean(old.disabled || outside);option.hidden=Boolean(old.hidden || outside);
    }
    const fixed=active && constraint.fixedValue!=null;
    control.required=active ? Boolean(constraint.required) : Boolean(base.required);
    control.disabled=Boolean(base.disabled || fixed);
    if (fixed) control.dataset.wbLinkageFixed='true';
    else delete control.dataset.wbLinkageFixed;
    const hint=ensureHint(session,field,control);
    const names=constraint?.ruleNames?.filter(Boolean) || [];
    const label=value=>(field.options || []).find(option=>option.id===value)?.label || String(value);
    const parts=[];
    if (active) {
      parts.push('命中规则：'+(names.length ? names.join('、') : constraint.ruleIds.join('、')));
      if (fixed) parts.push('固定为「'+label(constraint.fixedValue)+'」，由规则锁定');
      else if (typeof constraint.prefillText==='string') parts.push('空白时预填，可编辑');
      else if (allowed) parts.push('可选范围：'+(allowed.length ? allowed.map(label).join('、') : '无可用值'));
      if (control.required) parts.push('必填');
    }
    if (session.notices.has(field.id)) parts.push('原值不符合当前范围，已清空，请重新选择');
    hint.textContent=parts.join('；');hint.hidden=!parts.length;
    const wrapper=control.closest('label');
    const added=wrapper?.querySelector('[data-wb-linkage-required]');
    if (control.required && wrapper && !wrapper.querySelector('.wb-required')) {
      const marker=control.ownerDocument.createElement('span');marker.className='wb-required';
      marker.dataset.wbLinkageRequired='true';marker.setAttribute('aria-hidden','true');marker.textContent='*';
      (wrapper.querySelector('span') || wrapper).prepend(marker);
    } else if (!control.required && added) added.remove();
    if (!active) {
      // Restore once when the last linkage constraint ends, then relinquish
      // ownership so subsequent business changes become the next baseline.
      session.bases.delete(control);
      session.notices.delete(field.id);
      session.hints.delete(field.id);
      hint.remove();
      wrapper?.querySelector('[data-wb-linkage-required]')?.remove();
    }
  }
  function sync(form) {
    const session=sessions.get(form);
    if (!session) return {ok:true};
    if (session.busy) return session.last || {ok:true};
    session.busy=true;
    const changed=[];
    try {
      const result=evaluate(session);session.last=result;
      if (!result?.ok) {
        session.status.textContent=errorsOf(result).join('；');session.status.hidden=false;
        return result;
      }
      for (const field of session.schema.fields || []) {
        const constraint=result.constraints?.[field.id];
        const control=controlFor(form,field);
        if (!control) continue;
        const next=result.values?.[field.id];
        const active=Boolean(constraint?.ruleIds?.length || constraint?.ruleNames?.length);
        if (!active || filled(next)) session.notices.delete(field.id);
        const cleared=(result.changes || []).some(change=>change.fieldId===field.id && filled(change.before) && !filled(change.after));
        if (cleared && active && constraint.fixedValue==null) session.notices.add(field.id);
        const canPrefill=!isText(field) || !session.editedText.has(control) && !control.disabled && !control.readOnly;
        if (active && canPrefill && own(result.values,field.id) && !control.closest('[hidden]') &&
            writeValue(field,control,next)) changed.push(control);
        if (active || session.bases.has(control)) applyConstraint(session,field,control,constraint);
      }
      session.status.textContent='';session.status.hidden=true;
      // Existing result listeners still own next-visit/store-time behavior. Keep
      // their event contract without re-rendering the form or losing focus.
      const Event=form.ownerDocument.defaultView.Event;
      for (const control of changed) control.dispatchEvent(new Event('change',{bubbles:true}));
      return result;
    } finally {
      session.busy=false;
      if (session.onChange) session.onChange();
    }
  }
  function bind(form,{record,schema,context=()=>window.DSession?.context?.(),onChange}={}) {
    const prior=sessions.get(form);
    const current=typeof context==='function' ? context() : context;
    if (prior) {
      if (prior.identity!==signature(current) || prior.sourceIdentity!==formScope(record,schema)) {
        prior.stale=true;
        prior.status.textContent='当前任务、分配规则或填写字段已变化，请重新打开表单。';prior.status.hidden=false;
      } else Object.assign(prior,{record,schema,context,onChange});
      return prior.api;
    }
    const status=form.ownerDocument.createElement('p');status.className='form-error';status.hidden=true;
    status.dataset.wbFieldLinkageStatus='true';status.setAttribute('role','alert');
    form.prepend(status);
    const session={form,record,schema,context,identity:signature(current),sourceIdentity:formScope(record,schema),onChange,status,
      bases:new Map(),hints:new Map(),notices:new Set(),editedText:new WeakSet(),busy:false,last:null};
    const api={sync:()=>sync(form),validate:()=>{
      const live=currentContext(session);
      const result=live ? validate(session.record,session.schema,form,live) : {ok:false,errors:['当前任务、轮次、分配规则或填写字段已变化，请重新打开表单。']};
      if (!result.ok) {status.textContent=errorsOf(result).join('；');status.hidden=false;}
      return result;
    }};
    session.api=api;sessions.set(form,session);
    const update=event=>{
      if (event?.type==='input' && !session.busy &&
          (session.schema.fields || []).some(field=>isText(field) && controlFor(form,field)===event.target)) {
        session.editedText.add(event.target);
      }
      sync(form);
    };
    form.addEventListener('input',update);form.addEventListener('change',update);
    sync(form);return api;
  }
  function canSuggest(form,schema,control,value) {
    const session=sessions.get(form);
    if (!session) return true;
    const field=(schema.fields || []).find(item=>controlFor(form,item)===control);
    if (!field) return true;
    const before=values(schema.fields,form);
    const proposed=field.type==='multiselect' ? (Array.isArray(value)?value:[value]).map(item=>optionId(field,item)) :
      field.type==='select' ? optionId(field,value) : value;
    const result=evaluate(session,{...before,[field.id]:proposed});
    if (!result?.ok || !same(result.values?.[field.id],proposed)) return false;
    // An AI suggestion to an empty upstream field must not clear or replace an
    // existing human value elsewhere. The operator can make that change explicitly.
    return (schema.fields || []).every(item=>!filled(before[item.id]) || same(before[item.id],result.values?.[item.id]));
  }
  window.DFieldLinkageWorkbench=Object.freeze({values,validate,bind,sync,canSuggest,isFixed,errorsOf,callModeOf,callModeGroup});
})();
