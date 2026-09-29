/* Local task lifecycle contract. Synthetic rows and seats; no supplier network. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const tasks=[],saved=[],audits=[];
const state={activeDomain:'CLOUD_CONTACT_CENTER',accountId:'A',tenantId:'TEN-A',enterpriseId:'7522240'};
const ctx={
  Date,JSON,Object,Number,CloudCallData:{tasks,predictiveTasks:[],ivrTasks:[],phoneNumbers:[]},
  AliCtiAdapter:{},AliCtiDemo:{resourceId:(_kind,row)=>row.providerTaskId,taskControlScenario:'success',taskControlSeed:()=>null},
  AliCtiFields:{code:value=>Number(value),integer:value=>Number(value),taskStatus:{0:'初始',1:'运行',2:'暂停',3:'结束'},authFields:()=>({pending:[],fields:{enterpriseId:7522240}})},
  AppState:{get:()=>state,scoped:rows=>rows.filter(row=>row.tenantId===state.tenantId&&row.enterpriseId===state.enterpriseId),canAction:()=>true,effectiveAccess:()=>({roleCode:'ADMIN'})},
  CloudTaskWorkspace:{canControlTask:row=>!row.displayOnly,isLocalSimulationTask:row=>row.localPrototypeTask===true,simulationResourceError:()=>'',saveDemoTask:row=>{saved.push(row.taskId);return true;}},
  CloudCallRuntime:{addAudit:(...args)=>audits.push(args)},
  PlatformUI:{escape:value=>String(value),confirm:()=>{throw Error('Test actions must be explicitly confirmed');}},
  RouteRuntime:{refreshCurrent:()=>{}},showToast:()=>{},navigateTo:()=>{}
};
ctx.window=ctx;
vm.createContext(ctx);
const file=path.resolve(__dirname,'../js/components/alicti-task-control.js');
vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const api=ctx.AliCtiAdapter;
let serial=0;
function task(overrides={}){
  const id=++serial,row={taskId:'AVAIL-'+id,tenantId:'TEN-A',enterpriseId:'7522240',callType:'预外呼',providerType:1,
    providerTaskId:9000+id,status:'执行中',providerStatusCode:1,providerStatus:'运行（模拟）',
    alictiMockTaskProperty:{id:9000+id,enterpriseId:7522240,status:1},
    simulation:true,localPrototypeTask:true,total:5,completed:0,autoStart:1,minAvailableAgentCount:3,
    stopNewDialing:false,dispatchHistory:[],...overrides};
  tasks.push(row);return row;
}
function unchanged(row,count,reason){const before=JSON.stringify(row),saves=saved.length,result=api.reconcileAvailability(row,count);assert.equal(result.changed,false);assert.equal(result.reason,reason);assert.equal(JSON.stringify(row),before);assert.equal(saved.length,saves);}

const scheduled=task();
unchanged(scheduled,3,'no-transition');
unchanged(scheduled,-1,'invalid-available-count');
unchanged(scheduled,1.5,'invalid-available-count');
assert.equal(api.reconcileAvailability(scheduled,2).action,'pause');
assert.equal(scheduled.status,'已暂停');assert.equal(scheduled.providerStatusCode,2);assert.equal(scheduled.alictiMockTaskProperty.status,2);
assert.equal(scheduled.stopNewDialing,true);assert.equal(scheduled.availabilityPause.reason,'AVAILABLE_SEATS_BELOW_MIN');
assert.equal(scheduled.availabilityPause.threshold,3);assert.equal(scheduled.availabilityPause.mock,true);
assert.equal(scheduled.dispatchHistory.at(-1).action,'座席不足自动暂停（本地演示）');
unchanged(scheduled,2,'no-transition');
assert.equal(api.reconcileAvailability(scheduled,3).action,'resume');
assert.equal(scheduled.status,'执行中');assert.equal(scheduled.providerStatusCode,1);assert.equal(scheduled.stopNewDialing,false);
assert.equal(scheduled.availabilityPause,undefined);
assert.equal(api.lastRequest,undefined,'Availability simulation must not submit supplier operations');

const manualStart=task({autoStart:0});
assert.equal(api.reconcileAvailability(manualStart,2).action,'pause');
unchanged(manualStart,3,'no-transition');
assert.equal(manualStart.status,'已暂停','Auto-resume requires scheduled autoStart=1');

const manualPause=task();
assert.equal(api.controlTask(manualPause,'pause',true).ok,true);
assert.equal(manualPause.availabilityPause,undefined);
unchanged(manualPause,3,'no-transition');

const numberPause=task();
api.reconcileAvailability(numberPause,2);
numberPause.resourcePause={numberIds:['N1'],reason:'号码停用'};
unchanged(numberPause,3,'task-held-or-ended');
const numberHeldRunning=task({resourcePause:{numberIds:['N1']},stopNewDialing:true});
unchanged(numberHeldRunning,2,'task-held-or-ended');

const terminal=task({status:'已终止',providerStatusCode:3,alictiMockTaskProperty:{id:9000+serial+1,status:3},availabilityPause:{reason:'AVAILABLE_SEATS_BELOW_MIN',mock:true}});
unchanged(terminal,3,'task-held-or-ended');
const ivr=task({callType:'IVR 外呼',providerType:2});
unchanged(ivr,2,'not-local-predictive-task');
const foreign=task({tenantId:'TEN-B'});
unchanged(foreign,2,'not-local-predictive-task');
const pending=task({alictiTaskControlPending:true});
unchanged(pending,2,'task-held-or-ended');
const invalidMinimum=task({minAvailableAgentCount:11});
unchanged(invalidMinimum,2,'invalid-minimum');
const absentMinimum=task({minAvailableAgentCount:null});
unchanged(absentMinimum,2,'invalid-minimum');

const terminatedAfterHold=task();
api.reconcileAvailability(terminatedAfterHold,2);
assert.equal(api.controlTask(terminatedAfterHold,'terminate',true).ok,true);
assert.equal(terminatedAfterHold.status,'已终止');assert.equal(terminatedAfterHold.availabilityPause,undefined);
unchanged(terminatedAfterHold,3,'task-held-or-ended');

const handResumed=task();
api.reconcileAvailability(handResumed,2);
assert.equal(api.controlTask(handResumed,'resume',true).ok,true);
assert.equal(handResumed.status,'执行中');assert.equal(handResumed.availabilityPause,undefined);

const heldOnSave=task();
const save=ctx.CloudTaskWorkspace.saveDemoTask;
ctx.CloudTaskWorkspace.saveDemoTask=()=>false;
unchanged(heldOnSave,2,'save-failed');
ctx.CloudTaskWorkspace.saveDemoTask=save;
assert(audits.length>=4);
console.log('PASS local availability lifecycle: threshold pause, scheduled-only resume, manual/resource/ended/IVR guards, persistence rollback, mock-only control.');
