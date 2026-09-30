/** Tenant-admin monitor isolation and official outbound statistics. No browser/SDK/network. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.join(__dirname,'..'),checks=[],plain=x=>JSON.parse(JSON.stringify(x));
function setup(){
 const state={sessionId:'MONITOR-QA',accountId:'ACC-ADMIN-018',enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',activeDomain:'CLOUD_CONTACT_CENTER'},access={...state,valid:true,roleCode:'ADMIN'};
 const seat={agentRecordId:'SUPERVISOR',contactCenterIdentityId:'SUPERVISOR',accountId:state.accountId,enterpriseId:state.enterpriseId,tenantId:state.tenantId,cno:'9001',userName:'管理员',lifecycleStatus:'已启用'};
 const data={accounts:[{accountId:state.accountId,status:'启用'}],memberships:[{accountId:state.accountId,tenantId:state.tenantId,status:'启用',roleCode:'ADMIN'}],tenants:[{tenantId:state.tenantId,enterpriseId:state.enterpriseId,status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}],agents:[seat,{...seat,accountId:'OTHER',contactCenterIdentityId:'NORMAL',cno:'0012',userName:'普通坐席'},{...seat,tenantId:'TEN-NISSAN-SH',cno:'2201'}],calls:[],tasks:[]};
 let queues=[{qno:'6101',name:'总部销售队列'},{qno:'6102',name:'总部售后队列'}],online=false,session=null,response={ok:true,queueStatus:{}},myAgent=seat;
 const requests=[],statusRequests=[],actions=[],tableCalls=[],paginationCalls=[],routeCalls=[],stored=new Map(),statusByCno=new Map([['9001','离线'],['0012','离线']]),localStorage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,String(value))};
 let routeKey='seat-workbench',refreshCount=0;
 let now=Date.now();
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ctx={console,Date:Clock,Map,Set,Number,Object,Array,JSON,structuredClone,localStorage,CloudCallData:data,document:{getElementById:()=>null},
  AppState:{get:()=>state,effectiveAccess:()=>access,hasCapability:()=>true,isReady:()=>true},
  PlatformUI:{escape,status:escape,table:(columns,rows)=>{tableCalls.push({columns:columns.map(column=>column.label),rows:plain(rows)});return JSON.stringify(rows);},pagination:(total,page,size,method)=>{paginationCalls.push({total,page,size,method});return '<nav data-qa-pagination="'+page+'"></nav>';}},
  RouteRuntime:{openSecondary:(key,options)=>{routeKey=key;routeCalls.push({key,options});return true;},snapshot:()=>({key:routeKey}),refreshCurrent:()=>{refreshCount++;return true;}},
  AgentWorkbench:{myAgent:()=>myAgent,telephoneStatus:()=>({online,signingIn:false}),current:()=>({busy:false}),signIn:()=>{actions.push('signIn');return new Promise(()=>{});},signOut:async()=>{actions.push('signOut');online=false;session=null;return {ok:true};}},
  AliCtiSeatOperations:{monitorQueues:()=>queues,current:()=>session,status:()=>({pending:false}),queueStatus:async(a,input)=>{requests.push({a,input});return typeof response==='function'?response():response;},agentStatusGet:async(_agent,cno)=>{statusRequests.push(cno);return {ok:true,state:statusByCno.get(cno)||'离线'};}},
  fetch:()=>{throw Error('NO NETWORK')},CTILink:new Proxy({}, {get(){throw Error('NO SDK')}})};
 ctx.window=ctx;vm.createContext(ctx);
 for(const file of ['js/components/alicti-fields.js','js/components/alicti-number-status.js','js/components/call-state.js','js/components/alicti-report-facts.js','js/components/report-metrics.js','js/components/tenant-supervisor-policy.js','js/components/seat-event-log.js','js/components/tenant-call-monitor.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
 const api=ctx.TenantCallMonitor;
 function call(id,kind='manual',status=3,extra={}){const start=new Date();start.setHours(9,0,0,0);const at=start.getTime(),callType={manual:'人工外呼',predictive:'预外呼',automatic:'IVR 外呼',inbound:'呼入'}[kind];return {callId:id,enterpriseId:state.enterpriseId,tenantId:state.tenantId,callType,direction:kind==='inbound'?'呼入':'呼出',ringingAt:at,endedAt:at+60000,alictiCdr:{kind,raw:{enterpriseId:7522240,status,startTime:at/1000,endTime:(at+60000)/1000,customerNumber:'13900001234'}},...extra};}
 return {ctx,api,state,access,data,seat,requests,statusRequests,actions,tableCalls,paginationCalls,routeCalls,stored,advance:ms=>{now+=ms;},refreshCount:()=>refreshCount,setSeatStatus:(cno,value)=>statusByCno.set(cno,value),call,setQueues:q=>{queues=q;},setResponse:r=>{response=r;},setAgent:a=>{myAgent=a;},setOnline:()=>{online=true;session={...state,cno:'9001',issuedAt:Date.now()};}};
}
async function check(name,fn){await fn();checks.push(name);}
(async()=>{
 await check('仅有效当前租户管理员展示监控，运营与超管不展示',()=>{for(const role of ['OPERATOR','SUPER_ADMIN']){const f=setup();f.access.roleCode=role;assert(!f.api.eligible());assert.equal(f.api.model(),null);assert.equal(f.api.render(),'');}const f=setup();assert(f.api.eligible());assert(f.api.render().includes('tenant-call-monitor'));});
 await check('坐席事件日志离线可看最近五条，并能进入全部事件二级页',()=>{
  const f=setup(),log=f.ctx.SeatEventLog;
  let html=f.api.render();
  assert.match(html,/监控概览/);assert.match(html,/坐席事件日志/);
  assert(!html.includes('id="tenant-monitor-event-title"'));
  for(let i=0;i<7;i++){assert(log.record(f.seat,i%2?'signalLost':'login',{source:i%2?'connection':'own',fromState:'离线',toState:'空闲',detail:'记录 '+i}));f.advance(1000);}
  assert.equal(f.api.setTab('events'),true);
  html=f.api.render();assert(html.includes('id="tenant-monitor-event-title"'));
  assert.match(html,/查看全部事件/);
  assert.match(html,/当前浏览器.*演示记录.*非实时采集/);
  assert.deepEqual(plain(f.tableCalls.at(-1).columns),['记录时间','坐席','事件','来源']);
  assert.equal(f.tableCalls.at(-1).rows.length,5);
  assert.deepEqual(f.tableCalls.at(-1).rows.map(row=>row.detail),['记录 6','记录 5','记录 4','记录 3','记录 2']);
  assert.equal(log.list().length,7);
  assert.equal(f.api.setTab('overview'),true);
  html=f.api.render();assert(!html.includes('id="tenant-monitor-event-title"'));
 });
 await check('agentStatus/get 初次读取仅建立基线，后续状态变化标注接口观察来源',async()=>{
  const f=setup(),log=f.ctx.SeatEventLog;
  assert.equal((await f.api.loadReadOnlyStatuses()).ok,true);
  assert.equal(log.list().length,0);
  f.setSeatStatus('0012','空闲');f.advance(1000);
  assert.equal((await f.api.loadReadOnlyStatuses()).ok,true);
  const rows=log.list();assert.equal(rows.length,1);
  assert.equal(rows[0].cno,'0012');assert.equal(rows[0].type,'login');
  assert.equal(rows[0].source,'状态接口快照（模拟观察）');
  assert.deepEqual(f.statusRequests,['9001','0012','9001','0012']);
 });
 await check('全部事件二级页保留全部记录、每页十条并按最新记录分页',()=>{
  const f=setup(),log=f.ctx.SeatEventLog;
  for(let i=0;i<17;i++){assert(log.record(f.seat,'idle',{source:'own',toState:'空闲',detail:'事件 '+i}));f.advance(1000);}
  assert.equal(f.api.openEventHistory(),true);
  assert.equal(f.routeCalls.at(-1).key,'seat-event-history');
  let html=f.ctx.Pages['seat-event-history'].render();
  assert.match(html,/全部坐席事件/);
  assert.match(html,/当前浏览器.*演示记录.*非实时采集/);
  assert.deepEqual(plain(f.tableCalls.at(-1).columns),['记录时间','坐席','事件','来源']);
  assert.deepEqual(f.tableCalls.at(-1).rows.map(row=>row.detail),Array.from({length:10},(_,index)=>'事件 '+(16-index)));
  assert.deepEqual(f.paginationCalls.at(-1),{total:17,page:1,size:10,method:'TenantCallMonitor.setEventHistoryPage'});
  assert.equal(f.api.setEventHistoryPage(2),true);
  assert.equal(f.refreshCount(),1);
  html=f.ctx.Pages['seat-event-history'].render();
  assert.deepEqual(f.tableCalls.at(-1).rows.map(row=>row.detail),Array.from({length:7},(_,index)=>'事件 '+(6-index)));
  assert.equal(f.paginationCalls.at(-1).page,2);
  f.access.roleCode='OPERATOR';f.data.memberships[0].roleCode='OPERATOR';
  assert.equal(f.api.openEventHistory(),false);
  assert.match(f.ctx.Pages['seat-event-history'].render(),/没有查看本租户坐席事件的权限/);
 });
 await check('事件默认按更新时间倒序，缺少更新时间时以记录时间兜底',()=>{
  const f=setup(),log=f.ctx.SeatEventLog;
  const first=log.record(f.seat,'login',{source:'own',toState:'空闲'});f.advance(1000);
  const second=log.record(f.seat,'busy',{source:'own',toState:'置忙'});f.advance(1000);
  const third=log.record(f.seat,'idle',{source:'own',toState:'空闲'});
  assert(first&&second&&third);
  const key='alicti-seat-event-log-v1',payload=JSON.parse(f.stored.get(key));
  const firstRow=payload.rows.find(row=>row.id===first.id),secondRow=payload.rows.find(row=>row.id===second.id),thirdRow=payload.rows.find(row=>row.id===third.id);
  firstRow.updatedAt=thirdRow.occurredAt+1000;
  delete secondRow.updatedAt;
  f.stored.set(key,JSON.stringify(payload));
  assert.deepEqual(plain(log.list().map(row=>row.id)),[first.id,third.id,second.id]);
 });
 await check('写入时保存坐席姓名，删除及同工号重建后仍展示旧事件原始身份',()=>{
  const f=setup(),log=f.ctx.SeatEventLog,oldSeat=f.data.agents.find(row=>row.cno==='0012');
  const original=log.record(oldSeat,'busy',{source:'management',fromState:'空闲',toState:'置忙'});
  assert(original);assert.equal(original.name,'普通坐席');
  oldSeat.lifecycleStatus='已删除';
  assert.equal(log.list().find(row=>row.id===original.id)?.name,'普通坐席');
  f.data.agents.push({...oldSeat,contactCenterIdentityId:'NEW-IDENTITY-0012',agentRecordId:'NEW-RECORD-0012',userName:'新坐席',lifecycleStatus:'已启用'});
  const retained=log.list().find(row=>row.id===original.id);
  assert(retained);assert.equal(retained.name,'普通坐席');assert.equal(retained.seatIdentityId,oldSeat.contactCenterIdentityId);
  assert.equal(retained.cno,'0012');
 });
 await check('状态接口与队列快照观察同一状态转移只记一条事件',()=>{
  const f=setup(),log=f.ctx.SeatEventLog,baseline=[{cno:'0012',state:'离线'}];
  assert.equal(log.observeSnapshot(baseline,{source:'statusApi'}).length,0);
  assert.equal(log.observeSnapshot(baseline,{source:'snapshot'}).length,0);
  f.advance(1000);
  assert.equal(log.observeSnapshot([{cno:'0012',state:'空闲'}],{source:'statusApi'}).length,1);
  assert.equal(log.observeSnapshot([{cno:'0012',state:'空闲'}],{source:'snapshot'}).length,0);
  assert.equal(log.list().length,1);
  f.advance(1000);
  assert.equal(log.observeSnapshot([{cno:'0012',state:'置忙'}],{source:'snapshot'}).length,1);
  assert.equal(log.observeSnapshot([{cno:'0012',state:'置忙'}],{source:'statusApi'}).length,0);
  assert.deepEqual(plain(log.list().map(row=>row.type)),['busy','login']);
 });
 await check('陈旧租户权限与已撤销管理员成员不能继续展示统计',()=>{for(const patch of [{tenantId:'TEN-NISSAN-SH'},{enterpriseId:'OTHER'},{accountId:'OTHER'},{valid:false}]){const f=setup();Object.assign(f.access,patch);assert(!f.api.eligible());}const f=setup();f.data.memberships[0].roleCode='OPERATOR';assert(!f.api.eligible());});
 await check('三类外呼共用官方接通判断，未知结果不进入接通率分母',()=>{const f=setup();f.data.calls.push(f.call('M'),f.call('P','predictive',40),f.call('A','automatic','客户接听'),f.call('U','manual',999));const m=f.api.model();assert.deepEqual(plain(m.stats),{calls:4,answered:2,unanswered:1,unknown:1,runningTasks:0,rate:'66.7%'});});
 await check('同企业其他租户及其他企业话单均不进入统计',()=>{const f=setup();f.data.calls.push(f.call('OK'),f.call('OTHER-TENANT','manual',3,{tenantId:'TEN-NISSAN-SH'}),f.call('OTHER-ENTERPRISE','manual',3,{enterpriseId:'7000001'}));assert.deepEqual(plain(f.api.model().calls.map(x=>x.callId)),['OK']);});
 await check('呼入和未结束记录不作为今日外呼，供应商结束字段优先',()=>{const f=setup(),live=f.call('LIVE');live.alictiCdr.raw.endTime=0;f.data.calls.push(f.call('OK'),f.call('INBOUND','inbound','人工接听'),live,f.call('WRONG-DIRECTION','manual',3,{direction:'呼入'}));assert.deepEqual(plain(f.api.model().calls.map(x=>x.callId)),['OK']);});
 await check('按通话开始日过滤今日，拒绝缺失或跨供应商原始话单',()=>{const f=setup(),yesterday=f.call('OLD'),missing=f.call('MISSING'),foreign=f.call('FOREIGN');yesterday.alictiCdr.raw.startTime-=86400;yesterday.alictiCdr.raw.endTime-=86400;delete missing.alictiCdr.raw.startTime;foreign.alictiCdr.raw.enterpriseId=7000001;f.data.calls.push(f.call('OK'),yesterday,missing,foreign);assert.deepEqual(plain(f.api.model().calls.map(x=>x.callId)),['OK']);});
 await check('重复导入同一通话仅统计一次，同手机号的不同呼叫分别统计',()=>{const f=setup();f.data.calls.push(f.call('C1'),f.call('C1'),f.call('C2'));assert.equal(f.api.model().stats.calls,2);});
 await check('只有未知结果时接通率留空，不能展示零接通率',()=>{const f=setup();f.data.calls.push(f.call('U','manual',999));assert.equal(f.api.model().stats.rate,'—');assert.equal(f.api.model().stats.unknown,1);});
 await check('执行中任务按本租户范围统计并排除创建草稿',()=>{const f=setup();f.data.tasks.push({taskId:'T1',enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',status:'执行中'},{taskId:'T2',enterpriseId:'7522240',tenantId:'TEN-NISSAN-SH',status:'执行中'},{taskId:'T3',enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',status:'运行中',isWizardDraft:true},{taskId:'T4',enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',status:'已结束'});assert.equal(f.api.model().stats.runningTasks,1);});
 await check('多个队列同一工号去重，状态冲突展示待核对',()=>{const f=setup(),seats=f.api.monitoredSeats({queueStatus:{6101:{agentStatuses:[{cno:'9001',state:'空闲'},{cno:'0012',state:'通话'}]},6102:{agentStatuses:[{cno:'9001',state:'空闲'},{cno:'0012',state:'置忙'}]}}});assert.equal(seats.length,2);assert.deepEqual(plain(seats.find(x=>x.cno==='9001').queues),['6101','6102']);assert.equal(seats.find(x=>x.cno==='0012').state,'待核对');});
 await check('忽略外租户队列、成员和非字符串工号，保留前导零区分',()=>{const f=setup();f.data.agents.push({...f.seat,cno:'12',contactCenterIdentityId:'12'});const rows=f.api.monitoredSeats({queueStatus:{6201:{agentStatuses:[{cno:'9001',state:'通话'}]},6101:{agentStatuses:[{cno:'2201',state:'通话'},{cno:12,state:'通话'},{cno:'0012',state:'空闲'},{cno:'12',state:'置忙'}]}}});assert.deepEqual(plain(rows.map(x=>x.cno)),['0012','12']);});
 await check('本地工号归属存在歧义时不能透露该坐席状态',()=>{const f=setup();f.data.agents.push({...f.seat,cno:'0012',tenantId:'TEN-NISSAN-SH',contactCenterIdentityId:'DUPLICATE'});assert.equal(f.api.monitoredSeats({queueStatus:{6101:{agentStatuses:[{cno:'0012',state:'通话'}]}}}).length,0);});
 await check('未取得班长授权仍可查看本租户已结束统计但不能上线监控',async()=>{const f=setup();f.setQueues([]);f.data.calls.push(f.call('C1'));assert.equal(f.api.model().stats.calls,1);assert.equal(f.api.start(),false);assert.equal((await f.api.load()).ok,false);assert.equal(f.requests.length,0);assert.match(f.api.render(),/id="tenant-monitor-start"[^>]*disabled/);});
 await check('无关联坐席的管理员保留统计并提示先关联班长坐席',()=>{const f=setup();f.setAgent(null);const html=f.api.render();assert(html.includes('今日外呼次数'));assert(html.includes('关联班长坐席'));assert.equal(f.api.start(),false);assert.equal(f.actions.length,0);});
 await check('监控只取坐席状态，呼入队列统计不参与外呼量',async()=>{const f=setup();f.setOnline();f.setResponse({ok:true,queueStatus:{6101:{queueParams:{calls:9999},agentStatuses:[{cno:'9001',state:'空闲'}]}}});f.data.calls.push(f.call('C1'));assert.equal((await f.api.load()).ok,true);assert.deepEqual(plain(f.requests[0].input),{fields:'agentStatuses'});assert.equal(f.api.model().stats.calls,1);assert(!f.api.render().includes('9999'));});
 await check('查询期间切换租户后丢弃旧结果，防止旧监控写入新租户',async()=>{const f=setup();f.setOnline();let resolve;f.setResponse(()=>new Promise(r=>{resolve=r;}));const pending=f.api.load();Object.assign(f.state,{tenantId:'TEN-NISSAN-SH'});resolve({ok:true,queueStatus:{6101:{agentStatuses:[{cno:'9001',state:'通话'}]}}});assert.equal((await pending).ok,false);assert.equal(f.api.render(),'');});
 await check('查询明确失败显示失败信息，刷新与统计不会隐式发起呼叫',async()=>{const f=setup();f.setOnline();f.setResponse({ok:false,message:'监控读取失败'});assert.equal((await f.api.load()).ok,false);assert(f.api.render().includes('监控读取失败'));assert.equal(f.actions.length,0);});
 await check('上线动作不等待持锁会话结束，主动下线保留业务数据',async()=>{const f=setup();f.data.calls.push(f.call('C1'));assert.equal(f.api.start(),true);assert.deepEqual(f.actions,['signIn']);f.setOnline();assert.equal((await f.api.stop()).ok,true);assert.equal(f.data.calls.length,1);assert.deepEqual(f.actions,['signIn','signOut']);});
 console.log(JSON.stringify({result:'pass',count:checks.length,checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
