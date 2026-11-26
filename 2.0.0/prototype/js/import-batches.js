(() => {
  'use strict';

  // These functions run in the native Cloud workspace alongside its existing import and list helpers.
  function batchPageScope() {
    const session = parent.DSession;
    const scope = session?.context();
    const frameScope = window.DNativeContext?.context;
    if (parent.DApp?.currentPage() !== 'PAGE-2204' || !session?.allowed('PAGE-2204') ||
        scope?.scope.kind !== 'tenant' || scope.account.id !== frameScope?.account.id ||
        scope.scope.id !== frameScope?.scope.id || RouteRuntime.snapshot()?.key !== 'customer-tasks') return null;
    return scope;
  }

  function canImportManualBatch() {
    return !!batchPageScope() && parent.DSession.canWrite('PAGE-2204') &&
      parent.DSession.can('F24') && canImportCustomers();
  }

  function legacyBatchCanAssign(batch) {
    return Boolean(batch && !batch.ruleDriven && !['PAGE-2204','PAGE-2226','PAGE-2227'].includes(parent.DApp?.currentPage()));
  }

  function manualBatchCategories() {
    const scope = batchPageScope()?.scope;
    if (!scope?.tenant?.brandId) return {status:'failed',message:'当前租户的业务分类暂无法读取。'};
    const {brandId,enterpriseId} = scope.tenant;
    const result = flowCall('catalogs',brandId);
    if (result.status !== 'success') return result;
    const directory = CustomerBusiness.catalog({brandId,tenantId:scope.id,enterpriseId});
    if (!directory.ok || !Array.isArray(directory.categoryFamilies)) {
      return {status:'failed',message:'当前品牌的一级分类暂无法读取，请刷新后重试。'};
    }
    const families = new Map(directory.categoryFamilies.map(row => [row.id,row]));
    const definitions = new Map(directory.rows.filter(row=>row.enabled!==false).map(row=>[row.id,row]));
    const data = (result.data.categories || []).flatMap(category => {
      const latest = flowLatest(category);
      const definition = definitions.get(category.categoryId);
      if (!definition || category.enabled === false || !latest || latest.enabled === false ||
          (category.brandId && category.brandId !== brandId)) return [];
      const family = families.get(CustomerBusiness.familyId(definition));
      return family ? [{...category,manualFamilyId:family.id,manualFamilyName:family.label}] : [];
    });
    const usable = new Set(data.map(row=>row.manualFamilyId));
    return {...result,data,families:directory.categoryFamilies.filter(row=>usable.has(row.id))};
  }

  function manualBatchSelected(categories = templateImportMeta?.categories) {
    const family = document.getElementById('customer-import-primary-type')?.value;
    const category = document.getElementById('customer-import-business-type')?.value;
    return family && category ? categories?.find(row=>row.manualFamilyId===family && row.categoryId===category) : undefined;
  }

  function manualBatchFamilyChanged() {
    if (!templateImportMeta?.manualBatch) return;
    const family = document.getElementById('customer-import-primary-type').value;
    const select = document.getElementById('customer-import-business-type');
    const rows = templateImportMeta.categories.filter(row => row.manualFamilyId === family);
    select.innerHTML = '<option value="">' + (family ? '请选择二级业务分类' : '请先选择一级业务分类') + '</option>' +
      rows.map(row=>'<option value="'+esc(row.categoryId)+'">'+esc(flowLatest(row).name || row.name)+'</option>').join('');
    select.value = '';
    select.disabled = !rows.length;
    templateTypeChanged();
  }

  function manualBatchColumns(columns, categoryId) {
    const context = batchPageScope();
    const config = parent.DSkynetConfig;
    if (!context || !categoryId || !config?.businessType(context,categoryId)) return columns;
    const profile = config.intakeFieldProfile(context,categoryId);
    const keys = new Set(columns.flatMap(field=>[field.key,field.businessKey]));
    const additional = (profile?.fields || []).filter(({key,businessKey})=>
      !['originalKey','name','phone'].includes(key) && !keys.has(key) && !keys.has(businessKey)).map(field=>({
      key:field.key, label:field.label, businessKey:field.businessKey || field.key, required:field.required === true,
      type:field.type === 'datetime-local' ? 'text' : field.type,
      ...(field.options?.length ? {options:field.options.map(option=>({
        id:option.value,businessKey:option.value,label:option.label,enabled:true
      }))} : {})
    }));
    return [...columns,...additional];
  }

  function manualBatchInput() {
    if (!canImportManualBatch() || templateImportMeta.context !== batchContext()) {
      throw Error('账号或租户已变化，请重新打开手工导入');
    }
    const reason = dCustomerReason();
    if (reason) throw Error(reason);
    const categoryId = document.getElementById('customer-import-business-type').value;
    const name = document.getElementById('customer-batch-name').value.trim();
    const text = document.getElementById('customer-import-text').value;
    const result = manualBatchCategories();
    if (result.status !== 'success') throw Error(result.message);
    const chosen = manualBatchSelected(result.data);
    const previous = manualBatchSelected();
    const latest = flowLatest(chosen);
    if (!latest || !previous || previous.manualFamilyName!==chosen.manualFamilyName ||
        JSON.stringify(latest) !== JSON.stringify(importCategoryMeta())) {
      throw Error('业务分类或导入字段已更新，请重新打开手工导入');
    }
    const context = batchPageScope();
    const config = parent.DSkynetConfig;
    const profile = config?.businessType(context,categoryId) && config.intakeFieldProfile(context,categoryId);
    const validateRow = parent.DReview21InlineIntake?.validateManualBatchRow;
    if (profile && !validateRow) throw Error('当前分类的导入字段暂不可核对，请刷新后重试。');
    const schema = dCustomerSchema();
    const parsed = dMappedImportRows(text, schema);
    const duplicateCheck = flowCall('manualBatchConflicts', categoryId, parsed.rows.map(row => String(row.code || '').trim()));
    if (duplicateCheck.status !== 'success') throw Error(duplicateCheck.message);
    const existingCodes = new Set(duplicateCheck.data);
    const customFields = schema.filter(field => !['code', 'name', 'phone', 'note'].includes(field.key));
    const importFields = customFields.map(({key,label,businessKey}) => ({key,label,businessKey}));
    const good = [], errors = [], seenCodes = new Set();
    for (const row of parsed.rows) {
      const phone = String(row.phone || '').replace(/[\s-]/g, '');
      const code = String(row.code || '').trim();
      const importedRow = {name: String(row.name || '').trim(), phone, note: row.note || '',
        externalDocumentId: code, sourceLine:row._line,
        importedValues:Object.fromEntries(customFields.filter(field => Object.hasOwn(row, field.key))
          .map(field => [field.key, row[field.key]]))};
      const problems = [...row._schemaErrors];
      if (profile && !problems.length) problems.push(...validateRow(profile,importedRow,importFields));
      if (code.length > 100) problems.push('业务编码不能超过100字');
      if (!problems.length && seenCodes.has(code)) problems.push('本批名单中的业务编码重复');
      if (!problems.length && existingCodes.has(code)) problems.push('当前业务分类已存在该业务编码');
      if (problems.length) {
        errors.push({line: row._line, phone, leadCode:code, reason: problems.join('；')});
        continue;
      }
      seenCodes.add(code);
      good.push(importedRow);
    }
    return {name, text, categoryId, familyId:chosen.manualFamilyId, familyName:chosen.manualFamilyName, categoryName: latest.name || latest.label, codeLabel: latest.codeLabel || '业务编码', importFields, good, errors};
  }

  function manualBatchConflicts(categoryId, codes) {
    return safe(() => {
      const actor = access();
      requireThat(actor.roleCode === 'ADMIN' && window.AppState?.canAction('customer.import'), 'IMPORT_DENIED', '当前人员没有本租户导入资格');
      const brand = bind(actor.tenantId).brandId;
      const category = canonicalCategory(categoryId);
      const submitted = new Set(codes.filter(Boolean));
      const matches = record => record.brandId === brand && canonicalCategory(record.categoryId) === category && submitted.has(record.businessCode);
      return [...new Set([...read().records, ...professionalEntries()].filter(matches).map(record => record.businessCode))];
    });
  }

  function fitManualBatchDrawer() {
    const layer = document.getElementById('customer-import');
    if (!layer?.querySelector('.r8-import-drawer')) return;
    const viewport = parent.innerWidth || window.innerWidth;
    layer.style.setProperty('--r8-import-width',viewport <= 760 ? '100%' : Math.round(viewport * 0.8) + 'px');
  }

  function setManualBatchStep(review) {
    const layer = document.getElementById('customer-import');
    if (!layer?.querySelector('.r8-import-drawer')) return;
    layer.dataset.r8ImportStep = review ? 'review' : 'prepare';
    for (const step of layer.querySelectorAll('[data-r8-import-indicator]')) {
      if (step.dataset.r8ImportIndicator === layer.dataset.r8ImportStep) step.setAttribute('aria-current','step');
      else step.removeAttribute('aria-current');
    }
    if (review) {
      layer.querySelector('.layer-body').scrollTop = 0;
      (layer.querySelector('[data-manual-batch-rule]:not([disabled])') ||
        layer.querySelector('#customer-import-confirm'))?.focus();
    }
  }

  function openManualImport() {
    if (!canImportManualBatch()) return showToast('当前账号没有手工导入权限','warning');
    const catalog = manualBatchCategories();
    if (catalog.status !== 'success') return showToast(catalog.message,'error');
    dImportMapping = null;
    templateImport = true;
    templatePreview = null;
    templateImportBusy = false;
    templateImportMeta = {
      manualBatch:true,categories:catalog.data || [],requestId:'BATCH-IMPORT-' + id(),
      context:batchContext(),unknown:false
    };
    const primaryOptions = catalog.families.map(row =>
      '<option value="' + esc(row.id) + '">' + esc(row.label) + '</option>').join('');
    ui.openLayer('customer-import', `
      <style>
        #customer-import > .r8-import-drawer{width:min(100%,var(--r8-import-width,80vw));max-width:none}
        .r8-import-drawer .layer-body{min-width:0}
        .r8-import-drawer [data-r8-import-indicator][aria-current=step]{color:#0958d9;font-weight:600}
        .r8-import-drawer .customer-import-steps{margin-bottom:20px}
        .r8-import-drawer .customer-import-basics{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:20px}
        .r8-import-drawer .r8-import-label{margin:0 0 12px;font-size:15px}
        .r8-import-drawer .r8-import-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}
        .r8-import-drawer .r8-import-upload{align-items:center;background:#f7faff;border:1px dashed #b8d2f6;border-radius:6px;gap:12px;padding:14px;margin-bottom:12px}
        .r8-import-drawer .r8-import-file-meta{display:grid;gap:4px;min-width:0;overflow-wrap:anywhere;font-size:13px}
        .r8-import-drawer .r8-import-field-list{display:flex;gap:6px 16px;flex-wrap:wrap;padding:10px 0}
        .r8-import-drawer .r8-import-field-list small{color:var(--muted,#667085)}
        .r8-import-drawer details summary{cursor:pointer;margin-bottom:6px}
        .r8-import-drawer .r8-import-review-card{padding:16px;border:1px solid #dde5ef;border-radius:6px;margin-bottom:12px}
        .r8-import-drawer .r8-import-review-card .field{max-width:520px}
        .r8-import-drawer .r8-import-preview-tables{display:grid;gap:14px;margin-top:14px}
        .r8-import-drawer .r8-import-preview-table{min-width:0;overflow-x:auto}
        .r8-import-drawer .r8-import-preview-table h3{margin:0 0 8px}
        #customer-import[data-r8-import-step=prepare] [data-r8-import-review],
        #customer-import[data-r8-import-step=review] [data-r8-import-prepare]{display:none}
        @media(max-width:640px){.r8-import-drawer .customer-import-basics{grid-template-columns:1fr}}
      </style>
      <div class="layer-header"><h2>导入客户名单</h2></div>
      <div class="layer-body customer-import-body">
        <div class="customer-import-steps" aria-label="导入步骤">
          <span data-r8-import-indicator="prepare">1 选择分类与名单</span><span aria-hidden="true">→</span>
          <span data-r8-import-indicator="review">2 校验预览与规则确认</span>
        </div>
        <div data-r8-import-prepare>
          <div class="customer-import-basics">
            <label class="field"><span>一级业务分类 <em>*</em></span>
              <select id="customer-import-primary-type" required onchange="CustomerTasks.manualBatchFamilyChanged()">
                <option value="">${primaryOptions ? '请选择一级业务分类' : '暂无可导入的一级业务分类'}</option>${primaryOptions}
              </select>
            </label>
            <label class="field"><span>二级业务分类 <em>*</em></span>
              <select id="customer-import-business-type" required disabled onchange="CustomerTasks.templateTypeChanged()">
                <option value="">请先选择一级业务分类</option>
              </select>
            </label>
            <label class="field customer-import-name"><span>批次名称 <em>*</em></span>
              <input id="customer-batch-name" maxlength="50" placeholder="例如：本周回访名单" oninput="CustomerTasks.invalidateTemplatePreview()">
            </label>
          </div>
          <section class="customer-import-section">
            <h3 class="r8-import-label">客户名单</h3>
            <div class="customer-import-upload r8-import-upload">
              <label for="customer-import-file" class="btn">选择 Excel / CSV 文件</label>
              <input id="customer-import-file" type="file" hidden accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onchange="CustomerTasks.readTemplateFile(this.files[0])">
              <div class="r8-import-file-meta"><span id="customer-import-filename">尚未选择文件</span>
                <span class="field-hint">支持 .xlsx、UTF-8 CSV，最大 1 MB。</span>
              </div>
            </div>
            <div class="r8-import-toolbar">
              <button type="button" class="btn" onclick="CustomerTasks.downloadImportTemplate('xlsx')">下载 Excel 模板</button>
              <button type="button" class="btn" onclick="CustomerTasks.downloadImportTemplate('csv')">下载 CSV 模板</button>
              <button type="button" class="btn" onclick="CustomerTasks.fillTemplateSample()">填入示例</button>
            </div>
            <details><summary>查看本分类导入字段</summary><div id="customer-import-schema"></div></details>
            <label class="field"><span>粘贴或编辑名单</span>
              <textarea id="customer-import-text" rows="6" oninput="CustomerTasks.invalidateTemplatePreview()"
                placeholder="选择分类后上传或粘贴名单"></textarea>
            </label>
          </section>
        </div>
        <div id="customer-import-preview" data-r8-import-review aria-live="polite"></div>
      </div>
      <div class="layer-footer">
        <span id="customer-import-readiness" role="status" aria-live="polite" style="margin-right:auto;color:#667085"></span>
        <button type="button" class="btn" onclick="PlatformUI.closeLayer('customer-import')">取消</button>
        <button type="button" class="btn" data-r8-import-review onclick="CustomerTasks.invalidateTemplatePreview()">返回编辑</button>
        <button type="button" class="btn btn-primary" id="customer-import-check" data-r8-import-prepare
          aria-describedby="customer-import-readiness" onclick="CustomerTasks.previewTemplateImport()">预览校验</button>
        <button type="button" class="btn btn-primary" id="customer-import-confirm" data-r8-import-review
          disabled aria-describedby="customer-import-readiness" onclick="CustomerTasks.confirmTemplateImport()">确认导入</button>
      </div>`, 'r8-import-drawer');
    fitManualBatchDrawer();
    window.addEventListener('resize',fitManualBatchDrawer);
    templateTypeChanged();
    dCustomerOpened();
  }

  function showManualBatchSchema(meta, columns, host) {
    if (host) host.innerHTML = meta ? '<div class="r8-import-field-list">' + columns.map(field =>
      '<span>' + esc(field.label) + (field.required ? ' <em>*</em>' : '') +
      (field.key === 'leadAt' ? ' <small>YYYY-MM-DDTHH:mm</small>' : '') + '</span>').join('') + '</div>' :
      '<p class="field-hint">请选择二级业务分类。</p>';
  }

  function updateManualBatchConfirm() {
    const preview = templatePreview;
    if (!preview) return;
    const selected = document.querySelector('#customer-import-preview [data-manual-batch-rule]')?.value || '';
    const ruleAvailable = preview.rules.some(rule => rule.id === selected && rule.version);
    const button = document.getElementById('customer-import-confirm');
    const status = document.getElementById('customer-import-readiness');
    if (button) button.disabled = (!preview.good.length && !preview.errors.length) || !ruleAvailable;
    if (status) status.textContent = ruleAvailable ? '' : preview.rules.length ? '请选择本批分配规则。' :
      '当前分类暂无可用分配规则，不能提交。';
  }

  function previewManualBatch() {
    invalidateTemplatePreview();
    try {
      const input = manualBatchInput();
      const host = document.getElementById('customer-import-preview');
      const rules = parent.DReview21InlineIntake?.manualAllocationRules?.(batchPageScope(), input.categoryId) || [];
      templatePreview = {...input,rules};
      const ruleField = '<label class="field"><span>本批分配规则 <em>*</em></span><select data-manual-batch-rule required' +
        (rules.length ? '' : ' disabled') + '><option value="">' +
        (rules.length ? '请选择分配规则' : '当前分类暂无可用分配规则') + '</option>' +
        rules.map(rule=>'<option value="'+esc(rule.id)+'">'+esc((rule.name || rule.id) + ' · v' + rule.version)+'</option>').join('') +
        '</select></label><p class="field-hint">' + (!rules.length ?
          '请先在当前租户为此分类启用可用分配规则，再重新预览；本次不保存名单。' :
          input.good.length ? '有效行将按选定规则办理。' : '没有有效行，选定分配规则后可记录逐行失败，不保存名单。') + '</p>';
      const good = input.good.length ? '<section class="r8-import-preview-table"><h3>有效行</h3>' +
        ui.table([{key:'sourceLine',label:'文件行号'},{key:'externalDocumentId',label:input.codeLabel},
          {key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'}],input.good.slice(0,10)) +
        (input.good.length > 10 ? '<p class="field-hint">预览前 10 条有效行。</p>' : '') + '</section>' : '';
      const errors = input.errors.length ? '<section class="r8-import-preview-table"><h3>未通过的行</h3>' +
        ui.table([{key:'line',label:'文件行号'},{key:'leadCode',label:input.codeLabel},
          {key:'reason',label:'未通过原因'}],input.errors.slice(0,30)) +
        (input.errors.length > 30 ? '<p class="field-hint">预览前 30 条失败行，全部失败行可在失败日志查询。</p>' : '') + '</section>' : '';
      host.innerHTML = '<section class="r8-import-review-card"><h3 class="r8-import-label">校验结果</h3><p>' +
        esc(input.familyName) + ' / ' + esc(input.categoryName) + ' · ' + esc(input.name) + '</p><p>可导入 ' + input.good.length +
        ' 条，未通过 ' + input.errors.length + ' 条。</p>' + ruleField +
        '</section><div class="r8-import-preview-tables">' + good + errors + '</div>';
      host.querySelector('[data-manual-batch-rule]')?.addEventListener('change',updateManualBatchConfirm);
      const confirm = document.getElementById('customer-import-confirm');
      confirm.textContent = input.good.length ? '确认导入' : '记录失败';
      updateManualBatchConfirm();
      setManualBatchStep(true);
    } catch (error) { showToast(error.message, 'warning'); }
  }

  async function confirmManualBatch() {
    if (!templatePreview || templateImportBusy) return false;
    const scope = batchPageScope();
    if (!scope) return false;
    const savedPreview = templatePreview;
    const {rules,...preview} = savedPreview;
    const metadata = templateImportMeta;
    const hadSelection = document.querySelector('#customer-import-preview [data-manual-batch-rule]')?.value || '';
    templateImportBusy = true;
    try {
      if (!rules.length) throw Error('当前分类暂无可用分配规则，不能提交。');
      const previousRule = rules.find(rule => rule.id === hadSelection && rule.version);
      if (!previousRule) throw Error('请先选择本批分配规则。');
      const review = parent.DReview21;
      const state = await review.ensureState({reload:true});
      const current = batchPageScope();
      if (templatePreview !== savedPreview || templateImportMeta !== metadata ||
          current?.scope.id !== scope.scope.id || current.account.id !== scope.account.id) return false;
      if (!state || !review.isLatest(state)) throw Error('当前分配规则暂无法核对，名单已保留，请重新预览。');
      const currentRules = parent.DReview21InlineIntake.manualAllocationRules(current,preview.categoryId);
      const currentRule = currentRules.find(rule => rule.id === hadSelection);
      if (!currentRule || currentRule.version !== previousRule.version) {
        templateImportBusy = false;
        invalidateTemplatePreview();
        throw Error('可用分配规则或所选版本已变化，名单已保留，请重新预览并确认规则。');
      }
      templateImportBusy = false;
      const input = manualBatchInput();
      if (JSON.stringify(input) !== JSON.stringify(preview)) throw Error('名单或分类导入字段已变化，请重新校验');
      if (!input.good.length && !input.errors.length) return false;
      const ruleId = document.querySelector('#customer-import-preview [data-manual-batch-rule]')?.value || '';
      if (ruleId !== hadSelection) throw Error('分配规则选择已变化，请再次确认导入。');
      const ruleVersion = currentRule.version;
      templateImportBusy = true;
      const {tenantId, enterpriseId, accountId} = ctx();
      const batch = {id: templateImportMeta.requestId, name: input.name, source: 'manual', manualBatch: true, ruleDriven: true,
        businessType: input.categoryId, businessTypeLabel: input.categoryName, codeLabel: input.codeLabel,
        brandId: scope.scope.tenant.brandId, tenantId, enterpriseId, createdBy: accountId,
        assignmentRuleId:ruleId,assignmentRuleVersion:ruleVersion,
        createdAt: new Date().toISOString(), importFields: input.importFields, importFailureCount: input.errors.length, errors: [],
        rows: input.good.map(row => ({...row, id: id(), businessType: input.categoryId, ownerId: '', method: '',
          followup: '待联系', calls: [], history: []}))};
      const recordFailure = (suffix,details) => parent.DBatchFailureLog?.record(scope,'import',{
        key:'manual-import/'+batch.id+'/'+suffix,requestId:batch.id,...details
      });
      function recordInvalidRows(batchId) {
        for (const error of input.errors) {
          const saved = recordFailure('row/'+error.line,{
            batchId,reason:error.reason,leadCode:error.leadCode,phone:error.phone,rowNumber:error.line
          });
          if (!saved?.ok) return saved?.error || '导入失败日志暂未保存。';
        }
        return '';
      }
      const logError = recordInvalidRows();
      if (logError) throw Error(logError + '填写内容已保留。');
      if (batch.rows.length && !commitImportBatch(batch)) {
        const reason = '导入未保存，填写内容已保留，请检查后重试';
        const saved = recordFailure('save/'+crypto.randomUUID(),{reason});
        throw Error(saved?.ok ? reason : reason + '。失败流水暂未保存。');
      }
      if (batch.rows.length) {
        const linkError = recordInvalidRows(batch.id);
        if (linkError) showToast('名单已导入，失败日志的批次关联暂未保存。','warning');
        Promise.resolve().then(()=>parent.DReview21InlineIntake?.routeManualBatch?.(batch,ruleId,window)).then(result=>{
          if (!batchPageScope()) return;
          if (result?.error || result?.failed) showToast(result.error || '部分名单分配失败，请查看失败日志。','warning');
          else if (result?.pending) showToast('部分名单进入待处理，请在导入批次核对去向。','warning');
          else if (result?.routed) showToast('已按规则办理 '+result.routed+' 条名单。','success');
          if (RouteRuntime.refreshCurrent) RouteRuntime.refreshCurrent();
        }).catch(()=>{ if (batchPageScope()) showToast('名单已导入，分配结果暂不可读取。','warning'); });
      }
      templatePreview = null;
      templateImport = false;
      ui.closeLayer('customer-import');
      FourNodeWorkspace.resetBatches();
      showToast(batch.rows.length ? '已导入 ' + batch.rows.length + ' 条客户名单' :
        '已记录 ' + input.errors.length + ' 条导入失败', 'success');
    } catch (error) { showToast(error.message, 'warning'); }
    finally { if (templateImportMeta === metadata) templateImportBusy = false; }
  }

  function visibleBatchImportErrors(batch) {
    const errors = batch.errors || [];
    const context = batchPageScope();
    if (!context || !batch.manualBatch || !batch.ruleDriven) return errors;
    const log = parent.DBatchFailureLog;
    if (batch.importFailureCount != null) return (log?.list(context,[batch.id]).rows || [])
      .filter(row=>row.kind==='import' && row.batchId===batch.id && row.rowNumber)
      .map(row=>({line:row.rowNumber,phone:row.phone,reason:row.reason}));
    return errors.filter(row => !log?.isImportRowDeleted(context,batch.id,row.line));
  }

  function manualBatches() {
    if (!batchPageScope()) return {status:'success', data:[]};
    const data = visible().filter(isCustomerBatch).map(batch => {
      const list = rows(batch);
      const failed = manager() ? (batch.importFailureCount ?? batch.errors?.length ?? 0) : 0;
      const sourceLabel = batch.manualBatch === true || batch.source === 'manual' ? '手工导入' : '来源未记录';
      return {batchId: batch.id, name: batch.name, categoryId: batch.businessType, categoryName: CustomerBusiness.typeLabel(batch),
        at: batch.createdAt, kind: 'manual', sourceLabel, disposition: batch.ruleDriven ? '按培育模板规则处理' : '历史导入',
        counts: {total: list.length + failed, success: list.length, failed, unknown: 0}};
    });
    return batchReadError ? {status:'failed', message:batchReadError} : {status:'success', data};
  }

  function isCustomerBatch(batch) {
    return !!batch && (batch.manualBatch === true || batch.source === 'manual' ||
      (!batch.source && !!batch.createdBy && !batch.sourceApplicationId));
  }

  function quotaDay(value) {
    const at = window.DListOrder.parse(value);
    return at == null ? '' : new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai',dateStyle:'short'}).format(at);
  }

  function batchSeat(batch, accountId, identityId) {
    if (!accountId) return null;
    const seats = CloudCallData.agents.filter(seat => seat.accountId === accountId && seat.tenantId === batch.tenantId &&
      seat.enterpriseId === batch.enterpriseId && seat.lifecycleStatus !== '已删除' && (!identityId || seat.contactCenterIdentityId === identityId));
    return seats.length === 1 && seats[0].agentRecordId ? String(seats[0].agentRecordId) : null;
  }

  function batchQuotaRecord(batch, row) {
    if (row.reviewQuota) return structuredClone(row.reviewQuota);
    const legacy = batch.manualBatch && row.method === '人工外呼' && row.ownerId &&
      [...(row.history || [])].reverse().find(event => event.action === '分配' && event.method === '人工外呼' && event.targetId === row.ownerId);
    const seatId = legacy && batchSeat(batch, row.ownerId), day = legacy && quotaDay(legacy.at);
    const counted = {};
    if (day && seatId) counted[day+'|'+seatId] = {kind:'new', started:row.calls.length>0, refunded:false};
    return {seatId:seatId || '', day:day || '', counted};
  }

  function manualBatchSeatUsage(tenant, day, seatId) {
    const {accountId,enterpriseId,tenantId} = ctx();
    const scope = parent.DSession?.context()?.scope;
    if (!valid() || scope?.id !== tenant || scope.tenant?.enterpriseId !== enterpriseId ||
        (tenantId !== tenant && !manager())) return null;
    if (!manager() && batchSeat({tenantId:tenant,enterpriseId},accountId) !== seatId) return null;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      let newCount = 0, followCount = 0;
      for (const batch of saved) {
        if (batch.tenantId !== tenant || batch.enterpriseId !== enterpriseId) continue;
        for (const row of batch.rows) {
          if (!batch.manualBatch && !row.reviewQuota) continue;
          const entry = batchQuotaRecord(batch, row).counted[day+'|'+seatId];
          if (entry && !entry.refunded) {
            if (entry.kind === 'new') newCount++;
            else if (entry.kind === 'continued') followCount++;
          }
        }
      }
      return {newCount,followCount};
    } catch (_) { return null; }
  }

  function planBatchQuota(batch, selectedRows, method, accountId) {
    if (!batch.manualBatch) return new Map();
    if (method !== '人工外呼' && selectedRows.every(row => !row.ownerId && !row.reviewQuota?.seatId)) return new Map();
    const state = parent.DReview21?.state();
    if (state?.tenant !== batch.tenantId || !parent.DReview21.isLatest(state)) throw Error('当前坐席资料已变化，请刷新后重新选择。');
    const id = method === '人工外呼' ? batchSeat(batch, accountId) : '';
    const seat = id && state.seats.find(item => item.id === id);
    if (method === '人工外呼' && !seat) throw Error('该账号的有效坐席未能核对。');
    const plan = new Map();
    let added = 0;
    for (const row of selectedRows) {
      const quota = batchQuotaRecord(batch, row);
      if (seat && row.ownerId === accountId && quota.seatId === id) continue;
      const prior = quota.counted[state.today+'|'+quota.seatId];
      if (prior?.kind === 'new' && !prior.started) prior.refunded = true;
      quota.seatId = id;
      quota.day = id ? state.today : '';
      const key = state.today+'|'+id;
      if (seat && (!quota.counted[key] || quota.counted[key].refunded)) {
        quota.counted[key] = {kind:'new', started:false, refunded:false};
        added++;
      }
      plan.set(row.id,quota);
    }
    const reason = added && parent.DReview21Workbench.seatCapacity(state, seat, added);
    if (reason) throw Error(reason);
    return plan;
  }

  function batchQuotaReason(batch, method, accountId) {
    try {
      planBatchQuota(batch, batch.rows.filter(row => assignment.ids.includes(row.id)), method, accountId);
      return '';
    } catch (error) { return error.message; }
  }

  function recordBatchQuotaCall(batch, row, call, predictive) {
    if (!batch.manualBatch) return;
    const seatId = batchSeat(batch, call.accountId, call.contactCenterIdentityId);
    const day = quotaDay(predictive ? call.agentAnsweredAt : call.ringingAt);
    if (!seatId || !day) return;
    const quota = batchQuotaRecord(batch, row);
    const key = day+'|'+seatId;
    const previous = quota.counted[key];
    const continued = quota.seatId === seatId && quota.day && quota.day < day;
    if (previous && !previous.refunded) previous.started = true;
    else if (predictive || continued) {
      quota.counted[key] = {kind:continued?'continued':'new', started:true, refunded:false};
    }
    if (predictive && quota.seatId !== seatId && day >= quota.day) { quota.seatId = seatId; quota.day = day; }
    row.reviewQuota = quota;
  }

  function renderManualBatch(options) {
    if (!batchPageScope() || !isCustomerBatch(find(options.batchId))) return null;
    selectedBatchKey = '';
    selectedMechanism = 'LEGACY';
    return render(options).replace("RouteRuntime.back({fallback:'legacy-customer-tasks'})", 'FourNodeWorkspace.openBatches()');
  }

  function manualBatchResults(batch) {
    const scope = batchPageScope();
    if (!scope || !isCustomerBatch(batch)) return new Map();
    const receipts = (parent.DReview21InlineIntake?.readBatchReceipts(window) || [])
      .filter(receipt => receipt.skynet && receipt.importBatchId === batch.id);
    const byRowId = new Map(receipts.filter(receipt => receipt.importBatchRowId)
      .map(receipt => [receipt.importBatchRowId, receipt]));
    const legacy = receipts.filter(receipt => !receipt.importBatchRowId);
    const byRequest = new Map(legacy.map(receipt => [receipt.name, receipt]));
    const byLeadCode = new Map();
    for (const receipt of legacy) {
      if (receipt.originalKey) byLeadCode.set(receipt.originalKey,
        byLeadCode.has(receipt.originalKey) ? null : receipt);
    }
    const sourceCodeFields = (batch.importFields || []).filter(field =>
      ['originalKey', 'hclueid', 'clueid'].includes(field.businessKey || field.key));
    const fileRows = batch.rows || [];
    const historicalCodes = new Map();
    const ordinalMatches = new Map();
    const reserved = new Set();
    for (const [index, row] of fileRows.entries()) {
      if (byRowId.has(row.id) || !legacy.length) continue;
      const codes = [row.externalDocumentId,...sourceCodeFields.map(field => row.importedValues?.[field.key])]
        .map(value => String(value ?? '').trim()).filter(Boolean);
      const ordinal = byRequest.get('FILE-' + batch.id + '-' + (index + 1));
      if (ordinal && codes.includes(ordinal.originalKey)) {
        ordinalMatches.set(row.id,ordinal);
        reserved.add(ordinal);
      } else {
        historicalCodes.set(row.id,codes);
      }
    }
    const fallbackByRow = new Map();
    const fallbackUse = new Map();
    for (const [id,codes] of historicalCodes) {
      const matches = new Set(codes.map(code=>byLeadCode.get(code)).filter(receipt=>receipt && !reserved.has(receipt)));
      for (const receipt of matches) fallbackUse.set(receipt,(fallbackUse.get(receipt) || 0) + 1);
      if (matches.size===1) fallbackByRow.set(id,matches.values().next().value);
    }
    const failures = (parent.DBatchFailureLog?.list(scope).rows || [])
      .filter(entry => entry.kind === 'assignment' && entry.batchId === batch.id);
    const results = new Map();
    for (const row of fileRows) {
      const fallback = fallbackByRow.get(row.id);
      const receipt = byRowId.get(row.id) || ordinalMatches.get(row.id) || (fallbackUse.get(fallback)===1 ? fallback : null);
      if (receipt) {
        results.set(row.id, {
          taskId: receipt.taskId || receipt.details?.find(([label]) => label === '培育任务')?.[1],
          disposition: receipt.disposition || receipt.receiptStatus,
          receiptId: receipt.batchId,
          receiptSource: receipt.receiptSource
        });
        continue;
      }
      const failure = failures.find(entry => entry.leadCode === row.externalDocumentId &&
        (!entry.rowNumber || !row.sourceLine || entry.rowNumber === row.sourceLine));
      if (failure) results.set(row.id, {
        taskId: failure.taskId,
        disposition: '分配失败 · ' + failure.reason
      });
    }
    return results;
  }

  function manualBatchReceiptButton(result) {
    if (!result?.receiptId || !result.receiptSource) return '';
    const action = 'FourNodeWorkspace.showBatchReceipt(' + JSON.stringify(result.receiptId) + ',' +
      JSON.stringify(result.receiptSource) + ')';
    return '<button type="button" class="btn-link" data-manual-batch-receipt onclick="' + esc(action) +
      '">查看来件</button>';
  }

  function batchList() {
    sync();
    view = 'list';
    workspaceSurface = 'batches';
    const result = call('batches');
    const manual = root.CustomerTasks.manualBatches();
    const live = (root.parent.DReview21InlineIntake?.readBatchReceipts(root) || []).filter(row=>!row.importBatchId);
    const imports = rows(result).map(row => ({...row, kind:'batch', sourceLabel:batchSourceLabel(row)}));
    const importedIds = new Set(imports.map(row => row.batchId));
    const all = [...imports, ...rows(manual).filter(row => !importedIds.has(row.batchId)), ...live];
    const categories = new Map(categoryRows().map(row => [row.categoryId, row]));
    for (const row of live) {
      if (row.skynet && !categories.has(row.categoryId)) {
        categories.set(row.categoryId, {categoryId:row.categoryId, name:row.categoryName});
      }
    }
    const sources = [...new Set(all.map(row => row.sourceLabel).filter(Boolean))].sort();
    if (batchFilters.source && !sources.includes(batchFilters.source)) sources.push(batchFilters.source);
    const filter = batchFilters;
    const dayFormat = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai', dateStyle:'short'});
    const withinDates = value => {
      if (!filter.from && !filter.to) return true;
      const timestamp = root.DListOrder.parse(value);
      if (timestamp == null) return false;
      const day = dayFormat.format(timestamp);
      return (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to);
    };
    const list = sorted(all.filter(row =>
      (!filter.categoryId || row.categoryId === filter.categoryId) &&
      (!filter.source || row.sourceLabel === filter.source) && withinDates(row.at) &&
      (!filter.keyword || [row.name, row.batchId, row.originalKey, row.categoryName, row.taskImportSource?.taskName]
        .some(value => String(value || '').includes(filter.keyword)))), ['at']);
    batchPage = Math.min(Math.max(1, batchPage), Math.ceil(list.length / 10) || 1);
    const filtersHtml = '<div class="filter-panel">' +
      field('批次', '<input id="fnw-batch-keyword" value="' + e(filter.keyword) + '" placeholder="批次名称或来件编号">') +
      field('业务分类', '<select id="fnw-batch-category">' + selectOptions([...categories.values()], filter.categoryId, 'categoryId', 'name', '全部分类') + '</select>') +
      field('导入来源', '<select id="fnw-batch-source">' + selectOptions(sources.map(source => ({id:source,name:source})), filter.source, 'id', 'name', '全部来源') + '</select>') +
      '<div class="field" role="group" aria-label="导入日期"><span>导入日期</span>' +
      '<input type="date" id="fnw-batch-from" aria-label="起始日期" value="' + e(filter.from) + '"><span>至</span>' +
      '<input type="date" id="fnw-batch-to" aria-label="截止日期" value="' + e(filter.to) + '"></div>' +
      '<div class="filter-actions">' + button('重置', 'resetBatches') + button('查询', 'queryBatches', [], false, true) + '</div></div>';

    const matchingReceipts = list.filter(row => row.kind === 'receipt' && !row.skynet);
    const matchingSkynet = list.filter(row => row.skynet);
    const totals = new Map();
    for (const row of matchingReceipts) if (row.disposition !== '—') totals.set(row.disposition, (totals.get(row.disposition) || 0) + 1);
    const existingSummary = matchingReceipts.length ? '<div>实时来件 ' + matchingReceipts.length + ' 条 · ' +
      ['已接收','未接收','待核对'].map(status => status + ' ' + matchingReceipts.filter(row => row.receiptStatus === status).length).join(' · ') +
      (totals.size ? '<small class="fnw-secondary">任务去向 · ' + e([...totals].map(([label, count]) => label + ' ' + count).join(' · ')) + '</small>' : '') + '</div>' : '';
    const skynetSummary = matchingSkynet.length ? '<div>天网来件 ' + matchingSkynet.length + ' 条 · ' +
      ['处理中','已匹配','已过滤','已结束','仅记录','待匹配','待处理','待下发'].map(status => status + ' ' +
        matchingSkynet.filter(row => row.receiptStatus === status).length).join(' · ') + '</div>' : '';
    const receiptSummary = existingSummary || skynetSummary
      ? '<div class="fnw-batch-summary" role="status">' + existingSummary + skynetSummary + '</div>' : '';
    const columns = [
      {key:'name', label:'导入批次／来件', width:'23%', render:(name, row) => '<strong>' + e(name || '未命名批次') + '</strong>' +
        (row.kind === 'receipt' || name === row.batchId ? '' : '<small class="fnw-secondary">' + e(row.batchId) + '</small>')},
      {key:'categoryName', label:'业务分类', render:(name, row) => e(name || row.categorySnapshot?.name || row.categoryId || '—')},
      {key:'sourceLabel', label:'导入来源', render:(label, row) => e(label) +
        (row.kind === 'receipt' ? '<small class="fnw-secondary">' + (row.skynet ? '模拟来件' : '实时来件') + '</small>' :
          row.kind === 'batch' ? '<small class="fnw-secondary">' + e(batchSceneLabel(row)) + '</small>' : '')},
      {key:'counts', label:'导入结果', render:(counts, row) => row.kind === 'receipt' ?
        tag(row.receiptStatus, ['已接收','已匹配'].includes(row.receiptStatus) ? 'success' :
          ['未接收','已过滤'].includes(row.receiptStatus) ? 'error' : 'warning') :
        e((counts?.total ?? row.rows?.length) != null ? (counts?.total ?? row.rows.length) + ' 条' : '—') +
        '<small class="fnw-secondary">' + e(batchCountsLabel(row)) + '</small>'},
      {key:'disposition', label:'处理去向', render:(label, row) => e(label || (isDirect(row) ? methods[row.directMethod] || '直接跟进' : '—'))},
      {key:'at', label:'导入时间', width:'158px', render:at => e(time(at))},
      {key:'batchId', label:'操作', width:'108px', className:'action-column', render:(id, row) => '<div class="table-actions"><button type="button" onclick="' +
        (row.kind === 'receipt' ? requestJs('showBatchReceipt', id, row.receiptSource) :
          requestJs(row.kind === 'manual' ? 'showManualBatch' : 'showBatch', id)) + '">' + (row.kind === 'receipt' ? '查看来件' : '查看名单') + '</button></div>'}
    ];
    const offset = (batchPage - 1) * 10;
    const actions = root.CustomerTasks.canImportManualBatch() ? '<button type="button" class="btn btn-primary" onclick="CustomerTasks.openManualBatch()">手工导入</button>' : '';
    const failureLogs = root.parent.DBatchFailureLog?.canView(root.parent.DSession?.context()) ?
      '<button type="button" class="btn" data-batch-failure-open onclick="FourNodeWorkspace.showFailureLogs()">失败日志</button>' : '';
    const operator = root.parent.DSession?.roleKey().endsWith('_ops');
    return '<section class="platform-page fnw-workspace fnw-batches-page">' +
      ui.pageHeader('导入批次', operator ? '手工导入名单按本人分配范围显示。' : '查看客户名单的导入结果与实时来件。', failureLogs) +
      notice() + (result.status === 'success' ? '' : notice(result)) + (manual.status === 'success' ? '' : notice(manual)) + filtersHtml +
      '<div class="management-list-shell">' + (actions || receiptSummary ? ui.toolbar(actions, receiptSummary) : '') +
      table(columns, list.slice(offset, offset + 10), {rowOffset:offset, emptyText:all.length ? '暂无符合条件的记录' :
        operator ? '暂无分配给你的导入名单' : '暂无导入批次'}) +
      pagination(list.length, 'setBatchPage', 10, batchPage) + '</div></section>';
  }

  function showFailureLogs() {
    const parent = root.parent;
    const context = parent.DSession?.context();
    const currentFrame = root.DNativeContext?.context;
    if (parent.DApp?.currentPage() !== 'PAGE-2204' || !parent.DSession?.allowed('PAGE-2204') ||
        context?.scope.kind !== 'tenant' || context.account.id !== currentFrame?.account.id ||
        context.scope.id !== currentFrame?.scope.id || !parent.DBatchFailureLog?.canView(context)) return false;
    const layer = 'fnw-batch-failure-logs';
    const typeNames = {import:'导入失败',assignment:'分配失败',delivery:'下发失败'};
    const query = {kind:'',keyword:'',page:1};
    let prepared = null, listStatus = '';
    const value = input => e(input == null || input === '' ? '—' : String(input));
    const close = 'PlatformUI.closeLayer(&quot;' + layer + '&quot;)';
    const inScope = () => {
      const current = parent.DSession?.context();
      return parent.DApp?.currentPage() === 'PAGE-2204' && current?.scope.id === context.scope.id &&
        current.account.id === context.account.id;
    };
    ui.openLayer(layer, '<div class="layer-header"><h2>失败日志</h2>' +
      '<button type="button" aria-label="关闭失败日志" onclick="' + close + '">×</button></div>' +
      '<div class="layer-body" data-batch-failure-logs></div><div class="layer-footer">' +
      '<button type="button" class="btn" onclick="' + close + '">关闭</button></div>', 'wide');
    const panel = root.document.querySelector('#'+layer+' [data-batch-failure-logs]');
    if (!panel) return false;
    function logRows() {
      if (!inScope()) return {rows:[],error:'当前租户已经变化，请重新打开失败日志。'};
      const batches = root.CustomerTasks.manualBatches();
      const batchIds = batches.status === 'success' ? batches.data.map(batch => batch.batchId) : undefined;
      return parent.DBatchFailureLog.list(context,batchIds);
    }
    function draw() {
      prepared = null;
      const result = logRows();
      const keyword = query.keyword.toLowerCase();
      const records = sorted((result.rows || []).filter(row=>(!query.kind || row.kind===query.kind) &&
        (!keyword || [row.serial,row.batchId,row.leadCode,row.taskId,row.requestId].some(item=>
          String(item ?? '').toLowerCase().includes(keyword)))), ['at']);
      const last = Math.max(1, Math.ceil(records.length / 10));
      query.page = Math.min(query.page,last);
      const pageRows = records.slice((query.page-1)*10,query.page*10).map(row =>
        '<tr data-batch-failure-row="'+e(row.serial)+'"><td>'+value(row.serial)+'</td><td>'+value(typeNames[row.kind] || row.kind)+'</td>'+
        '<td>'+value(row.batchId)+'</td><td>'+value(row.leadCode)+'</td><td>'+value(row.taskId)+'</td>'+
        '<td class="fnw-failure-reason">'+value(row.reason)+'</td><td>'+value(time(row.at))+'</td>'+
        '<td><button type="button" class="btn-link" data-batch-failure-detail="'+e(row.serial)+'">查看详情</button></td></tr>').join('');
      panel.innerHTML = (listStatus ? '<p role="status">'+e(listStatus)+'</p>' : '') +
        '<form class="filter-panel fnw-failure-filter" data-batch-failure-filter>' +
        '<label class="field"><span>失败类型</span><select name="kind" data-batch-failure-kind><option value="">全部类型</option>' +
        Object.entries(typeNames).map(([key,title])=>'<option value="'+key+'"'+(key===query.kind?' selected':'')+'>'+title+'</option>').join('') +
        '</select></label><label class="field"><span>搜索流水</span><input type="search" name="keyword" data-batch-failure-keyword value="'+
        e(query.keyword)+'" placeholder="流水、批次、线索或任务编号"></label><div class="filter-actions">' +
        '<button type="submit" class="btn btn-primary">查询</button><button type="button" class="btn" data-batch-failure-reset>重置</button></div></form>' +
        (result.error ? '<p role="alert">'+e(result.error)+'</p>' :
          '<div class="table-scroll" role="region" tabindex="0" aria-label="失败记录"><table class="platform-table">'+
          '<thead><tr>'+['失败流水号','失败类型','导入批次／来件','本地线索编码','任务 ID','失败原因','失败时间','操作']
            .map(title=>'<th scope="col">'+title+'</th>').join('')+'</tr></thead><tbody>'+
          (pageRows || '<tr><td colspan="8">当前条件下暂无失败记录。</td></tr>')+'</tbody></table></div>'+
          '<div class="list-toolbar"><span role="status">共 '+records.length+' 条记录</span><div class="table-actions">'+
          '<button type="button" class="btn" data-batch-failure-page="-1" '+(query.page===1?'disabled':'')+'>上一页</button>'+
          '<span>第 '+query.page+' / '+last+' 页</span><button type="button" class="btn" data-batch-failure-page="1" '+
          (query.page===last?'disabled':'')+'>下一页</button></div></div>');
    }
    function inspect(serial) {
      prepared = null;
      const row = logRows().rows?.find(item=>item.serial===serial);
      if (!row) return draw();
      const fields = [['失败流水号',row.serial],['失败类型',typeNames[row.kind] || row.kind],['失败原因',row.reason],
        ['导入批次／来件',row.batchId],['本地线索编码',row.leadCode],['任务 ID',row.taskId],['原请求编号',row.requestId],
        ['文件行号',row.rowNumber],['号码',row.phone],['失败时间',time(row.at)]];
      panel.innerHTML = '<section data-batch-failure-inspect><button type="button" class="btn-link" data-batch-failure-back>返回失败日志</button>'+
        '<dl class="bf-facts">'+fields.map(([label,item])=>'<div><dt>'+e(label)+'</dt><dd>'+value(item)+'</dd></div>').join('')+
        '</dl>' + (row.kind==='import' && parent.DBatchFailureLog.canDeleteImport(context) ?
          '<p>先下载此条失败记录，再删除。不会删除成功的名单、批次或任务。</p>' +
          '<div class="table-actions"><button type="button" class="btn" data-batch-failure-download="'+e(row.serial)+'">下载 CSV</button>' +
          '<button type="button" class="btn" data-batch-failure-delete disabled>删除失败记录</button></div>' +
          '<p role="status" data-batch-failure-action-status></p>' : '') +
        '</section>';
      panel.querySelector('[data-batch-failure-back]')?.focus();
    }
    function actionStatus(message) {
      const node = panel.querySelector('[data-batch-failure-action-status]');
      if (node) node.textContent = message;
    }
    function download(serial) {
      const remove = panel.querySelector('[data-batch-failure-delete]');
      if (!remove) return;
      prepared = null;
      remove.disabled = true;
      const result = parent.DBatchFailureLog.prepareImportExport(context,serial);
      if (!result.ok) return actionStatus(result.error);
      try {
        const row=result.row;
        const csv = field => {
          let cell=String(field ?? '');
          if (/^[\s]*[=+@-]|^[\t\r\n]/.test(cell)) cell="'"+cell;
          return '"'+cell.replace(/"/g,'""')+'"';
        };
        const rows = [['失败流水号','失败类型','导入批次／来件','本地线索编码','任务 ID','原请求编号','文件行号','号码','失败原因','失败时间'],
          [row.serial,'导入失败',row.batchId,row.leadCode,row.taskId,row.requestId,row.rowNumber,row.phone,row.reason,row.at]];
        const url = root.URL.createObjectURL(new root.Blob(['\uFEFF'+rows.map(cols=>cols.map(csv).join(',')).join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'}));
        const link = root.document.createElement('a');
        link.href=url;
        link.download='导入失败-'+row.serial.replace(/[^A-Za-z0-9-]/g,'')+'.csv';
        root.document.body.appendChild(link);
        try {link.click();}
        finally {link.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),1000);}
        prepared = result.token;
        remove.disabled = false;
        actionStatus('下载已发起。确认文件已保存后，可删除此条失败记录。');
      } catch (_) { actionStatus('下载未发起，记录未删除。'); }
    }
    function removeFailure() {
      if (!prepared || !root.confirm('确认已下载，并删除此条导入失败记录？此操作不影响成功名单、批次及任务。')) return;
      const result = parent.DBatchFailureLog.deleteExportedImport(context,prepared);
      if (!result.ok) {
        prepared=null;
        panel.querySelector('[data-batch-failure-delete]').disabled=true;
        return actionStatus(result.error);
      }
      listStatus='已删除该条导入失败记录。';
      draw();
    }
    panel.addEventListener('submit',event=>{
      if (!event.target.matches('[data-batch-failure-filter]')) return;
      event.preventDefault();
      const form = new root.FormData(event.target);
      Object.assign(query,{kind:form.get('kind'),keyword:String(form.get('keyword') || '').trim(),page:1});
      draw();
    });
    panel.addEventListener('click',event=>{
      const button = event.target.closest('button');
      if (!button || !inScope()) return;
      if (button.hasAttribute('data-batch-failure-detail')) inspect(button.dataset.batchFailureDetail);
      else if (button.hasAttribute('data-batch-failure-download')) download(button.dataset.batchFailureDownload);
      else if (button.hasAttribute('data-batch-failure-delete')) removeFailure();
      else if (button.hasAttribute('data-batch-failure-back')) draw();
      else if (button.hasAttribute('data-batch-failure-reset')) {
        Object.assign(query,{kind:'',keyword:'',page:1});
        draw();
      } else if (button.hasAttribute('data-batch-failure-page')) {
        query.page = Math.max(1,query.page+Number(button.dataset.batchFailurePage));
        draw();
      }
    });
    draw();
    return true;
  }

  function showManualBatch(id) {
    if (!rows(root.CustomerTasks.manualBatches()).some(row => row.batchId === id)) return false;
    return navigate('customer-tasks', {batchId:id, batchDetail:true, preserveFilters:true});
  }

  function showBatchReceipt(id, source) {
    const receipt = root.parent.DReview21InlineIntake?.readBatchReceipts(root).find(row => row.batchId === id && row.receiptSource === source);
    if (!receipt) return false;
    const layer = 'fnw-batch-receipt';
    const close = 'PlatformUI.closeLayer(&quot;' + layer + '&quot;)';
    const valueText = value => {
      if (value == null || value === '') return '—';
      return typeof value === 'object'
        ? Object.entries(value).map(([key, item]) => key + ' ' + String(item ?? '—')).join(' · ') || '—'
        : String(value);
    };
    const facts = items => '<dl class="bf-facts">' + items.map(([label,value]) =>
      '<div><dt>' + e(label) + '</dt><dd>' + e(valueText(value)) + '</dd></div>').join('') + '</dl>';
    const trace = (receipt.trace || []).map(node => '<li><h4>' + e(node.node) + '</h4>' + facts([
      ['节点条件',node.condition], ['判定结果',node.result], ['历史或来件证据',node.evidence], ['实际取值',node.actual],
      ['实际动作',node.action], ['处理原因',node.reason], ['下一去向',node.next]
    ]) + '</li>').join('');
    const skynet = receipt.skynet ? '<section class="skynet-receipt-section"><h3>原始来件字段</h3>' + facts(receipt.values) +
      '</section><section class="skynet-receipt-section"><h3>清洗轨迹</h3>' + (trace ? '<ol class="skynet-trace">' + trace + '</ol>' :
        '<p>本次来件已登记，正在等待清洗。</p>') + '</section>' : '';
    ui.openLayer(layer, '<div class="layer-header"><h2>' + (receipt.skynet ? '天网来件明细' : '来件明细') +
      '</h2><button type="button" aria-label="关闭" onclick="' + close + '">×</button></div>' +
      '<div class="layer-body"' + (receipt.skynet ? ' data-skynet-batch-detail="' + e(id) + '"' : '') + '>' +
      facts(receipt.importBatchId ? [['导入批次',receipt.importBatchId], ...receipt.details] : receipt.details) +
      skynet + '</div><div class="layer-footer">' +
      '<button type="button" class="btn" onclick="' + close + '">关闭</button>' +
      (receipt.canResume ? '<button type="button" class="btn" data-skynet-resume>继续处理本次来件</button>' : '') +
      '</div>', receipt.skynet ? 'wide' : 'small');
    const detail = root.document.getElementById(layer);
    const resume = detail.querySelector('[data-skynet-resume]');
    if (resume) resume.onclick = () => {
      const accepted = root.parent.DReview21InlineIntake?.resumeSkynetReceipt(root, id, () => { resume.disabled = false; });
      if (accepted) resume.disabled = true;
    };
    return true;
  }

  const cloud = window.DNativeModules.cloud;
  const manualFunctions = [batchPageScope, canImportManualBatch, legacyBatchCanAssign, manualBatchCategories, manualBatchSelected, manualBatchFamilyChanged, manualBatchColumns, manualBatchInput,
    fitManualBatchDrawer, setManualBatchStep, openManualImport, showManualBatchSchema, updateManualBatchConfirm,
    previewManualBatch, confirmManualBatch,
    isCustomerBatch, manualBatches, visibleBatchImportErrors, renderManualBatch, manualBatchResults, manualBatchReceiptButton,
    quotaDay, batchSeat, batchQuotaRecord, manualBatchSeatUsage,
    planBatchQuota, batchQuotaReason, recordBatchQuotaCall].map(fn => fn.toString()).join('\n');
  cloud.html = cloud.html
    .replace('  function openUnifiedImport(){', manualFunctions + '\n  function openUnifiedImport(){')
    .replace(/manager\(\)&&b\.errors\?\.length\?[^\n]+/,part=>part.replace(/b\.errors\??/g,'visibleBatchImportErrors(b)'))
    .replace('  function commitImportBatch(batch) {', `  function commitImportBatch(batch) {
    if(batch?.manualBatch===true && (!batch.assignmentRuleId || !batch.assignmentRuleVersion))return false;`)
    .replace('return manager()?scoped:scoped.filter(b=>b.rows.some(owned));}',
      'return manager()?scoped:scoped.filter(b=>rows(b).length);}')
    .replace('  function rows(b){return manager()?b.rows:b.rows.filter(owned);}', `  function rows(b){
    if(manager())return b.rows;
    if(b.manualBatch===true&&b.ruleDriven===true&&batchPageScope()){
      const ids=new Set(parent.DReview21InlineIntake?.manualBatchOwnedRowIds(window,b)||[]);
      return b.rows.filter(row=>ids.has(row.id));
    }
    return b.rows.filter(owned);
  }`)
    .replace("return [...base,{key:'code',label:meta?.codeLabel||'业务编码',type:'text',required:true},...fs.filter(f=>!['name','phone','note'].includes(f.key))];}",
      "const columns=[...base,{key:'code',label:meta?.codeLabel||'业务编码',type:'text',required:true},...fs.filter(f=>!['name','phone','note'].includes(f.key))];return templateImportMeta?.manualBatch?manualBatchColumns(columns,document.getElementById('customer-import-business-type')?.value):columns;}")
    .replace("host=document.getElementById('customer-import-schema');if(host)host.innerHTML='<table",
      "host=document.getElementById('customer-import-schema');if(templateImportMeta?.manualBatch){showManualBatchSchema(meta,columns,host);return;}if(host)host.innerHTML='<table")
    .replace('function importCategoryMeta(){', 'function importCategoryMeta(){if(templateImportMeta?.manualBatch)return flowLatest(manualBatchSelected());')
    .replace("if(!dCustomerSchema().length)return '请先选择业务类型';",
      "if(templateImportMeta?.manualBatch&&!document.getElementById('customer-import-primary-type')?.value)return '请先选择一级业务分类';if(!dCustomerSchema().length)return templateImportMeta?.manualBatch?'请选择该一级下的二级业务分类':'请先选择业务类型';")
    .replace('function templateTypeChanged(){invalidateTemplatePreview();', 'function templateTypeChanged(){invalidateTemplatePreview();dCustomerReadiness();')
    .replace('templatePreview=null;importRevision++;const host=', 'templatePreview=null;if(templateImportMeta?.manualBatch)setManualBatchStep(false);importRevision++;const host=')
    .replace('function dCustomerReadiness(){', 'function dCustomerReadiness(){if(templateImportMeta?.manualBatch&&templatePreview){updateManualBatchConfirm();return;}')
    .replace('function dConfigureImportMapping(){', 'function dConfigureImportMapping(){if(templateImportMeta?.manualBatch)return false;')
    .replace('function previewTemplateImport(){if(templateImportBusy', 'function previewTemplateImport(){if(templateImportMeta?.manualBatch)return previewManualBatch();if(templateImportBusy')
    .replace('function confirmTemplateImport(){if(!templatePreview', 'function confirmTemplateImport(){if(templateImportMeta?.manualBatch)return confirmManualBatch();if(!templatePreview')
    .replace('function dImportSampleValue(column,row){', "function dImportSampleValue(column,row){\n    if(templateImportMeta?.manualBatch&&column.key==='leadAt')return new Date(Date.now()+8*3600000).toISOString().slice(0,16);")
    .replace('window.CustomerTasks={configureImportMapping:', 'window.CustomerTasks={canImportManualBatch,manualBatches,manualBatchSeatUsage,renderManualBatch,openManualBatch:openManualImport,manualBatchFamilyChanged,configureImportMapping:')
    .replace('function detail(b){\n    const rs=sortRowsForDisplay(rows(b).filter(r=>(!manager()||',
      'function detail(b){\n    const readOnlyBatch=!legacyBatchCanAssign(b);\n    const routeByRow=manualBatchResults(b);\n    const ruleResults=!!batchPageScope()&&(b.ruleDriven===true||routeByRow.size>0);\n    const rs=sortRowsForDisplay(rows(b).filter(r=>(readOnlyBatch||!manager()||')
    .replace("&&(!status||outcome(r)===status)).map(r=>({...r,batchCreatedAt:b.createdAt,batchUpdatedAt:b.updatedAt})));\n    const showAssignment=!manager()||assignmentView!=='pending'||rs.some(r=>r.method||assigned(r));",
      "&&(ruleResults||!status||outcome(r)===status)).map(r=>({...r,batchCreatedAt:b.createdAt,batchUpdatedAt:b.updatedAt})));\n    const showAssignment=!ruleResults&&(readOnlyBatch||!manager()||assignmentView!=='pending'||rs.some(r=>r.method||assigned(r)));")
    .replace("CustomerBusiness.typeLabel(b)+' · '+summary(rows(b))", "CustomerBusiness.typeLabel(b)+' · '+(ruleResults?'客户 '+rows(b).length:summary(rows(b)))")
    .replace(/<label class="field">跟进状态<select id="customer-status"><option value="">全部<\/option>'\+\['待联系'[^\n]+?<\/select><\/label>/,
      markup => "'+(ruleResults?'':('"+markup+"'))+'")
    .replace("(manager()?'<div class=\"customer-status-tabs\"", "(!readOnlyBatch&&manager()?'<div class=\"customer-status-tabs\"")
    .replaceAll("(manager()&&assignmentView!=='assigned'?", "(!readOnlyBatch&&manager()&&assignmentView!=='assigned'?")
    .replace("(manager()&&assigned(r)&&reassignable(r,b)?", "(!readOnlyBatch&&manager()&&assigned(r)&&reassignable(r,b)?")
    .replace("emptyText:manager()&&assignmentView==='pending'?", "emptyText:!readOnlyBatch&&manager()&&assignmentView==='pending'?")
    .replace('function reassignable(r,b){return !r.wizardImportReservation', 'function reassignable(r,b){return legacyBatchCanAssign(b)&&!r.wizardImportReservation')
    .replace('const item=row(itemId);if(!item||!missingTaskRecoverable(item.r,item.b))',
      'const item=row(itemId);if(!item||!legacyBatchCanAssign(item.b)||!missingTaskRecoverable(item.r,item.b))')
    .replace("+(missingTaskRecoverable(r,b)?", "+(!readOnlyBatch&&missingTaskRecoverable(r,b)?")
    .replaceAll("navigateTo('customer-tasks',{batchId:selectedBatch});", "navigateTo('customer-tasks',{batchId:selectedBatch,batchDetail:parent.DApp?.currentPage()==='PAGE-2204'});")
    .replace("label:CustomerBusiness.codeLabel(b),render:v=>esc(v||'—')},...(showAssignment?", "label:b.codeLabel||CustomerBusiness.codeLabel(b),render:v=>esc(v||'—')},...(b.importFields||[]).map(field=>({key:'importedValues',label:field.label,render:v=>esc(v?.[field.key]||'—')})),...(showAssignment?")
    .replace("{key:'id',label:'本批次最近通话',render:(_,r)=>esc(callResult(r))},{key:'id',label:'跟进状态',render:(_,r)=>esc(outcome(r))},{key:'id',label:'操作',",
      "...(ruleResults?[{key:'id',label:'培育任务 ID',render:id=>'<span data-manual-batch-task>'+esc(routeByRow.get(id)?.taskId||'—')+'</span>'},{key:'id',label:'办理结果',render:id=>'<span data-manual-batch-disposition>'+esc(routeByRow.get(id)?.disposition||'未取得办理结果')+'</span>'},{key:'id',label:'操作',render:id=>manualBatchReceiptButton(routeByRow.get(id))}]:[{key:'id',label:'本批次最近通话',render:(_,r)=>esc(callResult(r))},{key:'id',label:'跟进状态',render:(_,r)=>esc(outcome(r))},{key:'id',label:'操作',")
    .replace("+(r.method&&r.method!=='人工外呼'&&!r.taskId?'<span> 需重新分配任务</span>':'')}\n    ],rs",
      "+(r.method&&r.method!=='人工外呼'&&!r.taskId?'<span> 需重新分配任务</span>':'')}])\n    ],rs")
    .replace("if(!b)return false;\n    if(method!=='人工外呼'&&!guardLegacyTask(ownerId,b))", "if(!legacyBatchCanAssign(b)||b.manualBatch&&!canImportManualBatch())return false;\n    if(method!=='人工外呼'&&!guardLegacyTask(ownerId,b))")
    .replace("if(!manager()||!b)return;if(!ids.length)return showToast('请先勾选需要分配的客户','warning');",
      "if(!manager()||!legacyBatchCanAssign(b))return;if(!ids.length)return showToast('请先勾选需要分配的客户','warning');")
    .replace("chosen.forEach(r=>{r.history.push({at:now(),action:'分配',method,targetId:ownerId,", "let quotaPlan;try{quotaPlan=planBatchQuota(b,chosen,method,ownerId);}catch(error){showToast(error.message,'warning');return false;}\n    chosen.forEach(r=>{if(quotaPlan.has(r.id))r.reviewQuota=quotaPlan.get(r.id);r.history.push({at:now(),action:'分配',method,targetId:ownerId,")
    .replace("map(c=>({id:c.account.accountId,name:c.seat.userName+' · '", "map(c=>({id:c.account.accountId,reason:batchQuotaReason(b,method,c.account.accountId),name:c.seat.userName+' · '")
    .replace("+options.map(o=>'<option value=\"'+esc(o.id)+'\">'+esc(o.name)+'</option>').join('')+'</select></label>'+(!options.length?", "+options.map(o=>'<option value=\"'+esc(o.id)+'\"'+(o.reason?' disabled':'')+'>'+esc(o.name+(o.reason?' · '+o.reason:''))+'</option>').join('')+'</select></label>'+(!options.length?")
    .replace('item.r.activeCallId=call.callId;if(!item.r.calls.some', 'item.r.activeCallId=call.callId;recordBatchQuotaCall(item.b,item.r,call,false);if(!item.r.calls.some')
    .replace('if(!active&&i<0&&!receiving)return false;\n    const snapshot=callSnapshot(call);', "if(!active&&i<0&&!receiving)return false;\n    if(receiving&&call.agentAnswerResult==='已接听')recordBatchQuotaCall(b,r,call,true);\n    const snapshot=callSnapshot(call);")
    .replace('  window.BusinessFlowStore={directFollowupContext,', () => manualBatchConflicts.toString() + '\n  window.BusinessFlowStore={manualBatchConflicts,directFollowupContext,')
    .replace(/  function batchList\(options=\{\}\)\{[\s\S]*?\n  (?=function batchDetail\()/, () => batchList.toString() + '\n  ' + showFailureLogs.toString() + '\n  ' + showManualBatch.toString() + '\n  ' + showBatchReceipt.toString() + '\n  ')
    .replace("function batchDetail(options={}){const ret=call('batches')", "function batchDetail(options={}){const manual=root.CustomerTasks.renderManualBatch(options);if(manual!==null)return manual;const ret=call('batches')")
    .replace("function canArrange(row){return writable(row)&&actor().roleCode==='ADMIN'",
      "function canArrange(row){return !['PAGE-2204','PAGE-2226','PAGE-2227'].includes(root.parent.DApp?.currentPage()) && !(view==='detail'&&recordReturn?.route==='customer-tasks') && writable(row)&&actor().roleCode==='ADMIN'")
    .replace("render:(id,row)=>nextAction(row)+(work(row).nextAction!=='openRecord'?button('详情','openRecord',[id]):'')}];\n    const chosen=",
      "render:(id,row)=>workspaceSurface==='batch'?button('详情','openRecord',[id]):nextAction(row)+(work(row).nextAction!=='openRecord'?button('详情','openRecord',[id]):'')}];\n    columns.shift();\n    const chosen=")
    .replace("workspaceSurface==='batch'?'批次业务名单':'业务名单','保留原单条、批量手动分配和待分配队列；分配不会自动呼叫。'",
      "workspaceSurface==='batch'?'批次业务名单':'业务名单',workspaceSurface==='batch'?'查看本批次业务和办理结果。':'查看业务进展、原任务及办理记录。'")
    .replace("+'<div class=\"management-list-shell\">'+ui.toolbar(button('手动分配所选业务'",
      "+'<div class=\"management-list-shell\">'+(workspaceSurface==='batch'?'':ui.toolbar(button('手动分配所选业务'")
    .replace("button('手动分配所选业务','openSelectedAssign',[],!canAssignSelected)+", '')
    .replace("button('发起所选呼叫','openBatchStart',[],!writable()||!selected.size)+", '')
    .replace("button('查看全部业务','clearBatch',[],!filters.batchId))+'<p class=\"field-hint\">批量发起仅适用于同组AI或预外呼；每条业务分别核验，受理不计为实际拨打。同号受限记录不会自动续拨。</p>'",
      "button('查看全部业务','clearBatch',[],!filters.batchId)))")
    .replace('setQueue,openBatchStart,openReclassify,', 'setQueue,openReclassify,')
    .replace("batchFilters={keyword:value('fnw-batch-keyword').trim(),categoryId:value('fnw-batch-category')}", "batchFilters={keyword:value('fnw-batch-keyword').trim(),categoryId:value('fnw-batch-category'),source:value('fnw-batch-source'),from:value('fnw-batch-from'),to:value('fnw-batch-to')}")
    .replace('root.FourNodeWorkspace={profileServices,', 'root.FourNodeWorkspace={showManualBatch,showBatchReceipt,showFailureLogs,profileServices,')
    .replace('</head>', `<style>
      @media (min-width: 601px) {
        body[data-domain="CLOUD_CONTACT_CENTER"] .fnw-batches-page .filter-panel .field :is(input, select) {
          flex-basis: var(--batch-filter-width, 146px); width: var(--batch-filter-width, 146px);
        }
        .fnw-batches-page #fnw-batch-keyword { --batch-filter-width: 176px; }
        .fnw-batches-page .filter-panel input[type="date"] { --batch-filter-width: 122px; }
      }
      .fnw-batches-page .list-toolbar { flex-wrap: wrap; }
      .fnw-batches-page .fnw-batch-summary { font-size: 12px; color: var(--ui-text-secondary); white-space: normal; }
      .fnw-batches-page .platform-table { table-layout: fixed; }
      .fnw-batches-page .platform-table .fnw-secondary { overflow-wrap: anywhere; }
      #review-skynet-intake [hidden] { display: none; }
      .skynet-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: 14px; }
      .skynet-fields .field { min-width: 0; margin: 0; }
      .skynet-fields .field :is(input, select) { width: 100%; }
      #review-skynet-intake [data-skynet-receipt-result] { margin-top: 16px; overflow-wrap: anywhere; }
      .skynet-receipt-section { margin-top: 20px; }
      .skynet-trace { display: grid; gap: 12px; padding-left: 24px; }
      .skynet-trace > li { border: 1px solid var(--ui-border, #e8e8e8); padding: 12px 16px; border-radius: 8px; }
      .skynet-trace h4 { margin: 0 0 8px; }
      [data-skynet-batch-detail] dd { overflow-wrap: anywhere; }
      [data-batch-failure-logs] .table-scroll { margin-top: 12px; }
      [data-batch-failure-logs] .platform-table td { overflow-wrap: anywhere; }
      [data-batch-failure-logs] .fnw-failure-reason { min-width: 160px; white-space: normal; }
      [data-batch-failure-inspect] dd { overflow-wrap: anywhere; }
    </style></head>`);
})();
