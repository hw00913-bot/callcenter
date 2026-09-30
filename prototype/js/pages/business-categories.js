/** Tenant business categories and reusable fields managed in one module. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, model = CustomerBusiness;
  const layerId = 'business-configuration-editor';
  const typeNames = {text:'单行文本',textarea:'多行文本',number:'数字',select:'单选',multiselect:'多选',date:'日期',datetime:'日期和时间'};
  const kindNames = {category:'业务分类',field:'自定义字段'};
  const routeNames = {category:'business-categories',field:'business-fields'};
  const clone = value => JSON.parse(JSON.stringify(value));
  const action = (method,...args) => esc('BusinessConfiguration.'+method+'('+args.map(value=>JSON.stringify(value)).join(',')+')');
  const states = {category:{keyword:'',status:''},field:{keyword:'',status:''}};
  let tenantId = '', context = '', editor = null, activeKind = 'category', flowChanged = false;

  function currentScope() { return {enterpriseId:AppState.get().enterpriseId,tenantId}; }
  function syncScope() {
    const next = model.context(), tenants = model.tenants();
    if (context !== next) {
      context = next; tenantId = '';
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
  function dismissAll() { editor = null; ui.closeLayer(layerId); }
  function close() {
    if(editor?.parent) { editor=editor.parent; draw(); return; }
    dismissAll();
    if(flowChanged) { flowChanged=false; refresh(); }
  }
  function tenantFilter(tenants) {
    return AppState.isSuper() ? `<label class="field"><span>所属租户</span><select id="business-config-tenant" onchange="BusinessConfiguration.changeTenant(this.value)">${tenants.map(row=>`<option value="${esc(row.tenantId)}" ${row.tenantId===tenantId?'selected':''}>${esc(row.name)}</option>`).join('')}</select></label>` : '';
  }
  function links(kind) {
    return `<div class="business-config-links" role="tablist" aria-label="业务分类配置">${Object.keys(kindNames).map(key=>`<button type="button" class="btn ${kind===key?'btn-primary':''}" role="tab" aria-selected="${kind===key}" onclick="BusinessConfiguration.selectKind('${key}')">${kindNames[key]}</button>`).join('')}</div>`;
  }
  function selectKind(kind, rerender=true) {
    if(!states[kind]) return;
    activeKind=kind;
    if(rerender) refresh();
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
  function rowActions(kind,row,data) {
    const protectedField=kind==='field'&&model.presetField(row.id);
    const referenced=kind==='field'&&data.rows.some(category=>category.fields.some(ref=>ref.fieldId===row.id));
    return `<div class="table-actions"><button onclick="${action('open',kind,row.id)}">编辑</button><button onclick="${action('open',kind,row.id,true)}">预览</button>${protectedField?'':`<button onclick="${action('toggle',kind,row.id,!row.enabled)}">${row.enabled?'停用':'启用'}</button>`}${kind==='category'||protectedField||referenced?'':`<button class="business-delete-action" onclick="${action('remove',kind,row.id)}">删除</button>`}</div>`;
  }
  function tableColumns(kind,data) {
    const common=[{key:'label',label:'名称',render:value=>`<strong>${esc(value)}</strong>`}];
    if(kind==='category') common.push(
      {key:'codeLabel',label:'导入业务编码'},
      {key:'fields',label:'客服填写字段',render:value=>`${value.filter(item=>item.enabled).length} 个<span class="business-category-sub">${esc(value.filter(item=>item.enabled).slice(0,4).map(item=>fieldName(item.fieldId,data)).join('、'))}</span>`}
    );
    if(kind==='field') common.push(
      {key:'type',label:'填写方式',render:value=>esc(typeNames[value]||value)},
      {key:'businessKey',label:'业务字段编码',render:value=>esc(value||'—')},
      {key:'options',label:'选项数',render:(value,row)=>['select','multiselect'].includes(row.type) ? esc(value?.length||0) : '—'}
    );
    common.push({key:'enabled',label:'状态',render:value=>ui.status(value?'启用':'停用')},{key:'id',label:'操作',render:(_,row)=>rowActions(kind,row,data)});
    return common;
  }
  function render(kind=activeKind) {
    if(!model.canManage()) return ui.empty('当前账号无业务表单配置权限');
    activeKind=states[kind]?kind:'category'; kind=activeKind;
    const tenants=syncScope(), data=catalog(), rows=data.ok?sortedRows(kind,data):[];
    const descriptions={
      category:'维护导入业务类型，直接设置客服填写字段的顺序、显示和必填。',
      field:'独立维护客服填写字段及选项；业务编码只用于本地业务映射。'
    };
    return `<section class="platform-page business-categories-page business-config-page">${ui.pageHeader('业务分类',descriptions[kind])}${links(kind)}${filterHtml(kind,tenants)}${data.ok?'':`<p class="business-category-error" role="alert">${esc(data.message)}</p>`}<div class="management-list-shell">${ui.toolbar(`<button class="btn btn-primary" ${data.ok?'':'disabled'} onclick="${action('open',kind)}">新增${kindNames[kind]}</button>`,'<button class="btn" onclick="BusinessConfiguration.refresh()">刷新</button>')}${ui.table(tableColumns(kind,data),rows,{emptyText:'暂无'+kindNames[kind]+'，请新增'})}</div></section>`;
  }
  function changeTenant(value) {
    if(!model.tenants().some(row=>row.tenantId===value)) return;
    tenantId=value; Object.values(states).forEach(state=>{state.keyword='';state.status='';});
    dismissAll(); refresh();
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
    editor={kind,values:clone(value),initialValues:clone(value),scope:clone(currentScope()),context:model.context(),revision:data.revision,previewOnly,creating:!id};
    draw();
  }
  function openRelated(kind) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category'||kind!=='field') return;
    const data=model.catalog(editor.scope);
    if(!data.ok||data.revision!==editor.revision) return error('业务配置已更新，请重新打开分类后再新增字段');
    const values=initial(kind);
    editor={kind,values,initialValues:clone(values),scope:clone(editor.scope),context:editor.context,revision:data.revision,previewOnly:false,creating:true,parent:editor};
    draw();
  }
  function error(message) {
    const node=document.getElementById('business-config-error');
    if(node) node.textContent=message; else showToast(message,'warning');
    return false;
  }
  function resolvedFields(category,data) {
    return category.fields.filter(ref=>ref.enabled!==false).map(ref=>{
      const field=data.fields.find(row=>row.id===ref.fieldId);
      return field&&field.enabled!==false ? {...field,required:ref.required===true} : null;
    }).filter(Boolean);
  }
  function control(field) {
    if(field.type==='textarea') return '<textarea rows="3" placeholder="请输入"></textarea>';
    if(field.type==='select') return `<select><option value="">请选择</option>${field.options.map(option=>`<option>${esc(option.label)}</option>`).join('')}</select>`;
    if(field.type==='multiselect') return `<div class="business-preview-choices">${field.options.map(option=>`<label><input type="checkbox"> ${esc(option.label)}</label>`).join('')||'<span>请配置选项</span>'}</div>`;
    const type=field.type==='datetime'?'datetime-local':field.type==='text'?'text':field.type;
    return `<input type="${esc(type)}" placeholder="请输入">`;
  }
  function preview(data) {
    if(editor.kind==='field') {
      const field=editor.values;
      return `<div class="business-form-preview"><div class="business-preview-heading"><span>填写预览</span><h3>${esc(field.label||'字段名称')}</h3></div><label class="field"><span>${esc(field.label||'字段名称')}</span>${control(field)}</label></div>`;
    }
    const fields=resolvedFields(editor.values,data);
    return `<div class="business-form-preview"><div class="business-preview-heading"><span>客服填写预览</span><h3>${esc(editor.values.label||'业务名称')}</h3></div>${fields.length?fields.map(field=>`<label class="field"><span>${esc(field.label)}${field.required?'<b class="business-required"> *</b>':''}</span>${control(field)}</label>`).join(''):'<p class="business-empty-fields">暂无可填写字段</p>'}</div>`;
  }
  function categoryEditor(data) {
    const value=editor.values, used=new Set(value.fields.map(ref=>ref.fieldId));
    const choices=data.fields.filter(field=>field.enabled!==false&&!used.has(field.id));
    return `<div class="business-category-basics"><label class="field"><span>业务名称 <b class="business-required">*</b></span><input maxlength="40" value="${esc(value.label)}" placeholder="例如：新车咨询" oninput="BusinessConfiguration.setBasic('label',this.value)"></label><label class="field"><span>导入时的业务编码名称 <b class="business-required">*</b></span><input maxlength="40" value="${esc(value.codeLabel)}" placeholder="例如：线索编码" oninput="BusinessConfiguration.setBasic('codeLabel',this.value)"></label></div><div class="business-fields-heading"><h3>客服填写字段</h3><span>直接设置顺序、显示和必填</span></div>${value.id==='lead'?'<p class="business-preset-note">线索统计的六个预置字段须保留；不需要填写时可关闭显示。</p>':''}<div id="business-category-cards">${categoryCards(data)}</div><div class="business-category-picker"><select id="business-category-field-picker" ${choices.length?'':'disabled'}><option value="">请选择已有字段</option>${choices.map(field=>`<option value="${esc(field.id)}">${esc(field.label)}</option>`).join('')}</select><button class="btn" ${choices.length?'':'disabled'} onclick="BusinessConfiguration.addCategoryField()">添加字段</button><button type="button" class="btn" onclick="BusinessConfiguration.openRelated('field')">＋ 新建字段</button></div><small>字段可以用于多个业务分类，每个分类独立设置显示顺序和必填。</small>`;
  }
  function categoryCards(data) {
    const refs=editor.values.fields;
    return refs.map((ref,index)=>{
      const field=data.fields.find(row=>row.id===ref.fieldId);
      const protectedRef=editor.values.id==='lead'&&model.presetField(ref.fieldId);
      return `<article class="business-field-card"><div class="business-field-card-head"><span>第 ${index+1} 项 · ${esc(field?.label||'字段已移除')}${field?.enabled===false?'（已停用）':''}</span><div><button class="btn-link" ${index===0?'disabled':''} onclick="${action('moveCategoryField',index,-1)}">上移</button><button class="btn-link" ${index===refs.length-1?'disabled':''} onclick="${action('moveCategoryField',index,1)}">下移</button><button class="btn-link business-remove-field" ${protectedRef?'disabled':''} onclick="${action('removeCategoryField',index)}">移除</button></div></div><p class="business-category-field-meta">${esc(typeNames[field?.type]||'未知类型')}${field?.businessKey?' · 业务字段编码 '+esc(field.businessKey):''}</p><div class="business-field-switches"><label><input type="checkbox" ${ref.enabled!==false?'checked':''} ${field?.enabled===false&&ref.enabled===false?'disabled':''} onchange="BusinessConfiguration.setCategoryField(${index},'enabled',this.checked)"> 显示此字段</label><label><input type="checkbox" ${ref.required===true?'checked':''} ${ref.enabled===false?'disabled':''} onchange="BusinessConfiguration.setCategoryField(${index},'required',this.checked)"> 必填</label></div></article>`;
    }).join('');
  }
  function optionsEditor() {
    return editor.values.options.map((option,index)=>`<div class="business-option-row"><span class="business-option-number">${index+1}</span><label class="field"><span>显示名称 <b class="business-required">*</b></span><input maxlength="80" value="${esc(option.label)}" placeholder="例如：高意向" ${model.presetField(editor.values.id)?'readonly':''} oninput="BusinessConfiguration.setOption(${index},'label',this.value)"></label><label class="field"><span>业务主键（选项编码，选填）</span><input maxlength="80" value="${esc(option.businessKey||'')}" placeholder="例如：HIGH" oninput="BusinessConfiguration.setOption(${index},'businessKey',this.value)"></label><button class="btn-link business-remove-field" ${model.presetField(editor.values.id)?'disabled':''} aria-label="删除选项 ${index+1}" onclick="${action('removeOption',index)}">删除</button></div>`).join('');
  }
  function fieldEditor() {
    const value=editor.values, protectedField=!!model.presetField(value.id), choice=['select','multiselect'].includes(value.type);
    return `<div class="business-category-basics"><label class="field"><span>字段名称 <b class="business-required">*</b></span><input maxlength="40" value="${esc(value.label)}" placeholder="例如：意向车型" oninput="BusinessConfiguration.setBasic('label',this.value)"></label><label class="field"><span>填写方式 <b class="business-required">*</b></span><select ${protectedField?'disabled':''} onchange="BusinessConfiguration.setBasic('type',this.value)">${Object.entries(typeNames).map(([key,label])=>`<option value="${key}" ${value.type===key?'selected':''}>${label}</option>`).join('')}</select></label></div><label class="field"><span>业务主键（字段编码，选填）</span><input maxlength="80" value="${esc(value.businessKey||'')}" placeholder="例如：lead_level" oninput="BusinessConfiguration.setBasic('businessKey',this.value)"><small>仅作本地业务映射；不作为字段的系统 ID。</small></label>${choice?`<div class="business-fields-heading"><h3>选项配置</h3><span>显示名称必填，业务主键选填</span></div><div id="business-field-options">${optionsEditor()}</div><button class="btn business-add-field" ${protectedField||value.options.length>=50?'disabled':''} onclick="BusinessConfiguration.addOption()">＋ 添加选项</button>`:''}${protectedField?'<p class="business-preset-note">线索统计预置字段的填写方式和选项不可修改，业务编码可维护。</p>':''}`;
  }
  function editorBody(data) {
    if(editor.kind==='category') return categoryEditor(data);
    return fieldEditor();
  }
  function draw() {
    if(!isActive()) { dismissAll(); return showToast('工作范围已变化，请重新打开','warning'); }
    const data=model.catalog(editor.scope);
    if(!data.ok) { dismissAll(); return showToast(data.message,'warning'); }
    const title=editor.previewOnly?'表单预览':editor.creating?'新增'+kindNames[editor.kind]:'编辑'+kindNames[editor.kind];
    ui.openLayer(layerId,`<div class="layer-header"><h2>${title}</h2><button aria-label="关闭" onclick="BusinessConfiguration.close()">×</button></div><div class="layer-body business-category-body ${editor.previewOnly?'preview-only':''}">${editor.previewOnly?'':`<div class="business-category-settings">${editorBody(data)}<p id="business-config-error" class="business-category-error" role="alert"></p></div>`}<div id="business-config-preview">${preview(data)}</div></div><div class="layer-footer"><button class="btn" onclick="BusinessConfiguration.close()">${editor.parent?'返回上一步':editor.previewOnly?'关闭':'取消'}</button>${editor.previewOnly?'':'<button class="btn btn-primary" onclick="BusinessConfiguration.save()">保存</button>'}</div>`,editor.previewOnly?'large':'wide',{objectKey:'business-config-editor',discardKey:`${editor.kind}:${editor.values.id}`,isDirty:()=>!editor.previewOnly&&JSON.stringify(editor.values)!==JSON.stringify(editor.initialValues)});
  }
  function updatePreview() {
    if(!isActive()) return;
    const node=document.getElementById('business-config-preview');
    if(node) node.innerHTML=preview(model.catalog(editor.scope));
  }
  function redrawDynamic() {
    if(!isActive()) return;
    const data=model.catalog(editor.scope);
    if(editor.kind==='category') {
      const node=document.getElementById('business-category-cards');
      if(node) node.innerHTML=categoryCards(data);
      const picker=document.getElementById('business-category-field-picker');
      const used=new Set(editor.values.fields.map(ref=>ref.fieldId));
      if(picker) {
        const choices=data.fields.filter(field=>field.enabled!==false&&!used.has(field.id));
        picker.innerHTML='<option value="">请选择已有字段</option>'+choices.map(field=>`<option value="${esc(field.id)}">${esc(field.label)}</option>`).join('');
        picker.disabled=!choices.length;
        picker.nextElementSibling.disabled=!choices.length;
      }
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
    if(editor.kind==='field'&&key==='type') {
      if(model.presetField(editor.values.id)||!model.fieldTypes.includes(value)) return;
      editor.values.type=value;
      if(['select','multiselect'].includes(value)&&!editor.values.options.length) editor.values.options=[{id:model.newId('option'),label:'',businessKey:''}];
      if(!['select','multiselect'].includes(value)) editor.values.options=[];
      draw(); return;
    }
    editor.values[key]=value;
    updatePreview();
  }
  function addCategoryField() {
    if(!isActive()||editor.previewOnly||editor.kind!=='category') return;
    const id=document.getElementById('business-category-field-picker')?.value;
    const data=model.catalog(editor.scope);
    if(!id||editor.values.fields.some(ref=>ref.fieldId===id)||!data.fields.some(field=>field.id===id&&field.enabled!==false)) return error('请选择尚未添加的启用字段');
    editor.values.fields.push({fieldId:id,enabled:true,required:false});
    redrawDynamic();
  }
  function removeCategoryField(index) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category'||!editor.values.fields[index]) return;
    if(editor.values.id==='lead'&&model.presetField(editor.values.fields[index].fieldId)) return;
    editor.values.fields.splice(index,1); redrawDynamic();
  }
  function moveCategoryField(index,direction) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category') return;
    const refs=editor.values.fields, next=index+direction;
    if(!refs[index]||!refs[next]) return;
    [refs[index],refs[next]]=[refs[next],refs[index]]; redrawDynamic();
  }
  function setCategoryField(index,key,value) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category'||!['enabled','required'].includes(key)) return;
    const ref=editor.values.fields[index]; if(!ref) return;
    if(key==='enabled'&&value&&model.getField(ref.fieldId,editor.scope)?.enabled===false) return error('字段库已停用此字段，请先启用字段');
    ref[key]=!!value;
    if(key==='enabled'&&!value) ref.required=false;
    redrawDynamic();
  }
  function setOption(index,key,value) {
    if(!isActive()||editor.previewOnly||editor.kind!=='field'||!['label','businessKey'].includes(key)) return;
    if(model.presetField(editor.values.id)&&key==='label') return;
    const option=editor.values.options[index]; if(!option) return;
    option[key]=value; updatePreview();
  }
  function addOption() {
    if(!isActive()||editor.previewOnly||editor.kind!=='field'||model.presetField(editor.values.id)||editor.values.options.length>=50) return;
    editor.values.options.push({id:model.newId('option'),label:'',businessKey:''});
    redrawDynamic();
    document.querySelector('#business-field-options .business-option-row:last-child input')?.focus();
  }
  function removeOption(index) {
    if(!isActive()||editor.previewOnly||editor.kind!=='field'||model.presetField(editor.values.id)||!editor.values.options[index]) return;
    editor.values.options.splice(index,1); redrawDynamic();
  }
  function save() {
    if(!isActive()||editor.previewOnly) return error('工作范围已变化，请重新打开');
    const methods={category:model.save,field:model.saveField};
    const result=methods[editor.kind](editor.values,editor.scope,{expectedContext:editor.context,expectedRevision:editor.revision});
    if(!result.ok) return error(result.message);
    if(editor.parent) {
      const child=editor, parent=editor.parent;
      parent.revision=model.catalog(parent.scope).revision;
      if(child.kind==='field'&&parent.kind==='category'&&!parent.values.fields.some(ref=>ref.fieldId===child.values.id)) parent.values.fields.push({fieldId:child.values.id,enabled:true,required:false});
      editor=parent; flowChanged=true; draw(); showToast(result.message,'success'); return;
    }
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
  function remove(kind,id) {
    if(kind==='category') return showToast('业务分类暂不支持删除，可停用','warning');
    if(!states[kind]||!model.canManage()||context!==model.context()) return showToast('工作范围已变化，请刷新后操作','warning');
    const data=catalog(); if(!data.ok) return showToast(data.message,'warning');
    const row=rowsOf(kind,data).find(item=>item.id===id); if(!row) return showToast('当前租户没有此配置','warning');
    ui.confirm({title:'删除'+kindNames[kind],body:'删除“'+esc(row.label)+'”？已被引用的配置不能删除。',confirmText:'删除',danger:true,onConfirm:()=>{
      const result=model.deleteField(id,currentScope(),{expectedContext:data.context,expectedRevision:data.revision});
      if(!result.ok) return error(result.message);
      refresh(); showToast(result.message,'success');
    }});
  }
  window.BusinessConfiguration={render,refresh,selectKind,changeTenant,query,reset,open,openRelated,close,setBasic,addCategoryField,removeCategoryField,moveCategoryField,setCategoryField,setOption,addOption,removeOption,save,toggle,remove};
  window.BusinessCategories=window.BusinessConfiguration;
  window.Pages=window.Pages||{};
  window.Pages['business-categories']={render:()=>render(),refresh};
  Object.entries(routeNames).filter(([kind])=>kind!=='category').forEach(([kind,route])=>{window.Pages[route]={render:()=>render(kind),refresh};});
})();
