/**
 * js/pages/report-billing.js — 计费统计
 * 以中科金接入 demo 为底座，保留按分钟计费口径与详情/嵌套抽屉。
 */
(function () {
  'use strict';

  var sourceRows = window.MockBillingStatsRows || [];
  var allRows = [];
  var filteredRows = [];

  function syncScope() {
    var access = window.AppState && window.AppState.effectiveAccess ? window.AppState.effectiveAccess() : { tenantIds: [] };
    allRows = sourceRows.filter(function (item) { return (access.tenantIds || []).indexOf(item.tenantId) >= 0; });
    filteredRows = allRows.slice();
  }

  function renderRows(rows) {
    if (!rows.length) {
      return '<tr><td colspan="7"><div class="billing-empty"><div class="billing-empty-box"></div><div>暂无数据</div></div></td></tr>';
    }
    return rows.map(function (item, index) {
      return '<tr><td>' + (index + 1) + '</td><td>' + item.dateFrom + '~' + item.dateTo + '</td><td>' + item.tenantName + '</td><td>' + item.platformName + '</td><td>' + item.billingType + '</td><td>' + item.durationMinutes + '分钟</td><td><a href="#" class="billing-detail-link" onclick="event.preventDefault();window.Pages[\'report-billing\'].showDetail(' + item.id + ')">详情</a></td></tr>';
    }).join('');
  }

  function renderPagination(total) {
    var end = total ? total : 0;
    return '<div class="billing-pagination">' +
      '<span>第 1-' + end + ' 条/总共 ' + total + ' 条</span>' +
      '<span class="billing-page-arrow disabled">&#8249;</span>' +
      '<span class="billing-page-current">1</span>' +
      '<span class="billing-page-arrow disabled">&#8250;</span>' +
      '<span class="billing-page-size">20 条/页 <i></i></span>' +
      '</div>';
  }

  function render() {
    syncScope();
    var tenantOptions = allRows.map(function (item) { return item.tenantName; }).filter(function (name, index, list) { return list.indexOf(name) === index; }).map(function (name) {
      return '<option value="' + name + '">' + name + '</option>';
    }).join('');
    var platformOptions = (window.MockPlatforms || []).map(function (item) {
      return '<option value="' + item.name + '">' + item.name + '</option>';
    }).join('');

    filteredRows = allRows.slice();
    return '<div class="billing-page" data-anno="ai-billing-report" data-anno-page="ai-billing-report" data-anno-label="智能外呼计费统计" data-anno-kind="region" data-anno-fields="FLD-029,FLD-032,FLD-033,FLD-038">' +
      '<div class="billing-note" data-anno-page="report-billing" data-anno-label="计费口径" data-anno-kind="region">备注：通话计费以客户接通为准，按分钟收费，未满 1 分钟按 1 分钟计费</div>' +
      '<div class="billing-heading"><strong>计费统计</strong><span>查看不同租户的每日通话计费明细（按账号收费不统计在内）。</span></div>' +
      '<div class="filter-bar" data-anno-page="report-billing" data-anno-label="计费统计筛选" data-anno-kind="region" data-anno-fields="FLD-006,FLD-050,FLD-055">' +
        '<div class="filter-item"><label>计费日期：</label><div class="filter-date-range"><input id="billingDateFrom" value="2026-06-01" aria-label="计费开始日期"><span class="sep">&rarr;</span><input id="billingDateTo" value="2026-06-09" aria-label="计费结束日期"><span class="calendar-icon">&#128197;</span></div></div>' +
        '<div class="filter-item"><label for="billingTenant">租户名称：</label><select id="billingTenant" class="filter-select" style="width:180px;"><option value="">请选择</option>' + tenantOptions + '</select></div>' +
        '<div class="filter-item"><label for="billingPlatform">智能平台：</label><select id="billingPlatform" class="filter-select" style="width:160px;"><option value="">全部</option>' + platformOptions + '</select></div>' +
        '<div class="btn-group"><button class="btn btn-default" onclick="window.Pages[\'report-billing\'].resetFilters()">重置</button><button class="btn btn-primary" onclick="window.Pages[\'report-billing\'].query()">查询</button></div>' +
      '</div>' +
      '<div class="billing-table-card">' +
        '<div class="billing-toolbar"><button class="billing-tool-btn billing-refresh" title="刷新" onclick="window.Pages[\'report-billing\'].refresh()"></button><button class="billing-tool-btn billing-settings" title="设置" onclick="showToast(\'设置功能开发中\',\'info\')"></button></div>' +
        '<div class="billing-table-wrap"><table class="billing-table" data-anno-page="report-billing" data-anno-label="计费统计列表" data-anno-kind="table" data-anno-fields="FLD-006,FLD-050,FLD-055"><thead><tr><th>序号</th><th>计费日期</th><th>租户名称</th><th>智能平台</th><th>计费类型</th><th>计费时长</th><th>操作</th></tr></thead><tbody id="billingTableBody">' + renderRows(filteredRows) + '</tbody></table></div>' +
        '<div id="billingPagination">' + renderPagination(filteredRows.length) + '</div>' +
      '</div>' +
    '</div>';
  }

  function updateTable() {
    var tbody = document.getElementById('billingTableBody');
    var pagination = document.getElementById('billingPagination');
    if (tbody) tbody.innerHTML = renderRows(filteredRows);
    if (pagination) pagination.innerHTML = renderPagination(filteredRows.length);
  }

  function query() {
    var tenant = document.getElementById('billingTenant');
    var platform = document.getElementById('billingPlatform');
    var tenantName = tenant ? tenant.value : '';
    var platformName = platform ? platform.value : '';
    filteredRows = allRows.filter(function (item) {
      return (!tenantName || item.tenantName === tenantName) && (!platformName || item.platformName === platformName);
    });
    updateTable();
    showToast('查询完成', 'info');
  }

  function resetFilters() {
    var from = document.getElementById('billingDateFrom');
    var to = document.getElementById('billingDateTo');
    var tenant = document.getElementById('billingTenant');
    var platform = document.getElementById('billingPlatform');
    if (from) from.value = '2026-06-01';
    if (to) to.value = '2026-06-09';
    if (tenant) tenant.value = '';
    if (platform) platform.value = '';
    filteredRows = allRows.slice();
    updateTable();
  }

  function refresh() {
    filteredRows = allRows.slice();
    updateTable();
    showToast('刷新成功', 'success');
  }

  function renderDetailRows(id) {
    var rows = window.MockBillingDetail && window.MockBillingDetail[id];
    var summary = allRows.filter(function (item) { return item.id === id; })[0] || {};
    if (!rows || !rows.length) {
      return '<tr><td colspan="7"><div class="billing-detail-empty"><div class="billing-empty-box"></div><div>暂无数据</div></div></td></tr>';
    }
    return rows.map(function (item, index) {
      return '<tr><td>' + (index + 1) + '</td><td>' + item.date + '</td><td>' + item.tenantName + '</td><td>' + (item.platformName || summary.platformName || '-') + '</td><td>' + item.modelType + '</td><td>' + item.durationMinutes + '</td><td><a href="#" class="billing-detail-link" onclick="event.preventDefault();window.Pages[\'report-billing\'].showCallDetail(' + id + ')">详情</a></td></tr>';
    }).join('');
  }

  function showDetail(id) {
    if (document.getElementById('billingDetailBackdrop')) return;
    var html = '<div class="billing-detail-backdrop" id="billingDetailBackdrop" onclick="window.Pages[\'report-billing\'].closeDetail(event)">' +
      '<div class="billing-detail-modal" data-anno-page="report-billing" data-anno-label="计费明细" data-anno-kind="region" data-anno-fields="FLD-006,FLD-050,FLD-055" onclick="event.stopPropagation()">' +
        '<div class="billing-detail-header"><strong>详情</strong><button class="billing-detail-close" aria-label="关闭" onclick="window.Pages[\'report-billing\'].closeDetail()">&times;</button></div>' +
        '<div class="billing-detail-body">' +
          '<div class="billing-detail-toolbar"><button class="btn btn-primary" onclick="showToast(\'导出任务已提交\',\'success\')">导出</button><button class="billing-tool-btn billing-refresh" title="刷新" onclick="showToast(\'刷新成功\',\'success\')"></button><button class="billing-tool-btn billing-settings" title="设置" onclick="showToast(\'设置功能开发中\',\'info\')"></button></div>' +
          '<div class="billing-detail-table-wrap"><table class="billing-detail-table"><thead><tr><th>序号</th><th>计费日期</th><th>租户名称</th><th>智能平台</th><th>模型类型</th><th>计费时长</th><th>操作</th></tr></thead><tbody>' + renderDetailRows(id) + '</tbody></table></div>' +
        '</div>' +
      '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      var backdrop = document.getElementById('billingDetailBackdrop');
      var modal = backdrop && backdrop.querySelector('.billing-detail-modal');
      if (backdrop) backdrop.classList.add('open');
      if (modal) modal.classList.add('open');
    });
  }

  function closeDetail(event) {
    if (event && event.target !== event.currentTarget) return;
    var backdrop = document.getElementById('billingDetailBackdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    setTimeout(function () {
      backdrop.remove();
      document.body.style.overflow = '';
    }, 180);
  }

  function renderCallDetailRows(id) {
    var rows = window.MockBillingCallDetail && window.MockBillingCallDetail[id];
    if (!rows || !rows.length) {
      return '<tr><td colspan="7"><div class="billing-detail-empty"><div class="billing-empty-box"></div><div>暂无数据</div></div></td></tr>';
    }
    return rows.map(function (item, index) {
      return '<tr><td>' + (index + 1) + '</td><td>' + item.phone + '</td><td>' + item.startTime + '</td><td>' + item.endTime + '</td><td>' + item.duration + '</td><td>' + item.billingMinutes + '</td><td>' + item.sceneName + '</td></tr>';
    }).join('');
  }

  function showCallDetail(id) {
    if (document.getElementById('billingCallDetailBackdrop')) return;
    var html = '<div class="billing-call-backdrop" id="billingCallDetailBackdrop" onclick="window.Pages[\'report-billing\'].closeCallDetail(event)">' +
      '<div class="billing-call-drawer" onclick="event.stopPropagation()">' +
        '<div class="billing-call-header"><strong>通话计费明细</strong><button class="billing-call-close" onclick="window.Pages[\'report-billing\'].closeCallDetail()">&times;</button></div>' +
        '<div class="billing-call-body">' +
          '<div class="billing-call-table-wrap"><table class="billing-call-table"><thead><tr><th>序号</th><th>用户号码</th><th>通话开始时间</th><th>通话结束时间</th><th>通话时长</th><th>计费分钟</th><th>场景名称</th></tr></thead><tbody>' + renderCallDetailRows(id) + '</tbody></table></div>' +
          '<div class="billing-call-note">备注：通话计费以客户接通为准，按分钟收费，未满 1 分钟按 1 分钟计费</div>' +
        '</div>' +
      '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      var backdrop = document.getElementById('billingCallDetailBackdrop');
      var drawer = backdrop && backdrop.querySelector('.billing-call-drawer');
      if (backdrop) backdrop.classList.add('open');
      if (drawer) drawer.classList.add('open');
    });
  }

  function closeCallDetail(event) {
    if (event && event.target !== event.currentTarget) return;
    var backdrop = document.getElementById('billingCallDetailBackdrop');
    if (!backdrop) return;
    var drawer = backdrop.querySelector('.billing-call-drawer');
    backdrop.classList.remove('open');
    if (drawer) drawer.classList.add('closing');
    setTimeout(function () {
      backdrop.remove();
      document.body.style.overflow = document.getElementById('billingDetailBackdrop') ? 'hidden' : '';
    }, 320);
  }

  window.Pages = window.Pages || {};
  window.Pages['report-billing'] = {
    render: render,
    init: syncScope,
    query: query,
    resetFilters: resetFilters,
    refresh: refresh,
    showDetail: showDetail,
    closeDetail: closeDetail,
    showCallDetail: showCallDetail,
    closeCallDetail: closeCallDetail
  };
})();
