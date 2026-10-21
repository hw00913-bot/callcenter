'use strict';
const {install:installGeneric}=require('./fixtures/current-generic.cjs');
/* Current-schema checks. Retired compatibility evidence: qa/retired/compatibility/check-business-config-audit-fixes.cjs. */
/* Regression checks for the category dependency and current category dependency and tenant isolation checks. */
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
    AppState:{get:()=>({...scope,accountId:'a1',sessionId:'s1',activeDomain:'CLOUD_CONTACT_CENTER'}),effectiveAccess:()=>({roleCode:role,valid:true}),authorizeObject:()=>true,isReady:()=>true,canMenu:()=>true,isSuper:()=>role==='SUPER_ADMIN'},
    structuredClone,setTimeout,clearTimeout,addEventListener(){},dispatchEvent(){},CustomEvent:class{constructor(type,o={}){this.type=type;this.detail=o.detail;}},
    CloudCallData:{instances:[{enterpriseId:scope.enterpriseId,status:'RUNNING'}],calls:[],tenants:[{...scope,status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']},{...scope,tenantId:'t2',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}]},
    BusinessData:{entry:id=>({'d-fixture-series':{id,capabilityId:'series'},'d-fixture-store':{id,capabilityId:'store'}})[id],capability:id=>({kind:id,queryConditions:id==='store'?[{key:'seriesCode',label:'车系',required:true,sourceKind:'series',valueKey:'code',help:'此接口需要根据车系查询门店，请选择提供车系值的字段。'}]:[]}),available:()=>true,sourceVersion:()=>1},
    CallState:{view:call=>({answered:call.answered})},CustomerDirectory:{phoneOf:call=>call.customerPhone},
    PlatformUI:{escape:value=>String(value??''),status:()=>'',pageHeader:()=>'',toolbar:()=>'',table:()=>'',closeLayer:()=>{},openLayer:(_id,html)=>{layerHtml=html;},empty:()=>''},
    RouteRuntime:{refreshCurrent:()=>{}},showToast:message=>notifications.push(message),
    document:{getElementById:id=>id==='business-config-error'?errorNode:null}
  };
  win.window=win;
  const context=vm.createContext(win);
  const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  load('config/customer-intent-profile.js');load('mock/mapping-series-data.js');load('js/components/mapping-series-adapter.js');load('js/components/business-data.js');load('js/components/customer-business.js');installGeneric(win,{scope});
  const model=win.CustomerBusiness;
  return {scope,storage,win,model,errorNode,notifications,load,layer:()=>layerHtml,setRole:value=>{role=value;},raw:()=>storage.get(model.storageKey),put:data=>storage.set(model.storageKey,JSON.stringify(data))};
}
function config(h) { const catalog=h.model.catalog(h.scope);return {version:h.model.storageVersion,revision:11,scopes:[{...h.scope,types:catalog.rows,fields:catalog.fields}]}; }
const ref = (category,id) => category.fields.find(item=>item.fieldId===id);
const field = (bundle,id) => bundle.fields.find(item=>item.id===id);
function dependencies() {
  const h=harness(), M=h.model, scope=h.scope;
  const lead=M.get('lead',scope);
  ref(lead,'genericStore').required=true;
  check(M.save(lead,scope).ok,'required store with optional visible series is valid');
  check(!M.fields('lead',scope).find(row=>row.id==='genericSeries').required,'dependency does not force series required flag');
  const before=h.raw();
  ref(lead,'genericSeries').enabled=false;
  const hidden=M.save(lead,scope);
  check(!hidden.ok&&hidden.message.includes('须同时显示关联字段'),'saving visible store with hidden series reports the exact dependency');
  equal(h.raw(),before,'rejected category save leaves stored configuration untouched');
  ref(lead,'genericStore').required=false;
  check(!M.save(lead,scope).ok,'optional store also requires its series to be visible');
  lead.fields=lead.fields.filter(item=>item.fieldId!=='genericSeries');
  check(!M.save(lead,scope).ok,'removing associated series while store remains visible is rejected');
  ref(lead,'genericStore').enabled=false;
  check(M.save(lead,scope).ok,'hiding store permits removal of category series reference');
  ref(lead,'genericStore').enabled=true;
  check(!M.save(lead,scope).ok,'re-enabling orphan store is rejected');
  const fresh={id:'custom',label:'自定义分类',codeLabel:'业务编码',prefix:'C',enabled:true,fields:[{fieldId:'genericStore',enabled:true,required:false}]};
  check(!M.save(fresh,scope).ok,'new category with only store cannot be saved');
  fresh.fields.unshift({fieldId:'genericSeries',enabled:true,required:true});
  check(M.save(fresh,scope).ok,'required series and optional store remain independently configurable');
  check(M.saveField({id:'anotherSeries',label:'另一个分类车系',type:'interface',dictionaryId:'d-fixture-series',useQueryConditions:false,depends:[],businessKey:'',options:[],enabled:true},scope).ok,'standalone series can serve another category');
  const sourceBefore=h.raw(), store=M.getField('genericStore',scope);
  const retargeted=M.saveField({...store,depends:['anotherSeries']},scope);
  check(!retargeted.ok&&retargeted.message.includes('自定义分类'),'field editor cannot retarget visible store to a series absent from its category');
  equal(h.raw(),sourceBefore,'rejected field update is atomic');
}
function existingIncomplete() {
  const h=harness(), M=h.model, data=config(h), bundle=data.scopes[0], lead=bundle.types.find(row=>row.id==='lead');
  ref(lead,'genericSeries').enabled=false;
  ref(lead,'genericStore').required=true;
  h.put(data);
  check(M.catalog(h.scope).ok,'current incomplete category remains readable for repair');
  check(!M.save(M.get('lead',h.scope),h.scope).ok,'existing incomplete category cannot be resaved unchanged');
  check(M.saveField({...M.getField('serviceConcern',h.scope),label:'调整服务反馈'},h.scope).ok,'unrelated field edit is not blocked by an current incomplete category');
  const repaired=M.get('lead',h.scope);ref(repaired,'genericSeries').enabled=true;
  check(M.save(repaired,h.scope).ok,'administrator can repair current category by restoring series display');
  check(M.fields('lead',h.scope).find(row=>row.id==='genericStore').required,'repair preserves the independent mandatory setting');
}
function pageGuards() {
  const h=harness(), M=h.model;h.load('js/pages/business-categories.js');
  const P=h.win.BusinessConfiguration;
  P.render();P.open('category','lead');
  let lead=M.get('lead',h.scope), index=lead.fields.findIndex(item=>item.fieldId==='genericSeries');
  P.setCategoryField(index,'enabled',false);
  check(h.errorNode.textContent.includes('先关闭或移除依赖此字段的接口字段'),'checkbox action explains how to turn off associated series');
  P.save();
  check(M.fields('lead',h.scope).some(row=>row.id==='genericSeries'),'rejected checkbox action keeps series visible');
  P.open('category','lead');P.removeCategoryField(index);
  check(h.errorNode.textContent.includes('再移除关联字段'),'remove action explains required store adjustment');
  P.save();
  check(M.fields('lead',h.scope).some(row=>row.id==='genericSeries'),'rejected remove action retains series reference');
  P.open('category','lead');
  const storeIndex=lead.fields.findIndex(item=>item.fieldId==='genericStore');
  P.setCategoryField(storeIndex,'enabled',false);P.setCategoryField(index,'enabled',false);P.save();
  check(!M.fields('lead',h.scope).some(row=>row.id==='genericStore'||row.id==='genericSeries'),'hiding store first then series is a supported repair path');
}
function tenantIsolation() {
  const h=harness(), M=h.model, data=config(h);h.setRole('SUPER_ADMIN');
  const clean=M.catalog({...h.scope,tenantId:'t2'});
  data.scopes.push({...h.scope,tenantId:'t2',types:clean.rows,fields:clean.fields});h.put(data);
  check(M.catalog(h.scope).ok&&M.catalog({...h.scope,tenantId:'t2'}).ok,'valid current tenant and existing clean tenant are both readable');
  const malformed=copy(data);malformed.scopes[0].fields=null;h.put(malformed);
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
dependencies();existingIncomplete();pageGuards();tenantIsolation();
console.log(JSON.stringify({passed,scope:'category dependencies, tenant isolation'}));
