/* Classification -> tenant-owned AI context references. No provider or business-result writes. */
(function(){
  'use strict';
  const key=DSession.prefix+'category-ai-links',clone=v=>JSON.parse(JSON.stringify(v));
  function load(){const raw=localStorage.getItem(key);if(raw===null)return {raw,data:{version:1,revision:0,rows:[]}};const data=JSON.parse(raw);if(data.version!==1||!Number.isSafeInteger(data.revision)||!Array.isArray(data.rows)||data.rows.some(r=>!r||typeof r.tenantId!=='string'||typeof r.categoryId!=='string'||!['brand','tenant'].includes(r.categoryScope)||typeof r.tagSceneId!=='string'||!Array.isArray(r.supplierIds)||r.supplierIds.some(s=>typeof s!=='string')||!['headquarters','store'].includes(r.tenantType)||r.categoryScope==='brand'&&typeof r.brandId!=='string'))throw Error('AI标签关联格式待核，原资料保留');return {raw,data};}
  function tenantContext(){const c=DSession.context();if(c?.scope.kind!=='tenant'||!DSession.allowed('PAGE-2111'))throw Error('请在有权AI业务租户内选择标签配置');return c;}
  function validateAI(tags){
    const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x),id=x=>typeof x==='string'&&x.length>0;
    const names=['MockLocalTagSets','MockSupplierLocalTagMappings','MockSupplierTagPool','MockTagConfigs','MockTagScenes','MockTagSuppliers','MockTenantTypes'];if(Object.keys(tags).some(k=>!names.includes(k))||names.some(k=>!Object.hasOwn(tags,k)))throw Error('AI标签含未知资料，引用待核');
    const directory=(rows,keys)=>{if(!Array.isArray(rows)||rows.some(x=>!object(x)||!id(x.id)||keys&&Object.keys(x).some(k=>!keys.includes(k)))||new Set(rows.map(x=>x.id)).size!==rows.length)throw Error('AI身份目录待核');return rows.map(x=>x.id);};
    const suppliers=directory(tags.MockTagSuppliers,['id','localCode','name','status']),types=directory(tags.MockTenantTypes,['id','name']),scenes=[...new Set(directory(tags.MockTagScenes,['id','localCode','name','status']).concat(DUnifiedCategories.definitions.map(d=>d.tagId)))];
    if(!object(tags.MockSupplierTagPool)||!object(tags.MockTagConfigs)||!object(tags.MockLocalTagSets)||!object(tags.MockSupplierLocalTagMappings))throw Error('AI标签格式待核');
    const pools=new Map();for(const [supplier,rows]of Object.entries(tags.MockSupplierTagPool)){if(!suppliers.includes(supplier))throw Error('未知标签供应商');pools.set(supplier,new Set(directory(rows,['id','localCode','name','sort','platformTagId'])));}
    const pairs=new Map(),triples=new Map();for(const type of types)for(const scene of scenes){const pair=type+'_'+scene;if(pairs.has(pair))throw Error('AI上下文存在歧义');pairs.set(pair,{type,scene});for(const supplier of suppliers){const k=supplier+'_'+pair;if(triples.has(k))throw Error('AI上下文存在歧义');triples.set(k,{supplier,pair});}}
    const locals=new Map();for(const [k,rows]of Object.entries(tags.MockLocalTagSets)){if(!pairs.has(k))throw Error('未知标准标签上下文');locals.set(k,new Set(directory(rows,['id','localCode','name','sort'])));}
    for(const [k,v]of Object.entries(tags.MockTagConfigs)){const tuple=triples.get(k);if(!tuple||!object(v)||Object.keys(v).some(k=>k!=='enabledTagIds')||!Array.isArray(v.enabledTagIds)||v.enabledTagIds.some(t=>!id(t)||!pools.get(tuple.supplier)?.has(t))||new Set(v.enabledTagIds).size!==v.enabledTagIds.length)throw Error('供应商标签配置待核');}
    for(const [k,v]of Object.entries(tags.MockSupplierLocalTagMappings)){const tuple=triples.get(k);if(!tuple||!object(v)||Object.entries(v).some(([a,b])=>!pools.get(tuple.supplier)?.has(a)||!locals.get(tuple.pair)?.has(b)))throw Error('供应商标签映射待核');}
  }
  function matching(r,id,source){return DUnifiedCategories.canonical(r.categoryId)===DUnifiedCategories.canonical(id)&&(source.legacy?r.categoryScope==='tenant'&&r.tenantId===source.tenantId:r.categoryScope==='brand'&&r.brandId===source.brandId);}
  function review(id,source){try{
    const c=DSession.context();if(!c||!DSession.allowed('PAGE-2006')||!DSession.canWrite('PAGE-2006'))throw Error('没有分类删除权限');
    const rows=load().data.rows,refs=rows.filter(r=>matching(r,id,source)).map(r=>({kind:'ai-tags',message:'租户AI标签配置已关联此分类',tenantId:r.tenantId}));
    const oldRaw=localStorage.getItem(DCatalog.key);if(oldRaw!==null){const old=JSON.parse(oldRaw);if(old.version!==1||!Array.isArray(old.rows)||old.rows.some(r=>!r||typeof r.categoryId!=='string'||typeof r.tenantId!=='string'))throw Error('旧场景关联待核');for(const r of old.rows)if(matching({...r,categoryScope:r.categoryScope||(r.brandId?'brand':'tenant')},id,source))refs.push({kind:'ai-scene',message:'既有AI执行场景关联此分类',tenantId:r.tenantId});}
    const tenants=(DOrganization.snapshot().tenants||[]).filter(t=>source.legacy?t.id===source.tenantId:t.brandId===source.brandId);
    const tagId=DUnifiedCategories.tagId(id),reads=[];
    for(const t of tenants){
      const raw=localStorage.getItem(DSession.prefix+'ai-config:tenant:'+t.id);reads.push([t.id,raw]);
      if(raw===null){if(t.modules?.ai&&['xxs','lxs','db','fw','hf'].includes(tagId))refs.push({kind:'ai-tags',message:'本租户默认标签及供应商配置仍引用此分类',tenantId:t.id});continue;}
      const doc=JSON.parse(raw),tags=doc.data?.tags;if(doc.schema!==1||!Number.isSafeInteger(doc.revision)||!tags||!Array.isArray(tags.MockTagScenes)||!tags.MockTagConfigs||!tags.MockLocalTagSets||!tags.MockSupplierLocalTagMappings||!Array.isArray(tags.MockTagSuppliers)||!Array.isArray(tags.MockTenantTypes)||!Array.isArray(doc.data.sceneRows))throw Error('AI配置引用格式待核');
      const only=(v,keys)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));if(!only(doc,['schema','revision','data'])||!only(doc.data,['sceneRows','tags','imports','intentLevels'])||doc.revision<1||doc.data.imports!=null&&(!only(doc.data.imports,['assigned','history'])||!Array.isArray(doc.data.imports.history)||!doc.data.imports.assigned||typeof doc.data.imports.assigned!=='object'||Array.isArray(doc.data.imports.assigned)))throw Error('AI配置含未知资料，引用待核');
      validateAI(tags);
      const types=tags.MockTenantTypes.map(x=>x.id),suppliers=tags.MockTagSuppliers.map(x=>x.id);
      for(const type of types){if((tags.MockLocalTagSets[type+'_'+tagId]||[]).length)refs.push({kind:'ai-tags',message:'本租户标准标签仍引用此分类',tenantId:t.id});for(const supplier of suppliers){const k=supplier+'_'+type+'_'+tagId;if(Object.hasOwn(tags.MockTagConfigs,k)||Object.keys(tags.MockSupplierLocalTagMappings[k]||{}).length)refs.push({kind:'ai-tags',message:'本租户供应商标签配置仍引用此分类',tenantId:t.id});}}
      if(doc.data.sceneRows.some(s=>s.unifiedCategoryId===id||!s.unifiedCategoryId&&DUnifiedCategories.definitions.find(d=>d.id===id)?.label===s.category))refs.push({kind:'ai-scene',message:'本租户AI执行场景仍引用此分类',tenantId:t.id});
    }
    const visible=refs.filter(r=>r.tenantId===c.scope.id);if(refs.some(r=>r.tenantId!==c.scope.id))visible.push({kind:'ai-config',message:'其他租户仍有配置引用此分类，不能删除'});
    return {ok:true,refs:visible,fingerprint:JSON.stringify([rows,oldRaw,reads])};
  }catch(e){return {ok:false,refs:[],message:e.message||'AI引用无法可靠核对'};}}
  async function save(categoryId,source,selection,expected){
    const c=tenantContext();if(!DSession.canWrite('PAGE-2111')||!DSession.canWrite('PAGE-2006'))throw Error('分类或AI配置维护权限不足');
    const identity=c.account.id+'|'+c.scope.id,loaded=load();if(loaded.raw!==expected)throw Error('关联已被其他窗口修改，请重新读取');
    const catalog=await DModuleHost.readCatalog({legacy:source.legacy===true});
    const target=catalog.rows?.find(r=>r.id===categoryId);if(!catalog.ok||!target||target.enabled===false)throw Error('分类已失效，请重新读取');
    const ai=await DModuleHost.readAIConfiguration();const known=new Set(ai.suppliers.filter(s=>s.status==='enabled').map(s=>s.id));
    if(selection.supplierIds.some(id=>!known.has(id)))throw Error('供应商配置已变化');
    const fresh=DModuleHost.currentCatalog({legacy:source.legacy===true}),freshTarget=fresh.rows?.find(r=>r.id===categoryId),freshAI=DModuleHost.currentAIConfiguration();if(!fresh.ok||fresh.revision!==catalog.revision||!freshTarget||freshTarget.enabled===false||freshTarget.configurationVersion!==target.configurationVersion||JSON.stringify(fresh.scope)!==JSON.stringify(catalog.scope)||freshAI.fingerprint!==ai.fingerprint)throw Error('分类或AI配置版本已变化，请重新读取');
    if(identity!==DSession.context()?.account.id+'|'+DSession.context()?.scope.id||!DSession.canWrite('PAGE-2111')||!DSession.canWrite('PAGE-2006')||localStorage.getItem(key)!==loaded.raw)throw Error('权限、范围或关联版本已变化，本次未保存');
    const row={categoryId,categoryScope:catalog.legacy?'tenant':'brand',brandId:catalog.legacy?'':c.scope.tenant.brandId,tenantId:c.scope.id,tagSceneId:DUnifiedCategories.tagId(categoryId),tenantType:c.scope.tenant.organization==='总部'?'headquarters':'store',supplierIds:[...new Set(selection.supplierIds)],categoryVersion:target.configurationVersion||1,updatedAt:new Date().toISOString(),operatorId:c.account.id};
    const data=clone(loaded.data);data.rows=data.rows.filter(r=>!(r.tenantId===row.tenantId&&r.categoryId===row.categoryId&&r.categoryScope===row.categoryScope&&r.brandId===row.brandId));data.rows.push(row);data.revision++;
    const raw=JSON.stringify(data);try{localStorage.setItem(key,raw);}catch(_){throw Error('关联保存失败，原填写已保留，请重试。');}
    try{if(localStorage.getItem(key)!==raw)throw Error();}catch(_){const error=Error('关联保存结果待核，请核对本次结果，勿重复提交');error.pendingRow=clone(row);throw error;}return row;
  }
  async function open(categoryId,source){try{
    const c=tenantContext(),identity=c.account.id+'|'+c.scope.id,loaded=load(),ai=await DModuleHost.readAIConfiguration();
    if(identity!==DSession.context()?.account.id+'|'+DSession.context()?.scope.id)throw Error('范围已变化');
    const old=loaded.data.rows.find(r=>r.tenantId===c.scope.id&&matching(r,categoryId,source)),selected=new Set(old?.supplierIds||[]),esc=DUI.escape||((s)=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x])));
    const controls=ai.suppliers.filter(s=>s.status==='enabled').map(s=>'<label class="field"><span><input type="checkbox" name="category-ai-supplier" value="'+esc(s.id)+'" '+(selected.has(s.id)?'checked':'')+'> '+esc(s.name)+'</span></label>').join('');
    let dirty=false,saving=false,pending=null,dialog;
    const finish=proceed=>{DApp.setDraftGuard(null);dialog.close();proceed?.();};
    async function submit(){if(saving||!dialog.element.isConnected)return false;if(identity!==DSession.context()?.account.id+'|'+DSession.context()?.scope.id)return false;saving=true;const button=dialog.buttons[2];button.disabled=true;
      try{tenantContext();if(pending){const latest=load().data.rows.find(r=>r.tenantId===pending.tenantId&&matching(r,categoryId,source));if(JSON.stringify(latest)!==JSON.stringify(pending))throw Error('尚未查到可确认的本次关联，请继续核对。');}else{const ids=[...dialog.element.querySelectorAll('input[name="category-ai-supplier"]:checked')].map(n=>n.value);await save(categoryId,source,{supplierIds:ids},loaded.raw);}dirty=false;pending=null;finish();DUI.toast('AI标签配置关联已保存');return true;
      }catch(error){dialog.element.querySelector('#category-ai-error').textContent=error.message;if(error.pendingRow){pending=error.pendingRow;dialog.element.querySelectorAll('input').forEach(n=>n.disabled=true);button.textContent='核对本次结果';}return false;}finally{saving=false;if(button.isConnected)button.disabled=false;}}
    const leave=proceed=>{if(saving)return;if(dirty||pending)return DApp.leave(DSession.page(DApp.currentPage()),()=>finish(proceed));finish(proceed);};
    dialog=DUI.dialog('AI标签配置引用','<p>关联当前租户的标准标签及所选供应商映射。标签内容在AI标签配置菜单集中维护。</p>'+controls+'<p id="category-ai-error" role="alert"></p>',[{label:'取消',run:()=>leave()},{label:'查看标签',run:()=>leave(()=>DApp.openPage('PAGE-2111',{nativeOptions:{unifiedCategoryId:categoryId,unifiedCategoryScope:source.legacy?'tenant':'brand'}}))},{label:'保存关联',primary:true,run:submit}]);
    dialog.element.addEventListener('change',()=>{dirty=true;});DApp.setDraftGuard({isDirty:()=>dirty||saving||!!pending,discard:()=>{if(saving||pending)throw Error('本次关联仍在核对，请先确认结果。');dialog.close();},save:submit});
  }catch(e){DUI.toast(e.message);}}
  window.DCategoryLinks={key,load,review,save,open};
})();
