/** Public follow-up tab contract, using the real form, validation and import lifecycle. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const base = process.argv[2] || path.resolve(__dirname, '..');
let passed = 0;
const check = (condition, message) => { assert.ok(condition, message); passed++; };
const copy = value => structuredClone(value);
const encode = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const decode = value => String(value).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const dataKey = name => name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
const flush = async () => { for (let index = 0; index < 10; index++) await Promise.resolve(); };

// Deliberately small DOM: parses actual generated markup, keeps node identity,
// and supports only ordinary DOM operations used by the public tab contract.
class Element {
  constructor(tag, attributes = {}, document = null) {
    this.tagName = tag.toUpperCase(); this.attributes = {}; this.dataset = {}; this.children = []; this.parentElement = null;
    this.ownerDocument = document; this.style = {}; this._text = ''; this._hidden = false; this.value = ''; this.disabled = false;
    for (const [name, value] of Object.entries(attributes)) this.setAttribute(name, value);
    this.classList = {contains: name => (this.getAttribute('class') || '').split(/\s+/).includes(name), toggle: (name, force) => {
      const classes = new Set((this.getAttribute('class') || '').split(/\s+/).filter(Boolean));
      if (force === undefined ? !classes.has(name) : force) classes.add(name); else classes.delete(name);
      this.setAttribute('class', [...classes].join(' '));
    }};
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith('data-')) this.dataset[dataKey(name)] = String(value);
    if (name === 'hidden') this._hidden = true;
    if (name === 'value') this.value = String(value);
    if (name === 'disabled') this.disabled = true;
    if (name === 'tabindex') this.tabIndex = Number(value);
  }
  getAttribute(name) { if (name === 'hidden') return this.hidden ? '' : null; return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }
  hasAttribute(name) { return this.getAttribute(name) !== null; }
  removeAttribute(name) {
    delete this.attributes[name];
    if (name.startsWith('data-')) delete this.dataset[dataKey(name)];
    if (name === 'hidden') this._hidden = false;
    if (name === 'disabled') this.disabled = false;
  }
  get hidden() { return this._hidden; }
  set hidden(value) { this._hidden = !!value; if (value) this.attributes.hidden = ''; else delete this.attributes.hidden; }
  get id() { return this.attributes.id || ''; }
  set id(value) { this.setAttribute('id', value); }
  get isConnected() { return this === this.ownerDocument?.body || !!this.parentElement?.isConnected; }
  appendChild(child) { child.parentElement = this; child.ownerDocument = this.ownerDocument; this.children.push(child); return child; }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  remove() { if (this.parentElement) { const parent = this.parentElement; parent.children.splice(parent.children.indexOf(this), 1); this.parentElement = null; } }
  matches(selector) {
    return selector.split(',').some(part => {
      const text = part.trim();
      const tag = text.match(/^[a-z][\w-]*/i)?.[0];
      if (tag && this.tagName !== tag.toUpperCase()) return false;
      const id = text.match(/#([\w-]+)/)?.[1]; if (id && this.id !== id) return false;
      for (const [, name] of text.matchAll(/\.([\w-]+)/g)) if (!this.classList.contains(name)) return false;
      for (const [, name, double, single, bare] of text.matchAll(/\[([^\s=\]]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g)) {
        const expected = double ?? single ?? bare;
        if (!this.hasAttribute(name) || expected !== undefined && this.getAttribute(name) !== expected) return false;
      }
      return true;
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  querySelectorAll(selector) {
    const parts = selector.trim().split(/\s+(?![^\[]*\])/), last = parts.pop(), result = [];
    const visit = node => { for (const child of node.children) {
      if (child.matches(last)) {
        let ancestor = child.parentElement, index = parts.length - 1;
        while (ancestor && index >= 0) { if (ancestor.matches(parts[index])) index--; ancestor = ancestor.parentElement; }
        if (index < 0) result.push(child);
      }
      visit(child);
    }};
    visit(this); return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  focus() { if (!this.closest('[hidden]')) this.ownerDocument.activeElement = this; }
  scrollIntoView() {}
  addEventListener() {}
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children.forEach(child => { child.parentElement = null; }); this.children = []; }
  set innerHTML(html) { this.children.forEach(child => { child.parentElement = null; }); this.children = []; parseHTML(String(html), this); }
  set outerHTML(html) {
    const parent = this.parentElement; if (!parent) return;
    const holder = new Element('fragment', {}, this.ownerDocument); parseHTML(String(html), holder);
    const index = parent.children.indexOf(this); this.parentElement = null;
    parent.children.splice(index, 1, ...holder.children); holder.children.forEach(child => { child.parentElement = parent; });
  }
}
function parseHTML(html, parent) {
  const stack = [parent], voidTags = new Set(['input','br','hr','img','meta','link','area','base','embed','source','wbr']);
  for (const token of html.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+/g) || []) {
    if (token.startsWith('<!--')) continue;
    if (token.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
    if (token.startsWith('<')) {
      const tag = token.match(/^<([\w-]+)/)?.[1]; if (!tag) continue;
      const attributes = {};
      const text = token.slice(tag.length + 1, -1);
      for (const [, name, double, single, bare] of text.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attributes[name] = decode(double ?? single ?? bare ?? '');
      const node = new Element(tag, attributes, parent.ownerDocument); stack.at(-1).appendChild(node);
      if (!voidTags.has(tag.toLowerCase()) && !token.endsWith('/>')) stack.push(node);
    } else stack.at(-1)._text += decode(token);
  }
}

function harness(options = {}) {
  const state = {accountId:'a1',sessionId:'s1',enterpriseId:'e1',tenantId:'t1',activeDomain:'CLOUD_CONTACT_CENTER'};
  const sourceCall = {callId:'c1',...state,customerPhone:'13800000001',businessType:'lead',intentionSeriesCode:'NEV-A',intentionStoreCode:'N01',
    callSource:'NATIVE_WORKBENCH',processingStatus:'待填写',endedAt:'2026-10-16T00:00:00Z',direction:'呼出',callType:'人工外呼',answered:true};
  const fields = [{id:'intendedSeries',label:'本次意向车系',type:'interface',dictionaryId:'series',required:true},
    {id:'intendedStore',label:'本次意向门店',type:'interface',dictionaryId:'store',depends:['intendedSeries'],required:true},
    {id:'plannedStoreName',label:'计划到店门店',type:'text',required:true}];
  const series = [{code:'NEV-A',name:'模拟车系A',type:'NEV'},{code:'NEV-B',name:'模拟车系B',type:'NEV'}];
  const stores = [{code:'N01',name:'模拟一店',type:'NEV'},{code:'N02',name:'模拟二店',type:'NEV'}];
  const storage = new Map(), events = new Map(), timers = [], toasts = [], writes = [], pending = [];
  const stats = {register:0,updates:0,storageWrites:0,queries:0};
  let call = sourceCall, values = {}, layer = null, delayKind = '', queryMode = 'normal';
  const document = {activeElement:null,addEventListener:(name,callback) => events.set(name,callback)};
  document.body = new Element('body', {}, document);
  document.querySelectorAll = selector => document.body.querySelectorAll(selector);
  document.querySelector = selector => document.body.querySelector(selector);
  document.getElementById = id => document.body.querySelector('#' + id);
  const result = items => ({ok:true,complete:true,items:copy(items)});
  function lookup(kind, items) {
    stats.queries++;
    if (queryMode === 'unmatched') items = [];
    if (queryMode === 'unavailable') return Promise.resolve({ok:false,complete:false,items:[],message:'模拟来源暂不可用'});
    if (kind !== delayKind) return Promise.resolve(result(items));
    delayKind = ''; return new Promise(resolve => pending.push(() => resolve(result(items))));
  }
  const win = {console,structuredClone,Date,Map,Set,JSON,Object,String,Array,Number,Promise,window:null,document,
    setTimeout:callback => { timers.push(callback); return timers.length; },clearTimeout:() => {},
    localStorage:{getItem:key => storage.get(key) ?? null,setItem:(key,value) => { stats.storageWrites++; storage.set(key,String(value)); }},
    AppState:{get:() => state,effectiveAccess:() => ({roleCode:'AGENT',valid:true}),authorizeObject:() => true},
    PlatformUI:{escape:encode},CustomerDirectory:{phoneOf:row => row?.customerPhone,list:() => []},CloudCallData:{calls:[sourceCall]},
    CallState:{view:row => ({answered:row.answered})},showToast:(...args) => toasts.push(args),addEventListener:(name,callback) => events.set(name,callback),
    CustomerBusiness:{interfaceKind:field => field.type === 'interface' ? field.dictionaryId : '',catalog:() => ({revision:1}),
      fields:() => fields,get:() => ({id:'lead'}),list:() => [{id:'lead',label:'线索'}],callbackSnapshot:copy,
      importedDetail:row => '<dl data-imported-customer-info><dt>导入车系</dt><dd>' + encode(row.intentionSeriesCode || '未提供') + '</dd><dt>导入门店</dt><dd>' + encode(row.intentionStoreCode || '未提供') + '</dd></dl>'},
    BusinessData:{entry:id => ({capabilityId:id}),capability:id => ({kind:id}),sourceVersion:() => 1,available:() => true,env:{saveFail:false},
      querySeries:() => lookup('series',series),queryStores:(_,code) => lookup('store',stores.filter(row => code === 'NEV-A' || row.code === 'N02'))}
  };
  win.window = win; vm.createContext(win);
  for (const file of ['business-interface-field.js','customer-followup.js']) vm.runInContext(fs.readFileSync(path.join(base,'js/components',file),'utf8'),win,{filename:file});
  const C = win.CustomerFollowup, F = win.BusinessInterfaceField;
  const originalRegister = F.register;
  F.register = (...args) => { stats.register++; return originalRegister(...args); };
  win.AgentWorkbench = {setFollowup:(id,value) => { stats.updates++; writes.push([id,copy(value)]); values = C.update(values,call,id,value); }};
  function mount(nextCall = sourceCall, initial = {}, prefix = 'seat-followup') {
    call = nextCall; values = {...C.empty(call),...copy(initial)};
    const html = C.form(values,call,prefix,'AgentWorkbench.setFollowup');
    layer?.remove(); layer = new Element('section', {class:'platform-layer'},document); document.body.appendChild(layer); layer.innerHTML = html;
    return html;
  }
  function rerender(prefix = 'seat-followup') { const html = C.form(values,call,prefix,'AgentWorkbench.setFollowup'); form(prefix).outerHTML = html; return html; }
  function form(prefix = 'seat-followup') { return document.querySelectorAll('[data-followup-tabs]').find(node => node.dataset.followupPrefix === prefix) || null; }
  const button = (view,prefix = 'seat-followup') => form(prefix)?.querySelector('[data-followup-tab-button="' + view + '"]');
  const panel = (view,prefix = 'seat-followup') => form(prefix)?.querySelector('[data-followup-panel="' + view + '"]');
  function show(view,prefix = 'seat-followup') { return C.showTab(prefix,view,button(view,prefix)); }
  function keyboard(key,view = form()?.dataset.followupTab) {
    const target = button(view), event = {key,target,currentTarget:target,prevented:false,preventDefault(){this.prevented = true;}};
    C.tabKey('seat-followup',event); return event;
  }
  async function waitImport(kind = 'series') { delayKind = kind; const promise = F.bringOriginal('seat-followup'); await flush(); check(pending.length === 1,'controlled import pauses at ' + kind); return {promise,finish:pending.shift()}; }
  mount(sourceCall,options.values || {});
  return {win,C,F,state,sourceCall,fields,document,stats,toasts,writes,mount,rerender,form,button,panel,show,keyboard,waitImport,
    get call(){return call;},get values(){return values;},get layer(){return layer;},setMode:value => {queryMode = value;},
    change:(id,value) => {values = C.update(values,call,id,value);},close:() => {layer?.remove();},
    inputElsewhere:() => events.get('input')?.({target:document.getElementById('seat-followup-plannedStoreName')})};
}

(async () => {
  let h = harness(), root = h.form();
  check(typeof h.C.showTab === 'function' && typeof h.C.tabKey === 'function' && typeof h.C.revealField === 'function','public follow-up tab actions are available');
  check(root && root.dataset.followupTab === 'current','new form defaults to current information');
  check(root.dataset.followupIdentity === h.C.identity(h.call) && !!root.dataset.followupContext,'form carries exact call identity and editing context');
  check(h.button('current').getAttribute('role') === 'tab' && h.button('imported').getAttribute('role') === 'tab','both switches expose tab semantics');
  check(h.button('current').getAttribute('aria-selected') === 'true' && h.button('imported').getAttribute('aria-selected') === 'false','default tab selection is announced');
  check(h.button('current').tabIndex === 0 && h.button('imported').tabIndex === -1,'only active tab participates in sequential keyboard navigation');
  check(h.button('current').id === 'seat-followup-tab-current' && h.panel('current').id === 'seat-followup-panel-current','current tab IDs are prefix scoped');
  check(h.button('imported').id === 'seat-followup-tab-imported' && h.panel('imported').id === 'seat-followup-panel-imported','import tab IDs are prefix scoped');
  for (const view of ['current','imported']) {
    check(h.button(view).getAttribute('aria-controls') === h.panel(view).id,'tab controls its actual panel: ' + view);
    check(h.panel(view).getAttribute('role') === 'tabpanel' && h.panel(view).getAttribute('aria-labelledby') === h.button(view).id,'panel is labelled by its tab: ' + view);
    check(!h.panel(view).hasAttribute('aria-hidden') && !h.panel(view).hasAttribute('inert'),'panel keeps mounted interface lifecycle: ' + view);
  }
  check(!h.panel('current').hidden && h.panel('imported').hidden,'only current panel occupies space initially');
  check(h.panel('current').contains(h.document.getElementById('seat-followup-plannedStoreName')),'ordinary editable fields are within current panel');
  check(h.panel('current').contains(h.document.getElementById('seat-followup-intendedSeries')),'interface editable fields are within current panel');
  check(h.panel('imported').textContent.includes('NEV-A') && h.panel('imported').textContent.includes('N01'),'hidden import panel retains original codes');
  check(h.panel('imported').querySelectorAll('input,select,textarea').length === 0,'original imported details remain read only');
  check(h.panel('imported').textContent.includes('核对导入信息并确认带入'),'explicit confirmation is available alongside original details');

  const originalInput = h.document.getElementById('seat-followup-plannedStoreName'), originalInterface = h.document.getElementById('seat-followup-intendedSeries');
  const beforeValues = JSON.stringify(h.values), beforeStats = {...h.stats};
  h.show('imported');
  check(h.form() === root && h.panel('current').hidden && !h.panel('imported').hidden,'switch changes visibility without replacing the form');
  check(h.button('imported').getAttribute('aria-selected') === 'true' && h.button('current').getAttribute('aria-selected') === 'false','switch updates selected ARIA state');
  check(h.button('imported').tabIndex === 0 && h.button('current').tabIndex === -1,'switch updates roving tab indices');
  h.show('current'); h.show('imported');
  check(h.document.getElementById('seat-followup-plannedStoreName') === originalInput && h.document.getElementById('seat-followup-intendedSeries') === originalInterface,'both editable node identities survive repeated tab changes');
  check(JSON.stringify(h.values) === beforeValues && h.stats.updates === beforeStats.updates,'tab changes never update follow-up values');
  check(h.stats.register === beforeStats.register && h.stats.queries === beforeStats.queries,'tab changes neither register interfaces nor query providers');
  check(h.stats.storageWrites === 0 && !h.call.customerFollowup,'tab changes neither save data nor write presentation state to storage');
  check(!Object.hasOwn(h.values,'tab') && !Object.hasOwn(h.values,'followupTab'),'presentation state is absent from the business draft');

  h.rerender();
  check(h.form().dataset.followupTab === 'imported' && !h.panel('imported').hidden,'same-call same-context form rerender preserves active tab');
  h.mount({...h.sourceCall,callId:'c2'});
  check(h.form().dataset.followupTab === 'current','a different call cannot inherit the previous active tab');
  h.show('imported'); h.state.tenantId = 't2'; h.rerender();
  check(h.form().dataset.followupTab === 'current','a changed tenant context cannot inherit active tab');
  h = harness(); h.show('imported'); h.mount(h.sourceCall,{},'other-followup');
  check(h.form('other-followup').dataset.followupTab === 'current','a different editor prefix starts independently');
  h = harness();
  let event = h.keyboard('ArrowRight');
  check(event.prevented && h.form().dataset.followupTab === 'imported' && h.document.activeElement === h.button('imported'),'ArrowRight activates and focuses next tab');
  event = h.keyboard('ArrowRight');
  check(event.prevented && h.form().dataset.followupTab === 'current','ArrowRight wraps from final tab');
  h.keyboard('ArrowLeft'); check(h.form().dataset.followupTab === 'imported','ArrowLeft wraps to previous tab');
  h.keyboard('Home'); check(h.form().dataset.followupTab === 'current' && h.document.activeElement === h.button('current'),'Home returns to first tab');
  h.keyboard('End'); check(h.form().dataset.followupTab === 'imported' && h.document.activeElement === h.button('imported'),'End activates final tab');
  event = h.keyboard('x'); check(!event.prevented && h.form().dataset.followupTab === 'imported','unrelated key leaves selection and default behavior untouched');

  h = harness(); h.show('imported');
  let result = h.C.validate(h.values,h.call);
  check(!result.ok && result.field === 'intendedSeries','hidden required interface field is still validated');
  const importOwner = h.form(), hiddenOrdinaryInput = h.document.getElementById('seat-followup-plannedStoreName');
  result = await h.F.query('seat-followup','intendedSeries');
  check(result.ok,'interface queries remain active while their panel is hidden');
  check(h.F.choose('seat-followup','intendedSeries',JSON.stringify(['NEV','NEV-A'])) && h.values.intendedSeries.code === 'NEV-A','hidden interface can receive an explicit confirmed selection');
  check(h.panel('current').hidden && h.form() === importOwner && h.document.getElementById('seat-followup-plannedStoreName') === hiddenOrdinaryInput,'hidden interface redraw preserves the form owner, ordinary draft input and selected tab');
  result = h.C.validate(h.values,h.call); check(!result.ok && result.field === 'intendedStore','next hidden required field is validated');
  await h.F.query('seat-followup','intendedStore');
  check(h.F.choose('seat-followup','intendedStore',JSON.stringify(['NEV','N01'])),'hidden downstream selection uses the real dependency query');
  result = h.C.validate(h.values,h.call); check(!result.ok && result.field === 'plannedStoreName','ordinary required field is validated independently of panel visibility');
  h.change('plannedStoreName','本次人工计划门店');
  check(h.C.validate(h.values,h.call).ok,'valid hidden form follows the original validation chain');
  const saved = h.C.save(h.call,h.values,{wrapping:true,expectedVersion:''});
  check(saved.ok && saved.values.intendedStore[0]?.code === 'N01' && saved.values.plannedStoreName === '本次人工计划门店','saving from imported tab commits the real hidden business draft');
  check(!Object.hasOwn(saved.values,'followupTab') && !Object.hasOwn(saved.values,'tab'),'saved business values contain no presentation tab state');
  check(h.form().dataset.followupTab === 'imported','business save itself does not recreate or switch the mounted panel');
  h.C.revealField('seat-followup',h.call);
  check(!h.panel('current').hidden && h.panel('imported').hidden,'error reveal first makes current panel visible');
  h.document.getElementById('seat-followup-plannedStoreName').focus();
  check(h.document.activeElement === h.document.getElementById('seat-followup-plannedStoreName'),'after reveal the existing erroneous field can receive focus');
  h.show('imported'); h.C.revealField('seat-followup',{...h.call,callId:'old-call'});
  check(h.form().dataset.followupTab === 'imported','stale error identity cannot switch another call form');

  h = harness(); h.show('imported');
  let importStatus = h.form().querySelector('[data-followup-import-status]'), importButton = h.form().querySelector('[data-followup-import-action]');
  check(importStatus && importStatus.getAttribute('role') === 'status' && importStatus.getAttribute('aria-live') === 'polite','import feedback has an accessible live status in the imported panel');
  check(importButton && !importButton.disabled,'original confirmation starts available');
  h.C.setImportStatus('seat-followup',h.call,true,'正在核对模拟导入信息',h.form());
  check(!importStatus.hidden && importStatus.textContent.includes('正在核对') && importStatus.getAttribute('aria-busy') === 'true','busy feedback is visible beside the imported information');
  check(importButton.disabled && importButton.getAttribute('aria-busy') === 'true','busy confirmation prevents duplicate button activation');
  h.show('current'); h.show('imported');
  check(h.form().querySelector('[data-followup-import-status]') === importStatus && importButton.disabled,'view changes preserve pending feedback and button state');
  h.C.setImportStatus('seat-followup',h.call,false,'核对未完成，请重试',h.form());
  check(!importButton.disabled && importStatus.getAttribute('aria-busy') === 'false' && !importStatus.hidden,'an unfinished confirmation restores the action and leaves actionable feedback');
  h.C.setImportStatus('seat-followup',h.call,false,'',h.form());
  check(importStatus.hidden && !importStatus.textContent,'empty feedback is removed from the panel height');
  const oldOwner = h.form(); h.close(); h.mount(); h.show('imported');
  importStatus = h.form().querySelector('[data-followup-import-status]'); importButton = h.form().querySelector('[data-followup-import-action]');
  h.C.setImportStatus('seat-followup',h.call,true,'旧窗口的过期状态',oldOwner);
  h.C.revealField('seat-followup',h.call,oldOwner);
  check(!importButton.disabled && importStatus.hidden && h.form().dataset.followupTab === 'imported','closed owner cannot change status or tab of a reopened same-call editor');

  h = harness(); h.show('imported');
  await h.F.bringOriginal('seat-followup');
  check(h.values.intendedSeries.code === 'NEV-A' && h.values.intendedStore[0]?.code === 'N01','explicit import confirms original series and store into the mounted draft');
  check(h.form().dataset.followupTab === 'current' && !h.panel('current').hidden,'successful original-data confirmation returns to current information');
  check(h.toasts.some(([,tone]) => tone === 'success'),'successful confirmation keeps the existing success feedback');
  check(h.sourceCall.intentionSeriesCode === 'NEV-A' && h.sourceCall.intentionStoreCode === 'N01','confirmation preserves imported source information');
  for (const mode of ['unmatched','unavailable']) {
    h = harness(); h.show('imported'); h.setMode(mode); const before = JSON.stringify(h.values);
    await h.F.bringOriginal('seat-followup');
    check(h.form().dataset.followupTab === 'imported','unsuccessful ' + mode + ' confirmation keeps imported page available');
    check(JSON.stringify(h.values) === before && !h.toasts.some(([,tone]) => tone === 'success'),'unsuccessful ' + mode + ' confirmation preserves draft and never reports completion');
    check(!h.form().querySelector('[data-followup-import-status]').hidden && !h.form().querySelector('[data-followup-import-action]').disabled,'unsuccessful ' + mode + ' confirmation leaves visible feedback and an enabled retry action');
  }
  for (const kind of ['series','store']) {
    h = harness(); h.show('imported'); const waiting = await h.waitImport(kind);
    check(h.form().querySelector('[data-followup-import-action]').disabled && !h.form().querySelector('[data-followup-import-status]').hidden,'in-progress ' + kind + ' confirmation exposes busy feedback on the visible imported tab');
    h.show('current'); h.show('imported'); waiting.finish(); await waiting.promise;
    check(h.values.intendedStore[0]?.code === 'N01','view-only switching does not cancel in-progress ' + kind + ' confirmation');
    check(h.form().dataset.followupTab === 'current','successful delayed ' + kind + ' confirmation reveals the completed draft');
    check(!h.form().querySelector('[data-followup-import-action]').disabled,'completed ' + kind + ' confirmation restores the original action');
  }
  for (const action of ['close','write','input','new-call','new-scope']) {
    h = harness(); h.show('imported'); const waiting = await h.waitImport();
    if (action === 'close') h.close();
    if (action === 'write') h.change('plannedStoreName','后续人工填写');
    if (action === 'input') h.inputElsewhere();
    if (action === 'new-call') { h.mount({...h.sourceCall,callId:'new-call'}); h.show('imported'); }
    if (action === 'new-scope') h.state.tenantId = 'new-tenant';
    const before = JSON.stringify(h.values), writeCount = h.writes.length;
    waiting.finish(); await waiting.promise;
    check(JSON.stringify(h.values) === before && h.writes.length === writeCount,'late import cannot overwrite after ' + action);
    check(!h.toasts.some(([,tone]) => tone === 'success'),'late import cannot announce success after ' + action);
    if (action !== 'close') check(h.form().dataset.followupTab === 'imported','late import cannot steal selected tab after ' + action);
  }
  h = harness(); h.show('imported'); const older = await h.waitImport();
  h.close(); h.mount(); h.show('imported'); const newer = await h.waitImport();
  older.finish(); await older.promise;
  check(h.form().querySelector('[data-followup-import-action]').disabled && h.form().dataset.followupTab === 'imported','old same-call completion cannot clear busy state or switch the reopened editor');
  check(!h.values.intendedSeries && !h.values.intendedStore.length,'old same-call completion cannot populate the new editor while its own confirmation waits');
  newer.finish(); await newer.promise;
  check(h.values.intendedStore[0]?.code === 'N01' && h.form().dataset.followupTab === 'current','new owner can finish its own confirmation after the old request settles');
  console.log(JSON.stringify({passed,status:'passed',scope:'mounted follow-up tabs, original import, hidden validation and call/context isolation'}));
})().catch(error => {console.error(error);process.exitCode = 1;});
