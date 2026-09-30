/* One selected caller navigation per task, with optional multiple number pools. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),checks=[];
const plain=value=>JSON.parse(JSON.stringify(value));
const c={AliCtiRetry:{validate:()=>'',map:()=>({fields:{},pending:[]})},AliCtiIvr:{resolve:()=>({ok:true,ivrId:91001})}};
c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'js/components/alicti-fields.js'),'utf8'),c);
const fields=c.AliCtiFields;
const account=(id='7522240')=>({enterpriseId:id,callerNavigations:[{name:'销售外显',customerClidsGroup:'NAV-HQ'},{name:'售后外显',customerClidsGroup:'NAV-SERVICE'}]});
const settings=(group='NAV-HQ',extra={})=>({callerMode:'navigation',customerClidsGroup:group,clidPoolList:[{name:'总部销售',priority:1},{name:'总部售后',priority:2}],customerTimeout:30,...extra});
function check(name,fn){fn();checks.push(name);}
check('一个账号列出多个导航且无默认项',()=>{
  assert.deepEqual(plain(fields.callerNavigationOptions(account())),plain(account().callerNavigations));
  assert.deepEqual(plain(fields.callerNavigationOptions({callerNavigations:[{name:'一',customerClidsGroup:'X'},{name:'二',customerClidsGroup:'X'}]})),[]);
  assert.deepEqual(plain(fields.callerNavigationOptions({customerClidsGroup:'OLD-SINGLE'})),[]);
});
check('任务选择保留输入标识并读取当前导航名称',()=>{
  const input=settings('NAV-SERVICE',{callerMode:'fixed',callerNumberId:'OLD-NUMBER',callerNavigationName:'旧名称'});
  const before=JSON.stringify(input),value=fields.callerSettingsFromAccount(account(),input);
  assert.equal(value.callerMode,'navigation');assert.equal(value.customerClidsGroup,'NAV-SERVICE');assert.equal(value.callerNavigationName,'售后外显');
  assert.equal(value.callerNumberId,'');assert.equal(JSON.stringify(input),before);
  assert.equal(fields.callerSettingsFromAccount(account(),{}).customerClidsGroup,'');
});
check('创建请求传单个所选导航和两个号码池',()=>{
  const draft={type:'预外呼',tenantId:'T',enterpriseId:'7522240',values:{name:'客户联系',cnos:['0012'],callStrategy:'4',...settings('NAV-SERVICE')}};
  const result=fields.taskFields(draft,{instances:[account()],agents:[]});
  assert.deepEqual(plain(result.errors),[]);assert.equal(result.fields.customerClidsCategory,5);
  assert.equal(result.fields.customerClidsGroup,'NAV-SERVICE');
  assert.deepEqual(plain(result.fields.clidPoolList),[{name:'总部销售',priority:1},{name:'总部售后',priority:2}]);
  assert(!Object.hasOwn(result.fields,'callerNavigations'));
});
check('未选和已移除导航均不能提交任务',()=>{
  for(const group of ['', 'NAV-REMOVED']){
    const draft={type:'IVR 外呼',tenantId:'T',enterpriseId:'7522240',values:{name:'自动联系',providerIvrId:'91001',...settings(group)}};
    const result=fields.taskFields(draft,{instances:[account()]});
    assert(result.errors.some(message=>message.includes(group?'所选外显导航已不在当前账号':'请选择本任务使用的外显导航')));
    assert(!Object.hasOwn(result.fields,'customerClidsGroup'));
  }
});
check('号码池优先级与超时继续遵循接口取值',()=>{
  const empty=fields.validateCallerSettings(settings('NAV-HQ',{clidPoolList:[]}));assert(empty.ok);assert(!Object.hasOwn(empty.fields,'clidPoolList'));
  const pools=fields.validateCallerSettings(settings('NAV-HQ',{clidPoolList:[{name:' A ',priority:''},{name:'B',priority:'0'},{name:'C',priority:'-2'}]}));
  assert(pools.ok);assert.deepEqual(plain(pools.fields.clidPoolList),[{name:'A'},{name:'B',priority:0},{name:'C',priority:-2}]);
  for(const priority of [1.5,'1.5','abc',NaN,Infinity,true,null,Number.MAX_SAFE_INTEGER+1])assert(!fields.validateCallerSettings(settings('NAV-HQ',{clidPoolList:[{name:'A',priority}]})).ok);
  for(const timeout of [5,'5',30,'60',60])assert(fields.validateCallerSettings(settings('NAV-HQ',{customerTimeout:timeout})).ok);
  for(const timeout of ['',null,undefined,false,0,4,61,30.5,'30.5',[],{}])assert(!fields.validateCallerSettings(settings('NAV-HQ',{customerTimeout:timeout})).ok);
});
check('已建任务详情保持保存时的导航快照',()=>{
  const task={...settings('NAV-HQ',{callerNavigationName:'销售外显'}),executionConfig:settings('NAV-HQ',{callerNavigationName:'销售外显'}),planSnapshot:settings('NAV-SERVICE',{callerNavigationName:'售后外显'})};
  assert.equal(fields.taskCallerSettings(task).customerClidsGroup,'NAV-SERVICE');
  assert.equal(fields.callerSettingsFromAccount(account(),fields.taskCallerSettings(task)).customerClidsGroup,'NAV-SERVICE');
  assert.equal(fields.taskCallerSettings(task).customerClidsGroup,'NAV-SERVICE');
});
const {setup}=require('./verify-predictive-strategy.cjs');
function create(type,group){
  const ctx=setup(),w=ctx.CloudTaskWorkspace;
  w.start(type);w.update('name',type+'导航选择验证');
  if(type==='预外呼'){w.next();assert.equal(ctx.active().step,4);w.setResource('skillGroupId','G');}
  else {w.setResource('providerIvrId','91001');w.next();assert.equal(ctx.active().step,5);}
  assert(w.render().includes('wizardCallerNavigation'));
  assert(w.render().includes('NAV-HQ')&&w.render().includes('NAV-SERVICE'));
  assert.equal(ctx.active().values.customerClidsGroup,'');
  w.setCallerNavigation(group);assert.equal(ctx.active().values.customerClidsGroup,group);
  w.next();for(let n=0;n<5&&ctx.active().step!==6;n++)w.next();
  assert.equal(ctx.active().step,6);w.submit();
  const task=ctx.CloudCallData.tasks[0];assert(task);return {ctx,w,task};
}
check('预外呼显式选择售后导航后创建与详情一致',()=>{
  const {w,task}=create('预外呼','NAV-SERVICE');
  assert.equal(task.alictiCreateDraft.fields.customerClidsGroup,'NAV-SERVICE');
  assert(w.renderCenter({taskId:task.taskId,tab:'resources'}).includes('售后外显 · NAV-SERVICE'));
});
check('自动外呼显式选择销售导航后创建与详情一致',()=>{
  const {w,task}=create('IVR 外呼','NAV-HQ');
  assert.equal(task.alictiCreateDraft.fields.customerClidsGroup,'NAV-HQ');
  assert(w.renderCenter({taskId:task.taskId,tab:'resources'}).includes('总部外显 · NAV-HQ'));
});
check('切换导航清空之前选择的号码池',()=>{
  const ctx=setup(),w=ctx.CloudTaskWorkspace;w.start('预外呼');w.next();w.setResource('skillGroupId','G');w.setCallerNavigation('NAV-HQ');
  w.addCallerPool();w.updateCallerPool(0,'name','旧池');w.updateCallerPool(0,'priority',1);
  assert.equal(ctx.active().values.clidPoolList[0].name,'旧池');
  w.setCallerNavigation('NAV-SERVICE');
  assert.deepEqual(plain(ctx.active().values.clidPoolList),[]);
});
check('复制保留所选导航，目录移除后不能继续',()=>{
  const {ctx,w,task}=create('预外呼','NAV-SERVICE');w.copyTask(task.taskId);
  assert.equal(ctx.active().values.customerClidsGroup,'NAV-SERVICE');
  ctx.CloudCallData.instances[0].callerNavigations=ctx.CloudCallData.instances[0].callerNavigations.filter(row=>row.customerClidsGroup!=='NAV-SERVICE');
  w.next();assert.equal(ctx.active().step,4);assert.match(w.render(),/原导航已移除，请重新选择/);
  assert(w.simulationResourceError(task).includes('外显导航已不在当前账号中'));
});
console.log(JSON.stringify({result:'pass',count:checks.length,checks},null,2));
