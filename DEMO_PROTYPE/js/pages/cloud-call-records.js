/** 云呼叫四类记录、录音适用性与业务结果回流。 */
(function () {
  'use strict';
  const ui = PlatformUI;
  const esc = ui.escape;
  const returnKey = 'cloud-call-record-task-context-v1';
  let view = 'records';
  let activeType = '全部';
  let recordKeyword = '';
  let recordResult = '';
  let recordingFilter = '';
  let recordPage = 1;
  let recordSource = '';
  let nativeAgentId = '';
  let callbackStatusFilter = '';
  const pageSize = 10;
  let taskContext = loadTaskContext();


  function syncContext(options,tab){
    const opts=options||{};
    if (!opts.preserveContext) { nativeAgentId = opts.nativeAgentId || ''; recordSource = ''; }
    if(opts.taskId){saveTaskContext({taskId:opts.taskId,tab:opts.returnTab||tab});activeType=taskById(opts.taskId)?.callType||'全部';recordPage=1;recordKeyword='';recordResult='';recordingFilter='';callbackStatusFilter='';}
    else if(!opts.preserveContext){saveTaskContext(null);activeType=opts.type||opts.filter||'全部';recordPage=1;recordKeyword='';recordResult='';recordingFilter='';callbackStatusFilter='';}
    if(opts.type||opts.filter)activeType=opts.type||opts.filter;
  }
  function scoped(rows) { return AppState.scoped(rows || []); }
  function loadTaskContext() { try { return JSON.parse(sessionStorage.getItem(returnKey) || 'null'); } catch (error) { return null; } }
  function saveTaskContext(value) { taskContext = value; if (value) sessionStorage.setItem(returnKey, JSON.stringify(value)); else sessionStorage.removeItem(returnKey); }
  function formatDuration(seconds) { if (seconds === null || seconds === undefined || seconds === '' || !Number.isFinite(Number(seconds))) return '未记录'; const value = Number(seconds); return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
  function taskById(id) { return (CloudCallData.tasks || []).find(item => item.taskId === id); }

  function taskReturnBar() {
    if (!taskContext?.taskId) return '';
    const task = taskById(taskContext.taskId);
    if (!task || !AppState.authorizeObject('', task)) { saveTaskContext(null); return ''; }
    const tabNames = { overview: '任务概览', customers: '客户数据', resources: '资源与策略', execution: '执行明细', calls: '通话记录', results: '结果及异常' };
    return `<div class="return-context-bar record-return-bar" data-anno-page="cloud-call-records" data-anno-label="从记录返回原任务页签" data-anno-kind="region" data-anno-fields="FLD-031,FLD-046,FLD-047"><div><span>来自任务中心</span><strong>${esc(task.name)} · ${esc(task.taskId)}</strong><small>当前数据按任务过滤；返回后恢复“${esc(tabNames[taskContext.tab] || '任务概览')}”页签。</small></div><div><button class="btn" onclick="CloudCallRecords.clearTaskContext()">查看全部记录</button><button class="btn btn-primary" onclick="CloudCallRecords.returnTask()">返回任务中心</button></div></div>`;
  }

  function journeyMarkup(stage) {
    const task = taskContext?.taskId ? taskById(taskContext.taskId) : null;
    const type = task?.callType || activeType;
    const scenarioTypes = { '人工外呼': 'MANUAL_OUTBOUND', '预外呼': 'PREDICTIVE', 'IVR 外呼': 'IVR_OUTBOUND', '呼入': 'INBOUND' };
    const scenarioType = scenarioTypes[type];
    const noTask = ['人工外呼', '呼入'].includes(type);
    const actions = {
      records: `CloudCallRecords.switchView('records')`,
      results: `CloudCallRecords.switchView('callbacks')`
    };
    if (scenarioType) actions.prepare = `ScenarioReadiness.open('${scenarioType}')`;
    if (type === '预外呼') actions.create = `navigateTo('predictive-tasks')`;
    if (type === 'IVR 外呼') actions.create = `navigateTo('ivr-tasks')`;
    if (task) actions.monitor = `CloudCallRecords.returnTask()`;
    const skipped = noTask || type === '全部' ? ['create', 'monitor'] : [];
    return ui.journey({ current: stage, context: task ? `${task.name} · ${type}` : `${type === '全部' ? '全部云呼叫' : type} · ${stage === 'records' ? '通话记录' : '结果回查'}`, branch: task ? '当前任务范围' : noTask ? '无需中台任务' : '当前查询范围', actions, skipped, notes: noTask ? { create: '无需创建任务', monitor: type === '人工外呼' ? '工作台 / 业务系统执行' : '客户来电触发' } : {} });
  }

  function recordRows() {
    window.CustomerDirectory?.sync();
    let rows = scoped(CloudCallData.calls);
    if (taskContext?.taskId) rows = rows.filter(item => item.taskId === taskContext.taskId);
    if (nativeAgentId) rows = rows.filter(item => (item.agentIdentityId || item.contactCenterIdentityId) === nativeAgentId && item.callSource === 'NATIVE_WORKBENCH');
    if (recordSource) rows = rows.filter(item => recordSource === 'NATIVE_WORKBENCH' ? item.callSource === recordSource : !!item.businessSystemId);
    rows = rows.slice().sort((a,b) => String(b.ringingAt || b.recordedAt || '').localeCompare(String(a.ringingAt || a.recordedAt || '')));
    if (activeType !== '全部') rows = rows.filter(item => item.callType === activeType);
    if (recordKeyword) rows = rows.filter(item => [item.callId, item.contactId, item.caller, item.callee, item.agentName, item.customerName].join(' ').toLowerCase().includes(recordKeyword.toLowerCase()));
    if (recordResult) rows = rows.filter(item => item.result === recordResult);
    if (recordingFilter === '可播放') rows = rows.filter(item => item.recordingStatus === '可播放');
    if (recordingFilter === '不适用') rows = rows.filter(item => item.recordingApplicability === 'NOT_APPLICABLE_PURE_IVR');
    if (recordingFilter === '待判定') rows = rows.filter(item => item.recordingApplicability === '待判定');
    return rows;
  }

  function setType(type) { activeType = type; recordPage = 1; navigateTo('cloud-call-records', { type, preserveContext:true }); }

  function renderRecords(options) {
    syncContext(options,'calls');
    const rows = recordRows();
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    if (recordPage > pageCount) recordPage = pageCount;
    const pageRows = rows.slice((recordPage - 1) * pageSize, recordPage * pageSize);
    const tabs = ['全部', '人工外呼', '预外呼', 'IVR 外呼', '呼入'];
    return `<section class="platform-page call-record-page" data-anno-page="cloud-call-records" data-anno-label="云呼叫分型记录与录音边界" data-anno-kind="region" data-anno-fields="FLD-046,FLD-047,FLD-048,FLD-049,FLD-050,FLD-051,FLD-052,FLD-053">
      ${taskReturnBar()}
      ${nativeAgentId ? '<div class="seat-saved"><span>我的坐席 · 中台直接外呼记录</span><div><button class="btn-link" onclick="navigateTo(\'cloud-call-records\')">查看全部通话</button><button class="btn" onclick="AgentWorkbench.open()">返回我的坐席</button></div></div>' : ''}
      ${ui.pageHeader('通话记录', '查看人工外呼、预外呼、IVR 外呼和呼入的通话结果。')}
      ${journeyMarkup('records')}
      <div class="record-type-tabs">${tabs.map(type => `<button class="${type === activeType ? 'active' : ''}" onclick="window.Pages['cloud-call-records'].setType('${type}')">${type}</button>`).join('')}</div>
      <div class="filter-panel"><label class="field"><span>通话编号 / 客户号码</span><input id="recordKeyword" value="${esc(recordKeyword)}" placeholder="请输入通话编号或号码"></label><label class="field"><span>通话结果</span><select id="recordResult"><option value="">全部</option>${['接通','完成','排队超时','无人接听','客户忙线','已取消','演示中断'].map(value=>`<option${recordResult===value?' selected':''}>${value}</option>`).join('')}</select></label><label class="field"><span>呼叫来源</span><select id="recordSource"><option value="">全部</option><option value="NATIVE_WORKBENCH"${recordSource==='NATIVE_WORKBENCH'?' selected':''}>中台控制台</option><option value="BUSINESS_SYSTEM"${recordSource==='BUSINESS_SYSTEM'?' selected':''}>业务系统</option></select></label><label class="field"><span>录音状态</span><select id="recordingFilter"><option value="">全部</option><option${recordingFilter==='可播放'?' selected':''}>可播放</option><option value="不适用"${recordingFilter==='不适用'?' selected':''}>不适用</option><option${recordingFilter==='待判定'?' selected':''}>待判定</option></select></label><div class="filter-actions"><button class="btn" onclick="window.Pages['cloud-call-records'].resetFilters()">重置</button><button class="btn btn-primary" onclick="window.Pages['cloud-call-records'].query()">查询</button></div></div>
      <div class="cloud-record-list-shell">${ui.toolbar('<button class="btn" onclick="doExport(event)">导出</button>', '<span>'+ui.help('智能外呼通话记录保留在“智能外呼记录”菜单中，本页只展示云呼叫。','记录范围说明')+'</span>')}
      ${ui.table([
        { key: 'callId', label: '通话编号', render: value => `<button class="table-link" onclick="window.Pages['cloud-call-records'].openCall('${value}')"><strong>${esc(value)}</strong></button>` },
        { key: 'callType', label: '业务类型 / 来源', render: (value, row) => `<span class="call-type type-${value === '呼入' ? 'in' : value === 'IVR 外呼' ? 'ivr' : 'out'}">${esc(value)}</span><div class="table-sub">${row.callSource==='NATIVE_WORKBENCH'?'中台控制台':row.businessSystemId?'业务系统':'—'} · ${esc(window.CustomerDirectory?.provenance(row) || '演示记录')}</div>` },
        { key: 'direction', label: '方向' }, { key: 'caller', label: '主叫号码' }, { key: 'callee', label: '被叫号码' },
        { key: 'agentName', label: '坐席', render: value => esc(value || '无人参与') }, { key: 'answeredAt', label: '接通时间' },
        { key: 'durationSeconds', label: '通话时长', help: '旧联系历史可能没有时长；显示“未记录”，不补成 0 秒。', render: value => formatDuration(value) }, { key: 'result', label: '结果', render: value => ui.status(value) },
        { key: 'recordingStatus', label: '录音', render: (value, row) => row.recordingApplicability === 'NOT_APPLICABLE_PURE_IVR' ? '<span class="status-badge neutral"><i></i>纯 IVR 不适用</span>' : row.recordingStatus === '可播放' ? ui.status(value) : ui.status(row.recordingApplicability === '待判定' ? '待判定' : value) },
        { key: 'callbackStatus', label: '结果回传', render: value => ui.status(value) },
        { key: 'callId', label: '操作', className: 'action-column', render: value => `<div class="table-actions"><button onclick="window.Pages['cloud-call-records'].openCall('${value}')">查看</button></div>` }
      ], pageRows, { rowOffset:(recordPage-1)*pageSize, emptyText: taskContext?.taskId ? '当前任务尚未产生该类型通话' : '未找到符合条件的通话记录', emptyDetail: '可重置筛选后重新查询。', footer: ui.pagination(rows.length, recordPage, pageSize, "window.Pages['cloud-call-records'].setPage") })}
      </div>
    </section>`;
  }

  function query() {
    recordSource = document.getElementById('recordSource')?.value || '';
    recordKeyword = (document.getElementById('recordKeyword')?.value || '').trim();
    recordResult = document.getElementById('recordResult')?.value || '';
    recordingFilter = document.getElementById('recordingFilter')?.value || '';
    recordPage = 1;
    navigateTo('cloud-call-records', { type: activeType, preserveContext:true });
  }

  function resetFilters() {
    recordSource = '';
    recordKeyword = '';
    recordResult = '';
    recordingFilter = '';
    recordPage = 1;
    navigateTo('cloud-call-records', { type: activeType, preserveContext:true });
  }

  function setPage(page) {
    recordPage = Math.max(1, Number(page) || 1);
    navigateTo('cloud-call-records', { type: activeType, preserveContext:true });
  }

  function callbackRows() {
    let callbacks = scoped(CloudCallData.callbacks);
    if (taskContext?.taskId) {
      const callIds = new Set(scoped(CloudCallData.calls).filter(item => item.taskId === taskContext.taskId).map(item => item.callId));
      callbacks = callbacks.filter(item => callIds.has(item.callId));
    }
    if (activeType!=='全部') callbacks=callbacks.filter(item=>CloudCallRuntime.call(item.callId)?.callType===activeType);
    if (callbackStatusFilter) callbacks = callbacks.filter(item => item.status === callbackStatusFilter);
    return callbacks.map(item => {
      const call = CloudCallRuntime.call(item.callId) || {};
      const system = (CloudCallData.businessSystems || []).find(systemItem => systemItem.businessSystemId === item.businessSystemId);
      return { ...item, businessSystemName: system?.name || item.businessSystemId, callType: call.callType, agentName: call.agentName, result: call.result, lastAttempt: item.attempts.at(-1)?.at || '—', attemptCount: item.attempts.length };
    });
  }

  function renderCallbacks(options) {
    syncContext(options,'results');
    const rows = callbackRows();
    return `<section class="platform-page callback-page" data-anno-page="cloud-callbacks" data-anno-label="业务结果回流与异常闭环" data-anno-kind="region" data-anno-fields="FLD-046,FLD-047,FLD-053">
      ${taskReturnBar()}
      ${ui.pageHeader('结果回流', '查看通话结果是否已经成功送达业务系统。')}
      ${journeyMarkup('results')}
      <div class="filter-panel"><label class="field"><span>回传状态</span><select id="callbackStatusFilter"><option value="">全部</option><option${callbackStatusFilter==='成功'?' selected':''}>成功</option><option${callbackStatusFilter==='失败'?' selected':''}>失败</option></select></label><div class="filter-actions"><button class="btn" onclick="window.Pages['cloud-call-records'].resetCallbackFilters()">重置</button><button class="btn btn-primary" onclick="window.Pages['cloud-call-records'].queryCallbacks()">查询</button></div></div>
      <div class="kpi-grid">${ui.kpi('回传记录', rows.length, '当前范围')}${ui.kpi('成功', rows.filter(item => item.status === '成功').length, '已送达业务系统')}${ui.kpi('失败', rows.filter(item => item.status === '失败').length, (AppState.effectiveAccess().roleCode==='OPERATOR'?'由租户管理员处理':'可在本页重新发送'), 'warning')}${ui.kpi('重试次数', rows.reduce((sum, item) => sum + Math.max(0, item.attemptCount - 1), 0), '按单条记录重试')}</div>
      <div class="cloud-record-list-shell">${ui.toolbar('<button class="btn" onclick="showToast(\'结果状态已刷新\',\'success\')">刷新状态</button>', '<span>'+ui.help('结果回传失败不会改变已经生成的通话结果，可在待办中单独处理。','结果回传说明')+'</span>')}
      ${ui.table([
        { key: 'callbackId', label: '回流编号', render: (value, row) => `<button class="table-link" onclick="window.Pages['cloud-call-records'].openCallback('${value}')"><strong>${esc(value)}</strong><small>${esc(row.callId)}</small></button>` },
        { key: 'businessSystemName', label: '目标业务系统' }, { key: 'businessRecordId', label: '业务记录' },
        { key: 'callType', label: '通话类型' }, { key: 'agentName', label: '坐席', render: value => esc(value || '无人参与') },
        { key: 'result', label: '通话终态', render: value => ui.status(value) }, { key: 'status', label: '回流状态', render: value => ui.status(value) },
        { key: 'attemptCount', label: '尝试次数' }, { key: 'lastAttempt', label: '最近尝试' },
        { key: 'callbackId', label: '操作', className: 'action-column', render: (value, row) => `<div class="table-actions"><button onclick="window.Pages['cloud-call-records'].openCallback('${value}')">查看</button>${row.status === '失败' && AppState.effectiveAccess().roleCode !== 'OPERATOR' ? `<button onclick="window.Pages['cloud-call-records'].retry('${value}')">重新发送</button>` : ''}</div>` }
      ], rows, { emptyText: taskContext?.taskId ? '当前任务暂无结果回流记录' : '当前范围暂无结果回流记录' })}
      </div>
    </section>`;
  }

  function queryCallbacks() {
    callbackStatusFilter = document.getElementById('callbackStatusFilter')?.value || '';
    navigateTo('cloud-callbacks', { view: 'callbacks' });
  }

  function resetCallbackFilters() {
    callbackStatusFilter = '';
    navigateTo('cloud-callbacks', { view: 'callbacks' });
  }

  function render(options) { view = options?.view || view; return view === 'callbacks' ? renderCallbacks(options) : renderRecords(options); }

  function evidence(call) {
    const item = call.ivrEvidence;
    if (!item) return '';
    return `<section class="evidence-card"><div class="panel-header"><div><h2>IVR 结构化执行证据</h2><p>${call.recordingApplicability === 'NOT_APPLICABLE_PURE_IVR' ? '替代不适用的纯 IVR 录音' : '与有人参与阶段录音共同说明完整执行'}</p></div></div><div class="panel-body"><div class="evidence-grid"><div><span>联系流 / 版本</span><strong>${esc(item.contactFlow)} · ${esc(item.flowVersion)}</strong></div><div><span>素材版本</span><strong>${esc(item.mediaVersion)}</strong></div><div><span>拨号时间</span><strong>${esc(item.dialAt || call.ringingAt)}</strong></div><div><span>退出码 / 终态</span><strong>${esc(item.exitCode)} · ${esc(item.finalState)}</strong></div></div>${ui.timeline((item.nodes || []).map(node => ({ title: `${node.node} · ${node.action}`, time: node.at })))}</div></section>`;
  }

  function recordingMarkup(call) {
    if (call.directoryMeta?.legacyOnly) return '<div class="empty-state compact"><strong>历史联系记录未包含录音</strong><span>保留原始结果与备注，不补造音频或下载链接。</span></div>';
    if (call.callSource === 'NATIVE_WORKBENCH' && call.simulation) return '<div class="empty-state compact"><strong>演示通话，不产生真实录音</strong><span>本地未接入真实电话线路，不提供播放或下载链接。</span></div>';
    if (call.recordingApplicability === 'NOT_APPLICABLE_PURE_IVR') return '<div class="empty-state compact"><div class="empty-icon">◇</div><strong>本次自动语音通话不提供录音</strong><span>可在“执行过程”中查看播放、按键和最终结果。</span></div>';
    const actions = call.recordingStatus === '可播放'
      ? `<div class="recording-actions"><button class="btn btn-primary" onclick="showToast('正在请求临时录音链接','info')">播放录音</button><button class="btn" onclick="showToast('已申请临时下载链接','success')">下载录音</button></div>`
      : '<span class="recording-unavailable">当前没有可播放或可下载的录音</span>';
    return `<section class="recording-card"><div><span>录音来源</span><strong>${esc(call.recordingSource)}</strong></div><div><span>覆盖范围</span><strong>${esc(call.recordingScope)}</strong></div><div><span>当前状态</span>${ui.status(call.recordingStatus)}</div><div><span>临时链接有效期</span><strong>${esc(call.recordingUrlExpiresAt || '生成后 24 小时')}</strong></div>${actions}</section>`;
  }

  function openCall(id) {
    window.CustomerDirectory?.sync();
    const call = CloudCallRuntime.call(id);
    if (!call || !AppState.authorizeObject('', call)) return;
    const pure = call.recordingApplicability === 'NOT_APPLICABLE_PURE_IVR';
    const task = taskById(call.taskId);
    const system = (CloudCallData.businessSystems || []).find(item => item.businessSystemId === call.businessSystemId);
    const skill = (CloudCallData.physicalSkillGroups || []).find(item => item.skillGroupId === call.skillGroupId);
    const history = [
      { title: call.directoryMeta?.legacyOnly ? '历史记录时间' : '开始呼叫', time: call.ringingAt || call.recordedAt || '—', detail: call.direction + ' · ' + call.caller },
      ...(call.answeredAt && call.answeredAt !== '—' ? [{ title: call.agentName ? '坐席接听' : '客户接通', time: call.answeredAt, detail: call.agentName || call.callType }] : []),
      { title: '通话结束', time: call.endedAt || '—', detail: call.result + ' · ' + formatDuration(call.durationSeconds) },
      { title: call.callSource === 'NATIVE_WORKBENCH' ? '话后处理' : '结果回传', time: call.dispositionAt || call.endedAt || '—', detail: call.callSource === 'NATIVE_WORKBENCH' ? (call.processingStatus || '待填写') : call.callbackStatus }
    ];
    ui.openLayer('cloud-call-detail',
      '<div class="layer-header"><div><h2>通话详情</h2><p>' + esc(call.callType) + ' · ' + esc(call.answeredAt || call.ringingAt || '—') + '</p></div><button onclick="PlatformUI.closeLayer(\'cloud-call-detail\')">×</button></div>' +
      '<div class="layer-body">' +
      ui.detailSection('基本信息', '<dl class="detail-grid"><dt>通话类型</dt><dd>' + esc(call.callType) + '</dd><dt>呼叫方向</dt><dd>' + esc(call.direction) + '</dd><dt>所属租户</dt><dd>' + esc(CloudCallRuntime.tenant(call.tenantId)?.name || '—') + '</dd><dt>客户号码</dt><dd>' + esc(call.direction === '呼入' ? call.caller : call.callee) + '</dd><dt>外部单据标识</dt><dd>' + esc(call.externalDocumentId || '—') + '</dd><dt>数据来源</dt><dd>' + esc(window.CustomerDirectory?.provenance(call) || '演示记录') + '</dd></dl>') +
      ui.detailSection('业务信息', '<dl class="detail-grid"><dt>来源任务</dt><dd>' + esc(task?.name || (call.callSource === 'NATIVE_WORKBENCH' ? '中台控制台直接外呼' : call.callType === '人工外呼' ? '业务系统人工呼叫' : '—')) + '</dd><dt>业务系统</dt><dd>' + esc(system?.name || '—') + '</dd><dt>坐席</dt><dd>' + esc(call.agentName || (pure ? '无人参与' : '未接通')) + '</dd><dt>服务团队</dt><dd>' + esc(skill?.name || '不适用') + '</dd><dt>坐席处理结果</dt><dd>' + esc(call.agentDisposition || '—') + '</dd></dl>') +
      (call.callSource === 'NATIVE_WORKBENCH' || call.directoryMeta?.legacyOnly ? ui.detailSection('本次联系', '<dl class="detail-grid"><dt>客户称呼</dt><dd>' + esc(call.customerName) + '</dd><dt>联系备注</dt><dd>' + esc(call.customerNote || '—') + '</dd><dt>坐席技能组</dt><dd>' + esc(call.skillGroupName || skill?.name || '未记录') + '</dd><dt>处理进度</dt><dd>' + esc(call.processingStatus || '未记录') + '</dd><dt>处理备注</dt><dd>' + esc(call.dispositionRemark || '—') + '</dd></dl>') : '') +
      ui.detailSection('运行状态', '<dl class="detail-grid"><dt>通话结果</dt><dd>' + ui.status(call.result) + '</dd><dt>通话时长</dt><dd>' + formatDuration(call.durationSeconds) + '</dd><dt>结果回传</dt><dd>' + ui.status(call.callbackStatus) + '</dd></dl>') +
      ui.detailSection('录音', recordingMarkup(call)) +
      (call.ivrEvidence ? ui.detailSection('自动语音执行过程', evidence(call)) : '') +
      ui.detailSection('操作记录', ui.timeline(history)) +
      '<details class="technical-details"><summary>技术信息</summary><dl class="detail-grid"><dt>平台通话编号</dt><dd><code>' + esc(call.callId) + '</code></dd><dt>厂商通话编号</dt><dd><code>' + esc(call.contactId) + '</code></dd><dt>业务记录编号</dt><dd><code>' + esc(call.businessRecordId || '—') + '</code></dd></dl></details>' +
      '</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'cloud-call-detail\')">关闭</button></div>',
      'wide'
    );
  }

  function openCallback(id) {
    const row = CloudCallData.callbacks.find(item => item.callbackId === id);
    const call = row && CloudCallRuntime.call(row.callId);
    if (!row || !call || !AppState.authorizeObject('', row)) return;
    const linked = CloudCallData.exceptions.find(item => item.objectId === id && !['已关闭', '已处理'].includes(item.status));
    const system = (CloudCallData.businessSystems || []).find(item => item.businessSystemId === row.businessSystemId);
    ui.openLayer('callback-detail',
      '<div class="layer-header"><div><h2>结果回传详情</h2><p>' + esc(system?.name || row.businessSystemId) + ' · ' + esc(row.status) + '</p></div><button onclick="PlatformUI.closeLayer(\'callback-detail\')">×</button></div>' +
      '<div class="layer-body">' +
      ui.detailSection('基本信息', '<dl class="detail-grid"><dt>目标业务系统</dt><dd>' + esc(system?.name || row.businessSystemId) + '</dd><dt>业务记录</dt><dd>' + esc(row.businessRecordId) + '</dd><dt>通话结果</dt><dd>' + ui.status(call.result) + '</dd><dt>坐席处理结果</dt><dd>' + esc(call.agentDisposition || '—') + '</dd></dl>') +
      ui.detailSection('运行状态', '<dl class="detail-grid"><dt>回传状态</dt><dd>' + ui.status(row.status) + '</dd><dt>尝试次数</dt><dd>' + row.attempts.length + '</dd><dt>最近结果</dt><dd>' + esc(row.error || '已成功送达') + '</dd></dl>') +
      ui.detailSection('操作记录', ui.timeline(row.attempts.map(attempt => ({ title: attempt.result.includes('200') ? '送达成功' : '送达失败', time: attempt.at, detail: attempt.result, tone: attempt.result.includes('200') ? '' : 'danger' })))) +
      '<details class="technical-details"><summary>技术信息</summary><dl class="detail-grid"><dt>回传编号</dt><dd><code>' + esc(row.callbackId) + '</code></dd><dt>通话编号</dt><dd><code>' + esc(call.callId) + ' / ' + esc(call.contactId) + '</code></dd><dt>请求标识</dt><dd><code>' + esc(row.attempts.map(attempt => attempt.requestId).join('、')) + '</code></dd></dl></details>' +
      '</div><div class="layer-footer"><span class="layer-footer-note">' + (AppState.effectiveAccess().roleCode === 'OPERATOR' && row.status === '失败' ? '失败项由租户管理员处理；通话结果不受影响。' : '重试只处理结果送达，不改变通话结果。') + '</span><button class="btn" onclick="PlatformUI.closeLayer(\'callback-detail\')">关闭</button>' + (row.status === '失败' && AppState.effectiveAccess().roleCode !== 'OPERATOR' ? '<button class="btn btn-primary" onclick="PlatformUI.closeLayer(\'callback-detail\');window.Pages[\'cloud-call-records\'].retry(\'' + esc(id) + '\')">' + '重新发送' + '</button>' : '') + '</div>',
      'wide'
    );
  }

  function retry(id) {
    if (AppState.effectiveAccess().roleCode === 'OPERATOR') { showToast('该失败项由租户管理员处理', 'info'); return false; }
    const row = CloudCallData.callbacks.find(item => item.callbackId === id);
    if (!row || row.status !== '失败' || AppState.get().activeDomain !== 'CLOUD_CONTACT_CENTER' || !AppState.authorizeObject('', row)) return;
    const linked = CloudCallData.exceptions.find(item => item.objectId === id && !['已关闭', '已处理'].includes(item.status));
    row.attempts.push({ at: new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-'), result: 'HTTP 200', requestId: `${row.callbackId}-RETRY-${row.attempts.length}` });
    row.status = '成功'; row.error = '';
    const call = CloudCallRuntime.call(row.callId);
    if (call) call.callbackStatus = '成功';
    if (linked) BusinessIssues.record(linked, '重新发送结果', '已送达（本地演示）', true);
    CloudCallRuntime.addAudit('业务结果回流重试', id, row.tenantId, '失败', '成功（通话终态未变）');
    showToast('演示结果已送达；通话结果保持不变', 'success'); navigateTo('cloud-callbacks',{preserveContext:true});
  }

  function openFromTask(taskId, tab, target) {
    saveTaskContext({ taskId, tab: tab || 'calls' });
    navigateTo(target === 'callbacks' ? 'cloud-callbacks' : 'cloud-call-records', { taskId, returnTab: tab || 'calls', view: target === 'callbacks' ? 'callbacks' : 'records' });
  }
  function switchView(target) { navigateTo(target === 'callbacks' ? 'cloud-callbacks' : 'cloud-call-records', { view: target === 'callbacks' ? 'callbacks' : 'records', type: activeType, preserveContext:true }); }
  function returnTask() { const context = taskContext; saveTaskContext(null); if (context?.taskId) CloudTaskWorkspace.openTask(context.taskId, context.tab || 'calls'); }
  function clearTaskContext() { saveTaskContext(null); activeType='全部'; navigateTo(view === 'callbacks' ? 'cloud-callbacks' : 'cloud-call-records', { view }); }

  window.CloudCallRecords = { openFromTask, switchView, returnTask, clearTaskContext };
  window.Pages = window.Pages || {};
  window.Pages['cloud-call-records'] = { render, init(options) { if (options?.callId) openCall(options.callId); }, setType, query, resetFilters, setPage, queryCallbacks, resetCallbackFilters, openCall, openCallback, retry };
})();
