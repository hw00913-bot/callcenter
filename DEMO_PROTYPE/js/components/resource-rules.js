/** Shared checks keep configuration, readiness and task execution on the same resources. */
(function () {
  'use strict';
  const data = CloudCallData;
  let serial = 0;
  function id(prefix) { return prefix + '-' + Date.now() + '-' + (++serial); }
  function members(group) {
    return data.agentSkills.filter(r => r.physicalGroupId === group.physicalGroupId && r.status === '已生效').filter(r =>
      data.agents.some(a => a.contactCenterIdentityId === r.identityId && a.tenantId === group.tenantId &&
        a.instanceId === group.instanceId && a.lifecycleStatus === '已启用' && a.acceptNewTasks !== false));
  }
  function recount() { data.physicalSkillGroups.forEach(g => { g.memberCount = members(g).length; }); }
  function usableNumber(n, tenantId, direction) {
    const tenant = data.tenants.find(t => t.tenantId === tenantId);
    const line = n && data.lines.find(l => l.lineId === n.lineId);
    return !!(n && tenant && n.instanceId === tenant.instanceId && n.businessStatus === '正常' &&
      n.authorizedTenantIds.includes(tenantId) && String(n.usage).includes(direction || '呼出') &&
      line && (line.instanceIds || [line.instanceId]).includes(n.instanceId) && line.pocStatus === '已通过' &&
      !['已停用','已隔离','已解绑'].includes(line.status));
  }
  function numberBound(n, queueId) {
    return !!(n && queueId && (n.boundSkillGroupIds || []).includes(queueId));
  }
  function campaignError(plan) {
    if (!['预外呼','IVR 外呼'].includes(plan.callType)) return '';
    const queue = data.physicalSkillGroups.find(g => g.skillGroupId === plan.executionQueueId);
    if (!queue || queue.tenantId !== plan.tenantId || queue.instanceId !== plan.instanceId || queue.status !== '已启用') return '请由管理员配置本租户有效的执行队列';
    if (plan.callType === '预外呼' && plan.executionQueueId !== plan.targetSkillGroupId) return '预外呼执行队列必须对应所选服务团队';
    const usage = plan.callType === '预外呼' ? '预外呼' : 'IVR外呼';
    if (!data.contactFlows.some(f => f.contactFlowId === plan.contactFlowId && f.instanceId === plan.instanceId && f.status === '已发布' && f.usage === usage)) return '请由管理员配置同品牌、同呼叫方式的已发布语音流程';
    return '';
  }
  function validatePlan(plan, requireMembers) {
    if (!plan) return '未找到呼叫配置';
    const tenant = data.tenants.find(t => t.tenantId === plan.tenantId);
    if (!tenant || tenant.instanceId !== plan.instanceId || !tenant.capabilitySet.includes('CLOUD_CONTACT_CENTER')) return '请选择已开通云呼叫的同品牌租户';
    if (!plan.name?.trim()) return '缺少配置名称';
    const direction = plan.callType === '呼入' ? '呼入' : '呼出';
    if (!plan.allowedCallerNumberIds?.length) return '请选择至少一个可用号码';
    if (!plan.allowedCallerNumberIds.every(key => usableNumber(data.phoneNumbers.find(n => n.numberId === key), plan.tenantId, direction))) return '号码未授权、已隔离或所属线路尚未通过验证，请重新选择';
    const activityError = campaignError(plan); if (activityError) return activityError;
    if (direction === '呼出' && !plan.allowedCallerNumberIds.every(key => numberBound(data.phoneNumbers.find(n => n.numberId === key), plan.executionQueueId || plan.targetSkillGroupId))) return '号码尚未绑定所选服务团队，请联系管理员维护号码绑定';
    if (plan.callType === 'IVR 外呼') {
      if (!data.contactFlows.some(f => f.contactFlowId === plan.contactFlowId && f.instanceId === plan.instanceId && f.status === '已发布' && f.usage === 'IVR外呼')) return '请选择同品牌已发布的 IVR 外呼流程';
    }
    if (plan.callType !== 'IVR 外呼' || plan.transferEnabled) {
      const group = data.physicalSkillGroups.find(g => g.skillGroupId === plan.targetSkillGroupId);
      if (!group || group.tenantId !== plan.tenantId || group.instanceId !== plan.instanceId || group.status !== '已启用') return '请选择该租户已启用的服务团队';
      if (requireMembers && !members(group).length) return '所选服务团队没有可接收任务的已启用坐席';
    }
    return '';
  }
  function error(layerId, message) {
    const layer = document.getElementById(layerId);
    if (!layer) return showToast(message,'warning');
    let el = layer.querySelector('.form-error');
    if (!el) { el = document.createElement('p'); el.className = 'form-error'; el.setAttribute('role','alert'); layer.querySelector('.layer-body').append(el); }
    el.textContent = message; el.scrollIntoView({block:'nearest'});
  }
  function changed(tenantId, types) {
    (data.scenarioTests || []).filter(t => t.tenantId === tenantId && (!types || types.includes(t.scenarioType)) && t.status === 'PASS').forEach(t => { t.status = 'STALE'; t.summary = '相关配置已发生变更，需要重新验证。'; });
  }
  window.CloudResourceRules = { id, members, recount, usableNumber, numberBound, campaignError, validatePlan, error, changed };
})();
