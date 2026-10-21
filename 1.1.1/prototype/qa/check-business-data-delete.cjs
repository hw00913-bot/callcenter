/** Actual dictionary model, usage scanner and PlatformUI confirmation behavior. */
'use strict';
const assert=require('node:assert/strict');const {setup,copy}=require('./fixtures/configuration-usage.cjs');
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
function run(){
 {
  const h=setup({page:true}),entry=h.source(),P=h.w.Pages['business-data-dictionary'];h.render({embedded:true,scope:h.scope});const before=h.storage.get(h.B.storageKey);
  check(h.document.querySelector('[data-business-data-embedded]')&&h.document.querySelector('.business-delete-action'),'embedded dictionary exposes the actual delete action');
  check(P.remove(entry.id)===true&&!!h.document.getElementById('business-data-delete-confirm'),'unused interface requires the real PlatformUI confirmation layer');
  const old=h.document.getElementById('business-data-delete-confirm-confirm');h.w.PlatformUI.closeLayer('business-data-delete-confirm');check(h.storage.get(h.B.storageKey)===before&&h.B.entry(entry.id),'cancel leaves the complete original dictionary bytes intact');
  old.onclick();check(h.B.entry(entry.id)&&h.storage.get(h.B.storageKey)===before,'a cancelled stale confirmation callback cannot delete the entry');
  P.remove(entry.id);h.document.getElementById('business-data-delete-confirm-confirm').click();check(!h.B.entry(entry.id)&&h.B.catalogState().explicit,'confirmed unused interface is actually removed from explicit current storage');
  check(h.events.some(event=>event.type==='business-data-change'&&event.detail.deleted&&event.detail.entryId===entry.id),'successful deletion invalidates business-data consumers');
 }
 {
  const h=setup({page:true}),entry=h.source(),field=h.field('usedSource',entry.id),P=h.w.Pages['business-data-dictionary'];h.render({embedded:true,scope:h.scope});const result=P.remove(entry.id);
  check(result.refs.some(ref=>ref.fieldId===field.id)&&!!h.document.getElementById('business-data-references'),'used delete action explains actual references instead of hiding the operation');
  check(!h.document.getElementById('business-data-delete-confirm')&&h.B.entry(entry.id),'used interface never reaches destructive confirmation');
 }
 for(const change of ['rename','new-reference','scope','new-editor','page-replaced']){
  const h=setup({page:true}),entry=h.source(),P=h.w.Pages['business-data-dictionary'];h.render({embedded:true,scope:h.scope});P.remove(entry.id);const button=h.document.getElementById('business-data-delete-confirm-confirm');
  if(change==='rename')h.B.rename(entry.id,'确认期间改名');if(change==='new-reference')h.field('lateReference',entry.id);if(change==='scope'){h.state.sessionId='NEW-SESSION';}if(change==='new-editor')P.open(entry.id);if(change==='page-replaced')h.render({embedded:true,scope:h.scope});
  button.onclick();check(h.B.entry(entry.id),'confirmation rejects changed '+change+' without deleting a fresh target');
 }
 {
  const h=setup(),entry=h.source(),review=h.inspect('interface',entry.id),state=h.B.catalogState(),raw=h.storage.get(h.B.storageKey),write=h.w.localStorage.setItem;
  h.w.localStorage.setItem=(key,value)=>{if(key===h.B.storageKey)throw Error('synthetic write failure');return write(key,value);};
  check(!h.B.remove(entry.id,{expectedContext:state.context,expectedRevision:state.revision,expectedUsageFingerprint:review.fingerprint}).ok&&h.storage.get(h.B.storageKey)===raw,'model write failure does not publish deletion or replace original dictionary bytes');
  check(!h.events.some(event=>event.detail?.deleted),'failed deletion never dispatches source invalidation');h.w.localStorage.setItem=write;
  check(h.B.remove(entry.id,{expectedContext:state.context,expectedRevision:state.revision,expectedUsageFingerprint:review.fingerprint}).ok,'failed deletion can retry after storage recovers');
 }
 for(const race of ['write-then-throw','new-reference','identity','foreign-write']){
  const h=setup(),entry=h.source(),review=h.inspect('interface',entry.id),raw=h.storage.get(h.B.storageKey),write=h.w.localStorage.setItem;let injected=false,foreign='';
  h.w.localStorage.setItem=(key,value)=>{const result=write(key,value);if(key===h.B.storageKey&&!injected){injected=true;if(race==='write-then-throw')throw Error('write completed but acknowledgement failed');if(race==='identity')h.state.sessionId='REPLACED-DURING-WRITE';if(race==='new-reference'){const data=h.M.catalog(h.scope),bundle={...h.scope,fields:copy(data.fields),types:copy(data.rows)};bundle.fields.push({id:'concurrentField',label:'同时新增引用',type:'interface',dictionaryId:entry.id,enabled:true,businessKey:'',options:[],useQueryConditions:false,depends:[]});h.storage.set(h.M.storageKey,JSON.stringify({version:h.M.storageVersion,revision:99,scopes:[bundle]}));}if(race==='foreign-write'){const data=JSON.parse(value);data.revision++;foreign=JSON.stringify(data);h.storage.set(key,foreign);}}return result;};
  const result=h.B.remove(entry.id,{expectedUsageFingerprint:review.fingerprint});
  check(!result.ok&&result.code==='DELETE_NOT_COMMITTED','deletion reports no success after '+race);
  check(h.storage.get(h.B.storageKey)===(race==='foreign-write'?foreign:raw),'deletion rolls back only its own bytes after '+race);
  check(!h.events.some(event=>event.detail?.deleted),'no source-deleted event is published after '+race);
 }
 {
  const h=setup(),entry=h.source();h.superUser(false);const before=h.storage.get(h.B.storageKey);check(!h.inspect('interface',entry.id).ok&&!h.B.remove(entry.id).ok&&h.storage.get(h.B.storageKey)===before,'ordinary authorized tenant role cannot inspect or delete the global dictionary');
 }
 {
  const h=setup(),B=h.B;check(B.catalogState().ok&&!B.catalogState().explicit&&B.catalogState().entries.some(row=>row.id==='d-mapping-series'),'factory read distinguishes an implicit default from explicit absence');
  h.storage.set(B.storageKey,JSON.stringify({version:B.storageVersion,revision:4,entries:[]}));check(B.catalogState().ok&&B.catalogState().explicit&&!B.catalogState().entries.length&&!B.entry('d-mapping-series'),'explicit empty dictionary remains empty without restoring a preset');
  h.superUser(false);check(B.catalogState().ok&&B.catalogState().explicit&&!B.catalogState().entries.length,'ordinary factory readers may distinguish explicit absence without receiving management permission');
  h.storage.set(B.storageKey,'{broken');check(!B.catalogState().ok&&B.catalogState().explicit===null,'an unreadable dictionary never masquerades as explicitly deleted defaults');
 }
 console.log(JSON.stringify({passed,scope:'actual embedded dictionary deletion, reference explanations, cancellation, stale confirmation ownership, permissions and CAS/write-failure behavior'}));
}
if(require.main===module)run();
module.exports={run};
