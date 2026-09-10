const assert=require('node:assert/strict'),{setup}=require('./fixtures/prototype-vm.cjs');
const x=setup('admin'),w=x.ctx.CloudTaskWorkspace,c=x.ctx.CustomerTasks;
x.field('customer-batch-name','提前备客');x.field('customer-import-text','客户甲,13800000011,邀约\n客户乙,13800000012,邀约\n客户丙,13800000013,邀约');x.field('customer-import-preview','');x.field('customer-import-confirm','');c.previewImport();c.confirmImport();
const b=JSON.parse(x.local.get('customer-task-batches-v1'))[0],ids=b.rows.map(r=>r.id);
function draft(name){w.start('预外呼');w.update('name',name);w.update('scheduleMode','保存后手工启动');w.setResource('callerNumberId','NUM-400-8801');w.setResource('skillGroupId','SG-ALI-HQ-AFTER');w.setResource('contactFlowId','FLOW-PRED-HQ-V1');}
draft('预选不占用');w.toggleCustomer(ids[0],true);w.saveDraft(true);assert(c.pendingForTask(b.tenantId,b.instanceId).some(r=>r.id===ids[0]));w.cancel();assert(!c.row(ids[0]).r.taskId);
draft('批次部分创建');w.filterCustomers('customerBatch',b.id);w.toggleCustomer(ids[0],true);w.toggleCustomer(ids[1],true);w.submit();const t=x.d.tasks.find(t=>t.name==='批次部分创建');assert(t);assert.equal(t.status,'待启动');assert.equal(t.total,2);assert.equal(c.taskCustomers(t).length,2);assert(!c.pendingForTask(b.tenantId,b.instanceId).some(r=>r.id===ids[0]));assert(c.pendingForTask(b.tenantId,b.instanceId).some(r=>r.id===ids[2]));
assert.equal(c.attachToNewTask({...t,taskId:'QA-IVR',callType:'IVR 外呼',status:'待分配客户',completed:0},[ids[0]]),false);
const ivr={...t,taskId:'QA-IVR',callType:'IVR 外呼',status:'待分配客户',completed:0};assert(c.attachToNewTask(ivr,[ids[2]]));assert.equal(c.row(ids[2]).r.method,'IVR 外呼');
assert.equal(c.attachToNewTask({...ivr,status:'执行中'},[]),false);
assert.equal(c.validateTaskSelection({...ivr,tenantId:'TEN-NISSAN-SH'},[ids[2]]),false);
const batches=JSON.parse(x.local.get('customer-task-batches-v1'));const fresh={...b.rows[0],id:'QA-RACE',phone:'13800000999',taskId:'',ownerId:'',method:'',calls:[],history:[]};batches[0].rows.push(fresh);x.local.set('customer-task-batches-v1',JSON.stringify(batches));
draft('过期选择被拦截');w.toggleCustomer('QA-RACE',true);assert(c.attachToNewTask({...ivr,taskId:'QA-OTHER'},['QA-RACE']));w.submit();assert(!x.d.tasks.some(t=>t.name==='过期选择被拦截'));assert(x.messages.some(m=>m.m.includes('所选客户已被分配')));
console.log('PASS: 提前导入、预选/退出不占用、部分客户随任务提交、余量待分配、IVR共用分配、重复/跨租户/已启动拒绝');
