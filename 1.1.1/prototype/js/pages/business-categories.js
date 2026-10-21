/** Tenant business categories and reusable fields managed in one module. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, model = CustomerBusiness;
  const layerId = 'business-configuration-editor';
  const discardConfirmId = 'business-config-discard-confirm';
  const deleteConfirmId='business-config-delete-confirm',referencesId='business-config-references';
  const typeNames = {text:'单行文本',textarea:'多行文本',number:'数字',select:'单选',multiselect:'多选',date:'日期',datetime:'日期和时间',interface:'接口取数'};
  const kindNames = {category:'业务分类',field:'自定义字段',dictionary:'取数接口字典'};
  const routeNames = {category:'business-categories',field:'business-fields'};
  const clone = value => JSON.parse(JSON.stringify(value));
  const isMappingSeries = field => model.isMappingSeriesField?.(field) === true;
  const action = (method,...args) => esc('BusinessConfiguration.'+method+'('+args.map(value=>JSON.stringify(value)).join(',')+')');
  const states = {category:{keyword:'',status:''},field:{keyword:'',status:''}};
  let tenantId = '', context = '', editor = null, activeKind = 'category', flowChanged = false, savedGuidance = null, pendingFieldId = '', discardRequest = null, deletionRequest = null;
  let referenceRequest=null,referenceSequence=0;

  function availableKinds() {
    const kinds=model.canManage()&&model.tenants().length?['category','field']:[];
    if(window.BusinessData?.canManage?.()===true)kinds.push('dictionary');
    return kinds;
  }
  function clearDeletionSurfaces() {
    const request=deletionRequest;deletionRequest=null;
    referenceRequest=null;
    if(request?.confirmation&&document.getElementById(deleteConfirmId)===request.confirmation)ui.closeLayer(deleteConfirmId,false);
    ui.closeLayer(referencesId,false);
  }
  function currentScope() { return {enterpriseId:AppState.get().enterpriseId,tenantId}; }
  function syncScope() {
    const next = model.context(), tenants = model.tenants();
    if (context !== next) {
      context = next; tenantId = '';
      savedGuidance=null;pendingFieldId='';
      Object.values(states).forEach(state => { state.keyword = ''; state.status = ''; });
      dismissAll();
    }
    if (!tenants.some(row=>row.tenantId===tenantId)) tenantId = tenants[0]?.tenantId || '';
    return tenants;
  }
  function refresh() { RouteRuntime.refreshCurrent(); }
  function catalog() { syncScope(); return model.catalog(currentScope()); }
  function rowsOf(kind, data) { return kind==='category' ? data.rows : data.fields; }
  function isActive() {
    return !!editor && model.canManage() && editor.context===model.context() &&
      model.tenants().some(row=>row.tenantId===editor.scope.tenantId);
  }
  function editorDirty(value) {
    return !!value && !value.previewOnly && JSON.stringify(value.values)!==JSON.stringify(value.initialValues);
  }
  function editorStackDirty(value) {
    for (let current=value; current; current=current.parent) {
      if (editorDirty(current)) return true;
    }
    return false;
  }
  function clearDiscardConfirmation() {
    const request=discardRequest; discardRequest=null;
    if(request?.confirmation && document.getElementById(discardConfirmId)===request.confirmation) ui.closeLayer(discardConfirmId,false);
  }
  // Persistence and scope cleanup deliberately bypass user-initiated discard prompts.
  function dismissAll() { clearDiscardConfirmation(); clearDeletionSurfaces(); editor = null; ui.closeLayer(layerId); }
  function leaveEditor(value) {
    if(editor!==value) return;
    if(value.parent) { editor=value.parent; draw(true); return; }
    dismissAll();
    if(flowChanged) { flowChanged=false; refresh(); }
  }
  function close() {
    const value=editor;
    if(!value) return;
    if(!isActive()) { dismissAll(); return; }
    if(!editorDirty(value)) { clearDiscardConfirmation(); leaveEditor(value); return; }
    const layer=document.getElementById(layerId);
    if(discardRequest?.editor===value && discardRequest.layer===layer && document.getElementById(discardConfirmId)) return;
    clearDiscardConfirmation();
    const request={editor:value,layer,snapshot:JSON.stringify(value.values),confirmation:null};
    discardRequest=request;
    ui.confirm({
      id:discardConfirmId, title:'放弃未保存的内容？',
      body:'<p>当前'+kindNames[value.kind]+'的修改尚未保存。'+(value.parent?'放弃后返回分类，分类中原有的未保存内容仍会保留。':'放弃后本次修改将丢失。')+'</p>',
      cancelText:'继续填写', confirmText:value.parent?'放弃修改并返回分类':'放弃修改并关闭', danger:true,
      onConfirm:()=>{
        // PlatformUI.confirm normally closes by ID after this callback. Returning
        // false also prevents an obsolete callback from closing a newer prompt.
        if(discardRequest!==request || document.getElementById(discardConfirmId)!==request.confirmation) return false;
        const current=editor===value && document.getElementById(layerId)===layer && isActive();
        const unchanged=JSON.stringify(value.values)===request.snapshot;
        clearDiscardConfirmation();
        if(!current) return false;
        if(!unchanged) { showToast('填写内容已变化，请确认当前修改后再退出','warning'); return false; }
        leaveEditor(value);
        return false;
      }
    });
    request.confirmation=document.getElementById(discardConfirmId);
  }
  function tenantFilter(tenants) {
    return AppState.isSuper() ? `<label class="field"><span>所属租户</span><select id="business-config-tenant" onchange="BusinessConfiguration.changeTenant(this.value)">${tenants.map(row=>`<option value="${esc(row.tenantId)}" ${row.tenantId===tenantId?'selected':''}>${esc(row.name)}</option>`).join('')}</select></label>` : '';
  }
  function links(kind) {
    return `<div class="record-type-tabs" role="tablist" aria-label="业务分类配置">${availableKinds().map(key=>`<button type="button" class="${kind===key?'active':''}" role="tab" aria-selected="${kind===key}" onclick="BusinessConfiguration.selectKind('${key}')">${kindNames[key]}</button>`).join('')}</div>`;
  }
  function operationGuide() {
    return '<div class="business-operation-guide" aria-label="配置步骤"><strong>首次配置</strong><span>1. 新建自定义字段</span><span aria-hidden="true">→</span><span>2. 加入业务分类</span><span aria-hidden="true">→</span><span>3. 预览并保存分类，供客服填写</span></div>';
  }
  function savedGuide(kind,data) {
    if(!savedGuidance||savedGuidance.context!==context||savedGuidance.tenantId!==tenantId) return '';
    const field=data.fields.find(row=>row.id===savedGuidance.fieldId);
    if(!field) return '';
    const count=data.rows.filter(row=>row.fields.some(ref=>ref.fieldId===field.id)).length;
    const text=count?'“'+field.label+'”已保存，当前在 '+count+' 个业务分类中使用。可进入业务分类查看或配置其他分类。':'“'+field.label+'”已保存到字段库，尚未加入业务分类。下一步：编辑目标业务分类，添加此字段并保存。';
    return '<div id="business-config-saved-guidance" class="business-config-notice" role="status"><div><strong>'+esc(text)+'</strong>'+(kind==='category'&&pendingFieldId===field.id?'<p>请点击目标分类的“编辑”，添加字段处已为你预选“'+esc(field.label)+'”；添加后仍需保存分类。</p>':'')+'</div>'+(kind==='field'?'<button id="business-config-next-category" type="button" class="btn" onclick="BusinessConfiguration.configureSavedField()">去配置业务分类</button>':'')+'</div>';
  }
  function configureSavedField() {
    if(!savedGuidance||savedGuidance.context!==model.context()||savedGuidance.tenantId!==tenantId||!model.canManage()) return;
    pendingFieldId=savedGuidance.fieldId;selectKind('category');
  }
  function selectKind(kind, rerender=true) {
    if(!availableKinds().includes(kind)) {showToast('当前账号无权维护此配置','warning');return false;}
    activeKind=kind;
    if(rerender) {
      const route=kind==='dictionary'?'business-data-dictionary':routeNames[kind];
      if(window.RouteRuntime?.openPrimary)return RouteRuntime.openPrimary(route,{preserveFilters:true});
      refresh();
    }
    return true;
  }
  function filterHtml(kind,tenants) {
    const state=states[kind];
    return `<div class="filter-panel">${tenantFilter(tenants)}<label class="field grow"><span>${kindNames[kind]}名称</span><input id="business-config-keyword" value="${esc(state.keyword)}" placeholder="输入名称"></label><label class="field"><span>使用状态</span><select id="business-config-status"><option value="">全部状态</option><option value="enabled" ${state.status==='enabled'?'selected':''}>启用</option><option value="disabled" ${state.status==='disabled'?'selected':''}>停用</option></select></label><div class="filter-actions"><button class="btn" onclick="${action('reset',kind)}">重置</button><button class="btn btn-primary" onclick="${action('query',kind)}">查询</button></div></div>`;
  }
  function sortedRows(kind,data) {
    const state=states[kind];
    const rows=rowsOf(kind,data).filter(row=>(!state.keyword||row.label.toLocaleLowerCase().includes(state.keyword.toLocaleLowerCase()))&&(!state.status||row.enabled===(state.status==='enabled')));
    return ui.sortByUpdated?.(rows,[]) || rows;
  }
  function fieldName(id,data) {
    return data.fields.find(row=>row.id===id)?.label || '字段已移除';
  }
  function sourceDescription(field,scope=currentScope()) {
    if(field?.type!=='interface') return '';
    if(!field.dictionaryId) return '未选择取数接口';
    const entry=window.BusinessData?.entry(field.dictionaryId);
    return (entry?.name || field.dictionaryId || '未选择取数接口') + (window.BusinessData?.available(field.dictionaryId,scope)?'':'（来源不可用）');
  }
  function rowActions(kind,row,data) {
    return `<div class="table-actions"><button onclick="${action('open',kind,row.id)}">编辑</button><button onclick="${action('open',kind,row.id,true)}">预览</button><button onclick="${action('toggle',kind,row.id,!row.enabled)}">${row.enabled?'停用':'启用'}</button><button class="business-delete-action" onclick="${action('remove',kind,row.id)}">删除</button></div>`;
  }
  function tableColumns(kind,data) {
    const common=[{key:'label',label:'名称',render:value=>`<strong>${esc(value)}</strong>`}];
    if(kind==='category') common.push(
      {key:'codeLabel',label:'导入业务编码'},
      {key:'fields',label:'客服填写字段',render:value=>`${value.filter(item=>item.enabled).length} 个<span class="business-category-sub">${esc(value.filter(item=>item.enabled).slice(0,4).map(item=>fieldName(item.fieldId,data)).join('、'))}</span>`}
    );
    if(kind==='field') common.push(
      {key:'type',label:'填写方式',render:(value,row)=>esc(typeNames[value]||value)+(value==='interface'?'<span class="business-category-sub">'+esc(sourceDescription(row))+'</span>':'')},
      {key:'depends',label:'上游依赖',render:(_,row)=>esc(model.usesQueryConditions(row)?(model.parameterBinding(row)?.required?'必需 · ':'可选 · ')+(model.activeDependencies(row).map(id=>fieldName(id,data)).join('、')||'待配置'):'无')},
      {key:'businessKey',label:'业务字段编码',render:value=>esc(value||'—')},
      {key:'options',label:'选项数',render:(value,row)=>['select','multiselect'].includes(row.type) ? esc(value?.length||0) : '—'}
    );
    common.push({key:'enabled',label:'状态',render:(value,row)=>ui.status(value?'启用':'停用')+(kind==='category'&&model.configurationIssue(row.id,currentScope())?'<span class="business-category-error business-category-sub">配置待修复</span>':'')},{key:'id',label:'操作',render:(_,row)=>rowActions(kind,row,data)});
    return common;
  }
  function render(kind=activeKind) {
    const kinds=availableKinds();
    if(!kinds.length) {dismissAll();return ui.empty('当前账号无业务配置权限');}
    const tenants=syncScope();
    activeKind=kinds.includes(kind)?kind:kinds[0];kind=activeKind;
    if(kind==='dictionary') {
      const page=window.Pages?.['business-data-dictionary'],scope=model.canManage()&&tenants.some(row=>row.tenantId===tenantId)?currentScope():null;
      const content=typeof page?.render==='function'?page.render({embedded:true,scope}):ui.empty('取数接口字典暂时无法载入，请重试');
      return `<section class="platform-page business-categories-page business-config-page" data-business-config-kind="dictionary">${ui.pageHeader('业务分类','统一维护取数接口，并设置允许使用的租户。')}${links(kind)}${content}</section>`;
    }
    const data=catalog(), rows=data.ok?sortedRows(kind,data):[];
    const descriptions={
      category:'维护导入业务类型，直接设置客服填写字段的顺序、显示和必填。',
      field:'先维护可复用的客服填写字段，再把字段加入需要使用它的业务分类。'
    };
    const issues=kind==='category'&&data.ok?data.rows.map(row=>({row,message:model.configurationIssue(row.id,currentScope())})).filter(item=>item.message):[];
    return `<section class="platform-page business-categories-page business-config-page">${ui.pageHeader('业务分类',descriptions[kind])}${operationGuide()}${links(kind)}${savedGuide(kind,data)}${filterHtml(kind,tenants)}${issues.length?'<div class="business-category-error" role="alert">'+issues.map(item=>esc(item.row.label)+'：'+esc(item.message)).join('<br>')+'</div>':''}${data.ok?'':`<p class="business-category-error" role="alert">${esc(data.message)}</p>`}<div class="management-list-shell">${ui.toolbar(`<button class="btn btn-primary" ${data.ok?'':'disabled'} onclick="${action('open',kind)}">新增${kindNames[kind]}</button>`,'<button class="btn" onclick="BusinessConfiguration.refresh()">刷新</button>')}${ui.table(tableColumns(kind,data),rows,{emptyText:'暂无'+kindNames[kind]+'，请新增'})}</div></section>`;
  }
  function changeTenant(value) {
    if(!model.tenants().some(row=>row.tenantId===value)) return;
    tenantId=value; Object.values(states).forEach(state=>{state.keyword='';state.status='';});
    savedGuidance=null;pendingFieldId='';dismissAll(); refresh();
  }
  function query(kind) {
    if(!states[kind]) return;
    states[kind].keyword=document.getElementById('business-config-keyword')?.value.trim()||'';
    states[kind].status=document.getElementById('business-config-status')?.value||'';
    refresh();
  }
  function reset(kind) { if(!states[kind]) return; states[kind].keyword='';states[kind].status='';refresh(); }
  function initial(kind) {
    if(kind==='category') return {id:model.newId('biz'),label:'',codeLabel:'业务编码',prefix:'BIZ',enabled:true,fields:[]};
    return {id:model.newId('field'),label:'',type:'text',businessKey:'',options:[],enabled:true};
  }
  function open(kind,id,previewOnly=false) {
    if(!states[kind]||!model.canManage()||context!==model.context()) return showToast('工作范围已变化，请刷新后操作','warning');
    const data=catalog(); if(!data.ok) return showToast(data.message,'warning');
    const value=id ? rowsOf(kind,data).find(row=>row.id===id) : initial(kind);
    if(!value) return showToast('当前租户没有此配置','warning');
    flowChanged=false;
    editor={kind,values:clone(value),initialValues:clone(value),scope:clone(currentScope()),context:model.context(),revision:data.revision,previewOnly,creating:!id,selectedFieldId:kind==='category'&&!value.fields.some(ref=>ref.fieldId===pendingFieldId)?pendingFieldId:''};
    editor.initialValues=clone(editor.values);
    draw(true);
  }
  function openRelated(kind) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category'||kind!=='field') return;
    const data=model.catalog(editor.scope);
    if(!data.ok||data.revision!==editor.revision) return error('业务配置已更新，请重新打开分类后再新增字段');
    const values=initial(kind);
    editor={kind,values,initialValues:clone(values),scope:clone(editor.scope),context:editor.context,revision:data.revision,previewOnly:false,creating:true,parent:editor};
    draw(true);
  }
  function clearError() {
    const node=document.getElementById('business-config-error');
    if(node) node.textContent='';
    document.querySelectorAll?.('#'+layerId+' [aria-invalid="true"]')?.forEach(node=>node.removeAttribute?.('aria-invalid'));
  }
  function bindingErrorTarget(checked) {
    if(checked?.code==='unsupported_parameter')return 'business-field-parameter-name';
    if(['capability_unavailable','missing_metadata'].includes(checked?.code))return 'business-field-interface';
    if(checked?.code==='invalid_source')return 'business-field-series-dependency';
    if(['value_domain_mismatch','value_type_mismatch','unsupported_source_value'].includes(checked?.code)) {
      const source=model.getField(model.activeDependencies(editor.values)[0],editor.scope);
      return model.dependencyCompatible(editor.values,source)?'business-field-source-value-key':'business-field-series-dependency';
    }
    return '';
  }
  function error(message,targetId) {
    const node=document.getElementById('business-config-error');
    if(node) {
      node.textContent=message;node.tabIndex=-1;
      const inferred=targetId||(/入参|参数名/.test(message)?'business-field-parameter-name':/上游取值|返回字段/.test(message)?'business-field-source-value-key':editor?.kind==='field'&&/关联字段|前置输入/.test(message)?'business-field-series-dependency':'');
      const target=(inferred&&document.getElementById(inferred))||node;
      target.setAttribute?.('aria-invalid','true');target.scrollIntoView?.({block:'nearest'});target.focus?.({preventScroll:true});
    } else showToast(message,'warning');
    return false;
  }
  function resolvedFields(category,data) {
    return category.fields.filter(ref=>ref.enabled!==false).map(ref=>{
      const field=data.fields.find(row=>row.id===ref.fieldId);
      return field&&field.enabled!==false ? {...field,required:ref.required===true} : null;
    }).filter(Boolean);
  }
  function isSeriesField(field) { return isMappingSeries(field)||field?.type==='interface'&&model.interfaceKind(field)==='series'; }
  function hasSeriesField(category,data) {
    return category.fields.some(ref=>isSeriesField(data.fields.find(field=>field.id===ref.fieldId)));
  }
  function availableCategoryFields(category,data) {
    const used=new Set(category.fields.map(ref=>ref.fieldId)), hasSeries=hasSeriesField(category,data);
    return data.fields.filter(field=>field.enabled!==false&&!used.has(field.id)&&(!hasSeries||!isSeriesField(field)));
  }
  function stepHeading(number,title,detail='') {
    return '<div class="business-config-step"><span aria-hidden="true">'+number+'</span><div><h3>'+esc(title)+'</h3>'+(detail?'<p>'+esc(detail)+'</p>':'')+'</div></div>';
  }
  function validParameterName(value) {
    return typeof value==='string'&&/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(value)&&!['__proto__','prototype','constructor'].includes(value);
  }
  function bindingCandidateStatus(field,source) {
    if(model.dependencyCompatible(field,source))return {ok:true};
    const condition=model.queryConditions(field)[0],values=model.returnFields(source),key=values.find(row=>row.key===condition?.valueKey)?.key || values[0]?.key || '';
    return model.queryBindingCompatibility(field,source,key,condition?.key);
  }
  function bindingCandidateIssue(field,source) {return bindingCandidateStatus(field,source).message || '';}
  function bindingOptionStatus(checked) {
    return ({source_disabled:'字段已停用',capability_unavailable:'能力信息不可用',missing_metadata:'兼容信息待完善',value_type_mismatch:'类型不匹配',value_domain_mismatch:'编码不兼容',unsupported_parameter:'入参未声明',unsupported_source_value:'属性未声明',invalid_source:'不符合单选要求'})[checked.code] || '配置不兼容';
  }
  function ruleSummary() {
    const field=editor.values, data=model.catalog(editor.scope), entry=window.BusinessData?.entry(field.dictionaryId), binding=model.parameterBinding(field), id=model.activeDependencies(field)[0], source=data.fields.find(row=>row.id===id);
    let text='', next='';
    if(!field.dictionaryId) next='请选择取数接口，再设置是否需要其他字段配合查询。';
    else if(!model.usesQueryConditions(field)) text='查询“'+(field.label||'当前字段')+'”时，直接调用“'+(entry?.name||field.dictionaryId)+'”，不使用其他字段作为条件。'+(model.interfaceKind(field)==='store'?'返回当前租户可用的全部门店。':'');
    else if(!source) next='请选择“从哪个字段取条件”；如果列表为空，请先建立一个符合要求的单选接口字段。';
    else if(!binding?.sourceValueKey||!model.returnFields(source).some(row=>row.key===binding.sourceValueKey)) next='请选择“使用该记录的哪项数据”，仅可使用关联接口声明的返回字段。';
    else if(!binding?.parameterName?.trim()) next='请填写“传给接口的参数名”，该名称需与接口约定一致。';
    else if(!validParameterName(binding.parameterName)) next='请修正“传给接口的参数名”：使用 1 至 64 位字母、数字或下划线，以字母或下划线开头，且不能使用系统保留名称。';
    else if(!model.queryBindingCompatibility(field,source).ok) next=model.queryBindingCompatibility(field,source).message;
    else {
      const attribute=model.returnFields(source).find(row=>row.key===binding.sourceValueKey);
      text='查询“'+(field.label||'当前字段')+'”时，将“'+source.label+'”已选记录中的“'+(attribute?.label||binding.sourceValueKey)+'（'+binding.sourceValueKey+'）”作为参数“'+binding.parameterName+'”传给“'+(entry?.name||field.dictionaryId)+'”。';
      text+=binding.required?'未填写关联字段时，等待填写并确认后再查询；本分类须加入并显示该字段。':'未加入或未填写关联字段时，不传此条件，直接查询'+(model.interfaceKind(field)==='store'?'当前租户可用的全部门店。':'可用数据。');
    }
    if(editor.previewOnly) next='此处仅查看填写效果；返回字段列表后，点击“编辑”可调整规则。';
    if(!next) {
      const count=data.rows.filter(row=>row.fields.some(ref=>ref.fieldId===field.id)).length;
      next=editor.parent?'确认规则后，保存并加入当前分类；最后保存业务分类才生效。':count?'确认规则后保存修改；此字段已用于 '+count+' 个业务分类。':'确认规则后保存到字段库，再到业务分类添加此字段。';
    }
    return '<strong>客服填写时将这样查询</strong>'+(text?'<p>'+esc(text)+'</p>':'')+'<p id="business-field-next-step" class="business-config-next-step"><b>下一步：</b>'+esc(next)+'</p>';
  }
  function updateRuleSummary() {
    const node=document.getElementById('business-field-rule-summary');
    if(node&&editor?.kind==='field'&&editor.values.type==='interface') node.innerHTML=ruleSummary();
  }
  function requiredSourcePlan(field,category,data) {
    const refs=new Map(category.fields.map(ref=>[ref.fieldId,ref])), ordered=[], blocked=[], visiting=new Set(), done=new Set();
    function inspect(current) {
      if(!current||done.has(current.id)) return;
      if(visiting.has(current.id)) {blocked.push('存在循环关联，请先调整字段的查询条件。');return;}
      visiting.add(current.id);
      for(const id of model.parameterBinding(current)?.required===true?model.activeDependencies(current):[]) {
        const source=data.fields.find(row=>row.id===id);
        if(!source) {blocked.push('所需关联字段已移除，请先编辑“'+current.label+'”重新选择条件来源。');continue;}
        if(source.enabled===false) {blocked.push('“'+source.label+'”在字段库中已停用，请先在自定义字段中启用，再返回本分类。');continue;}
        if(!model.queryBindingCompatibility(current,source).ok) {blocked.push(model.queryBindingCompatibility(current,source).message);continue;}
        inspect(source);
        if(!refs.has(id)||refs.get(id).enabled===false) {if(!ordered.some(row=>row.id===id)) ordered.push(source);}
      }
      visiting.delete(current.id);done.add(current.id);
    }
    inspect(field);
    const series=[...category.fields.map(ref=>data.fields.find(row=>row.id===ref.fieldId)),...ordered].filter(isSeriesField);
    const unique=[...new Map(series.map(row=>[row.id,row])).values()];
    if(unique.length>1) blocked.push('本分类已有车系字段“'+unique.filter(row=>!ordered.some(source=>source.id===row.id)).map(row=>row.label).join('、')+'”，与所需字段“'+ordered.filter(isSeriesField).map(row=>row.label).join('、')+'”冲突。每个分类只能保留一个意向车系字段，请先在下方调整原车系字段。');
    return {ordered,blocked};
  }
  function sourceGuidance(field,category,data) {
    if(!field) return '<p>选择已有字段后，点击“添加字段”加入本分类；也可以新建字段。</p>';
    const binding=model.parameterBinding(field), linked=model.activeDependencies(field), source=data.fields.find(row=>row.id===linked[0]);
    if(!linked.length) return '<p>“'+esc(field.label||'当前字段')+'”'+(model.usesQueryConditions(field)?'尚未选好关联字段，请先完成上方查询条件。':'可独立使用。添加后设置显示顺序与必填，再保存业务分类。')+'</p>';
    if(!binding?.required) return '<p>“'+esc(field.label)+'”可使用“'+esc(source?.label||'关联字段')+'”作为查询条件。此依赖为可选，无需补齐；未加入或未填写时独立查询。</p>';
    const plan=requiredSourcePlan(field,category,data);
    if(plan.blocked.length) return '<p class="business-category-error">'+plan.blocked.map(esc).join('<br>')+'</p>';
    if(!plan.ordered.length) {
      const ref=category.fields.find(row=>row.fieldId===field.id);
      const next=editor.kind==='field'?'可继续保存并加入当前分类。':ref?ref.enabled!==false?'该字段已显示，可继续调整并保存业务分类。':'下一步：在“'+field.label+'”的字段卡片勾选“显示此字段”，再保存业务分类。':'可点击“添加字段”加入本分类。';
      return '<p>“'+esc(field.label)+'”所需的关联字段已在分类中显示。'+esc(next)+'</p>'+(editor.kind==='category'&&ref?.enabled===false?'<button type="button" class="btn" onclick="'+action('locateCategoryField',field.id)+'">定位此字段</button>':'');
    }
    return '<p>使用“'+esc(field.label)+'”前，需在本分类加入并显示：<strong>'+esc(plan.ordered.map(row=>row.label).join('、'))+'</strong>。</p><button id="business-required-source-repair" class="btn" type="button" onclick="BusinessConfiguration.addRequiredSources()">添加并显示所需字段</button><small>只调整当前分类草稿，不改变必填设置，也不会自动保存。</small>';
  }
  function locateCategoryField(id) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category'||!editor.values.fields.some(ref=>ref.fieldId===id)) return false;
    const node=document.getElementById('business-category-card-'+id);
    node?.scrollIntoView?.({block:'center',behavior:'smooth'});node?.focus?.({preventScroll:true});return !!node;
  }
  function selectCategoryField(id) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category') return;
    editor.selectedFieldId=id;editor.repairFieldId='';clearError();updateCategorySelection();
  }
  function updateCategorySelection() {
    if(editor?.kind!=='category') return;
    const data=model.catalog(editor.scope), field=data.fields.find(row=>row.id===(editor.repairFieldId||editor.selectedFieldId)), node=document.getElementById('business-category-field-guidance');
    if(node) node.innerHTML=sourceGuidance(field,editor.values,data);
  }
  function addRequiredSources() {
    if(!isActive()||editor.previewOnly) return false;
    const category=editor.kind==='category'?editor.values:editor.parent?.kind==='category'?editor.parent.values:null;
    if(!category) return false;
    const data=model.catalog(editor.scope);
    if(!data.ok||data.revision!==editor.revision||editor.parent&&editor.parent.revision!==data.revision) return error('业务配置已更新，请保留填写内容，重新打开分类后再补齐字段');
    const field=editor.kind==='field'?editor.values:data.fields.find(row=>row.id===(editor.repairFieldId||document.getElementById('business-category-field-picker')?.value||editor.selectedFieldId));
    if(!field) return error('请先选择要添加的字段','business-category-field-picker');
    const plan=requiredSourcePlan(field,category,data);
    if(plan.blocked.length) return error(plan.blocked.join(' '),'business-category-field-guidance');
    if(!plan.ordered.length) return false;
    for(const source of plan.ordered) {
      const ref=category.fields.find(row=>row.fieldId===source.id);
      if(ref) ref.enabled=true;
      else category.fields.push({fieldId:source.id,enabled:true,required:false});
    }
    clearError();
    const note='已将“'+plan.ordered.map(row=>row.label).join('、')+'”加入并显示在分类草稿中，必填设置未改；保存分类后生效。';
    if(editor.kind==='category') {editor.flowNote=note;redrawDynamic();}
    else {editor.parent.flowNote=note;draw();}
    return true;
  }
  function control(field) {
    if(field.type==='interface') {
      const kind=model.interfaceKind(field), data=model.catalog(editor.scope), linked=model.activeDependencies(field), binding=model.parameterBinding(field);
      const using=model.usesQueryConditions(field), source=data.fields.find(row=>row.id===linked[0]);
      const incomplete=using&&(!source||!model.queryBindingCompatibility(field,source).ok||!validParameterName(binding?.parameterName));
      const description=using?(incomplete?'关联条件尚未配置完成':(binding?.required?'必需':'可选')+'关联字段：'+fieldName(linked[0],data)+'；'+binding.sourceValueKey+' → '+binding.parameterName):'独立查询';
      const prompt=incomplete?'请先完成关联查询条件':kind==='store'?(using?(binding?.required?'请先选择关联字段，再选择门店（可多选）':'可按关联字段筛选门店（可多选）'):'请选择门店（可多选）'):kind==='series'?'请选择一个车系':field.dictionaryId?'请选择接口返回值':'请先选择取数接口';
      return `<select disabled><option>${esc(prompt)}</option></select><small>${esc(sourceDescription(field,editor.scope))}；${esc(description)}${kind==='store'?'；门店多选，确认后带回':''}</small>`;

    }
    if(field.type==='textarea') return '<textarea rows="3" placeholder="请输入"></textarea>';
    if(field.type==='select') return `<select><option value="">请选择</option>${field.options.map(option=>`<option>${esc(option.label)}</option>`).join('')}</select>`;
    if(field.type==='multiselect') return `<div class="business-preview-choices">${field.options.map(option=>`<label><input type="checkbox"> ${esc(option.label)}</label>`).join('')||'<span>请配置选项</span>'}</div>`;
    const type=field.type==='datetime'?'datetime-local':field.type==='text'?'text':field.type;
    return `<input type="${esc(type)}" placeholder="请输入">`;
  }
  function preview(data) {
    if(editor.kind==='field') {
      const field=editor.values;
      return `<div class="business-form-preview"><div class="business-preview-heading"><span>填写预览</span><h3>${esc(field.label||'字段名称')}</h3></div>${field.type==='interface'?'<div id="business-field-rule-summary" class="business-query-summary" role="status" aria-live="polite">'+ruleSummary()+'</div>':''}<label class="field"><span>${esc(field.label||'字段名称')}</span>${control(field)}</label></div>`;
    }
    const fields=resolvedFields(editor.values,data);
    return `<div class="business-form-preview"><div class="business-preview-heading"><span>客服填写预览</span><h3>${esc(editor.values.label||'业务名称')}</h3></div>${fields.length?fields.map(field=>`<label class="field"><span>${esc(field.label)}${field.required?'<b class="business-required"> *</b>':''}</span>${control(field)}</label>`).join(''):'<p class="business-empty-fields">暂无可填写字段</p>'}</div>`;
  }
  function categoryEditor(data) {
    const value=editor.values, choices=availableCategoryFields(value,data), issue=model.configurationIssue(value.id,editor.scope,value);
    return `<div id="business-config-flow-note" class="business-config-notice" role="status" ${editor.flowNote?'':'hidden'}>${esc(editor.flowNote||'')}</div><div class="business-category-basics"><label class="field"><span>业务名称 <b class="business-required">*</b></span><input id="business-category-label" maxlength="40" value="${esc(value.label)}" placeholder="例如：新车咨询" oninput="BusinessConfiguration.setBasic('label',this.value)"></label><label class="field"><span>导入时的业务编码名称 <b class="business-required">*</b></span><input id="business-category-code-label" maxlength="40" value="${esc(value.codeLabel)}" placeholder="例如：线索编码" oninput="BusinessConfiguration.setBasic('codeLabel',this.value)"></label></div><div class="business-fields-heading"><h3>客服填写字段</h3><span>设置顺序、显示和必填，再保存分类</span></div><p id="business-category-config-warning" class="business-category-error" role="alert" ${issue?'':'hidden'}>${esc(issue)}</p><div id="business-category-cards">${categoryCards(data)}</div><div class="business-category-picker"><select id="business-category-field-picker" ${choices.length?'':'disabled'} onchange="BusinessConfiguration.selectCategoryField(this.value)"><option value="">请选择已有字段</option>${choices.map(field=>`<option value="${esc(field.id)}" ${editor.selectedFieldId===field.id?'selected':''}>${esc(field.label)}</option>`).join('')}</select><button class="btn" ${choices.length?'':'disabled'} onclick="BusinessConfiguration.addCategoryField()">添加字段</button><button type="button" class="btn" onclick="BusinessConfiguration.openRelated('field')">＋ 新建字段</button></div><div id="business-category-field-guidance" class="business-config-field-guidance" role="status">${sourceGuidance(data.fields.find(row=>row.id===editor.selectedFieldId),value,data)}</div><small>字段可用于多个业务分类，每个分类独立设置显示顺序和必填。每个分类仅配置一个本次意向车系字段，客服单选；计划到店门店按文本填写。只有显示的字段会出现在客服表单中。</small>`;
  }
  function categoryCards(data) {
    const refs=editor.values.fields;
    return refs.map((ref,index)=>{
      const field=data.fields.find(row=>row.id===ref.fieldId);
      return `<article id="business-category-card-${esc(ref.fieldId)}" class="business-field-card" tabindex="-1"><div class="business-field-card-head"><span>第 ${index+1} 项 · ${esc(field?.label||'字段已移除')}${field?.enabled===false?'（已停用）':''}</span><div><button class="btn-link" ${index===0?'disabled':''} onclick="${action('moveCategoryField',index,-1)}">上移</button><button class="btn-link" ${index===refs.length-1?'disabled':''} onclick="${action('moveCategoryField',index,1)}">下移</button><button class="btn-link business-remove-field" onclick="${action('removeCategoryField',index)}">移除</button></div></div><p class="business-category-field-meta">${esc(typeNames[field?.type]||'未知类型')}${field?.businessKey?' · 业务字段编码 '+esc(field.businessKey):''}${model.usesQueryConditions(field)?' · 查询条件：'+(model.parameterBinding(field)?.required?'先填写并确认 ':'可不填写 ')+esc(model.activeDependencies(field).map(id=>fieldName(id,data)).join('、')||'待配置'):''}</p><div class="business-field-switches"><label><input type="checkbox" ${ref.enabled!==false?'checked':''} ${field?.enabled===false&&ref.enabled===false?'disabled':''} onchange="BusinessConfiguration.setCategoryField(${index},'enabled',this.checked)"> 显示此字段</label><label><input type="checkbox" ${ref.required===true?'checked':''} ${ref.enabled===false?'disabled':''} onchange="BusinessConfiguration.setCategoryField(${index},'required',this.checked)"> 客服必须填写</label></div></article>`;
    }).join('');
  }
  function optionsEditor() {
    return editor.values.options.map((option,index)=>`<div class="business-option-row"><span class="business-option-number">${index+1}</span><label class="field"><span>显示名称 <b class="business-required">*</b></span><input maxlength="80" value="${esc(option.label)}" placeholder="例如：高意向" ${model.presetField(editor.values.id)?'readonly':''} oninput="BusinessConfiguration.setOption(${index},'label',this.value)"></label><label class="field"><span>业务主键（选项编码，选填）</span><input maxlength="80" value="${esc(option.businessKey||'')}" placeholder="例如：HIGH" oninput="BusinessConfiguration.setOption(${index},'businessKey',this.value)"></label><button class="btn-link business-remove-field" ${model.presetField(editor.values.id)?'disabled':''} aria-label="删除选项 ${index+1}" onclick="${action('removeOption',index)}">删除</button></div>`).join('');
  }
  function interfaceEditor() {
    const value=editor.values, api=window.BusinessData, data=model.catalog(editor.scope);
    if(isMappingSeries(value)) {
      const source=api?.entry(value.dictionaryId),available=api?.available(value.dictionaryId,editor.scope);
      return `${stepHeading(2,'取数接口','接口统一提供车系候选，客服从查询结果中选择一个。')}<label class="field"><span>取数接口</span><select id="business-field-interface" disabled><option selected>${esc(source?.name || '车系查询接口')}</option></select><small>独立查询，无需关联其他字段；无需维护手工车系选项。</small></label><p class="business-preset-note">本次意向车系固定接口取数和单选；是否显示、是否必填在业务分类中设置。计划到店门店继续按文本填写。</p>${available?'':'<p class="business-preset-note" role="status">当前来源不可用，字段引用保留；请联系超级管理员启用接口并授权本租户。</p>'}`;
    }
    const entries=(api?.entries()||[]).filter(entry=>api.available(entry.id,editor.scope));
    const retained=value.dictionaryId&&!entries.some(entry=>entry.id===value.dictionaryId);
    const current=api?.entry(value.dictionaryId), capability=current?api?.capability(current.capabilityId):null, kind=model.interfaceKind(value), conditions=model.queryConditions(value), condition=conditions[0], using=model.usesQueryConditions(value);
    const sourceOptions=(retained?`<option value="${esc(value.dictionaryId)}" selected disabled>${esc(current?.name||value.dictionaryId)}（来源不可用，保留引用）</option>`:'')+entries.map(entry=>`<option value="${esc(entry.id)}" ${value.dictionaryId===entry.id?'selected':''}>${esc(entry.name)} · ${esc(api.capability(entry.capabilityId)?.label||'')}</option>`).join('');
    const switcher=value.dictionaryId?`<div class="business-query-conditions">${stepHeading(3,'设置查询条件','需要按其他字段筛选时再开启；不需要时保持独立查询。')}<label class="field"><span>查询时是否需要其他字段配合</span><select id="business-field-use-query-conditions" onchange="BusinessConfiguration.setUseQueryConditions(this.value==='true')"><option value="false" ${using?'':'selected'} ${condition?.required?'disabled':''}>否，独立查询</option><option value="true" ${using?'selected':''} ${condition?'':'disabled'}>是，使用其他字段的取值</option></select>${!condition?'<small>'+esc(capability?'此接口不接收其他字段的条件，保持独立查询即可。':'接口信息暂不可用，原关联保留；请联系超级管理员恢复来源后调整。')+'</small>':!using?'<small>'+esc(kind==='store'?'独立查询当前租户可用的全部门店。':'独立查询，不使用其他字段的取值。')+'</small>':''}</label>`:'';
    let dependencies='';
    if (using) {
      const dependency=model.activeDependencies(value)[0]||'', source=data.fields.find(field=>field.id===dependency), binding=model.parameterBinding(value);
      const sourceFields=data.fields.filter(field=>field.id!==value.id&&field.type==='interface');
      const values=source?model.returnFields(source):[];
      dependencies=`<label class="field" for="business-field-series-dependency"><span>从哪个字段取条件（关联字段） <b class="business-required">*</b></span><select id="business-field-series-dependency" ${sourceFields.length?'':'disabled'} onchange="BusinessConfiguration.setDependency(this.value)"><option value="" ${dependency?'':'selected'}>${esc(sourceFields.length?'请选择一个单选接口字段':'暂无可用字段，请先建立符合要求的单选接口字段')}</option>${sourceFields.map(field=>{const checked=field.enabled===false?{ok:false,code:'source_disabled',message:'字段已停用'}:bindingCandidateStatus(value,field);return `<option value="${esc(field.id)}" ${dependency===field.id?'selected':''} ${checked.ok?'':'disabled title="'+esc(checked.message)+'"'}>${esc(field.label)}${checked.ok?'':'（'+bindingOptionStatus(checked)+'）'}</option>`;}).join('')}</select><small>${esc(sourceFields.some(field=>field.enabled!==false&&model.dependencyCompatible(value,field))?condition?.help||'使用该字段中客服已选择并确认的一条记录。':'请先在“自定义字段”建立一个符合接口要求、已启用的单选接口字段，再返回配置。')}${!condition?.required?' 如暂不需要筛选，可在上方选择“否，独立查询”。':''}</small></label><label class="field"><span>关联字段未填写时怎么办（依赖要求）</span><select id="business-field-dependency-required" onchange="BusinessConfiguration.setParameterBinding('required',this.value==='true')"><option value="true" ${binding?.required?'selected':''}>等待填写并确认后再查询（必需依赖）</option><option value="false" ${binding?.required?'':'selected'} ${condition?.required?'disabled':''}>不传此条件，直接查询（可选依赖）</option></select><small>${condition?.required?'此接口必须提供该条件，不能选择独立查询。':'仅控制查询条件；客服是否必须填写本字段，仍在业务分类的“必填”中设置。'}</small></label><label class="field"><span>使用该记录的哪项数据（上游取值字段） <b class="business-required">*</b></span><select id="business-field-source-value-key" ${values.length?'':'disabled'} onchange="BusinessConfiguration.setParameterBinding('sourceValueKey',this.value)"><option value="" ${binding?.sourceValueKey?'':'selected'}>${source?'请选择关联接口返回的字段':'请先选择关联字段'}</option>${binding?.sourceValueKey&&!values.some(row=>row.key===binding.sourceValueKey)?'<option value="'+esc(binding.sourceValueKey)+'" selected disabled>'+esc(binding.sourceValueKey)+'（接口未声明，请重新选择）</option>':''}${values.map(row=>{const checked=model.queryBindingCompatibility(value,source,row.key,binding?.parameterName || condition?.key);return `<option value="${esc(row.key)}" ${binding?.sourceValueKey===row.key?'selected':''} ${checked.ok?'':'disabled title="'+esc(checked.message)+'"'}>${esc(row.label||row.key)}（${esc(row.key)}）${checked.ok?'':' · '+bindingOptionStatus(checked)}</option>`;}).join('')}</select><small>例如：选择“编码（code）”，传递已选记录的编码，不是显示名称。</small></label><label class="field"><span>传给接口的参数名（下游入参字段名） <b class="business-required">*</b></span><input id="business-field-parameter-name" maxlength="64" value="${esc(binding?.parameterName||'')}" placeholder="例如：seriesCode" oninput="BusinessConfiguration.setParameterBinding('parameterName',this.value)"><small>通常保留接口提供的默认值；如需修改，请向接口维护人员确认参数名。</small></label>`;
    }
    return `${stepHeading(2,'选择取数接口','选择这个字段要从哪里获取可选数据。')}<label class="field"><span>取数接口 <b class="business-required">*</b></span><select id="business-field-interface" onchange="BusinessConfiguration.setDictionary(this.value)"><option value="" ${value.dictionaryId?'':'selected'}>请选择取数接口</option>${sourceOptions}</select><small>${entries.length?'只展示当前租户已授权且启用的接口。':'当前租户暂无可用接口，请联系超级管理员在“业务数据接口字典”启用接口并授权本租户，再返回选择。'}</small></label>${retained?'<p class="business-preset-note" role="status">当前来源不可用，原引用保留。可更换为可用接口，或联系超级管理员恢复来源。</p>':''}${switcher}${dependencies}${switcher?'</div>':''}${editor.parent?.kind==='category'?'<div id="business-category-field-guidance" class="business-config-field-guidance" role="status">'+sourceGuidance(value,editor.parent.values,data)+'</div>':''}${kind==='series'?'<p class="business-preset-note">意向车系为单选，客服每次仅选择一个车系。</p>':''}`;
  }
  function fieldEditor() {
    const value=editor.values, protectedField=!!model.presetField(value.id), mapping=isMappingSeries(value), choice=['select','multiselect'].includes(value.type);
    return `${stepHeading(1,mapping?'设置车系接口':'设置字段',mapping?'车系由接口提供，客服从查询结果中单选；无需在此维护名称和编码。':'名称会显示在客服表单中；接口取数表示从接口选择数据。')}<div class="business-category-basics"><label class="field"><span>字段名称 <b class="business-required">*</b></span><input id="business-field-label" maxlength="40" value="${esc(value.label)}" placeholder="例如：意向车型" oninput="BusinessConfiguration.setBasic('label',this.value)"></label><label class="field"><span>填写方式 <b class="business-required">*</b></span><select id="business-field-type" ${protectedField||mapping?'disabled':''} onchange="BusinessConfiguration.setBasic('type',this.value)">${Object.entries(typeNames).map(([key,label])=>`<option value="${key}" ${value.type===key?'selected':''}>${label}</option>`).join('')}</select></label></div><label class="field"><span>业务主键（字段编码，选填）</span><input id="business-field-business-key" maxlength="80" value="${esc(value.businessKey||'')}" placeholder="例如：lead_level" oninput="BusinessConfiguration.setBasic('businessKey',this.value)"><small>没有本地映射需要时可留空，不影响接口查询。</small></label>${value.type==='interface'?interfaceEditor():''}${choice?`<div class="business-fields-heading"><h3>选项配置</h3><span>显示名称必填，业务主键选填</span></div><div id="business-field-options">${optionsEditor()}</div><button class="btn business-add-field" ${protectedField||value.options.length>=50?'disabled':''} onclick="BusinessConfiguration.addOption()">＋ 添加选项</button>`:''}${protectedField?'<p class="business-preset-note">线索统计预置字段的填写方式和选项不可修改，业务编码可维护。</p>':''}`;
  }
  function editorBody(data) {
    if(editor.kind==='category') return categoryEditor(data);
    return fieldEditor();
  }
  function draw(resetView=false) {
    // A confirmation above a redrawn layer must not make PlatformUI retain the
    // discarded DOM as a previous view and restore it on the next close.
    clearDiscardConfirmation();
    if(!isActive()) { dismissAll(); return showToast('工作范围已变化，请重新打开','warning'); }
    const data=model.catalog(editor.scope);
    if(!data.ok) { dismissAll(); return showToast(data.message,'warning'); }
    const drawnEditor=editor;
    const oldLayer=document.getElementById(layerId), oldBody=oldLayer?.querySelector?.('.layer-body'), oldFocus=document.activeElement;
    const scrollTop=!resetView?oldBody?.scrollTop||0:0, focusId=!resetView&&oldLayer?.contains?.(oldFocus)?oldFocus?.id:'';
    const title=editor.previewOnly?'表单预览':editor.creating?'新增'+kindNames[editor.kind]:'编辑'+kindNames[editor.kind];
    const saveText=editor.kind==='category'?'保存业务分类':editor.parent?'保存并加入当前分类':'保存到字段库';
    const referenceCount=editor.kind==='field'?data.rows.filter(row=>row.fields.some(ref=>ref.fieldId===editor.values.id)).length:0;
    const saveHint=editor.kind==='category'?'保存后，客服按此分类填写。':editor.parent?'字段会保存到字段库；分类需另行保存。取消分类不会删除已入库字段。':referenceCount?'修改将用于引用此字段的 '+referenceCount+' 个业务分类，保存前请确认规则。':'保存后还需加入业务分类，客服才能填写。';
    ui.openLayer(layerId,`<div class="layer-header"><div><h2>${title}</h2>${editor.previewOnly?'':'<p class="business-config-editor-hint">'+esc(saveHint)+'</p>'}</div><button aria-label="关闭" onclick="BusinessConfiguration.close()">×</button></div><div class="layer-body business-category-body ${editor.previewOnly?'preview-only':''}${editor.kind==='field'?' field-editor':''}">${editor.previewOnly?'':`<div class="business-category-settings">${editorBody(data)}<p id="business-config-error" class="business-category-error" role="alert"></p></div>`}<div id="business-config-preview">${preview(data)}</div></div><div class="layer-footer"><button class="btn" onclick="BusinessConfiguration.close()">${editor.parent?'返回分类':editor.previewOnly?'关闭':'取消'}</button>${editor.previewOnly?'':'<button id="business-config-save" class="btn btn-primary" onclick="BusinessConfiguration.save()">'+saveText+'</button>'}</div>`,editor.previewOnly?'large':'wide',{objectKey:'business-config-editor',discardKey:`${editor.kind}:${editor.values.id}`,isDirty:()=>editorStackDirty(drawnEditor),onBackdropClick:()=>{if(editor===drawnEditor && document.getElementById(layerId)===layer) close();}});
    const layer=document.getElementById(layerId);
    const restoreView=()=>{
      if(layer&&document.getElementById(layerId)!==layer) return;
      const body=layer?.querySelector?.('.layer-body');if(body) body.scrollTop=scrollTop;
      if(focusId) document.getElementById(focusId)?.focus?.({preventScroll:true});
    };
    restoreView();window.requestAnimationFrame?.(restoreView);
  }
  function updatePreview() {
    if(!isActive()) return;
    const node=document.getElementById('business-config-preview');
    if(node) node.innerHTML=preview(model.catalog(editor.scope));
    updateRuleSummary();
    if(editor.kind==='field'&&editor.parent?.kind==='category') {
      const guide=document.getElementById('business-category-field-guidance');
      if(guide) guide.innerHTML=sourceGuidance(editor.values,editor.parent.values,model.catalog(editor.scope));
    }
  }
  function redrawDynamic() {
    if(!isActive()) return;
    const data=model.catalog(editor.scope);
    if(editor.kind==='category') {
      const note=document.getElementById('business-config-flow-note');
      if(note) {note.textContent=editor.flowNote||'';note.hidden=!editor.flowNote;}
      const warning=document.getElementById('business-category-config-warning');
      if(warning) { const issue=model.configurationIssue(editor.values.id,editor.scope,editor.values);warning.textContent=issue;warning.hidden=!issue; }
      const node=document.getElementById('business-category-cards');
      if(node) node.innerHTML=categoryCards(data);
      const picker=document.getElementById('business-category-field-picker');
      if(picker) {
        const choices=availableCategoryFields(editor.values,data);
        if(!choices.some(field=>field.id===editor.selectedFieldId)) editor.selectedFieldId='';
        picker.innerHTML='<option value="">请选择已有字段</option>'+choices.map(field=>`<option value="${esc(field.id)}" ${editor.selectedFieldId===field.id?'selected':''}>${esc(field.label)}</option>`).join('');
        picker.disabled=!choices.length;
        picker.nextElementSibling.disabled=!choices.length;
      }
      updateCategorySelection();
    }
    if(editor.kind==='field') {
      const node=document.getElementById('business-field-options');
      if(node) node.innerHTML=optionsEditor();
    }
    updatePreview();
  }
  function setBasic(key,value) {
    if(!isActive()||editor.previewOnly) return;
    const allowed={category:['label','codeLabel'],field:['label','type','businessKey']};
    if(!allowed[editor.kind].includes(key)) return;
    clearError();
    if(editor.kind==='field'&&key==='type') {
      if(model.presetField(editor.values.id)||isMappingSeries(editor.values)||!model.fieldTypes.includes(value)) return;
      editor.values.type=value;
      if(value==='interface') { editor.values.dictionaryId='';editor.values.depends=[];editor.values.useQueryConditions=false;delete editor.values.parameterBinding; }
      else { delete editor.values.dictionaryId;delete editor.values.depends;delete editor.values.useQueryConditions;delete editor.values.parameterBinding; }
      if(['select','multiselect'].includes(value)&&!editor.values.options.length) editor.values.options=[{id:model.newId('option'),label:'',businessKey:''}];
      if(!['select','multiselect'].includes(value)) editor.values.options=[];
      draw(); return;
    }
    editor.values[key]=value;
    updatePreview();
  }
  function setDictionary(id) {
    if(!isActive()||editor.previewOnly||editor.kind!=='field'||editor.values.type!=='interface'||isMappingSeries(editor.values)) return;
    if(!window.BusinessData?.available(id,editor.scope)) return error('请选择当前租户已授权且启用的取数接口');
    clearError();
    const using=model.usesQueryConditions(editor.values);
    editor.values.dictionaryId=id;
    const condition=model.queryConditions(editor.values)[0];
    editor.values.useQueryConditions=using&&!!condition;
    editor.values.depends=editor.values.useQueryConditions?(editor.values.depends||[]).filter(fieldId=>{
      const field=model.getField(fieldId,editor.scope);
      return field?.id!==editor.values.id&&model.dependencyCompatible(editor.values,field);
    }).slice(0,1):[];
    if(editor.values.useQueryConditions) editor.values.parameterBinding={parameterName:condition.key||'',sourceValueKey:condition.valueKey||'code',required:condition.required===true};
    else delete editor.values.parameterBinding;
    draw();
  }
  function setUseQueryConditions(enabled) {
    if(!isActive()||editor.previewOnly||editor.kind!=='field'||editor.values.type!=='interface') return;
    if(enabled&&!model.queryConditions(editor.values).length) return error('此接口未声明前置输入，无需配置关联字段');
    clearError();
    editor.values.useQueryConditions=enabled===true;
    if(!enabled) { editor.values.depends=[];delete editor.values.parameterBinding; }
    else if(!editor.values.parameterBinding) { const condition=model.queryConditions(editor.values)[0];editor.values.parameterBinding={parameterName:condition?.key||'',sourceValueKey:condition?.valueKey||'code',required:condition?.required===true}; }
    draw();
  }
  function setDependency(id,selected) {
    if(!isActive()||editor.previewOnly||editor.kind!=='field'||editor.values.type!=='interface'||!model.usesQueryConditions(editor.values)) return;
    if(!id||selected===false) { clearError();editor.values.depends=[];draw();return; }
    const field=model.getField(id,editor.scope);
    if(!field||field.id===editor.values.id||field.enabled===false) return error('请选择启用的其他接口字段');
    if(!model.dependencyCompatible(editor.values,field)) return error(bindingCandidateIssue(editor.values,field),'business-field-series-dependency');
    clearError();
    editor.values.depends=[id];
    const binding=model.parameterBinding(editor.values), values=model.returnFields(field), condition=model.queryConditions(editor.values)[0];
    editor.values.parameterBinding={parameterName:binding?.parameterName||condition?.key||'',sourceValueKey:values.some(row=>row.key===binding?.sourceValueKey)?binding.sourceValueKey:values.find(row=>row.key===condition?.valueKey)?.key||'',required:binding?.required===true};
    draw();
  }
  function setParameterBinding(key,value) {
    if(!isActive()||editor.previewOnly||editor.kind!=='field'||editor.values.type!=='interface'||!model.usesQueryConditions(editor.values)||!['parameterName','sourceValueKey','required'].includes(key)) return;
    const binding=model.parameterBinding(editor.values);
    if(key==='required'&&value!==true&&model.queryConditions(editor.values)[0]?.required===true) return error('此接口要求前置输入，依赖要求必须设为必需');
    if(key==='sourceValueKey') {
      const source=model.getField(model.activeDependencies(editor.values)[0],editor.scope);
      if(!model.returnFields(source).some(row=>row.key===value)) return error('请选择上游接口声明的返回字段');
      const checked=model.queryBindingCompatibility(editor.values,source,value,binding?.parameterName);
      if(!checked.ok)return error(checked.message,bindingErrorTarget(checked));
    }
    clearError();
    editor.values.parameterBinding={...binding,[key]:value};updatePreview();
  }
  function missingRequiredSources(field, category, data) {
    const visible=new Set(category.fields.filter(ref=>ref.enabled!==false).map(ref=>ref.fieldId)), missing=new Set(), visited=new Set();
    function inspect(current) {
      if(!current||visited.has(current.id)) return;visited.add(current.id);
      for(const sourceId of model.parameterBinding(current)?.required===true?model.activeDependencies(current):[]) {
        const source=data.fields.find(row=>row.id===sourceId);
        if(!source||source.enabled===false||!visible.has(sourceId)) missing.add(source?.label||'字段已移除');
        inspect(source);
      }
    }
    inspect(field);return [...missing];
  }
  function addCategoryField() {
    if(!isActive()||editor.previewOnly||editor.kind!=='category') return;
    const id=document.getElementById('business-category-field-picker')?.value;
    const data=model.catalog(editor.scope), field=data.fields.find(row=>row.id===id);
    if(!id||editor.values.fields.some(ref=>ref.fieldId===id)||!field||field.enabled===false) return error('请选择尚未添加的启用字段');
    if(isSeriesField(field)&&hasSeriesField(editor.values,data)) return error('每个业务分类只能配置一个意向车系字段，请先移除原车系字段');
    const missing=missingRequiredSources(field,editor.values,data);
    if(missing.length) {editor.selectedFieldId=id;updateCategorySelection();return error('请先添加并显示上游字段“'+missing.join('、')+'”，点击下方“添加并显示所需字段”后，再添加此字段','business-category-field-guidance');}
    clearError();
    editor.values.fields.push({fieldId:id,enabled:true,required:false});
    editor.selectedFieldId='';editor.repairFieldId='';editor.flowNote='“'+field.label+'”已加入分类草稿。可继续调整顺序与必填，最后点击“保存业务分类”生效。';
    redrawDynamic();
  }
  function visibleLinkedStores(fieldId) {
    const data=model.catalog(editor.scope);
    return editor.values.fields.filter(ref=>ref.enabled!==false).map(ref=>data.fields.find(field=>field.id===ref.fieldId)).filter(field=>field?.enabled!==false&&model.parameterBinding(field)?.required===true&&model.activeDependencies(field).includes(fieldId));
  }
  function blockRemovingSeries(fieldId,operation) {
    const stores=visibleLinkedStores(fieldId);
    if(!stores.length) return false;
    redrawDynamic();
    error('请先关闭或移除依赖此字段的接口字段“'+stores.map(field=>field.label).join('、')+'”，再'+operation+'关联字段');
    return true;
  }
  function removeCategoryField(index) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category'||!editor.values.fields[index]) return;
    if(blockRemovingSeries(editor.values.fields[index].fieldId,'移除')) return;
    clearError();
    editor.values.fields.splice(index,1); redrawDynamic();
  }
  function moveCategoryField(index,direction) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category') return;
    const refs=editor.values.fields, next=index+direction;
    if(!refs[index]||!refs[next]) return;
    clearError();
    [refs[index],refs[next]]=[refs[next],refs[index]]; redrawDynamic();
  }
  function setCategoryField(index,key,value) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category'||!['enabled','required'].includes(key)) return;
    const ref=editor.values.fields[index]; if(!ref) return;
    if(key==='enabled'&&!value&&blockRemovingSeries(ref.fieldId,'关闭')) return;
    if(key==='enabled'&&value&&model.getField(ref.fieldId,editor.scope)?.enabled===false) {redrawDynamic();return error('本次显示未生效：字段库已停用此字段，请先在自定义字段启用后返回','business-category-card-'+ref.fieldId);}
    if(key==='enabled'&&value) {
      const data=model.catalog(editor.scope), missing=missingRequiredSources(data.fields.find(row=>row.id===ref.fieldId),editor.values,data);
      if(missing.length) {editor.repairFieldId=ref.fieldId;redrawDynamic();return error('本次显示未生效：请先添加并显示上游字段“'+missing.join('、')+'”，可点击“添加并显示所需字段”后再显示此字段','business-category-field-guidance');}
    }
    clearError();
    ref[key]=!!value;
    if(key==='enabled'&&!value) ref.required=false;
    redrawDynamic();
  }
  function setOption(index,key,value) {
    if(!isActive()||editor.previewOnly||editor.kind!=='field'||!['label','businessKey'].includes(key)) return;
    if(model.presetField(editor.values.id)&&key==='label') return;
    const option=editor.values.options[index]; if(!option) return;
    clearError();
    option[key]=value; updatePreview();
  }
  function addOption() {
    if(!isActive()||editor.previewOnly||editor.kind!=='field'||model.presetField(editor.values.id)||editor.values.options.length>=50) return;
    clearError();editor.values.options.push({id:model.newId('option'),label:'',businessKey:''});
    redrawDynamic();
    document.querySelector('#business-field-options .business-option-row:last-child input')?.focus();
  }
  function removeOption(index) {
    if(!isActive()||editor.previewOnly||editor.kind!=='field'||model.presetField(editor.values.id)||!editor.values.options[index]) return;
    clearError();editor.values.options.splice(index,1); redrawDynamic();
  }
  function save() {
    if(!isActive()||editor.previewOnly) return error('工作范围已变化，请重新打开');
    if(editor.parent?.kind==='category'&&editor.kind==='field'&&isSeriesField(editor.values)&&hasSeriesField(editor.parent.values,model.catalog(editor.scope))) return error('此业务分类已有意向车系字段，不能再新增第二个车系字段');
    if(editor.parent?.kind==='category'&&editor.kind==='field') {
      const missing=missingRequiredSources(editor.values,editor.parent.values,model.catalog(editor.scope));
      if(missing.length) return error('请先在业务分类添加并显示上游字段“'+missing.join('、')+'”，点击“添加并显示所需字段”补齐分类草稿后，可继续保存当前字段','business-category-field-guidance');
    }
    const methods={category:model.save,field:model.saveField};
    const result=methods[editor.kind](editor.values,editor.scope,{expectedContext:editor.context,expectedRevision:editor.revision});
    if(!result.ok) return error(result.message,editor.kind==='field'?bindingErrorTarget(result):'');
    if(editor.parent) {
      const child=editor, parent=editor.parent;
      parent.revision=model.catalog(parent.scope).revision;
      if(child.kind==='field'&&parent.kind==='category'&&!parent.values.fields.some(ref=>ref.fieldId===child.values.id)) parent.values.fields.push({fieldId:child.values.id,enabled:true,required:false});
      parent.flowNote='“'+child.values.label+'”已保存到字段库并加入分类草稿。再点击“保存业务分类”才在本分类生效；取消分类不会删除字段库中的此字段。';
      editor=parent; flowChanged=true; draw(true); showToast('已加入分类草稿，请继续保存业务分类','success'); return;
    }
    if(editor.kind==='field') {savedGuidance={fieldId:result.row?.id||editor.values.id,tenantId:editor.scope.tenantId,context:editor.context};pendingFieldId='';}
    else {savedGuidance=null;pendingFieldId='';}
    dismissAll(); flowChanged=false; refresh(); showToast(result.message,'success');
  }
  function toggle(kind,id,enabled) {
    if(!states[kind]||!model.canManage()||context!==model.context()) return showToast('工作范围已变化，请刷新后操作','warning');
    const data=catalog(); if(!data.ok) return showToast(data.message,'warning');
    const row=rowsOf(kind,data).find(item=>item.id===id);
    if(!row) return showToast('当前租户没有此配置','warning');
    const options={expectedContext:data.context,expectedRevision:data.revision};
    const result=kind==='category' ? model.setEnabled(id,enabled,currentScope(),options) : model.saveField({...row,enabled},currentScope(),options);
    if(!result.ok) return showToast(result.message,'warning');
    refresh(); showToast(kindNames[kind]+(enabled?'已启用':'已停用'),'success');
  }
  function referenceContent(result) {
    const refs=Array.isArray(result?.refs)?result.refs.filter(ref=>ref.blocking!==false):[],reason=result?.reason || result?.message || (result?.ok&&result.canDelete?'当前未发现使用引用':'暂时无法确认使用情况，不能删除');
    return '<p role="status">'+esc(reason)+'</p>'+(refs.length?'<ul class="business-reference-list">'+refs.map((ref,index)=>{
      const destination=ref.kind==='configuration'?(ref.categoryId?'category':ref.fieldId?'field':''):'';
      const edit=destination&&referenceRequest?.result===result?'<button class="btn-link" onclick="'+action('editReference',referenceRequest.serial,index)+'">去修改'+(destination==='category'?'分类':'字段')+'</button>':'';
      return '<li data-business-reference-kind="'+esc(ref.kind || '')+'">'+esc(ref.message || ref.sourceLabel || '引用位置待核对')+'<small>'+esc([ref.categoryLabel,ref.fieldLabel,ref.kind==='configuration'?'':ref.callId,ref.sourceLabel].filter(Boolean).join(' · '))+'</small>'+edit+'</li>';
    }).join('')+'</ul>':'');
  }
  function referenceData(kind,id) {
    if(!states[kind]||!model.canManage()||context!==model.context())return null;
    const data=catalog();if(!data.ok)return {result:{ok:false,reason:data.message,refs:[]}};
    const row=rowsOf(kind,data).find(item=>item.id===id);if(!row)return {result:{ok:false,reason:'当前租户没有此配置',refs:[]}};
    return {row,data,scope:clone(currentScope()),result:model.usage(kind,id,currentScope())};
  }
  function references(kind,id) {
    const current=referenceData(kind,id);if(!current)return showToast('工作范围已变化，请刷新后操作','warning');
    referenceRequest={serial:++referenceSequence,kind,id,scope:clone(currentScope()),context:model.context(),result:current.result,refs:current.result.refs.filter(ref=>ref.blocking!==false)};
    const title=current.result.ok&&current.result.canDelete?kindNames[kind]+'删除影响':'暂不能删除'+kindNames[kind];
    ui.openLayer(referencesId,'<div class="layer-header"><h2>'+esc(title)+'</h2><button aria-label="关闭" onclick="PlatformUI.closeLayer('+esc(JSON.stringify(referencesId))+')">×</button></div><div class="layer-body">'+referenceContent(current.result)+'</div>','large');
    return current.result;
  }
  function editReference(serial,index) {
    const request=referenceRequest,ref=request?.refs[index];
    if(!request||request.serial!==serial||!ref||!model.canManage()||request.context!==model.context()||request.scope.enterpriseId!==currentScope().enterpriseId||request.scope.tenantId!==currentScope().tenantId||!document.getElementById(referencesId))return false;
    if(editorDirty(editor)){showToast('请先保存或取消当前未完成的编辑','warning');return false;}
    const fresh=referenceData(request.kind,request.id);
    if(!fresh?.result?.ok||!fresh.result.refs.some(row=>row.blocking!==false&&row.kind==='configuration'&&row.categoryId===ref.categoryId&&row.fieldId===ref.fieldId&&row.objectId===ref.objectId)){showToast('当前引用已变化，请重新点击删除核对','warning');return false;}
    const destination=ref.categoryId?['category',ref.categoryId]:ref.kind==='configuration'&&ref.fieldId?['field',ref.fieldId]:null;
    if(!destination)return false;
    clearDeletionSurfaces();open(...destination);return true;
  }
  function remove(kind,id) {
    const current=referenceData(kind,id);if(!current)return showToast('工作范围已变化，请刷新后操作','warning');
    const {row,data,scope,result}=current;
    if(!row||!result?.ok||!result.canDelete) {references(kind,id);return false;}
    clearDeletionSurfaces();
    const request={kind,id,scope,context:data.context,revision:data.revision,token:result.token,fingerprint:result.fingerprint,confirmation:null};deletionRequest=request;
    const displayFailure=fresh=>{const node=document.getElementById('business-config-delete-error');if(node&&deletionRequest===request)node.innerHTML=referenceContent(fresh);return false;};
    const explanation=kind==='category'?'<p>删除“'+esc(row.label)+'”后，将从配置列表和新业务可选项中移除。</p><p>历史记录及当时名称、编码、结果保留；当前通话和话后填写继续使用开始时的表单，已有名单和任务按删除时保留的分类处理。</p><p>'+esc(result.refs.length?'当前核对到 '+result.refs.length+' 处原有业务使用，删除不会清除这些记录。':'字段及取数接口不会一并删除。')+'</p>':'<p>删除“'+esc(row.label)+'”后，将从自定义字段库移除，新配置不能再选择此字段。</p><p>已保存通话仍按当时快照展示；当前通话及话后填写继续使用开始时的表单，保留分类的独立字段快照不变。</p><p>不会清除通话记录、填写结果或草稿，也不会一并删除业务分类或取数接口。</p>';
    ui.confirm({id:deleteConfirmId,title:'删除'+kindNames[kind],body:explanation+'<div id="business-config-delete-error" role="alert"></div>',confirmText:'确认删除',danger:true,
      onConfirm:()=>{
        if(deletionRequest!==request||document.getElementById(deleteConfirmId)!==request.confirmation)return false;
        if(!model.canManage()||model.context()!==request.context||currentScope().tenantId!==request.scope.tenantId)return displayFailure({reason:'工作范围已变化，请重新打开后操作'});
        const guard=window.BusinessConfigurationUsage,fresh=typeof guard?.verifyFresh==='function'?guard.verifyFresh(request.token):{ok:false,reason:'使用情况暂时无法复核，请保留配置并重试'};
        if(!fresh.ok||!fresh.canDelete)return displayFailure(fresh);
        const method=kind==='category'?model.deleteCategory:model.deleteField;
        const deleted=method(id,scope,{expectedContext:request.context,expectedRevision:request.revision,expectedUsageFingerprint:request.fingerprint});
        if(!deleted.ok)return displayFailure({...deleted,reason:deleted.message || deleted.reason});
        clearDeletionSurfaces();refresh();showToast(deleted.message,'success');return false;
      },onCancel:()=>{if(deletionRequest===request)clearDeletionSurfaces();return false;}});
    request.confirmation=document.getElementById(deleteConfirmId);return true;
  }
  window.BusinessConfiguration={render,refresh,selectKind,changeTenant,query,reset,open,openRelated,close,setBasic,setDictionary,setUseQueryConditions,setDependency,setParameterBinding,selectCategoryField,addRequiredSources,locateCategoryField,configureSavedField,addCategoryField,removeCategoryField,moveCategoryField,setCategoryField,setOption,addOption,removeOption,save,toggle,references,editReference,remove};
  window.BusinessCategories=window.BusinessConfiguration;
  window.Pages=window.Pages||{};
  window.Pages['business-categories']={render:()=>render(),refresh};
  Object.entries(routeNames).filter(([kind])=>kind!=='category').forEach(([kind,route])=>{window.Pages[route]={render:()=>render(kind),refresh};});
})();
