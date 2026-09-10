/** 继承智能外呼表单；仅叠加已确认的租户能力及账号复用，不重建账号体系。 */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, data = CloudCallData;
  let accountContext = null, tenantContext = null;
  const defaults = { password: 'Abc@123456' };
  const get = id => document.getElementById(id);
  const value = id => (get(id)?.value || '').trim();
  const checked = name => document.querySelector('input[name="' + name + '"]:checked')?.value || '';
  const now = () => new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  const role = () => AppState.effectiveAccess().roleCode;
  const managedTenants = () => AppState.isSuper() ? data.tenants.filter(t => t.instanceId === AppState.get().instanceId) : [AppState.currentTenant()].filter(Boolean);
  const canManage = tenantId => AppState.effectiveAccess().valid && ['ADMIN', 'SUPER_ADMIN'].includes(role()) &&
    managedTenants().some(t => t.tenantId === tenantId);
  const contextKey = () => { const s = AppState.get(); return [s.sessionId, s.accountId, s.tenantId, s.instanceId, s.activeDomain, s.roleCode].join('|'); };
  const contextValid = ctx => !!ctx && ctx.contextKey === contextKey() && AppState.effectiveAccess().valid;
  function hasBusinessData(t) {
    if (!t) return false;
    if (t.hasBusinessData) return true;
    if (['agents', 'callPlans', 'tasks', 'predictiveTasks', 'ivrTasks', 'calls', 'physicalSkillGroups'].some(key =>
      (data[key] || []).some(row => row.tenantId === t.tenantId))) return true;
    if ((data.phoneNumbers || []).some(row => (row.authorizedTenantIds || []).includes(t.tenantId))) return true;
    // 未提交草稿也持有租户与品牌资源引用，不能迁移后遗留悬空任务。
    return ['cloud-task-wizard-drafts-v1', 'cloud-task-created-v1'].some(key => {
      try { const rows = JSON.parse(sessionStorage.getItem(key) || '[]'); return !Array.isArray(rows) || rows.some(row => row?.tenantId === t.tenantId); }
      catch (error) { return true; } // 无法确认历史引用时不允许迁移。
    });
  }
  const error = (id, text) => {
    const box = get(id + 'Error');
    if (box) { box.textContent = text; box.hidden = !text; }
    const input = get(id);
    if (input) { input.setAttribute('aria-invalid', String(!!text)); if (text) input.focus(); }
    return false;
  };
  function row(label, id, html, required, help) {
    return '<div class="account-form-row"><label class="account-form-label" id="' + id + 'Label" for="' + id + '">' +
      (required ? '<span class="required">*</span> ' : '') + esc(label) + '：' +
      (help ? ui.help(help, label + '说明') : '') + '</label><div class="account-form-control">' + html +
      '<div id="' + id + 'Error" class="account-form-error" role="alert" hidden></div></div></div>';
  }
  function input(id, val, placeholder, max, extra) {
    return '<input class="account-form-input" id="' + id + '" value="' + esc(val || '') + '" placeholder="' + esc(placeholder || '') + '"' +
      (max ? ' maxlength="' + max + '"' : '') + ' ' + (extra || '') + '>';
  }
  function counted(id, val, max, placeholder, extra) {
    return '<div class="account-input-with-count">' + input(id, val, placeholder, max,
      'oninput="AccountTenantForms.count(this)" ' + (extra || '')) + '<span class="account-char-count" id="' + id + 'Count">' +
      String(val || '').length + ' / ' + max + '</span></div>';
  }
  function radios(name, options, selected, disabled) {
    return '<div class="account-radio-group" id="' + name + '" role="radiogroup" aria-labelledby="' + name + 'Label">' + options.map(([v, label]) => '<label class="account-radio-label"><input type="radio" name="' + name +
      '" value="' + esc(v) + '"' + (v === selected ? ' checked' : '') + (disabled ? ' disabled' : '') + '> ' + esc(label) + '</label>').join('') + '</div>';
  }
  const hint = text => '<div class="account-field-hint">' + esc(text) + '</div>';
  const eye = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="password-eye-slash" d="m4 4 16 16"/></svg>';
  function passwordField(id, val, placeholder, disabled) {
    return '<div class="account-password-wrap">' + input(id, val, placeholder, 16, 'type="password" autocomplete="new-password"' + (disabled ? ' readonly' : '')) +
      '<button class="account-pwd-toggle" type="button" aria-label="显示密码" aria-pressed="false"' + (disabled ? ' disabled' : '') + ' onclick="AccountTenantForms.togglePassword(\'' + id + '\')">' + eye + '</button></div>';
  }
  function openForm(id, title, body, action, readOnly, accountForm) {
    ui.openLayer(id, '<div class="layer-header"><h2>' + esc(title) + '</h2><button type="button" aria-label="关闭' + esc(title) +
      '" onclick="PlatformUI.closeLayer(\'' + id + '\')">×</button></div><div class="layer-body account-form-modal-body">' + body +
      '</div><div class="layer-footer"><button type="button" class="btn" onclick="PlatformUI.closeLayer(\'' + id + '\')">' + (readOnly ? '关闭' : '取消') +
      '</button>' + (readOnly ? '' : '<button class="btn btn-primary" type="button" onclick="' + (id === 'member-edit' ? 'window.Pages[\'account-tenant\'].' : 'AccountTenantForms.') + action + '()">确定</button>') + '</div>', 'inherited-management-form' + (accountForm ? ' online-account-form' : ''));
  }
  function openAccount(tenantId) {
    const tenant = CloudCallRuntime.tenant(tenantId);
    if (!tenant || tenant.status !== '启用' || !canManage(tenantId)) return showToast('请选择已启用且有管理权限的租户', 'warning');
    accountContext = { tenantId, mobile: '', existingId: null, avatar: '', draft: null, contextKey: contextKey() };
    openForm('member-add', '新增账号',
      row('所属租户', 'memberTenant', input('memberTenant', tenant.name, '', null, 'readonly'), true) +
      row('头像', 'newAccountAvatar', '<button class="account-avatar-uploader" id="newAccountAvatar" type="button" aria-label="上传头像" onclick="AccountTenantForms.chooseAvatar()"><span class="account-avatar-plus">+</span></button><input id="newAccountAvatarFile" type="file" accept="image/*" hidden onchange="AccountTenantForms.avatarSelected(event)">', false) +
      row('账号', 'newAccountUsername', input('newAccountUsername', '', '请输入账号', 32) + hint('支持字母、数字及 . _ -，4~32 位'), true) +
      row('账号昵称', 'newAccountNickname', counted('newAccountNickname', '', 20, '请输入账号昵称') + hint('支持汉字、字母、符号、数字'), true) +
      row('手机号码', 'memberMobile', '<div class="account-input-with-count">' + input('memberMobile', '', '请输入手机号码', 11, 'inputmode="tel" oninput="AccountTenantForms.count(this);AccountTenantForms.mobileChanged()" onblur="AccountTenantForms.lookup(false)"') +
        '<span class="account-char-count" id="memberMobileCount">0 / 11</span></div><div id="memberLookupMessage" class="inherited-lookup-message" aria-live="polite"></div>', true, '填写完整手机号后自动检查；同一手机号复用已有账号，不重复注册。') +
      row('登录密码', 'newAccountPassword', passwordField('newAccountPassword', defaults.password, '') +
        '<span id="existingPasswordNote" class="inherited-lookup-message" hidden>沿用已有账号密码，不在此修改。</span>' + hint('支持大小写字母、符号、数字，8~16 位'), true, '已填入现有默认密码；需包含大小写字母、数字和符号。') +
      row('角色', 'memberRole', radios('memberRole', [['ADMIN', '租户管理员'], ['OPERATOR', '租户运营']], 'OPERATOR'), true, '角色仅在当前租户内生效；一个账号在同一租户内只有一个角色。') +
      row('状态', 'memberStatus', radios('memberStatus', [['停用', '禁用'], ['启用', '启用']], '启用'), true, '仅控制当前租户的使用权限，不影响账号在其他租户的使用。') +
      '<div class="inherited-create-confirm" id="newAccountConfirmation" hidden><label><input type="checkbox" id="explicitCreate"> 确认创建新账号并加入该租户</label><div id="explicitCreateError" class="account-form-error" role="alert" hidden></div></div>', 'saveAccount', false, true);
  }
  function openAccountEdit(account, tenant, member, editable) {
    const readonly = editable ? '' : 'readonly', disabled = editable ? '' : 'disabled';
    openForm('member-edit', '编辑账号',
      row('所属租户', 'editMemberTenant', input('editMemberTenant', tenant.name, '', null, 'readonly'), true,
        editable ? '角色和状态仅对当前租户生效。' : '账号资料由超级管理员统一维护；你可以调整当前租户的角色和状态。') +
      row('头像', 'accountAvatarPreview', '<button class="account-avatar-uploader" id="accountAvatarPreview" type="button" aria-label="上传头像" ' + disabled + ' onclick="window.Pages[\'account-tenant\'].triggerAvatarUpload()">' +
        (account.avatar ? '<img class="account-avatar-img" src="' + esc(account.avatar) + '" alt="账号头像">' : '<span class="account-avatar-plus">+</span>') + '</button><input id="accountAvatarInput" type="file" accept="image/*" hidden onchange="window.Pages[\'account-tenant\'].onAvatarSelected(event)">') +
      row('账号', 'editAccountUsername', input('editAccountUsername', account.loginUsername, '请输入账号', 32, readonly) + hint('支持字母、数字及 . _ -，4~32 位'), true) +
      row('账号昵称', 'editAccountNickname', counted('editAccountNickname', account.nickname || account.name, 20, '请输入账号昵称', readonly) + hint('支持汉字、字母、符号、数字'), true) +
      row('手机号码', 'editAccountMobile', counted('editAccountMobile', account.loginMobile, 11, '请输入手机号码', 'inputmode="tel" ' + readonly), true) +
      row('登录密码', 'editAccountPassword', passwordField('editAccountPassword', '', editable ? '不修改请留空' : '由超级管理员维护', !editable) + hint('支持大小写字母、符号、数字，8~16 位'), true, '原密码不回显；留空则保留原密码。输入新密码后点击确定才会修改。') +
      row('角色', 'editMemberRole', radios('editMemberRole', [['ADMIN', '租户管理员'], ['OPERATOR', '租户运营']], member.roleCode), true) +
      row('状态', 'editMemberStatus', radios('editMemberStatus', [['停用', '禁用'], ['启用', '启用']], member.status), true, '仅控制当前租户的使用权限，不影响账号在其他租户的使用。'),
      'saveMemberEdit', false, true);
  }
  function draftFields() {
    return { username: value('newAccountUsername'), nickname: value('newAccountNickname'), password: get('newAccountPassword').value, avatar: accountContext.avatar };
  }
  function fillIdentity(fields, existing) {
    get('newAccountUsername').value = fields.username || '';
    get('newAccountNickname').value = fields.nickname || '';
    get('newAccountPassword').value = existing ? '' : fields.password || defaults.password;
    ['newAccountUsername', 'newAccountNickname'].forEach(id => { get(id).readOnly = existing; });
    get('newAccountPassword').parentElement.hidden = existing;
    get('existingPasswordNote').hidden = !existing;
    get('newAccountAvatar').disabled = existing;
    accountContext.avatar = fields.avatar || '';
    get('newAccountAvatar').innerHTML = fields.avatar ? '<img class="account-avatar-img" alt="账号头像" src="' + esc(fields.avatar) + '">' : '<span class="account-avatar-plus">+</span>';
    count(get('newAccountNickname'));
  }
  function mobileChanged() {
    if (!accountContext) return;
    if (accountContext.existingId) fillIdentity(accountContext.draft || {}, false);
    accountContext.mobile = '';
    accountContext.existingId = null;
    get('memberLookupMessage').textContent = '';
    get('newAccountConfirmation').hidden = true;
    get('explicitCreate').checked = false;
    error('memberMobile', '');
  }
  function lookup(explicit) {
    if (!contextValid(accountContext) || !canManage(accountContext.tenantId) || !get('memberMobile')) return false;
    const mobile = value('memberMobile');
    if (!/^1\d{10}$/.test(mobile)) return explicit ? error('memberMobile', '请输入正确的 11 位手机号') : false;
    if (accountContext.mobile === mobile) return true;
    if (!accountContext.existingId) accountContext.draft = draftFields();
    const account = data.accounts.find(a => a.loginMobile === mobile);
    accountContext.mobile = mobile;
    accountContext.existingId = account?.accountId || null;
    error('memberMobile', '');
    ['newAccountUsername', 'newAccountNickname', 'newAccountPassword', 'explicitCreate'].forEach(id => error(id, ''));
    if (account) {
      fillIdentity({ username: account.loginUsername, nickname: account.nickname || account.name, avatar: account.avatar }, true);
      const member = data.memberships.find(m => m.accountId === account.accountId && m.tenantId === accountContext.tenantId);
      get('memberLookupMessage').textContent = member ? '该账号已属于当前租户，请返回列表编辑。' : '已找到账号，确认后加入当前租户；原账号资料保持不变。';
      get('newAccountConfirmation').hidden = true;
    } else {
      fillIdentity(accountContext.draft || {}, false);
      get('memberLookupMessage').textContent = '该手机号尚未注册，请填写账号资料并确认创建。';
      get('newAccountConfirmation').hidden = false;
      get('explicitCreate').checked = false;
    }
    return true;
  }
  function saveAccount() {
    const ctx = accountContext;
    if (!ctx || !get('member-add')) return;
    if (!contextValid(ctx) || !canManage(ctx.tenantId) || CloudCallRuntime.tenant(ctx.tenantId)?.status !== '启用') return error('memberTenant', '当前租户不可用或已无管理权限，请重新进入');
    if (ctx.mobile !== value('memberMobile')) { lookup(true); return; }
    if (!/^1\d{10}$/.test(ctx.mobile)) return error('memberMobile', '请输入正确的 11 位手机号');
    const currentAccount = data.accounts.find(a => a.loginMobile === ctx.mobile);
    if ((currentAccount?.accountId || null) !== ctx.existingId) { ctx.mobile = ''; lookup(true); return; }
    if (currentAccount?.builtIn) return error('memberMobile', '内置超级管理员账号不能加入普通租户');
    const memberRole = checked('memberRole'), memberStatus = checked('memberStatus');
    if (!['ADMIN', 'OPERATOR'].includes(memberRole)) return error('memberRole', '请选择租户角色');
    if (!['启用', '停用'].includes(memberStatus)) return error('memberStatus', '请选择状态');
    if (currentAccount && data.memberships.some(m => m.accountId === currentAccount.accountId && m.tenantId === ctx.tenantId)) return error('memberMobile', '该账号已属于当前租户，请返回列表编辑');
    let account = currentAccount;
    const stamp = now(), updater = AppState.account().nickname || AppState.account().name;
    if (!account) {
      const username = value('newAccountUsername'), nickname = value('newAccountNickname'), password = get('newAccountPassword').value;
      if (!/^[A-Za-z0-9._-]{4,32}$/.test(username)) return error('newAccountUsername', '请输入 4—32 位账号，支持字母、数字或 . _ -');
      if (data.accounts.some(a => a.loginUsername === username)) return error('newAccountUsername', '账号已存在，请重新输入');
      if (!nickname || nickname.length > 20) return error('newAccountNickname', '请输入 1—20 字账号昵称');
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(password)) return error('newAccountPassword', '密码需为 8—16 位，包含大小写字母、数字和符号');
      if (!get('explicitCreate').checked) return error('explicitCreate', '请确认创建新账号并加入该租户');
      account = { accountId: CloudCallRuntime.sequence('ACC', data.accounts), loginUsername: username, nickname, name: nickname,
        loginMobile: ctx.mobile, mobile: ctx.mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'), password, avatar: ctx.avatar,
        status: '启用', builtIn: false, updatedAt: stamp, updatedBy: updater };
      data.accounts.push(account);
    }
    data.memberships.push({ membershipId: CloudCallRuntime.sequence('MEM', data.memberships), accountId: account.accountId,
      tenantId: ctx.tenantId, roleCode: memberRole, status: memberStatus, updatedAt: stamp, updatedBy: updater });
    CloudCallRuntime.addAudit('新增租户成员', account.accountId, ctx.tenantId, '—', memberRole + ' / ' + memberStatus);
    ui.closeLayer('member-add'); accountContext = null;
    AppState.persistManagementData();
    CloudCallRuntime.touch();
    showToast(currentAccount ? '已有账号已加入当前租户' : '账号已创建并加入当前租户', 'success');
    navigateTo('accounts');
  }
  function openTenant(id) {
    if (!AppState.effectiveAccess().valid) return showToast('请先登录并选择有效工作范围', 'warning');
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role())) return showToast('当前无权查看租户管理', 'warning');
    const editable = AppState.isSuper();
    const found = id && CloudCallRuntime.tenant(id);
    if (id && (!found || !managedTenants().some(t => t.tenantId === id))) return showToast('当前范围无权查看该租户', 'warning');
    if (!id && !editable) return showToast('仅超级管理员可新建租户', 'warning');
    const t = found || { name: '', organizationScope: 'HEADQUARTERS', commercialFlag: 'trial', desc: '', status: '启用', capabilitySet: [], instanceId: AppState.get().instanceId };
    tenantContext = { id: id || null, editable, contextKey: contextKey() };
    const businessData = hasBusinessData(t);
    const disabled = editable ? '' : 'disabled', readonly = editable ? '' : 'readonly';
    const instanceOptions = data.instances.filter(i => (editable || i.instanceId === t.instanceId) && (i.status === 'RUNNING' || i.instanceId === t.instanceId)).map(i =>
      '<option value="' + esc(i.instanceId) + '"' + (i.instanceId === t.instanceId ? ' selected' : '') + '>' + esc(i.brandCustomerName) + (i.status === 'RUNNING' ? '' : '（已停用）') + '</option>').join('');
    openForm('tenant-detail', id ? (editable ? '编辑租户' : '租户详情') : '新建租户',
      row('租户名称', 'tenantName', counted('tenantName', t.name, 50, '请输入租户名称', readonly), true) +
      row('租户类型', 'tenantOrg', radios('tenantOrg', [['HEADQUARTERS', '总部'], ['STORE', '门店']], t.organizationScope, !editable)) +
      row('商用/试用', 'tenantCommercialFlag', radios('tenantCommercialFlag', [['commercial', '商用'], ['trial', '试用']], t.commercialFlag, !editable), true, '沿用智能外呼原有标记，仅用于展示，不改变有效期、余额、冻结或消耗规则。') +
      row('描述', 'tenantDesc', '<div class="inherited-textarea-count"><textarea class="account-form-input" id="tenantDesc" maxlength="50" placeholder="请输入描述" oninput="AccountTenantForms.count(this)" ' + readonly + '>' + esc(t.desc || '') +
        '</textarea><span class="account-char-count" id="tenantDescCount">' + String(t.desc || '').length + ' / 50</span></div>') +
      row('状态', 'tenantStatus', radios('tenantStatus', [['停用', '停用'], ['启用', '启用']], t.status, !editable)) +
      '<div class="inherited-section-divider"><span>产品授权</span></div>' +
      row('可用产品', 'tenantProducts', '<div class="account-radio-group" id="tenantProducts"><label class="account-radio-label"><input type="checkbox" id="tenantAI"' + (t.capabilitySet.includes('AI_OUTBOUND') ? ' checked' : '') + ' ' + disabled + '> 智能外呼</label><label class="account-radio-label"><input type="checkbox" id="tenantCCC"' + (t.capabilitySet.includes('CLOUD_CONTACT_CENTER') ? ' checked' : '') + ' ' + disabled + '> 云呼叫</label></div>', true, '可选择一种或两种产品，不新增第二套租户或账号。') +
      row('客户/品牌', 'tenantInstance', '<select class="account-form-input" id="tenantInstance" ' + (businessData || !editable ? 'disabled' : '') + '>' + instanceOptions + '</select>', true,
        businessData ? '已有业务数据，不能直接更换客户/品牌。' : '沿用已确认的实例归属：一个租户绑定一个客户/品牌，同一客户/品牌可服务多个总部或门店租户。'), 'saveTenant', !editable);
  }
  function saveTenant() {
    const ctx = tenantContext;
    if (!ctx || !get('tenant-detail')) return;
    if (!contextValid(ctx) || !AppState.isSuper() || !ctx.editable) return error('tenantName', '工作范围已变化，请重新打开租户表单');
    const existing = ctx.id && CloudCallRuntime.tenant(ctx.id);
    if (ctx.id && (!existing || !canManage(ctx.id))) return error('tenantName', '租户已不在当前管理范围，请重新进入');
    const name = value('tenantName'), instanceId = value('tenantInstance'), commercialFlag = checked('tenantCommercialFlag');
    const desc = value('tenantDesc'), organizationScope = checked('tenantOrg'), status = checked('tenantStatus');
    if (!name || name.length > 50) return error('tenantName', '请输入 1—50 字租户名称');
    if (!['commercial', 'trial'].includes(commercialFlag)) return error('tenantCommercialFlag', '请选择商用或试用');
    if (desc.length > 50) return error('tenantDesc', '描述不能超过 50 字');
    const capabilities = [get('tenantAI').checked && 'AI_OUTBOUND', get('tenantCCC').checked && 'CLOUD_CONTACT_CENTER'].filter(Boolean);
    if (!capabilities.length) return error('tenantProducts', '请至少选择一项可用产品');
    const instance = CloudCallRuntime.instance(instanceId);
    if (!instance || (instance.status !== 'RUNNING' && existing?.instanceId !== instanceId)) return error('tenantInstance', '请选择有效的客户/品牌');
    if (hasBusinessData(existing) && existing.instanceId !== instanceId) return error('tenantInstance', '已有业务数据，不能直接更换客户/品牌');
    // 保留既有同实例重名校验，不在表单继承修复中扩展唯一性规则。
    if (data.tenants.some(t => t.tenantId !== ctx.id && t.instanceId === instanceId && t.name === name)) return error('tenantName', '当前客户/品牌下已存在同名租户');
    if (!['HEADQUARTERS', 'STORE'].includes(organizationScope) || !['启用', '停用'].includes(status)) return error('tenantName', '请完整选择租户类型及状态');
    const target = existing || { tenantId: CloudCallRuntime.sequence('TEN', data.tenants), hasBusinessData: false };
    Object.assign(target, { name, organizationScope, organizationLabel: organizationScope === 'HEADQUARTERS' ? '总部' : '门店', commercialFlag,
      commercialFlagLabel: commercialFlag === 'commercial' ? '商用' : '试用', desc, status, instanceId, capabilitySet: capabilities,
      updatedAt: now(), updatedBy: AppState.account().nickname || AppState.account().name });
    if (capabilities.includes('AI_OUTBOUND') && window.AiBillingStore) AiBillingStore.initTenant(target);
    if (!existing) data.tenants.push(target);
    data.instances.forEach(i => { i.tenantIds = (i.tenantIds || []).filter(tid => tid !== target.tenantId); });
    instance.tenantIds.push(target.tenantId);
    CloudCallRuntime.addAudit('保存租户配置', target.tenantId, target.tenantId, existing ? '编辑' : '新建', target.name);
    ui.closeLayer('tenant-detail'); tenantContext = null;
    AppState.persistManagementData();
    CloudCallRuntime.touch(); showToast('租户已保存', 'success'); navigateTo('tenants');
  }
  function count(el) {
    const counter = get(el.id + 'Count');
    if (counter) counter.textContent = el.value.length + ' / ' + el.maxLength;
    error(el.id, '');
  }
  function avatarSelected(event) {
    const ctx = accountContext, file = event.target.files?.[0];
    if (!contextValid(ctx) || ctx.existingId || !file) return;
    if (!file.type.startsWith('image/')) return error('newAccountAvatar', '请选择图片文件');
    const reader = new FileReader();
    reader.onload = () => {
      if (accountContext !== ctx || !contextValid(ctx) || ctx.existingId || !get('newAccountAvatar')) return;
      ctx.avatar = reader.result;
      get('newAccountAvatar').innerHTML = '<img class="account-avatar-img" alt="头像预览" src="' + esc(reader.result) + '">';
    };
    reader.readAsDataURL(file);
  }
  window.AccountTenantForms = { openAccount, openAccountEdit, saveAccount, lookup, mobileChanged, openTenant, saveTenant, count, avatarSelected, fieldError: error,
    chooseAvatar() { if (!accountContext?.existingId) get('newAccountAvatarFile')?.click(); },
    togglePassword(id) {
      const el = get(id || 'newAccountPassword');
      if (!el || el.readOnly || el.nextElementSibling?.disabled) return;
      el.type = el.type === 'password' ? 'text' : 'password';
      const btn = el.nextElementSibling;
      btn.setAttribute('aria-label', el.type === 'password' ? '显示密码' : '隐藏密码');
      btn.setAttribute('aria-pressed', String(el.type === 'text'));
    }
  };
})();
