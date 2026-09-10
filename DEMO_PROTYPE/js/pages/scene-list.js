/**
 * js/pages/scene-list.js — 外呼列表（六平台卡片网格 + 详情抽屉三 Tab）
 * 以中科金接入 demo 为底座，合并电声/大众/厚朴/冰兰/一知任务详情。
 */
(function () {
  'use strict';

  /* 中台统一任务状态字典（13 状态） */
  var TaskStatusMap = {
    1:  { code: 'NOT_START',          label: '未启动',   color: '#999999', dot: '#999999' },
    2:  { code: 'IN_PROGRESS',        label: '进行中',   color: '#52c41a', dot: '#52c41a' },
    3:  { code: 'PAUSED',             label: '已暂停',   color: '#faad14', dot: '#faad14' },
    4:  { code: 'STOPPED',            label: '已终止',   color: '#ff4d4f', dot: '#ff4d4f' },
    5:  { code: 'FINISHED',           label: '已完成',   color: '#52c41a', dot: '#52c41a' },
    6:  { code: 'RUNNABLE',           label: '可运行',   color: '#1677ff', dot: '#1677ff' },
    7:  { code: 'IN_QUEUE',           label: '排队中',   color: '#722ed1', dot: '#722ed1' },
    8:  { code: 'SYSTEM_HANG_UP',     label: '系统挂起', color: '#fa8c16', dot: '#fa8c16' },
    9:  { code: 'WAITING_FOR_REDIAL', label: '等待重呼', color: '#13c2c2', dot: '#13c2c2' },
    10: { code: 'EXPIRED',            label: '任务超时', color: '#f5222d', dot: '#f5222d' },
    11: { code: 'NOT_GENERATED',      label: '未生成',   color: '#bfbfbf', dot: '#bfbfbf' },
    12: { code: 'ARCHIVED',           label: '已归档',   color: '#8c8c8c', dot: '#8c8c8c' },
    14: { code: 'SYSTEM_SUSPENDED',   label: '系统暂停', color: '#fa8c16', dot: '#fa8c16' }
  };
  var TaskStatusCodeList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14];
  var UNMAPPED_STATUS = { code: '', label: '未映射', color: '#bbb', dot: '#bbb' };

  /* 旧 status 字符串仅兼容；新数据优先 taskStatusCode，其次平台原始状态 */
  var LegacyStatusMap = { not_started: 1, running: 2, completed: 5, paused: 3, terminated: 4 };

  /* 六平台原始状态 → 中台任务状态码 */
  var DazhongRemoteStatusMap = { 1: 3, 2: 2, 3: 7 };
  var ZkjTaskStatusMap = { 1: 1, 2: 2, 3: 5, 4: 4, 5: 7, 6: 3, 7: 14, 8: 10 };
  var BinglanTaskStatusMap = { 1: 2, 2: 5, 3: 4 };
  var YizhiTaskStatusMap = { NOT_STARTED: 1, IN_PROCESS: 2, USER_PAUSE: 3, TERMINATE: 4, COMPLETED: 5, RUNNABLE: 6, IN_QUEUE: 7, SYSTEM_HANG_UP: 8, WAITING_FOR_REDIAL: 9, EXPIRED: 10, NOT_GENERATED: 11, ARCHIVED: 12, SYSTEM_SUSPENDED: 14 };
  var DianshengStatusTypeMap = { 1: 6, 0: 14 };
  var HoupuTaskStatusMap = { 0: 1, 1: 2, 2: 5, 3: 4, 4: 8, 5: 3, 6: 14 };

  /* 六平台原始状态字段定义：field 缺失时走旧 status 兼容；存在但未命中映射时显示未映射 */
  var PlatformRawStatusFields = {
    '大众通信': { field: 'remoteStatus', map: DazhongRemoteStatusMap },
    '中科金智能': { field: 'taskStatus', map: ZkjTaskStatusMap },
    '冰兰': { field: 'taskStatus', map: BinglanTaskStatusMap },
    '一知科技': { field: 'taskStatus', map: YizhiTaskStatusMap },
    '电声': { field: 'statusType', map: DianshengStatusTypeMap },
    '厚朴': { field: 'taskStatus', map: HoupuTaskStatusMap }
  };

  /* 解析中台任务状态码：优先 taskStatusCode，其次平台原始状态，旧 status 字符串兜底兼容 */
  function resolveTaskStatusCode(item) {
    if (!item) return null;
    if (item.taskStatusCode !== undefined && item.taskStatusCode !== null && item.taskStatusCode !== '') {
      return Number(item.taskStatusCode);
    }
    var def = PlatformRawStatusFields[item.platform];
    if (def) {
      var raw = item[def.field];
      if (raw === undefined || raw === null || raw === '') return LegacyStatusMap[item.status];
      var mapped = def.map[raw];
      if (mapped !== undefined) return mapped;
      return null; /* 平台原始状态存在但无法识别 → 显示未映射，不回退旧 status */
    }
    return LegacyStatusMap[item.status];
  }

  /* 未知状态一律显示「未映射」，禁止回退未启动 */
  function getTaskStatusInfo(item) {
    var code = resolveTaskStatusCode(item);
    var info = TaskStatusMap[code];
    return { code: info ? code : null, info: info ? info : UNMAPPED_STATUS };
  }

  function refreshHoupuTaskStatuses() {
    var account = (window.MockHoupuAccounts || []).find(function (item) { return item.isDefault && item.enabled !== false; });
    (window.MockSceneList || []).forEach(function (item) {
      if (item.platform !== '厚朴') return;
      var taskId = item.task_id || item.taskId;
      var remoteTask = (window.MockHoupuRemoteTasks || []).find(function (task) {
        return task.taskId === taskId && (!account || task.accountId === account.id);
      });
      if (!remoteTask) return;
      item.taskStatus = remoteTask.taskStatus;
      item.taskStatusName = remoteTask.taskStatusName;
      item.taskStatusReadAt = new Date().toISOString();
    });
  }

  var PlatformTag = {
    '一知科技': { bg: '#e6f4ff', color: '#1677ff', border: '#91caff' },
    '中科金智能': { bg: '#f6ffed', color: '#52c41a', border: '#b7eb8f' },
    '电声': { bg: '#fff7e6', color: '#fa8c16', border: '#ffd591' },
    '冰兰': { bg: '#f9f0ff', color: '#722ed1', border: '#d3adf7' },
    '厚朴': { bg: '#fff1f0', color: '#f5222d', border: '#ffa39e' },
    '大众通信': { bg: '#e6fffb', color: '#13c2c2', border: '#87e8de' }
  };

  var SourceTag = {
    '手动导入': { bg: '#e6f4ff', color: '#1677ff', border: '#91caff' },
    '接口传入': { bg: '#f6ffed', color: '#52c41a', border: '#b7eb8f' },
    '自动传入': { bg: '#f6ffed', color: '#52c41a', border: '#b7eb8f' }
  };

  function getPlatform(pt) { return PlatformTag[pt] || PlatformTag['一知科技']; }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 参考任务补充统一中台访问范围后，只在当前实例/租户/能力授权内展示。 */
  function visibleTasks() {
    var list = (window.MockSceneList || []).slice();
    if (!window.AppState || typeof window.AppState.effectiveAccess !== 'function') return list;
    var access = window.AppState.effectiveAccess();
    var state = window.AppState.get();
    if (!access.valid || (access.capabilitySet || []).indexOf('AI_OUTBOUND') === -1) return [];
    return list.filter(function (item) {
      if (item.tenantId && (access.tenantIds || []).indexOf(item.tenantId) === -1) return false;
      if (item.environment && item.environment !== state.environment) return false;
      if (item.providerAccountId && (access.providerAccountIds || []).indexOf(item.providerAccountId) === -1) return false;
      return true;
    });
  }

  function renderEmpty(message) {
    return '<div class="scene-list-empty"><div class="scene-list-empty-icon">&#128222;</div><strong>暂无智能外呼任务</strong><span>' + escapeHtml(message || '当前筛选条件下没有任务，请调整后重试。') + '</span></div>';
  }

  function syncBodyLayerLock() {
    var layerIds = ['sceneDetailBackdrop', 'intentConfigBackdrop', 'importModalBackdrop', 'callRecordListBackdrop', 'callRecordDetailBackdrop'];
    var hasOpenLayer = layerIds.some(function (id) { return !!document.getElementById(id); });
    document.body.style.overflow = hasOpenLayer ? 'hidden' : '';
  }

  function renderCard(item) {
    var s = getTaskStatusInfo(item).info;
    var tag = SourceTag[item.source] || SourceTag['手动导入'];
    var pt = getPlatform(item.platform);
    var platformName = item.platform || '一知科技';
    return '' +
      '<div class="scene-card" data-id="' + item.id + '">' +
        '<div class="card-header">' +
          '<div class="card-title">' + escapeHtml(item.name) + '</div>' +
          '<div class="card-status"><span class="status-dot" style="background:' + s.dot + '"></span><span class="status-text" style="color:' + s.color + '">' + s.label + '</span></div>' +
        '</div>' +
        '<div class="card-tag" style="background:' + pt.bg + ';color:' + pt.color + ';border:1px solid ' + pt.border + '">' + platformName + '</div>' +
        '<div class="card-tag" style="background:' + tag.bg + ';color:' + tag.color + ';border:1px solid ' + tag.border + '">' + item.source + '</div>' +
        '<div class="card-stats">' +
          '<div class="stat-item"><div class="stat-label">已分配</div><div class="stat-value">' + (item.assigned || 0) + '</div></div>' +
          '<div class="stat-item"><div class="stat-label">待呼叫</div><div class="stat-value">' + (item.pending || 0) + '</div></div>' +
          '<div class="stat-item"><div class="stat-label">已呼叫</div><div class="stat-value">' + (item.called || 0) + '</div></div>' +
        '</div>' +
        '<div class="card-action-btn-group">' +
          '<button class="card-action-btn primary" onclick="window.Pages[\'scene-list\'].showDetail(' + item.id + ')">查看</button>' +
          '<button class="card-action-btn default" disabled>编辑</button>' +
          '<span class="card-action-more" onclick="window.Pages[\'scene-list\'].toggleMoreMenu(event,' + item.id + ')">⋮</span>' +
        '</div>' +
      '</div>';
  }

  function render() {
    refreshHoupuTaskStatuses();
    var taskList = visibleTasks();
    var cards = taskList.length ? taskList.map(renderCard).join('') : renderEmpty('当前租户或实例范围内暂无已授权的智能外呼任务。');
    var platformOptions = '<option value="">全部</option>' + (window.MockPlatforms || []).map(function (p) {
      return '<option value="' + p.name + '">' + p.name + '</option>';
    }).join('');
    return '' +
      '<div class="scene-list-page" data-page="ai-tasks" data-anno="ai-task-management" data-anno-page="ai-tasks" data-anno-label="智能外呼任务管理" data-anno-kind="region" data-anno-fields="FLD-012,FLD-013,FLD-014,FLD-015,FLD-016,FLD-017,FLD-018,FLD-038">' +
        '<div class="scene-page-header">' +
          '<div class="scene-page-title-row">' +
            '<span class="scene-page-title">外呼列表</span>' +
            '<span class="scene-page-subtitle">当前系统所有的外呼呼叫记录。</span>' +
          '</div>' +
        '</div>' +
        '<div class="filter-bar" data-anno-page="ai-tasks" data-anno-label="智能外呼任务筛选" data-anno-kind="region" data-anno-fields="FLD-107,FLD-108,FLD-109,FLD-110">' +
          '<div class="filter-item"><label>场景名称：</label><input type="text" class="filter-input" placeholder="请输入" style="width:200px;"></div>' +
          '<div class="filter-item"><label>状态：</label><select class="filter-select" style="width:140px;">' +
            '<option value="">请选择</option>' + TaskStatusCodeList.map(function (code) { return '<option value="' + code + '">' + TaskStatusMap[code].label + '</option>'; }).join('') +
          '</select></div>' +
          '<div class="filter-item"><label>所属平台：</label><select class="filter-select" style="width:140px;">' + platformOptions + '</select></div>' +
          '<div class="btn-group">' +
            '<button class="btn btn-default" onclick="window.Pages[\'scene-list\'].resetQuery()">重置</button>' +
            '<button class="btn btn-primary" onclick="window.Pages[\'scene-list\'].doQuery()">查询</button>' +
          '</div>' +
        '</div>' +
        '<div class="scene-card-grid" data-anno-page="ai-tasks" data-anno-label="智能外呼任务列表" data-anno-kind="region" data-anno-fields="FLD-011,FLD-012,FLD-013,FLD-014,FLD-015,FLD-016">' + cards + '</div>' +
      '</div>';
  }

  function doQuery() {
    var page = document.querySelector('.scene-list-page');
    if (!page) return;
    var name = page.querySelector('.filter-input');
    var status = page.querySelector('select');
    var platform = page.querySelectorAll('select')[1];
    var list = visibleTasks().filter(function (item) {
      if (name && name.value && item.name.indexOf(name.value) < 0) return false;
      if (status && status.value && getTaskStatusInfo(item).code !== Number(status.value)) return false;
      if (platform && platform.value && item.platform !== platform.value) return false;
      return true;
    });
    var grid = page.querySelector('.scene-card-grid');
    if (grid) grid.innerHTML = list.length ? list.map(renderCard).join('') : renderEmpty();
    showToast('查询完成', 'info');
  }

  function resetQuery() {
    var page = document.querySelector('.scene-list-page');
    if (!page) return;
    resetFilter(page);
    page.querySelectorAll('select').forEach(function (select) { select.value = ''; });
    var list = visibleTasks();
    var grid = page.querySelector('.scene-card-grid');
    if (grid) grid.innerHTML = list.length ? list.map(renderCard).join('') : renderEmpty('当前租户或实例范围内暂无已授权的智能外呼任务。');
  }

  /* ===== 详情抽屉 ===== */
  var currentDetailItem = null;

  var RecallStatusLabels = {
    '4': '等待重呼', '5': '未接听', '6': '拨打失败', '7': '已接听', '8': '限制拨打',
    '9': '占线', '11': '来电提醒', '12': '无法接通', '13': '空号', '14': '停机',
    '15': '关机', '17': '号码故障', '18': '线路故障'
  };

  /* 大众通信对话状态 / 通话状态码（0-12 数字枚举 + 字符串枚举）中文映射 */
  var DazhongStatusLabels = {
    0: '等待呼叫', 1: '呼叫成功', 2: '运营商拦截', 3: '拒接', 4: '无应答/无人接听', 5: '空号', 6: '关机',
    7: '停机', 8: '占线/用户正忙', 9: '呼入限制', 10: '欠费', 11: '黑名单', 12: '用户屏蔽',
    failed: '外呼失败', 'not convenient': '暂不方便', 'redial later': '稍后重呼', 'is not reachable': '无法接通',
    'cannot be connected': '无法连接', 'not answer': '无人接听', 'power off': '关机', 'hold on': '请稍候',
    'busy now': '当前忙', 'call reminder': '来电提醒', 'barring of incoming': '呼入限制', 'not in service': '停机',
    'not a local number': '非本地号码', forwarded: '已转接', 'line is busy': '线路忙', 'number change': '号码变更',
    'line fault': '线路故障', bus_close: '业务关闭', busy: '忙线'
  };

  /* 大众通话记录数字状态码（0-12）格式化为中文，未知码原值降级显示 */
  function formatDazhongCallStatus(status) {
    if (status === null || status === undefined || status === '') return '-';
    var text = DazhongStatusLabels[status];
    return text !== undefined ? text : String(status);
  }

  function fmtRecallStatus(codes) {
    if (!codes) return '无';
    return String(codes).split(',').map(function (c) { return RecallStatusLabels[c.trim()] || c.trim(); }).join('、');
  }

  function renderZkjTaskDetail(item) {
    var d = window.MockZkjTaskDetail && window.MockZkjTaskDetail[item.id];
    if (!d) return '<div class="task-detail-section"><div style="padding:32px;color:#bbb;text-align:center;">暂无任务详情数据</div></div>';
    var createdAtText = d.createdAt || d.outboundDate || '-';
    var robotText = d.robotName ? d.robotName + '（' + d.robotId + '）' : '-';
    var taskTypeText = d.taskType === 1 ? '手动' : '定时';
    var startModeText = taskTypeText + (d.outboundDate ? '，' + d.outboundDate : '');
    var daysMap = { '1': '周一', '2': '周二', '3': '周三', '4': '周四', '5': '周五', '6': '周六', '7': '周日' };
    var circleText = '';
    if (d.outboundCircleType === 1) {
      circleText = (d.outboundCircleValue || '').split(',').map(function (v) { return daysMap[v.trim()] || v.trim(); }).join('、');
    } else {
      circleText = d.outboundCircleValue || '-';
    }
    var intervalText = '';
    try { intervalText = JSON.parse(d.outboundTimeInterval).join(', '); } catch (e) { intervalText = d.outboundTimeInterval; }
    var recallText = '关闭';
    if (d.recallModel === 1) {
      var strategies = [];
      try { strategies = JSON.parse(d.recallStrategy); } catch (e) {}
      recallText = strategies.length ? strategies.map(function (s, i) {
        return '策略' + (i + 1) + '：' + (RecallStatusLabels[s.status] || s.status) + '，最多' + s.time + '次，间隔' + s.period + '分钟';
      }).join('<br>') : '高级模式（无策略配置）';
    } else if (d.recallModel === 2) {
      recallText = '重呼状态：' + fmtRecallStatus(d.recallStatus) + '<br>最大重呼次数：' + (d.maxRecallTimes || 0) + ' 次<br>重呼间隔：' + (d.recallPeriodMin || 0) + ' 分钟';
    }
    var rows = [
      ['创建日期', createdAtText],
      ['机器人名称', robotText],
      ['任务编码', d.taskCode],
      ['启动方式', startModeText],
      ['拨打时段', circleText + '  ' + (intervalText || '')],
      ['AI坐席数', d.aiSeatsNum + ' 个（弹性坐席：' + (d.aiSeatsFlag === 1 ? '开启' : '关闭') + '）'],
      ['自动重拨设置', recallText],
      ['外呼进度', d.outboundProgress + ' / ' + d.outboundTotal]
    ];
    return '<div class="task-detail-section">' + rows.map(function (r) {
      return '<div class="task-detail-row"><div class="task-detail-label">' + r[0] + '</div><div class="task-detail-value">' + r[1] + '</div></div>';
    }).join('') + '</div>';
  }

  function renderDazhongTaskDetail(item) {
    var d = window.MockDazhongTaskEditDetail && window.MockDazhongTaskEditDetail[item.id];
    if (!d) return '<div class="task-detail-section"><div style="padding:32px;color:#bbb;text-align:center;">暂无任务编辑接口数据</div></div>';
    var extra = d.new_task_extra || {};
    var weekLabels = { 0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六' };
    /* 拨打时间段：周几汇总 + 每条 work_hour 自身 wday 渲染 + 起止日期（弱化色） */
    var weekText = Array.isArray(extra.work_week) && extra.work_week.length
      ? extra.work_week.map(function (w) { return weekLabels[w] || ('星期' + w); }).join('、')
      : '-';
    var workHourText = Array.isArray(extra.work_hour) && extra.work_hour.length ? extra.work_hour.map(function (hour) {
      return (weekLabels[hour.wday] || ('星期' + hour.wday)) + ' ' + escapeHtml(hour.begin) + '–' + escapeHtml(hour.end);
    }).join('<br>') : '-';
    var periodText = weekText + '<br>' + workHourText +
      '<br><span class="task-detail-muted">' + escapeHtml(extra.start_time) + ' 至 ' + escapeHtml(extra.stop_time) + '</span>';
    /* 重呼条件：对象/数组两种形态归一化，聚合 da_status 与 hangup_cause 两个维度 */
    var redialConditionItems = Array.isArray(extra.redial_conditions)
      ? extra.redial_conditions
      : (extra.redial_conditions ? [extra.redial_conditions] : []);
    var redialCodes = [];
    var hangupCauses = [];
    redialConditionItems.forEach(function (condition) {
      if (!condition || typeof condition !== 'object') return;
      if (Array.isArray(condition.da_status)) redialCodes = redialCodes.concat(condition.da_status);
      if (Array.isArray(condition.hangup_cause)) hangupCauses = hangupCauses.concat(condition.hangup_cause);
      else if (condition.hangup_cause !== null && condition.hangup_cause !== undefined && condition.hangup_cause !== '') hangupCauses.push(condition.hangup_cause);
    });
    var redialConditionText = redialCodes.length ? redialCodes.map(function (code) { return DazhongStatusLabels[code] || escapeHtml(code); }).join('、') : '-';
    var hangupCauseText = hangupCauses.length ? hangupCauses.map(escapeHtml).join('、') : '-';
    var switchText = function (value) {
      if (value === true || value === 1) return '开启';
      if (value === false || value === 0) return '关闭';
      return '-';
    };
    var policyText = function (value) {
      if (value === true || value === 1) return '是';
      if (value === false || value === 0) return '否';
      return '-';
    };
    var unitText = function (value, unit) {
      return value === null || value === undefined || value === '' ? '-' : escapeHtml(value) + unit;
    };
    var seatsValue = extra.limit == null ? d.maximumcall : extra.limit;
    var redialText = '重呼配置：' + switchText(extra.redial_enabled)
      + '<br>首次外呼优先：' + policyText(extra.redial_new_number_policy)
      + '<br>重呼间隔：' + unitText(extra.redial_interval, ' 分钟')
      + '<br>重呼次数：' + unitText(extra.redial_max_times, ' 次')
      + '<br>重呼条件（挂断原因）：' + hangupCauseText
      + '<br>重呼条件（对话状态）：' + redialConditionText;
    var redialModeText = d.redialMode === 'scheduled' ? '定时重呼' : (d.redialMode === 'task' ? '任务重呼' : '未配置');
    var plannedRedialTimes = Number(d.scheduledRedialTimes);
    var maxCallRounds = d.redialMode === 'scheduled' && Number.isInteger(plannedRedialTimes) && plannedRedialTimes >= 1
      ? plannedRedialTimes + 1
      : null;
    var currentCallRound = Number(d.currentCallRound);
    var canJudgeLastCall = d.redialMode === 'scheduled' && Number.isInteger(currentCallRound) && currentCallRound >= 1 && maxCallRounds !== null;
    var isLastPlannedCall = canJudgeLastCall ? currentCallRound >= maxCallRounds : null;
    var callRoundText = canJudgeLastCall ? '第 ' + currentCallRound + '/' + maxCallRounds + ' 次' : '-';
    var lastCallText = isLastPlannedCall === null
      ? '<span class="dz-trace-status neutral">无法判断</span>'
      : (isLastPlannedCall
        ? '<span class="dz-trace-status last">是，已到计划上限</span>'
        : '<span class="dz-trace-status pending">否，仍有计划重呼</span>');
    function row(label, value) {
      return '<div class="task-detail-row"><div class="task-detail-label">' + label + '</div><div class="task-detail-value">' + (value || '-') + '</div></div>';
    }
    var scheduledTrace = d.redialMode === 'scheduled'
      ? row('计划重呼次数', Number.isInteger(plannedRedialTimes) ? plannedRedialTimes + ' 次（不含首次）' : '-')
        + row('人工配置确认', d.scheduledConfigConfirmed ? '<span class="dz-trace-status confirmed">已确认</span>' : '<span class="dz-trace-status pending">尚未确认</span>')
        + row('确认记录', d.scheduledConfigConfirmed ? escapeHtml(d.redialConfirmedBy || '-') + '，' + escapeHtml(d.redialConfirmedAt || '-') : '-')
        + row('当前呼叫轮次', callRoundText)
        + row('是否最后一次计划呼叫', lastCallText)
      : row('风险知情确认', d.taskRedialRiskAccepted ? '<span class="dz-trace-status confirmed">已知悉</span>' : '<span class="dz-trace-status pending">尚未确认</span>')
        + row('末次呼叫判断', '<span class="task-detail-muted">任务重呼不使用定时重呼次数判断</span>');
    return '<div class="task-detail-section dazhong-task-detail">' +
      row('任务名称', escapeHtml(d.name)) +
      row('话术名称', escapeHtml(d.destination_extension_name)) +
      row('任务 ID', escapeHtml(extra.id || item.uuid)) +
      row('任务描述', escapeHtml(d.remark)) +
      row('拨打时间段', periodText) +
      row('AI坐席数', escapeHtml(seatsValue) + ' 个（总并发：' + escapeHtml(d.maximumcall) + '，弹性坐席：' + (d.elasticity_task ? '开启' : '关闭') + '）') +
      row('自动重拨设置', redialText) +
      '<div class="dz-redial-trace" data-anno-page="ai-tasks" data-anno-label="大众通信重呼追溯" data-anno-kind="region" data-anno-fields="FLD-119">' +
        '<div class="dz-redial-trace-title">大众通信重呼追溯</div>' +
        row('重呼方式', redialModeText) +
        scheduledTrace +
      '</div>' +
    '</div>';
  }

  function renderDianshengTaskDetail(item) {
    var d = window.MockDianshengTaskDetail && window.MockDianshengTaskDetail[item.id];
    if (!d) return '<div class="task-detail-section"><div style="padding:32px;color:#bbb;text-align:center;">暂无任务详情数据</div></div>';
    var weekMap = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日' };
    var robotNameMap = {
      'robot_ds_nissan_001': '东风日产线索机器人',
      'robot_ds_nissan_002': '东风日产保客关怀机器人',
      'robot_ds_yuxing_001': '渝兴店售前线索机器人',
      'robot_ds_yufa_001': '渝发店售后邀约机器人'
    };
    function boolText(value) { return value ? '开启' : '关闭'; }
    /* 机器人名称：名称（编码），静态映射兜底 */
    var robotCode = (d.leadTypeRobotMapping && d.leadTypeRobotMapping.robotCode) || d.robotId || '-';
    var robotName = d.robotName || robotNameMap[robotCode] || '-';
    var robotText = (robotName !== '-' && robotCode !== '-') ? robotName + '（' + robotCode + '）' : (robotName !== '-' ? robotName : robotCode);
    /* 呼叫时段：时段N：周几 begin-end + 排除日期 + 超出时段 */
    var cw = d.callTimeWindow || {};
    var windows = Array.isArray(cw.windows) ? cw.windows : [];
    var callWindowText = windows.length ? windows.map(function (win, i) {
      var weekdays = Array.isArray(win.weekdays) ? win.weekdays.map(function (w) { return weekMap[w] || w; }).join('、') : '-';
      return '时段' + (i + 1) + '：' + weekdays + ' ' + (win.beginTime || '-') + '-' + (win.endTime || '-');
    }).join('<br>') : '-';
    if (Array.isArray(cw.excludeDates) && cw.excludeDates.length) {
      callWindowText += '<br>排除日期：' + cw.excludeDates.map(escapeHtml).join('、');
    }
    callWindowText += '<br>超出时段：' + (cw.onOutOfWindow === 'skip' ? '跳过' : '顺延');
    /* N天M呼策略 */
    var retryPolicy = d.nDayMCallPolicy || d.retryPolicy || {};
    var intervalText = Array.isArray(retryPolicy.intervalMinutes)
      ? retryPolicy.intervalMinutes.map(function (m, i) { return '第' + (i + 1) + '次重呼间隔 ' + m + ' 分钟'; }).join('；')
      : '';
    var retryText = [
      retryPolicy.days ? '最大执行天数：' + retryPolicy.days + ' 天' : '',
      retryPolicy.maxAttempts ? '最大呼叫次数：' + retryPolicy.maxAttempts + ' 次' : '',
      intervalText
    ].filter(Boolean).join('<br>');
    /* 黑名单 / 自动启动 */
    var blacklistText = d.blacklistCheck
      ? boolText(d.blacklistCheck.enabled) + (d.blacklistCheck.enabled && d.blacklistCheck.blacklistGroupCode ? '，分组编码：' + escapeHtml(d.blacklistCheck.blacklistGroupCode) : '')
      : '-';
    var autoStartText = d.autoStart
      ? boolText(d.autoStart.enabled) + (!d.autoStart.enabled && d.autoStart.executeDateTime ? '，执行时间：' + escapeHtml(d.autoStart.executeDateTime) : '')
      : '-';
    function row(label, value) {
      return '<div class="task-detail-row"><div class="task-detail-label">' + label + '</div><div class="task-detail-value">' + (value || '-') + '</div></div>';
    }
    return '<div class="task-detail-section">' +
      row('任务编码', escapeHtml(d.strategyCode || d.taskCode)) +
      row('任务名称', escapeHtml(d.strategyName || d.taskName)) +
      row('机器人名称', robotText) +
      row('场景类型', escapeHtml(d.sceneTypeName || (d.leadTypeRobotMapping && d.leadTypeRobotMapping.leadTypeName) || '-')) +
      row('呼叫时段', callWindowText) +
      row('自动重呼配置', retryText) +
      row('黑名单校验配置', blacklistText) +
      row('自动启动配置', autoStartText) +
      row('备注', escapeHtml(d.remark)) +
      row('创建时间', escapeHtml(d.createdTime || d.createdAt)) +
      row('更新时间', escapeHtml(d.updatedTime)) +
    '</div>';
  }

  function renderHoupuTaskDetail(item) {
    var d = window.MockHoupuTaskDetail && window.MockHoupuTaskDetail[item.id];
    if (!d) return '<div class="task-detail-section"><div style="padding:32px;color:#bbb;text-align:center;">暂无任务详情数据</div></div>';
    function row(label, value) {
      return '<div class="task-detail-row"><div class="task-detail-label">' + label + '</div><div class="task-detail-value">' + (value || '-') + '</div></div>';
    }
    var defaultAccount = (window.MockHoupuAccounts || []).find(function (account) { return account.isDefault && account.enabled !== false; });
    var botText = d.botName ? d.botName + '（' + d.botId + '）' : (d.botId || '-');
    return '<div class="task-detail-section">' +
      row('任务ID', escapeHtml(d.task_id)) +
      row('厚朴账号', defaultAccount ? escapeHtml(defaultAccount.name + '（' + defaultAccount.id + '）') : '未配置') +
      row('任务名称', escapeHtml(d.taskName)) +
      row('机器人', botText) +
      row('执行时段', escapeHtml(d.callPeriod)) +
      row('并发', d.concurrency) +
      row('重呼', escapeHtml(d.recall)) +
      row('未呼优先', d.unCalledPriority ? '是' : '否') +
      row('批次号', escapeHtml(d.batchId)) +
      row('平台有效号码数', d.validNumberCount) +
      row('创建时间', escapeHtml(d.createdAt)) +
      row('外呼进度', escapeHtml(d.progress)) +
    '</div>';
  }

  function renderYizhiTaskDetail(item) {
    var d = window.MockYizhiTaskDetail && window.MockYizhiTaskDetail[item.id];
    if (!d) return '<div class="task-detail-section"><div style="padding:32px;color:#bbb;text-align:center;">暂无任务详情数据</div></div>';
    var redialHtml = '<div>条件组1</div><div>' + (d.redialConfig || '关闭') + '</div>';
    function row(label, value) {
      return '<div class="task-detail-row"><div class="task-detail-label">' + label + '</div><div class="task-detail-value">' + (value || '-') + '</div></div>';
    }
    return '<div class="task-detail-section">' +
      row('创建日期', escapeHtml(d.createTime)) +
      row('话术名称', escapeHtml(d.robotName)) +
      row('任务id', escapeHtml(d.taskCode || item.id)) +
      row('任务描述', '无') +
      row('启动方式', '手动') +
      row('拨打时间段', escapeHtml(d.callTimeWindow)) +
      row('自动重拨设置', redialHtml) +
      row('外呼进度', d.calledCount + ' / ' + d.totalCount) +
      row('一知科技场景id', escapeHtml(d.yizhiSceneId)) +
      row('模型类型', escapeHtml(d.modelType)) +
      row('一知账号', escapeHtml(d.yizhiAccount)) +
    '</div>';
  }

  function renderBinglanTaskDetail(item) {
    var d = window.MockBinglanTaskDetail && window.MockBinglanTaskDetail[item.id];
    if (!d) return '<div class="task-detail-section"><div style="padding:32px;color:#bbb;text-align:center;">暂无任务详情数据</div></div>';
    function row(label, value) {
      return '<div class="task-detail-row"><div class="task-detail-label">' + label + '</div><div class="task-detail-value">' + value + '</div></div>';
    }
    var groups = Array.isArray(d.redialGroups) ? d.redialGroups : [];
    var redialRow1 = groups.length
      ? '<div>条件组1</div><div>重拨间隔：' + groups[0].interval + ' 分钟</div><div>重拨次数：' + groups[0].times + ' 次</div><div>重拨条件：' + escapeHtml(groups[0].conditions) + '</div>'
      : '-';
    var html = '<div class="task-detail-section">' +
      row('创建日期', escapeHtml(d.createTime)) +
      row('话术名称', escapeHtml(d.robotName)) +
      row('任务id', escapeHtml(d.taskId)) +
      row('任务描述', escapeHtml(d.taskDesc)) +
      row('启动方式', escapeHtml(d.startMode)) +
      row('拨打时间段', escapeHtml(d.callWindow)) +
      row('风控策略', '<div>自定义策略：&nbsp;&nbsp;' + escapeHtml(d.riskCustom) + '</div><div style="margin-top:2px;">账号黑名单：&nbsp;&nbsp;' + escapeHtml(d.riskBlacklist) + '</div>') +
      row('自动重拨设置', redialRow1);
    if (groups.length > 1) {
      html += row('', '<div>条件组2</div><div>重拨间隔：' + groups[1].interval + ' 分钟</div><div>重拨次数：' + groups[1].times + ' 次</div><div>重拨条件：' + escapeHtml(groups[1].conditions) + '</div>');
    }
    html += '</div>';
    return html;
  }

  function renderTaskDetail() {
    var item = currentDetailItem;
    var content = '<div class="task-detail-section"><div style="padding:32px;color:#bbb;text-align:center;">暂无任务数据</div></div>';
    if (item) {
      if (item.platform === '中科金智能') content = renderZkjTaskDetail(item);
      else if (item.platform === '大众通信') content = renderDazhongTaskDetail(item);
      else if (item.platform === '电声') content = renderDianshengTaskDetail(item);
      else if (item.platform === '厚朴') content = renderHoupuTaskDetail(item);
      else if (item.platform === '冰兰') content = renderBinglanTaskDetail(item);
      else content = renderYizhiTaskDetail(item);
    }
    return '<div data-anno-page="ai-tasks" data-anno-label="智能外呼任务配置详情" data-anno-kind="region" data-anno-fields="FLD-114,FLD-115,FLD-116,FLD-117,FLD-118,FLD-119">' + content + '</div>';
  }

  /* ===== 数据概览（分平台对齐 releases_demo 六个接入原型） ===== */
  /* 平台 → 画像 key：default=中科金/冰兰/厚朴；diansheng=电声；dazhong=大众通信；yizhi=一知科技 */
  function getOverviewProfileKey() {
    var p = currentDetailItem ? currentDetailItem.platform : '';
    if (p === '一知科技') return 'yizhi';
    if (p === '电声') return 'diansheng';
    if (p === '大众通信') return 'dazhong';
    return 'default';
  }

  function getIntentProfile() {
    var profiles = (window.MockDataOverview && window.MockDataOverview.intentProfiles) || {};
    return profiles[getOverviewProfileKey()] || profiles.default || { levels: [], options: [], fallbacks: [] };
  }

  /* 意向等级运行时状态（按画像 key 分组，配置保存后驻留内存，跨抽屉打开保留） */
  var intentLevelsState = {};

  function getCurrentIntentLevels() {
    var key = getOverviewProfileKey();
    if (!intentLevelsState[key]) {
      var profile = getIntentProfile();
      intentLevelsState[key] = (profile.levels || []).map(function (l) { return { label: l.label, tags: l.tags.slice() }; });
    }
    return intentLevelsState[key];
  }

  function getIntentTagOptions() {
    return getIntentProfile().options || [];
  }

  function getIntentLevel1Tag() {
    var levels = getCurrentIntentLevels();
    return (levels[0] && levels[0].tags[0]) || (getIntentProfile().fallbacks || [])[0] || 'A (高意向)';
  }

  function getIntentLevel2Tag() {
    var levels = getCurrentIntentLevels();
    return (levels[1] && levels[1].tags[0]) || (getIntentProfile().fallbacks || [])[1] || 'B (潜在)';
  }

  /* 意向分类卡片标题：大众通信专属格式（A-高意向占比 / A-高意向 / B-意向客户合计占比），其余「X类客户占比/数」 */
  function getIntentMetricTitle(metric) {
    var l1 = getIntentLevel1Tag();
    var l2 = getIntentLevel2Tag();
    var titles;
    if (getIntentProfile().titleFormat === 'dazhong') {
      titles = {
        level1Rate: l1 + '占比', level2Rate: l2 + '占比', level12Rate: l1 + ' / ' + l2 + '合计占比',
        level1Count: l1 + '数量', level2Count: l2 + '数量', level12Count: l1 + ' / ' + l2 + '合计数量'
      };
    } else {
      titles = {
        level1Rate: l1 + '类客户占比', level2Rate: l2 + '类客户占比', level12Rate: l1 + '/' + l2 + '类客户占比',
        level1Count: l1 + '类客户数', level2Count: l2 + '类客户数', level12Count: l1 + '/' + l2 + '类客户数'
      };
    }
    return titles[metric] || '';
  }

  function helpIcon(tooltip, rateKey) {
    var rateAttr = rateKey ? ' data-intent-rate="' + rateKey + '"' : '';
    return '<span class="overview-help"' + rateAttr + ' data-tooltip="' + tooltip + '">&#9432;</span>';
  }

  /* 一知任务级动态统计（接听数/意向分布/平均通话时长） */
  function getYizhiStats() {
    if (!currentDetailItem) return null;
    return (window.MockYizhiTaskStats || {})[currentDetailItem.id] || null;
  }

  /* 区块一：外呼数据（五平台写死基线；一知动态口径：已分配/已呼叫/接听数/平均时长） */
  function getOverviewStats() {
    var base = (window.MockDataOverview && window.MockDataOverview.baselineStats) ||
      { imported: 6, called: 1, totalCalls: 2, filtered: 5, filteredRate: '83.33%', answered: 0, answerRate: '0%', avgDuration: 0 };
    if (getOverviewProfileKey() !== 'yizhi' || !currentDetailItem) return base;
    var st = getYizhiStats() || {};
    var imported = currentDetailItem.assigned || 0;
    var called = currentDetailItem.called || 0;
    var answered = st.answeredCount || 0;
    var filtered = Math.max(imported - called, 0);
    var filteredRate = imported > 0 ? ((filtered / imported) * 100).toFixed(2) + '%' : '0%';
    var answerRate = called > 0 ? ((answered / called) * 100).toFixed(0) + '%' : '0%';
    return {
      imported: imported, called: called, totalCalls: called,
      filtered: filtered, filteredRate: filteredRate,
      answered: answered, answerRate: answerRate,
      avgDuration: (st.avgDuration || '0秒').replace('秒', '')
    };
  }

  function renderOverviewStatsBlock() {
    var s = getOverviewStats();
    function card(title, tooltip, valueHtml, subHtml) {
      return '<div class="overview-card">' +
        '<div class="overview-card-title">' + title + ' ' + helpIcon(tooltip) + '</div>' +
        '<div class="overview-card-value">' + valueHtml + '</div>' + (subHtml || '') +
      '</div>';
    }
    return '' +
      '<div class="overview-block">' +
        '<div class="overview-block-header"><div class="overview-block-title">外呼数据</div></div>' +
        '<div class="overview-block-body"><div class="overview-grid cols-5">' +
          card('导入客户数', '当前任务导入的客户手机号总数（去重）', s.imported) +
          card('外呼客户数', '提交到外部智能呼叫系统接口的客户手机号总数（去重）', s.called, '<div class="overview-card-sub">总外呼数：' + s.totalCalls + '</div>') +
          card('去重过滤客户数', '从本地任务已过滤获取（去重）', s.filtered, '<div class="overview-card-sub">过滤比例：' + s.filteredRate + '</div>') +
          card('接听客户数', '已接听的客户手机号数量（去重）', s.answered, '<div class="overview-card-sub">总接听率：' + s.answerRate + '</div>') +
          card('平均通话时长', '每次通话的平均时长', s.avgDuration + '<span class="overview-unit">秒</span>') +
        '</div></div>' +
      '</div>';
  }

  /* 区块二：意向分类（五平台写死 0；一知动态：意向分布 a/b 占比与数量） */
  function renderIntentCategoryBlock() {
    var vals = { rate1: '0', rate2: '0', rate12: '0', count1: '0', count2: '0', count12: '0' };
    if (getOverviewProfileKey() === 'yizhi' && currentDetailItem) {
      var st = getYizhiStats() || {};
      var s = st.intentionStats || { a: 0, b: 0 };
      var called = currentDetailItem.called || 0;
      vals.rate1 = called > 0 ? ((s.a / called) * 100).toFixed(0) : 0;
      vals.rate2 = called > 0 ? ((s.b / called) * 100).toFixed(0) : 0;
      vals.rate12 = called > 0 ? (((s.a + s.b) / called) * 100).toFixed(0) : 0;
      vals.count1 = s.a; vals.count2 = s.b; vals.count12 = s.a + s.b;
    }
    function card(title, tooltip, valueHtml, rateKey) {
      return '<div class="overview-card">' +
        '<div class="overview-card-title">' + title + ' ' + helpIcon(tooltip, rateKey) + '</div>' +
        '<div class="overview-card-value sub">' + valueHtml + '</div>' +
      '</div>';
    }
    return '' +
      '<div class="overview-block">' +
        '<div class="overview-block-header">' +
          '<div class="overview-block-title orange">意向分类</div>' +
          '<span class="overview-config-btn" onclick="window.Pages[\'scene-list\'].showIntentConfig()">&#9881; 配置</span>' +
        '</div>' +
        '<div class="overview-block-body">' +
          '<div class="overview-grid cols-3">' +
            card(getIntentMetricTitle('level1Rate'), '该意向的用户总数/呼叫总数', vals.rate1 + '<span class="overview-unit">%</span>', 'level1') +
            card(getIntentMetricTitle('level2Rate'), '该意向的用户总数/呼叫总数', vals.rate2 + '<span class="overview-unit">%</span>', 'level2') +
            card(getIntentMetricTitle('level12Rate'), '该意向的用户总数/呼叫总数', vals.rate12 + '<span class="overview-unit">%</span>', 'level12') +
          '</div>' +
          '<div class="overview-grid cols-3" style="margin-top:1px;">' +
            card(getIntentMetricTitle('level1Count'), '意向等级1客户数量', vals.count1) +
            card(getIntentMetricTitle('level2Count'), '意向等级2客户数量', vals.count2) +
            card(getIntentMetricTitle('level12Count'), '意向等级1或2客户合计数量', vals.count12) +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* 通话时长柱状图（五平台 y 轴 1500 无千分位；一知 y 轴 25 万千分位） */
  function getDurationDist() {
    var dist = getOverviewProfileKey() === 'yizhi'
      ? (window.MockDataOverview && window.MockDataOverview.yizhiDuration)
      : (window.MockDataOverview && window.MockDataOverview.durationDist);
    return dist || { max: 1, yAxis: [], bars: [] };
  }

  function renderDurationPanel() {
    var dist = getDurationDist();
    var max = dist.max || 1;
    var thousand = !!dist.thousand;
    var barsHtml = (dist.bars || []).map(function (b) {
      var pct = Math.round(b.count / max * 100);
      var label = thousand ? b.count.toLocaleString() : b.count;
      return '<div class="duration-bar-item"><strong>' + label + '</strong><i style="height:' + pct + '%"></i><span>' + b.label + '</span></div>';
    }).join('');
    var yAxisHtml = (dist.yAxis || []).map(function (y) { return '<span>' + y + '</span>'; }).join('');
    return '' +
      '<div class="overview-chart-panel duration-panel">' +
        '<div class="overview-chart-title">通话时长</div>' +
        '<div class="duration-axis-title">客户数量（位）</div>' +
        '<div class="duration-chart">' +
          '<div class="duration-grid-lines"><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
          '<div class="duration-bars">' + barsHtml + '</div>' +
          '<div class="duration-y-axis">' + yAxisHtml + '</div>' +
        '</div>' +
      '</div>';
  }

  /* 一知客户关注点（focus-item + 前十/全部切换，万级数据千分位展示） */
  function renderYizhiFocusPanel() {
    var data = (window.MockDataOverview && window.MockDataOverview.yizhiFocus) || [];
    if (!data.length) return '';
    var maxValue = data[0].count;
    var itemsHtml = data.map(function (d) {
      var pct = Math.round(d.count / maxValue * 100);
      return '<div class="focus-item"><span class="focus-name">' + escapeHtml(d.name) + '</span><div class="focus-track"><i style="width:' + pct + '%"></i></div><span class="focus-count">' + d.count.toLocaleString() + '</span></div>';
    }).join('');
    return '' +
      '<div class="overview-chart-panel focus-panel" style="flex:1;">' +
        '<div class="overview-chart-header">' +
          '<span class="overview-chart-title">客户关注点</span>' +
          '<div class="focus-toggle">' +
            '<span class="focus-toggle-item active" onclick="window.Pages[\'scene-list\'].toggleFocus(this,\'ten\')">前十</span>' +
            '<span class="focus-toggle-item" onclick="window.Pages[\'scene-list\'].toggleFocus(this,\'all\')">全部</span>' +
          '</div>' +
        '</div>' +
        '<div class="focus-list">' + itemsHtml + '</div>' +
      '</div>';
  }

  /* 客户关注点 前十/全部 切换（一知：mock 共 10 项，切换为提示交互） */
  function toggleFocus(el, mode) {
    var header = el.closest('.overview-chart-header');
    if (header) {
      var items = header.querySelectorAll('.focus-toggle-item');
      for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
    }
    el.classList.add('active');
    showToast(mode === 'all' ? '已展示全部客户关注点' : '已展示前十客户关注点', 'info');
  }

  /* 区块三：意向洞察（环形图按平台：default 6级/电声 4级专属渐变/大众 6级横杠文案/一知 8级；
     面板：五平台仅通话时长单面板；一知为客户关注点+通话时长双面板） */
  function renderInsightBlock() {
    var key = getOverviewProfileKey();
    var donuts = (window.MockDataOverview && window.MockDataOverview.donuts) || {};
    var donutList = donuts[key] || donuts.default || [];
    var ringCls = key === 'diansheng' ? ' diansheng' : (key === 'yizhi' ? ' yizhi' : '');
    var chartCls = key === 'yizhi' ? ' yizhi' : '';
    var donutHtml = donutList.map(function (d) {
      return '<div class="intent-donut-label ' + d.cls + '"><span>' + d.text + '</span></div>';
    }).join('');
    var panels = key === 'yizhi' ? renderYizhiFocusPanel() + renderDurationPanel() : renderDurationPanel();
    return '' +
      '<div class="overview-block">' +
        '<div class="overview-block-header"><div class="overview-block-title blue">意向洞察</div></div>' +
        '<div class="overview-block-body">' +
          '<div class="intent-donut-panel">' +
            '<div class="intent-donut-chart' + chartCls + '" aria-label="意向分类占比图">' +
              '<div class="intent-donut-ring' + ringCls + '"></div>' +
              donutHtml +
            '</div>' +
          '</div>' +
          '<div class="overview-insight-grid' + (key === 'yizhi' ? ' dual' : '') + '">' + panels + '</div>' +
        '</div>' +
      '</div>';
  }

  function renderDataOverview() {
    return '<div class="overview-section" data-anno-page="ai-tasks" data-anno-label="智能外呼任务数据概览" data-anno-kind="region" data-anno-fields="FLD-123,FLD-124,FLD-125">' +
      renderOverviewStatsBlock() +
      renderIntentCategoryBlock() +
      renderInsightBlock() +
    '</div>';
  }

  /* ===== 意向数据设置弹窗（多选下拉 + 保存后回写卡片标题） ===== */
  function getTagsDisplayText(levelIndex) {
    var level = getCurrentIntentLevels()[levelIndex];
    if (!level || level.tags.length === 0) return '请选择标签';
    return level.tags.join('、');
  }

  function getTagsCount(levelIndex) {
    var level = getCurrentIntentLevels()[levelIndex];
    return level ? level.tags.length : 0;
  }

  function renderIntentConfigModal() {
    var options = getIntentTagOptions();
    var rows = getCurrentIntentLevels().map(function (l, index) {
      var optionHtml = options.map(function (opt) {
        var selected = l.tags.indexOf(opt) > -1;
        return '<div class="intent-multi-select-option' + (selected ? ' selected' : '') + '" data-value="' + escapeHtml(opt) + '" onclick="window.Pages[\'scene-list\'].toggleIntentOption(' + index + ', \'' + escapeHtml(opt) + '\', this, event)">' +
          '<span class="intent-checkbox">' + (selected ? '&#10003;' : '') + '</span>' +
          '<span class="intent-option-text">' + escapeHtml(opt) + '</span>' +
        '</div>';
      }).join('');
      return '' +
        '<div class="intent-config-row">' +
          '<div class="intent-config-label"><span class="required">*</span>' + l.label + '：</div>' +
          '<div class="intent-multi-select" data-level="' + index + '">' +
            '<div class="intent-multi-select-display" onclick="window.Pages[\'scene-list\'].toggleIntentDropdown(' + index + ', event)">' +
              '<span class="intent-multi-select-text" id="intentSelectText_' + index + '">' + escapeHtml(getTagsDisplayText(index)) + '</span>' +
              '<span class="intent-multi-select-count" id="intentSelectCount_' + index + '">' + (getTagsCount(index) > 0 ? '(' + getTagsCount(index) + ')' : '') + '</span>' +
              '<span class="intent-multi-select-arrow">&#9662;</span>' +
            '</div>' +
            '<div class="intent-multi-select-dropdown" id="intentDropdown_' + index + '">' + optionHtml + '</div>' +
          '</div>' +
        '</div>';
    }).join('');
    return '' +
      '<div class="intent-config-backdrop" id="intentConfigBackdrop" onclick="window.Pages[\'scene-list\'].closeIntentConfig(event)">' +
        '<div class="intent-config-modal" onclick="event.stopPropagation()">' +
          '<div class="intent-config-header">' +
            '<span class="intent-config-title">意向数据设置</span>' +
            '<span class="intent-config-close" onclick="window.Pages[\'scene-list\'].closeIntentConfig()">&#10005;</span>' +
          '</div>' +
          '<div class="intent-config-body">' +
            '<div class="intent-config-tip"><span class="intent-config-tip-icon">&#9432;</span><span>下列设置的字段将在任务数据内展示</span></div>' +
            '<div class="intent-config-section-title">意向数据</div>' +
            rows +
          '</div>' +
          '<div class="intent-config-footer">' +
            '<button class="btn btn-default" onclick="window.Pages[\'scene-list\'].closeIntentConfig()">取消</button>' +
            '<button class="btn btn-primary" onclick="window.Pages[\'scene-list\'].saveIntentConfig()">保存</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function showIntentConfig() {
    document.body.insertAdjacentHTML('beforeend', renderIntentConfigModal());
    document.body.style.overflow = 'hidden';
    document.addEventListener('click', closeIntentDropdownOutside);
  }

  function closeIntentDropdownOutside(e) {
    if (!(e.target.closest && e.target.closest('.intent-multi-select'))) {
      var dropdowns = document.querySelectorAll('.intent-multi-select-dropdown');
      for (var i = 0; i < dropdowns.length; i++) dropdowns[i].classList.remove('open');
    }
  }

  function toggleIntentDropdown(levelIndex, e) {
    if (e) e.stopPropagation();
    var dropdowns = document.querySelectorAll('.intent-multi-select-dropdown');
    for (var i = 0; i < dropdowns.length; i++) {
      if (i !== levelIndex) dropdowns[i].classList.remove('open');
    }
    var dropdown = document.getElementById('intentDropdown_' + levelIndex);
    if (dropdown) dropdown.classList.toggle('open');
  }

  function toggleIntentOption(levelIndex, tagValue, el, e) {
    if (e) e.stopPropagation();
    var level = getCurrentIntentLevels()[levelIndex];
    if (!level) return;
    var idx = level.tags.indexOf(tagValue);
    if (idx > -1) {
      level.tags.splice(idx, 1);
      if (el) {
        el.classList.remove('selected');
        var checkbox = el.querySelector('.intent-checkbox');
        if (checkbox) checkbox.textContent = '';
      }
    } else {
      if (level.tags.length >= 3) {
        showToast('最多选择3项', 'warning');
        return;
      }
      level.tags.push(tagValue);
      if (el) {
        el.classList.add('selected');
        var checkbox2 = el.querySelector('.intent-checkbox');
        if (checkbox2) checkbox2.textContent = '✓';
      }
    }
    var textEl = document.getElementById('intentSelectText_' + levelIndex);
    var countEl = document.getElementById('intentSelectCount_' + levelIndex);
    if (textEl) textEl.textContent = getTagsDisplayText(levelIndex);
    if (countEl) countEl.textContent = getTagsCount(levelIndex) > 0 ? '(' + getTagsCount(levelIndex) + ')' : '';
    var dropdown = document.getElementById('intentDropdown_' + levelIndex);
    if (dropdown) dropdown.classList.remove('open');
  }

  function closeIntentConfig(e) {
    if (e && e.target !== e.currentTarget) return;
    var backdrop = document.getElementById('intentConfigBackdrop');
    if (backdrop) {
      backdrop.remove();
      syncBodyLayerLock();
      document.removeEventListener('click', closeIntentDropdownOutside);
    }
  }

  function saveIntentConfig() {
    showToast('保存成功', 'success');
    closeIntentConfig();
    updateIntentCardTitles();
  }

  /* 保存配置后按当前平台标题格式回写意向分类卡片标题 */
  function updateIntentCardTitles() {
    var titles = document.querySelectorAll('.overview-block .overview-card-title');
    for (var i = 0; i < titles.length; i++) {
      var title = titles[i];
      var helpEl = title.querySelector('.overview-help');
      if (!helpEl) continue;
      var rateKey = helpEl.getAttribute('data-intent-rate') || '';
      var tooltip = helpEl.getAttribute('data-tooltip') || '';
      var metric = '';
      if (rateKey === 'level1') metric = 'level1Rate';
      else if (rateKey === 'level2') metric = 'level2Rate';
      else if (rateKey === 'level12') metric = 'level12Rate';
      else if (tooltip === '意向等级1客户数量') metric = 'level1Count';
      else if (tooltip === '意向等级2客户数量') metric = 'level2Count';
      else if (tooltip === '意向等级1或2客户合计数量') metric = 'level12Count';
      if (metric) title.innerHTML = getIntentMetricTitle(metric) + ' ' + helpEl.outerHTML;
    }
  }

  /* ===== 呼叫名单 ===== */
  /* 已分配号码：从 MockAssignedData 按当前场景 id 动态取数 */
  function getCurrentAssignedRows() {
    if (!currentDetailItem) return [];
    if (!window.MockAssignedData) window.MockAssignedData = {};
    return window.MockAssignedData[currentDetailItem.id] || [];
  }

  function removeAssigned(phone) {
    if (!currentDetailItem) return;
    if (!window.MockAssignedData || !window.MockAssignedData[currentDetailItem.id]) return;
    window.MockAssignedData[currentDetailItem.id] = window.MockAssignedData[currentDetailItem.id].filter(function (r) { return r.phone !== phone; });
    showToast('号码「' + phone + '」已移除', 'info');
    /* 刷新当前子标签 */
    var container = document.getElementById('sceneSubContent');
    if (container) {
      var activeSubTab = container.parentElement.querySelector('.scene-detail-subtab.active');
      var tabName = activeSubTab ? activeSubTab.textContent.trim() : '已分配';
      container.innerHTML = renderSubContent(tabName);
    }
  }

  var SubTabConfig = {
    '已分配': {
      getSummary: function () { return '共 ' + getCurrentAssignedRows().length + ' 个外呼号码传入成功，正在等待进入呼叫队列。'; },
      actions: true,
      exportBtn: false,
      cols: ['用户号码', '号码分配时间', '等待提交时间', '操作'],
      getRows: function () { return getCurrentAssignedRows(); },
      renderRow: function (r) {
        return '<td>' + escapeHtml(r.phone) + '</td><td>' + escapeHtml(r.assignedTime) + '</td><td>' + escapeHtml(r.waitTime) + '</td><td><a href="#" class="card-action-link" onclick="event.preventDefault();window.Pages[\'scene-list\'].removeAssigned(\'' + r.phone + '\')">移除</a></td>';
      }
    },
    '待呼叫': { summary: '共 0 个外呼号码，正在等待呼叫队列。', actions: false, exportBtn: false, cols: ['用户号码', '号码提交时间', '已拨打次数', '等待呼叫时长', '正在排队通道'], rows: [] },
    '已呼叫': { summary: '共 ' + (window.MockCalledRows || []).length + ' 个外呼号码，已呼叫。', actions: false, exportBtn: true, cols: ['用户号码', '号码提交时间', '已拨打次数', '最终外呼结果', '外呼通道', '最终外呼时间', '通话时长', '外呼小结', '最后通话节点', '操作'], rows: window.MockCalledRows || [], renderRow: function (r) {
      return '<td>' + r.phone + '</td><td>' + r.submitTime + '</td><td>' + r.dialCount + '</td><td><span class="tag tag-green">' + r.result + '</span></td><td>' + r.channel + '</td><td>' + r.lastCallTime + '</td><td>' + r.duration + '</td><td title="' + r.summary + '" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + r.summary + '</td><td>' + r.lastNode + '</td><td><a href="#" class="card-action-link" onclick="event.preventDefault();window.Pages[\'scene-list\'].showCallRecordList(' + JSON.stringify(r).replace(/"/g, '&quot;') + ')">通话记录</a></td>';
    } },
    '已过滤': { summary: '共 0 个外呼号码，被过滤。', actions: false, exportBtn: false, cols: ['用户号码', '号码提交时间', '已拨打次数', '过滤原因', '过滤时间'], rows: [] },
    '呼叫失败': { summary: '共 ' + (window.MockFailedRows || []).length + ' 个外呼号码，呼叫失败。', actions: false, exportBtn: false, cols: ['用户号码', '号码提交时间', '失败原因'], rows: window.MockFailedRows || [], renderRow: function (r) {
      return '<td>' + r.phone + '</td><td>' + r.submitTime + '</td><td>' + r.reason + '</td>';
    } }
  };

  function renderSubContent(tabName) {
    var cfg = SubTabConfig[tabName] || SubTabConfig['已分配'];
    var colCount = cfg.cols.length;
    var actionsHtml = cfg.actions
      ? '<div class="scene-detail-actions"><button class="btn btn-default" onclick="window.Pages[\'scene-list\'].showImportModal()">手动导入</button><button class="btn btn-default">批量移除</button></div>'
      : '';
    var exportHtml = cfg.exportBtn ? '<button class="btn btn-primary" onclick="showToast(\'导出功能开发中\',\'info\')">导出</button>' : '';
    var colsHtml = cfg.cols.map(function (c) { return '<th>' + c + '</th>'; }).join('');
    var summaryText = typeof cfg.getSummary === 'function' ? cfg.getSummary() : (cfg.summary || '');
    var cfgRows = typeof cfg.getRows === 'function' ? cfg.getRows() : (cfg.rows || []);

    var bodyHtml = '';
    if (cfgRows && cfgRows.length > 0 && cfg.renderRow) {
      bodyHtml = cfgRows.map(function (r) { return '<tr>' + cfg.renderRow(r) + '</tr>'; }).join('');
    } else {
      bodyHtml = '<tr><td colspan="' + colCount + '"><div class="scene-detail-empty"><div style="font-size:32px;opacity:.3">&#128230;</div><div style="font-size:13px;color:#bbb">暂无数据</div></div></td></tr>';
    }

    return '' +
      '<div class="scene-detail-summary"><span>' + summaryText + '</span><div style="display:flex;gap:8px;align-items:center">' + actionsHtml + exportHtml + '</div></div>' +
      '<div class="scene-detail-table-wrap"><table class="scene-detail-table"><thead><tr>' + colsHtml + '</tr></thead><tbody>' + bodyHtml + '</tbody></table></div>';
  }

  function switchSubTab(el, tabName) {
    var container = document.getElementById('sceneSubContent');
    if (!container) return;
    document.querySelectorAll('.scene-detail-subtab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    container.innerHTML = renderSubContent(tabName);
  }

  function switchMainTab(el, tabName) {
    var container = document.getElementById('sceneDetailContent');
    if (!container) return;
    document.querySelectorAll('.scene-detail-tab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    container.innerHTML = renderMainTabContent(tabName);
  }

  function renderMainTabContent(tabName) {
    if (tabName === 'callList') {
      return '' +
        '<div data-anno-page="ai-tasks" data-anno-label="智能外呼任务呼叫名单" data-anno-kind="region" data-anno-fields="FLD-120,FLD-121,FLD-122">' +
        '<div class="scene-detail-subtabs">' +
          '<div class="scene-detail-subtab active" onclick="window.Pages[\'scene-list\'].switchSubTab(this,\'已分配\')">已分配</div>' +
          '<div class="scene-detail-subtab" onclick="window.Pages[\'scene-list\'].switchSubTab(this,\'待呼叫\')">待呼叫</div>' +
          '<div class="scene-detail-subtab" onclick="window.Pages[\'scene-list\'].switchSubTab(this,\'已呼叫\')">已呼叫</div>' +
          '<div class="scene-detail-subtab" onclick="window.Pages[\'scene-list\'].switchSubTab(this,\'已过滤\')">已过滤</div>' +
          '<div class="scene-detail-subtab" onclick="window.Pages[\'scene-list\'].switchSubTab(this,\'呼叫失败\')">呼叫失败</div>' +
        '</div>' +
        '<div id="sceneSubContent">' + renderSubContent('已分配') + '</div></div>';
    } else if (tabName === 'dataOverview') {
      return renderDataOverview();
    } else if (tabName === 'taskDetail') {
      return renderTaskDetail();
    }
    return '';
  }

  function showDetail(id) {
    var item = visibleTasks().find(function (d) { return d.id === id; });
    if (!item) {
      showToast('当前账号无权查看该任务，或任务已不在当前范围内', 'warning');
      return;
    }
    currentDetailItem = item;
    var s = getTaskStatusInfo(item).info;
    var pt = getPlatform(item.platform);
    var platformName = item.platform || '一知科技';
    /* 启/停按钮：中科金/大众/电声平台不显示（对齐各参考源），冰兰文案为「终止任务」 */
    var noTogglePlatforms = ['中科金智能', '大众通信', '电声'];
    var toggleBtnHtml = '';
    if (noTogglePlatforms.indexOf(platformName) === -1) {
      if (platformName === '冰兰') {
        toggleBtnHtml = '<button class="scene-toggle-btn" onclick="showToast(\'终止任务功能开发中\',\'info\')">终止任务</button>';
      } else {
        toggleBtnHtml = '<button class="scene-toggle-btn" onclick="showToast(\'启停任务功能开发中\',\'info\')">启/停任务</button>';
      }
    }

    var html = '' +
      '<div class="scene-detail-backdrop" id="sceneDetailBackdrop" onclick="window.Pages[\'scene-list\'].closeDetail(event)">' +
        '<div class="scene-detail-drawer" data-anno-page="ai-tasks" data-anno-label="智能外呼任务详情" data-anno-kind="region" data-anno-fields="FLD-017,FLD-018,FLD-019,FLD-020,FLD-021,FLD-022,FLD-023,FLD-024,FLD-025" onclick="event.stopPropagation()">' +
          '<div class="scene-detail-header">' +
            '<span class="scene-detail-close" onclick="window.Pages[\'scene-list\'].closeDetail()">&times;</span>' +
            '<span class="scene-detail-title">查看外呼</span>' +
          '</div>' +
          '<div class="scene-detail-body">' +
            '<div class="scene-detail-meta">' +
              '<div class="scene-detail-meta-row">' +
                '<div class="scene-detail-name"><label>场景名称：</label>' + escapeHtml(item.name) + '</div>' +
                '<div class="scene-detail-status"><label>状态：</label><span class="status-dot" style="background:' + s.dot + '"></span><span style="color:' + s.color + '">' + s.label + '</span>' + toggleBtnHtml + '</div>' +
              '</div>' +
              '<div class="scene-detail-tags">' +
                '<span class="scene-detail-tag" style="background:' + pt.bg + ';color:' + pt.color + ';border:1px solid ' + pt.border + '">' + platformName + '</span>' +
                '<span class="scene-detail-tag" style="background:#e6f4ff;color:#1677ff;border:1px solid #91caff">' + item.source + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="scene-detail-tabs">' +
              '<div class="scene-detail-tab active" onclick="window.Pages[\'scene-list\'].switchMainTab(this,\'dataOverview\')">数据概览</div>' +
              '<div class="scene-detail-tab" onclick="window.Pages[\'scene-list\'].switchMainTab(this,\'callList\')">呼叫名单</div>' +
              '<div class="scene-detail-tab" onclick="window.Pages[\'scene-list\'].switchMainTab(this,\'taskDetail\')">任务详情</div>' +
            '</div>' +
            '<div class="scene-detail-content" id="sceneDetailContent">' + renderMainTabContent('dataOverview') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      var backdrop = document.getElementById('sceneDetailBackdrop');
      var drawer = document.querySelector('.scene-detail-drawer');
      if (backdrop) backdrop.classList.add('open');
      if (drawer) drawer.classList.add('open');
    });
  }

  function closeDetail(e) {
    if (e && e.target !== e.currentTarget) return;
    var backdrop = document.getElementById('sceneDetailBackdrop');
    var drawer = backdrop ? backdrop.querySelector('.scene-detail-drawer') : null;
    if (!backdrop || !drawer) return;
    backdrop.classList.remove('open');
    drawer.classList.add('closing');
    setTimeout(function () {
      backdrop.remove();
      syncBodyLayerLock();
    }, 320);
  }

  /* ===== 更多操作下拉菜单 ===== */
  var activeMoreMenu = null;

  function toggleMoreMenu(e, id) {
    e.stopPropagation();
    closeMoreMenu();
    var btn = e.currentTarget;
    var rect = btn.getBoundingClientRect();
    var html = '' +
      '<div class="scene-more-menu" id="moreMenu-' + id + '" data-scene-id="' + id + '" style="position:fixed;z-index:3000;top:' + (rect.bottom + 6) + 'px;left:' + (rect.left - 90) + 'px;">' +
        '<div class="scene-more-item" onclick="window.Pages[\'scene-list\'].onMenuAction(\'删除\',' + id + ')">删除</div>' +
        '<div class="scene-more-item" onclick="window.Pages[\'scene-list\'].onMenuAction(\'暂停\',' + id + ')">暂停</div>' +
        '<div class="scene-more-item" onclick="window.Pages[\'scene-list\'].onMenuAction(\'终止\',' + id + ')">终止</div>' +
        '<div class="scene-more-item primary" onclick="window.Pages[\'scene-list\'].onMenuAction(\'启动\',' + id + ')">启动</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    activeMoreMenu = document.getElementById('moreMenu-' + id);
    requestAnimationFrame(function () {
      document.addEventListener('click', closeMoreMenu, { once: true });
    });
  }

  function closeMoreMenu() {
    if (activeMoreMenu) {
      activeMoreMenu.remove();
      activeMoreMenu = null;
    }
  }

  function onMenuAction(action, id) {
    closeMoreMenu();
    var item = visibleTasks().find(function (d) { return d.id === id; });
    if (!item) {
      showToast('当前账号无权操作该任务', 'warning');
      return;
    }
    if (item && item.platform === '大众通信') {
      showToast('大众通信任务由 SaaS 侧管理，中台仅查看', 'warning');
      return;
    }
    showToast(action + '功能开发中（场景ID: ' + id + '）', 'info');
  }

  /* ===== 手动导入弹窗 ===== */
  /* 待上传文件暂存（在用户选择文件后、点击"开始上传"前暂存） */
  var pendingUploadFile = null;

  /* 校验中国大陆手机号：1 开头，11 位数字 */
  function validatePhone(phone) {
    return /^1[3-9]\d{9}$/.test(String(phone).trim());
  }

  function parseCSVText(text) {
    var lines = String(text).split(/\r?\n/).filter(function (line) { return line.trim(); });
    if (!lines.length) return { headers: [], rows: [] };
    var headers = lines[0].split(',').map(function (h) { return h.trim().replace(/^"|"$/g, ''); });
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var cols = lines[i].split(',').map(function (c) { return c.trim().replace(/^"|"$/g, ''); });
      if (cols.length > 0 && cols[0]) rows.push(cols);
    }
    return { headers: headers, rows: rows };
  }

  function processUploadFile(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var parsed = parseCSVText(e.target.result);
      var results = { success: [], fail: [], total: parsed.rows.length };
      parsed.rows.forEach(function (cols) {
        var phone = (cols[0] || '').trim();
        if (validatePhone(phone)) {
          results.success.push(phone);
        } else {
          results.fail.push({ phone: phone, reason: phone ? '手机号格式有误' : '手机号为空' });
        }
      });
      callback(results);
    };
    reader.onerror = function () {
      showToast('文件读取失败，请重试', 'error');
    };
    reader.readAsText(file, 'UTF-8');
  }

  function applyImportResults(sceneId, results, fileName) {
    /* 存入已分配数据 */
    if (!window.MockAssignedData) window.MockAssignedData = {};
    if (!window.MockAssignedData[sceneId]) window.MockAssignedData[sceneId] = [];
    var now = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : n; };
    var timeStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    results.success.forEach(function (phone) {
      window.MockAssignedData[sceneId].push({
        phone: phone.slice(0, 3) + '****' + phone.slice(7),
        assignedTime: timeStr,
        waitTime: '排队中'
      });
    });
    /* 添加导入历史 */
    if (!window.MockImportHistory) window.MockImportHistory = [];
    var nextId = window.MockImportHistory.reduce(function (max, r) { return r.id > max ? r.id : max; }, 0) + 1;
    /* 模拟平台返回的批次号与有效号码数（OpenAPI v2：appendBatch 返回 batchId 与有效号码数） */
    var batchId = 'HP-BATCH-' + timeStr.slice(0, 10).replace(/-/g, '') + '-' + (1000 + nextId);
    results.validNumberCount = results.success.length;
    window.MockImportHistory.unshift({
      id: nextId,
      sceneId: sceneId,
      name: fileName,
      total: results.total,
      success: results.success.length,
      fail: results.fail.length,
      batchId: batchId,
      validNumberCount: results.validNumberCount,
      status: '已完成',
      time: timeStr,
      op: '超管'
    });
  }

  function showImportModal() {
    if (document.getElementById('importModalBackdrop')) return;
    pendingUploadFile = null;
    var html = '' +
      '<div class="import-modal-backdrop" id="importModalBackdrop" onclick="window.Pages[\'scene-list\'].closeImportModal(event)">' +
        '<div class="import-modal" data-anno-page="ai-tasks" data-anno-label="智能外呼名单导入" data-anno-kind="region" data-anno-fields="FLD-120,FLD-121" onclick="event.stopPropagation()">' +
          '<div class="import-modal-header"><span class="title">手动导入</span><span class="close-btn" onclick="window.Pages[\'scene-list\'].closeImportModal()">&times;</span></div>' +
          '<div class="import-modal-tabs">' +
            '<div class="import-modal-tab active" onclick="window.Pages[\'scene-list\'].switchImportTab(this,\'upload\')">上传文件</div>' +
            '<div class="import-modal-tab" onclick="window.Pages[\'scene-list\'].switchImportTab(this,\'record\')">导入记录</div>' +
          '</div>' +
          '<div class="import-modal-body" id="importModalContent">' + renderImportUploadContent() + '</div>' +
          '<div class="import-modal-footer" id="importModalFooter">' +
            '<button class="btn btn-default" onclick="window.Pages[\'scene-list\'].downloadTemplate()">下载模板</button>' +
            '<button class="btn btn-primary" id="btnStartUpload" onclick="window.Pages[\'scene-list\'].doStartUpload()">开始上传</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';
  }

  function renderImportUploadContent() {
    var isDazhong = currentDetailItem && currentDetailItem.platform === '大众通信';
    var isHoupu = currentDetailItem && currentDetailItem.platform === '厚朴';
    var maxHint = isDazhong
      ? '大众通信单次最多导入 100 条号码'
      : (isHoupu ? '单文件最多 150,000 条；单任务最多 50,000 批次；建议每批至少 200 条' : '号码数量不大于 2,000');
    return '' +
      '<div class="import-upload-area" id="importUploadZone"' +
        ' onclick="document.getElementById(\'importFileInput\').click()"' +
        ' ondragover="event.preventDefault();this.classList.add(\'dragover\')"' +
        ' ondragleave="this.classList.remove(\'dragover\')"' +
        ' ondrop="event.preventDefault();this.classList.remove(\'dragover\');window.Pages[\'scene-list\'].handleFileDrop(event)">' +
        '<input type="file" id="importFileInput" accept=".csv,.txt,.xls,.xlsx" style="display:none;" onchange="window.Pages[\'scene-list\'].handleFileSelect(this)">' +
        '<div class="upload-icon">&#128228;</div>' +
        '<div class="upload-text" id="uploadStatusText">点击或将文件拖拽到此处上传</div>' +
        '<div class="upload-hint">支持文件：csv 、 txt 、 xls 、 xlsx 文件，' + maxHint + '<br>首行须为表头，首列为号码，其余列为动态属性（厚朴批次追加）<br>您可以选择重新上传，但重新上传会覆盖原有上传的号码</div>' +
        '<div id="uploadPreview" style="display:none;margin-top:12px;padding:10px;background:#f6ffed;border:1px solid #b7eb8f;border-radius:4px;font-size:13px;color:#333;"></div>' +
      '</div>';
  }

  function renderImportRecordContent() {
    var allRecords = window.MockImportHistory || [];
    var records = currentDetailItem
      ? allRecords.filter(function (r) { return r.sceneId === currentDetailItem.id; })
      : allRecords;
    if (!records.length) {
      return '<div class="import-record-summary">暂无导入记录</div>' +
        '<div class="scene-detail-table-wrap" style="margin-top:12px;">' +
        '<table class="scene-detail-table"><thead><tr><th>文件名</th><th>导入总数</th><th>有效号码数</th><th>成功数</th><th>失败数</th><th>批次号</th><th>状态</th><th>导入时间</th><th>操作人</th><th>操作</th></tr></thead>' +
        '<tbody><tr><td colspan="10"><div style="text-align:center;padding:32px;color:#bbb;">暂无数据</div></td></tr></tbody></table></div>';
    }
    var rows = records.map(function (r) {
      return '<tr>' +
        '<td>' + escapeHtml(r.name) + '</td>' +
        '<td>' + r.total.toLocaleString() + '</td>' +
        '<td>' + (r.validNumberCount !== undefined ? r.validNumberCount.toLocaleString() : '-') + '</td>' +
        '<td>' + r.success.toLocaleString() + '</td>' +
        '<td>' + r.fail.toLocaleString() + '</td>' +
        '<td>' + escapeHtml(r.batchId || '-') + '</td>' +
        '<td><span class="tag ' + (r.status === '已完成' ? 'tag-green' : 'tag-orange') + '">' + r.status + '</span></td>' +
        '<td>' + escapeHtml(r.time) + '</td>' +
        '<td>' + escapeHtml(r.op) + '</td>' +
        '<td><a href="#" class="card-action-link" onclick="event.preventDefault();window.Pages[\'scene-list\'].exportImportResult(' + r.fail + ')">导出失败记录</a></td>' +
        '</tr>';
    }).join('');
    return '<div class="import-record-summary">共 ' + records.length + ' 条导入记录</div>' +
      '<div class="scene-detail-table-wrap" style="margin-top:12px;">' +
      '<table class="scene-detail-table"><thead><tr><th>文件名</th><th>导入总数</th><th>有效号码数</th><th>成功数</th><th>失败数</th><th>批次号</th><th>状态</th><th>导入时间</th><th>操作人</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function switchImportTab(el, tabName) {
    document.querySelectorAll('.import-modal-tab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    var content = document.getElementById('importModalContent');
    var footer = document.getElementById('importModalFooter');
    if (!content) return;
    if (tabName === 'upload') {
      content.innerHTML = renderImportUploadContent();
      if (footer) footer.style.display = '';
    } else {
      content.innerHTML = renderImportRecordContent();
      if (footer) footer.style.display = 'none';
    }
  }

  function closeImportModal(e) {
    if (e && e.target !== e.currentTarget) return;
    var backdrop = document.getElementById('importModalBackdrop');
    if (backdrop) {
      backdrop.remove();
      syncBodyLayerLock();
    }
    pendingUploadFile = null;
  }

  function handleFileSelect(input) {
    if (input.files && input.files[0]) {
      pendingUploadFile = input.files[0];
      var statusEl = document.getElementById('uploadStatusText');
      var previewEl = document.getElementById('uploadPreview');
      if (statusEl) statusEl.textContent = '已选择：' + pendingUploadFile.name;
      if (previewEl) {
        previewEl.style.display = 'block';
        previewEl.textContent = '文件「' + pendingUploadFile.name + '」已就绪，请点击"开始上传"按钮导入。';
      }
    }
  }

  function handleFileDrop(event) {
    var files = event.dataTransfer.files;
    if (files && files[0]) {
      pendingUploadFile = files[0];
      var statusEl = document.getElementById('uploadStatusText');
      var previewEl = document.getElementById('uploadPreview');
      if (statusEl) statusEl.textContent = '已选择：' + pendingUploadFile.name;
      if (previewEl) {
        previewEl.style.display = 'block';
        previewEl.textContent = '文件「' + pendingUploadFile.name + '」已就绪，请点击"开始上传"按钮导入。';
      }
    }
  }

  function doStartUpload() {
    if (!pendingUploadFile) {
      showToast('请先选择要上传的文件', 'warning');
      return;
    }
    if (!currentDetailItem) {
      showToast('未找到当前任务信息', 'error');
      return;
    }
    var sceneId = currentDetailItem.id;
    var fileName = pendingUploadFile.name;
    var btn = document.getElementById('btnStartUpload');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '导入中...';
    }
    processUploadFile(pendingUploadFile, function (results) {
      /* 大众通信批量添加号码接口单次最多 100 条 */
      var isDazhong = currentDetailItem && currentDetailItem.platform === '大众通信';
      var isHoupu = currentDetailItem && currentDetailItem.platform === '厚朴';
      if (isDazhong && results.total > 100) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '开始上传';
        }
        showToast('大众通信单次最多导入 100 条号码，当前文件包含 ' + results.total + ' 条，请拆分后重新上传', 'error');
        return;
      }
      /* 厚朴 OpenAPI v2：单文件最多 150,000 条；单任务最多 50,000 批次 */
      if (isHoupu && results.total > 150000) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '开始上传';
        }
        showToast('厚朴单文件最多导入 150,000 条号码，当前文件包含 ' + results.total + ' 条，请拆分后重新上传', 'error');
        return;
      }
      if (isHoupu) {
        var batchCount = (window.MockImportHistory || []).filter(function (r) { return r.sceneId === sceneId; }).length;
        if (batchCount >= 50000) {
          if (btn) {
            btn.disabled = false;
            btn.textContent = '开始上传';
          }
          showToast('厚朴单任务最多支持 50,000 个批次，已达上限', 'error');
          return;
        }
      }
      /* 厚朴建议每批至少 200 条，仅提示不硬拦截 */
      if (isHoupu && results.total < 200) {
        showToast('厚朴建议每批至少 200 条号码，当前批次仅 ' + results.total + ' 条，可继续导入', 'warning');
      }
      applyImportResults(sceneId, results, fileName);
      closeImportModal();
      if (isHoupu) {
        var latestRecord = window.MockImportHistory && window.MockImportHistory[0];
        showToast('导入成功：有效号码数 ' + results.validNumberCount + '，批次号 ' + (latestRecord ? latestRecord.batchId : '-'), 'success');
      } else if (results.fail.length > 0) {
        showToast('导入完成：成功 ' + results.success.length + ' 条，失败 ' + results.fail.length + ' 条', 'warning');
      } else {
        showToast('导入成功：共 ' + results.success.length + ' 条号码', 'success');
      }
      /* 刷新当前子标签内容 */
      var container = document.getElementById('sceneSubContent');
      if (container) {
        var activeSubTab = container.parentElement.querySelector('.scene-detail-subtab.active');
        var tabName = activeSubTab ? activeSubTab.textContent.trim() : '已分配';
        container.innerHTML = renderSubContent(tabName);
      }
    });
  }

  function downloadTemplate() {
    var BOM = '\uFEFF';
    var csvContent = BOM + '手机号,姓名,备注\n13800138000,张三,示例数据\n13900139000,李四,示例数据\n';
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '导入模板_' + new Date().toLocaleDateString().replace(/\//g, '-') + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('模板已下载', 'success');
  }

  function exportImportResult(failCount) {
    if (failCount === 0) {
      showToast('当前导入全部成功', 'success');
      return;
    }
    /* 模拟导入结果数据 */
    var data = [
      { result: '成功', reason: '—', phone: '15975587676', orderNo: '0001', needRescue: '是', time: '2025.10.09 12:00' },
      { result: '失败', reason: '手机号格式有误', phone: '1597558767', orderNo: '0001', needRescue: '是', time: '2025.10.09 12:00' },
      { result: '失败', reason: '手机号为空', phone: '', orderNo: '0001', needRescue: '是', time: '2025.10.09 12:00' },
      { result: '失败', reason: '必填项为空', phone: '15975587676', orderNo: '0001', needRescue: '', time: '2025.10.09 12:00' },
      { result: '失败', reason: '手机号重复', phone: '15975587676', orderNo: '0001', needRescue: '是', time: '2025.10.09 12:00' }
    ];
    var headers = ['导入结果', '失败原因', '手机号', '单号(必填)', '是否需要救援(必填)', '发生时间(必填)'];
    var rows = data.map(function (r) { return [r.result, r.reason, r.phone, r.orderNo, r.needRescue, r.time]; });
    var csvContent = [headers].concat(rows).map(function (row) {
      return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    /* 添加 BOM 以支持中文 */
    var BOM = '\uFEFF';
    var blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '导入结果_' + new Date().toLocaleDateString().replace(/\//g, '-') + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('导出成功', 'success');
  }

  /* 厚朴通话原始状态码 → 中台展示中文（785 自然人摘机/790 摘机后未识别/779 呼出限制/782 呼叫转移） */
  var HoupuRawStatusLabels = {
    785: '已接通', 790: '无人接听', 779: '呼叫受限', 782: '无法接通'
  };

  /* ===== 通话记录列表（抽屉弹窗）→ 点击详情进入二级详情 ===== */
  /* 大众通信数字状态码格式化为中文，其余平台原样返回 */
  function formatRecordStatus(r) {
    if (r.platform === '大众通信' && r.status !== undefined && r.status !== null && r.status !== '') {
      return formatDazhongCallStatus(r.status);
    }
    if (r.platform === '厚朴' && r.rawStatusCode !== undefined && r.rawStatusCode !== null && r.rawStatusCode !== '') {
      var mapped = HoupuRawStatusLabels[r.rawStatusCode];
      if (mapped !== undefined) return mapped;
      return r.rawStatusName || String(r.rawStatusCode);
    }
    return r.status || '-';
  }

  function isRecordConnected(r) {
    var text = formatRecordStatus(r);
    return text === '已接通' || text === '呼叫成功' || text === '已接听';
  }

  /* 只展示当前范围内已有的号码记录，无匹配保持空态。 */
  function getCallRecordsForPhone(phone) {
    var all = window.MockCallRecordRows || [];
    if (window.AppState && typeof window.AppState.effectiveAccess === 'function') {
      var access = window.AppState.effectiveAccess();
      if (!access.valid || (access.capabilitySet || []).indexOf('AI_OUTBOUND') === -1) return [];
      all = all.filter(function (r) { return (access.tenantIds || []).indexOf(r.tenantId) >= 0; });
    }
    if (currentDetailItem) {
      all = all.filter(function (r) {
        if (r.sceneId !== undefined && r.sceneId !== null) return String(r.sceneId) === String(currentDetailItem.id);
        return r.sceneName === currentDetailItem.name && r.platform === currentDetailItem.platform;
      });
    }
    var matched = [];
    if (phone && phone.indexOf('****') >= 0) {
      var prefix = phone.slice(0, 3);
      var suffix = phone.slice(-4);
      matched = all.filter(function (r) {
        return String(r.phone || '').slice(0, 3) === prefix && String(r.phone || '').slice(-4) === suffix;
      });
    } else if (phone) {
      matched = all.filter(function (r) { return r.phone === phone; });
    }
    return matched;
  }

  function showCallRecordList(row) {
    if (document.getElementById('callRecordListBackdrop')) return;
    var phone = (row && row.phone) || '';
    var mockRecords = getCallRecordsForPhone(phone);
    var rowsHtml = mockRecords.map(function (r, i) {
      var statusTag = isRecordConnected(r) ? 'tag-green' : 'tag-orange';
      var rowJson = JSON.stringify(r).replace(/"/g, '&quot;');
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + escapeHtml(r.phone) + '</td>' +
        '<td>' + escapeHtml(r.startTime) + '</td>' +
        '<td>' + escapeHtml(r.endTime) + '</td>' +
        '<td>' + escapeHtml(r.duration) + '</td>' +
        '<td>' + escapeHtml(r.sceneName) + '</td>' +
        '<td><span class="tag ' + statusTag + '">' + escapeHtml(formatRecordStatus(r)) + '</span></td>' +
        '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escapeHtml(r.summary || '') + '">' + escapeHtml(r.summary || '-') + '</td>' +
        '<td><a href="#" class="card-action-link" onclick="event.preventDefault();window.Pages[\'scene-list\'].closeCallRecordList();window.Pages[\'scene-list\'].showCallRecordDetail(' + rowJson + ')">详情</a></td>' +
        '</tr>';
    }).join('');

    var html = '' +
      '<div class="scene-detail-backdrop" id="callRecordListBackdrop" onclick="window.Pages[\'scene-list\'].closeCallRecordList(event)">' +
        '<div class="scene-detail-drawer" id="callRecordListDrawer" data-anno-page="ai-tasks" data-anno-label="智能外呼号码通话记录" data-anno-kind="region" data-anno-fields="FLD-122" onclick="event.stopPropagation()">' +
          '<div class="scene-detail-header">' +
            '<span class="scene-detail-title">通话记录 - ' + escapeHtml(phone) + '</span>' +
            '<button class="scene-detail-close" onclick="window.Pages[\'scene-list\'].closeCallRecordList()">&#x2715;</button>' +
          '</div>' +
          '<div class="scene-detail-body" style="display:flex;flex-direction:column;">' +
            '<div class="table-container" style="flex:1;overflow:auto;">' +
              '<table class="data-table" style="min-width:900px;">' +
                '<thead><tr><th>序号</th><th>用户号码</th><th>通话开始时间</th><th>通话结束时间</th><th>通话时长</th><th>场景名称</th><th>通话状态</th><th>外呼总结</th><th style="text-align:center;">操作</th></tr></thead>' +
                '<tbody>' + (rowsHtml || '<tr><td colspan="9" style="text-align:center;padding:36px;color:#999;">暂无通话记录</td></tr>') + '</tbody>' +
              '</table>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0 0;border-top:1px solid #f0f0f0;margin-top:16px;">' +
              '<span style="font-size:13px;color:#999;">共 ' + mockRecords.length + ' 条记录</span>' +
              '<button class="btn btn-default" onclick="window.Pages[\'scene-list\'].closeCallRecordList()" style="height:32px;padding:0 20px;">关闭</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      var backdrop = document.getElementById('callRecordListBackdrop');
      var drawer = document.getElementById('callRecordListDrawer');
      if (backdrop) backdrop.classList.add('open');
      if (drawer) drawer.classList.add('open');
    });
  }

  function closeCallRecordList(e) {
    if (e && e.target !== e.currentTarget) return;
    var backdrop = document.getElementById('callRecordListBackdrop');
    var drawer = document.getElementById('callRecordListDrawer');
    if (!backdrop && !drawer) return;
    if (backdrop) backdrop.classList.remove('open');
    if (drawer) drawer.classList.add('closing');
    setTimeout(function () {
      if (backdrop) backdrop.remove();
      syncBodyLayerLock();
    }, 320);
  }

  /* ===== 通话记录详情弹窗（外呼结果/详细信息双 Tab） ===== */
  function showCallRecordDetail(row) {
    if (document.getElementById('callRecordDetailBackdrop')) return;
    var sessionId = '会话 id：' + (row.sessionId || row.callid || 'CS' + Date.now());
    var dialogRows = [
      { role: '客服', text: '您好~' },
      { role: '客户', text: '用户无应答' },
      { role: '客服', text: '喂，尊敬的客户您好，我是东风日产厂家客服，看您之前有关注过日产的车，想问您最近还考虑买车吗？' },
      { role: '客户', text: '忙着呢，什么事啊，我知道了，你那有这打电话这个' },
      { role: '客户', text: '哦，我我你能不能联系我了，我知道了，我我现在开着车忙呢，不方便接听啊' },
      { role: '客服', text: '好的，您先忙，稍后安排4S销售顾问联系您，有需要的可以再了解下，感谢您的接听，再见！' }
    ];
    var transcriptHtml = dialogRows.map(function (d) {
      return '<div class="record-detail-talk-row">' +
        '<div class="record-detail-speaker">' + d.role + '</div>' +
        '<div class="record-detail-bubble">' + d.text + '</div>' +
        '</div>';
    }).join('');

    var infoFields = [
      ['用户号码', row.phone || '-'],
      ['号码提交时间', row.submitTime || '-'],
      ['已拨打次数', row.dialCount !== undefined ? row.dialCount : '-'],
      ['外呼通道', row.channel || row.callerNumber || '-'],
      ['最终外呼时间', row.lastCallTime || row.startTime || '-'],
      ['通话时长', row.duration || '-'],
      ['最后通话节点', row.lastNode || '-']
    ];
    if (row.platform === '厚朴') {
      infoFields.push(['任务ID', row.taskId || '-']);
      infoFields.push(['批次号', row.batchId || '-']);
      infoFields.push(['通话ID', row.callId || '-']);
      infoFields.push(['意向', row.intention || '-']);
      infoFields.push(['标签', (Array.isArray(row.tags) && row.tags.length) ? row.tags.join('、') : '-']);
      infoFields.push(['平台原始状态', row.rawStatusName ? row.rawStatusName + '（' + row.rawStatusCode + '）' : '-']);
    }
    var infoHtml = infoFields.map(function (f) {
      return '<div class="record-info-row"><span class="record-info-label">' + f[0] + ':</span><span class="record-info-value">' + escapeHtml(f[1]) + '</span></div>';
    }).join('');

    var resultText = row.result || formatRecordStatus(row);

    var html = '' +
      '<div class="record-detail-backdrop" id="callRecordDetailBackdrop" onclick="window.Pages[\'scene-list\'].closeCallRecordDetail(event)">' +
        '<div class="record-detail-modal" data-anno-page="ai-tasks" data-anno-label="智能外呼单次通话详情" data-anno-kind="region" data-anno-fields="FLD-122" onclick="event.stopPropagation()">' +
          '<div class="record-detail-header">' +
            '<button class="record-detail-close" onclick="window.Pages[\'scene-list\'].closeCallRecordDetail()">&#215;</button>' +
            '<span class="record-detail-title">' + escapeHtml(sessionId) + '</span>' +
          '</div>' +
          '<div class="record-detail-body">' +
            '<div class="record-detail-left">' +
              '<div class="record-audio-card">' +
                '<div class="record-audio-pill">' +
                  '<span class="record-audio-play">&#9654;</span>' +
                  '<span>0:00 / 0:23</span>' +
                  '<span class="record-audio-line"></span>' +
                  '<span class="record-audio-volume">&#128266;</span>' +
                  '<span class="record-audio-more">&#8942;</span>' +
                '</div>' +
                '<span class="record-audio-icon">&#127911;</span>' +
                '<span class="record-audio-icon">&#128196;</span>' +
              '</div>' +
              '<div class="record-detail-transcript">' + transcriptHtml + '</div>' +
            '</div>' +
            '<div class="record-detail-right">' +
              '<div class="record-detail-content">' +
                '<div class="record-detail-right-tabs">' +
                  '<div class="record-tab active" onclick="window.Pages[\'scene-list\'].switchCallRecordTab(this,\'outbound\')">外呼结果</div>' +
                  '<div class="record-tab" onclick="window.Pages[\'scene-list\'].switchCallRecordTab(this,\'info\')">详细信息</div>' +
                '</div>' +
                '<div class="record-detail-tab-content" id="callRecordTabContent">' +
                  '<div class="record-detail-fields">' +
                    '<div class="record-detail-section-title">外呼小结</div>' +
                    '<div class="record-detail-summary" style="margin-bottom:16px;">' + escapeHtml(row.summary || '-') + '</div>' +
                    '<div><span class="record-info-label">最终外呼结果：</span><span class="record-info-value">' + escapeHtml(resultText) + '</span></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);

    /* 存储行数据和信息面板供 tab 切换使用 */
    var backdrop = document.getElementById('callRecordDetailBackdrop');
    if (backdrop) {
      backdrop._rowData = row;
      backdrop._resultText = resultText;
      backdrop._callInfoHtml = '<div class="record-info-list">' + infoHtml + '</div>';
    }

    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      var backdrop = document.getElementById('callRecordDetailBackdrop');
      var drawer = backdrop ? backdrop.querySelector('.record-detail-modal') : null;
      if (backdrop) backdrop.classList.add('open');
      if (drawer) drawer.classList.add('open');
    });
  }

  function closeCallRecordDetail(e) {
    if (e && e.target !== e.currentTarget) return;
    var backdrop = document.getElementById('callRecordDetailBackdrop');
    var drawer = backdrop ? backdrop.querySelector('.record-detail-modal') : null;
    if (!backdrop) return;
    backdrop.classList.remove('open');
    if (drawer) drawer.classList.add('closing');
    setTimeout(function () {
      if (backdrop) backdrop.remove();
      syncBodyLayerLock();
    }, 260);
  }

  function switchCallRecordTab(el, tab) {
    var parent = el.closest('.record-detail-content');
    parent.querySelectorAll('.record-tab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    var content = parent.querySelector('#callRecordTabContent');
    if (!content) return;
    var backdrop = document.getElementById('callRecordDetailBackdrop');
    if (tab === 'outbound') {
      var rowData = backdrop ? backdrop._rowData : null;
      var resultText = (backdrop && backdrop._resultText) ? backdrop._resultText : '-';
      content.innerHTML = '' +
        '<div class="record-detail-fields">' +
          '<div class="record-detail-section-title">外呼小结</div>' +
          '<div class="record-detail-summary" style="margin-bottom:16px;">' + escapeHtml(rowData ? rowData.summary : '-') + '</div>' +
          '<div><span class="record-info-label">最终外呼结果：</span><span class="record-info-value">' + escapeHtml(resultText) + '</span></div>' +
        '</div>';
    } else {
      var infoHtml = (backdrop && backdrop._callInfoHtml) ? backdrop._callInfoHtml : '';
      content.innerHTML = infoHtml;
    }
  }

  function init() {}

  window.Pages = window.Pages || {};
  window.Pages['scene-list'] = {
    render: render,
    init: init,
    doQuery: doQuery,
    resetQuery: resetQuery,
    showDetail: showDetail,
    closeDetail: closeDetail,
    switchMainTab: switchMainTab,
    switchSubTab: switchSubTab,
    removeAssigned: removeAssigned,
    toggleMoreMenu: toggleMoreMenu,
    onMenuAction: onMenuAction,
    showImportModal: showImportModal,
    switchImportTab: switchImportTab,
    closeImportModal: closeImportModal,
    handleFileSelect: handleFileSelect,
    handleFileDrop: handleFileDrop,
    doStartUpload: doStartUpload,
    downloadTemplate: downloadTemplate,
    exportImportResult: exportImportResult,
    showCallRecordList: showCallRecordList,
    closeCallRecordList: closeCallRecordList,
    showCallRecordDetail: showCallRecordDetail,
    closeCallRecordDetail: closeCallRecordDetail,
    switchCallRecordTab: switchCallRecordTab,
    toggleFocus: toggleFocus,
    showIntentConfig: showIntentConfig,
    closeIntentConfig: closeIntentConfig,
    saveIntentConfig: saveIntentConfig,
    toggleIntentDropdown: toggleIntentDropdown,
    toggleIntentOption: toggleIntentOption
  };
  window.AICompatibilityRuntime = {
    allTasks: function () { return (window.MockSceneList || []).slice(); },
    visibleTasks: visibleTasks,
    statusInfo: getTaskStatusInfo
  };
})();
