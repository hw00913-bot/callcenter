/** PAGE-002：既有任务中心中的本版记录区，数据与管理模型由 DccRuntime 提供。 */
(function () {
  'use strict';
  const ui = () => window.PlatformUI, runtime = () => window.DccRuntime;
  const esc = value => ui().escape(value), clone = value => JSON.parse(JSON.stringify(value));
  const scenarios = () => window.DccMock?.importScenarios || {};
  const selectedScenarios = new Map(), importFeedback = new Map();
  const recordTabs = new Map(), selectedShardScenarios = new Map(), failureFeedback = new Map(), failureBusy = new Map();
  const selectedResultScenarios = new Map(), resultFeedback = new Map(), resultBusy = new Map();
  const selectedDeletionRecords = new Map(), selectedDeletionScenarios = new Map(), deletionFeedback = new Map(), deletionBusy = new Map();
  const shardScenarios = () => window.DccMock?.failureShardScenarios || {};
  const resultScenarios = () => window.DccMock?.resultScenarios || {};
  const deletionScenarios = () => window.DccMock?.deletionScenarios || {};
  const handler = (method, ...args) => esc('DccRecords.' + method + '(' + args.map(value => JSON.stringify(value)).join(',') + ')');
  const tabItems = [{key:'import',label:'客户名单'},{key:'failures',label:'导入异常'},{key:'deletion',label:'号码移除'}];
  let manualDraft = null, dccBusy = false, callFilter = null;
  const sourceLabel = source => source === 'manual' ? '手工导入' : '接口导入';
  const importLabel = row => row.reviewReason ? '结果待确认' : ({ pending: '等待提交', accepted: '导入已受理', rejected: '导入失败', unknown: '结果待确认' }[row.importState] || '结果待确认');
  const canWrite = row => window.HistorySnapshot?.read_only!==true && window.AppState?.canAction?.('task.create') && window.AppState?.authorizeObject?.('task.create', row);
  const technical = (body,label='技术详情（排查时查看）') => '<details class="dcc-submission-details dcc-technical-details"><summary>'+esc(label)+'</summary>'+body+'</details>';
  const customerCell = row => '<strong>'+esc(row.name||row.phone||'客户待确认')+'</strong><small>'+esc(row.name?row.phone:(row.leadCode||'线索待确认'))+'</small>';
  const recordBatch = row => row.importBatchName||row.batchId||'批次待确认';
  const recordBusinessType = row => window.CustomerBusiness?.typeLabel?.({...row,enterpriseId:row.enterpriseId||canonical(row.taskId)?.enterpriseId}) || row.businessType || '未提供';
  const resultStatus = row => row.reviewReasons?.length ? '结果待确认' : row.shortHangupState==='confirmed'&&row.shortHangup===true ? '秒挂' : row.customerAnswered===false ? '未接通' : row.customerAnswered===true&&row.shortHangupState==='not_short'&&row.shortHangup===false ? '已接通' : '结果待确认';
  const failureAdvice = row => row.outcomeState==='pending_review'||row.stage==='association_review' ? '等待确认，请勿重复导入' : row.stage==='local_validation' ? '修正客户信息后重新导入' : '查看原因，核对导入信息';
  const callReason = row => row.values?.failureReason??row.values?.reason??row.values?.failureType??'原因待确认';
  function beijingTime(value, fallback='时间待核') {
    if(value===null||value===undefined||value==='')return fallback;
    const date=new Date(typeof value==='string'&&/^\d{10,13}$/.test(value)?Number(value):value);
    if(!Number.isFinite(date.getTime()))return fallback;
    return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(date);
  }
  function render(task) {
    let result = runtime().taskRecords(task.taskId);
    if (result.code === 'UNREGISTERED_TASK') { const registered = runtime().registerTask(task); if (registered.ok) result = runtime().taskRecords(task.taskId); }
    if (!result.ok) return ui().alert('warning', '任务记录不可访问', result.reason);
    const selectedTab=recordTabs.get(task.taskId);
    const activeTab = tabItems.some(tab=>tab.key===selectedTab)?selectedTab:'import';
    const readOnlyReason = !canWrite(task) ? '当前身份没有此任务的导入权限。' : '';
    const importBusy = dccBusy || manualDraft?.busy === true;
    let content;
    if(activeTab === 'import') content=renderImport(task,result.data);
    else if(activeTab === 'deletion') content=renderDeletionControls(task,result.data);
    else {
      const failures=runtime().failureView(task.taskId);
      content=failures.ok ? renderFailures(task,failures.data) : ui().alert('warning','失败记录不可访问',failures.reason);
    }
    return `<section class="dcc-records" data-page-id="PAGE-002" data-dcc-task-id="${esc(task.taskId)}" data-dcc-active-tab="${esc(activeTab)}" data-func-id="FUNC-015">
      <div class="dcc-record-heading"><div><h2>客户与处理记录</h2><p>查看客户名单、导入异常与待处理事项。</p></div><button class="btn btn-primary" id="dccImportCustomers" type="button" ${readOnlyReason||importBusy?'disabled':''} title="${esc(readOnlyReason||'导入至当前任务')}" onclick="${handler('openImport',task.taskId)}" data-func-id="FUNC-004">导入客户</button></div>
      <div class="dcc-operator-context"><span>导入方式：<strong id="dccLockedSource">${sourceLabel(task.dccImportSource)}</strong></span><span>演示数据 · 不发送真实请求</span></div>
      ${readOnlyReason?'<p class="dcc-muted dcc-manual-disabled-reason">'+esc(readOnlyReason)+'</p>':''}
      <div class="platform-tabs dcc-record-tabs" role="tablist" aria-label="任务记录">${tabItems.map(tab=>'<button class="platform-tab '+(tab.key===activeTab?'active':'')+'" type="button" role="tab" aria-selected="'+(tab.key===activeTab)+'" data-dcc-record-tab="'+tab.key+'" id="dccRecordTab-'+tab.key+'" onclick="'+handler('switchTab',task.taskId,tab.key)+'">'+esc(tab.label)+'</button>').join('')}</div>
      <div class="dcc-record-tab-content" role="tabpanel" aria-labelledby="dccRecordTab-${esc(activeTab)}">${content}</div>
    </section>`;
  }
  function renderImport(task,data) {
    const {records,localFailures,submissions}=data,feedback=importFeedback.get(task.taskId);
    const actual=runtime().resultView?.(task.taskId),actualData=actual?.ok?actual.data:null;
    const pending=records.filter(row=>row.reviewReason||row.importState==='unknown').length;
    return `<p class="dcc-operator-guide">导入受理后等待呼叫结果；信息有误的客户可在“导入异常”中处理。</p>
      <div class="dcc-phase-summary">${ui().kpi('已保存客户',records.length,'信息校验未通过 '+localFailures.length+' 条')}${ui().kpi('导入已受理',records.filter(row=>row.importState==='accepted'&&!row.reviewReason).length,'结果待确认 '+pending+' 条')}${ui().kpi('已有通话记录',actualData?actualData.actualResults.filter(row=>row.kind==='call').length:'待确认',actualData?'按每次通话统计，受理不代表已拨打':'通话记录暂不可访问')}</div>
      ${feedback?ui().alert(feedback.ok?'success':'warning',feedback.ok?'名单已处理':'导入未完成',feedback.ok?'已保存 '+feedback.data.savedCount+' 条，信息校验未通过 '+feedback.data.rejectedCount+' 条。':feedback.reason):''}
      <div class="dcc-section-title"><h2>客户名单</h2><span>共 ${records.length} 条</span></div>
      ${ui().table([
        {key:'phone',label:'客户 / 手机号',render:(_,row)=>customerCell(row)},
        {key:'batchId',label:'导入批次',render:(_,row)=>'<strong>'+esc(recordBatch(row))+'</strong>'},
        {key:'businessType',label:'业务类型',render:(_,row)=>esc(recordBusinessType(row))},
        {key:'priority',label:'优先级'},
        {key:'newBatchCreatedAt',label:'导入时间',render:value=>esc(beijingTime(value))},
        {key:'importState',label:'导入状态',render:(_,row)=>ui().status(importLabel(row))},
        {key:'callState',label:'呼叫进展',render:(_,row)=>recordResultLabel(row,actualData)},
        {key:'recordId',label:'操作',render:(value,row)=>'<button class="table-link" type="button" onclick="'+handler('openDetail',task.taskId,value)+'" data-func-id="FUNC-015">查看详情</button><br><button class="table-link" type="button" onclick="'+handler('openCalls',task.taskId,value)+'">查看通话</button>'+(runtime().directoryRecord?.(task.taskId,value)?.ok?'<br><button class="table-link" type="button" onclick="'+handler('openArchive',task.taskId,value)+'">客户档案</button>':'')+deliveryException(task,'record',row,data,'openDetail',value)}
      ],records,{numbered:false,className:'dcc-record-table dcc-operator-table',emptyText:'还没有导入客户',emptyDetail:'点击右上方“导入客户”添加名单。'})}
      ${localFailures.length?'<p class="dcc-operator-review">'+localFailures.length+' 条客户信息未通过校验。<button type="button" class="table-link" onclick="'+handler('switchTab',task.taskId,'failures')+'">查看导入异常</button></p>':''}
      ${technical('<p>优先级数值越高越先提交；同优先级按导入先后提交。这里只约束提交顺序，不代表实际拨打顺序。</p>'+ui().table([{key:'submissionId',label:'提交标识'},{key:'batchId',label:'批次号'},{key:'request',label:'号码 / priority',render:request=>esc(request.taskTelList[0].tel)+' / '+esc(request.taskTelList[0].priority)},{key:'submittedAt',label:'提交时间',render:value=>esc(beijingTime(value))}],submissions,{numbered:false,emptyText:'尚未提交'})+'<p>本地合成演示；API-001 missing / API-002 partial。priority 生产类型与范围待核；R 为选填字段。原始响应与来源见客户详情。')}`;
  }

  const supplierDeleted = record => record.supplierDeleted===true;
  const writeDisabled = task => !canWrite(task)||dccBusy||resultBusy.has(task.taskId)||failureBusy.has(task.taskId)||deletionBusy.has(task.taskId);
  const batchKind = record => !record.rootBatchId?'批次关系待核':record.rootBatchId===record.batchId?'主批次':'子批次';
  const deletionStateLabel = value => ({pending:'移除处理中',succeeded:'已移除（演示）',rejected:'移除失败',unknown:'移除结果待确认'}[value]||'未移除');
  function deletionRecordMarkup(record) {
    return '<strong>'+esc(supplierDeleted(record)?'供应商已删除':deletionStateLabel(record.deletionState))+'</strong><small>'+(supplierDeleted(record)?'仅删除此供应商批次，本地记录与关联保留':'本地记录与批次关联保留')+'</small>';
  }
  function deletionData(taskId,fallback={}) {
    const result=runtime().deletionView?.(taskId);
    return result?.ok?result.data:{records:fallback.records||[],deletionRequests:[],deliveries:[]};
  }
  function renderDeletionControls(task,fallback) {
    const data=deletionData(task.taskId,fallback),records=data.records||[],requests=data.deletionRequests||[];
    const scenarioId=selectedDeletionScenarios.get(task.taskId)||'STEP09-UNKNOWN',disabled=writeDisabled(task),busy=deletionBusy.has(task.taskId),feedback=deletionFeedback.get(task.taskId);
    return `<div class="dcc-deletion-view" data-func-id="FUNC-009">
      <p class="dcc-operator-guide">仅移除所选客户的本次导入记录；同一号码的其他批次与平台历史保留。已经开始的呼叫可能无法撤回。</p>
      ${feedback?'<div class="dcc-result-feedback" id="dccDeletionFeedback" role="status" aria-live="polite">'+ui().alert(feedback.tone,feedback.title,feedback.detail)+'</div>':''}
      <div class="dcc-section-title"><h2>选择要移除的记录</h2><span>请核对客户与导入时间</span></div>
      ${ui().table([
        {key:'phone',label:'客户 / 手机号',render:(_,row)=>customerCell(row)},
        {key:'batchId',label:'导入批次',render:(_,row)=>esc(recordBatch(row))+(row.importBatchName?'<small>批次号：'+esc(row.batchId)+'</small>':'')},
        {key:'newBatchCreatedAt',label:'导入时间',render:value=>esc(beijingTime(value))},
        {key:'deletionState',label:'移除状态',render:(_,row)=>esc(supplierDeleted(row)?'已移除':row.deletionState?deletionStateLabel(row.deletionState):'未移除')},
        {key:'recordId',label:'操作',render:(value,row)=>'<button class="table-link" type="button" '+(disabled||supplierDeleted(row)||row.submissionState!=='submitted'||!row.supplierFileId||['unknown','pending'].includes(row.deletionState)?'disabled':'')+' onclick="'+handler('confirmDeletion',task.taskId,value)+'">移除号码</button><small>'+esc(['unknown','pending'].includes(row.deletionState)?'等待移除结果，请勿重复操作':row.submissionState!=='submitted'||!row.supplierFileId?'导入信息待确认，暂不可移除':'')+'</small>'}
      ],records,{numbered:false,className:'dcc-failure-table dcc-operator-table',emptyText:'暂无可移除的记录',emptyDetail:'导入客户并确认受理后，可在此选择记录。'})}
      <div class="dcc-section-title dcc-local-fail-title"><h2>移除记录</h2><span>${requests.length} 条</span></div>
      ${ui().table([
        {key:'target',label:'手机号',render:value=>esc(value?.phone||'待确认')},
        {key:'target',label:'导入批次',render:value=>esc(value?.batchId||'待确认')},
        {key:'state',label:'处理结果',render:value=>esc(deletionStateLabel(value))},
        {key:'deletionId',label:'操作',render:(value,row)=>'<button class="table-link" type="button" onclick="'+handler('openDeletionDetail',task.taskId,value)+'">查看详情</button>'+deliveryException(task,'deletion',row,data,'openDeletionDetail',value)}
      ],requests,{numbered:false,className:'dcc-failure-table dcc-operator-table',emptyText:'还没有移除记录'})}
      <details class="dcc-operator-tools"><summary>演示工具 · 号码移除</summary><p>仅模拟移除结果，不发送真实请求。</p><label class="dcc-field"><span>下一次移除结果</span><select id="dccDeletionScenario" ${busy?'disabled':''} onchange="${handler('selectDeletionScenario',task.taskId,'__VALUE__').replace('&quot;__VALUE__&quot;','this.value')}">${Object.entries(deletionScenarios()).map(([id,scenario])=>'<option value="'+esc(id)+'" '+(id===scenarioId?'selected':'')+'>'+esc(scenario.label)+'</option>').join('')}</select></label>${requests.filter(row=>['pending','unknown'].includes(row.state)).map(row=>'<div class="dcc-snapshot-actions"><span>'+esc(row.target?.phone)+' · '+esc(row.target?.batchId)+'</span><button class="btn" type="button" '+(disabled?'disabled':'')+' onclick="'+handler('receiveDeletionConfirmation',task.taskId,row.deletionId)+'">模拟收到后续确认</button></div>').join('')}${task.dccImportSource==='api'?'<label class="dcc-field"><span>再次导入样例：选择原记录</span><select id="dccDeleteRecord" onchange="'+handler('selectDeletionRecord',task.taskId,'__VALUE__').replace('&quot;__VALUE__&quot;','this.value')+'"><option value="">请选择</option>'+records.map(row=>'<option value="'+esc(row.recordId)+'" '+(selectedDeletionRecords.get(task.taskId)===row.recordId?'selected':'')+'>'+esc(row.phone+' / '+recordBatch(row))+'</option>').join('')+'</select></label><button class="btn" type="button" id="dccLineageRepush" '+(disabled||!selectedDeletionRecords.get(task.taskId)?'disabled':'')+' onclick="'+handler('repushSelectedRecord',task.taskId)+'">模拟 业务系统再次导入</button>':''}</details>
      ${technical('<p>API-006 partial；真实精准删除契约和成功判据待核。每次移除绑定租户、任务、批次与号码；未知或拒绝不标记成功，本地历史保留。</p>')}
    </div>`;
  }
  function confirmDeletion(taskId,recordId) {
    const task=canonical(taskId),view=runtime().deletionView(taskId),record=view.data?.records.find(row=>row.recordId===recordId);
    if(!task||writeDisabled(task)||!view.ok||!record||supplierDeleted(record)||['unknown','pending'].includes(record.deletionState)||record.submissionState!=='submitted'||!record.supplierFileId)return false;
    selectedDeletionRecords.set(taskId,recordId);
    ui().confirm({id:'dcc-delete-confirm',title:'确认移除这条号码记录？',confirmText:'确认移除（演示）',danger:true,body:'<dl class="dcc-detail-list"><div><dt>手机号</dt><dd>'+esc(record.phone)+'</dd></div><div><dt>导入批次</dt><dd>'+esc(recordBatch(record))+'</dd></div><div><dt>批次号</dt><dd>'+esc(record.batchId)+'</dd></div><div><dt>导入时间</dt><dd>'+esc(beijingTime(record.newBatchCreatedAt))+'</dd></div></dl><p>仅作用于这次导入。同号其他批次和平台历史保留；已开始的呼叫可能无法撤回。</p><p class="dcc-muted">本次为演示操作，不会实际移除号码。</p>',onConfirm:()=>{const current=runtime().deletionView(taskId),target=current.data?.records.find(row=>row.recordId===recordId);if(!current.ok||!target||supplierDeleted(target)||['unknown','pending'].includes(target.deletionState)){window.showToast?.('记录状态已变化，请重新查看','warning');return false;}return deleteSupplierRecord(taskId,recordId);}});return true;
  }

  function receiveDeletionConfirmation(taskId,deletionId) {
    const view=runtime().deletionView(taskId),deletion=view.data?.deletionRequests.find(row=>row.deletionId===deletionId);
    const scenario=deletionScenarios()[selectedDeletionScenarios.get(taskId)||'STEP09-UNKNOWN'];
    if(!view.ok||!deletion||!['pending','unknown'].includes(deletion.state)||!scenario)return false;
    return deletionOperation(taskId,'confirmation','移除结果确认',deletion.target.recordId,()=>{
      const current=runtime().deletionView(taskId),request=current.data?.deletionRequests.find(row=>row.deletionId===deletionId);
      if(!current.ok||!request||!['pending','unknown'].includes(request.state))return {ok:false,reason:'请求状态已变化，请重新查看。'};
      return runtime().applySupplierDeletionResult({taskId,deletionId,response:clone(scenario.response),deliveryOutcome:scenario.deliveryOutcome});
    },result=>({tone:result.data?.deletion?.state==='succeeded'?'success':'warning',title:deletionStateLabel(result.data?.deletion?.state),detail:'已在原移除请求中更新演示结果，没有再次发起移除。平台历史继续保留。'}));
  }
  function selectDeletionRecord(taskId,recordId) {
    const result=runtime().deletionView?.(taskId);
    if(deletionBusy.has(taskId)||!result?.ok||recordId&&!result.data.records.some(row=>row.recordId===recordId))return false;
    if(selectedDeletionRecords.get(taskId)!==recordId)deletionFeedback.delete(taskId);
    selectedDeletionRecords.set(taskId,recordId);refresh(taskId);return true;
  }
  function selectDeletionScenario(taskId,scenarioId) {
    if(deletionBusy.has(taskId)||!deletionScenarios()[scenarioId]||!runtime().deletionView?.(taskId).ok)return false;
    if(selectedDeletionScenarios.get(taskId)!==scenarioId)deletionFeedback.delete(taskId);
    selectedDeletionScenarios.set(taskId,scenarioId);refresh(taskId);return true;
  }
  async function deletionOperation(taskId,operation,title,recordId,callback,describe) {
    const task=canonical(taskId),view=runtime().deletionView?.(taskId);
    if(!task||writeDisabled(task)||!view?.ok||!view.data.records.some(row=>row.recordId===recordId)){window.showToast?.('请在当前可操作任务中选择精确记录','warning');return false;}
    const accountId=window.AppState.get().accountId;
    deletionBusy.set(taskId,operation);deletionFeedback.set(taskId,{tone:'info',title:title+'处理中',detail:'正在保存指定记录的独立合成证据，不发送真实请求。'});refresh(taskId);
    await new Promise(resolve=>setTimeout(resolve,240));
    let result;
    try {
      const current=canonical(taskId),currentView=runtime().deletionView?.(taskId);
      result=accountId===window.AppState.get().accountId&&current&&canWrite(current)&&currentView?.ok&&currentView.data.records.some(row=>row.recordId===recordId)?await callback():{ok:false,reason:'登录身份或精确任务范围已变化，未执行此操作。'};
    } catch(error) { result={ok:false,reason:'合成操作未完成，本地记录、批次关联及已有证据继续保留。'}; }
    deletionBusy.delete(taskId);
    deletionFeedback.set(taskId,result.ok?describe(result):{tone:'warning',title:title+'被拒绝',detail:result.reason});refresh(taskId);return result;
  }
  function deleteSupplierRecord(taskId,confirmedRecordId) {
    const recordId=confirmedRecordId||selectedDeletionRecords.get(taskId)||'',scenarioId=selectedDeletionScenarios.get(taskId)||'STEP09-UNKNOWN';
    return deletionOperation(taskId,'delete','精确供应商删除',recordId,()=>runtime().simulateSupplierDeletion({taskId,recordId,scenarioId}),result=>{
      const state=result.data?.deletion?.state,record=result.data?.record;
      if(state==='succeeded'&&supplierDeleted(record||{}))return {tone:'success',title:'本次记录已移除（演示）',detail:'同号其他批次与平台历史已保留。'};
      return {tone:'warning',title:deletionStateLabel(state),detail:state==='rejected'?'移除未成功，当前记录已保留。请在详情中查看原因。':'尚未确认移除结果，记录继续保留，请勿重复操作。'};
    });
  }
  function repushSelectedRecord(taskId) {
    const task=canonical(taskId);if(task?.dccImportSource!=='api'){window.showToast?.('手工任务不接收 业务系统再次导入','warning');return false;}
    const recordId=selectedDeletionRecords.get(taskId)||'';
    return deletionOperation(taskId,'repush','合成 业务系统再次导入',recordId,()=>runtime().simulateLineageRepush({taskId,recordId}),result=>{
      const rows=result.data?.rows||result.data?.savedRecords||result.data?.records||[],savedCount=result.data?.savedCount??rows.filter(row=>row.ok!==false).length;
      const ids=new Set(rows.filter(row=>row.ok!==false).map(row=>row.recordId)),view=runtime().taskRecords(taskId),records=view.ok?(view.data.records||[]).filter(row=>ids.has(row.recordId)):[];
      if(!savedCount)return {tone:'warning',title:'再次导入未保存有效记录',detail:'逐行校验结果已保留，未新增有效批次。旧记录与删除状态继续保留。'};
      if(records.length!==savedCount||records.some(row=>!row.rootBatchId||row.lineageState==='pending_review'||row.reviewReason))return {tone:'warning',title:'新批次已保留，批次关联待核',detail:'已保存 '+savedCount+' 条独立记录；请查看精确批次详情，关系待核时暂停供应商提交。'};
      return {tone:'success',title:'合成 业务系统再次导入已记录',detail:'已保存 '+savedCount+' 条新记录，使用本次 priority，子批次关联此线索最近的主批次。旧记录、旧批次删除状态和原请求重试关联保持。'};
    });
  }
  function deletionEvidenceMarkup(taskId,record) {
    const data=deletionData(taskId),requests=(data.deletionRequests||[]).filter(row=>row.target?.recordId===record.recordId);
    return '<h3>号码移除与历史记录</h3>'+deletionRecordMarkup(record)+'<h3>此批次的精确删除请求 / 原始响应</h3>'+evidence(requests)+'<p class="dcc-muted">删除只作用此供应商批次；同号其他批次独立，本地记录与批次关联继续保留。删除状态补送不会重做供应商删除或新建导入。</p>';
  }
  function openDeletionDetail(taskId,deletionId) {
    const result=runtime().deletionView?.(taskId),row=result?.data?.deletionRequests?.find(item=>item.deletionId===deletionId);if(!result?.ok||!row)return false;
    const record=result.data.records.find(item=>item.recordId===row.target?.recordId);
    ui().openLayer('dcc-deletion-detail',`<div class="layer-header"><div><h2>号码移除详情</h2><p>${esc(row.deletionId)} · ${esc(deletionStateLabel(row.state))}</p></div><button type="button" aria-label="关闭" onclick="PlatformUI.closeLayer('dcc-deletion-detail')">×</button></div><div class="layer-body"><dl class="dcc-detail-list"><div><dt>手机号</dt><dd>${esc(row.target?.phone||'待确认')}</dd></div><div><dt>导入批次</dt><dd>${esc(row.target?.batchId||'待确认')}</dd></div><div><dt>处理结果</dt><dd>${esc(deletionStateLabel(row.state))}</dd></div></dl><p>平台历史和同号其他批次保留。结果待确认时请勿重复操作。</p>${deliveryDetails(taskId,'deletion',deletionId)}<details class="dcc-submission-details"><summary>技术详情（排查时查看）</summary><h3>完整指定范围</h3>${evidence(row.target)}${record?'<h3>本地记录继续保留</h3>'+deletionRecordMarkup(record)+evidence({recordId:record.recordId,batchId:record.batchId,rootBatchId:record.rootBatchId,requestId:record.requestId,priority:record.priority,supplierDeleted:record.supplierDeleted===true}):ui().alert('warning','本地关联待核','当前投影没有准确记录，不补造删除成功。')}<h3>各次供应商响应原字段与来源</h3>${evidence(row.responses||[])}<h3>完整合成请求证据</h3>${evidence(row)}<p class="dcc-muted">未知或拒绝保持原始结果；明确可信成功才标记已删。状态交付补送只修复交付，供应商执行中或并发删除能否撤销已执行呼叫仍待核。</p></details></div><div class="layer-footer"><button class="btn" type="button" onclick="PlatformUI.closeLayer('dcc-deletion-detail')">关闭</button></div>`,'wide');return true;
  }
  function switchTab(taskId,tab) {
    if(tab==='results')return openCalls(taskId);
    if(tab==='delivery')tab='import';
    if(!tabItems.some(item=>item.key===tab)||!runtime().taskRecords(taskId).ok)return false;
    recordTabs.set(taskId,tab);refresh(taskId);return true;
  }
  const resultKindLabel = kind => kind==='no_cdr_failure'?'稳定无话单失败事件':'实际呼叫对象';
  const finishLabel = flag => ({last:'1 · 供应商任务内本次为最后一次',not_last:'0 · 供应商任务内尚非最后一次',unknown:'未知 · 待核'}[flag?.interpretation]||'未知 · 待核');
  const finishRaw = flag => flag?.provided ? JSON.stringify(flag.raw)??'未提供' : '未提供';
  const shortLabel = row => row.reviewReasons?.length?'待核 · 原结果存在冲突':row.kind==='no_cdr_failure'?'不适用 · 无话单失败事件':row.shortHangupState==='confirmed'&&row.shortHangup===true?'true · 秒挂':row.shortHangupState==='not_short'&&row.shortHangup===false?'false · 排除秒挂':'待核 · 不计普通接通';
  const valueLabel = value => value===null||value===undefined||value===''?'未提供 / 待核':typeof value==='object'?JSON.stringify(value):String(value);
  const hangupLabel = value => ({customer:'客户挂断',agent:'坐席挂断',unknown:'挂断方待核'}[value]||'挂断方待核');
  const resultDisabled = task => !canWrite(task)||resultBusy.has(task.taskId)||failureBusy.has(task.taskId)||deletionBusy.has(task.taskId);
  function recordResultLabel(record,data) {
    if(!data)return '<span>呼叫结果待确认</span><small>通话记录暂不可访问</small>';
    const rows=(data.actualResults||[]).filter(row=>row.recordId===record.recordId);
    if(!rows.length)return '<span>暂无呼叫结果</span>';
    const calls=rows.filter(row=>row.kind==='call'),events=rows.filter(row=>row.kind==='no_cdr_failure');
    return '<span>通话记录 '+calls.length+' 次</span>'+(events.length?'<small>呼叫异常 '+events.length+' 条</small>':'');
  }


  function resultSummary(taskId) {
    let result;
    try { result=runtime()?.resultView?.(taskId); }
    catch (_) { return {ok:false,reason:'通话记录暂时无法读取，请稍后重试。'}; }
    if(!result?.ok)return result||{ok:false,reason:'通话记录正在初始化。'};
    const calls=(result.data.actualResults||[]).filter(row=>row.kind==='call'),statuses=calls.map(resultStatus);
    return {ok:true,data:{calls:calls.length,anomalies:(result.data.actualResults||[]).filter(row=>row.kind==='no_cdr_failure').length,
      answered:statuses.filter(status=>status==='已接通'||status==='秒挂').length,unanswered:statuses.filter(status=>status==='未接通').length,
      short:statuses.filter(status=>status==='秒挂').length,unknown:statuses.filter(status=>status==='结果待确认').length,reviews:(result.data.resultReviews||[]).length}};
  }
  function syncCallScope(taskId,tab) {
    if(callFilter&&(callFilter.taskId!==taskId||tab!=='calls'))callFilter=null;
  }
  function clearCallFilter() { callFilter=null; }
  function openCalls(taskId,recordId) {
    const task=canonical(taskId),records=runtime()?.taskRecords?.(taskId),results=runtime()?.resultView?.(taskId);
    const record=recordId?records?.data?.records?.find(row=>row.recordId===recordId):null;
    if(!task||!records?.ok||!results?.ok||(recordId&&!record)) { window.showToast?.('当前客户或通话记录不可访问','warning');return false; }
    callFilter=record?{taskId,recordId:record.recordId}:null;
    ui().closeLayer('dcc-record-detail');
    return window.CloudTaskWorkspace?.openTask(taskId,'calls');
  }
  function renderCalls(task) {
    syncCallScope(task.taskId,'calls');
    const records=runtime()?.taskRecords?.(task.taskId),result=runtime()?.resultView?.(task.taskId);
    if(!records?.ok||!result?.ok)return ui().alert('warning','通话记录不可访问',records?.reason||result?.reason||'请稍后重试。');
    const record=callFilter?records.data.records.find(row=>row.recordId===callFilter.recordId):null;
    if(callFilter&&!record)return ui().alert('warning','客户记录不可访问','请返回客户名单重新选择。');
    let data=result.data;
    if(record) {
      const actualResults=data.actualResults.filter(row=>row.recordId===record.recordId),ids=new Set(actualResults.map(row=>row.resultId));
      data={...data,actualResults,resultReviews:(data.resultReviews||[]).filter(row=>ids.has(row.resultId)),queryEvidence:[],filteredRecord:record};
    }
    return `<section class="dcc-records" data-page-id="PAGE-002" data-dcc-task-id="${esc(task.taskId)}" data-dcc-call-view data-func-id="FUNC-015">
      <div class="dcc-record-heading"><div><h2>任务通话记录</h2><p>接听情况、秒挂和呼叫异常在这里统一查看。</p></div>${record?'<button class="btn" type="button" onclick="'+handler('openCalls',task.taskId)+'">查看全部</button>':''}</div>
      ${record?'<p class="dcc-operator-guide">当前客户：'+esc(record.name||record.leadCode)+' · '+esc(record.phone)+' · '+esc(recordBatch(record))+'。仅显示本次导入记录关联的通话与异常。</p>':''}
      ${renderResults(task,data)}
    </section>`;
  }

  function resultFeedbackMarkup(taskId) {
    const feedback=resultFeedback.get(taskId);
    return feedback?'<div class="dcc-result-feedback" id="dccResultFeedback" role="status" aria-live="polite">'+ui().alert(feedback.tone,feedback.title,feedback.detail)+'</div>':'';
  }
  function renderResults(task,data) {
    const rows=data.actualResults||[],calls=rows.filter(row=>row.kind==='call'),events=rows.filter(row=>row.kind==='no_cdr_failure'),reviews=data.resultReviews||[],queries=data.queryEvidence||[];
    const disabled=resultDisabled(task),scenarioId=selectedResultScenarios.get(task.taskId)||'STEP07-SHORT-2';
    return `<div class="dcc-result-view" data-func-id="FUNC-015">
      <p class="dcc-operator-guide">查看每次通话的接听情况、时长及异常原因。秒挂单独标记。</p>
      ${resultFeedbackMarkup(task.taskId)}
      <div class="dcc-section-title"><h2>通话明细</h2><span>${calls.length} 条</span></div>
      ${ui().table([
        {key:'phone',label:'客户 / 手机号',render:(_,row)=>customerCell(row)},
        {key:'batchId',label:'导入批次',render:(_,row)=>esc(row.businessBatchNo||row.batchId)},
        {key:'customerAnswered',label:'通话结果',render:(_,row)=>ui().status(resultStatus(row))},
        {key:'customerBridgeDuration',label:'客户通话时长',render:(value,row)=>esc(row.durationIsTrusted?valueLabel(value)+' 秒':'待确认')},
        {key:'values',label:'挂断方',render:value=>esc(hangupLabel(value?.hangupParty))},
        {key:'resultId',label:'操作',render:(value,row)=>'<button class="table-link" type="button" data-dcc-result-id="'+esc(value)+'" onclick="'+handler('openResultDetail',task.taskId,value)+'">查看详情</button>'+deliveryException(task,'result',row,data,'openResultDetail',value)}
      ],calls,{numbered:false,className:'dcc-result-table dcc-operator-table',emptyText:'暂无通话记录',emptyDetail:'收到呼叫结果后会显示在这里。'})}
      <div class="dcc-section-title dcc-local-fail-title"><h2>呼叫异常</h2><span>${events.length} 条</span></div>
      ${ui().table([
        {key:'phone',label:'客户 / 手机号',render:(_,row)=>customerCell(row)},
        {key:'batchId',label:'导入批次'},
        {key:'values',label:'异常原因',render:(_,row)=>esc(callReason(row))},
        {key:'resultId',label:'当前情况',render:()=> '已收到失败结果，尚无通话明细'},
        {key:'resultId',label:'操作',render:(value,row)=>'<button class="table-link" type="button" data-dcc-result-id="'+esc(value)+'" onclick="'+handler('openResultDetail',task.taskId,value)+'">查看详情</button>'+deliveryException(task,'result',row,data,'openResultDetail',value)}
      ],events,{numbered:false,className:'dcc-result-event-table dcc-operator-table',emptyText:'暂无已确认的呼叫异常',emptyDetail:'未收到结果的客户继续显示“暂无呼叫结果”。'})}
      ${renderFailureRetries(task,data)}
      ${reviews.length?'<p class="dcc-operator-review">'+reviews.length+' 条结果的客户归属或内容有冲突，待核对后更新；暂不计为已接通。</p>':''}
      ${data.filteredRecord?'':`<details class="dcc-demo-input"><summary>演示工具 · 通话结果样例</summary><p>先准备一条准确关联的合成线索，再选择 0 / 1 / 2 秒、普通时长、无话单失败、重复或 SIP 晚更新样例。每次操作仅保存合成结果，不发送真实请求；失败补提交另按下方规则演示。</p><div class="dcc-demo-input-actions"><button class="btn" type="button" id="dccPrepareResultDemo" ${disabled?'disabled':''} onclick="${handler('prepareResultDemo',task.taskId)}" data-func-id="FUNC-004">准备合成结果线索</button><label for="dccResultScenario">合成实际结果</label><select id="dccResultScenario" ${resultBusy.has(task.taskId)?'disabled':''} onchange="${handler('selectResultScenario',task.taskId,'__VALUE__').replace('&quot;__VALUE__&quot;','this.value')}">${Object.entries(resultScenarios()).map(([id,scenario])=>'<option value="'+esc(id)+'" '+(id===scenarioId?'selected':'')+'>'+esc(scenario.label)+'</option>').join('')}</select><button class="btn" type="button" id="dccReceiveResult" ${disabled?'disabled':''} onclick="${handler('receiveResult',task.taskId)}" data-func-id="FUNC-011">接收合成实际结果</button></div>${(data.records||[]).some(record=>dccRecordSource(task,record))?'<p>业务系统回传异常可在对应记录详情查看，并重新回传。</p>':''}</details>`}
      ${technical('<h3>归属与冲突记录</h3>'+evidence(reviews)+'<h3>话单查询记录</h3>'+evidence(queries)+'<p>重复结果不新增通话；SIP 更新沿用原对象。无话单不等于未拨打，空查询不生成失败。API-003 / API-004 partial，API-010 missing；挂断方映射等真实契约待核。</p>')}
    </div>`;
  }


  async function resultOperation(taskId,operation,title,callback,detail) {
    const task=canonical(taskId);
    if(!task||resultDisabled(task)||!runtime().resultView(taskId).ok){window.showToast?.('当前身份或任务范围不允许此操作','warning');return false;}
    const accountId=window.AppState.get().accountId;
    resultBusy.set(taskId,operation);resultFeedback.set(taskId,{tone:'info',title:title+'处理中',detail:'正在保存合成结果与原始证据，不发送真实请求。'});refresh(taskId);
    await new Promise(resolve=>setTimeout(resolve,240));
    let result;
    try {
      const current=canonical(taskId);
      result=accountId===window.AppState.get().accountId&&current&&canWrite(current)&&runtime().resultView(taskId).ok?await callback():{ok:false,reason:'登录身份或任务权限已变化，未执行此操作。'};
    } catch(error) { result={ok:false,reason:'合成结果未完成，已有业务记录与证据继续保留。'}; }
    resultBusy.delete(taskId);resultFeedback.set(taskId,{tone:result.ok?'success':'warning',title:result.ok?title+'已记录':title+'被拒绝',detail:result.ok?(typeof detail==='function'?detail(result):detail):result.reason});refresh(taskId);return result;
  }
  function selectResultScenario(taskId,id) { if(!resultScenarios()[id])return false;selectedResultScenarios.set(taskId,id);return true; }
  function prepareResultDemo(taskId) { return resultOperation(taskId,'prepare','合成结果线索准备',()=>runtime().prepareResultDemo({taskId}),'准确关联的合成线索已保存；准备线索不代表已呼叫或已接通。可接收实际结果样例。'); }
  function receiveResult(taskId) {
    const scenarioId=selectedResultScenarios.get(taskId)||'STEP07-SHORT-2';
    return resultOperation(taskId,'receive','合成实际结果',()=>runtime().simulateCallResult({taskId,scenarioId}),result=>{
      if(resultScenarios()[scenarioId]?.kind==='empty_query')return '空话单查询证据已保留；未新增呼叫、无话单失败或 业务系统失败回传，不能据此判断未拨打。';
      if(result.data?.duplicate)return '相同结果已去重，不新增呼叫、导入提交或交付；已有待核与来源证据继续保留。';
      if(result.data?.pendingReview)return '缺口或冲突的原字段已保留待核，不新建呼叫，不标为普通接通，也不补造成功交付。';
      if(result.data?.updated)return 'SIP 晚更新已保存在同一呼叫对象的新版本；呼叫数不增加，接口任务的更新有独立业务系统回传。';
      return '准确关联的合成实际结果及来源证据已保存；接口任务每次结果独立交付，手工任务仅平台查看，均不触发平台重导。';
    });
  }
  function openResultDetail(taskId,resultId,fromDirectory=false) {
    const result=fromDirectory?runtime().directoryResult(taskId,resultId):runtime().resultView(taskId),row=result.data?.actualResults?.find(item=>item.resultId===resultId);if(!result.ok||!row)return false;
    ui().openLayer('dcc-result-detail',`<div class="layer-header"><div><h2>${row.kind==='call'?'通话详情':'呼叫异常详情'}</h2><p>${esc(row.phone)} · ${esc(row.batchId)}</p></div><button type="button" aria-label="关闭" onclick="PlatformUI.closeLayer('dcc-result-detail')">×</button></div><div class="layer-body"><dl class="dcc-detail-list"><div><dt>手机号</dt><dd>${esc(row.phone)}</dd></div><div><dt>业务类型</dt><dd>${esc(recordBusinessType(row))}</dd></div>${row.sourceApplicationId?'<div><dt>业务批次号</dt><dd>'+esc(row.businessBatchNo||'历史未提供')+'</dd></div>':''}<div><dt>通话结果</dt><dd>${esc(row.kind==='no_cdr_failure'?'呼叫异常':resultStatus(row))}</dd></div><div><dt>客户通话时长</dt><dd>${esc(row.durationIsTrusted?valueLabel(row.customerBridgeDuration)+' 秒':'待确认')}</dd></div><div><dt>挂断方</dt><dd>${esc(hangupLabel(row.values?.hangupParty))}</dd></div><div><dt>异常原因</dt><dd>${esc(row.kind==='no_cdr_failure'?callReason(row):'—')}</dd></div></dl><h3>导入时的客户信息</h3>${CustomerBusiness.importedDetail(row)}${deliveryDetails(taskId,'result',resultId)}<details class="dcc-submission-details"><summary>技术详情（排查时查看）</summary><dl class="dcc-detail-list"><div><dt>稳定关联</dt><dd>${esc(row.identityKey)}</dd></div><div><dt>callID / 事件标识</dt><dd>${esc(row.callID||'未提供')} / ${esc(row.eventId||'未提供')}</dd></div><div><dt>业务记录 / 单号批次</dt><dd>${esc(row.recordId)} / ${esc(row.batchId)}</dd></div><div><dt>线索 / 手机号</dt><dd>${esc(row.leadCode)} / ${esc(row.phone)}</dd></div><div><dt>客户实际接听</dt><dd>${esc(row.reviewReasons?.length?'接听状态待核 · 保留原值 '+valueLabel(row.customerAnswered):row.customerAnswered===true?'客户真实接通':row.customerAnswered===false?'客户未接通':'接听状态待核')}</dd></div><div><dt>挂断方合成语义</dt><dd>${esc(hangupLabel(row.values?.hangupParty))} · hangupParty 原值 ${esc(valueLabel(row.values?.hangupParty))}</dd></div><div><dt>onHookSource 原字段</dt><dd>${esc(valueLabel(row.values?.onHookSource))} · 合成映射，真实来源映射待核</dd></div><div><dt>客户真实有效时长</dt><dd>${esc(row.durationIsTrusted?valueLabel(row.customerBridgeDuration)+' 秒':'客户时长待核')} · 原值 ${esc(valueLabel(row.customerBridgeDuration))}</dd></div><div><dt>坐席桥接时长</dt><dd>${esc(valueLabel(row.values?.agentBridgeDuration))} · 仅展示原字段，不作为客户时长</dd></div><div><dt>秒挂判定</dt><dd>${esc(shortLabel(row))}</dd></div><div><dt>最后一次供应商标志</dt><dd>${esc(finishLabel(row.finishRetryFlag))} · 原值 ${esc(finishRaw(row.finishRetryFlag))} · 来源 ${esc(row.finishRetryFlag?.source||'来源待核')}</dd></div><div><dt>SIP 晚更新</dt><dd>${(row.sipUpdates||[]).length} 次 · 沿用 callID 与对象 · 版本 ${esc(row.version)}</dd></div><div><dt>SIP 当前原字段</dt><dd>sipCause：${esc(valueLabel(row.values?.sipCause))} / obSipCause：${esc(valueLabel(row.values?.obSipCause))} / obSipCode：${esc(valueLabel(row.values?.obSipCode))}</dd></div><div><dt>待核说明</dt><dd>${esc((row.reviewReasons||[]).join('；')||'—')}</dd></div></dl><h3>当前对象保留的原字段</h3>${evidence(row.values)}<h3>各次来源、原字段与更新证据</h3>${ui().table([{key:'source',label:'来源'},{key:'fingerprint',label:'证据指纹',render:value=>'<code>'+esc(value)+'</code>'},{key:'receivedAt',label:'接收时间（北京）',render:value=>esc(beijingTime(value))}],row.evidence||[],{numbered:false,className:'dcc-result-evidence-table',emptyText:'来源证据待核'})}${evidence(row.evidence||[])}${row.sipUpdates?.length?'<h3>SIP 晚更新各次原字段与来源</h3>'+evidence(row.sipUpdates):''}<p class="dcc-muted">同一 callID 的 SIP 晚更新沿用本对象并保留来源与版本；供应商的最后一次标志不代表整个任务已完成。</p></details></div><div class="layer-footer"><button class="btn" type="button" onclick="PlatformUI.closeLayer('dcc-result-detail')">关闭</button></div>`,'wide');return true;
  }
  const stageLabel = value => ({local_validation:'客户信息有误',supplier_import:'导入失败',association_review:'结果待确认'}[value]||'结果待确认');
  const completenessLabel = value => ({complete:'已声明失败组收齐',incomplete:'失败组未收齐',pending_review:'分片声明 / 关联待核',unknown:'失败完整性未知'}[value]||'失败完整性未知');
  const downloadLabel = value => ({generated:'文件已准备',clicked:'已发起下载，保存待确认',failed:'下载失败，可重试',interrupted:'下载中断，可重试',succeeded:'保存完成，本次明细已清理'}[value]||'保存结果待确认');
  const deliveryLabel = value => ({pending:'等待回传',failed:'回传失败',succeeded:'已回传（演示）'}[value]||'回传结果待确认');
  const deliveryStageLabel = value => ({supplier_import:'导入失败通知',call_result:'通话结果',no_cdr_failure:'呼叫异常通知',sip_update:'通话结果更新',supplier_deletion:'号码移除结果'}[value]||'结果类型待确认');
  const failureDisabled = task => !canWrite(task)||failureBusy.has(task.taskId)||resultBusy.has(task.taskId)||deletionBusy.has(task.taskId);
  const evidence = value => '<pre class="dcc-raw-evidence">'+esc(JSON.stringify(value,null,2))+'</pre>';
  function feedbackMarkup(taskId) {
    const feedback=failureFeedback.get(taskId);
    return feedback?'<div class="dcc-failure-feedback" id="dccFailureFeedback" role="status" aria-live="polite">'+ui().alert(feedback.tone||'info',feedback.title,feedback.detail)+'</div>':'';
  }
  function renderFailures(task,data) {
    const details=data.failureDetails||[],events=data.failureEvents||[],groups=data.failureGroups||[],snapshots=data.exportSnapshots||[];
    const disabled=failureDisabled(task),busy=failureBusy.has(task.taskId),scenarioId=selectedShardScenarios.get(task.taskId)||'STEP06-SHARD-2';
    const unknown=(data.records||[]).filter(row=>row.reviewReason||row.importState==='unknown');
    return `<div class="dcc-failure-view" data-func-id="FUNC-006">
      <p class="dcc-operator-guide">先查看失败原因，再修正客户信息。结果待确认的记录请勿重复导入。</p>
      <div class="dcc-phase-summary">${ui().kpi('客户信息有误',details.filter(row=>row.stage==='local_validation').length,'修正后可重新导入')}${ui().kpi('导入失败',details.filter(row=>row.stage==='supplier_import'&&row.outcomeState==='failed').length,'查看下方失败原因')}${ui().kpi('异常明细待确认',details.filter(row=>row.stage==='association_review'||row.outcomeState==='pending_review').length,'等待结果核对')}</div>
      ${feedbackMarkup(task.taskId)}
      <div class="dcc-section-title"><h2>异常明细</h2><button class="btn btn-primary" type="button" id="dccCreateFailureSnapshot" ${disabled||!details.length?'disabled':''} onclick="${handler('createFailureSnapshot',task.taskId)}" data-func-id="FUNC-006">准备下载文件</button></div>
      ${ui().table([
        {key:'phone',label:'客户 / 手机号',render:(_,row)=>customerCell(row)},
        {key:'stage',label:'问题类型',render:value=>esc(stageLabel(value))},
        {key:'reason',label:'失败原因'},
        {key:'stage',label:'处理建议',render:(_,row)=>esc(failureAdvice(row))},
        {key:'failureId',label:'操作',render:(value,row)=>'<button class="table-link" type="button" data-dcc-failure-id="'+esc(value)+'" onclick="'+handler('openFailureDetail',task.taskId,value)+'">查看详情</button>'+deliveryException(task,'failure',row,data,'openFailureDetail',value)}
      ],details,{numbered:false,className:'dcc-failure-table dcc-operator-table',emptyText:'暂无待处理的导入异常',emptyDetail:'后续收到的失败信息会继续补充。'})}
      ${unknown.length?'<p class="dcc-operator-review">另有 '+unknown.length+' 条客户的导入结果待确认。<button type="button" class="table-link" onclick="'+handler('switchTab',task.taskId,'import')+'">查看客户名单</button></p>':''}
      <div class="dcc-section-title dcc-local-fail-title"><h2>下载记录</h2><span>共 ${snapshots.length} 份文件</span></div>
      <p class="dcc-muted">下载未确认完成时保留明细；后续新增的异常不包含在已准备的文件中。</p>
      ${snapshots.length?snapshots.slice().reverse().map(snapshot=>renderFailureSnapshot(task,snapshot)).join(''):ui().empty('还没有准备下载文件','有异常明细后，点击“准备下载文件”生成 CSV。')}
      <details class="dcc-demo-input"><summary>演示工具 · 导入异常样例</summary><p>先准备四条合成线索：三条导入结果待核，一条有准确成功证据。按样例顺序接收 2/3、1/3、重复 2/3，并在生成快照后接收迟到 3/3。真实推送契约与成功判据仍需核验。</p><div class="dcc-demo-input-actions"><button class="btn" type="button" id="dccPrepareFailureDemo" ${disabled?'disabled':''} onclick="${handler('prepareFailureDemo',task.taskId)}" data-func-id="FUNC-004">准备四条合成线索</button><label for="dccFailureShardScenario">合成失败分片</label><select id="dccFailureShardScenario" ${busy?'disabled':''} onchange="${handler('selectFailureScenario',task.taskId,'__VALUE__').replace('&quot;__VALUE__&quot;','this.value')}">${Object.entries(shardScenarios()).map(([id,scenario])=>'<option value="'+esc(id)+'" '+(id===scenarioId?'selected':'')+'>'+esc(scenario.label)+'</option>').join('')}</select><button class="btn" type="button" id="dccSendFailureShard" ${disabled?'disabled':''} onclick="${handler('sendFailureShard',task.taskId)}" data-func-id="FUNC-017">接收合成失败分片</button></div><p>${data.failureDemo?'当前合成分片样例已准备，提交仍按本任务 pending 顺序执行。':'尚未准备分片样例。'}准确关联的失败通知保留在对应客户及异常详情。</p></details>
      ${technical('<h3>失败通知接收情况</h3><p>'+esc(completenessLabel(data.failureCompleteness))+'。收齐失败通知不代表全部导入结束；未收到通知不等于零失败。</p>'+evidence(groups)+'<h3>保留的失败记录</h3>'+evidence(events)+'<p>API-003 partial；真实分片关联、回传及保存确认仍待验证。下载发起不等于保存完成；模拟完成只清理本次文件中的明细版本。</p>')}
    </div>`;
  }

  function renderFailureSnapshot(task,snapshot) {
    const disabled=failureDisabled(task)||snapshot.state==='succeeded';
    const actionButton=(action,label,primary=false)=>'<button class="btn '+(primary?'btn-primary':'')+'" type="button" data-dcc-snapshot-id="'+esc(snapshot.snapshotId)+'" data-dcc-action="'+action+'" '+(disabled||action==='download'&&!snapshot.file?'disabled':'')+' onclick="'+handler(action==='download'?'downloadFailureSnapshot':'signalSnapshotDownload',task.taskId,snapshot.snapshotId,...(action==='download'?[]:[action]))+'" data-func-id="FUNC-006">'+esc(label)+'</button>';
    return `<article class="dcc-snapshot-card" data-dcc-snapshot="${esc(snapshot.snapshotId)}"><div class="dcc-snapshot-heading"><div><h3>导入异常明细 · ${(snapshot.memberIds||[]).length} 条</h3><p>${esc(beijingTime(snapshot.createdAt))} 准备</p></div><span class="dcc-snapshot-state">${esc(downloadLabel(snapshot.state))}</span></div><div class="dcc-snapshot-actions">${actionButton('download','下载文件',true)}</div><p class="dcc-muted">支持的浏览器可选择保存位置，写入并核对文件后清理本次明细；普通下载继续保留明细。</p><details class="dcc-operator-tools"><summary>演示工具 · 模拟保存结果</summary><p>以下仅模拟保存结果，不代表浏览器已经完成下载。</p><div class="dcc-snapshot-actions">${actionButton('failed','模拟下载失败')}${actionButton('interrupted','模拟下载中断')}${actionButton('succeeded','模拟保存完成')}</div></details>${technical('<p>文件：'+esc(snapshot.file?.name||'本次文件已清理')+'</p>'+evidence(snapshot),'技术详情 · 下载记录')}</article>`;
  }

  function dccRecordSource(task,record) {
    return task?.dccImportSource==='api'&&record?.source==='api'&&typeof record.sourceApplicationId==='string'&&record.sourceApplicationId.length>0;
  }
  function dccDeliveries(task,data) {
    if(!task||data?.task?.source!=='api'||data.task.taskId!==task.taskId||data.task.tenantId!==task.tenantId)return [];
    return (data.deliveries||[]).filter(delivery=>{
      const payload=delivery.payload||{},recordId=payload.recordId||delivery.recordId;
      const record=(data.records||[]).find(item=>item.recordId===recordId);
      return record&&dccRecordSource(task,record)&&deliveryLinksRecord(delivery,record,data)&&['APPLICATION_CALLBACK','BACKEND_FIXED_DCC_RECEIVER'].includes(delivery.target)&&(!delivery.sourceApplicationId||delivery.sourceApplicationId===record.sourceApplicationId)&&delivery.taskId===task.taskId&&delivery.tenantId===task.tenantId&&
        (!delivery.recordId||delivery.recordId===record.recordId)&&(!payload.localTaskId||payload.localTaskId===task.taskId)&&(!payload.tenantId||payload.tenantId===task.tenantId)&&
        (!payload.taskId||payload.taskId===data.task.supplierTaskId)&&(!payload.phone||payload.phone===record.phone)&&
        (!payload.batchId||payload.batchId===record.batchId)&&(!payload.fileId||payload.fileId===record.supplierFileId||(data.failureRetryAttempts||[]).some(attempt=>attempt.recordId===record.recordId&&attempt.supplierFileId===payload.fileId&&attempt.state==='accepted'));
    });
  }
  function deliveryLinksRecord(delivery,record,data) {
    if([delivery.resultId,delivery.failureId,delivery.deletionId].filter(Boolean).length!==1)return false;
    if(delivery.resultId){
      const result=(data.actualResults||[]).find(row=>row.resultId===delivery.resultId);
      return result?.recordId===record.recordId&&(result.deliveryIds||[]).includes(delivery.deliveryId)&&Number.isInteger(delivery.resultVersion)&&delivery.resultVersion>0&&delivery.resultVersion<=result.version;
    }
    if(delivery.failureId){
      const failure=(data.failureEvents||[]).find(row=>row.failureId===delivery.failureId);
      return failure?.recordId===record.recordId&&failure.deliveryId===delivery.deliveryId;
    }
    const deletion=(data.deletionRequests||[]).find(row=>row.deletionId===delivery.deletionId);
    return deletion?.target?.recordId===record.recordId&&(deletion.deliveryIds||[]).includes(delivery.deliveryId);
  }
  function objectDeliveries(task,kind,row,data) {
    if(!row)return [];
    return dccDeliveries(task,data).filter(delivery=>{
      if(kind==='record')return (delivery.payload?.recordId||delivery.recordId)===row.recordId;
      if(kind==='result')return delivery.resultId===row.resultId&&(row.deliveryIds||[]).includes(delivery.deliveryId);
      if(kind==='failure')return delivery.failureId===row.failureId&&row.deliveryId===delivery.deliveryId;
      if(kind==='deletion')return delivery.deletionId===row.deletionId&&(row.deliveryIds||[]).includes(delivery.deliveryId);
      return false;
    });
  }
  function deliveryObject(data,kind,id) {
    const spec={record:['records','recordId'],result:['actualResults','resultId'],failure:['failureEvents','failureId'],deletion:['deletionRequests','deletionId']}[kind];
    return spec?(data?.[spec[0]]||[]).find(row=>row[spec[1]]===id):null;
  }
  function deliveryDetailsBody(taskId,kind,id) {
    const view=runtime().taskRecords(taskId),task=canonical(taskId);
    if(!view.ok||!task)return '';
    const row=deliveryObject(view.data,kind,id),deliveries=objectDeliveries(task,kind,row,view.data);
    if(!deliveries.length)return '';
    const disabled=failureDisabled(task);
    return '<h3>业务系统回传</h3>'+deliveries.map(delivery=>{
      const stage=deliveryStageLabel(delivery.stage||delivery.payload?.stage),version=delivery.resultVersion?' · 第 '+delivery.resultVersion+' 版':'';
      return '<article class="dcc-delivery-card" data-dcc-delivery="'+esc(delivery.deliveryId)+'"><div class="dcc-snapshot-heading"><h3>'+esc(stage+version)+'</h3><span class="dcc-snapshot-state">'+esc(deliveryLabel(delivery.state))+'</span></div>'+
        (delivery.state==='pending'?'<p class="dcc-delivery-error">'+esc(delivery.routeReason||delivery.error||'回传接收地址待确认')+'</p>':'')+(delivery.state==='failed'?'<p class="dcc-delivery-error">尚未确认业务系统收到这条结果，可重新回传。</p><button class="btn" type="button" '+(disabled?'disabled':'')+' onclick="'+handler('openDeliveryRetry',taskId,delivery.deliveryId)+'">重新回传</button>':'')+
        technical('<h3>回传内容</h3>'+evidence(delivery.payload)+'<h3>回传记录</h3>'+evidence(delivery.attempts||[])+(delivery.error?'<p>'+esc(delivery.error)+'</p>':''),'查看回传记录')+'</article>';
    }).join('');
  }
  function deliveryDetails(taskId,kind,id) {
    return '<section data-dcc-delivery-detail data-task-id="'+esc(taskId)+'" data-object-kind="'+esc(kind)+'" data-object-id="'+esc(id)+'">'+deliveryDetailsBody(taskId,kind,id)+'</section>';
  }
  function refreshDeliveryDetails(taskId) {
    document.querySelectorAll('[data-dcc-delivery-detail]').forEach(node=>{
      if(node.dataset.taskId!==taskId)return;
      const expanded=new Set(Array.from(node.querySelectorAll('[data-dcc-delivery]')).filter(card=>card.querySelector('details')?.open).map(card=>card.dataset.dccDelivery));
      const body=node.closest('.layer-body'),scroll=body?.scrollTop;
      node.innerHTML=deliveryDetailsBody(taskId,node.dataset.objectKind,node.dataset.objectId);
      node.querySelectorAll('[data-dcc-delivery]').forEach(card=>{const detail=card.querySelector('details');if(detail&&expanded.has(card.dataset.dccDelivery))detail.open=true;});
      if(body&&scroll!==undefined)body.scrollTop=scroll;
    });
  }
  function renderFailureRetries(task,data) {
    const view=runtime().failureRetryView?.(task.taskId);if(!view?.ok)return '';
    const plans=view.data.plans.filter(row=>!data.filteredRecord||row.recordId===data.filteredRecord.recordId),attempts=view.data.attempts;
    const stateLabel=plan=>{const attempt=attempts.find(row=>row.attemptId===plan.attemptId);if(attempt)return {accepted:'补提交已受理',rejected:'补提交被拒绝',unknown:'提交结果待确认',dispatching:'提交结果待确认'}[attempt.state]||'结果待确认';if(plan.state==='cancelled')return '已取消';if(plan.blockReason==='等待 2 分钟后自动补提交')return '<span data-failure-retry-due="'+esc(plan.dueAt)+'">'+plan.secondsRemaining+' 秒后自动补提交</span>';return esc(plan.blockReason||'等待人工确认');};
    return `<section class="dcc-failure-retries"><div class="dcc-section-title"><h2>失败客户处理</h2><span>${plans.length} 条</span></div><p class="dcc-operator-guide">三类线路限制等待 2 分钟自动处理，其余已确认失败由有权限人员补提交。同一任务、线索和号码最多额外提交 2 次；秒挂只保留结果。</p>${ui().table([
      {key:'phone',label:'客户号码'}, {key:'reason',label:'失败原因'},
      {key:'mode',label:'处理方式',render:value=>value==='auto'?'2 分钟后自动':'人工补提交'},
      {key:'planId',label:'当前情况',render:(_,row)=>stateLabel(row)},
      {key:'quota',label:'补提交次数',render:value=>esc('已提交 '+value.used+' 次'+(value.unknown?' · 待确认占用 '+value.unknown+' 次':'')+' · 剩余 '+value.remaining+' 次')},
      {key:'planId',label:'操作',render:(value,row)=>row.mode==='manual'&&row.state==='queued'?'<button class="table-link" type="button" '+(row.canExecute?'':'disabled title="'+esc(row.blockReason)+'"')+' onclick="'+handler('openFailureResubmit',task.taskId,value)+'">补提交当前客户</button>':'—'}
    ],plans,{numbered:false,className:'dcc-operator-table',emptyText:'暂无待处理的失败客户',emptyDetail:'秒挂和呼叫过频不进入补提交。'})}
    ${data.filteredRecord?'':`<details class="dcc-demo-input"><summary>演示工具 · 失败处理</summary><p>仅合成演示；真实供应商的线路导航和原生重呼互斥仍待核实。确认合成条件后才演示自动或人工补提交，不发送真实请求。</p><div class="dcc-demo-input-actions"><button class="btn" type="button" ${canWrite(task)?'':'disabled'} onclick="${handler('openRetryDemoConfirmation',task.taskId)}">确认演示执行条件</button><label for="dccRetryFailureReason">失败原因样例</label><select id="dccRetryFailureReason"><option>运营商禁呼</option><option>运营商限呼</option><option>外呼黑名单</option><option>无可用中继</option><option>bad tel</option><option>真实号码为空!</option><option>no clid</option><option>bad clid</option><option>无可用中继信息</option><option>wrong obClidGroup</option><option>bad timeout range</option><option>呼叫过频</option></select><button class="btn" type="button" ${canWrite(task)?'':'disabled'} onclick="${handler('receiveRetryFailureDemo',task.taskId)}">接收合成失败</button></div></details>`}
    ${technical('<h3>失败补提交尝试</h3>'+evidence(attempts)+'<p>排队计划不消耗次数；已实际准备发送、明确受理或拒绝均占用，未知保留原尝试。每次供应商新业务补提交单独记录 fileId，业务系统结果补送不改变额度。</p>')}</section>`;
  }
  function tickFailureRetryUi(observedAt=Date.now()) {
    if(typeof document?.querySelectorAll!=='function')return;
    for(const node of document.querySelectorAll('[data-failure-retry-due]')){const seconds=Math.max(0,Math.ceil((Date.parse(node.getAttribute('data-failure-retry-due'))-observedAt)/1000));node.textContent=seconds?seconds+' 秒后自动补提交':'等待系统处理';}
  }
  function openRetryDemoConfirmation(taskId) {
    const task=canonical(taskId);if(!task||!canWrite(task))return false;
    ui().confirm({id:'dcc-failure-retry-demo-confirm',title:'确认本地演示条件',confirmText:'确认合成演示',body:'<p>这些勾选只说明本次合成演示已准备好，不能代表真实供应商能力通过。</p><label><input id="dccRetryNativeConfirmed" type="checkbox"> 本次合成客户已排除供应商原生重呼</label><br><label><input id="dccRetryNavigationConfirmed" type="checkbox"> 本次合成线路已完成导航降级</label><label class="dcc-field"><span>合成提交响应</span><select id="dccFailureRetryOutcome"><option value="accepted">已受理</option><option value="rejected">明确拒绝</option><option value="unknown">结果未知</option></select></label>',onConfirm:()=>{const conditions={taskId,confirmed:true,nativeRetryExcluded:document.getElementById('dccRetryNativeConfirmed')?.checked===true,navigationReady:document.getElementById('dccRetryNavigationConfirmed')?.checked===true,outcome:document.getElementById('dccFailureRetryOutcome')?.value};return failureOperation(taskId,'retry-demo','失败处理演示条件',()=>runtime().confirmFailureRetryDemo(conditions),'演示条件已保存；真实调用继续关闭。');}});return true;
  }
  function receiveRetryFailureDemo(taskId) {const reason=document.getElementById('dccRetryFailureReason')?.value;return failureOperation(taskId,'retry-failure','合成失败结果',()=>runtime().simulateFailureRetryFailure({taskId,reason}),'准确失败已保存。自动类从本次确认时间等待 2 分钟，人工类请处理当前记录。');}
  function openFailureResubmit(taskId,planId) {
    const view=runtime().failureRetryView(taskId),plan=view?.data?.plans.find(row=>row.planId===planId);
    if(!view.ok||!plan||plan.mode!=='manual'||!plan.canExecute){window.showToast?.(plan?.blockReason||'当前失败客户不能补提交','warning');return false;}
    ui().confirm({id:'dcc-manual-failure-resubmit',title:'补提交当前失败客户',confirmText:'确认补提交',body:'<p>只补提交号码 '+esc(plan.phone)+'，沿用原任务和导入资料。</p><p>已使用 '+plan.quota.used+' 次，剩余 '+plan.quota.remaining+' 次（不含首次）。此操作不会新增或编辑客户名单。</p>',onConfirm:()=>failureOperation(taskId,'failure-resubmit','客户补提交',()=>runtime().executeFailureRetry({taskId,planId,manualConfirmed:true}),result=>result.data.state==='unknown'?'提交结果待确认，本次占用保留，请勿重复提交。':result.data.state==='accepted'?'本次补提交已受理（演示）。':'本次补提交明确被拒绝，已消耗一次。')});return true;
  }

  function deliveryException(task,kind,row,data,method,id) {
    return objectDeliveries(task,kind,row,data).some(delivery=>delivery.state==='failed')?'<br><button class="table-link dcc-delivery-warning" type="button" data-dcc-delivery-alert="'+esc(id)+'" onclick="'+handler(method,task.taskId,id)+'">业务系统回传失败</button>':'';
  }
  function retryCandidate(taskId,deliveryId) {
    const task=canonical(taskId),view=runtime().taskRecords(taskId);
    if(!task||!view.ok||failureDisabled(task))return null;
    const candidates=dccDeliveries(task,view.data).filter(row=>row.deliveryId===deliveryId&&row.state==='failed');
    return candidates.length===1?candidates[0]:null;
  }
  const deliveryBinding=delivery=>JSON.stringify([delivery.deliveryId,delivery.resultId,delivery.resultVersion,delivery.failureId,delivery.deletionId,delivery.payload]);
  function openDeliveryRetry(taskId,deliveryId) {
    const delivery=retryCandidate(taskId,deliveryId);if(!delivery)return false;
    const binding=deliveryBinding(delivery);
    ui().confirm({id:'dcc-delivery-retry',title:'重新回传结果',confirmText:'确认演示',body:'<p>只重新发送这条处理结果，不会再次呼叫客户。</p><label class="dcc-field"><span>演示结果（不发送真实请求）</span><select id="dccRetryOutcome"><option value="failed">回传失败</option><option value="succeeded">回传成功</option></select></label>',onConfirm:()=>retryFailureDelivery(taskId,deliveryId,document.getElementById('dccRetryOutcome')?.value,binding)});return true;
  }

  async function failureOperation(taskId,operation,title,callback,detail) {
    const task=canonical(taskId);
    if(!task||failureDisabled(task)||!runtime().failureView(taskId).ok){window.showToast?.('当前身份或任务范围不允许此操作','warning');return false;}
    const accountId=window.AppState.get().accountId;
    failureBusy.set(taskId,operation);failureFeedback.set(taskId,{tone:'info',title:title+'处理中',detail:'正在处理，请稍候。'});refresh(taskId);
    await new Promise(resolve=>setTimeout(resolve,240));
    let result;
    try {
      const current=canonical(taskId);
      result=accountId===window.AppState.get().accountId&&current&&canWrite(current)?await callback():{ok:false,reason:'登录身份或任务权限已变化，未执行此操作。'};
    } catch(error) { result={ok:false,reason:'合成操作未完成，当前明细与状态仍可查看。'}; }
    failureBusy.delete(taskId);
    failureFeedback.set(taskId,{tone:result.ok?'success':'warning',title:result.ok?title+'已记录':title+'被拒绝',detail:result.ok?(typeof detail==='function'?detail(result):detail||'状态已保存。'):result.reason});
    refresh(taskId);return result;
  }
  function selectFailureScenario(taskId,id) { if(!shardScenarios()[id])return false;selectedShardScenarios.set(taskId,id);return true; }
  function prepareFailureDemo(taskId) { return failureOperation(taskId,'prepare','合成线索准备',()=>runtime().prepareFailureDemo({taskId}),'四条合成线索已逐行保存并自动提交；请查看导入阶段与 53 失败分片，不能将准备完成视为实际呼叫完成。'); }
  function sendFailureShard(taskId) {
    const scenarioId=selectedShardScenarios.get(taskId)||'STEP06-SHARD-2';
    return failureOperation(taskId,'shard','合成失败分片',()=>runtime().simulateFailure53({taskId,scenarioId}),result=>result.data.duplicate?'相同分片已去重，未新增失败明细、交付或导入提交。':'分片与原始关联证据已保存；'+completenessLabel(result.data.group?.completeness)+'，全导入终态仍未知。');
  }
  function createFailureSnapshot(taskId) { return failureOperation(taskId,'snapshot','下载文件',()=>runtime().createFailureSnapshot({taskId}),result=>'已准备 '+result.data.memberIds.length+' 条异常明细，请在下载记录中下载文件。'); }
  async function downloadFailureSnapshot(taskId,snapshotId) {
    const task=canonical(taskId),view=runtime().failureView(taskId),snapshot=view.data?.exportSnapshots?.find(row=>row.snapshotId===snapshotId);
    if(!task||failureDisabled(task)||!view.ok||!snapshot?.file)return false;
    if(typeof window.showSaveFilePicker!=='function')return failureOperation(taskId,'download','下载文件',()=>{
      const current=runtime().failureView(taskId),saved=current.data?.exportSnapshots?.find(row=>row.snapshotId===snapshotId);
      if(!current.ok||!saved?.file)return {ok:false,reason:'当前文件已变化，请重新准备。'};
      const result=runtime().recordSnapshotDownload({taskId,snapshotId,outcome:'clicked'});if(!result.ok)return result;
      let url;
      try{url=URL.createObjectURL(new Blob([saved.file.content],{type:'text/csv;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=saved.file.name;anchor.hidden=true;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
      catch(_){if(url)URL.revokeObjectURL(url);runtime().recordSnapshotDownload({taskId,snapshotId,outcome:'failed'});return {ok:false,reason:'下载未完成，异常明细继续保留。'};}
      return result;
    },'已发起普通下载，保存结果待确认，异常明细继续保留。');
    const accountId=window.AppState.get().accountId,bytes=snapshot.file.content;
    const active=()=>accountId===window.AppState.get().accountId&&canonical(taskId)&&canWrite(canonical(taskId))&&runtime().failureView(taskId).ok;
    let chosen;
    // Open immediately during the user's click; no artificial delay precedes the native dialog.
    try{chosen=window.showSaveFilePicker({suggestedName:snapshot.file.name,types:[{description:'CSV 文件',accept:{'text/csv':['.csv']}}]});}
    catch(_){return false;}
    failureBusy.set(taskId,'save-file');let stream,result;
    try{
      const handle=await chosen;if(!active())throw Error('工作范围已变化，异常明细保留。');
      const clicked=runtime().recordSnapshotDownload({taskId,snapshotId,outcome:'clicked'});if(!clicked.ok)throw Error(clicked.reason);
      stream=await handle.createWritable();await stream.write(bytes);await stream.close();stream=null;
      const written=await handle.getFile();if(await written.text()!==bytes)throw Error('文件回读未通过，异常明细保留。');
      if(!active())throw Error('文件已保存，但工作范围已变化，异常明细保留。');
      result=runtime().recordSnapshotDownload({taskId,snapshotId,outcome:'succeeded',trustedFileCompletion:true,completionEvidence:{method:'file-system-access',closed:true,readBackVerified:true,bytes:written.size}});
    }catch(error){try{await stream?.abort?.();}catch(_){}if(active())runtime().recordSnapshotDownload({taskId,snapshotId,outcome:error?.name==='AbortError'?'interrupted':'failed'});result={ok:false,reason:error?.name==='AbortError'?'已取消保存，异常明细继续保留。':error.message||'保存未确认完成，异常明细继续保留。'};}
    failureBusy.delete(taskId);failureFeedback.set(taskId,{tone:result.ok?'success':'warning',title:result.ok?'文件已保存':'异常明细已保留',detail:result.ok?'已完成写入、关闭并回读核对，仅清理本次文件包含的明细版本。':result.reason});refresh(taskId);return result;
  }
  function signalSnapshotDownload(taskId,snapshotId,outcome) {
    if(!['failed','interrupted','succeeded'].includes(outcome))return false;
    return failureOperation(taskId,'download-signal','独立合成下载信号',()=>runtime().recordSnapshotDownload({taskId,snapshotId,outcome,...(outcome==='succeeded'?{trustedSyntheticCompletion:true}:{})}),outcome==='succeeded'?'合成可信成功已记录，只清本次快照包含的明细版本和文件；后到的新失败、业务记录、分片和 业务系统回传状态继续保留。':'本次合成下载'+(outcome==='failed'?'失败':'中断')+'已记录，文件与明细继续保留，可再次下载。');
  }
  async function retryFailureDelivery(taskId,deliveryId,outcome,expectedBinding) {
    const delivery=retryCandidate(taskId,deliveryId);
    if(!delivery||!['failed','succeeded'].includes(outcome))return false;
    const binding=deliveryBinding(delivery);if(expectedBinding&&expectedBinding!==binding)return false;
    const result=await failureOperation(taskId,'delivery','结果回传',()=>{
      const task=canonical(taskId),view=runtime().taskRecords(taskId);
      const current=view.ok?dccDeliveries(task,view.data).find(row=>row.deliveryId===deliveryId&&row.state==='failed'):null;
      if(!current||deliveryBinding(current)!==binding)return {ok:false,reason:'结果或回传状态已变化，请重新查看详情。'};
      return runtime().retryDelivery({taskId,deliveryId,outcome});
    },outcome==='succeeded'?'业务系统已收到这条结果（演示），未再次呼叫客户。':'回传仍未成功，可稍后再试。');
    if(result&&!result.ok)window.showToast?.(result.reason,'warning');
    return result;
  }
  function openFailureDetail(taskId,failureId) {
    const result=runtime().failureView(taskId),row=result.data?.failureEvents?.find(item=>item.failureId===failureId);if(!result.ok||!row)return false;
    ui().openLayer('dcc-failure-detail',`<div class="layer-header"><div><h2>导入异常详情</h2><p>${esc(row.failureId)} · ${esc(stageLabel(row.stage))}</p></div><button type="button" aria-label="关闭" onclick="PlatformUI.closeLayer('dcc-failure-detail')">×</button></div><div class="layer-body"><dl class="dcc-detail-list"><div><dt>手机号</dt><dd>${esc(row.phone||'待确认')}</dd></div><div><dt>问题类型</dt><dd>${esc(stageLabel(row.stage))}</dd></div><div><dt>失败原因</dt><dd>${esc(row.reason)}</dd></div><div><dt>处理建议</dt><dd>${esc(failureAdvice(row))}</dd></div></dl>${deliveryDetails(taskId,'failure',failureId)}<details class="dcc-submission-details"><summary>技术详情（排查时查看）</summary><dl class="dcc-detail-list"><div><dt>租户 / 供应商任务</dt><dd>${esc(row.tenantId)} / ${esc(row.supplierTaskId)}</dd></div><div><dt>本地批次 / fileId</dt><dd>${esc(row.batchId||'关联待核')} / ${esc(row.supplierFileId||'未明确返回')}</dd></div><div><dt>线索 / 手机号</dt><dd>${esc(row.leadCode||'待核')} / ${esc(row.phone||'未明确返回')}</dd></div><div><dt>原始失败原因</dt><dd>${esc(row.reason)}</dd></div><div><dt>待核说明</dt><dd>${esc(row.reviewReason||'—')}</dd></div><div><dt>去重 / 证据版本</dt><dd>${esc(row.dedupKey)} / ${esc(row.version)}</dd></div><div><dt>已导出版本</dt><dd>${esc((row.exportedVersions||[]).join(', ')||'尚未成功导出')}</dd></div></dl><h3>原始数据</h3>${evidence(row.originalData)}<h3>各来源证据</h3>${evidence(row.evidence)}<p class="dcc-muted">导入失败与实际呼叫独立；关联待核不盲配、不重新导入。</p></details></div><div class="layer-footer"><button class="btn" type="button" onclick="PlatformUI.closeLayer('dcc-failure-detail')">关闭</button></div>`,'wide');return true;
  }
  function openFailureGroup(taskId,groupId) {
    const result=runtime().failureView(taskId),group=result.data?.failureGroups?.find(row=>row.groupId===groupId);if(!result.ok||!group)return false;
    ui().openLayer('dcc-failure-group',`<div class="layer-header"><div><h2>失败推送组声明与分片</h2><p>${esc(group.groupId)} · ${esc(completenessLabel(group.completeness))}</p></div><button type="button" aria-label="关闭" onclick="PlatformUI.closeLayer('dcc-failure-group')">×</button></div><div class="layer-body">${ui().alert('info','分片仅表示失败推送组','保留每个乱序、重复或冲突的原始声明；收齐不证明整个导入终态。')}<h3>各次声明与原始来源</h3>${evidence(group.declarations)}<h3>已收到分片及各版本</h3>${evidence(group.shards)}<h3>待核说明</h3>${evidence(group.reviewReasons)}</div><div class="layer-footer"><button class="btn" type="button" onclick="PlatformUI.closeLayer('dcc-failure-group')">关闭</button></div>`,'wide');return true;
  }
  function selectScenario(taskId,id) { if(!scenarios()[id])return false;selectedScenarios.set(taskId,id);return true; }
  async function receiveScenario(taskId) {
    const task=canonical(taskId),view=runtime().taskRecords(taskId);
    if(dccBusy||!task||!view.ok||task.dccImportSource!=='api'||!canWrite(task))return false;
    const accountId=window.AppState.get().accountId;
    dccBusy=true;document.getElementById('dccReceiveScenario')?.setAttribute('disabled','');
    const panel=document.querySelector('[data-dcc-task-id="'+taskId+'"]');
    if(panel){const status=document.createElement('div');status.id='dccImportProcessing';status.setAttribute('aria-live','polite');status.innerHTML=ui().alert('info','逐行接收处理中','本地保存后将自动提交单号批次；不发送真实请求。');panel.prepend(status);}
    await new Promise(resolve=>setTimeout(resolve,240));
    const current=canonical(taskId);
    const result=accountId===window.AppState.get().accountId&&current?.dccImportSource==='api'&&canWrite(current)?runtime().simulateDccImport({taskId,scenarioId:selectedScenarios.get(taskId)||'STEP05-TWO',sourceApplicationId:document.getElementById('dccSourceApplication')?.value,businessBatchNo:document.getElementById('dccBusinessBatchNo')?.value}):{ok:false,reason:'登录身份已变化，未接收线索。'};
    importFeedback.set(taskId,result);dccBusy=false;
    const feedback=document.getElementById('dccApiImportFeedback');
    if(result.ok)ui().closeLayer('dcc-api-import');
    else {if(feedback)feedback.innerHTML=ui().alert('warning','导入被拒绝',result.reason);document.getElementById('dccReceiveScenario')?.removeAttribute('disabled');}
    refresh(taskId);return result;
  }
  function openImport(taskId) {
    if(dccBusy||manualDraft?.busy)return false;
    const task=canonical(taskId);let view=runtime().taskRecords(taskId);
    if(task&&view.code==='UNREGISTERED_TASK'&&canWrite(task)){const registered=runtime().registerTask(task);if(registered.ok)view=runtime().taskRecords(taskId);}
    if(!task||!view.ok||!canWrite(task)||window.CloudTaskWorkspace?.customerImportReason?.(task)){window.showToast?.(window.CloudTaskWorkspace?.customerImportReason?.(task)||view.reason||'当前任务不可导入客户','warning');return false;}
    return task.dccImportSource==='api'?openDccImport(taskId):openManual(taskId);
  }
  function openDccImport(taskId) {
    const task=canonical(taskId),view=runtime().taskRecords(taskId);
    if(dccBusy||!task||!view.ok||task.dccImportSource!=='api'||!canWrite(task))return false;
    const scenarioId=selectedScenarios.get(taskId)||'STEP05-TWO',applicationResult=runtime().applicationsForTask?.(taskId),applications=applicationResult?.ok?applicationResult.data:[];
    ui().openLayer('dcc-api-import',`<div class="layer-header"><div><h2>导入客户</h2><p>当前预外呼任务接收业务系统导入。</p></div><button type="button" aria-label="关闭" onclick="PlatformUI.closeLayer('dcc-api-import')">×</button></div><div class="layer-body"><label class="dcc-field"><span>来源应用</span><select id="dccSourceApplication"><option value="">请选择</option>${applications.map(app=>'<option value="'+esc(app.applicationId)+'" '+(applications.length===1?'selected':'')+'>'+esc(app.name)+(app.callbackConfigured?'':'（请先配置回调地址）')+'</option>').join('')}</select></label><label class="dcc-field"><span>业务批次号</span><input id="dccBusinessBatchNo" value="DEMO-BUSINESS-IMPORT" placeholder="请输入业务系统批次号"></label><label class="dcc-field"><span>合成导入样例</span><select id="dccScenarioId" onchange="DccRecords.selectScenario('${esc(taskId)}',this.value)">${Object.entries(scenarios()).map(([id,scenario])=>'<option value="'+esc(id)+'" '+(id===scenarioId?'selected':'')+'>'+esc(scenario.label)+'</option>').join('')}</select></label><div id="dccApiImportFeedback" aria-live="polite"></div></div><div class="layer-footer"><button class="btn" type="button" onclick="PlatformUI.closeLayer('dcc-api-import')">取消</button><button class="btn btn-primary" id="dccReceiveScenario" type="button" onclick="DccRecords.receiveScenario('${esc(taskId)}')">接收合成线索</button></div>`,'wide');return true;
  }
  function canonical(taskId) { return (window.CloudCallData?.tasks||[]).find(row=>row.taskId===taskId); }
  const manualSavedDrafts=new Map();
  const importedManualFields = () => window.CustomerBusiness?.importedFields || [];
  const optionalManualField = key => ['note','R'].includes(key) || importedManualFields().some(field=>field.key===key);
  const allManualFields=['name','phone','externalDocumentId','leadCode','priority','note','intentionStoreCode','intentionStoreName','intentionSeriesCode','intentionSeries','smartCode','leadCreatedAt','R'];
  const manualType=()=>document.getElementById('dccManualBusinessType')?.value??manualDraft?.form?.businessType??'';
  const manualFields=()=>allManualFields.filter(key=>key!=='externalDocumentId'||manualType()&&manualType()!=='lead');
  const manualLabels={name:'客户称呼',phone:'客户号码',externalDocumentId:'关联单号',leadCode:'线索编码',priority:'优先级',note:'联系备注',R:'R'};
  const manualLabel=key=>key==='externalDocumentId'?(manualBusiness(manualType())?.codeLabel||'关联单号'):(manualLabels[key]||importedManualFields().find(field=>field.key===key)?.label||key);
  function manualBusiness(type,draft=manualDraft) {
    if(!draft)return null;
    const meta=window.CustomerBusiness?.get?.(type,{tenantId:draft.taskTenantId,enterpriseId:draft.taskEnterpriseId});
    return meta&&meta.enabled!==false?meta:null;
  }
  function manualForm() {
    return {businessType:document.getElementById('dccManualBusinessType')?.value||'',importBatchName:document.getElementById('dccManualBatchName')?.value||'',text:document.getElementById('dccManualCsv')?.value||'',uniformPriority:document.getElementById('dccUniformPriority')?.value||''};
  }
  function manualMetaMatches(draft,form=manualForm()) {
    const meta=manualBusiness(form.businessType,draft);
    return !!meta&&draft.previewMeta?.businessType===form.businessType&&draft.previewMeta?.importBatchName===form.importBatchName&&draft.previewMeta?.codeLabel===meta.codeLabel;
  }
  function manualSchema() {
    const descriptions={name:'必填，最多40字',phone:'必填，手机号或带区号固定电话',externalDocumentId:'必填，文本格式，最多100字',leadCode:'必填，填写原线索编码',priority:'必填，可统一填写后逐行修改',note:'选填，最多500字',R:'选填，保留来源信息',...Object.fromEntries(importedManualFields().map(field=>[field.key,'选填，按文本保留原值']))};
    return '<div class="table-scroll"><table class="customer-import-guide"><thead><tr>'+manualFields().map(key=>'<th>'+esc(manualLabel(key))+(optionalManualField(key)?'（选填）':' <em>*</em>')+'</th>').join('')+'</tr></thead><tbody><tr>'+manualFields().map(key=>'<td>'+esc(descriptions[key])+'</td>').join('')+'</tr></tbody></table></div>';
  }
  function rememberManualDraft(draft=manualDraft) {
    if(!draft||!manualContextAllowed(draft))return;
    const form=document.getElementById('dcc-manual-import')?manualForm():draft.form;
    if(form)manualSavedDrafts.set(draft.taskId,{context:{accountId:draft.accountId,scopeTenantId:draft.scopeTenantId,scopeEnterpriseId:draft.scopeEnterpriseId,activeDomain:draft.activeDomain,taskTenantId:draft.taskTenantId,taskEnterpriseId:draft.taskEnterpriseId,supplierTaskId:draft.supplierTaskId},form:clone(form),rows:clone(draft.rows),previewSource:draft.previewSource,previewMeta:clone(draft.previewMeta||null),fileName:draft.fileName||''});
  }
  function openManual(taskId) {
    const task=canonical(taskId),data=runtime().taskRecords(taskId);
    if(manualDraft?.busy||dccBusy||!data.ok||!task||task.dccImportSource!=='manual'||!canWrite(task)||window.CloudTaskWorkspace?.customerImportReason?.(task)){window.showToast?.(data.reason||'来源或权限不允许手工导入','warning');return false;}
    rememberManualDraft();
    const context=window.AppState.get(),scope={accountId:context.accountId,scopeTenantId:context.tenantId,scopeEnterpriseId:context.enterpriseId,activeDomain:context.activeDomain,taskTenantId:task.tenantId,taskEnterpriseId:task.enterpriseId,supplierTaskId:task.dccSupplierTaskId};
    const saved=manualSavedDrafts.get(taskId),restored=saved&&Object.keys(scope).every(key=>scope[key]===saved.context[key])?saved:null;
    const form=restored?.form||{businessType:'',importBatchName:'',text:'',uniformPriority:''};
    manualDraft={taskId,...scope,rows:restored?.rows||[],previewSource:restored?.previewSource??null,previewMeta:restored?.previewMeta||null,form:clone(form),fileName:restored?.fileName||'',busy:false,readingFile:false,revision:0,fileSequence:0};
    const types=(window.CustomerBusiness?.list?.({tenantId:task.tenantId,enterpriseId:task.enterpriseId})||[]).filter(meta=>meta.enabled!==false);
    ui().openLayer('dcc-manual-import',`<div class="layer-header"><div><h2>导入客户名单</h2><p>${esc(task.name||'当前任务')} · 确认后仅导入有效行，按最终优先级自动提交。</p></div><button type="button" aria-label="关闭" onclick="DccRecords.closeManual()">×</button></div>
      <div class="layer-body dcc-manual-editor"><div class="customer-import-steps"><strong>1 填写名单</strong><span>→</span><span>2 检查数据</span><span>→</span><span>3 确认导入</span></div>
      <div class="customer-import-basics"><label class="field"><span>业务类型 <em>*</em></span><select id="dccManualBusinessType" onchange="DccRecords.changeManualBusinessType()"><option value="">请选择业务类型</option>${types.map(meta=>'<option value="'+esc(meta.id)+'" '+(meta.id===form.businessType?'selected':'')+'>'+esc(meta.label)+'</option>').join('')}</select></label><label class="field customer-import-name"><span>批次名称 <em>*</em></span><input id="dccManualBatchName" maxlength="50" value="${esc(form.importBatchName)}" placeholder="请输入批次名称" oninput="DccRecords.invalidateManualPreview()"></label></div>
      <section class="customer-import-section"><div class="customer-import-heading"><h3>准备客户名单</h3><button class="btn" type="button" id="dccManualLoadSample" onclick="DccRecords.loadManualSample()">填入示例</button></div>
      <div class="customer-import-upload"><label for="dccManualFile" class="btn">选择 CSV 文件</label><input id="dccManualFile" type="file" hidden accept=".csv,text/csv" onchange="DccRecords.readManualFile(this.files[0])"><span id="dccManualFilename">${esc(manualDraft.fileName||'未选择文件 · UTF-8 格式，最大 1 MB')}</span></div>
      <div id="dccManualSchema">${manualSchema()}</div><label class="field"><span>粘贴或编辑名单</span><textarea id="dccManualCsv" rows="6" oninput="DccRecords.invalidateManualPreview()" placeholder="${esc(manualFields().map(key=>manualLabel(key)).join(','))}">${esc(form.text)}</textarea><small>每条客户填写一次线索编码；联系备注、R 和意向门店／车系信息、Smartcode 和留资时间选填。每次最多 2000 行，编码按文本保存。</small></label></section>
      <div class="dcc-manual-tools"><label>统一优先级 <input id="dccUniformPriority" type="number" step="any" value="${esc(form.uniformPriority)}" placeholder="填写数值"></label><button class="btn" type="button" id="dccApplyUniformPriority" onclick="DccRecords.applyUniformPriority()">统一填写</button><span>检查后可逐行修改。</span></div>
      <div id="dccManualPreview" aria-live="polite"></div><div id="dccManualFeedback" aria-live="polite"></div></div>
      <div class="layer-footer"><button class="btn" type="button" onclick="DccRecords.closeManual()">取消</button><button class="btn" type="button" id="dccManualCheck" onclick="DccRecords.previewManualCsv()">检查名单</button><button class="btn btn-primary" type="button" id="dccManualSubmit" disabled onclick="DccRecords.submitManual()">确认导入</button></div>`,'large dcc-manual-import-modal');
    drawManualRows();return true;
  }
  function validateManualRows(rows,draft=manualDraft) {
    const form=manualForm(),meta=manualBusiness(form.businessType,draft),good=[],errors=[];
    for(let index=0;index<rows.length;index++) {
      const row=rows[index],phone=String(row.phone??'').replace(/[\s-]/g,'');
      let reason=row._inputError||'';
      if(!reason&&(!String(row.name??'').trim()||String(row.name).length>40))reason='客户称呼必填且不超过40字';
      if(!reason&&!/^(1[3-9]\d{9}|0\d{9,11})$/.test(phone))reason='客户号码格式不正确';
      if(!reason&&form.businessType!=='lead'&&(!String(row.externalDocumentId??'').trim()||String(row.externalDocumentId).length>100))reason=(meta?.codeLabel||'关联单号')+'必填且不超过100字';
      if(!reason&&form.businessType==='lead'&&String(row.leadCode??'').length>100)reason='线索编码不超过100字';
      if(!reason&&!String(row.leadCode??'').trim())reason='线索编码必填，请单独填写';
      const priority=row.priority;
      if(!reason&&(!['number','string'].includes(typeof priority)||typeof priority==='string'&&!priority.trim()||!Number.isFinite(Number(priority))))reason='优先级必填，请填写有效数值或统一填写';
      if(!reason&&String(row.note??'').length>500)reason='联系备注不超过500字';
      if(!reason&&!meta)reason='请选择当前租户已启用的业务类型';
      if(!reason&&(!form.importBatchName.trim()||form.importBatchName.trim().length>50))reason='批次名称必填且不超过50字';
      if(reason)errors.push({line:row._line||index+1,name:row.name||'',phone:row.phone||'',reason});
      else {const clean=Object.fromEntries(manualFields().filter(key=>Object.hasOwn(row,key)).map(key=>[key,row[key]]));good.push({...clean,...(form.businessType==='lead'?{externalDocumentId:row.leadCode}:{}),phone,businessType:form.businessType,importBatchName:form.importBatchName.trim()});}
    }
    return {good,errors};
  }
  function manualPriorityValue(value) {
    return ['number','string'].includes(typeof value)&&!(typeof value==='string'&&!value.trim())&&Number.isFinite(Number(value))?Number(value):value;
  }
  function manualPriorityDisplay(value) {const number=manualPriorityValue(value);return typeof number==='number'&&Number.isFinite(number)?String(number):'';}
  function manualPreviewCurrent(draft=manualDraft) {return !!draft&&draft.previewSource!==null&&draft.previewSource===manualForm().text&&manualMetaMatches(draft);}
  function drawManualRows() {
    const node=document.getElementById('dccManualPreview');if(!node||!manualDraft)return;
    for(const row of manualDraft.rows)if(Object.hasOwn(row,'priority'))row.priority=manualPriorityValue(row.priority);
    const current=manualPreviewCurrent(),validation=validateManualRows(manualDraft.rows),submit=document.getElementById('dccManualSubmit');
    if(submit)submit.disabled=manualDraft.busy||manualDraft.readingFile||!current||!validation.good.length;
    if(!manualDraft.rows.length){node.innerHTML=ui().empty('填写或上传名单后，点击“检查名单”');return;}
    node.innerHTML='<p class="dcc-manual-result-count">可导入 <strong>'+validation.good.length+'</strong> 行，未通过 <strong>'+validation.errors.length+'</strong> 行。确认后仅导入有效行。</p>'+ui().table(manualFields().map(key=>({key,label:manualLabel(key)+(optionalManualField(key)?'（选填）':'（必填）'),render:(value,row)=>manualInput(row.index,key,value,key==='priority'?'number':'text')})),manualDraft.rows.map((row,index)=>({...row,index})),{numbered:false,className:'dcc-manual-preview'})+'<div id="dccManualErrors">'+(validation.errors.length?'<h3>未通过的行</h3>'+ui().table([{key:'line',label:'行'},{key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'reason',label:'未通过原因'}],validation.errors,{numbered:false,className:'dcc-manual-errors'}):'')+'</div>';
  }
  function manualInput(index,key,value,type='text') {
    const attrs=' data-dcc-row="'+index+'" data-dcc-field="'+key+'" aria-label="第 '+(index+1)+' 行 '+esc(manualLabel(key))+'" oninput="DccRecords.updateManualRow('+index+',\''+key+'\',this.value)"';
    if(type==='text'&&key!=='phone')return '<textarea rows="'+(['note','R'].includes(key)?'2':'1')+'"'+attrs+'>'+esc(value??'')+'</textarea>';
    return '<input type="'+type+'" '+(type==='number'?'step="any"':'')+attrs+' value="'+esc(type==='number'?manualPriorityDisplay(value):value??'')+'">';
  }
  function manualContextAllowed(draft) {
    if(!draft)return false;
    const task=canonical(draft.taskId),context=window.AppState.get();
    return draft.accountId===context.accountId&&draft.scopeTenantId===context.tenantId&&draft.scopeEnterpriseId===context.enterpriseId&&draft.activeDomain===context.activeDomain&&
      task?.tenantId===draft.taskTenantId&&task?.enterpriseId===draft.taskEnterpriseId&&task?.dccSupplierTaskId===draft.supplierTaskId&&task?.dccImportSource==='manual'&&canWrite(task)&&!window.CloudTaskWorkspace?.customerImportReason?.(task)&&runtime().taskRecords(draft.taskId).ok;
  }
  function draftAllowed() {return manualDraft&&!manualDraft.busy&&manualContextAllowed(manualDraft);}
  function setManualBusy(draft,busy) {
    draft.busy=busy;if(manualDraft!==draft)return;
    const layer=document.getElementById('dcc-manual-import');drawManualRows();
    for(const control of layer?.querySelectorAll?.('input, textarea, select, button')||[])if(control.id!=='dccManualSubmit'||busy)control.disabled=busy;
  }
  function manualRowsStillMatch(rows) {
    const fields=document.getElementById('dccManualPreview')?.querySelectorAll?.('[data-dcc-row][data-dcc-field]')||[];
    return Array.from(fields).every(field=>{const value=rows[Number(field.dataset.dccRow)]?.[field.dataset.dccField];return (field.dataset.dccField==='priority'?manualPriorityDisplay(value):String(value??'').replace(/\r\n?/g,'\n'))===field.value.replace(/\r\n?/g,'\n');});
  }
  function clearManualFeedback() {const node=document.getElementById('dccManualFeedback');if(node)node.innerHTML='';}
  function invalidateManualPreview() {
    if(!draftAllowed())return false;
    manualDraft.form=manualForm();manualDraft.revision++;manualDraft.rows=[];manualDraft.previewSource=null;manualDraft.previewMeta=null;clearManualFeedback();drawManualRows();return true;
  }
  function changeManualBusinessType() {
    if(!draftAllowed())return false;
    const schema=document.getElementById('dccManualSchema'),input=document.getElementById('dccManualCsv');
    if(schema)schema.innerHTML=manualSchema();if(input)input.placeholder=manualFields().map(key=>manualLabel(key)).join(',');
    return invalidateManualPreview();
  }
  function csvCell(value) {const valueText=String(value??'');return /[,"\r\n]/.test(valueText)?'"'+valueText.replace(/"/g,'""')+'"':valueText;}
  function loadManualSample() {
    if(!draftAllowed())return false;
    const input=document.getElementById('dccManualCsv'),form=manualForm();if(!input)return false;
    if(input.value.trim()){window.showToast?.('请先清空名单，再填入示例，以免覆盖已填写内容','warning');return false;}
    if(!manualBusiness(form.businessType)){window.showToast?.('请先选择已启用的业务类型','warning');return false;}
    const sample=window.DccMock?.manualImportSample;if(!sample?.rows?.length)return false;
    input.value=[manualFields().map(key=>manualLabel(key)).join(','),...sample.rows.map(row=>manualFields().map(key=>csvCell(row[key])).join(','))].join('\n');
    const batch=document.getElementById('dccManualBatchName');if(batch&&!batch.value.trim())batch.value=sample.importBatchName||'';
    manualDraft.fileName='';const label=document.getElementById('dccManualFilename');if(label)label.textContent='示例名单 · 可继续编辑';invalidateManualPreview();return true;
  }
  async function readManualFile(file) {
    if(!file||!draftAllowed())return false;
    const draft=manualDraft,input=document.getElementById('dccManualCsv'),sequence=++draft.fileSequence;draft.readingFile=false;invalidateManualPreview();const revision=draft.revision;
    if(file.size>1024*1024||!/\.csv$/i.test(file.name)){document.getElementById('dccManualFeedback').innerHTML=ui().alert('warning','文件未载入',file.size>1024*1024?'文件不能超过1 MB。':'请选择 CSV 文件；Excel 文件请先另存为 CSV。');return false;}
    draft.readingFile=true;drawManualRows();
    try {
      const text=await file.text();
      if(manualDraft!==draft||sequence!==draft.fileSequence||revision!==draft.revision||input!==document.getElementById('dccManualCsv')||!manualContextAllowed(draft))return false;
      input.value=text;draft.fileName=file.name;const label=document.getElementById('dccManualFilename');if(label)label.textContent=file.name;invalidateManualPreview();return true;
    }catch(error){if(manualDraft===draft&&sequence===draft.fileSequence){const feedback=document.getElementById('dccManualFeedback');if(feedback)feedback.innerHTML=ui().alert('warning','文件读取失败','填写内容已保留，请重新选择文件。');}return false;}
    finally {if(manualDraft===draft&&sequence===draft.fileSequence){draft.readingFile=false;drawManualRows();}}
  }
  function parseManualCsv(text) {
    const rows=[];let cells=[],cell='',quoted=false,closed=false;
    for(let index=0;index<text.length;index++) {
      const char=text[index];
      if(quoted){if(char==='"'){if(text[index+1]==='"'){cell+='"';index++;}else {quoted=false;closed=true;}}else cell+=char;continue;}
      if(char==='"'){if(cell.trim()||closed)throw Error('引号位置不正确');cell='';quoted=true;}
      else if(char===','||char==='\n'){cells.push(cell);cell='';closed=false;if(char==='\n'){if(cells.some(value=>value.trim()))rows.push(cells);cells=[];}}
      else if(char!=='\r'){if(closed&&char.trim())throw Error('引号后有多余字符');cell+=char;}
    }
    if(quoted)throw Error('引号未闭合');cells.push(cell);if(cells.some(value=>value.trim()))rows.push(cells);return rows;
  }
  function manualHeaderKey(title,header,meta) {
    const aliases={客户称呼:'name',客户姓名:'name',姓名:'name',name:'name',称呼:'name',客户号码:'phone',手机号:'phone',手机号码:'phone',号码:'phone',phone:'phone',tel:'phone',业务编码:'externalDocumentId',外部单据标识:'externalDocumentId',externalDocumentId:'externalDocumentId',businessCode:'externalDocumentId',线索编码:'leadCode',leadCode:'leadCode',优先级:'priority',最终优先级:'priority',priority:'priority',联系备注:'note',备注:'note',note:'note',R:'R',r:'R'};
    for(const field of importedManualFields()){aliases[field.label]=field.key;aliases[field.key]=field.key;}
    if(Object.hasOwn(aliases,title))return aliases[title];
    return title===meta.codeLabel?'externalDocumentId':'';
  }
  function previewManualCsv() {
    if(!draftAllowed()||manualDraft.readingFile)return false;
    const form=manualForm(),value=form.text.replace(/^\uFEFF/,'');invalidateManualPreview();
    try {
      const meta=manualBusiness(form.businessType);if(!meta)throw Error('请先选择已启用的业务类型。');
      if(!form.importBatchName.trim()||form.importBatchName.trim().length>50)throw Error('请填写50字以内的批次名称。');
      if(new Blob([value]).size>1024*1024)throw Error('名单内容不能超过1 MB。');
      const lines=parseManualCsv(value),header=(lines.shift()||[]).map(key=>key.trim()),keys=header.map(title=>manualHeaderKey(title,header,meta));
      const unknown=header.filter((title,index)=>!keys[index]);if(unknown.length)throw Error('未识别表头：'+unknown.join('、')+'。请按字段说明填写。');
      if(new Set(keys).size!==keys.length)throw Error('字段表头重复，请按字段说明保留每个字段一列。');
      const missing=manualFields().filter(key=>!optionalManualField(key)).filter(key=>!keys.includes(key));if(missing.length)throw Error('名单缺少'+missing.map(key=>manualLabel(key)).join('、')+'。请补齐对应表头和每行数据。');
      if(!lines.length||lines.length>2000)throw Error('每次检查1至2000行客户。');
      manualDraft.rows=lines.map((cells,index)=>{const row={_line:index+2};keys.forEach((key,column)=>{row[key]=cells[column]??'';});if(cells.length>keys.length||cells.length<keys.length&&keys.slice(cells.length).some(key=>!optionalManualField(key)))row._inputError='列数与表头不一致，请检查逗号和引号';if(meta.id==='lead'&&String(row.externalDocumentId??'').trim()&&row.externalDocumentId!==row.leadCode)throw Error('第 '+(index+2)+' 行含两个不同编码。线索类只需线索编码，请核对后移除旧业务编码列。');row.phone=String(row.phone??'').replace(/[\s-]/g,'');row.priority=manualPriorityValue(row.priority);return row;});
      manualDraft.previewSource=form.text;manualDraft.previewMeta={businessType:form.businessType,importBatchName:form.importBatchName,codeLabel:meta.codeLabel};manualDraft.form=form;drawManualRows();return true;
    }catch(error){const feedback=document.getElementById('dccManualFeedback');if(feedback)feedback.innerHTML=ui().alert('warning','名单未通过检查',error.message);return false;}
  }
  function updateManualRow(index,key,value) {
    if(!draftAllowed()||!manualDraft.rows[index]||!manualFields().includes(key))return false;
    manualDraft.rows[index][key]=key==='priority'?manualPriorityValue(value):value;manualDraft.revision++;clearManualFeedback();
    const validation=validateManualRows(manualDraft.rows),submit=document.getElementById('dccManualSubmit');if(submit)submit.disabled=!manualPreviewCurrent()||!validation.good.length;
    const summary=document.querySelector?.('#dccManualPreview .dcc-manual-result-count');if(summary)summary.innerHTML='可导入 <strong>'+validation.good.length+'</strong> 行，未通过 <strong>'+validation.errors.length+'</strong> 行。确认后仅导入有效行。';
    const errorBox=document.getElementById('dccManualErrors');if(errorBox)errorBox.innerHTML=validation.errors.length?'<h3>未通过的行</h3>'+ui().table([{key:'line',label:'行'},{key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'reason',label:'未通过原因'}],validation.errors,{numbered:false,className:'dcc-manual-errors'}):'';return true;
  }
  function applyUniformPriority() {
    if(!draftAllowed()||manualDraft.readingFile)return false;
    const value=document.getElementById('dccUniformPriority')?.value;
    if(value===''||!Number.isFinite(Number(value))){document.getElementById('dccManualFeedback').innerHTML=ui().alert('warning','请填写统一优先级','请输入有效数值。');return false;}
    if(!manualDraft.rows.length&&!previewManualCsv())return false;
    manualDraft.rows=manualDraft.rows.map(row=>({...row,priority:Number(value)}));manualDraft.revision++;clearManualFeedback();drawManualRows();return true;
  }
  async function submitManual() {
    if(!draftAllowed()||manualDraft.readingFile)return false;
    const draft=manualDraft,csv=document.getElementById('dccManualCsv'),form=manualForm();
    if(!manualPreviewCurrent()){invalidateManualPreview();document.getElementById('dccManualFeedback').innerHTML=ui().alert('warning','名单或基础信息已修改','请重新检查名单后确认。');return false;}
    const validation=validateManualRows(draft.rows);if(!validation.good.length){drawManualRows();return false;}
    const submittedRows=clone(validation.good),allRows=clone(draft.rows),previewSource=draft.previewSource,previewMeta=clone(draft.previewMeta),revision=draft.revision;
    setManualBusy(draft,true);document.getElementById('dccManualFeedback').innerHTML=ui().alert('info','正在导入','正在保存 '+submittedRows.length+' 行有效客户。');
    await new Promise(resolve=>setTimeout(resolve,240));
    const sameDraft=manualDraft===draft,sameText=csv===document.getElementById('dccManualCsv')&&csv?.value===previewSource&&draft.previewSource===previewSource;
    const sameRows=JSON.stringify(draft.rows)===JSON.stringify(allRows)&&manualRowsStillMatch(allRows)&&draft.revision===revision;
    const sameMeta=JSON.stringify(draft.previewMeta)===JSON.stringify(previewMeta)&&manualMetaMatches(draft)&&JSON.stringify(manualForm())===JSON.stringify(form);
    let result,invalidated=false;
    if(!sameDraft||!sameText||!sameRows||!sameMeta){invalidated=true;result={ok:false,code:'MANUAL_DRAFT_CHANGED',reason:'导入内容已变化，本次未提交。请重新检查名单。'};}
    else if(!manualContextAllowed(draft)){invalidated=true;result={ok:false,code:'MANUAL_CONTEXT_CHANGED',reason:'登录身份、租户或任务权限已变化，本次未提交。请在当前任务重新打开导入。'};}
    else {try {result=runtime().importManual({taskId:draft.taskId,rows:submittedRows});}catch(error){result={ok:false,code:'MANUAL_IMPORT_FAILED',reason:'导入未完成，填写内容已保留，请重试。'};}}
    if(invalidated){draft.rows=[];draft.previewSource=null;draft.previewMeta=null;}
    setManualBusy(draft,false);if(manualDraft!==draft)return result;
    if(result.ok){manualSavedDrafts.delete(draft.taskId);importFeedback.set(draft.taskId,result);ui().closeLayer('dcc-manual-import');manualDraft=null;refresh(draft.taskId);}
    else {drawManualRows();const feedback=document.getElementById('dccManualFeedback');if(feedback)feedback.innerHTML=ui().alert('warning',invalidated?'本次导入已取消':'导入被拒绝',result.reason);}
    return result;
  }
  function closeManual() {if(manualDraft?.busy)return false;rememberManualDraft();ui().closeLayer('dcc-manual-import');manualDraft=null;return true;}
  function openArchive(taskId,recordId) {
    const view=runtime().directoryRecord(taskId,recordId);
    if(!view.ok){window.showToast?.(view.reason,'warning');return false;}
    const row=view.data.record;return window.CustomerDirectory?.open?.(row.phone,row.tenantId,row.enterpriseId)||false;
  }
  const openDirectoryRecord=(taskId,recordId)=>openDetail(taskId,recordId,true);
  const openDirectoryCall=(taskId,resultId)=>openResultDetail(taskId,resultId,true);
  function openDetail(taskId,recordId,fromDirectory=false) {
    const scoped=fromDirectory?runtime().directoryRecord(taskId,recordId):null;
    if(fromDirectory&&!scoped.ok)return false;
    const result=fromDirectory?{ok:true,data:{records:[scoped.data.record],task:{source:scoped.data.record.source}}}:runtime().taskRecords(taskId),record=result.data?.records.find(row=>row.recordId===recordId);if(!result.ok||!record)return false;
    const actual=fromDirectory?{ok:true,data:{actualResults:scoped.data.results}}:runtime().resultView?.(taskId),actualRows=(actual?.data?.actualResults||[]).filter(row=>row.recordId===recordId);
    ui().openLayer('dcc-record-detail',`<div class="layer-header"><div><h2>客户详情</h2><p>${esc(record.leadCode)} · ${esc(record.phone)}</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer('dcc-record-detail')">×</button></div><div class="layer-body"><h3>客户信息</h3><dl class="dcc-detail-list"><div><dt>客户 / 手机号</dt><dd>${esc(record.name||record.leadCode)} / ${esc(record.phone)}</dd></div><div><dt>业务类型</dt><dd>${esc(recordBusinessType(record))}</dd></div>${record.source==='api'?'<div><dt>业务批次号</dt><dd>'+esc(record.businessBatchNo||'历史未提供')+'</dd></div>':''}<div><dt>导入批次</dt><dd>${esc(recordBatch(record))}</dd></div><div><dt>导入状态</dt><dd>${esc(importLabel(record))}</dd></div><div><dt>呼叫进展</dt><dd>${recordResultLabel(record,actual?.ok?actual.data:null)} ${fromDirectory?'':'<button class="table-link" type="button" onclick="'+handler('openCalls',taskId,recordId)+'">查看通话</button>'}</dd></div><div><dt>优先级</dt><dd>${esc(record.priority)}</dd></div><div><dt>联系备注</dt><dd>${esc(record.note||'—')}</dd></div></dl><h3>导入时的客户信息</h3>${CustomerBusiness.importedDetail(record)}${deliveryDetails(taskId,'record',recordId)}<details class="dcc-submission-details"><summary>技术详情（排查时查看）</summary><dl class="dcc-detail-list"><div><dt>租户 / 供应商任务</dt><dd>${esc(record.tenantId)} / ${esc(record.supplierTaskId)}</dd></div><div><dt>本地记录 / 批次</dt><dd>${esc(record.recordId)} / ${esc(record.batchId)}</dd></div><div><dt>供应商 fileId</dt><dd>${esc(record.supplierFileId||'未准确返回')}</dd></div>${result.data.task?.source==='api'||record.source==='api'?'<div><dt>批次关系 / 主批次</dt><dd>'+esc(batchKind(record))+' / '+esc(record.rootBatchId||'待核')+'</dd></div><div><dt>本次请求</dt><dd>'+esc(record.requestId||'历史请求待核')+'</dd></div>':''}<div><dt>新批次时间（北京）</dt><dd>${esc(beijingTime(record.newBatchCreatedAt))}</dd></div>${record.source==='manual'?'<div><dt>客户称呼</dt><dd>'+esc(record.name||'—')+'</dd></div><div><dt>业务类型 / 导入批次名称</dt><dd>'+esc(window.CustomerBusiness?.get?.(record.businessType,{tenantId:record.tenantId,enterpriseId:result.data.task.enterpriseId})?.label||record.businessType||'—')+' / '+esc(record.importBatchName||'—')+'</dd></div><div><dt>'+esc(record.businessType==='lead'?'原导入关联编码（历史）':window.CustomerBusiness?.get?.(record.businessType,{tenantId:record.tenantId,enterpriseId:result.data.task.enterpriseId})?.codeLabel||'关联单号')+'</dt><dd>'+esc(record.externalDocumentId||'—')+'</dd></div><div><dt>联系备注</dt><dd class="dcc-manual-note-value">'+esc(record.note??'—')+'</dd></div>':''}<div><dt>priority / R</dt><dd>${esc(record.priority)} / ${esc(Object.hasOwn(record,'R')?record.R:'未提供（有效）')}</dd></div><div><dt>来源追踪</dt><dd>${esc(record.sourceApplicationId||(record.source==='manual'?'手工导入，无来源应用绑定':'来源应用待核'))}</dd></div><div><dt>三阶段状态</dt><dd>本地已保存 / ${esc(importLabel(record))} / 实际呼叫对象 ${actualRows.filter(row=>row.kind==='call').length}，稳定无话单事件 ${actualRows.filter(row=>row.kind==='no_cdr_failure').length}</dd></div><div><dt>待核原因</dt><dd>${esc(record.reviewReason||'—')}</dd></div></dl><h3>合成同步响应原字段及来源</h3><pre class="dcc-raw-evidence">${esc(JSON.stringify(record.syncResponses,null,2))}</pre><p class="dcc-muted">result 与 importTotal / successTotal / invalidTotal 均保留来源；导入接受不是接通。未返回的字段不补成功值。</p>${deletionEvidenceMarkup(taskId,record)}</details></div><div class="layer-footer">${runtime().directoryRecord?.(taskId,recordId)?.ok?'<button class="btn" type="button" onclick="'+handler('openArchive',taskId,recordId)+'">查看客户档案</button>':''}<button class="btn" onclick="PlatformUI.closeLayer('dcc-record-detail')">关闭</button></div>`,'wide');return true;
  }
  function refresh(taskId) {
    if(!taskId)return;
    refreshDeliveryDetails(taskId);
    const route=window.RouteRuntime?.snapshot?.();
    if(route?.key==='predictive-tasks'){window.RouteRuntime?.refreshCurrent?.();return;}
    const center=document.querySelector('.cloud-task-center[data-task-sync-id]'),records=document.querySelector('[data-dcc-task-id]');
    if(center?.dataset.taskSyncId===taskId){
      const count=center.querySelector('[data-task-calls-count]'),summary=resultSummary(taskId);
      if(count)count.textContent=summary.ok?String(summary.data.calls):'待确认';
      const tab=route?.options?.tab||'overview';
      if(['overview','calls','results','dcc-records','customers'].includes(tab))window.RouteRuntime?.refreshCurrent?.();
    } else if(records?.dataset.dccTaskId===taskId)window.RouteRuntime?.refreshCurrent?.();
  }
  window.addEventListener('dcc:records-changed',event=>refresh(event.detail?.taskId));
  window.DccRecords={openArchive,openDirectoryRecord,openDirectoryCall,render,renderCalls,resultSummary,openCalls,syncCallScope,clearCallFilter,switchTab,openDeliveryRetry,confirmDeletion,receiveDeletionConfirmation,selectScenario,receiveScenario,openImport,openDccImport,openManual,closeManual,loadManualSample,readManualFile,changeManualBusinessType,previewManualCsv,invalidateManualPreview,updateManualRow,applyUniformPriority,submitManual,openDetail,selectFailureScenario,prepareFailureDemo,sendFailureShard,createFailureSnapshot,downloadFailureSnapshot,signalSnapshotDownload,retryFailureDelivery,openFailureDetail,openFailureGroup,selectResultScenario,prepareResultDemo,receiveResult,openResultDetail,openFailureResubmit,openRetryDemoConfirmation,receiveRetryFailureDemo,tickFailureRetryUi,selectDeletionRecord,selectDeletionScenario,deleteSupplierRecord,repushSelectedRecord,openDeletionDetail};
}());
