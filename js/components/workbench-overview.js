/** Role-scoped dashboard and read-only drilldowns, backed by existing records. */
(function(){
  const ui=PlatformUI,esc=ui.escape,d=CloudCallData,metrics=window.CloudReportMetrics;
  const sorted=(rows,fallback)=>ui.sortByUpdated?.(rows,fallback)||rows;
  const role=()=>AppState.effectiveAccess().roleCode,scope=()=>AppState.scoped;
  const day=v=>{const n=metrics.timestamp(v);return n!==null?new Date(n).toLocaleDateString('sv-SE'):'';};
  const today=()=>new Date().toLocaleDateString('sv-SE');
  const identity=c=>c.contactCenterIdentityId||c.agentIdentityId;
  const key=c=>c.customerTaskItemId||[c.taskId||'manual',c.callee].join('|');
  const callView=c=>CallState.view(c),connected=c=>callView(c).answered===true;
  const agentAnswered=c=>c.agentAnswerResult==='已接听'||metrics.timestamp(c.agentAnsweredAt)>0;
  function valid(){return AppState.effectiveAccess().valid&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER';}
  function seats(){return AppState.scoped(d.agents).filter(a=>a.lifecycleStatus!=='已删除');}
  function mine(){const context=AppState.get();return seats().find(a=>a.accountId===context.accountId&&a.tenantId===context.tenantId&&a.enterpriseId===context.enterpriseId);}
  function seatBlockReason(agent){
    if(!agent)return '当前账号尚未关联本租户坐席，请联系租户管理员';
    if(agent.lifecycleStatus!=='已启用')return '坐席未启用或已停用，暂时不能联系客户';
    if(agent.syncStatus!=='同步成功')return '坐席开通尚未完成，请联系管理员处理';
    if(agent.callEnabled===false||agent.acceptNewTasks===false)return '坐席已暂停接收新任务，暂时不能联系客户';
    return '';
  }
  function myCustomers(){
    const context=AppState.get();
    return (window.CustomerTasks?.mine()||[]).filter(row=>{const source=CustomerTasks.row(row.id);return source?.b.tenantId===context.tenantId&&source.b.enterpriseId===context.enterpriseId&&row.ownerId===context.accountId;});
  }
  function seatState(a){if(a.currentCall||a.agentStatus==='通话中')return '忙碌';if(a.agentStatus==='话后处理')return '话后处理';if(a.agentStatus==='空闲')return '空闲';return '未上线';}
  function model(personal=false){
    const agent=mine(),universe=AppState.scoped(d.calls),all=universe.filter(c=>!personal||(agent&&c.tenantId===agent.tenantId&&c.enterpriseId===agent.enterpriseId&&identity(c)===agent.contactCenterIdentityId));
    const calls=all.filter(c=>c.direction!=='呼入'&&day(metrics.callTime(c))===today()&&callView(c).ended);
    const receivingCalls=all.filter(c=>c.callSource==='NATIVE_WORKBENCH'&&(!personal||c.accountId===AppState.get().accountId)&&['inbound','predictive'].includes(c.workbenchKind)&&day(metrics.callTime(c))===today()&&callView(c).ended);
    const tasks=AppState.scoped(d.tasks).filter(t=>(!personal||calls.some(c=>c.taskId===t.taskId))&&(day(t.scheduleAt)===today()||day(t.startedAt)===today()||day(t.createdAt)===today()||calls.some(c=>c.taskId===t.taskId)));
    const pending=personal?(agent?myCustomers():[]):AppState.scoped(d.tasks).filter(t=>tasks.includes(t)&&!['已完成','已终止','草稿'].includes(t.status));
    const firstCalls=calls.filter(c=>metrics.attemptKind(c,universe)==='first'),answered=calls.filter(connected),unanswered=calls.filter(c=>callView(c).answered===false),unknown=calls.filter(c=>!callView(c).known),confirmed=calls.filter(c=>callView(c).known),firstConfirmed=firstCalls.filter(c=>callView(c).known),summary=metrics.stats(calls,universe);
    let manualPending=[];try{manualPending=AppState.scoped(JSON.parse(localStorage.getItem('customer-task-batches-v1')||'[]')).flatMap(b=>b.rows.filter(r=>r.method==='人工外呼'&&r.ownerId&&r.followup!=='已完成'&&!r.activeCallId).map(r=>({...r,batchName:b.name,batchUpdatedAt:b.updatedAt,batchCreatedAt:b.createdAt})));}catch(_){}
    return {calls,receivingCalls,agentAnsweredCalls:receivingCalls.filter(agentAnswered),tasks,pending,manualPending:personal?pending:manualPending,firstCalls,firstConfirmed,answered,unanswered,unknown,confirmed,seconds:summary.seconds,avgSeconds:summary.avgSeconds,durationSamples:summary.durationSamples,durationMissing:summary.durationMissing,stats:summary,seats:personal?(agent?[agent]:[]):seats(),calledCustomers:new Set(calls.map(key)).size,waiting:personal?pending.length:manualPending.length+pending.reduce((n,t)=>n+Math.max(0,Number(t.total||0)-Number(t.completed||0)),0)};
  }
  const pct=(a,b)=>b?(100*a/b).toFixed(1)+'%':'—';
  function open(section='',filter='',personal=false){if(!valid()||(personal&&!mine()))return;RouteRuntime.openSecondary(personal?'seat-workbench':'home',{dashboardSection:section,dashboardFilter:filter});}
  function card(label,value,section,filter='',personal=false){return '<button class="panel-card workbench-metric" onclick="WorkbenchOverview.open(\''+section+'\',\''+filter+'\','+personal+')"><span>'+esc(label)+'</span><strong class="workbench-metric-value">'+esc(value)+'</strong><small class="workbench-metric-link">查看明细 <span>›</span></small></button>';}
  function typeBadge(type){const tone={'预外呼':'predictive','IVR 外呼':'ivr','人工外呼':'manual','呼入':'inbound'}[type]||'other';return '<span class="workbench-type '+tone+'">'+esc(ui.callTypeLabel(type)||'类型未提供')+'</span>';}
  function block(title,body){return '<section class="workbench-domain-block" aria-label="'+esc(title)+'"><div class="workbench-domain-title"><h2>'+esc(title)+'</h2></div>'+body+'</section>';}
  function overviewPanel(title,body,section){return '<article class="panel-card"><div class="panel-header"><h2>'+esc(title)+'</h2><button class="btn-link" onclick="WorkbenchOverview.open(\''+section+'\')">查看全部 ›</button></div><div class="workbench-panel-content">'+body+'</div></article>';}
  const numberUsage=row=>[row.number,row.alictiNumber?.hotline].some(value=>String(value||'').startsWith('400'))?'仅呼入':row.usage||'—';
  const numberStatus=row=>row.businessStatus||row.status||'—';
  let superPeriod='今日';
  const superPeriods=['今日','近 7 日','本月'];
  function setSuperPeriod(value){
    if(!valid()||role()!=='SUPER_ADMIN'||!superPeriods.includes(value))return;
    superPeriod=value;navigateTo('home',{superPeriod:value});
  }
  function durationText(value){
    if(value===null||value===undefined||!Number.isFinite(value))return '—';
    const n=Math.round(value);return n<60?n+' 秒':Math.floor(n/60)+' 分 '+n%60+' 秒';
  }
  function integrationModel(){
    if(!valid()||role()!=='SUPER_ADMIN')return null;
    const enterpriseId=AppState.get().enterpriseId;
    // Management inventory includes stopped tenants and unassigned numbers.
    const tenants=(d.tenants||[]).filter(t=>t.enterpriseId===enterpriseId&&!t.builtIn&&(t.capabilitySet||[]).includes('CLOUD_CONTACT_CENTER'));
    const numbers=(d.phoneNumbers||[]).filter(n=>n.enterpriseId===enterpriseId);
    const assigned=n=>tenants.filter(t=>(n.authorizedTenantIds||[]).includes(t.tenantId));
    return {tenants,numbers,assigned};
  }
  function integrationSupplierStatus(n){
    const raw=n.alictiNumber;
    if(raw&&Object.hasOwn(raw,'status'))return raw.status===0||raw.status==='0'?'停用':raw.status===1||raw.status==='1'?'启用':'未提供';
    return n.businessStatus==='已隔离'?'停用':null;
  }
  function integrationNumberStatus(n){
    if(n.localEnabled===false)return '本地已停用';
    const supplier=integrationSupplierStatus(n);
    if(supplier==='停用')return 'AliCti 已停用';
    if(supplier==='未提供')return 'AliCti 状态未提供';
    return n.businessStatus==='已隔离'&&supplier==='启用'?'正常':n.businessStatus||n.status||'未提供';
  }
  function integrationOverview(){
    const inventory=integrationModel();if(!inventory)return '';
    const {tenants,numbers,assigned}=inventory;
    const count=(label,value)=>'<div><strong>'+value+'</strong><span>'+esc(label)+'</span></div>';
    const panel=(title,kind,stats,note)=>'<article class="panel-card super-integration-card"><div class="panel-header"><h2>'+title+'</h2><button class="btn-link" aria-label="查看'+title+'明细" onclick="WorkbenchOverview.integration(\''+kind+'\')">查看明细 ›</button></div><div class="super-integration-stats">'+stats+'</div><p>'+esc(note)+'</p></article>';

    return '<section class="super-integrations" aria-label="当前接入情况"><div class="super-integration-heading"><h2>当前接入情况</h2><span>当前账号 · 不随通话统计周期变化</span></div><div class="super-integration-grid">'+
      panel('接入租户','tenants',count('已开通云联络',tenants.length)+count('启用',tenants.filter(t=>t.status==='启用').length)+count('停用',tenants.filter(t=>t.status==='停用').length),'总部 '+tenants.filter(t=>t.organizationScope==='HEADQUARTERS').length+' 家 · 门店 '+tenants.filter(t=>t.organizationScope==='STORE').length+' 家')+
      panel('接入号码','numbers',count('已接入号码',numbers.length)+count('允许本地使用',numbers.filter(n=>n.localEnabled!==false).length),'本地已停用 '+numbers.filter(n=>n.localEnabled===false).length+' 个 · AliCti 已停用 '+numbers.filter(n=>integrationSupplierStatus(n)==='停用').length+' 个')+'</div></section>';
  }
  function integration(kind){
    const inventory=integrationModel();if(!inventory||!['tenants','numbers'].includes(kind))return;
    const {tenants,numbers,assigned}=inventory,isTenant=kind==='tenants';
    const columns=isTenant?[
      {key:'name',label:'租户名称'},
      {key:'organizationLabel',label:'租户类型'},
      {key:'status',label:'状态',render:value=>ui.status(value||'未提供')},
      {key:'tenantId',label:'已分配号码',render:id=>numbers.filter(n=>(n.authorizedTenantIds||[]).includes(id)).length+' 个'}
    ]:[
      {key:'number',label:'号码'},
      {key:'usage',label:'用途',render:(_,row)=>esc(numberUsage(row))},
      {key:'authorizedTenantIds',label:'使用租户',render:(_,row)=>esc(assigned(row).map(t=>t.name).join('、')||'未分配')},
      {key:'businessStatus',label:'使用状态',render:(_,row)=>ui.status(integrationNumberStatus(row))}
    ];
    const rows=sorted(isTenant?tenants:numbers),title=isTenant?'接入租户':'接入号码';
    ui.openLayer('dashboard-integration','<div class="layer-header"><div><h2>'+title+'</h2><p>当前账号 · 共 '+rows.length+(isTenant?' 家租户':' 个号码')+'</p></div><button type="button" aria-label="关闭" onclick="PlatformUI.closeLayer(\'dashboard-integration\')">×</button></div><div class="layer-body">'+(rows.length?ui.table(columns,rows):ui.empty(isTenant?'暂无已开通云联络的租户':'暂无接入号码'))+'</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'dashboard-integration\')">关闭</button></div>','large');
  }
  function superOverview(options={}){
    if(superPeriods.includes(options.superPeriod))superPeriod=options.superPeriod;
    const report=window.CloudReportData?.getModel('overview',{period:superPeriod});
    if(!report||report.error)return '<section class="platform-page home-focus workbench-page workbench-super">'+ui.pageHeader('呼叫数据概览','','')+ui.empty(report?.error||'呼叫数据暂时无法读取')+integrationOverview()+'</section>';
    const summary=report.summary,instance=d.instances.find(v=>v.enterpriseId===AppState.get().enterpriseId);
    const answerHelp='接听率 = 已确认接通 ÷（已确认接通 + 已确认未接通）。结果未知不计入分母。外呼按客户接听，呼入按系统或人工应答统计；不等于坐席人工接听率。';
    const durationHelp='沿用通话报表的双方通话口径：仅统计已接通且有有效时长的通话；0 秒有效，缺失时长不补零。纯自动外呼的客户接听时长在下方单独展示，不混入平均值。';
    const kpi=(label,value,note,help)=>'<article class="panel-card super-call-kpi"><div><span>'+esc(label)+'</span>'+ui.help(help,label+'统计口径')+'</div><strong>'+esc(value)+'</strong><p>'+esc(note)+'</p></article>';
    const groupRows=report.businessGroups||[];
    const distribution=groupRows.length?'<ul class="super-business-shares">'+groupRows.map((group,index)=>'<li><div><span><i class="super-business-dot tone-'+index%5+'" aria-hidden="true"></i>'+esc(group.label)+'</span><strong>'+pct(group.total,summary.total)+'</strong></div><div class="super-business-bar"><progress class="workbench-progress tone-'+index%5+'" aria-label="'+esc(group.label)+'呼叫占比" max="'+Math.max(1,summary.total)+'" value="'+group.total+'"></progress><span>'+group.total+' 次</span></div></li>').join('')+'</ul>':ui.empty('当前周期暂无业务占比');
    const typeRows=report.rows.map(row=>({...row,average:row.type==='IVR 外呼'?row.customerAvgSeconds:row.avgSeconds}));
    const typeTable=ui.table([
      {key:'type',label:'呼叫方式',render:typeBadge},
      {key:'total',label:'呼叫量'},
      {key:'rate',label:'接听率',help:answerHelp},
      {key:'average',label:'平均时长',help:'人工外呼、预外呼和呼入为双方通话时长；自动外呼为客户接听时长。仅使用已接通且时长有效的样本。',render:(value,row)=>esc(durationText(value))+(row.type==='IVR 外呼'?'<small class="super-duration-note">客户接听</small>':'')}
    ],typeRows);
    return '<section class="platform-page home-focus workbench-page workbench-super">'+ui.pageHeader('呼叫数据概览','', '')+
      '<div class="super-call-toolbar"><div><strong>'+esc(instance?.name||'当前 AliCti 账号')+'</strong><span>当前账号租户 · '+esc(report.filters.startDate)+(report.filters.endDate!==report.filters.startDate?' 至 '+esc(report.filters.endDate):'')+'</span></div><div class="super-period-controls" role="group" aria-label="统计周期">'+superPeriods.map(period=>'<button class="btn '+(superPeriod===period?'btn-primary':'')+'" aria-pressed="'+(superPeriod===period)+'" onclick="WorkbenchOverview.setSuperPeriod(\''+period+'\')">'+period+'</button>').join('')+'<button class="btn" onclick="WorkbenchOverview.setSuperPeriod(\''+superPeriod+'\')">刷新</button></div></div>'+
      '<div class="super-call-kpis">'+kpi('呼叫总量',summary.total+' 次','按所选日期已结束通话统计','包含人工外呼、预外呼、自动外呼和呼入。每次重呼分别计数，同一通话的重复话单只计一次；按通话开始日期归属，不按客户或任务名单数统计。')+
      kpi('接听率',summary.rate,'已接听 '+summary.connected+' 次 / 已确认 '+summary.known+' 次',answerHelp)+
      kpi('平均通话时长',durationText(summary.avgSeconds),'双方通话 · '+summary.durationSamples+' 条有效时长',durationHelp)+'</div>'+
      '<div class="super-call-panels"><article class="panel-card"><div class="panel-header"><div><h2>业务占比</h2><p>按业务分类的呼叫量统计</p></div>'+ui.help('读取当前租户维护的业务分类，按通话及关联客户名单确定归属；缺少分类归入未分类。占比 = 该业务呼叫量 ÷ 当前周期呼叫总量。','业务占比统计口径')+'</div><div class="super-business-body">'+distribution+'</div></article>'+
      '<article class="panel-card"><div class="panel-header"><div><h2>呼叫方式统计</h2><p>四类通话的呼叫量与接听情况</p></div></div><div class="super-type-table">'+typeTable+'</div></article></div>'+integrationOverview()+'</section>';
  }
  function tenantContext(m){
    const tenant=d.tenants.find(t=>t.tenantId===AppState.get().tenantId),states=[...new Set(m.tasks.map(t=>t.status))];
    return '<div class="workbench-summary"><b>'+esc(tenant?.name||'当前租户')+'</b><span>仅当前租户范围</span><span>任务状态：'+(states.map(s=>esc(s)+' '+m.tasks.filter(t=>t.status===s).length).join(' · ')||'今日暂无任务')+'</span></div>';
  }
  function seatPreview(m){
    const ordered=sorted(m.seats,['statusUpdatedAt','lastSyncAt']);
    return overviewPanel(role()==='ADMIN'?'坐席负荷与当前通话':'坐席负荷',ui.table([{key:'userName',label:'坐席'},{key:'agentStatus',label:'当前状态',render:(_,a)=>ui.status(seatState(a))},{key:'agentRecordId',label:'操作',render:id=>'<button class="btn-link" onclick="WorkbenchOverview.agent(\''+esc(id)+'\')">'+(role()==='ADMIN'?'查看与管理':'查看')+'</button>'}],ordered.slice(0,6)),'seats');
  }
  function taskInfo(t){return typeBadge(t.callType)+' '+ui.status(t.status)+(t.displayOnly?' <span class="workbench-demo-tag">展示样例</span>':'');}
  function charts(m){
    const sum=m.tasks.reduce((n,t)=>n+Number(t.total||0),0);
    const progress=sorted(m.tasks,['startedAt']).map(t=>'<button class="workbench-chart-row workbench-chart-action workbench-task-item" onclick="WorkbenchOverview.task(\''+esc(t.taskId)+'\')"><span class="workbench-task-heading"><strong>'+esc(t.name)+'</strong><span class="workbench-task-link">查看任务 ›</span></span><span class="workbench-task-tags">'+taskInfo(t)+'</span><span class="workbench-task-counts"><span>已呼叫 <b>'+(t.completed||0)+'</b> / '+(t.total||0)+' 位</span><span>剩余 '+Math.max(0,Number(t.total||0)-Number(t.completed||0))+' 位 · '+pct(t.completed||0,t.total||0)+'</span></span><progress class="workbench-progress" aria-label="'+esc(t.name)+'呼叫进度" max="'+Math.max(1,t.total||0)+'" value="'+(t.completed||0)+'"></progress></button>').join('');
    const groups=[...new Set(m.tasks.map(t=>t.callType||'类型未提供'))].map(type=>({type,tasks:m.tasks.filter(t=>(t.callType||'类型未提供')===type)}));
    const share=groups.map(g=>{const count=g.tasks.reduce((n,t)=>n+Number(t.total||0),0);return '<div class="workbench-chart-row workbench-task-item"><span class="workbench-task-heading">'+typeBadge(g.type)+'<b>'+pct(count,sum)+'</b></span><span class="workbench-task-tags">'+g.tasks.length+' 个任务 · '+count+' 位任务客户</span><progress class="workbench-progress" aria-label="'+esc(g.type)+'名单分布" max="'+Math.max(1,sum)+'" value="'+count+'"></progress></div>';}).join('');
    return '<div class="content-grid"><article class="panel-card span-6"><div class="panel-header"><h2>今日任务进度</h2>'+ui.help('展示当前范围今日任务的呼叫类型、执行状态、已呼叫与剩余人数。已呼叫不等于接通或跟进完成；展示样例不可启动。')+'</div><div class="panel-body">'+(progress||ui.empty('今日暂无任务'))+'</div></article><article class="panel-card span-6"><div class="panel-header"><h2>外呼方式分布</h2>'+ui.help('按外呼方式汇总今日任务的名单量，占今日任务总名单量的比例；不表示执行进度。人工待联络批次不纳入本图，同一客户在不同任务中分别计入。')+'</div><div class="panel-body">'+'<p class="workbench-chart-caption">按今日任务名单量汇总 · 不代表完成进度</p>'+(share||ui.empty('暂无占比数据'))+'</div></article></div>';
  }
  function personnel(m){const count=s=>m.seats.filter(a=>seatState(a)===s).length;return '<article><div class="panel-header"><h2>当前坐席</h2>'+ui.help('上线=空闲+忙碌+话后处理；未上线包含离线或未取得上线状态。总数不含已删除坐席。当前为原型状态，不代表真实在线监测。')+'</div><div class="kpi-grid">'+card('坐席总数',m.seats.length,'seats')+card('上线数',m.seats.length-count('未上线'),'seats','上线')+card('空闲',count('空闲'),'seats','空闲')+card('忙碌',count('忙碌'),'seats','忙碌')+card('话后处理',count('话后处理'),'seats','话后处理')+card('未上线',count('未上线'),'seats','未上线')+'</div></article>';}
  function customers(rows,options={}){
    const context=AppState.get(),scopeKey=JSON.stringify([context.accountId,context.tenantId,context.enterpriseId]);
    const ordered=window.CustomerTasks?.sortRowsForDisplay?CustomerTasks.sortRowsForDisplay(rows):sorted(rows,['batchUpdatedAt','batchCreatedAt']);
    const size=10,pages=Math.max(1,Math.ceil(ordered.length/size));
    const page=options.pendingScope===scopeKey?Math.min(pages,Math.max(1,Math.floor(Number(options.pendingPage)||1))):1;
    options.pendingScope=scopeKey;options.pendingPage=page;
    const reason=seatBlockReason(mine());return ui.table([{key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'batchName',label:'所属批次'},{key:'method',label:'外呼方式',render:v=>typeBadge(v||'人工外呼')},{key:'followup',label:'跟进状态',render:v=>ui.status(v)},{key:'id',label:'操作',render:(id,row)=>{const blocked=reason||(!window.CustomerTasks?.canCall(row)?'当前客户不属于本人可联系名单':'');return blocked?'<button class="btn-link" disabled>联系客户</button>'+ui.help(blocked,'查看不能联系的原因'):'<button class="btn-link" onclick="CustomerTasks.pick(\''+esc(id)+'\')">联系客户</button>';}}],ordered.slice((page-1)*size,page*size),{rowOffset:(page-1)*size,emptyText:'暂无待联络客户',footer:ui.pagination(ordered.length,page,size,'AgentWorkbench.setPendingPage')});}
  function personal(m,options={}){
    const work='<div class="kpi-grid">'+card('待联络客户',m.waiting,'customers','',true)+card('已外呼客户',m.calledCustomers,'calls','',true)+'</div>';
    const receiving='<div class="panel-header"><h3>今日接收来电</h3>'+ui.help('统计本人今日已结束的呼入和预外呼分配。坐席已接听以坐席接听结果或接听时间为准；客户接通系统不代表坐席接听。待联络客户仍为人工分配名单。')+'</div><div class="kpi-grid">'+card('呼入来电',m.receivingCalls.filter(c=>c.workbenchKind==='inbound').length,'receiving','inbound',true)+card('预外呼分配',m.receivingCalls.filter(c=>c.workbenchKind==='predictive').length,'receiving','predictive',true)+card('坐席已接听',m.agentAnsweredCalls.length,'receiving','answered',true)+'</div>';
    const pending='<article class="panel-card"><div class="panel-header"><h2>待联络客户</h2>'+ui.help('仅本人已分配且未完成跟进的客户，含历史待办；点击联系客户确认号码后直接拨号，通话中填写沟通记录。')+'</div>'+customers(m.pending,options)+'</article>';
    const results='<div class="panel-header"><h3>接通情况</h3>'+ui.help('呼叫次数包含今日已结束但结果待确认的通话；待确认不计入未接通或接通率分母。首呼接通率同样只使用结果明确且有首呼依据的记录。')+'</div><div class="kpi-grid">'+card('呼叫次数',m.calls.length,'calls','',true)+card('接通次数',m.answered.length,'calls','接通',true)+card('未接通次数',m.unanswered.length,'calls','未接通',true)+card('接通率',m.stats.rate,'calls','',true)+card('结果待确认',m.unknown.length,'calls','待确认',true)+'</div><div class="workbench-result-grid"><article class="panel-card"><div class="panel-header"><h3>首次呼叫</h3></div><div class="kpi-grid">'+card('首呼次数',m.firstCalls.length,'calls','首呼',true)+card('首呼接通率',m.stats.firstRate,'calls','首呼',true)+'</div></article><article class="panel-card"><div class="panel-header"><h3>通话时长</h3>'+ui.help('仅累计已接通且已记录有效时长的通话；平均时长=有效通话总时长÷有效时长样本数。0 秒为有效样本，缺失时长不补零。')+'</div><div class="kpi-grid">'+card('通话总时长（秒）',m.seconds??'—','calls','接通',true)+card('平均通话时长（秒）',m.avgSeconds!==null?Math.round(m.avgSeconds):'—','calls','接通',true)+'</div></article></div>';
    return '<div class="workbench-summary"><b>我的客户与通话</b><span>仅本人范围 · 待联络为当前待办，其余为今日数据</span></div><div class="seat-personal-columns">'+block('客户联络',pending)+block('通话成效',receiving+work+results)+'</div>';
  }
  function task(id){const t=AppState.scoped(d.tasks).find(t=>t.taskId===id);if(!t)return;if(role()==='OPERATOR'){ui.openLayer('dashboard-task','<div class="layer-header"><h2>'+esc(t.name)+'</h2><button onclick="PlatformUI.closeLayer(\'dashboard-task\')">×</button></div><div class="layer-body"><div class="workbench-task-tags">'+taskInfo(t)+'</div><p>已呼叫 '+(t.completed||0)+' / '+(t.total||0)+' 位客户</p>'+callTable(AppState.scoped(d.calls).filter(c=>c.taskId===id))+'</div>','large');}else CloudTaskWorkspace.openTask(id);}
  function callTable(calls,receiving=false){return ui.table([{key:'callee',label:'客户号码',render:(_,c)=>esc(c.direction==='呼入'?c.caller:c.callee)},{key:'callType',label:'呼叫类型',render:typeBadge},{key:'agentName',label:'坐席'},{key:'result',label:receiving?'坐席接听结果':'通话结果',render:(_,c)=>esc(receiving?(agentAnswered(c)?'已接听':c.agentAnswerResult||'待确认'):callView(c).answerLabel)},...(!receiving?[{key:'result',label:'未接通原因',render:(_,c)=>esc(callView(c).reasonLabel)}]:[]),{key:'durationSeconds',label:'时长（秒）'},{key:'callId',label:'操作',render:id=>'<button class="btn-link" onclick="Pages[\'cloud-call-records\'].openCall(\''+esc(id)+'\')">查看通话</button>'}],sorted(calls,c=>metrics.callTime(c)));}
  function drill(section,filter,personalScope,m,options={}){
    if(section==='customers')return personalScope?customers(m.pending,options):'<h3>自动外呼任务</h3>'+taskTable(m.tasks.filter(t=>!['已完成','已终止','草稿'].includes(t.status)))+'<h3>人工待联络客户</h3>'+ui.table([{key:'name',label:'客户'},{key:'phone',label:'号码'},{key:'batchName',label:'批次'},{key:'followup',label:'跟进状态'}],(window.CustomerTasks?.sortRowsForDisplay?CustomerTasks.sortRowsForDisplay(m.manualPending):sorted(m.manualPending)));
    if(section==='tasks')return taskTable(m.tasks);
    if(section==='receiving')return personalScope?callTable(m.receivingCalls.filter(c=>filter==='answered'?agentAnswered(c):['inbound','predictive'].includes(filter)?c.workbenchKind===filter:true),true):ui.empty('此明细不属于当前工作台');
    if(section==='calls')return callTable(m.calls.filter(c=>filter==='接通'?connected(c):filter==='未接通'?callView(c).answered===false:filter==='待确认'?!callView(c).known:filter==='首呼'?m.firstCalls.includes(c):true));
    if(section==='seats')return ui.table([{key:'userName',label:'坐席'},{key:'agentStatus',label:'当前状态',render:(_,a)=>seatState(a)},{key:'currentCall',label:'当前通话',render:v=>v?'通话中':'—'},{key:'agentRecordId',label:'操作',render:id=>'<button class="btn-link" onclick="WorkbenchOverview.agent(\''+esc(id)+'\')">'+(role()==='ADMIN'?'查看与管理':'查看')+'</button>'}],sorted(m.seats.filter(a=>!filter||(filter==='上线'?seatState(a)!=='未上线':seatState(a)===filter)),['statusUpdatedAt','lastSyncAt']));
    if(role()!=='SUPER_ADMIN')return ui.empty('没有访问权限');
    const instance=AppState.get().enterpriseId,tenants=d.tenants.filter(t=>t.enterpriseId===instance);
    if(section==='numbers'||section==='lines')return '<button class="btn" onclick="RouteRuntime.openSecondary(\'numbers\')">进入号码管理</button>'+ui.table([{key:'number',label:'号码'},{key:'usage',label:'用途',render:(_,row)=>esc(numberUsage(row))},{key:'businessStatus',label:'状态',render:(_,row)=>ui.status(numberStatus(row))},{key:'authorizedTenantIds',label:'可用租户',render:ids=>(ids||[]).map(id=>esc(tenants.find(t=>t.tenantId===id)?.name||id)).join('、')||'未分配'}],sorted((d.phoneNumbers||[]).filter(n=>n.enterpriseId===instance)));
    if(section==='tenants')return ui.table([{key:'name',label:'租户'},{key:'status',label:'状态'},{key:'tenantId',label:'账号数',render:id=>'<button class="btn-link" onclick="WorkbenchOverview.open(\'accounts\',\''+esc(id)+'\')">'+d.memberships.filter(m=>m.tenantId===id).length+' · 查看账号</button>'}],sorted(tenants));
    if(section==='accounts'){if(!tenants.some(t=>t.tenantId===filter))return ui.empty('没有访问权限');const members=d.memberships.filter(m=>m.tenantId===filter).map(m=>({...m,name:d.accounts.find(a=>a.accountId===m.accountId)?.name||m.accountId}));return ui.table([{key:'name',label:'账号'},{key:'roleCode',label:'租户内角色'},{key:'status',label:'成员状态'}],sorted(members));}
    return ui.empty('暂无明细');
  }
  function taskTable(rows){return ui.table([{key:'name',label:'任务'},{key:'callType',label:'呼叫类型',render:typeBadge},{key:'status',label:'任务状态',render:v=>ui.status(v)},{key:'completed',label:'已呼叫',help:'任务已完成呼叫的客户数，不等于接通或跟进完成。'},{key:'total',label:'客户数'},{key:'taskId',label:'操作',render:id=>'<button class="btn-link" onclick="WorkbenchOverview.task(\''+esc(id)+'\')">查看任务</button>'}],sorted(rows,['startedAt']));}
  function render(options={}){
    if(!valid())return ui.empty('请选择有效业务范围');
    const section=['exceptions','data'].includes(options.dashboardSection)?'':options.dashboardSection||'';
    if(role()==='SUPER_ADMIN'&&!section)return superOverview(options);
    const m=model(false);
    const title=role()==='SUPER_ADMIN'?'供应商账号管理工作台':role()==='ADMIN'?'租户管理工作台':'租户运营工作台';
    let html=ui.pageHeader(title,'','');
    if(section)html+='<article class="panel-card"><div class="panel-header"><h2>'+esc(({tasks:'今日任务',calls:'今日通话',customers:'待呼叫明细',seats:'坐席明细',numbers:'账号内号码',lines:'账号内号码',tenants:'租户与账号'})[section]||'明细')+' '+esc(options.dashboardFilter||'')+'</h2></div>'+drill(section,options.dashboardFilter||'',false,m)+'</article>';
    else html+=tenantContext(m)+(window.TenantCallMonitor?.eligible()?'<section class="panel-card tenant-monitor-entry"><div><strong>班长监控</strong><span>在坐席工作台查看本租户外呼情况与坐席状态</span></div><button class="btn" onclick="AgentWorkbench.setWorkspaceTab(\'monitor\')">进入班长监控</button></section>':'')+'<section class="workbench-domain-block" aria-label="任务与呼叫"><div class="workbench-domain-title"><h2>任务与呼叫</h2></div><div class="panel-header"><h3>今日概览</h3>'+ui.help('今日任务按计划、创建、启动或通话发生日期识别；待呼叫为任务未完成客户数，已呼叫为今日按任务/批次客户去重人数。今日通话包含已结束但结果待确认的记录；待确认不计入未接通或接通率分母。')+'</div><div class="kpi-grid">'+card('今日任务',m.tasks.length,'tasks')+card('今日待呼叫客户',m.waiting,'customers')+card('今日已呼叫客户',m.calledCustomers,'calls')+card('今日呼叫次数',m.calls.length,'calls')+card('结果待确认',m.unknown.length,'calls','待确认')+'</div>'+charts(m)+'</section>'+(role()==='ADMIN'?'':'<section class="workbench-domain-block" aria-label="坐席与通话"><div class="workbench-domain-title"><h2>坐席与通话</h2></div>'+personnel(m)+seatPreview(m)+'</section>');
    return '<section class="platform-page home-focus workbench-page '+(role()==='SUPER_ADMIN'?'workbench-super':'')+'">'+html+'</section>';
  }
  function renderSeat(options={}){
    if(!valid())return ui.empty('请选择有效业务范围');
    const agent=mine();if(!agent)return ui.empty('当前账号尚未关联本租户坐席，请联系租户管理员');
    const m=model(true),section=options.dashboardSection||'',filter=options.dashboardFilter||'';
    if(!section)return personal(m,options);
    const back='';
    const titles={customers:'本人待联络客户',calls:'本人今日外呼',receiving:'本人今日接收来电'},filterLabel=section==='receiving'?({inbound:'呼入来电',predictive:'预外呼分配',answered:'已接听'})[filter]||'':filter;
    return '<article class="panel-card"><div class="panel-header"><h2>'+esc(titles[section]||'个人明细')+' '+esc(filterLabel)+'</h2>'+back+'</div>'+(titles[section]?drill(section,filter,true,m,options):ui.empty('此明细不属于坐席工作台'))+'</article>';
  }
  function seatCallTime(c){return metrics.callTime(c)??0;}
  function seatDuration(c){const n=metrics.recordedSeconds(c);if(n===null)return '—';const total=Math.floor(n);return String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');}
  function seatCurrentCall(a,calls){
    const live=calls.filter(c=>!callView(c).ended&&!c.endedAt&&['DIALING','RINGING','ANSWERED'].includes(callView(c).stage));
    const busy=seatState(a)==='忙碌',c=busy&&live.length===1?live[0]:null;
    if(c)return '<div class="seat-inspect-current has-call"><span class="seat-inspect-call-icon" aria-hidden="true">☎</span><div class="seat-inspect-current-main"><strong>'+esc(c.direction==='呼入'?c.caller:c.callee)+'</strong><div>'+typeBadge(c.callType)+'<span>'+esc(callView(c).stageLabel)+'</span></div></div><div class="seat-inspect-call-start"><span>开始时间</span><strong>'+esc(c.ringingAt||c.answeredAt||'未提供')+'</strong></div></div>';
    const uncertain=busy||live.length>0;
    const title=busy?'通话进行中，明细待更新':uncertain?'通话状态待核对':a.agentStatus==='话后处理'?'正在进行话后处理':'暂无进行中的通话';
    const note=uncertain?'暂未取得可确认的当前通话明细，请勿将下方历史记录作为当前通话。':a.agentStatus==='话后处理'?'坐席正在整理上一通电话的处理结果。':'此处仅展示当前通话，历史联系记录见下方。';
    return '<div class="seat-inspect-current '+(uncertain?'is-pending':'is-empty')+'"><span class="seat-inspect-call-icon" aria-hidden="true">☎</span><div class="seat-inspect-current-main"><strong>'+title+'</strong><p>'+note+'</p></div></div>';
  }
  function seatRecentCalls(a,calls,page){
    const recent=sorted(calls.filter(c=>callView(c).ended),seatCallTime);
    const totalPages=Math.max(1,Math.ceil(recent.length/5)),current=Math.min(totalPages,Math.max(1,Math.floor(Number(page)||1)));
    const table=recent.length?ui.table([
      {key:'ringingAt',label:'开始时间',render:(_,c)=>'<span class="seat-inspect-time">'+esc(c.ringingAt||c.answeredAt||c.endedAt||'未提供')+'</span>'},
      {key:'callee',label:'客户号码',render:(_,c)=>esc(c.direction==='呼入'?c.caller:c.callee||'—')},
      {key:'callType',label:'呼叫类型',render:typeBadge},
      {key:'result',label:'通话结果',render:(_,c)=>ui.status(callView(c).answerLabel)+(callView(c).answered===false&&callView(c).reasonLabel!=='—'?'<small class="seat-inspect-reason">'+esc(callView(c).reasonLabel)+'</small>':'')},
      {key:'durationSeconds',label:'通话时长',render:(_,c)=>seatDuration(c)},
      {key:'callId',label:'操作',render:callId=>'<button class="btn-link" onclick="WorkbenchOverview.inspectCall(\''+esc(a.agentRecordId)+'\',\''+esc(callId)+'\')">查看通话</button>'}
    ],recent.slice((current-1)*5,current*5),{rowOffset:(current-1)*5}):'<div class="seat-inspect-no-records">暂无已结束的通话记录</div>';
    const paging=totalPages>1?'<div class="seat-inspect-pagination"><span>第 '+current+' / '+totalPages+' 页</span><button class="btn" aria-label="上一页" '+(current===1?'disabled':'')+' onclick="WorkbenchOverview.agent(\''+esc(a.agentRecordId)+'\','+(current-1)+')">‹</button><button class="btn" aria-label="下一页" '+(current===totalPages?'disabled':'')+' onclick="WorkbenchOverview.agent(\''+esc(a.agentRecordId)+'\','+(current+1)+')">›</button></div>':'';
    return '<section class="seat-inspect-section" aria-label="最近通话"><div class="seat-inspect-section-heading"><h3>最近通话 <span>'+recent.length+' 条</span></h3>'+ui.help('按更新时间倒序显示当前已加载的已结束通话，缺少更新时间时按通话时间，每页5条；不是实时通话，也不代表完整历史。','最近通话说明')+'</div>'+table+paging+'</section>';
  }
  function inspectAgent(id,page=1){
    if(!valid())return;const a=seats().find(x=>x.agentRecordId===id);if(!a)return;
    const manager=['ADMIN','SUPER_ADMIN'].includes(role()),state=seatState(a),canStop=manager&&a.lifecycleStatus==='已启用';
    const calls=AppState.scoped(d.calls).filter(c=>c.tenantId===a.tenantId&&c.enterpriseId===a.enterpriseId&&identity(c)===a.contactCenterIdentityId);
    const member=d.memberships.find(m=>m.accountId===a.accountId&&m.tenantId===a.tenantId),account=member&&d.accounts.find(v=>v.accountId===a.accountId);
    const skills=d.agentSkills.filter(r=>r.identityId===a.contactCenterIdentityId&&r.status==='已生效').map(r=>d.physicalSkillGroups.find(g=>g.physicalGroupId===r.physicalGroupId&&g.tenantId===a.tenantId&&g.enterpriseId===a.enterpriseId&&g.status==='已启用')).filter(Boolean);
    const accepting=a.lifecycleStatus==='已启用'&&a.acceptNewTasks!==false&&a.callEnabled!==false;
    const metadata='<dl class="seat-inspect-meta"><div><dt>所属租户</dt><dd>'+esc(d.tenants.find(t=>t.tenantId===a.tenantId&&t.enterpriseId===a.enterpriseId)?.name||'未提供')+'</dd></div><div><dt>关联账号</dt><dd>'+esc(account?(account.nickname||account.name||account.loginUsername):'未关联')+'</dd></div><div class="seat-inspect-skills"><dt>服务技能</dt><dd>'+([...new Set(skills.map(g=>g.name))].map(name=>'<span>'+esc(name)+'</span>').join('')||'暂未配置有效技能')+'</dd></div></dl>';
    const stop=manager?'<div class="seat-inspect-management"><button class="btn btn-danger seat-inspect-disable" '+(!canStop?'disabled':'')+' onclick="WorkbenchOverview.stopNew(\''+esc(id)+'\')">'+(a.lifecycleStatus==='停用中'?'停用中':a.lifecycleStatus==='已停用'?'已停用':'停用坐席')+'</button>'+ui.help('停用坐席后停止接收新任务，当前通话允许完成；不执行强制挂断、监听或强插。点击后需再次确认。','停用坐席说明')+'</div>':'';
    ui.openLayer('dashboard-agent','<div class="layer-header"><div><h2 id="seat-inspect-title">坐席详情</h2><p>查看坐席状态与联系记录</p></div><button type="button" aria-label="关闭坐席详情" onclick="PlatformUI.closeLayer(\'dashboard-agent\')">×</button></div><div class="layer-body seat-inspect-body"><section class="seat-inspect-summary" aria-label="坐席信息"><div class="seat-inspect-identity"><span class="seat-inspect-avatar" aria-hidden="true">'+esc((a.userName||'坐席').slice(0,1))+'</span><div><div class="seat-inspect-name"><h3>'+esc(a.userName||'未命名坐席')+'</h3><span class="seat-inspect-status '+(state==='忙碌'?'busy':state==='空闲'?'idle':'neutral')+'">'+esc(state)+'</span></div><p>'+esc(a.lifecycleStatus||'启用状态未提供')+' · '+(accepting?'允许接收新任务':'已停止接收新任务')+'</p></div></div>'+metadata+'</section><section class="seat-inspect-section" aria-label="当前通话"><div class="seat-inspect-section-heading"><h3>当前通话</h3>'+ui.help('展示已取得的坐席状态和通话明细；数据尚未接入时不补造客户号码、时长或通话结果。当前原型不代表真实在线监测。','当前通话说明')+'</div>'+seatCurrentCall(a,calls)+'</section>'+seatRecentCalls(a,calls,page)+'</div><div class="layer-footer seat-inspect-footer">'+stop+'<button class="btn btn-primary" onclick="PlatformUI.closeLayer(\'dashboard-agent\')">关闭</button></div>','small seat-inspect-panel');
    const panel=document.getElementById('dashboard-agent')?.querySelector('.layer-panel');if(panel){panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','seat-inspect-title');}
  }
  function inspectCall(agentId,callId){if(!valid())return;const a=seats().find(x=>x.agentRecordId===agentId);if(!a)return;const c=AppState.scoped(d.calls).find(c=>c.callId===callId&&c.tenantId===a.tenantId&&c.enterpriseId===a.enterpriseId&&identity(c)===a.contactCenterIdentityId&&callView(c).ended);if(c)Pages['cloud-call-records'].openCall(c.callId);}
  function stopNew(id){if(!valid()||!['ADMIN','SUPER_ADMIN'].includes(role()))return;const a=seats().find(x=>x.agentRecordId===id);if(!a||a.lifecycleStatus!=='已启用')return;ui.closeLayer('dashboard-agent');Pages['agent-center'].disable(a.contactCenterIdentityId);}
  window.WorkbenchOverview={render,renderSeat,open,model,setSuperPeriod,integration,seatState,task,agent:inspectAgent,inspectCall,stopNew};
})();
