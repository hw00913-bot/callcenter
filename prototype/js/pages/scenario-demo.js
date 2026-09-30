/** Opt-in linked demo. All execution is explicit and local, never calls AliCti. */
(function(){
  'use strict';
  const d=CloudCallData,f=ScenarioDemoData,key='linked-scenario-demo-v1',batchKey='customer-task-batches-v1',ui=PlatformUI;
  const now=()=>new Date().toLocaleString('sv-SE');
  const simulationResults=['接通','未接通','待确认'];
  const connected=call=>CallState.view(call).answered===true;
  // Follow-up labels describe business work; only an explicit, uncalled row is executable.
  const uncalled=item=>!!item&&item.followup==='待联系'&&Array.isArray(item.calls)&&item.calls.length===0&&!item.activeCallId;
  function settleExhaustedTask(task){
    if(task.status!=='执行中'||task.stopNewDialing||task.resourcePause||task.alictiTaskControlPending||AliCtiFields.code(task.providerStatusCode)===3||!(task.total>0)||task.completed<task.total)return;
    task.stopNewDialing=true;task.hasNextAttempt=false;
    if(task.callType==='预外呼'&&AliCtiFields.code(task.autoComplete)===0){
      task.status='已暂停';task.providerStatusCode=2;task.providerStatus='暂停（模拟）';
      task.alictiMockTaskProperty={...task.alictiMockTaskProperty,id:AliCtiDemo.resourceId('task',task),status:2,type:1};
      (task.dispatchHistory||(task.dispatchHistory=[])).push({at:now(),actor:AppState.get().accountId,action:'号码呼完后暂停（本地演示）',before:'执行中',after:'已暂停',result:'本轮名单已呼完，可在原任务安排再次联系'});
    }else task.status='已完成';
  }
  let saved={enabled:false,calls:[],tasks:[]};
  try{saved=JSON.parse(localStorage.getItem(key)||'null')||saved;}catch(_){}
  function allowed(){return d.demoSwitchEnabled&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.get().tenantId===f.tenantId&&AppState.get().enterpriseId===f.enterpriseId&&['ADMIN','SUPER_ADMIN'].includes(AppState.effectiveAccess().roleCode)&&AppState.effectiveAccess().valid;}
  function add(list,id,row){if(!list.some(x=>x[id]===row[id]))list.push(structuredClone(row));}
  function save(){localStorage.setItem(key,JSON.stringify(saved));}
  function resources(){
    add(d.phoneNumbers,'numberId',f.inboundNumber);add(d.inboundRoutes,'routeId',f.inboundRoute);
    for(const spec of f.tasks){
      const config={callPlanId:'CONFIG-'+spec.taskId,name:spec.name,tenantId:f.tenantId,enterpriseId:f.enterpriseId,callType:spec.callType,status:'已发布',publishedVersion:'DEMO-V1',targetSkillGroupId:spec.callType==='预外呼'?'DEMO-CUSTOMER-SKILL':'',executionQueueId:'DEMO-CUSTOMER-SKILL',contactFlowId:spec.flowId,transferEnabled:spec.callType==='预外呼',allowedCallerNumberIds:['DEMO-CUSTOMER-NUM']};
      let task=d.tasks.find(x=>x.taskId===spec.taskId);
      if(!task){task=structuredClone(saved.tasks.find(x=>x.taskId===spec.taskId)||{...spec,tenantId:f.tenantId,enterpriseId:f.enterpriseId,status:'待分配客户',customerSourceMode:'assigned',total:0,completed:0,connected:0,planId:config.callPlanId,executionConfig:config,planVersion:'DEMO-V1',planSnapshot:null,planSnapshotId:'',campaignId:'',callerNumberId:'DEMO-CUSTOMER-NUM',targetSkillGroupId:config.targetSkillGroupId,executionQueueId:config.executionQueueId,contactFlowId:spec.flowId,transferEnabled:config.transferEnabled,listSource:'客户名单分配',scheduleAt:'手工启动',createdAt:now(),maxAttemptCount:1,minAttemptInterval:1,owner:'日产中台管理员',simulation:true});d.tasks.push(task);}
      const list=spec.callType==='预外呼'?d.predictiveTasks:d.ivrTasks;if(!list.some(x=>x.taskId===task.taskId))list.push(task);
    }
    for(const call of saved.calls||[])add(d.calls,'callId',call);
  }
  function saveTask(task){if(!saved.enabled||!f.tasks.some(x=>x.taskId===task.taskId))return;const i=saved.tasks.findIndex(x=>x.taskId===task.taskId);if(i<0)saved.tasks.push(structuredClone(task));else saved.tasks[i]=structuredClone(task);save();}
  function prepare(){
    if(!allowed())return false;
    if(!CustomerDemo.prepare())return false;
    try{
      resources();const batches=JSON.parse(localStorage.getItem(batchKey)||'[]');
      if(!batches.some(b=>b.id==='DEMO-LINK-BATCH'))batches.unshift({id:'DEMO-LINK-BATCH',name:'流程演示 · 自动外呼客户',tenantId:f.tenantId,enterpriseId:f.enterpriseId,createdAt:now(),createdBy:AppState.get().accountId,simulation:true,errors:[],rows:f.customers.map(x=>({...x,taskName:f.tasks.find(t=>t.taskId===x.taskId).name,method:f.tasks.find(t=>t.taskId===x.taskId).callType,ownerId:'',followup:'待联系',calls:[],history:[{at:now(),action:'演示预分配',targetId:x.taskId}]}))});
      localStorage.setItem(batchKey,JSON.stringify(batches));saved.enabled=true;save();CloudTaskWorkspace.syncAssignedCustomers();open();return true;
    }catch(_){showToast('演示数据保存失败，请检查存储后重试','error');return false;}
  }
  function record(task,customer,result,agent){
    const at=now(),connected=result==='接通',ivr=task?.callType==='IVR 外呼';
    const call={callId:'DEMO-LINK-CALL-'+crypto.randomUUID(),tenantId:f.tenantId,enterpriseId:f.enterpriseId,callType:task?.callType||'呼入',direction:task?'呼出':'呼入',taskId:task?.taskId||'',customerTaskItemId:customer.id||'',customerName:customer.name,externalDocumentId:customer.externalDocumentId||'',caller:task?'02100009009':customer.phone,callee:task?customer.phone:'02100009010',callerNumberId:task?'DEMO-CUSTOMER-NUM':'DEMO-LINK-IN-NUM',agentIdentityId:agent?.contactCenterIdentityId||'',contactCenterIdentityId:agent?.contactCenterIdentityId||'',agentName:agent?.userName||'',skillGroupId:agent?'DEMO-CUSTOMER-SKILL':'',ringingAt:at,queueAt:agent?at:'—',answeredAt:connected?at:'—',endedAt:at,durationSeconds:0,result,agentDisposition:connected?(ivr?'模拟：客户按1确认知悉':'模拟：完成沟通'):result==='待确认'?'模拟：结果待确认':'模拟：未接通',processingStatus:'已完成',recordingApplicability:ivr?'NOT_APPLICABLE_PURE_IVR':'演示无录音',recordingStatus:ivr?'不适用':'演示无录音',recordingSource:'本地模拟，无音频',recordingScope:'不适用',callSource:'LOCAL_SCENARIO_DEMO',simulation:true,...(ivr?{ivrEvidence:{contactFlow:task.contactFlowId,flowVersion:'DEMO-V1',mediaVersion:'模拟素材',dialAt:at,nodes:connected?[{at,node:'播放通知',result:'模拟完成'},{at,node:'按键1',result:'确认知悉'}]:[],finalResult:result}}:{})};
    Object.assign(call,CustomerBusiness.snapshot({...customer,tenantId:call.tenantId,enterpriseId:call.enterpriseId}),window.RepeatPredictive?.callMetadata(customer)||{});
    return normalizeSimulation(call,result,agent);
  }
  function normalizeSimulation(call,result,agent){
    const ring=Date.parse(call.ringingAt),end=Date.parse(call.endedAt),answer=Date.parse(call.answeredAt),incoming=call.direction==='呼入';
    call.contactId=call.callId;
    CallState.start(call,{at:ring,scenario:call.callType,source:'local-simulation'});
    const feed=(participant,type,at)=>CallState.ingest(call,{enterpriseId:call.enterpriseId,contactId:call.contactId,channelId:call.callId+(participant==='customer'?'-leg-1':'-leg-2'),role:participant,type,at,source:'local-simulation'});
    feed('customer','Dialing',ring);feed('customer','Ringing',ring);
    // An inbound caller already reached the IVR even when the agent queue times out.
    const customerAt=incoming?ring:result==='接通'?answer:null;
    if(customerAt!==null)feed('customer','Established',customerAt);
    if(agent&&result==='接通'){feed('agent','Ringing',answer);feed('agent','Established',answer);}
    feed('customer','Released',end);if(agent)feed('agent','Released',end);
    CallState.finish(call,{at:end});
    const final={EnterpriseId:call.enterpriseId,ContactId:call.contactId,ReleaseTime:end,ContactDisposition:result==='未接通'?'NoAnswer':result==='排队超时'?'QueuingTimeout':result==='接通'?'Success':''};
    if(customerAt!==null)final.CustomerEvents=[{EventSequence:[{Event:'Established',EventTime:customerAt}]}];
    if(agent&&result==='接通')final.AgentEvents=[{EventSequence:[{Event:'Established',EventTime:answer}]}];
    if(call.callType==='预外呼'&&customerAt!==null){final.CustomerEstablishedTime=customerAt;if(agent)final.AgentEstablishedTime=answer;}
    CallState.reconcile(call,final,{source:'local-simulation'});
    if(!incoming&&result==='未接通'&&call.callType!=='IVR 外呼')call.alictiCdr=AliCtiNumberStatus.demoCdr(call.callType==='预外呼'?'predictive':'manual',718);
    return call;
  }
  function seat(){const g=d.physicalSkillGroups.find(x=>x.physicalGroupId==='DEMO-CUSTOMER-PHY');return g&&CloudResourceRules.members(g).map(r=>d.agents.find(a=>a.contactCenterIdentityId===r.identityId)).find(a=>a&&a.lifecycleStatus==='已启用'&&a.acceptNewTasks&&!a.currentCall&&a.agentStatus==='空闲');}
  // Ordinary locally-created tasks share the result collection used by records,
  // dashboards and batch history. They never enter the fixed sample preparation.
  const localKey='local-task-result-journal-v1';
  const executing=new Set();
  function journal(){
    const value=JSON.parse(localStorage.getItem(localKey)||'{"version":1,"calls":[]}');
    if(value.version!==1||!Array.isArray(value.calls))throw Error('本地演示记录格式无效');
    return value;
  }
  function localTask(task){return !!window.CloudTaskWorkspace?.isLocalSimulationTask(task)&&!d.calls.some(c=>c.taskId===task.taskId&&!c.simulation);}
  function localAllowed(task){
    const access=AppState.effectiveAccess(),s=AppState.get();
    const tenant=d.tenants.find(t=>t.tenantId===task?.tenantId);
    return d.demoSwitchEnabled&&access.valid&&s.activeDomain==='CLOUD_CONTACT_CENTER'&&['ADMIN','SUPER_ADMIN'].includes(access.roleCode)&&
      localTask(task)&&['预外呼','IVR 外呼'].includes(task.callType)&&tenant?.status==='启用'&&tenant.enterpriseId===task.enterpriseId&&
      task.enterpriseId===s.enterpriseId&&AppState.authorizeObject('task.create',task);
  }
  function recipientSettings(task){
    const values={};
    for(const source of [task.executionConfig,task.alictiCreateDraft?.fields,task,task.planSnapshot]){
      if(!source)continue;
      for(const key of ['callGroupType','cnos','agentGroup','outboundGroupId','outboundGroupSnapshot'])if(Object.hasOwn(source,key))values[key]=source[key];
    }
    return values;
  }
  function effectiveConfig(task){
    const config=task.executionConfig,snapshot=task.planSnapshot;
    if(!config||config.tenantId!==task.tenantId||config.enterpriseId!==task.enterpriseId||config.callType!==task.callType)return null;
    const caller=AliCtiFields.taskCallerSettings(task);
    return {...config,...recipientSettings(task),...caller,allowedCallerNumberIds:caller.callerMode==='navigation'?[]:snapshot?.callerNumberIds||(task.callerNumberId?[task.callerNumberId]:config.allowedCallerNumberIds||[]),targetSkillGroupId:snapshot?snapshot.skillGroupId:config.targetSkillGroupId,executionQueueId:snapshot?snapshot.executionQueueId:config.executionQueueId,contactFlowId:snapshot?snapshot.contactFlowId:config.contactFlowId,transferEnabled:snapshot?snapshot.transferEnabled:config.transferEnabled};
  }
  function assignedSeats(task,config){
    let candidates=[];
    if(Number(config.callGroupType)===2||config.agentGroup||config.outboundGroupId){
      const result=window.OutboundGroups?.resolve(config,task);
      candidates=result?.ok?result.members:[];
    }else if(Object.hasOwn(config,'cnos')){
      const cnos=(Array.isArray(config.cnos)?config.cnos:typeof config.cnos==='string'?config.cnos.split(','):[]).filter(cno=>typeof cno==='string').map(cno=>cno.trim()).filter(Boolean);
      candidates=d.agents.filter(agent=>cnos.includes(agent.cno));
    }else{
      const group=d.physicalSkillGroups.find(group=>group.skillGroupId===config.targetSkillGroupId&&group.tenantId===task.tenantId&&group.enterpriseId===task.enterpriseId&&group.status==='已启用');
      candidates=group?CloudResourceRules.members(group).filter(row=>row.syncStatus===undefined||row.syncStatus==='同步成功').map(row=>d.agents.find(agent=>agent.contactCenterIdentityId===row.identityId)):[];
    }
    return candidates.filter(agent=>agent&&agent.tenantId===task.tenantId&&agent.enterpriseId===task.enterpriseId&&agent.lifecycleStatus==='已启用'&&agent.syncStatus==='同步成功'&&agent.acceptNewTasks!==false&&agent.callEnabled!==false);
  }
  function localSeat(task,config){
    return assignedSeats(task,config).find(agent=>!agent.currentCall&&agent.agentStatus==='空闲');
  }
  function localRecord(task,customer,result,agent,config){
    const endedMs=Date.now(),at=new Date(endedMs).toLocaleString('sv-SE'),connected=result==='接通',ivr=task.callType==='IVR 外呼',pureIvr=ivr&&!agent;
    const durationSeconds=connected?(pureIvr?18:62):0,simulatedRingSeconds=3;
    const answeredMs=endedMs-durationSeconds*1000;
    const ringingAt=new Date(answeredMs-simulatedRingSeconds*1000).toLocaleString('sv-SE');
    const answeredAt=connected?new Date(answeredMs).toLocaleString('sv-SE'):'—';
    const navigation=config.callerMode==='navigation',number=navigation?null:d.phoneNumbers.find(n=>n.numberId===config.allowedCallerNumberIds?.[0]);
    const call={
      callId:'LOCAL-TASK-CALL-'+crypto.randomUUID(),tenantId:task.tenantId,enterpriseId:task.enterpriseId,
      callType:task.callType,direction:'呼出',taskId:task.taskId,customerTaskItemId:customer.id,customerName:customer.name,...CustomerBusiness.snapshot({...customer,tenantId:task.tenantId,enterpriseId:task.enterpriseId}),
      caller:number?.number||'',callee:customer.phone,callerNumberId:number?.numberId||'',agentIdentityId:agent?.contactCenterIdentityId||'',
      contactCenterIdentityId:agent?.contactCenterIdentityId||'',agentName:agent?.userName||'',skillGroupId:agent?config.targetSkillGroupId||'':'',
      executionQueueId:config.executionQueueId,contactFlowId:config.contactFlowId,ringingAt,answeredAt,endedAt:at,
      durationSeconds,durationSource:'LOCAL_SIMULATION',attemptNumber:1,hasNextAttempt:false,
      ...(navigation?{callerMode:'navigation',callerSelectionSource:'LOCAL_SIMULATION_UNRESOLVED'}:{}),
      result,agentDisposition:connected?(pureIvr?'模拟：客户确认知悉':'模拟：完成沟通'):result==='待确认'?'模拟：结果待确认':'模拟：未接通',processingStatus:'已完成',
      recordingApplicability:pureIvr?'NOT_APPLICABLE_PURE_IVR':'演示无录音',recordingStatus:pureIvr?'不适用':'演示无录音',
      recordingSource:'本地模拟，无音频',recordingScope:'不适用',callSource:'LOCAL_TASK_SIMULATION',simulation:true,
      ...(ivr?{ivrEvidence:{contactFlow:config.contactFlowId,flowVersion:task.planVersion||'本地配置',mediaVersion:'本地结果模拟',dialAt:ringingAt,nodes:connected?[{at,node:agent?'模拟转人工完成':'模拟流程完成',result:'本地结果，不代表阿里已执行'}]:[],finalResult:result}}:{}),
    };
    Object.assign(call,window.RepeatPredictive?.callMetadata(customer)||{});
    return normalizeSimulation(call,result,agent);
  }
  function confirmedLocalCalls(task,value){
    const batches=JSON.parse(localStorage.getItem(batchKey)||'[]');
    if(!Array.isArray(batches))return [];
    const customers=batches.filter(b=>b.tenantId===task.tenantId&&b.enterpriseId===task.enterpriseId).flatMap(b=>(b.rows||[]).filter(r=>r.taskId===task.taskId));
    return value.calls.filter(c=>c.simulation===true&&c.callSource==='LOCAL_TASK_SIMULATION'&&c.taskId===task.taskId&&c.tenantId===task.tenantId&&c.enterpriseId===task.enterpriseId&&customers.some(r=>r.id===c.customerTaskItemId&&localPhone(r.phone)&&localPhone(r.phone)===localPhone(c.callee)&&(r.calls||[]).some(x=>x.callId===c.callId&&x.result===c.result&&x.at===c.endedAt)));
  }
  function localPhone(value){
    if(window.CustomerDirectory?.normalizePhone)return CustomerDirectory.normalizePhone(value);
    const phone=String(value??'').normalize('NFKC').trim().replace(/[\s()（）\-－]/g,'').replace(/^(?:\+86|0086)(?=\d{7,13}$)/,'');
    return /^\d{7,15}$/.test(phone)?phone:'';
  }
  function restoreCommittedCall(call){
    const existing=d.calls.find(c=>c.callId===call.callId);
    if(!existing){add(d.calls,'callId',call);return true;}
    const phone=localPhone(call.callee),existingPhones=[existing.customerPhone,existing.callee].map(localPhone).filter(Boolean);
    if(existing.tenantId!==call.tenantId||existing.enterpriseId!==call.enterpriseId||!phone||!existingPhones.length||existingPhones.some(value=>value!==phone)||
      (existing.customerTaskItemId&&existing.customerTaskItemId!==call.customerTaskItemId)||(existing.taskId&&existing.taskId!==call.taskId)||
      (localPhone(existing.caller)&&localPhone(call.caller)&&localPhone(existing.caller)!==localPhone(call.caller)))return false;
    if(existing.directoryMeta?.legacyOnly){
      // A batch snapshot is only a placeholder. Upgrade it only with a journal
      // result whose batch commit and customer boundary were both confirmed.
      const meta=existing.directoryMeta;
      Object.assign(existing,structuredClone(call),{directoryMeta:{...meta,legacyOnly:false,sources:Array.from(new Set([...(meta.sources||[]),'本地任务结果记录']))}});
    }
    return true;
  }
  function mergeProgress(task,calls){
    const restored=calls.filter(restoreCommittedCall);
    const completed=new Set(restored.map(c=>c.customerTaskItemId)).size;
    // Never overwrite another result producer's counters or resurrect stopped tasks.
    task.completed=Math.max(Number(task.completed)||0,completed);
    task.connected=new Set(restored.filter(connected).map(c=>c.customerTaskItemId)).size;
    settleExhaustedTask(task);
    return restored.length;
  }
  function restoreLocalResults(){
    try{const value=journal();let restored=0;for(const task of d.tasks.filter(localTask))restored+=mergeProgress(task,confirmedLocalCalls(task,value));if(restored)window.CustomerDirectory?.sync?.();}
    catch(_){/* Preserve unrecognized storage rather than clearing user data. */}
  }
  function runLocalNext(taskId,result){
    const task=d.tasks.find(t=>t.taskId===taskId);
    if(!localAllowed(task)||!simulationResults.includes(result)||executing.has(taskId))return false;
    if(task.status!=='执行中'||task.stopNewDialing||task.resourcePause){showToast('请先启动或继续任务；暂停、终止、完成后不能生成新结果','warning');return false;}
    let value;try{value=journal();mergeProgress(task,confirmedLocalCalls(task,value));}catch(_){showToast('本地记录无法读取，请先检查浏览器存储','error');return false;}
    if(task.status!=='执行中')return false;
    const config=effectiveConfig(task),error=CloudTaskWorkspace.simulationResourceError(task);
    if(!config||error){showToast(error||'任务执行配置与归属不一致','warning');return false;}
    const selectedNumber=d.phoneNumbers.find(n=>n.numberId===config.allowedCallerNumberIds?.[0]);
    if(config.callerMode!=='navigation'&&(!selectedNumber?.number||String(selectedNumber.number).replace(/\D/g,'').startsWith('400'))){showToast('请选择可呼出的本租户授权号码，400号码仅呼入','warning');return false;}
    const customer=CustomerTasks.taskCustomers(task).find(c=>uncalled(c)&&!value.calls.some(v=>v.taskId===task.taskId&&v.customerTaskItemId===c.id));
    if(!customer){showToast('本任务没有尚未模拟的客户；不会自动重呼','info');return false;}
    const needsAgent=result==='接通'&&(task.callType==='预外呼'||config.transferEnabled),agent=needsAgent?localSeat(task,config):null;
    if(needsAgent&&!agent){showToast('所选接听团队暂无空闲且有效的坐席，请先完成当前通话或调整坐席状态','warning');return false;}
    const call=localRecord(task,customer,result,agent,config),previous=JSON.stringify(value);
    executing.add(taskId);
    try{
      value.calls.push(call);localStorage.setItem(localKey,JSON.stringify(value));
      if(!CustomerTasks.acceptTaskDemoResult(task,call)){localStorage.setItem(localKey,previous);return false;}
      mergeProgress(task,confirmedLocalCalls(task,value));task.updatedAt=now();
      let summarySaved=false;try{summarySaved=CloudTaskWorkspace.saveDemoTask(task);}catch(_){}
      window.CustomerDirectory?.sync?.();
      CloudTaskWorkspace.openTask(taskId);
      showToast(summarySaved?'已模拟1位客户结果，客户名单、任务、记录和报表已更新':'客户结果已保存；任务摘要未能保存，刷新后将按结果恢复',summarySaved?'success':'warning');
      return true;
    }catch(_){
      // A batch result, once saved, is the commit evidence. Do not erase it if
      // summary/UI refresh fails; on reload the journal reconstructs progress.
      let committed=[];try{committed=confirmedLocalCalls(task,value);}catch(_){}
      if(committed.some(c=>c.callId===call.callId)){mergeProgress(task,committed);showToast('客户结果已保存，页面刷新失败；请刷新后查看','warning');return true;}
      try{localStorage.setItem(localKey,previous);}catch(_){}
      showToast('本地结果未保存，请检查存储后重试','error');return false;
    }finally{executing.delete(taskId);}
  }
  function localPanel(task){
    if(!localAllowed(task))return '';
    const pending=CustomerTasks.taskCustomers(task).filter(uncalled).length;
    const enabled=task.status==='执行中'&&!task.stopNewDialing&&!task.resourcePause&&pending>0;
    const action=result=>ui.escape('ScenarioDemo.runNext('+JSON.stringify(task.taskId)+','+JSON.stringify(result)+')');
    return '<div class="customer-demo-bar"><div><strong>本地结果模拟 · '+ui.escape(task.callType)+' · 剩余 '+pending+' 位</strong><small>显式点击仅处理下一位客户；不拨号、不自动重呼、不生成录音，不代表阿里POC通过。</small></div><button class="btn" '+(!enabled?'disabled':'')+' onclick="'+action('接通')+'">模拟下一位接通</button><button class="btn" '+(!enabled?'disabled':'')+' onclick="'+action('未接通')+'">模拟下一位未接通</button><button class="btn" '+(!enabled?'disabled':'')+' onclick="'+action('待确认')+'">模拟结果待确认</button></div>';
  }
  function canConfirmResult(call){
    const task=d.tasks.find(task=>task.taskId===call?.taskId&&task.tenantId===call.tenantId&&task.enterpriseId===call.enterpriseId);
    if(!task||call.simulation!==true||call.telephony?.source!=='local-simulation'||CallState.view(call).known||!CallState.view(call).ended)return false;
    return call.callSource==='LOCAL_TASK_SIMULATION'&&localAllowed(task);
  }
  function confirmResult(taskId,callId,outcome){
    const call=d.calls.find(call=>call.callId===callId&&call.taskId===taskId),task=d.tasks.find(task=>task.taskId===taskId&&task.tenantId===call?.tenantId&&task.enterpriseId===call?.enterpriseId);
    if(!['接通','未接通'].includes(outcome)||!canConfirmResult(call))return false;
    const journalName=localKey;
    let value,previous;
    try{previous=localStorage.getItem(journalName);value=JSON.parse(previous||'null');}catch(_){return false;}
    const index=value?.calls?.findIndex(item=>item.callId===callId&&item.taskId===taskId&&item.tenantId===call.tenantId&&item.enterpriseId===call.enterpriseId&&item.customerTaskItemId===call.customerTaskItemId&&localPhone(item.callee)===localPhone(call.callee));
    if(index===undefined||index<0||value.calls[index].simulation!==true||value.calls[index].callSource!=='LOCAL_TASK_SIMULATION'||value.calls[index].telephony?.source!=='local-simulation'||CallState.view(value.calls[index]).known)return false;
    const next=structuredClone(value.calls[index]),at=Date.parse(next.endedAt);
    const final={EnterpriseId:next.enterpriseId,ContactId:next.contactId,ReleaseTime:at,ContactDisposition:outcome==='接通'?'Success':'NoAnswer'};
    if(outcome==='接通')final.CustomerEvents=[{EventSequence:[{Event:'Established',EventTime:at}]}];
    if(!CallState.reconcile(next,final,{source:'local-simulation'}).accepted)return false;
    if(outcome==='未接通'&&next.callType==='预外呼')next.alictiCdr=AliCtiNumberStatus.demoCdr('predictive',718);
    next.result=outcome;next.answeredAt=outcome==='接通'?new Date(at).toLocaleString('sv-SE'):'—';
    // Correct the existing journal entry and batch snapshot together; never append a new attempt.
    value.calls[index]=next;
    try{
      localStorage.setItem(journalName,JSON.stringify(value));
      if(!CustomerTasks.syncCall(next)){localStorage.setItem(journalName,previous);return false;}
    }catch(_){try{if(previous!==null)localStorage.setItem(journalName,previous);}catch(_){}showToast('模拟话单未保存，请检查浏览器存储','error');return false;}
    Object.assign(call,next);
    const taskCalls=value.calls.filter(item=>item.taskId===taskId&&item.tenantId===task.tenantId&&item.enterpriseId===task.enterpriseId);
    task.connected=new Set(taskCalls.filter(connected).map(item=>item.customerTaskItemId)).size;
    try{CloudTaskWorkspace.saveDemoTask(task);}catch(_){}
    window.CustomerDirectory?.sync?.();CloudTaskWorkspace.openTask(taskId,'calls');
    showToast('模拟话单已补齐，已更新原通话与统计；未重新呼叫','success');return true;
  }
  function runNext(taskId,result='接通'){
    if(localTask(d.tasks.find(t=>t.taskId===taskId)))return runLocalNext(taskId,result);
    if(!allowed()||!saved.enabled||!simulationResults.includes(result))return false;
    const t=d.tasks.find(x=>x.taskId===taskId);if(!f.tasks.some(x=>x.taskId===taskId)||t?.status!=='执行中')return false;
    const error=CloudResourceRules.validatePlan(t.executionConfig,true);if(error){showToast(error,'warning');return false;}
    const customer=CustomerTasks.taskCustomers(t).find(c=>uncalled(c)&&!saved.calls.some(call=>call.taskId===taskId&&call.customerTaskItemId===c.id));
    if(!customer)return false;
    const agent=t.callType==='预外呼'&&result==='接通'?seat():null;if(t.callType==='预外呼'&&result==='接通'&&!agent){showToast('没有空闲演示坐席，请先完成当前通话','warning');return false;}
    const call=record(t,customer,result,agent),old=structuredClone(saved);
    // Write the result journal first. If batch write fails, roll the journal back.
    try{saved.calls.push(call);save();if(!CustomerTasks.acceptTaskDemoResult(t,call)){saved=old;save();return false;}}
    catch(_){saved=old;showToast('结果保存失败，请重试','error');return false;}
    add(d.calls,'callId',call);const calls=saved.calls.filter(c=>c.taskId===taskId);t.completed=calls.length;t.connected=calls.filter(connected).length;t.updatedAt=now();
    settleExhaustedTask(t);CloudTaskWorkspace.saveDemoTask(t);CloudTaskWorkspace.openTask(taskId);showToast('已模拟1位客户结果，名单、通话记录和报表已更新','success');return true;
  }
  function inbound(result='接通'){
    if(!allowed()||!saved.enabled||!['接通','排队超时'].includes(result))return false;
    const route=d.inboundRoutes.find(r=>r.routeId===f.inboundRoute.routeId),number=d.phoneNumbers.find(n=>n.numberId===route?.numberId);
    if(route?.status!=='已发布'||!number||!CloudResourceRules.usableNumber(number,f.tenantId,'呼入')){showToast('演示呼入号码或规则不可用','warning');return false;}
    const branch=route.branches.find(b=>b.branchCode==='DTMF-1');
    if(branch?.tenantId!==f.tenantId||branch.physicalGroupId!=='DEMO-CUSTOMER-PHY'||!d.contactFlows.some(flow=>flow.contactFlowId===route.contactFlowId&&flow.enterpriseId===f.enterpriseId&&flow.status==='已发布')){showToast('演示导航已变更，请核对按1分支与发布流程','warning');return false;}
    const agent=result==='接通'?seat():null;if(result==='接通'&&!agent){showToast('没有空闲演示坐席','warning');return false;}
    const call=record(null,{name:'演示来电客户',phone:'13800000209'},result,agent);call.routeEvidence='模拟来电 → 按1客户邀约 → 东风日产总部 → '+(agent?'坐席接听':'排队超时');
    try{saved.calls.push(call);save();}catch(_){saved.calls.pop();showToast('记录保存失败','error');return false;}add(d.calls,'callId',call);RouteRuntime.openSecondary('cloud-call-records',{type:'呼入'});return true;
  }
  function panel(task){if(localTask(task))return localPanel(task);if(!allowed()||!saved.enabled||!f.tasks.some(x=>x.taskId===task.taskId))return '';
    return '<div class="customer-demo-bar"><div><strong>本地任务演示 · '+task.completed+'/'+task.total+'</strong><small>先启动任务，再逐位模拟结果；暂停后停止。不会拨号，本轮不模拟自动重呼。</small></div><button class="btn" '+(task.status!=='执行中'?'disabled':'')+' onclick="ScenarioDemo.runNext(\''+task.taskId+'\',\'接通\')">模拟一位接通</button><button class="btn" '+(task.status!=='执行中'?'disabled':'')+' onclick="ScenarioDemo.runNext(\''+task.taskId+'\',\'未接通\')">模拟一位未接通</button><button class="btn" '+(task.status!=='执行中'?'disabled':'')+' onclick="ScenarioDemo.runNext(\''+task.taskId+'\',\'待确认\')">模拟结果待确认</button></div>';
  }
  function open(){if(!allowed())return;ui.openLayer('scenario-demo','<div class="layer-header"><h2>模块联动演示</h2><button onclick="PlatformUI.closeLayer(\'scenario-demo\')">×</button></div><div class="layer-body"><p>仅本地演示，不调用AliCti。已有进度不会重置。</p>'+f.tasks.map(t=>'<p><button class="btn" onclick="PlatformUI.closeLayer(\'scenario-demo\');CloudTaskWorkspace.openTask(\''+t.taskId+'\')">'+ui.escape(t.name)+'</button> 启动 → 模拟结果 → 查通话和客户批次</p>').join('')+'<p><button class="btn" onclick="PlatformUI.closeLayer(\'scenario-demo\');CustomerTasks.open(\'DEMO-LINK-BATCH\')">查看自动外呼客户批次</button></p><p><button class="btn" onclick="PlatformUI.closeLayer(\'scenario-demo\');ScenarioDemo.inbound(\'接通\')">模拟来电接听</button> <button class="btn" onclick="PlatformUI.closeLayer(\'scenario-demo\');ScenarioDemo.inbound(\'排队超时\')">模拟来电超时</button></p><p>人工外呼：在“导入与分配”切换运营，联系已分配客户并填写结果。通话记录和统计报表读取同一结果。</p></div>','large');}
  // Explicit receiving scenarios are separate from the finished-record samples above.
  // A task customer is selected by its stored task/row identities and verified again
  // immediately before the offer. A matching telephone number never grants access.
  const receivingDraft={kind:'inbound',taskId:'',demoAnswerOutcome:'success'};
  const receivingOffers=new Map();
  let receivingDemoTimer;
  const receivingViewKey=context=>context&&[context.accountId,context.tenantId,context.enterpriseId,context.agent.cno,context.online,context.busy,context.phase,context.call?.callId].join('|');
  function receivingContext(){
    if(d.demoSwitchEnabled!==true||!window.AppState?.isReady()||!AppState.effectiveAccess().valid||AppState.get().activeDomain!=='CLOUD_CONTACT_CENTER')return null;
    const value=window.AgentWorkbench?.receivingContext?.(),state=AppState.get();
    if(!value?.agent||!value.tenant||value.agent.tenantId!==state.tenantId||value.agent.enterpriseId!==state.enterpriseId||value.tenant.tenantId!==state.tenantId)return null;
    return {...value,accountId:state.accountId,tenantId:state.tenantId,enterpriseId:state.enterpriseId};
  }
  function receivingGroups(context){
    if(!context)return [];
    return d.physicalSkillGroups.filter(group=>group.tenantId===context.tenantId&&group.enterpriseId===context.enterpriseId&&group.status==='已启用'&&d.agentSkills.some(relation=>relation.identityId===context.agent.contactCenterIdentityId&&relation.physicalGroupId===group.physicalGroupId&&relation.status==='已生效'&&relation.syncStatus==='同步成功'&&AliCtiFields.validSkillLevel(relation.skillLevel)));
  }
  function receivingTasks(context){
    if(!context||typeof window.CustomerTasks?.receivingItem!=='function')return [];
    let batches=[];try{const value=JSON.parse(localStorage.getItem(batchKey)||'[]');if(Array.isArray(value))batches=value;}catch(_){return [];}
    const groups=receivingGroups(context),result=[];
    for(const task of d.tasks){
      if(task.tenantId!==context.tenantId||task.enterpriseId!==context.enterpriseId||task.callType!=='预外呼'||task.status!=='执行中'||task.stopNewDialing||task.resourcePause||task.alictiTaskControlPending||task.displayOnly||AliCtiFields.code(task.providerStatusCode)===3)continue;
      const skillId=task.planSnapshot?.skillGroupId||task.executionConfig?.targetSkillGroupId||task.targetSkillGroupId;
      const recipients={...recipientSettings(task),targetSkillGroupId:skillId};
      if(!assignedSeats(task,recipients).some(agent=>agent.contactCenterIdentityId===context.agent.contactCenterIdentityId))continue;
      const caller=AliCtiFields.taskCallerSettings(task),callerCheck=AliCtiFields.validateCallerSettings(caller,{requireCallerNumber:false});
      if(!callerCheck.ok)continue;
      const numberIds=task.planSnapshot?.callerNumberIds||(task.callerNumberId?[task.callerNumberId]:task.executionConfig?.allowedCallerNumberIds||[]);
      const number=caller.callerMode==='navigation'?null:d.phoneNumbers.find(number=>numberIds.includes(number.numberId)&&CloudResourceRules.usableNumber(number,context.tenantId,'呼出','预外呼'));
      if(caller.callerMode!=='navigation'&&!number)continue;
      let selected=null;
      const candidates=batches.filter(batch=>batch.tenantId===context.tenantId&&batch.enterpriseId===context.enterpriseId)
        .flatMap(batch=>Array.isArray(batch.rows)?batch.rows:[])
        .filter(item=>item.taskId===task.taskId&&item.method==='预外呼'&&uncalled(item)&&localPhone(item.phone)&&!d.calls.some(call=>call.taskId===task.taskId&&call.customerTaskItemId===item.id));
      for(const item of candidates){
        const verified=CustomerTasks.receivingItem(task.taskId,item.id,context.agent);
        if(verified?.task?.taskId===task.taskId&&verified.item?.id===item.id&&uncalled(verified.item)){
          selected={task,number,group:groups.find(group=>group.skillGroupId===skillId),item:verified.item,batch:verified.batch};break;
        }
      }
      if(selected)result.push(selected);
    }
    return result;
  }
  function receivingInbound(context){
    const groups=receivingGroups(context);
    for(const route of d.inboundRoutes){
      if(route.enterpriseId!==context?.enterpriseId||route.status!=='已发布')continue;
      const number=d.phoneNumbers.find(number=>number.numberId===route.numberId&&CloudResourceRules.usableNumber(number,context.tenantId,'呼入'));
      if(!number)continue;
      const branch=(route.branches||[]).find(branch=>branch.tenantId===context.tenantId&&groups.some(group=>group.physicalGroupId===branch.physicalGroupId));
      if(branch)return {number,route,group:groups.find(group=>group.physicalGroupId===branch.physicalGroupId)};
    }
    return null;
  }
  function receivingOffer(context){
    const contactId=context?.call?.contactId||context?.call?.callId;
    const payload=contactId&&receivingOffers.get(contactId);
    return context?.phase==='offered'&&payload&&payload.tenantId===context.tenantId&&payload.accountId===context.accountId&&payload.enterpriseId===context.enterpriseId&&payload.cno===String(context.agent.cno)?payload:null;
  }
  function receivingTools(){
    if(d.demoSwitchEnabled!==true)return '';
    const context=receivingContext();
    return '<section class="panel-card receiving-demo-entry"><div class="panel-header"><h3>来电演示</h3></div><div class="panel-body"><p>模拟一通来电，体验坐席接听和话后处理。</p><button class="btn" type="button" onclick="ScenarioDemo.openReceivingDemo()"'+(!context?' disabled':'')+'>打开来电演示</button> <button class="btn" type="button" onclick="SeatOperationUI.openConnectionDemo()"'+(!context?' disabled':'')+'>电话连接演示</button><p class="form-help">'+ui.escape(!context?'请先用已关联坐席的账号进入云联络中心。':context.online?'当前坐席已上线。':'请先在坐席工作台上线。')+'</p></div></section>';
  }
  function openReceivingDemo(options){
    const context=receivingContext();if(!context)return showToast('请先进入已关联坐席的云联络中心','warning');
    const tasks=receivingTasks(context),offer=receivingOffer(context),bindType=Number(context.online?(AliCtiAdapter.session?.bindType||3):3);
    if(bindType!==3)receivingDraft.demoAnswerOutcome='success';
    if(!tasks.some(row=>row.task.taskId===receivingDraft.taskId))receivingDraft.taskId=tasks[0]?.task.taskId||'';
    const inboundAvailable=!!receivingInbound(context),selected=tasks.find(row=>row.task.taskId===receivingDraft.taskId);
    const ready=context.online&&!context.busy;
    const action=(kind,label,available,outcome='success')=>'<button type="button" class="btn'+(outcome==='success'?' btn-primary':'')+'" onclick="ScenarioDemo.triggerReceiving(\''+kind+'\',\''+outcome+'\')"'+(!ready||!available?' disabled':'')+'>'+label+'</button>';
    const notice=!context.online?'请先在坐席工作台上线。':context.busy?(offer?'当前有来电等待接听。':'请先完成当前通话及话后处理，再模拟下一通来电。'):'';
    ui.closeLayer('demo-accounts');
    ui.openLayer('receiving-demo','<div class="layer-header"><h2>来电演示</h2><button aria-label="关闭来电演示" onclick="PlatformUI.closeLayer(\'receiving-demo\')">×</button></div><div class="layer-body receiving-demo-body">'+
      '<div class="receiving-demo-person"><strong>'+ui.escape(context.agent.userName||context.agent.cno)+'</strong><span>'+ui.escape(context.tenant.name||context.tenantId)+'</span><span class="receiving-demo-presence">'+(context.online?'已上线':'未上线')+'</span></div>'+
      '<p class="receiving-demo-intro">点击下方按钮，即可进入来电接听流程。</p>'+
      (notice?'<div class="receiving-demo-notice" role="status"><span>'+ui.escape(notice)+'</span>'+(!context.online?'<button type="button" class="btn-link" onclick="PlatformUI.closeLayer(\'receiving-demo\');RouteRuntime.openPrimary(\'seat-workbench\')">前往工作台上线</button>':context.busy?'<button type="button" class="btn-link" onclick="PlatformUI.closeLayer(\'receiving-demo\');AgentWorkbench.openDialog()">'+(offer?'查看来电':'继续处理')+'</button>':'')+'</div>':'')+
      '<div class="receiving-demo-choices"><section class="receiving-demo-choice"><h3>客户主动来电</h3><p>客户拨打服务热线，由你接听。</p>'+action('inbound','模拟呼入来电',inboundAvailable)+(!inboundAvailable?'<small>当前团队暂无可用的呼入服务。</small>':'')+'</section>'+
      '<section class="receiving-demo-choice"><h3>预外呼分配给我</h3><p>预外呼已接通客户，转由你继续沟通。</p>'+action('predictive','模拟预外呼分配',!!selected)+'<small>'+ui.escape(selected?'当前任务：'+selected.task.name:'暂无正在执行且有待联系客户的预外呼任务。')+'</small></section></div>'+
      '<details class="receiving-demo-more" id="receiving-demo-more"'+(options?.more?' open':'')+'><summary>更多演示场景</summary><div class="receiving-demo-more-content">'+
      (tasks.length>1?'<label class="field"><span>切换预外呼任务</span><select id="receiving-demo-task" onchange="ScenarioDemo.setReceivingOption(\'taskId\',this.value)">'+tasks.map(row=>'<option value="'+ui.escape(row.task.taskId)+'"'+(row.task.taskId===receivingDraft.taskId?' selected':'')+'>'+ui.escape(row.task.name)+'</option>').join('')+'</select></label>':'')+
      (bindType===3?'<section><h4>接听失败后重试</h4><p>模拟首次接听失败，再点击“重试接听”。</p><div class="form-actions">'+action('inbound','模拟呼入接听失败',inboundAvailable,'failure')+action('predictive','模拟预外呼接听失败',!!selected,'failure')+'</div></section>':'')+
      '<section><h4>来电未接听</h4><p>'+(offer?'选择当前来电的结束方式。':'先模拟一通来电，再打开这里演示取消或未接听。')+'</p><div class="form-actions"><button type="button" class="btn" onclick="ScenarioDemo.receivingEvent(\'cancelled\')"'+(!offer?' disabled':'')+'>对方取消来电</button><button type="button" class="btn" onclick="ScenarioDemo.receivingEvent(\'missed\')"'+(!offer?' disabled':'')+'>坐席未接听</button></div></section>'+
      ([1,2].includes(bindType)?'<section><h4>电话接听演示</h4><p>使用普通电话或分机时，模拟设备已经接听。</p><button type="button" class="btn" onclick="ScenarioDemo.receivingEvent(\'device-answered\')"'+(!offer?' disabled':'')+'>电话已接听</button></section>':'')+
      '</div></details></div>','small');
    clearInterval(receivingDemoTimer);
    const viewKey=receivingViewKey(context);
    receivingDemoTimer=setInterval(()=>{
      if(!document.getElementById('receiving-demo')){clearInterval(receivingDemoTimer);return;}
      const current=receivingContext();
      if(!current){clearInterval(receivingDemoTimer);ui.closeLayer('receiving-demo');return;}
      if(receivingViewKey(current)!==viewKey)openReceivingDemo({more:!!document.getElementById('receiving-demo-more')?.open});
    },500);
  }
  function setReceivingOption(key,value){
    if(!receivingContext())return false;
    if(key==='kind'&&['inbound','predictive'].includes(value))receivingDraft.kind=value;
    else if(key==='demoAnswerOutcome'&&['success','failure'].includes(value)){const context=receivingContext(),type=Number(context.online?(AliCtiAdapter.session?.bindType||3):3);if(type!==3&&value==='failure')return false;receivingDraft.demoAnswerOutcome=value;}
    else if(key==='taskId'&&receivingTasks(receivingContext()).some(row=>row.task.taskId===value))receivingDraft.taskId=value;
    else return false;
    openReceivingDemo({more:!!document.getElementById('receiving-demo-more')?.open});return true;
  }
  function setReceivingDevice(value){
    const context=receivingContext(),type=Number(value);
    if(!context||context.online||context.busy||type!==3)return false;
    AliCtiAdapter.demoBindType=type;openReceivingDemo();return true;
  }
  function triggerReceiving(kind,outcome){
    const context=receivingContext();
    if(!context||!context.online||context.busy)return false;
    if(kind!==undefined){
      if(!['inbound','predictive'].includes(kind)||!['success','failure'].includes(outcome))return false;
      if(outcome==='failure'&&Number(AliCtiAdapter.session?.bindType||3)!==3)return false;
      receivingDraft.kind=kind;receivingDraft.demoAnswerOutcome=outcome;
    }
    const id='DEMO-RECEIVING-'+crypto.randomUUID(),predictive=receivingDraft.kind==='predictive';
    const candidate=predictive?receivingTasks(context).find(row=>row.task.taskId===receivingDraft.taskId):receivingInbound(context);
    if(!candidate){showToast(predictive?'任务或客户已变化，请重新选择。':'呼入配置已变化，请检查后重试。','warning');openReceivingDemo();return false;}
    const inboundCustomer=f.receiving?.inboundCustomer;
    if(!predictive&&(!localPhone(inboundCustomer?.phone)||!inboundCustomer?.name)){showToast('呼入演示客户尚未配置。','warning');return false;}
    const payload={kind:receivingDraft.kind,tenantId:context.tenantId,accountId:context.accountId,enterpriseId:context.enterpriseId,cno:String(context.agent.cno),callId:id,contactId:id,
      customerNumber:predictive?localPhone(candidate.item.phone):localPhone(inboundCustomer.phone),hotline:candidate.number?.number||'',customerName:predictive?candidate.item.name:inboundCustomer.name,
      callerNumberId:candidate.number?.numberId||'',skillGroupId:candidate.group?.skillGroupId||'',routeId:candidate.route?.routeId||'',
      taskId:predictive?candidate.task.taskId:'',customerTaskItemId:predictive?candidate.item.id:'',
      demoAnswerOutcome:receivingDraft.demoAnswerOutcome,demoTimeoutSeconds:60,source:'local-simulation',mock:true,simulation:true};
    if(predictive)Object.assign(payload,CustomerBusiness.snapshot(candidate.item));
    const result=AgentWorkbench.receiveOffer(payload);
    if(result===false||result?.ok===false)return false;
    receivingOffers.set(id,payload);ui.closeLayer('receiving-demo');return result||true;
  }
  function receivingEvent(action){
    const context=receivingContext(),payload=receivingOffer(context);
    if(!payload||!['device-answered','cancelled','missed'].includes(action))return false;
    const type=Number(context.call?.bindType||AliCtiAdapter.session?.bindType||3);
    if(action==='device-answered'&&![1,2].includes(type))return false;
    // cancelled/missed are local scenario labels, never supplier stateAction enums.
    const stateAction=action==='device-answered'?(payload.kind==='inbound'?'busyIb':'busyOb'):action;
    const result=AgentWorkbench.receiveStatus({tenantId:payload.tenantId,accountId:payload.accountId,enterpriseId:payload.enterpriseId,cno:payload.cno,contactId:payload.contactId,callId:payload.callId,stateAction,source:'local-simulation',mock:true,simulation:true});
    if(result===false||result?.ok===false)return false;
    if(action!=='device-answered')receivingOffers.delete(payload.contactId);
    ui.closeLayer('receiving-demo');return result||true;
  }
  window.ScenarioDemo={prepare,open,runNext,inbound,panel,saveTask,canConfirmResult,confirmResult,receivingTools,openReceivingDemo,setReceivingOption,setReceivingDevice,triggerReceiving,receivingEvent};
  if(saved.enabled)resources();
  restoreLocalResults();
})();
