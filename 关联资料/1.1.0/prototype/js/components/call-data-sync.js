/** Local demonstration of asynchronous CDR synchronization. Never calls a supplier. */
(function (root) {
  'use strict';
  const prefix = 'call-data-sync-v1:', timers = new Map(), failures = new Map();
  const fields = ['telephony', 'alictiCdr', 'result', 'durationSeconds', 'answeredAt'];
  const clone = value => structuredClone(value);
  const stamp = at => at ? new Date(at).toLocaleString('sv-SE') : '';
  const identity = row => JSON.stringify([row.tenantId, String(row.enterpriseId), row.callId, row.contactId || '', row.customerTaskItemId || '', row.taskId || '', row.caller || '', row.callee || '']);
  const key = row => prefix + encodeURIComponent(identity(row));
  const snapshot = row => Object.fromEntries(fields.map(name => [name, row[name] === undefined ? null : clone(row[name])]));
  const allowed = row => !!row && root.AppState?.get().activeDomain === 'CLOUD_CONTACT_CENTER' && root.AppState.authorizeObject('', row);
  const isDemo = row => !!row && (row.simulation === true || row.alictiCdr?.mock === true || !!row.demoPack || root.CloudCallMediaFixtures?.[row.callId]?.demo === true);
  const ended = row => !!(row?.endedAt || root.CallState?.view(row).ended);
  const find = id => (root.CloudCallData?.calls || []).find(row => row.callId === id && allowed(row));

  function stored(row) {
    const raw = localStorage.getItem(key(row));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (entry?.version !== 1 || entry.identity !== identity(row) || !entry.sync || !entry.snapshot) throw Error('Invalid sync journal');
    if ((entry.calibrationId || '') !== (row.syncCalibrationId || '')) { delete row.dataSync; return null; }
    return entry;
  }
  function apply(row, entry) {
    if (!entry || entry.identity !== identity(row)) return;
    // This journal owns only telephone facts. Notes, follow-up and source links
    // always come from the latest business record, never from a delayed snapshot.
    for (const name of fields) row[name] = clone(entry.snapshot[name]);
    row.dataSync = clone(entry.sync);
  }
  function emit(row) {
    root.dispatchEvent(new CustomEvent('call-data-sync', { detail: { callId: row.callId, tenantId: row.tenantId, enterpriseId: row.enterpriseId } }));
  }
  function write(row, entry) {
    try {
      localStorage.setItem(key(row), JSON.stringify(entry));
      failures.delete(key(row)); apply(row, entry); return true;
    } catch (_) {
      failures.set(key(row), '同步资料未能保存，请检查浏览器存储后重试。');
      return false;
    }
  }
  function schedule(row, entry) {
    const id = key(row), deadlines = [entry.sync.status === 'pending' ? entry.sync.readyAt : null, entry.sync.mediaPending ? entry.sync.mediaReadyAt : null].filter(Boolean);
    const at = deadlines.length ? Math.min(...deadlines) : null;
    clearTimeout(timers.get(id)); timers.delete(id);
    if (!at || failures.has(id)) return;
    const revision = entry.sync.revision;
    timers.set(id, setTimeout(() => {
      timers.delete(id);
      const current = (root.CloudCallData?.calls || []).find(item => identity(item) === entry.identity);
      if (current) settle(current, revision);
    }, Math.max(0, at - Date.now())));
  }
  function settle(row, revision) {
    let entry;
    try { entry = stored(row); } catch (_) { failures.set(key(row), '同步记录无法读取，请保留数据并核对。'); emit(row); return false; }
    if (!entry || entry.sync.revision !== revision) return false;
    const next = clone(entry), sync = next.sync;
    if (sync.status === 'pending' && sync.readyAt <= Date.now()) {
      if (sync.outcome === 'error') {
        sync.status = 'error'; sync.note = '本次资料同步失败，已有通话和跟进记录已保留。';
      } else {
        next.snapshot = clone(sync.finalSnapshot);
        sync.status = 'synced'; sync.updatedAt = Date.now(); sync.note = '本地演示资料已更新；后续仍可校准。';
      }
      sync.readyAt = null;
    }
    if (sync.mediaPending && sync.mediaReadyAt <= Date.now()) {
      sync.mediaPending = false; sync.mediaReadyAt = null; sync.mediaUpdatedAt = Date.now();
      if (sync.status === 'synced') sync.note = '本地演示话单已同步，合成录音样例已就绪。';
    }
    if (!write(row, next)) { emit(row); return false; }
    // The independently saved business journal is merged before read-only views
    // update. CustomerDirectory overlays this technical journal last.
    root.CustomerDirectory?.sync();
    schedule(row, next); emit(row); return true;
  }
  function restore(row) {
    if (!row?.callId || !row.tenantId || !row.enterpriseId) return row;
    try { const entry = stored(row); if (entry) { apply(row, entry); schedule(row, entry); } }
    catch (_) { failures.set(key(row), '同步记录无法读取，请保留数据并核对。'); }
    return row;
  }
  function read(row) {
    if (!row) return { status: 'unknown', label: '待核对', updatedAt: '', note: '', canDemo: false, mediaPending: false };
    restore(row);
    const sync = row.dataSync, issue = failures.get(key(row)), state = root.CallState?.view(row);
    let status = issue ? 'error' : sync?.status;
    if (!status) status = !ended(row) ? 'live' : row.alictiCdr?.raw || state?.confirmation === 'CONFIRMED' ? 'synced' : 'unknown';
    const labels = { live: '通话中', pending: '同步中', synced: '已同步', error: '同步异常', unknown: '待核对' };
    return { status, label: !sync && status === 'synced' ? '已有资料' : labels[status], updatedAt: stamp(sync?.updatedAt),
      note: issue || sync?.note || (status === 'unknown' ? '尚未取得可核对的完整话单。' : status === 'synced' ? '已有演示资料，尚无本轮同步时间。' : '通话结束后同步资料。'),
      canDemo: allowed(row) && isDemo(row) && ended(row), mediaPending: sync?.mediaPending === true,
      mediaDemo: sync?.mediaDemo === true, canRefresh: allowed(row) && ended(row) && isDemo(row), mock: true };
  }
  function begin(row, observed) {
    if (!allowed(row) || !isDemo(row) || !ended(row)) return false;
    const finalSnapshot = snapshot(row), pendingSnapshot = snapshot(observed || row);
    const entry = { version: 1, identity: identity(row), calibrationId: row.syncCalibrationId || '', snapshot: pendingSnapshot, sync: {
      revision: root.crypto.randomUUID(), status: 'pending', updatedAt: null, readyAt: Date.now() + 6000,
      finalSnapshot, outcome: 'success', mediaPending: false, mediaDemo: false,
      note: '通话已结束，资料同步中；可以先保存本次跟进。'
    } };
    if (!write(row, entry)) { emit(row); return false; }
    schedule(row, entry); return true;
  }
  function demo(id, mode) {
    const row = find(id);
    if (!row || !read(row).canDemo || !['delayed', 'media', 'error'].includes(mode)) return false;
    let previous;
    try { previous = stored(row); } catch (_) { root.showToast?.('同步记录无法读取，请保留数据并核对', 'error'); return false; }
    const entry = previous ? clone(previous) : { version: 1, identity: identity(row), calibrationId: row.syncCalibrationId || '', snapshot: snapshot(row), sync: {} };
    const priorFinal = entry.sync.finalSnapshot || snapshot(row);
    entry.sync = { revision: root.crypto.randomUUID(), status: mode === 'media' ? 'synced' : 'pending',
      finalSnapshot: priorFinal, updatedAt: mode === 'media' ? Date.now() : entry.sync.updatedAt || null,
      readyAt: mode === 'media' ? null : Date.now() + (mode === 'error' ? 1500 : 6000),
      outcome: mode === 'error' ? 'error' : 'success', mediaPending: mode === 'media' || entry.sync.mediaPending === true, mediaDemo: mode === 'media' || entry.sync.mediaDemo === true,
      mediaReadyAt: mode === 'media' ? Date.now() + 8000 : entry.sync.mediaReadyAt || null,
      note: mode === 'media' ? '演示话单已到，录音样例稍后就绪。' : '正在演示资料同步，已有结果保留供参考。' };
    if (mode === 'media') entry.snapshot = clone(priorFinal);
    if (!write(row, entry)) { emit(row); root.showToast?.('演示状态未能保存，请重试', 'error'); return false; }
    schedule(row, entry); emit(row); return true;
  }
  function refresh(id) {
    const row = find(id);
    if (!row || !read(row).canRefresh) { root.showToast?.('当前资料尚无可执行的本地同步演示', 'info'); return false; }
    let entry;
    try { entry = stored(row); } catch (_) { root.showToast?.('同步记录无法读取，请保留数据并核对', 'error'); return false; }
    if (!entry) return demo(id, 'delayed');
    if (entry.sync.status === 'pending' && entry.sync.outcome !== 'error' && !failures.has(key(row))) return true;
    const next = clone(entry);
    next.sync.revision = root.crypto.randomUUID(); next.sync.status = 'pending'; next.sync.outcome = 'success';
    next.sync.readyAt = Date.now() + 1500; next.sync.note = '正在重新获取通话资料，已保存的跟进保持不变。';
    if (!write(row, next)) { emit(row); root.showToast?.('同步状态未能保存，请重试', 'error'); return false; }
    schedule(row, next); emit(row); return true;
  }
  function summary(rows) {
    const values = (rows || []).filter(allowed).map(read), times = values.map(value => value.updatedAt).filter(Boolean).sort();
    return { total: values.length, synced: values.filter(value => value.status === 'synced').length,
      pending: values.filter(value => value.status === 'pending').length, errors: values.filter(value => ['error', 'unknown'].includes(value.status)).length,
      updatedAt: times.at(-1) || '' };
  }
  root.CloudCallSync = Object.freeze({ read, restore, begin, refresh, demo, summary });
  root.addEventListener('storage', event => {
    if (!event.key || !event.key.includes(prefix)) return;
    for (const row of root.CloudCallData?.calls || []) if (event.key.endsWith(key(row))) { restore(row); emit(row); }
  });
})(window);
