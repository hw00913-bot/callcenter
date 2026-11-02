/* Project condition namespaces. Raw provider evidence is retained; these lists are not production receipts.
 * AI: original result-records.js DccStatusList; Wiki lib-通话状态码.
 * Cloud: Tianrun official customer-side SIP/called-result dictionary (200, 710-724).
 */
(function(root){
  'use strict';
  const statuses=(rows)=>rows.map(([value,label])=>({value:String(value),label}));
  root.DFlowStatusDomains=Object.freeze([
    {id:'DCC_LOCAL_LABEL',channel:'AI',label:'AI · 原DCC归并通话结果',provider:'DCC',field:'status',statuses:statuses(['已接通','秒挂','伪接通','无人接听','占线','拒接','空号','关机','停机','欠费','无法接通','黑名单过滤','拦截规则','分机号错误','呼叫受限','主叫欠费','呼损客户','外呼失败','转人工呼损','线路拦截','号码故障','线路故障'].map(x=>[x,x])),excluded:['等待呼叫','等待重呼','待呼叫去重'],note:'只判已结束且重试完成的最终节点结果；供应商原始code/label另行保留，未知映射待核。'},
    ...[
      {id:'TIANRUN_MANUAL_SIP_CAUSE',label:'人工外呼客户通话结果',endpoint:'list_cdr_ob',methods:['MANUAL']},
      {id:'TIANRUN_PREDICTIVE_SIP_CAUSE',label:'预外呼客户通话结果',endpoint:'list_cdr_predictive_call',methods:['PREDICTIVE']}
    ].map(domain=>({...domain,channel:'CLOUD',provider:'TIANRUN',field:'sipCause',relatedFields:['sipCauseRaw','obSipCauseRaw'],
      statuses:statuses([[200,'已接通'],[710,'占线'],[711,'超时'],[712,'拒接'],[713,'空号'],[714,'关机'],[715,'暂时无法接听'],[716,'停机'],[717,'呼叫受限'],[718,'无人接听'],[719,'正在通话中'],[720,'暂停服务'],[721,'来电提醒'],[722,'不再使用'],[723,'来电助手'],[724,'号码格式不正确']]),
      source:'https://develop.clink.cn/develop/api/cc-download.html',note:'客户侧最终SIP/被叫结果；不使用status接听标记，不从座席接听推断客户接通。'}))
  ].map(d=>({...d,rawVerification:true})));
  const dazhong={'0':'等待呼叫','1':'已接通','2':'线路拦截','3':'拒接','4':'无人接听','5':'空号','6':'关机','7':'停机','8':'占线','9':'呼叫受限','10':'欠费','11':'黑名单过滤','12':'黑名单过滤'};
  const houpu={'770':'关机','771':'停机','772':'无法接通','773':'占线','774':'空号','775':'无人接听','776':'无人接听','777':'呼叫受限','778':'无法接通','779':'呼叫受限','780':'占线','781':'拒接','782':'无法接通','783':'伪接通','784':'伪接通','785':'已接通','786':'伪接通','787':'无人接听','788':'无人接听','789':'无人接听','790':'无人接听'};
  root.DFlowNormalizeStatus=function(domainId,rawDomain,rawCode){
    const domain=root.DFlowStatusDomains.find(d=>d.id===domainId);if(!domain||typeof rawCode!=='string'||!rawCode)return {state:'PENDING',value:null};
    let value=null;
    if(domainId==='DCC_LOCAL_LABEL'){
      if(rawDomain==='DCC_LOCAL_LABEL')value=rawCode;
      else if(rawDomain==='DAZHONG_CALL_STATUS')value=dazhong[rawCode];
      else if(rawDomain==='HOUPU_RAW_STATUS')value=houpu[rawCode];
    }else if(rawDomain===domainId)value=rawCode;
    return domain.statuses.some(s=>s.value===value)?{state:'KNOWN',value}:{state:'PENDING',value:null};
  };
})(window);
