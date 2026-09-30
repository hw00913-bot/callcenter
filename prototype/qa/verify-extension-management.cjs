/** Local extension directory contract and authorization regression. No provider or network calls. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..'), key = 'alicti-extension-directory-v2', phoneKey = 'alicti-seat-phone-config-v1';
const checks = [], failures = [], copy = value => JSON.parse(JSON.stringify(value));
const good = result => assert.equal(result?.ok, true, JSON.stringify(result));
const bad = result => assert.equal(result?.ok, false, JSON.stringify(result));
function setup(options = {}) {
  const values = options.values || new Map(), held = new Set(), writes = [];
  const actor = { accountId: 'EXT-ADMIN', sessionId: 'EXT-QA', enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', activeDomain: 'CLOUD_CONTACT_CENTER', role: 'SUPER_ADMIN', valid: true, ready: true, ...options.actor };
  const data = { agents: [], tenants: [
    { tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] },
    { tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] },
    { tenantId: 'TEN-EPI-HQ', enterpriseId: 'DEMO-ENT-003', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] }
  ] };
  const controls = { failWrite: false, beforeLock: null, beforeStore: null, operation: {}, management: {} };
  const c = { console, Date, JSON, Math, Map, Set, structuredClone, CloudCallData: data,
    localStorage: { getItem: name => values.get(name) ?? null, setItem(name, raw) { if (controls.failWrite) throw Error('quota'); controls.beforeStore?.(name, raw); values.set(name, String(raw)); writes.push(name); }, removeItem: name => values.delete(name) },
    AppState: { get: () => actor, effectiveAccess: () => ({ roleCode: actor.role, valid: actor.valid }), isReady: () => actor.ready,
      authorizeObject: (_, row) => row.enterpriseId === actor.enterpriseId && (actor.role === 'SUPER_ADMIN' || row.tenantId === actor.tenantId) },
    AliCtiInboundMock: { rows: [] }, AliCtiAdapter: { session: null },
    AliCtiSeatOperations: { status: () => controls.operation, managementState: () => controls.management },
    navigator: { locks: { request: async (name, options, fn) => { controls.beforeLock?.(name); if (held.has(name)) return fn(null); held.add(name); try { return await fn({ name }); } finally { held.delete(name); } } } },
    fetch() { throw Error('UNEXPECTED NETWORK'); }
  };
  c.window = c; vm.createContext(c);
  for (const file of ['mock/extensions.js', 'js/components/seat-phone-config.js', 'js/components/alicti-extensions.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c, { filename: file });
  const api = c.AliCtiExtensions, phone = c.SeatPhoneConfig;
  const optionsFor = () => { const found = api.catalog(); good(found); return { expectedRevision: found.revision, expectedContext: found.context }; };
  const defaults = { exten: '009991', password: 'QA-only-secret-492!', areaCode: '021', type: 2, tenantId: 'TEN-NISSAN-HQ' };
  const addAgent = (extra = {}) => { const agent = { contactCenterIdentityId: 'EXT-SEAT-' + (data.agents.length + 1), agentRecordId: 'EXT-RECORD-' + (data.agents.length + 1), accountId: 'EXT-ADMIN', enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', cno: '0012', userName: '测试坐席', lifecycleStatus: '已启用', agentStatus: '离线', softphoneExtension: '', currentCall: false, callEnabled: true, acceptNewTasks: true, ...extra }; data.agents.push(agent); return agent; };
  const save = (agent, value) => { const current = phone.read(agent); good(current); return phone.save(agent.contactCenterIdentityId, value, { expectedContext: current.context, expectedRevision: current.revision, expectedDirectoryRevision: current.directoryRevision, expectedDirectoryContext: current.directoryContext }); };
  return { c, actor, data, values, controls, writes, held, api, phone, optionsFor, addAgent, save,
    create: (input = {}, options) => api.create({ ...defaults, ...input }, options || optionsFor()),
    update: (id, input = {}, options) => api.update(id, { areaCode: '021', ...input }, options || optionsFor()),
    row: exten => api.catalog().rows.find(row => row.exten === exten),
    snapshot: () => JSON.stringify({ values: [...values], agents: data.agents, trace: api.trace() }) };
}
async function check(name, fn) { try { await fn(); checks.push(name); } catch (error) { failures.push({ name, error: error.stack || error.message }); } }
function storedRows(f) { return JSON.parse(f.values.get(key)).rows; }
function alterDirectory(f, change) { const saved = f.values.has(key) ? JSON.parse(f.values.get(key)) : { schemaVersion: 2, revision: 0, rows: copy(f.c.AliCtiExtensionFixtures.rows), deleted: [] }; change(saved); saved.revision++; f.values.set(key, JSON.stringify(saved)); }
function liveOperations(f) {
  const callbacks = [], account = { accountId: f.actor.accountId, status: '启用' };
  f.data.accounts = [account]; f.data.memberships = [];
  f.c.AppState.account = () => account; f.c.AppState.hasCapability = () => true;
  f.c.AgentWorkbench = { current: () => ({ phase: 'idle', busy: false }) };
  f.c.setTimeout = fn => { callbacks.push(fn); return callbacks.length; }; f.c.clearTimeout = () => {};
  for (const file of ['js/components/tenant-supervisor-policy.js', 'mock/seat-operations.js', 'js/components/alicti-fields.js', 'js/components/alicti-seat-operations.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), f.c, { filename: file });
  return { api: f.c.AliCtiSeatOperations, finish: async promise => { while (callbacks.length) callbacks.shift()(); return promise; } };
}
(async () => {
  await check('新增按官方 create 字段类型序列化且租户不进入供应商字段', async () => {
    const f = setup(), result = await f.create({ isOb: 0, denoise: 1, callPower: 2 }); good(result);
    const t = copy(f.api.trace().at(-1)); assert.equal(t.endpoint, '/interface/v10/exten/create');
    assert.equal(t.fields.exten, '009991'); assert.equal(t.fields.type, 2); assert.equal(t.fields.areaCode, '021');
    assert.equal(t.fields.isOb, '0'); assert.equal(t.fields.denoise, '1'); assert.equal(t.fields.callPower, '2');
    for (const field of ['active', 'isDirect', 'ibRecord', 'obRecord', 'jitterBuffer']) assert.equal(typeof t.fields[field], 'number');
    assert.equal(t.fields.validateType, 2); assert.equal(t.fields.enterpriseId, '7522240');
    assert.equal(t.fields.tenantId, undefined); assert.equal(t.response.data.tenantId, undefined); assert.equal(result.row.tenantId, 'TEN-NISSAN-HQ');
  });
  await check('密码只参与本次创建，不进入持久化、结果或可见追踪', async () => {
    const f = setup(), password = 'TEMP-SECRET-8726!', result = await f.create({ password }); good(result);
    for (const material of [JSON.stringify(result), JSON.stringify(f.api.trace()), JSON.stringify([...f.values])]) assert(!material.includes(password));
    assert.equal(f.api.trace()[0].fields.password, '[已隐藏]'); assert(!Object.keys(result.row).some(name => /password/i.test(name)));
    const fresh = setup({ values: f.values }); assert.equal(fresh.row('009991').exten, '009991');
  });
  await check('创建必填与本地数字长度约束拒绝无效数据，不产生部分记录', async () => {
    for (const input of [{ exten: '' }, { exten: '12' }, { exten: '123456789012' }, { exten: ' 0012' }, { exten: 1234 }, { exten: 'ab12' }, { password: '' }, { password: null }, { areaCode: '' }, { areaCode: 'abc' }, { type: 3 }, { active: 2 }, { allow: 'g729' }, { unexpected: true }]) {
      const f = setup(), before = f.snapshot(); bad(await f.create(input)); assert.equal(f.snapshot(), before, JSON.stringify(input));
    }
  });
  await check('更新使用 update 类型，未提交密码和可选状态保持不变', async () => {
    const f = setup(); good(await f.create({ active: 0, isOb: 0, denoise: 1 })); const row = f.row('009991');
    good(await f.update(row.id, { areaCode: '010', isOb: 1, denoise: 0 })); const trace = f.api.trace().at(-1);
    assert.equal(trace.endpoint, '/interface/v10/exten/update'); assert.equal(trace.fields.exten, '009991'); assert.equal(trace.fields.type, 2);
    assert.equal(trace.fields.isOb, 1); assert.equal(trace.fields.denoise, 0); assert(!Object.hasOwn(trace.fields, 'password')); assert(!Object.hasOwn(trace.fields, 'active'));
    assert.equal(f.row('009991').active, 0); assert.equal(f.row('009991').areaCode, '010');
  });
  await check('更新密码不会写入模型、存储、响应或追踪', async () => {
    const f = setup(); good(await f.create()); const password = 'UPDATED-SECRET-192!', result = await f.update(f.row('009991').id, { password }); good(result);
    assert(!JSON.stringify({ result, trace: f.api.trace(), stored: [...f.values] }).includes(password)); assert.equal(f.api.trace().at(-1).fields.password, '[已隐藏]');
  });
  await check('编辑不能改分机号、伪造账号或更换自动归属租户', async () => {
    for (const change of [{ exten: '009992' }, { enterpriseId: 'DEMO-ENT-003' }, { tenantId: 'TEN-NISSAN-SH' }, { type: 1 }, { areaCode: undefined }]) {
      const f = setup(); good(await f.create()); const before = f.snapshot(); bad(await f.update(f.row('009991').id, change)); assert.equal(f.snapshot(), before);
    }
  });
  await check('单项 batchDelete 保留前导零，使用列表回查且回执计数按官方 String', async () => {
    const f = setup(); good(await f.create()); good(await f.api.remove(f.row('009991').id, f.optionsFor()));
    const [deleted, confirmed] = f.api.trace().slice(-2); assert.equal(deleted.endpoint, '/interface/v10/exten/batchDelete'); assert.equal(deleted.fields.extens, '009991');
    assert.equal(confirmed.endpoint, '/interface/v10/exten/list'); assert.equal(confirmed.fields.exten, '009991'); assert.equal(confirmed.response.data.total, '0'); assert.equal(confirmed.response.data.list.length, 0);
    assert.equal(deleted.response.data.success, '1'); assert.equal(deleted.response.data.fail, '0'); assert.equal(f.row('009991'), undefined);
    assert(f.api.trace().every(t => t.fields.tenantId === undefined));
  });
  await check('同账号目录和未导入供应商分机均不能重复创建', async () => {
    for (const exten of ['0012', '8301']) { const f = setup(), before = f.snapshot(); bad(await f.create({ exten })); assert.equal(f.snapshot(), before); }
    const f = setup(); good(await f.create()); const before = f.snapshot(); bad(await f.create()); assert.equal(f.snapshot(), before);
  });
  await check('不同 enterpriseId 可复用相同分机号，目录数据保持隔离', async () => {
    const f = setup(); good(await f.create()); f.actor.enterpriseId = 'DEMO-ENT-003'; f.actor.tenantId = 'TEN-EPI-HQ';
    good(await f.create({ tenantId: 'TEN-EPI-HQ' })); assert.equal(f.api.catalog().rows.length, 1); assert.equal(f.row('009991').enterpriseId, 'DEMO-ENT-003');
    assert.equal(storedRows(f).filter(row => row.exten === '009991').length, 2);
  });
  await check('导入候选仅当前账号 WebRTC；导入不调用 create 且租户关系仅本地', async () => {
    const f = setup(), list = f.api.importCandidates(); good(list); assert(list.rows.every(row => row.enterpriseId === '7522240' && row.type === 2)); assert(!list.rows.some(row => row.exten === '8401'));
    good(await f.api.importExisting(['98103'], f.optionsFor())); assert.equal(f.row('008303').tenantId, 'TEN-NISSAN-HQ');
    assert.deepEqual(f.api.trace().map(t => t.endpoint), ['/interface/v10/exten/list']);
    assert(f.api.trace()[0].response.data.list.every(row => !Object.hasOwn(row, 'tenantId')));
    assert(!f.api.importCandidates().rows.some(row => row.id === '98103'));
  });
  await check('导入拒绝重复选择、别账号、非 WebRTC 和未知资源，整批无写入', async () => {
    for (const ids of [['98101', '98101'], ['98201'], ['98105'], ['unknown'], [], [98101], ['98101', 'unknown']]) {
      const f = setup(), before = f.snapshot(); bad(await f.api.importExisting(ids, f.optionsFor())); assert.equal(f.snapshot(), before);
    }
  });
  await check('无权限、未就绪、无会话和错误业务域拒绝管理', async () => {
    for (const patch of [{ role: 'OPERATOR' }, { role: 'UNKNOWN' }, { ready: false }, { valid: false }, { accountId: '' }, { sessionId: '' }, { activeDomain: 'SMART_OUTBOUND' }]) {
      const f = setup(), old = f.optionsFor(), before = f.snapshot(); Object.assign(f.actor, patch); bad(f.api.catalog()); bad(f.api.importCandidates()); bad(await f.create({}, old)); assert.equal(f.snapshot(), before);
    }
  });
  await check('租户管理员仅管理本租户，导入仍由超管执行', async () => {
    const f = setup({ actor: { role: 'ADMIN' } }); assert(f.api.catalog().rows.every(row => row.tenantId === 'TEN-NISSAN-HQ'));
    good(await f.create()); bad(await f.create({ exten: '009992', tenantId: 'TEN-NISSAN-SH' }));
    bad(await f.update('98012', {})); bad(await f.api.remove('98012', f.optionsFor())); bad(f.api.importCandidates());
    bad(await f.api.importExisting(['98101'], f.optionsFor())); bad(await f.api.assign(f.row('009991').id, 'TEN-NISSAN-SH', f.optionsFor()));
  });
  await check('自动归属租户须唯一、启用且开通云联络中心，内置租户不能占用', async () => {
    for (const change of [{ enterpriseId: 'OTHER' }, { status: '停用' }, { capabilitySet: [] }, { builtIn: true }]) {
      const f = setup(), opts = f.optionsFor(); Object.assign(f.data.tenants[0], change); const before = f.snapshot(); bad(await f.create({}, opts)); assert.equal(f.snapshot(), before);
    }
    const f = setup(); bad(await f.create({ tenantId: 'TEN-EPI-HQ' }));
  });
  await check('超管新建和导入自动归属唯一业务租户，不可取消或跨租户分配', async () => {
    const f = setup({ actor: { tenantId: 'TENANT-SUPER-BUILTIN' } });
    good(await f.create({ tenantId: undefined }));
    const row = f.row('009991'), initial = f.api.trace().length;
    assert.equal(row.tenantId, 'TEN-NISSAN-HQ');
    bad(await f.api.assign(row.id, 'TEN-NISSAN-SH', f.optionsFor()));
    bad(await f.api.assign(row.id, '', f.optionsFor()));
    assert.equal(f.row('009991').tenantId, 'TEN-NISSAN-HQ'); assert.equal(f.api.trace().length, initial);
    bad(await f.create({ exten: '009992', tenantId: '' }));
    good(await f.api.importExisting(['98103'], f.optionsFor()));
    assert.equal(f.row('008303').tenantId, 'TEN-NISSAN-HQ');
    assert(storedRows(f).every(row => row.tenantId && row.tenantId !== 'TENANT-SUPER-BUILTIN'));
  });
  await check('分机页面移除租户筛选与分配操作，新建和导入仅展示自动归属', () => {
    const f = setup(), layers = [], messages = [];
    Object.assign(f.c, { Pages: {}, location: { hash: '#extensions' }, RouteRuntime: { refreshCurrent() {} },
      document: { getElementById() { return null; } }, addEventListener() {}, showToast(message) { messages.push(message); },
      PlatformUI: { escape: String, empty: String, status: String, pagination() { return ''; }, alert: (_type, title, message) => title + message,
        pageHeader: (title, description) => title + description, toolbar: (left, right) => left + right,
        table: (columns, rows) => rows.map(row => columns.map(column => column.render ? column.render(row[column.key], row) : row[column.key]).join(' ')).join('\n'),
        openLayer(_id, html) { layers.push(html); }, closeLayer() {} } });
    f.c.AppState.isSuper = () => true; f.c.AppState.setDirty = () => {};
    vm.runInContext(fs.readFileSync(path.join(root, 'js/pages/extension-management.js'), 'utf8'), f.c);
    const page = f.c.ExtensionManagement, html = page.render();
    assert(!/extension-filter-tenant|分配租户/.test(html));
    page.open('create'); assert(!/extension-tenantId|暂不分配/.test(layers.at(-1))); assert(layers.at(-1).includes('随当前 AliCti 账号自动确定'));
    assert.equal(page.open('assign', '96001'), undefined); assert(messages.length);
    page.close(true); page.openImport(); assert(!/extension-tenantId|暂不分配/.test(layers.at(-1)));
    assert(layers.at(-1).includes('导入后自动归属'));
  });
  await check('无业务租户的账号不能新增或导入未分配分机', async () => {
    const f = setup({ actor: { enterpriseId: 'NEW-EMPTY', tenantId: 'TENANT-SUPER-BUILTIN' } }), before = f.snapshot();
    bad(await f.create({ tenantId: undefined })); bad(f.api.importCandidates());
    bad(await f.api.importExisting(['98103'], f.optionsFor())); assert.equal(f.snapshot(), before);
  });
  await check('旧分机样例仅重置本模块，新版本空归属或错租户快照拒绝恢复', async () => {
    const values = new Map([['alicti-extension-directory-v1', '{old demo}'], ['other-demo', 'keep']]);
    const f = setup({ values }); good(f.api.catalog());
    assert.equal(values.has('alicti-extension-directory-v1'), false); assert.equal(values.get('other-demo'), 'keep');
    good(await f.create()); const original = f.values.get(key);
    for (const tenantId of ['', 'TENANT-SUPER-BUILTIN', 'TEN-NISSAN-SH']) {
      const changed = JSON.parse(original); changed.revision++; changed.rows[0].tenantId = tenantId;
      values.set(key, JSON.stringify(changed)); const reloaded = setup({ values }); bad(reloaded.api.catalog());
      assert.equal(values.get(key), JSON.stringify(changed));
    }
  });
  await check('坐席仅能选择本租户启用软电话，不能手填不存在的分机', async () => {
    const f = setup(), a = f.addAgent(); good(f.api.checkSelection(a, '0012')); good(f.api.checkSelection(a, ''));
    for (const exten of ['123456', '8201', '8301', ' 0012', 12]) bad(f.api.checkSelection(a, exten));
    alterDirectory(f, data => { data.rows.push({ ...data.rows[0], id: 'Q-TYPE', exten: '9191', type: 3 }); data.rows.push({ ...data.rows[0], id: 'Q-OFF', exten: '9192', active: 0 }); });
    bad(f.api.checkSelection(a, '9191')); bad(f.api.checkSelection(a, '9192')); assert(f.api.choices(a).rows.every(row => row.type === 2 && row.active === 1 && row.tenantId === a.tenantId));
  });
  await check('同企业其他非删除坐席占用分机，即便停用或跨租户也不能再选', async () => {
    for (const patch of [{}, { lifecycleStatus: '已停用' }, { tenantId: 'TEN-NISSAN-SH' }]) {
      const f = setup(), a = f.addAgent(), other = f.addAgent({ cno: '0013', softphoneExtension: '0012', ...patch }); bad(f.api.checkSelection(a, '0012'));
      other.lifecycleStatus = '已删除'; good(f.api.checkSelection(a, '0012'));
    }
    const f = setup(), a = f.addAgent(); f.addAgent({ enterpriseId: 'DEMO-ENT-003', tenantId: 'TEN-EPI-HQ', softphoneExtension: '0012' }); good(f.api.checkSelection(a, '0012'));
  });
  await check('坐席工号原始字符串参与供应商绑定核对，不合并 0012 和 12', async () => {
    const f = setup(), a = f.addAgent({ softphoneExtension: '0012' }); alterDirectory(f, data => { data.rows.find(row => row.exten === '0012').bindCno = '0012'; });
    good(f.api.checkSelection(a, '0012')); a.cno = '12'; bad(f.api.checkSelection(a, '0012'));
  });
  await check('已分配坐席的分机不能删除或转租户；离线可改非归属属性', async () => {
    const f = setup(); f.addAgent({ softphoneExtension: '0012' }); const row = f.row('0012');
    bad(await f.api.remove(row.id, f.optionsFor())); bad(await f.api.assign(row.id, 'TEN-NISSAN-SH', f.optionsFor())); good(await f.update(row.id, { denoise: 1 }));
  });
  await check('在线、通话、未知状态和电话操作在途保护分机资料', async () => {
    const variants = [f => { f.data.agents[0].agentStatus = '空闲'; }, f => { f.data.agents[0].agentStatus = ''; }, f => { f.data.agents[0].currentCall = true; }, f => { f.data.agents[0].currentEndpoint = true; }, f => { f.c.AliCtiAdapter.session = { enterpriseId: '7522240', cno: '0012' }; }, f => { f.controls.operation = { inFlight: true, lastRequest: { enterpriseId: '7522240', cno: '0012' } }; }, f => { f.controls.management = { pending: true, cno: '0012' }; }];
    for (const change of variants) { const f = setup(); f.addAgent({ softphoneExtension: '0012' }); change(f); const before = f.snapshot(); bad(await f.update(f.row('0012').id, { denoise: 1 })); assert.equal(f.snapshot(), before); }
  });
  await check('另一标签页持有上线锁时，即使本页坐席仍显示离线也不得修改分机', async () => {
    const f = setup(), a = f.addAgent({ softphoneExtension: '0012' }), row = f.row('0012');
    // AgentWorkbench holds this lock before connecting, until normal logout or
    // a confirmed failed login. Agent status/session are not shared between tabs.
    f.held.add('unified-call-seat:' + a.contactCenterIdentityId);
    const before = f.snapshot(); bad(await f.update(row.id, { active: 0 })); assert.equal(f.snapshot(), before);
    bad(await f.api.remove(row.id, f.optionsFor())); bad(await f.api.assign(row.id, 'TEN-NISSAN-SH', f.optionsFor()));
    f.held.delete('unified-call-seat:' + a.contactCenterIdentityId); good(await f.update(row.id, { denoise: 1 }));
  });
  for (const [name, patch] of [['isOb=0', { isOb: 0 }], ['callPower=3', { callPower: '3' }]]) {
    await check('分机 ' + name + ' 禁止新的手动客户外呼，但仍可接听和正常下线', async () => {
      const f = setup(), a = f.addAgent({ softphoneExtension: '0012', syncStatus: '同步成功' });
      alterDirectory(f, data => Object.assign(data.rows.find(row => row.exten === '0012'), patch));
      const live = liveOperations(f); good(await live.finish(live.api.login(a, { workingMode: '0' })));
      assert.equal(live.api.canDial(), false); assert.equal(live.api.canReceive('inbound'), true);
      good(await live.finish(live.api.logout(a))); assert.equal(live.api.current(), null);
    });
  }
  await check('供应商已有绑定时本地无坐席记录也不能删除、转租户或编辑', async () => {
    const f = setup(); alterDirectory(f, data => { data.rows.find(row => row.exten === '0012').bindCno = 'REMOTE'; }); const row = f.row('0012');
    bad(await f.update(row.id)); bad(await f.api.remove(row.id, f.optionsFor())); bad(await f.api.assign(row.id, 'TEN-NISSAN-SH', f.optionsFor()));
  });
  await check('供应商绑定状态缺失或类型未知时不能当成未绑定', async () => {
    for (const mode of ['missing', 'numeric']) {
      const f = setup(), a = f.addAgent(); alterDirectory(f, data => { const row = data.rows.find(row => row.exten === '0012'); if (mode === 'missing') delete row.bindCno; else row.bindCno = 12; });
      const row = f.row('0012'); bad(f.api.checkSelection(a, '0012')); bad(f.api.usage(row)); bad(await f.update(row.id)); bad(await f.api.remove(row.id, f.optionsFor()));
    }
  });
  await check('已启用或暂停呼入规则均保护目标分机删除、转租户与停用', async () => {
    for (const active of [1, 2]) {
      const f = setup(); f.c.AliCtiInboundMock.rows.push({ enterpriseId: '7522240', routerType: 3, routerProperty: '0012', active }); const row = f.row('0012');
      bad(await f.api.remove(row.id, f.optionsFor())); bad(await f.api.assign(row.id, 'TEN-NISSAN-SH', f.optionsFor())); bad(await f.update(row.id, { active: 0 })); good(await f.update(row.id, { denoise: 1 }));
    }
  });
  await check('其他账号的呼入规则不占用当前账号分机', async () => {
    const f = setup(); f.c.AliCtiInboundMock.rows.push({ enterpriseId: 'DEMO-ENT-003', routerType: 3, routerProperty: '0012', active: 1 }); good(await f.api.remove(f.row('0012').id, f.optionsFor()));
  });
  await check('呼入规则存储损坏时拒绝删除和停用，不覆盖原始资料', async () => {
    const f = setup(); f.values.set('alicti-inbound-router-v1', '{broken'); const before = f.snapshot(), row = f.row('0012'); bad(await f.api.remove(row.id, f.optionsFor())); bad(await f.update(row.id, { active: 0 })); assert.equal(f.snapshot(), before);
  });
  await check('本账号呼入写入结果待核对时保护分机，别账号 pending 不误阻断', async () => {
    for (const enterpriseId of ['7522240', 'DEMO-ENT-003']) {
      const f = setup(); f.values.set('alicti-inbound-router-v1', JSON.stringify({ rows: [], pending: [{ enterpriseId }] }));
      const result = await f.api.remove(f.row('0012').id, f.optionsFor()); if (enterpriseId === '7522240') bad(result); else good(result);
    }
  });
  await check('已导入后删除的分机不会被旧供应商演示目录复活', async () => {
    const f = setup(); good(await f.api.importExisting(['98103'], f.optionsFor())); good(await f.api.remove(f.row('008303').id, f.optionsFor()));
    assert(!f.api.importCandidates().rows.some(row => row.exten === '008303'));
    const fresh = setup({ values: f.values }); assert.equal(fresh.row('008303'), undefined); assert(!fresh.api.importCandidates().rows.some(row => row.exten === '008303'));
  });
  await check('旧表单版本与第二窗口更新不能覆盖新目录', async () => {
    const f = setup(), stale = f.optionsFor(), other = setup({ values: f.values }); good(await other.create()); const before = f.snapshot(); bad(await f.create({ exten: '009992' }, stale)); assert.equal(f.snapshot(), before);
    good(await f.create({ exten: '009992' }));
  });
  await check('账号、会话、租户、企业和权限变化后旧表单拒绝提交', async () => {
    for (const patch of [{ accountId: 'NEW' }, { sessionId: 'NEW' }, { tenantId: 'TEN-NISSAN-SH' }, { enterpriseId: 'DEMO-ENT-003' }, { role: 'ADMIN' }, { valid: false }]) {
      const f = setup(), stale = f.optionsFor(), before = f.snapshot(); Object.assign(f.actor, patch); bad(await f.create({}, stale)); assert.equal(f.snapshot(), before);
    }
  });
  await check('等待锁时目录或账号变化会再次检查，不产生旧范围写入', async () => {
    for (const change of [f => { f.actor.sessionId = 'NEW'; }, f => { alterDirectory(f, data => { data.rows.find(row => row.exten === '0012').active = 0; }); }]) {
      const f = setup(), stale = f.optionsFor(); f.controls.beforeLock = () => { f.controls.beforeLock = null; change(f); }; bad(await f.create({}, stale)); assert.equal(f.api.trace().length, 0); assert(![...f.values.values()].some(raw => raw.includes('009991')));
    }
  });
  await check('缺锁能力或分机坐席锁被占用时拒绝维护', async () => {
    const f = setup(), initial = f.optionsFor(); delete f.c.navigator.locks; bad(await f.create({}, initial)); assert.equal(f.values.size, 0);
    const g = setup(); g.held.add(phoneKey); bad(await g.create()); assert.equal(g.values.size, 0); g.held.delete(phoneKey); good(await g.create());
  });
  await check('写入失败保留原存储且不生成供应商成功追踪', async () => {
    const f = setup(); good(await f.create()); const before = f.snapshot(); f.controls.failWrite = true;
    bad(await f.update(f.row('009991').id, { active: 0 })); assert.equal(f.snapshot(), before);
    bad(await f.api.remove(f.row('009991').id, f.optionsFor())); assert.equal(f.snapshot(), before);
    bad(await f.create({ exten: '009992' })); assert.equal(f.snapshot(), before);
  });
  await check('损坏、重复或夹带密码的目录拒绝使用，不自动重置覆盖', async () => {
    const base = setup(), rows = copy(base.c.AliCtiExtensionFixtures.rows);
    const variants = ['{broken', JSON.stringify({ schemaVersion: 9, revision: 1, rows, deleted: [] }), JSON.stringify({ schemaVersion: 2, revision: 1, rows: [...rows, rows[0]], deleted: [] }), JSON.stringify({ schemaVersion: 2, revision: 1, rows: [{ ...rows[0], password: 'LEAK' }], deleted: [] })];
    for (const raw of variants) { const f = setup(); f.values.set(key, raw); const a = f.addAgent(); bad(f.api.catalog()); bad(f.api.choices(a)); bad(f.api.checkSelection(a, '0012')); assert.equal(f.api.directoryRevision(), -1); bad(await f.api.create({}, { expectedContext: f.api.context(), expectedRevision: 1 })); assert.equal(f.values.get(key), raw); }
  });
  await check('目录曾持久化后被移除或回滚不能当作初始目录复活', async () => {
    for (const remove of [true, false]) { const f = setup(); good(await f.create()); if (remove) f.values.delete(key); else { const saved = JSON.parse(f.values.get(key)); saved.revision = 0; f.values.set(key, JSON.stringify(saved)); } bad(f.api.catalog()); assert.equal(f.api.directoryRevision(), -1); }
  });
  await check('实际 SeatPhoneConfig 拒绝自由手填且保存受控分机前导零', async () => {
    const f = setup(), a = f.addAgent(); bad(await f.save(a, '007777')); good(await f.save(a, '0012')); assert.equal(f.phone.extension(a), '0012');
    const persisted = JSON.parse(f.values.get(phoneKey)); assert.equal(persisted.extensions[JSON.stringify(['7522240', 'TEN-NISSAN-HQ', a.contactCenterIdentityId, '0012'])], '0012');
  });
  await check('旧非法值可读取并更正，不自动生成或复活虚构分机', async () => {
    for (const old of ['999999', 'LEGACY-INVALID', 8001]) { const f = setup(), a = f.addAgent({ softphoneExtension: old }), read = f.phone.read(a); good(read); assert.equal(read.eligible, false); assert.equal(f.phone.extension(a), ''); good(await f.save(a, '0012')); assert.equal(f.phone.extension(a), '0012'); }
  });
  await check('缺目录时分机读取保持可诊断但不可用于新上线或保存', async () => {
    const f = setup(), a = f.addAgent({ softphoneExtension: '0012' }); f.c.AliCtiExtensions = undefined; const r = f.phone.read(a); good(r); assert.equal(r.eligible, false); assert.equal(f.phone.extension(a), ''); bad(await f.save(a, '0012'));
  });
  await check('坐席选择表单的旧目录版本不能覆盖后来停用或改归属', async () => {
    const f = setup(), a = f.addAgent(), old = f.phone.read(a); alterDirectory(f, data => { data.rows.find(row => row.exten === '0012').active = 0; });
    bad(await f.phone.save(a.contactCenterIdentityId, '0012', { expectedContext: old.context, expectedRevision: old.revision, expectedDirectoryRevision: old.directoryRevision, expectedDirectoryContext: old.directoryContext })); assert.equal(f.values.has(phoneKey), false);
  });
  await check('坐席配置已损坏时目录占用检查失败关闭，不冒险重分配', async () => {
    const f = setup(), a = f.addAgent(); f.values.set(phoneKey, '{broken'); bad(f.api.choices(a)); bad(f.api.checkSelection(a, '0012')); bad(await f.api.remove(f.row('0012').id, f.optionsFor())); assert.equal(f.values.get(phoneKey), '{broken');
  });
  console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', count: checks.length, failedCount: failures.length, checks, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
