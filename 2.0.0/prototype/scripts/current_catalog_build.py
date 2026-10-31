"""Current planning catalog: explicit brand seeds and no legacy route migration.

Applied after the existing catalog transforms. Tenant-owned professional catalogs
remain separate; they are not sources for a new shared brand catalog.
"""
def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Current catalog source conflict: ' + before[:140])
    return code.replace(before, after, 1)


BRAND_BUNDLE = r'''
  function brandBundle(data,id,scope) {
    const rows=(data.brandScopes||[]).filter(bundle=>bundle.brandId===id);
    if(rows.length>1)throw Error('同一品牌存在重复业务目录');
    if(rows.length){if(!validateScope(rows[0]))throw Error('品牌业务目录结构无效');return DUnifiedCategories.upgrade(rows[0]);}
    return {...scope,brandId:id,...defaults(id)};
  }
'''


PLANNING_REFERENCE_RESET = r'''
  // Internal planning reset, called once by the current business ledger setup.
  // Field definitions and independent professional tenant catalogs are retained.
  function clearPlanningFlowReferences() {
    try {
      const raw=root.localStorage.getItem(storageKey);
      if(raw===null)return {ok:true,changed:false,revision:0};
      const data=JSON.parse(raw);
      if(!object(data)||data.version!==storageVersion||!Number.isSafeInteger(data.revision)||data.revision<0||!Array.isArray(data.scopes)||data.brandScopes!==undefined&&!Array.isArray(data.brandScopes))return fail('业务目录结构无法核定，未清理流程关联');
      const next=clone(data);let changed=false;
      for(const bundle of [...next.scopes,...(next.brandScopes||[])]) {
        if(!object(bundle)||!Array.isArray(bundle.types)||!Array.isArray(bundle.fields)||bundle.retiredTypes!==undefined&&!Array.isArray(bundle.retiredTypes))return fail('业务目录结构无法核定，未清理流程关联');
        const categories=[...bundle.types,...(bundle.retiredTypes||[]).map(item=>item?.row)];
        if(categories.some(category=>!object(category)))return fail('业务分类结构无法核定，未清理流程关联');
        for(const category of categories)for(const key of ['flowBinding','flowBindingHistory','main','backup','mappings'])if(Object.hasOwn(category,key)){delete category[key];changed=true;}
      }
      if(next.routingRequests!==undefined){if(!Array.isArray(next.routingRequests))return fail('路由请求结构无法核定，未清理流程关联');if(next.routingRequests.length){next.routingRequests=[];changed=true;}}
      if(!changed)return {ok:true,changed:false,revision:data.revision};
      if(root.localStorage.getItem(storageKey)!==raw)return fail('业务目录已变化，流程关联未清理，请重新读取');
      next.revision++;const written=JSON.stringify(next);
      root.localStorage.setItem(storageKey,written);
      if(root.localStorage.getItem(storageKey)!==written)return fail('流程关联清理结果尚未确认，请重新读取');
      return {ok:true,changed:true,revision:next.revision};
    }catch(_){return fail('业务目录无法可靠读取或保存，流程关联清理尚未确认');}
  }
'''


def transform(kind, path, code):
    if kind != 'cloud' or path != 'js/components/customer-business.js':
        return code
    start = code.index('  function brandBundle(')
    end = code.index('  function legacyDefaults(', start)
    code = code[:start] + BRAND_BUNDLE.lstrip('\n') + code[end:]
    code = one(code, '  function defaults() {', "  function defaults(brandId='') {")
    code = one(code,
               "const field = (id,label,type,labels=[]) => ({id,label,type,businessKey:'',options:labels.map(option),enabled:true});",
               "const field = (id,label,type,labels=[]) => ({id,label,type,usage:'FOLLOWUP',...(brandId?{brandId}:{}),businessKey:'',options:labels.map(option),enabled:true});")
    old = "    types.forEach(row=>{row.configurationVersion=1;row.flowBinding={main:{templateId:row.id==='lead'?'TPL-LEAD-MAIN':row.id==='aftersales'?'TPL-AFTERSALES':'TPL-ACTIVITY',version:1},backup:null,mappings:[]};});\n    return DUnifiedCategories.upgrade({types,fields});"
    new = """    const current=DUnifiedCategories.upgrade({types,fields});
    for(const category of current.types){category.configurationVersion=1;category.importFields=[];category.businessFamily=['lead','lxs'].includes(category.id)?'LEAD':'ORDINARY';delete category.flowBinding;}
    return current;"""
    code = one(code, old, new)
    marker = '  root.CustomerBusiness = Object.freeze({'
    code = one(code, marker, PLANNING_REFERENCE_RESET.lstrip('\n') + '\n' + marker + 'clearPlanningFlowReferences,')
    if 'TPL-LEAD-MAIN' in code or 'TPL-AFTERSALES' in code or 'TPL-ACTIVITY' in code:
        raise ValueError('Current catalog still contains a retired template seed')
    return code
