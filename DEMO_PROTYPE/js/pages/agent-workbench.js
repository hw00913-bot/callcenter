/** Native manual outbound workspace. All telephony events here are explicitly simulated. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, data = CloudCallData;
  const recordsKey = 'native-workbench-records-v1', sessionKey = 'native-workbench-session-v1';
  let scope = '', draft = {}, call = null, phase = 'idle', online = false, signingIn = false;
  let seatId = '', releaseLock = null, error = '', demoResult = '接通', muted = false;
  let answerTimer, ringTimer, lastSavedId = '', disposition = '', remark = '';
  let modalMode=false, modalVisible=false, returnFocus=null;
  const modalId='assigned-call-dialog';
  let origin=null,originScroll=0,seatOptions={};
  const busy = () => ['dialing', 'ringing', 'connected', 'wrap'].includes(phase);
  const stamp = value => new Date(value || Date.now()).toLocaleString('sv-SE');
  const duration = value => String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
  const currentScope = () => AppState.account().accountId + ':' + AppState.get().tenantId;
  function read(key, storage) { try { return JSON.parse(storage.getItem(key) || 'null'); } catch (_) { return null; } }
  function write(key, value, storage) { try { storage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function myAgent() {
    const account = AppState.account(), context = AppState.get();
    return data.agents.find(a => a.tenantId === context.tenantId && a.instanceId === context.instanceId &&
      a.lifecycleStatus !== '已删除' && (a.accountId === account.accountId ||
        (!a.accountId && a.contactCenterIdentityId === account.linkedIdentityId)));
  }
  function loadRecords() {
    const rows = read(recordsKey, localStorage);
    if (!Array.isArray(rows)) return;
    rows.filter(r => r.callSource === 'NATIVE_WORKBENCH' && r.callId).forEach(r => {
      const existing = data.calls.find(c => c.callId === r.callId);
      if (existing) Object.assign(existing, r); else data.calls.unshift(r);
    });
    window.CustomerDirectory?.sync();
  }
  function saveRecord(row) {
    const existing = data.calls.find(c => c.callId === row.callId);
    if (existing) Object.assign(existing, row); else data.calls.unshift(row);
    const saved = read(recordsKey, localStorage);
    const merged = new Map((Array.isArray(saved) ? saved : []).map(c => [c.callId, c]));
    data.calls.filter(c => c.callSource === 'NATIVE_WORKBENCH').forEach(c => merged.set(c.callId, c));
    if (!write(recordsKey, Array.from(merged.values()), localStorage)) showToast('浏览器存储不可用，记录仅保留在当前页面会话', 'warning');
    window.CustomerTasks?.syncCall(row);
    window.CustomerDirectory?.sync();
  }
  function persist() {
    write(sessionKey, { scope, draft, call, phase, disposition, remark, lastSavedId, demoResult }, sessionStorage);
  }
  function ensureScope() {
    if (scope === currentScope()) return;
    scope = currentScope(); draft = {}; call = null; phase = 'idle'; error = '';
    disposition = ''; remark = ''; lastSavedId = '';
    const saved = read(sessionKey, sessionStorage);
    if (saved?.scope !== scope) return;
    draft = saved.draft || {}; lastSavedId = saved.lastSavedId || '';
    demoResult = saved.demoResult || '接通'; disposition = saved.disposition || ''; remark = saved.remark || '';
    if (saved.call && ['dialing', 'ringing', 'connected', 'wrap'].includes(saved.phase)) {
      call = saved.call; phase = 'wrap';
      if (saved.phase !== 'wrap') {
        call.endedAt = stamp(); call.durationSeconds = Math.max(0, call.durationSeconds || 0);
        call.result = '演示中断'; call.processingStatus = '待填写'; call.agentDisposition = '';
      }
      saveRecord(call); persist();
    }
  }
  function config() {
    const agent = myAgent(), tenant = AppState.currentTenant(), account = AppState.account();
    const groups = data.physicalSkillGroups.filter(g=>g.tenantId===tenant?.tenantId&&g.instanceId===tenant?.instanceId&&g.status==='已启用'&&data.agentSkills.some(r=>r.identityId===agent?.contactCenterIdentityId&&r.physicalGroupId===g.physicalGroupId&&r.status==='已生效'&&r.syncStatus==='同步成功'));
    const group=groups.find(g=>g.skillGroupId===draft.skillGroupId)||(!draft.skillGroupId&&groups.length===1?groups[0]:null);
    const numbers=group?ManualSkillAccess.numbers(group):[];
    let reason = '';
    if (!AppState.isReady() || AppState.get().activeDomain !== 'CLOUD_CONTACT_CENTER') reason = '请先进入云呼叫工作台';
    else if (!AppState.effectiveAccess().valid) reason = '当前账号已无此工作范围的使用权限，请联系管理员';
    else if (tenant?.status !== '启用' || account.status !== '启用') reason = '当前账号或租户已停用，请联系管理员';
    else if (!agent) reason = '当前账号尚未关联本租户坐席，请联系租户管理员完成关联';
    else if (agent.lifecycleStatus !== '已启用' || !agent.phonebarPermission || !agent.acceptNewTasks) reason = '坐席已停用或暂停接收新任务，请联系管理员';
    else if (agent.syncStatus !== '同步成功') reason = '坐席开通尚未完成，请等待管理员完成同步';
    else if(!groups.length) reason='当前坐席没有已生效的坐席技能组，请联系管理员';
    else if(!group) reason='请选择本次使用的坐席技能组';
    else if(!numbers.length) reason='该技能组没有当前可用的外显号码，请联系管理员';
    return {agent,tenant,groups,group,numbers,reason};
  }

  function homeView() { return 'overview'; }
  function tabs() { return ''; }
  function open(view) { if(view==='overview')navigateTo('home');else if(modalMode||busy())openDialog();else navigateTo('seat-workbench'); }
  function hasSeat(){return AppState.isReady()&&AppState.effectiveAccess().valid&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&!!myAgent();}
  function openTemporary(){ensureScope();if(busy())return openDialog();origin=window.RouteRuntime?.snapshot?.()||null;originScroll=document.getElementById('page-content')?.scrollTop||0;returnFocus=document.activeElement;if(draft.customerTaskItemId)draft={...draft,customerTaskItemId:'',customerDirectoryId:'',externalDocumentId:'',customerName:'',phone:'',note:''};error='';persist();openDialog();}
  function refreshOrigin(){const page=origin?.key||(location.hash||'#home').slice(1).split('?')[0]||'home';if(['home','seat-workbench','customer-tasks','manual-outbound'].includes(page)){navigateTo(page,origin?.options);const content=document.getElementById('page-content');if(content)content.scrollTop=originScroll;}}
  function beforeRouteChange(){if(modalVisible){modalVisible=false;ui.closeLayer(modalId);if(!busy())modalMode=false;}}
  function dialogBody(){
    const c=config(),name=call?.customerName||draft.customerName||'客户';
    return '<div class="layer-header"><div><h2 id="assigned-call-title">'+(draft.customerTaskItemId||busy()?'联系客户 · '+esc(name):'临时拨号')+'</h2><p>在此完成呼叫与跟进结果，保存后返回名单</p></div><div class="assigned-call-header-actions">'+(busy()?'<button class="btn" onclick="AgentWorkbench.minimizeDialog()">收起</button>':'')+'<button aria-label="关闭联系客户" onclick="AgentWorkbench.closeDialog()">×</button></div></div>'+ 
      '<div class="layer-body seat-workspace assigned-call-body"><div class="assigned-call-status"><span>'+esc(c.agent?.userName||'未关联坐席')+' · '+statusText()+'</span><span>仅本地演示，不拨打真实电话</span></div>'+progress()+
      ((draft.customerTaskItemId||call?.externalDocumentId)?'<p class="seat-current-note">外部单据标识：'+esc(call ? (call.externalDocumentId||'—') : (draft.externalDocumentId||'—'))+'</p>':'')+
      (phase==='wrap'?wrapPanel():busy()?activePanel():(c.reason?'<p class="seat-blocked" role="status">'+esc(c.reason)+'</p>':'')+idleForm(c,!!draft.customerTaskItemId))+'</div>';
  }
  function drawDialog(){
    if(!modalVisible)return;
    const focusedId=document.activeElement?.id;
    ui.openLayer(modalId,dialogBody(),'large');
    const node=document.getElementById(modalId),panel=node?.querySelector('.layer-panel'),backdrop=node?.querySelector('.layer-backdrop');
    if(panel){panel.classList.add('assigned-call-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','assigned-call-title');}
    if(backdrop)backdrop.onclick=()=>closeDialog();
    requestAnimationFrame(()=>{if(!modalVisible)return;const previous=focusedId&&document.getElementById(focusedId);if(previous&&node?.contains(previous))previous.focus();else (node?.querySelector('select:not([disabled])')||node?.querySelector('button:not([disabled])'))?.focus();});
  }
  function openDialog(){modalMode=true;modalVisible=true;drawDialog();updateDock();requestAnimationFrame(()=>document.getElementById(phase==='wrap'?'seat-disposition':'seat-skill-group')?.focus());}
  function minimizeDialog(){if(!busy())return closeDialog();modalVisible=false;ui.closeLayer(modalId);refreshOrigin();updateDock();showToast(phase==='wrap'?'处理结果尚未保存，请从通话条继续填写':'通话仍在进行，可从通话条返回','info');}
  function closeDialog(){
    if(phase==='wrap'){showToast('请先保存本次跟进结果；暂时离开可点击收起','warning');document.getElementById('seat-disposition')?.focus();return false;}
    if(busy()){minimizeDialog();return false;}
    modalMode=false;modalVisible=false;ui.closeLayer(modalId);updateDock();refreshOrigin();returnFocus?.focus?.();return true;
  }
  function refresh() {
    persist();
    if(modalVisible)drawDialog();
    else if (!modalMode&&document.getElementById('native-seat-workspace')) {
      const content = document.getElementById('page-content'), scroll = content.scrollTop;
      content.innerHTML = renderSeat(); content.scrollTop = scroll;
    }
    updateDock();
  }
  function fail(message, field) {
    error = message; refresh();
    const input = field && document.getElementById(field);
    if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
    return false;
  }
  function release() {
    const a = data.agents.find(r => r.contactCenterIdentityId === seatId);
    if (a?.currentEndpoint === 'NATIVE_WORKBENCH') {
      a.currentEndpoint = ''; a.currentCall = false;
      if (a.lifecycleStatus === '已启用') a.agentStatus = '离线';
    }
    online = false; seatId = '';
    const done = releaseLock; releaseLock = null; if (done) done();
  }
  async function signIn() {
    if (online || signingIn || busy()) return;
    const c = config(); if (c.reason) return fail(c.reason);
    if (c.agent.currentCall || c.agent.currentEndpoint || ['通话中', '话后处理'].includes(c.agent.agentStatus))
      return fail('该坐席正在其他窗口或业务系统使用，请先在那里下线');
    if (!navigator.locks) return fail('当前浏览器无法校验重复登录，请使用 Chrome 并通过本地预览地址访问');
    signingIn = true; refresh();
    const targetScope = currentScope();
    try {
      await navigator.locks.request('unified-call-seat:' + c.agent.contactCenterIdentityId, { ifAvailable: true }, async lock => {
        signingIn = false;
        if (!lock) return fail('该坐席已在其他窗口上线，请先在原窗口下线');
        if (targetScope !== currentScope() || config().reason) return fail('工作范围或坐席配置已改变，请重新上线');
        online = true; seatId = c.agent.contactCenterIdentityId; error = '';
        c.agent.currentEndpoint = 'NATIVE_WORKBENCH'; c.agent.agentStatus = '空闲';
        refresh(); showToast('坐席已上线，可以开始外呼', 'success');
        await new Promise(resolve => { releaseLock = resolve; });
      });
    } catch (_) { signingIn = false; fail('坐席上线失败，请稍后重试'); }
  }
  function signOut() {
    if (busy()) return fail('请先结束通话并保存处理结果，再下线');
    release(); refresh();
  }
  function allowContextChange(checkOnly) {
    if (busy()) { showToast('请先结束当前通话并保存处理结果，再退出或切换业务域', 'warning'); return false; }
    if (!checkOnly) {release();modalMode=false;modalVisible=false;ui.closeLayer(modalId);}
    return true;
  }
  function updateField(field, value) {
    if (!['customerName', 'phone', 'note', 'numberId', 'skillGroupId'].includes(field) || busy()) return;
    if(draft.customerTaskItemId&&['customerName','phone'].includes(field))return;
    if (field === 'skillGroupId') {
      if (!config().groups.some(g => g.skillGroupId === value)) return;
      draft.skillGroupId = value; draft.numberId = ''; error = ''; persist(); refresh(); return;
    }
    draft[field] = value;
    if (field === 'phone') draft.customerDirectoryId = '';
    error = ''; persist();
    const message = document.getElementById('seat-error'); if (message) message.textContent = '';
  }
  function chooseContact(id) {
    if (busy()) return;
    const row = id ? window.CustomerDirectory?.find(id) : null;
    if (id && !row) return fail('该客户已不在当前可查看范围内，请重新选择');
    draft = { ...draft, customerTaskItemId:'', externalDocumentId:'', customerDirectoryId:row?.id || '', customerName: row?.name || '', phone: row?.phone || '', note: row?.note || '' };
    error = ''; refresh();
  }
  function dial() {
    if (busy()) return false;
    const c = config();
    if (c.reason) return fail(c.reason);
    if (!online || seatId !== c.agent.contactCenterIdentityId) return fail('请先点击右上方“上线”');
    if (c.agent.currentCall || c.agent.currentEndpoint !== 'NATIVE_WORKBENCH') return fail('坐席正在其他通话中，不能重复呼叫');
    const phone = window.CustomerDirectory ? CustomerDirectory.normalizePhone(draft.phone) : String(draft.phone || '').replace(/[\s-]/g, '');
    if (!String(draft.customerName || '').trim()) return fail('请填写客户称呼', 'seat-customer-name');
    if (!/^(1[3-9]\d{9}|0\d{9,11})$/.test(phone)) return fail('请输入完整的手机号或带区号的固定电话', 'seat-phone');
    if ((data.nativeWorkbench.blockedNumbers || []).some(n => n.tenantId === c.tenant.tenantId && n.phone === phone) ||
      data.calls.some(r => r.tenantId === c.tenant.tenantId && r.callee === phone && r.agentDisposition === '客户拒绝联系'))
      return fail('该号码已禁止联系，坐席和管理员均不能绕过', 'seat-phone');
    const number = c.numbers.find(n => n.numberId === (draft.numberId || c.numbers[0]?.numberId));
    if (!number) return fail('所选号码已不可用，请重新选择', 'seat-caller');
    if(draft.customerTaskItemId){const item=CustomerTasks.row(draft.customerTaskItemId);if(!item||!CustomerTasks.canCall(item.r)||item.r.phone!==phone)return fail('该客户分配已改变，请重新选择待联系客户');}
    if (draft.customerDirectoryId) { const customer = window.CustomerDirectory?.find(draft.customerDirectoryId); if (!customer || customer.phone !== phone) return fail('客户授权已改变，请重新选择客户'); }
    draft.phone = phone; draft.numberId = number.numberId;
    call = {
      callId: 'MC' + Date.now().toString(36).toUpperCase() + crypto.randomUUID().slice(0, 4).toUpperCase(), contactId: '—', tenantId: c.tenant.tenantId, instanceId: c.tenant.instanceId,
      accountId: AppState.account().accountId, contactCenterIdentityId: seatId, agentIdentityId: seatId, agentName: c.agent.userName,
      customerName: draft.customerName.trim(), customerNote: draft.note || '', externalDocumentId: draft.customerTaskItemId ? (CustomerTasks.row(draft.customerTaskItemId)?.r.externalDocumentId || '') : '', caller: number.number, callee: phone,
      callerNumberId: number.numberId, skillGroupName: c.group.name,
      skillGroupId: c.group.skillGroupId, callSource: 'NATIVE_WORKBENCH', callType: '人工外呼', direction: '呼出',
      ringingAt: stamp(), answeredAt: '—', endedAt: '', durationSeconds: 0, result: '呼叫中',
      recordingApplicability: '演示无录音', recordingStatus: '演示无录音', recordingSource: '未连接真实线路',
      recordingScope: '不适用', recordingUrlExpiresAt: '不适用', callbackStatus: '无需回流',
      businessSystemId: '', businessRecordId: '', agentDisposition: '', processingStatus: '待填写',
      customerTaskItemId:draft.customerTaskItemId||'', simulation: true, simulationOutcome: demoResult
    };
    if(call.customerTaskItemId&&!CustomerTasks.claim(call.customerTaskItemId,call)){call=null;return fail('客户正在被处理或分配已改变，请刷新名单');}
    // Snapshot call resources; later configuration changes only affect the next call.
    phase = 'dialing'; muted = false; error = ''; disposition = ''; remark = ''; lastSavedId = '';
    c.agent.currentCall = true; c.agent.agentStatus = '通话中'; refresh();
    ringTimer = setTimeout(() => { if (phase === 'dialing') { phase = 'ringing'; refresh(); } }, 700);
    answerTimer = setTimeout(() => {
      if (!['dialing', 'ringing'].includes(phase)) return;
      if (call.simulationOutcome !== '接通') return end(call.simulationOutcome);
      phase = 'connected'; call.answeredAt = stamp(); call.answeredMs = Date.now(); call.result = '接通'; refresh();
    }, 2400);
    return true;
  }
  function end(result) {
    if (!['dialing', 'ringing', 'connected'].includes(phase)) return;
    clearTimeout(answerTimer); clearTimeout(ringTimer);
    const connected = phase === 'connected';
    call.durationSeconds = connected ? Math.max(1, Math.floor((Date.now() - call.answeredMs) / 1000)) : 0;
    call.endedAt = stamp(); call.result = result || (connected ? '接通' : '已取消');
    phase = 'wrap'; muted = false;
    const a = data.agents.find(r => r.contactCenterIdentityId === call.contactCenterIdentityId);
    if (a) {
      a.currentCall = false; a.agentStatus = '话后处理';
      if (a.lifecycleStatus === '停用中') { a.lifecycleStatus = '已停用'; a.phonebarPermission = false; AccountSeat.finishPendingDisable(a, call); }
    }
    saveRecord(call); refresh();
  }
  function saveDisposition() {
    if (phase !== 'wrap' || !call || call.accountId !== AppState.account().accountId || call.tenantId !== AppState.get().tenantId) return;
    if (!data.nativeWorkbench.outcomes.includes(disposition)) return fail('请选择本次联系的处理结果', 'seat-disposition');
    if (disposition === '需要再次联系' && !remark.trim()) return fail('请在备注中填写下次联系的约定', 'seat-remark');
    call.agentDisposition = disposition; call.dispositionRemark = remark.trim(); call.processingStatus = '已完成';
    call.dispositionAt = stamp(); saveRecord(call); lastSavedId = call.callId;
    if (disposition === '客户拒绝联系' && !data.nativeWorkbench.blockedNumbers.some(n => n.tenantId === call.tenantId && n.phone === call.callee))
      data.nativeWorkbench.blockedNumbers.push({ tenantId: call.tenantId, phone: call.callee });
    CloudCallRuntime.addAudit('保存人工外呼处理结果', call.callId, call.tenantId, '待填写', disposition);
    const a = data.agents.find(r => r.contactCenterIdentityId === call.contactCenterIdentityId);
    call = null; phase = 'idle'; error = '';
    // Keep work resources for the next customer; config() still revalidates grants.
    draft = { skillGroupId: draft.skillGroupId, numberId: draft.numberId }; disposition = ''; remark = '';
    if (a?.lifecycleStatus !== '已启用' || !a?.acceptNewTasks) release();
    else a.agentStatus = online ? '空闲' : '离线';
    if(modalMode){persist();modalMode=false;modalVisible=false;ui.closeLayer(modalId);updateDock();refreshOrigin();returnFocus?.focus?.();}
    else refresh();
    showToast('处理结果已保存，客户名单与通话记录已更新', 'success');
  }
  function toggleMute() { if (phase === 'connected') { muted = !muted; refresh(); } }
  function clearFormError() {
    error = ''; const message = document.getElementById('seat-error'); if (message) message.textContent = '';
    document.querySelectorAll('.seat-workspace [aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  }
  function setDisposition(value) { disposition = value; clearFormError(); persist(); }
  function setRemark(value) { remark = value; clearFormError(); persist(); }
  function setDemoResult(value) { if (data.nativeWorkbench.demoResults.includes(value) && !busy()) { demoResult = value; persist(); } }
  function records(id) { navigateTo('cloud-call-records', { type: '人工外呼', nativeAgentId: myAgent()?.contactCenterIdentityId, callId: id || '' }); }
  function bindingAccounts(agent) {
    if(window.AccountSeat)return AccountSeat.bindingAccounts(agent);
    return data.accounts.filter(a => a.status === '启用' && !a.builtIn &&
      data.memberships.some(m => m.accountId === a.accountId && m.tenantId === agent.tenantId && m.status === '启用') &&
      !data.agents.some(other => other !== agent && other.tenantId === agent.tenantId &&
        other.lifecycleStatus !== '已删除' && other.accountId === a.accountId));
  }
  function bindingPanel(agent) {
    if (AppState.effectiveAccess().roleCode === 'OPERATOR' || agent.lifecycleStatus === '已删除') return '';
    const disabled = window.AccountSeat ? AccountSeat.inUse(agent) : agent.currentCall || !!agent.currentEndpoint || !['离线','未上线','未登录'].includes(agent.agentStatus);
    return ui.detailSection('工作台使用账号', '<div class="form-grid"><label class="field"><span>平台登录账号 ' +
      ui.help('从本租户的已有账号中选择；关联后，该账号可在“坐席工作台”上线外呼，不新建账号、不改变角色或业务系统映射。请确保选择坐席本人的账号。') +
      '</span><select id="seat-binding-account"' + (disabled ? ' disabled' : '') + '><option value="">暂不关联</option>' +
      bindingAccounts(agent).map(a => '<option value="' + a.accountId + '"' + (agent.accountId === a.accountId ? ' selected' : '') + '>' + esc(a.name + ' · ' + a.loginUsername) + '</option>').join('') +
      '</select></label></div><div class="seat-binding-action"><button class="btn btn-primary" onclick="AgentWorkbench.bindAccount(\'' + esc(agent.contactCenterIdentityId) + '\')"' +
      (disabled ? ' disabled' : '') + '>保存关联</button>' + (disabled ? '<span>请先完成通话、保存处理结果并下线</span>' : '') + '</div>');
  }
  async function bindAccount(id) {
    const accountId = document.getElementById('seat-binding-account')?.value || '';
    if (!window.AccountSeat) return CloudResourceRules.error('agent-detail', '坐席关联功能尚未就绪，请刷新重试');
    const result = await AccountSeat.bind(id, accountId, { replaceAccount: true });
    if (!result.ok) return CloudResourceRules.error('agent-detail', result.message);
    ui.closeLayer('agent-detail'); showToast('工作台使用账号已更新', 'success');
    navigateTo('agent-maintenance');
  }
  function statusText() { return ({ dialing: '正在呼叫', ringing: '等待客户接听', connected: '通话中', wrap: '话后处理' })[phase] || (online ? '空闲' : '未上线'); }
  function progress() {
    const step = phase === 'wrap' ? 3 : busy() ? 2 : 1;
    return '<ol class="seat-progress">' + [modalMode?'确认呼叫信息':'填写客户信息', '完成通话', '保存处理结果'].map((s, i) =>
      '<li class="' + (i + 1 === step ? 'active' : i + 1 < step ? 'done' : '') + '"><span>' + (i + 1 < step ? '✓' : i + 1) + '</span>' + s + '</li>').join('') + '</ol>';
  }
  function fieldError() { return '<p id="seat-error" class="seat-error" role="alert">' + esc(error) + '</p>'; }
  function idleForm(c, assignedDialog=false) {
    const contacts = draft.customerTaskItemId ? [] : (window.CustomerDirectory?.list() || []).filter(r => r.tenantId === c.tenant?.tenantId && r.instanceId === c.tenant?.instanceId);
    if (!c.numbers.some(n => n.numberId === draft.numberId)) draft.numberId = c.numbers[0]?.numberId || '';
    return '<div class="seat-form"><label class="field"><span><em>*</em>坐席技能组 ' + ui.help('按本次工作选择；只引用已有技能和号码权限，不会更改坐席技能。通话和话后处理期间不能切换。') + '</span><select id="seat-skill-group" onchange="AgentWorkbench.updateField(\'skillGroupId\',this.value)"><option value="">请选择坐席技能组</option>' + c.groups.map(g => '<option value="' + esc(g.skillGroupId) + '"' + (g.skillGroupId === c.group?.skillGroupId ? ' selected' : '') + '>' + esc(g.name) + '</option>').join('') + '</select></label>'+ (assignedDialog || draft.customerTaskItemId ? '' : '<label class="field"><span>选择已有客户 ' + ui.help('从当前可见客户档案中带入号码。此处用于临时联系，不更改任何导入批次进度；处理分配任务请从待联系名单进入。', '已有客户选择说明') + '</span><select id="seat-contact" onchange="AgentWorkbench.chooseContact(this.value)"><option value="">直接输入新客户</option>' +
      contacts.map(r => '<option value="' + esc(r.id) + '"' + (draft.customerDirectoryId === r.id ? ' selected' : '') + '>' + esc(r.name + ' · ' + r.phone) + '</option>').join('') + '</select></label>') +
      '<div class="seat-field-grid"><label class="field"><span><em>*</em>客户称呼</span><input id="seat-customer-name"' + (draft.customerTaskItemId ? ' readonly' : '') + ' maxlength="40" value="' + esc(draft.customerName || '') + '" placeholder="请输入客户称呼" oninput="AgentWorkbench.updateField(\'customerName\',this.value)"></label>' +
      '<label class="field"><span><em>*</em>客户号码</span><input id="seat-phone"' + (draft.customerTaskItemId ? ' readonly' : '') + ' type="tel" maxlength="20" value="' + esc(draft.phone || '') + '" placeholder="手机号或带区号的固定电话" oninput="AgentWorkbench.updateField(\'phone\',this.value)"></label></div>' +
      '<label class="field"><span>联系备注</span><textarea id="seat-note" rows="2" maxlength="500" placeholder="记录本次需要沟通的内容（选填）" oninput="AgentWorkbench.updateField(\'note\',this.value)">' + esc(draft.note || '') + '</textarea></label>' +
      '<label class="field"><span>外显号码 ' + ui.help('仅展示绑定当前技能组、本租户获授权且线路可用的号码。停用、隔离和未验证号码不能使用。') + '</span><select id="seat-caller" onchange="AgentWorkbench.updateField(\'numberId\',this.value)">' +
      (c.numbers.map(n => '<option value="' + n.numberId + '"' + (draft.numberId === n.numberId ? ' selected' : '') + '>' + esc(n.number) + '</option>').join('') || '<option value="">暂无可用号码</option>') + '</select></label>' +
      fieldError() + '<div class="seat-primary-action">'+(!online?'<button id="seat-online" class="btn btn-primary" onclick="AgentWorkbench.signIn()"'+(signingIn||c.reason?' disabled':'')+'>'+(signingIn?'上线中…':'上线，准备呼叫')+'</button>':'<button id="seat-dial" class="btn btn-primary" onclick="AgentWorkbench.dial()"' + (c.reason ? ' disabled' : '') + '>开始呼叫</button>')+'<span>' + (!online ? '先上线，再开始联系客户' : '通话结束后继续填写处理结果') + '</span></div></div>';
  }
  function activePanel() {
    const timer = phase === 'connected' ? duration(Math.floor((Date.now() - call.answeredMs) / 1000)) : '00:00';
    return '<div class="seat-call-stage"><div class="seat-avatar">' + esc(call.customerName.slice(0, 1)) + '</div><h2>' + esc(call.customerName) + '</h2><p class="seat-customer-phone">' + esc(call.callee) + '</p><span class="seat-call-status">' + statusText() + '</span><strong class="seat-timer" data-seat-timer>' + timer + '</strong><p class="seat-current-note">' + esc(call.customerNote || '本次未填写联系备注') + '</p>' +
      '<div class="seat-call-actions">' + (phase === 'connected' ? '<button class="btn" aria-pressed="' + muted + '" onclick="AgentWorkbench.toggleMute()">' + (muted ? '取消静音' : '静音') + '</button>' : '') +
      '<button class="btn seat-hangup" onclick="AgentWorkbench.end()">' + (phase === 'connected' ? '结束通话' : '取消呼叫') + '</button></div><p class="seat-call-hint">' + (muted ? '演示：当前已静音' : '可切换页面，当前通话会继续保留') + '</p></div>';
  }
  function wrapPanel() {
    return '<div class="seat-form"><div class="seat-wrap-summary"><span class="seat-complete-icon">✓</span><div><h2>通话已结束，请填写处理结果</h2><p>' + esc(call.customerName + ' · ' + call.callee) + '</p></div><div><strong>' + esc(call.result) + '</strong><span>' + duration(call.durationSeconds) + '</span></div></div>' +
      '<label class="field"><span><em>*</em>处理结果</span><select id="seat-disposition" onchange="AgentWorkbench.setDisposition(this.value)"><option value="">请选择</option>' +
      data.nativeWorkbench.outcomes.map(s => '<option' + (disposition === s ? ' selected' : '') + '>' + esc(s) + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>处理备注 ' + ui.help('选择“需要再次联系”时，请填写约定；选择“客户拒绝联系”后禁止再次呼叫该号码。') + '</span><textarea id="seat-remark" rows="4" maxlength="1000" placeholder="填写沟通情况；需再次联系时填写下次约定" oninput="AgentWorkbench.setRemark(this.value)">' + esc(remark) + '</textarea></label>' +
      '<p class="seat-secondary-note">本次为中台直接外呼，记录保存在当前租户，无需回流业务系统。</p>' + fieldError() +
      '<div class="seat-primary-action"><button class="btn btn-primary" id="seat-save" onclick="AgentWorkbench.saveDisposition()">保存并完成</button><span>保存后可开始下一通外呼</span></div></div>';
  }
  function renderSeat(options) {
    if(options)seatOptions={...options};
    ensureScope();const c=config(),manager=['ADMIN','SUPER_ADMIN'].includes(AppState.effectiveAccess().roleCode);
    const header=ui.pageHeader('坐席工作台','查看本人待联络客户，在弹窗内完成通话与跟进结果。',
      ui.help('本页仅本人范围；临时拨号不改变导入批次进度。处理分配客户请点击名单中的联系客户。使用已有技能和号码，不新建角色或账号。','坐席工作台说明'));
    if(!c.agent&&!busy())return '<section class="platform-page seat-workspace">'+header+'<section class="panel-card seat-no-agent"><h2>当前账号尚未关联坐席</h2><p>请由租户管理员在账号管理中关联或新建坐席。</p>'+
      (manager&&window.RouteRuntime?.canRoute('accounts')?'<button class="btn btn-primary" onclick="navigateTo(\'accounts\')">前往账号管理</button>':'')+'</section></section>';
    const groups=c.groups.map(g=>'<option value="'+esc(g.skillGroupId)+'"'+(g.skillGroupId===c.group?.skillGroupId?' selected':'')+'>'+esc(g.name)+'</option>').join('');
    return '<section class="platform-page seat-workspace seat-home workbench-page" id="native-seat-workspace">'+header+
      '<section class="panel-card seat-home-session"><div class="seat-session-person"><span class="seat-avatar small">'+esc((c.agent?.userName||'坐').slice(0,1))+'</span><div><strong>'+esc(c.agent?.userName||'当前坐席')+'</strong><span>'+esc(c.tenant?.name||'')+'</span></div></div>'+
      '<label class="seat-home-skill">坐席技能组<select id="seat-workspace-skill" onchange="AgentWorkbench.updateField(\'skillGroupId\',this.value)"'+(busy()?' disabled':'')+'><option value="">请选择坐席技能组</option>'+groups+'</select></label>'+
      '<div class="seat-session-controls"><span class="seat-presence '+(online?'online':'')+'"><i></i>'+statusText()+'</span>'+
      '<button class="btn" id="seat-workspace-online" onclick="AgentWorkbench.'+(online?'signOut':'signIn')+'()"'+(signingIn||busy()||!online&&!!c.reason?' disabled':'')+'>'+(signingIn?'上线中…':online?'下线':'上线')+'</button>'+
      '<button class="btn btn-primary" id="seat-temporary" onclick="AgentWorkbench.openTemporary()"'+(busy()?' disabled':'')+'>临时拨号</button></div></section>'+
      (c.reason&&!busy()?'<p class="seat-blocked" role="status">'+esc(c.reason)+'</p>':'')+
      '<div class="seat-demo-label"><span>本地演示 · 不拨打真实电话</span><details><summary>演示选项</summary><label>客户响应<select id="seat-demo-result" onchange="AgentWorkbench.setDemoResult(this.value)"'+(busy()?' disabled':'')+'>'+data.nativeWorkbench.demoResults.map(r=>'<option'+(r===demoResult?' selected':'')+'>'+esc(r)+'</option>').join('')+'</select></label></details></div>'+
      (busy()?'<section class="seat-active-summary" data-seat-active-card role="status"><div><strong>'+esc(phase==='wrap'?'填写处理结果':'当前通话')+' · '+esc(call.customerName)+'</strong><span>'+esc(call.callee)+' · '+statusText()+'</span></div><button class="btn btn-primary" onclick="AgentWorkbench.openDialog()">'+(phase==='wrap'?'填写处理结果':'返回通话')+'</button></section>':'')+
      (lastSavedId&&!busy()?'<div class="seat-saved" role="status"><span>✓ 处理结果已保存，可继续联系下一位客户</span><button class="btn-link" onclick="AgentWorkbench.records(\''+esc(lastSavedId)+'\')">查看本次记录</button></div>':'')+
      (window.WorkbenchOverview?.renderSeat?WorkbenchOverview.renderSeat(seatOptions):'')+'</section>';
  }
  function render(options){return renderSeat(options);}
  function updateDock() {
    let dock = document.getElementById('native-call-dock');
    if (!busy() || !AppState.isReady() || modalVisible || document.getElementById('native-seat-workspace')) { dock?.remove(); return; }
    if (!dock) { dock = document.createElement('section'); dock.id = 'native-call-dock'; dock.className = 'native-call-dock'; document.body.append(dock); }
    dock.innerHTML = '<div><span>演示通话 · ' + statusText() + '</span><strong>' + esc(call.customerName) + '</strong><small>' + esc(call.callee) + '</small></div>' +
      '<span data-seat-timer>' + duration(call.durationSeconds || 0) + '</span><button class="btn btn-primary" onclick="AgentWorkbench.open()">' + (phase === 'wrap' ? '填写处理结果' : '返回通话') + '</button>' +
      (phase !== 'wrap' ? '<button class="btn seat-hangup" onclick="AgentWorkbench.end()">结束通话</button>' : '');
  }
  loadRecords();
  // Restore permanent "do not contact" decisions from saved native records.
  data.calls.filter(r => r.callSource === 'NATIVE_WORKBENCH' && r.agentDisposition === '客户拒绝联系')
    .forEach(r => data.nativeWorkbench.blockedNumbers.push({ tenantId: r.tenantId, phone: r.callee }));
  window.addEventListener('storage', e => { if (e.key === recordsKey) loadRecords(); });
  window.addEventListener('beforeunload', e => { if (busy()) { persist(); e.preventDefault(); e.returnValue = ''; } });
  setInterval(() => {
    if (phase !== 'connected' || !call) return;
    call.durationSeconds = Math.floor((Date.now() - call.answeredMs) / 1000);
    document.querySelectorAll('[data-seat-timer]').forEach(el => { el.textContent = duration(call.durationSeconds); }); persist();
  }, 1000);
  window.Pages=window.Pages||{};
  window.Pages['seat-workbench']={render:renderSeat,init(){updateDock();}};
  window.AgentWorkbench = { myAgent, hasSeat, homeView, tabs, open, openTemporary, render, renderSeat, updateDock, signIn, signOut, allowContextChange,
    openDialog,closeDialog,minimizeDialog,beforeRouteChange,
    selectAssigned(r){ensureScope();if(busy()){open();return showToast('请先完成当前通话及结果填写','warning');}returnFocus=document.activeElement;origin=window.RouteRuntime?.snapshot?.()||null;originScroll=document.getElementById('page-content')?.scrollTop||0;draft={...draft,customerDirectoryId:'',customerTaskItemId:r.id,externalDocumentId:r.externalDocumentId||'',customerName:r.name,phone:r.phone,note:r.note};error='';lastSavedId='';persist();modalMode=true;if(document.getElementById('native-seat-workspace'))refreshOrigin();openDialog();},
    updateField, chooseContact, dial, end, saveDisposition, toggleMute, setDisposition, setRemark, setDemoResult, records, bindingPanel, bindAccount };
  document.addEventListener('keydown',e=>{
    if(!modalVisible)return;
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeDialog();}
    if(e.key==='Tab'){
      const controls=Array.from(document.getElementById(modalId)?.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')||[]);
      const first=controls[0],last=controls.at(-1);
      if(!controls.includes(document.activeElement)){e.preventDefault();first?.focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  });
})();
