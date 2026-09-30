/* Durable task lifetime and direct-import transaction regressions. Real application
 * scripts with DOM/storage/clock substitutes; no supplier or network requests. */
'use strict';
const assert=require('node:assert/strict');
const {fixture,signedIn}=require('./verify-task-direct-import.cjs');
const checks=[],failures=[],taskKey='cloud-task-created-v1',batchKey='customer-task-batches-v1',importKey='cloud-task-import-transaction-v1',prefix='alicti-demo-v2:';
const clone=value=>JSON.parse(JSON.stringify(value));
function clearTaskRecords(c,id=''){for(const key of [...c.testStores.local.keys()])if(key.startsWith(prefix+'cloud-task-record-v1:')&&(!id||key.startsWith(prefix+'cloud-task-record-v1:'+encodeURIComponent(id)+':')))c.testStores.local.delete(key);}
let clock=Date.now();
function check(name,fn){try{fn();checks.push(name);}catch(error){failures.push({name,message:error.stack});}}
function setup(options={}){
  const c=fixture({session:signedIn(),now:++clock,...options}),nodes=new Map(),layers=new Map();let route=null;
  c.document.getElementById=id=>nodes.get(id)||null;
  c.PlatformUI.openLayer=(id,html)=>layers.set(id,html);c.PlatformUI.closeLayer=id=>layers.delete(id);
  c.PlatformUI.confirm=options=>{c.confirmation=options;};
  c.showToast=(message,type)=>{c.lastToast={message,type};};c.navigateTo=(key,options)=>{c.lastNavigation={key,options};};
  c.RouteRuntime.openSecondary=(key,options={})=>{route={key,options};c.Pages[key==='cloud-task-create'?'cloud-task-workspace':key]?.render(options);return true;};
  c.RouteRuntime.snapshot=()=>route;c.RouteRuntime.refreshCurrent=()=>true;c.RouteRuntime.back=()=>{route=null;return true;};
  c.test={nodes,layers,field:(id,value='')=>nodes.set(id,{value,innerHTML:'',disabled:false}),tasks:()=>JSON.parse(c.localStorage.getItem(taskKey)||'[]'),batches:()=>JSON.parse(c.localStorage.getItem(batchKey)||'[]')};
  return c;
}
function createTask(c,name='任务持久化回归'){
  const w=c.CloudTaskWorkspace;assert(w.start('预外呼'));w.update('name',name);w.setCustomerMode('later');w.next();w.toggleAllAgents(true);
  w.setCallerNavigation(c.CloudCallData.instances.find(row=>row.enterpriseId==='7522240').callerNavigations[0].customerClidsGroup);w.next();w.next();w.submit();
  const task=c.CloudCallData.tasks.find(row=>row.name===name);assert(task,'Real wizard must create task');assert.equal(task.status,'待分配客户');return task;
}
function preview(c,task,name='持久化专项名单'){
  c.CustomerTasks.importDialog(task.taskId);c.test.field('customer-batch-name',name);c.test.field('customer-import-business-type','lead');
  c.test.field('customer-import-text','专项客户,13800000011,保留这段输入,LEAD-0011');c.test.field('customer-import-preview');c.test.field('customer-import-confirm');c.CustomerTasks.previewImport();assert.equal(c.test.nodes.get('customer-import-confirm').disabled,false);return name;
}
function imported(c,name){return c.test.batches().filter(row=>row.name===name);}
function reload(c,session=c.testStores.session){return setup({local:c.testStores.local,session});}
check('四步真实创建并导入，已保存任务和客户在独立新会话恢复同一身份',()=>{
  const c=setup(),task=createTask(c),name=preview(c,task);c.CustomerTasks.confirmImport();assert.equal(task.total,1);assert.equal(imported(c,name).length,1);
  for(const fresh of [reload(c),reload(c,signedIn())]){const restored=fresh.CloudCallData.tasks.find(row=>row.taskId===task.taskId);assert(restored);assert.equal(restored.total,1);assert.equal(restored.status,'待启动');assert.equal(fresh.CustomerTasks.taskCustomers(restored).length,1);assert.equal(fresh.CustomerTasks.taskCustomers(restored)[0].externalDocumentId,'LEAD-0011');}
});
check('旧session任务迁入local，之后新会话不需要旧session即可恢复',()=>{
  const old=setup(),task=createTask(old);old.localStorage.removeItem(taskKey);clearTaskRecords(old);const fresh=reload(old);
  assert(fresh.test.tasks().some(row=>row.taskId===task.taskId));assert(reload(fresh,signedIn()).CloudCallData.tasks.some(row=>row.taskId===task.taskId));
});
check('持久任务新版本优先于旧session镜像，已删除任务不被镜像复活',()=>{
  const c=setup(),task=createTask(c),staleSession=new Map(c.testStores.session),stale=clone(task);
  const deleted={...clone(task),status:'已删除'};assert(c.CloudTaskWorkspace.saveDemoTask(deleted));
  const fresh=reload(c,staleSession);assert(!fresh.CloudCallData.tasks.some(row=>row.taskId===task.taskId));assert.equal(fresh.test.tasks().find(row=>row.taskId===task.taskId).status,'已删除');
  assert.throws(()=>c.CloudTaskWorkspace.saveDemoTask({...stale,name:'过期页面复活'}),/其他页面更新|已删除/);
});
check('两个页面对同一任务的过期提交被拒绝，不覆盖已保存的新状态',()=>{
  const a=setup(),task=createTask(a),b=reload(a,signedIn()),stale=clone(b.CloudCallData.tasks.find(row=>row.taskId===task.taskId));
  task.status='已终止';task.providerStatusCode=3;assert(a.CloudTaskWorkspace.saveDemoTask(task));
  assert.throws(()=>b.CloudTaskWorkspace.saveDemoTask({...stale,name:'旧名字'}),/其他页面更新/);
  assert.equal(a.test.tasks().find(row=>row.taskId===task.taskId).status,'已终止');b.CloudTaskWorkspace.refreshStoredTasks();assert.equal(b.CloudCallData.tasks.find(row=>row.taskId===task.taskId).status,'已终止');
});
check('旧页面保存独立任务时按最新台账合并，保留另一个页面新建任务',()=>{
  const a=setup(),first=createTask(a),b=reload(a,signedIn()),second=createTask(b,'另一标签任务');
  first.description='独立更新';assert(a.CloudTaskWorkspace.saveDemoTask(first));assert(a.test.tasks().some(row=>row.taskId===second.taskId));assert.equal(a.test.tasks().find(row=>row.taskId===first.taskId).description,'独立更新');
});
check('损坏的持久任务台账不回退旧session覆盖原始数据',()=>{
  const c=setup(),task=createTask(c);c.localStorage.setItem(taskKey,'{broken');assert.throws(()=>c.CloudTaskWorkspace.saveDemoTask({...task,name:'不能保存'}));assert.equal(c.localStorage.getItem(taskKey),'{broken');
});
check('缺失任务引用只显式恢复无通话客户，保留原任务分配历史',()=>{
  const c=setup(),task=createTask(c),name=preview(c,task);c.CustomerTasks.confirmImport();const batch=imported(c,name)[0],row=batch.rows[0];
  clearTaskRecords(c,task.taskId);c.localStorage.setItem(taskKey,JSON.stringify(c.test.tasks().filter(item=>item.taskId!==task.taskId)));c.sessionStorage.setItem(taskKey,c.localStorage.getItem(taskKey));
  const fresh=reload(c,signedIn());fresh.CustomerTasks.render({batchId:batch.id});assert(fresh.CustomerTasks.missingTaskRecoverable(row,batch));
  assert.equal(fresh.CustomerTasks.row(row.id).r.taskId,task.taskId);fresh.CustomerTasks.recoverMissingTask(row.id);assert(fresh.confirmation);assert.equal(fresh.CustomerTasks.row(row.id).r.taskId,task.taskId);
  fresh.confirmation.onConfirm();const restored=fresh.CustomerTasks.row(row.id).r;assert.equal(restored.taskId,'');assert.equal(restored.history.at(-1).previousTask,task.taskId);assert(fresh.CustomerTasks.pendingForTask(batch.tenantId,batch.enterpriseId).some(item=>item.id===row.id));
});
check('缺失任务恢复拒绝活动通话、既有历史、其他租户和运营账号',()=>{
  const c=setup(),task=createTask(c),name=preview(c,task);c.CustomerTasks.confirmImport();const batch=imported(c,name)[0],base=batch.rows[0];
  c.CloudCallData.tasks=c.CloudCallData.tasks.filter(row=>row.taskId!==task.taskId);clearTaskRecords(c,task.taskId);c.localStorage.setItem(taskKey,JSON.stringify(c.test.tasks().filter(row=>row.taskId!==task.taskId)));
  assert.equal(c.CustomerTasks.missingTaskRecoverable({...base,activeCallId:'ACTIVE'},batch),false);assert.equal(c.CustomerTasks.missingTaskRecoverable({...base,calls:[{callId:'OLD'}]},batch),false);
  const op=reload(c,signedIn('TEN-NISSAN-HQ','ACC-OPS-108'));assert.equal(op.CustomerTasks.recoverMissingTask(base.id,true),undefined);assert.equal(op.test.batches().find(row=>row.id===batch.id).rows[0].taskId,task.taskId);
  const other=reload(c,signedIn('TEN-NISSAN-SH','ACC-ADMIN-SH'));other.CustomerTasks.recoverMissingTask(base.id,true);assert.equal(other.test.batches().find(row=>row.id===batch.id).rows[0].taskId,task.taskId);
});
check('导入任务写入失败保留弹窗和输入，回滚本次名单，重试只增加一批',()=>{
  const c=setup(),task=createTask(c),name=preview(c,task),text=c.test.nodes.get('customer-import-text').value,write=c.localStorage.setItem.bind(c.localStorage);let fault=true;
  c.localStorage.setItem=(key,value)=>{if(key===taskKey&&fault)throw Error('quota');return write(key,value);};
  assert.doesNotThrow(()=>c.CustomerTasks.confirmImport());assert(c.test.layers.has('customer-import'));assert.equal(c.test.nodes.get('customer-import-text').value,text);assert.match(c.lastToast.message,/填写内容已保留/);assert.equal(imported(c,name).length,0);assert.equal(task.total,0);assert.equal(c.test.tasks().find(row=>row.taskId===task.taskId).total,0);
  fault=false;c.CustomerTasks.confirmImport();assert.equal(imported(c,name).length,1);assert.equal(task.total,1);assert(!c.test.layers.has('customer-import'));c.CustomerTasks.confirmImport();assert.equal(imported(c,name).length,1);
});
check('导入名单存储失败时任务和原有名单均不改变',()=>{
  const c=setup(),task=createTask(c),name=preview(c,task),before=c.localStorage.getItem(batchKey),write=c.localStorage.setItem.bind(c.localStorage);
  c.localStorage.setItem=(key,value)=>{if(key===batchKey)throw Error('quota');return write(key,value);};c.CustomerTasks.confirmImport();assert.equal(c.localStorage.getItem(batchKey),before);assert.equal(imported(c,name).length,0);assert.equal(task.total,0);assert(c.test.layers.has('customer-import'));
});
check('任务和名单写成但提交标记失败，补偿恢复业务值后可原表单重试',()=>{
  const c=setup(),task=createTask(c),name=preview(c,task),write=c.localStorage.setItem.bind(c.localStorage);let fault=true;
  c.localStorage.setItem=(key,value)=>{if(key===importKey&&JSON.parse(value).committed&&fault){fault=false;throw Error('marker quota');}return write(key,value);};c.CustomerTasks.confirmImport();assert.equal(imported(c,name).length,0);assert.equal(c.test.tasks().find(row=>row.taskId===task.taskId).total,0);assert(c.test.layers.has('customer-import'));
  c.CustomerTasks.confirmImport();assert.equal(imported(c,name).length,1);assert.equal(c.test.tasks().find(row=>row.taskId===task.taskId).total,1);
});
check('补偿失败保留恢复日志；新会话恢复本次增量并保留其他批次',()=>{
  const c=setup(),task=createTask(c),name=preview(c,task),write=c.localStorage.setItem.bind(c.localStorage);let batchWrites=0;
  c.localStorage.setItem=(key,value)=>{if(key===taskKey||key===batchKey&&++batchWrites>1)throw Error('quota');return write(key,value);};c.CustomerTasks.confirmImport();assert(c.localStorage.getItem(importKey));assert(c.test.layers.has('customer-import'));
  const fresh=reload(c,signedIn());assert.equal(imported(fresh,name).length,0);assert.equal(fresh.localStorage.getItem(importKey),null);assert(fresh.test.batches().length>0);assert.equal(fresh.test.tasks().find(row=>row.taskId===task.taskId).total,0);
});
check('其他标签不回滚尚在提交中的导入事务',()=>{
  const c=setup(),task=createTask(c),batch={id:'LIVE-IMPORT',name:'进行中',tenantId:task.tenantId,enterpriseId:task.enterpriseId,rows:[]};
  const record={version:1,owner:'another-live-page',startedAt:clock,batch,before:clone(task),after:{...clone(task),total:1,status:'待启动'},committed:false};c.localStorage.setItem(importKey,JSON.stringify(record));
  const fresh=reload(c,signedIn());assert.equal(fresh.CloudTaskWorkspace.recoverDirectImport(),false);assert.deepEqual(JSON.parse(fresh.localStorage.getItem(importKey)),record);
});
check('两个标签交错保存不同任务，兼容索引覆盖也不丢已提交任务',()=>{
  const a=setup(),first=createTask(a),b=reload(a,signedIn()),second=createTask(b,'并发另一任务');
  const updateA={...clone(first),description:'页面一保存'},updateB={...clone(second),description:'页面二保存'},write=a.localStorage.setItem.bind(a.localStorage);let interleaved=false;
  a.localStorage.setItem=(key,value)=>{if(key===taskKey&&!interleaved){interleaved=true;assert(b.CloudTaskWorkspace.saveDemoTask(updateB));}return write(key,value);};
  assert(a.CloudTaskWorkspace.saveDemoTask(updateA));const latest=a.CloudTaskWorkspace.storedTasks();assert.equal(latest.find(row=>row.taskId===first.taskId).description,updateA.description);assert.equal(latest.find(row=>row.taskId===second.taskId).description,updateB.description);
});
check('同一任务在最终记录写入前交错提交，失败方撤回自身候选而不覆盖成功方',()=>{
  const a=setup(),task=createTask(a),b=reload(a,signedIn()),updateA={...clone(task),description:'过期交错提交'},updateB={...clone(task),description:'先完成的提交'};
  let seq=0;a.crypto.randomUUID=()=> 'page-a-'+(++seq);b.crypto.randomUUID=()=> 'page-b-'+(++seq);
  const write=a.localStorage.setItem.bind(a.localStorage);let interleaved=false;
  a.localStorage.setItem=(key,value)=>{if(key.startsWith('cloud-task-record-v1:'+encodeURIComponent(task.taskId)+':')&&!interleaved){interleaved=true;assert(b.CloudTaskWorkspace.saveDemoTask(updateB));}return write(key,value);};
  assert.throws(()=>a.CloudTaskWorkspace.saveDemoTask(updateA),/其他页面更新/);assert.equal(a.CloudTaskWorkspace.storedTasks().find(row=>row.taskId===task.taskId).description,updateB.description);
});
check('跨标签载入任务使用统一对象，后续更新同时反映在列表和详情',()=>{
  const a=setup(),b=reload(a,signedIn()),task=createTask(a);b.CloudTaskWorkspace.refreshStoredTasks();
  const main=b.CloudCallData.tasks.find(row=>row.taskId===task.taskId),listed=b.CloudCallData.predictiveTasks.find(row=>row.taskId===task.taskId);assert.strictEqual(main,listed);
  main.status='已暂停';assert(b.CloudTaskWorkspace.saveDemoTask(main));b.CloudTaskWorkspace.refreshStoredTasks();assert.equal(listed.status,'已暂停');assert.equal(listed._localTaskRevision,main._localTaskRevision);
});
check('通话历史读取异常时不允许恢复缺失任务客户',()=>{
  const c=setup(),task=createTask(c),name=preview(c,task);c.CustomerTasks.confirmImport();const batch=imported(c,name)[0],row=batch.rows[0];
  clearTaskRecords(c,task.taskId);c.localStorage.setItem(taskKey,JSON.stringify(c.test.tasks().filter(item=>item.taskId!==task.taskId)));c.sessionStorage.setItem(taskKey,c.localStorage.getItem(taskKey));c.localStorage.setItem('native-workbench-records-v1','{broken');
  const fresh=reload(c,signedIn());fresh.CustomerDirectory.sync();assert(fresh.CustomerDirectory.status().storageIssue);assert.equal(fresh.CustomerTasks.missingTaskRecoverable(row,batch),false);fresh.CustomerTasks.recoverMissingTask(row.id,true);assert.equal(fresh.CustomerTasks.row(row.id).r.taskId,task.taskId);
});
check('独立任务记录写入失败时回滚导入和兼容索引，保留可重试表单',()=>{
  const c=setup(),task=createTask(c),name=preview(c,task),write=c.localStorage.setItem.bind(c.localStorage);let fail=true;
  c.localStorage.setItem=(key,value)=>{if(fail&&key.startsWith('cloud-task-record-v1:'))throw Error('record quota');return write(key,value);};
  c.CustomerTasks.confirmImport();assert(c.test.layers.has('customer-import'));assert.equal(imported(c,name).length,0);assert.equal(c.CloudTaskWorkspace.storedTasks().find(row=>row.taskId===task.taskId).total,0);fail=false;c.CustomerTasks.confirmImport();assert.equal(imported(c,name).length,1);
});
console.log(JSON.stringify({result:failures.length?'fail':'pass',count:checks.length+failures.length,passed:checks.length,failed:failures.length,checks,failures},null,2));if(failures.length)process.exitCode=1;
