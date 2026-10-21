/** Local softphone configuration. A saved empty value explicitly means unconfigured. */
(function (root) {
  'use strict';
  const storageKey = 'alicti-seat-phone-config-v1', saving = new Set();
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const text = value => typeof value === 'string' && value.length > 0 && value === value.trim();
  const validValue = value => typeof value === 'string' && (value === '' || /^\d+$/.test(value));
  const state = () => root.AppState?.get?.() || {};
  const access = () => root.AppState?.effectiveAccess?.() || {};
  const context = () => { const s = state(), a = access(); return JSON.stringify([s.accountId, s.sessionId, s.activeDomain, s.enterpriseId, s.tenantId, a.roleCode, a.valid]); };
  const keyFor = agent => JSON.stringify([agent.enterpriseId, agent.tenantId, agent.contactCenterIdentityId, agent.cno]);
  const fail = message => ({ ok: false, value: '', message });
  let revisionSeen = 0, rawSeen = null;

  function canonical(agent) {
    const rows = (root.CloudCallData?.agents || []).filter(row => row.contactCenterIdentityId === agent?.contactCenterIdentityId);
    const row = rows[0];
    if (rows.length !== 1 || !row || ![row.enterpriseId, row.tenantId, row.contactCenterIdentityId, row.cno].every(text) || row.lifecycleStatus === '已删除') return null;
    return row.enterpriseId === agent.enterpriseId && row.tenantId === agent.tenantId && row.cno === agent.cno ? row : null;
  }
  function scopeError(agent, write = false) {
    const s = state(), a = access(), app = root.AppState;
    if (!agent || !a.valid || !s.accountId || !s.sessionId || s.activeDomain !== 'CLOUD_CONTACT_CENTER' || app?.isReady?.() === false || s.enterpriseId !== agent.enterpriseId || !app?.authorizeObject?.('', agent)) return '当前账号无权查看或维护该坐席的分机号';
    if (!write) return '';
    if (!['ADMIN', 'SUPER_ADMIN'].includes(a.roleCode) || a.roleCode === 'ADMIN' && s.tenantId !== agent.tenantId) return '仅本租户管理员或超级管理员可配置软电话分机号';
    const tenant = root.CloudCallData.tenants.find(row => row.tenantId === agent.tenantId && row.enterpriseId === agent.enterpriseId);
    if (!tenant || tenant.builtIn || tenant.status !== '启用' || !tenant.capabilitySet?.includes('CLOUD_CONTACT_CENTER')) return '请先启用该租户的云联络中心';
    return '';
  }
  function stored() {
    const raw = root.localStorage.getItem(storageKey);
    if (raw === null) {
      if (revisionSeen) throw Error('软电话分机配置已移除，请刷新后核对');
      return { raw, data: { schemaVersion: 1, revision: 0, extensions: {}, updatedAtBySeat: {} } };
    }
    const data = JSON.parse(raw);
    if (!object(data) || data.schemaVersion !== 1 || !Number.isSafeInteger(data.revision) || data.revision < 1 || !object(data.extensions) || Object.keys(data).some(k => !['schemaVersion', 'revision', 'extensions', 'updatedAtBySeat'].includes(k))) throw Error('分机配置格式无效');
    for (const [key, value] of Object.entries(data.extensions)) {
      const parts = JSON.parse(key);
      if (!Array.isArray(parts) || parts.length !== 4 || !parts.every(text) || !validValue(value)) throw Error('分机配置格式无效');
    }
    if (data.updatedAtBySeat !== undefined && (!object(data.updatedAtBySeat) || Object.entries(data.updatedAtBySeat).some(([key, value]) => !Object.hasOwn(data.extensions, key) || typeof value !== 'string' || !Number.isFinite(Date.parse(value))))) throw Error('分机更新时间格式无效');
    if (data.revision < revisionSeen || data.revision === revisionSeen && rawSeen !== null && raw !== rawSeen) throw Error('分机配置版本冲突');
    revisionSeen = data.revision; rawSeen = raw;
    return { raw, data };
  }
  // Keep the timestamp in the same transaction as the extension; no second storage write can partially succeed.
  function applyUpdateStamp(agent, loaded) {
    const updatedAt = loaded.data.updatedAtBySeat?.[keyFor(agent)];
    if (updatedAt && (!Number.isFinite(Date.parse(agent.localUpdatedAt)) || Date.parse(updatedAt) > Date.parse(agent.localUpdatedAt))) agent.localUpdatedAt = updatedAt;
    return updatedAt || '';
  }
  function configured(agent, loaded) {
    applyUpdateStamp(agent, loaded);
    const key = keyFor(agent);
    if (Object.hasOwn(loaded.data.extensions, key)) return loaded.data.extensions[key];
    // Existing explicit local configuration and immutable demo fixtures may supply initial data.
    // No migration, number allocation, or derivation from cno/mobile is performed here.
    if (Object.hasOwn(agent, 'softphoneExtension')) return agent.softphoneExtension;
    const preference = root.AliCtiDemo?.phoneSettings?.[agent.contactCenterIdentityId];
    if (preference && Object.hasOwn(preference, 'bindTel')) return preference.bindTel;
    const receipt = root.AliCtiSeatOperationFixtures?.seats?.find(row => row.enterpriseId === agent.enterpriseId && row.tenantId === agent.tenantId && row.cno === agent.cno && row.bindType === 3);
    if (receipt && Object.hasOwn(receipt, 'bindTel')) return receipt.bindTel;
    if (Object.hasOwn(agent, 'demoBindTel')) return agent.demoBindTel;
    return '';
  }
  // Directory occupancy scans must see saved/legacy values without recursively
  // checking directory eligibility. Invalid storage throws so callers fail closed.
  function assignedValue(agent) {
    const row = canonical(agent);
    return row ? configured(row, stored()) : '';
  }
  function selection(agent, value, loaded) {
    const directory = root.AliCtiExtensions, revision = directory?.directoryRevision?.();
    if (!directory?.checkSelection || !Number.isSafeInteger(revision) || revision < 0) return { ok: false, revision: -1, message: '分机目录尚未就绪，请先同步可用分机' };
    if (!validValue(value)) return { ok: false, revision, message: '原分机配置不符合要求，请从可用分机中重新选择' };
    const checked = directory.checkSelection(agent, value);
    if (!checked?.ok) return { ...checked, ok: false, revision, message: checked?.message || '该分机不可使用，请重新选择' };
    if (checked.revision !== revision || directory.directoryRevision() !== revision) return { ok: false, revision, message: '分机目录已变化，请重新打开配置' };
    if (value && (root.CloudCallData?.agents || []).some(other => other !== agent && other.lifecycleStatus !== '已删除' && other.enterpriseId === agent.enterpriseId && configured(other, loaded) === value)) return { ok: false, revision, context: checked.context, message: '该分机已被当前企业的其他坐席选用，请选择其他分机' };
    return { ok: true, revision, context: checked.context, message: '' };
  }
  function read(agent) {
    const row = canonical(agent), error = scopeError(row);
    if (error) return fail(error);
    try {
      const loaded = stored(), value = configured(row, loaded);
      const selected = selection(row, value, loaded);
      return { ok: true, value, updatedAt: loaded.data.updatedAtBySeat?.[keyFor(row)] || '', eligible: !!value && selected.ok, revision: loaded.data.revision, context: context(), directoryRevision: selected.revision, directoryContext: selected.context,
        message: !selected.ok ? selected.message : value ? '' : '请由管理员在坐席维护中选择本租户的软电话分机' };
    } catch (_) { return fail('软电话分机配置无法读取，原记录已保留，请核对后重试'); }
  }
  function inactiveError(agent) {
    if (agent.currentCall || agent.currentEndpoint || !['离线', '未上线', '未登录'].includes(agent.agentStatus)) return '请先完成通话并下线，再配置软电话分机号；状态待核对时暂不可修改';
    const operation = root.AliCtiSeatOperations?.status?.(), session = operation?.session || root.AliCtiAdapter?.session;
    if (session && session.enterpriseId === agent.enterpriseId && session.tenantId === agent.tenantId && session.cno === agent.cno) return '请先将该坐席下线，再配置软电话分机号';
    const request = operation?.lastRequest;
    if ((operation?.pending || operation?.inFlight) && request?.enterpriseId === agent.enterpriseId && request?.cno === agent.cno) return '该坐席的电话操作尚未确认，请先核对状态';
    const management = root.AliCtiSeatOperations?.managementState?.();
    if ((management?.pending || management?.inFlight) && management.cno === agent.cno) return '该坐席的管理操作尚未确认，请先核对状态';
    return '';
  }
  async function save(identityId, value, options = {}) {
    const source = root.CloudCallData?.agents?.find(row => row.contactCenterIdentityId === identityId), agent = canonical(source);
    const error = scopeError(agent, true); if (error) return fail(error);
    if (!validValue(value)) return fail('请从本租户的可用软电话分机中选择，或留空表示待配置');
    if (saving.has(identityId)) return fail('分机配置正在保存，请稍候');
    if (!root.navigator?.locks?.request) return fail('当前浏览器无法校验坐席使用状态，请通过本地预览地址在 Chrome 中操作');
    const captured = context(), capturedKey = keyFor(agent);
    saving.add(identityId);
    try {
      return await root.navigator.locks.request('alicti-seat-phone-config-v1', { ifAvailable: true }, async lock => {
        if (!lock) return fail('另一项分机配置正在保存，请稍后重试');
        return root.navigator.locks.request('unified-call-seat:' + identityId, { ifAvailable: true }, seatLock => {
          if (!seatLock) return fail('该坐席正在其他窗口使用，请先下线再配置分机号');
          const current = canonical(source), currentError = scopeError(current, true);
          if (currentError) return fail(currentError);
          if (context() !== captured || keyFor(current) !== capturedKey || options.expectedContext != null && options.expectedContext !== captured) return fail('账号、租户或坐席已变化，请重新打开配置');
          const activeError = inactiveError(current); if (activeError) return fail(activeError);
          const loaded = stored();
          if (options.expectedRevision != null && options.expectedRevision !== loaded.data.revision) return fail('分机配置已更新，请重新打开后操作');
          const selected = selection(current, value, loaded);
          if (!selected.ok) return fail(selected.message);
          if (options.expectedDirectoryRevision != null && options.expectedDirectoryRevision !== selected.revision || options.expectedDirectoryContext != null && options.expectedDirectoryContext !== selected.context) return fail('分机目录或分配范围已变化，请重新打开后选择');
          const changed = !Object.hasOwn(loaded.data.extensions, capturedKey) || loaded.data.extensions[capturedKey] !== value;
          const updatedAt = changed ? new Date().toISOString() : loaded.data.updatedAtBySeat?.[capturedKey] || '';
          const next = { ...loaded.data, revision: loaded.data.revision + 1, extensions: { ...loaded.data.extensions, [capturedKey]: value }, updatedAtBySeat: { ...(loaded.data.updatedAtBySeat || {}), ...(updatedAt ? { [capturedKey]: updatedAt } : {}) } };
          if (context() !== captured || root.localStorage.getItem(storageKey) !== loaded.raw) return fail('分机配置已变化，请重新打开后操作');
          const rechecked = selection(current, value, loaded);
          if (!rechecked.ok || rechecked.revision !== selected.revision || rechecked.context !== selected.context) return fail(rechecked.message || '分机目录已变化，请重新选择');
          const raw = JSON.stringify(next);
          root.localStorage.setItem(storageKey, raw);
          revisionSeen = next.revision; rawSeen = raw;
          applyUpdateStamp(current, {data:next});
          return { ok: true, value, updatedAt, eligible: !!value, revision: next.revision, context: captured, directoryRevision: selected.revision, directoryContext: selected.context, message: value ? '软电话分机已保存，下次上线使用' : '分机已清空，选择可用分机后才能上线' };
        });
      });
    } catch (_) { return fail('分机配置未保存，原值已保留，请保留输入后重试'); }
    finally { saving.delete(identityId); }
  }
  try { const loaded = stored(); for (const agent of root.CloudCallData?.agents || []) if (canonical(agent)) applyUpdateStamp(agent, loaded); } catch (_) { /* read() keeps the existing configuration error visible. */ }
  root.SeatPhoneConfig = Object.freeze({ read, assignedValue, extension: agent => { const result = read(agent); return result.ok && result.eligible ? result.value : ''; }, save });
})(window);
