// UI-contract checks through the picker's public API and registered DOM events.
// No browser globals or private picker state are accessed.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const base = process.argv[2] || process.cwd();
const source = fs.readFileSync(path.join(base, 'js/components/business-store-picker.js'), 'utf8');
let count = 0;
const check = (condition, message) => { assert.ok(condition, message); count++; };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const encode = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const decode = value => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const key = (code, type = 'NEV') => JSON.stringify([type, code]);
const stores = [
  { code: 'N01', name: '模拟一店', type: 'NEV', province: '广东省', city: '广州市', district: '天河区', group: '广州组', businessType: '零售交付中心', status: '启用', address: '模拟天河路1号' },
  { code: 'N02', name: '模拟二店', type: 'NEV', province: '广东省', city: '深圳市', district: '南山区', group: '深圳组', businessType: '零售交付中心', status: '启用', address: '模拟南山路2号' },
  { code: 'N01', name: '模拟燃油店', type: 'ICE', province: '北京市', city: '北京市', district: '朝阳区', group: '北京组', businessType: '专营店', status: '启用', address: '模拟朝阳路3号' }
];

class Element {
  constructor(tagName = 'DIV', dataset = {}) {
    this.tagName = tagName; this.dataset = dataset; this.listeners = {}; this.value = ''; this.disabled = false; this.hidden = false; this.textContent = ''; this.checked = false; this._html = ''; this.attributes = {};
    const classes = new Set();
    this.classList = { toggle: (name, force) => force ? classes.add(name) : classes.delete(name), contains: name => classes.has(name) };
  }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  fire(name, extra = {}) {
    const event = { target: this, currentTarget: this, preventDefault() {}, ...extra };
    for (const listener of this.listeners[name] || []) listener(event);
  }
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
    for (const name of ['search-form', 'reset', 'expand', 'more', 'cancel', 'confirm', 'clear', 'rows', 'series', 'condition-field', 'condition-label', 'scope', 'message', 'query', 'count', 'selection', 'table-scroll']) this.parts.set(`[data-store-${name}]`, new Element());
    this.filters = ['code', 'name', 'province', 'city', 'district', 'group', 'businessType', 'status'].map(name => {
      const input = new Element(['code', 'name'].includes(name) ? 'INPUT' : 'SELECT', { storeFilter: name });
      this.parts.set(`[data-store-filter="${name}"]`, input); return input;
    });
    const body = this.parts.get('[data-store-rows]');
    Object.defineProperty(body, 'innerHTML', { get: () => body._html, set: html => {
      body._html = html;
      this.rows = [...html.matchAll(/data-store-row="([^"]+)"/g)].map(match => {
        const row = new Element('TR', { storeRow: decode(match[1]) });
        row.checkbox = new Element('INPUT', { storeCheckbox: '' }); row.checkbox.value = row.dataset.storeRow; row.checkbox.parent = row;
        row.querySelector = selector => selector === '[data-store-checkbox]' ? row.checkbox : null;
        return row;
      });
    } });
  }
  querySelector(selector) { return this.parts.get(selector) || null; }
  querySelectorAll(selector) { return selector === '[data-store-filter]' ? this.filters : selector === '[data-store-row]' ? this.rows : []; }
}

