'use strict';
const {install:installGeneric}=require('./fixtures/current-generic.cjs');
/* Current-schema checks. Retired compatibility evidence: qa/retired/compatibility/check-business-data.cjs. */
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
for (const file of ['mock/data.js','config/customer-intent-profile.js','mock/mapping-series-data.js','js/components/mapping-series-adapter.js','js/components/business-data.js','js/components/customer-business.js']) {
  vm.runInContext(fs.readFileSync(path.join(projectRoot, file), 'utf8'), c, { filename: file });
}
installGeneric(c,{scope});
let count = 0;
const check = (test, message) => { assert.ok(test, message); count++; };
(async () => {
  const b = c.BusinessData, t = scope;
  check(b.tenants().length === 3, 'real tenant count');
  check(b.tenants()[0].tenantId === 'TEN-NISSAN-HQ', 'real tenant id');
  check(b.entries().length === 3, 'Mapping default plus two explicitly configured generic entries');
  check(b.capability('stores').kind === 'store', 'store kind');
  check(b.available('d-fixture-series', t), 'available real scope');
  check(!b.available('d-fixture-series', { ...t, enterpriseId: 'bad' }), 'enterprise mismatch denied');
  check(!b.available('d-fixture-series', { tenantId: 't1', enterpriseId: '7522240' }), 'fake tenant denied');
  check(b.references('d-fixture-series').length === 1, 'explicit fixture series has one current tenant reference');
  const v0 = b.sourceVersion('d-fixture-series', t), n0 = events.length;
  check(b.rename('d-fixture-series', '演示意向车系').ok, 'rename');
  check(b.sourceVersion('d-fixture-series', t) === v0, 'rename stable source');
  check(events.length === n0, 'rename no source invalidation');
  check(!b.update('d-fixture-series', { capabilityId: 'stores' }).ok, 'capability fixed');
  const series = await b.querySeries('d-fixture-series', t);
  check(series.ok && series.complete && series.items.length === 3, 'series result');
  const one = await b.queryStores('d-fixture-store', 'NEV-A', t);
  check(one.items.map(row => row.code).join(',') === 'N01,N02', 'NEV A exact relation');
  const other = await b.queryStores('d-fixture-store', 'NEV-B', t);
  check(other.items.map(row => row.code).join(',') === 'N02,N03', 'NEV B exact relation excludes stores for another same-type series');
  const ice = await b.queryStores('d-fixture-store', 'ICE-A', t);
  check(ice.items.map(row => row.code).join(',') === 'I01', 'ICE exact relation excludes NEV stores');
  for (const unfiltered of ['', undefined]) {
    const result = await b.queryStores('d-fixture-store', unfiltered, t);
    check(result.ok && result.complete && result.items.map(row => row.code).join(',') === 'N01,N02,N03,I01', 'absent condition queries the current authorized tenant stores');
  }
  for (const invalid of [null, 'INVALID', [], ['NEV-A'], ['NEV-A', 'NEV-B'], ['NEV-B', 'ICE-A'], 'NEV-A,NEV-B', 'NEV-A|ICE-A', 'NEV-A ', {}, 1, 'toString', '__proto__']) {
    const result = await b.queryStores('d-fixture-store', invalid, t);
    check(!result.ok && !result.complete && result.items.length === 0, 'invalid or multiple series conditions cannot produce store options: ' + JSON.stringify(invalid));
  }
  for (const mode of ['empty', 'failure', 'partial']) {
    b.env.query = mode;
    const result = await b.queryStores('d-fixture-store', 'NEV-A', t);
    check(mode === 'empty' ? result.ok && result.complete && !result.items.length : !result.ok && !result.complete && !result.items.length, mode + ' precise contract');
  }
  b.env.query = 'normal';
  const sv = b.sourceVersion('d-fixture-store', t);
  check(b.setEnabled('d-fixture-store', false).ok, 'disable');
  check(!b.available('d-fixture-store', t), 'disabled unavailable');
  check(b.sourceVersion('d-fixture-store', t) !== sv, 'disable version');
  check(b.setEnabled('d-fixture-store', true).ok, 'enable');
  check(b.sourceVersion('d-fixture-store', t) !== sv, 'reenable no revival');
  const vAll = b.sourceVersion('d-fixture-store', t);
  check(b.setTenants('d-fixture-store', ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH']).ok, 'revoke other tenant');
  check(b.sourceVersion('d-fixture-store', t) === vAll, 'unaffected tenant version stable');
  check(b.setTenants('d-fixture-store', ['TEN-NISSAN-SH']).ok, 'revoke current tenant');
  check(!b.available('d-fixture-store', t), 'revoke invalid');
  check(b.setTenants('d-fixture-store', ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH']).ok, 'reauthorize');
  check(b.sourceVersion('d-fixture-store', t) !== vAll, 'reauth no revival');
  b.env.query = 'delay';
  const pending = b.queryStores('d-fixture-store', 'NEV-A', t);
  b.setEnabled('d-fixture-store', false);
  b.setEnabled('d-fixture-store', true);
  const delayed = await pending;
  check(!delayed.ok && !delayed.items.length, 'late response discarded after revoke restore');
  const pendingSession = b.querySeries('d-fixture-series', t);
  session = 'SESSION-2';
  check(!(await pendingSession).ok, 'late response discarded after identity change');
  b.env.query = 'normal';
  superUser = false;
  check(!b.canManage(), 'operator cannot manage');
  check(!b.create({ name: 'bad', capabilityId: 'series', tenantIds: [t.tenantId], enabled: true }).ok, 'model denies direct create');
  check(!b.rename('d-fixture-series', 'bad').ok, 'model denies rename');
  check(b.available('d-fixture-series', t), 'operator allowed query for granted real scope');
  superUser = true;
  const created = b.create({ name: '新模拟条目', capabilityId: 'series', tenantIds: [], enabled: false });
  check(created.ok && created.row.id.startsWith('d-'), 'create stable generated id');
  check(!b.update(created.row.id, { capabilityId: 'stores' }).ok, 'unreferenced capability also fixed');
  check(!b.create({ name: '新模拟条目', capabilityId: 'series', tenantIds: [], enabled: true }).ok, 'duplicate name denied');
  const beforeStorage = events.length;
  listeners.storage({ key: b.storageKey, storageArea: c.localStorage });
  check(events.length === beforeStorage + 1 && events.at(-1).detail.external, 'cross-tab event');
  records.set(b.storageKey, 'invalid');
  check(!b.available('d-fixture-series', t) && b.entries().length === 0, 'corrupt config fail closed');
  check(!b.rename('d-fixture-series', 'corrupt').ok && records.get(b.storageKey) === 'invalid', 'corrupt bytes preserved');
  console.log(JSON.stringify({ ok: true, assertions: count, scope: 'real CloudCallData tenant ids; local VM simulation', events: events.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
