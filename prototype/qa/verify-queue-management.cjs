/* Queue management integration with real index scripts, AppState and role navigation. No network. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const base = path.resolve(__dirname, '..'), checks = [], failures = [];
const files = [...fs.readFileSync(path.join(base, 'index.html'), 'utf8').matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
const clone = value => JSON.parse(JSON.stringify(value)), storageKey = 'alicti-queue-bindings-v1';
async function check(name, fn) { try { await fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.stack }); } }
function fixture(options = {}) {
  const local = options.local || new Map(), session = options.session || new Map(), timers = new Map(), layers = new Map(), nodes = new Map();
  let timerId = 0, uuid = 0;
  session.set('alicti-demo-v2:unified-call-context-v3', JSON.stringify({ accountId: 'ACC-ADMIN-018', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', ...options.scope, sessionId: 'queue-management-test', activeDomain: options.domain || 'CLOUD_CONTACT_CENTER', authStage: 'READY', currentPage: 'home' }));
  class Storage {
    constructor(map) { this.map = map; }
    getItem(key) { return this.map.get(String(key)) ?? null; }
    setItem(key, value) { this.map.set(String(key), String(value)); }
    removeItem(key) { this.map.delete(String(key)); }
    clear() { this.map.clear(); }
    key(index) { return [...this.map.keys()][index] ?? null; }
    get length() { return this.map.size; }
  }
  const element = () => ({ style: {setProperty(key,value){this[key]=value;},removeProperty(key){delete this[key];}}, dataset: {}, value: '', checked: false, hidden: false, innerHTML: '', textContent: '', isConnected: true, scrollTop: 0, childNodes: [],
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, append() {}, prepend() {}, appendChild() {}, insertBefore() {}, remove() {}, addEventListener() {}, setAttribute() {}, getAttribute: () => null,
    querySelector: () => null, querySelectorAll: () => [], scrollIntoView() {}, focus() {}, getBoundingClientRect: () => ({ width: 1440, height: 1000 }) });
  for (const id of ['page-content', 'businessNavigation', 'breadcrumb']) nodes.set(id, element());
  const liveHtml = () => [...layers.values(), nodes.get('page-content').innerHTML].join('');
  const find = id => {
    if (nodes.has(id)) return nodes.get(id);
    if (layers.has(id) || liveHtml().includes(`id="${id}"`)) { const node = element(); nodes.set(id, node); return node; }
    return null;
  };
  const document = { addEventListener() {}, dispatchEvent() {}, getElementById: find, querySelector: () => null, querySelectorAll: () => [], createElement: element, createTreeWalker: () => ({ nextNode: () => null }), documentElement: element(), body: element(), head: element(), activeElement: null };
  const ctx = { URL, URLSearchParams, structuredClone, console, Date, Storage, localStorage: new Storage(local), sessionStorage: new Storage(session), document,
    navigator: { locks: { request: (_key, _options, fn) => Promise.resolve(fn({ name: 'test-queue-lock' })) } }, NodeFilter: { SHOW_TEXT: 4 },
    location: { hash: '#queue-management', search: '', pathname: '/index.html', href: 'http://localhost/index.html' }, history: { replaceState() {}, pushState() {} },
    crypto: { randomUUID: () => String(++uuid).padStart(8, '0') + '-0000-4000-8000-000000000000' }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }, addEventListener() {}, dispatchEvent() {},
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id), setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: false, addEventListener() {} }), MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} },
    fetch() { throw Error('Unexpected network request'); }, performance: { now: () => Date.now() }, innerWidth: 1440, innerHeight: 1000 };
  ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), ctx, { filename: file });
  const tables = [], toasts = [], secondary = [], table = ctx.PlatformUI.table;
  ctx.PlatformUI.table = (columns, rows, ...rest) => { tables.push(clone(rows)); return table(columns, rows, ...rest); };
  ctx.PlatformUI.openLayer = (id, html) => { layers.set(id, html); nodes.set(id, element()); };
  ctx.PlatformUI.confirm = options => { layers.set(options.id, options.body); nodes.set(options.id, {...element(), options}); };
  ctx.PlatformUI.closeLayer = id => { layers.delete(id); nodes.delete(id); };
  ctx.showToast = (message, kind) => toasts.push({ message, kind });
  ctx.test = { local, session, layers, timers, nodes, tables, toasts, secondary,
    page: nodes.get('page-content'), nav: nodes.get('businessNavigation'),
    render() { const html = ctx.QueueManagement.render(); nodes.get('page-content').innerHTML = html; return html; },
    rows: () => tables.at(-1) || [], saved: () => ctx.localStorage.getItem(storageKey),
    interceptSecondary() { ctx.RouteRuntime.openSecondary = (key, options) => { secondary.push({ key, options: clone(options || {}) }); return true; }; }
  };
  return ctx;
}
const admin = () => fixture(), storeAdmin = () => fixture({ scope: { tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241' } }), superAdmin = (enterpriseId = '7522240') => fixture({ scope: { accountId: 'ACC-SUPER-001', tenantId: enterpriseId === '7522241' ? 'TEN-NISSAN-SH' : 'TEN-NISSAN-HQ', enterpriseId } });
function savedSnapshot(c) { return JSON.stringify({ storage: c.test.saved(), queues: c.AliCtiQueues.catalog() }); }
(async () => {
  await check('真实入口按顺序加载队列服务、详情组件和队列管理页面', () => {
    const c = admin(); assert(c.QueueManagement && c.QueueDetail && c.Pages['queue-management']);
    for (const dependency of ['js/components/alicti-queues.js', 'js/components/queue-detail.js']) assert(files.indexOf(dependency) >= 0 && files.indexOf(dependency) < files.indexOf('js/pages/queue-management.js'));
  });
  await check('队列管理归属坐席与技能组，总部和门店管理员均能直接导航', () => {
    for (const c of [admin(), storeAdmin(), superAdmin()]) {
      assert(!c.UnifiedCallMenu.some(row => ['queue-management','numbers','extensions'].includes(row.key)));
      const item = c.UnifiedCallMenu.find(row => row.key === 'agents').children.find(row => row.key === 'queue-management'); assert(item && !item.children);
      const system = c.UnifiedCallMenu.find(row => row.key === 'system');
      const numbers = system.children.find(row => row.key === 'numbers'), extensions = system.children.find(row => row.key === 'extensions');
      assert(numbers && extensions && !numbers.children && !extensions.children);
      assert.equal(numbers.permission, 'resources.numbers'); assert.equal(extensions.permission, 'resources.extensions');
      const isSuper = c.AppState.effectiveAccess().roleCode === 'SUPER_ADMIN';
      assert.equal(c.AppState.canMenu('resources.numbers'), isSuper); assert.equal(c.AppState.canMenu('resources.extensions'), true);
      assert.equal(c.RouteRuntime.routes['queue-management'].parent, 'agents'); assert.equal(c.RouteRuntime.routes.numbers.parent, 'system'); assert.equal(c.RouteRuntime.routes.extensions.parent, 'system');
      assert.deepEqual(Array.from(c.RouteRuntime.routes.numbers.breadcrumb), ['系统管理', '号码管理']);
      assert.deepEqual(Array.from(c.RouteRuntime.routes.extensions.breadcrumb), ['系统管理', '分机管理']); assert.equal(item.permission, 'settings.queues');
      assert.equal(c.RouteRuntime.canRoute('extensions'), true); assert.equal(c.RouteRuntime.openPrimary('extensions'), true);
      assert(c.test.nav.innerHTML.includes('data-route="extensions"')); assert.equal(c.test.nav.innerHTML.includes('data-route="numbers"'), isSuper);
      assert(c.test.page.innerHTML.includes('分机管理')); assert.equal(c.AppState.get().currentPage, 'extensions'); assert.equal(c.RouteRuntime.secondaryDepth(), 0);
      assert.equal(c.RouteRuntime.canRoute('numbers'), isSuper);
      if (!isSuper) { assert.equal(c.RouteRuntime.openPrimary('numbers'), false); assert(c.test.page.innerHTML.includes('当前身份无权访问')); }
      assert(c.AppState.canMenu('settings.queues')); assert(c.RouteRuntime.canRoute('queue-management')); assert.equal(c.RouteRuntime.openPrimary('queue-management'), true);
      assert(c.test.nav.innerHTML.includes('data-route="queue-management"')); assert(c.test.page.innerHTML.includes('队列管理')); assert.equal(c.AppState.get().currentPage, 'queue-management');
      assert.equal(c.RouteRuntime.secondaryDepth(), 0);
    }
  });
  await check('运营坐席没有队列菜单且直接地址、组件方法均不能绕过权限', () => {
    const c = fixture({ scope: { accountId: 'ACC-OPS-108' } }); assert.equal(c.AppState.canMenu('settings.queues'), false); assert.equal(c.RouteRuntime.canRoute('queue-management'), false);
    assert.equal(c.RouteRuntime.openPrimary('queue-management'), false); assert(c.test.page.innerHTML.includes('当前身份无权访问'));
    assert(!c.test.nav.innerHTML.includes('data-route="queue-management"')); const before = c.test.saved();
    for (const action of [() => c.QueueManagement.openCreate(), () => c.QueueManagement.openDetails('6103', true), () => c.QueueManagement.openAssociation('6103'), () => c.QueueManagement.openMembers('6101'), () => c.QueueManagement.verify('6101')]) action();
    assert.equal(c.test.layers.size, 0); assert.equal(c.test.saved(), before); assert.deepEqual(clone(c.AliCtiQueues.catalog()), []);
  });
  await check('管理员目录只含本租户真实队列，未绑定和暂停队列也展示', () => {
    for (const [c, prefix] of [[admin(), '61'], [storeAdmin(), '62']]) {
      c.test.render(); const rows = c.test.rows(); assert.deepEqual(rows.map(row => row.qno).sort(), ['01', '02', '03', '04'].map(suffix => prefix + suffix));
      assert(rows.some(row => row.qno === prefix + '03' && !row.physicalGroupId)); assert(rows.some(row => row.qno === prefix + '04' && row.status === 'STOPPED'));
      assert(rows.every(row => row.tenantId === c.AppState.get().tenantId && row.enterpriseId === c.AppState.get().enterpriseId));
    }
  });
  await check('超管目录仅含当前企业唯一租户，不混入同品牌其他企业或同号队列', () => {
    for (const [enterpriseId, tenantId, prefix] of [['7522240', 'TEN-NISSAN-HQ', '61'], ['7522241', 'TEN-NISSAN-SH', '62']]) {
      const c = superAdmin(enterpriseId); c.test.render(); const rows = c.test.rows(); assert.equal(rows.length, 4); assert.equal(new Set(rows.map(row => row.tenantId)).size, 1);
      assert(rows.every(row => row.enterpriseId === enterpriseId && row.tenantId === tenantId)); assert(!c.test.page.innerHTML.includes('奕派总部接听队列'));
      assert.deepEqual(rows.map(row => row.qno).sort(), ['01', '02', '03', '04'].map(suffix => prefix + suffix));
    }
  });
  await check('队列查看使用独立详情抽屉，未关联队列可查看但不混入编辑或管理入口', () => {
    const c = admin(), before = savedSnapshot(c); c.QueueManagement.openDetails('6103', false, c.AliCtiQueues.contextKey());
    const html = c.test.layers.get('queue-detail'); assert(html); assert(html.includes('总部备用接听队列')); assert(html.includes('aria-label="关闭"')); assert(html.includes('未关联'));
    assert(!html.includes('queue-detail-save')); assert(!html.includes('QueueConfig.open')); assert(!html.includes('QueueManagement.openCreate'));
    assert.equal(savedSnapshot(c), before); c.QueueDetail.close(); assert.equal(c.test.layers.size, 0);
  });
  await check('未绑定队列的编辑可保存等待参数，刷新后目录保留修改', () => {
    const c = admin(); c.QueueManagement.openDetails('6103', true, c.AliCtiQueues.contextKey()); assert(c.test.layers.get('queue-detail').includes('queue-detail-save'));
    c.QueueDetail.setField('queueTimeout', '180'); c.QueueDetail.setField('weight', '8'); assert.equal(c.QueueDetail.save(), true);
    assert.equal(c.AliCtiQueues.describeQueue('6103').queue.queueTimeout, 180); assert.equal(c.AliCtiQueues.describeQueue('6103').queue.weight, 8); assert.equal(c.AliCtiQueues.describeQueue('6103').binding, null);
    const fresh = fixture({ local: c.test.local }); fresh.test.render(); const row = fresh.test.rows().find(queue => queue.qno === '6103'); assert.equal(row.queueTimeout, 180); assert.equal(row.weight, 8);
  });
  await check('暂停队列仅查看，编辑尝试不能改写目录', () => {
    const c = admin(), before = savedSnapshot(c); c.QueueManagement.openDetails('6104', false, c.AliCtiQueues.contextKey()); assert(c.test.layers.get('queue-detail').includes('暂停接听队列')); c.QueueDetail.close();
    c.QueueManagement.openDetails('6104', true, c.AliCtiQueues.contextKey()); assert(!c.test.layers.has('queue-detail')); assert.equal(savedSnapshot(c), before);
  });
  await check('跨租户队列的查看、编辑、关联、成员维护和核对都被拒绝', () => {
    const c = admin(), before = savedSnapshot(c); c.test.interceptSecondary();
    for (const action of [() => c.QueueManagement.openDetails('6201', false), () => c.QueueManagement.openDetails('6203', true), () => c.QueueManagement.openAssociation('6203'), () => c.QueueManagement.openMembers('6201'), () => c.QueueManagement.verify('6201')]) action();
    assert.equal(c.test.layers.size, 0); assert.equal(c.test.secondary.length, 0); assert.equal(savedSnapshot(c), before);
  });
  await check('退出租户后旧入口失效，重新进入其他租户不能复用原上下文', () => {
    const c = admin(), context = c.AliCtiQueues.contextKey(); c.test.render(); const before = c.test.saved(); assert.equal(c.AppState.logout(false), true); assert.equal(c.AppState.isReady(), false);
    c.QueueManagement.openCreate(context); c.QueueManagement.openDetails('6103', true, context); c.QueueManagement.openAssociation('6103', context); c.QueueManagement.verify('6101', context);
    assert.equal(c.test.layers.size, 0); assert.equal(c.test.saved(), before);
    const next = storeAdmin(); next.test.render(); assert(next.test.rows().every(row => row.tenantId === 'TEN-NISSAN-SH'));
    const saved = next.test.saved(); next.QueueManagement.openCreate(context); next.QueueManagement.openDetails('6203', true, context); next.QueueManagement.openAssociation('6203', context); next.QueueManagement.verify('6201', context);
    assert.equal(next.test.layers.size, 0); assert.equal(next.test.saved(), saved);
  });
  await check('损坏的队列存储显示读取异常，不继续展示过期队列或允许新建', () => {
    const c = admin(); c.test.render(); c.localStorage.setItem(storageKey, '{broken'); const html = c.test.render();
    assert(!html.includes('总部销售接听队列')); assert(!html.includes('总部备用接听队列')); assert(/读取|损坏|保留/.test(html));
    c.QueueManagement.openCreate(); assert.equal(c.test.layers.size, 0); assert.equal(c.test.saved(), '{broken');
  });
  await check('按关键字与关联状态筛选当前企业队列，不提供跨租户筛选，重置保持企业边界', () => {
    for (const [enterpriseId, prefix] of [['7522240', '61'], ['7522241', '62']]) {
      const c = superAdmin(enterpriseId); c.RouteRuntime.openPrimary('queue-management'); assert.equal(c.document.getElementById('queue-list-tenant'), null);
      c.document.getElementById('queue-list-keyword').value = '备用'; c.document.getElementById('queue-list-status').value = 'unbound'; c.QueueManagement.query();
      assert.deepEqual(c.test.rows().map(row => row.qno), [prefix + '03']); c.QueueManagement.reset(); assert.equal(c.test.rows().length, 4);
      c.document.getElementById('queue-list-keyword').value = ''; c.document.getElementById('queue-list-status').value = 'STOPPED'; c.QueueManagement.query();
      assert.deepEqual(c.test.rows().map(row => row.qno), [prefix + '04']); c.QueueManagement.setPage(99); assert.equal(c.test.rows().length, 1);
      assert(c.test.rows().every(row => row.enterpriseId === enterpriseId));
    }
  });
  await check('新增选择本租户未关联技能组，再进入真实队列创建表单', () => {
    const c = admin(); c.RouteRuntime.openPrimary('queue-management'); const key = c.AliCtiQueues.contextKey(); c.QueueManagement.openCreate(key);
    const html = c.test.layers.get('queue-scope-picker'); assert(html.includes('新增队列')); assert(html.includes('aria-label="关闭"')); assert(!html.includes('queue-create-tenant'));
    const free = c.CloudCallData.physicalSkillGroups.find(group => group.tenantId === 'TEN-NISSAN-HQ' && !c.AliCtiQueues.describe(group)?.binding && group.status === '已启用' && group.syncStatus === '同步成功'); assert(free);
    for (const group of c.CloudCallData.physicalSkillGroups.filter(group => group.tenantId !== 'TEN-NISSAN-HQ')) assert(!html.includes(`value="${group.physicalGroupId}"`));
    c.QueueManagement.selectGroup(free.physicalGroupId, true); c.QueueManagement.continueCreate();
    assert(!c.test.layers.has('queue-scope-picker')); const form = c.test.layers.get('queue-config'); assert(form.includes('创建并关联')); assert(form.includes('queue-qno'));
    c.QueueConfig.setField('qno', '06301'); c.QueueConfig.setField('name', '总部新接听队列'); c.QueueConfig.setField('weight', '6'); assert.equal(c.QueueConfig.save(), true);
    const created = c.AliCtiQueues.describeQueue('06301'); assert(created); assert.equal(created.queue.tenantId, 'TEN-NISSAN-HQ'); assert.equal(created.queue.qno, '06301'); assert.equal(created.group.physicalGroupId, free.physicalGroupId); assert.equal(created.queue.weight, 6);
    const fresh = fixture({ local: c.test.local }); assert.equal(fresh.AliCtiQueues.describeQueue('06301').group.physicalGroupId, free.physicalGroupId);
  });
  await check('新增时不能用其他租户或已绑定技能组绕过选项限制', () => {
    const c = admin(); c.QueueManagement.openCreate(); const before = c.test.saved();
    const foreign = c.CloudCallData.physicalSkillGroups.find(group => group.tenantId === 'TEN-NISSAN-SH'), bound = c.AliCtiQueues.describeQueue('6101').group;
    for (const id of [foreign.physicalGroupId, bound.physicalGroupId, 'MISSING-GROUP']) { c.QueueManagement.selectGroup(id, true); c.QueueManagement.continueCreate(); assert(!c.test.layers.has('queue-config')); assert.equal(c.test.saved(), before); }
  });
  await check('超管新增自动归属唯一租户，旧入口不能切换到其他企业租户', () => {
    for (const [enterpriseId, tenantId, foreignTenantId] of [['7522240', 'TEN-NISSAN-HQ', 'TEN-NISSAN-SH'], ['7522241', 'TEN-NISSAN-SH', 'TEN-NISSAN-HQ']]) {
      const c = superAdmin(enterpriseId); c.QueueManagement.openCreate(); const html = c.test.layers.get('queue-scope-picker'); assert(html && !html.includes('queue-create-tenant'));
      const tenant = c.CloudCallData.tenants.find(row => row.tenantId === tenantId); assert(html.includes(tenant.name));
      const free = c.CloudCallData.physicalSkillGroups.find(group => group.enterpriseId === enterpriseId && group.tenantId === tenantId && !c.AliCtiQueues.describe(group)?.binding && group.status === '已启用' && group.syncStatus === '同步成功'); assert(free); assert(html.includes(`value="${free.physicalGroupId}"`));
      for (const id of [foreignTenantId, 'TEN-EPI-HQ']) { c.QueueManagement.setTenant(id); assert.equal(c.test.layers.get('queue-scope-picker'), html); }
      for (const group of c.CloudCallData.physicalSkillGroups.filter(row => row.enterpriseId !== enterpriseId)) assert(!html.includes(`value="${group.physicalGroupId}"`));
      c.QueueManagement.selectGroup(free.physicalGroupId, true); c.QueueManagement.continueCreate(); assert(c.test.layers.get('queue-config').includes('创建并关联'));
      c.QueueConfig.setField('qno', '06302'); c.QueueConfig.setField('name', '本企业新接听队列'); assert.equal(c.QueueConfig.save(), true);
      const created = c.AliCtiQueues.describeQueue('06302'); assert.equal(created.queue.tenantId, tenantId); assert.equal(created.queue.enterpriseId, enterpriseId); assert.equal(created.group.physicalGroupId, free.physicalGroupId);
    }
  });
  await check('当前企业未绑定或存在重复绑定时不能新建队列，停用租户也计入占用', () => {
    for (const variant of ['missing', 'duplicate', 'disabled-duplicate']) {
      const c = superAdmin(), tenant = c.CloudCallData.tenants.find(row => row.enterpriseId === '7522240');
      if (variant === 'missing') c.CloudCallData.tenants.splice(c.CloudCallData.tenants.indexOf(tenant), 1);
      else c.CloudCallData.tenants.push({ ...tenant, tenantId: 'TEN-DUPLICATE', name: '重复归属', status: variant === 'disabled-duplicate' ? '停用' : '启用' });
      const saved = c.test.saved(); c.QueueManagement.openCreate(); assert(!c.test.layers.has('queue-scope-picker'), variant); assert(!c.test.layers.has('queue-config'), variant); assert.equal(c.test.saved(), saved);
    }
  });
  await check('未绑定队列可关联本租户技能组，保存和成员核对均可执行且持久化', () => {
    const c = admin(); c.QueueManagement.openAssociation('6103', c.AliCtiQueues.contextKey()); const free = c.CloudCallData.physicalSkillGroups.find(group => group.tenantId === 'TEN-NISSAN-HQ' && !c.AliCtiQueues.describe(group)?.binding && group.status === '已启用' && group.syncStatus === '同步成功');
    assert(c.test.layers.get('queue-scope-picker').includes('总部备用接听队列')); c.QueueManagement.selectGroup(free.physicalGroupId, true); c.QueueManagement.saveAssociation();
    assert(!c.test.layers.has('queue-scope-picker')); assert.equal(c.AliCtiQueues.describeQueue('6103').group.physicalGroupId, free.physicalGroupId);
    assert.equal(c.QueueManagement.verify('6103', c.AliCtiQueues.contextKey()), true); assert(c.AliCtiQueues.describeQueue('6103').checkedAt); assert.notEqual(c.AliCtiQueues.describeQueue('6103').status, 'unchecked');
    const fresh = fixture({ local: c.test.local }); assert.equal(fresh.AliCtiQueues.describeQueue('6103').group.physicalGroupId, free.physicalGroupId);
  });
  await check('队列成员入口仅为已关联队列打开本组成员右侧页面，父菜单保持队列管理', () => {
    const c = admin(); c.RouteRuntime.openPrimary('queue-management'); c.test.interceptSecondary(); const bound = c.AliCtiQueues.describeQueue('6101');
    c.QueueManagement.openMembers('6101', c.AliCtiQueues.contextKey()); assert.deepEqual(c.test.secondary, [{ key: 'agent-skills', options: { physicalGroupId: bound.group.physicalGroupId, tenantId: 'TEN-NISSAN-HQ' } }]);
    assert.equal(c.AppState.get().currentPage, 'queue-management'); c.QueueManagement.openMembers('6103', c.AliCtiQueues.contextKey()); assert.equal(c.test.secondary.length, 1);
  });
  await check('打开新增或关联后角色权限撤销，旧表单继续操作不能写入队列', () => {
    for (const kind of ['create', 'association']) {
      const c = admin(); if (kind === 'create') c.QueueManagement.openCreate(); else c.QueueManagement.openAssociation('6103');
      const free = c.CloudCallData.physicalSkillGroups.find(group => group.tenantId === 'TEN-NISSAN-HQ' && !c.AliCtiQueues.describe(group)?.binding && group.status === '已启用' && group.syncStatus === '同步成功'); c.QueueManagement.selectGroup(free.physicalGroupId, true);
      const before = c.test.saved(); c.CloudCallData.memberships.find(row => row.accountId === 'ACC-ADMIN-018' && row.tenantId === 'TEN-NISSAN-HQ').roleCode = 'OPERATOR';
      if (kind === 'create') c.QueueManagement.continueCreate(); else c.QueueManagement.saveAssociation(); assert(!c.test.layers.has('queue-config')); assert.equal(c.test.saved(), before);
    }
  });
  await check('新增队列多选技能组并完整保留创建和重载后的关联', () => {
    const c=admin();c.RouteRuntime.openPrimary('queue-management');c.QueueManagement.openCreate();
    const selected=c.CloudCallData.physicalSkillGroups.filter(g=>g.tenantId==='TEN-NISSAN-HQ'&&g.status==='已启用'&&g.syncStatus==='同步成功'&&!c.AliCtiQueues.describe(g)?.binding).slice(0,2);assert.equal(selected.length,2);
    const html=c.test.layers.get('queue-scope-picker');assert(html.includes('type="checkbox"'));assert(!html.includes('id="queue-picker-group"'));
    selected.forEach(g=>c.QueueManagement.selectGroup(g.physicalGroupId,true));c.QueueManagement.continueCreate();
    const form=c.test.layers.get('queue-config');selected.forEach(g=>assert(form.includes(g.name)));assert(!form.includes('关联已有队列'));
    c.QueueConfig.setField('qno','06303');c.QueueConfig.setField('name','总部多技能接听');assert.equal(c.QueueConfig.save(),true);
    const ids=clone(selected.map(g=>g.physicalGroupId).sort());assert.deepEqual(clone(c.AliCtiQueues.describeQueue('06303').groups.map(g=>g.physicalGroupId).sort()),ids);
    const fresh=fixture({local:c.test.local});assert.deepEqual(clone(fresh.AliCtiQueues.describeQueue('06303').groups.map(g=>g.physicalGroupId).sort()),ids);
    fresh.test.render();const row=fresh.test.rows().find(q=>q.qno==='06303');assert.equal(row.groupNames.length,2);selected.forEach(g=>assert(fresh.test.page.innerHTML.includes(g.name)));
  });
  await check('关联设置允许勾选多个技能组，取消一个后保留其余关联', () => {
    const c=admin();c.RouteRuntime.openPrimary('queue-management');const selected=c.CloudCallData.physicalSkillGroups.filter(g=>g.tenantId==='TEN-NISSAN-HQ'&&g.status==='已启用'&&g.syncStatus==='同步成功'&&!c.AliCtiQueues.describe(g)?.binding).slice(0,2);assert.equal(selected.length,2);
    c.QueueManagement.openAssociation('6103');selected.forEach(g=>c.QueueManagement.selectGroup(g.physicalGroupId,true));assert.equal(c.QueueManagement.saveAssociation(),true);
    assert.equal(c.AliCtiQueues.describeQueue('6103').groups.length,2);
    // A fresh configuration without published routes/active calls can remove one group safely.
    c.CloudCallData.inboundRoutes.forEach(route=>route.status='草稿');c.CloudCallData.agents.forEach(agent=>{agent.agentStatus='离线';agent.currentCall=null;agent.currentEndpoint=null;});
    c.QueueManagement.openAssociation('6103');const html=c.test.layers.get('queue-scope-picker');selected.forEach(g=>assert(html.includes(`value="${g.physicalGroupId}" checked`)));
    c.QueueManagement.selectGroup(selected[1].physicalGroupId,false);assert.equal(c.QueueManagement.saveAssociation(),true);
    assert.deepEqual(clone(c.AliCtiQueues.describeQueue('6103').groups.map(g=>g.physicalGroupId)),[selected[0].physicalGroupId]);
  });
  await check('多技能队列成员入口展示选择器并进入所选技能组', () => {
    const c=admin();c.RouteRuntime.openPrimary('queue-management');c.test.interceptSecondary();const selected=c.CloudCallData.physicalSkillGroups.filter(g=>g.tenantId==='TEN-NISSAN-HQ'&&g.status==='已启用'&&g.syncStatus==='同步成功'&&!c.AliCtiQueues.describe(g)?.binding).slice(0,2);
    assert(c.AliCtiQueues.saveQueueGroups('6103',selected.map(g=>g.physicalGroupId),c.AliCtiQueues.contextKey(),c.AliCtiQueues.revision()).ok);
    c.QueueManagement.openMembers('6103');assert.equal(c.test.secondary.length,0);const html=c.test.layers.get('queue-scope-picker');selected.forEach(g=>assert(html.includes(g.name)));
    c.QueueManagement.openGroupMembers(selected[1].physicalGroupId);assert.deepEqual(c.test.secondary,[{key:'agent-skills',options:{physicalGroupId:selected[1].physicalGroupId,tenantId:'TEN-NISSAN-HQ'}}]);assert(!c.test.layers.has('queue-scope-picker'));
  });
  await check('多选未保存时关闭需确认，保存失败保留选择', () => {
    const c=admin();c.QueueManagement.openAssociation('6103');const free=c.CloudCallData.physicalSkillGroups.find(g=>g.tenantId==='TEN-NISSAN-HQ'&&g.status==='已启用'&&g.syncStatus==='同步成功'&&!c.AliCtiQueues.describe(g)?.binding);c.QueueManagement.selectGroup(free.physicalGroupId,true);
    c.QueueManagement.closePicker();assert(c.test.layers.has('queue-scope-picker'));assert(c.test.layers.has('queue-picker-decision'));c.QueueManagement.cancelClose();
    const save=c.AliCtiQueues.saveQueueGroups;c.AliCtiQueues.saveQueueGroups=()=>({ok:false,message:'保存失败'});assert.equal(c.QueueManagement.saveAssociation(),false);assert(c.test.layers.has('queue-scope-picker'));assert.equal(c.document.getElementById('queue-picker-error').textContent,'保存失败');c.AliCtiQueues.saveQueueGroups=save;assert.equal(c.QueueManagement.saveAssociation(),true);assert.equal(c.AliCtiQueues.describeQueue('6103').groups[0].physicalGroupId,free.physicalGroupId);
  });
  console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', count: checks.length + failures.length, failed: failures.length, scope: 'Real index scripts, AppState role/tenant boundaries, navigation and queue management integration; DOM rendering is simulated and browser checks are separate', checks, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
