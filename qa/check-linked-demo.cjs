const assert=require('node:assert/strict'),{setup}=require('./fixtures/prototype-vm.cjs');
const x=setup('admin'),a=x.ctx.ScenarioDemo,w=x.ctx.CloudTaskWorkspace,c=x.ctx.CustomerTasks;
assert(a.prepare());assert(a.prepare());
for(const id of ['DEMO-LINK-PRED','DEMO-LINK-IVR']){
 const t=x.d.tasks.find(t=>t.taskId===id);assert(t);assert.equal(t.total,2);assert.equal(t.status,'待启动');assert.equal(x.d.tasks.filter(t=>t.taskId===id).length,1);
 assert(!a.runNext(id));w.controlTask(id,'start');assert.equal(t.status,'执行中',JSON.stringify(x.messages));
 assert(a.runNext(id,'接通'),JSON.stringify(x.messages));assert.equal(t.completed,1);assert.equal(t.connected,1);
 w.controlTask(id,'pause',true);assert(!a.runNext(id));w.controlTask(id,'resume');assert(a.runNext(id,'未接通'));assert.equal(t.status,'已完成');assert.equal(t.completed,2);assert(!a.runNext(id));
 assert.equal(c.taskCustomers(t).filter(r=>r.calls.length===1).length,2);assert.equal(x.d.calls.filter(r=>r.taskId===id).length,2);
}
assert(a.inbound('接通'),JSON.stringify(x.messages));assert(a.inbound('排队超时'));assert.equal(x.d.calls.filter(c=>c.callSource==='LOCAL_SCENARIO_DEMO').length,6);
assert(x.d.calls.filter(c=>c.callSource==='LOCAL_SCENARIO_DEMO').every(c=>c.callbackStatus==='无需回流'&&!c.recordingUrl));
const operator=setup('operator-hq');assert(!operator.ctx.ScenarioDemo.prepare());assert(!operator.ctx.ScenarioDemo.inbound());
const fs=require('fs'),vm=require('vm'),{root}=require('./fixtures/prototype-vm.cjs');
const reload=setup('admin');for(const [k,v]of x.local)reload.local.set(k,v);
for(const file of ['customer-demo','scenario-demo'])vm.runInContext(fs.readFileSync(root+'/js/pages/'+file+'.js','utf8'),reload.ctx);
assert.equal(reload.d.tasks.find(t=>t.taskId==='DEMO-LINK-PRED').status,'已完成');assert.equal(reload.d.calls.filter(c=>c.callSource==='LOCAL_SCENARIO_DEMO').length,6);
assert(reload.ctx.Pages['report-center'].render({view:'outbound'}).includes('流程演示'));
reload.d.phoneNumbers.find(n=>n.numberId==='DEMO-LINK-IN-NUM').businessStatus='停用';assert(!reload.ctx.ScenarioDemo.inbound());
console.log('PASS: 关联资源/两类任务/名单计数/启动暂停恢复/逐位结果/批次回写/六条通话/呼入接听超时/运营拒绝模拟/无真实录音回流');
