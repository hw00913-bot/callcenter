/**
 * js/pages/report-call.js — 通话统计
 * 以中科金接入 demo 为底座，合并六平台统计与平台筛选。
 */
(function () {
  'use strict';

  var sourceRows = window.MockCallStatsRows || [];
  var rows = [];

  function syncScope() {
    sourceRows = window.MockCallStatsRows || [];
    var access = window.AppState && window.AppState.effectiveAccess ? window.AppState.effectiveAccess() : { tenantIds: [] };
    rows = sourceRows.filter(function (item) { return (access.tenantIds || []).indexOf(item.tenantId) >= 0; });
  }

  function formatRate(value, total) {
    if (!total) return '0.00%';
    return ((value / total) * 100).toFixed(2) + '%';
  }

  function renderRows() {
    if (!rows.length) {
      return '<tr><td colspan="11"><div class="report-empty"><div class="report-empty-icon">&#128230;</div><div>暂无数据</div></div></td></tr>';
    }
    return rows.map(function (item, index) {
      var connectedRate = formatRate(item.connectedTotal, item.rosterTotal);
      var touchRate = formatRate(item.connectedTotal + item.missedTotal, item.dialTotal);
      return '<tr><td>' + (index + 1) + '</td><td>' + item.date + '</td><td class="report-scene-name">' + item.sceneName + '</td><td>' + item.platformName + '</td><td>' + item.dialTotal + '</td><td>' + item.rosterTotal + '</td><td>' + item.connectedTotal + '</td><td>' + item.missedTotal + '</td><td>' + connectedRate + '</td><td>' + touchRate + '</td><td>' + item.duration + '</td></tr>';
    }).join('');
  }

  function renderCustomerRows() {
    if (!rows.length) {
      return '<tr><td colspan="8"><div class="report-empty"><div class="report-empty-icon">&#128230;</div><div>暂无数据</div></div></td></tr>';
    }
    return rows.map(function (item, index) {
      return '<tr><td>' + (index + 1) + '</td><td>' + item.date + '</td><td class="report-scene-name">' + item.sceneName + '</td><td>' + item.platformName + '</td><td>' + item.rosterTotal + '</td><td>' + item.connectedTotal + '</td><td>' + item.duration + '</td><td>-</td></tr>';
    }).join('');
  }

  function renderTabContent(activeTab) {
    if (activeTab === 'customer') {
      return '<div class="report-table-panel"><div class="report-table-heading"><div></div><div class="report-table-actions"><span class="report-icon-btn" onclick="doRefresh()" title="刷新">&#x21bb;</span><span class="report-icon-btn" onclick="showToast(\'列设置功能开发中\',\'info\')" title="列设置">&#9881;</span></div></div>' +
        '<div class="report-table-scroll"><table class="report-table" style="min-width:1050px;"><thead><tr><th>序号</th><th>呼叫时间</th><th>场景名称</th><th>智能平台</th><th>客户总数</th><th>有效通话客户数</th><th>累计通话时长</th><th>客户平均通话时长</th></tr></thead><tbody>' + renderCustomerRows() + '</tbody></table></div></div>';
    }
    return '<div class="report-table-panel"><div class="report-table-actions"><span class="report-icon-btn" onclick="doRefresh()" title="刷新">&#x21bb;</span><span class="report-icon-btn" onclick="showToast(\'列设置功能开发中\',\'info\')" title="列设置">&#9881;</span></div>' +
      '<div class="report-table-scroll"><table class="report-table" data-anno-page="report-call" data-anno-label="通话统计列表" data-anno-kind="table" data-anno-fields="FLD-006,FLD-040,FLD-041,FLD-042,FLD-043,FLD-044,FLD-045" style="min-width:1080px;"><thead><tr><th>序号</th><th>呼叫时间</th><th>场景名称</th><th>智能平台</th><th>拨打总次数</th><th>呼叫名单总数</th><th>接通总数</th><th>未接通总数</th><th>接通率</th><th>触达率</th><th>累计通话时长</th></tr></thead><tbody>' + renderRows() + '</tbody></table></div></div>';
  }

  function doQuery() {
    var page = document.querySelector('.report-call-page');
    if (!page) return;
    var selects = page.querySelectorAll('.filter-select');
    var sceneSel = selects[0];
    var platformSel = selects[1];
    var tbody = page.querySelector('.report-table tbody');

    var sceneVal = sceneSel ? sceneSel.value : '';
    var platformVal = platformSel ? platformSel.value : '';

    if (tbody) {
      var list = rows.filter(function (item) {
        var matchScene = !sceneVal || item.sceneName === sceneVal;
        var matchPlatform = !platformVal || item.platformName === platformVal;
        return matchScene && matchPlatform;
      });
      tbody.innerHTML = list.map(function (item, index) {
        var connectedRate = formatRate(item.connectedTotal, item.rosterTotal);
        var touchRate = formatRate(item.connectedTotal + item.missedTotal, item.dialTotal);
        return '<tr><td>' + (index + 1) + '</td><td>' + item.date + '</td><td class="report-scene-name">' + item.sceneName + '</td><td>' + item.platformName + '</td><td>' + item.dialTotal + '</td><td>' + item.rosterTotal + '</td><td>' + item.connectedTotal + '</td><td>' + item.missedTotal + '</td><td>' + connectedRate + '</td><td>' + touchRate + '</td><td>' + item.duration + '</td></tr>';
      }).join('');
    }
    showToast('查询完成', 'info');
  }

  function resetFilters() {
    var page = document.querySelector('.report-call-page');
    if (!page) return;
    var inputs = page.querySelectorAll('.filter-date-range input');
    if (inputs[0]) inputs[0].value = '2026-06-01';
    if (inputs[1]) inputs[1].value = '2026-06-03';
    var selects = page.querySelectorAll('.filter-select');
    selects.forEach(function (s) { s.selectedIndex = 0; });
    var tbody = page.querySelector('.report-table tbody');
    if (tbody) {
      tbody.innerHTML = renderRows();
    }
    showToast('已重置筛选条件');
  }

  function render() {
    syncScope();
    var sceneOptions = rows.map(function (item) { return item.sceneName; }).filter(function (v, i, a) { return a.indexOf(v) === i; })
      .map(function (name) { return '<option value="' + name + '">' + name + '</option>'; }).join('');
    var platformOptions = '<option value="">全部</option>' + (window.MockPlatforms || []).map(function (p) {
      return '<option value="' + p.name + '">' + p.name + '</option>';
    }).join('');
    return '<div class="report-call-page" data-anno="ai-call-report" data-anno-page="ai-call-report" data-anno-label="智能外呼通话统计" data-anno-kind="region" data-anno-fields="FLD-029,FLD-030,FLD-031,FLD-038">' +
      '<div class="report-page-header"><div class="report-title-row"><span class="report-title">通话统计</span><span class="report-subtitle">创建任务时导入外呼名单，通过手动启动任务进行智能外呼任务。</span></div></div>' +
      '<div class="report-tabs" data-anno-page="report-call" data-anno-label="通话统计口径切换" data-anno-kind="region">' +
        '<button class="report-tab active" onclick="window.Pages[\'report-call\'].switchTab(this,\'call\')">外呼统计</button>' +
        '<button class="report-tab" onclick="window.Pages[\'report-call\'].switchTab(this,\'customer\')">客户统计</button>' +
      '</div>' +
      '<div class="filter-bar" data-anno-page="report-call" data-anno-label="通话统计筛选" data-anno-kind="region" data-anno-fields="FLD-006,FLD-040">' +
        '<div class="filter-item"><label>呼叫时间：</label><div class="filter-date-range"><input type="text" value="2026-06-01"><span class="sep">&#8594;</span><input type="text" value="2026-06-03"><span class="calendar-icon">&#128197;</span></div></div>' +
        '<div class="filter-item"><label>场景名称：</label><select class="filter-select" style="width:180px;"><option value="">请选择</option>' + sceneOptions + '</select></div>' +
        '<div class="filter-item"><label>智能平台：</label><select class="filter-select" style="width:160px;">' + platformOptions + '</select></div>' +
        '<div class="btn-group">' +
          '<button class="btn btn-default" onclick="window.Pages[\'report-call\'].resetFilters()">重置</button>' +
          '<button class="btn btn-primary" onclick="window.Pages[\'report-call\'].doQuery()">查询</button>' +
        '</div>' +
      '</div>' +
      '<div id="reportCallContent">' + renderTabContent('call') + '</div>' +
    '</div>';
  }

  function switchTab(el, tabName) {
    document.querySelectorAll('.report-tab').forEach(function (tab) { tab.classList.remove('active'); });
    el.classList.add('active');
    var content = document.getElementById('reportCallContent');
    if (content) content.innerHTML = renderTabContent(tabName);
  }

  window.Pages = window.Pages || {};
  window.Pages['report-call'] = { render: render, init: syncScope, switchTab: switchTab, resetFilters: resetFilters, doQuery: doQuery };
})();
