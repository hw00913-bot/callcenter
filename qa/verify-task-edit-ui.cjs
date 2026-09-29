/* End-to-end local task-edit UI regression: the original task is updated in place. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { setup: baseSetup, create } = require('./verify-predictive-strategy.cjs');
const root = path.resolve(__dirname, '..');
const checks = [], failures = [];
const check = (name, test) => {
  try { test(); checks.push(name); }
  catch (error) { failures.push({ name, message: error.message, stack: error.stack }); }
};
const copy = value => JSON.parse(JSON.stringify(value));

function createAutomatic(c) {
  const w = c.CloudTaskWorkspace;
  w.start('IVR 外呼');
  w.update('name', '保养提醒编辑验证');
  w.update('description', '创建时的任务说明');
  w.update('businessTagNames', '保养,提醒');
  w.setResource('providerIvrId', '91001');
  w.next();
  w.next(); w.next(); w.submit();
  assert.equal(c.CloudCallData.ivrTasks.length, 1);
  return c.CloudCallData.ivrTasks[0];
}

function fixture(type = '预外呼') {
  const c = baseSetup();
  vm.runInContext(fs.readFileSync(path.join(root, 'js/components/alicti-task-update.js'), 'utf8'), c);
  c.OperationsMonitor = { taskPanel: () => '' };
  c.CallState = { view: () => ({ known: true, answered: true, answerLabel: '已接通' }) };
  c.PlatformUI.timeline = () => '';
  c.PlatformUI.pageHeader = (_title, _subtitle, actions = '') => String(actions);
  c.AppState.scoped = rows => rows.filter(row => c.AppState.authorizeObject('', row));
  c.CustomerTasks.canImportToTask = () => false;
  const row = type === 'IVR 外呼' ? createAutomatic(c) : create(c, '2'), taskId = row.taskId;
  row.providerStatusCode = 0;
  row.alictiMockTaskProperty = {
    id: row.demoProviderTaskId, enterpriseId: 7522240, status: 0, type: type === 'IVR 外呼' ? 2 : 1,
    name: row.name, description: row.description
  };
  row.total = 2; row.completed = 1; row.connected = 1;
  const customer = { id: 'CUSTOMER-1', taskId, tenantId: row.tenantId, enterpriseId: row.enterpriseId, phone: '13900000001' };
  const call = { callId: 'CALL-1', taskId, tenantId: row.tenantId, enterpriseId: row.enterpriseId, result: '已接通' };
  c.CloudCallData.calls = [call];
  c.CustomerTasks.taskCustomers = () => [customer];
  return { c, row, taskId, customer, call, w: c.CloudTaskWorkspace };
}

function editDescription(f, description) {
  const center = f.w.renderCenter({ taskId: f.taskId, tab: 'resources' });
  assert(center.includes('编辑任务'), center.slice(0, 1000));
  assert.equal(f.w.editTask(f.taskId), true);
  assert.equal(f.c.active().editTaskId, f.taskId);
  const html = f.w.render();
  assert(html.includes('提交修改'));
  assert(html.includes('原任务 ID：' + f.taskId));
  f.w.update('description', description);
}

check('任务中心进入编辑，成功按原任务编号提交并保留客户与通话', () => {
  const f = fixture(), previousCalls = copy(f.c.CloudCallData.calls), previousCustomers = copy(f.c.CustomerTasks.taskCustomers());
  editDescription(f, '本次编辑后的业务说明');
  const state = { taskId: f.row.taskId, total: f.row.total, completed: f.row.completed,
    connected: f.row.connected, status: f.row.status, createdCount: f.c.CloudCallData.tasks.length };
  assert.equal(f.w.submit(), true);
  assert.equal(f.row.description, '本次编辑后的业务说明');
  assert.equal(f.row.taskId, state.taskId);
  assert.equal(f.row.total, state.total); assert.equal(f.row.completed, state.completed);
  assert.equal(f.row.connected, state.connected); assert.equal(f.row.status, state.status);
  assert.equal(f.c.CloudCallData.tasks.length, state.createdCount);
  assert.equal(JSON.stringify(f.c.CloudCallData.calls), JSON.stringify(previousCalls));
  assert.equal(JSON.stringify(f.c.CustomerTasks.taskCustomers()), JSON.stringify(previousCustomers));
  assert.equal(f.row.alictiUpdateDraft.endpoint, 'task/update');
  assert.equal(f.row.alictiUpdateDraft.fields.taskId, String(f.row.demoProviderTaskId));
  assert.equal(f.row.alictiUpdateTrace.map(step => step.endpoint).join(','), 'task/get,task/update,task/get');
  assert(f.w.renderCenter({ taskId: f.taskId, tab: 'resources' }).includes('本次编辑后的业务说明'));
});

check('更新接口拒绝与事后结果未知时，原设置、客户和通话均不变', () => {
  for (const scenario of ['write-failure', 'after-unknown']) {
    const f = fixture();
    editDescription(f, '不能提前保存的说明');
    const original = {
      description: f.row.description, snapshot: copy(f.row.executionConfig),
      calls: copy(f.c.CloudCallData.calls), customers: copy(f.c.CustomerTasks.taskCustomers()),
      progress: [f.row.total, f.row.completed, f.row.connected, f.row.status]
    };
    f.c.AliCtiTaskUpdate.scenario = scenario;
    assert.equal(f.w.submit(), false);
    assert.equal(f.row.description, original.description);
    assert.equal(JSON.stringify(f.row.executionConfig), JSON.stringify(original.snapshot));
    assert.equal(JSON.stringify(f.c.CloudCallData.calls), JSON.stringify(original.calls));
    assert.equal(JSON.stringify(f.c.CustomerTasks.taskCustomers()), JSON.stringify(original.customers));
    assert.equal(JSON.stringify([f.row.total, f.row.completed, f.row.connected, f.row.status]), JSON.stringify(original.progress));
    assert.equal(f.c.active().editTaskId, f.taskId);
    assert.equal(f.c.AliCtiTaskUpdate.trace.map(step => step.endpoint).join(','),
      scenario === 'write-failure' ? 'task/get,task/update' : 'task/get,task/update,task/get');
  }
});

check('已有运行设置编辑后详情显示新值并保留编辑前副本', () => {
  const f = fixture();
  f.row.planSnapshotId = 'SNAP-CURRENT';
  f.row.planSnapshot = { description: '编辑前说明', callStrategy: '4', snapshotId: 'SNAP-CURRENT' };
  const beforeCalls = copy(f.c.CloudCallData.calls);
  editDescription(f, '编辑后说明');
  assert.equal(f.w.submit(), true);
  assert.equal(f.row.planSnapshot.description, '编辑后说明');
  assert.equal(f.row.taskSettingHistory.at(-1).previousSnapshot.description, '编辑前说明');
  assert.equal(JSON.stringify(f.c.CloudCallData.calls), JSON.stringify(beforeCalls));
});

check('账号默认导航变更后编辑会提交新标识，编辑期间再次变化则阻止提交', () => {
  const f = fixture(), account = f.c.CloudCallData.instances[0];
  assert.equal(f.row.customerClidsGroup, 'NAV-HQ');
  account.customerClidsGroup = 'NAV-NEXT';
  assert.match(f.w.simulationResourceError(f.row), /默认标识/);
  assert.equal(f.w.editTask(f.taskId), true);
  assert.equal(f.c.active().values.customerClidsGroup, 'NAV-NEXT');
  assert.equal(f.c.active().editOriginalValues.customerClidsGroup, 'NAV-HQ');
  assert.equal(f.w.submit(), true);
  assert.equal(f.row.alictiUpdateDraft.fields.customerClidsCategory, 5);
  assert.equal(f.row.alictiUpdateDraft.fields.customerClidsGroup, 'NAV-NEXT');
  assert.equal(f.row.customerClidsGroup, 'NAV-NEXT');

  const changedDuringEdit = fixture(), latestAccount = changedDuringEdit.c.CloudCallData.instances[0];
  assert.equal(changedDuringEdit.w.editTask(changedDuringEdit.taskId), true);
  latestAccount.customerClidsGroup = 'NAV-LATER';
  assert.equal(changedDuringEdit.w.submit(), false);
  assert.equal(changedDuringEdit.row.customerClidsGroup, 'NAV-HQ');
  assert.equal(changedDuringEdit.row.alictiUpdateDraft, undefined);
});

check('自动外呼编辑保留任务名称、说明和标签输入，语音流程只读显示冻结名称', () => {
  const f = fixture('IVR 外呼'), { c, row, w } = f;
  row.status = '执行中'; row.startedAt = '2026-10-10 09:00:00';
  assert(w.saveDemoTask(row, { confirmedInitialStart: true }));
  const savedFlowName = row.planSnapshot.contactFlowName;
  assert(savedFlowName);
  c.AliCtiIvr.fixtureRows.find(item => item.id === '91001' && item.enterpriseId === '7522240').ivrName = '目录后来改名';
  c.AliCtiIvr.scenario = 'empty';
  assert.equal(w.editTask(f.taskId), true);
  const html = w.render();
  for (const id of ['wizardName', 'wizardDescription', 'wizardBusinessTags']) assert(html.includes(`id="${id}"`), id);
  assert(html.includes('接通后执行的语音流程：' + savedFlowName));
  assert(!html.includes('目录后来改名'));
  assert(!html.includes('id="wizard-providerIvrId"'));
  w.update('name', '编辑后的保养提醒');
  w.update('description', '编辑后的任务说明');
  w.update('businessTagNames', '保养,复访');
  assert.equal(w.submit(), true);
  assert.equal(row.name, '编辑后的保养提醒');
  assert.equal(row.description, '编辑后的任务说明');
  assert.equal(row.businessTagNames, '保养,复访');
  assert.equal(row.planSnapshot.contactFlowName, savedFlowName);
  assert.equal(Object.hasOwn(row.alictiUpdateDraft.fields, 'ivrId'), false);
  const detail = w.renderCenter({ taskId: f.taskId, tab: 'resources' });
  assert(detail.includes(savedFlowName));
  assert(detail.includes('编辑后的任务说明'));
});

check('既有任务使用明确供应商种子更新，同一原任务和历史通话保持不变', () => {
  const f = fixture();
  f.row.taskId = 'TASK-PRED-0901'; f.taskId = f.row.taskId;
  f.c.CloudCallData.calls[0].taskId = f.taskId;
  delete f.row.providerTaskId; delete f.row.demoProviderTaskId;
  delete f.row.alictiMockTaskProperty; delete f.row.providerStatusCode;
  f.row.localPrototypeTask = false; f.row.simulation = false;
  f.c.AliCtiDemo.taskControlSeed = row => row.taskId === f.taskId && row.enterpriseId === '7522240'
    ? { id: 800101, enterpriseId: 7522240, status: 0, type: 1 } : null;
  const beforeCall = copy(f.c.CloudCallData.calls);
  editDescription(f, '已有任务更新');
  assert.equal(f.w.submit(), true);
  assert.equal(f.row.taskId, 'TASK-PRED-0901');
  assert.equal(f.row.alictiUpdateDraft.fields.taskId, '800101');
  assert.equal(f.row.description, '已有任务更新');
  assert.equal(JSON.stringify(f.c.CloudCallData.calls), JSON.stringify(beforeCall));
});

check('终态和跨租户任务不出现编辑入口，也不能调用编辑方法', () => {
  for (const mode of ['ended', 'other-tenant']) {
    const f = fixture();
    if (mode === 'ended') { f.row.status = '已终止'; f.row.providerStatusCode = 3; }
    else { f.c.state.enterpriseId = '7522241'; }
    const html = f.w.renderCenter({ taskId: f.taskId, tab: 'resources' });
    assert(!html.includes('CloudTaskWorkspace.editTask('));
    assert.equal(f.w.editTask(f.taskId), false);
  }
});

if (failures.length) {
  console.error(JSON.stringify({ result: 'fail', count: checks.length, failed: failures.length, failures }, null, 2));
  process.exitCode = 1;
} else console.log(JSON.stringify({ result: 'pass', count: checks.length, checks }, null, 2));
