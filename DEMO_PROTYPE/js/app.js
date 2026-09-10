/** 统一登录、租户、业务域、角色与客户/品牌工作上下文。 */
(function () {
  'use strict';

  const data = () => window.CloudCallData || {};
  const listeners = [];
  const storageKey = 'unified-call-context-v3';
  const identityStorageKey = 'unified-call-demo-identities-v1';
  const preferenceStorageKey = 'unified-call-demo-preferences-v1';
  // 仅保存本标签页的演示管理数据，不是真实认证或后端权限存储。
  // 内置账号/超管成员来自随包基线，普通账号不能通过恢复快照变成超管。
  const builtInAccountIds = new Set((data().accounts || []).filter(item => item.builtIn === true).map(item => item.accountId));
  const builtInMembers = (data().memberships || []).filter(item => builtInAccountIds.has(item.accountId) && item.tenantId === 'TENANT-SUPER-BUILTIN' && item.roleCode === 'SUPER_ADMIN');
  restoreManagementData();
  restoreInstancePreferences();

  function validInstancePreference(instanceId) {
    return typeof instanceId === 'string' && (data().instances || []).some(item => item.instanceId === instanceId && item.status === 'RUNNING');
  }

  function restoreInstancePreferences() {
    try {
      const savedPreferences = JSON.parse(sessionStorage.getItem(preferenceStorageKey) || 'null');
      if (!savedPreferences || savedPreferences.version !== 1 || !savedPreferences.lastInstanceByAccount || typeof savedPreferences.lastInstanceByAccount !== 'object' || Array.isArray(savedPreferences.lastInstanceByAccount)) return;
      (data().accounts || []).filter(item => builtInAccountIds.has(item.accountId)).forEach(item => {
        const instanceId = savedPreferences.lastInstanceByAccount[item.accountId];
        // 唯一允许恢复的内置账号字段是有效品牌偏好；不展开任何存储账号对象。
        if (validInstancePreference(instanceId)) item.lastInstanceId = instanceId;
      });
    } catch (error) { /* 无效偏好不覆盖随包默认值。 */ }
  }

  function rememberInstance(instanceId) {
    if (!isSuper() || !validInstancePreference(instanceId)) return false;
    account().lastInstanceId = instanceId;
    const lastInstanceByAccount = {};
    (data().accounts || []).filter(item => builtInAccountIds.has(item.accountId) && validInstancePreference(item.lastInstanceId)).forEach(item => {
      lastInstanceByAccount[item.accountId] = item.lastInstanceId;
    });
    // 与身份快照分离的最小偏好记录，不保存密码、角色、builtIn 或成员权限。
    sessionStorage.setItem(preferenceStorageKey, JSON.stringify({ version: 1, lastInstanceByAccount }));
    return true;
  }

  function restoreManagementData() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(identityStorageKey) || 'null');
      if (!stored || stored.version !== 1 || !['accounts', 'memberships', 'tenants'].every(key => Array.isArray(stored[key]))) return;
      // Add only the corrected demo identity to older snapshots. Preserve all
      // user-created accounts, edited roles/statuses and tenant configuration.
      const chenSeed = data().accounts.find(a => a.accountId === 'ACC-OPS-CHEN');
      if (chenSeed && !stored.accounts.some(a => a.accountId === chenSeed.accountId) &&
          !stored.accounts.some(a => a.loginUsername === chenSeed.loginUsername || a.loginMobile === chenSeed.loginMobile) &&
          stored.tenants.some(t => t.tenantId === 'TEN-NISSAN-HQ')) {
        stored.accounts.push({ ...chenSeed });
        if (!stored.memberships.some(m => m.membershipId === 'MEM-HQ-CHEN')) stored.memberships.push({ ...data().memberships.find(m => m.membershipId === 'MEM-HQ-CHEN') });
      }
      const unique = (rows, field) => rows.every(item => item && typeof item[field] === 'string' && item[field]) && new Set(rows.map(item => item[field])).size === rows.length;
      if (!unique(stored.tenants, 'tenantId') || !unique(stored.accounts, 'accountId') || !unique(stored.accounts, 'loginUsername') || !unique(stored.accounts, 'loginMobile') || !unique(stored.memberships, 'membershipId')) return;
      // 当前管理操作不提供删除；缺失随包对象意味着快照不完整，不能清空或部分覆盖基线。
      if (['accounts', 'memberships', 'tenants'].some((key, index) => {
        const id = ['accountId', 'membershipId', 'tenantId'][index];
        return data()[key].some(item => !['ACC-OPS-CHEN', 'MEM-HQ-CHEN'].includes(item[id]) && !stored[key].some(savedItem => savedItem[id] === item[id]));
      })) return;
      const tenants = stored.tenants;
      if (!tenants.every(item => item.tenantId !== 'TENANT-SUPER-BUILTIN' && typeof item.name === 'string' &&
        (data().instances || []).some(instance => instance.instanceId === item.instanceId) && Array.isArray(item.capabilitySet) &&
        item.capabilitySet.length > 0 && item.capabilitySet.every(domain => ['AI_OUTBOUND', 'CLOUD_CONTACT_CENTER'].includes(domain)) && ['启用', '停用'].includes(item.status))) return;
      if (!stored.accounts.every(item => typeof item.password === 'string' && /^1\d{10}$/.test(item.loginMobile) && ['启用', '停用'].includes(item.status) &&
        (builtInAccountIds.has(item.accountId) || item.builtIn !== true))) return;
      const accounts = stored.accounts.filter(item => !builtInAccountIds.has(item.accountId)).map(item => ({ ...item, builtIn: false }));
      const oldAdmin = accounts.find(a => a.accountId === 'ACC-ADMIN-018');
      if (oldAdmin?.linkedIdentityId === 'CCI-N-001') delete oldAdmin.linkedIdentityId;
      if (!stored.memberships.every(item => ['启用', '停用'].includes(item.status) && (builtInAccountIds.has(item.accountId)
        ? builtInMembers.some(base => base.membershipId === item.membershipId && base.accountId === item.accountId && base.tenantId === item.tenantId && base.roleCode === item.roleCode)
        : ['ADMIN', 'OPERATOR'].includes(item.roleCode) && accounts.some(account => account.accountId === item.accountId) && tenants.some(tenant => tenant.tenantId === item.tenantId)))) return;
      const members = stored.memberships.filter(item => !builtInAccountIds.has(item.accountId));
      if (new Set(members.map(item => item.accountId + '|' + item.tenantId)).size !== members.length) return;
      data().accounts.splice(0, data().accounts.length, ...data().accounts.filter(item => builtInAccountIds.has(item.accountId)), ...accounts);
      data().memberships.splice(0, data().memberships.length, ...builtInMembers, ...members);
      data().tenants.splice(0, data().tenants.length, ...tenants);
      (data().instances || []).forEach(instance => { instance.tenantIds = tenants.filter(tenant => tenant.instanceId === instance.instanceId).map(tenant => tenant.tenantId); });
    } catch (error) { /* 无效演示快照不覆盖随包数据。 */ }
  }

  function persistManagementData() {
    sessionStorage.setItem(identityStorageKey, JSON.stringify({ version: 1, accounts: data().accounts, memberships: data().memberships, tenants: data().tenants }));
  }
  const domainMeta = {
    AI_OUTBOUND: { label: '智能外呼', short: 'AI 外呼', description: '外呼任务、拦截、通道、场景、标签、记录与原有统计报表' },
    CLOUD_CONTACT_CENTER: { label: '云联络中心', short: '云呼叫', description: '人工外呼接入、预外呼、IVR 外呼、呼入、坐席与资源运营' }
  };
  const roleLabels = { SUPER_ADMIN: '超级管理员', ADMIN: '租户管理员', OPERATOR: '租户运营' };
  const stages = new Set(['ACCOUNT', 'TENANT', 'INSTANCE', 'DOMAIN', 'READY']);
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
    instanceId: typeof saved.instanceId === 'string' ? saved.instanceId : '',
    activeDomain: typeof saved.activeDomain === 'string' ? saved.activeDomain : '',
    authStage: stages.has(saved.authStage) ? saved.authStage : 'ACCOUNT',
    currentPage: typeof saved.currentPage === 'string' ? saved.currentPage : 'home',
    returnContext: saved.returnContext && typeof saved.returnContext === 'object' ? saved.returnContext : null,
    hasUnsavedChanges: false,
    pendingDomainSwitch: '',
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
      return (data().tenants || []).filter(item => item.status === '启用' && (!instance || item.instanceId === instance.instanceId));
    }
    const ids = new Set(memberships().map(item => item.tenantId));
    return (data().tenants || []).filter(item => ids.has(item.tenantId) && item.status === '启用');
  }

  function availableInstances() {
    if (isSuper()) return (data().instances || []).filter(item => item.status === 'RUNNING');
    const ids = new Set(availableTenants().map(item => item.instanceId));
    return (data().instances || []).filter(item => ids.has(item.instanceId) && item.status === 'RUNNING');
  }

  function currentInstance() {
    return (data().instances || []).find(item => item.instanceId === state.instanceId) || null;
  }

  function currentTenant() {
    if (isSuper()) {
      const instance = currentInstance();
      const capabilities = [...new Set(availableTenants().flatMap(item => item.capabilitySet || []))];
      return {
        tenantId: 'TENANT-SUPER-BUILTIN', name: '超级管理租户', organizationScope: 'ALL',
        organizationLabel: '总部与门店', capabilitySet: capabilities, instanceId: state.instanceId,
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
    return (currentTenant()?.capabilitySet || []).filter(domain => domainMeta[domain]);
  }

  function tenantIdsInScope() {
    if (isSuper()) return availableTenants().map(item => item.tenantId);
    return state.tenantId ? [state.tenantId] : [];
  }

  function providerAccountIds() {
    const ids = tenantIdsInScope();
    const capabilityIds = (data().capabilityGrants || [])
      .filter(item => ids.includes(item.tenantId) && item.status === '生效中' && (item.sceneScope || []).includes('AI外呼'))
      .map(item => item.capabilityId);
    return (data().capabilities || []).filter(item => capabilityIds.includes(item.capabilityId)).map(item => item.resourceId);
  }

  function ensureContext() {
    if (!state.accountId) return;
    if (isSuper()) {
      const options = availableInstances();
      const restored = state.instanceId || account().lastInstanceId;
      state.instanceId = options.some(item => item.instanceId === restored) ? restored : '';
      state.tenantId = 'TENANT-SUPER-BUILTIN';
      return;
    }
    if (!availableTenants().some(item => item.tenantId === state.tenantId)) {
      state.tenantId = '';
      state.instanceId = '';
      return;
    }
    state.instanceId = currentTenant()?.instanceId || '';
  }

  function isReady() { return state.authStage === 'READY'; }

  function effectiveAccess() {
    const tenant = currentTenant();
    const member = currentMembership();
    const instance = currentInstance();
    const validDomain = availableDomains().includes(state.activeDomain);
    const valid = isReady() && account().status === '启用' && !!tenant && tenant.status === '启用' && tenant.instanceId === state.instanceId && !!member && !!instance && instance.status === 'RUNNING' && validDomain;
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
      instanceId: instance?.instanceId || '',
      instanceIds: instance ? [instance.instanceId] : [],
      tenantIds: tenantIdsInScope(),
      providerAccountIds: providerAccountIds(),
      dataScopeLabel: isSuper()
        ? `${instance?.brandCustomerName || '未选择客户/品牌'} · 当前客户/品牌全部总部与门店`
        : `${tenant?.name || '未选择租户'} · ${tenant?.organizationLabel || '组织范围未配置'}`
    };
  }

  function hasCapability(capability) { return availableDomains().includes(capability); }

  function canMenu(permission) {
    if (permission === 'system.exceptions') return false;
    if (!effectiveAccess().valid) return false;
    const role = currentRoleCode();
    if (permission === 'system.instances') return false;
    if (permission === 'system.events') return isSuper() && state.activeDomain === 'CLOUD_CONTACT_CENTER';
    if (!permission || permission === 'home') return true;
    if (permission === 'business.accounts') return role === 'ADMIN' && state.activeDomain === 'CLOUD_CONTACT_CENTER';
    if (permission === 'business.tasks') return hasCapability('AI_OUTBOUND') || hasCapability('CLOUD_CONTACT_CENTER');
    if (permission === 'ai.settings') return hasCapability('AI_OUTBOUND') && role !== 'OPERATOR';
    if (permission.startsWith('ai.')) return hasCapability('AI_OUTBOUND');
    if (permission.startsWith('cloud.')) return hasCapability('CLOUD_CONTACT_CENTER');
    if (permission.startsWith('records.') || permission.startsWith('reports.')) {
      if (permission.endsWith('.ai')) return hasCapability('AI_OUTBOUND');
      if (permission.endsWith('.cloud')) return hasCapability('CLOUD_CONTACT_CENTER');
      return true;
    }
    if (role === 'OPERATOR') return false;
    if (permission === 'accounts' || permission === 'tenants') return true;
    if (permission.startsWith('agents.') || permission.startsWith('settings.')) return hasCapability('CLOUD_CONTACT_CENTER');
    if (permission.startsWith('resources.')) return isSuper();
    if (permission === 'system.businessSystems') return isSuper();
    if (permission.startsWith('system.')) return role !== 'OPERATOR';
    return isSuper();
  }

  function canAction(permission) {
    if (!effectiveAccess().valid) return false;
    const role = currentRoleCode();
    if (permission === 'ai.billing.manage') return isSuper() && state.activeDomain === 'AI_OUTBOUND' && hasCapability('AI_OUTBOUND');
    if (permission === 'tenant.view') return role === 'SUPER_ADMIN' || role === 'ADMIN';
    if (permission === 'tenant.manage') return isSuper();
    if (isSuper()) return true;
    if (role === 'ADMIN') {
      return !['instance.switch', 'instance.manage', 'line.manage', 'number.manage', 'skill.template.manage', 'business-system.manage'].includes(permission);
    }
    return ['task.create', 'task.start', 'task.pause', 'task.resume', 'task.abort', 'recording.play', 'report.export', 'ai.task.manage'].includes(permission);
  }

  function authorizeObject(permission, object) {
    if (!effectiveAccess().valid || !object) return false;
    if (object.instanceId && object.instanceId !== state.instanceId) return false;
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
      instanceId: state.instanceId,
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
    return `<div class="auth-progress"><span class="${state.authStage === 'ACCOUNT' ? 'active' : 'done'}">1 认证</span><i></i><span class="${state.authStage === 'TENANT' || state.authStage === 'INSTANCE' ? 'active' : (['DOMAIN', 'READY'].includes(state.authStage) ? 'done' : '')}">2 工作范围</span><i></i><span class="${state.authStage === 'DOMAIN' ? 'active' : (state.authStage === 'READY' ? 'done' : '')}">3 业务域</span></div>`;
  }

  function setLoginMode(mode) {
    if (!['password', 'mobile'].includes(mode)) return false;
    state.loginMode = mode;
    renderAuthGateway();
    return true;
  }

  function passwordLoginFields() {
    return `<div class="auth-method-form" data-anno="login-password-form" data-anno-page="login" data-anno-label="账号密码登录" data-anno-kind="region" data-anno-fields="FLD-002,FLD-003,FLD-004">
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
    return `<div class="auth-method-form" data-anno="login-mobile-form" data-anno-page="login" data-anno-label="手机号验证码登录" data-anno-kind="region" data-anno-fields="FLD-005,FLD-006">
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
    return `<div class="auth-card auth-login-card" data-anno="login-auth-card" data-anno-page="login" data-anno-label="原智能外呼双方式登录入口" data-anno-kind="region" data-anno-fields="FLD-001,FLD-002,FLD-003,FLD-004,FLD-005,FLD-006">
      ${stageCopy()}
      <div class="auth-card-heading"><span>统一外呼中台</span><h1>欢迎登录</h1><p>继承智能外呼现有登录方式；角色由认证账号在所选租户内的成员关系确定。</p></div>
      <div class="auth-method-tabs" role="tablist" data-anno="login-auth-methods" data-anno-page="login" data-anno-label="登录方式切换" data-anno-kind="region" data-anno-fields="FLD-001">
        <button type="button" role="tab" aria-selected="${state.loginMode === 'password'}" class="${state.loginMode === 'password' ? 'active' : ''}" onclick="AppState.setLoginMode('password')">账号密码登录</button>
        <button type="button" role="tab" aria-selected="${state.loginMode === 'mobile'}" class="${state.loginMode === 'mobile' ? 'active' : ''}" onclick="AppState.setLoginMode('mobile')">手机号登录</button>
      </div>
      ${state.loginMode === 'mobile' ? mobileLoginFields() : passwordLoginFields()}
      ${window.DemoSwitch?.loginShortcut() || ''}
      <p class="auth-footnote">静态业务原型，不连接真实账号、阿里云或生产数据。</p>
    </div>`;
  }

  function renderTenantStep() {
    const rows = availableTenants();
    return `<div class="auth-card auth-choice-card" data-anno-page="tenant-select" data-anno-label="多租户登录选择" data-anno-kind="region" data-anno-fields="FLD-002,FLD-003,FLD-004,FLD-006">
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
    return `<div class="auth-card auth-choice-card" data-anno-page="instance-select" data-anno-label="超级管理员当前客户品牌选择" data-anno-kind="region" data-anno-fields="FLD-006,FLD-007,FLD-008">
      ${stageCopy()}
      <div class="auth-card-heading"><span>超级管理员</span><h1>选择客户/品牌</h1><p>选择本次要管理的客户或品牌，进入后仅查看该范围内的租户、任务、资源和统计。</p></div>
      <div class="auth-choice-list">${availableInstances().map(row => `<button type="button" class="auth-choice-row" onclick="AppState.chooseInstance('${esc(row.instanceId)}')"><span class="auth-choice-icon">客</span><div><strong>${esc(row.brandCustomerName)}</strong><small>${esc(row.name)} · ${esc(row.region)} · ${esc(row.statusLabel)}</small></div><em>进入管理</em></button>`).join('')}</div>
      <button class="auth-link" type="button" onclick="AppState.backToLogin()">返回账号登录</button>
    </div>`;
  }

  function renderDomainStep() {
    const contextName = isSuper() ? currentInstance()?.brandCustomerName : currentTenant()?.name;
    return `<div class="auth-card auth-choice-card" data-anno-page="domain-select" data-anno-label="业务域选择" data-anno-kind="region" data-anno-fields="FLD-002,FLD-004,FLD-005,FLD-006,FLD-007">
      ${stageCopy()}
      <div class="auth-card-heading"><span>${esc(contextName || '当前工作范围')}</span><h1>选择本次进入的业务域</h1><p>租户和角色保持不变；登录后可在顶部切换业务域。</p></div>
      <div class="domain-choice-grid">${availableDomains().map(domain => `<button type="button" class="domain-choice-card ${domain === 'AI_OUTBOUND' ? 'ai' : 'cloud'}" onclick="AppState.chooseDomain('${domain}')"><span>${domain === 'AI_OUTBOUND' ? 'AI' : '云'}</span><div><strong>${domainMeta[domain].label}</strong><small>${domainMeta[domain].description}</small></div><em>进入工作台</em></button>`).join('')}</div>
      ${isSuper() && account().lastInstanceId === state.instanceId ? `<p class="restored-context">已恢复上次使用的客户/品牌：${esc(currentInstance()?.brandCustomerName || state.instanceId)}</p>` : ''}
      <button class="auth-link" type="button" onclick="AppState.backToLogin()">退出并重新选择</button>
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
    const body = state.authStage === 'TENANT' ? renderTenantStep() : state.authStage === 'INSTANCE' ? renderInstanceStep() : state.authStage === 'DOMAIN' ? renderDomainStep() : renderAccountStep();
    gateway.innerHTML = `<div class="auth-brand-panel"><div class="auth-brand-mark"><i></i><strong>统一外呼中台</strong></div><div><span>一个账号 · 一个租户 · 一个角色</span><h2>先确定工作范围，再进入业务。</h2><p>智能外呼与云呼叫共享统一入口，菜单、数据与操作按当前业务域清晰隔离。</p></div><ul><li>租户在登录时选定</li><li>业务域可在同租户内切换</li><li>客户/品牌仅超级管理员可切换</li></ul></div><div class="auth-form-panel">${body}</div>`;
  }

  function renderControls() {
    ensureContext();
    const tenantLabel = document.getElementById('currentTenantLabel');
    const roleLabel = document.getElementById('currentRoleLabel');
    const domainWrap = document.getElementById('domainContext');
    const domainSelect = document.getElementById('domainSwitcher');
    const instanceWrap = document.getElementById('instanceContext');
    const instanceSelect = document.getElementById('instanceSwitcher');
    const scopeLabel = document.getElementById('scopeLabel');
    const userLabel = document.getElementById('currentUserLabel');
    const ready = isReady();
    if (tenantLabel) tenantLabel.textContent = ready ? `${currentTenant()?.name || '—'}${currentTenant()?.builtIn ? '（内置）' : ` · ${currentTenant()?.organizationLabel || ''}`}` : '尚未登录';
    if (roleLabel) roleLabel.textContent = ready ? (roleLabels[currentRoleCode()] || currentRoleCode()) : '—';
    if (domainWrap) domainWrap.hidden = !ready;
    if (domainSelect) {
      domainSelect.innerHTML = availableDomains().map(domain => `<option value="${domain}" ${domain === state.activeDomain ? 'selected' : ''}>${domainMeta[domain].label}</option>`).join('');
      domainSelect.disabled = availableDomains().length <= 1;
    }
    if (instanceWrap) instanceWrap.hidden = !(ready && isSuper());
    if (instanceSelect) instanceSelect.innerHTML = availableInstances().map(item => `<option value="${item.instanceId}" ${item.instanceId === state.instanceId ? 'selected' : ''}>${esc(item.brandCustomerName)}</option>`).join('');
    if (scopeLabel) scopeLabel.textContent = ready ? effectiveAccess().dataScopeLabel : '请先登录';
    if (userLabel) userLabel.textContent = ready ? (account().nickname || account().name || profile().label) : '登录';
    document.body.dataset.role = currentRoleCode();
    document.body.dataset.instance = state.instanceId || '';
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
    state.instanceId = '';
    state.activeDomain = '';
    state.authStage = 'ACCOUNT';
    state.currentPage = 'home';
    state.hasUnsavedChanges = false;
    state.pendingDomainSwitch = '';
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
    const domains = availableDomains();
    if (!domains.length) {
      state.authStage = 'ACCOUNT';
      notify();
      showToast('当前工作范围尚未开通可用业务域，请联系管理员', 'warning');
      return false;
    }
    if (domains.length === 1) {
      state.activeDomain = domains[0];
      state.authStage = 'READY';
      state.currentPage = 'home';
      notify();
      showToast(`已进入${domainMeta[state.activeDomain].label}`, 'success');
      return true;
    }
    state.authStage = 'DOMAIN';
    notify();
    return true;
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
    state.instanceId = '';
    state.activeDomain = '';
    if (isSuper()) {
      const restored = selectedAccount.lastInstanceId;
      if (availableInstances().some(item => item.instanceId === restored)) state.instanceId = restored;
      state.tenantId = 'TENANT-SUPER-BUILTIN';
      if (!state.instanceId) { state.authStage = 'INSTANCE'; notify(); return true; }
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
      state.instanceId = tenantOptions[0].instanceId;
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
    state.instanceId = tenant.instanceId;
    return transitionAfterInstanceOrTenant();
  }

  function chooseInstance(instanceId) {
    if (!isSuper() || state.authStage !== 'INSTANCE' || !availableInstances().some(item => item.instanceId === instanceId)) return false;
    state.instanceId = instanceId;
    state.tenantId = 'TENANT-SUPER-BUILTIN';
    rememberInstance(instanceId);
    return transitionAfterInstanceOrTenant();
  }

  function chooseDomain(domain) {
    if (state.authStage !== 'DOMAIN' || !availableDomains().includes(domain)) return false;
    state.activeDomain = domain;
    state.authStage = 'READY';
    state.currentPage = 'home';
    notify();
    showToast(`已进入${domainMeta[domain].label}`, 'success');
    return true;
  }

  function applyDomainSwitch(domain, savedDraft) {
    if (window.AgentWorkbench && !AgentWorkbench.allowContextChange()) { renderControls(); return false; }
    if (!availableDomains().includes(domain)) return false;
    window.CloudTaskWorkspace?.clearActiveContext();
    state.returnContext = null;
    state.activeDomain = domain;
    state.currentPage = 'home';
    state.hasUnsavedChanges = false;
    state.pendingDomainSwitch = '';
    document.getElementById('domainSwitchDialog')?.remove();
    if (location.hash !== '#home') history.replaceState({ routeKey: 'home' }, '', '#home');
    notify();
    showToast(`${savedDraft ? '草稿已保存，' : ''}已切换至${domainMeta[domain].label}`, 'success');
    return true;
  }

  function requestDomainSwitch(domain) {
    if (!isReady() || domain === state.activeDomain) return true;
    if (!availableDomains().includes(domain)) return false;
    if (!state.hasUnsavedChanges) return applyDomainSwitch(domain, false);
    state.pendingDomainSwitch = domain;
    document.getElementById('domainSwitchDialog')?.remove();
    const dialog = document.createElement('div');
    dialog.id = 'domainSwitchDialog';
    dialog.className = 'domain-switch-mask';
    dialog.innerHTML = `<div class="domain-switch-dialog" role="dialog" aria-modal="true" data-anno-page="domain-select" data-anno-label="未保存内容切换业务域确认" data-anno-kind="region" data-anno-fields="FLD-005"><span class="dialog-warning">!</span><h2>当前页面有未保存内容</h2><p>切换到${esc(domainMeta[domain].label)}后将回到该业务域工作台。你可以先保存草稿，或放弃本次修改。</p><div><button class="btn" onclick="AppState.cancelDomainSwitch()">继续编辑</button><button class="btn" onclick="AppState.confirmDomainSwitch('discard')">放弃并切换</button><button class="btn btn-primary" onclick="AppState.confirmDomainSwitch('save')">保存草稿并切换</button></div></div>`;
    document.body.appendChild(dialog);
    return true;
  }

  function confirmDomainSwitch(strategy) {
    const target = state.pendingDomainSwitch;
    if (!target) return false;
    if (strategy === 'save') window.dispatchEvent(new CustomEvent('app:save-draft', { detail: { reason: 'domain-switch', targetDomain: target } }));
    return applyDomainSwitch(target, strategy === 'save');
  }

  function cancelDomainSwitch() {
    state.pendingDomainSwitch = '';
    document.getElementById('domainSwitchDialog')?.remove();
    renderControls();
  }

  function setInstance(instanceId) {
    if (window.AgentWorkbench && !AgentWorkbench.allowContextChange()) { renderControls(); return false; }
    if (!isReady() || !isSuper() || !availableInstances().some(item => item.instanceId === instanceId)) return false;
    window.CloudTaskWorkspace?.clearActiveContext();
    state.returnContext = null;
    state.instanceId = instanceId;
    state.tenantId = 'TENANT-SUPER-BUILTIN';
    rememberInstance(instanceId);
    const domains = availableDomains();
    if (!domains.includes(state.activeDomain)) state.activeDomain = domains[0] || '';
    state.currentPage = 'home';
    if (location.hash !== '#home') history.replaceState({ routeKey: 'home' }, '', '#home');
    notify();
    showToast(`客户/品牌已切换为${currentInstance()?.brandCustomerName || instanceId}`, 'success');
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
    return window.navigateTo ? window.navigateTo(route) : false;
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
    return window.navigateTo ? window.navigateTo(context.fromRoute || 'scenario-readiness', options) : false;
  }
  function clearReturnContext() { state.returnContext = null; persist(); }
  function scoped(rows) { return (rows || []).filter(item => authorizeObject('', item)); }

  ensureContext();
  if ((state.accountId && account().status !== '启用') || (state.authStage === 'READY' && !effectiveAccess().valid)) resetContext(true);

  window.AppState = {
    get: snapshot, profile, account, currentTenant, currentInstance, availableTenants, availableInstances, availableDomains,
    effectiveAccess, isSuper, isReady, isBusinessContext: () => effectiveAccess().valid, isPlatformInternal: () => isSuper(),
    hasCapability, canMenu, canAction, canSensitive, authorizeObject, scoped,
    selectDemoProfile, setLoginMode, sendSmsCode, refreshCaptcha, submitLogin, chooseTenant, chooseInstance, chooseDomain, requestDomainSwitch, confirmDomainSwitch,
    cancelDomainSwitch, setProfile, setPerspective: setProfile, setTenant, setInstance, setDirty,
    beginConfiguration, getReturnContext, returnFromConfiguration, clearReturnContext, logout, backToLogin,
    setEnvironment: () => false, setCurrentPage,
    subscribe(listener) { if (typeof listener === 'function') listeners.push(listener); },
    renderControls, notify, domainMeta, persistManagementData
  };

  window.openDemoSettings = function () { logout(false); };
  document.addEventListener('DOMContentLoaded', renderControls);
  window.addEventListener('cloudcall:datachange', notify);
})();
