/** Install only missing fixture rows before the application restores user changes. */
(function (root) {
  'use strict';
  const kit = root.DemoFixtureKit;
  kit.afterLoad.forEach(callback => callback());
  root.DemoCompact?.prepare();
  kit.mergeStore(localStorage, 'customer-task-batches-v1', kit.batches, 'id', []);
  kit.mergeStore(sessionStorage, 'cloud-task-created-v1', kit.tasksForStorage, 'taskId', []);
  kit.mergeStore(localStorage, 'local-task-result-journal-v1', kit.localTaskCallsForStorage, 'callId', { version: 1, calls: [] });
  // A committed correction must win over the bundled sample on a later page load.
  // Match both the result journal and its customer history before applying it.
  kit.restoreCommittedCalls = function () {
  try {
    const journal = JSON.parse(localStorage.getItem('local-task-result-journal-v1') || 'null');
    const batches = JSON.parse(localStorage.getItem('customer-task-batches-v1') || 'null');
    if (journal?.version === 1 && Array.isArray(journal.calls) && Array.isArray(batches)) {
      for (const original of kit.localTaskCallsForStorage) {
        const matches = journal.calls.filter(call => call.callId === original.callId);
        if (matches.length !== 1) continue;
        const saved = matches[0];
        if (saved.simulation !== true || saved.demoPack !== kit.version || saved.callSource !== 'LOCAL_TASK_SIMULATION' ||
            ['tenantId', 'enterpriseId', 'taskId', 'customerTaskItemId', 'caller', 'callee'].some(key => saved[key] !== original[key])) continue;
        const histories = batches.filter(batch => batch.tenantId === saved.tenantId && batch.enterpriseId === saved.enterpriseId)
          .flatMap(batch => Array.isArray(batch.rows) ? batch.rows : [])
          .filter(customer => customer.id === saved.customerTaskItemId && customer.taskId === saved.taskId && customer.phone === saved.callee);
        if (histories.length !== 1 || !(histories[0].calls || []).some(call => call.callId === saved.callId && call.result === saved.result && call.at === saved.endedAt)) continue;
        const target = CloudCallData.calls.find(call => call.callId === saved.callId);
        if (target) Object.assign(target, structuredClone(saved));
      }
    }
  } catch (_) { /* Invalid or uncommitted history never replaces a sample. */ }
  };
  kit.restoreCommittedCalls();
  // Current data is visible immediately, without clicking a separate preparation tool.
  // Existing storage wins on reload; no reset, deletion, role change or outbound request.
  CloudCallData.meta.showcase = { version: kit.version, date: kit.date, synthetic: true };
})(window);
