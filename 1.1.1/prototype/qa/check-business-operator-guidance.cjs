'use strict';
const {install:installGeneric}=require('./fixtures/current-generic.cjs');
/* Current-schema checks. Retired compatibility evidence: qa/retired/compatibility/check-business-operator-guidance.cjs. */
/* Operator configuration handoffs, explicit dependency repair and draft boundaries.
 * Real business models/editor run in an isolated VM; the small DOM records focus
 * and redraws. No browser profile, tenant data or external interface is touched.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const decode = value => String(value ?? '').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
let passed = 0;
const check = (value, message) => { assert.ok(value, message); passed += 1; };
const equal = (actual, expected, message) => { assert.deepEqual(copy(actual), copy(expected), message); passed += 1; };

function attr(attributes, name) {
  const found=attributes.match(new RegExp('(?:^|\\s)'+name+'(?:=(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+)))?(?=\\s|$)'));
  return found ? decode(found[1] ?? found[2] ?? found[3] ?? '') : null;
}
function elementContent(html, start, tag, openingEnd) {
  if (['input','br','hr','img','meta','link'].includes(tag)) return '';
  const matcher=new RegExp('<\\/?'+tag+'\\b[^>]*>','gi');
  matcher.lastIndex=openingEnd;
  let depth=1, token;
  while ((token=matcher.exec(html))) {
    depth+=token[0].startsWith('</')?-1:1;
    if (!depth) return html.slice(openingEnd,token.index);
  }
  return html.slice(openingEnd);
}
function setSelectOptions(node,html) {
  const options=Array.from(html.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g),option=>({value:attr(option[1],'value')||'',selected:attr(option[1],'selected')!==null,disabled:attr(option[1],'disabled')!==null}));
  node.value=(options.find(option=>option.selected)||options[0])?.value||'';
  node.options=options;
}

function harness() {
  const scope={enterpriseId:'e1',tenantId:'t1'}, storage=new Map(), notices=[], events=[];
  const nodes=new Map(), overrides=new Map(), scrolls=[], focuses=[];
  const runtime={sessionId:'s1',roleCode:'SUPER_ADMIN',layer:'',page:'',draws:0,refreshes:0,closes:0,confirmation:null};
  let w, P;
  function index(html, parent=null) {
    const matcher=/<([a-z][a-z0-9-]*)\b([^>]*)>/gi;
    let token;
    while ((token=matcher.exec(html))) {
      const id=attr(token[2],'id'); if (!id) continue;
      const tag=token[1].toLowerCase(), inner=elementContent(html,token.index,tag,matcher.lastIndex);
      const attributes=token[2];
      const node={
        id,tagName:tag.toUpperCase(),parentElement:parent,nextElementSibling:{disabled:false},
        _html:inner,_text:decode(inner.replace(/<[^>]*>/g,'')),_attributes:attributes,
        value:attr(attributes,'value')||'',hidden:attr(attributes,'hidden')!==null,
        disabled:attr(attributes,'disabled')!==null,checked:attr(attributes,'checked')!==null,
        selectionStart:0,selectionEnd:0,dataset:{},
        focus(){w.document.activeElement=this;focuses.push(id);},
        scrollIntoView(){scrolls.push(id);},
        setAttribute(name,value){this[name==='tabindex'?'tabIndex':name]=String(value);},
        removeAttribute(name){delete this[name];},getAttribute(name){return this[name] ?? attr(this._attributes,name);},
        querySelector(selector){return w.document.querySelector(selector);},
        querySelectorAll(selector){return w.document.querySelectorAll(selector);},
        closest(){return parent;}
      };
      Object.defineProperty(node,'innerHTML',{get(){return this._html;},set(value){
        for(const child of this._html.matchAll(/\bid=["']([^"']+)["']/g))nodes.delete(child[1]);
        this._html=String(value);this._text=decode(this._html.replace(/<[^>]*>/g,''));
        if(this.tagName==='SELECT')setSelectOptions(this,this._html);
        index(this._html,this);
      }});
      Object.defineProperty(node,'textContent',{get(){return this._text;},set(value){this._text=String(value);this._html=esc(value);}});
      if (tag==='select')setSelectOptions(node,inner);
      nodes.set(id,node);
    }
  }
  w={
    console,structuredClone,setTimeout,clearTimeout,queueMicrotask,
    requestAnimationFrame:callback=>callback(),
    CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
    crypto:require('node:crypto').webcrypto,
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))},
    AppState:{
      get:()=>({...scope,accountId:'a1',sessionId:runtime.sessionId,activeDomain:'CLOUD_CONTACT_CENTER'}),
      effectiveAccess:()=>({roleCode:runtime.roleCode,valid:true}),isReady:()=>true,isSuper:()=>true,canMenu:()=>true,authorizeObject:()=>true
    },
    CloudCallData:{instances:[{enterpriseId:scope.enterpriseId,status:'RUNNING'}],tenants:[{...scope,name:'模拟租户',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}],calls:[]},
    dispatchEvent:event=>events.push(event),addEventListener:()=>{},
    PlatformUI:{
      escape:esc,status:()=>'',pageHeader:()=>'',toolbar:()=>'',table:()=>'',empty:()=>'',
      confirm:options=>{runtime.confirmation=options;},
      closeLayer:()=>{runtime.closes+=1;runtime.layer='';nodes.clear();},
      openLayer:(_id,html)=>{runtime.layer=html;runtime.draws+=1;nodes.clear();index(html);w.document.activeElement={id:'layer-panel'};}
    },
    RouteRuntime:{refreshCurrent:()=>{runtime.refreshes+=1;runtime.page=P?.render()||'';index(runtime.page);}},
    showToast:(message,type)=>notices.push({message,type}),
    document:{activeElement:null,getElementById:id=>nodes.get(id)||null,
      querySelector:selector=>{
        const id=selector.match(/^#([\w-]+)$/)?.[1];return id?nodes.get(id)||null:null;
      },querySelectorAll:()=>[]}
  };
  w.window=w;vm.createContext(w);
  const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),w,{filename:file});
  load('config/customer-intent-profile.js');load('mock/mapping-series-data.js');load('js/components/mapping-series-adapter.js');load('js/components/business-data.js');
  const realData=w.BusinessData;
  w.BusinessData={...realData,capability:id=>overrides.has(id)?copy(overrides.get(id)):realData.capability(id)};
  load('js/components/customer-business.js');installGeneric(w,{scope});load('js/pages/business-categories.js');
  const M=w.CustomerBusiness;P=w.BusinessConfiguration;P.render();
  return {
    scope,storage,w,M,P,D:realData,initialRaw:storage.get(M.storageKey),notices,events,runtime,scrolls,focuses,
    node:id=>nodes.get(id)||null,layer:()=>runtime.layer,
    page:()=>{runtime.page=P.render();index(runtime.page);return runtime.page;},
    error:()=>nodes.get('business-config-error')?.textContent||'',
    capability:(id,value)=>overrides.set(id,copy(value)),raw:()=>storage.get(M.storageKey),
    open:id=>{P.open('field',id);return runtime.layer;}
  };
}

function genericHarness() {
  const h=harness(), entries=[{id:'d-country',capabilityId:'country',name:'国家查询'},{id:'d-province',capabilityId:'province',name:'省份查询'},{id:'d-city',capabilityId:'city',name:'城市查询'}];
  const output=[{key:'code',label:'编码',valueType:'string',valueDomain:'fixture.lookup-code',valueDomainLabel:'测试目录编码'},{key:'name',label:'名称',valueType:'string',valueDomain:'fixture.display-name',valueDomainLabel:'测试名称'},{key:'externalId',label:'外部标识',valueType:'string',valueDomain:'fixture.lookup-code',valueDomainLabel:'测试目录编码'}];
  const condition=key=>(key==='countryCode'?[key,'sourceCode']:key==='provinceCode'?[key,'sourceCode','provinceReference']:[key]).map(name=>({key:name,label:'前置选择',sourceKind:'*',sourceCardinality:'single',valueKey:'code',required:false,help:'将上游已选值传给当前接口。',valueType:'string',valueDomain:'fixture.lookup-code',valueDomainLabel:'测试目录编码'}));
  h.capability('country',{id:'country',kind:'country',selectionMode:'single',returnFields:output,queryConditions:[]});
  h.capability('province',{id:'province',kind:'province',selectionMode:'single',returnFields:output,queryConditions:condition('countryCode')});
  h.capability('city',{id:'city',kind:'city',selectionMode:'single',returnFields:output,queryConditions:condition('provinceCode')});
  const original=h.w.BusinessData;
  h.w.BusinessData={...original,entries:()=>[...original.entries(),...entries],entry:id=>entries.find(row=>row.id===id)||original.entry(id),available:(id,scope)=>entries.some(row=>row.id===id)||original.available(id,scope)};
  return h;
}
const field=(id,dictionaryId,sourceId='',required=false)=>({id,label:'测试 '+id,type:'interface',dictionaryId,depends:sourceId?[sourceId]:[],useQueryConditions:!!sourceId,businessKey:'',options:[],enabled:true,...(sourceId?{parameterBinding:{parameterName:'sourceCode',sourceValueKey:'code',required}}:{})});
const category=(id,ids=[])=>({id,label:'测试分类 '+id,codeLabel:'业务编码',enabled:true,fields:ids.map(fieldId=>({fieldId,enabled:true,required:false}))});
function seededChain() {
  const h=genericHarness(),{M,scope}=h;
  check(M.saveField(field('country','d-country'),scope).ok,'fixture saves an independent upstream');
  check(M.saveField(field('province','d-province','country',true),scope).ok,'fixture saves a required second node');
  check(M.saveField(field('city','d-city','province',true),scope).ok,'fixture saves a required third node');
  return h;
}
function runtimeConfirm(h) {
  assert.ok(h.runtime.confirmation,'dirty category exit requires explicit discard confirmation');
  const pending=h.runtime.confirmation;h.runtime.confirmation=null;pending.onConfirm();
}
function chooseCategoryField(h,id) {
  const picker=h.node('business-category-field-picker');check(!!picker,'category field picker is present');
  picker.value=id;h.P.selectCategoryField(id);
}
function beginChild(h,categoryId,{label='新建城市',dictionaryId='d-city',sourceId='province',required=true,parameterName='provinceReference'}={}) {
  h.P.open('category',categoryId);h.P.openRelated('field');
  h.P.setBasic('label',label);h.P.setBasic('type','interface');h.P.setDictionary(dictionaryId);
  if(sourceId){h.P.setUseQueryConditions(true);h.P.setDependency(sourceId);h.P.setParameterBinding('required',required);const input=h.node('business-field-parameter-name');if(input)input.value=parameterName;h.P.setParameterBinding('parameterName',parameterName);}
}

// New public handoffs are exercised below after the real editor is loaded.
// They are intentionally not mocked: a missing handler is a regression.

function standaloneHandoff() {
  const h=genericHarness(),{M,P,scope}=h;
  check(M.save(category('handoff'),scope).ok,'fixture creates a category to configure later');
  P.render('field');P.open('field');P.setBasic('label','运营新备注');P.save();
  const saved=M.catalog(scope).fields.find(row=>row.label==='运营新备注');
  check(!!saved,'standalone field save writes the field catalog');
  equal(M.get('handoff',scope).fields,[],'saving a standalone field does not silently add it to any category');
  h.page();
  check(h.node('business-config-saved-guidance')?.textContent.includes('运营新备注'),'saved field has a persistent named handoff instead of only a toast');
  check(!!h.node('business-config-next-category'),'saved handoff exposes the next configuration action');
  const stored=h.raw();P.configureSavedField();
  equal(h.raw(),stored,'going to category configuration does not save or mutate configuration');
  P.open('category','handoff');
  equal(h.node('business-category-field-picker')?.value,saved.id,'opening the chosen category preselects the saved field without adding it');
  equal(M.get('handoff',scope).fields,[],'pending preselection is not a persisted category reference');
  P.addCategoryField();
  check(h.node('business-category-cards')?.textContent.includes('运营新备注'),'explicit add puts the pending field into the current category draft');
  equal(M.get('handoff',scope).fields,[],'draft field addition waits for an explicit category save');
  P.close();runtimeConfirm(h);
  equal(M.get('handoff',scope).fields,[],'cancelling the category leaves its saved configuration untouched');
  check(!!M.getField(saved.id,scope),'cancelling the category retains the separately saved reusable field');
}

function requiredChildRepairAndCancel() {
  const h=seededChain(),{M,P,scope}=h;
  check(M.save(category('child-target'),scope).ok,'fixture creates an empty target category');
  const stored=h.raw();
  beginChild(h,'child-target');
  check(/保存[\s\S]*(?:加入|分类)/.test(h.node('business-config-save')?.textContent||''),'child save button describes the category handoff');
  check(h.node('business-required-source-repair')!==null,'required child exposes an explicit source-repair action before saving');
  P.save();
  check(!!h.error(),'child save is blocked while its required upstreams are absent');
  equal(h.raw(),stored,'blocked child save writes neither field nor category');
  P.addRequiredSources();
  equal(h.raw(),stored,'explicit repair changes only the parent category draft');
  check(!M.catalog(scope).fields.some(row=>row.label==='新建城市'),'repair does not save the unsaved child field');
  check(h.layer().includes('新建城市'),'repair keeps the current child name and editor');
  equal(h.node('business-field-parameter-name')?.value,'provinceReference','repair keeps the manually entered downstream parameter');
  equal(h.error(),'','repair clears the resolved missing-source error');
  P.save();
  const saved=M.catalog(scope).fields.find(row=>row.label==='新建城市');
  check(!!saved,'explicit child save persists its reusable definition');
  equal(saved.parameterBinding,{parameterName:'provinceReference',sourceValueKey:'code',required:true},'child save retains the exact mapping and query requiredness');
  equal(M.get('child-target',scope).fields,[],'saving the child does not implicitly save the parent category');
  const cards=h.node('business-category-cards')?.innerHTML||'';
  check(cards.indexOf('测试 country')<cards.indexOf('测试 province')&&cards.indexOf('测试 province')<cards.indexOf('新建城市'),'parent draft presents required ancestors before the new dependent');
  check(h.node('business-config-flow-note')?.textContent.includes('新建城市'),'parent confirms which field was added to its unsaved draft');
  P.close();runtimeConfirm(h);
  equal(M.get('child-target',scope).fields,[],'cancelling the parent discards source repair and the added category reference');
  check(!!M.getField(saved.id,scope),'cancelling the parent keeps the already saved reusable child definition');
}

function requiredRepairAndPersist() {
  const h=seededChain(),{M,P,scope}=h;
  const target=category('persist',['country']);target.fields[0].required=true;
  check(M.save(target,scope).ok,'fixture saves a target with one existing customer-required upstream');
  const oldCountry=M.get('persist',scope).fields[0];
  P.open('category','persist');chooseCategoryField(h,'city');
  const stored=h.raw();P.addCategoryField();
  check(!!h.error(),'adding a required dependent is blocked before repair');
  P.addRequiredSources();
  equal(h.raw(),stored,'source repair remains a draft even from the category field picker');
  equal(h.error(),'','repair clears the now-obsolete add-field error');
  P.addCategoryField();P.save();
  const saved=M.get('persist',scope);
  equal(saved.fields.map(row=>row.fieldId),['country','province','city'],'explicit add and save persist a closed required chain once');
  equal(saved.fields[0],oldCountry,'repair preserves existing upstream display and customer-required settings');
  check(saved.fields.filter(row=>row.fieldId!=='country').every(row=>row.required===false),'query dependency repair never marks new customer inputs required');
}

function optionalDoesNotRepair() {
  const h=seededChain(),{M,P,scope}=h;
  check(M.save(category('optional-target'),scope).ok,'fixture creates an optional target');
  const stored=h.raw();
  beginChild(h,'optional-target',{label:'可选条件城市',required:false});
  check(!h.node('business-required-source-repair'),'optional binding does not offer mandatory source repair');
  P.addRequiredSources();
  equal(h.raw(),stored,'calling repair for an optional dependency is a no-op');
  P.save();
  const saved=M.catalog(scope).fields.find(row=>row.label==='可选条件城市');
  check(!!saved&&!saved.parameterBinding.required,'optional dependent can be saved without its upstream in the parent');
  P.save();
  equal(M.get('optional-target',scope).fields.map(row=>row.fieldId),[saved.id],'optional dependent does not silently pull upstream fields into the category');
  check(M.get('optional-target',scope).fields.every(row=>row.required===false),'optional query requirement does not change customer-required rules');
}

function inputAndErrorContinuity() {
  const h=seededChain(),{M,P,scope}=h;
  P.open('field');P.save();check(!!h.error(),'invalid field save has an error for the operator');
  const draws=h.runtime.draws;
  P.setBasic('label','持续输入测试');
  equal(h.runtime.draws,draws,'typing a field name does not rebuild the editor');
  equal(h.error(),'','changing the invalid name clears the obsolete save error');
  P.setBasic('type','interface');P.setDictionary('d-city');P.setUseQueryConditions(true);P.setDependency('province');
  const input=h.node('business-field-parameter-name');check(!!input,'downstream parameter has a real input node');
  input.value='bad.name';P.setParameterBinding('parameterName',input.value);P.save();
  check(!!h.error(),'invalid downstream parameter is rejected with a visible error');
  check(h.node('business-field-parameter-name')===input,'validation keeps the current input node for correction');
  input.focus();input.selectionStart=4;input.selectionEnd=4;input.value='provinceReference';
  const before=h.runtime.draws;P.setParameterBinding('parameterName',input.value);
  equal(h.runtime.draws,before,'parameter typing updates guidance without opening a replacement layer');
  check(h.w.document.activeElement===input,'parameter typing retains the focused input node');
  equal([input.selectionStart,input.selectionEnd],[4,4],'parameter typing retains the caret position');
  equal(h.error(),'','valid mapping input clears the obsolete parameter error');
  const summary=h.node('business-field-rule-summary')?.textContent||'';
  check(summary.includes('provinceReference')&&summary.includes('测试 province'),'live summary uses the actual source and newly typed downstream parameter');
  const beforeSource=h.runtime.draws;P.setParameterBinding('sourceValueKey','externalId');
  equal(h.runtime.draws,beforeSource,'changing mapped source output updates only dependent guidance');
  check(h.node('business-field-rule-summary')?.textContent.includes('externalId'),'live mapping summary reflects the selected returned property');
  equal(M.catalog(scope).fields.filter(row=>row.label==='持续输入测试'),[],'guidance updates do not save the current draft');
}

function disabledSourceAndSecondSeriesGuards() {
  const h=seededChain(),{M,P,scope}=h;
  check(M.saveField({...M.getField('country',scope),enabled:false},scope).ok,'fixture disables an unused ancestor');
  check(M.save(category('disabled-target'),scope).ok,'fixture creates category for disabled-source recovery');
  P.open('category','disabled-target');chooseCategoryField(h,'city');
  const stored=h.raw();P.addRequiredSources();
  check(!!h.error(),'explicit repair reports a disabled required ancestor');
  equal(h.raw(),stored,'disabled source repair does not write any configuration');
  P.save();equal(M.get('disabled-target',scope).fields,[],'rejected repair is atomic and leaves no partially added ancestor');

  const s=genericHarness();
  check(s.M.saveField(field('anotherSeries','d-fixture-series'),s.scope).ok,'fixture creates another reusable single-series field');
  beginChild(s,'lead',{label:'另一车系的门店',dictionaryId:'d-fixture-store',sourceId:'anotherSeries',required:true,parameterName:'seriesCode'});
  const original=s.raw();s.P.addRequiredSources();
  check(!!s.error(),'repair cannot add a second series to a category that already has one');
  equal(s.raw(),original,'second-fixture-series repair leaves persisted configuration unchanged');
  s.P.save();
  check(!s.M.catalog(s.scope).fields.some(row=>row.label==='另一车系的门店'),'blocked parent closure cannot be bypassed through child save');
}

function staleRevisionAndContextGuards() {
  const h=seededChain(),{M,P,scope}=h;
  check(M.save(category('stale'),scope).ok,'fixture creates the concurrency target');
  beginChild(h,'stale',{label:'并发城市'});
  check(M.saveField({...M.getField('plannedStoreName',scope),label:'并发修改普通字段'},scope).ok,'another actor updates configuration while the child is open');
  const latest=h.raw();P.addRequiredSources();
  equal(h.raw(),latest,'stale repair cannot overwrite the newer configuration');
  check(!!h.error(),'stale repair explains that the editor must be reopened');
  P.save();equal(h.raw(),latest,'stale child save retains the model revision guard');
  check(!M.catalog(scope).fields.some(row=>row.label==='并发城市'),'stale child is not persisted');
  P.open('category','stale');chooseCategoryField(h,'city');h.runtime.sessionId='changed-session';P.addRequiredSources();
  equal(h.raw(),latest,'changed session cannot mutate configuration through the repair shortcut');
}

function checkboxRecovery() {
  const h=seededChain(),{M,P,scope}=h;
  check(M.save(category('toggle',['country','province','city']),scope).ok,'fixture creates a closed chain for checkbox recovery');
  const saved=M.get('toggle',scope);saved.fields.forEach(ref=>{ref.enabled=false;});check(M.save(saved,scope).ok,'fixture stores all chain fields hidden');
  P.open('category','toggle');
  P.setCategoryField(2,'enabled',true);
  check(!!h.error(),'showing a dependent without its required visible ancestors is rejected');
  const html=h.node('business-category-cards')?.innerHTML||'';
  const toggle=html.match(/<input\b([^>]*)onchange="BusinessConfiguration\.setCategoryField\(2,'enabled',this\.checked\)"/);
  check(!!toggle&&!/\bchecked\b/.test(toggle[1]),'rejected show action redraws its checkbox to the retained false value');
  equal(M.get('toggle',scope).fields.map(ref=>ref.enabled),[false,false,false],'rejected show action never persists the optimistic checkbox');
  P.setCategoryField(0,'enabled',true);
  equal(h.error(),'','a successful corrective checkbox change clears the old rejection');
  check(P.addRequiredSources(),'operator explicitly completes remaining source fields in the draft');
  const next=h.node('business-category-field-guidance')?.textContent||'';
  check(next.includes('勾选“显示此字段”'),'after repairing an existing hidden field the next step says to show its card');
  check(!next.includes('可添加此字段'),'already-added hidden fields are not told to add themselves again');
  check(P.locateCategoryField('city')&&h.focuses.at(-1)==='business-category-card-city','the repair guide can locate the exact hidden field card');
  equal(M.get('toggle',scope).fields.map(ref=>ref.enabled),[false,false,false],'explicit repair and location are still unsaved draft actions');
  P.setCategoryField(2,'enabled',true);P.save();
  equal(M.get('toggle',scope).fields.map(ref=>ref.enabled),[true,true,true],'following the repair guide enables the target and saves the closed chain');
}

function incompletePreviewContinuity() {
  const h=harness(), P=h.P;
  P.open('field');P.setBasic('label','待配置关联的门店');P.setBasic('type','interface');P.setDictionary('d-fixture-store');P.setUseQueryConditions(true);
  let preview=h.node('business-config-preview')?.textContent || '';
  check(preview.includes('请先完成关联查询条件')&&preview.includes('关联条件尚未配置完成'),'incomplete linked preview tells operators to finish configuration');
  check(!preview.includes('独立查询'),'missing source is never presented as an independent query');
  P.setDependency('genericSeries');P.setParameterBinding('parameterName','');
  preview=h.node('business-config-preview')?.textContent || '';
  check(preview.includes('请先完成关联查询条件')&&!preview.includes('独立查询'),'missing downstream parameter also keeps preview incomplete');
  check(h.node('business-field-next-step')?.textContent.includes('请填写'),'live next-step identifies the missing parameter');
  P.setParameterBinding('parameterName','seriesCode');
  check(!h.node('business-config-preview')?.textContent.includes('关联条件尚未配置完成'),'completing the mapping restores the actual linked preview');
}

incompletePreviewContinuity();
standaloneHandoff();
requiredChildRepairAndCancel();
requiredRepairAndPersist();
optionalDoesNotRepair();
inputAndErrorContinuity();
disabledSourceAndSecondSeriesGuards();
staleRevisionAndContextGuards();
checkboxRecovery();
console.log(JSON.stringify({passed,scope:'operator handoff, explicit required-source repair, optional boundaries, parent drafts, focus continuity and stale-write guards'}));

