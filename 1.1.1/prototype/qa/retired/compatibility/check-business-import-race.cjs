/** Exercises the actual import action and follow-up update chain with controlled responses. */
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const base = process.argv[2] || process.cwd();
let count = 0;
const check = (value, message) => { assert.ok(value, message); count++; };
const copy = value => structuredClone(value);
const series = [{ code: 'NEV-A', name: '星云A', type: 'NEV' }, { code: 'NEV-B', name: '星云B', type: 'NEV' }, { code: 'ICE-A', name: '燃油A', type: 'ICE' }];
const stores = [{ code: 'N01', name: '新能源一店', type: 'NEV' }, { code: 'N02', name: '新能源中心店', type: 'NEV' }, { code: 'N03', name: '新能源三店', type: 'NEV' }, { code: 'I01', name: '燃油一店', type: 'ICE' }];
const fields = [{ id: 'intendedSeries', label: '本次意向车系', type: 'interface', dictionaryId: 'series' }, { id: 'intendedStore', label: '本次意向门店', type: 'interface', dictionaryId: 'store', depends: ['intendedSeries'] }, { id: 'plannedStoreName', label: '计划到店门店', type: 'text' }];
const response = items => ({ ok: true, complete: true, items: copy(items) });
const flush = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };

function harness(options = {}) {
  const state = { accountId: 'a1', sessionId: 's1', enterpriseId: 'e1', tenantId: 't1', activeDomain: 'CLOUD_CONTACT_CENTER' };
  const sourceCall = { callId: 'c1', enterpriseId: 'e1', tenantId: 't1', accountId: 'a1', customerPhone: '13800000001', businessType: options.flexibleType ? '' : 'lead', intentionSeriesCode: 'NEV-A', intentionStoreCode: 'N01' };
  let call = sourceCall, values, nodes = [], owner = null, layer = null, delayKind = '', sourceVersion = 1, enabled = true;
  const pending = [], events = new Map(), toasts = [], writes = [];
  function lookup(kind, items) {
    if (delayKind !== kind) return Promise.resolve(response(items));
    delayKind = '';
    return new Promise(resolve => pending.push({ kind, finish: () => resolve(response(items)) }));
  }
  const context = { console, structuredClone, setTimeout, clearTimeout, Date, Map, Set, JSON, Object, String, Array, Number, Promise, window: null,
    document: { querySelectorAll: () => nodes, getElementById: () => null, addEventListener: (name, callback) => events.set(name, callback) },
    AppState: { get: () => state, effectiveAccess: () => ({ roleCode: 'AGENT', valid: true }), authorizeObject: () => true },
    PlatformUI: { escape: value => String(value ?? '') },
    CustomerBusiness: { interfaceKind:field=>field.type==='interface'?field.dictionaryId:'', catalog: () => ({ revision: 1 }), fields: () => fields, get: () => ({ id: 'lead' }), list: () => [{ id: 'lead' }, { id: 'service' }], importedDetail: () => '', callbackSnapshot: copy },
    CustomerDirectory: { phoneOf: value => value?.customerPhone }, showToast: (...args) => toasts.push(args), addEventListener: (name, callback) => events.set(name, callback),
    BusinessData: { entry: id => ({ capabilityId: id }), capability: id => ({ kind: id }), sourceVersion: () => sourceVersion, available: () => enabled,
      querySeries: () => lookup('series', series), queryStores: (_, code) => {
        const ids = { 'NEV-A': ['N01', 'N02'], 'NEV-B': ['N02', 'N03'], 'ICE-A': ['I01'] }[code] || [];
        return lookup('store', stores.filter(row => ids.includes(row.code)));
      } }
  };
  context.window = context; vm.createContext(context);
  for (const file of ['business-interface-field.js', 'customer-followup.js']) vm.runInContext(fs.readFileSync(base + '/js/components/' + file, 'utf8'), context);
  const F = context.BusinessInterfaceField, C = context.CustomerFollowup;
  context.AgentWorkbench = { setFollowup: (id, value) => { writes.push([id, copy(value)]); values = C.update(values, call, id, value); } };
  function disconnect() { if (owner) owner.isConnected = false; if (layer) layer.isConnected = false; nodes.forEach(node => { node.isConnected = false; }); nodes = []; }
  function renderControls(form = owner, editorLayer = layer) {
    nodes.forEach(node => { node.isConnected = false; });
    nodes = fields.filter(field => field.type === 'interface').map(field => ({ isConnected: true, dataset: { interfacePrefix: 'seat-followup', interfaceField: field.id, interfaceCall: C.identity(call) },
      closest: selector => selector === '.customer-followup-form' ? form : selector === '.platform-layer' ? editorLayer : null,
      set outerHTML(value) { this.html = value; }, querySelector: () => null }));
  }
  function mount(nextCall = sourceCall, initial = {}) {
    disconnect(); call = nextCall; values = { ...C.empty(call), ...(options.flexibleType ? { businessType: 'lead' } : {}), ...copy(initial) };
    C.form(values, call, 'seat-followup', 'AgentWorkbench.setFollowup');
    const editorLayer = { isConnected: true, contains: target => target?.editorLayer === editorLayer };
    const form = { isConnected: true, closest: selector => selector === '.platform-layer' ? editorLayer : null, contains: target => target?.editorForm === form };
    owner = form; layer = editorLayer;
    renderControls();
  }
  function change(id, value) { values = C.update(values, call, id, value); }
  async function select(code, store) {
    await F.query('seat-followup', 'intendedSeries'); const item = series.find(row => row.code === code);
    check(F.choose('seat-followup', 'intendedSeries', JSON.stringify([item.type, item.code])), 'manual series selection succeeds');
    if (store) { await F.query('seat-followup', 'intendedStore'); const item = stores.find(row => row.code === store); check(F.choose('seat-followup', 'intendedStore', JSON.stringify([item.type, item.code])), 'manual store selection succeeds'); }
  }
  async function startAt(kind) { delayKind = kind; const promise = F.bringOriginal('seat-followup'); await flush(); check(pending.some(row => row.kind === kind), 'import is waiting at ' + kind); return { promise, finish: pending.shift().finish }; }
  mount();
  return { F, C, context, sourceCall, mount, disconnect, change, select, startAt, flush, renderControls, get values() { return values; }, get writes() { return writes; }, get toasts() { return toasts; },
    closeWithGhost: () => { const stale = nodes.map(node => ({ ...node, closest: () => ({ inert: true }), isConnected: true })); disconnect(); nodes = stale; },
    inputElsewhere: name => events.get(name)?.({ target: { editorLayer: layer } }), inputOutside: name => events.get(name)?.({ target: {} }),
    restoreSources: () => { sourceVersion++; enabled = false; events.get('business-data-change')(); sourceVersion++; enabled = true; events.get('business-data-change')(); } };
}

