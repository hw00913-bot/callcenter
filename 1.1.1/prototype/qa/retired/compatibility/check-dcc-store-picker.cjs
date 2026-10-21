// DCC presentation boundaries through public picker APIs and real event handlers.
// Fixtures are deliberately fictional and do not prove any production contract.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const base = process.argv[2] || process.cwd();
const source = fs.readFileSync(path.join(base, 'js/components/business-store-picker.js'), 'utf8');
let count = 0;
const check = (condition, message) => { assert.ok(condition, message); count++; };
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); count++; };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const encode = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const decode = value => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const key = code => JSON.stringify(['NEV', code]);
const profile = { id: 'dcc', label: 'DCC v2返回结构模拟（全虚构）', missingFields: ['group', 'businessType', 'status', 'phone'], note: 'NEV按车系匹配；ICE返回来源内全部可用门店。真实契约待核验。' };
const stores = [
  { code: 'DCC-MOCK-001', name: '虚构跨页一店', type: 'NEV', province: '模拟广东省', city: '模拟广州市', district: '模拟天河区', group: '不应使用小组', businessType: '不应使用业务类型', status: '不应使用状态', phone: '不应使用售后电话', serviceTel: '不应使用售后电话', seriesNames: ['虚构车系甲'] },
  { code: 'DCC-MOCK-002', name: '虚构跨页二店', type: 'NEV', province: '模拟广东省', city: '模拟深圳市', district: '模拟南山区', group: '不应使用小组乙', businessType: '不应使用业务类型乙', status: '不应使用状态乙', phone: '不应使用售后电话乙', address: '虚构文档地址二号', seriesNames: ['虚构车系甲'] }
];

class Element {
  constructor(tagName = 'DIV', dataset = {}) {
    this.tagName = tagName; this.dataset = dataset; this.listeners = {}; this.value = ''; this.disabled = false; this.hidden = false; this.textContent = ''; this.checked = false; this._html = ''; this.attributes = {};
    const classes = new Set(); this.classList = { toggle: (name, force) => force ? classes.add(name) : classes.delete(name), contains: name => classes.has(name) };
  }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  fire(name, extra = {}) { for (const listener of this.listeners[name] || []) listener({ target: this, currentTarget: this, preventDefault() {}, ...extra }); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  matches(selector) { return selector === '[data-store-row]' ? 'storeRow' in this.dataset : selector === '[data-store-checkbox]' ? 'storeCheckbox' in this.dataset : false; }
  closest(selector) { return this.matches(selector) ? this : selector === 'button,a,input' && this.tagName === 'INPUT' ? this : this.parent?.closest(selector) || null; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  set innerHTML(value) { this._html = value; }
  get innerHTML() { return this._html; }
}
class PickerNode extends Element {
  constructor() {
    super(); this.isConnected = true; this.parts = new Map(); this.rows = [];
    for (const name of ['search-form', 'reset', 'expand', 'more', 'cancel', 'confirm', 'clear', 'rows', 'series', 'condition-field', 'condition-label', 'scope', 'message', 'query', 'count', 'selection']) this.parts.set(`[data-store-${name}]`, new Element());
    this.filters = ['code', 'name', 'province', 'city', 'district', 'group', 'businessType', 'status'].map(name => {
      const input = new Element(['code', 'name'].includes(name) ? 'INPUT' : 'SELECT', { storeFilter: name }); this.parts.set(`[data-store-filter="${name}"]`, input); return input;
    });
    const body = this.parts.get('[data-store-rows]');
    Object.defineProperty(body, 'innerHTML', { get: () => body._html, set: html => {
      body._html = html; this.rows = [...html.matchAll(/data-store-row="([^"]+)"/g)].map(match => {
        const row = new Element('TR', { storeRow: decode(match[1]) }); row.checkbox = new Element('INPUT', { storeCheckbox: '' }); row.checkbox.value = row.dataset.storeRow; row.checkbox.parent = row; row.querySelector = selector => selector === '[data-store-checkbox]' ? row.checkbox : null; return row;
      });
    } });
  }
  querySelector(selector) { return this.parts.get(selector) || null; }
  querySelectorAll(selector) { return selector === '[data-store-filter]' ? this.filters : selector === '[data-store-row]' ? this.rows : []; }
}
function harness(dcc = true) {
  let node = null, chosen = [], queries = 0;
  const state = { active: true, available: true, ready: true, status: 'idle', stamp: 'fictional-scope', items: [], series: [{ code: 'DCC-MOCK-SERIES-01', name: '虚构车系甲' }], current: [], demoProfile: dcc ? structuredClone(profile) : { id: 'standard' } };
  let query = async () => { state.status = 'complete'; state.items = structuredClone(stores); };
  const sandbox = { console, document: { getElementById: () => node }, window: null };
  sandbox.window = sandbox; sandbox.PlatformUI = { escape: encode, openLayer() { node = new PickerNode(); }, closeLayer() { node = null; } };
  vm.createContext(sandbox); vm.runInContext(source, sandbox);
  const options = { key: 'dcc-mock:store', getState: () => state, query: async () => { queries++; return query(); }, choose: keys => { chosen.push(Array.from(keys)); return true; } };
  return {
    picker: sandbox.BusinessStorePicker, state, options, get node() { return node; }, get chosen() { return chosen; }, get queries() { return queries; }, setQuery(fn) { query = fn; },
    field(name) { return node.querySelector(`[data-store-filter="${name}"]`); }, part(name) { return node.querySelector(`[data-store-${name}]`); },
    search() { this.part('search-form').fire('submit'); }, stage(code) { const row = node.rows.find(item => item.dataset.storeRow === key(code)); if (!row) throw new Error('Missing row ' + code); this.part('rows').fire('click', { target: row }); }
  };
}

