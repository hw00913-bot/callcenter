/** Independent local enterpriseTime contract, scope and task-reference checks. No network. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..'), key = 'alicti-time-conditions-v1';
const createdKey = 'cloud-task-created-v1', draftsKey = 'cloud-task-wizard-drafts-v1', inboundKey = 'alicti-inbound-router-v1';
const checks = [], failures = [], copy = value => JSON.parse(JSON.stringify(value));
const good = result => assert.equal(result?.ok, true, JSON.stringify(result));
const bad = result => assert.equal(result?.ok, false, JSON.stringify(result));
function setup(options = {}) {
  const values = options.values || new Map(), session = options.session || new Map(), held = new Set();
  const actor = { accountId: 'TIME-ADMIN', sessionId: 'TIME-QA', enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', activeDomain: 'CLOUD_CONTACT_CENTER', role: 'SUPER_ADMIN', valid: true, ready: true, ...options.actor };
  const data = { tasks: [], predictiveTasks: [], ivrTasks: [], tenants: [
    { tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] },
    { tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] },
    { tenantId: 'TEN-EPI-HQ', enterpriseId: 'DEMO-ENT-003', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] }
  ] };
  const controls = { failWrite: false, beforeLock: null, menu: true };
  const storage = map => ({ getItem: name => map.get(name) ?? null, setItem(name, raw) { if (controls.failWrite) throw Error('quota'); map.set(name, String(raw)); }, removeItem: name => map.delete(name) });
  const c = { console, Date, JSON, Math, Map, Set, structuredClone, CloudCallData: data, localStorage: storage(values), sessionStorage: storage(session),
    AppState: { get: () => actor, effectiveAccess: () => ({ roleCode: actor.role, valid: actor.valid }), isReady: () => actor.ready,
      canMenu: name => controls.menu && name === 'settings.times',
      authorizeObject: (_, row) => row.enterpriseId === actor.enterpriseId && (actor.role === 'SUPER_ADMIN' || row.tenantId === actor.tenantId) },
    AliCtiInboundMock: { rows: [] },
    navigator: { locks: { request: async (name, options, fn) => { controls.beforeLock?.(name); if (held.has(name)) return fn(null); held.add(name); try { return await fn({ name }); } finally { held.delete(name); } } } },
    fetch() { throw Error('UNEXPECTED NETWORK'); }
  };
  c.window = c; vm.createContext(c);
  for (const file of (options.withoutFixtures ? ['js/components/alicti-time-conditions.js'] : ['mock/time-conditions.js', 'js/components/alicti-time-conditions.js'])) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c, { filename: file });
  const api = c.AliCtiTimeConditions;
  const optionsFor = () => { const read = api.catalog(); good(read); return { expectedRevision: read.revision, expectedContext: read.context }; };
  const defaults = { name: '独立验证时间条件', priority: 10, type: 1, timeType: 1, dayOfWeek: ['2', '3', '4', '5', '6'], startTime: '09:00', endTime: '18:00', tenantId: 'TEN-NISSAN-HQ' };
  return { c, actor, data, values, session, held, controls, api, optionsFor,
    create: (input = {}, options) => api.create({ ...defaults, ...input }, options || optionsFor()),
    update: (id, input = {}, options) => api.update(id, input, options || optionsFor()),
    remove: (id, options) => api.remove(id, options || optionsFor()),
    row: (id = '95003') => api.catalog().rows.find(row => String(row.id) === String(id)),
    snapshot: () => JSON.stringify({ values: [...values], session: [...session], trace: api.trace() }) };
}
async function check(name, fn) { try { await fn(); checks.push(name); } catch (error) { failures.push({ name, error: error.stack || error.message }); } }
function alter(f, change) { const data = f.values.has(key) ? JSON.parse(f.values.get(key)) : { version: 1, revision: 0, rows: copy(f.c.AliCtiTimeFixtures.rows) }; change(data); data.revision++; f.values.set(key, JSON.stringify(data)); }
function task(extra = {}) { return { taskId: 'TIME-TASK', enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', name: '专项验证任务', status: '待启动', allowedTimeIds: ['95003'], ...extra }; }
function pageFixture(options = {}) {
  const f = setup(options), view = { columns: [], rows: [], layer: '', submissions: [], messages: [] };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  f.c.PlatformUI = { escape: esc, empty: esc, pageHeader: esc, alert: esc, toolbar: (...parts) => parts.join(''), pagination: () => '',
    table(columns, rows) { view.columns = columns; view.rows = rows; return rows.map(row => columns.map(col => col.render ? col.render(row[col.key], row) : esc(row[col.key])).join('')).join(''); },
    openLayer(_, html) { view.layer = html; }, closeLayer() { view.layer = ''; } };
  f.c.document = { getElementById: () => null, querySelectorAll: () => [] };
  f.c.location = { hash: '#time-conditions' }; f.c.Pages = {}; f.c.addEventListener = () => {};
  f.c.AppState.isSuper = () => f.actor.role === 'SUPER_ADMIN'; f.c.AppState.setDirty = () => {};
  f.c.RouteRuntime = { refreshCurrent() {} }; f.c.showToast = message => view.messages.push(message);
  f.c.AliCtiTimeConditions = { ...f.api,
    create(input, opts) { view.submissions.push({ method: 'create', input: copy(input) }); return f.api.create(input, opts); },
    update(id, input, opts) { view.submissions.push({ method: 'update', input: copy(input) }); return f.api.update(id, input, opts); } };
  vm.runInContext(fs.readFileSync(path.join(root, 'js/pages/time-condition-management.js'), 'utf8'), f.c, { filename: 'js/pages/time-condition-management.js' });
  return { ...f, view, page: f.c.TimeConditionManagement };
}
(async () => {
  await check('演示条件按账号隔离、优先级排序，列表和返回数据不能改写冻结种子', async () => {
    const f = setup(), first = f.api.catalog(); good(first); assert.equal(first.rows.length, 5); assert.equal(first.revision, 0);
    assert(first.rows.every(row => row.enterpriseId === '7522240')); assert.deepEqual(copy(first.rows.map(row => row.priority)), [1, 2, 3, 4, 5]);
    assert(Object.isFrozen(f.c.AliCtiTimeFixtures.rows)); assert(Object.isFrozen(f.c.AliCtiTimeFixtures.rows[0].tenantIds));
    first.rows[0].name = 'changed'; first.rows[0].tenantIds.push('other'); assert.equal(f.api.catalog().rows[0].name, '工作日营业时间'); assert.equal(f.api.catalog().rows[0].tenantIds.length, 1);
  });
  await check('新增每周条件使用官方字段和数值类型，本地租户不传供应商', async () => {
    const f = setup(), result = await f.create({ priority: '10', type: '1', timeType: '2', dayOfWeek: ['7', '2', '1', '2'] }); good(result);
    const t = copy(f.api.trace()[0]); assert.equal(t.endpoint, '/interface/v10/enterpriseTime/create'); assert.equal(t.method, 'POST'); assert.equal(t.mock, true);
    assert.equal(t.fields.priority, 10); assert.equal(t.fields.type, 1); assert.equal(t.fields.timeType, 2); assert.equal(t.fields.dayOfWeek, '1,2,7'); assert.equal(t.fields.startTime, '09:00'); assert.equal(t.fields.endTime, '18:00');
    assert.equal(t.fields.fromDay, ''); assert.equal(t.fields.toDay, ''); assert.equal(t.fields.tenantId, undefined); assert.equal(t.fields.tenantIds, undefined); assert.equal(t.fields.validateType, 2); assert.equal(t.fields.enterpriseId, '7522240');
    assert.equal(t.response.result, '0'); assert.equal(t.response.data.tenantIds, undefined); assert.deepEqual(copy(result.row.tenantIds), ['TEN-NISSAN-HQ']); assert.equal(result.revision, 1);
    assert.equal(f.api.summary(result.row), '周日、周一、周六 · 09:00–18:00 · 间隔');
  });
  await check('新增固定日期条件清空星期字段，日期和时间允许相同边界', async () => {
    const f = setup(), result = await f.create({ type: 2, timeType: 1, fromDay: '2028-02-29', toDay: '2028-02-29', startTime: '00:00', endTime: '00:00' }); good(result);
    assert.equal(result.row.dayOfWeek, ''); assert.equal(f.api.trace()[0].fields.dayOfWeek, ''); assert.equal(f.api.summary(result.row), '2028-02-29 至 2028-02-29 · 00:00–00:00 · 连续');
  });
  await check('必填字段、枚举、优先级、时刻和未知字段错误不产生部分写入', async () => {
    const invalid = [{ name: '' }, { name: 123 }, { priority: undefined }, { priority: null }, { priority: '' }, { priority: true }, { priority: 0 }, { priority: -1 }, { priority: 1.5 }, { priority: '01' }, { priority: Number.MAX_SAFE_INTEGER + 1 }, { type: 0 }, { type: true }, { timeType: 0 }, { timeType: true }, { timeType: undefined }, { startTime: '9:00' }, { startTime: '24:00' }, { endTime: '18:60' }, { startTime: '18:01', endTime: '18:00' }, { startTime: '09:00:00' }, { startTime: '' }, { endTime: null }, { dayOfWeek: [] }, { dayOfWeek: '0,1' }, { dayOfWeek: '8' }, { dayOfWeek: '1;2' }, { dayOfWeek: '1, 2' }, { intervalMinutes: 30 }, { enterpriseId: 'OTHER' }, { tenantIds: ['TEN-NISSAN-HQ'] }];
    for (const input of invalid) { const f = setup(), before = f.snapshot(); bad(await f.create(input)); assert.equal(f.snapshot(), before, JSON.stringify(input)); }
  });
  await check('固定日期校验真实日历和顺序，不能凭字符串接收不存在的日期', async () => {
    for (const input of [{ fromDay: '2026-02-29' }, { fromDay: '2026-04-31' }, { fromDay: '2026-13-01' }, { fromDay: '2026-9-01' }, { fromDay: '' }, { toDay: '' }, { fromDay: '2026-10-02', toDay: '2026-10-01' }]) {
      const f = setup(), before = f.snapshot(); bad(await f.create({ type: 2, fromDay: '2026-10-01', toDay: '2026-10-07', ...input })); assert.equal(f.snapshot(), before);
    }
  });
  await check('本企业名称和优先级保持唯一，其他企业的名称不占用本企业取值', async () => {
    const f = setup({ actor: { role: 'ADMIN' } }); assert(!f.api.catalog().rows.some(row => row.id === '95004'));
    const before = f.snapshot(); bad(await f.create({ name: '工作日营业时间' })); bad(await f.create({ priority: 4 })); assert.equal(f.snapshot(), before); good(await f.create({ name: '上海门店客户联系时间' }));
  });
  await check('新增必须显式手填优先级，省略拒绝写入且不会按已有最大值自动分配', async () => {
    const f = setup({ actor: { role: 'ADMIN' } });
    alter(f, data => { data.rows.find(row => row.id === '95004').priority = 40; data.rows.find(row => row.enterpriseId === 'DEMO-ENT-003').priority = 90; });
    assert(!f.api.catalog().rows.some(row => row.id === '95004'));
    const input = { name: '手动优先级', type: 1, timeType: 1, dayOfWeek: '2,3', startTime: '09:00', endTime: '18:00', tenantId: 'TEN-NISSAN-HQ' };
    const before = f.snapshot(); bad(await f.api.create(input, f.optionsFor())); assert.equal(f.snapshot(), before);
    for (const [name, priority] of [['手动顺序一', 17], ['手动顺序二', 90]]) {
      const result = await f.api.create({ ...input, name, priority: String(priority) }, f.optionsFor()); good(result);
      assert.equal(result.row.priority, priority);
      const submitted = f.api.trace().at(-1).fields.priority; assert.equal(submitted, priority); assert(Number.isSafeInteger(submitted) && submitted > 0);
    }
    const priorities = JSON.parse(f.values.get(key)).rows.filter(row => row.enterpriseId === '7522240').map(row => row.priority);
    assert.equal(new Set(priorities).size, priorities.length);
  });
  await check('不同账号允许同名同优先级，写入和读取不串账号', async () => {
    const f = setup(); good(await f.create()); f.actor.enterpriseId = 'DEMO-ENT-003'; f.actor.tenantId = 'TEN-EPI-HQ'; good(await f.create({ tenantId: 'TEN-EPI-HQ' }));
    assert(f.api.catalog().rows.every(row => row.enterpriseId === 'DEMO-ENT-003')); assert.equal(JSON.parse(f.values.get(key)).rows.filter(row => row.name === '独立验证时间条件').length, 2);
  });
  await check('编辑可手动修改优先级，省略时保留原值且不得改名或租户归属', async () => {
    const f = setup(), priority = f.row().priority; good(await f.update('95003', { startTime: '10:00' })); const t = f.api.trace().at(-1);
    assert.equal(t.endpoint, '/interface/v10/enterpriseTime/update'); assert.equal(t.fields.id, 95003); assert.equal(t.fields.name, undefined); assert.equal(t.fields.timeType, 1); assert.equal(t.fields.tenantId, undefined);
    assert.equal(f.row().name, '总部客户联系时间'); assert.equal(f.row().endTime, '18:00'); assert.equal(f.row().priority, priority); assert.equal(t.fields.priority, priority);
    good(await f.update('95003', { priority: '17' })); assert.equal(f.row().priority, 17); assert.equal(f.api.trace().at(-1).fields.priority, 17);
    for (const input of [{ name: '改名' }, { tenantId: 'TEN-NISSAN-SH' }, { priority: 4 }, { priority: '' }, { priority: undefined }, { priority: null }, { priority: 0 }, { priority: -1 }, { priority: 1.5 }, { unexpected: 1 }]) { const before = f.snapshot(); bad(await f.update('95003', input)); assert.equal(f.snapshot(), before); }
  });
  await check('编辑切换星期与固定日期时只保留当前类型字段', async () => {
    const f = setup(); good(await f.update('95003', { type: 2, fromDay: '2026-12-01', toDay: '2026-12-02' })); assert.equal(f.row().dayOfWeek, '');
    good(await f.update('95003', { type: 1, dayOfWeek: '1,7' })); assert.equal(f.row().fromDay, ''); assert.equal(f.row().toDay, ''); assert.equal(f.row().dayOfWeek, '1,7');
  });
  await check('删除按官方 id 数值字段提交，无租户字段且记录持久消失', async () => {
    const f = setup(); good(await f.remove('95003')); const t = copy(f.api.trace().at(-1)); assert.equal(t.endpoint, '/interface/v10/enterpriseTime/delete');
    assert.deepEqual(t.fields, { validateType: 2, enterpriseId: '7522240', id: 95003 }); assert.deepEqual(t.response, { result: '0', description: '成功' }); assert.equal(f.row(), undefined); assert.equal(setup({ values: f.values }).row(), undefined);
  });
  await check('删除后再次新增不复用旧 ID，历史任务引用不能误指向新条件', async () => {
    const f = setup(), first = await f.create(); good(first); good(await f.remove(first.row.id));
    const fresh = setup({ values: f.values }), second = await fresh.create(); good(second);
    assert.notEqual(String(second.row.id), String(first.row.id));
    bad(fresh.api.validateTask({ autoTaskType: 1, allowedTimeIds: [first.row.id] }, 'TEN-NISSAN-HQ'));
    good(fresh.api.validateTask({ autoTaskType: 1, allowedTimeIds: [second.row.id] }, 'TEN-NISSAN-HQ'));
  });
  await check('租户管理员可维护本企业独立条件，不能读取或修改其他企业条件', async () => {
    const f = setup({ actor: { role: 'ADMIN' } }); assert.equal(f.api.canAccess(), true); good(f.api.catalog('TEN-NISSAN-HQ')); bad(f.api.catalog('TEN-NISSAN-SH'));
    assert(f.api.catalog().rows.every(row => row.enterpriseId === '7522240' && row.tenantIds.length === 1 && row.tenantIds[0] === 'TEN-NISSAN-HQ'));
    assert.equal(f.api.canEdit(f.row('95001')), true); assert.equal(f.api.canEdit(f.row()), true);
    bad(await f.update('95004', {})); bad(await f.remove('95004')); good(await f.update('95001', { startTime: '10:00' })); good(await f.remove('95001')); good(await f.update('95003', { startTime: '10:00' }));
    bad(await f.create({ tenantId: 'TEN-NISSAN-SH' })); good(await f.create());
  });
  await check('超管维护条件仍保留唯一归属，同号门店条件保持原样', async () => {
    const f = setup(); good(await f.update('95001', { startTime: '10:00' })); assert.deepEqual(copy(f.row('95001').tenantIds), ['TEN-NISSAN-HQ']);
    bad(await f.update('95004', { startTime: '11:00' }));
    const rows = JSON.parse(f.values.get(key)).rows, sh = rows.find(row => row.enterpriseId === '7522241' && row.id === '95001');
    assert.equal(sh.startTime, '09:00'); assert.deepEqual(sh.tenantIds, ['TEN-NISSAN-SH']);
  });
  await check('创建自动使用唯一租户，未绑定或重复绑定含停用租户时不写入', async () => {
    const f = setup(), automatic = await f.create({ tenantId: undefined }); good(automatic);
    assert.deepEqual(copy(automatic.row.tenantIds), ['TEN-NISSAN-HQ']);
    for (const change of [g => { g.data.tenants = g.data.tenants.filter(row => row.enterpriseId !== '7522240'); }, g => { g.data.tenants.push({ tenantId: 'TEN-DUPLICATE', enterpriseId: '7522240', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] }); }, g => { g.data.tenants.push({ tenantId: 'TEN-DUPLICATE', enterpriseId: '7522240', status: '停用', capabilitySet: ['CLOUD_CONTACT_CENTER'] }); }]) {
      const g = setup(); change(g); const before = g.snapshot(); bad(await g.create({ tenantId: undefined })); assert.equal(g.snapshot(), before); assert.equal(g.api.trace().length, 0);
    }
  });
  await check('列表保留手动优先级、移除重复时间类型与共享标签，操作仍按权限保留', async () => {
    for (const role of ['ADMIN', 'SUPER_ADMIN']) {
      const f = pageFixture({ actor: { role } }), html = f.page.render();
      assert(f.view.columns.some(col => col.key === 'priority' && col.label === '优先级')); assert(!f.view.columns.some(col => col.key === 'timeType'));
      assert(!/共享\s*·\s*只读|time-condition-readonly/.test(html));
      const actions = f.view.columns.find(col => col.label === '操作'), applicable = f.view.columns.find(col => col.label === '适用时间');
      for (const row of f.view.rows) {
        const buttons = actions.render(row.id, row), editable = f.api.canEdit(row);
        assert(buttons.includes('>查看</button>')); assert.equal(buttons.includes('>编辑</button>'), editable); assert.equal(buttons.includes('>删除</button>'), editable);
        assert(applicable.render(row.id, row).includes(f.api.summary(row)));
      }
      assert.equal(f.page.open('view', '95001'), true); assert(f.view.layer.includes(f.api.summary(f.row('95001'))));
      assert(f.view.layer.includes(`<dt>优先级</dt><dd>${f.row('95001').priority}</dd>`)); assert(!f.view.layer.includes('<dt>时间类型</dt>'));
      assert(!f.view.layer.includes('平台管理员维护')); assert.equal(f.api.canEdit(f.row('95001')), true);
      assert.equal(f.page.open('edit', '95001'), true); assert(!f.view.layer.includes('id="time-condition-tenantId"'));
      assert.equal(f.page.open('remove', '95001'), true);
      const before = f.snapshot(); assert.equal(f.page.open('edit', '95004'), false); assert.equal(f.snapshot(), before);
    }
  });
  await check('新增优先级必填且默认为空，编辑回填可修改，空值、重复及非正整数均阻断', async () => {
    const f = pageFixture({ actor: { role: 'ADMIN' } });
    assert.equal(f.page.open('create'), true); assert(f.view.layer.includes('time-condition-timeType'));
    const field = f.view.layer.match(/<input\b[^>]*id="time-condition-priority"[^>]*>/)?.[0];
    assert(field); assert(/\brequired\b/.test(field)); assert(field.includes('value=""')); assert(!/\b(?:readonly|disabled)\b/.test(field));
    f.page.setField('name', '页面手动顺序');
    for (const value of ['', '0', '-1', '1.5', String(Number.MAX_SAFE_INTEGER + 1), '4']) {
      const before = f.snapshot(); f.page.setField('priority', value); assert.equal(await f.page.save(), false); assert.equal(f.snapshot(), before); assert(f.view.messages.at(-1).includes('优先级'));
    }
    f.page.setField('priority', '17'); assert.equal(await f.page.save(), true);
    assert.equal(f.view.submissions.at(-1).input.priority, 17); assert.equal(f.api.trace().at(-1).fields.priority, 17);
    const row = f.api.catalog().rows.find(item => item.name === '页面手动顺序'); assert.equal(row.priority, 17);
    assert.equal(f.page.open('edit', row.id), true);
    assert(f.view.layer.match(/<input\b[^>]*id="time-condition-priority"[^>]*>/)?.[0].includes('value="17"'));
    for (const value of ['', '0', '4']) {
      const before = f.snapshot(); f.page.setField('priority', value); assert.equal(await f.page.save(), false); assert.equal(f.snapshot(), before);
    }
    f.page.setField('startTime', '10:00'); f.page.setField('priority', '29'); assert.equal(await f.page.save(), true);
    assert.equal(f.view.submissions.at(-1).input.priority, 29); assert.equal(f.api.trace().at(-1).fields.priority, 29);
    assert.equal(f.row(row.id).priority, 29); assert.equal(f.row(row.id).startTime, '10:00');
  });
  await check('运营仅可读取本租户条件供任务选择，不能维护', async () => {
    const f = setup({ actor: { role: 'OPERATOR' } }), opts = f.optionsFor(); assert.equal(f.api.canAccess(), false); assert(f.api.catalog().rows.every(row => row.tenantIds.includes('TEN-NISSAN-HQ')));
    good(f.api.validateTask({ autoTaskType: 1, allowedTimeIds: ['95003'] }, 'TEN-NISSAN-HQ')); bad(f.api.catalog('TEN-NISSAN-SH'));
    const before = f.snapshot(); bad(await f.create({}, opts)); bad(await f.update('95003', {}, opts)); bad(await f.remove('95003', opts)); assert.equal(f.snapshot(), before);
  });
  await check('无有效会话、错误业务域、未知角色及菜单权限均不能维护', async () => {
    for (const patch of [{ ready: false }, { valid: false }, { accountId: '' }, { sessionId: '' }, { activeDomain: 'SMART_OUTBOUND' }, { role: 'UNKNOWN' }]) {
      const f = setup(), opts = f.optionsFor(), before = f.snapshot(); Object.assign(f.actor, patch); assert.equal(f.api.canAccess(), false); bad(f.api.catalog()); bad(await f.create({}, opts)); assert.equal(f.snapshot(), before);
    }
    const f = setup(), opts = f.optionsFor(); f.controls.menu = false; assert.equal(f.api.canAccess(), false); bad(await f.create({}, opts));
  });
  await check('使用租户必须同账号、启用且开通云联络中心，内置租户不能分配', async () => {
    for (const patch of [{ enterpriseId: 'OTHER' }, { status: '停用' }, { capabilitySet: [] }, { builtIn: true }]) {
      const f = setup(); Object.assign(f.data.tenants[0], patch); const before = f.snapshot(); bad(await f.create()); bad(f.api.catalog('TEN-NISSAN-HQ')); assert.equal(f.snapshot(), before);
    }
    const f = setup(); bad(await f.create({ tenantId: 'TEN-EPI-HQ' })); assert(f.api.tenants().every(row => row.enterpriseId === '7522240'));
  });
  await check('两种任务共用调用时段契约，允许和禁止 ID 采用逗号去重', async () => {
    const f = setup(), result = f.api.validateTask({ autoTaskType: '1', allowedTimeIds: ['95002', '95001', '95001'], forbiddenTimeIds: '95005,95006,95005' }, 'TEN-NISSAN-HQ'); good(result);
    assert.deepEqual(copy(result.fields), { autoTaskType: 1, autoTriggerTimeStrategy: '95002,95001', timeStrategy: '95005,95006' });
    assert.deepEqual(copy(result.snapshot.map(row => row.id)), ['95001', '95002', '95005', '95006']); assert.equal(result.revision, 0); assert.equal(result.context, f.api.context());
    assert.equal(result.snapshot[3].fromDay, '2026-10-01'); result.snapshot[0].name = 'changed'; assert.equal(f.row('95001').name, '工作日营业时间'); assert.equal(f.api.trace().length, 0);
  });
  await check('连续任务省略可呼叫条件，仍可单独配置禁止呼叫时段', async () => {
    const f = setup(); good(f.api.validateTask({}, 'TEN-NISSAN-HQ'));
    const result = f.api.validateTask({ autoTaskType: 0, allowedTimeIds: ['unknown'], forbiddenTimeIds: ['95005'] }, 'TEN-NISSAN-HQ'); good(result);
    assert.deepEqual(copy(result.fields), { autoTaskType: 0, timeStrategy: '95005' }); assert.deepEqual(copy(result.snapshot.map(row => row.id)), ['95005']);
  });
  await check('任务时段要求有效租户内的现有 ID，交集、失效、错格式和错枚举拒绝', async () => {
    const f = setup({ actor: { role: 'ADMIN' } });
    for (const input of [null, [], { autoTaskType: 2 }, { autoTaskType: true }, { autoTaskType: 1 }, { autoTaskType: 1, allowedTimeIds: [] }, { autoTaskType: 1, allowedTimeIds: ['95004'] }, { autoTaskType: 1, allowedTimeIds: ['99999'] }, { autoTaskType: 1, allowedTimeIds: '95001;95002' }, { autoTaskType: 1, allowedTimeIds: '95001, 95002' }, { autoTaskType: 1, allowedTimeIds: ['95001'], forbiddenTimeIds: ['95001'] }, { forbiddenTimeIds: {} }, { forbiddenTimeIds: ['095001'] }]) bad(f.api.validateTask(input, 'TEN-NISSAN-HQ'));
    bad(f.api.validateTask({ autoTaskType: 1, allowedTimeIds: ['95001'] }, 'TEN-NISSAN-SH'));
  });
  await check('超管创建任务只可使用当前企业条件，切换企业后才可选择门店条件', async () => {
    const f = setup(); bad(f.api.validateTask({ autoTaskType: 1, allowedTimeIds: ['95004'] }, 'TEN-NISSAN-HQ')); bad(f.api.validateTask({ autoTaskType: 1, allowedTimeIds: ['95004'] }, 'TEN-NISSAN-SH'));
    f.actor.enterpriseId = '7522241'; f.actor.tenantId = 'TEN-NISSAN-SH'; good(f.api.validateTask({ autoTaskType: 1, allowedTimeIds: ['95004'] }, 'TEN-NISSAN-SH')); bad(f.api.validateTask({ autoTaskType: 1, allowedTimeIds: ['95003'] }, 'TEN-NISSAN-HQ'));
  });
  await check('任务、执行配置、计划快照和供应商请求快照均保护引用', async () => {
    const sections = [fields => fields, fields => ({ values: fields }), fields => ({ executionConfig: fields }), fields => ({ planSnapshot: fields }), fields => ({ alictiCreateDraft: { fields } })];
    for (const wrap of sections) for (const name of ['allowedTimeIds', 'forbiddenTimeIds', 'autoTriggerTimeStrategy', 'timeStrategy']) {
      const f = setup(); f.data.tasks.push(task({ allowedTimeIds: [], ...wrap({ [name]: name.endsWith('Ids') ? ['95003'] : '95003' }) }));
      const used = f.api.usage(f.row()); good(used); assert.equal(used.count, 1); bad(await f.remove('95003'));
    }
  });
  await check('预外呼、自动外呼和会话新建任务都纳入引用检查且重复任务去重', async () => {
    for (const source of ['tasks', 'predictiveTasks', 'ivrTasks', 'session']) {
      const f = setup(); if (source === 'session') f.session.set(createdKey, JSON.stringify([task()])); else f.data[source].push(task());
      assert.equal(f.api.usage(f.row()).count, 1); bad(await f.remove('95003'));
    }
    const f = setup(); f.data.tasks.push(task()); f.data.predictiveTasks.push(task()); f.session.set(createdKey, JSON.stringify([task()])); assert.equal(f.api.usage(f.row()).count, 1);
  });
  await check('执行中和暂停任务保护条件内容；待启动任务允许修改但不能删除', async () => {
    for (const patch of [{ status: '执行中' }, { status: '已暂停' }, { status: '待启动', providerStatusCode: 1 }, { status: '待启动', providerStatusCode: '2' }]) {
      const f = setup(); f.data.tasks.push(task(patch)); assert.equal(f.api.usage(f.row()).blockedActive, true); const before = f.snapshot(); bad(await f.update('95003', { startTime: '10:00' })); bad(await f.remove('95003')); assert.equal(f.snapshot(), before);
    }
    const f = setup(); f.data.tasks.push(task()); assert.equal(f.api.usage(f.row()).blockedActive, false); good(await f.update('95003', { startTime: '10:00' })); bad(await f.remove('95003'));
  });
  await check('结束任务和其他账号相同 ID 不阻断条件删除', async () => {
    for (const patch of [{ status: '已完成' }, { status: '已终止' }, { status: '已删除' }, { status: '已结束' }, { enterpriseId: 'DEMO-ENT-003', status: '执行中' }]) {
      const f = setup(); f.data.tasks.push(task(patch)); assert.equal(f.api.usage(f.row()).count, 0); good(await f.remove('95003'));
    }
  });
  await check('任务草稿也保护已选时段，已完成草稿和其他账号草稿不误占用', async () => {
    const f = setup(); f.session.set(draftsKey, JSON.stringify([{ draftId: 'DRAFT-1', enterpriseId: '7522240', status: '草稿', values: { allowedTimeIds: ['95003'] } }]));
    const used = f.api.usage(f.row()); assert.equal(used.count, 1); assert.equal(used.items[0].kind, '草稿'); bad(await f.remove('95003')); good(await f.update('95003', { startTime: '10:00' }));
    f.session.set(draftsKey, JSON.stringify([{ draftId: 'DRAFT-1', enterpriseId: '7522240', status: '已提交', values: { allowedTimeIds: ['95003'] } }, { draftId: 'DRAFT-2', enterpriseId: 'DEMO-ENT-003', status: '草稿', values: { allowedTimeIds: ['95003'] } }])); good(await f.remove('95003'));
  });
  await check('呼入规则采用分号 ID；停用规则也保护删除，其他账号规则不占用', async () => {
    for (const active of [0, 1]) {
      const f = setup(); f.c.AliCtiInboundMock.rows.push({ id: 'ROUTE', enterpriseId: '7522240', active, ruleTimeProperty: '95002;95003' });
      assert.equal(f.api.usage(f.row()).rules.length, 1); bad(await f.remove('95003'));
    }
    const f = setup(); f.c.AliCtiInboundMock.rows.push({ id: 'ROUTE', enterpriseId: 'DEMO-ENT-003', active: 1, ruleTimeProperty: '95003' }); good(await f.remove('95003'));
  });
  await check('持久化呼入规则同样占用，未知写入结果仅阻断当前企业维护', async () => {
    const f = setup(); f.values.set(inboundKey, JSON.stringify({ rows: [{ id: 'R', enterpriseId: '7522240', active: 0, ruleTimeProperty: '95003' }], pending: [] })); bad(await f.remove('95003'));
    for (const enterpriseId of ['7522240', 'DEMO-ENT-003']) {
      const g = setup(); g.values.set(inboundKey, JSON.stringify({ rows: [], pending: [{ enterpriseId }] })); const result = await g.remove('95003'); if (enterpriseId === '7522240') bad(result); else good(result);
    }
  });
  await check('任务、草稿或呼入引用存储损坏时拒绝编辑删除且保留原资料', async () => {
    for (const [store, name, raw] of [['session', createdKey, '{broken'], ['session', draftsKey, '{}'], ['values', inboundKey, '{broken'], ['values', inboundKey, JSON.stringify({ rows: [] })]]) {
      const f = setup(); f[store].set(name, raw); const before = f.snapshot(); bad(f.api.usage(f.row())); bad(await f.update('95003', { startTime: '10:00' })); bad(await f.remove('95003')); assert.equal(f.snapshot(), before);
    }
  });
  await check('未知或不同账号的条件不允许编辑删除', async () => {
    const f = setup(), before = f.snapshot(); bad(await f.update('99999', {})); bad(await f.remove('99999')); assert.equal(f.snapshot(), before);
    f.actor.enterpriseId = 'DEMO-ENT-003'; f.actor.tenantId = 'TEN-EPI-HQ'; bad(await f.update('95003', {})); bad(await f.remove('95003'));
  });
  await check('旧表单版本和其他标签页保存不能覆盖最新条件', async () => {
    const f = setup(), stale = f.optionsFor(), other = setup({ values: f.values }); good(await other.create()); const before = f.snapshot();
    bad(await f.create({ name: 'another', priority: 11 }, stale)); bad(await f.update('95003', {}, stale)); bad(await f.remove('95003', stale)); assert.equal(f.snapshot(), before);
    good(await f.update('95003', { startTime: '10:00' }));
  });
  await check('账号、会话、租户、企业、权限变化后旧表单拒绝提交', async () => {
    for (const patch of [{ accountId: 'NEW' }, { sessionId: 'NEW' }, { tenantId: 'TEN-NISSAN-SH' }, { enterpriseId: 'DEMO-ENT-003' }, { role: 'ADMIN' }, { valid: false }]) {
      const f = setup(), stale = f.optionsFor(), before = f.snapshot(); Object.assign(f.actor, patch); bad(await f.create({}, stale)); assert.equal(f.snapshot(), before);
    }
  });
  await check('没有上下文或版本保护的直接写入拒绝', async () => {
    const f = setup(), before = f.snapshot(); bad(await f.api.create({}, {})); bad(await f.api.update('95003', {}, { expectedContext: f.api.context() })); bad(await f.api.remove('95003', { expectedRevision: 0 })); assert.equal(f.snapshot(), before);
  });
  await check('等待锁期间目录或会话变化会重新核对，不产生旧范围写入', async () => {
    for (const change of [f => { f.actor.sessionId = 'NEW'; }, f => { alter(f, data => { data.rows.find(row => row.id === '95003').startTime = '11:00'; }); }]) {
      const f = setup(), opts = f.optionsFor(); f.controls.beforeLock = () => { f.controls.beforeLock = null; change(f); }; bad(await f.create({}, opts)); assert.equal(f.api.trace().length, 0); assert(![...f.values.values()].some(raw => raw.includes('独立验证时间条件')));
    }
  });
  await check('锁不可用或已被其他维护占用时拒绝全部写入', async () => {
    const f = setup(), opts = f.optionsFor(); delete f.c.navigator.locks; bad(await f.create({}, opts)); assert.equal(f.values.size, 0);
    const g = setup(); g.held.add(key); const before = g.snapshot(); bad(await g.create()); bad(await g.update('95003', {})); bad(await g.remove('95003')); assert.equal(g.snapshot(), before);
    g.held.delete(key); good(await g.create());
  });
  await check('持久化失败不产生成功回执、不改变现有条件，也不能删除成功', async () => {
    const f = setup(); good(await f.create()); const before = f.snapshot(); f.controls.failWrite = true;
    bad(await f.update('95003', { startTime: '10:00' })); bad(await f.remove('95003')); bad(await f.create({ name: 'NEW', priority: 11 })); assert.equal(f.snapshot(), before);
  });
  await check('损坏目录、重复账号内 ID/名称/优先级及无效日历均拒绝使用', async () => {
    const fixture = copy(setup().c.AliCtiTimeFixtures.rows), variants = ['{broken', JSON.stringify({ version: 2, revision: 1, rows: fixture })];
    for (const change of [d => { d.revision = -1; }, d => { d.rows[1].id = d.rows[0].id; }, d => { d.rows[1].name = d.rows[0].name; }, d => { d.rows[1].priority = d.rows[0].priority; }, d => { d.rows[0].dayOfWeek = '1,1'; }, d => { d.rows[0].timeType = 3; }, d => { d.rows.find(row => Number(row.type) === 2).fromDay = '2026-02-30'; }, d => { d.rows[0].tenantIds = []; }, d => { d.rows[0].startTime = '24:00'; }]) {
      const data = { version: 1, revision: 1, rows: copy(fixture) }; change(data); variants.push(JSON.stringify(data));
    }
    for (const raw of variants) { const f = setup(), opts = f.optionsFor(); f.values.set(key, raw); const before = f.snapshot(); bad(f.api.catalog()); bad(f.api.validateTask({})); bad(await f.create({}, opts)); assert.equal(f.snapshot(), before); }
  });
  await check('已读目录被回退、同版本篡改或移除时不恢复种子覆盖现有记录', async () => {
    for (const change of [f => { const data = JSON.parse(f.values.get(key)); data.revision = 0; f.values.set(key, JSON.stringify(data)); }, f => { const data = JSON.parse(f.values.get(key)); data.rows[0].name = 'tampered'; f.values.set(key, JSON.stringify(data)); }, f => { f.values.delete(key); }]) {
      const f = setup(); good(await f.create()); const opts = f.optionsFor(); change(f); const before = f.snapshot(); bad(f.api.catalog()); bad(await f.update('95003', {}, opts)); assert.equal(f.snapshot(), before);
    }
  });
  await check('缺少种子且没有目录时安全失败，不自动创建任意条件', async () => {
    const f = setup({ withoutFixtures: true }), opts = { expectedContext: f.api.context(), expectedRevision: 0 }; bad(f.api.catalog()); bad(await f.create({}, opts)); assert.equal(f.values.size, 0);
  });
  console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', count: checks.length, failedCount: failures.length, checks, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
