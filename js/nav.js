/** 统一外呼中台：单一产品壳、按角色/能力裁剪的完整导航。 */
(function () {
  'use strict';
  window.Pages = window.Pages || {};

  const menu = [
    { key: 'home', label: '工作台', icon: '工', permission: 'home' },
    { key: 'seat-workbench', page: 'seat-workbench', label: '坐席工作台', icon: '席', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', requiresSeat: true },
    { key: 'customers', label: '客户管理', icon: '客', permission: 'cloud.view', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'customer-directory', page: 'customer-directory', label: '客户档案', permission: 'cloud.tasks' },
      { key: 'customer-tasks', page: 'customer-tasks', label: '导入与分配', permission: 'cloud.tasks' },
      { key: 'business-categories', page: 'business-categories', label: '业务分类', permission: 'settings.business' }
    ] },
    { key: 'cloud', label: '云呼叫', icon: '云', permission: 'cloud.view', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'predictive-tasks', page: 'cloud-call-tasks', label: '预外呼', permission: 'cloud.tasks', view: 'predictive' },
      { key: 'ivr-tasks', page: 'cloud-call-tasks', label: '自动外呼', permission: 'cloud.tasks', view: 'ivr' },
      { key: 'inbound-service', page: 'cloud-call-tasks', label: '呼入服务', permission: 'cloud.tasks', view: 'inbound' }
    ] },
    { key: 'records', label: '通话记录', icon: '话', children: [
      { key: 'cloud-call-records', page: 'cloud-call-records', label: '通话记录', permission: 'records.cloud', view: 'records', domain: 'CLOUD_CONTACT_CENTER' },
    ] },
    { key: 'reports', label: '统计报表', icon: '表', children: [
      { key: 'cloud-overview-report', page: 'report-center', label: '通话总览', permission: 'reports.cloud', view: 'overview', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-lead-report', page: 'report-center', label: '线索成效', permission: 'reports.cloud', view: 'leads', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-customer-report', page: 'report-center', label: '客户跟进', permission: 'reports.cloud', view: 'customers', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-outbound-report', page: 'report-center', label: '外呼任务', permission: 'reports.cloud', view: 'outbound', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-agent-report', page: 'report-center', label: '坐席成效', permission: 'reports.cloud', view: 'agents', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-inbound-report', page: 'report-center', label: '呼入服务', permission: 'reports.cloud', view: 'inbound', domain: 'CLOUD_CONTACT_CENTER' },
      { key: 'cloud-skill-report', page: 'report-center', label: '服务技能', permission: 'reports.cloud', view: 'skills', domain: 'CLOUD_CONTACT_CENTER' }
    ] },
    { key: 'account-tenant', label: '账号与租户', icon: '户', children: [
      { key: 'accounts', page: 'account-tenant', label: '账号管理', permission: 'accounts', view: 'accounts' },
      { key: 'tenants', page: 'account-tenant', label: '租户管理', permission: 'tenants', view: 'tenants' }
    ] },
    { key: 'agents', label: '坐席与技能', icon: '席', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'agent-maintenance', page: 'agent-center', label: '坐席维护', permission: 'agents.manage', view: 'agents' },
      { key: 'skill-mappings', page: 'contact-center-settings', label: '技能管理', permission: 'settings.skills', view: 'skill-mappings' },
      { key: 'outbound-group-management', page: 'outbound-group-management', label: '外呼组管理', permission: 'agents.manage' },
      { key: 'queue-management', page: 'queue-management', label: '队列管理', icon: '队', domain: 'CLOUD_CONTACT_CENTER', permission: 'settings.queues' },
      { key: 'sync-records', page: 'agent-center', label: '配置记录', permission: 'agents.sync', view: 'sync' }
    ] },
    { key: 'system', label: '系统管理', icon: '设', domain: 'CLOUD_CONTACT_CENTER', children: [
      { key: 'numbers', page: 'resource-lines', label: '号码管理', icon: '号', domain: 'CLOUD_CONTACT_CENTER', permission: 'resources.numbers', view: 'numbers' },
      { key: 'number-pools', page: 'number-pool-management', label: '号码池管理', icon: '池', domain: 'CLOUD_CONTACT_CENTER', permission: 'settings.numberPools' },
      { key: 'extensions', page: 'extension-management', label: '分机管理', icon: '机', domain: 'CLOUD_CONTACT_CENTER', permission: 'resources.extensions' },
      { key: 'time-conditions', page: 'time-condition-management', label: '时间条件', icon: '时', domain: 'CLOUD_CONTACT_CENTER', permission: 'settings.times' },
      { key: 'alicti-accounts', page: 'alicti-accounts', label: 'AliCti 账号管理', permission: 'system.instances' },
      { key: 'event-callbacks', page: 'system-center', label: '通话数据异常', permission: 'system.events', view: 'events' },
      { key: 'audit', page: 'system-center', label: '操作审计', permission: 'system.audit', view: 'audit' }
    ] }
  ];

  const routes = {};
  const expanded = new Set(['cloud']);
  menu.forEach(group => {
    if (!group.children) routes[group.key] = { ...group, page: group.page || group.key, breadcrumb: [group.label] };
    (group.children || []).filter(item => item.type !== 'section').forEach(item => { routes[item.key] = { ...item, domain: item.domain || group.domain, breadcrumb: [group.label, item.label], parent: group.key }; });
  });
  // 不作为独立菜单；保留场景内检查及配置返回路径的权限校验。
  routes['agent-skills'] = { key: 'agent-skills', page: 'agent-center', label: '坐席分组与等级', permission: 'agents.manage', domain: 'CLOUD_CONTACT_CENTER', view: 'skills', parent: 'agents', breadcrumb: ['坐席与技能', '技能管理', '坐席分组与等级'], internal: true };
  // Historical line-management bookmarks now open number management.
  routes['lines'] = { key: 'lines', page: 'resource-lines', permission: 'resources.numbers', domain: 'CLOUD_CONTACT_CENTER', internal: true, redirect: 'numbers' };
  routes['number-grants'] = { key: 'number-grants', page: 'resource-lines', permission: 'resources.numbers', domain: 'CLOUD_CONTACT_CENTER', internal: true, redirect: 'numbers' };
  // Field management remains a tab inside the business-category module.
  routes['business-fields'] = { key: 'business-fields', page: 'business-categories', permission: 'settings.business', domain: 'CLOUD_CONTACT_CENTER', internal: true, redirect: 'business-categories' };
  routes['scenario-readiness'] = { key: 'scenario-readiness', page: 'scenario-readiness', label: '场景检查', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['云呼叫', '场景检查'], internal: true };
  routes['operations-monitor'] = {page:'home',permission:'home',domain:'CLOUD_CONTACT_CENTER',internal:true,redirect:'home'};
  routes['manual-outbound'] = {page:'seat-workbench',permission:'cloud.tasks',domain:'CLOUD_CONTACT_CENTER',internal:true,redirect:'seat-workbench'};
  routes['cloud-task-create'] = { key: 'cloud-task-create', page: 'cloud-task-workspace', label: '创建任务', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['云呼叫', '创建任务'], internal: true };
  routes['cloud-task-center'] = { key: 'cloud-task-center', page: 'cloud-task-center', label: '任务中心', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['云呼叫', '任务中心'], internal: true };
  routes['seat-event-history'] = { key: 'seat-event-history', page: 'seat-event-history', label: '全部坐席事件', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER', breadcrumb: ['坐席工作台', '班长监控', '全部坐席事件'], internal: true };

  routes['call-plans']={page:'cloud-call-tasks',permission:'settings.plans',domain:'CLOUD_CONTACT_CENTER',internal:true,redirect:'manual-outbound'};
  routes['inbound-routes']={page:'inbound-routing',permission:'settings.routes',domain:'CLOUD_CONTACT_CENTER',internal:true,breadcrumb:['云呼叫','呼入服务','呼入规则']};

  function operatorWorkbench() {
    if (AppState.get().activeDomain !== 'CLOUD_CONTACT_CENTER' || AppState.effectiveAccess().roleCode !== 'OPERATOR') return '';
    // Workbench identity follows this tenant's seat association, not phone presence.
    return window.AgentWorkbench?.hasSeat() ? 'seat-workbench' : 'home';
  }
  function isVisible(item) {
    if (!item || !AppState.isReady()) return false;
    const activeDomain = AppState.get().activeDomain;
    if (item.domain && item.domain !== activeDomain) return false;
    const workbench = operatorWorkbench();
    if (workbench && ['home', 'seat-workbench'].includes(item.key) && item.key !== workbench) return false;
    return AppState.canMenu(item.permission);
  }
  function visibleChildren(group) {
    if (group.domain && AppState.get().activeDomain !== group.domain) return [];
    return (group.children || []).filter(item => isVisible({ ...item, domain: item.domain || group.domain }));
  }
  function menuLabel(item) { return item.key === 'home' && AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER' ? (AppState.effectiveAccess().roleCode === 'ADMIN' ? '管理工作台' : '运营工作台') : item.label; }

  function renderNav() {
    const nav = document.getElementById('businessNavigation');
    if (!nav) return;
    const current = secondaryFrames[0]?.parentNavigation.key || AppState.get().currentPage;
    nav.innerHTML = menu.filter(group => group.children ? visibleChildren(group).some(item => item.type !== 'section') : isVisible(group) && (!group.requiresSeat || window.AgentWorkbench?.hasSeat())).map(group => {
      if (!group.children) return `<button class="business-nav-item ${current === group.key ? 'active' : ''}" data-route="${group.key}" onclick="RouteRuntime.openPrimary('${group.key}')"><span class="nav-glyph">${group.icon}</span><span>${PlatformUI.escape(menuLabel(group))}</span></button>`;
      const children = visibleChildren(group);
      const active = children.some(item => item.key === current) || (routes[current]?.internal && routes[current]?.parent === group.key);
      const open = active || expanded.has(group.key);
      let lastWasSection = false;
      const childHtml = children.map(item => {
        if (item.type === 'section') { lastWasSection = true; return `<div class="nav-section-label">${item.label}</div>`; }
        const selected = current === item.key || (current === 'agent-skills' && item.key === 'skill-mappings');
        const className = `${selected ? 'active' : ''} ${lastWasSection ? 'section-first' : ''}`;
        lastWasSection = false;
        return `<button class="business-nav-child ${className}" data-route="${item.key}" onclick="RouteRuntime.openPrimary('${item.key}')">${PlatformUI.escape(item.label)}</button>`;
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
    let content = document.getElementById('page-content');
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
    bar.innerHTML = `<div><strong>${PlatformUI.escape(sourceLabel)} · ${PlatformUI.escape(context.requirementLabel || '配置项')}</strong><small>完成配置后可继续填写原任务。</small></div><button class="btn btn-primary" onclick="AppState.returnFromConfiguration(true)">完成配置</button>`;
    content.prepend(bar);
  }

  function deny(key, reason) {
    const content = document.getElementById('page-content');
    const missing = reason === '页面地址不存在。';
    if (content) content.innerHTML = `<section class="platform-page"><div class="route-denied"><div class="denied-mark">!</div><h1>${missing ? '页面不存在' : '当前身份无权访问'}</h1><p>${PlatformUI.escape(reason || '该页面不在当前角色、租户或供应商账号范围内。')}</p><button class="btn btn-primary" onclick="navigateTo('home')">返回工作台</button></div></section>`;
    document.body.dataset.routeKey = key || 'denied';
    return false;
  }

  window.toggleNavigationGroup = function (key) { if (expanded.has(key)) expanded.delete(key); else expanded.add(key); renderNav(); };
  let lastNavigation=null;
  const secondaryFrames = [];
  const primaryHistory = [];
  let sequence = 0;
  const layerSelector = '.platform-layer,#importModalBackdrop,#intentConfigBackdrop,#callRecordListBackdrop,#callRecordDetailBackdrop,#bizAddSceneBackdrop,#bizFieldBackdrop';
  const contextKey = () => { const s=AppState.get(); return [s.accountId,s.tenantId,s.enterpriseId,s.activeDomain].join('|'); };
  const accessKey = () => JSON.stringify([AppState.effectiveAccess().valid,AppState.effectiveAccess().roleCode,Object.keys(routes).filter(key=>isVisible(routes[key]))]);
  let activeContext = contextKey();
  let activeAccess = accessKey();

  function resolve(key) {
    if (key === 'business-fields') window.BusinessConfiguration?.selectKind('field', false);
    if (key === 'home' && AppState.canMenu('system.instances') && !AppState.effectiveAccess().valid) key = 'alicti-accounts';
    if (key === 'exceptions') key = 'home';
    let route = routes[key];
    while (route?.redirect) { key=route.redirect; route=routes[key]; }
    const workbench = operatorWorkbench();
    if (workbench && ['home', 'seat-workbench'].includes(key)) { key=workbench; route=routes[key]; }
    return {key,route};
  }
  function regularLayers() {
    return Array.from(document.body.querySelectorAll(layerSelector)).filter(node => !node.dataset.secondaryRoute && !node.parentElement?.closest(layerSelector));
  }
  function suspendContent(content) {
    const fragment = document.createDocumentFragment();
    const preview=document.createElement('div'); preview.className='secondary-parent-preview'; preview.inert=true; preview.setAttribute('aria-hidden','true');
    // Shadow DOM keeps the visible parent separate from active form IDs and selectors.
    const shadow=preview.attachShadow({mode:'open'});
    document.querySelectorAll('link[rel="stylesheet"],style').forEach(style=>shadow.appendChild(style.cloneNode(true)));
    const snapshot=document.createElement('div'); snapshot.className='secondary-preview-content';
    Array.from(content.childNodes).forEach(child=>snapshot.appendChild(child.cloneNode(true)));
    shadow.appendChild(snapshot);
    while(content.firstChild)fragment.appendChild(content.firstChild);
    content.appendChild(preview);
    return fragment;
  }
  function renderCurrent(options) {
    if (!lastNavigation) return false;
    const {key}=lastNavigation, route=routes[key], page=window.Pages[route?.page], content=document.getElementById('page-content');
    if (!content || !page) return false;
    if(!AppState.isReady()||!isVisible(route))return deny(key);
    const opts={...lastNavigation.options,...(options||{})};
    lastNavigation={key,options:opts};
    const scroll=content.scrollTop;
    content.innerHTML=page.render(opts);
    mountReturnContext(key); mountPageBack();
    const current=lastNavigation;
    requestAnimationFrame(()=>{if(lastNavigation===current&&content.isConnected)page.init?.(opts);});
    content.scrollTop=scroll;
    return true;
  }
  function mountPageBack() {
    const content=document.getElementById('page-content');
    if (!content) return;
    const returns=Array.from(content.querySelectorAll('.page-actions button')).filter(button=>(button.getAttribute('onclick')||'').includes('RouteRuntime.back('));
    if(secondaryFrames.length){returns.forEach(button=>button.remove());return;}
    // Menu landing pages use the sidebar; retain explicit detail/workflow returns.
    if (!routes[lastNavigation?.key]?.internal && !returns.length) return;
    if ((!primaryHistory.length&&!returns.length) || content.querySelector(':scope > .page-back-row')) return;
    const row=document.createElement('div'); row.className='page-back-row';
    if(returns.length){const button=returns.shift();button.className='secondary-back';button.textContent='← 返回';button.setAttribute('aria-label','返回上一页');row.appendChild(button);returns.forEach(button=>button.remove());}
    else row.innerHTML='<button type="button" class="secondary-back" onclick="RouteRuntime.back()" aria-label="返回上一页">← 返回</button>';
    content.prepend(row);
  }
  function closeSecondary(options={}) {
    const frame=secondaryFrames.at(-1); if(!frame)return false;
    if(!options.force&&frame.options.onBeforeClose?.(options)===false)return false;
    window.AgentWorkbench?.beforeRouteChange();
    // Ordinary dialogs belong to this page; none may leak into its parent.
    regularLayers().forEach(node=>node.remove());
    if(!options.force)PlatformUI.animateLayerExit(document.getElementById(frame.id));
    document.getElementById(frame.id)?.remove();
    secondaryFrames.pop();
    frame.parentContent.id='page-content';
    frame.parentContent.replaceChildren(frame.fragment);
    frame.parentContent.scrollTop=frame.scroll;
    if(!options.force)window.Pages[routes[frame.parentNavigation.key]?.page]?.restoreNavigationState?.(frame.pageState);
    frame.layers.forEach(node=>document.body.appendChild(node));
    lastNavigation=frame.parentNavigation;
    if(!options.force){AppState.setCurrentPage(lastNavigation.key);document.body.dataset.routeKey=lastNavigation.key;}
    if(!options.force)frame.options.onClose?.();
    if(!options.force&&AppState.getReturnContext?.()?.targetRoute===frame.key)AppState.clearReturnContext();
    if(!options.force&&(options.refresh||frame.options.refreshOnClose))renderCurrent({preserveFilters:true});
    if(!options.force){setBreadcrumb(routes[secondaryFrames[0]?.parentNavigation.key||lastNavigation.key]);renderNav();}
    document.body.classList.toggle('layer-open',!!document.querySelector('.platform-layer'));
    if(!options.force&&frame.opener?.isConnected)frame.opener.focus?.({preventScroll:true});
    return true;
  }
  function openSecondary(key, options={}) {
    if(!AppState.isReady())return false;
    const resolved=resolve(key);key=resolved.key;const route=resolved.route;
    if(!route||!isVisible(route)||!window.Pages[route.page]?.render){showToast('当前身份无法打开此页面','warning');return false;}
    const parentContent=document.getElementById('page-content');
    if(!parentContent||!lastNavigation)return window.navigateTo(key,options);
    window.AgentWorkbench?.beforeRouteChange();
    const id='secondary-route-'+(++sequence);
    const frame={id,key,options,parentContent,parentNavigation:{key:lastNavigation.key,options:{...lastNavigation.options}},scroll:parentContent.scrollTop,opener:document.activeElement,layers:regularLayers()};
    frame.pageState=window.Pages[routes[lastNavigation.key]?.page]?.captureNavigationState?.();
    frame.layers.forEach(node=>node.remove());
    frame.fragment=suspendContent(parentContent); parentContent.id=id+'-parent';
    secondaryFrames.push(frame);
    PlatformUI.openLayer(id,'<div class="layer-header"><h2>'+PlatformUI.escape(options.title||route.label||route.breadcrumb?.at(-1)||'详情')+'</h2><button type="button" onclick="RouteRuntime.back()" aria-label="关闭">×</button></div><div id="page-content" class="secondary-route-content" data-route-key="'+key+'"></div>','secondary-route-panel',{onBackdropClick:options.onBackdropClick});
    const layer=document.getElementById(id);layer.dataset.secondaryRoute=key;
    AppState.setCurrentPage(key);document.body.dataset.routeKey=key;
    lastNavigation={key,options:{view:route.view,routeKey:key,...options}};
    renderCurrent(); renderNav();
    return true;
  }
  function back(options={}) {
    if(secondaryFrames.length)return closeSecondary(options);
    if(primaryHistory.length){history.back();return true;}
    if(options.fallback)return window.navigateTo(options.fallback,{skipPageHistory:true});
    return false;
  }
  function openPrimary(key,options={}) {
    while(secondaryFrames.length)if(!closeSecondary())return false;
    return window.navigateTo(key,{...options,primaryNavigation:true});
  }

  function historyOptions(key,state) {
    if(key!=='agent-skills'||state?.routeKey!==key)return {};
    return Object.fromEntries(['physicalGroupId','tenantId'].filter(name=>typeof state[name]==='string').map(name=>[name,state[name]]));
  }
  window.navigateTo = function (key, options) {
    if (!AppState.isReady()) return false;
    const requestedKey=key;
    const resolved=resolve(key);key=resolved.key;
    const route = resolved.route;
    if (!route) return deny(key, '页面地址不存在。');
    if (!isVisible(route)) return deny(key, '当前角色或租户没有该页面的访问权限。');
    if(route.redirect)return window.navigateTo(route.redirect,{...(options||{})});
    const page = window.Pages[route.page];
    if (!page || typeof page.render !== 'function') return deny(key, '该功能正在初始化，请刷新页面后重试。');
    let content = document.getElementById('page-content');
    if (!content) return false;
    const opts = { view: route.view, routeKey: key, ...(options || {}) };
    if (opts.historyNavigation && requestedKey !== key && ['home', 'seat-workbench'].includes(key)) {
      history.replaceState({routeKey:key},'',`#${key}`);
    }
    if (secondaryFrames.length && !opts.primaryNavigation && !opts.browserNavigation) {
      if (lastNavigation?.key === key) return renderCurrent(opts);
      const ancestor=secondaryFrames.findIndex(frame=>frame.parentNavigation.key===key);
      if(ancestor>=0){while(secondaryFrames.length>ancestor)if(!closeSecondary())return false;return renderCurrent(opts);}
      return openSecondary(key,opts);
    }
    while(secondaryFrames.length)if(!closeSecondary()){
      if(opts.browserNavigation){const origin=secondaryFrames[0].parentNavigation.key;history.pushState({routeKey:origin},'',`#${origin}`);}
      return false;
    }
    content=document.getElementById('page-content');
    if(opts.browserNavigation&&lastNavigation?.key!==key){
      const previousIndex=primaryHistory.findLastIndex(item=>item.key===key);
      if(previousIndex>=0){Object.assign(opts,primaryHistory[previousIndex].options,{routeKey:key,view:route.view,preserveFilters:true,historyNavigation:true,browserNavigation:true});primaryHistory.splice(previousIndex);}
      else if(lastNavigation)primaryHistory.push({key:lastNavigation.key,options:{...lastNavigation.options}});
    }
    if(lastNavigation&&lastNavigation.key!==key&&!opts.skipPageHistory&&!opts.historyNavigation)primaryHistory.push({key:lastNavigation.key,options:{...lastNavigation.options}});
    window.AgentWorkbench?.beforeRouteChange();
    lastNavigation={key,options:{...opts}};
    if (!opts.historyNavigation) {
      const state={routeKey:key,...historyOptions(key,{...opts,routeKey:key})};
      if(location.hash!==`#${key}`)history.pushState(state,'',`#${key}`);
      else history.replaceState(state,'',`#${key}`);
    }
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
    mountPageBack();
    setBreadcrumb(route);
    renderNav();
    const currentNavigation=lastNavigation;
    requestAnimationFrame(() => { if(lastNavigation===currentNavigation&&content.isConnected)page.init?.(opts); });
    content.scrollTop = 0;
    return true;
  };

  window.RouteRuntime = { openSecondary, openPrimary, back, refreshCurrent:()=>renderCurrent({preserveFilters:true}), secondaryDepth:()=>secondaryFrames.length, routes, canRoute: key => isVisible(routes[key]), deny, snapshot:()=>lastNavigation&&{key:lastNavigation.key,options:{...lastNavigation.options}} };
  window.RouteMap = routes;
  window.UnifiedCallMenu = menu;
  AppState.subscribe(() => {
    const nextContext=contextKey();
    const nextAccess=accessKey();
    if(nextAccess!==activeAccess&&nextContext===activeContext&&lastNavigation){window.CloudTaskWorkspace?.clearActiveContext();AppState.setDirty(false);AppState.clearReturnContext();AppState.setCurrentPage('home');}
    if(!AppState.isReady()||nextContext!==activeContext||nextAccess!==activeAccess){while(secondaryFrames.length)closeSecondary({force:true});regularLayers().forEach(node=>node.remove());document.querySelectorAll('.drawer-exit-visual,.legacy-drawer-ghost').forEach(node=>node.remove());document.body.classList.remove('layer-open');document.body.style.overflow='';primaryHistory.length=0;lastNavigation=null;activeContext=nextContext;activeAccess=nextAccess;}
    renderNav();
    if (!AppState.isReady()) {
      const content = document.getElementById('page-content');
      if (content) content.innerHTML = '<div class="page-loading">登录后进入工作台</div>';
      return;
    }
    if(secondaryFrames.length){
      const authorized=isVisible(routes[lastNavigation?.key])&&secondaryFrames.every(frame=>isVisible(routes[frame.parentNavigation.key]));
      if(authorized){renderCurrent({preserveFilters:true});return;}
      while(secondaryFrames.length)closeSecondary({force:true});
      regularLayers().forEach(node=>node.remove());primaryHistory.length=0;
      navigateTo('home',{historyNavigation:true});return;
    }
    const current = AppState.get().currentPage;
    if (routes[current] && isVisible(routes[current])) {
      if(lastNavigation?.key===current)renderCurrent({preserveFilters:true});
      else navigateTo(current, { historyNavigation: true });
    }
    else navigateTo('home', { historyNavigation: true });
  });
  window.addEventListener('popstate', () => {const requested=location.hash.slice(1)||'home';const key=routes[requested]?requested:'home';if(key!==requested)history.replaceState({routeKey:key},'',`#${key}`);navigateTo(key,{...historyOptions(key,history.state),historyNavigation:true,browserNavigation:true});});
  document.addEventListener('DOMContentLoaded', () => {
    renderNav();
    if (!AppState.isReady()) return;
    const requested = location.hash.slice(1) || AppState.get().currentPage || 'home';
    const key = routes[requested] ? requested : 'home';
    if (key !== requested) history.replaceState({routeKey:key},'',`#${key}`);
    navigateTo(key, { ...historyOptions(key,history.state), historyNavigation: true });
  });
})();
