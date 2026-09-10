/**
 * 统一账号与租户。
 * 在一个主模型上合并既有智能外呼账号资料、AI 计费/充值能力与新增云联络中心能力。
 */
(function () {
  'use strict';

  var ui = PlatformUI;
  var esc = ui.escape;
  var view = 'accounts';
  var accountKeyword = '';
  var accountRole = '';
  var selectedTenantId = '';
  var accountPage = 1;
  var accountPageSize = 10;
  var tenantKeyword = '';
  var tenantType = '';
  var tenantCapability = '';
  var tenantStatus = '';
  var tenantCommercial = '';
  var tenantService = '';
  var tenantPage = 1;
  var tenantPageSize = 10;
  var editingMemberId = '';
  var editingMemberContext = null;
  var currentAvatarDataUrl = '';
  var DEFAULT_PASSWORD = 'Abc@123456';
  var roleNames = { SUPER_ADMIN: '超级管理员', ADMIN: '管理员', OPERATOR: '运营' };
  function contextKey() { var s = AppState.get(); return [s.sessionId, s.accountId, s.tenantId, s.instanceId, s.activeDomain, s.roleCode].join('|'); }
  function contextValid(key) { return !!key && key === contextKey() && AppState.effectiveAccess().valid; }
  function canEditMember(member) {
    return !!member && !CloudCallRuntime.account(member.accountId)?.builtIn && tenants().some(function (tenant) { return tenant.tenantId === member.tenantId; });
  }

  function tenants() {
    var access = AppState.effectiveAccess();
    if (!access.valid || ['SUPER_ADMIN', 'ADMIN'].indexOf(access.roleCode) < 0) return [];
    // 登录可选租户仅含启用项；管理列表须保留停用项，才能查看和恢复。
    return AppState.isSuper() ? CloudCallData.tenants.filter(function (tenant) {
      return tenant.instanceId === AppState.get().instanceId;
    }) : [AppState.currentTenant()].filter(Boolean);
  }

  function memberships() {
    var ids = tenants().map(function (item) { return item.tenantId; });
    return CloudCallData.memberships.filter(function (item) { return ids.indexOf(item.tenantId) >= 0; });
  }

  function ensureSelectedTenant() {
    var list = tenants();
    if (!list.some(function (item) { return item.tenantId === selectedTenantId; })) {
      selectedTenantId = list[0] ? list[0].tenantId : '';
    }
    return selectedTenantId;
  }

  function tenantMemberCount(tenantId) {
    return CloudCallData.memberships.filter(function (item) {
      return item.tenantId === tenantId;
    }).length;
  }

  function renderTenantCards() {
    ensureSelectedTenant();
    if (!tenants().length) return ui.empty('暂无可管理租户');
    return tenants().map(function (tenant) {
      return '<button type="button" class="account-tenant-card' + (tenant.tenantId === selectedTenantId ? ' active' : '') + '" onclick="window.Pages[\'account-tenant\'].selectTenant(\'' + esc(tenant.tenantId) + '\')">' +
        '<div class="account-tenant-card-header"><span class="account-tenant-name" title="' + esc(tenant.name) + '">' + esc(tenant.name) + '</span><span class="account-tenant-count">' + tenantMemberCount(tenant.tenantId) + '</span></div>' +
        '<div class="account-tenant-desc">' + esc(tenant.organizationLabel) + ' · ' + esc(capabilityText(tenant)) + '</div>' +
        '<div class="account-tenant-status"><i class="status-dot ' + (tenant.status === '启用' ? 'healthy' : '') + '"></i>' + esc(tenant.status) + '</div>' +
      '</button>';
    }).join('');
  }

  function capabilityText(row) {
    return (row.capabilitySet || []).map(function (item) {
      return item === 'AI_OUTBOUND' ? '智能外呼' : '云联络中心';
    }).join(' + ') || '未开通';
  }

  function hasAi(row) {
    return !!row && (row.capabilitySet || []).indexOf('AI_OUTBOUND') >= 0;
  }

  function maskMobile(value) {
    var mobile = String(value || '');
    return /^1\d{10}$/.test(mobile) ? mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : mobile;
  }

  function formatMoney(value) {
    return '¥' + Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatMinutes(value) {
    return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' 分钟';
  }

  function nowText() {
    return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  }

  function billingSummary(tenant) { return AiBillingStore.summary(tenant); }

  function avatarHtml(account, size) {
    var pixel = size || 36;
    if (account && account.avatar) {
      return '<img class="account-avatar-image" src="' + esc(account.avatar) + '" alt="' + esc(account.nickname || account.name || '账号头像') + '" style="width:' + pixel + 'px;height:' + pixel + 'px;">';
    }
    var text = String(account && (account.nickname || account.name) || '账').slice(0, 1);
    return '<span class="account-avatar-placeholder" style="width:' + pixel + 'px;height:' + pixel + 'px;">' + esc(text) + '</span>';
  }

  function scopeBar(title, detail) {
    return '<div class="scope-bar" style="margin-left:0;margin-right:0" data-anno-page="' + (view === 'accounts' ? 'accounts' : 'tenants') + '" data-anno-label="当前账号租户范围" data-anno-kind="region" data-anno-fields="FLD-001,FLD-002,FLD-004,FLD-005">' +
      '<div><strong>' + esc(title) + '</strong><span>' + esc(AppState.effectiveAccess().dataScopeLabel) + '</span></div>' +
      '<div class="scope-note">' + esc(detail) + '</div>' +
    '</div>';
  }

  function accountRows() {
    ensureSelectedTenant();
    return memberships().filter(function (member) {
      return member.tenantId === selectedTenantId;
    }).map(function (member) {
      var account = CloudCallRuntime.account(member.accountId) || {};
      var tenant = CloudCallRuntime.tenant(member.tenantId) || {};
      return {
        membershipId: member.membershipId,
        accountId: account.accountId,
        name: account.name,
        nickname: account.nickname || account.name,
        avatar: account.avatar,
        mobile: account.mobile || maskMobile(account.loginMobile),
        loginMobile: account.loginMobile,
        loginUsername: account.loginUsername || '',
        accountStatus: account.status,
        tenantId: tenant.tenantId,
        instanceId: tenant.instanceId,
        tenantName: tenant.name,
        org: tenant.organizationLabel,
        roleCode: member.roleCode,
        membershipStatus: member.status,
        updatedBy: member.updatedBy || account.updatedBy || '平台超级管理员',
        updatedAt: member.updatedAt || account.updatedAt || '2026-09-02 10:30:00'
      };
    }).filter(function (row) {
      var text = [row.nickname, row.name, row.loginUsername, row.mobile, row.loginMobile, row.accountId, row.tenantName].join(' ').toLowerCase();
      return (!accountKeyword || text.indexOf(accountKeyword.toLowerCase()) >= 0) && (!accountRole || row.roleCode === accountRole);
    });
  }

  function renderAccounts() {
    var rows = accountRows();
    var cloudDomain = AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER';
    var pageCount = Math.max(1, Math.ceil(rows.length / accountPageSize));
    if (accountPage > pageCount) accountPage = pageCount;
    var pageRows = rows.slice((accountPage - 1) * accountPageSize, accountPage * accountPageSize).map(function (row, index) {
      return Object.assign({ orderNo: (accountPage - 1) * accountPageSize + index + 1 }, row);
    });
    var columns = [
      { key: 'orderNo', label: '序号', width: '64px' },
      { key: 'nickname', label: '账号昵称', render: function (value, row) {
        return '<div class="account-cell">' + avatarHtml(row, 34) + '<div><div class="table-main">' + esc(value) + '</div><div class="table-sub">' + esc(row.name || '—') + '</div></div></div>';
      } },
      { key: 'loginUsername', label: '账号', render: function (value) { return esc(value || '—'); } },
      { key: 'mobile', label: '手机号码' },
      { key: 'roleCode', label: '角色', help: '角色只在当前选中的租户内生效，一个账号在同一租户内只有一个角色。', render: function (value) {
        return '<span class="role-pill">' + esc(roleNames[value] || value) + '</span>';
      } },
      { key: 'membershipStatus', label: '状态', render: function (value) { return ui.status(value); } },
    ];
    if (cloudDomain) {
      var seatColumns = [
      { key: 'accountId', label: '关联坐席', help: '账号在当前租户只关联一个未删除坐席；不会新增平台登录账号。', render: function (value, row) {
        var seat = AccountSeat.forAccount(value, row.tenantId, row.instanceId);
        return '<span class="account-seat-cell">' + esc(seat ? seat.userName : '未关联') + '</span>';
      } },
      { key: 'accountId', label: '坐席开通', help: '已开通表示当前租户账号已关联坐席；坐席停用不会取消开通。实际呼叫仍需坐席启用、技能和可用号码。', render: function (value, row) {
        var seat = AccountSeat.status(value, row.tenantId, row.instanceId);
        return '<div class="account-seat-opening" data-seat-opened="' + !!seat.agent + '"><span class="seat-opening-badge ' + (seat.agent ? 'is-opened' : 'is-unopened') + '">' + (seat.agent ? '已开通' : '未开通') + '</span>' +
          (seat.agent && seat.agent.lifecycleStatus !== '已启用' ? '<div class="table-sub">' + esc(seat.agent.lifecycleStatus) + '</div>' : !seat.agent && seat.attempt ? '<div class="table-sub warning-text">' + esc(seat.label) + '</div>' : '') + '</div>';
      } }
      ];
      columns.splice(2, 0, seatColumns[1]);
      columns.push(seatColumns[0]);
    }
    columns.push(
      { key: 'updatedBy', label: '更新人' },
      { key: 'updatedAt', label: '更新时间' },
      { key: 'membershipId', label: '操作', className: 'action-column', render: function (value, row) {
        var next = row.membershipStatus === '启用' ? '停用' : '启用';
        var seatAction = '';
        if (cloudDomain) {
          var error = AccountSeat.scopeError(row.tenantId, row.instanceId, row.accountId);
          var seat = AccountSeat.status(row.accountId, row.tenantId, row.instanceId);
          seatAction = '<button' + (error ? ' disabled title="' + esc(error) + '"' : '') + ' onclick="window.Pages[\'account-tenant\'].openAccountSeat(\'' + esc(value) + '\')">' + (seat.agent ? '坐席设置' : seat.attempt ? '查看并重试' : '关联坐席') + '</button>';
        }
        return '<div class="table-actions"><button onclick="window.Pages[\'account-tenant\'].editMember(\'' + esc(value) + '\')">编辑</button>' + seatAction + '<button class="' + (next === '停用' ? 'danger' : '') + '" onclick="window.Pages[\'account-tenant\'].confirmToggleMember(\'' + esc(value) + '\')">' + next + '</button></div>';
      } }
    );
    if (cloudDomain) {
      // The cloud-only additions need their own widths; the inherited AI table
      // remains unchanged. The scroll container, not the page, takes overflow.
    var cloudWidths = [60, 180, 130, 150, 140, 100, 90, 150, 130, 180, 230];
      columns = columns.map(function (column, index) {
        return Object.assign({}, column, { width: cloudWidths[index] + 'px', className: (column.className || '') + ' cloud-account-col-' + index });
      });
    }
    var body = ui.table(columns, pageRows, { className: cloudDomain ? 'cloud-account-table' : '', emptyText: '当前租户下暂无账号', emptyDetail: '点击“新建”添加第一个账号。', footer: ui.pagination(rows.length, accountPage, accountPageSize, "window.Pages['account-tenant'].setAccountPage") });

    return '<section class="platform-page account-page' + (cloudDomain ? ' cloud-account-page' : '') + '" data-anno="account-membership-management" data-anno-page="accounts" data-anno-label="统一账号与租户成员" data-anno-kind="region" data-anno-fields="FLD-002,FLD-005,FLD-007,FLD-008">' +
      ui.pageHeader('账号管理', '管理每个租户下关联的账号信息。') +
      '<div class="account-main-layout"><aside class="account-tenant-panel"><div class="account-tenant-panel-title"><strong>租户列表</strong><span>' + tenants().length + ' 个</span></div>' + renderTenantCards() + '</aside>' +
      '<div class="account-content-panel"><div class="filter-panel"><label class="field"><span>手机号码</span><input id="accountKeyword" value="' + esc(accountKeyword) + '" placeholder="请输入手机号码"></label><label class="field"><span>角色</span><select id="accountRoleFilter"><option value="">请选择</option><option value="ADMIN"' + (accountRole === 'ADMIN' ? ' selected' : '') + '>管理员</option><option value="OPERATOR"' + (accountRole === 'OPERATOR' ? ' selected' : '') + '>运营</option></select></label><div class="filter-actions"><button class="btn" onclick="window.Pages[\'account-tenant\'].resetAccountFilters()">重置</button><button class="btn btn-primary" onclick="window.Pages[\'account-tenant\'].queryAccounts()">查询</button></div></div>' +
      '<div class="account-table-shell">' + ui.toolbar('<button class="btn btn-primary" onclick="window.Pages[\'account-tenant\'].openAddMember()">+ 新建</button>', '<button class="btn btn-quiet" onclick="window.Pages[\'account-tenant\'].refreshAccounts()" title="刷新">↻ 刷新</button><span>' + ui.help('账号登录信息全局复用；角色、状态和云呼叫坐席账号按当前租户维护。', '账号管理说明') + '</span>') + body + '</div></div></div>' +
    '</section>';
  }

  function renderTenants() {
    var editable = AppState.isSuper();
    var aiDomain = AppState.get().activeDomain === 'AI_OUTBOUND';
    var rows = tenants().map(function (row) {
      var summary = aiDomain && hasAi(row) ? billingSummary(row) : null;
      return {
        tenantId: row.tenantId,
        name: row.name,
        organizationLabel: row.organizationLabel,
        capabilities: capabilityText(row),
        instanceName: (CloudCallRuntime.instance(row.instanceId) || {}).brandCustomerName || '—',
        commercialFlag: row.commercialFlag || 'commercial',
        commercialLabel: row.commercialFlag === 'trial' ? '试用' : '商用',
        aiMinutes: summary?.error ? '暂不可用' : summary ? Number(summary.availableMinutes).toLocaleString('zh-CN') + ' 分钟' : '—',
        validity: summary?.error ? '待核对' : summary ? summary.validity : '—',
        aiStatus: summary?.error ? '读取失败' : summary ? summary.statusLabel : '未开通',
        serviceCode: summary?.error ? 'invalid' : summary ? summary.status : 'not_opened',
        status: row.status,
        hasAi: hasAi(row),
        raw: row
      };
    }).filter(function (row) {
      var matchesKeyword = !tenantKeyword || row.name.toLowerCase().indexOf(tenantKeyword.toLowerCase()) >= 0;
      var matchesType = !tenantType || row.raw.organizationScope === tenantType;
      var matchesCapability = !tenantCapability || (row.raw.capabilitySet || []).indexOf(tenantCapability) >= 0;
      var matchesStatus = !tenantStatus || row.status === tenantStatus;
      return matchesKeyword && matchesType && matchesCapability && matchesStatus && (!aiDomain || ((!tenantCommercial || row.commercialFlag === tenantCommercial) && (!tenantService || row.serviceCode === tenantService)));
    });
    var pageCount = Math.max(1, Math.ceil(rows.length / tenantPageSize));
    if (tenantPage > pageCount) tenantPage = pageCount;
    var pageRows = rows.slice((tenantPage - 1) * tenantPageSize, tenantPage * tenantPageSize).map(function (row, index) {
      return Object.assign({ orderNo: (tenantPage - 1) * tenantPageSize + index + 1 }, row);
    });
    var body = ui.table([
      { key: 'orderNo', label: '序号', width: '64px' },
      { key: 'name', label: '租户名称', render: function (value, row) {
        return '<div class="table-main">' + esc(value) + '</div>';
      } },
      { key: 'organizationLabel', label: '租户类型', render: function (value) { return '<span class="org-chip">' + esc(value) + '</span>'; } },
      ...(aiDomain ? [
        { key: 'commercialLabel', label: '商用/试用' },
        { key: 'aiMinutes', label: '可用分钟', help: '大模型与小模型共用同一个分钟池，不按模型分别折算。' },
        { key: 'aiStatus', label: '服务状态', render: function (value) { return ui.status(value); } },
        { key: 'validity', label: '服务区间', help: '北京时间，开始时生效、结束时到期；与租户启停状态分开管理。', render: function (value) { return esc(value).replace(' 至 ', '<br>至 '); } }
      ] : []),
      { key: 'capabilities', label: '可用产品', help: '租户可使用智能外呼、云呼叫，或同时使用两项产品。' },
      { key: 'instanceName', label: '客户/品牌' },
      { key: 'status', label: '状态', render: function (value) { return ui.status(value); } },
      { key: 'tenantId', label: '操作', className: 'action-column', render: function (value, row) {
        return '<div class="table-actions"><button onclick="window.Pages[\'account-tenant\'].openTenant(\'' + esc(value) + '\')">' + (editable ? '编辑' : '查看') + '</button>' +
          (aiDomain && row.hasAi && canManageBilling() ? '<button onclick="window.Pages[\'account-tenant\'].openBilling(\'' + esc(value) + '\')">充值管理</button>' : '') +
          (editable ? '<button class="' + (row.status === '启用' ? 'danger' : '') + '" onclick="window.Pages[\'account-tenant\'].confirmToggleTenant(\'' + esc(value) + '\')">' + (row.status === '启用' ? '停用' : '启用') + '</button>' : '') + '</div>';
      } }
    ], pageRows, { emptyText: '未找到符合条件的租户', emptyDetail: '可重置筛选条件后重新查询。', footer: ui.pagination(rows.length, tenantPage, tenantPageSize, "window.Pages['account-tenant'].setTenantPage") });
    return '<section class="platform-page tenant-page' + (aiDomain ? ' ai-tenant-page' : ' cloud-tenant-page') + '" data-anno="tenant-capability-management" data-anno-page="tenants" data-anno-label="统一租户与智能外呼计费" data-anno-kind="region" data-anno-fields="FLD-007,FLD-009,FLD-010,FLD-011">' +
      ui.pageHeader('租户管理', editable ? '管理总部与门店租户的产品授权和使用状态。' : '查看本租户资料、已开通产品和使用状态。') +
      '<div class="filter-panel tenant-filter-panel"><label class="field"><span>租户名称</span><input id="tenantKeyword" value="' + esc(tenantKeyword) + '" placeholder="请输入租户名称"></label>' +
      '<label class="field"><span>租户类型</span><select id="tenantTypeFilter"><option value="">全部</option><option value="HEADQUARTERS"' + (tenantType === 'HEADQUARTERS' ? ' selected' : '') + '>总部</option><option value="STORE"' + (tenantType === 'STORE' ? ' selected' : '') + '>门店</option></select></label>' +
      '<label class="field"><span>可用产品</span><select id="tenantCapabilityFilter"><option value="">全部</option><option value="AI_OUTBOUND"' + (tenantCapability === 'AI_OUTBOUND' ? ' selected' : '') + '>智能外呼</option><option value="CLOUD_CONTACT_CENTER"' + (tenantCapability === 'CLOUD_CONTACT_CENTER' ? ' selected' : '') + '>云呼叫</option></select></label>' +
      (aiDomain ? '<label class="field"><span>商用/试用</span><select id="tenantCommercialFilter">' + [['','全部'],['commercial','商用'],['trial','试用']].map(function (p) { return '<option value="' + p[0] + '"' + (tenantCommercial === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select></label><label class="field"><span>服务状态</span><select id="tenantServiceFilter">' + [['','全部'],['not_opened','未开通'],['pending','待生效'],['active','有效'],['expired','已过期']].map(function (p) { return '<option value="' + p[0] + '"' + (tenantService === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select></label>' : '') +
      '<label class="field"><span>状态</span><select id="tenantStatusFilter"><option value="">全部</option><option' + (tenantStatus === '启用' ? ' selected' : '') + '>启用</option><option' + (tenantStatus === '停用' ? ' selected' : '') + '>停用</option></select></label>' +
      '<div class="filter-actions"><button class="btn" onclick="window.Pages[\'account-tenant\'].resetTenantFilters()">重置</button><button class="btn btn-primary" onclick="window.Pages[\'account-tenant\'].queryTenants()">查询</button></div></div>' +
      '<div class="tenant-table-shell">' + ui.toolbar(editable ? '<button class="btn btn-primary" onclick="window.Pages[\'account-tenant\'].openTenant()">+ 新建</button><button class="btn" onclick="window.Pages[\'account-tenant\'].exportTenants()">导出</button>' : '<button class="btn" onclick="window.Pages[\'account-tenant\'].exportTenants()">导出</button>', '<button class="btn btn-quiet" onclick="window.Pages[\'account-tenant\'].refreshTenants()">↻ 刷新</button><span>' + ui.help('客户/品牌用于区分服务对象；同一客户/品牌可以供多个总部和门店租户共同使用。', '租户管理说明') + '</span>') + body + '</div>' +
    '</section>';
  }

  function render(options) {
    view = options && options.view || view;
    if (!AppState.canMenu(view === 'tenants' ? 'tenants' : 'accounts')) return ui.empty('当前无权访问此页面');
    return view === 'tenants' ? renderTenants() : renderAccounts();
  }

  function queryAccounts() {
    accountKeyword = (document.getElementById('accountKeyword') || {}).value || '';
    accountKeyword = accountKeyword.trim();
    accountRole = (document.getElementById('accountRoleFilter') || {}).value || '';
    accountPage = 1;
    navigateTo('accounts');
  }

  function resetAccountFilters() {
    accountKeyword = '';
    accountRole = '';
    accountPage = 1;
    navigateTo('accounts');
  }

  function selectTenant(tenantId) {
    selectedTenantId = tenantId;
    accountPage = 1;
    accountKeyword = '';
    accountRole = '';
    navigateTo('accounts');
  }

  function setAccountPage(page) {
    accountPage = Math.max(1, Number(page) || 1);
    navigateTo('accounts');
  }

  function refreshAccounts() {
    showToast('账号列表已刷新', 'success');
    navigateTo('accounts');
  }

  function confirmToggleMember(id) {
    var member = CloudCallData.memberships.find(function (item) { return item.membershipId === id; });
    if (!canEditMember(member)) return;
    var key = contextKey();
    var next = member.status === '启用' ? '停用' : '启用';
    ui.confirm({
      id: 'member-status-confirm',
      title: next + '账号',
      body: '<p>确认' + next + '该账号在当前租户内的使用权限吗？账号在其他租户中的状态不会受到影响。</p>',
      confirmText: next,
      danger: next === '停用',
      onConfirm: function () { if (contextValid(key)) toggleMember(id); else showToast('工作范围已变化，请重新操作', 'warning'); }
    });
  }

  function queryTenants() {
    tenantKeyword = ((document.getElementById('tenantKeyword') || {}).value || '').trim();
    tenantType = (document.getElementById('tenantTypeFilter') || {}).value || '';
    tenantCapability = (document.getElementById('tenantCapabilityFilter') || {}).value || '';
    tenantStatus = (document.getElementById('tenantStatusFilter') || {}).value || '';
    tenantCommercial = (document.getElementById('tenantCommercialFilter') || {}).value || '';
    tenantService = (document.getElementById('tenantServiceFilter') || {}).value || '';
    tenantPage = 1;
    navigateTo('tenants');
  }

  function resetTenantFilters() {
    tenantKeyword = '';
    tenantType = '';
    tenantCapability = '';
    tenantStatus = '';
    tenantCommercial = '';
    tenantService = '';
    tenantPage = 1;
    navigateTo('tenants');
  }

  function setTenantPage(page) {
    tenantPage = Math.max(1, Number(page) || 1);
    navigateTo('tenants');
  }

  function refreshTenants() {
    showToast('租户列表已刷新', 'success');
    navigateTo('tenants');
  }

  function exportTenants() {
    showToast('租户列表已按当前筛选条件导出', 'success');
  }

  function confirmToggleTenant(id) {
    var tenant = CloudCallData.tenants.find(function (item) { return item.tenantId === id; });
    if (!tenant || !AppState.isSuper() || !tenants().includes(tenant)) return;
    var key = contextKey();
    var next = tenant.status === '启用' ? '停用' : '启用';
    ui.confirm({
      id: 'tenant-status-confirm',
      title: next + '租户',
      body: '<p>确认' + next + '“' + esc(tenant.name) + '”吗？停用后，该租户账号将无法进入已授权产品。</p>',
      confirmText: next,
      danger: next === '停用',
      onConfirm: function () {
        if (!contextValid(key) || !AppState.isSuper() || !tenants().includes(tenant)) return showToast('工作范围已变化，请重新操作', 'warning');
        var before = tenant.status;
        tenant.status = next;
        CloudCallRuntime.addAudit('切换租户状态', tenant.tenantId, tenant.tenantId, before, next);
        AppState.persistManagementData();
        CloudCallRuntime.touch();
        showToast('租户已' + next, 'success');
        navigateTo('tenants');
      }
    });
  }

  function tenantOptions(selectedId) {
    return tenants().map(function (tenant) {
      return '<option value="' + esc(tenant.tenantId) + '"' + (tenant.tenantId === selectedId ? ' selected' : '') + '>' + esc(tenant.name) + '（' + esc(tenant.organizationLabel) + '）</option>';
    }).join('');
  }

  function roleOptions(selected) {
    return '<option value="OPERATOR"' + (selected === 'OPERATOR' ? ' selected' : '') + '>运营</option><option value="ADMIN"' + (selected === 'ADMIN' ? ' selected' : '') + '>管理员</option>';
  }

  function openAddMember() {
    AccountTenantForms.openAccount(ensureSelectedTenant());
  }

  function validPassword(value) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(value || '');
  }

  function editMember(id) {
    var member = CloudCallData.memberships.find(function (item) { return item.membershipId === id; });
    if (!canEditMember(member)) {
      showToast('当前范围无权编辑该成员', 'warning');
      return;
    }
    var account = CloudCallRuntime.account(member.accountId);
    var tenant = CloudCallRuntime.tenant(member.tenantId);
    if (!account || !tenant) return;
    editingMemberId = id;
    editingMemberContext = { key: contextKey(), accountId: member.accountId, tenantId: member.tenantId };
    var globalEditable = AppState.isSuper();
    currentAvatarDataUrl = account.avatar || '';
    AccountTenantForms.openAccountEdit(account, tenant, member, globalEditable);
  }

  function saveMemberEdit() {
    var member = CloudCallData.memberships.find(function (item) { return item.membershipId === editingMemberId; });
    var account = member && CloudCallRuntime.account(member.accountId);
    if (!member || !account || !document.getElementById('member-edit') || !contextValid(editingMemberContext?.key) || !canEditMember(member) ||
      member.accountId !== editingMemberContext.accountId || member.tenantId !== editingMemberContext.tenantId) return showToast('工作范围或成员权限已变化，请重新打开表单', 'warning');
    var globalEditable = AppState.isSuper();
    var nickname = globalEditable ? ((document.getElementById('editAccountNickname') || {}).value || '').trim() : (account.nickname || account.name);
    var username = globalEditable ? ((document.getElementById('editAccountUsername') || {}).value || '').trim() : account.loginUsername;
    var mobile = globalEditable ? ((document.getElementById('editAccountMobile') || {}).value || '').trim() : account.loginMobile;
    var password = globalEditable ? (document.getElementById('editAccountPassword') || {}).value || '' : '';
    var memberRole = document.querySelector('input[name="editMemberRole"]:checked')?.value;
    var memberStatus = document.querySelector('input[name="editMemberStatus"]:checked')?.value;
    var fieldError = AccountTenantForms.fieldError;
    ['editAccountNickname', 'editAccountUsername', 'editAccountMobile', 'editAccountPassword', 'editMemberRole', 'editMemberStatus'].forEach(function (id) { fieldError(id, ''); });
    if (!['ADMIN', 'OPERATOR'].includes(memberRole)) return fieldError('editMemberRole', '请选择租户角色');
    if (!['启用', '停用'].includes(memberStatus)) return fieldError('editMemberStatus', '请选择状态');
    if (!nickname || nickname.length > 20) {
      return fieldError('editAccountNickname', '请输入 1—20 字账号昵称');
    }
    if (!/^1\d{10}$/.test(mobile)) {
      return fieldError('editAccountMobile', '请输入正确的 11 位手机号码');
    }
    if (!/^[A-Za-z0-9._-]{4,32}$/.test(username)) {
      return fieldError('editAccountUsername', '账号需为 4—32 位字母、数字或 . _ -');
    }
    if (CloudCallData.accounts.some(function (item) { return item.accountId !== account.accountId && item.loginUsername === username; })) {
      return fieldError('editAccountUsername', '该账号已被其他账号使用');
    }
    if (CloudCallData.accounts.some(function (item) { return item.accountId !== account.accountId && item.loginMobile === mobile; })) {
      return fieldError('editAccountMobile', '该手机号已被其他账号使用');
    }
    if (password && !validPassword(password)) {
      return fieldError('editAccountPassword', '密码需包含大小写字母、数字和符号，长度 8—16 位');
    }
    var before = (account.nickname || account.name) + ' / ' + roleNames[member.roleCode] + ' / ' + member.status;
    var updater = AppState.account().nickname || AppState.account().name, stamp = nowText();
    if (globalEditable) {
      account.nickname = nickname;
      account.loginUsername = username;
      account.loginMobile = mobile;
      account.mobile = maskMobile(mobile);
      account.avatar = currentAvatarDataUrl;
      account.updatedBy = updater;
      account.updatedAt = stamp;
      if (password) account.password = password;
    }
    member.roleCode = memberRole;
    member.status = memberStatus;
    member.updatedBy = updater;
    member.updatedAt = stamp;
    CloudCallRuntime.addAudit('编辑账号资料与租户成员', account.accountId, member.tenantId, before, nickname + ' / ' + roleNames[member.roleCode] + ' / ' + member.status);
    PlatformUI.closeLayer('member-edit');
    editingMemberId = ''; editingMemberContext = null;
    AppState.persistManagementData();
    CloudCallRuntime.touch();
    showToast(globalEditable ? '账号资料与当前租户角色已更新' : '当前租户成员权限已更新，全局账号资料保持不变', 'success');
    navigateTo('accounts');
  }

  function toggleMember(id) {
    var member = CloudCallData.memberships.find(function (item) { return item.membershipId === id; });
    if (!canEditMember(member)) return;
    var before = member.status;
    member.status = member.status === '启用' ? '停用' : '启用';
    member.updatedBy = AppState.account().nickname || AppState.account().name;
    member.updatedAt = nowText();
    CloudCallRuntime.addAudit('切换租户成员状态', member.accountId, member.tenantId, before, member.status);
    AppState.persistManagementData();
    CloudCallRuntime.touch();
    showToast('成员状态已更新为' + member.status, 'success');
    navigateTo('accounts');
  }

  function triggerAvatarUpload() {
    if (!AppState.isSuper() || !contextValid(editingMemberContext?.key)) return;
    var input = document.getElementById('accountAvatarInput');
    if (input) input.click();
  }

  function onAvatarSelected(event) {
    if (!AppState.isSuper() || !contextValid(editingMemberContext?.key)) return;
    var context = editingMemberContext;
    var file = event && event.target && event.target.files && event.target.files[0];
    if (!file) return;
    if (file.type.indexOf('image/') !== 0) {
      showToast('头像仅支持图片文件', 'warning');
      event.target.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      if (editingMemberContext !== context || !contextValid(context.key) || !AppState.isSuper()) return;
      currentAvatarDataUrl = reader.result;
      var preview = document.getElementById('accountAvatarPreview');
      if (preview) preview.innerHTML = '<img src="' + esc(currentAvatarDataUrl) + '" alt="头像预览">';
    };
    reader.readAsDataURL(file);
  }

  function togglePassword(id) {
    var input = document.getElementById(id);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  function resetPasswordField() {
    if (!AppState.isSuper() || !contextValid(editingMemberContext?.key)) return;
    var input = document.getElementById('editAccountPassword');
    if (input) {
      input.value = DEFAULT_PASSWORD;
      input.type = 'text';
      showToast('已填入现有默认密码，保存后才会生效', 'info');
    }
  }

  function openTenant(id) {
    AccountTenantForms.openTenant(id);
  }

  function saveTenant() {
    AccountTenantForms.saveTenant();
  }

  function canManageBilling() { return AppState.get().activeDomain === 'AI_OUTBOUND' && AppState.canAction('ai.billing.manage'); }
  function openBilling(id) { return TenantBilling.open(id); }

  window.Pages = window.Pages || {};
  window.Pages['account-tenant'] = {
    render: render,
    init: function () {},
    queryAccounts: queryAccounts,
    resetAccountFilters: resetAccountFilters,
    selectTenant: selectTenant,
    setAccountPage: setAccountPage,
    refreshAccounts: refreshAccounts,
    openAccountSeat: function (id) {
      var member = CloudCallData.memberships.find(function (item) { return item.membershipId === id; });
      var tenant = member && CloudCallRuntime.tenant(member.tenantId);
      if (!member || !tenant || member.tenantId !== selectedTenantId || !canEditMember(member)) return showToast('当前账号范围已变化，请刷新列表', 'warning');
      AccountSeat.open(member.accountId, member.tenantId, tenant.instanceId);
    },
    confirmToggleMember: confirmToggleMember,
    queryTenants: queryTenants,
    resetTenantFilters: resetTenantFilters,
    setTenantPage: setTenantPage,
    refreshTenants: refreshTenants,
    exportTenants: exportTenants,
    confirmToggleTenant: confirmToggleTenant,
    openAddMember: openAddMember,
    editMember: editMember,
    saveMemberEdit: saveMemberEdit,
    toggleMember: toggleMember,
    triggerAvatarUpload: triggerAvatarUpload,
    onAvatarSelected: onAvatarSelected,
    togglePassword: togglePassword,
    resetPasswordField: resetPasswordField,
    openTenant: openTenant,
    saveTenant: saveTenant,
    openBilling: openBilling
  };
})();
