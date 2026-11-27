(() => {
  'use strict';
  const navValue = value => typeof value==='string' ? value.trim() :
    Number.isSafeInteger(value) && value>0 ? String(value) : '';
  function read(call, facts) {
    const local=call?.predictiveCallback;
    if (local && typeof local.callbackId==='string' && local.callbackId.trim() && Object.hasOwn(local,'voiceNavigation')) {
      const navigation=navValue(local.voiceNavigation);
      return {received:true,transferred:Boolean(navigation),navigation};
    }
    if (facts?.kind==='predictive' && facts.usable && facts.ended && facts.raw) {
      const navigation=navValue(facts.raw.ivrName) || navValue(facts.raw.ivrId);
      return {received:true,transferred:Boolean(navigation),navigation};
    }
    return {received:false,transferred:null,navigation:''};
  }
  const label = (call,facts) => {
    const {transferred} = read(call,facts);
    return transferred===null ? '待确认' : transferred ? '是' : '否';
  };
  window.DPredictiveAiHandoff=Object.freeze({read,label,navValue});
})();

(() => {
  'use strict';
  const cloud=window.DNativeModules?.cloud;
  if (!cloud) return;
  const a="        { key: 'result', label: '接听结果', help: '显示客户接通结果。缺少结果时保留待确认。', render: (_, row) => answerMarkup(row) },";
  const b="      ...(inbound?[['呼入接听状态',data.resultLabel]]:[]),";
  if (cloud.html.split(a).length!==2 || cloud.html.split(b).length!==2) throw new Error('预外呼通话记录渲染入口不唯一');
  cloud.html=cloud.html.replace(a,a+
    "\n        ...(activeType!=='人工外呼' ? [{key:'predictiveAiHandoff',label:'是否转 AI',help:'按预外呼通话结果中的语音导航判断。未取得可核对的结果时显示待确认。',render:(_,row)=>esc(row.callType==='预外呼' ? parent.DPredictiveAiHandoff.label(row,AliCtiReportFacts.read(row)) : '—')}] : []),")
    .replace(b,b+"\n      ...(call.callType==='预外呼' ? [['是否转 AI',parent.DPredictiveAiHandoff.label(call,facts)]] : []),");
})();
