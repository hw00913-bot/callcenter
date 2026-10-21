/* Actual dictionary + Mapping adapter + legacy DCC runtime; no provider calls. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(process.argv[2]||path.join(__dirname,'..'));
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
const scope={tenantId:'MAP-TENANT-A',enterpriseId:'MAP-ENTERPRISE'},other={tenantId:'MAP-TENANT-B',enterpriseId:'MAP-ENTERPRISE'};
const state={...scope,accountId:'MAP-ADMIN',sessionId:'MAP-SESSION',activeDomain:'CLOUD_CONTACT_CENTER'};
const storage=new Map(),events=[],nodes={};let valid=true,authorized=true,html='';
const c={console,Promise,crypto:require('node:crypto').webcrypto,setTimeout:fn=>setTimeout(fn,1),clearTimeout,document:{getElementById:id=>nodes[id]||null},
 localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))},fetch(){throw Error('No network');},XMLHttpRequest:function(){throw Error('No network');},
 CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},addEventListener(){},dispatchEvent:event=>events.push(event),showToast(){},
 AppState:{get:()=>state,isReady:()=>true,isSuper:()=>true,canMenu:()=>true,effectiveAccess:()=>({valid,roleCode:'SUPER_ADMIN'}),authorizeObject:(_,row)=>authorized&&row.tenantId===state.tenantId&&row.enterpriseId===state.enterpriseId},
 PlatformUI:{escape:value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),openLayer:(_id,content)=>{html=content;},closeLayer(){}},
 CloudCallData:{demoSwitchEnabled:true,instances:[{enterpriseId:scope.enterpriseId,status:'RUNNING'}],tenants:[scope,other].map(row=>({...row,name:row.tenantId,status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']})),calls:[]}};
c.window=c;vm.createContext(c);
const load=(file,target=c)=>vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),target,{filename:file});
for(const file of ['mock/dcc-business-data.js','js/components/dcc-business-adapter.js','mock/mapping-series-data.js','js/components/mapping-series-adapter.js','js/components/business-data.js','config/customer-intent-profile.js','js/components/customer-business.js'])load(file);
const B=c.BusinessData,id='d-mapping-series',codes=result=>Array.from(result.items,row=>row.code).join(',');
(async()=>{
 check(B.capability('mapping-series')?.kind==='series'&&B.capability('mapping-series').selectionMode==='single','separate Mapping capability declares a single-series result');
 check(B.capability('mapping-series').returnFields.map(row=>row.key).join(',')==='code,name,relation_id,car_state,media_car_series_id','registered source attributes preserve original Mapping values without a guessed energy type');
 check(B.entry(id)?.capabilityId==='mapping-series'&&B.available(id,scope),'new preset entry is available only through current scope authorization');
 check(!B.available(id,other),'a grant does not bypass current object authorization');
 check(storage.get(B.storageKey)===undefined,'reading new preset entries does not write dictionary storage');
 const normal=await B.querySeries(id,scope);
 check(normal.ok&&normal.complete&&codes(normal)==='910001,910002,910003','actual capability routes to its own official-ID Mapping results');
 check(normal.meta.request.media_id===10&&normal.meta.request.car_state===1&&Object.keys(normal.meta.request).length===2,'default field query explicitly sends media/state and no invented brand/energy filters');
 check(storage.get(B.storageKey)===undefined,'successful simulated queries do not persist dictionary defaults');
 const current=c.CustomerBusiness.catalog(scope),field=current.fields.find(row=>row.dictionaryId===id);
 check(field?.type==='interface'&&field.id===c.CustomerIntentProfile.seriesFieldId,'actual current profile projects the Mapping field');
 check(B.references(id).some(row=>row.fieldId===field.id&&row.categoryLabels.includes('线索类')),'dictionary references include the actual projected profile even before configuration is persisted');
 check(B.capability('series').id==='series'&&B.capability('stores').id==='stores','retained standard/DCC capabilities keep their existing identities');
 const standard=await B.querySeries('d-series',scope),legacyToken=B.sourceVersion('d-series',scope),mappingToken=B.sourceVersion(id,scope);
 check(standard.ok&&codes(standard)==='NEV-A,NEV-B,ICE-A','legacy standard series remains unchanged');
 B.env.query='failure';check((await B.querySeries(id,scope)).ok&&!(await B.querySeries('d-series',scope)).ok,'standard error mode cannot override the new capability');
 B.env.source='dcc';B.env.dccScenario='page_failure';
 check((await B.querySeries(id,scope)).ok&&codes(await B.querySeries(id,scope))==='910001,910002,910003','DCC source and page scenario cannot replace Mapping series');
 check(B.sourceVersion(id,scope)===mappingToken,'unrelated DCC mode changes do not change the Mapping source epoch');
 B.env.mappingScenario='conflict';const dccToken=B.sourceVersion('d-store',scope);
 check(!(await B.querySeries(id,scope)).ok,'Mapping conflict is an explicit error');
 B.env.mappingScenario='normal';check(B.sourceVersion('d-store',scope)===dccToken,'Mapping scenario changes do not invalidate unrelated DCC tokens');
 B.env.source='unknown';check((await B.querySeries(id,scope)).ok&&!(await B.querySeries('d-series',scope)).ok,'Mapping routing remains capability-owned even when a retained demo source is unavailable');
 B.env.source='standard';B.env.query='normal';
 for(const scenario of ['empty','failure','partial','conflict','malformed']){
  B.env.mappingScenario=scenario;const result=await B.queryOptions(id,{},scope);
  check(scenario==='empty'?result.ok&&result.complete&&!result.items.length:!result.ok&&!result.complete&&!result.items.length,'Mapping '+scenario+' preserves complete-empty versus error semantics');
 }
 B.env.mappingScenario='normal';const beforeEpoch=B.sourceVersion(id,scope);B.env.mappingScenario='empty';B.env.mappingScenario='normal';
 check(B.sourceVersion(id,scope)!==beforeEpoch,'Mapping scene round trips never revive a previous source token');
 B.env.mappingScenario='delay';const pendingScene=B.querySeries(id,scope);B.env.mappingScenario='normal';B.env.mappingScenario='delay';const sceneExpired=await pendingScene;
 check(!sceneExpired.ok&&!sceneExpired.complete&&!sceneExpired.items.length,'scene epoch discards in-flight results after a round trip');
 B.env.mappingScenario='delay';const unchangedToken=B.sourceVersion(id,scope),pendingGlobal=B.querySeries(id,scope);B.env.source='dcc';B.env.dccScenario='empty';B.env.source='standard';
 check((await pendingGlobal).ok&&B.sourceVersion(id,scope)===unchangedToken,'unrelated source changes leave a valid Mapping request intact');
 B.env.mappingScenario='normal';const pendingSession=B.querySeries(id,scope);state.sessionId='MAP-SESSION-NEW';check(!(await pendingSession).ok,'identity-session changes invalidate delayed Mapping results');
 const pendingPermission=B.querySeries(id,scope);valid=false;check(!(await pendingPermission).ok,'current permissions are checked after raw I/O');valid=true;
 const pendingObject=B.querySeries(id,scope);authorized=false;check(!(await pendingObject).ok,'object authorization remains live');authorized=true;
 const standardBeforeGrant=B.sourceVersion('d-series',scope),mapBeforeGrant=B.sourceVersion(id,scope);
 check(B.setEnabled(id,false).ok&&!B.available(id,scope),'superadmin can disable the Mapping entry');
 check(!(await B.querySeries(id,scope)).ok&&B.sourceVersion(id,scope)!==mapBeforeGrant,'disabled Mapping source cannot return new options');
 check(B.setEnabled(id,true).ok&&B.sourceVersion(id,scope)!==mapBeforeGrant,'reenabling the entry creates a new source token');
 check(B.sourceVersion('d-series',scope)===standardBeforeGrant,'Mapping dictionary changes leave standard source versions untouched');
 check(B.setTenants(id,[other.tenantId]).ok&&!B.available(id,scope),'tenant revocation immediately makes Mapping unavailable');
 check(B.setTenants(id,[scope.tenantId,other.tenantId]).ok&&B.available(id,scope),'superadmin can restore the intended tenant grant');
 const pendingGrant=B.querySeries(id,scope);B.setEnabled(id,false);B.setEnabled(id,true);check(!(await pendingGrant).ok,'revoke/restore cannot revive a pending Mapping response');
 const stableNameToken=B.sourceVersion(id,scope);check(B.rename(id,'管理员自定车系接口名').ok&&B.sourceVersion(id,scope)===stableNameToken,'entry display-name changes preserve stable capability identity');
 check(!B.update(id,{capabilityId:'series'}).ok,'existing Mapping entry capability cannot be changed to the legacy series source');
 check(B.references(id).some(row=>row.fieldId===field.id),'profile references remain visible after dictionary changes');
 for(const params of [{media_id:11},{brand_id:100},{is_nev_car_type_flag:0}]){const unsupported=await B.queryOptions(id,params,scope);check(!unsupported.ok&&!unsupported.items.length&&unsupported.message.includes('暂无模拟资料'),'unsupported synthetic optional scope fails explicitly instead of ignoring the query');}
 const zero=await B.queryOptions(id,{media_id:10,car_state:0},scope);check(zero.ok&&codes(zero)==='910004'&&zero.meta.request.car_state===0,'explicit request zero is preserved through the actual BusinessData boundary');
 for(const params of [{media_id:null},{car_state:null},{media_id:'x'},{seriesCode:'910001'},{media_car_series_id:'DEMO-MEDIA-SERIES-A'}])check(!(await B.queryOptions(id,params,scope)).ok,'invalid or guessed filters cannot cross the capability boundary');
 const adapter=c.MappingSeriesAdapter;c.MappingSeriesAdapter=undefined;check(!(await B.querySeries(id,scope)).ok,'missing adapter fails without returning a legacy source');c.MappingSeriesAdapter=adapter;
 B.env.source='standard';B.env.query='normal';B.env.mappingScenario='normal';B.openDemo();
 check(html.includes('id="business-demo-mapping-case"')&&html.includes('与标准／DCC场景独立')&&html.includes('有映射的车系'),'public demo exposes its own Mapping scenario and source coverage boundary');
 check(!html.includes('name="media_id"')&&!html.includes('name="car_state"'),'dictionary/demo operators are not asked to fill technical request settings');
 nodes['business-demo-source']={value:'standard'};nodes['business-demo-query']={value:'normal'};nodes['business-demo-dcc-case']={value:'normal'};nodes['business-demo-save']={checked:false};nodes['business-demo-mapping-case']={value:'empty'};
 const classicBeforeApply=B.sourceVersion('d-series',scope),eventsBefore=events.length;
 check(B.applyDemo()===true&&B.env.mappingScenario==='empty','public Mapping scenario can be applied');
 check(events.length===eventsBefore+1&&events.at(-1).detail.entryId===id&&events.at(-1).detail.mappingScenarioChanged,'Mapping-only apply publishes a targeted source change');
 check(B.sourceVersion('d-series',scope)===classicBeforeApply,'Mapping-only public apply preserves standard epoch');
 check((await B.querySeries(id,scope)).items.length===0,'the dedicated public empty scene controls Mapping results');
 nodes['business-demo-mapping-case'].value='NOT-REGISTERED';check(B.applyDemo()===false&&B.env.mappingScenario==='empty','unknown Mapping demo scene is rejected without applying it');
 nodes['business-demo-mapping-case'].value='normal';B.applyDemo();nodes['business-demo-code']={value:'910001'};nodes['business-demo-name']={value:'映射车系上游改名（模拟）'};const beforeRename=B.sourceVersion(id,scope);
 check(B.renameUpstreamFromDemo()===true&&B.sourceVersion(id,scope)!==beforeRename,'simulated Mapping name changes invalidate old in-flight data');
 const renamed=await B.querySeries(id,scope);check(renamed.items[0].name==='映射车系上游改名（模拟）'&&renamed.items[0].sourceValues.name===renamed.items[0].name,'upstream rename preserves normalized/source name consistency');
 const saved=JSON.parse(storage.get(B.storageKey)),preset=saved.entries.find(row=>row.id===id);preset.enabled=false;preset.tenantIds=[];preset.name='保留的停用接口名称';storage.set(B.storageKey,JSON.stringify(saved));const beforeRead=storage.get(B.storageKey);
 check(B.entry(id).enabled===false&&B.entry(id).tenantIds.length===0&&B.entry(id).name===preset.name,'an existing Mapping preset keeps its saved disabled state, tenant grants and name');
 check(storage.get(B.storageKey)===beforeRead,'read projection never rewrites an existing preset');
 saved.entries=saved.entries.filter(row=>row.id!==id);saved.entries[0].name='Mapping意向车系';storage.set(B.storageKey,JSON.stringify(saved));const missingBytes=storage.get(B.storageKey),projected=B.entry(id);
 check(projected?.capabilityId==='mapping-series'&&B.entries().filter(row=>row.id===id).length===1,'missing preset is projected once without resetting the old dictionary');
 check(projected.name!=='Mapping意向车系'&&B.entry('d-series').name==='Mapping意向车系','new preset naming avoids an existing operator-defined name collision');
 check(storage.get(B.storageKey)===missingBytes,'missing-preset projection also stays read-only until an explicit save');
 const collision=JSON.parse(missingBytes);collision.entries.push({id,capabilityId:'series',name:'错误同ID来源',tenantIds:[scope.tenantId],enabled:true,sourceRevision:0,tenantRevisions:{}});storage.set(B.storageKey,JSON.stringify(collision));
 check(!B.available(id,scope)&&!(await B.querySeries(id,scope)).ok,'a reserved preset ID cannot silently return legacy data under a different capability');
 storage.set(B.storageKey,'MALFORMED');check(!B.available(id,scope)&&B.entries().length===0&&!(await B.querySeries(id,scope)).ok&&storage.get(B.storageKey)==='MALFORMED','corrupt existing dictionary fails closed without replacing its bytes');
 check(legacyToken!==B.sourceVersion('d-series',scope),'corrupt data cannot keep a formerly valid source token');
 console.log(JSON.stringify({passed,scope:'Mapping capability routing, projected dictionary references, independent demo epochs, live authorization and legacy standard/DCC isolation'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
