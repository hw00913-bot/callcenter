/** 工作台只呈现当前角色的重点操作与当前范围内的实际事项。 */
(function () {
  'use strict';
  const ui = PlatformUI;
  const esc = ui.escape;
  const js = value => JSON.stringify(String(value));
  const routeAction = route => 'navigateTo(' + js(route) + ')';
  const canRoute = route => !!window.RouteRuntime?.canRoute(route);
  const role = () => AppState.effectiveAccess().roleCode;
  const cloud = () => AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER';
  const activeStates = ['异常', '资源不足暂停', '已暂停', '草稿', '待启动', '执行中'];
  const unfinished = row => !['已处理', '已关闭'].includes(row.status);
  const tenantName = id => CloudCallData.tenants.find(t => t.tenantId === id)?.name || '';

  function button(item) {
    const action = item.action || routeAction(item.route);
    return '<button type="button" class="focus-action" onclick="' + esc(action) + '">' +
      '<strong>' + esc(item.title) + '</strong><span>' + esc(item.detail) + '</span><em>进入 →</em></button>';
  }

  function workItems(items) {
    if (!items.length) return '<div class="focus-empty" role="status"><span>✓</span>暂无需要处理的事项</div>';
    return '<ul class="focus-todos">' + items.slice(0, 5).map(item =>
      '<li><div><strong>' + esc(item.title) + '</strong>' +
      (item.detail ? '<p>' + esc(item.detail) + '</p>' : '') + '</div>' +
      '<div class="focus-todo-action">' + ui.status(item.status) +
      '<button type="button" class="btn btn-default" onclick="' + esc(item.action) + '">' + esc(item.label || '查看') + '</button></div></li>'
    ).join('') + '</ul>';
  }

  function overview(title, actions, items, options = {}) {
    const visible = actions.filter(item => canRoute(item.route));
    const extras = options.usage ? '<button class="btn-link" type="button" onclick="Pages.home.showUsage()">套餐与用量</button>' : '';
    const more = items.length > 5 ? '<div class="focus-more">' + (options.more || []).filter(item => canRoute(item.route)).map(item =>
      '<button type="button" class="btn-link" onclick="' + esc(routeAction(item.route)) + '">' + esc(item.title) + '</button>'
    ).join('') + '</div>' : '';
    return '<section class="platform-page home-page home-focus">' + ui.pageHeader(title, '') + (options.summary || '') +
      '<section class="panel-card focus-main"><div class="panel-header"><h2>重点工作</h2>' + extras + '</div>' +
      '<div class="focus-actions" style="--focus-columns:' + Math.max(1, visible.length) + '">' + visible.map(button).join('') + '</div></section>' +
      '<section class="panel-card focus-pending"><div class="panel-header"><h2>' + (options.tasks ? '待处理与进行中' : '待处理') +
      '</h2>' + (items.length ? '<span class="focus-count">' + items.length + ' 项</span>' : '') + '</div>' +
      workItems(items) + more + '</section></section>';
  }

  function exceptionItems() {
    const responsible = role() === 'SUPER_ADMIN' ? '超级管理员' : '租户管理员';
    return AppState.scoped(CloudCallData.exceptions).filter(row => BusinessIssues.pending(row) && row.responsibleRole === responsible)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .map(row => ({
        title: row.type === '技能同步' ? '服务技能同步未完成' : row.title,
        detail: (AppState.isSuper() ? tenantName(row.tenantId) + ' · ' : '') + (row.impact || row.source || ''),
        status: row.status, label: '处理',
        action: 'Pages.home.openItem("exception",' + js(row.exceptionId) + ')'
      }));
  }

  function cloudTasks() {
    return AppState.scoped(CloudCallData.tasks)
      .filter(row => ['预外呼', 'IVR 外呼'].includes(row.callType) && activeStates.includes(row.status))
      .sort((a, b) => activeStates.indexOf(a.status) - activeStates.indexOf(b.status));
  }

  function monitorItems(){return cloudTasks().filter(t=>['执行中','已暂停','异常'].includes(t.status)).map(t=>({title:t.name,detail:t.callType+' · 已完成 '+(t.completed||0)+' / '+(t.total||0),status:t.status,label:'运行监控',action:'CloudTaskWorkspace.openTask('+js(t.taskId)+',"overview")'}));}
  function cloudDashboard() {
    if (role() === 'SUPER_ADMIN') return RoleFocus.home();
    if (role() === 'ADMIN') {
      const items = exceptionItems();
      // 只补充实际异常场景；未启用的业务不生成开通待办，也不重复罗列配置清单。
      if (!items.length) ScenarioReadiness.list(AppState.get().tenantId)
        .filter(item => item.status === 'ABNORMAL').forEach(item => items.push({
          title: item.label + '暂不可用', detail: '查看影响并处理配置异常', status: '异常', label: '查看原因',
          action: 'Pages.home.openItem("scenario",' + js(item.type) + ')'
        }));
      return overview('任务与人员工作台', [
        { title: '导入与分配', detail: '导入客户、分配外呼方式与跟进人', route: 'customer-tasks' },
        { title: '坐席负荷', detail: '查看忙闲并调整人员分工', route: 'operations-monitor', action: "OperationsMonitor.open('manual')" },
        { title: '运行监控', detail: '查看任务进度、异常并进行调度', route: 'operations-monitor' },
        { title: '业务报表', detail: '查看本租户业务效果', route: 'cloud-overview-report' }
      ], [...items, ...monitorItems()], {tasks:true,summary:RoleFocus.load()});
    }
    const assigned = window.CustomerTasks?.mine() || [];
    return '<section class="panel-card focus-main"><div class="panel-header"><h2>我的客户工作</h2></div><div class="focus-actions" style="--focus-columns:2">' +
      button({ title: '待联系客户 · ' + assigned.length, detail: '选择分配给我的客户，开始人工外呼', route: 'manual-outbound' }) +
      button({ title: '客户档案', detail: '按手机号查看客户及历次联系记录', route: 'customer-directory' }) + '</div></section>' + RoleFocus.home();
  }

  function aiTasks() {
    const ids = AppState.effectiveAccess().tenantIds;
    return (window.MockSceneList || []).filter(item => ids.includes(item.tenantId));
  }

  function aiDashboard() {
    const actions = role() === 'SUPER_ADMIN' ? [
      { title: '租户与授权', detail: '维护租户和智能外呼用量', route: 'tenants' },
      { title: '通道管理', detail: '维护第三方外呼通道', route: 'ai-channels' },
      { title: '业务场景', detail: '维护场景与机器人关系', route: 'ai-scenes' }
    ] : role() === 'ADMIN' ? [
      { title: '账号管理', detail: '维护本租户成员', route: 'accounts' },
      { title: '业务场景', detail: '配置本租户外呼场景', route: 'ai-scenes' },
      { title: '外呼列表', detail: '创建与管理外呼任务', route: 'ai-tasks' }
    ] : [
      { title: '通话统计', detail: '查看接通情况与业务趋势', route: 'ai-call-report' },
      { title: '通话记录', detail: '查看客户沟通结果', route: 'ai-call-records' },
      { title: '线索记录', detail: '查看客户意向与标签', route: 'ai-leads' }
    ];
    const states = { paused: '已暂停', running: '执行中', not_started: '未开始' };
    // 超管不默认承担租户运营任务；不凭余额推导新的授权/充值待办。
    const items = role() === 'SUPER_ADMIN' ? [] : aiTasks().filter(row => states[row.status])
      .sort((a, b) => Object.keys(states).indexOf(a.status) - Object.keys(states).indexOf(b.status))
      .map(row => ({
        title: row.name, detail: '已呼叫 ' + Number(row.called || 0) + ' / ' + Number(row.assigned || 0),
        status: states[row.status], label: row.status === 'running' ? '查看进度' : '查看任务',
        action: 'Pages.home.openItem("ai-task",' + js(row.id) + ')'
      }));
    return overview(role() === 'SUPER_ADMIN' ? '管理工作台' : role() === 'ADMIN' ? '租户管理工作台' : '运营工作台',
      actions, items, { usage: true, tasks: role() !== 'SUPER_ADMIN', more: [{ title: '全部外呼任务', route: 'ai-tasks' }] });
  }

  function openItem(type, id) {
    if (!AppState.effectiveAccess().valid) return false;
    if (type === 'exception' && cloud()) {
      const row = AppState.scoped(CloudCallData.exceptions).find(item => item.exceptionId === id && BusinessIssues.pending(item));
      const responsible = role() === 'SUPER_ADMIN' ? '超级管理员' : '租户管理员';
      if (!row || row.responsibleRole !== responsible) return false;
      return BusinessIssues.open(id);
    }
    if (type === 'scenario' && cloud() && role() === 'ADMIN' && canRoute('scenario-readiness')) {
      if (!ScenarioReadiness.list(AppState.get().tenantId).some(item => item.type === id && item.status === 'ABNORMAL')) return false;
      ScenarioReadiness.open(id, AppState.get().tenantId); return true;
    }
    if (type === 'cloud-task' && cloud() && canRoute('predictive-tasks')) {
      if (!cloudTasks().some(item => item.taskId === id)) return false;
      return CloudTaskWorkspace.openTask(id);
    }
    if (type === 'ai-task' && !cloud() && canRoute('ai-tasks')) {
      const row = aiTasks().find(item => String(item.id) === String(id));
      if (!row) return false;
      navigateTo('ai-tasks'); Pages['scene-list'].showDetail(row.id); return true;
    }
    return false;
  }

  function legacyAiDashboard() {
    const access = AppState.effectiveAccess();
    const inScope = tenant => tenant && (access.tenantIds || []).includes(tenant.tenantId) &&
      tenant.instanceId === access.instanceId && (tenant.capabilitySet || []).includes('AI_OUTBOUND');
    // 普通账号只读取登录租户；超管的内置租户不承载业务套餐，展示当前品牌范围内首个 AI 租户。
    const tenant = AppState.isSuper() ? AppState.availableTenants().find(inScope) : AppState.currentTenant();
    if (!inScope(tenant)) return ui.empty('当前工作范围内暂无可查看的智能外呼租户');
    const summary = window.AiBillingStore?.summary(tenant);
    if (!summary?.profile) return ui.empty('套餐与用量暂不可用，请稍后重试');
    const available = Number(summary.availableMinutes);
    const minutes = Number.isFinite(available) ? available.toLocaleString('zh-CN', { maximumFractionDigits: 0 }) + ' 分钟' : '暂不可用';
    const callHint = summary.canCall ? '当前可发起智能外呼，任务仍需通过预计分钟等准入校验。' : '当前暂不可发起智能外呼，请核对服务状态、可用分钟及租户外呼设置。';
    return `<div class="home-page" data-anno="ai-home-summary" data-anno-page="home" data-anno-label="智能外呼套餐与统一分钟用量" data-anno-kind="region" data-anno-fields="FLD-011"><div class="home-header"><div class="home-title">套餐与用量</div><div class="home-tenant-name">${AppState.isSuper() ? '当前品牌内查看租户' : '当前租户'} · ${esc(tenant.name)}</div></div><div class="home-card-grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)"><div class="home-card"><div class="home-card-label">当前套餐</div><div class="home-card-value">${esc(summary.productName || '未开通套餐')}</div></div><div class="home-card"><div class="home-card-label">统一可用分钟 ${ui.help('所有智能外呼模型共用同一个分钟池，不按模型单价换算。', '统一可用分钟说明')}</div><div class="home-card-value">${esc(minutes)}</div></div><div class="home-card"><div class="home-card-label">服务区间 · 北京时间</div><div class="home-card-value" style="font-size:15px;line-height:1.7;overflow-wrap:anywhere">${esc(summary.validity || '尚未开通服务')}</div></div><div class="home-card"><div class="home-card-label">服务状态 ${ui.help(callHint, '查看当前呼叫状态')}</div><div class="home-card-value">${ui.status(summary.statusLabel || '状态待核对')}</div></div></div></div>`;
  }

  function showUsage() {
    if (AppState.get().activeDomain !== 'AI_OUTBOUND' || !AppState.effectiveAccess().valid) return false;
    ui.openLayer('home-ai-usage', '<div class="layer-header"><h2>套餐与用量</h2><button type="button" aria-label="关闭" onclick="PlatformUI.closeLayer(\'home-ai-usage\')">×</button></div>' +
      '<div class="layer-body">' + legacyAiDashboard() + '</div><div class="layer-footer"><button type="button" class="btn" onclick="PlatformUI.closeLayer(\'home-ai-usage\')">关闭</button></div>');
    return true;
  }

  function render(options) {
    if (!AppState.effectiveAccess().valid) return ui.empty('请先选择有效的工作范围');
    if (AppState.get().activeDomain === 'AI_OUTBOUND') return aiDashboard();
    return WorkbenchOverview.render(options);
  }

  window.Pages = window.Pages || {};
  window.Pages.home = { render, openItem, showUsage, init() { AgentWorkbench.updateDock(); } };
})();
