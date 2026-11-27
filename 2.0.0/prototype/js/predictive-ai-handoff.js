(() => {
  'use strict';
  const navValue = value => typeof value==='string' ? value.trim() :
    Number.isSafeInteger(value) && value>0 ? String(value) : '';
  const navigationFields = Object.freeze(['ivrId','ivrName','voiceNavigation']);
  function read(call) {
    const local=call?.predictiveCallback;
    if (local && typeof local.callbackId==='string' && local.callbackId.trim() &&
        navigationFields.some(key=>Object.hasOwn(local,key))) {
      const official=Object.hasOwn(local,'ivrId') || Object.hasOwn(local,'ivrName');
      const id=navValue(local.ivrId);
      const navigation=official ? (/^0+$/.test(id) ? '' : id) || navValue(local.ivrName) : navValue(local.voiceNavigation);
      return {received:true,transferred:Boolean(navigation),navigation};
    }
    // Query/list CDRs can echo an IVR identifier even when both sides answered.
    // Only normalized callback evidence is authoritative for this flag.
    return {received:false,transferred:null,navigation:''};
  }
  const label = call => {
    const {transferred} = read(call);
    return transferred===null ? '待确认' : transferred ? '是' : '否';
  };
  function readForCdr(call,viewer,lookup = window.DReview21?.predictiveCallbackRows) {
    const {scope}=viewer || {}, tenant=scope?.tenant;
    if (scope?.kind!=='tenant' || !scope.id || !tenant || !call || call.callType!=='预外呼' ||
        (call.tenantId ?? call.tenant)!==scope.id || (call.tenant!=null && call.tenant!==scope.id) ||
        (call.brandId && call.brandId!==tenant.brandId) ||
        (call.enterpriseId && String(call.enterpriseId)!==String(tenant.enterpriseId)) ||
        typeof call.callId!=='string' || !call.callId) return read(null);
    const ledger=lookup?.(viewer,call.callId);
    if (!Array.isArray(ledger)) return read(null);
    const matches=ledger.filter(row=>row.callType==='预外呼' && row.callId===call.callId &&
      row.tenant===scope.id && row.brandId===tenant.brandId && row.taskId && row.roundId &&
      (!row.enterpriseId || String(row.enterpriseId)===String(tenant.enterpriseId)) &&
      (!call.nurtureTaskId || call.nurtureTaskId===row.taskId) &&
      (!call.roundId || call.roundId===row.roundId) && read(row).received);
    if (matches.length===1) return read(matches[0]);
    if (ledger.length) return read(null);
    return read(call);
  }
  const labelForCdr = (call,viewer) => {
    const {transferred}=readForCdr(call,viewer);
    return transferred===null ? '待确认' : transferred ? '是' : '否';
  };
  let queued=false;
  function refreshCdrLabels() {
    if (queued) return;
    queued=true;
    queueMicrotask(()=>{
      queued=false;
      const frame=document.querySelector('iframe[data-native-module="cloud"]');
      const w=frame?.contentWindow,viewer=w?.DNativeContext?.context;
      if (!viewer) return;
      const badges=frame.contentDocument?.querySelectorAll('[data-predictive-ai-call-id]');
      if (!badges?.length) return;
      const ids=new Set(Array.from(badges,badge=>badge.dataset.predictiveAiCallId)),calls=new Map();
      for (const row of w.CloudCallData?.calls || []) {
        if (!ids.has(row.callId) || row.tenantId!==viewer.scope.id || row.callType!=='预外呼' ||
            !w.AppState?.authorizeObject?.('',row)) continue;
        calls.set(row.callId,calls.has(row.callId)?null:row);
      }
      for (const badge of badges) {
        const value=labelForCdr(calls.get(badge.dataset.predictiveAiCallId),viewer);
        if (badge.textContent!==value) badge.textContent=value;
      }
    });
  }
  window.DPredictiveAiHandoff=Object.freeze({read,label,readForCdr,labelForCdr,refreshCdrLabels,navigationFields});
})();

(() => {
  'use strict';
  const cloud=window.DNativeModules?.cloud;
  if (!cloud) return;
  const a="        { key: 'result', label: '接听结果', help: '显示客户接通结果。缺少结果时保留待确认。', render: (_, row) => answerMarkup(row) },";
  const b="      ...(inbound?[['呼入接听状态',data.resultLabel]]:[]),";
  if (cloud.html.split(a).length!==2 || cloud.html.split(b).length!==2) throw new Error('预外呼通话记录渲染入口不唯一');
  cloud.html=cloud.html.replace(a,a+
    "\n        ...(activeType!=='人工外呼' ? [{key:'predictiveAiHandoff',label:'是否转 AI',help:'按预外呼通话结果中的语音导航判断。未取得可核对的结果时显示待确认。',render:(_,row)=>row.callType==='预外呼' ? predictiveLabelMarkup(row) : '—'}] : []),")
    .replace(b,b+"\n      ...(call.callType==='预外呼' ? [['是否转 AI',null]] : []),");
  const detail='  function detailMarkup(call, withMedia = true) {';
  const dt="    const dt=(label,value)=>'<dt>'+esc(label)+'</dt><dd>'+esc(value??'未记录')+'</dd>';";
  if (cloud.html.split(detail).length!==2 || cloud.html.split(dt).length!==2) throw new Error('预外呼详情状态入口不唯一');
  cloud.html=cloud.html.replace(detail,`  function predictiveLabelMarkup(call) {
    const value=parent.DPredictiveAiHandoff.labelForCdr(call,window.DNativeContext?.context);
    return '<span data-predictive-ai-call-id="'+esc(call.callId)+'">'+esc(value)+'</span>';
  }

`+detail).replace(dt,`    const dt=(label,value)=>'<dt>'+esc(label)+'</dt><dd>'+
      (label==='是否转 AI' && call.callType==='预外呼' ? predictiveLabelMarkup(call) : esc(value??'未记录'))+'</dd>';`);
})();
