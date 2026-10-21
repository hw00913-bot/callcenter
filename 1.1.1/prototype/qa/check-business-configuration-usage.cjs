/** Exact configuration/business references, current drafts and read-only provenance. */
'use strict';
const assert=require('node:assert/strict');const {setup,copy}=require('./fixtures/configuration-usage.cjs');
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
const blocked=review=>review.ok&&!review.canDelete&&review.refs.length>0;
const impact=review=>review.ok&&review.canDelete&&review.refs.length>0&&review.refs.every(ref=>ref.blocking===false);
function run(){
 {
  const h=setup(),entry=h.source(),field=h.field(),category=h.category();const before=h.writes.length;
  for(const [kind,id]of [['interface',entry.id],['field',field.id],['category',category.id]]){const review=h.inspect(kind,id);check(review.ok&&review.canDelete&&!!review.fingerprint&&Object.isFrozen(review.token),'unused '+kind+' has an exact review token');check(h.U.verifyFresh(review.token).ok,'unchanged '+kind+' review verifies through another real scan');}
  check(h.writes.length===before&&h.projections===0,'usage inspection never writes storage or invokes stateful projections');
  const whitelist=new Set(['customer-business-config-v111-current','business-data-dictionary-v111-current','customer-followup-v111-current','native-workbench-records-v1','native-workbench-session-v1','customer-task-batches-v1','local-task-result-journal-v1','customer-directory-v1','dcc-task-ledger-v1.1.0','cloud-task-created-v1','linked-scenario-demo-v1']);
  check([...h.reads].every(key=>whitelist.has(key.slice(key.indexOf(':')+1))),'inspection reads only the explicitly approved current keys without enumeration');
  const second=h.source('另一未使用接口'),old=h.inspect('interface',entry.id),state=h.B.catalogState();check(!h.B.remove(second.id,{expectedContext:state.context,expectedRevision:state.revision,expectedUsageFingerprint:old.fingerprint}).ok,'a review fingerprint cannot be reused for another target');
  h.B.rename(entry.id,'改名后的未使用接口');check(!h.U.verifyFresh(old.token).ok,'renaming a still-unused target invalidates its old review');
 }
 {
  const h=setup(),entry=h.source(),field=h.field('linkedField',entry.id),cat=h.category('linkedCategory',[field.id]);
  check(blocked(h.inspect('interface',entry.id))&&h.inspect('interface',entry.id).refs.some(row=>row.kind==='configuration'&&row.fieldId===field.id),'field-library source references prevent interface deletion');
  check(blocked(h.inspect('field',field.id))&&h.inspect('field',field.id).refs.some(row=>row.categoryId===cat.id),'category references prevent field deletion');
  const row=h.M.get(cat.id,h.scope);row.fields[0].enabled=false;check(h.M.save(row,h.scope).ok&&blocked(h.inspect('field',field.id)),'a closed-display category reference still counts as configuration usage');
 }
 for(const source of ['cf','native','directory','unmerged','local-result','ram','batch-history','dcc-business','linked-enabled','linked-disabled','dcc-completion-call']){
  const h=setup(),entry=h.source(),field=h.field('historicField',entry.id),category=h.category(),values=h.manifest(field.id,entry.id),call=h.history('HISTORY-'+source,category.id,values);
  const config=h.M.get('lead',h.scope);config.fields=[];h.M.save(config,h.scope);
  if(source==='cf')h.storage.set(h.C.storageKey,JSON.stringify({version:h.C.storageVersion,entries:[{key:JSON.stringify([h.scope.enterpriseId,h.scope.tenantId,call.customerPhone,call.callId]),values}]}));
  if(source==='native')h.storage.set('native-workbench-records-v1',JSON.stringify([call]));
  if(source==='directory'||source==='unmerged')h.storage.set('customer-directory-v1',JSON.stringify({version:1,calls:source==='directory'?[call]:[],unmerged:source==='unmerged'?[call]:[]}));
  if(source==='local-result')h.storage.set('local-task-result-journal-v1',JSON.stringify({version:1,calls:[call]}));
  if(source==='linked-enabled'||source==='linked-disabled')h.storage.set('linked-scenario-demo-v1',JSON.stringify({enabled:source==='linked-enabled',calls:[call],tasks:[]}));
  if(source==='dcc-completion-call')h.storage.set('dcc-task-ledger-v1.1.0',JSON.stringify({schemaVersion:'1.1.0',sequence:1,tasks:{},communicationEvents:[{...h.scope,eventId:'COMPLETED-CALL-EVENT',payload:{callRecord:call}}]}));
  if(source==='ram')h.w.CloudCallData.calls=[call];
  if(source==='batch-history')h.storage.set('customer-task-batches-v1',JSON.stringify([{...h.scope,id:'BATCH',businessType:category.id,rows:[{id:'ROW',calls:[call]}]}]));
  if(source==='dcc-business')h.storage.set('dcc-task-ledger-v1.1.0',JSON.stringify({schemaVersion:'1.1.0',sequence:1,tasks:{TASK:{task:{...h.scope,taskId:'TASK'},records:[]}},communicationEvents:[{...h.scope,eventId:'EVENT',payload:{callId:call.callId,customerBusiness:values.businessFieldSnapshot}}]}));
  check(impact(h.inspect('field',field.id))&&h.inspect('field',field.id).refs.some(row=>row.kind==='saved_business'),'saved field snapshot is retained as nonblocking deletion impact in '+source);
  check(impact(h.inspect('category',category.id)),'real business category remains visible as nonblocking retirement impact in '+source);
 }
 for(const source of ['batch','task-index','session-task-index','ram-task','dcc-record','dcc-task','linked-task']){
  const h=setup(),category=h.category();
  if(source==='batch')h.storage.set('customer-task-batches-v1',JSON.stringify([{...h.scope,id:'BATCH',businessType:category.id,rows:[{id:'ROW',calls:[]}]}]));
  if(source==='task-index'||source==='session-task-index')(source==='task-index'?h.storage:h.session).set('cloud-task-created-v1',JSON.stringify([{...h.scope,taskId:'TASK',businessType:category.id}]));
  if(source==='linked-task')h.storage.set('linked-scenario-demo-v1',JSON.stringify({enabled:false,calls:[],tasks:[{...h.scope,taskId:'LINKED-TASK',businessType:category.id}]}));
  if(source==='ram-task')h.w.CloudCallData.tasks=[{...h.scope,taskId:'TASK',businessType:category.id}];
  if(source==='dcc-record'||source==='dcc-task')h.storage.set('dcc-task-ledger-v1.1.0',JSON.stringify({schemaVersion:'1.1.0',sequence:1,tasks:{TASK:{task:{...h.scope,taskId:'TASK',...(source==='dcc-task'?{businessType:category.id}:{})},records:source==='dcc-record'?[{recordId:'RECORD',businessType:category.id}]:[]}}}));
  check(impact(h.inspect('category',category.id)),'explicit undialed business category remains visible as nonblocking retirement impact in '+source);
 }
 {
  const h=setup(),category=h.category('leadLikeButUnused');h.storage.set('dcc-task-ledger-v1.1.0',JSON.stringify({schemaVersion:'1.1.0',sequence:1,tasks:{TASK:{task:{...h.scope,taskId:'TASK',dccManaged:true},records:[]}}}));check(h.inspect('category',category.id).canDelete,'an empty managed task does not invent an implicit lead/category reference');
 }
 {
  const h=setup(),entry=h.source(),field=h.field('reserveField',entry.id),category=h.category('reserveCategory',[field.id]);h.mount({callId:'UNTYPED',businessType:''},{});const pending=copy(h.call);
  const row=h.M.get(category.id,h.scope);row.fields=[];check(h.M.save(row,h.scope).ok,'live category can remove a reference after a different untyped call captured its directory');
  check(h.inspect('field',field.id).canDelete&&h.inspect('category',category.id).canDelete,'unselected call inventory does not count as actual field/category use');
  check(h.M.deleteField(field.id,h.scope).ok,'an actually unused field can be removed even though another call captured the library');
  const reserved=h.inspect('interface',entry.id);check(blocked(reserved)&&reserved.refs.every(ref=>ref.kind==='source_reservation')&&reserved.reason.includes('数据来源保留'),'untyped call reserves only sources of selectable category-visible fields');
  h.storage.set('native-workbench-records-v1',JSON.stringify([{...pending,processingStatus:'已完成',customerFollowup:{businessType:'',updatedAt:'2026-10-20T05:00:00.000Z',businessFieldSnapshot:{businessType:'',values:{},fields:[]}}}]));
  h.session.set('native-workbench-session-v1',JSON.stringify({scope:h.state.accountId+':'+h.scope.tenantId,call:pending,phase:'wrap',followup:{businessType:''}}));
  check(h.inspect('interface',entry.id).canDelete,'completed native record releases reservation despite stale pending session and RAM copies');
 }
 {
  const h=setup(),entry=h.source(),field=h.field('inventoryOnly',entry.id);h.mount({callId:'INVENTORY',businessType:''},{});check(h.M.deleteField(field.id,h.scope).ok,'unused isolated library inventory is not locked by an untyped call');check(h.inspect('interface',entry.id).canDelete,'unreferenced captured library sources are not reserved');
 }
 {
  const h=setup(),entry=h.source(),field=h.field('typedField',entry.id),category=h.category('typedCategory',[field.id]);h.mount({callId:'TYPED',businessType:category.id},{});const row=h.M.get(category.id,h.scope);row.fields=[];h.M.save(row,h.scope);
  check(impact(h.inspect('field',field.id))&&impact(h.inspect('category',category.id)),'typed active call retains its independent field and category snapshots as nonblocking impacts');
  h.session.set('native-workbench-session-v1',JSON.stringify({scope:h.state.accountId+':'+h.scope.tenantId,call:{...h.call,businessType:'',businessFormType:''},phase:'wrap',followup:{businessType:''}}));
  h.storage.set('native-workbench-records-v1',JSON.stringify([{...h.call,businessType:'',businessFormType:category.id}]));
  check(h.inspect('field',field.id).canDelete&&h.inspect('category',category.id).canDelete,'explicit empty current session type takes precedence over stale native businessFormType');
 }
 {
  const h=setup(),entry=h.source(),field=h.field('scopeField'),category=h.category(),catalog=h.M.catalog(h.scope),other={enterpriseId:'OTHER-ENTERPRISE',tenantId:'DISABLED-TENANT'};
  const raw=JSON.parse(h.storage.get(h.M.storageKey));raw.scopes.push({...other,fields:[...copy(catalog.fields),{id:'otherInterface',label:'停用租户接口引用',type:'interface',enabled:false,businessKey:'',options:[],dictionaryId:entry.id,useQueryConditions:false,depends:[]}],types:copy(catalog.rows)});h.storage.set(h.M.storageKey,JSON.stringify(raw));
  check(blocked(h.inspect('interface',entry.id))&&h.inspect('interface',entry.id).refs.some(ref=>ref.tenantId===other.tenantId),'global dictionary usage includes persisted disabled/revoked/out-of-enterprise scope references');
  check(h.inspect('field',field.id).canDelete&&h.inspect('category',category.id).canDelete,'unrelated foreign scope data does not lock local same-name objects');
  const forbidden=h.inspect('field',field.id,other);check(!forbidden.ok&&forbidden.code==='FORBIDDEN'&&forbidden.refs.length===0,'direct unauthorized scope inspection returns no foreign reference details');
 }
 {
  const h=setup(),unused=h.source();h.mount({callId:'OUTSIDE-SCOPE-BOUND',businessType:''},{});h.setValid(false);h.state.tenantId='NO-CURRENT-TENANT';h.state.enterpriseId='OTHER-CURRENT-ENTERPRISE';
  check(h.B.canManage()&&h.inspect('interface',unused.id).canDelete,'global super may inspect a genuinely unused source without a valid business tenant while another scope has an active bound call');
  check(!h.inspect('field','plannedStoreName').ok&&h.inspect('field','plannedStoreName').refs.length===0,'the global source management exception never grants business-scope field inspection');
 }
 {
  const h=setup(),up=h.source('可选上游来源'),down=h.source('下游来源','stores'),upField=h.field('optionalUpstream',up.id),downField=h.field('dependentStore',down.id);
  const configured=h.M.saveField({...downField,useQueryConditions:true,depends:[upField.id],parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code',required:false}},h.scope);check(configured.ok,'the fixture is a genuine optional generic dependency');
  const category=h.category('optionalDependency',[downField.id]);h.mount({callId:'OPTIONAL-SOURCE-RESERVE',businessType:''},{});const current=h.M.get(category.id,h.scope);current.fields=[];h.M.save(current,h.scope);
  check(h.M.deleteField(downField.id,h.scope).ok&&h.M.deleteField(upField.id,h.scope).ok,'unused field definitions may be removed even while a different untyped call captured a possible category');
  check(h.inspect('interface',up.id).refs.some(ref=>ref.kind==='source_reservation'&&ref.fieldId===upField.id),'an untyped call reserves its hidden optional upstream source through the captured active dependency closure');
  check(h.inspect('interface',down.id).refs.some(ref=>ref.kind==='source_reservation'),'the same untyped call retains its selectable downstream source');
 }
 for(const collision of ['phone','account']){
  const h=setup(),entry=h.source();h.mount({callId:'IDENTITY-COLLISION',businessType:''},{});const other={...copy(h.call),processingStatus:'已完成'};if(collision==='phone')other.customerPhone='13900007777';else other.accountId='ANOTHER-ACCOUNT';h.storage.set('native-workbench-records-v1',JSON.stringify([other]));
  check(h.inspect('interface',entry.id).code==='USAGE_UNAVAILABLE','a completed record from a different '+collision+' cannot release another pending call source reservation');
 }
 {
  const h=setup(),entry=h.source(),field=h.field(),category=h.category();h.mount({callId:'ABSENT-ACTIVE-VERSION',businessType:''},{});const original=copy(h.call);delete h.call.businessFormVersion;
  check(h.inspect('interface',entry.id).code==='USAGE_UNAVAILABLE','a genuinely missing active version makes source usage unknown rather than adopting the newest schema');
  check(h.inspect('field',field.id).canDelete&&h.inspect('category',category.id).canDelete,'a missing active schema never invents field/category usage from the whole library');
  h.storage.set('native-workbench-records-v1',JSON.stringify([original]));h.session.set('native-workbench-session-v1',JSON.stringify({call:copy(h.call),followup:{businessType:''},phase:'wrap'}));
  check(h.inspect('interface',entry.id).canDelete,'a same-identity valid native version supplies read-only source knowledge when the current draft copy lacks metadata');
  check(!Object.hasOwn(h.call,'businessFormVersion')&&!Object.hasOwn(JSON.parse(h.session.get('native-workbench-session-v1')).call,'businessFormVersion'),'usage reads never bind or repair the missing draft metadata');
 }
 for(const key of ['customer-followup-v111-current','native-workbench-records-v1','customer-task-batches-v1','customer-directory-v1','dcc-task-ledger-v1.1.0','linked-scenario-demo-v1']){
  const h=setup(),entry=h.source();h.storage.set(key,'{broken');const before=h.writes.length,review=h.inspect('interface',entry.id);check(!review.ok&&!review.canDelete&&review.code==='USAGE_UNAVAILABLE'&&h.writes.length===before,'corrupt '+key+' disables deletion without repairing or writing data');
 }
 console.log(JSON.stringify({passed,scope:'read-only current usage sources, exact manifests, tenant isolation, target review tokens and actual typed/untyped call source retention'}));
}
if(require.main===module)run();
module.exports={run};
