"""Pure UI transform for brand-owned import and follow-up fields.

Keeps the existing editor, interface parameters, guard and draft lifecycle.
The normal module builder owns generated output and syntax validation.
"""


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Field UI source conflict: ' + before[:150])
    return code.replace(before, after, 1)


def function(code, name, body):
    start = code.index('  function ' + name + '(')
    end = code.find('\n  function ', start + 3)
    if end < 0:
        raise ValueError('Missing field UI function boundary: ' + name)
    return code[:start] + body.strip('\n') + '\n' + code[end:]


HELPERS = r'''
  const usageLabel = field => model.fieldUsage(field)==='IMPORT'?'导入字段':'填写字段';
  const usageOf = field => model.fieldUsage(field);
  const allRefs = category => model.categoryFieldRefs(category);
  function activeUsage() { return editor?.fieldTab==='IMPORT'?'IMPORT':'FOLLOWUP'; }
  function categoryRefs(create=false) { return activeUsage()==='IMPORT'?(editor.values.importFields||(create?(editor.values.importFields=[]):[])):editor.values.fields; }
  function brandLabel(scope=currentScope()) {
    if(scope?.legacy||!scope?.brandId)return '原租户目录 · 品牌待明确';
    return model.brands().find(row=>row.brandId===scope.brandId)?.name||scope.brandId;
  }
  function editLocks() { return !editor||editor.kind!=='field'||editor.creating?{locked:false}:model.fieldEditLocks(editor.values.id,editor.scope); }
  function originalOption(option) { return !!option&&editor.initialValues.options.some(row=>row.id===option.id); }
  function selectFieldTab(usage) {
    if(!isActive()||editor.previewOnly||editor.kind!=='category'||!['IMPORT','FOLLOWUP'].includes(usage))return;
    editor.fieldTab=usage;editor.selectedFieldId='';editor.repairFieldId='';clearError();draw();
  }
  function fieldTabs() {
    return '<div class="record-type-tabs" role="tablist" aria-label="分类字段用途">'+['IMPORT','FOLLOWUP'].map(usage=>'<button type="button" role="tab" aria-selected="'+(activeUsage()===usage)+'" class="'+(activeUsage()===usage?'active':'')+'" onclick="'+action('selectFieldTab',usage)+'">'+(usage==='IMPORT'?'导入字段':'填写字段')+'</button>').join('')+'</div>';
  }
'''


