/** SRC-048: actual role/overview handlers, VM/DOM doubles; not browser evidence. */
'use strict';
const assert=require('node:assert/strict');
const {setup}=require('./fixtures/prototype-vm.cjs');

for(const profile of ['super','admin','operator','operator-hq','operator-chen']){
  const x=setup(profile),w=x.ctx.WorkbenchOverview,html=w.render();
  assert.equal(w.render({dashboardPersonal:true}),html,'Old personal flag must not change the operations dashboard');
  assert(!html.includes('workbench-view-switch'));assert(!html.includes('我的工作</button>'));assert(!html.includes('租户概览</button>'));
  assert(!html.includes('首呼接通率'));assert(!html.includes('CustomerTasks.pick('));
  if(profile==='super'){
    for(const title of ['线路与接入状态','租户与账号分布','需关注的任务','需核对的通话数据'])assert(html.includes(title));
    assert(!html.includes('今日任务进度'));
  }else{
    for(const title of ['今日任务进度','外呼方式分布','当前坐席'])assert(html.includes(title));
    assert(html.indexOf('aria-label="任务与呼叫"')<html.indexOf('aria-label="坐席与通话"'));
    if(profile==='admin')assert(html.includes('坐席负荷与当前通话'));
    else{
      assert(html.includes('租户运营工作台'));assert(!html.includes('查看与管理'));
      const a=w.model().seats[0],before=JSON.stringify(a);w.agent(a.agentRecordId);
      assert(!x.layers.get('dashboard-agent').includes('停止接收新任务'));w.stopNew(a.agentRecordId);assert.equal(JSON.stringify(a),before);
      assert(!w.render({dashboardSection:'lines'}).includes('进入线路管理'));
      assert(!w.render({dashboardSection:'tasks'}).includes('暂停任务'));
    }
  }
}

const personal=setup('operator-hq'),w=personal.ctx.WorkbenchOverview,html=w.renderSeat();
assert(!html.includes('platform-page'));assert(!html.includes('<h1'));assert(!html.includes('workbench-view-switch'));
for(const title of ['今日待联络客户','已呼叫客户','呼叫次数','接通次数','未接通次数','首呼次数','首呼接通率','通话总时长（秒）','平均通话时长（秒）','待联络客户'])assert(html.includes(title),title);
assert(html.includes('class="seat-personal-columns"'));
assert(html.indexOf('aria-label="客户联络"')<html.indexOf('aria-label="通话成效"'));
assert(!html.includes('当前坐席'));assert(!html.includes('今日任务进度'));
const self=w.model(true).seats[0];assert(self);assert(w.model(true).pending.length>0);
assert(w.model(true).calls.every(call=>(call.contactCenterIdentityId||call.agentIdentityId)===self.contactCenterIdentityId));
assert(w.model(true).pending.every(row=>row.ownerId===personal.ctx.AppState.get().accountId));
personal.click(html,'接通次数');assert.equal(personal.events.at(-1).key,'seat-workbench');assert.equal(personal.events.at(-1).options.dashboardFilter,'接通');
const detail=w.renderSeat({dashboardSection:'calls',dashboardFilter:'接通'});assert(detail.includes('本人今日通话'));assert(detail.includes('返回坐席工作台'));
personal.click(detail,'返回坐席工作台');assert.equal(personal.events.at(-1).key,'seat-workbench');
assert(w.renderSeat({dashboardSection:'seats'}).includes('此明细不属于坐席工作台'));
w.open('tasks');assert.equal(personal.events.at(-1).key,'home');
personal.click(html,'联系客户');assert(personal.layers.get('assigned-call-dialog')?.includes('联系客户'));

