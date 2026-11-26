/* A tenant selects a verified dealer identity; this editor does not own dealer data. */
(() => {
  'use strict';
  const service=()=>window.DFoundationDealerSource;
  const e=value=>window.DUI.esc(value ?? '');
  const identity=context=>JSON.stringify([context?.account?.id,context?.scope?.id,context?.scope?.tenant?.brandId]);
  function fields() {
    return '<div class="field full tenant-store-selector" data-tenant-store-selector>'+ 
      '<h3>关联门店</h3><p class="field-hint">用于按品牌和真实门店编码匹配内部接收租户。先查询已登记的门店接口，再选择真实门店；不按名称猜测。</p>'+
      '<p data-tenant-store-existing class="field-hint"></p><div class="tenant-store-query">'+
      '<label class="field"><span>门店取数接口</span><select data-tenant-store-source disabled><option value="">正在读取来源…</option></select></label>'+
      '<button type="button" class="btn" data-tenant-store-query disabled>查询关联门店</button></div>'+
      '<label class="field"><span>筛选门店</span><input data-tenant-store-filter placeholder="按编码或名称筛选" disabled></label>'+
      '<label class="field"><span>选择关联门店</span><select data-tenant-store-candidate disabled><option value="">请先查询门店</option></select></label>'+
      '<p class="field-hint" data-tenant-store-status role="status"></p></div>';
  }
  function mount({root,tenant={},info={},canBind=false,onChange=()=>{}}) {
    const host=root.querySelector('[data-tenant-store-selector]');
    if(!host)return {read:()=>null,dispose:()=>{}};
    const opening=window.DSession.context(),scope=identity(opening),originalCode=info.storeCode || '';
    const brand=root.querySelector('#tenant-brand'),organization=root.querySelector('#tenant-organization'),code=root.querySelector('#tenant-code');
    const source=host.querySelector('[data-tenant-store-source]'),query=host.querySelector('[data-tenant-store-query]'),
      candidate=host.querySelector('[data-tenant-store-candidate]'),filter=host.querySelector('[data-tenant-store-filter]'),
      status=host.querySelector('[data-tenant-store-status]'),existing=host.querySelector('[data-tenant-store-existing]');
    let sources=[],items=[],selection=null,sequence=0,reading=false,disposed=false;
    const active=()=>!disposed&&root.isConnected&&identity(window.DSession.context())===scope;
    const currentBrand=()=>brand.value;
    const sameBrand=()=>opening?.scope?.kind==='tenant'&&currentBrand()===opening.scope.tenant?.brandId;
    const permitted=()=>active()&&canBind&&organization.value==='门店'&&sameBrand();
    const cancel=()=>{try{service()?.cancel(opening);}catch(_){}selection=null;items=[];sequence++;};
    const restore=()=>{code.value=originalCode;candidate.innerHTML='<option value="">'+(originalCode?'保留原门店关联':'暂不关联')+'</option>';candidate.disabled=true;filter.value='';filter.disabled=true;};
    function available() {source.disabled=!permitted()||reading;query.disabled=!permitted()||reading||!sources.some(row=>row.id===source.value);}
    function renderCandidates(){
      const keyword=filter.value.trim().toLowerCase();
      const visible=items.filter(item=>!keyword||[item.code,item.name,item.province,item.city,item.region].some(value=>String(value||'').toLowerCase().includes(keyword)));
      const selected=selection?.code || '';
      const selectedRow=items.find(item=>item.code===selected);
      if(selectedRow&&!visible.some(item=>item.code===selected))visible.unshift(selectedRow);
      candidate.innerHTML='<option value="">'+(originalCode?'保留原门店关联':'暂不关联')+'</option>'+visible.map(item=>'<option value="'+e(item.code)+'"'+(selected===item.code?' selected':'')+'>'+e(item.name)+'（'+e(item.code)+'）</option>').join('');
    }
    async function readSources(){
      cancel();restore();sources=[];available();
      if(!permitted()) {
        source.innerHTML='<option value="">暂不可选择</option>';
        status.textContent=!canBind?'当前账号无门店关联维护权限，原关联保留。':organization.value!=='门店'?'总部租户无需关联门店。':
          !currentBrand()?'请先选择归属品牌，再查询关联门店。':
          '请先在顶部切换到该品牌的业务租户，再读取门店来源；当前可先保存基础资料。';return;
      }
      const request=++sequence;reading=true;available();status.textContent='正在读取当前品牌已登记门店接口…';
      let result;try{result=await service()?.list(opening);}catch(_){}
      if(!active()||request!==sequence)return;
      reading=false;sources=result?.ok&&Array.isArray(result.sources)?result.sources:[];
      source.innerHTML='<option value="">请选择门店取数接口</option>'+sources.map(row=>'<option value="'+e(row.id)+'">'+e(row.label||row.name)+'</option>').join('');
      const previous=tenant.storeBinding?.externalSource?.dictionaryId;
      if(sources.some(row=>row.id===previous))source.value=previous;else if(sources.length===1)source.value=sources[0].id;
      status.textContent=result?.ok?(sources.length?'请选择来源后查询门店候选；保存前会再次核验来源。':'暂无可用门店来源，原关联保留；请由有权人员维护当前品牌取数接口。'):
        result?.message||result?.error||'门店来源暂不可读取，原关联保留。';available();
    }
    source.onchange=()=>{cancel();restore();reading=false;status.textContent='来源已切换，请重新查询并选择门店；未选择时保留原关联。';available();};
    query.onclick=async()=>{
      if(!permitted()||reading||!sources.some(row=>row.id===source.value))return;
      cancel();restore();const request=++sequence,sourceId=source.value;reading=true;available();status.textContent='正在查询完整门店候选…';
      let result;try{result=await service()?.query(opening,sourceId);}catch(_){}
      if(!active()||request!==sequence||source.value!==sourceId)return;
      reading=false;
      if(!result?.ok||result.complete!==true||!Array.isArray(result.items)||result.items.length&&!result.proof){status.textContent=result?.message||result?.error||'门店查询未完整成功，原关联保留。';available();return;}
      items=result.items;filter.disabled=!items.length;candidate.disabled=!items.length;renderCandidates();
      host.dataset.selectionProof=result.proof || '';
      status.textContent=items.length?'已完整读取 '+items.length+' 家门店，选择后保存关联。':'接口完整返回 0 家门店，原关联保留。';available();
    };
    filter.oninput=renderCandidates;
    candidate.onchange=()=>{
      selection=null;code.value=originalCode;
      if(!candidate.value){status.textContent=originalCode?'保留原关联门店。':'暂未关联门店，不能自动匹配内部下发。';onChange();return;}
      try {
        const selected={proof:host.dataset.selectionProof,code:candidate.value},result=service()?.resolve(opening,selected);
        if(!result?.ok||result.reference?.externalSource?.brandId!==currentBrand())throw Error(result?.message || '所选门店与当前租户品牌不一致。');
        selection=selected;code.value=result.item.code;
        status.textContent='已选择 '+result.item.name+'（'+result.item.code+'）。'+(info.hasBusinessData!==false&&originalCode&&originalCode!==result.item.code?'此租户已有业务或引用待核，不能更换原关联。':'保存时将再次核验来源及同品牌唯一性。');onChange();
      }catch(error){candidate.value='';status.textContent=error.message;}
    };
    function scopeChanged(){cancel();reading=false;host.hidden=organization.value!=='门店';void readSources();onChange();}
    brand.addEventListener('change',scopeChanged);organization.addEventListener('change',scopeChanged);
    const observer=new MutationObserver(()=>{if(!active())dispose();});
    observer.observe(document.getElementById('dialog-root'),{childList:true,subtree:true});
    function dispose(){if(disposed)return;cancel();disposed=true;observer.disconnect();brand.removeEventListener('change',scopeChanged);organization.removeEventListener('change',scopeChanged);}
    existing.textContent=originalCode?'原关联：'+(tenant.storeBinding?.storeName || '门店名称未登记')+'（'+originalCode+'）。未重新选择时保持原值。':
      '尚未关联门店，可先保存租户基础资料；内部下发自动匹配前需补齐关联。';
    host.hidden=organization.value!=='门店';void readSources();
    return {read(){
      if(!active())throw Error('租户或账号已变化，请重新打开资料。');
      if(reading)throw Error('门店查询尚未完成，请稍后保存。');
      if(!selection)return null;
      if(!permitted())throw Error('所选门店品牌或组织类型已变化，请重新选择。');
      const result=service()?.resolve(window.DSession.context(),selection);
      if(!result?.ok||result.reference?.externalSource?.brandId!==currentBrand())throw Error(result?.message || '门店来源已变化，请重新查询。');
      return {...selection};
    },dispose};
  }
  window.DTenantStoreSelector=Object.freeze({fields,mount});
})();
