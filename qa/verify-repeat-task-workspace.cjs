/* Same-task business follow-up integration. Synthetic local state only; no supplier calls. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const {setup,create}=require('./verify-predictive-strategy.cjs');
const root=path.resolve(__dirname,'..'),checks=[],failures=[];
const batchKey='customer-task-batches-v1',savedTaskKey='cloud-task-created-v1',journalKey='cloud-task-repeat-transaction-v1';
const clone=value=>JSON.parse(JSON.stringify(value));
const scope={tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240'};
function check(name,fn){try{fn();checks.push(name);}catch(error){failures.push({name,message:error.stack});}}
function fixture(status='已暂停'){
  const c=setup(),local=new Map();
  c.failOnce='';c.writes=[];c.toasts=[];
  function write(store,key,value,kind){
    c.writes.push({kind,key});
    if(c.failOnce===kind+':'+key){c.failOnce='';throw Error('Synthetic storage failure');}
    store.set(key,String(value));
  }
  c.localStorage={getItem:key=>local.get(key)??null,setItem:(key,value)=>write(local,key,value,'local'),removeItem:key=>local.delete(key)};
  c.sessionStorage.setItem=(key,value)=>write(c.storage,key,value,'session');
  c.AppState.isReady=()=>true;
  c.showToast=(message,type)=>c.toasts.push({message,type});
  c.CloudCallData.calls=[];c.CloudCallData.nativeWorkbench={blockedNumbers:[]};
  c.CloudReportMetrics={state:call=>({ended:!!call.endedAt,answered:[41,42,43].includes(call.status)?true:call.status===40?false:null}),humanAnswer:call=>call.status===43?true:call.status===42?false:null,customerPhone:call=>call.callee,callTime:call=>Date.parse(call.ringingAt)};
  c.CustomerDirectory={normalizePhone:value=>String(value||'').replace(/^\+86/,'').replace(/\D/g,''),list:()=>[{id:'CUSTOMER',...scope,calls:c.CloudCallData.calls}]};
  c.CustomerDirectory.find=id=>c.CustomerDirectory.list().find(row=>row.id===id);
  for(const file of ['customer-business.js','repeat-predictive.js'])vm.runInContext(fs.readFileSync(path.join(root,'js/components',file),'utf8'),c,{filename:file});
  const task={taskId:'SOURCE',name:'总部邀约',...scope,callType:'预外呼',status,total:1,completed:1,connected:1,providerTaskId:88001,demoProviderTaskId:88001,simulation:true,localPrototypeTask:true,customerSourceMode:'assigned',autoComplete:0,importTelAutoStart:0,isRepeat:1,callerNumberId:'N1',callStrategy:'2',cnos:'0012',planSnapshot:{snapshotId:'FROZEN',callStrategy:'2',callerNumberIds:['N1'],cnos:'0012'},executionConfig:{callStrategy:'2',cnos:'0012'},retryPolicy:{mode:'advanced',rounds:[{round:1,intervalSeconds:120,codes:[710]}]},scheduleAt:'手工启动',alictiCreateDraft:{endpoint:'task/create',fields:{name:'总部邀约',autoComplete:0,cnos:'0012',callStrategy:'2'}},alictiImportDrafts:[{endpoint:'task/importTaskTel',sourceBatchId:'ORIGINAL-BATCH',fields:{taskId:88001,isRepeat:1,importTelAutoStart:0,name:'原始名单',taskTelList:[{tel:'13800000001'}]},pending:[],mock:true}]};
  const row={id:'ORIGINAL-ROW',name:'客户甲',phone:'13800000001',businessType:'lead',externalDocumentId:'0012',brandId:'BRAND-A',ownerId:'',method:'预外呼',taskId:task.taskId,taskName:task.name,followup:'待继续跟进',activeCallId:'',calls:[{callId:'ORIGINAL-CALL',result:'接通',at:'2026-09-21 10:01:00'}],history:[{action:'首次预外呼'}]};
  const call={callId:'ORIGINAL-CALL',...scope,taskId:task.taskId,customerTaskItemId:row.id,callee:row.phone,callType:'预外呼',status:43,ringingAt:'2026-09-21 10:00:00',endedAt:'2026-09-21 10:01:00',processingStatus:'已完成',agentDisposition:'需要再次联系',dispositionRemark:'客户约定再次沟通',retryRound:2};
  const batch={id:'ORIGINAL-BATCH',name:'原始名单',...scope,businessType:'lead',brandId:'BRAND-A',createdBy:'A',rows:[row]};
  c.CloudCallData.tasks.push(task);c.CloudCallData.predictiveTasks.push(task);c.CloudCallData.calls.push(call);
  local.set(batchKey,JSON.stringify([batch]));
  c.CustomerTasks.taskExecutionCustomers=target=>c.batches().filter(b=>b.tenantId===target.tenantId&&b.enterpriseId===target.enterpriseId).flatMap(b=>b.rows.filter(r=>r.taskId===target.taskId).map(r=>({...r,batchId:b.id,batchName:b.name})));
  c.CustomerTasks.taskCustomers=c.CustomerTasks.taskExecutionCustomers;
  c.CustomerTasks.commitTaskAttachment=prepared=>c.RepeatPredictive.commitAttachment(prepared);
  c.CustomerTasks.rollbackTaskAttachment=prepared=>c.RepeatPredictive.rollbackAttachment(prepared);
  c.AliCtiDemo.imported=(target,requests)=>{c.lastImported={taskId:target.taskId,requests:clone(requests)};};
  c.ScenarioDemo.saveTask=target=>{if(c.failOnce==='scenario'){c.failOnce='';throw Error('Synthetic scenario save failure');}c.lastScenarioSaved=clone(target);};
  c.batches=()=>JSON.parse(local.get(batchKey));
  c.local=local;c.task=task;c.row=row;c.call=call;c.batch=batch;
  c.spec=()=>({version:1,sourceTaskId:task.taskId,sourceRefs:[{batchId:batch.id,itemId:row.id,taskId:task.taskId,callId:call.callId}],note:'本次继续邀约',reason:''});
  assert(c.CloudTaskWorkspace.saveDemoTask(task));
  c.savedTask=()=>JSON.parse(c.storage.get(savedTaskKey));
  c.arrange=()=>c.CloudTaskWorkspace.startRepeatPredictive(c.spec());
  c.snapshot=()=>({task:clone(task),batches:c.local.get(batchKey),calls:JSON.stringify(c.CloudCallData.calls),saved:c.storage.get(savedTaskKey),drafts:c.storage.get('cloud-task-wizard-drafts-v1')});
  return c;
}
function unchanged(c,before){assert.deepStrictEqual(clone(c.task),before.task);assert.equal(c.local.get(batchKey),before.batches);assert.equal(JSON.stringify(c.CloudCallData.calls),before.calls);assert.equal(c.storage.get(savedTaskKey),before.saved);assert.equal(c.storage.get('cloud-task-wizard-drafts-v1'),before.drafts);assert.equal(c.CloudCallData.tasks.length,1);assert.equal(c.CloudCallData.predictiveTasks.length,1);}
function interruptedArrangement(c){
  const before=c.snapshot(),beforeStored=clone(c.savedTask()[0]),prepare=c.RepeatPredictive.prepareAttachment;let attachment;
  c.RepeatPredictive.prepareAttachment=(...args)=>(attachment=prepare(...args));assert(c.arrange());
  const after=clone(c.task);c.local.set(journalKey,JSON.stringify({version:1,taskId:c.task.taskId,taskBefore:before.task,taskAfter:after,beforeStored,attachment,committed:false}));
  return {before,after,attachment,reload(){vm.runInContext(fs.readFileSync(path.join(root,'js/pages/cloud-task-workspace.js'),'utf8'),c);}};
}

check('暂停原任务追加名单，任务 ID 和原策略保持不变且没有新草稿',()=>{
  const c=fixture(),before=c.snapshot();assert.strictEqual(c.arrange(),true);
  assert.equal(c.CloudCallData.tasks.length,1);assert.equal(c.CloudCallData.predictiveTasks.length,1);assert.equal(c.CloudCallData.ivrTasks.length,0);
  assert.equal(c.task.taskId,'SOURCE');assert.equal(c.task.providerTaskId,88001);assert.equal(c.task.status,'已暂停');assert.equal(c.task.total,2);assert.equal(c.task.completed,1);assert.equal(c.task.connected,1);
  assert.equal(c.storage.get('cloud-task-wizard-drafts-v1'),before.drafts);assert.equal(c.active(),undefined);
  for(const field of ['callStrategy','planSnapshot','executionConfig','retryPolicy','alictiCreateDraft','callerNumberId','isRepeat','autoComplete'])assert.deepStrictEqual(clone(c.task[field]),before.task[field],field);
  const batches=c.batches(),fresh=batches.find(b=>b.id!==c.batch.id);assert(fresh);assert.equal(fresh.rows.length,1);assert.equal(fresh.rows[0].taskId,'SOURCE');assert.notEqual(fresh.rows[0].id,c.row.id);assert.deepStrictEqual(fresh.rows[0].calls,[]);
  assert.equal(fresh.rows[0].externalDocumentId,'0012');assert.equal(fresh.rows[0].repeatContact.sourceTaskId,'SOURCE');assert.equal(fresh.rows[0].repeatContact.businessContactNo,2);
  assert.deepStrictEqual(batches.find(b=>b.id===c.batch.id),c.batch);assert.equal(JSON.stringify(c.CloudCallData.calls),before.calls);
  assert.equal(c.savedTask().length,1);assert.equal(c.savedTask()[0].taskId,'SOURCE');assert.equal(c.savedTask()[0].total,2);assert.equal(c.savedTask()[0].status,'已暂停');
});
check('只追加本次导入请求，明确不排重且不自动启动，旧请求不改写',()=>{
  const c=fixture(),old=clone(c.task.alictiImportDrafts[0]);assert(c.arrange());
  assert.equal(c.task.alictiImportDrafts.length,2);assert.deepStrictEqual(clone(c.task.alictiImportDrafts.find(r=>r.sourceBatchId==='ORIGINAL-BATCH')),old);
  const fresh=c.task.alictiImportDrafts.find(r=>r.sourceBatchId!=='ORIGINAL-BATCH');assert.equal(fresh.endpoint,'task/importTaskTel');assert.equal(fresh.fields.taskId,88001);assert.strictEqual(fresh.fields.isRepeat,0);assert.strictEqual(fresh.fields.importTelAutoStart,0);assert.equal(fresh.fields.taskTelList.length,1);assert.equal(fresh.fields.taskTelList[0].tel,c.row.phone);assert.equal(fresh.pending.length,0);
  const property=JSON.parse(fresh.fields.taskTelList[0].property);assert.equal(property.batchId,fresh.sourceBatchId);assert.notEqual(property.batchCustomerId,c.row.id);
});
check('待启动任务追加后同步名单及刷新仍保留再次联系不排重',()=>{
  const c=fixture('待启动');assert(c.arrange());const repeatBatchId=c.batches().find(batch=>batch.id!==c.batch.id).id;
  const verify=()=>{const original=c.task.alictiImportDrafts.find(request=>request.sourceBatchId===c.batch.id),repeat=c.task.alictiImportDrafts.find(request=>request.sourceBatchId===repeatBatchId);assert(original&&repeat);assert.strictEqual(original.fields.isRepeat,1);assert.strictEqual(repeat.fields.isRepeat,0);assert.strictEqual(repeat.fields.importTelAutoStart,0);assert.equal(repeat.fields.taskId,88001);assert.equal(c.task.status,'待启动');assert.equal(c.task.total,2);assert.equal(c.task.completed,1);assert.equal(c.batches().length,2);};
  verify();c.CloudTaskWorkspace.syncAssignedCustomers();verify();
  vm.runInContext(fs.readFileSync(path.join(root,'js/pages/cloud-task-workspace.js'),'utf8'),c);
  c.CloudTaskWorkspace.syncAssignedCustomers();verify();assert.strictEqual(c.arrange(),false);verify();
});
check('执行中的原任务追加后继续保持执行，不改状态或控制设置',()=>{const c=fixture('执行中'),before=c.snapshot();assert(c.arrange());assert.equal(c.task.status,'执行中');assert.equal(c.task.total,2);assert.deepStrictEqual(clone(c.task.planSnapshot),before.task.planSnapshot);assert.equal(c.task.importTelAutoStart,0);assert.equal(c.localStorage.getItem(journalKey),null);});
check('再次点击相同来源不会重复追加名单或累计总量',()=>{const c=fixture();assert(c.arrange());const after=c.snapshot();assert.strictEqual(c.arrange(),false);unchanged(c,after);});
check('结束、完成、终止和删除任务均不能在原任务继续安排',()=>{for(const state of ['已完成','已结束','已终止','已删除']){const c=fixture(state),before=c.snapshot();assert.strictEqual(c.arrange(),false,state);unchanged(c,before);}});
check('缺少供应商任务编号不产生追加批次或任务摘要',()=>{const c=fixture();delete c.task.providerTaskId;delete c.task.demoProviderTaskId;const before=c.snapshot();assert.strictEqual(c.arrange(),false);unchanged(c,before);});
check('再次联系不从旧任务号码复制逐行clid',()=>{const c=fixture();c.CloudCallData.phoneNumbers[0].number='021****1234';assert.strictEqual(c.arrange(),true);const request=c.task.alictiImportDrafts.at(-1);assert(!Object.hasOwn(request.fields.taskTelList[0],'clid'));});
check('写入名单失败时原任务摘要和通话记录不变，恢复后可重试',()=>{const c=fixture(),before=c.snapshot();c.failOnce='local:'+batchKey;assert.strictEqual(c.arrange(),false);unchanged(c,before);assert(c.arrange());assert.equal(c.task.total,2);});
check('写入任务摘要失败时回滚新增名单，恢复后可重试',()=>{const c=fixture(),before=c.snapshot();c.failOnce='session:'+savedTaskKey;assert.strictEqual(c.arrange(),false);unchanged(c,before);assert(c.arrange());assert.equal(c.task.total,2);});
check('演示任务持久化失败时不会遗留半笔再次联系安排',()=>{const c=fixture(),before=c.snapshot();c.failOnce='scenario';assert.strictEqual(c.arrange(),false);unchanged(c,before);assert(c.arrange());assert.equal(c.task.total,2);});
check('准备后任务被结束，提交复核会阻止新增名单',()=>{const c=fixture(),before=c.snapshot(),prepare=c.RepeatPredictive.prepareAttachment;c.RepeatPredictive.prepareAttachment=(...args)=>{const p=prepare(...args);c.task.status='已结束';return p;};assert.strictEqual(c.arrange(),false);assert.equal(c.task.status,'已结束');assert.equal(c.local.get(batchKey),before.batches);assert.equal(c.task.total,1);assert.equal(c.storage.get('cloud-task-wizard-drafts-v1'),before.drafts);});
check('任务控制结果未确认时不能追加客户',()=>{const c=fixture();c.task.alictiTaskControlPending=true;const before=c.snapshot();assert.strictEqual(c.arrange(),false);unchanged(c,before);});
check('刷新后回滚未完成的再次联系事务，保留原任务而不删除原任务',()=>{const c=fixture(),before=c.snapshot(),prepared=c.RepeatPredictive.prepareAttachment(c.task,c.spec());assert(prepared.ok);assert(c.RepeatPredictive.commitAttachment(prepared));c.storage.set(savedTaskKey,JSON.stringify([{...clone(c.task),total:2}]));c.local.set(journalKey,JSON.stringify({version:1,taskId:c.task.taskId,taskBefore:before.task,beforeStored:before.task,attachment:prepared,committed:false}));vm.runInContext(fs.readFileSync(path.join(root,'js/pages/cloud-task-workspace.js'),'utf8'),c);unchanged(c,before);assert.equal(c.localStorage.getItem(journalKey),null);assert.strictEqual(c.CloudCallData.tasks[0],c.task);});
check('恢复未完成追加时保留后来保存的任务终态和供应商终态',()=>{
  for(const status of ['已完成','已结束','已终止']){
    const c=fixture('执行中'),pending=interruptedArrangement(c),latest={...clone(c.task),status,providerStatusCode:3,providerStatus:'结束（模拟）',alictiMockTaskProperty:{id:88001,status:3},stopNewDialing:true,endedAt:'2026-09-21 12:00:00',updatedAt:'2026-09-21 12:00:00'};
    c.storage.set(savedTaskKey,JSON.stringify([latest]));pending.reload();
    for(const task of [c.task,c.savedTask()[0]]){assert.equal(task.status,status);assert.strictEqual(task.providerStatusCode,3);assert.equal(task.alictiMockTaskProperty.status,3);assert.strictEqual(task.stopNewDialing,true);assert.equal(task.endedAt,latest.endedAt);assert.equal(task.updatedAt,latest.updatedAt);assert.equal(task.total,1);assert.equal(task.completed,1);assert(!task.alictiImportDrafts.some(request=>request.sourceBatchId===pending.attachment.newBatch.id));}
    assert.equal(c.batches().length,1);assert.equal(c.local.get(journalKey),undefined);assert.equal(JSON.stringify(c.CloudCallData.calls),pending.before.calls);assert.strictEqual(c.arrange(),false);
  }
});
check('恢复未完成追加时保留后来新增的号码停用与暂停保护',()=>{
  const c=fixture('执行中'),pending=interruptedArrangement(c),protection={previousStatus:'执行中',numberIds:['N1'],reason:'号码本地使用已停用',pausedAt:'2026-09-21 12:01:00'},latest={...clone(c.task),status:'已暂停',providerStatusCode:2,stopNewDialing:true,resourcePause:protection,updatedAt:'2026-09-21 12:01:00',dispatchHistory:[{action:'号码保护暂停'}]};
  c.storage.set(savedTaskKey,JSON.stringify([latest]));pending.reload();
  for(const task of [c.task,c.savedTask()[0]]){assert.equal(task.status,'已暂停');assert.equal(task.providerStatusCode,2);assert.strictEqual(task.stopNewDialing,true);assert.deepStrictEqual(clone(task.resourcePause),protection);assert.deepStrictEqual(clone(task.dispatchHistory),latest.dispatchHistory);assert.equal(task.updatedAt,latest.updatedAt);assert.equal(task.total,1);assert.equal(task.completed,1);}
  assert.equal(c.batches().length,1);assert.equal(c.local.get(journalKey),undefined);
});
check('恢复时只扣除失败追加量，保留后续批次、已完成计数及新话单',()=>{
  const c=fixture('执行中'),pending=interruptedArrangement(c),laterBatch={...clone(c.batch),id:'LATER-BATCH',name:'后续独立导入',rows:[1,2].map(n=>({...clone(c.row),id:'LATER-ROW-'+n,phone:'1390000000'+n,externalDocumentId:'LATER-'+n,followup:n===1?'已完成':'待联系',calls:n===1?[{callId:'LATER-CALL',result:'接通',at:'2026-09-21 12:10:00'}]:[]}))};
  c.local.set(batchKey,JSON.stringify([...c.batches(),laterBatch]));
  c.CloudCallData.calls.push({...clone(c.call),callId:'LATER-CALL',customerTaskItemId:'LATER-ROW-1',callee:'13900000001',ringingAt:'2026-09-21 12:09:00',endedAt:'2026-09-21 12:10:00'});
  const laterRequest={endpoint:'task/importTaskTel',sourceBatchId:laterBatch.id,fields:{taskId:88001,isRepeat:1,importTelAutoStart:0,name:laterBatch.name,taskTelList:laterBatch.rows.map(row=>({tel:row.phone}))},pending:[]},laterResult={sourceBatchId:laterBatch.id,response:{result:0,data:{successTotal:2}}};
  const latest={...clone(c.task),total:4,completed:2,connected:2,updatedAt:'2026-09-21 12:10:00',alictiImportDrafts:[...clone(c.task.alictiImportDrafts),laterRequest],alictiImportResults:[{sourceBatchId:pending.attachment.newBatch.id,response:{result:0}},laterResult]},calls=JSON.stringify(c.CloudCallData.calls);
  c.storage.set(savedTaskKey,JSON.stringify([latest]));pending.reload();
  for(const task of [c.task,c.savedTask()[0]]){assert.equal(task.total,3);assert.equal(task.completed,2);assert.equal(task.connected,2);assert.equal(task.status,'执行中');assert.equal(task.updatedAt,latest.updatedAt);assert.deepStrictEqual(clone(task.alictiImportDrafts.find(request=>request.sourceBatchId===laterBatch.id)),laterRequest);assert.deepStrictEqual(clone(task.alictiImportResults),[laterResult]);assert(!task.alictiImportDrafts.some(request=>request.sourceBatchId===pending.attachment.newBatch.id));}
  assert.equal(c.batches().length,2);assert.deepStrictEqual(c.batches().find(batch=>batch.id===laterBatch.id),laterBatch);assert.deepStrictEqual(c.batches().find(batch=>batch.id===c.batch.id),c.batch);assert.equal(JSON.stringify(c.CloudCallData.calls),calls);assert.equal(c.local.get(journalKey),undefined);
  pending.reload();assert.equal(c.task.total,3);assert.equal(c.task.completed,2);assert.equal(c.batches().length,2);
});
check('恢复摘要持久化失败后重试不会再次扣减后续独立新增量',()=>{
  const c=fixture('执行中'),pending=interruptedArrangement(c),laterBatch={...clone(c.batch),id:'LATER-ONE-BATCH',name:'后续独立单条导入',rows:[{...clone(c.row),id:'LATER-ONE-ROW',phone:'13900000009',externalDocumentId:'LATER-ONE',followup:'待联系',calls:[]}]};
  c.local.set(batchKey,JSON.stringify([...c.batches(),laterBatch]));
  const laterRequest={endpoint:'task/importTaskTel',sourceBatchId:laterBatch.id,fields:{taskId:88001,isRepeat:1,importTelAutoStart:0,name:laterBatch.name,taskTelList:[{tel:'13900000009'}]},pending:[]};
  c.storage.set(savedTaskKey,JSON.stringify([{...clone(c.task),total:3,alictiImportDrafts:[...clone(c.task.alictiImportDrafts),laterRequest]}]));
  c.failOnce='scenario';pending.reload();
  assert(c.local.get(journalKey));assert.equal(c.savedTask()[0].total,2);assert.equal(c.batches().length,2);
  c.CloudTaskWorkspace.syncAssignedCustomers();
  assert.equal(c.task.total,2);assert.equal(c.savedTask()[0].total,2);assert.equal(c.task.completed,1);assert.equal(c.batches().length,2);assert.equal(c.local.get(journalKey),undefined);assert(c.task.alictiImportDrafts.some(request=>request.sourceBatchId===laterBatch.id));
});
check('刷新后已提交的再次联系事务保留追加名单并清理日志，不重复安排',()=>{const c=fixture(),before=c.snapshot(),prepared=c.RepeatPredictive.prepareAttachment(c.task,c.spec());assert(prepared.ok);assert(c.RepeatPredictive.commitAttachment(prepared));c.storage.set(savedTaskKey,JSON.stringify([{...clone(c.task),total:2}]));c.local.set(journalKey,JSON.stringify({version:1,taskId:c.task.taskId,taskBefore:before.task,beforeStored:before.task,attachment:prepared,committed:true}));vm.runInContext(fs.readFileSync(path.join(root,'js/pages/cloud-task-workspace.js'),'utf8'),c);assert.equal(c.task.total,2);assert.equal(c.batches().length,2);assert.equal(c.localStorage.getItem(journalKey),null);assert.strictEqual(c.arrange(),false);assert.equal(c.task.total,2);assert.equal(c.CloudCallData.tasks.length,1);});
check('新预外呼耗尽后保留原任务，而自动外呼保留默认完成行为',()=>{const c=setup(),predictive=create(c,'2');assert.strictEqual(predictive.autoComplete,0);assert.strictEqual(predictive.alictiCreateDraft.fields.autoComplete,0);const f=c.AliCtiFields.taskFields({...scope,type:'IVR 外呼',values:{name:'自动外呼',providerIvrId:'91001'}},c.CloudCallData);assert.strictEqual(f.fields.autoComplete,1);});
check('外显导航原任务再次联系沿用冻结配置与任务ID，不要求本地号码也不向名单写clid',()=>{
  const c=fixture(),navigation={callerMode:'navigation',callerNumberId:'',customerClidsGroup:'原任务导航',clidPoolList:[{name:'总部销售',priority:1}],customerTimeout:45};
  Object.assign(c.task,navigation);Object.assign(c.task.planSnapshot,navigation,{callerNumberIds:[]});Object.assign(c.task.executionConfig,navigation,{allowedCallerNumberIds:[]});
  Object.assign(c.task.alictiCreateDraft.fields,{customerClidsCategory:5,customerClidsGroup:navigation.customerClidsGroup,clidPoolList:clone(navigation.clidPoolList),customerTimeout:45});
  c.CloudCallData.phoneNumbers=[];c.CloudCallData.instances=[{enterpriseId:scope.enterpriseId,customerClidsGroup:'后来修改的账号导航'}];
  assert(c.CloudTaskWorkspace.saveDemoTask(c.task));const before=clone(c.task);assert(c.arrange());assert.equal(c.task.taskId,'SOURCE');assert.equal(c.task.providerTaskId,88001);assert.equal(c.CloudCallData.tasks.length,1);assert.equal(c.task.total,2);
  for(const field of ['callerMode','customerClidsGroup','clidPoolList','customerTimeout','planSnapshot','executionConfig','alictiCreateDraft'])assert.deepStrictEqual(clone(c.task[field]),before[field],field);
  const fresh=c.task.alictiImportDrafts.find(request=>request.sourceBatchId!=='ORIGINAL-BATCH');assert(fresh);assert.equal(fresh.pending.length,0);assert.equal(fresh.fields.taskId,88001);assert.equal(fresh.fields.isRepeat,0);assert(fresh.fields.taskTelList.every(row=>!Object.hasOwn(row,'clid')));
});
console.log(JSON.stringify({result:failures.length?'fail':'pass',count:checks.length+failures.length,passed:checks.length,failed:failures.length,checks,failures},null,2));
if(failures.length)process.exitCode=1;
