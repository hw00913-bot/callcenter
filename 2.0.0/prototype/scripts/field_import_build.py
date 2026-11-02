"""Category import-field integration; old snapshots and headerless legacy input stay intact."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def one(code, old, new):
    if code.count(old) != 1:
        raise ValueError('Configured import source conflict: ' + old[:110])
    return code.replace(old, new, 1)


def function(code, name, next_name, replacement):
    start = code.index('  function ' + name + '(')
    end = code.index('  function ' + next_name + '(', start + 1)
    return code[:start] + replacement + '\n' + code[end:]


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'js/components/business-flow-store.js':
        code = function(code, 'importSchema', 'singleRouteBinding',
                        (ROOT / 'scripts/field-import-store.js').read_text())
        code = one(code, 'schema=importSchema(),version=Number(c.configurationVersion||1)',
                   'schemaState=projectedImportSchema(id,c.id,cfg),schema=schemaState.fields,version=Number(c.configurationVersion||1)')
        code = one(code, '        out.push({categoryId:canonicalCategory(c.id)',
                   "        if(schemaState.issue){routeStatus.ready=false;routeStatus.routeState='REVIEW_REQUIRED';routeStatus.issues=[...(routeStatus.issues||[]),schemaState.issue];}\n        out.push({categoryId:canonicalCategory(c.id)")
        code = function(code, 'validateFields', 'preview', r'''  function validateFields(cfg,fields){
    for(const f of cfg.fields){
      const x=fields[f.key],empty=x===undefined||x===null||typeof x==='string'&&!x.trim()||Array.isArray(x)&&!x.length;
      if(f.required&&empty)return f.label+'必填';if(empty)continue;
      if(['text','textarea'].includes(f.type)&&typeof x!=='string')return f.label+'须为文本';
      if(f.type==='phone'&&!contactNumberValid(x))return f.label+'须为有效联系电话';
      if(['number','date','datetime','multiselect'].includes(f.type)&&!DFlowRouting.normalizeSavedField(x,f.type,'Asia/Shanghai').ok)return f.label+'与字段类型不符';
      if(['select','multiselect'].includes(f.type)){
        const values=Array.isArray(x)?x:[x],available=(f.options||[]).filter(o=>o?.enabled!==false).map(o=>typeof o==='object'?o.id:o);
        if(values.some(value=>!available.includes(value)))return f.label+'不在可用选项中';
      }
    }return '';
  }''')
        code = one(code, "fields=clone(row.fields||{}),bad=code?validateFields(config,fields):config.codeLabel+'必填'",
                   "mapped=normalizeImportFields(config,row.fields||{}),fields=mapped.fields,bad=mapped.error||(code?validateFields(config,fields):config.codeLabel+'必填')")
        code = one(code, "callSource:'BUSINESS_FLOW_MOCK',tenantId:seg.tenantId",
                   "callSource:'BUSINESS_FLOW_MOCK',...(Object.hasOwn(r.categorySnapshot.categoryDefinition||{},'importFields')?{businessImportSnapshot:{schema:1,fields:clone(r.categorySnapshot.fields),values:clone(r.fields)}}:{}),tenantId:seg.tenantId")
    if path == 'js/components/customer-business.js':
        code = one(code, '  function importedDetail(source = {}) {', r'''  function importedDetail(source = {}) {
    if(source.businessImportSnapshot?.schema===1&&Array.isArray(source.businessImportSnapshot.fields)){
      const esc=root.PlatformUI.escape,snapshot=source.businessImportSnapshot;
      return '<dl class="customer-followup-details" data-imported-customer-info>'+snapshot.fields.map(field=>{
        const raw=snapshot.values?.[field.key],empty=raw===undefined||raw===null||raw===''||Array.isArray(raw)&&!raw.length;
        const label=value=>(field.options||[]).find(o=>o.id===value)?.label||String(value);
        const value=empty?'未提供':Array.isArray(raw)?raw.map(label).join('、'):label(raw);
        return '<div><dt>'+esc(field.label+(field.fieldId?'〔导入〕':''))+'</dt><dd'+(empty?' class="is-empty"':'')+'>'+esc(value)+'</dd></div>';
      }).join('')+'</dl>';
    }''')
    if path == 'js/pages/customer-tasks.js':
        code = function(code, 'prepareTemplateImport', 'previewTemplateImport', r'''  function prepareTemplateImport(){
    const categoryId=document.getElementById('customer-import-business-type')?.value,meta=importCategoryMeta(),name=document.getElementById('customer-batch-name')?.value.trim(),text=document.getElementById('customer-import-text')?.value||'';
    if(!meta)throw Error('请选择业务类型');if(!name||name.length>50)throw Error('请填写50字以内的批次名称');
    const columns=templateImportColumns(),parsed=dMappedImportRows(text,columns),rows=parsed.rows.map(row=>{
      const fields={};for(const c of columns)if(c.key!=='code'&&Object.hasOwn(row,c.key))fields[c.key]=row[c.key];
      return {code:row.code||'',fields};
    });
    const errors=parsed.rows.flatMap(row=>row._schemaErrors||[]);if(errors.length)throw Error(errors.slice(0,8).join('；'));
    return {categoryId,categoryVersion:meta.version,name,source:'按分类导入',rows};
  }''')
        code = one(code, "<div id=\"customer-import-schema\"></div>",
                   "<div id=\"customer-import-schema\"></div><button type=\"button\" class=\"btn\" onclick=\"CustomerTasks.configureImportMapping()\">配置导入列映射</button><div id=\"customer-field-mapping\"></div>")
        code = one(code, '  window.CustomerTasks={',
                   (ROOT / 'scripts/field-import-ui.js').read_text() + '\n  window.CustomerTasks={configureImportMapping:dConfigureImportMapping,changeImportMapping:dChangeImportMapping,')
        # Sample data follows the configured target code rather than inventing field-ID columns.
        code = one(code, "r[c.key]??''", "dImportSampleValue(c,r)")
        code = code.replace("c.type==='phone'?'手机号或带区号固定电话':", "c.businessKey?'映射业务字段：'+c.businessKey+'；'+DImportFiles.describe(c):c.type==='phone'?'手机号或带区号固定电话':")
    if path == 'js/pages/flow-configuration.js':
        code = one(code, "IMPORT:'分类导入字段',FOLLOWUP:'分类培育字段'",
                   "IMPORT:'导入字段',FOLLOWUP:'填写字段'")
        code = code.replace('培育字段','填写字段')
    if path == 'js/components/customer-followup.js':
        code = one(code, 'field.options.some(option => optionId(option) === item)',
                   "field.options.some(option => optionId(option) === item && (option.enabled!==false || (Array.isArray(previous[field.id])?previous[field.id]:[previous[field.id]]).includes(item)))")
        code = one(code, "(selected.includes(optionId(option)) ? ' checked' : '') + ' onchange=",
                   "(selected.includes(optionId(option)) ? ' checked' : '') + (option.enabled===false&&!selected.includes(optionId(option))?' disabled':'') + ' onchange=")
        code = one(code, "esc(optionLabel(option)) + '</label>'",
                   "esc(optionLabel(option)+(option.enabled===false?'（已停用）':'')) + '</label>'")
        code = one(code, "(value === optionId(option) ? ' selected' : '') + '>' + esc(optionText(field,option))",
                   "(value === optionId(option) ? ' selected' : '') + (option.enabled===false?' disabled':'') + '>' + esc(optionText(field,option)+(option.enabled===false?'（已停用）':''))")
    if path == 'js/pages/business-flow.js':
        code = code.replace('e(field.label)', "e(field.label+(field.fieldId?'〔导入〕':''))")
        code = one(code, '  function detailFacts(row) {', r'''  function importValueLabel(field,value){
    if(value===undefined||value===null||value===''||Array.isArray(value)&&!value.length)return '—';
    const label=item=>(field.options||[]).find(option=>option.id===item)?.label||String(item);
    return Array.isArray(value)?value.map(label).join('、'):label(value);
  }
  function detailFacts(row) {''')
        code = code.replace("e(row.fields?.[field.key] ?? '—')", "e(importValueLabel(field,row.fields?.[field.key]))")
    return code
