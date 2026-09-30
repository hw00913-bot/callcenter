/* Customer imports are tenant-admin operations. Real AppState and page scripts;
 * fixtures substitute only browser surfaces. No supplier or network calls. */
'use strict';
const assert = require('node:assert/strict');
const { fixture, signedIn } = require('./verify-task-direct-import.cjs');
const checks = [], failures = [], batchKey = 'customer-task-batches-v1';
const HQ = 'TEN-NISSAN-HQ', SH = 'TEN-NISSAN-SH';
const roles = {
  admin: [HQ, 'ACC-ADMIN-018'],
  storeAdmin: [SH, 'ACC-ADMIN-018'],
  super: ['TENANT-SUPER-BUILTIN', 'ACC-SUPER-001'],
  operator: [HQ, 'ACC-OPS-108']
};
const copy = value => JSON.parse(JSON.stringify(value));
function setup(role = 'admin') {
  const c = fixture({ session: signedIn(...roles[role]) }), nodes = new Map(), layers = new Map();
  c.document.getElementById = id => nodes.get(id) || null;
  c.PlatformUI.openLayer = (id, html) => layers.set(id, html);
  c.PlatformUI.closeLayer = id => layers.delete(id);
  c.navigateTo = (key, options) => { c.lastNavigation = { key, options }; };
  c.showToast = message => { c.lastToast = message; };
  c.test = { nodes, layers, field(id, value = '') { const node = { value, innerHTML: '', disabled: false, setAttribute() {}, focus() {} }; nodes.set(id, node); return node; } };
  assert.equal(c.AppState.effectiveAccess().valid, true, role + ' 必须使用有效真实会话');
  return c;
}
function stores(c) { return JSON.stringify([ [...c.testStores.local].sort(), [...c.testStores.session].sort() ]); }
function emptyTask(c, suffix = 'HQ', scope = { tenantId: HQ, enterpriseId: '7522240' }) {
  const seed = c.CloudCallData.predictiveTasks.find(row => row.tenantId === scope.tenantId);
  const task = { ...copy(seed), ...scope, taskId: 'QA-IMPORT-PERMISSION-' + suffix, name: '客户导入权限回归-' + suffix, status: '待分配客户', total: 0, completed: 0, startedAt: '', campaignId: '', customerSourceMode: 'assigned', displayOnly: false };
  c.CloudCallData.tasks.unshift(task); c.CloudCallData.predictiveTasks.unshift(task);
  return task;
}
function batch(c, task = null) {
  const scope = task || { tenantId: c.AppState.get().tenantId, enterpriseId: c.AppState.get().enterpriseId };
  return { id: 'QA-IMPORT-PERMISSION-BATCH', name: '客户导入权限名单', businessType: 'lead', tenantId: scope.tenantId, enterpriseId: scope.enterpriseId, createdAt: '2026-09-30 15:00:00', createdBy: c.AppState.get().accountId, errors: [], rows: [{ id: 'QA-IMPORT-PERMISSION-ROW', name: '客户甲', phone: '13800000991', note: '权限回归', businessType: 'lead', externalDocumentId: 'LEAD-991', ownerId: '', method: task?.callType || '', taskId: task?.taskId || '', taskName: task?.name || '', followup: '待联系', calls: [], history: [] }] };
}
function fill(c) {
  c.test.field('customer-batch-name', '客户导入权限名单');
  c.test.field('customer-import-business-type', 'lead');
  c.test.field('customer-import-text', '客户甲,13800000991,权限回归,LEAD-991');
  c.test.field('customer-import-preview'); c.test.field('customer-import-confirm').disabled = true;
  c.test.field('customer-import-filename');
}
function preparePreview(c, task = null) {
  c.CustomerTasks.importDialog(task?.taskId); assert(c.test.layers.has('customer-import'));
  fill(c); c.CustomerTasks.previewImport(); assert.equal(c.test.nodes.get('customer-import-confirm').disabled, false);
}
function savedBatches(c) { return JSON.parse(c.localStorage.getItem(batchKey) || '[]'); }
async function check(name, fn) { try { await fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.stack }); } }

