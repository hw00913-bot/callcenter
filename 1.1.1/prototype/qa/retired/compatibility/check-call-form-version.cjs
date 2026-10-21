/** Real tenant catalog, bound-call form, follow-up save, repair and live access checks. */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {harness,copy}=require('./check-local-series-followup.cjs');
let passed=0;
const check=(condition,message)=>{assert.ok(condition,message);passed++;};
function render(h){h.form().outerHTML=h.C.form(h.values,h.call,'seat-followup','AgentWorkbench.setFollowup');}
function bind(h,extra={},initial={}){h.mount(extra,initial);check(h.C.bindCallForm(h.call).ok,'complete call identity captures a tenant-wide form version');render(h);return h.call;}
function save(h){return h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''});}
function callbackField(result,id){return result.values.businessFieldSnapshot.fields.find(field=>field.fieldId===id);}
function change(h,id,value){h.win.AgentWorkbench.setFollowup(id,value);}
function click(h,selector){const node=h.form().querySelector(selector);check(!!node,'generated explicit repair action is present');h.win.eventNode=node;try{return vm.runInContext('(function(){return '+node.getAttribute('onclick')+'}).call(eventNode)',h.win);}finally{delete h.win.eventNode;}}
function custom(h,field){check(h.M.saveField(field,h.scope).ok,'administrator maintains a real reusable custom field');return field;}
function add(h,id){const category=h.M.get('lead',h.scope);category.fields.push({fieldId:id,enabled:true,required:false});check(h.M.save(category,h.scope).ok,'administrator adds the custom field to the category');}
function frozen(h,mutate,initial={},extra={}){
  bind(h,{callId:'bound-'+(++frozen.count),...extra},initial);const before=JSON.stringify(h.call.businessFormVersion),result=mutate(h);
  check(h.C.bindCallForm(h.call).ok&&JSON.stringify(h.call.businessFormVersion)===before,'repeated binding never replaces a valid call version with the latest administrator configuration');
  return result;
}frozen.count=0;

{
  const h=harness(),field=h.field(),option=copy(field.options[0]),id=field.id;
  frozen(h,()=>{
    const live=h.M.getField(id,h.scope);live.options[0].label='管理员改名';live.options[0].businessKey='NEW-CODE';check(h.M.saveField(live,h.scope).ok,'administrator changes local option name and code');
    const category=h.M.get('lead',h.scope);category.label='管理员新类别';category.enabled=false;category.fields.find(row=>row.fieldId===id).enabled=false;category.fields.find(row=>row.fieldId==='plannedStoreName').enabled=false;category.fields.find(row=>row.fieldId==='intentionLevel').required=true;check(h.M.save(category,h.scope).ok,'administrator changes category name/status/visibility and adds a required rule');
  },{[id]:option.id,plannedStoreName:'原计划门店'});
  const result=save(h),selected=callbackField(result,id).selectedOptions[0];
  check(result.ok&&selected.businessOptionCode===option.businessKey&&selected.optionName===option.label,'bound save and callback preserve original local-series code/name despite live rename/hiding');
  check(result.values.plannedStoreName==='原计划门店'&&callbackField(result,'plannedStoreName').value==='原计划门店','hidden planned-store text remains part of the original call version and is not lost');
  check(h.M.get('lead',h.call).enabled&&h.M.get('lead',h.call).label!=='管理员新类别','bound classification label and enabled state stay fixed');
  const group=h.C.aggregate([h.call]).groups[0];check(result.values.businessFieldSnapshot.businessTypeLabel==='线索类'&&group.businessTypeLabel==='线索类'&&!h.C.detail({groups:[group]}).includes('管理员新类别'),'saved call and customer group headings retain the category name from the same bound version');
  check(!h.M.fields('lead',h.call).find(row=>row.id==='intentionLevel').required&&h.M.fields('lead',h.scope).find(row=>row.id==='intentionLevel').required,'new requiredness applies to live/new forms only');
  check(h.form().textContent.includes('配置更新从后续通话生效'),'operator sees a concise explanation of the current-call version');
  check(!JSON.stringify(result.values).includes('businessFormVersion')&&!JSON.stringify(result.values).includes('__localSeriesSelection'),'business values and callback never contain private call/draft metadata');
  const next={...copy(h.call),callId:'next-call'};delete next.businessFormVersion;delete next.businessFormType;
  check(h.C.bindCallForm(next).ok&&!h.M.get('lead',next).enabled&&!h.M.fields('lead',next).some(row=>row.id===id),'a newly started call reads the newest category and field state');
}

