/** Local call-data synchronization: real prototype modules, controlled clock and storage.
 * No browser, network, supplier requests, or writes to project evidence files. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const base = path.resolve(__dirname, '..');
const files = [...fs.readFileSync(path.join(base, 'index.html'), 'utf8').matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
const prefix = 'alicti-demo-v2:';
const sessionKey = 'native-workbench-session-v1';
const recordsKey = 'native-workbench-records-v1';
const scope = { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', accountId: 'ACC-OPS-108' };
const clone = value => JSON.parse(JSON.stringify(value));
const checks = [], failures = [];
async function check(name, fn) {
  try { await fn(); checks.push(name); }
  catch (error) { failures.push({ name, message: error.stack }); }
}

function fixture(options = {}) {
  const local = options.local || new Map(), session = options.session || new Map();
  const timers = new Map(), intervals = new Map(), listeners = new Map(), layers = new Map(), nodes = new Map(), toasts = [];
  let now = options.now || new Date('2026-09-30T14:00:00+08:00').getTime(), timerId = 0, uuid = 0;
  let rejectWrite = () => false;
  session.set(prefix + 'unified-call-context-v3', JSON.stringify({ ...scope, ...options.scope,
    sessionId: 'call-data-sync-test', activeDomain: 'CLOUD_CONTACT_CENTER', authStage: 'READY', currentPage: 'home' }));
  class Storage {
    constructor(map) { this.map = map; }
    getItem(key) { return this.map.get(String(key)) ?? null; }
    setItem(key, value) {
      if (rejectWrite(String(key), String(value), this.map === session ? 'session' : 'local')) throw Error('QuotaExceededError');
      this.map.set(String(key), String(value));
    }
    removeItem(key) { this.map.delete(String(key)); }
    clear() { this.map.clear(); }
    key(index) { return [...this.map.keys()][index] ?? null; }
    get length() { return this.map.size; }
  }
  function element() {
    return { style: { setProperty() {}, removeProperty() {} }, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      append() {}, appendChild() {}, insertBefore() {}, remove() {}, addEventListener() {}, setAttribute() {}, removeAttribute() {}, focus() {},
      querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1440, height: 1000 }), innerHTML: '', textContent: '' };
  }
  function listen(type, fn) { const list = listeners.get(type) || []; list.push(fn); listeners.set(type, list); }
  function dispatch(event) { for (const listener of listeners.get(event.type) || []) listener(event); return true; }
  const document = { addEventListener() {}, dispatchEvent() {}, getElementById: id => nodes.get(id) || null, querySelector: () => null,
    querySelectorAll: () => [], createElement: element, createTreeWalker: () => ({ nextNode: () => null }),
    documentElement: element(), body: element(), head: element(), activeElement: null };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const c = { URL, URLSearchParams, structuredClone, console, Date: Clock, Storage, localStorage: new Storage(local), sessionStorage: new Storage(session), document,
    navigator: { locks: { request: (_key, _options, fn) => Promise.resolve((typeof _options === 'function' ? _options : fn)({ name: 'test-seat-lock' })) } },
    NodeFilter: { SHOW_TEXT: 4 }, location: { hash: '#seat-workbench', search: '', pathname: '/index.html', href: 'http://localhost/index.html' },
    history: { replaceState() {}, pushState() {} }, crypto: { randomUUID: () => String(++uuid).padStart(8, '0') + '-0000-4000-8000-000000000000' },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }, addEventListener: listen, dispatchEvent: dispatch,
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms, at: now + Number(ms || 0) }); return id; }, clearTimeout: id => timers.delete(id),
    setInterval(fn, ms) { const id = ++timerId; intervals.set(id, { fn, ms }); return id; }, clearInterval: id => intervals.delete(id), requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: false, addEventListener() {} }), MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} },
    fetch() { throw Error('Unexpected network request'); }, performance: { now: () => now }, innerWidth: 1440, innerHeight: 1000 };
  c.window = c; c.globalThis = c; vm.createContext(c);
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), c, { filename: file });
  c.PlatformUI.openLayer = (id, html) => { layers.set(id, html); nodes.set(id, element()); };
  c.PlatformUI.closeLayer = id => { layers.delete(id); nodes.delete(id); };
  c.RouteRuntime.secondaryDepth = () => 0;
  c.navigateTo = () => {};
  c.showToast = (message, type) => toasts.push({ message, type });
  c.test = { local, session, timers, intervals, layers, nodes, toasts, listeners,
    now: () => now, saved: () => JSON.parse(c.sessionStorage.getItem(sessionKey) || 'null'),
    rows: () => JSON.parse(c.localStorage.getItem(recordsKey) || '[]'),
    html: () => layers.get('assigned-call-dialog') || '',
    failWrites(predicate) { rejectWrite = predicate; },
    advance(ms) { now += ms; },
    runTimer(ms) {
      const entry = [...timers].find(([, value]) => value.ms === ms);
      assert(entry, 'Expected timer ' + ms); timers.delete(entry[0]); now = Math.max(now, entry[1].at); entry[1].fn();
    },
    async elapse(ms) {
      const until = now + ms; let limit = 1000;
      for (;;) {
        const entry = [...timers].filter(([, value]) => value.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
        if (!entry) break;
        assert(--limit > 0, 'Timer loop'); timers.delete(entry[0]); now = Math.max(now, entry[1].at); await entry[1].fn(); await Promise.resolve();
      }
      now = until;
    },
    async interval(ms) {
      const matches = [...intervals.values()].filter(value => ms === undefined || value.ms === ms);
      assert(matches.length, 'Expected background interval');
      for (const entry of matches) { await entry.fn(); await Promise.resolve(); }
    }
  };
  return c;
}

async function startSeat(c) {
  c.AgentWorkbench.renderSeat();
  c.AgentWorkbench.signIn({ loginStatus: 1, pauseDescription: '', workingMode: '0' });
  for (let i = 0; i < 15 && !c.AgentWorkbench.receivingContext().online; i++) {
    await Promise.resolve(); await Promise.resolve();
    if ([...c.test.timers.values()].some(value => value.ms === 220)) c.test.runTimer(220);
  }
  assert.equal(c.AgentWorkbench.receivingContext().online, true);
}
function beginManual(c, suffix = '1') {
  c.AgentWorkbench.openTemporary();
  c.AgentWorkbench.updateField('customerName', '资料同步验证客户' + suffix);
  c.AgentWorkbench.updateField('phone', '1399100000' + suffix);
  assert.equal(c.AgentWorkbench.dial(), true);
  c.test.runTimer(700); c.test.runTimer(2400);
  assert.equal(c.AgentWorkbench.receivingContext().phase, 'connected');
  return c.AgentWorkbench.current().call.callId;
}
function enterNotes(c, note = '客户已约定下周到店，资料同步不得覆盖此备注。') {
  if (!c.AgentWorkbench.current().call.businessType) c.AgentWorkbench.setFollowup('businessType', 'lead');
  c.AgentWorkbench.setDisposition('需要再次联系'); c.AgentWorkbench.setRemark(note);
  c.AgentWorkbench.setFollowup('intentionLevel', '高意向');
  return note;
}
function byId(c, id) { const row = c.CloudCallData.calls.find(call => call.callId === id); assert(row, 'Missing call ' + id); return row; }
function businessSnapshot(row) {
  return clone(Object.fromEntries(['callId', 'contactId', 'tenantId', 'enterpriseId', 'accountId', 'customerTaskItemId', 'customerBatchId', 'taskId',
    'externalDocumentId', 'processingStatus', 'agentDisposition', 'dispositionRemark', 'dispositionAt', 'customerFollowup'].map(key => [key, row[key] ?? null])));
}

const syncKey = row => 'call-data-sync-v1:' + encodeURIComponent(JSON.stringify([row.tenantId, String(row.enterpriseId), row.callId,
  row.contactId || '', row.customerTaskItemId || '', row.taskId || '', row.caller || '', row.callee || '']));
const syncWrites = key => key.includes('call-data-sync-v1:');
function state(c, id) { return c.CloudCallSync.read(byId(c, id)); }
function journal(c, id) { return JSON.parse(c.localStorage.getItem(syncKey(byId(c, id))) || 'null'); }
async function endedCall(options = {}) {
  const c = fixture(options); assert(c.CloudCallSync, 'Sync service must be loaded by index.html');
  await startSeat(c); const id = beginManual(c); const note = enterNotes(c);
  c.test.advance(8000); c.AgentWorkbench.end();
  assert.equal(c.AgentWorkbench.current().phase, 'wrap');
  return { c, id, note };
}
async function unknownCall() {
  const c = fixture(); await startSeat(c); c.AgentWorkbench.setDemoResult('结果待确认');
  c.AgentWorkbench.openTemporary(); c.AgentWorkbench.updateField('customerName', '未知结果验证客户');
  c.AgentWorkbench.updateField('phone', '13991000008'); assert.equal(c.AgentWorkbench.dial(), true);
  const id = c.AgentWorkbench.current().call.callId;
  c.test.runTimer(700); c.test.runTimer(2400);
  assert.equal(c.AgentWorkbench.current().phase, 'wrap');
  const note = enterNotes(c, '接听结果未定，先保存已有客户沟通补充。');
  return { c, id, note };
}

(async () => {
  await check('挂断后通话已结束、资料仍同步中，先保存跟进不会误报资料已齐', async () => {
    const { c, id, note } = await endedCall();
    assert.equal(c.CallState.view(byId(c, id)).ended, true);
    assert.equal(state(c, id).status, 'pending');
    assert.match(c.test.html(), /资料同步中|资料.*同步中/s);
    assert(journal(c, id), 'Pending state must be persisted before it is displayed');
    c.AgentWorkbench.saveDisposition();
    assert.equal(c.AgentWorkbench.current().phase, 'idle');
    assert.equal(byId(c, id).processingStatus, '已完成');
    assert.equal(byId(c, id).dispositionRemark, note);
    assert.equal(state(c, id).status, 'pending');
    assert.equal(c.test.rows().filter(row => row.callId === id).length, 1);
    assert(c.test.toasts.some(toast => toast.type === 'success' && /已保存/.test(toast.message)));
  });

  await check('延迟话单原位更新，完整保留已保存跟进、客户来源和记录数量', async () => {
    const { c, id } = await endedCall(); c.AgentWorkbench.saveDisposition();
    const row = byId(c, id), before = businessSnapshot(row), count = c.CloudCallData.calls.length;
    const request = JSON.stringify(c.AliCtiAdapter.lastRequest);
    await c.test.elapse(6000);
    assert.equal(state(c, id).status, 'synced'); assert(state(c, id).updatedAt);
    assert.deepEqual(businessSnapshot(byId(c, id)), before);
    c.CustomerDirectory.sync();
    assert.deepEqual(businessSnapshot(byId(c, id)), before);
    assert.equal(c.CloudCallData.calls.length, count);
    assert.equal(c.CloudCallData.calls.filter(call => call.callId === id).length, 1);
    assert.equal(JSON.stringify(c.AliCtiAdapter.lastRequest), request, 'Data refresh must not dial or hang up');
    assert.equal(c.test.rows().find(call => call.callId === id).dispositionRemark, before.dispositionRemark);
  });

  await check('自动更新保留未提交表单草稿，提交仍保存用户最新内容', async () => {
    const { c, id } = await endedCall();
    const note = '挂断后继续补记的新备注，自动同步不得覆盖。';
    c.AgentWorkbench.setRemark(note); c.AgentWorkbench.setFollowup('intentionLevel', '中意向');
    const before = c.test.saved();
    await c.test.elapse(6000);
    assert.equal(state(c, id).status, 'synced'); assert.equal(c.AgentWorkbench.current().phase, 'wrap');
    const after = c.test.saved();
    assert.equal(after.remark, note); assert.equal(after.disposition, before.disposition);
    assert.deepEqual(clone(after.followup), clone(before.followup));
    c.AgentWorkbench.saveDisposition();
    assert.equal(byId(c, id).dispositionRemark, note);
    assert.equal(byId(c, id).customerFollowup.intentionLevel, '中意向');
  });

  await check('录音后到独立于话单和跟进，媒体演示不会伪造新呼叫', async () => {
    const { c, id } = await endedCall(); c.AgentWorkbench.saveDisposition(); await c.test.elapse(6000);
    const before = businessSnapshot(byId(c, id)), request = JSON.stringify(c.AliCtiAdapter.lastRequest), count = c.CloudCallData.calls.length;
    assert.equal(c.CloudCallSync.demo(id, 'media'), true);
    assert.equal(state(c, id).status, 'synced'); assert.equal(state(c, id).mediaPending, true);
    const pendingMedia = c.CloudCallMedia.resolve(byId(c, id));
    assert.equal(pendingMedia.status, '录音生成中'); assert.equal(pendingMedia.url, '');
    assert.equal(byId(c, id).processingStatus, '已完成');
    await c.test.elapse(8000);
    assert.equal(state(c, id).status, 'synced'); assert.equal(state(c, id).mediaPending, false);
    assert.equal(state(c, id).mediaDemo, true);
    const readyMedia = c.CloudCallMedia.resolve(byId(c, id));
    assert.equal(readyMedia.status, '演示音频'); assert.equal(readyMedia.demo, true);
    assert.match(readyMedia.note, /合成|样例/); assert(fs.existsSync(path.join(base, readyMedia.url)));
    assert.deepEqual(businessSnapshot(byId(c, id)), before);
    assert.equal(c.CloudCallData.calls.length, count); assert.equal(JSON.stringify(c.AliCtiAdapter.lastRequest), request);
  });

  await check('同步异常后刷新恢复；重复刷新保持同一任务且不会重新拨号', async () => {
    const { c, id } = await endedCall(); c.AgentWorkbench.saveDisposition(); await c.test.elapse(6000);
    const before = businessSnapshot(byId(c, id)), count = c.CloudCallData.calls.length, request = JSON.stringify(c.AliCtiAdapter.lastRequest);
    assert.equal(c.CloudCallSync.demo(id, 'error'), true); await c.test.elapse(1500);
    assert.equal(state(c, id).status, 'error');
    assert.deepEqual(businessSnapshot(byId(c, id)), before);
    assert.equal(await c.CloudCallRecords.refreshSync(id), true);
    const revision = journal(c, id).sync.revision, readyAt = journal(c, id).sync.readyAt;
    for (let i = 0; i < 5; i++) assert.equal(await c.CloudCallRecords.refreshSync(id), true);
    assert.equal(journal(c, id).sync.revision, revision); assert.equal(journal(c, id).sync.readyAt, readyAt);
    await c.test.elapse(1500); assert.equal(state(c, id).status, 'synced');
    assert.deepEqual(businessSnapshot(byId(c, id)), before);
    assert.equal(c.CloudCallData.calls.length, count); assert.equal(JSON.stringify(c.AliCtiAdapter.lastRequest), request);
  });

  await check('跨租户、跨供应商账号不能发起或刷新同步，统计仅含授权记录', async () => {
    const { c, id } = await endedCall();
    const own = byId(c, id), foreignRows = [
      { ...clone(own), callId: 'FOREIGN-TENANT', tenantId: 'TEN-OTHER' },
      { ...clone(own), callId: 'FOREIGN-ENTERPRISE', enterpriseId: '7000001' }
    ];
    c.CloudCallData.calls.push(...foreignRows);
    for (const row of foreignRows) {
      const before = clone(row), saved = c.localStorage.getItem(syncKey(row));
      assert.equal(c.CloudCallSync.demo(row.callId, 'delayed'), false);
      assert.equal(c.CloudCallSync.refresh(row.callId), false);
      assert.equal(c.CloudCallSync.begin(row, row), false);
      assert.equal(c.localStorage.getItem(syncKey(row)), saved);
      assert.deepEqual(clone(row), before);
    }
    const summary = c.CloudCallSync.summary([own, ...foreignRows]);
    assert.equal(summary.total, 1); assert.equal(summary.pending, 1);
  });

  await check('页面重载恢复待同步任务及已保存跟进，过期的计时任务只更新原记录', async () => {
    const { c, id } = await endedCall(); c.AgentWorkbench.saveDisposition();
    const before = businessSnapshot(byId(c, id)), readyAt = journal(c, id).sync.readyAt;
    const next = fixture({ local: c.test.local, session: c.test.session, now: c.test.now() + 7000 });
    assert(readyAt < next.test.now());
    assert.equal(state(next, id).status, 'pending');
    await next.test.elapse(0);
    assert.equal(state(next, id).status, 'synced');
    assert.deepEqual(businessSnapshot(byId(next, id)), before);
    assert.equal(next.CloudCallData.calls.filter(row => row.callId === id).length, 1);
    next.AgentWorkbench.renderSeat(); assert.equal(next.AgentWorkbench.current().phase, 'idle');
  });

  await check('同步开始写入失败时不显示成功或改动业务记录，恢复存储后可重试', async () => {
    const { c, id } = await endedCall(); c.AgentWorkbench.saveDisposition(); await c.test.elapse(6000);
    const before = businessSnapshot(byId(c, id)), stored = c.localStorage.getItem(syncKey(byId(c, id)));
    c.test.failWrites(syncWrites);
    assert.equal(c.CloudCallSync.demo(id, 'delayed'), false);
    assert.equal(state(c, id).status, 'error');
    assert.equal(c.localStorage.getItem(syncKey(byId(c, id))), stored);
    assert.deepEqual(businessSnapshot(byId(c, id)), before);
    assert(c.test.toasts.at(-1)?.type !== 'success');
    c.test.failWrites(() => false);
    assert.equal(c.CloudCallSync.refresh(id), true); await c.test.elapse(1500);
    assert.equal(state(c, id).status, 'synced');
  });

  await check('最终结果写入失败不发布已同步且不会形成无等待的自动重试循环', async () => {
    const { c, id } = await endedCall(); c.AgentWorkbench.saveDisposition();
    const before = businessSnapshot(byId(c, id)), stored = c.localStorage.getItem(syncKey(byId(c, id)));
    c.test.failWrites(syncWrites);
    // Real pages read status again when notified. Cover the failure notification path.
    c.addEventListener('call-data-sync', event => { if (event.detail.callId === id) state(c, id); });
    await c.test.elapse(6000);
    assert.equal(state(c, id).status, 'error');
    assert.equal(c.localStorage.getItem(syncKey(byId(c, id))), stored);
    assert.deepEqual(businessSnapshot(byId(c, id)), before);
    assert(![...c.test.timers.values()].some(timer => timer.at <= c.test.now()), 'Failed persistence must not schedule an immediate retry loop');
    c.test.failWrites(() => false); assert.equal(c.CloudCallSync.refresh(id), true); await c.test.elapse(1500);
    assert.equal(state(c, id).status, 'synced');
  });

  await check('损坏同步日志保留原文和跟进，刷新不覆盖未知存储内容', async () => {
    const { c, id } = await endedCall(); c.AgentWorkbench.saveDisposition();
    const before = businessSnapshot(byId(c, id)), key = syncKey(byId(c, id));
    c.localStorage.setItem(key, '{corrupt-sync-log');
    assert.equal(state(c, id).status, 'error');
    assert.equal(c.CloudCallSync.refresh(id), false);
    assert.equal(c.CloudCallSync.demo(id, 'delayed'), false);
    assert.equal(c.localStorage.getItem(key), '{corrupt-sync-log');
    assert.deepEqual(businessSnapshot(byId(c, id)), before);
  });

  await check('结果未知也可先保存跟进，资料同步不会推断客户未接听', async () => {
    const { c, id, note } = await unknownCall();
    assert.equal(c.CallState.view(byId(c, id)).answered, null);
    assert.equal(state(c, id).status, 'pending');
    c.AgentWorkbench.saveDisposition(); assert.equal(c.AgentWorkbench.current().phase, 'idle');
    await c.test.elapse(6000);
    assert.equal(byId(c, id).processingStatus, '已完成'); assert.equal(byId(c, id).dispositionRemark, note);
    assert.equal(c.CallState.view(byId(c, id)).answered, null);
    assert.notEqual(byId(c, id).result, '未接通');
  });

  await check('显式补齐未知结果后，旧异步日志和刷新不能回滚已确认结果', async () => {
    for (const outcome of ['接通', '未接通']) {
      const { c, id } = await unknownCall(); c.AgentWorkbench.saveDisposition();
      const before = businessSnapshot(byId(c, id)), count = c.CloudCallData.calls.length;
      assert.equal(c.AgentWorkbench.confirmDemoResult(id, outcome), true);
      assert.equal(c.CallState.view(byId(c, id)).answered, outcome === '接通');
      assert(byId(c, id).syncCalibrationId);
      await c.test.elapse(7000); c.CustomerDirectory.sync();
      assert.equal(c.CallState.view(byId(c, id)).answered, outcome === '接通');
      assert.deepEqual(businessSnapshot(byId(c, id)), before);
      const next = fixture({ local: c.test.local, session: c.test.session, now: c.test.now() });
      assert.equal(next.CallState.view(byId(next, id)).answered, outcome === '接通');
      assert.equal(await next.CloudCallRecords.refreshSync(id), true); await next.test.elapse(6000);
      assert.equal(next.CallState.view(byId(next, id)).answered, outcome === '接通');
      assert.deepEqual(businessSnapshot(byId(next, id)), before);
      assert.equal(next.CloudCallData.calls.length, count);
    }
  });

  await check('任务结果仅统计已同步话单，未知和异常不算未接通，任务名单完成进度不变', async () => {
    const c = fixture(), startTime = Math.floor(c.test.now() / 1000) - 60;
    const task = { ...scope, taskId: 'SYNC-QA-TASK', providerTaskId: 990001, callType: '预外呼', name: '资料同步统计验证任务',
      status: '执行中', completed: 7, total: 10, owner: '验证坐席', scheduleAt: '手工启动', displayOnly: true };
    c.CloudCallData.tasks.push(task);
    const calls = [43, 40, 999, 43, 40].map((status, index) => ({ ...scope, taskId: task.taskId, callId: 'SYNC-QA-CALL-' + index,
      contactId: 'SYNC-QA-CONTACT-' + index, callType: '预外呼', direction: '呼出', simulation: true, caller: '02100006101', callee: '1399100010' + index,
      ringingAt: new Date(startTime * 1000).toLocaleString('sv-SE'), endedAt: new Date((startTime + 30) * 1000).toLocaleString('sv-SE'),
      alictiCdr: { kind: 'predictive', mock: true, raw: { enterpriseId: 7522240, taskId: 990001, mainUniqueId: 'SYNC-PROVIDER-' + index,
        status, startTime, endTime: startTime + 30, ...(status === 43 ? { upTime: startTime + 3, bridgeTime: startTime + 5, bridgeDuration: 25 } : {}) } } }));
    c.CloudCallData.calls.push(...calls);
    assert.equal(c.CloudCallSync.demo(calls[3].callId, 'delayed'), true);
    assert.equal(c.CloudCallSync.demo(calls[4].callId, 'error'), true); await c.test.elapse(1500);
    const kpis = html => Object.fromEntries([...html.matchAll(/<span class="kpi-label">([^<]+)<\/span><strong class="kpi-value">([^<]+)<\/strong>/g)]
      .map(match => [match[1], Number(match[2])]));
    let html = c.CloudTaskWorkspace.renderCenter({ taskId: task.taskId, tab: 'results' });
    assert.deepEqual(kpis(html), { '已同步话单': 3, '客户已接通': 1, '客户未接通': 1, '接通结果未知': 1 });
    assert.match(html, /同步中 1/); assert.match(html, /待核对或同步异常 1/);
    let overview = c.CloudTaskWorkspace.renderCenter({ taskId: task.taskId, tab: 'overview' });
    assert.match(overview, /<strong>70%<\/strong><small>7 \/ 10<\/small>/);
    await c.test.elapse(4500);
    html = c.CloudTaskWorkspace.renderCenter({ taskId: task.taskId, tab: 'results' });
    assert.deepEqual(kpis(html), { '已同步话单': 4, '客户已接通': 2, '客户未接通': 1, '接通结果未知': 1 });
    overview = c.CloudTaskWorkspace.renderCenter({ taskId: task.taskId, tab: 'overview' });
    assert.match(overview, /<strong>70%<\/strong><small>7 \/ 10<\/small>/);
    assert.equal(task.completed, 7); assert.equal(task.total, 10);
  });

  await check('话单同步异常与录音就绪独立推进，异常恢复保留已到达音频', async () => {
    const { c, id } = await endedCall(); c.AgentWorkbench.saveDisposition(); await c.test.elapse(6000);
    const before = businessSnapshot(byId(c, id));
    assert.equal(c.CloudCallSync.demo(id, 'media'), true);
    const mediaReadyAt = journal(c, id).sync.mediaReadyAt;
    assert.equal(c.CloudCallSync.demo(id, 'error'), true);
    assert.equal(journal(c, id).sync.mediaReadyAt, mediaReadyAt);
    await c.test.elapse(1500);
    assert.equal(state(c, id).status, 'error'); assert.equal(state(c, id).mediaPending, true);
    await c.test.elapse(6500);
    assert.equal(state(c, id).status, 'error'); assert.equal(state(c, id).mediaPending, false);
    const ready = c.CloudCallMedia.resolve(byId(c, id));
    assert.equal(ready.status, '演示音频'); assert(ready.url);
    assert.equal(await c.CloudCallRecords.refreshSync(id), true); await c.test.elapse(1500);
    assert.equal(state(c, id).status, 'synced'); assert.equal(state(c, id).mediaPending, false);
    assert.equal(c.CloudCallMedia.resolve(byId(c, id)).url, ready.url);
    assert.deepEqual(businessSnapshot(byId(c, id)), before);
    assert.doesNotMatch(state(c, id).note, /稍后就绪/);
  });

  console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', count: checks.length, failed: failures.length, checks, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})();
