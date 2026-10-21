'use strict';
const assert=require('node:assert/strict');
const {setup,copy}=require('./fixtures/configuration-usage.cjs');
let assertions=0;
const check=(value,message)=>{assert.ok(value,message);assertions++;};
{
 const h=setup({page:true}),B=h.B;
 check(!B.catalogState().explicit,'start with an unpersisted default dictionary');
 check(B.capabilityEditReview('d-mapping-series').refs.some(ref=>ref.fieldId==='mappingIntendedSeries'),'implicit current default field is a real reference before any configuration save');
 check(!B.update('d-mapping-series',{capabilityId:'stores'}).ok,'implicit referenced default cannot be reassigned');
 check(!B.catalogState().explicit,'checking an implicit reference never persists configuration');
 h.render();h.w.Pages['business-data-dictionary'].open('d-mapping-series');
 check(h.document.getElementById('business-data-capability').disabled,'fresh actual editor locks the same referenced default shown in its list');
}
{
 const h=setup(),B=h.B;
 check(!B.create({name:'   ',capabilityId:'series',tenantIds:[]}).ok,'blank name rejected');
 const a=h.source('  Global Series  '),b=h.source('另一条同能力接口');
 check(a.name==='Global Series','trimmed name persisted');
 check(a.capabilityId===b.capabilityId&&a.id!==b.id,'same ability allows distinct independently named entries');
 check(!B.create({name:'global SERIES',capabilityId:'stores',tenantIds:[]}).ok,'global case-insensitive duplicate rejected even across abilities');
 check(!B.update(b.id,{name:' GLOBAL series '}).ok,'rename follows trim and global uniqueness');
 check(B.create({name:'名'.repeat(60),capabilityId:'series',tenantIds:[]}).ok,'60-character name accepted');
 check(!B.create({name:'名'.repeat(61),capabilityId:'series',tenantIds:[]}).ok,'61-character name rejected');
 check(B.setTenants(b.id,[]).ok&&B.entry(a.id).tenantIds.length===1,'same ability entries have independent grants');
 check(B.setEnabled(b.id,false).ok&&B.entry(a.id).enabled,'same ability entries have independent status');
 const version=B.sourceVersion(a.id,h.scope),id=a.id,oldOther=JSON.stringify(B.entry(b.id));
 check(B.update(id,{capabilityId:'stores',name:'改为门店取数'}).ok,'unused entry can change ability');
 check(B.entry(id).id===id&&B.entry(id).capabilityId==='stores','stable identity preserved');
 check(B.sourceVersion(id,h.scope)!==version,'source revision changes after ability replacement');
 check(JSON.stringify(B.entry(b.id))===oldOther,'ability edit does not mutate another entry');
 h.load('js/components/business-data.js');check(h.w.BusinessData.entry(id).capabilityId==='stores','ability replacement survives module reload');
}
for(const retained of ['field','history','archive']){
 const h=setup(),a=h.source();
 if(retained==='field')h.field('ref',a.id);
 if(retained==='history')h.w.CloudCallData.calls.push(h.history('DICT-HISTORY','unusedCategory',h.manifest('oldField',a.id)));
 if(retained==='archive'){
  const f=h.field('archived',a.id),cat=h.category('archivedCategory',[f.id]);check(h.M.deleteCategory(cat.id,h.scope).ok,'category is archived');
 }
 const old=h.storage.get(h.B.storageKey);
 check(!h.B.update(a.id,{capabilityId:'stores'}).ok,'ability fixed for '+retained+' reference');
 check(h.storage.get(h.B.storageKey)===old,'rejected edit preserves bytes for '+retained);
 check(h.B.rename(a.id,'仅修改名称 '+retained).ok,'reference still allows ordinary rename for '+retained);
}
{
 const h=setup(),a=h.source();h.storage.set(h.M.storageKey,'broken-json');
 const before=h.storage.get(h.B.storageKey);check(!h.B.update(a.id,{capabilityId:'stores'}).ok,'unknown usage fails closed');
 check(h.storage.get(h.B.storageKey)===before,'unknown usage does not change dictionary');
}
for(const race of ['new-reference','identity','write-then-throw','foreign-write']){
 const h=setup(),a=h.source(),before=h.storage.get(h.B.storageKey),write=h.w.localStorage.setItem;let injected=false,foreign='';
 h.w.localStorage.setItem=(key,value)=>{const result=write(key,value);if(key===h.B.storageKey&&!injected){injected=true;
  if(race==='new-reference')h.field('arrivedDuringSave',a.id);
  if(race==='identity')h.state.sessionId='CHANGED-ACTOR';
  if(race==='write-then-throw')throw Error('ack lost after write');
  if(race==='foreign-write'){const data=JSON.parse(value);data.revision++;foreign=JSON.stringify(data);h.storage.set(key,foreign);}
 }return result;};
 check(!h.B.update(a.id,{capabilityId:'stores'}).ok,'incomplete replacement rejected after '+race);
 check(h.storage.get(h.B.storageKey)===(race==='foreign-write'?foreign:before),'rollback only self-owned write after '+race);
}
{
 const h=setup({page:true}),P=h.w.Pages['business-data-dictionary'],a=h.source();h.render();P.open(a.id);
 check(!h.document.getElementById('business-data-capability').disabled,'unused editor enables ability selection');
 h.document.getElementById('business-data-capability').value='stores';h.field('arrivedWhileEditing',a.id);
 h.document.getElementById('business-data-form').reportValidity=()=>true;
 check(P.save()===false,'reference added after opening prevents actual UI save');
 check(h.document.getElementById('business-data-capability').value==='stores'&&h.B.entry(a.id).capabilityId==='series','failed UI edit retains input and original binding');
 P.close();P.open(a.id);check(h.document.getElementById('business-data-capability').disabled,'reopening shows referenced ability locked');
}
{
 const h=setup(),lead=h.M.get('lead',h.scope);lead.fields=[];
 check(h.M.save(lead,h.scope).ok&&h.M.deleteField('mappingIntendedSeries',h.scope).ok,'remove actual default reference and definition');
 check(h.B.update('d-mapping-series',{capabilityId:'stores'}).ok,'unused preset entry follows the same ability-edit rule');
 check(h.B.catalogState().ok&&h.B.entry('d-mapping-series').capabilityId==='stores','reassigned preset stays readable');
 const stored=JSON.parse(h.storage.get(h.M.storageKey));stored.scopes=[];h.storage.set(h.M.storageKey,JSON.stringify(stored));
 check(h.M.catalog(h.scope).ok&&!h.M.mappingSeriesField(h.scope)&&h.M.get('lead',h.scope).fields.length===6,'fresh scopes do not create a Mapping field bound to a store capability');
}
console.log(JSON.stringify({passed:assertions,scope:'confirmed dictionary naming, same-ability entries, unused ability edit, retained references, editor races and atomic rollback'}));
