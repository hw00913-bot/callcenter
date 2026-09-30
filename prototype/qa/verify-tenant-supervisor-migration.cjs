/** Existing tenant-admin seats keep their identity while gaining the authorized demo fixture. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.join(__dirname, '..'), checks = [];
const plain = value => JSON.parse(JSON.stringify(value));
function setup({ cno = '1004', patch = {}, extra = [], role = 'ADMIN', stored = null } = {}) {
  const seat = { agentRecordId: 'SAVED-AGENT-1004', contactCenterIdentityId: 'SAVED-IDENTITY-1004', accountId: 'ACC-ADMIN-018', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', cno, userName: '李明', lifecycleStatus: '已启用', syncStatus: '同步成功', callEnabled: true, ...patch };
  const data = {
    accounts: [{ accountId: 'ACC-ADMIN-018', name: '李明', status: '启用' }],
    memberships: ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH'].map(tenantId => ({ tenantId, accountId: 'ACC-ADMIN-018', roleCode: role, status: '启用' })),
    tenants: ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH'].map(tenantId => ({ tenantId, enterpriseId: tenantId === 'TEN-NISSAN-SH' ? '7522241' : '7522240', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] })),
    agents: [seat, ...extra.map(item => ({ ...seat, ...item }))]
  };
  const raw = stored ?? JSON.stringify({ version: 1, seats: [seat], attempts: [] });
  const writes = [], values = new Map([['account-seat-v1', raw]]);
  const ctx = { CloudCallData: data, localStorage: { getItem: key => values.get(key) ?? null, setItem: (...args) => writes.push(args), removeItem: (...args) => writes.push(args) }, console, Date, Object, Array, Map, Set };
  ctx.window = ctx; vm.createContext(ctx);
  const run = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  run('js/components/tenant-supervisor-policy.js');
  const before = JSON.stringify(seat);
  run('mock/seat-operations.js');
  return { ctx, seat, data, before, raw, writes, values, rerun: () => run('mock/seat-operations.js'), fixture: () => ctx.AliCtiSeatOperationFixtures, grant: () => ctx.AliCtiSeatOperationFixtures.supervisors.find(row => row.tenantId === 'TEN-NISSAN-HQ') };
}
function check(name, fn) { fn(); checks.push(name); }
check('总部已有工号1004沿用原绑定补班长演示回执，不新增9001', () => {
  const f = setup(), grant = f.grant();
  assert(grant); assert.equal(grant.cno, '1004'); assert.equal(grant.identityId, f.seat.contactCenterIdentityId);
  assert.equal(grant.power, 1); assert.equal(grant.confirmed, true); assert.equal(grant.mock, true);
  assert.deepEqual(plain(grant.qnos), ['6101', '6102']);
  assert(!f.data.agents.some(row => row.cno === '9001'));
  assert.equal(f.fixture().supervisors.find(row => row.tenantId === 'TEN-NISSAN-SH').cno, '9002');
});
check('原坐席资料与本地历史记录逐字保留，不写回账号绑定', () => {
  const f = setup(); assert.equal(JSON.stringify(f.seat), f.before); assert.equal(f.values.get('account-seat-v1'), f.raw); assert.equal(f.writes.length, 0);
});
check('复用现有普通坐席工号时合并供应商fixture，队列不重复', () => {
  const f = setup({ cno: '0012' });
  const seats = f.fixture().seats.filter(row => row.enterpriseId === '7522240' && row.tenantId === 'TEN-NISSAN-HQ' && row.cno === '0012');
  assert.equal(seats.length, 1); assert.equal(seats[0].power, 1); assert.equal(seats[0].identityId, f.seat.contactCenterIdentityId);
  for (const queue of f.fixture().queues.filter(row => row.tenantId === 'TEN-NISSAN-HQ')) assert.equal(queue.agentStatuses.filter(row => row.cno === '0012').length, 1);
});
check('现存前导零工号保持原字符串', () => { const f = setup({ cno: '01004' }); assert.equal(f.grant().cno, '01004'); assert(!f.fixture().supervisors.some(row => row.cno === '1004')); });
check('刷新重复安装不重复坐席或授权记录', () => { const f = setup(), seats = JSON.stringify(f.data.agents), fixture = JSON.stringify(f.fixture().supervisors); f.rerun(); assert.equal(JSON.stringify(f.data.agents), seats); assert.equal(JSON.stringify(f.fixture().supervisors), fixture); assert.equal(f.writes.length, 0); });
check('同一管理员多重绑定不自动选席或授予班长权限', () => { const f = setup({ extra: [{ agentRecordId: 'SECOND', contactCenterIdentityId: 'SECOND-ID', cno: '1005' }] }); assert(!f.grant()); });
check('相同企业工号冲突即使属于其他租户也不授予权限', () => { const f = setup({ extra: [{ agentRecordId: 'OTHER', contactCenterIdentityId: 'OTHER-ID', accountId: 'OTHER', tenantId: 'TEN-NISSAN-SH' }] }); assert(!f.grant()); });
check('坐席身份或记录标识冲突时不自动授权', () => {
  for (const patch of [{ contactCenterIdentityId: 'SAVED-IDENTITY-1004', agentRecordId: 'OTHER' }, { agentRecordId: 'SAVED-AGENT-1004', contactCenterIdentityId: 'OTHER-ID' }]) {
    const f = setup({ extra: [{ accountId: 'OTHER', tenantId: 'TEN-NISSAN-SH', cno: '1005', ...patch }] }); assert(!f.grant());
  }
});
check('停用或未同步成功以及禁用呼叫的旧坐席不自动授权', () => { for (const patch of [{ lifecycleStatus: '已停用' }, { syncStatus: '失败' }, { callEnabled: false }]) assert(!setup({ patch }).grant()); });
check('损坏旧存储不覆盖且不新建班长坐席', () => { const f = setup({ stored: '{broken' }); assert(!f.grant()); assert.equal(f.data.agents.length, 1); assert.equal(f.values.get('account-seat-v1'), '{broken'); assert.equal(f.writes.length, 0); });
check('普通运营身份不随历史绑定获得班长回执', () => { assert(!setup({ role: 'OPERATOR' }).grant()); });
check('缺身份标识或非字符串工号保留待核对', () => { for (const patch of [{ contactCenterIdentityId: '' }, { agentRecordId: '' }, { cno: 1004 }, { cno: '' }]) assert(!setup({ patch }).grant()); });
console.log(JSON.stringify({ result: 'pass', count: checks.length, checks, scope: 'local existing-seat migration fixture; no supplier calls' }, null, 2));
