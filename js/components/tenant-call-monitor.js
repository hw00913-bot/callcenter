/** Tenant-admin monitoring. Queue state and ended outbound records are separate evidence. */
(function () {
  'use strict';
  const root = window, data = root.CloudCallData, ui = root.PlatformUI, esc = ui.escape;
  const id = 'tenant-call-monitor', manageId = 'tenant-seat-management';
  let snapshot = null, loading = false, activeScope = '', message = '', sequence = 0, seenSession = null;
  let readOnlySnapshot = null, readOnlyLoading = false, readOnlyMessage = '', readOnlySequence = 0, monitorTab = 'overview', eventHistoryPage = 1;
  let manageView = null, managing = false;
  const management = () => service().managementState?.() || {};
  const managementBusy = () => managing || !!management().inFlight;
  const labels = {pause:'置忙',unpause:'置闲',logout:'下线'};
  const service = () => root.AliCtiSeatOperations;
  const access = () => root.AppState.effectiveAccess();
  const state = () => root.AppState.get();
  function eligible() {
    const s = state();
    return root.TenantSupervisorPolicy?.isTenantAdmin() === true && s.activeDomain === 'CLOUD_CONTACT_CENTER' &&
      root.AppState.hasCapability('CLOUD_CONTACT_CENTER') && (data.tenants || []).some(t => t.tenantId === s.tenantId && t.enterpriseId === s.enterpriseId && t.status === '启用');
  }
  const agent = () => root.AgentWorkbench.myAgent();
  const scope = () => JSON.stringify([state().sessionId, state().accountId, state().enterpriseId, state().tenantId, access().roleCode, access().valid, agent()?.cno]);
  const within = row => row.tenantId === state().tenantId && row.enterpriseId === state().enterpriseId;
  function resetScope() {
    const next = scope();
    if (next !== activeScope || !eligible()) { activeScope = next; snapshot = null; loading = false; message = ''; seenSession = null; sequence++; readOnlySnapshot = null; readOnlyLoading = false; readOnlyMessage = ''; readOnlySequence++; monitorTab = 'overview'; eventHistoryPage = 1; closeManage(true); }
  }
  function model() {
    if (!eligible()) return null;
    const metrics = root.CloudReportMetrics, today = new Date().toLocaleDateString('sv-SE');
    const universe = (data.calls || []).filter(within), unique = new Map();
    for (const call of universe) {
      if (call.direction === '呼入' || !['人工外呼', '预览外呼', '预外呼', 'IVR 外呼', '自动外呼'].includes(call.callType)) continue;
      const at = metrics.callTime(call);
      if (at === null || new Date(at).toLocaleDateString('sv-SE') !== today || !metrics.state(call).ended) continue;
      // A call is counted once, even when it appears in several imported snapshots.
      if (call.callId) unique.set(call.callId, call);
    }
    const calls = [...unique.values()], result = call => metrics.state(call);
    const answered = calls.filter(c => result(c).answered === true), unanswered = calls.filter(c => result(c).answered === false);
    const unknown = calls.filter(c => result(c).answered !== true && result(c).answered !== false);
    const tasks = (data.tasks || []).filter(t => within(t) && !t.isWizardDraft && ['执行中', '运行中'].includes(t.status));
    return { today, calls, answered, unanswered, unknown, tasks,
      stats: { calls: calls.length, answered: answered.length, unanswered: unanswered.length, unknown: unknown.length, runningTasks: tasks.length,
        rate: answered.length + unanswered.length ? (100 * answered.length / (answered.length + unanswered.length)).toFixed(1) + '%' : '—' } };
  }
  function monitoredSeats(result) {
    if (!eligible()) return [];
    const allowed = new Set(service().monitorQueues(agent()).map(q => q.qno)), rows = new Map();
    for (const [qno, queue] of Object.entries(result?.queueStatus || {})) {
      if (!allowed.has(qno)) continue;
      for (const source of queue.agentStatuses || []) {
        if (typeof source.cno !== 'string') continue;
        const candidates = (data.agents || []).filter(a => a.enterpriseId === state().enterpriseId && a.cno === source.cno && a.lifecycleStatus !== '已删除');
        if (candidates.length !== 1 || !within(candidates[0])) continue;
        const key = state().enterpriseId + ':' + source.cno, local = candidates[0], previous = rows.get(key);
        if (previous) {
          previous.queues.push(qno);
          if (previous.state !== source.state) previous.state = '待核对';
        } else rows.set(key, { updatedAt: source.updatedAt || local.updatedAt, createdAt: local.createdAt, cno: source.cno, name: local.userName || source.name || source.cno, state: source.state || '未提供', queues: [qno] });
      }
    }
    return [...rows.values()];
  }
  function readOnlySeats() {
    if (!eligible()) return [];
    const rows = (data.agents || []).filter(row => within(row) && row.lifecycleStatus !== '已删除' &&
      typeof row.cno === 'string' && row.cno);
    return rows.filter(row => (data.agents || []).filter(candidate => candidate.enterpriseId === row.enterpriseId &&
      candidate.cno === row.cno && candidate.lifecycleStatus !== '已删除').length === 1);
  }
  function onlineSession() {
    const a = agent(), phone = root.AgentWorkbench.telephoneStatus(), session = service().current();
    return !!(a && phone.online && session && session.cno === a.cno && session.tenantId === state().tenantId &&
      session.enterpriseId === state().enterpriseId && session.accountId === state().accountId);
  }
  function metric(label, value, hint) { return '<div class="tenant-monitor-metric"><span>' + label + '</span><strong>' + esc(value) + '</strong><small>' + hint + '</small></div>'; }
  function eventTime(value) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString('zh-CN', { hour12: false }) : String(value || '—');
  }
  function eventColumns() {
    return [
      { key: 'updatedAt', label: '记录时间', render: (_, row) => esc(eventTime(row.updatedAt || row.occurredAt)) },
      { key: 'name', label: '坐席', render: (_, row) => '<strong>' + esc(row.name || row.cno) + '</strong><small class="tenant-monitor-event-cno">工号 ' + esc(row.cno) + '</small>' },
      { key: 'label', label: '事件', render: (_, row) => '<span class="tenant-monitor-event-label ' + (['warning', 'error', 'abnormal', '异常'].includes(row.level) ? 'is-abnormal' : 'is-normal') + '">' + esc(row.label || '状态变化') + '</span>' },
      { key: 'source', label: '来源', render: value => esc(value || '—') }
    ];
  }
  function eventTable(rows) {
    return ui.table(eventColumns(), rows, { numbered: false, className: 'tenant-monitor-event-table', emptyText: '暂无坐席事件', emptyDetail: '当前浏览器的模拟操作、连接回调或状态观察发生后显示在这里。' });
  }
  function eventLog() {
    const rows = (root.SeatEventLog?.list?.() || []).slice(0, 5);
    return '<section class="tenant-monitor-event-log" aria-labelledby="tenant-monitor-event-title">' +
      '<div class="tenant-monitor-live-heading"><h3 id="tenant-monitor-event-title">坐席事件日志</h3><div class="tenant-monitor-event-actions"><span>最近 ' + rows.length + ' 条</span><button type="button" class="btn-link" onclick="TenantCallMonitor.openEventHistory()">查看全部事件</button></div></div>' +
      eventTable(rows) +
      '<p class="tenant-monitor-event-help">当前浏览器演示记录，非实时采集；按平台记录时间倒序。状态查询只能观察当前状态，不能提供历史发生时间。</p></section>';
  }
  function renderEventHistory() {
    if (!eligible()) return '<section class="platform-page seat-event-history"><div class="panel-card"><div class="panel-body">当前没有查看本租户坐席事件的权限。</div></div></section>';
    resetScope();
    const rows = root.SeatEventLog?.list?.() || [], pageSize = 10;
    const pages = Math.max(1, Math.ceil(rows.length / pageSize));
    eventHistoryPage = Math.min(pages, Math.max(1, eventHistoryPage));
    const visible = rows.slice((eventHistoryPage - 1) * pageSize, eventHistoryPage * pageSize);
    return '<section class="platform-page seat-event-history"><div class="panel-card"><div class="panel-header"><div><h2>全部坐席事件</h2><p>当前浏览器演示记录 · 仅当前租户 · 按平台记录时间倒序</p></div></div>' +
      '<div class="tenant-monitor-event-log">' + eventTable(visible) +
      ui.pagination(rows.length, eventHistoryPage, pageSize, 'TenantCallMonitor.setEventHistoryPage') +
      '<p class="tenant-monitor-event-help">非实时采集；仅包含当前浏览器模拟操作回执、连接回调和接口状态观察。状态快照只证明观察到变化；生产环境需服务端汇总后提供全租户历史。</p></div></div></section>';
  }
  function openEventHistory() {
    if (!eligible()) return false;
    eventHistoryPage = 1;
    return root.RouteRuntime?.openSecondary?.('seat-event-history', { refreshOnClose: true }) || false;
  }
  function setEventHistoryPage(page) {
    if (!eligible() || root.RouteRuntime?.snapshot?.()?.key !== 'seat-event-history') return false;
    const total = (root.SeatEventLog?.list?.() || []).length, pages = Math.max(1, Math.ceil(total / 10));
    eventHistoryPage = Math.min(pages, Math.max(1, Math.floor(Number(page) || 1)));
    root.RouteRuntime.refreshCurrent?.();
    return true;
  }
  function body() {
    const m = model(); if (!m) return '';
    resetScope();
    const a = agent(), phone = root.AgentWorkbench.telephoneStatus(), session = service().current(), allowed = a ? service().monitorQueues(a) : [];
    const authorized = allowed.length > 0, online = onlineSession();
    const pending = service().status().pending, busy = root.AgentWorkbench.current().busy, adminState = management(), adminBusy = managementBusy();
    const controls = monitorTab === 'events' ? '' : online ? '<button class="btn" id="tenant-monitor-refresh" onclick="TenantCallMonitor.load()"' + (loading || pending || adminBusy ? ' disabled' : '') + '>刷新队列监控</button><button class="btn" id="tenant-monitor-offline" onclick="TenantCallMonitor.stop()"' + (loading || pending || busy || adminBusy || adminState.pending ? ' disabled' : '') + '>下线</button>' :
      '<button class="btn" id="tenant-monitor-read-refresh" onclick="TenantCallMonitor.loadReadOnlyStatuses()"' + (readOnlyLoading ? ' disabled' : '') + '>刷新坐席状态</button><button class="btn btn-primary" id="tenant-monitor-start" onclick="TenantCallMonitor.start()"' + (!authorized || phone.signingIn || pending || adminBusy || adminState.pending ? ' disabled' : '') + '>' + (phone.signingIn ? '正在上线…' : '上线并监控') + '</button>';
    let note = !a ? '只读统计和坐席状态可直接查看；队列监控需要先关联班长坐席。' : !authorized ? '只读统计和坐席状态可查看；队列监控需先完成本租户班长授权。' : !online ? '已开放本租户只读坐席状态；队列实况和管理操作需班长上线。' : '';
    if (phone.error) note = phone.error;
    if (message) note = message;
    if (adminBusy) note = '正在处理坐席管理操作，请稍候。';
    else if (adminState.pending) note = adminState.message || '坐席管理结果待确认，请刷新监控核对当前状态。';
    const current = online && authorized && snapshot?.scope === activeScope && !pending ? snapshot : null;
    const read = readOnlySnapshot?.scope === activeScope ? readOnlySnapshot : null;
    const monitored = current ? monitoredSeats(current.result) : read?.rows || [];
    const seats = ui.sortByUpdated?.(monitored) || monitored;
    const live = current || read ? '<div class="tenant-monitor-live-summary"><span>坐席 <b>' + seats.length + '</b></span><span>通话 <b>' + seats.filter(s => s.state === '通话').length + '</b></span><span>呼叫中 / 响铃 <b>' + seats.filter(s => ['呼叫中', '响铃'].includes(s.state)).length + '</b></span><span>空闲 <b>' + seats.filter(s => s.state === '空闲').length + '</b></span></div>' +
      ui.table([{ key: 'name', label: '坐席' }, { key: 'cno', label: '工号' }, { key: 'state', label: '当前状态', render: value => ui.status(value) },
        ...(current ? [{ key: 'queues', label: '所属队列', render: values => values.map(qno => esc(allowed.find(q => q.qno === qno)?.name || qno)).join('、') }, {key:'cno',label:'管理操作',render:(_,row)=>rowActions(row)}] : [])], seats) :
      '<div class="tenant-monitor-empty">' + (readOnlyLoading ? '正在查询本租户坐席状态…' : readOnlyMessage || (online && authorized ? '点击“刷新队列监控”查看队列与管理操作。' : '点击“刷新坐席状态”查询本租户坐席。')) + '</div>';
    const tabs = '<div class="tenant-monitor-tabs" role="tablist" aria-label="班长监控内容">' +
      [['overview','监控概览'],['events','坐席事件日志']].map(([key,label]) => '<button type="button" role="tab" id="tenant-monitor-tab-' + key + '" aria-controls="tenant-monitor-panel-' + key + '" aria-selected="' + (monitorTab === key) + '" class="' + (monitorTab === key ? 'active' : '') + '" onclick="TenantCallMonitor.setTab(\'' + key + '\')">' + label + '</button>').join('') + '</div>';
    const overview = '<div class="tenant-monitor-metrics">' + metric('今日外呼次数', m.stats.calls, '已结束的外呼记录') + metric('客户接通', m.stats.answered, '含人工及自动语音接通') + metric('接通率', m.stats.rate, '仅计算结果明确的记录') + metric('结果待确认', m.stats.unknown, '不计入接通率分母') + '</div>' +
      (note || pending ? '<div class="tenant-monitor-note" role="status">' + esc(note) + (pending && online ? '<button class="btn-link" onclick="SeatOperationUI.reconcile()">核对电话状态</button>' : '') + '</div>' : '') +
      '<div class="tenant-monitor-live-heading"><h3>坐席当前状态</h3><span>' + (current || read ? '更新于 ' + esc((current || read).updatedAt) : '') + '</span></div>' + live +
      (readOnlyMessage && (current || read) ? '<p class="tenant-monitor-note" role="status">' + esc(readOnlyMessage) + '</p>' : '') +
      '<div class="tenant-monitor-footer"><span>外呼统计按今日已结束话单汇总；未上线时坐席状态为只读，队列归属需上线查看。</span>' +
      (online && authorized ? '<button class="btn-link" onclick="SeatOperationUI.open(\'monitor\')">查看呼入排队</button>' : '') + '</div>';
    return '<div class="panel-header"><div><h2>班长监控</h2><p>仅当前租户 · ' + esc(a ? '班长工号 ' + a.cno : '管理员监控') + '</p></div><div class="tenant-monitor-actions">' + controls + '</div></div>' + tabs +
      '<div id="tenant-monitor-panel-' + monitorTab + '" role="tabpanel" aria-labelledby="tenant-monitor-tab-' + monitorTab + '">' + (monitorTab === 'events' ? eventLog() : overview) + '</div>';
  }
  function setTab(value) {
    if (!eligible() || !['overview','events'].includes(value)) return false;
    monitorTab = value; refresh(); document.getElementById('tenant-monitor-tab-' + value)?.focus(); return true;
  }
  function rowActions(row) {
    if(row.cno===agent()?.cno) return '<span class="tenant-monitor-self">本人</span>';
    if(['离线','未上线','下线'].includes(row.state)) return '<span class="tenant-monitor-self">已离线</span>';
    if(!['空闲','置忙','示忙','暂停接听','可接听'].includes(row.state)) return '<span class="tenant-monitor-self">'+esc(row.state==='待核对'?'请刷新核对':'当前状态不可调整')+'</span>';
    const action=['空闲','可接听'].includes(row.state)?'pause':'unpause';
    return '<div class="tenant-monitor-row-actions">'+[action,'logout'].map(value=>{
      const permission=service().managementEligibility?.(agent(),row.cno,value)||{ok:false,message:'暂时无法调整'};
      const disabled=loading||managementBusy()||management().pending||!permission.ok;
      return '<button type="button" class="btn-link" data-monitor-action="'+value+'" data-monitor-cno="'+esc(row.cno)+'" onclick="TenantCallMonitor.openManage(\''+value+'\',\''+esc(row.cno)+'\')"'+(disabled?' disabled':'')+' title="'+esc(permission.message||labels[value])+'">'+labels[value]+'</button>';
    }).join('')+'</div>';
  }
  function closeManage(force=false) {
    if(!force&&managementBusy())return false;
    const hadView=!!manageView; manageView=null; if(hadView)ui.closeLayer(manageId); return true;
  }
  function drawManage() {
    if(!manageView)return;
    const v=manageView,working=managementBusy();
    const impact={pause:'置忙后，该坐席暂停接收新的来电。',unpause:'置闲后，该坐席恢复接收新的来电。',logout:'下线后，该坐席停止接听与主动呼叫，保留电话绑定。再次上线由坐席本人操作。'}[v.action];
    ui.openLayer(manageId,'<div class="layer-header"><h2>坐席'+labels[v.action]+'</h2><button type="button" aria-label="关闭" onclick="TenantCallMonitor.closeManage()"'+(working?' disabled':'')+'>×</button></div>'+
      '<div class="layer-body tenant-monitor-management"><dl><dt>坐席</dt><dd>'+esc(v.name)+'</dd><dt>工号</dt><dd>'+esc(v.cno)+'</dd><dt>所属租户</dt><dd>'+esc(root.AppState.currentTenant().name)+'</dd><dt>当前状态</dt><dd>'+esc(v.state)+'</dd></dl><p>'+impact+'</p>'+
      '<p id="tenant-management-error" class="seat-error" role="alert">'+esc(v.message||'')+'</p></div>'+
      '<div class="layer-footer"><button class="btn" onclick="TenantCallMonitor.closeManage()"'+(working?' disabled':'')+'>取消</button><button class="btn btn-primary" id="tenant-management-submit" onclick="TenantCallMonitor.submitManage()"'+(working?' disabled':'')+'>'+(working?'处理中…':'确认'+labels[v.action])+'</button></div>','small');
  }
  function openManage(action,cno) {
    resetScope();
    if(!labels[action]||!eligible()||!onlineSession()||loading||managementBusy()||management().pending)return false;
    const row=snapshot?.scope===activeScope?monitoredSeats(snapshot.result).find(row=>row.cno===cno):null;
    const permission=row&&service().managementEligibility?.(agent(),cno,action);
    if(!row||!permission?.ok){root.showToast(permission?.message||'请刷新监控后再操作','warning');return false;}
    manageView={...row,action,scope:activeScope,message:''};drawManage();return true;
  }
  async function submitManage() {
    const target=manageView;
    if(!target||!onlineSession()||managementBusy()||management().pending||target.scope!==scope()||!eligible())return {ok:false};
    const permission=service().managementEligibility?.(agent(),target.cno,target.action);
    if(!permission?.ok){target.message=permission?.message||'当前无法执行该操作';drawManage();return {ok:false};}
    managing=true;target.message='';drawManage();refresh();
    let result;
    try{result=await service().manageSeat(agent(),{action:target.action,cno:target.cno});}
    catch(_){result={ok:false,message:'操作未完成，请刷新监控核对当前状态'};}
    managing=false;
    if(target.scope!==scope()||!eligible()){closeManage(true);resetScope();refresh();return result;}
    if(result.ok){
      closeManage(true);message='操作已受理，正在刷新坐席状态。';
      const readback=await load();
      if(readback.ok)root.showToast('已刷新坐席状态','success');
    }else if(result.pending||management().pending){
      closeManage(true);snapshot=null;message=result.message||'管理结果待确认，请刷新监控核对当前状态。';refresh();
    }else{target.message=result.message||'操作未完成，原状态保留';message=target.message;drawManage();refresh();}
    return result;
  }
  function contextChanged(){closeManage(true);snapshot=null;seenSession=null;activeScope='';message='';sequence++;readOnlySnapshot=null;readOnlyLoading=false;readOnlyMessage='';readOnlySequence++;monitorTab='overview';eventHistoryPage=1;}
  function render() { return eligible() ? '<section class="panel-card tenant-call-monitor" id="' + id + '">' + body() + '</section>' : ''; }
  function refresh() { const node = document.getElementById(id); if (!node) return; if (!eligible()) { resetScope(); node.remove(); return; } node.innerHTML = body(); }
  async function loadReadOnlyStatuses() {
    resetScope(); if (!eligible() || readOnlyLoading) return {ok:false};
    const targets = readOnlySeats(), expected = activeScope, token = ++readOnlySequence;
    readOnlyLoading = true; readOnlyMessage = ''; refresh();
    const results = await Promise.all(targets.map(async row => {
      try { return {row,result:await service().agentStatusGet(agent(),row.cno)}; }
      catch (_) { return {row,result:{ok:false,message:'坐席状态查询失败'}}; }
    }));
    if (token !== readOnlySequence || expected !== scope() || !eligible()) return {ok:false};
    readOnlyLoading = false;
    const rows = results.map(({row,result}) => ({cno:row.cno,name:row.userName||row.cno,
      state:result?.ok ? result.state : '待核对',updatedAt:row.updatedAt||row.createdAt,
      statusMessage:result?.ok?'':result?.message||'状态待核对'}));
    readOnlySnapshot = {scope:expected,rows,updatedAt:new Date().toLocaleTimeString('zh-CN',{hour12:false})};
    const failures = results.filter(item=>!item.result?.ok).length;
    readOnlyMessage = !targets.length ? '本租户暂无可查询的坐席。' : failures ? `${failures} 个坐席状态暂未取得，请稍后重查。` : '';
    if (!failures) root.SeatEventLog?.observeSnapshot?.(rows, { source: 'statusApi' });
    refresh(); return {ok:failures===0,rows,message:readOnlyMessage};
  }
  async function load() {
    resetScope(); if (!eligible() || !onlineSession() || loading || managementBusy()) return { ok: false };
    const a = agent(); if (!a || !service().monitorQueues(a).length) { snapshot = null; refresh(); return { ok: false }; }
    const expected = activeScope, token = ++sequence;
    loading = true; message = ''; snapshot = null; refresh();
    let result;
    try { result = await service().queueStatus(a, { fields: 'agentStatuses' }); }
    catch (_) { result = { ok: false, message: '暂时无法获取坐席状态，请稍后刷新' }; }
    if (token !== sequence || expected !== scope() || !eligible()) { refresh(); return { ok: false }; }
    loading = false;
    if (result.ok) {
      snapshot = { scope: expected, result, updatedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }) };
      try { root.SeatEventLog?.observeSnapshot?.(monitoredSeats(result)); } catch (_) { /* Event logging must not block status monitoring. */ }
    }
    else message = result.message || '暂时无法获取坐席状态，请稍后刷新';
    refresh(); return result;
  }
  function start() {
    if (!eligible() || managementBusy() || management().pending || !agent() || !service().monitorQueues(agent()).length) return false;
    // signIn's promise owns the browser seat lock until logout; do not await it here.
    void root.AgentWorkbench.signIn(); refresh(); return true;
  }
  async function stop() {
    if (!eligible() || !onlineSession() || loading || managementBusy() || management().pending) return { ok: false };
    const result = await root.AgentWorkbench.signOut();
    if (result.ok) { snapshot = null; seenSession = null; }
    else message = result.message;
    refresh(); if(result.ok)void loadReadOnlyStatuses(); return result;
  }
  function telephoneChanged() {
    if (!document.getElementById(id)) return;
    resetScope();
    const s = service().current(), phone = root.AgentWorkbench.telephoneStatus(), sessionKey = s ? JSON.stringify([s.accountId, s.tenantId, s.cno, s.issuedAt]) : null;
    if (!phone.online || !s) { snapshot = null; seenSession = null; }
    const initial = phone.online && s && sessionKey !== seenSession;
    seenSession = sessionKey;
    refresh();
    if (!readOnlySnapshot && !readOnlyLoading && eligible()) void loadReadOnlyStatuses();
    if (initial && eligible() && !loading && !managementBusy() && !service().status().pending) void load();
  }
  root.TenantCallMonitor = { eligible, model, monitoredSeats, render, renderEventHistory, refresh, loadReadOnlyStatuses, load, setTab, openEventHistory, setEventHistoryPage, start, stop, telephoneChanged, openManage, closeManage, submitManage, contextChanged };
  root.Pages = root.Pages || {};
  root.Pages['seat-event-history'] = { render: renderEventHistory, init() {} };
  root.addEventListener?.('seat-event-log-updated', () => {
    if (root.RouteRuntime?.snapshot?.()?.key === 'seat-event-history') root.RouteRuntime.refreshCurrent?.();
    else if (document.getElementById(id)) refresh();
  });
})();
