/** Independent supplier-shaped fixtures. No network or resource provisioning. */
(function(){
  'use strict';
  const rows=()=>(CloudCallData.numberIntakePool||[]).map((p,index)=>({
    poolId:p.id,enterpriseIds:Array.isArray(p.enterpriseIds)?p.enterpriseIds:[p.enterpriseId].filter(Boolean),
    number:p.alictiNumber||{id:983001+index,hotline:p.number,displayNumber:p.number,numberType:String(p.number).startsWith('400')?1:2,status:1,
      isIbRight:1,isInUse:String(p.number).startsWith('400')?0:1,isPredictiveLeft:String(p.number).startsWith('400')?0:1,
      isPredictiveRight:0,isPreviewRight:0,isIntl:0,isSipLeft:0,isWebCallLeft:0,isWebCallRight:0}
  }));
  // Independent account-level rows include enabled, disabled and already-managed examples.
  const extra=Array.from({length:12},(_,i)=>({enterpriseId:i===11?'DEMO-ENT-003':i>=6?'7522241':'7522240',number:{id:984100+i,hotline:i===0?'02100006101':i===1?'4000009201':'02100009'+String(201+i),displayNumber:i===0?'02100006101':i===1?'4000009201':'02100009'+String(201+i),numberType:i===1?1:2,status:i===2?0:1,isIbRight:1,isInUse:i===1?0:1,isPredictiveLeft:i===1?0:1,isPredictiveRight:0,isPreviewRight:0,isIntl:0,isSipLeft:0,isWebCallLeft:0,isWebCallRight:0,areaCode:'021',trunkGroupKey:'DEMO-TRUNK-A',label:[],createTime:1789142400000}}));
  window.NumberOnboardingMock={list(enterpriseId,query={}){
    const all=rows().filter(r=>r.enterpriseIds.includes(enterpriseId)).map(r=>structuredClone(r.number)).concat(extra.filter(r=>r.enterpriseId===enterpriseId).map(r=>structuredClone(r.number)));
    const offset=Number.isInteger(query.offset)&&query.offset>=0?query.offset:0,limit=Number.isInteger(query.limit)&&query.limit>0?Math.min(query.limit,1000):100;
    const filtered=all.filter(r=>(!query.number||r.hotline===query.number)&&(query.status===undefined||Number(r.status)===Number(query.status)));
    const items=window.PlatformUI?.sortByUpdated?.(filtered)||filtered;
    const body={offset,limit,...(query.number?{number:query.number}:{}),...(query.status===undefined?{}:{status:Number(query.status)})};
    const outcome=CloudCallData.numberOnboardingDemo?.importOutcome||'success';
    return {request:{endpoint:'/interface/v10/enterpriseHotline/listPage',method:'POST',fields:AliCtiFields.authFields(enterpriseId).fields,body},
      response:outcome==='timeout'?null:outcome==='failure'?{result:-1,description:'查询失败'}:{result:0,totalCount:String(items.length),pageSize:String(limit),data:items.slice(offset,offset+limit)},mock:true};
  }};
})();
