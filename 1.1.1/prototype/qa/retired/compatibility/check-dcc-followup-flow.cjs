/* Local component integration of the DCC v2 structure simulation. DOM and workbench bridge are test environment shells; no browser or production-contract assertions. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(process.argv[2] || path.join(__dirname,'..'));
let count=0;
const check=(value,message)=>{assert.ok(value,message);count++;};
const plain=value=>JSON.parse(JSON.stringify(value));
const equal=(value,wanted,message)=>{assert.deepStrictEqual(plain(value),wanted,message);count++;};
const key=(code,type='NEV')=>JSON.stringify([type,code]);
const seriesCodes={nev:'DCC_DEMO_SERIES_N7',iceA:'DCC_DEMO_SERIES_ICE_A',iceB:'DCC_DEMO_SERIES_ICE_B'};
const nevStoreCodes=['DCC_DEMO_STORE_001','DCC_DEMO_STORE_002'],iceStoreCodes=['DCC_DEMO_STORE_004','DCC_DEMO_STORE_005','DCC_DEMO_STORE_006'];
function harness(){
 const scope={tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240'},state={...scope,accountId:'DCC_FLOW_AGENT',sessionId:'DCC_FLOW_SESSION',activeDomain:'CLOUD_CONTACT_CENTER'};
 const storage=new Map(),listeners=new Map(),nodesById={},events=[],notices=[];
 let nodes=[],call=null,values=null,owner=null,emptyPageResponse=false;
 const w={console,structuredClone,Date,Map,Set,JSON,Object,String,Array,Number,Promise,
  crypto:require('node:crypto').webcrypto,
  setTimeout:fn=>setTimeout(fn,1),clearTimeout,
  fetch(){throw Error('external network prohibited');},XMLHttpRequest:function(){throw Error('external network prohibited');},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
  document:{querySelectorAll:selector=>selector==='[data-interface-prefix]'?nodes:[],getElementById:id=>nodesById[id]||null},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
  dispatchEvent(event){events.push(event);for(const fn of listeners.get(event.type)||[])fn(event);},
  CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
  AppState:{get:()=>({...state}),isReady:()=>true,isSuper:()=>true,canMenu:()=>true,effectiveAccess:()=>({roleCode:'SUPER_ADMIN',valid:true}),authorizeObject:(_,object)=>object.tenantId===scope.tenantId&&object.enterpriseId===scope.enterpriseId},
  PlatformUI:{escape:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),status:()=>'',closeLayer(){}},
  CustomerDirectory:{phoneOf:call=>call?.customerPhone,list:()=>[]},CallState:{view:call=>({answered:call.answered})},
  showToast(message,tone){notices.push({message,tone});}
 };
 w.window=w;vm.createContext(w);
 for(const file of ['mock/data.js','mock/dcc-business-data.js','js/components/dcc-business-adapter.js','js/components/business-data.js','js/components/customer-business.js','js/components/business-interface-field.js','js/components/customer-followup.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),w,{filename:file});
 // Test I/O boundary only: reuse the fixture's complete empty raw response.
 // Profile, declared scenario, source version and all business algorithms stay unchanged.
 const originalFixture=w.DccBusinessMock;
 w.DccBusinessMock={...originalFixture,page:(input,scenario,scope)=>originalFixture.page(input,emptyPageResponse?'empty':scenario,scope)};
 w.CloudCallData.demoSwitchEnabled=true;
 const B=w.BusinessData,M=w.CustomerBusiness,F=w.BusinessInterfaceField,C=w.CustomerFollowup;
 w.AgentWorkbench={setFollowup(id,value){const next=C.update(values,call,id,value);assert.ok(next,'real followup update accepts registered write');values=next;}};
 function mount(id,documentId='DCC_FLOW_DOC'){
  if(owner)owner.isConnected=false;
  call={...scope,callId:id,customerPhone:'13800000911',externalDocumentId:documentId,businessType:'lead',accountId:state.accountId,callSource:'NATIVE_WORKBENCH',processingStatus:'待填写',endedAt:'2026-10-17 12:00:00',direction:'呼出',callType:'人工外呼',answered:true,intentionSeriesCode:'RAW_IMPORT_SERIES',intentionStoreCode:'RAW_IMPORT_STORE'};
  w.CloudCallData.calls.push(call);values=C.empty(call);owner={isConnected:true};
  nodes=M.fields('lead',call).filter(f=>f.type==='interface').map(f=>({isConnected:true,dataset:{interfacePrefix:'dcc-flow',interfaceField:f.id,interfaceCall:C.identity(call)},parentElement:owner,closest:selector=>selector==='.customer-followup-form'?owner:null,querySelector:()=>null,set outerHTML(html){this.html=html;}}));
  F.register('dcc-flow',call,values,'AgentWorkbench.setFollowup');return call;
 }
 async function pickSeries(code=seriesCodes.nev){const result=await F.query('dcc-flow','intendedSeries');check(result.ok&&result.complete,'real DCC series directory query complete');const item=result.items.find(row=>row.code===code);check(!!item&&F.choose('dcc-flow','intendedSeries',key(code,item.type)),'single series selected through public component');return result;}
 function setScenario(scenario){nodesById['business-demo-source']={value:'dcc'};nodesById['business-demo-query']={value:'dcc'};nodesById['business-demo-dcc-case']={value:scenario};nodesById['business-demo-save']={checked:false};check(B.applyDemo()===true,'public demo applies scenario '+scenario);}
 return{w,B,M,F,C,scope,storage,mount,pickSeries,setScenario,setEmptyPageResponse:value=>{emptyPageResponse=value===true;},get call(){return call;},get values(){return values;},queryStores:()=>F.query('dcc-flow','intendedStore'),chooseStores:(codes,type='NEV')=>F.chooseMany('dcc-flow','intendedStore',codes.map(code=>key(code,type))),save:()=>C.save(call,values,{wrapping:true,expectedVersion:''})};
}
(async()=>{
 const h=harness();h.setScenario('normal');
 const first=h.mount('DCC_FLOW_FIRST');
 await h.pickSeries();
 const queried=await h.queryStores();check(queried.ok&&queried.complete&&queried.meta.pagesRead===2,'actual DCC adapter reads both NEV pages through field query');
 equal(queried.meta.requests,[{sourceType:'NEV',page:1,perPage:2},{sourceType:'NEV',page:2,perPage:2}],'NEV field query reaches the v2 sourceType/page/perPage boundary');
 equal(queried.items.map(row=>row.code),nevStoreCodes,'N7 retains its exact two-store relation');
 check(h.chooseStores(nevStoreCodes),'public field component accepts both complete NEV candidates');
 check(h.C.validate(h.values,h.call).ok,'actual followup validates DCC NEV multi-store collection');
 await h.pickSeries(seriesCodes.iceA);
 equal(h.values.intendedStore.map(row=>row.code),nevStoreCodes,'changing NEV to ICE keeps the old collection visible for correction');
 check(!h.C.validate(h.values,h.call).ok&&!h.save().ok,'old NEV stores cannot submit under an unqueried ICE condition');
 const iceA=await h.queryStores();
 check(iceA.ok&&iceA.complete&&iceA.meta.pagesRead===2,'ICE A reads its complete two-page source through actual components');
 equal(iceA.meta.requests,[{sourceType:'ICE',page:1,perPage:2},{sourceType:'ICE',page:2,perPage:2}],'ICE A field query reads only every page of its ICE source');
 equal(iceA.items.map(row=>row.code),iceStoreCodes,'ICE A returns every ICE store');
 check(iceA.items.every(row=>row.type==='ICE'&&row.seriesCodes.length===0&&row.seriesNames.length===0),'ICE candidates expose their source type without invented exact series relationships');
 equal(h.values.intendedStore.map(row=>row.code),nevStoreCodes,'completed ICE query preserves every mismatched NEV store for correction');
 check(h.values.intendedStore.every(row=>row.state==='pending'),'completed ICE query makes old NEV stores pending');
 check(!h.chooseStores(nevStoreCodes)&&!h.save().ok&&!first.customerFollowup&&!h.storage.has('customer-followup-v1'),'unavailable NEV candidates cannot be chosen or committed to the ICE call');
 check(h.chooseStores(iceStoreCodes,'ICE')&&h.C.validate(h.values,h.call).ok,'operator can reselect the complete ICE group');
 const iceSelection=plain(h.values.intendedStore),iceScope=iceSelection[0].verifiedScope;
 await h.pickSeries(seriesCodes.iceB);
 equal(h.values.intendedStore.map(row=>row.code),iceStoreCodes,'ICE A to ICE B keeps the same old selected group');
 check(!h.C.validate(h.values,h.call).ok&&!h.save().ok,'changed ICE series requires its full query before the old group can submit');
 const iceB=await h.queryStores();
 check(iceB.ok&&iceB.complete&&iceB.meta.pagesRead===2,'ICE B also reads every page through actual field/data/adapter chain');
 equal(iceB.meta.requests,[{sourceType:'ICE',page:1,perPage:2},{sourceType:'ICE',page:2,perPage:2}],'ICE B uses the same complete v2 source request set');
 equal(iceB.items.map(row=>row.code),iceStoreCodes,'two different ICE series return the identical complete ICE group');
 equal(iceB.items,plain(iceA.items),'ICE series change does not invent a narrower store relation or relationship metadata');
 equal(h.values.intendedStore.map(row=>row.code),iceStoreCodes,'full ICE B query preserves every old valid ICE store');
 check(h.values.intendedStore.every((row,index)=>row.state==='valid'&&row.name===iceSelection[index].name&&row.sourceVersion===iceSelection[index].sourceVersion&&row.verifiedScope!==iceScope),'retained valid stores use the newly completed ICE condition scope');
 check(h.C.validate(h.values,h.call).ok,'complete ICE B requery makes the retained group valid without reselection');
 const sourceBeforeEmpty=h.B.sourceVersion('d-store',h.scope);
 const storeField=h.M.fields('lead',h.call).find(row=>row.id==='intendedStore');
 const scopeBeforeEmpty=h.F.conditions(storeField,h.values,h.call).stamp;
 check(h.values.intendedStore.every(row=>row.state==='valid'&&row.sourceVersion===sourceBeforeEmpty&&row.verifiedScope===scopeBeforeEmpty),'old selected stores are valid in the current source and scope before an empty response');
 h.setEmptyPageResponse(true);
 check(h.B.env.source==='dcc'&&h.B.env.dccScenario==='normal'&&h.B.sourceVersion('d-store',h.scope)===sourceBeforeEmpty,'empty raw I/O does not change DCC profile, scenario or source version');
 check(h.C.validate(h.values,h.call).ok,'I/O switch alone does not invalidate old selections before the query');
 const emptied=await h.queryStores();
 check(emptied.ok&&emptied.complete&&!emptied.items.length&&emptied.meta.scenario==='normal','complete empty raw response traverses actual normal-scenario DCC adapter and field query');
 check(h.B.sourceVersion('d-store',h.scope)===sourceBeforeEmpty&&h.F.conditions(storeField,h.values,h.call).stamp===scopeBeforeEmpty,'empty query completes with the exact same source version and condition scope');
 equal(h.values.intendedStore.map(row=>row.code),iceStoreCodes,'complete empty result preserves every old ICE store for correction');
 check(h.values.intendedStore.every(row=>row.state==='pending'),'old stores remain pending after complete empty result');
 check(!h.C.validate(h.values,h.call).ok,'old unmatched DCC stores cannot pass actual followup validation');
 const rejected=h.save();check(!rejected.ok&&!first.customerFollowup&&!h.storage.has('customer-followup-v1'),'invalid nonempty DCC stores cannot commit journal or call snapshot');
 check(!h.chooseStores(iceStoreCodes,'ICE'),'complete empty lookup cannot select old unavailable candidates');
 check(h.F.clear('dcc-flow','intendedStore'),'operator can explicitly clear unmatched optional stores');
 const cleared=h.save();check(cleared.ok&&cleared.values.intendedStore.length===0,'optional cleared store array saves through original chain');
 equal(cleared.values.businessFieldSnapshot.values.intendedStore,[],'callback carries explicit empty array');
 equal([first.intentionSeriesCode,first.intentionStoreCode],['RAW_IMPORT_SERIES','RAW_IMPORT_STORE'],'original imported values never changed');
 h.setEmptyPageResponse(false);h.setScenario('normal');h.mount('DCC_FLOW_MULTI');await h.pickSeries(seriesCodes.iceA);await h.queryStores();check(h.chooseStores(iceStoreCodes,'ICE'),'second call selects the complete three-store ICE group');
 h.w.AgentWorkbench.setFollowup('plannedStoreName','保留的原计划门店');
 const selected=plain(h.values.intendedStore);
 const saved=h.save();check(saved.ok,'DCC single-series multi-store selection commits original save path');
 equal(saved.values.intendedStore.map(row=>row.code),iceStoreCodes,'saved same-call collection includes every selected ICE store code');
 equal(saved.values.intendedStore.map(row=>row.name),selected.map(row=>row.name),'saved names copied from actual selected DCC candidates');
 equal(saved.values.intendedSeries.code,seriesCodes.iceA,'saved series comes from same editor call');
 const callback=saved.values.businessFieldSnapshot;
 equal(callback.values.intendedStore.map(row=>row.code),iceStoreCodes,'actual callback projection contains the complete ICE group');
 check(callback.values.intendedStore.every(row=>Object.keys(row).sort().join(',')==='code,name,type'),'callback contains business code/name/type only');
 check(!JSON.stringify(callback).includes('verifiedScope')&&!JSON.stringify(callback).includes('sourceVersion'),'callback omits transient validation tokens');
 const journal=JSON.parse(h.storage.get('customer-followup-v1'));
 equal(journal.entries.find(row=>row.key===h.C.identity(h.call)).values.intendedStore.map(row=>row.code),iceStoreCodes,'original journal persists the complete same-call ICE group');
 const second=h.call,firstSnapshot=JSON.stringify(second.customerFollowup);
 const html=h.C.detail(saved.values,second);check(iceStoreCodes.every(code=>html.includes(code))&&selected.every(row=>html.includes(row.name)),'actual detail shows every saved ICE name and code');
 h.mount('DCC_FLOW_EMPTY_AFTER_MULTI');await h.pickSeries(seriesCodes.iceB);check(h.F.clear('dcc-flow','intendedStore'),'later call explicitly clears store collection');
 const later=h.save();check(later.ok&&!later.values.intendedStore.length,'later call saves explicit empty store collection');
 const projected=h.C.aggregate([h.call,second]);
 const group=projected.groups.find(group=>group.externalDocumentId==='DCC_FLOW_DOC');
 check(group&&group.values.intendedSeries.code===seriesCodes.iceB,'aggregate uses the different ICE series from latest same-document call');
 equal(group.values.intendedStore,[],'latest explicit empty array never inherits earlier DCC stores in document group');
 equal(projected.intendedStore,[],'flat lead projection never inherits earlier DCC stores');
 check(!h.C.detail(projected).includes(iceStoreCodes[0]),'archive rendered from latest group does not display prior DCC stores');
 check(group.values.plannedStoreName==='保留的原计划门店','empty intention collection preserves independent plan text');
 check(JSON.stringify(second.customerFollowup)===firstSnapshot,'projection never rewrites prior same-call snapshot');
 equal(h.C.aggregate([second]).groups[0].values.intendedStore.map(row=>row.code),iceStoreCodes,'previous call alone still displays its complete saved ICE group');
 // Compare an otherwise identical category where the existing store rule is mandatory.
 const required=harness();required.setScenario('normal');
 const category=required.M.get('lead',required.scope);category.fields.find(row=>row.fieldId==='intendedStore').required=true;
 check(required.M.save(category,required.scope).ok,'actual category API configures mandatory store rule');
 required.mount('DCC_FLOW_REQUIRED');await required.pickSeries(seriesCodes.iceB);await required.queryStores();
 check(required.chooseStores(iceStoreCodes,'ICE')&&required.C.validate(required.values,required.call).ok,'mandatory store accepts the complete valid ICE group');
 const requiredField=required.M.fields('lead',required.call).find(row=>row.id==='intendedStore');
 const requiredSource=required.B.sourceVersion('d-store',required.scope),requiredScope=required.F.conditions(requiredField,required.values,required.call).stamp;
 required.setEmptyPageResponse(true);
 const requiredEmpty=await required.queryStores();check(requiredEmpty.ok&&requiredEmpty.complete&&!requiredEmpty.items.length,'mandatory category also receives real complete empty DCC result');
 check(required.B.sourceVersion('d-store',required.scope)===requiredSource&&required.F.conditions(requiredField,required.values,required.call).stamp===requiredScope,'mandatory empty result also keeps the same source version and condition scope');
 check(required.values.intendedStore.length===3&&required.values.intendedStore.every(row=>row.state==='pending'),'mandatory empty query preserves every old ICE store pending rather than clearing them');
 check(!required.save().ok,'mandatory pending collection cannot be saved');
 check(required.F.clear('dcc-flow','intendedStore'),'operator explicitly clears mandatory unmatched collection');
 const mandatoryValidation=required.C.validate(required.values,required.call);
 check(!mandatoryValidation.ok&&mandatoryValidation.field==='intendedStore','explicit empty array still fails mandatory store rule');
 check(!required.save().ok&&!required.storage.has('customer-followup-v1')&&!required.call.customerFollowup,'mandatory empty selection never commits journal or call snapshot');
 console.log(JSON.stringify({ok:true,assertions:count,scope:'actual DCC v2 fixture/adapter/data/field/followup save/detail/aggregate; simulated only; no production API validation'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
