/* Integrates the shipped mock, supplier directory, AppState and tenant form.
 * The fixture substitutes only browser surfaces; permissions and state transitions
 * execute the production prototype code. No network, npm install or real data. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const root = path.join(__dirname, '..');
const CONTEXT = 'unified-call-context-v3';
const IDENTITIES = 'unified-call-demo-identities-v2';
const DIRECTORY = 'alicti-accounts-v3';
const checks = [];
const plain = value => JSON.parse(JSON.stringify(value));

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    clear() { values.clear(); },
    key(index) { return [...values.keys()][index] ?? null; },
    get length() { return values.size; }
  };
}
function shared() {
  let queue = Promise.resolve();
  return {
    local: storage(),
    locks: { request(_name, _options, callback) {
      const task = queue.then(callback);
      queue = task.catch(() => {});
      return task;
    } }
  };
}
function readyContext(overrides = {}) {
  return {
    accountId: 'ACC-SUPER-001', sessionId: 'QA-SUPER-SESSION', profileId: 'super',
    tenantId: 'TENANT-SUPER-BUILTIN', enterpriseId: '7522240',
    activeDomain: 'CLOUD_CONTACT_CENTER', authStage: 'READY', currentPage: 'alicti-accounts',
    ...overrides
  };
}
function fixture(options = {}) {
  const sharedState = options.shared || shared();
  const session = options.session || storage();
  if (options.context) session.setItem(CONTEXT, JSON.stringify(options.context));
  else if (!options.session && options.loggedOut !== true) session.setItem(CONTEXT, JSON.stringify(readyContext()));
  const nodes = new Map(), radios = new Map(), listeners = new Map();
  const toasts = [], layers = [], navigations = [], historyWrites = [], loaded = [], tables = [];
  const node = (id, properties = {}) => {
    const element = { id, value: '', checked: false, hidden: false, dataset: {}, attributes: {}, classList: { add() {}, remove() {}, toggle() {} },
      setAttribute(name, value) { this.attributes[name] = value; }, focus() { this.focused = true; },
      ...properties };
    nodes.set(id, element);
    return element;
  };
  const document = {
    body: { dataset: {}, classList: { toggle() {}, add() {}, remove() {} } },
    getElementById(id) { return nodes.get(id) || null; },
    querySelector(selector) {
      const match = /^input\[name="([^"]+)"\]:checked$/.exec(selector);
      return match && radios.has(match[1]) ? { value: radios.get(match[1]) } : null;
    },
    addEventListener() {}
  };
  const context = {
    console, structuredClone, Date, Map, Set, Promise, URL, JSON, Number, Object, Array,
    encodeURIComponent, setTimeout, clearTimeout, document,
    crypto: { randomUUID: require('crypto').randomUUID },
    navigator: { locks: sharedState.locks }, localStorage: sharedState.local, sessionStorage: session,
    location: { hash: '#alicti-accounts', pathname: '/prototype/index.html', search: '' },
    CustomEvent: class { constructor(type, init = {}) { this.type = type; Object.assign(this, init); this.defaultPrevented = false; }
      preventDefault() { if (this.cancelable) this.defaultPrevented = true; } },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    dispatchEvent(event) { (listeners.get(event.type) || []).forEach(fn => fn(event)); return !event.defaultPrevented; },
    showToast(message, level) { toasts.push({ message, level }); },
    navigateTo(route) { navigations.push(route); },
    fetch() { throw new Error('Context checks must not use the network'); }
  };
  context.window = context;
  context.history = { replaceState(state, _title, url) {
    historyWrites.push({ state: plain(state), url });
    const resolved = new URL(url, 'http://localhost' + context.location.pathname);
    context.location.hash = resolved.hash;
  } };
  context.PlatformUI = {
    escape(value) { return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); },
    help() { return ''; },
    empty(message) { return message; }, status(value) { return String(value); }, pagination() { return ''; },
    pageHeader(title, description) { return title + description; }, toolbar(left, right) { return left + right; },
    table(columns, rows) { tables.push(plain(rows)); return rows.map(row => columns.map(column => column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')).join(' ')).join('\n'); },
    openLayer(id, html) { layers.push({ id, html }); node(id, { innerHTML: html }); },
    closeLayer(id) { nodes.delete(id); }
  };
  vm.createContext(context);
  for (const file of ['mock/data.js', 'js/components/alicti-accounts.js', 'js/app.js', 'js/components/account-tenant-forms.js', 'js/pages/account-tenant.js', 'js/pages/alicti-accounts.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
    loaded.push(file);
  }
  const api = context.AliCtiAccounts, app = context.AppState, data = context.CloudCallData;
  return { context, api, app, data, shared: sharedState, session, toasts, layers, navigations, historyWrites, loaded, tables, node, radios,
    row(enterpriseId) { return api.list().find(row => row.enterpriseId === enterpriseId); },
    writeOptions(row) { return { context: api.captureContext(), ...(row ? { configId: row.configId, expectedVersion: row.version } : {}) }; },
    receiveDirectoryChange() { context.dispatchEvent({ type: 'storage', key: DIRECTORY, storageArea: sharedState.local }); }
  };
}
async function createAccount(f, enterpriseId = '8123456') {
  const result = await f.api.save({ enterpriseId, name: '新接入账号', brandCustomerName: '新品牌',
    credentialConfigured: false, status: 'RUNNING', remark: '上下文集成检查' }, f.writeOptions());
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.row;
}
function fillTenant(f, enterpriseId, name = '新账号总部') {
  for (const [id, value] of Object.entries({ tenantName: name, tenantInstance: enterpriseId, tenantDesc: '新账号首个租户' })) f.node(id, { value });
  f.node('tenantAI', { checked: false });
  f.node('tenantCCC', { checked: true });
  f.radios.set('tenantOrg', 'HEADQUARTERS');
  f.radios.set('tenantCommercialFlag', 'trial');
  f.radios.set('tenantStatus', '启用');
}
function createTenant(f, enterpriseId, name = '新账号总部') {
  const before = f.data.tenants.length, selectedEnterprise = f.app.get().enterpriseId;
  f.context.Pages['account-tenant'].openTenant();
  assert.equal(f.layers.at(-1)?.id, 'tenant-detail', '有效空账号应能打开真实新建租户表单');
  if (!f.app.tenantForEnterprise(selectedEnterprise)) assert.match(f.layers.at(-1).html, new RegExp('value="' + selectedEnterprise + '" selected'));
  else assert(!f.layers.at(-1).html.includes('value="' + selectedEnterprise + '"'));
  fillTenant(f, enterpriseId, name);
  f.context.AccountTenantForms.saveTenant();
  assert.equal(f.data.tenants.length, before + 1, JSON.stringify(f.toasts));
  const tenant = f.data.tenants.find(item => item.enterpriseId === enterpriseId && item.name === name);
  assert(tenant);
  assert.deepEqual(plain(tenant.capabilitySet), ['CLOUD_CONTACT_CENTER']);
  assert(f.data.instances.find(item => item.enterpriseId === enterpriseId).tenantIds.includes(tenant.tenantId));
  assert.equal(f.navigations.at(-1), 'tenants');
  return tenant;
}
async function stopRunning(f) {
  for (const row of f.api.list().filter(item => item.status === 'RUNNING')) {
    const result = await f.api.setStatus(row.configId, 'STOPPED', f.writeOptions(row));
    assert.equal(result.ok, true, JSON.stringify(result));
  }
}
async function check(name, fn) { await fn(); checks.push(name); }

(async () => {
  await check('入口先恢复供应商目录，再恢复AppState租户快照', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const mock = html.indexOf('src="mock/data.js'), directory = html.indexOf('src="js/components/alicti-accounts.js'), app = html.indexOf('src="js/app.js');
    assert(mock >= 0 && directory > mock && app > directory);
    const f = fixture();
    assert.equal(f.app.account().accountId, 'ACC-SUPER-001');
    assert.equal(f.app.effectiveAccess().valid, true);
    assert(f.data.instances.every(row => row.configId));
  });
  await check('企业账号只返回唯一业务租户，总部门店跨账号且超管不占用绑定', () => {
    const f = fixture();
    assert.equal(f.app.tenantForEnterprise('7522240').tenantId, 'TEN-NISSAN-HQ');
    assert.equal(f.app.tenantForEnterprise('7522241').tenantId, 'TEN-NISSAN-SH');
    assert.equal(f.app.tenantForEnterprise('CCC-TEST'), null);
    f.data.tenants.push({ tenantId: 'TENANT-SUPER-BUILTIN', builtIn: true, enterpriseId: '7522240' });
    assert.equal(f.app.tenantForEnterprise('7522240').tenantId, 'TEN-NISSAN-HQ');
    assert.equal(f.app.validateTenantBindings(f.data.tenants).valid, true);
    assert.equal(f.app.currentTenant().tenantId, 'TENANT-SUPER-BUILTIN');
  });
  await check('新增仅显示空闲账号，停用租户仍占用且保存拦截篡改重复绑定', async () => {
    const f = fixture(), row = await createAccount(f);
    f.data.tenants.find(tenant => tenant.tenantId === 'TEN-NISSAN-HQ').status = '停用';
    f.context.AccountTenantForms.openTenant();
    const html = f.layers.at(-1).html, before = plain(f.data.tenants);
    assert(html.includes('value="' + row.enterpriseId + '"'));
    assert(!html.includes('value="7522240"') && !html.includes('value="7522241"'));
    fillTenant(f, '7522240', '不允许重复绑定');
    f.context.AccountTenantForms.saveTenant();
    assert.deepEqual(plain(f.data.tenants), before);
    assert.equal(f.session.getItem(IDENTITIES), null);
    assert.throws(() => f.app.persistManagementData({ ...f.data, tenants: [...f.data.tenants, { ...f.data.tenants[0], tenantId: 'QA-DUPLICATE' }] }), /已绑定/);
  });
  await check('空闲租户允许更换到未占用账号，编辑候选保留自身', async () => {
    const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId);
    const tenant = createTenant(f, source.enterpriseId);
    f.context.AccountTenantForms.openTenant(tenant.tenantId);
    const html = f.layers.at(-1).html;
    assert(html.includes('value="' + source.enterpriseId + '" selected'));
    assert(html.includes('value="' + target.enterpriseId + '"'));
    assert(!html.includes('value="7522240"'));
    fillTenant(f, target.enterpriseId, tenant.name); f.context.AccountTenantForms.saveTenant();
    assert.equal(f.app.tenantForEnterprise(source.enterpriseId), null);
    assert.equal(f.app.tenantForEnterprise(target.enterpriseId).tenantId, tenant.tenantId);
    const restored = fixture({ shared: f.shared, session: f.session });
    assert.equal(restored.app.tenantForEnterprise(target.enterpriseId).tenantId, tenant.tenantId);
  });
  await check('只读分类与号码池默认目录不占用空租户，空存储目录和刷新后仍可改绑', async () => {
    const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
    for (const file of ['js/components/customer-business.js', 'js/components/alicti-number-pools.js']) {
      vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), f.context, { filename: file });
    }
    f.context.AliCtiNumberPoolMock = { entries: { [source.enterpriseId]: [{ id: 8001, name: '只读供应商样例池', comment: '', createTime: '2026-09-30 10:00:00', type: 0, isDefault: 0, numbers: '' }] } };
    assert.equal(f.context.CustomerBusiness.catalog(tenant).rows.length, 3);
    assert.equal(f.context.AliCtiNumberPools.list(tenant.tenantId).rows.length, 1);
    assert.equal(f.shared.local.getItem('customer-business-config-v3'), null);
    assert.equal(f.session.getItem('alicti-hybrid-groups-v1'), null);
    assert(f.session.getItem('alicti-hybrid-groups-request-history-v1'), '只读查询可保存请求记录，但不等于新增业务数据');
    assert.equal(f.app.tenantHasBusinessData(tenant), false);
    f.shared.local.setItem('customer-business-config-v3', JSON.stringify({ version: 3, revision: 0, scopes: [] }));
    f.session.setItem('alicti-hybrid-groups-v1', JSON.stringify({ version: 1, revision: 0, scopes: [] }));
    const reloaded = fixture({ shared: f.shared, session: f.session });
    assert.equal(reloaded.app.tenantHasBusinessData(reloaded.app.tenantForEnterprise(source.enterpriseId)), false);
    reloaded.context.AccountTenantForms.openTenant(tenant.tenantId);
    fillTenant(reloaded, target.enterpriseId, tenant.name); reloaded.context.AccountTenantForms.saveTenant();
    assert.equal(reloaded.app.tenantForEnterprise(target.enterpriseId)?.tenantId, tenant.tenantId);
  });
  await check('新增业务分类、独立字段或空号码池均禁止租户改绑且刷新后保留归属', async () => {
    const cases = [
      ['业务分类', 'customer-business-config-v3', 'local', (f, tenant) => f.context.CustomerBusiness.save({ id: 'qa-business', label: '新业务', codeLabel: '业务单号', enabled: true, fields: [] }, tenant)],
      ['独立字段', 'customer-business-config-v3', 'local', (f, tenant) => f.context.CustomerBusiness.saveField({ id: 'qa-field', label: '业务客户编号', type: 'text', businessKey: '001', enabled: true, options: [] }, tenant)],
      ['空号码池', 'alicti-hybrid-groups-v1', 'session', (f, tenant) => f.context.AliCtiNumberPools.create({ name: '新业务号码池', type: 0, isDefault: 0, numbers: [] }, { tenantId: tenant.tenantId })]
    ];
    for (const [label, key, storageKind, save] of cases) {
      const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
      f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
      for (const file of ['js/components/customer-business.js', 'js/components/alicti-number-pools.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), f.context, { filename: file });
      }
      assert.equal((await save(f, tenant)).ok, true, label);
      const store = storageKind === 'local' ? f.shared.local : f.session, savedResource = store.getItem(key);
      assert(savedResource, label);
      assert.equal(f.app.tenantHasBusinessData(tenant), true, label + ' 应锁定原账号');
      const identitiesBefore = f.session.getItem(IDENTITIES);
      f.context.AccountTenantForms.openTenant(tenant.tenantId);
      assert(!f.layers.at(-1).html.includes('value="' + target.enterpriseId + '"'), label + ' 不显示改绑候选');
      fillTenant(f, target.enterpriseId, tenant.name); f.context.AccountTenantForms.saveTenant();
      assert.equal(tenant.enterpriseId, source.enterpriseId, label + ' 拒绝篡改选择');
      assert.equal(f.session.getItem(IDENTITIES), identitiesBefore);
      const candidate = { ...f.data, tenants: f.data.tenants.map(row => row.tenantId === tenant.tenantId ? { ...row, enterpriseId: target.enterpriseId } : row) };
      assert.throws(() => f.app.persistManagementData(candidate), /已有业务数据/, label);
      const reloaded = fixture({ shared: f.shared, session: f.session });
      assert.equal(reloaded.app.tenantForEnterprise(source.enterpriseId)?.tenantId, tenant.tenantId);
      assert.equal(reloaded.app.tenantHasBusinessData(reloaded.app.tenantForEnterprise(source.enterpriseId)), true, label + ' 刷新后仍锁定');
      assert.throws(() => reloaded.app.persistManagementData(candidate), /已有业务数据/, label);
      assert.equal(store.getItem(key), savedResource, label + ' 原数据未改动');
    }
  });
  await check('其他租户已保存业务目录不会误锁当前空租户', async () => {
    const f = fixture();
    for (const file of ['js/components/customer-business.js', 'js/components/alicti-number-pools.js']) {
      vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), f.context, { filename: file });
    }
    const existing = f.app.tenantForEnterprise('7522240');
    assert.equal(f.context.CustomerBusiness.saveField({ id: 'qa-other', label: '其他租户字段', type: 'text', options: [] }, existing).ok, true);
    assert.equal((await f.context.AliCtiNumberPools.create({ name: '其他租户号码池', type: 0, isDefault: 0 }, { tenantId: existing.tenantId })).ok, true);
    const source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
    assert.equal(f.app.tenantHasBusinessData(tenant), false);
    f.context.AccountTenantForms.openTenant(tenant.tenantId);
    fillTenant(f, target.enterpriseId, tenant.name); f.context.AccountTenantForms.saveTenant();
    assert.equal(tenant.enterpriseId, target.enterpriseId);
  });
  await check('业务分类与号码池存储损坏或读取失败时拒绝改绑并保留原数据', async () => {
    const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
    const candidate = { ...f.data, tenants: f.data.tenants.map(row => row === tenant ? { ...row, enterpriseId: target.enterpriseId } : row) };
    for (const [store, key, version] of [[f.shared.local, 'customer-business-config-v3', 3], [f.session, 'alicti-hybrid-groups-v1', 1]]) {
      for (const raw of ['{', 'null', '[]', JSON.stringify({ version, revision: 0, scopes: {} }), JSON.stringify({ version: 99, revision: 0, scopes: [] }), JSON.stringify({ version, revision: 0, scopes: [null] }), JSON.stringify({ version, revision: 0, scopes: [{ tenantId: tenant.tenantId, enterpriseId: tenant.enterpriseId }] })]) {
        store.setItem(key, raw);
        assert.equal(f.app.tenantHasBusinessData(tenant), true, key + ': ' + raw);
        assert.throws(() => f.app.persistManagementData(candidate), /已有业务数据/);
        assert.equal(store.getItem(key), raw);
      }
      store.removeItem(key);
      const get = store.getItem;
      store.getItem = name => { if (name === key) throw Error('Storage unavailable'); return get(name); };
      assert.equal(f.app.tenantHasBusinessData(tenant), true, key + ' 无法读取时保护');
      assert.throws(() => f.app.persistManagementData(candidate), /已有业务数据/);
      store.getItem = get;
    }
    assert.equal(tenant.enterpriseId, source.enterpriseId);
  });
  await check('空租户改绑写入失败时保留原账号、租户快照和当前范围', async () => {
    const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
    const identitiesBefore = f.session.getItem(IDENTITIES), contextBefore = f.session.getItem(CONTEXT);
    f.context.AccountTenantForms.openTenant(tenant.tenantId);
    fillTenant(f, target.enterpriseId, tenant.name);
    const set = f.session.setItem;
    f.session.setItem = (key, value) => { if (key === IDENTITIES) throw Error('QuotaExceededError'); return set(key, value); };
    f.context.AccountTenantForms.saveTenant();
    assert.equal(tenant.enterpriseId, source.enterpriseId);
    assert.equal(f.app.get().enterpriseId, source.enterpriseId);
    assert.equal(f.session.getItem(IDENTITIES), identitiesBefore);
    assert.equal(f.session.getItem(CONTEXT), contextBefore);
    assert.equal(f.context.document.getElementById('tenantInstance').value, target.enterpriseId);
    assert(f.context.document.getElementById('tenant-detail'), '保存失败保留表单供重试');
  });
  await check('已保存任务及删除墓碑仅存在本地台账时仍保护租户改绑', async () => {
    const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
    const candidate = { ...f.data, tenants: f.data.tenants.map(row => row === tenant ? { ...row, enterpriseId: target.enterpriseId } : row) };
    for (const status of ['未开始', '已删除']) {
      const rows = [{ ...plain(f.data.predictiveTasks[0]), taskId: 'QA-LOCAL-TASK', tenantId: tenant.tenantId, enterpriseId: source.enterpriseId, status, _localTaskRevision: 1 }];
      const raw = JSON.stringify(rows);
      f.shared.local.setItem('cloud-task-created-v1', raw);
      assert.equal(f.session.getItem('cloud-task-created-v1'), null, '不依赖可丢失的会话镜像');
      assert.equal(f.app.tenantHasBusinessData(tenant), true, status);
      assert.throws(() => f.app.persistManagementData(candidate), /已有业务数据/);
      assert.equal(f.shared.local.getItem('cloud-task-created-v1'), raw);
    }
    for (const raw of ['', '{', 'null', '{}', '[null]']) {
      f.shared.local.setItem('cloud-task-created-v1', raw);
      assert.equal(f.app.tenantHasBusinessData(tenant), true, '本地任务台账损坏时保护：' + raw);
      assert.throws(() => f.app.persistManagementData(candidate), /已有业务数据/);
      assert.equal(f.shared.local.getItem('cloud-task-created-v1'), raw);
    }
  });
  await check('任务数组镜像缺失时独立持久记录和删除墓碑仍阻止改绑', async () => {
    const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
    const candidate = { ...f.data, tenants: f.data.tenants.map(row => row === tenant ? { ...row, enterpriseId: target.enterpriseId } : row) };
    const other = { ...plain(f.data.predictiveTasks[0]), _localTaskRevision: 1 };
    f.shared.local.setItem('cloud-task-record-v1:' + encodeURIComponent(other.taskId) + ':1:other', JSON.stringify(other));
    assert.equal(f.app.tenantHasBusinessData(tenant), false, '其他租户独立任务不误锁空租户');
    for (const status of ['待启动', '已删除']) {
      const row = { ...other, taskId: 'QA-INDEPENDENT-TASK', tenantId: tenant.tenantId, enterpriseId: source.enterpriseId, status };
      const key = 'cloud-task-record-v1:' + encodeURIComponent(row.taskId) + ':1:qa', raw = JSON.stringify(row);
      f.shared.local.setItem(key, raw);
      assert.equal(f.shared.local.getItem('cloud-task-created-v1'), null);
      assert.equal(f.session.getItem('cloud-task-created-v1'), null);
      assert.equal(f.app.tenantHasBusinessData(tenant), true, status);
      assert.throws(() => f.app.persistManagementData(candidate), /已有业务数据/);
      const reloaded = fixture({ shared: f.shared, session: f.session });
      assert.equal(reloaded.app.tenantHasBusinessData(reloaded.app.tenantForEnterprise(source.enterpriseId)), true, status + ' 刷新后仍保护');
      assert.equal(f.shared.local.getItem(key), raw);
      f.shared.local.removeItem(key);
    }
  });
  await check('独立任务记录损坏或存储枚举读取失败时禁止改绑并保留原数据', async () => {
    const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
    const candidate = { ...f.data, tenants: f.data.tenants.map(row => row === tenant ? { ...row, enterpriseId: target.enterpriseId } : row) };
    const key = 'cloud-task-record-v1:QA-INDEPENDENT-TASK:1:qa', store = f.shared.local;
    for (const raw of ['', '{', 'null', '{}', '[]', JSON.stringify({ taskId: 'QA-INDEPENDENT-TASK', callType: '预外呼' })]) {
      store.setItem(key, raw);
      assert.equal(f.app.tenantHasBusinessData(tenant), true, raw);
      assert.throws(() => f.app.persistManagementData(candidate), /已有业务数据/);
      assert.equal(store.getItem(key), raw);
    }
    const get = store.getItem;
    store.getItem = name => { if (name === key) throw Error('Storage unavailable'); return get(name); };
    assert.equal(f.app.tenantHasBusinessData(tenant), true, '独立记录无法读取时保护');
    assert.throws(() => f.app.persistManagementData(candidate), /已有业务数据/);
    store.getItem = get;
    store.removeItem(key);
    const enumerate = store.key;
    store.key = () => { throw Error('Storage enumeration unavailable'); };
    assert.equal(f.app.tenantHasBusinessData(tenant), true, '存储目录无法枚举时保护');
    assert.throws(() => f.app.persistManagementData(candidate), /已有业务数据/);
    store.key = enumerate;
    assert.equal(tenant.enterpriseId, source.enterpriseId);
  });
  await check('保存与恢复均拒绝重复绑定和已有业务改绑', async () => {
    const f = fixture(), row = await createAccount(f), baseline = plain(f.data.tenants);
    f.app.persistManagementData();
    const saved = JSON.parse(f.session.getItem(IDENTITIES));
    assert.equal(saved.version, 2);
    for (const mutation of [
      tenants => tenants.push({ ...tenants[0], tenantId: 'QA-DUPLICATE' }),
      tenants => { tenants[0].enterpriseId = row.enterpriseId; }
    ]) {
      const snapshot = plain(saved); mutation(snapshot.tenants);
      assert.throws(() => f.app.persistManagementData(snapshot));
      f.session.setItem(IDENTITIES, JSON.stringify(snapshot));
      const restored = fixture({ shared: f.shared, session: f.session });
      assert.deepEqual(plain(restored.data.tenants), baseline);
    }
  });
  await check('租户创建独立分机业务后也不能通过保存快照改绑', async () => {
    const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
    f.shared.local.setItem('alicti-extension-directory-v2', JSON.stringify({ schemaVersion: 2, revision: 1, rows: [{ tenantId: tenant.tenantId, enterpriseId: tenant.enterpriseId, exten: '8001' }], deleted: [] }));
    assert.equal(f.app.tenantHasBusinessData(tenant), true);
    const tenants = f.data.tenants.map(row => row === tenant ? { ...row, enterpriseId: target.enterpriseId } : row);
    assert.throws(() => f.app.persistManagementData({ ...f.data, tenants }), /已有业务数据/);
  });
  await check('已有空成员外呼组也属于业务，保存与刷新恢复均阻止账号改绑', async () => {
    const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/components/outbound-groups.js'), 'utf8'), f.context);
    const groups = f.context.OutboundGroups;
    const created = groups.create({ name: '已有空成员外呼组', tenantId: tenant.tenantId, memberIdentityIds: [], gno: 'QA1' }, groups.contextKey(), groups.revision());
    assert.equal(created.ok, true, JSON.stringify(created));
    assert.equal(f.app.tenantHasBusinessData(tenant), true);
    const tenants = f.data.tenants.map(row => row === tenant ? { ...row, enterpriseId: target.enterpriseId } : row);
    assert.throws(() => f.app.persistManagementData({ ...f.data, tenants }), /已有业务数据/);
    const reloaded = fixture({ shared: f.shared, session: f.session });
    assert.equal(reloaded.app.tenantHasBusinessData(reloaded.app.tenantForEnterprise(source.enterpriseId)), true);
    assert.throws(() => reloaded.app.persistManagementData({ ...reloaded.data, tenants }), /已有业务数据/);
  });
  await check('队列及技能独立存储恢复前同样保护已有租户绑定', async () => {
    const f = fixture(), source = await createAccount(f), target = await createAccount(f, '8123457');
    f.app.setInstance(source.enterpriseId); const tenant = createTenant(f, source.enterpriseId);
    const candidate = f.data.tenants.map(row => row === tenant ? { ...row, enterpriseId: target.enterpriseId } : row);
    for (const [key, resource] of [
      ['alicti-queue-bindings-v1', { schemaVersion: 1, revision: 1, queues: [{ enterpriseId: source.enterpriseId, tenantId: tenant.tenantId, qno: 'QA1' }], bindings: [] }],
      ['skill-groups-v2:' + source.enterpriseId, { version: 2, enterpriseId: source.enterpriseId, templates: [], groups: [{ enterpriseId: source.enterpriseId, tenantId: tenant.tenantId, physicalGroupId: 'QA-GROUP' }] }]
    ]) {
      f.shared.local.setItem(key, JSON.stringify(resource));
      assert.equal(f.app.tenantHasBusinessData(tenant), true, key);
      assert.throws(() => f.app.persistManagementData({ ...f.data, tenants: candidate }), /已有业务数据/, key);
      f.shared.local.removeItem(key);
    }
  });
  await check('超管范围标题显示唯一业务租户或未绑定状态', async () => {
    const f = fixture(); assert(f.app.effectiveAccess().dataScopeLabel.includes('东风日产总部'));
    assert(!f.app.effectiveAccess().dataScopeLabel.includes('总部与门店'));
    const row = await createAccount(f); f.app.setInstance(row.enterpriseId);
    assert(f.app.effectiveAccess().dataScopeLabel.includes('未绑定业务租户'));
  });
  await check('旧身份样例仅清理旧模块快照，其他演示数据和账号目录保留', async () => {
    const f = fixture(), row = await createAccount(f), old = plain({ version: 1, accounts: f.data.accounts, memberships: f.data.memberships, tenants: f.data.tenants });
    old.tenants.find(tenant => tenant.tenantId === 'TEN-NISSAN-SH').enterpriseId = '7522240';
    f.session.setItem('unified-call-demo-identities-v1', JSON.stringify(old));
    f.session.setItem('unrelated-session', 'keep'); f.shared.local.setItem('unrelated-local', 'keep');
    const directory = f.shared.local.getItem(DIRECTORY), restored = fixture({ shared: f.shared, session: f.session });
    assert.equal(f.session.getItem('unified-call-demo-identities-v1'), null);
    assert.equal(f.session.getItem('unrelated-session'), 'keep'); assert.equal(f.shared.local.getItem('unrelated-local'), 'keep');
    assert.equal(f.shared.local.getItem(DIRECTORY), directory);
    assert(restored.row(row.enterpriseId));
    assert.equal(restored.app.tenantForEnterprise('7522241').tenantId, 'TEN-NISSAN-SH');
  });
  await check('同一登录账号仍可拥有多个租户并在登录时选择总部或门店', () => {
    const f = fixture({ loggedOut: true }), account = f.data.accounts.find(item => item.accountId === 'ACC-ADMIN-018');
    f.node('authUsername', { value: account.loginUsername }); f.node('authPassword', { value: account.password }); f.node('authCaptcha', { value: 'A8CQ' });
    assert.equal(f.app.submitLogin(), true); assert.equal(f.app.get().authStage, 'TENANT');
    assert.deepEqual(plain(f.app.availableTenants().map(tenant => tenant.enterpriseId)).sort(), ['7522240', '7522241']);
    assert.equal(f.app.chooseTenant('TEN-NISSAN-SH'), true);
    assert.equal(f.app.get().enterpriseId, '7522241');
    assert.equal(f.app.get().authStage, 'READY');
    assert.equal(f.app.get().activeDomain, 'CLOUD_CONTACT_CENTER');
    assert.equal(f.app.effectiveAccess().valid, true);
    assert.equal(f.app.isSuper(), false);
  });
  await check('账号列表与详情只读显示唯一租户而非多租户数量入口', () => {
    const f = fixture(), page = f.context.Pages['alicti-accounts'];
    const html = page.render(); assert(html.includes('东风日产总部')); assert(html.includes('上海华东门店'));
    assert(!html.includes('openHistory'));
    page.openDetail(f.row('7522240').configId);
    const detail = f.layers.at(-1).html;
    assert(detail.includes('东风日产总部') && !detail.includes('上海华东门店'));
    assert(!/<(?:input|select|textarea)\b/.test(detail));
    assert.equal(f.api.history(f.row('7522240').configId, 'tenants').length, 1);
  });
  await check('新账号无租户仍可切入云呼叫并用真实表单创建首个租户', async () => {
    const f = fixture(), row = await createAccount(f);
    assert.equal(f.data.tenants.filter(item => item.enterpriseId === row.enterpriseId).length, 0);
    assert.equal(f.app.setInstance(row.enterpriseId), true);
    assert.equal(f.app.get().activeDomain, 'CLOUD_CONTACT_CENTER');
    assert.equal(f.app.effectiveAccess().valid, true);
    assert.equal(f.app.canMenu('cloud.workbench'), true);
    assert.equal(f.app.canMenu('tenants'), true);
    assert.equal(f.app.canAction('tenant.manage'), true);
    const tenant = createTenant(f, row.enterpriseId);
    const saved = JSON.parse(f.session.getItem(IDENTITIES));
    assert(saved.tenants.some(item => item.tenantId === tenant.tenantId));
  });
  await check('租户主菜单从当前账号选择新账号首建，保存后显示正确范围与新记录', async () => {
    const f = fixture(), row = await createAccount(f), page = f.context.Pages['account-tenant'];
    f.app.setCurrentPage('tenants');
    assert.equal(f.app.get().enterpriseId, '7522240');
    assert.match(page.render({ view: 'tenants' }), /openTenant\(\)/);
    const existing = plain(f.data.tenants);
    f.node('tenantKeyword', { value: '原范围的查询条件' }); page.queryTenants();
    const tenant = createTenant(f, row.enterpriseId);
    assert.equal(f.app.get().enterpriseId, row.enterpriseId);
    assert.equal(page.captureNavigationState().tenantKeyword, '');
    page.render({ view: 'tenants' });
    assert(f.tables.at(-1).some(item => item.tenantId === tenant.tenantId));
    assert(f.tables.at(-1).every(item => item.raw.enterpriseId === row.enterpriseId));
    assert.deepEqual(plain(f.data.tenants.filter(item => item.tenantId !== tenant.tenantId)), existing);
    assert.equal(f.data.audits[0].enterpriseId, row.enterpriseId);
  });
  await check('新账号首次绑定后清理先前筛选并定位唯一租户', async () => {
    const f = fixture(), page = f.context.Pages['account-tenant'], row = await createAccount(f);
    f.node('tenantKeyword', { value: '不会命中新增记录' }); page.queryTenants(); page.setTenantPage(2);
    const tenant = createTenant(f, row.enterpriseId, '新增应可见');
    assert.equal(page.captureNavigationState().tenantPage, 1);
    page.render({ view: 'tenants' });
    assert.equal(f.tables.at(-1).length, 1);
    assert.equal(f.tables.at(-1)[0].tenantId, tenant.tenantId);
  });
  await check('同账号编辑保留租户列表筛选条件及页码', () => {
    const f = fixture(), page = f.context.Pages['account-tenant'];
    f.node('tenantKeyword', { value: '总部' }); page.queryTenants(); page.setTenantPage(2);
    const before = page.captureNavigationState();
    page.openTenant('TEN-NISSAN-HQ'); fillTenant(f, '7522240', '总部更新名称'); f.context.AccountTenantForms.saveTenant();
    const after = page.captureNavigationState();
    assert.equal(after.tenantKeyword, before.tenantKeyword);
    assert.equal(after.tenantPage, before.tenantPage);
    assert.equal(f.data.tenants.find(item => item.tenantId === 'TEN-NISSAN-HQ').name, '总部更新名称');
  });
  await check('跨账号新建遇到活动通话保护时先拒绝写入并保留填写内容', async () => {
    const f = fixture(), row = await createAccount(f), count = f.data.tenants.length;
    f.context.Pages['account-tenant'].openTenant(); fillTenant(f, row.enterpriseId);
    let guarded = 0;
    f.context.AgentWorkbench = { allowContextChange() { guarded++; return false; } };
    f.context.AccountTenantForms.saveTenant();
    assert.equal(guarded, 1); assert.equal(f.data.tenants.length, count);
    assert.equal(f.app.get().enterpriseId, '7522240');
    assert(f.context.document.getElementById('tenant-detail'));
    assert.equal(f.context.document.getElementById('tenantName').value, '新账号总部');
    assert.equal(f.session.getItem(IDENTITIES), null);
  });
  await check('跨账号新建遇到其他未保存内容时先拒绝写入', async () => {
    const f = fixture(), row = await createAccount(f), count = f.data.tenants.length;
    f.context.Pages['account-tenant'].openTenant(); fillTenant(f, row.enterpriseId); f.app.setDirty(true);
    f.context.AccountTenantForms.saveTenant();
    assert.equal(f.data.tenants.length, count); assert.equal(f.app.get().enterpriseId, '7522240');
    assert.equal(f.app.get().hasUnsavedChanges, true); assert.equal(f.session.getItem(IDENTITIES), null);
    assert(f.context.document.getElementById('tenant-detail'));
  });
  await check('停用账号不在新增可选项，表单打开后被停用也不能新增关联', async () => {
    const f = fixture(), row = await createAccount(f), count = f.data.tenants.length;
    f.context.Pages['account-tenant'].openTenant(); fillTenant(f, row.enterpriseId);
    assert.equal((await f.api.setStatus(row.configId, 'STOPPED', f.writeOptions(row))).ok, true);
    f.context.AccountTenantForms.saveTenant();
    assert.equal(f.data.tenants.length, count);
    assert.equal(f.app.get().enterpriseId, '7522240');
    f.context.Pages['account-tenant'].openTenant();
    assert(!f.layers.at(-1).html.includes('value="' + row.enterpriseId + '"'));
  });
  await check('已有业务租户保持账号绑定，篡改表单选项也不能迁移', async () => {
    const f = fixture(), row = await createAccount(f), tenant = f.data.tenants.find(item => item.tenantId === 'TEN-NISSAN-HQ');
    f.context.Pages['account-tenant'].openTenant(tenant.tenantId);
    assert.match(f.layers.at(-1).html, /id="tenantInstance" disabled/);
    fillTenant(f, row.enterpriseId, tenant.name); f.context.AccountTenantForms.saveTenant();
    assert.equal(tenant.enterpriseId, '7522240');
    assert.equal(f.app.get().enterpriseId, '7522240');
    assert.equal(f.session.getItem(IDENTITIES), null);
  });
  await check('租户管理员只能查看本租户，不能新建或通过表单保存扩大权限', () => {
    const f = fixture({ context: readyContext({ accountId: 'ACC-ADMIN-018', profileId: 'admin', tenantId: 'TEN-NISSAN-HQ' }) });
    const page = f.context.Pages['account-tenant'], before = plain(f.data.tenants);
    const html = page.render({ view: 'tenants' });
    assert(!html.includes('openTenant()'));
    page.openTenant(); assert.equal(f.layers.length, 0);
    page.openTenant('TEN-NISSAN-HQ'); assert.match(f.layers.at(-1).html, /租户详情/);
    assert(!f.layers.at(-1).html.includes('AccountTenantForms.saveTenant()'));
    fillTenant(f, 'DEMO-ENT-003', '不应保存'); f.context.AccountTenantForms.saveTenant();
    assert.deepEqual(plain(f.data.tenants), before);
    page.openTenant('TEN-EPI-HQ'); assert.equal(f.layers.length, 1);
  });
  await check('跨账号新建存储失败时不改变业务范围、不添加租户且保留表单', async () => {
    const f = fixture(), row = await createAccount(f), before = plain(f.data.tenants);
    f.context.Pages['account-tenant'].openTenant(); fillTenant(f, row.enterpriseId);
    const write = f.session.setItem;
    f.session.setItem = (key, value) => { if (key === IDENTITIES) throw new Error('quota'); write(key, value); };
    f.context.AccountTenantForms.saveTenant();
    assert.deepEqual(plain(f.data.tenants), before);
    assert.equal(f.app.get().enterpriseId, '7522240'); assert(f.context.document.getElementById('tenant-detail'));
  });
  await check('保存后突发切换保护明确提示已保存位置，不假报失败或重复新增', async () => {
    const f = fixture(), row = await createAccount(f), count = f.data.tenants.length;
    f.context.Pages['account-tenant'].openTenant(); fillTenant(f, row.enterpriseId);
    const notify = f.app.notify;
    f.app.notify = () => { notify(); f.app.setDirty(true); };
    f.context.AccountTenantForms.saveTenant();
    assert.equal(f.data.tenants.length, count + 1); assert.equal(f.app.get().enterpriseId, '7522240');
    assert.match(f.toasts.at(-1).message, /租户已保存到.*请切换至该账号查看/);
    f.context.AccountTenantForms.saveTenant(); assert.equal(f.data.tenants.length, count + 1);
  });
  for (const failedKey of [CONTEXT, 'unified-call-demo-preferences-v1']) await check('正式保存后' + failedKey + '写入失败保留结果并明确提示且可刷新恢复', async () => {
    const f = fixture(), row = await createAccount(f), before = f.data.tenants.length;
    f.context.Pages['account-tenant'].openTenant(); fillTenant(f, row.enterpriseId);
    const write = f.session.setItem;
    f.session.setItem = (key, value) => { if (key === failedKey) throw new Error('quota'); write(key, value); };
    let controls = 0, redraws = 0;
    const render = f.app.renderControls;
    f.app.renderControls = () => { controls++; render(); };
    f.context.RouteRuntime = { refreshCurrent() { redraws++; f.context.Pages['account-tenant'].render({ view: 'tenants' }); } };
    assert.doesNotThrow(() => f.context.AccountTenantForms.saveTenant());
    const tenant = f.data.tenants.find(item => item.enterpriseId === row.enterpriseId && item.name === '新账号总部');
    assert(tenant); assert.equal(f.data.tenants.length, before + 1);
    assert(JSON.parse(f.session.getItem(IDENTITIES)).tenants.some(item => item.tenantId === tenant.tenantId));
    assert.match(f.toasts.at(-1).message, /租户已保存到.*请刷新或切换至该账号查看/);
    assert(!f.toasts.some(item => /保存失败/.test(item.message)));
    assert(controls > 0 && redraws > 0);
    assert.equal(f.context.document.body.dataset.instance, f.app.get().enterpriseId);
    assert(f.tables.at(-1).every(item => item.raw.enterpriseId === f.app.get().enterpriseId));
    assert(!f.context.document.getElementById('tenant-detail'));
    f.context.AccountTenantForms.saveTenant(); assert.equal(f.data.tenants.length, before + 1);
    f.session.setItem = write;
    const restored = fixture({ shared: f.shared, session: f.session });
    assert(restored.data.tenants.some(item => item.tenantId === tenant.tenantId));
    assert.equal(restored.app.setInstance(row.enterpriseId), true);
    assert.equal(restored.context.Pages['account-tenant'].showSavedTenant(tenant.tenantId), true);
  });
  await check('刷新恢复新增账号及首个租户，保留当前账号和租户快照编辑', async () => {
    const original = fixture(), row = await createAccount(original);
    assert.equal(original.app.setInstance(row.enterpriseId), true);
    const tenant = createTenant(original, row.enterpriseId);
    original.data.tenants.find(item => item.tenantId === 'TEN-NISSAN-HQ').name = '已编辑总部名称';
    original.app.persistManagementData();
    const restored = fixture({ shared: original.shared, session: original.session });
    assert.equal(restored.row(row.enterpriseId).configId, row.configId);
    assert.equal(restored.data.tenants.find(item => item.tenantId === tenant.tenantId)?.enterpriseId, row.enterpriseId);
    assert.equal(restored.data.tenants.find(item => item.tenantId === 'TEN-NISSAN-HQ').name, '已编辑总部名称');
    assert(restored.row(row.enterpriseId).tenantIds.includes(tenant.tenantId));
    assert.equal(restored.app.get().enterpriseId, row.enterpriseId);
    assert.equal(restored.app.effectiveAccess().valid, true);
    assert.equal(restored.app.canAction('tenant.manage'), true);
  });
  await check('账号目录先恢复再恢复租户，保留ID版本及当前业务范围', async () => {
    const original = fixture(), row = await createAccount(original);
    assert.equal(original.app.setInstance(row.enterpriseId), true);
    const tenant = createTenant(original, row.enterpriseId);
    const prior = JSON.parse(original.shared.local.getItem(DIRECTORY));
    const raw = JSON.stringify(prior);
    original.shared.local.setItem(DIRECTORY, raw);
    const restored = fixture({ shared: original.shared, session: original.session });
    assert.equal(restored.api.storageError(), '');
    assert.equal(restored.api.getRevision(), prior.revision);
    assert.equal(restored.row(row.enterpriseId).configId, row.configId);
    assert.equal(restored.row(row.enterpriseId).version, row.version);
    assert(restored.data.instances.every(account => !Object.hasOwn(account, 'regionCode') && !Object.hasOwn(account, 'region')));
    assert.equal(restored.data.tenants.find(item => item.tenantId === tenant.tenantId)?.enterpriseId, row.enterpriseId);
    assert(restored.row(row.enterpriseId).tenantIds.includes(tenant.tenantId));
    assert.equal(restored.app.get().enterpriseId, row.enterpriseId);
    assert.equal(restored.app.effectiveAccess().valid, true);
    const changed = await restored.api.save({ enterpriseId: row.enterpriseId, name: '调整账号名称',
      credentialConfigured: false, remark: '无区域编辑' }, restored.writeOptions(restored.row(row.enterpriseId)));
    assert.equal(changed.ok, true);
    assert.equal(changed.row.brandCustomerName, row.brandCustomerName);
    assert.equal(changed.row.version, row.version + 1);
    assert.equal(restored.data.tenants.find(item => item.tenantId === tenant.tenantId)?.enterpriseId, row.enterpriseId);
  });
  await check('旧区域账号记录与当前目录不一致即拒绝并保留原存储', async () => {
    const original = fixture(), row = await createAccount(original);
    const prior = JSON.parse(original.shared.local.getItem(DIRECTORY));
    prior.accounts.forEach((account, index) => { account.regionCode = [1, 2, 5, 6][index % 4]; });
    const raw = JSON.stringify(prior);
    original.shared.local.setItem(DIRECTORY, raw);
    const restored = fixture({ shared: original.shared, session: original.session });
    assert.equal(restored.api.storageError(), '账号配置存储格式无效，当前目录未被覆盖');
    assert.equal(restored.shared.local.getItem(DIRECTORY), raw, '拒绝旧区域记录不得自动重写存储');
    assert(restored.data.instances.every(account => !Object.hasOwn(account, 'regionCode') && !Object.hasOwn(account, 'region')));
  });
  await check('账号全部停用仍保留超管入口，可重新启用并恢复业务范围', async () => {
    const f = fixture();
    await stopRunning(f);
    assert.equal(f.app.availableInstances().length, 0);
    assert.equal(f.app.isReady(), true);
    assert.equal(f.app.isSuper(), true);
    assert.equal(f.app.effectiveAccess().valid, false);
    assert.equal(f.app.get().currentPage, 'alicti-accounts');
    assert.equal(f.app.canMenu('system.instances'), true);
    assert.equal(f.app.canAction('instance.manage'), true);
    const row = f.row('7522240');
    assert.equal((await f.api.setStatus(row.configId, 'RUNNING', f.writeOptions(row))).ok, true);
    assert.equal(f.app.setInstance(row.enterpriseId), true);
    assert.equal(f.app.effectiveAccess().valid, true);
    assert.equal(f.app.canMenu('tenants'), true);
  });
  await check('全部停用后刷新或重新登录均能进入超管恢复入口', async () => {
    const f = fixture();
    await stopRunning(f);
    const reloaded = fixture({ shared: f.shared, session: f.session });
    assert.equal(reloaded.app.isSuper(), true);
    assert.equal(reloaded.app.canAction('instance.manage'), true);
    assert.equal(reloaded.app.get().currentPage, 'alicti-accounts');
    const login = fixture({ shared: f.shared, loggedOut: true });
    assert.equal(login.app.isReady(), false);
    const superAccount = login.data.accounts.find(item => item.accountId === 'ACC-SUPER-001');
    login.node('authUsername', { value: superAccount.loginUsername });
    login.node('authPassword', { value: superAccount.password });
    login.node('authCaptcha', { value: 'A8CQ' });
    assert.equal(login.app.submitLogin(), true);
    assert.equal(login.app.get().currentPage, 'alicti-accounts');
    assert.equal(login.app.canAction('instance.manage'), true);
    const row = login.row('7522240');
    assert.equal((await login.api.setStatus(row.configId, 'RUNNING', login.writeOptions(row))).ok, true);
    assert.equal(login.app.setInstance(row.enterpriseId), true);
    assert.equal(login.app.effectiveAccess().valid, true);
  });
  await check('真实管理员和运营角色不能管理或跨账号读取/切换', async () => {
    for (const profile of [
      { accountId: 'ACC-ADMIN-018', profileId: 'admin', tenantId: 'TEN-NISSAN-HQ' },
      { accountId: 'ACC-OPS-066', profileId: 'operator', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241' }
    ]) {
      const f = fixture({ context: readyContext(profile) });
      assert.equal(f.app.effectiveAccess().valid, true);
      assert.equal(f.app.isSuper(), false);
      assert.equal(f.app.canMenu('system.instances'), false);
      assert.equal(f.app.canAction('instance.manage'), false);
      assert.equal(f.app.openSupplierAccounts(), false);
      assert.equal(f.app.setInstance('DEMO-ENT-003'), false);
      assert.deepEqual(plain(f.api.list().map(row => row.enterpriseId)), [profile.enterpriseId || '7522240']);
      const foreign = f.data.instances.find(row => row.enterpriseId === 'DEMO-ENT-003');
      assert.equal(f.api.find(foreign.configId), null);
      assert.equal((await f.api.setStatus(foreign.configId, 'STOPPED', f.writeOptions(foreign))).ok, false);
      assert.equal((await f.api.save({ enterpriseId: '8123456', name: '越权新增', credentialConfigured: false }, f.writeOptions())).ok, false);
      assert.equal(f.app.get().enterpriseId, profile.enterpriseId || '7522240');
      assert.equal(f.shared.local.getItem(DIRECTORY), null);
    }
  });
  await check('编辑未保存时拒绝切换账号且保留页面、范围和草稿标记', () => {
    const f = fixture();
    f.app.setCurrentPage('alicti-accounts');
    f.app.setDirty(true);
    let notifications = 0;
    f.app.subscribe(() => notifications++);
    const before = plain(f.app.get()), stored = f.session.getItem(CONTEXT);
    assert.equal(f.app.setInstance('DEMO-ENT-003'), false);
    assert.deepEqual(plain(f.app.get()), before);
    assert.equal(f.session.getItem(CONTEXT), stored);
    assert.equal(f.historyWrites.length, 0);
    assert.equal(notifications, 0);
    assert.equal(f.toasts.at(-1).level, 'warning');
  });
  await check('重复选择当前账号是无副作用操作，保留脏标记及当前页面', () => {
    const f = fixture();
    f.app.setCurrentPage('tenants');
    f.app.setDirty(true);
    let notifications = 0, workbenchChecks = 0;
    f.app.subscribe(() => notifications++);
    f.context.AgentWorkbench = { allowContextChange() { workbenchChecks++; return false; } };
    const before = plain(f.app.get()), stored = f.session.getItem(CONTEXT);
    assert.equal(f.app.setInstance('7522240'), true);
    assert.deepEqual(plain(f.app.get()), before);
    assert.equal(f.session.getItem(CONTEXT), stored);
    assert.equal(f.toasts.length, 0);
    assert.equal(f.historyWrites.length, 0);
    assert.equal(notifications, 0);
    assert.equal(workbenchChecks, 0);
  });
  await check('另一标签停用当前账号后超管可恢复，普通用户不能访问该业务范围', async () => {
    const s = shared(), writer = fixture({ shared: s }), reader = fixture({ shared: s });
    const operator = fixture({ shared: s, context: readyContext({ accountId: 'ACC-OPS-108', tenantId: 'TEN-NISSAN-HQ' }) });
    const row = writer.row('7522240');
    assert.equal((await writer.api.setStatus(row.configId, 'STOPPED', writer.writeOptions(row))).ok, true);
    reader.receiveDirectoryChange();
    operator.receiveDirectoryChange();
    assert.equal(reader.app.effectiveAccess().valid, false);
    assert.equal(reader.app.get().currentPage, 'alicti-accounts');
    assert.equal(reader.app.canAction('instance.manage'), true);
    assert.equal(operator.app.effectiveAccess().valid, false);
    assert.equal(operator.app.canMenu('cloud.workbench'), false);
    assert.equal(operator.app.canAction('instance.manage'), false);
    assert.equal(operator.api.list().length, 0);
    assert.equal(operator.app.setInstance('DEMO-ENT-003'), false);
  });
  await check('管理范围候选只列有效业务租户，内置租户和未绑定账号不冒充租户', async () => {
    const f = fixture(), unbound = await createAccount(f);
    const expected = f.data.tenants.filter(tenant => !tenant.builtIn && tenant.tenantId !== 'TENANT-SUPER-BUILTIN' && tenant.status === '启用' &&
      f.data.instances.some(account => account.enterpriseId === tenant.enterpriseId && account.status === 'RUNNING')).map(tenant => tenant.tenantId).sort();
    assert.deepEqual(plain(f.app.managedTenants().map(tenant => tenant.tenantId)).sort(), plain(expected));
    assert(!f.app.managedTenants().some(tenant => tenant.enterpriseId === unbound.enterpriseId));
    f.data.tenants.push({ tenantId: 'QA-ORPHAN-TENANT', enterpriseId: 'MISSING-ACCOUNT', name: '孤立租户', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] });
    f.data.tenants.push({ tenantId: 'QA-NO-ACCOUNT', enterpriseId: '', name: '未绑定租户', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] });
    assert(!f.app.managedTenants().some(tenant => ['QA-ORPHAN-TENANT', 'QA-NO-ACCOUNT'].includes(tenant.tenantId)));
    assert.equal(f.app.managedTenant()?.tenantId, 'TEN-NISSAN-HQ');
    assert.equal(f.app.setInstance(unbound.enterpriseId), true, '供应商配置仍可进入未绑定账号');
    assert.equal(f.app.managedTenant(), null, '未绑定供应商账号不能显示为业务租户');
    assert.equal(f.app.setManagedTenant(unbound.enterpriseId), false, '新入口只接受租户 ID');
  });
  await check('管理租户实时排除停用租户及停用账号，过期候选不能切入', async () => {
    const f = fixture(), target = f.data.tenants.find(tenant => tenant.tenantId === 'TEN-NISSAN-SH');
    target.status = '停用';
    assert(!f.app.managedTenants().some(tenant => tenant.tenantId === target.tenantId));
    assert.equal(f.app.setManagedTenant(target.tenantId), false);
    assert.equal(f.app.get().enterpriseId, '7522240');
    target.status = '启用';
    assert(f.app.managedTenants().some(tenant => tenant.tenantId === target.tenantId));
    const account = f.row(target.enterpriseId);
    assert.equal((await f.api.setStatus(account.configId, 'STOPPED', f.writeOptions(account))).ok, true);
    assert(!f.app.managedTenants().some(tenant => tenant.tenantId === target.tenantId));
    assert.equal(f.app.setManagedTenant(target.tenantId), false);
    assert.equal(f.app.get().enterpriseId, '7522240');
  });
  await check('顶部管理范围按租户名称呈现，选项值为租户且隐藏内置超级租户及供应商范围', () => {
    const f = fixture();
    const ids = ['tenantContext', 'currentTenantLabel', 'currentRoleLabel', 'instanceContext', 'instanceSwitcher', 'scopeLabel', 'currentUserLabel'];
    const nodes = Object.fromEntries(ids.map(id => [id, f.node(id)]));
    f.app.renderControls();
    assert.equal(nodes.instanceContext.hidden, false); assert.equal(nodes.tenantContext.hidden, true); assert.equal(nodes.scopeLabel.hidden, true);
    const options = nodes.instanceSwitcher.innerHTML;
    for (const tenant of f.app.managedTenants()) {
      assert(options.includes('value="' + tenant.tenantId + '"'));
      assert(options.includes(tenant.name)); assert(!options.includes(tenant.enterpriseId));
    }
    assert(!options.includes('TENANT-SUPER-BUILTIN')); assert(!options.includes('超级管理租户'));
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const control = html.match(/<label[^>]+id="instanceContext"[\s\S]*?<\/label>/)?.[0] || '';
    assert.match(control, /租户/); assert.match(control, /AppState\.setManagedTenant\(this\.value\)/);
    assert(!control.includes('AliCti 账号'));
  });
  await check('租户切换复用账号隔离并清理任务与返回上下文，刷新后恢复所选业务租户', () => {
    const f = fixture(); let cleared = 0, notified = 0;
    f.context.CloudTaskWorkspace = { clearActiveContext() { cleared++; } };
    f.app.beginConfiguration('number-pools', { contextType: 'wizard', fromRoute: 'cloud-task-center', tenantId: 'TEN-NISSAN-HQ' });
    f.app.subscribe(() => notified++);
    assert.equal(f.app.setManagedTenant('TEN-NISSAN-SH'), true);
    assert.equal(f.app.get().enterpriseId, '7522241'); assert.equal(f.app.managedTenant()?.tenantId, 'TEN-NISSAN-SH');
    assert.equal(f.app.currentTenant().tenantId, 'TENANT-SUPER-BUILTIN', '保持既有超级管理身份模型');
    assert.equal(f.app.getReturnContext(), null); assert.equal(cleared, 1); assert.equal(notified, 1);
    assert.equal(f.app.get().currentPage, 'home'); assert.equal(f.context.location.hash, '#home');
    const rows = [
      { tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240' },
      { tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241' },
      { tenantId: 'TEN-EPI-HQ', enterpriseId: 'DEMO-ENT-003' }
    ];
    assert.deepEqual(plain(f.app.scoped(rows)), [rows[1]]);
    const reloaded = fixture({ shared: f.shared, session: f.session });
    assert.equal(reloaded.app.managedTenant()?.tenantId, 'TEN-NISSAN-SH');
    assert.equal(reloaded.app.get().enterpriseId, '7522241'); assert.equal(reloaded.app.effectiveAccess().valid, true);
    assert.deepEqual(plain(reloaded.app.scoped(rows)), [rows[1]]);
  });
  await check('租户切换保留未保存与活动通话保护，重复选择当前租户无副作用', () => {
    const f = fixture(); f.app.setCurrentPage('tenants'); f.app.setDirty(true);
    const before = plain(f.app.get()), saved = f.session.getItem(CONTEXT);
    assert.equal(f.app.setManagedTenant('TEN-NISSAN-SH'), false);
    assert.deepEqual(plain(f.app.get()), before); assert.equal(f.session.getItem(CONTEXT), saved);
    let guarded = 0; f.context.AgentWorkbench = { allowContextChange() { guarded++; return false; } };
    assert.equal(f.app.setManagedTenant('TEN-NISSAN-HQ'), true);
    assert.deepEqual(plain(f.app.get()), before); assert.equal(guarded, 0);
    f.app.setDirty(false); const beforeCall = plain(f.app.get());
    assert.equal(f.app.setManagedTenant('TEN-NISSAN-SH'), false); assert.equal(guarded, 1);
    assert.deepEqual(plain(f.app.get()), beforeCall);
  });
  await check('超级管理员登录范围按租户选择，登录 HTML 不展示供应商编号', () => {
    const f = fixture({ loggedOut: true }), account = f.data.accounts.find(item => item.accountId === 'ACC-SUPER-001');
    account.lastEnterpriseId = '';
    const gateway = f.node('authGateway');
    f.node('authUsername', { value: account.loginUsername }); f.node('authPassword', { value: account.password }); f.node('authCaptcha', { value: 'A8CQ' });
    assert.equal(f.app.submitLogin(), true); assert.equal(f.app.isReady(), false);
    const html = gateway.innerHTML;
    assert.match(html, /选择[^<]*租户/); assert(!html.includes('选择 AliCti 账号'));
    for (const tenant of f.app.managedTenants()) {
      assert(html.includes("chooseManagedTenant('" + tenant.tenantId + "')"));
      assert(html.includes(tenant.name)); assert(!html.includes(tenant.enterpriseId));
    }
    assert.equal(f.app.chooseManagedTenant('TENANT-SUPER-BUILTIN'), false);
    assert.equal(f.app.chooseManagedTenant('7522241'), false);
    assert.equal(f.app.chooseManagedTenant('TEN-NISSAN-SH'), true);
    assert.equal(f.app.isReady(), true); assert.equal(f.app.managedTenant()?.tenantId, 'TEN-NISSAN-SH');
    assert.equal(f.app.get().enterpriseId, '7522241');
  });
  await check('普通管理员和运营仅见授权租户，新管理租户入口不能扩大权限或会话内换租户', () => {
    for (const profile of [
      { accountId: 'ACC-ADMIN-018', profileId: 'admin', tenantId: 'TEN-NISSAN-HQ' },
      { accountId: 'ACC-OPS-066', profileId: 'operator', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241' }
    ]) {
      const f = fixture({ context: readyContext(profile) }), before = plain(f.app.get());
      const authorized = new Set(f.app.availableTenants().filter(tenant => f.data.instances.some(account => account.enterpriseId === tenant.enterpriseId && account.status === 'RUNNING')).map(tenant => tenant.tenantId));
      assert(f.app.managedTenants().every(tenant => authorized.has(tenant.tenantId)));
      assert.equal(f.app.managedTenant()?.tenantId, profile.tenantId);
      assert.equal(f.app.setManagedTenant('TEN-EPI-HQ'), false); assert.equal(f.app.chooseManagedTenant('TEN-EPI-HQ'), false);
      assert.equal(f.app.setManagedTenant(profile.tenantId === 'TEN-NISSAN-HQ' ? 'TEN-NISSAN-SH' : 'TEN-NISSAN-HQ'), false);
      assert.deepEqual(plain(f.app.get()), before);
      const switcher = f.node('instanceContext'), tenantContext = f.node('tenantContext'); f.node('currentTenantLabel'); f.app.renderControls();
      assert.equal(switcher.hidden, true); assert.equal(tenantContext.hidden, false);
    }
  });
  console.log(JSON.stringify({ result: 'pass', count: checks.length, checks }, null, 2));
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
