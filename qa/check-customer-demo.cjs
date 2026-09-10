const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{setup}=require('./fixtures/prototype-vm.cjs');
const a=setup('admin'),key='customer-task-batches-v1';
a.local.set(key,'[]'); // Isolate the opt-in demo from dashboard display fixtures.
assert(a.ctx.CustomerDemo.prepare());assert(a.ctx.CustomerDemo.prepare());
let batch=JSON.parse(a.local.get(key)).find(b=>b.id==='DEMO-CUSTOMER-BATCH');
assert.equal(JSON.parse(a.local.get(key)).length,1);assert.equal(batch.rows.length,8);
assert.equal(a.d.agents.find(r=>r.agentRecordId==='AGT-001').accountId,'ACC-OPS-CHEN');
assert(a.ctx.CustomerTasks.owners('TEN-NISSAN-HQ').some(r=>r.accountId==='ACC-OPS-108'));
a.ctx.CustomerTasks.open(batch.id);assert(a.ctx.CustomerTasks.assign([batch.rows[0].id],'人工外呼','ACC-OPS-108'));
const o=setup('operator-hq');for(const [k,v]of a.local)o.local.set(k,v);
vm.runInContext(fs.readFileSync('DEMO_PROTYPE/js/pages/customer-demo.js','utf8'),o.ctx);
assert.equal(o.ctx.CustomerDemo.prepare(),false);
const w=o.ctx.AgentWorkbench,c=o.ctx.CustomerTasks;
assert.equal(c.mine().length,6);c.pick(batch.rows[0].id);w.updateField('skillGroupId','DEMO-CUSTOMER-SKILL');assert(o.layers.get('assigned-call-dialog').includes('02100009009'));
async function run(){w.signIn();await Promise.resolve();assert(w.dial());w.end('接通');w.setDisposition('需要再次联系');w.setRemark('明天下午再次联系');w.saveDisposition();
assert.equal(c.row(batch.rows[0].id).r.followup,'待继续跟进');
c.pick(batch.rows[0].id);assert(w.dial());w.end('接通');w.setDisposition('已完成沟通');w.saveDisposition();w.signOut();
assert.equal(c.row(batch.rows[0].id).r.calls.length,2);assert.equal(c.row(batch.rows[0].id).r.followup,'已完成');
a.local.set(key,o.local.get(key));assert(a.ctx.CustomerTasks.render({batchId:batch.id}).includes('跟进完成 2'));
console.log('PASS: 完整演示准备幂等、旧坐席不覆盖、管理员分配、刷新恢复资源、运营拨号/再次跟进/完成/批次回写');}
run().catch(e=>{console.error(e);process.exitCode=1;});
