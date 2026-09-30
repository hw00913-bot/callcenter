/* Business-facing controls for the local, document-bound seat operation service. */
(() => {
  'use strict';
  const id = 'seat-operation-drawer', ui = PlatformUI, esc = ui.escape;
  let view = null, working = false, operationMessage = '';
  const service = () => window.AliCtiSeatOperations;
  const sortRows = (rows, fallback) => ui.sortByUpdated?.(rows, fallback) || rows;
  const context = () => AgentWorkbench.receivingContext();
  const state = () => service()?.current();
  const selected = (a,b) => String(a) === String(b) ? ' selected' : '';
  const disabled = value => value ? ' disabled' : '';
  const refresh = () => AgentWorkbench.refreshTelephone();
  const scope = () => [AppState.account()?.accountId, AppState.get().tenantId, AppState.get().enterpriseId, context().agent?.cno].join(':');
  function presence() {
    const s = state(), connection = service()?.connectionStatus?.();
    if (connection?.blocked) return connection.needsLogin ? '软电话已断开' : connection.signaling === 'reconnecting' ? '正在重连' : '音频待核对';
    if (service()?.status().pending) return '电话状态待核对';
    if (!s) return '未登录';
    return s.resumeRequired&&s.presence==='ready'?'待置闲':s.presence === 'wrapup' ? '话后整理' : s.presence === 'paused' ? '置忙' : '置闲';
  }
  const modeLabels = () => service()?.modeLabels || { '0': '预览与预测同时', '4': '预览外呼', '5': '预测外呼' };
  const modeName = () => modeLabels()[state()?.workingMode || '0'] || modeLabels()['0'];
  function modeSelect(kind, blocked) {
    const current = state()?.workingMode || '0';
    const id = 'seat-working-mode' + (kind === 'toolbar' ? '-toolbar' : kind === 'panel' ? '-panel' : '');
    const options = Object.entries(modeLabels()).map(([value,label])=>'<option value="'+value+'"'+selected(value,current)+'>'+esc(label)+'</option>').join('');
    if (kind === 'toolbar') return '<select class="phone-mode-select" id="'+id+'" aria-label="工作模式" title="当前工作模式，切换即时生效" onchange="SeatOperationUI.changeMode(this.value)"'+disabled(blocked)+'>'+options+'</select>';
    return '<label class="toolbar-mute-direction">工作模式<select id="'+id+'" aria-label="工作模式" onchange="SeatOperationUI.changeMode(this.value)"'+disabled(blocked)+'>'+options+'</select></label>';
  }
  function controls(c, local) {
    const s = state(), management = service()?.managementState?.() || {}, blocked = !!service()?.connectionStatus?.().blocked || working || local.signingIn || !!service()?.status().pending || !!service()?.status().inFlight || management.pending || management.inFlight;
    const modeBlocked = blocked || local.busy || !['ready','paused'].includes(s?.presence) || s.presence === 'ready' && s.resumeRequired;
    const presenceButton =
      '<button class="btn" id="seat-presence-toggle" onclick="SeatOperationUI.'+(s?.presence === 'paused'||s?.resumeRequired&&s?.presence==='ready'?'resume()':'open(\'pause\')')+'"'+disabled(blocked || local.busy || s?.presence === 'wrapup')+'>'+(s?.presence === 'paused'||s?.resumeRequired&&s?.presence==='ready'?'置闲':'置忙')+'</button>';
    const sessionButton = local.online ? '<button class="btn" id="seat-workspace-online" onclick="SeatOperationUI.open(\'logout\')"'+disabled(blocked || local.busy)+'>座席退出</button>' :
      '<button class="btn btn-primary" id="seat-workspace-online" onclick="AgentWorkbench.signIn()"'+disabled(blocked || local.busy || c.phoneReason)+'>'+(local.signingIn?'座席登录中…':'座席登录')+'</button>';
    const buttons = (local.online?presenceButton:'')+sessionButton;
    const previewBlocked = local.busy || blocked || (local.online && (s?.presence !== 'ready' || s.resumeRequired || s.workingMode === '5'));
    const previewTitle = local.online && s?.workingMode === '5' ? '预测外呼模式下不能主动拨号，请先切换工作模式' : local.online && s?.presence !== 'ready' ? '请先置闲，再进行预览外呼' : '';
    if(local.compact) {
      const details='<details class="phone-menu"><summary aria-label="电话设置" title="电话设置">⋯</summary><div class="phone-menu-panel"><div class="phone-menu-identity">工号 '+esc(c.agent.cno)+'<br>分机 '+esc(state()?.bindTel||window.SeatPhoneConfig?.extension(c.agent)||'未配置')+'</div>'+sessionButton+'</div></details>';
      return '<div class="seat-session-controls compact"><span class="seat-presence '+(local.online?'online':'')+'"><i></i>'+esc(presence())+'</span>'+(s?.presence==='paused'&&s.pauseDescription?'<span class="phone-pause-reason" title="'+esc(s.pauseDescription)+'">'+esc(s.pauseDescription)+'</span>':'')+'<span class="phone-controls-spacer"></span>'+(local.online?presenceButton+modeSelect('toolbar',modeBlocked):sessionButton)+'<button class="btn '+(local.online?'btn-primary':'')+'" id="seat-temporary" title="'+previewTitle+'" onclick="AgentWorkbench.openTemporary()"'+disabled(previewBlocked)+'>预览外呼</button>'+details+'</div>';
    }
    return '<div class="seat-session-controls"><span class="seat-presence '+(service()?.connectionStatus?.().blocked?'connection-warning':local.online?'online':'')+'"><i></i>'+esc(local.busy?local.label:presence())+'</span>'+buttons+
      (local.online?modeSelect('panel',modeBlocked):'')+
      '<button class="btn btn-primary" id="seat-temporary" title="'+previewTitle+'" onclick="AgentWorkbench.openTemporary()"'+disabled(previewBlocked)+'>预览外呼</button></div>';
  }
  function summary(c) {
    if (!c.agent || !service()) return '';
    return '<div class="seat-telephone-summary"><span>浏览器电话 · 分机 '+esc(state()?.bindTel||window.SeatPhoneConfig?.extension(c.agent)||'未配置')+(state()?' · 工作模式：'+esc(modeName()):'')+'</span></div>'+notice();
  }
  function notice() {
    const management = service()?.managementState?.() || {};
    const connection = service()?.connectionStatus?.();
    if (connection?.blocked) return '<div class="seat-telephone-notice" role="status"><span>'+esc(connection.message)+(context().busy?' 当前通话和填写内容已保留。':' 重新登录后，请手动置闲。')+'</span><button class="btn-link" id="seat-relogin" onclick="SeatOperationUI.relogin()"'+disabled(working||!connection.canRelogin)+'>重新登录电话</button>'+(context().busy?'<small>完成当前通话与记录后可重新登录。</small>':'')+'</div>';
    if (management.pending || management.inFlight) return '<div class="seat-telephone-notice" role="status"><span>'+esc(management.inFlight?'正在处理班长管理操作…':'班长管理结果待核对，请返回监控刷新坐席状态。')+'</span><button class="btn-link" onclick="AgentWorkbench.setWorkspaceTab(\'monitor\')">返回班长监控</button></div>';
    const pending = service()?.status().pending, s = state();
    const message = operationMessage || (pending?'电话操作结果尚未确认，请先核对当前状态。':s?.presence === 'wrapup' && !context().busy?'记录已保存，自动置闲未完成，请重试。':'');
    if (!message && !working) return '';
    return '<div class="seat-telephone-notice" role="status"><span>'+esc(working?'正在处理电话操作…':message)+'</span>'+
      (!working && pending?'<button class="btn-link" onclick="SeatOperationUI.reconcile()">核对电话状态</button>':'')+
      (!working && !pending && s?.presence === 'wrapup' && !context().busy?'<button class="btn-link" onclick="SeatOperationUI.finishWrapup()">重试置闲</button>':'')+'</div>';
  }
  function close(force = false) {
    if (!force && working) { showToast('正在等待操作结果，请稍候','info'); return false; }
    view = null; ui.closeLayer(id); return true;
  }
  function open(kind) {
    if (working) return false;
    if (kind === 'settings') kind = 'login'; // Old cached entry opens the same one-step login panel.
    if (kind === 'monitor' && (!AgentWorkbench.telephoneStatus().online || !state() ||
        state().accountId !== AppState.get().accountId || state().tenantId !== AppState.get().tenantId ||
        state().enterpriseId !== AppState.get().enterpriseId || state().cno !== context().agent?.cno))
      return showToast('请先以本租户班长坐席上线，再查看队列实况','warning');
    const management = service()?.managementState?.() || {};
    if (management.inFlight || management.pending && kind !== 'monitor') return showToast('请先在班长监控中核对上一项管理操作','warning');
    const c = context(), profile = service().profile(c.agent);
    // A directory change blocks a new login; it must not trap an existing
    // verified phone session by preventing pause, wrap-up or normal logout.
    if (!profile.ok && (!state() || kind === 'login')) return showToast(profile.message,'warning');
    if (c.busy && !['extend','monitor'].includes(kind)) return showToast('请先完成通话与记录，再调整电话设置','warning');
    if (kind === 'login' && state()) return showToast('坐席已登录','info');
    if (kind === 'monitor' && !service().monitorQueues(c.agent).length) return showToast('当前坐席没有接听队列监控权限','warning');
    if (kind === 'extend' && state()?.presence !== 'wrapup') return showToast('仅话后整理期间可以延长','warning');
    // Ordinary login asks for this attempt's mode and state; old saved preferences are not submitted implicitly.
    const p = kind === 'login' ? {bindTel:profile.profile.bindTel,loginStatus:1,pauseDescription:'',workingMode:null} : state() || profile.profile;
    view = {kind,scope:scope(),context:profile.context,revision:profile.revision,values:{...p,pauseType:1,pauseDescription:kind==='pause'?'':p.pauseDescription||'',wrapupTime:60},message:'',monitor:null};
    draw();
    if (kind === 'monitor') return loadQueues();
    return true;
  }
  function field(label, control, hint='') { return '<label class="field"><span>'+label+'</span>'+control+(hint?'<small>'+hint+'</small>':'')+'</label>'; }
  function select(name, options, value) { return '<select id="seat-operation-'+name+'" onchange="SeatOperationUI.set(\''+name+'\',this.value)">'+Object.entries(options).map(([key,label])=>'<option value="'+key+'"'+selected(key,value)+'>'+esc(label)+'</option>').join('')+'</select>'; }
  function loginFields() {
    const v = view.values;
    const modeOptions = '<option value=""'+selected('',v.workingMode??'')+'>请选择工作模式</option>'+Object.entries(modeLabels()).map(([value,label])=>'<option value="'+value+'"'+selected(value,v.workingMode)+'>'+esc(label)+'</option>').join('');
    return '<p class="seat-operation-help">软电话分机：<strong>'+esc(v.bindTel||'未配置')+'</strong> · 由租户管理员从本租户的可用分机中选择。</p>'+
      field('登录状态',select('loginStatus',{'1':'置闲','2':'置忙'},v.loginStatus))+
      (String(v.loginStatus)==='2'?field('置忙描述（选填）','<input id="seat-operation-pauseDescription" maxlength="100" value="'+esc(v.pauseDescription||'')+'" oninput="SeatOperationUI.set(\'pauseDescription\',this.value)">'):'')+
      field('工作模式 <em>*</em>','<select id="seat-operation-workingMode" onchange="SeatOperationUI.set(\'workingMode\',this.value)">'+modeOptions+'</select>','本次登录使用所选模式，登录后也可在工具条切换');
  }
  function monitorBody() {
    const queues = service().monitorQueues(context().agent), rows = view.monitor;
    return '<p class="seat-operation-intro">查看当前租户的接听队列、坐席状态和等候来电。队列统计仅针对呼入。</p>'+field('接听队列',select('qno',{'':'全部可查看队列',...Object.fromEntries(queues.map(q=>[q.qno,q.name]))},view.values.qno||''))+
      '<button class="btn" onclick="SeatOperationUI.loadQueues()"'+disabled(working)+'>刷新队列</button>'+
      '<div id="seat-monitor-results">'+(rows?renderMonitor(rows):'<p class="seat-operation-help">正在读取队列状态…</p>')+'</div>';
  }
  function renderMonitor(result) {
    const names=Object.fromEntries(service().monitorQueues(context().agent).map(q=>[q.qno,q.name]));
    const rows = Object.entries(result.queueStatus||{}).map(([qno,row])=>({...row,qno,name:names[qno]}));
    if (!Array.isArray(rows) || !rows.length) return '<p class="seat-operation-help">当前没有可显示的队列状态。</p>';
    return sortRows(rows).map(row=>'<section class="seat-operation-section"><h3>'+esc(row.name||row.qname||'接听队列 '+row.qno)+'</h3>'+
      '<p class="seat-operation-help">队列编号：'+esc(row.qno)+' · 等候人数：'+esc(row.queueParams?.queueEntryCount??'—')+'</p>'+
      '<h4>坐席状态</h4><div class="table-scroll"><table class="data-table"><thead><tr><th>坐席</th><th>工号</th><th>当前状态</th></tr></thead><tbody>'+sortRows(row.agentStatuses||[]).map(a=>'<tr><td>'+esc(a.name||a.userName||'—')+'</td><td>'+esc(a.cno)+'</td><td>'+esc(a.state||a.status||a.presence||'—')+'</td></tr>').join('')+'</tbody></table></div>'+
      '<h4>等候来电</h4><div class="table-scroll"><table class="data-table"><thead><tr><th>客户号码</th><th>进入队列时间</th></tr></thead><tbody>'+sortRows(row.queueEntries||[],['joinTime']).map(e=>'<tr><td>'+esc(e.customerNumber||e.caller||'—')+'</td><td>'+esc(e.joinTime||'—')+'</td></tr>').join('')+'</tbody></table></div>'+(!(row.queueEntries||[]).length?'<p class="seat-operation-help">暂无等候来电</p>':'')+'</section>').join('');
  }
  function draw() {
    if (!view) return;
    const alreadyOpen=!!document.getElementById(id)?.classList.contains('open');
    const {kind,values:v} = view;
    const titles = {login:'坐席登录',pause:'置忙',logout:'坐席退出',extend:'延长整理时间',monitor:'队列状态'};
    let body = kind==='login'?loginFields():kind==='monitor'?monitorBody():kind==='pause'?'<p class="seat-operation-intro">置忙后不再分配新的呼叫。准备好后点击“置闲”。</p>'+field('置忙类型',select('pauseType',{'1':'普通','2':'休息'},v.pauseType))+field('置忙描述 <em>*</em>','<input id="seat-operation-pauseDescription" maxlength="100" value="'+esc(v.pauseDescription)+'" placeholder="例如：处理客户资料" oninput="SeatOperationUI.set(\'pauseDescription\',this.value)">'):
      kind==='logout'?'<p class="seat-operation-intro">退出后将停止接听与主动呼叫，分机绑定保持不变。</p>':
      '<p class="seat-operation-intro">需要更多时间整理本次沟通记录时，可以延长整理时间。</p>'+field('延长整理时间（秒）','<input id="seat-operation-wrapupTime" type="number" min="30" max="600" step="1" value="'+esc(v.wrapupTime)+'" oninput="SeatOperationUI.set(\'wrapupTime\',this.value)">','可设置 30–600 秒；不会自动提交或清空沟通记录。');
    const submitLabel = {login:'登录',pause:'确认置忙',logout:'确认退出',extend:'延长整理时间'}[kind];
    ui.openLayer(id,'<div class="layer-header"><h2>'+titles[kind]+'</h2><button onclick="SeatOperationUI.close()" aria-label="关闭">×</button></div><div class="layer-body seat-operation-body">'+body+'<p id="seat-operation-error" class="seat-error" role="alert">'+esc(view.message)+'</p></div><div class="layer-footer"><button class="btn" onclick="SeatOperationUI.close()"'+disabled(working)+'>关闭</button>'+(submitLabel?'<button class="btn btn-primary" id="seat-operation-submit" onclick="SeatOperationUI.submit()"'+disabled(working)+'>'+(working?'处理中…':submitLabel)+'</button>':'')+'</div>',kind==='monitor'?'large':'small');
    if(alreadyOpen)document.getElementById(id)?.classList.add('open');
    document.getElementById(id)?.querySelectorAll('input,select').forEach(el=>{el.disabled=working;});
  }
  function set(name, value) {
    if (!view || working) return;
    view.values[name]=value; view.message='';
    if (name==='loginStatus') draw();
    else {const node=document.getElementById('seat-operation-error');if(node)node.textContent='';}
  }
  async function run(action, keepOpen=false, quietSuccess=false) {
    if (working) return {ok:false};
    const expected=scope(),target=view;
    if (target && target.scope!==expected) {close(true);return {ok:false};}
    working=true;operationMessage='';if(view)draw();refresh();
    let result;
    try {result=await action();} catch (_) {result={ok:false,message:'电话操作未完成，请检查当前状态后重试'};}
    working=false;
    if (scope()!==expected) {if(view===target)close(true);return result;}
    operationMessage=result.ok?'':result.message||'电话操作未完成';
    if (view===target && target) {
      if (result.ok && !keepOpen) close(true);
      else {view.message=result.message||'';draw();}
    }
    refresh();
    if(result.ok&&!keepOpen&&!quietSuccess)showToast(result.message||'电话设置已更新','success');
    return result;
  }
  async function submit() {
    if (!view || working) return;
    const v={...view.values},agent=context().agent;
    if (view.scope !== scope()) { close(true); return {ok:false,message:'工作范围已变化，请重新登录'}; }
    if (view.kind==='login') {
      if(!Object.hasOwn(modeLabels(),v.workingMode)){view.message='请先选择工作模式';draw();return {ok:false};}
      return run(()=>AgentWorkbench.signIn({loginStatus:Number(v.loginStatus),pauseDescription:String(v.loginStatus)==='2'?v.pauseDescription||'':'',workingMode:v.workingMode}),false,true);
    }
    if(view.kind==='pause')return run(()=>service().pause(agent,{pauseType:Number(v.pauseType),pauseDescription:v.pauseDescription}));
    if(view.kind==='logout')return run(()=>AgentWorkbench.signOut());
    if(view.kind==='extend')return run(()=>service().prolongWrapup(agent,{wrapupTime:Number(v.wrapupTime)}));
  }
  async function loadQueues() {
    if(!view||view.kind!=='monitor'||!AgentWorkbench.telephoneStatus().online||!state())return {ok:false};
    const target=view,agent=context().agent,qnos=view.values.qno||service().monitorQueues(agent).map(q=>q.qno).join(',');
    const result=await run(()=>service().queueStatus(agent,{qnos,fields:'queueParams,agentStatuses,queueEntries'}),true);
    if(view===target){view.monitor=result.ok?result:null;draw();}
  }
  function wrapupControl(location = 'panel') {
    if(!context().online||state()?.presence!=='wrapup')return '';
    return '<button class="btn" id="seat-extend-wrapup'+(location==='toolbar'?'-toolbar':'')+'" onclick="SeatOperationUI.open(\'extend\')"'+disabled(working||service().status().pending||service().status().inFlight||service().connectionStatus?.().blocked||service().managementState?.().pending||service().managementState?.().inFlight)+'>延长整理时间</button>';
  }
  function openConnectionDemo() {
    const active = !!service()?.current();
    const button = (name, label) => '<button class="btn" onclick="SeatOperationUI.demoConnection(\''+name+'\')"'+disabled(!active)+'>'+label+'</button>';
    ui.openLayer('seat-connection-demo','<div class="layer-header"><h2>电话连接演示</h2><button aria-label="关闭电话连接演示" onclick="PlatformUI.closeLayer(\'seat-connection-demo\')">×</button></div><div class="layer-body"><p>观察连接异常时的提示，当前通话和填写内容会保留。</p>'+(!active?'<p>请先在坐席工作台登录。</p>':'')+'<div class="seat-call-actions">'+button('breakLine','模拟信令断开')+button('restored','模拟信令恢复')+button('sipDisconnected','模拟软电话断开')+'</div><p class="form-help">信令由电话组件自动重连，最多 20 次；超过后需重新登录。信令恢复不代表音频和通话状态已恢复。</p></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'seat-connection-demo\')">关闭</button></div>','small');
  }
  function demoConnection(name) {
    const result=service().demoConnection(name);
    ui.closeLayer('seat-connection-demo');
    if(!result.ok)showToast(result.message,'warning');
    else {refresh();showToast(result.connection.message,'info');}
    return result;
  }
  // Toolbar/panel online mode switch. Runs without a drawer view; run() shows the result toast.
  function changeMode(value) {
    if (working || !Object.hasOwn(modeLabels(),value)) return {ok:false};
    return run(()=>service().changeWorkingMode(context().agent,{workingMode:value}));
  }
  window.SeatOperationUI={openConnectionDemo,demoConnection,open,close,set,submit,controls,summary,presence,notice,loadQueues,wrapupControl,changeMode,
    isBusy:()=>working,
    relogin:()=>run(()=>service().relogin(context().agent)),
    resume:()=>run(()=>service().unpause(context().agent)),
    reconcile:()=>run(()=>service().refreshState(context().agent)),
    finishWrapup:()=>run(()=>service().completeWrapup()),
    afterRecordSaved(){return run(async()=>{const result=await service().completeWrapup();return result.ok?result:{...result,message:'记录已保存，自动置闲'+(result.pending?'结果未确认':'失败')+'。'+(result.message||'请核对电话状态后重试')};},false,true);},
    contextChanged(){operationMessage='';close(true);}
  };
})();
