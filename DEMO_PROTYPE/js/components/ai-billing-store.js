/** 当前账号/租户与原智能外呼分钟服务的适配层。仅本地原型账本，不接入真实任务扣费。 */
(function () {
  'use strict';
  const STORAGE_KEY = 'unified-call-ai-minute-ledger-v1';
  const LOCK_KEY = 'unified-call-ai-minute-ledger-write-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const tenants = () => window.CloudCallData?.tenants || [];
  const service = () => window.RechargeService;
  const demoStates = {};
  let lastStorageError = '';
  let localQueue = Promise.resolve();

  function tenant(value) {
    const id = typeof value === 'object' && value ? value.tenantId || value.id : value;
    return tenants().find(row => row.tenantId === id) || null;
  }
  function liveAuth() {
    const app = window.AppState;
    const state = app?.get() || {};
    const access = app?.effectiveAccess() || {};
    const account = (window.CloudCallData?.accounts || []).find(row => row.accountId === state.accountId);
    const aiContext = access.valid && state.activeDomain === 'AI_OUTBOUND';
    const readable = aiContext ? tenants().filter(row => row.capabilitySet?.includes('AI_OUTBOUND') && row.instanceId === state.instanceId && app.authorizeObject('', row)) : [];
    const manage = !!(aiContext && app.canAction('ai.billing.manage'));
    return {
      id: account?.accountId || '', username: account?.loginUsername || '',
      role: manage ? 'super_admin' : 'tenant_user',
      accessibleTenantIds: manage ? readable.map(row => row.tenantId) : [],
      readableTenantIds: readable.map(row => row.tenantId),
      contextKey: JSON.stringify([state.sessionId, state.accountId, state.tenantId, state.instanceId, state.activeDomain, access.roleCode, !!access.valid]),
      manage
    };
  }
  function contextKey() { return liveAuth().contextKey; }
  function emptyAccount(row) {
    return {
      tenantId: row.tenantId, instanceId: row.instanceId, provenance: 'new-minute-account',
      entitlement: { productType: '', effectiveAt: '', expiresAt: '', durationDays: 0 },
      unifiedMinutePool: { availableMinutes: 0, frozenMinutes: 0, consumedMinutes: 0, accountVersion: 'AI-MINUTE-EMPTY-' + row.tenantId + '-V1' }
    };
  }
  function validAccount(value, row) {
    const pool = value?.unifiedMinutePool;
    return !!(value && value.tenantId === row.tenantId && value.instanceId === row.instanceId && value.entitlement &&
      typeof value.entitlement === 'object' && !Array.isArray(value.entitlement) && pool &&
      ['availableMinutes', 'frozenMinutes', 'consumedMinutes'].every(key => Number.isSafeInteger(pool[key]) && pool[key] >= 0) &&
      typeof pool.accountVersion === 'string' && pool.accountVersion);
  }
  function readLedger() {
    lastStorageError = '';
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw == null) return { version: 1, accounts: {}, rechargeRecords: [], adjustmentRecords: [], operationResults: [] };
      const value = JSON.parse(raw);
      if (!value || value.version !== 1 || !value.accounts || typeof value.accounts !== 'object' || Array.isArray(value.accounts) ||
        !['rechargeRecords', 'adjustmentRecords', 'operationResults'].every(key => Array.isArray(value[key]))) throw new Error('账本格式无法识别');
      return value;
    } catch (error) {
      lastStorageError = '分钟账本暂不可读取，原数据已保留，请恢复存储后重试';
      return null;
    }
  }
  function accountFor(row, ledger) {
    if (Object.prototype.hasOwnProperty.call(ledger.accounts, row.tenantId)) {
      const stored = ledger.accounts[row.tenantId];
      if (!validAccount(stored, row)) throw new Error('分钟账户与当前租户范围不一致或数据不完整');
      return clone(stored);
    }
    // 先采用已有分钟账户；不读 aiBilling 金额，更不从人民币推算分钟。
    if (row.aiMinuteAccount != null) {
      if (!validAccount(row.aiMinuteAccount, row)) throw new Error('已有分钟账户数据不完整，未覆盖');
      return clone(row.aiMinuteAccount);
    }
    const opening = window.AiBillingMock?.openingAccounts?.[row.tenantId];
    if (opening && opening.instanceId === row.instanceId) return { ...clone(opening), tenantId: row.tenantId };
    return emptyAccount(row);
  }
  function makeData(ledger) {
    const readable = liveAuth().readableTenantIds;
    const profiles = [];
    const accountErrors = {};
    for (const row of tenants().filter(row => readable.includes(row.tenantId))) {
      try {
        const minuteAccount = accountFor(row, ledger);
        profiles.push({ ...minuteAccount, id: row.tenantId, name: row.name,
          commercialFlag: row.commercialFlag || 'commercial', commercialFlagLabel: row.commercialFlag === 'trial' ? '试用' : '商用' });
      } catch (error) { accountErrors[row.tenantId] = error.message; }
    }
    const value = {
      products: clone(window.AiBillingMock?.products || {}), tenants: profiles,
      rechargeRecords: clone(ledger.rechargeRecords), adjustmentRecords: clone(ledger.adjustmentRecords),
      operationResults: clone(ledger.operationResults), demoStates, accountErrors,
      activeAuthKey: 'current', contextKey: contextKey(), storageError: lastStorageError
    };
    Object.defineProperties(value, {
      // 秒级真实北京时间；源服务负责分钟表单与边界判断，不沿用源演示日期。
      simulatedNow: { enumerable: true, get: () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ') },
      authContexts: { enumerable: true, get: () => ({ current: liveAuth() }) }
    });
    return value;
  }
  function minuteAccount(profile) {
    const result = clone(profile);
    delete result.id; delete result.name; delete result.commercialFlag; delete result.commercialFlagLabel;
    return result;
  }
  function mirror(data) {
    for (const profile of data.tenants) {
      const row = tenant(profile.id);
      if (row && row.instanceId === profile.instanceId) row.aiMinuteAccount = minuteAccount(profile);
    }
  }
  function prepare() {
    const ledger = readLedger();
    const current = makeData(ledger || { accounts: {}, rechargeRecords: [], adjustmentRecords: [], operationResults: [] });
    if (!ledger) { current.tenants = []; current.storageError = lastStorageError; }
    window.MockRechargeIteration = current;
    if (ledger) mirror(current);
    return current;
  }
  function profile(value) {
    const row = tenant(value);
    const current = prepare();
    return row ? clone(current.tenants.find(item => item.id === row.tenantId) || null) : null;
  }
  function summary(value) {
    const row = tenant(value);
    const p = profile(value);
    const error = lastStorageError || window.MockRechargeIteration.accountErrors[row?.tenantId];
    const state = error ? 'invalid' : p ? service().status(p.entitlement) : 'not_opened';
    const pool = p?.unifiedMinutePool || {};
    return {
      profile: p, status: state, statusLabel: service().statusText(state),
      availableMinutes: pool.availableMinutes ?? 0, frozenMinutes: pool.frozenMinutes ?? 0, consumedMinutes: pool.consumedMinutes ?? 0,
      validity: p?.entitlement.effectiveAt && p?.entitlement.expiresAt ? p.entitlement.effectiveAt + ' 至 ' + p.entitlement.expiresAt : '未开通',
      productName: window.AiBillingMock?.products[p?.entitlement.productType]?.name || '未开通',
      canCall: !!(p && state === 'active' && pool.availableMinutes > 0 && row.status === '启用'),
      error: error || '', demoLabel: p?.demoLabel || ''
    };
  }
  function mayManage(value) {
    const row = tenant(value);
    return !!(row && liveAuth().accessibleTenantIds.includes(row.tenantId));
  }
  function withLock(action) {
    // Web Locks 与同步版本校验共同保护跨标签写入；不支持安全锁时不悄悄降级为可覆盖的写入。
    if (!window.navigator?.locks?.request) return Promise.resolve({ status: 'failed', errors: ['当前浏览器无法安全保存分钟账，请通过本地服务地址打开后重试'] });
    const run = () => navigator.locks.request(LOCK_KEY, { mode: 'exclusive' }, action);
    const result = localQueue.then(run, run).catch(() => ({ status: 'failed', errors: ['分钟账保存失败，原账户与流水未改变，可按原标识重试'] }));
    localQueue = result.then(() => undefined, () => undefined);
    return result;
  }
  function save(ledger, current) {
    const next = clone(ledger);
    for (const p of current.tenants) next.accounts[p.id] = minuteAccount(p);
    next.rechargeRecords = current.rechargeRecords;
    next.adjustmentRecords = current.adjustmentRecords;
    next.operationResults = current.operationResults;
    next.updatedAt = service().format(Date.now());
    // 一个持久化写入包含账户、流水、幂等结果，成功后才更新界面使用的租户镜像。
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    mirror(current);
  }
  async function commit(kind, request) {
    const submitted = clone(request || {});
    if (!['recharge', 'adjustment'].includes(kind)) return { status: 'invalid', errors: ['未知的分钟账户操作'] };
    return withLock(() => {
      if (!submitted.contextKey || submitted.contextKey !== contextKey() || !mayManage(submitted.tenantId)) return { status: 'denied', errors: ['登录、租户或业务域已变化，请重新打开表单'] };
      const ledger = readLedger();
      if (!ledger) return { status: 'failed', errors: [lastStorageError] };
      const current = makeData(ledger);
      window.MockRechargeIteration = current;
      if (current.accountErrors[submitted.tenantId]) return { status: 'invalid', errors: [current.accountErrors[submitted.tenantId]] };
      const result = kind === 'recharge' ? service().commitRecharge(submitted) : service().commitAdjustment(submitted);
      try {
        if (['success', 'unknown'].includes(result.status) && !result.duplicate) save(ledger, current);
      } catch (error) {
        prepare();
        return { status: 'failed', errors: ['分钟账保存失败，原账户与流水未改变，可按原标识重试'] };
      }
      prepare();
      return result;
    });
  }
  async function reconcile(key) {
    const openedContext = contextKey();
    return withLock(() => {
      if (openedContext !== contextKey() || !liveAuth().manage) return { status: 'denied', errors: ['当前身份无权核对分钟账户操作'] };
      const ledger = readLedger();
      if (!ledger) return { status: 'failed', errors: [lastStorageError] };
      const current = makeData(ledger);
      window.MockRechargeIteration = current;
      const result = service().reconcile(key);
      try { if (result.status === 'success') save(ledger, current); }
      catch (error) { prepare(); return { status: 'unknown', errors: ['核对结果暂未保存，原记录已保留，请继续核对'] }; }
      prepare();
      return result;
    });
  }
  function records(tenantId, kind) {
    const current = prepare();
    if (!current.tenants.some(row => row.id === tenantId)) return [];
    const rows = kind === 'recharge' ? current.rechargeRecords : kind === 'adjustment' ? current.adjustmentRecords : [...current.rechargeRecords, ...current.adjustmentRecords];
    return clone(rows.filter(row => row.tenantId === tenantId).sort((a, b) => String(b.operatedAt || '').localeCompare(String(a.operatedAt || ''))));
  }
  function initTenant(row) {
    if (!row?.tenantId || !row.instanceId) return null;
    // 供新增租户保存流程调用。不会把编辑现有租户当作重新开户，也不会覆盖未知存储。
    const ledger = readLedger();
    if (!ledger) return null;
    if (Object.prototype.hasOwnProperty.call(ledger.accounts, row.tenantId)) {
      if (!validAccount(ledger.accounts[row.tenantId], row)) return null;
      row.aiMinuteAccount = clone(ledger.accounts[row.tenantId]);
    } else if (row.aiMinuteAccount == null) row.aiMinuteAccount = emptyAccount(row);
    else if (!validAccount(row.aiMinuteAccount, row)) return null;
    return clone(row.aiMinuteAccount);
  }
  window.AiBillingStore = {
    profile, summary, prepare, commit, reconcile, records, initTenant, mayManage, contextKey,
    status: value => summary(value).status, storageKey: STORAGE_KEY
  };
})();
