/** 云呼叫四类记录、录音适用性与本平台结果归档。 */
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
  let dateStart='',dateEnd='',queryPlan=null;
  let nativeAgentId = '';
  const pageSize = 10;
  let taskContext = loadTaskContext();


  function syncContext(options,tab){
    const opts=options||{};
    if (!opts.preserveContext) { dateStart='';dateEnd='';queryPlan=null; nativeAgentId = opts.nativeAgentId || ''; recordSource = ''; }
    if(opts.taskId){saveTaskContext({taskId:opts.taskId,tab:opts.returnTab||tab});activeType=taskById(opts.taskId)?.callType||'全部';recordPage=1;recordKeyword='';recordResult='';recordingFilter='';}
    else if(!opts.preserveContext){saveTaskContext(null);activeType=opts.type||opts.filter||'全部';recordPage=1;recordKeyword='';recordResult='';recordingFilter='';}
    if(opts.type||opts.filter)activeType=opts.type||opts.filter;
  }
  function scoped(rows) { return AppState.scoped(rows || []); }
  function loadTaskContext() { try { return JSON.parse(sessionStorage.getItem(returnKey) || 'null'); } catch (error) { return null; } }
  function saveTaskContext(value) { taskContext = value; if (value) sessionStorage.setItem(returnKey, JSON.stringify(value)); else sessionStorage.removeItem(returnKey); }
  const textValue = value => typeof value === 'string' && value.trim() ? value : '';
  const secondsValue = value => (typeof value === 'number' || typeof value === 'string' && /^\d+$/.test(value)) && Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  const localTime = value => { const at = typeof value === 'number' ? value : Date.parse(value || ''); return Number.isFinite(at) && at > 0 ? at : null; };
  function formatDuration(seconds) { const value=secondsValue(seconds); return value===null?'未记录':`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`; }
  function taskById(id) { return (CloudCallData.tasks || []).find(item => item.taskId === id && AppState.authorizeObject('',item)); }
  const stateTime = at => localTime(at) ? new Date(localTime(at)).toLocaleString('sv-SE') : '—';
  function display(call) {
    const facts=AliCtiReportFacts.read(call), state={...CallState.view(call)}, raw=facts.usable?facts.raw:{};
    const inbound=call.callType==='呼入',automatic=call.callType==='IVR 外呼';
    const trustedLocal=!facts.present;
    const startAt=facts.present?facts.startAtMs:localTime(call.ringingAt||call.recordedAt);
    const endAt=facts.present?facts.endAtMs:localTime(state.endedAt||call.endedAt);
    const customerAt=facts.present?facts.customerAnsweredAtMs:localTime(state.customerEstablishedAt);
    const agentAt=facts.present?facts.agentAnsweredAtMs:localTime(state.agentEstablishedAt);
    if(facts.present&&!facts.usable)Object.assign(state,{answerResult:'UNKNOWN',answerLabel:'待确认',answered:null,known:false,agentAnswered:null,stage:null,stageLabel:'未记录',ended:false,numberStatus:{label:'—',help:'未取得可关联到本通电话的号码状态'}});
    else if(endAt)Object.assign(state,{stage:'RELEASED',stageLabel:'已结束',ended:true});
    else if(facts.present)Object.assign(state,{stage:null,stageLabel:'未记录',ended:false});
    Object.assign(state,{customerEstablishedAt:customerAt,agentEstablishedAt:agentAt,endedAt:endAt});
    const agentName=facts.present?textValue(raw[inbound?'firstCallCname':'clientName']):textValue(call.agentName);
    const agentCno=facts.present?facts.primaryAgentCno:textValue(call.cno);
    const caller=(inbound?facts.customerNumber:textValue(raw[facts.kind==='manual'?'leftClid':'clid']))||(!facts.present||facts.usable?textValue(call.caller):'');
    const callee=(inbound?textValue(raw.hotline):facts.customerNumber)||(!facts.present||facts.usable?textValue(call.callee):'');
    return {
      state,facts,inbound,automatic,startAt,endAt,customerAt,agentAt,
      customerNumber:facts.customerNumber||(inbound?caller:callee),caller,callee,
      durationSeconds:facts.present?(automatic?facts.customerSeconds:facts.bridgeSeconds):secondsValue(call.durationSeconds),
      customerSeconds:facts.customerSeconds,totalSeconds:secondsValue(raw.totalDuration),
      agentName,agentCno,agentText:[agentName,agentCno].filter(Boolean).join(' · ')||'未记录',
      queueNo:facts.primaryQueueNo,queueName:inbound?textValue(raw.firstCallQname):'',
      ivrName:textValue(raw.ivrName),ivrId:textValue(raw.ivrId)||(Number.isSafeInteger(raw.ivrId)&&raw.ivrId>0?raw.ivrId:null),
      retryRound:facts.telRetryRound,finishRetryFlag:[0,1,'0','1'].includes(raw.finishRetryFlag)?Number(raw.finishRetryFlag):null,
      providerCallId:facts.callId||facts.mainUniqueId||facts.uniqueId||(trustedLocal?textValue(call.providerCallId||call.alictiCallId||call.providerMainUniqueId):''),
      resultLabel:inbound&&['人工接听','人工未接听','系统应答','系统未应答'].includes(raw.status)?raw.status:state.known?state.answerLabel:'结果未知'
    };
  }
  function relatedTask(call) {
    const facts=AliCtiReportFacts.read(call);
    if(facts.present&&!facts.usable)return null;
    const enterprise=String(call.providerEnterpriseId??call.enterpriseId??'');
    if(!enterprise||!call.tenantId)return null;
    const matches=(CloudCallData.tasks||[]).filter(task=>String(task.enterpriseId??'')===enterprise&&task.tenantId===call.tenantId&&task.callType===call.callType&&AppState.authorizeObject('',task));
    const providerId=task=>task.providerTaskId??task.demoProviderTaskId??task.alictiMockTaskProperty?.id;
    if(call.taskId){
      const task=matches.find(item=>item.taskId===call.taskId);
      return task&&(!facts.taskId||providerId(task)!=null&&String(providerId(task))===facts.taskId)?task:null;
    }
    const byProvider=facts.taskId?matches.filter(task=>providerId(task)!=null&&String(providerId(task))===facts.taskId):[];
    return byProvider.length===1?byProvider[0]:null;
  }
  const stateOf = call => display(call).state;
  function answerMarkup(call) {
    return ui.status(display(call).resultLabel);
  }
  function numberStatusMarkup(call) {
    const number = stateOf(call).numberStatus;
    return '<span title="' + esc(number.help) + '">' + esc(number.label) + '</span>';
  }
  function journeyMarkup(stage) {
    const task = taskContext?.taskId ? taskById(taskContext.taskId) : null;
    const type = task?.callType || activeType;
    const scenarioTypes = { '人工外呼': 'MANUAL_OUTBOUND', '预外呼': 'PREDICTIVE', 'IVR 外呼': 'IVR_OUTBOUND', '呼入': 'INBOUND' };
    const scenarioType = scenarioTypes[type];
    const noTask = ['人工外呼', '呼入'].includes(type);
    const actions = {
      records: `CloudCallRecords.switchView('records')`,
      results: `CloudCallRecords.switchView('records')`
    };
    if (scenarioType) actions.prepare = `ScenarioReadiness.open('${scenarioType}')`;
    if (type === '预外呼') actions.create = `RouteRuntime.openSecondary('predictive-tasks')`;
    if (type === 'IVR 外呼') actions.create = `RouteRuntime.openSecondary('ivr-tasks')`;
    if (task) actions.monitor = `CloudCallRecords.returnTask()`;
    const skipped = noTask || type === '全部' ? ['create', 'monitor'] : [];
    return ui.journey({ current: stage, context: task ? `${task.name} · ${type}` : `${type === '全部' ? '全部云呼叫' : type} · ${stage === 'records' ? '通话记录' : '结果回查'}`, branch: task ? '当前任务范围' : noTask ? '无需中台任务' : '当前查询范围', actions, skipped, notes: noTask ? { create: '无需创建任务', monitor: type === '人工外呼' ? '坐席工作台执行' : '客户来电触发' } : {} });
  }

  function recordRows() {
    window.CustomerDirectory?.sync();
    let rows = scoped(CloudCallData.calls);
    if(dateStart&&dateEnd)rows=rows.filter(row=>{const time=display(row).startAt;return time!==null&&time>=Date.parse(dateStart)&&time<=Date.parse(dateEnd);});
    if (taskContext?.taskId) rows = rows.filter(item => relatedTask(item)?.taskId === taskContext.taskId);
    if (nativeAgentId) rows = rows.filter(item => (item.agentIdentityId || item.contactCenterIdentityId) === nativeAgentId && item.callSource === 'NATIVE_WORKBENCH');
    if (recordSource) rows = rows.filter(item => recordSource === 'NATIVE_WORKBENCH' ? item.callSource === recordSource : item.callSource === 'LOCAL_TASK_SIMULATION' || !!item.taskId);
    if (activeType !== '全部') rows = rows.filter(item => item.callType === activeType);
    if (recordKeyword) rows = rows.filter(item => {const data=display(item);return [item.callId,data.providerCallId,data.caller,data.callee,data.agentText,item.customerName].join(' ').toLowerCase().includes(recordKeyword.toLowerCase());});
    if (recordResult) rows = rows.filter(item => stateOf(item).answerLabel === recordResult);
    if (recordingFilter) rows = rows.filter(item => {
      const media = CloudCallMedia.resolve(item);
      if (recordingFilter === '可播放') return !!media.url;
      if (recordingFilter === '不适用') return media.status === '纯 IVR 不适用';
      if (recordingFilter === '待判定') return media.status === '录音待判定';
      return media.status === recordingFilter;
    });
    return ui.sortByUpdated?.(rows,call=>{const data=display(call);return [data.endAt,data.startAt];})||rows;
  }

  function setType(type) { activeType = type; recordPage = 1; queryPlan=null; navigateTo('cloud-call-records', { type, preserveContext:true }); }

  function renderRecords(options) {
    syncContext(options,'calls');
    const rows = recordRows();
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    if (recordPage > pageCount) recordPage = pageCount;
    const pageRows = rows.slice((recordPage - 1) * pageSize, recordPage * pageSize);
    const tabs = ['全部', '人工外呼', '预外呼', 'IVR 外呼', '呼入'];
    return `<section class="platform-page call-record-page">
      ${nativeAgentId ? '<div class="seat-saved"><span>我的坐席 · 中台直接外呼记录</span><div><button class="btn-link" onclick="navigateTo(\'cloud-call-records\')">查看全部通话</button></div></div>' : ''}
      ${ui.pageHeader('通话记录', '查看人工外呼、预外呼、自动外呼和呼入的通话结果。')}
      ${journeyMarkup('records')}
      <div class="record-type-tabs">${tabs.map(type => `<button class="${type === activeType ? 'active' : ''}" onclick="window.Pages['cloud-call-records'].setType('${type}')">${esc(ui.callTypeLabel(type))}</button>`).join('')}</div>
      <div class="filter-panel"><label class="field"><span>通话编号 / 客户号码</span><input id="recordKeyword" value="${esc(recordKeyword)}" placeholder="请输入通话编号或号码"></label><label class="field"><span>客户接通</span><select id="recordResult"><option value="">全部</option>${['已接通','未接通','待确认'].map(value=>`<option value="${value}"${recordResult===value?' selected':''}>${value==='待确认'?'结果未知':value}</option>`).join('')}</select></label><label class="field"><span>呼叫来源</span><select id="recordSource"><option value="">全部</option><option value="NATIVE_WORKBENCH"${recordSource==='NATIVE_WORKBENCH'?' selected':''}>中台控制台</option><option value="LOCAL_TASK_SIMULATION"${recordSource==='LOCAL_TASK_SIMULATION'?' selected':''}>平台任务</option></select></label><label class="field"><span>录音状态</span><select id="recordingFilter"><option value="">全部</option>${['可播放','演示音频','录音生成中','录音生成失败','录音链接已过期','未提供录音','演示无录音','不适用','待判定'].map(value=>`<option${recordingFilter===value?' selected':''}>${value}</option>`).join('')}</select></label><label class="field"><span>开始时间</span><input id="recordStart" type="datetime-local" value="${esc(dateStart)}"></label><label class="field"><span>结束时间</span><input id="recordEnd" type="datetime-local" value="${esc(dateEnd)}"></label><div class="filter-actions"><button class="btn" onclick="window.Pages['cloud-call-records'].resetFilters()">重置</button><button class="btn btn-primary" onclick="window.Pages['cloud-call-records'].query()">查询</button></div></div>
      <div class="cloud-record-list-shell">${ui.toolbar('<button class="btn" onclick="doExport(event)">导出</button>')}
      ${ui.table([
        { key: 'callId', label: '通话编号', render: value => `<button class="table-link" onclick="window.Pages['cloud-call-records'].openCall('${value}')"><strong>${esc(value)}</strong></button>` },
        { key: 'callType', label: '呼叫类型 / 来源', render: (value, row) => `<span class="call-type type-${value === '呼入' ? 'in' : value === 'IVR 外呼' ? 'ivr' : 'out'}">${esc(ui.callTypeLabel(value))}</span><div class="table-sub">${row.callSource==='NATIVE_WORKBENCH'?'中台控制台':row.taskId?'平台任务':row.callType==='呼入'?'客户来电':'平台记录'}</div>` },
        { key: 'result', label: '号码状态', help: '人工与预测外呼直接采用 AliCti 识别编码及名称，同码多义或缺少编码保留待确认。呼入使用软电话时，未提供号码识别显示 —，接听情况看接听状态。', render: (_, row) => numberStatusMarkup(row) },
        { key: 'result', label: '接听结果', help: '外呼显示客户接通结果，呼入显示接口接听状态。缺少结果不算未接通。', render: (_, row) => answerMarkup(row) },
        { key: 'caller', label: '主叫号码',render:(_,row)=>esc(display(row).caller||'未记录') }, { key: 'callee', label: '被叫号码',render:(_,row)=>esc(display(row).callee||'未记录') },
        { key: 'agentName', label: '坐席 / 工号', help:'呼入显示首呼坐席；流转工号在详情查看。',render:(_,row)=>esc(display(row).agentText) }, { key: 'answeredAt', label: '接听时间', help: '外呼为客户接通时间，呼入为首次坐席接听时间。', render: (_, row) => {const data=display(row);return stateTime(data.inbound?data.agentAt:data.customerAt);} },
        { key: 'durationSeconds', label: '通话时长', help: '自动外呼为客户接听时长；其他外呼为双方通话时长；呼入为话单通话时长。缺失不补零。', render: (_,row) => formatDuration(display(row).durationSeconds) },
        { key: 'recordingStatus', label: '录音', help: '演示音频为独立合成样例；可播放仅表示已有有效音频地址。纯 IVR、现场模拟和历史缺失记录不补造录音。', render: (_, row) => ui.status(CloudCallMedia.resolve(row).status) },
        { key: 'callId', label: '操作', className: 'action-column', render: (value, row) => `<div class="table-actions"><button onclick="window.Pages['cloud-call-records'].openCall('${value}')">${CloudCallMedia.resolve(row).url ? '录音 / 文本' : '查看'}</button></div>` }
      ], pageRows, { rowOffset:(recordPage-1)*pageSize, emptyText: taskContext?.taskId ? '当前任务尚未产生该类型通话' : '未找到符合条件的通话记录', emptyDetail: '可重置筛选后重新查询。', footer: ui.pagination(rows.length, recordPage, pageSize, "window.Pages['cloud-call-records'].setPage") })}
      </div>
    </section>`;
  }

  function query() {
    const start=document.getElementById('recordStart')?.value||'',end=document.getElementById('recordEnd')?.value||'';
    if(start||end){const kinds=activeType==='全部'?['manual','predictive','automatic','inbound']:[({'人工外呼':'manual','预外呼':'predictive','IVR 外呼':'automatic','呼入':'inbound'})[activeType]];const plans=kinds.map(kind=>AliCtiFields.cdrQuery(kind,start,end));const errors=plans.flatMap(p=>p.pending);if(errors.length)return showToast(errors.join('；'),'warning');queryPlan={mock:true,requests:plans.flatMap(p=>p.requests)};}else queryPlan=null;
    dateStart=start;dateEnd=end;
    recordSource = document.getElementById('recordSource')?.value || '';
    recordKeyword = (document.getElementById('recordKeyword')?.value || '').trim();
    recordResult = document.getElementById('recordResult')?.value || '';
    recordingFilter = document.getElementById('recordingFilter')?.value || '';
    recordPage = 1;
    navigateTo('cloud-call-records', { type: activeType, preserveContext:true });
  }

  function resetFilters() {
    dateStart='';dateEnd='';queryPlan=null;
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

  function render(options) { view = 'records'; return renderRecords(options); }

  function openCall(id) {
    window.CustomerDirectory?.sync();
    const call=CloudCallRuntime.call(id);
    if(!call||!AppState.authorizeObject('',call))return;
    CloudCallMedia.destroy();
    const data=display(call),{state,facts,inbound,automatic}=data,raw=facts.usable?facts.raw:{},task=relatedTask(call);
    const dt=(label,value)=>'<dt>'+esc(label)+'</dt><dd>'+esc(value??'未记录')+'</dd>';
    const grid=rows=>'<dl class="detail-grid">'+rows.map(([label,value])=>dt(label,value)).join('')+'</dl>';
    const contactLabel=window.RepeatPredictive?.contactLabel(call)||'';
    const sourceTask=task?.name||textValue(raw.taskName)||(inbound?'客户呼入':call.callType==='人工外呼'?'坐席主动外呼':'未记录');
    const agentLabel=inbound?'首呼坐席':'坐席';
    const resultRows=[['通话进度',state.stageLabel],['客户是否接通',state.known?state.answerLabel:'结果未知'],
      ...(inbound?[['呼入接听状态',data.resultLabel]]:[]),
      ['坐席接听',state.agentAnswered===true?'已接听':state.agentAnswered===false?'未接听':'未记录'],
      [automatic?'客户接听时长':inbound?'通话时长':'双方通话时长',formatDuration(data.durationSeconds)]];
    const times=[['开始呼叫',stateTime(data.startAt)],
      [inbound?'系统应答时间':'客户接通时间',stateTime(data.customerAt)],
      ...(!automatic?[[inbound?'首次坐席接听时间':'坐席接听时间',stateTime(data.agentAt)]]:[]),
      ['结束时间',stateTime(data.endAt)],
      [automatic?'客户接听时长':inbound?'通话时长':'双方通话时长',formatDuration(data.durationSeconds)],
      ...(facts.kind==='predictive'?[['客户接听时长',formatDuration(data.customerSeconds)]]:[]),
      ['呼叫总时长',formatDuration(data.totalSeconds)],
      ...(inbound?[
        ['首次进入队列时间',stateTime(facts.firstJoinQueueAtMs)],['首次离开队列时间',stateTime(facts.firstLeaveQueueAtMs)],['首次排队时长',formatDuration(facts.queueSeconds)]
      ]:[])];
    const participants=[[agentLabel,data.agentName||'未记录'],[agentLabel+'工号',data.agentCno||'未记录'],
      ...(facts.kind==='predictive'||inbound?[[inbound?'首呼队列编号':'队列编号',data.queueNo||'未记录']]:[]),
      ...(data.queueName?[['首呼队列名称',data.queueName]]:[]),
      ...(inbound&&Array.isArray(raw.cnoFlow)&&raw.cnoFlow.length?[['坐席流转工号',raw.cnoFlow.filter(textValue).join('、')||'未记录']]:[]),
      ...(inbound&&Array.isArray(raw.qnoFlow)&&raw.qnoFlow.length?[['队列流转编号',raw.qnoFlow.filter(textValue).join('、')||'未记录']]:[]),
      ...(automatic||data.ivrName||data.ivrId?[['本通语音流程',data.ivrName||'未记录'],...(data.ivrId!=null?[['语音流程编号',data.ivrId]]:[])]:[])];
    const taskRows=[['来源任务',sourceTask],...(task?[['平台任务编号',task.taskId]]:[]),
      ...(facts.taskId?[['AliCti 任务编号',facts.taskId]]:[]),
      ...(data.retryRound!==null?[[facts.kind==='automatic'?'重呼次数':'重试轮次',data.retryRound]]:[]),
      ...(data.finishRetryFlag!==null?[['是否最终一次呼叫',data.finishRetryFlag===1?'是':'否']]:[])];
    ui.openLayer('cloud-call-detail',
      '<div class="layer-header"><div><h2>通话详情 <small>'+esc(call.callId)+'</small></h2><p>'+esc(ui.callTypeLabel(call.callType))+' · '+esc(state.stageLabel+' · '+data.resultLabel)+'</p></div><button aria-label="关闭通话详情" onclick="PlatformUI.closeLayer(\'cloud-call-detail\')">×</button></div>'+
      '<div class="layer-body call-review-body"><div class="call-review-left">'+CloudCallMedia.render(call)+'</div><div class="call-review-right"><div class="call-review-tabs" role="tablist" aria-label="通话详情内容"><button role="tab" id="call-review-result-tab" aria-controls="call-review-result" aria-selected="true" onclick="CloudCallRecords.reviewTab(\'result\')">通话结果</button><button role="tab" id="call-review-info-tab" aria-controls="call-review-info" aria-selected="false" onclick="CloudCallRecords.reviewTab(\'info\')">详细信息</button></div><div class="call-review-pane" id="call-review-result" role="tabpanel" aria-labelledby="call-review-result-tab">'+
      ui.detailSection('接听结果',grid(resultRows)+'<dl class="detail-grid"><dt>号码状态识别</dt><dd>'+numberStatusMarkup(call)+'</dd></dl>')+
      ui.detailSection('本通坐席与语音',grid(participants))+
      ui.detailSection('业务信息',grid([['来源任务',sourceTask],...(contactLabel?[['联系轮次',contactLabel]]:[]),['坐席处理结果',CustomerDirectory.dispositionLabel(call)||'未填写']])+(window.RepeatPredictive?.contactOrigin(call)||'')+(task?window.RepeatPredictive?.callAction(call)||'':''))+
      ui.detailSection('本次客户业务信息',CustomerFollowup.detail(call.customerFollowup,call))+
      (call.customerNote||call.dispositionRemark?ui.detailSection('联系备注',grid([['客户称呼',call.customerName||'未记录'],['联系备注',call.customerNote||'—'],['处理备注',call.dispositionRemark||'—']])):'')+
      '</div><div class="call-review-pane" id="call-review-info" role="tabpanel" aria-labelledby="call-review-info-tab" hidden>'+
      ui.detailSection('基本信息',grid([['通话类型',ui.callTypeLabel(call.callType)],['所属租户',CloudCallRuntime.tenant(call.tenantId)?.name||'未记录'],['客户号码',data.customerNumber||'未记录'],['主叫号码',data.caller||'未记录'],['被叫号码',data.callee||'未记录'],['业务类型',CustomerBusiness.typeLabel(call)],[CustomerBusiness.codeLabel(call),call.externalDocumentId||'—']]))+
      ui.detailSection('通话时间与时长',grid(times))+
      (['预外呼','IVR 外呼'].includes(call.callType)?ui.detailSection('关联任务',grid(taskRows)+(task&&window.CloudTaskWorkspace?.renderTaskSettings?'<details class="technical-details"><summary>关联任务设置</summary>'+CloudTaskWorkspace.renderTaskSettings(task)+'</details>':'')):'')+
      '<details class="technical-details"><summary>通话标识</summary>'+grid([['平台通话编号',call.callId],['厂商通话编号',data.providerCallId||'未记录'],...(facts.mainUniqueId?[['主通话标识',facts.mainUniqueId]]:[]),...(facts.uniqueId?[['通话唯一标识',facts.uniqueId]]:[]),...(facts.requestUniqueId?[['请求标识',facts.requestUniqueId]]:[])])+
      '</details>'+
      '</div></div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'cloud-call-detail\')">关闭</button></div>','wide');
    CloudCallMedia.mount(document.getElementById('cloud-call-detail'),call);
  }

  function openFromTask(taskId, tab, target) {
    RouteRuntime.openSecondary('cloud-call-records', { taskId, returnTab: tab || 'calls', view: 'records' });
  }
  function switchView(target) { navigateTo('cloud-call-records', { view: 'records', type: activeType, preserveContext:true }); }
  function returnTask() { return RouteRuntime.back({ fallback: 'cloud-task-center' }); }
  window.CloudCallRecords = { display, relatedTask, formatDuration, stateTime, openFromTask, switchView, returnTask,
    reviewTab(key) {
      if (!['result', 'info'].includes(key)) return;
      ['result', 'info'].forEach(name => {
        const pane = document.getElementById('call-review-' + name), tab = document.getElementById('call-review-' + name + '-tab');
        if (pane) pane.hidden = name !== key;
        tab?.setAttribute('aria-selected', String(name === key));
      });
    },
    confirmDemo(id, outcome) {
      const call = CloudCallRuntime.call(id);
      const updated = call?.callSource === 'LOCAL_TASK_SIMULATION' ? window.ScenarioDemo?.confirmResult(call.taskId, id, outcome) : window.AgentWorkbench?.confirmDemoResult(id, outcome);
      if (updated) openCall(id);
    } };
  window.Pages = window.Pages || {};
  window.Pages['cloud-call-records'] = {
    captureNavigationState(){return {view,activeType,recordKeyword,recordResult,recordingFilter,recordPage,recordSource,dateStart,dateEnd,queryPlan,nativeAgentId,taskContext:taskContext?{...taskContext}:null};},
    restoreNavigationState(state){if(!state)return;({view,activeType,recordKeyword,recordResult,recordingFilter,recordPage,recordSource,dateStart,dateEnd,queryPlan,nativeAgentId}=state);saveTaskContext(state.taskContext);},
    render, init(options) { if (options?.callId) openCall(options.callId); }, setType, query, resetFilters, setPage, openCall };
})();
