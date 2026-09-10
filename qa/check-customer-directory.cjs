/** Actual prototype scripts in an isolated VM. No real calls or browser storage touched. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { setup, root } = require('./fixtures/prototype-vm.cjs');
const batchKey = 'customer-task-batches-v1', directoryKey = 'customer-directory-v1', nativeKey = 'native-workbench-records-v1';
const tenantId = 'TEN-NISSAN-HQ', instanceId = 'CCC-NISSAN', ownerId = 'ACC-OPS-108';
let count = 0;
function check(name, fn) { fn(); count++; console.log('PASS', name); }
function fixture(profile = 'admin') {
  const env = setup(profile);
  if (!env.ctx.CustomerDirectory) vm.runInContext(fs.readFileSync(path.join(root, 'js/components/customer-directory.js'), 'utf8'), env.ctx);
  if (!env.ctx.Pages['customer-directory']) vm.runInContext(fs.readFileSync(path.join(root, 'js/pages/customer-directory.js'), 'utf8'), env.ctx);
  env.local.clear(); env.d.calls.splice(0); return env;
}
function row(id, phone, extra = {}) { return { id, name: id, phone, note: '', ownerId, method: '人工外呼', followup: '待联系', calls: [], history: [], ...extra }; }
function batch(id, rows, extra = {}) { return { id, name: id, tenantId, instanceId, createdAt: '2026-09-10 10:00:00', rows, errors: [], ...extra }; }
function call(id, extra = {}) { return { callId: id, tenantId, instanceId, accountId: ownerId, callType: '人工外呼', direction: '呼出', callee: '13800000991', caller: '02100000001', endedAt: '2026-09-10 10:05:00', durationSeconds: 45, result: '接通', callSource: 'NATIVE_WORKBENCH', simulation: true, agentDisposition: '需要再次联系', customerName: '客户甲', ...extra }; }
const a = fixture(), api = a.ctx.CustomerDirectory;
const oldBatches = [
  batch('QA-BATCH-A', [row('QA-ROW-A', '+86 138-0000-0991', { calls: [{ callId: 'QA-DUP', at: '2026-09-10 09:00:00', result: '接通', remark: '旧备注' }, { callId: 'QA-OLD', at: '2026-09-09 09:00:00', result: '未接通' }] }), row('QA-SAME-BATCH', '13800000991')], { simulation: true }),
  batch('QA-BATCH-B', [row('QA-ROW-B', '008613800000991', { calls: [{ callId: 'QA-DUP', at: '2026-09-10 09:00:00', result: '接通' }] })]),
  batch('QA-OTHER-TENANT', [row('QA-OTHER-ROW', '13800000991')], { tenantId: 'TEN-NISSAN-SH' }),
  batch('QA-OTHER-BRAND', [row('QA-OTHER-BRAND-ROW', '13800000991')], { tenantId: 'TEN-EPI-HQ', instanceId: 'CCC-EPI' })
];
a.local.set(batchKey, JSON.stringify(oldBatches));
check('号码标准化：全角/区号/分隔符；遮挡号码不猜测', () => {
  assert.equal(api.normalizePhone('＋８６ １３８－００００－０９９１'), '13800000991');
  assert.equal(api.normalizePhone('0086 (021) 1234-5678'), '02112345678');
  assert.equal(api.normalizePhone('138****6621'), '');
});
check('同批及跨批同号归一档案，原批次行 ID/归属/内容不改', () => {
  const original = a.local.get(batchKey), customers = api.list();
  assert.equal(customers.length, 1); assert.equal(customers[0].batchCount, 2); assert.equal(customers[0].batches.length, 3);
  assert.equal(customers[0].callCount, 2); assert.equal(a.local.get(batchKey), original);
});
check('历史模拟保留；缺失时长未记录，不臆造录音', () => {
  const historic = api.calls().find(c => c.callId === 'QA-OLD');
  assert.equal(api.duration(historic), '未记录'); assert.equal(historic.durationSeconds, null);
  assert.equal(api.provenance(historic), '历史模拟记录');
  a.ctx.Pages['cloud-call-records'].openCall(historic.callId);
  const html = a.layers.get('cloud-call-detail'); assert.match(html, /历史联系记录未包含录音/); assert.doesNotMatch(html, /播放录音|下载录音/);
});
a.local.set(nativeKey, JSON.stringify([call('QA-DUP', { customerTaskItemId: 'QA-ROW-A', durationSeconds: 52, dispositionRemark: '完整记录备注' }), call('QA-TEMP', { callee: '13800000992', customerName: '临时客户', customerTaskItemId: '' })]));
check('native 与批次重复 callId 只计一次，完整结果补齐历史快照', () => {
  api.sync(); const merged = api.calls().filter(c => c.callId === 'QA-DUP'); assert.equal(merged.length, 1);
  assert.equal(merged[0].durationSeconds, 52); assert.equal(merged[0].dispositionRemark, '完整记录备注'); assert.equal(merged[0].directoryMeta.legacyOnly, false);
  assert.equal(api.list().find(c => c.phone === '13800000991').callCount, 2);
  assert.equal(api.list().find(c => c.phone === '13800000992').batchCount, 0);
});
check('重复归集幂等，不重复追加通话；刷新读同一归集数据', () => {
  api.sync(); const saved = a.local.get(directoryKey); api.sync(); assert.equal(a.local.get(directoryKey), saved);
  const reload = fixture(); for (const [key, value] of a.local) reload.local.set(key, value);
  assert.equal(reload.ctx.CustomerDirectory.list().find(c => c.phone === '13800000991').callCount, 2);
  assert.equal(reload.ctx.CustomerDirectory.list().find(c => c.phone === '13800000992').callCount, 1);
});
check('另一个窗口的新结果不会被当前窗口旧内存或旧 native 快照覆盖', () => {
  const record = JSON.parse(a.local.get(directoryKey));
  record.calls.find(c => c.callId === 'QA-DUP').dispositionRemark = '其他窗口的新备注';
  a.local.set(directoryKey, JSON.stringify(record)); api.sync();
  assert.equal(a.d.calls.find(c => c.callId === 'QA-DUP').dispositionRemark, '其他窗口的新备注');
  const native = JSON.parse(a.local.get(nativeKey)); native.find(c => c.callId === 'QA-DUP').dispositionRemark = '完整记录备注'; native.find(c => c.callId === 'QA-DUP').dispositionAt = '2026-09-10 11:00:00';
  a.local.set(nativeKey, JSON.stringify(native)); api.sync();
  assert.equal(a.d.calls.find(c => c.callId === 'QA-DUP').dispositionRemark, '完整记录备注');
});
check('超级管理员仅当前实例，同号不同租户独立档案', () => {
  const superEnv = fixture('super'); for (const [key, value] of a.local) superEnv.local.set(key, value);
  const customers = superEnv.ctx.CustomerDirectory.list().filter(c => c.phone === '13800000991');
  assert.equal(customers.length, 2); assert.notEqual(customers[0].id, customers[1].id); assert(!customers.some(c => c.instanceId === 'CCC-EPI'));
});
const o = fixture('operator-hq');
for (const [key, value] of a.local) o.local.set(key, value);
const ownerBatches = JSON.parse(o.local.get(batchKey));
ownerBatches.push(batch('QA-SECRET', [row('QA-SECRET-ROW', '13800000991', { ownerId: 'ACC-OPS-OTHER', name: '不可见称呼', note: '不可见备注', calls: [{ callId: 'QA-SECRET-CALL', result: '接通', at: '2026-09-10 11:00:00' }] })]));
o.local.set(batchKey, JSON.stringify(ownerBatches));
check('普通运营档案不泄露同号其他人批次/称呼/备注/通话', () => {
  const customer = o.ctx.CustomerDirectory.list().find(c => c.phone === '13800000991');
  assert.equal(customer.batchCount, 2); assert.equal(customer.callCount, 2);
  assert(!JSON.stringify(customer).includes('不可见')); assert(!customer.calls.some(c => c.callId === 'QA-SECRET-CALL'));
});
check('全局通话记录原有租户阅读权限不收紧，档案和记录权限分别校验', () => {
  assert(o.ctx.CustomerDirectory.calls().some(c => c.callId === 'QA-SECRET-CALL'));
  assert(o.ctx.Pages['cloud-call-records'].render().includes('QA-SECRET-CALL'));
  const mine = o.ctx.CustomerDirectory.list().find(c => c.phone === '13800000991'); o.ctx.Pages['customer-directory'].openDetail(mine.id);
  o.ctx.Pages['customer-directory'].openCall('QA-SECRET-CALL'); assert(!o.layers.has('cloud-call-detail'));
});
check('客户档案详情复用通话详情、批次跳转及筛选分页骨架', () => {
  const customer = api.list().find(c => c.phone === '13800000991'); assert.equal(api.open(customer.phone, tenantId, instanceId), true);
  assert.match(a.layers.get('customer-directory-detail'), /导入与分配记录|联系历史/);
  a.ctx.Pages['customer-directory'].openCall('QA-DUP'); assert.match(a.layers.get('cloud-call-detail'), /完整记录备注/);
  a.ctx.Pages['customer-directory'].openBatch('QA-BATCH-A'); assert.equal(a.events.at(-1).key, 'customer-tasks'); assert.equal(a.events.at(-1).options.batchId, 'QA-BATCH-A');
  assert.match(a.ctx.Pages['customer-directory'].render(), /directory-keyword/); assert.match(a.ctx.Pages['customer-directory'].render(), /list-pagination/);
});
check('同 callId 不同租户冲突不合并到错误客户，冲突源单独保留', () => {
  a.d.calls.push(call('QA-DUP', { tenantId: 'TEN-NISSAN-SH', callee: '13800000993' })); api.sync();
  assert.equal(a.d.calls.filter(c => c.callId === 'QA-DUP').length, 1); assert.equal(a.d.calls.find(c => c.callId === 'QA-DUP').tenantId, tenantId);
  assert(JSON.parse(a.local.get(directoryKey)).unmerged.some(c => c.tenantId === 'TEN-NISSAN-SH'));
});
check('归集存储失败明示，不删除原批次/native；损坏索引不覆盖', () => {
  const rawBatch = a.local.get(batchKey), rawNative = a.local.get(nativeKey), set = a.ctx.localStorage.setItem;
  a.ctx.localStorage.setItem = (key, value) => { if (key === directoryKey) throw Error('quota'); return set(key, value); };
  a.d.calls.push(call('QA-NOSAVE')); api.sync(); assert.match(api.status().storageIssue, /暂未保存/);
  assert.equal(a.local.get(batchKey), rawBatch); assert.equal(a.local.get(nativeKey), rawNative);
  a.ctx.localStorage.setItem = set; a.local.set(directoryKey, '{broken'); api.sync(); assert.equal(a.local.get(directoryKey), '{broken'); assert.match(api.status().storageIssue, /无法读取/);
});
async function manualFlow() {
  const e = fixture('operator-hq'), w = e.ctx.AgentWorkbench;
  e.local.set(batchKey, JSON.stringify([batch('QA-DIAL-BATCH', [row('QA-DIAL-ROW', '13800000881', { name: '待联系新客户' })])]));
  const seat = e.d.agents.find(s => s.contactCenterIdentityId === 'CCI-N-001'); seat.accountId = ownerId;
  const seatHtml = w.render(); assert.match(seatHtml, /id="seat-temporary"/); assert.doesNotMatch(seatHtml, /id="seat-dial"/);
  w.openTemporary(); const dialog = () => e.layers.get('assigned-call-dialog') || ''; assert.match(dialog(), /id="seat-online"/); assert.doesNotMatch(dialog(), /id="seat-dial"/);
  w.updateField('skillGroupId', 'SG-ALI-HQ-SALES');
  const customer = e.ctx.CustomerDirectory.list().find(c => c.phone === '13800000881');
  w.chooseContact(customer.id); assert.match(dialog(), /待联系新客户/); assert.doesNotMatch(dialog(), /选择演示客户/);
  e.click(dialog(), '上线，准备呼叫'); await Promise.resolve(); assert.match(dialog(), /id="seat-dial"/); assert.doesNotMatch(dialog(), /id="seat-online"/);
  assert.equal(w.dial(), true); w.end('接通'); w.setDisposition('已完成沟通'); w.setRemark('临时拨号完成'); w.saveDisposition();
  const result = e.ctx.CustomerDirectory.list().find(c => c.phone === '13800000881');
  assert.equal(result.callCount, 1); assert.equal(result.calls[0].customerTaskItemId, ''); assert.equal(JSON.parse(e.local.get(batchKey))[0].rows[0].calls.length, 0);
  assert.equal(JSON.parse(e.local.get(batchKey))[0].rows[0].followup, '待联系');
  w.openTemporary(); w.chooseContact(''); w.updateField('customerName', '全新临时客户'); w.updateField('phone', '13800000882');
  assert.equal(w.dial(), true); w.end('接通'); w.setDisposition('需要再次联系'); w.setRemark('模拟约定次日再次联系'); w.saveDisposition();
  const temporary = e.ctx.CustomerDirectory.list().find(c => c.phone === '13800000882'); assert.equal(temporary.batchCount, 0); assert.equal(temporary.callCount, 1);
  assert.equal(temporary.calls[0].processingStatus, '已完成'); assert.equal(temporary.calls[0].agentDisposition, '需要再次联系');
  w.signOut(); count++; console.log('PASS 真实工作台代码：已有客户选择及全新临时拨号归档，批次状态不被覆盖');
  console.log(`PASS ${count} targeted customer-directory checks; VM/local simulation only, browser acceptance separate.`);
}
manualFlow().catch(error => { console.error(error); process.exitCode = 1; });
