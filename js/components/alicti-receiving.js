/* Local receiving boundary for the prototype. No CTILink or supplier requests are sent.
 * API-303: ringingIb/ringingAgentOb are offers; busyIb/busyOb establish the conversation.
 * API-306: sipLink requests browser-softphone answering, not proof that answering succeeded.
 */
(()=>{'use strict';
  const root=typeof window==='undefined'?globalThis:window;
  const text=value=>value==null?'':String(value);
  const nonempty=value=>typeof value==='string'&&value.trim()!==''&&value===value.trim();
  const kind=value=>value?.kind||value?.workbenchKind||'';
  const fail=message=>({ok:false,message});
  const same=(a,b)=>a!=null&&b!=null&&text(a)===text(b);
  const identityFields=['enterpriseId','tenantId','accountId','cno','contactId','callId'];
  const sameOffer=(a,b)=>kind(a)===kind(b)&&identityFields.every(key=>same(a?.[key],b?.[key]))&&same(a?.customerNumber,b?.customerNumber)&&same(a?.taskId||'',b?.taskId||'')&&same(a?.customerTaskItemId||'',b?.customerTaskItemId||'');
  const offerKey=offer=>JSON.stringify([kind(offer),...identityFields.map(key=>text(offer?.[key]))]);

  function validateOffer(payload,context={}){
    if(!payload||!['inbound','predictive'].includes(payload.kind))return fail('来电类型不明确，无法接收');
    if(payload.mock!==true)return fail('当前仅支持本地来电演示');
    for(const key of ['tenantId','accountId','cno','contactId','callId','customerNumber'])if(!nonempty(payload[key]))return fail('来电缺少有效的'+key);
    if(!text(payload.enterpriseId).trim())return fail('来电缺少供应商账号');
    const agent=context.agent;
    if(!agent||typeof agent.cno!=='string'||!agent.cno)return fail('当前账号尚未关联可接听坐席');
    if(!same(payload.enterpriseId,context.enterpriseId)||!same(payload.tenantId,context.tenantId)||!same(payload.accountId,context.accountId)||!same(payload.enterpriseId,agent.enterpriseId)||!same(payload.tenantId,agent.tenantId)||payload.cno!==agent.cno)return fail('来电与当前坐席或工作范围不一致');
    if(agent.accountId&&agent.accountId!==payload.accountId)return fail('来电所属账号与坐席关联账号不一致');
    if(payload.stateAction){const mapped=eventPhase(payload.kind,payload.stateAction);if(!mapped.ok||mapped.phase!=='offered')return fail('来电事件不是当前呼叫类型的待接听通知');}
    if(payload.kind==='predictive'){
      if(!nonempty(payload.taskId)||!nonempty(payload.customerTaskItemId))return fail('预外呼来电缺少明确的任务和客户条目关联');
      const linked=context.receivingItem;
      if(!linked?.task||!linked.batch||!linked.item)return fail('无法核对本次预外呼的任务和客户条目');
      const {task,batch,item}=linked;
      if(task.taskId!==payload.taskId||item.id!==payload.customerTaskItemId||item.taskId!==payload.taskId||task.callType!=='预外呼')return fail('预外呼来电与任务或客户条目不一致');
      if(!same(task.tenantId,payload.tenantId)||!same(task.enterpriseId,payload.enterpriseId)||!same(batch.tenantId,payload.tenantId)||!same(batch.enterpriseId,payload.enterpriseId)||item.phone!==payload.customerNumber)return fail('预外呼来电与原客户名单范围或号码不一致');
      if(payload.customerBatchId&&payload.customerBatchId!==batch.id)return fail('预外呼来电与客户批次不一致');
      if(item.activeCallId&&item.activeCallId!==payload.callId)return fail('该客户条目已有其他正在处理的通话');
    }else if(payload.taskId||payload.customerTaskItemId){return fail('呼入来电不能直接关联外呼任务条目');}
    const key=offerKey(payload);
    if(context.call?.endedAt)return fail('当前通话已经结束，请先完成话后处理');
    if(context.call&&sameOffer(payload,context.call))return {ok:true,duplicate:true,offer:{...payload},key};
    if(!context.online)return fail('请先将本人电话上线，再接收来电');
    if(context.busy||context.call)return fail('当前通话尚未处理完成，无法接收另一通来电');
    return {ok:true,duplicate:false,offer:{...payload},key};
  }

  function eventPhase(callKind,stateAction){
    const table={inbound:{ringingIb:'offered',busyIb:'connected'},predictive:{ringingAgentOb:'offered',busyOb:'connected'}};
    const phase=table[callKind]?.[stateAction];
    return phase?{ok:true,phase}:fail('该电话事件不属于当前接听流程');
  }

  function eventMatches(event,call){
    if(!event||!call)return false;
    if(!['enterpriseId','cno','contactId'].every(key=>nonempty(text(event[key]))&&same(event[key],call[key])))return false;
    // Agent numbers must stay strings: "0012" and "12" identify different agents.
    if(typeof event.cno!=='string'||typeof call.cno!=='string'||event.cno!==call.cno)return false;
    if(event.kind&&event.kind!==kind(call))return false;
    for(const key of ['tenantId','accountId','callId'])if(event[key]!=null&&!same(event[key],call[key]))return false;
    if(event.mock===true&&!['tenantId','accountId','callId'].every(key=>nonempty(text(event[key]))))return false;
    return true;
  }

  function eventKey(event){
    return JSON.stringify([text(event?.enterpriseId),text(event?.tenantId),text(event?.accountId),text(event?.cno),text(event?.contactId),text(event?.callId),text(event?.eventId||event?.stateAction||event?.type)]);
  }

  function operate(agent,call,action){
    const adapter=root.AliCtiAdapter,session=adapter?.session;
    const connection=root.AliCtiSeatOperations?.connectionStatus?.();
    if(connection?.blocked)return fail(connection.message+' 请先恢复电话连接。');
    if(!agent||!call||!['inbound','predictive'].includes(kind(call)))return fail('当前没有可接听的来电');
    if(call.mock!==true||session?.mock!==true)return fail('当前仅支持本地接听演示');
    if(!nonempty(call.contactId)||!nonempty(call.callId))return fail('来电缺少有效的通话标识');
    if(typeof agent.cno!=='string'||typeof session.cno!=='string'||session.cno!==agent.cno||call.cno!==agent.cno||!same(session.enterpriseId,agent.enterpriseId)||!same(call.enterpriseId,agent.enterpriseId)||!same(call.tenantId,agent.tenantId))return fail('本人电话服务尚未就绪，请重新上线');
    if(agent.accountId&&agent.accountId!==call.accountId)return fail('本次来电不属于当前关联账号');
    for(const key of ['accountId','tenantId'])if(session[key]!=null&&!same(session[key],call[key]))return fail('电话登录范围已变化，请重新上线');
    if(call.endedAt||call.processingStatus==='已完成')return fail('该来电已经结束');
    if(action==='refuse'){
      if(kind(call)!=='inbound'||call.agentAnswerResult==='已接听'||call.agentAnsweredAt&&call.agentAnsweredAt!=='—')return fail('仅呼入座席响铃时可以拒接');
      adapter.lastRequest={method:'CTILink.Session.refuse',params:{},enterpriseId:session.enterpriseId,cno:session.cno,contactId:call.contactId,callId:call.callId,mock:true};
      return {ok:true,response:{type:'response',reqType:'refuse',code:'0',msg:'ok'},mock:true};
    }
    const bindType=['1','2','3'].includes(String(session.bindType))?Number(session.bindType):0;
    if(bindType===1||bindType===2)return {ok:true,requiresDevice:true,phase:'offered',message:'请在电话上接听'};
    if(bindType!==3)return fail('当前电话接听方式不明确，请重新上线');
    adapter.lastRequest={method:'sipLink',enterpriseId:session.enterpriseId,cno:session.cno,contactId:call.contactId,callId:call.callId,mock:true};
    return {ok:true,requiresDevice:false,phase:'answering',awaitingState:true};
  }

  root.AliCtiReceiving={validateOffer,offerKey,eventPhase,eventMatches,eventKey,answer:(agent,call)=>operate(agent,call,'answer'),refuse:(agent,call)=>operate(agent,call,'refuse')};
})();
