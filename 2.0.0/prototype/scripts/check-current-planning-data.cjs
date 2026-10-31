/* Current planning data reset: actual built store, isolated local Mock storage. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {setup,success,plain,pick}=require('./check-four-node-model.cjs');
const root=path.resolve(__dirname,'..'),tests=[];
function check(name,run){try{run();tests.push({name,status:'pass'});}catch(error){tests.push({name,status:'fail',error:error.stack||error.message});}}
const resetKey=f=>f.s.key+':condition-first-reset-v1';
const read=f=>JSON.parse(f.b.localStorage.getItem(f.s.key));
function touch(f){success(f.s.templates(f.brand));return read(f);}
function seedBeforeReset(f,raw){f.b.localStorage.removeItem(resetKey(f));if(raw===null)f.b.localStorage.removeItem(f.s.key);else f.b.localStorage.setItem(f.s.key,raw);}
function assertEmptyCurrent(value){
  assert.equal(value.schema,4);assert.equal(value.revision,0);
  for(const key of ['templates','categories','records','batches','requests','deletedTemplateIds','contactPolicies'])assert.deepEqual(value[key],[],key);
  for(const key of ['legacyRefs','templateSnapshots','templateCleanup'])assert.equal(Object.hasOwn(value,key),false,key);
}
function oldLedger(schema=2){return {schema,revision:71,templates:[{templateId:'OLD-TEMPLATE',brandId:'OLD-BRAND',latestVersion:1,versions:[]}],categories:[{categoryId:'OLD-CATEGORY'}],records:[{recordId:'OLD-RECORD'}],batches:[{batchId:'OLD-BATCH'}],requests:[{requestId:'OLD-REQUEST',status:'unknown'}],deletedTemplateIds:['OLD-DELETED'],contactPolicies:[{tenantId:'OLD-TENANT'}]};}
function reattach(f){vm.runInContext(pick('/** 品牌共用业务流转'),f.b,{filename:'actual-built-current-store-reload'});f.s=f.b.BusinessFlowStore;}

check('empty storage creates schema4 with a confirmed one-time reset marker',()=>{
  const f=setup();seedBeforeReset(f,null);assertEmptyCurrent(touch(f));assert.equal(f.b.localStorage.getItem(resetKey(f)),'4');assert.equal(success(f.s.query({})).length,0);
});
check('schema1, schema2, schema3, broken JSON and broken old inner structures are discarded once without migration',()=>{
  for(const raw of [JSON.stringify(oldLedger(1)),JSON.stringify(oldLedger(2)),JSON.stringify(oldLedger(3)),'{broken old JSON',JSON.stringify({schema:2,records:'broken',templates:null})]){
    const f=setup();seedBeforeReset(f,raw);assertEmptyCurrent(touch(f));assert.equal(f.b.localStorage.getItem(resetKey(f)),'4');
    for(const retired of ['OLD-TEMPLATE','OLD-RECORD','OLD-REQUEST','OLD-BATCH'])assert(!f.b.localStorage.getItem(f.s.key).includes(retired));
    const bytes=f.b.localStorage.getItem(f.s.key);reattach(f);assertEmptyCurrent(touch(f));assert.equal(f.b.localStorage.getItem(f.s.key),bytes);
  }
});
check('the known previous marker3 resets schema3 to4 and an interrupted write preserves a valid schema4 retry',()=>{
  const f=setup(),storage=f.b.localStorage,set=storage.setItem;seedBeforeReset(f,JSON.stringify(oldLedger(3)));storage.setItem(resetKey(f),'3');
  storage.setItem=(key,value)=>{if(key===resetKey(f))throw Error('epoch marker write blocked');return set(key,value);};
  assert.equal(f.s.templates(f.brand).status,'failed');const bytes=storage.getItem(f.s.key),configuration=storage.getItem(f.b.CustomerBusiness.storageKey);assertEmptyCurrent(JSON.parse(bytes));assert.equal(storage.getItem(resetKey(f)),'3');
  storage.setItem=set;reattach(f);assertEmptyCurrent(touch(f));assert.equal(storage.getItem(resetKey(f)),'4');assert.equal(storage.getItem(f.s.key),bytes);assert.equal(storage.getItem(f.b.CustomerBusiness.storageKey),configuration);
});
check('valid schema4 without a marker only repairs the marker and preserves exact bytes and current bindings',()=>{
  const f=setup(),p=f.bindPlan(),id=f.imported('CURRENT-NO-MARKER');
  const raw=JSON.stringify(read(f),null,2),configuration=f.b.localStorage.getItem(f.b.CustomerBusiness.storageKey);
  seedBeforeReset(f,raw);reattach(f);const templates=success(f.s.templates(f.brand));
  assert(templates.some(row=>row.templateId===p.template.templateId));assert.equal(success(f.s.detail(id)).businessCode,'CURRENT-NO-MARKER');
  assert.equal(f.b.localStorage.getItem(f.s.key),raw);assert.equal(f.b.localStorage.getItem(f.b.CustomerBusiness.storageKey),configuration);assert.equal(f.b.localStorage.getItem(resetKey(f)),'4');
});
check('a failed reset marker write cannot report success or erase the schema4 ledger on retry',()=>{
  const f=setup();seedBeforeReset(f,JSON.stringify(oldLedger()));const storage=f.b.localStorage,set=storage.setItem;
  storage.setItem=(key,value)=>{if(key===resetKey(f))throw Error('marker write blocked');return set(key,value);};
  assert.equal(f.s.templates(f.brand).status,'failed');const bytes=storage.getItem(f.s.key),configuration=storage.getItem(f.b.CustomerBusiness.storageKey);
  assertEmptyCurrent(JSON.parse(bytes));assert.equal(storage.getItem(resetKey(f)),null);
  storage.setItem=set;reattach(f);assertEmptyCurrent(touch(f));assert.equal(storage.getItem(f.s.key),bytes);assert.equal(storage.getItem(f.b.CustomerBusiness.storageKey),configuration);assert.equal(storage.getItem(resetKey(f)),'4');
});
check('marker repair failure also preserves already-created current templates and business',()=>{
  const f=setup(),p=f.bindPlan(),id=f.imported('CURRENT-REPAIR');const storage=f.b.localStorage,bytes=storage.getItem(f.s.key),configuration=storage.getItem(f.b.CustomerBusiness.storageKey),set=storage.setItem;
  storage.removeItem(resetKey(f));storage.setItem=(key,value)=>{if(key===resetKey(f))throw Error('marker repair blocked');return set(key,value);};
  assert.equal(f.s.templates(f.brand).status,'failed');assert.equal(storage.getItem(f.s.key),bytes);assert.equal(storage.getItem(f.b.CustomerBusiness.storageKey),configuration);
  storage.setItem=set;reattach(f);assert(success(f.s.templates(f.brand)).some(row=>row.templateId===p.template.templateId));assert.equal(success(f.s.detail(id)).businessCode,'CURRENT-REPAIR');assert.equal(storage.getItem(f.s.key),bytes);assert.equal(storage.getItem(f.b.CustomerBusiness.storageKey),configuration);
});
check('a blocked ledger write leaves initialization unconfirmed and can be retried safely',()=>{
  const f=setup(),storage=f.b.localStorage,old=JSON.stringify(oldLedger()),set=storage.setItem;seedBeforeReset(f,old);
  storage.setItem=(key,value)=>{if(key===f.s.key)throw Error('ledger write blocked');return set(key,value);};
  assert.equal(f.s.templates(f.brand).status,'failed');assert.equal(storage.getItem(f.s.key),old);assert.equal(storage.getItem(resetKey(f)),null);
  storage.setItem=set;assertEmptyCurrent(touch(f));assert.equal(storage.getItem(resetKey(f)),'4');
});
check('after initialization malformed JSON, malformed current data and old schemas are rejected without any reset or write',()=>{
  for(const raw of ['{broken',JSON.stringify({schema:4,templates:'broken'}),JSON.stringify(oldLedger(2)),JSON.stringify(oldLedger(3)),JSON.stringify({schema:999,templates:[]})]){
    const f=setup();touch(f);f.b.localStorage.setItem(f.s.key,raw);const before=f.b.localStorage.dump();
    assert.equal(f.s.templates(f.brand).status,'failed');assert.equal(f.b.localStorage.dump(),before);
  }
});
check('unknown reset marker values are rejected rather than permitting arbitrary storage or a destructive reinitialization',()=>{
  for(const marker of ['2','future','{"schema":3}']){
    const f=setup();touch(f);f.b.localStorage.setItem(resetKey(f),marker);const before=f.b.localStorage.dump();
    assert.equal(f.s.templates(f.brand).status,'failed');assert.equal(f.b.localStorage.dump(),before);
  }
});
check('reset clears only route references and pending route requests while keeping category and field metadata',()=>{
  const f=setup(),p=f.bindPlan(),C=f.b.CustomerBusiness,key=C.storageKey,before=JSON.parse(f.b.localStorage.getItem(key)),bundle=before.brandScopes.find(row=>row.brandId===f.brand),category=bundle.types.find(row=>row.id==='lead');
  const retired={row:{...plain(category),id:'RETIRED-CATEGORY',label:'保留分类元数据',fields:[{fieldId:'FOLLOW-NOTE',enabled:true,required:false}],importFields:[],flowBinding:{main:{templateId:p.template.templateId,version:1}}},fields:[plain(bundle.fields.find(field=>field.id==='FOLLOW-NOTE'))],deletedAt:'2026-10-30T00:00:00Z',deletedBy:'ADMIN-HQ'};
  bundle.retiredTypes=[retired];bundle.sourceAliases=[{tenantId:f.hq,enterpriseId:'ENT-HQ'}];before.routingRequests=[{requestId:'OLD-ROUTE-PENDING',status:'unknown',templateId:p.template.templateId}];
  f.b.localStorage.setItem(key,JSON.stringify(before));const originalFields=plain(bundle.fields),originalReferences=plain(category.fields),originalImport=plain(category.importFields),aliases=plain(bundle.sourceAliases),retiredFields=plain(retired.fields);
  seedBeforeReset(f,JSON.stringify(oldLedger()));assertEmptyCurrent(touch(f));const after=JSON.parse(f.b.localStorage.getItem(key)),saved=after.brandScopes.find(row=>row.brandId===f.brand),lead=saved.types.find(row=>row.id==='lead');
  assert.equal(after.revision,before.revision+1);assert.deepEqual(saved.fields,originalFields);assert.deepEqual(lead.fields,originalReferences);assert.deepEqual(lead.importFields,originalImport);assert.equal(lead.label,category.label);assert.deepEqual(saved.sourceAliases,aliases);assert.deepEqual(saved.retiredTypes[0].fields,retiredFields);assert.equal(saved.retiredTypes[0].row.id,'RETIRED-CATEGORY');assert.equal(saved.retiredTypes[0].deletedAt,retired.deletedAt);
  for(const row of [lead,saved.retiredTypes[0].row])for(const field of ['flowBinding','flowBindingHistory','main','backup','mappings'])assert.equal(Object.hasOwn(row,field),false);
  assert.deepEqual(after.routingRequests,[]);assert.deepEqual(after.scopes,before.scopes);
});
check('unrelated organization, authentication, professional-call and resource keys stay byte-identical',()=>{
  const f=setup(),sentinels={'d-organization-sentinel':'ORG-KEEP','auth-unrelated-sentinel':'AUTH-KEEP','native-workbench-records-v1':'[{"callId":"NATIVE-KEEP"}]','native-resource-unrelated-sentinel':'RESOURCE-KEEP','ai-unrelated-sentinel':'AI-KEEP'};
  for(const [key,value] of Object.entries(sentinels))f.b.localStorage.setItem(key,value);
  seedBeforeReset(f,JSON.stringify(oldLedger()));assertEmptyCurrent(touch(f));for(const [key,value] of Object.entries(sentinels))assert.equal(f.b.localStorage.getItem(key),value,key);
});
check('new current templates, bindings and business survive repeated store loads after the one-time reset',()=>{
  const f=setup();seedBeforeReset(f,JSON.stringify(oldLedger()));touch(f);const p=f.bindPlan(),id=f.imported('AFTER-RESET'),bytes=f.b.localStorage.getItem(f.s.key),configuration=f.b.localStorage.getItem(f.b.CustomerBusiness.storageKey);
  for(let i=0;i<3;i++){reattach(f);touch(f);assert(success(f.s.templates(f.brand)).some(row=>row.templateId===p.template.templateId));assert.equal(success(f.s.detail(id)).businessCode,'AFTER-RESET');}
  assert.equal(f.b.localStorage.getItem(f.s.key),bytes);assert.equal(f.b.localStorage.getItem(f.b.CustomerBusiness.storageKey),configuration);assert.equal(f.b.localStorage.getItem(resetKey(f)),'4');
});
check('new current activity still captures immutable plan and follow-up snapshots',()=>{
  const f=setup();f.bindPlan();const id=f.imported('CURRENT-CHAIN');f.arrange(id);const seg=success(f.s.start(id,{}));f.finish(id,seg);success(f.s.saveResult(id,{segmentId:seg.segmentId,values:{'FOLLOW-NOTE':'当次填写'},providedFieldIds:['FOLLOW-NOTE']}));
  const before=success(f.s.detail(id)),content=JSON.stringify(before.rounds[0].segments[0].contentSnapshot),plan=JSON.stringify(before.run.planSnapshot);assert.equal(before.rounds[0].segments[0].contentSnapshot.values['FOLLOW-NOTE'],'当次填写');
  success(f.s.correctValues(id,{values:{'FOLLOW-NOTE':'当前有效值'},reason:'本次核实'}));reattach(f);const after=success(f.s.detail(id));assert.equal(after.followupValues['FOLLOW-NOTE'],'当前有效值');assert.equal(JSON.stringify(after.rounds[0].segments[0].contentSnapshot),content);assert.equal(JSON.stringify(after.run.planSnapshot),plan);assert.equal(read(f).schema,4);
});
const result={schema:'current-planning-data-regression@2',date:new Date().toISOString(),scope:'actual built schema4 store and explicit one-time discard; isolated Map storage; no user browser data writes',cloudSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'js/modules/cloud.bundle.js'))).digest('hex'),passed:tests.filter(test=>test.status==='pass').length,failed:tests.filter(test=>test.status==='fail').length,tests};
const out=process.argv.indexOf('--output');if(out>=0)fs.writeFileSync(path.resolve(process.argv[out+1]),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=result.failed?1:0;
