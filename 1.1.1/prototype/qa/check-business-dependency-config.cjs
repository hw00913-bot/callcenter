'use strict';
const {install:installGeneric}=require('./fixtures/current-generic.cjs');
/* Current-schema checks. Retired compatibility evidence: qa/retired/compatibility/check-business-dependency-config.cjs. */
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
        if (!nodes.has(id)) nodes.set(id,{textContent:'',innerHTML:'',value:'',hidden:false,nextElementSibling:{disabled:false}});
        return nodes.get(id);
      },
      querySelector:()=>null
    }
  };
  w.window=w;
  vm.createContext(w);
  const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),w,{filename:file});
  load('config/customer-intent-profile.js');load('mock/mapping-series-data.js');load('js/components/mapping-series-adapter.js');load('js/components/business-data.js');
  const realData=w.BusinessData;
  // The real adapter owns every method. Tests can vary a capability's descriptive
  // declaration without adding any editable parameter or alternate data source.
  w.BusinessData={...realData, capability:id=>overrides.has(id)?copy(overrides.get(id)):realData.capability(id)};
  load('js/components/customer-business.js');installGeneric(w,{scope});
  load('js/pages/business-categories.js');
  const M=w.CustomerBusiness,P=w.BusinessConfiguration;
  P.render();
  return {
    scope,storage,w,M,P,D:realData,initialRaw:storage.get(M.storageKey),notices,events,
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
  return {id,label:'测试 '+id,type:'interface',dictionaryId,depends,useQueryConditions:depends.length>0,...(depends.length?{parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code',required:true}}:{}),businessKey:'',options:[],enabled:true};
}


// Extra sources are isolated capability declarations. No external API or production configuration is used.
function genericHarness() {
  const h=harness(), entries=[{id:'d-country',capabilityId:'country',name:'国家查询'},{id:'d-province',capabilityId:'province',name:'省份查询'},{id:'d-city',capabilityId:'city',name:'城市查询'},{id:'d-multi',capabilityId:'multi',name:'多选结果查询'}];
  const output=[{key:'code',label:'编码',valueType:'string',valueDomain:'fixture.lookup-code',valueDomainLabel:'测试目录编码'},{key:'name',label:'名称',valueType:'string',valueDomain:'fixture.display-name',valueDomainLabel:'测试名称'},{key:'externalId',label:'外部标识',valueType:'string',valueDomain:'fixture.external-id',valueDomainLabel:'测试外部标识'}];
  const condition=key=>(key==='countryCode'?[key,'countryId','countryReference']:[key]).map(name=>({key:name,label:'前置选择',sourceKind:'*',sourceCardinality:'single',valueKey:'code',required:false,help:'将上游已选值传给当前接口。',valueType:'string',valueDomain:name==='countryId'?'fixture.external-id':name==='countryReference'?'fixture.display-name':'fixture.lookup-code',valueDomainLabel:name==='countryId'?'测试外部标识':name==='countryReference'?'测试名称':'测试目录编码'}));
  h.capability('country',{id:'country',kind:'country',selectionMode:'single',returnFields:output,queryConditions:[]});
  h.capability('province',{id:'province',kind:'province',selectionMode:'single',returnFields:output,queryConditions:condition('countryCode')});
  h.capability('city',{id:'city',kind:'city',selectionMode:'single',returnFields:output,queryConditions:condition('provinceCode')});
  h.capability('multi',{id:'multi',kind:'multi',selectionMode:'multiple',returnFields:output,queryConditions:[]});
  const original=h.w.BusinessData;
  h.w.BusinessData={...original,entries:()=>[...original.entries(),...entries],entry:id=>entries.find(row=>row.id===id)||original.entry(id),available:(id,scope)=>entries.some(row=>row.id===id)||original.available(id,scope)};
  return {...h,condition,output};
}
const field=(id,dictionaryId,sourceId='',binding)=>({...newField(id,dictionaryId,sourceId?[sourceId]:[]),useQueryConditions:!!sourceId,...(binding?{parameterBinding:typeof binding==='object'?{required:true,...binding}:binding}:{})});
const category=(id,ids)=>({id,label:'测试分类 '+id,codeLabel:'业务编码',enabled:true,fields:ids.map(fieldId=>({fieldId,enabled:true,required:false}))});
function seededChain() {
  const h=genericHarness(),{M,scope}=h;
  check(M.saveField(field('country','d-country'),scope).ok,'generic first interface without a dependency is accepted');
  check(M.saveField(field('province','d-province','country',{parameterName:'countryId',sourceValueKey:'externalId',required:true}),scope).ok,'generic second interface maps an explicit upstream output to a custom downstream input');
  check(M.saveField(field('city','d-city','province',{parameterName:'provinceCode',sourceValueKey:'code',required:true}),scope).ok,'third interface depends on the second without domain-specific kind checks');
  return h;
}
function configurationAndMetadata() {
  const h=seededChain(),{M,P,scope}=h;
  equal(M.activeDependencies(M.getField('country',scope)),[],'first node is independent');
  equal(M.parameterBinding(M.getField('province',scope)),{parameterName:'countryId',sourceValueKey:'externalId',required:true},'explicit output/input mapping persists unchanged');
  equal(M.parameterBinding(M.getField('city',scope)),{parameterName:'provinceCode',sourceValueKey:'code',required:true},'explicit current mapping remains unchanged');
  check(M.save(category('chain',['city','province','country']),scope).ok,'closed three-level dependency accepts category order independently from lookup order');
  const hidden=M.get('chain',scope);hidden.fields.find(ref=>ref.fieldId==='country').enabled=false;
  const rejected=M.save(hidden,scope);check(!rejected.ok&&rejected.message.includes('country'),'category save rejects a hidden ancestor at depth two');
  check(!M.save(category('missing',['city','country']),scope).ok,'category save rejects a missing direct ancestor');
  let html=h.open('province');
  check(html.includes('查询时是否需要其他字段配合')&&html.includes('从哪个字段取条件（关联字段）')&&html.includes('使用该记录的哪项数据（上游取值字段）')&&html.includes('传给接口的参数名（下游入参字段名）'),'generic editor exposes the switch and all three mapping controls');
  check(select(html,dependencyId).options.find(row=>row.value==='country')?.selected,'generic upstream field is selected');
  check(!select(html,dependencyId).options.some(row=>row.value==='province'||row.value==='plannedStoreName'),'self and text are absent from the upstream list');
  check(select(html,'business-field-source-value-key').options.find(row=>row.value==='externalId')?.selected,'upstream declared output is selected');
  check(/id="business-field-parameter-name"[^>]*value="countryId"/.test(html)&&!/id="business-field-parameter-name"[^>]*(?:readonly|disabled)/.test(html),'downstream parameter name is actually editable');
  P.setParameterBinding('parameterName','countryReference');P.setParameterBinding('sourceValueKey','name');P.save();
  equal(M.getField('province',scope).parameterBinding,{parameterName:'countryReference',sourceValueKey:'name',required:true},'editor saves selected output and manually edited input name');
  h.open('province');P.setUseQueryConditions(false);
  check(!select(h.layer(),dependencyId)&&!h.layer().includes('id="business-field-parameter-name"'),'switching off removes the mapping controls');
  P.save();const independent=M.getField('province',scope);
  check(independent.useQueryConditions===false&&!independent.depends.length&&!Object.hasOwn(independent,'parameterBinding'),'switching off persists no dependency and no inactive mapping');
  check(M.save({...M.get('chain',scope),fields:M.get('chain',scope).fields.filter(ref=>ref.fieldId!=='country')},scope).ok,'independent second node no longer requires the first in its category');
  h.open('country');check(select(h.layer(),'business-field-use-query-conditions').options.find(row=>row.value==='true')?.disabled,'interface without a declared preinput cannot enable a fictitious filter');
}
function graphAndParameterGuards() {
  const h=seededChain(),{M,scope}=h;
  const original=h.raw();
  check(!M.saveField(field('self','d-city','self'),scope).ok,'self-reference is rejected');
  check(!M.saveField(field('lost','d-city','missing'),scope).ok,'nonexistent upstream field is rejected');
  check(!M.saveField(field('textSource','d-city','plannedStoreName'),scope).ok,'plain text cannot act as an upstream API record');
  check(!M.saveField({...field('tooMany','d-city','country'),depends:['country','province']},scope).ok,'a second simultaneous upstream is rejected for the first release');
  check(!M.saveField(field('incompatible','d-fixture-store','country'),scope).ok,'prebuilt store retains its declared series-kind compatibility');
  check(!M.saveField(field('unknownOutput','d-city','province',{parameterName:'provinceCode',sourceValueKey:'secret'}),scope).ok,'undeclared upstream output cannot be mapped');
  for(const name of ['__proto__','constructor','prototype','a.b','wrong name','a'.repeat(65)]) {
    check(!M.saveField(field('badName','d-city','province',{parameterName:name,sourceValueKey:'code'}),scope).ok,'unsafe or unsupported parameter identifier is rejected: '+name);
  }
  check(!M.saveField(field('badRequired','d-city','province',{parameterName:'provinceCode',sourceValueKey:'code',required:'false'}),scope).ok,'explicit nonboolean query requiredness is rejected');
  check(!M.saveField(field('badBinding','d-city','province','wrong'),scope).ok,'malformed binding object is rejected');
  equal(h.raw(),original,'rejected graph and mapping changes leave stored configuration byte-identical');
  check(M.saveField(field('many','d-multi'),scope).ok,'multiple-select capability may exist as a terminal field');
  check(!M.saveField(field('usesMany','d-city','many'),scope).ok,'current scalar input cannot bind a multiple-select upstream');
  const country=h.w.BusinessData.capability('country');country.queryConditions=h.condition('parentCode');h.capability('country',country);
  const prior=h.raw(), cycle=M.saveField({...M.getField('country',scope),useQueryConditions:true,depends:['city'],parameterBinding:{parameterName:'parentCode',sourceValueKey:'code',required:true}},scope);
  check(!cycle.ok&&cycle.message.includes('循环'),'three-node indirect cycle is rejected');
  equal(h.raw(),prior,'cyclic draft does not rewrite the stored graph');
  const specific=h.w.BusinessData.capability('city');specific.queryConditions[0].sourceKind='province';h.capability('city',specific);
  check(M.saveField({...M.getField('city',scope),label:'城市专用来源'},scope).ok,'specific compatible kind can retain the existing upstream');
  check(!M.saveField({...M.getField('city',scope),depends:['country']},scope).ok,'specific kind rejects an incompatible generic upstream');
  const falseInput={...M.getField('city',scope),useQueryConditions:false,depends:['missing'],parameterBinding:{parameterName:'__proto__',sourceValueKey:'secret'}};
  check(!M.saveField(falseInput,scope).ok,'independent mode rejects stale mapping data instead of silently migrating it');const cleanIndependent={...M.getField('city',scope),useQueryConditions:false,depends:[]};delete cleanIndependent.parameterBinding;check(M.saveField(cleanIndependent,scope).ok,'explicitly cleared independent mapping saves');
  const cleared=M.getField('city',scope);equal(cleared.depends,[],'inactive dependency is cleared');check(!Object.hasOwn(cleared,'parameterBinding'),'inactive binding is removed');
}
function independentStores() {
  const h=genericHarness(),{M,P,scope}=h;
  const configured=M.getField('genericStore',scope);
  check(configured.useQueryConditions===true&&configured.parameterBinding.required===true,'fixture has an explicit current required binding');
  const independentConfiguration={...configured,useQueryConditions:false,depends:[]};delete independentConfiguration.parameterBinding;check(M.saveField(independentConfiguration,scope).ok,'configured store can explicitly become independent');
  const lead=M.get('lead',scope);lead.fields.find(row=>row.fieldId==='genericSeries').enabled=false;
  check(M.save(lead,scope).ok,'independent store does not force its category to show a series');
  check(!M.configurationIssue('lead',scope),'independent store is valid at runtime');
  check(M.saveField(newField('independentStore','d-fixture-store'),scope).ok,'a new store field defaults to an independent lookup');
  const independent=M.getField('independentStore',scope);check(independent.useQueryConditions===false&&!independent.depends.length,'new independent field persists the explicit false value');
  const html=h.open('independentStore');check(html.includes('独立查询当前租户可用的全部门店')&&!select(html,dependencyId),'independent store editor explains its all-available-store lookup');
  P.open('field');P.setBasic('type','interface');P.setDictionary('d-fixture-store');
  check(select(h.layer(),'business-field-use-query-conditions').options.find(row=>row.value==='false')?.selected&&!select(h.layer(),dependencyId),'new interface editor defaults the association switch to no');
  const persisted=JSON.parse(h.raw());check(persisted.version===M.storageVersion&&!Object.hasOwn(persisted,'seriesSelectionPolicy'),'current schema has no prior compatibility policy');
}


function retainedMissingCapability() {
  const h=genericHarness(),{M,P,scope}=h;
  check(M.saveField({...M.getField('genericStore',scope),label:'原来源门店'},scope).ok,'a current binding can be saved through its normal edit');
  const raw=JSON.parse(h.raw()), stored=raw.scopes[0].fields.find(row=>row.id==='genericStore');stored.dictionaryId='lost-source';h.storage.set(M.storageKey,JSON.stringify(raw));
  check(M.catalog(scope).ok,'current unavailable dictionary does not make the tenant configuration unreadable');
  const html=h.open('genericStore');check(html.includes('接口信息暂不可用')&&html.includes('保留引用'),'editor describes the missing metadata as a retained source');
  P.setBasic('label','待恢复的门店');P.save();
  check(M.getField('genericStore',scope).label==='原来源门店'&&h.error().includes('恢复来源'),'unknown capability blocks save with an explicit recovery message instead of guessing metadata');
  equal(M.getField('genericStore',scope).depends,['genericSeries'],'unknown-source edit retains the stable upstream identifier');
  check(M.getField('genericStore',scope).parameterBinding.required===true,'explicit dependency remains required when its source metadata is unavailable');
  check(!M.saveField({...newField('newLost','lost-source',['genericSeries']),parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code',required:true}},scope).ok,'unavailable source cannot be newly referenced');
}
function optionalDependencyConfiguration() {
  const h=seededChain(),{M,P,scope}=h;
  const optional={...M.getField('city',scope),parameterBinding:{parameterName:'provinceCode',sourceValueKey:'code',required:false}};
  check(M.saveField(optional,scope).ok,'a supported query input can be configured as optional');
  check(M.save(category('optionalOnly',['city']),scope).ok,'optional source need not be included in its category');
  check(!M.configurationIssue('optionalOnly',scope),'category without an optional upstream remains operational');
  check(M.save(category('optionalPlusSource',['country','province','city']),scope).ok,'optional source can also be included for use when populated');
  const noRoot=M.get('optionalPlusSource',scope);noRoot.fields=noRoot.fields.filter(row=>row.fieldId!=='country');
  check(!M.save(noRoot,scope).ok,'visible optional source still enforces its own required ancestor');
  P.open('category','optionalOnly');check(h.layer().includes('查询条件：可不填写 测试 province'),'category card identifies the configured upstream even when optional');
  P.open('field','city');check(select(h.layer(),'business-field-dependency-required').options.find(row=>row.value==='false')?.selected,'optional query requirement is shown separately from field requiredness');
  P.setParameterBinding('required',true);P.save();
  check(h.error().includes('须同时显示关联字段'),'switching an in-use optional dependency to required requires repairing its category first');
  check(M.getField('city',scope).parameterBinding.required===false,'rejected requiredness change preserves the prior optional mapping');
  P.open('field','city');P.setParameterBinding('required',false);P.save();
  check(M.getField('city',scope).parameterBinding.required===false,'optional query requirement persists through editor save');
  P.open('category','optionalOnly');h.w.document.getElementById('business-category-field-picker').value='country';P.addCategoryField();P.save();
  P.open('category','optionalOnly');h.w.document.getElementById('business-category-field-picker').value='province';P.addCategoryField();P.save();
  P.open('category','optionalOnly');const provinceIndex=M.get('optionalOnly',scope).fields.findIndex(row=>row.fieldId==='province');P.setCategoryField(provinceIndex,'enabled',false);P.save();
  check(M.get('optionalOnly',scope).fields.find(row=>row.fieldId==='province').enabled===false,'optional dependent does not block hiding its source');
  check(M.get('optionalOnly',scope).fields.every(row=>row.required===false),'query requiredness never changes customer field required flags');
  check(M.save(category('newOptional',[]),scope).ok,'another category starts empty');
  P.open('category','newOptional');h.w.document.getElementById('business-category-field-picker').value='city';P.addCategoryField();P.save();
  equal(M.get('newOptional',scope).fields.map(row=>row.fieldId),['city'],'optional dependent can be added before any source, without adding ancestors');
  let columns;h.w.PlatformUI.table=value=>{columns=value;return '';};P.render('field');
  const column=columns.find(row=>row.label==='上游依赖');check(column.render(null,M.getField('city',scope)).startsWith('可选 · '),'list distinguishes optional upstream dependency');
  check(column.render(null,M.getField('province',scope)).startsWith('必需 · '),'list distinguishes required upstream dependency');
  const explicitStore={...M.getField('genericStore',scope),useQueryConditions:true,parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code',required:false}};
  check(M.saveField(explicitStore,scope).ok,'prebuilt store permits a new optional series binding');
  P.open('field','genericStore');
  check(h.layer().includes('可按关联字段筛选门店（可多选）')&&!h.layer().includes('请先选择关联字段，再选择门店'),'optional store preview does not impose a mandatory prior selection');
  check(h.layer().includes('可选关联字段：通用车系'),'optional preview metadata explicitly labels the dependency requirement');
  P.open('category','lead');check(h.layer().includes('查询条件：可不填写 通用车系'),'category card explicitly labels optional dependency');
  P.open('field','genericStore');P.setParameterBinding('required',true);P.save();P.open('field','genericStore');
  check(h.layer().includes('请先选择关联字段，再选择门店（可多选）')&&h.layer().includes('必需关联字段：通用车系'),'required store preview retains the prior-value instruction and explicit requirement label');
  P.open('category','lead');check(h.layer().includes('查询条件：先填写并确认 通用车系'),'category card explicitly labels required dependency');
  P.open('field','genericStore');P.setUseQueryConditions(false);P.setUseQueryConditions(true);
  check(select(h.layer(),'business-field-dependency-required').options.find(row=>row.value==='false')?.selected,'newly enabled optional store input defaults from its capability declaration');
  const forced=h.w.BusinessData.capability('city');forced.queryConditions[0].required=true;h.capability('city',forced);
  check(!M.saveField({...M.getField('city',scope),useQueryConditions:false},scope).ok,'a technical mandatory input cannot be bypassed with independent mode');
  check(!M.saveField({...M.getField('city',scope),parameterBinding:{parameterName:'provinceCode',sourceValueKey:'code',required:false}},scope).ok,'a technical mandatory input cannot be configured optional');
  P.open('field','city');check(select(h.layer(),'business-field-dependency-required').options.find(row=>row.value==='false')?.disabled,'mandatory integration input disables optional requirement choice');
  check(select(h.layer(),'business-field-use-query-conditions').options.find(row=>row.value==='false')?.disabled,'mandatory integration input disables independent mode');
  const storedBefore=h.raw();P.setParameterBinding('required',false);check(h.error().includes('必须设为必需'),'editor reports why technical requiredness cannot be turned off');
  equal(h.raw(),storedBefore,'blocked edit leaves persisted configuration intact');
}
function categoryEditorDependencyChecks() {
  const h=seededChain(),{M,P,scope}=h;
  check(M.save(category('empty',[]),scope).ok,'test category starts empty');
  P.open('category','empty');h.w.document.getElementById('business-category-field-picker').value='city';P.addCategoryField();
  check(h.error().includes('请先添加并显示上游字段')&&h.error().includes('province')&&h.error().includes('country'),'adding the third node immediately reports both missing ancestors');
  P.save();equal(M.get('empty',scope).fields,[],'rejected addition does not auto-add its ancestors');
  P.open('category','empty');h.w.document.getElementById('business-category-field-picker').value='country';P.addCategoryField();P.save();
  equal(M.get('empty',scope).fields.map(row=>row.fieldId),['country'],'first ancestor can be added independently');
  P.open('category','empty');h.w.document.getElementById('business-category-field-picker').value='province';P.addCategoryField();P.save();
  P.open('category','empty');h.w.document.getElementById('business-category-field-picker').value='city';P.addCategoryField();P.save();
  equal(M.get('empty',scope).fields.map(row=>row.fieldId),['country','province','city'],'configured ancestors enable normal category additions');
  check(M.get('empty',scope).fields.every(row=>!row.required),'dependency checks do not change each field required setting');
  P.open('category','empty');P.setCategoryField(0,'enabled',false);check(h.error().includes('依赖此字段的接口字段'),'category cannot hide a source while a dependent remains visible');
  let columns;
  h.w.PlatformUI.table=(value)=>{columns=value;return '';};P.render('field');
  const dependencyColumn=columns.find(row=>row.label==='上游依赖');check(!!dependencyColumn,'field list includes an explicit upstream-dependency column');
  check(dependencyColumn.render(null,M.getField('country',scope))==='无','independent field list row says no dependency');
  check(dependencyColumn.render(null,M.getField('city',scope)).includes('province'),'dependent list row names its configured upstream');
}
configurationAndMetadata();
graphAndParameterGuards();
independentStores();
categoryEditorDependencyChecks();
optionalDependencyConfiguration();
retainedMissingCapability();
console.log(JSON.stringify({passed,scope:'generic A→B→C dependency configuration, scalar parameter mapping, independent stores and category closure'}));
