/** Synthetic Mapping response shapes only; no production master data or network. */
(function (root) {
  'use strict';
  const namespace='MAPPING_SERIES_DEMO';
  const rows=Object.freeze([
    Object.freeze({name:'映射演示车系甲（虚构）',relation_id:910001,car_state:1,media_car_series_id:'DEMO-MEDIA-SERIES-A'}),
    Object.freeze({name:'映射演示车系乙（虚构）',relation_id:910002,car_state:1,media_car_series_id:'DEMO-MEDIA-SERIES-B'}),
    Object.freeze({name:'映射演示车系丙（虚构）',relation_id:910003,car_state:1,media_car_series_id:'DEMO-MEDIA-SERIES-C'}),
    Object.freeze({name:'映射演示车系零（虚构）',relation_id:910004,car_state:0,media_car_series_id:'DEMO-MEDIA-SERIES-ZERO'})
  ]);
  const scenarios=Object.freeze([
    {id:'normal',label:'正常映射数组'},{id:'empty',label:'完整返回空数组'},
    {id:'failure',label:'请求异常'},{id:'partial',label:'传输未完成'},
    {id:'delay',label:'延迟返回（观察旧请求失效）'},
    {id:'conflict',label:'相同官方ID映射冲突'},{id:'malformed',label:'返回结构异常'}
  ].map(Object.freeze));
  const copy=value=>JSON.parse(JSON.stringify(value));
  function list(request,scenario='normal',scope) {
    return new Promise((resolve,reject)=>root.setTimeout(()=>{
      if(!scope?.tenantId || !scope?.enterpriseId || !scenarios.some(row=>row.id===scenario) || !request ||
        !Number.isSafeInteger(request.media_id) || !Number.isSafeInteger(request.car_state)) return reject(Error('mapping-demo-context'));
      if(request.media_id!==10 || Object.hasOwn(request,'brand_id') || Object.hasOwn(request,'is_nev_car_type_flag') || !rows.some(row=>row.car_state===request.car_state))return reject(Error('mapping-demo-unsupported-scope'));
      if(scenario==='failure'||scenario==='partial')return reject(Error(scenario==='partial'?'mapping-demo-incomplete':'mapping-demo-transport'));
      const result=scenario==='empty'?[]:copy(rows.filter(row=>row.car_state===request.car_state));
      if(scenario==='conflict'&&result.length)result.push({...result[0],media_car_series_id:'DEMO-CONFLICTING-MEDIA-ID'});
      if(scenario==='malformed')return resolve({data:result});
      resolve(result);
    },scenario==='delay'?700:60));
  }
  root.MappingSeriesMock=Object.freeze({namespace,scenarios,list,rows:()=>copy(rows)});
})(window);
