const assert = require('node:assert/strict');
const {setup} = require('./fixtures/prototype-vm.cjs');
const a=setup('admin'),api=a.ctx.CustomerTasks,key='customer-task-batches-v1';
a.local.set(key,JSON.stringify([{id:'selection-batch',name:'选择测试',tenantId:'TEN-NISSAN-HQ',instanceId:'CCC-NISSAN',createdAt:'2026-09-10',errors:[],rows:[
 {id:'one',name:'甲',phone:'13800009901',ownerId:'',taskId:'',followup:'待联系',calls:[],history:[]},
 {id:'two',name:'乙',phone:'13800009902',ownerId:'',taskId:'',followup:'待联系',calls:[],history:[]},
 {id:'three',name:'丙',phone:'13800009903',ownerId:'ACC-OPS-108',method:'人工外呼',followup:'待联系',calls:[],history:[]},
 {id:'four',name:'丁',phone:'13800009904',ownerId:'',followup:'已完成',calls:[],history:[]}
]}]));
api.open('selection-batch');const html=api.render({batchId:'selection-batch'});
assert(html.includes('customer-select-all'));assert(html.includes('全选当前筛选下可分配客户'));
assert(html.includes('id="customer-selected-count"'));assert(html.includes('已选择 0 位'));
const rows=['one','two','four'].map(id=>a.field('box-'+id,id));rows[2].disabled=true;
a.queries.set('[name="customer-row"]',rows);const all=a.field('customer-select-all','');
const count=a.field('customer-selected-count',''),clear=a.field('customer-clear-selection','');
api.selectAll(true);assert.deepEqual(rows.map(x=>x.checked),[true,true,false]);assert.equal(all.checked,true);assert.equal(all.indeterminate,false);assert.equal(count.textContent,'已选择 2 位');
rows[0].checked=false;api.updateSelection();assert.equal(all.checked,false);assert.equal(all.indeterminate,true);assert.equal(count.textContent,'已选择 1 位');
api.selectAll(false);assert(rows.every(x=>!x.checked));assert.equal(all.indeterminate,false);assert.equal(clear.disabled,true);
const empty=api.render({batchId:'selection-batch'});assert(empty.includes('已选择 0 位'));
const o=setup('operator-hq');assert(!o.ctx.CustomerTasks.render().includes('customer-select-all'));
assert(a.ctx.RouteRuntime.canRoute('customer-directory'));assert(a.ctx.RouteRuntime.canRoute('customer-tasks'));
console.log('PASS: 表头全选、排除禁选、半选、人数、取消、重绘清空、角色和客户管理路由（DOM替身测试）');
