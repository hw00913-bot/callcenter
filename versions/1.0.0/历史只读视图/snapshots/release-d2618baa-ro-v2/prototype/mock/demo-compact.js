/** A small, linked set of automatic samples. User-created records have no quota. */
(function (root) {
  'use strict';
  const kit = root.DemoFixtureKit, data = root.CloudCallData;
  const limit = 15, marker = kit.version, baseline = new Map();
  const migrationKey = 'demo-small-sample-migration-v1';
  const migration = read(localStorage, migrationKey, null);
  const retiredCallIds = new Set(Array.isArray(migration?.retiredCallIds) ? migration.retiredCallIds : []);
  let migrationDone = migration?.version === 1, storageWritable = true;
  const keys = { calls: 'callId', tasks: 'taskId', predictiveTasks: 'taskId', ivrTasks: 'taskId', agents: 'agentRecordId', agentSkills: 'relationId', physicalSkillGroups: 'physicalGroupId', phoneNumbers: 'numberId', callDataIssues: 'issueId' };
  for (const [name, key] of Object.entries(keys)) baseline.set(name, new Set((data[name] || []).map(row => row[key])));
  const generated = (row, name, key) => !!row && (name === 'calls' && retiredCallIds.has(row[key]) || row.demoPack === marker && String(row[key] || '').startsWith('SHOWCASE-') || row.simulation === true && String(row[key] || '').startsWith('VIEW-DEMO-') || baseline.get(name)?.has(row[key]));
  const replace = (rows, next) => rows.splice(0, rows.length, ...next);
  const callIds = new Set(['CALL-MAN-1001']), rowIds = new Set(), taskIds = new Set(), batchIds = new Set();
  const id = (scope, suffix) => 'SHOWCASE-' + scope + '-' + kit.cohort + '-' + suffix;
  const choose = (scope, suffix, attempts = [1], incoming = false) => {
    const rowId = id(scope, suffix); rowIds.add(rowId);
    attempts.forEach(attempt => callIds.add(rowId + '-CALL-' + attempt + (incoming ? '-IN' : '')));
  };
  for (const scope of ['HQ', 'SH']) {
    choose(scope, 'PRED-SAME-TASK-FOLLOWUP-C01');
    choose(scope, 'PRED-SAME-TASK-FOLLOWUP-C03');
  }
  choose('HQ', 'MANUAL-LEAD-C01');
  choose('HQ', 'PRED-RUNNING-C01', [1, 2]);
  choose('SH', 'MANUAL-LEAD-C01');
  choose('SH', 'PRED-PAUSED-C05');
  choose('HQ', 'AUTO-ENDED-C06');
  choose('SH', 'AUTO-RUNNING-C02');
  choose('HQ', 'INBOUND-C01', [1], true);
  choose('SH', 'INBOUND-C01', [1], true);
  rowIds.add(id('HQ', 'PRED-RUNNING-C06'));
  rowIds.add(id('SH', 'AUTO-READY-C01'));
  taskIds.add(id('SH', 'AUTO-READY'));
  for (const call of data.calls) if (callIds.has(call.callId) && call.taskId) taskIds.add(call.taskId);
  for (const batch of kit.batches) if ((batch.rows || []).some(row => rowIds.has(row.id))) batchIds.add(batch.id);

  function read(storage, key, fallback) {
    try { const raw = storage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch (_) { return null; }
  }
  function write(storage, key, value) {
    try { const text = JSON.stringify(value); if (storage.getItem(key) !== text) storage.setItem(key, text); }
    catch (_) { storageWritable = false; kit.warnings.push({ key, reason: '演示样例精简未能保存，保留当前可读取的数据。' }); }
  }
  function retireHistoricalSimulation() {
    if (migrationDone) return;
    const retire = (call, parentIsDemo = false) => {
      if (call?.callId && !callIds.has(call.callId) && (call.simulation === true || parentIsDemo || call.directoryMeta?.historicalSimulation === true)) retiredCallIds.add(call.callId);
    };
    for (const key of ['local-task-result-journal-v1', 'customer-directory-v1', 'native-workbench-records-v1', 'linked-scenario-demo-v1']) {
      const value = read(localStorage, key, null), calls = Array.isArray(value) ? value : value?.calls;
      for (const call of Array.isArray(calls) ? calls : []) retire(call);
      for (const call of Array.isArray(value?.unmerged) ? value.unmerged : []) retire(call);
    }
    const batches = read(localStorage, 'customer-task-batches-v1', []);
    for (const batch of Array.isArray(batches) ? batches : []) for (const row of batch.rows || []) for (const call of row.calls || []) retire(call, batch.simulation === true);
  }
  function fixtureRow(row) {
    return row?.demoPack === marker && String(row.id || '').startsWith('SHOWCASE-') || /^VIEW-DEMO-/.test(row?.id || '');
  }
  function fixtureBatch(batch) {
    return batch?.demoPack === marker && String(batch.id || '').startsWith('SHOWCASE-') || batch?.simulation === true && /^VIEW-DEMO-/.test(batch.id || '');
  }
  function retainDependencies() {
    // A customer's own imported rows or later calls may still reference a seed.
    // Keep those dependencies rather than deleting a user's work to meet a demo quota.
    const batches = read(localStorage, 'customer-task-batches-v1', []);
    for (const batch of Array.isArray(batches) ? batches : []) for (const row of batch.rows || []) {
      if (fixtureBatch(batch) && fixtureRow(row)) continue;
      if (row.taskId) taskIds.add(row.taskId);
      for (const call of row.calls || []) if (call.callId && !retiredCallIds.has(call.callId)) callIds.add(call.callId);
    }
    const stores = [
      [localStorage, 'native-workbench-records-v1'],
      [localStorage, 'local-task-result-journal-v1'],
      [localStorage, 'customer-directory-v1'],
      [localStorage, 'linked-scenario-demo-v1']
    ];
    for (const [storage, key] of stores) {
      const value = read(storage, key, []), calls = Array.isArray(value) ? value : value?.calls || [];
      for (const call of calls) if (!generated(call, 'calls', 'callId')) {
        if (call.taskId) taskIds.add(call.taskId);
        if (call.customerTaskItemId) rowIds.add(call.customerTaskItemId);
      }
    }
  }
  function compactBatch(batch) {
    const sample = fixtureBatch(batch);
    const rows = (batch.rows || []).filter(row => !sample || !fixtureRow(row) || rowIds.has(row.id));
    if (sample && !rows.length && !batchIds.has(batch.id)) return null;
    for (const row of rows) {
      row.calls = (row.calls || []).filter(call => !generated(call, 'calls', 'callId') || callIds.has(call.callId));
      row.history = (row.history || []).filter(entry => !entry.callId || !generated({ callId: entry.callId, simulation: true, demoPack: marker }, 'calls', 'callId') || callIds.has(entry.callId));
    }
    return { ...batch, rows };
  }
  function compactStored() {
    retireHistoricalSimulation();
    retainDependencies();
    const batches = read(localStorage, 'customer-task-batches-v1', null);
    if (Array.isArray(batches) && batches.every(row => row && typeof row.id === 'string') && new Set(batches.map(row => row.id)).size === batches.length) {
      for (const seed of kit.batches) {
        const batch = batches.find(row => row.id === seed.id && row.tenantId === seed.tenantId && row.enterpriseId === seed.enterpriseId);
        if (!batch || !Array.isArray(batch.rows)) continue;
        for (const row of seed.rows.filter(item => rowIds.has(item.id))) if (!batch.rows.some(item => item.id === row.id)) batch.rows.push(structuredClone(row));
      }
      write(localStorage, 'customer-task-batches-v1', batches.map(compactBatch).filter(Boolean));
    }
    const tasks = read(sessionStorage, 'cloud-task-created-v1', null);
    if (Array.isArray(tasks)) write(sessionStorage, 'cloud-task-created-v1', tasks.filter(row => !generated(row, 'tasks', 'taskId') || taskIds.has(row.taskId)));
    for (const key of ['local-task-result-journal-v1', 'customer-directory-v1', 'native-workbench-records-v1', 'linked-scenario-demo-v1']) {
      const value = read(localStorage, key, null), calls = Array.isArray(value) ? value : value?.calls;
      if (!Array.isArray(calls)) continue;
      const kept = calls.filter(row => !generated(row, 'calls', 'callId') || callIds.has(row.callId));
      if (Array.isArray(value)) write(localStorage, key, kept);
      else write(localStorage, key, { ...value, calls: kept, ...(Array.isArray(value.unmerged) ? { unmerged: value.unmerged.filter(row => !generated(row, 'calls', 'callId') || callIds.has(row.callId)) } : {}) });
    }
    for (const key of ['workbench-view-fixtures-v1', 'workbench-view-fixtures-v2']) {
      const value = read(localStorage, key, null);
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const next = { ...value };
      for (const [name, field] of Object.entries(keys)) if (Array.isArray(next[name])) next[name] = next[name].filter(row => !/^VIEW-DEMO-/.test(row[field] || ''));
      if (Array.isArray(next.batches)) next.batches = next.batches.map(compactBatch).filter(Boolean);
      write(localStorage, key, next);
    }
    if (!migrationDone && storageWritable) {
      write(localStorage, migrationKey, { version: 1, retiredCallIds: [...retiredCallIds] });
      migrationDone = storageWritable;
    }
  }
  function reconcileTasks() {
    const batches = read(localStorage, 'customer-task-batches-v1', []) || [], allBatches = [...kit.batches, ...(Array.isArray(batches) ? batches : [])];
    const calls = new Map(data.calls.map(call => [call.callId, call]));
    const fullCalls = row => (row.calls || []).map(call => calls.get(call.callId) || call);
    const customersByTask = new Map();
    function restoreIncompleteSample(task, customers) {
      // Earlier compact samples omitted C06, making this one running task look
      // exhausted. Only repair that display-only completion, never a supplier stop.
      if (task.taskId !== id('HQ', 'PRED-RUNNING') || task.demoPack !== marker || task.simulation !== true ||
          task.tenantId !== 'TEN-NISSAN-HQ' || task.enterpriseId !== '7522240' || task.callType !== '预外呼' ||
          task.status !== '已完成' || Number(task.providerStatusCode) !== 1 || Number(task.alictiMockTaskProperty?.status) !== 1 ||
          task.resourcePause || task.alictiTaskControlPending || !(task.total > task.completed)) return;
      const remaining = [...(customers?.values() || [])].filter(row => !fullCalls(row).some(call => call.endedAt || call.at));
      if (remaining.length !== 1 || remaining[0].id !== id('HQ', 'PRED-RUNNING-C06') || remaining[0].followup !== '待联系' ||
          remaining[0].activeCallId || (remaining[0].calls || []).length ||
          data.calls.some(call => call.taskId === task.taskId && call.customerTaskItemId === remaining[0].id)) return;
      task.status = '执行中'; task.stopNewDialing = false;
    }
    for (const task of data.tasks.filter(row => row.demoPack === marker && taskIds.has(row.taskId))) {
      const customers = new Map();
      for (const batch of allBatches) if (batch.tenantId === task.tenantId && batch.enterpriseId === task.enterpriseId) for (const row of batch.rows || []) if (row.taskId === task.taskId) customers.set(row.id, row);
      task.total = customers.size;
      task.completed = [...customers.values()].filter(row => fullCalls(row).some(call => call.endedAt || call.at)).length;
      task.connected = [...customers.values()].filter(row => fullCalls(row).some(call => (call.endedAt || call.at) && root.CallState?.view(call).answered === true)).length;
      customersByTask.set(task.taskId, customers);
      restoreIncompleteSample(task, customers);
    }
    const saved = read(sessionStorage, 'cloud-task-created-v1', null);
    if (Array.isArray(saved)) {
      for (const task of saved) {
        const current = data.tasks.find(row => row.taskId === task.taskId);
        if (task.demoPack === marker && current) Object.assign(task, { total: current.total, completed: current.completed, connected: current.connected });
        restoreIncompleteSample(task, customersByTask.get(task.taskId));
      }
      write(sessionStorage, 'cloud-task-created-v1', saved);
    }
  }
  function compactRuntime() {
    compactStored();
    replace(kit.batches, kit.batches.map(compactBatch).filter(Boolean));
    for (const name of ['tasks', 'predictiveTasks', 'ivrTasks']) replace(data[name], data[name].filter(row => !generated(row, name, 'taskId') || taskIds.has(row.taskId)));
    replace(data.calls, data.calls.filter(row => !generated(row, 'calls', 'callId') || callIds.has(row.callId)));
    // The former display-only pack duplicates the runnable resources and scenarios.
    // The base seats plus the two runnable tenant teams already cover all seat states.
    const seatRefs = new Set(data.calls.flatMap(row => [row.agentIdentityId, row.contactCenterIdentityId]).filter(Boolean));
    const numberRefs = new Set([...data.calls, ...data.tasks].map(row => row.callerNumberId).filter(Boolean));
    const groupRefs = new Set([...data.calls, ...data.tasks].flatMap(row => [row.skillGroupId, row.targetSkillGroupId, row.executionQueueId]).filter(Boolean));
    for (const name of ['agents', 'agentSkills', 'physicalSkillGroups', 'phoneNumbers', 'callDataIssues']) {
      const key = keys[name];
      replace(data[name], data[name].filter(row => !/^VIEW-DEMO-/.test(row[key] || '') ||
        name === 'agents' && seatRefs.has(row.contactCenterIdentityId) ||
        name === 'agentSkills' && seatRefs.has(row.identityId) ||
        name === 'physicalSkillGroups' && (groupRefs.has(row.skillGroupId) || data.agentSkills.some(relation => seatRefs.has(relation.identityId) && relation.physicalGroupId === row.physicalGroupId)) ||
        name === 'phoneNumbers' && numberRefs.has(row.numberId)));
    }
    const existingCalls = new Set(data.calls.map(row => row.callId));
    replace(data.callDataIssues, data.callDataIssues.filter(row => !baseline.get('callDataIssues').has(row.issueId) || !row.callId || existingCalls.has(row.callId)));
    replace(kit.tasksForStorage, kit.tasksForStorage.filter(row => taskIds.has(row.taskId)));
    replace(kit.localTaskCallsForStorage, kit.localTaskCallsForStorage.filter(row => callIds.has(row.callId)));
    reconcileTasks();
    root.AliCtiReportSummaryFixtures?.rebuild?.();
    kit.compactSummary = { limit, calls: data.calls.length, tasks: data.tasks.length, batches: kit.batches.length, batchCustomers: kit.batches.reduce((sum, batch) => sum + batch.rows.length, 0), agents: data.agents.length };
  }
  root.DemoCompact = { prepare: compactRuntime, reconcile: compactRuntime, limit, selectedCallIds: callIds, selectedRowIds: rowIds };
})(window);
