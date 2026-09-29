'use strict';
const assert = require('assert');
const { fixture, signedIn } = require('./verify-demo-fixtures.cjs');
const checks = [];
const check = (name, run) => { run(); checks.push(name); };
const batches = ctx => JSON.parse(ctx.localStorage.getItem('customer-task-batches-v1'));
const reload = (ctx, now) => fixture({ local: ctx.testStores.local, session: ctx.testStores.session, ...(now ? { now } : {}) });
const customerKeys = ctx => new Set([
  ...batches(ctx).flatMap(batch => batch.rows.map(row => JSON.stringify([batch.enterpriseId, batch.tenantId, row.phone]))),
  ...ctx.CloudCallData.calls.map(row => JSON.stringify([row.enterpriseId, row.tenantId, row.customerPhone || (row.direction === '呼入' ? row.caller : row.callee)]))
]);
const ctx = fixture({ session: signedIn() });
check('各业务模块预置记录不超过15，客户按租户与号码去重也不超过15', () => {
  for (const name of ['calls', 'tasks', 'predictiveTasks', 'ivrTasks', 'agents', 'agentSkills', 'physicalSkillGroups', 'phoneNumbers', 'syncRecords', 'exceptions', 'audits', 'callPlans', 'inboundRoutes']) assert(ctx.CloudCallData[name].length <= 15, name);
  for (const name of ['MockSceneList', 'MockCallRecordRows', 'MockCallStatsRows']) assert(ctx[name].length <= 15, name);
  assert(batches(ctx).length <= 15); assert(batches(ctx).every(batch => batch.rows.length <= 15));
  assert(customerKeys(ctx).size <= 15);
});
check('客户、话单、任务、号码和人工接听坐席的关联保持完整', () => {
  const data = ctx.CloudCallData, rows = batches(ctx).flatMap(batch => batch.rows);
  for (const call of data.calls) {
    if (call.customerTaskItemId) assert(rows.some(row => row.id === call.customerTaskItemId));
    if (call.taskId) assert(data.tasks.some(task => task.taskId === call.taskId));
    if (call.callerNumberId) assert(data.phoneNumbers.some(number => number.numberId === call.callerNumberId));
    if (call.contactCenterIdentityId) assert(data.agents.some(agent => agent.contactCenterIdentityId === call.contactCenterIdentityId));
  }
  for (const row of rows) for (const call of row.calls || []) assert(data.calls.some(record => record.callId === call.callId));
  for (const task of data.tasks) {
    const summary = ctx.AliCtiReportSummaryFixtures.task(task)?.data.list[0];
    assert(summary); assert.equal(Number(summary.totalCount), task.total);
    assert.equal(Number(summary.calledCount), data.calls.filter(call => call.taskId === task.taskId).length);
  }
});
check('刷新和跨日不生成新的样例ID，也不改变同一客户的号码', () => {
  const before = new Map(ctx.CloudCallData.calls.map(call => [call.callId, call.customerPhone || call.callee]));
  const next = reload(ctx, Date.now() + 86400000);
  assert.equal(next.CloudCallData.calls.length, before.size);
  for (const call of next.CloudCallData.calls) assert.equal(call.customerPhone || call.callee, before.get(call.callId));
  assert(customerKeys(next).size <= 15);
  assert.equal(next.CustomerDirectory.conflicts?.length || 0, 0);
});
check('第一次精简同时清理旧模拟话单、目录缓存和批次联系历史，保留人工创建的名单', () => {
  const prior = fixture({ session: signedIn() });
  prior.localStorage.removeItem('demo-small-sample-migration-v1');
  const original = prior.CloudCallData.calls.find(call => call.callType === '人工外呼');
  const old = { ...JSON.parse(JSON.stringify(original)), callId: 'MC-OLD-DEMO', customerTaskItemId: 'USER-ROW-OLD', callSource: 'NATIVE_WORKBENCH', simulation: true, demoPack: undefined, directoryMeta: undefined };
  const batch = { id: 'USER-BATCH-OLD', name: '用户导入名单', tenantId: old.tenantId, enterpriseId: old.enterpriseId, rows: [{ id: old.customerTaskItemId, name: '用户客户', phone: old.customerPhone || old.callee, calls: [old], history: [{ callId: old.callId, action: '记录通话' }] }] };
  prior.localStorage.setItem('customer-task-batches-v1', JSON.stringify([...batches(prior), batch]));
  prior.localStorage.setItem('native-workbench-records-v1', JSON.stringify([old]));
  const directory = JSON.parse(prior.localStorage.getItem('customer-directory-v1')); directory.calls.push(old);
  prior.localStorage.setItem('customer-directory-v1', JSON.stringify(directory));
  const next = reload(prior), retained = batches(next).find(row => row.id === batch.id);
  assert(retained); assert.equal(retained.rows.length, 1); assert.equal(retained.rows[0].calls.length, 0); assert.equal(retained.rows[0].history.length, 0);
  assert(!next.CloudCallData.calls.some(call => call.callId === old.callId));
  assert(!JSON.parse(next.localStorage.getItem('customer-directory-v1')).calls.some(call => call.callId === old.callId));
  assert.equal(JSON.parse(next.localStorage.getItem('native-workbench-records-v1')).length, 0);
});
check('精简完成后新发起的演示通话、用户新任务和新增名单在后续刷新保留', () => {
  const current = fixture({ session: signedIn() }), sample = current.CloudCallData.calls.find(call => call.callType === '人工外呼');
  const call = { ...JSON.parse(JSON.stringify(sample)), callId: 'MC-NEW-DEMO', taskId: 'USER-NEW-TASK', customerTaskItemId: 'USER-NEW-ROW', callSource: 'NATIVE_WORKBENCH', simulation: true, demoPack: undefined, directoryMeta: undefined };
  const task = { taskId: call.taskId, tenantId: call.tenantId, enterpriseId: call.enterpriseId, callType: '预外呼', name: '用户新任务', status: '待启动', total: 1, completed: 0 };
  const batch = { id: 'USER-NEW-BATCH', tenantId: call.tenantId, enterpriseId: call.enterpriseId, rows: [{ id: call.customerTaskItemId, taskId: task.taskId, name: '用户新客户', phone: call.customerPhone || call.callee, calls: [call], history: [{ callId: call.callId }] }] };
  current.localStorage.setItem('native-workbench-records-v1', JSON.stringify([call]));
  current.localStorage.setItem('customer-task-batches-v1', JSON.stringify([...batches(current), batch]));
  current.sessionStorage.setItem('cloud-task-created-v1', JSON.stringify([...JSON.parse(current.sessionStorage.getItem('cloud-task-created-v1')), task]));
  const next = reload(reload(current));
  assert(next.CloudCallData.calls.some(row => row.callId === call.callId));
  assert(next.CloudCallData.tasks.some(row => row.taskId === task.taskId));
  assert.equal(batches(next).find(row => row.id === batch.id).rows[0].calls[0].callId, call.callId);
});
check('历史其他日期的SHOWCASE和VIEW自动样例不会重新恢复', () => {
  const prior = fixture({ session: signedIn() }), batch = JSON.parse(JSON.stringify(batches(prior)[0]));
  const old = JSON.parse(JSON.stringify(batch).replaceAll('20260921', '20260916'));
  prior.localStorage.setItem('customer-task-batches-v1', JSON.stringify([...batches(prior), old, { id: 'VIEW-DEMO-HQ-BATCH', simulation: true, tenantId: batch.tenantId, enterpriseId: batch.enterpriseId, rows: [{ id: 'VIEW-DEMO-HQ-C1', phone: '13900008001', calls: [] }] }]));
  const next = reload(prior);
  assert(!batches(next).some(row => row.id === old.id || row.id.startsWith('VIEW-DEMO-')));
  assert(next.CloudCallData.calls.every(row => !row.callId.startsWith('VIEW-DEMO-') && !row.callId.includes('20260916')));
});
check('已精简过的浏览器补回指定待启动样例客户，保持总量上限', () => {
  const prior = fixture({ session: signedIn() }), saved = batches(prior);
  for (const batch of saved) if (/-PRED-READY-BATCH$|-AUTO-READY-BATCH$/.test(batch.id)) batch.rows = [];
  prior.localStorage.setItem('customer-task-batches-v1', JSON.stringify(saved));
  const next = reload(prior);
  for (const task of next.CloudCallData.tasks.filter(row => /-READY$/.test(row.taskId))) assert.equal(task.total, 1);
  assert(customerKeys(next).size <= 15);
});
check('只恢复缺少C06导致误完成的运行样例，主动暂停结束或已呼叫客户不恢复', () => {
  for (const variant of ['compact-completion', 'paused', 'stopped', 'mock-stopped', 'already-called', 'other-unfinished']) {
    const prior = fixture({ session: signedIn() }), savedTasks = JSON.parse(prior.sessionStorage.getItem('cloud-task-created-v1'));
    const task = savedTasks.find(row => /-HQ-\d+-PRED-RUNNING$/.test(row.taskId));
    Object.assign(task, { status: variant === 'paused' ? '已暂停' : variant === 'stopped' ? '已终止' : '已完成', stopNewDialing: true, providerStatusCode: variant === 'paused' ? 2 : variant === 'stopped' ? 3 : 1 });
    task.alictiMockTaskProperty.status = variant === 'mock-stopped' ? 3 : task.providerStatusCode;
    const savedBatches = batches(prior), batch = savedBatches.find(row => row.rows.some(customer => customer.id === task.taskId + '-C06'));
    const row = batch.rows.find(customer => customer.id === task.taskId + '-C06');
    if (variant === 'already-called') row.calls.push({ callId: 'USER-FINISHED-C06', at: '2026-09-21 12:00:00', result: '未接通' });
    if (variant === 'other-unfinished') batch.rows.push({ ...row, id: 'USER-OTHER-UNFINISHED', demoPack: undefined, phone: '13999990001' });
    prior.localStorage.setItem('customer-task-batches-v1', JSON.stringify(savedBatches));
    prior.sessionStorage.setItem('cloud-task-created-v1', JSON.stringify(savedTasks));
    const next = reload(prior), current = next.CloudCallData.tasks.find(item => item.taskId === task.taskId);
    const persisted = JSON.parse(next.sessionStorage.getItem('cloud-task-created-v1')).find(item => item.taskId === task.taskId);
    const expected = variant === 'compact-completion' ? '执行中' : task.status;
    assert.equal(current.status, expected, variant); assert.equal(persisted.status, expected, variant + ' persisted');
    assert.equal(current.stopNewDialing, variant !== 'compact-completion', variant);
    assert.equal(persisted.stopNewDialing, variant !== 'compact-completion', variant + ' persisted');
  }
});
console.log(JSON.stringify({ result: 'pass', count: checks.length, checks, counts: { calls: ctx.CloudCallData.calls.length, customers: customerKeys(ctx).size, tasks: ctx.CloudCallData.tasks.length, agents: ctx.CloudCallData.agents.length, batches: batches(ctx).length } }, null, 2));
