/** Tenant administrators request AliCti supervisor seats; supplier approval remains separate. */
(function (root) {
  'use strict';
  function powerFor(agent) {
    const data = root.CloudCallData;
    if (!agent || !data || !agent.accountId || !agent.tenantId || !agent.enterpriseId || agent.lifecycleStatus === '已删除') return 0;
    const account = (data.accounts || []).find(row => row.accountId === agent.accountId);
    const tenant = (data.tenants || []).find(row => row.tenantId === agent.tenantId);
    if (!account || account.builtIn || account.status !== '启用' || !tenant || tenant.builtIn || tenant.status !== '启用' || tenant.enterpriseId !== agent.enterpriseId || !tenant.capabilitySet?.includes('CLOUD_CONTACT_CENTER')) return 0;
    const memberships = (data.memberships || []).filter(row => row.accountId === account.accountId && row.status === '启用');
    if (memberships.some(row => row.roleCode === 'SUPER_ADMIN')) return 0;
    const local = memberships.filter(row => row.tenantId === tenant.tenantId);
    return local.length === 1 && local[0].roleCode === 'ADMIN' ? 1 : 0;
  }
  function isTenantAdmin() {
    const app = root.AppState, state = app?.get?.(), access = app?.effectiveAccess?.();
    if (!state || !access?.valid || access.roleCode !== 'ADMIN' || app?.isReady?.() === false || state.activeDomain !== 'CLOUD_CONTACT_CENTER') return false;
    if (access.accountId !== state.accountId || access.tenantId !== state.tenantId || access.enterpriseId !== state.enterpriseId) return false;
    return powerFor({ accountId: state.accountId, tenantId: state.tenantId, enterpriseId: state.enterpriseId }) === 1;
  }
  root.TenantSupervisorPolicy = Object.freeze({ powerFor, isTenantAdmin });
})(window);
