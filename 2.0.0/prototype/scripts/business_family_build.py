"""Explicit category business family, with immutable referenced identities.

Only generated current modules change. Reads never migrate a saved category.
"""


def one(code, old, new):
    if code.count(old) != 1:
        raise ValueError('Business-family source conflict: ' + old[:140])
    return code.replace(old, new, 1)


MODEL_HELPERS = r'''
  function businessFamily(category) {
    if (['lead','lxs'].includes(canonicalType(category?.id))) return 'LEAD';
    return category?.businessFamily === 'LEAD' || category?.family === 'LEAD' ? 'LEAD' : 'ORDINARY';
  }
  function businessFamilyLocks(id, source = {}) {
    const data=catalog(source),row=data.rows?.find(item=>item.id===canonicalType(id));
    if(!data.ok)return {locked:true,known:false,reason:data.message||'业务域使用情况暂无法核对'};
    if(!row)return {locked:false,known:true,reason:''};
    if(['lead','lxs'].includes(canonicalType(id)))return {locked:true,known:true,reason:'预置新线索和冷线索固定属于统一线索业务域'};
    const review=usage('category',id,source);
    if(!review.ok)return {locked:true,known:false,reason:review.message||'分类引用暂无法核对，请保留原业务域'};
    return {locked:review.canDelete===false||(review.refs||[]).length>0,known:true,reason:review.canDelete===false||(review.refs||[]).length?'分类已有流程、业务或历史引用，业务域不可修改；请新建分类':''};
  }
'''


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'js/components/customer-business.js':
        code=one(code,'  function normalize(input) {',MODEL_HELPERS+'\n  function normalize(input) {')
        code=one(code,"    const label = text(input.label).trim(), codeLabel = text(input.codeLabel).trim();", """    if(input.businessFamily!==undefined&&!['LEAD','ORDINARY'].includes(input.businessFamily))return fail('请选择线索或普通业务域');
    if(['lead','lxs'].includes(canonicalType(input.id))&&input.businessFamily==='ORDINARY')return fail('预置线索分类不可改为普通业务域');
    const label = text(input.label).trim(), codeLabel = text(input.codeLabel).trim();""")
        code=one(code,'enabled:input.enabled !== false,fields,...(importFields!==undefined?',"enabled:input.enabled !== false,fields,...(input.businessFamily!==undefined?{businessFamily:input.businessFamily}:{}),...(importFields!==undefined?")
        marker='      const priorCategory = target.types.find(item => item.id === row.id);'
        code=one(code,marker,marker+"""
      const desiredFamily=input.businessFamily===undefined?businessFamily(priorCategory||input):input.businessFamily;
      if(!priorCategory&&desiredFamily==='LEAD'&&!target.brandId)return fail('请先进入明确品牌，再创建线索业务分类');
      if(priorCategory&&businessFamily(priorCategory)!==desiredFamily){const lock=businessFamilyLocks(priorCategory.id,source);if(lock.locked)return fail(lock.reason);}
      row.businessFamily=desiredFamily;""")
        code=one(code,'Object.freeze({fieldUsage,','Object.freeze({businessFamily,businessFamilyLocks,fieldUsage,')
    if path == 'js/pages/business-categories.js':
        marker='${fieldTabs()}<div class="business-fields-heading">'
        replacement='''<div class="business-category-basics"><label class="field"><span>业务域 <b class="business-required">*</b></span><select id="business-category-family" ${(editor.scope.legacy||model.businessFamilyLocks(value.id,editor.scope).locked)?'disabled':''} onchange="BusinessConfiguration.setBasic('businessFamily',this.value)"><option value="ORDINARY" ${model.businessFamily(value)==='ORDINARY'?'selected':''}>普通业务（按本分类业务编码唯一）</option><option value="LEAD" ${model.businessFamily(value)==='LEAD'?'selected':''}>线索业务（同品牌统一线索编码）</option></select><small>线索域支持原总部与门店合法转交；分类被引用后业务域不可改。${esc(model.businessFamilyLocks(value.id,editor.scope).reason||'')}</small></label></div>${fieldTabs()}<div class="business-fields-heading">'''
        code=one(code,marker,replacement)
        code=one(code,"category:['label','codeLabel']","category:['label','codeLabel','businessFamily']")
        code=one(code,"    if(!allowed[editor.kind].includes(key)) return;","""    if(!allowed[editor.kind].includes(key)) return;
    if(editor.kind==='category'&&key==='businessFamily'){
      const lock=model.businessFamilyLocks(editor.values.id,editor.scope);
      if(editor.scope.legacy||lock.locked)return error(lock.reason||'旧目录保留原业务域');
      if(!['LEAD','ORDINARY'].includes(value))return;
    }""")
        code=one(code,"['id','label','codeLabel','prefix','enabled','fields','importFields']","['id','label','codeLabel','prefix','enabled','fields','importFields','businessFamily']")
        code=one(code,"    if(kind==='category') common.push(\n", "    if(kind==='category') common.push(\n      {key:'businessFamily',label:'业务域',render:(_,row)=>model.businessFamily(row)==='LEAD'?'线索业务':'普通业务'},\n")
    if path == 'js/components/business-configuration-usage.js':
        marker='      for(const template of [...(unified?.templates||[]),...(unified?.templateSnapshots||[])]){'
        code=one(code,marker,r'''      for(const record of unified?.records||[]){
        if(!model.canManageBrand(record.brandId))continue;
        const owner=model.brandScope(record.brandId);if(!owner.ok){issue('保留运行方案范围');continue;}
        if(record.runs!==undefined&&!Array.isArray(record.runs)){issue('保留运行方案结构');continue;}
        for(const run of record.runs||[]){
          const plan=run.planSnapshot;if(!object(plan)){issue('保留运行方案结构');continue;}
          if(plan.categoryRef?.categoryId)add('category',plan.categoryRef.categoryId,owner.scope,{kind:'saved_business',source:'captured-run-category',sourceLabel:'保留运行分类快照',objectId:run.runId,snapshotRetained:true,blocking:true,message:'业务保留的运行方案引用此分类'});
          const fields=new Set((plan.routingCatalog?.fields||[]).map(field=>field.id).filter(id=>typeof id==='string'));
          for(const edge of [...(plan.edges||[]),...(plan.entryRules||[])])for(const rule of edge.conditions?.rules||[])if(['IMPORT','FOLLOWUP'].includes(rule.source)&&typeof rule.fieldId==='string')fields.add(rule.fieldId);
          for(const fieldId of fields)add('field',fieldId,owner.scope,{kind:'saved_business',source:'captured-run-field',sourceLabel:'保留运行字段快照',objectId:run.runId,fieldId,snapshotRetained:true,blocking:true,message:'业务保留的运行方案或开始分流引用此字段'});
        }
      }
''' + marker)
        marker="          for (const fieldId of fieldRefs) add('field',fieldId,owner.scope,"
        code=one(code,marker,"          for(const entry of version.entryRules||[])for(const rule of entry.conditions?.rules||[])if(rule.source==='IMPORT'&&typeof rule.fieldId==='string')fieldRefs.add(rule.fieldId);\n"+marker)
    return code
