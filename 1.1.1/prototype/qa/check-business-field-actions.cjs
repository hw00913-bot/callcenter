/** Uniform field actions and actionable deletion blockers, with actual current models/UI. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {harness}=require('./check-business-config-dirty-close.cjs');
const {harness:callHarness}=require('./fixtures/current-profile.cjs');
let passed=0;const check=(v,m)=>{assert.ok(v,m);passed++;};
function render(h,kind='field'){
 let host=h.document.getElementById('field-action-host');if(!host){host=h.document.createElement('main');host.setAttribute('id','field-action-host');h.document.body.appendChild(host);}
 host.innerHTML=h.P.render(kind);return host;
}
function buttons(h,label){const host=render(h);const row=host.querySelectorAll('tr').find(row=>row.querySelector('strong')?.textContent===label);assert.ok(row,'rendered field row '+label);return row.querySelector('.table-actions').querySelectorAll('button');}
{
 const h=harness(),fields=h.M.catalog(h.scope).fields;
 for(const f of fields)check(buttons(h,f.label).map(b=>b.textContent).join('|')==='编辑|预览|停用|删除','every enabled field exposes the same actions, including '+f.id);
 check(!h.P.render('category').includes('查看引用')&&!h.P.render('field').includes('查看引用'),'both lists remove the redundant reference action');
 const before=JSON.stringify(h.M.getField('leadLevel',h.scope));buttons(h,'线索等级').find(b=>b.textContent==='停用').click();
 check(JSON.stringify(h.M.getField('leadLevel',h.scope))===before&&h.notices.at(-1)?.[0].includes('分类'),'actual stop action explains the current visible category dependency without changing data');
 for(const row of h.M.catalog(h.scope).rows)check(h.M.save({...row,fields:row.fields.map(f=>({...f,enabled:false,required:false}))},h.scope).ok,'close current category display before stopping fields');
 for(const f of fields){
  const initial=JSON.stringify({type:f.type,options:f.options});buttons(h,f.label).find(b=>b.textContent==='停用').click();
  const stopped=h.M.getField(f.id,h.scope);check(stopped.enabled===false&&JSON.stringify({type:stopped.type,options:stopped.options})===initial,'stop persists without changing type/options: '+f.id);
  check(buttons(h,f.label).map(b=>b.textContent).join('|')==='编辑|预览|启用|删除','every stopped field has the same enable action: '+f.id);
 }
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../js/components/customer-business.js'),'utf8'),h.win);
 check(h.win.CustomerBusiness.catalog(h.scope).fields.every(f=>f.enabled===false),'all stopped presets, Mapping and ordinary fields remain stopped after model reload');
 for(const f of fields){buttons(h,f.label).find(b=>b.textContent==='启用').click();check(h.M.getField(f.id,h.scope).enabled===true,'enable restores normal state through actual UI action: '+f.id);}
 const preset=h.M.getField('leadLevel',h.scope);check(!h.M.saveField({...preset,type:'text',options:[]},h.scope).ok,'uniform lifecycle does not permit changing protected preset type/options');
 const series=h.M.getField('mappingIntendedSeries',h.scope);check(!h.M.saveField({...series,type:'text'},h.scope).ok,'Mapping remains an interface single-choice definition');
}
{
 const h=callHarness(),original=JSON.stringify(h.call.businessFormVersion);h.win.AgentWorkbench.setFollowup('leadLevel','A级');
 const category=h.M.get('lead',h.scope);category.fields.find(f=>f.fieldId==='leadLevel').enabled=false;check(h.M.save(category,h.scope).ok,'current display can close after an old call captured its version');
 check(h.M.saveField({...h.M.getField('leadLevel',h.scope),enabled:false},h.scope).ok,'preset can stop once the current configuration no longer shows it');
 const saved=h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''});
 check(saved.ok&&saved.values.leadLevel==='A级'&&JSON.stringify(h.call.businessFormVersion)===original,'stopping the live definition does not block the original call save');
 check(saved.values.businessFieldSnapshot.fields.some(f=>f.fieldId==='leadLevel'&&f.value==='A级'),'saved original snapshot retains the field value');
 h.mount({callId:'AFTER-FIELD-STOP'});check(!h.M.fields('lead',h.call).some(f=>f.id==='leadLevel'),'the next call uses the updated configuration');
}
function categoryUse(h){return h.M.save({id:'fieldActionCategory',label:'字段操作引用分类',codeLabel:'业务编码',prefix:'QA',enabled:true,fields:[{fieldId:h.id,enabled:true,required:false}]},h.scope);}
{
 const h=harness();check(categoryUse(h).ok,'create a genuine current category reference');
 h.win.CloudCallData.calls=[{...h.scope,accountId:h.state.accountId,callId:'HISTORICAL-REFERENCE-NOT-A-BLOCKER',customerPhone:'13900008888',businessType:'lead',processingStatus:'已完成',customerFollowup:{businessType:'lead',[h.id]:'one',businessFieldSnapshot:{businessType:'lead',fields:[{fieldId:h.id,fieldName:'原快照字段',type:'select',value:'one'}],values:{[h.id]:'one'}}}}];
 h.P.render('field');h.P.remove('field',h.id);let ref=h.node('business-config-references');
 check(ref.textContent.includes('字段操作引用分类')&&!ref.textContent.includes('HISTORICAL-REFERENCE-NOT-A-BLOCKER'),'deletion blocker shows only actionable current references');
 let go=ref.querySelectorAll('button').find(b=>b.textContent==='去修改分类');check(!!go,'current category blocker offers a direct edit action');go.click();
 check(h.layer()?.textContent.includes('编辑业务分类')&&!h.node('business-config-references'),'the actual edit action opens the referenced category');
 h.P.close();h.P.render('field');h.P.remove('field',h.id);const current=h.node('business-config-references');go.click();
 check(h.node('business-config-references')===current&&!h.layer(),'an old detached reference button cannot operate on a newer request');
 const fresh=current.querySelectorAll('button').find(b=>b.textContent==='去修改分类');h.state.sessionId='DIFFERENT-SESSION';fresh.click();
 check(!h.layer(),'reference navigation rejects an obsolete identity/session');
}
{
 const h=harness();require('./fixtures/current-generic.cjs').install(h.win,{scope:h.scope});h.P.render('field');h.P.remove('field','genericSeries');
 const ref=h.node('business-config-references'),go=ref?.querySelectorAll('button').find(b=>b.textContent==='去修改字段');
 check(!!go,'a genuine upstream dependency offers the downstream field editor');go.click();
 check(h.layer()?.textContent.includes('编辑自定义字段')&&h.node('business-field-label')?.value===h.M.getField('genericStore',h.scope).label,'the action opens the actual dependent field, not the field being deleted');
}
console.log(JSON.stringify({ok:true,assertions:passed,scope:'uniform preset/Mapping/ordinary lifecycle UI, persistence, original-call save, no standalone references, actionable category/field blockers and stale-navigation guards'}));
