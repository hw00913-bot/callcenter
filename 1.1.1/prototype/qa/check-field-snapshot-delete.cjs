/** Saved field values and complete call/archive snapshots survive library deletion. */
'use strict';
const assert=require('node:assert/strict');
const {setup,copy}=require('./fixtures/configuration-usage.cjs');
const {harness:editorHarness}=require('./check-business-config-dirty-close.cjs');
let passed=0;const check=(v,m)=>{assert.ok(v,m);passed++;};
for(const source of ['journal','native','directory','unmerged','local','ram','batch','dcc','linked']){
 const h=setup(),f=h.field('savedField'),c=h.category('historyCategory'),v=h.manifest(f.id),call=h.history('SNAPSHOT-'+source,c.id,v);
 if(source==='journal')h.storage.set(h.C.storageKey,JSON.stringify({version:h.C.storageVersion,entries:[{key:JSON.stringify([h.scope.enterpriseId,h.scope.tenantId,call.customerPhone,call.callId]),values:v}]}));
 if(source==='native')h.storage.set('native-workbench-records-v1',JSON.stringify([call]));
 if(source==='directory'||source==='unmerged')h.storage.set('customer-directory-v1',JSON.stringify({version:1,calls:source==='directory'?[call]:[],unmerged:source==='unmerged'?[call]:[]}));
 if(source==='local')h.storage.set('local-task-result-journal-v1',JSON.stringify({version:1,calls:[call]}));
 if(source==='ram')h.w.CloudCallData.calls=[call];
 if(source==='batch')h.storage.set('customer-task-batches-v1',JSON.stringify([{...h.scope,id:'BATCH',businessType:c.id,rows:[{id:'ROW',calls:[call]}]}]));
 if(source==='dcc')h.storage.set('dcc-task-ledger-v1.1.0',JSON.stringify({schemaVersion:'1.1.0',sequence:1,tasks:{},communicationEvents:[{...h.scope,eventId:'EVT',payload:{callId:call.callId,customerBusiness:v.businessFieldSnapshot}}]}));
 if(source==='linked')h.storage.set('linked-scenario-demo-v1',JSON.stringify({enabled:false,calls:[call],tasks:[]}));
 const before=JSON.stringify([...h.storage].filter(([key])=>key!==h.M.storageKey)),detail=h.C.detail(v,call),review=h.inspect('field',f.id);
 check(review.canDelete&&review.refs.some(r=>r.kind==='saved_business')&&review.refs.every(r=>r.blocking===false),source+': saved values are nonblocking impacts');
 check(h.M.deleteField(f.id,h.scope,{expectedUsageFingerprint:review.fingerprint}).ok&&!h.M.getField(f.id,h.scope),source+': actual definition deletion succeeds');
 check(JSON.stringify([...h.storage].filter(([key])=>key!==h.M.storageKey))===before,source+': history storage is not changed');
 check(h.C.detail(v,call)===detail&&detail.includes('当时字段')&&detail.includes('当时内容'),source+': original snapshot renders after deletion');
}
for(const raw of ['',0,false,[],['已选一','已选二']]){
 const h=setup(),f=h.field('snapshotValue'),c=h.category(),v=h.manifest(f.id);
 v[f.id]=copy(raw);v.businessFieldSnapshot.values[f.id]=copy(raw);v.businessFieldSnapshot.fields[0].value=copy(raw);
 const call=h.history('VALUE-'+passed,c.id,v);h.w.CloudCallData.calls=[call];const original=JSON.stringify(call);
 check(h.inspect('field',f.id).canDelete&&h.M.deleteField(f.id,h.scope).ok,'empty, zero, false and collection snapshot values do not lock deletion');
 check(JSON.stringify(call)===original,'actual saved raw value and field metadata remain unchanged');
}
{
 const h=setup(),f=h.field('snapshotActive'),c=h.category('activeSnapshot',[f.id]);h.mount({callId:'ACTIVE-SNAPSHOT',businessType:c.id},{businessType:c.id,[f.id]:'通话中已填写'});
 const frame=JSON.stringify(h.call.businessFormVersion),next=h.M.get(c.id,h.scope);next.fields=[];check(h.M.save(next,h.scope).ok,'remove the current configuration reference');
 const review=h.inspect('field',f.id);check(review.canDelete&&review.refs.some(r=>r.kind==='active_form'&&r.blocking===false),'bound active snapshot allows deletion');
 check(h.M.deleteField(f.id,h.scope).ok,'delete definition while the independently bound call is still pending');
 const saved=h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''});
 check(saved.ok&&saved.values[f.id]==='通话中已填写'&&JSON.stringify(h.call.businessFormVersion)===frame,'pending call saves original value through original frame');
 check(saved.values.businessFieldSnapshot.fields.some(r=>r.fieldId===f.id&&r.fieldName===f.label&&r.value==='通话中已填写'),'new saved business snapshot keeps original definition and value');
}
{
 const h=setup(),f=h.field('raceWithHistory'),c=h.category(),review=h.inspect('field',f.id);
 h.w.CloudCallData.calls.push(h.history('ARRIVED-AFTER-CONFIRM',c.id,h.manifest(f.id)));
 check(h.U.verifyFresh(review.token).ok&&h.M.deleteField(f.id,h.scope,{expectedUsageFingerprint:review.fingerprint}).ok,'a newly saved snapshot does not invalidate an otherwise unchanged deletion confirmation');
}
{
 const h=setup(),e=h.source(),f=h.field('liveReferenced',e.id),c=h.category('stillUsesField',[f.id]);
 const review=h.inspect('field',f.id);check(!review.canDelete&&review.refs.some(r=>r.blocking!==false&&r.kind==='configuration'),'live category reference still blocks deletion');
 check(!h.M.deleteField(f.id,h.scope).ok,'no automatic live-category cascade');
 const row=h.M.get(c.id,h.scope);row.fields=[];h.M.save(row,h.scope);
 h.w.CloudCallData.calls=[h.history('SOURCE-STILL-RETAINED',c.id,h.manifest(f.id,e.id))];
 check(h.M.deleteField(f.id,h.scope).ok,'completed interface field snapshot does not lock the field library');
 check(!h.inspect('interface',e.id).canDelete&&!h.B.remove(e.id).ok,'actual interface source reservation is unchanged by the field-only rule');
}
{
 const h=editorHarness(),f=h.M.getField(h.id,h.scope),v={businessType:'lead',[h.id]:'历史确实填过',businessFieldSnapshot:{businessType:'lead',values:{[h.id]:'历史确实填过'},fields:[{fieldId:h.id,fieldName:f.label,type:f.type,value:'历史确实填过'}]}};
 h.win.CloudCallData.calls=[{...h.scope,accountId:h.state.accountId,callId:'UI-HISTORY',customerPhone:'13900009999',businessType:'lead',processingStatus:'已完成',customerFollowup:v}];
 h.P.render('field');check(h.P.remove('field',h.id)===true&&h.node('business-config-delete-confirm'),'clicking delete opens confirmation even when a historical value exists');
 const prompt=h.node('business-config-delete-confirm').textContent;check(prompt.includes('快照')&&!prompt.includes('未使用配置'),'confirmation explains snapshot preservation without calling the saved field unused');
 const history=JSON.stringify(h.win.CloudCallData.calls);h.node('business-config-delete-confirm-confirm').click();
 check(!h.M.getField(h.id,h.scope)&&!h.node('business-config-delete-confirm'),'actual confirm callback succeeds and closes prompt');
 check(JSON.stringify(h.win.CloudCallData.calls)===history&&h.win.CloudCallData.calls[0].customerFollowup.businessFieldSnapshot.fields[0].value==='历史确实填过','UI deletion retains the exact saved value and independent field snapshot');
}
console.log(JSON.stringify({ok:true,assertions:passed,scope:'saved-history stores, original detail rendering, zero/false/collections, full active-call snapshot save, snapshot-only races, current config references and actual confirmation UI'}));
