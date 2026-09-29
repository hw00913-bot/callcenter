/* Actual Storage prototype wrapper checks; no application or network stubs. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'js/alicti-storage.js'), 'utf8');
const prefix = 'alicti-demo-v2:', packedPrefix = '\u001ealicti-json-dict-v1:';
const keys = ['customer-task-batches-v1', 'local-task-result-journal-v1', 'customer-directory-v1'];
const checks = [];
function check(name, fn) { fn(); checks.push(name); }
function fixture(initial = {}, options = {}) {
  const local = new Map(Object.entries(initial)), session = new Map(Object.entries(options.session || {})), listeners = new Map(), writes = [];
  let reject = options.reject || (() => false), quota = options.quota ?? Infinity;
  class Storage {
    constructor(map) { this.map = map; }
    getItem(name) { return this.map.get(String(name)) ?? null; }
    setItem(name, value) {
      name = String(name); value = String(value);
      const size = [...this.map].reduce((total, [key, text]) => total + (key === name ? 0 : key.length + text.length), name.length + value.length);
      if (reject(name, value) || size > quota) throw Object.assign(new Error('QuotaExceededError'), { name: 'QuotaExceededError' });
      this.map.set(name, value); writes.push({ name, value });
    }
    removeItem(name) { this.map.delete(String(name)); }
    clear() { this.map.clear(); }
    key(index) { return [...this.map.keys()][index] ?? null; }
    get length() { return this.map.size; }
  }
  const locks = [], context = { Storage, localStorage: new Storage(local), sessionStorage: new Storage(session), navigator: { locks: { request: (name, fn) => { locks.push(name); return fn?.(); } } }, addEventListener: (name, listener) => listeners.set(name, listener) };
  context.window = context; vm.createContext(context); vm.runInContext(source, context);
  return { ...context, local, session, listeners, writes, locks, reject: value => { reject = value; }, quota: value => { quota = value; } };
}
const record = { tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', customerTaskItemId: 'SHOWCASE-HQ-20260921-PRED-SAME-TASK-FOLLOWUP-C01', taskId: 'SHOWCASE-HQ-20260921-PRED-SAME-TASK-FOLLOWUP', note: '客户约定在原任务再次联系，保留历史记录。', result: '接通', longText: '需要保留空格、顺序和JSON原始字符，不重写客户记录。' };
const sample = (count = 240) => JSON.stringify(Array.from({ length: count }, (_, index) => ({ ...record, id: 'ROW-' + index })), null, 2);
check('三个既有大键逐项无损迁移，命名空间之外及其他键原样保留', () => {
  const original = sample(), initial = Object.fromEntries(keys.map(name => [prefix + name, original]));
  initial['other-application'] = original; initial[prefix + 'ordinary-key'] = original;
  const c = fixture(initial, { session: { [prefix + keys[0]]: original } });
  for (const name of keys) { assert(c.local.get(prefix + name).startsWith(packedPrefix)); assert.equal(c.localStorage.getItem(name), original); }
  assert.equal(c.sessionStorage.getItem(keys[0]), original); assert(c.session.get(prefix + keys[0]).startsWith(packedPrefix));
  assert.equal(c.local.get('other-application'), original); assert.equal(c.local.get(prefix + 'ordinary-key'), original);
  assert.equal(c.localStorage.getItem('other-application'), null); assert.equal(c.localStorage.getItem('ordinary-key'), original);
  assert.equal(c.localStorage.key(0), keys[0]); assert.equal(c.AliCtiStorageNamespace, prefix);
});
check('中文、引号、反斜杠、控制字符转义、Unicode及原始格式逐字还原', () => {
  const special = '中文😀\u0000\u0001\u001e\t\r\n"\\ / \\u0001 \\" literal';
  const value = '\r\n \t' + JSON.stringify(Array.from({ length: 100 }, () => ({ special, escaped: '\\u4e2d', nested: record })), null, '\t').replaceAll('中文', '\\u4e2d\\u6587') + '\n';
  const c = fixture(); c.localStorage.setItem(keys[0], value);
  assert(c.local.get(prefix + keys[0]).startsWith(packedPrefix)); assert.equal(c.localStorage.getItem(keys[0]), value);
  assert.deepEqual(JSON.parse(c.localStorage.getItem(keys[0])), JSON.parse(value));
  const reloaded = fixture(Object.fromEntries(c.local)); assert.equal(reloaded.localStorage.getItem(keys[0]), value); assert.equal(reloaded.writes.length, 0);
});
check('仅压缩有效且更小的JSON，小文本及损坏原文不重写', () => {
  for (const text of ['{broken', 'x'.repeat(3000), '{"unclosed":"' + 'value'.repeat(300), packedPrefix + 'invalid-envelope', packedPrefix + JSON.stringify([['"word"'], '\u0001zz;'])]) {
    const c = fixture({ [prefix + keys[0]]: text }); assert.equal(c.local.get(prefix + keys[0]), text); assert.equal(c.localStorage.getItem(keys[0]), text); assert.equal(c.writes.length, 0);
  }
  const c = fixture(); for (const text of ['null', '[1, 2, 3]', '"one string"', '{}', '{broken']) { c.localStorage.setItem(keys[0], text); assert.equal(c.local.get(prefix + keys[0]), text); assert.equal(c.localStorage.getItem(keys[0]), text); }
});
check('原始数字写法、重复属性、孤立代理字符和多位字典引用均不被规范化', () => {
  const raw = '[\n' + Array.from({ length: 400 }, (_, index) => '{"__proto__":"保留原始属性和字符-' + index + '","duplicate":"保留原始属性和字符-' + index + '","duplicate":"保留原始属性和字符-' + index + '","number":-0.00e+10,"surrogate":"\\uD800","slashes":"\\/\\\\"}').join(',\n') + '\n]';
  const c = fixture(); c.localStorage.setItem(keys[2], raw); assert.equal(c.localStorage.getItem(keys[2]), raw);
  const second = fixture(Object.fromEntries(c.local)); assert.equal(second.localStorage.getItem(keys[2]), raw); assert.equal(second.writes.length, 0);
});
check('迁移失败保留原文并继续其他键，后续配额失败保留旧压缩值', () => {
  const original = sample(), c = fixture(Object.fromEntries(keys.map(name => [prefix + name, original])), { reject: name => name === prefix + keys[0] });
  assert.equal(c.local.get(prefix + keys[0]), original); assert.equal(c.localStorage.getItem(keys[0]), original);
  assert(c.local.get(prefix + keys[1]).startsWith(packedPrefix)); assert(c.local.get(prefix + keys[2]).startsWith(packedPrefix));
  const before = c.local.get(prefix + keys[1]); c.reject(() => true);
  assert.throws(() => c.localStorage.setItem(keys[1], sample(300)), /QuotaExceededError/); assert.equal(c.local.get(prefix + keys[1]), before); assert.equal(c.localStorage.getItem(keys[1]), original);
  assert.throws(() => c.localStorage.setItem(keys[0], sample(300)), /QuotaExceededError/); assert.equal(c.local.get(prefix + keys[0]), original);
});
check('压缩显著降低体积并可在原文超出配额时原子写入', () => {
  const original = sample(1000), c = fixture(); c.localStorage.setItem(keys[0], original);
  const packed = c.local.get(prefix + keys[0]); assert(packed.length < original.length * 0.65, 'Expected at least 35% size reduction');
  const limited = fixture({}, { quota: packed.length + 100 }); limited.localStorage.setItem(keys[0], original); assert.equal(limited.localStorage.getItem(keys[0]), original);
  checks.push('体积：' + original.length + ' → ' + packed.length + ' 字符（' + (100 * packed.length / original.length).toFixed(1) + '%）');
});
check('多标签读取更新与storage事件保持解压后的透明值', () => {
  const c = fixture(), first = sample(120), second = sample(160); c.localStorage.setItem(keys[0], first);
  const before = c.local.get(prefix + keys[0]); assert.equal(c.localStorage.getItem(keys[0]), first);
  const other = fixture(); other.localStorage.setItem(keys[0], second); const after = other.local.get(prefix + keys[0]);
  c.local.set(prefix + keys[0], after); assert.equal(c.localStorage.getItem(keys[0]), second);
  const event = { key: prefix + keys[0], oldValue: before, newValue: after }; c.listeners.get('storage')(event);
  assert.equal(event.key, keys[0]); assert.equal(event.oldValue, first); assert.equal(event.newValue, second);
  let stopped = false; c.listeners.get('storage')({ key: 'other-application', stopImmediatePropagation() { stopped = true; } }); assert(stopped);
  c.navigator.locks.request('call-session', () => {}); assert.deepEqual(c.locks, [prefix + 'call-session']);
});
check('删除和清空只影响当前命名空间，未改变其他键的字符串转换', () => {
  const c = fixture({ outside: 'untouched' }); c.localStorage.setItem(keys[0], sample()); c.localStorage.setItem('number', 3); c.localStorage.setItem('nil', null);
  assert.equal(c.localStorage.getItem('number'), '3'); assert.equal(c.localStorage.getItem('nil'), 'null');
  c.localStorage.removeItem(keys[0]); assert.equal(c.localStorage.getItem(keys[0]), null); c.localStorage.clear(); assert.equal(c.local.get('outside'), 'untouched'); assert.equal(c.local.size, 1);
});
console.log(JSON.stringify({ result: 'pass', count: checks.length, checks }, null, 2));