for(const mode of ['new-required','type','removed','deleted','option']){
  const h=harness(),id='ordinary_'+mode.replace('-','_'),original=mode==='option'?{id,label:'普通单选',type:'select',businessKey:'ORIGINAL_FIELD',enabled:true,options:[{id:'option-a',label:'原名称',businessKey:'001'}]}:{id,label:'普通自建字段',type:'text',businessKey:'ORIGINAL_FIELD',enabled:true,options:[]};
  custom(h,original);add(h,id);const value=mode==='option'?'option-a':'保留原填写';
  frozen(h,()=>{
    if(mode==='new-required'){
      custom(h,{id:'addedRequired',label:'通话中新必填',type:'text',businessKey:'',enabled:true,options:[]});const category=h.M.get('lead',h.scope);category.fields.push({fieldId:'addedRequired',enabled:true,required:true});check(h.M.save(category,h.scope).ok,'administrator adds a wholly new required field');
    }else if(mode==='type'){const field=h.M.getField(id,h.scope);field.type='number';check(h.M.saveField(field,h.scope).ok,'administrator changes the custom input type');}
    else if(mode==='option'){const field=h.M.getField(id,h.scope);field.options[0].label='新含义';field.options[0].businessKey='999';check(h.M.saveField(field,h.scope).ok,'administrator changes an ordinary option meaning');}
    else {const category=h.M.get('lead',h.scope);category.fields=category.fields.filter(ref=>ref.fieldId!==id);check(h.M.save(category,h.scope).ok,'administrator removes the field from the category');if(mode==='deleted')check(h.M.deleteField(id,h.scope).ok,'administrator deletes the now-unreferenced field');}
  },{[id]:value});
  const result=save(h);check(result.ok&&result.values[id]===value,'bound '+mode+' save retains the entire original field/value and completes');
  check(callbackField(result,id).type===original.type&&callbackField(result,id).businessFieldCode==='ORIGINAL_FIELD','callback field definition comes from the same captured version');
  if(mode==='option')check(callbackField(result,id).selectedOptions[0].optionName==='原名称'&&callbackField(result,id).selectedOptions[0].businessOptionCode==='001','ordinary option snapshot keeps original name and opaque code');
  if(mode==='new-required')check(!Object.hasOwn(result.values,'addedRequired'),'a newly added live required field is not imposed on an existing call');
}

// No fixed business type still captures all categories before any later selection.
{
  const h=harness();bind(h,{callId:'type-selected-later',businessType:''});
  check(h.form().textContent.includes('配置更新从后续通话生效'),'untyped bound calls show the version explanation before a classification is chosen');
  const activity=h.M.get('activity',h.scope);activity.enabled=false;activity.fields.find(ref=>ref.fieldId==='participantCount').required=true;check(h.M.save(activity,h.scope).ok,'administrator changes another classification after call start');
  change(h,'businessType','activity');render(h);
  check(h.values.businessType==='activity'&&h.M.get('activity',h.call).enabled,'later category selection uses the directory captured at call start');
  check(h.C.validate(h.values,h.call).ok,'a newly live mandatory rule does not block a later selection within the same bound call');
  change(h,'businessType','aftersales');render(h);check(save(h).ok,'switching within the call stays on the same complete directory');
}

