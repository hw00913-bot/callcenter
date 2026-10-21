/* Customer archive projections use saved call intentions, never a live provider query. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const storage = new Map();
const scope = { enterpriseId:'7522240', tenantId:'TEN-NISSAN-HQ' };
const state = { ...scope, accountId:'aggregate-qa', sessionId:'aggregate-qa-session', activeDomain:'CLOUD_CONTACT_CENTER' };
const win = {
  console, structuredClone, Date, Map, Set, JSON, Object, String, Array, Number,
  crypto:require('node:crypto').webcrypto,
  localStorage:{getItem:key => storage.get(key) ?? null,setItem:(key,value) => storage.set(key,String(value))},
  addEventListener:() => {}, dispatchEvent:() => {},
  CustomEvent:class { constructor(type,options = {}) { this.type = type; this.detail = options.detail; } },
  AppState:{get:() => state,isReady:() => true,isSuper:() => true,canMenu:() => true,
    effectiveAccess:() => ({roleCode:'SUPER_ADMIN',valid:true}),authorizeObject:() => true},
  PlatformUI:{escape:value => String(value ?? ''),status:() => ''},
  CustomerDirectory:{phoneOf:call => call?.customerPhone,list:() => []},
  CallState:{view:call => ({answered:call.answered})}
};
win.window = win;
vm.createContext(win);
for (const file of ['mock/data.js','js/components/business-data.js','js/components/customer-business.js','js/components/customer-followup.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),win,{filename:file});
const business = win.CustomerBusiness, followup = win.CustomerFollowup, data = win.BusinessData;
let passed = 0, sequence = 0;
const check = (condition,message) => { assert(condition,message); passed += 1; };
const copy = value => structuredClone(value);
const series = (code,type = code.startsWith('ICE') ? 'ICE' : 'NEV') => ({code,name:'保存时车系 ' + code,type,entryId:'d-series',state:'valid',sourceVersion:'saved-series-revision'});
const store = (code,type = code.startsWith('I') ? 'ICE' : 'NEV') => ({code,name:'保存时门店 ' + code,type,entryId:'d-store',state:'valid',sourceVersion:'saved-store-revision',verifiedScope:'saved-scope'});
function saved(values = {}, options = {}) {
  const id = ++sequence;
  const call = { ...scope, callId:'aggregate-qa-' + id, customerPhone:'13800000001',businessType:'lead',externalDocumentId:'LEAD-QA-001',...options };
  call.customerFollowup = { ...followup.empty(call), ...values, updatedAt:'2026-10-16T' + String(id).padStart(2,'0') + ':00:00.000Z', updatedBy:state.accountId };
  call.customerFollowup.businessFieldSnapshot = business.callbackSnapshot(call.customerFollowup,call);
  return call;
}
const noStores = value => Array.isArray(value) && value.length === 0;
const groupOf = (projection,documentId = 'LEAD-QA-001') => projection.groups.find(group => group.externalDocumentId === documentId).values;
const first = saved({intendedSeries:series('NEV-A'),intendedStore:store('N01'),plannedStoreName:'原计划到店门店',leadLevel:'A级'});
const second = saved({intendedSeries:series('ICE-A'),intendedStore:'',plannedStoreName:'',leadLevel:''});
const originalCalls = JSON.stringify([first,second]);
let projection = followup.aggregate([second,first]);
check(groupOf(projection).intendedSeries.code === 'ICE-A' && noStores(groupOf(projection).intendedStore), 'later ICE series with an explicitly empty store replaces the complete earlier NEV intention');
check(projection.intendedSeries.code === 'ICE-A' && noStores(projection.intendedStore), 'legacy flat lead summary cannot combine series and store from different calls');
check(groupOf(projection).plannedStoreName === '原计划到店门店' && groupOf(projection).leadLevel === 'A级', 'unrelated ordinary fields keep their latest nonempty values');
check(followup.detail(projection).includes('ICE-A') && !followup.detail(projection).includes('N01'), 'rendered archive shows the same coherent pair');
check(JSON.stringify([first,second]) === originalCalls, 'aggregate leaves saved call values and callback snapshots untouched');
const matching = saved({intendedSeries:series('NEV-B'),intendedStore:store('N02')});
projection = followup.aggregate([matching,first]);
check(groupOf(projection).intendedSeries.code === 'NEV-B' && groupOf(projection).intendedStore[0]?.code === 'N02', 'a complete later matching pair replaces the previous pair together');
const cleared = saved({intendedSeries:'',intendedStore:'',intentionLevel:'高意向'});
projection = followup.aggregate([first,cleared]);
check(groupOf(projection).intendedSeries === '' && noStores(groupOf(projection).intendedStore), 'explicitly clearing the series and store clears both archive selections');
check(groupOf(projection).plannedStoreName === '原计划到店门店' && groupOf(projection).intentionLevel === '高意向', 'clearing intentions does not clear independent original fields');
const anotherDocument = saved({intendedSeries:series('ICE-A'),intendedStore:''},{externalDocumentId:'LEAD-QA-002'});
projection = followup.aggregate([first,anotherDocument]);
check(projection.groups.length === 2 && groupOf(projection).intendedStore[0]?.code === 'N01' && noStores(groupOf(projection,'LEAD-QA-002').intendedStore), 'external document groups remain isolated');
check(projection.intendedSeries.code === 'ICE-A' && noStores(projection.intendedStore), 'flat latest intention remains coherent across document groups');
const anotherTenant = copy(second); anotherTenant.tenantId = 'different-tenant';
const anotherEnterprise = copy(second); anotherEnterprise.enterpriseId = 'different-enterprise';
projection = followup.aggregate([first,anotherTenant,anotherEnterprise]);
check(projection.groups.length === 3 && projection.groups.find(group => group.tenantId === scope.tenantId && group.enterpriseId === scope.enterpriseId).values.intendedStore[0]?.code === 'N01', 'enterprise and tenant boundaries remain part of the grouping key');
const service = saved({serviceConcern:'独立售后记录'},{businessType:'aftersales',externalDocumentId:'LEAD-QA-001'});
projection = followup.aggregate([first,service]);
check(projection.groups.length === 2 && projection.groups.find(group => group.businessType === 'lead').values.intendedStore[0]?.code === 'N01', 'business type groups remain isolated');

// The saved field manifest takes precedence over a category's later schema.
const ordinaryOnly = saved({plannedStoreName:'后次计划门店',intendedSeries:series('ICE-A'),intendedStore:''});
ordinaryOnly.customerFollowup.businessFieldSnapshot.fields = ordinaryOnly.customerFollowup.businessFieldSnapshot.fields.filter(field => field.type !== 'interface');
projection = followup.aggregate([first,ordinaryOnly]);
check(groupOf(projection).intendedSeries.code === 'NEV-A' && groupOf(projection).intendedStore[0]?.code === 'N01', 'a reused category snapshot without interface fields cannot merge leftover raw values as new intentions');
check(groupOf(projection).plannedStoreName === '后次计划门店', 'a later ordinary-only snapshot still updates its independent fields');
const noStore = saved({intendedSeries:series('ICE-A'),intendedStore:store('N01'),plannedStoreName:'新计划门店'});
noStore.customerFollowup.businessFieldSnapshot.fields = noStore.customerFollowup.businessFieldSnapshot.fields.filter(field => field.fieldId !== 'intendedStore');
projection = followup.aggregate([first,noStore]);
check(groupOf(projection).intendedSeries.code === 'ICE-A' && noStores(groupOf(projection).intendedStore), 'a new series snapshot without the former store cannot inherit or reattach the old store');
check(groupOf(projection).plannedStoreName === '新计划门店' && groupOf(projection).leadLevel === 'A级', 'omitting a store does not reset other business fields');
const fieldReusedAsText = saved({intendedSeries:'独立文本内容'});
fieldReusedAsText.customerFollowup.businessFieldSnapshot.fields = [{fieldId:'intendedSeries',fieldName:'其他文本字段',type:'text',value:'独立文本内容',selectedOptions:[]}];
projection = followup.aggregate([first,fieldReusedAsText]);
check(groupOf(projection).intendedSeries === '独立文本内容' && groupOf(projection).plannedStoreName === '原计划到店门店', 'a saved ordinary field is not interpreted as an empty interface solely because its ID is reused');

const lead = business.get('lead',scope);
lead.fields.find(field => field.fieldId === 'intendedStore').enabled = false;
check(business.save(lead,scope).ok, 'fixture hides the store through the actual category API');
projection = followup.aggregate([first]);
check(groupOf(projection).intendedStore[0]?.code === 'N01', 'a current hidden field does not erase an earlier saved store value from the archive projection');
const onlySeriesAfterHide = saved({intendedSeries:series('ICE-A'),plannedStoreName:'隐藏门店后填写'});
projection = followup.aggregate([first,onlySeriesAfterHide]);
check(noStores(groupOf(projection).intendedStore) && groupOf(projection).intendedSeries.code === 'ICE-A' && groupOf(projection).leadLevel === 'A级', 'new series after hiding store clears only the old related store, retaining unrelated values');
lead.fields.find(field => field.fieldId === 'intendedStore').enabled = true;
check(business.save(lead,scope).ok, 'fixture restores the store through the actual category API');

check(data.rename('d-series','改名后的接口').ok && data.setEnabled('d-store',false).ok, 'fixtures rename a source and change source revision through actual dictionary APIs');
projection = followup.aggregate([first]);
check(groupOf(projection).intendedSeries.name === '保存时车系 NEV-A' && groupOf(projection).intendedStore[0]?.name === '保存时门店 N01', 'source rename, disable and revision changes do not replace historical names or erase historical values');
check(data.setEnabled('d-store',true).ok, 'fixture restores the dictionary source');
const newSource = data.create({name:'新的车系接口',capabilityId:'series',enabled:true,tenantIds:[scope.tenantId]});
check(newSource.ok && business.saveField({...business.getField('intendedSeries',scope),dictionaryId:newSource.row.id},scope).ok, 'fixture switches the current series field to another authorized source');
projection = followup.aggregate([first,second]);
check(groupOf(projection).intendedSeries.code === 'ICE-A' && noStores(groupOf(projection).intendedStore), 'historical raw entry identity still recognizes the intention after current field source changes');

const legacyFirst = copy(first), legacySecond = copy(second);
delete legacyFirst.customerFollowup.businessFieldSnapshot;
delete legacySecond.customerFollowup.businessFieldSnapshot;
projection = followup.aggregate([legacyFirst,legacySecond]);
check(groupOf(projection).intendedSeries.code === 'ICE-A' && noStores(groupOf(projection).intendedStore), 'old journals without field snapshots still keep a coherent same-call intention');
const preFeature = { ...legacySecond, callId:'pre-interface-feature',customerFollowup:{businessType:'lead',leadLevel:'B级',updatedAt:'2026-10-16T23:00:00.000Z'} };
projection = followup.aggregate([legacyFirst,preFeature]);
check(groupOf(projection).intendedStore[0]?.code === 'N01' && groupOf(projection).leadLevel === 'B级', 'a legacy journal predating interface fields updates ordinary values without clearing saved intentions');
const legacyCleared = copy(legacySecond);
legacyCleared.customerFollowup.intendedSeries = '';
projection = followup.aggregate([legacyFirst,legacyCleared]);
check(groupOf(projection).intendedSeries === '' && noStores(groupOf(projection).intendedStore), 'old journals with explicitly empty interface keys still clear the previous intention');
const manifestValueOnly = copy(second);
delete manifestValueOnly.customerFollowup.intendedSeries;
projection = followup.aggregate([first,manifestValueOnly]);
check(groupOf(projection).intendedSeries.code === 'ICE-A' && noStores(groupOf(projection).intendedStore), 'a recorded field value remains usable if an old projection omits its top-level copy');
projection.intendedSeries.name = '只修改返回值';
check(second.customerFollowup.intendedSeries.name === '保存时车系 ICE-A' && JSON.stringify([first,second]) === originalCalls, 'returned aggregate values are independent clones of all saved sources');
// Multi-store intentions replace the whole saved group, never append another call's stores.
const multi = saved({intendedSeries:series('NEV-A'),intendedStore:[store('N01'),store('N02')],plannedStoreName:'多选前原计划'});
const multiRaw = JSON.stringify(multi);
projection = followup.aggregate([multi]);
check(Array.isArray(groupOf(projection).intendedStore) && groupOf(projection).intendedStore.map(row=>row.code).join(',')==='N01,N02','archive projects the complete multi-store group');
check(followup.detail(multi.customerFollowup,multi).includes('保存时门店 N01 · N01') && followup.detail(multi.customerFollowup,multi).includes('保存时门店 N02 · N02'),'call details render every saved store name and code');
check(!followup.detail(multi.customerFollowup,multi).includes('[object Object]'),'interface arrays never pass through ordinary option labels');
const replacement=saved({intendedSeries:series('NEV-B'),intendedStore:[store('N03')]});
projection=followup.aggregate([multi,replacement]);
check(groupOf(projection).intendedStore.map(row=>row.code).join(',')==='N03' && projection.intendedStore.map(row=>row.code).join(',')==='N03','a later call replaces the complete multi-store group instead of merging stores');
const multiCleared=saved({intendedSeries:series('ICE-A'),intendedStore:[],leadLevel:'B级'});
projection=followup.aggregate([multi,multiCleared]);
check(groupOf(projection).intendedSeries.code==='ICE-A' && noStores(groupOf(projection).intendedStore) && noStores(projection.intendedStore),'an explicitly empty store array clears all previous stores in grouped and flat summaries');
check(groupOf(projection).plannedStoreName==='多选前原计划' && groupOf(projection).leadLevel==='B级','multi-store clearing retains ordinary field aggregation');
const multiLegacy=copy(multi);delete multiLegacy.customerFollowup.businessFieldSnapshot;
projection=followup.aggregate([multiLegacy,multiCleared]);
check(noStores(groupOf(projection).intendedStore),'array-based journals without manifests still identify and replace the saved store group');
const beforeHiddenMulti=saved({intendedSeries:series('NEV-A'),intendedStore:[store('N01'),store('N02')]});
const sourceChanged = data.create({name:'新的门店接口',capabilityId:'stores',enabled:true,tenantIds:[scope.tenantId]});
check(sourceChanged.ok && business.saveField({...business.getField('intendedStore',scope),dictionaryId:sourceChanged.row.id},scope).ok,'fixture changes the current store source through authorized model operations');
projection=followup.aggregate([beforeHiddenMulti]);
check(groupOf(projection).intendedStore.map(row=>row.code).join(',')==='N01,N02' && groupOf(projection).intendedStore.every(row=>row.name.startsWith('保存时门店')),'array entry identity preserves saved stores after the current source changes');
check(JSON.stringify(multi)===multiRaw,'multi-store detail and archive projections never rewrite saved history');
check(followup.detail(first.customerFollowup,first).includes('保存时门店 N01 · N01'),'older single-store call details remain readable');
projection=followup.aggregate([first]);
check(Array.isArray(groupOf(projection).intendedStore) && groupOf(projection).intendedStore.length===1 && groupOf(projection).intendedStore[0].code==='N01','old single-store history is normalized only in the returned archive projection');
check(first.customerFollowup.intendedStore.code==='N01' && !Array.isArray(first.customerFollowup.intendedStore),'projecting an old history does not rewrite its stored object shape');

// Exercise the actual follow-up validation and persistence path with the real interface validator.
vm.runInContext(fs.readFileSync(path.join(root,'js/components/business-interface-field.js'),'utf8'),win,{filename:'business-interface-field.js'});
const liveCall={...scope,callId:'multi-store-save',customerPhone:'13800000002',businessType:'lead',accountId:state.accountId,callSource:'NATIVE_WORKBENCH',processingStatus:'待填写',endedAt:'2026-10-16 23:30:00',direction:'呼出',callType:'人工外呼',answered:true};
win.CloudCallData.calls.push(liveCall);
const fields=business.fields('lead',liveCall), storeField=fields.find(field=>business.interfaceKind(field)==='store'), seriesField=fields.find(field=>business.interfaceKind(field)==='series');
const liveSeries={...series('NEV-A'),entryId:seriesField.dictionaryId,sourceVersion:data.sourceVersion(seriesField.dictionaryId,liveCall)};
const liveValues={...followup.empty(liveCall),[seriesField.id]:liveSeries};
const stamp=win.BusinessInterfaceField.conditions(storeField,liveValues,liveCall).stamp;
liveValues[storeField.id]=['N01','N02'].map(code=>({...store(code),entryId:storeField.dictionaryId,sourceVersion:data.sourceVersion(storeField.dictionaryId,liveCall),verifiedScope:stamp}));
const emptyDraft=followup.empty(liveCall);
check(Array.isArray(emptyDraft[storeField.id]) && emptyDraft[storeField.id].length===0 && emptyDraft[seriesField.id]==='','new drafts have one scalar series selection and an empty store array');
const updateLegacy=followup.update(liveValues,liveCall,storeField.id,liveValues[storeField.id][0]);
check(Array.isArray(updateLegacy[storeField.id]) && updateLegacy[storeField.id].length===1,'updating an old object draft normalizes it to one store');
const inputStores=copy(liveValues[storeField.id]), updateMulti=followup.update(liveValues,liveCall,storeField.id,inputStores);inputStores[0].name='outside mutation';
check(updateMulti[storeField.id].length===2 && updateMulti[storeField.id][0].name===liveValues[storeField.id][0].name,'multi-store draft updates clone the entire selection independently');
check(followup.update(liveValues,liveCall,seriesField.id,[liveSeries])===null && liveValues[seriesField.id].code==='NEV-A','series rejects arrays without clearing the existing single selection');
check(followup.update(liveValues,liveCall,storeField.id,'manual store')===null,'manual store text is not accepted as an interface selection');
const invalidMembers=followup.update(liveValues,liveCall,storeField.id,[liveValues[storeField.id][0],'invalid']);
check(invalidMembers[storeField.id].length===2 && !followup.validate(invalidMembers,liveCall).ok,'malformed array members are retained for validation instead of silently dropped');
check(followup.validate(liveValues,liveCall).ok,'the actual interface validator accepts a complete valid multi-store selection');
const saveResult=followup.save(liveCall,liveValues,{wrapping:true});
check(saveResult.ok && saveResult.values[storeField.id].length===2 && liveCall.customerFollowup[storeField.id].length===2,'the actual follow-up save persists every selected store');
const journal=JSON.parse(storage.get('customer-followup-v1'));
check(journal.entries.find(row=>row.key===followup.identity(liveCall)).values[storeField.id].map(row=>row.code).join(',')==='N01,N02','journal persistence preserves the complete store array');
const callback=saveResult.values.businessFieldSnapshot;
check(callback.values[storeField.id].length===2 && callback.values[storeField.id].every(row=>Object.keys(row).sort().join(',')==='code,name,type'),'the saved callback carries every business value without draft query state');
check(callback.fields.find(row=>row.fieldId===storeField.id).value.length===2 && !JSON.stringify(callback).includes('verifiedScope') && !JSON.stringify(callback).includes('sourceVersion'),'neither callback projection retains store verification tokens');
const required=business.get('lead',scope);required.fields.find(ref=>ref.fieldId===storeField.id).required=true;
check(business.save(required,scope).ok,'fixture enables category-level store mandatory validation');
const blankValues={...liveValues,[storeField.id]:[]};
check(!followup.validate(blankValues,liveCall).ok,'an empty array does not satisfy a mandatory store');
check(followup.validate(blankValues,{...liveCall,answered:false}).ok,'the existing unanswered outbound waiver allows an empty mandatory store array');
const pendingValues={...liveValues,[storeField.id]:[{...liveValues[storeField.id][0],state:'pending'}]};
check(!followup.validate(pendingValues,{...liveCall,answered:false}).ok,'unanswered outbound waiver never validates a filled but pending store');
console.log(JSON.stringify({passed,scope:'same-call intention aggregation; independent fields and saved history preserved'}));
