/** Followup optimistic version checks against canonical calls and persisted journals. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),checks=[];
const check=(name,fn)=>{fn();checks.push(name);};
const scope={enterpriseId:'7522240',tenantId:'HQ'},seedVersion='2026-09-10T10:00:00.000Z';
const seed=()=>[
 {callId:'C1',...scope,callee:'13800000001',businessType:'lead',externalDocumentId:'0012',endedAt:'2026-09-10T10:00:00',customerFollowup:{intentionLevel:'高意向',plannedStoreId:'A',plannedStoreName:'A门店',updatedAt:seedVersion}},
 {callId:'C2',...scope,callee:'13800000001',businessType:'lead',externalDocumentId:'12',endedAt:'2026-09-10T11:00:00',customerFollowup:{intentionLevel:'中意向',updatedAt:seedVersion}}
];
const journalKey='customer-followup-v1';
function create(storage=new Map(),calls=seed()){
 let fault=false,authorized=true;
 const context={Date,structuredClone,PlatformUI:{escape:String},CloudCallData:{calls,tenants:[{...scope,name:'总部',organizationScope:'HEADQUARTERS',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']},{tenantId:'A',enterpriseId:scope.enterpriseId,name:'A门店',organizationScope:'STORE',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}]},
  AppState:{effectiveAccess:()=>({valid:authorized,roleCode:'ADMIN'}),get:()=>({...scope,accountId:'USER',activeDomain:'CLOUD_CONTACT_CENTER'}),authorizeObject:(_,c)=>authorized&&c.enterpriseId===scope.enterpriseId&&c.tenantId===scope.tenantId},
  localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{if(fault)throw Error('quota');storage.set(key,value);}},
  CustomerDirectory:{phoneOf:c=>c?.callee||'',list:()=>[{...scope,phone:'13800000001',calls}],sync(){context.CustomerFollowup.overlay(calls);}}};
 context.window=context;vm.createContext(context);
 for(const file of ['mock/customer-followup.js','js/components/customer-business.js','js/components/customer-followup.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),context,{filename:file});
 return {context,calls,storage,api:context.CustomerFollowup,setFault:value=>fault=value,setAuthorization:value=>authorized=value};
}
let test=create(),first=test.calls[0],otherBefore=JSON.stringify(test.calls[1]);
let result=test.api.save(first,{...first.customerFollowup,intentionLevel:'低意向',plannedVisitAt:'2026-09-20T10:30'},{expectedVersion:seedVersion});
check('无日志的随包快照首次编辑成功',()=>assert.equal(result.ok,true));
check('首次成功写入日志和canonical通话',()=>{assert.equal(first.customerFollowup.intentionLevel,'低意向');assert.equal(JSON.parse(test.storage.get(journalKey)).entries.length,1);});
check('同手机号不同线索通话快照不串改',()=>assert.equal(JSON.stringify(test.calls[1]),otherBefore));
const savedVersion=result.values.updatedAt,storageSnapshot=test.storage.get(journalKey);
check('已有日志后过期编辑版本被拒绝',()=>{const outcome=test.api.save(first,{intentionLevel:'无意向'},{expectedVersion:seedVersion});assert.equal(outcome.ok,false);assert.match(outcome.message,/已更新/);assert.equal(test.storage.get(journalKey),storageSnapshot);});
test=create(test.storage);
check('刷新载入随包旧快照时持久化日志版本优先',()=>{const outcome=test.api.save(test.calls[0],{intentionLevel:'无意向'},{expectedVersion:seedVersion});assert.equal(outcome.ok,false);});
test.context.CustomerDirectory.sync();
check('刷新后overlay恢复保存值与版本',()=>{assert.equal(test.calls[0].customerFollowup.intentionLevel,'低意向');assert.equal(test.calls[0].customerFollowup.updatedAt,savedVersion);});
result=test.api.save(test.calls[0],{...test.calls[0].customerFollowup,intentionLevel:'中意向'},{expectedVersion:savedVersion});
check('刷新后的当前版本可以继续编辑',()=>assert.equal(result.ok,true));
test=create();const stale=structuredClone(test.calls[0]);test.calls[0].customerFollowup={intentionLevel:'无意向',updatedAt:'2026-09-11T10:00:00.000Z'};
check('无日志时不能相信调用方旧clone作为当前版本',()=>{const outcome=test.api.save(stale,{intentionLevel:'高意向'},{expectedVersion:stale.customerFollowup.updatedAt});assert.equal(outcome.ok,false);assert.equal(test.calls[0].customerFollowup.intentionLevel,'无意向');assert.equal(test.storage.has(journalKey),false);});
test=create();const canonicalBefore=JSON.stringify(test.calls),submittedBefore=JSON.stringify(test.calls[0]);test.setFault(true);
check('保存失败时通话数据和版本保持原状',()=>{const outcome=test.api.save(test.calls[0],{intentionLevel:'低意向'},{expectedVersion:seedVersion});assert.equal(outcome.ok,false);assert.equal(JSON.stringify(test.calls),canonicalBefore);assert.equal(JSON.stringify(test.calls[0]),submittedBefore);assert.equal(test.storage.has(journalKey),false);});
test.setFault(false);
check('恢复存储后原版本可以重试',()=>assert.equal(test.api.save(test.calls[0],{intentionLevel:'低意向'},{expectedVersion:seedVersion}).ok,true));
test=create();test.setAuthorization(false);
check('范围校验仍阻止越权保存',()=>{assert.equal(test.api.save(test.calls[0],{intentionLevel:'低意向'},{expectedVersion:seedVersion}).ok,false);assert.equal(test.storage.has(journalKey),false);});
test=create();delete test.calls[0].customerFollowup;
check('没有随包快照的新通话按空版本首次保存',()=>assert.equal(test.api.save(test.calls[0],{intentionLevel:'高意向'},{expectedVersion:''}).ok,true));
test=create();test.storage.set(journalKey,'invalid json');
check('日志不可读时不回退随包快照覆盖原数据',()=>{assert.equal(test.api.save(test.calls[0],{intentionLevel:'高意向'},{expectedVersion:seedVersion}).ok,false);assert.equal(test.storage.get(journalKey),'invalid json');});
console.log(JSON.stringify({passed:checks.length,failed:0,checks},null,2));