FIELD_EDITOR = r'''
  function fieldEditor() {
    const value=editor.values, protectedField=!!model.presetField(value.id), mapping=isMappingSeries(value), choice=['select','multiselect'].includes(value.type), importing=usageOf(value)==='IMPORT', locks=editLocks(), legacy=editor.scope.legacy||!editor.scope.brandId;
    return `${stepHeading(1,mapping?'设置车系接口':'设置字段',importing?'通过业务编码将导入列映射到业务字段。':'配置客服填写及跟进时使用的字段。')}<div class="business-category-basics"><label class="field"><span>所属品牌</span><input id="business-field-brand" value="${esc(brandLabel(editor.scope))}" readonly><small>在列表中选择品牌后维护；跨品牌使用请在目标品牌新建字段。</small></label><label class="field"><span>字段用途 <b class="business-required">*</b></span><select id="business-field-usage" ${locks.locked||protectedField||mapping?'disabled':''} onchange="BusinessConfiguration.setBasic('usage',this.value)"><option value="IMPORT" ${importing?'selected':''} ${legacy?'disabled':''}>导入字段</option><option value="FOLLOWUP" ${importing?'':'selected'}>填写字段</option></select>${legacy?'<small>旧租户字段保留原用途；新增导入字段请进入明确品牌的字段库。</small>':''}</label><label class="field"><span>字段名称 <b class="business-required">*</b></span><input id="business-field-label" maxlength="40" value="${esc(value.label)}" placeholder="例如：意向车型" oninput="BusinessConfiguration.setBasic('label',this.value)"></label><label class="field"><span>字段类型 <b class="business-required">*</b></span><select id="business-field-type" ${protectedField||locks.locked?'disabled':''} onchange="BusinessConfiguration.setBasic('type',this.value)">${Object.entries(typeNames).filter(([key])=>(!mapping||key.startsWith('interface-'))&&(!importing||!key.startsWith('interface-'))).map(([key,label])=>`<option value="${key}" ${(value.type==='interface'?'interface-'+model.selectionMode(value):value.type)===key?'selected':''}>${label}</option>`).join('')}</select></label></div><label class="field"><span>业务编码${importing?' <b class="business-required">*</b>':'（选填）'}</span><input id="business-field-business-key" maxlength="80" value="${esc(value.businessKey||'')}" ${importing?'required aria-required="true"':''} ${locks.locked?'readonly':''} placeholder="例如：intention_model" oninput="BusinessConfiguration.setBasic('businessKey',this.value)"><small>${importing?'导入映射必须提供业务编码；分类引用字段后自动带出，不重复维护。':'编码沿用原填写字段规则；同品牌同用途内，非空编码不能重复。'}</small></label>${locks.locked?'<p id="business-field-reference-lock" class="business-preset-note" role="status">'+esc(locks.reason||'已有引用：品牌、用途、业务编码、类型和已有选项标识不可修改。')+'</p>':''}${value.type==='interface'?interfaceEditor():''}${choice?`<div class="business-fields-heading"><h3>选项配置</h3><span>显示名称必填，选项编码选填</span></div><div id="business-field-options">${optionsEditor()}</div><button class="btn business-add-field" ${protectedField||value.options.length>=50?'disabled':''} onclick="BusinessConfiguration.addOption()">＋ 添加选项</button>`:''}${protectedField?'<p class="business-preset-note">保留线索统计预置字段的原填写方式及选项；已有引用的业务编码不可修改。</p>':''}`;
  }
'''


CATEGORY_EDITOR = r'''
  function categoryEditor(data) {
    const value=editor.values, choices=availableCategoryFields(value,data), issue=model.configurationIssue(value.id,editor.scope,value), importing=activeUsage()==='IMPORT';
    return `<div id="business-config-flow-note" class="business-config-notice" role="status" ${editor.flowNote?'':'hidden'}>${esc(editor.flowNote||'')}</div><div class="business-category-basics"><label class="field"><span>所属品牌</span><input value="${esc(brandLabel(editor.scope))}" readonly></label><label class="field"><span>业务名称 <b class="business-required">*</b></span><input id="business-category-label" maxlength="40" value="${esc(value.label)}" placeholder="例如：新车咨询" oninput="BusinessConfiguration.setBasic('label',this.value)"></label><label class="field"><span>导入时的业务记录编码名称 <b class="business-required">*</b></span><input id="business-category-code-label" maxlength="40" value="${esc(value.codeLabel)}" placeholder="例如：线索编码" oninput="BusinessConfiguration.setBasic('codeLabel',this.value)"></label></div>${fieldTabs()}<div class="business-fields-heading"><h3>${importing?'导入字段':'填写字段'}</h3><span>${importing?'设置导入顺序与数据必填；业务编码由字段库带出':'设置顺序、显示和必填，再保存分类'}</span></div><p id="business-category-config-warning" class="business-category-error" role="alert" ${issue?'':'hidden'}>${esc(issue)}</p>${importing&&(editor.scope.legacy||!editor.scope.brandId)?'<p class="business-preset-note">当前为旧租户目录，保留历史配置；新增导入字段请先明确品牌归属。</p>':''}<div id="business-category-cards">${categoryCards(data)}</div><div class="business-category-picker"><select id="business-category-field-picker" ${choices.length?'':'disabled'} onchange="BusinessConfiguration.selectCategoryField(this.value)"><option value="">请选择已有${importing?'导入':'填写'}字段</option>${choices.map(field=>`<option value="${esc(field.id)}" ${editor.selectedFieldId===field.id?'selected':''}>${esc(field.label)}${field.businessKey?' · '+esc(field.businessKey):''}</option>`).join('')}</select><button class="btn" ${choices.length?'':'disabled'} onclick="BusinessConfiguration.addCategoryField()">添加字段</button><button type="button" class="btn" ${importing&&(editor.scope.legacy||!editor.scope.brandId)?'disabled':''} onclick="BusinessConfiguration.openRelated('field')">＋ 新建${importing?'导入':'填写'}字段</button></div><div id="business-category-field-guidance" class="business-config-field-guidance" role="status">${sourceGuidance(data.fields.find(row=>row.id===editor.selectedFieldId),value,data)}</div><small>${importing?'导入字段只读取本品牌的导入用途字段。业务编码必填与每行数据是否必填分别配置；顺序用于导入模板。':'填写字段可用于多个分类；各分类独立配置顺序、显示和必填。接口查询仍按原租户授权和上游依赖规则使用。'}</small>`;
  }
'''


