"""Asserted, pure source transforms for brand-owned import/follow-up fields.

The caller owns the build and generated bundles.  Reading old definitions never
adds usage/brand metadata or migrates storage; only an explicit save writes it.
"""


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Field model source conflict: ' + before[:140])
    return code.replace(before, after, 1)


HELPERS = r"""
  // Missing usage is the existing follow-up contract, not a storage migration.
  function fieldUsage(field) { return field?.usage === 'IMPORT' ? 'IMPORT' : 'FOLLOWUP'; }
  function categoryFieldRefs(category) { return [...(category?.fields || []),...(category?.importFields || [])]; }
  function importMappingIssue(category, definitions) {
    if (!Object.hasOwn(category || {},'importFields')) return '';
    const fields = [{key:'name',label:'客户称呼',type:'text'},{key:'phone',label:'客户号码',type:'phone'},{key:'note',label:'联系备注',type:'text'}], targets = new Set();
    const byId = new Map((definitions || []).map(field=>[field.id,field]));
    for (const ref of category.importFields || []) {
      const field = byId.get(ref.fieldId);
      if (!field) return '分类导入字段定义不存在，请重新选择';
      if (ref.enabled === false || field.enabled === false) continue;
      const target = field.businessKey;
      if (fieldUsage(field)!=='IMPORT' || !target || ['__proto__','prototype','constructor','code'].includes(target) || targets.has(target)) return '导入字段“'+field.label+'”的业务编码缺失、重复或与保留字段冲突';
      targets.add(target);
      const index = fields.findIndex(item=>item.key===target && !item.fieldId);
      if (index>=0 && field.type!=='text' && !(target==='note' && field.type==='textarea')) return '映射系统客户称呼、号码或备注的导入字段须使用文本类型（备注可使用多行文本）：'+field.label;
      const column = {...field,key:index>=0?target:field.id,fieldId:field.id};
      if (index>=0) fields[index]=column; else fields.push(column);
    }
    // The batch UI inserts this immutable identity column alongside the schema.
    fields.push({key:'code',label:category.codeLabel || '业务编码'});
    const headers = new Map();
    for (let index=0;index<fields.length;index++) {
      const field=fields[index],tokens=[field.key,field.label,field.businessKey,field.fieldId].filter(value=>typeof value==='string' && value);
      for (const token of tokens) {
        if (headers.has(token) && headers.get(token)!==index) return '导入列标识“'+token+'”对应多个字段，请调整本分类的字段名称或业务编码';
        headers.set(token,index);
      }
    }
    return '';
  }
  function importSchema(categoryId, source = {}) {
    const data = catalog(source,canonicalType(categoryId));
    if (!data.ok) return {...data,fields:[]};
    const category = data.rows.find(row => row.id === canonicalType(categoryId));
    if (!category) return {...fail('业务分类不存在'),fields:[],scope:data.scope};
    const mappingIssue=importMappingIssue(category,data.fields);
    if (mappingIssue) return {...fail(mappingIssue),fields:[],scope:data.scope};
    const refs = category.importFields || [], definitions = new Map(data.fields.map(field => [field.id,field]));
    if (refs.length && (!data.scope?.brandId || data.legacy === true)) return {...fail('导入字段的品牌归属尚未明确，请先确认归属'),fields:[],scope:data.scope};
    const fields = [];
    for (const ref of refs) {
      const field = definitions.get(ref.fieldId);
      if (!field || fieldUsage(field) !== 'IMPORT' || field.type === 'interface' || !field.businessKey || field.brandId && field.brandId !== data.scope.brandId) return {...fail('分类导入字段的用途、品牌或编码待核'),fields:[],scope:data.scope};
      if (ref.enabled !== false && field.enabled !== false) fields.push({...clone(field),id:field.id,key:field.id,usage:'IMPORT',brandId:data.scope.brandId,enabled:true,required:ref.required === true});
    }
    return {ok:true,legacy:!Object.hasOwn(category,'importFields'),fields,category:clone(category),scope:clone(data.scope),version:Number(category.configurationVersion || 1),fieldsVersion:routingFieldsVersion(category,data.fields),revision:data.revision};
  }
  function fieldEditLocks(id, source = {}) {
    const data = catalog(source), row = data.fields?.find(field => field.id === id);
    if (!data.ok || !row) return {locked:true,known:false,refs:[],reason:data.message || '字段或所属范围无法可靠读取'};
    const refs = [];
    for (const category of data.rows) if (categoryFieldRefs(category).some(ref => ref.fieldId === id)) refs.push({kind:'configuration',source:'business-category',categoryId:category.id,categoryLabel:category.label,fieldId:id,message:'业务分类“'+category.label+'”引用此字段'});
    for (const field of data.fields) if (activeDependencies(field).includes(id)) refs.push({kind:'configuration',source:'field-dependency',fieldId:id,objectId:field.id,message:'字段“'+field.label+'”的接口查询引用此字段'});
    const review = usage('field',id,source);
    if (review.ok !== true) return {locked:true,known:false,refs:refs.concat(review.refs || []),reason:review.reason || review.message || '字段使用情况待核，身份与结构暂不可修改'};
    refs.push(...review.refs);
    return {locked:refs.length > 0,known:true,refs,reason:refs.length ? '此字段已有配置或业务引用，品牌、用途、编码、类型及已有选项标识不可修改' : ''};
  }
"""


