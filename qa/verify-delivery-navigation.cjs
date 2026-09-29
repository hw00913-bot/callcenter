/* Execute shared delivery navigation in a minimal DOM. No network or provider calls. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../js/delivery-nav.js'), 'utf8');
const checks = [];
function setup(href, embedded = false) {
  const events = {}, redirects = [], history = [], messages = [], frameLoads = [];
  function matches(node, selector) {
    if (selector.startsWith('.')) return node.className.split(' ').includes(selector.slice(1));
    const attr = selector.match(/^\[([^\]]+)\]$/);
    return !!attr && node.attrs[attr[1]] !== undefined;
  }
  class Node {
    constructor(tag) { this.tagName = tag; this.children = []; this.attrs = {}; this.dataset = {}; this.listeners = {}; this.className = ''; this.classList = {
      add: (...names) => { this.className = [...new Set(this.className.split(' ').filter(Boolean).concat(names))].join(' '); },
      remove: name => { this.className = this.className.split(' ').filter(n => n !== name).join(' '); },
      toggle: (name, on) => on ? this.classList.add(name) : this.classList.remove(name),
      contains: name => this.className.split(' ').includes(name)
    }; if (tag === 'iframe') this.contentWindow = { location: { replace: target => frameLoads.push(target) } }; }
    setAttribute(key, value) { this.attrs[key] = value; }
    removeAttribute(key) { delete this.attrs[key]; }
    getAttribute(key) { return this.attrs[key]; }
    appendChild(node) { this.children.push(node); return node; }
    insertBefore(node, before) { const i = this.children.indexOf(before); this.children.splice(i < 0 ? 0 : i, 0, node); }
    querySelectorAll(selector) { return this.children.flatMap(n => (matches(n, selector) ? [n] : []).concat(n.querySelectorAll(selector))); }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    closest(selector) { return matches(this, selector) ? this : null; }
  }
  const body = new Node('body'), head = new Node('head'), documentListeners = {};
  const location = new URL(href); location.replace = target => redirects.push(target);
  const root = new URL(href.slice(0, href.indexOf('/prototype/') + '/prototype/'.length));
  const ctx = { URL, URLSearchParams, Event: function(name) { this.type = name; }, location,
    document: { body, head, currentScript: { src: new URL('js/delivery-nav.js', root).href },
      createElement: tag => new Node(tag), querySelector: selector => body.querySelectorAll(selector)[0] || null,
      getElementById: id => [...head.children, ...body.children].find(n => n.id === id) || null,
      addEventListener: (name, fn) => { documentListeners[name] = fn; }
    },
    addEventListener: (name, fn) => { events[name] = fn; }, dispatchEvent() {},
    history: { pushState(state, _, target) { history.push({ mode: 'push', state, target }); location.href = target; }, replaceState(state, _, target) { history.push({ mode: 'replace', state, target }); location.href = target; } }
  };
  ctx.window = ctx; ctx.self = ctx; ctx.top = embedded ? {} : ctx;
  ctx.parent = embedded ? { postMessage: message => messages.push(message) } : ctx;
  vm.runInNewContext(source, ctx, { filename: 'delivery-nav.js' });
  const all = () => body.querySelectorAll('[data-delivery-nav]');
  function click(key, extras = {}) {
    const tabs = all()[0].children[1], link = tabs.children.find(n => n.dataset.deliveryKey === key);
    // Real DOM dataset attributes support selectors as well.
    link.attrs['data-delivery-key'] = key;
    const event = { target: link, prevented: false, button: 0, preventDefault() { this.prevented = true; }, ...extras };
    if (tabs.listeners.click) tabs.listeners.click(event);
    return { event, link };
  }
  return { ctx, body, all, click, events, redirects, history, messages, frameLoads, documentListeners, Node };
}
function check(name, run) { run(); checks.push(name); }
const base = 'http://127.0.0.1:8773/Demo_Protype_2/prototype/';
check('独立功能文档的交付页签使用实际目标文件且不拦截普通跳转', () => {
  const s = setup(base + 'docs/functional-spec.html#FS-10');
  for (const [key, suffix] of [['prototype', 'index.html'], ['docs', 'docs/functional-spec.html'], ['business-flow', 'flowcharts/business-process.html'], ['sequence-flow', 'flowcharts/sequence-interaction.html'], ['related-systems', 'related-systems/index.html']]) {
    const { event, link } = s.click(key); assert.equal(event.prevented, false); assert.equal(link.href, base + suffix);
  }
  assert.equal(s.frameLoads.length, 0); assert.equal(s.history.length, 0); assert.equal(s.body.children.some(n => n.tagName === 'iframe'), false);
  assert.equal(s.ctx.location.hash, '#FS-10');
});
check('独立流程与蓝图也保留普通链接和当前页标记', () => {
  for (const [page, key] of [['flowcharts/business-process.html', 'business-flow'], ['flowcharts/sequence-interaction.html', 'sequence-flow'], ['related-systems/index.html', 'related-systems']]) {
    const s = setup(base + page); assert.equal(s.click(key).link.attrs['aria-current'], 'page'); assert.equal(s.click('docs').event.prevented, false); assert.equal(s.frameLoads.length, 0);
  }
});
check('离线file文档跳转仍指向同一原型目录', () => {
  const s = setup('file:///tmp/交付/prototype/docs/functional-spec.html');
  assert.equal(s.click('related-systems').link.href, 'file:///tmp/%E4%BA%A4%E4%BB%98/prototype/related-systems/index.html');
  assert.equal(s.click('related-systems').event.prevented, false);
});
check('此前失效的文档delivery锚点直接修正到对应目标文件', () => {
  const s = setup(base + 'docs/functional-spec.html#delivery=related-systems'); assert.deepEqual(s.redirects, [base + 'related-systems/index.html']); assert.equal(s.frameLoads.length, 0);
  const same = setup(base + 'docs/functional-spec.html#delivery=docs'); assert.equal(same.history[0].mode, 'replace'); assert.equal(same.ctx.location.hash, '');
});
check('单独打开带嵌入参数的文档不再误判成iframe', () => {
  const s = setup(base + 'docs/functional-spec.html?delivery_embed=1'); assert.equal(s.all().length, 1); assert.equal(s.click('related-systems').event.prevented, false);
});
check('原型壳仍使用交付iframe并保留返回原型行为', () => {
  const s = setup(base + 'index.html#predictive-tasks'); const opened = s.click('related-systems');
  assert.equal(opened.event.prevented, true); assert.equal(s.ctx.location.hash, '#delivery=related-systems'); assert.equal(s.frameLoads[0], base + 'related-systems/index.html?delivery_embed=1'); assert.equal(s.body.classList.contains('has-delivery-frame'), true);
  s.click('prototype'); assert.equal(s.body.classList.contains('has-delivery-frame'), false); assert.equal(s.ctx.location.hash, '');
});
check('原型页签允许Ctrl或Command打开新标签', () => {
  for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey']) { const s = setup(base + 'index.html'); assert.equal(s.click('docs', { [modifier]: true }).event.prevented, false); assert.equal(s.history.length, 0); }
});
check('嵌入文档的返回入口向父壳发送切换而不新增导航', () => {
  const s = setup(base + 'docs/functional-spec.html?delivery_embed=1', true), a = new s.Node('a'); a.setAttribute('data-delivery-switch', 'prototype');
  const event = { target: a, button: 0, preventDefault() { this.prevented = true; } }; s.documentListeners.click(event);
  assert.equal(event.prevented, true); assert.equal(s.messages[0].type, 'delivery-switch'); assert.equal(s.messages[0].key, 'prototype'); assert.equal(s.all().length, 0);
});
check('父壳仅响应自身iframe的切换消息', () => {
  const s = setup(base + 'index.html'), frame = s.body.children.find(n => n.tagName === 'iframe');
  s.events.message({ source: {}, data: { type: 'delivery-switch', key: 'docs' } }); assert.equal(s.history.length, 0);
  s.events.message({ source: frame.contentWindow, data: { type: 'delivery-switch', key: 'docs' } }); assert.equal(s.ctx.location.hash, '#delivery=docs');
});
console.log(JSON.stringify({ result: 'pass', scope: 'delivery_navigation_no_network', count: checks.length, checks }, null, 2));
