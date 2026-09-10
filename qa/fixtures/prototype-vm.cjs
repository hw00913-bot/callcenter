/**
 * Self-contained current-prototype fixture. Loads actual index scripts and
 * authenticates through their demo login handlers. DOM, storage, clocks and
 * locks below are doubles: this is not browser or real telephony evidence.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../DEMO_PROTYPE');
const storage = values => ({ getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key), clear: () => values.clear() });

function setup(profile = 'admin', domain = 'CLOUD_CONTACT_CENTER', instance = 'CCC-NISSAN') {
  const nodes = new Map(), queries = new Map(), layers = new Map();
  const session = new Map(), local = new Map(), timers = new Map();
  const listeners = new Map(), messages = [], events = [];
  let timerId = 0;
  function element(id = '', value = '') {
    const attributes = new Map(), classes = new Set();
    const node = {
      id, value, checked: false, disabled: false, hidden: false, innerHTML: '',
      textContent: '', scrollTop: 0, dataset: {}, style: {}, parentElement: {},
      classList: {
        add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name),
        toggle(name, force) { const add = force === undefined ? !classes.has(name) : force; add ? classes.add(name) : classes.delete(name); return add; }
      },
      setAttribute: (key, value) => attributes.set(key, String(value)), getAttribute: key => attributes.get(key) ?? null, removeAttribute: key => attributes.delete(key),
      querySelector: () => null, querySelectorAll: () => [], focus() {}, scrollIntoView() {}, addEventListener() {},
      appendChild(child) { if (child.id) nodes.set(child.id, child); return child; }, append(...children) { children.forEach(child => this.appendChild(child)); },
      remove() { nodes.delete(this.id); layers.delete(this.id); }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  function field(id, value) { const node = nodes.get(id) || element(id); node.value = value; return node; }
  function addEventListener(type, listener) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(listener); }
  const sandbox = {
    console, structuredClone, crypto: require('node:crypto'), Date, Map, Set,
    sessionStorage: storage(session), localStorage: storage(local),
    setTimeout(fn, ms) { timers.set(++timerId, { fn, ms }); return timerId; }, clearTimeout: id => timers.delete(id),
    setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    navigator: { locks: { request: async (name, options, callback) => callback({ name }) } },
    location: { hash: '', pathname: '/', search: '' }, history: { replaceState() {}, pushState() {} },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    addEventListener, dispatchEvent: event => (listeners.get(event.type) || []).forEach(listener => listener(event)),
    document: { getElementById: id => nodes.get(id) || null, querySelector: query => queries.get(query)?.[0] || null, querySelectorAll: query => queries.get(query) || [], createElement: () => element(), addEventListener, body: element() }
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]).filter(script => !script.startsWith('annotations/') && script !== 'js/delivery-nav.js');
  for (const script of scripts) vm.runInContext(fs.readFileSync(path.join(root, script), 'utf8'), ctx, { filename: script });
  ctx.showToast = (m, t) => messages.push({ m, t });
  ctx.PlatformUI.openLayer = (id, html) => { layers.set(id, html); element(id); };
  ctx.PlatformUI.closeLayer = id => { layers.delete(id); nodes.delete(id); };
  ctx.navigateTo = (key, options) => events.push({ key, options });
  const selectedProfile = ctx.CloudCallData.demoProfiles.find(item => item.profileId === profile);
  assert(selectedProfile, `Unknown fixture profile: ${profile}`);
  const account = ctx.CloudCallData.accounts.find(item => item.accountId === selectedProfile.accountId);
  field('authUsername', account.loginUsername); field('authPassword', account.password); field('authCaptcha', 'a8Cq');
  assert.equal(ctx.AppState.submitLogin(), true, 'Demo account should authenticate');
  if (ctx.AppState.get().authStage === 'TENANT') ctx.AppState.chooseTenant(selectedProfile.defaultTenantId);
  if (ctx.AppState.get().authStage === 'INSTANCE') ctx.AppState.chooseInstance(instance);
  if (ctx.AppState.get().authStage === 'DOMAIN') ctx.AppState.chooseDomain(domain);
  if (ctx.AppState.isSuper() && ctx.AppState.get().instanceId !== instance) ctx.AppState.setInstance(instance);
  assert.equal(ctx.AppState.get().activeDomain, domain, 'Requested domain should be active');
  assert.equal(ctx.AppState.get().instanceId, instance, 'Requested instance should be active');
  assert.equal(ctx.AppState.effectiveAccess().valid, true, 'Fixture should have a valid business context');
  messages.length = 0; events.length = 0;
  const decode = text => text.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return {
    ctx, d: ctx.CloudCallData, nodes, queries, layers, messages, events, session, local, timers, field,
    render: () => ctx.Pages.home.render({ workbenchView: 'overview' }),
    click(html, label) {
      const match = [...html.matchAll(/<button\b[^>]*onclick="([^"]*)"[^>]*>([\s\S]*?)<\/button>/g)].find(item => item[2].includes(label));
      assert(match, `Button not found: ${label}`);
      return vm.runInContext(decode(match[1]), ctx);
    }
  };
}
module.exports = { root, setup };
