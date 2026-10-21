/** Browser-local schedule demonstration. No network or background-server promise. */
(function(root){
  'use strict';
  let timer=null,running=false,last=[];
  const own=(value,key)=>Object.prototype.hasOwnProperty.call(value||{},key);
  const sourceValue=(row,key)=>[row.planSnapshot,row,row.executionConfig].find(value=>own(value,key))?.[key];
  function localTime(value){
    if(typeof value!=='string')return null;
    const normalized=value.replace(' ','T'),match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(normalized);
    if(!match)return null;
    const parts=match.slice(1).map(value=>Number(value||0)),date=new Date(normalized);
    if(!Number.isFinite(date.getTime())||date.getFullYear()!==parts[0]||date.getMonth()+1!==parts[1]||date.getDate()!==parts[2]||date.getHours()!==parts[3]||date.getMinutes()!==parts[4]||date.getSeconds()!==parts[5])return null;
    return date.getTime();
  }
  function conditionMatches(rule,date){
    if(!rule||![1,2].includes(Number(rule.type))||![1,2].includes(Number(rule.timeType))||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(rule.startTime)||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(rule.endTime)||rule.startTime>rule.endTime)return null;
    const clock=String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');
    const day=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
    let dateMatches;
    if(Number(rule.type)===1){
      if(typeof rule.dayOfWeek!=='string'||!/^([1-7])(?:,[1-7])*$/.test(rule.dayOfWeek))return null;
      // Supplier schema uses 1=Sunday through 7=Saturday.
      dateMatches=rule.dayOfWeek.split(',').includes(String(date.getDay()+1));
    }else{
      if(localTime(rule.fromDay+'T00:00')===null||localTime(rule.toDay+'T00:00')===null||rule.fromDay>rule.toDay)return null;
      dateMatches=day>=rule.fromDay&&day<=rule.toDay;
    }
    return dateMatches&&clock>=rule.startTime&&clock<=rule.endTime;
  }
  function eligibility(row,observedAt=Date.now()){
    const at=Number(observedAt),start=localTime(row?.scheduleAt);
    const fail=reason=>({ok:false,reason,mock:true});
    if(!Number.isFinite(at)||start===null)return fail('invalid-schedule-time');
    if(start>at)return fail('not-due');
    if(row.stopScheduled||Number(row.autoStop)===1){
      const stop=localTime(row.stopAt||[row.alictiCreateDraft?.fields?.autoStopDay,row.alictiCreateDraft?.fields?.autoStopTime].join('T'));
      if(stop===null)return fail('invalid-stop-time');
      if(stop<=at)return fail('scheduled-stop-already-due');
    }
    const mode=Number(sourceValue(row,'autoTaskType')??0),allowed=sourceValue(row,'allowedTimeIds')??[],forbidden=sourceValue(row,'forbiddenTimeIds')??[];
    if(![0,1].includes(mode)||!Array.isArray(allowed)||!Array.isArray(forbidden)||mode===1&&!allowed.length)return fail('invalid-time-condition-config');
    if(mode===0&&!forbidden.length)return {ok:true,reason:'due',mock:true};
    // Conditions are evaluated against the task's saved source facts. Current
    // resource availability is independently rechecked by the normal start guard.
    const snapshot=sourceValue(row,'timeConditionSnapshot'),date=new Date(at);
    if(!Array.isArray(snapshot))return fail('missing-time-condition-snapshot');
    const selected=[...new Set([...(mode===1?allowed:[]),...forbidden].map(String))],matched=new Map();
    for(const id of selected){
      const rules=snapshot.filter(rule=>String(rule.id)===id);
      if(rules.length!==1||String(rules[0].enterpriseId)!==String(row.enterpriseId)||
        !Array.isArray(rules[0].tenantIds)||!rules[0].tenantIds.includes(row.tenantId))return fail('time-condition-snapshot-out-of-scope');
      const value=conditionMatches(rules[0],date);if(value===null)return fail('invalid-time-condition-snapshot');matched.set(id,value);
    }
    if(forbidden.some(id=>matched.get(String(id))===true))return fail('forbidden-time-window');
    if(mode===1&&!allowed.some(id=>matched.get(String(id))===true))return fail('outside-allowed-time-window');
    return {ok:true,reason:'due',mock:true};
  }
  function availableSeats(row){
    const sources=[row.planSnapshot,row.alictiCreateDraft?.fields,row,row.executionConfig].filter(Boolean);
    const source=sources.find(value=>own(value,'callGroupType')||own(value,'cnos')||value.agentGroup||value.outboundGroupId)||{};
    let members;
    if(Number(source.callGroupType)===2){
      const value={...row,...source},group=root.OutboundGroups?.resolve?.(value,row);
      if(!group?.ok||!Array.isArray(group.members))return {ok:false,reason:'receiving-group-unconfirmed',count:0};
      members=group.members;
    }else{
      const raw=source.cnos,cnos=Array.isArray(raw)?raw:typeof raw==='string'?raw.split(',').map(value=>value.trim()).filter(Boolean):[];
      if(!cnos.length||new Set(cnos).size!==cnos.length)return {ok:false,reason:'receiving-seats-unconfirmed',count:0};
      members=[];
      for(const cno of cnos){
        const matches=(root.CloudCallData?.agents||[]).filter(agent=>agent.cno===cno&&agent.tenantId===row.tenantId&&agent.enterpriseId===row.enterpriseId&&agent.lifecycleStatus!=='已删除');
        if(matches.length!==1)return {ok:false,reason:'receiving-seat-identity-unconfirmed',count:0};members.push(matches[0]);
      }
    }
    const count=members.filter(agent=>agent.tenantId===row.tenantId&&agent.enterpriseId===row.enterpriseId&&
      agent.lifecycleStatus==='已启用'&&agent.syncStatus==='同步成功'&&agent.callEnabled!==false&&
      agent.acceptNewTasks!==false&&agent.agentStatus==='空闲'&&!agent.currentCall).length;
    return {ok:true,count,mock:true};
  }
  function reconcile(observedAt=Date.now()){
    if(running)return {changed:0,results:[],reason:'already-reconciling',mock:true};
    running=true;
    try{
      const workspace=root.CloudTaskWorkspace;
      if(!workspace?.refreshStoredTasks||workspace.refreshStoredTasks()!==true)return {changed:0,results:[],reason:'task-storage-unavailable',mock:true};
      const candidates=(root.CloudCallData?.tasks||[]).filter(row=>workspace.isPersistedLocalDemoTask?.(row)&&Number(row.autoStart)===1);
      last=candidates.map(row=>({taskId:row.taskId,...(root.AliCtiAdapter?.reconcileScheduledStart?.(row,observedAt)||{changed:false,reason:'task-control-unavailable',mock:true})}));
      const localTasks=(root.CloudCallData?.tasks||[]).filter(row=>workspace.isPersistedLocalDemoTask?.(row));
      for(const row of localTasks){
        const stopped=root.AliCtiAdapter?.reconcileScheduledStop?.(row,observedAt);if(stopped?.changed){last.push({taskId:row.taskId,...stopped});continue;}
        if(row.callType==='预外呼'&&['执行中','已暂停'].includes(row.status)){
          const seats=availableSeats(row);if(seats.ok){const available=root.AliCtiAdapter?.reconcileAvailability?.(row,seats.count);if(available?.changed)last.push({taskId:row.taskId,...available});}
        }
      }
      let retries={changed:0,results:[]};
      try{retries=root.DccRuntime?.reconcileFailureRetries?.(observedAt)||retries;}catch(_){retries={changed:0,results:[],reason:'retry-reconciliation-failed'};}
      root.DccRecords?.tickFailureRetryUi?.(observedAt);
      const changed=last.filter(result=>result.changed).length+(Number(retries.changed)||0);
      // Do not replace an open edit/import form while the clock is running.
      if(changed&&!root.AppState?.get?.().hasUnsavedChanges&&!['INPUT','TEXTAREA','SELECT'].includes(root.document?.activeElement?.tagName))root.RouteRuntime?.refreshCurrent?.();
      return {changed,results:last.map(result=>({...result})),failureRetries:retries,mock:true};
    }catch(_){return {changed:0,results:[],reason:'local-reconciliation-failed',mock:true};}
    finally{running=false;}
  }
  function tick(){if(!root.document?.hidden)reconcile();}
  function start(){if(timer!==null)return;timer=root.setInterval(tick,1000);tick();}
  function stop(){if(timer!==null){root.clearInterval(timer);timer=null;}}
  root.TaskScheduleRuntime=Object.freeze({reconcile,eligibility,availableSeats,start,stop,observations:()=>last.map(result=>({...result})),mode:'browser-local-synthetic'});
  root.addEventListener?.('focus',tick);
  root.addEventListener?.('pageshow',start);
  root.addEventListener?.('pagehide',stop);
  root.document?.addEventListener?.('visibilitychange',tick);
  root.addEventListener?.('storage',event=>{if(event.key==='cloud-task-created-v1'||event.key==='dcc-task-ledger-v1.1.0'||event.key?.startsWith('cloud-task-record-v1:'))tick();});
  start();
})(window);
