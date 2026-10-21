/* Current Mapping profile only. Former local/preset migration cases are retired. */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {harness,copy}=require('./fixtures/current-profile.cjs');
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
const query=h=>h.win.BusinessInterfaceField.query('seat-followup',h.field().id);
const choose=(h,item)=>h.win.BusinessInterfaceField.choose('seat-followup',h.field().id,JSON.stringify([item.type || '',item.code]));
const save=h=>h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''});
(async()=>{
 {
  const oldKeys=['customer-business-config-v3','business-data-dictionary-v111','customer-followup-v1'];
  const h=harness({storage:oldKeys.map(key=>[key,'{"old":"not a current schema"}'])}),f=h.field(),M=h.M,B=h.win.BusinessData;
  check(M.catalog(h.scope).fields.length===13&&M.fields('lead',h.scope).length===7,'fresh current catalog contains only the actual thirteen fields');
  check(f.id==='mappingIntendedSeries'&&f.type==='interface'&&M.isMappingSeriesField(f),'current Mapping field is created directly without mode projection');
  check(!M.getField('intendedSeries',h.scope)&&!M.getField('intendedStore',h.scope)&&!M.getField('customIntendedSeries',h.scope),'obsolete preset definitions do not exist in the current catalog');
  check(B.entries().length===1&&B.entries()[0].id==='d-mapping-series','current dictionary defaults contain only Mapping');
  check(!h.storageReads.some(key=>oldKeys.includes(key))&&oldKeys.every(key=>h.storage.get(key)==='{"old":"not a current schema"}'),'old configuration and followup keys are never read or rewritten');
  check(!h.storage.has(M.storageKey)&&!h.storage.has(B.storageKey),'current default reads do not write configuration');
  const P=h.win.BusinessConfiguration;P.render('field');P.open('field',f.id);
  check(h.managerHtml.includes('无需维护手工车系选项')&&!h.managerHtml.includes('id="business-field-options"'),'actual Mapping editor has no manual option controls');
  check(/id="business-field-type" disabled/.test(h.managerHtml)&&/id="business-field-interface" disabled/.test(h.managerHtml),'current Mapping type and source are protected');
  for(const patch of [{type:'select',options:[{id:'x',label:'x',businessKey:'x'}]},{dictionaryId:'unregistered'},{options:[{id:'x',label:'x',businessKey:'x'}]},{useQueryConditions:true,depends:['unknown']}])check(!M.saveField({...M.getField(f.id,h.scope),...patch},h.scope).ok,'incompatible Mapping configuration changes are rejected');
  check(!M.deleteField(f.id,h.scope).ok,'the current Mapping definition cannot be deleted');
 }
 {
  const h=harness(),f=h.field(),F=h.win.BusinessInterfaceField;h.win.AgentWorkbench.setFollowup('plannedStoreName','原门店文本');const q=await query(h);
  check(q.ok&&q.complete&&q.items.length===3&&q.meta.request.media_id===10&&q.meta.request.car_state===1,'current real adapter loads only the default synthetic Mapping range');
  F.open('seat-followup',f.id);await query(h);F.filter('seat-followup',f.id,'910002');const popup=h.document.getElementById('business-series-dropdown');check(popup.querySelectorAll('[role="option"]').length===1&&popup.textContent.includes('车系乙'),'search uses official code strings');F.closeDropdown(false);
  check(choose(h,q.items[0])&&choose(h,q.items[1])&&h.values[f.id].code==='910002'&&!Array.isArray(h.values[f.id]),'single series selection replaces the first current choice');
  check(h.C.update(h.values,h.call,f.id,[h.values[f.id]])===null,'single-series update rejects a list');
  const result=save(h),snapshot=result.values.businessFieldSnapshot,row=snapshot.fields.find(row=>row.fieldId===f.id);
  check(result.ok&&result.values.plannedStoreName==='原门店文本','current save retains independently entered store text');
  check(row.dictionaryId===f.dictionaryId&&row.interfaceKind==='series'&&row.selectionMode==='single','normal saved manifest explicitly records interface kind and cardinality');
  for(const item of [row.value,snapshot.values[f.id]])check(item.code==='910002'&&item.sourceValues.relation_id===910002&&item.sourceValues.media_car_series_id==='DEMO-MEDIA-SERIES-B'&&item.sourceValues.car_state===1,'normal source snapshots preserve the official/media/status whitelist');
  check(!JSON.stringify(snapshot).includes('sourceVersion')&&!JSON.stringify(snapshot).includes('verifiedScope')&&!Object.hasOwn(snapshot,'legacyFields'),'normal snapshot contains no runtime guards or compatibility projection');
  check(h.C.detail(result.values,h.call).includes('910002')&&!h.C.detail(result.values,h.call).includes('历史接口信息'),'normal record detail displays the saved Mapping value without a legacy section');
  const group=h.C.aggregate([h.call]).groups[0];check(group.values[f.id].code==='910002'&&h.C.detail(group.values,group).includes('车系乙'),'current aggregate uses the same saved Mapping manifest');
  const stored=JSON.parse(h.storage.get(h.C.storageKey));check(stored.version===h.C.storageVersion&&stored.entries.length===1,'current followup writes only its own versioned namespace');
 }
 for(const rawCode of ['910001','DEMO-MEDIA-SERIES-A','映射演示车系甲（虚构）','0910001','UNKNOWN']){
  const h=harness();h.mount({callId:'import-'+rawCode,intentionSeriesCode:rawCode},{plannedStoreName:'保留门店'});await h.win.BusinessInterfaceField.bringOriginal('seat-followup');
  check(rawCode==='910001'?h.values[h.field().id]?.code==='910001':h.values[h.field().id]==='','explicit import matches only the exact official ID');
  check(h.values.plannedStoreName==='保留门店'&&h.call.intentionSeriesCode===rawCode,'import does not modify original information or store text');
 }
 for(const scenario of ['failure','partial','empty','conflict','malformed']){
  const h=harness(),q=await query(h),F=h.win.BusinessInterfaceField;choose(h,q.items[0]);h.win.AgentWorkbench.setFollowup('plannedStoreName','异常保稿');h.win.BusinessData.env.mappingScenario=scenario;
  const result=await query(h);check(scenario==='empty'?result.ok&&result.complete&&!result.items.length:!result.ok&&!result.items.length,'empty and failed queries remain distinct');
  check(h.values[h.field().id].code==='910001'&&h.values.plannedStoreName==='异常保稿','query outcomes preserve current input');
  check(!choose(h,q.items[1])&&!save(h).ok,'incomplete/changed scope cannot reuse old candidates or commit stale values');
  check(F.clear('seat-followup',h.field().id)&&h.C.validate(h.values,h.call).ok,'optional selection can be explicitly cleared');
 }
 {
  const h=harness(),B=h.win.BusinessData,F=h.win.BusinessInterfaceField,f=h.field(),q=await query(h);choose(h,q.items[0]);B.setEnabled(f.dictionaryId,false);
  check(!h.C.validate(h.values,h.call).ok,'live source disable blocks submission without changing selected content');B.setEnabled(f.dictionaryId,true);await query(h);
  check(!h.C.validate(h.values,h.call).ok&&F.confirm('seat-followup',f.id)&&h.C.validate(h.values,h.call).ok,'source restoration requires current query and explicit confirmation');
  B.env.mappingScenario='delay';const pending=query(h);B.setTenants(f.dictionaryId,[]);check(!(await pending).ok&&!h.C.validate(h.values,h.call).ok,'tenant revocation invalidates pending I/O and save');
 }
 {
  const h=harness(),category=h.M.get('lead',h.scope),id=h.field().id;category.fields.find(ref=>ref.fieldId===id).required=true;check(h.M.save(category,h.scope).ok,'administrator can configure Mapping requiredness');
  check(h.C.validate(h.values,h.call).ok,'existing call keeps its original optional rule');h.mount({callId:'new-required'});
  check(!h.C.validate(h.values,h.call).ok&&h.C.validate(h.values,{...h.call,answered:false}).ok,'new call requires series while the original unanswered exception remains');
  h.win.BusinessData.env.source='dcc';h.win.BusinessData.env.dccScenario='page_failure';h.win.BusinessData.env.query='failure';check((await query(h)).ok,'unrelated retained demo capabilities cannot replace Mapping results');
 }
 console.log(JSON.stringify({passed,scope:'current-only Mapping defaults, protected source, normal manifest, exact import, query states, live grants and call version'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
