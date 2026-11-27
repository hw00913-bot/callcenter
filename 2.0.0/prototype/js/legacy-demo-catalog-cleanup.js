/* Retire bundled cloud business samples while preserving later user work. */
(() => {
  'use strict';

  const cloud = window.DNativeModules?.cloud;
  if (!cloud?.html) return;
  let html = cloud.html;

  function locate(fragment) {
    const offset = html.indexOf(fragment);
    if (offset<0 || html.indexOf(fragment,offset+fragment.length)>=0) {
      throw Error('无法定位旧版云呼叫演示数据。');
    }
    return offset;
  }

  function replace(before,after) {
    const offset = locate(before);
    html = html.slice(0,offset)+after+html.slice(offset+before.length);
  }

  // DemoCompact already matches samples against the exact IDs, scope and
  // provenance of the embedded directory, before either restore or reseeding.
  const first = locate("  const callIds = new Set(['CALL-MAN-1001']), rowIds = new Set(), taskIds = new Set(), batchIds = new Set();");
  const last = locate('  function storageWarning(key) {');
  if (last<=first) throw Error('旧版云呼叫演示数据范围不完整。');
  html = html.slice(0,first)+`  const callIds = new Set(['CALL-MAN-1001']), rowIds = new Set(), taskIds = new Set(), batchIds = new Set();
  const id = (scope, suffix) => 'SHOWCASE-' + scope + '-' + kit.cohort + '-' + suffix;
  const legacyTasksKey = 'cloud-task-created-v1';
  const taskRecordPrefix = 'cloud-task-record-v1:';
  const obsoleteTask = row => generated(row,'tasks','taskId') && /^SHOWCASE-(HQ|SH)-20260921-/.test(row.taskId);

`+html.slice(last);

  replace("  function retainDependencies() {",`  function retainCall(call) {
    if (call?.callId) callIds.add(call.callId);
    if (call?.taskId) taskIds.add(call.taskId);
    if (call?.customerTaskItemId) rowIds.add(call.customerTaskItemId);
  }
  function oldTaskRecords() {
    if (typeof localStorage.key !== 'function') return [];
    const records = [];
    for (let i=0;i<localStorage.length;i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(taskRecordPrefix+'SHOWCASE-')) continue;
      const row = read(localStorage,key,null);
      if (obsoleteTask(row) && key.startsWith(taskRecordPrefix+encodeURIComponent(row.taskId)+':')) {
        records.push({key,row});
      }
    }
    return records;
  }
  function retainTaskEdits(records) {
    for (const {row} of records) if (Number(row._localTaskRevision)>0) taskIds.add(row.taskId);
    for (const storage of [localStorage,sessionStorage]) {
      const rows = read(storage,legacyTasksKey,null);
      if (rows===null) continue;
      if (!validRows(rows,'taskId')) storageWarning(legacyTasksKey);
      else for (const row of rows) if (obsoleteTask(row) && Number(row._localTaskRevision)>0) taskIds.add(row.taskId);
    }
    for (const key of ['cloud-task-creation-transaction-v1','cloud-task-repeat-transaction-v1','cloud-task-import-transaction-v1']) {
      const journal = read(localStorage,key,null);
      if (!journal || journal.committed===true) continue;
      for (const task of [journal.taskBefore,journal.taskAfter,journal.before,journal.after]) {
        if (obsoleteTask(task)) taskIds.add(task.taskId);
      }
    }
  }
  function retainDependencies() {
    const session = read(sessionStorage,'native-workbench-session-v1',null);
    if (session?.call && ['offered','answering','dialing','ringing','connected','wrap'].includes(session.phase)) retainCall(session.call);
`);

  replace(`      if (fixtureBatch(batch) && fixtureRow(row, batch)) continue;
      if (row.taskId) taskIds.add(row.taskId);
      for (const call of row.calls || []) if (call.callId) callIds.add(call.callId);`,
    `      const calls = row.calls || [];
      const liveAttachment = row.activeCallId && (!baseline.get('calls').has(row.activeCallId) || callIds.has(row.activeCallId));
      const edited = !fixtureBatch(batch) || !fixtureRow(row,batch) || liveAttachment ||
        calls.some(call=>!generated(call,'calls','callId'));
      if (!edited && !taskIds.has(row.taskId) && !rowIds.has(row.id)) continue;
      rowIds.add(row.id);
      if (row.taskId) taskIds.add(row.taskId);
      if (row.activeCallId) callIds.add(row.activeCallId);
      for (const call of calls) retainCall(call);`);

  replace(`      for (const call of calls || []) if (!generated(call, 'calls', 'callId')) {
        if (call.taskId) taskIds.add(call.taskId);
        if (call.customerTaskItemId) rowIds.add(call.customerTaskItemId);
      }
    }
  }
  function compactBatch`,`      for (const call of calls ? [...calls,...(value.unmerged || [])] : []) {
        if (!generated(call,'calls','callId')) retainCall(call);
      }
    }
  }
  function compactBatch`);

  replace(`    retainDependencies();
    const batches = read(localStorage, 'customer-task-batches-v1', null);`,`    const records = oldTaskRecords();
    retainTaskEdits(records);
    retainDependencies();
    const batches = read(localStorage, 'customer-task-batches-v1', null);`);

  replace(`    const tasks = read(sessionStorage, 'cloud-task-created-v1', null);
    if (validRows(tasks, 'taskId')) write(sessionStorage, 'cloud-task-created-v1', tasks.filter(row => !generated(row, 'tasks', 'taskId') || taskIds.has(row.taskId)));
    else if (tasks !== null) storageWarning('cloud-task-created-v1');`,`    for (const storage of [localStorage,sessionStorage]) {
      const tasks = read(storage,legacyTasksKey,null);
      if (validRows(tasks,'taskId')) {
        write(storage,legacyTasksKey,tasks.filter(row=>!obsoleteTask(row) || taskIds.has(row.taskId)));
      } else if (tasks!==null) storageWarning(legacyTasksKey);
    }
    for (const {key,row} of records) {
      if (taskIds.has(row.taskId)) continue;
      try {
        if (localStorage.getItem(key)!==readSnapshots.get(localStorage)?.get(key)) {
          storageWarning(key);
          continue;
        }
        localStorage.removeItem(key);
        if (localStorage.getItem(key)!==null) storageWarning(key);
      } catch (_) { storageWarning(key); }
    }`);

  replace(`      else write(localStorage, key, { ...value, calls: kept, ...(Array.isArray(value.unmerged) ? { unmerged: value.unmerged.filter(row => !generated(row, 'calls', 'callId') || callIds.has(row.callId)) } : {}) });`,`      else {
        const next = {...value,calls:kept};
        if (Array.isArray(value.unmerged)) next.unmerged = value.unmerged.filter(row=>!generated(row,'calls','callId') || callIds.has(row.callId));
        if (key==='linked-scenario-demo-v1' && validRows(value.tasks,'taskId')) {
          next.tasks = value.tasks.filter(row=>!obsoleteTask(row) || taskIds.has(row.taskId));
        }
        write(localStorage,key,next);
      }`);

  cloud.html = html;
})();
