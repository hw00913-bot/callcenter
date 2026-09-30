/* Number authorization is tenant-only. Exercise the actual page module and its stored-state recovery. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'js/pages/resource-lines.js'),'utf8');
const stateKey='cloud-number-resource-state-v1',checks=[],failures=[],clone=v=>JSON.parse(JSON.stringify(v));
function fixture(options={}){
  const tenants=[
    {tenantId:'HQ',name:'品牌总部',enterpriseId:'E1',organizationScope:'HEADQUARTERS',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']},
    {tenantId:'SHOP',name:'上海门店',enterpriseId:'E-SH',organizationScope:'STORE',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']},
    {tenantId:'DISABLED',name:'已停用门店',enterpriseId:'E-DIS',organizationScope:'STORE',status:'停用',capabilitySet:['CLOUD_CONTACT_CENTER']},
    {tenantId:'NO-CLOUD',name:'无云呼叫能力',enterpriseId:'E-NO',status:'启用',capabilitySet:[]},
    {tenantId:'BUILT-IN',name:'内置租户',enterpriseId:'E1',status:'启用',builtIn:true,capabilitySet:['CLOUD_CONTACT_CENTER']},
    {tenantId:'OTHER',name:'其他品牌总部',enterpriseId:'E2',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}
  ];
  const row={numberId:'N1',enterpriseId:'E1',number:'02100001234',status:'正常',businessStatus:'正常',usage:'呼入+呼出',aliyunUsage:'Bidirection',authorizedTenantIds:['HQ'],referenceCount:0,alictiNumber:{id:1,hotline:'02100001234',status:1,isInUse:1,isPredictiveLeft:1},...options.row};
  const actor={accountId:'SUPER',sessionId:'S1',enterpriseId:'E1',tenantId:'HQ',activeDomain:'CLOUD_CONTACT_CENTER',roleCode:'SUPER_ADMIN',valid:true,menu:true};
  const elements=new Map(),store=options.store||new Map(),toasts=[],changes=[],layers=[];
  const mount=(id,html)=>{
    const existing=elements.get(id)||{scrollIntoView(){},focus(){},querySelector(){return null;},querySelectorAll(selector){return selector==='input[name="numberTenant"]:checked'?c.selected.map(value=>({value})):[];}};
    Object.defineProperty(existing,'innerHTML',{configurable:true,get(){return this.markup||'';},set(value){this.markup=value;if(id==='number-assignment-content')parseTenants(value);}});
    existing.markup=html;elements.set(id,existing);return existing;
  };
  const parseTenants=html=>{c.selected=[...html.matchAll(/<input type="checkbox" name="numberTenant" value="([^"]+)"([^>]+)>/g)].filter(match=>/(?:^|\s)checked(?:\s|$)/.test(match[2])).map(match=>match[1]);};
  const ui={escape:v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),status:String,help:()=>'',empty:String,pageHeader:(a,b)=>a+b,toolbar:(a,b)=>a+b,pagination:()=>'',table:(columns,rows)=>rows.map(row=>columns.map(col=>col.label+':'+(col.render?col.render(row[col.key],row):row[col.key])).join('|')).join('\n'),
    openLayer(id,html,size,options){layers.push({id,html,size,options});mount(id,html);if(id==='number-detail'){mount('number-assignment-content',html);mount('number-assignment-error','');parseTenants(html);}},closeLayer(id){elements.delete(id);},confirm(config){c.confirm=config;}};
  const data={tasks:[],predictiveTasks:[],ivrTasks:[],calls:[],callPlans:[],phoneNumbers:[row,{...clone(row),numberId:'N2',enterpriseId:'E2',authorizedTenantIds:['OTHER']}],tenants,inboundRoutes:[]};
  for(const property of ['physicalSkillGroups','agents','agentSkills'])Object.defineProperty(data,property,{get(){throw Error('号码范围不应读取 '+property);}});
  const c={console,Date,JSON,Math,Set,Map,structuredClone,selected:[],failWrite:false,row,actor,store,layers,toasts,changes,addEventListener(){},CloudCallData:data,PlatformUI:ui,CSS:{escape:String},
    document:{getElementById:id=>elements.get(id)||null,querySelector:()=>({focus(){}})},sessionStorage:{getItem:key=>store.get(key)??null,setItem(key,value){if(c.failWrite)throw Error('Storage unavailable');store.set(key,value);}},
    AppState:{get:()=>actor,effectiveAccess:()=>({roleCode:actor.roleCode,valid:actor.valid,activeDomain:actor.activeDomain}),isSuper:()=>actor.roleCode==='SUPER_ADMIN',canMenu:()=>actor.menu,availableTenants:()=>tenants},
    CloudCallRuntime:{tenant:id=>tenants.find(t=>t.tenantId===id),instance:()=>({brandCustomerName:'测试品牌'}),addAudit(){}},
    AliCtiFields:{authFields:()=>({fields:{enterpriseId:actor.enterpriseId},pending:[]}),numberUpdateFields:(hotlines,changes)=>({endpoint:'enterpriseHotline/batchUpdateNumber',body:{numberList:hotlines,...changes},pending:[]}),numberFields:r=>({providerNumberId:r.id,numberType:r.numberType,providerStatus:r.status,uses:{isInUse:r.isInUse,isPredictiveLeft:r.isPredictiveLeft}})},
    CloudResourceRules:{changed:id=>changes.push(id)},AliCtiDemo:{numberOutcome:'success'},AliCtiAdapter:{},RouteRuntime:{refreshCurrent(){},openSecondary(){}},showToast:(message,level)=>toasts.push({message,level})};
  c.localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
  c.AliCtiInboundMock={rows:[],resources:{ivrs:[{id:'101',enterpriseId:'E1',ivrType:'1',tenantIds:['HQ']},{id:'102',enterpriseId:'E1',ivrType:'1',tenantIds:['SHOP']},{id:'103',enterpriseId:'E1',ivrType:'1',tenantIds:['HQ','SHOP']}],trunks:[{id:'1',enterpriseId:'E1',numberTrunk:'00001234',areaCode:'021',tenantIds:['HQ','SHOP']},{id:'2',enterpriseId:'E1',numberTrunk:'00005678',areaCode:'021',tenantIds:['HQ','SHOP']},{id:'3',enterpriseId:'E2',numberTrunk:'00001234',areaCode:'021',tenantIds:['OTHER']}],times:[],extens:[]}};
  c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'js/components/alicti-inbound.js'),'utf8'),c,{filename:'alicti-inbound.js'});vm.runInContext(source,c,{filename:'resource-lines.js'});vm.runInContext(fs.readFileSync(path.join(root,'js/pages/cloud-task-workspace.js'),'utf8'),c,{filename:'cloud-task-workspace.js'});c.api=c.Pages['resource-lines'];c.error=()=>elements.get('number-assignment-error')?.textContent||'';c.html=()=>layers.at(-1)?.html||'';c.saved=()=>JSON.parse(store.get(stateKey)||'[]');return c;
}
function check(name,fn){try{fn();checks.push(name);}catch(error){failures.push({name,message:error.message});}}
function open(c){c.api.openNumber('N1');assert(c.html().includes('号码详情'));}
function createRule(c,overrides={}){const result=c.AliCtiInbound.save({name:'当前呼入规则',routerType:1,ivrId:'101',active:1,priority:1,ruleTrunkProperty:'00001234',ruleTimeProperty:'',ruleAreaProperty:'',...overrides},{context:c.AliCtiInbound.context()});assert(result.ok,result.message);return result.row;}
check('号码详情只读展示唯一归属，没有租户分配和多层管理入口',()=>{const c=fixture();open(c);assert(c.html().includes('所属租户'));assert(c.html().includes('品牌总部'));assert(!/numberTenant|保存使用范围|设置外显用途|查看呼入规则/.test(c.html()));assert.equal(c.api.saveNumberScope,undefined);assert.equal(c.api.toggleTenant,undefined);assert(c.api.render().includes('所属租户:品牌总部'));assert(!c.api.render().includes('设置使用租户'));c.api.closeNumber();assert.equal(c.saved().length,0);});
check('读取详情不使用技能坐席关联，也不改变号码原始权限',()=>{const c=fixture();const before=JSON.stringify(c.row);open(c);c.api.openGrant('N1');assert.equal(JSON.stringify(c.row),before);assert.equal(c.saved().length,0);});
check('旧多租户授权快照不能覆盖当前唯一归属',()=>{const c=fixture({store:new Map([[stateKey,JSON.stringify([{numberId:'N1',enterpriseId:'E1',businessStatus:'正常',authorizedTenantIds:['HQ','SHOP'],localEnabled:false}])]])});assert.deepStrictEqual(clone(c.row.authorizedTenantIds),['HQ']);assert.equal(c.row.localEnabled,true);});
check('跨账号号码以及管理员操作不通过超级管理员权限校验',()=>{for(const patch of [{roleCode:'ADMIN'},{roleCode:'OPERATOR'},{valid:false},{menu:false},{activeDomain:'CRM'}]){const c=fixture();Object.assign(c.actor,patch);c.api.openNumber('N1');assert.equal(c.layers.length,0);assert(c.api.render().includes('无号码管理权限'));}const c=fixture();c.api.openNumber('N2');assert.equal(c.layers.length,0);});

check('业务引用按当前任务和启用呼入规则计算，不使用历史固定数量',()=>{const c=fixture({row:{referenceCount:99}});createRule(c);c.CloudCallData.tasks=[{taskId:'A',enterpriseId:'E1',status:'执行中',callerNumberId:'N1'},{taskId:'B',enterpriseId:'E1',status:'已暂停',planSnapshot:{callerNumberIds:['N1']}},{taskId:'C',enterpriseId:'E1',status:'待启动',executionConfig:{allowedCallerNumberIds:['N1']}},{taskId:'D',enterpriseId:'E1',status:'已完成',callerNumberId:'N1'},{taskId:'E',enterpriseId:'E2',status:'执行中',callerNumberId:'N1'}];assert(c.api.render().includes('3 个任务 · 1 条呼入规则'));});

check('不再提供供应商解绑入口，停用呼入规则不计为使用中',()=>{const c=fixture({row:{referenceCount:99}}),rule=createRule(c);c.AliCtiInbound.setActive(rule.id,2,c.AliCtiInbound.context());assert(c.api.render().includes('0 个任务 · 0 条呼入规则'));assert.equal(c.api.unbind,undefined);open(c);assert(!/永久解绑|从供应商账号解绑|在 AliCti 停用号码|在 AliCti 启用号码/.test(c.html()));assert(c.api.render().includes('停用本地使用'));});

check('本地停用不修改供应商状态授权规则和在途历史，仅暂停关联任务新拨号',()=>{
 const c=fixture({row:{referenceCount:99}});createRule(c);c.CloudCallData.calls=[{callId:'R',status:'振铃中',numberId:'N1'},{callId:'C',status:'通话中',numberId:'N1'},{callId:'H',status:'已结束',numberId:'N1'}];
 c.CloudCallData.tasks=[{taskId:'A',enterpriseId:'E1',status:'执行中',callType:'预外呼',callerNumberId:'N1',providerStatusCode:1,completed:3,activeCallIds:['R','C']},{taskId:'B',enterpriseId:'E1',status:'待启动',callType:'IVR 外呼',planSnapshot:{callerNumberIds:['N1']}},{taskId:'C',enterpriseId:'E1',status:'已完成',callType:'预外呼',callerNumberId:'N1'},{taskId:'D',enterpriseId:'E2',status:'执行中',callType:'预外呼',callerNumberId:'N1'},{taskId:'E',enterpriseId:'E1',status:'执行中',callType:'预外呼',callerNumberId:'N2'}];
 const evidence=JSON.stringify([c.row.alictiNumber,c.row.authorizedTenantIds,c.CloudCallData.calls,c.store.get('alicti-inbound-router-v1')]);
 c.api.setLocalEnabled('N1',false);assert(c.confirm.body.includes('已发起的通话正常继续'));assert.equal(c.row.localEnabled,true);c.confirm.onConfirm();
 assert.equal(c.row.localEnabled,false);assert.equal(c.row.businessStatus,'正常');assert.equal(c.AliCtiDemo.lastNumberUpdate,undefined);assert.equal(c.AliCtiAdapter.lastRequest,undefined);assert.equal(JSON.stringify([c.row.alictiNumber,c.row.authorizedTenantIds,c.CloudCallData.calls,c.store.get('alicti-inbound-router-v1')]),evidence);
 for(const t of c.CloudCallData.tasks.slice(0,2)){assert(t.stopNewDialing);assert.deepStrictEqual(clone(t.resourcePause.numberIds),['N1']);}for(const t of c.CloudCallData.tasks.slice(2))assert(!t.resourcePause);assert.equal(c.CloudCallData.tasks[0].status,'执行中');assert.equal(c.CloudCallData.tasks[0].providerStatusCode,1);assert.equal(c.CloudCallData.tasks[0].completed,3);assert.deepStrictEqual(clone(c.CloudCallData.tasks[0].activeCallIds),['R','C']);assert(c.api.render().includes('本地已停用'));
 const stored=c.store.get(stateKey),fresh=fixture({store:c.store});assert.equal(fresh.row.localEnabled,false);assert.equal(fresh.store.get(stateKey),stored);c.api.setLocalEnabled('N1',true);c.confirm.onConfirm();assert.equal(c.row.localEnabled,true);assert(c.CloudCallData.tasks[0].stopNewDialing);assert(c.CloudCallData.tasks[0].resourcePause);assert.equal(c.AliCtiDemo.lastNumberUpdate,undefined);
});

check('本地停用后刷新维持许可，恢复不绕过供应商停用',()=>{const c=fixture({row:{businessStatus:'已隔离',status:'已隔离',importedFrom:'ALICTI',alictiNumber:{id:1,hotline:'02100001234',status:0,isInUse:1}}});c.api.setLocalEnabled('N1',false);c.confirm.onConfirm();c.api.setLocalEnabled('N1',true);c.confirm.onConfirm();assert.equal(c.row.localEnabled,true);assert.equal(c.row.businessStatus,'已隔离');assert.equal(c.row.alictiNumber.status,0);assert.equal(c.AliCtiDemo.lastNumberUpdate,undefined);});

check('本地操作保存失败、会话改变或并发状态改变不写入',()=>{const c=fixture();c.api.setLocalEnabled('N1',false);c.failWrite=true;c.confirm.onConfirm();assert.equal(c.row.localEnabled,true);assert.equal(c.saved().length,0);const d=fixture();d.api.setLocalEnabled('N1',false);d.actor.sessionId='CHANGED';d.confirm.onConfirm();assert.equal(d.row.localEnabled,true);const e=fixture();e.api.setLocalEnabled('N1',false);e.row.localEnabled=false;e.confirm.onConfirm();assert.equal(e.saved().length,0);});

check('无效角色跨账号或旧上下文不能操作本地许可',()=>{for(const patch of [{roleCode:'ADMIN'},{roleCode:'OPERATOR'},{enterpriseId:'E2'},{menu:false},{valid:false}]){const c=fixture();Object.assign(c.actor,patch);c.api.setLocalEnabled('N1',false);assert.equal(c.confirm,undefined);assert.equal(c.saved().length,0);}});

check('供应商启停与本地许可分别保存且在途记录不改写',()=>{const c=fixture();c.CloudCallData.calls=[{callId:'C',status:'通话中'}];const calls=JSON.stringify(c.CloudCallData.calls);c.api.setLocalEnabled('N1',false);c.confirm.onConfirm();c.api.isolate('N1');assert(c.confirm.title.includes('AliCti'));assert(c.confirm.body.includes('通话正常继续'));c.confirm.onConfirm();assert.equal(c.row.alictiNumber.status,0);assert.equal(c.AliCtiDemo.lastNumberUpdate.request.body.status,0);assert.equal(c.row.localEnabled,false);c.api.restore('N1');c.confirm.onConfirm();assert.equal(c.row.alictiNumber.status,1);assert.equal(c.row.localEnabled,false);assert.equal(JSON.stringify(c.CloudCallData.calls),calls);});

check('恢复拒绝跨账号授权和错误账号快照，不影响原号码',()=>{for(const record of [{numberId:'N1',enterpriseId:'E2',businessStatus:'正常',authorizedTenantIds:['HQ']},{numberId:'N1',enterpriseId:'E1',businessStatus:'正常',authorizedTenantIds:['OTHER']}]){const c=fixture({store:new Map([[stateKey,JSON.stringify([record])]])});assert.deepStrictEqual(clone(c.row.authorizedTenantIds),['HQ']);}});
console.log(JSON.stringify({result:failures.length?'fail':'pass',scope:'Local number page authorization, UI markup, permissions, concurrency and persistence; no live provider calls',count:checks.length,checks,failures},null,2));if(failures.length)process.exitCode=1;