// Disabled/opening seats retain personal history and explain why contact is
// unavailable; no alternate dial state or direct call controls are introduced.
for(const patch of [{lifecycleStatus:'已停用'},{syncStatus:'同步失败'},{phonebarPermission:false},{acceptNewTasks:false}]){
  const x=setup('operator-hq'),api=x.ctx.WorkbenchOverview,seat=api.model(true).seats[0];Object.assign(seat,patch);
  const blocked=api.renderSeat();assert(blocked.includes('首呼接通率'));assert(blocked.includes('查看不能联系的原因'));
  assert(blocked.includes('disabled>联系客户'));assert(!blocked.includes('onclick="CustomerTasks.pick('));
  assert(api.renderSeat({dashboardSection:'calls'}).includes('本人今日通话'));
}

// Personal scope uses the existing exact tenant+instance seat relation for every
// role. Administrator access to tenant totals does not widen personal data.
const admin=setup('admin'),context=admin.ctx.AppState.get(),seat=admin.d.agents.find(a=>a.tenantId===context.tenantId&&a.instanceId===context.instanceId);
seat.accountId=context.accountId;
const stamp=new Date().toLocaleString('sv-SE'),call={callId:'QA-SPLIT-OWN',tenantId:context.tenantId,instanceId:context.instanceId,contactCenterIdentityId:seat.contactCenterIdentityId,callee:'13800007701',direction:'呼出',ringingAt:stamp,answeredAt:stamp,endedAt:stamp,result:'接通',durationSeconds:20,attemptNumber:1};
admin.d.calls.push(call,{...call,callId:'QA-SPLIT-OTHER-TENANT',tenantId:'TEN-NISSAN-SH'},{...call,callId:'QA-SPLIT-OTHER-INSTANCE',instanceId:'CCC-EPI'});
const batches=JSON.parse(admin.local.get('customer-task-batches-v1')||'[]');
for(const [id,tenantId,instanceId]of [['OWN',context.tenantId,context.instanceId],['OTHER-TENANT','TEN-NISSAN-SH',context.instanceId],['OTHER-INSTANCE',context.tenantId,'CCC-EPI']])batches.push({id:'QA-SPLIT-BATCH-'+id,name:id,tenantId,instanceId,rows:[{id:'QA-SPLIT-ROW-'+id,name:id,phone:'13800007701',method:'人工外呼',ownerId:context.accountId,followup:'待联系',calls:[]}]});
admin.local.set('customer-task-batches-v1',JSON.stringify(batches));
const model=admin.ctx.WorkbenchOverview.model(true);assert(model.calls.some(c=>c.callId==='QA-SPLIT-OWN'));
assert(!model.calls.some(c=>c.callId.startsWith('QA-SPLIT-OTHER')));assert.equal(model.seats.length,1);
assert(model.pending.some(r=>r.id==='QA-SPLIT-ROW-OWN'));assert(!model.pending.some(r=>r.id.startsWith('QA-SPLIT-ROW-OTHER')));
assert(admin.ctx.WorkbenchOverview.renderSeat().includes('首呼接通率'));assert(admin.ctx.WorkbenchOverview.render().includes('坐席负荷与当前通话'));

for(const profile of ['super','admin','operator']){
  const x=setup(profile),ctx=x.ctx.AppState.get();
  // A seat belonging to the account in some other tenant/instance is not its
  // current seat, including the super administrator's built-in tenant.
  x.d.agents.forEach(a=>{if(a.accountId===ctx.accountId)a.accountId='';});
  const foreign=x.d.agents.find(a=>a.tenantId!==ctx.tenantId)||x.d.agents[0];foreign.accountId=ctx.accountId;foreign.tenantId='TEN-FOREIGN';
  assert(x.ctx.WorkbenchOverview.renderSeat().includes('尚未关联本租户坐席'));
  assert.equal(x.ctx.WorkbenchOverview.model(true).calls.length,0);assert.equal(x.ctx.WorkbenchOverview.model(true).pending.length,0);
  const count=x.events.length;x.ctx.WorkbenchOverview.open('calls','',true);assert.equal(x.events.length,count);
}

console.log('PASS VM: 运营/坐席工作台职责拆分、旧参数不切个人、个人指标与待联络独立下钻、联系弹窗复用、停用禁联系、各角色本人归属/租户实例隔离、运营只读；非浏览器或真实话务验收');
