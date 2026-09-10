/**
 * js/pages/result-clue.js — 线索记录
 * 100% 对齐截图设计：
 * - 页面标题：【线索记录】+ 副标题【以线索的维度查看统计结果。】
 * - 筛选卡片（两行左对齐 + 展开/收起 + 动态筛选）：
 *   - 第一行：用户号码、最后回访时间、最后通话状态、场景名称
 *   - 第二行：最后通话意向级别、重置、查询、收起/展开
 * - 操作工具条：导出按钮、刷新、列设置
 * - 13 列标准数据大表（序号、用户号码、最后回访时间、回访次数、最后通话状态、最后回访记录、场景名称、最后通话意向级别、客户详细标签、首次实际回访时间、二次实际回访时间、三次实际回访时间、操作）
 * - 客户详细标签弹窗与多次回访详情抽屉
 */
(function () {
  'use strict';

  var sourceRows = window.MockClueRecordRows || [];
  var allRows = [];
  var isExpanded = true;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function syncScope() {
    var access = window.AppState && window.AppState.effectiveAccess ? window.AppState.effectiveAccess() : { tenantIds: [] };
    var tenantIds = access.tenantIds || [];
    allRows = sourceRows.filter(function (item) { return tenantIds.indexOf(item.tenantId) >= 0; });
  }

  function uniqueValues(field) {
    return allRows.map(function (item) { return item[field]; }).filter(function (value, index, list) {
      return value && value !== '-' && list.indexOf(value) === index;
    });
  }

  function showToast(msg, type) {
    if (window.Common && typeof window.Common.showToast === 'function') {
      window.Common.showToast(msg, type || 'default');
      return;
    }
    var toast = document.getElementById('toast-tip');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-tip';
      toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);color:#fff;padding:10px 24px;border-radius:4px;font-size:14px;z-index:9999;transition:all 0.3s cubic-bezier(0.23,1,0.32,1);box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;gap:8px;opacity:0;pointer-events:none;';
      document.body.appendChild(toast);
    }
    var bgMap = { success: '#52c41a', info: '#1677ff', default: 'rgba(0,0,0,0.75)' };
    toast.style.background = bgMap[type] || bgMap.default;
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.top = '40px';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.top = '20px';
    }, 3000);
  }

  function getFilteredRows() {
    var phone = (document.getElementById('cluePhone') ? document.getElementById('cluePhone').value : '').trim();
    var status = (document.getElementById('clueStatus') ? document.getElementById('clueStatus').value : '').trim();
    var scene = (document.getElementById('clueScene') ? document.getElementById('clueScene').value : '').trim();
    var intention = (document.getElementById('clueIntention') ? document.getElementById('clueIntention').value : '').trim();

    return allRows.filter(function (item) {
      if (phone && (item.phone || '').indexOf(phone) === -1) return false;
      if (status && item.lastCallStatus !== status) return false;
      if (scene && item.sceneName !== scene) return false;
      if (intention && item.intention !== intention) return false;
      return true;
    });
  }

  function renderRows() {
    var rows = getFilteredRows();
    if (!rows.length) {
      return '<tr><td colspan="14"><div class="report-empty"><div class="report-empty-icon">&#128230;</div><div>暂无数据</div></div></td></tr>';
    }
    return rows.map(function (item, index) {
      var sourceIndex = allRows.indexOf(item);
      var tagsLink = item.hasTags ? '<a href="#" class="record-detail-link" onclick="event.preventDefault();window.Pages[\'result-clue\'].showCustomerTags(' + sourceIndex + ')">查看</a>' : '-';
      var recordText = item.lastRecord && item.lastRecord !== '-' ? item.lastRecord : '-';

      return '<tr>' +
        '<td>' + (index + 1) + '</td>' +
        '<td>' + escapeHtml(item.phone || '-') + '</td>' +
        '<td>' + escapeHtml(item.lastVisitTime || '-') + '</td>' +
        '<td>' + (item.visitCount != null ? item.visitCount : 1) + '</td>' +
        '<td>' + escapeHtml(item.lastCallStatus || '-') + '</td>' +
        '<td class="clue-ellipsis" title="' + escapeHtml(recordText) + '">' + escapeHtml(recordText) + '</td>' +
        '<td class="clue-scene-name">' + escapeHtml(item.sceneName || '-') + '</td>' +
        '<td>' + escapeHtml(item.platform || '-') + '</td>' +
        '<td>' + escapeHtml(item.intention || '-') + '</td>' +
        '<td>' + tagsLink + '</td>' +
        '<td>' + escapeHtml(item.firstVisitTime || '-') + '</td>' +
        '<td>' + escapeHtml(item.secondVisitTime || '-') + '</td>' +
        '<td>' + escapeHtml(item.thirdVisitTime || '-') + '</td>' +
        '<td class="record-action-cell"><a href="#" class="record-detail-link" onclick="event.preventDefault();window.Pages[\'result-clue\'].showClueDetail(' + sourceIndex + ')">详情</a></td>' +
        '</tr>';
    }).join('');
  }

  function toggleExpand(e) {
    if (e && e.preventDefault) e.preventDefault();
    isExpanded = !isExpanded;
    var intentionItem = document.getElementById('clueIntentionItem');
    var expandLink = document.getElementById('clueExpandLink');
    if (intentionItem) intentionItem.style.visibility = isExpanded ? 'visible' : 'hidden';
    if (expandLink) {
      expandLink.innerHTML = isExpanded ? '收起 <span class="arrow" style="font-size:10px;">▲</span>' : '展开 <span class="arrow" style="font-size:10px;">▼</span>';
    }
  }

  function doQuery() {
    var tbody = document.getElementById('clueTableBody');
    if (tbody) tbody.innerHTML = renderRows();
    showToast('查询完成', 'info');
  }

  function resetFilters() {
    var phone = document.getElementById('cluePhone');
    var status = document.getElementById('clueStatus');
    var scene = document.getElementById('clueScene');
    var intention = document.getElementById('clueIntention');
    if (phone) phone.value = '';
    if (status) status.selectedIndex = 0;
    if (scene) scene.selectedIndex = 0;
    if (intention) intention.selectedIndex = 0;
    var tbody = document.getElementById('clueTableBody');
    if (tbody) tbody.innerHTML = renderRows();
    showToast('已重置筛选条件');
  }

  function renderCustomerTagsModal(index) {
    var item = allRows[index] || allRows[0] || {};
    var detailTags = item.detailTags || {};
    var tags = [['智能平台', item.platform || '-'], ['客户电话', item.phone || '-']];
    Object.keys(detailTags).forEach(function (key) { tags.push([key, detailTags[key]]); });
    if (tags.length === 2) tags.push(['意向标签', item.intention || '-']);
    var grid = tags.map(function (t) {
      return '<div class="clue-tag-item"><span class="clue-tag-label">' + escapeHtml(t[0]) + '</span><span class="clue-tag-value">' + escapeHtml(t[1]) + '</span></div>';
    }).join('');

    return '<div class="record-detail-backdrop" id="clueTagBackdrop" onclick="window.Pages[\'result-clue\'].closeModal(event)">' +
      '<div class="billing-detail-modal" data-anno-page="result-clue" data-anno-label="客户详细标签" data-anno-kind="region" data-anno-fields="FLD-031,FLD-036" style="width:520px;max-width:90vw;background:#fff;border-radius:8px;padding:20px;box-shadow:0 8px 24px rgba(0,0,0,0.15);" onclick="event.stopPropagation()">' +
        '<div class="billing-detail-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;font-size:16px;font-weight:600;"><span>客户详细标签</span><button class="billing-detail-close" style="border:none;background:none;font-size:20px;cursor:pointer;color:#999;" onclick="window.Pages[\'result-clue\'].closeModal()">&times;</button></div>' +
        '<div class="billing-detail-body"><div class="clue-tag-grid">' + grid + '</div></div>' +
      '</div></div>';
  }

  function renderClueDetailModal(index) {
    var item = allRows[index] || allRows[0] || {};
    var revisits = item.visits || [
      { time: item.lastVisitTime || '2026-08-20 13:40:21', status: item.lastCallStatus || '已接通', record: item.lastRecord || '客户对东风日产有明确购车意愿。', intention: item.intention || 'A(有购车意向)' }
    ];
    var rowsHtml = revisits.map(function (r, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(r.time) + '</td><td>' + escapeHtml(r.status) + '</td><td>' + escapeHtml(r.record) + '</td><td>' + escapeHtml(r.intention) + '</td>' +
        '<td><a href="#" class="record-detail-link" onclick="event.preventDefault();showToast(\'' + escapeHtml(item.platform || '') + '通话详情已加载\',\'info\')">通话详情</a></td></tr>';
    }).join('');

    return '<div class="record-detail-backdrop" id="clueDetailBackdrop" style="z-index: 5000;" onclick="window.Pages[\'result-clue\'].closeModal(event)">' +
      '<div class="scene-detail-drawer open" data-anno-page="ai-leads" data-anno-label="线索多次回访详情" data-anno-kind="region" data-anno-fields="FLD-053,FLD-057,FLD-058,FLD-059,FLD-060,FLD-061,FLD-062,FLD-063,FLD-064,FLD-065,FLD-066" style="width:680px;height:100vh;background:#fff;position:fixed;right:0;top:0;display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,0.15);z-index:5001;transform:none;" onclick="event.stopPropagation()">' +
        '<div class="scene-detail-header" style="padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;"><span class="scene-detail-title" style="font-size:15px;font-weight:600;">线索多次回访详情（' + escapeHtml(item.platform || '-') + ' · ' + escapeHtml(item.phone || '-') + '）</span><button type="button" class="scene-detail-close" style="border:none;background:none;font-size:22px;cursor:pointer;color:#999;line-height:1;" onclick="window.Pages[\'result-clue\'].closeModal()">&times;</button></div>' +
        '<div class="scene-detail-body" style="padding:20px;flex:1;overflow-y:auto;">' +
          '<div class="scene-detail-table-wrap"><table class="record-table">' +
            '<thead><tr><th>回访次数</th><th>回访时间</th><th>通话状态</th><th>回访记录</th><th>意向级别</th><th>操作</th></tr></thead>' +
            '<tbody>' + rowsHtml + '</tbody>' +
          '</table></div>' +
        '</div>' +
      '</div></div>';
  }

  function showCustomerTags(index) {
    document.body.insertAdjacentHTML('beforeend', renderCustomerTagsModal(index));
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      var backdrop = document.getElementById('clueTagBackdrop');
      if (backdrop) backdrop.classList.add('open');
    });
  }

  function showClueDetail(index) {
    document.body.insertAdjacentHTML('beforeend', renderClueDetailModal(index));
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      var backdrop = document.getElementById('clueDetailBackdrop');
      if (backdrop) backdrop.classList.add('open');
    });
  }

  function closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    var b1 = document.getElementById('clueTagBackdrop');
    var b2 = document.getElementById('clueDetailBackdrop');
    if (b1) { b1.classList.remove('open'); setTimeout(function () { b1.remove(); }, 200); }
    if (b2) { b2.classList.remove('open'); setTimeout(function () { b2.remove(); }, 200); }
    document.body.style.overflow = '';
  }

  function render() {
    syncScope();
    var sceneOptions = uniqueValues('sceneName').map(function (s) {
      return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>';
    }).join('');

    var statusOptions = uniqueValues('lastCallStatus').map(function (s) {
      return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>';
    }).join('');

    var intentionOptions = uniqueValues('intention').map(function (s) {
      return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>';
    }).join('');

    return '<div class="clue-records-page" data-anno="ai-lead-records" data-anno-page="ai-leads" data-anno-label="智能外呼线索记录" data-anno-kind="region" data-anno-fields="FLD-025,FLD-026,FLD-027,FLD-028,FLD-038">' +
      '<div class="record-header">' +
        '<span class="record-title">线索记录</span>' +
        '<span class="record-subtitle">以线索的维度查看统计结果。</span>' +
      '</div>' +
      '<div class="filter-bar" data-anno-page="result-clue" data-anno-label="线索记录筛选" data-anno-kind="region" data-anno-fields="FLD-020,FLD-024,FLD-025,FLD-027,FLD-031" style="margin-bottom:16px;">' +
        '<div class="filter-row">' +
          '<div class="filter-item"><label>用户号码：</label><input type="text" id="cluePhone" class="filter-input" placeholder="请输入" style="width:170px;"></div>' +
          '<div class="filter-item"><label>最后回访时间：</label><div class="filter-date-range"><input type="text" class="date-input" placeholder="请选择"><span class="sep">→</span><input type="text" class="date-input" placeholder="请选择"><span class="calendar-icon">&#128197;</span></div></div>' +
          '<div class="filter-item"><label>最后通话状态：</label><select id="clueStatus" class="filter-select" style="width:150px;"><option value="">请选择</option>' + statusOptions + '</select></div>' +
          '<div class="filter-item"><label>场景名称：</label><select id="clueScene" class="filter-select" style="width:180px;"><option value="">请选择</option>' + sceneOptions + '</select></div>' +
        '</div>' +
        '<div class="filter-row" id="clueExtraFilterRow" style="display:flex; padding-top:8px;">' +
          '<div class="filter-item" id="clueIntentionItem"><label>最后通话意向级别：</label><select id="clueIntention" class="filter-select" style="width:170px;"><option value="">请选择</option>' + intentionOptions + '</select></div>' +
          '<div class="btn-group">' +
            '<button class="btn btn-default" onclick="window.Pages[\'result-clue\'].resetFilters()">重置</button>' +
            '<button class="btn btn-primary" onclick="window.Pages[\'result-clue\'].doQuery()">查询</button>' +
            '<a href="#" class="filter-expand-link" id="clueExpandLink" onclick="window.Pages[\'result-clue\'].toggleExpand(event)">收起 <span class="arrow" style="font-size:10px;">&#9650;</span></a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="record-table-panel">' +
        '<div class="record-toolbar">' +
          '<button class="btn btn-primary btn-export" onclick="showToast(\'导出任务已提交，系统正在生成报表...\',\'info\')">导出</button>' +
          '<span class="report-icon-btn" onclick="doRefresh()" title="刷新">&#10227;</span>' +
          '<span class="report-icon-btn" onclick="showToast(\'设置功能开发中\',\'info\')" title="列设置">&#9881;</span>' +
        '</div>' +
        '<div class="record-table-scroll">' +
          '<table class="record-table" data-anno-page="ai-leads" data-anno-label="线索记录列表" data-anno-kind="table" data-anno-fields="FLD-053,FLD-054,FLD-055,FLD-056,FLD-057,FLD-058,FLD-059,FLD-060,FLD-061,FLD-064,FLD-065,FLD-066">' +
            '<thead><tr>' +
              '<th style="width: 50px;">序号</th>' +
              '<th style="width: 120px;">用户号码</th>' +
              '<th style="width: 150px;">最后回访时间</th>' +
              '<th style="width: 80px;">回访次数</th>' +
              '<th style="width: 100px;">最后通话状态</th>' +
              '<th style="width: 180px;">最后回访记录</th>' +
              '<th style="width: 220px;">场景名称</th>' +
              '<th style="width: 110px;">智能平台</th>' +
              '<th style="width: 130px;">最后通话意向级别</th>' +
              '<th style="width: 100px;">客户详细标签</th>' +
              '<th style="width: 150px;">首次实际回访时间</th>' +
              '<th style="width: 140px;">二次实际回访时间</th>' +
              '<th style="width: 140px;">三次实际回访时间</th>' +
              '<th class="record-action-cell" style="width: 70px;">操作</th>' +
            '</tr></thead>' +
            '<tbody id="clueTableBody">' + renderRows() + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function init() { syncScope(); }

  window.Pages = window.Pages || {};
  window.Pages['result-clue'] = {
    render: render,
    init: init,
    toggleExpand: toggleExpand,
    doQuery: doQuery,
    resetFilters: resetFilters,
    showCustomerTags: showCustomerTags,
    showClueDetail: showClueDetail,
    closeModal: closeModal
  };
})();
