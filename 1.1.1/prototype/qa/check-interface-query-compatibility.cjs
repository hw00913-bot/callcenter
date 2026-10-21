/** Real metadata, current bad bindings, common runtime, picker and adapter boundaries. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {harness,Element,copy}=require('./fixtures/current-profile.cjs');
const base=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const listeners=new WeakMap();Element.prototype.addEventListener=function(name,callback){let events=listeners.get(this);if(!events){events=new Map();listeners.set(this,events);}events.set(name,callback);};
const fire=(node,name)=>listeners.get(node)?.get(name)?.({target:node,currentTarget:node,preventDefault(){},stopPropagation(){}});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
const key=item=>JSON.stringify([item.type||'',item.code]);
function setupCompatibility({bad=false,required=true,valueKey='code',parameterName='seriesCode'}={}){
 const h=harness({generic:!bad}),w=h.win,B=w.BusinessData,overrides=new Map(),requests=[];let network=0;
 if(bad){
  require('./fixtures/current-generic.cjs').dictionary(w,{scope:h.scope});const data=h.M.catalog(h.scope);
  const store={id:'configuredStore',label:'本次意向门店',type:'interface',businessKey:'',enabled:true,options:[],dictionaryId:'d-fixture-store',useQueryConditions:true,depends:['mappingIntendedSeries'],parameterBinding:{parameterName,sourceValueKey:valueKey,required}};
  const types=data.rows.map(row=>row.id==='lead'?{...row,fields:[...row.fields,{fieldId:store.id,enabled:true,required:false}]}:row);
  h.storage.set(h.M.storageKey,JSON.stringify({version:h.M.storageVersion,revision:3,scopes:[{...h.scope,types:copy(types),fields:[...copy(data.fields),store]}]}));
  h.mount({callId:'incompatible-existing-config'},{configuredStore:[{code:'N01',name:'原已选门店',type:'NEV',entryId:'d-fixture-store',state:'valid',sourceVersion:B.sourceVersion('d-fixture-store',h.scope)}],plannedStoreName:'客服原文字门店'});
 }
 w.BusinessData={...B,capability:id=>overrides.has(id)?copy(overrides.get(id)):B.capability(id),queryOptions:async(id,params,scope)=>{requests.push({id,params:copy(params),scope:copy(scope)});return B.queryOptions(id,params,scope);}};
 w.fetch=()=>{network++;throw Error('no real network permitted');};
 for(const file of ['mock/dcc-business-data.js','js/components/dcc-business-adapter.js','js/components/business-store-picker.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),w,{filename:file});
 const F=w.BusinessInterfaceField,seriesId=bad?'mappingIntendedSeries':'genericSeries',storeId=bad?'configuredStore':'genericStore';
 return {...h,w,B,F,requests,seriesId,storeId,overrides,get call(){return h.call;},get values(){return h.values;},get network(){return network;},
  series:()=>h.M.getField(seriesId,h.call),store:()=>h.M.getField(storeId,h.call),condition:()=>F.conditions(h.M.getField(storeId,h.call),h.values,h.call),
  querySeries:()=>F.query('seat-followup',seriesId),queryStores:()=>F.query('seat-followup',storeId),
  chooseSeries:item=>F.choose('seat-followup',seriesId,key(item)),chooseStores:items=>F.chooseMany('seat-followup',storeId,items.map(key)),
  setSeries:value=>w.AgentWorkbench.setFollowup(seriesId,value),openStores:()=>F.open('seat-followup',storeId),
  next(extra={},values={}){h.mount({callId:'compatibility-next-'+Math.random(),...extra},values);return h.call;}};
}
async function run(){
 {
  const h=setupCompatibility({bad:true}),cap=h.B.capability('mapping-series'),old=JSON.stringify(h.values.configuredStore),q=await h.querySeries();
  check(h.M.catalog(h.scope).ok&&h.M.getField(h.storeId,h.scope).depends[0]===h.seriesId,'an existing incompatible binding stays readable and is never silently disabled');
  check(h.document.getElementById('seat-followup-'+h.seriesId)&&h.document.getElementById('seat-followup-'+h.storeId),'real bad-configuration form preserves its Mapping control and shows the affected store control');
  const item=q.items.find(row=>row.code==='910003');check(q.ok&&!!item&&h.chooseSeries(item),'actual Mapping adapter can select official string ID 910003 before store lookup');
  const result=await h.queryStores();
  check(!result.ok&&!result.complete&&!result.items.length&&result.code==='value_domain_mismatch'&&result.nonRetryable&&result.category==='configuration','official Mapping ID cannot be sent into the catalog-series store parameter');
  check(h.requests.filter(row=>row.id==='d-fixture-store').length===0,'incompatible declaration dispatches zero downstream adapter queries, including no parameterless fallback');
  check(result.message.includes('当前车系编码与门店接口不兼容，请管理员调整字段配置')&&!result.message.includes('请先填写')&&!result.message.includes('请重试'),'customer guidance identifies a configuration issue rather than missing selection or transport retry');
  check(!h.F.focusDependency('seat-followup',h.storeId),'incompatible binding does not guide the operator into repeatedly selecting the upstream series');
  check(JSON.stringify(h.values.configuredStore)===old&&h.values.plannedStoreName==='客服原文字门店'&&h.values[h.seriesId].code==='910003','failed compatibility preserves every previous store, series and text input');
  check(!h.F.validate(h.store(),h.values[h.storeId],h.values,h.call).ok&&!h.C.validate(h.values,h.call).ok&&!h.F.confirm('seat-followup',h.storeId),'previous store values cannot be confirmed or submitted under incompatible conditions');
  h.openStores();await tick();const picker=h.document.getElementById('business-store-picker');check(!!picker,'configuration problem still allows opening the real picker to read the reason');
  check(picker.querySelector('[data-store-query]').disabled&&picker.querySelector('[data-store-confirm]').disabled&&!picker.querySelector('[data-store-cancel]').disabled,'configuration picker disables query and confirmation while preserving cancel');
  check(picker.querySelector('[data-store-message]').textContent.includes('当前车系编码与门店接口不兼容')&&picker.querySelector('[data-store-message]').textContent.includes('原已选门店')&&!picker.querySelector('[data-store-rows]').textContent.includes('暂无'),'picker explicitly reports the configuration issue and retained old store instead of a successful empty result');
  fire(picker.querySelector('[data-store-cancel]'),'click');check(!h.document.getElementById('business-store-picker')&&JSON.stringify(h.values[h.storeId])===old,'actual cancel handler closes the picker without changing the draft');
  const code=cap.returnFields.find(row=>row.key==='code'),relation=cap.returnFields.find(row=>row.key==='relation_id'),media=cap.returnFields.find(row=>row.key==='media_car_series_id');
  check(code.valueType==='string'&&relation.valueType==='number'&&code.valueDomain===relation.valueDomain&&media.valueDomain!==code.valueDomain,'official string ID, numeric original ID and media ID have explicit distinct primitive/domain contracts');
  check(h.B.capability('stores').returnFields.find(row=>row.key==='code').valueDomain==='demo.store-code'&&h.B.capability('series').returnFields.find(row=>row.key==='code').valueDomain==='demo.catalog-series-code','store identity never inherits a series identity domain from shared metadata');
  check(h.network===0,'the complete mismatch demonstration makes no real network request');
 }
 for(const profile of ['standard','dcc']){
  const h=setupCompatibility();h.B.env.source=profile;const q=await h.querySeries();check(q.ok&&h.chooseSeries(q.items[0]),profile+' same-source series query and actual selection still work');
  const stores=await h.queryStores();check(stores.ok&&stores.complete&&stores.items.length>0&&h.chooseStores([stores.items[0]]),profile+' matching declaration queries and selects its real adapter stores');
  check(h.requests.at(-1).params.seriesCode===q.items[0].code&&h.condition().ready,'same-source binding sends the exact scalar code without a conversion');
  check(h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''}).ok,profile+' selected store actually saves through the normal followup validator');
  const independent=copy(h.M.getField(h.storeId,h.scope));independent.useQueryConditions=false;independent.depends=[];delete independent.parameterBinding;check(h.M.saveField(independent,h.scope).ok,'administrator explicitly configures an independent store lookup');
  h.next();const all=await h.queryStores();check(all.ok&&all.complete&&h.requests.at(-1).id==='d-fixture-store'&&Object.keys(h.requests.at(-1).params).length===0,profile+' explicit independent mode keeps its normal parameterless query');
  for(const params of [{unknown:'910003'},{seriesCode:'910003'},{seriesCode:910003},{seriesCode:false}]){
   const direct=await h.B.queryOptions('d-fixture-store',params,h.scope);check(!direct.ok&&!direct.complete&&!direct.items.length&&direct.category==='configuration'&&direct.nonRetryable&&['unsupported_parameter','unknown_catalog_code','value_type_mismatch'].includes(direct.code),profile+' direct invalid parameter is an explicit non-retryable configuration error');
  }
  check(h.network===0,'normal '+profile+' and independent queries remain fully simulated');
 }
 for(const valueKey of ['relation_id','media_car_series_id']){
  const h=setupCompatibility({bad:true,valueKey}),q=await h.querySeries();check(q.ok&&h.chooseSeries(q.items[0]),'actual Mapping response remains available for '+valueKey+' mismatch check');const r=await h.queryStores();
  check(!r.ok&&r.code===(valueKey==='relation_id'?'value_type_mismatch':'value_domain_mismatch')&&h.requests.filter(row=>row.id==='d-fixture-store').length===0,'the configured '+valueKey+' is checked as declared rather than converted to a series code');
 }
 for(const supplied of [0,1,false,true,null,[],{},NaN,Infinity,undefined]){
  const h=setupCompatibility(),q=await h.querySeries();check(q.ok&&h.chooseSeries(q.items[0]),'real source selected before actual-type corruption');const selected=copy(h.values[h.seriesId]);selected.sourceValues.code=supplied;h.setSeries(selected);const before=h.requests.length,r=await h.queryStores();
  check(!r.ok&&r.code==='value_type_mismatch'&&r.nonRetryable&&h.requests.length===before,'sourceValues priority rejects actual '+String(supplied)+' without using the top-level valid string or broadening the query');
 }
 for(const fault of ['missing_source_domain','missing_target_type','wrong_parameter']){
  const h=setupCompatibility(),q=await h.querySeries();check(q.ok&&h.chooseSeries(q.items[0]),'real source selected before metadata fault '+fault);
  if(fault==='missing_source_domain'){const cap=h.B.capability('series');delete cap.returnFields.find(row=>row.key==='code').valueDomain;h.overrides.set('series',cap);}
  if(fault==='missing_target_type'){const cap=h.B.capability('stores');delete cap.queryConditions[0].valueType;h.overrides.set('stores',cap);}
  if(fault==='wrong_parameter'){const cap=h.B.capability('stores');cap.queryConditions[0].key='anotherParameter';h.overrides.set('stores',cap);}
  const before=h.requests.length,r=await h.queryStores();check(!r.ok&&r.code===(fault==='wrong_parameter'?'unsupported_parameter':'missing_metadata')&&h.requests.length===before,'unknown or changed declaration fails closed before adapter I/O: '+fault);
 }
 {
  const h=setupCompatibility({bad:true,required:false}),before=h.requests.length,r=await h.queryStores();check(!r.ok&&r.code==='value_domain_mismatch'&&h.requests.length===before,'an optional empty source never hides an incompatible declared binding behind an independent query');
 }
 {
  const h=setupCompatibility(),q=await h.querySeries();h.chooseSeries(q.items[0]);const old=copy(h.values);h.B.setTenants('d-fixture-store',[]);const before=h.requests.length,r=await h.queryStores();check(!r.ok&&h.requests.length===before&&!h.F.confirm('seat-followup',h.storeId),'real source authorization still blocks a matching declaration');check(h.values[h.seriesId].code===old[h.seriesId].code,'authorization failure retains the upstream choice');
 }
 {
  const h=setupCompatibility(),q=await h.querySeries();h.chooseSeries(q.items[0]);h.state.sessionId='NEW-COMPATIBILITY-SESSION';const before=h.requests.length,r=await h.queryStores();check(!r.ok&&h.requests.length===before,'session changes still invalidate the old editor before compatibility can authorize a query');
 }
 console.log(JSON.stringify({passed,scope:'real declared identifier domains and primitive types, old Mapping-store mismatch with zero requests, picker configuration state, normal same-source/independent queries and live guards'}));
}
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={setupCompatibility};
