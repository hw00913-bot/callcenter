"""Pure, asserted transforms for the approved seven-category iteration. No file writes."""
import re

def one(code, old, new):
    if code.count(old) != 1:
        raise ValueError('Unified category source changed: '+old[:100])
    return code.replace(old,new,1)

def transform(kind,path,code):
    if kind=='cloud' and path=='js/components/customer-business.js':
        code=one(code,"{id:'lead',label:'线索类'","{id:'lead',label:'新线索'")
        code=one(code,'    return {types,fields};','    return DUnifiedCategories.upgrade({types,fields});')
        code=one(code,"return rows[0];}","return DUnifiedCategories.upgrade(rows[0]);}")
        code=one(code,"if(!sources.length)return {...scope,brandId:id,...(id==='BRAND-NISSAN'?defaults():{types:[],fields:[]}),sourceAliases:[]};", "if(!sources.length)return DUnifiedCategories.upgrade({...scope,brandId:id,...(id==='BRAND-NISSAN'?defaults():{types:[],fields:[]}),sourceAliases:[]});")
        code=one(code,"if(!validateScope(target))throw Error('品牌来源配置冲突，不能按名称自动合并');return target;", "if(!validateScope(target))throw Error('品牌来源配置冲突，不能按名称自动合并');return DUnifiedCategories.upgrade(target);")
        code=one(code,"bundle=scopeBundle(data,scope)||{...scope,...legacyDefaults(scope)};return", "bundle=DUnifiedCategories.upgrade(scopeBundle(data,scope)||{...scope,...legacyDefaults(scope)});return")
        code=one(code,'      const originalTypes=clone(target.types),originalFields=JSON.stringify(target.fields);','      Object.assign(target,DUnifiedCategories.upgrade(target));\n      const originalTypes=clone(target.types),originalFields=clone(target.fields);')
        # A field edit changes only categories that reference that field.
        code=one(code, '||originalFields!==JSON.stringify(target.fields)', '||JSON.stringify((previous.fields||[]).map(ref=>originalFields.find(field=>field.id===ref.fieldId)||null))!==JSON.stringify((row.fields||[]).map(ref=>target.fields.find(field=>field.id===ref.fieldId)||null))')
        code=one(code,'      const current=target.types.find(r=>r.id===categoryId),oldBinding=', '      Object.assign(target,DUnifiedCategories.upgrade(target));\n      const current=target.types.find(r=>r.id===categoryId),oldBinding=')
        code=code.replace("if(source.brandId)return fail('本版品牌业务分类不提供删除');",'')
        code=one(code,"return fixture?clone(fixture):defaults();", "return DUnifiedCategories.upgrade(fixture?clone(fixture):defaults());")
        # Existing category name history is metadata; edits preserve it rather than rewriting snapshots.
        code=one(code,'      if(previous?.flowBinding)row.flowBinding=clone(previous.flowBinding);', '      if(previous?.classificationNameHistory)row.classificationNameHistory=clone(previous.classificationNameHistory);\n      if(previous?.flowBinding)row.flowBinding=clone(previous.flowBinding);')
    if kind=='cloud' and path=='js/components/business-configuration-usage.js':
        code=code.replace('root.AppState?.get?.()', '(root.DSharedConfiguration?.active()?root.DSharedConfiguration.state():root.AppState?.get?.())')
        code=code.replace('root.AppState?.effectiveAccess?.()', '(root.DSharedConfiguration?.active()?root.DSharedConfiguration.access():root.AppState?.effectiveAccess?.())')
        code=code.replace('root.AppState?.isReady?.()','(root.DSharedConfiguration?.active()?root.DSharedConfiguration.access().valid:root.AppState?.isReady?.())')
        code=code.replace('root.AppState?.isSuper?.()',"(root.DSharedConfiguration?.active()?root.DSharedConfiguration.access().roleCode==='SUPER_ADMIN':root.AppState?.isSuper?.())")
        code=one(code,"const validScope=value=>!!text(value?.enterpriseId).trim()&&!!text(value?.tenantId).trim();","const validScope=value=>!!text(value?.tenantId).trim()&&(!!text(value?.enterpriseId).trim()||!!text(value?.brandId).trim());")
        code=one(code,"...(value?.brandId?{brandId:text(value.brandId)}:{})", "...(value?.brandId?{brandId:text(value.brandId)}:{}),...(value?.legacy?{legacy:true}:{})")
        code=one(code,"const category=(value,where,detail)=>{if(typeof value==='string'&&value)add('category',value,where,{categoryId:value,...detail});};", "const category=(value,where,detail)=>{if(typeof value==='string'&&value){const canonical=DUnifiedCategories.canonical(value);add('category',canonical,where,{categoryId:canonical,...detail});}};")
        # The old category operation was retirement. New classification CRUD blocks all references.
        old=next(line for line in code.splitlines() if "if(kind==='category')return {...result,canDelete:true,code:'CAN_RETIRE'" in line)
        new="""    if(kind==='category'){
      try{if(scope.brandId&&root.CustomerBusiness.routingPending(scope.brandId,DUnifiedCategories.canonical(id)))return {...result,ok:false,canDelete:false,reason:'此分类有路由保存待核请求，请先核对原请求'};}catch(_){return {...result,ok:false,canDelete:false,reason:'路由待核请求无法可靠读取，不能删除'};}
      let extra;try{extra=parent.DCategoryLinks.review(id,scope);}catch(_){return {...result,ok:false,canDelete:false,reason:'AI分类引用暂时无法可靠核对，不能删除'};}
      if(!extra.ok)return {...result,ok:false,canDelete:false,reason:extra.message};
      const all=result.refs.concat(extra.refs||[]).map(r=>({...r,blocking:true}));
      const stamp=JSON.stringify([result.fingerprint,extra.fingerprint,all]);
      return {...result,refs:all,fingerprint:stamp,token:{...result.token,fingerprint:stamp},canDelete:all.length===0,code:all.length?'IN_USE':'UNUSED',reason:all.length?'此分类仍有业务或AI配置引用，不能删除':'未发现业务或AI配置引用；共享字段、接口、标签和模板不会一并删除'};
    }"""
        code=one(code,old,new)
        code=one(code,"const fingerprintReads=kind==='category'?readSet.filter(row=>['业务配置','取数接口字典','target','category archive definition'].includes(row[0])):","const fingerprintReads=kind==='category'?readSet:")
    if kind=='cloud' and path=='js/pages/business-categories.js':
        code=one(code,'    return kinds;',"    return kinds.filter(k=>parent.DApp.currentPage()==='PAGE-2223'?k!=='category':k==='category');")
        code=code.replace("ui.pageHeader('业务分类',currentScope().legacy?", "ui.pageHeader(kind==='category'?'业务分类':'业务字段',currentScope().legacy?")
        code=code.replace("ui.pageHeader('业务分类','超管统一维护及授权", "ui.pageHeader('业务字段','超管统一维护及授权")
        code=one(code,"const route='brand-business-categories';", "const route=kind==='category'?'brand-business-categories':'business-fields';")
        code=one(code,"pendingFieldId=savedGuidance.fieldId;selectKind('category');", "pendingFieldId=savedGuidance.fieldId;parent.DApp.openPage('PAGE-2006',{nativeOptions:{view:'category',catalogScope:currentScope().legacy?'legacy:'+currentScope().tenantId:'brand'}});")
        # Classification editing owns field references and routing; AI tags use their own menu.
        marker='<button onclick="${action(\'open\',kind,row.id,true)}">预览</button>'
        code=one(code,marker,marker+"${kind==='category'?`<button class=\"business-delete-action\" onclick=\"${action('remove',kind,row.id)}\">删除</button>`:''}")
        code=re.sub(r'\$\{kind===\'category\'\?`<button \$\{DSharedConfiguration\.canLinkAI.*?查看AI关联</button>`:\'\'\}', '', code)
        code=one(code,"const explanation=kind==='category'?", "const explanation=kind==='category'?'<p>仅删除当前未被引用的分类；共享字段、取数接口、AI标签和流转模板不会一并删除。</p>':false?")
    if kind=='ai' and path=='js/pages/sys-tags.js':
        # Display is derived from the shared directory. The original Mock remains a legacy key registry.
        code=code.replace('MockTagScenes.forEach','DUnifiedAI.scenes().forEach').replace('MockTagScenes.length','DUnifiedAI.scenes().length').replace('MockTagScenes[i]','DUnifiedAI.scenes()[i]').replace('MockTagScenes[s]','DUnifiedAI.scenes()[s]').replace('MockTagScenes[0]','DUnifiedAI.scenes()[0]')
        for name in ['saveSceneEdit','toggleSceneStatus','deleteScene','addNewScene']:
            code,n=re.subn(r'(function '+name+r'\([^)]*\) \{)',r"\1\n    showToast('分类请在业务分类菜单统一维护','warning');return;",code,count=1)
            if n!=1:raise ValueError('Missing AI scene mutator '+name)
        code=re.sub(r"^.*<button class=\"btn-scene-mgr\".*\n",'',code,flags=re.M)
        code=code.replace('📋 意向标签配置','AI 标签配置')
        code=one(code,"      showToast('本地标签已添加', 'success');", "      refreshTreePanel();showToast('本地标签已添加', 'success');")
        code=one(code,'    autoSelectFirst();',"    if(!DUnifiedAI.afterInit())autoSelectFirst();")
        marker='  return {'
        at=code.rfind(marker)
        if at<0:raise ValueError('Missing tags export')
        code=code[:at]+code[at:].replace(marker,marker+"\n    integrationSelect:function(sceneId,tenantType,supplierId){currentScene=sceneId;currentTenantType=tenantType;currentSupplier=supplierId||null;currentMode=supplierId?'supplier':'local';refreshTreePanel();if(supplierId)loadTagList(supplierId,tenantType,sceneId);else loadLocalTagSet(tenantType,sceneId);},",1)
    if kind=='ai' and path=='js/pages/sys-scene.js':
        code=one(code,'<option value="">请选择</option><option value="新线索">新线索</option><option value="冷线索">冷线索</option>', '<option value="">请选择</option>\' + DUnifiedAI.filterOptions() + \'')
        code=one(code,'row.category===dSceneFilters.category','DUnifiedAI.matches(row,dSceneFilters.category)')
        start=code.index('  function sceneTypeRadiosHtml(');end=code.index('  /* =====',start)
        code=code[:start]+'''  function sceneTypeRadiosHtml(checkedType) {
    return DUnifiedAI.sceneOptions(checkedType);
  }

'''+code[end:]
        start=code.index('  function updateSceneTypeAvailability(');end=code.index('  function onSceneTypeChange(',start)
        code=code[:start]+'''  function updateSceneTypeAvailability(platformValue) {
    var restrict=platformValue==='电声'||platformValue==='冰兰';
    document.querySelectorAll('#bizAddSceneDrawer input[name="sceneType"]').forEach(function(input){
      var allowed=!restrict||['lead','lxs'].includes(input.dataset.categoryId)||DUnifiedAI.preserveLegacy(input,getCurrentPlatform(),currentEditingId,SceneRows);
      input.disabled=!allowed;input.closest('.biz-radio')?.classList.toggle('disabled',!allowed);
      if(!allowed&&input.checked)input.checked=false;
    });
  }

'''+code[end:]
        code=one(code,"var sceneType = data.category || '';", "var sceneType = data.unifiedCategoryId || data.category || '';")
        code=one(code,"    return map[sceneTypeName] || '';", "    var input=document.querySelector('#bizAddSceneDrawer input[name=\"sceneType\"]:checked');var stable=input?.dataset.categoryId;return ({lead:'NEW_LEAD',lxs:'COLD_LEAD'})[stable]||'';")
        code=one(code,"      category: sceneTypeEl ? sceneTypeEl.value : '',", "      category: sceneTypeEl ? sceneTypeEl.value : (SceneRows.find(s=>s.id===currentEditingId)?.category||''),\n      ...((sceneTypeEl?.dataset.categoryId||SceneRows.find(s=>s.id===currentEditingId)?.unifiedCategoryId)?{unifiedCategoryId:sceneTypeEl?.dataset.categoryId||SceneRows.find(s=>s.id===currentEditingId)?.unifiedCategoryId}:{}),")
        code=one(code,"    if (!data.category) return '请选择场景类型';", "    if (!data.category) return '请选择场景类型';\n    var retained=SceneRows.find(s=>s.id===currentEditingId);if(['电声','冰兰'].includes(platform)&&!['lead','lxs'].includes(data.unifiedCategoryId)&&!(retained&&retained.platform===platform&&retained.category===data.category))return '当前供应商仅支持新线索或冷线索';")
    return code
