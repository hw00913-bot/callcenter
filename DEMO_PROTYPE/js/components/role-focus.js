/** Role-specific summaries from current scoped data; no synthetic health metrics. */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape;
  const role=()=>AppState.effectiveAccess().roleCode;
  const valid=()=>AppState.effectiveAccess().valid&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER';
  const scoped=rows=>AppState.scoped(rows||[]);
  const link=(label,route)=>window.RouteRuntime?.canRoute(route)?'<button class="btn" onclick="navigateTo(\''+route+'\')">'+label+'</button>':'';
  function health(){
    if(!valid()||role()!=='SUPER_ADMIN')return ui.empty('当前身份无权查看平台健康');
    const d=CloudCallData,instance=AppState.get().instanceId;
    const source=[
      {name:'坐席开通',items:scoped(d.syncRecords).filter(r=>r.objectType==='云呼叫坐席创建'&&r.status!=='成功'),route:'sync-records'},
      {name:'任务执行异常',items:scoped(d.tasks).filter(r=>['异常','资源不足暂停'].includes(r.status)),route:'operations-monitor',action:'tasks'},
      {name:'通话数据接收',items:(d.callDataIssues||[]).filter(r=>r.instanceId===instance&&r.status!=='已恢复'),route:'event-callbacks'},
      {name:'结果回流',items:scoped(d.callbacks).filter(r=>!['成功','无需回流'].includes(r.status)),route:'cloud-callbacks'},
      {name:'线路待处理',items:(d.lines||[]).filter(r=>(r.instanceIds||[]).includes(instance)&&r.status!=='启用'),route:'lines'}
    ];
    return RoleCharts.health(source)+'<details class="role-chart-details"><summary>查看异常明细</summary><article class="panel-card"><div class="panel-header"><h2>功能运行情况</h2>'+ui.help('当前客户/品牌范围内的本地记录；没有待处理记录不等于实时健康。任务下发耗时、队列积压与线路实时检测尚待接入。')+'</div>'+ui.table([{key:'name',label:'功能环节'},{key:'items',label:'待处理记录',render:items=>items.length?ui.status(items.length+' 项待处理'):'暂无已记录异常'},{key:'items',label:'影响范围',render:(items,r)=>r.name==='线路待处理'?'当前客户/品牌':([...new Set(items.map(i=>i.tenantId).filter(Boolean))].map(id=>esc(CloudCallRuntime.tenant(id)?.name||id)).join('、')||'—')},{key:'name',label:'实时检测',render:()=> '待接入'},{key:'route',label:'操作',render:(r,row)=>row.action?'<button class="btn-link" onclick="OperationsMonitor.open(\'tasks\')">定位异常任务</button>':link('查看与处理',r)}],source)+'</article></details>';
  }
  function load(){
    if(!valid()||!['SUPER_ADMIN','ADMIN'].includes(role()))return '';
    return RoleCharts.admin();
  }
  function business(){
    if(!valid())return ui.empty('请先选择有效工作范围');
    const calls=scoped(CloudCallData.calls),final=calls.filter(c=>c.endedAt&&c.result!=='待核对'),connected=final.filter(c=>c.answeredAt&&c.answeredAt!=='—'),done=connected.filter(c=>String(c.agentDisposition||'').trim());
    return RoleCharts.business()+'<details class="role-chart-details"><summary>查看业务汇总</summary><article class="panel-card"><div class="panel-header"><h2>业务成效</h2>'+ui.help('当前租户已加载记录，非全量或今日报表。接通率=有接通时间的已结束记录/已结束且非待核对记录；处理结果只统计已填写，不从文字推断客户意向。趋势与筛选请查看统计报表。')+'</div><div class="kpi-grid">'+ui.kpi('已结束通话',final.length,'当前已加载记录')+ui.kpi('已接通',connected.length,'含人工及自动语音')+ui.kpi('接通率',final.length?(connected.length/final.length*100).toFixed(1)+'%':'—','排除待核对记录')+ui.kpi('已填写处理结果',done.length,'已接通且有处理结果')+'</div><div class="panel-body">'+link('通话与处理结果','cloud-call-records')+' '+link('业务趋势与报表','cloud-overview-report')+' '+link('任务效果','cloud-outbound-report')+'</div></article></details>';
  }
  function home(){return '<section class="platform-page home-focus">'+ui.pageHeader(role()==='SUPER_ADMIN'?'平台健康工作台':'业务成效工作台','')+(role()==='SUPER_ADMIN'?health():business())+'</section>';}
  window.RoleFocus={health,load,business,home};
})();