def customer_business(code):
    code = one(code, '  function sourceBrand(source={}) {', HELPERS + '\n  function sourceBrand(source={}) {')
    code = one(code, "    if (!fieldTypes.includes(input.type)) return fail('请选择有效的字段类型');", """    if (!fieldTypes.includes(input.type)) return fail('请选择有效的字段类型');
    if (input.usage !== undefined && !['IMPORT','FOLLOWUP'].includes(input.usage)) return fail('请选择有效的字段用途');
    if (input.brandId !== undefined && input.brandId !== '' && !safeId(input.brandId)) return fail('字段品牌归属无效');
    if (fieldUsage(input) === 'IMPORT' && (!key || ['__proto__','prototype','constructor'].includes(key))) return fail('导入字段的业务编码必填，且不能使用保留键');
    if (fieldUsage(input) === 'IMPORT' && input.type === 'interface') return fail('导入字段来自文件，不支持接口取数类型');""")
    code = one(code, "return {ok:true,row:{id:input.id,label,type:input.type,businessKey:key,options,enabled:input.enabled !== false,...source,", "return {ok:true,row:{id:input.id,label,type:input.type,businessKey:key,options,enabled:input.enabled !== false,...(input.usage!==undefined?{usage:input.usage}:{}),...(input.brandId?{brandId:input.brandId}:{}),...source,")
    code = one(code, "        options.push({id,label:name,businessKey:externalKey});", "        if(raw.enabled!==undefined && typeof raw.enabled!=='boolean')return fail('选项启用状态无效');\n        options.push({id,label:name,businessKey:externalKey,...(raw.enabled!==undefined?{enabled:raw.enabled}:{})});")
    code = one(code, '    const preset = presetField(input.id);', "    const preset = presetField(input.id);\n    if(preset && options.some(option=>option.enabled===false))return fail('预置线索统计字段的选项不可停用');")

    code = one(code, '    const validBinding=binding=>', """    let importFields;
    if (input.importFields !== undefined) {
      if (!Array.isArray(input.importFields) || input.importFields.length > 30) return fail('每个业务分类最多配置 30 个导入字段');
      const importIds = new Set(); importFields = [];
      for (const item of input.importFields) {
        if (!object(item) || !safeId(item.fieldId) || importIds.has(item.fieldId)) return fail('分类导入字段无效或重复');
        const enabled = item.enabled !== false;
        importFields.push({fieldId:item.fieldId,enabled,required:enabled && item.required === true}); importIds.add(item.fieldId);
      }
    }
    const validBinding=binding=>""")
    code = one(code, 'enabled:input.enabled !== false,fields,configurationVersion:', 'enabled:input.enabled !== false,fields,...(importFields!==undefined?{importFields}:{}),configurationVersion:')

    code = one(code, 'fieldNames.has(field.label.toLocaleLowerCase()) || (field.businessKey && fieldKeys.has(field.businessKey))', "fieldNames.has(fieldUsage(field)+':'+field.label.toLocaleLowerCase()) || (field.businessKey && fieldKeys.has(fieldUsage(field)+':'+field.businessKey))")
    code = one(code, 'fields.add(field.id); fieldNames.add(field.label.toLocaleLowerCase()); if (field.businessKey) fieldKeys.add(field.businessKey);', "fields.add(field.id); fieldNames.add(fieldUsage(field)+':'+field.label.toLocaleLowerCase()); if (field.businessKey) fieldKeys.add(fieldUsage(field)+':'+field.businessKey);\n      if (field.brandId && field.brandId !== scope.brandId || fieldUsage(field)==='IMPORT' && !scope.brandId) return false;")
    code = one(code, 'category.fields.some(ref => !fields.has(ref.fieldId))', "categoryFieldRefs(category).some(ref => !fields.has(ref.fieldId)) || category.fields.some(ref=>fieldUsage(scope.fields.find(field=>field.id===ref.fieldId))!=='FOLLOWUP') || (category.importFields||[]).some(ref=>fieldUsage(scope.fields.find(field=>field.id===ref.fieldId))!=='IMPORT')")
    code = one(code, 'category.enabled && category.fields.some(ref => ref.enabled && !scope.fields.find(field => field.id === ref.fieldId)?.enabled)', 'category.enabled && categoryFieldRefs(category).some(ref => ref.enabled && !scope.fields.find(field => field.id === ref.fieldId)?.enabled)')
    code = one(code, '  function categoryConfigurationIssue(category, definitions, ignoreBindingCompatibility = false) {', '  function categoryConfigurationIssue(category, definitions, ignoreBindingCompatibility = false) {\n    const importIssue=importMappingIssue(category,definitions); if(importIssue)return importIssue;')

    # A call keeps its original schema.  New import references can coexist in the
    # captured catalog, while the rendered form still reads category.fields.
    code = one(code, "const key=field.businessKey || '',name=field.label.toLocaleLowerCase();if(!validBusinessKey(key)||names.has(name)||key&&keys.has(key))return false;", "const key=field.businessKey || '',name=fieldUsage(field)+':'+field.label.toLocaleLowerCase(),scopedKey=fieldUsage(field)+':'+key;if(!validBusinessKey(key)||names.has(name)||key&&keys.has(scopedKey)||field.usage!==undefined&&!['IMPORT','FOLLOWUP'].includes(field.usage)||fieldUsage(field)==='IMPORT'&&(!key||field.type==='interface'||['__proto__','prototype','constructor'].includes(key)))return false;")
    code = one(code, 'byId.set(field.id,field);names.add(name);if(key)keys.add(key);', 'byId.set(field.id,field);names.add(name);if(key)keys.add(scopedKey);')
    code = one(code, "option.businessKey!==undefined&&typeof option.businessKey!=='string')return false;", "option.businessKey!==undefined&&typeof option.businessKey!=='string'||option.enabled!==undefined&&typeof option.enabled!=='boolean')return false;")
    code = one(code, "category.fields.some(ref=>!byId.has(ref.fieldId)||typeof ref.enabled!=='boolean'||typeof ref.required!=='boolean')", "categoryFieldRefs(category).some(ref=>!byId.has(ref.fieldId)||typeof ref.enabled!=='boolean'||typeof ref.required!=='boolean') || category.fields.some(ref=>fieldUsage(byId.get(ref.fieldId))!=='FOLLOWUP') || (category.importFields||[]).some(ref=>fieldUsage(byId.get(ref.fieldId))!=='IMPORT')")
    code = one(code, 'used=new Set(archive.row.fields.map(ref=>ref.fieldId))', 'used=new Set(categoryFieldRefs(archive.row).map(ref=>ref.fieldId))')
    code = one(code, 'return definition?.enabled ? {...definition,required:ref.required,enabled:true} : null;', "return definition?.enabled && fieldUsage(definition)==='FOLLOWUP' ? {...definition,required:ref.required,enabled:true} : null;")

    # Existing callers that save only a follow-up form do not erase the other tab.
    code = one(code, "      if (row.fields.some(ref => !target.fields.some(field => field.id === ref.fieldId))) return fail('业务分类引用了不存在的字段，请重新选择');", """      const priorCategory = target.types.find(item => item.id === row.id);
      if (input.importFields === undefined && priorCategory?.importFields !== undefined) row.importFields = clone(priorCategory.importFields);
      if (categoryFieldRefs(row).some(ref => !target.fields.some(field => field.id === ref.fieldId))) return fail('业务分类引用了不存在的字段，请重新选择');
      if (row.fields.some(ref=>fieldUsage(target.fields.find(field=>field.id===ref.fieldId))!=='FOLLOWUP')) return fail('填写字段页签只能选择填写用途的字段');
      if ((row.importFields||[]).some(ref=>fieldUsage(target.fields.find(field=>field.id===ref.fieldId))!=='IMPORT')) return fail('导入字段页签只能选择导入用途的字段');
      if ((row.importFields||[]).length && !target.brandId) return fail('导入字段的品牌归属尚未明确，不能加入分类');""")
    code = one(code, '      const dependencyError = categoryDependencyError(row,target.fields);', '      const importIssue=importMappingIssue(row,target.fields); if(importIssue)return fail(importIssue);\n      const dependencyError = categoryDependencyError(row,target.fields);')
    code = one(code, "row.enabled && row.fields.some(ref => ref.enabled && !target.fields.find(field => field.id === ref.fieldId)?.enabled)", "row.enabled && categoryFieldRefs(row).some(ref => ref.enabled && !target.fields.find(field => field.id === ref.fieldId)?.enabled)")

    code = one(code, 'JSON.stringify((previous.fields||[]).map(ref=>originalFields.find(field=>field.id===ref.fieldId)||null))!==JSON.stringify((row.fields||[]).map(ref=>target.fields.find(field=>field.id===ref.fieldId)||null))', 'JSON.stringify(categoryFieldRefs(previous).map(ref=>originalFields.find(field=>field.id===ref.fieldId)||null))!==JSON.stringify(categoryFieldRefs(row).map(ref=>target.fields.find(field=>field.id===ref.fieldId)||null))')
    code = one(code, 'const body=JSON.stringify({refs:row.fields,fields:definitions.filter(f=>row.fields.some(ref=>ref.fieldId===f.id))});', "const body=JSON.stringify({refs:row.fields,fields:definitions.filter(f=>categoryFieldRefs(row).some(ref=>ref.fieldId===f.id)),...(row.importFields!==undefined?{importRefs:row.importFields}:{})});")

    code = one(code, "      const previous = target.fields.find(item => item.id === row.id);", """      const previous = target.fields.find(item => item.id === row.id);
      const owningBrand = target.brandId || '';
      if (row.brandId && row.brandId !== owningBrand) return fail('字段品牌与当前字段库不一致，请在准确品牌内维护');
      if (fieldUsage(row)==='IMPORT' && (!owningBrand || source.legacy===true)) return fail('请先进入明确品牌的字段库，再新增或维护导入字段');
      row.usage = fieldUsage(row);
      if (owningBrand) row.brandId = owningBrand;
      if (previous) {
        const locks = fieldEditLocks(row.id,source);
        if (locks.locked) {
          if (fieldUsage(previous)!==row.usage || (previous.brandId||owningBrand)!==(row.brandId||'') || previous.businessKey!==row.businessKey || previous.type!==row.type) return fail(locks.reason || '字段已有引用，品牌、用途、编码和类型不能修改');
          if ((previous.options||[]).some(option=>!row.options.some(next=>next.id===option.id && next.businessKey===option.businessKey))) return fail('字段已有配置或业务引用，不能删除已有选项或修改其标识及业务编码；请查看字段使用位置');
        }
      }""")
    code = one(code, "target.fields.some(item => item.id !== row.id && item.label.toLocaleLowerCase() === row.label.toLocaleLowerCase())", "target.fields.some(item => item.id !== row.id && fieldUsage(item)===fieldUsage(row) && item.label.toLocaleLowerCase() === row.label.toLocaleLowerCase())")
    code = one(code, "return fail('本租户已有同名字段，请修改名称');", "return fail('当前品牌或原租户目录的同用途字段中已有同名字段，请修改名称');")
    code = one(code, "target.fields.some(item => item.id !== row.id && item.businessKey === row.businessKey)", "target.fields.some(item => item.id !== row.id && fieldUsage(item)===fieldUsage(row) && item.businessKey === row.businessKey)")
    code = one(code, "return fail('本租户已有相同的业务字段编码');", "return fail('当前品牌或原租户目录的同用途字段中已有相同业务编码');")
    code = one(code, 'target.types.some(category => category.enabled && category.fields.some(ref => ref.fieldId === row.id && ref.enabled))', 'target.types.some(category => category.enabled && categoryFieldRefs(category).some(ref => ref.fieldId === row.id && ref.enabled))')
    code = one(code, 'target.types.filter(category => category.fields.some(ref => ref.enabled !== false && affectedIds.has(ref.fieldId)))', 'target.types.filter(category => categoryFieldRefs(category).some(ref => ref.enabled !== false && affectedIds.has(ref.fieldId)))')
    # Keep interface dependencies inside the form namespace.
    code = one(code, "const linked = target.fields.find(field => field.id === activeDependencies(row)[0]);", "const linked = target.fields.find(field => field.id === activeDependencies(row)[0]);\n        if (linked && fieldUsage(linked)!=='FOLLOWUP') return fail('接口查询条件只能关联填写用途的字段');")

    code = one(code, "    if(!canManageBrand(sourceBrand(source)))return denied('当前账号无权维护此租户的业务配置');", "    const legacy=source.legacy===true||!sourceBrand(source);\n    if(legacy?!(canManage()&&allowed(scopeOf(source))):!canManageBrand(sourceBrand(source)))return denied('当前账号无权维护此租户的业务配置');")
    code = one(code, "const result=guard.inspect({kind,id,scope:scopeOf(source)})", "const result=guard.inspect({kind,id,scope:{...scopeOf(source),...(!legacy?{brandId:sourceBrand(source)}:{})}})")
    code = one(code, 'target.types.some(row=>row.fields.some(ref=>ref.fieldId===id))', 'target.types.some(row=>categoryFieldRefs(row).some(ref=>ref.fieldId===id))')
    code = one(code, 'const row=rows[index],ids=new Set(row.fields.map(ref=>ref.fieldId))', 'const row=rows[index],ids=new Set(categoryFieldRefs(row).map(ref=>ref.fieldId))')
    code = one(code, 'root.CustomerBusiness = Object.freeze({', 'root.CustomerBusiness = Object.freeze({fieldUsage,categoryFieldRefs,importMappingIssue,importSchema,fieldEditLocks,')
    return code


