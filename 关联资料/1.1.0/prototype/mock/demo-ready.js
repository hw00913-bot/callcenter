/** Reconcile the new fixtures after existing customer/seat/task stores restore. */
(function () {
  'use strict';
  // The committed journal and customer history are the evidence, not a stale
  // directory cache. Only the precisely matched SHOWCASE calls are restored.
  DemoFixtureKit.restoreCommittedCalls();
  window.DemoCompact?.reconcile();
  CloudResourceRules.recount();
  DemoFixtureKit.ready = true;
})();
