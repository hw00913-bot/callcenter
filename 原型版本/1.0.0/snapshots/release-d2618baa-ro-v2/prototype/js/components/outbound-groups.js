/** Tenant-scoped outbound calling groups conforming to AliCti agentGroup API contracts.
 * Full support for 9 official AliCti agentGroup APIs with tenant isolation and single-group agent uniqueness.
 */
(function () {
  'use strict';
  const data = window.CloudCallData;
  if (!data) return;
  const storageKey = 'outbound-groups-v1';
  const clone = value => structuredClone(value);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const validText = value => typeof value === 'string' && value.trim().length > 0;
  const validGno = value => typeof value === 'string' && /^(?=.*[0-9])[a-zA-Z][a-zA-Z0-9]{1,19}$/.test(value.trim());

  function formatTime(d = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function generateGno(prefix = 'WH') {
    const cleanPrefix = /^[a-zA-Z]+$/.test(prefix) ? prefix.slice(0, 4) : 'WH';
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '0');
    const digit = Math.floor(Math.random() * 10);
    return `${cleanPrefix}${rand}${digit}`;
  }

  let snapshot = { schemaVersion: 1, revision: 0, groups: [] }, rawSeen = null, errorMessage = '';

  function contextKey() {
    const app = window.AppState, state = app?.get?.() || {}, access = app?.effectiveAccess?.() || {};
    return JSON.stringify([state.accountId || '', state.sessionId || '', app?.isSuper?.() ? 'SUPER_ADMIN' : access.roleCode || '', state.activeDomain || '', state.enterpriseId || '', state.tenantId || '']);
  }
  function canAccess() {
    const app = window.AppState, state = app?.get?.() || {}, access = app?.effectiveAccess?.() || {};
    return !!(state.accountId && state.sessionId && validText(state.enterpriseId) && app?.isReady?.() && access.valid &&
      state.activeDomain === 'CLOUD_CONTACT_CENTER' && app?.hasCapability?.('CLOUD_CONTACT_CENTER') && app?.canMenu?.('agents.manage') && (app.isSuper() || access.roleCode === 'ADMIN'));
  }
  function inScope(group) {
    if (!group) return false;
    const app = window.AppState, state = app.get();
    return group.enterpriseId === state.enterpriseId && app.authorizeObject('', group);
  }
  function canManage(group) { return canAccess() && inScope(group); }

  function validate(saved) {
    if (!object(saved) || saved.schemaVersion !== 1 || !Number.isSafeInteger(saved.revision) || saved.revision < 0 || !Array.isArray(saved.groups) || Object.keys(saved).some(k => !['schemaVersion', 'revision', 'groups'].includes(k))) throw Error('外呼组记录格式无效，原记录已保留');
    const fields = ['outboundGroupId', 'gno', 'name', 'comment', 'tenantId', 'enterpriseId', 'memberIdentityIds', 'revision', 'createTime', 'localUpdatedAt', 'mock', 'providerVerified', 'demoAgentGroup'];
    for (const group of saved.groups) {
      if (!object(group) || Object.keys(group).some(k => !fields.includes(k)) ||
        !['outboundGroupId', 'gno', 'name', 'tenantId', 'enterpriseId', 'createTime'].every(k => validText(group[k])) ||
        typeof group.comment !== 'string' || group.comment.length > 100 || group.name.length > 50 ||
        (group.demoAgentGroup !== undefined && group.demoAgentGroup !== group.gno) ||
        !Array.isArray(group.memberIdentityIds) || !group.memberIdentityIds.every(validText) ||
        !Number.isSafeInteger(group.revision) || group.revision < 0 ||
        group.mock !== true) throw Error('外呼组记录格式无效，原记录已保留');
      if (!validGno(group.gno)) throw Error('外呼组编号格式不正确，原记录已保留');
    }
    if (saved.groups.some(g => g.name.length > 60 || new Set(g.memberIdentityIds).size !== g.memberIdentityIds.length) ||
      new Set(saved.groups.map(g => [g.enterpriseId, g.tenantId, g.name].join('|'))).size !== saved.groups.length ||
      new Set(saved.groups.map(g => [g.enterpriseId, g.gno].join('|'))).size !== saved.groups.length ||
      new Set(saved.groups.map(g => g.outboundGroupId)).size !== saved.groups.length) {
      throw Error('外呼组记录存在重复编号或名称冲突，原记录已保留');
    }
    const memberships = new Set();
    for (const group of saved.groups) for (const id of group.memberIdentityIds) {
      const key = JSON.stringify([group.enterpriseId, id]);
      if (memberships.has(key)) throw Error('同一坐席属于多个外呼组，请先核对成员归属，原记录已保留');
      memberships.add(key);
    }
    return saved;
  }

  function read() {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) {
      if (snapshot.revision > 0) throw Error('外呼组存储已移除，请恢复原记录后重试');
      return { raw, value: { schemaVersion: 1, revision: 0, groups: [] } };
    }
    let parsed;
    try { parsed = JSON.parse(raw); } catch (error) { throw Error(error instanceof SyntaxError ? '外呼组记录损坏，原记录已保留' : error.message); }
    if (!object(parsed) || !Array.isArray(parsed.groups)) throw Error('外呼组记录格式无效，原记录已保留');

    const value = validate(parsed);
    if (value.revision < snapshot.revision || (value.revision === snapshot.revision && rawSeen !== null && raw !== rawSeen)) {
      throw Error('外呼组版本冲突，请恢复记录后重试');
    }
    return { raw, value };
  }

  function refresh() {
    try { const next = read(); snapshot = next.value; rawSeen = next.raw; errorMessage = ''; return true; }
    catch (error) { errorMessage = error.message || '外呼组记录暂时无法读取'; return false; }
  }
  function revision() { refresh(); return snapshot.revision; }

  function failure(message) { return { ok: false, message, revision: snapshot.revision }; }

  function transact(expectedContext, expectedRevision, operation) {
    if (!canAccess()) return failure('仅超级管理员或本租户管理员可维护当前范围的外呼组');
    if (expectedContext && contextKey() !== expectedContext) return failure('登录或租户范围已变化，请重新打开外呼组配置');
    let latest;
    try { latest = read(); } catch (error) { errorMessage = error.message; return failure(errorMessage); }
    if (expectedRevision !== undefined && (!Number.isSafeInteger(expectedRevision) || expectedRevision !== latest.value.revision || snapshot.revision !== latest.value.revision)) {
      return failure('外呼组已更新，请刷新后重新打开配置');
    }
    const next = clone(latest.value);
    let result;
    try { result = operation(next); } catch (e) { return failure(e.message || '外呼组校验未完成，请刷新后重试，原记录已保留'); }
    if (result?.ok === false) return result;
    if (result?.unchanged) return { ok: true, message: '外呼组未变化', revision: snapshot.revision, unchanged: true };
    next.revision++;
    if (result.group) result.group.revision = next.revision;
    const savedAt = new Date().toISOString();
    for (const group of next.groups) {
      const previous = latest.value.groups.find(old => old.outboundGroupId === group.outboundGroupId);
      if (!previous || JSON.stringify(previous) !== JSON.stringify(group)) group.localUpdatedAt = savedAt;
    }
    try {
      if (expectedContext && contextKey() !== expectedContext) return failure('登录或租户范围已变化，请重新打开外呼组配置');
      if (localStorage.getItem(storageKey) !== latest.raw) return failure('外呼组已更新，请刷新后重新打开配置');
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (_) { return failure('保存失败，请检查浏览器存储后重试，原外呼组已保留'); }
    snapshot = next; rawSeen = JSON.stringify(next); errorMessage = '';
    return { ok: true, message: result.message || '外呼组已保存', revision: snapshot.revision, ...(result.group ? { group: clone(result.group) } : {}), ...(result.data ? { data: clone(result.data) } : {}) };
  }

  // Deleted identities remain as history; current membership must never follow cno to a replacement identity.
  const currentAgents = () => (data.agents || []).filter(a => a.lifecycleStatus !== '已删除');
  function currentMemberIds(group) {
    return (group.memberIdentityIds || []).filter(id => !(data.agents || []).some(a => a.contactCenterIdentityId === id && a.tenantId === group.tenantId && a.enterpriseId === group.enterpriseId && a.lifecycleStatus === '已删除'));
  }
  function uniqueCurrentAgent(cno, enterpriseId) {
    const matches = currentAgents().filter(a => a.enterpriseId === enterpriseId && a.cno === cno);
    return matches.length === 1 ? matches[0] : null;
  }
  function normalizeMembers(ids, tenantId, enterpriseId) {
    if (!Array.isArray(ids) || ids.length > 1000 || ids.some(id => !validText(id)) || new Set(ids).size !== ids.length) return failure('请选择有效且不重复的成员');
    for (const id of ids) {
      const agent = currentAgents().find(a => a.contactCenterIdentityId === id);
      if (!agent || agent.tenantId !== tenantId || agent.enterpriseId !== enterpriseId || agent.lifecycleStatus !== '已启用' || !AliCtiFields.validExistingCno(agent.cno) ||
        currentAgents().filter(a => a.enterpriseId === enterpriseId && a.cno === agent.cno).length !== 1) {
        return failure('成员必须为当前租户、当前企业内已启用的坐席');
      }
    }
    return { ok: true, value: clone(ids) };
  }

  /**
   * AliCti official rule: One agent can only belong to one outbound group at any time.
   * Moving agents to targetGroup automatically removes them from any other group in the same enterprise.
   */
  function moveMembersToGroup(nextGroups, targetGroup, newMemberIds) {
    const targetSet = new Set(newMemberIds);
    const affected = nextGroups.filter(g => g.outboundGroupId === targetGroup.outboundGroupId || (g.enterpriseId === targetGroup.enterpriseId && g.memberIdentityIds.some(id => targetSet.has(id))));
    for (const group of affected) {
      if (!inScope(group)) throw Error('成员原外呼组不在当前工作范围，请核对归属');
      const used = references(group.outboundGroupId).filter(t => !['已完成', '已终止', '已结束', '已删除'].includes(t.status) || t.alictiTaskControlPending);
      if (used.length) throw Error('请先结束或删除关联任务后维护成员：' + used.map(t => t.name).join('、'));
    }
    let movedCount = 0;
    for (const other of nextGroups) {
      if (other.outboundGroupId === targetGroup.outboundGroupId || other.enterpriseId !== targetGroup.enterpriseId) continue;
      const originalCount = other.memberIdentityIds.length;
      other.memberIdentityIds = other.memberIdentityIds.filter(id => !targetSet.has(id));
      if (other.memberIdentityIds.length !== originalCount) {
        other.revision = (other.revision || 1) + 1;
        movedCount += (originalCount - other.memberIdentityIds.length);
      }
    }
    targetGroup.memberIdentityIds = [...targetSet];
    return movedCount;
  }

  function scopedTenants() {
    const app = window.AppState;
    return (data.tenants || []).filter(t => t.enterpriseId === app.get().enterpriseId && app.authorizeObject('', t) && t.status === '启用' && (t.capabilitySet || []).includes('CLOUD_CONTACT_CENTER'));
  }
  function tenantOptions() {
    if (!canAccess()) return [];
    return scopedTenants().map(t => ({ tenantId: t.tenantId, name: t.name || t.tenantId, enterpriseId: t.enterpriseId })).sort((a, b) => a.name.localeCompare(b.name));
  }

  function candidates(tenantId, enterpriseId) {
    if (!canAccess() || !validText(tenantId) || !validText(enterpriseId)) return [];
    const tenant = (data.tenants || []).find(t => t.tenantId === tenantId && t.enterpriseId === enterpriseId);
    if (!tenant || !window.AppState.authorizeObject('', tenant)) return [];
    if (!refresh()) return [];
    const currentGroups = snapshot.groups.filter(g => g.tenantId === tenantId && g.enterpriseId === enterpriseId);
    return (data.agents || []).filter(a => a.tenantId === tenantId && a.enterpriseId === enterpriseId && a.lifecycleStatus === '已启用')
      .map(a => {
        const assignedGroup = currentGroups.find(g => g.memberIdentityIds.includes(a.contactCenterIdentityId));
        return {
          contactCenterIdentityId: a.contactCenterIdentityId,
          userName: a.userName || '',
          cno: a.cno || '',
          mobile: a.mobile || '',
          assignedGroupId: assignedGroup?.outboundGroupId || null,
          assignedGroupName: assignedGroup?.name || null,
          assignedGno: assignedGroup?.gno || null
        };
      })
      .sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
  }

  function enrich(group) {
    const tenant = (data.tenants || []).find(t => t.tenantId === group.tenantId && t.enterpriseId === group.enterpriseId);
    const members = currentMemberIds(group).map(id => currentAgents().find(a => a.contactCenterIdentityId === id && a.tenantId === group.tenantId && a.enterpriseId === group.enterpriseId)).filter(Boolean);
    const gno = group.gno;
    return {
      ...clone(group),
      memberIdentityIds: currentMemberIds(group),
      providerVerified: false,
      gno,
      tenantName: tenant?.name || group.tenantId,
      memberCount: members.length,
      members: members.map(a => ({ localUpdatedAt:a.localUpdatedAt, updatedAt:a.updatedAt, createTime:a.createTime || a.supplierAgentSnapshot?.createTime, contactCenterIdentityId: a.contactCenterIdentityId, userName: a.userName || '', cno: a.cno || '', mobile: a.mobile || '' }))
    };
  }

  function list(filter = {}) {
    if (!canAccess() || !refresh()) return [];
    let result = snapshot.groups.filter(inScope);
    if (filter.tenantId) result = result.filter(g => g.tenantId === filter.tenantId);
    if (filter.gno) result = result.filter(g => (g.gno || g.demoAgentGroup) === filter.gno);
    if (filter.groupName) result = result.filter(g => g.name.includes(filter.groupName));
    return result.map(enrich).sort((a, b) => a.name.localeCompare(b.name));
  }

  function get(outboundGroupIdOrGno) {
    if (!canAccess() || !refresh() || !validText(outboundGroupIdOrGno)) return null;
    const group = snapshot.groups.find(g => (g.outboundGroupId === outboundGroupIdOrGno || g.gno === outboundGroupIdOrGno || g.demoAgentGroup === outboundGroupIdOrGno) && inScope(g));
    return group ? enrich(group) : null;
  }

  /**
   * Create an outbound group conforming to agentGroup/create API.
   * Bound strictly to 1 tenant within the enterprise.
   */
  function create(input, expectedContext, expectedRevision) {
    return transact(expectedContext, expectedRevision, next => {
      const name = String(input?.name || input?.groupName || '').trim();
      if (!name || name.length > 50) return failure('请输入 50 字以内的外呼组名称');
      const tenantId = String(input?.tenantId || '');
      const tenant = (data.tenants || []).find(t => t.tenantId === tenantId);
      if (!tenant || tenant.enterpriseId !== window.AppState.get().enterpriseId || !window.AppState.authorizeObject('', tenant)) {
        return failure('只能维护当前账号及当前范围内的租户外呼组');
      }
      if (tenant.status !== '启用' || !(tenant.capabilitySet || []).includes('CLOUD_CONTACT_CENTER')) {
        return failure('该租户未启用或尚未开通云联络中心');
      }
      if (next.groups.filter(g => g.enterpriseId === tenant.enterpriseId).length >= 1000) return failure('同一企业最多创建1000个外呼组');
      if (next.groups.some(g => g.tenantId === tenantId && g.enterpriseId === tenant.enterpriseId && g.name === name)) {
        return failure('该租户外呼组名称已存在，请更换名称');
      }

      let gno = String(input?.gno || '').trim();
      if (!gno) {
        // Automatically suggest compliant gno if not provided
        let candidate = generateGno();
        while (next.groups.some(g => (g.gno || g.demoAgentGroup) === candidate && g.enterpriseId === tenant.enterpriseId)) {
          candidate = generateGno();
        }
        gno = candidate;
      }
      if (!validGno(gno)) return failure('外呼组编号须为2-20位，以字母开头，且同时包含字母和数字');
      if (next.groups.some(g => (g.gno || g.demoAgentGroup) === gno && g.enterpriseId === tenant.enterpriseId)) {
        return failure('当前企业下外呼组编号已存在，请更换编号');
      }

      const comment = String(input?.comment || '').trim();
      if (comment.length > 100) return failure('外呼组描述长度不能超过 100 个字符');

      const members = normalizeMembers(Array.isArray(input?.memberIdentityIds) ? input.memberIdentityIds : [], tenantId, tenant.enterpriseId);
      if (!members.ok) return members;

      const outboundGroupId = window.CloudResourceRules?.id ? window.CloudResourceRules.id('OBG') : 'OBG-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
      const group = {
        outboundGroupId,
        gno,
        name,
        comment,
        tenantId,
        enterpriseId: tenant.enterpriseId,
        memberIdentityIds: [],
        revision: 0,
        createTime: formatTime(),
        mock: true,
        providerVerified: false,
        demoAgentGroup: gno
      };
      if (members.value.length) {
        moveMembersToGroup(next.groups, group, members.value);
      }
      next.groups.push(group);
      return { message: '外呼组已创建', group };
    });
  }

  /**
   * Update outbound group conforming to agentGroup/update API.
   */
  function update(outboundGroupIdOrGno, input, expectedContext, expectedRevision) {
    if (!validText(outboundGroupIdOrGno)) return failure('请选择要维护的外呼组');
    return transact(expectedContext, expectedRevision, next => {
      const group = next.groups.find(g => (g.outboundGroupId === outboundGroupIdOrGno || g.gno === outboundGroupIdOrGno) && inScope(g));
      if (!group || !inScope(group)) return failure('当前工作范围内找不到该外呼组');

      let modified = false;
      if (input?.name !== undefined || input?.groupName !== undefined) {
        const name = String(input.name || input.groupName || '').trim();
        if (!name || name.length > 50) return failure('请输入 50 字以内的外呼组名称');
        if (next.groups.some(g => g !== group && g.tenantId === group.tenantId && g.enterpriseId === group.enterpriseId && g.name === name)) {
          return failure('该租户外呼组名称已存在，请更换名称');
        }
        if (group.name !== name) { group.name = name; modified = true; }
      }

      if (input?.comment !== undefined) {
        const comment = String(input.comment || '').trim();
        if (comment.length > 100) return failure('外呼组描述长度不能超过 100 个字符');
        if (group.comment !== comment) { group.comment = comment; modified = true; }
      }

      if (!modified) return { unchanged: true };
      return { message: '外呼组信息已更新', group };
    });
  }

  /**
   * Delete outbound group conforming to agentGroup/delete API.
   */
  function deleteGroup(outboundGroupIdOrGno, expectedContext, expectedRevision) {
    if (!validText(outboundGroupIdOrGno)) return failure('请选择要删除的外呼组');
    return transact(expectedContext, expectedRevision, next => {
      const index = next.groups.findIndex(g => (g.outboundGroupId === outboundGroupIdOrGno || g.gno === outboundGroupIdOrGno) && inScope(g));
      if (index === -1) return failure('当前工作范围内找不到该外呼组');
      const group = next.groups[index];
      if (!inScope(group)) return failure('当前工作范围内找不到该外呼组');

      const used = references(group.outboundGroupId).filter(t => !['已完成', '已终止', '已结束', '已删除'].includes(t.status) || t.alictiTaskControlPending);
      if (used.length) return failure('存在在途任务正在使用此外呼组，请先结束或删除关联任务：' + used.map(t => t.name).join('、'));

      next.groups.splice(index, 1);
      return { message: '外呼组已成功删除', group };
    });
  }

  /**
   * Set members with official exclusion: automatically remove agents from other groups.
   */
  function setMembers(outboundGroupIdOrGno, memberIdentityIds, expectedContext, expectedRevision) {
    if (!validText(outboundGroupIdOrGno)) return failure('请选择要维护的外呼组');
    return transact(expectedContext, expectedRevision, next => {
      const group = next.groups.find(g => (g.outboundGroupId === outboundGroupIdOrGno || g.gno === outboundGroupIdOrGno) && inScope(g));
      if (!group || !inScope(group)) return failure('当前工作范围内找不到该外呼组');
      const used = references(group.outboundGroupId).filter(t => !['已完成', '已终止', '已结束', '已删除'].includes(t.status) || t.alictiTaskControlPending);
      if (used.length) return failure('请先结束或删除关联任务后维护成员：' + used.map(t => t.name).join('、'));

      const members = normalizeMembers(Array.isArray(memberIdentityIds) ? memberIdentityIds : [], group.tenantId, group.enterpriseId);
      if (!members.ok) return members;

      if (group.memberIdentityIds.length === members.value.length && group.memberIdentityIds.every((id, i) => id === members.value[i])) {
        return { unchanged: true };
      }

      const moved = moveMembersToGroup(next.groups, group, members.value);
      const msg = moved > 0 ? `外呼组成员已更新（${moved} 位坐席已自动从原外呼组移入）` : '外呼组成员已更新';
      return { message: msg, group };
    });
  }

  /**
   * Assign agents by cnos (agentGroup/assignAgent API).
   * Automatically moves agents from previous group to new group.
   */
  function assignAgent(gno, cnos, expectedContext, expectedRevision) {
    if (!validGno(gno)) return failure('外呼组编号须为2-20位，以字母开头，且同时包含字母和数字');
    const cnoList = Array.isArray(cnos) ? cnos : typeof cnos === 'string' ? cnos.split(',') : [];
    if (!cnoList.length || cnoList.length > 1000 || cnoList.some(cno => !AliCtiFields.validExistingCno(cno)) || new Set(cnoList).size !== cnoList.length) return failure('请提供不重复的字符串工号，保留前导零，每次最多1000位');

    return transact(expectedContext, expectedRevision, next => {
      const group = next.groups.find(g => g.gno === gno && inScope(g));
      if (!group || !inScope(group)) return failure('当前工作范围内找不到编号为 ' + gno + ' 的外呼组');

      const agents = cnoList.map(cno => uniqueCurrentAgent(cno, group.enterpriseId));
      if (agents.some(a => !a || a.tenantId !== group.tenantId)) {
        return failure('部分座席不属于当前租户或企业，请检查工号');
      }
      const validated = normalizeMembers(agents.map(a => a.contactCenterIdentityId), group.tenantId, group.enterpriseId);
      if (!validated.ok) return validated;
      const newIds = new Set(currentMemberIds(group));
      for (const a of agents) newIds.add(a.contactCenterIdentityId);

      if (newIds.size > 1000) return failure('同一外呼组最多包含1000位坐席');
      const moved = moveMembersToGroup(next.groups, group, [...newIds]);
      return { message: `分配成功${moved > 0 ? `，${moved} 位坐席已从原外呼组自动移入` : ''}`, group };
    });
  }

  /**
   * Unassign single agent from group (agentGroup/unassignAgent API).
   */
  function unassignAgent(gno, cno, expectedContext, expectedRevision) {
    if (!validGno(gno) || !validText(cno)) return failure('外呼组编号与座席工号不能为空');
    return transact(expectedContext, expectedRevision, next => {
      const group = next.groups.find(g => g.gno === gno && inScope(g));
      if (!group || !inScope(group)) return failure('当前工作范围内找不到编号为 ' + gno + ' 的外呼组');

      const agent = uniqueCurrentAgent(cno, group.enterpriseId);
      if (!agent || agent.tenantId !== group.tenantId || !currentMemberIds(group).includes(agent.contactCenterIdentityId)) {
        return failure('该座席未分配至此外呼组');
      }

      moveMembersToGroup(next.groups, group, currentMemberIds(group).filter(id => id !== agent.contactCenterIdentityId));
      return { message: '座席已成功解绑', group };
    });
  }

  /**
   * List assigned agents under group (agentGroup/listAssignedAgent API).
   */
  function listAssignedAgent(gno, filter = {}) {
    if (!canAccess() || !refresh() || !validGno(gno)) return { total: 0, agents: [] };
    const group = snapshot.groups.find(g => (g.gno === gno || g.demoAgentGroup === gno) && inScope(g));
    if (!group) return { total: 0, agents: [] };

    let members = currentMemberIds(group).map(id => currentAgents().find(a => a.contactCenterIdentityId === id && a.tenantId === group.tenantId && a.enterpriseId === group.enterpriseId)).filter(Boolean);
    if (filter.cno) members = members.filter(a => a.cno === filter.cno);
    if (filter.cname) members = members.filter(a => (a.userName || '').includes(filter.cname));

    return {
      total: members.length,
      agents: members.map(a => ({
        cno: a.cno,
        name: a.userName,
        enterpriseId: a.enterpriseId,
        tenantId: a.tenantId,
        contactCenterIdentityId: a.contactCenterIdentityId
      }))
    };
  }

  /**
   * Query outbound group of an agent by cno (agentGroup/queryAgentGroup API).
   */
  function queryAgentGroup(cno) {
    if (!canAccess() || !refresh() || !validText(cno)) return null;
    const app = window.AppState, state = app.get();
    const agent = uniqueCurrentAgent(cno, state.enterpriseId);
    if (!agent || !app.authorizeObject('', agent)) return null;

    const group = snapshot.groups.find(g => g.enterpriseId === agent.enterpriseId && g.tenantId === agent.tenantId && g.memberIdentityIds.includes(agent.contactCenterIdentityId));
    if (!group) return null;

    return {
      gno: group.gno || group.demoAgentGroup,
      groupName: group.name,
      comment: group.comment || '',
      tenantId: group.tenantId,
      outboundGroupId: group.outboundGroupId
    };
  }

  // Task execution and an operator's receiving flow read scoped groups without management rights.
  function forTask(id, scope) {
    if (!scope || !window.AppState?.isReady() || AppState.get().activeDomain !== 'CLOUD_CONTACT_CENTER' || !AppState.authorizeObject('', scope) || scope.enterpriseId !== AppState.get().enterpriseId || !refresh()) return null;
    const g = snapshot.groups.find(g => (g.outboundGroupId === id || g.gno === id || g.demoAgentGroup === id) && g.tenantId === scope.tenantId && g.enterpriseId === scope.enterpriseId);
    return g ? enrich(g) : null;
  }
  function choices(scope) {
    if (!refresh()) return [];
    return snapshot.groups.map(g => forTask(g.outboundGroupId, scope)).filter(Boolean);
  }
  const isGroup = value => Number(value?.callGroupType) === 2;
  function taskSource(row) { return row?.planSnapshot || row?.executionConfig || row || {}; }
  function references(id) {
    const group = snapshot.groups.find(g => (g.outboundGroupId === id || g.gno === id) && inScope(g));
    const aliases = new Set([id, group?.outboundGroupId, group?.gno].filter(Boolean));
    return [...new Map((data.tasks || []).filter(t => {
      const src = taskSource(t);
      return isGroup(src) && (aliases.has(src.outboundGroupId) || aliases.has(src.agentGroup)) && inScope(t) && (!group || (t.tenantId === group.tenantId && t.enterpriseId === group.enterpriseId));
    }).map(t => [t.taskId, t])).values()];
  }
  function resolve(value, scope) {
    const targetId = value?.outboundGroupId || value?.agentGroup;
    const g = forTask(targetId, scope);
    if (!g) return { ok: false, message: errorMessage || '请选择本租户有效的外呼组' };
    const frozen = value.outboundGroupSnapshot;
    if (frozen && (frozen.outboundGroupId !== g.outboundGroupId || frozen.tenantId !== g.tenantId || frozen.enterpriseId !== g.enterpriseId || (frozen.gno || frozen.demoAgentGroup) !== (g.gno || g.demoAgentGroup) || JSON.stringify(frozen.memberIdentityIds) !== JSON.stringify(g.memberIdentityIds))) {
      return { ok: false, message: '外呼组成员已变化，请重新选择外呼组并创建任务' };
    }
    if (!g.memberIdentityIds.length) return { ok: false, message: '外呼组暂无成员，请先维护成员' };
    const members = g.memberIdentityIds.map(id => (data.agents || []).find(a => a.contactCenterIdentityId === id));
    if (members.some(a => !a || a.tenantId !== g.tenantId || a.enterpriseId !== g.enterpriseId || a.lifecycleStatus !== '已启用' || a.acceptNewTasks === false || a.callEnabled === false || !AliCtiFields.validExistingCno(a.cno))) {
      return { ok: false, message: '外呼组存在已停用或不可外呼的坐席，请先核对成员' };
    }
    return { ok: true, group: g, members, snapshot: clone(frozen || g) };
  }
  function fields(value, scope) {
    if (!isGroup(value)) return {};
    const r = resolve(value, scope);
    return {
      callGroupType: 2,
      outboundGroupId: value.outboundGroupId,
      agentGroup: r.ok ? (r.group.gno || r.group.demoAgentGroup) : '',
      outboundGroupSnapshot: r.ok ? r.snapshot : null
    };
  }
  function canReceive(row, agent) {
    const source = taskSource(row), r = resolve(source, row);
    return r.ok && r.members.some(a => a.contactCenterIdentityId === agent?.contactCenterIdentityId);
  }
  const predictive = row => row?.callType === '预外呼' || Number(row?.providerType) === 1;
  function taskResources(row) {
    const sources = [row.planSnapshot, row.alictiMockTaskProperty, row.alictiControlResponse?.data?.taskProperty, row.alictiCreateDraft?.fields, row.executionConfig, row].filter(Boolean);
    const source = sources.find(v => Object.hasOwn(v, 'callGroupType') || Object.hasOwn(v, 'cnos') || v.agentGroup || v.outboundGroupId) || {};
    const groups = new Set(), cnos = new Set();
    if (isGroup(source) || source.agentGroup || source.outboundGroupId) {
      const group = snapshot.groups.find(g => g.enterpriseId === row.enterpriseId && (g.outboundGroupId === source.outboundGroupId || g.gno === source.agentGroup));
      const frozen = source.outboundGroupSnapshot;
      for (const value of [source.outboundGroupId, source.agentGroup, group?.outboundGroupId, group?.gno, frozen?.outboundGroupId, frozen?.gno]) if (value) groups.add(value);
      const ids = new Set([...(frozen?.memberIdentityIds || []), ...(group?.memberIdentityIds || [])]);
      for (const a of data.agents || []) if (a.enterpriseId === row.enterpriseId && ids.has(a.contactCenterIdentityId)) cnos.add(a.cno);
      for (const a of frozen?.members || []) if (a.cno) cnos.add(a.cno);
    } else {
      const seatSource = Object.hasOwn(source, 'cnos') ? source : sources.find(v => Object.hasOwn(v, 'cnos')) || source;
      const values = Array.isArray(seatSource.cnos) ? seatSource.cnos : typeof seatSource.cnos === 'string' ? seatSource.cnos.split(',') : [];
      for (const value of values) if (typeof value === 'string' && value.trim()) cnos.add(value.trim());
      // Legacy demonstration tasks store the selected skill instead of a cnos snapshot.
      if (!Object.hasOwn(seatSource, 'cnos')) {
        const skill = row.planSnapshot?.skillGroupId || row.executionConfig?.targetSkillGroupId || row.targetSkillGroupId;
        const group = (data.physicalSkillGroups || []).find(g => g.enterpriseId === row.enterpriseId && g.tenantId === row.tenantId && [g.skillGroupId, g.physicalGroupId].includes(skill));
        if (group) {
          const ids = new Set((data.agentSkills || []).filter(r => r.physicalGroupId === group.physicalGroupId && r.status === '已生效' && r.syncStatus !== '待提交').map(r => r.identityId));
          for (const a of data.agents || []) if (a.enterpriseId === row.enterpriseId && a.tenantId === row.tenantId && ids.has(a.contactCenterIdentityId)) cnos.add(a.cno);
        }
      }
    }
    return {groups, cnos};
  }
  function executionError(row) {
    if (!predictive(row)) return '';
    if (!refresh()) return errorMessage || '外呼组成员归属待核对';
    const source = taskSource(row);
    if (isGroup(source)) { const result = resolve(source, row); if (!result.ok) return result.message; }
    const own = taskResources(row);
    const tasks = [...(data.tasks || []), ...(data.predictiveTasks || []), ...(data.ivrTasks || [])];
    for (const other of tasks) {
      if ((other.taskId === row.taskId && other.tenantId === row.tenantId) || other.enterpriseId !== row.enterpriseId || !predictive(other) || other.displayOnly ||
          !(other.alictiTaskControlPending || ['执行中', '运行中'].includes(other.status) || Number(other.providerStatusCode) === 1)) continue;
      const resources = taskResources(other), visible = AppState.authorizeObject('', other);
      const name = visible ? other.name || other.taskId : '其他租户的预测任务';
      const pending = other.alictiTaskControlPending ? '状态待核对，暂不释放占用' : '运行中';
      if ([...own.groups].some(id => resources.groups.has(id))) return '此外呼组已被预测任务“' + name + '”占用（' + pending + '），同一外呼组不能同时运行两个预测任务。';
      const overlap = [...own.cnos].filter(cno => resources.cnos.has(cno));
      if (overlap.length) return '坐席' + (visible ? '（工号 ' + overlap.join('、') + '）' : '') + '已被预测任务“' + name + '”占用（' + pending + '），不能同时参与两个运行中的预测任务。';
    }
    return '';
  }

  refresh();
  window.addEventListener?.('storage', event => { if (event.key === storageKey) refresh(); });
  window.OutboundGroups = {
    forTask, choices, isGroup, taskSource, references, resolve, fields, canReceive, executionError,
    contextKey, canAccess, canManage, list, get, create, update, deleteGroup, setMembers,
    assignAgent, unassignAgent, listAssignedAgent, queryAgentGroup, candidates, tenantOptions,
    generateGno, revision, refresh, storageError: () => errorMessage
  };
})();
