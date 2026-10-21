/** Tenant-owned import batches. Local prototype only; no provider dispatch. */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape,key='customer-task-batches-v1';
  let batchBytes=null,batchReadError='',projectionReadIssue='';
  let batches=[],preview=null,selectedBatch='',keyword='',status='',assignmentView='all',businessFilter='',importRevision=0;
  const methods=['人工外呼','预外呼','IVR 外呼'];
  const sorted=(list,fallback)=>ui.sortByUpdated?.(list,fallback)||list;
  function latestTime(values){return values.reduce((latest,value)=>{const time=ui.timestamp?ui.timestamp(value):typeof value==='number'?(Math.abs(value)<1e11?value*1000:value):Date.parse(value||'');return Number.isFinite(time)&&time>latest?time:latest;},0)||null;}
  function rowUpdatedTime(row){return latestTime([ui.updatedTimestamp?.(row),row.updatedAt,row.updateTime,row.modifiedAt,...(row.history||[]).map(event=>event.at),...(row.calls||[]).flatMap(call=>[ui.updatedTimestamp?.(call),call.updatedAt,call.at,call.endedAt]),row.createdAt])||latestTime([row.batchUpdatedAt,row.batchCreatedAt]);}
  function sortRowsForDisplay(list){return sorted(list.map(row=>({...row,localUpdatedAt:rowUpdatedTime(row)})));}
  function batchUpdatedTime(batch){return latestTime([batch.updatedAt,batch.createdAt,...(batch.rows||[]).map(rowUpdatedTime)]);}
  let assignment=null,importTaskContext=null;
  function taskOptions(method,b){return CloudCallData.tasks.filter(t=>t.tenantId===b.tenantId&&t.enterpriseId===b.enterpriseId&&t.callType===method&&['待分配客户','待启动'].includes(t.status)&&!Number(t.completed)&&guardLegacyTask(t,b,false));}
  const now=()=>new Date().toLocaleString('sv-SE'),id=()=>crypto.randomUUID();
  const ctx=()=>AppState.get(),manager=()=>AppState.effectiveAccess().valid&&['ADMIN','SUPER_ADMIN'].includes(AppState.effectiveAccess().roleCode);
  const valid=()=>AppState.isReady()&&AppState.effectiveAccess().valid&&ctx().activeDomain==='CLOUD_CONTACT_CENTER';
  function canImportCustomers(){return valid()&&AppState.canAction('customer.import');}
  // Resolve row/transaction targets against the task catalog; a forged copy cannot remove the managed marker.
  function guardLegacyTask(taskOrId,where={},notify=true){
    const identity=typeof taskOrId==='string'?{...where,taskId:taskOrId}:taskOrId;
    if(identity?.dccManaged===true){if(notify)showToast('本版任务已锁定导入来源，请使用任务的线索导入入口；旧名单与再次联系不能写入。','warning');return false;}
    if(!identity?.taskId)return true;
    let stored=[];try{stored=window.CloudTaskWorkspace?.storedTasks?.()||[];}catch(_){}
    const candidates=[identity,...[CloudCallData.tasks,CloudCallData.predictiveTasks,CloudCallData.ivrTasks,stored].flatMap(list=>list||[]).filter(task=>task.taskId===identity.taskId)];
    for(const task of candidates){
      const result=window.DccRuntime?.guardLegacyWrite?.(task);
      if(task.dccManaged===true||result?.ok===false){if(notify)showToast(result?.reason||'本版任务已锁定导入来源，请使用任务的线索导入入口；旧名单与再次联系不能写入。','warning');return false;}
    }
    return true;
  }
  function guardLegacyBatch(batch,notify=true){return guardLegacyTask(batch,batch,notify)&&(!batch?.rows||Array.isArray(batch.rows))&&(batch?.rows||[]).every(row=>guardLegacyTask({...row,tenantId:batch.tenantId,enterpriseId:batch.enterpriseId},batch,notify));}
  function load(){try{const raw=localStorage.getItem(key),v=JSON.parse(raw||'[]');if(!Array.isArray(v)||v.some(b=>!b||typeof b.id!=='string'||!Array.isArray(b.rows)||b.rows.some(r=>!r||typeof r.id!=='string'||!Array.isArray(r.calls))))throw Error('Invalid customer journal');batches=v;batchBytes=raw;batchReadError='';return true;}catch(_){batchReadError='客户名单暂时无法读取，原始资料已保留，请核对浏览器存储后重试';return false;}}
  function commit(){try{if(batchReadError||localStorage.getItem(key)!==batchBytes)throw Error('Customer journal changed');const raw=JSON.stringify(batches);localStorage.setItem(key,raw);batchBytes=raw;return true;}catch(_){load();showToast('客户名单未保存：存储不可用或记录已更新，请保留当前内容后重试','error');return false;}}
  const owned = r => r.ownerId === ctx().accountId || r.followupAssignment?.ownerId === ctx().accountId;
  function visible(){if(!load()||!valid())return [];const scoped=AppState.scoped(batches);return manager()?scoped:scoped.filter(b=>b.rows.some(owned));}
  function rows(b){return manager()?b.rows:b.rows.filter(r=>owned(r)||b.readOnly===true&&r.visibleToAccountId===ctx().accountId);}
  function projectedBatches(){
    projectionReadIssue='';if(!valid())return [];
    try{
      const result=window.DccRuntime?.listUnifiedImportBatches?.();
      if(!result?.ok||!Array.isArray(result.data?.batches))throw Error('Unreadable predictive batches');
      const list=result.data.batches;
      if(result.data.incomplete||result.data.invalidTaskIds?.length||list.some(b=>b?.readOnly!==true||!Array.isArray(b.rows)))projectionReadIssue='部分预外呼批次暂不可读取，请核对后重试。';
      return AppState.scoped(list.filter(b=>b?.readOnly===true&&Array.isArray(b.rows))).map(b=>({...b,rows:rows(b)})).filter(b=>manager()||b.rows.length);
    }catch(_){projectionReadIssue='部分预外呼批次暂不可读取，请核对后重试。';return [];}
  }
  function projectionNotice(){return projectionReadIssue?ui.alert('warning','批次待核',esc(projectionReadIssue)):'';}
  function unifiedBatches(){return [...visible(),...projectedBatches()];}
  function displayBatch(batchId){return unifiedBatches().find(b=>b.id===batchId);}
  const actionArg=value=>esc(JSON.stringify(String(value||'')));
  function externalView(r){if(!r?.apiOrigin||r.apiOrigin.callMode==='predictive')return null;try{const view=window.DccRuntime?.externalRecordView?.(r.apiOrigin);return view?.ok&&view.data?view.data:{unavailable:true,callStatus:'通话状态待核'};}catch(_){return {unavailable:true,callStatus:'通话状态待核'};}}
  function importSource(b){if(b.sourceApplicationName)return b.sourceApplicationName;if(b.sourceApplicationId){const apps=window.DccRuntime?.listApplications?.();const app=apps?.ok&&Array.isArray(apps.data)&&apps.data.find(a=>a.applicationId===b.sourceApplicationId);return app?.name||b.sourceApplicationId;}return b.source==='api'?'接口导入':'手工导入';}
  function batchMethod(b){const methods=[...new Set(rows(b).map(r=>r.method||'尚未选择'))];return b.callMode==='predictive'?'预外呼':b.callMode==='manual'?'人工外呼':methods.length===1?methods[0]:'多种方式';}
  function assignmentTargetLabel(r){return r.wizardImportReservation?(r.wizardImportReservation.taskName||r.wizardImportReservation.taskId):r.taskId?(r.taskName||r.taskId):(CloudCallData.accounts.find(a=>a.accountId===r.ownerId)?.name||r.agentWorkNo||'未分配云呼叫');}
  function assignmentLabel(r){return assigned(r)?'已分配云呼叫':'未分配云呼叫';}
  function openBatchCustomer(batchId,itemId){const b=displayBatch(batchId),r=b&&rows(b).find(r=>r.id===itemId);if(r)window.CustomerDirectory?.open(r.phone,b.tenantId,b.enterpriseId);}
  function openBatchTask(batchId){const b=displayBatch(batchId);if(b?.readOnly&&b.taskId)window.CloudTaskWorkspace?.openTask(b.taskId,'imports');}

  function importTenant(){
    const source=importTaskContext||ctx();
    if(importTaskContext&&(source.accountId!==ctx().accountId||source.scopeTenantId!==ctx().tenantId||source.enterpriseId!==ctx().enterpriseId))return null;
    return AppState.scoped(CloudCallData.tenants).find(t=>t.tenantId===source.tenantId&&t.enterpriseId===source.enterpriseId&&!t.builtIn&&t.tenantId!=='ALL_IN_INSTANCE')||null;
  }
  function importBusiness(type){const tenant=importTenant(),meta=tenant&&CustomerBusiness.get(type,tenant);return meta&&meta.enabled!==false?meta:null;}
  function businessChoices(){
    const choices=new Map();
    AppState.scoped(CloudCallData.tenants).filter(t=>t.enterpriseId===ctx().enterpriseId&&!t.builtIn).forEach(tenant=>(CustomerBusiness.list?.(tenant,true)||[]).forEach(meta=>{
      if(!choices.has(meta.id))choices.set(meta.id,{id:meta.id,labels:[]});
      const row=choices.get(meta.id);if(!row.labels.includes(meta.label))row.labels.push(meta.label);
    }));
    return [...choices.values()].map(row=>[row.id,row.labels.join(' / ')]);
  }
  function find(batchId){return visible().find(b=>b.id===batchId);}
  function row(itemId){for(const b of visible()){const r=rows(b).find(r=>r.id===itemId);if(r)return {b,r};}return window.DccRuntime?.workbenchRow?.(itemId)||null;}
  function reportSnapshot(){
    if(!load()||!valid())return [];
    const personalCalls=manager()?[]:(window.CustomerDirectory?.list()||[]).flatMap(customer=>customer.calls||[]);
    return AppState.scoped(batches).map(b=>({...b,rows:manager()?b.rows:b.rows.filter(r=>r.ownerId===ctx().accountId||r.repeatContact&&b.createdBy===ctx().accountId||personalCalls.some(call=>call.tenantId===b.tenantId&&String(call.enterpriseId)===String(b.enterpriseId)&&call.customerTaskItemId===r.id&&call.taskId===r.taskId))})).filter(b=>b.rows.length).map(b=>structuredClone(b));
  }
  function candidates(tenantId){
    if(!valid()||!manager()||!AppState.scoped(CloudCallData.tenants).some(t=>t.tenantId===tenantId))return [];
    return CloudCallData.agents.filter(s=>s.tenantId===tenantId&&s.enterpriseId===ctx().enterpriseId&&s.lifecycleStatus!=='已删除').map(s=>{
      const a=CloudCallData.accounts.find(a=>a.accountId===s.accountId),m=CloudCallData.memberships.find(m=>m.accountId===s.accountId&&m.tenantId===tenantId);
      const reason=!a?'尚未关联中台账号':a.status!=='启用'?'关联账号已停用':!m||m.status!=='启用'?'账号未在本租户启用':!['ADMIN','OPERATOR'].includes(m.roleCode)?'关联账号不是租户管理员或租户运营':s.lifecycleStatus!=='已启用'?'坐席未启用':s.syncStatus!=='同步成功'?'坐席尚未同步成功':!s.acceptNewTasks?'坐席已停止接收新任务':'';
      const skills=CloudCallData.agentSkills.filter(r=>r.identityId===s.contactCenterIdentityId&&r.status==='已生效'&&r.syncStatus==='同步成功').map(r=>CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===r.physicalGroupId&&g.tenantId===tenantId&&g.enterpriseId===s.enterpriseId&&g.status==='已启用')?.name).filter(Boolean);
      return {seat:s,account:a,roleCode:m?.roleCode,reason,skills};
    });
  }
  function owners(tenantId){return [...new Map(candidates(tenantId).filter(c=>!c.reason).map(c=>[c.account.accountId,c.account])).values()];}
  function assigned(r){return !!(r.ownerId||r.taskId||r.wizardImportReservation);}
  function pendingForTask(tenantId,enterpriseId){return !valid()||!manager()?[]:visible().filter(b=>b.tenantId===tenantId&&b.enterpriseId===enterpriseId).flatMap(b=>b.rows.filter(r=>!r.apiOrigin&&!assigned(r)&&!r.activeCallId&&outcome(r)!=='跟进已完成').map(r=>({...r,wizardSourceSnapshot:structuredClone(r),batchId:b.id,batchName:b.name,batchCreatedAt:b.createdAt,batchUpdatedAt:b.updatedAt,tenantId:b.tenantId,enterpriseId:b.enterpriseId})));}
  // A restored wizard selection creates new manual ledger rows. The old row keeps
  // its fields/history and receives only an explicit origin reservation.
  function wizardReservationAccess(task) {
    return valid()&&manager()&&AppState.canAction('task.create')&&task?.callType==='预外呼'&&task.dccManaged===true&&task.dccSourceLocked===true&&task.dccImportSource==='manual'&&task.simulation===true&&task.localPrototypeTask===true&&!!task.taskId&&task.enterpriseId===ctx().enterpriseId&&AppState.authorizeObject('task.create',task);
  }
  function readWizardBatches() {const raw=localStorage.getItem(key),current=JSON.parse(raw||'[]');if(!Array.isArray(current)||current.some(b=>!b||!Array.isArray(b.rows)))throw Error('原客户名单暂时无法读取');return {raw,current};}
  function prepareWizardImportReservation(task,picks,transactionId) {
    if(!wizardReservationAccess(task)||!Array.isArray(picks)||!picks.length||(typeof transactionId!=='string'||!transactionId.trim()))return {ok:false,message:'当前身份不能选择该任务的原客户名单'};
    const changes=[],seen=new Set();
    try{const {current}=readWizardBatches();for(const pick of picks){
      const batch=current.find(b=>b.id===pick.batchId&&b.tenantId===task.tenantId&&b.enterpriseId===task.enterpriseId),matches=batch?.rows.filter(r=>r.id===pick.id)||[],source=matches[0],identity=pick.batchId+'|'+pick.id;
      if(matches.length!==1||seen.has(identity)||!AppState.authorizeObject('task.create',batch)||!source||source.apiOrigin||assigned(source)||source.activeCallId||outcome(source)==='跟进已完成'||JSON.stringify(source)!==JSON.stringify(pick.sourceSnapshot))return {ok:false,message:'所选名单已更新或被分配，请重新选择'};
      seen.add(identity);const after={...structuredClone(source),wizardImportReservation:{transactionId,taskId:task.taskId,tenantId:task.tenantId,enterpriseId:task.enterpriseId,taskName:task.name||'',state:'imported'}};
      changes.push({batchId:batch.id,rowId:source.id,before:structuredClone(source),after});
    }return {ok:true,kind:'wizard-manual-import',transactionId,taskId:task.taskId,tenantId:task.tenantId,enterpriseId:task.enterpriseId,accountId:ctx().accountId,scopeTenantId:ctx().tenantId,task:structuredClone(task),changes};}catch(_){return {ok:false,message:'原名单存储不可用，请保留所选内容后重试'};}
  }
  function applyWizardImportReservation(prepared,undo=false) {
    if(!prepared?.ok||prepared.kind!=='wizard-manual-import'||!Array.isArray(prepared.changes)||typeof prepared.transactionId!=='string'||!prepared.transactionId||!wizardReservationAccess(prepared.task)||prepared.taskId!==prepared.task.taskId||prepared.tenantId!==prepared.task.tenantId||prepared.enterpriseId!==prepared.task.enterpriseId||prepared.accountId!==ctx().accountId||prepared.scopeTenantId!==ctx().tenantId)return false;
    for(const change of prepared.changes){const expected={...change.before,wizardImportReservation:{transactionId:prepared.transactionId,taskId:prepared.taskId,tenantId:prepared.tenantId,enterpriseId:prepared.enterpriseId,taskName:prepared.task.name||'',state:'imported'}};if(change.before?.id!==change.rowId||JSON.stringify(change.after)!==JSON.stringify(expected))return false;}
    if(!undo){const currentTask=CloudCallData.tasks.find(t=>t.taskId===prepared.taskId);if(!wizardReservationAccess(currentTask)||currentTask.tenantId!==prepared.tenantId||currentTask.enterpriseId!==prepared.enterpriseId||currentTask.status==='已删除')return false;}
    try{const {raw,current}=readWizardBatches(),next=structuredClone(current),seen=new Set();for(const change of prepared.changes){
      const batch=next.find(b=>b.id===change.batchId&&b.tenantId===prepared.tenantId&&b.enterpriseId===prepared.enterpriseId),indices=(batch?.rows||[]).map((r,i)=>r.id===change.rowId?i:-1).filter(i=>i>=0),identity=change.batchId+'|'+change.rowId;
      if(indices.length!==1||seen.has(identity)||!AppState.authorizeObject('task.create',batch))return false;seen.add(identity);
      const index=indices[0],currentRow=batch.rows[index],reservation=currentRow.wizardImportReservation;
      if(undo){if(!reservation)continue;if(reservation.transactionId!==prepared.transactionId||reservation.taskId!==prepared.taskId)return false;const restored={...currentRow};delete restored.wizardImportReservation;batch.rows[index]=restored;}
      else{if(JSON.stringify(currentRow)===JSON.stringify(change.after))continue;if(JSON.stringify(currentRow)!==JSON.stringify(change.before)||assigned(currentRow)||currentRow.activeCallId||outcome(currentRow)==='跟进已完成')return false;batch.rows[index]=structuredClone(change.after);}
    }
    if(localStorage.getItem(key)!==raw)return false;
    const serialized=JSON.stringify(next);localStorage.setItem(key,serialized);if(localStorage.getItem(key)!==serialized){load();return false;}batches=next;return true;
    }catch(_){load();return false;}
  }
  function commitWizardImportReservation(prepared){return applyWizardImportReservation(prepared,false);}
  function rollbackWizardImportReservation(prepared){return applyWizardImportReservation(prepared,true);}
  function releaseUnstartedTask(task){
    if(!guardLegacyTask(task))return false;
    if(task?.repeatContact)return window.RepeatPredictive?.releaseTask(task)===true;
    if(!valid()||!manager())return false;const scoped=visible().filter(b=>b.tenantId===task.tenantId&&b.enterpriseId===task.enterpriseId),linked=scoped.flatMap(b=>b.rows.filter(r=>r.taskId===task.taskId));
    if(linked.some(r=>r.activeCallId||r.calls?.length||outcome(r)==='跟进已完成'))return false;
    linked.forEach(r=>{(r.history||(r.history=[])).push({at:now(),action:'删除未启动任务，返回待分配',previousTask:task.taskId});r.taskId='';r.taskName='';r.ownerId='';r.method='';r.updatedAt=now();});return commit();
  }
  function validateTaskSelection(task,ids){if(!guardLegacyTask(task,task,false))return false;const pool=pendingForTask(task.tenantId,task.enterpriseId);return Array.isArray(ids)&&new Set(ids).size===ids.length&&ids.every(id=>pool.some(r=>r.id===id));}
  function attachToNewTask(task,ids){
    if(!guardLegacyTask(task))return false;
    if(!valid()||!manager()||!['预外呼','IVR 外呼'].includes(task.callType)||task.status!=='待分配客户'||Number(task.completed)||!validateTaskSelection(task,ids))return false;
    if(!ids.length)return true;
    for(const b of batches.filter(b=>b.tenantId===task.tenantId&&b.enterpriseId===task.enterpriseId))for(const r of b.rows.filter(r=>ids.includes(r.id))){r.method=task.callType;r.taskId=task.taskId;r.taskName=task.name;r.ownerId='';r.history=r.history||[];r.history.push({at:now(),action:'创建任务时分配',method:task.callType,targetId:task.taskId});r.updatedAt=now();}
    return commit();
  }
  // Serializable row snapshots let the task wizard compensate a partial local save.
  function prepareTaskAttachment(task,ids){
    if(!guardLegacyTask(task))return {ok:false,message:'本版任务不能使用旧名单分配入口'};
    if(!valid()||!manager()||!['预外呼','IVR 外呼'].includes(task.callType)||task.status!=='待分配客户'||Number(task.completed)||!validateTaskSelection(task,ids))return {ok:false};
    const changes=[];
    for(const b of batches.filter(b=>b.tenantId===task.tenantId&&b.enterpriseId===task.enterpriseId))for(const r of b.rows.filter(r=>ids.includes(r.id))){
      const before=structuredClone(r),after={...structuredClone(r),method:task.callType,taskId:task.taskId,taskName:task.name,ownerId:'',updatedAt:now()};
      after.history=[...(after.history||[]),{at:now(),action:'创建任务时分配',method:task.callType,targetId:task.taskId}];
      changes.push({batchId:b.id,batchName:b.name,rowId:r.id,before,after});
    }
    return {ok:true,taskId:task.taskId,tenantId:task.tenantId,enterpriseId:task.enterpriseId,changes};
  }
  function applyTaskAttachment(prepared,undo=false){
    if(Array.isArray(prepared?.changes)&&prepared.changes.some(change=>change?.before?.apiOrigin||change?.after?.apiOrigin))return false;
    if(!guardLegacyTask(prepared)||(Array.isArray(prepared?.changes)&&!prepared.changes.every(change=>[change?.before,change?.after].every(row=>guardLegacyTask(row?{...row,tenantId:prepared.tenantId,enterpriseId:prepared.enterpriseId}:null)))))return false;
    if(prepared?.kind==='repeat-predictive')return undo?window.RepeatPredictive?.rollbackAttachment(prepared)===true:window.RepeatPredictive?.commitAttachment(prepared)===true;
    if(!prepared?.ok||!Array.isArray(prepared.changes)||!valid()||!manager()||!AppState.authorizeObject('',prepared))return false;
    load();const next=structuredClone(batches),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    for(const change of prepared.changes){
      const batch=next.find(b=>b.id===change.batchId&&b.tenantId===prepared.tenantId&&b.enterpriseId===prepared.enterpriseId),index=batch?.rows.findIndex(r=>r.id===change.rowId);
      if(!batch||index<0)return false;
      const current=batch.rows[index],desired=undo?change.before:change.after,expected=undo?change.after:change.before;if(current.apiOrigin||desired?.apiOrigin||expected?.apiOrigin)return false;
      if(!guardLegacyTask({...current,tenantId:batch.tenantId,enterpriseId:batch.enterpriseId}))return false;
      if(equal(current,desired))continue;
      if(!equal(current,expected))return false;
      batch.rows[index]=structuredClone(desired);
    }
    try{localStorage.setItem(key,JSON.stringify(next));batches=next;return true;}catch(_){return false;}
  }
  function commitTaskAttachment(prepared){return applyTaskAttachment(prepared);}
  function rollbackTaskAttachment(prepared){return applyTaskAttachment(prepared,true);}
  function reassignable(r,b){return b?.readOnly!==true&&r?.ledgerRecord!==true&&!r.wizardImportReservation&&guardLegacyTask(r.taskId,b,false)&&!r.activeCallId&&!externalView(r)?.inProgress&&!externalView(r)?.unavailable&&outcome(r)!=='跟进已完成'&&(!r.taskId||taskOptions(r.method,b).some(t=>t.taskId===r.taskId));}
  function setAssignmentView(view){if(!['pending','assigned','all'].includes(view))return;assignmentView=view;navigateTo('customer-tasks',{batchId:selectedBatch});}
  function updateSelection(){
    const all=Array.from(document.querySelectorAll('[name="customer-row"]')).filter(e=>!e.disabled),chosen=all.filter(e=>e.checked);
    const control=document.getElementById('customer-select-all');if(control){control.checked=!!all.length&&chosen.length===all.length;control.indeterminate=chosen.length>0&&chosen.length<all.length;control.disabled=!all.length;}
    const count=document.getElementById('customer-selected-count');if(count)count.textContent='已选择 '+chosen.length+' 位';
    const clear=document.getElementById('customer-clear-selection');if(clear)clear.disabled=!chosen.length;
  }
  function selectAll(checked){if(!valid()||!manager()||!find(selectedBatch))return;document.querySelectorAll('[name="customer-row"]').forEach(e=>{if(!e.disabled)e.checked=!!checked;});updateSelection();}
  function outcome(r){if(r.localFollowupExternalVersionUnknown===true)return '跟进状态待核对';const ext=externalView(r);if(ext?.unavailable)return '跟进状态待核对';const localVersion=Number.isInteger(r.localFollowupExternalVersion)&&r.localFollowupExternalVersion>=0?r.localFollowupExternalVersion:null;const value=ext&&Number(ext.businessVersion)>0&&(localVersion===null||Number(ext.businessVersion)>localVersion)?ext.followup:(r.followup||(r.apiOrigin?'跟进状态未同步':'待联系'));return value==='已完成'?'跟进已完成':value;}
  function callResult(r){const ext=externalView(r),calls=[...(r.calls||[]),...(ext?.calls||[])].sort((a,b)=>latestTime([a.endedAt,a.at,a.updatedAt])-latestTime([b.endedAt,b.at,b.updatedAt]));const call=calls.at(-1);if(call){if(call.external===true||r.ledgerRecord===true&&Object.hasOwn(call,'customerAnswered'))return call.customerAnswered===true?'已接通':call.customerAnswered===false?'未接通':'结果未知';const view=window.CallState?.view?.(call);return view?.answered===true?'已接通':view?.answered===false?'未接通':view?.answerLabel||'结果未知';}return ext?.callStatus||(r.apiOrigin?'尚未同步通话':'未呼叫');}
  function summary(rs){return '客户 '+rs.length+' · 已分配云呼叫 '+rs.filter(assigned).length+' · 待联系 '+rs.filter(r=>outcome(r)==='待联系').length+' · 继续跟进 '+rs.filter(r=>outcome(r)==='待继续跟进').length+' · 跟进完成 '+rs.filter(r=>outcome(r)==='跟进已完成').length+' · 未同步 '+rs.filter(r=>outcome(r)==='跟进状态未同步').length;}

  function parse(text){
    text=String(text||'').replace(/^\uFEFF/,'');const separator=text.split('\n')[0].includes('\t')?'\t':',';
    const result=[];let cells=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===separator||c==='\n')){cells.push(cell);cell='';if(c==='\n'){if(cells.some(Boolean))result.push(cells);cells=[];}}else if(c!=='\r')cell+=c;}
    if(quoted)throw Error('引号未闭合，请检查文件格式');cells.push(cell);if(cells.some(value=>value.trim()))result.push(cells);return result;
  }
  function canImportToTask(task){
    return canImportCustomers()&&!!task&&guardLegacyTask(task,task,false)&&task.callType==='预外呼'&&!task.isWizardDraft&&!task.displayOnly&&task.customerSourceMode==='assigned'&&['待分配客户','待启动'].includes(task.status)&&!Number(task.completed)&&!task.startedAt&&!task.campaignId&&!task.alictiTaskControlPending&&!task.alictiTaskUpdatePending&&Number(task.providerStatusCode)!==3&&window.HistorySnapshot?.read_only!==true&&AppState.authorizeObject('task.create',task);
  }
  function importDialog(taskId){
    if(!canImportCustomers())return showToast('仅租户管理员可导入客户','warning');
    const task=taskId?CloudCallData.tasks.find(t=>t.taskId===taskId):null;
    if(taskId&&!guardLegacyTask(task||taskId))return false;
    if(taskId&&!canImportToTask(task))return showToast('当前任务不可导入客户，请刷新任务状态','warning');
    importTaskContext=task?{taskId:task.taskId,tenantId:task.tenantId,enterpriseId:task.enterpriseId,accountId:ctx().accountId,scopeTenantId:ctx().tenantId}:null;
    const tenant=importTenant();if(!tenant)return showToast('请进入实际业务租户后导入','warning');
    preview=null;importRevision++;
    ui.openLayer('customer-import',`<div class="layer-header"><h2>导入客户名单</h2><button aria-label="关闭" onclick="PlatformUI.closeLayer('customer-import')">×</button></div>
      <div class="layer-body customer-import-body">
        <div class="customer-import-steps"><strong>1 填写名单</strong><span>→</span><span>2 检查数据</span><span>→</span><span>${task?'3 导入并加入当前任务':'3 导入后分配'}</span></div>
        ${task?`<p class="customer-import-hint">${esc(task.callType)} · 导入至任务：${esc(task.name)}</p>`:''}
        <div class="customer-import-basics"><label class="field"><span>业务类型 <em>*</em></span><select id="customer-import-business-type" onchange="CustomerTasks.importTypeChanged()"><option value="">请选择业务类型</option>${(CustomerBusiness.list(tenant)||[]).filter(meta=>meta.enabled!==false).map(meta=>'<option value="'+esc(meta.id)+'">'+esc(meta.label)+'</option>').join('')}</select></label>
        <label class="field customer-import-name"><span>批次名称 <em>*</em></span><input id="customer-batch-name" maxlength="50" placeholder="例如：9月试驾邀约" oninput="CustomerTasks.invalidatePreview()"></label></div>
        <section class="customer-import-section"><div class="customer-import-heading"><h3>准备客户名单</h3><button class="btn" onclick="CustomerTasks.fillSample()">填入示例</button></div>
          <div class="customer-import-upload"><label for="customer-import-file" class="btn">选择 CSV 文件</label><input id="customer-import-file" type="file" hidden accept=".csv,text/csv" onchange="CustomerTasks.readFile(this.files[0])"><span id="customer-import-filename">未选择文件 · UTF-8 格式，最大 1 MB</span></div>
          <div id="customer-import-schema">${importSchema('')}</div>
          <label class="field"><span>粘贴或编辑名单 ${ui.help('按上方必填项顺序填写；备注为空也要保留第三列，末尾新增字段选填。业务编码在 Excel 中设为文本，保留前导零。可带表头，每批最多 2000 位客户，同批重复号码保留第一条有效记录。')}</span><textarea id="customer-import-text" rows="6" oninput="CustomerTasks.invalidatePreview()" placeholder="请选择业务类型后填写名单"></textarea></label>
        </section><div id="customer-import-preview" aria-live="polite"></div>
      </div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('customer-import')">取消</button><button class="btn" onclick="CustomerTasks.previewImport()">检查名单</button><button class="btn btn-primary" id="customer-import-confirm" disabled onclick="CustomerTasks.confirmImport()">确认导入</button></div>`,'large');
  }
  const importedFields = () => CustomerBusiness.importedFields || [];
  function importSchema(type){const meta=importBusiness(type);return '<table class="customer-import-guide"><thead><tr><th>客户称呼 <em>*</em></th><th>客户号码 <em>*</em></th><th>联系备注（选填）</th><th>'+(meta?esc(meta.codeLabel)+' <em>*</em>':'业务编码 <em>*</em>')+'</th>'+importedFields().map(field=>'<th>'+esc(field.label)+'（选填）</th>').join('')+'</tr></thead><tbody><tr><td>最多40字</td><td>手机号或带区号的固定电话</td><td>本次沟通要点，最多500字</td><td>'+(meta?esc(meta.codeLabel)+'必填，文本格式，最多100字':'选择类型后显示对应字段')+'</td>'+importedFields().map(()=>'<td>按文本保留原值</td>').join('')+'</tr></tbody></table>';}
  function importTypeChanged(){invalidatePreview();const type=document.getElementById('customer-import-business-type')?.value||'',meta=importBusiness(type),schema=document.getElementById('customer-import-schema'),input=document.getElementById('customer-import-text');if(schema)schema.innerHTML=importSchema(type);if(input)input.placeholder=meta?'客户称呼,客户号码,联系备注,'+meta.codeLabel+','+importedFields().map(field=>field.label).join(','):'请选择业务类型后填写名单';}
  function invalidatePreview(){preview=null;importRevision++;const box=document.getElementById('customer-import-preview'),button=document.getElementById('customer-import-confirm');if(box)box.innerHTML='';if(button)button.disabled=true;}
  function fillSample(){
    if(!canImportCustomers())return;const input=document.getElementById('customer-import-text');if(!input)return;
    if(input.value.trim())return showToast('请先清空名单，再填入示例，以免覆盖已填写内容','warning');
    const type=document.getElementById('customer-import-business-type')?.value,meta=importBusiness(type);if(!meta)return showToast('请先选择已启用的业务类型','warning');
    const sample=window.CustomerImportSamples?.[type]||{name:meta.label+'示例名单',rows:[1,2,3].map((n)=>({name:'示例客户'+n,phone:'1380000000'+n,note:n===1?'预约联系':'',externalDocumentId:(meta.prefix||type)+'-00'+n}))};
    const csv=value=>{const text=String(value??'');return /[,"\r\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;};
    input.value=['客户称呼','客户号码','联系备注',meta.codeLabel,...importedFields().map(field=>field.label)].map(csv).join(',')+'\n'+sample.rows.map(r=>[r.name,r.phone,r.note,r.externalDocumentId,...importedFields().map(field=>r[field.key]||'')].map(csv).join(',')).join('\n');
    const name=document.getElementById('customer-batch-name');if(name&&!name.value.trim())name.value=sample.name;invalidatePreview();showToast('已填入 '+sample.rows.length+' 位示例客户','success');
  }
  async function readFile(file){if(!file||!canImportCustomers())return;const scope=[ctx().tenantId,ctx().enterpriseId,ctx().accountId].join('|'),revision=++importRevision,el=document.getElementById('customer-import-text');if(file.size>1024*1024)return showToast('文件不能超过1MB','error');if(!/\.csv$/i.test(file.name))return showToast('请将Excel另存为CSV后导入','error');try{const text=await file.text();if(scope!==[ctx().tenantId,ctx().enterpriseId,ctx().accountId].join('|')||!canImportCustomers()||revision!==importRevision||el!==document.getElementById('customer-import-text'))return;if(el)el.value=text;const label=document.getElementById('customer-import-filename');if(label)label.textContent=file.name;invalidatePreview();}catch(_){showToast('文件读取失败，请重新选择','error');}}
  function prepare(name,text,businessType=''){
    if(!guardLegacyTask(importTaskContext))throw Error('本版任务不能使用旧四列名单导入');
    if(!canImportCustomers())throw Error('仅租户管理员可导入客户');const tenant=importTenant();if(!tenant)throw Error('请进入实际业务租户后导入');
    const meta=importBusiness(businessType);if(!meta)throw Error('请选择已启用的业务类型');
    if(!name.trim()||name.trim().length>50)throw Error('请填写50字以内的批次名称');const list=parse(text);if(!list.length||list.length>2001)throw Error('每次导入1至2000位客户');
    let optionalColumns=importedFields();
    if(['客户称呼','客户姓名','姓名'].includes(list[0][0].trim())){
      const header=list.shift().map(value=>value.trim());
      if(meta&&header[3]&&![meta.codeLabel,'外部单据标识'].includes(header[3]))throw Error('当前为'+meta.label+'，第四列表头应为“'+meta.codeLabel+'”，请检查名单或业务类型');
      optionalColumns=header.slice(4).map(label=>importedFields().find(field=>field.label===label||field.key===label));
      if(optionalColumns.some(field=>!field)||new Set(optionalColumns.map(field=>field.key)).size!==optionalColumns.length)throw Error('选填字段表头无法识别或重复，请按字段说明填写');
    }
    if(!list.length||list.length>2000)throw Error('每次导入1至2000位客户');const seen=new Set(),good=[],errors=[];
    list.forEach((raw,i)=>{const c=raw.map((value,index)=>index<4?value.trim():value),phone=(c[1]||'').replace(/[\s-]/g,'');let e='';if(!c[0]||c[0].length>40)e='称呼必填且不超过40字';else if(!/^(1[3-9]\d{9}|0\d{9,11})$/.test(phone))e='客户号码格式不正确';else if(c.length>4+optionalColumns.length)e='名单列数与表头不一致，请检查字段说明';else if(String(c[2]||'').length>500)e='备注不超过500字';else if(meta&&!c[3])e=meta.codeLabel+'必填';else if(meta&&c[3].length>100)e=meta.codeLabel+'不超过100字';else if(seen.has(phone))e='同批号码重复';if(e)errors.push({line:i+1,phone,reason:e});else{seen.add(phone);good.push({name:c[0],phone,note:c[2]||'',externalDocumentId:c[3]||'',businessType:meta?businessType:'',...Object.fromEntries(optionalColumns.filter((field,index)=>raw.length>index+4).map((field,index)=>[field.key,c[index+4]]))});}});
    return {name:name.trim(),text,businessType:meta?businessType:'',tenantId:tenant.tenantId,enterpriseId:tenant.enterpriseId,accountId:ctx().accountId,codeLabel:meta.codeLabel,good,errors};
  }
  function previewImport(){invalidatePreview();if(!canImportCustomers())return showToast('仅租户管理员可导入客户','warning');try{const type=document.getElementById('customer-import-business-type')?.value;if(!importBusiness(type))throw Error('请先选择已启用的业务类型');preview=prepare(document.getElementById('customer-batch-name').value,document.getElementById('customer-import-text').value,type);document.getElementById('customer-import-preview').innerHTML='<p>'+esc(CustomerBusiness.typeLabel(preview))+' · 可导入 '+preview.good.length+' 位，未通过 '+preview.errors.length+' 行。确认后仅导入有效行。</p>'+(preview.good.length?'<h3>有效名单预览（最多展示前10位）</h3>'+ui.table([{key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'note',label:'联系备注'},{key:'externalDocumentId',label:CustomerBusiness.codeLabel(preview),render:v=>esc(v||'—')},...importedFields().map(field=>({key:field.key,label:field.label,render:v=>esc(v||'未提供')}))],preview.good.slice(0,10)):'')+(preview.errors.length?ui.table([{key:'line',label:'行'},{key:'phone',label:'号码'},{key:'reason',label:'未通过原因'}],preview.errors.slice(0,30)):'');document.getElementById('customer-import-confirm').disabled=!preview.good.length;}catch(e){preview=null;showToast(e.message,'error');}}
  function confirmImport(){
    if(!canImportCustomers())return showToast('仅租户管理员可导入客户','warning');
    if(!preview||preview.tenantId!==(importTaskContext?.tenantId||ctx().tenantId)||preview.enterpriseId!==ctx().enterpriseId||preview.accountId!==ctx().accountId)return showToast('工作范围已改变，请重新检查名单','error');
    if(document.getElementById('customer-batch-name')?.value.trim()!==preview.name||document.getElementById('customer-import-text')?.value!==preview.text||document.getElementById('customer-import-business-type')?.value!==preview.businessType||!importBusiness(preview.businessType)||importBusiness(preview.businessType).codeLabel!==preview.codeLabel)return showToast('名单或业务类型已修改，请重新检查','warning');
    const task=importTaskContext?CloudCallData.tasks.find(t=>t.taskId===importTaskContext.taskId):null;
    if(!guardLegacyTask(task||importTaskContext))return false;
    if(importTaskContext&&(!canImportToTask(task)||task.tenantId!==importTaskContext.tenantId||task.enterpriseId!==importTaskContext.enterpriseId||ctx().accountId!==importTaskContext.accountId||ctx().tenantId!==importTaskContext.scopeTenantId))return showToast('任务状态或工作范围已改变，请重新打开导入','warning');
    load();const b={id:id(),name:preview.name,businessType:preview.businessType,tenantId:preview.tenantId,enterpriseId:preview.enterpriseId,createdAt:now(),createdBy:ctx().accountId,errors:preview.errors,rows:preview.good.map(c=>({...c,id:id(),ownerId:'',method:'',followup:'待联系',calls:[],history:[]}))};if(task)b.rows.forEach(r=>{r.method=task.callType;r.taskId=task.taskId;r.taskName=task.name;r.history.push({at:now(),action:'从任务导入并分配',method:task.callType,targetId:task.taskId});});
    if(task){const saved=window.CloudTaskWorkspace.commitDirectImport(task,b);if(!saved.ok)return showToast(saved.message,'error');}
    else if(!commitImportBatch(b))return showToast('导入未保存，填写内容已保留，请检查存储后重试','error');
    window.CustomerDirectory?.sync();preview=null;importTaskContext=null;ui.closeLayer('customer-import');
    if(task){window.CloudTaskWorkspace.openTask(task.taskId,'customers');showToast('已导入 '+b.rows.length+' 位客户并加入当前任务，任务待启动','success');}
    else {open(b.id);showToast('已导入 '+b.rows.length+' 位客户','success');}
  }
  // Import transactions change only their own batch, never a cached full list.
  function commitImportBatch(batch) {
    if(!guardLegacyBatch(batch))return false;
    if(!canImportCustomers()||!batch?.id||batch.tenantId!==ctx().tenantId||batch.enterpriseId!==ctx().enterpriseId||!AppState.authorizeObject('customer.import',batch))return false;
    try {
      const raw=localStorage.getItem(key),current=JSON.parse(raw||'[]');if(!Array.isArray(current))return false;
      const existing=current.find(row=>row.id===batch.id);
      if(existing)return JSON.stringify(existing)===JSON.stringify(batch);
      if(localStorage.getItem(key)!==raw)return false;
      const next=[structuredClone(batch),...current];localStorage.setItem(key,JSON.stringify(next));batches=next;return true;
    }catch(_){return false;}
  }
  // API manual imports use the existing customer journal; no predictive task or provider batch is created.
  function apiImportIdentity(identity, input) {
    const resolved=window.DccRuntime?.resolveTenantIdentity?.(identity);
    return resolved?.ok && resolved.data.sourceApplicationId===input.sourceApplicationId && resolved.data.tenantId===input.tenantId &&
      CloudCallData.tenants.some(t=>t.tenantId===input.tenantId&&t.enterpriseId===input.enterpriseId&&t.status==='启用'&&!t.builtIn) ? resolved.data : null;
  }
  function apiSeat(row, input) {
    const matches=CloudCallData.agents.filter(a=>a.enterpriseId===input.enterpriseId&&a.tenantId===input.tenantId&&a.cno===row.agentWorkNo&&a.lifecycleStatus!=='已删除');
    const a=matches[0],account=a&&CloudCallData.accounts.find(v=>v.accountId===a.accountId);
    return matches.length===1&&a.contactCenterIdentityId===row.assignedAgentIdentityId&&a.accountId===row.ownerId&&a.lifecycleStatus==='已启用'&&a.syncStatus==='同步成功'&&a.callEnabled!==false&&a.acceptNewTasks!==false&&account?.status==='启用'&&CloudCallData.memberships.some(m=>m.accountId===a.accountId&&m.tenantId===input.tenantId&&m.status==='启用'&&['ADMIN','OPERATOR'].includes(m.roleCode)) ? a : null;
  }
  function validApiAssignment(row,input){
    if(row.agentWorkNo===undefined||row.agentWorkNo===null||row.agentWorkNo==='')return !row.ownerId&&!row.assignedAgentIdentityId;
    return typeof row.agentWorkNo==='string'&&!!row.agentWorkNo.trim()&&!!apiSeat(row,input);
  }
  function prepareApiImportBatch(input) {
    const bad=reason=>({ok:false,reason});
    if(!apiImportIdentity(input?.identity,input||{})||!Array.isArray(input.rows)||!input.rows.length||typeof input.requestId!=='string'||!input.requestId||typeof input.businessBatchNo!=='string'||!input.businessBatchNo)return bad('接口身份或导入记录不完整，未保存客户分配');
    const ids=new Set(),sourceApplicationId=input.sourceApplicationId;
    for(const r of input.rows){
      if(!r||typeof r.recordId!=='string'||!r.recordId||ids.has(r.recordId)||typeof r.rowId!=='string'||!r.rowId||!validApiAssignment(r,input)||r.businessType!==input.businessType)return bad('导入行或指定坐席已变化，未保存客户分配');
      ids.add(r.recordId);
    }
    const createdAt=new Date().toISOString(),batchId='API-MANUAL-'+encodeURIComponent(JSON.stringify([sourceApplicationId,input.tenantId,input.requestId]));
    const batch={id:batchId,name:input.businessBatchNo,businessBatchNo:input.businessBatchNo,businessType:input.businessType,businessTypeLabel:input.businessTypeLabel||'',tenantId:input.tenantId,enterpriseId:input.enterpriseId,createdAt,createdBy:sourceApplicationId,sourceApplicationId,sourceApplicationName:input.sourceApplicationName||'',requestId:input.requestId,source:'api',callMode:'manual',simulation:true,errors:[],rows:input.rows.map(r=>{
      const apiOrigin={schemaVersion:'1.1.0',sourceApplicationId,tenantId:input.tenantId,enterpriseId:input.enterpriseId,requestId:input.requestId,rowId:r.rowId,recordId:r.recordId,businessBatchNo:input.businessBatchNo,callMode:'manual',businessType:input.businessType,businessTypeLabel:input.businessTypeLabel||'',callbackUrlSnapshot:r.apiOrigin?.callbackUrlSnapshot||input.callbackUrlSnapshot||'',leadCode:r.leadCode,phone:r.phone,agentWorkNo:r.agentWorkNo||'',ownerId:r.ownerId||'',followupState:'跟进状态未同步'};
      return {...structuredClone(r),id:r.recordId,agentWorkNo:r.agentWorkNo||'',ownerId:r.ownerId||'',assignedAgentIdentityId:r.assignedAgentIdentityId||'',apiOrigin,externalDocumentId:r.externalDocumentId||r.leadCode,name:r.name||r.leadCode,method:'人工外呼',taskId:'',taskName:'',followup:'跟进状态未同步',activeCallId:'',calls:[],history:[{at:createdAt,action:r.agentWorkNo?'接口导入并分配云呼叫坐席':'接口导入，未分配云呼叫坐席',sourceApplicationId,requestId:input.requestId}]};
    })};
    return {ok:true,kind:'api-manual-import',sourceApplicationId,tenantId:input.tenantId,enterpriseId:input.enterpriseId,requestId:input.requestId,batch};
  }
  function commitApiImportBatch(prepared, options={}) {
    const bad=reason=>({ok:false,reason});
    if(!prepared?.ok||prepared.kind!=='api-manual-import'||!apiImportIdentity(options.identity,prepared)||!prepared.batch||prepared.batch.sourceApplicationId!==prepared.sourceApplicationId||prepared.batch.requestId!==prepared.requestId||prepared.batch.tenantId!==prepared.tenantId||prepared.batch.enterpriseId!==prepared.enterpriseId||!Array.isArray(prepared.batch.rows)||!prepared.batch.rows.length)return bad('接口身份或分配事务不一致，未保存客户');
    try{
      const {raw,current}=readWizardBatches(),existing=current.find(b=>b.id===prepared.batch.id);
      if(existing){
        const fields=['recordId','rowId','leadCode','phone','priority','businessType','businessTypeLabel','externalDocumentId',...(CustomerBusiness.importedFields||[]).map(field=>field.key)];
        const sourceMatches=['id','tenantId','enterpriseId','sourceApplicationId','requestId','businessBatchNo','businessType'].every(field=>existing[field]===prepared.batch[field]);
        const originals=prepared.batch.rows;
        const same=sourceMatches&&existing.rows.length===originals.length&&originals.every(original=>{const matches=existing.rows.filter(row=>row.id===original.id),row=matches[0];return matches.length===1&&JSON.stringify(row.apiOrigin)===JSON.stringify(original.apiOrigin)&&fields.every(field=>JSON.stringify(row[field])===JSON.stringify(original[field]));});
        return same?{ok:true,batchId:existing.id,recordIds:originals.map(r=>r.id),replayed:true}:bad('原导入身份或来源字段已变化，保留原客户及分配');
      }
      if(prepared.batch.rows.some(r=>!validApiAssignment(r,prepared)||r.followup!=='跟进状态未同步'||r.apiOrigin?.followupState!=='跟进状态未同步'||r.id!==r.recordId||r.apiOrigin?.recordId!==r.id||r.apiOrigin?.sourceApplicationId!==prepared.sourceApplicationId||r.apiOrigin?.tenantId!==prepared.tenantId||r.apiOrigin?.requestId!==prepared.requestId))return bad('指定坐席或原导入身份已变化，未保存客户');
      if(localStorage.getItem(key)!==raw)return bad('名单已更新，请重试原请求');
      const next=[structuredClone(prepared.batch),...current];localStorage.setItem(key,JSON.stringify(next));batches=next;
      return {ok:true,batchId:prepared.batch.id,recordIds:prepared.batch.rows.map(r=>r.id)};
    }catch(_){return bad('客户分配尚未保存，请保留原请求核对后重试');}
  }
  function rollbackApiImportBatch(prepared,options={}) {
    if(!prepared?.ok||prepared.kind!=='api-manual-import'||!apiImportIdentity(options.identity,prepared))return false;
    try{const {raw,current}=readWizardBatches(),existing=current.find(b=>b.id===prepared.batch?.id);if(!existing)return true;
      if(JSON.stringify(existing)!==JSON.stringify(prepared.batch)||existing.rows.some(r=>r.activeCallId||r.calls.length)||localStorage.getItem(key)!==raw)return false;
      const next=current.filter(b=>b.id!==existing.id);localStorage.setItem(key,JSON.stringify(next));batches=next;return true;
    }catch(_){return false;}
  }
  function rollbackImportBatch(batch) {
    if(!guardLegacyBatch(batch))return false;
    if(!batch?.id)return false;
    try {
      const raw=localStorage.getItem(key),current=JSON.parse(raw||'[]');if(!Array.isArray(current))return false;
      const existing=current.find(row=>row.id===batch.id);if(!existing)return true;
      if(!guardLegacyBatch(existing))return false;
      if(JSON.stringify(existing)!==JSON.stringify(batch)||localStorage.getItem(key)!==raw)return false;
      const next=current.filter(row=>row.id!==batch.id);localStorage.setItem(key,JSON.stringify(next));batches=next;return true;
    }catch(_){return false;}
  }
  function missingTaskRecoverable(r,b) {
    if(!guardLegacyTask(r?.taskId,b,false))return false;
    if(!valid()||!manager()||!r?.taskId||r.activeCallId||r.calls?.length||outcome(r)==='跟进已完成')return false;
    const directoryStatus=window.CustomerDirectory?.status?.();
    if(directoryStatus?.storageIssue||directoryStatus?.conflictingCallIds?.length)return false;
    try {
      if(window.CloudTaskWorkspace?.taskStorageStatus?.())return false;
      const stored=window.CloudTaskWorkspace?.storedTasks?.()||[];
      if([...CloudCallData.tasks,...stored].some(task=>task.taskId===r.taskId&&task.tenantId===b.tenantId&&task.enterpriseId===b.enterpriseId&&task.status!=='已删除'))return false;
      return !(CloudCallData.calls||[]).some(call=>call.tenantId===b.tenantId&&call.enterpriseId===b.enterpriseId&&(call.customerTaskItemId===r.id||call.taskId===r.taskId));
    }catch(_){return false;}
  }
  function recoverMissingTask(itemId,confirmed=false) {
    window.CustomerDirectory?.sync();window.CloudTaskWorkspace?.refreshStoredTasks?.();
    const item=row(itemId);if(!item||!missingTaskRecoverable(item.r,item.b))return showToast('任务或客户状态已变化，无法恢复分配，请刷新后核对','warning');
    if(!guardLegacyTask(item.r.taskId,item.b))return false;
    if(!confirmed)return ui.confirm({id:'customer-recover-task',title:'恢复到待分配',body:'<p>当前浏览器未找到原任务“'+esc(item.r.taskName||item.r.taskId)+'”，该客户尚无通话或处理中记录。确认解除旧任务关联，将客户恢复为待分配？原任务编号会保留在分配历史中。</p>',confirmText:'恢复待分配',onConfirm(){recoverMissingTask(itemId,true);}});
    const r=item.r;r.history=r.history||[];r.history.push({at:now(),action:'原任务记录缺失，手动恢复待分配',previousTask:r.taskId,previousTaskName:r.taskName||''});
    r.taskId='';r.taskName='';r.method='';r.ownerId='';r.updatedAt=now();
    if(!commit())return false;
    ui.closeLayer('customer-recover-task');open(item.b.id);showToast('客户已恢复待分配，原任务编号保留在分配历史中','success');return true;
  }
  function assign(itemIds,method,ownerId){
    if(!valid()||!manager()||!methods.includes(method))return false;load();const b=find(selectedBatch);if(!b||b.readOnly)return false;
    if(method!=='人工外呼'&&!guardLegacyTask(ownerId,b))return false;
    const task=method!=='人工外呼'?taskOptions(method,b).find(t=>t.taskId===ownerId):null;
    if(method==='人工外呼'?!owners(b.tenantId).some(a=>a.accountId===ownerId):!task)return false;
    const chosen=b.rows.filter(r=>itemIds.includes(r.id));if(method!=='人工外呼'&&chosen.some(r=>r.apiOrigin))return false;if(!chosen.length||chosen.length!==new Set(itemIds).size||chosen.some(r=>r.activeCallId||externalView(r)?.inProgress||externalView(r)?.unavailable||outcome(r)==='跟进已完成'))return false;
    if(!chosen.every(r=>guardLegacyTask(r.taskId,b)))return false;
    if(chosen.some(r=>r.taskId&&!taskOptions(r.method,b).some(t=>t.taskId===r.taskId)))return false;
    chosen.forEach(r=>{r.history.push({at:now(),action:'分配',method,targetId:ownerId,previousOwner:r.ownerId,previousTask:r.taskId||''});r.method=method;r.ownerId=task?'':ownerId;r.taskId=task?.taskId||'';r.taskName=task?.name||'';r.updatedAt=now();});if(!commit())return false;window.CloudTaskWorkspace?.syncAssignedCustomers();return true;
  }
  function assignSelected(itemId){
    const ids=typeof itemId==='string'?[itemId]:Array.from(document.querySelectorAll('[name="customer-row"]:checked')).map(e=>e.value),b=find(selectedBatch);
    if(!manager()||!b)return;if(!ids.length)return showToast('请先勾选需要分配的客户','warning');
    if(ids.some(id=>!b.rows.some(r=>r.id===id&&reassignable(r,b)&&(!assigned(r)||typeof itemId==='string'))))return showToast('客户状态已变化，请刷新后重新选择','warning');
    const allowedMethods=b.rows.some(r=>ids.includes(r.id)&&r.apiOrigin)?['人工外呼']:methods;
    assignment={ids,batchId:b.id,tenantId:ctx().tenantId,accountId:ctx().accountId};
    ui.openLayer('customer-assign',`<div class="layer-header"><h2>分配客户</h2><button onclick="PlatformUI.closeLayer('customer-assign')">×</button></div><div class="layer-body customer-import-body"><strong>已选择 ${ids.length} 位客户</strong><label class="field"><span>外呼方式 *</span><select id="customer-method" onchange="CustomerTasks.assignmentTarget()"><option value="">请选择外呼方式</option>${allowedMethods.map(m=>'<option value="'+esc(m)+'">'+esc(ui.callTypeLabel(m))+'</option>').join('')}</select></label><div id="customer-assignment-target">选择外呼方式后，设置坐席或外呼任务。</div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('customer-assign')">取消</button><button class="btn btn-primary" onclick="CustomerTasks.confirmAssignment()">确认分配</button></div>`,'small');
  }
  function assignmentTarget(){
    const b=find(assignment?.batchId),method=document.getElementById('customer-method')?.value,box=document.getElementById('customer-assignment-target');if(!b||!box)return;
    if(!method){box.textContent='请选择外呼方式';return;}
    if(method!=='人工外呼'&&b.rows.some(r=>assignment.ids.includes(r.id)&&r.apiOrigin)){box.textContent='接口人工名单仅能分配人工坐席';return;}
    const manual=method==='人工外呼',options=manual?candidates(b.tenantId).filter(c=>!c.reason).map(c=>({id:c.account.accountId,name:c.seat.userName+' · '+(c.roleCode==='ADMIN'?'租户管理员':'租户运营')+(c.seat.userName===c.account.name?'':' · 账号：'+c.account.name)})):taskOptions(method,b).map(t=>({id:t.taskId,name:t.name}));
    box.innerHTML='<label class="field"><span>'+ (manual?'分配坐席':'外呼任务')+' *</span><select id="customer-target"><option value="">请选择'+(manual?'坐席':'任务')+'</option>'+options.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join('')+'</select></label>'+(!options.length?'<p>暂无可选'+(manual?'坐席，请先在账号管理为租户管理员或运营关联有效坐席。':'任务，请先在对应外呼页面创建并保存任务配置。')+'</p>':'')+(manual&&candidates(b.tenantId).some(c=>c.reason)?'<button class="btn-link" onclick="CustomerTasks.candidateDetails()">查看不可选坐席</button>':'');
  }
  function candidateDetails(){
    const b=find(assignment?.batchId);if(!b||!manager())return;
    ui.openLayer('customer-candidates','<div class="layer-header"><h2>坐席可分配情况</h2><button aria-label="关闭" onclick="PlatformUI.closeLayer(\'customer-candidates\')">×</button></div><div class="layer-body">'+ui.table([{key:'seat',label:'坐席',render:s=>esc(s.userName)},{key:'account',label:'关联账号',render:a=>esc(a?.name||'未关联')},{key:'skills',label:'生效技能',render:s=>esc(s.join('、')||'暂无')},{key:'reason',label:'分配状态',render:r=>r?esc(r):ui.status('可分配')}],sorted(candidates(b.tenantId),['seat.updatedAt','seat.createTime','account.updatedAt']))+'</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'customer-candidates\')">关闭</button></div>','large');
  }
  function confirmAssignment(){if(!assignment||assignment.accountId!==ctx().accountId||assignment.tenantId!==ctx().tenantId||assignment.batchId!==selectedBatch)return showToast('工作范围已变化，请重新选择客户','warning');if(!assign(assignment.ids,document.getElementById('customer-method')?.value,document.getElementById('customer-target')?.value))return showToast('请选择有效分配对象；已开始或完成的客户不能重新分配','warning');assignment=null;ui.closeLayer('customer-assign');open(selectedBatch);showToast('分配已保存','success');}
  function taskExecutionCustomers(task){
    if(!guardLegacyTask(task,task,false))return null;
    if(!valid()||!task?.taskId||!AppState.authorizeObject('task.create',task)||!CloudCallData.tasks.some(t=>t.taskId===task.taskId&&t.tenantId===task.tenantId&&t.enterpriseId===task.enterpriseId))return null;
    load();return AppState.scoped(batches).filter(b=>b.tenantId===task.tenantId&&b.enterpriseId===task.enterpriseId).flatMap(b=>b.rows.filter(r=>r.taskId===task.taskId).map(r=>({...r,batchId:b.id,batchName:b.name,batchCreatedAt:b.createdAt,batchUpdatedAt:b.updatedAt,tenantId:b.tenantId,enterpriseId:b.enterpriseId,repeatCreatedBy:b.createdBy})));
  }
  function taskCustomers(task){return (taskExecutionCustomers(task)||[]).filter(r=>manager()||r.ownerId===ctx().accountId||r.repeatContact&&r.repeatCreatedBy===ctx().accountId);}
  function open(batchId){
    const target=batchId||'', current=RouteRuntime.snapshot();
    if(current?.key==='customer-tasks'&&(current.options?.batchId||'')===target)return navigateTo('customer-tasks',{batchId:target});
    return RouteRuntime.openSecondary('customer-tasks',{batchId:target,refreshOnClose:true});
  }
  function render(options){
    if(!valid())return ui.empty('请进入云联络中心');
    if(!load())return '<section class="platform-page">'+ui.pageHeader('导入与分配')+ui.alert('warning','客户名单暂时无法读取',esc(batchReadError))+'</section>';
    if(!options?.preserveFilters||Object.hasOwn(options||{},'batchId')){const requested=options?.batchId||'';if(requested!==selectedBatch){keyword='';status='';assignmentView='all';}selectedBatch=requested;}
    const b=displayBatch(selectedBatch);if(b)return detail(b);
    const bs=sorted(unifiedBatches().filter(b=>(!keyword||(b.name+' '+(b.businessBatchNo||'')).includes(keyword))&&(!businessFilter||(b.businessType||'legacy')===businessFilter)).map(b=>({...b,localUpdatedAt:batchUpdatedTime(b)})));
    return '<section class="platform-page customer-task-page">'+ui.pageHeader('导入与分配',manager()?'统一查看客户批次、云呼叫分配和跟进进度。':'查看分配给我的客户及跟进进度。')+
      projectionNotice()+'<div class="filter-panel"><label class="field">批次<input id="customer-search" value="'+esc(keyword)+'" placeholder="批次名称或业务批次号"></label><label class="field">业务类型<select id="customer-business-filter"><option value="">全部类型</option>'+[...businessChoices(),['legacy','未分类']].map(([v,t])=>'<option value="'+esc(v)+'"'+(businessFilter===v?' selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label><button class="btn btn-primary" onclick="CustomerTasks.query()">查询</button><button class="btn" onclick="CustomerTasks.reset()">重置</button></div><article class="panel-card"><div class="panel-header"><h2>导入批次</h2>'+(canImportCustomers()?'<button class="btn btn-primary" onclick="CustomerTasks.importDialog()">导入客户</button>':'')+'</div>'+ui.table([
        {key:'name',label:'批次名称 / 业务批次号',render:(_,b)=>esc(b.name)+(b.businessBatchNo&&b.businessBatchNo!==b.name?'<small>'+esc(b.businessBatchNo)+'</small>':'')},
        {key:'source',label:'导入来源',render:(_,b)=>esc(importSource(b))+'<small>'+esc(b.sourceApplicationId||b.source==='api'?'接口导入':'手工导入')+'</small>'},
        {key:'businessType',label:'业务类型',render:(_,b)=>esc(CustomerBusiness.typeLabel(b))},
        {key:'callMode',label:'外呼方式',render:(_,b)=>esc(batchMethod(b))},
        {key:'createdAt',label:'导入时间'},
        {key:'id',label:'分配与跟进',render:(_,b)=>esc(summary(rows(b)))},
        {key:'id',label:'操作',render:(_,b)=>'<button class="btn-link" onclick="CustomerTasks.open('+actionArg(b.id)+')">查看客户</button>'}
      ],bs,{emptyText:manager()?'暂无导入批次':'暂无分配给我的客户批次'})+'</article></section>';
  }
  function detail(b){
    const rs=sortRowsForDisplay(rows(b).filter(r=>(!manager()||assignmentView==='all'||(assignmentView==='assigned'?assigned(r):!assigned(r)))&&(!keyword||(r.name+r.phone+(r.externalDocumentId||'')).includes(keyword))&&(!status||outcome(r)===status)).map(r=>({...r,batchCreatedAt:b.createdAt,batchUpdatedAt:b.updatedAt})));
    const editable=b.readOnly!==true,selection=manager()&&editable&&assignmentView!=='assigned';
    const tabs=manager()?'<div class="customer-status-tabs" role="group" aria-label="云呼叫分配状态">'+[['all','全部客户'],['pending','未分配云呼叫'],['assigned','已分配云呼叫']].map(([v,label])=>'<button class="btn '+(assignmentView===v?'btn-primary':'')+'" aria-pressed="'+(assignmentView===v)+'" onclick="CustomerTasks.setAssignmentView('+actionArg(v)+')">'+label+' · '+rows(b).filter(r=>v==='all'||(v==='assigned'?assigned(r):!assigned(r))).length+'</button>').join('')+'</div>':'';
    const note=b.readOnly?'客户已归属原预外呼任务，本页仅查看；请进入原任务管理。':'云呼叫分配与业务跟进分别记录。业务系统的跟进结果尚未同步时，不计为待联系或已完成。';
    return '<section class="platform-page customer-task-page">'+ui.pageHeader(b.name,CustomerBusiness.typeLabel(b)+' · '+importSource(b)+' · '+summary(rows(b)),(b.readOnly?'<button class="btn" onclick="CustomerTasks.openBatchTask('+actionArg(b.id)+')">查看原任务</button> ':'')+'<button class="btn" onclick="RouteRuntime.openSecondary(&quot;customer-directory&quot;)">客户档案</button> <button class="btn" onclick="RouteRuntime.back({fallback:&quot;customer-tasks&quot;})">返回</button>')+
      tabs+projectionNotice()+ui.alert('info','分配与跟进',esc(note))+
      '<div class="filter-panel"><label class="field">客户<input id="customer-search" value="'+esc(keyword)+'" placeholder="称呼、号码或线索编码"></label><label class="field">跟进状态<select id="customer-status"><option value="">全部</option>'+['待联系','待继续跟进','跟进已完成','跟进状态未同步','跟进状态待核对'].map(s=>'<option'+(s===status?' selected':'')+'>'+s+'</option>').join('')+'</select></label><button class="btn btn-primary" onclick="CustomerTasks.query()">查询</button><button class="btn" onclick="CustomerTasks.reset()">重置</button></div><article class="panel-card"><div class="panel-header"><h2>客户名单</h2></div>'+
      (selection?'<div class="customer-assignment-toolbar"><button class="btn btn-primary" onclick="CustomerTasks.assignSelected()">分配客户</button><span id="customer-selected-count" class="customer-selected-count" aria-live="polite">已选择 0 位</span><button id="customer-clear-selection" class="btn-link" disabled onclick="CustomerTasks.selectAll(false)">取消选择</button></div>':'')+ui.table([
        ...(selection?[{key:'id',label:'选择',width:'70px',headerRender:()=>'<label class="customer-select-label"><input id="customer-select-all" type="checkbox" aria-label="全选当前筛选下可分配客户" onchange="CustomerTasks.selectAll(this.checked)"'+(!rs.some(r=>!assigned(r)&&reassignable(r,b))?' disabled':'')+'> 全选</label>',render:(_,r)=>'<input type="checkbox" name="customer-row" onchange="CustomerTasks.updateSelection()" value="'+esc(r.id)+'" aria-label="选择'+esc(r.name)+'"'+(assigned(r)||!reassignable(r,b)?' disabled':'')+'>'}]:[]),
        {key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},
        {key:'externalDocumentId',label:CustomerBusiness.codeLabel(b),render:v=>esc(v||'—')},
        {key:'method',label:'外呼方式',render:(m,r)=>esc(r.wizardImportReservation?'预外呼':ui.callTypeLabel(m)||'尚未选择')},
        {key:'ownerId',label:'云呼叫分配',render:(_,r)=>ui.status(assignmentLabel(r))+(assigned(r)?'<small>'+esc(assignmentTargetLabel(r))+'</small>':'')},
        {key:'id',label:'最近通话',render:(_,r)=>{const ext=externalView(r);return esc(callResult(r))+(ext?.actualAgentWorkNo?'<small>实际坐席：'+esc(ext.actualAgentName||ext.actualAgentWorkNo)+'</small>':'');}},
        {key:'id',label:'跟进状态',render:(_,r)=>esc(outcome(r))+(r.localFollowupExternalVersionUnknown===true?'<small>业务结果顺序待核对</small><small>本平台已保存：'+esc(r.followup==='已完成'?'跟进已完成':r.followup||'待核对')+'</small>':externalView(r)?.unavailable?'<small>同步资料暂不可读取</small>':'')},
        {key:'id',label:'操作',render:(_,r)=>'<button class="btn-link" onclick="CustomerTasks.openBatchCustomer('+actionArg(b.id)+','+actionArg(r.id)+')">客户档案</button>'+
          (editable&&manager()&&assigned(r)&&reassignable(r,b)?' <button class="btn-link" onclick="CustomerTasks.assignSelected('+actionArg(r.id)+')">重新分配</button>':'')+
          (editable&&missingTaskRecoverable(r,b)?' <button class="btn-link" onclick="CustomerTasks.recoverMissingTask('+actionArg(r.id)+')">原任务缺失 · 恢复待分配</button>':'')+
          (editable&&canCall(r)?' <button class="btn-link" onclick="CustomerTasks.pick('+actionArg(r.id)+')">联系客户</button>':'')+
          (editable&&canConfirmPlatformContact(r)?' <button class="btn-link" onclick="CustomerTasks.confirmPlatformContact('+actionArg(b.id)+','+actionArg(r.id)+')">确认后联系</button>':'')}
      ],rs,{emptyText:assignmentView==='pending'?'暂无未分配云呼叫的客户，请切换全部客户查看':'暂无符合条件的客户'})+'</article>'+
      (manager()&&b.errors?.length?'<details class="technical-details"><summary>导入未通过记录 · '+b.errors.length+' 行</summary>'+ui.table([{key:'line',label:'行'},{key:'phone',label:'号码'},{key:'reason',label:'原因'}],b.errors)+'</details>':'')+externalDemo(b)+'</section>';
  }
  function externalDemo(b){
    const list=rows(b).filter(r=>r.apiOrigin&&r.apiOrigin.callMode==='manual');
    if(!manager()||b.simulation!==true||!list.length||!window.DccRuntime?.simulateExternalCall)return '';
    return '<details class="technical-details"><summary>外部拨号演示 · 仅合成数据</summary><p>演示业务系统发起电话后同步通话和业务处理结果，不会拨打真实号码。</p>'+ui.table([{key:'name',label:'客户'},{key:'phone',label:'号码'},{key:'id',label:'模拟同步',render:(_,r)=>[['answered','已接通'],['not_answered','未接通'],['continue','继续跟进'],['completed','完成跟进']].map(([scenario,label])=>'<button class="btn-link" onclick="CustomerTasks.runExternalDemo('+actionArg(b.id)+','+actionArg(r.id)+','+actionArg(scenario)+')">'+label+'</button>').join(' ')}],list)+'</details>';
  }
  async function runExternalDemo(batchId,itemId,scenario){
    const before=ctx(),scope=[before.accountId,before.tenantId,before.enterpriseId].join('|'),b=displayBatch(batchId),r=b&&rows(b).find(r=>r.id===itemId);
    if(!manager()||b?.simulation!==true||!r?.apiOrigin||!['answered','not_answered','continue','completed'].includes(scenario))return false;
    let result;try{result=await window.DccRuntime?.simulateExternalCall?.({sourceApplicationId:r.apiOrigin.sourceApplicationId,tenantId:b.tenantId,recordId:r.apiOrigin.recordId,scenario});}catch(_){result={ok:false,reason:'同步资料暂不可读取，请核对后重试'};}
    const current=ctx();if(scope!==[current.accountId,current.tenantId,current.enterpriseId].join('|'))return false;
    if(!result?.ok){showToast(result?.reason||result?.message||'模拟同步未完成，请核对原记录','warning');return false;}
    open(batchId);showToast('已更新合成演示结果','success');return true;
  }
  function canConfirmPlatformContact(r){const ext=externalView(r);return valid()&&r?.apiOrigin?.callMode==='manual'&&r.method==='人工外呼'&&r.ownerId===ctx().accountId&&outcome(r)==='跟进状态未同步'&&outcome(r)!=='跟进已完成'&&!r.activeCallId&&!ext?.inProgress&&!ext?.unavailable;}
  function confirmPlatformContact(batchId,itemId,expected){
    const b=find(batchId),r=b&&rows(b).find(r=>r.id===itemId);if(!r||!canConfirmPlatformContact(r))return showToast('联系安排已变化，请刷新后核对','warning');
    const fingerprint=JSON.stringify(r);
    if(expected===undefined)return ui.confirm({id:'customer-confirm-contact',title:'确认联系安排',body:'<p>DCC 跟进结果尚未同步，请核对后确认联系。</p><p>确认仅记录本次云呼叫联系安排，不代表 DCC 尚未联系该客户。</p>',confirmText:'确认由我联系',onConfirm(){confirmPlatformContact(batchId,itemId,fingerprint);}});
    if(expected!==fingerprint)return showToast('客户记录已更新，请重新确认联系安排','warning');
    r.followup='待联系';r.platformFollowupConfirmedAt=now();r.platformFollowupConfirmedBy=ctx().accountId;r.history=[...(r.history||[]),{at:now(),action:'已确认云呼叫联系安排',accountId:ctx().accountId}];r.updatedAt=now();
    if(!commit())return false;ui.closeLayer('customer-confirm-contact');open(batchId);showToast('已加入本人的待联系列表','success');return true;
  }
  function followupBlock(r,b) {
    if(!r.followupAssignment)return '';
    const tasks=CloudCallData.tasks.filter(t=>t.taskId===r.followupAssignment.originalTaskId&&t.tenantId===b.tenantId&&t.enterpriseId===b.enterpriseId);
    const task=tasks[0];
    if(tasks.length!==1||!task.simulation||task.alictiTaskControlPending||task.alictiTaskUpdatePending||!['已暂停','已终止','已完成'].includes(task.status))return '请先暂停原预外呼任务并确认结果，再人工联系；真实任务排他仍待验证';
    return '';
  }
  function pendingRow(r){return !r.wizardImportReservation&&valid()&&owned(r)&&['待联系','待继续跟进'].includes(outcome(r))&&!r.activeCallId&&!externalView(r)?.inProgress&&(r.method==='人工外呼'&&r.ownerId===ctx().accountId||r.followupAssignment?.ownerId===ctx().accountId);}
  function callBlockedReason(r){if(r?.ledgerRecord===true)return window.DccRuntime?.workbenchCallBlockedReason?.(r)||'';if(!r||!pendingRow(r))return '当前客户不属于本人可联系名单';const candidates=batches.filter(b=>b.tenantId===(r.tenantId||ctx().tenantId)&&b.enterpriseId===(r.enterpriseId||ctx().enterpriseId)&&b.rows.some(item=>item.id===r.id));const batch=batches.find(b=>b.rows.includes(r))||(candidates.length===1?candidates[0]:r);return externalView(r)?.inProgress?'业务系统正在通话，请稍后核对':followupBlock(r,batch);}
  function canCall(r){if(r?.ledgerRecord===true)return window.DccRuntime?.workbenchCanCall?.(r)===true;return pendingRow(r)&&!callBlockedReason(r);}
  function mine(){return visible().flatMap(b=>rows(b).filter(pendingRow).map(r=>({...r,...(r.followupAssignment?{method:'人工外呼',ownerId:r.followupAssignment.ownerId}:{}),batchId:b.id,batchName:b.name,batchCreatedAt:b.createdAt,batchUpdatedAt:b.updatedAt,tenantId:b.tenantId,enterpriseId:b.enterpriseId}))).concat(window.DccRuntime?.workbenchMine?.()||[]);}
  function pick(itemId){const item=row(itemId);if(!item||!canCall(item.r))return showToast('该客户已不可联系或不属于当前账号','warning');AgentWorkbench.selectAssigned(item.r);}
  function claim(itemId,call){const item=row(itemId);if(item?.r.ledgerRecord===true)return window.DccRuntime?.claimWorkbenchCall?.(itemId,call)===true;if(!item||!guardLegacyTask(item.r.taskId,item.b)||!canCall(item.r))return false;item.r.activeCallId=call.callId;if(!item.r.calls.some(row=>row.callId===call.callId))item.r.calls.push(callSnapshot(call));item.r.updatedAt=now();return commit();}
  // A routed predictive call identifies a task row; it does not grant ownership of its batch.
  function receivingItem(taskId,itemId,agent){
    if(window.DccRuntime?.isManagedTask?.(taskId))return window.DccRuntime?.predictiveReceivingItem?.(taskId,itemId,agent)||null;
    if(!valid()||!taskId||!itemId||!agent?.contactCenterIdentityId)return null;
    const context=ctx(),seats=CloudCallData.agents.filter(a=>a.contactCenterIdentityId===agent.contactCenterIdentityId&&a.accountId===context.accountId&&a.tenantId===context.tenantId&&a.enterpriseId===context.enterpriseId);
    if(seats.length!==1||agent.accountId!==context.accountId||agent.tenantId!==context.tenantId||agent.enterpriseId!==context.enterpriseId)return null;
    const tasks=CloudCallData.tasks.filter(t=>t.taskId===taskId&&t.callType==='预外呼'&&t.tenantId===context.tenantId&&t.enterpriseId===context.enterpriseId);
    if(tasks.length!==1)return null;
    let saved;try{saved=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(saved))return null;}catch(_){return null;}
    const matches=saved.filter(b=>b.tenantId===context.tenantId&&b.enterpriseId===context.enterpriseId).flatMap(batch=>batch.rows.filter(item=>item.id===itemId&&item.taskId===taskId&&item.method==='预外呼'&&!item.ownerId).map(item=>({task:tasks[0],batch,item})));
    if(matches.length!==1)return null;
    const match=matches[0];return structuredClone({...match,batch:{...match.batch,rows:[match.item]}});
  }
  function callSnapshot(call,remark){return {callId:call.callId,...CustomerBusiness.snapshot(call),...(window.RepeatPredictive?.callMetadata(call)||{}),result:call.result,at:call.endedAt,agentName:call.agentName,disposition:call.agentDisposition||'',remark:remark===undefined?call.dispositionRemark||'':remark,...(call.telephony?{telephony:structuredClone(call.telephony)}:{}),...(call.workbenchKind==='predictive'?{callSource:call.callSource,workbenchKind:call.workbenchKind,taskId:call.taskId,customerTaskItemId:call.customerTaskItemId,accountId:call.accountId,contactCenterIdentityId:call.contactCenterIdentityId,tenantId:call.tenantId,enterpriseId:call.enterpriseId,callee:call.callee,agentAnswerResult:call.agentAnswerResult,agentAnsweredAt:call.agentAnsweredAt}:{})};}
  function rememberExternalFollowupVersion(r){
    if(r.localFollowupExternalVersionUnknown===true)return;
    const external=externalView(r);
    if(r.apiOrigin?.callMode==='manual'&&(external?.unavailable||!Number.isSafeInteger(external?.businessVersion)||external.businessVersion<0)){
      r.localFollowupExternalVersionUnknown=true;delete r.localFollowupExternalVersion;return;
    }
    r.localFollowupExternalVersion=Number.isSafeInteger(external?.businessVersion)?external.businessVersion:0;
  }
  function savedFollowupResult(call){return call?.processingStatus==='已完成'&&(CloudCallData.nativeWorkbench?.outcomes||[]).includes(call.agentDisposition);}
  function acceptTaskDemoResult(task,call){
    if(!guardLegacyTask(task))return false;
    if(!valid()||!manager()||!call.simulation||task.status!=='执行中'||call.taskId!==task.taskId)return false;
    const item=row(call.customerTaskItemId);if(!item||item.b.tenantId!==task.tenantId||item.b.enterpriseId!==task.enterpriseId||item.r.taskId!==task.taskId||item.r.activeCallId)return false;
    if(item.r.calls.some(c=>c.callId===call.callId))return true;
    item.r.calls.push(callSnapshot(call,'本地任务演示'));
    if(savedFollowupResult(call)){item.r.followup=['需要再次联系','继续跟进'].includes(call.agentDisposition)?'待继续跟进':'已完成';item.r.platformFollowupSavedAt=call.dispositionAt||new Date().toISOString();rememberExternalFollowupVersion(item.r);}item.r.updatedAt=now();return commit();
  }
  function syncCall(call){
    if(call?.apiOrigin?.callMode==='predictive'||window.DccRuntime?.isManagedTask?.(call?.taskId)||window.DccRuntime?.workbenchRow?.(call?.customerTaskItemId)?.r.ledgerRecord===true)return window.DccRuntime?.syncWorkbenchCall?.(call)===true;
    if(!guardLegacyTask(call))return false;
    if(!call.customerTaskItemId)return call.workbenchKind!=='predictive';if(!load())return false;
    const b=batches.find(b=>b.tenantId===call.tenantId&&b.enterpriseId===call.enterpriseId&&b.rows.some(r=>r.id===call.customerTaskItemId)),r=b?.rows.find(r=>r.id===call.customerTaskItemId);
    if(r&&!guardLegacyTask(r.taskId,b))return false;
    if(!r)return false;const beforeRow=JSON.stringify(r),i=r.calls.findIndex(c=>c.callId===call.callId),active=r.activeCallId===call.callId;
    if((active||i<0)&&call.processingStatus==='已完成'&&!savedFollowupResult(call))return false;
    let receiving=false;
    if(call.workbenchKind==='predictive'){
      const agent=CloudCallData.agents.find(a=>a.contactCenterIdentityId===call.contactCenterIdentityId&&a.tenantId===call.tenantId&&a.enterpriseId===call.enterpriseId),linked=receivingItem(call.taskId,call.customerTaskItemId,agent);
      if(!linked||linked.batch.id!==b.id||!call.callId||call.callSource!=='NATIVE_WORKBENCH'||call.simulation!==true||call.callType!=='预外呼'||call.direction!=='呼出'||call.accountId!==ctx().accountId||call.tenantId!==ctx().tenantId||call.enterpriseId!==ctx().enterpriseId||call.callee!==linked.item.phone||(call.agentIdentityId&&call.agentIdentityId!==agent.contactCenterIdentityId))return false;
      if(Object.entries(CustomerBusiness.snapshot({...linked.item,tenantId:linked.batch.tenantId,enterpriseId:linked.batch.enterpriseId})).some(([field,value])=>CustomerBusiness.snapshot(call)[field]!==value))return false;
      if(i>=0&&['callSource','workbenchKind','taskId','customerTaskItemId','accountId','contactCenterIdentityId','tenantId','enterpriseId','callee'].some(field=>r.calls[i][field]!==call[field]))return false;
      if(i<0&&(r.activeCallId||outcome(r)==='跟进已完成'))return false;
      receiving=true;
    }
    if(!active&&i<0&&!receiving)return false;
    const snapshot=callSnapshot(call);if(i<0)r.calls.push(snapshot);else r.calls[i]=snapshot;
    if(receiving&&i<0&&call.processingStatus!=='已完成')r.activeCallId=call.callId;
    // Late telephony calibration updates this call's snapshot, never a newer call or saved business follow-up.
    if((active||receiving&&i<0)&&call.processingStatus==='已完成'){
      const continueFollowup=['需要再次联系','继续跟进'].includes(call.agentDisposition);
      r.followup=continueFollowup?'待继续跟进':'已完成';r.platformFollowupSavedAt=call.dispositionAt||new Date().toISOString();rememberExternalFollowupVersion(r);
      if(receiving&&continueFollowup)r.followupAssignment={ownerId:call.accountId,seatIdentityId:call.contactCenterIdentityId,originalTaskId:call.taskId,originCallId:call.callId,assignedAt:call.dispositionAt||now()};
      r.activeCallId='';
    }
    if(JSON.stringify(r)!==beforeRow)r.updatedAt=now();return commit();
  }
  function history(itemId){const item=row(itemId);if(!item)return;window.CustomerDirectory?.open(item.r.phone,item.b.tenantId,item.b.enterpriseId);}
  function sidebar(selectedId){const list=sortRowsForDisplay(mine());return '<aside class="seat-sidebar"><article class="panel-card"><div class="panel-header"><h2>分配给我的客户 · '+list.length+'</h2><button class="btn-link" onclick="CustomerTasks.open()">导入与分配</button></div><div class="seat-recent">'+(list.map(r=>'<button class="seat-recent-row" onclick="CustomerTasks.pick(\''+r.id+'\')"><span><strong>'+esc(r.name)+(r.id===selectedId?' · 已选择':'')+'</strong><small>'+esc(r.phone)+'</small><small>'+esc(r.batchName)+'</small></span><span>'+esc(r.followup)+'</span></button>').join('')||'<div class="seat-empty-recent">暂无其他待联系客户</div>')+'</div></article></aside>';}
  window.CustomerTasks={canImportCustomers,canImportToTask,render,open,owners,prepare,importDialog,readFile,previewImport,confirmImport,assign,assignSelected,canCall,mine,pick,row,claim,syncCall,history,sidebar,query(){businessFilter=document.getElementById('customer-business-filter')?.value||'';keyword=document.getElementById('customer-search')?.value.trim()||'';status=document.getElementById('customer-status')?.value||'';navigateTo('customer-tasks',{batchId:selectedBatch});},reset(){keyword='';status='';businessFilter='';navigateTo('customer-tasks',{batchId:selectedBatch});}};
  Object.assign(window.CustomerTasks,{selectAll,updateSelection,releaseUnstartedTask,pendingForTask,validateTaskSelection,attachToNewTask,candidateDetails,setAssignmentView,candidates,fillSample,invalidatePreview,importTypeChanged,assignmentTarget,confirmAssignment,taskOptions,taskCustomers,acceptTaskDemoResult});
  Object.assign(window.CustomerTasks,{openBatchCustomer,openBatchTask,runExternalDemo,confirmPlatformContact,unifiedBatches,outcome,callResult,reportSnapshot,receivingItem,taskExecutionCustomers,rowUpdatedTime,sortRowsForDisplay,callBlockedReason,prepareApiImportBatch,commitApiImportBatch,rollbackApiImportBatch});
  Object.assign(window.CustomerTasks,{prepareWizardImportReservation,commitWizardImportReservation,rollbackWizardImportReservation,prepareTaskAttachment,commitTaskAttachment,rollbackTaskAttachment,commitImportBatch,rollbackImportBatch,missingTaskRecoverable,recoverMissingTask});
  Pages['customer-tasks']={render,
    captureNavigationState(){return {selectedBatch,keyword,status,assignmentView,businessFilter,assignment};},
    restoreNavigationState(state){if(state)({selectedBatch,keyword,status,assignmentView,businessFilter,assignment}=state);}
  };
})();