CATEGORY_CARDS = r'''
  function categoryCards(data) {
    const refs=categoryRefs(), importing=activeUsage()==='IMPORT';
    return refs.map((ref,index)=>{
      const field=data.fields.find(row=>row.id===ref.fieldId);
      return `<article id="business-category-card-${esc(ref.fieldId)}" class="business-field-card" tabindex="-1"><div class="business-field-card-head"><span>第 ${index+1} 项 · ${esc(field?.label||'字段已移除')}〔${importing?'导入':'填写'}〕${field?.enabled===false?'（已停用）':''}</span><div><button class="btn-link" ${index===0?'disabled':''} onclick="${action('moveCategoryField',index,-1)}">上移</button><button class="btn-link" ${index===refs.length-1?'disabled':''} onclick="${action('moveCategoryField',index,1)}">下移</button><button class="btn-link business-remove-field" onclick="${action('removeCategoryField',index)}">移除</button></div></div><p class="business-category-field-meta">${esc(typeLabel(field))}${model.usesQueryConditions(field)?' · 查询条件：'+(requiredDependency(field)?'先填写并确认 ':'可不填写 ')+esc(model.activeDependencies(field).map(id=>fieldName(id,data)).join('、')||'待配置'):''}</p>${importing?'<label class="field"><span>业务编码</span><input value="'+esc(field?.businessKey||'')+'" readonly aria-label="'+esc(field?.label||'导入字段')+'业务编码"><small>由字段库带出；用于导入列到业务字段的映射。</small></label>':field?.businessKey?'<p class="business-category-field-meta">业务编码 '+esc(field.businessKey)+'</p>':''}<div class="business-field-switches"><label><input type="checkbox" ${ref.enabled!==false?'checked':''} ${field?.enabled===false&&ref.enabled===false?'disabled':''} onchange="BusinessConfiguration.setCategoryField(${index},'enabled',this.checked)"> ${importing?'启用导入字段':'显示此字段'}</label><label><input type="checkbox" ${ref.required===true?'checked':''} ${ref.enabled===false?'disabled':''} onchange="BusinessConfiguration.setCategoryField(${index},'required',this.checked)"> ${importing?'每行导入数据必填':'客服必须填写'}</label></div></article>`;
    }).join('')||'<p class="business-empty-fields">暂未配置'+(importing?'导入':'填写')+'字段</p>';
  }
'''


OPTIONS_EDITOR = r'''
  function optionsEditor() {
    const locked=editLocks().locked;
    return editor.values.options.map((option,index)=>{const retained=locked&&originalOption(option),preset=!!model.presetField(editor.values.id);return `<div class="business-option-row"><span class="business-option-number">${index+1}</span><label class="field"><span>显示名称 <b class="business-required">*</b></span><input maxlength="80" value="${esc(option.label)}" placeholder="例如：高意向" ${preset?'readonly':''} oninput="BusinessConfiguration.setOption(${index},'label',this.value)"></label><label class="field"><span>业务主键（选项编码，选填）</span><input maxlength="80" value="${esc(option.businessKey||'')}" ${retained?'readonly':''} placeholder="例如：HIGH" oninput="BusinessConfiguration.setOption(${index},'businessKey',this.value)"></label><div style="min-width:64px"><label class="business-field-switches" style="display:flex;align-items:center;white-space:nowrap"><input type="checkbox" ${option.enabled!==false?'checked':''} ${preset?'disabled':''} aria-label="选项 ${index+1} 启用" onchange="BusinessConfiguration.setOption(${index},'enabled',this.checked)"> 启用</label><button class="btn-link business-remove-field" ${preset||retained?'disabled':''} aria-label="删除选项 ${index+1}" onclick="${action('removeOption',index)}">删除</button></div></div>`;}).join('');
  }
'''


