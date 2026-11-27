/* Real dictionary-backed dealer candidates, plus non-customer configuration
 * references for the native interface usage/freshness guard. No seed fallback. */
(() => {
  'use strict';
  const issued=new Map(),generations=new Map();let serial=0;
  const text=value=>typeof value==='string'?value.trim():'';
  const object=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
  const copy=value=>JSON.parse(JSON.stringify(value));
  const fail=message=>({ok:false,complete:false,items:[],error:message,message});
  const validCode=value=>typeof value==='string'&&value===value.trim()&&value.length>0&&value.length<=200&&!/[\u0000-\u001f\u007f]/.test(value);
  function scopeFor(context) {
    const current=window.DSession?.context?.();
    if(!current||current.account?.id!==context?.account?.id||current.scope?.id!==context?.scope?.id||
        current.scope?.tenant?.brandId!==context?.scope?.tenant?.brandId||
        String(current.scope?.tenant?.enterpriseId||'')!==String(context?.scope?.tenant?.enterpriseId||'')||
        current.scope.kind!=='tenant'||current.scope.tenant?.enabled!==true||!text(current.scope.tenant.brandId))return null;
    return {accountId:current.account.id,tenantId:current.scope.id,brandId:current.scope.tenant.brandId,
      enterpriseId:String(current.scope.tenant.enterpriseId||'')};
  }
  const identity=scope=>JSON.stringify([scope.accountId,scope.tenantId,scope.brandId,scope.enterpriseId]);
  function cancel(context=window.DSession?.context?.()) {
    const scope=scopeFor(context);if(!scope)return {ok:false};const key=identity(scope);
    generations.set(key,(generations.get(key)||0)+1);
    for(const [proof,item]of issued)if(item.identity===key)issued.delete(proof);
    return {ok:true};
  }
  function begin(context) {cancel(context);const scope=scopeFor(context);return scope?{scope,key:identity(scope),generation:generations.get(identity(scope))}:null;}
  function active(context,request) {const scope=scopeFor(context);return !!scope&&identity(scope)===request.key&&
    generations.get(request.key)===request.generation&&window.DSession?.allowed?.('PAGE-21007',context)===true&&
    window.DSession?.allowed?.('PAGE-2223',context)===true;}
  function native(context) {
    const scope=scopeFor(context),frame=window.document?.querySelector?.('iframe[data-native-module="cloud"]'),root=frame?.contentWindow;
    const owner=root?.DNativeContext?.context;
    if(!scope||!root?.BusinessData||owner?.account?.id!==scope.accountId||owner?.scope?.id!==scope.tenantId||
        owner.scope.tenant?.brandId!==scope.brandId||String(owner.scope.tenant?.enterpriseId||'')!==scope.enterpriseId)throw Error('取数接口身份或品牌范围已变化，请重新读取。');
    return {root,model:root.BusinessData,scope};
  }
  async function ready(context,request) {
    if(!window.DSession?.allowed?.('PAGE-21007',context)||!window.DSession?.allowed?.('PAGE-2223',context))throw Error('当前账号没有赛马门店来源读取权限。');
    if(!window.DModuleHost?.prepareIntegration)throw Error('取数接口字典尚未就绪。');
    await window.DModuleHost.prepareIntegration();
    if(!active(context,request))throw Error('查询已取消或当前范围已变化。');
    return native(context);
  }
  function selected(model,scope,id) {
    const row=model.entry?.(id),capability=model.capability?.(row?.capabilityId),usageScope={tenantId:scope.tenantId,enterpriseId:scope.enterpriseId};
    if(!row||row.enabled!==true||row.brandId!==scope.brandId||capability?.kind!=='store'||
        capability.queryConditions?.some(condition=>condition.required===true)||!model.available?.(id,usageScope))throw Error('所选接口不是当前品牌可全量查询的已启用门店来源。');
    const version=model.sourceVersion?.(id,usageScope);
    if(typeof version!=='string'||!version)throw Error('门店接口当前来源版本无法核对。');
    return {id:row.id,name:row.name,capabilityId:row.capabilityId,brandId:scope.brandId,tenantId:scope.tenantId,version};
  }
  async function list(context=window.DSession?.context?.()) {
    const request=begin(context);if(!request)return fail('当前账号、租户或品牌无法核对。');
    try {
      const {model,scope}=await ready(context,request),state=model.catalogState?.();
      if(!state?.ok)throw Error(state?.message||'取数接口目录读取失败。');
      const sources=[];
      for(const row of state.entries||[])try {
        const source=selected(model,scope,row.id);sources.push({id:source.id,name:source.name,capabilityId:source.capabilityId,
          label:source.name+' · '+(model.capability(source.capabilityId)?.label||'门店查询')});
      }catch(_){/* Unavailable and parameter-dependent capabilities are not candidates. */}
      if(!active(context,request))throw Error('来源目录读取已失效。');
      return {ok:true,sources};
    }catch(error){return {...fail(error?.message||'取数接口目录读取失败。'),sources:[]};}
  }
  async function query(context,sourceId) {
    const request=begin(context);if(!request)return fail('当前账号、租户或品牌无法核对。');
    try {
      const {model,scope,root}=await ready(context,request),source=selected(model,scope,sourceId);
      const result=await model.queryOptions(source.id,{}, {tenantId:scope.tenantId,enterpriseId:scope.enterpriseId});
      if(!active(context,request)||native(context).root!==root)throw Error('门店查询已取消或来源范围已变化，请重新查询。');
      const current=selected(model,scope,sourceId);
      if(current.version!==source.version||current.capabilityId!==source.capabilityId)throw Error('门店接口来源版本已变化，请重新查询。');
      if(result?.ok!==true||result.complete!==true||!Array.isArray(result.items))throw Error(result?.message||'门店查询未完整成功，请重试。');
      const byCode=new Map();
      for(const raw of result.items) {
        if(!object(raw)||!validCode(raw.code)||!text(raw.name))throw Error('接口返回的门店编码或名称无法核对，不能作为候选。');
        const item={code:raw.code,name:text(raw.name),province:text(raw.province),city:text(raw.city),region:text(raw.district)||text(raw.region)};
        if(byCode.has(item.code)&&JSON.stringify(byCode.get(item.code))!==JSON.stringify(item))throw Error('接口返回相同编码的门店资料冲突，请核对来源。');
        byCode.set(item.code,item);
      }
      const items=[...byCode.values()];
      if(!items.length)return {ok:true,complete:true,items:[],proof:'',source:copy(source)};
      const proof='dealer-proof-'+(++serial)+'-'+(window.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));
      issued.set(proof,{identity:request.key,generation:request.generation,scope,source:copy(source),items:new Map(items.map(item=>[item.code,copy(item)])),root});
      if(issued.size>100)issued.delete(issued.keys().next().value);
      return {ok:true,complete:true,items:copy(items),proof,source:copy(source)};
    }catch(error){return fail(error?.message||'门店候选读取失败，请重试。');}
  }
  function resolve(context,{proof,code}={}) {
    const item=typeof proof==='string'?issued.get(proof):null,scope=scopeFor(context);
    if(!item||!scope||identity(scope)!==item.identity||generations.get(item.identity)!==item.generation||!validCode(code))return fail('门店选择凭据已失效，请重新查询并选择。');
    try {
      if(!window.DSession?.allowed?.('PAGE-21007',context)||!window.DSession?.allowed?.('PAGE-2223',context))throw Error('当前账号没有此门店来源的读取权限。');
      const current=native(context);if(current.root!==item.root)throw Error('取数接口上下文已变化。');
      const source=selected(current.model,scope,item.source.id);
      if(source.version!==item.source.version||source.capabilityId!==item.source.capabilityId)throw Error('门店接口来源版本已变化。');
      const row=item.items.get(code);if(!row)throw Error('所选门店不属于本次完整查询结果。');
      return {ok:true,item:copy(row),reference:{externalStoreCode:row.code,
        externalSource:{dictionaryId:source.id,dictionaryName:source.name,capabilityId:source.capabilityId,
          sourceVersion:source.version,brandId:scope.brandId,tenantId:scope.tenantId},externalStoreSnapshot:copy(row)}};
    }catch(error){return fail((error?.message||'门店来源无法核对')+' 请重新查询并选择。');}
  }
  function references(id,context=window.DSession?.context?.()) {
    const scope=scopeFor(context);
    if(!scope||!window.DSession?.allowed?.('PAGE-2223',context))return fail('当前品牌的赛马门店引用不可读取。');
    const key='d-contact-210-dcc-dictionary-v1:brand:'+scope.brandId;
    try {
      const raw=localStorage.getItem(key),refs=[];
      const organizationKey=typeof window.DOrganization?.key==='string'?window.DOrganization.key:'';
      const organizationRaw=organizationKey?localStorage.getItem(organizationKey):null;
      let organizationRevision=null;
      if(raw!==null) {
        const state=JSON.parse(raw);
        if(state?.dataset!=='dcc-standalone-full-v1'||!Number.isSafeInteger(state.revision)||state.revision<0||!object(state.state?.dictionary))throw Error();
        const rows=state.state.dictionary.NEV_TEST_DRIVE_DEALER;
        if(rows!==undefined&&!Array.isArray(rows))throw Error();
        for(const row of rows||[]) {
          if(!object(row)||!validCode(row.code))throw Error();
          if(row.externalSource==null)continue;
          const source=row.externalSource;
          if(!object(source)||!text(source.dictionaryId)||source.brandId&&source.brandId!==scope.brandId)throw Error();
          if(source.dictionaryId!==id)continue;
          refs.push({kind:'configuration',brandId:scope.brandId,source:'foundation-dealer',sourceLabel:'品牌基础字典·赛马门店',
            objectId:row.code,dictionaryItemCode:row.code,blocking:true,
            message:'品牌赛马门店配置「'+(text(row.name)||row.code)+'」引用此取数接口（含停用项）'});
        }
      }
      if(organizationRaw!==null) {
        const organization=JSON.parse(organizationRaw);
        if(organization?.version!==1||!Number.isSafeInteger(organization.revision)||organization.revision<0||!Array.isArray(organization.tenants))throw Error();
        organizationRevision=organization.revision;const seen=new Set();
        for(const tenant of organization.tenants) {
          if(!object(tenant))throw Error();
          if(tenant.storeBinding==null)continue;
          if(!text(tenant.brandId))throw Error();
          if(tenant.brandId!==scope.brandId)continue;
          const binding=tenant.storeBinding,source=binding.externalSource;
          if(!text(tenant.id)||seen.has(tenant.id)||tenant.organization!=='门店'||!object(binding)||
              !validCode(binding.externalStoreCode)||!object(source)||!text(source.dictionaryId)||source.brandId!==scope.brandId||
              Object.hasOwn(tenant,'storeCode')&&tenant.storeCode!==binding.externalStoreCode)throw Error();
          seen.add(tenant.id);
          if(source.dictionaryId!==id)continue;
          refs.push({kind:'configuration',brandId:scope.brandId,source:'tenant-store-binding',sourceLabel:'租户关联门店',
            objectId:tenant.id,tenantId:tenant.id,storeCode:binding.externalStoreCode,blocking:true,
            message:'门店租户「'+(text(tenant.name)||tenant.id)+'」的关联门店（'+binding.externalStoreCode+'）引用此取数接口（含停用租户）'});
        }
      }
      // Usage fingerprints need fresh organization bytes, not account/profile contents.
      let organizationDigest=null;
      if(organizationRaw!==null){let first=2166136261,second=5381;for(let index=0;index<organizationRaw.length;index++){
        const value=organizationRaw.charCodeAt(index);first=Math.imul(first^value,16777619);second=Math.imul(second,33)^value;
      }organizationDigest=[organizationRaw.length,(first>>>0).toString(16),(second>>>0).toString(16)];}
      return {ok:true,refs,fingerprint:JSON.stringify([key,raw,organizationKey,organizationRevision,organizationDigest])};
    }catch(_){return {...fail('门店配置引用存储无法完整核对，暂不能删除或更换来源能力。'),refs:[],fingerprint:''};}
  }
  window.DSession?.subscribe?.(()=>{issued.clear();for(const key of generations.keys())generations.set(key,generations.get(key)+1);});
  window.DFoundationDealerSource=Object.freeze({list,query,resolve,references,cancel});

  const cloud=window.DNativeModules?.cloud;
  if(cloud) {
    let html=cloud.html;const marker='  const reviews=new Map();let sequence=0;',start=html.indexOf(marker),end=html.indexOf('root.BusinessConfigurationUsage=Object.freeze',start);
    if(start<0||end<0)throw Error('无法定位取数接口引用核对链。');
    const before=html.slice(start,end),needle='    let encoded;';
    if(before.indexOf(needle)<0||before.indexOf(needle)!==before.lastIndexOf(needle))throw Error('取数接口引用签名位置已变化。');
    const injected=before.replace(needle,String.raw`    if(kind==='interface') {
      let extra;try {extra=root.parent?.DFoundationDealerSource?.references?.(id,root.DNativeContext?.context);}catch(_){}
      if(!extra?.ok)issue('赛马门店接口引用');
      else {
        readSet.push(['赛马门店接口引用',extra.fingerprint]);
        for(const ref of extra.refs||[])refs.set(JSON.stringify([ref.source||'foundation-dealer',ref.brandId,ref.tenantId||'',ref.dictionaryItemCode||ref.objectId]),{...ref,blocking:true});
      }
    }
`+needle);
    cloud.html=html.slice(0,start)+injected+html.slice(end);
  }
})();