function harness() {
  let node = null;
  const events = { opened: 0, closed: 0, chosen: [], restored: 0, queried: 0 };
  const state = { active: true, available: true, ready: true, status: 'idle', stamp: 'scope-A', items: [], series: [{ code: 'NEV-A', name: '模拟车系' }], current: [] };
  const sandbox = { console, document: { getElementById: () => node }, window: null };
  sandbox.window = sandbox;
  sandbox.PlatformUI = {
    escape: encode,
    openLayer() { node = new PickerNode(); events.opened++; },
    closeLayer() { if (node) node.isConnected = false; node = null; events.closed++; }
  };
  vm.createContext(sandbox); vm.runInContext(source, sandbox);
  let queryImpl = async () => { state.status = 'complete'; state.items = structuredClone(stores); };
  let chooseResult = true;
  const options = {
    key: 'seat-followup:intendedStore',
    getState: () => state,
    query: async () => { events.queried++; return queryImpl(); },
    choose: value => { events.chosen.push(Array.from(value)); return chooseResult; },
    restoreFocus: () => events.restored++
  };
  return {
    picker: sandbox.BusinessStorePicker, state, events, options,
    get node() { return node; },
    setQuery(fn) { queryImpl = fn; }, setChooseResult(value) { chooseResult = value; },
    field(name) { return node.querySelector(`[data-store-filter="${name}"]`); },
    button(name) { return node.querySelector(`[data-store-${name}]`); },
    stage(value) { const row = node.rows.find(item => item.dataset.storeRow === value); if (!row) throw new Error('Missing selectable row: ' + value); node.querySelector('[data-store-rows]').fire('click', { target: row }); },
    confirm() { node.querySelector('[data-store-confirm]').fire('click'); },
    search() { node.querySelector('[data-store-search-form]').fire('submit'); },
    detach() { if (node) node.isConnected = false; node = null; }
  };
}

