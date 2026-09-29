/** Tenant-scoped event observations. Supplier history requires a server-side collector. */
(function () {
  'use strict';
  const root = window, key = 'alicti-seat-event-log-v1';
  const definitions = {
    login: { label: '上线', level: 'normal' },
    idle: { label: '置闲', level: 'normal' },
    busy: { label: '置忙', level: 'normal' },
    offline: { label: '下线', level: 'normal' },
    signalLost: { label: '信令断线', level: 'abnormal' },
    signalRestored: { label: '信令恢复', level: 'normal' },
    softphoneLost: { label: '软电话断开', level: 'abnormal' }
  };
  const sources = { own: '本人操作（模拟）', connection: '本人连接回调（模拟）', management: '班长操作（模拟）', snapshot: '队列快照（模拟观察）', statusApi: '状态接口快照（模拟观察）' };
  const observedSources = [sources.snapshot, sources.statusApi, '队列快照（观察）', '状态接口快照（观察）'];
  const lifecycle = value => ({ '空闲': 'idle', '可接听': 'idle', '置忙': 'busy', '示忙': 'busy', '暂停接听': 'busy', '离线': 'offline', '未上线': 'offline', '下线': 'offline' })[value] || '';
  const active = () => {
    const app = root.AppState, s = app?.get?.(), access = app?.effectiveAccess?.();
    return s?.enterpriseId && s?.tenantId && s?.accountId && access?.valid &&
      s.activeDomain === 'CLOUD_CONTACT_CENTER' && app?.hasCapability?.('CLOUD_CONTACT_CENTER') ? s : null;
  };
  const admin = () => root.TenantSupervisorPolicy?.isTenantAdmin?.() === true;
  const seatFor = (s, cno) => {
    if (typeof cno !== 'string' || !cno) return null;
    const matches = (root.CloudCallData?.agents || []).filter(a => a.enterpriseId === s.enterpriseId && a.cno === cno && a.lifecycleStatus !== '已删除');
    return matches.length === 1 && matches[0].tenantId === s.tenantId ? matches[0] : null;
  };
  let memoryRows = [];
  function read() {
    try {
      const raw = root.localStorage?.getItem(key);
      if (raw === null) return [];
      if (raw === undefined) return memoryRows;
      const value = JSON.parse(raw);
      return value?.version === 1 && Array.isArray(value.rows) ? value.rows : memoryRows;
    } catch (_) { return memoryRows; }
  }
  function write(rows) {
    memoryRows = rows;
    try { root.localStorage?.setItem(key, JSON.stringify({ version: 1, rows })); }
    catch (_) { /* The current page still keeps its demonstration log. */ }
    return true;
  }
  function notify() {
    if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') root.dispatchEvent(new root.CustomEvent('seat-event-log-updated'));
  }
  function record(agent, type, options = {}) {
    const s = active(), spec = definitions[type], source = options.source;
    if (!s || !spec || !Object.hasOwn(sources, source) || !agent || agent.enterpriseId !== s.enterpriseId || agent.tenantId !== s.tenantId) return null;
    const seat = seatFor(s, agent.cno);
    if (!seat || seat.contactCenterIdentityId !== agent.contactCenterIdentityId) return null;
    if (['snapshot', 'statusApi', 'management'].includes(source) && !admin()) return null;
    if (['own', 'connection'].includes(source) && seat.accountId !== s.accountId && seat.contactCenterIdentityId !== root.AppState?.account?.()?.linkedIdentityId) return null;
    const rows = read(), now = Date.now(), toState = String(options.toState || '').slice(0, 32), fromState = String(options.fromState || '').slice(0, 32);
    // A state query is an observation, not a second action or an event-history endpoint.
    if (['snapshot', 'statusApi'].includes(source)) {
      const latestState = rows.filter(row => row.enterpriseId === s.enterpriseId && row.tenantId === s.tenantId && row.cno === seat.cno &&
        row.seatIdentityId === seat.contactCenterIdentityId && ['login', 'idle', 'busy', 'offline'].includes(row.type))
        .sort((a, b) => (b.updatedAt || b.occurredAt) - (a.updatedAt || a.occurredAt))[0];
      if (latestState && lifecycle(latestState.toState) && lifecycle(latestState.toState) === lifecycle(toState)) return null;
    }
    const row = { id: now + '-' + Math.random().toString(36).slice(2, 9), enterpriseId: s.enterpriseId, tenantId: s.tenantId,
      cno: seat.cno, name: seat.userName || seat.cno, seatIdentityId: seat.contactCenterIdentityId, occurredAt: now, updatedAt: now, type, label: spec.label, level: spec.level,
      source: sources[source], fromState, toState, detail: String(options.detail || '').trim().slice(0, 120), mock: true };
    const current = rows.filter(item => item.enterpriseId === s.enterpriseId && item.tenantId === s.tenantId);
    const other = rows.filter(item => item.enterpriseId !== s.enterpriseId || item.tenantId !== s.tenantId);
    if (!write([...other, ...[row, ...current].sort((a, b) => (b.updatedAt || b.occurredAt) - (a.updatedAt || a.occurredAt))])) return null;
    notify(); return row;
  }
  function list() {
    const s = active(); if (!s || !admin()) return [];
    return read().filter(row => row?.enterpriseId === s.enterpriseId && row?.tenantId === s.tenantId && typeof row.cno === 'string' && row.cno && definitions[row.type] &&
      (Object.values(sources).includes(row.source) || observedSources.includes(row.source)) && Number.isFinite(row.updatedAt || row.occurredAt))
      .sort((a, b) => (b.updatedAt || b.occurredAt) - (a.updatedAt || a.occurredAt))
      .map(row => ({ ...row, label: observedSources.includes(row.source) ?
        ({ idle: '观察到空闲', busy: '观察到置忙', offline: '观察到离线' })[lifecycle(row.toState)] || '观察到状态变化' : definitions[row.type].label,
        level: definitions[row.type].level, name: row.name || row.cno,
        source: row.source === '队列快照（观察）' ? sources.snapshot : row.source === '状态接口快照（观察）' ? sources.statusApi : row.source }));
  }
  const observations = new Map();
  let observationContext = '';
  function observeSnapshot(rows, options = {}) {
    const s = active(); if (!s || !admin() || !Array.isArray(rows)) return [];
    const source = options.source === 'statusApi' ? 'statusApi' : 'snapshot';
    const context = JSON.stringify([s.sessionId, s.accountId, s.enterpriseId, s.tenantId]);
    if (context !== observationContext) { observations.clear(); observationContext = context; }
    const scope = source;
    const previous = observations.get(scope), next = new Map(), added = [];
    for (const row of rows) if (seatFor(s, row?.cno) && typeof row.state === 'string') next.set(row.cno, row.state);
    observations.set(scope, next);
    if (!previous) return added; // First read establishes a baseline, not fictional history.
    for (const [cno, toState] of next) {
      const fromState = previous.get(cno), from = lifecycle(fromState), to = lifecycle(toState);
      if (!from || !to || from === to) continue;
      const type = to === 'idle' ? from === 'offline' ? 'login' : 'idle' : to === 'busy' ? 'busy' : 'offline';
      const event = record(seatFor(s, cno), type, { source, fromState, toState });
      if (event) added.push(event);
    }
    return added;
  }
  if (typeof root.addEventListener === 'function') root.addEventListener('storage', event => { if (event.key === key) notify(); });
  root.SeatEventLog = Object.freeze({ record, list, observeSnapshot });
})();
