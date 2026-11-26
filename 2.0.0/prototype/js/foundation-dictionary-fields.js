/* Extend the 2.1 field library without changing the shared 2.0 prototype. */
(() => {
  'use strict';

  function adapt(html) {
    const replace = (before, after) => {
      const at = html.indexOf(before);
      if (at < 0 || html.indexOf(before, at + before.length) >= 0) {
        throw new Error('基础数据字典字段的配置位置无法确定：' + before.trim().slice(0,80));
      }
      html = html.slice(0, at) + after + html.slice(at + before.length);
    };

    replace('  function normalizeField(input) {', `  function foundationDictionary(brandId) {
    return root.parent?.DReview21FoundationDictionary?.read(brandId) || null;
  }

  function foundationOptions(field, brandId, snapshot) {
    const dictionary = foundationDictionary(brandId || field.brandId);
    const items = dictionary?.items[field.foundationDictionaryCode] || [];
    const options = new Map([...items].sort((a,b) => a.order-b.order).map(item => [
      item.code,{id:item.code,label:item.name,businessKey:item.code,enabled:item.status==='启用'}
    ]));
    const saved = snapshot?.fields?.find(row => row.fieldId===field.id)?.selectedOptions || [];
    for (const option of [...saved.map(row => ({
      id:row.optionId,label:row.optionName,businessKey:row.businessOptionCode
    })),...(field.options || [])]) {
      if (!options.has(option.id)) options.set(option.id,{...option,enabled:false});
    }
    return [...options.values()];
  }

  function normalizeField(input) {`);
    replace('    let options = [];\n    if ([\'select\',\'multiselect\'].includes(input.type)) {',
      `    const dictionaryCode = input.foundationDictionaryCode;
    if (dictionaryCode==='') return fail('请选择基础数据字典类别');
    if (dictionaryCode !== undefined && (!safeId(dictionaryCode) || fieldUsage(input)!=='FOLLOWUP' ||
        !['select','multiselect'].includes(input.type) || presetField(input.id))) return fail('请选择有效的基础数据字典及选择方式');
    let options = [];
    if (['select','multiselect'].includes(input.type)) {`);
    replace("if (!Array.isArray(input.options) || !input.options.length || input.options.length > 50) return fail('选择字段需配置 1 至 50 个选项');",
      "if (!Array.isArray(input.options) || (!dictionaryCode && (!input.options.length || input.options.length > 50))) return fail('选择字段需配置 1 至 50 个选项');");
    replace("if (!name || name.length > 80 || labels.has(name.toLocaleLowerCase())) return fail('选项名称必填，且同一字段内不能重复');",
      "if (!name || (!dictionaryCode && (name.length > 80 || labels.has(name.toLocaleLowerCase())))) return fail('选项名称必填，且同一字段内不能重复');");
    replace("...source,...(isMappingSeriesField(input)?{intentProfileRole:'mapping-series'}:{})",
      "...source,...(dictionaryCode?{foundationDictionaryCode:dictionaryCode}:{}),...(isMappingSeriesField(input)?{intentProfileRole:'mapping-series'}:{})");
    replace('      if (owningBrand) row.brandId = owningBrand;\n      if (previous) {', `      if (owningBrand) row.brandId = owningBrand;
      if (row.foundationDictionaryCode) {
        const dictionary = foundationDictionary(owningBrand);
        if (!dictionary?.types.some(type => type.code===row.foundationDictionaryCode)) return fail('请选择当前品牌的基础数据字典');
        const sameDictionary = previous?.foundationDictionaryCode===row.foundationDictionaryCode;
        const current = normalizeField({...row,options:foundationOptions({...row,options:sameDictionary?previous.options:[]})});
        if (!current.ok) return current;
        row.options = current.row.options;
      }
      if (previous) {`);
    replace('previous.businessKey!==row.businessKey || previous.type!==row.type)',
      'previous.businessKey!==row.businessKey || previous.type!==row.type || previous.foundationDictionaryCode!==row.foundationDictionaryCode)');
    replace("return definition?.enabled && fieldUsage(definition)==='FOLLOWUP' ? {...definition,required:ref.required,enabled:true} : null;",
      `if (!definition?.enabled || fieldUsage(definition)!=='FOLLOWUP') return null;
      const options = definition.foundationDictionaryCode ?
        foundationOptions(definition,definition.brandId,source.customerFollowup?.businessFieldSnapshot) : definition.options;
      return {...definition,options,required:ref.required,enabled:true};`);
    replace('  root.CustomerBusiness = Object.freeze({',
      '  root.CustomerBusiness = Object.freeze({foundationDictionary,foundationOptions,');

    replace("const typeLabel = field => field?.type==='interface'?",
      "const typeLabel = field => field?.foundationDictionaryCode?'引用基础数据字典（'+(field.type==='multiselect'?'多选':'单选')+'）':field?.type==='interface'?");
    replace('  function control(field) {\n    if(field.type===\'interface\') {', `  function control(field) {
    if (Object.hasOwn(field,'foundationDictionaryCode')) {
      const options = model.foundationOptions(field,editor.scope.brandId).filter(option=>option.enabled);
      if (!options.length) return '<small>'+ (field.foundationDictionaryCode?'当前字典暂无可选项':'请先选择字典类别') +'</small>';
      field = {...field,options};
    }
    if(field.type==='interface') {`);
    replace('  function fieldEditor() {', String.raw`  function dictionaryFieldEditor(value, locked) {
    const dictionary = model.foundationDictionary(editor.scope.brandId);
    const types = dictionary?.types || [];
    const choices = types.map(type => '<option value="'+esc(type.code)+'" '+
      (type.code===value.foundationDictionaryCode?'selected':'')+'>'+esc(type.name)+'</option>').join('');
    const disabled = locked||!dictionary?'disabled':'';
    return '<div class="business-category-basics">'+
      '<label class="field"><span>字典类别 <b class="business-required">*</b></span>'+
      '<select id="business-foundation-dictionary" '+disabled+' onchange="BusinessConfiguration.setBasic(\'foundationDictionaryCode\',this.value)">'+
      '<option value="">请选择字典类别</option>'+choices+'</select>'+
      '<small>'+(dictionary?'选项由基础数据字典统一维护。':'当前品牌的基础数据字典暂不可用。')+'</small></label>'+
      '<label class="field"><span>选择方式 <b class="business-required">*</b></span>'+
      '<select id="business-foundation-mode" '+disabled+' onchange="BusinessConfiguration.setBasic(\'foundationDictionaryMode\',this.value)">'+
      '<option value="select">单选</option><option value="multiselect" '+(value.type==='multiselect'?'selected':'')+'>多选</option></select></label></div>';
  }
  function fieldEditor() {`);
    replace("legacy=editor.scope.legacy||!editor.scope.brandId;\n    return \`\${stepHeading(1,mapping",
      "legacy=editor.scope.legacy||!editor.scope.brandId;\n    const dictionaryField=Object.hasOwn(value,'foundationDictionaryCode'), canReference=!importing&&!legacy&&!protectedField&&!mapping&&Boolean(model.foundationDictionary(editor.scope.brandId));\n    return \`\${stepHeading(1,mapping");
    replace("(value.type==='interface'?'interface-'+model.selectionMode(value):value.type)===key?'selected':''",
      "!dictionaryField&&(value.type==='interface'?'interface-'+model.selectionMode(value):value.type)===key?'selected':''");
    replace(".join('')}</select></label></div><label class=\"field\"><span>业务编码",
      ".join('')}\${canReference||dictionaryField?'<option value=\"foundation-dictionary\" '+(dictionaryField?'selected':'')+'>引用基础数据字典</option>':''}</select></label></div><label class=\"field\"><span>业务编码");
    replace("${choice?\`<div class=\"business-fields-heading\"><h3>选项配置",
      "${dictionaryField?dictionaryFieldEditor(value,locks.locked):choice?\`<div class=\"business-fields-heading\"><h3>选项配置");
    replace("field:['label','type','businessKey','usage']",
      "field:['label','type','businessKey','usage','foundationDictionaryCode','foundationDictionaryMode']");
    replace("['type','businessKey','usage'].includes(key)&&editLocks().locked",
      "['type','businessKey','usage','foundationDictionaryCode','foundationDictionaryMode'].includes(key)&&editLocks().locked");
    replace("    if(editor.kind==='field'&&key==='usage') {", `    if (editor.kind==='field' && ['foundationDictionaryCode','foundationDictionaryMode'].includes(key)) {
      const field = editor.values;
      if (!Object.hasOwn(field,'foundationDictionaryCode')) return;
      if (key==='foundationDictionaryCode') {
        const dictionary = model.foundationDictionary(editor.scope.brandId);
        if (value && !dictionary?.types.some(type=>type.code===value)) return error('请选择当前品牌的基础数据字典');
        field.foundationDictionaryCode = value;
        field.options = [];
      } else {
        if (!['select','multiselect'].includes(value)) return;
        field.type = value;
      }
      draw();return;
    }
    if(editor.kind==='field'&&key==='usage') {`);
    replace("      if(value==='IMPORT'&&editor.values.type==='interface')",
      "      if(value==='IMPORT'&&Object.hasOwn(editor.values,'foundationDictionaryCode')) {draw();return error('字典引用用于填写字段，请先更换字段类型');}\n      if(value==='IMPORT'&&editor.values.type==='interface')");
    replace("      const next=mode?'interface':value;",
      `      const toDictionary=value==='foundation-dictionary', fromDictionary=Object.hasOwn(editor.values,'foundationDictionaryCode');
      if (toDictionary && (usageOf(editor.values)==='IMPORT' || editor.scope.legacy || !model.foundationDictionary(editor.scope.brandId))) {
        draw();return error('请选择当前品牌的填写字段');
      }
      const next=toDictionary?'select':mode?'interface':value;`);
    replace("      if(['select','multiselect'].includes(next)&&!editor.values.options.length)",
      `      if (toDictionary || fromDictionary) editor.values.options = [];
      if (toDictionary) {editor.values.foundationDictionaryCode='';draw();return;}
      if (fromDictionary) delete editor.values.foundationDictionaryCode;
      if(['select','multiselect'].includes(next)&&!editor.values.options.length)`);

    replace("    const id = prefix + '-' + field.id, invoke = handler +",
      `    if (field.foundationDictionaryCode) {
      const selected = Array.isArray(value)?value:[value];
      const options = field.options.filter(option=>option.enabled!==false||selected.includes(option.id));
      if (!options.length) return '<small>当前字典暂无可选项</small>';
      field = {...field,options};
    }
    const id = prefix + '-' + field.id, invoke = handler +`);
    // In-use ordinary follow-up choices may switch cardinality without
    // reinterpreting option IDs, codes, saved snapshots or import mappings.
    replace('  function normalizeField(input) {', `  function canEditReferencedChoiceType(field, locks) {
    const semantic = field && (root.parent?.DReview21DccFollowupFields?.fieldKey?.(field) || field.businessKey);
    // Outcome, rating and contact-status readers still consume a single value.
    const scalar = ['visitResult','intentLevel','leadStatus','contactStatus'].includes(semantic);
    return !!(field && locks?.locked && locks.known && !scalar &&
      fieldUsage(field)==='FOLLOWUP' && ['select','multiselect'].includes(field.type) &&
      !field.foundationDictionaryCode && !presetField(field.id) &&
      !locks.refs.some(ref=>ref.source==='field-dependency'));
  }

  function normalizeField(input) {`);
    replace('root.CustomerBusiness = Object.freeze({foundationDictionary,foundationOptions,',
      'root.CustomerBusiness = Object.freeze({foundationDictionary,foundationOptions,canEditReferencedChoiceType,');
    replace('previous.businessKey!==row.businessKey || previous.type!==row.type || previous.foundationDictionaryCode!==row.foundationDictionaryCode)',
      "previous.businessKey!==row.businessKey || (previous.type!==row.type && !(canEditReferencedChoiceType(previous,locks) && ['select','multiselect'].includes(row.type))) || previous.foundationDictionaryCode!==row.foundationDictionaryCode)");
    replace("const dictionaryField=Object.hasOwn(value,'foundationDictionaryCode'),",
      "const compatibleTypeEdit=model.canEditReferencedChoiceType(value,locks);\n    const dictionaryField=Object.hasOwn(value,'foundationDictionaryCode'),");
    replace("canReference=!importing&&!legacy&&!protectedField&&!mapping",
      "canReference=!locks.locked&&!importing&&!legacy&&!protectedField&&!mapping");
    replace("${protectedField||locks.locked?'disabled':''} onchange=\"BusinessConfiguration.setBasic('type',this.value)\"",
      "${protectedField||locks.locked&&!compatibleTypeEdit?'disabled':''} onchange=\"BusinessConfiguration.setBasic('type',this.value)\"");
    replace("(!mapping||key.startsWith('interface-'))&&(!importing||!key.startsWith('interface-'))",
      "(!compatibleTypeEdit||['select','multiselect'].includes(key))&&(!mapping||key.startsWith('interface-'))&&(!importing||!key.startsWith('interface-'))");
    replace("esc(locks.reason||'已有引用：品牌、用途、业务编码、类型和已有选项标识不可修改。')",
      "esc(compatibleTypeEdit?'已有引用：类型可在单选和多选间切换，仅影响后续填写；品牌、用途、业务编码和已有选项标识保持不变。':locks.reason||'已有引用：品牌、用途、业务编码、类型和已有选项标识不可修改。')");
    replace("['type','businessKey','usage','foundationDictionaryCode','foundationDictionaryMode'].includes(key)&&editLocks().locked",
      "['type','businessKey','usage','foundationDictionaryCode','foundationDictionaryMode'].includes(key)&&editLocks().locked&&!(key==='type'&&model.canEditReferencedChoiceType(editor.initialValues,editLocks())&&['select','multiselect'].includes(value))");
    return html;
  }

  window.DReview21FoundationFields = {adapt};
})();
