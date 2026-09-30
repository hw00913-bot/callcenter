/* Synthetic task-control boundary tests. No network or supplier credentials. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),checks=[];
const check=(name,fn)=>{fn();checks.push(name);};
function fixture(){
  const store=new Map(),state={activeDomain:'CLOUD_CONTACT_CENTER',accountId:'A',tenantId:'T',enterpriseId:'7522240'};
  const ctx={URL,structuredClone,console,sessionStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},document:{getElementById:()=>null}};
  ctx.window=ctx;ctx.CloudCallData={tasks:[],phoneNumbers:[{numberId:'N',enterpriseId:'7522240',businessStatus:'正常'}]};
  ctx.AliCtiAdapter={};ctx.permission=true;ctx.role='ADMIN';ctx.readiness='';ctx.scope=true;ctx.saved=[];ctx.audits=[];ctx.toasts=[];
  ctx.AppState={get:()=>state,scoped:rows=>ctx.scope?rows:[],canAction:()=>ctx.permission,effectiveAccess:()=>({roleCode:ctx.role})};
  ctx.CloudTaskWorkspace={canControlTask:r=>!!r&&!r.displayOnly&&r.enterpriseId===state.enterpriseId&&r.tenantId===state.tenantId&&state.activeDomain==='CLOUD_CONTACT_CENTER',simulationResourceError:(r,readiness)=>{assert.strictEqual(readiness,true);return ctx.readiness;},saveDemoTask:r=>ctx.saved.push(structuredClone(r))};
  ctx.PlatformUI={confirm:options=>(ctx.dialog=options),escape:String};ctx.CloudCallRuntime={addAudit:(...a)=>ctx.audits.push(a)};ctx.navigateTo=()=>{};ctx.showToast=(...v)=>ctx.toasts.push(v);
  vm.createContext(ctx);
  for(const file of ['alicti-fields','alicti-demo','alicti-task-control'])vm.runInContext(fs.readFileSync(path.join(root,'js/components/'+file+'.js'),'utf8'),ctx);
  ctx.make=(status='已暂停',code=2)=>{
    const row={taskId:'T1',tenantId:'T',enterpriseId:'7522240',status,providerStatusCode:code,providerTaskId:321,total:20,completed:8,connected:5,round:2,attemptCount:6,startedAt:'2026-09-01 09:00:00',campaignId:'CAM-ORIGINAL',planSnapshot:{original:true},simulation:true,stopNewDialing:code!==1};
    row.alictiMockTaskProperty={id:321,status:code,pauseDuration:99};ctx.CloudCallData.tasks=[row];return row;
  };
  ctx.order=()=>ctx.AliCtiAdapter.taskControlTrace.map(r=>r.endpoint).join(',');
  ctx.run=(row,action='resume')=>ctx.AliCtiAdapter.controlTask(row,action,true);
  return ctx;
}
// Load the actual next-customer result entry point with an empty local journal.
// Existing ringing/connected records stay independent of task control responses.
function wireResultGenerator(c,r){
  r.inflight=2;r.activeCallIds=['CALL-RINGING','CALL-CONNECTED'];r.hasNextAttempt=true;
  c.CloudCallData.calls=[
    {callId:'CALL-RINGING',taskId:r.taskId,simulation:true,state:'振铃中',ringingAt:'2026-09-15 10:00:00'},
    {callId:'CALL-CONNECTED',taskId:r.taskId,simulation:true,state:'通话中',answeredAt:'2026-09-15 09:59:00'},
    {callId:'CALL-HISTORY',taskId:r.taskId,simulation:true,state:'已结束',result:'未接通',sipCause:710,endedAt:'2026-09-15 09:58:00'}
  ];
  c.CloudCallData.agents=[{agentId:'AGENT-1',status:'通话中',activeCallId:'CALL-CONNECTED'}];
  c.CloudCallData.demoSwitchEnabled=true;c.CloudCallData.tenants=[{tenantId:'T',enterpriseId:'7522240',status:'启用'}];
  c.AppState.effectiveAccess=()=>({valid:true,roleCode:'ADMIN'});c.AppState.authorizeObject=()=>true;
  c.ScenarioDemoData={tenantId:'T',enterpriseId:'7522240',tasks:[]};c.resultWrites=0;c.resultCustomerReads=0;
  c.localStorage={getItem:()=>null,setItem:()=>{c.resultWrites++;}};
  c.CustomerTasks={taskCustomers:()=>{c.resultCustomerReads++;return [];}};
  c.CloudTaskWorkspace.isLocalSimulationTask=()=>false;
  vm.runInContext(fs.readFileSync(path.join(root,'js/pages/scenario-demo.js'),'utf8'),c);
  c.CloudTaskWorkspace.isLocalSimulationTask=t=>t===r;
  c.callEvidence=()=>JSON.stringify([c.CloudCallData.calls,c.CloudCallData.agents,r.activeCallIds,r.inflight,r.completed,r.connected,r.round,r.attemptCount,r.startedAt,r.campaignId,r.planSnapshot]);
}
check('继续严格按查询暂停→start→再次查询执行，原进度与启动时间不重置',()=>{const c=fixture(),r=c.make(),snapshot=JSON.stringify([r.completed,r.connected,r.round,r.attemptCount,r.startedAt,r.campaignId,r.planSnapshot]);const result=c.run(r);assert(result.ok);assert.equal(c.order(),'task/get,task/start,task/get');assert.equal(r.status,'执行中');assert.equal(JSON.stringify([r.completed,r.connected,r.round,r.attemptCount,r.startedAt,r.campaignId,r.planSnapshot]),snapshot);assert.equal(r.alictiControlResponse.data.taskProperty.pauseDuration,99);assert(!('pauseDurationMinutes' in r));});
check('暂停不传任何时长，旧确认输入被忽略',()=>{const c=fixture(),r=c.make('执行中',1);const result=c.AliCtiAdapter.controlTask(r,'pause',{duration:'5',pauseDuration:300});assert(result.ok);assert.equal(c.order(),'task/get,task/pause,task/get');for(const step of c.AliCtiAdapter.taskControlTrace)assert(!('pauseDuration' in step.fields));assert.equal(r.status,'已暂停');assert.equal(r.alictiControlResponse.data.taskProperty.pauseDuration,99);assert(!('alictiPauseMapping' in r));});
check('暂停确认不展示时长输入，情景可由折叠区选择',()=>{const c=fixture(),r=c.make('执行中',1);c.AliCtiAdapter.controlTask(r,'pause');assert(!/pauseDuration|demoPauseDuration|暂停时长|分钟/.test(c.dialog.body));assert(c.dialog.body.includes('taskControlScenario'));assert.equal(c.AliCtiAdapter.taskControlTrace.length,0);});
check('操作前查询失败、未知、缺ID、ID冲突均不写入',()=>{for(const scenario of ['before-failure','before-unknown','before-missing-id','before-mismatch']){const c=fixture(),r=c.make();c.AliCtiDemo.taskControlScenario=scenario;assert(!c.run(r).ok);assert.equal(c.order(),'task/get');assert.equal(c.AliCtiAdapter.lastRequest,null);assert.notEqual(r.status,'执行中');assert(r.alictiTaskControlPending);}});
check('继续只接受远端暂停，初始运行结束均不调用start',()=>{for(const code of [0,1,3]){const c=fixture(),r=c.make();c.AliCtiDemo.taskControlScenario='before-status-'+code;assert(!c.run(r).ok);assert.equal(c.order(),'task/get');assert.equal(c.AliCtiAdapter.lastRequest,null);assert.equal(r.providerStatusCode,code);}});
check('本地初始运行完成终止状态直接继续均拒绝',()=>{for(const status of ['待启动','执行中','已完成','已终止','异常']){const c=fixture(),r=c.make(status,2);assert(!c.run(r).ok);assert.equal(c.order(),'');}});
check('写入失败不改成运行，未知写入继续查证且仍不猜成功',()=>{for(const scenario of ['write-failure','write-unknown']){const c=fixture(),r=c.make();c.AliCtiDemo.taskControlScenario=scenario;const result=c.run(r);assert(!result.ok);assert.equal(c.order(),scenario==='write-failure'?'task/get,task/start':'task/get,task/start,task/get');assert.equal(r.status,'已暂停');assert.equal(r.stopNewDialing,true);}});
check('写入受理但后查仍暂停或未知时不能显示继续成功',()=>{for(const scenario of ['after-paused','after-unknown','after-failure']){const c=fixture(),r=c.make();c.AliCtiDemo.taskControlScenario=scenario;const result=c.run(r);assert(!result.ok);assert.equal(c.order(),'task/get,task/start,task/get');assert.equal(r.status,'已暂停');assert.equal(r.stopNewDialing,true);}});
check('后查已经结束显示结束并禁止再次开启',()=>{const c=fixture(),r=c.make();c.AliCtiDemo.taskControlScenario='after-ended';assert(!c.run(r).ok);assert.equal(r.status,'已终止');assert.equal(r.providerStatusCode,3);c.AliCtiDemo.taskControlScenario='success';assert(!c.run(r,'start').ok);assert.equal(c.order(),'');});
check('正常结束可执行，结束以后start和resume全部拒绝',()=>{const c=fixture(),r=c.make('执行中',1);assert(c.run(r,'terminate').ok);assert.equal(c.order(),'task/get,task/stop,task/get');assert.equal(r.status,'已终止');for(const action of ['start','resume']){assert(!c.run(r,action).ok);assert.equal(c.order(),'');}});
check('两类任务查询确认结束后禁止下一位和后续重呼，保留振铃接通与历史记录',()=>{
  for(const callType of ['预外呼','IVR 外呼']){
    const c=fixture(),r=c.make('执行中',1);r.callType=callType;wireResultGenerator(c,r);const before=c.callEvidence();
    assert(c.run(r,'terminate').ok);assert.equal(c.order(),'task/get,task/stop,task/get');assert.equal(r.providerStatusCode,3);
    assert.equal(r.stopNewDialing,true);assert.equal(r.hasNextAttempt,false);
    for(const result of ['接通','未接通','待确认'])assert.strictEqual(c.ScenarioDemo.runNext(r.taskId,result),false);
    assert.equal(c.resultWrites,0);assert.equal(c.resultCustomerReads,0);assert.equal(c.callEvidence(),before);
    for(const action of ['start','resume']){assert(!c.run(r,action).ok);assert.equal(c.order(),'');}
  }
});
check('结束受理但后查未知时不伪造结束或通话终态，待核对期间阻止新增结果',()=>{
  const c=fixture(),r=c.make('执行中',1);r.callType='预外呼';wireResultGenerator(c,r);const before=c.callEvidence();
  c.AliCtiDemo.taskControlScenario='after-unknown';const result=c.run(r,'terminate');
  assert(!result.ok);assert(result.pending);assert.equal(c.order(),'task/get,task/stop,task/get');
  assert.equal(r.status,'执行中');assert.equal(r.providerStatusCode,1);assert(r.alictiTaskControlPending);assert(r.stopNewDialing);
  assert.equal(r.hasNextAttempt,true);assert.strictEqual(c.ScenarioDemo.runNext(r.taskId,'接通'),false);
  assert.equal(c.resultWrites,0);assert.equal(c.resultCustomerReads,0);assert.equal(c.callEvidence(),before);
});
check('过期待启动页面不能重新开启远端已结束或已暂停任务',()=>{for(const status of [2,3]){const c=fixture(),r=c.make('待启动',0);r.alictiMockTaskProperty.status=status;assert(!c.run(r,'start').ok);assert.equal(c.order(),'task/get');assert.equal(r.providerStatusCode,status);}});
check('初次启动保留读取结果，不复用继续跳过前置查询',()=>{const c=fixture(),r=c.make('待启动',0);r.startedAt='';assert(c.run(r,'start').ok);assert.equal(c.order(),'task/get,task/start,task/get');assert(r.startedAt);assert.equal(r.status,'执行中');});
check('新建演示任务使用独立初始响应，隔离标记不生成远端暂停',()=>{const c=fixture(),r=c.make('待启动',undefined);delete r.alictiMockTaskProperty;delete r.providerStatusCode;c.AliCtiDemo.taskCreated(r);assert.equal(r.alictiMockTaskProperty.status,0);r.status='已暂停';r.resourcePause={numberIds:['N']};assert(!c.run(r).ok);assert.equal(c.order(),'task/get');assert.equal(r.providerStatusCode,0);});
check('未知供应商状态的本地暂停不能凭显示文字继续',()=>{const c=fixture(),r=c.make();delete r.providerStatusCode;delete r.alictiMockTaskProperty;assert(!c.run(r).ok);assert.equal(c.order(),'task/get');assert(r.alictiTaskControlPending);});
check('任务身份及状态解析不接受未知result、空值、数字布尔和跨账号数据',()=>{const c=fixture(),read=c.AliCtiAdapter.readTaskControlResult;for(const result of [undefined,null,'',-1,99,true])assert(!read({result,data:{taskProperty:{id:321,status:2}}},321,7522240).known);for(const status of [undefined,null,'',99,true])assert(!read({result:0,data:{taskProperty:{id:321,status}}},321,7522240).known);assert(!read({result:0,data:{taskProperty:{id:321,status:2,enterpriseId:999}}},321,7522240).known);assert(read({result:'0',data:{taskProperty:{id:'321',status:'2'}}},321,7522240).known);});
check('权限、显示样例、跨范围、资源与场景准备检查在写前阻断',()=>{for(const change of [c=>c.permission=false,c=>c.scope=false,c=>c.readiness='场景未就绪',c=>c.CloudCallData.tasks[0].displayOnly=true,c=>c.AppState.get().enterpriseId='999']){const c=fixture(),r=c.make();change(c);assert(!c.run(r).ok);assert.equal(c.order(),'');}});
check('空名单继续或启动均阻断',()=>{for(const action of ['start','resume']){const c=fixture(),r=c.make(action==='start'?'待启动':'已暂停',action==='start'?0:2);r.total=0;assert(!c.run(r,action).ok);assert.equal(c.order(),'');}});
check('号码隔离恢复权限与全号码已恢复条件不能被继续绕过',()=>{for(const blocked of ['role','number','missing']){const c=fixture(),r=c.make();r.resourcePause={numberIds:['N']};if(blocked==='role')c.role='OPERATOR';if(blocked==='number')c.CloudCallData.phoneNumbers[0].businessStatus='已隔离';if(blocked==='missing')r.resourcePause.numberIds=['missing'];assert(!c.run(r).ok);assert.equal(c.order(),'');assert(r.resourcePause);}});
check('有权管理员仅在再次查到运行后移除号码隔离标记',()=>{const c=fixture(),r=c.make();r.resourcePause={numberIds:['N']};c.AliCtiDemo.taskControlScenario='after-paused';assert(!c.run(r).ok);assert(r.resourcePause);c.AliCtiDemo.taskControlScenario='success';assert(c.run(r).ok);assert(!r.resourcePause);});
check('确认窗口打开后权限、资源、范围及供应商ID变化均重新检查',()=>{for(const change of [(c)=>c.permission=false,(c)=>c.readiness='资源失效',(c)=>c.AppState.get().accountId='OTHER',(c,r)=>r.providerTaskId=999,(c,r)=>r.status='已终止']){const c=fixture(),r=c.make();c.AliCtiAdapter.controlTask(r,'resume');change(c,r);c.dialog.onConfirm();assert.equal(c.order(),'');}});
check('查询响应读取后至实际写入前再次检查权限',()=>{const c=fixture(),r=c.make();Object.defineProperty(r.alictiMockTaskProperty,'status',{enumerable:true,get(){c.permission=false;return 2;}});assert(!c.run(r).ok);assert.equal(c.order(),'task/get');assert.equal(c.AliCtiAdapter.lastRequest,null);});
check('查询响应读取后至实际写入前再次检查资源',()=>{const c=fixture(),r=c.make();Object.defineProperty(r.alictiMockTaskProperty,'status',{enumerable:true,get(){c.readiness='号码刚被隔离';return 2;}});assert(!c.run(r).ok);assert.equal(c.order(),'task/get');assert.equal(c.AliCtiAdapter.lastRequest,null);});
check('原有四个任务使用独立供应商fixture且状态不取自本地显示',()=>{
  for(const [taskId,tenantId,callType,status] of [['TASK-PRED-0901','TEN-NISSAN-HQ','预外呼',1],['TASK-PRED-0830','TEN-NISSAN-SH','预外呼',2],['TASK-IVR-0902','TEN-NISSAN-HQ','IVR 外呼',1],['TASK-IVR-0831','TEN-NISSAN-HQ','IVR 外呼',3]]){
    const c=fixture(),r=c.make(status===1?'执行中':status===2?'已暂停':'待启动');
    Object.assign(r,{taskId,tenantId,callType});delete r.providerStatusCode;delete r.alictiMockTaskProperty;c.AppState.get().tenantId=tenantId;
    const seed=c.AliCtiDemo.taskControlSeed(r);assert.equal(seed.status,status);assert.equal(seed.id,c.AliCtiDemo.resourceId('task',r));assert.equal(c.AliCtiDemo.taskControlSeed({...r,status:'任意本地文字'}).status,status);
    const result=c.run(r,status===1?'pause':status===2?'resume':'start');assert.equal(c.AliCtiAdapter.taskControlTrace[0].response.data.taskProperty.status,status);
    assert.equal(result.ok,status!==3);if(status===3)assert.equal(c.order(),'task/get');
  }
});
check('种子只匹配固定账号租户和任务类型，未知任务仍无法凭暂停显示继续',()=>{const c=fixture(),r=c.make();delete r.providerStatusCode;delete r.alictiMockTaskProperty;assert.equal(c.AliCtiDemo.taskControlSeed(r),null);assert(!c.run(r).ok);const seed={taskId:'TASK-IVR-0902',tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240',callType:'IVR 外呼'};for(const patch of [{enterpriseId:'999'},{tenantId:'OTHER'},{callType:'预外呼'}])assert.equal(c.AliCtiDemo.taskControlSeed({...seed,...patch}),null);});
check('持久化控制响应或新供应商fixture不会被原始种子覆盖',()=>{const c=fixture(),base={taskId:'TASK-IVR-0902',tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240',callType:'IVR 外呼'};for(const patch of [{alictiMockTaskProperty:{id:123,status:3}},{alictiMockTaskProperty:null},{alictiControlResponse:{result:0,data:{taskProperty:{id:123,status:2}}}},{alictiControlResponse:null},{providerStatusCode:3},{providerStatusCode:null}])assert.equal(c.AliCtiDemo.taskControlSeed({...base,...patch}),null);});
check('真实saveDemoTask边界仅确认首次启动可冻结方案，继续与未知操作保留历史快照ID',()=>{
  function wire(c){
    const source=fs.readFileSync(path.join(root,'js/pages/cloud-task-workspace.js'),'utf8'),start=source.indexOf('    saveDemoTask(row,'),end=source.indexOf('    simulationResourceError(',start);
    const method=source.slice(start,end).trim().replace(/,$/,'');
    c.canAccessObject=()=>true;c.plan=()=>({name:'示例方案'});c.nowText=()=>'';c.frozen=0;c.freezePlan=r=>{c.frozen++;r.planSnapshotId='NEW-SNAPSHOT';r.planSnapshot={new:true};};c.persistCreatedTask=r=>c.saved.push(structuredClone(r));
    c.CloudTaskWorkspace.saveDemoTask=vm.runInContext('({'+method+'}).saveDemoTask',c);
  }
  for(const scenario of ['success','after-unknown','write-failure']){
    const c=fixture(),r=c.make();wire(c);delete r.planSnapshot;r.planSnapshotId='SNAP-HISTORICAL';c.AliCtiDemo.taskControlScenario=scenario;c.run(r);
    assert.equal(r.planSnapshotId,'SNAP-HISTORICAL');assert(!r.planSnapshot);assert.equal(c.frozen,0);
  }
  for(const scenario of ['success','after-unknown','write-failure']){
    const c=fixture(),r=c.make('待启动',0);wire(c);delete r.planSnapshot;r.planSnapshotId='';r.startedAt='';r.campaignId='';c.AliCtiDemo.taskControlScenario=scenario;c.run(r,'start');
    assert.equal(c.frozen,scenario==='success'?1:0);
  }
  const c=fixture(),r=c.make('执行中',1);wire(c);delete r.planSnapshot;r.planSnapshotId='SNAP-HISTORICAL';c.CloudTaskWorkspace.saveDemoTask(r);assert.equal(c.frozen,0);assert.equal(r.planSnapshotId,'SNAP-HISTORICAL');
});
check('工作台保留唯一控制入口且号码隔离不写供应商暂停状态',()=>{const source=fs.readFileSync(path.join(root,'js/pages/cloud-task-workspace.js'),'utf8');const control=source.slice(source.indexOf('  function controlTask('),source.indexOf('  function canDeleteTask('));assert(control.includes('AliCtiAdapter?.controlTask'));assert(!/row\.status\s*=/.test(control));const hold=source.slice(source.indexOf('  function pauseForNumber('),source.indexOf('  function controlTask('));assert(!/row\.status\s*=/.test(hold));assert(hold.includes('row.stopNewDialing = true'));});
check('适配器没有旧继续拦截和待确认按钮重写',()=>{const source=fs.readFileSync(path.join(root,'js/components/alicti-adapter.js'),'utf8');assert(!source.includes('originalControl'));assert(!source.includes("if(action==='resume')"));assert(!source.includes('demoPauseDuration'));});
console.log(JSON.stringify({result:'pass',count:checks.length,checks},null,2));
