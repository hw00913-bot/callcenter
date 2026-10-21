/* Independent DCC v2 fixture regression. No real API, authority or production-readiness assertion. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const projectRoot = path.resolve(process.argv[2] || path.join(__dirname,'..'));
const scope = {tenantId:'DCC_DEMO_TENANT',enterpriseId:'DCC_DEMO_ENTERPRISE'};
const S = ['N7','N8','ARIYA','ICE_A','ICE_B'].map(code => 'DCC_DEMO_SERIES_' + code);
const C = [1,2,3,4,5,6].map(n => 'DCC_DEMO_STORE_' + String(n).padStart(3,'0'));
const missing = ['group','businessType','status','phone'];
const iceNulls = ['dlrFullName','spokenAddress','carSeriesCn','carSeriesCnCarSeriesCode','testDriveSeriesCn','testDriveSeriesCnCode'];
const rawKeys = ['dealerName','dealerCode','address','provinceName','cityName','countyName','tencentLongitude','tencentLatitude',...iceNulls].sort();
const json = value => JSON.parse(JSON.stringify(value));
let count = 0;
const check = (condition,message) => { assert.ok(condition,message); count++; };
const equal = (actual,expected,message) => { assert.deepStrictEqual(json(actual),json(expected),message); count++; };
function harness(transform) {
  const calls = [], state = {timers:0,external:0};
  const c = {console,
    setTimeout(callback) { state.timers++; return setTimeout(callback,1); },
    fetch() { state.external++; throw Error('external-network-forbidden'); },
    XMLHttpRequest:function () { state.external++; throw Error('external-network-forbidden'); }
  };
  c.window = c;
  vm.createContext(c);
  for (const file of ['mock/dcc-business-data.js','js/components/dcc-business-adapter.js']) {
    vm.runInContext(fs.readFileSync(path.join(projectRoot,file),'utf8'),c,{filename:file});
  }
  const fixture = c.DccBusinessMock;
  c.DccBusinessMock = {...fixture,page:async (input,scenario,currentScope) => {
    calls.push({input:json(input),scenario,scope:json(currentScope)});
    const response = await fixture.page(input,scenario,currentScope);
    return transform ? transform(response,input,scenario,currentScope) : response;
  }};
  return {c,calls,state,fixture,query:options => c.DccBusinessAdapter.query({params:{},scope:json(scope),...options})};
}
const complete = result => result.ok === true && result.complete === true;
const failed = result => result.ok === false && result.complete === false && Array.isArray(result.items) && !result.items.length;
(async () => {
  const h = harness();
  equal(h.fixture.scenarios.map(row => row.id),['normal','empty','page_failure','page_mismatch','bad_relation','delay'],'documented scenario IDs remain stable');
  check(h.fixture.scenarios.find(row => row.id === 'bad_relation').label.includes('NEV') && h.fixture.scenarios.find(row => row.id === 'bad_relation').label.includes('ICE 不适用'),'relation error visibly limited to NEV');
  equal(h.fixture.series().map(row => row.code),S,'independent catalog contains explicit ARIYA and two ICE series');
  equal(h.fixture.stores().map(row => row.code),C,'six independent stores');
  for (const store of h.fixture.stores()) equal(Object.keys(store).sort(),['code','name'],'rename list only provides code and name');
  check(h.fixture.series().every(row => row.type === 'NEV' || row.type === 'ICE'),'types declared in controlled catalog');
  const raws = {};
  for (const sourceType of ['NEV','ICE']) {
    raws[sourceType] = [];
    for (const page of [1,2]) {
      const raw = await h.fixture.page({sourceType,page,perPage:2},'normal',scope);
      equal(Object.keys(raw).sort(),['msg','pageindex','pages','records','result','rows'],'raw v2 envelope has six formal fields');
      check(raw.result === '1' && raw.pageindex === page && raw.pages === 2 && raw.records === 3 && raw.rows.length === (page === 1 ? 2 : 1),'each fictional source uses self-consistent pages and records');
      for (const row of raw.rows) equal(Object.keys(row).sort(),rawKeys,'raw v2 rows only have the fourteen selected fields');
      raws[sourceType].push(...raw.rows);
    }
  }
  check(raws.ICE.every(row => iceNulls.every(key => row[key] === null)),'ICE company, spoken address, authorization and test-drive six fields are null');
  check(raws.NEV.every(row => row.carSeriesCnCarSeriesCode.includes(S[2]) && iceNulls.every(key => typeof row[key] === 'string' && row[key])),'NEV source has explicit fictional ARIYA authorization and coherent strings');
  check(h.fixture.relations().every(row => row.type === 'NEV' && row.seriesCodes.includes(S[2])),'no invented exact ICE relation; all NEV relations include ARIYA');
  for (const sourceType of ['nev','NeV','ice','IcE']) {
    const raw = await h.fixture.page({sourceType,page:1,perPage:2},'normal',scope);
    check(raw.result === '1' && raw.rows[0].dealerCode === (sourceType.toUpperCase() === 'ICE' ? C[3] : C[0]),'sourceType is case insensitive');
  }
  const rawBase = await h.fixture.page({sourceType:'NEV',page:1,perPage:2},'normal',scope);
  equal(await h.fixture.page({sourceType:'NEV',page:1,perPage:2,seriesCode:S[4],energyType:'ICE',tenantId:'foreign',countyName:'does not apply'},'normal',scope),rawBase,'extra raw parameters have no effect and never filter by internal series');
  equal(await h.fixture.page({sourceType:'NEV',per_page:1},'normal',scope),rawBase,'v1 per_page is ignored; pagination defaults are only local demo conventions');
  const rawAll = await h.fixture.page({sourceType:'NEV',page:1,perPage:3},'normal',scope);
  check(rawAll.pages === 1 && rawAll.records === 3 && rawAll.rows.length === 3,'perPage uses v2 camel case');
  const province = await h.fixture.page({sourceType:'NEV',provinceName:'示省',page:1,perPage:2},'normal',scope);
  check(province.records === 3,'province uses substring simulation of fuzzy matching');
  const city = await h.fixture.page({sourceType:'ICE',cityName:'市乙',page:1,perPage:2},'normal',scope);
  equal(city.rows.map(row => row.dealerCode),C.slice(4),'city fuzzy match remains within controlled source');
  check(city.records === 2 && city.pages === 1,'raw region filter updates records and page count');
  for (const input of [{},{page:1,perPage:2},{sourceType:''},{sourceType:'bad'},{sourceType:1},{sourceType:' NEV'},
    {sourceType:'NEV',page:'1'},{sourceType:'NEV',page:0},{sourceType:'NEV',page:1.1},{sourceType:'NEV',page:3},
    {sourceType:'NEV',perPage:'2'},{sourceType:'NEV',perPage:0},{sourceType:'NEV',perPage:1.1},{sourceType:'NEV',perPage:51},{sourceType:'NEV',cityName:3}]) {
    check((await h.fixture.page(input,'normal',scope)).result !== '1','invalid raw mandatory source/pagination/region rejected as local demo rule');
  }
  const all = await h.query();
  check(complete(all),'all allowed source pagination succeeds');
  equal(all.items.map(row => row.code),C,'independent query aggregates complete NEV and ICE source');
  const expectedRequests = ['NEV','ICE'].flatMap(sourceType => [1,2].map(page => ({sourceType,page,perPage:2})));
  equal(h.calls.map(row => row.input),expectedRequests,'adapter only sends sourceType/page/perPage');
  check(all.meta.pagesRead === 4 && all.meta.totalPages === 4,'completion metadata sums all required source pages');
  equal(all.meta.requestedPages,[1,2,1,2],'page audit spans both sources');
  equal(all.meta.requests,expectedRequests,'request audit disambiguates source and page');
  equal(all.meta.requestedSources,['NEV','ICE'],'all mock-allowed sources explicitly requested');
  equal(all.meta.sourceSummaries,[{sourceType:'NEV',pagesRead:2,totalPages:2,records:3},{sourceType:'ICE',pagesRead:2,totalPages:2,records:3}],'per-source count evidence retained');
  check(all.meta.simulated && !all.meta.productionContractVerified && all.meta.namespace === 'DCC_DEMO','metadata labels simulation with production gaps retained');
  equal(all.meta.scope,scope,'scope is copied as fixture context only');
  for (const row of all.items) {
    check(row.code.startsWith('DCC_DEMO_STORE_') && row.seriesCodes.every(code => code.startsWith('DCC_DEMO_SERIES_')),'normalized identities use independent namespace');
    check(row.address && row.province === '演示省' && row.city && row.district,'shared basic fields and county mapped');
    equal(row.missingFields,missing,'only four unsupported fields marked missing');
    for (const key of missing) check(row[key] === null,'missing '+key+' never fabricated');
  }
  for (const [code,wanted] of [[S[0],C.slice(0,2)],[S[1],C.slice(1,3)],[S[2],C.slice(0,3)],[S[3],C.slice(3)],[S[4],C.slice(3)]]) {
    const before = h.calls.length;
    const result = await h.query({params:{seriesCode:code}});
    const type = code.includes('ICE_') ? 'ICE' : 'NEV';
    check(complete(result),'series query completes its controlled source');
    equal(result.items.map(row => row.code),wanted,type === 'ICE' ? 'each ICE series returns full available source' : 'exact NEV relation is not same-source union');
    check(h.calls.length - before === 2,'filtered result still reads complete source pages');
    check(h.calls.slice(before).every(call => call.input.sourceType === type && Object.keys(call.input).sort().join(',') === 'page,perPage,sourceType'),'resolved source only, no internal series/province/county/tenant/energy payload');
    equal(result.meta.requestedSources,[type],'single selected series only requests one source');
    check(result.items.every(row => row.type === type),'normalized type comes from controlled request source');
    if (type === 'ICE') check(result.items.every(row => !row.seriesCodes.length && !row.seriesNames.length),'ICE never fabricated into exact selected-series relation');
    else check(result.items.every(row => row.seriesCodes.length === 1 && row.seriesCodes[0] === code),'NEV filtered metadata includes only exact selected code');
  }
  const iceA = await h.query({params:{seriesCode:S[3]}}), iceB = await h.query({params:{seriesCode:S[4]}});
  equal(iceA.items,iceB.items,'switching ICE series yields identical complete source candidates');
  for (const absent of [{},{seriesCode:undefined},{seriesCode:''}]) {
    const result = await h.query({params:absent});
    check(complete(result) && result.items.length === 6 && result.meta.pagesRead === 4,'absent internal condition queries all allowed sources');
  }
  for (const code of [null,[],[S[0]],[S[0],S[1]],{},1,true,S.join(','),S[0]+' ',S[0].slice(0,-1),'NEV-A','ICE-A','AE01','toString','__proto__']) {
    const before = h.calls.length;
    check(failed(await h.query({params:{seriesCode:code}})),'invalid/multiple/foreign code fails closed: '+JSON.stringify(code));
    check(h.calls.length === before,'invalid series rejected before any page');
  }
  const symbolParams = {seriesCode:S[0]}; symbolParams[Symbol('bad')] = 'bad';
  const hiddenParams = {}; Object.defineProperty(hiddenParams,'wrong',{value:S[0]});
  for (const params of [null,[],1,'bad',{seriesCode:S[0],query:'bad'},{series_code:S[0]},{sourceType:'ICE'},symbolParams,hiddenParams]) {
    check(failed(await h.query({params})),'unknown internal mapping parameters fail unlike ignored extra raw fields');
  }
  for (const invalidScope of [undefined,null,{}, {tenantId:scope.tenantId},{...scope,enterpriseId:''},{...scope,tenantId:1}]) {
    check(failed(await h.c.DccBusinessAdapter.query({params:{},scope:invalidScope})),'missing local scope rejected');
  }
  const empty = await h.query({scenario:'empty'});
  check(complete(empty) && !empty.items.length && empty.meta.pagesRead === 2 && empty.meta.sourceSummaries.every(row => row.records === 0),'empty only complete after both allowed source envelopes checked');
  check(empty.message.includes('暂无') && !empty.message.includes('失败'),'complete empty differs from failure');
  for (const scenario of ['page_failure','page_mismatch','bad_relation']) {
    const before = h.calls.length;
    const result = await h.query({scenario,params:{seriesCode:S[0]}});
    check(failed(result),'second-page '+scenario+' discards matching first-page candidates');
    check(h.calls.length - before === 2,'actual later page error checked');
    check(result.message && result.message !== empty.message,'partial error differs from empty');
  }
  check(complete(await h.query({scenario:'bad_relation',params:{seriesCode:S[3]}})),'NEV relation injection is not applicable to ICE');
  const iceLaterFailure = harness((r,p) => p.sourceType === 'ICE' && p.page === 2 ? {...r,result:'0',rows:[]} : r);
  const aggregateFailure = await iceLaterFailure.query();
  check(failed(aggregateFailure) && iceLaterFailure.calls.length === 4,'last source failure discards all earlier NEV/ICE candidates');
  equal(aggregateFailure.meta.sourceSummaries.map(row => row.sourceType),['NEV'],'failed aggregate never claims ICE complete');
  const beforeUnknown = h.calls.length;
  check(failed(await h.query({scenario:'unknown'})) && h.calls.length === beforeUnknown,'unknown scenario rejected without pages');
  check(complete(await h.query({scenario:'delay'})),'delay completes with unchanged context');
  const changes = [
    ['non-success result', (r,p) => p.page === 2 ? {...r,result:1} : r],
    ['page count changes', (r,p) => p.page === 2 ? {...r,pages:3} : r],
    ['wrong page type', r => ({...r,pageindex:String(r.pageindex)})],
    ['zero pages', r => ({...r,pages:0})],
    ['unbounded pages', r => ({...r,pages:101})],
    ['missing records', r => { const next={...r}; delete next.records; return next; }],
    ['wrong records type', r => ({...r,records:String(r.records)})],
    ['negative records', r => ({...r,records:-1})],
    ['records/pages mismatch', r => ({...r,records:1})],
    ['records changes', (r,p) => p.page === 2 ? {...r,records:4} : r],
    ['rows not array', r => ({...r,rows:{}})],
    ['short non-tail page', (r,p) => p.page === 1 ? {...r,rows:r.rows.slice(0,1)} : r],
    ['empty final page', (r,p) => p.page === 2 ? {...r,rows:[]} : r],
    ['oversized final page', (r,p) => p.page === 2 ? {...r,rows:[...r.rows,...r.rows]} : r],
    ['empty name', r => ({...r,rows:r.rows.map((v,i) => i ? v : {...v,dealerName:''})})],
    ['nonstring code', r => ({...r,rows:r.rows.map((v,i) => i ? v : {...v,dealerCode:4})})],
    ['foreign code', r => ({...r,rows:r.rows.map((v,i) => i ? v : {...v,dealerCode:'N01'})})],
    ['duplicate code', (r,p) => p.page === 2 ? {...r,rows:r.rows.map((v,i) => i ? v : {...v,dealerCode:C[0]})} : r],
    ['empty NEV relationship', r => ({...r,rows:r.rows.map((v,i) => i ? v : {...v,carSeriesCnCarSeriesCode:''})})],
    ['unknown relation suffix', r => ({...r,rows:r.rows.map((v,i) => i ? v : {...v,carSeriesCnCarSeriesCode:v.carSeriesCnCarSeriesCode+'-extra'})})],
    ['mismatching relation display', r => ({...r,rows:r.rows.map((v,i) => i ? v : {...v,carSeriesCn:'unknown'})})],
    ['invalid province type', r => ({...r,rows:r.rows.map((v,i) => i ? v : {...v,provinceName:{label:'bad'}})})],
    ['invalid county type', r => ({...r,rows:r.rows.map((v,i) => i ? v : {...v,countyName:9})})]
  ];
  for (const [label,transform] of changes) {
    const broken = harness(transform);
    check(failed(await broken.query({params:{seriesCode:S[0]}})),'malformed source cannot authorize new choices: '+label);
    check(broken.state.external === 0,'no external request for '+label);
  }
  const crossSourceDuplicate = harness((r,p) => p.sourceType === 'ICE' && p.page === 1 ? {...r,rows:r.rows.map((row,i) => i ? row : {...row,dealerCode:C[0]})} : r);
  check(failed(await crossSourceDuplicate.query()),'duplicate store across sources never ambiguously merged');
  const unsupported = harness(r => ({...r,extInfo:'ignored',rows:r.rows.map(row => ({...row,type:'ICE',energyType:'ICE',district:'伪造区县',group:'伪造小组',businessType:'伪造类型',status:'启用',phone:'12345'}))}));
  const clean = await unsupported.query({params:{seriesCode:S[0]}});
  check(complete(clean) && clean.items.length === 2,'unsupported response extras do not alter valid NEV match');
  check(clean.items.every(row => row.type === 'NEV' && row.district !== '伪造区县' && missing.every(key => row[key] === null)),'source type, county and missing fields only use approved mapping');
  const iceFakeRelation = harness(r => ({...r,rows:r.rows.map(row => ({...row,carSeriesCn:'伪造NEV',carSeriesCnCarSeriesCode:'unknown',energyType:'NEV',type:'NEV'}))}));
  const cleanIce = await iceFakeRelation.query({params:{seriesCode:S[4]}});
  check(complete(cleanIce) && cleanIce.items.length === 3 && cleanIce.items.every(row => row.type === 'ICE' && !row.seriesCodes.length && !row.seriesNames.length),'ICE relation or energy extras cannot create exact authorization or infer type');
  const optionalMissing = harness(r => ({...r,rows:r.rows.map(row => { const next={...row}; delete next.address; delete next.countyName; return next; })}));
  const sparse = await optionalMissing.query();
  check(complete(sparse) && sparse.items.every(row => row.address === null && row.district === null && row.missingFields.includes('address') && row.missingFields.includes('district')),'absent optional basic fields explicitly empty');
  const renamed = await h.query({params:{seriesCode:S[0]},rename:code => code === C[0] ? '新门店名' : code === S[0] ? '新车系名' : undefined});
  check(renamed.items[0].name === '新门店名' && renamed.items[1].name !== '新门店名','rename exact store code only');
  check(renamed.items.every(row => row.seriesNames[0] === '新车系名'),'NEV relationship display uses current catalog override');
  check((await h.fixture.page({sourceType:'NEV',page:1,perPage:2},'normal',scope)).rows[0].dealerName !== '新门店名','rename does not mutate raw fixture');
  const noInference = harness(r => ({...r,rows:r.rows.map(row => ({...row,dealerName:'ICE 字样不决定体系'}))}));
  check((await noInference.query({params:{seriesCode:S[0]}})).items.every(row => row.type === 'NEV'),'type is never inferred from names');
  let alive = false;
  const firstCancel = harness();
  check(failed(await firstCancel.query({isCurrent:() => alive})) && !firstCancel.calls.length,'cancel before first page');
  alive = true;
  const between = harness((r,p) => { if (p.page === 1) alive=false; return r; });
  check(failed(await between.query({isCurrent:() => alive})) && between.calls.length === 1,'revocation after first page prevents partial choice');
  alive = true;
  const afterNEV = harness((r,p) => { if (p.sourceType === 'NEV' && p.page === 2) alive=false; return r; });
  check(failed(await afterNEV.query({isCurrent:() => alive})) && afterNEV.calls.length === 2,'revocation between sources prevents ICE and all partial choices');
  alive = true;
  const afterLast = harness((r,p) => { if (p.sourceType === 'ICE' && p.page === 2) alive=false; return r; });
  check(failed(await afterLast.query({isCurrent:() => alive})) && afterLast.calls.length === 4,'revocation during last source page rejects whole result');
  alive = true;
  const duringNormalize = harness();
  check(failed(await duringNormalize.query({isCurrent:() => alive,rename:() => { alive=false; }})),'final guard covers normalization revocation');
  const guardThrows = harness();
  check(failed(await guardThrows.query({isCurrent:() => { throw Error('scope revoked'); }})),'guard exception fails closed');
  const rejection = harness((r,p) => { if (p.sourceType === 'ICE' && p.page === 2) throw Error('simulated transport error'); return r; });
  check(failed(await rejection.query()),'rejected last source page discards every prior candidate');
  check(failed(await h.query({rename:() => { throw Error('rename failed'); }})),'rename hook failure fails closed');
  check(failed(await h.query({rename:() => 3})),'invalid rename result fails closed');
  const inputScope = json(scope);
  const changing = harness();
  const pending = changing.query({scope:inputScope,isCurrent:() => inputScope.tenantId === scope.tenantId});
  inputScope.tenantId = 'CHANGED';
  check(failed(await pending),'caller scope change guarded during pending page');
  const invalidCatalog = harness();
  invalidCatalog.c.DccBusinessMock = {...invalidCatalog.c.DccBusinessMock,series:() => [{code:S[0],name:'模拟',type:'unexpected'}]};
  check(failed(await invalidCatalog.query()) && !invalidCatalog.calls.length,'unknown source in catalog rejected before reads');
  const invalidRelation = harness();
  invalidRelation.c.DccBusinessMock = {...invalidRelation.c.DccBusinessMock,relations:() => [{carSeriesCn:'模拟',carSeriesCnCarSeriesCode:'模拟-'+S[3],seriesCodes:[S[3]],type:'ICE'}]};
  check(failed(await invalidRelation.query()) && !invalidRelation.calls.length,'ICE exact relation registry is not invented');
  const isolated = await h.query();
  isolated.items[0].name = 'mutated'; isolated.items[0].seriesCodes.push('NEV-A'); isolated.items[0].missingFields.length=0; isolated.meta.scope.tenantId='mutated'; isolated.meta.requests[0].sourceType='bad';
  const unchanged = await h.query();
  check(unchanged.items[0].name !== 'mutated' && !unchanged.items[0].seriesCodes.includes('NEV-A'),'result mutation cannot change later choices');
  equal(unchanged.items[0].missingFields,missing,'nested missing metadata isolated');
  equal(unchanged.meta.scope,scope,'scope metadata isolated');
  equal(unchanged.meta.requests,expectedRequests,'request audit detached');
  const fixtureSeries = h.fixture.series(); fixtureSeries[0].type='ICE'; fixtureSeries[0].name='mutated';
  const fixtureRelations = h.fixture.relations(); fixtureRelations[0].seriesCodes[0]='NEV-A';
  const fixtureStores = h.fixture.stores(); fixtureStores[0].name='mutated';
  raws.NEV[0].dealerName='mutated';
  check(h.fixture.series()[0].type === 'NEV' && h.fixture.series()[0].name !== 'mutated','catalog objects detached');
  check(h.fixture.relations()[0].seriesCodes[0] === S[0],'relation arrays detached');
  check(h.fixture.stores()[0].name !== 'mutated','rename list detached');
  check((await h.fixture.page({sourceType:'NEV',page:1,perPage:2},'normal',scope)).rows[0].dealerName !== 'mutated','page rows detached');
  check(h.state.timers > 0 && h.state.external === 0,'async local timer only; no external request');
  console.log(JSON.stringify({ok:true,assertions:count,scope:'independent DCC_DEMO v2 fixture; NEV exact / ICE complete source / all sources complete; no real API or authority validation'}));
})().catch(error => { console.error(error); process.exitCode=1; });
