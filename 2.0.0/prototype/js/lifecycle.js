(() => {
  'use strict';

  const categories = ['留资线索', '培育线索'];
  const importFields = [
    ['initialSource','初始化线索来源'],
    ['series','意向车系'],['smartCode','SmartCode'],['project','大项目名'],['channel','渠道编码'],
    ['leadStatus','线索状态'],['reason','异常原因'],['dealer','意向专营店'],
    ['city','城市'],['province','省份'],['preScore','预评分']
  ];
  const received = '已接收';
  const receiptStatus = status => status === '已接收、待流转' ? received : status;
  const pending = '待核对';
  const awaitingReceipt = '接入结果待核对，请沿用原来件编号查询。';
  const intakeDraftKey = 'lifecycleIntakeDraft';
  const intakeResultKey = 'lifecycleIntakeResult';
  const sections = window.reviewSections ||= {};

  function visibleRecords(state) {
    return state.records.filter(record => record.tenant === state.tenant &&
      (state.role === 'admin' || Boolean(state.seatId && record.ownerId === state.seatId)));
  }

  function categorySource(category) {
    if (category === '留资线索') return '本司业务系统';
    if (category === '培育线索') return '第三方培育系统';
    return '待确认来源';
  }

  function applications(tenant) {
    return window.DModuleHost?.currentIntakeApplications?.(tenant) || [];
  }

  function sourceApplication(record) {
    return record?.sourceApplicationId && applications(record.tenant).find(app=>app.id===record.sourceApplicationId);
  }

  function originalLabel(category) {
    return category === '留资线索' ? '原留资编号' : '来源线索编号';
  }

  function demoDraft(state, category = '留资线索') {
    const number = (state.intakeHistory?.length || 0) + 1;
    return {
      tenant: state.tenant,
      requestNo: nextCode(state.intakeHistory || [], 'RJ', 'requestNo'),
      category,
      originalKey: category ? `${category === '留资线索' ? 'LZ' : 'PY'}-DEMO-${number}` : '',
      name: '演示客户',
      phone: '13800001234',
      nurture: '是',
      arrival: '首次',
      receipt: '正常返回'
    };
  }

  function nextCode(records, prefix, field) {
    let number = records.length + 1;
    let code = `${prefix}-${String(number).padStart(3, '0')}`;
    while (records.some(record => record[field] === code)) {
      number += 1;
      code = `${prefix}-${String(number).padStart(3, '0')}`;
    }
    return code;
  }

  const intakeControls={name:'name',phone:'phone',needsNurture:'nurture'};
  const sourceKeys=new Set(importFields.map(([key])=>key));
  function controlFor(field,category) {
    const key=field.businessKey;
    if ((key==='clueid' && category==='留资线索') || (key==='hclueid' && category==='培育线索')) return 'originalKey';
    return Object.hasOwn(intakeControls,key) ? intakeControls[key] : '';
  }
  const hasValue=value=>Array.isArray(value) ? value.length>0 : value!=null && String(value).trim()!=='';

  function configuredImport(record,native) {
    const context=window.DSession?.context();
    return window.DReview21DccFollowupFields?.importSchema(record,native,context);
  }

  function importValue(field, values, native, needsNurture) {
    const control=controlFor(field,values.category);
    const key=Object.hasOwn(values.importedValues || {},field.key)?field.key:field.businessKey;
    let raw=Object.hasOwn(values.importedValues || {},key)?values.importedValues[key]:undefined;
    if (raw===undefined && control) raw=control==='nurture' ? (needsNurture?'是':'否') : values[control];
    if (raw===undefined && sourceKeys.has(field.businessKey)) raw=values[field.businessKey];
    if (!hasValue(raw)) return undefined;
    const text=field.type==='multiselect' ? (Array.isArray(raw)?raw:String(raw).split('|'))
      .map(item=>String(item ?? '').trim()).filter(Boolean).join('|') : String(raw).trim();
    if (!text) return undefined;
    if (native?.DImportFiles && field.businessKey!=='phone') {
      const checked=native.DImportFiles.inspect([[field.key],[text]],[field]).rows[0];
      if (checked?._schemaErrors.length) throw Error(checked._schemaErrors[0].replace(/^第\d+行第\d+列/,''));
    }
    return text;
  }

  function captureImports(state, values, native, needsNurture) {
    const schema=configuredImport({...values,tenant:state.tenant},native);
    if (!schema) return null;
    const fields=schema.fields.map(({id,key,fieldId,businessKey,label,type,options})=>({key,fieldId:fieldId || id,businessKey,label,type,options}));
    const entries=schema.fields.map(field=>[field.key,importValue(field,values,native,needsNurture)])
      .filter(([,value])=>value!==undefined);
    return {schema:1,categoryId:schema.category.id,fields,values:Object.fromEntries(entries)};
  }

  function mergeImports(record, snapshot, previous) {
    if (!snapshot) return;
    record.businessImportSnapshot={...snapshot,values:{...record.businessImportSnapshot?.values,...previous?.values,...snapshot.values}};
  }

  function sameIntakeSignature(previous, current, hasCategoryContext) {
    if (previous === current) return true;
    try {
      const parts = JSON.parse(previous);
      if (!Array.isArray(parts)) return false;
      const index = hasCategoryContext ? 7 : 6;
      const fields = parts[index];
      if (fields?.preScoreState !== '明确无分' || Array.isArray(fields) ||
          Object.keys(fields).some(key => key !== 'preScoreState' && !sourceKeys.has(key))) return false;
      delete fields.preScoreState;
      if (!Object.keys(fields).length) parts.splice(index,1);
      return JSON.stringify(parts) === current;
    } catch (_) { return false; }
  }

  function receiveIntake(state, values, native) {
    if (!categories.includes(values.category)) return {status:'未接收',detail:'请核对来件业务分类。'};
    const application = values.applicationId && applications(state.tenant).find(app=>app.id===values.applicationId);
    if (values.applicationId && !application) return {status:'未接收',detail:'接入应用未获当前租户授权。'};
    const source = application?.name || categorySource(values.category);
    const sourceApplicationId = application?.id || '';
    const needsNurture = values.category === '培育线索' || values.nurture === '是';
    const workspace=native || (typeof document!=='undefined' ? document.querySelector('iframe[data-native-module="cloud"]')?.contentWindow : null);
    const history = state.intakeHistory ||= [];
    const sourceFields = Object.fromEntries(importFields
      .filter(([key]) => typeof values[key] === 'string' && values[key].trim())
      .map(([key]) => [key,values[key].trim()]));
    const sameRequest = history.find(item => item.requestNo === values.requestNo &&
      item.tenant === state.tenant &&
      (sourceApplicationId ? item.sourceApplicationId===sourceApplicationId : !item.sourceApplicationId && item.source===source));
    const signature = JSON.stringify([values.category, values.originalKey, values.name,
      values.phone, needsNurture, values.arrival, ...(values.categoryContext ? [values.categoryContext] : []),
      ...(Object.keys(sourceFields).length ? [sourceFields] : []),
      ...(Object.keys(values.importedValues || {}).length ?
        [Object.fromEntries(Object.entries(values.importedValues).sort(([a],[b])=>a.localeCompare(b)))] : [])]);

    if (sameRequest) {
      if (!sameIntakeSignature(sameRequest.signature, signature, Boolean(values.categoryContext))) {
        return { status: '未接收', detail: '此来件编号对应的资料有变化。原接入记录已保留。' };
      }
      const canReconcile = sameRequest.status === pending && !sameRequest.recordId &&
        (sameRequest.awaitingReceipt === true || sameRequest.detail === awaitingReceipt);
      if (!canReconcile || values.receipt === '结果待核') {
        return { status: receiptStatus(sameRequest.status), detail: '已核对同次来件，沿用原接入结果。' };
      }
    }

    let imported;
    try {
      imported=captureImports(state,values,workspace,needsNurture);
    } catch (error) {
      return {status:'未接收',detail:error.message};
    }

    const item = sameRequest || {
      requestNo: values.requestNo, originalKey: values.originalKey, category: values.category,
      tenant: state.tenant, source, sourceApplicationId, signature, categoryContext: values.categoryContext || '',
      receivedAt: new Date().toISOString()
    };
    const recordResult = (status, detail, record, taskRelation = '') => {
      Object.assign(item, {status, detail, needsNurture, taskRelation,
        awaitingReceipt: detail === awaitingReceipt, recordId:record?.id || ''});
      if (!sameRequest) history.unshift(item);
      return { status, detail };
    };
    if (values.receipt === '结果待核') {
      return recordResult(pending, awaitingReceipt);
    }
    if (values.receipt === '接入失败') {
      return recordResult('未接收', '本次接入未成功。');
    }

    const matching = state.records.filter(record => record.tenant === state.tenant &&
      (sourceApplicationId ? record.sourceApplicationId===sourceApplicationId : !record.sourceApplicationId && record.source===source) &&
      record.category === values.category && record.originalKey === values.originalKey);
    if (values.arrival === '回流') {
      if (values.category !== '培育线索') {
        return recordResult(pending, '原线索还需确认。');
      }
      const ongoing = state.records.filter(record => record.tenant === state.tenant &&
        record.category === '培育线索' && record.originalKey === values.originalKey &&
        record.taskId && record.taskStatus === '下次回访');
      if (ongoing.length > 1) {
        return recordResult(pending, '仍需确认对应的培育任务。');
      }
      if (ongoing.length === 1) {
        // Only source-owned contact fields in this review form are eligible.
        // Empty / omitted values and seat-entered follow-up data are preserved.
        const old=ongoing[0];
        const model=window.DReview21DccFollowupFields;
        const previous=imported && {values:Object.fromEntries(imported.fields.map(field=>[field.key,model.importedValue(old,field)])
          .filter(([,value])=>hasValue(value)))};
        for (const key of ['name', 'phone']) {
          if (typeof values[key] === 'string' && values[key].trim()) ongoing[0][key] = values[key].trim();
        }
        for (const [key,value] of Object.entries(sourceFields)) {
          if (key !== 'leadStatus') ongoing[0][key] = value;
        }
        ongoing[0].lastIntakeRequest = values.requestNo;
        mergeImports(ongoing[0],imported,previous);
        return recordResult(received, '本次来件已接收。', ongoing[0], '合并至原任务');
      }
    } else if (matching.length) {
      return recordResult(pending, '该来源线索已有记录，请核对本次来件。');
    }

    const record = {
      id: nextCode(state.records, 'L-DEMO', 'id'),
      name: values.name, phone: values.phone, category: values.category, source, sourceApplicationId,receivedAt:item.receivedAt,
      originalKey: values.originalKey, tenant: state.tenant,
      categoryContext: values.categoryContext || '',
      needsNurture, intakeState: received, ...sourceFields,
      ...(needsNurture ? {taskStatus:'待分配',requiredMode:'人工外呼',createdAt:new Date().toISOString()} : {taskStatus:'待办理'}),
      taskId: needsNurture ? nextCode(state.records, 'PY-DEMO', 'taskId') : '',
      ownerId: '', followupResult: '', followupNote: '', nextAt: '', decision: '', handoffState: '',
      lastIntakeRequest: values.requestNo
    };
    mergeImports(record,imported);
    state.records.unshift(record);
    return recordResult(received, '本次来件已接收。', record, needsNurture ? '新建任务' : '');
  }

  function importInputs(state, draft, ui) {
    const e=ui.esc;
    const native=ui.root?.ownerDocument?.defaultView;
    const schema=configuredImport({...draft,tenant:state.tenant},native);
    const custom=schema?.fields.filter(field=>!controlFor(field,draft.category)) || [];
    if (!custom.length) return '';
    return `<details class="dcc-intake-fields" open><summary>分类导入字段</summary><div class="dcc-intake-field-grid">
      ${custom.map(field=>{
        const name='import:'+field.key;
        const raw=draft.importedValues?.[field.key];
        const value=Array.isArray(raw)?raw.join('|'):raw;
        const choice=field.type==='select' && field.options?.length ?
          `<select name="${e(name)}"><option value="">请选择</option>${field.options.filter(option=>option.enabled!==false).map(option=>
            `<option value="${e(option.id)}"${String(value ?? '')===String(option.id)?' selected':''}>${e(option.label)}</option>`).join('')}</select>` :
          `<input name="${e(name)}" value="${e(value)}" placeholder="${field.type==='multiselect'?'多个选项用 | 分隔':'请输入'}">`;
        return `<label class="field">${e(field.label)}${choice}</label>`;
      }).join('')}</div></details>`;
  }

  function drawIntake(state, ui) {
    const esc = ui.esc;
    const inline = ui.options?.inline === true;
    const categoryContext = ui.options?.categoryContext || '';
    const locked = inline && categories.includes(ui.options?.categoryHint) ? ui.options.categoryHint : '';
    const applies = item => item?.tenant === state.tenant && (item.categoryContext || '') === categoryContext;
    const saved = state[intakeDraftKey];
    const draft = applies(saved) && (!locked || saved.category === locked) ? saved :
      demoDraft(state, inline ? locked : '留资线索');
    const lastResult = applies(state[intakeResultKey]) ? state[intakeResultKey] : null;
    const allowed = visibleRecords(state);
    const canSimulate = state.role === 'admin';
    const sourceOptions = applications(state.tenant).map(app=>`<option value="${esc(app.id)}"${selectedApplication(app.id)}>${esc(app.name)}</option>`).join('');
    function selectedApplication(id) {return draft.applicationId===id ? ' selected' : '';}
    const displayed = (state.intakeHistory || []).filter(item => item.tenant === state.tenant &&
      (canSimulate || allowed.some(record => record.id === item.recordId)));
    const selected = (value, expected) => value === expected ? ' selected' : '';
    const option = (list, value) => list.map(text => `<option${selected(value, text)}>${esc(text)}</option>`).join('');
    const rows = displayed.length ? displayed.map(item => `<tr><td>${esc(item.requestNo)}</td><td>${esc(item.category)}</td><td>${esc(item.originalKey)}</td><td>${esc(item.source)}</td><td><span class="tag">${esc(receiptStatus(item.status))}</span></td></tr>`).join('') :
      '<tr><td colspan="5" class="empty">暂无接入记录</td></tr>';
    return `
      ${canSimulate ? `<section class="panel">
        ${inline ? '<p class="muted">使用模拟来件核对本次接入回执。</p>' : '<div class="section-title"><h2>演示操作</h2><span class="tag">模拟来件</span></div>'}
        <div class="toolbar">
          <button type="button" class="button secondary" data-intake-sample="normal">${inline ? '填入首次来件' : '填入普通留资'}</button>
          ${!locked || locked === '培育线索' ? '<button type="button" class="button secondary" data-intake-sample="return">填入培育回流</button>' : ''}
        </div>
        <form id="review-intake-form" class="lifecycle-form">
          ${locked ? `<input type="hidden" name="category" value="${esc(locked)}">` :
            `<label class="field">${inline ? '来件业务分类' : '业务分类'}<select name="category" required>${inline ? '<option value="">请选择本次来件分类</option>' : ''}${option(categories, draft.category)}</select></label>`}
          <label class="field"><span>模拟接入应用</span><select name="applicationId"><option value="">沿原演示来源</option>${sourceOptions}</select></label>
          <label class="field">客户姓名<input name="name" maxlength="40" value="${esc(draft.name)}"></label>
          <label class="field">联系电话<input name="phone" type="tel" maxlength="25" value="${esc(draft.phone)}"></label>
          <label class="field"><span data-intake-original-label>${esc(originalLabel(draft.category))}</span><input name="originalKey" required maxlength="50" value="${esc(draft.originalKey)}"></label>
          <label class="field">来件编号<input name="requestNo" required maxlength="50" value="${esc(draft.requestNo)}"></label>
          <label class="field" data-intake-nurture-field${draft.category === '培育线索' ? ' hidden' : ''}>上游是否需要培育<select name="nurture">${option(['是', '否'], draft.nurture)}</select></label>
          <label class="field">来件类型<select name="arrival">${option(['首次', '回流'], draft.arrival)}</select></label>
          <label class="field">接入回执<select name="receipt">${option(['正常返回', '结果待核', '接入失败'], draft.receipt)}</select></label>
          ${importInputs(state,{...draft,categoryContext},ui)}
          <div class="toolbar"><button type="submit" class="button primary">模拟收到线索</button><button type="button" class="button secondary" data-intake-sample="new">换一条来件</button></div>
        </form>
        ${lastResult ? `<div class="notice" role="status"><strong>${esc(receiptStatus(lastResult.status))}</strong> ${esc(lastResult.status === receiptStatus(lastResult.status) ? lastResult.detail : '本次来件已接收。')}</div>` : ''}
      </section>` : ''}
      ${inline ? '' : `<section class="panel">
        <div class="section-title"><h2>接入记录</h2><button type="button" class="button secondary" data-lifecycle-go="${canSimulate ? 'queue' : 'workbench'}">${canSimulate ? '查看业务名单' : '查看本人待办'}</button></div>
        <div class="table-wrap"><table><thead><tr><th>来件编号</th><th>业务分类</th><th>来源线索编号</th><th>来源</th><th>接入结果</th></tr></thead><tbody>${rows}</tbody></table></div>
      </section>`}`;
  }

  function setIntakeDraft(state, sample, ui) {
    if(ui.canSave?.()===false)return;
    const inline = ui.options?.inline === true;
    const locked = inline && categories.includes(ui.options?.categoryHint) ? ui.options.categoryHint : '';
    const category = locked || (sample === 'new' && inline ? '' : '留资线索');
    let draft = demoDraft(state, category);
    if (sample === 'normal' && category === '留资线索') draft.nurture = '否';
    if (sample === 'return') {
      if (locked && locked !== '培育线索') return;
      const record = visibleRecords(state).find(item => item.category === '培育线索' &&
        (item.source === '第三方培育系统' || sourceApplication(item)) && ['下次回访', '已完成'].includes(item.taskStatus));
      if (!record) {
        ui.toast('当前没有可演示回流的培育记录。');
        return;
      }
      draft = { ...draft, category: record.category, originalKey: record.originalKey, applicationId:record.sourceApplicationId || '',
        name: record.name, phone: record.phone, arrival: '回流' };
    }
    draft.categoryContext = ui.options?.categoryContext || '';
    state[intakeDraftKey] = draft;
    state[intakeResultKey] = null;
    ui.save();
  }

  function bindNavigation(workspace, ui) {
    workspace.querySelectorAll('[data-lifecycle-go]').forEach(button => {
      button.addEventListener('click', () => ui.go(button.dataset.lifecycleGo));
    });
  }

  sections.intake = {
    title: '线索接入',
    render: drawIntake,
    bind(state, ui) {
      const workspace = ui.root || document.querySelector('#workspace');
      bindNavigation(workspace, ui);
      const form = workspace.querySelector('#review-intake-form');
      if (state.role !== 'admin' || !form) return;
      workspace.querySelectorAll('[data-intake-sample]').forEach(button => {
        button.addEventListener('click', () => setIntakeDraft(state, button.dataset.intakeSample, ui));
      });
      form.elements.category.addEventListener('change', () => {
        form.querySelector('[data-intake-original-label]').textContent = originalLabel(form.elements.category.value);
        form.querySelector('[data-intake-nurture-field]').hidden = form.elements.category.value === '培育线索';
      });
      form.addEventListener('submit', event => {
        event.preventDefault();
        if(ui.canSave?.()===false)return;
        const RealmFormData = form.ownerDocument?.defaultView?.FormData || FormData;
        const values = Object.fromEntries(Array.from(new RealmFormData(form), ([key, value]) => [key, value.trim()]));
        const custom=Object.keys(values).filter(key=>key.startsWith('import:'));
        if (custom.length) {
          values.importedValues=Object.fromEntries(custom.filter(key=>values[key]).map(key=>[key.slice(7),values[key]]));
          custom.forEach(key=>delete values[key]);
        }
        const locked = ui.options?.inline && categories.includes(ui.options.categoryHint) ? ui.options.categoryHint : '';
        const inflight = values.arrival === '回流' && values.category === '培育线索' && state.records.some(row =>
          row.tenant === state.tenant && row.category === '培育线索' && row.originalKey === values.originalKey && row.taskStatus === '下次回访');
        if (!categories.includes(values.category) || locked && values.category !== locked || !values.originalKey || !values.requestNo ||
            (!inflight && (!values.name || !values.phone)) || (values.phone && !/^\+?\d[\d -]{6,24}$/.test(values.phone))) {
          ui.toast('请核对业务分类，并填写姓名、有效联系电话和来件编号。');
          return;
        }
        values.categoryContext = ui.options?.categoryContext || '';
        const previous=structuredClone({records:state.records,history:state.intakeHistory,result:state[intakeResultKey]});
        state[intakeDraftKey] = { ...values, tenant: state.tenant };
        state[intakeResultKey] = { ...receiveIntake(state, values, form.ownerDocument.defaultView), tenant: state.tenant, categoryContext: values.categoryContext };
        ui.save(state[intakeResultKey].status,()=>{
          state.records=previous.records;
          state.intakeHistory=previous.history;
          state[intakeResultKey]=previous.result;
        });
      });
    }
  };

  function destination(record) {
    if (!record.originalKey) return '';
    if (record.sourceApplicationId) {
      const app=sourceApplication(record);
      return app?.canReceiveResults ? app.name : '';
    }
    if (record.category === '留资线索' && record.source === '本司业务系统') return record.source;
    if (record.category === '培育线索' && record.source === '第三方培育系统') return record.source;
    return '';
  }

  function savedRecords(state) {
    return visibleRecords(state).filter(record => Boolean(record.followupResult?.trim()));
  }

  function maySubmit(record) {
    return record.taskStatus === '已完成' &&
      ![received, '对方拒绝', '已结案', '接收待核'].includes(record.handoffState) &&
      (record.handoffState!=='归口待确认' || Boolean(destination(record)));
  }

  function mayRecheck(record) {
    return record.handoffState === '接收待核' && Boolean(record.handoffRequest);
  }

  function recordHandoff(state, record, decision, receipt, recheck) {
    if (recheck && !mayRecheck(record) || !recheck && !maySubmit(record)) return false;
    const target = recheck ? record.handoffTarget : destination(record);
    if (!recheck && !record.decision) record.decision = decision;
    if (record.decision === '否') {
      record.taskStatus = '已完成';
      record.handoffState = '已结案';
    } else if (!target) {
      record.handoffState = '归口待确认';
    } else {
      record.handoffState = receipt;
      record.handoffRequest ||= nextCode(state.records, 'JJ', 'handoffRequest');
      record.handoffApplicationId ||= record.sourceApplicationId || '';
    }
    record.handoffTarget = record.decision === '是' ? target : '';
    return true;
  }

  sections.handoff = {
    title: '结果交接',
    render(state, ui) {
      const esc = ui.esc;
      const records = savedRecords(state);
      const record = records.find(item => item.id === state.lifecycleSelectedHandoff) || records[0];
      if (!record) return '<section class="panel"><h2>暂无可交接结果</h2><p class="muted">保存回访后，可在这里查看结果交接情况。</p><button class="button secondary" type="button" data-lifecycle-go="workbench">查看坐席待办</button></section>';

      const target = record.handoffTarget || destination(record);
      const mayAct = state.role === 'admin' || record.ownerId === state.seatId;
      const recheck = mayAct && mayRecheck(record);
      const submit = mayAct && maySubmit(record);
      const showReceipt = Boolean(target && record.decision === '是');
      const options = records.map(item => `<option value="${esc(item.id)}"${item.id === record.id ? ' selected' : ''}>${esc(item.name)} · ${esc(item.originalKey)}</option>`).join('');
      const rows = records.map(item => `<tr><td>${esc(item.name)}</td><td>${esc(item.originalKey)}</td><td>${esc(item.followupResult)}</td><td>${esc(item.decision || '待确认')}</td><td>${esc(item.handoffTarget || (item.decision === '否' ? '本地结案' : destination(item) || '待确认'))}</td><td><span class="tag">${esc(item.handoffState || '待处理')}</span></td></tr>`).join('');
      return `
        <section class="panel">
          <div class="section-title"><h2>已保存的跟进结果</h2></div>
          <label class="field">选择线索<select id="review-handoff-record">${options}</select></label>
          <div class="metrics">
            <div class="metric"><span class="muted">回访结果</span><strong>${esc(record.followupResult)}</strong></div>
            <div class="metric"><span class="muted">交回系统</span><strong>${esc(record.decision === '否' ? '本地结案' : target || '待确认')}</strong></div>
            <div class="metric"><span class="muted">处理状态</span><strong>${esc(record.handoffState || '待处理')}</strong></div>
          </div>
          ${record.followupNote ? `<p>${esc(record.followupNote)}</p>` : ''}
          ${record.handoffState === received ? '<p class="notice">对方已接收，后续下发由接收系统处理。</p>' : ''}
          ${record.handoffState === '归口待确认' ? '<p class="notice">保留本次跟进结果，接收方确认后再交接。</p>' : ''}
          ${record.taskStatus === '下次回访' ? '<p class="notice">按原计划继续跟进，完成后再处理交接。</p>' : ''}
        </section>
        ${submit || recheck ? `<section class="panel">
          <div class="section-title"><h2>演示操作</h2></div>
          <form id="review-handoff-form" class="lifecycle-form" data-record="${esc(record.id)}" data-recheck="${recheck ? 'yes' : 'no'}">
            ${recheck ? `<p class="muted">核对原交接 ${esc(record.handoffRequest)}</p>` : record.decision ? `<p>是否下发：${esc(record.decision)}</p>` : '<label class="field">是否下发<select name="decision" required><option value="">请选择</option><option value="是">是</option><option value="否">否，本地结案</option></select></label>'}
            ${showReceipt ? `<label class="field">模拟对方回执<select name="receipt" required><option value="">请选择</option><option>${received}</option><option>对方拒绝</option><option>接收待核</option></select></label>` : ''}
            <div class="toolbar"><button class="button primary" type="submit">${recheck ? '核对原交接' : showReceipt ? '模拟交回结果' : '确认处理方式'}</button></div>
          </form>
        </section>` : ''}
        <section class="panel">
          <div class="section-title"><h2>交接记录</h2></div>
          <div class="table-wrap"><table><thead><tr><th>客户</th><th>来源线索编号</th><th>回访结果</th><th>是否下发</th><th>去向</th><th>处理状态</th></tr></thead><tbody>${rows}</tbody></table></div>
        </section>`;
    },
    bind(state, ui) {
      const workspace = document.querySelector('#workspace');
      bindNavigation(workspace, ui);
      workspace.querySelector('#review-handoff-record')?.addEventListener('change', event => {
        if(ui.canSave?.()===false)return;
        state.lifecycleSelectedHandoff = event.target.value;
        ui.save();
      });
      const form = workspace.querySelector('#review-handoff-form');
      if (!form) return;
      form.addEventListener('submit', event => {
        event.preventDefault();
        if(ui.canSave?.()===false)return;
        const record = savedRecords(state).find(item => item.id === form.dataset.record);
        if (!record || (state.role !== 'admin' && record.ownerId !== state.seatId)) return;
        const recheck = form.dataset.recheck === 'yes';
        const decision = record.decision || form.elements.decision?.value;
        if (!record.decision && decision === '是' && maySubmit(record)) {
          record.decision = '是';
          record.handoffTarget = destination(record);
          record.handoffState = record.handoffTarget ? '待交接' : '归口待确认';
          ui.save(record.handoffState);
          return;
        }
        const receipt = form.elements.receipt?.value || '接收待核';
        if (recordHandoff(state, record, decision, receipt, recheck)) ui.save(record.handoffState);
      });
    }
  };
  window.DReview21Handoff = {destination, sourceApplication, maySubmit, mayRecheck, recordHandoff};
  window.DReview21Intake = {receive:receiveIntake, receiptStatus};
})();