(async () => {
  await check('真实权限矩阵：仅有效租户ADMIN可导入，SUPER_ADMIN和OPERATOR拒绝', () => {
    for (const [role, expected] of [['admin', true], ['storeAdmin', true], ['super', false], ['operator', false]]) {
      const c = setup(role);
      assert.equal(c.AppState.canAction('customer.import'), expected, role);
      assert.equal(c.CustomerTasks.canImportCustomers(), expected, role);
    }
  });
  await check('超管与运营均不显示客户总页、任务列表和任务详情导入入口', () => {
    for (const role of ['super', 'operator']) {
      const c = setup(role), task = emptyTask(c);
      assert(!c.CustomerTasks.render({ routeKey: 'customer-tasks' }).includes('CustomerTasks.importDialog('), role);
      assert(!c.Pages['cloud-call-tasks'].render({ view: 'predictive' }).includes('CustomerTasks.importDialog('), role);
      assert(!c.CloudTaskWorkspace.centerActions(task).includes('CustomerTasks.importDialog('), role);
      assert.equal(c.CustomerTasks.canImportToTask(task), false);
    }
  });
  await check('超管和运营直调全部客户导入入口均拒绝且本地存储完全不变', async () => {
    for (const role of ['super', 'operator']) {
      const c = setup(role), task = emptyTask(c), payload = batch(c, task); fill(c);
      const before = stores(c), textBefore = c.test.nodes.get('customer-import-text').value;
      c.CustomerTasks.importDialog(); c.CustomerTasks.importDialog(task.taskId);
      assert(!c.test.layers.has('customer-import'), role);
      assert.throws(() => c.CustomerTasks.prepare('绕过入口', '客户甲,13800000991,备注,LEAD-991', 'lead'), /租户管理员|导入权限/);
      c.CustomerTasks.fillSample(); c.CustomerTasks.previewImport(); c.CustomerTasks.confirmImport();
      let readCount = 0;
      await c.CustomerTasks.readFile({ name: 'customers.csv', size: 20, text: async () => { readCount++; return '不应读取'; } });
      assert.equal(readCount, 0, role + ' 文件入口先验权限');
      assert.equal(c.test.nodes.get('customer-import-text').value, textBefore);
      assert.equal(c.CustomerTasks.commitImportBatch(payload), false);
      assert.equal(c.CloudTaskWorkspace.commitDirectImport(task, payload).ok, false);
      assert.equal(stores(c), before, role + ' 不写客户、任务、恢复日志或镜像');
      assert.match(c.lastToast, /租户管理员|导入权限/);
    }
  });
  await check('总部和门店管理员均可通过通用导入保存本租户客户', () => {
    for (const role of ['admin', 'storeAdmin']) {
      const c = setup(role), scope = c.AppState.get(); preparePreview(c); c.CustomerTasks.confirmImport();
      const rows = savedBatches(c).filter(row => row.name === '客户导入权限名单');
      assert.equal(rows.length, 1); assert.equal(rows[0].tenantId, scope.tenantId); assert.equal(rows[0].enterpriseId, scope.enterpriseId);
      assert.equal(rows[0].rows.length, 1); assert.equal(rows[0].rows[0].taskId, undefined);
      assert(!c.test.layers.has('customer-import'));
    }
  });
  await check('管理员可向本租户空任务导入，保留任务关联与正常执行配置', () => {
    const c = setup(), task = emptyTask(c); assert(c.CustomerTasks.canImportToTask(task));
    preparePreview(c, task); c.CustomerTasks.confirmImport();
    assert.equal(task.total, 1); assert.equal(task.status, '待启动');
    const imported = savedBatches(c).find(row => row.name === '客户导入权限名单');
    assert.equal(imported.rows[0].taskId, task.taskId); assert.equal(imported.tenantId, HQ);
    assert(task.alictiImportDrafts.length > 0);
  });
  await check('管理员不能向其他租户导入或绕过任务入口提交跨租户批次', () => {
    const c = setup(), task = emptyTask(c, 'SH', { tenantId: SH, enterpriseId: '7522241' }), payload = batch(c, task), before = stores(c);
    assert.equal(c.CustomerTasks.canImportToTask(task), false);
    c.CustomerTasks.importDialog(task.taskId); assert(!c.test.layers.has('customer-import'));
    assert.equal(c.CustomerTasks.commitImportBatch(payload), false);
    assert.equal(c.CloudTaskWorkspace.commitDirectImport(task, payload).ok, false);
    assert.equal(stores(c), before);
  });
  await check('普通和任务导入预览后换为超管、运营或另一有效租户时拒绝旧提交', () => {
    for (const taskImport of [false, true]) for (const nextRole of ['super', 'operator', 'storeAdmin']) {
      const c = setup(), task = taskImport ? emptyTask(c) : null; preparePreview(c, task);
      // Replace the current session with another fully valid, real AppState session;
      // the existing modal and preview belong to the previous authorized context.
      c.AppState = setup(nextRole).AppState;
      const before = stores(c); c.CustomerTasks.confirmImport();
      assert.equal(stores(c), before, `${taskImport}/${nextRole}`);
      assert(c.test.layers.has('customer-import')); assert.equal(c.test.nodes.get('customer-import-text').value, '客户甲,13800000991,权限回归,LEAD-991');
    }
  });
  await check('预览后管理员成员降权或账号停用时不能写入旧名单', () => {
    for (const disabled of [false, true]) {
      const c = setup(); preparePreview(c);
      if (disabled) c.CloudCallData.accounts.find(row => row.accountId === 'ACC-ADMIN-018').status = '停用';
      else c.CloudCallData.memberships.find(row => row.accountId === 'ACC-ADMIN-018' && row.tenantId === HQ).roleCode = 'OPERATOR';
      const before = stores(c); c.CustomerTasks.confirmImport(); assert.equal(stores(c), before); assert(c.test.layers.has('customer-import'));
    }
  });
  await check('读取CSV期间权限或有效租户变化时不回写已失效表单', async () => {
    for (const nextRole of ['super', 'operator', 'storeAdmin']) {
      const c = setup(); preparePreview(c); const textBefore = c.test.nodes.get('customer-import-text').value;
      let finish; const pending = c.CustomerTasks.readFile({ name: 'customers.csv', size: 20, text: () => new Promise(resolve => { finish = resolve; }) });
      assert(finish, '管理员有效时应开始读取'); c.AppState = setup(nextRole).AppState;
      const before = stores(c); finish('其他文件内容'); await pending;
      assert.equal(c.test.nodes.get('customer-import-text').value, textBefore); assert.equal(stores(c), before);
    }
  });
  await check('有效管理员可读取CSV并要求重新预览后再提交', async () => {
    const c = setup(); preparePreview(c);
    await c.CustomerTasks.readFile({ name: 'customers.csv', size: 20, text: async () => '客户乙,13800000992,新备注,LEAD-992' });
    assert.equal(c.test.nodes.get('customer-import-text').value, '客户乙,13800000992,新备注,LEAD-992');
    assert.equal(c.test.nodes.get('customer-import-confirm').disabled, true);
    const before = stores(c); c.CustomerTasks.confirmImport(); assert.equal(stores(c), before);
    c.CustomerTasks.previewImport(); c.CustomerTasks.confirmImport();
    assert.equal(savedBatches(c).find(row => row.name === '客户导入权限名单').rows[0].phone, '13800000992');
  });
  await check('超管仍可管理和分配已有客户，导入禁令不改变管理权限', () => {
    const c = setup('super'), payload = batch(c); payload.tenantId = HQ; payload.enterpriseId = '7522240';
    c.localStorage.setItem(batchKey, JSON.stringify([payload, ...savedBatches(c)]));
    c.CustomerTasks.render({ batchId: payload.id });
    assert(c.CustomerTasks.pendingForTask(HQ, '7522240').some(row => row.id === payload.rows[0].id));
    const owner = c.CustomerTasks.owners(HQ)[0]; assert(owner, '本租户有效接单账号');
    assert.equal(c.CustomerTasks.assign([payload.rows[0].id], '人工外呼', owner.accountId), true);
    assert.equal(savedBatches(c).find(row => row.id === payload.id).rows[0].ownerId, owner.accountId);
    assert.equal(c.AppState.canAction('task.create'), true);
  });
  await check('已有导入事务失败后即使身份变更仍可技术回滚本次精确批次', () => {
    const c = setup(), payload = batch(c), before = c.localStorage.getItem(batchKey);
    assert.equal(c.CustomerTasks.commitImportBatch(payload), true);
    c.AppState = setup('super').AppState;
    assert.equal(c.CustomerTasks.rollbackImportBatch(payload), true);
    assert.equal(c.localStorage.getItem(batchKey), before);
  });
  console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', count: checks.length + failures.length, passed: checks.length, failed: failures.length, checks, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})();
