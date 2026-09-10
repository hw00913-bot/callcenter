/**
 * js/pages/scene-block.js — 外呼拦截（黑名单管理）
 * 移植电声接入参照物的黑名单分组/号码/电声平台同步配置功能。
 */
(function () {
  'use strict';

  var activeGroupId = 'harass';
  var activeTenantId = '';
  var tenantStores = Object.create(null);
  var groupKeyword = '';
  var filters = { phone: '', addType: 'all', status: 'all', start: '', end: '' };
  var selectedPhones = [];
  var activeModal = null;
  var editingGroupId = null;
  var pendingAction = null;

  var platformCatalog = [
    { code: '电声', name: '电声平台', available: true, codePrefix: 'NISSAN' }
  ];

  var baseGroups = (window.MockBlockGroups || []).map(function (g) {
    return {
      id: g.id,
      name: g.name,
      desc: g.desc,
      expire: g.expire,
      count: 0,
      platformBindings: (g.platformBindings || []).map(function (b) {
        return {
          platformCode: b.platformCode || '电声',
          externalGroupCode: b.externalGroupCode,
          externalGroupId: b.externalGroupId,
          externalGroupName: b.externalGroupName || g.name,
          status: b.status,
          recordCount: b.recordCount,
          lastSync: b.lastSync,
          lastError: b.lastError
        };
      })
    };
  });

  var baseRows = (window.MockBlockRows || []).map(function (r) {
    return {
      phone: r.phone,
      name: r.name,
      groupId: r.groupId,
      addType: r.addType,
      reason: r.reason,
      source: r.source,
      sourceType: r.sourceType,
      creator: r.creator,
      createdAt: r.createdAt,
      effective: r.effective,
      platformSync: (r.platformSync || {})
    };
  });

  var groups = [];
  var rows = [];
  var addTypeLabels = { OTHER: '普通添加', INTENT: '意向保护', DECLINE: '明确拒绝' };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function tenantOptions() {
    var access = window.AppState && window.AppState.effectiveAccess ? window.AppState.effectiveAccess() : { tenantIds: [] };
    var ids = access.tenantIds || [];
    var catalog = (window.CloudCallData && window.CloudCallData.tenants) || [];
    return ids.map(function (tenantId) {
      return catalog.find(function (item) { return item.tenantId === tenantId; }) || { tenantId: tenantId, name: tenantId };
    });
  }

  function ensureTenantStore(tenantId) {
    if (!tenantStores[tenantId]) {
      tenantStores[tenantId] = {
        groups: clone(baseGroups),
        rows: clone(baseRows),
        activeGroupId: baseGroups.length ? baseGroups[0].id : ''
      };
    }
    return tenantStores[tenantId];
  }

  function persistTenantStore() {
    if (!activeTenantId || !tenantStores[activeTenantId]) return;
    tenantStores[activeTenantId].groups = groups;
    tenantStores[activeTenantId].rows = rows;
    tenantStores[activeTenantId].activeGroupId = activeGroupId;
  }

  function activateTenantStore(tenantId) {
    var options = tenantOptions();
    var allowed = options.some(function (item) { return item.tenantId === tenantId; });
    var nextTenantId = allowed ? tenantId : (options[0] ? options[0].tenantId : 'NO_TENANT');
    if (nextTenantId === activeTenantId && groups.length) return;
    persistTenantStore();
    activeTenantId = nextTenantId;
    var store = ensureTenantStore(nextTenantId);
    groups = store.groups;
    rows = store.rows;
    activeGroupId = groups.some(function (item) { return item.id === store.activeGroupId; }) ? store.activeGroupId : (groups[0] ? groups[0].id : '');
    selectedPhones = [];
  }

  function renderTenantScope() {
    var options = tenantOptions();
    var current = options.find(function (item) { return item.tenantId === activeTenantId; }) || options[0] || { name: '无可用租户', tenantId: '' };
    var isSuper = window.AppState && window.AppState.isSuper && window.AppState.isSuper();
    var control = isSuper && options.length > 1
      ? '<select class="filter-select" style="width:220px" onchange="window.Pages[\'scene-block\'].switchTenant(this.value)">' + options.map(function (item) { return '<option value="' + escapeHtml(item.tenantId) + '"' + (item.tenantId === activeTenantId ? ' selected' : '') + '>' + escapeHtml(item.name) + '</option>'; }).join('') + '</select>'
      : '<strong>' + escapeHtml(current.name) + '</strong>';
    return '<div class="block-tenant-scope" data-anno-page="ai-blocklist" data-anno-label="租户黑名单范围" data-anno-kind="scope" style="display:flex;align-items:center;gap:14px;margin:0 0 16px;padding:12px 16px;border:1px solid #d9e7f7;border-radius:4px;background:#f7fbff;color:#4e5969"><span>当前黑名单范围</span>' + control + '<span style="color:#86909c">号码按租户隔离；超级管理员一次查看一个租户，避免跨租户误操作。</span></div>';
  }

  function sync(status, lastSync, lastError) {
    return { status: status, lastSync: lastSync, lastError: lastError };
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char];
    });
  }

  function nowText() {
    var date = new Date();
    var pad = function (value) { return String(value).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function currentGroup() {
    return groups.find(function (item) { return item.id === activeGroupId; }) || groups[0];
  }

  function platformByCode(code) {
    return platformCatalog.find(function (item) { return item.code === code || item.name.indexOf(code) >= 0; }) || { code: '电声', name: '电声平台', codePrefix: 'NISSAN' };
  }

  function bindingFor(group, code) {
    return group.platformBindings.find(function (item) { return item.platformCode === code || item.platformCode === '电声'; });
  }

  function enabledPlatformNames(group) {
    return group.platformBindings.map(function (item) { return platformByCode(item.platformCode).name; });
  }

  function overallBindingStatus(group) {
    if (!group.platformBindings.length) return '仅本地';
    if (group.platformBindings.some(function (item) { return item.status === '同步异常' || item.status === '同步失败'; })) return '同步异常';
    if (group.platformBindings.some(function (item) { return item.status === '待首条号码'; })) return '待首条号码';
    if (group.platformBindings.some(function (item) { return item.status === '待同步' || item.status === '同步中'; })) return '待同步';
    return '已同步';
  }

  function overallRowStatus(item, group) {
    if (!group.platformBindings.length) return '仅本地';
    var statuses = group.platformBindings.map(function (itemBinding) {
      return (item.platformSync[itemBinding.platformCode] || item.platformSync['电声'] || {}).status || '待同步';
    });
    if (statuses.some(function (status) { return status === '同步失败'; })) return '同步失败';
    if (statuses.some(function (status) { return status === '待同步' || status === '同步中'; })) return statuses.indexOf('同步中') >= 0 ? '同步中' : '待同步';
    return '已同步';
  }

  function refreshCounts() {
    groups.forEach(function (group) {
      var groupRows = rows.filter(function (item) { return item.groupId === group.id; });
      group.count = groupRows.length;
      group.platformBindings.forEach(function (itemBinding) {
        itemBinding.recordCount = groupRows.filter(function (item) {
          var syncInfo = item.platformSync[itemBinding.platformCode] || item.platformSync['电声'];
          return (syncInfo || {}).status === '已同步';
        }).length;
      });
    });
  }

  function statusClass(status) {
    if (status === '已同步') return ' success';
    if (status === '同步异常' || status === '同步失败') return ' error';
    if (status === '待同步' || status === '同步中' || status === '待首条号码') return ' warning';
    return ' local';
  }

  function statusBadge(status) {
    return '<span class="block-status' + statusClass(status) + '">' + escapeHtml(status) + '</span>';
  }

  function renderGroups() {
    var list = groups.filter(function (group) { return group.name.indexOf(groupKeyword) >= 0; });
    if (!list.length) return '<div class="block-group-empty">未找到匹配的分组</div>';
    return list.map(function (group) {
      var platformText = group.platformBindings.length ? '电声平台已启用' : '未启用';
      return '<div class="block-group-card' + (group.id === activeGroupId ? ' active' : '') + '" onclick="window.Pages[\'scene-block\'].selectGroup(\'' + group.id + '\')">' +
        '<div class="block-group-title-row"><span class="block-group-title">' + escapeHtml(group.name) + '</span><span class="block-group-count">(' + group.count + ')</span>' +
        '<span class="block-group-actions"><button title="编辑分组" onclick="event.stopPropagation();window.Pages[\'scene-block\'].openEditGroup(\'' + group.id + '\')">✎</button>' +
        '<button title="删除分组" onclick="event.stopPropagation();window.Pages[\'scene-block\'].requestRemoveGroup(\'' + group.id + '\')">⌫</button></span></div>' +
        '<div class="block-group-meta">描述：' + escapeHtml(group.desc || '--') + '</div>' +
        '<div class="block-group-meta">有效期：' + escapeHtml(group.expire) + '</div>' +
        '<div class="block-group-channel">平台同步：' + platformText + ' ' + statusBadge(overallBindingStatus(group)) + '</div>' +
        '</div>';
    }).join('');
  }

  function filteredRows() {
    var group = currentGroup();
    return rows.filter(function (item) {
      if (item.groupId !== activeGroupId || (filters.phone && item.phone.indexOf(filters.phone) < 0) || (filters.addType !== 'all' && item.addType !== filters.addType)) return false;
      if (filters.status !== 'all' && overallRowStatus(item, group) !== filters.status) return false;
      var day = item.createdAt.slice(0, 10);
      return !(filters.start && day < filters.start) && !(filters.end && day > filters.end);
    });
  }

  function renderRows(list) {
    var group = currentGroup();
    if (!list.length) return '<tr><td colspan="10" class="block-empty">当前筛选条件下暂无黑名单号码</td></tr>';
    return list.map(function (item) {
      var status = overallRowStatus(item, group);
      var retry = status === '同步失败' || status === '待同步' ? '<button class="block-cell-sync-btn" onclick="window.Pages[\'scene-block\'].retryRecord(\'' + item.phone + '\')">重试</button>' : '';
      var syncInfo = item.platformSync['电声'] || (group.platformBindings[0] ? item.platformSync[group.platformBindings[0].platformCode] : null);
      var platformTag = group.platformBindings.length ? '<small>' + (syncInfo && syncInfo.status === '已同步' ? '电声已同步' : '电声待同步') + '</small>' : '';
      return '<tr>' +
        '<td><input type="checkbox"' + (selectedPhones.indexOf(item.phone) >= 0 ? ' checked' : '') + ' onchange="window.Pages[\'scene-block\'].toggleRowSelection(\'' + item.phone + '\',this.checked)"></td>' +
        '<td>' + item.phone + '</td>' +
        '<td>' + escapeHtml(group.name) + '</td>' +
        '<td>' + escapeHtml(addTypeLabels[item.addType]) + '</td>' +
        '<td title="' + escapeHtml(item.reason) + '">' + escapeHtml(item.reason || '--') + '</td>' +
        '<td>' + escapeHtml(item.creator) + '</td>' +
        '<td>' + item.createdAt + '</td>' +
        '<td>' + escapeHtml(item.effective) + '</td>' +
        '<td><div class="block-platform-status">' + statusBadge(status) + platformTag + retry + '</div></td>' +
        '<td><a href="#" onclick="event.preventDefault();window.Pages[\'scene-block\'].openRecordDetail(\'' + item.phone + '\')">详情</a> · <a href="#" onclick="event.preventDefault();window.Pages[\'scene-block\'].requestRemoveNumber(\'' + item.phone + '\')">移除</a></td>' +
        '</tr>';
    }).join('');
  }

  function renderAddTypeOptions(selected) {
    return Object.keys(addTypeLabels).map(function (key) {
      return '<option value="' + key + '"' + (selected === key ? ' selected' : '') + '>' + addTypeLabels[key] + '</option>';
    }).join('');
  }

  function renderBlacklist() {
    refreshCounts();
    var group = currentGroup();
    var list = filteredRows();
    var allChecked = list.length && list.every(function (item) { return selectedPhones.indexOf(item.phone) >= 0; }) ? ' checked' : '';
    var selection = selectedPhones.length ? '<div class="block-selection-bar"><strong>已选 ' + selectedPhones.length + ' 项</strong>' +
      '<button onclick="window.Pages[\'scene-block\'].openMoveModal()">移动分组</button>' +
      '<button onclick="window.Pages[\'scene-block\'].retrySelected()">重试同步</button>' +
      '<button class="danger" onclick="window.Pages[\'scene-block\'].requestRemoveSelected()">批量移除</button>' +
      '<a href="#" onclick="event.preventDefault();window.Pages[\'scene-block\'].clearSelection()">取消选择</a></div>' : '';
    return '<div class="scene-block-panel">' +
      '<aside class="block-left" data-anno-page="scene-block" data-anno-label="黑名单分组" data-anno-kind="region" data-anno-fields="FLD-070">' +
        '<div class="block-group-filter"><label>分组名称</label><div class="block-search-input"><input value="' + escapeHtml(groupKeyword) + '" placeholder="请输入" oninput="window.Pages[\'scene-block\'].setGroupKeyword(this.value)"><span>⌕</span></div></div>' +
        '<div class="block-group-summary"><span>共 ' + groups.length + ' 个分组，' + rows.length + ' 个号码</span><a href="#" onclick="event.preventDefault();window.Pages[\'scene-block\'].openAddGroup()">新建分组</a></div>' +
        '<div>' + renderGroups() + '</div>' +
      '</aside>' +
      '<main class="block-right">' +
        '<div class="block-current-title"><div><strong>' + escapeHtml(group.name) + '</strong><span>中台统一维护黑名单，电声外呼平台由系统自动同步。</span></div></div>' +
        '<div class="filter-bar" data-anno-page="scene-block" data-anno-label="黑名单筛选" data-anno-kind="region" data-anno-fields="FLD-071,FLD-073,FLD-074" style="margin-bottom:16px;padding:16px 20px;">' +
          '<div class="filter-item"><label>号码：</label><input id="blockPhoneFilter" class="filter-input" style="width:140px;" value="' + escapeHtml(filters.phone) + '" placeholder="请输入"></div>' +
          '<div class="filter-item"><label>添加类型：</label><select id="blockAddTypeFilter" class="filter-select" style="width:120px;"><option value="all">全部</option>' + renderAddTypeOptions(filters.addType) + '</select></div>' +
          '<div class="filter-item"><label>添加时间：</label><div class="filter-date-range"><input id="blockTimeStart" type="date" value="' + filters.start + '" style="width:110px;"><span class="sep">至</span><input id="blockTimeEnd" type="date" value="' + filters.end + '" style="width:110px;"></div></div>' +
          '<div class="btn-group"><button class="btn btn-default" onclick="window.Pages[\'scene-block\'].resetFilters()">重置</button><button class="btn btn-primary" onclick="window.Pages[\'scene-block\'].applyFilters()">搜索</button></div>' +
        '</div>' +
        '<div class="block-actions" data-anno-page="scene-block" data-anno-label="黑名单维护操作" data-anno-kind="region">' +
          '<button class="btn btn-primary" onclick="window.Pages[\'scene-block\'].openAddNumber()">新增号码</button>' +
          '<button class="btn btn-default" onclick="window.Pages[\'scene-block\'].openImportModal()">批量导入</button>' +
          '<button class="btn btn-default" onclick="window.Pages[\'scene-block\'].exportRows()">导出</button>' +
          '<span class="block-actions-spacer"></span>' +
          '<button class="btn btn-default" onclick="window.Pages[\'scene-block\'].openSyncSettings()">平台同步设置</button>' +
        '</div>' +
        selection +
        '<div class="block-result-summary">查询结果：共 ' + list.length + ' 条</div>' +
        '<div class="block-table-card"><table class="block-table block-blacklist-table" data-anno-page="ai-blocklist" data-anno-label="黑名单号码列表" data-anno-kind="table" data-anno-fields="FLD-026,FLD-027,FLD-028,FLD-029,FLD-030,FLD-031,FLD-032,FLD-033,FLD-034,FLD-035,FLD-036">' +
          '<thead><tr><th class="block-check-col"><label><input type="checkbox"' + allChecked + ' onchange="window.Pages[\'scene-block\'].toggleAllRows(this.checked)">全选</label></th><th>用户号码</th><th>所属分组</th><th>添加类型</th><th>添加原因</th><th>添加人</th><th>添加时间</th><th>有效期</th><th>平台同步</th><th>操作</th></tr></thead>' +
          '<tbody>' + renderRows(list) + '</tbody>' +
        '</table></div>' +
      '</main></div>';
  }

  function renderPage() {
    activateTenantStore(activeTenantId);
    return '<div class="scene-block-page" data-anno="ai-blocklist-management" data-anno-page="ai-blocklist" data-anno-label="智能外呼拦截管理" data-anno-kind="region" data-anno-fields="FLD-019,FLD-020,FLD-038"><div class="scene-block-header"><h2>外呼黑名单</h2><p>统一维护禁止外呼的手机号码，名单内的号码不会进行外呼。</p></div>' + renderTenantScope() + '<div id="sceneBlockContent">' + renderBlacklist() + '</div>' + (activeModal ? renderModal() : '') + '</div>';
  }

  function updatePage() {
    persistTenantStore();
    var page = document.querySelector('.scene-block-page');
    if (page) page.outerHTML = renderPage();
  }

  function modalShell(title, body, footer, className, subtitle) {
    var subtitleHtml = subtitle ? '<div class="block-modal-subtitle">' + escapeHtml(subtitle) + '</div>' : '';
    return '<div class="block-modal-mask" onclick="window.Pages[\'scene-block\'].closeModal()">' +
      '<div class="block-modal ' + (className || '') + '" onclick="event.stopPropagation()">' +
        '<div class="block-modal-head">' +
          '<div><div class="block-modal-title">' + title + '</div>' + subtitleHtml + '</div>' +
          '<button class="block-modal-close" aria-label="关闭" onclick="window.Pages[\'scene-block\'].closeModal()">✕</button>' +
        '</div>' +
        body + (footer || '') +
      '</div></div>';
  }

  function renderModal() {
    if (!activeModal) return '';
    if (activeModal.type === 'group') return renderGroupForm();
    if (activeModal.type === 'sync') return renderSyncSettings();
    if (activeModal.type === 'addPlatform') return renderAddPlatform();
    if (activeModal.type === 'platform') return renderPlatformDetail();
    if (activeModal.type === 'number') return renderNumberForm();
    if (activeModal.type === 'detail') return renderRecordDetail();
    if (activeModal.type === 'move') return renderMoveModal();
    if (activeModal.type === 'import') return renderImportModal();
    if (activeModal.type === 'confirm') return renderConfirmModal();
    return '';
  }

  function renderGroupForm() {
    var data = editingGroupId ? groups.find(function (item) { return item.id === editingGroupId; }) : { name: '', desc: '', expire: '永久' };
    var body = '<div class="block-form-body">' +
      '<div class="block-form-row required"><label>分组名称：</label><div class="block-field-wrap"><input id="blockGroupName" maxlength="50" value="' + escapeHtml(data.name) + '" placeholder="请输入分组名称"></div></div>' +
      '<div class="block-form-row"><label>分组描述：</label><div class="block-field-wrap block-textarea-wrap"><textarea id="blockGroupDesc" maxlength="200" placeholder="请输入描述">' + escapeHtml(data.desc) + '</textarea></div></div>' +
      '<div class="block-form-row required"><label>有效期：</label><select id="blockGroupExpire" class="block-form-select"><option' + (data.expire === '永久' ? ' selected' : '') + '>永久</option><option' + (data.expire === '7 天' ? ' selected' : '') + '>7 天</option><option' + (data.expire === '30 天' ? ' selected' : '') + '>30 天</option><option' + (data.expire === '90 天' ? ' selected' : '') + '>90 天</option></select></div>' +
      '<div class="block-form-tip">分组保存后，可在“平台同步设置”中配置需要下发的电声平台。</div></div>';
    return modalShell(editingGroupId ? '编辑黑名单分组' : '新建黑名单分组', body, '<div class="block-modal-footer"><button class="btn btn-default" onclick="window.Pages[\'scene-block\'].closeModal()">取消</button><button class="btn btn-primary" onclick="window.Pages[\'scene-block\'].submitGroup()">确定</button></div>', 'block-form-modal');
  }

  function renderSyncSettings() {
    var group = currentGroup();
    var table = group.platformBindings.length ? group.platformBindings.map(function (itemBinding, idx) {
      var platform = platformByCode(itemBinding.platformCode);
      var retryable = itemBinding.status === '同步异常' || itemBinding.status === '同步失败' || itemBinding.status === '待同步';
      var retryAction = retryable ? ' · <a href="#" onclick="event.preventDefault();window.Pages[\'scene-block\'].retryPlatform(\'' + itemBinding.platformCode + '\')">重试</a>' : '';
      return '<tr>' +
        '<td style="color:#8c8c8c;text-align:center;">' + (idx + 1) + '</td>' +
        '<td><strong>' + escapeHtml(platform.name) + '</strong></td>' +
        '<td><code>' + escapeHtml(itemBinding.externalGroupCode) + '</code></td>' +
        '<td>' + escapeHtml(itemBinding.externalGroupName || group.name) + '</td>' +
        '<td>' + statusBadge(itemBinding.status) + '</td>' +
        '<td>' + itemBinding.recordCount + ' 条</td>' +
        '<td>' + escapeHtml(itemBinding.lastSync || '-') + '</td>' +
        '<td style="white-space:nowrap;">' +
          '<a href="#" onclick="event.preventDefault();window.Pages[\'scene-block\'].openPlatformDetail(\'' + itemBinding.platformCode + '\')">详情</a>' +
          retryAction + ' · ' +
          '<a href="#" style="color:#ff4d4f;" onclick="event.preventDefault();window.Pages[\'scene-block\'].requestDisablePlatform(\'' + itemBinding.platformCode + '\')">停用</a>' +
        '</td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="8" class="block-empty">当前分组未启用平台同步，点击上方按钮添加</td></tr>';

    var body = '<div class="block-modal-body">' +
      '<div class="block-sync-overview">' +
        '<div class="block-sync-overview-item"><span>当前分组</span><strong>' + escapeHtml(group.name) + '</strong></div>' +
        '<div class="block-sync-overview-item"><span>整体状态</span>' + statusBadge(overallBindingStatus(group)) + '</div>' +
        '<div class="block-sync-overview-item"><span>已启用平台</span><strong>' + (group.platformBindings.length ? group.platformBindings.length + ' 个平台' : '未启用') + '</strong></div>' +
      '</div>' +
      '<div class="block-modal-section">' +
        '<div class="block-section-title">' +
          '<h3>已启用平台</h3>' +
          '<button class="btn btn-primary" onclick="window.Pages[\'scene-block\'].openAddPlatform()">添加平台</button>' +
        '</div>' +
        '<table class="block-map-table block-platform-table">' +
          '<thead><tr>' +
            '<th style="width:45px;text-align:center;">序号</th>' +
            '<th style="width:110px;">平台名称</th>' +
            '<th>平台分组编码</th>' +
            '<th>外部分组名称</th>' +
            '<th style="width:85px;">同步状态</th>' +
            '<th style="width:85px;">已同步号码</th>' +
            '<th style="width:130px;">最近同步时间</th>' +
            '<th style="width:140px;">操作</th>' +
          '</tr></thead>' +
          '<tbody>' + table + '</tbody>' +
        '</table>' +
      '</div>' +
      '<div class="block-sync-note">' +
        '<strong>📌 同步规则与边界说明</strong>' +
        '<p>1. 中台黑名单分组和号码为业务主数据，各平台独立记录分组编码与下发同步结果，单平台失败不影响其他平台；<br>' +
        '2. 新增或移动号码将自动向已启用的所有平台同步；移除号码时将先解除所有平台远端黑名单，全部成功后再清除本地。</p>' +
      '</div>' +
    '</div>';

    return modalShell('平台同步设置', body, '<div class="block-modal-footer"><button class="btn btn-default" onclick="window.Pages[\'scene-block\'].closeModal()">关闭</button></div>', 'block-sync-modal', '当前分组：' + group.name);
  }

  function renderAddPlatform() {
    var group = currentGroup();
    var available = platformCatalog.filter(function (platform) { return platform.available && !bindingFor(group, platform.code); });
    var cards = available.length ? available.map(function (platform, index) {
      return '<label class="block-platform-option' + (index === 0 ? ' active' : '') + '">' +
        '<input type="radio" name="blockPlatform" value="' + platform.code + '"' + (index === 0 ? ' checked' : '') + '>' +
        '<span><strong>' + escapeHtml(platform.name) + '</strong></span>' +
      '</label>';
    }).join('') : '<div class="block-empty" style="padding:24px 0;text-align:center;color:#999;">所有已接入平台均已启用</div>';

    var body = '<div class="block-modal-body">' +
      '<div class="block-import-alert">只展示已完成系统接入的平台，平台字段转换由后台适配器处理。</div>' +
      '<div class="block-platform-options">' + cards + '</div>' +
    '</div>';

    var footer = '<div class="block-modal-footer">' +
      '<button class="btn btn-default" onclick="window.Pages[\'scene-block\'].openSyncSettings()">取消</button>' +
      (available.length ? '<button class="btn btn-primary" onclick="window.Pages[\'scene-block\'].submitAddPlatform()">启用并同步</button>' : '') +
    '</div>';

    return modalShell('添加同步平台', body, footer, 'block-form-modal block-short-modal', '当前分组：' + group.name);
  }

  function renderPlatformDetail() {
    var group = currentGroup();
    var itemBinding = bindingFor(group, activeModal.platformCode || '电声');
    if (!itemBinding) return renderSyncSettings();
    var platform = platformByCode(itemBinding.platformCode);

    var body = '<div class="block-modal-body">' +
      '<div class="block-sync-overview">' +
        '<div class="block-sync-overview-item"><span>同步平台</span><strong>' + escapeHtml(platform.name) + '</strong></div>' +
        '<div class="block-sync-overview-item"><span>同步状态</span>' + statusBadge(itemBinding.status) + '</div>' +
        '<div class="block-sync-overview-item"><span>已同步号码</span><strong>' + itemBinding.recordCount + ' 条</strong></div>' +
      '</div>' +
      '<div class="block-info-grid block-info-grid-3">' +
        '<div class="block-info-item"><span>中台分组</span><strong>' + escapeHtml(group.name) + '</strong></div>' +
        '<div class="block-info-item"><span>平台分组编码</span><strong>' + escapeHtml(itemBinding.externalGroupCode) + '</strong></div>' +
        '<div class="block-info-item"><span>平台分组 ID</span><strong>' + escapeHtml(itemBinding.externalGroupId || '首次同步后生成') + '</strong></div>' +
        '<div class="block-info-item"><span>外部分组名称</span><strong>' + escapeHtml(itemBinding.externalGroupName || group.name) + '</strong></div>' +
        '<div class="block-info-item"><span>最近同步时间</span><strong>' + escapeHtml(itemBinding.lastSync || '-') + '</strong></div>' +
        '<div class="block-info-item"><span>生效范围</span><strong>本租户所有外呼场景</strong></div>' +
      '</div>' +
      (itemBinding.lastError ? '<div class="block-sync-error"><strong>最近失败原因</strong><span>' + escapeHtml(itemBinding.lastError) + '</span></div>' : '') +
      '<div class="block-sync-note">' +
        '<strong>电声平台对接规则</strong>' +
        '<p>电声以 groupCode 作为外部唯一键，首个号码同步时自动建组；groupId 由电声接口只读回填。已同步的黑名单号码将在电声外呼前执行前置拦截。</p>' +
      '</div>' +
    '</div>';

    var retryButton = itemBinding.status === '同步异常' || itemBinding.status === '同步失败' || itemBinding.status === '待同步' ?
      '<button class="btn btn-primary" onclick="window.Pages[\'scene-block\'].retryPlatform(\'' + platform.code + '\')">重新同步</button>' : '';

    var footer = '<div class="block-modal-footer">' +
      '<button class="btn btn-danger-ghost" onclick="window.Pages[\'scene-block\'].requestDisablePlatform(\'' + platform.code + '\')">停用同步</button>' +
      retryButton +
      '<button class="btn btn-default" onclick="window.Pages[\'scene-block\'].openSyncSettings()">返回</button>' +
    '</div>';

    return modalShell('电声平台同步详情', body, footer, 'block-sync-modal block-detail-modal', '当前分组：' + group.name);
  }

  function renderPhoneInputs() {
    return activeModal.phones.map(function (phone, index) {
      return '<div class="block-phone-row">' +
        '<input inputmode="numeric" maxlength="11" value="' + escapeHtml(phone) + '" placeholder="请输入11位手机号" oninput="window.Pages[\'scene-block\'].updatePhone(' + index + ',this.value)">' +
        '<button title="删除" onclick="window.Pages[\'scene-block\'].removePhoneInput(' + index + ')">×</button>' +
      '</div>';
    }).join('') + '<a class="block-add-phone' + (activeModal.phones.length >= 10 ? ' disabled' : '') + '" href="#" onclick="event.preventDefault();window.Pages[\'scene-block\'].addPhoneInput()">+ 添加号码（' + activeModal.phones.length + '/10）</a>';
  }

  function renderNumberForm() {
    var group = currentGroup();
    var names = enabledPlatformNames(group);
    var tip = names.length ? '保存后立即在本地生效，并自动同步至电声平台。' : '保存后立即在本地生效，当前分组未启用电声平台同步。';
    var body = '<div class="block-form-body">' +
      '<div class="block-form-row required"><label>所属分组：</label><input class="block-form-input disabled" value="' + escapeHtml(group.name) + '" disabled readonly></div>' +
      '<div class="block-form-row required block-form-row-start"><label>电话号码：</label><div class="block-phone-list">' + renderPhoneInputs() + '<div class="block-input-hint">一次最多添加 10 个号码，重复号码将自动跳过。</div></div></div>' +
      '<div class="block-form-row required"><label>添加类型：</label><select id="blockNumberAddType" class="block-form-select">' + renderAddTypeOptions('OTHER') + '</select></div>' +
      '<div class="block-form-row block-form-row-start"><label>添加原因：</label><div class="block-field-wrap block-textarea-wrap"><textarea id="blockNumberReason" maxlength="200" placeholder="请输入添加原因"></textarea></div></div>' +
      '<div class="block-form-row"><label>有效期：</label><span class="block-static-value">' + escapeHtml(group.expire) + '</span></div>' +
      '<div class="block-form-tip">' + escapeHtml(tip) + '</div></div>';
    return modalShell('新增黑名单号码', body, '<div class="block-modal-footer"><button class="btn btn-default" onclick="window.Pages[\'scene-block\'].closeModal()">取消</button><button class="btn btn-primary" onclick="window.Pages[\'scene-block\'].submitNumber()">保存并生效</button></div>', 'block-form-modal');
  }

  function renderRecordDetail() {
    var item = rows.find(function (entry) { return entry.phone === activeModal.phone; });
    if (!item) return '';
    var group = groups.find(function (entry) { return entry.id === item.groupId; }) || currentGroup();
    var fields = [['用户号码', item.phone], ['所属分组', group.name], ['添加类型', addTypeLabels[item.addType]], ['添加原因', item.reason || '-'], ['添加人', item.creator], ['添加时间', item.createdAt], ['有效期', item.effective]];
    var grid = fields.map(function (field) { return '<div class="block-info-item"><span>' + field[0] + '</span><strong>' + escapeHtml(field[1]) + '</strong></div>'; }).join('');
    var platformRows = group.platformBindings.length ? group.platformBindings.map(function (itemBinding) {
      var itemSync = item.platformSync[itemBinding.platformCode] || item.platformSync['电声'] || sync('待同步', '-', '');
      return '<tr><td>' + escapeHtml(platformByCode(itemBinding.platformCode).name) + '</td><td><code>' + escapeHtml(itemBinding.externalGroupCode) + '</code></td><td>' + statusBadge(itemSync.status) + '</td><td>' + escapeHtml(itemSync.lastSync || '-') + '</td><td>' + (itemSync.lastError ? escapeHtml(itemSync.lastError) : '-') + '</td></tr>';
    }).join('') : '<tr><td colspan="5" class="block-empty">当前分组未启用电声平台同步</td></tr>';
    return modalShell('黑名单号码详情', '<div class="block-modal-body"><div class="block-modal-section"><h3>黑名单信息</h3><div class="block-info-grid block-info-grid-3">' + grid + '</div></div><div class="block-modal-section"><h3>平台同步明细</h3><table class="block-map-table"><thead><tr><th>平台</th><th>平台分组编码</th><th>状态</th><th>最近同步</th><th>失败原因</th></tr></thead><tbody>' + platformRows + '</tbody></table></div></div>', '<div class="block-modal-footer">' + (overallRowStatus(item, group) === '同步失败' ? '<button class="btn btn-primary" onclick="window.Pages[\'scene-block\'].retryRecord(\'' + item.phone + '\')">重试失败平台</button>' : '') + '<button class="btn btn-default" onclick="window.Pages[\'scene-block\'].closeModal()">关闭</button></div>', 'block-sync-modal block-detail-modal');
  }

  function renderMoveModal() {
    var options = groups.filter(function (group) { return group.id !== activeGroupId; }).map(function (group) {
      return '<option value="' + group.id + '">' + escapeHtml(group.name) + (group.platformBindings.length ? '（已启用电声平台）' : '（仅本地）') + '</option>';
    }).join('');
    return modalShell('移动黑名单号码', '<div class="block-form-body block-compact-form"><div class="block-sync-note"><strong>移动后的处理</strong><p>本地分组立即更新，系统按原分组和目标分组的电声平台绑定分别生成删除与新增同步任务。</p></div><div class="block-form-row required"><label>目标分组：</label><select id="blockMoveTarget" class="block-form-select"><option value="">请选择</option>' + options + '</select></div><div class="block-form-tip">已选 ' + selectedPhones.length + ' 个号码</div></div>', '<div class="block-modal-footer"><button class="btn btn-default" onclick="window.Pages[\'scene-block\'].closeModal()">取消</button><button class="btn btn-primary" onclick="window.Pages[\'scene-block\'].submitMove()">确定移动</button></div>', 'block-form-modal block-short-modal');
  }

  function renderImportModal() {
    var group = currentGroup();
    var names = enabledPlatformNames(group);
    return modalShell('批量导入黑名单', '<div class="block-modal-body"><div class="block-import-alert">导入后号码将加入“' + escapeHtml(group.name) + '”。' + (names.length ? '系统将同步至电声平台。' : '') + '</div><div class="block-import-input-wrap"><label>手机号码</label><textarea id="blockImportPhones" placeholder="每行一个手机号，本次原型最多识别 50 个号码"></textarea></div><div class="block-form-row required"><label>添加类型：</label><select id="blockImportAddType" class="block-form-select">' + renderAddTypeOptions('OTHER') + '</select></div><div class="block-form-row"><label>添加原因：</label><input id="blockImportReason" class="block-form-input" maxlength="200" placeholder="请输入"></div></div>', '<div class="block-modal-footer"><button class="btn btn-default" onclick="window.Pages[\'scene-block\'].closeModal()">取消</button><button class="btn btn-primary" onclick="window.Pages[\'scene-block\'].submitImport()">开始导入</button></div>', 'block-form-modal');
  }

  function renderConfirmModal() {
    return modalShell(activeModal.heading || '操作确认', '<div class="block-confirm-body"><span class="block-confirm-icon">!</span><div><strong>' + escapeHtml(activeModal.title) + '</strong><p>' + activeModal.message + '</p></div></div>', '<div class="block-modal-footer"><button class="btn btn-default" onclick="window.Pages[\'scene-block\'].closeModal()">取消</button>' + (activeModal.blocked ? '' : '<button class="btn btn-danger" onclick="window.Pages[\'scene-block\'].confirmAction()">确认</button>') + '</div>', 'block-confirm-modal');
  }

  function makePlatformGroupCode(platform, group) {
    var suffix = String(group.id).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 24);
    return (platform.codePrefix || 'NISSAN') + '_' + (suffix || String(Date.now()).slice(-6));
  }

  function setModal(type, data) {
    activeModal = Object.assign({ type: type }, data || {});
    updatePage();
  }

  function selectGroup(id) {
    activeGroupId = id;
    selectedPhones = [];
    filters = { phone: '', addType: 'all', status: 'all', start: '', end: '' };
    updatePage();
  }

  function applyFilters() {
    filters.phone = document.getElementById('blockPhoneFilter').value;
    filters.addType = document.getElementById('blockAddTypeFilter').value;
    filters.start = document.getElementById('blockTimeStart').value;
    filters.end = document.getElementById('blockTimeEnd').value;
    if (filters.start && filters.end && filters.start > filters.end) return showToast('开始时间不能晚于结束时间', 'warning');
    selectedPhones = [];
    updatePage();
  }

  function submitGroup() {
    var name = document.getElementById('blockGroupName').value.trim();
    var desc = document.getElementById('blockGroupDesc').value.trim();
    var expire = document.getElementById('blockGroupExpire').value;
    if (!name) return showToast('请输入分组名称', 'warning');
    if (groups.some(function (item) { return item.name === name && item.id !== editingGroupId; })) return showToast('分组名称已存在', 'warning');
    if (editingGroupId) {
      var group = groups.find(function (item) { return item.id === editingGroupId; });
      group.name = name; group.desc = desc; group.expire = expire;
      showToast('分组已更新', 'success');
    } else {
      var id = 'group_' + Date.now();
      groups.unshift({ id: id, name: name, desc: desc, expire: expire, count: 0, platformBindings: [] });
      activeGroupId = id;
      showToast('分组已创建，可继续配置电声平台同步', 'success');
    }
    editingGroupId = null; activeModal = null; updatePage();
  }

  function submitAddPlatform() {
    var selected = document.querySelector('input[name="blockPlatform"]:checked');
    if (!selected) return showToast('请选择同步平台', 'warning');
    var group = currentGroup();
    var platform = platformByCode(selected.value);
    if (bindingFor(group, platform.code)) return showToast('该平台已启用', 'warning');

    var groupRows = rows.filter(function (item) { return item.groupId === group.id; });
    group.platformBindings.push({
      platformCode: platform.code,
      externalGroupCode: makePlatformGroupCode(platform, group),
      externalGroupId: '',
      externalGroupName: group.name,
      status: groupRows.length ? '待同步' : '待首条号码',
      recordCount: 0,
      lastSync: '-',
      lastError: ''
    });

    groupRows.forEach(function (item) {
      item.platformSync[platform.code] = sync('待同步', '-', '');
    });

    activeModal = null;
    updatePage();

    if (groupRows.length) {
      showToast(platform.name + '已启用，正在同步当前号码', 'success');
      setTimeout(function () { syncPlatform(group.id, platform.code); }, 700);
    } else {
      showToast(platform.name + '已启用，添加首个号码后创建平台分组', 'success');
    }
  }

  function syncPlatform(groupId, platformCode) {
    var group = groups.find(function (item) { return item.id === groupId; });
    var itemBinding = bindingFor(group, platformCode);
    if (!itemBinding) return;
    itemBinding.status = '已同步';
    itemBinding.externalGroupId = itemBinding.externalGroupId || 'DSG' + String(Date.now()).slice(-6);
    itemBinding.externalGroupName = group.name;
    itemBinding.lastSync = nowText();
    itemBinding.lastError = '';
    rows.filter(function (item) { return item.groupId === group.id; }).forEach(function (item) {
      if (!item.platformSync[platformCode] || item.platformSync[platformCode].status !== '已同步') {
        item.platformSync[platformCode] = sync('已同步', nowText(), '');
      }
    });
    refreshCounts();
    updatePage();
    showToast('电声平台同步完成', 'success');
  }

  function retryPlatform(platformCode) {
    var group = currentGroup();
    var itemBinding = bindingFor(group, platformCode);
    if (!itemBinding) return;
    itemBinding.status = '同步中';
    itemBinding.lastError = '';
    updatePage();
    showToast('已提交电声平台同步', 'info');
    setTimeout(function () { syncPlatform(group.id, platformCode); }, 700);
  }

  function submitNumber() {
    var group = currentGroup();
    var entered = activeModal.phones.map(function (phone) { return phone.trim(); }).filter(Boolean);
    var valid = entered.filter(function (phone) { return /^1\d{10}$/.test(phone); });
    if (!valid.length || valid.length !== entered.length) return showToast('请检查手机号格式', 'warning');
    var duplicate = 0;
    valid.forEach(function (phone) {
      if (rows.some(function (item) { return item.groupId === group.id && item.phone === phone; })) { duplicate += 1; return; }
      var syncMap = {};
      group.platformBindings.forEach(function (itemBinding) { syncMap[itemBinding.platformCode] = sync('待同步', '-', ''); });
      rows.unshift({ phone: phone, name: '', groupId: group.id, addType: document.getElementById('blockNumberAddType').value, reason: document.getElementById('blockNumberReason').value.trim(), source: '手工新增', sourceType: 'MANUAL', creator: '当前用户', createdAt: nowText(), effective: group.expire, platformSync: syncMap });
    });
    activeModal = null; updatePage();
    showToast('已添加 ' + (valid.length - duplicate) + ' 个号码' + (group.platformBindings.length ? '，正在同步电声平台' : ''), 'success');
    group.platformBindings.forEach(function (itemBinding) { setTimeout(function () { syncPlatform(group.id, itemBinding.platformCode); }, 700); });
  }

  function submitImport() {
    var phones = document.getElementById('blockImportPhones').value.split(/[\s,;，；]+/).filter(Boolean).slice(0, 50);
    var valid = phones.filter(function (phone) { return /^1\d{10}$/.test(phone); });
    if (!phones.length) return showToast('请输入需要导入的手机号', 'warning');
    var group = currentGroup();
    var added = 0; var duplicate = 0;
    valid.forEach(function (phone) {
      if (rows.some(function (item) { return item.groupId === group.id && item.phone === phone; })) { duplicate += 1; return; }
      var syncMap = {};
      group.platformBindings.forEach(function (itemBinding) { syncMap[itemBinding.platformCode] = sync('待同步', '-', ''); });
      rows.unshift({ phone: phone, name: '', groupId: group.id, addType: document.getElementById('blockImportAddType').value, reason: document.getElementById('blockImportReason').value.trim(), source: '批量导入', sourceType: 'API', creator: '当前用户', createdAt: nowText(), effective: group.expire, platformSync: syncMap });
      added += 1;
    });
    activeModal = null; updatePage();
    showToast('导入完成：成功 ' + added + ' 条，重复 ' + duplicate + ' 条，格式错误 ' + (phones.length - valid.length) + ' 条', added ? 'success' : 'warning');
    if (added) group.platformBindings.forEach(function (itemBinding) { setTimeout(function () { syncPlatform(group.id, itemBinding.platformCode); }, 700); });
  }

  function retryRecord(phone) {
    var item = rows.find(function (entry) { return entry.phone === phone; });
    var group = groups.find(function (entry) { return entry.id === item.groupId; });
    var targets = group.platformBindings.filter(function (itemBinding) {
      var s = item.platformSync[itemBinding.platformCode] || item.platformSync['电声'];
      return !s || s.status !== '已同步';
    });
    if (!targets.length) return showToast('该号码无需重试', 'info');
    targets.forEach(function (itemBinding) { item.platformSync[itemBinding.platformCode] = sync('同步中', '-', ''); });
    activeModal = null; updatePage();
    showToast('已提交电声平台重试', 'info');
    setTimeout(function () {
      targets.forEach(function (itemBinding) { item.platformSync[itemBinding.platformCode] = sync('已同步', nowText(), ''); });
      updatePage();
      showToast('号码电声同步完成', 'success');
    }, 700);
  }

  function retrySelected() {
    var targets = rows.filter(function (item) { return selectedPhones.indexOf(item.phone) >= 0; });
    if (!targets.length || !currentGroup().platformBindings.length) return showToast('所选号码无需同步', 'info');
    targets.forEach(function (item) {
      currentGroup().platformBindings.forEach(function (itemBinding) {
        var s = item.platformSync[itemBinding.platformCode] || item.platformSync['电声'];
        if (!s || s.status !== '已同步') item.platformSync[itemBinding.platformCode] = sync('同步中', '-', '');
      });
    });
    selectedPhones = []; updatePage();
    setTimeout(function () {
      targets.forEach(function (item) {
        currentGroup().platformBindings.forEach(function (itemBinding) { item.platformSync[itemBinding.platformCode] = sync('已同步', nowText(), ''); });
      });
      updatePage();
      showToast('所选号码已完成电声平台同步', 'success');
    }, 700);
  }

  function submitMove() {
    var targetId = document.getElementById('blockMoveTarget').value;
    if (!targetId) return showToast('请选择目标分组', 'warning');
    var target = groups.find(function (group) { return group.id === targetId; });
    rows.filter(function (item) { return selectedPhones.indexOf(item.phone) >= 0; }).forEach(function (item) {
      item.groupId = targetId;
      item.effective = target.expire;
      item.platformSync = {};
      target.platformBindings.forEach(function (itemBinding) { item.platformSync[itemBinding.platformCode] = sync('待同步', '-', ''); });
    });
    var count = selectedPhones.length;
    selectedPhones = []; activeModal = null; updatePage();
    showToast('已移动 ' + count + ' 个号码' + (target.platformBindings.length ? '，正在更新电声平台分组' : ''), 'success');
    target.platformBindings.forEach(function (itemBinding) { setTimeout(function () { syncPlatform(target.id, itemBinding.platformCode); }, 700); });
  }

  function requestDisablePlatform(platformCode) {
    var platform = platformByCode(platformCode);
    pendingAction = { type: 'platform', platformCode: platformCode };
    setModal('confirm', { heading: '停用平台同步', title: '确认停用电声平台同步？', message: '停用后新增和移动号码不再下发到电声平台，已同步的远端黑名单不会自动删除。' });
  }
  function requestRemoveNumber(phone) {
    var group = currentGroup();
    pendingAction = { type: 'numbers', phones: [phone] };
    setModal('confirm', { heading: '移除黑名单', title: '确认移除该号码？', message: group.platformBindings.length ? '系统将先从电声平台删除，成功后再解除本地拦截；失败平台会保留待处理状态。' : '移除后该号码将立即恢复可外呼状态。' });
  }
  function requestRemoveSelected() {
    if (!selectedPhones.length) return;
    pendingAction = { type: 'numbers', phones: selectedPhones.slice() };
    setModal('confirm', { heading: '批量移除', title: '确认移除所选 ' + selectedPhones.length + ' 个号码？', message: currentGroup().platformBindings.length ? '系统将确认电声平台删除结果，未完成删除的号码仍保留本地拦截。' : '移除后这些号码将恢复可外呼状态。' });
  }
  function requestRemoveGroup(id) {
    var group = groups.find(function (item) { return item.id === id; });
    if (group.count) return setModal('confirm', { heading: '删除分组', title: '暂时无法删除', message: '该分组仍有 ' + group.count + ' 个号码，请先移动或移除。', blocked: true });
    pendingAction = { type: 'group', id: id };
    setModal('confirm', { heading: '删除分组', title: '确认删除该分组？', message: group.platformBindings.length ? '本地分组删除后将停止电声平台同步；不支持删除分组的平台可能保留远端空分组。' : '删除后无法恢复。' });
  }

  function confirmAction() {
    if (!pendingAction) return;
    if (pendingAction.type === 'numbers') {
      var removed = pendingAction.phones.length;
      rows = rows.filter(function (item) { return pendingAction.phones.indexOf(item.phone) < 0; });
      selectedPhones = [];
      showToast('已移除 ' + removed + ' 个号码', 'success');
    } else if (pendingAction.type === 'platform') {
      var group = currentGroup();
      group.platformBindings = group.platformBindings.filter(function (itemBinding) { return itemBinding.platformCode !== pendingAction.platformCode && itemBinding.platformCode !== '电声'; });
      rows.filter(function (item) { return item.groupId === group.id; }).forEach(function (item) { delete item.platformSync[pendingAction.platformCode]; delete item.platformSync['电声']; });
      showToast('电声平台同步已停用', 'success');
    } else {
      groups = groups.filter(function (group) { return group.id !== pendingAction.id; });
      activeGroupId = groups[0].id;
      showToast('分组已删除', 'success');
    }
    pendingAction = null; activeModal = null; updatePage();
  }

  window.Pages = window.Pages || {};
  window.Pages['scene-block'] = {
    render: renderPage,
    init: function () { activateTenantStore(activeTenantId); refreshCounts(); },
    switchTenant: function (tenantId) { activateTenantStore(tenantId); filters = { phone: '', addType: 'all', status: 'all', start: '', end: '' }; activeModal = null; updatePage(); },
    selectGroup: selectGroup,
    setGroupKeyword: function (value) { groupKeyword = value; updatePage(); },
    applyFilters: applyFilters,
    resetFilters: function () { filters = { phone: '', addType: 'all', status: 'all', start: '', end: '' }; selectedPhones = []; updatePage(); },
    toggleRowSelection: function (phone, checked) {
      selectedPhones = checked ? selectedPhones.concat(phone).filter(function (item, index, list) { return list.indexOf(item) === index; }) : selectedPhones.filter(function (item) { return item !== phone; });
      updatePage();
    },
    toggleAllRows: function (checked) { selectedPhones = checked ? filteredRows().map(function (item) { return item.phone; }) : []; updatePage(); },
    clearSelection: function () { selectedPhones = []; updatePage(); },
    openAddGroup: function () { editingGroupId = null; setModal('group'); },
    openEditGroup: function (id) { editingGroupId = id; setModal('group'); },
    submitGroup: submitGroup,
    openSyncSettings: function () { setModal('sync'); },
    openAddPlatform: function () { setModal('addPlatform'); },
    submitAddPlatform: submitAddPlatform,
    openPlatformDetail: function (platformCode) { setModal('platform', { platformCode: platformCode }); },
    retryPlatform: retryPlatform,
    requestDisablePlatform: requestDisablePlatform,
    openAddNumber: function () { setModal('number', { phones: [''] }); },
    addPhoneInput: function () { if (activeModal.phones.length < 10) { activeModal.phones.push(''); updatePage(); } },
    removePhoneInput: function (index) { if (activeModal.phones.length > 1) activeModal.phones.splice(index, 1); else activeModal.phones[0] = ''; updatePage(); },
    updatePhone: function (index, value) { activeModal.phones[index] = value.replace(/\D/g, '').slice(0, 11); },
    submitNumber: submitNumber,
    openImportModal: function () { setModal('import'); },
    submitImport: submitImport,
    exportRows: function () { showToast('导出任务已提交', 'success'); },
    openRecordDetail: function (phone) { setModal('detail', { phone: phone }); },
    retryRecord: retryRecord,
    retrySelected: retrySelected,
    openMoveModal: function () { if (selectedPhones.length) setModal('move'); },
    submitMove: submitMove,
    requestRemoveNumber: requestRemoveNumber,
    requestRemoveSelected: requestRemoveSelected,
    requestRemoveGroup: requestRemoveGroup,
    confirmAction: confirmAction,
    closeModal: function () { activeModal = null; editingGroupId = null; pendingAction = null; updatePage(); }
  };
})();
