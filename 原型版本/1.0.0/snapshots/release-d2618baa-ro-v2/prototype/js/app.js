/** 统一登录、租户、业务域、角色与 AliCti 账号工作上下文。 */
(function () {
  'use strict';

  const data = () => window.CloudCallData || {};
  const listeners = [];
  const storageKey = 'unified-call-context-v3';
  const identityStorageKey = 'unified-call-demo-identities-v2';
  const preferenceStorageKey = 'unified-call-demo-preferences-v1';
  // 仅保存本标签页的演示管理数据，不是真实认证或后端权限存储。
  // 内置账号/超管成员来自随包基线，普通账号不能通过恢复快照变成超管。
  const builtInAccountIds = new Set((data().accounts || []).filter(item => item.builtIn === true).map(item => item.accountId));
  const builtInMembers = (data().memberships || []).filter(item => builtInAccountIds.has(item.accountId) && item.tenantId === 'TENANT-SUPER-BUILTIN' && item.roleCode === 'SUPER_ADMIN');
  // 旧样例允许一个企业账号关联多个租户；仅重置该模块的旧快照。
  try { sessionStorage.removeItem('unified-call-demo-identities-v1'); } catch (_) { /* 不影响随包基线。 */ }
  restoreManagementData();
  restoreInstancePreferences();

  function validInstancePreference(enterpriseId) {
    return typeof enterpriseId === 'string' && (data().instances || []).some(item => item.enterpriseId === enterpriseId && item.status === 'RUNNING');
  }

  function restoreInstancePreferences() {
    try {
      const savedPreferences = JSON.parse(sessionStorage.getItem(preferenceStorageKey) || 'null');
      if (!savedPreferences || savedPreferences.version !== 1 || !savedPreferences.lastInstanceByAccount || typeof savedPreferences.lastInstanceByAccount !== 'object' || Array.isArray(savedPreferences.lastInstanceByAccount)) return;
      (data().accounts || []).filter(item => builtInAccountIds.has(item.accountId)).forEach(item => {
        const enterpriseId = savedPreferences.lastInstanceByAccount[item.accountId];
        // 唯一允许恢复的内置账号字段是有效品牌偏好；不展开任何存储账号对象。
        if (validInstancePreference(enterpriseId)) item.lastEnterpriseId = enterpriseId;
      });
    } catch (error) { /* 无效偏好不覆盖随包默认值。 */ }
  }

  function rememberInstance(enterpriseId) {
    if (!isSuper() || !validInstancePreference(enterpriseId)) return false;
    account().lastEnterpriseId = enterpriseId;
    const lastInstanceByAccount = {};
    (data().accounts || []).filter(item => builtInAccountIds.has(item.accountId) && validInstancePreference(item.lastEnterpriseId)).forEach(item => {
      lastInstanceByAccount[item.accountId] = item.lastEnterpriseId;
    });
    // 与身份快照分离的最小偏好记录，不保存密码、角色、builtIn 或成员权限。
    sessionStorage.setItem(preferenceStorageKey, JSON.stringify({ version: 1, lastInstanceByAccount }));
    return true;
  }

  function isBusinessTenant(tenant) {
    return !!tenant && tenant.builtIn !== true && tenant.tenantId !== 'TENANT-SUPER-BUILTIN';
  }

  function tenantForEnterprise(enterpriseId) {
    const tenants = (data().tenants || []).filter(tenant => isBusinessTenant(tenant) && tenant.enterpriseId === enterpriseId);
    return tenants.length === 1 ? tenants[0] : null;
  }

  function tenantHasBusinessData(tenant) {
    if (!tenant?.tenantId) return false;
    if (tenant.hasBusinessData) return true;
    const linked = row => row && (row.tenantId === tenant.tenantId ||
      ['tenantIds', 'authorizedTenantIds', 'localTenantIds'].some(field => Array.isArray(row[field]) && row[field].includes(tenant.tenantId)));
    if (['agents', 'seats', 'callPlans', 'tasks', 'predictiveTasks', 'ivrTasks', 'calls', 'physicalSkillGroups', 'phoneNumbers', 'queues', 'timeConditions', 'extensions'].some(key => (data()[key] || []).some(linked))) return true;
    // 未提交的演示草稿同样持有租户与资源引用，不能在迁移后留下悬空引用。
    if ([
      ['sessionStorage', 'cloud-task-wizard-drafts-v1'],
      ['sessionStorage', 'cloud-task-created-v1'],
      ['localStorage', 'cloud-task-created-v1']
    ].some(([storageName, key]) => {
      try {
        const raw = window[storageName].getItem(key), rows = raw === null ? [] : JSON.parse(raw);
        return !Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row) || linked(row));
      }
      catch (_) { return true; }
    })) return true;
    // 独立任务记录先于工作区加载即生效；兼容数组丢失时，删除墓碑也仍是业务历史。
    try {
      if (typeof localStorage.key === 'function' && typeof localStorage.length === 'number') {
        for (let index = 0; index < localStorage.length; index++) {
          const key = localStorage.key(index);
          if (!key?.startsWith('cloud-task-record-v1:')) continue;
          const raw = localStorage.getItem(key);
          if (raw === null) continue;
          const row = JSON.parse(raw);
          if (!row || Array.isArray(row) || typeof row.taskId !== 'string' || !row.taskId ||
            !['预外呼', 'IVR 外呼'].includes(row.callType) ||
            typeof row.tenantId !== 'string' || !row.tenantId ||
            typeof row.enterpriseId !== 'string' || !row.enterpriseId || linked(row)) return true;
        }
      }
    } catch (_) { return true; }
    // 目录只读查询使用默认样例，不会保存 scope；实际保存分类、独立字段或号码池后才锁定归属。
    if ([
      ['localStorage', 'customer-business-config-v3', 3, ['types', 'fields']],
      ['sessionStorage', 'alicti-hybrid-groups-v1', 1, ['rows']]
    ].some(([storageName, key, version, collections]) => {
      try {
        const raw = window[storageName].getItem(key);
        if (raw === null) return false;
        const catalog = JSON.parse(raw);
        if (!catalog || Array.isArray(catalog) || catalog.version !== version ||
          !Number.isSafeInteger(catalog.revision) || catalog.revision < 0 || !Array.isArray(catalog.scopes)) return true;
        if (catalog.scopes.some(scope => !scope || Array.isArray(scope) ||
          typeof scope.enterpriseId !== 'string' || !scope.enterpriseId ||
          typeof scope.tenantId !== 'string' || !scope.tenantId ||
          collections.some(field => !Array.isArray(scope[field])))) return true;
        return catalog.scopes.some(linked);
      } catch (_) { return true; }
    })) return true;
    // 独立资源目录也属于业务数据，创建分机、时间条件等之后同样不能改绑。
    const referenced = value => !!value && typeof value === 'object' && (linked(value) ||
      (value.enterpriseId === tenant.enterpriseId && !value.tenantId) || Object.values(value).some(child => child && typeof child === 'object' && referenced(child)));
    return ['alicti-extension-directory-v2', 'alicti-time-conditions-v1', 'alicti-number-import-v1', 'alicti-inbound-router-v1',
      'outbound-groups-v1', 'alicti-queue-bindings-v1', 'skill-groups-v2:' + tenant.enterpriseId,
      'customer-task-batches-v1', 'native-workbench-records-v1'].some(key => {
      try { return referenced(JSON.parse(localStorage.getItem(key) || 'null')); }
      catch (_) { return true; }
    });
  }

  function validateTenantBindings(tenants) {
    if (!Array.isArray(tenants)) return { valid: false, error: '租户数据格式无效' };
    const occupied = new Set();
    for (const tenant of tenants) {
      if (!tenant || typeof tenant !== 'object') return { valid: false, error: '租户数据格式无效' };
      if (!isBusinessTenant(tenant)) continue;
      if (typeof tenant.enterpriseId !== 'string' || !tenant.enterpriseId || !(data().instances || []).some(instance => instance.enterpriseId === tenant.enterpriseId)) return { valid: false, error: '请选择有效的 AliCti 账号' };
      if (occupied.has(tenant.enterpriseId)) return { valid: false, error: '该 AliCti 账号已绑定业务租户；停用租户仍占用绑定' };
      occupied.add(tenant.enterpriseId);
      const previous = (data().tenants || []).find(item => item.tenantId === tenant.tenantId);
      if (previous && previous.enterpriseId !== tenant.enterpriseId && tenantHasBusinessData(previous)) return { valid: false, error: '已有业务数据，不能直接更换 AliCti 账号' };
    }
    return { valid: true, error: '' };
  }

  function restoreManagementData() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(identityStorageKey) || 'null');
      if (!stored || stored.version !== 2 || !['accounts', 'memberships', 'tenants'].every(key => Array.isArray(stored[key]))) return;
      const unique = (rows, field) => rows.every(item => item && typeof item[field] === 'string' && item[field]) && new Set(rows.map(item => item[field])).size === rows.length;
      if (!unique(stored.tenants, 'tenantId') || !unique(stored.accounts, 'accountId') || !unique(stored.accounts, 'loginUsername') || !unique(stored.accounts, 'loginMobile') || !unique(stored.memberships, 'membershipId')) return;
      // 当前管理操作不提供删除；缺失随包对象意味着快照不完整，不能清空或部分覆盖基线。
      if (['accounts', 'memberships', 'tenants'].some((key, index) => {
        const id = ['accountId', 'membershipId', 'tenantId'][index];
        return data()[key].some(item => !stored[key].some(savedItem => savedItem[id] === item[id]));
      })) return;
      const tenants = stored.tenants;
      if (!validateTenantBindings(tenants).valid) return;
      if (!tenants.every(item => isBusinessTenant(item) && typeof item.name === 'string' && ['HEADQUARTERS', 'STORE'].includes(item.organizationScope) &&
        (data().instances || []).some(instance => instance.enterpriseId === item.enterpriseId) && Array.isArray(item.capabilitySet) &&
        item.capabilitySet.includes('CLOUD_CONTACT_CENTER') && ['启用', '停用'].includes(item.status))) return;
      if (!stored.accounts.every(item => typeof item.password === 'string' && /^1\d{10}$/.test(item.loginMobile) && ['启用', '停用'].includes(item.status) &&
        (builtInAccountIds.has(item.accountId) || item.builtIn !== true))) return;
      const accounts = stored.accounts.filter(item => !builtInAccountIds.has(item.accountId)).map(item => ({ ...item, builtIn: false }));
      if (!stored.memberships.every(item => ['启用', '停用'].includes(item.status) && (builtInAccountIds.has(item.accountId)
        ? builtInMembers.some(base => base.membershipId === item.membershipId && base.accountId === item.accountId && base.tenantId === item.tenantId && base.roleCode === item.roleCode)
        : ['ADMIN', 'OPERATOR'].includes(item.roleCode) && accounts.some(account => account.accountId === item.accountId) && tenants.some(tenant => tenant.tenantId === item.tenantId)))) return;
      const members = stored.memberships.filter(item => !builtInAccountIds.has(item.accountId));
      if (new Set(members.map(item => item.accountId + '|' + item.tenantId)).size !== members.length) return;
      data().accounts.splice(0, data().accounts.length, ...data().accounts.filter(item => builtInAccountIds.has(item.accountId)), ...accounts);
      data().memberships.splice(0, data().memberships.length, ...builtInMembers, ...members);
      data().tenants.splice(0, data().tenants.length, ...tenants);
      (data().instances || []).forEach(instance => { const tenant = tenantForEnterprise(instance.enterpriseId); instance.tenantIds = tenant ? [tenant.tenantId] : []; });
    } catch (error) { /* 无效演示快照不覆盖随包数据。 */ }
  }

  function persistManagementData(snapshot = data()) {
    // Forms persist their candidate state before publishing it to shared data.
    const validation = validateTenantBindings(snapshot.tenants);
    if (!validation.valid) throw new Error(validation.error);
    sessionStorage.setItem(identityStorageKey, JSON.stringify({ version: 2, accounts: snapshot.accounts, memberships: snapshot.memberships, tenants: snapshot.tenants }));
    return true;
  }
  const domainMeta = {
    CLOUD_CONTACT_CENTER: { label: '云联络中心', short: '云呼叫', description: '人工外呼接入、预外呼、自动外呼、呼入、坐席与资源运营' }
  };
  const roleLabels = { SUPER_ADMIN: '超级管理员', ADMIN: '租户管理员', OPERATOR: '租户运营' };
  const stages = new Set(['ACCOUNT', 'TENANT', 'INSTANCE', 'READY']);
  let saved = {};
  try { const value = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); saved = value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch (error) { saved = {}; }

  const validProfiles = data().demoProfiles || [];
  const savedProfileValid = validProfiles.some(item => item.profileId === saved.profileId);
  const state = {
    accountId: typeof saved.accountId === 'string' ? saved.accountId : (validProfiles.find(item => item.profileId === saved.profileId)?.accountId || ''),
    sessionId: typeof saved.sessionId === 'string' ? saved.sessionId : '',
    profileId: savedProfileValid ? saved.profileId : '',
    pendingProfileId: savedProfileValid ? saved.profileId : '',
    loginMode: 'password',
    tenantId: typeof saved.tenantId === 'string' ? saved.tenantId : '',
    enterpriseId: typeof saved.enterpriseId === 'string' ? saved.enterpriseId : '',
    activeDomain: saved.authStage === 'READY' ? 'CLOUD_CONTACT_CENTER' : '',
    authStage: stages.has(saved.authStage) ? saved.authStage : 'ACCOUNT',
    currentPage: typeof saved.currentPage === 'string' && !/^(ai-|scene-|result-|report-billing)/.test(saved.currentPage) ? saved.currentPage : 'home',
    returnContext: saved.returnContext && typeof saved.returnContext === 'object' ? saved.returnContext : null,
    hasUnsavedChanges: false,
    environment: 'production'
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function profile() {
    const value = (data().demoProfiles || []).find(item => item.accountId === state.accountId) || {};
    const roleCode = currentRoleCode();
    return { ...value, accountId: state.accountId, userId: state.accountId, roleCode, label: roleLabels[roleCode] || '', roleLabel: roleLabels[roleCode] || '' };
  }

  function pendingProfile() {
    return (data().demoProfiles || []).find(item => item.profileId === state.pendingProfileId) || {};
  }

  function account() {
    return (data().accounts || []).find(item => item.accountId === state.accountId) || {};
  }

  function pendingAccount() {
    return (data().accounts || []).find(item => item.accountId === pendingProfile().accountId) || {};
  }

  function isSuper() {
    return builtInAccountIds.has(state.accountId) && account().builtIn === true && account().status === '启用' &&
      builtInMembers.some(item => item.accountId === state.accountId && (data().memberships || []).some(member => member.membershipId === item.membershipId && member.accountId === state.accountId && member.tenantId === 'TENANT-SUPER-BUILTIN' && member.roleCode === 'SUPER_ADMIN' && member.status === '启用'));
  }

  function memberships() {
    if (!state.accountId || account().status !== '启用' || isSuper()) return [];
    return (data().memberships || []).filter(item => item.accountId === state.accountId && item.status === '启用' && ['ADMIN', 'OPERATOR'].includes(item.roleCode));
  }

  function availableTenants() {
    if (isSuper()) {
      const instance = currentInstance();
      return (data().tenants || []).filter(item => item.status === '启用' && (!instance || item.enterpriseId === instance.enterpriseId));
    }
    const ids = new Set(memberships().map(item => item.tenantId));
    return (data().tenants || []).filter(item => ids.has(item.tenantId) && item.status === '启用');
  }

  function availableInstances() {
    if (isSuper()) return (data().instances || []).filter(item => item.status === 'RUNNING');
    const ids = new Set(availableTenants().map(item => item.enterpriseId));
    return (data().instances || []).filter(item => ids.has(item.enterpriseId) && item.status === 'RUNNING');
  }

  // Selection labels use business tenants. Keep availableTenants() scoped to
  // the active enterprise because it also defines the authorization boundary.
  function managedTenants() {
    const rows = isSuper() ? (data().tenants || []) : availableTenants();
    return rows.filter(tenant => isBusinessTenant(tenant) && tenant.status === '启用' &&
      tenant.capabilitySet?.includes('CLOUD_CONTACT_CENTER') &&
      tenantForEnterprise(tenant.enterpriseId) === tenant &&
      (data().instances || []).some(item => item.enterpriseId === tenant.enterpriseId && item.status === 'RUNNING'));
  }

  function managedTenant() {
    return managedTenants().find(tenant => isSuper() ? tenant.enterpriseId === state.enterpriseId : tenant.tenantId === state.tenantId) || null;
  }

  function tenantScopeLabel(tenant) {
    return tenant ? `${tenant.name}${tenant.organizationLabel ? ' · ' + tenant.organizationLabel : ''}` : '未绑定业务租户';
  }

  function currentInstance() {
    return (data().instances || []).find(item => item.enterpriseId === state.enterpriseId) || null;
  }

  function supplierLabel(instance) {
    return instance ? `${instance.name || instance.brandCustomerName || 'AliCti 账号'} · ${instance.enterpriseId}` : '未选择 AliCti 账号';
  }

  function currentTenant() {
    if (isSuper()) {
      const instance = currentInstance();
      return {
        tenantId: 'TENANT-SUPER-BUILTIN', name: '超级管理租户', organizationScope: 'ALL',
        organizationLabel: '总部与门店', capabilitySet: ['CLOUD_CONTACT_CENTER'], enterpriseId: state.enterpriseId,
        status: instance ? '启用' : '不可用', builtIn: true
      };
    }
    return (data().tenants || []).find(item => item.tenantId === state.tenantId) || null;
  }

  function currentMembership() {
    if (isSuper()) return (data().memberships || []).find(item => item.accountId === state.accountId && item.tenantId === 'TENANT-SUPER-BUILTIN' && item.roleCode === 'SUPER_ADMIN' && item.status === '启用');
    return memberships().find(item => item.tenantId === state.tenantId) || null;
  }

  function currentRoleCode() {
    return currentMembership()?.roleCode || '';
  }

  function availableDomains() {
    return currentTenant()?.capabilitySet?.includes('CLOUD_CONTACT_CENTER') ? ['CLOUD_CONTACT_CENTER'] : [];
  }

  function tenantIdsInScope() {
    if (isSuper()) return availableTenants().map(item => item.tenantId);
    return state.tenantId ? [state.tenantId] : [];
  }

  function ensureContext() {
    if (!state.accountId) return;
    if (isSuper()) {
      const options = availableInstances();
      const restored = state.enterpriseId || account().lastEnterpriseId;
      state.enterpriseId = options.some(item => item.enterpriseId === restored) ? restored : '';
      state.tenantId = 'TENANT-SUPER-BUILTIN';
      return;
    }
    if (!availableTenants().some(item => item.tenantId === state.tenantId)) {
      state.tenantId = '';
      state.enterpriseId = '';
      return;
    }
    state.enterpriseId = currentTenant()?.enterpriseId || '';
  }

  function isReady() { return state.authStage === 'READY'; }

  function effectiveAccess() {
    const tenant = currentTenant();
    const member = currentMembership();
    const instance = currentInstance();
    const validDomain = availableDomains().includes(state.activeDomain);
    const valid = isReady() && account().status === '启用' && !!tenant && tenant.status === '启用' && tenant.enterpriseId === state.enterpriseId && !!member && !!instance && instance.status === 'RUNNING' && validDomain;
    return {
      valid,
      accountId: state.accountId,
      roleCode: member?.roleCode || '',
      roleId: member?.roleCode || '',
      roleLabel: roleLabels[member?.roleCode] || '',
      tenantId: tenant?.tenantId || '',
      tenantType: tenant?.builtIn ? 'built-in' : 'business',
      capabilitySet: tenant?.capabilitySet || [],
      activeDomain: state.activeDomain,
      organizationScope: tenant?.organizationScope || '',
      enterpriseId: instance?.enterpriseId || '',
      enterpriseIds: instance ? [instance.enterpriseId] : [],
      tenantIds: tenantIdsInScope(),
      dataScopeLabel: isSuper()
        ? tenantScopeLabel(managedTenant())
        : `${tenant?.name || '未选择租户'} · ${tenant?.organizationLabel || '组织范围未配置'}`
    };
  }

  function hasCapability(capability) { return availableDomains().includes(capability); }

  function canMenu(permission) {
    if (permission === 'system.exceptions') return false;
    // Global account recovery remains reachable when every supplier account is stopped.
    if (permission === 'system.instances') return isReady() && isSuper();
    if (!effectiveAccess().valid) return false;
    const role = currentRoleCode();
    if (permission === 'system.events') return isSuper() && state.activeDomain === 'CLOUD_CONTACT_CENTER';
    if (!permission || permission === 'home') return true;
    if (permission === 'business.tasks') return hasCapability('CLOUD_CONTACT_CENTER');
    if (permission.startsWith('ai.')) return false;
    if (permission.startsWith('cloud.')) return hasCapability('CLOUD_CONTACT_CENTER');
    if (permission.startsWith('records.') || permission.startsWith('reports.')) {
      if (permission.endsWith('.ai')) return false;
      if (permission.endsWith('.cloud')) return hasCapability('CLOUD_CONTACT_CENTER');
      return true;
    }
    if (role === 'OPERATOR') return false;
    if (permission === 'accounts' || permission === 'tenants') return true;
    if (permission.startsWith('agents.') || permission.startsWith('settings.')) return hasCapability('CLOUD_CONTACT_CENTER');
    if (permission === 'resources.extensions') return hasCapability('CLOUD_CONTACT_CENTER') && ['ADMIN', 'SUPER_ADMIN'].includes(role);
    if (permission.startsWith('resources.')) return isSuper();
    if (permission.startsWith('system.')) return role !== 'OPERATOR';
    return isSuper();
  }

  function canAction(permission) {
    if (permission === 'instance.manage') return isReady() && isSuper();
    if (!effectiveAccess().valid) return false;
    const role = currentRoleCode();
    if (permission.startsWith('ai.')) return false;
    if (permission === 'tenant.view') return role === 'SUPER_ADMIN' || role === 'ADMIN';
    if (permission === 'tenant.manage') return isSuper();
    if (permission === 'customer.import') return role === 'ADMIN' && hasCapability('CLOUD_CONTACT_CENTER');
    if (isSuper()) return true;
    if (role === 'ADMIN') {
      return !['instance.switch', 'instance.manage', 'line.manage', 'number.manage', 'skill.template.manage', 'business-system.manage'].includes(permission);
    }
    return ['task.create', 'task.start', 'task.pause', 'task.resume', 'task.abort', 'recording.play', 'report.export'].includes(permission);
  }

  function authorizeObject(permission, object) {
    if (!effectiveAccess().valid || !object) return false;
    if (object.enterpriseId && object.enterpriseId !== state.enterpriseId) return false;
    if (isSuper()) return !object.tenantId || tenantIdsInScope().includes(object.tenantId);
    return !object.tenantId || object.tenantId === state.tenantId;
  }

  function canSensitive(permission) { return currentRoleCode() !== 'OPERATOR' && permission !== 'number.plain'; }

  function persist() {
    sessionStorage.setItem(storageKey, JSON.stringify({
      accountId: state.accountId,
      sessionId: state.sessionId,
      profileId: state.profileId,
      pendingProfileId: state.pendingProfileId,
      tenantId: state.tenantId,
      enterpriseId: state.enterpriseId,
      activeDomain: state.activeDomain,
      authStage: state.authStage,
      currentPage: state.currentPage,
      returnContext: state.returnContext
    }));
  }

  function snapshot() {
    ensureContext();
    return {
      ...state,
      roleCode: currentRoleCode(),
      roleLabel: roleLabels[currentRoleCode()] || '',
      profile: profile(), account: account(), tenant: currentTenant(), instance: currentInstance(),
      domains: availableDomains(), activeDomainLabel: domainMeta[state.activeDomain]?.label || '',
      dataScope: effectiveAccess().dataScopeLabel
    };
  }

  function stageCopy() {
    return `<div class="auth-progress"><span class="${state.authStage === 'ACCOUNT' ? 'active' : 'done'}">1 认证</span><i></i><span class="${state.authStage === 'TENANT' || state.authStage === 'INSTANCE' ? 'active' : (state.authStage === 'READY' ? 'done' : '')}">2 工作范围</span></div>`;
  }

  function setLoginMode(mode) {
    if (!['password', 'mobile'].includes(mode)) return false;
    state.loginMode = mode;
    renderAuthGateway();
    return true;
  }

  function passwordLoginFields() {
    return `<div class="auth-method-form">
      <label class="auth-field"><span>账号</span><input id="authUsername" value="super-product" autocomplete="username" placeholder="请输入账号"></label>
      <label class="auth-field"><span>密码</span><input id="authPassword" type="password" value="123456Aa@" autocomplete="current-password" placeholder="请输入密码"></label>
      <div class="auth-captcha-row">
        <label class="auth-field"><span>图形验证码</span><input id="authCaptcha" value="a8Cq" maxlength="4" placeholder="请输入图形验证码"></label>
        <button class="auth-captcha-code" type="button" onclick="AppState.refreshCaptcha()" title="点击刷新验证码"><span>a</span><b>8</b><em>C</em><i>q</i></button>
      </div>
      <button class="auth-primary" type="button" onclick="AppState.submitLogin()">登录</button>
      <p class="auth-demo-tip">演示账号：super-product　密码：123456Aa@　验证码：a8Cq</p>
    </div>`;
  }

  function mobileLoginFields() {
    return `<div class="auth-method-form">
      <label class="auth-field"><span>手机号</span><input id="authMobile" inputmode="numeric" value="15975585393" maxlength="11" autocomplete="tel" placeholder="请输入手机号码"></label>
      <div class="auth-sms-row">
        <label class="auth-field"><span>短信验证码</span><input id="authSmsCode" inputmode="numeric" value="8866" maxlength="6" autocomplete="one-time-code" placeholder="请输入短信验证码"></label>
        <button class="auth-sms-button" type="button" onclick="AppState.sendSmsCode()">获取验证码</button>
      </div>
      <button class="auth-primary" type="button" onclick="AppState.submitLogin()">登录</button>
      <p class="auth-demo-tip">演示手机号：15975585393　验证码：8866</p>
    </div>`;
  }

  function renderAccountStep() {
    return `<div class="auth-card auth-login-card">
      ${stageCopy()}
      <div class="auth-card-heading"><span>云外呼平台</span><h1>欢迎登录</h1><p>角色由认证账号在所选租户内的成员关系确定。</p></div>
      <div class="auth-method-tabs" role="tablist">
        <button type="button" role="tab" aria-selected="${state.loginMode === 'password'}" class="${state.loginMode === 'password' ? 'active' : ''}" onclick="AppState.setLoginMode('password')">账号密码登录</button>
        <button type="button" role="tab" aria-selected="${state.loginMode === 'mobile'}" class="${state.loginMode === 'mobile' ? 'active' : ''}" onclick="AppState.setLoginMode('mobile')">手机号登录</button>
      </div>
      ${state.loginMode === 'mobile' ? mobileLoginFields() : passwordLoginFields()}
      ${window.DemoSwitch?.loginShortcut() || ''}
      <p class="auth-footnote">静态业务原型，不连接真实账号、AliCti或生产数据。</p>
    </div>`;
  }

  function renderTenantStep() {
    const rows = availableTenants();
    return `<div class="auth-card auth-choice-card">
      ${stageCopy()}
      <div class="auth-card-heading"><span>${esc(account().nickname || account().name)}</span><h1>选择本次进入的租户</h1><p>一次会话只激活一个租户及该租户内唯一角色；更换租户需退出后重新登录。</p></div>
      <div class="auth-choice-list">${rows.map(row => {
        const member = memberships().find(item => item.tenantId === row.tenantId) || {};
        return `<button type="button" class="auth-choice-row" onclick="AppState.chooseTenant('${esc(row.tenantId)}')"><span class="auth-choice-icon">${row.organizationScope === 'HEADQUARTERS' ? '总' : '店'}</span><div><strong>${esc(row.name)}</strong><small>${esc(row.organizationLabel)} · ${esc(roleLabels[member.roleCode] || member.roleCode)} · ${(row.capabilitySet || []).map(domain => domainMeta[domain]?.label).filter(Boolean).join(' / ')}</small></div><em>进入选择</em></button>`;
      }).join('')}</div>
      <button class="auth-link" type="button" onclick="AppState.backToLogin()">返回账号登录</button>
    </div>`;
  }

  function renderInstanceStep() {
    const tenants = managedTenants();
    return `<div class="auth-card auth-choice-card">
      ${stageCopy()}
      <div class="auth-card-heading"><span>超级管理员</span><h1>选择本次管理的租户</h1><p>选择租户后，查看该租户的任务、资源和统计。</p></div>
      <div class="auth-choice-list">${tenants.map(row => `<button type="button" class="auth-choice-row" onclick="AppState.chooseManagedTenant('${esc(row.tenantId)}')"><span class="auth-choice-icon">${row.organizationScope === 'HEADQUARTERS' ? '总' : '店'}</span><div><strong>${esc(row.name)}</strong><small>${esc(row.organizationLabel || '业务租户')}</small></div><em>进入管理</em></button>`).join('')}</div>
      ${tenants.length ? '' : '<p>暂无可用业务租户，请先完成接入配置及租户关联。</p>'}
      <button class="btn btn-primary" type="button" onclick="AppState.openSupplierAccounts()">接入配置</button>
      <button class="auth-link" type="button" onclick="AppState.backToLogin()">返回账号登录</button>
    </div>`;
  }

  function renderAuthGateway() {
    const gateway = document.getElementById('authGateway');
    if (!gateway) return;
    const ready = isReady();
    gateway.hidden = ready;
    gateway.setAttribute('aria-hidden', String(ready));
    document.body.classList.toggle('auth-active', !ready);
    if (ready) { gateway.innerHTML = ''; return; }
    const body = state.authStage === 'TENANT' ? renderTenantStep() : state.authStage === 'INSTANCE' ? renderInstanceStep() : renderAccountStep();
    gateway.classList.add('auth-showcase');
    gateway.innerHTML = `<div class="auth-showcase-shell">
      <header class="auth-showcase-header">
        <div class="auth-brand-mark"><i aria-hidden="true"></i><strong>云外呼平台</strong><span>产品原型</span></div>
        <div class="auth-showcase-header-note">AliCti 云联络中心</div>
      </header>
      <main class="auth-showcase-main">
        <section class="auth-showcase-panel" aria-label="产品能力展示">
          <div class="auth-showcase-copy">
            <span class="auth-showcase-eyebrow"><i></i> CUSTOMER ENGAGEMENT PLATFORM</span>
            <h2>让每一次客户联络，<br><em>都有清晰的下一步。</em></h2>
            <p>从客户线索、外呼任务和呼入分配，到坐席处理与数据分析，在同一个平台串起完整业务过程。</p>
          </div>
          <div class="auth-product-preview" aria-label="客户联络流程示意">
            <div class="auth-preview-heading"><span><i></i><i></i><i></i></span><strong>客户联络流程</strong><small>产品能力示意</small></div>
            <div class="auth-preview-flow">
              <div class="auth-preview-step"><span>01</span><b>客户线索</b><small>导入与分类</small></div>
              <div class="auth-preview-arrow" aria-hidden="true">→</div>
              <div class="auth-preview-step"><span>02</span><b>任务触达</b><small>预外呼与自动外呼</small></div>
              <div class="auth-preview-arrow" aria-hidden="true">→</div>
              <div class="auth-preview-step"><span>03</span><b>坐席处理</b><small>呼入接听与跟进</small></div>
              <div class="auth-preview-arrow" aria-hidden="true">→</div>
              <div class="auth-preview-step"><span>04</span><b>结果分析</b><small>通话与线索报表</small></div>
            </div>
            <div class="auth-preview-footer"><span>线索 · 任务 · 通话 · 结果</span><strong>业务过程清晰可追踪 <i aria-hidden="true">↗</i></strong></div>
          </div>
          <div class="auth-capability-row">
            <div><span class="auth-capability-icon cloud">呼</span><strong>呼叫服务</strong><small>预外呼、自动外呼与呼入</small></div>
            <div><span class="auth-capability-icon data">席</span><strong>坐席协同</strong><small>客户联络与通话跟进</small></div>
            <div><span class="auth-capability-icon data">数</span><strong>业务分析</strong><small>通话记录与业务报表</small></div>
          </div>
        </section>
        <div class="auth-form-panel">${body}</div>
      </main>
      <footer class="auth-showcase-footer"><span>云外呼平台 · 产品原型</span><span>按账号与租户进入工作台</span></footer>
    </div>`;
  }

  function renderControls() {
    ensureContext();
    const tenantLabel = document.getElementById('currentTenantLabel');
    const tenantWrap = document.getElementById('tenantContext');
    const roleLabel = document.getElementById('currentRoleLabel');
    const instanceWrap = document.getElementById('instanceContext');
    const instanceSelect = document.getElementById('instanceSwitcher');
    const scopeLabel = document.getElementById('scopeLabel');
    const userLabel = document.getElementById('currentUserLabel');
    const ready = isReady();
    const selectedTenant = managedTenant(), tenantOptions = managedTenants();
    if (tenantLabel) tenantLabel.textContent = ready ? tenantScopeLabel(selectedTenant) : '尚未登录';
    if (tenantWrap) tenantWrap.hidden = ready && isSuper();
    if (roleLabel) roleLabel.textContent = ready ? (roleLabels[currentRoleCode()] || currentRoleCode()) : '—';
    if (instanceWrap) instanceWrap.hidden = !(ready && isSuper());
    if (instanceSelect) {
      instanceSelect.innerHTML = (!selectedTenant ? '<option value="" selected>' + (tenantOptions.length ? '请选择租户' : '暂无可用租户') + '</option>' : '') + tenantOptions.map(item => `<option value="${esc(item.tenantId)}" ${item.tenantId === selectedTenant?.tenantId ? 'selected' : ''}>${esc(tenantScopeLabel(item))}</option>`).join('');
      instanceSelect.disabled = !tenantOptions.length;
      instanceSelect.title = selectedTenant ? tenantScopeLabel(selectedTenant) : '未选择业务租户';
    }
    if (scopeLabel) { scopeLabel.textContent = ready ? effectiveAccess().dataScopeLabel : '请先登录'; scopeLabel.hidden = ready && isSuper(); }
    if (userLabel) userLabel.textContent = ready ? (account().nickname || account().name || profile().label) : '登录';
    document.body.dataset.role = currentRoleCode();
    document.body.dataset.instance = state.enterpriseId || '';
    document.body.dataset.scope = effectiveAccess().organizationScope || '';
    document.body.dataset.domain = state.activeDomain || '';
    document.body.dataset.authStage = state.authStage;
    renderAuthGateway();
  }

  function notify() {
    persist();
    renderControls();
    listeners.slice().forEach(listener => listener(snapshot()));
  }

  function resetContext(keepProfile) {
    window.CloudTaskWorkspace?.clearActiveContext();
    const remembered = keepProfile ? (state.profileId || state.pendingProfileId || '') : '';
    state.accountId = '';
    state.sessionId = '';
    state.profileId = '';
    state.pendingProfileId = remembered;
    state.tenantId = '';
    state.enterpriseId = '';
    state.activeDomain = '';
    state.authStage = 'ACCOUNT';
    state.currentPage = 'home';
    state.hasUnsavedChanges = false;
    state.returnContext = null;
  }

  function selectDemoProfile(profileId) {
    if (!(data().demoProfiles || []).some(item => item.profileId === profileId)) return false;
    state.pendingProfileId = profileId;
    persist();
    renderAuthGateway();
    return true;
  }

  function sendSmsCode() {
    const mobile = document.getElementById('authMobile')?.value.trim() || '';
    if (!/^1\d{10}$/.test(mobile)) {
      showToast('请输入正确的 11 位手机号码', 'warning');
      document.getElementById('authMobile')?.focus();
      return false;
    }
    if (!(data().accounts || []).some(item => item.loginMobile === mobile && item.status === '启用')) {
      showToast('该手机号未关联可用账号', 'warning');
      return false;
    }
    showToast('验证码已发送：8866', 'info');
    return true;
  }

  function refreshCaptcha() {
    showToast('图形验证码已刷新：a8Cq', 'info');
    return true;
  }

  function transitionAfterInstanceOrTenant() {
    if (!availableDomains().length) {
      state.authStage = 'ACCOUNT';
      notify();
      showToast('当前工作范围尚未开通云联络中心，请联系管理员', 'warning');
      return false;
    }
    state.activeDomain = 'CLOUD_CONTACT_CENTER';
    state.authStage = 'READY';
    state.currentPage = 'home';
    notify();
    showToast('已进入云联络中心', 'success');
    return true;
  }

  function openSupplierAccounts() {
    if (!isSuper()) return false;
    if (window.AgentWorkbench && !AgentWorkbench.allowContextChange()) return false;
    state.tenantId = 'TENANT-SUPER-BUILTIN';
    state.activeDomain = 'CLOUD_CONTACT_CENTER';
    state.authStage = 'READY';
    state.currentPage = 'alicti-accounts';
    state.returnContext = null;
    if (location.hash !== '#alicti-accounts') history.replaceState({routeKey:'alicti-accounts'}, '', '#alicti-accounts');
    notify();
    return true;
  }

  function onSupplierAccountsChanged(change = {}) {
    const wasReady = isReady();
    const current = state.enterpriseId;
    if (change.previousEnterpriseId === current && change.enterpriseId && change.enterpriseId !== current) {
      state.enterpriseId = change.enterpriseId;
    }
    if (isSuper()) {
      ensureContext();
      if (wasReady && !effectiveAccess().valid) {
        window.CloudTaskWorkspace?.clearActiveContext();
        state.activeDomain = 'CLOUD_CONTACT_CENTER';
        state.currentPage = 'alicti-accounts';
        state.returnContext = null;
        state.hasUnsavedChanges = false;
        if (location.hash !== '#alicti-accounts') history.replaceState({routeKey:'alicti-accounts'}, '', '#alicti-accounts');
      }
    }
    notify();
  }

  function submitLogin() {
    if (isReady()) return false;
    const accounts = data().accounts || [];
    let selectedAccount = null;
    if (state.loginMode === 'mobile') {
      const mobile = document.getElementById('authMobile')?.value.trim() || '';
      const code = document.getElementById('authSmsCode')?.value.trim() || '';
      if (!mobile) { showToast('请输入手机号码', 'warning'); document.getElementById('authMobile')?.focus(); return false; }
      if (!/^1\d{10}$/.test(mobile)) { showToast('请输入正确的 11 位手机号码', 'warning'); document.getElementById('authMobile')?.focus(); return false; }
      if (!code) { showToast('请输入短信验证码', 'warning'); document.getElementById('authSmsCode')?.focus(); return false; }
      if (code !== '8866') { showToast('短信验证码错误', 'error'); document.getElementById('authSmsCode')?.focus(); return false; }
      selectedAccount = accounts.find(item => item.loginMobile === mobile && item.status === '启用') || null;
      if (!selectedAccount) { showToast('手机号或验证码错误', 'error'); return false; }
    } else {
      const username = document.getElementById('authUsername')?.value.trim() || '';
      const password = document.getElementById('authPassword')?.value || '';
      const captcha = document.getElementById('authCaptcha')?.value.trim() || '';
      if (!username) { showToast('请输入账号', 'warning'); document.getElementById('authUsername')?.focus(); return false; }
      if (!password) { showToast('请输入密码', 'warning'); document.getElementById('authPassword')?.focus(); return false; }
      if (!captcha) { showToast('请输入图形验证码', 'warning'); document.getElementById('authCaptcha')?.focus(); return false; }
      if (captcha.toLowerCase() !== 'a8cq') { showToast('图形验证码错误', 'error'); document.getElementById('authCaptcha')?.focus(); return false; }
      selectedAccount = accounts.find(item => item.loginUsername === username && item.password === password && item.status === '启用') || null;
      if (!selectedAccount) { showToast('账号或密码错误', 'error'); return false; }
    }
    const selected = (data().demoProfiles || []).find(item => item.accountId === selectedAccount.accountId);
    state.accountId = selectedAccount.accountId;
    state.sessionId = crypto.randomUUID();
    state.pendingProfileId = selected?.profileId || '';
    state.profileId = selected?.profileId || '';
    state.tenantId = '';
    state.enterpriseId = '';
    state.activeDomain = '';
    if (isSuper()) {
      const restored = selectedAccount.lastEnterpriseId;
      if (availableInstances().some(item => item.enterpriseId === restored)) state.enterpriseId = restored;
      state.tenantId = 'TENANT-SUPER-BUILTIN';
      if (!availableInstances().length) return openSupplierAccounts();
      if (!state.enterpriseId) { state.authStage = 'INSTANCE'; notify(); return true; }
      return transitionAfterInstanceOrTenant();
    }
    const tenantOptions = availableTenants();
    if (!tenantOptions.length) {
      resetContext(true);
      notify();
      showToast('该账号没有可用租户成员关系', 'error');
      return false;
    }
    if (tenantOptions.length === 1) {
      state.tenantId = tenantOptions[0].tenantId;
      state.enterpriseId = tenantOptions[0].enterpriseId;
      return transitionAfterInstanceOrTenant();
    }
    state.authStage = 'TENANT';
    notify();
    return true;
  }

  function chooseTenant(tenantId) {
    if (state.authStage !== 'TENANT' || isSuper()) return false;
    const tenant = availableTenants().find(item => item.tenantId === tenantId);
    if (!tenant) return false;
    state.tenantId = tenantId;
    state.enterpriseId = tenant.enterpriseId;
    return transitionAfterInstanceOrTenant();
  }

  function chooseInstance(enterpriseId) {
    if (!isSuper() || state.authStage !== 'INSTANCE' || !availableInstances().some(item => item.enterpriseId === enterpriseId)) return false;
    state.enterpriseId = enterpriseId;
    state.tenantId = 'TENANT-SUPER-BUILTIN';
    rememberInstance(enterpriseId);
    return transitionAfterInstanceOrTenant();
  }

  function chooseManagedTenant(tenantId) {
    if (!isSuper() || state.authStage !== 'INSTANCE') return false;
    const tenant = managedTenants().find(item => item.tenantId === tenantId);
    return !!tenant && chooseInstance(tenant.enterpriseId);
  }

  function setManagedTenant(tenantId) {
    if (!isSuper() || !isReady()) return false;
    const tenant = managedTenants().find(item => item.tenantId === tenantId);
    if (!tenant) { renderControls(); return false; }
    return setInstance(tenant.enterpriseId);
  }

  function setInstance(enterpriseId) {
    if (enterpriseId === state.enterpriseId && isReady() && isSuper() && validInstancePreference(enterpriseId)) return true;
    if (window.AgentWorkbench && !AgentWorkbench.allowContextChange()) { renderControls(); return false; }
    if (!isReady() || !isSuper() || !availableInstances().some(item => item.enterpriseId === enterpriseId)) return false;
    if (state.hasUnsavedChanges) { showToast('请先保存或关闭当前编辑内容，再切换租户', 'warning'); renderControls(); return false; }
    window.CloudTaskWorkspace?.clearActiveContext();
    state.returnContext = null;
    state.enterpriseId = enterpriseId;
    state.tenantId = 'TENANT-SUPER-BUILTIN';
    rememberInstance(enterpriseId);
    state.activeDomain = 'CLOUD_CONTACT_CENTER';
    state.currentPage = 'home';
    if (location.hash !== '#home') history.replaceState({ routeKey: 'home' }, '', '#home');
    notify();
    showToast(managedTenant() ? `已切换至 ${tenantScopeLabel(managedTenant())}` : '已进入接入配置范围，尚未绑定业务租户', 'success');
    return true;
  }

  function setTenant(tenantId) {
    if (state.authStage === 'TENANT') return chooseTenant(tenantId);
    if (isReady()) showToast('会话内不能切换租户，请退出后重新登录', 'warning');
    return false;
  }

  function setProfile(profileId) {
    if (window.AgentWorkbench && !AgentWorkbench.allowContextChange()) return false;
    resetContext(false);
    state.pendingProfileId = profileId;
    notify();
    return true;
  }

  function logout(showMessage = true) {
    if (window.AgentWorkbench && !AgentWorkbench.allowContextChange()) return false;
    resetContext(true);
    sessionStorage.removeItem(storageKey);
    history.replaceState({}, '', location.pathname + location.search);
    notify();
    if (showMessage) showToast('已退出当前租户，请重新登录', 'info');
    return true;
  }

  function backToLogin() { return logout(false); }
  function setCurrentPage(page) { state.currentPage = page; persist(); }
  function setDirty(value) { state.hasUnsavedChanges = !!value; persist(); }
  function beginConfiguration(route, context) {
    if (!isReady() || !route) return false;
    state.returnContext = { ...(context || {}), targetRoute: route, openedAt: new Date().toISOString() };
    persist();
    return window.RouteRuntime ? RouteRuntime.openSecondary(route) : false;
  }
  function getReturnContext(route) {
    if (!state.returnContext) return null;
    if (route && state.returnContext.targetRoute !== route) return null;
    return { ...state.returnContext };
  }
  function returnFromConfiguration(completed) {
    const context = state.returnContext ? { ...state.returnContext } : null;
    if (!context) return false;
    if (completed) {
      const eventName = context.contextType === 'wizard' ? 'wizard:configuration-complete' : 'scenario:configuration-complete';
      window.dispatchEvent(new CustomEvent(eventName, { detail: context }));
    }
    state.returnContext = null;
    persist();
    const options = context.returnOptions || { scenario: context.scenarioType, tenantId: context.tenantId };
    if (window.RouteRuntime?.secondaryDepth()) return RouteRuntime.back({ refresh: true });
    return window.navigateTo ? window.navigateTo(context.fromRoute || 'scenario-readiness', options) : false;
  }
  function clearReturnContext() { state.returnContext = null; persist(); }
  function scoped(rows) { return (rows || []).filter(item => authorizeObject('', item)); }

  ensureContext();
  if (state.accountId && account().status !== '启用') resetContext(true);
  else if (state.authStage === 'READY' && !effectiveAccess().valid) {
    if (isSuper()) { state.activeDomain='CLOUD_CONTACT_CENTER'; state.currentPage='alicti-accounts'; state.returnContext=null; }
    else resetContext(true);
  }

  window.AppState = {
    get: snapshot, profile, account, currentTenant, currentInstance, tenantForEnterprise, tenantHasBusinessData, validateTenantBindings, availableTenants, availableInstances, availableDomains, managedTenants, managedTenant,
    effectiveAccess, isSuper, isReady, isBusinessContext: () => effectiveAccess().valid, isPlatformInternal: () => isSuper(),
    hasCapability, canMenu, canAction, canSensitive, authorizeObject, scoped,
    selectDemoProfile, setLoginMode, sendSmsCode, refreshCaptcha, submitLogin, chooseTenant, chooseInstance, chooseManagedTenant,
    setProfile, setPerspective: setProfile, setTenant, setInstance, setManagedTenant, setDirty,
    beginConfiguration, getReturnContext, returnFromConfiguration, clearReturnContext, logout, backToLogin,
    setEnvironment: () => false, setCurrentPage,
    subscribe(listener) { if (typeof listener === 'function') listeners.push(listener); },
    renderControls, notify, domainMeta, persistManagementData, supplierLabel, openSupplierAccounts, onSupplierAccountsChanged
  };

  window.openDemoSettings = function () { logout(false); };
  document.addEventListener('DOMContentLoaded', renderControls);
  window.addEventListener('cloudcall:datachange', notify);
})();
