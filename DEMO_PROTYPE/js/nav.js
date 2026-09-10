/** 统一外呼中台：单一产品壳、按角色/能力裁剪的完整导航。 */
(function () {
  'use strict';
  window.Pages = window.Pages || {};

  const menu = [
    { key: 'home', label: '工作台', icon: '工', permission: 'home' },
    { key: 'seat-workbench', page: 'seat-workbench', label: '坐席工作台', icon: '席', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', requiresSeat: true },
    { key: 'ai', label: '智能外呼', icon: '智', permission: 'ai.view', domain: 'AI_OUTBOUND', children: [
      { key: 'ai-tasks', page: 'scene-list', label: '外呼列表', permission: 'ai.tasks' },
      { key: 'ai-blocklist', page: 'scene-block', label: '外呼拦截', permission: 'ai.settings' },
      { key: 'ai-channels', page: 'ai-domain', label: '通道管理', permission: 'ai.settings', view: 'channels' },
      { key: 'ai-scenes', page: 'sys-scene', label: '业务场景', permission: 'ai.settings' },
      { key: 'ai-tags', page: 'sys-tags', label: '标签管理', permission: 'ai.settings' }
    ] },
    { key: 'customers', label: '客户管理', icon: '客', permission: 'cloud.view', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'customer-directory', page: 'customer-directory', label: '客户档案', permission: 'cloud.tasks' },
      { key: 'customer-tasks', page: 'customer-tasks', label: '导入与分配', permission: 'cloud.tasks' }
    ] },
    { key: 'cloud', label: '云呼叫', icon: '云', permission: 'cloud.view', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'predictive-tasks', page: 'cloud-call-tasks', label: '预外呼', permission: 'cloud.tasks', view: 'predictive' },
      { key: 'ivr-tasks', page: 'cloud-call-tasks', label: 'IVR 外呼', permission: 'cloud.tasks', view: 'ivr' },
      { key: 'inbound-service', page: 'cloud-call-tasks', label: '呼入服务', permission: 'cloud.tasks', view: 'inbound' }
    ] },
    { key: 'records', label: '通话记录', icon: '话', children: [
      { key: 'ai-call-records', page: 'result-records', label: '通话记录', permission: 'records.ai', domain: 'AI_OUTBOUND' },
      { key: 'ai-leads', page: 'result-clue', label: '线索记录', permission: 'records.ai', domain: 'AI_OUTBOUND' },
      { key: 'cloud-call-records', page: 'cloud-call-records', label: '通话记录', permission: 'records.cloud', view: 'records', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-callbacks', page: 'cloud-call-records', label: '结果回流', permission: 'records.cloud', view: 'callbacks', domain: 'CLOUD_CONTACT_CENTER' }
    ] },
    { key: 'reports', label: '统计报表', icon: '表', children: [
      { key: 'ai-call-report', page: 'report-call', label: '通话统计', permission: 'reports.ai', domain: 'AI_OUTBOUND' },
      { key: 'ai-billing-report', page: 'report-billing', label: '计费统计', permission: 'reports.ai', domain: 'AI_OUTBOUND' },
      { key: 'ai-lead-report', page: 'report-clue', label: '线索统计', permission: 'reports.ai', domain: 'AI_OUTBOUND' },
      { key: 'cloud-overview-report', page: 'report-center', label: '呼叫总览', permission: 'reports.cloud', view: 'overview', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-outbound-report', page: 'report-center', label: '外呼任务', permission: 'reports.cloud', view: 'outbound', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-inbound-report', page: 'report-center', label: '呼入服务', permission: 'reports.cloud', view: 'inbound', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-agent-report', page: 'report-center', label: '坐席报表', permission: 'reports.cloud', view: 'agents', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-skill-report', page: 'report-center', label: '技能组报表', permission: 'reports.cloud', view: 'skills', domain: 'CLOUD_CONTACT_CENTER' }
    ] },
    { key: 'account-tenant', label: '账号与租户', icon: '户', children: [
      { key: 'accounts', page: 'account-tenant', label: '账号管理', permission: 'accounts', view: 'accounts' },
      { key: 'tenants', page: 'account-tenant', label: '租户管理', permission: 'tenants', view: 'tenants' }
    ] },
    { key: 'business-apps', label: '业务系统', icon: '业', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'tenant-business-systems', page: 'system-center', label: '已授权系统', permission: 'business.accounts', view: 'authorized' }
    ] },
    { key: 'agents', label: '坐席管理', icon: '席', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'agent-maintenance', page: 'agent-center', label: '坐席维护', permission: 'agents.manage', view: 'agents' },
      { key: 'agent-skills', page: 'agent-center', label: '坐席技能', permission: 'agents.manage', view: 'skills' },
      { key: 'sync-records', page: 'agent-center', label: '配置记录', permission: 'agents.sync', view: 'sync' }
    ] },
    { key: 'contact-settings', label: '联络中心设置', icon: '联', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'skill-mappings', page: 'contact-center-settings', label: '服务技能配置', permission: 'settings.skills', view: 'skill-mappings' },
    ] },
    { key: 'line-number', label: '线路与号码', icon: '号', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'lines', page: 'resource-lines', label: '线路管理', permission: 'resources.lines', view: 'lines' },
      { key: 'numbers', page: 'resource-lines', label: '号码管理', permission: 'resources.numbers', view: 'numbers' },
      { key: 'number-grants', page: 'resource-lines', label: '租户用号授权', permission: 'resources.numbers', view: 'grants' }
    ] },
    { key: 'system', label: '系统管理', icon: '设', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'business-systems', page: 'system-center', label: '业务系统', permission: 'system.businessSystems', view: 'systems' },
      { key: 'event-callbacks', page: 'system-center', label: '通话数据异常', permission: 'system.events', view: 'events' },
      { key: 'audit', page: 'system-center', label: '操作审计', permission: 'system.audit', view: 'audit' }
    ] }
  ];

  const routes = {};
  const expanded = new Set(['ai', 'cloud']);
  menu.forEach(group => {
    if (!group.children) routes[group.key] = { ...group, page: group.page || group.key, breadcrumb: [group.label] };
    (group.children || []).filter(item => item.type !== 'section').forEach(item => { routes[item.key] = { ...item, domain: item.domain || group.domain, breadcrumb: [group.label, item.label], parent: group.key }; });
  });
  // 不作为独立菜单；保留场景内检查及配置返回路径的权限校验。
  routes['scenario-readiness'] = { key: 'scenario-readiness', page: 'scenario-readiness', label: '场景检查', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['云呼叫', '场景检查'], internal: true };
  routes['operations-monitor'] = {page:'home',permission:'home',domain:'CLOUD_CONTACT_CENTER',internal:true,redirect:'home'};
  routes['manual-outbound'] = {page:'seat-workbench',permission:'cloud.tasks',domain:'CLOUD_CONTACT_CENTER',internal:true,redirect:'seat-workbench'};
  // 兼容旧系统地址，统一返回已授权系统页，不生成系统子菜单。
  CloudCallData.businessSystems.forEach(s=>{routes[BusinessSystemAccess.route(s.businessSystemId)]={page:'system-center',permission:'business.accounts',domain:'CLOUD_CONTACT_CENTER',businessSystemId:s.businessSystemId,internal:true,redirect:'tenant-business-systems'};});
  routes['cloud-task-create'] = { key: 'cloud-task-create', page: 'cloud-task-workspace', label: '创建任务', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['云呼叫', '创建任务'], internal: true };
  routes['cloud-task-center'] = { key: 'cloud-task-center', page: 'cloud-task-center', label: '任务中心', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['云呼叫', '任务中心'], internal: true };

  routes['call-plans']={page:'cloud-call-tasks',permission:'settings.plans',domain:'CLOUD_CONTACT_CENTER',internal:true,redirect:'manual-outbound'};
  routes['inbound-routes']={page:'inbound-routing',permission:'settings.routes',domain:'CLOUD_CONTACT_CENTER',internal:true,breadcrumb:['云呼叫','呼入服务','呼入规则']};

  function isVisible(item) {
    if (!item || !AppState.isReady()) return false;
    const activeDomain = AppState.get().activeDomain;
    if (item.domain && item.domain !== activeDomain) return false;
    if(item.businessSystemId&&!BusinessSystemAccess.canUse(item.businessSystemId))return false;
    return AppState.canMenu(item.permission);
  }
  function visibleChildren(group) {
    if (group.domain && AppState.get().activeDomain !== group.domain) return [];
    return (group.children || []).filter(item => isVisible({ ...item, domain: item.domain || group.domain }));
  }
  function menuLabel(item) { return item.key === 'home' && AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER' ? '运营工作台' : item.label; }

  function renderNav() {
    const nav = document.getElementById('businessNavigation');
    if (!nav) return;
    const current = AppState.get().currentPage;
    nav.innerHTML = menu.filter(group => group.children ? visibleChildren(group).some(item => item.type !== 'section') : isVisible(group) && (!group.requiresSeat || window.AgentWorkbench?.hasSeat())).map(group => {
      if (!group.children) return `<button class="business-nav-item ${current === group.key ? 'active' : ''}" data-route="${group.key}" onclick="navigateTo('${group.key}')"><span class="nav-glyph">${group.icon}</span><span>${PlatformUI.escape(menuLabel(group))}</span></button>`;
      const children = visibleChildren(group);
      const active = children.some(item => item.key === current);
      const open = active || expanded.has(group.key);
      let lastWasSection = false;
      const childHtml = children.map(item => {
        if (item.type === 'section') { lastWasSection = true; return `<div class="nav-section-label">${item.label}</div>`; }
        const className = `${current === item.key ? 'active' : ''} ${lastWasSection ? 'section-first' : ''}`;
        lastWasSection = false;
        return `<button class="business-nav-child ${className}" data-route="${item.key}" onclick="navigateTo('${item.key}')">${PlatformUI.escape(item.label)}</button>`;
      }).join('');
      return `<div class="business-nav-group ${open ? 'open' : ''} ${active ? 'active-parent' : ''}" data-group="${group.key}"><button class="business-nav-item nav-group-trigger" type="button" aria-expanded="${open}" onclick="toggleNavigationGroup('${group.key}')"><span class="nav-glyph">${group.icon}</span><span class="nav-domain-label">${group.label}</span><span class="nav-chevron">⌄</span></button><div class="business-nav-children">${childHtml}</div></div>`;
    }).join('');
  }

  function setBreadcrumb(route) {
    const node = document.getElementById('breadcrumb');
    if (!node) return;
    const labels = route?.key === 'home' ? [menuLabel(route)] : route?.breadcrumb || [];
    node.innerHTML = labels.map((label, index) => `${index ? '<span class="bc-sep">/</span>' : ''}<span class="${index === labels.length - 1 ? 'bc-current' : 'bc-parent'}">${PlatformUI.escape(label)}</span>`).join('');
  }

  function mountReturnContext(routeKey) {
    const context = AppState.getReturnContext?.(routeKey);
    const content = document.getElementById('page-content');
    if (!context || !content || context.contextType !== 'wizard') return;
    const scenario = window.ScenarioReadiness?.meta?.[context.scenarioType];
    const sourceLabel = scenario?.label || context.sourceLabel || context.scenarioType || '云呼叫配置';
    const isWizard = context.contextType === 'wizard';
    const bar = document.createElement('div');
    bar.className = 'return-context-bar';
    bar.setAttribute('data-anno', 'configuration-return-context');
    bar.setAttribute('data-anno-page', routeKey);
    bar.setAttribute('data-anno-label', '场景缺项配置返回上下文');
    bar.setAttribute('data-anno-kind', 'action');
    bar.setAttribute('data-anno-fields', 'FLD-009,FLD-012,FLD-013,FLD-014,FLD-054');
    bar.innerHTML = `<div><span>${isWizard ? '来自任务向导' : '来自场景准备度'}</span><strong>${PlatformUI.escape(sourceLabel)} · ${PlatformUI.escape(context.requirementLabel || '配置项')}</strong><small>${isWizard ? '草稿已自动保存；完成或暂不修改后都将回到原任务原步骤。' : '完成本页动作后返回原场景；关键配置变化会使该场景重新进入待验证。'}</small></div><div><button class="btn" onclick="AppState.returnFromConfiguration(false)">暂不修改，返回${isWizard ? '任务' : '场景'}</button><button class="btn btn-primary" onclick="AppState.returnFromConfiguration(true)">${context.wasReady ? '保存变更并返回' : '模拟完成并返回'}</button></div>`;
    content.prepend(bar);
  }

  function deny(key, reason) {
    const content = document.getElementById('page-content');
    if (content) content.innerHTML = `<section class="platform-page"><div class="route-denied"><div class="denied-mark">!</div><h1>当前身份无权访问</h1><p>${PlatformUI.escape(reason || '该页面不在当前角色、租户能力或实例范围内。')}</p><button class="btn btn-primary" onclick="navigateTo('home')">返回工作台</button></div></section>`;
    document.body.dataset.routeKey = key || 'denied';
    return false;
  }

  window.toggleNavigationGroup = function (key) { if (expanded.has(key)) expanded.delete(key); else expanded.add(key); renderNav(); };
  let lastNavigation=null;
  window.navigateTo = function (key, options) {
    if (!AppState.isReady()) return false;
    if (key === 'exceptions') return window.navigateTo('home');
    const route = routes[key];
    if (!route) return deny(key, '页面地址不存在。');
    if (!isVisible(route)) return deny(key, '当前租户未开通对应能力，或当前角色没有该管理权限。');
    if(route.redirect)return window.navigateTo(route.redirect,{...(options||{}),businessSystemId:route.businessSystemId});
    const page = window.Pages[route.page];
    if (!page || typeof page.render !== 'function') return deny(key, '该功能正在初始化，请刷新页面后重试。');
    const content = document.getElementById('page-content');
    if (!content) return false;
    const opts = { view: route.view, routeKey: key, ...(options || {}), businessSystemId: route.businessSystemId || options?.businessSystemId };
    window.AgentWorkbench?.beforeRouteChange();
    lastNavigation={key,options:{...opts}};
    if (!opts.historyNavigation && location.hash !== `#${key}`) history.pushState({ routeKey: key }, '', `#${key}`);
    document.querySelectorAll('.platform-layer, .scene-more-menu, .block-modal-mask, .record-detail-backdrop, .billing-detail-backdrop, .billing-call-backdrop, #singleDetailBackdrop, #clueReportDetailBackdrop').forEach(node => node.remove());
    [
      'sceneDetailBackdrop',
      'focusRankBackdrop',
      'importModalBackdrop',
      'intentConfigBackdrop',
      'callRecordListBackdrop',
      'callRecordDetailBackdrop',
      'bizAddSceneBackdrop',
      'bizFieldBackdrop'
    ].forEach(id => document.getElementById(id)?.remove());
    document.body.classList.remove('layer-open');
    document.body.style.overflow = '';
    AppState.setCurrentPage(key);
    document.body.dataset.routeKey = key;
    content.dataset.routeKey = key;
    content.innerHTML = page.render(opts);
    window.AgentWorkbench?.updateDock();
    mountReturnContext(key);
    setBreadcrumb(route);
    renderNav();
    requestAnimationFrame(() => page.init?.(opts));
    content.scrollTop = 0;
    return true;
  };

  window.RouteRuntime = { routes, canRoute: key => isVisible(routes[key]), deny, snapshot:()=>lastNavigation&&{key:lastNavigation.key,options:{...lastNavigation.options}} };
  window.RouteMap = routes;
  window.UnifiedCallMenu = menu;
  AppState.subscribe(() => {
    renderNav();
    if (!AppState.isReady()) {
      const content = document.getElementById('page-content');
      if (content) content.innerHTML = '<div class="page-loading">登录后进入工作台</div>';
      return;
    }
    const current = AppState.get().currentPage;
    if (routes[current] && isVisible(routes[current])) navigateTo(current, { historyNavigation: true });
    else navigateTo('home', { historyNavigation: true });
  });
  window.addEventListener('popstate', () => navigateTo(location.hash.slice(1) || 'home', { historyNavigation: true }));
  document.addEventListener('DOMContentLoaded', () => {
    renderNav();
    if (!AppState.isReady()) return;
    const key = location.hash.slice(1) || AppState.get().currentPage || 'home';
    navigateTo(routes[key] ? key : 'home', { historyNavigation: true });
  });
})();
