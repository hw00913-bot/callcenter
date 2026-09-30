/** CF-08: supplier cno attribution across deleted/recreated configurations. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..'), checks = [];
const check = (name, fn) => { fn(); checks.push(name); };
const enterpriseId = '7522240';
let visible = ['HQ', 'STORE'], allowed = true;
const context = {
  Date, Map, Set, structuredClone, console, Pages: {},
  PlatformUI: { callTypeLabel: v => v, escape: v => String(v ?? ''), closeLayer() {} },
  AppState: {
    get: () => ({ accountId: 'USER', tenantId: 'HQ', enterpriseId, activeDomain: 'CLOUD_CONTACT_CENTER' }),
    effectiveAccess: () => ({ valid: allowed, tenantIds: visible, roleCode: 'ADMIN' }),
    canMenu: () => allowed, scoped: rows => rows.filter(row => visible.includes(row.tenantId))
  },
  CallState: { view: call => ({ known: true, ended: !!call.endedAt, answered: true,
    agentAnswered: true, answerLabel: '接通', customerEstablishedAt: call.answeredAt,
    agentEstablishedAt: call.answeredAt, endedAt: call.endedAt }) },
  CustomerTasks: { reportSnapshot: () => [] }, CustomerFollowup: { overlay() {} }
};
context.window = context;
vm.createContext(context);
for (const file of ['js/components/alicti-fields.js', 'js/components/alicti-report-facts.js', 'js/components/report-metrics.js']) {
  vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context, { filename: file });
}
const seat = (id, cno, name, extra = {}) => ({ agentRecordId: id, contactCenterIdentityId: 'I-' + id,
  tenantId: 'HQ', enterpriseId, cno, userName: name, lifecycleStatus: '已启用', ...extra });
const agents = [seat('OLD', '0012', '旧坐席姓名', { lifecycleStatus: '已删除', accountId: 'OLD-ACCOUNT' }),
  seat('NEW', '0012', '新坐席姓名', { accountId: 'NEW-ACCOUNT' }), seat('SHORT', '12', '短工号坐席'),
  seat('STORE', '0012', '门店坐席', { tenantId: 'STORE' }),
  seat('HIDDEN', '0012', '不可见坐席', { tenantId: 'HIDDEN' }),
  seat('OTHER', '0012', '其他账号坐席', { enterpriseId: '8888888' })];
const local = (id, identityId, extra = {}) => ({ callId: id, enterpriseId, tenantId: 'HQ',
  callType: '人工外呼', direction: '呼出', result: '接通', caller: '02100000001', callee: '13800000001',
  ringingAt: '2026-09-02T10:00:00', answeredAt: '2026-09-02T10:00:03', endedAt: '2026-09-02T10:00:20',
  durationSeconds: 17, contactCenterIdentityId: identityId, ...extra });
const official = (id, cno, extra = {}) => ({ ...local(id, '', extra), alictiCdr: {
  kind: extra.callType === '呼入' ? 'inbound' : 'manual', raw: { enterpriseId: Number(enterpriseId), mainUniqueId: 'P-' + id,
    cno, status: 3, startTime: 1788314400, upTime: 1788314402, bridgeTime: 1788314403,
    endTime: 1788314420, bridgeDuration: 17 } } });
const calls = [local('OLD-LOCAL', 'I-OLD', { agentName: '当时旧坐席' }), local('NEW-LOCAL', 'I-NEW', { agentName: '当时新坐席' }),
  official('SUPPLIER', '0012'), official('SHORT', '12'), official('STORE', '0012', { tenantId: 'STORE' }),
  official('HIDDEN', '0012', { tenantId: 'HIDDEN' }), official('OTHER', '0012', { enterpriseId: '8888888' }),
  official('NO-TENANT', '0012', { tenantId: '' }), official('UNKNOWN-CNO', '9999'),
  official('INBOUND', '0012', { callType: '呼入' })];
calls.push({ ...structuredClone(calls[2]), callId: 'SUPPLIER-DUPLICATE' });
context.CloudCallData = { agents, calls, tenants: ['HQ', 'STORE', 'HIDDEN'].map(tenantId => ({ tenantId, enterpriseId, name: tenantId })),
  instances: [{ enterpriseId }], tasks: [], callPlans: [],
  physicalSkillGroups: [{ physicalGroupId: 'G1', tenantId: 'HQ', enterpriseId, name: '当前技能' },
    { physicalGroupId: 'G2', tenantId: 'HQ', enterpriseId, name: '历史技能' }],
  agentSkills: [{ identityId: 'I-NEW', physicalGroupId: 'G1', status: '已生效' },
    { identityId: 'I-OLD', physicalGroupId: 'G2', status: '已生效' }] };
for (const file of ['mock/customer-followup.js', 'js/components/lead-report.js', 'js/components/report-data.js', 'js/pages/report-center.js']) {
  vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context, { filename: file });
}
const filters = { period: '自定义', startDate: '2026-09-01', endDate: '2026-09-30' };
const model = extra => context.CloudReportData.getModel('agents', { ...filters, ...extra });
const group = m => m.rows.find(row => row.name === '工号 0012（含历史）');
const snapshot = JSON.stringify({ agents, calls, agentSkills: context.CloudCallData.agentSkills });
let result = model(), row = group(result), groupId = row.id;
check('同可见租户的同工号多代实例合并为单行', () => { assert.equal(result.rows.length, 3); assert.equal(row.total, 3); });
check('供应商只含cno的通话不因新旧两条配置而落空', () => assert.ok(row.calls.some(call => call.callId === 'SUPPLIER-DUPLICATE')));
check('同主通话重复输入不重复计数', () => assert.equal(row.calls.filter(call => call.alictiCdr).length, 1));
check('合并行不使用新旧任一当前姓名或主键', () => { assert.equal(row.name, '工号 0012（含历史）'); assert.notEqual(row.id, 'OLD'); assert.notEqual(row.id, 'NEW'); });
check('本地旧通话保留原identity和当时姓名', () => { const call = row.calls.find(call => call.callId === 'OLD-LOCAL'); assert.equal(call.contactCenterIdentityId, 'I-OLD'); assert.equal(call.agentName, '当时旧坐席'); });
check('本地新通话保留原identity和当时姓名', () => { const call = row.calls.find(call => call.callId === 'NEW-LOCAL'); assert.equal(call.contactCenterIdentityId, 'I-NEW'); assert.equal(call.agentName, '当时新坐席'); });
check('供应商只有cno的通话不补造实例identity或姓名', () => { const call = row.calls.find(call => call.alictiCdr); assert.equal(call.contactCenterIdentityId, ''); assert.equal(call.agentName, undefined); });
check('前导零不同的工号不合并', () => { const short = result.rows.find(row => row.id === 'SHORT'); assert.equal(short.name, '短工号坐席'); assert.equal(short.total, 1); });
check('同工号不同已授权租户分开展示与统计', () => { const store = result.rows.find(row => row.id === 'STORE'); assert.equal(store.name, '门店坐席'); assert.equal(store.total, 1); assert.ok(row.calls.every(call => call.tenantId === 'HQ')); });
check('不可见租户和其他供应商账号不进入统计及候选', () => { const serialized = JSON.stringify(result) + JSON.stringify(context.CloudReportData.options()); assert.ok(!serialized.includes('不可见坐席')); assert.ok(!serialized.includes('其他账号坐席')); assert.ok(!result.calls.some(call => ['HIDDEN', 'OTHER'].includes(call.callId))); });
check('缺少明确tenant的供应商通话不能凭cno继承归属', () => assert.ok(!result.allCalls.some(call => call.callId === 'NO-TENANT')));
check('未知工号与呼入首呼目标继续保留未归属', () => { assert.equal(result.excludedUnassociated, 2); assert.ok(result.excludedUnassociatedCalls.some(call => call.callId === 'INBOUND')); });
check('技能数只统计仍有效实例，旧技能残留不继承', () => assert.equal(row.skills, 1));
check('选择工号汇总筛选得到完全相同的三通明细', () => { const selected = model({ agentId: groupId }); assert.equal(selected.rows.length, 1); assert.equal(selected.calls.length, 3); assert.equal(group(selected).id, groupId); });
check('旧坐席筛选状态归一到工号汇总口径', () => { const selected = model({ agentId: 'OLD' }); assert.equal(selected.rows.length, 1); assert.equal(selected.calls.length, 3); });
check('新坐席筛选状态不错误限制为新实例历史', () => assert.equal(model({ agentId: 'NEW' }).calls.length, 3));
check('前导零工号筛选不会选入短工号', () => { const selected = model({ agentId: 'SHORT' }); assert.equal(selected.calls.length, 1); assert.equal(selected.calls[0].callId, 'SHORT'); });
check('旧identity筛选与工号组保持相同集合', () => assert.equal(model({ agentId: 'I-OLD' }).calls.length, 3));
const misplaced = local('WRONG-TENANT-IDENTITY', 'I-OLD', { tenantId: 'STORE' });
calls.push(misplaced);
check('本地identity不跨租户关联，即使该租户存在相同cno', () => assert.ok(model().excludedUnassociatedCalls.some(call => call.callId === misplaced.callId)));
calls.pop();
context.CustomerTasks.reportSnapshot = () => [{ id: 'LEADS', name: '导入', tenantId: 'HQ', enterpriseId,
  businessType: 'lead', createdAt: '2026-09-02', rows: [
    { id: 'L-OLD', externalDocumentId: 'LEAD-OLD', businessType: 'lead', ownerId: 'OLD-ACCOUNT', calls: [] },
    { id: 'L-NEW', externalDocumentId: 'LEAD-NEW', businessType: 'lead', ownerId: 'NEW-ACCOUNT', calls: [] }
  ] }];
check('客户名单筛选保留新旧实例各自原账号关联', () => assert.equal(context.CloudReportData.getModel('customers', { ...filters, agentId: groupId }).items.length, 2));
check('线索筛选保留新旧实例各自原账号关联', () => assert.equal(context.CloudReportData.getModel('leads', { ...filters, agentId: groupId }).rows.length, 2));
context.CustomerTasks.reportSnapshot = () => [];
check('新下拉候选只有一个工号汇总项', () => { const options = context.CloudReportData.options(); assert.equal(options.agents.length, 3); assert.equal(options.agents.filter(agent => agent.name === '工号 0012（含历史）').length, 1); });
check('通话总览采用同一工号筛选口径', () => { const overview = context.CloudReportData.getModel('overview', { ...filters, agentId: groupId }); assert.equal(overview.calls.length, 3); });
check('搜索完整工号可找到汇总通话', () => assert.equal(group(model({ keyword: '0012' })).total, 3));
const page = context.Pages['report-center'];
page.restoreNavigationState({ view: 'agents', context: context.CloudReportData.scopeKey(), filters: { agents: { ...filters, agentId: groupId } }, pages: { agents: 1 }, drillState: { kind: 'row', key: groupId, page: 1 } });
check('下钻使用同一汇总行且保留原通话身份', () => { const drill = page.getDrillRows(); assert.equal(drill.rows.length, 3); assert.ok(drill.rows.some(call => call.contactCenterIdentityId === 'I-OLD')); });
check('导出同一工号汇总只出现一行且无误用当前姓名', () => { const csv = page.exportCsv(); assert.equal(csv.split('\r\n').length, 2); assert.ok(csv.includes('工号 0012（含历史）')); assert.ok(!csv.includes('新坐席姓名')); });
check('查询与汇总不会修改任何原始坐席或通话', () => assert.equal(JSON.stringify({ agents, calls, agentSkills: context.CloudCallData.agentSkills }), snapshot));
visible = ['STORE'];
check('缩小权限后旧汇总筛选被拒绝', () => { assert.ok(model({ agentId: groupId }).error); assert.equal(model({ agentId: groupId }).calls.length, 0); });
check('缩小权限后下钻不返回之前租户通话', () => assert.equal(page.getDrillRows().rows.length, 0));
check('门店不会取得同工号总部新旧历史', () => { const scoped = model(); assert.equal(scoped.rows.length, 1); assert.equal(scoped.calls.length, 1); assert.equal(scoped.rows[0].name, '门店坐席'); });
allowed = false;
check('无报表权限返回无数据', () => { const denied = model(); assert.ok(denied.error); assert.equal(denied.rows.length, 0); });
console.log(JSON.stringify({ passed: checks.length, failed: 0, checks }, null, 2));
