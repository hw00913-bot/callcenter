/** Optional CSV externalDocumentId through actual prototype handlers.
 * DOM/storage/timers are VM doubles: no browser, real telephony or API claim.
 */
'use strict';
const assert = require('node:assert/strict');
const { setup } = require('./fixtures/prototype-vm.cjs');
const batchKey = 'customer-task-batches-v1', nativeKey = 'native-workbench-records-v1';
const tenantId = 'TEN-NISSAN-HQ', instanceId = 'CCC-NISSAN', ownerId = 'ACC-OPS-CHEN';
const tests = [];
const test = (name, run) => tests.push({ name, run });
const header3 = '客户称呼,客户号码,联系备注';
const header4 = header3 + ',外部单据标识';
const csv = cells => cells.map(value => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(',');
const readBatches = x => JSON.parse(x.local.get(batchKey) || '[]');
const doc = row => row.externalDocumentId ?? '';
function fixture(profile = 'admin', domain = 'CLOUD_CONTACT_CENTER') {
  const x = setup(profile, domain);
  // This test owns its source records. Keep all current role/seat/resource data.
  x.local.clear(); x.d.calls.splice(0);
  return x;
}
function restored(source, profile = 'operator-chen', domain = 'CLOUD_CONTACT_CENTER') {
  const x = fixture(profile, domain);
  for (const [key, value] of source.local) x.local.set(key, value);
  // Fresh VM with copied raw journals, recovered by the actual store readers.
  // This is recovery evidence, not a browser-refresh claim.
  x.ctx.CustomerDirectory.sync();
  return x;
}
function importBatch(x, name, text) {
  const before = new Set(readBatches(x).map(b => b.id)), api = x.ctx.CustomerTasks;
  api.importDialog();
  x.field('customer-batch-name', name); x.field('customer-import-text', text);
  x.field('customer-import-preview', ''); x.field('customer-import-confirm', '');
  api.previewImport();
  assert.equal(x.nodes.get('customer-import-confirm').disabled, false, 'Valid rows must enable confirmation');
  api.confirmImport();
  const created = readBatches(x).filter(b => !before.has(b.id));
  assert.equal(created.length, 1, 'Actual import confirmation creates exactly one batch');
  return created[0];
}
function assign(x, b, rowIndex, method, targetId) {
  x.ctx.CustomerTasks.open(b.id);
  assert.equal(x.ctx.CustomerTasks.assign([b.rows[rowIndex].id], method, targetId), true);
  return readBatches(x).find(item => item.id === b.id).rows[rowIndex];
}
function task(x, id, type) {
  const row = { taskId: id, tenantId, instanceId, callType: type, name: id, status: '待分配客户', completed: 0, total: 0, customerSourceMode: 'assigned', simulation: true };
  x.d.tasks.push(row); return row;
}
function assertEscaped(x, html, value, where) {
  assert(!html.includes(value), `${where}: unescaped HTML must not be inserted`);
  assert(html.includes(x.ctx.PlatformUI.escape(value)), `${where}: escaped value must still be readable`);
}

test('Legacy three-column CSV and optional fourth empty column preserve the original three fields', () => {
  const x = fixture(), api = x.ctx.CustomerTasks;
  for (const text of [
    header3 + '\n旧格式,13800007101,保留备注',
    '旧格式,13800007101,保留备注',
    header4 + '\n旧格式,13800007101,保留备注,',
    header4 + '\n旧格式,13800007101,保留备注,"   "'
  ]) {
    const prepared = api.prepare('三列兼容', text);
    assert.equal(prepared.good.length, 1); assert.equal(prepared.errors.length, 0);
    const row = prepared.good[0];
    assert.equal(row.name, '旧格式'); assert.equal(row.phone, '13800007101'); assert.equal(row.note, '保留备注');
    assert.equal(doc(row), '');
  }
  const b = importBatch(x, '旧格式实际导入', header3 + '\n旧格式,13800007101,保留备注');
  assert.equal(doc(b.rows[0]), ''); assert.equal(b.rows[0].note, '保留备注');
  x.ctx.CustomerTasks.importDialog();
  assert((x.layers.get('customer-import') || '').includes('外部单据标识'), 'Import help must explain the optional fourth field');
});

test('Four-column CSV keeps leading zeroes, comma/quote identifiers and tab-separated pasted values as strings', () => {
  const x = fixture(), api = x.ctx.CustomerTasks;
  const inputs = [
    { text: header4 + '\n' + csv(['前导零', '13800007102', '备注01', '00000127']), value: '00000127' },
    { text: header4 + '\n' + csv(['带符号', '13800007103', '备注,也含逗号', 'DOC,00"7']), value: 'DOC,00"7' },
    { text: '客户称呼\t客户号码\t联系备注\t外部单据标识\n粘贴客户\t13800007104\t保留备注\t00000008', value: '00000008' }
  ];
  for (const { text, value } of inputs) {
    const prepared = api.prepare('四列格式', text);
    assert.equal(prepared.good.length, 1); assert.equal(prepared.errors.length, 0);
    assert.equal(prepared.good[0].externalDocumentId, value);
    assert.equal(typeof prepared.good[0].externalDocumentId, 'string');
    const b = importBatch(x, '四列实际导入 ' + value, text);
    assert.equal(b.rows[0].externalDocumentId, value);
  }
});

test('Fifth columns are rejected per row; original phone de-duplication remains the only import identity rule', () => {
  const x = fixture(), api = x.ctx.CustomerTasks;
  for (const fifth of ['unexpected', '']) {
    const p = api.prepare('拒绝五列', header4 + '\n' + csv(['五列', '13800007105', '', 'DOC-1', fifth]));
    assert.equal(p.good.length, 0); assert.equal(p.errors.length, 1);
  }
  const p = api.prepare('去重规则', header4 + '\n' + [
    ['第一条', '13800007106', '', 'SAME-ID'],
    ['同号不同标识', '13800007106', '', 'OTHER-ID'],
    ['不同号码同标识', '13800007107', '', 'SAME-ID']
  ].map(csv).join('\n'));
  assert.equal(p.good.length, 2); assert.equal(p.errors.length, 1);
  assert.match(p.errors[0].reason, /重复/);
  assert.deepEqual(Array.from(p.good, row => [row.phone, row.externalDocumentId]), [['13800007106', 'SAME-ID'], ['13800007107', 'SAME-ID']]);
});

test('Same phone across batches has one archive while different per-batch identifiers remain intact', () => {
  const x = fixture(), phone = '13800007108';
  const a = importBatch(x, '来源单据一', header4 + '\n' + csv(['客户甲', phone, '第一份备注', '000-SOURCE-A']));
  const b = importBatch(x, '来源单据二', header4 + '\n' + csv(['客户甲', phone, '第二份备注', '000-SOURCE-B']));
  const before = x.local.get(batchKey), customers = x.ctx.CustomerDirectory.list().filter(c => c.phone === phone);
  assert.equal(customers.length, 1); assert.equal(customers[0].batchCount, 2);
  assert.equal(customers[0].batches.find(r => r.rowId === a.rows[0].id).externalDocumentId, '000-SOURCE-A');
  assert.equal(customers[0].batches.find(r => r.rowId === b.rows[0].id).externalDocumentId, '000-SOURCE-B');
  assert.equal(x.local.get(batchKey), before, 'Archive collection must not rewrite source batch rows');
  x.ctx.CustomerDirectory.open(phone, tenantId, instanceId);
  const detail = x.layers.get('customer-directory-detail') || '';
  for (const value of ['外部单据标识', '000-SOURCE-A', '000-SOURCE-B']) assert(detail.includes(value), value);
  const refresh = restored(x, 'admin'), customer = refresh.ctx.CustomerDirectory.list().find(c => c.phone === phone);
  assert.equal(customer.batchCount, 2);
  assert.deepEqual(Array.from(customer.batches, r => r.externalDocumentId).sort(), ['000-SOURCE-A', '000-SOURCE-B']);
});

test('Manual, predictive and IVR assignment retain identifiers; task attachment and release do not consume them', () => {
  const x = fixture(), values = ['MAN-0001', 'PRE-0002', 'IVR-0003', 'ATTACH-0004'];
  const b = importBatch(x, '分配字段保持', header4 + '\n' + values.map((v, i) => csv(['分配客户' + i, '1380000720' + (i + 1), '联系备注', v])).join('\n'));
  assert(x.ctx.CustomerTasks.owners(tenantId).some(a => a.accountId === ownerId));
  const pre = task(x, 'QA-EXT-PRE', '预外呼'), ivr = task(x, 'QA-EXT-IVR', 'IVR 外呼');
  assert.equal(assign(x, b, 0, '人工外呼', ownerId).externalDocumentId, values[0]);
  assert.equal(assign(x, b, 1, '预外呼', pre.taskId).externalDocumentId, values[1]);
  assert.equal(assign(x, b, 2, 'IVR 外呼', ivr.taskId).externalDocumentId, values[2]);
  assert.equal(x.ctx.CustomerTasks.taskCustomers(pre)[0].externalDocumentId, values[1]);
  assert.equal(x.ctx.CustomerTasks.taskCustomers(ivr)[0].externalDocumentId, values[2]);
  assert.equal(x.ctx.CustomerTasks.pendingForTask(tenantId, instanceId).find(r => r.id === b.rows[3].id).externalDocumentId, values[3]);
  const fresh = task(x, 'QA-EXT-ATTACH', '预外呼');
  assert.equal(x.ctx.CustomerTasks.attachToNewTask(fresh, [b.rows[3].id]), true);
  assert.equal(x.ctx.CustomerTasks.taskCustomers(fresh)[0].externalDocumentId, values[3]);
  assert.equal(x.ctx.CustomerTasks.releaseUnstartedTask(fresh), true);
  assert.equal(x.ctx.CustomerTasks.pendingForTask(tenantId, instanceId).find(r => r.id === b.rows[3].id).externalDocumentId, values[3]);
  x.ctx.CustomerTasks.setAssignmentView('all');
  const html = x.ctx.CustomerTasks.render({ batchId: b.id });
  assert(html.includes('外部单据标识')); values.forEach(value => assert(html.includes(value), value));
});

test('Actual manual contact, saved call and batch call snapshot retain the identifier after store recovery', async () => {
  const a = fixture(), value = '000-MANUAL,"BIZ"';
  const b = importBatch(a, '人工通话单据', header4 + '\n' + csv(['人工客户', '13800007301', '单据跟进', value]));
  assign(a, b, 0, '人工外呼', ownerId);
  const x = restored(a), api = x.ctx.CustomerTasks, w = x.ctx.AgentWorkbench;
  assert.equal(api.mine().find(r => r.id === b.rows[0].id).externalDocumentId, value);
  api.pick(b.rows[0].id);
  const dialog = () => x.layers.get('assigned-call-dialog') || '';
  assert(dialog().includes('外部单据标识')); assert(dialog().includes(x.ctx.PlatformUI.escape(value)));
  w.updateField('skillGroupId', 'SG-ALI-HQ-SALES'); w.signIn(); await Promise.resolve();
  assert.equal(w.dial(), true);
  const answer = [...x.timers.values()].find(t => t.ms === 2400); assert(answer); answer.fn();
  w.end(); w.setDisposition('已完成沟通'); w.setRemark('按外部单据完成跟进'); w.saveDisposition();
  const call = x.d.calls.find(c => c.customerTaskItemId === b.rows[0].id);
  assert(call); assert.equal(call.externalDocumentId, value); assert.equal(call.processingStatus, '已完成');
  assert.equal(JSON.parse(x.local.get(nativeKey)).find(c => c.callId === call.callId).externalDocumentId, value);
  const savedRow = readBatches(x).find(r => r.id === b.id).rows[0];
  assert.equal(savedRow.externalDocumentId, value); assert.equal(savedRow.calls.length, 1);
  assert.equal(savedRow.calls[0].externalDocumentId, value); assert.equal(savedRow.followup, '已完成');
  const r = restored(x), restoredCall = r.ctx.CustomerDirectory.calls().find(c => c.callId === call.callId);
  assert(restoredCall); assert.equal(restoredCall.externalDocumentId, value);
  assert.equal(restoredCall.processingStatus, '已完成');
  const customer = r.ctx.CustomerDirectory.list().find(c => c.phone === '13800007301');
  assert.equal(customer.batches[0].externalDocumentId, value); assert.equal(customer.calls[0].externalDocumentId, value);
  const before = r.local.get(batchKey); r.ctx.CustomerDirectory.sync(); r.ctx.CustomerDirectory.sync();
  assert.equal(r.local.get(batchKey), before); assert.equal(r.d.calls.filter(c => c.callId === call.callId).length, 1);
  w.signOut();
});

test('Identifier does not widen operator ownership, cross-tenant/instance access or AI-domain access', () => {
  const a = fixture(), phone = '13800007401';
  const mine = importBatch(a, '本人单据批次', header4 + '\n' + csv(['同号客户', phone, '', 'OWN-DOC-01']));
  const other = importBatch(a, '他人单据批次', header4 + '\n' + csv(['同号客户', phone, '', 'SECRET-DOC-02']));
  assign(a, mine, 0, '人工外呼', ownerId);
  assert(a.ctx.CustomerTasks.owners(tenantId).some(r => r.accountId === 'ACC-OPS-108'));
  assign(a, other, 0, '人工外呼', 'ACC-OPS-108');
  const x = restored(a), api = x.ctx.CustomerTasks;
  assert.equal(api.mine().length, 1); assert.equal(api.row(other.rows[0].id), null);
  assert.throws(() => api.prepare('不能导入', header4 + '\n' + csv(['客户', '13800007402', '', 'NO-IMPORT'])));
  api.open(mine.id); assert.equal(api.assign([mine.rows[0].id], '人工外呼', ownerId), false);
  assert(!api.render().includes('SECRET-DOC-02'));
  const customer = x.ctx.CustomerDirectory.list().find(c => c.phone === phone);
  assert.equal(customer.batchCount, 1); assert.equal(customer.batches[0].externalDocumentId, 'OWN-DOC-01');
  assert(!JSON.stringify(customer).includes('SECRET-DOC-02'));
  x.ctx.CustomerDirectory.open(phone, tenantId, instanceId);
  assert(!(x.layers.get('customer-directory-detail') || '').includes('SECRET-DOC-02'));
  api.pick(other.rows[0].id); assert(!x.layers.has('assigned-call-dialog'));
  const store = restored(a, 'operator');
  assert.equal(store.ctx.CustomerTasks.mine().length, 0); assert.equal(store.ctx.CustomerTasks.row(mine.rows[0].id), null);
  assert(!JSON.stringify(store.ctx.CustomerDirectory.list()).includes('OWN-DOC-01'));
  const ai = restored(a, 'operator-chen', 'AI_OUTBOUND');
  assert.equal(ai.ctx.CustomerTasks.mine().length, 0); assert.equal(ai.ctx.CustomerDirectory.list().length, 0);
  assert(!ai.ctx.CustomerTasks.render().includes('OWN-DOC-01'));
  const foreign = structuredClone(mine); foreign.id = 'QA-EXT-FOREIGN'; foreign.tenantId = 'TEN-EPI-HQ'; foreign.instanceId = 'CCC-EPI';
  foreign.rows[0].id = 'QA-EXT-FOREIGN-ROW'; foreign.rows[0].externalDocumentId = 'OTHER-BRAND-DOC';
  a.local.set(batchKey, JSON.stringify([...readBatches(a), foreign]));
  const superEnv = restored(a, 'super');
  assert(!JSON.stringify(superEnv.ctx.CustomerDirectory.list()).includes('OTHER-BRAND-DOC'));
  assert.equal(superEnv.ctx.CustomerTasks.row('QA-EXT-FOREIGN-ROW'), null);
});

test('Temporary dial and archive selection never inherit the previous assigned document or write a business record ID', async () => {
  const a = fixture(), value = '000-ASSIGNED-ONLY';
  const b = importBatch(a, '临时拨号隔离', header4 + '\n' + csv(['待回访客户', '13800007601', '', value]));
  assign(a, b, 0, '人工外呼', ownerId);
  const x = restored(a), api = x.ctx.CustomerTasks, w = x.ctx.AgentWorkbench;
  const dialog = () => x.layers.get('assigned-call-dialog') || '';
  const finish = () => { w.end('接通'); w.setDisposition('需要再次联系'); w.setRemark('明天继续核对'); w.saveDisposition(); };
  api.pick(b.rows[0].id); w.updateField('skillGroupId', 'SG-ALI-HQ-SALES');
  w.signIn(); await Promise.resolve(); assert.equal(w.dial(), true); finish();
  const assigned = x.d.calls.find(c => c.customerTaskItemId === b.rows[0].id);
  assert.equal(assigned.externalDocumentId, value); assert.equal(assigned.businessRecordId, '');
  // Re-select the still-pending row to put its document into the real draft,
  // then switch to temporary mode before dialing. No direct draft mutation.
  api.pick(b.rows[0].id); assert(dialog().includes(value));
  w.openTemporary(); assert(!dialog().includes(value));
  w.updateField('customerName', '临时新客户'); w.updateField('phone', '13800007602');
  assert.equal(w.dial(), true); finish();
  const fresh = x.d.calls.find(c => c.callee === '13800007602');
  assert(fresh); assert.equal(fresh.externalDocumentId, ''); assert.equal(fresh.customerTaskItemId, ''); assert.equal(fresh.businessRecordId, '');
  // Selecting an archive with the same phone and a known batch document is
  // still a temporary contact: a customer is not itself a unique source bill.
  api.pick(b.rows[0].id); assert(dialog().includes(value));
  const customer = x.ctx.CustomerDirectory.list().find(c => c.phone === '13800007601');
  w.chooseContact(customer.id); assert(!dialog().includes(value));
  assert.equal(w.dial(), true); finish();
  const archived = x.d.calls.find(c => c.callee === '13800007601' && !c.customerTaskItemId);
  assert(archived); assert.equal(archived.externalDocumentId, ''); assert.equal(archived.businessRecordId, '');
  for (const call of [fresh, archived]) {
    const stored = JSON.parse(x.local.get(nativeKey)).find(c => c.callId === call.callId);
    assert.equal(stored.externalDocumentId, ''); assert.equal(stored.businessRecordId, '');
  }
  const source = readBatches(x).find(item => item.id === b.id).rows[0];
  assert.equal(source.externalDocumentId, value); assert.equal(source.calls.length, 1, 'Temporary calls must not update the source assignment');
  w.signOut();
});

test('Actual new predictive and IVR tasks keep each external document in the result and committed row snapshot', () => {
  const x = fixture(), w = x.ctx.CloudTaskWorkspace, c = x.ctx.CustomerTasks;
  // Same minimal readiness fixture used by check-local-task-simulation.cjs;
  // the actual task wizard, authorization and simulation guards still execute.
  x.d.phoneNumbers.push({ ...structuredClone(x.d.phoneNumbers.find(n => n.numberId === 'NUM-400-8801')), numberId: 'QA-EXT-LOCAL-NUM', number: '02100007777' });
  for (const [i, type] of ['预外呼', 'IVR 外呼'].entries()) {
    const value = '000-TASK-' + i, name = '外部单据任务 ' + type;
    const b = importBatch(x, name + '客户', header4 + '\n' + csv(['任务客户', '1380000770' + i, '', value]));
    w.start(type); w.update('name', name); w.update('scheduleMode', '保存后手工启动');
    w.setResource('callerNumberId', 'QA-EXT-LOCAL-NUM'); w.setResource('skillGroupId', 'SG-ALI-HQ-AFTER');
    w.setResource('executionQueueId', 'SG-ALI-HQ-AFTER');
    if (type === 'IVR 外呼') w.setResource('transferEnabled', false);
    w.setResource('contactFlowId', type === '预外呼' ? 'FLOW-PRED-HQ-V1' : 'FLOW-MAINTAIN-OUT-V4');
    w.toggleCustomer(b.rows[0].id, true); w.submit();
    const current = x.d.tasks.find(t => t.name === name);
    assert(current, JSON.stringify(x.messages)); assert(w.isLocalSimulationTask(current));
    assert.equal(c.taskCustomers(current)[0].externalDocumentId, value);
    w.controlTask(current.taskId, 'start'); assert.equal(current.status, '执行中', JSON.stringify(x.messages));
    assert.equal(x.ctx.ScenarioDemo.runNext(current.taskId, '接通'), true, JSON.stringify(x.messages));
    const call = x.d.calls.find(call => call.taskId === current.taskId);
    assert(call); assert.equal(call.externalDocumentId, value); assert.equal(call.callSource, 'LOCAL_TASK_SIMULATION');
    assert.equal(call.businessRecordId, ''); assert.equal(call.callbackStatus, '无需回流'); assert(!call.recordingUrl);
    const row = readBatches(x).find(item => item.id === b.id).rows[0];
    assert.equal(row.externalDocumentId, value); assert.equal(row.calls.length, 1); assert.equal(row.calls[0].externalDocumentId, value);
    const journal = JSON.parse(x.local.get('local-task-result-journal-v1'));
    assert.equal(journal.calls.find(item => item.callId === call.callId).externalDocumentId, value);
    assert.equal(current.status, '已完成'); assert.equal(x.ctx.ScenarioDemo.runNext(current.taskId), false);
  }
});

test('Batch list, customer archive and assigned contact dialog HTML-escape the imported identifier', () => {
  const a = fixture(), value = '<img src=x onerror="boom"> & \'Q\'';
  const b = importBatch(a, '转义测试', header4 + '\n' + csv(['正常称呼', '13800007501', '正常备注', value]));
  assert.equal(b.rows[0].externalDocumentId, value);
  assertEscaped(a, a.ctx.CustomerTasks.render({ batchId: b.id }), value, 'Batch list');
  a.ctx.CustomerDirectory.open('13800007501', tenantId, instanceId);
  assertEscaped(a, a.layers.get('customer-directory-detail') || '', value, 'Customer archive');
  assign(a, b, 0, '人工外呼', ownerId);
  const x = restored(a); x.ctx.CustomerTasks.pick(b.rows[0].id);
  assertEscaped(x, x.layers.get('assigned-call-dialog') || '', value, 'Assigned contact dialog');
});

(async () => {
  let failures = 0;
  for (const { name, run } of tests) {
    try { await run(); console.log('PASS ' + name); }
    catch (error) { failures++; console.error('FAIL ' + name + '\n' + error.stack); }
  }
  console.log(`External document VM regression: ${tests.length - failures}/${tests.length} passed; no browser, real call or external API claim.`);
  if (failures) process.exitCode = 1;
})();
