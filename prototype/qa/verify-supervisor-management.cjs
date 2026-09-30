/** Supervisor controls against an independent local supplier fixture. Never calls a real SDK. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.join(__dirname,'..'),checks=[],plain=value=>JSON.parse(JSON.stringify(value));
function storage(){const rows=new Map();return {getItem:key=>rows.get(key)??null,setItem:(key,value)=>rows.set(key,String(value)),removeItem:key=>rows.delete(key)};}
function setup({fixturePatch=null,dataPatch=null,local=storage(),sampleEvents=false}={}){
 const state={accountId:'ACC-ADMIN-018',sessionId:'SUPERVISOR-CONTROL-QA',enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',activeDomain:'CLOUD_CONTACT_CENTER'};
 const account={accountId:state.accountId,status:'启用',name:'总部管理员'},access={...state,valid:true,roleCode:'ADMIN'},work={phase:'idle',busy:false,online:false};
 const seat=(cno,tenantId='TEN-NISSAN-HQ',accountId='ACCOUNT-'+cno)=>({contactCenterIdentityId:'CONTROL-QA-'+cno,agentRecordId:'CONTROL-QA-'+cno,accountId,enterpriseId:tenantId==='TEN-NISSAN-SH'?'7522241':'7522240',tenantId,cno,userName:'坐席'+cno,lifecycleStatus:'已启用',agentStatus:'离线',syncStatus:'同步成功',callEnabled:true,acceptNewTasks:true});
 const agent={...seat('9001','TEN-NISSAN-HQ',account.accountId),contactCenterIdentityId:'DEMO-TENANT-SUPERVISOR-HQ-9001',agentRecordId:'DEMO-TENANT-SUPERVISOR-HQ-9001'};
 const data={agents:[agent,seat('1201'),seat('2103'),seat('0012'),seat('2201','TEN-NISSAN-SH')],accounts:[account],memberships:[{membershipId:'QA-ADMIN',accountId:account.accountId,tenantId:state.tenantId,roleCode:'ADMIN',status:'启用'}],tenants:['TEN-NISSAN-HQ','TEN-NISSAN-SH'].map(tenantId=>({tenantId,enterpriseId:tenantId==='TEN-NISSAN-SH'?'7522241':'7522240',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}))};
 if(dataPatch)dataPatch(data);
 const callbacks=[],ctx={console,Date,Map,Set,Number,Object,Array,JSON,structuredClone,localStorage:local,CloudCallData:data,
  AppState:{get:()=>state,account:()=>account,effectiveAccess:()=>access,isReady:()=>true,hasCapability:()=>true,authorizeObject:(_,row)=>row.enterpriseId===state.enterpriseId&&row.tenantId===state.tenantId},AgentWorkbench:{current:()=>work},AliCtiAdapter:{scenario:'success',session:null},
  setTimeout:fn=>{callbacks.push(fn);return callbacks.length},clearTimeout(){},fetch(){throw Error('UNEXPECTED NETWORK')},CTILink:new Proxy({}, {get(){throw Error('UNEXPECTED REAL SDK')}})};
 ctx.window=ctx;vm.createContext(ctx);
 for(const file of ['js/components/tenant-supervisor-policy.js','mock/seat-operations.js','js/components/seat-event-log.js','js/components/alicti-fields.js','mock/extensions.js','js/components/alicti-extensions.js','js/components/seat-phone-config.js','js/components/alicti-seat-operations.js']){
  if(file==='js/components/seat-event-log.js'&&!sampleEvents){ctx.AliCtiSeatOperationFixtures=plain(ctx.AliCtiSeatOperationFixtures);ctx.AliCtiSeatOperationFixtures.eventSamples=[];}
  if(file==='js/components/alicti-seat-operations.js'&&fixturePatch){ctx.AliCtiSeatOperationFixtures=plain(ctx.AliCtiSeatOperationFixtures);fixturePatch(ctx.AliCtiSeatOperationFixtures);}
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
 }
 const api=ctx.AliCtiSeatOperations;
 async function finish(promise){while(callbacks.length)callbacks.shift()();return await promise;}
 const login=()=>finish(api.login(agent,{workingMode:'0'}));
 const query=(params={fields:'agentStatuses'})=>finish(api.queueStatus(agent,params));
 const manage=(action,cno='1201')=>finish(api.manageSeat(agent,{action,cno}));
 async function ready(){good(await login());good(await query());}
 const target=(result,cno='1201')=>Object.values(result.queueStatus||{}).flatMap(q=>q.agentStatuses||[]).find(seat=>seat.cno===cno);
 return {ctx,api,state,access,work,agent,data,finish,login,query,manage,ready,target};
}
const good=result=>assert.equal(result.ok,true,JSON.stringify(result));
const writes=f=>f.api.trace.filter(row=>row.request.method.startsWith('CTILink.Monitor.'));
async function check(name,fn){await fn();checks.push(name);}
(async()=>{
 await check('管理入口必须已上线并取得本租户成员快照',async()=>{const f=setup();assert(!f.api.managementEligibility(f.agent,'1201','pause').ok);assert(!(await f.manage('pause')).ok);good(await f.login());assert(!f.api.managementEligibility(f.agent,'1201','pause').ok);assert(!(await f.manage('pause')).ok);good(await f.query());good(f.api.managementEligibility(f.agent,'1201','pause'));assert.equal(writes(f).length,0);});
 await check('仅队列统计或呼入列表不能代替坐席状态快照',async()=>{const f=setup();good(await f.login());good(await f.query({fields:'queueParams,queueEntries'}));assert(!f.api.managementEligibility(f.agent,'1201','pause').ok);assert(!(await f.manage('pause')).ok);assert.equal(writes(f).length,0);});
 await check('管理置忙使用Monitor.setPause且只提交精确工号',async()=>{const f=setup();await f.ready();const self=plain(f.api.current()),r=await f.manage('pause');good(r);assert.equal(r.request.method,'CTILink.Monitor.setPause');assert.deepEqual(plain(r.request.params),{monitoredCno:'1201'});assert.equal(typeof r.response.code,'number');assert.equal(r.response.code,0);assert.deepEqual(plain(f.api.current()),self);const q=await f.query();good(q);assert.equal(f.target(q).state,'置忙');assert.equal(writes(f).length,1);});
 await check('管理置闲使用Monitor.setUnpause而非本人unpause',async()=>{const f=setup();await f.ready();good(await f.manage('pause'));good(await f.query());const r=await f.manage('unpause');good(r);assert.equal(r.request.method,'CTILink.Monitor.setUnpause');assert.deepEqual(plain(r.request.params),{monitoredCno:'1201'});assert.equal(r.response.code,0);const q=await f.query();good(q);assert.equal(f.target(q).state,'空闲');});
 await check('管理下线保留目标电话绑定且不退出班长本人',async()=>{const f=setup();await f.ready();const self=plain(f.api.current()),r=await f.manage('logout');good(r);assert.equal(r.request.method,'CTILink.Monitor.setOffline');assert.deepEqual(plain(r.request.params),{monitoredCno:'1201',removeBinding:0});assert.equal(r.response.code,0);assert.deepEqual(plain(f.api.current()),self);const q=await f.query();good(q);assert.equal(f.target(q).state,'离线');assert(!f.api.managementEligibility(f.agent,'1201','pause').ok);});
 await check('软电话管理上线明确不支持且绝不发送setOnline',async()=>{const f=setup();await f.ready();good(await f.manage('logout'));good(await f.query());const before=f.api.trace.length,eligibility=f.api.managementEligibility(f.agent,'1201','login');assert.equal(eligibility.ok,false);assert.equal(eligibility.supported,false);const r=await f.manage('login');assert(!r.ok);assert.equal(f.api.trace.length,before);assert(!writes(f).some(row=>row.request.method==='CTILink.Monitor.setOnline'));});
 await check('本人不能通过班长管理入口操作',async()=>{const f=setup();await f.ready();for(const action of ['pause','unpause','logout','login']){assert(!f.api.managementEligibility(f.agent,'9001',action).ok);assert(!(await f.manage(action,'9001')).ok);}assert.equal(writes(f).length,0);});
 await check('同企业跨租户工号、无效工号及数字工号均不发请求',async()=>{const f=setup();await f.ready();for(const cno of ['2201','9999',' 1201',1201,'']){assert(!f.api.managementEligibility(f.agent,cno,'pause').ok);assert(!(await f.manage('pause',cno)).ok);}assert.equal(writes(f).length,0);});
 await check('工号保留前导零且不把0013归一为13',async()=>{const f=setup({dataPatch:data=>{data.agents.find(a=>a.cno==='1201').cno='0013';},fixturePatch:fixture=>{fixture.seats.find(a=>a.cno==='1201').cno='0013';fixture.queues.forEach(q=>q.agentStatuses.forEach(a=>{if(a.cno==='1201')a.cno='0013';}));}});await f.ready();assert(!(await f.manage('pause','13')).ok);const r=await f.manage('pause','0013');good(r);assert.equal(r.request.params.monitoredCno,'0013');assert.equal(writes(f).length,1);});
 await check('通话和整理目标被本地防误操作策略保护',async()=>{const f=setup();await f.ready();for(const cno of ['0012','2103'])for(const action of ['pause','unpause','logout']){assert(!f.api.managementEligibility(f.agent,cno,action).ok);assert(!(await f.manage(action,cno)).ok);}assert.equal(writes(f).length,0);});
 await check('响铃呼叫中失效和未知状态不能执行管理写操作',async()=>{for(const state of ['响铃','呼叫中','失效','未知']){const f=setup({fixturePatch:fixture=>{fixture.queues[0].agentStatuses.find(a=>a.cno==='1201').state=state;}});await f.ready();for(const action of ['pause','unpause','logout'])assert(!(await f.manage(action)).ok,state+' '+action);assert.equal(writes(f).length,0);}});
 await check('设备通话状态不能被空闲文字覆盖',async()=>{const f=setup({fixturePatch:fixture=>Object.assign(fixture.queues[0].agentStatuses.find(a=>a.cno==='1201'),{state:'空闲',deviceStatus:4})});await f.ready();assert(!(await f.manage('pause')).ok);assert(!(await f.manage('logout')).ok);assert.equal(writes(f).length,0);});
 await check('平台归属变化立即阻止陈旧快照下的管理',async()=>{const f=setup();await f.ready();f.data.agents.find(a=>a.cno==='1201').tenantId='TEN-NISSAN-SH';assert(!f.api.managementEligibility(f.agent,'1201','pause').ok);assert(!(await f.manage('pause')).ok);assert.equal(writes(f).length,0);});
 await check('同企业重复工号无法唯一归属时拒绝管理',async()=>{const f=setup();await f.ready();f.data.agents.push({...f.data.agents.find(a=>a.cno==='1201'),contactCenterIdentityId:'DUPLICATE',agentRecordId:'DUPLICATE',tenantId:'TEN-NISSAN-SH'});assert(!(await f.manage('pause')).ok);assert.equal(writes(f).length,0);});
 await check('普通运营身份和被撤销班长授权均不能管理',async()=>{for(const reason of ['role','grant']){const f=setup({fixturePatch:()=>{}});await f.ready();if(reason==='role'){f.access.roleCode='OPERATOR';f.data.memberships[0].roleCode='OPERATOR';}else f.ctx.AliCtiSeatOperationFixtures.supervisors[0].confirmed=false;assert(!f.api.managementEligibility(f.agent,'1201','pause').ok);assert(!(await f.manage('pause')).ok);assert.equal(writes(f).length,0);}});
 await check('非法管理方法和扩展参数不能变成供应商请求',async()=>{const f=setup();await f.ready();for(const input of [{action:'disconnect',cno:'1201'},{action:'pause',cno:'1201',pauseDescription:'伪造参数'},{action:'logout',cno:'1201',removeBinding:1}])assert(!(await f.finish(f.api.manageSeat(f.agent,input))).ok);assert.equal(writes(f).length,0);});
 await check('明确管理置忙失败返回整数-1且保留目标原状态',async()=>{const f=setup();await f.ready();f.api.scenarios.setPause='failure';const r=await f.manage('pause');assert(!r.ok);assert(!r.pending);assert.equal(r.response.code,-1);assert.equal(typeof r.response.code,'number');assert(!f.api.managementState().pending);const q=await f.query();good(q);assert.equal(f.target(q).state,'空闲');assert.equal(writes(f).length,1);});
 await check('明确管理置闲及下线失败均不改变目标',async()=>{for(const [action,scenario] of [['unpause','setUnpause'],['logout','setOffline']]){const f=setup();await f.ready();good(await f.manage('pause'));good(await f.query());f.api.scenarios[scenario]='failure';const r=await f.manage(action);assert(!r.ok);assert.equal(r.response.code,-1);const q=await f.query();good(q);assert.equal(f.target(q).state,'置忙');}});
 await check('管理请求进行中锁定重复写入直到首个回执',async()=>{const f=setup();await f.ready();const first=f.api.manageSeat(f.agent,{action:'pause',cno:'1201'});assert(f.api.managementState().inFlight);assert(!f.api.managementEligibility(f.agent,'1201','logout').ok);assert(!(await f.api.manageSeat(f.agent,{action:'logout',cno:'1201'})).ok);good(await f.finish(first));assert(!f.api.managementState().inFlight);assert.equal(writes(f).length,1);});
 await check('未知结果只通过队列状态回读核对且不重复管理写入',async()=>{for(const [action,scenario,expected] of [['pause','setPause','置忙'],['unpause','setUnpause','空闲'],['logout','setOffline','离线']]){const f=setup();await f.ready();if(action==='unpause'){good(await f.manage('pause'));good(await f.query());}const before=writes(f).length;f.api.scenarios[scenario]='unknown';const r=await f.manage(action);assert(!r.ok);assert(r.pending);assert.equal(r.response,null);assert(f.api.managementState().pending);assert.equal(f.api.managementState().cno,'1201');assert.equal(f.api.managementState().action,action);assert(!(await f.manage(action)).ok);assert.equal(writes(f).length,before+1);const q=await f.query();good(q);assert.equal(f.target(q).state,expected);assert(!f.api.managementState().pending);assert.equal(writes(f).length,before+1);assert.equal(f.api.trace.at(-1).request.method,'CTILink.Agent.queueStatus');}});
 await check('未知结果后的查询失败保留待核对并禁止重复提交',async()=>{const f=setup();await f.ready();f.api.scenarios.setPause='unknown';assert((await f.manage('pause')).pending);f.api.scenarios.queueStatus='failure';assert(!(await f.query()).ok);assert(f.api.managementState().pending);assert(!(await f.manage('pause')).ok);assert.equal(writes(f).length,1);f.api.scenarios.queueStatus='success';good(await f.query());assert(!f.api.managementState().pending);});
 await check('管理未知期间阻止本人状态写入，完成监控核对后恢复',async()=>{const f=setup();await f.ready();f.api.scenarios.setPause='unknown';assert((await f.manage('pause')).pending);const before=f.api.trace.length;assert(!(await f.finish(f.api.pause(f.agent,{pauseType:1,pauseDescription:'准备资料'}))).ok);assert(!(await f.finish(f.api.logout(f.agent,{removeBinding:0}))).ok);assert.equal(f.api.trace.length,before);good(await f.query());good(await f.finish(f.api.pause(f.agent,{pauseType:1,pauseDescription:'准备资料'})));});
 await check('不含目标成员的队列统计不能清除未知管理结果',async()=>{const f=setup();await f.ready();f.api.scenarios.setPause='unknown';assert((await f.manage('pause')).pending);good(await f.query({fields:'queueParams'}));assert(f.api.managementState().pending);good(await f.query({qnos:'6102',fields:'agentStatuses'}));assert(f.api.managementState().pending);good(await f.query());assert(!f.api.managementState().pending);assert.equal(writes(f).length,1);});
 await check('切换会话时迟到管理回执丢弃且不覆盖本人会话',async()=>{const f=setup();await f.ready();const self=plain(f.api.current()),pending=f.api.manageSeat(f.agent,{action:'pause',cno:'1201'});f.state.sessionId='NEW-SESSION';const r=await f.finish(pending);assert(!r.ok);assert.deepEqual(plain(f.api.current()),self);assert(!f.api.managementEligibility(f.agent,'1201','logout').ok);assert.equal(writes(f).length,0);});
 await check('撤销管理员权限时迟到管理回执不能成为成功',async()=>{const f=setup();await f.ready();const pending=f.api.manageSeat(f.agent,{action:'pause',cno:'1201'});f.access.roleCode='OPERATOR';f.data.memberships[0].roleCode='OPERATOR';assert(!(await f.finish(pending)).ok);assert(!f.api.managementEligibility(f.agent,'1201','logout').ok);assert.equal(writes(f).length,0);});
 await check('撤销供应商班长授权时迟到管理回执不能成为成功',async()=>{const f=setup({fixturePatch:()=>{}});await f.ready();const pending=f.api.manageSeat(f.agent,{action:'pause',cno:'1201'});f.ctx.AliCtiSeatOperationFixtures.supervisors[0].confirmed=false;assert(!(await f.finish(pending)).ok);assert(!f.api.managementEligibility(f.agent,'1201','logout').ok);assert.equal(writes(f).length,0);});
 await check('invalidate清除管理上下文且不接受旧请求成功',async()=>{const f=setup();await f.ready();const pending=f.api.manageSeat(f.agent,{action:'pause',cno:'1201'});f.api.invalidate();assert(!(await f.finish(pending)).ok);assert(!f.api.managementState().inFlight);assert(!f.api.managementState().pending);assert(!f.api.managementEligibility(f.agent,'1201','pause').ok);});
 await check('全部管理请求及响应标记mock且无真实SDK网络调用',async()=>{const f=setup();await f.ready();good(await f.manage('pause'));good(await f.query());good(await f.manage('unpause'));good(await f.query());good(await f.manage('logout'));for(const row of writes(f)){assert.equal(row.mock,true);assert.equal(row.request.mock,true);assert.equal(row.response.mock,true);assert(!Object.hasOwn(row.request.params,'enterpriseId'));assert(!Object.hasOwn(row.request.params,'tenantId'));}assert.equal(writes(f).length,3);});
 await check('本人上线与班长管理成功写入本租户日志，失败和未知不伪造成功事件',async()=>{
  const f=setup(),log=f.ctx.SeatEventLog;good(await f.login());assert.equal(log.list()[0].type,'login');good(await f.query());
  f.api.scenarios.setPause='failure';assert(!(await f.manage('pause')).ok);assert.equal(log.list().length,1);
  f.api.scenarios.setPause='unknown';assert((await f.manage('pause')).pending);assert.equal(log.list().length,1);good(await f.query());
  const g=setup();await g.ready();good(await g.manage('pause'));const row=g.ctx.SeatEventLog.list()[0];assert.equal(row.type,'busy');assert.equal(row.cno,'1201');assert.equal(row.source,'班长操作（模拟）');
  assert.equal(row.enterpriseId,'7522240');assert.equal(row.tenantId,'TEN-NISSAN-HQ');
 });
 await check('断线及软电话异常去重，信令恢复不当成媒体恢复',async()=>{
  const f=setup(),log=f.ctx.SeatEventLog;good(await f.login());
  good(f.api.demoConnection('breakLine'));good(f.api.demoConnection('breakLine'));assert.equal(log.list().filter(row=>row.type==='signalLost').length,1);
  good(f.api.demoConnection('restored'));good(f.api.demoConnection('restored'));assert.equal(log.list().filter(row=>row.type==='signalRestored').length,1);
  good(f.api.demoConnection('sipDisconnected'));good(f.api.demoConnection('sipDisconnected'));assert.equal(log.list().filter(row=>row.type==='softphoneLost').length,1);
  assert.equal(f.api.connectionStatus().media,'disconnected');
 });
 await check('快照初次读取不补造历史，只记录随后观察到的变化且不推断断线',async()=>{
  const f=setup({fixturePatch:()=>{}}),log=f.ctx.SeatEventLog;good(await f.login());const first=await f.query();good(first);
  const rows=r=>Object.values(r.queueStatus).flatMap(q=>q.agentStatuses||[]).filter((row,index,all)=>all.findIndex(a=>a.cno===row.cno)===index);
  assert.equal(log.observeSnapshot(rows(first)).length,0);
  f.ctx.AliCtiSeatOperationFixtures.queues[0].agentStatuses.find(row=>row.cno==='1201').state='置忙';
  const next=await f.query();good(next);assert.equal(log.observeSnapshot(rows(next)).length,1);
  const observed=log.list()[0];assert.equal(observed.type,'busy');assert.equal(observed.source,'队列快照（模拟观察）');
  assert.equal(log.observeSnapshot(rows(next)).length,0);
 });
 await check('日志在班长电话离线后仍按租户可读，保留全部历史且隔离其他租户与角色',async()=>{
  const f=setup(),log=f.ctx.SeatEventLog;good(await f.login());good(await f.finish(f.api.logout(f.agent,{removeBinding:0})));
  assert(log.list().some(row=>row.type==='offline'));
  for(let i=0;i<20;i++)assert(log.record(f.agent,'idle',{source:'own',toState:'空闲',detail:'演示 '+i}));
  assert.equal(log.list().length,22);f.access.roleCode='OPERATOR';f.data.memberships[0].roleCode='OPERATOR';assert.equal(log.list().length,0);
  f.access.roleCode='ADMIN';f.data.memberships[0].roleCode='ADMIN';f.state.tenantId='TEN-NISSAN-SH';assert.equal(log.list().length,0);
 });
 await check('事件日志重载仍可见，管理成功与刷新快照不重复记账',async()=>{
  const local=storage(),f=setup({local}),log=f.ctx.SeatEventLog;good(await f.login());const initial=await f.query();good(initial);
  const seats=r=>Object.values(r.queueStatus).flatMap(q=>q.agentStatuses||[]).filter((row,index,all)=>all.findIndex(item=>item.cno===row.cno)===index);
  assert.equal(log.observeSnapshot(seats(initial)).length,0);
  good(await f.manage('pause'));const refreshed=await f.query();good(refreshed);assert.equal(log.observeSnapshot(seats(refreshed)).length,0);
  assert.equal(log.list().filter(row=>row.cno==='1201'&&row.type==='busy').length,1);
  const afterReload=setup({local});assert.equal(afterReload.ctx.SeatEventLog.list().filter(row=>row.cno==='1201'&&row.type==='busy').length,1);
 });
 await check('供应商演示样例不会自动灌入事件日志，真实操作后才产生记录',async()=>{
  const f=setup({sampleEvents:true}),log=f.ctx.SeatEventLog;
  assert.equal(log.list().length,0);assert.equal(log.list().length,0);
  good(await f.login());assert.equal(log.list().length,1);assert.equal(log.list()[0].type,'login');
 });
 console.log(JSON.stringify({result:'pass',count:checks.length,checks},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
