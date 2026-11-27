(() => {
  'use strict';

  const pageId = 'PAGE-21007';
  const brandId = 'BRAND-NISSAN';
  const storageKey = 'd-contact-210-dcc-dictionary-v1:brand:' + brandId;
  const dataset = 'dcc-standalone-full-v1';
  const seed = window.DReview21DictionarySeed;
  const types = seed.types;
  const esc = value => DUI.esc(value);
  const validCode = code => /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(code);
  const validDealerCode = code => typeof code==='string' && code===code.trim() && code.length>0 &&
    code.length<=200 && !/[\u0000-\u001f\u007f]/.test(code);
  const hasExternalIdentity = row => Boolean(typeof row?.externalStoreCode==='string' && row.externalStoreCode.trim() &&
    typeof row.externalSource?.dictionaryId==='string' && row.externalSource.dictionaryId.trim());
  const dealerType = 'NEV_TEST_DRIVE_DEALER';
  const dealerGroupType = 'NEV_HORSE_RACE_GROUP';
  const dealerColumns = {
    province:'关联省份',city:'关联城市',region:'关联区域',relatedGroup:'赛马小组',scheduleScore:'排程分数'
  };
  const page = {id:pageId,name:'基础数据字典',area:'系统管理',group:'',route:'dcc-basic-dictionary',
    menu:true,module:'public',phoneDomain:'outside'};
  const after = DNav.pages.findIndex(row => row.id === 'PAGE-2005');
  DNav.pages.splice(after < 0 ? DNav.pages.length : after+1,0,page);

  const authorized = context => context?.scope.tenant?.brandId === brandId && DReview21.allowedScope(context);
  const currentIdentity = context => JSON.stringify([context?.account.id,context?.scope.id]);
  const originalPage = DRolePermissions.page;
  DRolePermissions.page = (id,context,seat) => id === pageId
    ? authorized(context) && DReview21.isAdmin(context) && DSession.allowed('PAGE-2223',context)
    : originalPage(id,context,seat);

  function read() {
    let original = localStorage.getItem(storageKey);
    const previous = original === null ? null : JSON.parse(original);
    const fromPreviousDataset = previous?.dataset !== dataset;
    let saved = fromPreviousDataset ? {dataset,revision:0,state:{dictionary:{}}} : previous;
    const entries = saved?.state?.dictionary;
    if (!Number.isSafeInteger(saved?.revision) || saved.revision < 0 || !entries || typeof entries !== 'object' || Array.isArray(entries)) {
      throw Error('基础数据字典暂时无法读取，请刷新后重试。');
    }
    const dictionary = Object.fromEntries(Object.entries(entries).filter(([code])=>Object.hasOwn(seed.items,code)));
    const pruned = Object.keys(dictionary).length !== Object.keys(entries).length;
    if (original !== null && (fromPreviousDataset || pruned)) {
      saved = {...saved,state:{...saved.state,dictionary}};
      const replacement = JSON.stringify(saved);
      if (localStorage.getItem(storageKey) !== original) throw Error('字典已变化，请刷新后重试。');
      localStorage.setItem(storageKey,replacement);
      original = replacement;
    }
    const items = Object.fromEntries(types.map(({code}) => [code,dictionary[code] ?? seed.items[code]]));
    return {original,revision:saved.revision,items,stored:saved};
  }

  window.DReview21FoundationDictionary = {
    read(id) {
      if (id !== brandId || !authorized(DSession.context())) return null;
      try { return {types,items:read().items}; }
      catch (_) { return null; }
    }
  };

  try {
    const retiredPrefix = 'd-contact-210-dcc-strategy-v1:';
    Object.keys(localStorage).filter(key => key.startsWith(retiredPrefix)).forEach(key => localStorage.removeItem(key));
  } catch (_) { /* Optional local settings can be unavailable. */ }

  const mark = required => required ? '<span class="dictionary-required" aria-hidden="true">*</span>' : '';
  const options = (choices, selected, emptyLabel = '请选择') => choices.map(choice =>
    `<option value="${esc(choice)}"${selected===choice?' selected':''}>${esc(choice||emptyLabel)}</option>`).join('');

  function select(name, label, choices, selected, required = false, emptyLabel) {
    return `<label><span>${mark(required)}${esc(label)}</span><select name="${name}"${required?' required':''}>${
      options(choices,selected,emptyLabel)}</select></label>`;
  }

  function itemFields(type, row) {
    const choices = seed.selectOptions[type];
    const selected = row?.name || '';
    const name = choices ? select('name',types.find(item=>item.code===type).name,['',...new Set([...choices,...(selected?[selected]:[])])],selected,true) :
      `<label><span>${mark(true)}显示名称</span><input name="name" value="${esc(selected)}" required></label>`;
    const codeHint = row ? '编码创建后固定，用于保留业务引用。' : choices ? '选择名称后自动生成编码。' : '';
    return `<div class="dictionary-edit-basics">
      <label><span>${mark(true)}字典项编码</span><input name="code" value="${esc(row?.code)}"${row||choices?' readonly':''} required>${
        codeHint ? `<small>${codeHint}</small>` : ''}</label>
      ${name}
      <label><span>排序</span><input type="number" name="order" min="0" step="1" value="${esc(row?.order ?? 99)}"></label>
      <label class="dictionary-full"><span>说明</span><textarea name="description" rows="3">${esc(row?.description)}</textarea></label></div>`;
  }

  function enabledNames(items, code, current) {
    const active = items[code].filter(row=>row.status==='启用').sort((a,b)=>a.order-b.order).map(row=>row.name);
    return ['',...new Set([...active,...(current?[current]:[])])];
  }

  function relationFields(items, type, row) {
    if (type === 'ABNORMAL_REASON') {
      const selected = row?.applicableLeadStatuses?.[0] || '';
      return select('leadStatus','适用线索状态',enabledNames(items,'INITIAL_LEAD_STATUS',selected),selected,true);
    }
    if (type === dealerType) {
      const group = row?.relatedGroup || '';
      return `<fieldset class="dictionary-dealer-config"><legend>赛马门店配置</legend>
        <div class="dictionary-edit-basics">${['province','city','region'].map(key=>
          `<label><span>${dealerColumns[key]}</span><input name="${key}" value="${esc(row?.[key])}" placeholder="选择门店后自动回填" readonly></label>`).join('')}
          ${select('relatedGroup',dealerColumns.relatedGroup,enabledNames(items,dealerGroupType,group),group,true)}
          <label><span>${mark(true)}${dealerColumns.scheduleScore}</span><input name="scheduleScore" inputmode="numeric" pattern="[0-9]+" value="${esc(row?.scheduleScore)}" required>
            <small>填写非负整数，分数越高，试驾排程优先级越高。</small></label>
        </div></fieldset>`;
    }
    return '';
  }

  function relationData(type, fields, current) {
    if (type === 'ABNORMAL_REASON') return {applicableLeadStatuses:fields.leadStatus===current?.applicableLeadStatuses?.[0]
      ? current.applicableLeadStatuses : [fields.leadStatus]};
    if (type === dealerType) {
      const {province,city,region,relatedGroup,scheduleScore} = fields;
      return {province,city,region,relatedGroup,scheduleScore};
    }
    return {};
  }

  const columnNames = ['字典项编码','显示名称','排序','状态','说明'];
  const relatedColumn = type => type === 'ABNORMAL_REASON' ? '适用线索状态' : '';

  function relationHeaders(type) {
    if (type === dealerType) return Object.values(dealerColumns);
    const relation = relatedColumn(type);
    return relation ? [relation] : [];
  }

  function relationValues(row,type) {
    if (type === 'ABNORMAL_REASON') return [(row.applicableLeadStatuses || []).join('、')];
    if (type === dealerType) return Object.keys(dealerColumns).map(key=>String(row[key] ?? ''));
    return [];
  }

  function referenceCount(items, type, row) {
    const name = row.name;
    let linked = 0;
    if (type === 'INITIAL_LEAD_STATUS') linked = items.ABNORMAL_REASON.filter(item=>item.applicableLeadStatuses?.includes(name)).length;
    if (type === dealerGroupType) linked = items[dealerType].filter(item=>item.relatedGroup===name).length;
    return Math.max(Number(row.refs) || 0,linked);
  }

  function preserveLinks(items, type, previous) {
    if (!['INITIAL_LEAD_STATUS',dealerGroupType].includes(type)) return;
    const names = new Map(items[type].map(row=>[row.code,row.name]));
    const renamed = new Map(previous.filter(row=>names.has(row.code) && names.get(row.code)!==row.name)
      .map(row=>[row.name,names.get(row.code)]));
    if (!renamed.size) return;
    const name = value => renamed.get(value) || value;
    if (type === 'INITIAL_LEAD_STATUS') items.ABNORMAL_REASON = items.ABNORMAL_REASON.map(row=>row.applicableLeadStatuses
      ? {...row,applicableLeadStatuses:row.applicableLeadStatuses.map(name)} : row);
    if (type === dealerGroupType) items[dealerType] = items[dealerType].map(row=>renamed.has(row.relatedGroup)
      ? {...row,relatedGroup:name(row.relatedGroup)} : row);
  }

  function init(context) {
    const host = document.querySelector('[data-foundation-dictionary]');
    if (!host) return;
    const identity = currentIdentity(context);
    const editOnly = DSession.roleKey(context) === 'super';
    const valid = () => host.isConnected && currentIdentity(DSession.context()) === identity && DApp.currentPage() === pageId && DSession.allowed(pageId);
    let data;
    try { data = read(); }
    catch (_) {
      host.textContent = '基础数据字典暂时无法读取，请刷新后重试。';
      return;
    }
    let selected = types[0].code;
    let keyword = '';
    let status = '';

    function persist(type, rows) {
      if (!valid() || localStorage.getItem(storageKey) !== data.original) throw Error('字典或使用范围已变化，请刷新后重试。');
      if(type===dealerType && !DSession.canWrite('PAGE-2223'))throw Error('当前账号没有赛马门店配置的维护权限。');
      const items = {...data.items,[type]:rows};
      preserveLinks(items,type,data.items[type]);
      const revision = data.revision+1;
      // Dictionary types without stored rows already resolve to the bundled defaults.
      const dictionary = {};
      for (const {code} of types) {
        if (JSON.stringify(items[code]) !== JSON.stringify(seed.items[code])) dictionary[code] = items[code];
      }
      const stored = {...data.stored,revision,state:{...data.stored.state,dictionary}};
      const original = JSON.stringify(stored);
      try { localStorage.setItem(storageKey,original); }
      catch (error) {
        throw Error(error.name === 'QuotaExceededError' ? '浏览器本地存储空间不足，当前填写已保留。' :
          '字典暂时无法写入本地存储，请保留填写内容后重试。');
      }
      data = {original,revision,items,stored};
      render();
    }

    function edit(type, original) {
      if(type===dealerType)return editDealer(original);
      const modal = DUI.dialog((original?'编辑':'新增') + types.find(item=>item.code===type).name,
        `<form class="foundation-dictionary-edit">${itemFields(type,original)}${relationFields(data.items,type,original)}<p class="form-error" role="alert"></p></form>`,
        [{label:'取消',run:close=>close()},{label:'保存',primary:true,run:close=>{
          const form = modal.element.querySelector('form');
          if (!form.reportValidity()) return;
          const fields = Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,value.trim()]));
          const rows = data.items[type];
          try {
            const {name,description,order} = fields;
            const code = original?.code ?? fields.code;
            if (!name) throw Error('请填写显示名称。');
            if (!original && (!validCode(code) || rows.some(row=>row.code===code))) {
              throw Error('请填写有效且唯一的字典项编码，可使用字母、数字、下划线或中划线。');
            }
            const rank = order ? Number(order) : 99;
            if (!Number.isSafeInteger(rank) || rank < 0) throw Error('排序须为非负整数。');
            const row = {status:'启用',refs:0,...original,code,name,description,order:rank,
              ...relationData(type,fields,original)};
            persist(type,original ? rows.map(item=>item===original?row:item) : [...rows,row]);
            close();
          } catch (error) { form.querySelector('[role=alert]').textContent=error.message; }
        }}],{stack:true,dismissible:true});
      const form = modal.element.querySelector('form');
      form.onsubmit = event => { event.preventDefault(); modal.buttons[1].click(); };
    }

    function editDealer(original) {
      const service=window.DFoundationDealerSource,opening=DSession.context();
      const scopeIdentity=JSON.stringify([opening?.account?.id,opening?.scope?.id,opening?.scope?.tenant?.brandId]);
      const priorRows=data.items[dealerType],priorBytes=data.original;
      let sources=[],queryResult=null,selection=null,sequence=0,querying=false;
      const modal=DUI.dialog((original?'编辑':'新增')+'赛马门店',`<form class="foundation-dictionary-edit dictionary-dealer-editor" novalidate>
        ${!DSession.canWrite('PAGE-2223')?'<p class="dictionary-dealer-readonly" role="status">当前账号仅可查看，没有业务字段维护权限，不能保存赛马门店配置。</p>':''}
        <section class="dictionary-dealer-source" aria-label="门店候选来源"><h3>从取数接口选择门店</h3>
          <p>只使用当前品牌已登记、已启用的门店查询接口。查询成功且结果完整后，按真实门店编码选择。</p>
          <div class="dictionary-dealer-query"><label><span>取数接口</span><select name="dealerSource" disabled><option value="">正在读取取数接口…</option></select></label><button type="button" class="btn" data-dealer-query disabled>查询门店候选</button></div>
          <p class="dictionary-dealer-source-status" data-dealer-source-status role="status">正在读取当前品牌可用接口…</p>
          <label><span>筛选候选门店</span><input name="dealerFilter" placeholder="按真实编码、名称或省市区筛选" disabled></label>
          <label><span>${mark(!original)}门店候选（真实编码）</span><select name="dealerCandidate" disabled><option value="">请先查询门店候选</option></select></label>
          ${original?'<div class="dictionary-dealer-history-note"><p>不选择新门店时，仅保存原门店的配置，原名称、地址、编码和来源保持不变。选择新来源门店后，<strong>原字典编码保持不变，真实门店编码另存</strong>。</p><button type="button" class="dictionary-link" data-dealer-keep-original>保留原门店，仅修改配置</button></div>':'<p>新增字典编码使用接口返回的真实门店编码，按文本保存并保留前导零。</p>'}
        </section>
        <div class="dictionary-edit-basics dictionary-dealer-identity"><label><span>字典项编码</span><input name="code" value="${esc(original?.code || '')}" readonly></label><label><span>真实门店编码</span><input name="externalStoreCode" value="${esc(original?.externalStoreCode || '')}" readonly placeholder="选择候选后回填"></label>
          <label class="dictionary-full"><span>门店名称</span><input name="name" value="${esc(original?.name || '')}" readonly placeholder="选择候选后回填"></label>
          <label><span>排序</span><input type="number" name="order" min="0" step="1" value="${esc(original?.order ?? 99)}"></label>
          <label class="dictionary-full"><span>说明</span><textarea name="description" rows="2">${esc(original?.description || '')}</textarea></label></div>
        ${relationFields(data.items,dealerType,original)}<p class="form-error" data-dealer-error role="alert"></p>
      </form>`,[{label:'取消',run:close=>{cancelSource();sequence++;close();}},{label:'保存',primary:true,run:close=>saveDealer(close)}],{stack:true,dismissible:true});
      modal.element.querySelector('.d-dialog').classList.add('dictionary-dealer-dialog');
      const form=modal.element.querySelector('form'),source=form.elements.dealerSource,candidate=form.elements.dealerCandidate;
      const filter=form.elements.dealerFilter,queryButton=form.querySelector('[data-dealer-query]');
      const status=form.querySelector('[data-dealer-source-status]'),error=form.querySelector('[data-dealer-error]');
      const saveButton=modal.buttons[1];
      const alive=()=>form.isConnected && valid() && JSON.stringify([DSession.context()?.account?.id,
        DSession.context()?.scope?.id,DSession.context()?.scope?.tenant?.brandId])===scopeIdentity;
      const canWriteDealer=()=>valid() && DSession.canWrite('PAGE-2223');
      const fail=message=>{error.textContent=message;};
      const messageOf=result=>result?.error || result?.message || '门店来源暂不可用，请重新查询。';
      function cancelSource() {try {service?.cancel?.(opening);} catch (_) { /* Scope changes already invalidate old responses. */ }}
      function restoreIdentity() {
        for(const key of ['code','name','externalStoreCode','province','city','region'])form.elements[key].value=original?.[key] ?? '';
        form.elements.relatedGroup.required=!original;form.elements.scheduleScore.required=!original;
        for(const key of ['order','description','relatedGroup','scheduleScore'])form.elements[key].disabled=!canWriteDealer();
      }
      function resetCandidates(message) {
        selection=null;queryResult=null;candidate.innerHTML='<option value="">请先查询门店候选</option>';
        candidate.disabled=true;filter.disabled=true;filter.value='';restoreIdentity();
        status.textContent=message;queryButton.textContent='查询门店候选';error.textContent='';
      }
      function renderCandidates() {
        const term=filter.value.trim().toLocaleLowerCase();
        const matched=queryResult.items.filter(item=>[item.code,item.name,item.province,item.city,item.region].some(value=>String(value || '').toLocaleLowerCase().includes(term)));
        const shown=[...matched];
        const chosen=selection && queryResult.items.find(item=>item.code===selection.code);
        if(chosen && !shown.some(item=>item.code===chosen.code))shown.push(chosen);
        candidate.innerHTML='<option value="">请选择接口返回的门店</option>'+shown.map(item=>`<option value="${esc(item.code)}"${selection?.code===item.code?' selected':''}>${esc(item.name)}（${esc(item.code)}）${term && !matched.includes(item)?' · 当前已选':''}</option>`).join('');
        candidate.value=selection?.code || '';candidate.disabled=!queryResult.items.length;
        status.textContent='已完整查询 '+queryResult.items.length+' 家门店；当前筛选 '+matched.length+' 家。'+(original && !selection?'尚未更换门店，保存仍保留原门店身份。':'');
      }
      function resolveSelection() {
        if(!selection || !service?.resolve)throw Error('请先查询并选择接口返回的真实门店。');
        const resolved=service.resolve(DSession.context(),{proof:selection.proof,code:selection.code});
        if(!resolved?.ok)throw Error(messageOf(resolved));
        const item=resolved.item,reference=resolved.reference;
        if(!item || !validDealerCode(item.code) || !String(item.name || '').trim() || item.code!==selection.code ||
            reference?.externalStoreCode!==item.code || reference.externalSource?.dictionaryId!==selection.sourceId ||
            reference.externalSource?.brandId!==opening.scope.tenant.brandId || reference.externalSource?.tenantId!==opening.scope.id)throw Error('门店编码、来源或当前品牌无法复核，请重新查询。');
        return resolved;
      }
      function checkDuplicate(item,reference) {
        const other=priorRows.filter(row=>row!==original);
        const duplicate=other.find(row=>String(row.externalStoreCode || '')===item.code &&
          (row.externalSource?.capabilityId && reference.externalSource.capabilityId?
            row.externalSource.capabilityId===reference.externalSource.capabilityId:
            row.externalSource?.dictionaryId===reference.externalSource.dictionaryId));
        if(duplicate)throw Error('相同门店编码体系中的门店已配置为「'+duplicate.name+'」（'+duplicate.code+'），请编辑原配置，不会因接口名称不同重复新增或自动合并。');
        const sameCode=other.find(row=>!hasExternalIdentity(row) && (row.code===item.code || String(row.externalStoreCode || '')===item.code));
        const sameName=other.find(row=>!hasExternalIdentity(row) && String(row.name || '').trim().toLocaleLowerCase()===String(item.name).trim().toLocaleLowerCase());
        if(sameCode || sameName){const existing=sameCode || sameName;throw Error('已有同编码或同名配置「'+existing.name+'」（'+existing.code+'），请先核对其门店身份并编辑对应条目；不会按名称自动合并。');}
      }
      function saveDealer(close) {
        if(!alive())return fail('账号、租户或当前页面已变化，请重新打开。');
        if(!canWriteDealer())return fail('当前账号没有赛马门店配置的维护权限。');
        if(querying)return fail('门店候选仍在查询，请等待完成后保存。');
        if(data.original!==priorBytes || data.items[dealerType]!==priorRows)return fail('字典已变化，请关闭后重新编辑，当前草稿未保存。');
        try {
          const description=form.elements.description.value.trim(),order=form.elements.order.value.trim();
          const rank=order?Number(order):99;
          if(!Number.isSafeInteger(rank) || rank<0)throw Error('排序须为非负整数。');
          const group=form.elements.relatedGroup.value,score=form.elements.scheduleScore.value.trim();
          const groupChanged=group!==String(original?.relatedGroup ?? ''),scoreChanged=score!==String(original?.scheduleScore ?? '');
          const enabledGroups=data.items[dealerGroupType].filter(item=>item.status==='启用').map(item=>item.name);
          if((!original || selection || groupChanged) && (!group || !enabledGroups.includes(group)))throw Error('新增或更换门店时须选择已启用的赛马小组；原停用小组只可随历史门店配置保留。');
          if((!original || selection || scoreChanged) && (!/^\d+$/.test(score) || !Number.isSafeInteger(Number(score))))throw Error('排程分数须为非负整数。');
          let row={status:'启用',refs:0,...original,description,order:rank,relatedGroup:group,
            scheduleScore:!scoreChanged && original?original.scheduleScore:score};
          if(selection) {
            const resolved=resolveSelection();checkDuplicate(resolved.item,resolved.reference);
            const item=resolved.item;
            row={...row,code:original?.code ?? item.code,name:item.name,province:item.province || '',city:item.city || '',region:item.region || '',
              externalStoreCode:resolved.reference.externalStoreCode,externalSource:structuredClone(resolved.reference.externalSource),
              externalStoreSnapshot:structuredClone(resolved.reference.externalStoreSnapshot)};
            if(!original && priorRows.some(existing=>existing.code===row.code))throw Error('真实门店编码与现有字典编码重复，请核对原配置。');
          } else if(!original)throw Error('请先选择取数接口，完整查询并选择真实门店后保存。');
          // Read-only identity fields are display only. Historical edits retain
          // their original identity; new selections use the source proof again.
          persist(dealerType,original?priorRows.map(item=>item===original?row:item):[...priorRows,row]);
          cancelSource();sequence++;close();DUI.toast('赛马门店配置已保存。');
        } catch(cause) {fail(cause.message || '门店配置未保存，请重试。');}
      }
      source.addEventListener('change',()=>{
        cancelSource();sequence++;querying=false;saveButton.disabled=!canWriteDealer();
        resetCandidates('取数接口已切换，请重新查询并选择门店。'+(original?'不选择新门店时只保存原配置。':''));
        queryButton.disabled=!sources.some(item=>item.id===source.value);
      });
      queryButton.addEventListener('click',async()=>{
        if(!alive() || !service?.query || !sources.some(item=>item.id===source.value))return;
        cancelSource();
        const sourceId=source.value,requested=++sequence;
        resetCandidates('正在查询门店候选，未完成的结果不会用于新增。');querying=true;saveButton.disabled=true;queryButton.disabled=true;
        let result;
        try {result=await service.query(DSession.context(),sourceId);}
        catch (_) {result={ok:false,error:'门店查询失败，请重试；不会改用静态候选。'};}
        if(!alive() || requested!==sequence || source.value!==sourceId)return;
        querying=false;saveButton.disabled=!canWriteDealer();queryButton.disabled=false;
        const items=result?.items;
        if(!result?.ok || result.complete!==true || !Array.isArray(items) || items.length>0 && !result.proof ||
            items.some(item=>!validDealerCode(item.code) || !String(item.name || '').trim()) || new Set(items.map(item=>item.code)).size!==items.length) {
          resetCandidates(result?.ok && result.complete!==true?'门店查询结果不完整，请重新查询；当前不能作为新增候选。':messageOf(result));return;
        }
        queryResult=result;filter.disabled=false;queryButton.textContent='刷新门店候选';renderCandidates();
        if(!items.length)status.textContent='此接口完整返回 0 家门店，请核对来源配置后刷新；不会改用静态候选。';
      });
      filter.addEventListener('input',()=>{if(queryResult)renderCandidates();});
      candidate.addEventListener('change',()=>{
        error.textContent='';
        if(!candidate.value){selection=null;restoreIdentity();status.textContent=original?'尚未选择新门店，保存只修改原门店配置。':'请选择接口完整返回的门店候选。';return;}
        selection={proof:queryResult?.proof,code:candidate.value,sourceId:source.value};
        try {
          const resolved=resolveSelection(),item=resolved.item;
          form.elements.code.value=original?.code ?? item.code;form.elements.externalStoreCode.value=item.code;form.elements.name.value=item.name;
          for(const key of ['province','city','region'])form.elements[key].value=item[key] || '';
          form.elements.relatedGroup.required=true;form.elements.scheduleScore.required=true;
          status.textContent='已选择「'+item.name+'」（'+item.code+'）。'+(original?'原字典编码 '+original.code+' 保持不变，真实门店编码另存。':'字典编码使用真实门店编码。');
        } catch(cause) {selection=null;candidate.value='';restoreIdentity();fail(cause.message);}
      });
      form.querySelector('[data-dealer-keep-original]')?.addEventListener('click',()=>{
        cancelSource();sequence++;querying=false;saveButton.disabled=!canWriteDealer();
        resetCandidates('已保留原门店身份，本次仅保存组别、分数、排序和说明等配置。');
        queryButton.disabled=!sources.some(item=>item.id===source.value);
      });
      form.onsubmit=event=>{event.preventDefault();saveButton.click();};
      restoreIdentity();saveButton.disabled=!canWriteDealer();
      void (async()=>{
        cancelSource();
        let result;
        try {result=await service?.list(DSession.context());}
        catch (_) {result={ok:false,error:'取数接口目录暂不可读，请重新打开后重试。'};}
        if(!alive())return;
        sources=result?.ok && Array.isArray(result.sources)?result.sources:[];
        const oldSource=original?.externalSource?.dictionaryId;
        const oldAvailable=oldSource && sources.some(item=>item.id===oldSource);
        source.innerHTML='<option value="">请选择取数接口</option>'+(!oldAvailable && oldSource?`<option value="${esc(oldSource)}" disabled>原来源已失效（仅保留历史）</option>`:'')+sources.map(item=>`<option value="${esc(item.id)}">${esc(item.label || item.name)}</option>`).join('');
        source.value=oldSource || (sources.length===1?sources[0].id:'');source.disabled=!sources.length;
        queryButton.disabled=!sources.some(item=>item.id===source.value);
        status.textContent=!result?.ok?messageOf(result):!sources.length?'暂无可用的门店取数接口。请先在“取数接口字典”登记并启用门店查询能力，再返回此处查询。':
          oldSource && !oldAvailable?'原接口已失效，旧门店配置仍可保留；更换门店须重新选择有效接口并查询。':
          '已读取 '+sources.length+' 个门店查询接口，请查询候选后按真实编码选择。'+(original?'也可不更换门店，仅编辑原配置。':'');
      })();
    }

    function confirmChange(type, row, remove) {
      if (remove && referenceCount(data.items,type,row)) {
        DUI.toast('该字典项已有引用，请停用或替换后再删除。');
        return;
      }
      const action = remove?'删除':row.status==='启用'?'停用':'启用';
      const impact = action==='停用' ? '<p>历史记录沿用原值，新办理时将收起此选项。</p>' : '';
      const modal = DUI.dialog(`${action}字典项`,`<p>${action}「${esc(row.name)}」？</p>${impact}`,
        [{label:'取消',run:close=>close()},{label:action,primary:true,run:close=>{
          try {
            const rows = data.items[type];
            if (remove && referenceCount(data.items,type,row)) throw Error('该字典项已有引用，请停用或替换后再删除。');
            persist(type,remove?rows.filter(item=>item!==row):rows.map(item=>item===row ? {...item,status:action} : item));
            close();
          } catch (error) { DUI.toast(error.message); }
        }}],{stack:true,dismissible:true});
      if (remove) modal.buttons[1].classList.add('btn-danger');
    }

    async function files() {
      await DModuleHost.prepareIntegration();
      const utility = document.querySelector('iframe[data-native-module=cloud]')?.contentWindow?.DImportFiles;
      if (!utility || !valid()) throw Error('当前文件服务暂不可用，请重新打开基础数据字典。');
      return utility;
    }

    async function exportItems(type) {
      const utility = await files();
      const header = [...columnNames,...(type.code===dealerType?['门店编码']:[]),...relationHeaders(type.code),'引用次数'];
      const rows = [...data.items[type.code]].sort((a,b)=>a.order-b.order).map(row=>
        [row.code,row.name,row.order,row.status,row.description,...(type.code===dealerType?[String(row.externalStoreCode ?? '')]:[]),...relationValues(row,type.code),referenceCount(data.items,type.code,row)]);
      const file = await utility.template(header.map((label,index)=>({key:'column'+index,label,type:'text'})),
        type.name,'xlsx','基础数据字典',rows);
      if (valid()) utility.save({...file,fileName:type.name+'字典数据.xlsx'});
    }

    function openImport(type) {
      const rows = data.items[type.code];
      window.DReview21DictionaryImport.open({
        type,rows,files,valid:()=>valid() && data.items[type.code] === rows && (type.code!==dealerType || DSession.canWrite('PAGE-2223')),
        persist:next=>persist(type.code,next),
        relatedColumn:relatedColumn(type.code),
        relatedValues:type.code === 'ABNORMAL_REASON' ? enabledNames(data.items,'INITIAL_LEAD_STATUS').filter(Boolean) : [],
        dealer:type.code === dealerType ? {
          columns:dealerColumns,groups:new Set(enabledNames(data.items,dealerGroupType).filter(Boolean)),
          sourceService:window.DFoundationDealerSource,context:()=>DSession.context()
        } : null,
        validCode:type.code===dealerType?validDealerCode:validCode
      });
    }

    function render() {
      const type = types.find(item=>item.code===selected);
      const readonlyDealer=type.code===dealerType && !DSession.canWrite('PAGE-2223');
      const rows = [...data.items[type.code]].sort((a,b)=>a.order-b.order).filter(row=>
        (!status || row.status===status) && [row.code,row.name,row.description].some(value=>String(value??'').toLowerCase().includes(keyword)));
      const actions = editOnly || readonlyDealer?'':`<button type="button" class="btn btn-primary" data-dictionary-add>新增数据</button>`;
      const importable = type.importable!==false;
      const headers = relationHeaders(type.code);
      const items = rows.map((row,index)=>{
        const references = referenceCount(data.items,type.code,row);
        return `<tr><td><code>${esc(row.code)}</code></td><td>${esc(row.name)}${type.code===dealerType && row.externalStoreCode?`<small class="dictionary-dealer-reference">真实门店编码：${esc(row.externalStoreCode)}${row.externalSource?.dictionaryName?' · '+esc(row.externalSource.dictionaryName):''}</small>`:''}</td><td>${esc(row.description || '—')}</td>
          ${relationValues(row,type.code).map(value=>`<td>${esc(value || '—')}</td>`).join('')}<td>${esc(row.order)}</td><td>${references ? references+' 处' : '—'}</td>
          <td><span class="dictionary-status${row.status==='启用'?' enabled':''}">${esc(row.status)}</span></td>
          <td><div class="dictionary-row-actions"><button type="button" class="dictionary-link" data-dictionary-edit="${index}">${readonlyDealer?'查看':'编辑'}</button>${editOnly || readonlyDealer?'':`
          <button type="button" class="dictionary-link" data-dictionary-toggle="${index}">${row.status==='启用'?'停用':'启用'}</button>
          <button type="button" class="dictionary-link danger" data-dictionary-delete="${index}"${references?' disabled title="已有引用，请停用或替换"':''}>删除</button>`}</div></td></tr>`;
      }).join('');
      host.innerHTML = `<div class="foundation-dictionary-layout">
        <aside class="dictionary-types" aria-label="字典分类"><h2>字典分类</h2><div>${types.map(item=>`<button type="button" aria-pressed="${item===type}" data-dictionary-type="${item.code}"><span>${esc(item.name)}</span><small>${data.items[item.code].length} 项</small></button>`).join('')}</div></aside>
        <section aria-label="${esc(type.name)}" class="table-card dictionary-content">
          <header class="list-toolbar dictionary-toolbar" data-rtl-region="toolbar"><div><h2>${esc(type.name)}</h2><p>${esc(type.description)}</p></div>
          <div class="dictionary-actions">${importable?`${editOnly || readonlyDealer?'':'<button type="button" class="btn" data-dictionary-import>导入数据</button>'}<button type="button" class="btn" data-dictionary-export>导出数据</button>`:''}${actions}</div></header>
          <form class="foundation-dictionary-filter" data-rtl-region="filters"><label><span>搜索字典项</span><input name="keyword" type="search" value="${esc(keyword)}" placeholder="搜索编码、名称或说明"></label>
          ${select('status','状态',['','启用','停用'],status,false,'全部状态')}<button type="submit" class="btn">查询</button><button type="button" class="btn" data-dictionary-reset>重置</button></form>
          <div class="table-scroll" data-rtl-region="table"><table class="platform-table"><thead><tr><th>字典项编码</th><th>显示名称</th><th>说明</th>${headers.map(label=>`<th>${esc(label)}</th>`).join('')}<th>排序</th><th>引用情况</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${items || `<tr><td colspan="${7+headers.length}" class="dictionary-empty">暂无匹配的字典项</td></tr>`}</tbody>
          </table></div>
        </section></div>`;
      for (const button of host.querySelectorAll('[data-dictionary-type]')) button.onclick = () => {
        selected=button.dataset.dictionaryType; keyword=''; status=''; render();
      };
      host.querySelector('form').onsubmit = event => {
        event.preventDefault();
        keyword=event.target.elements.keyword.value.trim().toLowerCase();
        status=event.target.elements.status.value;
        render();
      };
      host.querySelector('[data-dictionary-reset]').onclick = () => { keyword=''; status=''; render(); };
      host.querySelector('[data-dictionary-add]')?.addEventListener('click',()=>edit(type.code));
      for (const control of host.querySelectorAll('[data-dictionary-edit]')) control.onclick = ()=>edit(type.code,rows[control.dataset.dictionaryEdit]);
      for (const control of host.querySelectorAll('[data-dictionary-toggle]')) control.onclick = ()=>confirmChange(type.code,rows[control.dataset.dictionaryToggle],false);
      for (const control of host.querySelectorAll('[data-dictionary-delete]')) control.onclick = ()=>confirmChange(type.code,rows[control.dataset.dictionaryDelete],true);
      host.querySelector('[data-dictionary-export]')?.addEventListener('click',()=>exportItems(type).catch(error=>DUI.toast(error.message)));
      host.querySelector('[data-dictionary-import]')?.addEventListener('click',()=>openImport(type));
    }
    render();
  }

  window.Pages[pageId] = {
    render() {
      return '<section class="platform-page" data-rtl-page-type="list"><header class="d-page-heading" data-rtl-region="page-header"><h1>基础数据字典</h1></header><div data-foundation-dictionary></div></section>';
    },
    init
  };
})();
