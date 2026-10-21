/* Local mock picker examples only; no production interface contract asserted. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert/strict');
const projectRoot = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const scope = {tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240'};
const records = new Map();
const c = {
  setTimeout: callback => setTimeout(callback, 1),
  localStorage: {getItem:key => records.get(key) ?? null,setItem:(key,value) => records.set(key,String(value))},
  addEventListener: () => {},
  AppState: {
    get: () => ({...scope,accountId:'ACC-OPS-CHEN',sessionId:'METADATA-QA',activeDomain:'CLOUD_CONTACT_CENTER'}),
    isReady: () => true,
    effectiveAccess: () => ({valid:true}),
    authorizeObject: (_,row) => row.enterpriseId === scope.enterpriseId && row.tenantId === scope.tenantId
  }
};
c.window = c;
vm.createContext(c);
for (const file of ['mock/data.js','js/components/business-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(projectRoot,file),'utf8'),c,{filename:file});
}
require('./fixtures/current-generic.cjs').dictionary(c,{scope});
let count = 0;
const check = (test,message) => { assert.ok(test,message); count++; };
const list = value => Array.from(value).join(',');
(async () => {
  const data = c.BusinessData;
  const single = await data.queryStores('d-fixture-store','NEV-A',scope);
  check(single.ok && single.complete && list(single.items.map(row => row.code)) === 'N01,N02','same exact single-series result');
  check(single.items.every(row => list(row.seriesCodes) === 'NEV-A'),'single-series rows do not expose other supported series');
  check(single.items.every(row => list(row.seriesNames) === 'NEV 演示车系 A'),'single-series display names correspond to requested series');
  const other = await data.queryStores('d-fixture-store','NEV-B',scope);
  const ice = await data.queryStores('d-fixture-store','ICE-A',scope);
  check(other.ok && other.complete && list(other.items.map(row => row.code)) === 'N02,N03','NEV B lookup has its own exact stores without a union');
  const shared = other.items.find(row => row.code === 'N02');
  check(list(shared.seriesCodes) === 'NEV-B','a shared store exposes only the one currently selected series');
  check(list(shared.seriesNames) === 'NEV 演示车系 B','a shared store displays only the current series name');
  check(list(other.items.find(row => row.code === 'N03').seriesCodes) === 'NEV-B','unrelated series are absent from a row');
  check(ice.ok && ice.complete && list(ice.items.map(row => row.code)) === 'I01' && list(ice.items[0].seriesCodes) === 'ICE-A','ICE association remains exact');
  const rows = [...single.items,...other.items.filter(row => row.code !== 'N02'),...ice.items];
  const metadata = ['province','city','district','address','group','businessType','status','phone'];
  check(rows.every(row => metadata.every(key => typeof row[key] === 'string' && row[key].trim())),'all four mock rows support picker details and filters');
  check(new Set(rows.map(row => row.city)).size > 1 && new Set(rows.map(row => row.businessType)).size > 1,'picker examples offer useful region and business-type filtering');
  check(rows.every(row => row.address.includes('（虚构）')),'mock addresses identify fictional examples');
  check(rows.map(row => row.type).join(',') === 'NEV,NEV,NEV,ICE','metadata does not change existing store type');
  check(rows.every(row => row.seriesCodes.length === 1 && row.seriesNames.length === 1),'every selectable row carries only a single series for picker display');
  shared.seriesCodes.push('ICE-A');
  shared.city = 'mutated';
  const again = await data.queryStores('d-fixture-store','NEV-B',scope);
  check(list(again.items.find(row => row.code === 'N02').seriesCodes) === 'NEV-B','each response derives only its current requested series');
  check(again.items.find(row => row.code === 'N02').city === '深圳市','mutating returned metadata cannot alter seed data');
  const all = await data.queryOptions('d-fixture-store',{},scope);
  check(all.ok && all.complete && list(all.items.map(row => row.code)) === 'N01,N02,N03,I01','independent lookup returns all available mock stores across NEV and ICE');
  check(list(all.items.find(row => row.code === 'N02').seriesCodes) === 'NEV-A,NEV-B','independent lookup reverses the shared store actual mock relations');
  check(list(all.items.find(row => row.code === 'N02').seriesNames) === 'NEV 演示车系 A,NEV 演示车系 B','independent lookup displays both actual associated series names');
  check(list(all.items.find(row => row.code === 'N01').seriesCodes) === 'NEV-A' && list(all.items.find(row => row.code === 'N03').seriesCodes) === 'NEV-B','independent rows do not inherit an unrelated current series');
  check(list(all.items.find(row => row.code === 'I01').seriesCodes) === 'ICE-A','independent ICE row retains its actual relation');
  all.items.find(row => row.code === 'N02').seriesCodes.push('ICE-A');
  const allAgain = await data.queryOptions('d-fixture-store',{},scope);
  check(list(allAgain.items.find(row => row.code === 'N02').seriesCodes) === 'NEV-A,NEV-B','independent relation arrays cannot mutate mock seeds');
  data.env.query = 'partial';
  const partial = await data.queryStores('d-fixture-store','NEV-A',scope);
  check(!partial.ok && !partial.complete && partial.items.length === 0,'incomplete queries do not leak selectable metadata rows');
  const multiple = await data.queryStores('d-fixture-store',['NEV-A','NEV-B'],scope);
  check(!multiple.ok && !multiple.complete && !multiple.items.length,'array conditions cannot generate selectable metadata rows');
  console.log(JSON.stringify({ok:true,assertions:count,scope:'fictional local store metadata; exact single condition or independent authorized lookup'}));
})().catch(error => { console.error(error); process.exitCode = 1; });
