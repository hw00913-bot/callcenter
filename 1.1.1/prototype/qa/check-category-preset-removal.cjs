/** Real category references, editor actions, call versions and canonical follow-up saves. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {harness,copy,Element}=require('./fixtures/current-profile.cjs');
const base=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const ids=['leadLevel','intentionLevel','visitIntention','testDriveIntention','plannedVisitAt','plannedStoreName'];
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
const reload=h=>{vm.runInContext(fs.readFileSync(path.join(base,'js/components/customer-business.js'),'utf8'),h.win,{filename:'customer-business-reload.js'});return h.win.CustomerBusiness;};
const refs=h=>h.M.get('lead',h.scope).fields;
const library=h=>JSON.stringify(h.M.catalog(h.scope).fields);
function execute(h,node){check(!!node&&!node.disabled,'actual rendered editor action is enabled');h.win.qaClick=node;try{return vm.runInContext('(function(){'+node.getAttribute('onclick')+'}).call(qaClick)',h.win);}finally{delete h.win.qaClick;}}
// Supply normal DOM sibling navigation to the lightweight shared DOM fixture.
if(!Object.getOwnPropertyDescriptor(Element.prototype,'nextElementSibling'))Object.defineProperty(Element.prototype,'nextElementSibling',{get(){const rows=this.parentElement?.children||[];return rows[rows.indexOf(this)+1]||null;}});

for(const id of ids){
 const h=harness(),before=library(h),category=h.M.get('lead',h.scope);category.fields=category.fields.filter(ref=>ref.fieldId!==id);
 check(h.M.save(category,h.scope).ok,id+': removing the single default reference saves');
 check(!refs(h).some(ref=>ref.fieldId===id)&&h.M.catalog(h.scope).ok,id+': current catalog reads without the removed reference');
 const bytes=h.storage.get(h.M.storageKey);check(!reload(h).get('lead',h.scope).fields.some(ref=>ref.fieldId===id)&&h.storage.get(h.M.storageKey)===bytes,id+': module reload neither adds it back nor writes storage');
 check(library(h)===before&&h.M.getField(id,h.scope),id+': reusable library definitions remain intact');
}
for(const keepMapping of [true,false]){
 const h=harness(),before=library(h),category=h.M.get('lead',h.scope);category.fields=keepMapping?category.fields.filter(ref=>!ids.includes(ref.fieldId)):[];
 check(h.M.save(category,h.scope).ok,(keepMapping?'Mapping-only':'zero-fields')+' category saves');
 const bytes=h.storage.get(h.M.storageKey),M=reload(h);check(M.catalog(h.scope).ok&&M.get('lead',h.scope).fields.length===(keepMapping?1:0),'reload accepts the exact chosen references');
 check(h.storage.get(h.M.storageKey)===bytes&&library(h)===before,'reading the smaller category never resets references or deletes library fields');
 category.fields=ids.map((fieldId,index)=>({fieldId,enabled:index%2===0,required:index===0}));if(keepMapping)category.fields.push({fieldId:'mappingIntendedSeries',enabled:true,required:false});
 check(M.save(category,h.scope).ok&&JSON.stringify(M.get('lead',h.scope).fields)===JSON.stringify(category.fields),'all retained default definitions can be re-added with independent flags and order');
}
{
 const h=harness(),P=h.win.BusinessConfiguration,before=library(h);P.render('category');P.open('category','lead');
 check(!h.document.getElementById('business-configuration-editor').textContent.includes('六个预置字段须保留'),'category editor no longer tells operators to retain all six');
 for(const id of ids){
  const card=h.document.getElementById('business-category-card-'+id);execute(h,card?.querySelector('.business-remove-field'));
  check(!h.document.getElementById('business-category-card-'+id),'actual removal updates the category editor for '+id);
  check(h.document.getElementById('business-category-field-picker').children.some(option=>option.value===id),'removed '+id+' immediately becomes available to re-add');
 }
 P.save();check(refs(h).length===1&&refs(h)[0].fieldId==='mappingIntendedSeries','actual editor saves the category with only Mapping');
 P.render('category');P.open('category','lead');
 for(const id of ids){const picker=h.document.getElementById('business-category-field-picker');picker.value=id;P.selectCategoryField(id);P.addCategoryField();check(!!h.document.getElementById('business-category-card-'+id),'actual picker can re-add '+id);}
 P.save();check(refs(h).length===7&&ids.every(id=>refs(h).some(ref=>ref.fieldId===id)),'actual editor saves every re-added default reference');
 check(library(h)===before,'UI removal and re-addition never mutates reusable definitions');
}
{
 const h=harness(),M=h.M;let category=M.get('lead',h.scope);category.fields.forEach(ref=>{if(ids.includes(ref.fieldId))ref.required=true;});check(M.save(category,h.scope).ok,'prepare an old call with all six required statistics');
 const input={plannedVisitAt:'2026-10-22T09:30',plannedStoreName:'原通话保留门店'};
 for(const id of ids.slice(0,4))input[id]=M.getField(id,h.scope).options[0].id;
 h.mount({callId:'before-category-removal'},input);const oldCall=h.call,oldValues=h.values,version=JSON.stringify(oldCall.businessFormVersion);
 category=M.get('lead',h.scope);category.fields=category.fields.filter(ref=>!ids.includes(ref.fieldId));check(M.save(category,h.scope).ok,'administrator removes all six from current classification');
 check(ids.every(id=>M.fields('lead',oldCall).some(field=>field.id===id&&field.required))&&JSON.stringify(oldCall.businessFormVersion)===version,'already-started call keeps its six fields and original requiredness');
 check(ids.every(id=>h.document.getElementById('seat-followup-'+id)),'already-open real form keeps its original controls');
 const oldSaved=h.C.save(oldCall,oldValues,{wrapping:true,expectedVersion:''});check(oldSaved.ok,'old bound call completes after the administrator removal');
 for(const id of ids){check(oldSaved.values[id]===input[id],'old canonical save retains '+id);check(oldSaved.values.businessFieldSnapshot.fields.some(field=>field.fieldId===id&&field.value===input[id]),'old saved manifest retains '+id);}
 check(h.C.detail(oldSaved.values,oldCall).includes('原通话保留门店'),'old record detail still displays the original store text');
 h.mount({callId:'after-category-removal'});check(ids.every(id=>!h.document.getElementById('seat-followup-'+id))&&M.fields('lead',h.call).length===1,'next call has no removed controls or required rules');
 check(h.C.validate(h.values,h.call).ok,'next call can save without any of the removed required values');
 for(const id of ids)check(h.C.update(h.values,h.call,id,'malicious-hidden-value')===null,'normal field update cannot fill absent '+id);
 const injected={...h.values,...Object.fromEntries(ids.map(id=>[id,'malicious-hidden-value']))};
 const nextSaved=h.C.save(h.call,injected,{wrapping:true,expectedVersion:''});check(nextSaved.ok,'real save accepts valid current form while ignoring raw injected removed values');
 for(const id of ids){check(!Object.hasOwn(nextSaved.values,id),'canonical values filter removed '+id);check(!Object.hasOwn(nextSaved.values.businessFieldSnapshot.values,id)&&!nextSaved.values.businessFieldSnapshot.fields.some(field=>field.fieldId===id),'callback values and manifest exclude removed '+id);}
 const callback=M.callbackSnapshot(nextSaved.values,h.call);check(ids.every(id=>!Object.hasOwn(callback.values,id)&&!callback.fields.some(field=>field.fieldId===id)),'callback built from canonical save has no removed references or values');
 category=M.get('lead',h.scope);category.fields=[];check(M.save(category,h.scope).ok,'administrator can also remove the last current reference');h.mount({callId:'after-empty-category'});
 check(h.form().textContent.includes('此业务分类暂未配置补充字段'),'real zero-fields form explains that no supplemental fields are configured');
 const emptySaved=h.C.save(h.call,{...h.values,...input},{wrapping:true,expectedVersion:''});check(emptySaved.ok&&emptySaved.values.businessFieldSnapshot.fields.length===0&&ids.every(id=>!Object.hasOwn(emptySaved.values,id)),'real zero-fields save has an empty manifest and drops injected prior business fields');
}
{
 const h=harness(),M=h.M;let category=M.get('lead',h.scope);category.fields=[];check(M.save(category,h.scope).ok,'prepare unreferenced library definitions for protection checks');
 for(const id of ids){const field=M.getField(id,h.scope),original=JSON.stringify(field);
  check(!M.saveField({...field,type:field.type==='number'?'text':'number'},h.scope).ok,'unreferenced '+id+' retains its stable input type');
  if(field.type==='select')check(!M.saveField({...field,options:field.options.slice(1)},h.scope).ok,'unreferenced '+id+' retains its stable option IDs and meanings');
  check(JSON.stringify(M.getField(id,h.scope))===original,'rejected library changes preserve '+id);
  check(M.deleteField(id,h.scope).ok&&!M.getField(id,h.scope)&&M.getField(id,h.call),'unreferenced '+id+' can leave the library while the captured call keeps its definition');
 }
 const mapping=M.getField('mappingIntendedSeries',h.scope);check(!M.saveField({...mapping,type:'select',options:[]},h.scope).ok&&M.deleteField(mapping.id,h.scope).ok&&M.getField(mapping.id,h.call),'Mapping type protection remains while unreferenced deletion preserves the current call snapshot');
}
{
 const h=harness({generic:true}),M=h.M;let category=M.get('lead',h.scope);category.fields=category.fields.filter(ref=>ref.fieldId==='genericStore');
 const before=h.storage.get(M.storageKey);check(!M.save(category,h.scope).ok&&h.storage.get(M.storageKey)===before,'a required generic upstream cannot be removed with the six presets');
 const store=M.getField('genericStore',h.scope);store.parameterBinding.required=false;check(M.saveField(store,h.scope).ok&&M.save(category,h.scope).ok,'an optional dependency can omit its upstream without requiring the statistics');
 const source=M.getField('genericSeries',h.scope);source.useQueryConditions=true;source.depends=['genericStore'];source.parameterBinding={parameterName:'seriesCode',sourceValueKey:'code',required:true};check(!M.saveField(source,h.scope).ok,'removing presets does not relax capability or cycle validation');
 const stored=JSON.parse(h.storage.get(M.storageKey)),other={...copy(stored.scopes[0]),tenantId:'UNCHANGED_OTHER_TENANT'};stored.scopes.push(other);h.storage.set(M.storageKey,JSON.stringify(stored));
 category=M.get('lead',h.scope);category.fields=[];check(M.save(category,h.scope).ok,'current tenant can save an empty category in a multi-tenant bundle');
 check(JSON.stringify(JSON.parse(h.storage.get(M.storageKey)).scopes.find(row=>row.tenantId===other.tenantId))===JSON.stringify(other),'unrelated tenant definitions and category flags remain byte-equivalent');
 const bytes=h.storage.get(M.storageKey);check(!M.save(category,{...h.scope,tenantId:other.tenantId}).ok&&h.storage.get(M.storageKey)===bytes,'cross-tenant object authorization still rejects the same mutation');
 h.setValid(false);check(!M.save(category,h.scope).ok&&h.storage.get(M.storageKey)===bytes,'invalid current member permission still rejects edits');h.setValid(true);h.setAuthorized(false);check(!M.save(category,h.scope).ok&&h.storage.get(M.storageKey)===bytes,'live object authorization still rejects edits');
}
console.log(JSON.stringify({ok:true,assertions:passed,scope:'six preset references optional per category; persistent UI remove/re-add; unchanged library/Mapping protection; old-call/new-call canonical save and callback; tenant/dependency guards'}));