function checkBifMetadata() {
  let received;
  const field = { id: 'intendedStore', label: '本次意向门店', type: 'interface', dictionaryId: 'store', useQueryConditions: false };
  const call = { callId: 'dcc-ui-mock', accountId: 'a1', enterpriseId: 'e1', tenantId: 't1', businessType: 'lead' };
  const node = { isConnected: true, dataset: { interfacePrefix: 'seat-followup', interfaceField: field.id, interfaceCall: call.callId }, querySelector: () => null };
  const ctx = { console, structuredClone, window: null, setTimeout: () => 0, document: { querySelectorAll: () => [node] },
    PlatformUI: { escape: encode }, AppState: { get: () => ({ ...call, activeDomain: 'CLOUD_CONTACT_CENTER', sessionId: 's1' }), effectiveAccess: () => ({ roleCode: 'AGENT', valid: true }), authorizeObject: () => true },
    CustomerFollowup: { identity: value => value.callId }, CustomerBusiness: { fields: () => [field], catalog: () => ({ revision: 1 }) },
    BusinessData: { entry: id => ({ capabilityId: id }), capability: () => ({ kind: 'store', selectionMode: 'multiple' }), sourceVersion: () => 1, available: () => true, demoProfile: () => structuredClone(profile) },
    BusinessStorePicker: { open: options => { received = options.getState(); }, refresh() {} }
  };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(base, 'js/components/business-interface-field.js'), 'utf8'), ctx);
  ctx.BusinessInterfaceField.register('seat-followup', call, { intendedStore: [] }, 'AgentWorkbench.setFollowup');
  ctx.BusinessInterfaceField.open('seat-followup', field.id);
  check(received?.active && received.demoProfile?.id === 'dcc', 'public field open forwards DCC profile to picker state');
  equal(Array.from(received.demoProfile.missingFields), profile.missingFields, 'missing field metadata reaches picker without becoming selection data');
  delete ctx.BusinessData.demoProfile;
  ctx.BusinessInterfaceField.open('seat-followup', field.id);
  check(received?.active && received.demoProfile === undefined, 'older provider without optional metadata remains compatible');
}

