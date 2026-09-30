/* In-call note and follow-up integration checks. Real prototype scripts; no network. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const base = path.resolve(__dirname, '..'), checks = [], failures = [];
const files = [...fs.readFileSync(path.join(base, 'index.html'), 'utf8').matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
const prefix = 'alicti-demo-v2:', sessionKey = 'native-workbench-session-v1', recordsKey = 'native-workbench-records-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const scope = { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', accountId: 'ACC-OPS-108' };
const followup = { leadLevel: 'A级', intentionLevel: '高意向', visitIntention: '有意向', testDriveIntention: '有意向', plannedVisitAt: '2026-10-10T14:30', plannedStoreName: '客户指定的试驾门店' };
const remark = '客户偏好白色车型，约定下周再次确认到店时间。';
async function check(name, fn) { try { await fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.stack }); } }
function fixture(options = {}) {
  const local = options.local || new Map(), session = options.session || new Map(), timers = new Map(), layers = new Map(), layerOptions = new Map();
  let now = new Date('2026-09-17T15:00:00+08:00').getTime(), timerId = 0, uuid = 0, sessionWriteFails = false;
  let secondaryDepth = 0, backgroundLayers = [];
  const signed = { ...scope, ...options.scope, sessionId: 'incall-test', activeDomain: 'CLOUD_CONTACT_CENTER', authStage: 'READY', currentPage: 'home' };
  session.set(prefix + 'unified-call-context-v3', JSON.stringify(signed));
  class Storage {
    constructor(map) { this.map = map; }
    getItem(key) { return this.map.get(String(key)) ?? null; }
    setItem(key, value) { if (this.map === session && String(key).endsWith(sessionKey) && sessionWriteFails) throw Error('Session quota exceeded'); this.map.set(String(key), String(value)); }
    removeItem(key) { this.map.delete(String(key)); }
    clear() { this.map.clear(); }
    key(index) { return [...this.map.keys()][index] ?? null; }
    get length() { return this.map.size; }
  }
  const element = () => ({ style: { setProperty() {}, removeProperty() {} }, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, append() {}, appendChild() {}, insertBefore() {}, remove() {}, addEventListener() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1440, height: 1000 }) });
  const document = { addEventListener() {}, dispatchEvent() {}, getElementById: () => null,
    querySelector: selector => selector === '.platform-layer:not(#assigned-call-dialog):not([data-non-modal="true"])' ? backgroundLayers.find(node => node.id !== 'assigned-call-dialog' && node.dataset.nonModal !== 'true') || null : null,
    querySelectorAll: selector => selector === '.platform-layer' ? backgroundLayers : [], createElement: element, createTreeWalker: () => ({ nextNode: () => null }), documentElement: element(), body: element(), head: element(), activeElement: null };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const ctx = { URL, URLSearchParams, structuredClone, console, Date: Clock, Storage, localStorage: new Storage(local), sessionStorage: new Storage(session), document,
    navigator: { locks: { request: (_key, _options, fn) => Promise.resolve(fn({ name: 'test-seat-lock' })) } },
    NodeFilter: { SHOW_TEXT: 4 }, location: { hash: '#seat-workbench', search: '', pathname: '/index.html', href: 'http://localhost/index.html' }, history: { replaceState() {}, pushState() {} },
    crypto: { randomUUID: () => String(++uuid).padStart(8, '0') + '-0000-4000-8000-000000000000' },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }, addEventListener() {}, dispatchEvent() {},
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id), setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: false, addEventListener() {} }), MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} },
    fetch() { throw Error('Unexpected network request'); }, performance: { now: () => now }, innerWidth: 1440, innerHeight: 1000 };
  ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), ctx, { filename: file });
  ctx.PlatformUI.openLayer = (id, html, size, navigation = {}) => { layers.set(id, html); layerOptions.set(id, { size, ...navigation }); };
  ctx.PlatformUI.closeLayer = id => { layers.delete(id); layerOptions.delete(id); };
  ctx.RouteRuntime.secondaryDepth = () => secondaryDepth;
  ctx.navigateTo = () => {};
  ctx.showToast = () => {};
  ctx.test = { local, session, layers, layerOptions, timers,
    saved: () => JSON.parse(ctx.sessionStorage.getItem(sessionKey) || 'null'),
    html: () => layers.get('assigned-call-dialog') || '',
    setSecondaryDepth(value) { secondaryDepth = value; },
    setBackgroundLayers(value) { backgroundLayers = value; },
    failSessionWrites(value) { sessionWriteFails = value; },
    advance(ms) { now += ms; },
    runTimer(ms) { const entry = [...timers].find(([, value]) => value.ms === ms); assert(entry, 'Expected timer ' + ms); timers.delete(entry[0]); now += ms; entry[1].fn(); }
  };
  return ctx;
}
async function startSeat(c) {
  c.AgentWorkbench.renderSeat();
  c.AgentWorkbench.signIn({ loginStatus: 1, pauseDescription: '', workingMode: '0' });
  for (let i = 0; i < 15 && !c.AgentWorkbench.receivingContext().online; i++) {
    await Promise.resolve(); await Promise.resolve();
    if ([...c.test.timers.values()].some(value => value.ms === 220)) c.test.runTimer(220);
  }
  assert.equal(c.AgentWorkbench.receivingContext().online, true, 'Seat should be online');
}
function beginManual(c, suffix = '1') {
  c.AgentWorkbench.openTemporary();
  c.AgentWorkbench.updateField('customerName', '通话记录验证客户' + suffix);
  c.AgentWorkbench.updateField('phone', '1399100000' + suffix);
  c.AgentWorkbench.updateField('note', '联系事项：先确认客户看车时间');
  assert.equal(c.AgentWorkbench.dial(), true);
  c.test.runTimer(700); c.test.runTimer(2400);
  assert.equal(c.AgentWorkbench.receivingContext().phase, 'connected');
}
function beginReceiving(c, kind, beforeAnswer) {
  const agent = c.AgentWorkbench.myAgent(), kit = c.DemoFixtureKit.scopes.find(row => row.code === 'HQ');
  const offer = { kind, ...scope, cno: agent.cno, contactId: 'INCALL-' + kind, callId: 'INCALL-' + kind, customerNumber: '13991000002', hotline: '02100006101', customerName: '通话记录来电客户', skillGroupId: kit.skillGroupId, mock: true, stateAction: kind === 'inbound' ? 'ringingIb' : 'ringingAgentOb' };
  if (kind === 'predictive') {
    const task = c.CloudCallData.tasks.find(row => row.tenantId === scope.tenantId && row.callType === '预外呼' && row.status === '执行中' && row.demoPack);
    assert(task, 'Running predictive fixture');
    const batches = JSON.parse(c.localStorage.getItem('customer-task-batches-v1'));
    const batch = batches.find(row => row.rows.some(item => item.taskId === task.taskId && !item.activeCallId && item.followup !== '已完成'));
    const item = batch?.rows.find(row => row.taskId === task.taskId && !row.activeCallId && row.followup !== '已完成');
    assert(item, 'Available predictive customer');
    // Dispatch source rows belong to the queue before an agent receives them.
    item.ownerId = '';
    c.localStorage.setItem('customer-task-batches-v1', JSON.stringify(batches));
    Object.assign(offer, { taskId: task.taskId, customerTaskItemId: item.id, customerBatchId: batch.id, customerNumber: item.phone });
  }
  assert.equal(c.AgentWorkbench.receiveOffer(offer), true, kind + ' offer');
  beforeAnswer?.();
  assert.equal(c.AgentWorkbench.answerIncoming(), true);
  c.test.runTimer(1100);
  assert.equal(c.AgentWorkbench.receivingContext().phase, 'connected');
}
function enterNotes(c, value = remark) {
  if (!c.AgentWorkbench.current().call?.businessType) c.AgentWorkbench.setFollowup('businessType', 'lead');
  c.AgentWorkbench.setDisposition('需要再次联系');
  c.AgentWorkbench.setRemark(value);
  for (const [field, value] of Object.entries(followup)) c.AgentWorkbench.setFollowup(field, value);
}
function assertNotes(c, value = remark) {
  const saved = c.test.saved();
  assert.equal(saved.disposition, '需要再次联系'); assert.equal(saved.remark, value);
  for (const [field, value] of Object.entries(followup)) assert.equal(saved.followup[field], value, field);
}
function assertForm(c) {
  if (!c.AgentWorkbench.current().call?.businessType) { c.AgentWorkbench.setFollowup('businessType', 'lead'); c.AgentWorkbench.openDialog(); }
  const html = c.test.html();
  for (const id of ['seat-disposition', 'seat-remark', ...Object.keys(followup).map(field => 'seat-followup-' + field)]) assert(html.includes('id="' + id + '"'), 'Missing in-call field ' + id);
  const save = html.match(/<button[^>]*id="seat-save"[^>]*>/)?.[0];
  assert(!save || /\bdisabled\b/.test(save), 'In-call editing must not offer active completion');
  const note = c.AgentWorkbench.receivingContext().call?.customerNote;
  if (note) { assert(html.includes('联系事项')); assert(html.includes(c.PlatformUI.escape(note)), 'The pre-call contact note remains visible'); }
}
function assertCompleted(c, id) {
  const call = c.CloudCallData.calls.find(row => row.callId === id);
  assert(call && call.endedAt); assert.equal(call.processingStatus, '已完成'); assert.equal(call.agentDisposition, '需要再次联系'); assert.equal(call.dispositionRemark, remark);
  for (const [field, value] of Object.entries(followup)) assert.equal(call.customerFollowup[field], value, 'Call ' + field);
  const journal = JSON.parse(c.localStorage.getItem(recordsKey)).find(row => row.callId === id);
  assert.equal(journal.processingStatus, '已完成'); assert.equal(journal.dispositionRemark, remark);
  assert.deepEqual(clone(journal.customerFollowup), clone(call.customerFollowup));
  c.CustomerDirectory.sync();
  const customer = c.CustomerDirectory.list().find(row => row.calls.some(call => call.callId === id));
  assert(customer, 'Customer directory record');
  const snapshot = customer.calls.find(row => row.callId === id);
  assert.equal(snapshot.dispositionRemark, remark);
  for (const [field, value] of Object.entries(followup)) assert.equal(c.CustomerFollowup.aggregate(customer.calls)[field], value, 'Archive ' + field);
  if (call.customerTaskItemId) {
    const batches = JSON.parse(c.localStorage.getItem('customer-task-batches-v1'));
    const item = batches.flatMap(row => row.rows).find(row => row.id === call.customerTaskItemId);
    assert.equal(item.calls.find(row => row.callId === id).remark, remark); assert.equal(item.followup, '待继续跟进'); assert(!item.activeCallId);
  }
}
(async () => {
  for (const mode of ['无坐席技能', '已有坐席技能']) await check(mode + '：人工外呼无需选择技能，旧草稿不污染话单归属', async () => {
    const c = fixture(), agent = c.AgentWorkbench.myAgent();
    if (mode === '无坐席技能') c.CloudCallData.agentSkills = c.CloudCallData.agentSkills.filter(row => row.identityId !== agent.contactCenterIdentityId);
    const configured = JSON.stringify(c.CloudCallData.agentSkills);
    c.sessionStorage.setItem(sessionKey, JSON.stringify({ scope: scope.accountId + ':' + scope.tenantId, draft: { skillGroupId: 'LEGACY-SKILL', numberId: 'LEGACY-NUMBER' }, phase: 'idle' }));
    const html = c.AgentWorkbench.renderSeat();
    assert(!html.includes('seat-workspace-skill')); assert(!html.includes('请选择本次使用的坐席技能'));
    await startSeat(c); c.AgentWorkbench.openTemporary();
    assert(!c.test.html().includes('seat-skill-group'));
    c.AgentWorkbench.updateField('skillGroupId', 'LEGACY-SKILL');
    assert.equal(c.test.saved().draft.skillGroupId, undefined); assert.equal(c.test.saved().draft.numberId, undefined);
    c.AgentWorkbench.updateField('customerName', '无需技能的人工外呼'); c.AgentWorkbench.updateField('phone', '13991000009');
    assert.equal(c.AgentWorkbench.dial(), true);
    const call = c.AgentWorkbench.receivingContext().call;
    assert.equal(call.skillGroupId, ''); assert.equal(call.skillGroupName, '');
    assert.equal(call.caller, c.AliCtiAdapter.lastRequest.obClid);
    assert.equal(call.cno, agent.cno); assert.equal(call.tenantId, scope.tenantId); assert(call.callerNumberId);
    assert.equal(c.AliCtiAdapter.lastRequest.skillGroupId, undefined);
    c.test.runTimer(700); c.test.runTimer(2400); enterNotes(c); c.AgentWorkbench.end();
    c.AgentWorkbench.saveDisposition(); assertCompleted(c, call.callId);
    assert.equal(JSON.stringify(c.CloudCallData.agentSkills), configured);
  });
  await check('人工外呼先显示呼叫状态，接通后自动打开填写窗口', async () => {
    const c = fixture(); await startSeat(c);
    c.AgentWorkbench.openTemporary(); c.AgentWorkbench.updateField('customerName', '拨号记录客户'); c.AgentWorkbench.updateField('phone', '13991000009');
    assert.equal(c.AgentWorkbench.dial(), true); assert.equal(c.AgentWorkbench.receivingContext().phase, 'dialing');
    const callId=c.AgentWorkbench.current().call.callId;
    assert(c.test.html().includes('seat-call-stage') && c.test.html().includes('正在呼叫'));
    assert(!c.test.html().includes('id="seat-remark"'), 'The record form must wait until the customer connects');
    c.AgentWorkbench.setRemark('未接通前不能填写'); assert.equal(c.test.saved().remark, '');
    c.test.runTimer(700); assert.equal(c.AgentWorkbench.receivingContext().phase, 'ringing');
    assert(c.test.html().includes('等待客户接听') && !c.test.html().includes('id="seat-remark"'));
    c.test.runTimer(2400); assert.equal(c.AgentWorkbench.receivingContext().phase, 'connected');
    assert.equal(c.AgentWorkbench.current().call.callId,callId); assertForm(c);
    enterNotes(c); assertNotes(c);
  });
  await check('呼叫确认、呼叫状态和沟通记录依次使用居中模态弹窗', async () => {
    const c = fixture(); await startSeat(c);
    const nonModal = () => !!c.test.layerOptions.get('assigned-call-dialog')?.nonModal;
    c.AgentWorkbench.openTemporary(); assert.equal(nonModal(), false, 'The initial call dialog is modal on the root page');
    c.AgentWorkbench.beforeRouteChange(); c.test.setSecondaryDepth(1); c.AgentWorkbench.openTemporary();
    assert.equal(nonModal(), false, 'The call dialog stays modal over a customer list');
    c.AgentWorkbench.beforeRouteChange(); c.test.setSecondaryDepth(0);
    c.test.setBackgroundLayers([{ id: 'customer-detail', dataset: {} }]); c.AgentWorkbench.openTemporary();
    assert.equal(nonModal(), false, 'The call dialog stays modal over other details');
    c.AgentWorkbench.beforeRouteChange(); c.test.setBackgroundLayers([{ id: 'other-sidebar', dataset: { nonModal: 'true' } }]);
    c.AgentWorkbench.openTemporary(); assert.equal(nonModal(), false, 'A nonmodal background does not change the call dialog');
    c.AgentWorkbench.updateField('customerName', '模态通话客户'); c.AgentWorkbench.updateField('phone', '13991000008');
    assert.equal(c.AgentWorkbench.dial(), true);
    assert.equal(nonModal(), false); assert(c.test.html().includes('seat-call-stage'));
    assert(c.test.html().includes('AgentWorkbench.minimizeDialog()'), 'The active call offers an explicit collapse action');
    c.test.runTimer(700);c.test.runTimer(2400);
    assert.equal(nonModal(), false);assertForm(c);
    assert(c.test.html().includes('填写沟通记录 · 模态通话客户'));
  });
  await check('通话中手动收起弹窗后，重新打开保留本通身份、备注及客户业务草稿', async () => {
    const c = fixture(); let dock; const get = c.document.getElementById;
    c.document.body.append = node => { dock = node; };
    c.document.getElementById = id => id === 'native-call-dock' ? dock : get(id);
    await startSeat(c); c.test.setSecondaryDepth(1); beginManual(c); enterNotes(c);
    const before = clone(c.AgentWorkbench.current().call), request = c.AliCtiAdapter.lastRequest;
    assert(dock.innerHTML.includes('收起记录'));
    c.AgentWorkbench.minimizeDialog();
    assert.equal(c.test.html(), ''); assert(dock.innerHTML.includes('客户与记录'), 'The dock must not report a removed panel as visible');
    assert.equal(c.AgentWorkbench.current().phase, 'connected'); assertNotes(c);
    c.test.setSecondaryDepth(0); c.AgentWorkbench.openDialog();
    assert.deepEqual(clone(c.AgentWorkbench.current().call), before); assert.equal(c.AliCtiAdapter.lastRequest, request);
    assertNotes(c); assertForm(c); assert(c.test.html().includes(remark)); assert(dock.innerHTML.includes('收起记录'));
    assert.equal(c.test.layerOptions.get('assigned-call-dialog').nonModal, false);
  });
  await check('需要再次联系时沟通备注留空仍可保存处理结果', async () => {
    const c = fixture(); await startSeat(c); beginManual(c, '6');
    enterNotes(c, '');
    const callId = c.AgentWorkbench.current().call.callId;
    c.AgentWorkbench.end(); c.AgentWorkbench.saveDisposition();
    const saved = c.CloudCallData.calls.find(row => row.callId === callId);
    assert.equal(saved.processingStatus, '已完成');
    assert.equal(saved.agentDisposition, '需要再次联系');
    assert.equal(saved.dispositionRemark, '');
    assert.equal(c.AgentWorkbench.current().phase, 'idle');
  });
  await check('忙时重复联系其他已分配客户只返回当前通话，不换客户、不重拨且保留记录', async () => {
    const c = fixture(); await startSeat(c);
    const batches = JSON.parse(c.localStorage.getItem('customer-task-batches-v1'));
    const manual = batches.find(row => row.tenantId === scope.tenantId && row.businessType === 'lead' && row.rows.some(item => item.method === '人工外呼'));
    assert(manual, 'A local manual lead batch is required');
    const sample = manual.rows.find(item => item.method === '人工外呼');
    manual.rows.push({ ...clone(sample), id: 'QA-INCALL-FIRST-ASSIGNED', name: '测试待联系客户', phone: '13991000003', externalDocumentId: 'QA-INCALL-FIRST-LEAD', ownerId: scope.accountId, followup: '待联系', activeCallId: '', calls: [], history: [] });
    c.localStorage.setItem('customer-task-batches-v1', JSON.stringify(batches));
    const available = c.CustomerTasks.mine().find(row => row.id === 'QA-INCALL-FIRST-ASSIGNED'); assert(available, 'A callable lead customer is required');
    const batch = batches.find(row => row.rows.some(item => item.id === available.id));
    const source = batch.rows.find(row => row.id === available.id);
    batch.rows.push({ ...clone(source), id: 'QA-INCALL-OTHER-ASSIGNED', name: '另一位已分配客户', phone: '13991000004', externalDocumentId: 'QA-INCALL-OTHER-LEAD', activeCallId: '', calls: [], history: [] });
    c.localStorage.setItem('customer-task-batches-v1', JSON.stringify(batches));
    const customers = c.CustomerTasks.mine().filter(row => row.businessType === 'lead');
    assert(customers.length >= 2, 'Two callable lead customers are required');
    let requests = 0; const preview = c.AliCtiAdapter.previewOutcall;
    c.AliCtiAdapter.previewOutcall = (...args) => { requests++; return preview(...args); };
    c.test.setSecondaryDepth(1); c.AgentWorkbench.selectAssigned(customers[0]);
    const beforeCall = c.test.html();
    assert(beforeCall.includes('seat-contact-brief') && beforeCall.includes(c.PlatformUI.escape(customers[0].phone)), 'Assigned customer opens with a read-only contact summary');
    assert(beforeCall.includes('id="seat-dial"') && beforeCall.includes('拨打客户'), 'The assigned customer can be dialed directly');
    for (const id of ['seat-customer-name', 'seat-phone', 'seat-note', 'seat-remark']) assert(!beforeCall.includes('id="' + id + '"'), 'Pre-call assigned customer should not require ' + id);
    assert.equal(c.AgentWorkbench.dial(), true);
    assert(c.test.html().includes('seat-call-stage') && !c.test.html().includes('id="seat-remark"'));
    c.test.runTimer(700); c.test.runTimer(2400); assertForm(c); enterNotes(c);
    const before = clone(c.AgentWorkbench.current().call), other = clone(c.CustomerTasks.row(customers[1].id).r);
    c.AgentWorkbench.beforeRouteChange();
    c.AgentWorkbench.selectAssigned(customers[1]); c.AgentWorkbench.selectAssigned(customers[1]);
    assert.equal(requests, 1); assert.deepEqual(clone(c.AgentWorkbench.current().call), before);
    assert.equal(c.AgentWorkbench.current().phase, 'connected'); assertNotes(c); assertForm(c);
    assert.deepEqual(clone(c.CustomerTasks.row(customers[1].id).r), other, 'The other customer must remain unclaimed');
    assert(c.test.html().includes(customers[0].name)); assert.equal(c.test.layerOptions.get('assigned-call-dialog').nonModal, false);
  });
  for (const kind of ['inbound', 'predictive']) await check(kind + '：坐席未接听时不显示记录表单，也不能提前填写沟通结果', async () => {
    const c = fixture(); await startSeat(c);
    beginReceiving(c, kind, () => {
      assert(c.test.html().includes('incoming-signal'));assert(c.test.html().includes('>接听</button>'));assert(!c.test.html().includes('>拒接</button>'));
      assert(!c.test.html().includes('id="seat-disposition"'));
      const before = c.test.saved(); enterNotes(c);
      const after = c.test.saved();
      for (const field of ['disposition', 'remark', 'followup']) assert.deepEqual(after[field], before[field], field);
    });
    assertForm(c);
  });
  for (const kind of ['manual', 'inbound', 'predictive']) {
    let c, callId;
    await check(kind + '：通话中直接填写处理结果、备注及六项客户业务信息', async () => {
      c = fixture(); await startSeat(c);
      if (kind === 'manual') beginManual(c); else beginReceiving(c, kind);
      callId = c.AgentWorkbench.receivingContext().call.callId;
      assert.equal(c.test.saved().remark, '', 'Pre-call instructions must not become this call’s conversation notes');
      assertForm(c); enterNotes(c); assertNotes(c);
      assert.equal(c.test.saved().call.endedAt, '');
    });
    if (!c || c.AgentWorkbench.receivingContext().phase !== 'connected') continue;
    await check(kind + '：通话中草稿不会提前写为已完成或更新正式客户业务信息', () => {
      const journalBefore = c.localStorage.getItem('customer-followup-v1');
      c.AgentWorkbench.saveDisposition();
      assert.equal(c.AgentWorkbench.receivingContext().phase, 'connected');
      assert.equal(c.test.saved().call.endedAt, ''); assert.equal(c.test.saved().call.processingStatus, '待填写');
      assert.equal(c.localStorage.getItem('customer-followup-v1'), journalBefore);
      assert(!c.CloudCallData.calls.find(row => row.callId === callId)?.customerFollowup?.updatedAt);
    });
    await check(kind + '：收起后恢复与静音重绘保留全部输入', () => {
      enterNotes(c); c.AgentWorkbench.minimizeDialog(); assert.equal(c.test.html(), '');
      c.AgentWorkbench.openDialog(); assertNotes(c); assertForm(c); assert(c.test.html().includes(remark));
      c.AgentWorkbench.toggleMute(); assertNotes(c); assert(c.test.html().includes(remark));
    });
    await check(kind + '：挂断只切换到确认阶段并保留通话中草稿', () => {
      c.test.advance(5000); c.AgentWorkbench.end();
      assert.equal(c.AgentWorkbench.receivingContext().phase, 'wrap'); assertNotes(c);
      const html = c.test.html(), headerEnd = html.indexOf('class="layer-body');
      assert(html.includes(remark));
      assert(headerEnd > 0 && html.indexOf('id="seat-save"') < headerEnd, 'Save action stays visible in the fixed dialog header');
      assert(html.indexOf('id="seat-extend-wrapup"') < headerEnd && html.indexOf('id="seat-extend-wrapup"') > 0, 'Extend wrap-up stays beside collapse');
      assert.equal((html.match(/id="seat-save"/g)||[]).length, 1, 'Save action must not be repeated at the bottom');
      assert.equal(c.CloudCallData.calls.find(row => row.callId === callId).processingStatus, '待填写');
    });
    await check(kind + '：确认提交后话单、客户档案和关联客户名单一致', () => {
      c.AgentWorkbench.saveDisposition(); assert.equal(c.AgentWorkbench.receivingContext().phase, 'idle');
      assertCompleted(c, callId);
      const next = c.test.saved(); assert.equal(next.remark, ''); assert.equal(next.disposition, '');
      assert.equal(next.followup.businessType, '');
      for (const field of Object.keys(followup)) assert.equal(next.followup[field] ?? '', '');
    });
    await check(kind + '：保存后恢复接听，下一通不会带入上一位客户的通话记录', async () => {
      assert.equal(c.AliCtiSeatOperations.canDial(),false,'Must wait for successful unpause response before accepting calls');
      if([...c.test.timers.values()].some(value=>value.ms===220))c.test.runTimer(220);
      for(let i=0;i<8;i++)await Promise.resolve();
      assert.equal(c.AliCtiSeatOperations.current().presence,'ready');
      assert(c.AliCtiSeatOperations.canReceive('inbound'));
      beginManual(c, '3'); const next = c.test.saved();
      assert.notEqual(next.call.callId, callId); assert.equal(next.remark, ''); assert.equal(next.disposition, '');
      assert.equal(next.followup.businessType, '');
      for (const field of Object.keys(followup)) assert.equal(next.followup[field] ?? '', '');
    });
  }
  await check('通话中刷新恢复草稿，演示会话中断后仍需坐席确认提交', async () => {
    let c = fixture(); await startSeat(c); beginManual(c); enterNotes(c);
    const callId = c.AgentWorkbench.receivingContext().call.callId;
    c = fixture({ local: c.test.local, session: c.test.session });
    c.AgentWorkbench.renderSeat(); c.AgentWorkbench.openDialog();
    assert.equal(c.AgentWorkbench.receivingContext().phase, 'wrap'); assertNotes(c); assert(c.test.html().includes(remark));
    assert.equal(c.CloudCallData.calls.find(row => row.callId === callId).processingStatus, '待填写');
    c.AgentWorkbench.saveDisposition(); assertCompleted(c, callId);
  });
  await check('挂断后刷新保留草稿，最终提交后再次刷新只显示已保存记录', async () => {
    let c = fixture(); await startSeat(c); beginManual(c); enterNotes(c); c.AgentWorkbench.end();
    const callId = c.AgentWorkbench.receivingContext().call.callId;
    c = fixture({ local: c.test.local, session: c.test.session }); c.AgentWorkbench.renderSeat(); assertNotes(c);
    c.AgentWorkbench.saveDisposition(); assertCompleted(c, callId);
    c = fixture({ local: c.test.local, session: c.test.session }); c.AgentWorkbench.renderSeat();
    assert.equal(c.AgentWorkbench.receivingContext().phase, 'idle'); assert.equal(c.AgentWorkbench.receivingContext().call, null); assertCompleted(c, callId);
  });
  await check('其他账号及其他租户不会恢复当前坐席的通话草稿', async () => {
    const c = fixture(); await startSeat(c); beginManual(c); enterNotes(c);
    for (const other of [{ accountId: 'ACC-OPS-CHEN' }, { accountId: 'ACC-OPS-066', tenantId: 'TEN-NISSAN-SH' }]) {
      const next = fixture({ local: new Map(c.test.local), session: new Map(c.test.session), scope: other });
      next.AgentWorkbench.renderSeat(); next.AgentWorkbench.openTemporary();
      assert.equal(next.AgentWorkbench.receivingContext().call, null); assert(!next.test.html().includes(remark));
    }
  });
  await check('当前账号、租户或供应商账号变化后不能将输入写回旧通话草稿', async () => {
    const c = fixture(); await startSeat(c); beginManual(c); enterNotes(c);
    const originalGet = c.AppState.get, originalAccount = c.AppState.account;
    for (const patch of [{ accountId: 'ACC-OPS-CHEN' }, { tenantId: 'TEN-NISSAN-SH' }, { enterpriseId: 'OTHER' }]) {
      c.AppState.get = () => ({ ...originalGet(), ...patch });
      c.AppState.account = () => ({ ...originalAccount(), ...(patch.accountId ? { accountId: patch.accountId } : {}) });
      c.AgentWorkbench.setDisposition('客户拒绝联系'); c.AgentWorkbench.setRemark('禁止写入旧通话'); c.AgentWorkbench.setFollowup('leadLevel', 'D级');
      assertNotes(c);
    }
    c.AppState.get = originalGet; c.AppState.account = originalAccount;
  });
  await check('草稿暂存失败明确提示且保留当前输入，存储恢复后完整补存', async () => {
    const c = fixture(); await startSeat(c); beginManual(c);
    const before = c.sessionStorage.getItem(sessionKey), officialBefore = c.localStorage.getItem('customer-followup-v1');
    c.test.failSessionWrites(true); enterNotes(c);
    assert.equal(c.sessionStorage.getItem(sessionKey), before, 'Failed write must not replace the persisted snapshot');
    c.AgentWorkbench.minimizeDialog(); c.AgentWorkbench.openDialog();
    assert(c.test.html().includes('暂存未成功')); assert(c.test.html().includes(remark));
    for (const value of Object.values(followup)) assert(c.test.html().includes(value), 'Retained input ' + value);
    assert.equal(c.localStorage.getItem('customer-followup-v1'), officialBefore, 'A draft write cannot publish official information');
    c.test.failSessionWrites(false); c.AgentWorkbench.setRemark(remark); assertNotes(c);
    c.AgentWorkbench.minimizeDialog(); c.AgentWorkbench.openDialog();
    assert(!c.test.html().includes('填写内容已自动暂存')); assert(!c.test.html().includes('暂存未成功'));
    assert(!c.test.html().includes('seat-record-heading'), 'The record editor must not repeat its title and save guidance');
    const restored = fixture({ local: c.test.local, session: c.test.session }); restored.AgentWorkbench.renderSeat(); assertNotes(restored);
  });
  await check('多个坐席技能无需选择，外显号码保持独立且未绑定技能的号码可拨号', async () => {
    const c=fixture();await startSeat(c);
    const tenant=c.AppState.currentTenant(),agent=c.AgentWorkbench.myAgent();
    const number=c.ManualSkillAccess.numbers(tenant)[0];assert(number);number.boundSkillGroupIds=[];
    const group=c.CloudCallData.physicalSkillGroups.find(g=>g.skillGroupId===c.DemoFixtureKit.scopes.find(r=>r.code==='HQ').skillGroupId);
    const second={...group,physicalGroupId:'QA-INDEPENDENT-GROUP',skillGroupId:'QA-INDEPENDENT-SKILL',name:'另一个业务技能组'};
    c.CloudCallData.physicalSkillGroups.push(second);c.CloudCallData.agentSkills.push({relationId:'QA-INDEPENDENT-REL',identityId:agent.contactCenterIdentityId,physicalGroupId:second.physicalGroupId,skillLevel:1,status:'已生效',syncStatus:'同步成功'});
    c.AgentWorkbench.openTemporary();c.AgentWorkbench.updateField('numberId','LEGACY-NUMBER');
    assert(!c.test.html().includes('seat-skill-group')); assert(!c.test.html().includes('seat-caller'));
    assert.equal(c.test.saved().draft.numberId,undefined);
    c.AgentWorkbench.updateField('customerName','独立号码客户');c.AgentWorkbench.updateField('phone','13991000008');
    assert.equal(c.AgentWorkbench.dial(),true);assert.equal(c.AgentWorkbench.current().call.callerNumberId,number.numberId);
  });
  await check('取消技能绑定后仍校验租户、供应商账号、号码状态和人工外呼用途；拨号前重查授权', async () => {
    const c=fixture();await startSeat(c);const tenant=c.AppState.currentTenant(),number=c.ManualSkillAccess.numbers(tenant)[0];assert(number);
    const original=clone(number),eligible=()=>c.ManualSkillAccess.numbers(tenant).some(n=>n.numberId===number.numberId);
    number.boundSkillGroupIds=[];assert(eligible());
    for(const patch of [{localEnabled:false},{authorizedTenantIds:[]},{enterpriseId:'OTHER'},{businessStatus:'已隔离'},{aliyunUsage:'Inbound'},{alictiNumber:{...original.alictiNumber,status:0}},{alictiNumber:{...original.alictiNumber,isInUse:0}}]){
      Object.assign(number,original,patch);assert.equal(eligible(),false);
    }
    Object.assign(number,original);c.AgentWorkbench.openTemporary();c.AgentWorkbench.updateField('customerName','授权失效客户');c.AgentWorkbench.updateField('phone','13991000007');
    for(const available of c.ManualSkillAccess.numbers(tenant)) available.authorizedTenantIds=[];
    const previousRequest=c.AliCtiAdapter.lastRequest;
    assert.equal(c.AgentWorkbench.dial(),false); assert.equal(c.AliCtiAdapter.lastRequest,previousRequest,'授权失效不得提交新的外呼请求');
  });
  await check('自动外显拨号前重新选号，撤权后换用本租户可用号，实际号码快照不随配置改变', async () => {
    const c=fixture(); await startSeat(c); const tenant=c.AppState.currentTenant();
    const first=c.ManualSkillAccess.numbers(tenant)[0]; assert(first);
    const fallback={...clone(first),numberId:'QA-AUTO-CALLER',number:'021****800',alictiNumber:{...first.alictiNumber,hotline:'02100008800',status:1,isInUse:1}};
    c.CloudCallData.phoneNumbers.splice(c.CloudCallData.phoneNumbers.indexOf(first)+1,0,fallback);
    c.AgentWorkbench.openTemporary(); assert(!c.test.html().includes('seat-caller'));
    c.AgentWorkbench.updateField('customerName','自动选号验证'); c.AgentWorkbench.updateField('phone','13991000006');
    first.authorizedTenantIds=[];
    assert.equal(c.AgentWorkbench.dial(),true);
    const call=c.AgentWorkbench.current().call;
    assert.equal(call.callerNumberId,fallback.numberId); assert.equal(call.caller,'02100008800'); assert.equal(c.AliCtiAdapter.lastRequest.obClid,call.caller);
    fallback.localEnabled=false; fallback.alictiNumber.hotline='02100009900';
    assert.equal(call.caller,'02100008800'); assert.equal(c.AliCtiAdapter.lastRequest.obClid,'02100008800');
  });
  await check('预外呼来电演示不依赖号码技能绑定，仍按任务和坐席技能分配', async () => {
    const c=fixture();await startSeat(c);
    for(const number of c.CloudCallData.phoneNumbers)number.boundSkillGroupIds=[];
    const batches=JSON.parse(c.localStorage.getItem('customer-task-batches-v1'));
    for(const batch of batches.filter(row=>row.tenantId===scope.tenantId&&row.enterpriseId===scope.enterpriseId))for(const item of batch.rows||[])if(!item.activeCallId&&item.method==='预外呼')item.ownerId='';
    c.localStorage.setItem('customer-task-batches-v1',JSON.stringify(batches));
    c.ScenarioDemo.openReceivingDemo();
    const html=c.test.layers.get('receiving-demo');assert(html);
    assert(!html.includes('暂无正在执行且有待联系客户的预外呼任务。'));
    assert.equal(c.ScenarioDemo.triggerReceiving('predictive','success'),true);
    assert.equal(c.AgentWorkbench.receivingContext().phase,'offered');
    assert.equal(c.AgentWorkbench.answerIncoming(),true);c.test.runTimer(1100);
    assert.equal(c.AgentWorkbench.receivingContext().phase,'connected');
  });
  await check('来电演示不复用待继续跟进历史行，只分配原任务新增的未呼叫行', async () => {
    const c=fixture();await startSeat(c);
    const task=c.CloudCallData.tasks.find(task=>task.demoPack==='alicti-showcase-v1'&&task.tenantId===scope.tenantId&&task.enterpriseId===scope.enterpriseId&&task.callType==='预外呼'&&task.status==='执行中');assert(task);
    const batches=JSON.parse(c.localStorage.getItem('customer-task-batches-v1'));
    const batch=batches.find(batch=>batch.tenantId===scope.tenantId&&batch.rows.some(row=>row.taskId===task.taskId));assert(batch);
    const source=batch.rows.find(row=>row.taskId===task.taskId&&row.calls.length&&!row.activeCallId);assert(source);
    for(const scoped of batches.filter(batch=>batch.tenantId===scope.tenantId&&batch.enterpriseId===scope.enterpriseId))for(const row of scoped.rows||[])if(row.method==='预外呼'){row.followup='待继续跟进';row.ownerId='';}
    c.localStorage.setItem('customer-task-batches-v1',JSON.stringify(batches));
    const original=clone(batch.rows);
    c.ScenarioDemo.openReceivingDemo();
    assert(c.test.layers.get('receiving-demo').includes('暂无正在执行且有待联系客户的预外呼任务。'));
    assert.equal(c.ScenarioDemo.triggerReceiving('predictive','success'),false);assert.equal(c.AgentWorkbench.receivingContext().phase,'idle');
    const next={...clone(source),id:'QA-RECEIVING-SAME-TASK-NEXT',phone:'13996000001',ownerId:'',followup:'待联系',calls:[],activeCallId:'',history:[],repeatContact:{sourceTaskId:task.taskId,sourceBatchId:batch.id,sourceItemId:source.id,sourceCallId:source.calls.at(-1).callId,rootItemId:source.id,businessContactNo:2}};
    batches.unshift({id:'QA-RECEIVING-SAME-TASK-BATCH',name:'原任务再次联系',tenantId:scope.tenantId,enterpriseId:scope.enterpriseId,createdBy:scope.accountId,rows:[next]});
    c.localStorage.setItem('customer-task-batches-v1',JSON.stringify(batches));
    c.ScenarioDemo.openReceivingDemo();assert.equal(c.ScenarioDemo.triggerReceiving('predictive','success'),true);
    const offer=c.AgentWorkbench.receivingContext().call;assert.equal(offer.taskId,task.taskId);assert.equal(offer.customerTaskItemId,next.id);
    assert.deepStrictEqual(JSON.parse(c.localStorage.getItem('customer-task-batches-v1')).find(row=>row.id===batch.id).rows,original);
  });
  await check('预外呼来电演示发起前重新校验号码授权，不能越权分配', async () => {
    const c=fixture();await startSeat(c);
    for(const number of c.CloudCallData.phoneNumbers)number.boundSkillGroupIds=[];
    const batches=JSON.parse(c.localStorage.getItem('customer-task-batches-v1'));
    for(const batch of batches.filter(row=>row.tenantId===scope.tenantId&&row.enterpriseId===scope.enterpriseId))for(const item of batch.rows||[])if(!item.activeCallId&&item.method==='预外呼')item.ownerId='';
    c.localStorage.setItem('customer-task-batches-v1',JSON.stringify(batches));
    c.ScenarioDemo.openReceivingDemo();
    assert(!c.test.layers.get('receiving-demo').includes('暂无正在执行且有待联系客户的预外呼任务。'));
    for(const number of c.CloudCallData.phoneNumbers)number.authorizedTenantIds=[];
    assert.equal(c.ScenarioDemo.triggerReceiving('predictive','success'),false);
    assert.equal(c.AgentWorkbench.receivingContext().phase,'idle');
  });
  await check('全局工具条从离线上线到通话，静音方向及挂断请求对应 SDK，记录不丢失', async () => {
    const c=fixture();let dock;
    const get=c.document.getElementById;
    c.document.body.append=e=>{dock=e;};
    c.document.getElementById=id=>id==='native-call-dock'?dock:id==='seatMuteDirection'?{value:'out'}:get(id);
    c.AgentWorkbench.updateDock();assert(dock.innerHTML.includes('AgentWorkbench.signIn()'));
    await startSeat(c);c.AgentWorkbench.updateDock();assert(dock.innerHTML.includes('SeatOperationUI.open(\'pause\')'));
    beginManual(c);enterNotes(c);assert(dock.innerHTML.includes('静音范围'));assert(!dock.innerHTML.includes('暂停接听'));
    c.AgentWorkbench.toggleMute();assert.equal(c.AliCtiAdapter.lastRequest.method,'CTILink.Session.mute');assert.equal(c.AliCtiAdapter.lastRequest.fields.direction,'out');
    c.AgentWorkbench.toggleMute();assert.equal(c.AliCtiAdapter.lastRequest.fields.direction,'out');
    c.AgentWorkbench.minimizeDialog();assert(dock.innerHTML.includes('客户与记录'));c.AgentWorkbench.openDialog();assert(c.test.html().includes(remark));
    c.AgentWorkbench.end();assert.equal(c.AliCtiAdapter.lastRequest.method,'CTILink.Session.unlink');assert(dock.innerHTML.includes('话后处理'));assert(!dock.innerHTML.includes('seat-hangup'));
  });
  for(const kind of ['inbound','predictive']) await check(kind+'：工具条区分待接来电与已建立通话的操作', async()=>{
    const c=fixture();let dock;const get=c.document.getElementById;c.document.body.append=e=>{dock=e;};c.document.getElementById=id=>id==='native-call-dock'?dock:get(id);
    await startSeat(c);beginReceiving(c,kind,()=>{assert(dock.innerHTML.includes('接听来电'));assert(!dock.innerHTML.includes('seat-hangup'));});
    assert(dock.innerHTML.includes('静音范围'));assert(!dock.innerHTML.includes('接听来电'));
  });
  console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', count: checks.length, failed: failures.length, checks, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})();
