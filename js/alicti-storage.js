/* Isolate this prototype and losslessly compact its large JSON journals. */
(() => {
  'use strict';
  const prefix = 'alicti-demo-v2:', packedPrefix = '\u001ealicti-json-dict-v1:';
  const compactKeys = new Set(['customer-task-batches-v1', 'local-task-result-journal-v1', 'customer-directory-v1']);
  const proto = Storage.prototype;
  const get = proto.getItem, set = proto.setItem, remove = proto.removeItem, key = proto.key;
  const length = Object.getOwnPropertyDescriptor(proto, 'length').get;
  const cache = new WeakMap();
  const literals = /"(?:[^"\\]|\\.)*"/g;
  // U+0001 cannot occur literally anywhere in valid JSON. Escaped user text
  // such as "\\u0001" stays untouched, so dictionary references are unambiguous.
  const reference = index => '\u0001' + index.toString(36) + ';';
  function compact(text) {
    if (text.length < 256 || text.startsWith(packedPrefix)) return text;
    try { JSON.parse(text); } catch (_) { return text; }
    const counts = new Map();
    for (const match of text.matchAll(literals)) counts.set(match[0], (counts.get(match[0]) || 0) + 1);
    const candidates = [...counts].filter(([token, count]) => count > 1 && token.length >= 8)
      .sort((a, b) => (b[0].length - 8) * b[1] - (a[0].length - 8) * a[1]);
    const dictionary = [], indices = new Map();
    for (const [token, count] of candidates) {
      const literalCost = JSON.stringify(token).length - 2;
      const referenceCost = JSON.stringify(reference(dictionary.length)).length - 2;
      if ((literalCost - referenceCost) * count <= literalCost + 3) continue;
      indices.set(token, dictionary.length); dictionary.push(token);
    }
    if (!dictionary.length) return text;
    const encoded = text.replace(literals, token => indices.has(token) ? reference(indices.get(token)) : token);
    const packed = packedPrefix + JSON.stringify([dictionary, encoded]);
    return packed.length < text.length ? packed : text;
  }
  function unpack(text) {
    if (typeof text !== 'string' || !text.startsWith(packedPrefix)) return text;
    try {
      const value = JSON.parse(text.slice(packedPrefix.length));
      if (!Array.isArray(value) || value.length !== 2 || !Array.isArray(value[0]) || typeof value[1] !== 'string') return text;
      const [dictionary, encoded] = value;
      if (!dictionary.every(token => typeof token === 'string' && /^"(?:[^"\\]|\\.)*"$/.test(token) && typeof JSON.parse(token) === 'string')) return text;
      const restored = encoded.replace(/\u0001([0-9a-z]+);/g, (_, index) => {
        const position = parseInt(index, 36);
        if (!Number.isSafeInteger(position) || position >= dictionary.length) throw Error('Invalid JSON dictionary reference');
        return dictionary[position];
      });
      JSON.parse(restored);
      return restored;
    } catch (_) { return text; } // Corrupt stored bytes remain available to their owner.
  }
  function decoded(storage, storageKey, raw) {
    let entries = cache.get(storage);
    if (!entries) { entries = new Map(); cache.set(storage, entries); }
    const previous = entries.get(storageKey);
    if (previous?.raw === raw) return previous.value;
    const value = unpack(raw); entries.set(storageKey, { raw, value }); return value;
  }
  proto.getItem = function (name) {
    const nameText = String(name), storageKey = prefix + nameText, raw = get.call(this, storageKey);
    return compactKeys.has(nameText) ? decoded(this, storageKey, raw) : raw;
  };
  proto.setItem = function (name, value) {
    const nameText = String(name), text = String(value), storageKey = prefix + nameText;
    const packed = compactKeys.has(nameText) ? compact(text) : text;
    // Native setItem is atomic. A quota exception leaves the previous bytes intact.
    set.call(this, storageKey, packed);
    cache.get(this)?.delete(storageKey);
  };
  proto.removeItem = function (name) { const storageKey = prefix + String(name); remove.call(this, storageKey); cache.get(this)?.delete(storageKey); };
  proto.clear = function () {
    const keys = [];
    for (let i = 0; i < length.call(this); i++) { const name = key.call(this, i); if (name.startsWith(prefix)) keys.push(name); }
    keys.forEach(name => remove.call(this, name)); cache.delete(this);
  };
  proto.key = function (index) {
    const keys = [];
    for (let i = 0; i < length.call(this); i++) { const name = key.call(this, i); if (name.startsWith(prefix) && !keys.includes(name.slice(prefix.length))) keys.push(name.slice(prefix.length)); }
    return keys[index] ?? null;
  };
  // Compact existing journals one at a time, before fixtures add today's rows.
  // Neither malformed input nor an unsuccessful write changes existing data.
  for (const storageName of ['localStorage', 'sessionStorage']) {
    try {
      const storage = window[storageName];
      for (const name of compactKeys) {
        try {
          const storageKey = prefix + name, original = get.call(storage, storageKey);
          if (typeof original !== 'string' || original.startsWith(packedPrefix)) continue;
          const packed = compact(original);
          if (packed !== original) set.call(storage, storageKey, packed);
        } catch (_) { /* Keep this journal; other independent migrations can continue. */ }
      }
    } catch (_) { /* Storage access restrictions do not alter existing records. */ }
  }
  window.addEventListener('storage', event => {
    if (event.key && !event.key.startsWith(prefix)) { event.stopImmediatePropagation(); return; }
    if (event.key) {
      const name = event.key.slice(prefix.length);
      Object.defineProperty(event, 'key', { value: name });
      if (compactKeys.has(name)) {
        Object.defineProperty(event, 'oldValue', { value: unpack(event.oldValue) });
        Object.defineProperty(event, 'newValue', { value: unpack(event.newValue) });
      }
    }
  }, true);
  if (navigator.locks) {
    const request = navigator.locks.request.bind(navigator.locks);
    navigator.locks.request = (name, ...args) => request(prefix + name, ...args);
  }
  window.AliCtiStorageNamespace = prefix;
})();