(async () => {
  checkBifMetadata();
  let h = harness(); h.picker.open(h.options); await tick();
  for (const name of ['group', 'businessType', 'status']) {
    check(h.field(name).disabled && h.field(name).title.includes('接口未提供'), name + ' unavailable filter is disabled with an explanation');
    check(h.field(name).value === '' && h.field(name).innerHTML.includes('接口未提供'), name + ' cannot imply a usable all-values filter');
  }
  check(!h.field('code').disabled && !h.field('name').disabled && !h.field('province').disabled && !h.field('city').disabled && !h.field('district').disabled, 'documented code/name/province/city/district controls remain usable');
  check(h.field('district').innerHTML.includes(stores[0].district) && h.field('district').innerHTML.includes(stores[1].district), 'DCC v2 district options use the complete normalized results');
  check(!h.part('scope').hidden && h.part('scope').textContent.includes('全虚构') && h.part('scope').textContent.includes('真实契约待核验'), 'linked DCC mode always displays fictional and unverified source scope');
  check(h.part('scope').textContent.includes('读全分页才可选') && !h.part('scope').textContent.includes('2 / 2'), 'scope explains complete-page requirement without inventing page counts');
  const html = h.part('rows').innerHTML;
  check((html.match(/接口未提供/g) || []).length === 8, 'each DCC row explicitly marks four missing table columns');
  check(!html.includes('不应使用'), 'DCC missing fields ignore accidental group/business/status/phone values');
  check(html.includes('模拟广东省模拟广州市模拟天河区') && html.includes('虚构文档地址二号'), 'provided address and province/city/district fallback remain visible');
  check(h.part('scope').textContent.includes('区县本地筛选') && h.part('scope').textContent.includes('缺失占位，相关筛选禁用') && !h.part('scope').textContent.includes('区县、小组'), 'DCC v2 scope describes local district support and unavailable display fields');
  check(h.part('scope').textContent.length <= 110, 'DCC picker scope remains compact enough to preserve table space');
  check(h.node.rows.length === 2 && !h.part('confirm').disabled, 'complete fictional query permits original multi-select flow');
  h.stage(stores[0].code); h.stage(stores[1].code);
  check(h.part('selection').textContent.startsWith('已选 2 家') && h.chosen.length === 0, 'DCC choices stay provisional until confirm');
  h.part('cancel').fire('click'); check(!h.node && h.chosen.length === 0, 'DCC cancel does not write provisional choices');

  h = harness(); h.state.series = [{ code: 'DCC-MOCK-ICE-A', name: '虚构燃油车系甲', type: 'ICE' }];
  h.setQuery(async () => { h.state.status = 'complete'; h.state.items = [{ ...stores[0], type: 'ICE', seriesCodes: [], seriesNames: [] }]; });
  h.picker.open(h.options); await tick();
  check(h.part('rows').innerHTML.includes('store-picker-related">不适用</td>') && !h.part('rows').innerHTML.includes('虚构燃油车系甲'), 'ICE table relation is explicitly inapplicable and never fabricated from the selected series');
  h.state.items[0].seriesNames = ['不应使用燃油授权车系']; h.picker.refresh();
  check(!h.part('rows').innerHTML.includes('不应使用燃油授权车系') && h.part('rows').innerHTML.includes('store-picker-related">不适用</td>'), 'DCC ICE presentation does not imply an authorization relation from accidental payload fields');
  h.picker.close();

  h = harness(false); h.picker.open(h.options); await tick();
  h.field('group').value = stores[0].group; h.field('group').fire('change'); h.search(); await tick();
  check(h.node.rows.length === 1, 'ordinary mode keeps its current local group filter');
  h.state.demoProfile = structuredClone(profile); h.picker.refresh();
  check(h.field('group').value === '' && h.node.rows.length === 2, 'switching metadata to DCC clears hidden applied filters before displaying results');
  check(h.part('rows').innerHTML.includes('接口未提供') && !h.part('rows').innerHTML.includes(stores[0].group), 'profile change rerenders unchanged candidate rows with DCC placeholders');
  h.state.status = 'loading'; h.state.demoProfile = { id: 'standard' }; h.picker.refresh();
  check(!h.field('group').disabled && h.field('group').title === '' && h.field('group').innerHTML.includes('全部小组'), 'switching back restores enabled controls even while reloading');
  h.state.status = 'complete'; h.picker.refresh();
  check(h.field('group').innerHTML.includes(stores[0].group) && h.part('rows').innerHTML.includes(stores[0].group), 'ordinary mode repopulates its documented mock fields');
  check(h.part('scope').hidden, 'ordinary linked mode retains previous scope visibility'); h.picker.close();

  h = harness(); h.setQuery(async () => { h.state.status = 'failed'; h.state.message = '模拟第 2 页失败，请重试'; h.state.items = [stores[0]]; }); h.picker.open(h.options); await tick();
  check(h.part('message').textContent === '模拟第 2 页失败，请重试' && !h.part('message').hidden, 'DCC explanation never replaces pagination failure feedback');
  check(!h.part('scope').hidden && h.part('confirm').disabled && h.node.rows.length === 0, 'DCC scope stays visible without authorizing partial rows');
  h.state.ready = false; h.state.message = '请先填写虚构车系甲'; h.picker.refresh();
  check(h.part('message').textContent === '请先填写虚构车系甲' && h.field('status').disabled, 'required-upstream feedback survives DCC disabled-field hints');
  h.picker.close();

  h = harness(); h.state.current = [{ code: 'DCC-MOCK-OLD', name: '虚构原门店', type: 'NEV' }]; h.picker.open(h.options); await tick();
  check(h.part('message').textContent.includes('虚构原门店') && h.part('message').textContent.includes('未勾选的旧门店将移除'), 'DCC source note preserves old-value mismatch and replacement warnings');
  h.stage(stores[0].code); h.stage(stores[1].code); h.part('confirm').fire('click');
  equal(h.chosen, [[key(stores[0].code), key(stores[1].code)]], 'DCC multi-select uses existing type/code collection confirmation');

  h = harness(); h.state.hasConditions = false; h.state.series = []; h.picker.open(h.options); await tick();
  check(h.part('condition-field').hidden && !h.part('scope').hidden && h.part('scope').textContent.includes('全虚构'), 'independent DCC lookup clearly identifies its simulated scope');
  h.field('province').value = stores[0].province; h.field('province').fire('change'); h.field('city').value = stores[0].city; h.field('city').fire('change'); h.search(); await tick();
  check(h.node.rows.length === 1, 'DCC supports provided province/city filtering after full query');
  h.field('district').value = stores[0].district; h.field('district').fire('change'); h.search(); await tick();
  check(h.node.rows.length === 1 && h.field('district').value === stores[0].district, 'DCC district filter combines with provided province/city over the complete results');
  h.part('reset').fire('click');
  check(h.node.rows.length === 2 && !h.field('district').disabled && h.field('district').value === '' && h.field('group').disabled, 'reset clears supported district filtering while unavailable controls stay disabled');
  h.field('district').value = stores[1].district; h.field('district').fire('change'); h.search(); await tick();
  check(h.node.rows.length === 1 && h.part('rows').innerHTML.includes(stores[1].code), 'DCC v2 supports normalized district filtering over complete results');
  h.state.demoProfile.pageSummary = '模拟适配器已完整读取 2 / 2 页'; h.picker.refresh();
  check(h.part('scope').textContent.includes('模拟适配器已完整读取 2 / 2 页'), 'optional trusted page summary is shown only when supplied'); h.picker.close();
  console.log(JSON.stringify({ passed: count, status: 'passed', scope: 'DCC picker missing fields, source explanations, metadata compatibility and existing multi-select events' }));
})().catch(error => { console.error(error); process.exitCode = 1; });