PREVIEW = r'''
  function preview(data) {
    const importing=editor.kind==='field'?usageOf(editor.values)==='IMPORT':activeUsage()==='IMPORT';
    if(editor.kind==='field') {
      const field=editor.values;
      return `<div class="business-form-preview"><div class="business-preview-heading"><span>${importing?'导入字段预览':'填写预览'}</span><h3>${esc(field.label||'字段名称')}〔${importing?'导入':'填写'}〕</h3></div>${importing?'<p>业务编码：'+esc(field.businessKey||'待填写')+'</p>':''}${field.type==='interface'?'<div id="business-field-rule-summary" class="business-query-summary" role="status" aria-live="polite">'+ruleSummary()+'</div>':''}<label class="field"><span>${esc(field.label||'字段名称')}</span>${control(field)}</label></div>`;
    }
    if(editor.previewOnly) {
      const imports=(editor.values.importFields||[]).filter(ref=>ref.enabled!==false).map(ref=>{const field=data.fields.find(row=>row.id===ref.fieldId);return field?{...field,required:ref.required}:null;}).filter(Boolean),followup=editor.values.fields.filter(ref=>ref.enabled!==false).map(ref=>{const field=data.fields.find(row=>row.id===ref.fieldId);return field?{...field,required:ref.required}:null;}).filter(Boolean);
      return '<div class="business-form-preview"><div class="business-preview-heading"><span>分类字段预览 · '+esc(brandLabel(editor.scope))+'</span><h3>'+esc(editor.values.label||'业务名称')+'</h3></div><h4>导入字段与映射</h4>'+(imports.length?imports.map(field=>'<label class="field"><span>'+esc(field.label)+'〔导入〕'+(field.required?' · 数据必填':'')+'</span><input value="'+esc(field.businessKey||'编码待确认')+'" readonly></label>').join(''):'<p class="business-empty-fields">暂未配置导入字段</p>')+'<h4>客服填写字段</h4>'+(followup.length?followup.map(field=>'<label class="field"><span>'+esc(field.label)+'〔填写〕'+(field.required?' <b class="business-required">*</b>':'')+'</span>'+control(field)+'</label>').join(''):'<p class="business-empty-fields">暂无可填写字段</p>')+'</div>';
    }
    const fields=resolvedFields(editor.values,data);
    return `<div class="business-form-preview"><div class="business-preview-heading"><span>${importing?'导入字段与映射预览':'客服填写预览'}</span><h3>${esc(editor.values.label||'业务名称')}</h3></div>${fields.length?fields.map(field=>`<label class="field"><span>${esc(field.label)}${field.required?'<b class="business-required"> *</b>':''}${importing?' · '+esc(field.businessKey||'编码待确认'):''}</span>${control(field)}</label>`).join(''):'<p class="business-empty-fields">暂无'+(importing?'导入':'可填写')+'字段</p>'}</div>`;
  }
'''


