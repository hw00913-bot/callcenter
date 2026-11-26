(() => {
  'use strict';

  const workbenchPage = 'PAGE-2202';
  const performancePage = 'PAGE-21005';
  const route = 'seat-call-performance';
  const cloud = window.DNativeModules?.cloud;
  const position = DNav.pages.findIndex(page => page.id === workbenchPage);
  if (!cloud?.html || position === -1) return;

  const changes = [
    [
      "  routes['seat-event-history'] =",
      "  routes['seat-call-performance'] = { key: 'seat-call-performance', page: 'seat-call-performance', label: '通话成效', permission: 'cloud.tasks', domain: 'CLOUD_CONTACT_CENTER' };\n  routes['seat-event-history'] ="
    ],
    [
      '    if (!item || !AppState.isReady()) return false;',
      "    if (!item || !AppState.isReady()) return false;\n    if (item.key === 'seat-call-performance' && window.DProductionAccess?.boundSeat() !== true) return false;\n    if (item.key === 'seat-event-history' && window.TenantCallMonitor?.eligible() !== true) return false;"
    ],
    [
      "RouteRuntime.openSecondary(personal?'seat-workbench':'home',{dashboardSection:section,dashboardFilter:filter});",
      "RouteRuntime.openSecondary(personal?'seat-call-performance':'home',{dashboardSection:section,dashboardFilter:filter});"
    ],
    [
      '  function personal(m,options={}){',
      '  function personal(m,options={},performance=false){'
    ],
    [
      "    return '<div class=\"workbench-summary\"><b>我的客户与通话</b><span>仅本人范围 · 待联络为当前待办，其余为今日数据</span></div><div class=\"seat-personal-columns\">'+block('客户联络',pending)+block('通话成效',receiving+work+results)+'</div>';",
      "    return performance ? block('本人通话统计',receiving+work+results) : block('客户联络',pending);"
    ],
    [
      "    if(!section)return personal(m,options);",
      "    if(!section)return personal(m,options,options.showCallPerformance===true);"
    ],
    [
      '  function seatCallTime(c){return metrics.callTime(c)??0;}',
      `  window.Pages['seat-call-performance']={
    render(options={}){
      if(window.DProductionAccess?.boundSeat()!==true)return ui.empty('当前账号尚未关联本租户坐席');
      const heading=options.dashboardSection?'':ui.pageHeader('通话成效','仅显示本人今日通话数据。待联络客户按当前待办统计。');
      return '<section class="platform-page workbench-page seat-home">'+heading+renderSeat({...options,showCallPerformance:true})+'</section>';
    },
    init(options={}){
      const phone=window.AgentWorkbench;
      phone?.updateDock();
      if (!options.pendingCallId || parent.DApp?.currentPage() !== 'PAGE-21005') return;
      const context=parent.DSession.context();
      const {call,phase}=phone?.authorizationSnapshot() || {};
      if (phase && phase !== 'idle' && call?.callId === options.pendingCallId &&
          call.accountId === context?.account.id && call.tenantId === context?.scope.id) phone.openDialog();
    }
  };
  function seatCallTime(c){return metrics.callTime(c)??0;}`
    ],
    [
      '  const seatPage=Pages[\'seat-workbench\'],renderSeat=seatPage.render;\n  seatPage.render=function(options){return renderSeat(options)+workload();};',
      '  // Tenant workload is available through the authorized supervisor view.'
    ],
    [
      '  function scopedSeat(id){\n',
      "  function scopedSeat(id){\n    if(AppState.effectiveAccess().roleCode==='OPERATOR')return null;\n"
    ],
    [
      '  window.DCloudSourceFragments={openSeat,workload,businessShare,numberSummary};',
      '  window.DCloudSourceFragments={openSeat,businessShare,numberSummary};'
    ],
    [
      "  function inspectAgent(id,page=1){\n    if(!valid())return;",
      "  function inspectAgent(id,page=1){\n    if(!valid()||role()==='OPERATOR')return;"
    ],
    [
      "  function inspectCall(agentId,callId){if(!valid())return;",
      "  function inspectCall(agentId,callId){if(!valid()||role()==='OPERATOR')return;"
    ],
    [
      "c.enterpriseId===agent.enterpriseId&&identity(c)===agent.contactCenterIdentityId));",
      "c.enterpriseId===agent.enterpriseId&&identity(c)===agent.contactCenterIdentityId&&(!c.accountId||c.accountId===AppState.get().accountId)));"
    ]
  ];

  let html = cloud.html;
  for (const [before, after] of changes) {
    const first = html.indexOf(before);
    if (first < 0 || html.indexOf(before, first + before.length) !== -1) {
      throw new Error('无法定位通话成效原型配置：' + before.slice(0, 90));
    }
    html = html.slice(0, first) + after + html.slice(first + before.length);
  }
  const workloadStart = html.indexOf('  function workload(){\n');
  const workloadEnd = html.indexOf('  function businessShare(){', workloadStart);
  if (workloadStart < 0 || workloadEnd < 0) throw new Error('无法定位原坐席负荷入口。');
  html = html.slice(0, workloadStart) + html.slice(workloadEnd);
  cloud.html = html;

  DNav.pages.splice(position + 1, 0, {
    ...DNav.pages[position], id: performancePage, name: '通话成效', route
  });

  const originalPage = DRolePermissions.page;
  DRolePermissions.page = (id, context, seat) => id === performancePage
    ? Boolean(context?.scope.kind === 'tenant' && DSession.allowed(workbenchPage, context) && DSession.boundSeat(context))
    : originalPage(id, context, seat);
})();
