/* AliCti task/update field contract: pure mapping, no supplier calls. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={};
vm.createContext(ctx);
for(const name of ['alicti-number-status','alicti-retry','alicti-fields']){
  vm.runInContext(fs.readFileSync(path.join(root,'js/components',name+'.js'),'utf8'),ctx);
}
const api=ctx.AliCtiFields,plain=value=>JSON.parse(JSON.stringify(value));
let count=0;
function check(name,fn){fn();count++;process.stdout.write(`✓ ${name}\n`);}
function fixture(type='预外呼'){
  const automatic=type==='IVR 外呼';
  const values={name:'旧任务',description:'旧说明',businessTagNames:'A',scheduleMode:'保存后手工启动',scheduleAt:'',stopScheduled:false,stopAt:'',
    autoTaskType:0,allowedTimeIds:[],forbiddenTimeIds:[],autoComplete:automatic?1:0,retryStrategyOnlyToday:0,
    callPriority:{retryFirst:true,retryDesc:0,firstCallOrderType:0},concurrency:automatic?1:0,callerMode:'fixed',callerNumberId:'NUM-1',customerTimeout:30,
    retryPolicy:api&&ctx.AliCtiRetry.create(type),sourceRef:'BATCH-1',isRepeat:0,total:3,
    ...(automatic?{contactFlowId:'OLD-FLOW',providerIvrId:'901'}:{callGroupType:1,cnos:['0012'],callStrategy:'1',minAvailableAgentCount:1,callRouteStrategy:1,contactFlowId:'OLD-FLOW',providerIvrId:'901',agentTimeout:10,wrapup:30,maxWaitTime:40,quotiety:1,predictAdjust:100,answerRate:50,warmUpDuration:300,isRewarm:1})};
  const fields={type:automatic?2:1,callGroupType:1,ivrId:901,autoTaskType:0,autoComplete:automatic?1:0,...(automatic?{}:{cnos:'0012',callStrategy:'1',minAvailableAgentCount:1})};
  const row={taskId:'LOCAL-9',providerTaskId:'12345',tenantId:'TEN-1',enterpriseId:'7522240',callType:type,
    alictiCreateDraft:{fields},executionConfig:{contactFlowId:'OLD-FLOW',callerNumberId:'NUM-1',callerMode:'fixed',autoTaskType:0,allowedTimeIds:[],forbiddenTimeIds:[]}};
  return {row,draft:{type,tenantId:'TEN-1',enterpriseId:'7522240',values:plain(values),editOriginalValues:plain(values)}};
}
const onlyDelta=fields=>Object.fromEntries(Object.entries(fields).filter(([key])=>!['validateType','enterpriseId','timestamp','sign','taskId'].includes(key)));
check('仅改说明，沿用原 taskId 且不查已经失效的旧 IVR/坐席目录',()=>{
  const {draft,row}=fixture();draft.values.description='新说明';
  const mapped=api.taskUpdateFields(draft,row,{});
  assert.deepEqual(plain(mapped.errors),[]);
  assert.equal(mapped.endpoint,'task/update');
  assert.equal(mapped.fields.taskId,'12345');
  assert.equal(mapped.fields.enterpriseId,7522240);
  assert.equal(mapped.fields.validateType,2);
  assert.equal(mapped.authFields.validateType,2);
  assert.deepEqual(plain(onlyDelta(mapped.fields)),{description:'新说明'});
  assert.equal(mapped.verificationEndpoint,'task/get');
});
check('自动外呼仅改说明，不依赖当前语音流程也不提交 create 专属字段',()=>{
  const {draft,row}=fixture('IVR 外呼');draft.values.name='新任务';
  const mapped=api.taskUpdateFields(draft,row,{});
  assert.deepEqual(plain(mapped.errors),[]);
  assert.deepEqual(plain(onlyDelta(mapped.fields)),{name:'新任务'});
  for(const key of ['type','callGroupType','templateName','autoDelete','isRepeat','ivrId','ivrName','callerNumberId'])assert.equal(Object.hasOwn(mapped.fields,key),false,key);
});
check('自动外呼通用任务设置按差异更新，保留原任务与语音流程',()=>{
  const {draft,row}=fixture('IVR 外呼');
  Object.assign(draft.values,{
    name:'保养提醒新名称',description:'更新后的客户通知说明',businessTagNames:'保养,回访',
    autoComplete:0,retryStrategyOnlyToday:2,concurrency:3,customerTimeout:35,
    callPriority:{retryFirst:false,retryDesc:1,firstCallOrderType:2}
  });
  const mapped=api.taskUpdateFields(draft,row,{}),delta=plain(onlyDelta(mapped.fields));
  assert.deepEqual(plain(mapped.errors),[]);
  assert.equal(mapped.fields.taskId,'12345');
  assert.equal(delta.name,'保养提醒新名称');
  assert.equal(delta.description,'更新后的客户通知说明');
  assert.equal(delta.businessTagNames,'保养,回访');
  assert.equal(delta.autoComplete,0);
  assert.equal(delta.retryStrategyOnlyToday,2);
  assert.equal(delta.concurrency,3);
  assert.equal(delta.customerTimeout,35);
  assert.deepEqual(JSON.parse(delta.callPriorityStrategy).strategy.map(item=>item.type),['firstCall','retryCall']);
  for(const key of ['type','ivrId','ivrName','callGroupType','cnos','callStrategy','agentTimeout','wrapup','quotiety'])
    assert.equal(Object.hasOwn(delta,key),false,key);
});
check('预测已确认参数按原值差量更新，范围错误阻断',()=>{
  const {draft,row}=fixture();draft.values.callRouteStrategy=2;draft.values.agentTimeout=5;
  const mapped=api.taskUpdateFields(draft,row,{});
  assert.deepEqual(plain(mapped.errors),[]);
  assert.deepEqual(plain(onlyDelta(mapped.fields)),{callRouteStrategy:2,agentTimeout:5});
  draft.values.agentTimeout=4;
  const invalid=api.taskUpdateFields(draft,row,{});
  assert(invalid.errors.some(item=>item.includes('座席超时时间')));
  assert.equal(Object.hasOwn(invalid.fields,'agentTimeout'),false);
});
check('更换预测语音流程仅接受当前账号已映射的 IVR',()=>{
  const {draft,row}=fixture();draft.values.contactFlowId='NEW-FLOW';
  const data={contactFlows:[{contactFlowId:'NEW-FLOW',enterpriseId:'7522240',providerIvrId:902}]};
  const mapped=api.taskUpdateFields(draft,row,data);
  assert.deepEqual(plain(mapped.errors),[]);
  assert.deepEqual(plain(onlyDelta(mapped.fields)),{ivrId:902});
  assert(api.taskUpdateFields(draft,row,{contactFlows:[{...data.contactFlows[0],enterpriseId:'WRONG'}]}).errors.length>0);
});
check('更换坐席必须属于原租户账号且当前可外呼',()=>{
  const {draft,row}=fixture();draft.values.cnos=['0013'];
  assert(api.taskUpdateFields(draft,row,{}).errors.some(item=>item.includes('当前租户账号')));
  const base={cno:'0013',tenantId:'TEN-1',enterpriseId:'7522240',lifecycleStatus:'已启用',acceptNewTasks:true,callEnabled:true};
  assert.deepEqual(plain(api.taskUpdateFields(draft,row,{agents:[base]}).errors),[]);
  assert.equal(api.taskUpdateFields(draft,row,{agents:[{...base,enterpriseId:'7522241'}]}).fields.cnos,undefined);
});
check('自动外呼语音流程修改在已确认更新范围外',()=>{
  const {draft,row}=fixture('IVR 外呼');draft.values.providerIvrId='999';
  assert(api.taskUpdateFields(draft,row,{}).errors.some(item=>item.includes('自动外呼语音流程')));
});
check('自动外呼误改坐席或预测拨号参数被明确阻断',()=>{
  for(const [key,value] of [['agentTimeout',20],['wrapup',40],['minAvailableAgentCount',2],['quotiety',1.5],['answerRate',55],['callStrategy','2']]){
    const {draft,row}=fixture('IVR 外呼');draft.values.description='合法的说明修改';draft.values[key]=value;
    const mapped=api.taskUpdateFields(draft,row,{});
    assert(mapped.errors.some(item=>item.includes('仅适用于预外呼任务')),key);
    assert.equal(Object.hasOwn(mapped.fields,key),false,key);
  }
});
check('无供应商 taskId 或跨账号绝不提交',()=>{
  const {draft,row}=fixture();draft.values.description='新说明';delete row.providerTaskId;
  assert(api.taskUpdateFields(draft,row,{}).errors.some(item=>item.includes('taskId')));
  row.simulation=true;row.localPrototypeTask=true;row.demoProviderTaskId='333';
  assert.equal(api.taskUpdateFields(draft,row,{}).fields.taskId,'333');
  row.enterpriseId='7522241';
  assert(api.taskUpdateFields(draft,row,{}).errors.some(item=>item.includes('账号')));
});
check('仅明确登记的原始演示任务可使用固定供应商种子 ID',()=>{
  const {draft,row}=fixture();draft.values.description='新说明';delete row.providerTaskId;
  ctx.AliCtiDemo={taskControlSeed(item){return item.taskId==='TASK-PRED-0901'&&item.enterpriseId==='7522240'?{id:800001}:null;}};
  row.taskId='TASK-PRED-0901';
  assert.equal(api.taskUpdateFields(draft,row,{}).fields.taskId,'800001');
  row.taskId='TASK-UNKNOWN';
  assert(api.taskUpdateFields(draft,row,{}).errors.some(item=>item.includes('taskId')));
  delete ctx.AliCtiDemo;
});
check('锁定创建后不可更改的 type 与 callGroupType',()=>{
  const {draft,row}=fixture();draft.type='IVR 外呼';draft.values.description='修改';
  assert(api.taskUpdateFields(draft,row,{}).errors.some(item=>item.includes('任务类型')));
  draft.type='预外呼';draft.values.callGroupType=2;
  assert(api.taskUpdateFields(draft,row,{}).errors.some(item=>item.includes('指定座席方式')));
});
check('时间、导航和重呼按改动分组映射，固定外显号码不走更新任务',()=>{
  const {draft,row}=fixture();
  draft.values.scheduleMode='定时执行';draft.values.scheduleAt='2026-10-01T09:00';
  draft.values.callerMode='navigation';draft.values.customerClidsGroup='STALE-NAV';draft.values.clidPoolList=[{name:'池A',priority:1}];
  draft.values.retryPolicy={version:1,mode:'unset',timeType:1,codes:[],rounds:[{days:0,hours:0,minutes:10}]};
  const data={instances:[{enterpriseId:'7522240',customerClidsGroup:'DEFAULT-NAV'},{enterpriseId:'OTHER',customerClidsGroup:'FOREIGN-NAV'}]};
  const mapped=api.taskUpdateFields(draft,row,data),delta=plain(onlyDelta(mapped.fields));
  assert.deepEqual(plain(mapped.errors),[]);
  assert.equal(delta.autoStart,1);assert.equal(delta.autoStartDay,'2026-10-01');assert.equal(delta.customerClidsCategory,5);
  assert.equal(delta.customerClidsGroup,'DEFAULT-NAV');assert.deepEqual(delta.clidPoolList,[{name:'池A',priority:1}]);
  draft.values.callerNumberId='NUM-2';
  assert(api.taskUpdateFields(draft,row,data).errors.some(item=>item.includes('固定外显号码')));
});
check('更新任务无号码池选择时省略可选列表，清空时显式传空数组',()=>{
  const data={instances:[{enterpriseId:'7522240',customerClidsGroup:'DEMO-DEFAULT'}]};
  const first=fixture(),draft=first.draft,row=first.row;
  draft.values.callerMode='navigation';
  const mapped=api.taskUpdateFields(draft,row,data);
  assert.deepEqual(plain(mapped.errors),[]);
  assert.equal(mapped.fields.customerClidsGroup,'DEMO-DEFAULT');
  assert(!Object.hasOwn(mapped.fields,'clidPoolList'));
  draft.editOriginalValues.clidPoolList=[{name:'旧号码池'}];draft.values.clidPoolList=[];
  assert.deepEqual(plain(api.taskUpdateFields(draft,row,data).fields.clidPoolList),[]);
});
check('无改动和缺少原值快照均不视作可提交',()=>{
  const {draft,row}=fixture();
  assert(api.taskUpdateFields(draft,row,{}).errors.some(item=>item.includes('请先修改')));
  delete draft.editOriginalValues;draft.values.description='新说明';
  assert(api.taskUpdateFields(draft,row,{}).errors.some(item=>item.includes('原任务设置快照')));
});
check('显式变更键仅映射点选字段，不把其他完整表单值作为更新',()=>{
  const {draft,row}=fixture();delete draft.editOriginalValues;
  draft.editChangedKeys=new Set(['name']);draft.values.name='新名称';draft.values.description='不应发出的说明';
  const mapped=api.taskUpdateFields(draft,row,{});
  assert.deepEqual(plain(mapped.errors),[]);
  assert.deepEqual(plain(onlyDelta(mapped.fields)),{name:'新名称'});
});
process.stdout.write(`PASS ${count} API task/update field checks\n`);
