/** Opt-in linked demo. All execution is explicit and local, never calls CCC. */
(function(){
  'use strict';
  const d=CloudCallData,f=ScenarioDemoData,key='linked-scenario-demo-v1',batchKey='customer-task-batches-v1',ui=PlatformUI;
  const now=()=>new Date().toLocaleString('sv-SE');
  let saved={enabled:false,calls:[],tasks:[]};
  try{saved=JSON.parse(localStorage.getItem(key)||'null')||saved;}catch(_){}
  function allowed(){return d.demoSwitchEnabled&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.get().tenantId===f.tenantId&&AppState.get().instanceId===f.instanceId&&['ADMIN','SUPER_ADMIN'].includes(AppState.effectiveAccess().roleCode)&&AppState.effectiveAccess().valid;}
  function add(list,id,row){if(!list.some(x=>x[id]===row[id]))list.push(structuredClone(row));}
  function save(){localStorage.setItem(key,JSON.stringify(saved));}
  function resources(){
    add(d.phoneNumbers,'numberId',f.inboundNumber);add(d.inboundRoutes,'routeId',f.inboundRoute);
    for(const spec of f.tasks){
      const config={callPlanId:'CONFIG-'+spec.taskId,name:spec.name,tenantId:f.tenantId,instanceId:f.instanceId,callType:spec.callType,status:'已发布',publishedVersion:'DEMO-V1',targetSkillGroupId:spec.callType==='预外呼'?'DEMO-CUSTOMER-SKILL':'',executionQueueId:'DEMO-CUSTOMER-SKILL',contactFlowId:spec.flowId,transferEnabled:spec.callType==='预外呼',allowedCallerNumberIds:['DEMO-CUSTOMER-NUM']};
      let task=d.tasks.find(x=>x.taskId===spec.taskId);
      if(!task){task=structuredClone(saved.tasks.find(x=>x.taskId===spec.taskId)||{...spec,tenantId:f.tenantId,instanceId:f.instanceId,status:'待分配客户',customerSourceMode:'assigned',total:0,completed:0,connected:0,planId:config.callPlanId,executionConfig:config,planVersion:'DEMO-V1',planSnapshot:null,planSnapshotId:'',campaignId:'',callerNumberId:'DEMO-CUSTOMER-NUM',targetSkillGroupId:config.targetSkillGroupId,executionQueueId:config.executionQueueId,contactFlowId:spec.flowId,transferEnabled:config.transferEnabled,listSource:'客户名单分配',scheduleAt:'手工启动',createdAt:now(),maxAttemptCount:1,minAttemptInterval:1,owner:'日产中台管理员',simulation:true});d.tasks.push(task);}
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
      if(!batches.some(b=>b.id==='DEMO-LINK-BATCH'))batches.unshift({id:'DEMO-LINK-BATCH',name:'流程演示 · 自动外呼客户',tenantId:f.tenantId,instanceId:f.instanceId,createdAt:now(),createdBy:AppState.get().accountId,simulation:true,errors:[],rows:f.customers.map(x=>({...x,taskName:f.tasks.find(t=>t.taskId===x.taskId).name,method:f.tasks.find(t=>t.taskId===x.taskId).callType,ownerId:'',followup:'待联系',calls:[],history:[{at:now(),action:'演示预分配',targetId:x.taskId}]}))});
      localStorage.setItem(batchKey,JSON.stringify(batches));saved.enabled=true;save();CloudTaskWorkspace.syncAssignedCustomers();open();return true;
    }catch(_){showToast('演示数据保存失败，请检查存储后重试','error');return false;}
  }
  function record(task,customer,result,agent){
    const at=now(),connected=result==='接通',ivr=task?.callType==='IVR 外呼';
    return {callId:'DEMO-LINK-CALL-'+crypto.randomUUID(),contactId:'本地模拟',tenantId:f.tenantId,instanceId:f.instanceId,callType:task?.callType||'呼入',direction:task?'呼出':'呼入',taskId:task?.taskId||'',customerTaskItemId:customer.id||'',customerName:customer.name,externalDocumentId:customer.externalDocumentId||'',caller:task?'02100009009':customer.phone,callee:task?customer.phone:'02100009010',callerNumberId:task?'DEMO-CUSTOMER-NUM':'DEMO-LINK-IN-NUM',agentIdentityId:agent?.contactCenterIdentityId||'',contactCenterIdentityId:agent?.contactCenterIdentityId||'',agentName:agent?.userName||'',skillGroupId:agent?'DEMO-CUSTOMER-SKILL':'',ringingAt:at,queueAt:agent?at:'—',answeredAt:connected?at:'—',endedAt:at,durationSeconds:0,result,agentDisposition:connected?(ivr?'模拟：客户按1确认知悉':'模拟：完成沟通'):'模拟：未接通',processingStatus:'已完成',recordingApplicability:ivr?'NOT_APPLICABLE_PURE_IVR':'演示无录音',recordingStatus:ivr?'不适用':'演示无录音',recordingSource:'本地模拟，无音频',recordingScope:'不适用',callbackStatus:'无需回流',businessSystemId:'',businessRecordId:'',callSource:'LOCAL_SCENARIO_DEMO',simulation:true,...(ivr?{ivrEvidence:{contactFlow:task.contactFlowId,flowVersion:'DEMO-V1',mediaVersion:'模拟素材',dialAt:at,nodes:connected?[{at,node:'播放通知',result:'模拟完成'},{at,node:'按键1',result:'确认知悉'}]:[],finalResult:result}}:{})};
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
      localTask(task)&&['预外呼','IVR 外呼'].includes(task.callType)&&tenant?.status==='启用'&&tenant.instanceId===task.instanceId&&
      task.instanceId===s.instanceId&&AppState.authorizeObject('task.create',task);
  }
  function effectiveConfig(task){
    const config=task.executionConfig,snapshot=task.planSnapshot;
    if(!config||config.tenantId!==task.tenantId||config.instanceId!==task.instanceId||config.callType!==task.callType)return null;
    return {...config,allowedCallerNumberIds:snapshot?.callerNumberIds||(task.callerNumberId?[task.callerNumberId]:config.allowedCallerNumberIds),targetSkillGroupId:snapshot?snapshot.skillGroupId:config.targetSkillGroupId,executionQueueId:snapshot?snapshot.executionQueueId:config.executionQueueId,contactFlowId:snapshot?snapshot.contactFlowId:config.contactFlowId,transferEnabled:snapshot?snapshot.transferEnabled:config.transferEnabled};
  }
  function localSeat(task,config){
    const g=d.physicalSkillGroups.find(g=>g.skillGroupId===config.targetSkillGroupId&&g.tenantId===task.tenantId&&g.instanceId===task.instanceId&&g.status==='已启用');
    return g&&CloudResourceRules.members(g).filter(r=>r.syncStatus===undefined||r.syncStatus==='同步成功').map(r=>d.agents.find(a=>a.contactCenterIdentityId===r.identityId)).find(a=>a&&a.tenantId===task.tenantId&&a.instanceId===task.instanceId&&a.lifecycleStatus==='已启用'&&a.syncStatus==='同步成功'&&a.acceptNewTasks!==false&&!a.currentCall&&a.agentStatus==='空闲');
  }
  function localRecord(task,customer,result,agent,config){
    const endedMs=Date.now(),at=new Date(endedMs).toLocaleString('sv-SE'),connected=result==='接通',ivr=task.callType==='IVR 外呼',pureIvr=ivr&&!agent;
    const durationSeconds=connected?(pureIvr?18:62):0,simulatedRingSeconds=3;
    const answeredMs=endedMs-durationSeconds*1000;
    const ringingAt=new Date(answeredMs-simulatedRingSeconds*1000).toLocaleString('sv-SE');
    const answeredAt=connected?new Date(answeredMs).toLocaleString('sv-SE'):'—';
    const number=d.phoneNumbers.find(n=>n.numberId===config.allowedCallerNumberIds[0]);
    return {
      callId:'LOCAL-TASK-CALL-'+crypto.randomUUID(),contactId:'本地模拟',tenantId:task.tenantId,instanceId:task.instanceId,
      callType:task.callType,direction:'呼出',taskId:task.taskId,customerTaskItemId:customer.id,customerName:customer.name,externalDocumentId:customer.externalDocumentId||'',
      caller:number.number,callee:customer.phone,callerNumberId:number.numberId,agentIdentityId:agent?.contactCenterIdentityId||'',
      contactCenterIdentityId:agent?.contactCenterIdentityId||'',agentName:agent?.userName||'',skillGroupId:agent?config.targetSkillGroupId:'',
      executionQueueId:config.executionQueueId,contactFlowId:config.contactFlowId,ringingAt,answeredAt,endedAt:at,
      durationSeconds,durationSource:'LOCAL_SIMULATION',attemptNumber:1,hasNextAttempt:false,
      result,agentDisposition:connected?(pureIvr?'模拟：客户确认知悉':'模拟：完成沟通'):'模拟：未接通',processingStatus:'已完成',
      recordingApplicability:pureIvr?'NOT_APPLICABLE_PURE_IVR':'演示无录音',recordingStatus:pureIvr?'不适用':'演示无录音',
      recordingSource:'本地模拟，无音频',recordingScope:'不适用',callbackStatus:'无需回流',businessSystemId:'',businessRecordId:'',
      callSource:'LOCAL_TASK_SIMULATION',simulation:true,
      ...(ivr?{ivrEvidence:{contactFlow:config.contactFlowId,flowVersion:task.planVersion||'本地配置',mediaVersion:'本地结果模拟',dialAt:ringingAt,nodes:connected?[{at,node:agent?'模拟转人工完成':'模拟流程完成',result:'本地结果，不代表阿里已执行'}]:[],finalResult:result}}:{}),
    };
  }
  function confirmedLocalCalls(task,value){
    const batches=JSON.parse(localStorage.getItem(batchKey)||'[]');
    if(!Array.isArray(batches))return [];
    const customers=batches.filter(b=>b.tenantId===task.tenantId&&b.instanceId===task.instanceId).flatMap(b=>(b.rows||[]).filter(r=>r.taskId===task.taskId));
    return value.calls.filter(c=>c.simulation===true&&c.callSource==='LOCAL_TASK_SIMULATION'&&c.taskId===task.taskId&&c.tenantId===task.tenantId&&c.instanceId===task.instanceId&&customers.some(r=>r.id===c.customerTaskItemId&&localPhone(r.phone)&&localPhone(r.phone)===localPhone(c.callee)&&(r.calls||[]).some(x=>x.callId===c.callId&&x.result===c.result&&x.at===c.endedAt)));
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
    if(existing.tenantId!==call.tenantId||existing.instanceId!==call.instanceId||!phone||!existingPhones.length||existingPhones.some(value=>value!==phone)||
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
    task.connected=Math.max(Number(task.connected)||0,new Set(restored.filter(c=>c.result==='接通').map(c=>c.customerTaskItemId)).size);
    if(task.status==='执行中'&&task.total>0&&task.completed>=task.total){task.status='已完成';task.stopNewDialing=true;}
    return restored.length;
  }
  function restoreLocalResults(){
    try{const value=journal();let restored=0;for(const task of d.tasks.filter(localTask))restored+=mergeProgress(task,confirmedLocalCalls(task,value));if(restored)window.CustomerDirectory?.sync?.();}
    catch(_){/* Preserve unrecognized storage rather than clearing user data. */}
  }
  function runLocalNext(taskId,result){
    const task=d.tasks.find(t=>t.taskId===taskId);
    if(!localAllowed(task)||!['接通','未接通'].includes(result)||executing.has(taskId))return false;
    if(task.status!=='执行中'||task.stopNewDialing||task.resourcePause){showToast('请先启动或继续任务；暂停、终止、完成后不能生成新结果','warning');return false;}
    let value;try{value=journal();mergeProgress(task,confirmedLocalCalls(task,value));}catch(_){showToast('本地记录无法读取，请先检查浏览器存储','error');return false;}
    if(task.status!=='执行中')return false;
    const config=effectiveConfig(task),error=CloudTaskWorkspace.simulationResourceError(task);
    if(!config||error){showToast(error||'任务执行配置与归属不一致','warning');return false;}
    const selectedNumber=d.phoneNumbers.find(n=>n.numberId===config.allowedCallerNumberIds?.[0]);
    if(!selectedNumber?.number||String(selectedNumber.number).replace(/\D/g,'').startsWith('400')){showToast('请选择可呼出的本租户授权号码，400号码仅呼入','warning');return false;}
    const customer=CustomerTasks.taskCustomers(task).find(c=>!(c.calls||[]).length&&!c.activeCallId&&c.followup!=='已完成'&&!value.calls.some(v=>v.taskId===task.taskId&&v.customerTaskItemId===c.id));
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
    const pending=CustomerTasks.taskCustomers(task).filter(c=>!(c.calls||[]).length&&!c.activeCallId&&c.followup!=='已完成').length;
    const enabled=task.status==='执行中'&&!task.stopNewDialing&&!task.resourcePause&&pending>0;
    const action=result=>ui.escape('ScenarioDemo.runNext('+JSON.stringify(task.taskId)+','+JSON.stringify(result)+')');
    return '<div class="customer-demo-bar"><div><strong>本地结果模拟 · '+ui.escape(task.callType)+' · 剩余 '+pending+' 位</strong><small>显式点击仅处理下一位客户；不拨号、不自动重呼、不生成录音或业务回流，不代表阿里POC通过。</small></div><button class="btn" '+(!enabled?'disabled':'')+' onclick="'+action('接通')+'">模拟下一位接通</button><button class="btn" '+(!enabled?'disabled':'')+' onclick="'+action('未接通')+'">模拟下一位未接通</button></div>';
  }
  function runNext(taskId,result='接通'){
    if(localTask(d.tasks.find(t=>t.taskId===taskId)))return runLocalNext(taskId,result);
    if(!allowed()||!saved.enabled||!['接通','未接通'].includes(result))return false;
    const t=d.tasks.find(x=>x.taskId===taskId);if(!f.tasks.some(x=>x.taskId===taskId)||t?.status!=='执行中')return false;
    const error=CloudResourceRules.validatePlan(t.executionConfig,true);if(error){showToast(error,'warning');return false;}
    const customer=CustomerTasks.taskCustomers(t).find(c=>!c.calls.some(call=>saved.calls.some(s=>s.callId===call.callId&&s.taskId===taskId)));
    if(!customer)return false;
    const agent=t.callType==='预外呼'&&result==='接通'?seat():null;if(t.callType==='预外呼'&&result==='接通'&&!agent){showToast('没有空闲演示坐席，请先完成当前通话','warning');return false;}
    const call=record(t,customer,result,agent),old=structuredClone(saved);
    // Write the result journal first. If batch write fails, roll the journal back.
    try{saved.calls.push(call);save();if(!CustomerTasks.acceptTaskDemoResult(t,call)){saved=old;save();return false;}}
    catch(_){saved=old;showToast('结果保存失败，请重试','error');return false;}
    add(d.calls,'callId',call);const calls=saved.calls.filter(c=>c.taskId===taskId);t.completed=calls.length;t.connected=calls.filter(c=>c.result==='接通').length;t.updatedAt=now();
    if(t.completed>=t.total)t.status='已完成';CloudTaskWorkspace.saveDemoTask(t);CloudTaskWorkspace.openTask(taskId);showToast('已模拟1位客户结果，名单、通话记录和报表已更新','success');return true;
  }
  function inbound(result='接通'){
    if(!allowed()||!saved.enabled||!['接通','排队超时'].includes(result))return false;
    const route=d.inboundRoutes.find(r=>r.routeId===f.inboundRoute.routeId),number=d.phoneNumbers.find(n=>n.numberId===route?.numberId);
    if(route?.status!=='已发布'||!number||!CloudResourceRules.usableNumber(number,f.tenantId,'呼入')){showToast('演示呼入号码或规则不可用','warning');return false;}
    const branch=route.branches.find(b=>b.branchCode==='DTMF-1');
    if(branch?.tenantId!==f.tenantId||branch.physicalGroupId!=='DEMO-CUSTOMER-PHY'||!d.contactFlows.some(flow=>flow.contactFlowId===route.contactFlowId&&flow.instanceId===f.instanceId&&flow.status==='已发布')){showToast('演示导航已变更，请核对按1分支与发布流程','warning');return false;}
    const agent=result==='接通'?seat():null;if(result==='接通'&&!agent){showToast('没有空闲演示坐席','warning');return false;}
    const call=record(null,{name:'演示来电客户',phone:'13800000209'},result,agent);call.routeEvidence='模拟来电 → 按1客户邀约 → 东风日产总部 → '+(agent?'坐席接听':'排队超时');
    try{saved.calls.push(call);save();}catch(_){saved.calls.pop();showToast('记录保存失败','error');return false;}add(d.calls,'callId',call);navigateTo('cloud-call-records',{type:'呼入'});return true;
  }
  function panel(task){if(localTask(task))return localPanel(task);if(!allowed()||!saved.enabled||!f.tasks.some(x=>x.taskId===task.taskId))return '';
    return '<div class="customer-demo-bar"><div><strong>本地任务演示 · '+task.completed+'/'+task.total+'</strong><small>先启动任务，再逐位模拟结果；暂停后停止。不会拨号，本轮不模拟自动重呼。</small></div><button class="btn" '+(task.status!=='执行中'?'disabled':'')+' onclick="ScenarioDemo.runNext(\''+task.taskId+'\',\'接通\')">模拟一位接通</button><button class="btn" '+(task.status!=='执行中'?'disabled':'')+' onclick="ScenarioDemo.runNext(\''+task.taskId+'\',\'未接通\')">模拟一位未接通</button></div>';
  }
  function open(){if(!allowed())return;ui.openLayer('scenario-demo','<div class="layer-header"><h2>模块联动演示</h2><button onclick="PlatformUI.closeLayer(\'scenario-demo\')">×</button></div><div class="layer-body"><p>仅本地演示，不调用阿里云或业务系统。已有进度不会重置。</p>'+f.tasks.map(t=>'<p><button class="btn" onclick="PlatformUI.closeLayer(\'scenario-demo\');CloudTaskWorkspace.openTask(\''+t.taskId+'\')">'+ui.escape(t.name)+'</button> 启动 → 模拟结果 → 查通话和客户批次</p>').join('')+'<p><button class="btn" onclick="PlatformUI.closeLayer(\'scenario-demo\');CustomerTasks.open(\'DEMO-LINK-BATCH\')">查看自动外呼客户批次</button></p><p><button class="btn" onclick="PlatformUI.closeLayer(\'scenario-demo\');ScenarioDemo.inbound(\'接通\')">模拟来电接听</button> <button class="btn" onclick="PlatformUI.closeLayer(\'scenario-demo\');ScenarioDemo.inbound(\'排队超时\')">模拟来电超时</button></p><p>人工外呼：在“导入与分配”切换运营，联系已分配客户并填写结果。通话记录和统计报表读取同一结果。</p></div>','large');}
  window.ScenarioDemo={prepare,open,runNext,inbound,panel,saveTask};
  if(saved.enabled)resources();
  restoreLocalResults();
})();
