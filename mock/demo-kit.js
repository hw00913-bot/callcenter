/** Shared helpers for the daily, entirely fictional module demonstration pack. */
(function (root) {
  'use strict';
  // The enterprise/tenant split invalidates only this prototype's old module caches.
  // A one-time reset runs before any module restores data; unrelated and identity
  // preferences stay outside this exact allowlist. New-schema edits survive reload.
  const schemaKey = 'demo-enterprise-scope-schema-v2';
  const cacheKeys = [
    'account-seat-v1', 'alicti-accounts-v1', 'alicti-queue-bindings-v1',
    'alicti-extension-directory-v1', 'alicti-seat-phone-config-v1', 'alicti-seat-operation-profiles-v1',
    'alicti-time-conditions-v1', 'alicti-inbound-router-v1', 'alicti-number-import-v1',
    'alicti-seat-import-journal-v1', 'alicti-seat-import-pool-v1', 'outbound-groups-v1',
    'cloud-number-resource-state-v1', 'cloud-task-created-v1', 'cloud-task-wizard-drafts-v1',
    'cloud-task-wizard-active-v1', 'cloud-task-center-context-v1', 'cloud-call-record-task-context-v1',
    'cloud-task-creation-transaction-v1', 'cloud-task-repeat-transaction-v1',
    'customer-task-batches-v1', 'customer-directory-v1', 'customer-followup-v1',
    'customer-business-config-v3', 'customer-closed-loop-demo-v1', 'unified-call-ai-minute-ledger-v1',
    'native-workbench-records-v1', 'native-workbench-session-v1', 'local-task-result-journal-v1',
    'linked-scenario-demo-v1', 'workbench-view-fixtures-v1', 'workbench-view-fixtures-v2',
    'alicti-contract-demo-ids-v1', 'alicti-demo-preferences-v1', 'alicti-demo-pushes-v1',
    'demo-small-sample-migration-v1'
  ];
  function oldScope(value, inheritedEnterprise = '') {
    if (!value || typeof value !== 'object') return false;
    const enterprise = String(value.enterpriseId ?? inheritedEnterprise);
    const tenantIds = [value.tenantId, value.defaultTenantId, ...[value.tenantIds, value.authorizedTenantIds, value.localTenantIds].filter(Array.isArray).flat()];
    if (enterprise === '7522240' && tenantIds.includes('TEN-NISSAN-SH')) return true;
    return Object.entries(value).some(([key, child]) => child && typeof child === 'object' && (key === 'TEN-NISSAN-SH' && String(child.enterpriseId) === '7522240' || oldScope(child, enterprise)));
  }
  for (const storage of [localStorage, sessionStorage]) {
    try {
      if (storage.getItem(schemaKey) === '2') continue;
      const incompatible = cacheKeys.some(key => {
        try { return oldScope(JSON.parse(storage.getItem(key) || 'null')); } catch (_) { return false; }
      });
      if (incompatible) for (const key of cacheKeys) storage.removeItem(key);
      storage.setItem(schemaKey, '2');
    } catch (_) { /* Storage failures are surfaced by the module that owns the cache. */ }
  }
  const version = 'alicti-showcase-v1';
  const today = new Date().toLocaleDateString('sv-SE');
  const anchorKey = 'alicti-showcase-clock-v1';
  let anchor = Date.now();
  try {
    const saved = JSON.parse(localStorage.getItem(anchorKey) || 'null');
    if (saved?.day === today && Number.isFinite(saved.anchor) && saved.anchor <= anchor) anchor = saved.anchor;
    else localStorage.setItem(anchorKey, JSON.stringify({ day: today, anchor }));
  } catch (_) { /* A blocked store never prevents the in-memory fixture from rendering. */ }
  const kit = {
    // Keep sample identities stable across days; only their displayed time follows today.
    version, prefix: 'SHOWCASE-', cohort: '20260921', date: today, anchor,
    scopes: [], batches: [], tasksForStorage: [], localTaskCallsForStorage: [], afterLoad: [], warnings: [],
    at(minutes = 0) { return new Date(anchor - minutes * 60000).toLocaleString('sv-SE'); },
    day(days = 0) { const value = new Date(anchor); value.setDate(value.getDate() - days); return value.toLocaleDateString('sv-SE'); },
    add(list, key, row) {
      const existing = list.find(item => item[key] === row[key]);
      if (existing) return existing;
      Object.assign(row, { simulation: true, demoPack: version });
      if (list === root.CloudCallData?.agents) list.push(row);
      else list.unshift(row);
      return row;
    },
    mergeStore(storage, key, seeds, id, empty) {
      if (!seeds.length) return;
      try {
        const text = storage.getItem(key);
        const value = text === null ? empty : JSON.parse(text);
        const rows = Array.isArray(value) ? value : value?.version === 1 && Array.isArray(value.calls) ? value.calls : null;
        if (!rows || rows.some(row => !row || typeof row[id] !== 'string') || new Set(rows.map(row => row[id])).size !== rows.length) throw Error('existing data format');
        let changed = false;
        for (const seed of seeds) {
          if (seed.demoPack !== version || !String(seed[id]).startsWith(kit.prefix)) continue;
          if (rows.some(row => row[id] === seed[id])) continue;
          rows.unshift(structuredClone(seed)); changed = true;
        }
        if (changed) storage.setItem(key, JSON.stringify(value));
      } catch (_) { kit.warnings.push({ key, reason: '原有存储不可读或不可写，保持原数据，不覆盖。' }); }
    }
  };
  root.DemoFixtureKit = kit;
})(window);
