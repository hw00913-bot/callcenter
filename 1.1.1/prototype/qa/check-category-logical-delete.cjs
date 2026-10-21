/** Real current models, archived definitions and actual workbench/PUI category removal. */
'use strict';
const assert=require('node:assert/strict');
const {setup,copy}=require('./fixtures/configuration-usage.cjs');
const {setup:workbench}=require('./check-workbench-form-version.cjs');
const {harness:editor}=require('./check-business-config-dirty-close.cjs');
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
function configure(h){
 const field={id:'archiveChoice',label:'删除时的选择',type:'select',businessKey:'ORIGINAL_FIELD',enabled:true,options:[{id:'a',label:'删除时甲',businessKey:'001'},{id:'b',label:'删除时乙',businessKey:'002'}]};
 check(h.M.saveField(field,h.scope).ok,'create an ordinary current field through the real model');
 const row={id:'archiveBusiness',label:'删除时业务分类',codeLabel:'原业务单号',prefix:'ARCH',enabled:true,fields:[{fieldId:field.id,enabled:true,required:true}]};
 check(h.M.save(row,h.scope).ok,'create a real category with a required field');return {field,row};
}
const archive=(h,id)=>JSON.parse(h.storage.get(h.M.storageKey)).scopes.find(row=>row.tenantId===h.scope.tenantId&&row.enterpriseId===h.scope.enterpriseId).retiredTypes.find(item=>item.row.id===id);
const call=(h,extra={})=>({...h.scope,accountId:h.state.accountId,callId:'ARCHIVE-NEW-CALL',customerPhone:'13900007001',callee:'13900007001',direction:'呼出',callType:'人工外呼',callSource:'NATIVE_WORKBENCH',processingStatus:'待填写',businessType:'archiveBusiness',...extra});
{
 const h=setup(),{field,row}=configure(h),old=h.history('OLD-ARCHIVE-CALL',row.id,{businessType:row.id,archiveChoice:'a'});h.w.CloudCallData.calls.push(old);const original=JSON.stringify(old),oldDetail=h.C.detail(old.customerFollowup,old),impact=h.inspect('category',row.id);
 check(impact.ok&&impact.canDelete&&impact.refs.length&&impact.refs.every(ref=>ref.blocking===false),'actual category history is a visible nonblocking removal impact');
 check(h.M.deleteCategory(row.id,h.scope,{expectedUsageFingerprint:impact.fingerprint}).ok,'a category with actual history can be logically removed');
 const held=archive(h,row.id);check(JSON.stringify(held.row)===JSON.stringify(row)&&held.fields.length===1&&held.fields[0].id===field.id,'archive contains the complete category and its required definition, without unrelated inventory');
 check(held.deletedBy===h.state.accountId&&Number.isFinite(Date.parse(held.deletedAt)),'archive records the current actor and deletion time');
 check(!h.M.list(h.scope,true).some(item=>item.id===row.id)&&!h.M.get(row.id,h.scope),'configuration and ordinary new choices omit the removed category');
 check(!h.M.get(row.id,{...h.scope,businessType:row.id})&&!h.M.catalog(h.scope,row.id).rows.some(item=>item.id===row.id),'a plain scope, injected type or requestedType cannot read an archived choice');
 check(h.M.get(row.id,old)?.label===row.label&&h.M.fields(row.id,old)[0].options[0].label==='删除时甲'&&h.C.detail(old.customerFollowup,old)===oldDetail,'authorized historical records without a modern manifest retain their actual definition');
 check(JSON.stringify(old)===original,'logical deletion never rewrites historical results');
 check(h.M.resolveImportType(row.id,h.scope).code==='BUSINESS_TYPE_DELETED','new import rejects the retired category explicitly');
 const bytes=h.storage.get(h.M.storageKey);check(!h.M.save(row,h.scope).ok&&!h.M.setEnabled(row.id,true,h.scope).ok&&h.storage.get(h.M.storageKey)===bytes,'save and enable cannot resurrect the same removed ID');
 check(h.inspect('field',field.id).refs.some(ref=>ref.source.startsWith('retired-category:')&&ref.blocking===false)&&h.M.deleteField(field.id,h.scope).ok,'independent archived definitions retain history without blocking library deletion');
 const afterFieldDelete=h.storage.get(h.M.storageKey);h.load('js/components/customer-business.js');check(!h.w.CustomerBusiness.get(row.id,h.scope)&&h.w.CustomerBusiness.get(row.id,old)?.label===row.label&&h.storage.get(h.M.storageKey)===afterFieldDelete,'module reload preserves live field absence and immutable archive without rewriting storage');
}
{
 const h=setup(),{row}=configure(h);check(h.M.deleteCategory(row.id,h.scope).ok,'retire an unused category before new binding attempts');
 for(const marker of [{},{taskId:'FAKE-TASK'},{customerTaskItemId:'FAKE-ITEM'}]){const source=call(h,marker),before=JSON.stringify(source),result=h.C.bindCallForm(source);check(!result.ok&&JSON.stringify(source)===before,'a new call or arbitrary source marker cannot adopt a removed category');}
 const ordinary=call(h,{callId:'NEW-UNTYPED',businessType:''});check(h.C.bindCallForm(ordinary).ok&&!h.M.list(ordinary).some(item=>item.id===row.id),'a new untyped call binds the current directory without deleted choices');
}
{
 const h=workbench(),{row,field}=configure(h),seed=h.seed('manual',row.id);seed.batch.businessType=row.id;h.storage.set('customer-task-batches-v1',JSON.stringify([seed.batch]));
 check(h.M.deleteCategory(row.id,h.scope).ok,'an existing undialed assigned customer permits category removal');
 check(h.M.saveField({...field,type:'number',label:'当前数字填写',options:[]},h.scope).ok,'the current library can change independently of archived option meaning');
 const forged=call(h,{customerTaskItemId:seed.item.id,customerPhone:'13900007999',callee:'13900007999'});check(!h.C.bindCallForm(forged).ok,'a real item ID with another phone cannot prove existing business');
 h.A.selectAssigned(seed.item);check(h.A.dial()===true,'actual workbench still starts a call for the pre-existing assigned customer');
 const current=h.peek().call,definition=h.M.fields(row.id,current).find(item=>item.id===field.id);check(definition.type==='select'&&definition.options[0].businessKey==='001'&&definition.label===field.label,'that new call receives deletion-time definitions rather than the changed live library');
 check(h.M.catalog(current).rows.length===1&&h.M.catalog(current).fields.length===1,'the archived fixed-type call never overwrites other active category definitions');
 h.A.openDialog();h.choose(field.id,'a');h.connect();h.A.end();h.A.setDisposition('已完成沟通');h.A.saveDisposition();check(h.peek().phase==='idle','archived assigned business completes real wrap/save and returns idle');
 const saved=h.d.calls.find(item=>item.callId===current.callId),snapshot=saved.customerFollowup.businessFieldSnapshot.fields[0];check(snapshot.fieldName===field.label&&snapshot.selectedOptions[0].optionName==='删除时甲'&&snapshot.selectedOptions[0].businessOptionCode==='001','saved callback records retain archived names and opaque codes');
 check(h.w.CustomerTasks.render().includes('value="'+row.id+'"'),'existing batches retain their historical category filter');
 let rejected=false;try{h.w.CustomerTasks.prepare('新批次','新客户,13900007002,备注,NEW-DOC',row.id);}catch(_){rejected=true;}check(rejected,'actual manual import preparation still rejects the removed category');
 const next=h.preview();check(!h.M.list(next).some(item=>item.id===row.id),'the next ordinary call reads only current choices');
}
for(const proof of ['native','ram','dcc']){
 const h=setup(),{row}=configure(h),source=call(h,{callId:'OLD-PROVEN-'+proof,...(proof==='dcc'?{customerTaskItemId:'EXISTING-DCC-RECORD',taskId:'EXISTING-DCC-TASK'}:{})});
 if(proof==='native')h.storage.set('native-workbench-records-v1',JSON.stringify([copy(source)]));
 if(proof==='ram')h.w.CloudCallData.calls.push(copy(source));
 if(proof==='dcc')h.storage.set('dcc-task-ledger-v1.1.0',JSON.stringify({schemaVersion:'1.1.0',sequence:1,tasks:{'EXISTING-DCC-TASK':{task:{...h.scope,taskId:'EXISTING-DCC-TASK'},records:[{recordId:'EXISTING-DCC-RECORD',businessType:row.id,phone:source.callee}]}}}));
 check(h.M.deleteCategory(row.id,h.scope).ok,proof+': exact existing business is nonblocking category impact');
 check(h.C.bindCallForm(source).ok&&h.M.get(row.id,source)?.label===row.label,proof+': an exact existing source may capture the archive without rewriting its original record');
 const corrupted={...copy(source),businessFormVersion:{version:1}};check(!h.C.bindCallForm(corrupted).ok,proof+': existing damaged metadata cannot be replaced through archive capture');
}
{
 const h=setup(),{row}=configure(h),original=call(h,{callId:'MISSING-OWNER-SOURCE'});delete original.accountId;h.storage.set('native-workbench-records-v1',JSON.stringify([original]));check(h.M.deleteCategory(row.id,h.scope).ok,'unowned historical metadata still permits logical category removal');
 check(!h.C.bindCallForm({...original,accountId:h.state.accountId}).ok,'a native record without its original account identity cannot prove a new archived binding');
 check(h.M.get(row.id,original)?.label===row.label,'the stricter capture proof never removes authorized historical read-only lookup');
}
{
 const h=setup(),up=h.source('归档上游'),down=h.source('归档下游','stores'),a=h.field('archivedUpstream',up.id),b=h.field('archivedDownstream',down.id);
 check(h.M.saveField({...b,useQueryConditions:true,depends:[a.id],parameterBinding:{parameterName:'seriesCode',sourceValueKey:'code',required:false}},h.scope).ok,'create a real optional upstream condition');const target=h.category('archiveDependency',[b.id]);
 check(h.M.deleteCategory(target.id,h.scope).ok,'retire a category whose optional upstream was not a visible ref');
 check(archive(h,target.id).fields.map(item=>item.id).sort().join(',')===[a.id,b.id].sort().join(','),'archive contains the hidden upstream closure and excludes the rest of the library');
 check(h.M.saveField({...b,type:'text',useQueryConditions:false,depends:[]},h.scope).ok&&h.M.saveField({...a,type:'text'},h.scope).ok,'current fields may change while archived dependency definitions remain independent');
 check(h.inspect('interface',up.id).refs.some(ref=>ref.source.startsWith('retired-category:'))&&!h.B.remove(up.id).ok,'the archived upstream alone still protects its actual source');
 check(h.M.deleteField(a.id,h.scope).ok&&h.M.deleteField(b.id,h.scope).ok,'independent archived dependency definitions do not lock the current field library');
 const unused=h.field('unrelatedInventory');check(h.M.deleteField(unused.id,h.scope).ok,'unrelated library inventory is never added to the archive');
}
for(const mode of ['throw-before','throw-after','identity','foreign-write']){
 const h=setup(),{row}=configure(h),before=h.storage.get(h.M.storageKey),write=h.w.localStorage.setItem;let fired=false,foreign='';
 h.w.localStorage.setItem=(key,value)=>{if(key!==h.M.storageKey||fired)return write(key,value);fired=true;if(mode==='throw-before')throw Error('synthetic quota');write(key,value);if(mode==='throw-after')throw Error('synthetic acknowledgement loss');if(mode==='identity')h.state.sessionId='NEW-SESSION';if(mode==='foreign-write'){const updated=JSON.parse(value);updated.revision++;foreign=JSON.stringify(updated);h.storage.set(key,foreign);}};
 check(!h.M.deleteCategory(row.id,h.scope).ok,mode+': incomplete archive transaction never reports success');
 check(h.storage.get(h.M.storageKey)===(mode==='foreign-write'?foreign:before),mode+': rollback only restores bytes owned by this mutation');
}
{
 const h=setup(),{row}=configure(h),review=h.inspect('category',row.id);h.w.CloudCallData.calls.push(h.history('NEW-IMPACT',row.id));const before=h.storage.get(h.M.storageKey);
 check(h.U.verifyFresh(review.token).ok&&h.storage.get(h.M.storageKey)===before,'new nonblocking business history keeps a category confirmation valid without rewriting configuration');
 check(h.M.deleteCategory(row.id,h.scope,{expectedUsageFingerprint:review.fingerprint}).ok,'logical removal may preserve business uses arriving during confirmation');
 const raw=JSON.parse(h.storage.get(h.M.storageKey));raw.scopes[0].retiredTypes[0].fields[0].enabled='broken';h.storage.set(h.M.storageKey,JSON.stringify(raw));
 check(!h.M.catalog(h.scope).ok&&h.inspect('interface','d-mapping-series').code==='USAGE_UNAVAILABLE','damaged archive definitions cannot silently borrow live fields or permit source deletion');
}
{
 const h=workbench(),{row,field}=configure(h),started=h.preview(row.id);h.connect();h.A.openDialog();h.choose(field.id,'a');const review=h.w.BusinessConfigurationUsage.inspect({kind:'category',id:row.id,scope:h.scope}),version=JSON.stringify(started.businessFormVersion);
 started.durationSeconds=17;started.liveProgressAt='2026-10-20T12:00:17.000Z';const native=JSON.parse(h.storage.get('native-workbench-records-v1'));native.find(item=>item.callId===started.callId).durationSeconds=17;h.storage.set('native-workbench-records-v1',JSON.stringify(native));
 h.A.setFollowup(field.id,'b');h.A.setRemark('确认期间继续填写的备注');const draft=JSON.stringify(h.peek().followup);
 check(h.w.BusinessConfigurationUsage.verifyFresh(review.token).ok,'real connected-call timing, persisted progress and CF draft changes never invalidate category removal confirmation');
 check(h.M.deleteCategory(row.id,h.scope,{expectedUsageFingerprint:review.fingerprint}).ok,'the original category confirmation still commits after ordinary workbench progress');
 check(h.peek().phase==='connected'&&JSON.stringify(h.peek().followup)===draft&&h.peek().remark==='确认期间继续填写的备注'&&JSON.stringify(started.businessFormVersion)===version,'logical removal keeps the ongoing call, latest draft and original bound form unchanged');
 h.A.end();h.A.setDisposition('已完成沟通');h.A.saveDisposition();check(h.peek().phase==='idle'&&h.d.calls.find(item=>item.callId===started.callId).customerFollowup[field.id]==='b','the preserved latest draft completes actual wrap/save after delayed confirmation');
}
{
 const h=setup(),{row,field}=configure(h),target=h.inspect('category',row.id);check(h.M.save({...row,label:'确认后分类新名称'},h.scope).ok,'change the actual target while a confirmation is open');
 check(!h.U.verifyFresh(target.token).ok&&!h.M.deleteCategory(row.id,h.scope,{expectedUsageFingerprint:target.fingerprint}).ok,'target configuration changes still invalidate category confirmation');
 const related=h.inspect('category',row.id);check(h.M.saveField({...field,label:'确认后字段新名称'},h.scope).ok,'change a field definition needed by the archive');const before=h.storage.get(h.M.storageKey);
 check(!h.U.verifyFresh(related.token).ok&&!h.M.deleteCategory(row.id,h.scope,{expectedUsageFingerprint:related.fingerprint}).ok&&h.storage.get(h.M.storageKey)===before,'related definition changes still require a fresh review and preserve the changed configuration');
 const actor=h.inspect('category',row.id);h.state.sessionId='CHANGED-CATEGORY-CONFIRM-SESSION';check(!h.U.verifyFresh(actor.token).ok,'a new actor session never inherits an old category confirmation');
}
{
 const h=editor(),P=h.P;P.render('category');h.win.CloudCallData.calls.push({...h.scope,callId:'ARCHIVE-LOCATION-RECORD',customerPhone:'13900007009',accountId:h.win.AppState.get().accountId,businessType:'lead',processingStatus:'已完成'});check(h.M.usage('category','lead',h.scope).refs.some(ref=>ref.callId==='ARCHIVE-LOCATION-RECORD')&&!P.render('category').includes('查看引用'),'actual category impacts retain provenance without a standalone reference action');check(P.remove('category','lead')===true,'the actual category delete action opens confirmation despite existing history');
 const modal=h.node('business-config-delete-confirm');check(modal.textContent.includes('历史记录')&&modal.textContent.includes('已有名单和任务')&&!modal.textContent.includes('只删除此未使用配置'),'real confirmation explains logical removal and retained work in plain language');
 modal.querySelector('.layer-footer button').click();check(h.M.get('lead',h.scope),'cancelling the real confirmation preserves the active category');
 P.remove('category','lead');h.win.CloudCallData.calls.find(item=>item.callId==='ARCHIVE-LOCATION-RECORD').durationSeconds=31;h.win.CloudCallData.calls.push({...h.scope,callId:'ARRIVED-DURING-CONFIRM',businessType:'lead',processingStatus:'已完成',accountId:h.win.AppState.get().accountId,customerPhone:'13900007019'});h.node('business-config-delete-confirm-confirm').click();check(!h.M.get('lead',h.scope)&&!h.node('business-config-delete-confirm'),'the actual confirmed action survives business progress and archives the category without closing another prompt');
}
console.log(JSON.stringify({passed,scope:'logical category removal, immutable archives, actual old-task wrap/save, new-business rejection, source-proof binding, physical field/source protection and real PUI transactions'}));