// JSON restoration retains the bound version, while every identity dimension is scope-bound.
{
  const h=harness(),field=h.field();bind(h,{callId:'restore-original'},{[field.id]:field.options[0].id});
  const serialized=copy(h.call),draft=copy(h.values),live=h.M.getField(field.id,h.scope);live.options[0].businessKey='CHANGED-AFTER-RELOAD';check(h.M.saveField(live,h.scope).ok,'administrator changes options after a serialized call');
  h.mount(serialized,draft);check(h.C.bindCallForm(h.call).ok,'restored call retains a valid bound version');const restored=save(h);check(restored.ok&&callbackField(restored,field.id).selectedOptions[0].businessOptionCode!=='CHANGED-AFTER-RELOAD','same-call JSON restore does not silently bind current options');
  for(const [key,value] of [['callId','OTHER-CALL'],['customerPhone','13900000000'],['tenantId','OTHER-TENANT'],['enterpriseId','OTHER-ENTERPRISE'],['accountId','OTHER-OWNER']]){
    const other={...copy(serialized),[key]:value};check(!h.C.bindCallForm(other).ok&&!h.M.catalog(other).ok,'copying the version across '+key+' fails without falling back to live configuration');
  }
  const tampered=copy(serialized);tampered.businessFormVersion.fields[0].label='篡改字段';check(!h.C.bindCallForm(tampered).ok,'corrupted configuration bytes cannot become a valid bound version');
  h.state.sessionId='NEW-LOGIN-SESSION';check(h.C.bindCallForm(h.call).ok,'same-owner restoration across a session refresh preserves the valid version');
  h.setAuthorized(false);check(!h.M.catalog(h.call).ok&&!save(h).ok,'current object authorization revocation still blocks catalog use and save');h.setAuthorized(true);
  h.setValid(false);check(!h.M.catalog(h.call).ok&&!save(h).ok,'current account permission revocation remains live');h.setValid(true);
  h.state.accountId='ADMIN-READER';check(h.M.catalog(h.call).ok,'authorized administrator read is not rejected merely for having a different active account');
}

function badCategory(h){
  const data=h.M.catalog(h.scope),row={id:'repairCase',label:'待修复分类',codeLabel:'案例编号',prefix:'REPAIR',enabled:true,fields:[{fieldId:'intendedSeries',enabled:false,required:false},{fieldId:'intendedStore',enabled:true,required:false},{fieldId:'serviceConcern',enabled:true,required:false},{fieldId:'participantCount',enabled:true,required:false}]};
  const bundle={...h.scope,localIntentProfileVersion:h.win.CustomerIntentProfile.revision,fields:copy(data.fields),types:[...copy(data.rows),row]};
  h.storage.set(h.M.storageKey,JSON.stringify({version:3,revision:1,seriesSelectionPolicy:'single',scopes:[bundle]}));
  check(h.M.configurationIssue(row.id,h.scope).includes('同时显示'),'fixture uses an actual structurally readable but incomplete category dependency');return row;
}
function bridge(h){h.win.AgentWorkbench.persistBusinessForm=updated=>{const accepted=h.M.acceptCallFormRepair(h.call,updated);if(!accepted.ok)return accepted;h.call.businessFormVersion=copy(updated.businessFormVersion);h.call.businessFormType=updated.businessFormType;return {ok:true};};}
{
  const h=harness(),bad=badCategory(h);bind(h,{callId:'unrelated-bad',businessType:'lead'});
  check(save(h).ok&&!h.form().querySelector('[data-followup-reload-repaired]'),'unrelated broken classification does not block a normal bound classification or expose a normal-version reload');
  check(!h.M.repairedCallForm(h.call,'lead').ok,'a valid target cannot use the exceptional repair API');
  check(!h.M.repairedCallForm(h.call,bad.id).ok,'an unrepaired live target cannot replace its original broken definition');
}
{
  const h=harness(),bad=badCategory(h);bind(h,{callId:'repair-case',businessType:bad.id},{serviceConcern:'修复前的反馈',participantCount:'3'});bridge(h);
  check(!save(h).ok&&h.form().querySelector('[data-followup-reload-repaired]'),'an initially invalid target preserves input and offers an explicit repair reload');
  const before=JSON.stringify(h.call.businessFormVersion);check(!click(h,'[data-followup-reload-repaired]')&&JSON.stringify(h.call.businessFormVersion)===before,'still-broken live configuration cannot replace the version');
  const repaired=h.M.get(bad.id,h.scope);repaired.fields.find(ref=>ref.fieldId==='intendedSeries').enabled=true;repaired.fields.find(ref=>ref.fieldId==='participantCount').enabled=false;check(h.M.save(repaired,h.scope).ok,'administrator repairs the required dependency and hides one ordinary field');
  const feedback=h.M.getField('serviceConcern',h.scope);feedback.type='number';check(h.M.saveField(feedback,h.scope).ok,'administrator changes a previously filled ordinary type during repair');
  const originalLead=JSON.stringify(h.M.fields('lead',h.call));
  check(click(h,'[data-followup-reload-repaired]')===true,'operator explicitly accepts the now-valid target repair through the controlled bridge');
  check(h.values.serviceConcern==='修复前的反馈'&&h.values.participantCount==='3','repair never coerces or drops previous values');
  check(JSON.stringify(h.M.fields('lead',h.call))===originalLead,'type-specific repair does not replace unrelated valid category definitions');
  check(!save(h).ok&&h.form().textContent.includes('修复前的反馈')&&h.form().textContent.includes('填写方式已改变'),'changed ordinary meaning stays visible and blocks silent conversion');
  const blocked=JSON.stringify(h.values);change(h,'serviceConcern','7');check(JSON.stringify(h.values)===blocked,'pending former value cannot be silently overwritten before explicit clearing');
  check(click(h,'[data-followup-recovery-clear="serviceConcern"]')===true&&h.values.serviceConcern==='','explicit clearing updates the real draft for a changed type');
  check(click(h,'[data-followup-recovery-clear="participantCount"]')===true&&h.values.participantCount==='','explicit clearing resolves a field no longer displayed');
  change(h,'serviceConcern','7');const result=save(h);
  check(result.ok&&result.values.serviceConcern==='7'&&!Object.hasOwn(result.values,'participantCount'),'repaired category can complete after intentional re-entry and removal');
  check(!JSON.stringify(result.values).includes('__callFormRecovery'),'repair provenance stays outside saved business values');
  check(!h.M.repairedCallForm(h.call,bad.id).ok&&!h.form().querySelector('[data-followup-reload-repaired]'),'a repaired valid target cannot repeatedly reload later changes');
}

