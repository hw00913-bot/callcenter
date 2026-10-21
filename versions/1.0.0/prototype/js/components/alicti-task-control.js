/* D-017 / D-021 task lifecycle demonstration. Every response is synthetic; no network. */
(function(root){
  'use strict';
  const a=root.AliCtiAdapter,f=root.AliCtiFields;
  const actionLabels={start:'启动',pause:'暂停',resume:'继续',terminate:'结束'};
  const endpoints={start:'task/start',pause:'task/pause',resume:'task/start',terminate:'task/stop'};
  const expected={start:1,pause:2,resume:1,terminate:3};
  const allowedLocal={start:['待启动'],pause:['执行中'],resume:['已暂停'],terminate:['待分配客户','待启动','执行中','已暂停','异常']};
  const allowedRemote={start:[0],pause:[1],resume:[2],terminate:[0,1,2]};
  const scenarios={success:'正常返回', 'before-failure':'操作前查询失败','before-unknown':'操作前状态未知','before-missing-id':'操作前缺少任务编号','before-mismatch':'操作前任务编号不一致','before-status-0':'操作前查询为初始态','before-status-1':'操作前查询为运行态','before-status-3':'操作前查询为结束态','write-failure':'操作被拒绝','write-unknown':'操作结果与后续状态均未知','after-paused':'操作后仍为暂停态','after-unknown':'操作后状态未知','after-failure':'操作后查询失败','after-ended':'操作后查询为结束态'};
  const availabilityReason='AVAILABLE_SEATS_BELOW_MIN';
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const context=()=>{const s=AppState.get();return [s.activeDomain,s.accountId,s.tenantId,s.enterpriseId].join('|');};
  const canonical=row=>[...(CloudCallData.tasks||[]),...(CloudCallData.predictiveTasks||[]),...(CloudCallData.ivrTasks||[])].find(item=>item.taskId===row?.taskId&&item.tenantId===row?.tenantId&&item.enterpriseId===row?.enterpriseId);
  const sameIdentity=(row,identity)=>row.taskId===identity.taskId&&row.tenantId===identity.tenantId&&row.enterpriseId===identity.enterpriseId&&AliCtiDemo.resourceId('task',row)===identity.providerTaskId;
  const predictive=row=>row.callType==='预外呼'||Number(row.providerType)===1;
  const validCno=value=>f.validExistingCno?f.validExistingCno(value):typeof value==='string'&&/^\d+$/.test(value)&&/[1-9]/.test(value);
  const suppliedSeats=row=>[row.alictiMockTaskProperty,row.alictiControlResponse?.data?.taskProperty,row.alictiCreateDraft?.fields].find(value=>value&&Object.hasOwn(value,'cnos'));
  function guard(row,action){
    if(!Object.hasOwn(actionLabels,action)||!row||!CloudTaskWorkspace.canControlTask(row)||!AppState.scoped([row]).length||!AppState.canAction(action==='terminate'?'task.abort':'task.'+action))return '当前无权执行此操作';
    if(!allowedLocal[action].includes(row.status)||f.code(row.providerStatusCode)===3)return '当前任务状态不可执行此操作，已结束任务不能重新开启';
    if(action==='start'||action==='resume'){
      const supplied=suppliedSeats(row);
      if(predictive(row)&&supplied&&(typeof supplied.cnos!=='string'||!supplied.cnos.trim()||supplied.cnos.split(',').some(value=>!validCno(value.trim()))))return '接听坐席配置不完整，请重新核对任务配置后再启动。';
      if(!Number(row.total))return '请先分配客户，空名单不能启动或继续';
      if(row.resourcePause){
        if(!['SUPER_ADMIN','ADMIN'].includes(AppState.effectiveAccess().roleCode)||!AppState.canAction('task.resume'))return '号码停用保护的任务需有权管理员逐项恢复';
        if(!Array.isArray(row.resourcePause.numberIds)||row.resourcePause.numberIds.some(id=>!CloudCallData.phoneNumbers.some(n=>n.numberId===id&&n.enterpriseId===row.enterpriseId&&n.businessStatus==='正常'&&n.localEnabled!==false)))return '仍有引用号码未恢复使用，请先核对所有停用号码';
      }
      const problem=CloudTaskWorkspace.simulationResourceError(row,true);if(problem)return problem;
      const conflict=root.OutboundGroups?.executionError(row);if(conflict)return conflict;
    }
    return '';
  }
  function readResult(response,id,enterpriseId){
    const property=response?.data?.taskProperty,status=f.code(property?.status);
    if(f.code(response?.result)!==0||f.integer(property?.id)!==id||!Object.hasOwn(f.taskStatus,status)||('enterpriseId' in (property||{})&&f.integer(property.enterpriseId)!==f.integer(enterpriseId)))return {known:false,status:null,property,raw:response};
    return {known:true,status,property,raw:response};
  }
  function initialProperty(row,id,action){
    if(row.alictiMockTaskProperty)return clone(row.alictiMockTaskProperty);
    const responseProperty=row.alictiControlResponse?.result===0?row.alictiControlResponse.data?.taskProperty:null;
    if(responseProperty)return clone(responseProperty);
    const status=f.code(row.providerStatusCode);
    if(Object.hasOwn(f.taskStatus,status))return {id,status};
    const seed=AliCtiDemo.taskControlSeed(row);
    if(seed)return seed;
    // Explicit new local task fixtures may start at 0. A local pause/hold never creates status 2.
    if(row.simulation===true&&action==='start'&&['待启动','待分配客户'].includes(row.status))return {id,status:0};
    return {id};
  }
  function mockQuery(row,id,phase,action,scenario){
    const property=phase==='before'?initialProperty(row,id,action):clone(row.alictiMockTaskProperty||{id});
    if(scenario===phase+'-failure')return {result:-1,description:'查询失败（模拟）'};
    if(scenario===phase+'-unknown'||(phase==='after'&&scenario==='write-unknown'))return {result:0,data:{taskProperty:{...property,status:99}},description:'状态未知（模拟）'};
    if(phase==='before'){
      if(scenario==='before-missing-id')delete property.id;
      if(scenario==='before-mismatch')property.id=id+1;
      if(scenario.startsWith('before-status-'))property.status=Number(scenario.slice(-1));
    }else{
      if(scenario==='after-paused')property.status=2;
      if(scenario==='after-ended')property.status=3;
    }
    return {result:0,data:{taskProperty:property},mock:true};
  }
  function trace(endpoint,phase,fields,response){
    const record={order:a.taskControlTrace.length+1,phase,endpoint,fields:clone(fields),response:clone(response),mock:true};
    a.taskControlTrace.push(record);
    if(endpoint==='task/get')a.lastQueryRequest=record;else a.lastRequest=record;
    return record;
  }
  function applyRead(row,result,action,phase){
    row.alictiControlResponse=clone(result.raw);
    if(!result.known){row.alictiTaskControlPending=true;row.providerStatus='待核对';row.stopNewDialing=true;return;}
    const previous=row.status;
    row.providerStatusCode=result.status;
    row.providerStatus=f.taskStatus[result.status]+'（模拟）';
    row.alictiTaskControlPending=false;
    row.alictiMockTaskProperty=clone(result.property);
    // Supplier fields, including a returned pauseDuration, remain raw evidence only.
    row.status=result.status===0?(Number(row.total)?'待启动':'待分配客户'):result.status===1?'执行中':result.status===2?'已暂停':previous==='已完成'?'已完成':'已终止';
    // A confirmed manual operation or a changed supplier status supersedes the
    // local availability hold. A failed manual resume still leaves status 2.
    if(result.status!==2||(phase==='after'&&action==='pause'))delete row.availabilityPause;
    row.stopNewDialing=result.status!==1||!!row.resourcePause;
    if(phase==='after'&&result.status===expected[action]&&(action==='start'||action==='resume')){
      if(action==='start'&&!row.startedAt)row.startedAt=new Date().toLocaleString('sv-SE');
      delete row.resourcePause;row.stopNewDialing=false;
    }
    if(result.status===3)row.hasNextAttempt=false;
  }
  function finish(row,action,beforeStatus,result,message){
    row.simulation=true;row.updatedAt=new Date().toLocaleString('sv-SE');
    row.alictiTaskControlTrace=clone(a.taskControlTrace);
    row.alictiTaskControlSummary=message;
    (row.dispatchHistory||(row.dispatchHistory=[])).push({at:row.updatedAt,actor:AppState.get().accountId,action:actionLabels[action]+'（本地演示）',before:beforeStatus,after:row.status,result:message});
    CloudTaskWorkspace.saveDemoTask(row,{confirmedInitialStart:result.confirmedInitialStart===true});
    CloudCallRuntime.addAudit?.('任务'+actionLabels[action]+'（本地演示）',row.taskId,row.tenantId,beforeStatus,message);
    showToast(message,result.ok?'success':'warning');
    if (window.RouteRuntime?.refreshCurrent) RouteRuntime.refreshCurrent();
    else navigateTo('cloud-task-center',{taskId:row.taskId});
    return {...result,message,mock:true,trace:clone(a.taskControlTrace)};
  }
  a.controlTask=function(input,action,confirmed){
    a.taskControlTrace=[];a.lastRequest=null;a.lastQueryRequest=null;
    let row=canonical(input),error=guard(row,action);
    if(error){showToast(error,'warning');return {ok:false,message:error,mock:true};}
    const identity={taskId:row.taskId,tenantId:row.tenantId,enterpriseId:row.enterpriseId,providerTaskId:AliCtiDemo.resourceId('task',row)};
    if(!confirmed){
      const openedContext=context();
      const body=action==='resume'?'先核对暂停状态，再继续同一任务。':action==='pause'?'暂停后可继续本任务。已发起通话的收尾方式待确认。':action==='terminate'?'确认结束后不再发起新呼叫或重呼，也不能重新开启。已发起通话的收尾方式待确认，历史记录保留。':'启动前会重新检查客户名单、配置和任务状态。';
      return PlatformUI.confirm({id:'alicti-task-control',title:actionLabels[action]+'任务',body:'<p>'+body+'</p>',confirmText:'确认提交',danger:action==='terminate',onConfirm(){
        const latest=canonical(identity);
        if(openedContext!==context()||!latest||!sameIdentity(latest,identity)){showToast('任务或工作范围已变化，请重新打开操作','warning');return {ok:false};}
        AliCtiDemo.taskControlScenario=document.getElementById('taskControlScenario')?.value||AliCtiDemo.taskControlScenario;
        return a.controlTask(latest,action,{context:openedContext,identity});
      }});
    }
    if(confirmed.context&&confirmed.context!==context()||confirmed.identity&&!sameIdentity(row,confirmed.identity))return {ok:false,message:'任务或工作范围已变化'};
    const firstStart=action==='start'&&!row.startedAt&&!row.campaignId&&!row.planSnapshot&&!row.planSnapshotId;
    const beforeStatus=row.status,activeContext=context(),scenario=AliCtiDemo.taskControlScenario||'success',id=identity.providerTaskId;
    const auth=f.authFields(row.enterpriseId);
    if(auth.pending.length)return {ok:false,message:auth.pending.join('；')};
    const fields={...auth.fields,taskId:id};
    const beforeResponse=mockQuery(row,id,'before',action,scenario);
    trace('task/get','before',fields,beforeResponse);
    const before=readResult(beforeResponse,id,row.enterpriseId);
    if(!before.known){applyRead(row,before,action,'before');return finish(row,action,beforeStatus,{ok:false,pending:true},'未能确认当前任务状态，操作未提交');}
    if(!allowedRemote[action].includes(before.status)){
      applyRead(row,before,action,'before');
      return finish(row,action,beforeStatus,{ok:false},before.status===3?'任务已经结束，不能重新开启':action==='resume'?'当前任务不是暂停状态，未提交继续操作':'当前任务状态不允许此操作，已更新显示');
    }
    // Recheck the current object, access, resources and work context immediately before writing.
    row=canonical(identity);error=!row||activeContext!==context()||!sameIdentity(row,identity)?'任务或工作范围已变化':guard(row,action);
    if(error)return {ok:false,message:error,mock:true,trace:clone(a.taskControlTrace)};
    applyRead(row,before,action,'before');
    const writeResponse=scenario==='write-failure'?{result:-1,description:'操作被拒绝（模拟）'}:scenario==='write-unknown'?null:{result:0,description:'请求已受理（模拟）'};
    trace(endpoints[action],'write',fields,writeResponse);
    if(f.code(writeResponse?.result)===-1)return finish(row,action,beforeStatus,{ok:false},'操作被拒绝，保留已查询到的任务状态');
    if(f.code(writeResponse?.result)===0)row.alictiMockTaskProperty={...clone(before.property),status:expected[action],statusTriggerType:1};
    const afterResponse=mockQuery(row,id,'after',action,scenario);
    trace('task/get','after',fields,afterResponse);
    const after=readResult(afterResponse,id,row.enterpriseId);
    applyRead(row,after,action,'after');
    const ok=after.known&&after.status===expected[action];
    const message=!after.known?'操作后的任务状态待核对，未确认操作成功':ok?'已核对任务状态：'+f.taskStatus[after.status]+'（模拟）':'已读取当前状态：'+f.taskStatus[after.status]+'，未确认'+actionLabels[action]+'成功';
    return finish(row,action,beforeStatus,{ok,pending:!after.known,response:afterResponse,confirmedInitialStart:ok&&firstStart},message);
  };
  // Local demonstration only. The caller supplies an observed available-seat
  // count; this method never polls seats or sends a supplier task request.
  a.reconcileAvailability=function(input,count){
    const row=canonical(input),available=typeof count==='number'||typeof count==='string'&&count.trim()?Number(count):NaN;
    const threshold=row?.minAvailableAgentCount,minimum=typeof threshold==='number'||typeof threshold==='string'&&threshold.trim()?Number(threshold):NaN;
    const unchanged=reason=>({changed:false,action:null,status:row?.status??null,reason,mock:true});
    if(!row||row.callType!=='预外呼'||Object.hasOwn(row,'providerType')&&Number(row.providerType)!==1||
      row.simulation!==true||row.localPrototypeTask!==true||!CloudTaskWorkspace.isLocalSimulationTask?.(row)||
      !CloudTaskWorkspace.canControlTask(row)||!AppState.scoped([row]).length)return unchanged('not-local-predictive-task');
    if(!Number.isSafeInteger(available)||available<0)return unchanged('invalid-available-count');
    if(!Number.isInteger(minimum)||minimum<1||minimum>10)return unchanged('invalid-minimum');
    if(row.alictiTaskControlPending||row.resourcePause||f.code(row.providerStatusCode)===3||
      ['已完成','已终止','已结束','已删除'].includes(row.status))return unchanged('task-held-or-ended');
    const running=row.status==='执行中'&&f.code(row.providerStatusCode)===1&&!row.stopNewDialing;
    const availabilityHeld=row.status==='已暂停'&&f.code(row.providerStatusCode)===2&&
      row.availabilityPause?.reason===availabilityReason&&row.availabilityPause.mock===true;
    const action=running&&available<minimum?'pause':availabilityHeld&&available>=minimum&&Number(row.autoStart)===1?'resume':null;
    if(!action)return unchanged('no-transition');
    const changedKeys=['status','providerStatusCode','providerStatus','alictiMockTaskProperty','availabilityPause','stopNewDialing','updatedAt','dispatchHistory'];
    const before=Object.fromEntries(changedKeys.map(key=>[key,{present:Object.hasOwn(row,key),value:clone(row[key])}]));
    const at=new Date().toLocaleString('sv-SE'),prior=row.status,nextStatus=action==='pause'?2:1;
    const message=action==='pause'?`可用座席 ${available} 人，低于设置的 ${minimum} 人，任务已自动暂停（本地演示）`:
      `可用座席 ${available} 人，达到设置的 ${minimum} 人，定时开始任务已自动恢复运行（本地演示）`;
    row.status=action==='pause'?'已暂停':'执行中';
    row.providerStatusCode=nextStatus;
    row.providerStatus=(action==='pause'?'暂停':'运行')+'（本地演示）';
    row.alictiMockTaskProperty={...clone(row.alictiMockTaskProperty||{}),id:AliCtiDemo.resourceId('task',row),status:nextStatus};
    row.stopNewDialing=action==='pause';
    row.updatedAt=at;
    if(action==='pause')row.availabilityPause={reason:availabilityReason,reasonLabel:'可用座席数低于设置值',threshold:minimum,availableAgentCount:available,pausedAt:at,mock:true};
    else delete row.availabilityPause;
    (row.dispatchHistory||(row.dispatchHistory=[])).push({at,actor:'本地座席人数演示',action:action==='pause'?'座席不足自动暂停（本地演示）':'座席达标自动恢复（本地演示）',before:prior,after:row.status,result:message});
    let saved=false;
    try{saved=CloudTaskWorkspace.saveDemoTask(row)===true;}catch(_){saved=false;}
    if(!saved){
      for(const [key,state] of Object.entries(before)){if(state.present)row[key]=state.value;else delete row[key];}
      return unchanged('save-failed');
    }
    root.CloudCallRuntime?.addAudit?.('任务'+(action==='pause'?'座席不足自动暂停':'座席达标自动恢复')+'（本地演示）',row.taskId,row.tenantId,prior,message);
    return {changed:true,action,status:row.status,message,availableAgentCount:available,minAvailableAgentCount:minimum,mock:true};
  };
  a.taskControlDetails=row=>!row.alictiTaskControlTrace?.length?'':'<details class="technical-details"><summary>最近任务操作核对（演示）</summary><p>'+PlatformUI.escape(row.alictiTaskControlSummary||'')+'</p><p>操作结果以查询状态为准。暂停后可继续同一任务；确认结束后不再发起新呼叫或重呼，也不能重新开启。已发起通话的收尾方式待确认。</p><pre>'+PlatformUI.escape(JSON.stringify(row.alictiTaskControlTrace,null,2))+'</pre></details>';
  a.taskControlScenarios=Object.freeze(scenarios);
  a.readTaskControlResult=readResult;
})(window);