(async () => {
  const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); count++; };
  const selected = h => h.node.rows.filter(row => row.checkbox.checked).map(row => row.dataset.storeRow);
  let h = harness();
  check(h.picker.open(h.options), 'eligible field opens picker');
  await tick();
  check(h.events.queried === 1 && h.node.rows.length === 3, 'opening fetches the complete current scope');
  check(!h.button('confirm').disabled, 'complete result allows confirming an empty optional selection');
  h.stage(key('N01')); h.stage(key('N02'));
  equal(selected(h), [key('N01'), key('N02')], 'two different rows remain checked together');
  check(h.events.chosen.length === 0 && h.button('selection').textContent.startsWith('已选 2 家'), 'multiple rows stay provisional and footer counts all selected rows');
  h.button('cancel').fire('click');
  check(h.events.chosen.length === 0 && !h.node && h.events.restored === 1, 'cancel discards the provisional collection and restores focus');

  h = harness(); h.picker.open(h.options); await tick();
  h.stage(key('N01')); h.stage(key('N01', 'ICE'));
  const confirmButton = h.button('confirm'); confirmButton.fire('click'); confirmButton.fire('click');
  equal(h.events.chosen, [[key('N01'), key('N01', 'ICE')]], 'confirm sends the exact type/code collection once, including same-code distinct items');
  check(!h.node && h.events.restored === 1, 'successful confirmation closes and restores focus');

  h = harness(); h.picker.open(h.options); await tick(); h.confirm();
  equal(h.events.chosen, [[]], 'confirmation can intentionally clear all stores');
  h = harness(); h.picker.open(h.options); await tick();
  h.stage(key('N01')); h.stage(key('N02')); h.button('clear').fire('click');
  equal(selected(h), [], 'clear-all removes all provisional checks');
  check(h.button('selection').textContent === '已选 0 家' && !h.button('confirm').disabled, 'clear-all leaves an explicit empty confirmation available');
  h.confirm(); equal(h.events.chosen, [[]], 'clear-all commits an empty collection once');

  h = harness(); h.state.current = [stores[0], stores[1]]; h.picker.open(h.options); await tick();
  equal(selected(h), [key('N01'), key('N02')], 'complete query prechecks every matching current store');
  check(h.events.chosen.length === 0, 'prefilling does not restore pending old values without explicit confirmation');
  h.confirm(); equal(h.events.chosen, [[key('N01'), key('N02')]], 'confirm explicitly brings back the matching current collection');
  h = harness(); h.state.current = { ...stores[0], state: 'pending' }; h.picker.open(h.options); await tick();
  equal(selected(h), [key('N01')], 'legacy single-store object is compatible with collection display');
  h.picker.close(); check(h.events.chosen.length === 0, 'closing a prechecked legacy value never writes it');

  h = harness();
  h.state.current = [stores[0], { code: 'GONE1', name: '原一店', type: 'NEV' }, { code: 'GONE2', name: '原二店', type: 'NEV' }];
  h.picker.open(h.options); await tick();
  equal(selected(h), [key('N01')], 'old unmatched stores are not made selectable');
  check(h.button('message').textContent.includes('原一店（GONE1）') && h.button('message').textContent.includes('原二店（GONE2）'), 'each old unmatched store is named in the warning');
  check(h.button('message').textContent.includes('未勾选的旧门店将移除'), 'confirmation explains the replacement collection semantics');
  h.confirm(); equal(h.events.chosen, [[key('N01')]], 'confirmation only includes checked matching stores');

  h = harness(); h.picker.open(h.options); await tick();
  const tbody = h.button('rows'), firstCheckbox = h.node.rows[0].checkbox;
  tbody.fire('click', { target: firstCheckbox }); firstCheckbox.checked = true; tbody.fire('change', { target: firstCheckbox });
  equal(selected(h), [key('N01')], 'checkbox native click plus change toggles once');
  tbody.fire('click', { target: firstCheckbox }); firstCheckbox.checked = false; tbody.fire('change', { target: firstCheckbox });
  equal(selected(h), [], 'checkbox native second click plus change clears once');
  tbody.fire('keydown', { target: h.node.rows[0], key: ' ' });
  tbody.fire('keydown', { target: h.node.rows[1], key: 'Enter' });
  equal(selected(h), [key('N01'), key('N02')], 'keyboard Space and Enter toggle independent rows');
  h.stage(key('N01')); equal(selected(h), [key('N02')], 'clicking an already selected row removes only that row');
  h.picker.close(); check(h.events.chosen.length === 0, 'shared header/Escape/backdrop close entry discards all provisional changes');

  h = harness(); h.picker.open(h.options); await tick();
  h.stage(key('N01')); h.state.stamp = 'scope-B'; h.picker.refresh();
  check(h.button('confirm').disabled && h.button('selection').textContent === '已选 0 家', 'scope change invalidates the provisional collection');
  h.confirm(); check(h.events.chosen.length === 0, 'stale scope cannot commit after refresh');
  check(h.node.rows.length === 0, 'old complete status is not reused to authorize a new scope');
  h.search(); await tick(); h.stage(key('N02')); h.state.stamp = 'scope-C'; h.confirm();
  check(h.events.chosen.length === 0, 'commit independently rechecks the scope before refresh');

  for (const unavailable of ['available', 'ready']) {
    h = harness(); h.picker.open(h.options); await tick(); h.stage(key('N01')); h.stage(key('N02'));
    h.state[unavailable] = false; h.confirm();
    check(h.events.chosen.length === 0 && h.button('confirm').disabled, unavailable + ' loss blocks provisional collection commit');
    h.state[unavailable] = true; h.picker.refresh();
    check(h.button('confirm').disabled && h.node.rows.length === 0, unavailable + ' recovery requires a new query');
    h.search(); await tick(); check(!h.button('confirm').disabled, unavailable + ' recovery permits a newly completed query');
  }
  h = harness(); h.picker.open(h.options); await tick(); h.stage(key('N01'));
  h.state.active = false; h.picker.refresh();
  check(!h.node && h.events.chosen.length === 0, 'parent context disappearance closes without committing');

  h = harness(); h.state.status = 'complete'; h.state.items = structuredClone(stores);
  h.setQuery(async () => { throw new Error('simulated provider interruption'); });
  h.picker.open(h.options); await tick();
  check(h.node.rows.length === 0 && h.button('confirm').disabled, 'rejected query never authorizes old cached complete results');
  h.picker.close();

  h = harness(); h.setQuery(async () => { h.state.status = 'failed'; h.state.items = [stores[0]]; });
  h.picker.open(h.options); await tick();
  check(h.node.rows.length === 0 && h.button('confirm').disabled, 'incomplete/partial response exposes no selectable rows');
  h.setQuery(async () => { h.state.status = 'complete'; h.state.items = structuredClone(stores); });
  h.search(); await tick();
  check(h.events.queried === 2 && h.node.rows.length === 3, 'incomplete query can be retried in place');

  h = harness(); const old = deferred();
  h.setQuery(async () => { h.state.status = 'loading'; await old.promise; h.state.status = 'complete'; h.state.items = structuredClone(stores); });
  h.picker.open(h.options);
  check(h.button('confirm').disabled && h.node.rows.length === 0, 'loading prevents provisional selection and empty confirmation');
  h.picker.close(); old.resolve(); await tick();
  check(!h.node && h.events.opened === 1 && h.events.chosen.length === 0, 'response after cancellation does not reopen or commit');

  h = harness(); const a = deferred(), b = deferred();
  const stateA = { ...h.state }, stateB = { ...h.state, stamp: 'another-call', items: [] };
  const optionsA = { ...h.options, key: 'call-A', getState: () => stateA, query: async () => { stateA.status = 'loading'; await a.promise; stateA.status = 'complete'; stateA.items = [stores[0]]; } };
  const optionsB = { ...h.options, key: 'call-B', getState: () => stateB, query: async () => { stateB.status = 'loading'; await b.promise; stateB.status = 'complete'; stateB.items = [stores[1]]; } };
  h.picker.open(optionsA); h.picker.close(); h.picker.open(optionsB);
  a.resolve(); await tick();
  check(h.node.dataset.pickerKey === 'call-B' && h.node.rows.length === 0 && h.button('confirm').disabled, 'old session completion cannot alter new session loading state');
  b.resolve(); await tick(); h.stage(key('N02')); h.confirm();
  equal(h.events.chosen, [[key('N02')]], 'new session remains usable after stale response');

  h = harness(); const revoked = deferred();
  h.setQuery(async () => { h.state.status = 'loading'; await revoked.promise; h.state.status = 'complete'; h.state.items = structuredClone(stores); });
  h.picker.open(h.options); h.state.available = false; h.picker.refresh(); h.state.available = true; h.picker.refresh();
  revoked.resolve(); await tick();
  check(h.button('confirm').disabled && h.node.rows.length === 0, 'source recovery never revives a request invalidated during authorization loss');
  h.setQuery(async () => { h.state.status = 'complete'; h.state.items = structuredClone(stores); }); h.search(); await tick();
  check(h.node.rows.length === 3 && !h.button('confirm').disabled, 'new authorized query restores selectable results');

  h = harness(); h.picker.open(h.options); await tick(); h.setChooseResult(false); h.stage(key('N01')); h.stage(key('N02')); h.confirm();
  check(!!h.node && h.events.chosen.length === 1, 'rejected underlying collection write leaves picker available for recovery');
  equal(selected(h), [key('N01'), key('N02')], 'rejected write preserves the provisional collection');

  h = harness(); h.picker.open(h.options); await tick(); h.stage(key('N01')); h.stage(key('N02'));
  h.field('province').value = '广东省'; h.field('province').fire('change'); h.search(); await tick();
  check(h.node.rows.length === 2, 'province filters the complete result without mutating scope');
  h.field('city').value = '广州市'; h.field('city').fire('change'); h.search(); await tick();
  check(h.node.rows.length === 1 && h.node.rows[0].dataset.storeRow === key('N01'), 'city narrows current province');
  equal(selected(h), [key('N01')], 'visible checked row is preserved while another checked row is filtered out');
  check(h.button('selection').textContent.startsWith('已选 2 家'), 'footer includes checked stores hidden by filters');
  h.field('province').value = '北京市'; h.field('province').fire('change'); h.search(); await tick();
  check(h.field('city').value === '' && h.field('district').value === '' && h.node.rows.length === 1, 'province change clears incompatible child region filters');
  h.button('reset').fire('click');
  check(h.node.rows.length === 3 && h.events.chosen.length === 0, 'filter reset restores all rows without committing');
  equal(selected(h), [key('N01'), key('N02')], 'repeated filtering and same-scope query retain all checked stores');
  h.field('name').value = '模拟二店'; h.field('name').fire('compositionstart'); h.field('name').fire('input'); h.search();
  check(h.node.rows.length === 3, 'Chinese composition prevents accidental submit');
  h.field('name').fire('compositionend'); h.search(); await tick();
  check(h.node.rows.length === 1 && h.node.rows[0].dataset.storeRow === key('N02'), 'completed Chinese search applies exact input');
  h.confirm(); equal(h.events.chosen, [[key('N01'), key('N02')]], 'confirmation includes selected stores hidden by active filters');

  h = harness(); h.picker.open(h.options); await tick();
  h.button('expand').fire('click'); check(h.button('more').hidden, 'extra filters can be collapsed');
  h.button('expand').fire('click'); check(!h.button('more').hidden, 'extra filters can be expanded again');
  h.picker.close();

  h = harness(); h.setQuery(async () => { h.state.status = 'complete'; h.state.items = []; });
  h.picker.open(h.options); await tick();
  check(h.node.rows.length === 0 && !h.button('confirm').disabled, 'complete empty result still permits explicit empty confirmation');
  h.setQuery(async () => { h.state.status = 'complete'; h.state.items = structuredClone(stores); }); h.search(); await tick();
  check(h.events.queried === 2 && h.node.rows.length === 3, 'query after complete empty result fetches current upstream data again');

  h = harness(); h.picker.open(h.options); await tick(); h.stage(key('N01')); h.stage(key('N02'));
  h.field('province').value = '广东省'; h.field('province').fire('change');
  h.field('city').value = '广州市'; h.field('city').fire('change');
  const refreshDelay = deferred();
  h.setQuery(async () => { h.state.status = 'loading'; h.state.items = []; h.picker.refresh(); await refreshDelay.promise; h.state.status = 'complete'; h.state.items = structuredClone(stores); });
  h.search();
  check(h.field('province').value === '广东省' && h.field('city').value === '广州市', 'reload preserves filter input nodes and region options while loading');
  check(h.node.rows.length === 0 && h.button('confirm').disabled && h.button('selection').textContent.startsWith('已选 2 家'), 'query temporarily hides rows and disables commit while retaining provisional checks');
  refreshDelay.resolve(); await tick();
  check(h.node.rows.length === 1 && h.node.rows[0].checkbox.checked, 'fresh complete response applies filters and keeps the visible check');
  h.button('reset').fire('click'); equal(selected(h), [key('N01'), key('N02')], 'fresh complete response preserves selected stores across filters');
  h.setQuery(async () => { h.state.status = 'failed'; h.state.items = []; }); h.search(); await tick();
  check(h.button('confirm').disabled && h.button('selection').textContent.startsWith('已选 2 家'), 'incomplete refresh retains the draft checks but blocks confirmation');
  h.setQuery(async () => { h.state.status = 'complete'; h.state.items = [stores[1]]; }); h.search(); await tick();
  equal(selected(h), [key('N02')], 'complete result removes only provisional stores that are actually absent');
  check(h.button('message').textContent.includes('模拟一店（N01）') && h.button('message').textContent.includes('最新查询结果'), 'removed provisional store is explicitly identified');
  h.confirm(); equal(h.events.chosen, [[key('N02')]], 'only full-result matching choices can be committed after refresh');

  h = harness(); h.state.hasConditions = false; h.state.series = [];
  h.picker.open(h.options); await tick();
  check(h.button('condition-field').hidden && !h.button('scope').hidden, 'independent lookup hides the linked-field condition and shows authorized tenant scope');
  check(h.events.queried === 1 && h.node.rows.length === 3 && !h.button('confirm').disabled, 'independent lookup queries without any selected upstream value');
  h.stage(key('N01')); h.stage(key('N01','ICE')); h.confirm();
  equal(h.events.chosen, [[key('N01'),key('N01','ICE')]], 'independent multi-select can confirm all returned authorized types');
  h = harness(); h.state.hasConditions = true; h.state.dependencyName = '上游查询结果'; h.state.dependencyLabel = '关联字段';
  h.picker.open(h.options); await tick();
  check(!h.button('condition-field').hidden && h.button('scope').hidden && h.button('condition-label').textContent === '上游查询结果', 'linked lookup labels its configured upstream field without requiring an intention-series name');
  h.state.ready = false; h.state.series = []; h.picker.refresh();
  check(h.button('message').textContent.includes('上游查询结果') && h.button('confirm').disabled, 'missing configured upstream value blocks confirmation and names its field');
  h.picker.close();
  h = harness(); h.state.hasConditions = false; h.state.series = [];
  h.setQuery(async () => { h.state.status = 'complete'; h.state.items = []; }); h.picker.open(h.options); await tick();
  check(h.button('rows').innerHTML.includes('当前租户暂无可用门店') && !h.button('confirm').disabled, 'independent complete empty result has tenant-scoped wording and explicit empty confirmation');
  h.state.hasConditions = true; h.state.stamp = 'changed-mapping'; h.picker.refresh();
  check(h.button('confirm').disabled && !h.button('condition-field').hidden && h.button('scope').hidden, 'changing independent lookup into a dependency invalidates cached choices and updates condition visibility');
  h.picker.close();

  h = harness(); Object.assign(h.state,{hasConditions:true,conditionRequired:false,hasConditionValue:false,series:[]});
  h.picker.open(h.options); await tick();
  check(h.button('series').innerHTML.includes('未提供（可选）')&&!h.button('series').innerHTML.includes('尚未选择'), 'optional omitted upstream explicitly displays that no condition is provided');
  check(!h.button('condition-field').hidden&&!h.button('scope').hidden&&h.button('scope').textContent==='未提供可选条件，当前租户全部可用门店', 'optional omitted condition clearly describes the unfiltered authorized tenant scope');
  check(h.events.queried===1&&h.node.rows.length===3&&!h.button('confirm').disabled&&!h.button('message').textContent.includes('请先'), 'optional omitted condition remains selectable without suggesting a prerequisite');
  h.state.hasConditionValue=true;h.state.series=[{code:'NEV-A',name:'已提供的上游值'}];h.state.stamp='with-optional-value';h.picker.refresh();
  check(h.button('scope').hidden&&h.button('series').innerHTML.includes('已提供的上游值')&&h.button('confirm').disabled, 'provided optional value restores the condition chip and requires a query in its new scope');
  h.state.ready=false;h.state.hasConditionValue=false;h.picker.refresh();
  check(h.button('scope').hidden&&!h.button('series').innerHTML.includes('未提供（可选）')&&h.button('confirm').disabled, 'invalid populated upstream is not described as an omitted optional condition or an all-store query');
  h.picker.close();
  h=harness();h.state.series=[];h.picker.open(h.options);await tick();
  check(h.button('series').innerHTML.includes('尚未选择关联字段值')&&h.button('scope').hidden, 'legacy caller snapshots without explicit optional flags retain the previous display');
  h.picker.close();
  h=harness();Object.assign(h.state,{hasConditions:true,conditionRequired:false,hasConditionValue:false,series:[]});
  h.setQuery(async()=>{h.state.status='complete';h.state.items=[];});h.picker.open(h.options);await tick();
  check(h.button('rows').innerHTML.includes('当前租户暂无可用门店')&&!h.button('confirm').disabled, 'empty result under an omitted optional condition uses tenant-scoped wording');
  h.picker.close();

  h = harness(); h.state.active = false;
  check(!h.picker.open(h.options) && h.events.opened === 0, 'inactive context cannot open picker');
  h.state.active = true; h.picker.open(h.options); await tick(); h.detach(); h.picker.refresh();
  check(h.picker.open(h.options) && h.events.opened === 2, 'removed picker opens cleanly without orphan session');
  h.picker.close(false);
  console.log(JSON.stringify({ passed: count, status: 'passed' }));
})().catch(error => { console.error(error); process.exitCode = 1; });
