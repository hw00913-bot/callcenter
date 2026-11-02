/* Non-persistent directory projection; legacy scene/tag data is never rewritten by a read. */
(function(){
  'use strict';
  let rows=[],scopeStamp='',loaded=false,error='',selection=null;
  const stamp=()=>{const c=parent.DSession.context();return c?.account.id+'|'+c?.scope.id;};
  const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  async function refresh(options={}){const before=stamp();const result=await parent.DModuleHost.readCatalog({legacy:options.unifiedCategoryScope==='tenant'});if(before!==stamp())throw Error('使用范围已变化，请重新打开');if(!result.ok)throw Error(result.message||'业务分类无法读取');rows=parent.DUnifiedCategories.aiRows(result.rows);scopeStamp=before;loaded=true;error='';return rows;}
  function scenes(){return loaded&&scopeStamp===stamp()?rows:[];}
  function filterOptions(){return scenes().map(s=>'<option value="'+esc(s.categoryId)+'">'+esc(s.name)+'</option>').join('');}
  function matches(row,id){return row.unifiedCategoryId?row.unifiedCategoryId===id:parent.DUnifiedCategories.definitions.some(d=>d.id===id&&d.label===row.category);}
  function sceneOptions(checked){
    const list=scenes(),found=list.find(s=>s.categoryId===checked||s.name===checked);
    let html=list.filter(s=>s.status==='enabled').map(s=>'<label class="biz-radio"><input type="radio" name="sceneType" data-category-id="'+esc(s.categoryId)+'" value="'+esc(s.name)+'"'+(found?.id===s.id?' checked':'')+' onchange="window.Pages[\'sys-scene\'].onSceneTypeChange()"><span>'+esc(s.name)+'</span></label>').join('');
    if(checked&&(!found||found.status==='disabled')){
      if(checked==='首访')html+='<p>首访（历史原值，仅保留，不再提供新选择）</p>';
      else html+='<label class="biz-radio"><input type="radio" name="sceneType" data-legacy="true" '+(found?'data-category-id="'+esc(found.categoryId)+'" ':'')+'value="'+esc(found?.name||checked)+'" checked disabled><span>'+esc(found?.name||checked)+'（原配置保留）</span></label>';
    }
    return html;
  }
  function registerContexts(data){
    const tags=data.tags;if(!tags||!Array.isArray(tags.MockTagScenes))return;
    for(const row of scenes()){
      if(tags.MockTagScenes.some(s=>s.id===row.id))continue;
      const referenced=Object.keys(tags.MockTagConfigs).some(k=>tags.MockTenantTypes.some(t=>tags.MockTagSuppliers.some(s=>k===s.id+'_'+t.id+'_'+row.id)))||tags.MockTenantTypes.some(t=>(tags.MockLocalTagSets[t.id+'_'+row.id]||[]).length);
      if(referenced)tags.MockTagScenes.push({id:row.id,name:row.name,localCode:row.localCode,status:row.status});
    }
  }
  function routingContexts(){
    const c=parent.DSession.context();if(c?.scope.kind!=='tenant'||!parent.DSession.allowed('PAGE-2111'))return [];
    const checked=DAIConfigStore.reviewCurrent();if(!checked.ok)throw Error(checked.reason);
    const live=parent.DModuleHost.currentCatalog?.();if(live&&!live.ok)throw Error(live.message||'当前分类目录无法核定');
    const defs=parent.DUnifiedCategories.definitions,current=(live?parent.DUnifiedCategories.aiRows(live.rows):scenes()).filter(s=>s.status==='enabled'),tuples=[];
    for(const relation of parent.DSeed.aiSceneRelations||[]){
      if(relation.tenantId!==c.scope.id)continue;
      const category=defs.find(d=>d.tagId===relation.tagSceneId);if(category)tuples.push({...relation,categoryId:category.id});
    }
    const explicit=parent.DCategoryLinks.load().data.rows.filter(r=>r.tenantId===c.scope.id&&r.categoryScope==='brand'&&r.brandId===c.scope.tenant.brandId);
    for(const row of explicit)for(const supplierId of row.supplierIds)tuples.push({...row,supplierId});
    const seen=new Set(),out=[];
    for(const tuple of tuples){
      const category=current.find(d=>d.categoryId===tuple.categoryId);if(!category||category.id!==tuple.tagSceneId)continue;
      const supplier=MockTagSuppliers.find(s=>s.id===tuple.supplierId&&s.status==='enabled');if(!supplier)continue;
      const k=supplier.id+'_'+tuple.tenantType+'_'+tuple.tagSceneId,local=MockLocalTagSets[tuple.tenantType+'_'+tuple.tagSceneId]||[],pool=MockSupplierTagPool[supplier.id]||[],config=MockTagConfigs[k],mapping=MockSupplierLocalTagMappings[k]||{};
      if(!config||!Array.isArray(config.enabledTagIds))continue;
      const tags=local.map(t=>({id:t.id,label:t.name,supplierTagIds:config.enabledTagIds.filter(id=>pool.some(p=>p.id===id)&&mapping[id]===t.id)})).filter(t=>t.supplierTagIds.length);
      if(!tags.length)continue;
      const identity=[c.scope.id,supplier.id,tuple.tenantType,tuple.tagSceneId].join('|');if(seen.has(identity))continue;seen.add(identity);
      out.push({categoryId:category.categoryId,brandId:c.scope.tenant.brandId,tenantId:c.scope.id,supplierId:supplier.id,supplierLabel:supplier.name,tenantType:tuple.tenantType,tagSceneId:tuple.tagSceneId,revision:checked.revision,tags});
    }
    return out;
  }

  window.DUnifiedAI={scenes,sceneOptions,filterOptions,matches,refresh,registerContexts,afterInit(){if(!selection)return false;const target=selection;selection=null;Pages['sys-tags'].integrationSelect(target.sceneId,target.tenantType);return true;},preserveLegacy(input,platform,id,source){const old=source.find(s=>s.id===id);return !!old&&old.platform===platform&&old.category===input.value&&input.dataset.legacy==='true';},configuration(){if(!DAIConfigStore.ready())throw Error(DAIConfigStore.error());const c=parent.DSession.context();if(stamp()!==DNativeContext.context.account.id+'|'+DNativeContext.context.scope.id||!parent.DSession.allowed('PAGE-2111'))throw Error('无此租户标签配置权限');const checked=DAIConfigStore.reviewCurrent?.();if(checked&&!checked.ok)throw Error(checked.reason||'AI配置版本待核');return {suppliers:JSON.parse(JSON.stringify(MockTagSuppliers)),tenantId:c.scope.id,fingerprint:localStorage.getItem(DAIConfigStore.key),routingContexts:routingContexts()};}};
  const original=DAdapter.navigate;let request=0;
  DAdapter.navigate=function(route,options={}){
    const id=++request,before=stamp();selection=null;
    if(!['sys-tags','sys-scene'].includes(route))return original(route,options);
    document.getElementById('page-content').textContent='正在读取业务分类…';
    refresh(options).then(()=>{if(id!==request||before!==stamp())return;if(route==='sys-tags'&&options.unifiedCategoryId){const c=parent.DSession.context(),s=scenes().find(s=>s.categoryId===options.unifiedCategoryId);if(!s)throw Error('指定业务分类已失效，请从业务分类重新打开');selection={sceneId:s.id,tenantType:c.scope.tenant.organization==='总部'?'headquarters':'store'};}return original(route,options);}).catch(e=>{if(id!==request||before!==stamp())return;error=e.message;document.getElementById('page-content').textContent=error;});return true;
  };
  Pages['sys-tags'].openSceneModal=function(){showToast('分类请在业务分类菜单统一维护','info');};
})();
