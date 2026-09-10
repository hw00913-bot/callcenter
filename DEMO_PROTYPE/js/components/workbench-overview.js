/** Role-scoped dashboard and read-only drilldowns, backed by existing records. */
(function(){
  const ui=PlatformUI,esc=ui.escape,d=CloudCallData;
  const role=()=>AppState.effectiveAccess().roleCode,scope=()=>AppState.scoped;
  const day=v=>{const n=Date.parse(v);return Number.isFinite(n)?new Date(n).toLocaleDateString('sv-SE'):'';};
  const today=()=>new Date().toLocaleDateString('sv-SE');
  const identity=c=>c.contactCenterIdentityId||c.agentIdentityId;
  const key=c=>c.customerTaskItemId||[c.taskId||'manual',c.callee].join('|');
  const connected=c=>!!c.answeredAt&&c.answeredAt!=='—';
  function valid(){return AppState.effectiveAccess().valid&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER';}
  function seats(){return AppState.scoped(d.agents).filter(a=>a.lifecycleStatus!=='已删除');}
  function mine(){const context=AppState.get();return seats().find(a=>a.accountId===context.accountId&&a.tenantId===context.tenantId&&a.instanceId===context.instanceId);}
  function seatBlockReason(agent){
    if(!agent)return '当前账号尚未关联本租户坐席，请联系租户管理员';
    if(agent.lifecycleStatus!=='已启用')return '坐席未启用或已停用，暂时不能联系客户';
    if(agent.syncStatus!=='同步成功')return '坐席开通尚未完成，请联系管理员处理';
    if(!agent.phonebarPermission||agent.acceptNewTasks===false)return '坐席已暂停接收新任务，暂时不能联系客户';
    return '';
  }
  function myCustomers(){
    const context=AppState.get();
    return (window.CustomerTasks?.mine()||[]).filter(row=>{const source=CustomerTasks.row(row.id);return source?.b.tenantId===context.tenantId&&source.b.instanceId===context.instanceId&&row.ownerId===context.accountId;});
  }
  function seatState(a){if(a.currentCall||a.agentStatus==='通话中')return '忙碌';if(a.agentStatus==='话后处理')return '话后处理';if(a.agentStatus==='空闲')return '空闲';return '未上线';}
  function model(personal=false){
    const agent=mine(),all=AppState.scoped(d.calls).filter(c=>!personal||(agent&&c.tenantId===agent.tenantId&&c.instanceId===agent.instanceId&&identity(c)===agent.contactCenterIdentityId&&c.direction!=='呼入'));
    const calls=all.filter(c=>c.direction!=='呼入'&&day(c.ringingAt||c.endedAt)===today()&&c.endedAt&&c.result!=='待核对');
    const tasks=AppState.scoped(d.tasks).filter(t=>(!personal||calls.some(c=>c.taskId===t.taskId))&&(day(t.scheduleAt)===today()||day(t.startedAt)===today()||day(t.createdAt)===today()||calls.some(c=>c.taskId===t.taskId)));
    const pending=personal?(agent?myCustomers():[]):AppState.scoped(d.tasks).filter(t=>tasks.includes(t)&&!['已完成','已终止','草稿'].includes(t.status));
    const first=c=>c.attemptNumber!=null?c.attemptNumber===1:!!(c.customerTaskItemId&&!all.some(a=>a.callId!==c.callId&&key(a)===key(c)&&Date.parse(a.ringingAt||a.endedAt)<Date.parse(c.ringingAt||c.endedAt)));
    const firstCalls=calls.filter(first),answered=calls.filter(connected),seconds=answered.reduce((n,c)=>n+Number(c.durationSeconds||0),0);
    let manualPending=[];try{manualPending=AppState.scoped(JSON.parse(localStorage.getItem('customer-task-batches-v1')||'[]')).flatMap(b=>b.rows.filter(r=>r.method==='人工外呼'&&r.ownerId&&r.followup!=='已完成'&&!r.activeCallId).map(r=>({...r,batchName:b.name})));}catch(_){}
    return {calls,tasks,pending,manualPending:personal?pending:manualPending,firstCalls,answered,seconds,seats:personal?(agent?[agent]:[]):seats(),calledCustomers:new Set(calls.map(key)).size,waiting:personal?pending.length:manualPending.length+pending.reduce((n,t)=>n+Math.max(0,Number(t.total||0)-Number(t.completed||0)),0)};
  }
  const pct=(a,b)=>b?(100*a/b).toFixed(1)+'%':'—';
  function open(section='',filter='',personal=false){if(valid()&&(!personal||mine()))navigateTo(personal?'seat-workbench':'home',{dashboardSection:section,dashboardFilter:filter});}
  function card(label,value,section,filter='',personal=false){return '<button class="panel-card workbench-metric" onclick="WorkbenchOverview.open(\''+section+'\',\''+filter+'\','+personal+')"><span>'+esc(label)+'</span><strong class="workbench-metric-value">'+esc(value)+'</strong><small class="workbench-metric-link">查看明细 <span>›</span></small></button>';}
  function typeBadge(type){const tone={'预外呼':'predictive','IVR 外呼':'ivr','人工外呼':'manual','呼入':'inbound'}[type]||'other';return '<span class="workbench-type '+tone+'">'+esc(type||'类型未提供')+'</span>';}
  function block(title,body){return '<section class="workbench-domain-block" aria-label="'+esc(title)+'"><div class="workbench-domain-title"><h2>'+esc(title)+'</h2></div>'+body+'</section>';}
  function overviewPanel(title,body,section){return '<article class="panel-card"><div class="panel-header"><h2>'+esc(title)+'</h2><button class="btn-link" onclick="WorkbenchOverview.open(\''+section+'\')">查看全部 ›</button></div><div class="workbench-panel-content">'+body+'</div></article>';}
  function superOverview(m){
    const i=AppState.get().instanceId,tenants=d.tenants.filter(t=>t.instanceId===i),lines=d.lines.filter(l=>l.instanceIds?.includes(i)),issues=(d.callDataIssues||[]).filter(r=>r.instanceId===i&&r.status!=='已恢复'),tasks=AppState.scoped(d.tasks).filter(t=>['异常','资源不足暂停'].includes(t.status));
    const tenantName=id=>d.tenants.find(t=>t.tenantId===id)?.name||'未提供租户';
    const lineTable=ui.table([{key:'name',label:'线路'},{key:'provider',label:'供应商'},{key:'status',label:'当前状态',render:v=>ui.status(v)},{key:'acceptanceStatus',label:'接入验证',render:v=>esc(v||'待确认')}],lines);
    const tenantTable=ui.table([{key:'name',label:'租户'},{key:'status',label:'状态',render:v=>ui.status(v)},{key:'tenantId',label:'关联账号数',render:id=>new Set(d.memberships.filter(v=>v.tenantId===id).map(v=>v.accountId)).size},{key:'tenantId',label:'坐席数',render:id=>m.seats.filter(a=>a.tenantId===id).length}],tenants);
    const issueTable=ui.table([{key:'tenantId',label:'所属租户',render:tenantName},{key:'callType',label:'呼叫类型',render:typeBadge},{key:'type',label:'异常情况'},{key:'impact',label:'业务影响'},{key:'status',label:'状态',render:v=>ui.status(v)}],issues);
    return '<div class="workbench-summary">当前实例：<b>'+esc(d.instances.find(v=>v.instanceId===i)?.name||i)+'</b><span>'+tenants.length+' 个租户 · '+new Set(d.memberships.filter(v=>tenants.some(t=>t.tenantId===v.tenantId)).map(v=>v.accountId)).size+' 个关联账号 · '+m.seats.length+' 个坐席</span><span class="workbench-summary-alert">待关注：'+tasks.length+' 个任务异常 / '+issues.length+' 条数据异常</span></div>'+block('资源与人员','<div class="kpi-grid">'+card('实例线路',lines.length,'lines')+card('实例租户与账号',tenants.length+' 个租户','tenants')+card('实例坐席',m.seats.length,'seats')+'</div><div class="workbench-overview-grid">'+overviewPanel('线路与接入状态',lineTable,'lines')+overviewPanel('租户与账号分布',tenantTable,'tenants')+'</div>')+block('异常与处理','<div class="kpi-grid">'+card('任务异常',tasks.length,'exceptions')+card('数据异常',issues.length,'data')+'</div><div class="workbench-overview-grid">'+overviewPanel('需关注的任务',taskTable(tasks),'exceptions')+overviewPanel('需核对的通话数据',issueTable,'data')+'</div>');
  }
  function tenantContext(m){
    const tenant=d.tenants.find(t=>t.tenantId===AppState.get().tenantId),states=[...new Set(m.tasks.map(t=>t.status))];
    return '<div class="workbench-summary"><b>'+esc(tenant?.name||'当前租户')+'</b><span>仅当前租户范围</span><span>任务状态：'+(states.map(s=>esc(s)+' '+m.tasks.filter(t=>t.status===s).length).join(' · ')||'今日暂无任务')+'</span></div>';
  }
  function seatPreview(m){
    const ordered=[...m.seats].sort((a,b)=>Number(seatState(b)==='忙碌')-Number(seatState(a)==='忙碌'));
    return overviewPanel(role()==='ADMIN'?'坐席负荷与当前通话':'坐席负荷',ui.table([{key:'userName',label:'坐席'},{key:'agentStatus',label:'当前状态',render:(_,a)=>ui.status(seatState(a))},{key:'currentCall',label:'当前通话',render:v=>v?'通话中 · 实时明细待接入':'无进行中通话'},{key:'agentRecordId',label:'操作',render:id=>'<button class="btn-link" onclick="WorkbenchOverview.agent(\''+esc(id)+'\')">'+(role()==='ADMIN'?'查看与管理':'查看')+'</button>'}],ordered.slice(0,6)),'seats');
  }
  function taskInfo(t){return typeBadge(t.callType)+' '+ui.status(t.status)+(t.displayOnly?' <span class="workbench-demo-tag">展示样例</span>':'');}
  function charts(m){
    const sum=m.tasks.reduce((n,t)=>n+Number(t.total||0),0);
    const progress=m.tasks.map(t=>'<button class="workbench-chart-row workbench-chart-action workbench-task-item" onclick="WorkbenchOverview.task(\''+esc(t.taskId)+'\')"><span class="workbench-task-heading"><strong>'+esc(t.name)+'</strong><span class="workbench-task-link">查看任务 ›</span></span><span class="workbench-task-tags">'+taskInfo(t)+'</span><span class="workbench-task-counts"><span>已呼叫 <b>'+(t.completed||0)+'</b> / '+(t.total||0)+' 位</span><span>剩余 '+Math.max(0,Number(t.total||0)-Number(t.completed||0))+' 位 · '+pct(t.completed||0,t.total||0)+'</span></span><progress class="workbench-progress" aria-label="'+esc(t.name)+'呼叫进度" max="'+Math.max(1,t.total||0)+'" value="'+(t.completed||0)+'"></progress></button>').join('');
    const groups=[...new Set(m.tasks.map(t=>t.callType||'类型未提供'))].map(type=>({type,tasks:m.tasks.filter(t=>(t.callType||'类型未提供')===type)}));
    const share=groups.map(g=>{const count=g.tasks.reduce((n,t)=>n+Number(t.total||0),0);return '<div class="workbench-chart-row workbench-task-item"><span class="workbench-task-heading">'+typeBadge(g.type)+'<b>'+pct(count,sum)+'</b></span><span class="workbench-task-tags">'+g.tasks.length+' 个任务 · '+count+' 位任务客户</span><progress class="workbench-progress" aria-label="'+esc(g.type)+'名单分布" max="'+Math.max(1,sum)+'" value="'+count+'"></progress></div>';}).join('');
    return '<div class="content-grid"><article class="panel-card span-6"><div class="panel-header"><h2>今日任务进度</h2>'+ui.help('展示当前范围今日任务的呼叫类型、执行状态、已呼叫与剩余人数。已呼叫不等于接通或跟进完成；展示样例不可启动。')+'</div><div class="panel-body">'+(progress||ui.empty('今日暂无任务'))+'</div></article><article class="panel-card span-6"><div class="panel-header"><h2>外呼方式分布</h2>'+ui.help('按外呼方式汇总今日任务的名单量，占今日任务总名单量的比例；不表示执行进度。人工待联络批次不纳入本图，同一客户在不同任务中分别计入。')+'</div><div class="panel-body">'+'<p class="workbench-chart-caption">按今日任务名单量汇总 · 不代表完成进度</p>'+(share||ui.empty('暂无占比数据'))+'</div></article></div>';
  }
  function personnel(m){const count=s=>m.seats.filter(a=>seatState(a)===s).length;return '<article><div class="panel-header"><h2>当前坐席</h2>'+ui.help('上线=空闲+忙碌+话后处理；未上线包含离线或未取得上线状态。总数不含已删除坐席。当前为原型状态，不代表真实在线监测。')+'</div><div class="kpi-grid">'+card('坐席总数',m.seats.length,'seats')+card('上线数',m.seats.length-count('未上线'),'seats','上线')+card('空闲',count('空闲'),'seats','空闲')+card('忙碌',count('忙碌'),'seats','忙碌')+card('话后处理',count('话后处理'),'seats','话后处理')+card('未上线',count('未上线'),'seats','未上线')+'</div></article>';}
  function customers(rows){const reason=seatBlockReason(mine());return ui.table([{key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'batchName',label:'所属批次'},{key:'method',label:'外呼方式',render:v=>typeBadge(v||'人工外呼')},{key:'followup',label:'跟进状态',render:v=>ui.status(v)},{key:'id',label:'操作',render:(id,row)=>{const blocked=reason||(!window.CustomerTasks?.canCall(row)?'当前客户不属于本人可联系名单':'');return blocked?'<button class="btn-link" disabled>联系客户</button>'+ui.help(blocked,'查看不能联系的原因'):'<button class="btn-link" onclick="CustomerTasks.pick(\''+esc(id)+'\')">联系客户</button>';}}],rows);}
  function personal(m){
    const work='<div class="kpi-grid">'+card('今日待联络客户',m.waiting,'customers','',true)+card('已呼叫客户',m.calledCustomers,'calls','',true)+'</div>';
    const pending='<article class="panel-card"><div class="panel-header"><h2>待联络客户</h2>'+ui.help('仅本人已分配且未完成跟进的客户，含历史待办；点击联系客户在弹窗内完成呼叫与跟进。')+'</div>'+customers(m.pending)+'</article>';
    const results='<div class="panel-header"><h3>接通情况</h3>'+ui.help('按本人今日已结束且结果明确的通话计算；同一客户重呼分别计次，首呼仅统计有首次呼叫依据的记录。')+'</div><div class="kpi-grid">'+card('呼叫次数',m.calls.length,'calls','',true)+card('接通次数',m.answered.length,'calls','接通',true)+card('未接通次数',m.calls.length-m.answered.length,'calls','未接通',true)+card('接通率',pct(m.answered.length,m.calls.length),'calls','',true)+'</div><div class="workbench-result-grid"><article class="panel-card"><div class="panel-header"><h3>首次呼叫</h3></div><div class="kpi-grid">'+card('首呼次数',m.firstCalls.length,'calls','首呼',true)+card('首呼接通率',pct(m.firstCalls.filter(connected).length,m.firstCalls.length),'calls','首呼',true)+'</div></article><article class="panel-card"><div class="panel-header"><h3>通话时长</h3>'+ui.help('只累计已接通通话；平均时长=接通通话总时长÷接通次数。')+'</div><div class="kpi-grid">'+card('通话总时长（秒）',m.seconds,'calls','接通',true)+card('平均通话时长（秒）',m.answered.length?Math.round(m.seconds/m.answered.length):'—','calls','接通',true)+'</div></article></div>';
    return '<div class="workbench-summary"><b>我的客户与通话</b><span>仅本人范围 · 待联络为当前待办，其余为今日数据</span></div><div class="seat-personal-columns">'+block('客户联络',pending)+block('通话成效',work+results)+'</div>';
  }
  function task(id){const t=AppState.scoped(d.tasks).find(t=>t.taskId===id);if(!t)return;if(role()==='OPERATOR'){ui.openLayer('dashboard-task','<div class="layer-header"><h2>'+esc(t.name)+'</h2><button onclick="PlatformUI.closeLayer(\'dashboard-task\')">×</button></div><div class="layer-body"><div class="workbench-task-tags">'+taskInfo(t)+'</div><p>已呼叫 '+(t.completed||0)+' / '+(t.total||0)+' 位客户</p>'+callTable(AppState.scoped(d.calls).filter(c=>c.taskId===id))+'</div>','large');}else CloudTaskWorkspace.openTask(id);}
  function callTable(calls){return ui.table([{key:'callee',label:'客户号码'},{key:'agentName',label:'坐席'},{key:'result',label:'通话结果'},{key:'durationSeconds',label:'时长（秒）'},{key:'callId',label:'操作',render:id=>'<button class="btn-link" onclick="Pages[\'cloud-call-records\'].openCall(\''+esc(id)+'\')">查看通话</button>'}],calls);}
  function drill(section,filter,personalScope,m){
    if(section==='customers')return personalScope?customers(m.pending):'<h3>自动外呼任务</h3>'+taskTable(m.tasks.filter(t=>!['已完成','已终止','草稿'].includes(t.status)))+'<h3>人工待联络客户</h3>'+ui.table([{key:'name',label:'客户'},{key:'phone',label:'号码'},{key:'batchName',label:'批次'},{key:'followup',label:'跟进状态'}],m.manualPending);
    if(section==='tasks')return taskTable(m.tasks);
    if(section==='calls')return callTable(m.calls.filter(c=>filter==='接通'?connected(c):filter==='未接通'?!connected(c):filter==='首呼'?m.firstCalls.includes(c):true));
    if(section==='seats')return ui.table([{key:'userName',label:'坐席'},{key:'agentStatus',label:'当前状态',render:(_,a)=>seatState(a)},{key:'currentCall',label:'当前通话',render:v=>v?'通话中':'—'},{key:'agentRecordId',label:'操作',render:id=>'<button class="btn-link" onclick="WorkbenchOverview.agent(\''+esc(id)+'\')">'+(role()==='ADMIN'?'查看与管理':'查看')+'</button>'}],m.seats.filter(a=>!filter||(filter==='上线'?seatState(a)!=='未上线':seatState(a)===filter)));
    if(role()!=='SUPER_ADMIN')return ui.empty('没有访问权限');
    const instance=AppState.get().instanceId,tenants=d.tenants.filter(t=>t.instanceId===instance);
    if(section==='lines')return '<button class="btn" onclick="navigateTo(\'lines\')">进入线路管理</button>'+ui.table([{key:'name',label:'线路'},{key:'status',label:'状态'},{key:'provider',label:'供应商'}],d.lines.filter(l=>l.instanceIds?.includes(instance)));
    if(section==='tenants')return ui.table([{key:'name',label:'租户'},{key:'status',label:'状态'},{key:'tenantId',label:'账号数',render:id=>'<button class="btn-link" onclick="WorkbenchOverview.open(\'accounts\',\''+esc(id)+'\')">'+d.memberships.filter(m=>m.tenantId===id).length+' · 查看账号</button>'}],tenants);
    if(section==='accounts'){if(!tenants.some(t=>t.tenantId===filter))return ui.empty('没有访问权限');const members=d.memberships.filter(m=>m.tenantId===filter).map(m=>({...m,name:d.accounts.find(a=>a.accountId===m.accountId)?.name||m.accountId}));return '<button class="btn" onclick="WorkbenchOverview.open(\'tenants\')">返回租户列表</button>'+ui.table([{key:'name',label:'账号'},{key:'roleCode',label:'租户内角色'},{key:'status',label:'成员状态'}],members);}
    if(section==='exceptions')return taskTable(AppState.scoped(d.tasks).filter(t=>['异常','资源不足暂停'].includes(t.status)));
    if(section==='data')return '<button class="btn" onclick="navigateTo(\'event-callbacks\')">进入数据异常处理</button>'+ui.table([{key:'callId',label:'通话编号'},{key:'status',label:'状态'},{key:'reason',label:'原因'}],(d.callDataIssues||[]).filter(r=>r.instanceId===instance&&r.status!=='已恢复'));
    return ui.empty('暂无明细');
  }
  function taskTable(rows){return ui.table([{key:'name',label:'任务'},{key:'callType',label:'呼叫类型',render:typeBadge},{key:'status',label:'任务状态',render:v=>ui.status(v)},{key:'completed',label:'已呼叫',help:'任务已完成呼叫的客户数，不等于接通或跟进完成。'},{key:'total',label:'客户数'},{key:'taskId',label:'操作',render:id=>'<button class="btn-link" onclick="WorkbenchOverview.task(\''+esc(id)+'\')">查看任务</button>'}],rows);}
  function agent(id){if(!valid())return;const a=seats().find(a=>a.agentRecordId===id);if(!a)return;if(['ADMIN','SUPER_ADMIN'].includes(role()))return Pages['agent-center'].openAgent(a.contactCenterIdentityId);ui.openLayer('dashboard-agent','<div class="layer-header"><h2>'+esc(a.userName)+'</h2><button onclick="PlatformUI.closeLayer(\'dashboard-agent\')">×</button></div><div class="layer-body"><p>'+seatState(a)+'</p>'+callTable(AppState.scoped(d.calls).filter(c=>identity(c)===a.contactCenterIdentityId))+'</div>','large');}
  function render(options={}){
    if(!valid())return ui.empty('请选择有效业务范围');const m=model(false),section=options.dashboardSection||'';
    const title=role()==='SUPER_ADMIN'?'实例管理工作台':role()==='ADMIN'?'租户管理工作台':'租户运营工作台';
    let html=ui.pageHeader(title,window.WorkbenchFixtureDate?'含演示快照 · '+window.WorkbenchFixtureDate:'',section?'<button class="btn" onclick="WorkbenchOverview.open()">返回运营工作台</button>':'');
    if(section)html+='<article class="panel-card"><div class="panel-header"><h2>'+esc(({tasks:'今日任务',calls:'今日通话',customers:'待呼叫明细',seats:'坐席明细',lines:'实例线路',tenants:'租户与账号',exceptions:'任务异常',data:'数据异常'})[section]||'明细')+' '+esc(options.dashboardFilter||'')+'</h2></div>'+drill(section,options.dashboardFilter||'',false,m)+'</article>';
    else if(role()==='SUPER_ADMIN')html+=superOverview(m);
    else html+=tenantContext(m)+'<section class="workbench-domain-block" aria-label="任务与呼叫"><div class="workbench-domain-title"><h2>任务与呼叫</h2></div><div class="panel-header"><h3>今日概览</h3>'+ui.help('今日任务按计划、创建、启动或通话发生日期识别；待呼叫为任务未完成客户数，已呼叫为今日按任务/批次客户去重人数。今日通话仅统计已结束且结果明确的已加载记录。')+'</div><div class="kpi-grid">'+card('今日任务',m.tasks.length,'tasks')+card('今日待呼叫客户',m.waiting,'customers')+card('今日已呼叫客户',m.calledCustomers,'calls')+card('今日呼叫次数',m.calls.length,'calls')+'</div>'+charts(m)+'</section><section class="workbench-domain-block" aria-label="坐席与通话"><div class="workbench-domain-title"><h2>坐席与通话</h2></div>'+personnel(m)+seatPreview(m)+'</section>';
    return '<section class="platform-page home-focus workbench-page '+(role()==='SUPER_ADMIN'?'workbench-super':'')+'">'+html+'</section>';
  }
  function renderSeat(options={}){
    if(!valid())return ui.empty('请选择有效业务范围');
    const agent=mine();if(!agent)return ui.empty('当前账号尚未关联本租户坐席，请联系租户管理员');
    const m=model(true),section=options.dashboardSection||'',filter=options.dashboardFilter||'';
    if(!section)return personal(m);
    const back='<button class="btn" onclick="WorkbenchOverview.open(\'\',\'\',true)">返回坐席工作台</button>';
    const titles={customers:'本人待联络客户',calls:'本人今日通话'};
    return '<article class="panel-card"><div class="panel-header"><h2>'+esc(titles[section]||'个人明细')+' '+esc(filter)+'</h2>'+back+'</div>'+(titles[section]?drill(section,filter,true,m):ui.empty('此明细不属于坐席工作台'))+'</article>';
  }
  function inspectAgent(id){
    if(!valid())return;const a=seats().find(x=>x.agentRecordId===id);if(!a)return;
    const manager=['ADMIN','SUPER_ADMIN'].includes(role());
    ui.openLayer('dashboard-agent','<div class="layer-header"><h2>'+esc(a.userName)+'</h2><button onclick="PlatformUI.closeLayer(\'dashboard-agent\')">×</button></div><div class="layer-body"><p>当前状态：'+seatState(a)+'</p><p>'+(a.currentCall?'当前通话尚无完整实时明细；以下为已加载记录。':'暂无进行中的通话。')+'</p>'+callTable(AppState.scoped(d.calls).filter(c=>identity(c)===a.contactCenterIdentityId))+(manager?'<button class="btn" onclick="WorkbenchOverview.stopNew(\''+esc(id)+'\')">停用坐席，停止接收新任务</button><p>当前通话允许完成，不执行强制挂断、监听或强插。</p>':'')+'</div>','large');
  }
  function stopNew(id){if(!valid()||!['ADMIN','SUPER_ADMIN'].includes(role()))return;const a=seats().find(x=>x.agentRecordId===id);if(!a)return;ui.closeLayer('dashboard-agent');Pages['agent-center'].disable(a.contactCenterIdentityId);}
  window.WorkbenchOverview={render,renderSeat,open,model,seatState,task,agent:inspectAgent,stopNew};
})();
