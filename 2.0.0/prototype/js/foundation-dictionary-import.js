(() => {
  'use strict';

  const esc = value => DUI.esc(value);
  const commonColumns = [
    {key:'code',label:'字典项编码',aliases:['编码'],required:true,description:'按文本填写。使用字母、数字、下划线或中划线。'},
    {key:'name',label:'显示名称',aliases:['名称'],required:true},
    {key:'order',label:'排序',description:'填写非负整数，可以填 0。留空保留原排序，新字典项默认为 99。'},
    {key:'status',label:'状态',description:'填写启用或停用。留空保留原状态，新字典项默认为启用。'},
    {key:'description',label:'说明',description:'留空可清除已有说明。'}
  ];
  const stepLabels = ['上传文件','数据预览','导入完成'];
  const actionLabels = {create:'新增',update:'更新',failed:'失败'};
  const clean = value => String(value ?? '').trim();
  const dealerType = 'NEV_TEST_DRIVE_DEALER';
  const clone = value => value===undefined ? undefined : JSON.parse(JSON.stringify(value));
  const dealerCode = value => Boolean(value && value.length<=200 && !/[\u0000-\u001f\u007f]/.test(value));
  const spreadsheetNamespace = 'urn:schemas-microsoft-com:office:spreadsheet';
  const legacyFileError = '仅支持 DCC 导出的 XML 格式 .xls。请将其他旧版 Excel 文件另存为 .xlsx 后重试。';
  const fileFormats = '支持 .xlsx、UTF-8 CSV 及原 DCC 导出的 .xls。';

  function spreadsheetChildren(node,name) {
    return [...node.children].filter(child => child.namespaceURI === spreadsheetNamespace && child.localName === name);
  }

  function spreadsheetIndex(element,next,limit,label) {
    const index = element.getAttributeNS(spreadsheetNamespace,'Index');
    const number = index === null ? next : (/^[1-9]\d*$/.test(index) ? Number(index) : 0);
    if (!Number.isSafeInteger(number) || number < next || number > limit) {
      throw Error('旧版 Excel 的' + label + '位置无效或超出导入范围。');
    }
    return number;
  }

  async function readLegacySpreadsheet(file) {
    const maxBytes = 1048576;
    if (!Number.isFinite(file.size) || file.size > maxBytes) throw Error('文件不能超过 1 MB。');
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > maxBytes) throw Error('文件不能超过 1 MB。');
    let source;
    try { source = new TextDecoder('utf-8',{fatal:true}).decode(bytes); }
    catch (_) { throw Error(legacyFileError); }
    if (!source.trimStart().startsWith('<') || /<!DOCTYPE/i.test(source)) throw Error(legacyFileError);
    const doc = new DOMParser().parseFromString(source,'application/xml');
    const workbook = doc.documentElement;
    if (doc.doctype || workbook?.namespaceURI !== spreadsheetNamespace || workbook.localName !== 'Workbook') {
      throw Error(legacyFileError);
    }
    const table = spreadsheetChildren(workbook,'Worksheet')
      .filter(sheet => !['填写说明','字段说明'].includes(sheet.getAttributeNS(spreadsheetNamespace,'Name')))
      .map(sheet => spreadsheetChildren(sheet,'Table')[0])
      .find(candidate => candidate && spreadsheetChildren(candidate,'Row').length);
    if (!table) throw Error('旧版 Excel 没有可导入的工作表，请按模板填写或另存为 .xlsx 后重试。');
    const rows = [];
    for (const row of spreadsheetChildren(table,'Row')) {
      const number = spreadsheetIndex(row,rows.length+1,2001,'行');
      const cells = [];
      for (const cell of spreadsheetChildren(row,'Cell')) {
        const column = spreadsheetIndex(cell,cells.length+1,100,'列');
        if (cell.hasAttributeNS(spreadsheetNamespace,'Formula')) {
          throw Error('第 ' + number + ' 行第 ' + column + ' 列包含公式，请转换为值后再导入。');
        }
        cells[column-1] = spreadsheetChildren(cell,'Data')[0]?.textContent || '';
      }
      while (rows.length < number-1) rows.push([]);
      rows.push(cells);
    }
    return {rows,format:'xls'};
  }

  function importColumns(type,relatedColumn,dealer) {
    if (type.code===dealerType && dealer) return [...commonColumns.map(column=>column.key==='code' ? {...column,
      description:'新增填写外部真实门店编码，按文本保留前导零；更新填写原字典项编码。'} : column),
      {key:'externalStoreCode',label:'门店编码',aliases:['外部门店编码'],description:'已有项重新关联时填写外部门店编码，保留原字典项编码。留空且未改变门店身份时保留原关联。'},
      ...Object.entries(dealer.columns).map(([key,label])=>({key,label}))];
    return type.code === 'ABNORMAL_REASON' && relatedColumn ? [...commonColumns,
      {key:'relation',label:relatedColumn,aliases:['关联对象'],description:'新增时填写当前启用的线索状态。多个状态用顿号或 | 分隔，更新时留空保留已有状态。'}
    ] : commonColumns;
  }

  function csvRowNumbers(text) {
    const lines = [1];
    let line = 1;
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '"') {
        if (quoted && text[i+1] === '"') i++;
        else quoted = !quoted;
      } else if (text[i] === '\n') {
        line++;
        if (!quoted) lines.push(line);
      }
    }
    return lines;
  }

  function columnIndexes(header,columns,headerLine) {
    const indexes = new Map();
    header.forEach((value,index) => {
      const name = clean(value).replace(/^\uFEFF/,'').replace(/\s*[*＊]+$/,'').trim();
      const column = columns.find(item => item.label === name || item.aliases?.includes(name));
      if (!column) return;
      if (indexes.has(column.key)) throw Error('第 ' + headerLine + ' 行重复设置「' + column.label + '」列。');
      indexes.set(column.key,index);
    });
    const missing = columns.filter(column => column.required && !indexes.has(column.key));
    if (missing.length) throw Error('第 ' + headerLine + ' 行表头缺少' + missing.map(column => '「' + column.label + '」').join('、') + '。');
    return indexes;
  }

  function sourceRows(matrix,columns,lineNumbers) {
    const headerIndex = matrix.findIndex(cells => cells.some(value => clean(value)));
    if (headerIndex < 0) throw Error('文件为空，请按模板填写数据。');
    const header = matrix[headerIndex];
    const indexes = columnIndexes(header,columns,lineNumbers?.[headerIndex] ?? headerIndex+1);
    const input = matrix.slice(headerIndex+1).flatMap((cells,index) => {
      if (!cells.some(value => clean(value))) return [];
      const number = headerIndex+index+2;
      const values = Object.fromEntries(columns.map(column => [column.key,clean(cells[indexes.get(column.key)])]));
      return [{number:lineNumbers?.[number-1] ?? number,values,
        descriptionPresent:indexes.has('description'),extra:cells.slice(header.length).some(value => clean(value))}];
    });
    if (!input.length) throw Error('文件只有表头，请填写需要导入的字典项。');
    return input;
  }

  function inspectDealer(values,prior,dealer,row,errors) {
    const {name,relatedGroup,scheduleScore} = values;
    const explicit=clean(values.externalStoreCode),previousCode=clean(prior?.externalStoreCode);
    const identityChanged=!prior || name!==prior.name || ['province','city','region'].some(key=>
      values[key] && values[key]!==clean(prior[key])) || Boolean(explicit && (explicit!==previousCode ||
        dealer.sourceId && prior.externalSource?.dictionaryId!==dealer.sourceId));
    const relation = relatedGroup || prior?.relatedGroup || '';
    const score = scheduleScore || String(prior?.scheduleScore ?? '');
    if ((!prior || relatedGroup || identityChanged) && (!relation || !dealer.groups.has(relation) &&
        (identityChanged || relation!==prior?.relatedGroup))) {
      errors.push('请填写已启用的赛马小组。');
    }
    if ((!prior || scheduleScore || identityChanged) && (!/^\d+$/.test(score) || !Number.isSafeInteger(Number(score)))) {
      errors.push('排程分数须为非负整数。');
    }
    row.relatedGroup = relation;
    row.scheduleScore = score;
    let sourceRequired=false;
    if (!identityChanged) {
      // A five-column update can maintain scheduling without silently rebinding
      // an existing dealer or needing an unrelated live directory request.
      row.name=prior.name;
      for (const key of ['province','city','region']) row[key]=prior[key] ?? '';
    } else {
      sourceRequired=true;
      const code=explicit || previousCode || clean(values.code);
      let resolved;
      try { resolved=dealer.resolve?.(code); }
      catch (error) { resolved={ok:false,message:error.message}; }
      const item=resolved?.item,reference=resolved?.reference;
      if (!resolved?.ok) errors.push(resolved?.message || resolved?.error || '新增或修改门店身份前，请先选择门店取数接口并读取完整门店目录。');
      else if (!item || clean(item.code)!==code || !clean(item.name) || reference?.externalStoreCode!==code ||
          !reference.externalSource?.dictionaryId || dealer.sourceId && reference.externalSource.dictionaryId!==dealer.sourceId ||
          reference.externalSource?.brandId!==dealer.brandId || reference.externalSource?.tenantId!==dealer.tenantId) {
        errors.push('门店来源或准确编码无法核对，请重新读取门店。');
      } else {
        if (!prior && clean(values.code)!==code) errors.push('新增赛马门店的字典项编码须与外部门店编码一致。');
        row.code=prior?.code || code;row.name=clean(item.name);
        for (const key of ['province','city','region']) {
          const address=clean(item[key]);
          if (values[key] && values[key]!==address) errors.push(dealer.columns[key]+'与接口门店资料不一致。');
          row[key]=address;
        }
        row.externalStoreCode=code;
        row.externalSource=clone(reference.externalSource);
        row.externalStoreSnapshot=clone(reference.externalStoreSnapshot || item);
      }
    }
    return {sourceRequired,values:{...values,code:row.code,name:row.name,
      externalStoreCode:row.externalStoreCode || explicit,
      ...Object.fromEntries(Object.keys(dealer.columns).map(key=>[key,row[key]]))}};
  }

  const hasExternalIdentity = row => Boolean(typeof row?.externalStoreCode==='string' && clean(row.externalStoreCode) &&
    typeof row.externalSource?.dictionaryId==='string' && clean(row.externalSource.dictionaryId));
  function sameExternalDealer(first,second,brandId) {
    if (!hasExternalIdentity(first) || !hasExternalIdentity(second) || first.externalStoreCode!==second.externalStoreCode) return false;
    const a=first.externalSource,b=second.externalSource;
    if (!a || !b) return false;
    return Boolean(a.dictionaryId && a.dictionaryId===b.dictionaryId ||
      a.capabilityId && a.capabilityId===b.capabilityId && (a.brandId || brandId)===(b.brandId || brandId));
  }

  function inspect(input,rows,mode,validCode,canRelate,relatedValues,dealer) {
    const existing = new Map(rows.map(row => [row.code,row]));
    const related = new Set(relatedValues.filter(Boolean));
    const seen = new Map();
    const processed=[];
    return input.map(source => {
      const {number,values,descriptionPresent,extra} = source;
      const {code,name,order,status,description,relation} = values;
      const prior = existing.get(code);
      const errors = [];
      if (!(dealer ? dealerCode(code) : validCode(code))) errors.push('字典项编码无效。');
      if (dealer && rows.filter(item=>item.code===code).length>1) errors.push('已有字典项编码重复，请先核对原记录。');
      if (!name) errors.push('显示名称必填。');
      if (order && (!/^\d+$/.test(order) || !Number.isSafeInteger(Number(order)))) errors.push('排序须为非负整数。');
      if (status && !['启用','停用'].includes(status)) errors.push('状态仅支持启用或停用。');
      if (code && seen.has(code)) errors.push('字典项编码与第 ' + seen.get(code) + ' 行重复。');
      else if (code) seen.set(code,number);
      if (mode === 'create' && prior) errors.push('编码已存在。更新时请选「新增或更新」。');
      if (extra) errors.push('数据超出表头列数。');

      const row = {status:'启用',refs:0,order:99,description:'',...prior,code,name};
      if (order) row.order = Number(order);
      if (status) row.status = status;
      if (descriptionPresent) row.description = description;
      if (canRelate) {
        const previous = prior?.applicableLeadStatuses || [];
        const links = relation ? [...new Set(relation.split(/[、|]/).map(clean).filter(Boolean))] : previous;
        if (!links.length || links.some(value => !related.has(value) && !previous.includes(value))) {
          errors.push('请填写有效的适用线索状态。');
        }
        row.applicableLeadStatuses = links;
      }
      const checked = dealer ? inspectDealer(values,prior,dealer,row,errors) : {values};
      if (dealer) {
        for (const other of rows) {
          if (other===prior) continue;
          if (sameExternalDealer(row,other,dealer.brandId) || row.externalStoreCode && !hasExternalIdentity(other) &&
              (row.externalStoreCode===other.code || row.externalStoreCode===other.externalStoreCode)) {
            errors.push('该门店已在字典项「'+other.code+' · '+other.name+'」配置，请更新原记录。');break;
          }
          if ([row.name,name].some(value=>clean(value).toLocaleLowerCase()===clean(other.name).toLocaleLowerCase()) && !hasExternalIdentity(other)) {
            errors.push('存在同名未关联旧门店「'+other.code+' · '+other.name+'」，请先核对原记录，不能按名称猜测合并。');break;
          }
        }
        const duplicate=processed.find(other=>sameExternalDealer(row,other.row,dealer.brandId));
        if (duplicate) errors.push('外部门店与第 '+duplicate.number+' 行重复，请保留一条准确记录。');
      }
      const result={number,values:checked.values,row,errors,sourceRequired:checked.sourceRequired===true,
        action:errors.length ? 'failed' : prior ? 'update' : 'create'};
      processed.push(result);return result;
    });
  }

  function outcomeCounts(preview) {
    const totals = {create:0,update:0,failed:0};
    preview.forEach(item => totals[item.action]++);
    return totals;
  }

  function previewTable(preview,columns) {
    return `<div class="table-scroll dictionary-import-preview" data-dictionary-import-preview role="region" aria-label="导入预览">
      <table class="platform-table"><thead><tr><th scope="col">文件行号</th>${columns.map(column =>
        `<th scope="col">${esc(column.label)}</th>`).join('')}<th scope="col">校验结果</th></tr></thead>
      <tbody>${preview.map(item => `<tr data-dictionary-import-row="${item.number}" data-dictionary-import-outcome="${item.action}">
        <td>${item.number}</td>${columns.map(column => `<td>${esc(item.values[column.key] || '—')}</td>`).join('')}
        <td><span class="dictionary-import-outcome">${actionLabels[item.action]}</span>
          ${item.errors.map(error => `<p>${esc(error)}</p>`).join('')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function totalsText(preview) {
    const totals = outcomeCounts(preview);
    return `新增 <strong data-dictionary-import-created>${totals.create}</strong> 项，
      更新 <strong data-dictionary-import-updated>${totals.update}</strong> 项，
      失败 <strong data-dictionary-import-failed>${totals.failed}</strong> 项。`;
  }

  function open({type,rows,files,valid,persist,relatedColumn,relatedValues = [],dealer,validCode}) {
    if (!valid() || type.importable === false) return;
    if (type.code!==dealerType) dealer=null;
    const columns = importColumns(type,relatedColumn,dealer);
    const canRelate = columns.some(column => column.key === 'relation');
    let step = 1;
    let mode = 'create';
    let input = [];
    let preview = [];
    let fileName = '';
    let working = false;
    let generation = 0;
    let feedback = '';
    const context = () => dealer?.context?.();
    const identity = current => JSON.stringify([current?.account?.id,current?.scope?.kind,current?.scope?.id,
      current?.scope?.tenant?.brandId,current?.scope?.tenant?.enterpriseId,current?.scope?.grant]);
    const openingContext = dealer ? context() : null;
    const openingIdentity = dealer ? identity(openingContext) : '';
    const sourceState={sources:[],sourceId:'',proof:null,items:[],complete:false,listing:false,reading:false,message:'',sequence:0};
    const current = () => valid() && (!dealer || identity(context())===openingIdentity);
    const assertCurrent = () => {if (!current()) throw Error('当前字典、租户、品牌或使用范围已变化，请重新打开导入。');};
    const dealerContext = dealer ? {...dealer,brandId:openingContext?.scope?.tenant?.brandId || '',tenantId:openingContext?.scope?.id || '',
      get sourceId(){return sourceState.sourceId;},
      resolve(code) {
        assertCurrent();
        if (sourceState.complete && !sourceState.items.length) return {ok:false,message:'当前接口的完整目录没有门店，不能新增或变更门店身份。'};
        if (!sourceState.proof || !sourceState.sourceId || typeof dealer.sourceService?.resolve!=='function') {
          return {ok:false,message:'新增或修改门店身份前，请先选择门店取数接口并读取完整门店目录。'};
        }
        if (!sourceState.items.some(item=>item.code===code)) return {ok:false,message:'门店编码「'+code+'」不在已读取的完整接口目录中；不能按名称匹配或自由填写门店。'};
        return dealer.sourceService.resolve(context(),{proof:sourceState.proof,code});
      }} : null;
    function verifySource() {
      assertCurrent();
      // Empty complete directories cannot authorize a new dealer. Existing-only
      // scheduling updates may still proceed without inventing a dealer result.
      if (!sourceState.proof || !sourceState.items.length) return;
      const result=dealerContext.resolve(sourceState.items[0].code);
      if (!result?.ok) throw Error(result?.message || result?.error || '门店取数来源已变化，请重新读取门店并预览。');
    }
    function invalidatePreview() {preview=[];if (step!==1) step=1;}
    function cancelSource() {
      sourceState.sequence++;sourceState.proof=null;sourceState.items=[];sourceState.complete=false;sourceState.reading=false;
      try {dealer?.sourceService?.cancel?.(openingContext);} catch (_) { /* Old proofs remain unusable locally. */ }
    }

    const opening = document.activeElement;
    const modal = DUI.dialog('导入' + type.name,'<div class="dictionary-import-wizard" data-dictionary-import-wizard></div>',[
      {label:'取消',run:close => { if (!working || step === 1) {cancelSource();generation++;close();} }},
      {label:'上一步',run:() => go(1)},
      {label:'下一步',primary:true,run:() => go(2)},
      {label:'确认导入',primary:true,run:commit},
      {label:'完成',primary:true,run:close => {
        cancelSource();generation++;
        close();
        if (!opening?.isConnected) document.querySelector('[data-dictionary-import]')?.focus({preventScroll:true});
      }}
    ],{stack:true,dismissible:true});
    const dialog = modal.element.querySelector('.d-dialog');
    dialog.classList.add('dictionary-import-dialog');
    const wizard = dialog.querySelector('[data-dictionary-import-wizard]');
    const [cancel,back,next,confirm,done] = modal.buttons;
    cancel.dataset.dictionaryImportCancel = '';
    back.dataset.dictionaryImportBack = '';
    next.dataset.dictionaryImportNext = '';
    confirm.dataset.dictionaryImportConfirm = '';
    done.dataset.dictionaryImportDone = '';

    function controls() {
      const show = (button,visible) => {
        button.hidden = !visible;
        button.style.display = visible ? '' : 'none';
      };
      show(cancel,step === 1);
      show(back,step === 2);
      show(next,step === 1);
      show(confirm,step === 2);
      show(done,step === 3);
      back.disabled = working;
      next.disabled = working || sourceState.reading || !input.length;
      confirm.disabled = working || sourceState.reading || !preview.some(item => item.action !== 'failed');
      if (dealer && step===1) {
        const source=wizard.querySelector('[data-dictionary-import-source]');
        const query=wizard.querySelector('[data-dictionary-import-read-dealers]');
        source.disabled=working || sourceState.listing || sourceState.reading;
        query.disabled=working || sourceState.listing || sourceState.reading || !sourceState.sourceId;
      }
    }

    function displayFeedback(message) {
      feedback = message;
      wizard.querySelector('[data-dictionary-import-feedback]').textContent = message;
    }

    function uploadMarkup() {
      return `<div class="dictionary-import-upload">
        <fieldset class="dictionary-import-mode"><legend>导入方式</legend>
          <label><input type="radio" name="dictionaryImportMode" value="create" data-dictionary-import-mode${mode === 'create' ? ' checked' : ''}> 仅新增</label>
          <label><input type="radio" name="dictionaryImportMode" value="upsert" data-dictionary-import-mode${mode === 'upsert' ? ' checked' : ''}> 新增或更新</label>
        </fieldset>
        ${dealer ? `<section class="dictionary-import-dealer-source" aria-label="门店取数来源">
          <label class="field"><span>门店取数接口</span><select data-dictionary-import-source>
            <option value="">${sourceState.listing?'正在读取可用接口…':'请选择门店取数接口'}</option>
            ${sourceState.sources.map(source=>`<option value="${esc(source.id)}"${sourceState.sourceId===source.id?' selected':''}>${esc(source.label || source.name || source.id)}</option>`).join('')}
          </select></label><button type="button" class="btn" data-dictionary-import-read-dealers>读取门店</button>
          <p class="field-hint" role="status" data-dictionary-import-source-status>${esc(sourceState.message || '新增或变更门店身份须先读取完整外部门店目录。只调整已有门店的小组、分数等配置时可保留原身份。')}</p>
        </section>` : ''}
        <button type="button" class="btn" data-dictionary-import-download>下载 Excel 模板</button>
        <label class="dictionary-import-file-picker"><span>选择 Excel 或 CSV 文件</span>
          <input type="file" accept=".xlsx,.csv,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/vnd.ms-excel" data-dictionary-import-file></label>
        <p class="dictionary-import-file-name" data-dictionary-import-file-name>${esc(fileName || fileFormats)}</p>
        ${dealer ? '<p class="field-hint">新增使用真实门店编码，并填写赛马小组和排程分数。重新关联已有项时填写“门店编码”，原字典项编码不变。旧版五列更新保留门店身份、小组和分数；省市区与接口不一致时不导入。</p>' : ''}
      </div>`;
    }

    function render() {
      wizard.innerHTML = `<ol class="dictionary-import-steps" aria-label="导入步骤">${stepLabels.map((label,index) =>
        `<li${index+1 === step ? ' aria-current="step"' : ''}>${esc(label)}</li>`).join('')}</ol>
        <section data-dictionary-import-step="${step}">
          ${step === 1 ? uploadMarkup() : step === 2 ?
            `<p class="dictionary-import-summary" data-dictionary-import-summary>已检查 ${preview.length} 行。${totalsText(preview)}</p>${previewTable(preview,columns)}` :
            `<div class="dictionary-import-complete" data-dictionary-import-result role="status"><h3>导入完成</h3><p>${totalsText(preview)}</p></div>`}
        </section><p class="form-error" role="alert" data-dictionary-import-feedback>${esc(feedback)}</p>`;
      if (step === 1) {
        wizard.querySelector('[data-dictionary-import-download]').onclick = download;
        wizard.querySelector('[data-dictionary-import-file]').onchange = event => load(event.target.files[0]);
        wizard.querySelectorAll('[data-dictionary-import-mode]').forEach(radio => { radio.onchange = () => { mode = radio.value; }; });
        if (dealer) {
          const source=wizard.querySelector('[data-dictionary-import-source]');
          source.value=sourceState.sourceId;
          source.onchange=()=>{
            const chosen=source.value;cancelSource();sourceState.sourceId=chosen;
            sourceState.reading=false;sourceState.message='';feedback='';invalidatePreview();render();
          };
          wizard.querySelector('[data-dictionary-import-read-dealers]').onclick=readDealers;
        }
      }
      controls();
    }

    async function download() {
      if (!current()) return displayFeedback('当前字典或使用范围已变化，请重新打开导入。');
      try {
        const utility = await files();
        const schema = columns.map(column => ({type:'text',...column,label:column.label + (column.required ? '*' : '')}));
        const file = await utility.template(schema,type.name,'xlsx','字典导入模板');
        if (modal.element.isConnected && current()) utility.save(file);
      } catch (error) {
        if (modal.element.isConnected) displayFeedback(error.message || '模板暂时无法下载。');
      }
    }

    async function load(file) {
      const sequence = ++generation;
      input = [];invalidatePreview();
      if (!file) cancelSource();
      fileName = file?.name || '';
      working = Boolean(file);
      displayFeedback(file ? '正在读取文件…' : '');
      wizard.querySelector('[data-dictionary-import-file-name]').textContent = fileName || fileFormats;
      controls();
      if (!file) return;
      try {
        const {rows:matrix,format} = /\.xls$/i.test(file.name) ?
          await readLegacySpreadsheet(file) : await (await files()).readFile(file);
        const numbers = format === 'csv' ? csvRowNumbers(await file.text()) : null;
        if (!modal.element.isConnected || sequence !== generation) return;
        verifySource();
        input = sourceRows(matrix,columns,numbers);
        wizard.querySelector('[data-dictionary-import-file-name]').textContent = fileName + ' · 已读取 ' + input.length + ' 行';
        displayFeedback('');
      } catch (error) {
        if (modal.element.isConnected && sequence === generation) displayFeedback(error.message || '文件未能读取，请重新选择。');
      } finally {
        if (modal.element.isConnected && sequence === generation) {
          working = false;
          controls();
        }
      }
    }

    function go(target) {
      if (working || sourceState.reading || !modal.element.isConnected) return;
      if (!current()) return displayFeedback('当前字典或使用范围已变化，请重新打开导入。');
      if (target === 2) {
        if (!input.length) return;
        try {verifySource();preview = inspect(input,rows,mode,validCode,canRelate,relatedValues,dealerContext);}
        catch (error) {preview=[];controls();return displayFeedback(error.message || '门店来源无法核对，请重新读取。');}
      }
      step = target;
      feedback = '';
      render();
      const focus = step === 1 ? wizard.querySelector('[data-dictionary-import-file]') : (confirm.disabled ? back : confirm);
      focus?.focus();
    }

    async function commit() {
      const accepted = preview.filter(item => item.action !== 'failed');
      if (step !== 2 || working || sourceState.reading || !accepted.length) return;
      if (!current()) return displayFeedback('当前字典或使用范围已变化，请重新打开导入。');
      working = true;
      controls();
      try {
        verifySource();
        const checked=inspect(input,rows,mode,validCode,canRelate,relatedValues,dealerContext);
        const fresh=checked.filter(item=>item.action!=='failed');
        if (JSON.stringify(fresh.map(item=>item.row))!==JSON.stringify(accepted.map(item=>item.row))) {
          throw Error('导入数据或门店来源已变化，请返回上一步重新预览后再确认。');
        }
        const updates = new Map(fresh.filter(item => item.action === 'update').map(item => [item.row.code,item.row]));
        const creates = fresh.filter(item => item.action === 'create').map(item => item.row);
        assertCurrent();
        await persist([...rows.map(row => updates.get(row.code) || row),...creates]);
        if (!modal.element.isConnected) return;
        step = 3;
        feedback = '';
        working = false;
        render();
        done.focus();
      } catch (error) {
        if (modal.element.isConnected) {
          working = false;
          controls();
          displayFeedback(error.message || '本次导入未保存，请重试。');
        }
      }
    }

    async function readSources() {
      sourceState.listing=true;render();
      try {
        assertCurrent();
        if (typeof dealer.sourceService?.list!=='function') throw Error('门店取数服务尚未就绪，不能新增或变更门店身份。');
        const result=await dealer.sourceService.list(context());
        if (!modal.element.isConnected) return;
        assertCurrent();
        if (!result?.ok || !Array.isArray(result.sources)) throw Error(result?.message || result?.error || '门店取数接口目录无法读取。');
        sourceState.sources=result.sources.filter(source=>typeof source?.id==='string' && source.id);
        sourceState.message=sourceState.sources.length ? '' : '暂无当前品牌可用的门店取数接口。可先维护已有项的小组和分数。';
      } catch (error) {sourceState.sources=[];sourceState.message=error.message || '门店取数接口目录无法读取。';}
      finally {sourceState.listing=false;if (modal.element.isConnected && step===1) render();}
    }

    async function readDealers() {
      if (working || sourceState.reading || !sourceState.sourceId) return;
      const sourceId=sourceState.sourceId;cancelSource();const sequence=++sourceState.sequence;
      sourceState.proof=null;sourceState.items=[];sourceState.reading=true;
      sourceState.message='正在读取完整门店目录…';invalidatePreview();render();
      try {
        assertCurrent();
        if (!sourceState.sources.some(source=>source.id===sourceId) || typeof dealer.sourceService?.query!=='function') throw Error('请选择当前可用的门店取数接口。');
        const result=await dealer.sourceService.query(context(),sourceId);
        if (!modal.element.isConnected || sequence!==sourceState.sequence || sourceId!==sourceState.sourceId) return;
        assertCurrent();
        if (!result?.ok || result.complete!==true || !Array.isArray(result.items) || result.items.length && !result.proof) {
          throw Error(result?.message || result?.error || '门店目录未完整读取，不能用于新增或变更门店身份。');
        }
        const codes=new Set();
        for (const item of result.items) {
          if (typeof item?.code!=='string' || !dealerCode(item.code) || item.code!==clean(item.code) ||
              !clean(item.name) || codes.has(item.code)) throw Error('接口门店编码缺失或重复，请核对来源后重新读取。');
          codes.add(item.code);
        }
        sourceState.items=clone(result.items);sourceState.proof=result.proof || null;sourceState.complete=true;
        sourceState.message='已完整读取 '+result.items.length+' 家门店；导入按准确编码匹配，名称和省市区采用接口资料。';
      } catch (error) {
        if (sequence===sourceState.sequence) {sourceState.proof=null;sourceState.items=[];sourceState.complete=false;sourceState.message=error.message || '门店读取失败，请重试。';}
      } finally {
        if (sequence===sourceState.sequence) {sourceState.reading=false;if (modal.element.isConnected) render();}
      }
    }

    render();
    if (dealer) void readSources();
  }

  window.DReview21DictionaryImport = Object.freeze({open});
})();
