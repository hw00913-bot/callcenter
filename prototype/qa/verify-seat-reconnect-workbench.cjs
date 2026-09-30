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
  const local = options.local || new Map(), session = options.session || new Map(), timers = new Map(), layers = new Map();
  let now = new Date('2026-09-17T15:00:00+08:00').getTime(), timerId = 0, uuid = 0, sessionWriteFails = false;
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
  const element = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, append() {}, appendChild() {}, insertBefore() {}, remove() {}, addEventListener() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1440, height: 1000 }) });
  const document = { addEventListener() {}, dispatchEvent() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: element, createTreeWalker: () => ({ nextNode: () => null }), documentElement: element(), body: element(), head: element(), activeElement: null };
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
  ctx.PlatformUI.openLayer = (id, html) => layers.set(id, html);
  ctx.PlatformUI.closeLayer = id => layers.delete(id);
  ctx.navigateTo = () => {};
  ctx.showToast = () => {};
  ctx.test = { local, session, layers, timers,
    saved: () => JSON.parse(ctx.sessionStorage.getItem(sessionKey) || 'null'),
    html: () => layers.get('assigned-call-dialog') || '',
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
 await check('点击坐席登录只打开单次表单，选择状态与模式后提交真实登录',async()=>{
  const c=fixture();c.AgentWorkbench.renderSeat();c.AgentWorkbench.signIn();
  const form=()=>c.test.layers.get('seat-operation-drawer')||'';
  assert(form().includes('id="seat-operation-loginStatus"'),'Login status selector');
  assert(form().includes('id="seat-operation-workingMode"'),'Working mode selector');
  assert.equal(c.AliCtiSeatOperations.trace.filter(row=>row.request.method==='CTILink.Agent.login').length,0,'Opening login form must not send SDK login');
  const rejected=await c.SeatOperationUI.submit();assert(!rejected?.ok,'Working mode must be explicitly selected');
  assert.equal(c.AliCtiSeatOperations.trace.filter(row=>row.request.method==='CTILink.Agent.login').length,0);
  c.SeatOperationUI.set('workingMode','4');c.SeatOperationUI.set('loginStatus','2');c.SeatOperationUI.set('pauseDescription','核对客户资料');
  assert(form().includes('id="seat-operation-pauseDescription"'),'Busy description is shown only when busy is selected');
  void c.SeatOperationUI.submit();
  for(let i=0;i<25&&!c.AgentWorkbench.receivingContext().online;i++){
   await Promise.resolve();await Promise.resolve();
   if([...c.test.timers.values()].some(value=>value.ms===220))c.test.runTimer(220);
  }
  assert.equal(c.AgentWorkbench.receivingContext().online,true,'Submitting the form logs in the seat');
  const login=c.AliCtiSeatOperations.trace.filter(row=>row.request.method==='CTILink.Agent.login').at(-1);
  assert(login,'Supplier login request');assert.equal(login.request.params.workingMode,'4');assert.equal(Number(login.request.params.loginStatus),2);
  assert.equal(c.AliCtiSeatOperations.current().presence,'paused');
 });
 for (const kind of ['manual','inbound','predictive']) await check(kind+'：连接事件保留通话、全部业务草稿与现有记录，用户完成后可重登',async()=>{
  const c=fixture();await startSeat(c);kind==='manual'?beginManual(c):beginReceiving(c,kind);enterNotes(c);
  const before=c.AgentWorkbench.receivingContext(),callId=before.call.callId,recordsBefore=clone(c.CloudCallData.calls);
  for(const event of ['breakLine','restored','sipDisconnected']){
   assert(c.AliCtiSeatOperations.demoConnection(event).ok);assertNotes(c);
   const current=c.AgentWorkbench.receivingContext();assert.equal(current.phase,'connected');assert.equal(current.call.callId,callId);assert.equal(current.call.endedAt,'');assert(c.test.html().includes('已保留'));assert.equal(c.AgentWorkbench.allowContextChange(true),false);
  }
  assert.deepEqual(clone(c.CloudCallData.calls),recordsBefore);
  const raw=c.AliCtiAdapter.lastRequest;assert(!c.AliCtiAdapter.previewOutcall(c.AgentWorkbench.myAgent(),'13991000005','02100006101',{}).ok);assert.equal(c.AliCtiAdapter.lastRequest,raw);
  c.AgentWorkbench.end();assertNotes(c);c.AgentWorkbench.saveDisposition();assertCompleted(c,callId);
  for(let i=0;i<40&&c.SeatOperationUI.isBusy();i++)await Promise.resolve();
  assert.equal(c.SeatOperationUI.isBusy(),false,'Saved-record automatic unpause must settle before relogin');
  assert(c.AliCtiSeatOperations.current());assert(c.AliCtiSeatOperations.connectionStatus().blocked);
  let settled=false;const recovered=c.SeatOperationUI.relogin().finally(()=>{settled=true;});
  for(let i=0;i<80&&!settled;i++){await Promise.resolve();await Promise.resolve();if([...c.test.timers.values()].some(t=>t.ms===220))c.test.runTimer(220);}
  assert(settled,'Relogin should finish after its asynchronous resource check');assert((await recovered).ok);
  assert(!c.AliCtiSeatOperations.connectionStatus().blocked);assert.equal(c.AliCtiSeatOperations.current().presence,'paused');assertCompleted(c,callId);
 });
 await check('断线后刷新仍保留业务草稿和历史记录，不自动提交',async()=>{
  let c=fixture();await startSeat(c);beginManual(c);enterNotes(c);const callId=c.AgentWorkbench.receivingContext().call.callId;
  assert(c.AliCtiSeatOperations.demoConnection('sipDisconnected').ok);assertNotes(c);
  c=fixture({local:c.test.local,session:c.test.session});c.AgentWorkbench.renderSeat();c.AgentWorkbench.openDialog();assertNotes(c);
  assert.equal(c.CloudCallData.calls.find(r=>r.callId===callId).processingStatus,'待填写');assert(c.test.html().includes(remark));
 });
 console.log(JSON.stringify({result:failures.length?'fail':'pass',count:checks.length,failed:failures.length,checks,failures},null,2));if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
