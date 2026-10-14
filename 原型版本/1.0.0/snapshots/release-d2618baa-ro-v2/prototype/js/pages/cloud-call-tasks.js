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
  function sorted(rows,fallback) { return ui.sortByUpdated?.(rows,fallback)||rows; }

  function scoped(rows) { return AppState.scoped(rows || []); }
  function tenantName(id) { return (CloudCallRuntime.tenant(id) || {}).name || '—'; }
  function progress(row) { return row.total ? Math.round(Number(row.completed || 0) / Number(row.total) * 100) : 0; }
  function routeKey(type) { return type === '预外呼' ? 'predictive-tasks' : 'ivr-tasks'; }
  function filterKey(type) { return type === '预外呼' ? 'predictive' : 'ivr'; }

  function renderManual() { return ManualSkillAccess.render(); }

  function taskRows(type) {
    CloudTaskWorkspace.syncAssignedCustomers();
    var state = filters[filterKey(type)];
    var source = [].concat(CloudTaskWorkspace.listDraftTasks(type), scoped(type === '预外呼' ? CloudCallData.predictiveTasks : CloudCallData.ivrTasks));
    return sorted(source.filter(function (row) {
      var keywordMatch = !state.keyword || String(row.name || '').toLowerCase().indexOf(state.keyword.toLowerCase()) >= 0;
      var statusMatch = !state.status || row.status === state.status;
      return keywordMatch && statusMatch;
    }));
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
      ? '暂停后可继续同一任务；确认结束后不再发起新呼叫或重呼，也不能重新开启。已经发起的通话正常进行。'
      : '按已选择的语音流程执行，查看通话记录了解每次呼叫的结果。';
    var scenarioType = isPredictive ? 'PREDICTIVE' : 'IVR_OUTBOUND';
    var runningTask = rows.find(function (row) { return !row.isWizardDraft && ['执行中', '已暂停', '异常'].includes(row.status); }) || rows.find(function (row) { return !row.isWizardDraft; });
    var journeyActions = {
      prepare: "ScenarioReadiness.open('" + scenarioType + "')",
      records: "RouteRuntime.openSecondary('cloud-call-records',{type:'" + type + "'})"
    };
    if (runningTask) journeyActions.monitor = "CloudTaskWorkspace.openTask('" + runningTask.taskId + "')";
    return '<section class="platform-page cloud-task-page">' +
      ui.pageHeader(isPredictive ? '预外呼任务' : '自动外呼任务', isPredictive ? '批量呼叫客户，接通后再分配空闲坐席。' : '按照已配置的语音流程批量完成自动通知或按键交互。') +
      ui.journey({ current: 'create', context: (isPredictive?'预外呼':'自动外呼') + ' · 任务列表', branch: '任务型场景', actions: journeyActions }) +
      '<div class="filter-panel"><label class="field"><span>任务名称</span><input id="cloudTaskKeyword" value="' + esc(state.keyword) + '" placeholder="请输入任务名称"></label><label class="field"><span>任务状态</span><select id="cloudTaskStatus"><option value="">全部</option>' +
      ['草稿', '待分配客户', '待启动', '执行中', '已暂停', '已完成', '已终止', '异常'].map(function (status) { return '<option' + (state.status === status ? ' selected' : '') + '>' + status + '</option>'; }).join('') +
      '</select></label><div class="filter-actions"><button class="btn" onclick="window.Pages[\'cloud-call-tasks\'].resetFilters(\'' + type + '\')">重置</button><button class="btn btn-primary" onclick="window.Pages[\'cloud-call-tasks\'].query(\'' + type + '\')">查询</button></div></div>' +
      '<div class="cloud-task-list-shell">' + ui.toolbar('<button class="btn btn-primary" onclick="window.Pages[\'cloud-call-tasks\'].openCreate(\'' + type + '\')">+ 新建任务</button>'+'<button class="btn" onclick="window.Pages[\'cloud-call-tasks\'].exportTasks(\'' + type + '\')">导出</button>', '<span>' + ui.help(helpText, '任务说明') + '</span>') +
      ui.table([
        { key: 'orderNo', label: '序号', width: '64px' },
        { key: 'name', label: '任务名称', render: function (value, row) { return '<button class="table-link" onclick="window.Pages[\'cloud-call-tasks\'].openTask(\'' + esc(row.taskId) + '\')"><strong>' + esc(value) + '</strong><small>' + esc(tenantName(row.tenantId)) + ' · ' + esc(row.scheduleAt || '尚未设置执行时间') + '</small></button>'; } },
        { key: 'status', label: '状态', render: function (value, row) { return row.alictiTaskControlPending ? ui.status('待确认') + '<small>状态待核对 · 最后已知 ' + esc(value) + '</small>' : ui.status(value); } },
        { key: 'total', label: '名单条数' },
        { key: 'completed', label: '已完成' },
        { key: 'connected', label: '已接通' },
        { key: 'taskId', label: '完成进度', render: function (value, row) { return '<div class="progress-cell"><span><i style="width:' + progress(row) + '%"></i></span><small>' + progress(row) + '%</small></div>'; } },
        { key: 'owner', label: '负责人' },
        { key: 'taskId', label: '操作', className: 'action-column', render: function (value, row) { return '<div class="table-actions"><button onclick="window.Pages[\'cloud-call-tasks\'].openTask(\'' + esc(value) + '\')">' + (row.isWizardDraft ? '继续创建' : '查看与管理') + '</button>' + (!row.isWizardDraft&&CloudTaskWorkspace.canEditTask(row)?'<button onclick="CloudTaskWorkspace.editTask(\''+esc(value)+'\')">编辑</button>':'') + (CustomerTasks.canImportToTask(row) ? '<button onclick="CustomerTasks.importDialog(\'' + esc(value) + '\')">导入客户</button>' : '') + (!row.isWizardDraft&&isPredictive ? window.RepeatPredictive?.listTaskAction(row)||'' : '') + (row.isWizardDraft ? '<button onclick="CloudTaskWorkspace.deleteTask(\''+esc(value)+'\')">删除</button>' : '') + '</div>'; } }
      ], pageRows, { emptyText: '未找到符合条件的任务', emptyDetail: '可重置筛选或新建任务。', footer: ui.pagination(rows.length, state.page, pageSize, "window.Pages['cloud-call-tasks'].setPage.bind(null,'" + type + "')") }) +
      '</div></section>';
  }

  function renderInbound() {
    var calls = sorted(scoped(CloudCallData.calls.filter(function (item) { return item.callType === '呼入'; })),function(item){var data=window.CloudCallRecords?.display(item);return data?[data.endAt,data.startAt]:[item.endedAt,item.ringingAt,item.recordedAt];});
    var canView=window.AliCtiInbound?.allowed(),canManage=window.AliCtiInbound?.allowed(true);
    var listed=canView?AliCtiInbound.list():{ok:true,rows:[]};
    var resources=canView?AliCtiInbound.resources():{};
    var routes=sorted(listed.rows||[]);
    var rulePage=window.Pages['inbound-routing'];
    var connected = calls.filter(function (item) { return item.result === '接通'; }).length;
    return '<section class="platform-page inbound-service-page">' +
      ui.pageHeader('呼入服务', '配置客户来电的接听去向，并查看接听记录。', '<button class="btn" onclick="RouteRuntime.openSecondary(\'cloud-call-records\',{type:\'呼入\'})">查看呼入记录</button>'+(canView?'<button class="btn" onclick="window.Pages[\'inbound-routing\'].openList()">管理呼入规则</button>':'')+(canManage?'<button class="btn btn-primary" onclick="window.Pages[\'inbound-routing\'].openRoute()">新建呼入规则</button>':'')) +
      '<div class="inbound-purpose"><strong>客户来电</strong><i>→</i><span>按优先级和条件匹配规则</span><i>→</i><span>进入语音导航、指定电话或分机</span></div>' +
      '<div class="kpi-grid">' + ui.kpi('呼入记录', calls.length, '当前租户') + ui.kpi('人工接通', connected, (calls.length ? Math.round(connected / calls.length * 100) : 0) + '% 接通率') + ui.kpi('平均排队', averageQueue(calls), '有完整排队时间的来电') + ui.kpi('排队超时', calls.filter(function (item) { return item.result === '排队超时'; }).length, '已播放超时提示') + '</div>' +
      '<div class="content-grid">'+(canView?'<article class="panel-card span-4"><div class="panel-header"><div><h2>呼入规则</h2><p>按已配置条件和优先级执行</p></div><button class="btn-link" onclick="window.Pages[\'inbound-routing\'].openList()">查看全部</button></div><div class="panel-body simple-list">'+
      (!listed.ok?ui.alert('warning','暂未取得规则',esc(listed.message)):routes.map(function (route) { return '<div class="inbound-rule-summary"><button class="table-link" onclick="window.Pages[\'inbound-routing\'].openRoute('+esc(JSON.stringify(route.id))+','+esc(JSON.stringify(AliCtiInbound.context()))+',true)"><strong>'+esc(route.name||'未命名呼入规则')+'</strong></button><small>优先级 '+esc(route.priority)+' · '+esc(rulePage.targetLabel(route,resources))+'</small>'+ui.status(route.pending?'待核对':Number(route.active)===1?'已启用':'已停用')+'</div>'; }).join('')||ui.empty('暂无呼入规则，可点击上方新建'))+
      '</div></article>':'')+'<article class="panel-card '+(canView?'span-8':'span-12')+'"><div class="panel-header"><div><h2>近期呼入</h2><p>查看客户等待、接通和处理结果</p></div><button class="btn-link" onclick="OperationsMonitor.open(\'inbound\')">接听工作台</button></div><div class="panel-body no-padding">' +
      ui.table([
        { key: 'caller', label: '客户号码' },
        { key: 'agentName', label: '接听坐席', render: function (value) { return esc(value || '未接通'); } },
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
  function csvCell(value) {
    var text = String(value == null ? '' : value);
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function exportTasks(type) {
    if (type !== '预外呼' && type !== 'IVR 外呼') return;
    var rows = taskRows(type);
    if (!rows.length) return showToast('当前没有可导出的任务', 'warning');
    var headers = ['任务名称', '类型', '状态', '名单条数', '已完成', '已接通', '负责人', '更新时间'];
    var lines = rows.map(function (row) {
      var updated = ui.updatedTimestamp?.(row);
      return [row.name, type === '预外呼' ? '预外呼' : '自动外呼', row.status, row.total ?? 0, row.completed ?? 0, row.connected ?? 0, row.owner || '', updated == null ? '' : new Date(updated).toLocaleString('sv-SE')].map(csvCell).join(',');
    });
    var csv = '\uFEFF' + [headers.map(csvCell).join(',')].concat(lines).join('\r\n');
    var url, link;
    try {
      url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      link = document.createElement('a');
      link.href = url;
      link.download = (type === '预外呼' ? '预外呼任务' : '自动外呼任务') + '_' + new Date().toLocaleDateString('sv-SE') + '.csv';
      document.body.appendChild(link);
      link.click();
      showToast('已导出当前筛选的全部任务', 'success');
    } catch (_) {
      showToast('导出失败，请重新尝试', 'error');
    } finally {
      link?.remove();
      if (url) setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
  }


  function averageQueue(calls){const durations=calls.map(c=>{const start=Date.parse(c.queueAt),end=Date.parse(c.answeredAt);return Number.isFinite(start)&&Number.isFinite(end)&&end>=start?(end-start)/1000:null;}).filter(x=>x!==null);return durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length)+' 秒':'—';}
  function init(){if(!AppState.canMenu('settings.plans'))document.querySelectorAll('.manual-outbound-page button').forEach(b=>{if(['人工外呼设置','修改设置'].includes(b.textContent.trim()))b.remove();});}
  window.Pages = window.Pages || {};
  window.Pages['cloud-call-tasks'] = {
    captureNavigationState(){return {view,filters:structuredClone(filters)};},
    restoreNavigationState(state){if(state){view=state.view;filters=state.filters;}},
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
