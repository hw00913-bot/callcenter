/** Supplier-shaped seat operations over an independent LOCAL mock, never a real SDK. */
(function () {
  'use strict';
  const root = window, data = root.CloudCallData, fixture = root.AliCtiSeatOperationFixtures;
  if (!data || !fixture) return;
  const storageKey = 'alicti-seat-operation-profiles-v1';
  const clone = value => structuredClone(value), object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const profileFields = ['loginStatus', 'pauseDescription', 'workingMode'];
  // Official workingMode semantics (API-304 login / changeWorkingMode): 0 both, 4 preview-only, 5 predictive-only.
  // Single values only: the login doc's comma form is not exposed as a product choice.
  const modeLabels = { '0': '预览与预测同时', '4': '预览外呼', '5': '预测外呼' };
  const validMode = value => typeof value === 'string' && ['0', '4', '5'].includes(value);
  const phases = new Set(['offered', 'answering', 'dialing', 'ringing', 'connected']);
  const int = value => (typeof value === 'number' || typeof value === 'string') && /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
  const scenarios = {}, trace = [], server = new Map();
  let operation = null, generation = 0, uncertain = '', uncertainOwner = '', uncertainOrigin = '', lastRequest = null, lastResponse = null, message = '', revisionSeen = 0, rawSeen = null;
  let monitorSnapshot = null, managementPending = null, managementMessage = '';
  let connection = null, connectionSession = null, connectionContext = '', connectionRevision = 0;
  const connectionEvents = [];
  const identity = agent => JSON.stringify([agent.enterpriseId, agent.tenantId, agent.cno]);
  const ownerKey = agent => JSON.stringify([state().accountId, agent.enterpriseId, agent.tenantId, agent.cno]);
  const state = () => root.AppState?.get?.() || {};
  const adapter = () => root.AliCtiAdapter || {};
  const contextKey = () => { const s = state(), a = root.AppState?.effectiveAccess?.() || {}; return JSON.stringify([s.accountId, s.sessionId, s.activeDomain, s.enterpriseId, s.tenantId, a.roleCode, a.valid]); };
  const current = () => adapter().session ? clone(adapter().session) : null;
  const work = () => root.AgentWorkbench?.current?.() || root.AgentWorkbench?.receivingContext?.() || { busy: false, phase: 'idle' };
  function own(agent) {
    const app = root.AppState, s = state(), access = app?.effectiveAccess?.() || {};
    const found = agent && data.agents.find(a => a.contactCenterIdentityId === agent.contactCenterIdentityId);
    const account = app?.account?.() || {};
    return found && typeof found.cno === 'string' && found.cno && found.cno === agent.cno && found.enterpriseId === agent.enterpriseId && found.tenantId === agent.tenantId &&
      s.accountId && s.sessionId && app?.isReady?.() && access.valid && s.activeDomain === 'CLOUD_CONTACT_CENTER' && app?.hasCapability?.('CLOUD_CONTACT_CENTER') &&
      found.enterpriseId === s.enterpriseId && found.tenantId === s.tenantId && found.lifecycleStatus === '已启用' && found.syncStatus === '同步成功' && found.callEnabled !== false && found.acceptNewTasks !== false &&
      (found.accountId === s.accountId || (!found.accountId && found.contactCenterIdentityId === account.linkedIdentityId)) ? found : null;
  }
  function myAgent() { return data.agents.find(a => own(a)); }
  // Connection state is local UI protection. It is separate from seat presence and call state.
  function resetConnection() {
    connectionSession = adapter().session; connectionContext = contextKey();
    connection = { signaling: 'connected', media: 'ready', needsLogin: false, source: 'LOCAL_MOCK.login' };
  }
  function connectionStatus() {
    const active = connectionSession && adapter().session === connectionSession && connectionContext === contextKey();
    const value = active && connection ? clone(connection) : { signaling: 'connected', media: 'ready', needsLogin: false };
    const blocked = value.signaling !== 'connected' || value.media !== 'ready' || value.needsLogin;
    const text = value.needsLogin ? '软电话已断开，请重新登录电话。' : value.signaling === 'reconnecting' ? '电话连接中断，正在自动重连。' : blocked ? '电话连接已恢复，音频状态仍待核对。' : '';
    return { ...value, blocked, message: text, canRelogin: !!(active && blocked && !operation && !uncertain && !managementState().pending && !work().busy) };
  }
  // Capture the subscription's session because sipDisconnected has no callback arguments.
  // No local retry loop or retry count: the SDK owns its documented maximum of 20 retries.
  function connectionCallbacks() {
    const capturedSession = adapter().session, capturedContext = contextKey(), agent = myAgent();
    const valid = () => capturedSession && capturedSession === adapter().session && capturedContext === contextKey() && sessionFor(agent);
    const apply = event => {
      if (!valid()) return fail('已忽略旧电话会话的连接事件');
      if (connectionSession !== capturedSession || connectionContext !== capturedContext) resetConnection();
      const before = { signaling: connection.signaling, media: connection.media };
      if (event.name === 'breakLine') {
        connection.signaling = event.code === 0 ? 'connected' : 'reconnecting';
        connection.media = connection.media === 'disconnected' ? 'disconnected' : 'unknown';
      } else { connection.media = 'disconnected'; connection.needsLogin = true; }
      connection.source = event.name; connectionRevision++;
      connectionEvents.push({ event: clone(event), mock: true });
      const log = root.SeatEventLog;
      if (event.name === 'breakLine' && event.code === -1 && before.signaling !== 'reconnecting')
        log?.record(agent, 'signalLost', { source: 'connection', fromState: '信令正常', toState: '信令中断', detail: 'SDK 正在自动重连；不代表坐席已下线' });
      else if (event.name === 'breakLine' && event.code === 0 && before.signaling === 'reconnecting')
        log?.record(agent, 'signalRestored', { source: 'connection', fromState: '信令中断', toState: '信令已恢复', detail: '音频和原通话仍须核对' });
      else if (event.name === 'sipDisconnected' && before.media !== 'disconnected')
        log?.record(agent, 'softphoneLost', { source: 'connection', fromState: '软电话已连接', toState: '软电话断开', detail: '需重新登录电话' });
      monitorSnapshot = null;
      root.AgentWorkbench?.refreshTelephone?.();
      return { ok: true, connection: connectionStatus() };
    };
    return {
      breakLine(event) {
        if (!object(event) || event.type !== 'event' || event.name !== 'breakLine' || !Number.isSafeInteger(event.enterpriseId) ||
            typeof event.cno !== 'string' || event.enterpriseId !== Number(capturedSession?.enterpriseId) || event.cno !== capturedSession?.cno || ![-1, 0].includes(event.code)) return fail('连接事件与当前电话会话不一致');
        return apply(event);
      },
      sipDisconnected() { return apply({ name: 'sipDisconnected' }); }
    };
  }
  function demoConnection(name) {
    const agent = myAgent();
    if (!agent || !sessionFor(agent)) return fail('请先在坐席工作台登录');
    const callbacks = connectionCallbacks();
    if (name === 'sipDisconnected') return callbacks.sipDisconnected();
    if (!['breakLine', 'restored'].includes(name)) return fail('请选择有效的连接演示场景');
    return callbacks.breakLine({ type: 'event', name: 'breakLine', enterpriseId: Number(agent.enterpriseId), cno: agent.cno, code: name === 'restored' ? 0 : -1 });
  }

  function sessionFor(agent) { const s = adapter().session; return !!(own(agent) && s?.mock === true && s.context === contextKey() && s.accountId === state().accountId && s.enterpriseId === agent.enterpriseId && s.tenantId === agent.tenantId && s.cno === agent.cno); }
  const fail = (text, pending = false) => ({ ok: false, message: text, ...(pending ? { pending: true } : {}) });
  // Project policy: browser softphone and both outbound modes. These are not supplier omission defaults.
  function configuredBinding(agent) {
    return root.SeatPhoneConfig?.read(agent) || fail('软电话分机配置尚未加载，请刷新后重试');
  }
  function preferences(input) {
    if (!object(input) || Object.keys(input).some(key => !profileFields.includes(key))) return fail('登录设置包含不支持的字段');
    if (![1, 2].includes(int(input.loginStatus))) return fail('请选择有效的登录状态');
    if ('pauseDescription' in input && typeof input.pauseDescription !== 'string') return fail('置忙描述须为文本，可留空');
    // Absent/null workingMode (legacy stored rows, partial inputs) stays unset; login requires an explicit choice.
    if (input.workingMode != null && !validMode(input.workingMode)) return fail('请选择有效的工作模式');
    return { ok: true, profile: { loginStatus: Number(input.loginStatus), pauseDescription: (input.pauseDescription || '').trim(), workingMode: validMode(input.workingMode) ? input.workingMode : null } };
  }
  function inputProfile(agent, input) {
    if (!object(input) || Object.keys(input).some(key => !['loginStatus', 'pauseDescription', 'bindTel', 'bindType', 'workingMode'].includes(key))) return fail('登录设置包含不支持的字段');
    const valid = preferences({ loginStatus: input.loginStatus, pauseDescription: input.pauseDescription, workingMode: input.workingMode }); if (!valid.ok) return valid;
    const binding = configuredBinding(agent); if (!binding.ok) return binding;
    if (binding.eligible === false) return fail(binding.message || '请先选择本租户的可用软电话分机');
    const bindTel = binding.value;
    if (!bindTel) return fail('请先由管理员在坐席维护中配置软电话分机号，再登录');
    if ('bindType' in input && int(input.bindType) !== 3 || 'bindTel' in input && input.bindTel !== bindTel) return fail('当前项目统一使用软电话，接听设备由系统配置');
    return { ok: true, profile: { bindTel, bindType: 3, ...valid.profile } };
  }
  function readProfiles() {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) { if (revisionSeen) throw Error('登录设置记录已移除，请恢复原记录'); return { raw, value: { schemaVersion: 1, revision: 0, profiles: {} } }; }
    const value = JSON.parse(raw);
    if (!object(value) || value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 1 || !object(value.profiles) || Object.keys(value).some(k => !['schemaVersion','revision','profiles'].includes(k))) throw Error('登录设置记录格式无效，原记录已保留');
    for (const [key, row] of Object.entries(value.profiles)) {
      const keys = JSON.parse(key);
      if (!Array.isArray(keys) || keys.length !== 4 || !keys.every(x => typeof x === 'string' && x) || !preferences(row).ok) throw Error('登录设置记录格式无效，原记录已保留');
    }
    if (value.revision < revisionSeen || value.revision === revisionSeen && rawSeen !== null && raw !== rawSeen) throw Error('登录设置版本冲突，请重新打开');
    revisionSeen = value.revision; rawSeen = raw;
    return { raw, value };
  }
  function profile(agent) {
    if (!own(agent)) return fail('只能设置当前账号关联的本人坐席');
    try {
      const loaded = readProfiles(), saved = loaded.value.profiles[ownerKey(agent)];
      const preference = saved ? preferences(saved).profile : { loginStatus: 1, pauseDescription: '', workingMode: null };
      const binding = configuredBinding(agent); if (!binding.ok) return binding;
      if (binding.eligible === false) return fail(binding.message || '请先选择本租户的可用软电话分机');
      return { ok: true, profile: { bindTel: binding.value, bindType: 3, ...preference }, context: contextKey(), revision: loaded.value.revision, message: binding.message };
    } catch (_) { return fail('登录设置无法读取，原记录已保留，请恢复后重试'); }
  }
  function saveProfile(agent, input, options = {}) {
    if (!own(agent)) return fail('当前账号或坐席范围已变化，请重新打开');
    if (adapter().session || operation || uncertain || work().busy) return fail('请先完成当前通话并退出，再保存登录设置');
    const valid = inputProfile(agent, input); if (!valid.ok) return valid;
    if (valid.profile.workingMode == null) return fail('请先选择工作模式，再保存登录设置');
    try {
      const loaded = readProfiles(), captured = contextKey();
      if (options.expectedContext != null && options.expectedContext !== captured || options.expectedRevision != null && options.expectedRevision !== loaded.value.revision) return fail('登录设置或登录范围已变化，请重新打开');
      const next = clone(loaded.value); next.profiles[ownerKey(agent)] = { loginStatus: valid.profile.loginStatus, pauseDescription: valid.profile.pauseDescription, workingMode: valid.profile.workingMode }; next.revision++;
      if (!own(agent) || captured !== contextKey() || localStorage.getItem(storageKey) !== loaded.raw) return fail('登录设置已变化，请重新打开');
      localStorage.setItem(storageKey, JSON.stringify(next)); revisionSeen = next.revision; rawSeen = JSON.stringify(next);
      return { ok: true, profile: clone(valid.profile), revision: next.revision, context: captured, message: '登录设置已保存' };
    } catch (_) { return fail('登录设置未保存，请保留输入后重试'); }
  }
  function supplier(agent) {
    const source = fixture.seats.find(row => identity(row) === identity(agent));
    if (!source) return null;
    if (!server.has(identity(agent))) server.set(identity(agent), { ...clone(source), loggedIn: false, presence: 'offline', loginStatus: 0, workingMode: '0', pauseDescription: '', wrapupDeadline: null });
    return server.get(identity(agent));
  }
  function monitorQueues(agent) {
    if (!own(agent) || !root.TenantSupervisorPolicy?.isTenantAdmin()) return [];
    const permission = fixture.supervisors.find(row => row.power === 1 && row.confirmed === true && row.identityId === agent.contactCenterIdentityId && row.enterpriseId === agent.enterpriseId && row.tenantId === agent.tenantId && row.cno === agent.cno && row.accountId === state().accountId);
    return permission ? fixture.queues.filter(q => q.enterpriseId === agent.enterpriseId && q.tenantId === agent.tenantId && permission.qnos.includes(q.qno)).map(q => ({ qno: q.qno, name: q.name })) : [];
  }
  function monitoring(agent, params) {
    const allowed = monitorQueues(agent), wanted = params.qnos.split(',');
    if (!allowed.length || wanted.some(qno => !allowed.some(row => row.qno === qno))) return null;
    const result = {};
    for (const qno of wanted) {
      const q = fixture.queues.find(row => row.enterpriseId === agent.enterpriseId && row.tenantId === agent.tenantId && row.qno === qno), row = {};
      const members = q.agentStatuses.filter(a => {
        const locals = data.agents.filter(seat => seat.enterpriseId === agent.enterpriseId && seat.cno === a.cno && seat.lifecycleStatus !== '已删除');
        return locals.length === 1 && locals[0].tenantId === agent.tenantId && fixture.seats.some(s => s.enterpriseId === agent.enterpriseId && s.tenantId === agent.tenantId && s.cno === a.cno);
      }).map(a => {
        const live = server.get(JSON.stringify([agent.enterpriseId, agent.tenantId, a.cno]));
        const active = work(), call = active.call;
        const eventApplies = live?.loggedIn && sessionFor(agent) && a.cno === agent.cno && call?.simulation === true && call.enterpriseId === agent.enterpriseId && call.tenantId === agent.tenantId && call.accountId === state().accountId && call.cno === agent.cno && !call.endedAt;
        // Project the explicitly scoped local phone event into the mock device state, independently of login/pause presence.
        const device = eventApplies ? ({ offered: ['响铃', 3], answering: ['响铃', 3], dialing: ['呼叫中', 2], ringing: ['响铃', 3], connected: ['通话', 4] })[active.phase] : null;
        return { ...clone(a), ...(live ? { state: ({ ready: '空闲', paused: '置忙', wrapup: '整理', offline: '离线' })[live.presence] || '失效' } : {}), ...(device ? { state: device[0], deviceStatus: device[1] } : {}) };
      });
      const entries = q.queueEntries.filter(e => e.tenantId === agent.tenantId).map(e => ({ customerNumber: e.customerNumber, startTime: e.startTime, joinTime: e.joinTime, priority: e.priority, uniqueId: e.uniqueId, position: e.position }));
      for (const field of params.fields.split(',')) {
        // QueueParam statistics are inbound only. Its wrapupTime is an average, not the queue configuration duration.
        if (field === 'queueParams') row.queueParams = { calls: entries.length, queueEntryCount: entries.length, memberCount: members.length, idleCount: members.filter(a => a.state === '空闲').length };
        if (field === 'agentStatuses') row.agentStatuses = members;
        // waitTime is intentionally absent: the published QueueEntry definition does not state its unit.
        if (field === 'queueEntries') row.queueEntries = entries;
      }
      result[qno] = row;
    }
    return result;
  }
  // The official agentStatus/get is a server-side, single-cno read. It does not
  // require a CTILink supervisor login and does not return queue membership.
  async function agentStatusGet(_supervisor, cno) {
    const s = state(), access = root.AppState?.effectiveAccess?.() || {};
    if (!root.TenantSupervisorPolicy?.isTenantAdmin?.() || !access.valid ||
        s.activeDomain !== 'CLOUD_CONTACT_CENTER' || !root.AppState?.hasCapability?.('CLOUD_CONTACT_CENTER'))
      return fail('当前账号没有本租户坐席状态查看权限');
    if (typeof cno !== 'string' || !cno || cno !== cno.trim()) return fail('请选择有效的坐席工号');
    const matches = (data.agents || []).filter(row => row.enterpriseId === s.enterpriseId &&
      row.cno === cno && row.lifecycleStatus !== '已删除');
    if (matches.length !== 1 || matches[0].tenantId !== s.tenantId) return fail('只能查询当前租户的唯一坐席工号');
    const target = matches[0], captured = contextKey();
    const enterpriseId = /^\d+$/.test(String(s.enterpriseId)) && Number.isSafeInteger(Number(s.enterpriseId)) ? Number(s.enterpriseId) : null;
    const request = { method:'GET', path:'/interface/v10/agentStatus/get',
      query:{validateType:2,enterpriseId,timestamp:Math.floor(Date.now()/1000),sign:'00000000000000000000000000000000',cno},
      mock:true,...(enterpriseId === null ? {localOnly:true} : {}) };
    await Promise.resolve();
    const currentMatches = (data.agents || []).filter(row => row.enterpriseId === s.enterpriseId &&
      row.cno === cno && row.lifecycleStatus !== '已删除');
    if (captured !== contextKey() || !root.TenantSupervisorPolicy?.isTenantAdmin?.() ||
        currentMatches.length !== 1 || currentMatches[0].tenantId !== s.tenantId)
      return fail('租户或坐席范围已变化，请重新查询');
    if (scenarios.agentStatusGet === 'failure') {
      const response = {result:-1,description:'模拟状态查询失败',mock:true};
      trace.push({request:clone(request),response:clone(response),mock:true});
      return {ok:false,message:response.description,request,response};
    }
    const live = server.get(identity(target));
    const liveState = live ? ({ready:'空闲',paused:'置忙',wrapup:'整理',offline:'离线'})[live.presence] : '';
    const fixtureStates = fixture.queues.filter(queue => queue.enterpriseId === s.enterpriseId &&
      queue.tenantId === s.tenantId).flatMap(queue => queue.agentStatuses || []).filter(row => row.cno === cno).map(row => row.state);
    const uniqueStates = [...new Set(fixtureStates)];
    if (!liveState && uniqueStates.length > 1) return fail('坐席状态来源不一致，请稍后重查');
    const localState = ({'通话中':'通话','振铃':'响铃','话后处理':'整理','示忙':'置忙','未登录':'离线'})[target.agentStatus] || target.agentStatus;
    const status = target.lifecycleStatus === '已停用' ? '离线' : liveState || uniqueStates[0] || localState || '离线';
    const loginStatus = status === '离线' ? 0 : status === '置忙' ? 2 : status === '整理' ? 3 : 1;
    const deviceStatus = ({'呼叫中':2,'响铃':3,'通话':4})[status] ?? 0;
    const response = {result:0,description:'查询成功',data:{state:status,loginStatus,
      ...(loginStatus ? {deviceStatus} : {})},mock:true};
    trace.push({request:clone(request),response:clone(response),mock:true});
    return {ok:true,cno,state:status,request,response,mock:true};
  }
  function reply(agent, name, params, scenario) {
    const s = supplier(agent);
    // This is a prototype-only independent snapshot, not the agentStatus/get response or an SDK operation.
    if (name === 'refreshState') return { type: 'local-mock-snapshot', source: 'LOCAL_MOCK.inspectSeatSession', ok: scenario !== 'failure', mock: true, snapshot: scenario === 'failure' ? null : s ? clone(s) : { loggedIn: false, presence: 'offline' } };
    const response = { type: 'response', reqType: name, code: 0, msg: 'ok', mock: true };
    if (scenario === 'failure') return { ...response, code: -1, msg: 'exception' };
    if (name === 'login' && (scenario === 'not-in-queue' || !s?.qnos.length)) return { ...response, code: -1, msg: 'not in any queue' };
    if (name === 'login' && scenario === 'online-limit') return { ...response, code: -1, msg: 'over online agent limit' };
    if (name === 'login' && ['expired','media-error'].includes(scenario)) return { ...response, code: -1, msg: scenario === 'expired' ? 'sessionKey expired' : 'media connection failed' };
    if (!s) return { ...response, code: -1, msg: 'no such agent' };
    if (name === 'login') Object.assign(s, { loggedIn: true, bindTel: params.bindTel, bindType: params.bindType, loginStatus: params.loginStatus, presence: params.loginStatus === 2 ? 'paused' : 'ready', workingMode: params.workingMode, pauseDescription: params.pauseDescription || '', wrapupDeadline: null });
    else if (!s.loggedIn) return { ...response, code: -1, msg: 'not logined' };
    else if (name === 'logout') Object.assign(s, { loggedIn: false, presence: 'offline', loginStatus: 0 });
    else if (name === 'pause') Object.assign(s, { presence: 'paused', loginStatus: 2, pauseDescription: params.pauseDescription, wrapupDeadline: null });
    else if (name === 'unpause') Object.assign(s, { presence: 'ready', loginStatus: 1, pauseDescription: '', wrapupDeadline: null });
    else if (name === 'changeWorkingMode') s.workingMode = params.workingMode;
    else if (name === 'prolongWrapup') s.wrapupDeadline = Date.now() + params.wrapupTime * 1000; // Demonstration countdown only; no claim about provider remaining-time arithmetic.
    else if (name === 'queueStatus') { const rows = monitoring(agent, params); if (!rows) return { ...response, code: -1, msg: 'permission denied' }; response.queueStatus = rows; }
    if (name === 'login') Object.assign(response, { enterpriseId: Number(s.enterpriseId), cno: s.cno, bindTel: s.bindTel, bindType: s.bindType });
    return response;
  }
  const errors = { 'not in any queue': '当前坐席尚未加入队列，请联系管理员核对', 'over online agent limit': '当前企业在线坐席数量已达上限，请稍后再试', 'sessionKey expired': '登录材料已过期，请重新登录', 'media connection failed': '音频连接失败，请检查麦克风后重试', 'not logined': '电话尚未登录，请重新登录', 'permission denied': '当前坐席没有这些队列的班长监控权限' };
  async function perform(agent, name, params, apply, options = {}) {
    if (!own(agent)) return fail('当前账号或坐席范围已变化，请重新打开');
    if (operation) return fail('上一项电话操作仍在处理中，请稍候', true);
    if (connectionStatus().blocked && !['login', 'refreshState'].includes(name)) return fail(connectionStatus().message + ' 已保留当前通话与记录。');
    if (managementState().pending && !['queueStatus', 'refreshState'].includes(name)) return fail('请先在班长监控中刷新并核对上一项管理结果', true);
    if (uncertain && name !== 'refreshState') return fail('上一项结果尚未确认，请先核对电话状态', true);
    if (name !== 'login' && !sessionFor(agent) && !(name === 'refreshState' && uncertainOrigin === 'login' && uncertainOwner === contextKey() + identity(agent))) return fail('本人电话服务尚未就绪，请重新登录');
    const captured = contextKey(), oldSession = adapter().session, beforePresence = oldSession?.presence, requestAgent = clone(own(agent)), token = ++generation, connectionAtRequest = connectionRevision;
    operation = { token, name }; message = '正在处理电话操作';
    const request = { method: name === 'refreshState' ? 'LOCAL_MOCK.inspectSeatSession' : 'CTILink.Agent.' + name, params: clone(params), enterpriseId: agent.enterpriseId, cno: agent.cno, operationId: 'DEMO-SEAT-' + token, mock: true };
    lastRequest = clone(request); adapter().lastRequest = clone(request);
    const scenario = scenarios[name] || (name === 'login' ? adapter().scenario : null) || 'success';
    await new Promise(resolve => setTimeout(resolve, 220));
    if (options.configurationGuard && !options.configurationGuard()) { if (operation?.token === token) operation = null; return fail('软电话分机配置已变化，请重新核对后登录'); }
    const response = reply(requestAgent, name, params, scenario);
    trace.push({ request: clone(request), response: scenario === 'unknown' ? null : clone(response), mock: true });
    if (generation !== token || contextKey() !== captured || !own(agent) || identity(agent) !== identity(requestAgent) || adapter().session !== oldSession) { if (operation?.token === token) operation = null; return fail('登录或工作范围已变化，已忽略旧操作回执', true); }
    operation = null; lastResponse = scenario === 'unknown' ? null : clone(response);
    if (connectionRevision !== connectionAtRequest && name !== 'refreshState') { uncertainOrigin = uncertainOrigin || name; uncertain = name; uncertainOwner = captured + identity(agent); message = '操作期间电话连接发生变化，请核对结果后再继续'; return { ...fail(message, true), request, response: null }; }
    if (scenario === 'unknown') { uncertainOrigin = uncertainOrigin || name; uncertain = name; uncertainOwner = captured + identity(agent); message = '操作结果尚未确认，请核对电话状态，不要重复提交'; return { ...fail(message, true), request, response: null }; }
    if (name === 'refreshState' ? !response.ok : response.code !== 0) { message = errors[response.msg] || '电话操作未成功，原状态已保留，请稍后重试'; return { ...fail(message), request, response }; }
    if (options.responseGuard && !options.responseGuard()) {
      uncertainOrigin = name; uncertain = name; uncertainOwner = captured + identity(agent);
      message = '请求期间电话状态已变化，请核对当前工作模式后再继续';
      return { ...fail(message, true), request, response };
    }
    if (name === 'refreshState') { uncertain = ''; uncertainOwner = ''; uncertainOrigin = ''; }
    apply(response, supplier(agent)); message = options.message || '电话操作已完成';
    const changes = { login: ['login', '离线', adapter().session?.presence === 'paused' ? '置忙' : '空闲'],
      pause: ['busy', '空闲', '置忙'], unpause: ['idle', '置忙', '空闲'], logout: ['offline', beforePresence === 'paused' ? '置忙' : '空闲', '离线'] };
    if (changes[name]) {
      const [type, fromState, toState] = changes[name];
      root.SeatEventLog?.record(agent, type, { source: 'own', fromState, toState, detail: name === 'login' ? '坐席电话登录成功' : '坐席本人操作成功' });
    }
    return { ok: true, message, session: current(), request, response: clone(response) };
  }
  function idleGuard(agent, allowUnknown = false) {
    if (!sessionFor(agent)) return fail('本人电话尚未登录或工作范围已变化');
    const c = work(); if (phases.has(c.phase) || c.busy && c.phase !== 'idle') return fail('请先完成当前通话与记录，再执行此操作');
    if (!allowUnknown && uncertain) return fail('请先核对上一项电话操作的结果', true);
    return { ok: true };
  }
  async function login(agent, input, recovering = false) {
    if (!own(agent)) return fail('当前账号未关联可用的本人坐席');
    if (work().busy || adapter().session && !recovering) return fail('请先完成当前电话会话');
    if (recovering && (!sessionFor(agent) || !connectionStatus().blocked)) return fail('当前电话会话无需重新登录');
    const saved = profile(agent); if (!saved.ok) return saved;
    // Partial explicit input keeps the saved working-mode preference; a full profile carries its own.
    const checked = inputProfile(agent, input ? { ...saved.profile, ...input } : saved.profile); if (!checked.ok) return checked;
    // D-071: login submits the seat's own mode choice; an unselected mode blocks the login, not a silent default.
    if (checked.profile.workingMode == null) return fail('请先在“登录设置”中选择工作模式，再登录电话');
    const binding = configuredBinding(agent); if (!binding.ok || !binding.value || binding.eligible === false) return binding.ok ? fail(binding.message || '请先选择可用软电话分机') : binding;
    const auth = root.AliCtiFields?.authenticateFields?.(agent); if (auth?.pending?.length) return fail(auth.pending.join('；'));
    const p = checked.profile, qnos = monitorQueues(agent).map(q => agent.enterpriseId + q.qno);
    const params = { sessionKey: 'DEMO-SESSION-' + agent.cno, enterpriseId: Number(agent.enterpriseId), cno: agent.cno, webSocketUrl: 'wss://demo.invalid/agent', ...p, ...(qnos.length ? { qids: qnos.join(',') } : {}) };
    adapter().authDraft = auth; adapter().loginDraft = { fields: clone(params), mock: true, pending: [], source: '本地电话登录模拟，不连接供应商' }; adapter().trace = ['setup','events','authenticate','login','media'];
    return perform(agent, 'login', params, (_, s) => { adapter().session = { enterpriseId: agent.enterpriseId, tenantId: agent.tenantId, accountId: state().accountId, cno: agent.cno, identityId: agent.contactCenterIdentityId, context: contextKey(), bindTel: s.bindTel, bindType: s.bindType, loginStatus: s.loginStatus, presence: s.presence, workingMode: s.workingMode, pauseDescription: s.pauseDescription, issuedAt: Date.now(), wrapupDeadline: null, resumeRequired: false, mock: true }; resetConnection(); }, { configurationGuard: () => { const currentBinding = configuredBinding(agent); return currentBinding.ok && currentBinding.eligible !== false && currentBinding.value === binding.value && currentBinding.context === binding.context && currentBinding.revision === binding.revision && currentBinding.directoryRevision === binding.directoryRevision && currentBinding.directoryContext === binding.directoryContext; }, message: p.loginStatus === 2 ? '电话已登录，当前置忙' : '电话已登录，可以接听或联系客户' });
  }
  async function relogin(agent = myAgent()) {
    if (!connectionStatus().canRelogin) return fail(work().busy ? '已保留当前通话与记录，请完成处理后重新登录电话' : '请先核对上一项电话操作的结果');
    const saved = profile(agent); if (!saved.ok) return saved;
    // Preserve the current session until the new login succeeds. Unknown/failure never releases it.
    // Reconnect the current phone session in its live mode, including an online switch after the saved login preference.
    return login(agent, { ...saved.profile, workingMode: adapter().session?.workingMode ?? saved.profile.workingMode, loginStatus: 2, pauseDescription: '重新登录后等待继续接听' }, true);
  }
  async function logout(agent = myAgent(), options = { removeBinding: 0 }) {
    const g = idleGuard(agent); if (!g.ok) return g;
    if (!object(options) || (options.removeBinding ?? 0) !== 0 || Object.keys(options).some(k => k !== 'removeBinding')) return fail('坐席退出固定保留分机绑定');
    const params = { logoutMode: 1, removeBinding: 0 };
    return perform(agent, 'logout', params, () => { adapter().lastLogout = { ...params, mock: true }; adapter().session = null; }, { message: '电话已退出' });
  }
  async function pause(agent = myAgent(), input = {}) {
    const g = idleGuard(agent); if (!g.ok) return g;
    if (!object(input) || ![1,2].includes(int(input.pauseType)) || typeof input.pauseDescription !== 'string' || !input.pauseDescription.trim() || Object.keys(input).some(k => !['pauseType','pauseDescription'].includes(k))) return fail('请选择置忙类型并填写原因');
    return perform(agent, 'pause', { pauseType: Number(input.pauseType), pauseDescription: input.pauseDescription.trim() }, (_, s) => { Object.assign(adapter().session, { presence: s.presence, loginStatus: 2, pauseDescription: s.pauseDescription, wrapupDeadline: null, resumeRequired: true }); }, { message: '已置忙' });
  }
  async function unpause(agent = myAgent()) {
    const g = idleGuard(agent); if (!g.ok) return g;
    return perform(agent, 'unpause', {}, () => { Object.assign(adapter().session, { presence: 'ready', loginStatus: 1, pauseDescription: '', wrapupDeadline: null, resumeRequired: false }); }, { message: '已置闲' });
  }
  // Device binding stays fixed to the browser softphone; retained as a rejecting entry so cached UI cannot bypass.
  async function changeBindTel() {
    return fail('当前项目统一使用软电话，不支持切换接听设备');
  }
  // Working mode is the one seat-facing switch (CTILink.Agent.changeWorkingMode).
  // Mode and presence are independent: a paused seat may switch modes; busy/wrap phases may not.
  function modeGuard(agent) {
    const guard = idleGuard(agent); if (!guard.ok) return guard;
    const session = adapter().session;
    return ['ready', 'paused'].includes(session?.presence) && !(session.presence === 'ready' && session.resumeRequired)
      ? { ok: true } : fail('请先完成当前通话与话后整理，再切换工作模式');
  }
  async function changeWorkingMode(agent = myAgent(), input = {}) {
    const g = modeGuard(agent); if (!g.ok) return g;
    if (!object(input) || Object.keys(input).some(k => k !== 'workingMode') || !validMode(input.workingMode)) return fail('请选择有效的工作模式');
    if (adapter().session.workingMode === input.workingMode) return fail('当前已是该工作模式');
    return perform(agent, 'changeWorkingMode', { workingMode: input.workingMode }, (_, s) => { adapter().session.workingMode = s.workingMode; }, {
      responseGuard: () => modeGuard(agent).ok,
      message: '工作模式已切换：' + modeLabels[input.workingMode]
    });
  }
  function enterWrapup(call) {
    const agent = myAgent(); if (!agent || !sessionFor(agent) || !call || call.enterpriseId !== agent.enterpriseId || call.tenantId !== agent.tenantId || call.accountId !== state().accountId || call.cno && call.cno !== agent.cno) return fail('当前通话不属于本人电话会话');
    const source = supplier(agent), q = fixture.queues.find(row => row.enterpriseId === agent.enterpriseId && row.tenantId === agent.tenantId && row.qno === (call.qno || source?.qnos?.[0]));
    const seconds = Number(q?.wrapupTime); const duration = Number.isInteger(seconds) && seconds >= 3 && seconds <= 3600 ? seconds : 30;
    const deadline = Date.now() + duration * 1000;
    Object.assign(adapter().session, { presence: 'wrapup', loginStatus: 3, wrapupDeadline: deadline, resumeRequired: true });
    if (source) Object.assign(source, { presence: 'wrapup', loginStatus: 3, wrapupDeadline: deadline });
    return { ok: true, session: current(), message: '请完成本次记录，保存成功后自动置闲' };
  }
  async function prolongWrapup(agent, input) {
    if (!sessionFor(agent) || work().phase !== 'wrap' || adapter().session.presence !== 'wrapup') return fail('仅在话后整理时可以延长时间');
    if (!object(input) || int(input.wrapupTime) === null || Number(input.wrapupTime) < 30 || Number(input.wrapupTime) > 600 || Object.keys(input).some(k => k !== 'wrapupTime')) return fail('延长时间须为30～600秒的整数');
    return perform(agent, 'prolongWrapup', { wrapupTime: Number(input.wrapupTime) }, (_, s) => { adapter().session.wrapupDeadline = s.wrapupDeadline; }, { message: '整理时间已延长' });
  }
  async function completeWrapup() {
    const agent = myAgent(); if (!agent || !sessionFor(agent)) return fail('本人电话会话已变化');
    if (work().busy || work().phase !== 'idle') return fail('请先保存并完成当前通话记录');
    return unpause(agent);
  }
  async function refreshState(agent = myAgent()) {
    if (!own(agent)) return fail('当前坐席范围已变化');
    // Unknown login is inspected without first publishing a guessed local session.
    const unresolvedLogin = uncertainOrigin === 'login' && uncertainOwner === contextKey() + identity(agent);
    if (!sessionFor(agent) && !unresolvedLogin) return fail('本人电话尚未登录');
    const confirmingUnpause = uncertainOrigin === 'unpause';
    return perform(agent, 'refreshState', { cno: agent.cno }, response => {
      const s = response.snapshot;
      if (!s?.loggedIn) { adapter().session = null; return; }
      const confirmedReady = confirmingUnpause && s.presence === 'ready' && !work().busy && work().phase === 'idle' && !connectionStatus().blocked;
      const wasProtected = !confirmedReady && (adapter().session?.resumeRequired || work().busy || unresolvedLogin);
      if (!adapter().session) adapter().session = { enterpriseId: agent.enterpriseId, tenantId: agent.tenantId, accountId: state().accountId, cno: agent.cno, identityId: agent.contactCenterIdentityId, context: contextKey(), issuedAt: Date.now(), mock: true };
      Object.assign(adapter().session, { bindTel: s.bindTel, bindType: s.bindType, workingMode: s.workingMode, loginStatus: s.loginStatus, presence: s.presence, pauseDescription: s.pauseDescription, wrapupDeadline: s.wrapupDeadline, resumeRequired: !!wasProtected });
    }, { message: '已核对当前电话状态' });
  }
  async function queueStatus(agent, input = {}) {
    if (!sessionFor(agent)) return fail('请先将本人电话登录');
    const allowed = monitorQueues(agent); if (!allowed.length) return fail('当前坐席未取得班长队列监控授权');
    if (!object(input) || Object.keys(input).some(k => !['qnos','fields'].includes(k))) return fail('队列监控参数无效');
    const qnos = input.qnos == null ? allowed.map(q => q.qno) : typeof input.qnos === 'string' ? input.qnos.split(',').map(v => v.trim()).filter(Boolean) : [];
    const fields = input.fields == null ? ['queueParams','agentStatuses','queueEntries'] : typeof input.fields === 'string' ? input.fields.split(',').map(v => v.trim()).filter(Boolean) : [];
    if (!qnos.length || qnos.some(qno => !allowed.some(q => q.qno === qno)) || !fields.length || fields.some(f => !['queueParams','agentStatuses','queueEntries'].includes(f))) return fail('只能查看本租户已授权队列和支持的监控项');
    const result = await perform(agent, 'queueStatus', { qnos: [...new Set(qnos)].join(','), fields: [...new Set(fields)].join(',') }, () => {}, { message: '队列状态已更新' });
    if (result.ok && fields.includes('agentStatuses')) {
      monitorSnapshot = { context: contextKey(), rows: clone(result.response.queueStatus), at: Date.now() };
      if (managementPending?.context === contextKey()) {
        const checked = monitoredTargetState(agent, managementPending.cno);
        if (checked.ok) { managementPending = null; managementMessage = '已核对坐席当前状态'; }
      }
    } else if (!result.ok) monitorSnapshot = null;
    return result.ok ? { ...result, queueStatus: clone(result.response.queueStatus) } : result;
  }
  // Supervisor commands use CTILink.Monitor, not the logged-in seat's Agent methods.
  // The prototype's independent supplier state is queried again after every successful command.
  const managementMethods = { pause: 'setPause', unpause: 'setUnpause', logout: 'setOffline' };
  function managedTarget(agent, cno) {
    if (!sessionFor(agent) || connectionStatus().blocked || !monitorQueues(agent).length) return fail('请先以登录且电话连接正常的本租户班长坐席进入监控');
    if (typeof cno !== 'string' || !cno || cno === agent.cno) return fail('请通过外呼坐席页签操作本人的电话状态');
    const targets = data.agents.filter(a => a.enterpriseId === agent.enterpriseId && a.cno === cno && a.lifecycleStatus !== '已删除');
    const target = targets[0], queues = new Set(monitorQueues(agent).map(q => q.qno));
    if (targets.length !== 1 || target.tenantId !== agent.tenantId || target.lifecycleStatus !== '已启用' || target.syncStatus !== '同步成功' || target.callEnabled === false || target.acceptNewTasks === false ||
        !fixture.seats.some(s => s.enterpriseId === agent.enterpriseId && s.tenantId === agent.tenantId && s.cno === cno) ||
        !fixture.queues.some(q => q.enterpriseId === agent.enterpriseId && q.tenantId === agent.tenantId && queues.has(q.qno) && q.agentStatuses.some(a => a.cno === cno))) return fail('只能管理本租户已授权队列内的有效坐席');
    return { ok: true, target };
  }
  function monitoredTargetState(agent, cno) {
    const allowed = managedTarget(agent, cno); if (!allowed.ok) return allowed;
    if (!monitorSnapshot || monitorSnapshot.context !== contextKey() || Date.now() - monitorSnapshot.at > 120000) return fail('请先刷新监控，获取坐席最新状态');
    const queues = new Set(monitorQueues(agent).map(q => q.qno));
    const rows = Object.entries(monitorSnapshot.rows).filter(([qno]) => queues.has(qno)).flatMap(([, q]) => q.agentStatuses || []).filter(a => a.cno === cno);
    if (!rows.length || new Set(rows.map(row => row.state)).size !== 1 || rows.some(row => !row.state)) return fail('坐席状态尚未确认，请刷新监控后再操作');
    return { ...allowed, state: rows[0].state, deviceBusy: rows.some(row => row.deviceStatus != null && row.deviceStatus !== 0) };
  }
  function managementState() {
    const pending = managementPending?.context === contextKey() ? managementPending : null;
    return { pending: !!pending, inFlight: !!operation?.management, cno: pending?.cno || operation?.cno || '', action: pending?.action || operation?.action || '', message: managementMessage };
  }
  function managementEligibility(agent, cno, action) {
    const target = monitoredTargetState(agent, cno); if (!target.ok) return target;
    if (operation) return fail('上一项操作仍在处理中，请稍候');
    if (uncertain || managementState().pending) return fail('上一项结果待核对，请先刷新监控', true);
    if (action === 'login') return { ...fail('当前使用浏览器软电话，请由该坐席登录自己的账号，在“外呼坐席”点击登录。'), supported: false };
    if (!managementMethods[action]) return fail('不支持此坐席管理操作');
    const permitted = { pause: ['空闲'], unpause: ['置忙'], logout: ['空闲', '置忙'] }[action];
    if (target.deviceBusy || !permitted.includes(target.state)) return fail('当前状态不适合此操作；通话、响铃和话后整理中的坐席须先完成处理');
    return { ok: true, state: target.state };
  }
  async function manageSeat(agent, input) {
    if (!object(input) || Object.keys(input).some(key => !['action', 'cno'].includes(key))) return fail('坐席管理参数无效');
    const { action, cno } = input, eligible = managementEligibility(agent, cno, action); if (!eligible.ok) return eligible;
    const method = managementMethods[action], captured = contextKey(), expectedIdentity = managedTarget(agent, cno).target.contactCenterIdentityId;
    const token = ++generation, params = { monitoredCno: cno, ...(action === 'logout' ? { removeBinding: 0 } : {}) };
    const request = { method: 'CTILink.Monitor.' + method, params, enterpriseId: agent.enterpriseId, cno: agent.cno, operationId: 'DEMO-SUPERVISOR-' + token, mock: true };
    operation = { token, name: method, management: true, cno, action }; managementMessage = '正在处理坐席状态';
    lastRequest = clone(request); adapter().lastRequest = clone(request);
    const scenario = scenarios[method] || 'success';
    await new Promise(resolve => setTimeout(resolve, 220));
    const currentTarget = managedTarget(agent, cno);
    if (generation !== token || captured !== contextKey() || !currentTarget.ok || currentTarget.target.contactCenterIdentityId !== expectedIdentity) {
      if (operation?.token === token) operation = null;
      return fail('账号、租户或坐席授权已变化，已忽略旧操作结果');
    }
    operation = null;
    // Recheck the independent mock device state before applying, protecting active calls.
    const source = server.get(identity(currentTarget.target));
    const sourceState = source ? ({ ready: '空闲', paused: '置忙', wrapup: '整理', offline: '离线' })[source.presence] : eligible.state;
    const permitted = { pause: ['空闲'], unpause: ['置忙'], logout: ['空闲', '置忙'] }[action];
    const succeeded = scenario !== 'failure' && permitted.includes(sourceState);
    const response = { type: 'response', reqType: method, code: succeeded ? 0 : -1, msg: succeeded ? 'ok' : 'exception', mock: true };
    if (succeeded) {
      const s = supplier(currentTarget.target);
      Object.assign(s, { loggedIn: action !== 'logout', presence: action === 'pause' ? 'paused' : action === 'unpause' ? 'ready' : 'offline', loginStatus: action === 'pause' ? 2 : action === 'unpause' ? 1 : 0, pauseDescription: '', wrapupDeadline: null });
    }
    trace.push({ request: clone(request), response: scenario === 'unknown' ? null : clone(response), mock: true });
    lastResponse = scenario === 'unknown' ? null : clone(response);
    if (scenario === 'unknown') {
      managementPending = { context: captured, cno, action }; managementMessage = '操作结果待核对，请刷新监控确认坐席当前状态，不要重复提交';
      return { ...fail(managementMessage, true), request, response: null };
    }
    if (succeeded) root.SeatEventLog?.record(currentTarget.target, { pause: 'busy', unpause: 'idle', logout: 'offline' }[action], {
      source: 'management', fromState: sourceState, toState: { pause: '置忙', unpause: '空闲', logout: '离线' }[action], detail: '班长管理操作成功'
    });
    managementMessage = succeeded ? '操作已完成，正在核对坐席状态' : '操作未成功，坐席原状态保留，请稍后重试';
    return { ok: succeeded, message: managementMessage, request, response };
  }
  function usable() { const agent = myAgent(); return !!(agent && sessionFor(agent) && !connectionStatus().blocked && !operation && !uncertain && !work().busy && adapter().session.presence === 'ready' && !adapter().session.resumeRequired); }
  function canReceive(kind) { return ['inbound','predictive'].includes(kind) && usable() && (kind !== 'predictive' || adapter().session.workingMode !== '4'); }
  function canDial() {
    if (!usable() || adapter().session.workingMode === '5') return false;
    return !root.AliCtiExtensions || root.AliCtiExtensions.outboundEligibility?.(myAgent())?.ok === true;
  }
  function status() { return { connection: connectionStatus(), session: current(), pending: !!uncertain, unknown: !!uncertain, inFlight: !!operation, message, lastRequest: clone(lastRequest), lastResponse: clone(lastResponse) }; }
  function invalidate() { connection = null; connectionSession = null; connectionContext = ''; generation++; operation = null; uncertain = ''; uncertainOwner = ''; uncertainOrigin = ''; message = ''; adapter().session = null; monitorSnapshot = null; managementPending = null; managementMessage = ''; }
  root.AliCtiSeatOperations = { connectionStatus, connectionCallbacks, connectionEvents, demoConnection, relogin, profile, saveProfile, login, logout, pause, unpause, changeBindTel, changeWorkingMode, modeLabels, prolongWrapup, agentStatusGet, queueStatus, refreshState, enterWrapup, completeWrapup, canReceive, canDial, monitorQueues, current, status, invalidate, contextKey, scenarios, trace, manageSeat, managementState, managementEligibility };
})();
