(() => {
  'use strict';

  const seatPage = 'PAGE-2210';
  const scoreSources = new Set(['manual','algorithm']);
  const reservedSeatIds = new Set(['__proto__','constructor','prototype']);
  const validSeatId = id => typeof id === 'string' && id !== '' && id === id.trim() && !reservedSeatIds.has(id);
  const validScore = score => score === null || Number.isFinite(score) && score >= 0 && score <= 100;

  function tenantAdmin(context) {
    const session = window.DSession;
    const active = session?.context?.();
    if (active?.scope?.kind !== 'tenant' || context?.scope?.kind !== 'tenant' ||
        !active.account?.id || active.account.id !== context.account?.id ||
        active.scope.id !== context.scope.id ||
        active.scope.tenant?.brandId !== context.scope.tenant?.brandId ||
        !window.DReview21?.allowedScope(active)) return null;
    const role = session.roleKey(active);
    const authorizedSuper = role === 'super' && session.isGlobalAdministrator?.(active) === true &&
      session.platformAuthority?.(active)?.tenantIds?.includes(active.scope.id);
    return /_admin$/.test(role) || authorizedSuper ? active : null;
  }

  function manager(context) {
    const active = tenantAdmin(context);
    return active && window.DSession.allowed(seatPage,active) && window.DSession.can('F38',active) ? active : null;
  }

  function seatsFor(state, active) {
    if (!active || state?.tenant !== active.scope.id || !Array.isArray(state.seats)) return [];
    return state.seats.filter(seat => validSeatId(seat?.id) && seat.tenant === state.tenant &&
      (!seat.brandId || seat.brandId === active.scope.tenant?.brandId));
  }

  function registry(state) {
    const entries = state?.skynetSeatScores;
    if (entries === undefined) return {};
    return Object.prototype.toString.call(entries) === '[object Object]' ? entries : null;
  }

  function storedRecord(entries, seatId) {
    const row = entries && Object.hasOwn(entries,seatId) ? entries[seatId] : null;
    if (!row || typeof row !== 'object' || Array.isArray(row) ||
        row.seatId !== seatId || !validScore(row.score) || !scoreSources.has(row.source)) return null;
    return {
      seatId,
      score:row.score,
      source:row.source,
      updatedAt:typeof row.updatedAt === 'string' && Number.isFinite(Date.parse(row.updatedAt)) ? row.updatedAt : '',
      updatedBy:typeof row.updatedBy === 'string' ? row.updatedBy : ''
    };
  }

  function record(state, context, seatId) {
    const seats = seatsFor(state,tenantAdmin(context));
    return seats.some(seat => seat.id === seatId) ? storedRecord(registry(state),seatId) : null;
  }

  function list(state, context) {
    const entries = registry(state);
    return seatsFor(state,manager(context))
      .map(({id,name,employeeNo,tenant,tenantName,enabled,bindingState}) => ({
        seat:{id,name,employeeNo,tenant,tenantName,enabled,bindingState},
        record:storedRecord(entries,id)
      }));
  }

  function saveManual(state, context, seatId, score) {
    const active = manager(context);
    if (!active || state?.tenant !== active.scope.id) return {error:'当前账号没有本租户的坐席评分维护权限。'};
    if (!window.DReview21.isLatest?.(state)) return {error:'当前租户资料已变化，请刷新后再操作。'};
    if (!seatsFor(state,active).some(seat => seat.id === seatId)) return {error:'请选择本租户的有效坐席。'};
    if (!validScore(score)) return {error:'坐席评分须为 0 至 100 的数字。'};
    const entries = registry(state);
    if (!entries) return {error:'坐席评分暂时无法读取，原数据已保留。'};

    const name = typeof active.account.name === 'string' ? active.account.name.trim() : '';
    const value = {seatId,score,source:'manual',updatedAt:new Date().toISOString(),updatedBy:name || active.account.id};
    state.skynetSeatScores = {...entries,[seatId]:value};
    return {value:{...value}};
  }

  window.DSkynetSeatScores = Object.freeze({
    canManage:context => Boolean(manager(context)),
    record,list,saveManual
  });
})();
