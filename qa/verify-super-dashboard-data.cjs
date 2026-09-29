/* Super administrator overview: real report and dictionary components, no network or writes. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const base = path.resolve(__dirname, '..'), checks = [];
const state = { accountId: 'SUPER', tenantId: 'PLATFORM', enterpriseId: '7522240', activeDomain: 'CLOUD_CONTACT_CENTER' };
const access = { valid: true, roleCode: 'SUPER_ADMIN', tenantIds: ['HQ', 'STORE'] };
const category = (id, label, enabled = true) => ({ id, label, codeLabel: '业务编码', prefix: 'BIZ', enabled, fields: [] });
const choice = label => ({ id: label, label, businessKey: '' });
const preset = (id, label, type, options = []) => ({ id, label, type, options: options.map(choice), businessKey: '', enabled: true });
const fields = [
  preset('leadLevel','线索等级','select',['A级','B级','C级','D级']),
  preset('intentionLevel','意向等级','select',['高意向','中意向','低意向','无意向']),
  preset('visitIntention','到店意向','select',['有意向','暂不确定','无意向']),
  preset('testDriveIntention','试驾意向','select',['有意向','暂不确定','无意向']),
  preset('plannedVisitAt','计划到店时间','datetime'),
  preset('plannedStoreName','计划到店门店','text')
];
const scopeCatalog = (tenantId, types) => ({enterpriseId:'7522240',tenantId,types,fields});
const catalog = { version: 3, revision: 1, scopes: [
  scopeCatalog('HQ',[category('sales','销售咨询'),category('renewal','续保业务',false)]),
  scopeCatalog('STORE',[category('sales','门店销售'),category('visit','到店预约')])
] };
let writes = 0;
const tenant = (tenantId, enterpriseId = '7522240') => ({ tenantId, enterpriseId, name: tenantId, status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] });
const data = { tenants: [tenant('HQ'), tenant('STORE'), tenant('HIDDEN'), tenant('FOREIGN', '9000000')], agents: [], physicalSkillGroups: [], tasks: [], calls: [], instances: [], agentSkills: [] };
let batches = [];
const context = { console, Date, structuredClone, CloudCallData: data,
  localStorage: { getItem: key => key === 'customer-business-config-v3' ? JSON.stringify(catalog) : null, setItem: () => { writes++; } },
  AppState: {
    get: () => state, effectiveAccess: () => access, canMenu: () => access.valid,
    scoped: rows => rows.filter(row => access.tenantIds.includes(row.tenantId)),
    authorizeObject: (_, row) => access.valid && access.tenantIds.includes(row.tenantId) && row.enterpriseId === state.enterpriseId
  },
  CustomerTasks: { reportSnapshot: () => batches }, PlatformUI: { callTypeLabel: value => value }
};
context.window = context; vm.createContext(context);
for (const name of ['alicti-fields', 'alicti-number-status', 'call-state', 'alicti-report-facts', 'report-metrics', 'customer-business', 'report-data']) {
  vm.runInContext(fs.readFileSync(path.join(base, 'js/components', name + '.js'), 'utf8'), context, { filename: name });
}
const reports = context.CloudReportData, filters = { period: '自定义', startDate: '2026-09-21', endDate: '2026-09-21' };
const at = Math.floor(new Date(2026, 8, 21, 12).getTime() / 1000);
function record(id, kind = 'manual', raw = {}, extra = {}) {
  return { callId: id, enterpriseId: '7522240', tenantId: 'HQ', callType: { manual: '人工外呼', predictive: '预外呼', automatic: 'IVR 外呼', inbound: '呼入' }[kind],
    businessType: 'sales', ringingAt: at * 1000, endedAt: (at + 60) * 1000, result: '接通', durationSeconds: 999,
    alictiCdr: { kind, raw: { mainUniqueId: 'PROVIDER-' + id, ...(kind === 'inbound' ? {} : { enterpriseId: 7522240 }), customerNumber: '13900000001', startTime: at, endTime: at + 60, ...raw } }, ...extra };
}
function model(extra = {}) { const result = reports.getModel('overview', { ...filters, ...extra }); assert(!result.error, result.error); return result; }
function check(name, run) { run(); checks.push(name); }
function keys(value) { return Array.from(value).sort(); }
function reset() {
  batches = [
    { id: 'BATCH', enterpriseId: '7522240', tenantId: 'HQ', name: '总部批次', businessType: 'sales', rows: [{ id: 'P', phone: '13900000001' }] },
    { id: 'BATCH', enterpriseId: '7522240', tenantId: 'STORE', name: '门店批次', businessType: 'visit', rows: [{ id: 'P', phone: '13900000001' }] }
  ];
  data.calls = [
    record('zero', 'manual', { status: 3, bridgeDuration: 0 }),
    record('predictive', 'predictive', { status: 43, bridgeDuration: 30, customerBridgeDuration: 40 }, { businessType: '', customerTaskItemId: 'P', customerTaskBatchId: 'BATCH' }),
    record('system', 'inbound', { status: '系统应答' }, { businessType: '' }),
    record('automatic', 'automatic', { status: '客户接听', customerBridgeDuration: 200 }),
    record('unknown', 'manual', { status: 999 }),
    record('missing', 'manual', { status: 3 }, { businessType: 'renewal' }),
    record('human', 'inbound', { status: '人工接听', bridgeDuration: 10 }, { tenantId: 'STORE' }),
    record('failed', 'manual', { status: 1 }, { tenantId: 'STORE', businessType: 'visit' })
  ];
}
reset();
check('Four call types share ended-call totals, while unknown outcomes stay outside the rate denominator', () => {
  const m = model(); assert.equal(m.summary.total, 8); assert.equal(m.summary.connected, 6); assert.equal(m.summary.unanswered, 1); assert.equal(m.summary.pending, 1);
  assert.equal(m.summary.known, 7); assert.equal(m.summary.rate, '85.7%'); assert.deepEqual(keys(m.rows.map(row => row.type)), ['IVR 外呼', '人工外呼', '呼入', '预外呼'].sort());
});
check('Inbound system answer counts as customer connection without inventing human reception', () => {
  const m = model({ callType: '呼入' }); assert.equal(m.summary.total, 2); assert.equal(m.summary.connected, 2); assert.equal(m.summary.rate, '100.0%'); assert.equal(m.summary.humanConnected, 1);
});
check('Real zero duration participates; missing duration and pure automatic listening never dilute the two-party average', () => {
  const m = model(); assert.equal(m.summary.durationSamples, 3); assert.equal(m.summary.seconds, 40); assert.equal(m.summary.avgSeconds, 40 / 3);
  assert.equal(m.summary.durationMissing, 2); assert.equal(m.summary.durationNotApplicable, 1);
  const a = model({ callType: 'IVR 外呼' }); assert.equal(a.summary.avgSeconds, null); assert.equal(a.summary.durationMissing, 0); assert.equal(a.summary.customerAvgSeconds, 200);
});
check('Dynamic tenant categories group by ID and current label, preserving disabled categories and unclassified calls', () => {
  const m = model(); assert.equal(m.businessGroups.length, 5); assert.equal(m.businessGroups.reduce((sum, row) => sum + row.total, 0), m.summary.total);
  assert.equal(m.businessGroups.find(row => row.label === '销售咨询').total, 4); assert.equal(m.businessGroups.find(row => row.label === '门店销售').total, 1);
  assert.equal(m.businessGroups.find(row => row.label === '续保业务').total, 1); assert.equal(m.businessGroups.find(row => row.id === 'unclassified').total, 1);
  const sales = m.businessGroups.filter(row => row.id === 'sales'); assert.equal(new Set(sales.map(row => row.key)).size, 2);
  assert.equal(m.businessGroups.flatMap(row => row.calls).length, m.summary.total);
});
check('Missing call category resolves through the exact batch row and tenant rather than another tenant or matching phone', () => {
  const m = model(); assert(m.businessGroups.find(row => row.label === '销售咨询').calls.some(call => call.callId === 'predictive'));
  const filtered = model({ businessType: 'sales' }); assert.equal(filtered.summary.total, 5); assert.equal(filtered.businessGroups.reduce((sum, row) => sum + row.total, 0), 5);
  data.calls.push(record('no-row', 'manual', { status: 1 }, { businessType: '', customerTaskItemId: 'absent' }));
  assert.equal(model().businessGroups.find(row => row.id === 'unclassified').total, 2); reset();
});
check('Explicit call category takes precedence; an ambiguous batch match remains unclassified', () => {
  data.calls[1].businessType = 'renewal'; assert(model().businessGroups.find(row => row.label === '续保业务').calls.some(call => call.callId === 'predictive'));
  data.calls[1].businessType = ''; delete data.calls[1].customerTaskBatchId;
  batches.push({ ...batches[0], id: 'OTHER' }); assert(model().businessGroups.find(row => row.id === 'unclassified').calls.some(call => call.callId === 'predictive')); reset();
});
check('Unknown or removed dictionary IDs remain unclassified rather than becoming arbitrary labels', () => {
  data.calls.push(record('unknown-category', 'manual', { status: 1 }, { businessType: 'not-configured' }));
  const m = model(); assert.equal(m.businessGroups.find(row => row.id === 'unclassified').total, 2); assert(!m.businessGroups.some(row => row.label === 'not-configured')); reset();
});
check('Source tenant and selected enterprise scope apply before aggregation and dictionary selection', () => {
  data.calls.push(record('hidden', 'manual', { status: 3, bridgeDuration: 999 }, { tenantId: 'HIDDEN' }));
  data.calls.push(record('foreign', 'manual', { enterpriseId: 9000000, status: 3, bridgeDuration: 999 }, { enterpriseId: '9000000', tenantId: 'HQ' }));
  assert.equal(model().summary.total, 8); const store = model({ tenantId: 'STORE' }); assert.equal(store.summary.total, 2); assert.deepEqual(keys(store.businessGroups.map(row => row.label)), ['到店预约', '门店销售'].sort()); reset();
});
check('Official mainUniqueId deduplicates repeated response rows but preserves same IDs in different tenants', () => {
  data.calls.unshift(record('old-copy', 'predictive', { mainUniqueId: 'PROVIDER-predictive', status: 43, bridgeDuration: 999 }));
  assert.equal(model().summary.total, 8); assert.equal(model().summary.seconds, 40);
  data.calls.push(record('store-copy', 'predictive', { mainUniqueId: 'PROVIDER-predictive', status: 43, bridgeDuration: 20 }, { tenantId: 'STORE' }));
  assert.equal(model().summary.total, 9); reset();
});
check('Official startTime governs dates, using inclusive start and exclusive next day; incomplete CDRs are excluded', () => {
  const midnight = Math.floor(new Date(2026, 8, 21).getTime() / 1000);
  data.calls.push(record('before', 'manual', { startTime: midnight - 1, endTime: at, status: 1 }));
  data.calls.push(record('after', 'manual', { startTime: midnight + 86400, endTime: midnight + 86460, status: 1 }));
  data.calls.push(record('open', 'manual', { endTime: null, status: 3 }));
  data.calls.push(record('missing-start', 'manual', { startTime: null, status: 1 }));
  assert.equal(model().summary.total, 8); assert.equal(model().timeMissing, 1);
  data.calls.push(record('midnight', 'manual', { startTime: midnight, endTime: midnight + 60, status: 1 }));
  assert.equal(model().summary.total, 9); reset();
});
check('Empty scope keeps count zero, undefined rate and duration, and no fabricated category distribution', () => {
  const m = model({ startDate: '2026-09-20', endDate: '2026-09-20' }); assert.equal(m.summary.total, 0); assert.equal(m.summary.rate, '—'); assert.equal(m.summary.avgSeconds, null); assert.equal(m.businessGroups.length, 0);
});
check('No source row, batch, dictionary or persisted state is mutated during overview reads', () => {
  const before = JSON.stringify({ data, batches, catalog }); model(); model({ tenantId: 'STORE' }); model({ businessType: 'sales' });
  assert.equal(JSON.stringify({ data, batches, catalog }), before); assert.equal(writes, 0);
});
check('Denied access does not expose call totals or business groups', () => {
  access.valid = false; const m = reports.getModel('overview', filters); assert(m.error); assert.equal(m.summary.total, 0); assert.equal(m.businessGroups.length, 0); access.valid = true;
});
console.log(JSON.stringify({ result: 'pass', count: checks.length, checks, network: false, writes }, null, 2));
