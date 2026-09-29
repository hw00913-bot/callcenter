/* One fixed default caller navigation per enterpriseId. Synthetic data; no supplier requests. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),checks=[],plain=value=>JSON.parse(JSON.stringify(value));
function load(c,file){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c,{filename:file});}
function check(name,run){run();checks.push(name);}
function context(){
  const c={AliCtiRetry:{validate:()=>'',map:()=>({fields:{},pending:[]})},AliCtiIvr:{resolve:()=>({ok:true,ivrId:91001})}};
  c.window=c;vm.createContext(c);load(c,'js/components/alicti-fields.js');return c;
}
const account=(id='NAV-HQ')=>({enterpriseId:'7522240',customerClidsGroup:id});
const settings=(extra={})=>({callerMode:'navigation',customerClidsGroup:'NAV-HQ',clidPoolList:[{name:'总部销售',priority:1}],customerTimeout:30,...extra});
const c=context(),f=c.AliCtiFields;

check('每个账号仅读取一个固定默认导航标识，不读取任务候选目录',()=>{
  const original={...account(' NAV-HQ '),callerNavigations:[{name:'另一导航',customerClidsGroup:'NAV-OTHER'}]},before=JSON.stringify(original);
  assert.deepEqual(plain(f.callerNavigationOptions(original)),[{name:'默认外显导航',customerClidsGroup:'NAV-HQ'}]);
  assert.deepEqual(plain(f.callerNavigationOptions({enterpriseId:'7522240',callerNavigations:original.callerNavigations})),[]);
  assert.equal(JSON.stringify(original),before);
});
check('任务配置自动使用账号标识，覆盖草稿中残留的其它导航或固定号码',()=>{
  const input=settings({callerMode:'fixed',callerNumberId:'N-OLD',customerClidsGroup:'NAV-OLD',callerNavigationName:'旧名称'}),before=JSON.stringify(input);
  const value=f.callerSettingsFromAccount(account(),input);
  assert.equal(value.callerMode,'navigation');assert.equal(value.customerClidsGroup,'NAV-HQ');
  assert.equal(value.callerNumberId,'');assert.equal(value.callerNavigationName,'');
  assert.deepEqual(plain(value.clidPoolList),input.clidPoolList);assert.equal(value.customerTimeout,30);
  value.clidPoolList[0].name='修改副本';assert.equal(JSON.stringify(input),before);
});
check('账号未配置默认标识时，纯字段映射不能伪造成功',()=>{
  for(const missing of ['', '   ',null,undefined]){
    const value=f.callerSettingsFromAccount({...account(),customerClidsGroup:missing},settings({customerClidsGroup:'NAV-OLD'}));
    const result=f.validateCallerSettings(value,{requireNavigation:true});
    assert.equal(result.ok,false);assert.equal(result.target,'wizardCallerNavigation');
    assert.deepEqual(plain(result.fields),{});
  }
});
check('预外呼和自动外呼创建请求均使用各自账号的固定标识',()=>{
  for(const [type,enterpriseId,group] of [['预外呼','7522240','NAV-HQ'],['IVR 外呼','7522241','NAV-SH']]){
    const data={instances:[account(),{enterpriseId:'7522241',customerClidsGroup:'NAV-SH'}],contactFlows:[]};
    const draft={type,tenantId:'T',enterpriseId,values:{name:'客户联系',cnos:['0012'],callStrategy:'4',providerIvrId:'91001',...settings({customerClidsGroup:'NAV-STALE',customerTimeout:45})}};
    const result=f.taskFields(draft,data);
    assert.deepEqual(plain(result.errors),[]);assert.equal(result.fields.customerClidsCategory,5);
    assert.equal(result.fields.customerClidsGroup,group);assert.equal(result.fields.customerTimeout,45);
    assert.deepEqual(plain(result.fields.clidPoolList),settings().clidPoolList);
    for(const key of ['callerMode','callerNumberId','callerNavigationName','callerNavigations'])assert(!Object.hasOwn(result.fields,key));
  }
});
check('创建请求缺少账号默认标识时阻止提交，草稿里的标识不会补位',()=>{
  for(const type of ['预外呼','IVR 外呼']){
    const result=f.taskFields({type,tenantId:'T',enterpriseId:'7522240',values:{name:'测试',cnos:['0012'],callStrategy:'4',providerIvrId:'91001',...settings()}},{instances:[account('')],contactFlows:[]});
    assert(result.errors.some(message=>message.includes('默认外显导航')));
    assert(!Object.hasOwn(result.fields,'customerClidsGroup'));
  }
});
check('编辑号码池时自动传当前账号默认导航，忽略旧任务标识',()=>{
  const draft={type:'预外呼',tenantId:'T',enterpriseId:'7522240',editChangedKeys:['clidPoolList'],values:settings({customerClidsGroup:'NAV-OLD',clidPoolList:[{name:'新号码池',priority:2}]})};
  const task={tenantId:'T',enterpriseId:'7522240',callType:'预外呼',providerTaskId:8001,alictiCreateDraft:{fields:{callGroupType:1,customerClidsCategory:5,customerClidsGroup:'NAV-OLD'}}};
  const result=f.taskUpdateFields(draft,task,{instances:[account()],agents:[]});
  assert.deepEqual(plain(result.errors),[]);assert.equal(result.endpoint,'task/update');
  assert.equal(result.fields.customerClidsCategory,5);assert.equal(result.fields.customerClidsGroup,'NAV-HQ');
  assert.deepEqual(plain(result.fields.clidPoolList),[{name:'新号码池',priority:2}]);
  const missing=f.taskUpdateFields(draft,task,{instances:[account('')],agents:[]});
  assert(missing.errors.some(message=>message.includes('默认外显导航')));
});
check('号码池和接听等待时间仍遵循接口取值',()=>{
  assert(!Object.hasOwn(f.validateCallerSettings(settings({clidPoolList:[]})).fields,'clidPoolList'));
  const pools=f.validateCallerSettings(settings({clidPoolList:[{name:' A ',priority:''},{name:'B',priority:'0'},{name:'C',priority:'-2'}]}));
  assert(pools.ok);assert.deepEqual(plain(pools.fields.clidPoolList),[{name:'A'},{name:'B',priority:0},{name:'C',priority:-2}]);
  for(const priority of [1.5,'1.5','abc',NaN,Infinity,true,null,Number.MAX_SAFE_INTEGER+1])assert(!f.validateCallerSettings(settings({clidPoolList:[{name:'A',priority}]})).ok);
  for(const list of ['A',{},null,[null],[{}],[{name:' '}],[{name:'A'},{name:' A '}]])assert(!f.validateCallerSettings(settings({clidPoolList:list})).ok);
  for(const timeout of [5,'5',30,'60',60])assert(f.validateCallerSettings(settings({customerTimeout:timeout})).ok);
  for(const timeout of ['',null,undefined,false,0,4,61,30.5,'30.5',[],{}])assert(!f.validateCallerSettings(settings({customerTimeout:timeout})).ok);
});
check('任务创建后的详情从已保存的任务读取，不因账号变更改写历史',()=>{
  const task={...settings({customerClidsGroup:'NAV-CREATED'}),executionConfig:settings({customerClidsGroup:'NAV-EXEC'}),planSnapshot:settings({customerClidsGroup:'NAV-FROZEN'})};
  assert.equal(f.taskCallerSettings(task).customerClidsGroup,'NAV-FROZEN');
  assert.equal(f.callerSettingsFromAccount(account('NAV-NEW'),f.taskCallerSettings(task)).customerClidsGroup,'NAV-NEW');
  assert.equal(f.taskCallerSettings(task).customerClidsGroup,'NAV-FROZEN');
});
check('客户名单显式外显号码仍逐客户传值，不从任务号码池推断',()=>{
  const result=f.importFields({providerTaskId:123},[{id:'C1',phone:'13900000001',clid:'02100006102'},{id:'C2',phone:'13900000002'}],{name:'名单',batchId:'B1',isRepeat:0});
  assert.equal(result.pending.length,0);assert.equal(result.fields.taskTelList[0].clid,'02100006102');
  assert(!Object.hasOwn(result.fields.taskTelList[1],'clid'));
});

const {setup:workspaceContext}=require('./verify-predictive-strategy.cjs');
function wizardContext(saved=[]){
  const w=workspaceContext(saved);w.CloudCallData.instances=[account(),{enterpriseId:'7522241',customerClidsGroup:'NAV-SH'}];return w;
}
function startWizard(c,type){
  const w=c.CloudTaskWorkspace;assert.equal(w.start(type),true);w.update('name',type+'默认导航任务');
  if(type==='预外呼'){w.next();assert.equal(c.active().step,4);w.setResource('skillGroupId','G');}
  else{w.setResource('providerIvrId','91001');w.next();}
  return w;
}
function advanceToReview(c,w){
  for(let i=0;i<5&&c.active().step!==6;i++)w.next();
  assert.equal(c.active().step,6);
}
check('两类真实向导只展示账号默认导航，提交后的任务与请求一致',()=>{
  for(const type of ['预外呼','IVR 外呼']){
    const wc=wizardContext(),w=startWizard(wc,type),html=w.render();
    assert(html.includes('wizardCallerNavigation'));assert(html.includes('NAV-HQ'));
    assert(!html.includes('name="callerMode"'));assert(!html.includes('setCallerNavigation('));
    w.update('customerTimeout','45');advanceToReview(wc,w);w.submit();
    const task=wc.CloudCallData.tasks.at(-1);assert(task,type);
    for(const source of [task,task.executionConfig]){
      assert.equal(source.callerMode,'navigation');assert.equal(source.customerClidsGroup,'NAV-HQ');
      assert.equal(source.callerNumberId,'');assert.equal(source.customerTimeout,45);
    }
    assert.equal(task.alictiCreateDraft.fields.customerClidsCategory,5);
    assert.equal(task.alictiCreateDraft.fields.customerClidsGroup,'NAV-HQ');
    assert(w.renderCenter({taskId:task.taskId,tab:'resources'}).includes('默认外显导航 · NAV-HQ'));
  }
});
check('缺默认标识时向导停在设置页，无法生成任务',()=>{
  const wc=wizardContext(),w=startWizard(wc,'预外呼');wc.CloudCallData.instances[0].customerClidsGroup='';
  w.next();assert.equal(wc.active().step,4);w.submit();assert.equal(wc.CloudCallData.tasks.length,0);
  assert(w.render().includes('未配置默认外显导航'));
});
check('草稿或复制任务继续配置时，使用账号当前固定标识并保留超时',()=>{
  const wc=wizardContext(),w=startWizard(wc,'预外呼');w.update('customerTimeout','45');assert(w.saveDraft());
  const draftId=wc.active().draftId,saved=wc.drafts(),reloaded=wizardContext(saved);
  reloaded.CloudCallData.instances[0].customerClidsGroup='NAV-HQ-NEW';
  reloaded.CloudTaskWorkspace.start('预外呼',draftId);
  advanceToReview(reloaded,reloaded.CloudTaskWorkspace);reloaded.CloudTaskWorkspace.submit();
  const task=reloaded.CloudCallData.tasks[0];assert(task);
  assert.equal(task.customerClidsGroup,'NAV-HQ-NEW');assert.equal(task.customerTimeout,45);
  reloaded.CloudCallData.instances[0].customerClidsGroup='NAV-HQ-COPY';
  reloaded.CloudTaskWorkspace.copyTask(task.taskId);
  assert.equal(reloaded.active().values.customerClidsGroup,'NAV-HQ-COPY');
  assert.equal(reloaded.active().values.customerTimeout,45);
  assert.equal(task.customerClidsGroup,'NAV-HQ-NEW');
});
console.log(JSON.stringify({result:'pass',count:checks.length,checks},null,2));
