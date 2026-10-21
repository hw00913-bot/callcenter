/* Capability-owned query conditions, exercised through the real local models and field editor.
 * All storage and metadata overrides below live in an isolated VM; no real interface is called.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let passed = 0;
const check = (value, message) => { assert.ok(value, message); passed += 1; };
const equal = (actual, expected, message) => { assert.deepEqual(copy(actual), copy(expected), message); passed += 1; };

function harness() {
  const scope = {enterpriseId:'e1', tenantId:'t1'}, storage = new Map(), notices = [], events = [];
  const nodes = new Map(), overrides = new Map();
  let layer = '';
  const w = {
    console, structuredClone, setTimeout, clearTimeout,
    CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    crypto: require('node:crypto').webcrypto,
    localStorage:{getItem:key=>storage.get(key) ?? null, setItem:(key,value)=>storage.set(key,String(value))},
    AppState:{
      get:()=>({...scope,accountId:'a1',sessionId:'s1',activeDomain:'CLOUD_CONTACT_CENTER'}),
      effectiveAccess:()=>({roleCode:'SUPER_ADMIN',valid:true}),
      isReady:()=>true, isSuper:()=>true, canMenu:()=>true, authorizeObject:()=>true
    },
    CloudCallData:{instances:[{enterpriseId:scope.enterpriseId,status:'RUNNING'}],tenants:[{...scope,name:'模拟租户',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}],calls:[]},
    dispatchEvent:event=>events.push(event), addEventListener:()=>{},
    PlatformUI:{
      escape:esc, status:()=>'', pageHeader:()=>'', toolbar:()=>'', table:()=>'', empty:()=>'',
      closeLayer:()=>{}, openLayer:(_id,html)=>{layer=html; nodes.clear();}
    },
    RouteRuntime:{refreshCurrent:()=>{}}, showToast:message=>notices.push(message),
    document:{
      getElementById:id=>{
        if (!new RegExp('id=["\']'+id+'["\']').test(layer)) return null;
        if (!nodes.has(id)) nodes.set(id,{textContent:'',innerHTML:'',value:'',hidden:false});
        return nodes.get(id);
      },
      querySelector:()=>null
    }
  };
  w.window=w;
  vm.createContext(w);
  const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),w,{filename:file});
  load('js/components/business-data.js');
  const realData=w.BusinessData;
  // The real adapter owns every method. Tests can vary a capability's descriptive
  // declaration without adding any editable parameter or alternate data source.
  w.BusinessData={...realData, capability:id=>overrides.has(id)?copy(overrides.get(id)):realData.capability(id)};
  load('js/components/customer-business.js');
  load('js/pages/business-categories.js');
  const M=w.CustomerBusiness,P=w.BusinessConfiguration;
  P.render();
  return {
    scope,storage,w,M,P,D:realData,notices,events,
    layer:()=>layer,
    error:()=>nodes.get('business-config-error')?.textContent || '',
    capability:(id,value)=>overrides.set(id,copy(value)),
    raw:()=>storage.get(M.storageKey),
    open:id=>{P.open('field',id);return layer;}
  };
}

function select(html,id) {
  const match=html.match(new RegExp('<select\\b([^>]*\\bid=["\']'+id+'["\'][^>]*)>([\\s\\S]*?)</select>'));
  if (!match) return null;
  const options=Array.from(match[2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g),row=>({
    value:row[1].match(/\bvalue=["']([^"']*)["']/)?.[1] ?? '',
    selected:/\bselected\b/.test(row[1]), disabled:/\bdisabled\b/.test(row[1]), text:row[2]
  }));
  return {disabled:/\bdisabled\b/.test(match[1]),options};
}
const dependencyId='business-field-series-dependency';
function newField(id,dictionaryId,depends=[]) {
  return {id,label:'测试 '+id,type:'interface',dictionaryId,depends,businessKey:'',options:[],enabled:true};
}

function declarationsAndProjection() {
  const h=harness(),{D,M,scope}=h;
  check(D.available('d-series',scope)&&D.available('d-store',scope),'real adapter authorizes both seeded sources in the isolated tenant');
  equal(D.capability('series').queryConditions,[],'series lookup declares no query conditions');
  equal(D.capability('stores').queryConditions,[{key:'seriesCode',label:'车系',required:false,sourceKind:'series',sourceCardinality:'single',valueKey:'code',help:'可按关联字段的车系编码查询门店；不使用其他字段时，查询当前租户全部可用门店。'}],'store lookup declares one optional single-source series-code condition');
  equal(M.queryConditions(M.getField('intendedSeries',scope)),[],'series field resolves conditionless selected capability');
  equal(M.queryConditions(M.getField('intendedStore',scope)),D.capability('stores').queryConditions,'store field resolves its selected dictionary capability');
  equal(M.queryConditions({type:'text'}),[],'ordinary fields have no query conditions');
  equal(M.queryConditions({type:'interface',dictionaryId:'d-missing'}),[],'missing source does not invent conditions');
  const read=M.queryConditions(M.getField('intendedStore',scope));read[0].label='不应写回';
  check(M.queryConditions(M.getField('intendedStore',scope))[0].label==='车系','query-condition projection cannot mutate integration metadata');
  check(Object.isFrozen(D.capabilities)&&Object.isFrozen(D.capabilities[1].queryConditions[0]),'integration declarations are immutable in the actual adapter');
}

function editorUsesDeclarations() {
  const h=harness(),{M,P,scope}=h;
  let html=h.open('intendedStore');
  check(html.includes('取数接口')&&html.includes('请选择取数接口'),'field editor exposes the approved interface label and prompt');
  check(!html.includes('>业务数据接口 ')&&!html.includes('关联车系字段'),'field editor replaces the opaque old source and association labels');
  check(html.includes('查询条件')&&html.includes('关联字段')&&html.includes('查询时是否需要其他字段配合'),'store editor explains the binding as a query condition');
  let binding=select(html,dependencyId);
  check(binding&&binding.options.find(row=>row.value==='intendedSeries')?.selected,'legacy depends binding is selected without migration');
  check(!binding.options.some(row=>row.value==='intendedStore'||row.value==='plannedStoreName'),'source list excludes self and ordinary text fields');
  check(html.includes(h.D.capability('stores').queryConditions[0].help),'integration help is visible where the source field is selected');
  const declared=h.D.capability('stores');
  declared.queryConditions[0].label='测试车型来源';
  declared.queryConditions[0].help='测试说明：请提供选择值的来源字段。';
  h.capability('stores',declared);
  html=h.open('intendedStore');
  check(html.includes('关联字段')&&html.includes('测试说明：请提供选择值的来源字段。'),'changing capability label and help changes the actual rendered editor');
  check(!html.includes('车系取自'),'condition label is not hardcoded in the editor');
  equal(M.queryConditions(M.getField('intendedStore',scope)),declared.queryConditions,'UI and validation read the same capability condition projection');
  declared.queryConditions=[];h.capability('stores',declared);
  html=h.open('intendedStore');
  check(M.interfaceKind(M.getField('intendedStore',scope))==='store'&&!select(html,dependencyId),'a store kind without a declared input renders no binding control');
  check(!html.includes('测试说明：请提供选择值的来源字段。'),'removed declaration does not leave stale help');
  html=h.open('intendedSeries');
  check(!select(html,dependencyId)&&!html.includes('车系取自'),'series lookup has no binding control');
  check(select(html,'business-field-interface')?.options.find(row=>row.value==='d-series')?.selected,'series source remains selected');
  check(!h.raw(),'opening and switching test metadata do not write business configuration');
  P.close();
}

function modelRejectsInvalidBindings() {
  const h=harness(),{M,scope}=h;
  const original=M.catalog(scope);
  let result=M.saveField({...newField('missingBinding','d-store'),useQueryConditions:true},scope);
  check(!result.ok&&result.message.includes('关联字段'),'store requires a field for its declared query condition');
  check(!M.saveField(newField('textBinding','d-store',['plannedStoreName']),scope).ok,'text cannot supply a series code');
  check(!M.saveField(newField('storeBinding','d-store',['intendedStore']),scope).ok,'store selection cannot supply a series code');
  check(!M.saveField(newField('unknownBinding','d-store',['noSuchField']),scope).ok,'missing source field is rejected');
  check(!M.saveField(newField('selfBinding','d-store',['selfBinding']),scope).ok,'self reference is rejected');
  check(!M.saveField(newField('twoBindings','d-store',['intendedSeries','plannedStoreName']),scope).ok,'prebuilt store condition cannot accept multiple field bindings');
  check(!M.saveField(newField('seriesWithBinding','d-series',['intendedSeries']),scope).ok,'conditionless series lookup rejects stale dependencies');
  check(!h.raw(),'rejected new bindings do not create or rewrite persisted configuration');
  equal(M.catalog(scope).fields,original.fields,'invalid binding attempts preserve the previous field catalog');
  const success=M.saveField(newField('anotherStore','d-store',['intendedSeries']),scope);
  check(success.ok,'single existing series field is an accepted query input');
  const saved=M.getField('anotherStore',scope);
  equal(saved.depends,['intendedSeries'],'binding persists in the existing one-element depends format');
  check(!Object.hasOwn(saved,'queryConditions')&&!Object.hasOwn(saved,'parameters')&&!Object.hasOwn(saved,'sourceKind'),'capability parameters are not copied into tenant field storage');
}

function editorChangesAndGuards() {
  const h=harness(),{M,P,scope}=h;
  P.open('field');P.setBasic('label','切换接口的测试字段');P.setBasic('type','interface');
  check(h.layer().includes('请先选择取数接口')&&!h.layer().includes('请选择一个车系'),'interface field with no selected source prompts for an interface rather than assuming a series capability');
  P.setDictionary('d-store');P.setUseQueryConditions(true);
  check(select(h.layer(),dependencyId)&&!select(h.layer(),dependencyId).options.some(row=>row.selected&&row.value),'new store interface asks for its declared input');
  P.setDependency('plannedStoreName');
  check(h.error().length>0,'UI refuses an ordinary field as the query input');
  P.save();
  check(h.error().includes('关联字段')&&!M.catalog(scope).fields.some(row=>row.label==='切换接口的测试字段'),'UI cannot save a store field with no condition binding');
  P.setDependency('intendedSeries');
  P.setDictionary('d-series');
  check(!select(h.layer(),dependencyId),'switching to a conditionless interface removes the input control');
  P.save();
  let saved=M.catalog(scope).fields.find(row=>row.label==='切换接口的测试字段');
  check(saved?.dictionaryId==='d-series'&&saved.depends.length===0,'switching interface clears the inapplicable binding before save');
  P.open('field',saved.id);P.setDictionary('d-store');P.setUseQueryConditions(true);P.save();
  check(h.error().includes('关联字段'),'switching back to store requires a fresh binding');
  equal(M.getField(saved.id,scope).depends,[],'incomplete interface switch leaves persisted field unchanged');
  P.setDependency('intendedSeries');P.save();
  saved=M.getField(saved.id,scope);
  check(saved.dictionaryId==='d-store'&&saved.depends[0]==='intendedSeries','rebinding then saving updates the intended interface and existing binding shape');
  h.open('intendedStore');P.setDependency('intendedStore');P.save();
  check(M.getField('intendedStore',scope).depends[0]==='intendedSeries','UI self-binding rejection preserves the last legitimate dependency');
}

function unavailableSourcesRemainEditable() {
  const h=harness(),{M,P,scope,D}=h;
  const category=M.get('lead',scope);
  category.fields.filter(row=>['intendedSeries','intendedStore'].includes(row.fieldId)).forEach(row=>{row.enabled=false;row.required=false;});
  check(M.save(category,scope).ok,'category can hide the pair before disabling its source field');
  check(M.saveField({...M.getField('intendedSeries',scope),enabled:false},scope).ok,'unused series field may be disabled');
  let html=h.open('intendedStore'), binding=select(html,dependencyId);
  check(binding?.options.find(row=>row.value==='intendedSeries')?.selected,'disabled bound field stays selected for editing');
  check(binding?.options.find(row=>row.value==='intendedSeries')?.disabled,'disabled field is shown as unavailable for a new selection');
  P.setBasic('label','停用来源下保留条件');P.save();
  check(M.getField('intendedStore',scope).label==='停用来源下保留条件','editing an unrelated label preserves a disabled existing dependency');
  equal(M.getField('intendedStore',scope).depends,['intendedSeries'],'disabled field reference is retained');
  check(D.setEnabled('d-store',false).ok&&!D.available('d-store',scope),'real adapter can make the selected interface unavailable');
  html=h.open('intendedStore');
  const option=select(html,'business-field-interface')?.options.find(row=>row.value==='d-store');
  check(option?.selected&&option.disabled&&option.text.includes('保留引用'),'unavailable interface remains explicitly selected as a retained reference');
  check(select(html,dependencyId)?.options.find(row=>row.value==='intendedSeries')?.selected,'unavailable interface still exposes its existing query binding for repair');
  P.setBasic('label','不可用接口保留配置');P.save();
  check(M.getField('intendedStore',scope).label==='不可用接口保留配置','unavailable source does not prevent unrelated edits of an existing field');
  equal(M.getField('intendedStore',scope).depends,['intendedSeries'],'editing an unavailable source does not erase its historical binding');
  check(!M.saveField(newField('newUnavailable','d-store',['intendedSeries']),scope).ok,'unavailable interface cannot be newly referenced');
}

function scopeAndStoredValuesRemainStable() {
  const h=harness(),{M,D,scope}=h, catalog=M.catalog(scope);
  equal(D.capabilities.map(row=>row.id),['series','stores'],'only the two approved prebuilt capabilities exist');
  equal(D.entries().map(row=>row.id),['d-series','d-store'],'no new arbitrary interface or parameter dictionary is introduced');
  check(catalog.fields.length===14&&catalog.fields.filter(row=>row.type==='interface').length===2,'existing field inventory contains only the approved intention additions');
  check(catalog.rows.find(row=>row.id==='lead').fields.length===8,'lead keeps six original fields and the intention pair');
  check(M.getField('plannedStoreName',scope).type==='text','original planned-arrival store remains an ordinary text field');
  check(M.saveField({...M.getField('intendedStore',scope),label:'按接口条件选择门店'},scope).ok,'existing field edit can be persisted without a data migration');
  const raw=JSON.parse(h.raw()), stored=raw.scopes[0].fields.find(row=>row.id==='intendedStore');
  check(raw.version===3&&raw.seriesSelectionPolicy==='single','existing configuration version and single-series policy are retained');
  equal(Object.keys(stored).sort(),['id','label','type','businessKey','options','enabled','dictionaryId','depends','useQueryConditions','parameterBinding'].sort(),'field storage remains the existing shape');
  const values={businessType:'lead',intendedSeries:{code:'NEV-A',name:'当时车系',type:'NEV',state:'valid'},intendedStore:[{code:'N01',name:'当时店一',type:'NEV',state:'valid'},{code:'N02',name:'当时店二',type:'NEV',state:'valid'}],plannedStoreName:'原文本门店'};
  const snapshot=M.callbackSnapshot(values,scope);
  check(!Array.isArray(snapshot.values.intendedSeries)&&snapshot.values.intendedSeries.code==='NEV-A','single series value stays a single code/name object');
  equal(snapshot.values.intendedStore,[{code:'N01',name:'当时店一',type:'NEV'},{code:'N02',name:'当时店二',type:'NEV'}],'multi-store values and names stay an array of store snapshots');
  check(snapshot.values.plannedStoreName==='原文本门店','ordinary field data is not affected by condition configuration');
  const acceptance=fs.readFileSync(path.join(root,'memory/acceptance-map.md'),'utf8');
  const ids=[...new Set(acceptance.match(/AC-\d+/g)||[])].sort();
  equal(ids,Array.from({length:34},(_,index)=>'AC-'+(105+index)),'existing 34 acceptance identifiers are retained without scope expansion');
}

declarationsAndProjection();
editorUsesDeclarations();
modelRejectsInvalidBindings();
editorChangesAndGuards();
unavailableSourcesRemainEditable();
scopeAndStoredValuesRemainStable();
console.log(JSON.stringify({passed,scope:'capability-declared query inputs, actual editor transitions, retained references and unchanged business storage'}));
