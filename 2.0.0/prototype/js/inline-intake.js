(() => {
  'use strict';

  const skynetLayer = 'review-skynet-intake';
  const processingReceipts = new Map();
  let receiptToOpen = null;
  const esc = value => DUI.esc(value);

  function identity(context) {
    return context ? `${context.account?.id}|${context.scope?.id}` : '';
  }

  function matchesContext(options, doc) {
    const {id, frame, context} = options;
    const session = window.DSession;
    const actual = session?.context();
    return !!doc?.defaultView && frame.isConnected && !frame.hidden &&
      ['PAGE-2204', 'PAGE-2226'].includes(id) && window.DApp?.currentPage() === id &&
      actual?.scope.kind === 'tenant' &&
      identity(actual) === identity(context) && identity(actual) === identity(doc.defaultView.DNativeContext?.context) &&
      session.allowed(id, actual) && window.DRolePermissions?.moduleEnabled('cloud', actual);
  }

  function canMount(options, doc) {
    return matchesContext(options, doc) && DSession.roleKey(options.context).endsWith('_admin');
  }

  function skynetOption(option) {
    return '<option value="' + esc(option.value) + '">' + esc(option.label) + '</option>';
  }

  function skynetField({key, label, required, type, options}) {
    const name = esc(key);
    const multiple = type === 'multiselect';
    const inputType = type === 'phone' ? 'tel' : ['datetime-local','date','number'].includes(type) ? type : 'text';
    const control = type === 'select' || multiple ?
      '<select name="' + name + '"' + (multiple ? ' multiple' : '') + '>' +
        (multiple ? '' : '<option value="">请选择</option>') + (options || []).map(skynetOption).join('') + '</select>' :
      '<input type="' + inputType + '" name="' + name + '"' + (type === 'number' ? ' step="any"' : ' maxlength="160"') + '>';
    return '<label class="field"><span>' + esc(label) + (required ? ' <em>*</em>' : '') + '</span>' + control + '</label>';
  }

  function readSkynetField(control) {
    return control.multiple ? Array.from(control.selectedOptions,option => option.value) : control.value;
  }

  function populateSkynetField(control, field, value) {
    const service = window.DSkynetIntake;
    if (field.type === 'multiselect') {
      const values = new Set(service.multiselectValues(value).map(item => service.canonicalOption(field,item)?.value));
      for (const option of control.options) option.selected = values.has(option.value);
    } else {
      const scalar = Array.isArray(value) ? (field.type === 'select' ? value[0] : value.join('|')) : value;
      control.value = (field.type === 'select' ? service.canonicalOption(field,scalar)?.value : scalar) ?? '';
    }
  }

  function persistSkynet(state, mutate, creating) {
    const review = window.DReview21;
    if (!state || !review.isLatest(state)) return {error: '当前租户资料已变化，请刷新后再操作。'};
    const previousReceipts = structuredClone(state.skynetReceipts);
    const previousRecords = creating ? null : structuredClone(state.records);
    const previousRotation = creating ? undefined : structuredClone(state.skynetSeatRotation);
    const previousSeatCounts = creating ? [] : (state.seats || []).map(seat => ({
      seat, hadCount:Object.hasOwn(seat,'newCount'), newCount:seat.newCount
    }));
    function restore() {
      if (previousReceipts === undefined) delete state.skynetReceipts;
      else state.skynetReceipts = previousReceipts;
      if (creating) return;
      state.records = previousRecords;
      if (previousRotation === undefined) delete state.skynetSeatRotation;
      else state.skynetSeatRotation = previousRotation;
      for (const {seat,hadCount,newCount} of previousSeatCounts) {
        if (hadCount) seat.newCount = newCount;
        else delete seat.newCount;
      }
    }
    try {
      const result = mutate();
      if (result.duplicate) return result;
      if (!result.error && review.save(state)) return result;
      restore();
      return result.error ? result : {
        error:review.saveFailure(state,'天网来件未保存，请重试。'), saveFailed:review.isLatest(state)
      };
    } catch (_) {
      restore();
      return {error: '天网来件未保存，请重试。'};
    }
  }

  function manualAllocationRules(context, categoryId) {
    if (!DSkynetIntake.canSubmit(context)) return [];
    const state = DReview21.state({reload:true});
    const settings = window.DSkynetConfig;
    if (state?.tenant !== context.scope.id || !DReview21.isLatest(state)) return [];
    return settings.rulesForCategory(settings.read(state),categoryId)
      .filter(rule=>rule.id && rule.version && (!rule.tenantId || rule.tenantId===context.scope.id) &&
        (!rule.brandId || rule.brandId===context.scope.tenant.brandId))
      .map(({id,name,version})=>({id,name,version}));
  }

  function manualBatchFieldValue(field, value) {
    if (!field.options?.length || value == null || value === '') return value;
    const normalize = input => {
      const canonical = DSkynetIntake.canonicalOption(field,input);
      if (canonical) return canonical.value;
      const matches = field.options.filter(option=>option.label === input);
      return matches.length===1 ? matches[0].value : input;
    };
    return field.type === 'multiselect' ? DSkynetIntake.multiselectValues(value).map(normalize) : normalize(value);
  }

  function manualBatchPayload(profile, row, importFields) {
    const values = row.importedValues || {};
    const businessValues = Object.fromEntries(importFields.filter(field=>field?.businessKey &&
      Object.hasOwn(values,field.key)).map(field=>[field.businessKey,values[field.key]]));
    const payload = Object.fromEntries(profile.fields.map(field=>[
      field.key,manualBatchFieldValue(field,businessValues[field.businessKey] ?? values[field.businessKey] ?? values[field.key])
    ]));
    return {...payload,originalKey:payload.originalKey || row.externalDocumentId,name:row.name,phone:row.phone};
  }

  function validateManualBatchRow(profile, row, importFields) {
    return DSkynetIntake.validateImportValues(profile,manualBatchPayload(profile,row,importFields));
  }

  function routeManualBatch(batch, ruleId, nativeWindow) {
    const context = DSession.context();
    const frame = nativeWindow?.frameElement;
    const rows = Array.isArray(batch?.rows) ? batch.rows : [];
    if (!batch?.id || !frame || !matchesContext({id:'PAGE-2204',frame,context},nativeWindow.document) ||
        !DSkynetIntake.canSubmit(context) || batch.tenantId !== context.scope.id ||
        batch.brandId !== context.scope.tenant.brandId) {
      return {routed:0,failed:rows.length,error:'当前批次不能使用本租户分配规则。'};
    }
    const state = DReview21.state();
    if (!state || !DReview21.isLatest(state)) {
      return {routed:0,failed:0,pending:rows.length,error:'当前租户资料已变化，请刷新后再操作。'};
    }
    const allocationRules = manualAllocationRules(context,batch.businessType);
    const selected = allocationRules.find(rule=>rule.id===ruleId);
    if (!ruleId || !batch.assignmentRuleId || !batch.assignmentRuleVersion) {
      return {routed:0,failed:0,pending:rows.length,error:'未指定有效分配规则，本批不执行分配。'};
    }
    if (batch.assignmentRuleId !== ruleId || !selected || selected.version !== batch.assignmentRuleVersion) {
      return {routed:0,failed:0,pending:rows.length,error:'本批确认的分配规则版本已变化，请核对原批次。'};
    }
    const log = window.DBatchFailureLog;
    const attemptId = crypto.randomUUID();
    function markFailures(failures) {
      for (const {row,reason,requestId} of failures) {
        log?.record(context,'assignment',{key:'file:' + batch.id + ':' + row.id + ':' + attemptId,
          reason,batchId:batch.id,leadCode:row.externalDocumentId,rowNumber:row.sourceLine,
          requestId:requestId || batch.id});
      }
    }
    function failBatch(reason) {
      markFailures(rows.map(row=>({row,reason})));
      return {routed:0,failed:rows.length,error:reason};
    }
    const profile = window.DSkynetConfig.intakeFieldProfile(context,batch.businessType);
    const failures = [];
    const result = persistSkynet(state,()=>{
      let routed = 0, failed = 0, pending = 0;
      for (const [index,row] of rows.entries()) {
        const payload = manualBatchPayload(profile,row,batch.importFields || []);
        const requestId = 'FILE-' + batch.id + '-' + (index+1);
        const start = DSkynetIntake.start(state,context,{
          ...payload,
          categoryId:batch.businessType,assignmentRuleId:selected.id,sourceApplicationId:'MANUAL-BATCH',
          requestId
        });
        if (!start.receipt) {
          if (explicitIntakeRejection(start.error)) failures.push({row,reason:start.error,requestId});
          else pending++;
          continue;
        }
        if (!start.duplicate) {
          start.receipt.importBatchId = batch.id;
          start.receipt.importBatchRowId = row.id;
          if (Number.isSafeInteger(row.sourceLine) && row.sourceLine > 0) start.receipt.sourceLine = row.sourceLine;
        }
        const processed = DSkynetIntake.process(state,context,start.receipt.id,nativeWindow);
        if (!processed.receipt) pending++;
        else {
          const receipt = processed.receipt;
          if (log?.receiptFailure(receipt) || log?.confirmedAllocationFailure(receipt.nurtureProcessing?.allocation)) failed++;
          else if (receipt.status === '待处理' || receipt.nurtureProcessing?.waitingForTarget ||
              receipt.nurtureProcessing?.waitingForDeliveryTarget) pending++;
          else routed++;
        }
      }
      return {routed,failed,pending};
    },false);
    if (result.error) return result.saveFailed ? failBatch(result.error) :
      {routed:0,failed:0,pending:rows.length,error:result.error};
    markFailures(failures);
    return {routed:result.routed,failed:result.failed+failures.length,pending:result.pending};
  }

  function explicitIntakeRejection(error) {
    return [
      '请输入 1 至 100 字的请求标识。','请选择当前可用的来件来源。','必须传入分配规则 ID。',
      '所选分配规则在当前租户不可用。','所选分配规则与来件二级分类不一致。','请选择当前目录中可用的二级分类。'
    ].includes(error);
  }

  function completeSkynetReceipt(creator, receiptId, update, startIfIdle = true) {
    const key = JSON.stringify([creator.scope.id, receiptId]);
    if (processingReceipts.has(key)) {
      processingReceipts.get(key).push(update);
      return;
    }
    if (!startIfIdle) return;
    processingReceipts.set(key, [update]);
    setTimeout(() => {
      const callbacks = processingReceipts.get(key);
      processingReceipts.delete(key);
      const actual = DSession.context();
      if (identity(actual) !== identity(creator) || !DSkynetIntake.canSubmit(actual)) return;
      const nativeWindow = document.querySelector('iframe[data-native-module="cloud"]')?.contentWindow;
      const state = DReview21.state({reload:true});
      const result = persistSkynet(state, () => DSkynetIntake.process(state, actual, receiptId, nativeWindow), false);
      callbacks.forEach(callback => callback(result));
      if (result.receipt && DApp.currentPage() === 'PAGE-2204') {
        const detail = nativeWindow?.document.querySelector('[data-skynet-batch-detail]');
        nativeWindow?.RouteRuntime?.refreshCurrent();
        if (detail?.dataset.skynetBatchDetail === receiptId) {
          nativeWindow.FourNodeWorkspace?.showBatchReceipt(receiptId, result.receipt.sourceApplicationId);
        }
      }
      if (result.receipt && nativeWindow?.frameElement && DApp.currentPage() === 'PAGE-2226') {
        const options = {id:'PAGE-2226',frame:nativeWindow.frameElement,context:actual};
        if (canMount(options,nativeWindow.document)) mountIntakeTasks(options,nativeWindow.document);
      }
    }, 720);
  }

  function openSkynetImport(options, doc) {
    if (!canMount(options, doc) || !DSkynetIntake.canSubmit(options.context)) return;
    const config = DSkynetIntake.configuration(options.context);
    const settings = DSkynetConfig;
    const businessTypes = settings.businessTypes(options.context);
    const rulesOf = categoryId => manualAllocationRules(options.context,categoryId);
    const defaultType = businessTypes.find(item => item.value === config.categoryId);
    const initialType = (defaultType && rulesOf(defaultType.value).length ? defaultType :
      businessTypes.find(item=>rulesOf(item.value).length)) || defaultType || businessTypes[0];
    const sources = DSkynetIntake.sourceOptions(options.context);
    const ui = doc.defaultView.PlatformUI;
    const formId = 'review-skynet-intake-form';
    const sampleOptions = config.samples.map(sample => skynetOption({value:sample.id,label:sample.label})).join('');
    ui.openLayer(skynetLayer, `
      <div class="layer-header"><h2>模拟来件</h2></div>
      <div class="layer-body">
        <p class="field-hint"><span data-skynet-current-type></span> · <span data-skynet-current-rule></span></p>
        <p class="field-hint" data-skynet-input-profile></p>
        <p class="field-hint">每笔来件须指定分配规则。更换来源、样例、二级分类或分配规则会生成新请求标识。</p>
        <form id="${formId}" data-skynet-form novalidate>
          <div class="skynet-fields">
            <label class="field"><span>来源应用 <em>*</em></span><select name="sourceApplicationId" required>${sources.map(skynetOption).join('')}</select></label>
            <label class="field"><span>二级分类 <em>*</em></span><select name="categoryId" required>
              ${businessTypes.length ? businessTypes.map(skynetOption).join('') : '<option value="">暂无可选二级分类</option>'}
            </select></label>
            <label class="field"><span>分配规则 <em>*</em></span><select name="assignmentRuleId" required></select></label>
            <label class="field"><span>演示样例</span><select name="sample">${sampleOptions}</select></label>
            <label class="field"><span>请求标识 <em>*</em></span><input name="requestId" maxlength="100" required></label>
            <div data-skynet-profile-fields style="display:contents"></div>
            <label class="field" data-skynet-external-history><span>外部历史模拟结果</span><select name="historyCase">${config.historyCases.map(skynetOption).join('')}</select></label>
          </div>
        </form>
        <p data-skynet-receipt-result role="status" class="fnw-note" hidden></p>
      </div>
      <div class="layer-footer">
        <button type="button" class="btn" data-skynet-close>关闭</button>
        <button type="button" class="btn" data-skynet-view-batch hidden>查看本次来件</button>
        <button type="submit" class="btn btn-primary" form="${formId}" data-skynet-submit disabled>提交模拟来件</button>
      </div>`, 'wide', {backdropGuard:false});
    const layer = doc.getElementById(skynetLayer);
    const form = layer.querySelector('[data-skynet-form]');
    const resultNode = layer.querySelector('[data-skynet-receipt-result]');
    const batchButton = layer.querySelector('[data-skynet-view-batch]');
    const submitButton = layer.querySelector('[data-skynet-submit]');
    const typeControl = form.elements.categoryId;
    const ruleControl = form.elements.assignmentRuleId;
    const typeSummary = layer.querySelector('[data-skynet-current-type]');
    const ruleSummary = layer.querySelector('[data-skynet-current-rule]');
    const historyField = form.querySelector('[data-skynet-external-history]');
    const historyControl = form.elements.historyCase;
    const fieldContainer = form.querySelector('[data-skynet-profile-fields]');
    const profileSummary = layer.querySelector('[data-skynet-input-profile]');
    typeControl.value = initialType?.value || '';
    let fields = [];
    let request;
    function resetRequest() {
      form.elements.requestId.value = 'TW-' + crypto.randomUUID().slice(0,8).toUpperCase();
      request = null;
      resultNode.hidden = true;
      batchButton.hidden = true;
    }
    function updateRuleChoices() {
      const rules = rulesOf(typeControl.value);
      ruleControl.innerHTML = skynetOption({value:'',label:rules.length ? '请选择分配规则' : '该二级分类暂无分配规则'}) +
        rules.map(rule => skynetOption({value:rule.id,label:rule.name + ' · ' + rule.id + ' · v' + rule.version})).join('');
      ruleControl.disabled = !rules.length;
      if (rules.length === 1) ruleControl.value = rules[0].id;
      updateBusinessType();
    }
    function updateBusinessType() {
      const type = businessTypes.find(item => item.value === typeControl.value);
      const rule = type && settings.ruleById(settings.read(options.getState()),ruleControl.value,type.value);
      typeSummary.textContent = type ? '二级分类 ' + type.label : '未选择二级分类';
      ruleSummary.textContent = rule ? rule.name + ' v' + rule.version : ruleControl.disabled ?
        '此分类暂无可用分配规则，请先在分配规则中启用配置' : '请选择分配规则';
      submitButton.disabled = !rule;
      historyField.hidden = !rule || Boolean(rule.cleaning);
      historyControl.disabled = historyField.hidden;
      const values = Object.fromEntries(fields.map(field => [field.key,readSkynetField(form.elements.namedItem(field.key))]));
      const profile = type && settings.intakeFieldProfile(options.context,type.value);
      const fieldNode = rule?.nodes?.find(node => node.id === 'fields');
      fields = profile ? DSkynetIntake.fieldsForRule(profile,fieldNode) : [];
      fieldContainer.innerHTML = fields.map(skynetField).join('');
      for (const field of fields) populateSkynetField(form.elements.namedItem(field.key),field,values[field.key]);
      profileSummary.textContent = profile ? '基础校验字段来源 · ' + profile.sourceLabel : '';
    }
    function fillSample() {
      const sample = config.samples.find(item => item.id === form.elements.sample.value);
      resetRequest();
      const input = {...sample?.input};
      if (sample?.id === 'matched') {
        const state = DReview21.state({reload:true});
        const used = new Set([...(state?.records || []).map(row=>row.phone),
          ...(state?.skynetReceipts || []).map(row=>row.values?.phone)]);
        let index = 1, phone;
        do { phone = '1380018' + String(index++).padStart(4,'0'); } while (used.has(phone));
        Object.assign(input,{phone,originalKey:'SIM-'+form.elements.requestId.value,
          leadAt:new Date(Date.now()+8*3600000).toISOString().slice(0,16)});
      }
      for (const field of fields) populateSkynetField(form.elements.namedItem(field.key),field,input[field.key]);
      historyControl.value = input.historyCase || '';
    }
    function show(result) {
      if (!layer.isConnected || !canMount(options, doc)) return;
      const receipt = result.receipt;
      resultNode.hidden = false;
      resultNode.dataset.status = receipt?.status || '';
      resultNode.dataset.receiptId = receipt?.id || '';
      batchButton.hidden = !receipt;
      resultNode.textContent = result.error ||
        [result.duplicate ? '沿用原请求' : '', receipt.requestId, receipt.category, receipt.status, receipt.taskId, receipt.reason,
          receipt.status === '处理中' ? '' : receipt.taskId ? '可在「来件生成的业务」查看' : '本次来件未生成业务'].filter(Boolean).join(' · ');
    }
    form.elements.sample.addEventListener('change', fillSample);
    form.elements.sourceApplicationId.addEventListener('change', () => { updateRuleChoices(); resetRequest(); });
    typeControl.addEventListener('change', () => { updateRuleChoices(); resetRequest(); });
    ruleControl.addEventListener('change', () => { updateBusinessType(); resetRequest(); });
    layer.querySelector('[data-skynet-close]').onclick = () => ui.closeLayer(skynetLayer);
    batchButton.onclick = () => {
      if (!canMount(options, doc) || !resultNode.dataset.receiptId) return;
      ui.closeLayer(skynetLayer);
      openSkynetReceipt(resultNode.dataset.receiptId);
    };
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!canMount(options, doc) || !DSkynetIntake.canSubmit(DSession.context())) return;
      const state = DReview21.state({reload:true});
      const actual = DSession.context();
      const data = new FormData(form);
      const input = Object.fromEntries(data);
      for (const field of fields) if (field.type === 'multiselect') input[field.key] = data.getAll(field.key);
      const result = persistSkynet(state, () => DSkynetIntake.start(state, actual, input), true);
      if (result.saveFailed || explicitIntakeRejection(result.error)) window.DBatchFailureLog?.record(actual,'import',{
        leadCode:input.originalKey,requestId:input.requestId,reason:result.error
      });
      request = result.receipt?.id;
      show(result);
      if (result.receipt?.status === '处理中') {
        const receiptId = result.receipt.id;
        completeSkynetReceipt(actual, receiptId, outcome => {
          if (request === receiptId) show({...outcome, duplicate:result.duplicate});
        }, !result.duplicate);
      }
    });
    void window.DSkynetOutboundTargets?.load(options.context);
    updateRuleChoices();
    fillSample();
  }

  function mountSkynetImport(options, doc) {
    if (!window.DSkynetIntake?.canSubmit(options.context)) return;
    if (doc.defaultView.RouteRuntime?.snapshot?.()?.key !== 'business-records') return;
    const actions = doc.querySelector('#page-content .fnw-workspace .page-title-row > .page-actions');
    if (!actions || actions.querySelector('[data-skynet-open]')) return;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary';
    button.dataset.skynetOpen = '';
    button.textContent = '模拟来件';
    button.onclick = () => openSkynetImport(options, doc);
    actions.appendChild(button);
  }

  function receiptDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? '—' :
      new Intl.DateTimeFormat('zh-CN', {timeZone:'Asia/Shanghai', dateStyle:'short', timeStyle:'short'}).format(date);
  }

  function taskDisposition(receipt, task) {
    if (window.DReview21Intake.receiptStatus(receipt.status) !== '已接收') return '—';
    if (receipt.needsNurture === false || task?.needsNurture === false) return '无需培育';
    if (!task?.taskId) return '任务结果待核';
    if (task.ownerId) return '已分配';
    if (task.taskStatus === '待接听') return '等待接听';
    if (task.taskStatus === '未接听') return '未接听';
    if (task.requiredMode === 'AI 外呼') return 'AI 执行待核';
    if (task.taskStatus === '待分配') return '等待分配';
    return '待安排';
  }

  function manualBatchOperatorSeat(context, state) {
    if (!DSession.roleKey(context).endsWith('_ops') || !state?.seatId ||
        state.tenant !== context.scope.id || !window.DReview21?.isLatest(state)) return '';
    const seats = (state.seats || []).filter(seat => seat.id === state.seatId && seat.tenant === state.tenant);
    const [seat] = seats;
    return seats.length === 1 && seat.accountId === context.account.id && seat.enabled &&
      seat.bindingState === '已关联' ? seat.id : '';
  }

  function ownManualBatchTasks(context, state) {
    const own = new Set(), seen = new Set();
    const seatId = manualBatchOperatorSeat(context,state);
    const service = window.DSkynetIntake;
    if (!seatId || !service || !Array.isArray(state.records)) return own;
    for (const task of state.records) {
      if (!task?.taskId || !service.isTask(task) || !service.inScope(context,task)) continue;
      if (seen.has(task.taskId)) own.delete(task.taskId);
      else if (task.ownerId === seatId) own.add(task.taskId);
      seen.add(task.taskId);
    }
    return own;
  }

  function manualBatchOwnedRowIds(frameWindow,batch) {
    const frame = frameWindow?.frameElement;
    const context = frameWindow?.DNativeContext?.context;
    if (!frame || !matchesContext({id:'PAGE-2204',frame,context},frameWindow.document) ||
        !batch?.manualBatch || !batch.ruleDriven || !batch.id ||
        batch.tenantId !== context.scope.id || batch.brandId !== context.scope.tenant.brandId ||
        String(batch.enterpriseId) !== String(context.scope.tenant.enterpriseId) ||
        !Array.isArray(batch.rows)) return [];
    const state = window.DReview21?.state({reload:true});
    const own = ownManualBatchTasks(context,state);
    if (!own.size) return [];
    const service = window.DSkynetIntake;
    const fileRows = new Map(), receipts = new Map();
    for (const row of batch.rows) {
      if (row?.id) fileRows.set(row.id,!fileRows.has(row.id));
    }
    for (const receipt of state.skynetReceipts || []) {
      const id = receipt?.importBatchRowId;
      if (receipt?.sourceApplicationId !== 'MANUAL-BATCH' || receipt.importBatchId !== batch.id ||
          !fileRows.get(id) || !service.inScope(context,receipt)) continue;
      receipts.set(id,!receipts.has(id) && service.canRead(context,receipt) && own.has(receipt.taskId));
    }
    return [...receipts.keys()].filter(id=>receipts.get(id));
  }

  function readSkynetReceipts(context, state) {
    const service = window.DSkynetIntake;
    if (!service?.canRead(context)) return [];
    const config = service.configuration(context);
    const operator = DSession.roleKey(context).endsWith('_ops');
    const own = operator ? ownManualBatchTasks(context,state) : null;
    const tasks = new Map(state.records.filter(record => service.isTask(record) && service.inScope(context, record))
      .map(record => [record.taskId, record]));
    return (state.skynetReceipts || []).filter(receipt => service.canRead(context, receipt) &&
      (!own || receipt.sourceApplicationId !== 'MANUAL-BATCH' || own.has(receipt.taskId))).map(receipt => {
      const task = tasks.get(receipt.taskId);
      const seat = task?.ownerId ? state.seats.find(row => row.id === task.ownerId && row.tenant === state.tenant) : null;
      const processing = receipt.nurtureProcessing;
      const target = task?.skynet.processing?.targetTaskId ? task.skynet.processing : processing;
      const sourceLabel = receipt.source || '天网';
      const taskStatus = task?.taskStatus || processing?.status;
      const delivery = task && service.deliveryState?.(task);
      const deliveryStatus = delivery?.status === '已下发' ?
        (delivery.trigger === 'automatic' ? '已自动下发（模拟）' : '已下发（模拟）') : delivery?.status;
      const deliveryTarget = delivery?.target;
      const receivingTenants = delivery?.targets?.map(item=>item.label).join('、');
      const pendingReason = taskStatus === '待处理' ? task?.waitReason : '';
      const cold = task?.skynet.coldTransfer;
      const disposition = deliveryStatus ? [...new Set([taskStatus,deliveryStatus,seat?.name].filter(Boolean))].join(' · ') :
        task?.ownerId ? [taskStatus || receipt.status,seat?.name].filter(Boolean).join(' · ') :
        [taskStatus || receipt.status,processing?.destination].filter(Boolean).join(' · ');
      return {
        kind:'receipt', skynet:true, batchId:receipt.id, importBatchId:receipt.importBatchId,
        importBatchRowId:receipt.importBatchRowId,
        ...(Number.isSafeInteger(receipt.sourceLine) && receipt.sourceLine > 0 ? {sourceLine:receipt.sourceLine} : {}),
        name:receipt.requestId, at:receipt.receivedAt,
        receiptSource:receipt.sourceApplicationId, sourceLabel, receiptStatus:receipt.status,
        categoryId:receipt.categoryId, categoryName:receipt.category, originalKey:receipt.originalKey, disposition,
        details:[
          ['批次编号', receipt.id], ['请求标识', receipt.requestId], ['来源', sourceLabel], ['接入应用编号', receipt.sourceApplicationId],
          ['二级分类', receipt.category], ['本地线索编码', receipt.localLeadCode ?? receipt.originalKey],
          ['传入线索编码', receipt.sourceLeadCode ?? receipt.originalKey], ['接入时间', receiptDate(receipt.receivedAt)],
          ['清洗完成时间', receiptDate(receipt.completedAt)], ['清洗结果', receipt.status], ['处理原因', receipt.reason],
          ['接入指定分配规则', receipt.assignmentRuleName], ['分配规则 ID', receipt.assignmentRuleId], ['分配规则版本', receipt.assignmentRuleVersion],
          ...(receipt.taskRelation === '接续在途任务' ? [
            ['原任务绑定分配规则', receipt.taskAssignmentRuleName || task?.skynet.assignmentRuleName],
            ['原任务分配规则 ID', receipt.taskAssignmentRuleId || task?.skynet.assignmentRuleId],
            ['原任务分配规则版本', receipt.taskAssignmentRuleVersion || task?.skynet.assignmentRuleVersion]
          ] : []),
          ['任务处理', receipt.taskRelation], ['培育任务', receipt.taskId], ['原轮次', receipt.roundId],
          ['本次命中培育模板', receipt.matchedTemplateName], ['本次命中培育模板版本', receipt.matchedTemplateVersion],
          ['本次命中下发模板', receipt.matchedDeliveryTemplateName], ['本次命中下发模板版本', receipt.matchedDeliveryTemplateVersion],
          ['原任务绑定培育模板', receipt.nurtureTemplateName || task?.skynet.nurtureTemplateName],
          ['原任务绑定培育模板版本', receipt.nurtureTemplateVersion],
          ['原任务绑定下发模板', receipt.deliveryTemplateName || task?.skynet.deliveryTemplateName],
          ['原任务绑定下发模板版本', receipt.deliveryTemplateVersion],
          ['当前待处理原因',pendingReason],
          ['目标外呼任务',target?.targetTaskName], ['目标外呼任务 ID',target?.targetTaskId],
          ['培育结束原因',task?.skynet.endReason],
          ['转冷目标分配规则',cold?.targetRuleName || cold?.targetRuleId], ['转冷后任务',cold?.taskId],
          ['转冷前培育任务',receipt.coldTransfer?.fromTaskId], ['转冷前轮次',receipt.coldTransfer?.fromRoundId],
          ['下发状态',deliveryStatus], ['下发方式',delivery?.modeLabel],
          ...(receivingTenants ? [['接收租户',receivingTenants]] :
            deliveryTarget ? [[deliveryTarget.type === 'internalTenant' ? '接收租户' : '接收系统',deliveryTarget.label]] : []),
          ['下发门店',receipt.leadDelivery?.storeName || delivery?.directStore?.name || delivery?.targetLabel],
          ['同步回访结果',receipt.nurtureResult?.result], ['同步意向等级',receipt.nurtureResult?.intentLevel],
          ...(delivery?.directDeliveryTarget?.fields || []).map(field=>['直发 · '+field.label,field.value]),
          ['下发时间',delivery?.sentAt ? receiptDate(delivery.sentAt) : ''],
          ['配置采用差异', receipt.templateDifference],
          ...(processing ? [
            ['处理方式',processing.method], ['处理去向',processing.destination], ['当前任务状态',taskStatus],
            [processing.missingFields?.length ? '待补数据的规则' : '命中策略规则',Number.isInteger(processing.ruleNumber) ?
              '第 ' + processing.ruleNumber + ' 条' + (Number.isInteger(processing.priority) ? '（优先级 ' + processing.priority + '）' : '') : '']
          ] : [['承接动作', receipt.nurtureAction],['处理去向', disposition]]),
          ...(processing?.allocation ? [
            ['自动分配策略',processing.allocation.strategyLabel], ['自动分配结果',processing.allocation.status],
            ['目标坐席',processing.allocation.seatName], ['分配说明',processing.allocation.reason],
            ['排序依据',processing.allocation.tieBreak],
            ['候选坐席',processing.allocation.candidates.map(candidate => candidate.eligible ?
              candidate.seatName + '（第 ' + candidate.rank + ' 位，' + processing.allocation.metricLabel + ' ' + candidate.value + '）' :
              candidate.seatName + '（' + candidate.reason + '）').join('、')]
          ] : []),
          ...(receipt.deliveryPlan && !delivery ? [
            ['计划交接方式',receipt.deliveryPlan.method],
            ['计划接收目标',receipt.deliveryPlan.target?.label || receipt.deliveryPlan.target],
            ...Object.entries(receipt.deliveryPlan.mappedFields || {}).map(([field,value]) => ['直发映射 · ' + field,value])
          ] : [])
        ].filter(([,value]) => value != null && value !== ''),
        trace:receipt.trace,
        values:(receipt.inputProfile?.fields || config.fields).map(field => {
          const value = receipt.values?.[field.key];
          return [field.label, Array.isArray(value) ? value.join('、') : value];
        }),
        taskId:receipt.taskId || task?.taskId,
        canOpenTask:!!task && window.DReview21Operations?.canManage(context) && DSession.allowed('PAGE-21008', context),
        canResume:receipt.status === '处理中' && service.canSubmit(context)
      };
    });
  }

  function readBatchReceipts(frameWindow) {
    const frame = frameWindow.frameElement;
    const context = frameWindow.DNativeContext?.context;
    const options = {id:'PAGE-2204', frame, context};
    if (!frame || !matchesContext(options, frameWindow.document)) return [];
    const state = window.DReview21?.state({reload:true});
    if (state?.tenant !== context.scope.id) return [];
    const skynet = readSkynetReceipts(context, state);
    if (state.role !== 'admin' || !canMount(options, frameWindow.document)) return skynet;
    const tasks = new Map(state.records.filter(record => record.tenant === state.tenant).map(record => [record.id, record]));
    const existing = (state.intakeHistory || []).filter(receipt => receipt.tenant === state.tenant).map(receipt => {
      const task = tasks.get(receipt.recordId);
      const receiptStatus = window.DReview21Intake.receiptStatus(receipt.status);
      const disposition = taskDisposition(receipt, task);
      const nurture = receipt.needsNurture ?? task?.needsNurture;
      return {kind:'receipt', batchId:receipt.requestNo, name:receipt.requestNo, at:receipt.receivedAt,
        receiptSource:receipt.sourceApplicationId || receipt.source,
        categoryId:receipt.categoryContext, categoryName:receipt.category, originalKey:receipt.originalKey,
        sourceLabel:receipt.source, receiptStatus, disposition, details:[
          ['来件编号', receipt.requestNo], ['来源', receipt.source], ['接入应用编号', receipt.sourceApplicationId], ['业务分类', receipt.category],
          ['来源线索编号', receipt.originalKey], ['原接入时间', receiptDate(receipt.receivedAt)],
          ['接入结果', receiptStatus], ['是否需要培育', nurture == null ? '—' : nurture ? '是' : '否'],
          ['任务处理', receipt.taskRelation], ['培育任务', task?.taskId],
          ['处理去向', disposition],
          ['处理说明', task?.waitReason || receipt.detail]
        ]};
    });
    return [...existing, ...skynet];
  }

  function openSkynetReceipt(id) {
    const context = DSession.context();
    const receipt = DReview21.state()?.skynetReceipts?.find(item => item.id === id);
    if (!receipt || !DSkynetIntake.canRead(context, receipt) || !DSession.allowed('PAGE-2204', context)) return false;
    receiptToOpen = {id, identity:identity(context)};
    return DApp.openPage('PAGE-2204', {menuEntry:true});
  }

  function mountSkynetReceipt(options, doc) {
    if (!receiptToOpen || !matchesContext(options, doc)) return;
    if (receiptToOpen.identity !== identity(options.context)) {
      receiptToOpen = null;
      return;
    }
    if (!doc.querySelector('#page-content .fnw-batches-page')) return;
    const receipt = readBatchReceipts(doc.defaultView).find(row => row.skynet && row.batchId === receiptToOpen.id);
    receiptToOpen = null;
    if (receipt) doc.defaultView.FourNodeWorkspace?.showBatchReceipt(receipt.batchId, receipt.receiptSource);
  }

  function mountIncomingLedger(options, doc) {
    const actions=doc.querySelector('#page-content .fnw-batches-page .page-title-row .page-actions');
    if (!actions || !matchesContext(options, doc)) return;
    const existing=actions.querySelector('[data-skynet-incoming-ledger]');
    if (!window.DSkynetDeliveryRecords?.canView('incoming')) {
      existing?.remove();
      return;
    }
    if (existing) return;
    const button=doc.createElement('button');
    button.type='button';
    button.className='btn';
    button.dataset.skynetIncomingLedger='';
    button.textContent='内部接收记录';
    button.onclick=() => {
      if (matchesContext(options,doc)) window.DReview21InlineHandoff.openSkynetLedger('incoming',{trigger:button});
    };
    actions.appendChild(button);
  }

  function resumeSkynetReceipt(frameWindow, id, onFailure) {
    const receipt = readBatchReceipts(frameWindow).find(row => row.skynet && row.batchId === id && row.canResume);
    if (!receipt) return false;
    completeSkynetReceipt(DSession.context(), id, result => {
      if (result.error) {
        DReview21.notify(result.error);
        onFailure?.();
      }
    });
    return true;
  }

  function mountIntakeTasks(options, doc) {
    const shell = doc.querySelector('#page-content .fnw-workspace:not(.fnw-batches-page) .management-list-shell');
    const position = doc.defaultView.RouteRuntime?.snapshot?.();
    if (!shell || position?.key !== 'business-records' || position.options?.batchDetail || position.options?.batchId) return;
    const state = DReview21.state({reload:true});
    if (state?.role !== 'admin' || state.tenant !== options.context.scope.id) return;

    const {context} = options;
    const category = doc.getElementById('fnw-category')?.value || '';
    const keyword = doc.getElementById('fnw-keyword')?.value?.trim().toLowerCase() || '';
    const assignment = doc.getElementById('fnw-assignment')?.value || '';
    const service = window.DSkynetIntake;
    const sourceIds = new Set(service.sourceOptions(context).map(source=>source.value));
    const receipts = new Map((state.skynetReceipts || []).filter(receipt=>sourceIds.has(receipt.sourceApplicationId) &&
      service.canRead(context,receipt)).map(receipt=>[receipt.id,receipt]));
    const legacy = new Map((state.intakeHistory || []).filter(row=>row.tenant===state.tenant && row.recordId)
      .map(row => [row.recordId, row]));
    const linked = state.records.flatMap(record=>{
      if (!record || record.tenant!==state.tenant) return [];
      if (service.isTask(record)) {
        if (!service.inScope(context,record)) return [];
        const receipt = [record.skynet.latestIntakeId,record.skynet.intakeId].map(id=>receipts.get(id)).find(item=>
          item && item.taskId===record.taskId && item.recordId===record.id);
        return receipt ? [{record,receipt,receiptId:receipt.id,categoryId:receipt.categoryId}] : [];
      }
      const receipt = legacy.get(record.id);
      return receipt ? [{record,receipt,categoryId:receipt.categoryContext}] : [];
    });
    let section = doc.querySelector('[data-review21-intake-task-list]');
    if (!linked.length) { section?.remove(); return; }
    const rows = linked.filter(({record,categoryId})=>(!category || categoryId===category) &&
      (!keyword || [record.name,record.localLeadCode,record.originalKey,record.phone,record.taskId].some(value=>String(value || '').toLowerCase().includes(keyword))) &&
      (!assignment || Boolean(record.ownerId)===(assignment==='assigned'))).map(({record,receipt,receiptId})=>({
        code:record.localLeadCode || record.originalKey, category:record.category, name:record.name, taskId:record.taskId,
        mode:record.requiredMode || record.callMode, owner:state.seats.find(seat=>seat.id===record.ownerId)?.name || '',
        status:window.DReview21Workbench.progress(record), detail:record.waitReason || '', receiptId,
        date:receiptDate(receipt.completedAt || receipt.receivedAt)
      }));
    const signature = JSON.stringify(rows);
    if (section?.dataset.signature===signature) return;
    if (!section) {
      section = doc.createElement('section');
      section.className = 'panel-card';
      section.dataset.review21IntakeTaskList = '';
      shell.before(section);
    }
    section.dataset.signature = signature;
    const ui = doc.defaultView.PlatformUI;
    const columns = [
      {key:'code',label:'业务编码'}, {key:'category',label:'业务分类'}, {key:'name',label:'客户'},
      {key:'taskId',label:'任务编号'}, {key:'mode',label:'办理方式'}, {key:'owner',label:'跟进坐席'},
      {key:'status',label:'处理进度',render:(status,row)=>esc(status)+(row.detail?'<small class="fnw-secondary">'+esc(row.detail)+'</small>':'')},
      {key:'date',label:'更新时间'}, {key:'receiptId',label:'操作',render:id=>id?
        '<button type="button" class="btn-link" data-review-intake-receipt="'+esc(id)+'">查看来件</button>':'—'}
    ];
    section.innerHTML = '<div class="panel-header"><h3>来件生成的业务</h3><span>共 '+rows.length+' 条</span></div>'+ui.table(columns,rows,
      {emptyText:'当前筛选暂无来件生成的业务'});
    if (rows.length) section.querySelectorAll('tbody tr').forEach(row=>{row.dataset.review21IntakeTask = '';});
    section.onclick = event=>{
      const button = event.target.closest('[data-review-intake-receipt]');
      if (button && canMount(options,doc)) openSkynetReceipt(button.dataset.reviewIntakeReceipt);
    };
  }

  function mount(options) {
    if (!options?.frame || typeof options.getState !== 'function') return;
    let doc;
    try { doc = options.frame.contentDocument; } catch { return; }
    if (options.id === 'PAGE-2204') {
      mountIncomingLedger(options, doc);
      return mountSkynetReceipt(options, doc);
    }
    if (options.id !== 'PAGE-2226' || !canMount(options, doc)) return;
    mountSkynetImport(options, doc);
    mountIntakeTasks(options, doc);
  }

  window.DReview21InlineIntake = {mount,readBatchReceipts,manualBatchOwnedRowIds,openSkynetReceipt,resumeSkynetReceipt,
    manualAllocationRules,routeManualBatch,validateManualBatchRow};
})();
