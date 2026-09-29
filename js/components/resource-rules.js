/** Shared checks keep configuration, readiness and task execution on the same resources. */
(function () {
  'use strict';
  const data = CloudCallData;
  let serial = 0;
  function id(prefix) { return prefix + '-' + Date.now() + '-' + (++serial); }
  function members(group) {
    return data.agentSkills.filter(r => r.physicalGroupId === group.physicalGroupId && r.status === '已生效' && AliCtiFields.validSkillLevel(r.skillLevel)).filter(r =>
      data.agents.some(a => a.contactCenterIdentityId === r.identityId && a.tenantId === group.tenantId &&
        a.enterpriseId === group.enterpriseId && a.lifecycleStatus === '已启用' && a.acceptNewTasks !== false));
  }
  function recount() { data.physicalSkillGroups.forEach(g => { g.memberCount = members(g).length; }); }
  function usableNumber(n, tenantId, direction, callType) {
    const tenant = data.tenants.find(t => t.tenantId === tenantId);
    const owners = data.tenants.filter(t => !t.builtIn && t.tenantId !== 'TENANT-SUPER-BUILTIN' && t.enterpriseId === n?.enterpriseId);
    if (owners.length !== 1 || owners[0].tenantId !== tenantId) return false;
    const useDirection = direction || '呼出', raw = n?.alictiNumber;
    if (!n || !tenant || n.enterpriseId !== tenant.enterpriseId || n.businessStatus !== '正常' ||
      !Array.isArray(n.authorizedTenantIds) || n.authorizedTenantIds.length !== 1 || n.authorizedTenantIds[0] !== tenantId ||
      !String(n.usage).includes(useDirection)) return false;
    // Local lines are not supplier resources. Only the number's own use and status gate calls.
    if (useDirection === '呼出' && (n.localEnabled === false || n.aliyunUsage === 'Inbound' || [n.number,raw?.hotline].some(v => String(v || '').startsWith('400')))) return false;
    if (useDirection === '呼入' && n.aliyunUsage === 'Outbound') return false;
    if (raw) {
      if (Number(raw.status) !== 1) return false;
      if (useDirection !== '呼入') {
        const key = callType === '预外呼' || callType === 'IVR 外呼' ? 'isPredictiveLeft' : ['预览外呼','人工外呼'].includes(callType) ? 'isInUse' : null;
        if (key && Number(raw[key]) !== 1) return false;
        if (!key && !['isInUse','isPredictiveLeft','isSipLeft','isWebCallLeft'].some(k => Number(raw[k]) === 1)) return false;
      }
    }
    return true;
  }
  function campaignError(plan) {
    if (!['预外呼','IVR 外呼'].includes(plan.callType)) return '';
    if (plan.callType === '预外呼') {
      const isOutboundGroup = Number(plan.callGroupType) === 2;
      if (isOutboundGroup) {
        if (window.OutboundGroups?.resolve) {
          const obgRes = window.OutboundGroups.resolve(plan, plan);
          if (obgRes && !obgRes.ok) return obgRes.message;
        }
      } else if (plan.targetSkillGroupId) {
        const group = data.physicalSkillGroups.find(g => g.skillGroupId === plan.targetSkillGroupId);
        if (!group || group.tenantId !== plan.tenantId || group.enterpriseId !== plan.enterpriseId || group.status !== '已启用') return '请选择本租户有效的接听团队';
      } else {
        const cnos = Array.isArray(plan.cnos) ? plan.cnos : String(plan.cnos || '').split(',').filter(Boolean);
        if (!cnos.length) return '请选择参与本次外呼的坐席工号';
      }
    }
    if(plan.callType==='IVR 外呼'){const flow=window.AliCtiIvr?.resolve(plan,plan,data);return flow?.ok?'':flow?.message||'请先获取并选择当前组织可用的语音流程';}
    const usage = '预外呼';
    if (plan.contactFlowId && !data.contactFlows.some(f => f.contactFlowId === plan.contactFlowId && f.enterpriseId === plan.enterpriseId && f.status === '已发布' && f.usage === usage)) return '请选择同品牌、同呼叫方式的已发布语音流程';
    return '';
  }
  function validatePlan(plan, requireMembers) {
    if (!plan) return '未找到呼叫配置';
    const tenant = data.tenants.find(t => t.tenantId === plan.tenantId);
    if (!tenant || tenant.enterpriseId !== plan.enterpriseId || !tenant.capabilitySet.includes('CLOUD_CONTACT_CENTER')) return '请选择已开通云呼叫的同品牌租户';
    if (!plan.name?.trim()) return '缺少配置名称';
    const direction = plan.callType === '呼入' ? '呼入' : '呼出';
    const caller=AliCtiFields.validateCallerSettings?.(plan,{requireCallerNumber:false});
    if(caller&&!caller.ok)return caller.message;
    if(plan.callerMode==='navigation'&&!['预外呼','IVR 外呼'].includes(plan.callType))return '当前呼叫方式不支持任务外显导航';
    if(plan.callerMode!=='navigation'){
      if (!plan.allowedCallerNumberIds?.length) return '请选择至少一个可用号码';
      if (!plan.allowedCallerNumberIds.every(key => usableNumber(data.phoneNumbers.find(n => n.numberId === key), plan.tenantId, direction, plan.callType))) return '号码未授权、已停用或不支持当前呼叫用途，请重新选择';
    }else if(!caller)return '外显配置尚未加载，请刷新页面';
    const activityError = campaignError(plan); if (activityError) return activityError;
    const isOutboundGroup = Number(plan.callGroupType) === 2;
    const hasSkillGroup = !!plan.targetSkillGroupId && !isOutboundGroup;
    const isIvrTransfer = plan.callType === 'IVR 外呼' && plan.transferEnabled;
    if (isIvrTransfer || (plan.callType === '预外呼' && hasSkillGroup)) {
      const group = data.physicalSkillGroups.find(g => g.skillGroupId === plan.targetSkillGroupId);
      if (!group || group.tenantId !== plan.tenantId || group.enterpriseId !== plan.enterpriseId || group.status !== '已启用') return '请选择该租户已启用的服务团队';
      if (requireMembers && !members(group).length) return '所选服务团队没有可接收任务的已启用坐席';
    }
    if (isOutboundGroup && window.OutboundGroups?.resolve) {
      const obgRes = window.OutboundGroups.resolve(plan, plan);
      if (obgRes && !obgRes.ok) return obgRes.message;
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
  window.CloudResourceRules = { id, members, recount, usableNumber, campaignError, validatePlan, error, changed };
})();
