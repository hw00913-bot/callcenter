/* Generic query chaining uses controlled fictional adapters only.
 * The application capability list is unchanged; no production API is asserted.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(process.argv[2]||path.join(__dirname,'..'));
let count=0;
const check=(test,message)=>{assert.ok(test,message);count++;};
const equal=(actual,expected,message)=>{assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected,message);count++;};
const copy=value=>structuredClone(value), tick=()=>new Promise(done=>setTimeout(done,0));
const key=(code,type='TEST')=>JSON.stringify([type,code]);
const complete=items=>({ok:true,complete:true,items:copy(items),message:''});
const makeField=(id,options={})=>({id,label:'测试字段'+id,type:'interface',dictionaryId:id,required:false,enabled:true,depends:[],useQueryConditions:false,...options});
const linked=(id,source,param,valueKey='code',required=true)=>makeField(id,{depends:[source],useQueryConditions:true,parameterBinding:{parameterName:param,sourceValueKey:valueKey,required}});
const fieldsSeed=[makeField('A'),linked('B','A','regionKey','regionId'),linked('C','B','districtKey','districtId')];

function harness(definitions=fieldsSeed) {
  const fields=copy(definitions), versions={},permissions={},events={},storage=new Map(),queries=[],pending=new Map(),responses=new Map(),notices=[];
  const output=(key,valueDomain)=>({key,valueType:'string',valueDomain,valueDomainLabel:valueDomain});
  const defaultReturn=[output('name','qa.generic-name'),output('type','qa.generic-kind')];
  const caps=Object.fromEntries(fields.map(field=>[field.dictionaryId,{id:field.dictionaryId,kind:field.dictionaryId==='store'?'store':field.dictionaryId==='series'?'series':'generic',selectionMode:field.dictionaryId==='store'?'multiple':'single',queryConditions:[],returnFields:[output('code',field.dictionaryId==='series'?'demo.catalog-series-code':field.dictionaryId==='store'?'demo.store-code':'qa.generic-code'),...defaultReturn,...(field.dictionaryId==='A'?[output('regionId','qa.region-id')]:field.dictionaryId==='B'?[output('districtId','qa.district-id')]:[])]}]));
  const rows={
    A:[{code:'A1',name:'模拟区域一',type:'TEST',regionId:'R1'},{code:'A2',name:'模拟区域二',type:'TEST',regionId:'R2'}],
    B:[{code:'B1',name:'模拟片区一',type:'TEST',districtId:'D1'},{code:'B2',name:'模拟片区二',type:'TEST',districtId:'D2'},{code:'B0',name:'模拟全部片区',type:'TEST',districtId:'D0'}],
    C:[{code:'C1',name:'模拟末级一',type:'TEST'},{code:'C2',name:'模拟末级二',type:'TEST'}],
    series:[{code:'NEV-A',name:'模拟新能源车系',type:'NEV'},{code:'ICE-A',name:'模拟燃油车系',type:'ICE'}],
    store:[{code:'N01',name:'模拟新能源门店',type:'NEV',seriesCodes:['NEV-A']},{code:'I01',name:'模拟燃油门店',type:'ICE',seriesCodes:['ICE-A']}]
  };
  fields.forEach(field=>{versions[field.dictionaryId]=1;permissions[field.dictionaryId]=true;});
  let activeFields=fields,values={},nodes=[],revision=1;
  const call={callId:'generic-call',tenantId:'t1',enterpriseId:'e1',accountId:'a1',businessType:'lead',customerPhone:'13800000001',callSource:'NATIVE_WORKBENCH',processingStatus:'待填写',endedAt:'now',direction:'呼出',callType:'人工外呼',answered:true};
  const app={accountId:'a1',sessionId:'sess1',tenantId:'t1',enterpriseId:'e1',activeDomain:'CLOUD_CONTACT_CENTER'};
  const owner={isConnected:true},dropdowns=[];
  const input=()=>({value:'',listeners:{},addEventListener(name,cb){this.listeners[name]=cb;},setAttribute(){},removeAttribute(){},focus(){},fire(name,event={}){this.listeners[name]?.({target:this,preventDefault(){},stopPropagation(){},...event});}});
  function dropdownNode(){
    const parts={'input':input(),'[role="listbox"]':{innerHTML:'',children:[]},'[role="status"]':{innerHTML:'',hidden:false}};
    return {isConnected:true,style:{},listeners:{},querySelector:selector=>parts[selector],addEventListener(name,cb){this.listeners[name]=cb;},contains:()=>false,remove(){this.isConnected=false;},fire(name,event={}){this.listeners[name]?.({target:parts.input,preventDefault(){},stopPropagation(){},...event});}};
  }
  const w={console,structuredClone,setTimeout,clearTimeout,Date,Map,Set,JSON,Object,String,Array,Number,Promise,window:null,
    document:{querySelectorAll:()=>nodes,getElementById:()=>null,createElement:()=>{const node=dropdownNode();dropdowns.push(node);return node;},body:{appendChild(){}},addEventListener(){}},
    localStorage:{getItem:id=>storage.get(id)??null,setItem:(id,value)=>storage.set(id,String(value))},
    AppState:{get:()=>app,effectiveAccess:()=>({roleCode:'AGENT',valid:true}),authorizeObject:()=>true},
    PlatformUI:{escape:value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),status:(text,tone)=>'<span class="'+tone+'">'+text+'</span>'},
    CustomerBusiness:{interfaceKind:field=>caps[field?.dictionaryId]?.kind||'',catalog:()=>({revision}),fields:()=>activeFields,getField:id=>fields.find(field=>field.id===id),get:()=>({id:'lead'}),list:()=>[{id:'lead'}],importedDetail:()=>'',callbackSnapshot:value=>copy(value)},
    CustomerDirectory:{phoneOf:c=>c?.customerPhone,list:()=>[]},CloudCallData:{calls:[call]},CallState:{view:c=>({answered:c.answered})},
    addEventListener:(name,cb)=>events[name]=cb,showToast(message,tone){notices.push({message,tone});},
    BusinessData:{entry:id=>caps[id]?{id,capabilityId:id}:null,capability:id=>caps[id]?copy(caps[id]):null,sourceVersion:id=>versions[id]||0,available:id=>permissions[id]!==false,env:{saveFail:false},queryOptions:async(id,params,scope)=>{
      queries.push({id,params:copy(params),scope:copy(scope)});
      if(pending.has(id)){const queue=pending.get(id);pending.delete(id);return new Promise(resolve=>{queue.resolve=items=>resolve(complete(items));});}
      if(responses.has(id)){const response=responses.get(id);responses.delete(id);if(response instanceof Error)throw response;return copy(response);}
      if(id==='A')return complete(rows.A);
      if(id==='B'){const value=params.regionKey??params.changedRegion;return complete(value==='R1'?[rows.B[0]]:value==='R2'?[rows.B[1]]:[rows.B[2]]);}
      if(id==='C')return complete(params.districtKey==='D2'?[rows.C[1]]:[rows.C[0]]);
      if(id==='store')return complete(params.seriesCode?rows.store.filter(row=>row.seriesCodes.includes(params.seriesCode)):rows.store);
      return complete(rows[id]||[]);
    }}
  };
  fields.forEach(field=>{if(field.useQueryConditions){const returned=caps[fields.find(row=>row.id===field.depends[0])?.dictionaryId]?.returnFields.find(row=>row.key===field.parameterBinding.sourceValueKey);const declared={key:field.parameterBinding.parameterName,sourceKind:'*',sourceCardinality:'single',valueKey:field.parameterBinding.sourceValueKey,required:false,valueType:returned?.valueType,valueDomain:returned?.valueDomain,valueDomainLabel:returned?.valueDomainLabel};caps[field.dictionaryId].queryConditions=[declared,...(field.dictionaryId==='B'&&declared.key==='regionKey'?[{...declared,key:'changedRegion'}]:[])];}});
  require('./fixtures/current-component-contract.cjs').install(w,fields,{preserveMetadata:true});
  w.window=w;vm.createContext(w);
  for(const file of ['js/components/business-interface-field.js','js/components/customer-followup.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),w,{filename:file});
  const F=w.BusinessInterfaceField,C=w.CustomerFollowup;
  w.AgentWorkbench={setFollowup:(id,value)=>{const next=C.update(values,call,id,value);assert.ok(next,'registered field write must be accepted');values=next;}};
  function render(next=values){
    values={...C.empty(call),...next};
    nodes=activeFields.filter(field=>field.type==='interface').map(field=>({dataset:{interfacePrefix:'seat-followup',interfaceField:field.id,interfaceCall:C.identity(call)},isConnected:true,parentElement:owner,closest:selector=>selector==='.customer-followup-form'?owner:null,set outerHTML(html){this.html=html;},querySelector:()=>null}));
    C.form(values,call,'seat-followup','AgentWorkbench.setFollowup');
  }
  render();
  return {w,F,C,fields,caps,rows,call,queries,storage,dropdowns,permissions,versions,notices,
    get values(){return values;},get visible(){return activeFields;},
    render,set:(id,value)=>w.AgentWorkbench.setFollowup(id,value),
    field:id=>fields.find(field=>field.id===id),
    condition:id=>F.conditions(fields.find(field=>field.id===id),values,call),
    valid:id=>F.validate(fields.find(field=>field.id===id),values[id],values,call),
    query:id=>F.query('seat-followup',id),choose:(id,code,type='TEST')=>F.choose('seat-followup',id,key(code,type)),confirm:id=>F.confirm('seat-followup',id),
    async pick(id,code,type='TEST'){const result=await F.query('seat-followup',id);check(result.ok,'query '+id+' is complete');check(F.choose('seat-followup',id,key(code,type)),'choose '+id+' '+code);return result;},
    delay(id){const hold={};pending.set(id,hold);return hold;},
    respondOnce(id,result){responses.set(id,result);},
    setVisible(ids){activeFields=fields.filter(field=>ids.includes(field.id));revision++;render();},
    revise(id,changes){Object.assign(fields.find(field=>field.id===id),copy(changes));revision++;render();},
    source(id,allowed){permissions[id]=allowed;versions[id]++;events['business-data-change']?.();}
  };
}

(async()=>{
  const guide=harness();
  const guided=guide.F.control(guide.field('C'),'', 'seat-followup','AgentWorkbench.setFollowup',guide.call,guide.values);
  check(guided.includes('去填写测试字段A'),'blocked last-level field points to the first actionable ancestor');
  check(guide.F.focusDependency('seat-followup','C'),'explicit guidance can open the missing ancestor');
  await tick();
  check(guide.queries.at(-1).id==='A'&&!guide.values.A,'guidance queries the upstream picker without inventing a selection');
  guide.F.closeDropdown();guide.source('A',false);const callsBefore=guide.queries.length;
  check(!guide.F.focusDependency('seat-followup','C')&&guide.queries.length===callsBefore,'guidance cannot query an unavailable upstream source');
  guide.w.AppState.get().sessionId='changed-guidance-session';
  check(!guide.F.focusDependency('seat-followup','C'),'guidance respects the original editor session guard');
  let h=harness();
  check(!h.condition('B').ready&&!h.condition('C').ready,'required upstream values gate a generic A to B to C chain');
  check(!(await h.query('C')).ok&&h.queries.length===0,'blocked downstream query never calls the adapter');
  await h.pick('A','A1');
  check(h.values.A.sourceValues.regionId==='R1','nonstandard declared output survives selection in sourceValues');
  equal(h.condition('B').params,{regionKey:'R1'},'B maps the configured upstream return property to its custom parameter name');
  await h.pick('B','B1');equal(h.queries.at(-1).params,{regionKey:'R1'},'generic B receives a scalar custom parameter');
  check(typeof h.queries.at(-1).params.regionKey==='string'&&h.values.B.sourceValues.districtId==='D1','scalar input and next-hop custom output are retained');
  await h.pick('C','C1');equal(h.queries.at(-1).params,{districtKey:'D1'},'C reads B output rather than any hardcoded series key');
  check(h.valid('A').ok&&h.valid('B').ok&&h.valid('C').ok&&h.C.validate(h.values,h.call).ok,'all three generic selections validate through the actual followup chain');
  const html=h.F.control(h.field('B'),h.values.B,'seat-followup','AgentWorkbench.setFollowup',h.call,h.values);
  check(html.includes('aria-haspopup="listbox"')&&!html.includes('选择意向门店'),'generic single-selection capability renders a searchable dropdown control');
  h.F.open('seat-followup','B');await tick();
  check(h.dropdowns.at(-1)?.querySelector('[role="listbox"]').innerHTML.includes('模拟片区一'),'generic dropdown loads its adapter options');
  h.dropdowns.at(-1).fire('keydown',{key:'Enter'});
  check(!h.dropdowns.at(-1).isConnected&&h.values.B.code==='B1','generic dropdown keyboard selection uses the common choose path');
  const oldB=h.condition('B').stamp,oldC=h.condition('C').stamp;
  const lateB=h.delay('B'),lateBQuery=h.query('B'),late=h.delay('C'),lateQuery=h.query('C');await Promise.resolve();await h.pick('A','A2');
  check(h.condition('B').stamp!==oldB&&h.condition('C').stamp!==oldC,'changing A invalidates B and recursive C query scopes');
  check(!h.valid('B').ok&&!h.valid('C').ok&&!h.choose('B','B1')&&!h.choose('C','C1'),'old generic selections and candidates cannot survive an ancestor change');
  lateB.resolve(h.rows.B);check(!(await lateBQuery).ok&&!h.choose('B','B1'),'late B response after A changes cannot authorize old options');
  late.resolve(h.rows.C);check(!(await lateQuery).ok&&!h.choose('C','C1'),'late C response after an ancestor change cannot authorize options');
  await h.pick('B','B2');await h.pick('C','C2');
  check(h.C.validate(h.values,h.call).ok,'new A to B to C selections restore a valid current chain');
  h.source('A',false);
  check(h.values.A.state==='unavailable'&&h.values.B.state==='pending'&&h.values.C.state==='pending','ancestor source revocation propagates pending state through the chain');
  const beforeRevoked=h.queries.length;
  check(!(await h.query('C')).ok&&h.queries.length===beforeRevoked&&!h.C.validate(h.values,h.call).ok,'unavailable ancestor blocks descendant queries and save');
  h.source('A',true);
  check(h.values.A.state==='pending'&&!(await h.query('B')).ok,'restoring ancestor source does not restore dependent validity');
  await h.pick('A','A2');await h.query('B');
  check(h.values.B.state==='pending'&&!h.valid('B').ok,'complete matching query does not automatically confirm a recovered downstream selection');
  check(h.confirm('B')&&h.valid('B').ok,'explicit confirmation restores B after upstream recovery');
  await h.query('C');check(h.values.C.state==='pending'&&!h.valid('C').ok,'transitive C recovery also requires explicit confirmation');
  check(h.confirm('C')&&h.C.validate(h.values,h.call).ok,'C confirmation completes source recovery for the chain');

  h=harness([makeField('A'),linked('B','A','regionKey','regionId',false)]);
  check(h.condition('B').ready,'optional empty source does not block a downstream lookup');
  await h.pick('B','B0');equal(h.queries.at(-1).params,{},'optional empty source omits the configured parameter');
  h.setVisible(['B']);
  check(h.condition('B').ready,'optional source absent from this classification remains queryable');
  await h.query('B');equal(h.queries.at(-1).params,{},'source absent from the classification queries without an input parameter');
  h.setVisible(['A','B']);await h.pick('A','A1');
  h.set('A',{...h.values.A,state:'pending'});const invalidCount=h.queries.length;
  check(!h.condition('B').ready&&!(await h.query('B')).ok&&h.queries.length===invalidCount,'optional nonempty but invalid source cannot be treated as omitted');
  await h.pick('A','A1');h.set('A',{...h.values.A,sourceValues:{...h.values.A.sourceValues,regionId:''}});
  check(!h.condition('B').ready,'populated source with an empty mapped property is invalid rather than optional omission');
  await h.pick('A','A1');
  for(const invalid of [[],{id:'R1'},NaN,Infinity]){
    h.set('A',{...h.values.A,sourceValues:{...h.values.A.sourceValues,regionId:invalid}});
    check(!h.condition('B').ready,'non-scalar or non-finite upstream values cannot enter a scalar parameter binding');
  }
  for(const scalar of [0,false]){
    h.caps.A.returnFields.find(row=>row.key==='regionId').valueType=typeof scalar;h.caps.B.queryConditions.forEach(row=>{row.valueType=typeof scalar;});
    h.set('A',{...h.values.A,sourceValues:{...h.values.A.sourceValues,regionId:scalar}});
    check(h.condition('B').ready&&h.condition('B').params.regionKey===scalar,'zero and false remain legitimate scalar source values with matching explicit type and domain declarations');
  }

  // optional_clear: start with an actual linked selection, then clear its upstream
  // through the public field write path; neither an old query nor partial data
  // may authorize the broader parameterless scope or judge an old store absent.
  h=harness([makeField('series'),linked('store','series','seriesCode','code',false)]);
  h.field('store').required=true;
  await h.pick('series','NEV-A','NEV');
  let linkedStores=await h.query('store');
  equal(h.queries.at(-1).params,{seriesCode:'NEV-A'},'optional_clear starts with the selected scalar series parameter');
  equal(linkedStores.items.map(item=>item.code),['N01'],'optional_clear initial linked fixture excludes unrelated stores');
  check(h.F.chooseMany('seat-followup','store',[key('N01','NEV')])&&h.valid('store').ok,'optional_clear starts with a confirmed matching old store');
  const selectedBeforeClear=copy(h.values.store),linkedStoreStamp=h.condition('store').stamp;
  const lateLinked=h.delay('store'),lateLinkedQuery=h.query('store');await Promise.resolve();
  check(h.F.clear('seat-followup','series')&&h.values.series==='','optional_clear uses the public clear action for the optional upstream');
  equal(h.values.store,selectedBeforeClear,'optional_clear preserves the selected store without prematurely marking it unmatched');
  check(h.condition('store').ready&&h.condition('store').stamp!==linkedStoreStamp,'optional_clear creates a new ready parameterless scope');
  equal(h.condition('store').params,{},'optional_clear omits the upstream parameter instead of sending an empty string');
  check(!h.valid('store').ok&&!h.C.validate(h.values,h.call).ok,'optional_clear cannot submit the old selection before complete revalidation');
  check(!h.confirm('store')&&!h.F.chooseMany('seat-followup','store',[key('I01','ICE')]),'optional_clear invalidates old confirmation and candidate authorization');
  lateLinked.resolve([h.rows.store[0]]);
  check(!(await lateLinkedQuery).ok,'optional_clear rejects the previous filtered query arriving after the clear');
  equal(h.values.store,selectedBeforeClear,'late filtered response cannot rewrite or revalidate a cleared optional scope');
  for(const response of [new Error('模拟无参查询异常'),{ok:false,complete:false,items:[h.rows.store[1]],message:'模拟后续页失败'}]){
    h.respondOnce('store',response);
    const incomplete=await h.query('store');
    check(!incomplete.ok&&incomplete.items.length===0,'optional_clear rejects thrown or partial parameterless results as selectable candidates');
    equal(h.queries.at(-1).params,{},'optional_clear retries keep the upstream parameter omitted');
    equal(h.values.store,selectedBeforeClear,'optional_clear incomplete results never judge the preserved old store unmatched');
    check(!h.valid('store').ok&&!h.confirm('store')&&!h.F.chooseMany('seat-followup','store',[key('I01','ICE')]),'optional_clear failure cannot validate old values or authorize a new selection');
  }
  h.rows.store[0].name='模拟接口当前门店名';
  const fullStores=await h.query('store');
  equal(h.queries.at(-1).params,{},'optional_clear final complete query still has no series parameter');
  equal(fullStores.items.map(item=>item.code),['N01','I01'],'optional_clear complete query returns the full fictional authorized store scope');
  check(h.values.store.length===1&&h.values.store[0].state==='valid'&&h.values.store[0].verifiedScope===h.condition('store').stamp,'optional_clear complete matching result refreshes the existing valid store scope');
  check(h.values.store[0].name===selectedBeforeClear[0].name&&h.values.store[0].code===selectedBeforeClear[0].code,'optional_clear revalidation preserves the previously confirmed code/name snapshot');
  check(h.valid('store').ok&&h.C.validate(h.values,h.call).ok,'optional_clear complete matching lookup restores current validity without another selection');
  const clearedSave=h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''});
  check(clearedSave.ok&&clearedSave.values.series===''&&clearedSave.values.store.length===1&&clearedSave.values.store[0].code==='N01'&&clearedSave.values.store[0].name===selectedBeforeClear[0].name,'optional_clear saves the empty optional series and revalidated old store through the original journal');

  h=harness([makeField('series'),linked('store','series','seriesCode','code',false)]);
  h.field('store').required=true;
  await h.pick('series','NEV-A','NEV');await h.query('store');
  check(h.F.chooseMany('seat-followup','store',[key('N01','NEV')]),'optional_clear mismatch scenario starts with a real matching selection');
  const beforeMismatch=copy(h.values.store);
  h.F.clear('seat-followup','series');h.respondOnce('store',complete([h.rows.store[1]]));
  check((await h.query('store')).ok,'optional_clear mismatch is judged only from a complete parameterless result');
  equal(h.queries.at(-1).params,{},'optional_clear mismatch lookup is also parameterless');
  check(h.values.store.length===1&&h.values.store[0].code==='N01'&&h.values.store[0].name===beforeMismatch[0].name&&h.values.store[0].state==='pending','optional_clear actual mismatch preserves the old store and marks it pending');
  check(!h.valid('store').ok&&!h.C.validate(h.values,h.call).ok&&!h.confirm('store'),'optional_clear missing old store remains invalid and cannot be confirmed from absent candidates');
  h.respondOnce('store',{ok:false,complete:false,items:[h.rows.store[0]],message:'模拟重试仍未查全'});
  check(!(await h.query('store')).ok&&h.values.store[0].state==='pending','optional_clear partial rematch cannot restore an already pending old store');
  check((await h.query('store')).ok&&h.values.store[0].state==='pending'&&!h.valid('store').ok,'optional_clear later full rematch also requires explicit reconfirmation after a real mismatch');
  check(h.confirm('store')&&h.values.store[0].state==='valid'&&h.values.store[0].verifiedScope===h.condition('store').stamp&&h.C.validate(h.values,h.call).ok,'optional_clear explicit confirmation restores the rematched store in the parameterless scope');

  h=harness([makeField('series'),linked('store','series','seriesCode','code',true)]);
  h.field('store').required=true;
  await h.pick('series','NEV-A','NEV');await h.query('store');
  check(h.F.chooseMany('seat-followup','store',[key('N01','NEV')]),'required_clear contrast starts with a confirmed matching store');
  check(h.F.clear('seat-followup','series')&&!h.condition('store').ready,'required_clear blocks its downstream condition immediately');
  check(h.values.store.length===1&&h.values.store[0].code==='N01'&&h.values.store[0].state==='pending','required_clear preserves the old store but marks it pending immediately');
  const requiredClearQueries=h.queries.length;
  check(!(await h.query('store')).ok&&h.queries.length===requiredClearQueries,'required_clear never dispatches an unfiltered store query');
  check(!h.confirm('store')&&!h.valid('store').ok&&!h.C.validate(h.values,h.call).ok,'required_clear cannot confirm or submit the preserved store');
  await h.pick('series','NEV-A','NEV');await h.query('store');
  equal(h.queries.at(-1).params,{seriesCode:'NEV-A'},'required_clear recovery restores the required filtered parameter');
  check(h.values.store[0].state==='pending'&&!h.valid('store').ok,'required_clear restoring the old series and full result does not automatically confirm the store');
  check(h.confirm('store')&&h.valid('store').ok&&h.C.validate(h.values,h.call).ok,'required_clear explicit confirmation restores current validity');

  h=harness([makeField('series'),makeField('store',{required:true})]);
  check(h.condition('store').ready&&!h.condition('store').hasConditions,'independent multi-store field needs no intention series');
  const storeResult=await h.query('store');equal(h.queries.at(-1).params,{},'independent store uses a parameterless adapter query');
  check(storeResult.items.length===2&&h.F.chooseMany('seat-followup','store',[key('N01','NEV'),key('I01','ICE')]),'independent store can select all available returned types');
  const storeStamp=h.condition('store').stamp;
  await h.pick('series','NEV-A','NEV');await h.pick('series','ICE-A','ICE');
  check(h.condition('store').stamp===storeStamp&&h.valid('store').ok&&h.values.store.length===2,'unrelated series changes do not invalidate independent store selections');
  const saved=h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''});
  check(saved.ok&&saved.values.store.length===2&&saved.values.store[1].code==='I01','independent stores save through the original followup journal');

  h=harness([makeField('store')]);h.call.intentionStoreCode='I01';
  await h.F.bringOriginal('seat-followup');
  check(h.values.store.length===1&&h.values.store[0].code==='I01'&&h.valid('store').ok,'original store can be confirmed into an independent field without any imported series');
  check(h.call.intentionStoreCode==='I01'&&!h.call.intentionSeriesCode,'independent original-store import preserves the raw imported information');

  h=harness([makeField('series'),makeField('store')]);
  h.call.intentionSeriesCode='RETIRED-SERIES';h.call.intentionStoreCode='I01';
  await h.F.bringOriginal('seat-followup');
  equal(h.queries.map(row=>row.id),['series','store'],'unmatched imported series does not abort an independent original-store lookup');
  check(h.values.series===''&&h.values.store[0]?.code==='I01'&&h.valid('store').ok,'independent original store is confirmed while unmatched series stays empty');
  check(h.notices.at(-1)?.tone==='warning'&&h.notices.at(-1)?.message.includes('未匹配到原意向车系')&&h.notices.at(-1)?.message.includes('门店已单独核对带入'),'independent import preserves the unresolved series warning while explaining the store result');
  check(h.call.intentionSeriesCode==='RETIRED-SERIES'&&h.call.intentionStoreCode==='I01','partial original import never rewrites raw series or store information');
  await h.pick('series','NEV-A','NEV');h.set('series',{...h.values.series,state:'pending'});
  await h.F.bringOriginal('seat-followup');
  check(h.values.series.code==='NEV-A'&&h.values.series.state==='pending'&&h.values.store[0]?.code==='I01','independent store import preserves a previously filled invalid series without confirming or clearing it');
  check(!h.C.validate(h.values,h.call).ok,'filled invalid series still prevents saving even when independent store import succeeds');

  h=harness([makeField('series'),linked('store','series','seriesCode','code',true)]);
  h.call.intentionSeriesCode='RETIRED-SERIES';h.call.intentionStoreCode='I01';
  await h.F.bringOriginal('seat-followup');
  equal(h.queries.map(row=>row.id),['series'],'required dependency still stops original-store lookup when imported series is unmatched');
  check(h.values.store.length===0&&!h.condition('store').ready,'required dependency cannot import a store without its valid upstream series');
  check(h.notices.at(-1)?.message.includes('未匹配到原意向车系'),'required dependency reports the unresolved imported series');

  h=harness([makeField('series'),linked('store','series','seriesCode','code',false)]);
  h.call.intentionSeriesCode='RETIRED-SERIES';h.call.intentionStoreCode='I01';
  await h.F.bringOriginal('seat-followup');
  equal(h.queries.map(row=>row.id),['series','store'],'optional dependency continues original-store lookup after an unmatched imported series');
  equal(h.queries.at(-1).params,{},'optional empty series is omitted during original-store lookup');
  check(h.values.store[0]?.code==='I01'&&h.valid('store').ok,'optional empty series allows original-store confirmation');
  await h.pick('series','NEV-A','NEV');h.set('series',{...h.values.series,state:'pending'});h.F.clear('seat-followup','store');
  const prior=h.queries.length;await h.F.bringOriginal('seat-followup');
  check(h.queries.length===prior+1&&h.queries.at(-1).id==='series'&&h.values.store.length===0,'optional filled invalid series cannot silently fall back to an independent store import');
  check(h.values.series.code==='NEV-A'&&h.values.series.state==='pending','optional import preserves the unresolved filled series for correction');

  h=harness();await h.pick('A','A1');await h.pick('B','B1');
  const oldMode=h.delay('B'),oldModeQuery=h.query('B');await Promise.resolve();
  h.revise('B',{useQueryConditions:false});
  oldMode.resolve(h.rows.B);check(!(await oldModeQuery).ok&&!h.choose('B','B1'),'changing to independent mode never revives a previous linked query');
  await h.pick('B','B0');equal(h.queries.at(-1).params,{},'mode switch removes old parameter mapping from runtime requests');
  const oldParameter=h.delay('B'),oldParameterQuery=h.query('B');await Promise.resolve();
  h.revise('B',{useQueryConditions:true,parameterBinding:{parameterName:'changedRegion',sourceValueKey:'regionId',required:true}});
  oldParameter.resolve(h.rows.B);check(!(await oldParameterQuery).ok&&!h.choose('B','B0'),'changing parameter mapping rejects earlier query results');
  await h.pick('B','B1');equal(h.queries.at(-1).params,{changedRegion:'R1'},'new parameter name is passed exactly to the selected adapter');
  h.revise('B',{parameterBinding:{parameterName:'regionKey',sourceValueKey:'regionId',required:true}});
  check(!h.choose('B','B1')&&!h.valid('B').ok,'switching parameter name back does not revive old candidates or verified selection');

  h=harness([linked('A','C','rootKey'),linked('B','A','regionKey'),linked('C','B','districtKey')]);
  check(!h.condition('A').ready&&!h.condition('B').ready&&!h.condition('C').ready,'empty cyclic dependency graph is blocked without recursion overflow');
  check(!(await h.query('C')).ok&&h.queries.length===0,'cycle cannot call a downstream adapter');
  for(const id of ['A','B','C'])h.set(id,{code:id+'1',name:'模拟循环值',type:'TEST',entryId:id,state:'valid',sourceVersion:1,verifiedScope:'old'});
  check(!h.condition('C').ready&&!h.valid('C').ok,'populated legacy cyclic selections also fail closed');
  h=harness([linked('A','C','rootKey','code',false),linked('B','A','regionKey','code',false),linked('C','B','districtKey','code',false)]);
  check(!h.condition('A').ready&&!h.condition('B').ready&&!h.condition('C').ready,'optional empty links cannot make a cyclic graph runnable');
  check(!(await h.query('C')).ok&&h.queries.length===0,'optional-cycle guard also blocks adapter dispatch');
  console.log(JSON.stringify({passed:count,status:'passed',scope:'fictional generic A→B→C, optional_clear and required_clear store revalidation, optional input mapping and independent multi-store runtime'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
