/** 云呼叫业务域：人工外呼、预外呼、IVR 外呼和呼入服务。 */
(function () {
  'use strict';

  var ui = PlatformUI;
  var esc = ui.escape;
  var view = 'manual';
  var filters = {
    predictive: { keyword: '', status: '', page: 1 },
    ivr: { keyword: '', status: '', page: 1 }
  };
  var pageSize = 10;

  function scoped(rows) { return AppState.scoped(rows || []); }
  function tenantName(id) { return (CloudCallRuntime.tenant(id) || {}).name || '—'; }
  function planName(id) { return (CloudCallData.callPlans.find(function (item) { return item.callPlanId === id; }) || CloudCallData.tasks.find(t=>t.planId===id)?.executionConfig || {}).name || '历史配置'; }
  function progress(row) { return row.total ? Math.round(Number(row.completed || 0) / Number(row.total) * 100) : 0; }
  function routeKey(type) { return type === '预外呼' ? 'predictive-tasks' : 'ivr-tasks'; }
  function filterKey(type) { return type === '预外呼' ? 'predictive' : 'ivr'; }

  function renderManual() { return ManualSkillAccess.render(); }

  function taskRows(type) {
    CloudTaskWorkspace.syncAssignedCustomers();
    var state = filters[filterKey(type)];
    var source = [].concat(CloudTaskWorkspace.listDraftTasks(type), scoped(type === '预外呼' ? CloudCallData.predictiveTasks : CloudCallData.ivrTasks));
    return source.filter(function (row) {
      var keywordMatch = !state.keyword || String(row.name || '').toLowerCase().indexOf(state.keyword.toLowerCase()) >= 0;
      var statusMatch = !state.status || row.status === state.status;
      return keywordMatch && statusMatch;
    });
  }

  function taskPage(type) {
    var isPredictive = type === '预外呼';
    var state = filters[filterKey(type)];
    var rows = taskRows(type);
    var pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    if (state.page > pageCount) state.page = pageCount;
    var pageRows = rows.slice((state.page - 1) * pageSize, state.page * pageSize).map(function (row, index) {
      return Object.assign({ orderNo: (state.page - 1) * pageSize + index + 1 }, row);
    });
    var helpText = isPredictive
      ? '暂停或终止会立即停止发起新的呼叫；已经进入拨号、振铃、排队或通话的记录继续按实际结果更新。'
      : '纯 IVR 通话不提供录音，使用流程版本、播放素材、按键轨迹和最终结果进行核对。';
    var scenarioType = isPredictive ? 'PREDICTIVE' : 'IVR_OUTBOUND';
    var runningTask = rows.find(function (row) { return !row.isWizardDraft && ['执行中', '已暂停', '异常'].includes(row.status); }) || rows.find(function (row) { return !row.isWizardDraft; });
    var journeyActions = {
      prepare: "ScenarioReadiness.open('" + scenarioType + "')",
      records: "navigateTo('cloud-call-records',{type:'" + type + "'})"
    };
    if (runningTask) journeyActions.monitor = "CloudTaskWorkspace.openTask('" + runningTask.taskId + "')";
    return '<section class="platform-page cloud-task-page" data-anno-page="' + routeKey(type) + '">' +
      ui.pageHeader(isPredictive ? '预外呼任务' : 'IVR 外呼任务', isPredictive ? '批量呼叫客户，接通后再分配空闲坐席。' : '按照已配置的语音流程批量完成自动通知或按键交互。') +
      ui.journey({ current: 'create', context: type + ' · 任务列表', branch: '任务型场景', actions: journeyActions }) +
      '<div class="filter-panel"><label class="field"><span>任务名称</span><input id="cloudTaskKeyword" value="' + esc(state.keyword) + '" placeholder="请输入任务名称"></label><label class="field"><span>任务状态</span><select id="cloudTaskStatus"><option value="">全部</option>' +
      ['草稿', '待分配客户', '待启动', '执行中', '已暂停', '已完成', '已终止', '异常'].map(function (status) { return '<option' + (state.status === status ? ' selected' : '') + '>' + status + '</option>'; }).join('') +
      '</select></label><div class="filter-actions"><button class="btn" onclick="window.Pages[\'cloud-call-tasks\'].resetFilters(\'' + type + '\')">重置</button><button class="btn btn-primary" onclick="window.Pages[\'cloud-call-tasks\'].query(\'' + type + '\')">查询</button></div></div>' +
      '<div class="cloud-task-list-shell">' + ui.toolbar('<button class="btn btn-primary" onclick="window.Pages[\'cloud-call-tasks\'].openCreate(\'' + type + '\')">+ 新建任务</button><button class="btn" onclick="window.Pages[\'cloud-call-tasks\'].exportTasks()">导出</button>', '<span>' + ui.help(helpText, '任务说明') + '</span>') +
      ui.table([
        { key: 'orderNo', label: '序号', width: '64px' },
        { key: 'name', label: '任务名称', render: function (value, row) { return '<button class="table-link" onclick="window.Pages[\'cloud-call-tasks\'].openTask(\'' + esc(row.taskId) + '\')"><strong>' + esc(value) + '</strong><small>' + esc(tenantName(row.tenantId)) + ' · ' + esc(row.scheduleAt || '尚未设置执行时间') + '</small></button>'; } },
        { key: 'status', label: '状态', render: function (value) { return ui.status(value); } },
        { key: 'total', label: '客户数' },
        { key: 'completed', label: '已完成' },
        { key: 'connected', label: '已接通' },
        { key: 'taskId', label: '完成进度', render: function (value, row) { return '<div class="progress-cell"><span><i style="width:' + progress(row) + '%"></i></span><small>' + progress(row) + '%</small></div>'; } },
        { key: 'planId', label: '执行配置', render: function (value, row) { return '<div class="table-main">' + esc(planName(value)) + '</div><div class="table-sub">' + esc(row.planVersion || '待生成版本') + '</div>'; } },
        { key: 'hasNextAttempt', label: '后续重呼', render: function (value,row) { return !['已终止','已完成','已删除'].includes(row.status)&&value ? '<span class="mini-tag">有下一次</span>' : '无'; } },
        { key: 'owner', label: '负责人' },
        { key: 'taskId', label: '操作', className: 'action-column', render: function (value, row) { return '<div class="table-actions"><button onclick="window.Pages[\'cloud-call-tasks\'].openTask(\'' + esc(value) + '\')">' + (row.isWizardDraft ? '继续创建' : '查看与管理') + '</button>' + (row.isWizardDraft ? '<button onclick="CloudTaskWorkspace.deleteTask(\''+esc(value)+'\')">删除</button>' : '') + '</div>'; } }
      ], pageRows, { emptyText: '未找到符合条件的任务', emptyDetail: '可重置筛选或新建任务。', footer: ui.pagination(rows.length, state.page, pageSize, "window.Pages['cloud-call-tasks'].setPage.bind(null,'" + type + "')") }) +
      '</div></section>';
  }

  function renderInbound() {
    var calls = scoped(CloudCallData.calls.filter(function (item) { return item.callType === '呼入'; }));
    var routes = CloudCallData.inboundRoutes.filter(function (item) { return item.instanceId === AppState.get().instanceId && (AppState.isSuper()||item.defaultTenantId===AppState.get().tenantId||item.branches.some(b=>b.tenantId===AppState.get().tenantId)); });
    var connected = calls.filter(function (item) { return item.result === '接通'; }).length;
    return '<section class="platform-page inbound-service-page">' +
      ui.pageHeader('呼入服务', '为客户提供 IVR 导航和人工接听服务。', '<button class="btn" onclick="OperationsMonitor.open(\'inbound\')">查看工作台</button><button class="btn" onclick="navigateTo(\'inbound-routes\')">管理呼入规则</button><button class="btn btn-primary" onclick="navigateTo(\'cloud-call-records\',{type:\'呼入\'})">查看呼入记录</button>') +
      ui.journey({ current: 'records', context: '呼入服务 · 客户来电触发', branch: '无需中台任务', actions: { prepare: "ScenarioReadiness.open('INBOUND')", results: "navigateTo('cloud-callbacks',{type:'呼入'})" }, skipped: ['create', 'monitor'], notes: { create: '无需创建任务', monitor: 'IVR 导航与人工接听' } }) +
      '<div class="kpi-grid">' + ui.kpi('呼入记录', calls.length, '当前租户') + ui.kpi('人工接通', connected, (calls.length ? Math.round(connected / calls.length * 100) : 0) + '% 接通率') + ui.kpi('平均排队', averageQueue(calls), '有完整排队时间的来电') + ui.kpi('排队超时', calls.filter(function (item) { return item.result === '排队超时'; }).length, '已播放超时提示') + '</div>' +
      '<div class="content-grid"><article class="panel-card span-5"><div class="panel-header"><div><h2>当前呼入规则</h2><p>来电按号码与按键进入对应服务团队</p></div><button class="btn-link" onclick="navigateTo(\'inbound-routes\')">管理</button></div><div class="panel-body simple-list">' +
      routes.map(function (route) { return '<div><strong>' + esc((CloudCallData.phoneNumbers.find(function (item) { return item.numberId === route.numberId; }) || {}).number || '共享服务号码') + '</strong><small>' + route.branches.length + ' 个导航分支 · ' + esc(tenantName(route.defaultTenantId)) + '</small>' + ui.status(route.status) + '</div>'; }).join('') +
      '</div></article><article class="panel-card span-7"><div class="panel-header"><div><h2>近期呼入</h2><p>查看客户等待、接通和处理结果</p></div></div><div class="panel-body no-padding">' +
      ui.table([
        { key: 'caller', label: '客户号码' },
        { key: 'agentName', label: '接听坐席', render: function (value) { return esc(value || '未接通'); } },
        { key: 'queueAt', label: '进入队列' },
        { key: 'answeredAt', label: '接通时间' },
        { key: 'durationSeconds', label: '通话时长', render: function (value) { return Math.floor(Number(value || 0) / 60) + '分' + Number(value || 0) % 60 + '秒'; } },
        { key: 'result', label: '结果', render: function (value) { return ui.status(value); } },
        { key: 'callId', label: '操作', className: 'action-column', render: function (value) { return '<div class="table-actions"><button onclick="window.Pages[\'cloud-call-records\'].openCall(\'' + esc(value) + '\')">查看</button></div>'; } }
      ], calls, { emptyText: '暂无呼入记录' }) +
      '</div></article></div></section>';
  }

  function render(options) {
    view = options && options.view || view;
    if (view === 'manual') return renderManual();
    if (view === 'predictive') return taskPage('预外呼');
    if (view === 'ivr') return taskPage('IVR 外呼');
    return renderInbound();
  }

  function query(type) {
    var state = filters[filterKey(type)];
    state.keyword = ((document.getElementById('cloudTaskKeyword') || {}).value || '').trim();
    state.status = (document.getElementById('cloudTaskStatus') || {}).value || '';
    state.page = 1;
    navigateTo(routeKey(type));
  }

  function resetFilters(type) {
    filters[filterKey(type)] = { keyword: '', status: '', page: 1 };
    navigateTo(routeKey(type));
  }

  function setPage(type, page) {
    filters[filterKey(type)].page = Math.max(1, Number(page) || 1);
    navigateTo(routeKey(type));
  }

  function openCreate(type) { return CloudTaskWorkspace.start(type); }
  function openTask(id) { return CloudTaskWorkspace.openTask(id); }
  function saveTask() { showToast('请在新建任务流程中完成保存', 'info'); }
  function control(id, action) { return CloudTaskWorkspace.controlTask(id, action === 'abort' ? 'terminate' : action); }
  function exportTasks() { showToast('任务列表已按当前筛选条件导出', 'success'); }


  function averageQueue(calls){const durations=calls.map(c=>{const start=Date.parse(c.queueAt),end=Date.parse(c.answeredAt);return Number.isFinite(start)&&Number.isFinite(end)&&end>=start?(end-start)/1000:null;}).filter(x=>x!==null);return durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length)+' 秒':'—';}
  function init(){if(!AppState.canMenu('settings.plans'))document.querySelectorAll('.manual-outbound-page button').forEach(b=>{if(['人工外呼设置','修改设置'].includes(b.textContent.trim()))b.remove();});if(!window.RouteRuntime?.canRoute('inbound-routes'))document.querySelectorAll('.inbound-service-page button').forEach(b=>{if(['管理呼入规则','管理'].includes(b.textContent.trim()))b.remove();});}
  window.Pages = window.Pages || {};
  window.Pages['cloud-call-tasks'] = {
    render: render,
    init: init,
    query: query,
    resetFilters: resetFilters,
    setPage: setPage,
    openCreate: openCreate,
    openTask: openTask,
    saveTask: saveTask,
    control: control,
    exportTasks: exportTasks
  };
})();