def configuration_usage(code):
    # All field references now block deletion, including fixed historical
    # schemas.  The existing category/interface deletion policies stay intact.
    code = one(code, "const ref={...scopeOf(where),...detail,...(subject==='category'||retainedField?{blocking:false}:{})};", "const ref={...scopeOf(where),...detail,...(subject==='category'?{blocking:false}:subject==='field'?{blocking:true}:{})};")
    code = one(code, "bundle.types.filter(row=>Array.isArray(row?.fields)&&row.fields.some(ref=>ref?.fieldId===field.id))", "bundle.types.filter(row=>model.categoryFieldRefs(row).some(ref=>ref?.fieldId===field.id))")
    code = one(code, "for(const ref of row.fields){", "for(const ref of model.categoryFieldRefs(row)){")
    code = one(code, "needed=new Set(target.fields.map(ref=>ref.fieldId))", "needed=new Set(model.categoryFieldRefs(target).map(ref=>ref.fieldId))")
    code = one(code, "for(const template of unified?.templates||[]){", "for(const template of [...(unified?.templates||[]),...(unified?.templateSnapshots||[])]){")
    marker = "          if(version.routingPolicy!=='FIRST_MATCH_V1')continue;"
    code = one(code, marker, """          const fieldRefs = new Set();
          for (const field of version.routingCatalog?.fields || []) if (typeof field.id==='string') fieldRefs.add(field.id);
          for (const edge of version.edges || []) for (const rule of edge.conditions?.rules || []) if (['IMPORT','FOLLOWUP'].includes(rule.source) && typeof rule.fieldId==='string') fieldRefs.add(rule.fieldId);
          for (const fieldId of fieldRefs) add('field',fieldId,owner.scope,{kind:'configuration',source:'conditional-template-field',sourceLabel:'流转模板字段快照',objectId:template.templateId,version:version.version,fieldId,reasonCode:'version-'+version.version,blocking:true,message:'流转模板 '+(version.name||template.templateId)+' V'+version.version+' 引用此字段'});
""" + marker)
    code = one(code, "for(const field of record.categorySnapshot?.followupFields||[])", "for(const field of [...(record.categorySnapshot?.followupFields||[]),...(record.categorySnapshot?.fields||[]),...(record.categorySnapshot?.importFields||[])].map(field=>({...field,id:field.id||field.fieldId||field.key})))")
    code = one(code, "if(segment.result?.values)values(segment.result.values,origin,", "for(const field of segment.formSchema?.fields||[]) if(typeof field.id==='string')add('field',field.id,origin,{kind:'saved_business',source:'business-flow-form',sourceLabel:'原执行段字段快照',objectId:segment.segmentId,fieldId:field.id,blocking:true,message:'原执行段保留此字段的固定表单快照'});if(segment.result?.values)values(segment.result.values,origin,")
    # A completed call still owns its captured definitions even when no value
    # was entered.  Validate the original owner/integrity before inspecting it;
    # the active-form branch below retains its original draft semantics.
    version_source = "      const versionSource=Object.hasOwn(row,'businessFormVersion')?chosen:list.find(item=>Object.hasOwn(item.row,'businessFormVersion')&&phoneOf(item.row)===phoneOf(row)&&text(item.row.accountId)===text(row.accountId));\n      const bound=versionSource?frame(versionSource.row,versionSource.sourceLabel):null;"
    code = one(code, version_source, '')
    code = one(code, "      const active=!completed&&", version_source + """
      if (bound) {
        const captured = [...bound.fields,...Object.values(bound.repairs).flatMap(repair=>repair.fields)];
        for (const field of captured) add('field',field.id,where,{...detail,kind:'saved_business',sourceLabel:'通话固定字段定义',fieldId:field.id,snapshotRetained:true,blocking:true,message:'此通话保留字段“'+(field.label||field.id)+'”的固定定义，当前字段不能删除'});
      }
      if (row.businessImportSnapshot !== undefined) {
        const imported=row.businessImportSnapshot;
        if (!object(imported) || imported.schema!==1 || !Array.isArray(imported.fields) || !object(imported.values)) issue('通话原始导入快照');
        else for (const field of imported.fields) {
          if (!object(field) || typeof (field.fieldId||field.id||field.key)!=='string') {issue('通话原始导入快照');continue;}
          const fieldId=field.fieldId||field.id||field.key;
          add('field',fieldId,where,{...detail,kind:'saved_business',sourceLabel:'通话原始导入快照',fieldId,snapshotRetained:true,blocking:true,message:'此通话保留原始导入字段“'+(field.label||fieldId)+'”的固定定义，当前字段不能删除'});
        }
      }
      const active=!completed&&""")
    # Every message shown by the existing reference panel must describe the new
    # deletion policy, even for references that were formerly snapshot-only.
    code = code.replace('保留独立字段快照，不影响删除当前字段', '保留此字段的独立快照，当前字段不能删除')
    code = code.replace('保留独立查询依赖快照，不影响删除当前字段', '保留此字段的查询依赖快照，当前字段不能删除')
    code = code.replace('保留开始时的独立字段快照，不影响删除当前字段', '保留开始时的独立字段快照，当前字段不能删除')
    old = "if(kind==='field'&&result.refs.length)return {...result,canDelete:true,code:'SNAPSHOT_ONLY',impactCount:result.refs.length,reason:'当前仅有通话快照或保留定义。可删除当前字段，已保存通话、当前通话及话后填写继续使用各自快照。'};"
    new = "if(kind==='field'&&result.refs.length)return {...result,canDelete:false,code:'IN_USE',impactCount:result.refs.length,reason:'此字段仍有配置或历史业务引用，不能删除；请查看使用位置。'};"
    code = one(code, old, new)
    return code


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'js/components/customer-business.js':
        return customer_business(code)
    if path == 'js/components/business-configuration-usage.js':
        return configuration_usage(code)
    return code
