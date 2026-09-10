/** Read-only aggregation. All task controls delegate to the existing task state owner. */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape;
  let kind='',keyword='',status='',timer=null,lastRoleScope='';
  const allowed=()=>AppState.effectiveAccess().valid&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.canMenu('cloud.tasks');
  const admin=()=>['SUPER_ADMIN','ADMIN'].includes(AppState.effectiveAccess().roleCode);
  const rows=()=>AppState.scoped(CloudCallData.tasks).filter(t=>['预外呼','IVR 外呼'].includes(t.callType));
  function autoRefresh(){
    if(!allowed())return;
    if(timer){clearInterval(timer);timer=null;navigateTo('operations-monitor');return;}
    const scope=[AppState.get().accountId,AppState.get().tenantId,AppState.get().instanceId,AppState.get().activeDomain].join('|');
    timer=setInterval(()=>{
      const current=[AppState.get().accountId,AppState.get().tenantId,AppState.get().instanceId,AppState.get().activeDomain].join('|');
      if(!allowed()||scope!==current||AppState.get().currentPage!=='operations-monitor'){clearInterval(timer);timer=null;return;}
      if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
      navigateTo('operations-monitor');
    },10000);
    navigateTo('operations-monitor');
  }
  function open(type){if(!allowed())return;WorkbenchOverview.open(type==='manual'?'seats':type==='tasks'?'tasks':'');}
  function query(){keyword=document.getElementById('monitor-keyword')?.value.trim()||'';status=document.getElementById('monitor-status')?.value||'';navigateTo('operations-monitor');}
  function taskTable(){
    const tasks=rows().filter(t=>(!keyword||t.name.includes(keyword))&&(!status||t.status===status));
    return ui.table([{key:'name',label:'任务名称'},{key:'callType',label:'类型'},{key:'status',label:'运行状态',render:ui.status},
      {key:'total',label:'完成进度',render:(v,t)=>Number(t.completed||0)+' / '+Number(v||0)},
      {key:'connected',label:'已接通',render:v=>v==null?'待接入':Number(v)},
      {key:'updatedAt',label:'任务最近更新',render:v=>esc(v||'尚未收到更新')},
      {key:'taskId',label:'操作',render:id=>'<button class="btn-link" onclick="CloudTaskWorkspace.openTask(\''+esc(id)+'\',\'overview\')">运行监控</button>'}],tasks,{emptyText:'没有符合条件的任务'});
  }
  function teamTable(){
    const agents=AppState.scoped(CloudCallData.agents);
    return ui.table([{key:'userName',label:'坐席'},{key:'agentStatus',label:'当前演示状态',render:v=>ui.status(v||'待接入')},
      {key:'currentCall',label:'通话中',render:v=>v?'是':'否'},{key:'acceptNewTasks',label:'接收新任务',render:v=>v?'允许':'暂停'},
      {key:'lifecycleStatus',label:'坐席状态',render:ui.status}],agents,{emptyText:'当前范围暂无坐席'});
  }
  function recentManual(){
    const calls=AppState.scoped(CloudCallData.calls).filter(c=>c.callType==='人工外呼').slice().sort((a,b)=>(Date.parse(b.answeredAt)||0)-(Date.parse(a.answeredAt)||0)).slice(0,10);
    return '<article class="panel-card"><div class="panel-header"><h2>近期人工外呼</h2><button class="btn-link" onclick="navigateTo(\'cloud-call-records\',{type:\'人工外呼\'})">查看全部</button></div><div class="panel-body no-padding">'+ui.table([{key:'callee',label:'客户号码'},{key:'agentName',label:'坐席'},{key:'answeredAt',label:'接通时间'},{key:'durationSeconds',label:'通话时长',render:v=>Math.floor(Number(v||0)/60)+'分'+Number(v||0)%60+'秒'},{key:'result',label:'通话结果',render:ui.status},{key:'callbackStatus',label:'结果回流',render:ui.status},{key:'callId',label:'操作',render:id=>'<button class="btn-link" onclick="window.Pages[\'cloud-call-records\'].openCall(\''+esc(id)+'\')">查看</button>'}],calls,{emptyText:'暂无人工外呼记录'})+'</div></article>';
  }
  function render(){
    if(!allowed())return ui.empty('当前身份无权查看');
    const role=AppState.effectiveAccess().roleCode,scope=[AppState.get().accountId,AppState.get().tenantId,AppState.get().instanceId].join('|');
    if(lastRoleScope!==scope){kind='';keyword='';status='';lastRoleScope=scope;}
    if(!kind||(kind==='health'&&role!=='SUPER_ADMIN'))kind=role==='SUPER_ADMIN'?'health':role==='ADMIN'?'tasks':'business';
    const tabs=role==='SUPER_ADMIN'?[['health','平台健康'],['tasks','任务定位'],['manual','人工外呼团队'],['inbound','呼入服务']]:role==='ADMIN'?[['tasks','租户任务'],['manual','坐席负荷与通话'],['inbound','呼入服务'],['business','业务成效']]:[['business','业务成效'],['tasks','任务进度']];
    const tasks=rows();
    const counts=[['执行中',tasks.filter(t=>t.status==='执行中').length],['已暂停',tasks.filter(t=>t.status==='已暂停').length],['异常',tasks.filter(t=>t.status==='异常').length]];
    return '<section class="platform-page operations-monitor">'+ui.pageHeader('运行监控','', '<button class="btn" onclick="OperationsMonitor.autoRefresh()">自动刷新：'+(timer?'10秒':'关闭')+'</button><button class="btn" onclick="navigateTo(\'home\')">返回工作台</button>')+
      '<div class="task-center-tabs">'+tabs.map(([k,n])=>'<button class="'+(kind===k?'active':'')+'" onclick="OperationsMonitor.open(\''+k+'\')">'+n+'</button>').join('')+'</div>'+
      '<p class="field-hint">本地演示数据 · 未连接实时话务。刷新读取当前演示状态，不会产生真实调度。</p>'+
      (kind==='health'?RoleFocus.health():kind==='business'?RoleFocus.business():'')+
      (kind==='tasks'? (role==='ADMIN'?RoleFocus.load():'')+'<div class="content-grid">'+counts.map(([n,v])=>'<article class="panel-card span-4"><div class="panel-body"><span>'+n+'</span><h2>'+v+'</h2></div></article>').join('')+'</div><article class="panel-card"><div class="panel-body"><div class="form-grid"><label class="field"><span>任务名称</span><input id="monitor-keyword" value="'+esc(keyword)+'" placeholder="输入任务名称"></label><label class="field"><span>运行状态</span><select id="monitor-status"><option value="">全部状态</option>'+['待启动','执行中','已暂停','异常','已完成','已终止'].map(s=>'<option '+(s===status?'selected':'')+'>'+s+'</option>').join('')+'</select></label></div><button class="btn btn-primary" onclick="OperationsMonitor.query()">查询</button> <button class="btn" onclick="OperationsMonitor.open(\'tasks\')">重置</button></div></article>':'')+
      (['health','business'].includes(kind)?'':
      '<article class="panel-card"><div class="panel-header"><h2>'+(kind==='tasks'?'任务运行情况':kind==='inbound'?'接听团队状态':'人工外呼坐席状态')+'</h2><div><button class="btn" onclick="navigateTo(\'operations-monitor\')">刷新</button> '+(kind!=='tasks'&&admin()?'<button class="btn" onclick="navigateTo(\'agent-maintenance\')">调整人员安排</button> ':'')+(kind==='inbound'&&AppState.canMenu('settings.routes')?'<button class="btn" onclick="navigateTo(\'inbound-routes\')">呼入规则</button>':'')+'</div></div><div class="panel-body no-padding">'+(kind==='tasks'?taskTable():teamTable())+'</div></article>'+
      (kind==='manual'?recentManual():''))+
      (kind==='inbound'?'<article class="panel-card"><div class="panel-body">当前排队人数：待接入　·　最长等待：待接入　·　放弃接听：待接入 '+ui.help('需要真实技能组话务数据；不从历史通话记录推算实时排队。调整人员仍通过既有坐席维护与技能管理，不在这里强制挂断通话。')+'</div></article>':'')+'</section>';
  }
  function taskPanel(row){
    const logs=(row.dispatchHistory||[]).slice().reverse();
    return '<article class="panel-card"><div class="panel-header"><h2>运营调度</h2>'+ui.help('暂停停止新拨号；终止不可继续本任务。已发起通话继续收集结果，不代表强制挂断。实际在途语义与IVR执行控制须联调。')+'</div><div class="panel-body"><p>本地演示 · 任务状态与列表同步；真实实时话务尚未接入。</p><p>任务最近更新：'+esc(row.updatedAt||'尚未收到更新')+'</p><p>排队人数：待接入　当前可用坐席：待接入</p><button class="btn" onclick="CloudTaskWorkspace.openTask(\''+esc(row.taskId)+'\',\'overview\')">刷新监控</button> <button class="btn" onclick="CloudTaskWorkspace.openTask(\''+esc(row.taskId)+'\',\'results\')">查看异常</button></div><div class="panel-body no-padding">'+ui.table([{key:'at',label:'操作时间'},{key:'actor',label:'操作人'},{key:'action',label:'调度操作'},{key:'before',label:'操作前'},{key:'after',label:'执行结果'}],logs,{emptyText:'暂无调度操作'})+'</div></article>';
  }
  window.OperationsMonitor={open,query,render,taskPanel,autoRefresh};
  Pages['operations-monitor']={render};
})();
