/** One tenant-scoped account/seat relationship and durable local operation journal. */
(function () {
  'use strict';
  const data = CloudCallData, ui = PlatformUI, esc = ui.escape, key = 'account-seat-v1';
  const active = new Set(), appliedSeats = new Map(), appliedSkills = new Map();
  let dialog = null, busy = false, lastError = '';
  const stamp = () => new Date().toLocaleString('sv-SE');
  const clone = value => JSON.parse(JSON.stringify(value));
  const stateKey = () => { const s = AppState.get(); return [s.sessionId, s.accountId, s.tenantId, s.instanceId, s.activeDomain].join('|'); };
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
    delete row.currentEndpoint; delete row.currentCall; delete row.agentStatus;
    return row;
  }
  function restore(value) {
    const saved = value || read();
    for (const row of saved.seats) {
      if (!row.contactCenterIdentityId || !row.tenantId || !row.instanceId) continue;
      const existing = data.agents.find(a => a.contactCenterIdentityId === row.contactCenterIdentityId);
      if (existing && (existing.tenantId !== row.tenantId || existing.instanceId !== row.instanceId)) continue;
      const serialized = JSON.stringify(row);
      if (existing && appliedSeats.get(row.contactCenterIdentityId) !== serialized) Object.assign(existing, clone(row));
      else if (!existing) data.agents.push({ ...clone(row), agentStatus: '离线', currentCall: false, currentEndpoint: '' });
      appliedSeats.set(row.contactCenterIdentityId, serialized);
      if (row.accountBindingManaged) data.accounts.filter(a => a.linkedIdentityId === row.contactCenterIdentityId).forEach(a => { delete a.linkedIdentityId; });
    }
    for (const entry of saved.skillAssignments || []) {
      const agent = data.agents.find(a => a.contactCenterIdentityId === entry.identityId && a.tenantId === entry.tenantId && a.instanceId === entry.instanceId);
      if (!agent || !Array.isArray(entry.relations)) continue;
      const serialized = JSON.stringify(entry);
      if (appliedSkills.get(entry.identityId) === serialized) continue;
      data.agentSkills = data.agentSkills.filter(r => r.identityId !== entry.identityId).concat(clone(entry.relations).filter(r => r.identityId === entry.identityId));
      appliedSkills.set(entry.identityId, serialized);
    }
    return saved;
  }
  function scopeError(tenantId, instanceId, accountId) {
    const access = AppState.effectiveAccess(), current = AppState.get();
    if (!access.valid || !['ADMIN', 'SUPER_ADMIN'].includes(access.roleCode) || current.activeDomain !== 'CLOUD_CONTACT_CENTER') return '只有有权限的租户管理员或超级管理员可维护坐席关联';
    const tenant = data.tenants.find(t => t.tenantId === tenantId);
    if (!tenant || tenant.builtIn || tenant.instanceId !== instanceId || current.instanceId !== instanceId || !AppState.authorizeObject('', tenant)) return '只能维护当前客户/品牌内获授权租户的坐席';
    if (tenant.status !== '启用' || !tenant.capabilitySet?.includes('CLOUD_CONTACT_CENTER')) return '租户未启用或尚未开通云联络中心';
    if (accountId) {
      const account = data.accounts.find(a => a.accountId === accountId);
      if (!account || account.builtIn || account.status !== '启用') return '请先启用有效的平台账号，内置超级管理员账号不作为业务坐席';
      if (!data.memberships.some(m => m.accountId === accountId && m.tenantId === tenantId && m.status === '启用' && ['ADMIN', 'OPERATOR'].includes(m.roleCode))) return '账号不属于该租户的启用成员';
    }
    return '';
  }
  function mayRead(tenantId, instanceId) {
    return AppState.effectiveAccess().valid && AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER' && AppState.authorizeObject('', { tenantId, instanceId });
  }
  function forAccount(accountId, tenantId, instanceId) {
    if (!mayRead(tenantId, instanceId)) return null;
    return data.agents.find(a => a.accountId === accountId && a.tenantId === tenantId && a.instanceId === instanceId && a.lifecycleStatus !== '已删除') || null;
  }
  function inUse(agent) { return !!(agent.currentCall || agent.currentEndpoint || !['离线', '未上线', '未登录'].includes(agent.agentStatus)); }
  function bindingAccounts(agent) {
    if (!agent || scopeError(agent.tenantId, agent.instanceId)) return [];
    return data.accounts.filter(account => !scopeError(agent.tenantId, agent.instanceId, account.accountId) && !data.agents.some(other => other.contactCenterIdentityId !== agent.contactCenterIdentityId && other.tenantId === agent.tenantId && other.instanceId === agent.instanceId && other.lifecycleStatus !== '已删除' && other.accountId === account.accountId));
  }
  function candidates(accountId, tenantId, instanceId) {
    if (scopeError(tenantId, instanceId, accountId) || forAccount(accountId, tenantId, instanceId)) return [];
    return data.agents.filter(a => a.tenantId === tenantId && a.instanceId === instanceId && a.lifecycleStatus !== '已删除' && !a.accountId && !inUse(a));
  }
  function attempts(accountId, tenantId, instanceId) {
    if (scopeError(tenantId, instanceId, accountId)) return [];
    try { return read().attempts.filter(r => r.accountId === accountId && r.tenantId === tenantId && r.instanceId === instanceId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
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
    if (index < 0) saved.attempts.unshift(row); else saved.attempts[index] = row;
  }
  function failure(message, request, saved) {
    const result = { ok: false, message, attemptId: request?.id || '', failureSaved: false };
    if (!request || scopeError(request.tenantId, request.instanceId, request.accountId)) return result;
    try {
      const value = saved || read();
      const previous = value.attempts.find(row => row.id === request.id);
      if (previous && (previous.tenantId !== request.tenantId || previous.instanceId !== request.instanceId || previous.accountId !== request.accountId)) return result;
      putAttempt(value, { ...previous, ...request, status: '失败', message, updatedAt: stamp(), retries: (previous?.retries || 0) + (previous && previous.status !== '开通中' ? 1 : 0) });
      write(value); result.failureSaved = true;
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
    const request = { id: options.requestId || crypto.randomUUID(), kind: '关联已有坐席', accountId: accountId || agent.accountId || '', tenantId: agent.tenantId, instanceId: agent.instanceId, identityId };
    const error = scopeError(agent.tenantId, agent.instanceId, accountId); if (error) return { ok: false, message: error };
    if (active.has(identityId)) return { ok: false, message: '正在保存关联，请勿重复点击' };
    active.add(identityId);
    try {
      const result = await locked(identityId, () => {
        if (context !== stateKey()) return { ok: false, message: '工作范围已变化，请重新打开关联页面' };
        const saved = restore();
        const target = data.agents.find(a => a.contactCenterIdentityId === identityId);
        const latestError = scopeError(target.tenantId, target.instanceId, accountId);
        if (latestError) return failure(latestError, request, saved);
        if (target.lifecycleStatus === '已删除') return failure('已删除坐席不可关联，请选择现有坐席或重新开通', request, saved);
        if (inUse(target)) return failure('请先结束通话、完成话后处理并下线，再调整关联', request, saved);
        if (target.accountId && target.accountId !== accountId && accountId && !options.replaceAccount) return failure('该坐席已关联其他账号，请重新选择未占用坐席', request, saved);
        if (accountId && data.agents.some(a => a !== target && a.tenantId === target.tenantId && a.instanceId === target.instanceId && a.lifecycleStatus !== '已删除' && a.accountId === accountId)) return failure('该账号在当前租户已关联坐席，不能重复关联', request, saved);
        const previousAccountId = target.accountId;
        const next = { ...target, accountId, accountBindingManaged: true };
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
    const tenant = data.tenants.find(t => t.tenantId === input.tenantId), accountId = options.accountId || '';
    const error = scopeError(input.tenantId, tenant?.instanceId, accountId); if (error) return { ok: false, message: error };
    const context = stateKey(), id = options.requestId || crypto.randomUUID();
    const request = { id, kind: accountId ? '新建并关联坐席' : '新建坐席', accountId, tenantId: tenant.tenantId, instanceId: tenant.instanceId, input: clone(input) };
    if (active.has(id)) return { ok: false, message: '正在开通，请勿重复点击' };
    active.add(id);
    try {
      const result = await locked('', () => {
        if (context !== stateKey()) return { ok: false, message: '工作范围已变化，请重新打开新增页面' };
        const saved = restore(), previous = saved.attempts.find(row => row.id === id);
        const latestError = scopeError(tenant.tenantId, tenant.instanceId, accountId);
        if (latestError) return failure(latestError, request, saved);
        if (previous && (previous.tenantId !== tenant.tenantId || previous.instanceId !== tenant.instanceId || previous.accountId !== accountId)) return { ok: false, message: '该操作记录不属于当前账号与租户，请重新打开新增页面', preserveAttempt: true };
        if (previous?.status === '成功') { const existing = data.agents.find(a => a.contactCenterIdentityId === previous.identityId && a.tenantId === tenant.tenantId && a.instanceId === tenant.instanceId); return existing && existing.lifecycleStatus !== '已删除' && existing.accountId === accountId ? { ok: true, agent: existing, message: '该次坐席已经创建，无需重复提交', attemptId: id } : { ok: false, message: '该次创建已完成，但坐席状态或关联已变化，请重新打开页面核对', preserveAttempt: true }; }
        if (accountId && forAccount(accountId, tenant.tenantId, tenant.instanceId)) return failure('该账号在当前租户已有坐席，不重复创建', request, saved);
        putAttempt(saved, { ...request, status: '开通中', message: '正在保存本地开通结果', updatedAt: stamp(), retries: (previous?.retries || 0) + (previous ? 1 : 0) });
        write(saved);
        const factory = window.Pages?.['agent-center']?.buildAgent;
        if (!factory) return failure('坐席创建页面尚未加载，请刷新后重试', request, saved);
        const built = factory(input, tenant);
        if (!built.ok) return failure(built.message, request, saved);
        const agent = { ...built.agent, accountId, accountBindingManaged: true };
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
  function persistAgent(agent, relations) {
    if (!agent || scopeError(agent.tenantId, agent.instanceId)) return false;
    try {
      const saved = read(); putSeat(saved, agent);
      if (relations) {
        saved.skillAssignments = (saved.skillAssignments || []).filter(r => r.identityId !== agent.contactCenterIdentityId);
        saved.skillAssignments.push({ identityId: agent.contactCenterIdentityId, tenantId: agent.tenantId, instanceId: agent.instanceId, relations: clone(relations) });
      }
      write(saved); restore(saved); return true;
    }
    catch (_) { showToast('坐席变更暂未保存，请保留当前页面重试', 'warning'); return false; }
  }
  function finishPendingDisable(agent, completedCall) {
    const current = AppState.get();
    // Finishing the already-owned call is allowed even if its membership was
    // disabled in the meantime. This path cannot create/rebind/enable a seat.
    if (!agent || !data.agents.includes(agent) || agent.lifecycleStatus !== '已停用' || agent.currentCall || agent.agentStatus !== '话后处理' || !completedCall?.endedAt || completedCall.contactCenterIdentityId !== agent.contactCenterIdentityId || completedCall.accountId !== agent.accountId || current.accountId !== completedCall.accountId || current.tenantId !== agent.tenantId || current.instanceId !== agent.instanceId || completedCall.tenantId !== agent.tenantId || completedCall.instanceId !== agent.instanceId) return false;
    try {
      const saved = read();
      putSeat(saved, { ...agent, lifecycleStatus: '已停用', acceptNewTasks: false, phonebarPermission: false });
      write(saved); restore(saved); return true;
    } catch (_) { showToast('坐席已停止接收新任务，但停用结果暂未保存，请联系管理员重新保存停用状态', 'warning'); return false; }
  }
  function status(accountId, tenantId, instanceId) {
    const agent = forAccount(accountId, tenantId, instanceId);
    if (agent) return { agent, label: agent.lifecycleStatus === '已启用' ? '已关联' : agent.lifecycleStatus };
    const latest = attempts(accountId, tenantId, instanceId)[0];
    const needsRetry = latest && ['失败', '开通中'].includes(latest.status);
    return { agent: null, label: latest?.status === '失败' ? '开通/关联失败' : latest?.status === '开通中' ? '待重新核对' : '未关联', attempt: needsRetry ? latest : null };
  }
  function configureSkills(identityId) {
    const agent = data.agents.find(a => a.contactCenterIdentityId === identityId);
    if (!agent || scopeError(agent.tenantId, agent.instanceId) || agent.lifecycleStatus !== '已启用') return showToast('当前坐席不可配置技能，请核对状态', 'warning');
    ui.closeLayer('account-seat'); window.Pages['agent-center'].openSkillAssign(identityId);
  }
  function open(accountId, tenantId, instanceId) {
    const error = scopeError(tenantId, instanceId, accountId); if (error) return showToast(error, 'warning');
    const account = data.accounts.find(a => a.accountId === accountId), previous = attempts(accountId, tenantId, instanceId).find(a => a.status === '失败' || a.status === '开通中');
    dialog = { accountId, tenantId, instanceId, context: stateKey(), mode: 'existing', requestId: crypto.randomUUID(), input: { tenantId, userName: account.name || account.nickname || '', mobile: account.loginMobile || '', loginName: account.loginUsername || '', email: account.email || '' }, previous };
    busy = false; lastError = ''; draw();
  }
  function historyMessage(message, row) {
    const failures = (row.history || []).filter(event => event.status === '失败');
    return esc(message) + (failures.length ? ' ' + ui.help(failures.map(event => event.at + '：' + event.message).join('；'), '历史失败原因') : '');
  }
  function draw() {
    if (!dialog) return;
    const account = data.accounts.find(a => a.accountId === dialog.accountId), tenant = data.tenants.find(t => t.tenantId === dialog.tenantId);
    const current = forAccount(dialog.accountId, dialog.tenantId, dialog.instanceId), available = candidates(dialog.accountId, dialog.tenantId, dialog.instanceId);
    const history = attempts(dialog.accountId, dialog.tenantId, dialog.instanceId).slice(0, 5);
    const form = current ? '<div class="account-seat-result"><strong>' + esc(current.userName) + ' · ' + esc(current.lifecycleStatus) + '</strong><p>当前账号已关联此坐席。配置技能和可用号码后，才可进入坐席工作台呼叫。</p><button class="btn btn-primary" onclick="AccountSeat.configureSkills(' + esc(JSON.stringify(current.contactCenterIdentityId)) + ')">配置技能</button></div>' :
      '<div class="account-seat-tabs" role="group" aria-label="开通方式"><button class="btn ' + (dialog.mode === 'existing' ? 'btn-primary' : '') + '" ' + (busy ? 'disabled' : '') + ' onclick="AccountSeat.setMode(\'existing\')">关联已有坐席</button><button class="btn ' + (dialog.mode === 'new' ? 'btn-primary' : '') + '" ' + (busy ? 'disabled' : '') + ' onclick="AccountSeat.setMode(\'new\')">新建并关联</button></div>' +
      (dialog.mode === 'existing' ? '<label class="field"><span>可关联坐席 ' + ui.help('仅显示当前租户、当前品牌内未关联账号且未在使用的坐席；停用坐席关联后仍不能呼叫。') + '</span><select id="account-seat-target" ' + (busy ? 'disabled' : '') + ' onchange="AccountSeat.setTarget(this.value)"><option value="">请选择坐席</option>' + available.map(a => '<option value="' + esc(a.contactCenterIdentityId) + '"' + (dialog.identityId === a.contactCenterIdentityId ? ' selected' : '') + '>' + esc(a.userName + ' · ' + a.lifecycleStatus) + '</option>').join('') + '</select></label>' + (!available.length ? '<p class="account-seat-muted">暂无可关联坐席，可选择“新建并关联”。</p>' : '') :
        '<div class="form-grid">' + [['userName', '坐席姓名', 'text', 40], ['mobile', '手机号', 'tel', 11], ['loginName', '坐席登录名', 'text', 40], ['email', '开通邮箱', 'email', 100]].map(([field, label, type, max]) => '<label class="field"><span><em>*</em>' + label + (field === 'loginName' ? ' ' + ui.help('坐席独立的登录标识，不会改动当前平台登录账号。名称在当前品牌内不能重复。') : '') + '</span><input id="account-seat-' + field + '" type="' + type + '" maxlength="' + max + '" value="' + esc(dialog.input[field] || '') + '" ' + (busy ? 'disabled' : '') + ' oninput="AccountSeat.update(\'' + field + '\',this.value)"></label>').join('') + '</div>');
    ui.openLayer('account-seat', '<div class="layer-header"><div><h2>坐席开通与关联</h2><p>' + esc(account?.name) + ' · ' + esc(tenant?.name) + '</p></div><button aria-label="关闭" ' + (busy ? 'disabled' : '') + ' onclick="PlatformUI.closeLayer(\'account-seat\')">×</button></div><div class="layer-body account-seat-body">' + form +
      (lastError ? '<div class="account-seat-error" role="alert">' + esc(lastError) + '</div>' : '') +
      (history.length ? '<details class="account-seat-history"' + (lastError ? ' open' : '') + '><summary>最近开通与关联记录</summary>' + ui.table([{ key: 'updatedAt', label: '时间' }, { key: 'kind', label: '操作' }, { key: 'status', label: '结果' }, { key: 'message', label: '说明', render: historyMessage }, { key: 'id', label: '操作', render: (value, row) => row.status === '失败' || row.status === '开通中' ? '<button class="btn-link" ' + (busy ? 'disabled' : '') + ' onclick="AccountSeat.retry(' + esc(JSON.stringify(value)) + ')">加载并重试</button>' : '—' }], history) + '</details>' : '') +
      '</div><div class="layer-footer"><span class="layer-footer-note">仅本地演示，不创建平台账号、不取得真实阿里开通回执。</span><button class="btn" ' + (busy ? 'disabled' : '') + ' onclick="PlatformUI.closeLayer(\'account-seat\')">关闭</button>' + (!current ? '<button class="btn btn-primary" ' + (busy ? 'disabled' : '') + ' onclick="AccountSeat.submit()">' + (busy ? '正在保存…' : dialog.mode === 'new' ? '新建并关联' : '确认关联') + '</button>' : '') + '</div>', 'wide');
  }
  async function submit() {
    if (!dialog || busy) return;
    if (dialog.context !== stateKey() || scopeError(dialog.tenantId, dialog.instanceId, dialog.accountId)) return showToast('工作范围或权限已变化，请重新打开', 'warning');
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
    const attempt = attempts(dialog.accountId, dialog.tenantId, dialog.instanceId).find(row => row.id === id && ['失败', '开通中'].includes(row.status));
    if (!attempt) return;
    dialog.mode = attempt.input ? 'new' : 'existing'; dialog.input = clone(attempt.input || dialog.input); dialog.identityId = attempt.identityId || ''; dialog.requestId = attempt.id;
    lastError = '已加载上次资料，请修改失败原因后点击确认重试。'; draw();
  }
  window.AccountSeat = { forAccount, scopeError, status, inUse, candidates, bindingAccounts, bind, create, persistAgent, finishPendingDisable, restore, attempts, open, configureSkills, submit, retry,
    update(field, value) { if (dialog && !busy && ['userName', 'mobile', 'loginName', 'email'].includes(field)) dialog.input[field] = value; },
    setTarget(id) { if (dialog && !busy) dialog.identityId = id; },
    setMode(mode) { if (dialog && !busy && ['existing', 'new'].includes(mode)) { if (dialog.mode !== mode) dialog.requestId = crypto.randomUUID(); dialog.mode = mode; lastError = ''; draw(); } } };
  try { restore(); } catch (_) { /* Never overwrite malformed older storage. */ }
  window.addEventListener('storage', event => {
    if (event.key !== key || event.newValue === null) return;
    try { restore(); } catch (_) { showToast('其他窗口的坐席记录无法读取，请先核对后再操作', 'warning'); }
  });
})();
