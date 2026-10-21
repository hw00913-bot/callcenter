/* Regression checks for the category dependency and legacy single-series migration audit fixes. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
let passed = 0;
const check = (value, message) => { assert(value, message); passed += 1; };
const equal = (actual, expected, message) => { assert.deepEqual(copy(actual), copy(expected), message); passed += 1; };
function harness() {
  const scope = {enterpriseId:'e1',tenantId:'t1'}, storage = new Map(), notifications = [];
  let role = 'ADMIN';
  const errorNode = {textContent:''};
  let layerHtml='';
  const win = {
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))},
    AppState:{get:()=>({...scope,accountId:'a1',sessionId:'s1',activeDomain:'CLOUD_CONTACT_CENTER'}),effectiveAccess:()=>({roleCode:role,valid:true}),authorizeObject:()=>true,isSuper:()=>role==='SUPER_ADMIN'},
    structuredClone,setTimeout,clearTimeout,
    CloudCallData:{calls:[],tenants:[{...scope,status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']},{...scope,tenantId:'t2',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}]},
    BusinessData:{entry:id=>({'d-series':{id,capabilityId:'series'},'d-store':{id,capabilityId:'store'}})[id],capability:id=>({kind:id,queryConditions:id==='store'?[{key:'seriesCode',label:'车系',required:true,sourceKind:'series',valueKey:'code',help:'此接口需要根据车系查询门店，请选择提供车系值的字段。'}]:[]}),available:()=>true,sourceVersion:()=>1},
    CallState:{view:call=>({answered:call.answered})},CustomerDirectory:{phoneOf:call=>call.customerPhone},
    PlatformUI:{escape:value=>String(value??''),status:()=>'',pageHeader:()=>'',toolbar:()=>'',table:()=>'',closeLayer:()=>{},openLayer:(_id,html)=>{layerHtml=html;},empty:()=>''},
    RouteRuntime:{refreshCurrent:()=>{}},showToast:message=>notifications.push(message),
    document:{getElementById:id=>id==='business-config-error'?errorNode:null}
  };
  win.window=win;
  const context=vm.createContext(win);
  const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  load('js/components/customer-business.js');
  const model=win.CustomerBusiness;
  return {scope,storage,win,model,errorNode,notifications,load,layer:()=>layerHtml,setRole:value=>{role=value;},raw:()=>storage.get(model.storageKey),put:data=>storage.set(model.storageKey,JSON.stringify(data))};
}
function config(h) { const catalog=h.model.catalog(h.scope);return {version:3,revision:11,seriesSelectionPolicy:'single',scopes:[{...h.scope,types:catalog.rows,fields:catalog.fields}]}; }
const ref = (category,id) => category.fields.find(item=>item.fieldId===id);
const field = (bundle,id) => bundle.fields.find(item=>item.id===id);
function dependencies() {
  const h=harness(), M=h.model, scope=h.scope;
  const lead=M.get('lead',scope);
  ref(lead,'intendedStore').required=true;
  check(M.save(lead,scope).ok,'required store with optional visible series is valid');
  check(!M.fields('lead',scope).find(row=>row.id==='intendedSeries').required,'dependency does not force series required flag');
  const before=h.raw();
  ref(lead,'intendedSeries').enabled=false;
  const hidden=M.save(lead,scope);
  check(!hidden.ok&&hidden.message.includes('须同时显示关联字段'),'saving visible store with hidden series reports the exact dependency');
  equal(h.raw(),before,'rejected category save leaves stored configuration untouched');
  ref(lead,'intendedStore').required=false;
  check(!M.save(lead,scope).ok,'optional store also requires its series to be visible');
  lead.fields=lead.fields.filter(item=>item.fieldId!=='intendedSeries');
  check(!M.save(lead,scope).ok,'removing associated series while store remains visible is rejected');
  ref(lead,'intendedStore').enabled=false;
  check(M.save(lead,scope).ok,'hiding store permits removal of category series reference');
  ref(lead,'intendedStore').enabled=true;
  check(!M.save(lead,scope).ok,'re-enabling orphan store is rejected');
  const fresh={id:'custom',label:'自定义分类',codeLabel:'业务编码',prefix:'C',enabled:true,fields:[{fieldId:'intendedStore',enabled:true,required:false}]};
  check(!M.save(fresh,scope).ok,'new category with only store cannot be saved');
  fresh.fields.unshift({fieldId:'intendedSeries',enabled:true,required:true});
  check(M.save(fresh,scope).ok,'required series and optional store remain independently configurable');
  check(M.saveField({id:'anotherSeries',label:'另一个分类车系',type:'interface',dictionaryId:'d-series',depends:[],businessKey:'',options:[],enabled:true},scope).ok,'standalone series can serve another category');
  const sourceBefore=h.raw(), store=M.getField('intendedStore',scope);
  const retargeted=M.saveField({...store,depends:['anotherSeries']},scope);
  check(!retargeted.ok&&retargeted.message.includes('自定义分类'),'field editor cannot retarget visible store to a series absent from its category');
  equal(h.raw(),sourceBefore,'rejected field update is atomic');
}
function existingIncomplete() {
  const h=harness(), M=h.model, data=config(h), bundle=data.scopes[0], lead=bundle.types.find(row=>row.id==='lead');
  ref(lead,'intendedSeries').enabled=false;
  ref(lead,'intendedStore').required=true;
  h.put(data);
  check(M.catalog(h.scope).ok,'older incomplete category remains readable for repair');
  check(!M.save(M.get('lead',h.scope),h.scope).ok,'existing incomplete category cannot be resaved unchanged');
  check(M.saveField({...M.getField('serviceConcern',h.scope),label:'调整服务反馈'},h.scope).ok,'unrelated field edit is not blocked by an older incomplete category');
  const repaired=M.get('lead',h.scope);ref(repaired,'intendedSeries').enabled=true;
  check(M.save(repaired,h.scope).ok,'administrator can repair old category by restoring series display');
  check(M.fields('lead',h.scope).find(row=>row.id==='intendedStore').required,'repair preserves the independent mandatory setting');
}
function pageGuards() {
  const h=harness(), M=h.model;h.load('js/pages/business-categories.js');
  const P=h.win.BusinessConfiguration;
  P.render();P.open('category','lead');
  let lead=M.get('lead',h.scope), index=lead.fields.findIndex(item=>item.fieldId==='intendedSeries');
  P.setCategoryField(index,'enabled',false);
  check(h.errorNode.textContent.includes('先关闭或移除依赖此字段的接口字段'),'checkbox action explains how to turn off associated series');
  P.save();
  check(M.fields('lead',h.scope).some(row=>row.id==='intendedSeries'),'rejected checkbox action keeps series visible');
  P.open('category','lead');P.removeCategoryField(index);
  check(h.errorNode.textContent.includes('再移除关联字段'),'remove action explains required store adjustment');
  P.save();
  check(M.fields('lead',h.scope).some(row=>row.id==='intendedSeries'),'rejected remove action retains series reference');
  P.open('category','lead');
  const storeIndex=lead.fields.findIndex(item=>item.fieldId==='intendedStore');
  P.setCategoryField(storeIndex,'enabled',false);P.setCategoryField(index,'enabled',false);P.save();
  check(!M.fields('lead',h.scope).some(row=>row.id==='intendedStore'||row.id==='intendedSeries'),'hiding store first then series is a supported repair path');
}
function legacy(h,{collisions=false}={}) {
  const data=config(h), bundle=data.scopes[0];delete data.seriesSelectionPolicy;
  const original=field(bundle,'intendedSeries');
  original.type='text';original.businessKey='ordinary_primary_key';delete original.dictionaryId;delete original.depends;
  bundle.fields.push({id:'backupSeries',label:'备选意向车系',type:'interface',dictionaryId:'d-series',depends:[],businessKey:'legacy_series_key',options:[],enabled:true});
  field(bundle,'intendedStore').depends=['backupSeries'];
  bundle.types.find(row=>row.id==='lead').fields.push({fieldId:'backupSeries',enabled:true,required:false});
  if(collisions) bundle.fields.push({id:'intendedSeriesSingle',label:'本次意向车系（单选）',type:'text',businessKey:'other_ordinary_key',options:[],enabled:true});
  return data;
}
function migration() {
  for(const collisions of [false,true]) {
    const h=harness(), M=h.model, data=legacy(h,{collisions}), ordinary=copy(field(data.scopes[0],'intendedSeries'));
    h.put(data);const raw=h.raw(), migrated=M.catalog(h.scope);
    check(migrated.ok,'legacy retyped primary no longer makes catalog unavailable');
    const series=migrated.fields.find(row=>M.interfaceKind(row)==='series');
    check(series.id===(collisions?'intendedSeriesSingle2':'intendedSeriesSingle'),'migration uses a deterministic unoccupied series ID');
    check(series.label===(collisions?'本次意向车系（单选2）':'本次意向车系（单选）'),'migration avoids ordinary field display-name collision');
    equal(field(migrated,'intendedSeries'),ordinary,'ordinary primary type, name, business key and ID are retained');
    check(series.businessKey==='legacy_series_key','migrated interface keeps its original opaque business key');
    check(field(migrated,'intendedStore').depends[0]===series.id,'store legacy backup reference maps to the actual migrated series');
    check(migrated.rows.find(row=>row.id==='lead').fields.some(row=>row.fieldId===series.id),'category references migrated single series');
    check(migrated.rows.find(row=>row.id==='lead').fields.some(row=>row.fieldId==='intendedSeries'),'category preserves the ordinary legacy primary field');
    check(M.fields('lead',h.scope).filter(row=>M.interfaceKind(row)==='series').length===1,'follow-up has exactly one single-select interface series');
    equal(h.raw(),raw,'read projection preserves the original stored configuration');
    equal(M.catalog(h.scope).fields,migrated.fields,'repeated reads keep generated IDs and names stable');
    check(M.save(migrated.rows.find(row=>row.id==='lead'),h.scope).ok,'migrated category can be explicitly saved without deleting user fields');
    equal(field(M.catalog(h.scope),'intendedSeries'),ordinary,'explicit save still preserves ordinary field and historical mapping');
    check(field(M.catalog(h.scope),'intendedStore').depends[0]===series.id,'saved migration keeps stable dependency ID');
  }
  const h=harness(), M=h.model, data=config(h), bundle=data.scopes[0];delete data.seriesSelectionPolicy;
  bundle.fields.push({id:'backupSeries',label:'普通备选说明',type:'text',businessKey:'ordinary_backup',options:[],enabled:true});
  bundle.types.find(row=>row.id==='lead').fields.push({fieldId:'backupSeries',enabled:true,required:false});
  h.put(data);
  check(M.catalog(h.scope).ok&&M.getField('backupSeries',h.scope).type==='text','migration never removes ordinary field occupying backupSeries ID');
  check(M.get('lead',h.scope).fields.some(row=>row.fieldId==='backupSeries'),'ordinary backup field category reference is retained');
  const custom=harness(), C=custom.model, customData=config(custom), customBundle=customData.scopes[0];delete customData.seriesSelectionPolicy;
  field(customBundle,'intendedSeries').id='customSeries';field(customBundle,'intendedStore').depends=['customSeries'];ref(customBundle.types.find(row=>row.id==='lead'),'intendedSeries').fieldId='customSeries';custom.put(customData);
  check(C.catalog(custom.scope).ok&&C.getField('customSeries',custom.scope),'custom single-series ID remains available');
  check(C.getField('intendedStore',custom.scope).depends[0]==='customSeries','custom dependency is not hardcoded to intendedSeries');
  check(C.save(C.get('lead',custom.scope),custom.scope).ok,'custom single-series category remains editable');
}
function customDependencyClosure() {
  for (const withBackup of [true,false]) {
    const h=harness(), M=h.model, data=config(h), bundle=data.scopes[0], lead=bundle.types.find(row=>row.id==='lead');delete data.seriesSelectionPolicy;
    h.load('js/components/business-interface-field.js');h.load('js/components/customer-followup.js');
    const first='customSeriesA', second=withBackup?'backupSeries':'customSeriesB', expected=withBackup?first:second;
    field(bundle,'intendedSeries').id=first;ref(lead,'intendedSeries').fieldId=first;
    bundle.fields.push({id:second,label:withBackup?'备选意向车系':'其他自定义车系',type:'interface',dictionaryId:'d-series',depends:[],businessKey:'',options:[],enabled:true});
    lead.fields.push({fieldId:second,enabled:true,required:false});
    field(bundle,'intendedStore').depends=[expected];ref(lead,'intendedStore').required=true;
    h.put(data);const raw=h.raw(), migrated=M.catalog(h.scope), visible=M.fields('lead',h.scope);
    check(migrated.ok,'custom series with unique visible store dependency remains readable');
    equal(visible.filter(row=>M.interfaceKind(row)==='series').map(row=>row.id),[expected],'migration keeps the actual store source rather than primary or first series');
    check(M.configurationIssue('lead',h.scope)==='','unique dependency migration has no unresolved configuration issue');
    const store=visible.find(row=>row.id==='intendedStore');
    equal(store.depends,[expected],'migration preserves the custom store source ID');
    equal(h.raw(),raw,'custom dependency read projection leaves original storage untouched');
    const call={...h.scope,callId:'custom-migration-'+withBackup,accountId:'a1',businessType:'lead',customerPhone:'13800000001',endedAt:'now',direction:'呼出',callType:'人工外呼',answered:true,callSource:'NATIVE_WORKBENCH',processingStatus:'待填写'};
    const values=h.win.CustomerFollowup.empty(call);
    values[expected]={code:'NEV-A',name:'星云 A',type:'NEV',state:'valid',entryId:'d-series',sourceVersion:1};
    const conditions=h.win.BusinessInterfaceField.conditions(store,values,call);
    check(conditions.ready,'selecting the sole migrated series enables store lookup');
    values.intendedStore={code:'N01',name:'模拟门店',type:'NEV',state:'valid',entryId:'d-store',sourceVersion:1,verifiedScope:conditions.stamp};
    check(h.win.CustomerFollowup.validate(values,call).ok,'mandatory store can be validly completed after migration');
    h.win.CloudCallData.calls.push(call);
    check(h.win.CustomerFollowup.save(call,values,{wrapping:true}).ok,'actual follow-up save accepts the completed migrated single-series form');
    check(call.customerFollowup[expected].code==='NEV-A'&&call.customerFollowup.intendedStore[0]?.code==='N01','saved follow-up retains the correct series/store pair');
    check(M.save(migrated.rows.find(row=>row.id==='lead'),h.scope).ok,'unique dependency category can be resaved without manual repair');
  }
}
function ambiguousDependencyRepair() {
  const h=harness(), M=h.model, data=config(h), bundle=data.scopes[0], lead=bundle.types.find(row=>row.id==='lead');delete data.seriesSelectionPolicy;
  field(bundle,'intendedSeries').id='customSeriesA';ref(lead,'intendedSeries').fieldId='customSeriesA';field(bundle,'intendedStore').depends=['customSeriesA'];
  bundle.fields.push({id:'customSeriesB',label:'其他自定义车系',type:'interface',dictionaryId:'d-series',depends:[],businessKey:'',options:[],enabled:true});
  bundle.fields.push({id:'otherStore',label:'其他意向门店',type:'interface',dictionaryId:'d-store',depends:['customSeriesB'],businessKey:'',options:[],enabled:true});
  lead.fields.push({fieldId:'customSeriesB',enabled:true,required:false},{fieldId:'otherStore',enabled:true,required:false});
  h.put(data);const raw=h.raw(), migrated=M.catalog(h.scope);
  check(migrated.ok,'conflicting legacy dependency closure remains readable for administrator repair');
  const migratedLead=migrated.rows.find(row=>row.id==='lead');
  equal(migratedLead.fields.filter(row=>M.interfaceKind(field(migrated,row.fieldId))==='series').map(row=>row.fieldId),['customSeriesA','customSeriesB'],'ambiguous migration retains both actual dependency references');
  equal(field(migrated,'intendedStore').depends,['customSeriesA'],'first store source is not silently changed');
  equal(field(migrated,'otherStore').depends,['customSeriesB'],'second store source is not silently changed');
  check(M.configurationIssue('lead',h.scope).includes('关联了不同车系'),'runtime receives explicit editable conflict reason');
  check(!M.save(migratedLead,h.scope).ok,'new save cannot pass conflicting multi-series configuration');
  equal(h.raw(),raw,'rejected conflict save and read preserve legacy raw data');
  h.load('js/pages/business-categories.js');const P=h.win.BusinessConfiguration;
  check(P.render().includes('关联了不同车系'),'administrator list exposes concrete conflict reason');
  P.open('category','lead');
  check(h.layer().includes('business-category-config-warning')&&h.layer().includes('关联了不同车系'),'administrator editor displays repair warning');
  const secondIndex=migratedLead.fields.findIndex(row=>row.fieldId==='customSeriesB'), otherStoreIndex=migratedLead.fields.findIndex(row=>row.fieldId==='otherStore');
  P.removeCategoryField(secondIndex);
  check(h.errorNode.textContent.includes('先关闭或移除依赖此字段的接口字段'),'cannot remove a source while its displayed store still needs it');
  P.setCategoryField(otherStoreIndex,'enabled',false);P.removeCategoryField(secondIndex);P.save();
  check(M.configurationIssue('lead',h.scope)==='','closing conflicting store and removing its category series resolves the issue');
  equal(M.fields('lead',h.scope).filter(row=>M.interfaceKind(row)==='series').map(row=>row.id),['customSeriesA'],'repaired category contains exactly its valid store dependency');
  check(M.getField('otherStore',h.scope).depends[0]==='customSeriesB'&&M.getField('customSeriesB',h.scope),'repair preserves inactive field definitions and their historical mapping');
  check(M.catalog({...h.scope,tenantId:'t2'}).message==='请选择当前账号下的使用租户','repair does not expand account access');
}
function disabledLegacyPrimary() {
  const h=harness(), M=h.model, data=config(h), bundle=data.scopes[0];delete data.seriesSelectionPolicy;
  const disabled=field(bundle,'intendedSeries');disabled.enabled=false;
  ref(bundle.types.find(row=>row.id==='lead'),'intendedSeries').enabled=false;
  bundle.fields.push({id:'backupSeries',label:'备选意向车系',type:'interface',dictionaryId:'d-series',depends:[],businessKey:'active_backup_key',options:[],enabled:true});
  bundle.types.find(row=>row.id==='lead').fields.push({fieldId:'backupSeries',enabled:true,required:false});
  field(bundle,'intendedStore').depends=['backupSeries'];
  const disabledBefore=copy(disabled);h.put(data);const raw=h.raw(), migrated=M.catalog(h.scope);
  check(migrated.ok,'active legacy backup can migrate while the original primary stays disabled');
  equal(field(migrated,'intendedSeries'),disabledBefore,'migration preserves disabled primary definition and does not reactivate it');
  const active=migrated.fields.find(row=>M.interfaceKind(row)==='series'&&row.enabled!==false);
  check(active.id==='intendedSeriesSingle'&&active.businessKey==='active_backup_key','active backup receives its own deterministic single-series identity');
  const lead=migrated.rows.find(row=>row.id==='lead');
  check(lead.fields.some(row=>row.fieldId===active.id&&row.enabled!==false)&&!lead.fields.some(row=>row.fieldId==='intendedSeries'),'category retains active migrated reference rather than disabled primary reference');
  check(field(migrated,'intendedStore').depends[0]===active.id,'store follows the active migrated backup');
  equal(h.raw(),raw,'read does not persist or change disabled state');
  check(M.save(lead,h.scope).ok,'category migrated from disabled primary and active backup remains savable');
  check(M.getField('intendedSeries',h.scope).enabled===false,'explicit save also respects the original disabled primary');
}
function tenantIsolation() {
  const h=harness(), M=h.model, data=legacy(h);h.setRole('SUPER_ADMIN');
  const clean=M.catalog({...h.scope,tenantId:'t2'});
  data.scopes.push({...h.scope,tenantId:'t2',types:clean.rows,fields:clean.fields});h.put(data);
  check(M.catalog(h.scope).ok&&M.catalog({...h.scope,tenantId:'t2'}).ok,'valid legacy tenant and existing clean tenant are both readable');
  const malformed=copy(data);malformed.seriesSelectionPolicy='single';malformed.scopes[0].fields=null;h.put(malformed);
  const raw=h.raw();
  check(!M.catalog(h.scope).ok,'structurally damaged target tenant does not silently fall back to defaults');
  check(M.catalog({...h.scope,tenantId:'t2'}).ok,'damaged tenant cannot make unrelated tenant unreadable');
  equal(h.raw(),raw,'reading a damaged tenant never clears its stored data');
  check(M.resolveImportType('lead',{...h.scope,tenantId:'t2'}).ok,'import type resolution for valid tenant is isolated from damaged neighbor');
  const otherScope={...h.scope,tenantId:'t2'}, other=M.get('lead',otherScope);other.label='另一租户线索';
  check(M.save(other,otherScope).ok,'unrelated valid tenant remains editable');
  equal(JSON.parse(h.raw()).scopes[0],malformed.scopes[0],'saving a clean tenant preserves damaged neighbor data for repair');
  const d=harness();d.setRole('SUPER_ADMIN');
  const duplicate=config(d);duplicate.scopes.push(copy(duplicate.scopes[0]));d.put(duplicate);
  check(!d.model.catalog(d.scope).ok,'duplicate target tenant scopes are rejected without selecting an arbitrary copy');
  check(d.model.catalog(otherScope).ok,'duplicate identity in one tenant cannot block an unconfigured tenant');
}
dependencies();existingIncomplete();pageGuards();migration();customDependencyClosure();ambiguousDependencyRepair();disabledLegacyPrimary();tenantIsolation();
console.log(JSON.stringify({passed,scope:'category dependencies, safe single-series migration, tenant isolation'}));
