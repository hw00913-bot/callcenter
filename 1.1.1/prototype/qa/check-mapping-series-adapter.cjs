/* Structural Mapping contract verification; all rows and requests are synthetic. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(process.argv[2]||path.join(__dirname,'..'));
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
const scope={tenantId:'MAPPING-DEMO-TENANT',enterpriseId:'MAPPING-DEMO-ENTERPRISE'};
const c={console,Promise,setTimeout:fn=>setTimeout(fn,1)};c.window=c;vm.createContext(c);
for(const file of ['mock/mapping-series-data.js','js/components/mapping-series-adapter.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),c,{filename:file});
const original=c.MappingSeriesMock,query=options=>c.MappingSeriesAdapter.query({scope,...options});
const raw={name:'映射演示车系甲（虚构）',relation_id:910001,car_state:1,media_car_series_id:'DEMO-MEDIA-SERIES-A'};
const respond=value=>{c.MappingSeriesMock={...original,list:()=>Promise.resolve(value)};};
const rejected=async(options,message)=>{const value=await query(options);check(!value.ok&&!value.complete&&value.items.length===0,message);return value;};
(async()=>{
 const normal=await query({});check(normal.ok&&normal.complete&&normal.items.length===3,'actual default fixture yields a complete mapped series array');
 check(JSON.stringify(normal.meta.request)==='{"media_id":10,"car_state":1}','default request explicitly sends documented media/state and omits optional filters');
 check(normal.meta.method==='GET'&&normal.meta.relativePath==='/mapping/api/open/mapping-car-series/code'&&normal.meta.pagination===false&&normal.meta.mappedSeriesOnly,'metadata states the documented relative bare-array capability without inventing a host or paging');
 check(normal.meta.simulated===true&&normal.meta.productionContractVerified===false,'structural simulation never claims production verification');
 for(const item of normal.items){
  check(item.code===String(item.relation_id)&&item.code!==item.media_car_series_id,'normalized code is exclusively the official integer ID string');
  check(item.name===item.sourceValues.name&&item.relation_id===item.sourceValues.relation_id&&item.car_state===item.sourceValues.car_state&&item.media_car_series_id===item.sourceValues.media_car_series_id,'sourceValues preserves all four original response attributes');
  check(Object.keys(item.sourceValues).sort().join(',')==='car_state,media_car_series_id,name,relation_id'&&!Object.hasOwn(item,'type'),'no inferred status label or NEV/ICE type enters a mapped option');
 }
 const zero=await query({params:{media_id:0,car_state:0,brand_id:0,is_nev_car_type_flag:0}});
 check(!zero.ok&&zero.meta.request.media_id===0&&zero.meta.request.car_state===0&&zero.message.includes('暂无模拟资料'),'explicit zero is preserved even when that synthetic media/filter scope has no fixture data');
 check(zero.meta.request.brand_id===0&&zero.meta.request.is_nev_car_type_flag===0,'explicit optional zero filters are preserved without claiming verified filtering behavior');
 const stateZero=await query({params:{media_id:10,car_state:0}});check(stateZero.ok&&stateZero.items.length===1&&stateZero.items[0].car_state===0,'registered raw state-zero sample remains distinct from the default state-one samples');
 for(const params of [{media_id:11},{brand_id:0},{is_nev_car_type_flag:0},{is_nev_car_type_flag:1},{car_state:999}]){const unsupported=await rejected({params},'unsupported synthetic scope does not pretend to be a filtered full result');check(unsupported.message.includes('暂无模拟资料'),'unsupported synthetic scope is explicit rather than an invented provider empty set');}
 for(const value of [-1,2,9]){const invalid=await rejected({params:{is_nev_car_type_flag:value}},'unregistered energy flag enum is rejected');check(invalid.message.includes('0 或 1'),'documented flag values are enforced without inferring a vehicle type');}
 for(const params of [{},{media_id:'',car_state:''},{media_id:undefined,car_state:undefined},{media_id:'10',car_state:'1'}]){
  const result=await query({params});check(result.ok&&result.meta.request.media_id===10&&result.meta.request.car_state===1,'missing/empty or valid integer text normalizes without fabricating optional filters');
 }
 const omitted=await query({params:{brand_id:'',is_nev_car_type_flag:undefined}});check(omitted.ok&&Object.keys(omitted.meta.request).join(',')==='media_id,car_state','unprovided optional filters are omitted');
 for(const key of ['media_id','car_state','brand_id','is_nev_car_type_flag'])for(const value of [null,true,false,1.2,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,[],{},' ','1.0','1e2',' 1','x']){
  const result=await rejected({params:{[key]:value}},key+' invalid integer fails closed');check(result.message.includes(key),'invalid integer identifies the offending input');
 }
 for(const params of [null,[],{seriesCode:'910001'},{media_car_series_id:'DEMO-MEDIA-SERIES-A'},{sourceType:'NEV'},{media_id:10,unknown:1}])await rejected({params},'unregistered query fields cannot silently become filter conditions');
 const symbolic={};symbolic[Symbol('unexpected')]=1;await rejected({params:symbolic},'symbol query properties are rejected');
 for(const scenario of ['failure','partial','conflict','malformed','UNKNOWN'])await rejected({scenario},scenario+' is an error with no partial candidates');
 const empty=await query({scenario:'empty'});check(empty.ok&&empty.complete&&!empty.items.length&&empty.message.includes('暂无'),'empty bare array is a successful complete query, distinct from errors');
 respond([raw,{...raw}]);const same=await query({});check(same.ok&&same.items.length===1&&same.meta.returnedRows===2&&same.meta.uniqueRows===1,'exactly identical four-field records merge without changing official identity');
 for(const patch of [{name:'不同名称'},{car_state:0},{media_car_series_id:'OTHER-MEDIA-ID'}]){
  respond([raw,{...raw,...patch}]);const result=await rejected({},'conflicting duplicate official ID invalidates the entire list');check(result.message.includes('910001')&&result.message.includes('冲突'),'conflict identifies the official ID instead of selecting an arbitrary mapping');
 }
 for(const payload of [null,{}, {data:[raw]},'[]',[null],[{}],[{...raw,relation_id:'910001'}],[{...raw,relation_id:1.5}],[{...raw,relation_id:Number.MAX_SAFE_INTEGER+1}],[{...raw,car_state:'1'}],[{...raw,car_state:null}],[{...raw,name:''}],[{...raw,name:'   '}],[{...raw,name:10}],[{...raw,media_car_series_id:''}],[{...raw,media_car_series_id:null}],[{...raw,media_car_series_id:100}]]){
  respond(payload);await rejected({},'malformed bare-array fields cannot yield selectable candidates');
 }
 const inherited=Object.create(raw);respond([inherited]);await rejected({},'required response fields must be present on the returned record itself');
 respond([{...raw,relation_id:0,car_state:0,media_car_series_id:'000123'}]);const opaque=await query({params:{car_state:0}});check(opaque.ok&&opaque.items[0].code==='0'&&opaque.items[0].sourceValues.media_car_series_id==='000123','official zero and opaque media string remain distinct and lossless');
 for(const payload of [[{...raw,car_state:0}],[raw,{...raw,relation_id:910002,car_state:0}],[{...raw,relation_id:910002,car_state:0},raw]]){
  respond(payload);const mismatch=await rejected({},'a single or mixed out-of-scope raw state rejects the entire response');check(mismatch.message.includes('范围异常'),'state-scope mismatch is explicit without guessing a status label');
 }
 respond([raw]);const reverseScope=await rejected({params:{car_state:0}},'state-zero query cannot accept a state-one record');check(reverseScope.message.includes('范围异常'),'scope matching is symmetric and does not treat zero as an omitted filter');
 respond([{...raw,extra:'ignored transport field'},{...raw,extra:'different ignored transport field'}]);const narrow=await query({});check(narrow.ok&&narrow.items.length===1&&!Object.hasOwn(narrow.items[0].sourceValues,'extra'),'only declared four fields participate in mapping identity and source snapshots');
 respond([raw]);const renamed=await query({rename:()=> '新的演示名称'});check(renamed.ok&&renamed.items[0].name==='新的演示名称'&&renamed.items[0].sourceValues.name==='新的演示名称','upstream-name simulation remains internally consistent');
 c.MappingSeriesMock=original;let current=true;const pending=query({scenario:'delay',isCurrent:()=>current});current=false;await rejected({isCurrent:()=>false},'stale context is rejected before I/O');const stale=await pending;check(!stale.ok&&!stale.complete&&!stale.items.length,'stale context is rechecked after asynchronous raw results return');
 await rejected({isCurrent:1},'malformed current-context guard cannot bypass protection');
 await rejected({scope:{tenantId:'',enterpriseId:'missing'}},'incomplete local scope is rejected');
 c.MappingSeriesMock={...original,namespace:'OTHER'};await rejected({},'unknown fixture namespace cannot masquerade as a registered provider');
 c.MappingSeriesMock=undefined;await rejected({},'missing raw fixture does not fall back to a different series source');
 console.log(JSON.stringify({passed,scope:'Mapping synthetic bare-array adaptation, strict integers, official identity, duplicate conflicts, empty/errors and late-response guards'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
