/** Actual prototype handlers in a VM; not browser, real calls or CCC POC evidence. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {setup,root}=require('./fixtures/prototype-vm.cjs');
const journalKey='local-task-result-journal-v1';
const load=(x,file)=>vm.runInContext(fs.readFileSync(root+'/js/pages/'+file+'.js','utf8'),x.ctx,{filename:file});
function resource(x){
  if(!x.d.phoneNumbers.some(n=>n.numberId==='QA-LOCAL-NUM'))x.d.phoneNumbers.push({...structuredClone(x.d.phoneNumbers.find(n=>n.numberId==='NUM-400-8801')),numberId:'QA-LOCAL-NUM',number:'02100007777'});
}
function create(x,type,name,count=2){
  resource(x);
  const c=x.ctx.CustomerTasks,w=x.ctx.CloudTaskWorkspace;
  const group=x.ctx.AppState.get().tenantId==='TEN-NISSAN-SH'?'SG-ALI-SH-SALES':'SG-ALI-HQ-AFTER';
  x.field('customer-batch-name',name+'客户批次');
  x.field('customer-import-text',Array.from({length:count},(_,i)=>'普通客户'+(i+1)+',1380000077'+i+',本地VM测试').join('\n'));
  x.field('customer-import-preview','');x.field('customer-import-confirm','');
  c.previewImport();c.confirmImport();
  const b=JSON.parse(x.local.get('customer-task-batches-v1')).find(b=>b.name===name+'客户批次');assert(b,'Actual import should create the batch');
  w.start(type);w.update('name',name);w.update('scheduleMode','保存后手工启动');
  w.setResource('callerNumberId','QA-LOCAL-NUM');w.setResource('skillGroupId',group);
  w.setResource('executionQueueId',group);if(type==='IVR 外呼')w.setResource('transferEnabled',false);
  w.setResource('contactFlowId',type==='预外呼'?'FLOW-PRED-HQ-V1':'FLOW-MAINTAIN-OUT-V4');
  for(const row of b.rows)w.toggleCustomer(row.id,true);
  w.submit();const task=x.d.tasks.find(t=>t.name===name);
  assert(task,JSON.stringify(x.messages));assert(w.isLocalSimulationTask(task));assert.equal(task.total,count);assert.equal(task.status,'待启动');
  assert(!task.taskId.startsWith('DEMO-LINK'));return task;
}
const x=setup('admin');
const oldTasks=structuredClone(x.d.tasks),oldCalls=structuredClone(x.d.calls);
const ids=[];
for(const type of ['预外呼','IVR 外呼']){
  const task=create(x,type,'普通新建'+type),w=x.ctx.CloudTaskWorkspace,a=x.ctx.ScenarioDemo,c=x.ctx.CustomerTasks;ids.push(task.taskId);
  assert(a.panel(task).includes('模拟下一位接通'));
  assert(!a.runNext(task.taskId));w.controlTask(task.taskId,'start');assert.equal(task.status,'执行中',JSON.stringify(x.messages));
  assert(a.runNext(task.taskId,'接通'),JSON.stringify(x.messages));assert.equal(task.completed,1);assert.equal(task.connected,1);
  const first=x.d.calls.find(c=>c.taskId===task.taskId);assert.equal(first.caller,'02100007777');assert.equal(first.callerNumberId,'QA-LOCAL-NUM');assert.equal(first.contactFlowId,task.contactFlowId);
  assert.equal(first.callSource,'LOCAL_TASK_SIMULATION');assert.equal(first.attemptNumber,1);assert.equal(first.hasNextAttempt,false);assert.equal(first.callbackStatus,'无需回流');assert(!first.recordingUrl);assert(!first.businessSystemId);
  assert.equal(first.durationSeconds,type==='IVR 外呼'?18:62);
  assert.equal(Date.parse(first.endedAt)-Date.parse(first.answeredAt),first.durationSeconds*1000);
  assert.equal(Date.parse(first.answeredAt)-Date.parse(first.ringingAt),3000);
  if(type==='IVR 外呼')assert.equal(first.ivrEvidence.dialAt,first.ringingAt);
  if(type==='预外呼')assert.equal(first.skillGroupId,'SG-ALI-HQ-AFTER');else assert.equal(first.recordingApplicability,'NOT_APPLICABLE_PURE_IVR');
  w.controlTask(task.taskId,'pause',true);assert.equal(task.status,'已暂停');assert(!a.runNext(task.taskId));assert.equal(task.completed,1);
  w.controlTask(task.taskId,'resume');assert.equal(task.status,'执行中');assert(a.runNext(task.taskId,'未接通'));assert.equal(task.status,'已完成');assert(task.stopNewDialing);
  assert(!a.runNext(task.taskId));assert(!a.runNext(task.taskId));assert.equal(task.completed,2);assert.equal(task.connected,1);
  const calls=x.d.calls.filter(c=>c.taskId===task.taskId);assert.equal(calls.length,2);assert.equal(new Set(calls.map(c=>c.customerTaskItemId)).size,2);
  const missed=calls.find(c=>c.result==='未接通');assert.equal(missed.answeredAt,'—');assert.equal(missed.durationSeconds,0);
  assert.equal(Date.parse(missed.endedAt)-Date.parse(missed.ringingAt),3000);
  assert(c.taskCustomers(task).every(c=>c.calls.length===1));assert(c.taskCustomers(task).some(c=>c.followup==='待继续跟进'));
  assert(x.ctx.WorkbenchOverview.model().calls.some(c=>c.callId===first.callId));
}
const terminated=create(x,'预外呼','部分结果后终止',3);x.ctx.CloudTaskWorkspace.controlTask(terminated.taskId,'start');assert(x.ctx.ScenarioDemo.runNext(terminated.taskId));
x.ctx.CloudTaskWorkspace.controlTask(terminated.taskId,'terminate',true);assert(!x.ctx.ScenarioDemo.runNext(terminated.taskId));assert.equal(terminated.completed,1);assert.equal(x.ctx.CustomerTasks.taskCustomers(terminated).length,3);
const quick=create(x,'IVR 外呼','连续点击不重呼',3);x.ctx.CloudTaskWorkspace.controlTask(quick.taskId,'start');
assert(x.ctx.ScenarioDemo.runNext(quick.taskId));assert(x.ctx.ScenarioDemo.runNext(quick.taskId));assert.equal(quick.completed,2);assert.equal(new Set(x.d.calls.filter(c=>c.taskId===quick.taskId).map(c=>c.customerTaskItemId)).size,2);
// Old tasks are not silently enrolled even if they already have a local campaign ID.
const old=x.d.tasks.find(t=>!t.localPrototypeTask);assert(!x.ctx.ScenarioDemo.runNext(old.taskId));
for(const t of oldTasks)assert.equal(JSON.stringify(x.d.tasks.find(c=>c.taskId===t.taskId)),JSON.stringify(t));
for(const c of oldCalls){
  const current=x.d.calls.find(r=>r.callId===c.callId);
  // Directory reconciliation may append provenance, normalized phone fields and
  // batch-history details; no pre-existing call fact may be overwritten.
  for(const key of Object.keys(c))assert.equal(JSON.stringify(current[key]),JSON.stringify(c[key]),c.callId+'.'+key);
}
// Simulated reload uses the same browser tab session plus local storage, then
// re-evaluates the production scripts; it does not claim browser coverage.
const re=setup('admin');for(const [k,v]of x.local)re.local.set(k,v);for(const [k,v]of x.session)re.session.set(k,v);resource(re);
load(re,'cloud-task-workspace');load(re,'scenario-demo');
for(const id of ids){const task=re.d.tasks.find(t=>t.taskId===id);assert.equal(task.status,'已完成');assert.equal(task.completed,2);assert.equal(re.d.calls.filter(c=>c.taskId===id).length,2);assert(re.ctx.CustomerTasks.taskCustomers(task).every(c=>c.calls.length===1));assert(!re.ctx.ScenarioDemo.runNext(id));}
assert.equal(re.d.tasks.find(t=>t.taskId===terminated.taskId).status,'已终止');assert(!re.ctx.ScenarioDemo.runNext(terminated.taskId));
assert.equal(re.d.tasks.find(t=>t.taskId===quick.taskId).completed,2);assert(re.ctx.ScenarioDemo.runNext(quick.taskId));assert.equal(re.d.tasks.find(t=>t.taskId===quick.taskId).status,'已完成');
assert(re.ctx.Pages['report-center'].render({view:'outbound'}).includes('普通新建'));assert(re.ctx.WorkbenchOverview.model().calls.some(c=>ids.includes(c.taskId)));
// Rebuild the derived index before the scenario journal is restored. Batch
// snapshots intentionally omit taskId/duration and must be safely upgraded.
const directoryKey='customer-directory-v1';
function missingIndex(){
  const restored=setup('admin');for(const [k,v]of x.local)if(k!==directoryKey)restored.local.set(k,v);
  restored.local.delete(directoryKey);for(const [k,v]of x.session)restored.session.set(k,v);resource(restored);
  return restored;
}
const expectedCalls=JSON.parse(x.local.get(journalKey)).calls.filter(call=>ids.includes(call.taskId));
for(const failIndex of [false,true]){
  const restored=missingIndex(),saveIndex=restored.ctx.localStorage.setItem;
  if(failIndex)restored.ctx.localStorage.setItem=(key,value)=>{if(key===directoryKey)throw Error('derived index quota');return saveIndex(key,value);};
  restored.ctx.CustomerDirectory.sync();
  for(const call of expectedCalls){const placeholder=restored.d.calls.find(row=>row.callId===call.callId);assert(placeholder.directoryMeta.legacyOnly);assert.equal(placeholder.durationSeconds,null);assert(!placeholder.taskId);}
  load(restored,'cloud-task-workspace');load(restored,'scenario-demo');
  for(const call of expectedCalls){
    const full=restored.d.calls.find(row=>row.callId===call.callId);assert.equal(full.directoryMeta.legacyOnly,false);
    assert.equal(full.taskId,call.taskId);assert.equal(full.durationSeconds,call.durationSeconds);assert.equal(full.callSource,'LOCAL_TASK_SIMULATION');
    assert.equal(full.answeredAt,call.answeredAt);assert.equal(full.endedAt,call.endedAt);assert.equal(restored.d.calls.filter(row=>row.callId===call.callId).length,1);
    assert(restored.ctx.CustomerDirectory.list().some(customer=>customer.calls.some(row=>row.callId===call.callId&&row.durationSeconds===call.durationSeconds)));
  }
  assert.equal(restored.local.get(journalKey),x.local.get(journalKey));assert.equal(restored.local.get('customer-task-batches-v1'),x.local.get('customer-task-batches-v1'));
  restored.ctx.localStorage.setItem=saveIndex;restored.ctx.CustomerDirectory.sync();
  const persisted=JSON.parse(restored.local.get(directoryKey));
  for(const call of expectedCalls)assert.equal(persisted.calls.find(row=>row.callId===call.callId).durationSeconds,call.durationSeconds);
}
// A journal-only write never becomes a successful result without its batch
// commit, even when its task/customer IDs look valid.
const uncommitted=missingIndex(),pendingCall={...structuredClone(expectedCalls[0]),callId:'QA-UNCOMMITTED-LOCAL-RESULT'};
const pendingJournal=JSON.parse(uncommitted.local.get(journalKey));pendingJournal.calls.push(pendingCall);uncommitted.local.set(journalKey,JSON.stringify(pendingJournal));
uncommitted.ctx.CustomerDirectory.sync();load(uncommitted,'cloud-task-workspace');load(uncommitted,'scenario-demo');
assert(!uncommitted.d.calls.some(call=>call.callId===pendingCall.callId));
assert.equal(uncommitted.d.tasks.find(task=>task.taskId===pendingCall.taskId).completed,2);
assert(JSON.parse(uncommitted.local.get(journalKey)).calls.some(call=>call.callId===pendingCall.callId),'Uncommitted source must be preserved, not erased');
// Ambiguous IDs remain separate source evidence; recovery cannot overwrite a
// foreign tenant/instance or a conflicting customer/caller phone.
for(const conflict of [{tenantId:'TEN-NISSAN-SH'},{instanceId:'CCC-EPI'},{callee:'13900000999',customerPhone:'13900000999'},{caller:'02100008888'}]){
  const restored=missingIndex();restored.ctx.CustomerDirectory.sync();
  const placeholder=restored.d.calls.find(call=>call.callId===expectedCalls[0].callId);Object.assign(placeholder,conflict);
  restored.local.set(directoryKey,JSON.stringify({version:1,calls:restored.d.calls,unmerged:[]}));
  load(restored,'cloud-task-workspace');load(restored,'scenario-demo');
  const kept=restored.d.calls.find(call=>call.callId===placeholder.callId);
  for(const [key,value]of Object.entries(conflict))assert.equal(kept[key],value);
  assert.equal(kept.directoryMeta.legacyOnly,true);assert.equal(kept.durationSeconds,null);assert(!kept.taskId);assert(!kept.callSource);
}
// A committed ID also cannot be used to recover a journal with another phone.
const mismatched=missingIndex(),badJournal=JSON.parse(mismatched.local.get(journalKey));badJournal.calls.find(call=>call.callId===expectedCalls[0].callId).callee='13900000123';
mismatched.local.set(journalKey,JSON.stringify(badJournal));mismatched.ctx.CustomerDirectory.sync();load(mismatched,'cloud-task-workspace');load(mismatched,'scenario-demo');
const notUpgraded=mismatched.d.calls.find(call=>call.callId===expectedCalls[0].callId);assert(notUpgraded.directoryMeta.legacyOnly);assert.equal(notUpgraded.durationSeconds,null);assert(!notUpgraded.taskId);
// Operator and another-instance contexts cannot use these explicit admin tools.
for(const [profile,instance]of [['operator','CCC-NISSAN'],['super','CCC-EPI']]){
  const denied=setup(profile,'CLOUD_CONTACT_CENTER',instance);for(const [k,v]of x.local)denied.local.set(k,v);for(const [k,v]of x.session)if(k==='cloud-task-created-v1'||k==='cloud-task-wizard-drafts-v1')denied.session.set(k,v);
  load(denied,'cloud-task-workspace');load(denied,'scenario-demo');const before=denied.local.get(journalKey);assert(!denied.ctx.ScenarioDemo.runNext(quick.taskId));assert.equal(denied.ctx.ScenarioDemo.panel(denied.d.tasks.find(t=>t.taskId===quick.taskId)),'');assert.equal(denied.local.get(journalKey),before);
}
// Store-admin fixture: change only VM membership and readiness fixtures. The
// actual tenant authorization, wizard and resource checks still run unchanged.
const store=setup('operator');store.d.memberships.find(m=>m.accountId===store.ctx.AppState.get().accountId&&m.tenantId==='TEN-NISSAN-SH').roleCode='ADMIN';
assert.equal(store.ctx.AppState.effectiveAccess().roleCode,'ADMIN');
for(const [k,v]of x.local)store.local.set(k,v);for(const [k,v]of x.session)if(k==='cloud-task-created-v1')store.session.set(k,v);
load(store,'cloud-task-workspace');load(store,'scenario-demo');assert(!store.ctx.ScenarioDemo.runNext(quick.taskId));
store.d.agents.find(a=>a.contactCenterIdentityId==='CCI-SH-003').agentStatus='空闲';
for(const scenarioType of ['PREDICTIVE','IVR_OUTBOUND'])store.d.scenarioTests.unshift({testId:'QA-STORE-'+scenarioType,tenantId:'TEN-NISSAN-SH',scenarioType,status:'PASS',testedAt:'2026-09-10',summary:'VM readiness fixture only, not POC'});
for(const type of ['预外呼','IVR 外呼']){
  const task=create(store,type,'普通门店'+type,1);store.ctx.CloudTaskWorkspace.controlTask(task.taskId,'start');assert.equal(task.status,'执行中',JSON.stringify(store.messages));assert(store.ctx.ScenarioDemo.runNext(task.taskId));
  const call=store.d.calls.find(c=>c.taskId===task.taskId);assert.equal(call.tenantId,'TEN-NISSAN-SH');assert.equal(call.instanceId,'CCC-NISSAN');assert.equal(call.callerNumberId,'QA-LOCAL-NUM');if(type==='预外呼')assert.equal(call.skillGroupId,'SG-ALI-SH-SALES');
}
// Current resources are rechecked at click time, not copied from the fixed HQ demo.
const guard=create(re,'预外呼','失效资源禁止',2);re.ctx.CloudTaskWorkspace.controlTask(guard.taskId,'start');
re.d.phoneNumbers.find(n=>n.numberId==='QA-LOCAL-NUM').businessStatus='已隔离';assert(!re.ctx.ScenarioDemo.runNext(guard.taskId));assert.equal(guard.completed,0);
re.d.phoneNumbers.find(n=>n.numberId==='QA-LOCAL-NUM').businessStatus='正常';const raw=re.ctx.localStorage.setItem;
re.ctx.localStorage.setItem=(k,v)=>{if(k===journalKey)throw Error('quota');return raw(k,v);};assert(!re.ctx.ScenarioDemo.runNext(guard.taskId));assert.equal(guard.completed,0);assert(re.ctx.CustomerTasks.taskCustomers(guard).every(c=>c.calls.length===0));
console.log('PASS VM: 普通新建两类任务、当前资源、显式逐位结果、暂停终止完成保护、连续点击不重复、批次/任务/记录/报表共用、刷新及索引丢失/写失败恢复、未提交及冲突源不升级、无权/跨实例拒绝、旧数据不重置、存储失败不伪造成功；非浏览器/真实话务/POC验收');
