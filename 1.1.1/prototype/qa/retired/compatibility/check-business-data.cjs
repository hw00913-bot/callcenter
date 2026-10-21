/* Local model regression only. Does not assert real interface readiness. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert/strict');
const projectRoot = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const records = new Map(), events = [], listeners = {};
let superUser = true;
let scope = { tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240' };
let session = 'SESSION-1';
const c = {
  console,
  setTimeout: (callback, milliseconds) => setTimeout(callback, milliseconds === 1600 ? 35 : 1),
  crypto: require('crypto').webcrypto,
  CustomEvent: class {
    constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
  },
  localStorage: {
    getItem: key => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, String(value))
  },
  addEventListener: (key, callback) => { listeners[key] = callback; },
  dispatchEvent: event => events.push(event),
  AppState: {
    get: () => ({ ...scope, accountId: superUser ? 'ACC-SUPER-001' : 'ACC-OPS-CHEN', sessionId: session, activeDomain: 'CLOUD_CONTACT_CENTER' }),
    isReady: () => true,
    isSuper: () => superUser,
    canMenu: permission => superUser && permission === 'system.applications',
    effectiveAccess: () => ({ valid: true, roleCode: superUser ? 'SUPER_ADMIN' : 'OPERATOR' }),
    authorizeObject: (_, row) => row.enterpriseId === scope.enterpriseId && row.tenantId === scope.tenantId
  }
};
c.window = c;
c.document = {};
vm.createContext(c);
for (const file of ['mock/data.js', 'js/components/business-data.js', 'js/components/customer-business.js']) {
  vm.runInContext(fs.readFileSync(path.join(projectRoot, file), 'utf8'), c, { filename: file });
}
let count = 0;
const check = (test, message) => { assert.ok(test, message); count++; };
(async () => {
  const b = c.BusinessData, t = scope;
  check(b.tenants().length === 3, 'real tenant count');
  check(b.tenants()[0].tenantId === 'TEN-NISSAN-HQ', 'real tenant id');
  check(b.entries().length === 2, 'seed entries');
  check(b.capability('stores').kind === 'store', 'store kind');
  check(b.available('d-series', t), 'available real scope');
  check(!b.available('d-series', { ...t, enterpriseId: 'bad' }), 'enterprise mismatch denied');
  check(!b.available('d-series', { tenantId: 't1', enterpriseId: '7522240' }), 'fake tenant denied');
  check(b.references('d-series').length === 3, 'one default series field referenced across three real tenants');
  const legacyCatalog=c.CustomerBusiness.catalog(t);
  const legacyFields=JSON.parse(JSON.stringify(legacyCatalog.fields));legacyFields.push({id:'backupSeries',label:'备选意向车系',type:'interface',dictionaryId:'d-series',depends:[],businessKey:'',options:[],enabled:true});
  records.set(c.CustomerBusiness.storageKey,JSON.stringify({version:3,revision:0,scopes:[{...t,fields:legacyFields,types:legacyCatalog.rows}]}));
  check(b.references('d-series').length===3 && !b.references('d-series').some(row=>row.fieldId==='backupSeries'),'legacy retired backup is absent from current interface references');
  legacyFields[legacyFields.length-1]={...legacyFields[legacyFields.length-1],label:'旧业务门店',dictionaryId:'d-store',depends:['intendedSeries']};
  records.set(c.CustomerBusiness.storageKey,JSON.stringify({version:3,revision:0,scopes:[{...t,fields:legacyFields,types:legacyCatalog.rows}]}));
  check(b.references('d-store').some(row=>row.fieldId==='backupSeries'),'a reused legacy ID bound to a store remains visible in interface references');
  records.delete(c.CustomerBusiness.storageKey);
  const v0 = b.sourceVersion('d-series', t), n0 = events.length;
  check(b.rename('d-series', '演示意向车系').ok, 'rename');
  check(b.sourceVersion('d-series', t) === v0, 'rename stable source');
  check(events.length === n0, 'rename no source invalidation');
  check(!b.update('d-series', { capabilityId: 'stores' }).ok, 'capability fixed');
  const series = await b.querySeries('d-series', t);
  check(series.ok && series.complete && series.items.length === 3, 'series result');
  const one = await b.queryStores('d-store', 'NEV-A', t);
  check(one.items.map(row => row.code).join(',') === 'N01,N02', 'NEV A exact relation');
  const other = await b.queryStores('d-store', 'NEV-B', t);
  check(other.items.map(row => row.code).join(',') === 'N02,N03', 'NEV B exact relation excludes stores for another same-type series');
  const ice = await b.queryStores('d-store', 'ICE-A', t);
  check(ice.items.map(row => row.code).join(',') === 'I01', 'ICE exact relation excludes NEV stores');
  for (const unfiltered of ['', undefined]) {
    const result = await b.queryStores('d-store', unfiltered, t);
    check(result.ok && result.complete && result.items.map(row => row.code).join(',') === 'N01,N02,N03,I01', 'absent condition queries the current authorized tenant stores');
  }
  for (const invalid of [null, 'INVALID', [], ['NEV-A'], ['NEV-A', 'NEV-B'], ['NEV-B', 'ICE-A'], 'NEV-A,NEV-B', 'NEV-A|ICE-A', 'NEV-A ', {}, 1, 'toString', '__proto__']) {
    const result = await b.queryStores('d-store', invalid, t);
    check(!result.ok && !result.complete && result.items.length === 0, 'invalid or multiple series conditions cannot produce store options: ' + JSON.stringify(invalid));
  }
  for (const mode of ['empty', 'failure', 'partial']) {
    b.env.query = mode;
    const result = await b.queryStores('d-store', 'NEV-A', t);
    check(mode === 'empty' ? result.ok && result.complete && !result.items.length : !result.ok && !result.complete && !result.items.length, mode + ' precise contract');
  }
  b.env.query = 'normal';
  const sv = b.sourceVersion('d-store', t);
  check(b.setEnabled('d-store', false).ok, 'disable');
  check(!b.available('d-store', t), 'disabled unavailable');
  check(b.sourceVersion('d-store', t) !== sv, 'disable version');
  check(b.setEnabled('d-store', true).ok, 'enable');
  check(b.sourceVersion('d-store', t) !== sv, 'reenable no revival');
  const vAll = b.sourceVersion('d-store', t);
  check(b.setTenants('d-store', ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH']).ok, 'revoke other tenant');
  check(b.sourceVersion('d-store', t) === vAll, 'unaffected tenant version stable');
  check(b.setTenants('d-store', ['TEN-NISSAN-SH']).ok, 'revoke current tenant');
  check(!b.available('d-store', t), 'revoke invalid');
  check(b.setTenants('d-store', ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH']).ok, 'reauthorize');
  check(b.sourceVersion('d-store', t) !== vAll, 'reauth no revival');
  b.env.query = 'delay';
  const pending = b.queryStores('d-store', 'NEV-A', t);
  b.setEnabled('d-store', false);
  b.setEnabled('d-store', true);
  const delayed = await pending;
  check(!delayed.ok && !delayed.items.length, 'late response discarded after revoke restore');
  const pendingSession = b.querySeries('d-series', t);
  session = 'SESSION-2';
  check(!(await pendingSession).ok, 'late response discarded after identity change');
  b.env.query = 'normal';
  superUser = false;
  check(!b.canManage(), 'operator cannot manage');
  check(!b.create({ name: 'bad', capabilityId: 'series', tenantIds: [t.tenantId], enabled: true }).ok, 'model denies direct create');
  check(!b.rename('d-series', 'bad').ok, 'model denies rename');
  check(b.available('d-series', t), 'operator allowed query for granted real scope');
  superUser = true;
  const created = b.create({ name: '新模拟条目', capabilityId: 'series', tenantIds: [], enabled: false });
  check(created.ok && created.row.id.startsWith('d-'), 'create stable generated id');
  check(!b.update(created.row.id, { capabilityId: 'stores' }).ok, 'unreferenced capability also fixed');
  check(!b.create({ name: '新模拟条目', capabilityId: 'series', tenantIds: [], enabled: true }).ok, 'duplicate name denied');
  const beforeStorage = events.length;
  listeners.storage({ key: b.storageKey, storageArea: c.localStorage });
  check(events.length === beforeStorage + 1 && events.at(-1).detail.external, 'cross-tab event');
  records.set(b.storageKey, 'invalid');
  check(!b.available('d-series', t) && b.entries().length === 0, 'corrupt config fail closed');
  check(!b.rename('d-series', 'corrupt').ok && records.get(b.storageKey) === 'invalid', 'corrupt bytes preserved');
  console.log(JSON.stringify({ ok: true, assertions: count, scope: 'real CloudCallData tenant ids; local VM simulation', events: events.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
