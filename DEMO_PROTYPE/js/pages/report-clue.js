/**
 * js/pages/report-clue.js — 线索统计（线索报表模块）
 * 100% 对齐 releases_demo/线索报表_v1.0：
 * - 移除多余顶栏，直接从主 Tab 顶格展示
 * - 三大主 Tab：【外呼线索统计】、【外呼线索明细】、【线索回流统计】
 * - 胶囊形二级子 Tab：【总部 NEV 线索】、【总部 ICE 线索】
 * - 14 列表头统计大表与明细大表、6 列表头回流表
 * - 完整真实的动态分页系统（切页、切换条数、跳页）
 * - 意向级别多选下拉、门店模糊搜索、日期初始化、2.5s 异步导出 loading
 */
(function () {
  'use strict';

  /* ===== 分页状态维护 ===== */
  var pageStates = {
    'manual-nev': { curPage: 1, pageSize: 10 },
    'manual-ice': { curPage: 1, pageSize: 10 },
    'ai-nev': { curPage: 1, pageSize: 10 },
    'ai-ice': { curPage: 1, pageSize: 10 },
    'tab-return': { curPage: 1, pageSize: 10 }
  };

  /* ===== 辅助工具 ===== */
  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function formatDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
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

  /* ===== 数据源获取 ===== */
  function getPanelData(panelId) {
    var rows = [];
    if (panelId === 'manual-nev') rows = window.MockClueStatNEV || [];
    else if (panelId === 'manual-ice') rows = window.MockClueStatICE || [];
    else if (panelId === 'ai-nev') rows = window.MockClueDetailNEV || [];
    else if (panelId === 'ai-ice') rows = window.MockClueDetailICE || [];
    else if (panelId === 'tab-return') rows = window.MockClueReturn || [];
    var access = window.AppState && window.AppState.effectiveAccess ? window.AppState.effectiveAccess() : { tenantIds: [] };
    return rows.filter(function (item) { return (access.tenantIds || []).indexOf(item.tenantId) >= 0; });
  }

  /* ===== 渲染外呼线索统计行（14 列） ===== */
  function renderStatRows(rows, curPage, pageSize) {
    if (!rows || !rows.length) {
      return '<tr><td colspan="14" style="text-align:center;padding:40px 0;color:#999;">暂无数据</td></tr>';
    }
    var p = curPage || 1;
    var sz = pageSize || 10;
    var startIdx = (p - 1) * sz;
    var sliceRows = rows.slice(startIdx, startIdx + sz);

    if (!sliceRows.length && rows.length > 0) {
      sliceRows = rows.slice(0, sz);
    }

    return sliceRows.map(function (item, idx) {
      var rowNo = startIdx + idx + 1;
      return '<tr>' +
        '<td>' + (item.no != null ? item.no : rowNo) + '</td>' +
        '<td>' + (item.date || '-') + '</td>' +
        '<td>' + (item.type || '-') + '</td>' +
        '<td>' + (item.importCount != null ? item.importCount : item.import || 0) + '</td>' +
        '<td>' + (item.callCount != null ? item.callCount : item.call || 0) + '</td>' +
        '<td>' + (item.connectedCount != null ? item.connectedCount : item.connected || 0) + '</td>' +
        '<td>' + (item.dispatchCount != null ? item.dispatchCount : item.dispatch || 0) + '</td>' +
        '<td>' + (item.rate || '0.0%') + '</td>' +
        '<td>' + (item.avgDuration || item.avg || '00:00') + '</td>' +
        '<td>' + (item.levelA != null ? item.levelA : item.A || 0) + '</td>' +
        '<td>' + (item.levelB != null ? item.levelB : item.B || 0) + '</td>' +
        '<td>' + (item.levelC != null ? item.levelC : item.C || 0) + '</td>' +
        '<td>' + (item.levelD != null ? item.levelD : item.D || 0) + '</td>' +
        '<td>' + (item.levelE != null ? item.levelE : item.E || 0) + '</td>' +
        '</tr>';
    }).join('');
  }

  /* ===== 渲染外呼线索明细行（14 列） ===== */
  function renderDetailRows(rows, curPage, pageSize) {
    if (!rows || !rows.length) {
      return '<tr><td colspan="14" style="text-align:center;padding:40px 0;color:#999;">暂无数据</td></tr>';
    }
    var p = curPage || 1;
    var sz = pageSize || 10;
    var startIdx = (p - 1) * sz;
    var sliceRows = rows.slice(startIdx, startIdx + sz);

    if (!sliceRows.length && rows.length > 0) {
      sliceRows = rows.slice(0, sz);
    }

    return sliceRows.map(function (item, idx) {
      var rowNo = startIdx + idx + 1;
      var statusHtml = item.status ? '<span class="tag tag-' + (item.statusTag || 'gray') + '">' + item.status + '</span>' : '--';
      var centerHtml = item.levelCenter ? '<span class="tag tag-' + (item.levelCenterTag || 'blue') + '">' + item.levelCenter + '</span>' : '--';
      var bizHtml = item.levelBiz ? '<span class="tag tag-' + (item.levelBizTag || 'green') + '">' + item.levelBiz + '</span>' : '--';

      return '<tr>' +
        '<td>' + (item.no != null ? item.no : rowNo) + '</td>' +
        '<td>' + (item.importTime || item.time || '-') + '</td>' +
        '<td>' + (item.clueCode || item.code || '-') + '</td>' +
        '<td>' + (item.sceneName || item.scene || '-') + '</td>' +
        '<td>' + (item.type || '-') + '</td>' +
        '<td>' + (item.phone || '-') + '</td>' +
        '<td>' + (item.storeCode || '-') + '</td>' +
        '<td>' + (item.storeName || '-') + '</td>' +
        '<td>' + (item.callTime || '--') + '</td>' +
        '<td>' + statusHtml + '</td>' +
        '<td>' + (item.duration || '00:00') + '</td>' +
        '<td>' + centerHtml + '</td>' +
        '<td>' + bizHtml + '</td>' +
        '<td>' + (item.dispatchStore || item.dispatch || '-') + '</td>' +
        '</tr>';
    }).join('');
  }

  /* ===== 渲染线索回流统计行（6 列） ===== */
  function renderReturnRows(rows, curPage, pageSize) {
    var data = rows || window.MockClueReturn || [];
    if (!data.length) {
      return '<tr><td colspan="6" style="text-align:center;padding:40px 0;color:#999;">暂无数据</td></tr>';
    }
    var p = curPage || 1;
    var sz = pageSize || 10;
    var startIdx = (p - 1) * sz;
    var sliceRows = data.slice(startIdx, startIdx + sz);

    if (!sliceRows.length && data.length > 0) {
      sliceRows = data.slice(0, sz);
    }

    return sliceRows.map(function (item, idx) {
      var rowNo = startIdx + idx + 1;
      return '<tr>' +
        '<td>' + (item.no != null ? item.no : rowNo) + '</td>' +
        '<td>' + item.date + '</td>' +
        '<td>' + item.scene + '</td>' +
        '<td style="font-weight: 500; color: #262626;">' + (item.importCount != null ? item.importCount : item.import || 0) + '</td>' +
        '<td style="font-weight: 500; color: #262626;">' + (item.submitCount != null ? item.submitCount : item.submit || 0) + '</td>' +
        '<td style="font-weight: 500; color: #52c41a;">' + (item.returnCount != null ? item.returnCount : item.return || 0) + '</td>' +
        '</tr>';
    }).join('');
  }

  /* ===== 渲染动态分页组件 ===== */
  function renderPaginationHtml(panelId, totalCount, curPage, pageSize) {
    var total = totalCount || 0;
    var cur = curPage || 1;
    var size = pageSize || 10;
    var totalPages = Math.max(1, Math.ceil(total / size));

    var prevDisabled = cur <= 1 ? 'disabled' : '';
    var nextDisabled = cur >= totalPages && totalPages > 0 ? '' : '';

    // 生成页码按钮（参考源显示 1~9 模式）
    var pageBtnsHtml = '';
    var maxDisplayBtns = 9;
    var countBtns = Math.max(totalPages, maxDisplayBtns);

    for (var i = 1; i <= countBtns; i++) {
      var activeClass = i === cur ? 'active' : '';
      pageBtnsHtml += '<button class="page-btn ' + activeClass + '" onclick="window.Pages[\'report-clue\'].changePage(\'' + panelId + '\',' + i + ')">' + i + '</button>';
    }

    return '<div class="pagination" id="' + panelId + '-pagination">' +
      '<span class="total-text">共 ' + total + ' 条数据</span>' +
      '<button class="page-btn ' + prevDisabled + '" onclick="window.Pages[\'report-clue\'].prevPage(\'' + panelId + '\')">&lt;</button>' +
      pageBtnsHtml +
      '<button class="page-btn ' + nextDisabled + '" onclick="window.Pages[\'report-clue\'].nextPage(\'' + panelId + '\')">&gt;</button>' +
      '<select class="page-select" onchange="window.Pages[\'report-clue\'].changePageSize(\'' + panelId + '\', this.value)">' +
        '<option value="10"' + (size === 10 ? ' selected' : '') + '>10 条/页</option>' +
        '<option value="20"' + (size === 20 ? ' selected' : '') + '>20 条/页</option>' +
      '</select>' +
      '<div class="page-jump">' +
        '跳至 <input type="text" value="' + cur + '" onkeydown="if(event.key===\'Enter\')window.Pages[\'report-clue\'].jumpPage(\'' + panelId + '\', this)" onblur="window.Pages[\'report-clue\'].jumpPage(\'' + panelId + '\', this)"> 页' +
      '</div>' +
    '</div>';
  }

  /* ===== 主 Tab 1：外呼线索统计面板 ===== */
  function renderStatPanel() {
    var nevRows = window.MockClueStatNEV || [];
    var iceRows = window.MockClueStatICE || [];

    var nevState = pageStates['manual-nev'];
    var iceState = pageStates['manual-ice'];

    return '<div class="sub-tab-bar" data-anno-page="report-clue" data-anno-label="NEV/ICE 线索切换" data-anno-kind="region"><div class="sub-tab-bar-inner">' +
      '<div class="sub-tab-item active" onclick="window.Pages[\'report-clue\'].switchSubTab(this,\'manual-nev\')">总部 NEV 线索</div>' +
      '<div class="sub-tab-item" onclick="window.Pages[\'report-clue\'].switchSubTab(this,\'manual-ice\')">总部 ICE 线索</div>' +
      '</div></div>' +
      '<!-- 总部 NEV 线索 -->' +
      '<div id="manual-nev" class="sub-tab-panel" style="display:flex;">' +
        '<div class="filter-bar" data-anno-page="report-clue" data-anno-label="线索统计筛选" data-anno-kind="region" data-anno-fields="FLD-040">' +
          '<div class="filter-item"><label>导入时间：</label><div class="filter-date-range"><input type="date" class="filter-input date-input-start" style="width:130px;"><span class="sep">—</span><input type="date" class="filter-input date-input-end" style="width:130px;"></div></div>' +
          '<div class="filter-item"><label>业务类型：</label><select class="filter-select"><option value="cold" selected>冷线索</option><option value="new">新线索</option></select></div>' +
          '<div class="btn-group">' +
            '<button class="btn btn-default" onclick="window.Pages[\'report-clue\'].resetFilter()">重置</button>' +
            '<button class="btn btn-primary" onclick="window.Pages[\'report-clue\'].doQuery()">查询</button>' +
            '<button class="btn btn-success" onclick="window.Pages[\'report-clue\'].doExport(event)">导出</button>' +
            '<button class="btn btn-reload" onclick="window.Pages[\'report-clue\'].doRefresh()">刷新</button>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrap">' +
          '<div class="table-container"><table class="data-table" data-anno-page="report-clue" data-anno-label="线索统计列表" data-anno-kind="table" data-anno-fields="FLD-040,FLD-041,FLD-043,FLD-045">' +
            '<thead><tr><th>序号</th><th>导入日期</th><th>业务类型</th><th>导入线索量</th><th>外呼客户量</th><th>AI 外呼已接通量</th><th>已下发线索数</th><th>AI 接通率</th><th>平均通话时长</th><th>A (高意向)客户数</th><th>B (潜在)客户数</th><th>C (一般)客户数</th><th>D (忙碌/敷衍)客户数</th><th>E (拒绝/无效/无应答)客户数</th></tr></thead>' +
            '<tbody id="manual-nev-tbody">' + renderStatRows(nevRows, nevState.curPage, nevState.pageSize) + '</tbody>' +
          '</table></div>' +
          renderPaginationHtml('manual-nev', nevRows.length, nevState.curPage, nevState.pageSize) +
        '</div>' +
      '</div>' +
      '<!-- 总部 ICE 线索 -->' +
      '<div id="manual-ice" class="sub-tab-panel" style="display:none;">' +
        '<div class="filter-bar">' +
          '<div class="filter-item"><label>导入时间：</label><div class="filter-date-range"><input type="date" class="filter-input date-input-start" style="width:130px;"><span class="sep">—</span><input type="date" class="filter-input date-input-end" style="width:130px;"></div></div>' +
          '<div class="filter-item"><label>业务类型：</label><select class="filter-select"><option value="cold" selected>冷线索</option><option value="new">新线索</option></select></div>' +
          '<div class="btn-group">' +
            '<button class="btn btn-default" onclick="window.Pages[\'report-clue\'].resetFilter()">重置</button>' +
            '<button class="btn btn-primary" onclick="window.Pages[\'report-clue\'].doQuery()">查询</button>' +
            '<button class="btn btn-success" onclick="window.Pages[\'report-clue\'].doExport(event)">导出</button>' +
            '<button class="btn btn-reload" onclick="window.Pages[\'report-clue\'].doRefresh()">刷新</button>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrap">' +
          '<div class="table-container"><table class="data-table">' +
            '<thead><tr><th>序号</th><th>导入日期</th><th>业务类型</th><th>导入线索量</th><th>外呼客户量</th><th>AI 外呼已接通量</th><th>已下发线索数</th><th>AI 接通率</th><th>平均通话时长</th><th>A (高意向)客户数</th><th>B (潜在)客户数</th><th>C (一般)客户数</th><th>D (忙碌/敷衍)客户数</th><th>E (拒绝/无效/无应答)客户数</th></tr></thead>' +
            '<tbody id="manual-ice-tbody">' + renderStatRows(iceRows, iceState.curPage, iceState.pageSize) + '</tbody>' +
          '</table></div>' +
          renderPaginationHtml('manual-ice', iceRows.length, iceState.curPage, iceState.pageSize) +
        '</div>' +
      '</div>';
  }

  /* ===== 主 Tab 2：外呼线索明细面板 ===== */
  function renderDetailPanel() {
    var nevDetailRows = window.MockClueDetailNEV || [];
    var iceDetailRows = window.MockClueDetailICE || [];

    var nevState = pageStates['ai-nev'];
    var iceState = pageStates['ai-ice'];

    return '<div class="sub-tab-bar"><div class="sub-tab-bar-inner">' +
      '<div class="sub-tab-item active" onclick="window.Pages[\'report-clue\'].switchSubTab(this,\'ai-nev\')">总部 NEV 线索</div>' +
      '<div class="sub-tab-item" onclick="window.Pages[\'report-clue\'].switchSubTab(this,\'ai-ice\')">总部 ICE 线索</div>' +
      '</div></div>' +
      '<!-- 总部 NEV 线索明细 -->' +
      '<div id="ai-nev" class="sub-tab-panel" style="display:flex;">' +
        '<div class="filter-bar" data-anno-page="report-clue" data-anno-label="线索明细筛选" data-anno-kind="region" data-anno-fields="FLD-020,FLD-021,FLD-024,FLD-025,FLD-031">' +
          '<div class="filter-item"><label>导入时间：</label><div class="filter-date-range"><input type="datetime-local" class="filter-input date datetime-input-start" style="width:180px;"><span class="sep">—</span><input type="datetime-local" class="filter-input date datetime-input-end" style="width:180px;"></div></div>' +
          '<div class="filter-item"><label>呼叫时间：</label><div class="filter-date-range"><input type="datetime-local" class="filter-input date datetime-input-start" style="width:180px;"><span class="sep">—</span><input type="datetime-local" class="filter-input date datetime-input-end" style="width:180px;"></div></div>' +
          '<div class="filter-item"><label>呼叫任务场景名称：</label><select class="filter-select"><option value="">全部</option><option value="scene1">一知-nev-新线索</option><option value="scene2">一知-保有客户-回访</option></select></div>' +
          '<div class="filter-item">' +
            '<label>意向级别（外呼中台）：</label>' +
            '<div class="multi-select-wrap">' +
              '<div class="multi-select-display" onclick="window.Pages[\'report-clue\'].toggleMultiSelect(event, this)">全部</div>' +
              '<div class="multi-select-dropdown">' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-all" checked onchange="window.Pages[\'report-clue\'].handleAllOptions(this)"><label>全部</label></div>' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-item" onchange="window.Pages[\'report-clue\'].handleOptionItem(this)"><label>A (高意向)</label></div>' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-item" onchange="window.Pages[\'report-clue\'].handleOptionItem(this)"><label>B (潜在)</label></div>' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-item" onchange="window.Pages[\'report-clue\'].handleOptionItem(this)"><label>C (一般)</label></div>' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-item" onchange="window.Pages[\'report-clue\'].handleOptionItem(this)"><label>D (忙碌/敷衍)</label></div>' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-item" onchange="window.Pages[\'report-clue\'].handleOptionItem(this)"><label>E (拒绝/无效/无应答)</label></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="filter-item"><label>业务类型：</label><select class="filter-select"><option value="" selected>全部</option><option value="cold">冷线索</option><option value="new">新线索</option></select></div>' +
          '<div class="filter-item"><label>门店：</label><input type="text" class="filter-input" placeholder="请输入门店关键字模糊查询..." style="width:200px;"></div>' +
          '<div class="btn-group">' +
            '<button class="btn btn-default" onclick="window.Pages[\'report-clue\'].resetFilter()">重置</button>' +
            '<button class="btn btn-primary" onclick="window.Pages[\'report-clue\'].doQuery()">查询</button>' +
            '<button class="btn btn-success" onclick="window.Pages[\'report-clue\'].doExport(event)">导出</button>' +
            '<button class="btn btn-reload" onclick="window.Pages[\'report-clue\'].doRefresh()">刷新</button>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrap">' +
          '<div class="table-container"><table class="data-table" data-anno-page="report-clue" data-anno-label="外呼线索明细" data-anno-kind="table" data-anno-fields="FLD-020,FLD-021,FLD-023,FLD-024,FLD-025,FLD-031">' +
            '<thead><tr><th>序号</th><th>导入时间</th><th>线索编码</th><th>呼叫任务场景名称</th><th>业务类型</th><th>手机号</th><th>门店编码</th><th>门店名称</th><th>呼叫时间</th><th>通话状态</th><th>通话时长</th><th>意向级别（外呼中台）</th><th>意向级别（业务系统）</th><th>下发门店</th></tr></thead>' +
            '<tbody id="ai-nev-tbody">' + renderDetailRows(nevDetailRows, nevState.curPage, nevState.pageSize) + '</tbody>' +
          '</table></div>' +
          renderPaginationHtml('ai-nev', nevDetailRows.length, nevState.curPage, nevState.pageSize) +
        '</div>' +
      '</div>' +
      '<!-- 总部 ICE 线索明细 -->' +
      '<div id="ai-ice" class="sub-tab-panel" style="display:none;">' +
        '<div class="filter-bar">' +
          '<div class="filter-item"><label>导入时间：</label><div class="filter-date-range"><input type="datetime-local" class="filter-input date datetime-input-start" style="width:180px;"><span class="sep">—</span><input type="datetime-local" class="filter-input date datetime-input-end" style="width:180px;"></div></div>' +
          '<div class="filter-item"><label>呼叫时间：</label><div class="filter-date-range"><input type="datetime-local" class="filter-input date datetime-input-start" style="width:180px;"><span class="sep">—</span><input type="datetime-local" class="filter-input date datetime-input-end" style="width:180px;"></div></div>' +
          '<div class="filter-item"><label>呼叫任务场景名称：</label><select class="filter-select"><option value="">全部</option><option value="scene_ice">一知-燃油车-冷线索</option></select></div>' +
          '<div class="filter-item">' +
            '<label>意向级别（外呼中台）：</label>' +
            '<div class="multi-select-wrap">' +
              '<div class="multi-select-display" onclick="window.Pages[\'report-clue\'].toggleMultiSelect(event, this)">全部</div>' +
              '<div class="multi-select-dropdown">' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-all" checked onchange="window.Pages[\'report-clue\'].handleAllOptions(this)"><label>全部</label></div>' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-item" onchange="window.Pages[\'report-clue\'].handleOptionItem(this)"><label>A (高意向)</label></div>' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-item" onchange="window.Pages[\'report-clue\'].handleOptionItem(this)"><label>B (潜在)</label></div>' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-item" onchange="window.Pages[\'report-clue\'].handleOptionItem(this)"><label>C (一般)</label></div>' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-item" onchange="window.Pages[\'report-clue\'].handleOptionItem(this)"><label>D (忙碌/敷衍)</label></div>' +
                '<div class="multi-select-option"><input type="checkbox" class="opt-item" onchange="window.Pages[\'report-clue\'].handleOptionItem(this)"><label>E (拒绝/无效/无应答)</label></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="filter-item"><label>业务类型：</label><select class="filter-select"><option value="" selected>全部</option><option value="cold">冷线索</option><option value="new">新线索</option></select></div>' +
          '<div class="filter-item"><label>门店：</label><input type="text" class="filter-input" placeholder="请输入门店关键字模糊查询..." style="width:200px;"></div>' +
          '<div class="btn-group">' +
            '<button class="btn btn-default" onclick="window.Pages[\'report-clue\'].resetFilter()">重置</button>' +
            '<button class="btn btn-primary" onclick="window.Pages[\'report-clue\'].doQuery()">查询</button>' +
            '<button class="btn btn-success" onclick="window.Pages[\'report-clue\'].doExport(event)">导出</button>' +
            '<button class="btn btn-reload" onclick="window.Pages[\'report-clue\'].doRefresh()">刷新</button>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrap">' +
          '<div class="table-container"><table class="data-table">' +
            '<thead><tr><th>序号</th><th>导入时间</th><th>线索编码</th><th>呼叫任务场景名称</th><th>业务类型</th><th>手机号</th><th>门店编码</th><th>门店名称</th><th>呼叫时间</th><th>通话状态</th><th>通话时长</th><th>意向级别（外呼中台）</th><th>意向级别（业务系统）</th><th>下发门店</th></tr></thead>' +
            '<tbody id="ai-ice-tbody">' + renderDetailRows(iceDetailRows, iceState.curPage, iceState.pageSize) + '</tbody>' +
          '</table></div>' +
          renderPaginationHtml('ai-ice', iceDetailRows.length, iceState.curPage, iceState.pageSize) +
        '</div>' +
      '</div>';
  }

  /* ===== 主 Tab 3：线索回流统计面板 ===== */
  function renderReturnPanel() {
    var returnRows = window.MockClueReturn || [];
    var state = pageStates['tab-return'];

    return '<div style="padding: 16px; display: flex; flex-direction: column; flex: 1; min-height: 0;">' +
      '<div class="clue-tip-bar">' +
        '统计业务系统传入后，提交到外呼和回传业务系统的数据。' +
      '</div>' +
      '<div class="filter-bar" data-anno-page="report-clue" data-anno-label="线索回流筛选" data-anno-kind="region" data-anno-fields="FLD-024,FLD-040">' +
        '<div class="filter-item"><label>统计时间：</label><div class="filter-date-range"><input type="date" class="filter-input date-input-start" style="width:130px;" placeholder="开始时间"><span class="sep">—</span><input type="date" class="filter-input date-input-end" style="width:130px;" placeholder="结束时间"></div></div>' +
        '<div class="filter-item"><label>场景名称：</label><select class="filter-select" style="width:160px;"><option value="">全部</option><option value="scene1">燃油车新线索</option></select></div>' +
        '<div class="btn-group">' +
          '<button class="btn btn-default" onclick="window.Pages[\'report-clue\'].resetFilter()">重置</button>' +
          '<button class="btn btn-primary" onclick="window.Pages[\'report-clue\'].doQuery()">' +
            '<svg viewBox="0 0 1024 1024" width="12" height="12" fill="currentColor" style="margin-right: 4px; vertical-align: middle;"><path d="M909.6 854.5L729 673.9c56.8-63 91.4-146.2 91.4-237.5 0-200.7-162.7-363.4-363.4-363.4S93.6 235.7 93.6 436.4s162.7 363.4 363.4 363.4c91.3 0 174.5-34.6 237.5-91.4l180.6 180.6c15.2 15.2 40 15.2 55.2 0l21.9-21.9c15.2-15.2 15.2-40 0-55.2zM457 721.8c-157.6 0-285.4-127.8-285.4-285.4S299.4 151 457 151s285.4 127.8 285.4 285.4-127.8 285.4-285.4 285.4z"></path></svg>' +
            '搜索' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="table-wrap">' +
        '<div class="table-container"><table class="data-table" data-anno-page="report-clue" data-anno-label="线索回流统计" data-anno-kind="table" data-anno-fields="FLD-024,FLD-040">' +
          '<thead><tr><th style="width: 80px;">序号</th><th>统计时间 <span style="font-size: 10px; color: #bfbfbf; margin-left: 4px; cursor: pointer; user-select: none;">⇅</span></th><th>场景名称</th><th>线索传入数</th><th>提交外呼数</th><th>线索回流数</th></tr></thead>' +
          '<tbody id="tab-return-tbody">' + renderReturnRows(returnRows, state.curPage, state.pageSize) + '</tbody>' +
        '</table></div>' +
        renderPaginationHtml('tab-return', returnRows.length, state.curPage, state.pageSize) +
      '</div>' +
    '</div>';
  }

  /* ===== 页面整体渲染（顶格展示主 Tab，无多余蓝色 page-header） ===== */
  function render() {
    return '<div class="clue-report-page" data-anno="ai-lead-report" data-anno-page="ai-lead-report" data-anno-label="智能外呼线索统计" data-anno-kind="region" data-anno-fields="FLD-029,FLD-034,FLD-038">' +
      '<div class="tab-bar" data-anno-page="report-clue" data-anno-label="线索报表类型切换" data-anno-kind="region">' +
        '<div class="tab-item active" onclick="window.Pages[\'report-clue\'].switchTab(this,\'tab-manual\')">外呼线索统计</div>' +
        '<div class="tab-item" onclick="window.Pages[\'report-clue\'].switchTab(this,\'tab-ai\')">外呼线索明细</div>' +
        '<div class="tab-item" onclick="window.Pages[\'report-clue\'].switchTab(this,\'tab-return\')">线索回流统计</div>' +
      '</div>' +
      '<div class="content-main">' +
        '<div id="tab-manual" class="tab-panel" style="display:flex;">' + renderStatPanel() + '</div>' +
        '<div id="tab-ai" class="tab-panel" style="display:none;">' + renderDetailPanel() + '</div>' +
        '<div id="tab-return" class="tab-panel" style="display:none;">' + renderReturnPanel() + '</div>' +
      '</div>' +
    '</div>';
  }

  /* ===== 动态刷新面板数据和分页 ===== */
  function refreshPanel(panelId) {
    var state = pageStates[panelId];
    if (!state) return;
    var data = getPanelData(panelId);
    var tbody = document.getElementById(panelId + '-tbody');
    var paginationWrap = document.getElementById(panelId + '-pagination');

    if (tbody) {
      if (panelId === 'manual-nev' || panelId === 'manual-ice') {
        tbody.innerHTML = renderStatRows(data, state.curPage, state.pageSize);
      } else if (panelId === 'ai-nev' || panelId === 'ai-ice') {
        tbody.innerHTML = renderDetailRows(data, state.curPage, state.pageSize);
      } else if (panelId === 'tab-return') {
        tbody.innerHTML = renderReturnRows(data, state.curPage, state.pageSize);
      }
    }

    if (paginationWrap) {
      paginationWrap.outerHTML = renderPaginationHtml(panelId, data.length, state.curPage, state.pageSize);
    }
  }

  /* ===== 分页交互函数 ===== */
  function changePage(panelId, pageNum) {
    var state = pageStates[panelId];
    if (!state) return;
    state.curPage = parseInt(pageNum, 10) || 1;
    refreshPanel(panelId);
  }

  function prevPage(panelId) {
    var state = pageStates[panelId];
    if (!state || state.curPage <= 1) return;
    state.curPage -= 1;
    refreshPanel(panelId);
  }

  function nextPage(panelId) {
    var state = pageStates[panelId];
    if (!state) return;
    var data = getPanelData(panelId);
    var totalPages = Math.max(1, Math.ceil(data.length / state.pageSize));
    state.curPage += 1;
    refreshPanel(panelId);
  }

  function changePageSize(panelId, sizeVal) {
    var state = pageStates[panelId];
    if (!state) return;
    state.pageSize = parseInt(sizeVal, 10) || 10;
    state.curPage = 1;
    refreshPanel(panelId);
  }

  function jumpPage(panelId, inputEl) {
    if (!inputEl) return;
    var val = parseInt(inputEl.value, 10);
    if (!val || val < 1) val = 1;
    changePage(panelId, val);
  }

  /* ===== 一级 Tab 切换 ===== */
  function switchTab(el, tabId) {
    var pageEl = el.closest('.clue-report-page') || document;
    pageEl.querySelectorAll('.tab-bar .tab-item').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');

    pageEl.querySelectorAll('.content-main > .tab-panel').forEach(function (p) { p.style.display = 'none'; });
    var panel = pageEl.querySelector('#' + tabId);
    if (panel) {
      panel.style.display = 'flex';
      var activeSub = panel.querySelector('.sub-tab-item.active');
      if (activeSub) {
        var subIdMatch = activeSub.getAttribute('onclick');
        if (subIdMatch) {
          var match = subIdMatch.match(/'([^']+)'\s*\)/);
          if (match && match[1]) {
            panel.querySelectorAll('.sub-tab-panel').forEach(function (sp) { sp.style.display = 'none'; });
            var sp = panel.querySelector('#' + match[1]);
            if (sp) sp.style.display = 'flex';
          }
        }
      }
    }
  }

  /* ===== 二级 Tab 切换 ===== */
  function switchSubTab(el, subTabId) {
    var parentPanel = el.closest('.tab-panel');
    if (!parentPanel) return;
    parentPanel.querySelectorAll('.sub-tab-item').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    parentPanel.querySelectorAll('.sub-tab-panel').forEach(function (p) { p.style.display = 'none'; });
    var panel = parentPanel.querySelector('#' + subTabId);
    if (panel) panel.style.display = 'flex';
  }

  /* ===== 筛选操作与交互 ===== */
  function resetFilter() {
    var activePanel = document.querySelector('.clue-report-page .tab-panel[style*="flex"]') || document.querySelector('.clue-report-page .tab-panel');
    if (activePanel) {
      activePanel.querySelectorAll('input').forEach(function (inp) {
        if (inp.type === 'checkbox') return;
        inp.value = '';
      });
      activePanel.querySelectorAll('.multi-select-wrap').forEach(function (wrap) {
        var allCb = wrap.querySelector('.opt-all');
        var items = wrap.querySelectorAll('.opt-item');
        if (allCb) allCb.checked = true;
        items.forEach(function (i) { i.checked = false; });
        updateMultiSelectDisplay(wrap);
      });
    }
    initDefaultDates();
    showToast('已重置筛选条件');
  }

  function doQuery() {
    showToast('查询中...');
  }

  function doRefresh() {
    showToast('已刷新');
  }

  /* ===== 异步导出模拟（2.5s 动画与 Toast） ===== */
  function doExport(event) {
    var btn = event.currentTarget || event.target;
    if (!btn) return;
    if (btn.classList.contains('loading')) return;

    var originalText = btn.innerHTML;
    btn.classList.add('loading');
    btn.innerHTML = '<span class="loading-icon"></span> 导出中...';
    btn.disabled = true;

    showToast('导出任务已提交，系统正在生成报表，请稍后...', 'info');

    setTimeout(function () {
      btn.classList.remove('loading');
      btn.innerHTML = originalText;
      btn.disabled = false;
      showToast('导出成功！文件已准备就绪。', 'success');
    }, 2500);
  }

  /* ===== 多选下拉组件交互 ===== */
  function toggleMultiSelect(e, el) {
    if (e && e.stopPropagation) e.stopPropagation();
    var dropdown = el.nextElementSibling;
    if (!dropdown) return;
    var isOpen = dropdown.classList.contains('open');
    document.querySelectorAll('.multi-select-dropdown').forEach(function (d) { d.classList.remove('open'); });
    if (!isOpen) dropdown.classList.add('open');
  }

  function handleAllOptions(cb) {
    var wrap = cb.closest('.multi-select-wrap');
    if (!wrap) return;
    var items = wrap.querySelectorAll('.opt-item');
    if (cb.checked) {
      items.forEach(function (i) { i.checked = false; });
    }
    updateMultiSelectDisplay(wrap);
  }

  function handleOptionItem(cb) {
    var wrap = cb.closest('.multi-select-wrap');
    if (!wrap) return;
    var allCb = wrap.querySelector('.opt-all');
    var checkedItems = wrap.querySelectorAll('.opt-item:checked');
    if (allCb) {
      allCb.checked = checkedItems.length === 0;
    }
    updateMultiSelectDisplay(wrap);
  }

  function updateMultiSelectDisplay(wrap) {
    var allCb = wrap.querySelector('.opt-all');
    var checkedItems = wrap.querySelectorAll('.opt-item:checked');
    var display = wrap.querySelector('.multi-select-display');
    if (!display) return;
    if (allCb && allCb.checked) {
      display.textContent = '全部';
    } else if (checkedItems.length === 1) {
      var label = checkedItems[0].nextElementSibling;
      display.textContent = label ? label.textContent : '已选 1 项';
    } else if (checkedItems.length > 1) {
      display.textContent = '已选 ' + checkedItems.length + ' 项';
    } else {
      display.textContent = '请选择';
    }
  }

  /* ===== 日期初始化（过去 7 天） ===== */
  function initDefaultDates() {
    var now = new Date();
    var past = new Date();
    past.setDate(now.getDate() - 7);

    var curDateStr = formatDate(now);
    var pastDateStr = formatDate(past);
    var curDateTimeStr = formatDateTime(now);
    var pastDateTimeStr = formatDateTime(past);

    document.querySelectorAll('.clue-report-page .filter-date-range').forEach(function (range) {
      var dateStart = range.querySelector('.date-input-start');
      var dateEnd = range.querySelector('.date-input-end');
      if (dateStart && !dateStart.value) dateStart.value = pastDateStr;
      if (dateEnd && !dateEnd.value) dateEnd.value = curDateStr;

      var dtStart = range.querySelector('.datetime-input-start');
      var dtEnd = range.querySelector('.datetime-input-end');
      if (dtStart && !dtStart.value) dtStart.value = pastDateTimeStr;
      if (dtEnd && !dtEnd.value) dtEnd.value = curDateTimeStr;
    });
  }

  /* ===== 页面初始化 ===== */
  function init() {
    initDefaultDates();

    // 点击页面其他区域关闭多选下拉框
    if (!window._clueMultiSelectBound) {
      window._clueMultiSelectBound = true;
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.multi-select-wrap')) {
          document.querySelectorAll('.multi-select-dropdown').forEach(function (d) {
            d.classList.remove('open');
          });
        }
      });
    }
  }

  /* ===== 注册全局页面 ===== */
  window.Pages = window.Pages || {};
  window.Pages['report-clue'] = {
    render: render,
    init: init,
    switchTab: switchTab,
    switchSubTab: switchSubTab,
    changePage: changePage,
    prevPage: prevPage,
    nextPage: nextPage,
    changePageSize: changePageSize,
    jumpPage: jumpPage,
    resetFilter: resetFilter,
    doQuery: doQuery,
    doRefresh: doRefresh,
    doExport: doExport,
    toggleMultiSelect: toggleMultiSelect,
    handleAllOptions: handleAllOptions,
    handleOptionItem: handleOptionItem
  };

  // 全局兼容易读函数
  window.doExport = doExport;
  window.resetFilter = resetFilter;
  window.doQuery = doQuery;
  window.doRefresh = doRefresh;
})();