// Archive editing deliberately keeps live protection even when the completed call has a bound version.
{
  const h=harness(),field=h.field(),option=copy(field.options[0]);bind(h,{callId:'archive-bound',callSource:'HISTORY',processingStatus:'已完成'},{[field.id]:option.id});
  h.win.CustomerDirectory.list=()=>[{...h.scope,phone:h.call.customerPhone,calls:[h.call]}];
  const first=h.C.save(h.call,h.values,{expectedVersion:''});check(first.ok,'fixture saves the original bound archive snapshot');
  h.win.CustomerDirectory.list=()=>[{...h.scope,phone:h.call.customerPhone,calls:[h.call]}];h.C.openEditor(h.call.callId);
  const archive=h.document.querySelectorAll('[data-followup-tabs]').find(node=>node.dataset.followupPrefix==='followup'),select=h.document.getElementById('followup-'+field.id);select.value=option.id;h.win.eventNode=select;vm.runInContext('(function(){'+select.getAttribute('onchange')+'}).call(eventNode)',h.win);delete h.win.eventNode;
  const live=h.M.getField(field.id,h.scope);live.options[0].businessKey='ARCHIVE-LIVE-CHANGE';check(h.M.saveField(live,h.scope).ok,'administrator changes current options during a separate archive edit');h.C.saveEditor();
  check(h.document.getElementById('followup-error').textContent.includes('配置已更新')&&archive.querySelector('[data-followup-local-refresh]'),'completed-call archive editor still uses live configuration-change protection');
}
{
  const h=harness();bind(h,{callId:'archive-added-field',callSource:'HISTORY',processingStatus:'已完成'});
  h.win.CustomerDirectory.list=()=>[{...h.scope,phone:h.call.customerPhone,calls:[h.call]}];check(h.C.save(h.call,h.values,{expectedVersion:''}).ok,'fixture saves the original completed-call form version');
  custom(h,{id:'archiveAdded',label:'档案新增填写',type:'text',businessKey:'ARCHIVE_NEW',enabled:true,options:[]});add(h,'archiveAdded');
  const category=h.M.get('lead',h.scope);category.label='档案本次保存分类名';check(h.M.save(category,h.scope).ok,'administrator renames the live category before an archive edit');
  h.C.openEditor(h.call.callId);h.C.updateEditor('archiveAdded','档案编辑后新保存内容');h.C.saveEditor();
  check(h.call.customerFollowup.archiveAdded==='档案编辑后新保存内容','live archive editor saves a field added after the call-bound version');
  const grouped=h.C.aggregate([h.call]),group=grouped.groups[0];
  check(group.values.archiveAdded==='档案编辑后新保存内容'&&h.C.detail(group.values,group).includes('档案编辑后新保存内容'),'customer aggregate uses the actual saved field manifest and retains newly edited ordinary fields');
  check(group.values.businessFieldSnapshot.fields.find(row=>row.fieldId==='archiveAdded').fieldName==='档案新增填写','aggregate projection retains the saved field name rather than the old call catalog');
  check(h.call.customerFollowup.businessFieldSnapshot.businessTypeLabel==='档案本次保存分类名'&&h.M.typeLabel(h.call)==='档案本次保存分类名'&&group.businessTypeLabel==='档案本次保存分类名','live archive re-save and aggregate use this save version category name instead of forcing the old call category name');
}
{
  const h=harness(),id='ordinaryContribution';custom(h,{id,label:'普通来源选择',type:'select',businessKey:'CONTRIBUTION',enabled:true,options:[{id:'choice-a',label:'最初选择名称A',businessKey:'001'}]});add(h,id);
  const first=h.saved('ordinary-first',{[id]:'choice-a'},'2026-10-19T01:00:00.000Z'),empty=h.saved('ordinary-empty',{[id]:''},'2026-10-19T02:00:00.000Z');
  let projection=h.C.aggregate([first,empty]),group=projection.groups[0];
  check(projection[id]==='choice-a'&&group.values[id]==='choice-a','an empty later ordinary selection keeps the existing nonempty merge rule');
  check(h.C.detail(projection).includes('最初选择名称A')&&h.C.detail(group.values,group).includes('最初选择名称A'),'top-level and grouped aggregates keep the contributing ordinary option name');
  check(projection.businessFieldSnapshot.fields.find(row=>row.fieldId===id).selectedOptions[0].businessOptionCode==='001'&&group.values.businessFieldSnapshot.fields.find(row=>row.fieldId===id).selectedOptions[0].businessOptionCode==='001','inherited ordinary values retain the same contributor option code');
  const category=h.M.get('lead',h.scope);category.fields=category.fields.filter(ref=>ref.fieldId!==id);check(h.M.save(category,h.scope).ok,'administrator removes the ordinary field before a later call');
  const removed=h.saved('ordinary-removed',{},'2026-10-19T03:00:00.000Z');projection=h.C.aggregate([first,removed]);group=projection.groups[0];
  check(projection[id]==='choice-a'&&h.C.detail(group.values,group).includes('最初选择名称A')&&group.values.businessFieldSnapshot.fields.some(row=>row.fieldId===id),'a later omitted ordinary field does not hide the already-contributing value or its saved definition');
}
{
  const h=harness();h.mount({callId:'adopt-existing-draft'},{plannedStoreName:'旧演示当前门店',deletedOrdinary:'旧演示已删字段填写'});
  const category=h.M.get('lead',h.scope);category.fields.find(ref=>ref.fieldId==='plannedStoreName').enabled=false;check(h.M.save(category,h.scope).ok,'administrator hides a field before an existing unbound active demo is adopted');
  check(h.C.bindCallForm(h.call,{values:h.values}).ok,'first adoption records the complete current catalog without discarding an existing draft');render(h);
  check(!save(h).ok&&h.values.plannedStoreName==='旧演示当前门店'&&h.values.deletedOrdinary==='旧演示已删字段填写','orphaned first-adoption fields remain visible as pending and cannot be silently omitted');
  check(h.form().textContent.includes('原字段当前不显示')&&h.form().textContent.includes('旧演示已删字段填写'),'unknown original definitions are described for operator review without guessing a former type/name');
  check(click(h,'[data-followup-recovery-clear="plannedStoreName"]')===true&&h.values.plannedStoreName==='','existing hidden ordinary field can be cleared through the actual draft writer');
  check(click(h,'[data-followup-recovery-clear="deletedOrdinary"]')===true&&h.values.deletedOrdinary==='','an unknown deleted ordinary field also uses the pending-field clear path');
  check(save(h).ok,'first-adopted demo can complete once the operator explicitly resolves orphaned values');
}
console.log(JSON.stringify({ok:true,assertions:passed,scope:'bound whole-directory versions, immutable current-call semantics, live access, identity isolation, explicit invalid-target repair and live archive editing'}));
