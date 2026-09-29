/* Local API-311 task/create contract checks. Run with Node; no network. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..'),ctx={};
vm.createContext(ctx);
for(const name of ['alicti-number-status','alicti-retry','alicti-fields']){
  vm.runInContext(fs.readFileSync(path.join(root,'js/components',name+'.js'),'utf8'),ctx);
}
const fields=ctx.AliCtiFields;
const plain=value=>JSON.parse(JSON.stringify(value));
let count=0;
function check(name,run){run();count++;process.stdout.write(`✓ ${name}\n`);}

check('空值沿用文档默认，预测保留原任务，自动任务自动完成',()=>{
  const predictive=fields.taskSettings({},'预外呼');
  const automatic=fields.taskSettings({},'IVR 外呼');
  assert.deepEqual(plain(predictive.fields),{autoComplete:0});
  assert.deepEqual(plain(automatic.fields),{autoComplete:1});
  assert.equal(predictive.ok,true);
});
check('共同字段规范化并形成官方呼叫顺序 JSON',()=>{
  const result=fields.taskSettings({description:' 客户回访 ',businessTagNames:'A, B',autoComplete:'1',forceEndFlag:'1',stopScheduled:true,retryStrategyOnlyToday:'2',callPriority:{retryFirst:false,retryDesc:1,firstCallOrderType:2},concurrency:'0'},'预外呼');
  assert.equal(result.ok,true);
  assert.equal(result.fields.description,'客户回访');
  assert.equal(result.fields.businessTagNames,'A,B');
  assert.equal(result.fields.autoComplete,1);
  assert.equal(result.fields.forceEndFlag,1);
  assert.equal(result.fields.retryStrategyOnlyToday,2);
  assert.equal(result.fields.concurrency,0);
  assert.deepEqual(JSON.parse(result.fields.callPriorityStrategy).strategy,[
    {sort:1,type:'firstCall',orderType:2},{sort:2,type:'retryCall',desc:1}
  ]);
});
check('停用定时结束时不提交旧强制结束值',()=>{
  const result=fields.taskSettings({stopScheduled:false,forceEndFlag:1},'预外呼');
  assert.equal(result.ok,true);
  assert.equal(Object.hasOwn(result.fields,'forceEndFlag'),false);
});
check('预外呼专属参数正确映射且自动外呼不接受旧专属值',()=>{
  const values={callRouteStrategy:'2',agentTimeout:'5',wrapup:'10800',maxWaitTime:'600',quotiety:'3.00',predictAdjust:'400',answerRate:'100',warmUpDuration:'600',isRewarm:'0'};
  const predictive=fields.taskSettings(values,'预外呼');
  assert.equal(predictive.ok,true);
  assert.deepEqual(plain(predictive.fields),{autoComplete:0,callRouteStrategy:2,agentTimeout:5,wrapup:10800,maxWaitTime:600,quotiety:3,predictAdjust:400,answerRate:100,warmUpDuration:600,isRewarm:0});
  assert.deepEqual(plain(fields.taskSettings(values,'IVR 外呼').fields),{autoComplete:1});
});
check('每个数值字段的范围外值拒绝并指向对应输入',()=>{
  for(const [name,value,target] of [
    ['autoComplete',2,'wizardAutoComplete'],['retryStrategyOnlyToday',4,'wizardRetryToday'],
    ['callRouteStrategy',3,'wizardCallRouteStrategy'],['agentTimeout',4,'wizardAgentTimeout'],
    ['wrapup',10801,'wizardWrapup'],['maxWaitTime',9,'wizardMaxWaitTime'],
    ['quotiety','20.01','wizardQuotiety'],['quotiety','1.234','wizardQuotiety'],
    ['predictAdjust',49,'wizardPredictAdjust'],['answerRate',0,'wizardAnswerRate'],
    ['warmUpDuration',59,'wizardWarmUpDuration'],['isRewarm',2,'wizardIsRewarm']
  ]){
    const result=fields.taskSettings({[name]:value},'预外呼');
    assert.equal(result.ok,false,name);
    assert(result.issues.some(issue=>issue.target===target),name);
    assert.equal(Object.hasOwn(result.fields,name),false,name);
  }
});
check('业务标签、并发和呼叫顺序错误分别定位',()=>{
  const result=fields.taskSettings({businessTagNames:'A,',concurrency:0,callPriority:{retryFirst:'yes',retryDesc:2,firstCallOrderType:3}},'IVR 外呼');
  assert.deepEqual(plain(result.issues.map(issue=>issue.target)),['wizardBusinessTags','wizardRetryPriority','wizardRetryOrder','wizardFirstCallOrder','wizardConcurrency']);
  assert.equal(Object.hasOwn(result.fields,'callPriorityStrategy'),false);
  assert.equal(Object.hasOwn(result.fields,'concurrency'),false);
});
check('创建请求仅在 AI 转人工且有有效导航时提交',()=>{
  const data={instances:[{enterpriseId:'7522240',customerClidsGroup:'NAV-HQ'}],contactFlows:[{contactFlowId:'FLOW-1',enterpriseId:'7522240',providerIvrId:91002}]};
  const base={type:'预外呼',tenantId:'T',enterpriseId:'7522240',values:{name:'测试',cnos:['0012'],callStrategy:'4',callRouteStrategy:2,retryPolicy:ctx.AliCtiRetry.create('预外呼'),callerMode:'navigation',customerClidsGroup:'NAV-HQ'}};
  const missing=fields.taskFields(base,data);
  assert(missing.issues.some(issue=>issue.target==='wizard-contactFlowId'));
  const ready=fields.taskFields({...base,values:{...base.values,contactFlowId:'FLOW-1'}},data);
  assert.equal(ready.errors.length,0);
  assert.equal(ready.fields.callRouteStrategy,2);
  assert.equal(ready.fields.ivrId,91002);
});
check('未核验的模板、语音、动态上限和自定义字段不进入任务请求',()=>{
  const result=fields.taskSettings({templateName:'模板',customerMoh:'file',customerVoice:'file',userFields:'[]',callVariables:'[]',callLimitStrategy:'[]'},'预外呼');
  for(const key of ['templateName','customerMoh','customerVoice','userFields','callVariables','callLimitStrategy'])assert.equal(Object.hasOwn(result.fields,key),false,key);
});
process.stdout.write(`PASS ${count} API-311 task settings checks\n`);
