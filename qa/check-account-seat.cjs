/** SRC-048 account/seat regression. Local VM tests, not real CCC evidence. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');
const { setup, root } = require('./fixtures/prototype-vm.cjs');
const KEY = 'account-seat-v1', TEN = 'TEN-NISSAN-HQ', INSTANCE = 'CCC-NISSAN';
const results = [];
function fixture(profile = 'admin', domain = 'CLOUD_CONTACT_CENTER') {
  const f = setup(profile, domain);
  if (!f.ctx.AccountSeat) vm.runInContext(fs.readFileSync(root + '/js/components/account-seat.js', 'utf8'), f.ctx, { filename: 'account-seat.js' });
  return f;
}
function target(f, id = 'QA-SEAT-ACCOUNT', tenantId = TEN) {
  const account = { accountId: id, name: '测试运营', nickname: '测试运营', loginUsername: 'qa-seat-user', loginMobile: '13911112222', email: 'qa@example.test', status: '启用', builtIn: false };
  f.d.accounts.push(account);
  f.d.memberships.push({ membershipId: 'M-' + id, accountId: id, tenantId, roleCode: 'OPERATOR', status: '启用' });
  return account;
}
const input = (tenantId = TEN, loginName = 'qa-seat-new') => ({ tenantId, userName: '测试坐席', mobile: '13911112222', loginName, email: 'qa@example.test' });
function stored(f) { return JSON.parse(f.local.get(KEY)); }
function reload(f) {
  // Seed storage before the unchanged index script order runs, rather than
  // calling restore only after fixture generators have already finished.
  const filename = path.join(__dirname, 'fixtures/prototype-vm.cjs');
  const original = fs.readFileSync(filename, 'utf8');
  assert(original.includes('local = new Map()'));
  const source = original.replace('local = new Map()', 'local = new Map(' + JSON.stringify([...f.local]) + ')');
  const loaded = { exports: {} };
  new Function('require', 'module', '__dirname', source)(createRequire(filename), loaded, path.dirname(filename));
  return loaded.exports.setup('admin');
}
async function check(name, run) { await run(); results.push(name); console.log('PASS ' + name); }
(async () => {
  await check('account list only exposes seat columns/actions in cloud domain', () => {
    const f = fixture(); target(f); const html = f.ctx.Pages['account-tenant'].render({ view: 'accounts' });
    assert.match(html, /关联坐席/); assert.match(html, /坐席开通/); assert.match(html, /openAccountSeat/);
    const ai = fixture('admin', 'AI_OUTBOUND'); const old = ai.ctx.Pages['account-tenant'].render({ view: 'accounts' });
    assert.doesNotMatch(old, /openAccountSeat|<th[^>]*>坐席开通/);
  });
  await check('cloud 11-column table has explicit widths, contained horizontal scroll and opaque sticky actions', () => {
    const f = fixture(), html = f.ctx.Pages['account-tenant'].render({ view: 'accounts' });
    assert.match(html, /class="table-card cloud-account-table"/); assert.match(html, /cloud-account-page/);
    const head = html.match(/<thead>([\s\S]*?)<\/thead>/)[1];
    const widths = [...head.matchAll(/style="width:(\d+)px"/g)].map(x => Number(x[1]));
    assert.equal(widths.length, 11); assert.equal(widths.reduce((sum, value) => sum + value, 0), 1540); assert.equal(widths.at(-1), 230);
    const css = fs.readFileSync(root + '/assets/css/account-seat.css', 'utf8');
    assert.match(css, /\.cloud-account-table > \.table-scroll\s*\{[^}]*overflow-x:auto/);
    assert.match(css, /\.cloud-account-table \.platform-table\s*\{[^}]*min-width:1540px[^}]*table-layout:fixed/);
    assert.match(css, /\.cloud-account-table \.platform-table \.action-column\s*\{[^}]*position:sticky[^}]*width:230px[^}]*background:#fff/);
    const ai = fixture('admin', 'AI_OUTBOUND').ctx.Pages['account-tenant'].render({ view: 'accounts' });
    assert.doesNotMatch(ai, /cloud-account-table|cloud-account-page|cloud-account-col-/);
    assert.equal((ai.match(/<thead>([\s\S]*?)<\/thead>/)[1].match(/<th\b/g) || []).length, 9);
  });
  await check('only same-tenant, same-instance, unused and non-busy seats are selectable', () => {
    const f = fixture(), a = target(f); const rows = f.ctx.AccountSeat.candidates(a.accountId, TEN, INSTANCE);
    assert(rows.length > 0); assert(rows.every(r => r.tenantId === TEN && r.instanceId === INSTANCE && !r.accountId && !r.currentCall && !r.currentEndpoint && !['通话中', '话后处理'].includes(r.agentStatus)));
    assert(!rows.some(r => r.contactCenterIdentityId === 'CCI-N-002'));
    assert.equal(f.ctx.AccountSeat.candidates('ACC-OPS-CHEN', TEN, INSTANCE).length, 0);
  });
  await check('associate existing persists once; no platform account or global reverse link is created', async () => {
    const f = fixture(), a = target(f), count = f.d.accounts.length;
    const seat = f.ctx.AccountSeat.candidates(a.accountId, TEN, INSTANCE)[0];
    const r = await f.ctx.AccountSeat.bind(seat.contactCenterIdentityId, a.accountId);
    assert.equal(r.ok, true, r.message); assert.equal(seat.accountId, a.accountId); assert.equal(f.d.accounts.length, count); assert(!a.linkedIdentityId);
    assert.equal(stored(f).seats.length, 1); f.ctx.AccountSeat.restore(); f.ctx.AccountSeat.restore();
    assert.equal(f.d.agents.filter(x => x.contactCenterIdentityId === seat.contactCenterIdentityId).length, 1);
    const reload = fixture(); target(reload); reload.local.set(KEY, f.local.get(KEY)); reload.ctx.AccountSeat.restore();
    assert.equal(reload.ctx.AccountSeat.forAccount(a.accountId, TEN, INSTANCE).contactCenterIdentityId, seat.contactCenterIdentityId);
  });
  await check('creation reuses agent factory, starts with no skills, is durable and idempotent', async () => {
    const f = fixture(), a = target(f), count = f.d.accounts.length, before = f.d.agents.length;
    const r = await f.ctx.AccountSeat.create(input(), { accountId: a.accountId, requestId: 'QA-CREATE-1' });
    assert.equal(r.ok, true, r.message); assert.equal(f.d.agents.length, before + 1); assert.equal(f.d.accounts.length, count);
    assert.equal(r.agent.accountId, a.accountId); assert.equal(r.agent.syncStatus, '同步成功'); assert.equal(r.agent.evidenceType, 'DEMO'); assert.equal(r.agent.realVerification, '未验证');
    assert.equal(f.d.agentSkills.filter(x => x.identityId === r.agent.contactCenterIdentityId).length, 0);
    const again = await f.ctx.AccountSeat.create(input(), { accountId: a.accountId, requestId: 'QA-CREATE-1' });
    assert.equal(again.ok, true); assert.equal(again.agent.contactCenterIdentityId, r.agent.contactCenterIdentityId); assert.equal(f.d.agents.length, before + 1);
    const reload = fixture(); target(reload); reload.local.set(KEY, f.local.get(KEY)); reload.ctx.AccountSeat.restore();
    const restored = reload.ctx.AccountSeat.forAccount(a.accountId, TEN, INSTANCE); assert(restored); assert.equal(restored.agentStatus, '离线');
    const stolen = await f.ctx.AccountSeat.create(input(), { accountId: 'ACC-ADMIN-018', requestId: 'QA-CREATE-1' });
    assert.equal(stolen.ok, false); assert.equal(stored(f).attempts.find(x => x.id === 'QA-CREATE-1').accountId, a.accountId);
  });
  await check('invalid new-seat form records reason and manual retry creates only one seat', async () => {
    const f = fixture(), a = target(f), before = f.d.agents.length;
    let r = await f.ctx.AccountSeat.create({ ...input(), email: '' }, { accountId: a.accountId, requestId: 'QA-FAIL-1' });
    assert.equal(r.ok, false); assert.match(r.message, /邮箱/); assert.equal(f.d.agents.length, before);
    assert.equal(f.ctx.AccountSeat.attempts(a.accountId, TEN, INSTANCE)[0].status, '失败');
    f.ctx.AccountSeat.open(a.accountId, TEN, INSTANCE); assert.match(f.layers.get('account-seat'), /加载并重试/);
    f.ctx.AccountSeat.retry('QA-FAIL-1'); assert.match(f.layers.get('account-seat'), /已加载上次资料/);
    r = await f.ctx.AccountSeat.create(input(), { accountId: a.accountId, requestId: 'QA-FAIL-1' });
    assert.equal(r.ok, true, r.message); assert.equal(f.d.agents.length, before + 1); assert.equal(stored(f).attempts.filter(x => x.id === 'QA-FAIL-1').length, 1);
    assert(stored(f).attempts.find(x => x.id === 'QA-FAIL-1').history.some(event => event.status === '失败' && event.message.includes('邮箱')));
  });
  await check('permissions: operator, inactive member/account/tenant, wrong tenant/instance and AI are rejected', async () => {
    const f = fixture('operator-hq'); const a = target(f); let r = await f.ctx.AccountSeat.create(input(), { accountId: a.accountId }); assert.equal(r.ok, false);
    const ai = fixture('admin', 'AI_OUTBOUND'); const b = target(ai); assert.equal((await ai.ctx.AccountSeat.create(input(), { accountId: b.accountId })).ok, false);
    const g = fixture(), c = target(g); const member = g.d.memberships.find(m => m.accountId === c.accountId);
    member.status = '停用'; assert.equal((await g.ctx.AccountSeat.create(input(), { accountId: c.accountId })).ok, false); member.status = '启用';
    c.status = '停用'; assert.equal((await g.ctx.AccountSeat.create(input(), { accountId: c.accountId })).ok, false); c.status = '启用';
    g.d.tenants.find(t => t.tenantId === TEN).status = '停用'; assert.equal((await g.ctx.AccountSeat.create(input(), { accountId: c.accountId })).ok, false);
    const h = fixture(); target(h, 'QA-SH', 'TEN-NISSAN-SH'); assert.equal((await h.ctx.AccountSeat.create(input('TEN-NISSAN-SH'), { accountId: 'QA-SH' })).ok, false);
    const sup = fixture('super'); target(sup, 'QA-EPI', 'TEN-EPI-HQ'); assert.equal((await sup.ctx.AccountSeat.create(input('TEN-EPI-HQ'), { accountId: 'QA-EPI' })).ok, false);
  });
  await check('one account/seat per tenant and submit-time occupancy are enforced', async () => {
    const f = fixture(), a = target(f), b = target(f, 'QA-OTHER');
    const candidates = f.ctx.AccountSeat.candidates(a.accountId, TEN, INSTANCE), seat = candidates[0], other = candidates[1];
    assert.equal((await f.ctx.AccountSeat.bind(seat.contactCenterIdentityId, a.accountId)).ok, true);
    assert.equal((await f.ctx.AccountSeat.bind(seat.contactCenterIdentityId, b.accountId)).ok, false);
    assert.equal((await f.ctx.AccountSeat.bind(other.contactCenterIdentityId, a.accountId)).ok, false);
    assert.equal((await f.ctx.AccountSeat.create(input(), { accountId: a.accountId })).ok, false);
    assert.equal((await f.ctx.AccountSeat.bind('CCI-N-002', b.accountId)).ok, false);
    assert.equal((await f.ctx.AccountSeat.bind('CCI-SH-003', b.accountId)).ok, false);
    assert.equal((await f.ctx.AccountSeat.bind(seat.contactCenterIdentityId, b.accountId, { replaceAccount: true })).ok, true);
    assert.equal(f.ctx.AccountSeat.forAccount(a.accountId, TEN, INSTANCE), null);
    assert.equal((await f.ctx.AccountSeat.bind(seat.contactCenterIdentityId, '')).ok, true); assert.equal(seat.accountId, '');
  });
  await check('rechecks changed membership and cross-window seat lock before any mutation', async () => {
    const f = fixture(), a = target(f), seat = f.ctx.AccountSeat.candidates(a.accountId, TEN, INSTANCE)[0];
    f.ctx.navigator.locks.request = async (name, options, cb) => {
      if (name === 'account-seat-maintenance-v1') f.d.memberships.find(m => m.accountId === a.accountId).status = '停用';
      return cb({ name });
    };
    assert.equal((await f.ctx.AccountSeat.bind(seat.contactCenterIdentityId, a.accountId)).ok, false); assert.equal(seat.accountId, '');
    const g = fixture(), b = target(g), candidate = g.ctx.AccountSeat.candidates(b.accountId, TEN, INSTANCE)[0];
    g.ctx.navigator.locks.request = async (name, options, cb) => cb(name.startsWith('unified-call-seat:') ? null : { name });
    assert.equal((await g.ctx.AccountSeat.bind(candidate.contactCenterIdentityId, b.accountId)).ok, false); assert.equal(candidate.accountId, '');
  });
  await check('idle-online, busy and unknown-status seats must go offline before association', async () => {
    for (const status of ['空闲', '忙碌', '上线', '在线', '通话中', '话后处理', '振铃中', '呼叫中', '未知']) {
      const f = fixture(), a = target(f), seat = f.ctx.AccountSeat.candidates(a.accountId, TEN, INSTANCE)[0];
      seat.agentStatus = status; seat.currentCall = false; seat.currentEndpoint = '';
      assert.equal(f.ctx.AccountSeat.inUse(seat), true);
      assert(!f.ctx.AccountSeat.candidates(a.accountId, TEN, INSTANCE).includes(seat));
      assert.equal((await f.ctx.AccountSeat.bind(seat.contactCenterIdentityId, a.accountId)).ok, false, status);
      assert.equal(seat.accountId, '');
    }
  });
  await check('double-click does not double-create and context changes do not commit', async () => {
    const f = fixture(), a = target(f), before = f.d.agents.length; let release;
    f.ctx.navigator.locks.request = (name, options, cb) => new Promise(resolve => { release = () => resolve(cb({ name })); });
    const first = f.ctx.AccountSeat.create(input(), { accountId: a.accountId, requestId: 'QA-PENDING' });
    assert.equal((await f.ctx.AccountSeat.create(input(), { accountId: a.accountId, requestId: 'QA-PENDING' })).ok, false);
    release(); assert.equal((await first).ok, true); assert.equal(f.d.agents.length, before + 1);
    const g = fixture(), b = target(g), n = g.d.agents.length;
    g.ctx.navigator.locks.request = async (name, options, cb) => { g.d.memberships.find(m => m.accountId === b.accountId).status = '停用'; return cb({ name }); };
    assert.equal((await g.ctx.AccountSeat.create(input(), { accountId: b.accountId })).ok, false); assert.equal(g.d.agents.length, n);
  });
  await check('storage failures and malformed legacy storage preserve old data and do not fake success', async () => {
    const f = fixture(), a = target(f), before = f.d.agents.length;
    const original = f.ctx.localStorage.setItem;
    f.ctx.localStorage.setItem = (key, value) => { if (key === KEY) throw Error('storage full'); original(key, value); };
    assert.equal((await f.ctx.AccountSeat.create(input(), { accountId: a.accountId })).ok, false); assert.equal(f.d.agents.length, before);
    const seat = f.ctx.AccountSeat.candidates(a.accountId, TEN, INSTANCE)[0]; assert.equal((await f.ctx.AccountSeat.bind(seat.contactCenterIdentityId, a.accountId)).ok, false); assert.equal(seat.accountId, '');
    f.ctx.localStorage.setItem = original; f.local.set(KEY, '{broken');
    assert.equal((await f.ctx.AccountSeat.create(input(), { accountId: a.accountId })).ok, false); assert.equal(f.local.get(KEY), '{broken'); assert.equal(f.d.agents.length, before);
  });
  await check('skills target the new seat and persist; deleted seats do not revive on reload', async () => {
    const f = fixture(), a = target(f); const r = await f.ctx.AccountSeat.create(input(), { accountId: a.accountId }); assert(r.ok);
    f.ctx.AccountSeat.configureSkills(r.agent.contactCenterIdentityId); assert.match(f.layers.get('skill-assign'), new RegExp(r.agent.contactCenterIdentityId + '" selected'));
    const group = f.d.physicalSkillGroups.find(g => g.tenantId === TEN && g.instanceId === INSTANCE && g.status === '已启用'); assert(group);
    f.field('assignAgent', r.agent.contactCenterIdentityId); f.field('assignGroup', group.physicalGroupId); f.field('assignLevel', '4'); f.ctx.Pages['agent-center'].saveSkill();
    assert.equal(f.d.agentSkills.find(s => s.identityId === r.agent.contactCenterIdentityId).skillLevel, 4);
    const reload = fixture(); target(reload); reload.local.set(KEY, f.local.get(KEY)); reload.ctx.AccountSeat.restore();
    assert.equal(reload.d.agentSkills.find(s => s.identityId === r.agent.contactCenterIdentityId).skillLevel, 4);
    let confirmation; f.ctx.PlatformUI.confirm = details => { confirmation = details; }; f.ctx.Pages['agent-center'].remove(r.agent.contactCenterIdentityId); confirmation.onConfirm();
    assert.equal(r.agent.lifecycleStatus, '已删除'); assert.equal(f.ctx.AccountSeat.forAccount(a.accountId, TEN, INSTANCE), null);
    const after = fixture(); target(after); after.local.set(KEY, f.local.get(KEY)); after.ctx.AccountSeat.restore();
    assert.equal(after.d.agents.find(s => s.contactCenterIdentityId === r.agent.contactCenterIdentityId).lifecycleStatus, '已删除');
    assert.equal(after.d.agentSkills.filter(s => s.identityId === r.agent.contactCenterIdentityId).length, 0);
  });
  await check('legacy single-seat create uses shared factory and success continues to skill setup', async () => {
    const f = fixture(), n = f.d.agents.length;
    f.ctx.Pages['agent-center'].openSingle();
    for (const [id, value] of Object.entries({ newAgentTenant: TEN, newAgentName: '独立坐席', newAgentMobile: '13911112222', newAgentLogin: 'qa-standalone', newAgentEmail: 'qa@example.test' })) f.field(id, value);
    await f.ctx.Pages['agent-center'].createSingle(); assert.equal(f.d.agents.length, n + 1); assert(f.layers.has('skill-assign'));
    assert.equal(stored(f).seats.at(-1).accountId, '');
  });
  await check('lifecycle and skill saving failure leaves current in-memory state unchanged', async () => {
    const f = fixture(), a = target(f), r = await f.ctx.AccountSeat.create(input(), { accountId: a.accountId }); assert(r.ok);
    const oldSeat = JSON.stringify(r.agent), oldSkills = JSON.stringify(f.d.agentSkills), oldStorage = f.local.get(KEY);
    f.ctx.localStorage.setItem = (key, value) => { if (key === KEY) throw Error('storage full'); };
    f.ctx.Pages['agent-center'].disable(r.agent.contactCenterIdentityId, true);
    assert.equal(JSON.stringify(r.agent), oldSeat); assert.equal(f.local.get(KEY), oldStorage);
    let confirmation; f.ctx.PlatformUI.confirm = value => { confirmation = value; }; f.ctx.Pages['agent-center'].remove(r.agent.contactCenterIdentityId); confirmation.onConfirm();
    assert.equal(JSON.stringify(r.agent), oldSeat); assert.equal(JSON.stringify(f.d.agentSkills), oldSkills);
    f.ctx.AccountSeat.configureSkills(r.agent.contactCenterIdentityId);
    const group = f.d.physicalSkillGroups.find(g => g.tenantId === TEN && g.instanceId === INSTANCE && g.status === '已启用');
    f.field('assignAgent', r.agent.contactCenterIdentityId); f.field('assignGroup', group.physicalGroupId); f.field('assignLevel', '4'); f.ctx.Pages['agent-center'].saveSkill();
    assert.equal(JSON.stringify(f.d.agentSkills), oldSkills); assert.equal(f.local.get(KEY), oldStorage);
    r.agent.lifecycleStatus = '已停用'; const beforeRestore = JSON.stringify(r.agent); f.ctx.Pages['agent-center'].restore(r.agent.contactCenterIdentityId);
    assert.equal(JSON.stringify(r.agent), beforeRestore);
  });
  await check('another window binding change is loaded before the old account can call', async () => {
    const first = fixture(), a = target(first), seat = first.ctx.AccountSeat.candidates(a.accountId, TEN, INSTANCE)[0];
    assert.equal((await first.ctx.AccountSeat.bind(seat.contactCenterIdentityId, a.accountId)).ok, true);
    const second = fixture(); target(second); second.local.set(KEY, first.local.get(KEY)); second.ctx.AccountSeat.restore();
    const other = target(first, 'QA-REPLACEMENT'); target(second, 'QA-REPLACEMENT');
    assert.equal((await first.ctx.AccountSeat.bind(seat.contactCenterIdentityId, other.accountId, { replaceAccount: true })).ok, true);
    second.local.set(KEY, first.local.get(KEY)); second.ctx.dispatchEvent({ type: 'storage', key: KEY, newValue: first.local.get(KEY) });
    assert.equal(second.ctx.AccountSeat.forAccount(a.accountId, TEN, INSTANCE), null);
    assert.equal(second.ctx.AccountSeat.forAccount(other.accountId, TEN, INSTANCE).contactCenterIdentityId, seat.contactCenterIdentityId);
  });
  await check('finishing an already-owned disabled call persists only the terminal disabled state', () => {
    const f = fixture('operator-chen'), agent = f.ctx.AgentWorkbench.myAgent();
    const call = { accountId: agent.accountId, contactCenterIdentityId: agent.contactCenterIdentityId, tenantId: agent.tenantId, instanceId: agent.instanceId, endedAt: '2026-09-10 15:00:00' };
    agent.lifecycleStatus = '已停用'; agent.currentCall = false; agent.agentStatus = '话后处理';
    assert.equal(f.ctx.AccountSeat.finishPendingDisable(agent, call), true);
    assert.equal(stored(f).seats[0].lifecycleStatus, '已停用'); assert.equal(stored(f).seats[0].acceptNewTasks, false);
    assert.equal(f.ctx.AccountSeat.finishPendingDisable(agent, { ...call, accountId: 'ACC-ADMIN-018' }), false);
    agent.lifecycleStatus = '已启用'; assert.equal(f.ctx.AccountSeat.finishPendingDisable(agent, call), false);
  });
  await check('real script-order reload cannot reintroduce deleted demo seat skills or duplicate bindings', async () => {
    const f = fixture(), a = target(f), identity = 'VIEW-DEMO-HQ-SEAT-3';
    assert.equal((await f.ctx.AccountSeat.bind(identity, a.accountId)).ok, true);
    let confirmation; f.ctx.PlatformUI.confirm = details => { confirmation = details; }; f.ctx.Pages['agent-center'].remove(identity); confirmation.onConfirm();
    const fresh = reload(f); target(fresh);
    assert.equal(fresh.d.agents.filter(s => s.contactCenterIdentityId === identity).length, 1);
    assert.equal(fresh.d.agents.find(s => s.contactCenterIdentityId === identity).lifecycleStatus, '已删除');
    assert.equal(fresh.d.agentSkills.filter(s => s.identityId === identity).length, 0);
    assert.equal(fresh.ctx.AccountSeat.forAccount(a.accountId, TEN, INSTANCE), null);
  });
  console.log(JSON.stringify({ passed: results.length, evidence: 'Local VM regression only; no real Aliyun call or browser acceptance.' }));
})().catch(error => { console.error(error); process.exitCode = 1; });
