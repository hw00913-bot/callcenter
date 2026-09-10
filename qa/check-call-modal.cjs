const assert=require('node:assert/strict'),{setup}=require('./fixtures/prototype-vm.cjs');
const a=setup('operator-chen'),w=a.ctx.AgentWorkbench,c=a.ctx.CustomerTasks,k='customer-task-batches-v1',modal='assigned-call-dialog';
const r={id:'QA-MODAL-CLIENT',name:'弹窗验收客户',phone:'13800000003',note:'确认到店时间',ownerId:'ACC-OPS-CHEN',method:'人工外呼',followup:'待联系',calls:[],history:[]};
a.local.set(k,JSON.stringify([{id:'QA-MODAL-BATCH',name:'弹窗验收',tenantId:'TEN-NISSAN-HQ',instanceId:'CCC-NISSAN',rows:[r],errors:[]}]));
function dialog(){return a.layers.get(modal)||'';}
async function run(){
 a.ctx.RouteRuntime.snapshot=()=>({key:'home',options:{dashboardSection:'customers',dashboardPersonal:true}});
 c.pick(r.id);assert(dialog().includes('弹窗验收客户'));assert(!dialog().includes('seat-contact'));assert(dialog().includes('上线，准备呼叫'));assert(!a.events.some(e=>e.key==='manual-outbound'));
 assert.equal(w.closeDialog(),true);assert(!dialog());assert.equal(c.mine().length,1);
 c.pick(r.id);w.updateField('skillGroupId','SG-ALI-HQ-SALES');w.signIn();await Promise.resolve();assert(dialog().includes('开始呼叫'));assert(w.dial());assert.equal(c.mine().length,0);
 assert.equal(w.closeDialog(),false);assert(!dialog());assert(a.nodes.has('native-call-dock'));
 w.open();assert(dialog().includes('当前')||dialog().includes('正在呼叫'));assert(!a.nodes.has('native-call-dock'));
 w.beforeRouteChange();w.updateDock();assert(!dialog());assert(a.nodes.has('native-call-dock'));w.open();
 w.end('未接通');assert(dialog().includes('填写处理结果'));assert.equal(w.closeDialog(),false);assert(dialog());
 w.saveDisposition();assert(dialog().includes('请选择本次联系的处理结果'));
 w.setDisposition('需要再次联系');w.setRemark('明天上午');w.saveDisposition();assert(!dialog());assert.equal(c.mine().length,1);assert.equal(a.events.at(-1).options.dashboardSection,'customers');
 c.pick(r.id);assert(w.dial());w.end('接通');w.setDisposition('已完成沟通');w.saveDisposition();assert(!dialog());assert.equal(c.mine().length,0);assert.equal(c.row(r.id).r.calls.length,2);w.signOut();
 console.log('PASS: 原地弹窗/带入客户/无重复选择/主按钮/准备关闭/通话收起/恢复/话后禁止丢弃/校验/两次结果回写');
}run().catch(e=>{console.error(e);process.exitCode=1;});
