/** Local customer directory. Batch IDs and source journals remain untouched. */
(function () {
  'use strict';
  const key = 'customer-directory-v1', batchKey = 'customer-task-batches-v1';
  let syncing = false, storageIssue = '', conflicts = [], readFailures = new Set();
  const lastRuntime = new Map();
  const clone = value => JSON.parse(JSON.stringify(value));
  const array = value => Array.isArray(value) ? value : [];
  function read(name, fallback) {
    try { const raw = localStorage.getItem(name); return raw ? JSON.parse(raw) : fallback; }
    catch (_) { readFailures.add(name); storageIssue = '部分本地数据无法读取；原数据未改动。'; return fallback; }
  }
  function normalizePhone(value) {
    let phone = String(value ?? '').normalize('NFKC').trim().replace(/[\s()（）\-－]/g, '');
    if (/^\+86\d{7,13}$/.test(phone)) phone = phone.slice(3);
    else if (/^0086\d{7,13}$/.test(phone)) phone = phone.slice(4);
    return /^\d{7,15}$/.test(phone) ? phone : '';
  }
  function identity(phone, tenantId, enterpriseId) {
    const normalized = normalizePhone(phone);
    return normalized && tenantId && enterpriseId ? JSON.stringify([tenantId, enterpriseId, normalized]) : '';
  }
  function phoneOf(call) { return normalizePhone(call.customerPhone || (call.direction === '呼入' ? call.caller : call.callee)); }
  function at(call) { return call.endedAt || call.ringingAt || call.recordedAt || ''; }
  function latestTime(values) {
    let latest = '', latestTimestamp = -Infinity;
    for (const value of values) {
      const time = window.PlatformUI?.timestamp ? PlatformUI.timestamp(value) : Date.parse(value || '');
      if (time !== null && Number.isFinite(time) && time > latestTimestamp) { latest = value; latestTimestamp = time; }
    }
    return latest;
  }
  function hash(value) {
    let a = 2166136261, b = 5381;
    for (const ch of value) { a = Math.imul(a ^ ch.charCodeAt(0), 16777619); b = Math.imul(b, 33) ^ ch.charCodeAt(0); }
    return (a >>> 0).toString(36) + (b >>> 0).toString(36);
  }
  function fingerprint(call) { return hash(JSON.stringify(Object.fromEntries(Object.entries(call).filter(([name]) => name !== 'directoryMeta').sort(([a], [b]) => a.localeCompare(b))))); }
  function hasDuration(call) { return call.durationSeconds !== null && call.durationSeconds !== '' && call.durationSeconds !== undefined && Number.isFinite(Number(call.durationSeconds)) && Number(call.durationSeconds) >= 0; }
  function duration(call) {
    if (!hasDuration(call)) return '未记录';
    const value = Math.floor(Number(call.durationSeconds));
    return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
  }
  function result(call) {
    const view = CallState.view(call);
    return view.answerResult === 'UNKNOWN' ? '结果未知' : view.answerLabel;
  }
  function dispositionLabel(call) {
    const value = call?.agentDisposition || '';
    // Render old generated labels without changing saved results or user notes.
    const generated = call?.simulation || call?.directoryMeta?.historicalSimulation;
    return generated && /^模拟[：:](结果待确认|未接通|完成沟通|客户按1确认知悉|客户确认知悉)$/.test(value) ? value.slice(3) : value;
  }
  function provenance(call) {
    if (call.directoryMeta?.legacyOnly) return call.directoryMeta?.historicalSimulation ? '历史模拟记录' : '历史联系记录';
    if (call.simulation) return '本地模拟通话';
    return '预置演示记录';
  }
  function legacyCall(batch, row, snapshot, index) {
    const callId = snapshot.callId || 'LEGACY-' + hash(JSON.stringify([batch.id, row.id, index]));
    return {
      ...CustomerBusiness.snapshot({ ...row, ...snapshot, tenantId:batch.tenantId, enterpriseId:batch.enterpriseId }), ...snapshot, callId, tenantId: batch.tenantId, enterpriseId: batch.enterpriseId,
      customerTaskItemId: row.id, customerName: row.name, customerPhone: normalizePhone(row.phone),
      caller: snapshot.caller || '—', callee: snapshot.callee || row.phone,
      direction: snapshot.direction || '呼出', callType: snapshot.callType || '历史通话',
      recordedAt: snapshot.at || '', endedAt: snapshot.endedAt || snapshot.at || '',
      durationSeconds: hasDuration(snapshot) ? Number(snapshot.durationSeconds) : null,
      agentDisposition: snapshot.agentDisposition || snapshot.disposition || '',
      dispositionRemark: snapshot.dispositionRemark || snapshot.remark || '',
      recordingStatus: snapshot.recordingStatus || '未记录', recordingApplicability: snapshot.recordingApplicability || '未记录',
      directoryMeta: { legacyOnly: true, historicalSimulation: !!batch.simulation || /^DEMO-|^WB-/.test(callId), rowIds: [row.id], sources: ['批次联系历史'] }
    };
  }
  function sync() {
    if (syncing) return CloudCallData.calls || [];
    syncing = true; storageIssue = ''; conflicts = []; readFailures = new Set();
    try {
      const saved = read(key, { version: 1, calls: [] }), map = new Map(), unmerged = array(saved?.unmerged);
      function merge(row, source, partial = false, journal = '') {
        if (!row || !row.callId || !row.tenantId || !row.enterpriseId) return;
        const previous = map.get(row.callId);
        if (previous && (previous.tenantId !== row.tenantId || previous.enterpriseId !== row.enterpriseId || (phoneOf(previous) && phoneOf(row) && phoneOf(previous) !== phoneOf(row)))) {
          conflicts.push(row.callId);
          if (!unmerged.some(item => item.callId === row.callId && item.tenantId === row.tenantId && item.enterpriseId === row.enterpriseId && phoneOf(item) === phoneOf(row))) unmerged.push(clone(row));
          return; // Preserve the source, but never combine an ambiguous ID across customer boundaries.
        }
        if (journal && previous?.directoryMeta?.fingerprints?.[journal] === fingerprint(row)) return;
        let next;
        if (!previous) next = clone(row);
        else if (partial) {
          next = { ...clone(row), ...previous };
          for (const field of ['customerTaskItemId', 'customerName', 'customerPhone', 'recordedAt']) if (!next[field] && row[field]) next[field] = row[field];
        } else next = { ...previous, ...clone(row) };
        const sources = new Set([...(previous?.directoryMeta?.sources || []), ...(row.directoryMeta?.sources || []), source].filter(Boolean));
        next.directoryMeta = {
          ...previous?.directoryMeta, ...row.directoryMeta,
          legacyOnly: partial ? (previous ? !!previous.directoryMeta?.legacyOnly : true) : !!row.directoryMeta?.legacyOnly,
          rowIds: Array.from(new Set([...(previous?.directoryMeta?.rowIds || []), ...(row.directoryMeta?.rowIds || []), ...(row.customerTaskItemId ? [row.customerTaskItemId] : [])])),
          fingerprints: { ...row.directoryMeta?.fingerprints, ...previous?.directoryMeta?.fingerprints, ...(journal ? { [journal]: fingerprint(row) } : {}) },
          sources: Array.from(sources)
        };
        next.customerPhone = phoneOf(next);
        if (!hasDuration(next)) next.durationSeconds = null;
        map.set(next.callId, next);
      }
      array(saved?.calls).forEach(row => merge(row, ''));
      const batches = array(read(batchKey, []));
      for (const batch of batches) for (const row of array(batch.rows)) array(row.calls).forEach((call, index) => merge(legacyCall(batch, row, call, index), '批次联系历史', true));
      array(read('linked-scenario-demo-v1', {})?.calls).forEach(row => merge(row, '任务演示记录', false, 'task'));
      array(read('native-workbench-records-v1', [])).forEach(row => merge(row, '呼叫工作台记录', false, 'native'));
      // Only changed live results override persisted snapshots. An old open tab
      // must not roll back newer results written by a different tab.
      array(CloudCallData.calls).forEach(row => {
        const previous = map.get(row.callId), partial = !!row.directoryMeta?.legacyOnly;
        const sameCustomer = previous && previous.tenantId === row.tenantId && previous.enterpriseId === row.enterpriseId && (!phoneOf(previous) || !phoneOf(row) || phoneOf(previous) === phoneOf(row));
        if (sameCustomer && !partial && !previous.directoryMeta?.legacyOnly && (!lastRuntime.has(row.callId) || lastRuntime.get(row.callId) === fingerprint(row))) return;
        merge(row, partial ? '批次联系历史' : '统一通话记录', partial);
      });
      const calls = Array.from(map.values()).sort((a, b) => at(b).localeCompare(at(a)) || String(a.callId).localeCompare(String(b.callId)));
      window.CustomerFollowup?.overlay(calls);
      calls.forEach(row => window.CloudCallSync?.restore(row));
      // Preserve live object references used by reconciliation modules.
      const current = new Map(array(CloudCallData.calls).map(row => [row.callId, row]));
      CloudCallData.calls.splice(0, CloudCallData.calls.length, ...calls.map(row => {
        const live = current.get(row.callId);
        if (live && live.tenantId === row.tenantId && live.enterpriseId === row.enterpriseId) { Object.assign(live, row); return live; }
        return row;
      }));
      for (const row of CloudCallData.calls) lastRuntime.set(row.callId, fingerprint(row));
      conflicts.push(...unmerged.map(row => row.callId));
      const output = JSON.stringify({ version: 1, calls, unmerged });
      try { if (!readFailures.has(key) && localStorage.getItem(key) !== output) localStorage.setItem(key, output); }
      catch (_) { storageIssue = '归集结果暂未保存，当前页面仍可查看；原始批次与通话记录未删除。'; }
      return CloudCallData.calls;
    } finally { syncing = false; }
  }
  function valid() { return window.AppState?.isReady() && AppState.effectiveAccess().valid && AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER'; }
  function calls() { sync(); return valid() ? AppState.scoped(CloudCallData.calls) : []; }
  function list() {
    sync();
    if (!valid()) return [];
    const access = AppState.effectiveAccess(), accountId = AppState.get().accountId;
    const operator = access.roleCode === 'OPERATOR', directories = new Map(), ownedRows = new Set();
    const seatIds = new Set(array(CloudCallData.agents).filter(seat => seat.accountId === accountId && seat.tenantId === access.tenantId && seat.enterpriseId === access.enterpriseId).map(seat => seat.contactCenterIdentityId));
    function get(phone, tenantId, enterpriseId) {
      const id = identity(phone, tenantId, enterpriseId); if (!id) return null;
      if (!directories.has(id)) directories.set(id, { id, phone: normalizePhone(phone), tenantId, enterpriseId, name: '', names: [], notes: [], batches: [], calls: [], createdAt: '', updatedAt: '' });
      return directories.get(id);
    }
    for (const batch of AppState.scoped(array(read(batchKey, [])))) {
      for (const row of array(batch.rows).filter(row => !operator || row.ownerId === accountId || row.repeatContact && batch.createdBy === accountId)) {
        const customer = get(row.phone, batch.tenantId, batch.enterpriseId); if (!customer) continue;
        ownedRows.add(JSON.stringify([batch.tenantId, batch.enterpriseId, row.id]));
        customer.batches.push({ batchId: batch.id, batchName: batch.name, rowId: row.id, name: row.name, note: row.note || '', enterpriseId:batch.enterpriseId, tenantId:batch.tenantId, ...CustomerBusiness.snapshot({...row,enterpriseId:batch.enterpriseId,tenantId:batch.tenantId}), ownerId: row.ownerId || '', taskId: row.taskId || '', taskName: row.taskName || '', method: row.method || '', followup: row.followup, createdAt: batch.createdAt || '', updatedAt: latestTime([row.updatedAt, row.updateTime, row.createdAt, ...array(row.history).map(event => event.at), ...array(row.calls).flatMap(call => [call.updatedAt, call.at, call.endedAt])]) || latestTime([batch.updatedAt, batch.createdAt]), simulation: !!batch.simulation });
        if (row.name && !customer.names.includes(row.name)) customer.names.push(row.name);
        if (row.note && !customer.notes.includes(row.note)) customer.notes.push(row.note);
      }
    }
    for (const call of AppState.scoped(CloudCallData.calls)) {
      const owned = call.accountId === accountId || seatIds.has(call.agentIdentityId || call.contactCenterIdentityId) || [call.customerTaskItemId, ...(call.directoryMeta?.rowIds || [])].some(rowId => ownedRows.has(JSON.stringify([call.tenantId, call.enterpriseId, rowId])));
      if (operator && !owned) continue;
      const customer = get(phoneOf(call), call.tenantId, call.enterpriseId); if (!customer) continue;
      customer.calls.push(call);
      if (call.customerName && !customer.names.includes(call.customerName)) customer.names.push(call.customerName);
      if (call.customerNote && !customer.notes.includes(call.customerNote)) customer.notes.push(call.customerNote);
    }
    for (const customer of directories.values()) {
      customer.batches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      customer.calls.sort((a, b) => at(b).localeCompare(at(a)));
      customer.name = customer.batches[0]?.name || customer.calls.find(call => call.customerName)?.customerName || '未记录称呼';
      customer.note = customer.batches[0]?.note || customer.notes[0] || '';
      customer.followup = window.CustomerFollowup?.aggregate(customer.calls) || {};
      customer.lastCall = customer.calls[0] || null;
      customer.callCount = customer.calls.length;
      customer.batchCount = new Set(customer.batches.map(row => row.batchId)).size;
      customer.unknownDurationCount = customer.calls.filter(call => !hasDuration(call)).length;
      customer.totalDurationSeconds = customer.calls.filter(hasDuration).reduce((total, call) => total + Number(call.durationSeconds), 0);
      const dates = [...customer.batches.map(row => row.createdAt), ...customer.calls.map(at)].filter(value => value && value !== '—').sort();
      customer.createdAt = dates[0] || '';
      customer.updatedAt = latestTime([...dates, ...customer.batches.map(row => row.updatedAt), ...customer.calls.flatMap(call => [call.updatedAt, call.localUpdatedAt, call.updateTime, call.customerFollowup?.updatedAt]), customer.followup.updatedAt]);
    }
    const result = Array.from(directories.values());
    return window.PlatformUI?.sortByUpdated ? PlatformUI.sortByUpdated(result) : result.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || a.phone.localeCompare(b.phone));
  }
  function find(id) { return list().find(customer => customer.id === id); }
  function open(phone, tenantId, enterpriseId) {
    const id = identity(phone, tenantId, enterpriseId), customer = id && find(id);
    if (!customer) { window.showToast?.('未找到当前权限下的客户档案，请确认号码完整且客户仍在授权范围内', 'warning'); return false; }
    window.Pages?.['customer-directory']?.openDetail(id); return true;
  }
  window.CustomerDirectory = { sync, list, calls, find, open, normalizePhone, duration, result, dispositionLabel, provenance, phoneOf, at,
    status: () => ({ storageIssue, conflictingCallIds: [...new Set(conflicts)] }) };
  window.addEventListener('storage', event => { if ([key, batchKey, 'native-workbench-records-v1', 'linked-scenario-demo-v1', 'customer-followup-v1'].includes(event.key)) sync(); });
})();
