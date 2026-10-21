/** Real configuration/model/form/save integration for a pending local-series draft. */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {harness,copy,encode}=require('./check-local-series-followup.cjs');
let passed=0;
const check=(condition,message)=>{assert.ok(condition,message);passed++;};
const metaKey='__localSeriesSelection';
function invoke(h,node,event){
  check(!!node,'generated recovery/control node exists');
  h.win.eventNode=node;let result;
  try {result=vm.runInContext('(function(){return '+node.getAttribute(event)+'}).call(eventNode)',h.win);} finally {delete h.win.eventNode;}
  return result;
}
function click(h,selector,form=h.form()){return invoke(h,form.querySelector(selector),'onclick');}
function save(h){return h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''});}
function selectedSnapshot(result,id){return result.values?.businessFieldSnapshot.fields.find(row=>row.fieldId===id)?.selectedOptions[0];}
function rename(h,id,patch,index=0){const field=h.M.getField(id,h.scope);Object.assign(field.options[index],patch);check(h.M.saveField(field,h.scope).ok,'real administrator model saves the option change');}
function mountSelected(h,name){const field=h.field(),option=copy(field.options[0]);h.mount({callId:name},{plannedStoreName:'人工计划门店',customerNote:'保留其他填写'});h.change(option.id);return {id:field.id,option};}

for(const patch of [{label:'更新后的车系名称'},{businessKey:'NEW-0001'},{label:'重命名的车系',businessKey:'NEW-0002'}]){
  const h=harness(),{id,option}=mountSelected(h,'changed-'+Object.keys(patch).join('-'));
  const before=JSON.stringify(h.values),oldForm=h.form(),oldSelect=h.document.getElementById('seat-followup-'+id);
  rename(h,id,patch);
  const checked=h.C.validate(h.values,h.call),result=save(h);
  check(!checked.ok&&checked.localSeriesChange&&!result.ok,'pending renamed/recoded selection cannot silently save the current option meaning');
  check(JSON.stringify(h.values)===before&&!h.storage.has('customer-followup-v1'),'rejected save preserves the entire draft and writes no business journal');
  const notice=oldForm.querySelector('[data-followup-local-config-status]');
  check(!notice.hidden&&notice.textContent.includes(option.label)&&notice.textContent.includes(option.businessKey)&&notice.textContent.includes('全部填写已保留'),'visible recovery message retains the exact originally displayed name and code');
  check(click(h,'[data-followup-local-refresh]')===true&&h.form()!==oldForm,'explicit refresh replaces the field candidates through the current form owner');
  const fresh=h.document.getElementById('seat-followup-'+id);
  check(fresh.textContent.includes('请重新选择')&&fresh.textContent.includes(patch.label || option.label),'updated control presents a pending original value alongside current choices');
  check(!save(h).ok&&JSON.stringify(h.values)===before,'rendering the same option ID never counts as confirming its changed meaning');
  const writes=h.writes.length;oldSelect.value=option.id;invoke(h,oldSelect,'onchange');
  check(h.writes.length===writes&&!save(h).ok,'detached old select cannot confirm a newer option definition');
  h.change(option.id);const saved=save(h),snapshot=selectedSnapshot(saved,id);
  check(saved.ok&&snapshot.optionName===(patch.label || option.label)&&snapshot.businessOptionCode===(patch.businessKey || option.businessKey),'explicit selection in the refreshed control saves the exact new name/code');
  check(saved.values.plannedStoreName==='人工计划门店'&&h.values.customerNote==='保留其他填写','refresh and confirmation preserve other customer input');
  check(!Object.hasOwn(saved.values,metaKey)&&!Object.hasOwn(saved.values.businessFieldSnapshot.values,metaKey)&&!JSON.stringify(saved.values).includes('"'+metaKey+'"'),'draft-only selection metadata never enters the saved values or callback snapshot');
  check(h.C.detail(saved.values,h.call).includes(encode(snapshot.optionName+' · '+snapshot.businessOptionCode)),'detail displays the newly confirmed snapshot');
}

// Only the selected option meaning and field inclusion are part of this check.
{
  const h=harness(),{id,option}=mountSelected(h,'unrelated-change');
  rename(h,id,{label:'未选择项改名',businessKey:'UNSELECTED-NEW'},1);
  let field=h.M.getField(id,h.scope);field.label='意向车系显示标题';check(h.M.saveField(field,h.scope).ok,'real model changes only the field label');
  const category=h.M.get('lead',h.scope);category.label='线索分类新标题';check(h.M.save(category,h.scope).ok,'real model changes an unrelated category title');
  const result=save(h);
  check(result.ok&&selectedSnapshot(result,id).businessOptionCode===option.businessKey,'unselected option, field-label and category-title changes do not block a still-identical selection');
}
{
  const h=harness(),{id,option}=mountSelected(h,'configuration-restored');
  rename(h,id,{label:'临时改变',businessKey:'TEMP-CODE'});check(!save(h).ok,'changed meaning is initially rejected');
  rename(h,id,{label:option.label,businessKey:option.businessKey});
  check(save(h).ok,'restoring the exact selected name/code and field inclusion restores the original valid meaning');
}

