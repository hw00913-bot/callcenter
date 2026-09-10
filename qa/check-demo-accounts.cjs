/** Actual demo/auth/seat handlers with VM doubles; not browser or production authentication evidence. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { root, setup } = require('./fixtures/prototype-vm.cjs');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const ids = ['ACC-ADMIN-018', 'ACC-OPS-CHEN', 'ACC-OPS-108', 'ACC-OPS-066', 'ACC-SUPER-001'];
const account = (x, id) => x.d.accounts.find(a => a.accountId === id);
const picker = x => { x.ctx.DemoSwitch.open(); return x.layers.get('demo-accounts') || ''; };
const card = (html, id) => {
  const row = [...html.matchAll(/<article\b[^>]*data-demo-account="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)].find(m => m[1] === id);
  assert(row, `Missing account card: ${id}`);
  return row[2];
};
const context = x => JSON.stringify(x.ctx.AppState.get());
const management = x => JSON.stringify({ accounts: x.d.accounts, memberships: x.d.memberships, tenants: x.d.tenants });
function rejectWithoutLogout(x, id, expectedMessage) {
  const before = context(x), data = management(x), events = x.events.length;
  assert.equal(x.ctx.DemoSwitch.enter(id), false);
  assert.equal(context(x), before, 'Rejected switch must preserve the current session/context');
  assert.equal(management(x), data, 'Rejected switch must not rewrite accounts, memberships or tenants');
  assert.equal(x.events.length, events, 'Rejected switch must not navigate');
  if (expectedMessage) assert(x.messages.some(m => expectedMessage.test(m.m)), `Expected feedback: ${expectedMessage}`);
}
function unchangedData(x, run) {
  const before = management(x);
  const arrays = ['accounts', 'memberships', 'tenants', 'agents', 'agentSkills', 'calls', 'callPlans', 'phoneNumbers'];
  const counts = arrays.map(k => [k, x.d[k].length]);
  run();
  assert.equal(management(x), before, 'Quick login must not assign roles, capabilities or create management data');
  for (const [key, count] of counts) assert.equal(x.d[key].length, count, `${key} must not gain/lose records`);
}

test('Five actual accounts, one card each; no password exposed', () => {
  const x = setup(), html = picker(x);
  const rendered = [...html.matchAll(/data-demo-account="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(rendered.slice().sort(), ids.slice().sort());
  assert.equal(new Set(rendered).size, 5);
  assert.equal(new Set(x.d.demoAccountIds).size, 5);
  for (const a of x.d.accounts) {
    if (ids.includes(a.accountId)) assert(card(html, a.accountId).includes(a.loginUsername));
    assert(!html.includes(a.password), 'Picker must not render any current account password');
    assert(!x.ctx.DemoSwitch.loginShortcut().includes(a.password));
  }
  assert(!html.includes('推荐体验')); assert(!html.includes('onclick="DemoSwitch.enter(\'admin-seat\')'));
  x.d.demoAccountIds.push(ids[0]);
  assert.equal([...picker(x).matchAll(/data-demo-account="/g)].length, 5, 'Repeated configuration must not duplicate accounts');
});

test('Account names, tenant names, member roles and domains are read live', () => {
  const x = setup(), a = account(x, ids[1]);
  const m = x.d.memberships.find(m => m.accountId === a.accountId);
  const t = x.d.tenants.find(t => t.tenantId === m.tenantId);
  a.name = '动态演示账号'; a.loginUsername = 'changed-demo-login'; a.password = 'Changed-demo-secret-01';
  m.roleCode = 'ADMIN'; t.name = '动态租户'; t.capabilitySet = ['AI_OUTBOUND'];
  const html = picker(x), row = card(html, a.accountId);
  for (const text of ['动态演示账号', 'changed-demo-login', '动态租户', '租户管理员', '智能外呼', '未开通云联络中心']) assert(row.includes(text), text);
  assert(!row.includes('总部坐席运营')); assert(!html.includes(a.password));
  unchangedData(x, () => assert.equal(x.ctx.DemoSwitch.enter(a.accountId), true));
  assert.equal(x.ctx.AppState.get().authStage, 'READY');
  assert.equal(x.ctx.AppState.get().activeDomain, 'AI_OUTBOUND');
  assert.equal(x.ctx.AppState.effectiveAccess().roleCode, 'ADMIN');
});

test('Seat status follows the actual same-tenant and same-instance association', () => {
  const x = setup(), a = account(x, ids[1]);
  const seat = x.d.agents.find(s => s.accountId === a.accountId);
  assert(seat); assert.equal(seat.syncStatus, '同步成功');
  assert(card(picker(x), a.accountId).includes('已开通坐席'));
  seat.lifecycleStatus = '已停用';
  assert(card(picker(x), a.accountId).includes('已停用'));
  seat.lifecycleStatus = '已启用'; seat.syncStatus = '同步失败';
  assert(card(picker(x), a.accountId).includes('同步失败'));
  seat.syncStatus = '同步成功'; seat.instanceId = 'CCC-EPI';
  assert(card(picker(x), a.accountId).includes('未关联坐席'), 'Other-instance seat must not be offered');
  seat.instanceId = 'CCC-NISSAN'; seat.tenantId = 'TEN-NISSAN-SH';
  assert(card(picker(x), a.accountId).includes('未关联坐席'), 'Other-tenant seat must not be offered');
  seat.tenantId = 'TEN-NISSAN-HQ'; seat.lifecycleStatus = '已删除';
  assert(card(picker(x), a.accountId).includes('未关联坐席'), 'Deleted seat must not be offered');
});

test('Existing legacy identity association matches the real seat accessor', () => {
  const x = setup('operator-chen'), a = x.ctx.AppState.account(), seat = x.ctx.AgentWorkbench.myAgent();
  assert(seat); a.linkedIdentityId = seat.contactCenterIdentityId; seat.accountId = '';
  assert.equal(x.ctx.AgentWorkbench.myAgent(), seat);
  assert(card(picker(x), a.accountId).includes('已开通坐席'));
  seat.accountId = 'SOME-OTHER-ACCOUNT';
  assert.equal(x.ctx.AgentWorkbench.myAgent(), undefined);
  assert(card(picker(x), a.accountId).includes('未关联坐席'), 'Legacy fallback must not take another account seat');
});

test('Li Ming stops at the real tenant selection; choosing tenant then domain grants only that membership', () => {
  const x = setup('operator-chen'), previousSession = x.ctx.AppState.get().sessionId;
  unchangedData(x, () => assert.equal(x.ctx.DemoSwitch.enter(ids[0]), true));
  const s = x.ctx.AppState.get();
  assert.equal(s.accountId, ids[0]); assert.notEqual(s.sessionId, previousSession);
  assert.equal(s.authStage, 'TENANT'); assert.equal(s.tenantId, ''); assert.equal(s.activeDomain, '');
  assert.equal(x.ctx.AppState.effectiveAccess().valid, false);
  assert.equal(x.ctx.AppState.availableTenants().length, 2);
  assert.equal(x.ctx.AppState.chooseTenant('TEN-EPI-HQ'), false);
  assert.equal(x.ctx.AppState.chooseTenant('TEN-NISSAN-SH'), true);
  assert.equal(x.ctx.AppState.get().authStage, 'DOMAIN');
  assert.equal(x.ctx.AppState.chooseDomain('UNKNOWN-DOMAIN'), false);
  assert.equal(x.ctx.AppState.chooseDomain('CLOUD_CONTACT_CENTER'), true);
  assert.equal(x.ctx.AppState.get().tenantId, 'TEN-NISSAN-SH');
  assert.equal(x.ctx.AppState.effectiveAccess().roleCode, 'ADMIN');
  assert.equal(x.ctx.AppState.effectiveAccess().valid, true);
  assert.equal(x.ctx.AppState.get().currentPage, 'home');
  assert.equal(x.ctx.AppState.setTenant('TEN-NISSAN-HQ'), false, 'Tenant change after login still requires logout');
});

test('Chen Min stops at domain selection; no automatic seat landing or online state', () => {
  const x = setup(), original = x.d.agents.find(a => a.accountId === ids[1]), beforeSeat = JSON.stringify(original);
  unchangedData(x, () => assert.equal(x.ctx.DemoSwitch.enter(ids[1]), true));
  const s = x.ctx.AppState.get();
  assert.equal(s.authStage, 'DOMAIN'); assert.equal(s.tenantId, 'TEN-NISSAN-HQ'); assert.equal(s.activeDomain, '');
  assert.equal(x.ctx.AgentWorkbench.hasSeat(), false);
  assert.equal(x.events.some(e => e.key === 'seat-workbench'), false);
  assert.equal(x.ctx.AppState.chooseDomain('CLOUD_CONTACT_CENTER'), true);
  assert.equal(x.ctx.AppState.get().currentPage, 'home'); assert.equal(x.ctx.AgentWorkbench.hasSeat(), true);
  assert.equal(JSON.stringify(original), beforeSeat, 'Login must not create, enable or put a seat online');
});

test('Super administrator restores the last valid customer, never a shortcut default', () => {
  const x = setup(); account(x, ids[4]).lastInstanceId = 'CCC-EPI';
  assert(card(picker(x), ids[4]).includes('上次客户/品牌：东风奕派'));
  unchangedData(x, () => assert.equal(x.ctx.DemoSwitch.enter(ids[4]), true));
  const s = x.ctx.AppState.get();
  assert.equal(x.ctx.AppState.isSuper(), true); assert.equal(s.tenantId, 'TENANT-SUPER-BUILTIN');
  assert.equal(s.instanceId, 'CCC-EPI'); assert.equal(s.activeDomain, 'CLOUD_CONTACT_CENTER');
  assert.equal(s.authStage, 'READY'); assert.equal(s.currentPage, 'home');
  assert.equal(x.ctx.AgentWorkbench.hasSeat(), false);
});

test('Invalid or stopped remembered customer requires normal instance selection', () => {
  for (const remembered of ['UNKNOWN-INSTANCE', 'CCC-TEST']) {
    const x = setup(); account(x, ids[4]).lastInstanceId = remembered;
    unchangedData(x, () => assert.equal(x.ctx.DemoSwitch.enter(ids[4]), true));
    assert.equal(x.ctx.AppState.get().authStage, 'INSTANCE'); assert.equal(x.ctx.AppState.get().instanceId, '');
    assert.equal(x.ctx.AppState.chooseInstance('CCC-TEST'), false);
    assert.equal(x.ctx.AppState.chooseInstance('UNKNOWN-INSTANCE'), false);
    assert.equal(x.ctx.AppState.chooseInstance('CCC-NISSAN'), true);
    assert.equal(x.ctx.AppState.get().authStage, 'DOMAIN');
    assert.equal(x.ctx.AppState.chooseDomain('AI_OUTBOUND'), true);
    assert.equal(x.ctx.AppState.get().instanceId, 'CCC-NISSAN');
    assert.equal(x.ctx.AppState.effectiveAccess().valid, true);
  }
});

test('Single tenant/single domain enters the normal home without altering authorization', () => {
  const x = setup(), t = x.d.tenants.find(t => t.tenantId === 'TEN-NISSAN-HQ');
  t.capabilitySet = ['CLOUD_CONTACT_CENTER'];
  unchangedData(x, () => assert.equal(x.ctx.DemoSwitch.enter(ids[1]), true));
  assert.equal(x.ctx.AppState.get().authStage, 'READY');
  assert.equal(x.ctx.AppState.get().currentPage, 'home');
  assert.equal(x.ctx.AppState.get().activeDomain, 'CLOUD_CONTACT_CENTER');
  assert.equal(x.ctx.AppState.effectiveAccess().roleCode, 'OPERATOR');
  assert.equal(x.events.some(e => e.key === 'seat-workbench'), false);
});

test('All configured account logins preserve stored business data and account/member counts', () => {
  for (const id of ids) {
    const x = setup(), marker = JSON.stringify({ data: 'saved customer/task marker' });
    x.local.set('qa-retained-customer-data', marker);
    unchangedData(x, () => assert.equal(x.ctx.DemoSwitch.enter(id), true));
    assert.equal(x.local.get('qa-retained-customer-data'), marker);
    assert.equal(x.ctx.AppState.get().accountId, id);
  }
});

test('Disabled account and disabled memberships reject before ending the current session', () => {
  const x = setup(); account(x, ids[1]).status = '停用';
  assert(card(picker(x), ids[1]).includes('disabled')); assert(card(picker(x), ids[1]).includes('账号已停用'));
  rejectWithoutLogout(x, ids[1], /账号已停用/);
  account(x, ids[1]).status = '启用';
  x.d.memberships.filter(m => m.accountId === ids[1]).forEach(m => { m.status = '停用'; });
  const html = card(picker(x), ids[1]); assert(html.includes('成员已停用')); assert(html.includes('disabled'));
  rejectWithoutLogout(x, ids[1], /暂无可用租户或业务域/);
});

test('Disabled tenant, empty domains and all stopped instances reject without logging out', () => {
  for (const type of ['tenant', 'domain', 'instances']) {
    const x = setup('super'), t = x.d.tenants.find(t => t.tenantId === 'TEN-NISSAN-HQ');
    if (type === 'tenant') t.status = '停用';
    if (type === 'domain') t.capabilitySet = [];
    if (type === 'instances') x.d.instances.forEach(i => { i.status = 'STOPPED'; });
    rejectWithoutLogout(x, ids[1], /暂无可用租户或业务域/);
    if (type === 'instances') rejectWithoutLogout(x, ids[4], /暂无可用租户或业务域/);
  }
});

test('Unknown and non-allowlisted real accounts cannot use the demo login path', () => {
  const x = setup(); rejectWithoutLogout(x, 'UNKNOWN-ACCOUNT', /不在演示账号清单/);
  const hidden = structuredClone(account(x, ids[1]));
  hidden.accountId = 'QA-NON-DEMO'; hidden.loginUsername = 'qa-non-demo'; hidden.loginMobile = '13800009999';
  x.d.accounts.push(hidden);
  x.d.memberships.push({ membershipId: 'QA-NON-DEMO-MEMBER', accountId: hidden.accountId, tenantId: 'TEN-NISSAN-HQ', roleCode: 'OPERATOR', status: '启用' });
  assert(!picker(x).includes('data-demo-account="QA-NON-DEMO"'));
  rejectWithoutLogout(x, hidden.accountId, /不在演示账号清单/);
});

test('Dirty edits reject before logout and preserve the active online seat', async () => {
  const x = setup('operator-chen'), w = x.ctx.AgentWorkbench;
  w.render(); w.updateField('skillGroupId', 'SG-ALI-HQ-SALES');
  const seat = w.myAgent(); w.signIn(); await Promise.resolve();
  assert.equal(seat.currentEndpoint, 'NATIVE_WORKBENCH');
  x.ctx.AppState.setDirty(true);
  rejectWithoutLogout(x, ids[0], /请先保存当前修改/);
  assert.equal(seat.currentEndpoint, 'NATIVE_WORKBENCH', 'Dirty rejection must not release the online seat');
  x.ctx.AppState.setDirty(false);
  assert.equal(x.ctx.DemoSwitch.enter(ids[0]), true);
  assert.equal(seat.currentEndpoint, ''); assert.equal(seat.agentStatus, '离线');
});

test('Dialing, ringing, connected and unsaved wrap-up all protect the current call', async () => {
  const x = setup('operator-chen'), w = x.ctx.AgentWorkbench;
  w.openTemporary(); w.updateField('skillGroupId', 'SG-ALI-HQ-SALES');
  w.updateField('customerName', '快捷登录保护测试'); w.updateField('phone', '13800009998');
  w.signIn(); await Promise.resolve(); assert.equal(w.dial(), true);
  const seat = w.myAgent(); assert.equal(seat.currentCall, true);
  rejectWithoutLogout(x, ids[0], /请先结束当前通话并保存处理结果/);
  const ring = [...x.timers.values()].find(t => t.ms === 700); assert(ring); ring.fn();
  rejectWithoutLogout(x, ids[0], /请先结束当前通话并保存处理结果/);
  const answer = [...x.timers.values()].find(t => t.ms === 2400); assert(answer); answer.fn();
  rejectWithoutLogout(x, ids[0], /请先结束当前通话并保存处理结果/);
  w.end(); assert.equal(seat.agentStatus, '话后处理');
  const saved = x.d.calls.find(c => c.customerName === '快捷登录保护测试');
  assert(saved); assert.equal(saved.processingStatus, '待填写');
  rejectWithoutLogout(x, ids[0], /请先结束当前通话并保存处理结果/);
  w.setDisposition('已完成沟通'); w.saveDisposition();
  assert.equal(saved.processingStatus, '已完成');
  assert.equal(x.ctx.DemoSwitch.enter(ids[0]), true);
  assert.equal(seat.currentEndpoint, ''); assert.equal(seat.agentStatus, '离线');
  assert(x.d.calls.some(c => c.callId === saved.callId && c.processingStatus === '已完成'));
});

test('Demo mode off has no login shortcut or picker and cannot switch accounts', () => {
  const x = setup(); x.d.demoSwitchEnabled = false;
  assert.equal(x.ctx.DemoSwitch.loginShortcut(), '');
  assert.equal(picker(x), '');
  rejectWithoutLogout(x, ids[1]);
  // Capture this component's actual ready handler, not all unrelated DOM-ready
  // navigation/fetch handlers. The fixture intentionally has no real browser DOM.
  const ready = [], add = x.ctx.document.addEventListener;
  const entry = x.field('demo-tools-entry', '');
  x.ctx.document.addEventListener = (type, fn) => { if (type === 'DOMContentLoaded') ready.push(fn); };
  try {
    vm.runInContext(fs.readFileSync(path.join(root, 'js/components/demo-switch.js'), 'utf8'), x.ctx, { filename: 'js/components/demo-switch.js' });
  } finally { x.ctx.document.addEventListener = add; }
  assert.equal(ready.length, 1, 'Current component must control its side-bar entry');
  ready[0](); assert.equal(entry.hidden, true);
  assert.match(fs.readFileSync(path.join(root, 'assets/css/demo-switch.css'), 'utf8'), /#demo-tools-entry\[hidden\]\s*\{\s*display\s*:\s*none\s*!important/, 'Explicit hiding must override the side-bar flex layout');
  x.d.demoSwitchEnabled = true; ready[0](); assert.equal(entry.hidden, false);
});

test('Repeated synchronous enter during login is rejected by the switch lock', () => {
  const x = setup(), submit = x.ctx.AppState.submitLogin;
  let nested = null;
  x.ctx.AppState.submitLogin = () => { nested = x.ctx.DemoSwitch.enter(ids[4]); return submit(); };
  unchangedData(x, () => assert.equal(x.ctx.DemoSwitch.enter(ids[1]), true));
  assert.equal(nested, false); assert.equal(x.ctx.AppState.get().accountId, ids[1]);
  x.ctx.AppState.submitLogin = submit;
  assert.equal(x.ctx.DemoSwitch.enter(ids[0]), true, 'Lock must clear after successful login');
});

(async () => {
  let failed = 0;
  for (const { name, run } of tests) {
    try { await run(); console.log('PASS ' + name); }
    catch (error) { failed++; console.error('FAIL ' + name + '\n' + error.stack); }
  }
  console.log(`Demo account VM regression: ${tests.length - failed}/${tests.length} passed; no browser or real login claim.`);
  if (failed) process.exitCode = 1;
})();