def transform(kind, path, code):
    if kind != 'cloud' or path != 'js/pages/business-categories.js':
        return code
    code = one(code, '  function availableKinds() {', HELPERS + '\n  function availableKinds() {')
    code = one(code, "field:{keyword:'',status:''}", "field:{keyword:'',status:'',usage:''}")
    code = code.replace("state.keyword='';state.status='';", "state.keyword='';state.status='';if(Object.hasOwn(state,'usage'))state.usage='';")
    code = one(code, "states[kind].status=document.getElementById('business-config-status')?.value||'';", "states[kind].status=document.getElementById('business-config-status')?.value||'';\n    if(kind==='field')states.field.usage=document.getElementById('business-config-usage')?.value||'';")
    code = one(code, "states[kind].status='';refresh();", "states[kind].status='';if(kind==='field')states.field.usage='';refresh();")
    code = one(code, '${brandFilter(brands)}<label class="field grow">', '${brandFilter(brands)}${kind===\'field\'?`<label class="field"><span>字段用途</span><select id="business-config-usage"><option value="">全部用途</option><option value="IMPORT" ${state.usage===\'IMPORT\'?\'selected\':\'\'}>导入字段</option><option value="FOLLOWUP" ${state.usage===\'FOLLOWUP\'?\'selected\':\'\'}>填写字段</option></select></label>`:\'\'}<label class="field grow">')
    code = one(code, "const rows=rowsOf(kind,data).filter(row=>", "const rows=rowsOf(kind,data).filter(row=>(kind!=='field'||!state.usage||usageOf(row)===state.usage)&&")
    code = one(code, "if(kind==='field') common.push(", "if(kind==='field') common.push(\n      {key:'brandId',label:'所属品牌',render:()=>esc(brandLabel())},\n      {key:'usage',label:'字段用途',render:(_,row)=>esc(usageLabel(row))},")
    code = one(code, "{key:'type',label:'填写方式'", "{key:'type',label:'字段类型'")
    code = one(code, "{key:'fields',label:'客服填写字段'", "{key:'importFields',label:'导入字段',render:value=>`${(value||[]).filter(item=>item.enabled).length} 个<span class=\"business-category-sub\">${esc((value||[]).filter(item=>item.enabled).slice(0,4).map(item=>fieldName(item.fieldId,data)).join('、'))}</span>`},\n      {key:'fields',label:'填写字段'")
    code = code.replace("data.rows.filter(row=>row.fields.some(ref=>ref.fieldId===field.id))", "data.rows.filter(row=>allRefs(row).some(ref=>ref.fieldId===field.id))")
    code = code.replace("data.rows.filter(row=>row.fields.some(ref=>ref.fieldId===editor.values.id))", "data.rows.filter(row=>allRefs(row).some(ref=>ref.fieldId===editor.values.id))")
    code = code.replace('维护品牌共用业务分类和客服字段；', '维护品牌共用业务分类及导入、填写字段；')
    code = code.replace('维护本品牌可复用的完整客服字段，再加入分类设置顺序、显示和必填。', '按品牌维护导入、填写两类独立字段，再加入分类配置导入映射或填写规则。')
    code = code.replace('3. 预览并保存分类，供客服填写', '3. 分别配置导入映射和填写规则并保存分类')
    code = one(code, "enabled:true,fields:[]};", "enabled:true,fields:[],importFields:[]};")
    code = one(code, "label:'',type:'text',businessKey:'',options:[],enabled:true};", "label:'',type:'text',businessKey:'',options:[],enabled:true,usage:states.field.usage||'FOLLOWUP',...(currentScope().brandId?{brandId:currentScope().brandId}:{})};")
    code = one(code, "    if(kind==='category'){['flowBinding'", "    if(kind==='category'){editor.fieldTab=usageOf(data.fields.find(row=>row.id===editor.selectedFieldId));['flowBinding'")
    code = one(code, "    const values=initial(kind);", "    const values=initial(kind);values.usage=activeUsage();")
    code = one(code, 'return category.fields.filter(ref=>ref.enabled!==false)', "return (activeUsage()==='IMPORT'?(category.importFields||[]):category.fields).filter(ref=>ref.enabled!==false)")
    code = one(code, 'const used=new Set(category.fields.map(ref=>ref.fieldId)), hasSeries=hasSeriesField(category,data);', "const importing=activeUsage()==='IMPORT', refs=importing?(category.importFields||[]):category.fields, used=new Set(refs.map(ref=>ref.fieldId)), hasSeries=!importing&&hasSeriesField(category,data);\n    if(importing&&(editor.scope.legacy||!editor.scope.brandId))return [];")
    code = one(code, "return data.fields.filter(field=>field.enabled!==false&&!used.has(field.id)&&(!hasSeries||!isSeriesField(field)));", "return data.fields.filter(field=>usageOf(field)===activeUsage()&&field.enabled!==false&&!used.has(field.id)&&(!hasSeries||!isSeriesField(field)));")
    code = one(code, "    if(!field) return '<p>选择已有字段后，", "    if(editor?.kind==='category'&&activeUsage()==='IMPORT')return field?'<p>“'+esc(field.label)+'”〔导入〕 · 业务编码：<strong>'+esc(field.businessKey||'待填写')+'</strong>。添加后设置导入顺序与每行数据是否必填，再保存分类。</p>':'<p>选择本品牌已有导入字段后添加；业务编码由字段库带出。</p>';\n    if(!field) return '<p>选择已有字段后，")
    for name, body in [('fieldEditor',FIELD_EDITOR),('categoryEditor',CATEGORY_EDITOR),('categoryCards',CATEGORY_CARDS),('optionsEditor',OPTIONS_EDITOR),('preview',PREVIEW)]:
        code = function(code,name,body)
    code = one(code, "const sourceFields=data.fields.filter(field=>field.id!==value.id);", "const sourceFields=data.fields.filter(field=>field.id!==value.id&&usageOf(field)==='FOLLOWUP');")
    code = one(code, '${field.options.map(option=>`<option>${esc(option.label)}</option>`)', '${field.options.map(option=>`<option ${option.enabled===false?\'disabled\':\'\'}>${esc(option.label)}${option.enabled===false?\'（已停用）\':\'\'}</option>`)')
    code = one(code, '${field.options.map(option=>`<label><input type="checkbox"> ${esc(option.label)}</label>`)', '${field.options.map(option=>`<label><input type="checkbox" ${option.enabled===false?\'disabled\':\'\'}> ${esc(option.label)}${option.enabled===false?\'（已停用）\':\'\'}</label>`)')
    code = one(code, "picker.innerHTML='<option value=\"\">请选择已有字段</option>'+choices.map(field=>`<option value=\"${esc(field.id)}\" ${editor.selectedFieldId===field.id?'selected':''}>${esc(field.label)}</option>`).join('');", "picker.innerHTML='<option value=\"\">请选择已有'+(activeUsage()==='IMPORT'?'导入':'填写')+'字段</option>'+choices.map(field=>`<option value=\"${esc(field.id)}\" ${editor.selectedFieldId===field.id?'selected':''}>${esc(field.label)}${field.businessKey?' · '+esc(field.businessKey):''}</option>`).join('');")
    code = one(code, "const allowed={category:['label','codeLabel'],field:['label','type','businessKey']};", "const allowed={category:['label','codeLabel'],field:['label','type','businessKey','usage']};")
    code = one(code, "    clearError();\n    if(editor.kind==='field'&&key==='type') {", """    clearError();
    if(editor.kind==='field'&&['type','businessKey','usage'].includes(key)&&editLocks().locked)return error(editLocks().reason||'字段已有引用，此属性不可修改');
    if(editor.kind==='field'&&key==='usage') {
      if(!['IMPORT','FOLLOWUP'].includes(value))return;
      if(model.presetField(editor.values.id)||isMappingSeries(editor.values))return error('预置字段保留原填写用途');
      if(value==='IMPORT'&&(editor.scope.legacy||!editor.scope.brandId))return error('请先进入明确品牌的字段库');
      if(value==='IMPORT'&&editor.values.type==='interface')return error('接口取数字段用于填写，请先选择文件数据支持的字段类型');
      editor.values.usage=value;draw();return;
    }
    if(editor.kind==='field'&&key==='type') {""")
    code = one(code, "      const next=mode?'interface':value;", "      const next=mode?'interface':value;\n      if(usageOf(editor.values)==='IMPORT'&&next==='interface')return error('导入字段不使用接口取数类型');")
    code = one(code, "    const id=document.getElementById('business-category-field-picker')?.value;", """    if(activeUsage()==='IMPORT') {
      const id=document.getElementById('business-category-field-picker')?.value||editor.selectedFieldId,data=model.catalog(editor.scope),field=data.fields.find(row=>row.id===id),refs=categoryRefs();
      if(!field||usageOf(field)!=='IMPORT'||field.enabled===false||refs.some(ref=>ref.fieldId===id)||!field.businessKey)return error('请选择本品牌尚未添加且业务编码完整的导入字段');
      clearError();categoryRefs(true).push({fieldId:id,enabled:true,required:false});editor.selectedFieldId='';editor.flowNote='“'+field.label+'”〔导入〕已加入分类草稿，请保存业务分类后生效。';redrawDynamic();return;
    }
    const id=document.getElementById('business-category-field-picker')?.value;""")
    code = one(code, "if(!id||editor.values.fields.some(ref=>ref.fieldId===id)||!field||field.enabled===false)", "if(!id||editor.values.fields.some(ref=>ref.fieldId===id)||!field||usageOf(field)!=='FOLLOWUP'||field.enabled===false)")
    code = one(code, "    if(!isActive()||editor.previewOnly||editor.kind!=='category'||!editor.values.fields[index]) return;", "    if(!isActive()||editor.previewOnly||editor.kind!=='category')return;\n    if(activeUsage()==='IMPORT'){const refs=categoryRefs();if(!refs[index])return;clearError();refs.splice(index,1);redrawDynamic();return;}\n    if(!editor.values.fields[index])return;")
    code = one(code, 'const refs=editor.values.fields, next=index+direction;', 'const refs=categoryRefs(), next=index+direction;')
    code = one(code, '    const ref=editor.values.fields[index]; if(!ref) return;', """    if(activeUsage()==='IMPORT') {
      const ref=categoryRefs()[index];if(!ref)return;
      if(key==='enabled'&&value&&model.getField(ref.fieldId,editor.scope)?.enabled===false)return error('字段库已停用此导入字段，请先启用后返回');
      clearError();ref[key]=!!value;if(key==='enabled'&&!value)ref.required=false;redrawDynamic();return;
    }
    const ref=editor.values.fields[index]; if(!ref) return;""")
    code = one(code, "    const option=editor.values.options[index]; if(!option) return;", "    const option=editor.values.options[index]; if(!option) return;\n    if(key==='businessKey'&&editLocks().locked&&originalOption(option))return error('已有引用的选项编码不可修改');")
    code = one(code, "!['label','businessKey'].includes(key)", "!['label','businessKey','enabled'].includes(key)")
    code = one(code, "if(model.presetField(editor.values.id)&&key==='label') return;", "if(model.presetField(editor.values.id)&&['label','enabled'].includes(key)) return;")
    code = one(code, "    option[key]=value; updatePreview();", "    option[key]=key==='enabled'?!!value:value; updatePreview();")
    code = code.replace("{id:model.newId('option'),label:'',businessKey:''}", "{id:model.newId('option'),label:'',businessKey:'',enabled:true}")
    code = one(code, "    clearError();editor.values.options.splice(index,1); redrawDynamic();", "    if(editLocks().locked&&originalOption(editor.values.options[index]))return error('已有引用的选项不可删除，可保留原项并新增选项');\n    clearError();editor.values.options.splice(index,1); redrawDynamic();")
    code = one(code, "['id','label','codeLabel','prefix','enabled','fields']", "['id','label','codeLabel','prefix','enabled','fields','importFields']")
    code = one(code, "      if(child.kind==='field'&&parent.kind==='category'&&!parent.values.fields.some(ref=>ref.fieldId===child.values.id)) parent.values.fields.push({fieldId:child.values.id,enabled:true,required:false});", "      if(child.kind==='field'&&parent.kind==='category'){const importing=usageOf(result.row||child.values)==='IMPORT',refs=importing?(parent.values.importFields ||= []):parent.values.fields;if(!refs.some(ref=>ref.fieldId===child.values.id))refs.push({fieldId:child.values.id,enabled:true,required:false});parent.fieldTab=importing?'IMPORT':'FOLLOWUP';}")
    code = code.replace('保存后，客服按此分类填写。', '保存后，导入与填写分别使用对应配置。')
    code = code.replace('保存后还需加入业务分类，客服才能填写。', '保存后还需加入业务分类，对应导入或填写配置才会生效。')
    code = one(code, 'window.BusinessConfiguration={render,', 'window.BusinessConfiguration={selectFieldTab,render,')
    return code