(async () => {
  {
    const h = harness(); await h.F.bringOriginal('seat-followup');
    check(h.values.intendedSeries.code === 'NEV-A' && h.values.intendedStore[0]?.code === 'N01', 'normal import finishes both owned writes');
    check(h.toasts.some(([, tone]) => tone === 'success'), 'normal import reports completion');
    check(h.sourceCall.intentionSeriesCode === 'NEV-A' && h.sourceCall.intentionStoreCode === 'N01', 'original imported information remains unchanged');
  }
  {
    const h = harness(); await h.select('NEV-B', 'N03'); await h.F.bringOriginal('seat-followup');
    check(h.values.intendedStore[0]?.code === 'N01' && h.values.intendedStore[0]?.state === 'valid', 'system mismatch-to-pending write does not cancel owned import');
  }
  {
    const h = harness(); await h.select('NEV-A', 'N02'); await h.F.bringOriginal('seat-followup');
    check(h.values.intendedStore[0]?.code === 'N01', 'system verification-scope update does not cancel import');
  }
  for (const kind of ['series', 'store']) {
    for (const action of ['clear', 'series', 'text', 'category', 'remark', 'disposition', 'close', 'reopen', 'new-call']) {
      const h = harness({ flexibleType: action === 'category' }); await h.select('NEV-B', 'N03');
      const waiting = await h.startAt(kind);
      if (action === 'clear') h.F.clear('seat-followup', 'intendedSeries');
      if (action === 'series') await h.select('ICE-A');
      if (action === 'text') h.change('plannedStoreName', '客服新计划');
      if (action === 'category') h.change('businessType', 'service');
      if (action === 'remark') h.inputElsewhere('input');
      if (action === 'disposition') h.inputElsewhere('change');
      if (action === 'close') h.disconnect();
      if (action === 'reopen') h.mount();
      if (action === 'new-call') h.mount({ ...h.sourceCall, callId: 'c2', customerPhone: '13800000002' });
      const before = JSON.stringify(h.values), writeCount = h.writes.length;
      waiting.finish(); await waiting.promise;
      check(JSON.stringify(h.values) === before, `${kind} response preserves subsequent ${action}`);
      check(!h.writes.slice(writeCount).some(([id, value]) => id === 'intendedSeries' && value?.code === 'NEV-A' || id === 'intendedStore' && (Array.isArray(value) ? value.some(item=>item?.code==='N01') : value?.code === 'N01')), `${kind} cancelled import performs no late imported selection after ${action}`);
      check(!h.toasts.some(([, tone]) => tone === 'success'), `${kind} cancelled import does not report completion after ${action}`);
    }
  }
  {
    const h = harness(); const old = await h.startAt('series'); h.F.clear('seat-followup', 'intendedSeries');
    await h.F.bringOriginal('seat-followup'); check(h.values.intendedStore[0]?.code === 'N01', 'new explicit import can run before cancelled request resolves');
    const before = JSON.stringify(h.values); old.finish(); await old.promise;
    check(JSON.stringify(h.values) === before, 'cancelled earlier request cannot disturb a newer completed action');
  }
  {
    const h = harness(); const waiting = await h.startAt('series'); h.inputOutside('input'); waiting.finish(); await waiting.promise;
    check(h.values.intendedStore[0]?.code === 'N01', 'input in an unrelated page does not cancel this editor action');
  }
  {
    const h = harness(); const waiting = await h.startAt('series'); h.restoreSources(); waiting.finish(); await waiting.promise;
    check(!h.values.intendedSeries && !h.values.intendedStore.length, 'source version change cannot import old query results');
  }
  {
    const h = harness(); const waiting = await h.startAt('series'); h.renderControls(); waiting.finish(); await waiting.promise;
    check(h.values.intendedStore[0]?.code === 'N01', 'redrawing field controls in the same editor does not cancel import');
  }
  {
    const h = harness(); const waiting = await h.startAt('series'); h.closeWithGhost(); waiting.finish(); await waiting.promise;
    check(!h.values.intendedSeries && !h.values.intendedStore.length, 'an inert exit visual cannot keep a closed editor action alive');
  }
  {
    const h = harness(); await h.select('NEV-B', 'N03'); h.restoreSources(); await h.F.bringOriginal('seat-followup');
    check(h.values.intendedSeries.code === 'NEV-A' && h.values.intendedStore[0]?.code === 'N01' && h.values.intendedStore[0]?.state === 'valid', 'system source-state synchronization allows a fresh explicit import');
  }
  console.log(JSON.stringify({ passed: count, status: 'passed' }));
})().catch(error => { console.error(error); process.exitCode = 1; });
