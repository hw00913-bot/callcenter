/* Review fixtures use the original field and category model. Existing edits remain intact. */
(function(){
  'use strict';
  const attempted=new WeakMap(), archiveAttempts=new WeakMap();
  function catalogFor(model,source) {
    const data = model.catalog(source);
    if (!data.ok) throw Error(data.message);
    return data;
  }
  function settingsFor(data) {
    return {expectedContext:data.context,expectedRevision:data.revision};
  }
  function ensureImportField(model,source,spec) {
    const data = catalogFor(model,source);
    const existing = data.fields.find(field => field.usage === 'IMPORT' && field.businessKey === spec.businessKey);
    if (existing) return existing;
    const saved = model.saveField({...spec,usage:'IMPORT',brandId:source.brandId,enabled:true,options:spec.options || []},
      source,settingsFor(data));
    if (!saved.ok) throw Error(saved.message);
    return saved.row;
  }
  function addSkynetImportFields(model,source) {
    const businessKeys = ['rChannel','leadStatus'];
    const fields = window.DSkynetIntakeFixtures.fields.filter(field => businessKeys.includes(field.key));
    if (fields.length !== businessKeys.length || fields.some(field => !field.options?.length)) {
      throw Error('天网演示导入字段字典未就绪。');
    }
    const fieldIds = fields.map(field => ensureImportField(model,source,{
      id:'review21-skynet-' + field.key.toLowerCase(),businessKey:field.businessKey,label:field.label,type:'select',
      options:field.options.map(option => ({id:option.value,label:option.label,businessKey:option.value}))
    }).id);
    const demoCategories = ['lead',...window.DReview21DccFollowupFields.leadCategories.map(([id]) => id)];
    for (const id of demoCategories) {
      const data = catalogFor(model,source);
      const category = data.rows.find(row => row.id === id && row.enabled !== false);
      if (!category) continue;
      const current = category.importFields || [];
      const missing = fieldIds.filter(fieldId => !current.some(ref => ref.fieldId === fieldId));
      if (!missing.length) continue;
      const saved = model.save({...category,importFields:[...current,
        ...missing.map(fieldId => ({fieldId,enabled:true,required:false}))]},source,settingsFor(data));
      if (!saved.ok) throw Error(saved.message);
    }
  }
  function mount({id,frame,context}){
    const c=DSession.context();
    if(!c||DSession.roleKey(c)==='super'||c.scope.kind!=='tenant'||c.account.id!==context.account.id||c.scope.id!==context.scope.id)return;
    const w=frame.contentWindow,model=w?.CustomerBusiness,brandId=c.scope.tenant.brandId;
    if(!model||!brandId||!model.canManageBrand(brandId)||w.DNativeContext?.context?.scope.id!==c.scope.id)return;
    const key='d-contact-210-category-fixtures:'+brandId;
    const skynetKey='d-contact-210-skynet-cleaning-fields:'+brandId;
    const needsOriginalFixtures=localStorage.getItem(key)!=='done';
    const needsSkynetFields=localStorage.getItem(skynetKey)!=='done';
    if(w.document.querySelector('.platform-layer .layer-panel'))return;
    const source={brandId,tenantId:c.scope.id,enterpriseId:c.scope.tenant.enterpriseId};
    let archivesChanged=false;
    if(['PAGE-2006','PAGE-2223'].includes(id) && DSession.canWrite('PAGE-2006') && archiveAttempts.get(w)!==brandId){
      archiveAttempts.set(w,brandId);
      const result=model.purgeUnusedCategoryArchives(source);
      archivesChanged=result.ok && result.count>0;
    }
    if(attempted.get(w)===brandId||!(needsOriginalFixtures||needsSkynetFields)){
      if(archivesChanged)w.RouteRuntime?.refreshCurrent?.();
      return;
    }
    attempted.set(w,brandId);
    const fields=[
      {id:'review21-clueid',businessKey:'clueid',label:'原留资编号',type:'text'},
      {id:'review21-hclueid',businessKey:'hclueid',label:'培育线索编号',type:'text'},
      {id:'review21-needs-nurture',businessKey:'needsNurture',label:'是否需要培育',type:'select',options:[{id:'yes',label:'是',businessKey:'Y'},{id:'no',label:'否',businessKey:'N'}]}
    ];
    const ids={};
    try{
      if(needsOriginalFixtures){
        for(const spec of fields){ids[spec.businessKey]=ensureImportField(model,source,spec).id;}
        for(const [categoryId,label,requiredKey] of window.DReview21DccFollowupFields.leadCategories){
          const data=catalogFor(model,source);
          if(data.rows.some(row=>row.id===categoryId||row.label===label))continue;
          const refs=(data.rows.find(row=>row.id==='lead')?.fields||[]).filter(ref=>data.fields.some(f=>f.id===ref.fieldId&&f.enabled));
          const row={id:categoryId,label,codeLabel:'业务记录编号',businessFamily:'LEAD',enabled:true,fields:refs,
            importFields:fields.filter(spec=>spec.businessKey==='needsNurture'||!requiredKey||spec.businessKey===requiredKey).map(spec=>({fieldId:ids[spec.businessKey],enabled:true,required:spec.businessKey==='needsNurture'||spec.businessKey===requiredKey}))};
          const saved=model.save(row,source,settingsFor(data));if(!saved.ok)throw Error(saved.message);
        }
        localStorage.setItem(key,'done');
      }
      if(needsSkynetFields){
        addSkynetImportFields(model,source);
        localStorage.setItem(skynetKey,'done');
      }
      if(['PAGE-2006','PAGE-2223','PAGE-2226','PAGE-2204'].includes(id))w.RouteRuntime?.refreshCurrent?.();
    }catch(error){window.DReview21Catalog.lastError=error.message;}
  }
  function adaptCatalog(html){
    const replace=(before,after)=>{
      const at=html.indexOf(before);
      if(at<0||html.indexOf(before,at+before.length)>=0)throw new Error('业务目录配置位置无法确定');
      html=html.slice(0,at)+after+html.slice(at+before.length);
    };
    const retiredCategories = JSON.stringify(['review21-sanwu','review21-unfilled']);
    replace("throw Error('Invalid routing journal');\n    return {raw,data};",
      `throw Error('Invalid routing journal');
    for (const bundle of [...data.scopes,...(data.brandScopes || [])]) {
      if (Array.isArray(bundle?.types)) bundle.types = bundle.types.filter(row => !${retiredCategories}.includes(row?.id));
      if (Array.isArray(bundle?.retiredTypes)) bundle.retiredTypes = bundle.retiredTypes.filter(item => !${retiredCategories}.includes(item?.row?.id));
    }
    if (Array.isArray(data.routingRequests)) data.routingRequests = data.routingRequests.filter(row => !${retiredCategories}.includes(row.categoryId));
    return {raw,data};`);
    const deny="return fail('超级管理员仅可编辑已有业务配置');";
    // Keep native brand and tenant checks. Require an existing ID within the save target.
    replace('      const priorCategory = target.types.find(item => item.id === row.id);',
      '      const priorCategory = target.types.find(item => item.id === row.id);\n      if(superUser()&&(!priorCategory||priorCategory.enabled!==row.enabled))'+deny);
    replace('      const previous = target.fields.find(item => item.id === row.id);\n      const owningBrand',
      '      const previous = target.fields.find(item => item.id === row.id);\n      if(superUser()&&(!previous||previous.enabled!==row.enabled))'+deny+'\n      const owningBrand');
    replace('  function deleteConfiguration(kind,id,source,options) {',`  function retiredIdentity(archive) {
    const row={...archive.row,fields:[]};
    if (Object.hasOwn(row,'importFields')) row.importFields=[];
    return {...archive,row,fields:[]};
  }
  function purgeUnusedCategoryArchives(source = {}) {
    if(superUser() || source.legacy || !sourceBrand(source)) return {ok:true,count:0};
    const data=catalog(source);
    if(!data.ok) return data;
    function unused(id) {
      const checked=usage('category',id,source);
      if(checked.code!=='UNKNOWN_TARGET' || checked.refs.length) return false;
      try {
        const ai=root.parent.DCategoryLinks.review(id,data.scope);
        return ai.ok===true && (ai.refs || []).length===0 && !routingPending(data.scope.brandId,id);
      } catch (_) {return false;}
    }
    const ids=new Set((data.retiredTypes || []).filter(archive=>archive.fields.length && unused(archive.row.id)).map(archive=>archive.row.id));
    if(!ids.size) return {ok:true,count:0};
    const guard=()=>[...ids].every(unused)?{ok:true}:fail('历史分类仍有业务引用，本次保留。');
    guard.after=guard;
    return mutate(source,{expectedContext:data.context,expectedRevision:data.revision},target=>{
      target.retiredTypes=(target.retiredTypes || []).map(archive=>ids.has(archive.row.id)?retiredIdentity(archive):archive);
      return {ok:true,count:ids.size};
    },guard);
  }
  function deleteConfiguration(kind,id,source,options) {`);
    replace("      }else {\n        const row=rows[index],ids=new Set(categoryFieldRefs(row).map(ref=>ref.fieldId)),queue=[...ids];\n        while(queue.length) {const fieldId=queue.shift(),field=target.fields.find(item=>item.id===fieldId);if(!field)return fail('分类字段暂时无法完整归档，请保留配置并核对');for(const upstream of activeDependencies(field))if(!ids.has(upstream)){ids.add(upstream);queue.push(upstream);}}\n        archived={row:clone(row),fields:clone(target.fields.filter(field=>ids.has(field.id))),deletedAt:new Date().toISOString(),deletedBy:text(state().accountId)};",
      "      }else {\n        archived=retiredIdentity({row:rows[index],deletedAt:new Date().toISOString(),deletedBy:text(state().accountId)});");
    replace("      if(kind==='category'&&after?.code==='UNKNOWN_TARGET') {",
      "      if(kind==='category'&&after?.code==='UNKNOWN_TARGET'&&Array.isArray(after.refs)&&after.refs.length===0) {");
    replace("try {const raw=load().data,current=brandBundle(raw,sourceBrand(source),scopeOf(source)),saved=(current?.retiredTypes||[]).find(item=>item.row.id===id);if(saved&&JSON.stringify(saved)===JSON.stringify(archived))return {ok:true};}catch(_){}",
      "try {const scope=scopeOf(source),raw=load().data,current=source.legacy?scopeBundle(raw,scope):brandBundle(raw,sourceBrand(source),scope),saved=(current?.retiredTypes||[]).find(item=>item.row.id===id);const ai=root.parent.DCategoryLinks.review(id,scope);if(ai.ok===true&&(ai.refs||[]).length===0&&saved&&JSON.stringify(saved)===JSON.stringify(archived))return {ok:true};}catch(_){}");
    replace("if (headers.has(token) && headers.get(token)!==index) return '导入列标识“'+token+'”对应多个字段，请调整本分类的字段名称或业务编码';",
      "if (headers.has(token) && headers.get(token)!==index) {\n          const systemCode = field.key==='code' || fields[headers.get(token)].key==='code';\n          return systemCode ? '导入表头“'+token+'”与本分类的业务记录编码列重名，请移除同名字段或为独立外部编号使用不同的名称和编码' :\n            '导入列标识“'+token+'”对应多个字段，请调整本分类的字段名称或业务编码';\n        }");
    replace('  function deleteConfiguration(kind,id,source,options) {',
      '  function deleteConfiguration(kind,id,source,options) {\n    if(superUser())'+deny);
    replace('  root.CustomerBusiness = Object.freeze({clearPlanningFlowReferences,',
      '  root.CustomerBusiness = Object.freeze({editOnly:superUser,purgeUnusedCategoryArchives,clearPlanningFlowReferences,');

    replace('  function rowActions(kind,row,data) {',
      '  function rowActions(kind,row,data) {\n    if(model.editOnly())return `<div class="table-actions"><button onclick="${action(\'open\',kind,row.id)}">编辑</button><button onclick="${action(\'open\',kind,row.id,true)}">预览</button></div>`;');
    replace('  function operationGuide() {',
      '  function operationGuide() {\n    if(model.editOnly())return \'<div class="business-operation-guide">可查看并编辑授权范围内的已有配置。</div>\';');
    replace('ui.toolbar(`<button class="btn btn-primary" ${data.ok?',
      "ui.toolbar(model.editOnly()?'':`<button class=\"btn btn-primary\" ${data.ok?");
    replace("emptyText:'暂无'+kindNames[kind]+'，请新增'", "emptyText:'暂无'+kindNames[kind]+(model.editOnly()?'':'，请新增')");
    replace('  function open(kind,id,previewOnly=false) {',
      '  function open(kind,id,previewOnly=false) {\n    if(model.editOnly()&&!id)return showToast(\'超级管理员仅可编辑已有业务配置\',\'warning\');');
    replace('  function openRelated(kind) {',
      '  function openRelated(kind) {\n    if(model.editOnly())return;');
    const newFieldButton='<button type="button" class="btn" ${importing&&(editor.scope.legacy||!editor.scope.brandId)?\'disabled\':\'\'} onclick="BusinessConfiguration.openRelated(\'field\')">＋ 新建${importing?\'导入\':\'填写\'}字段</button>';
    replace(newFieldButton,"${model.editOnly()?'':`"+newFieldButton+"`}");
    replace('  function toggle(kind,id,enabled) {',
      '  function toggle(kind,id,enabled) {\n    if(model.editOnly())return;');
    replace('  function remove(kind,id) {\n    const current=referenceData(kind,id);',
      '  function remove(kind,id) {\n    if(model.editOnly())return;\n    const current=referenceData(kind,id);');

    // The catalog owns family selection and CRUD within its current scope.
    replace("const states = {category:{keyword:'',status:''},field:",
      "const states = {category:{keyword:'',status:'',family:'',familyKeyword:''},field:");
    html=html.replaceAll("if(Object.hasOwn(state,'usage'))state.usage='';",
      "if(Object.hasOwn(state,'usage'))state.usage='';if(Object.hasOwn(state,'family')){state.family='';state.familyKeyword='';}");
    replace('  function links(kind) {',`  function selectCategoryFamily(family) {
    if (activeKind!=='category') return;
    const info=model.families(currentScope());
    if (family&&(!info.ok||!info.rows.some(row=>row.id===family))) return;
    states.category.family=family;
    refresh();
    Array.from(document.querySelectorAll('[data-business-family]'))
      .find(button=>button.dataset.businessFamily===family)?.focus({preventScroll:true});
  }
  function familyMatches(label,keyword) {
    return label.toLocaleLowerCase().includes(keyword.trim().toLocaleLowerCase());
  }
  function searchCategoryFamilies(keyword) {
    states.category.familyKeyword=keyword;
    const rows=Array.from(document.querySelectorAll('[data-family-name]'));
    rows.forEach(row=>{row.hidden=!familyMatches(row.dataset.familyName,keyword);});
    const empty=document.querySelector('[data-family-search-empty]');
    if(empty){
      empty.hidden=rows.some(row=>!row.hidden);
      empty.textContent=keyword.trim()?'没有匹配的一级分类':'暂无一级分类';
    }
  }
  function categoryRail(info) {
    const choices=[{id:'',label:'全部分类'},...(info.ok?info.rows:[])];
    const keyword=states.category.familyKeyword;
    const create=info.canCreate?'<button type="button" class="btn-link" data-family-create onclick="BusinessConfiguration.openCategoryFamily()">新增</button>':'';
    const rows=choices.map(({id,label})=>{
      const active=states.category.family===id;
      const hidden=id&&!familyMatches(label,keyword);
      const controls=id?'<span class="business-family-actions">'+
        (info.canEdit?'<button type="button" class="btn-link" data-family-edit onclick="'+action('openCategoryFamily',id)+'">编辑</button>':'')+
        (info.canDelete?'<button type="button" class="btn-link business-family-delete" data-family-delete onclick="'+action('deleteCategoryFamily',id)+'">删除</button>':'')+'</span>':'';
      return '<div class="business-family-row'+(active?' active':'')+'"'+(id?' data-family-name="'+esc(label)+'"':'')+(hidden?' hidden':'')+'>'+
        '<button type="button" class="business-family-select" data-business-family="'+esc(id)+'" aria-pressed="'+active+
        '" title="'+esc(label)+'" onclick="'+action('selectCategoryFamily',id)+'">'+esc(label)+'</button>'+controls+'</div>';
    }).join('');
    const empty=info.ok?'<p class="field-hint" data-family-search-empty'+
      (info.rows.some(row=>familyMatches(row.label,keyword))?' hidden':'')+'>'+(keyword?'没有匹配的一级分类':'暂无一级分类')+'</p>':
      '<p class="form-error" role="alert">'+esc(info.message||'一级分类暂不可读取')+'</p>';
    return '<aside class="account-tenant-panel business-family-rail" aria-label="一级分类列表"><div class="business-family-heading"><strong>一级分类</strong>'+create+'</div>'+
      '<input type="search" data-family-search aria-label="搜索一级分类" placeholder="搜索一级分类" maxlength="40" value="'+esc(keyword)+
      '" oninput="BusinessConfiguration.searchCategoryFamilies(this.value)"><div class="business-family-items">'+rows+empty+'</div></aside>';
  }
  function familyRevision(info) {
    return {expectedContext:info.context,expectedRevision:info.revision};
  }
  function openCategoryFamily(id) {
    if(activeKind!=='category')return;
    const source=clone(currentScope()), info=model.families(source);
    const row=id?info.rows?.find(item=>item.id===id):null;
    if(!info.ok||(id?!info.canEdit||!row:!info.canCreate))return showToast('当前没有此一级分类的操作权限','warning');
    const dialog='review21-family-edit';
    ui.confirm({
      id:dialog, title:id?'编辑一级分类':'新增一级分类', confirmText:'保存',
      body:'<label class="field"><span>一级分类名称</span><input id="review21-family-name" maxlength="40" placeholder="请输入一级分类名称" value="'+esc(row?.label||'')+
        '"></label><p class="form-error" role="alert" id="review21-family-error"></p>',
      onConfirm(){
        const label=document.getElementById('review21-family-name')?.value.trim()||'';
        const result=model.saveFamily(id?{id,label}:{label},source,familyRevision(info));
        if(!result.ok){
          document.getElementById('review21-family-error').textContent=result.message||'一级分类暂未保存';
          return false;
        }
        if(!id)states.category.family=result.row.id;
        if(!familyMatches(result.row.label,states.category.familyKeyword))states.category.familyKeyword='';
        refresh();
        showToast('一级分类已保存','success');
      }
    });
    const input=document.getElementById('review21-family-name');
    input?.focus();
    input?.addEventListener('keydown',event=>{
      if(event.key!=='Enter')return;
      event.preventDefault();
      document.getElementById(dialog+'-confirm')?.click();
    });
  }
  function deleteCategoryFamily(id) {
    if(activeKind!=='category')return;
    const source=clone(currentScope()), info=model.families(source);
    const row=info.rows?.find(item=>item.id===id);
    if(!info.ok||!info.canDelete||!row)return showToast('当前没有此一级分类的删除权限','warning');
    if(row.hasChildren)return showToast('该一级分类下仍有二级分类，请先处理后再删除。','warning');
    ui.confirm({
      id:'review21-family-delete',title:'删除一级分类',confirmText:'删除',
      body:'<p>确认删除「'+esc(row.label)+'」？</p><p class="form-error" role="alert" id="review21-family-delete-error"></p>',
      onConfirm(){
        const result=model.removeFamily(id,source,familyRevision(info));
        if(!result.ok){
          document.getElementById('review21-family-delete-error').textContent=result.message||'一级分类暂未删除';
          return false;
        }
        if(states.category.family===id)states.category.family='';
        refresh();
        showToast('一级分类已删除','success');
      }
    });
  }
  function defaultCategoryFamily() {
    const info=model.families(currentScope());
    const rows=(info.rows||[]).filter(row=>!currentScope().legacy||row.id!=='LEAD');
    return rows.find(row=>row.id===states.category.family)?.id||rows.find(row=>row.id==='ORDINARY')?.id||rows[0]?.id||'';
  }
  function categoryFamilyOptions(value) {
    const info=model.families(editor.scope);
    const selected=model.familyId(value);
    const rows=(info.rows||[]).filter(row=>!editor.scope.legacy||row.id!=='LEAD'||!editor.creating);
    return rows.map(row=>'<option value="'+esc(row.id)+'"'+(row.id===selected?' selected':'')+'>'+esc(row.label)+'</option>').join('');
  }
  function links(kind) {`);
    replace("const rows=rowsOf(kind,data).filter(row=>(kind!=='field'||",
      "const rows=rowsOf(kind,data).filter(row=>(kind!=='category'||!state.family||model.familyId(row)===state.family)&&(kind!=='field'||");
    replace("const data=catalog(), rows=data.ok?sortedRows(kind,data):[];",
      "const data=catalog(), familyInfo=kind==='category'?model.families(currentScope()):null;\n    if(familyInfo?.ok&&states.category.family&&!familyInfo.rows.some(row=>row.id===states.category.family))states.category.family='';\n    const rows=data.ok?sortedRows(kind,data):[];");
    replace('  function tableColumns(kind,data) {','  function tableColumns(kind,data,families=[]) {');
    replace("const common=[{key:'label',label:'名称',",
      "const common=[{key:'label',label:kind==='category'?'二级分类名称':'名称',");
    replace("{key:'businessFamily',label:'业务域',render:(_,row)=>model.businessFamily(row)==='LEAD'?'线索业务':'普通业务'},",
      "...(states.category.family?[]:[{key:'businessFamily',label:'一级分类',render:(_,row)=>esc(model.familyName(row,families))}]),");
    replace("    return `<section class=\"platform-page business-categories-page business-config-page\">${ui.pageHeader(kind==='category'?'业务分类':'业务字段',currentScope().legacy?'维护本租户原有分类与字段，停用仅限制新选择和新关联。':descriptions[kind])}${operationGuide()}${links(kind)}${savedGuide(kind,data)}",
      "    const main = `${savedGuide(kind,data)}");
    replace("${ui.table(tableColumns(kind,data),rows,{emptyText:'暂无'+kindNames[kind]+(model.editOnly()?'':'，请新增')})}</div></section>`;",
      "${ui.table(tableColumns(kind,data,familyInfo?.rows||[]),rows,{emptyText:kind==='category'?'当前条件下暂无二级分类':'暂无'+kindNames[kind]+(model.editOnly()?'':'，请新增')})}</div>`;\n    const body=kind==='category'\n      ? '<div class=\"account-main-layout business-category-layout\">'+categoryRail(familyInfo)+'<div class=\"account-content-panel\" aria-label=\"二级分类列表\">'+main+'</div></div>'\n      : links(kind)+main;\n    return `<section class=\"platform-page business-categories-page business-config-page\">${ui.pageHeader(kind==='category'?'业务分类':'业务字段',currentScope().legacy?'维护本租户原有分类与字段，停用仅限制新选择和新关联。':descriptions[kind])}${operationGuide()}${body}</section>`;");
    replace("if(kind==='category') return {id:model.newId('biz'),label:'',",
      "if(kind==='category') return {id:model.newId('biz'),label:'',familyId:defaultCategoryFamily(),");
    replace('window.BusinessConfiguration={openCategoryImport,',
      'window.BusinessConfiguration={selectCategoryFamily,searchCategoryFamilies,openCategoryFamily,deleteCategoryFamily,openCategoryImport,');
    replace("    const value=id ? rowsOf(kind,data).find(row=>row.id===id) : initial(kind);",
      "    if(kind==='category'&&!id&&!defaultCategoryFamily())return showToast('请先新增一级分类','warning');\n    const value=id ? rowsOf(kind,data).find(row=>row.id===id) : initial(kind);");
    replace("(editor.scope.legacy||model.businessFamilyLocks(value.id,editor.scope).locked)?'disabled':''",
      "((editor.scope.legacy&&!editor.creating)||model.businessFamilyLocks(value.id,editor.scope).locked)?'disabled':''");
    replace("onchange=\"BusinessConfiguration.setBasic('businessFamily',this.value)\"><option value=\"ORDINARY\" ${model.businessFamily(value)==='ORDINARY'?'selected':''}>普通业务（按本分类业务编码唯一）</option><option value=\"LEAD\" ${model.businessFamily(value)==='LEAD'?'selected':''}>线索业务（同品牌统一线索编码）</option></select><small>线索域支持原总部与门店合法转交；分类被引用后业务域不可改。",
      "onchange=\"BusinessConfiguration.setBasic('familyId',this.value)\">${categoryFamilyOptions(value)}</select><small>二级分类被业务引用后，一级分类不可变更。");
    replace("category:['label','codeLabel','businessFamily']",
      "category:['label','codeLabel','familyId']");
    replace("    if(editor.kind==='category'&&key==='businessFamily'){\n      const lock=model.businessFamilyLocks(editor.values.id,editor.scope);\n      if(editor.scope.legacy||lock.locked)return error(lock.reason||'旧目录保留原业务域');\n      if(!['LEAD','ORDINARY'].includes(value))return;\n    }",
      "    if(editor.kind==='category'&&key==='familyId'){\n      const lock=model.businessFamilyLocks(editor.values.id,editor.scope);\n      if((editor.scope.legacy&&!editor.creating)||lock.locked)return error(lock.reason||'旧目录保留原一级分类');\n      const info=model.families(editor.scope);\n      if(!info.ok||!info.rows.some(row=>row.id===value))return error('请选择有效的一级分类');\n    }");
    replace("['id','label','codeLabel','prefix','enabled','fields','importFields','businessFamily']",
      "['id','label','codeLabel','prefix','enabled','fields','importFields','businessFamily','familyId']");
    return html;
  }
  window.DReview21Catalog={mount,lastError:''};
  const module=window.DNativeModules?.cloud;
  if(module?.html){
    const catalogHtml=window.DReview21BusinessFamilies.adapt(adaptCatalog(module.html));
    module.html=window.DReview21DccFollowupFields.adapt(window.DReview21FoundationFields.adapt(catalogHtml));
    module.html=window.DDependencyScenarioSettings.adapt(module.html);
    module.html=module.html.replace('</head>',`<style>
      .business-config-page .platform-table th:nth-child(2),
      .business-config-page .platform-table td:nth-child(2){min-width:80px;white-space:nowrap}
      .business-config-page .platform-table th:nth-child(3){min-width:70px}
      .business-category-layout .business-family-rail{display:flex;flex-direction:column;gap:10px;padding:12px;box-sizing:border-box;background:#fff;border:1px solid #dfe5ec;border-radius:8px;overflow:hidden}
      .business-family-heading{display:flex;align-items:center;justify-content:space-between;min-height:27px}
      .business-family-rail input[type="search"]{flex-shrink:0;width:100%;min-width:0;height:32px;padding:0 9px;border:1px solid #d9dfe7;border-radius:6px;background:#fff;font:inherit}
      .business-family-items{display:flex;flex-direction:column;gap:3px;min-height:0;overflow-y:auto}
      .business-family-row{display:flex;align-items:center;min-height:38px;border:1px solid transparent;border-radius:6px}
      .business-family-row[hidden]{display:none}
      .business-family-row:hover{background:#f5f8fc}
      .business-family-row.active{background:#e6f4ff;border-color:#91caff}
      .business-family-select{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;text-align:left;color:#262626;border:0;background:none;padding:8px 8px;font:inherit}
      .business-family-row.active .business-family-select{color:#0958d9;font-weight:600}
      .business-family-actions{display:flex;flex-shrink:0;align-items:center;gap:5px;padding-right:7px}
      .business-family-actions .btn-link{padding:0;font-size:12px;white-space:nowrap}
      .business-family-actions .business-family-delete{color:#b95050}
      .business-family-rail :is(button,input):focus-visible{outline:2px solid #1677ff;outline-offset:0}
      .business-category-layout .management-list-shell{width:100%;min-width:0}
    </style></head>`);
    module.html=module.html.replace('<span>业务名称 <b class="business-required">*</b></span>','<span>二级分类名称 <b class="business-required">*</b></span>');
    module.html=module.html.replace('<span>业务域 <b class="business-required">*</b></span>','<span>一级分类 <b class="business-required">*</b></span>');
  }
})();
