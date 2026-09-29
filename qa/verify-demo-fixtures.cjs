/* Local fictional fixture integration checks. No browser UI, network, or supplier POC. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.resolve(__dirname, '..'), checks = [], failures = [];
const marker = 'alicti-showcase-v1', prefix = 'alicti-demo-v2:';
const files = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
const clone = value => JSON.parse(JSON.stringify(value));
function check(name, fn) { try { fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.message }); } }
function memory(initial = {}) { return new Map(Object.entries(initial)); }
function fixture(options = {}) {
  const local = options.local || memory(), session = options.session || memory();
  let uuid = 0;
  class Storage {
    constructor(map) { this.map = map; }
    getItem(key) { return this.map.get(String(key)) ?? null; }
    setItem(key, value) { this.map.set(String(key), String(value)); }
    removeItem(key) { this.map.delete(String(key)); }
    clear() { this.map.clear(); }
    key(index) { return [...this.map.keys()][index] ?? null; }
    get length() { return this.map.size; }
  }
  const element = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, insertBefore() {}, remove() {}, addEventListener() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1280, height: 800 }) });
  const document = { addEventListener() {}, dispatchEvent() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: element, createTreeWalker: () => ({ nextNode: () => null }), documentElement: element(), body: element(), head: element(), activeElement: null };
  const now = options.now || new Date(new Date().setHours(15, 0, 0, 0)).getTime();
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const ctx = { URL, URLSearchParams, structuredClone, console, Date: Clock, Storage, localStorage: new Storage(local), sessionStorage: new Storage(session), document,
    navigator: {}, NodeFilter: { SHOW_TEXT: 4 }, location: { hash: '', search: '', pathname: '/index.html', href: 'http://localhost/index.html' }, history: { replaceState() {}, pushState() {} },
    crypto: { randomUUID: () => 'SYNTHETIC-TEST-UUID-' + (++uuid) }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    addEventListener() {}, dispatchEvent() {}, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: false, addEventListener() {} }), MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} },
    fetch() { throw Error('Unexpected network request during fixture verification'); }, performance: { now: () => 0 }, innerWidth: 1280, innerHeight: 800 };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  ctx.testStores = { local, session };
  return ctx;
}
function signedIn(tenantId = 'TEN-NISSAN-HQ', accountId = 'ACC-ADMIN-018') {
  return memory({ [prefix + 'unified-call-context-v3']: JSON.stringify({ accountId, sessionId: 'fixture-only', tenantId, enterpriseId: tenantId === 'TEN-NISSAN-SH' ? '7522241' : '7522240', activeDomain: 'CLOUD_CONTACT_CENTER', authStage: 'READY', currentPage: 'home' }) });
}
const tagged = rows => rows.filter(row => row.demoPack === marker);
const sameScope = (a, b) => a.tenantId === b.tenantId && String(a.enterpriseId) === String(b.enterpriseId);
const repeatRows = ctx => JSON.parse(ctx.localStorage.getItem('customer-task-batches-v1')).flatMap(batch => batch.rows.filter(row => row.repeatContactFixture).map(row => ({ ...row, batchId: batch.id, tenantId: batch.tenantId, enterpriseId: batch.enterpriseId })));
const repeatSpec = rows => ({ version: 1, sourceTaskId: rows[0]?.taskId || '', sourceRefs: rows.map(row => ({ batchId: row.batchId, itemId: row.id, taskId: row.taskId, callId: row.sourceCall?.callId || row.calls.at(-1).callId })), reason: '', note: '' });
function unique(rows, key) { assert(rows.every(row => typeof row[key] === 'string' && row[key]), key + ' must be a nonempty string'); assert.equal(new Set(rows.map(row => row[key])).size, rows.length, 'duplicate ' + key); }
module.exports = { fixture, memory, signedIn };
if (require.main === module) {
let c;
check('按真实 index 外部脚本顺序加载，禁止网络请求', () => { c = fixture({ session: signedIn() }); assert(c.DemoFixtureKit && c.CloudReportData && c.CustomerTasks && c.ScenarioDemo); });
if (c) {
  const d = c.CloudCallData, kit = c.DemoFixtureKit, tasks = tagged(d.tasks), calls = tagged(d.calls), batches = tagged(JSON.parse(c.localStorage.getItem('customer-task-batches-v1'))), customers = batches.flatMap(batch => batch.rows.map(row => ({ ...row, tenantId: batch.tenantId, enterpriseId: batch.enterpriseId, batchId: batch.id })));
  check('完整页面的三个大存储键逐字压缩还原，刷新保留既有记录且业务正常读取', () => {
    const keys = ['customer-task-batches-v1', 'local-task-result-journal-v1', 'customer-directory-v1'];
    const before = Object.fromEntries(keys.map(key => [key, c.localStorage.getItem(key)]));
    for (const key of keys) assert(c.testStores.local.get(prefix + key).length < before[key].length, key + ' 应减少实际存储体积');
    const raw = memory(), writer = new c.Storage(raw);
    for (const key of keys) writer.setItem(key, before[key]);
    const reader = new c.Storage(raw);
    for (const key of keys) assert.equal(reader.getItem(key), before[key], key + ' 对真实页面文本编码后必须逐字还原');
    const reloaded = fixture({ local: memory(clone(Object.fromEntries(c.testStores.local))), session: memory(clone(Object.fromEntries(c.testStores.session))) });
    for (const key of keys.slice(0, 2)) assert.equal(reloaded.localStorage.getItem(key), before[key], key + ' 刷新保持原文');
    // The directory also gathers workbench fixtures installed after its first
    // initial sync. Existing records remain exact while those rows are added.
    const directory = JSON.parse(reloaded.localStorage.getItem(keys[2])).calls;
    for (const call of JSON.parse(before[keys[2]]).calls) assert.deepStrictEqual(directory.find(row => row.callId === call.callId), call);
    assert.equal(reloaded.RepeatPredictive.sources({ waiting: true }).filter(row => !row.blockReason).length, 2);
  });
  check('数据集明确标记本地虚拟数据且当前批次包含任务、客户、话单', () => { assert.equal(kit.version, marker); assert(tasks.length > 0 && calls.length > 0 && customers.length > 0); for (const rows of [tasks, calls, batches, customers]) assert(rows.every(row => row.simulation === true && row.demoPack === marker)); assert.equal(d.meta.showcase.synthetic, true); });
  check('各模块主键唯一，任务与话单使用当日批次标识', () => {
    const modules = { tasks: 'taskId', predictiveTasks: 'taskId', ivrTasks: 'taskId', calls: 'callId', agents: 'agentRecordId', agentSkills: 'relationId', physicalSkillGroups: 'physicalGroupId', phoneNumbers: 'numberId', lines: 'lineId', callPlans: 'callPlanId', inboundRoutes: 'routeId', audits: 'auditId', exceptions: 'exceptionId', syncRecords: 'syncId' };
    for (const [name, key] of Object.entries(modules)) unique(tagged(d[name]), key);
    unique(batches, 'id'); unique(customers, 'id');
    for (const [rows, key] of [[tasks, 'taskId'], [calls, 'callId'], [batches, 'id'], [customers, 'id']]) assert(rows.every(row => row[key].startsWith('SHOWCASE-') && row[key].includes(kit.cohort)));
  });
  check('客户名单关联任务、客户记录及话单不跨租户或企业', () => {
    for (const row of customers) {
      if (row.taskId) assert(tasks.some(task => task.taskId === row.taskId && sameScope(task, row)), row.id);
      for (const entry of row.calls) { const call = calls.find(call => call.callId === entry.callId); assert(call && sameScope(call, row) && call.customerTaskItemId === row.id, entry.callId); }
      for (const entry of row.history.filter(item => item.callId)) assert(row.calls.some(call => call.callId === entry.callId));
    }
    for (const call of calls) { const row = customers.find(row => row.id === call.customerTaskItemId); assert(row && sameScope(row, call)); if (call.taskId) assert(tasks.some(task => task.taskId === call.taskId && sameScope(task, call))); }
  });
  check('客户号码可按现有校验输入，任务主叫在本租户授权内', () => {
    assert(customers.every(row => /^1\d{10}$/.test(row.phone)));
    for (const task of tasks) { const number = d.phoneNumbers.find(row => row.numberId === task.callerNumberId); assert(number && /^\d{7,15}$/.test(number.number)); assert.equal(number.enterpriseId, task.enterpriseId); assert(number.authorizedTenantIds.includes(task.tenantId)); assert.equal(number.businessStatus, '正常'); }
    for (const call of calls) { const number = d.phoneNumbers.find(row => row.numberId === call.callerNumberId); assert(number && number.authorizedTenantIds.includes(call.tenantId)); assert.equal(call.callType === '呼入' ? call.callee : call.caller, number.number); }
  });
  check('坐席工号保留字符串与前导零，技能等级为 1～10 且关系同范围', () => {
    const seats = tagged(d.agents); assert(seats.every(row => typeof row.cno === 'string' && /^\d+$/.test(row.cno))); assert(seats.some(row => /^0/.test(row.cno)));
    const scopedCnos = seats.filter(row => row.lifecycleStatus !== '已删除').map(row => row.enterpriseId + ':' + row.cno); assert.equal(new Set(scopedCnos).size, scopedCnos.length);
    for (const relation of tagged(d.agentSkills)) { const agent = d.agents.find(row => row.contactCenterIdentityId === relation.identityId), group = d.physicalSkillGroups.find(row => row.physicalGroupId === relation.physicalGroupId); assert(agent && group && sameScope(agent, group)); assert(Number.isInteger(relation.skillLevel) && relation.skillLevel >= 1 && relation.skillLevel <= 10); }
  });
  check('精简样例保留两租户和两类任务，整体覆盖待启动、执行中、暂停、结束', () => { for (const scope of kit.scopes) for (const type of ['预外呼', 'IVR 外呼']) { const rows = tasks.filter(row => sameScope(row, scope) && row.callType === type); assert(rows.length > 0); assert(rows.every(row => row.localPrototypeTask && !row.displayOnly)); } assert.deepEqual([...new Set(tasks.map(row => row.providerStatusCode))].sort(), [0, 1, 2, 3]); });
  check('暂停可继续同一任务，结束后不保留后续执行标记', () => { for (const task of tasks) { assert.equal(task.alictiMockTaskProperty.status, task.providerStatusCode); if (task.providerStatusCode === 2) assert(task.stopNewDialing); if (task.providerStatusCode === 3) { assert(task.stopNewDialing && !task.hasNextAttempt); assert(calls.filter(call => call.taskId === task.taskId).every(call => !call.hasNextAttempt)); } } });
  check('任务进度按客户计数，重呼保留独立的首次历史', () => { for (const task of tasks) { const rows = customers.filter(row => row.taskId === task.taskId); assert.equal(task.total, rows.length); assert.equal(task.completed, rows.filter(row => row.calls.some(call => call.endedAt)).length); assert.equal(task.connected, rows.filter(row => row.calls.some(call => call.endedAt && c.CallState.view(call).answered === true)).length); } const retries = calls.filter(call => call.attemptNumber > 1); assert(retries.length); for (const call of retries) assert(calls.some(first => sameScope(first, call) && first.customerTaskItemId === call.customerTaskItemId && first.attemptNumber === 1 && Date.parse(first.ringingAt) < Date.parse(call.ringingAt))); });
  check('在途话单与终态分离，不计入完成量或终态日志', () => {
    const live = calls.filter(call => !call.endedAt), ended = calls.filter(call => call.endedAt); assert(live.length && ended.length);
    for (const call of live) { assert(!c.CallState.view(call).ended); assert.equal(call.durationSeconds, null); }
    assert(ended.every(call => c.CallState.view(call).ended));
    const journal = JSON.parse(c.localStorage.getItem('local-task-result-journal-v1')).calls; assert(tagged(journal).every(call => call.endedAt && c.CallState.view(call).ended)); assert(!journal.some(call => live.some(item => item.callId === call.callId)));
    assert.equal(c.CloudReportMetrics.stats(calls).total, ended.length);
  });
  check('纯自动外呼没有坐席、人工录音或人工接听证据', () => { const rows = calls.filter(row => row.callType === 'IVR 外呼'); assert(rows.length); for (const call of rows) { assert(!call.agentIdentityId && !call.contactCenterIdentityId && !call.agentName); assert.equal(call.recordingApplicability, 'NOT_APPLICABLE_PURE_IVR'); assert.equal(call.recordingStatus, '不适用'); assert.notEqual(c.CloudReportMetrics.humanAnswer(call), true); assert(!call.recordingUrl && !call.audioUrl); } });
  check('两租户各有两位可再次联系客户，明确区分人工已接听与人工未接听', () => {
    const rows = repeatRows(c), followupCalls = calls.filter(row => row.repeatContactFixture), followupTasks = tasks.filter(row => row.repeatContactFixture);
    assert.equal(rows.length, 4); assert.equal(followupCalls.length, 4); assert.equal(followupTasks.length, 2);
    assert.equal(new Set(rows.map(row => row.phone)).size, 4);
    for (const scope of kit.scopes) {
      const taskId = 'SHOWCASE-' + scope.code + '-' + kit.cohort + '-PRED-SAME-TASK-FOLLOWUP', task = followupTasks.find(row => row.taskId === taskId), scoped = rows.filter(row => sameScope(row, scope));
      assert(task && sameScope(task, scope)); assert.equal(task.status, '已暂停'); assert.equal(task.providerStatusCode, 2); assert.equal(task.autoComplete, 0); assert.equal(task.alictiMockTaskProperty.autoComplete, 0); assert.equal(task.hasNextAttempt, false); assert.equal(task.callType, '预外呼'); assert.equal(scoped.length, 2);
      const dispositions = { answered: 0, unanswered: 0 };
      for (const row of scoped) {
        assert.equal(row.taskId, taskId); assert.equal(row.method, '预外呼'); assert.equal(row.followup, '待继续跟进'); assert.equal(row.ownerId, scope.accountId);
        assert(/^13971\d{6}$/.test(row.phone)); assert.equal(typeof row.externalDocumentId, 'string'); assert(row.externalDocumentId.trim()); assert(!row.activeCallId);
        assert.equal(row.calls.length, 1); const call = followupCalls.find(item => item.callId === row.calls[0].callId);
        assert(call && sameScope(call, row)); assert.equal(call.customerTaskItemId, row.id); assert.equal(call.taskId, taskId); assert.equal(call.processingStatus, '已完成');
        const state = c.CloudReportMetrics.state(call); assert.equal(state.answered, true); assert.equal(state.ended, true); assert.equal(call.alictiCdr.kind, 'predictive');
        if (call.alictiCdr.raw.status === 43) {
          dispositions.answered++; assert.equal(c.CloudReportMetrics.humanAnswer(call), true); assert.equal(call.agentDisposition, '需要再次联系'); assert(call.agentIdentityId && call.contactCenterIdentityId); assert(call.telephony.agentEstablishedAt);
        } else {
          dispositions.unanswered++; assert.equal(call.alictiCdr.raw.status, 42); assert.equal(c.CloudReportMetrics.humanAnswer(call), false); assert.equal(call.agentDisposition, '');
          assert(!call.agentIdentityId && !call.contactCenterIdentityId && !call.agentName && !call.alictiCdr.raw.bridgeTime && !call.alictiCdr.raw.cno);
          assert(!call.telephony.agentEstablishedAt); assert.equal(call.telephony.agentEvidence.length, 0); assert(!call.telephony.rawEvents.some(event => event.role === 'agent'));
        }
      }
      assert.deepStrictEqual(dispositions, { answered: 1, unanswered: 1 });
    }
  });
  check('管理员及本租户运营打开待再次联系均有两位可安排客户且隔离其他租户与坐席', () => {
    const stored = clone(Object.fromEntries(c.testStores.local));
    for (const scope of kit.scopes) for (const accountId of ['ACC-ADMIN-018', scope.accountId]) {
      const fresh = fixture({ local: memory(stored), session: signedIn(scope.tenantId, accountId) }), waiting = fresh.RepeatPredictive.sources({ waiting: true });
      assert.equal(waiting.length, 2, scope.code + '/' + accountId); assert(waiting.every(row => row.repeatContactFixture && sameScope(row, scope) && !row.blockReason));
      const checked = fresh.RepeatPredictive.validateSpec(repeatSpec(waiting)); assert(checked.ok, checked.message); assert.equal(checked.rows.length, 2); assert(sameScope(checked, scope));
      const foreign = repeatRows(fresh).filter(row => !sameScope(row, scope)); assert.equal(foreign.length, 2);
      assert.equal(fresh.RepeatPredictive.sources({ taskId: foreign[0].taskId }).length, 0);
      assert.equal(fresh.RepeatPredictive.validateSpec(repeatSpec([waiting[0], foreign[0]])).ok, false);
    }
    const otherOperator = fixture({ local: memory(stored), session: signedIn('TEN-NISSAN-HQ', 'ACC-OPS-CHEN') });
    assert.equal(otherOperator.RepeatPredictive.sources({ waiting: true }).filter(row => row.repeatContactFixture).length, 0);
  });
  check('已有演示存储自动补齐再次联系样例，重复刷新保持四条且保留用户原记录', () => {
    const local = memory(clone(Object.fromEntries(c.testStores.local))), session = memory(clone(Object.fromEntries(c.testStores.session)));
    const savedBatches = JSON.parse(new c.Storage(local).getItem('customer-task-batches-v1')).filter(batch => !batch.rows.some(row => row.repeatContactFixture));
    const originalBatch = savedBatches.find(batch => batch.demoPack === marker && batch.rows.some(row => row.calls.length)), originalRow = originalBatch.rows.find(row => row.calls.length);
    originalRow.note = '升级前用户保留的联系备注';
    const journal = JSON.parse(new c.Storage(local).getItem('local-task-result-journal-v1')); journal.calls = journal.calls.filter(call => !call.repeatContactFixture);
    const submittedCall = journal.calls.find(call => call.customerTaskItemId === originalRow.id); assert(submittedCall);
    submittedCall.agentDisposition = '升级前用户已提交的话务结果'; originalRow.calls.find(call => call.callId === submittedCall.callId).agentDisposition = submittedCall.agentDisposition;
    local.set(prefix + 'customer-task-batches-v1', JSON.stringify(savedBatches)); local.set(prefix + 'local-task-result-journal-v1', JSON.stringify(journal));
    const directory = JSON.parse(new c.Storage(local).getItem('customer-directory-v1') || 'null');
    if (directory) { directory.calls = directory.calls.filter(call => !call.repeatContactFixture); local.set(prefix + 'customer-directory-v1', JSON.stringify(directory)); }
    session.set(prefix + 'cloud-task-created-v1', JSON.stringify(JSON.parse(session.get(prefix + 'cloud-task-created-v1')).filter(task => !task.repeatContactFixture)));
    const retainedBatch = clone(originalBatch), retainedCall = clone(submittedCall);
    for (let reload = 0; reload < 2; reload++) {
      const fresh = fixture({ local, session }); fresh.CustomerDirectory.sync();
      assert.equal(repeatRows(fresh).length, 4); unique(repeatRows(fresh), 'id');
      assert.equal(fresh.CloudCallData.tasks.filter(task => task.repeatContactFixture).length, 2); unique(fresh.CloudCallData.tasks.filter(task => task.repeatContactFixture), 'taskId');
      assert.equal(fresh.CloudCallData.calls.filter(call => call.repeatContactFixture).length, 4); unique(fresh.CloudCallData.calls.filter(call => call.repeatContactFixture), 'callId');
      const restoredBatches = JSON.parse(fresh.localStorage.getItem('customer-task-batches-v1'));
      assert.deepStrictEqual(restoredBatches.find(batch => batch.id === retainedBatch.id), retainedBatch);
      assert.equal(fresh.CloudCallData.calls.find(call => call.callId === retainedCall.callId).agentDisposition, retainedCall.agentDisposition);
      assert.deepStrictEqual(JSON.parse(fresh.localStorage.getItem('local-task-result-journal-v1')).calls.find(call => call.callId === retainedCall.callId), retainedCall);
      assert.equal(fresh.RepeatPredictive.sources({ waiting: true }).filter(row => row.repeatContactFixture && !row.blockReason).length, 2);
    }
  });
  check('再次联系样例已编辑的客户备注及已提交话务结果刷新后保留', () => {
    const local = memory(clone(Object.fromEntries(c.testStores.local))), session = memory(clone(Object.fromEntries(c.testStores.session)));
    const savedBatches = JSON.parse(new c.Storage(local).getItem('customer-task-batches-v1')), row = savedBatches.flatMap(batch => batch.rows).find(row => row.repeatContactFixture);
    assert(row); row.note = '用户补充：周五下午再次联系';
    const journal = JSON.parse(new c.Storage(local).getItem('local-task-result-journal-v1')), submitted = journal.calls.find(call => call.customerTaskItemId === row.id);
    assert(submitted); submitted.agentDisposition = '用户已完成约定沟通'; submitted.dispositionRemark = '已确认后续办理安排';
    Object.assign(row.calls.find(call => call.callId === submitted.callId), { agentDisposition: submitted.agentDisposition, dispositionRemark: submitted.dispositionRemark });
    local.set(prefix + 'customer-task-batches-v1', JSON.stringify(savedBatches)); local.set(prefix + 'local-task-result-journal-v1', JSON.stringify(journal));
    const expectedRow = clone(row), expectedCall = clone(submitted), fresh = fixture({ local, session }); fresh.CustomerDirectory.sync();
    assert.deepStrictEqual(JSON.parse(fresh.localStorage.getItem('customer-task-batches-v1')).flatMap(batch => batch.rows).find(item => item.id === row.id), expectedRow);
    for (const field of ['agentDisposition', 'dispositionRemark']) assert.equal(fresh.CloudCallData.calls.find(call => call.callId === submitted.callId)[field], expectedCall[field]);
    assert.deepStrictEqual(JSON.parse(fresh.localStorage.getItem('local-task-result-journal-v1')).calls.find(call => call.callId === submitted.callId), expectedCall);
    assert.equal(repeatRows(fresh).length, 4);
  });
  check('精简自动样例不重开用户保留的已结束再次联系任务', () => {
    const local = memory(clone(Object.fromEntries(c.testStores.local))), session = memory(clone(Object.fromEntries(c.testStores.session)));
    const source = tasks.find(task => task.repeatContactFixture && task.tenantId === 'TEN-NISSAN-HQ');
    const oldId = 'QA-USER-FINISHED-FOLLOWUP';
    const oldTask = JSON.parse(JSON.stringify(source).replaceAll(source.taskId, oldId));
    Object.assign(oldTask, { name: '历史已结束再次联系任务', status: '已完成', providerStatusCode: 3, providerStatus: '结束（模拟）', autoComplete: 1, endedAt: '2026-09-16 12:00:00', hasNextAttempt: false });
    oldTask.alictiMockTaskProperty.status = 3; oldTask.alictiMockTaskProperty.autoComplete = 1;
    const savedTasks = JSON.parse(session.get(prefix + 'cloud-task-created-v1')); savedTasks.push(oldTask); session.set(prefix + 'cloud-task-created-v1', JSON.stringify(savedTasks));
    const originalBatch = batches.find(batch => batch.rows.some(row => row.taskId === source.taskId));
    const oldBatch = JSON.parse(JSON.stringify(originalBatch).replaceAll(source.taskId, oldId).replaceAll(originalBatch.id, 'QA-USER-FINISHED-BATCH').replaceAll('13971', '13970'));
    delete oldBatch.demoPack; delete oldTask.demoPack;
    oldBatch.rows[0].note = '旧终态任务的用户备注';
    const savedBatches = JSON.parse(new c.Storage(local).getItem('customer-task-batches-v1')); savedBatches.push(oldBatch); local.set(prefix + 'customer-task-batches-v1', JSON.stringify(savedBatches));
    const journal = JSON.parse(new c.Storage(local).getItem('local-task-result-journal-v1')); journal.calls.push(...oldBatch.rows.flatMap(row => row.calls)); local.set(prefix + 'local-task-result-journal-v1', JSON.stringify(journal));
    const fresh = fixture({ local, session });
    const restored = fresh.CloudCallData.tasks.find(task => task.taskId === oldId);
    for (const field of ['status', 'providerStatusCode', 'autoComplete', 'endedAt', 'completed', 'connected']) assert.equal(restored[field], oldTask[field]);
    assert.equal(restored.alictiMockTaskProperty.status, 3);
    assert.deepStrictEqual(JSON.parse(fresh.localStorage.getItem('customer-task-batches-v1')).find(batch => batch.id === oldBatch.id), oldBatch);
    assert.equal(fresh.CloudCallData.tasks.find(task => task.taskId === source.taskId).providerStatusCode, 2);
    assert.equal(fresh.RepeatPredictive.sources({ taskId: oldId, waiting: true }).filter(row => !row.blockReason).length, 0);
  });
  check('本任务再次联系只执行新增未呼叫行，呼完暂停且刷新保留原客户历史', () => {
    const fresh = fixture({ session: signedIn() }), task = fresh.CloudCallData.tasks.find(task => task.repeatContactFixture && task.tenantId === 'TEN-NISSAN-HQ');
    const savedBatches = JSON.parse(fresh.localStorage.getItem('customer-task-batches-v1')), sourceBatch = savedBatches.find(batch => batch.rows.some(row => row.taskId === task.taskId));
    const original = clone(sourceBatch), source = sourceBatch.rows[0];
    const next = { ...clone(source), id: 'QA-SAME-TASK-NEXT', calls: [], history: [], followup: '待联系', activeCallId: '', ownerId: '', repeatContactFixture: false, repeatContact: { sourceTaskId: task.taskId, sourceBatchId: sourceBatch.id, sourceItemId: source.id, sourceCallId: source.calls[0].callId, businessContactNo: 2, rootItemId: source.id } };
    savedBatches.unshift({ id: 'QA-SAME-TASK-NEXT-BATCH', name: '原任务第二次联系', tenantId: task.tenantId, enterpriseId: task.enterpriseId, createdBy: 'ACC-ADMIN-018', rows: [next] });
    fresh.localStorage.setItem('customer-task-batches-v1', JSON.stringify(savedBatches));
    Object.assign(task, { status: '执行中', providerStatusCode: 1, providerStatus: '运行（模拟）', stopNewDialing: false, total: 3 }); task.alictiMockTaskProperty.status = 1;
    fresh.CloudTaskWorkspace.saveDemoTask(task);
    fresh.CloudTaskWorkspace.simulationResourceError = () => ''; fresh.CloudTaskWorkspace.openTask = () => {};
    assert.equal(fresh.ScenarioDemo.runNext(task.taskId, '未接通'), true);
    assert.equal(task.completed, 3); assert.equal(task.status, '已暂停'); assert.equal(task.providerStatusCode, 2); assert.equal(task.alictiMockTaskProperty.status, 2); assert.equal(task.stopNewDialing, true);
    assert.equal(fresh.ScenarioDemo.runNext(task.taskId, '未接通'), false);
    const after = JSON.parse(fresh.localStorage.getItem('customer-task-batches-v1'));
    assert.deepStrictEqual(after.find(batch => batch.id === sourceBatch.id), original);
    const result = after.find(batch => batch.id === 'QA-SAME-TASK-NEXT-BATCH').rows[0].calls;
    assert.equal(result.length, 1);
    const finalCall = fresh.CloudCallData.calls.find(call => call.callId === result[0].callId);
    assert(finalCall); assert.equal(finalCall.taskId, task.taskId); assert.equal(finalCall.customerTaskItemId, next.id); assert.equal(finalCall.attemptNumber, 1); assert.equal(finalCall.repeatContact.businessContactNo, 2);
    const restored = fixture({ local: fresh.testStores.local, session: fresh.testStores.session }), restoredTask = restored.CloudCallData.tasks.find(row => row.taskId === task.taskId);
    assert.equal(restoredTask.status, '已暂停'); assert.equal(restoredTask.providerStatusCode, 2); assert.equal(restoredTask.completed, 3);
    assert.deepStrictEqual(JSON.parse(restored.localStorage.getItem('customer-task-batches-v1')).find(batch => batch.id === sourceBatch.id), original);
  });
  check('仅跟进状态变化不能重新执行旧行，自动完成任务维持结束行为', () => {
    const fresh = fixture({ session: signedIn() }), task = fresh.CloudCallData.tasks.find(task => task.repeatContactFixture && task.tenantId === 'TEN-NISSAN-HQ');
    Object.assign(task, { status: '执行中', providerStatusCode: 1, stopNewDialing: false, total: 3 }); task.alictiMockTaskProperty.status = 1;
    fresh.CloudTaskWorkspace.simulationResourceError = () => ''; fresh.CloudTaskWorkspace.openTask = () => {};
    const before = fresh.localStorage.getItem('customer-task-batches-v1');
    assert.equal(fresh.ScenarioDemo.runNext(task.taskId, '未接通'), false); assert.equal(fresh.localStorage.getItem('customer-task-batches-v1'), before);
    const store = fixture({ session: signedIn('TEN-NISSAN-SH') });
    store.CloudTaskWorkspace.simulationResourceError = () => ''; store.CloudTaskWorkspace.openTask = () => {};
    const automatic = store.CloudCallData.tasks.find(row => row.tenantId === 'TEN-NISSAN-SH' && row.callType === 'IVR 外呼' && row.status === '待启动');
    assert(automatic && automatic.total > 0, '待启动自动外呼应保留至少一位可呼叫客户'); assert.equal(automatic.autoComplete, 1); Object.assign(automatic, { status: '执行中', providerStatusCode: 1, stopNewDialing: false }); automatic.alictiMockTaskProperty.status = 1;
    for (let index = 0; index < automatic.total; index++) assert.equal(store.ScenarioDemo.runNext(automatic.taskId, '未接通'), true);
    assert.equal(automatic.status, '已完成'); assert.equal(automatic.completed, automatic.total); assert.equal(store.ScenarioDemo.runNext(automatic.taskId, '未接通'), false);
  });
  check('选择样例追加到原任务后阻止重复安排并完整保留源任务和通话历史', () => {
    const fresh = fixture({ session: signedIn() }), selected = fresh.RepeatPredictive.sources({ waiting: true }).filter(row => row.repeatContactFixture);
    assert.equal(selected.length, 2); const spec = repeatSpec(selected), originalTasks = clone(fresh.CloudCallData.tasks.filter(task => selected.some(row => row.taskId === task.taskId)));
    const originals = clone(JSON.parse(fresh.localStorage.getItem('customer-task-batches-v1')).filter(batch => selected.some(row => row.batchId === batch.id)));
    const journalBefore = JSON.parse(fresh.localStorage.getItem('local-task-result-journal-v1'));
    const task = fresh.CloudCallData.tasks.find(task => task.taskId === spec.sourceTaskId), taskCount = fresh.CloudCallData.tasks.length;
    const prepared = fresh.RepeatPredictive.prepareAttachment(task, spec); assert(prepared.ok, prepared.message); unique(prepared.newBatch.rows, 'id');
    assert.equal(fresh.CustomerTasks.commitTaskAttachment(prepared), true);
    assert.equal(fresh.CustomerTasks.commitTaskAttachment(prepared), true, '同一已提交名单再次提交不重复新增');
    for (const after of [fresh, fixture({ local: fresh.testStores.local, session: fresh.testStores.session })]) {
      const sources = after.RepeatPredictive.sources({ waiting: true }).filter(row => row.repeatContactFixture);
      assert.equal(sources.length, 2); assert(sources.every(row => row.blockReason === '该客户已有待执行的呼叫安排'));
      assert.equal(after.RepeatPredictive.validateSpec(spec).ok, false);
      const saved = JSON.parse(after.localStorage.getItem('customer-task-batches-v1'));
      for (const original of originals) assert.deepStrictEqual(saved.find(batch => batch.id === original.id), original);
      assert.equal(after.CloudCallData.tasks.length, taskCount);
      for (const original of originalTasks) {
        const current = after.CloudCallData.tasks.find(item => item.taskId === original.taskId);
        for (const field of ['taskId', 'providerTaskId', 'demoProviderTaskId', 'status', 'providerStatusCode', 'startedAt', 'campaignId', 'completed', 'connected']) assert.equal(current[field], original[field], field);
        assert.deepStrictEqual(clone(current.planSnapshot), original.planSnapshot);
      }
      assert.deepStrictEqual(JSON.parse(after.localStorage.getItem('local-task-result-journal-v1')), journalBefore);
      const attached = saved.find(batch => batch.id === prepared.newBatch.id); assert(attached); assert.equal(attached.rows.length, 2);
      for (const row of attached.rows) { assert.equal(row.taskId, task.taskId); assert.equal(row.repeatContact.businessContactNo, 2); assert(selected.some(source => source.id === row.repeatContact.sourceItemId && source.sourceCall.callId === row.repeatContact.sourceCallId)); assert.equal(row.calls.length, 0); }
    }
  });
  check('各模块数据不冒充真实供应商验证', () => { for (const row of [...tagged(d.scenarioTests), ...tagged(d.physicalSkillGroups)]) { assert.equal(row.evidenceType, 'DEMO'); assert.equal(row.realVerification, '未验证'); } assert(tagged(d.lines).every(row => row.pocStatus === '未验证')); });
  check('今日与近 7 日六类报表均非空，统计量来自同一组终态话单', () => {
    for (const period of ['今日', '近 7 日']) for (const view of ['overview', 'customers', 'outbound', 'inbound', 'agents', 'skills']) {
      const model = c.CloudReportData.getModel(view, { period }); assert(!model.error, view + ': ' + model.error); assert(model.rows.length > 0, period + '/' + view + ' has no rows'); assert(model.calls.some(call => call.demoPack === marker), period + '/' + view + ' has no showcase call');
      assert(model.calls.every(call => c.CallState.view(call).ended)); assert.equal(model.summary.total, new Set(model.calls.map(call => call.callId)).size); assert.deepEqual(clone(model.summary.total), c.CloudReportMetrics.stats(model.calls, model.allCalls).total);
      assert(model.calls.every(call => call.tenantId === 'TEN-NISSAN-HQ' && call.enterpriseId === '7522240'));
    }
  });
  check('门店报表不混入总部，运营仅看本人分配、本人再次安排或明确接听关联的客户', () => {
    const store = clone(Object.fromEntries(c.testStores.local));
    const sh = fixture({ local: memory(store), session: signedIn('TEN-NISSAN-SH') });
    const model = sh.CloudReportData.getModel('overview', { period: '近 7 日' });
    assert(!model.error && tagged(model.calls).length);assert(model.calls.every(row => row.tenantId === 'TEN-NISSAN-SH'));
    const op = fixture({ local: memory(store), session: signedIn('TEN-NISSAN-HQ', 'ACC-OPS-108') });
    const visible = op.CustomerTasks.reportSnapshot(), personalCalls = op.CustomerDirectory.list().flatMap(customer => customer.calls);
    assert(visible.length);
    for (const batch of visible) for (const row of batch.rows) {
      assert.equal(batch.tenantId, 'TEN-NISSAN-HQ');assert.equal(batch.enterpriseId, '7522240');
      assert(row.ownerId === 'ACC-OPS-108' || row.repeatContact && batch.createdBy === 'ACC-OPS-108' ||
        personalCalls.some(call => sameScope(call, batch) && call.customerTaskItemId === row.id && call.taskId === row.taskId), row.id + ' lacks a personal assignment or exact call relationship');
    }
  });
  check('报表接听关联不放开其他坐席话单、同号其他线索或错误任务的客户', () => {
    const op = fixture({ session: signedIn('TEN-NISSAN-HQ', 'ACC-OPS-108') }), tenantId = 'TEN-NISSAN-HQ', enterpriseId = '7522240';
    const rows = ['OWNED','OWN-REPEAT','PERSONAL-CALL','OTHER-AGENT','WRONG-TASK','SAME-PHONE'].map((name,index) => ({id:'QA-SCOPE-'+name,name,phone:'1399900000'+index,businessType:'lead',externalDocumentId:'QA-LEAD-'+index,ownerId:name==='OWNED'?'ACC-OPS-108':'',taskId:'QA-SCOPE-TASK',method:'预外呼',followup:'待继续跟进',calls:[],history:[],...(name==='OWN-REPEAT'?{repeatContact:{businessContactNo:2}}:{})}));
    rows[5].phone=rows[2].phone;
    const batch={id:'QA-SCOPE-BATCH',name:'权限回归名单',tenantId,enterpriseId,createdBy:'ACC-OPS-108',businessType:'lead',rows};
    const saved=JSON.parse(op.localStorage.getItem('customer-task-batches-v1'));saved.push(batch);op.localStorage.setItem('customer-task-batches-v1',JSON.stringify(saved));
    const call=(index,accountId,taskId='QA-SCOPE-TASK')=>({callId:'QA-SCOPE-CALL-'+index,tenantId,enterpriseId,accountId,taskId,customerTaskItemId:rows[index].id,customerName:rows[index].name,customerPhone:rows[index].phone,callee:rows[index].phone,caller:'02112345678',direction:'呼出',callType:'预外呼',result:'接通',agentIdentityId:'',contactCenterIdentityId:'',ringingAt:'2026-09-16 10:00:00',endedAt:'2026-09-16 10:01:00',durationSeconds:60,processingStatus:'已完成'});
    op.CloudCallData.calls.push(call(2,'ACC-OPS-108'),call(3,'ACC-OTHER-OPERATOR'),call(4,'ACC-OPS-108','QA-DIFFERENT-TASK'));
    const visible=op.CustomerTasks.reportSnapshot().find(row=>row.id===batch.id);
    assert(visible);assert.deepStrictEqual(clone(visible.rows.map(row=>row.id).sort()),['QA-SCOPE-OWN-REPEAT','QA-SCOPE-OWNED','QA-SCOPE-PERSONAL-CALL'].sort());
    assert(!op.CustomerDirectory.list().flatMap(customer=>customer.calls).some(row=>row.callId==='QA-SCOPE-CALL-3'));
  });
  check('刷新恢复再次联系任务进度，终态精确计数且不改供应商状态', () => {
    const local=memory(clone(Object.fromEntries(c.testStores.local))),session=memory(clone(Object.fromEntries(c.testStores.session)));
    const taskId='QA-RESTORED-REPEAT-TASK',tenantId='TEN-NISSAN-HQ',enterpriseId='7522240';
    const task={taskId,name:'刷新恢复的再次联系任务',tenantId,enterpriseId,callType:'预外呼',customerSourceMode:'assigned',localPrototypeTask:true,simulation:true,repeatContact:{version:1},status:'已暂停',providerStatusCode:2,alictiMockTaskProperty:{status:2},total:3,completed:0,connected:0};
    const rows=[1,2,3].map(index=>({id:'QA-RESTORED-ROW-'+index,name:'恢复客户 '+index,phone:'1399800000'+index,taskId,taskName:task.name,method:'预外呼',businessType:'lead',externalDocumentId:'QA-RESTORED-LEAD-'+index,ownerId:'',followup:'待联系',activeCallId:'',calls:[],history:[],repeatContact:{businessContactNo:2,rootItemId:'ORIGINAL-'+index}}));
    const savedTasks=JSON.parse(session.get(prefix+'cloud-task-created-v1')||'[]');savedTasks.push(task);session.set(prefix+'cloud-task-created-v1',JSON.stringify(savedTasks));
    const savedBatches=JSON.parse(new c.Storage(local).getItem('customer-task-batches-v1')||'[]');savedBatches.push({id:'QA-RESTORED-REPEAT-BATCH',name:task.name,tenantId,enterpriseId,createdBy:'ACC-ADMIN-018',rows});local.set(prefix+'customer-task-batches-v1',JSON.stringify(savedBatches));
    const base={tenantId,enterpriseId,taskId,callType:'预外呼',direction:'呼出',workbenchKind:'predictive',callSource:'NATIVE_WORKBENCH',simulation:true,accountId:'ACC-OPS-108',caller:'02112345678',agentAnswerResult:'已接听',result:'接通',ringingAt:'2026-09-16 10:00:00',answeredAt:'2026-09-16 10:00:03',endedAt:'2026-09-16 10:01:00',durationSeconds:57,processingStatus:'已完成'};
    const ended={...base,callId:'QA-RESTORED-ENDED',customerTaskItemId:rows[0].id,customerName:rows[0].name,callee:rows[0].phone};
    const live={...base,callId:'QA-RESTORED-LIVE',customerTaskItemId:rows[1].id,callee:rows[1].phone,endedAt:'',durationSeconds:null,processingStatus:'通话中'};
    const crossTenant={...base,callId:'QA-RESTORED-CROSS-TENANT',tenantId:'TEN-NISSAN-SH',customerTaskItemId:rows[2].id,callee:rows[2].phone};
    const crossEnterprise={...base,callId:'QA-RESTORED-CROSS-ENTERPRISE',enterpriseId:'9999999',customerTaskItemId:rows[2].id,callee:rows[2].phone};
    const wrongItem={...base,callId:'QA-RESTORED-WRONG-ITEM',customerTaskItemId:'NOT-IN-THIS-TASK',callee:'13998000009'};
    const journal=JSON.parse(new c.Storage(local).getItem('native-workbench-records-v1')||'[]');journal.push(ended,live,crossTenant,crossEnterprise,wrongItem);local.set(prefix+'native-workbench-records-v1',JSON.stringify(journal));
    const fresh=fixture({local,session});
    assert(fresh.CloudCallData.calls.some(call=>call.callId===ended.callId),'Native terminal record must restore from storage');
    fresh.CloudTaskWorkspace.syncAssignedCustomers();
    const restored=fresh.CloudCallData.tasks.find(row=>row.taskId===taskId);assert(restored,'Created task must restore after native records');
    assert.equal(restored.completed,1);assert.equal(restored.connected,1);assert.equal(restored.status,'已暂停');assert.equal(restored.providerStatusCode,2);assert.equal(restored.alictiMockTaskProperty.status,2);
    const index=fresh.CloudCallData.predictiveTasks.findIndex(row=>row.taskId===taskId);assert(index>=0);
    fresh.CloudCallData.predictiveTasks[index]={...fresh.CloudCallData.predictiveTasks[index],completed:0,connected:0};
    fresh.CloudCallData.calls.push(clone(ended),{...clone(ended),callId:'QA-RESTORED-REPEATED-EVENT'});
    fresh.AgentWorkbench.syncReceivingProgress();fresh.CloudTaskWorkspace.syncAssignedCustomers();
    assert.equal(restored.completed,1);assert.equal(restored.connected,1);
    assert.equal(fresh.CloudCallData.predictiveTasks[index].completed,1);assert.equal(fresh.CloudCallData.predictiveTasks[index].connected,1);assert.equal(fresh.CloudCallData.predictiveTasks[index].status,'已暂停');
  });
  check('重复整页加载不增加重复任务、客户、话单或存储记录', () => {
    const reloaded = fixture({ local: c.testStores.local, session: c.testStores.session });
    for (const [name, id] of [['tasks', 'taskId'], ['predictiveTasks', 'taskId'], ['ivrTasks', 'taskId'], ['calls', 'callId']]) { unique(tagged(reloaded.CloudCallData[name]), id); assert.equal(tagged(reloaded.CloudCallData[name]).length, tagged(d[name]).length); }
    const after = tagged(JSON.parse(reloaded.localStorage.getItem('customer-task-batches-v1'))); unique(after, 'id'); assert.equal(after.length, batches.length); unique(after.flatMap(batch => batch.rows), 'id');
    unique(tagged(JSON.parse(reloaded.localStorage.getItem('local-task-result-journal-v1')).calls), 'callId');
  });
  check('重复安装同一数据批次不增加模块与存储重复记录', () => {
    const fresh = fixture({ session: signedIn() }), before = ['tasks', 'calls', 'predictiveTasks', 'ivrTasks'].map(name => tagged(fresh.CloudCallData[name]).length);
    for (const file of ['mock/demo-resources.js', 'mock/demo-activity.js', 'mock/demo-install.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), fresh, { filename: file });
    assert.deepEqual(['tasks', 'calls', 'predictiveTasks', 'ivrTasks'].map(name => tagged(fresh.CloudCallData[name]).length), before);
    unique(tagged(JSON.parse(fresh.localStorage.getItem('customer-task-batches-v1'))), 'id'); unique(tagged(JSON.parse(fresh.localStorage.getItem('local-task-result-journal-v1')).calls), 'callId');
  });
  check('用户自建任务、名单及已编辑演示数据按现有恢复规则保留', () => {
    const local = memory(clone(Object.fromEntries(c.testStores.local))), session = memory(clone(Object.fromEntries(c.testStores.session)));
    const savedTasks = JSON.parse(session.get(prefix + 'cloud-task-created-v1')), task = savedTasks[0]; task.name = '用户修改任务名称'; const customTask = { ...clone(task), taskId: 'USER-OWNED-TASK', name: '用户自建任务', demoPack: undefined }; savedTasks.push(customTask); session.set(prefix + 'cloud-task-created-v1', JSON.stringify(savedTasks));
    const savedBatches = JSON.parse(new c.Storage(local).getItem('customer-task-batches-v1')); const editedBatch = savedBatches.find(row => row.demoPack === marker); editedBatch.name = '用户修改名单名称'; editedBatch.rows[0].note = '用户保留的联系备注'; const customBatch = { ...clone(editedBatch), id: 'USER-OWNED-BATCH', name: '用户自建名单', rows: [], demoPack: undefined }; savedBatches.push(customBatch); local.set(prefix + 'customer-task-batches-v1', JSON.stringify(savedBatches));
    const fresh = fixture({ local, session }); assert.equal(fresh.CloudCallData.tasks.find(row => row.taskId === task.taskId).name, task.name); assert.equal(fresh.CloudCallData.tasks.find(row => row.taskId === customTask.taskId).name, customTask.name);
    const restoredBatches = JSON.parse(fresh.localStorage.getItem('customer-task-batches-v1')); assert.equal(restoredBatches.find(row => row.id === editedBatch.id).rows[0].note, '用户保留的联系备注'); assert.equal(restoredBatches.find(row => row.id === editedBatch.id).name, editedBatch.name); assert(restoredBatches.some(row => row.id === customBatch.id));
  });
  check('已提交的话单备注刷新后仍显示编辑结果，存储和列表同源', () => {
    const local = memory(clone(Object.fromEntries(c.testStores.local))), session = memory(clone(Object.fromEntries(c.testStores.session)));
    const journal = JSON.parse(new c.Storage(local).getItem('local-task-result-journal-v1')), savedCall = journal.calls.find(row => row.demoPack === marker); savedCall.agentDisposition = '用户已补录的沟通结果';
    const rows = JSON.parse(new c.Storage(local).getItem('customer-task-batches-v1')); const customer = rows.flatMap(batch => batch.rows).find(row => row.id === savedCall.customerTaskItemId); customer.calls.find(row => row.callId === savedCall.callId).agentDisposition = savedCall.agentDisposition;
    local.set(prefix + 'local-task-result-journal-v1', JSON.stringify(journal)); local.set(prefix + 'customer-task-batches-v1', JSON.stringify(rows));
    const fresh = fixture({ local, session }); assert.equal(fresh.CloudCallData.calls.find(row => row.callId === savedCall.callId).agentDisposition, savedCall.agentDisposition, '页面恢复的话单不应回滚用户已提交备注');
    fresh.CustomerDirectory.sync(); assert.equal(fresh.CloudCallData.calls.find(row => row.callId === savedCall.callId).agentDisposition, savedCall.agentDisposition, '后续客户目录同步也不得回滚已提交备注');
    assert.equal(JSON.parse(fresh.localStorage.getItem('local-task-result-journal-v1')).calls.find(row => row.callId === savedCall.callId).agentDisposition, savedCall.agentDisposition);
  });
  check('未提交、跨租户或客户标识不符的日志不能覆盖本轮话单', () => {
    for (const variant of ['uncommitted', 'tenant', 'enterprise', 'customer', 'caller', 'callee', 'duplicate']) {
      const local = memory(clone(Object.fromEntries(c.testStores.local))), session = memory(clone(Object.fromEntries(c.testStores.session)));
      const journal = JSON.parse(new c.Storage(local).getItem('local-task-result-journal-v1')), saved = journal.calls.find(row => row.demoPack === marker), original = clone(d.calls.find(row => row.callId === saved.callId));
      saved.agentDisposition = '不应套入原通话的日志内容';
      if (variant === 'uncommitted') saved.result = '未提交结果';
      if (variant === 'tenant') saved.tenantId = 'TEN-OTHER';
      if (variant === 'enterprise') saved.enterpriseId = '9999999';
      if (variant === 'customer') saved.customerTaskItemId = 'OTHER-CUSTOMER';
      if (variant === 'caller') saved.caller = '02100009999';
      if (variant === 'callee') saved.callee = '13900009999';
      if (variant === 'duplicate') journal.calls.push(clone(saved));
      local.set(prefix + 'local-task-result-journal-v1', JSON.stringify(journal));
      const fresh = fixture({ local, session }), restored = fresh.CloudCallData.calls.find(row => row.callId === original.callId);
      for (const field of ['agentDisposition', 'result', 'tenantId', 'enterpriseId', 'customerTaskItemId', 'caller', 'callee']) assert.equal(restored[field], original[field], variant + ' 不应覆盖 ' + field);
    }
  });
  check('用户修改的坐席工号、启停状态与技能分配按现有恢复规则保留', () => {
    const local = memory(clone(Object.fromEntries(c.testStores.local))), session = memory(clone(Object.fromEntries(c.testStores.session)));
    const seat = clone(tagged(d.agents).find(row => row.tenantId === 'TEN-NISSAN-HQ' && !row.accountId)); seat.cno = '0099'; seat.lifecycleStatus = '已停用'; seat.userName = '用户修改姓名';
    const relation = clone(d.agentSkills.find(row => row.identityId === seat.contactCenterIdentityId)); relation.skillLevel = 10;
    local.set(prefix + 'account-seat-v1', JSON.stringify({ version: 1, seats: [seat], attempts: [], skillAssignments: [{ identityId: seat.contactCenterIdentityId, tenantId: seat.tenantId, enterpriseId: seat.enterpriseId, relations: [relation] }] }));
    const fresh = fixture({ local, session }), restored = fresh.CloudCallData.agents.find(row => row.contactCenterIdentityId === seat.contactCenterIdentityId);
    assert.equal(restored.cno, '0099'); assert.equal(restored.lifecycleStatus, '已停用'); assert.equal(restored.userName, seat.userName); const relations = fresh.CloudCallData.agentSkills.filter(row => row.identityId === seat.contactCenterIdentityId); assert.equal(relations.length, 1); assert.equal(relations[0].skillLevel, 10);
  });
  check('异常名单、任务与话单存储保持原值，报告无法合并而非覆盖', () => {
    for (const malformed of ['{broken', '{"unexpected":true}', '[{"id":"SAME"},{"id":"SAME"}]']) {
      const local = memory(), session = signedIn(); const keys = ['customer-task-batches-v1', 'local-task-result-journal-v1']; keys.forEach(key => local.set(prefix + key, malformed)); session.set(prefix + 'cloud-task-created-v1', malformed);
      const fresh = fixture({ local, session }); keys.forEach(key => assert.equal(local.get(prefix + key), malformed, key + ' 异常存储不应被修改')); assert.equal(session.get(prefix + 'cloud-task-created-v1'), malformed, '异常任务存储不应被修改'); assert(fresh.DemoFixtureKit.warnings.length >= 3);
    }
  });
}
console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', scope: 'Local fictional fixtures and storage only; browser interaction verified separately', notLiveIntegration: true, loadedScripts: files.length, count: checks.length, checks, failures, ...(c ? { showcase: clone(c.DemoFixtureKit.compactSummary || c.DemoFixtureKit.activitySummary) } : {}) }, null, 2));
if (failures.length) process.exitCode = 1;
}
