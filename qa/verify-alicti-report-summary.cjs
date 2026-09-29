/* Official report mapping boundary tests. Entirely synthetic; no supplier requests. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),checks=[],failures=[];
function check(name,fn){try{fn();checks.push(name);}catch(e){failures.push({name,error:e.stack});}}
const clone=value=>JSON.parse(JSON.stringify(value));
function fixture(){
  const store=new Map(),ctx={console,Date,URL,structuredClone,localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))},sessionStorage:{getItem:()=>null,setItem:()=>{}},fetch:()=>{throw Error('No network allowed');}};
  ctx.window=ctx;vm.createContext(ctx);
  for(const file of ['mock/data.js','mock/demo-kit.js','mock/demo-resources.js','mock/demo-activity.js','mock/report-summaries.js','js/components/alicti-report-summary.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  return ctx;
}
let c;
check('加载真实现行资源和任务种子，无网络调用',()=>{c=fixture();assert(c.AliCtiReportSummary);assert.equal(c.AliCtiReportSummaryFixtures.size,18);const rows=c.CloudCallData.tasks.filter(t=>t.demoCohort===c.DemoFixtureKit.cohort);assert.equal(rows.filter(t=>!t.repeatContactFixture).length,16);assert.equal(rows.filter(t=>t.repeatContactFixture).length,2);});
if(c){
 const api=c.AliCtiReportSummary,tasks=c.CloudCallData.tasks.filter(t=>t.demoCohort===c.DemoFixtureKit.cohort),task=tasks.find(t=>t.providerType===1&&t.providerStatusCode===1),raw=()=>c.AliCtiReportSummaryFixtures.task(task);
 const opts={enterpriseId:task.enterpriseId,taskId:String(task.providerTaskId),taskType:1};
 check('18个任务累计按原任务6人和再次联系来源4人分别核对身份及口径',()=>{
   const repeatTenants=[];
   for(const row of tasks){
     const result=api.task(row);assert(result.available,result.issue);
     assert.equal(result.totalCount,row.repeatContactFixture?4:6);
     assert.equal(result.providerTaskId,String(row.providerTaskId));assert.equal(result.taskType,row.providerType);
     assert(result.mock);assert.equal(result.metricScope,'task-cumulative');
     if(row.repeatContactFixture){
       repeatTenants.push(row.tenantId);
       assert.equal(result.taskType,1);
       assert.equal(result.calledCount,4);assert.equal(result.answerCount,4);
       assert.equal(result.bridgeCount,2);assert.equal(result.retryCalledCount,0);
     }
   }
   assert.deepEqual(repeatTenants.sort(),['TEN-NISSAN-HQ','TEN-NISSAN-SH']);
 });
 check('呼叫次数包含重试，不能覆盖平台已完成名单',()=>{const result=api.task(task);assert(result.calledCount>task.completed);assert.equal(result.retryCalledCount,1);const before=clone(task);api.task(task);assert.deepEqual(clone(task),before);assert(!('completionRate' in result));});
 check('纯自动任务客户接通独立于双方接通',()=>{const row=tasks.find(t=>t.providerType===2&&t.providerStatusCode===3),result=api.task(row);assert(result.available);assert(result.answerCount>0);assert.equal(result.bridgeCount,0);});
 check('用户新任务不从本地计数伪造供应商累计',()=>{const row={...task,taskId:'NEW-TASK',providerTaskId:345678,total:999};assert(!api.task(row).available);});
 check('全部固定样本不会随本地任务完成数变化而改写',()=>{for(const row of tasks){const before=api.task(row),saved={total:row.total,completed:row.completed};try{row.total=700;row.completed=699;const after=api.task(row);for(const key of ['totalCount','calledCount','answerCount','bridgeCount','retryCalledCount'])assert.equal(after[key],before[key]);}finally{Object.assign(row,saved);}}});
 check('样本响应为独立拷贝，外部篡改不污染后续报表',()=>{const r=raw();r.data.list[0].totalCount='999';assert.equal(api.task(task).totalCount,6);});
 check('缺少供应商编号不能用本地任务编号或随机编号替代',()=>{for(const id of [undefined,null,'','TASK-X',true,0])assert(!api.task({...task,providerTaskId:id}).available);});
 check('请求taskId保留字符串且累计查询不附加日期条件',()=>{const request=api.buildRequest('task',{enterpriseId:'7522240',taskId:['000123','124']});assert(request.ok);assert.equal(request.fields.taskId,'000123,124');assert(!('startTime' in request.fields));assert(!api.buildRequest('task',{...opts,startTime:'2026-09-01'}).ok);});
 check('只有明确成功result接受，空值布尔未知错误均拒绝',()=>{for(const result of [null,undefined,false,'',1,-1,'success']){const r=raw();r.result=result;assert(!api.parse('task',r,opts).available);}for(const result of [0,'0']){const r=raw();r.result=result;assert(api.parse('task',r,opts).available);}});
 check('错账号、错任务、错任务类型均不能回填累计',()=>{for(const patch of [{enterpriseId:'8888888'},{id:'1000'},{taskType:'2'},{taskType:'99'}]){const r=raw();Object.assign(r.data.list[0],patch);assert(!api.parse('task',r,opts).available);}});
 check('缺失或异常累计字段保留未知，不归零',()=>{for(const value of [undefined,null,'',false,'2x',-1,'-1','1.2',Infinity,'9007199254740992']){const r=raw();r.data.list[0].calledCount=value;assert(!api.parse('task',r,opts).available);}});
 check('合法零值和数字字符串均可读',()=>{const r=raw();for(const key of ['totalCount','calledCount','answerCount','bridgeCount','retryCalledCount'])r.data.list[0][key]='0';const result=api.parse('task',r,opts);assert(result.available);assert.equal(result.rows[0].calledCount,0);});
 check('客户接通数不能大于呼叫数，双方接通不能大于客户接通',()=>{for(const patch of [{answerCount:'999'},{bridgeCount:'999'},{retryCalledCount:'999'}]){const r=raw();Object.assign(r.data.list[0],patch);assert(!api.parse('task',r,opts).available);}});
 check('空集合及多个同任务返回不当作唯一累计',()=>{let r=raw();r.data.list=[];r.data.totalCount='0';assert(!api.task(task,r).available);r=raw();r.data.list.push(clone(r.data.list[0]));r.data.totalCount='2';assert(!api.task(task,r).available);});
 check('分页边界、错起点、错wrapper拒绝',()=>{for(const patch of [{pageSize:'0'},{pageSize:'1001'},{totalCount:null},{start:'1'}]){const r=raw();Object.assign(r.data,patch);assert(!api.parse('task',r,opts).available);}assert(!api.parse('task',{result:0,list:raw().data.list},opts).available);});
 check('时长支持超过24小时，分钟秒格式错误保持未知',()=>{assert.equal(api.seconds('125:02:03'),450123);assert.equal(api.seconds('00:00:00'),0);for(const value of [null,0,'123','01:99:00','-1:00:00','00:00:00x'])assert.equal(api.seconds(value),null);});
 check('百分比保留官方单位，非法比例不变为零',()=>{assert.equal(api.percent('21.43%'),21.43);assert.equal(api.percent('0%'),0);for(const v of ['21.43',0,null,'101%'])assert.equal(api.percent(v),null);});
 const dates={enterpriseId:'7522240',startTime:'2026-09-01',endTime:'2026-09-16'};
 check('三类日期报表按年月日而不是CDR秒请求',()=>{for(const type of ['daily','agent','queue']){const request=api.buildRequest(type,dates);assert(request.ok,JSON.stringify(request));assert.equal(request.fields.startTime,'2026-09-01');}});
 check('无效日期、倒序日期及越界查询参数拒绝',()=>{for(const p of [{startTime:'2026-02-30'},{endTime:'2026-08-01'},{limit:1001},{start:-1},{timeRangeType:5}])assert(!api.buildRequest('daily',{...dates,...p}).ok);});
 check('队列自定义日期需要结束日期，其他日期类型可省略',()=>{assert(!api.buildRequest('queue',{enterpriseId:'7522240',startTime:'2026-09-01',timeRangeType:4}).ok);assert(api.buildRequest('queue',{enterpriseId:'7522240',startTime:'2026-09-01',timeRangeType:3}).ok);});
 check('队列按小时/半时/日/汇总与小时范围明确校验',()=>{for(const m of [0,1,2,8])assert(api.buildRequest('queue',{...dates,statisticMethod:m}).ok);for(const p of [{statisticMethod:4},{startHour:24},{endHour:0},{startHour:18,endHour:17}])assert(!api.buildRequest('queue',{...dates,...p}).ok);});
 const envelope=list=>({result:'0',data:{start:'0',pageSize:'10',totalCount:String(list.length),list}});
 check('日报分钟数与持续时长分开，totalStatistic不与list相加',()=>{const r=envelope([{enterpriseId:'7522240',taskId:123,day:'2026-09-15',answerMinutes:'2',duration:'01:00:00',calledCount:'5',answerCount:'3',bridgeCount:'2',telRetryRound:'1'}]);r.data.totalStatistic={answerMinutes:2,duration:'01:00:00',calledCount:5,answerCount:3,bridgeCount:2,telRetryRound:1};const out=api.parse('daily',r,{...dates,taskIds:'123'});assert(out.available);assert.equal(out.rows[0].answerMinutes,2);assert.equal(out.rows[0].durationSeconds,3600);assert.equal(out.totalStatistic.calledCount,5);assert.equal(out.totalStatistic.answerMinutes,2);});
 check('日报任务越界和已给日期越界均拒绝',()=>{for(const patch of [{taskId:124},{day:'2026-08-31'}]){const r=envelope([{enterpriseId:'7522240',taskId:123,day:'2026-09-15',...patch}]);assert(!api.parse('daily',r,{...dates,taskIds:'123'}).available);}});
 check('坐席工号保留前导零，状态时长不改名为通话话单时长',()=>{const r=envelope([{enterpriseId:'7522240',cno:'0012',gno:'G1',qname:'队列一',stateInuse:'01:02:03',calledCount:'8',bridgeCount:'6'}]);const out=api.parse('agent',r,{...dates,gnos:'G1'});assert(out.available);assert.equal(out.rows[0].cno,'0012');assert.equal(out.rows[0].stateInuseSeconds,3723);assert(!('bridgeDuration' in out.rows[0]));});
 check('队列数据按官方qno及日期匹配，不按名称替换为技能组',()=>{const r=envelope([{enterpriseId:'7522240',qno:'0012',queueName:'同名',day:'2026-09-15',enterCount:'6',totalBridgeTime:'00:03:00',avgWaitTime:'00:00:07',telEnterCount:'6',telAnswerCount:'5'}]);const out=api.parse('queue',r,{...dates,qnos:'0012'});assert(out.available);assert.equal(out.rows[0].totalBridgeTimeSeconds,180);assert.equal(out.rows[0].avgWaitTimeSeconds,7);assert.equal(out.rows[0].telEnterCount,'6');assert(!('skillGroupId' in out.rows[0]));assert(!api.parse('queue',r,{...dates,qnos:'12'}).available);});
 check('CF-14按供应商确认解释电话进入和接听数，保留原字段字符串而不按英文名称对调',()=>{
   const r=envelope([{enterpriseId:'7522240',qno:'0012',day:'2026-09-15',telEnterCount:'0005',telAnswerCount:'0008',enterAnsweredRate:'61.25%',answeredRate:'73.1%',abandonedRate:'12%',serviceLevel:'84%'}]),before=clone(r);
   const out=api.parse('queue',r,{...dates,qnos:'0012'}),row=out.rows[0];
   assert(out.available);assert.strictEqual(row.telEnterCount,'0005');assert.strictEqual(row.telAnswerCount,'0008');
   assert.strictEqual(row.telephoneAnsweredCount,5);assert.strictEqual(row.telephoneEnteredCount,8);
   for(const field of ['enterAnsweredRate','answeredRate','abandonedRate','serviceLevel'])assert.strictEqual(row[field],before.data.list[0][field]);
   assert(!('telephoneAnswerRate' in row));assert.deepEqual(clone(out.raw),before);assert.deepEqual(r,before);
 });
 check('CF-14缺失或异常电话计数不归零，合法零值可映射且原响应保持不变',()=>{
   for(const value of [undefined,null,'',false,'2x','-1','1.2','9007199254740992']){
     const row={enterpriseId:'7522240',qno:'0012'};
     if(value!==undefined)Object.assign(row,{telEnterCount:value,telAnswerCount:value});
     const r=envelope([row]),out=api.parse('queue',r,{...dates,qnos:'0012'});assert(out.available);
     assert.strictEqual(out.rows[0].telephoneAnsweredCount,null);assert.strictEqual(out.rows[0].telephoneEnteredCount,null);
     assert.deepEqual(clone(out.raw),clone(r));
   }
   const out=api.parse('queue',envelope([{enterpriseId:'7522240',qno:'0012',telEnterCount:'0',telAnswerCount:'0'}]),{...dates,qnos:'0012'});
   assert(out.available);assert.strictEqual(out.rows[0].telephoneAnsweredCount,0);assert.strictEqual(out.rows[0].telephoneEnteredCount,0);
 });
}
const result={kind:'synthetic-contract-checks',supplierIntegration:false,passed:checks.length,failed:failures.length,checks,failures};
console.log(JSON.stringify(result,null,2));process.exitCode=failures.length?1:0;
