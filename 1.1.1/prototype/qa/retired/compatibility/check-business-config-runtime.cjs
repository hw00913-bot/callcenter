/* Invalid legacy settings remain repairable without presenting impossible controls to agents. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.argv[2]||path.resolve(__dirname,'..'),storage=new Map();
const scope={enterpriseId:'e1',tenantId:'t1'},state={...scope,accountId:'a1',sessionId:'s1',activeDomain:'CLOUD_CONTACT_CENTER'};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const w={console,structuredClone,setTimeout,clearTimeout,window:null,document:{querySelectorAll:()=>[],getElementById:()=>null,addEventListener:()=>{}},
 localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value))},
 AppState:{get:()=>state,effectiveAccess:()=>({roleCode:'ADMIN',valid:true}),authorizeObject:()=>true},
 PlatformUI:{escape:esc},CloudCallData:{tenants:[{...scope,status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}],calls:[]},
 CustomerDirectory:{phoneOf:call=>call?.customerPhone,list:()=>[]},CallState:{view:call=>({answered:call.answered})},
 BusinessData:{entry:id=>({'d-series':{capabilityId:'series'},'d-store':{capabilityId:'store'}})[id],capability:id=>({kind:id,queryConditions:id==='store'?[{key:'seriesCode',label:'车系',required:true,sourceKind:'series',valueKey:'code',help:'此接口需要根据车系查询门店，请选择提供车系值的字段。'}]:[]}),available:()=>true,sourceVersion:()=>1},addEventListener:()=>{}};
w.window=w;vm.createContext(w);
for(const f of ['customer-business.js','business-interface-field.js','customer-followup.js'])vm.runInContext(fs.readFileSync(path.join(root,'js/components',f),'utf8'),w,{filename:f});
const M=w.CustomerBusiness,C=w.CustomerFollowup,F=w.BusinessInterfaceField;let passed=0;
const check=(ok,msg)=>{assert.ok(ok,msg);passed++;},copy=value=>structuredClone(value);
const call={...scope,callId:'runtime-qa',accountId:'a1',customerPhone:'13800000001',businessType:'lead',endedAt:'2026-10-16T00:00:00Z',direction:'呼出',callType:'人工外呼',answered:true,intentionSeriesCode:'NEV-A',intentionStoreCode:'N01',callSource:'NATIVE_WORKBENCH',processingStatus:'待填写'};
w.CloudCallData.calls.push(call);
const normal=M.catalog(scope), original={version:3,revision:0,seriesSelectionPolicy:'single',scopes:[{...scope,types:copy(normal.rows),fields:copy(normal.fields)}]};
const ref=(bundle,id)=>bundle.types.find(row=>row.id==='lead').fields.find(row=>row.fieldId===id),put=d=>storage.set(M.storageKey,JSON.stringify(d));
let values=C.empty(call);
check(!M.configurationIssue('lead',scope),'normal configuration has no repair issue');
check(C.form(values,call,'runtime','AgentWorkbench.setFollowup').includes('data-interface-field="intendedSeries"'),'valid configuration presents single-series input');
const broken=copy(original), bundle=broken.scopes[0];ref(bundle,'intendedSeries').enabled=false;ref(bundle,'intendedStore').required=true;put(broken);const before=storage.get(M.storageKey);
check(M.catalog(scope).ok,'old incomplete category stays readable for repair');
check(M.configurationIssue('lead',scope).includes('关联字段'),'old orphan-store setting has a specific repair reason');
let html=C.form(values,call,'runtime','AgentWorkbench.setFollowup');
check(html.includes('配置待修复')&&html.includes('请联系管理员'),'agent sees the actionable configuration warning');
check(!html.includes('data-interface-field='),'agent is not shown impossible interface selectors');
check(html.includes('runtime-plannedStoreName'),'ordinary business fields remain editable');
check(html.includes('data-imported-customer-info')&&html.includes('NEV-A')&&html.includes('N01'),'original imported information stays visible');
check(!html.includes('核对导入信息并确认带入'),'invalid configuration does not offer a broken import action');
let result=C.validate(values,call);check(!result.ok&&result.field==='businessType'&&result.message.includes('配置需修复'),'connected call cannot submit incomplete settings');
check(!C.save(call,values,{wrapping:true,expectedVersion:''}).ok&&!storage.has('customer-followup-v1'),'configuration rejection writes no follow-up history');
call.answered=null;check(!C.validate(values,call).ok,'unknown result does not gain the unanswered exception');
call.answered=false;check(C.validate(values,call).ok,'ended unanswered outbound with empty intentions keeps the original exception');
check(!C.validate({...values,intendedStore:{code:'N01',name:'旧值',entryId:'d-store',state:'valid',sourceVersion:1}},call).ok,'unanswered exception cannot bypass populated interface validation');
call.direction='呼入';check(!C.validate(values,call).ok,'inbound is not treated as unanswered outbound');call.direction='呼出';call.answered=true;
check(storage.get(M.storageKey)===before,'warnings and validation never rewrite legacy settings');
const repaired=M.get('lead',scope);repaired.fields.find(row=>row.fieldId==='intendedSeries').enabled=true;check(M.save(repaired,scope).ok&&!M.configurationIssue('lead',scope),'administrator can repair the old category');
values=C.empty(call);values.intendedSeries={code:'NEV-A',name:'模拟车系A',type:'NEV',entryId:'d-series',state:'valid',sourceVersion:1};const storeField=M.fields('lead',scope).find(row=>row.id==='intendedStore');values.intendedStore={code:'N01',name:'模拟门店一',type:'NEV',entryId:'d-store',state:'valid',sourceVersion:1,verifiedScope:F.conditions(storeField,values,call).stamp};
check(C.validate(values,call).ok,'after repair the required store can be completed normally');
check(C.form(values,call,'runtime','AgentWorkbench.setFollowup').includes('data-interface-field="intendedStore"'),'repaired configuration restores selectors');
const ambiguous=copy(original), a=ambiguous.scopes[0];delete ambiguous.seriesSelectionPolicy;a.fields.push({...copy(a.fields.find(row=>row.id==='intendedSeries')),id:'secondSeries',label:'另一个车系'},{...copy(a.fields.find(row=>row.id==='intendedStore')),id:'secondStore',label:'另一个门店',depends:['secondSeries']});a.types.find(row=>row.id==='lead').fields.push({fieldId:'secondSeries',enabled:true,required:false},{fieldId:'secondStore',enabled:true,required:true});put(ambiguous);
check(M.catalog(scope).ok,'conflicting legacy dependencies remain accessible to administrators');
check(M.configurationIssue('lead',scope).includes('不同车系'),'ambiguous dependency sources are explicit instead of guessed');
html=C.form(C.empty(call),call,'runtime','AgentWorkbench.setFollowup');
check(!html.includes('data-interface-field=')&&html.includes('不同车系'),'agent never receives a multi-series form from a legacy conflict');
check(!C.validate(C.empty(call),call).ok,'connected call cannot submit unresolved legacy conflicts');
const fixed=M.get('lead',scope);fixed.fields=fixed.fields.filter(row=>!['secondStore','secondSeries'].includes(row.fieldId));check(M.save(fixed,scope).ok&&!M.configurationIssue('lead',scope),'resolving the conflicting pair clears the runtime issue');
console.log(JSON.stringify({passed,scope:'repairable legacy settings, agent guards and original unanswered exception'}));