// Omitted fields must not be silently dropped. Explicit clearing uses the actual writing handler.
for(const mode of ['hidden','removed']){
  const h=harness(),{id,option}=mountSelected(h,'field-'+mode),category=h.M.get('lead',h.scope);
  if(mode==='hidden')category.fields.find(row=>row.fieldId===id).enabled=false;
  else category.fields=category.fields.filter(row=>row.fieldId!==id);
  check(h.M.save(category,h.scope).ok,'real category model '+mode+' the selected local field');
  const before=JSON.stringify(h.values),result=save(h);
  check(!result.ok&&result.hidden&&JSON.stringify(h.values)===before,'hidden or omitted selected field rejects save while keeping all draft values');
  check(h.form().querySelector('[data-followup-local-config-status]').textContent.includes(option.businessKey),'omitted field recovery still identifies the retained original code');
  const writes=h.writes.length;check(click(h,'[data-followup-local-clear]')===true,'operator explicitly clears a selected field no longer in definitions');
  check(h.values[id]===''&&h.writes.length===writes+1&&h.writes.at(-1)[0]===id&&h.writes.at(-1)[1]==='','clear action updates the owning draft through its actual handler');
  check(h.values.plannedStoreName==='人工计划门店'&&h.values.customerNote==='保留其他填写','clearing an unavailable selection preserves every unrelated draft value');
  const cleared=save(h);check(cleared.ok&&!Object.hasOwn(cleared.values,id)&&cleared.values.plannedStoreName==='人工计划门店','only after explicit clearing may save omit the no-longer-configured field');
}
{
  const h=harness(),{id}=mountSelected(h,'deleted-option'),field=h.M.getField(id,h.scope);
  field.options=field.options.slice(1);check(h.M.saveField(field,h.scope).ok,'real model removes the selected option');
  check(!save(h).ok,'deleted selected option is retained as a pending draft');
  click(h,'[data-followup-local-refresh]');h.change(h.field().options[0].id);
  check(save(h).ok,'selecting another current option resolves a deleted selection');
}
{
  const h=harness(),{id}=mountSelected(h,'required-clear'),category=h.M.get('lead',h.scope);
  category.fields.find(row=>row.fieldId===id).required=true;check(h.M.save(category,h.scope).ok,'real category model marks local series required');
  rename(h,id,{businessKey:'REQUIRED-NEW'});check(!save(h).ok,'required stale selection is initially rejected');
  click(h,'[data-followup-local-clear]');const result=save(h);
  check(!result.ok&&!result.localSeriesChange&&result.field===id&&result.message==='请填写本次意向车系','explicit clear resolves configuration staleness but preserves category mandatory validation');
}
{
  const h=harness(),{id}=mountSelected(h,'optional-clear');
  rename(h,id,{businessKey:'OPTIONAL-NEW'});check(!save(h).ok,'optional stale selection is initially rejected');
  click(h,'[data-followup-local-clear]');const result=save(h);
  check(result.ok&&result.values[id]==='','optional selection can be explicitly cleared and saved');
}

// The local snapshot survives the same JSON serialization used by the existing session draft.
{
  const h=harness(),{id}=mountSelected(h,'serialized-draft'),draft=JSON.parse(JSON.stringify(h.values));
  rename(h,id,{businessKey:'AFTER-SESSION-COPY'});
  h.mount({callId:'serialized-draft'},draft);
  check(!save(h).ok&&h.values[id]===draft[id],'serializing and rendering the draft keeps its prior selected code/name rather than blessing new options');
  h.change(id);check(h.values[id]===draft[id],'an unknown generated control value cannot change the retained draft');
  const current=h.field().options[0];h.change(current.id);
  check(save(h).ok,'new explicit selection after restored render confirms the current meaning');
}

for(const guard of ['session','account','permission','authorization','call','owner']){
  const h=harness(),{id,option}=mountSelected(h,'guard-'+guard),old=h.document.getElementById('seat-followup-'+id),writes=h.writes.length;
  if(guard==='session')h.state.sessionId='OTHER-SESSION';
  if(guard==='account')h.state.accountId='OTHER-ACCOUNT';
  if(guard==='permission')h.setValid(false);
  if(guard==='authorization')h.setAuthorized(false);
  if(guard==='call')h.call.callId='OTHER-CALL';
  if(guard==='owner')h.mount({callId:'guard-'+guard});
  old.value=option.id;invoke(h,old,'onchange');
  check(h.writes.length===writes,'stale '+guard+' cannot confirm a local selection through old DOM');
}

