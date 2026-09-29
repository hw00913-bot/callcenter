/* Number import behavior with real local resource fixtures. No browser or network. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert'), crypto = require('crypto');
const root = path.resolve(__dirname, '..'), storageKey = 'alicti-number-import-v1';
const checks = [], failures = [], clone = value => JSON.parse(JSON.stringify(value));
const files = ['mock/data.js', 'mock/demo-kit.js', 'mock/demo-resources.js', 'js/components/alicti-fields.js', 'mock/number-onboarding.js', 'js/components/alicti-number-import.js'];
const integratedFiles = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]).filter(file => files.includes(file) || ['js/components/resource-rules.js', 'js/pages/resource-lines.js'].includes(file));
function check(name, fn) { try { fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.message }); } }
function fixture(options = {}) {
  const store = options.store || new Map(), session = options.session || new Map(), elements = new Map();
  const actor = { accountId: 'ACC-ADMIN-018', sessionId: 'QA-NUMBER-IMPORT', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', activeDomain: 'CLOUD_CONTACT_CENTER', role: 'SUPER_ADMIN', ready: true, valid: true, menu: true };
  const element = id => { if (!elements.has(id)) elements.set(id, { value: '', checked: false, disabled: false, indeterminate: false, textContent: '', onclick: null, focus() {}, scrollIntoView() {}, querySelector: () => null, querySelectorAll: selector => selector.includes('numberTenant') ? c.selectedTenantIds.map(value => ({ value })) : [] }); return elements.get(id); };
  const c = { console, Date, JSON, Math, Map, Set, structuredClone, crypto, actor, store, session, elements, queries: [], tables: [], html: '', refreshes: 0, writes: 0, failWrite: false, granted: [], selectedTenantIds: [], toasts: [], CSS: { escape: value => String(value) },
    localStorage: { getItem: key => store.get(key) ?? null, setItem(key, value) { if (key === storageKey) { if (c.failWrite) { const error = new Error('Storage unavailable'); error.name = 'QuotaExceededError'; throw error; } c.writes++; } store.set(key, String(value)); } },
    sessionStorage: { getItem: key => session.get(key) ?? null, setItem: (key, value) => session.set(key, String(value)) },
    document: { getElementById: id => ['number-grant', 'page-content'].includes(id) ? null : element(id), querySelector: element },
    AppState: { get: () => actor, profile: () => ({ label: '号码导入 QA 管理员' }), isReady: () => actor.ready, effectiveAccess: () => ({ valid: actor.valid, roleCode: actor.role }), isSuper: () => actor.role === 'SUPER_ADMIN', canMenu: () => actor.menu, availableTenants: () => c.CloudCallData.tenants.filter(row => row.enterpriseId === actor.enterpriseId), authorizeObject: (_, row) => row.enterpriseId === actor.enterpriseId },
    PlatformUI: { escape: value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'), status: value => String(value),
      help: value => String(value), detailSection: (title, body) => title + body, pageHeader: (title, body) => title + body, toolbar: (left, right) => left + right, pagination: () => '', empty: value => String(value),
      table(columns, rows) { c.tables.push(clone(rows)); return '<table>' + rows.map(row => '<tr>' + columns.map(column => '<td>' + (column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')) + '</td>').join('') + '</tr>').join('') + '</table>'; },
      openLayer(id, html) { c.html = html; c.layer = id; }, closeLayer() { c.layer = ''; } },
    CloudCallRuntime: { instance: id => c.CloudCallData.instances.find(row => row.enterpriseId === id), tenant: id => c.CloudCallData.tenants.find(row => row.tenantId === id), addAudit() {} },
    RouteRuntime: { refreshCurrent() { c.refreshes++; }, snapshot: () => ({ key: 'numbers' }) },
    Pages: { 'resource-lines': { openGrant(id, options) { c.granted.push({ id, options }); } } },
    AliCtiDemo: { numberOutcome: 'success' }, AliCtiAdapter: {}, showToast: (message, level) => c.toasts.push({ message, level }),
    fetch() { throw Error('Unexpected network request during number import QA'); } };
  c.window = c; c.globalThis = c; vm.createContext(c);
  for (const file of options.integration ? integratedFiles : files) {
    if (file === 'js/components/alicti-number-import.js' && options.withoutLines) delete c.CloudCallData.lines;
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c, { filename: file });
  }
  const list = c.NumberOnboardingMock.list;
  c.NumberOnboardingMock.list = (enterpriseId, query) => { const response = list(enterpriseId, query); c.queries.push(clone(response.request)); return c.transform ? c.transform(response, enterpriseId, query || {}) : response; };
  c.api = c.AliCtiNumberImport;
  c.rows = () => c.tables.at(-1) || [];
  c.saved = () => JSON.parse(store.get(storageKey) || '[]');
  c.imported = () => c.CloudCallData.phoneNumbers.filter(row => row.importedFrom === 'ALICTI');
  c.queryNumber = (number = '', status = '') => { element('aci-number').value = number; element('aci-status').value = status; c.api.query(); return c.rows(); };
  c.prepare = (number, usage = 'Outbound') => { assert(c.api.open()); const rows = c.queryNumber(number); assert.equal(rows.length, 1, '号码精确查询必须只返回选定号码'); c.api.toggle(String(rows[0].id)); c.api.next(); c.api.set('usage', usage); return clone(rows[0]); };
  return c;
}
const enabledNumber = '02100009204', disabledNumber = '02100009203', managedNumber = '02100006101';
const importSnapshot = c => clone({ numbers: c.CloudCallData.phoneNumbers, batches: c.CloudCallData.numberOnboardingBatches, saved: c.store.get(storageKey) ?? null, writes: c.writes });
function unchanged(c, before) { assert.deepStrictEqual(importSnapshot(c), before, '失败操作不能新增号码、历史记录或持久化写入'); }

check('真实本地号码查询保留账号边界，其他账号号码不能混入', () => {
  const c = fixture(), a = c.NumberOnboardingMock.list('7522240', { limit: 1000 }).response, b = c.NumberOnboardingMock.list('DEMO-ENT-003', { limit: 1000 }).response;
  assert(a.data.length > 8 && b.data.length); assert(!a.data.some(row => b.data.some(other => other.hotline === row.hotline)));
  assert.equal(c.NumberOnboardingMock.list('UNAVAILABLE-ENTERPRISE', {}).response.data.length, 0);
  c.actor.enterpriseId = 'DEMO-ENT-003'; c.actor.tenantId = 'TEN-EPI-HQ'; assert(c.api.open());
  assert.deepStrictEqual(c.rows().map(row => row.hotline), clone(b.data.map(row => row.hotline)));
  c.api.toggle(String(a.data[0].id)); assert.equal(c.elements.get('aci-count').textContent, '已选 0 个');
});

check('未就绪、权限无效、非超管、无菜单或非呼叫中心都不能查询导入', () => {
  for (const patch of [{ ready: false }, { valid: false }, { role: 'ADMIN' }, { role: 'OPERATOR' }, { menu: false }, { activeDomain: 'CRM' }]) {
    const c = fixture(); Object.assign(c.actor, patch); const before = importSnapshot(c);
    assert.equal(c.api.open(), false); assert.equal(c.queries.length, 0); assert.equal(c.layer, undefined); unchanged(c, before);
  }
});

check('精确号码与停用筛选遵守请求条件，查询结果计数为过滤后的总数', () => {
  const c = fixture(); c.api.open(); const row = c.queryNumber(disabledNumber, '0');
  assert.equal(row.length, 1); assert.equal(row[0].hotline, disabledNumber); assert.equal(row[0].status, 0);
  assert.deepStrictEqual(c.queries.at(-1).body, { offset: 0, limit: 8, number: disabledNumber, status: 0 });
  c.queryNumber(disabledNumber.slice(0, -1)); assert.equal(c.rows().length, 0, '号码查询不得隐式模糊匹配');
  c.queryNumber(disabledNumber, '1'); assert.equal(c.rows().length, 0);
  c.api.query(true); assert.equal(c.rows().length, 8); assert.deepStrictEqual(c.queries.at(-1).body, { offset: 0, limit: 8 });
});

check('分页不重叠并保留跨页选择，返回第一页后可继续确认', () => {
  const c = fixture(); c.api.open(); const first = c.rows(), one = first.find(row => row.hotline !== managedNumber);
  assert.equal(first.length, 8); c.api.toggle(String(one.id)); c.api.page(1); const second = c.rows();
  assert(second.length > 0); assert(!second.some(row => first.some(other => row.id === other.id)));
  assert.deepStrictEqual(c.queries.at(-1).body, { offset: 8, limit: 8 });
  c.api.toggle(String(second[0].id)); assert.equal(c.elements.get('aci-count').textContent, '已选 2 个');
  c.api.page(-1); assert.equal(c.elements.get('aci-count').textContent, '已选 2 个'); c.api.next(); assert(c.html.includes('确认导入 2 个号码'));
});

check('全选本页排除已管理号码，清空和当前页取消选择更新选择量', () => {
  const c = fixture(); c.api.open(); const eligible = c.rows().filter(row => !c.CloudCallData.phoneNumbers.some(number => number.enterpriseId === c.actor.enterpriseId && number.number === row.hotline));
  c.api.selectPage(true); assert.equal(c.elements.get('aci-count').textContent, `已选 ${eligible.length} 个`);
  c.api.selectPage(false); assert.equal(c.elements.get('aci-count').textContent, '已选 0 个');
  c.api.selectPage(true); c.api.clear(); assert.equal(c.elements.get('aci-count').textContent, '已选 0 个');
});

check('已导入号码在精确查询中标识为已导入且不能再次选择', () => {
  const c = fixture(); c.api.open(); const rows = c.queryNumber(managedNumber);
  assert.equal(rows.length, 1); assert(c.html.includes('已导入')); c.api.toggle(String(rows[0].id)); c.api.next();
  assert.equal(c.elements.get('aci-count').textContent, '已选 0 个'); assert(!c.html.includes('确认导入 1 个号码')); assert.equal(c.imported().length, 0);
});

check('号码导入仅确认使用方向，无平台线路也能完成且不生成线路字段', () => {
  const c = fixture({ withoutLines: true }); c.prepare(enabledNumber, ''); const before = importSnapshot(c);
  assert(!c.html.includes('aci-line')); assert(!c.html.includes('平台线路'));
  assert.equal(c.api.submit(), false); unchanged(c, before); assert(c.html.includes('请选择使用方向'));
  c.api.set('usage', 'Outbound'); c.api.set('lineId', 'LINE-EPI-01'); assert.equal(c.api.submit(), true);
  const row = c.imported()[0]; assert.equal(row.aliyunUsage, 'Outbound'); assert.equal(row.usage, '仅呼出');
  for (const value of [row, c.saved()[0], c.CloudCallData.numberOnboardingBatches[0]]) {
    assert(!Object.hasOwn(value, 'lineId')); assert(!Object.hasOwn(value, 'importedLine'));
  }
  assert.deepStrictEqual(clone(row.authorizedTenantIds), ['TEN-NISSAN-HQ']); assert(!Object.hasOwn(row, 'boundSkillGroupIds')); assert(!Object.hasOwn(c.saved()[0], 'boundSkillGroupIds'));
  assert.equal(c.CloudCallData.lines, undefined);
});

check('导入停用号码保留停用和原始供应商属性，平台使用方向不改外显权限', () => {
  const c = fixture(), raw = c.prepare(disabledNumber, 'Bidirection'); assert.equal(c.api.submit(), true);
  const row = c.imported()[0]; assert.equal(row.businessStatus, '已隔离'); assert.equal(row.status, '已隔离'); assert.equal(row.aliyunUsage, 'Bidirection');
  assert.deepStrictEqual(clone(row.alictiNumber), raw); assert.equal(row.alictiNumber.trunkGroupKey, raw.trunkGroupKey);
  assert.equal(row.simulation, true); assert.equal(row.importedFrom, 'ALICTI'); assert.equal(c.saved().length, 1);
});

check('供应商未提供用途字段时保留未知属性，不补造已授权状态', () => {
  const c = fixture(); const pool = c.CloudCallData.numberIntakePool.find(row => row.number === '02100009001');
  pool.alictiNumber = { id: 995001, hotline: pool.number, displayNumber: pool.number, numberType: 2, status: 1, isInUse: 0, trunkGroupKey: 'UNMAPPED-TRUNK', label: ['QA'], hybridGroupList: [{ id: 1, name: 'pool' }], providerExtra: '保留' };
  const raw = c.prepare(pool.number); assert.equal(c.api.submit(), true); const row = c.imported()[0];
  assert.deepStrictEqual(clone(row.alictiNumber), raw); assert.equal(c.AliCtiFields.numberFields(row.alictiNumber).uses.isPredictiveLeft, null); assert.equal(row.alictiNumber.isInUse, 0);
});

check('400号码仍遵守平台仅呼入规则，不能通过改变用途绕过', () => {
  const c = fixture(); const raw = c.prepare('4000009201', 'Outbound'), before = importSnapshot(c);
  assert.equal(c.api.submit(), false); unchanged(c, before); c.api.set('usage', 'Inbound'); assert.equal(c.api.submit(), true);
  assert.equal(c.imported()[0].aliyunUsage, 'Inbound'); assert.deepStrictEqual(clone(c.imported()[0].alictiNumber), raw);
});

check('成功结果重复提交或重新查询不会生成重复号码与添加记录', () => {
  const c = fixture(); c.prepare(enabledNumber); assert.equal(c.api.submit(), true); const before = importSnapshot(c);
  assert.equal(c.api.submit(), false); unchanged(c, before); c.api.close(); assert.equal(c.refreshes, 1);
  c.api.open(); const raw = c.queryNumber(enabledNumber)[0]; c.api.toggle(String(raw.id)); c.api.next(); unchanged(c, before);
  assert.equal(c.elements.get('aci-count').textContent, '已选 0 个');
});

check('账号、会话、租户、角色或权限变化后旧确认页不能提交', () => {
  for (const patch of [{ accountId: 'ANOTHER-ADMIN' }, { sessionId: 'ANOTHER-SESSION' }, { tenantId: 'TEN-NISSAN-SH' }, { enterpriseId: 'DEMO-ENT-003' }, { role: 'ADMIN' }, { valid: false }, { ready: false }, { menu: false }, { activeDomain: 'CRM' }]) {
    const c = fixture(); c.prepare(enabledNumber); const before = importSnapshot(c); Object.assign(c.actor, patch);
    assert.equal(c.api.submit(), false); unchanged(c, before);
  }
});

check('提交前供应商状态或属性变化阻止整批新增并要求重新查询', () => {
  for (const field of ['status', 'isInUse', 'trunkGroupKey']) {
    const c = fixture(); c.prepare(enabledNumber); const before = importSnapshot(c);
    c.transform = response => { response.response.data.forEach(row => { row[field] = field === 'trunkGroupKey' ? 'CHANGED-TRUNK' : 0; }); return response; };
    assert.equal(c.api.submit(), false); unchanged(c, before); assert(c.html.includes('变化'));
  }
});

check('供应商仅调整对象字段顺序时仍可导入，保留原属性值与数组顺序', () => {
  const c = fixture(), pool = c.CloudCallData.numberIntakePool.find(row => row.number === '02100009001');
  pool.alictiNumber = { id: 995002, hotline: pool.number, displayNumber: pool.number, numberType: 2, status: 1, isInUse: 1, label: ['首要标签', '次要标签'], hybridGroupList: [{ id: 1, name: '号码池', metadata: { enabled: true, level: 2 } }] };
  const raw = c.prepare(pool.number);
  const reorder = value => Array.isArray(value) ? value.map(reorder) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reorder(item)])) : value;
  c.transform = response => { response.response.data = response.response.data.map(reorder); return response; };
  assert.equal(c.api.submit(), true, '仅字段顺序变化不应被识别为供应商属性变化'); assert.equal(c.imported().length, 1);
  assert.deepStrictEqual(clone(c.imported()[0].alictiNumber), raw); assert.deepStrictEqual(clone(c.saved()[0].alictiNumber), raw);
});

check('初始查询失败或超时不允许选择，提交复查失败也不新增', () => {
  for (const outcome of ['failure', 'timeout']) {
    const c = fixture(); c.CloudCallData.numberOnboardingDemo.importOutcome = outcome; const before = importSnapshot(c);
    c.api.open(); c.api.selectPage(true); c.api.next(); assert.equal(c.elements.get('aci-count').textContent, '已选 0 个'); unchanged(c, before);
    c.CloudCallData.numberOnboardingDemo.importOutcome = 'success'; c.prepare(enabledNumber); c.CloudCallData.numberOnboardingDemo.importOutcome = outcome;
    assert.equal(c.api.submit(), false); unchanged(c, before);
  }
});

check('多选批次中任一号码消失时整批保留原样', () => {
  const c = fixture(); c.api.open(); const rows = c.rows().filter(row => row.hotline === enabledNumber || row.hotline === disabledNumber);
  assert.equal(rows.length, 2); rows.forEach(row => c.api.toggle(String(row.id))); c.api.next(); c.api.set('usage', 'Outbound');
  const before = importSnapshot(c); c.transform = (response, enterpriseId, query) => { if (query.number === rows[1].hotline) { response.response.data = []; response.response.totalCount = '0'; } return response; };
  assert.equal(c.api.submit(), false); unchanged(c, before);
});

check('重复返回记录和无效列表结构不能被视为可导入结果', () => {
  for (const mutate of [response => { response.data.push(clone(response.data[0])); }, response => { response.totalCount = 'unknown'; }, response => { response.data = {}; }]) {
    const c = fixture(); c.transform = response => { mutate(response.response); return response; }; const before = importSnapshot(c);
    c.api.open(); c.api.selectPage(true); c.api.next(); assert.equal(c.elements.get('aci-count').textContent, '已选 0 个'); assert(c.html.includes('aci-error')); unchanged(c, before);
  }
});

check('号码状态缺失或完整号码无效时显示原因且不能被选中', () => {
  for (const variant of ['status', 'hotline']) {
    const c = fixture(); c.transform = response => { response.response.data = response.response.data.slice(0, 1); if (variant === 'status') delete response.response.data[0].status; else response.response.data[0].hotline = 'masked****'; return response; };
    c.api.open(); c.api.selectPage(true); assert.equal(c.elements.get('aci-count').textContent, '已选 0 个'); assert(c.html.includes('号码资料不完整'));
  }
});

check('浏览器写入失败不新增内存号码或记录，恢复可写后可重试', () => {
  const c = fixture(); c.prepare(enabledNumber); const before = importSnapshot(c); c.failWrite = true;
  assert.equal(c.api.submit(), false); unchanged(c, before); assert(c.html.includes('保存失败'));
  c.failWrite = false; assert.equal(c.api.submit(), true); assert.equal(c.imported().length, 1); assert.equal(c.writes, 1);
});

check('并行打开的两个页面通过持久化去重，后提交者不能重复新增', () => {
  const store = new Map(), first = fixture({ store }), second = fixture({ store }); first.prepare(enabledNumber); second.prepare(enabledNumber);
  assert.equal(first.api.submit(), true); const before = importSnapshot(second); assert.equal(second.api.submit(), false); unchanged(second, before);
  assert.equal(first.saved().length, 1); assert.equal(second.imported().length, 0);
});

check('刷新恢复完整导入记录，重复恢复保持唯一且不写回供应商', () => {
  const c = fixture(); c.prepare(disabledNumber, 'Inbound'); assert.equal(c.api.submit(), true); const imported = clone(c.imported()[0]);
  const fresh = fixture({ store: c.store }); assert.equal(fresh.imported().length, 1); assert.deepStrictEqual(clone(fresh.imported()[0]), imported);
  fresh.api.restore(); fresh.api.restore(); assert.equal(fresh.imported().length, 1); assert.equal(fresh.queries.length, 0); assert.equal(fresh.writes, 0);
});

check('异常本地存储保留原值，不能借导入覆盖原数据', () => {
  for (const value of ['{broken', '{"unexpected":true}', '[{"numberId":"invalid"}]']) {
    const c = fixture({ store: new Map([[storageKey, value]]) }); c.prepare(enabledNumber); const before = importSnapshot(c);
    assert.equal(c.api.submit(), false); unchanged(c, before); assert.equal(c.store.get(storageKey), value);
  }
});

check('旧导入记录的线路字段不再参与恢复，按号码所属账号保留历史配置', () => {
  const c = fixture(); c.prepare(enabledNumber); assert.equal(c.api.submit(), true); const saved = c.saved();
  saved[0].lineId = 'LINE-EPI-01'; saved[0].importedLine = { lineId: 'QA-OLD-LINE', enterpriseIds: ['OTHER-ACCOUNT'], name: '旧线路' };
  const value = JSON.stringify(saved), fresh = fixture({ withoutLines: true, store: new Map([[storageKey, value]]) });
  assert.equal(fresh.imported().length, 1); assert.equal(fresh.imported()[0].enterpriseId, '7522240');
  assert(!Object.hasOwn(fresh.imported()[0], 'lineId')); assert(!Object.hasOwn(fresh.imported()[0], 'importedLine'));
  assert.equal(fresh.CloudCallData.lines, undefined); assert.equal(fresh.store.get(storageKey), value, '读取兼容不能擅自写回旧存储');
  assert.deepStrictEqual(clone(fresh.imported()[0].alictiNumber), saved[0].alictiNumber);
});

check('导入完成只为本批号码打开号码详情，账号切换后不继续打开', () => {
  const c = fixture(); c.prepare(enabledNumber); assert.equal(c.api.submit(), true); const row = c.imported()[0];
  c.api.configure('UNRELATED-NUMBER'); assert.equal(c.granted.length, 0); c.api.configure(row.numberId); assert.equal(c.granted.length, 1);
  assert.equal(c.granted[0].id, row.numberId); c.actor.enterpriseId = 'DEMO-ENT-003'; c.api.configure(row.numberId); assert.equal(c.granted.length, 1);
});

function saveScope(c, row, tenantId = 'TEN-NISSAN-HQ') {
  assert.deepStrictEqual(clone(row.authorizedTenantIds), [tenantId]);
  c.Pages['resource-lines'].openNumber(row.numberId);
  assert(c.html.includes('号码详情'));assert(!c.html.includes('保存使用范围'));
  assert.equal(c.Pages['resource-lines'].saveNumberScope,undefined);
}

check('按页面真实资源脚本顺序加载，先恢复导入记录再应用号码管理配置', () => {
  const c = fixture({ integration: true }); assert(c.AliCtiNumberImport && c.Pages['resource-lines'] && c.CloudResourceRules);
  assert(integratedFiles.indexOf('js/components/alicti-number-import.js') < integratedFiles.indexOf('js/pages/resource-lines.js'));
  const numberPage = c.Pages['resource-lines'].render({ view: 'numbers' }); assert(numberPage.includes('从 AliCti 导入'));
});

check('停用导入号码自动归属后刷新恢复范围，保持供应商停用且不可外呼', () => {
  const c = fixture({ integration: true }); c.prepare(disabledNumber); assert.equal(c.api.submit(), true); const row = c.imported()[0];
  assert.equal(row.restoreSnapshot, null); saveScope(c, row); assert.equal(row.businessStatus, '已隔离');
  const saved = c.saved().find(item => item.numberId === row.numberId); assert(saved); assert.equal(saved.restoreSnapshot, null); assert.equal(c.session.get('cloud-number-resource-state-v1'), undefined, '只读查看不额外写号码配置');
  const fresh = fixture({ integration: true, store: c.store, session: c.session }), restored = fresh.imported().find(item => item.numberId === row.numberId);
  assert(restored); assert.deepStrictEqual(clone(restored.authorizedTenantIds), ['TEN-NISSAN-HQ']);
  assert.equal(restored.businessStatus, '已隔离'); assert.equal(restored.alictiNumber.status, 0); assert.equal(fresh.CloudResourceRules.usableNumber(restored, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), false);
});

check('未关联本地线路的启用号码按账号、租户授权和官方用途判断可用性', () => {
  const c = fixture({ integration: true }); c.prepare(enabledNumber); assert.equal(c.api.submit(), true); const row = c.imported()[0];
  delete c.CloudCallData.lines;
  assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), true, '导入即归属当前账号唯一租户');
  row.authorizedTenantIds = [];
  assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), false, '错误归属不能使用');
  row.authorizedTenantIds = ['TEN-NISSAN-HQ'];
  assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), true, '已启用并授权的号码不应被虚构线路条件阻止');
  assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-EPI-HQ', '呼出', '预览外呼'), false, '不能跨账号使用');
  row.alictiNumber.isInUse = 0;
  assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), false, '官方用途仍然约束号码使用');
  row.alictiNumber.isInUse = 1; row.alictiNumber.status = 0;
  assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), false, '官方停用状态仍然阻止呼叫');
});

check('供应商外显权限随导入保存，租户授权和刷新仍遵守原始权限', () => {
  for (const isInUse of [0, 1]) {
    const c = fixture({ integration: true }), pool = c.CloudCallData.numberIntakePool.find(row => row.number === '02100009001');
    pool.alictiNumber = { ...c.NumberOnboardingMock.list(c.actor.enterpriseId, { number: pool.number }).response.data[0], isInUse };
    const raw = c.prepare(pool.number); assert.equal(c.api.submit(), true); const row = c.imported()[0];
    saveScope(c, row); assert.deepStrictEqual(clone(row.alictiNumber), raw); assert.deepStrictEqual(c.saved()[0].alictiNumber, raw);
    assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), isInUse === 1);
    const fresh = fixture({ integration: true, store: c.store, session: c.session }), restored = fresh.imported().find(item => item.numberId === row.numberId);
    assert(restored); assert.deepStrictEqual(clone(restored.alictiNumber), raw); assert.deepStrictEqual(clone(restored.authorizedTenantIds), ['TEN-NISSAN-HQ']);
    assert.equal(restored.businessStatus, '正常'); assert.equal(fresh.CloudResourceRules.usableNumber(restored, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), isInUse === 1);
    fresh.api.restore(); assert.deepStrictEqual(clone(restored.alictiNumber), raw); assert.deepStrictEqual(clone(restored.authorizedTenantIds), ['TEN-NISSAN-HQ']); assert.equal(fresh.imported().length, 1);
  }
});


check('没有技能组或坐席也能自动归属租户，号码页不再提供坐席技能绑定入口', () => {
  const c = fixture({ integration: true }); c.prepare(enabledNumber); assert.equal(c.api.submit(), true); const row = c.imported()[0];
  c.CloudCallData.skillGroups = []; c.CloudCallData.physicalSkillGroups = []; c.CloudCallData.agentSkills = []; c.CloudCallData.agents = [];
  const page = c.Pages['resource-lines']; page.openGrant(row.numberId);
  assert(!c.html.includes('boundNumberGroup')); assert(!c.html.includes('.toggleGroup(')); assert(!c.html.includes('.openSkillGroup('));
  for (const legacy of ['toggleGroup', 'openSkillGroup', 'saveNumberBinding']) assert.equal(page[legacy], undefined, '旧绑定写入口应移除: ' + legacy);
  saveScope(c, row);
  assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), true);
  assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-SH', '呼出', '预览外呼'), false);
  const fresh = fixture({ integration: true, store: c.store, session: c.session }), restored = fresh.imported().find(item => item.numberId === row.numberId);
  assert.deepStrictEqual(clone(restored.authorizedTenantIds), ['TEN-NISSAN-HQ']);
});

check('旧技能组关联字段既不能授予租户权限也不能阻止已授权号码使用', () => {
  const c = fixture({ integration: true }); c.prepare(enabledNumber); assert.equal(c.api.submit(), true); const row = c.imported()[0];
  row.boundSkillGroupIds = ['SG-ALI-HQ-SALES'];
  row.authorizedTenantIds = [];
  assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), false, '旧技能关联不能替代租户归属');
  row.authorizedTenantIds = ['TEN-NISSAN-HQ'];
  saveScope(c, row);
  for (const legacy of [[], ['SG-ALI-HQ-SALES'], ['SG-OTHER-ENTERPRISE'], ['MISSING-SKILL-GROUP']]) {
    row.boundSkillGroupIds = legacy;
    assert.deepStrictEqual(clone(row.authorizedTenantIds), ['TEN-NISSAN-HQ']);
    assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-HQ', '呼出', '预览外呼'), true, '历史技能字段不应成为号码可用性条件');
    assert.equal(c.CloudResourceRules.usableNumber(row, 'TEN-NISSAN-SH', '呼出', '预览外呼'), false, '历史技能字段不能扩大租户授权');
  }
});

check('直接导入账号号码后刷新保留导入状态，再次选择不能重复新增', () => {
  const number = '02100009001', c = fixture({ integration: true }); c.prepare(number); assert.equal(c.api.submit(), true); c.api.close();
  const fresh = fixture({ integration: true, store: c.store, session: c.session }); fresh.api.open(); const row = fresh.queryNumber(number)[0], before = importSnapshot(fresh);
  assert(fresh.html.includes('已导入')); fresh.api.toggle(String(row.id)); fresh.api.next();
  assert.equal(fresh.elements.get('aci-count').textContent, '已选 0 个'); unchanged(fresh, before);
});

check('非法号码ID和不一致分页总量阻止导入，不进行宽松数字转换', () => {
  const c = fixture(), raw = clone(c.NumberOnboardingMock.list('7522240', { number: enabledNumber }).response.data[0]);
  for (const id of [true, false, null, '', 0, -1, 1.5, '1e3', Number.MAX_SAFE_INTEGER + 1]) assert(c.api.issue({ ...raw, id }), '无效ID不应可导入: ' + id);
  assert.equal(c.api.issue({ ...raw, id: String(raw.id) }), '', '合法纯数字ID兼容供应商字符串返回');
  for (const totalCount of [true, false, null, '', '1e3', -1, 0, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => c.api.parse({ result: 0, totalCount, data: [raw] }), '非法或少于本页记录数的totalCount必须拒绝');
  assert.equal(c.api.parse({ result: 0, totalCount: '1', pageSize: '8', data: [raw] }).rows.length, 1);
});

check('供应商中继标识仅保留在原始属性中，不映射或创建平台线路', () => {
  const c = fixture({ withoutLines: true }), pool = c.CloudCallData.numberIntakePool.find(row => row.number === '02100009001');
  pool.alictiNumber = { id: 995003, hotline: pool.number, displayNumber: pool.number, numberType: 2, status: 1, isInUse: 1, trunkGroupKey: 'LINE-ALI-01' };
  const raw = c.prepare(pool.number); assert.equal(c.api.submit(), true);
  const row = c.saved()[0]; assert.equal(row.alictiNumber.trunkGroupKey, 'LINE-ALI-01'); assert.deepStrictEqual(clone(row.alictiNumber), raw);
  assert(!Object.hasOwn(row, 'lineId')); assert(!Object.hasOwn(row, 'importedLine')); assert.equal(c.CloudCallData.lines, undefined);
  const fresh = fixture({ withoutLines: true, store: c.store }); assert.equal(fresh.imported().length, 1);
  assert.deepStrictEqual(clone(fresh.imported()[0]), row); assert.equal(fresh.CloudCallData.lines, undefined);
});

check('旧线路快照不会创建或覆盖线路，下一次成功导入清理已废弃的保存字段', () => {
  const source = fixture(); source.prepare(enabledNumber); assert.equal(source.api.submit(), true); const saved = source.saved()[0];
  for (const lineId of ['QA-MISSING-LINE', 'LINE-ALI-01']) {
    const record = clone(saved); record.lineId = lineId; record.importedLine = { lineId, name: '过期线路名称', status: '已停用', enterpriseIds: ['7522240'] };
    const existingLines = clone(fixture().CloudCallData.lines), fresh = fixture({ store: new Map([[storageKey, JSON.stringify([record])]]) });
    assert.equal(fresh.imported().length, 1); assert.deepStrictEqual(clone(fresh.CloudCallData.lines), existingLines);
    fresh.api.restore(); assert.equal(fresh.imported().length, 1); assert.equal(fresh.writes, 0);
    fresh.prepare(disabledNumber); assert.equal(fresh.api.submit(), true); assert.equal(fresh.saved().length, 2);
    for (const number of fresh.saved()) { assert(!Object.hasOwn(number, 'lineId')); assert(!Object.hasOwn(number, 'importedLine')); }
    assert.deepStrictEqual(clone(fresh.saved()[0].alictiNumber), record.alictiNumber); assert.deepStrictEqual(clone(fresh.CloudCallData.lines), existingLines);
  }
});

check('提交准备阶段异常不落盘，完成展示异常不误报为导入失败或重复写入', () => {
  const preparation = fixture(); preparation.prepare(enabledNumber); const before = importSnapshot(preparation); let ids = 0;
  preparation.crypto = { randomUUID() { if (++ids === 2) throw Error('QA batch preparation failed'); return 'QA-PREPARED-NUMBER'; } };
  assert.equal(preparation.api.submit(), false); unchanged(preparation, before);
  const committed = fixture(); committed.prepare(enabledNumber); const render = committed.PlatformUI.openLayer; committed.PlatformUI.openLayer = () => { throw Error('QA result display failed'); };
  assert.throws(() => committed.api.submit(), /QA result display failed/); assert.equal(committed.imported().length, 1); assert.equal(committed.saved().length, 1); assert.equal(committed.CloudCallData.numberOnboardingBatches.length, 1); assert.equal(committed.writes, 1);
  committed.PlatformUI.openLayer = render; assert.equal(committed.api.submit(), false); assert.equal(committed.writes, 1);
  const fresh = fixture({ store: committed.store }); assert.equal(fresh.imported().length, 1);
});

check('无绑定或存在重复绑定的账号不能导入号码，停用租户仍计入占用',()=>{
  for(const kind of ['missing','duplicate','disabled']){const c=fixture();const owner=c.CloudCallData.tenants.find(t=>t.tenantId==='TEN-NISSAN-HQ');
    if(kind==='missing')c.CloudCallData.tenants=c.CloudCallData.tenants.filter(t=>t!==owner);
    else if(kind==='duplicate')c.CloudCallData.tenants.push({...owner,tenantId:'DUP',status:'停用'});
    else owner.status='停用';
    assert.equal(c.api.open(),false);assert.equal(c.writes,0);
  }
});
check('确认前唯一归属失效时整批不写入',()=>{const c=fixture();c.prepare(enabledNumber);const before=importSnapshot(c);const owner=c.CloudCallData.tenants.find(t=>t.tenantId==='TEN-NISSAN-HQ');c.CloudCallData.tenants.push({...owner,tenantId:'DUP'});assert.equal(c.api.submit(),false);unchanged(c,before);});
console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', scope: 'AliCti number import with local fixtures, simulated provider responses, storage, permissions and real resource-component load order; browser verification is separate', notLiveIntegration: true, count: checks.length, integratedFiles, checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
