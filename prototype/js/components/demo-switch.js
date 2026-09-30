/** Demo accounts only: skip typing credentials, never choose permissions or context. */
(function () {
  'use strict';
  const data = CloudCallData, ui = PlatformUI, esc = ui.escape;
  let switching = false;
  const enabled = () => data.demoSwitchEnabled === true;
  const roles = { SUPER_ADMIN: '超级管理员', ADMIN: '租户管理员', OPERATOR: '租户运营' };
  const demoAccounts = () => [...new Set(data.demoAccountIds || [])].map(id => data.accounts.find(a => a.accountId === id)).filter(Boolean);
  const domainsLabel = domains => [...new Set(domains || [])].map(key => AppState.domainMeta[key]?.label).filter(Boolean).join('、') || '未开通';
  function seatLabel(account, tenant) {
    if (!tenant.capabilitySet?.includes('CLOUD_CONTACT_CENTER')) return '未开通云联络中心';
    const seat = (data.agents || []).find(a => (a.accountId === account.accountId || (!a.accountId && account.linkedIdentityId && a.contactCenterIdentityId === account.linkedIdentityId)) && a.tenantId === tenant.tenantId && a.enterpriseId === tenant.enterpriseId && a.lifecycleStatus !== '已删除');
    if (!seat) return '未关联坐席';
    return seat.lifecycleStatus === '已启用' && seat.syncStatus === '同步成功' ? '已开通坐席' : '已关联 · ' + (seat.lifecycleStatus === '已启用' ? (seat.syncStatus || '待核对') : (seat.lifecycleStatus || '待核对'));
  }
  function membershipRows(account) {
    return (data.memberships || []).filter(m => m.accountId === account.accountId).map(member => {
      if (account.builtIn === true && member.tenantId === 'TENANT-SUPER-BUILTIN' && member.roleCode === 'SUPER_ADMIN') {
        const available = data.instances.filter(i => i.status === 'RUNNING');
        const remembered = available.find(i => i.enterpriseId === account.lastEnterpriseId);
        const domains = data.tenants.filter(t => t.status === '启用' && available.some(i => i.enterpriseId === t.enterpriseId) && (!remembered || t.enterpriseId === remembered.enterpriseId)).flatMap(t => t.capabilitySet || []);
        return { tenant: '超级管理租户（内置）', role: roles.SUPER_ADMIN, domain: domainsLabel(domains), seat: '不适用', status: member.status, usable: member.status === '启用' && domains.length > 0 && available.length > 0, note: remembered ? '上次客户/品牌：' + remembered.brandCustomerName : '登录后选择客户/品牌；业务域随所选品牌确定' };
      }
      const tenant = data.tenants.find(t => t.tenantId === member.tenantId);
      if (!tenant || !['ADMIN', 'OPERATOR'].includes(member.roleCode)) return null;
      const usable = member.status === '启用' && tenant.status === '启用' && (tenant.capabilitySet || []).some(key => AppState.domainMeta[key]) && data.instances.some(i => i.enterpriseId === tenant.enterpriseId && i.status === 'RUNNING');
      return { tenant: tenant.name, role: roles[member.roleCode], domain: domainsLabel(tenant.capabilitySet), seat: seatLabel(account, tenant), status: member.status === '启用' ? tenant.status : '成员已停用', usable, note: tenant.organizationLabel || '' };
    }).filter(Boolean);
  }
  function unavailableReason(account, rows) {
    if (account.status !== '启用') return '账号已停用';
    return rows.some(row => row.usable) ? '' : '暂无可用租户或业务域';
  }
  function loginShortcut() {
    if (!enabled()) return '';
    return '<details class="demo-login-shortcut"><summary>演示工具 <span>仅原型</span></summary><p>使用已有演示账号，免手工输入账号密码。</p><button type="button" class="btn" onclick="DemoSwitch.open()">演示账号快捷登录</button></details>';
  }
  function open() {
    if (!enabled()) return;
    ui.openLayer('demo-accounts',
      '<div class="layer-header"><div><h2>演示账号快捷登录</h2><p>选择账号后，按正常流程选择租户与业务域</p></div><button aria-label="关闭演示账号" onclick="PlatformUI.closeLayer(\'demo-accounts\')">×</button></div>' +
      '<div class="layer-body"><div class="demo-account-list">' +
      (demoAccounts().map(account => {
        const rows = membershipRows(account), reason = unavailableReason(account, rows);
        return '<article class="demo-account-card" data-demo-account="' + esc(account.accountId) + '"><header><div><strong>' + esc(account.name || account.nickname || account.loginUsername) + '</strong><span>账号：' + esc(account.loginUsername) + '</span></div><button type="button" class="btn" aria-label="快捷登录 ' + esc(account.loginUsername) + '" onclick="DemoSwitch.enter(' + esc(JSON.stringify(account.accountId)) + ')"' + (reason ? ' disabled' : '') + '>快捷登录</button></header>' +
          rows.map(row => '<div class="demo-account-membership"><div class="demo-account-tenant"><strong>' + esc(row.tenant) + '</strong><span class="demo-account-role">' + esc(row.role) + '</span></div><dl><div><dt>业务域</dt><dd>' + esc(row.domain) + '</dd></div><div><dt>坐席</dt><dd>' + esc(row.seat) + '</dd></div></dl>' + (row.note ? '<small>' + esc(row.note) + '</small>' : '') + (row.status !== '启用' ? '<small class="demo-account-warning">' + esc(row.status) + '</small>' : '') + '</div>').join('') +
          (reason ? '<p class="demo-account-warning">' + esc(reason) + '</p>' : '') + '</article>';
      }).join('') || '<p>暂无已配置的演示账号</p>') + '</div></div><div class="layer-footer"><p class="demo-boundary">仅本地演示，不新增账号或权限。登录其他账号会退出当前会话，已保存数据保留。</p><button class="btn" onclick="PlatformUI.closeLayer(\'demo-accounts\')">取消</button></div>',
      'small');
  }
  function enter(id) {
    if (!enabled() || switching) return false;
    const account = demoAccounts().find(a => a.accountId === id);
    if (!account) { showToast('此账号不在演示账号清单中', 'warning'); return false; }
    const reason = unavailableReason(account, membershipRows(account));
    if (reason) { showToast(reason + '，请先恢复配置', 'warning'); return false; }
    // The same call protection applies to ordinary logout and demo switching.
    if (window.AgentWorkbench && !AgentWorkbench.allowContextChange(true)) return false;
    if (AppState.get().hasUnsavedChanges) {
      ui.closeLayer('demo-accounts');
      showToast('请先保存当前修改，再登录其他演示账号', 'warning');
      return false;
    }
    switching = true;
    try {
      ui.closeLayer('demo-accounts');
      if (!AppState.logout(false)) return false;
      AppState.setLoginMode('password');
      document.getElementById('authUsername').value = account.loginUsername;
      document.getElementById('authPassword').value = account.password;
      document.getElementById('authCaptcha').value = 'a8Cq';
      if (!AppState.submitLogin()) return false;
      // submitLogin alone owns tenant/instance/domain transitions. No demo-only
      // role, default tenant, preferred domain or special landing-page override.
      if (!AppState.isReady()) showToast('账号验证通过，请继续选择工作范围', 'success');
      return true;
    } finally { switching = false; }
  }
  window.DemoSwitch = { open, enter, loginShortcut };
  document.addEventListener('DOMContentLoaded', () => { const entry = document.getElementById('demo-tools-entry'); if (entry) entry.hidden = !enabled(); });
})();
