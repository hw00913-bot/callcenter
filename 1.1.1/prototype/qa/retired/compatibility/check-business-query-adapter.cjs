/* Unified adapter boundary; local simulated queries only, no production contract. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const projectRoot = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const records = new Map();
let scope = {tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240'}, session = 'QUERY-ADAPTER-QA';
let ready = true, domain = 'CLOUD_CONTACT_CENTER', network = 0;
const fields = {};
const c = {
  setTimeout: (done,ms) => setTimeout(done,ms === 1600 ? 20 : 1),
  crypto: require('node:crypto').webcrypto,
  CustomEvent: class { constructor(type,opts={}) { this.type=type;this.detail=opts.detail; } },
  addEventListener() {}, dispatchEvent() {},
  fetch() { network++; throw Error('No network permitted in local adapter verification'); },
  document:{getElementById:id=>fields[id]},
  localStorage:{getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,String(value))},
  AppState:{
    isReady:()=>ready,isSuper:()=>true,canMenu:()=>true,
    get:()=>({...scope,accountId:'ACC-SUPER-001',sessionId:session,activeDomain:domain}),
    effectiveAccess:()=>({valid:ready}),
    authorizeObject:(_,row)=>row.tenantId===scope.tenantId && row.enterpriseId===scope.enterpriseId
  }
};
c.window=c;vm.createContext(c);
for(const file of ['mock/data.js','js/components/business-data.js']) vm.runInContext(fs.readFileSync(path.join(projectRoot,file),'utf8'),c,{filename:file});
let count=0;
const check=(condition,message)=>{assert.ok(condition,message);count++;};
const equal=(actual,expected,message)=>{assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected,message);count++;};
const codes=result=>Array.from(result.items,row=>row.code);
const blocked=(result)=>!result.ok&&!result.complete&&result.items.length===0;
(async()=>{
  const data=c.BusinessData, originalScope={...scope};
  check(typeof data.queryOptions==='function','field queries have one public adapter entry point');
  equal(data.capabilities.map(row=>row.id),['series','stores'],'only the existing two prebuilt capabilities are exposed');
  for(const [id,mode] of [['series','single'],['stores','multiple']]) {
    const cap=data.capability(id);
    check(cap.selectionMode===mode,'capability declares its selection cardinality: '+id);
    equal(cap.returnFields,[{key:'code',label:'编码'},{key:'name',label:'名称'},{key:'type',label:'体系'}],'capability declares supported upstream values: '+id);
    cap.returnFields[0].key='mutated';
    check(data.capability(id).returnFields[0].key==='code','returned metadata is a copy: '+id);
  }
  check(Object.isFrozen(data.capabilities[0].returnFields)&&Object.isFrozen(data.capabilities[0].returnFields[0]),'actual return declarations remain immutable');
  equal(data.capability('series').queryConditions,[],'series query does not require a preceding field');
  const condition=data.capability('stores').queryConditions[0];
  check(condition.key==='seriesCode'&&condition.required===false&&condition.sourceCardinality==='single'&&condition.valueKey==='code','store adapter recommends an optional single upstream code condition');
  equal(codes(await data.queryOptions('d-series',{},scope)),['NEV-A','NEV-B','ICE-A'],'conditionless series query uses its own adapter');
  equal(codes(await data.queryOptions('d-store',{},scope)),['N01','N02','N03','I01'],'independent store query includes every authorized mock type');
  equal(codes(await data.queryOptions('d-store',{seriesCode:'NEV-A'},scope)),['N01','N02'],'configured downstream key queries exact NEV A relations');
  equal(codes(await data.queryOptions('d-store',{seriesCode:'NEV-B'},scope)),['N02','N03'],'another source value queries its own exact relations');
  equal(codes(await data.queryOptions('d-store',{seriesCode:'ICE-A'},scope)),['I01'],'ICE lookup excludes NEV candidates');
  for(const value of ['',undefined]) equal(codes(await data.queryOptions('d-store',{seriesCode:value},scope)),['N01','N02','N03','I01'],'empty optional adapter value means independent query');
  const noPrototype=Object.create(null);noPrototype.seriesCode='NEV-A';
  equal(codes(await data.queryOptions('d-store',noPrototype,scope)),['N01','N02'],'safe plain parameter maps do not require an Object prototype');
  for(const params of [{carCode:'NEV-A'},{seriescode:'NEV-A'},{seriesCode:'NEV-A',extra:''},{name:'NEV 演示车系 A'},null,[],new Date(),{'__proto__':null,bad:'NEV-A'},JSON.parse('{"__proto__":"NEV-A"}')]) {
    const result=await data.queryOptions('d-store',params,scope);
    check(blocked(result)&&result.message==='入参字段名与当前取数接口不匹配，请核对配置','unsupported parameter mapping cannot silently become an all-store lookup: '+JSON.stringify(params));
  }
  for(const value of ['NEV 演示车系 A',null,['NEV-A'],'NEV-A,NEV-B','NEV-A ','__proto__',{},1]) {
    const result=await data.queryOptions('d-store',{seriesCode:value},scope);
    check(blocked(result)&&result.message.includes('有效车系编码'),'the adapter rejects values that are not actual singular codes: '+JSON.stringify(value));
  }
  const noParams=await data.queryOptions('d-series',{seriesCode:'NEV-A'},scope);
  check(blocked(noParams)&&noParams.message.includes('入参字段名'),'a conditionless adapter does not accept arbitrary downstream keys');
  check(blocked(await data.querySeries('d-store',scope))&&blocked(await data.queryStores('d-series','NEV-A',scope)),'legacy wrappers retain their original capability-kind checks');
  check(blocked(await data.queryOptions('d-missing',{},scope)),'missing entries cannot supply independent candidates');
  for(const mode of ['empty','partial','failure']) {
    data.env.query=mode;const result=await data.queryOptions('d-store',{},scope);
    check(mode==='empty'?result.ok&&result.complete&&!result.items.length:blocked(result),'independent lookup preserves completeness semantics: '+mode);
  }
  data.env.query='normal';
  ready=false;check(blocked(await data.queryOptions('d-store',{},scope)),'independent lookup requires an active identity');ready=true;
  domain='OTHER';check(blocked(await data.queryOptions('d-store',{},scope)),'independent lookup remains in the authorized business domain');domain='CLOUD_CONTACT_CENTER';
  check(blocked(await data.queryOptions('d-store',{}, {...scope,enterpriseId:'bad'})),'unfiltered lookup cannot escape the tenant enterprise pair');
  data.setTenants('d-store',['TEN-NISSAN-SH']);
  check(blocked(await data.queryOptions('d-store',{},scope)),'tenant deauthorization blocks unfiltered queries');
  data.setTenants('d-store',['TEN-NISSAN-HQ','TEN-NISSAN-SH']);
  data.env.query='delay';const late=data.queryOptions('d-store',{},scope);data.setEnabled('d-store',false);data.setEnabled('d-store',true);
  check(blocked(await late),'disable and restore cannot revive an old independent lookup');
  const changedIdentity=data.queryOptions('d-store',{},scope);session='QUERY-ADAPTER-SECOND';check(blocked(await changedIdentity),'generic queries reject results from an earlier identity session');
  const changedScope=data.queryOptions('d-store',{},scope);scope={tenantId:'TEN-NISSAN-SH',enterpriseId:'7522240'};check(blocked(await changedScope),'generic queries reject a tenant switch during a request');
  scope=originalScope;data.env.query='normal';
  const returned=await data.queryOptions('d-store',{},scope);returned.items.length=0;
  check((await data.queryOptions('d-store',{},scope)).items.length===4,'returned independent options cannot mutate adapter seeds');
  check(network===0,'all scenarios remain local mocks without external requests');
  console.log(JSON.stringify({ok:true,assertions:count,scope:'generic adapter inputs, optional dependency, authorization and complete local results'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
