/** Shared helpers for the daily, entirely fictional module demonstration pack. */
(function (root) {
  'use strict';
  // Old caches can contain both bundled examples and later user work. Remove
  // only independently identified obsolete examples; unknown/mixed records stay
  // with their owning module, which can reject an incompatible scope safely.
  const version = 'alicti-showcase-v1';
  const schemaKey = 'demo-enterprise-scope-schema-v2';
  const cacheKeys = [
    'account-seat-v1', 'alicti-accounts-v1', 'alicti-queue-bindings-v1',
    'alicti-extension-directory-v1', 'alicti-seat-phone-config-v1', 'alicti-seat-operation-profiles-v1',
    'alicti-time-conditions-v1', 'alicti-inbound-router-v1', 'alicti-number-import-v1',
    'alicti-seat-import-journal-v1', 'alicti-seat-import-pool-v1', 'outbound-groups-v1',
    'cloud-number-resource-state-v1', 'cloud-task-created-v1', 'cloud-task-wizard-drafts-v1',
    'cloud-task-wizard-active-v1', 'cloud-task-center-context-v1', 'cloud-call-record-task-context-v1',
    'cloud-task-creation-transaction-v1', 'cloud-task-repeat-transaction-v1',
    'customer-task-batches-v1', 'customer-directory-v1', root.CustomerFollowup?.storageKey || 'customer-followup-v111-current',
    root.CustomerBusiness?.storageKey || 'customer-business-config-v111-current', root.BusinessData?.storageKey || 'business-data-dictionary-v111-current', 'customer-closed-loop-demo-v1', 'unified-call-ai-minute-ledger-v1',
    'native-workbench-records-v1', 'native-workbench-session-v1', 'local-task-result-journal-v1',
    'linked-scenario-demo-v1', 'workbench-view-fixtures-v1', 'workbench-view-fixtures-v2',
    'alicti-contract-demo-ids-v1', 'alicti-demo-preferences-v1', 'alicti-demo-pushes-v1',
    'demo-small-sample-migration-v1'
  ];
  const migrationWarnings = [];
  function obsoleteFixture(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.simulation !== true || value.demoPack !== version ||
        value.tenantId !== 'TEN-NISSAN-SH' || String(value.enterpriseId) !== '7522240') return false;
    // A parent example may contain later user work, even in the same scope.
    // Keep every nonempty container rather than deleting that work with its seed.
    if (Object.values(value).some(child => child && typeof child === 'object' && (Array.isArray(child) ? child.length > 0 : Object.keys(child).length > 0))) return false;
    // A prefix is not sufficient proof that a customer's record is disposable.
    const ids = [value.id, value.callId, value.taskId, value.agentRecordId, value.physicalGroupId, value.numberId].filter(item => typeof item === 'string');
    if (!ids.some(id => /^SHOWCASE-SH-20260921-(?:(?:PRED|AUTO)-(?:READY|RUNNING|PAUSED|ENDED|SAME-TASK-FOLLOWUP)(?:-BATCH|-C0[1-6](?:-CALL-[12])?)?|(?:MANUAL|POOL)-(?:LEAD|AFTERSALES|ACTIVITY)(?:-C0[1-4](?:-CALL-[12])?)?|INBOUND(?:-BATCH|-C0[1-4](?:-CALL-[12]-IN)?)?)$/.test(id))) return false;
    function singleScope(row) {
      if (!row || typeof row !== 'object') return true;
      if (row.tenantId !== undefined && row.tenantId !== 'TEN-NISSAN-SH' || row.defaultTenantId !== undefined && row.defaultTenantId !== 'TEN-NISSAN-SH' ||
          row.enterpriseId !== undefined && String(row.enterpriseId) !== '7522240') return false;
      for (const key of ['tenantIds', 'authorizedTenantIds', 'localTenantIds']) if (row[key] !== undefined && (!Array.isArray(row[key]) || row[key].some(id => id !== 'TEN-NISSAN-SH'))) return false;
      return Object.values(row).every(child => !child || typeof child !== 'object' || singleScope(child));
    }
    return singleScope(value);
  }
  function withoutObsoleteFixtures(value) {
    if (Array.isArray(value)) return value.filter(row => !obsoleteFixture(row)).map(withoutObsoleteFixtures);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, withoutObsoleteFixtures(child)]));
  }
  for (const storage of [localStorage, sessionStorage]) {
    try {
      if (storage.getItem(schemaKey) === '2') continue;
      let reliable = true;
      for (const key of cacheKeys) {
        const original = storage.getItem(key);
        if (original === null) continue;
        let value;
        try { value = JSON.parse(original); }
        catch (_) { reliable = false; migrationWarnings.push({ key, reason: '旧资料格式无法识别，原数据保留。' }); continue; }
        const next = withoutObsoleteFixtures(value);
        if (JSON.stringify(next) === JSON.stringify(value)) continue;
        // A changed tab or failed write must not be reported as a completed migration.
        if (storage.getItem(key) !== original) { reliable = false; continue; }
        try { storage.setItem(key, JSON.stringify(next)); }
        catch (_) { reliable = false; migrationWarnings.push({ key, reason: '旧演示资料整理未能保存，原数据保留。' }); }
      }
      if (reliable) storage.setItem(schemaKey, '2');
    } catch (_) { migrationWarnings.push({ key: schemaKey, reason: '旧演示资料整理未完成，稍后重试。' }); }
  }
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
    scopes: [], batches: [], tasksForStorage: [], localTaskCallsForStorage: [], afterLoad: [], warnings: migrationWarnings,
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
