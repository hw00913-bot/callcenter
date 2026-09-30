/* Navigation-mode simulations keep the supplier-selected caller unresolved. No network. */
'use strict';
const assert=require('node:assert/strict');
const {fixture,signedIn}=require('./verify-demo-fixtures.cjs');
const checks=[];
const clone=value=>JSON.parse(JSON.stringify(value));
function prepare(type='IVR 外呼',mode='navigation',account='ACC-ADMIN-018'){
  const tenantId=type==='预外呼'?'TEN-NISSAN-HQ':'TEN-NISSAN-SH';
  const c=fixture({session:signedIn(tenantId,account)}),d=c.CloudCallData;
  const task=d.tasks.find(row=>row.tenantId===tenantId&&row.callType===type&&(type==='预外呼'?row.status==='执行中':row.status==='待启动'));
  assert(task);Object.assign(task,{status:'执行中',providerStatusCode:1,stopNewDialing:false,resourcePause:null,alictiTaskControlPending:false});
  if(task.alictiMockTaskProperty)task.alictiMockTaskProperty.status=1;
  const savedGroup=d.instances.find(row=>row.enterpriseId===task.enterpriseId)?.callerNavigations?.[0]?.customerClidsGroup;
  assert(savedGroup,'enterprise should have a configured caller navigation');
  const catalog=c.AliCtiNumberPools.catalog(tenantId);
  assert(catalog.ok,catalog.message);assert(catalog.rows.length,'tenant should have a number pool');
  const pool=catalog.rows[0];
  const settings={callerMode:mode,callerNumberId:mode==='fixed'?task.callerNumberId:'',customerClidsGroup:mode==='navigation'?savedGroup:'',clidPoolList:mode==='navigation'?[{poolId:String(pool.id),name:pool.name,priority:1}]:[],customerTimeout:30};
  for(const target of [task,task.executionConfig,task.planSnapshot].filter(Boolean))Object.assign(target,clone(settings));
  if(mode==='navigation'){task.executionConfig.allowedCallerNumberIds=[];if(task.planSnapshot)task.planSnapshot.callerNumberIds=[];}
  const batches=JSON.parse(c.localStorage.getItem('customer-task-batches-v1'));
  const batch=batches.find(row=>row.rows.some(item=>item.taskId===task.taskId));assert(batch);
  const source=batch.rows.find(item=>item.taskId===task.taskId);assert(source);
  for(const b of batches)for(const row of b.rows)if(row.taskId===task.taskId&&row.followup==='待联系')row.followup='待继续跟进';
  const item={...clone(source),id:'QA-CALLER-NAV-'+type,ownerId:'',taskId:task.taskId,method:type,followup:'待联系',calls:[],history:[],activeCallId:''};
  batch.rows.push(item);task.total=Math.max(task.total,task.completed+1)+1;
  c.localStorage.setItem('customer-task-batches-v1',JSON.stringify(batches));
  c.CloudTaskWorkspace.openTask=()=>{};c.PlatformUI.openLayer=()=>{};c.PlatformUI.closeLayer=()=>{};
  const toasts=[];c.showToast=(message)=>toasts.push(message);
  return {c,d,task,batch,item,toasts,pool,savedGroup};
}
function resultOf(f){return f.d.calls.find(row=>row.taskId===f.task.taskId&&row.customerTaskItemId===f.item.id);}
function next(f,outcome='接通'){assert.equal(f.c.ScenarioDemo.runNext(f.task.taskId,outcome),true,f.toasts.join(';'));return resultOf(f);}
function setSeatList(f,cnos){for(const target of [f.task,f.task.executionConfig,f.task.planSnapshot].filter(Boolean))Object.assign(target,{callGroupType:1,cnos,agentGroup:'',outboundGroupId:'',outboundGroupSnapshot:null,targetSkillGroupId:'',skillGroupId:''});}
async function check(name,fn){await fn();checks.push(name);}
async function receivingFixture(){
  const f=prepare('预外呼','navigation','ACC-OPS-108'),c=f.c,timers=new Map();let id=0;
  c.document.body.append=()=>{};
  c.navigator.locks={request:(_name,_opts,fn)=>Promise.resolve(fn({name:'local-seat-lock'}))};
  c.setTimeout=(fn,ms)=>{timers.set(++id,{fn,ms});return id;};c.clearTimeout=id=>timers.delete(id);
  c.AgentWorkbench.renderSeat();
  c.AgentWorkbench.signIn({loginStatus:1,pauseDescription:'',workingMode:'0'});
  for(let i=0;i<20&&!c.AgentWorkbench.receivingContext().online;i++){
    await Promise.resolve();await Promise.resolve();
    const timer=[...timers].find(([,value])=>value.ms===220);if(timer){timers.delete(timer[0]);timer[1].fn();}
  }
  assert.equal(c.AgentWorkbench.receivingContext().online,true,'seat should be online');
  f.agent=c.AgentWorkbench.myAgent();setSeatList(f,f.agent.cno);
  f.offer={kind:'predictive',tenantId:f.task.tenantId,enterpriseId:f.task.enterpriseId,accountId:'ACC-OPS-108',cno:f.agent.cno,contactId:'NAV-RECEIVE',callId:'NAV-RECEIVE',customerNumber:f.item.phone,hotline:'',callerNumberId:'',customerName:f.item.name,taskId:f.task.taskId,customerTaskItemId:f.item.id,customerBatchId:f.batch.id,mock:true,simulation:true};
  return f;
}
(async()=>{
  await check('自动外呼导航可模拟接通且不拿号码池名称冒充外显号码',()=>{const f=prepare(),call=next(f);assert(call);assert.equal(call.caller,'');assert.equal(call.callerNumberId,'');assert.equal(call.callerSelectionSource,'LOCAL_SIMULATION_UNRESOLVED');assert.equal(call.simulation,true);assert.equal(call.callSource,'LOCAL_TASK_SIMULATION');assert.equal(f.c.CallState.view(call).answered,true);assert(!JSON.stringify(call).includes(f.pool.name));});
  await check('预外呼导航按保存的坐席工号模拟接听，无技能也能执行',()=>{const f=prepare('预外呼');const agent=f.d.agents.find(a=>a.tenantId===f.task.tenantId&&a.enterpriseId===f.task.enterpriseId&&a.lifecycleStatus==='已启用'&&a.syncStatus==='同步成功');assert(agent);Object.assign(agent,{currentCall:false,agentStatus:'空闲',acceptNewTasks:true,callEnabled:true});setSeatList(f,agent.cno);const call=next(f);assert.equal(call.contactCenterIdentityId,agent.contactCenterIdentityId);assert.equal(call.caller,'');assert.equal(call.callerNumberId,'');});
  await check('预外呼导航按已保存外呼组成员选择有效空闲坐席',()=>{const f=prepare('预外呼'),agent=f.d.agents.find(a=>a.tenantId===f.task.tenantId&&a.enterpriseId===f.task.enterpriseId&&a.lifecycleStatus==='已启用'&&a.syncStatus==='同步成功');assert(agent);Object.assign(agent,{currentCall:false,agentStatus:'空闲',acceptNewTasks:true,callEnabled:true});const created=f.c.OutboundGroups.create({name:'导航模拟外呼组',gno:'NAV01',tenantId:f.task.tenantId,memberIdentityIds:[agent.contactCenterIdentityId]},f.c.OutboundGroups.contextKey(),f.c.OutboundGroups.revision());assert(created.ok,created.message);const group=f.c.OutboundGroups.forTask(created.group.outboundGroupId,f.task);assert(group);for(const target of [f.task,f.task.executionConfig,f.task.planSnapshot].filter(Boolean))Object.assign(target,{callGroupType:2,cnos:'',agentGroup:group.gno,outboundGroupId:group.outboundGroupId,outboundGroupSnapshot:clone(group),targetSkillGroupId:'',skillGroupId:''});const call=next(f);assert.equal(call.contactCenterIdentityId,agent.contactCenterIdentityId);assert.equal(call.caller,'');});
  await check('导航结果未知和未接通不依赖固定号码',()=>{for(const result of ['未接通','待确认']){const f=prepare();const call=next(f,result);assert.equal(call.caller,'');assert.equal(call.callerNumberId,'');assert.equal(call.result,result);}});
  await check('固定号码模拟继续记录原号码和号码ID',()=>{const f=prepare('IVR 外呼','fixed'),number=f.d.phoneNumbers.find(row=>row.numberId===f.task.callerNumberId);assert(number);const call=next(f);assert.equal(call.caller,number.number);assert.equal(call.callerNumberId,number.numberId);assert.equal(call.callerSelectionSource,undefined);});
  await check('导航缺失标识不能生成模拟结果',()=>{const f=prepare();for(const target of [f.task,f.task.executionConfig,f.task.planSnapshot].filter(Boolean))target.customerClidsGroup='';const before=f.c.localStorage.getItem('local-task-result-journal-v1');assert.equal(f.c.ScenarioDemo.runNext(f.task.taskId,'未接通'),false);assert.equal(f.c.localStorage.getItem('local-task-result-journal-v1'),before);});
  await check('显式空坐席和其他租户坐席不会回退到技能成员',()=>{for(const foreign of [false,true]){const f=prepare('预外呼');const other=f.d.agents.find(a=>a.tenantId!==f.task.tenantId&&a.cno);setSeatList(f,foreign?other.cno:'');f.c.CloudTaskWorkspace.simulationResourceError=()=>'';const before=f.c.localStorage.getItem('local-task-result-journal-v1');assert.equal(f.c.ScenarioDemo.runNext(f.task.taskId,'接通'),false);assert.equal(f.c.localStorage.getItem('local-task-result-journal-v1'),before);}});
  await check('账号移除已选导航保留任务历史快照，但阻止继续呼叫',()=>{const f=prepare();f.d.instances.find(row=>row.enterpriseId===f.task.enterpriseId).callerNavigations=[];assert.equal(f.c.ScenarioDemo.runNext(f.task.taskId,'接通'),false);assert.equal(f.c.AliCtiFields.taskCallerSettings(f.task).customerClidsGroup,f.savedGroup);assert.equal(resultOf(f),undefined);});
  await check('导航模拟仍受当前租户和任务运行状态限制',()=>{for(const status of ['已暂停','已终止']){const f=prepare();f.task.status=status;assert.equal(f.c.ScenarioDemo.runNext(f.task.taskId,'接通'),false);}const f=prepare();f.task.tenantId='OTHER';assert.equal(f.c.ScenarioDemo.runNext(f.task.taskId,'未接通'),false);});
  await check('预外呼来电按指定坐席接听并保留未知外显号码',async()=>{const f=await receivingFixture();assert.equal(f.c.AgentWorkbench.receiveOffer(f.offer),true,f.toasts.join(';'));const call=f.c.AgentWorkbench.receivingContext().call;assert.equal(call.caller,'');assert.equal(call.callerNumberId,'');assert.equal(call.taskId,f.task.taskId);assert.equal(call.customerTaskItemId,f.item.id);});
  await check('指定其他工号的来电不会因为同技能而接收',async()=>{const f=await receivingFixture();setSeatList(f,'UNASSIGNED-CNO');assert.equal(f.c.AgentWorkbench.receiveOffer(f.offer),false);assert.equal(f.c.AgentWorkbench.receivingContext().call,null);});
  await check('来电演示导航任务可投递且不填造号码',async()=>{const f=await receivingFixture();f.c.ScenarioDemo.openReceivingDemo();assert.equal(f.c.ScenarioDemo.triggerReceiving('predictive','success'),true,f.toasts.join(';'));const call=f.c.AgentWorkbench.receivingContext().call;assert.equal(call.caller,'');assert.equal(call.callerNumberId,'');assert.equal(call.taskId,f.task.taskId);});
  console.log(JSON.stringify({result:'pass',count:checks.length,checks,notLiveIntegration:true},null,2));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
