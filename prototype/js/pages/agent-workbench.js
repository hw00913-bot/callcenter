/** Unified agent workspace. Telephone events are local demonstrations only. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, data = CloudCallData;
  const recordsKey = 'native-workbench-records-v1', sessionKey = 'native-workbench-session-v1';
  let scope = '', draft = {}, call = null, phase = 'idle', online = false, signingIn = false;
  let restorationError = '';
  let seatId = '', releaseLock = null, error = '', demoResult = '接通', muted = false;
  let seatLockDone=Promise.resolve();
  let answerTimer, ringTimer, lastSavedId = '', disposition = '', remark = '';
  let followup = CustomerFollowup.empty(), followupVersion = '', draftStored = true;
  let modalMode=false, modalVisible=false, returnFocus=null;
  const modalId='assigned-call-dialog';
  let origin=null,originScroll=0,seatOptions={},workspaceTab='';
  let suspendedDraft=null,receivingOrigin=false;
  const receiving=()=>['inbound','predictive'].includes(call?.workbenchKind);
  const customerPhone=row=>row?.direction==='呼入'?row.caller:row?.callee;
  const callLabel=()=>call?.workbenchKind==='inbound'?'呼入来电':call?.workbenchKind==='predictive'?'预外呼任务来电':'联系客户';
  const busy = () => ['offered', 'answering', 'dialing', 'ringing', 'connected', 'wrap'].includes(phase);
  const stamp = value => new Date(value || Date.now()).toLocaleString('sv-SE');
  const duration = value => String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
  const currentScope = () => AppState.account().accountId + ':' + AppState.get().tenantId;
  function read(key, storage) { try { return JSON.parse(storage.getItem(key) || 'null'); } catch (_) { return null; } }
  function write(key, value, storage) { try { storage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function sameNativeCall(a, b) {
    return !!a?.callId && !!b?.callId && a.callSource === 'NATIVE_WORKBENCH' && b.callSource === 'NATIVE_WORKBENCH' &&
      ['callId', 'contactId', 'tenantId', 'enterpriseId', 'accountId', 'customerTaskItemId', 'taskId', 'workbenchKind', 'caller', 'callee'].every(key => (a[key] || '') === (b[key] || ''));
  }
  function myAgent() {
    const account = AppState.account(), context = AppState.get();
    return data.agents.find(a => a.tenantId === context.tenantId && a.enterpriseId === context.enterpriseId &&
      a.lifecycleStatus !== '已删除' && (a.accountId === account.accountId ||
        (!a.accountId && a.contactCenterIdentityId === account.linkedIdentityId)));
  }
  function syncReceivingProgress(){
    const batches=read('customer-task-batches-v1',localStorage);if(!Array.isArray(batches))return;
    const routed=data.calls.filter(row=>row.workbenchKind==='predictive'&&row.simulation&&row.endedAt);
    for(const task of data.tasks.filter(task=>task.simulation&&routed.some(row=>row.taskId===task.taskId&&row.tenantId===task.tenantId&&row.enterpriseId===task.enterpriseId))){
      const items=new Set(batches.filter(batch=>batch.tenantId===task.tenantId&&batch.enterpriseId===task.enterpriseId).flatMap(batch=>(batch.rows||[]).filter(row=>row.taskId===task.taskId).map(row=>row.id)));
      const calls=data.calls.filter(row=>row.taskId===task.taskId&&row.tenantId===task.tenantId&&row.enterpriseId===task.enterpriseId&&row.callType==='预外呼'&&items.has(row.customerTaskItemId)&&row.endedAt&&CallState.view(row).ended);
      task.completed=Math.max(Number(task.completed)||0,new Set(calls.map(row=>row.customerTaskItemId)).size);
      task.connected=Math.max(Number(task.connected)||0,new Set(calls.filter(row=>CallState.view(row).answered===true).map(row=>row.customerTaskItemId)).size);
      for(const listed of data.predictiveTasks||[])if(listed.taskId===task.taskId&&listed.tenantId===task.tenantId&&listed.enterpriseId===task.enterpriseId){listed.completed=task.completed;listed.connected=task.connected;}
      // Receiving updates local observed progress, never supplier task status or retry scheduling.
    }
  }
  function loadRecords() {
    const rows = read(recordsKey, localStorage);
    if (!Array.isArray(rows)) return;
    rows.filter(r => r.callSource === 'NATIVE_WORKBENCH' && r.callId).forEach(r => {
      const existing = data.calls.find(c => c.callId === r.callId);
      if (existing) Object.assign(existing, r); else data.calls.unshift(r);
    });
    window.CustomerDirectory?.sync();syncReceivingProgress();
  }
  function saveRecord(row, complete = false) {
    if (complete) {
      let previous, rows, written = false, customerSaved = false;
      const completed = { ...row }; delete completed.pendingDisposition;
      try {
        previous = localStorage.getItem(recordsKey);
        rows = previous === null ? [] : JSON.parse(previous);
        if (!Array.isArray(rows)) throw Error('Invalid native journal');
        const merged = new Map(rows.map(record => [record.callId, record]));
        data.calls.filter(record => record.callSource === 'NATIVE_WORKBENCH' && !merged.has(record.callId)).forEach(record => merged.set(record.callId, record));
        // Persist a recoverable intent, never a completed call, before updating
        // the customer row. Failed rollback therefore cannot publish success.
        merged.set(row.callId, { ...completed, processingStatus: '待填写', agentDisposition: '', dispositionRemark: '', dispositionAt: '',
          pendingDisposition: { agentDisposition: row.agentDisposition, dispositionRemark: row.dispositionRemark, dispositionAt: row.dispositionAt } });
        localStorage.setItem(recordsKey, JSON.stringify([...merged.values()])); written = true;
        if (row.customerTaskItemId && window.CustomerTasks?.syncCall(row) !== true) throw Error('Customer snapshot not saved');
        customerSaved = true;
        merged.set(row.callId, completed);
        localStorage.setItem(recordsKey, JSON.stringify([...merged.values()]));
      } catch (_) {
        if (customerSaved) return { ok: false, message: '客户跟进已保存，通话处理结果尚未完整保存；请保留当前填写内容并重试' };
        if (written) {
          try { if (previous === null) localStorage.removeItem(recordsKey); else localStorage.setItem(recordsKey, previous); }
          catch (_) { return { ok: false, message: '通话暂存资料尚未恢复，处理结果仍待填写；请保留当前内容并重试' }; }
        }
        return { ok: false, message: '处理结果未能完整保存，当前填写内容已保留，请重试' };
      }
      const existing = data.calls.find(record => record.callId === row.callId);
      if (existing) { Object.assign(existing, completed); delete existing.pendingDisposition; } else data.calls.unshift(completed);
      try { window.CustomerDirectory?.sync(); } catch (_) { showToast('处理结果已保存，客户档案展示暂未刷新，请重新查看', 'warning'); }
      syncReceivingProgress();return { ok: true };
    }
    const existing = data.calls.find(c => c.callId === row.callId);
    if (existing) Object.assign(existing, row); else data.calls.unshift(row);
    const saved = read(recordsKey, localStorage);
    const merged = new Map((Array.isArray(saved) ? saved : []).map(c => [c.callId, c]));
    data.calls.filter(c => c.callSource === 'NATIVE_WORKBENCH').forEach(c => merged.set(c.callId, c));
    if (!write(recordsKey, Array.from(merged.values()), localStorage)) showToast('浏览器存储不可用，记录仅保留在当前页面会话', 'warning');
    window.CustomerTasks?.syncCall(row);
    window.CustomerDirectory?.sync();syncReceivingProgress();
  }
  function demoEvent(row, role, type, at = Date.now()) {
    return CallState.ingest(row, { enterpriseId: row.enterpriseId, contactId: row.contactId,
      channelId: row.callId + '-' + role, role, type, at, source: 'local-simulation' });
  }
  function syncStateDisplay(row) {
    const state = CallState.view(row);
    row.result = state.answered === true ? '接通' : state.answered === false ? '未接通' : '待确认';
    row.answeredAt = state.customerEstablishedAt ? stamp(state.customerEstablishedAt) : '—';
    return state;
  }
  function demoFinal(row, outcome) {
    const connected = CallState.view(row).answered === true;
    const cdr = { EnterpriseId: row.enterpriseId, ContactId: row.contactId, Data: {
      ReleaseTime: row.endedMs || Date.parse(row.endedAt), ContactDisposition: connected ? 'Success' : outcome === '客户拒接' ? 'Reject' : 'NoAnswer'
    } };
    CallState.reconcile(row, cdr, { source: 'local-simulation',
      ...(outcome === '已取消' ? { normalizedFailureReason: 'CANCELLED', confirmedUnanswered: true } : {}) });
    const numberCode = !connected ? { '客户忙线': 710, '客户拒接': 712, '无人接听': 718, '未接通': 718, '客户未接': 718 }[outcome] : undefined;
    row.alictiCdr = numberCode === undefined ? null : AliCtiNumberStatus.demoCdr('manual', numberCode);
    // This local outcome explicitly says the customer was not connected.
    if (row.alictiCdr) row.alictiCdr.raw.status = 1;
    syncStateDisplay(row);
  }
  function confirmDemoResult(id, outcome) {
    const row = data.calls.find(r => r.callId === id);
    if (!['接通', '未接通'].includes(outcome) || !row?.simulation || row.callSource !== 'NATIVE_WORKBENCH' ||
      !row.telephony || !row.endedAt || CallState.view(row).known ||
      AppState.get().activeDomain !== 'CLOUD_CONTACT_CENTER' || !AppState.authorizeObject('', row) ||
      (AppState.effectiveAccess().roleCode === 'OPERATOR' && row.accountId !== AppState.account().accountId)) return false;
    // Calibrate an isolated copy. The source journal and batch must both persist
    // before the live record or dashboard can publish the newly confirmed result.
    let previous, records, next;
    try {
      previous = localStorage.getItem(recordsKey);
      records = previous === null ? [] : JSON.parse(previous);
      if (!Array.isArray(records)) throw Error('Invalid native journal');
      const stored = records.find(record => record.callId === id);
      if (stored && (stored.enterpriseId !== row.enterpriseId || stored.tenantId !== row.tenantId ||
        stored.accountId !== row.accountId || stored.customerTaskItemId !== row.customerTaskItemId ||
        stored.callSource !== 'NATIVE_WORKBENCH' || stored.simulation !== true || CallState.view(stored).known)) return false;
      next = structuredClone({ ...row, ...(stored || {}) });
    } catch (_) { showToast('本地记录无法读取，原结果仍待确认', 'error'); return false; }
    const endAt = next.endedMs || Date.parse(next.endedAt), startAt = next.telephony.startedAt;
    if (outcome === '接通') {
      CallState.reconcile(next, { EnterpriseId: next.enterpriseId, ContactId: next.contactId,
        Data: { ReleaseTime: endAt, ContactDisposition: 'Success', CustomerEvents: [{ CustomerId: next.callee,
          EventSequence: [{ Event: 'Established', EventTime: Math.min(endAt, startAt + 1000) }] }] } }, { source: 'local-simulation' });
      next.durationSeconds = Math.max(0, Math.floor((endAt - CallState.view(next).customerEstablishedAt) / 1000));
    } else demoFinal(next, '未接通');
    if (!syncStateDisplay(next).known) return false;
    next.syncCalibrationId = crypto.randomUUID();
    delete next.dataSync;
    const index = records.findIndex(record => record.callId === id);
    if (index < 0) records.push(next); else records[index] = next;
    let journalWritten = false;
    try {
      localStorage.setItem(recordsKey, JSON.stringify(records)); journalWritten = true;
      if (next.customerTaskItemId && !window.CustomerTasks?.syncCall(next)) throw Error('Batch snapshot not saved');
    } catch (_) {
      if (journalWritten) {
        try { if (previous === null) localStorage.removeItem(recordsKey); else localStorage.setItem(recordsKey, previous); }
        catch (_) { showToast('原始记录回退未能保存，请勿清空数据；当前结果保持待确认', 'error'); return false; }
      }
      showToast('演示话单未保存，原结果仍待确认，请检查浏览器存储', 'error'); return false;
    }
    Object.assign(row, next);
    window.CustomerDirectory?.sync();
    if (sameNativeCall(call, row)) { Object.assign(call, row); refresh(); }
    else {
      // A record page can calibrate before the seat workspace has been restored.
      // Refresh only its matching call snapshot; keep unsaved follow-up fields.
      const saved = read(sessionKey, sessionStorage);
      if (saved?.scope === row.accountId + ':' + row.tenantId && sameNativeCall(saved.call, row)) {
        saved.call = row; write(sessionKey, saved, sessionStorage);
      }
    }
    showToast('演示话单已补齐，本次记录与统计已更新，未发起新呼叫', 'success');
    return true;
  }
  function persist() {
    if (restorationError) return;
    draftStored = write(sessionKey, { scope, draft, call, phase, disposition, remark, followup, followupVersion, lastSavedId, demoResult, suspendedDraft, receivingOrigin }, sessionStorage);
    updateDraftNotice();
  }
  function ensureScope() {
    if (scope === currentScope()) return;
    scope = currentScope(); workspaceTab = ''; seatOptions = {}; draft = {}; call = null; phase = 'idle'; error = ''; suspendedDraft=null;receivingOrigin=false;
    restorationError = '';
    disposition = ''; remark = ''; followup = CustomerFollowup.empty(); followupVersion = ''; lastSavedId = '';
    const saved = read(sessionKey, sessionStorage);
    if (saved?.scope !== scope) return;
    draft = saved.draft || {}; suspendedDraft=saved.suspendedDraft||null;receivingOrigin=!!saved.receivingOrigin;lastSavedId = saved.lastSavedId || '';
    delete draft.skillGroupId; delete draft.numberId;
    if(suspendedDraft) { delete suspendedDraft.skillGroupId; delete suspendedDraft.numberId; }
    demoResult = saved.demoResult || '接通'; disposition = saved.disposition || ''; remark = saved.remark || ''; followup = { ...CustomerFollowup.empty(), ...saved.followup }; followupVersion = saved.followupVersion || '';
    if (saved.call && ['offered', 'answering', 'dialing', 'ringing', 'connected', 'wrap'].includes(saved.phase)) {
      let committed;
      try {
        const snapshot = saved.call, context = AppState.get();
        if (snapshot.accountId !== AppState.account().accountId || snapshot.tenantId !== context.tenantId ||
          snapshot.enterpriseId !== context.enterpriseId || snapshot.callSource !== 'NATIVE_WORKBENCH' || !snapshot.callId) throw Error('Session scope mismatch');
        const journal = JSON.parse(localStorage.getItem(recordsKey) || '[]');
        if (!Array.isArray(journal)) throw Error('Invalid native journal');
        committed = journal.find(row => row.callId === snapshot.callId) || data.calls.find(row => row.callId === snapshot.callId);
        if (committed && !sameNativeCall(snapshot, committed)) throw Error('Call identity mismatch');
        // Session storage holds UI drafts, not the authority for completed calls.
        call = structuredClone(committed || snapshot);
        window.CloudCallSync?.restore(call);
      } catch (_) {
        restorationError = '上次通话暂时无法恢复，请保留浏览器数据并刷新后重试'; error = restorationError; return;
      }
      if (call.processingStatus === '已完成') {
        lastSavedId = call.callId; call = null; disposition = ''; remark = ''; followup = CustomerFollowup.empty(); followupVersion = '';
        draft = suspendedDraft || {}; suspendedDraft=null;persist(); return;
      }
      phase = 'wrap';
      if (saved.phase !== 'wrap' && !call.endedAt) {
        call.endedAt = stamp(); call.durationSeconds = Math.max(0, call.durationSeconds || 0);
        if(receiving()){call.agentAnswerResult=call.agentAnsweredAt?'已接听':'接听结果待确认';call.receivingEndedReason='会话中断';}
        call.result = '演示中断'; call.processingStatus = '待填写'; call.agentDisposition = '';
        if (call.telephony) { CallState.finish(call, { at: Date.now(), source: 'local-session-interrupted' }); syncStateDisplay(call); }
        saveRecord(call);
      } else if (!committed) {
        saveRecord(call);
      }
      persist();
    }
  }
  const callerNumberValue = number => String(number?.alictiNumber?.hotline || number?.number || '').trim();
  function config() {
    const agent = myAgent(), tenant = AppState.currentTenant(), account = AppState.account();
    const groups = data.physicalSkillGroups.filter(g=>g.tenantId===tenant?.tenantId&&g.enterpriseId===tenant?.enterpriseId&&g.status==='已启用'&&data.agentSkills.some(r=>r.identityId===agent?.contactCenterIdentityId&&r.physicalGroupId===g.physicalGroupId&&r.status==='已生效'&&r.syncStatus==='同步成功'));
    const numbers=ManualSkillAccess.numbers(tenant).filter(number => /^\d+$/.test(callerNumberValue(number)));
    let reason = restorationError;
    if (reason) { /* Preserve a blocked restoration until a clean reload or scope change. */ }
    else if (!AppState.isReady() || AppState.get().activeDomain !== 'CLOUD_CONTACT_CENTER') reason = '请先进入云呼叫工作台';
    else if (!AppState.effectiveAccess().valid) reason = '当前账号已无此工作范围的使用权限，请联系管理员';
    else if (tenant?.status !== '启用' || account.status !== '启用') reason = '当前账号或租户已停用，请联系管理员';
    else if (!agent) reason = '当前账号尚未关联本租户坐席，请联系租户管理员完成关联';
    else if (agent.lifecycleStatus !== '已启用' || agent.callEnabled === false || !agent.acceptNewTasks) reason = '坐席已停用或暂停接收新任务，请联系管理员';
    else if (agent.syncStatus !== '同步成功') reason = '坐席开通尚未完成，请等待管理员完成同步';
    if(!reason&&window.SeatPhoneConfig){const phone=SeatPhoneConfig.read(agent);if(!phone.ok)reason=phone.message;else if(!phone.value)reason='尚未配置软电话分机号，请联系租户管理员在坐席管理中配置后登录';}
    const phoneReason=reason;
    if(!reason&&!numbers.length) reason='当前租户没有可用于人工外呼的已授权号码，请联系管理员';
    return {agent,tenant,groups,numbers,reason,phoneReason};
  }

  function homeView() { return 'overview'; }
  function tabs() {
    if (!window.TenantCallMonitor?.eligible()) return '';
    return '<div class="seat-view-tabs seat-workspace-tabs" role="tablist" aria-label="工作台视图">'+
      ['outbound','monitor'].map(value=>'<button type="button" role="tab" id="seat-tab-'+value+'" aria-controls="seat-workspace-panel" aria-selected="'+(workspaceTab===value)+'" class="'+(workspaceTab===value?'active':'')+'" onclick="AgentWorkbench.setWorkspaceTab(\''+value+'\')">'+(value==='outbound'?'外呼坐席':'班长监控')+'</button>').join('')+'</div>';
  }
  function setWorkspaceTab(value) {
    ensureScope();
    if (!['outbound','monitor'].includes(value) || value==='monitor'&&!window.TenantCallMonitor?.eligible()) return false;
    workspaceTab=value; seatOptions={...seatOptions,workspaceTab:value}; persist();
    if (!document.getElementById('native-seat-workspace')) { navigateTo('seat-workbench',{...seatOptions}); return true; }
    refresh(); document.getElementById('seat-tab-'+value)?.focus(); return true;
  }
  function setPendingPage(value) {
    ensureScope();
    if (!hasSeat()) return false;
    const context=AppState.get();
    seatOptions={...seatOptions,workspaceTab:'outbound',pendingPage:Math.max(1,Math.floor(Number(value)||1)),pendingScope:JSON.stringify([context.accountId,context.tenantId,context.enterpriseId])};
    navigateTo('seat-workbench',{...seatOptions});
    return true;
  }
  function open(view) { if(view==='overview')RouteRuntime.back({fallback:'home'});else if(modalMode||busy())openDialog();else RouteRuntime.openSecondary('seat-workbench'); }
  function hasSeat(){return AppState.isReady()&&AppState.effectiveAccess().valid&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&!!myAgent();}
  function openTemporary(){ensureScope();if(busy())return openDialog();receivingOrigin=false;origin=window.RouteRuntime?.snapshot?.()||null;originScroll=document.getElementById('page-content')?.scrollTop||0;returnFocus=document.activeElement;if(draft.customerTaskItemId)draft={...draft,...CustomerBusiness.snapshot({}),customerTaskItemId:'',customerDirectoryId:'',customerName:'',phone:'',note:''};else Object.assign(draft,CustomerBusiness.snapshot({}));error='';persist();openDialog();}
  function refreshOrigin(){
    const current=window.RouteRuntime?.snapshot?.();
    // A call may continue after navigation. Closing its editor must not reopen an old page.
    if(current&&origin&&(current.key!==origin.key||current.options?.dashboardSection!==origin.options?.dashboardSection))return;
    if(current&&window.RouteRuntime?.refreshCurrent){RouteRuntime.refreshCurrent({preserveFilters:true});return;}
    if(receivingOrigin){if(document.getElementById('native-seat-workspace')){const content=document.getElementById('page-content');if(content){const scroll=content.scrollTop;content.innerHTML=renderSeat();content.scrollTop=scroll;}}return;}
    const page=origin?.key||(location.hash||'#home').slice(1).split('?')[0]||'home';if(['home','seat-workbench','customer-tasks','manual-outbound'].includes(page)){navigateTo(page,origin?.options);const content=document.getElementById('page-content');if(content)content.scrollTop=originScroll;}
  }
  function beforeRouteChange(){if(modalVisible){modalVisible=false;ui.closeLayer(modalId,false);if(!busy())modalMode=false;updateDock();}}
  function dialogHint(){
    if(receiving())return phase==='offered'||phase==='answering'?(call.workbenchKind==='predictive'?'客户已接通，等待您接听并继续沟通':'接听来电后进入沟通记录'):'通话中填写沟通记录，挂断后确认保存';
    if(['dialing','ringing'].includes(phase))return '正在呼叫，客户接通后自动打开沟通记录';
    if(phase==='connected')return '通话中填写沟通记录，挂断后确认保存';
    if(phase==='wrap')return '通话已结束，确认处理结果后保存';
    return draft.customerTaskItemId?'确认客户号码后发起呼叫':'填写客户信息后发起预览外呼';
  }
  function sessionMeta(c){return '<div class="assigned-call-status"><span>'+esc(c.agent?.userName||'未关联坐席')+' · '+statusText()+'</span></div>'+(window.AliCtiSeatOperations?.connectionStatus?.().blocked?(window.SeatOperationUI?.notice()||''):'')+progress()+
    ((draft.customerTaskItemId||call?.externalDocumentId)?'<p class="seat-current-note">业务类型：'+esc(CustomerBusiness.typeLabel(call||draft))+' · '+esc(CustomerBusiness.codeLabel(call||draft))+'：'+esc((call||draft).externalDocumentId||'—')+'</p>':'');}
  function dialogBody(){
    const c=config(),name=call?.customerName||draft.customerName||'客户';
    const title=canEditRecord()?'填写沟通记录 · '+esc(name):receiving()?callLabel()+' · '+esc(name):['dialing','ringing'].includes(phase)?'正在呼叫 · '+esc(name):draft.customerTaskItemId?'呼叫客户 · '+esc(name):'预览外呼';
    return '<div class="layer-header"><div><h2 id="assigned-call-title">'+title+'</h2><p>'+dialogHint()+'</p></div><div class="assigned-call-header-actions"><span class="seat-record-header-actions" data-seat-record-header-actions>'+recordHeaderActions()+'</span>'+(busy()?'<button class="btn" onclick="AgentWorkbench.minimizeDialog()">收起</button>':'')+'<button aria-label="关闭联系客户" onclick="AgentWorkbench.closeDialog()">×</button></div></div>'+
      '<div class="layer-body seat-workspace assigned-call-body"><div data-seat-session-meta>'+sessionMeta(c)+'</div>'+
      (phase==='wrap'?wrapPanel():busy()?activePanel():(c.reason?'<p class="seat-blocked" role="status">'+esc(c.reason)+'</p>':'')+idleForm(c,!!draft.customerTaskItemId))+'</div>';
  }
  function drawDialog(){
    if(!modalVisible)return;
    // Keep the editor in place across mute and hangup events after connection.
    // Replacing its input nodes interrupts typing and Chinese input composition.
    const existing=document.getElementById(modalId);
    const editor=existing?.querySelector('[data-seat-record-call]');
    if(editor && editor.getAttribute('data-seat-record-call')===call?.callId && canEditRecord()){
      existing.querySelector('.layer-header p').textContent=dialogHint();
      existing.querySelector('[data-seat-record-header-actions]').innerHTML=recordHeaderActions();
      existing.querySelector('[data-seat-session-meta]').innerHTML=sessionMeta(config());
      editor.querySelector('[data-seat-call-summary]').innerHTML=recordSummary();
      editor.querySelector('#seat-error').textContent=error;
      updateDraftNotice();return;
    }
    const focusedId=document.activeElement?.id;
    // The centered call view becomes the record editor only after connection
    // (or after an unanswered call ends). Keep the same call and saved draft.
    const recordModal=canEditRecord();
    ui.openLayer(modalId,dialogBody(),'large',{nonModal:false});
    const node=document.getElementById(modalId),panel=node?.querySelector('.layer-panel'),backdrop=node?.querySelector('.layer-backdrop');
    if(panel){panel.classList.add('assigned-call-panel');if(phase==='idle'&&draft.customerTaskItemId)panel.classList.add('assigned-precall-panel');if(busy()&&!recordModal)panel.classList.add('assigned-call-stage-panel');if(recordModal)panel.classList.add('assigned-record-modal');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','assigned-call-title');}
    if(backdrop)backdrop.onclick=()=>closeDialog();
    requestAnimationFrame(()=>{if(!modalVisible)return;const previous=focusedId&&document.getElementById(focusedId);if(previous&&node?.contains(previous))previous.focus();else (node?.querySelector('#seat-remark')||node?.querySelector('#seat-answer')||node?.querySelector('.seat-call-stage .seat-hangup')||node?.querySelector('select:not([disabled])')||node?.querySelector('button:not([disabled])'))?.focus({preventScroll:true});});
  }
  function openDialog(){modalMode=true;modalVisible=true;drawDialog();const node=document.getElementById(modalId);if(node)node.style.zIndex=String(ui.nextLayerZIndex());updateDock();requestAnimationFrame(()=>document.getElementById(phase==='wrap'?'seat-disposition':phase==='offered'?'seat-answer':canEditRecord()?'seat-remark':draft.customerTaskItemId?(online?'seat-dial':'seat-online'):'seat-customer-name')?.focus());}
  function minimizeDialog(){if(!busy())return closeDialog();modalVisible=false;ui.closeLayer(modalId);updateDock();refreshOrigin();showToast(phase==='wrap'?'处理结果尚未保存，可继续填写':'通话仍在进行，填写内容已保留','info');}
  function closeDialog(){
    if(busy()){minimizeDialog();return false;}
    modalMode=false;modalVisible=false;ui.closeLayer(modalId);updateDock();returnFocus?.focus?.({preventScroll:true});return true;
  }
  function refresh() {
    persist();
    if(modalVisible)drawDialog();
    else if (!modalMode&&document.getElementById('native-seat-workspace')) {
      const content = document.getElementById('page-content'), scroll = content.scrollTop;
      content.innerHTML = renderSeat(); content.scrollTop = scroll;
    }
    updateDock();
    window.TenantCallMonitor?.telephoneChanged();
  }
  function fail(message, field) {
    error = message; refresh();
    const input = field && document.getElementById(field);
    if (input) { const section = input.closest('details'); if (section) section.open = true; input.setAttribute('aria-invalid', 'true'); input.focus(); }
    return false;
  }
  function release() {
    window.AliCtiSeatOperations?.invalidate();
    const a = data.agents.find(r => r.contactCenterIdentityId === seatId);
    if (a?.currentEndpoint === 'NATIVE_WORKBENCH') {
      a.currentEndpoint = ''; a.currentCall = false;
      if (a.lifecycleStatus === '已启用') a.agentStatus = '离线';
    }
    online = false; seatId = '';
    const done = releaseLock; releaseLock = null; if (done) done();
  }
  async function signIn(input) {
    if (online || signingIn || busy() || window.AliCtiSeatOperations?.status().pending) return {ok:false,message:'当前不能重复登录坐席'};
    const c = config();
    if (c.phoneReason) { fail(c.phoneReason); return {ok:false,message:c.phoneReason}; }
    // Opening the login panel never sends a phone request. Its own submit passes the selected values here.
    if (!input) return window.SeatOperationUI?.open('login');
    const reject = message => { fail(message); return {ok:false,message}; };
    if (c.agent.currentCall || c.agent.currentEndpoint || ['通话中', '话后处理'].includes(c.agent.agentStatus))
      return reject('该坐席正在其他窗口使用，请先在那里退出');
    if (!navigator.locks) return reject('当前浏览器无法校验重复登录，请使用 Chrome 并通过本地预览地址访问');
    signingIn = true; refresh();
    const targetScope = currentScope();
    try {
      await seatLockDone.catch(()=>{});
      let resolveStarted, startedResolved = false;
      const started = new Promise(resolve => { resolveStarted = resolve; });
      const finish = result => { if (!startedResolved) { startedResolved = true; resolveStarted(result); } return result; };
      seatLockDone = navigator.locks.request('unified-call-seat:' + c.agent.contactCenterIdentityId, { ifAvailable: true }, async lock => {
        if (!lock) { signingIn = false; return finish(reject('该坐席已在其他窗口登录，请先在原窗口退出')); }
        if (targetScope !== currentScope() || config().phoneReason) { signingIn = false; return finish(reject('工作范围或坐席配置已改变，请重新登录')); }
        const released = new Promise(resolve => { releaseLock = resolve; });
        let connected;
        try { connected = await AliCtiAdapter.connect(c.agent, input); }
        catch (_) { connected = {ok:false,message:'坐席登录失败，请稍后重试'}; }
        signingIn = false;
        if (!connected?.ok) {
          connected = connected || {ok:false,message:'坐席登录失败，请稍后重试'};
          fail(connected.message);
          finish(connected);
          if (connected.pending) await released;
          else release();
          return;
        }
        if (targetScope !== currentScope() || config().phoneReason) { release(); return finish(reject('工作范围已变化，请重新登录')); }
        online = true; seatId = c.agent.contactCenterIdentityId; error = '';
        syncTelephone(); refresh();
        finish(connected);
        await released;
      });
      seatLockDone.catch(() => { if (!startedResolved) { signingIn = false; finish(reject('坐席登录失败，请稍后重试')); } });
      return await started;
    } catch (_) { signingIn = false; return reject('坐席登录失败，请稍后重试'); }
  }
  function syncTelephone() {
    const service=window.AliCtiSeatOperations;if(!service)return;
    const session=service.current(),a=myAgent();
    if(!session){if(online||releaseLock&&!signingIn&&!service.status().pending&&!service.status().inFlight)release();return;}
    if(!a||!releaseLock||session.cno!==a.cno||session.tenantId!==a.tenantId||session.accountId!==AppState.account().accountId)return;
    online=true;seatId=a.contactCenterIdentityId;a.currentEndpoint='NATIVE_WORKBENCH';
    if(!busy())a.agentStatus=session.presence==='paused'?'示忙':session.presence==='wrapup'?'话后处理':'空闲';
  }
  function refreshTelephone(){syncTelephone();if(!busy()&&!window.AliCtiSeatOperations?.status().pending)error='';refresh();}
  async function signOut(options={removeBinding:0}) {
    if (busy()) {fail('请先结束通话并保存处理结果，再退出');return {ok:false,message:error};}
    if (options?.removeBinding !== undefined && options.removeBinding !== 0) return {ok:false,message:'坐席退出保留分机绑定，请在坐席维护中调整分机配置'};
    const result=await AliCtiAdapter.disconnect({removeBinding:0});
    if(!result?.ok){fail(result?.message||'退出未成功，原状态已保留');return result||{ok:false,message:error};}
    release();error='';refresh();return result;
  }
  function allowContextChange(checkOnly) {
    if (busy() || signingIn || window.SeatOperationUI?.isBusy() || window.AliCtiSeatOperations?.status().inFlight || window.AliCtiSeatOperations?.status().pending || window.AliCtiSeatOperations?.managementState?.().inFlight || window.AliCtiSeatOperations?.managementState?.().pending) { showToast('请先完成当前通话、记录或电话状态核对，再退出或切换业务域', 'warning'); return false; }
    if (window.AliCtiSeatOperations?.connectionStatus?.().blocked) { showToast('电话连接尚未核对，请先重新登录电话后再退出或切换工作范围', 'warning'); return false; }
    if (!checkOnly) {release();window.SeatOperationUI?.contextChanged();window.TenantCallMonitor?.contextChanged();modalMode=false;modalVisible=false;ui.closeLayer(modalId);}
    return true;
  }
  function updateField(field, value) {
    if (!['customerName', 'phone', 'note'].includes(field) || busy()) return;
    if(draft.customerTaskItemId&&['customerName','phone'].includes(field))return;
    draft[field] = value;
    if (field === 'phone') draft.customerDirectoryId = '';
    error = ''; persist();
    const message = document.getElementById('seat-error'); if (message) message.textContent = '';
  }
  function chooseContact(id) {
    if (busy()) return;
    const row = id ? window.CustomerDirectory?.find(id) : null;
    if (id && !row) return fail('该客户已不在当前可查看范围内，请重新选择');
    draft = { ...draft, ...CustomerBusiness.snapshot({}), customerTaskItemId:'', customerDirectoryId:row?.id || '', customerName: row?.name || '', phone: row?.phone || '', note: row?.note || '' };
    error = ''; refresh();
  }
  function receivingContext(){
    ensureScope();
    return {online,agent:myAgent(),tenant:AppState.currentTenant(),busy:busy(),phase,call:call?structuredClone(call):null};
  }
  function receiveOffer(payload){
    ensureScope();
    const c=config(),linked=payload?.kind==='predictive'?window.CustomerTasks?.receivingItem(payload.taskId,payload.customerTaskItemId,c.agent):null;
    const result=AliCtiReceiving.validateOffer(payload,{agent:c.agent,enterpriseId:AppState.get().enterpriseId,tenantId:AppState.get().tenantId,accountId:AppState.account().accountId,online,busy:busy(),call,receivingItem:linked});
    if(!result.ok){showToast(result.message,'warning');return false;}
    if(result.duplicate)return !call.endedAt;
    if(window.AliCtiSeatOperations && !AliCtiSeatOperations.canReceive(payload.kind)){showToast('当前电话状态或工作模式不接收这类来电，请先置闲或调整工作模式','warning');return false;}
    if(c.phoneReason||seatId!==c.agent.contactCenterIdentityId||c.agent.currentEndpoint!=='NATIVE_WORKBENCH'||c.agent.currentCall){showToast(c.phoneReason||'本人坐席暂时不能接收来电','warning');return false;}
    if(!AliCtiAdapter.session||AliCtiAdapter.session.enterpriseId!==c.agent.enterpriseId||AliCtiAdapter.session.cno!==c.agent.cno)return false;
    if(data.calls.some(row=>row.callId===payload.callId||String(row.enterpriseId)===String(c.agent.enterpriseId)&&row.contactId===payload.contactId)){showToast('这通来电已处理，请勿重复发送','info');return false;}
    if(linked){
      const task=linked.task;
      if(!['运行中','执行中'].includes(task.status)){showToast('请选择正在运行的预外呼任务','warning');return false;}
      const assignment={};
      for(const source of [task.executionConfig,task.alictiCreateDraft?.fields,task,task.planSnapshot]){
        if(!source)continue;
        for(const key of ['callGroupType','cnos','agentGroup','outboundGroupId','outboundGroupSnapshot'])if(Object.hasOwn(source,key))assignment[key]=source[key];
      }
      let assigned=false;
      if(Number(assignment.callGroupType)===2||assignment.agentGroup||assignment.outboundGroupId){
        const resolved=window.OutboundGroups?.resolve(assignment,task);
        assigned=!!resolved?.ok&&resolved.members.some(agent=>agent.contactCenterIdentityId===c.agent.contactCenterIdentityId&&agent.tenantId===task.tenantId&&agent.enterpriseId===task.enterpriseId);
      }else if(Object.hasOwn(assignment,'cnos')){
        const cnos=(Array.isArray(assignment.cnos)?assignment.cnos:typeof assignment.cnos==='string'?assignment.cnos.split(','):[]).filter(cno=>typeof cno==='string').map(cno=>cno.trim());
        assigned=cnos.includes(c.agent.cno)&&c.agent.tenantId===task.tenantId&&c.agent.enterpriseId===task.enterpriseId;
      }else{
        const groupId=task.planSnapshot?.skillGroupId||task.executionConfig?.targetSkillGroupId||task.targetSkillGroupId||task.skillGroupId;
        assigned=c.groups.some(group=>group.skillGroupId===groupId);
      }
      if(!assigned){showToast('这项任务未分配给当前坐席，请核对任务的接听坐席或外呼组','warning');return false;}
    }
    const at=Date.now(),offer=result.offer,inbound=offer.kind==='inbound';
    suspendedDraft=structuredClone(draft);receivingOrigin=true;origin=window.RouteRuntime?.snapshot?.()||null;originScroll=document.getElementById('page-content')?.scrollTop||0;returnFocus=document.activeElement;
    call={callId:offer.callId,contactId:offer.contactId,enterpriseId:c.agent.enterpriseId,tenantId:c.agent.tenantId,accountId:AppState.account().accountId,cno:c.agent.cno,
      contactCenterIdentityId:seatId,agentIdentityId:seatId,agentName:c.agent.userName,callSource:'NATIVE_WORKBENCH',workbenchKind:offer.kind,
      customerNumber:offer.customerNumber,customerName:linked?.item.name||offer.customerName||'来电客户',customerNote:linked?.item.note||'',
      ...CustomerBusiness.snapshot(linked?.item||{}),...(window.RepeatPredictive?.callMetadata(linked?.item)||{}),taskId:linked?.task.taskId||'',taskName:linked?.task.name||'',customerTaskItemId:linked?.item.id||'',
      caller:inbound?offer.customerNumber:offer.hotline||'',callee:inbound?offer.hotline||'':offer.customerNumber,callerNumberId:offer.callerNumberId||'',
      skillGroupId:offer.skillGroupId||linked?.task.targetSkillGroupId||'',skillGroupName:c.groups.find(group=>group.skillGroupId===offer.skillGroupId)?.name||'',
      callType:inbound?'呼入':'预外呼',direction:inbound?'呼入':'呼出',bindType:Number(AliCtiAdapter.session.bindType),
      ringingAt:stamp(at),offeredAt:stamp(at),offeredMs:at,queueAt:inbound?stamp(at):'—',answeredAt:stamp(at),endedAt:'',durationSeconds:0,
      agentAnsweredAt:'',agentAnswerResult:'待接听',result:'接通',processingStatus:'待填写',agentDisposition:'',
      recordingApplicability:'演示无录音',recordingStatus:'演示无录音',recordingSource:'未连接真实线路',recordingScope:'不适用',
      simulation:true,mock:true,demoAnswerOutcome:offer.demoAnswerOutcome||'success',offerExpiresAt:at+Math.min(60,Math.max(5,Number(offer.demoTimeoutSeconds)||60))*1000};
    CallState.start(call,{at,source:'local-simulation'});
    // Both sources reach the agent after the customer leg has connected. This
    // must never become customer-unanswered when the agent misses the offer.
    demoEvent(call,'customer','Established',at);demoEvent(call,'agent','Ringing',at);
    phase='offered';error='';disposition='';remark='';followup=CustomerFollowup.empty(call);followupVersion='';lastSavedId='';muted=false;
    if(call.customerTaskItemId&&CustomerTasks.syncCall(call)!==true){call=null;phase='idle';draft=suspendedDraft;suspendedDraft=null;showToast('客户任务已变化，无法接收本次分配','warning');return false;}
    c.agent.currentCall=true;c.agent.agentStatus='振铃';
    saveRecord(call);persist();openDialog();return true;
  }
  function localReceivingEvent(stateAction){
    return {mock:true,source:'local-simulation',stateAction,enterpriseId:call.enterpriseId,tenantId:call.tenantId,accountId:call.accountId,cno:call.cno,contactId:call.contactId,callId:call.callId};
  }
  function answerIncoming(){
    if(!receiving()||phase!=='offered')return false;
    if(call.offerExpiresAt<=Date.now())return finishReceiving('坐席未接听');
    const result=AliCtiReceiving.answer(myAgent(),call);
    if(!result.ok)return fail(result.message,'seat-answer');
    if(result.requiresDevice){showToast(result.message,'info');return false;}
    call.answerAttempt=(call.answerAttempt||0)+1;phase='answering';error='';refresh();
    const event={...localReceivingEvent(call.workbenchKind==='inbound'?'busyIb':'busyOb'),answerAttempt:call.answerAttempt},id=call.callId;
    answerTimer=setTimeout(()=>{
      if(call?.callId!==id||phase!=='answering')return;
      if(call.demoAnswerOutcome==='failure'&&call.answerAttempt===1)return receiveStatus({...event,stateAction:'answer-failed'});
      receiveStatus(event);
    },1100);
    return true;
  }
  function receiveStatus(event){
    if(!receiving()||event?.mock!==true||event.source!=='local-simulation'||!AliCtiReceiving.eventMatches(event,call)||call.accountId!==AppState.account().accountId||call.tenantId!==AppState.get().tenantId||call.enterpriseId!==AppState.get().enterpriseId||call.endedAt)return false;
    if(event.answerAttempt!==undefined&&event.answerAttempt!==call.answerAttempt)return false;
    if(event.stateAction==='answer-failed'){
      if(phase!=='answering'||event.answerAttempt!==call.answerAttempt)return false;
      phase='offered';error='接听未成功，请重试；也可检查电话连接。';refresh();return true;
    }
    if(['cancelled','missed','released'].includes(event.stateAction)){
      if(event.stateAction==='missed'&&phase==='connected')return false;
      return finishReceiving(event.stateAction==='cancelled'?'对方已挂断':event.stateAction==='missed'?'坐席未接听':'已结束');
    }
    const mapped=AliCtiReceiving.eventPhase(call.workbenchKind,event.stateAction);
    if(!mapped.ok)return false;
    if(mapped.phase==='offered')return ['offered','answering'].includes(phase);
    if(phase==='connected')return true;
    if(!['offered','answering'].includes(phase))return false;
    if(call.offerExpiresAt<=Date.now())return finishReceiving('坐席未接听');
    clearTimeout(answerTimer);
    const at=Date.now();demoEvent(call,'agent','Established',at);
    phase='connected';call.answeredMs=at;call.agentAnsweredAt=stamp(at);call.agentAnswerResult='已接听';error='';
    const agent=myAgent();if(agent)agent.agentStatus='通话中';
    saveRecord(call);refresh();return true;
  }
  function finishReceiving(reason){
    if(!receiving()||!['offered','answering','connected'].includes(phase))return false;
    clearTimeout(answerTimer);clearTimeout(ringTimer);
    const answered=phase==='connected',at=Date.now(),inbound=call.workbenchKind==='inbound';
    call.endedMs=at;call.endedAt=stamp(at);call.receivingEndedReason=reason;
    call.durationSeconds=answered?Math.max(0,Math.floor((at-call.answeredMs)/1000)):0;
    call.agentAnswerResult=answered?'已接听':reason==='座席拒接'?'座席拒接':reason==='对方已挂断'?'对方取消':'坐席未接听';
    demoEvent(call,'agent','Released',at);demoEvent(call,'customer','Released',at);CallState.finish(call,{at,source:'local-simulation'});
    const observed = structuredClone(call);
    const raw={enterpriseId:call.enterpriseId,customerNumber:call.customerNumber,mainUniqueId:call.contactId,startTime:Math.floor(call.offeredMs/1000),endTime:Math.floor(at/1000),bridgeDuration:call.durationSeconds,
      status:inbound?(answered?'人工接听':'人工未接听'):(answered?43:42),...(answered?{bridgeTime:Math.floor(call.answeredMs/1000)}:{}),
      ...(inbound?{answerTime:Math.floor(call.offeredMs/1000),firstCallCno:call.cno,cnoFlow:[call.cno]}:{upTime:Math.floor(call.offeredMs/1000),cno:call.cno,customerBridgeDuration:Math.max(0,Math.floor((at-call.offeredMs)/1000))})};
    call.alictiCdr={kind:call.workbenchKind,raw,mock:true};
    CallState.reconcile(call,{EnterpriseId:call.enterpriseId,ContactId:call.contactId,ReleaseTime:at,ContactDisposition:'Success'},{source:'local-simulation'});syncStateDisplay(call);
    window.CloudCallSync?.begin(call, observed);
    phase='wrap';muted=false;
    const agent=myAgent();if(agent){agent.currentCall=false;agent.agentStatus='话后处理';}
    window.AliCtiSeatOperations?.enterWrapup(call);
    if(answered){saveRecord(call);refresh();return true;}
    // An unanswered offer has no customer conversation to write up. Archive the
    // agent result while retaining the customer's established call evidence.
    call.agentDisposition=call.agentAnswerResult;call.dispositionAt=stamp(at);call.processingStatus='已完成';
    const saved=saveRecord(call,true);
    if(!saved.ok){call.processingStatus='待填写';call.agentDisposition='';return fail(saved.message);}
    lastSavedId=call.callId;call=null;phase='idle';draft=suspendedDraft||{};suspendedDraft=null;error='';
    if(agent)agent.agentStatus=online?'话后处理':'离线';
    if(online)window.SeatOperationUI?.afterRecordSaved();
    persist();modalVisible=false;modalMode=false;ui.closeLayer(modalId);updateDock();showToast(reason+'，已保存来电记录','info');return true;
  }
  function dial() {
    if (busy()) return false;
    if(window.AliCtiSeatOperations && !AliCtiSeatOperations.canDial())return fail('请先登录并置闲；主动联系需选择相应工作模式');
    const c = config();
    if (c.reason) return fail(c.reason);
    if (!online || seatId !== c.agent.contactCenterIdentityId) return fail('请先点击右上方“登录”');
    if (c.agent.currentCall || c.agent.currentEndpoint !== 'NATIVE_WORKBENCH') return fail('坐席正在其他通话中，不能重复呼叫');
    const phone = window.CustomerDirectory ? CustomerDirectory.normalizePhone(draft.phone) : String(draft.phone || '').replace(/[\s-]/g, '');
    if (!String(draft.customerName || '').trim()) return fail('请填写客户称呼', 'seat-customer-name');
    if (!/^(1[3-9]\d{9}|0\d{9,11})$/.test(phone)) return fail('请输入完整的手机号或带区号的固定电话', 'seat-phone');
    if ((data.nativeWorkbench.blockedNumbers || []).some(n => n.tenantId === c.tenant.tenantId && n.phone === phone) ||
      data.calls.some(r => r.tenantId === c.tenant.tenantId && r.callee === phone && r.agentDisposition === '客户拒绝联系'))
      return fail('该号码已禁止联系，坐席和管理员均不能绕过', 'seat-phone');
    // Resolve a currently authorized caller number for each call; old manual selections are not reused.
    const number = c.numbers[0];
    if (!number) return fail('当前租户没有可用于人工外呼的已授权号码，请联系管理员');
    if(draft.customerTaskItemId){const item=CustomerTasks.row(draft.customerTaskItemId);if(!item||!CustomerTasks.canCall(item.r)||item.r.phone!==phone)return fail('该客户分配已改变，请重新选择待联系客户');}
    if (draft.customerDirectoryId) { const customer = window.CustomerDirectory?.find(draft.customerDirectoryId); if (!customer || customer.phone !== phone) return fail('客户授权已改变，请重新选择客户'); }
    const caller = callerNumberValue(number);
    const request=AliCtiAdapter.previewOutcall(c.agent,phone,caller,draft);if(!request.ok)return fail(request.message);
    draft.phone = phone;
    call = {
      requestUniqueId:request.requestUniqueId, transcriptionGate:request.transcriptionGate, ...(request.cdrIsAsr===undefined?{}:{cdrIsAsr:request.cdrIsAsr}), cno:c.agent.cno, callId: 'MC' + Date.now().toString(36).toUpperCase() + crypto.randomUUID().slice(0, 4).toUpperCase(), contactId: '—', tenantId: c.tenant.tenantId, enterpriseId: c.tenant.enterpriseId,
      accountId: AppState.account().accountId, contactCenterIdentityId: seatId, agentIdentityId: seatId, agentName: c.agent.userName,
      customerName: draft.customerName.trim(), customerNote: draft.note || '', ...CustomerBusiness.snapshot(draft.customerTaskItemId ? CustomerTasks.row(draft.customerTaskItemId)?.r : {}), caller, callee: phone,
      callerNumberId: number.numberId, skillGroupName: '',
      skillGroupId: '', callSource: 'NATIVE_WORKBENCH', callType: '人工外呼', direction: '呼出',
      ringingAt: stamp(), answeredAt: '—', endedAt: '', durationSeconds: 0, result: '呼叫中',
      recordingApplicability: '演示无录音', recordingStatus: '演示无录音', recordingSource: '未连接真实线路',
      recordingScope: '不适用', recordingUrlExpiresAt: '不适用', agentDisposition: '', processingStatus: '待填写',
      customerTaskItemId:draft.customerTaskItemId||'', simulation: true, simulationOutcome: demoResult
    };
    if(call.customerTaskItemId&&!CustomerTasks.claim(call.customerTaskItemId,call)){call=null;return fail('客户正在被处理或分配已改变，请刷新名单');}
    call.contactId = 'DEMO-' + call.callId;
    CallState.start(call, { at: Date.now(), source: 'local-simulation' });
    demoEvent(call, 'agent', 'Established');
    demoEvent(call, 'customer', 'Dialing');
    // Snapshot call resources; later configuration changes only affect the next call.
    phase = 'dialing'; muted = false; error = ''; disposition = ''; remark = ''; followup = CustomerFollowup.empty(call); followupVersion = ''; lastSavedId = '';
    c.agent.currentCall = true; c.agent.agentStatus = '通话中'; refresh();
    ringTimer = setTimeout(() => { if (phase === 'dialing') { demoEvent(call, 'customer', 'Ringing'); phase = 'ringing'; refresh(); } }, 700);
    answerTimer = setTimeout(() => {
      if (!['dialing', 'ringing'].includes(phase)) return;
      if (call.simulationOutcome !== '接通') return end(call.simulationOutcome);
      demoEvent(call, 'customer', 'Established');
      phase = 'connected'; call.answeredAt = stamp(); call.answeredMs = Date.now(); call.result = '接通'; refresh();
    }, 2400);
    return true;
  }
  function end(result) {
    if(!result&&['dialing','ringing','connected'].includes(phase)) AliCtiAdapter.lastRequest={method:'CTILink.Session.unlink',fields:{},mock:true};
    if(receiving())return finishReceiving(phase==='connected'?'已结束':'坐席未接听');
    if (!['dialing', 'ringing', 'connected'].includes(phase)) return;
    clearTimeout(answerTimer); clearTimeout(ringTimer);
    if (result === '接通' && CallState.view(call).answered !== true) { demoEvent(call, 'customer', 'Established'); call.answeredMs = Date.now(); }
    const connected = CallState.view(call).answered === true;
    call.durationSeconds = connected ? Math.max(1, Math.floor((Date.now() - call.answeredMs) / 1000)) : 0;
    call.endedMs = Date.now(); call.endedAt = stamp(call.endedMs); call.result = result || (connected ? '接通' : '已取消');
    demoEvent(call, 'customer', 'Released', call.endedMs); demoEvent(call, 'agent', 'Released', call.endedMs);
    CallState.finish(call, { at: call.endedMs, source: 'local-simulation' });
    const observed = structuredClone(call);
    if (call.result !== '结果待确认') demoFinal(call, call.result);
    else syncStateDisplay(call);
    window.CloudCallSync?.begin(call, observed);
    phase = 'wrap'; muted = false;
    const a = data.agents.find(r => r.contactCenterIdentityId === call.contactCenterIdentityId);
    if (a) {
      a.currentCall = false; a.agentStatus = '话后处理';
      if (a.lifecycleStatus === '停用中') { a.lifecycleStatus = '已停用'; a.callEnabled = false; AccountSeat.finishPendingDisable(a, call); }
    }
    window.AliCtiSeatOperations?.enterWrapup(call);
    saveRecord(call); refresh();
  }
  function saveDisposition() {
    if (phase !== 'wrap' || !call || call.accountId !== AppState.account().accountId || call.tenantId !== AppState.get().tenantId) return;
    if (!data.nativeWorkbench.outcomes.includes(disposition)) return fail('请选择本次联系的处理结果', 'seat-disposition');
    const next = structuredClone(call);
    delete next.pendingDisposition;
    const businessResult = CustomerFollowup.save(next, followup, { wrapping: true, expectedVersion: followupVersion });
    if (!businessResult.ok) return fail(businessResult.message, businessResult.field ? 'seat-followup-' + businessResult.field : 'seat-save');
    // Business information has its own journal. Keep its saved version when the
    // linked call/customer save fails, so retry does not conflict with our write.
    followupVersion = businessResult.values.updatedAt;
    call.customerFollowup = structuredClone(businessResult.values);
    next.agentDisposition = disposition; next.dispositionRemark = remark.trim(); next.processingStatus = '已完成';
    next.dispositionAt = stamp();
    const saved = saveRecord(next, true);
    if (!saved.ok) return fail(saved.message, 'seat-save');
    Object.assign(call, next); lastSavedId = call.callId;
    if (disposition === '客户拒绝联系' && !data.nativeWorkbench.blockedNumbers.some(n => n.tenantId === call.tenantId && n.phone === customerPhone(call)))
      data.nativeWorkbench.blockedNumbers.push({ tenantId: call.tenantId, phone: customerPhone(call) });
    CloudCallRuntime.addAudit('保存'+call.callType+'处理结果', call.callId, call.tenantId, '待填写', disposition);
    const a = data.agents.find(r => r.contactCenterIdentityId === call.contactCenterIdentityId);
    call = null; phase = 'idle'; error = '';
    // Keep work resources for the next customer; config() still revalidates grants.
    draft = suspendedDraft || {}; suspendedDraft=null;disposition = ''; remark = ''; followup = CustomerFollowup.empty(); followupVersion = '';
    if (a?.lifecycleStatus !== '已启用' || !a?.acceptNewTasks) release();
    else {a.agentStatus = online ? '话后处理' : '离线';if(online)window.SeatOperationUI?.afterRecordSaved();}
    if(modalMode){persist();modalMode=false;modalVisible=false;ui.closeLayer(modalId);updateDock();refreshOrigin();returnFocus?.focus?.();}
    else refresh();
    showToast('跟进已保存；通话资料会独立更新', 'success');
  }
  let muteDirection='all';
  function toggleMute() { if (phase === 'connected') { if(!muted)muteDirection=document.getElementById('seatMuteDirection')?.value||'all';const request=AliCtiFields.muteFields(muteDirection);if(request.pending?.length)return;AliCtiAdapter.lastRequest=request;muted = !muted; refresh(); } }
  function clearFormError() {
    error = ''; const message = document.getElementById('seat-error'); if (message) message.textContent = '';
    document.querySelectorAll('.seat-workspace [aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  }
  function canEditRecord() {
    const context=AppState.get();
    return !!call && ['connected','wrap'].includes(phase) &&
      context.activeDomain==='CLOUD_CONTACT_CENTER' && call.accountId===AppState.account().accountId &&
      call.tenantId===context.tenantId && call.enterpriseId===context.enterpriseId;
  }
  function setDisposition(value) { if (!canEditRecord()) return; disposition = value; clearFormError(); persist(); }
  function setFollowup(field, value) {
    if (!canEditRecord()) return;
    const next = CustomerFollowup.update(followup, call, field, value);
    if (!next) return;
    followup = next; clearFormError(); persist();
    if (field === 'businessType') {
      const form = document.querySelector('#' + modalId + ' .customer-followup-form') || document.querySelector('.seat-record-form .customer-followup-form');
      if (form) form.outerHTML = CustomerFollowup.form(followup,call,'seat-followup','AgentWorkbench.setFollowup');
    }
  }
  function setRemark(value) { if (!canEditRecord()) return; remark = value; clearFormError(); persist(); }
  function setDemoResult(value) { if (data.nativeWorkbench.demoResults.includes(value) && !busy()) { demoResult = value; persist(); } }
  function records(id) { RouteRuntime.openSecondary('cloud-call-records', { type: data.calls.find(row=>row.callId===id)?.callType || '全部', nativeAgentId: myAgent()?.contactCenterIdentityId, callId: id || '' }); }
  function bindingAccounts(agent) {
    if(window.AccountSeat)return AccountSeat.bindingAccounts(agent);
    return data.accounts.filter(a => a.status === '启用' && !a.builtIn &&
      data.memberships.some(m => m.accountId === a.accountId && m.tenantId === agent.tenantId && m.status === '启用') &&
      !data.agents.some(other => other !== agent && other.tenantId === agent.tenantId &&
        other.lifecycleStatus !== '已删除' && other.accountId === a.accountId));
  }
  function bindingPanel(agent) {
    if (AppState.effectiveAccess().roleCode === 'OPERATOR' || agent.lifecycleStatus === '已删除') return '';
    const disabled = window.AccountSeat ? AccountSeat.inUse(agent) : agent.currentCall || !!agent.currentEndpoint || !['离线','未登录','未登录'].includes(agent.agentStatus);
    return ui.detailSection('工作台使用账号', '<div class="form-grid"><label class="field"><span>平台登录账号 ' +
      ui.help('从本租户的已有账号中选择；关联后，该账号可在“坐席工作台”登录外呼，不新建账号、不改变角色。请确保选择坐席本人的账号。') +
      '</span><select id="seat-binding-account"' + (disabled ? ' disabled' : '') + '><option value="">暂不关联</option>' +
      bindingAccounts(agent).map(a => '<option value="' + a.accountId + '"' + (agent.accountId === a.accountId ? ' selected' : '') + '>' + esc(a.name + ' · ' + a.loginUsername) + '</option>').join('') +
      '</select></label></div><div class="seat-binding-action"><button class="btn btn-primary" onclick="AgentWorkbench.bindAccount(\'' + esc(agent.contactCenterIdentityId) + '\')"' +
      (disabled ? ' disabled' : '') + '>保存关联</button>' + (disabled ? '<span>请先完成通话、保存处理结果并退出</span>' : '') + '</div>');
  }
  async function bindAccount(id) {
    const accountId = document.getElementById('seat-binding-account')?.value || '';
    if (!window.AccountSeat) return CloudResourceRules.error('agent-detail', '坐席关联功能尚未就绪，请刷新重试');
    const result = await AccountSeat.bind(id, accountId, { replaceAccount: true });
    if (!result.ok) return CloudResourceRules.error('agent-detail', result.message);
    ui.closeLayer('agent-detail'); showToast('工作台使用账号已更新', 'success');
    RouteRuntime.refreshCurrent();
  }
  function statusText() { return ({ offered: '等待您接听', answering: '正在接听…', dialing: '正在呼叫', ringing: '等待客户接听', connected: '通话中', wrap: '话后处理' })[phase] || (window.SeatOperationUI?SeatOperationUI.presence():(online?'空闲':'未登录')); }
  function progress() {
    const step = phase === 'wrap' ? 3 : ['offered','answering'].includes(phase)?1:busy()?2:1;
    return '<ol class="seat-progress">' + [receiving()?'接听来电':modalMode?'确认呼叫信息':'填写客户信息', '通话与记录', '确认并保存'].map((s, i) =>
      '<li class="' + (i + 1 === step ? 'active' : i + 1 < step ? 'done' : '') + '"><span>' + (i + 1 < step ? '✓' : i + 1) + '</span>' + s + '</li>').join('') + '</ol>';
  }
  function fieldError() { return '<p id="seat-error" class="seat-error" role="alert">' + esc(error) + '</p>'; }
  function idleForm(c, assignedDialog=false) {
    if (assignedDialog && draft.customerTaskItemId) {
      const blocked=c.reason||window.AliCtiSeatOperations&&!AliCtiSeatOperations.canDial();
      return '<div class="seat-form seat-assigned-precall">'+
        '<section class="seat-contact-brief" aria-label="本次联系客户"><div class="seat-contact-person"><span class="seat-contact-avatar" aria-hidden="true">'+esc((draft.customerName||'客').slice(0,1))+'</span><div><span>客户</span><strong>'+esc(draft.customerName||'—')+'</strong></div></div><div class="seat-contact-number"><span>拨打号码</span><strong>'+esc(draft.phone||'—')+'</strong></div></section>'+
        (draft.note?'<div class="seat-contact-purpose"><strong>联系事项</strong><p>'+esc(draft.note)+'</p></div>':'')+
        fieldError()+
        '<div class="seat-primary-action">'+(!online?'<button id="seat-online" class="btn btn-primary" onclick="AgentWorkbench.signIn()"'+(signingIn||c.phoneReason?' disabled':'')+'>'+(signingIn?'登录中…':'登录，准备呼叫')+'</button>':'<button id="seat-dial" class="btn btn-primary" onclick="AgentWorkbench.dial()"'+(blocked?' disabled':'')+'>拨打客户</button>')+
        '<span>'+(!online?'先登录坐席电话，再联系客户':c.reason?'请先处理坐席或号码配置':blocked?'请先置闲，并确认工作模式支持主动联系':'通话中填写记录，挂断后确认保存')+'</span></div></div>';
    }
    const contacts = draft.customerTaskItemId ? [] : (window.CustomerDirectory?.list() || []).filter(r => r.tenantId === c.tenant?.tenantId && r.enterpriseId === c.tenant?.enterpriseId);
    return '<div class="seat-form">' + (assignedDialog || draft.customerTaskItemId ? '' : '<label class="field"><span>选择已有客户 ' + ui.help('从当前可见客户档案中带入号码。此处用于临时联系，不更改任何导入批次进度；处理分配任务请从待联系名单进入。', '已有客户选择说明') + '</span><select id="seat-contact" onchange="AgentWorkbench.chooseContact(this.value)"><option value="">直接输入新客户</option>' +
      contacts.map(r => '<option value="' + esc(r.id) + '"' + (draft.customerDirectoryId === r.id ? ' selected' : '') + '>' + esc(r.name + ' · ' + r.phone) + '</option>').join('') + '</select></label>') +
      '<div class="seat-field-grid"><label class="field"><span><em>*</em>客户称呼</span><input id="seat-customer-name"' + (draft.customerTaskItemId ? ' readonly' : '') + ' maxlength="40" value="' + esc(draft.customerName || '') + '" placeholder="请输入客户称呼" oninput="AgentWorkbench.updateField(\'customerName\',this.value)"></label>' +
      '<label class="field"><span><em>*</em>客户号码</span><input id="seat-phone"' + (draft.customerTaskItemId ? ' readonly' : '') + ' type="tel" maxlength="20" value="' + esc(draft.phone || '') + '" placeholder="手机号或带区号的固定电话" oninput="AgentWorkbench.updateField(\'phone\',this.value)"></label></div>' +
      '<label class="field"><span>联系备注</span><textarea id="seat-note" rows="2" maxlength="500" placeholder="记录本次需要沟通的内容（选填）" oninput="AgentWorkbench.updateField(\'note\',this.value)">' + esc(draft.note || '') + '</textarea></label>' +
      fieldError() + '<div class="seat-primary-action">'+(!online?'<button id="seat-online" class="btn btn-primary" onclick="AgentWorkbench.signIn()"'+(signingIn||c.phoneReason?' disabled':'')+'>'+(signingIn?'登录中…':'登录，准备呼叫')+'</button>':'<button id="seat-dial" class="btn btn-primary" onclick="AgentWorkbench.dial()"' + (c.reason || window.AliCtiSeatOperations&&!AliCtiSeatOperations.canDial() ? ' disabled' : '') + '>预览外呼</button>')+'<span>' + (!online ? '先登录，再开始联系客户' : window.AliCtiSeatOperations&&!AliCtiSeatOperations.canDial()?'请先置闲，并确认工作模式支持主动联系':'通话中可填写记录，挂断后确认保存') + '</span></div></div>';
  }
  function activePanel() {
    if (canEditRecord()) return recordPanel();
    const timer=phase==='connected'?duration(Math.max(0,Math.floor((Date.now()-call.answeredMs)/1000))):'00:00';
    const waiting=receiving()&&['offered','answering'].includes(phase),device=Number(call.bindType)!==3;
    return '<div class="seat-call-stage'+(waiting?' seat-incoming-stage'+(phase==='offered'?' is-ringing':''):'')+'">'+(waiting?'<div class="incoming-signal" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5Z"/></svg></div>':'')+'<span class="seat-call-kind">'+esc(callLabel())+'</span><div class="seat-avatar">'+esc(call.customerName.slice(0,1))+'</div><h2>'+esc(call.customerName)+'</h2><p class="seat-customer-phone">'+esc(customerPhone(call))+'</p><span class="seat-call-status" role="status">'+statusText()+'</span>'+
      (waiting?'<p class="seat-receiving-context">'+esc(call.workbenchKind==='predictive'?'来源任务：'+call.taskName:'拨入号码：'+call.callee)+'</p>':'<strong class="seat-timer" data-seat-timer>'+timer+'</strong>')+
      (call.customerNote?'<p class="seat-current-note">'+esc(call.customerNote)+'</p>':'')+fieldError()+
      '<div class="seat-call-actions">'+(waiting?((device?'<span class="seat-device-answer">请在电话上接听</span>':'<button class="btn btn-primary seat-answer" onclick="AgentWorkbench.answerIncoming()"'+(phase==='answering'?' disabled':'')+'>'+(phase==='answering'?'正在接听…':call.answerAttempt?'重试接听':'接听')+'</button>')):
      (phase==='connected'?'<button class="btn" aria-label="'+(muted?'取消静音':'静音')+'" title="'+(muted?'取消静音':'静音')+'" aria-pressed="'+muted+'" onclick="AgentWorkbench.toggleMute()">'+'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M9 21h6"/></svg></button>':'')+
      '<button class="btn seat-hangup" onclick="AgentWorkbench.end()">'+(phase==='connected'?'结束通话':'取消呼叫')+'</button>')+'</div><p class="seat-call-hint">'+(muted?'当前已静音':'关闭或返回可收起来电，稍后从通话条继续')+'</p></div>';
  }
  function draftNotice(){return draftStored?'':'暂存未成功，请保留当前页面并稍后重试';}
  function updateDraftNotice(){
    const node=document.getElementById('seat-draft-status');
    if(node){node.textContent=draftNotice();node.hidden=draftStored;}
  }
  function syncNotice(){
    const sync = window.CloudCallSync?.read(call);
    if (!sync || phase !== 'wrap') return '';
    return '<div class="call-sync-notice"><span class="call-sync-badge '+esc(sync.status)+'">'+esc(sync.label)+'</span><span>'+esc(sync.note)+'</span></div>';
  }
  function recordSummary(){
    const ended=phase==='wrap',state=CallState.view(call);
    const timer=phase==='connected'?duration(Math.max(0,Math.floor((Date.now()-call.answeredMs)/1000))):duration(call.durationSeconds||0);
    return '<section class="seat-record-summary'+(ended?' is-ended':'')+'"><div class="seat-record-person"><span class="seat-avatar small">'+esc(call.customerName.slice(0,1))+'</span><div><strong>'+esc(call.customerName)+'</strong><span>'+esc(customerPhone(call))+' · '+esc(callLabel())+'</span></div></div>'+
      '<div class="seat-record-controls"><div class="seat-record-state"><span role="status">'+(ended?'通话已结束':statusText())+'</span><strong data-seat-timer>'+timer+'</strong></div>'+
      (!ended?'<div class="seat-call-actions">'+(phase==='connected'?'<button class="btn" aria-label="'+(muted?'取消静音':'静音')+'" title="'+(muted?'取消静音':'静音')+'" aria-pressed="'+muted+'" onclick="AgentWorkbench.toggleMute()">'+'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M9 21h6"/></svg></button>':'')+
      '<button class="btn seat-hangup" onclick="AgentWorkbench.end()">'+(phase==='connected'?'结束通话':'取消呼叫')+'</button></div>':'<span class="seat-record-answer" data-seat-result>'+esc(receiving()?call.agentAnswerResult:state.answerLabel)+'</span>')+'</div></section>'+
      (ended?'<div data-seat-sync>'+syncNotice()+'</div>':'')+
      (ended&&!state.known?'<p class="seat-blocked" data-seat-unknown role="status">接通结果待确认，可先保存本次跟进记录。</p>':'');
  }
  function recordHeaderActions(){return phase==='wrap'?'<button class="btn btn-primary" id="seat-save" onclick="AgentWorkbench.saveDisposition()">保存并完成</button>'+(window.SeatOperationUI?.wrapupControl()||''):'';}
  function recordPanel(){
    return '<section class="seat-record-panel" data-seat-record-call="'+esc(call.callId)+'"><div class="seat-record-summary-sticky" data-seat-call-summary>'+recordSummary()+'</div><div class="seat-form seat-record-form">'+
      (call.customerNote?'<div class="seat-record-context"><strong>联系事项</strong><span>'+esc(call.customerNote)+'</span></div>':'')+
      '<label class="field"><span>沟通备注</span><textarea id="seat-remark" rows="4" maxlength="1000" placeholder="随时记录客户诉求、沟通要点或下次联系约定" oninput="AgentWorkbench.setRemark(this.value)">'+esc(remark)+'</textarea></label>'+
      '<p id="seat-draft-status" class="seat-draft-warning" role="alert"'+(draftStored?' hidden':'')+'>'+draftNotice()+'</p>'+
      '<label class="field"><span><em>*</em>处理结果 <small>保存前确认</small></span><select id="seat-disposition" onchange="AgentWorkbench.setDisposition(this.value)"><option value="">请选择</option>'+data.nativeWorkbench.outcomes.map(s=>'<option'+(disposition===s?' selected':'')+'>'+esc(s)+'</option>').join('')+'</select></label>'+
      '<details class="phone-record-more" open><summary>客户业务信息</summary>'+CustomerFollowup.form(followup,call,'seat-followup','AgentWorkbench.setFollowup')+'</details>'+fieldError()+'</div></section>';
  }
  function wrapPanel(){return recordPanel();}
  function renderSeat(options) {
    ensureScope();
    if(options)seatOptions={...options};
    const c=config(),manager=['ADMIN','SUPER_ADMIN'].includes(AppState.effectiveAccess().roleCode),supervisor=window.TenantCallMonitor?.eligible();
    if (!workspaceTab && options?.workspaceTab && ['outbound','monitor'].includes(options.workspaceTab)) workspaceTab=options.workspaceTab;
    if (!workspaceTab || workspaceTab==='monitor'&&!supervisor) workspaceTab=supervisor?'monitor':'outbound';
    const header=ui.pageHeader('坐席工作台',supervisor?'处理自己的通话，也可查看和管理本租户坐席。':'登录接听呼入与预外呼来电，也可主动联系客户。',
      ui.help(supervisor?'外呼坐席用于本人通话与记录；班长监控用于查看本租户外呼情况、坐席状态及接听队列。':'本页仅本人范围；预览外呼不改变导入批次进度。处理分配客户请点击名单中的联系客户。','坐席工作台说明'));
    const active=busy()?'<section class="seat-active-summary" data-seat-active-card role="status"><div><strong>'+esc(phase==='wrap'?'确认沟通记录':callLabel())+' · '+esc(call.customerName)+'</strong><span>'+esc(customerPhone(call))+' · '+statusText()+'</span></div><button class="btn btn-primary" onclick="AgentWorkbench.openDialog()">'+(phase==='wrap'?'确认并保存':'通话与记录')+'</button></section>':'';
    const noAgent='<section class="panel-card seat-no-agent"><h2>当前账号尚未关联坐席</h2><p>请由租户管理员在账号管理中关联或新建坐席。</p>'+
      (manager&&window.RouteRuntime?.canRoute('accounts')?'<button class="btn btn-primary" onclick="RouteRuntime.openSecondary(\'accounts\')">前往账号管理</button>':'')+'</section>';
    let content='';
    if(workspaceTab==='monitor'&&supervisor) content=window.TenantCallMonitor.render();
    else if(!c.agent&&!busy()) content=noAgent;
    else {
      content=(c.phoneReason&&!busy()?'<p class="seat-blocked" role="status">'+esc(c.phoneReason)+'</p>':'')+(error?fieldError():'')+
        (lastSavedId&&!busy()?'<div class="seat-saved" role="status"><span>✓ 处理结果已保存</span><button class="btn-link" onclick="AgentWorkbench.records(\''+esc(lastSavedId)+'\')">查看本次记录</button></div>':'')+
        (window.WorkbenchOverview?.renderSeat?WorkbenchOverview.renderSeat(seatOptions):'');
    }
    return '<section class="platform-page seat-workspace seat-home workbench-page" id="native-seat-workspace">'+header+tabs()+active+
      '<div id="seat-workspace-panel"'+(supervisor?' role="tabpanel" aria-labelledby="seat-tab-'+workspaceTab+'"':'')+'>'+content+'</div></section>';
  }
  function render(options){return renderSeat(options);}
  let dockResizeObserver;
  function toolbarActions() {
    const waiting=receiving()&&['offered','answering'].includes(phase);
    if(waiting) return Number(call.bindType)!==3?'<span>请在电话上接听</span>':
      '<button class="btn btn-primary" id="seat-answer" onclick="AgentWorkbench.answerIncoming()"'+(phase==='answering'?' disabled':'')+'>'+(phase==='answering'?'正在接听…':call.answerAttempt?'重试接听':'接听来电')+'</button>';
    if(phase==='wrap') return window.SeatOperationUI?.wrapupControl('toolbar')||'';
    return (phase==='connected'?'<details class="phone-menu mute-menu"><summary aria-label="静音范围" title="静音范围">⌄</summary><div class="phone-menu-panel"><label class="toolbar-mute-direction">静音范围<select id="seatMuteDirection" aria-label="静音范围"'+(muted?' disabled':'')+'><option value="all"'+(muteDirection==='all'?' selected':'')+'>双向音频</option><option value="in"'+(muteDirection==='in'?' selected':'')+'>传入音频</option><option value="out"'+(muteDirection==='out'?' selected':'')+'>传出音频</option></select></label></div></details><button class="btn phone-icon" aria-label="'+(muted?'取消静音':'静音')+'" title="'+(muted?'取消静音':'静音')+'" aria-pressed="'+muted+'" onclick="AgentWorkbench.toggleMute()">'+'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M9 21h6"/></svg></button>':'')+
      '<button class="btn seat-hangup" onclick="AgentWorkbench.end()">结束通话</button>';
  }
  function updateDock() {
    let dock = document.getElementById('native-call-dock');
    if (!hasSeat()) {
      dockResizeObserver?.disconnect(); dock?.remove();
      document.body.classList.remove('has-call-dock');
      document.body.style.removeProperty('--call-dock-height');
      return;
    }
    ensureScope();
    const c=config();
    if (!dock) {
      dock = document.createElement('section'); dock.id = 'native-call-dock'; dock.className = 'native-call-dock'; document.body.append(dock);
      dock.setAttribute('aria-label', '坐席电话工具条');
      dock.addEventListener('toggle', () => {
        dock.style.zIndex=dock.querySelector('details[open]')?String(PlatformUI.nextLayerZIndex()):'';
      }, true);
      dockResizeObserver = new ResizeObserver(() => {
        if (dock.isConnected) document.body.style.setProperty('--call-dock-height', dock.getBoundingClientRect().height + 'px');
      });
      dockResizeObserver.observe(dock);
    }
    document.body.classList.add('has-call-dock');
    dock.classList.toggle('is-calling',busy());
    dock.classList.toggle('is-wrapup',phase==='wrap');
    dock.classList.toggle('is-incoming',receiving()&&phase==='offered');
    dock.classList.toggle('is-connected',phase==='connected');
    dock.innerHTML='<span class="phone-rail-label"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5Z"/></svg>电话</span><div class="toolbar-seat"><span class="phone-seat-avatar">'+esc(c.agent.userName.slice(0,1))+'</span><strong>'+esc(c.agent.userName)+'</strong></div>'+
      (busy()?'<div class="toolbar-current"><span>'+esc(callLabel())+' · '+statusText()+'</span><strong>'+esc(call.customerName)+' <small>'+esc(customerPhone(call))+'</small></strong></div><span data-seat-timer>'+duration(call.durationSeconds||0)+'</span>'+toolbarActions()+
      '<button class="btn phone-record-toggle" onclick="AgentWorkbench.'+(modalVisible?'minimizeDialog()':'openDialog()')+'">'+(modalVisible?'收起记录':phase==='wrap'?'确认并保存':'客户与记录')+'</button>':
      (window.SeatOperationUI?.controls(c,{online,signingIn,busy:false,label:statusText(),compact:true})||''))+
      (window.SeatOperationUI?.notice()||'')+(error?'<p class="toolbar-error" role="alert">'+esc(error)+'</p>':'');
  }
  loadRecords();
  // Restore permanent "do not contact" decisions from saved native records.
  data.calls.filter(r => r.callSource === 'NATIVE_WORKBENCH' && r.agentDisposition === '客户拒绝联系')
    .forEach(r => data.nativeWorkbench.blockedNumbers.push({ tenantId: r.tenantId, phone: customerPhone(r) }));
  window.addEventListener('storage', e => { if (e.key === recordsKey) loadRecords(); });
  window.addEventListener('call-data-sync', e => {
    if (!call || phase !== 'wrap' || call.callId !== e.detail?.callId || call.tenantId !== e.detail?.tenantId || String(call.enterpriseId) !== String(e.detail?.enterpriseId) || !AppState.authorizeObject('', call)) return;
    window.CloudCallSync?.restore(call);
    document.querySelectorAll('[data-seat-sync]').forEach(node => { node.innerHTML = syncNotice(); });
    document.querySelectorAll('[data-seat-result]').forEach(node => { node.textContent = receiving() ? call.agentAnswerResult : CallState.view(call).answerLabel; });
    document.querySelectorAll('[data-seat-unknown]').forEach(node => { node.hidden = CallState.view(call).known; });
    document.querySelectorAll('[data-seat-timer]').forEach(node => { node.textContent = duration(call.durationSeconds || 0); });
    persist();
  });
  window.addEventListener('beforeunload', e => { if (busy()) { persist(); e.preventDefault(); e.returnValue = ''; } });
  setInterval(() => {
    if(['offered','answering'].includes(phase)&&call?.offerExpiresAt<=Date.now())return finishReceiving('坐席未接听');
    if (phase !== 'connected' || !call) return;
    call.durationSeconds = Math.floor((Date.now() - call.answeredMs) / 1000);
    document.querySelectorAll('[data-seat-timer]').forEach(el => { el.textContent = duration(call.durationSeconds); }); persist();
  }, 1000);
  window.Pages=window.Pages||{};
  window.Pages['seat-workbench']={render:renderSeat,captureNavigationState(){return {seatOptions:{...seatOptions},workspaceTab};},restoreNavigationState(state){if(state){seatOptions={...state.seatOptions};workspaceTab=state.workspaceTab||'';}},init(){updateDock();window.TenantCallMonitor?.telephoneChanged();}};
  window.AgentWorkbench = { telephoneStatus:()=>({online,signingIn,error}), myAgent, hasSeat, homeView, tabs, setWorkspaceTab, setPendingPage, open, openTemporary, render, renderSeat, updateDock, signIn, signOut, allowContextChange,
    openDialog,closeDialog,minimizeDialog,beforeRouteChange,receiveOffer,receiveStatus,answerIncoming,receivingContext,current:receivingContext,refreshTelephone,syncReceivingProgress,

    selectAssigned(r){ensureScope();if(busy()){open();return showToast('请先完成当前通话及结果填写','warning');}receivingOrigin=false;returnFocus=document.activeElement;origin=window.RouteRuntime?.snapshot?.()||null;originScroll=document.getElementById('page-content')?.scrollTop||0;draft={...draft,...CustomerBusiness.snapshot(r),customerDirectoryId:'',customerTaskItemId:r.id,customerName:r.name,phone:r.phone,note:r.note};error='';lastSavedId='';persist();modalMode=true;openDialog();},
    updateField, chooseContact, dial, end, saveDisposition, toggleMute, setDisposition, setRemark, setFollowup, setDemoResult, records, bindingPanel, bindAccount, confirmDemoResult };
  AppState.subscribe?.(()=>{ if(!hasSeat()||scope!==currentScope()) updateDock(); });
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||!modalVisible||document.getElementById('seat-operation-drawer'))return;
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeDialog();}

  });
})();
