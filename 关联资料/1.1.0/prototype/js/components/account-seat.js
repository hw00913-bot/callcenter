/** One tenant-scoped account/seat relationship and durable local operation journal. */
(function () {
  'use strict';
  const data = CloudCallData, ui = PlatformUI, esc = ui.escape, key = 'account-seat-v1';
  const active = new Set(), appliedSeats = new Map(), appliedSkills = new Map(), configurationBaselines = new WeakMap();
  let dialog = null, busy = false, lastError = '';
  const stamp = () => new Date().toLocaleString('sv-SE');
  const clone = value => JSON.parse(JSON.stringify(value));
  const stateKey = () => { const s = AppState.get(); return [s.sessionId, s.accountId, s.tenantId, s.enterpriseId, s.activeDomain].join('|'); };
  function read() {
    const raw = localStorage.getItem(key);
    if (!raw) return { version: 1, seats: [], attempts: [] };
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !Array.isArray(value.seats) || !Array.isArray(value.attempts) || (value.skillAssignments !== undefined && (!Array.isArray(value.skillAssignments) || value.skillAssignments.some(r => !r || !Array.isArray(r.relations))))) throw Error('本地坐席记录格式异常，原数据未改动，请先核对');
    return value;
  }
  function write(value) { localStorage.setItem(key, JSON.stringify(value)); }
  function storedSeat(agent) {
    const row = clone(agent);
    // A synchronized supplier seat must not become offline merely because the page reloads.
    if (agent.supplierImportMode === 'query/get') row.lastKnownAgentStatus = agent.agentStatus || '待核对';
    delete row.currentEndpoint; delete row.currentCall; delete row.agentStatus;
    return row;
  }
  // Link local correction attempts to their originating record so refresh cannot revive a resolved failure.
  const recordEnterprise = row => row.enterpriseId || data.tenants.find(t => t.tenantId === row.tenantId)?.enterpriseId;
  function restoreConfigurationRecords(saved) {
    for (const row of data.syncRecords || []) {
      const attempts = saved.attempts.filter(a => a.configurationRecordId === row.syncId && a.tenantId === row.tenantId && a.enterpriseId === recordEnterprise(row) && !a.accountId);
      // A completed correction cannot be undone by an older form's failed submission.
      const latest = attempts.find(a => a.status === '成功') || attempts.find(a => a.status === '失败');
      if (!latest) continue;
      const issue = data.exceptions.find(e => e.objectId === row.objectId && e.tenantId === row.tenantId && e.enterpriseId === recordEnterprise(row));
      if (!configurationBaselines.has(row)) configurationBaselines.set(row, { retryCount: row.retryCount || 0, trace: clone(issue?.trace || []) });
      const baseline = configurationBaselines.get(row);
      const history = attempts.slice().reverse().flatMap(a => (a.history || []).filter(h => ['成功', '失败'].includes(h.status)).map(h => ({ at: h.at, action: '修改坐席资料后重新提交', result: h.message, operator: a.operator || '管理员' }))).sort((a,b) => a.at.localeCompare(b.at));
      Object.assign(row, { status: latest.status, latestResult: latest.message, retryCount: baseline.retryCount + history.length, updatedAt: latest.updatedAt, repairHistory: history, retryInput: clone(latest.input || {}) });
      if (latest.status === '成功') row.createdIdentityId = latest.identityId;
      if (issue) Object.assign(issue, { status: latest.status === '成功' ? '已处理' : '待处理', retryCount: row.retryCount, updatedAt: latest.updatedAt, trace: baseline.trace.concat(history) });
    }
  }
  function restore(value) {
    const saved = value || read();
    for (const row of saved.seats) {
      if (!row.contactCenterIdentityId || !row.tenantId || !row.enterpriseId) continue;
      const existing = data.agents.find(a => a.contactCenterIdentityId === row.contactCenterIdentityId);
      if (existing && (existing.tenantId !== row.tenantId || existing.enterpriseId !== row.enterpriseId)) continue;
      const serialized = JSON.stringify(row);
      if (existing && appliedSeats.get(row.contactCenterIdentityId) !== serialized) Object.assign(existing, clone(row));
      else if (!existing) data.agents.push({ ...clone(row), agentStatus: row.supplierImportMode === 'query/get' ? (row.lastKnownAgentStatus || '待核对') : '离线', currentCall: false, currentEndpoint: '' });
      appliedSeats.set(row.contactCenterIdentityId, serialized);
      if (row.accountBindingManaged) data.accounts.filter(a => a.linkedIdentityId === row.contactCenterIdentityId).forEach(a => { delete a.linkedIdentityId; });
    }
    for (const entry of saved.skillAssignments || []) {
      const agent = data.agents.find(a => a.contactCenterIdentityId === entry.identityId && a.tenantId === entry.tenantId && a.enterpriseId === entry.enterpriseId);
      if (!agent || !Array.isArray(entry.relations)) continue;
      const serialized = JSON.stringify(entry);
      if (appliedSkills.get(entry.identityId) === serialized) continue;
      data.agentSkills = data.agentSkills.filter(r => r.identityId !== entry.identityId).concat(clone(entry.relations).filter(r => r.identityId === entry.identityId && data.physicalSkillGroups.some(g => g.physicalGroupId === r.physicalGroupId && g.tenantId === agent.tenantId && g.enterpriseId === agent.enterpriseId)).map(r=>AliCtiFields.validSkillLevel(r.skillLevel)?r:{...r,status:'待调整',syncStatus:'等级超出1–10'}));
      appliedSkills.set(entry.identityId, serialized);
    }
    restoreConfigurationRecords(saved);
    return saved;
  }
  function scopeError(tenantId, enterpriseId, accountId) {
    const access = AppState.effectiveAccess(), current = AppState.get();
    if (!access.valid || !['ADMIN', 'SUPER_ADMIN'].includes(access.roleCode) || current.activeDomain !== 'CLOUD_CONTACT_CENTER') return '只有有权限的租户管理员或超级管理员可维护坐席关联';
    const tenant = data.tenants.find(t => t.tenantId === tenantId);
    if (!tenant || tenant.builtIn || tenant.enterpriseId !== enterpriseId || current.enterpriseId !== enterpriseId || !AppState.authorizeObject('', tenant)) return '只能维护当前客户/品牌内获授权租户的坐席';
    if (tenant.status !== '启用' || !tenant.capabilitySet?.includes('CLOUD_CONTACT_CENTER')) return '租户未启用或尚未开通云联络中心';
    if (accountId) {
      const account = data.accounts.find(a => a.accountId === accountId);
      if (!account || account.builtIn || account.status !== '启用') return '请先启用有效的平台账号，内置超级管理员账号不作为业务坐席';
      if (!data.memberships.some(m => m.accountId === accountId && m.tenantId === tenantId && m.status === '启用' && ['ADMIN', 'OPERATOR'].includes(m.roleCode))) return '账号不属于该租户的启用成员';
    }
    return '';
  }
  function mayRead(tenantId, enterpriseId) {
    return AppState.effectiveAccess().valid && AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER' && AppState.authorizeObject('', { tenantId, enterpriseId });
  }
  function forAccount(accountId, tenantId, enterpriseId) {
    if (!mayRead(tenantId, enterpriseId)) return null;
    return data.agents.find(a => a.accountId === accountId && a.tenantId === tenantId && a.enterpriseId === enterpriseId && a.lifecycleStatus !== '已删除') || null;
  }
  function inUse(agent) { return !!(agent.currentCall || agent.currentEndpoint || !['离线', '未上线', '未登录'].includes(agent.agentStatus)); }
  function bindingAccounts(agent) {
    if (!agent || scopeError(agent.tenantId, agent.enterpriseId)) return [];
    return data.accounts.filter(account => !scopeError(agent.tenantId, agent.enterpriseId, account.accountId) && !data.agents.some(other => other.contactCenterIdentityId !== agent.contactCenterIdentityId && other.tenantId === agent.tenantId && other.enterpriseId === agent.enterpriseId && other.lifecycleStatus !== '已删除' && other.accountId === account.accountId));
  }
  function candidates(accountId, tenantId, enterpriseId) {
    if (scopeError(tenantId, enterpriseId, accountId) || forAccount(accountId, tenantId, enterpriseId)) return [];
    return data.agents.filter(a => a.tenantId === tenantId && a.enterpriseId === enterpriseId && a.lifecycleStatus !== '已删除' && !a.accountId && !inUse(a));
  }
  function attempts(accountId, tenantId, enterpriseId) {
    if (scopeError(tenantId, enterpriseId, accountId)) return [];
    try { return read().attempts.filter(r => r.accountId === accountId && r.tenantId === tenantId && r.enterpriseId === enterpriseId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
    catch (_) { return []; }
  }
  function putSeat(saved, agent) {
    const index = saved.seats.findIndex(a => a.contactCenterIdentityId === agent.contactCenterIdentityId);
    const row = storedSeat(agent);
    if (index < 0) saved.seats.push(row); else saved.seats[index] = row;
  }
  function putAttempt(saved, attempt) {
    const index = saved.attempts.findIndex(a => a.id === attempt.id);
    const previous = index < 0 ? null : saved.attempts[index];
    const row = { ...attempt, history: [...(previous?.history || []), { status: attempt.status, message: attempt.message, at: attempt.updatedAt }] };
    if (index >= 0) saved.attempts.splice(index, 1);
    saved.attempts.unshift(row);
  }
  function failure(message, request, saved) {
    const result = { ok: false, message, attemptId: request?.id || '', failureSaved: false };
    if (!request || scopeError(request.tenantId, request.enterpriseId, request.accountId)) return result;
    try {
      const value = saved || read();
      const previous = value.attempts.find(row => row.id === request.id);
      if (previous && (previous.tenantId !== request.tenantId || previous.enterpriseId !== request.enterpriseId || previous.accountId !== request.accountId)) return result;
      putAttempt(value, { ...previous, ...request, status: '失败', message, updatedAt: stamp(), retries: (previous?.retries || 0) + (previous && previous.status !== '开通中' ? 1 : 0) });
      write(value); restoreConfigurationRecords(value); result.failureSaved = true;
    } catch (_) { result.message += '；失败详情暂未保存，请保留当前页面重试（原账号和坐席未改动）'; }
    return result;
  }
  async function locked(identityId, action) {
    if (!navigator.locks?.request) return { ok: false, message: '当前浏览器无法校验坐席使用状态，请通过本地预览地址在 Chrome 中操作' };
    return navigator.locks.request('account-seat-maintenance-v1', { ifAvailable: true }, async globalLock => {
      if (!globalLock) return { ok: false, message: '另一项坐席操作正在保存，请稍后重试' };
      if (!identityId) return action();
      return navigator.locks.request('unified-call-seat:' + identityId, { ifAvailable: true }, seatLock => seatLock ? action() : { ok: false, message: '坐席正在其他窗口使用，请先下线再调整关联' });
    });
  }
  async function bind(identityId, accountId, options = {}) {
    const context = stateKey(), agent = data.agents.find(a => a.contactCenterIdentityId === identityId);
    if (!agent) return { ok: false, message: '未找到坐席，请刷新列表' };
    const request = { id: options.requestId || crypto.randomUUID(), kind: '关联已有坐席', accountId: accountId || agent.accountId || '', tenantId: agent.tenantId, enterpriseId: agent.enterpriseId, identityId };
    const error = scopeError(agent.tenantId, agent.enterpriseId, accountId); if (error) return { ok: false, message: error };
    if (active.has(identityId)) return { ok: false, message: '正在保存关联，请勿重复点击' };
    active.add(identityId);
    try {
      const result = await locked(identityId, () => {
        if (context !== stateKey()) return { ok: false, message: '工作范围已变化，请重新打开关联页面' };
        const saved = restore();
        const target = data.agents.find(a => a.contactCenterIdentityId === identityId);
        const latestError = scopeError(target.tenantId, target.enterpriseId, accountId);
        if (latestError) return failure(latestError, request, saved);
        if (target.lifecycleStatus === '已删除') return failure('已删除坐席不可关联，请选择现有坐席或重新开通', request, saved);
        if (inUse(target)) return failure('请先结束通话、完成话后处理并下线，再调整关联', request, saved);
        if (target.accountId && target.accountId !== accountId && accountId && !options.replaceAccount) return failure('该坐席已关联其他账号，请重新选择未占用坐席', request, saved);
        if (accountId && data.agents.some(a => a !== target && a.tenantId === target.tenantId && a.enterpriseId === target.enterpriseId && a.lifecycleStatus !== '已删除' && a.accountId === accountId)) return failure('该账号在当前租户已关联坐席，不能重复关联', request, saved);
        const previousAccountId = target.accountId;
        const next = { ...target, accountId, accountBindingManaged: true };
        // The desired supplier permission follows the new local binding; this draft is not an authorization receipt.
        next.alictiPowerDraft = { endpoint: 'agent/update', fields: { cno: next.cno, power: AliCtiFields.seatFields(next).power }, mock: true, confirmed: false };
        putSeat(saved, next); putAttempt(saved, { ...request, status: '成功', message: accountId ? '关联已保存（本地演示）' : '关联已解除（本地演示）', updatedAt: stamp() });
        write(saved); restore(saved);
        CloudCallRuntime.addAudit('关联工作台使用账号', identityId, next.tenantId, previousAccountId || '未关联', accountId || '未关联');
        return { ok: true, agent: data.agents.find(a => a.contactCenterIdentityId === identityId), message: '坐席关联已保存（本地演示）', attemptId: request.id };
      });
      return result.ok || result.failureSaved ? result : failure(result.message, request);
    } catch (error) { return failure(error.message || '关联保存失败，请重试', request); }
    finally { active.delete(identityId); }
  }
  async function create(input, options = {}) {
    if (input.softphoneExtension != null && input.softphoneExtension !== '') return { ok: false, message: '请先创建坐席，再从本租户的分机中选择' };
    const tenant = data.tenants.find(t => t.tenantId === input.tenantId), accountId = options.accountId || '';
    const error = scopeError(input.tenantId, tenant?.enterpriseId, accountId); if (error) return { ok: false, message: error };
    const context = stateKey(), id = options.requestId || crypto.randomUUID();
    const request = { id, kind: accountId ? '新建并关联坐席' : '新建坐席', accountId, tenantId: tenant.tenantId, enterpriseId: tenant.enterpriseId, input: clone(input) };
    if (options.configurationRecordId) {
      const source = data.syncRecords.find(r => r.syncId === options.configurationRecordId && r.tenantId === tenant.tenantId && recordEnterprise(r) === tenant.enterpriseId);
      if (accountId || !source || source.objectType !== '云呼叫坐席创建' || source.status !== '失败' || /超时|未知|未确认/.test(source.latestResult || source.failureReason || '')) return { ok: false, message: '这条记录不能重新新增坐席，请先查看记录' };
      request.configurationRecordId = source.syncId; request.operator = AppState.account().name;
    }
    if (active.has(id)) return { ok: false, message: '正在开通，请勿重复点击' };
    active.add(id);
    try {
      const result = await locked('', () => {
        if (context !== stateKey()) return { ok: false, message: '工作范围已变化，请重新打开新增页面' };
        const saved = restore(), previous = saved.attempts.find(row => row.id === id);
        if (request.configurationRecordId && data.syncRecords.find(r => r.syncId === request.configurationRecordId)?.status !== '失败') return { ok: false, message: '这条配置记录已处理，请关闭后查看最新记录', preserveAttempt: true };
        const latestError = scopeError(tenant.tenantId, tenant.enterpriseId, accountId);
        if (latestError) return failure(latestError, request, saved);
        if (previous && (previous.tenantId !== tenant.tenantId || previous.enterpriseId !== tenant.enterpriseId || previous.accountId !== accountId)) return { ok: false, message: '该操作记录不属于当前账号与租户，请重新打开新增页面', preserveAttempt: true };
        if (previous?.status === '成功') { const existing = data.agents.find(a => a.contactCenterIdentityId === previous.identityId && a.tenantId === tenant.tenantId && a.enterpriseId === tenant.enterpriseId); return existing && existing.lifecycleStatus !== '已删除' && existing.accountId === accountId ? { ok: true, agent: existing, message: '该次坐席已经创建，无需重复提交', attemptId: id } : { ok: false, message: '该次创建已完成，但坐席状态或关联已变化，请重新打开页面核对', preserveAttempt: true }; }
        if (accountId && forAccount(accountId, tenant.tenantId, tenant.enterpriseId)) return failure('该账号在当前租户已有坐席，不重复创建', request, saved);
        putAttempt(saved, { ...request, status: '开通中', message: '正在保存本地开通结果', updatedAt: stamp(), retries: (previous?.retries || 0) + (previous ? 1 : 0) });
        write(saved);
        const factory = window.Pages?.['agent-center']?.buildAgent;
        if (!factory) return failure('坐席创建页面尚未加载，请刷新后重试', request, saved);
        const built = factory(input, tenant);
        if (!built.ok) return failure(built.message, request, saved);
        const agent = { ...built.agent, accountId, accountBindingManaged: true };
        agent.supplierAgentSnapshot = newSupplierSnapshot(agent);
        agent.demoProviderAgentId = agent.supplierAgentSnapshot.id;
        agent.simulation = true;
        agent.alictiCreateDraft = { endpoint:'agent/create', fields:AliCtiFields.seatFields(agent), mock:true };
        putSeat(saved, agent); putAttempt(saved, { ...request, identityId: agent.contactCenterIdentityId, status: '成功', message: '坐席已创建' + (accountId ? '并关联' : '') + '（本地演示）', updatedAt: stamp(), retries: (previous?.retries || 0) + (previous ? 1 : 0) });
        write(saved); restore(saved);
        CloudResourceRules.recount(); CloudResourceRules.changed(tenant.tenantId);
        CloudCallRuntime.addAudit('新增云呼叫坐席', agent.contactCenterIdentityId, tenant.tenantId, '无', '已创建（本地演示）');
        return { ok: true, agent: data.agents.find(a => a.contactCenterIdentityId === agent.contactCenterIdentityId), message: '坐席已创建' + (accountId ? '并关联' : '') + '，请继续配置技能（本地演示）', attemptId: id };
      });
      return result.ok || result.failureSaved || result.preserveAttempt ? result : failure(result.message, request);
    } catch (error) { return failure(error.message || '开通保存失败，请重试', request); }
    finally { active.delete(id); }
  }
  function newSupplierSnapshot(agent) {
    // D-050: every creation is a new supplier record, even when cno has been used before.
    // The old local identities remain as historical tombstones, never as create results.
    const used = new Set(data.agents.flatMap(row => [row.providerAgentId, row.demoProviderAgentId, row.supplierAgentSnapshot?.id]).filter(value => value != null).map(String));
    let candidate = agent, id = AliCtiDemo.resourceId('agent', candidate);
    while (used.has(String(id))) {
      candidate = { ...agent, contactCenterIdentityId: crypto.randomUUID() };
      id = AliCtiDemo.resourceId('agent', candidate);
    }
    const previous = data.agents.filter(row => row.enterpriseId === agent.enterpriseId && row.cno === agent.cno).map(row => Date.parse(row.supplierAgentSnapshot?.createTime || '')).filter(Number.isFinite);
    const createTime = new Date(Math.max(Date.now(), ...previous.map(time => time + 1))).toISOString();
    return { ...AliCtiFields.seatFields(agent), id, enterpriseId: Number(agent.enterpriseId), createTime, status: 0 };
  }
  function persistAgent(agent, relations) {
    if (!agent || scopeError(agent.tenantId, agent.enterpriseId)) return false;
    try {
      const saved = read(); putSeat(saved, agent);
      if (relations) {
        saved.skillAssignments = (saved.skillAssignments || []).filter(r => r.identityId !== agent.contactCenterIdentityId);
        saved.skillAssignments.push({ identityId: agent.contactCenterIdentityId, tenantId: agent.tenantId, enterpriseId: agent.enterpriseId, relations: clone(relations) });
      }
      write(saved); restore(saved); return true;
    }
    catch (_) { showToast('坐席变更暂未保存，请保留当前页面重试', 'warning'); return false; }
  }
  function finishPendingDisable(agent, completedCall) {
    const current = AppState.get();
    // Finishing the already-owned call is allowed even if its membership was
    // disabled in the meantime. This path cannot create/rebind/enable a seat.
    if (!agent || !data.agents.includes(agent) || agent.lifecycleStatus !== '已停用' || agent.currentCall || agent.agentStatus !== '话后处理' || !completedCall?.endedAt || completedCall.contactCenterIdentityId !== agent.contactCenterIdentityId || completedCall.accountId !== agent.accountId || current.accountId !== completedCall.accountId || current.tenantId !== agent.tenantId || current.enterpriseId !== agent.enterpriseId || completedCall.tenantId !== agent.tenantId || completedCall.enterpriseId !== agent.enterpriseId) return false;
    try {
      const saved = read();
      putSeat(saved, { ...agent, lifecycleStatus: '已停用', acceptNewTasks: false, callEnabled: false });
      write(saved); restore(saved); return true;
    } catch (_) { showToast('坐席已停止接收新任务，但停用结果暂未保存，请联系管理员重新保存停用状态', 'warning'); return false; }
  }
  function status(accountId, tenantId, enterpriseId) {
    const agent = forAccount(accountId, tenantId, enterpriseId);
    if (agent) return { agent, label: agent.lifecycleStatus === '已启用' ? '已关联' : agent.lifecycleStatus };
    const latest = attempts(accountId, tenantId, enterpriseId)[0];
    const needsRetry = latest && ['失败', '开通中'].includes(latest.status);
    return { agent: null, label: latest?.status === '失败' ? '开通/关联失败' : latest?.status === '开通中' ? '待重新核对' : '未关联', attempt: needsRetry ? latest : null };
  }
  function configureSkills(identityId) {
    const agent = data.agents.find(a => a.contactCenterIdentityId === identityId);
    if (!agent || scopeError(agent.tenantId, agent.enterpriseId) || agent.lifecycleStatus !== '已启用') return showToast('当前坐席不可配置技能，请核对状态', 'warning');
    window.Pages['agent-center'].openSkillAssign(identityId);
  }
  function open(accountId, tenantId, enterpriseId) {
    const error = scopeError(tenantId, enterpriseId, accountId); if (error) return showToast(error, 'warning');
    const account = data.accounts.find(a => a.accountId === accountId), previous = attempts(accountId, tenantId, enterpriseId).find(a => a.status === '失败' || a.status === '开通中');
    dialog = { accountId, tenantId, enterpriseId, context: stateKey(), mode: 'existing', requestId: crypto.randomUUID(), input: { tenantId, userName: account.name || account.nickname || '', cno: '', areaCode: '' }, previous };
    busy = false; lastError = ''; draw();
  }
  function historyMessage(message, row) {
    const failures = (row.history || []).filter(event => event.status === '失败');
    return esc(message) + (failures.length ? ' ' + ui.help(failures.map(event => event.at + '：' + event.message).join('；'), '历史失败原因') : '');
  }
  function draw() {
    if (!dialog) return;
    const account = data.accounts.find(a => a.accountId === dialog.accountId), tenant = data.tenants.find(t => t.tenantId === dialog.tenantId);
    const current = forAccount(dialog.accountId, dialog.tenantId, dialog.enterpriseId), available = candidates(dialog.accountId, dialog.tenantId, dialog.enterpriseId);
    const records = attempts(dialog.accountId, dialog.tenantId, dialog.enterpriseId);
    const history = (ui.sortByUpdated?.(records) || records).slice(0, 5);
    const form = current ? '<div class="account-seat-result"><strong>' + esc(current.userName) + ' · ' + esc(current.lifecycleStatus) + '</strong><p>当前账号已关联此坐席。请在坐席维护选择本租户的软电话分机，并配置技能后再上线。</p><button class="btn btn-primary" onclick="AccountSeat.configureSkills(' + esc(JSON.stringify(current.contactCenterIdentityId)) + ')">配置技能</button></div>' :
      '<div class="account-seat-tabs" role="group" aria-label="开通方式"><button class="btn ' + (dialog.mode === 'existing' ? 'btn-primary' : '') + '" ' + (busy ? 'disabled' : '') + ' onclick="AccountSeat.setMode(\'existing\')">关联已有坐席</button><button class="btn ' + (dialog.mode === 'new' ? 'btn-primary' : '') + '" ' + (busy ? 'disabled' : '') + ' onclick="AccountSeat.setMode(\'new\')">新建并关联</button></div>' +
      (dialog.mode === 'existing' ? '<label class="field"><span>可关联坐席 ' + ui.help('仅显示当前租户、当前品牌内未关联账号且未在使用的坐席；停用坐席关联后仍不能呼叫。') + '</span><select id="account-seat-target" ' + (busy ? 'disabled' : '') + ' onchange="AccountSeat.setTarget(this.value)"><option value="">请选择坐席</option>' + available.map(a => '<option value="' + esc(a.contactCenterIdentityId) + '"' + (dialog.identityId === a.contactCenterIdentityId ? ' selected' : '') + '>' + esc(a.userName + ' · ' + a.lifecycleStatus) + '</option>').join('') + '</select></label>' + (!available.length ? '<p class="account-seat-muted">暂无可关联坐席，可选择“新建并关联”。</p>' : '') :
        '<div class="form-grid">' + [['userName', '坐席姓名', 'text', 40], ['cno', '坐席工号（cno）', 'text', 10], ['areaCode', '区号（areaCode）', 'text', 8]].map(([field, label, type, max]) => '<label class="field"><span>' + '<em>*</em>' + label + (field === 'cno' ? ' ' + ui.help('3–10位数字，保留开头的0；0012与012是不同工号。当前供应商账号下唯一。') : '') + '</span><input id="account-seat-' + field + '" type="' + type + '"' + (max ? ' maxlength="' + max + '"' : ' inputmode="numeric"') + ' value="' + esc(dialog.input[field] || '') + '" ' + (busy ? 'disabled' : '') + ' oninput="AccountSeat.update(\'' + field + '\',this.value)"></label>').join('') + '</div>');
    ui.openLayer('account-seat', '<div class="layer-header"><div><h2>坐席开通与关联</h2><p>' + esc(account?.name) + ' · ' + esc(tenant?.name) + '</p></div><button aria-label="关闭" ' + (busy ? 'disabled' : '') + ' onclick="PlatformUI.closeLayer(\'account-seat\')">×</button></div><div class="layer-body account-seat-body">' + form +
      (lastError ? '<div class="account-seat-error" role="alert">' + esc(lastError) + '</div>' : '') +
      (history.length ? '<details class="account-seat-history"' + (lastError ? ' open' : '') + '><summary>最近开通与关联记录</summary>' + ui.table([{ key: 'updatedAt', label: '时间' }, { key: 'kind', label: '操作' }, { key: 'status', label: '结果' }, { key: 'message', label: '说明', render: historyMessage }, { key: 'id', label: '操作', render: (value, row) => row.status === '失败' || row.status === '开通中' ? '<button class="btn-link" ' + (busy ? 'disabled' : '') + ' onclick="AccountSeat.retry(' + esc(JSON.stringify(value)) + ')">加载并重试</button>' : '—' }], history) + '</details>' : '') +
      '</div><div class="layer-footer"><button class="btn" ' + (busy ? 'disabled' : '') + ' onclick="PlatformUI.closeLayer(\'account-seat\')">关闭</button>' + (!current ? '<button class="btn btn-primary" ' + (busy ? 'disabled' : '') + ' onclick="AccountSeat.submit()">' + (busy ? '正在保存…' : dialog.mode === 'new' ? '新建并关联' : '确认关联') + '</button>' : '') + '</div>', 'wide');
  }
  async function submit() {
    if (!dialog || busy) return;
    if (dialog.context !== stateKey() || scopeError(dialog.tenantId, dialog.enterpriseId, dialog.accountId)) return showToast('工作范围或权限已变化，请重新打开', 'warning');
    if (dialog.mode === 'existing' && !dialog.identityId) { lastError = '请选择要关联的坐席'; draw(); return; }
    const request = dialog; busy = true; lastError = ''; draw();
    const result = request.mode === 'new' ? await create(request.input, { accountId: request.accountId, requestId: request.requestId }) : await bind(request.identityId, request.accountId, { requestId: request.requestId });
    if (dialog !== request || request.context !== stateKey()) return;
    busy = false; lastError = result.ok ? '' : result.message;
    if (result.ok) { request.requestId = crypto.randomUUID(); showToast(result.message, 'success'); window.Pages['account-tenant']?.refreshAccounts(); }
    draw();
  }
  function retry(id) {
    if (!dialog || busy) return;
    const attempt = attempts(dialog.accountId, dialog.tenantId, dialog.enterpriseId).find(row => row.id === id && ['失败', '开通中'].includes(row.status));
    if (!attempt) return;
    dialog.mode = attempt.input ? 'new' : 'existing'; dialog.input = clone(attempt.input || dialog.input); delete dialog.input.softphoneExtension; dialog.identityId = attempt.identityId || ''; dialog.requestId = attempt.id;
    lastError = '已加载上次资料，请修改失败原因后点击确认重试。'; draw();
  }
  window.AccountSeat = { forAccount, scopeError, status, inUse, candidates, bindingAccounts, bind, create, newSupplierSnapshot, persistAgent, finishPendingDisable, restore, attempts, open, configureSkills, submit, retry,
    update(field, value) { if (dialog && !busy && ['userName', 'cno', 'areaCode'].includes(field)) dialog.input[field] = value; },
    setTarget(id) { if (dialog && !busy) dialog.identityId = id; },
    setMode(mode) { if (dialog && !busy && ['existing', 'new'].includes(mode)) { if (dialog.mode !== mode) dialog.requestId = crypto.randomUUID(); dialog.mode = mode; lastError = ''; draw(); } } };
  try { restore(); } catch (_) { /* Never overwrite malformed older storage. */ }
  window.addEventListener('storage', event => {
    if (event.key !== key || event.newValue === null) return;
    try { restore(); } catch (_) { showToast('其他窗口的坐席记录无法读取，请先核对后再操作', 'warning'); }
  });
})();