// An initial restored value has not yet passed through update(); refreshing must
// retain the owning writer's real draft reference rather than a rendered clone.
for(const action of ['clear','other-option']){
  const h=harness(),field=h.field(),id=field.id,option=copy(field.options[0]);
  h.mount({callId:'initial-selected-'+action},{[id]:option.id,plannedStoreName:'初始草稿门店'});
  rename(h,id,{businessKey:'RESTORED-NEW'});check(!save(h).ok,'initial selected draft detects a changed code before any new input');
  click(h,'[data-followup-local-refresh]');
  if(action==='clear')check(click(h,'[data-followup-local-clear]')===true&&h.values[id]==='','clear after refresh writes through the initial owning draft');
  else {h.change(h.field().options[1].id);check(h.values[id]===h.field().options[1].id&&h.form().querySelector('[data-followup-local-config-status]').hidden,'different selection after refresh updates the initial draft and clears its old warning');}
  const result=save(h);check(result.ok&&result.values.plannedStoreName==='初始草稿门店','initial draft recovery preserves other values and becomes savable');
}

// A failed old import cannot reset the pending snapshot; explicit current import can.
{
  const h=harness(),{id,option}=mountSelected(h,'import-after-change');h.call.intentionSeriesCode='CURRENT-IMPORT';
  rename(h,id,{businessKey:'CURRENT-IMPORT'});check(!save(h).ok,'import case starts with an old selection meaning');
  check(!h.C.bringLocalOriginal('seat-followup',h.button())&&!save(h).ok,'stale import context cannot confirm changed option definitions');
  click(h,'[data-followup-local-refresh]');
  check(h.C.bringLocalOriginal('seat-followup',h.button())&&h.values[id]===option.id,'explicit import in the refreshed context confirms the current exact code');
  check(save(h).ok,'the refreshed explicit import produces a valid save');
}

// Exercise the real archive editor bridge, not a workbench write substitute.
{
  const h=harness(),field=h.field(),id=field.id,option=copy(field.options[0]);
  h.mount({callId:'archive-stale',callSource:'HISTORY',processingStatus:'已完成'},{[id]:option.id,plannedStoreName:'坐席侧草稿'});
  h.win.CustomerDirectory.list=()=>[{...h.scope,phone:h.call.customerPhone,calls:[h.call]}];h.C.openEditor(h.call.callId);
  let archive=h.document.querySelectorAll('[data-followup-tabs]').find(node=>node.dataset.followupPrefix==='followup');
  let select=h.document.getElementById('followup-'+id);select.value=option.id;invoke(h,select,'onchange');
  rename(h,id,{businessKey:'ARCHIVE-NEW',label:'档案重新确认车系'});h.C.saveEditor();
  check(!h.call.customerFollowup&&h.document.getElementById('followup-error').textContent.includes('全部填写已保留'),'archive save displays the same safe configuration-change error');
  check(click(h,'[data-followup-local-refresh]',archive)===true,'archive recovery refresh uses its own owning editor');
  archive=h.document.querySelectorAll('[data-followup-tabs]').find(node=>node.dataset.followupPrefix==='followup');
  select=h.document.getElementById('followup-'+id);select.value=option.id;invoke(h,select,'onchange');
  check(h.values.plannedStoreName==='坐席侧草稿'&&h.values[metaKey].code===option.businessKey,'archive confirmation does not overwrite a separately rendered same-call workbench draft');
  h.C.saveEditor();
  check(h.call.customerFollowup.businessFieldSnapshot.fields.find(row=>row.fieldId===id).selectedOptions[0].businessOptionCode==='ARCHIVE-NEW','archive editor actually saves the explicitly reconfirmed code');
  check(!Object.hasOwn(h.call.customerFollowup,metaKey),'archive saved values also exclude local draft-only metadata');
}
for(const action of ['clear','other-option']){
  const h=harness(),field=h.field(),id=field.id,option=copy(field.options[0]);
  h.mount({callId:'archive-initial-'+action,callSource:'HISTORY',processingStatus:'已完成',customerFollowup:{businessType:'lead',[id]:option.id,plannedStoreName:'档案初始门店'}});
  h.win.CustomerDirectory.list=()=>[{...h.scope,phone:h.call.customerPhone,calls:[h.call]}];h.C.openEditor(h.call.callId);
  rename(h,id,{businessKey:'ARCHIVE-INITIAL-NEW'});h.C.saveEditor();
  let archive=h.document.querySelectorAll('[data-followup-tabs]').find(node=>node.dataset.followupPrefix==='followup');
  check(h.document.getElementById('followup-error').textContent.includes('全部填写已保留'),'archive initial selection detects stale meaning before any input');
  click(h,'[data-followup-local-refresh]',archive);archive=h.document.querySelectorAll('[data-followup-tabs]').find(node=>node.dataset.followupPrefix==='followup');
  if(action==='clear')check(click(h,'[data-followup-local-clear]',archive)===true,'archive initial clear after refresh reaches its real editor draft');
  else {const select=h.document.getElementById('followup-'+id);select.value=h.field().options[1].id;invoke(h,select,'onchange');}
  h.C.saveEditor();
  check(h.call.customerFollowup[id]===(action==='clear'?'':h.field().options[1].id)&&h.call.customerFollowup.plannedStoreName==='档案初始门店','archive initial recovery writes the intended selection and preserves all other initial values');
}
console.log(JSON.stringify({ok:true,assertions:passed,scope:'real local option/configuration/form/update/import/archive/save integration; no external network'}));
