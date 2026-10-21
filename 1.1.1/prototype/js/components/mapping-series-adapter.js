/** Mapping bare-array adapter for the authorized local demonstration. No network. */
(function (root) {
  'use strict';
  const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
  const plain=value=>!!value&&Object.prototype.toString.call(value)==='[object Object]';
  const nonempty=value=>typeof value==='string'&&!!value.trim();
  const copy=value=>JSON.parse(JSON.stringify(value));
  const requestKeys=['media_id','car_state','brand_id','is_nev_car_type_flag'];
  function requestParams(params) {
    if(!plain(params)||Object.getOwnPropertySymbols(params).length||Object.getOwnPropertyNames(params).some(key=>!requestKeys.includes(key)))return {ok:false,message:'入参字段名与Mapping车系接口不匹配，请核对配置'};
    const request={};
    for(const key of requestKeys){
      let value=own(params,key)?params[key]:undefined;
      if(value===undefined||value===''){
        if(key==='media_id')value=10;else if(key==='car_state')value=1;else continue;
      }
      if(typeof value==='string'&&/^-?\d+$/.test(value))value=Number(value);
      if(!Number.isSafeInteger(value))return {ok:false,message:'Mapping车系接口参数 '+key+' 必须是有效整数；仅未填写时使用默认值'};
      if(key==='is_nev_car_type_flag' && ![0,1].includes(value))return {ok:false,message:'Mapping车系接口参数 is_nev_car_type_flag 只能为 0 或 1'};
      request[key]=value;
    }
    return {ok:true,request};
  }
  async function query(options={}) {
    let meta={source:'mapping-series-structure-mock',namespace:'MAPPING_SERIES_DEMO',simulated:true,productionContractVerified:false,
      method:'GET',relativePath:'/mapping/api/open/mapping-car-series/code',pagination:false,mappedSeriesOnly:true};
    const failure=message=>({ok:false,complete:false,items:[],message,meta:copy(meta)});
    try {
      if(!plain(options))return failure('Mapping车系查询选项无效');
      const {params={},scenario='normal',scope,rename}=options;
      const current=options.isCurrent===undefined?()=>true:options.isCurrent;
      if(typeof current!=='function'||!current())return failure('来源或当前工作范围已变化，请重新查询');
      if(!plain(scope)||!nonempty(scope.tenantId)||!nonempty(scope.enterpriseId))return failure('Mapping车系查询的当前工作范围不完整');
      const normalized=requestParams(params);if(!normalized.ok)return failure(normalized.message);
      meta.request=copy(normalized.request);meta.scenario=scenario;
      const fixture=root.MappingSeriesMock;
      if(!fixture||fixture.namespace!=='MAPPING_SERIES_DEMO'||typeof fixture.list!=='function')return failure('Mapping车系模拟组件未加载，请刷新后重试');
      if(!fixture.scenarios?.some(row=>row.id===scenario))return failure('Mapping车系模拟场景无效');
      if(rename!==undefined&&typeof rename!=='function')return failure('Mapping车系名称模拟设置无效');
      const response=await fixture.list(copy(normalized.request),scenario,{tenantId:scope.tenantId,enterpriseId:scope.enterpriseId});
      if(!current())return failure('来源或当前工作范围已变化，请重新查询');
      if(!Array.isArray(response))return failure('Mapping车系返回结构异常：应为裸数组，当前未提供候选');
      const byId=new Map();
      for(const raw of response){
        if(!plain(raw)||!['name','relation_id','car_state','media_car_series_id'].every(key=>own(raw,key))||!nonempty(raw.name)||!Number.isSafeInteger(raw.relation_id)||!Number.isSafeInteger(raw.car_state)||!nonempty(raw.media_car_series_id))return failure('Mapping车系记录字段异常，当前未提供候选');
        const original={name:raw.name,relation_id:raw.relation_id,car_state:raw.car_state,media_car_series_id:raw.media_car_series_id},code=String(raw.relation_id);
        if(byId.has(code)){
          if(JSON.stringify(byId.get(code))!==JSON.stringify(original))return failure('Mapping车系数据冲突：官方ID '+code+' 对应不同映射，当前未提供候选');
          continue;
        }
        byId.set(code,original);
      }
      if([...byId.values()].some(row=>row.car_state!==normalized.request.car_state))return failure('Mapping车系返回范围异常：原始状态与本次查询条件不一致，当前未提供候选');
      const items=[...byId.entries()].map(([code,raw])=>{
        const changed=rename?.(code);
        if(changed!==undefined&&changed!==null&&changed!==''&&!nonempty(changed))throw Error('mapping-demo-name');
        const sourceValues={...raw,name:changed || raw.name};
        return {code,name:sourceValues.name,...sourceValues,sourceValues:copy(sourceValues)};
      });
      if(!current())return failure('来源或当前工作范围已变化，请重新查询');
      meta.returnedRows=response.length;meta.uniqueRows=items.length;
      return {ok:true,complete:true,items,message:items.length?'':'当前映射范围暂无可选车系',meta:copy(meta)};
    } catch (error) {return failure(error?.message==='mapping-demo-unsupported-scope' ? '该筛选范围暂无模拟资料，请使用已登记的媒体和状态范围且不附加品牌或能源过滤' : 'Mapping车系查询未完成，当前填写已保留，请重试');}
  }
  root.MappingSeriesAdapter=Object.freeze({query});
})(window);
