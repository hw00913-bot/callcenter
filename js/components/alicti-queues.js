/** Tenant-owned links to existing provider queue snapshots. Official-shaped create/update requests are simulated locally; no network calls. */
(function () {
  'use strict';
  const data = window.CloudCallData, fixture = window.AliCtiQueueFixtures;
  if (!data || !fixture) return;
  const storageKey = 'alicti-queue-bindings-v1';
  const clone = value => structuredClone(value);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const validText = value => typeof value === 'string' && value.length > 0;
  const identity = row => JSON.stringify([row.enterpriseId, row.physicalGroupId]);
  const queueKey = row => JSON.stringify([row.enterpriseId, row.qno]);
  const groupFor = input => (data.physicalSkillGroups || []).find(g => g.physicalGroupId === (typeof input === 'string' ? input : input?.physicalGroupId));
  let snapshot = { schemaVersion: 1, revision: 0, bindings: clone(fixture.bindings), queues: clone(fixture.queues) }, rawSeen = null, errorMessage = '';
  function contextKey() {
    const app = window.AppState, state = app?.get?.() || {}, access = app?.effectiveAccess?.() || {};
    return JSON.stringify([state.accountId || '', state.sessionId || '', app?.isSuper?.() ? 'SUPER_ADMIN' : access.roleCode || '', state.activeDomain || '', state.enterpriseId || '', state.tenantId || '']);
  }
  function canAccess() {
    const app = window.AppState, state = app?.get?.() || {}, access = app?.effectiveAccess?.() || {};
    return !!(state.accountId && state.sessionId && validText(state.enterpriseId) && app?.isReady?.() && access.valid && state.activeDomain === 'CLOUD_CONTACT_CENTER' && app?.hasCapability?.('CLOUD_CONTACT_CENTER') && (app?.isSuper?.() || access.roleCode === 'ADMIN'));
  }
  function queueInScope(queue) {
    if (!canAccess() || !queue) return false;
    const app = window.AppState, state = app.get();
    const tenant = (data.tenants || []).find(t => t.tenantId === queue.tenantId && t.enterpriseId === queue.enterpriseId);
    return !!(tenant && queue.enterpriseId === state.enterpriseId && (app.isSuper() || queue.tenantId === state.tenantId) && app.authorizeObject('', queue));
  }
  function canView(input) {
    const group = groupFor(input), app = window.AppState;
    const tenant = group && (data.tenants || []).find(t => t.tenantId === group.tenantId && t.enterpriseId === group.enterpriseId);
    return !!(group && tenant && canAccess() && app.authorizeObject('', group));
  }
  function canManage(input) { return canView(input); }
  function validate(saved) {
    if (!object(saved) || saved.schemaVersion !== 1 || !Number.isSafeInteger(saved.revision) || saved.revision < 1 || !Array.isArray(saved.bindings) || !Array.isArray(saved.queues) || Object.keys(saved).some(k => !['schemaVersion', 'revision', 'bindings', 'queues'].includes(k))) throw Error('队列关联记录格式无效，原记录已保留');
    const fields = ['enterpriseId', 'tenantId', 'physicalGroupId', 'qno', 'checkedAt', 'checkedFingerprint', 'updatedAt', 'updatedBy', 'simulation'];
    for (const row of saved.bindings) {
      if (!object(row) || Object.keys(row).some(k => !fields.includes(k)) || !['enterpriseId', 'tenantId', 'physicalGroupId', 'qno'].every(k => validText(row[k])) || !['checkedAt', 'checkedFingerprint', 'updatedAt', 'updatedBy'].every(k => typeof row[k] === 'string') || row.simulation !== true) throw Error('队列关联记录格式无效，原记录已保留');
    }
    if (new Set(saved.bindings.map(identity)).size !== saved.bindings.length) throw Error('队列关联记录存在重复归属，原记录已保留');
    if (saved.queues.some(q => !object(q) || !['enterpriseId', 'tenantId', 'qno', 'name', 'description', 'strategy'].every(k => validText(q[k])) || q.simulation !== true || !['ACTIVE', 'STOPPED'].includes(q.status) || !Array.isArray(q.cnos) || !q.cnos.every(validText) || !Array.isArray(q.queueSkills) || q.queueSkills.some(r => !object(r) || !Number.isSafeInteger(r.skillId) || r.skillId < 1 || !Number.isInteger(r.skillLevel) || r.skillLevel < 1 || r.skillLevel > 10))) throw Error('队列目录记录格式无效，原记录已保留');
    for (const q of saved.queues) { if (new Set(q.queueSkills.map(s=>s.skillId)).size !== q.queueSkills.length || q.skillMappings !== undefined && (!Array.isArray(q.skillMappings) || q.skillMappings.some(m=>!object(m) || !validText(m.physicalGroupId) || !Number.isSafeInteger(m.skillId) || m.skillId < 1))) throw Error('队列技能映射记录无效，原记录已保留'); const fields = Object.fromEntries(parameterKeys.filter(k => Object.hasOwn(q, k)).map(k => [k,q[k]])); if (!window.AliCtiQueueContracts?.updateFields(q.qno,fields).ok) throw Error('队列参数记录无效，原记录已保留'); }
    if (new Set(saved.queues.map(queueKey)).size !== saved.queues.length) throw Error('同一 AliCti 账号内存在重复队列号，原记录已保留');
    return saved;
  }
  function read() {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) {
      if (snapshot.revision > 0) throw Error('队列关联存储已移除，请恢复原记录后重试');
      return { raw, value: { schemaVersion: 1, revision: 0, queues: clone(fixture.queues), bindings: clone(fixture.bindings).filter(b => { const g = groupFor(b.physicalGroupId); return g && g.tenantId === b.tenantId && g.enterpriseId === b.enterpriseId; }) } };
    }
    let value;
    try { value = validate(JSON.parse(raw)); } catch (error) { throw Error(error instanceof SyntaxError ? '队列关联记录损坏，原记录已保留' : error.message); }
    if (value.revision < snapshot.revision || value.revision === snapshot.revision && rawSeen !== null && raw !== rawSeen) throw Error('队列关联版本冲突，请恢复记录后重试');
    return { raw, value };
  }
  function refresh() {
    try { const next = read(); snapshot = next.value; rawSeen = next.raw; errorMessage = ''; return true; }
    catch (error) { errorMessage = error.message || '队列关联记录暂时无法读取'; return false; }
  }
  function revision() { refresh(); return snapshot.revision; }
  function expectedMembers(group) {
    const ids = new Set((data.agentSkills || []).filter(r => r.physicalGroupId === group.physicalGroupId && r.status === '已生效' && (window.AliCtiFields?.validSkillLevel(r.skillLevel) ?? (/^[0-9]+$/.test(String(r.skillLevel)) && Number(r.skillLevel) >= 1 && Number(r.skillLevel) <= 10))).map(r => r.identityId));
    return (data.agents || []).filter(a => ids.has(a.contactCenterIdentityId) && a.tenantId === group.tenantId && a.enterpriseId === group.enterpriseId && a.lifecycleStatus === '已启用' && a.acceptNewTasks !== false && typeof a.cno === 'string' && a.cno).map(a => ({ cno: a.cno, name: a.userName || '', identityId: a.contactCenterIdentityId })).sort((a,b) => a.cno.localeCompare(b.cno));
  }
  function relatedGroups(queue, value = snapshot) {
    return queueBinding(queue, value).groups;
  }
  function comparisonGroups(group, queue, value = snapshot) {
    const groups = queue ? relatedGroups(queue, value) : [];
    return groups.length ? groups : group?.physicalGroupId ? [group] : [];
  }
  // A cno-only snapshot predating deletion cannot prove that a newly created identity rejoined the queue.
  // Keep source snapshots unchanged; project out membership invalidated by a persisted deletion tombstone.
  function retiredMemberCno(cno, enterpriseId) {
    return (data.agents || []).some(a => a.enterpriseId === enterpriseId && a.cno === cno && a.lifecycleStatus === '已删除');
  }
  function compare(group, queue) {
    const expected = [...new Map(comparisonGroups(group, queue).flatMap(expectedMembers).map(a => [a.cno, a])).values()].sort((a,b) => a.cno.localeCompare(b.cno)), source = queue?.cnos || [], actual = [];
    for (const cno of [...new Set(source)]) {
      if (retiredMemberCno(cno, group.enterpriseId)) continue;
      const scoped = (data.agents || []).filter(a => a.cno === cno && a.enterpriseId === group.enterpriseId && a.lifecycleStatus !== '已删除');
      const own = scoped.filter(a => a.tenantId === group.tenantId);
      if (own.length === 1 && scoped.length === 1) actual.push({ cno, name: own[0].userName || '', identityId: own[0].contactCenterIdentityId });
      else actual.push({ cno: '', name: '无法核对的坐席', restricted: true });
    }
    const missing = expected.filter(a => !actual.some(b => a.cno === b.cno));
    const extra = actual.filter(a => a.restricted || !expected.some(b => a.cno === b.cno));
    return { expected, actual, missing, extra, restrictedCount: actual.filter(a => a.restricted).length };
  }
  function queueFor(binding) { return binding && snapshot.queues.find(q => q.enterpriseId === binding.enterpriseId && q.qno === binding.qno); }
  const parameterKeys = ['description', 'musicClass', 'strategy', 'sayAgentno', 'queueTimeout', 'memberTimeout', 'retry', 'wrapupTime', 'maxLen', 'serviceLevel', 'weight', 'vipSupport', 'joinEmpty', 'announceSound', 'announceSoundFrequency', 'announceSoundFile', 'announcePosition', 'announcePositionFrequency', 'announcePositionYouarenext', 'announcePositionParam', 'maxPauseAgentFlag', 'maxPauseAgentType', 'maxPauseAgentValue'];
  function projectQueue(q) { return q ? clone(Object.fromEntries(['enterpriseId', 'tenantId', 'qno', 'name', 'status', 'statusLabel', 'strategyLabel', 'queueSkills', 'demoSkillId', 'simulation', 'localUpdatedAt', ...parameterKeys].filter(k => Object.hasOwn(q, k)).map(k => [k, q[k]]))) : null; }
  function expectedSkill(group, value = snapshot) {
    if (Number.isSafeInteger(group.providerSkillId) && group.providerSkillId > 0) return group.providerSkillId;
    const source = fixture.supplierSkills.find(s => s.enterpriseId === group.enterpriseId && s.tenantId === group.tenantId && s.physicalGroupId === group.physicalGroupId);
    if (source) return source.skillId;
    const mapped = value.queues.flatMap(q => q.enterpriseId === group.enterpriseId && q.tenantId === group.tenantId ? q.skillMappings || [] : []).find(m => m.physicalGroupId === group.physicalGroupId && Number.isSafeInteger(m.skillId));
    if (mapped) return mapped.skillId;
    const created = value.queues.find(q => q.enterpriseId === group.enterpriseId && q.tenantId === group.tenantId && q.createdForPhysicalGroupId === group.physicalGroupId && Number.isSafeInteger(q.configuredSkillId));
    return created?.configuredSkillId || null;
  }
  function compareSkills(group, queue) {
    const groups = comparisonGroups(group, queue), expectedSkillIds = groups.map(g => expectedSkill(g)), actualSkillIds = (queue?.queueSkills || []).map(s => s.skillId);
    return { expectedSkillId: group ? expectedSkill(group) : null, expectedSkillIds: clone(expectedSkillIds), actualSkillIds: clone(actualSkillIds), matched: groups.length > 0 && expectedSkillIds.every(id => id !== null) && new Set(expectedSkillIds).size === expectedSkillIds.length && actualSkillIds.length === expectedSkillIds.length && actualSkillIds.every(id => expectedSkillIds.some(expected => String(id) === String(expected))) };
  }
  function fingerprint(group, binding, queue) {
    const groups = comparisonGroups(group, queue);
    const configuration = queue ? Object.fromEntries(Object.entries(queue).filter(([key]) => key !== 'localUpdatedAt')) : null;
    return JSON.stringify({ groups: groups.map(g => [g.enterpriseId,g.tenantId,g.physicalGroupId,g.status,g.syncStatus,expectedSkill(g)]).sort(), binding: binding?.qno || '', queue: configuration, members: groups.flatMap(g => expectedMembers(g).map(a => [g.physicalGroupId,a])).sort((a,b)=>a[0].localeCompare(b[0])) });
  }
  function busyReason(group, binding, includeRoutes = true) {
    const memberIds = new Set((data.agentSkills || []).filter(r => r.physicalGroupId === group.physicalGroupId).map(r => r.identityId));
    if (binding && (data.agents || []).some(a => memberIds.has(a.contactCenterIdentityId) && a.enterpriseId === group.enterpriseId && a.tenantId === group.tenantId && (a.currentCall || ['通话中', '振铃', '拨号中', '话后处理'].includes(a.agentStatus)))) return '该技能有坐席正在通话或处理通话，请完成后再调整接听队列';
    if (includeRoutes && binding && (data.inboundRoutes || []).some(r => r.enterpriseId === group.enterpriseId && r.status === '已发布' && (r.branches || []).some(b => b.tenantId === group.tenantId && (b.physicalGroupId === group.physicalGroupId || b.skillGroupId === group.skillGroupId)))) return '该技能已被已发布的呼入规则使用，请先在呼入规则中调整该接听团队，再更换或解除队列';
    return '';
  }
  function options(input) {
    const group = groupFor(input);
    if (!canManage(group)) return [];
    refresh();
    return snapshot.queues.filter(q => q.enterpriseId === group.enterpriseId && (window.AppState.isSuper() || q.tenantId === group.tenantId)).map(q => {
      const reason = errorMessage || (q.tenantId !== group.tenantId ? '该队列归属其他租户' : q.status !== 'ACTIVE' ? '该队列暂不可用' : '');
      return { ...projectQueue(q), disabled: !!reason, reason };
    });
  }
  function describe(input) {
    const group = groupFor(input);
    if (!canView(group)) return null;
    refresh();
    return describeGroup(group);
  }
  function describeGroup(group) {
    const found = snapshot.bindings.find(b => b.enterpriseId === group.enterpriseId && b.physicalGroupId === group.physicalGroupId), binding = found && found.tenantId === group.tenantId ? found : null;
    const source = queueFor(binding), queue = source && source.tenantId === group.tenantId ? source : null;
    const memberComparison = compare(group, queue), skillComparison = compareSkills(group, queue);
    let status = 'unbound', message = '尚未关联接听队列';
    if (errorMessage) { status = 'error'; message = errorMessage; }
    else if (found && !binding || binding && (!queue || queue.status !== 'ACTIVE')) { status = 'unavailable'; message = '队列归属或可用状态已变化，请重新核对配置'; }
    else if (binding) {
      if (!binding.checkedAt) { status = 'unchecked'; message = '已保存关联，尚未核对队列成员'; }
      else if (binding.checkedFingerprint !== fingerprint(group, binding, queue)) { status = 'stale'; message = '成员或队列配置发生变化，请重新核对'; }
      else if (!skillComparison.matched) { status = 'different'; message = '队列关联技能与当前技能不一致，请先核对供应商队列技能配置'; }
      else if (memberComparison.missing.length || memberComparison.extra.length) { status = 'different'; message = '队列成员与本租户技能有效成员不一致，请在原成员配置处处理后重新核对'; }
      else { status = 'matched'; message = '关联与成员快照一致；呼入路由与实际接听仍需单独核对'; }
    }
    return { binding: binding ? Object.fromEntries(Object.entries(clone(binding)).filter(([key]) => key !== 'checkedFingerprint')) : null, queue: projectQueue(queue), status, statusLabel: { unbound: '未关联', unchecked: '待核对', matched: '成员一致', different: '成员有差异', stale: '需重新核对', unavailable: '配置不可用', error: '读取失败' }[status], memberComparison, skillComparison, checkedAt: binding?.checkedAt || '', message, revision: snapshot.revision, blockedReason: busyReason(group, binding), simulation: true };
  }
  function queueBinding(queue, value = snapshot) {
    const found = value.bindings.filter(b => b.enterpriseId === queue.enterpriseId && b.qno === queue.qno);
    const invalid = found.some(binding => { const group = groupFor(binding.physicalGroupId); return !(binding.tenantId === queue.tenantId && group && group.enterpriseId === queue.enterpriseId && group.tenantId === queue.tenantId && canView(group)); });
    const bindings = invalid ? [] : found, groups = bindings.map(b => groupFor(b.physicalGroupId));
    return { bindings, groups, binding: bindings[0] || null, group: groups[0] || null, invalid };
  }
  function queueBusyReason(queue, value = snapshot, includeRoutes = false) {
    const related = queueBinding(queue, value);
    if (related.invalid) return '队列关联归属发生变化，请先核对配置';
    return related.groups.map((g,i) => busyReason(g, related.bindings[i], includeRoutes)).find(Boolean) || '';
  }
  function queueDescription(queue) {
    const related = queueBinding(queue), group = related.group;
    const current = group ? describeGroup(group) : null;
    if (errorMessage) return null;
    const memberComparison = current?.memberComparison || compare({ enterpriseId: queue.enterpriseId, tenantId: queue.tenantId, physicalGroupId: null }, queue);
    const unavailable = related.invalid || queue.status !== 'ACTIVE';
    const status = unavailable ? 'unavailable' : current?.status || 'unbound';
    const blockedReason = related.invalid ? '队列关联归属发生变化，请先核对配置' : queue.status !== 'ACTIVE' ? '该队列已暂停，当前仅可查看' : queueBusyReason(queue);
    const groups = related.groups.map(g => ({ physicalGroupId:g.physicalGroupId,name:g.name,tenantId:g.tenantId,enterpriseId:g.enterpriseId, providerSkillId:expectedSkill(g), skillLevel:(queue.queueSkills || []).find(s=>s.skillId===expectedSkill(g))?.skillLevel ?? null }));
    const bindings = related.bindings.map(b => Object.fromEntries(Object.entries(clone(b)).filter(([key]) => key !== 'checkedFingerprint')));
    return {
      queue: projectQueue(queue), tenantName: (data.tenants || []).find(t => t.tenantId === queue.tenantId && t.enterpriseId === queue.enterpriseId)?.name || queue.tenantId,
      bindings, groups, binding: bindings[0] || null, group: groups[0] || null,
      memberComparison, skillComparison: current?.skillComparison || { expectedSkillId: null, expectedSkillIds: [], actualSkillIds: (queue.queueSkills || []).map(s => s.skillId), matched: false },
      status, statusLabel: unavailable ? '配置不可用' : current?.statusLabel || '未关联', checkedAt: current?.checkedAt || '',
      message: unavailable ? blockedReason : current?.message || '尚未关联技能，可先维护队列的接听设置',
      revision: snapshot.revision, blockedReason, editable: !blockedReason, simulation: true
    };
  }
  function describeQueue(qno) {
    if (typeof qno !== 'string' || !qno || !canAccess() || !refresh()) return null;
    const queue = snapshot.queues.find(q => q.qno === qno && queueInScope(q));
    const detail = queue && queueDescription(queue);
    return detail ? clone(detail) : null;
  }
  function catalog() {
    if (!canAccess() || !refresh()) return [];
    const rows = [];
    for (const queue of snapshot.queues.filter(queueInScope)) {
      const detail = queueDescription(queue);
      if (!detail || errorMessage) return [];
      rows.push({ ...detail.queue, localUpdatedAt: [detail.queue.localUpdatedAt, ...detail.bindings.map(b=>b.updatedAt)].filter(Boolean).sort((a,b)=>Date.parse(b)-Date.parse(a))[0] || '', tenantName: detail.tenantName, params: Object.fromEntries(parameterKeys.filter(k => Object.hasOwn(queue, k)).map(k => [k, queue[k]])), physicalGroupId: detail.group?.physicalGroupId || '', groupName: detail.group?.name || '', groupIds: detail.groups.map(g => g.physicalGroupId), groupNames: detail.groups.map(g => g.name), memberCount: detail.memberComparison.actual.length, bindingStatus: detail.status, bindingStatusLabel: detail.statusLabel, revision: detail.revision });
    }
    return clone(rows);
  }
  function markUpdatedQueues(previous, next) {
    const savedAt = new Date().toISOString();
    for (const queue of next.queues) {
      const before = previous.queues.find(row => queueKey(row) === queueKey(queue));
      const bindings = rows => rows.filter(row => queueKey(row) === queueKey(queue));
      if (!before || JSON.stringify(before) !== JSON.stringify(queue) || JSON.stringify(bindings(previous.bindings)) !== JSON.stringify(bindings(next.bindings))) queue.localUpdatedAt = savedAt;
    }
  }
  function failure(message) { return { ok: false, message, revision: snapshot.revision }; }
  function transact(input, expectedContext, expectedRevision, operation) {
    const group = groupFor(input);
    if (!canManage(group)) return failure('仅超级管理员或本租户管理员可维护当前范围的接听配置');
    if (contextKey() !== expectedContext) return failure('登录或租户范围已变化，请重新打开接听配置');
    let latest;
    try { latest = read(); } catch (error) { errorMessage = error.message; return failure(errorMessage); }
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== latest.value.revision || snapshot.revision !== latest.value.revision) return failure('队列关联已更新，请刷新后重新打开配置');
    const next = clone(latest.value); let result;
    try { result = operation(group, next); } catch (_) { return failure('队列配置校验未完成，请刷新后重试，原记录已保留'); }
    if (result?.ok === false) return result;
    if (result?.unchanged) return { ok: true, message: '关联未变化', revision: snapshot.revision, unchanged: true };
    markUpdatedQueues(latest.value, next);
    next.revision++;
    try {
      if (localStorage.getItem(storageKey) !== latest.raw) return failure('队列关联已更新，请刷新后重新打开配置');
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (_) { return failure('保存失败，请检查浏览器存储后重试，原关联已保留'); }
    snapshot = next; rawSeen = JSON.stringify(next); errorMessage = '';
    return { ok: true, message: result?.message || '接听队列关联已保存', revision: snapshot.revision, ...(result?.request ? { request: clone(result.request) } : {}), ...(result?.requests ? { requests: clone(result.requests) } : {}) };
  }
  function bindingFor(group, qno) { return { enterpriseId:group.enterpriseId, tenantId:group.tenantId, physicalGroupId:group.physicalGroupId, qno, checkedAt:'', checkedFingerprint:'', updatedAt:new Date().toISOString(), updatedBy:window.AppState.get().accountId, simulation:true }; }
  function invalidateBindings(queue, next) {
    for (const b of next.bindings.filter(b => b.enterpriseId === queue.enterpriseId && b.qno === queue.qno)) Object.assign(b, { checkedAt:'',checkedFingerprint:'',updatedAt:new Date().toISOString(),updatedBy:window.AppState.get().accountId });
  }
  function groupsInput(groupIds, queue, next, allowEmpty = true) {
    if (!Array.isArray(groupIds) || !allowEmpty && !groupIds.length || groupIds.some(id => !validText(id)) || new Set(groupIds).size !== groupIds.length) return failure('请选择有效且不重复的技能');
    const groups = groupIds.map(groupFor);
    if (groups.some(g => !g || !canManage(g) || g.enterpriseId !== queue.enterpriseId || g.tenantId !== queue.tenantId)) return failure('只能关联当前账号及当前租户的技能');
    if (groups.some(g => g.status !== '已启用' || g.syncStatus !== '同步成功')) return failure('请选择已启用且配置成功的技能');
    if (groups.some(g => next.bindings.some(b => b.enterpriseId === g.enterpriseId && b.physicalGroupId === g.physicalGroupId && b.qno !== queue.qno))) return failure('所选技能已关联其他队列，请先解除原关联');
    return { ok:true, groups };
  }
  function ensureSkill(group, next, queue) {
    const known = expectedSkill(group, next);
    const skillId = known || Math.max(1000,...fixture.supplierSkills.map(s=>s.skillId),...next.queues.flatMap(q=>[...(q.queueSkills || []).map(s=>s.skillId),...(q.skillMappings || []).map(m=>m.skillId),q.configuredSkillId || 0]),...(queue.skillMappings || []).map(m=>m.skillId)) + 1;
    if (!known) { queue.skillMappings = queue.skillMappings || []; queue.skillMappings.push({physicalGroupId:group.physicalGroupId,skillId}); queue.demoSkillId = true; }
    return skillId;
  }
  function applyGroups(queue, groups, next) {
    const related = queueBinding(queue, next);
    if (related.invalid) return failure('队列关联归属发生变化，请先核对配置');
    const beforeIds = related.groups.map(g=>g.physicalGroupId), afterIds = groups.map(g=>g.physicalGroupId);
    const ids = groups.map(g=>ensureSkill(g,next,queue));
    if (new Set(ids).size !== ids.length) return failure('所选技能对应同一供应商技能，请先核对技能配置');
    const currentSkills = queue.queueSkills || [];
    if (beforeIds.length === afterIds.length && beforeIds.every(id=>afterIds.includes(id)) && currentSkills.length === ids.length && currentSkills.every(s=>ids.includes(s.skillId))) return {unchanged:true};
    const busy = queueBusyReason(queue,next); if (busy) return failure(busy);
    for (const group of related.groups.filter(g=>!afterIds.includes(g.physicalGroupId))) { const blocked = busyReason(group,related.bindings.find(b=>b.physicalGroupId===group.physicalGroupId)); if (blocked) return failure(blocked); }
    const nextSkills = ids.map(skillId => clone(currentSkills.find(s=>s.skillId===skillId) || {skillId,skillLevel:1}));
    const requests = currentSkills.filter(s=>!ids.includes(s.skillId)).map(s=>({endpoint:'/interface/v10/queueSkill/delete',enterpriseId:queue.enterpriseId,fields:{qno:queue.qno,skillId:s.skillId},simulation:true}));
    nextSkills.filter(s=>!currentSkills.some(old=>old.skillId===s.skillId)).forEach(s=>requests.push({endpoint:'/interface/v10/queueSkill/create',enterpriseId:queue.enterpriseId,fields:{qno:queue.qno,skillId:s.skillId,skillLevel:s.skillLevel},simulation:true}));
    queue.queueSkills = nextSkills;
    next.bindings = next.bindings.filter(b=>!(b.enterpriseId===queue.enterpriseId && b.qno===queue.qno));
    next.bindings.push(...groups.map(g=>bindingFor(g,queue.qno)));
    return {message:groups.length ? '队列技能关联已保存，请重新核对成员' : '已解除全部技能关联',requests};
  }
  function saveQueueGroups(qno, groupIds, expectedContext, expectedRevision) {
    return transactQueue(qno,expectedContext,expectedRevision,(queue,next)=>{const selected=groupsInput(groupIds,queue,next);return selected.ok ? applyGroups(queue,selected.groups,next) : selected;});
  }
  function saveBinding(groupId, qno, expectedContext, expectedRevision) {
    if (typeof qno !== 'string') return failure('请选择有效的队列编号');
    return transact(groupId,expectedContext,expectedRevision,(group,next)=>{
      const before=next.bindings.find(b=>b.enterpriseId===group.enterpriseId && b.physicalGroupId===group.physicalGroupId);
      if ((before?.qno || '')===qno && (!before || before.tenantId===group.tenantId)) return {unchanged:true};
      const blocked=busyReason(group,before);if(blocked)return failure(blocked);
      const target=qno && next.queues.find(q=>q.enterpriseId===group.enterpriseId && q.qno===qno && q.tenantId===group.tenantId && q.status==='ACTIVE');
      if(qno && !target)return failure('请选择当前租户与 AliCti 账号下可用的接听队列');
      const requests=[];
      if(before){const old=next.queues.find(q=>q.enterpriseId===group.enterpriseId && q.qno===before.qno && q.tenantId===group.tenantId);if(!old)return failure('原队列归属已变化，请先核对配置');const result=applyGroups(old,relatedGroups(old,next).filter(g=>g.physicalGroupId!==group.physicalGroupId),next);if(result.ok===false)return result;requests.push(...result.requests || []);}
      if(target){const groups=[...relatedGroups(target,next),group],selected=groupsInput(groups.map(g=>g.physicalGroupId),target,next);if(!selected.ok)return selected;const result=applyGroups(target,selected.groups,next);if(result.ok===false)return result;requests.push(...result.requests || []);}
      return {message:qno?'接听队列关联已保存，请核对成员配置':'已解除接听队列关联',requests};
    });
  }
  function verify(groupId, expectedContext, expectedRevision = snapshot.revision) {
    return transact(groupId, expectedContext, expectedRevision, (group, next) => {
      const binding = next.bindings.find(b => b.enterpriseId === group.enterpriseId && b.tenantId === group.tenantId && b.physicalGroupId === group.physicalGroupId), queue = queueFor(binding);
      if (!binding || !queue || queue.tenantId !== group.tenantId || queue.status !== 'ACTIVE') return failure('请先关联当前租户可用的接听队列');
      const related=queueBinding(queue,next);if(related.invalid)return failure('队列关联归属发生变化，请先核对配置');
      for(const linked of related.bindings){linked.checkedAt=new Date().toISOString();linked.checkedFingerprint=fingerprint(groupFor(linked.physicalGroupId),linked,queue);}
      const compared = compare(group, queue), skills = compareSkills(group, queue);
      return { message: !skills.matched ? '核对完成，队列关联技能与当前技能不一致' : compared.missing.length || compared.extra.length ? '核对完成，成员配置存在差异' : '核对完成，关联与成员快照一致' };
    });
  }
  function normalizeForm(form) { if (!object(form)) return {}; const next = clone(form); if (Object.hasOwn(next, 'name')) { next.description = next.name; delete next.name; } return next; }
  function requestFor(endpoint, group, fields) { return { endpoint: '/interface/v10/queue/' + endpoint, enterpriseId: group.enterpriseId, fields: clone(fields), simulation: true }; }
  function createForGroups(groupIds, form, expectedContext, expectedRevision) {
    if(!Array.isArray(groupIds) || !groupIds.length)return failure('请至少选择一个技能');
    return transact(groupIds[0],expectedContext,expectedRevision,(group,next)=>{
      const shell={enterpriseId:group.enterpriseId,tenantId:group.tenantId,qno:typeof form?.qno==='string'?form.qno:'',skillMappings:[],demoSkillId:false};
      const selected=groupsInput(groupIds,shell,next,false);if(!selected.ok)return selected;
      if(selected.groups.some(g=>next.bindings.some(b=>b.enterpriseId===g.enterpriseId && b.physicalGroupId===g.physicalGroupId)))return failure('所选技能已有队列，请先处理原关联');
      const skills=selected.groups.map(g=>({skillId:ensureSkill(g,next,shell),skillLevel:1}));
      const contract=window.AliCtiQueueContracts?.createFields(normalizeForm(form),skills);
      if(!contract?.ok)return failure(contract?.errors?.join('；') || '队列配置暂不可用，请刷新后重试');
      const queue=contract.fields.queue;
      if(next.queues.some(q=>q.enterpriseId===group.enterpriseId && q.qno===queue.qno))return failure('该 AliCti 账号下队列号已存在，请选择其他编号或关联已有队列');
      // These are independent recorded supplier fixtures, not a client-side calculation of eligible members.
      const sources=selected.groups.map(g=>fixture.supplierSkills.find(s=>s.enterpriseId===g.enterpriseId && s.tenantId===g.tenantId && s.physicalGroupId===g.physicalGroupId));
      const cnos=[...new Set(sources.flatMap(s=>s?.cnos || []))].filter(cno=>!retiredMemberCno(cno,group.enterpriseId));
      next.queues.push({...shell,...queue,name:queue.description,status:'ACTIVE',statusLabel:'可关联',strategyLabel:window.AliCtiQueueContracts.strategies[queue.strategy],cnos,queueSkills:clone(contract.fields.queueSkills),demoSkillId:shell.demoSkillId || sources.some(s=>s?.demoSkillId),simulation:true});
      next.bindings.push(...selected.groups.map(g=>bindingFor(g,queue.qno)));
      return {message:'接听队列已创建并关联所选技能，请核对成员配置',request:requestFor('create',group,contract.fields)};
    });
  }
  function createForGroup(groupId, form, expectedContext, expectedRevision) { return createForGroups([groupId],form,expectedContext,expectedRevision); }
  function updateQueue(groupId, form, expectedContext, expectedRevision) {
    return transact(groupId, expectedContext, expectedRevision, (group, next) => {
      const binding = next.bindings.find(b => b.enterpriseId === group.enterpriseId && b.tenantId === group.tenantId && b.physicalGroupId === group.physicalGroupId);
      const queue = binding && next.queues.find(q => q.enterpriseId === group.enterpriseId && q.tenantId === group.tenantId && q.qno === binding.qno);
      if (!queue || queue.status !== 'ACTIVE') return failure('请先关联当前租户可用的接听队列');
      return applyQueueUpdate(queue, next, form);
    });
  }
  function applyQueueUpdate(queue, next, form) {
    const busy = queueBusyReason(queue,next); if (busy) return failure(busy);
    const binding = queueBinding(queue,next).binding;
    const input = normalizeForm(form);
    if (Object.hasOwn(input, 'qno') && input.qno !== queue.qno) return failure('队列编号不能修改');
    delete input.qno;
    const contract = window.AliCtiQueueContracts?.updateFields(queue.qno, input);
    if (!contract?.ok) return failure(contract?.errors?.join('；') || '队列配置暂不可用，请刷新后重试');
    Object.assign(queue, contract.fields.queue); queue.name = queue.description; queue.strategyLabel = window.AliCtiQueueContracts.strategies[queue.strategy];
    invalidateBindings(queue,next);
    return { message: binding ? '接听队列配置已保存，请重新核对' : '队列配置已保存', request: requestFor('update', queue, contract.fields) };
  }
  function transactQueue(qno, expectedContext, expectedRevision, operation) {
    if (!canAccess() || typeof qno !== 'string' || !qno) return failure('仅超级管理员或本租户管理员可维护当前范围的队列');
    if (contextKey() !== expectedContext) return failure('登录或租户范围已变化，请重新打开队列配置');
    let latest;
    try { latest = read(); } catch (error) { errorMessage = error.message; return failure(errorMessage); }
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== latest.value.revision || snapshot.revision !== latest.value.revision) return failure('队列配置已更新，请刷新后重新打开配置');
    const next = clone(latest.value), queue = next.queues.find(q => q.qno === qno && queueInScope(q));
    if (!queue) return failure('当前工作范围内找不到该队列');
    if (queue.status !== 'ACTIVE') return failure('该队列已暂停，当前仅可查看');
    const related = queueBinding(queue, next);
    if (related.invalid) return failure('队列关联归属发生变化，请先核对配置');
    let result;
    try { result = operation(queue,next); } catch (_) { return failure('队列配置校验未完成，请刷新后重试，原记录已保留'); }
    if (result?.ok === false) return result;
    if(result?.unchanged)return {ok:true,message:'关联未变化',revision:snapshot.revision,unchanged:true};
    markUpdatedQueues(latest.value, next);
    next.revision++;
    try {
      if (!queueInScope(queue) || contextKey() !== expectedContext) return failure('登录或租户范围已变化，请重新打开队列配置');
      if (localStorage.getItem(storageKey) !== latest.raw) return failure('队列配置已更新，请刷新后重新打开配置');
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (_) { return failure('保存失败，请检查浏览器存储后重试，原配置已保留'); }
    snapshot = next; rawSeen = JSON.stringify(next); errorMessage = '';
    return { ok: true, message: result.message, revision: snapshot.revision, ...(result.request ? {request:clone(result.request)} : {}), ...(result.requests ? {requests:clone(result.requests)} : {}) };
  }
  function updateByNumber(qno, form, expectedContext, expectedRevision) { return transactQueue(qno,expectedContext,expectedRevision,(queue,next)=>applyQueueUpdate(queue,next,form)); }
  refresh();
  window.addEventListener?.('storage', event => { if (event.key === storageKey) refresh(); });
  window.AliCtiQueues = { contextKey, canAccess, canView, canManage, catalog, describeQueue, updateByNumber, options, describe, saveBinding, saveQueueGroups, createForGroup, createForGroups, updateQueue, verify, revision, refresh, storageError: () => errorMessage };
})();
