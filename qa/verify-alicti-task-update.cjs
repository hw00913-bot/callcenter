/* task/update demonstration boundary; every query/write is an explicit mock. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const checks = [], failures = [];
const check = (name, test) => {
  try { test(); checks.push(name); }
  catch (error) { failures.push({ name, message: error.message, stack: error.stack }); }
};
const same = value => JSON.stringify(value);

function fixture() {
  const state = { activeDomain: 'CLOUD_CONTACT_CENTER', enterpriseId: '7522240' };
  const c = { console, structuredClone };
  c.window = c;
  c.AppState = {
    get: () => state,
    authorizeObject: (_permission, row) => row.tenantId === 'TEN-HQ',
    scoped: rows => rows.filter(row => row.tenantId === 'TEN-HQ')
  };
  c.AliCtiFields = {
    integer: value => value !== null && value !== undefined && value !== '' &&
      typeof value !== 'boolean' && /^\d+$/.test(String(value)) &&
      Number.isSafeInteger(Number(value)) ? Number(value) : null,
    code: value => value !== null && value !== undefined && value !== '' &&
      typeof value !== 'boolean' && /^-?\d+$/.test(String(value)) ? Number(value) : null,
    taskStatus: { 0: '初始', 1: '运行中', 2: '暂停', 3: '结束' }
  };
  c.AliCtiDemo = { taskControlSeed: row => row.taskId === 'SEED' && row.tenantId === 'TEN-HQ'
    ? { id: 800101, status: 1, enterpriseId: 7522240 } : null };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/components/alicti-task-update.js'), 'utf8'), c);
  const row = () => ({
    taskId: 'LOCAL-1', tenantId: 'TEN-HQ', enterpriseId: '7522240', callType: '预外呼',
    providerTaskId: 321, status: '执行中', providerStatusCode: 1,
    alictiMockTaskProperty: { id: 321, enterpriseId: 7522240, status: 1, name: '旧任务', concurrency: 4 },
    completed: 3, total: 8, customerIds: ['C-1'], planSnapshot: { name: '旧任务' }
  });
  const request = (patch = {}) => ({ endpoint: 'task/update', fields: { taskId: '321', name: '新任务', ...patch }, pending: [], errors: [] });
  return { c, state, row, request, submit: (r, q) => c.AliCtiTaskUpdate.submit(r, q) };
}

check('真实供应商编号三阶段查证成功，但适配器不改任务和快照', () => {
  const f = fixture(), r = f.row(), original = same(r);
  const done = f.submit(r, f.request({ concurrency: 5 }));
  assert.equal(done.ok, true); assert.equal(done.pending, false); assert.equal(done.mock, true);
  assert.equal(done.trace.map(step => step.endpoint).join(','), 'task/get,task/update,task/get');
  assert(done.trace.every(step => step.mock && step.response.mock));
  assert.equal(done.property.name, '新任务'); assert.equal(done.property.concurrency, 5);
  assert.equal(done.property.id, 321); assert.equal(done.property.status, 1);
  assert.equal(same(r), original);
});

check('官方鉴权字段随请求记录但不混入任务属性', () => {
  const f = fixture(), r = f.row();
  const done = f.submit(r, f.request({
    validateType: 2, enterpriseId: 7522240, timestamp: 1780000000,
    sign: '00000000000000000000000000000000'
  }));
  assert(done.ok);
  assert.equal(done.trace[1].fields.validateType, 2);
  assert.equal(done.property.validateType, undefined);
  assert.equal(done.property.timestamp, undefined);
  assert.equal(done.property.sign, undefined);
});

check('显式本地模拟供应商编号可更新，不能把平台任务 ID 当供应商编号', () => {
  const f = fixture(), r = f.row();
  delete r.providerTaskId; r.simulation = true; r.localPrototypeTask = true;
  r.demoProviderTaskId = 800001; r.alictiMockTaskProperty.id = 800001;
  assert(f.submit(r, { endpoint: 'task/update', fields: { taskId: '800001', description: '回访' } }).ok);
  assert.equal(f.submit(r, f.request()).trace.length, 0);
  r.demoProviderTaskId = 0;
  assert.equal(f.submit(r, { endpoint: 'task/update', fields: { taskId: r.taskId, name: '错误' } }).trace.length, 0);
});

check('独立种子可供既有演示任务查询，但未知任务不会凭本地状态生成供应商 ID', () => {
  const f = fixture(), r = f.row();
  delete r.providerTaskId; delete r.alictiMockTaskProperty; delete r.providerStatusCode;
  r.taskId = 'SEED';
  assert(f.submit(r, { endpoint: 'task/update', fields: { taskId: '800101', name: '种子新名' } }).ok);
  r.taskId = 'UNKNOWN';
  const refused = f.submit(r, { endpoint: 'task/update', fields: { taskId: '800101', name: '不得提交' } });
  assert.equal(refused.ok, false); assert.equal(refused.trace.length, 0);
});

check('请求身份及字段边界错误均在任何查询前阻止', () => {
  const f = fixture();
  for (const bad of [
    { endpoint: 'task/create', fields: { taskId: '321', name: '新名' } },
    { endpoint: 'task/update', fields: { taskId: '322', name: '新名' } },
    { endpoint: 'task/update', fields: { taskId: '321', enterpriseId: 999, name: '新名' } },
    { endpoint: 'task/update', fields: { taskId: '321', type: 2 } },
    { endpoint: 'task/update', fields: { taskId: '321', callGroupType: 2 } },
    { endpoint: 'task/update', fields: { taskId: '321', isRepeat: 1 } },
    { endpoint: 'task/update', fields: { taskId: '321' } },
    { endpoint: 'task/update', fields: { taskId: '321', name: '新名' }, errors: ['无效'] }
  ]) { const refused = f.submit(f.row(), bad); assert.equal(refused.ok, false); assert.equal(refused.trace.length, 0); }
});

check('结束、待核对、跨企业、跨租户和展示样例不能提交', () => {
  const f = fixture();
  const mutations = [
    r => { r.status = '已终止'; },
    r => { r.providerStatusCode = 3; },
    r => { r.providerStatusCode = 3; r.alictiMockTaskProperty.status = 3; },
    r => { r.alictiTaskControlPending = true; },
    r => { r.enterpriseId = '7522241'; },
    r => { r.tenantId = 'TEN-OTHER'; },
    r => { r.displayOnly = true; }
  ];
  for (const mutate of mutations) {
    const r = f.row(); mutate(r);
    const refused = f.submit(r, f.request());
    assert.equal(refused.ok, false);
    assert(refused.trace.length <= 1);
  }
});

check('操作前 task/get 必须核对 ID、账号和已知状态', () => {
  const f = fixture();
  for (const mutate of [
    p => { delete p.id; },
    p => { p.id = 999; },
    p => { p.enterpriseId = 999; },
    p => { p.type = 2; },
    p => { p.status = 99; }
  ]) {
    const r = f.row(); mutate(r.alictiMockTaskProperty);
    const refused = f.submit(r, f.request());
    assert.equal(refused.ok, false); assert.equal(refused.pending, true);
    assert.equal(refused.trace.map(step => step.endpoint).join(','), 'task/get');
  }
});

check('任务类型本身变动在更新请求前阻断', () => {
  const f = fixture(), r = f.row();
  r.providerType = 2;
  const refused = f.submit(r, f.request());
  assert.equal(refused.ok, false); assert.equal(refused.trace.length, 0);
});

check('写入失败不进入事后查询，也不改变本地任务', () => {
  const f = fixture(), r = f.row(), before = same(r);
  f.c.AliCtiTaskUpdate.scenario = 'write-failure';
  const refused = f.submit(r, f.request());
  assert.equal(refused.ok, false); assert.equal(refused.pending, false);
  assert.equal(refused.trace.map(step => step.endpoint).join(','), 'task/get,task/update');
  assert.equal(same(r), before);
});

check('写入回执成功但复查未知时不能伪造更新成功', () => {
  const f = fixture(), r = f.row(), before = same(r);
  f.c.AliCtiTaskUpdate.scenario = 'after-unknown';
  const refused = f.submit(r, f.request());
  assert.equal(refused.ok, false); assert.equal(refused.pending, true);
  assert.equal(refused.trace.map(step => step.endpoint).join(','), 'task/get,task/update,task/get');
  assert.equal(refused.property, null); assert.equal(same(r), before);
});

if (failures.length) {
  console.error(JSON.stringify({ result: 'fail', count: checks.length, failed: failures.length, failures }, null, 2));
  process.exitCode = 1;
} else console.log(JSON.stringify({ result: 'pass', count: checks.length, checks }, null, 2));
