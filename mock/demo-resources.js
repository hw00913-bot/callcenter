/** Linked fictional resource fixtures. Load after data.js, before state restoration. */
(function () {
  'use strict';
  const kit = window.DemoFixtureKit, data = window.CloudCallData;
  if (!kit || !data) return;
  const marker = 'alicti-showcase-v1';
  const scopeDefinitions = [
    { code: 'HQ', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', label: '总部', accountId: 'ACC-OPS-108', owner: '王静', cnos: ['0012', '1201', '2103', '2104'] },
    { code: 'SH', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', label: '上海门店', accountId: 'ACC-OPS-066', owner: '周岚', cnos: ['2201', '2202', '2203', '2204'] }
  ];
  let savedSeats = [], savedViewSeats = [];
  try {
    const saved = JSON.parse(localStorage.getItem('account-seat-v1') || 'null');
    if (saved?.version === 1 && Array.isArray(saved.seats)) savedSeats = saved.seats;
  } catch (_) { /* Existing invalid storage remains owned by AccountSeat. */ }
  try {
    const saved = JSON.parse(localStorage.getItem('workbench-view-fixtures-v1') || 'null');
    if (Array.isArray(saved?.agents)) savedViewSeats = saved.agents;
  } catch (_) { /* Do not rewrite the previous display fixture pack. */ }
  const add = (name, key, row) => {
    if (!Array.isArray(data[name])) data[name] = [];
    kit.add(data[name], key, row);
    return data[name].find(item => item[key] === row[key]);
  };
  function binding(scope) {
    const seats = new Map([...data.agents, ...savedViewSeats].map(agent => [agent.contactCenterIdentityId, agent]));
    for (const agent of savedSeats) {
      const base = seats.get(agent.contactCenterIdentityId);
      if (!base || base.tenantId === agent.tenantId && base.enterpriseId === agent.enterpriseId) seats.set(agent.contactCenterIdentityId, agent);
    }
    return [...seats.values()].find(agent => agent.accountId === scope.accountId &&
      agent.tenantId === scope.tenantId && agent.enterpriseId === scope.enterpriseId &&
      agent.contactCenterIdentityId && agent.lifecycleStatus !== '已删除');
  }
  function availableCno(preferred, identityId, scope) {
    let value = preferred, serial = Number(preferred) + 3000;
    const occupied = candidate => [...data.agents, ...savedViewSeats, ...savedSeats].some(agent =>
      agent.enterpriseId === scope.enterpriseId && agent.lifecycleStatus !== '已删除' &&
      agent.contactCenterIdentityId !== identityId && agent.cno === candidate);
    while (occupied(value)) value = String(serial++);
    return value;
  }
  kit.scopes = scopeDefinitions.map((definition, scopeIndex) => {
    const scope = { ...definition }, prefix = kit.prefix + scope.code + '-';
    Object.assign(scope, {
      seatId: prefix + 'SEAT-01', skillGroupId: prefix + 'SKILL-SALES',
      physicalGroupId: prefix + 'PHY-SALES', numberId: prefix + 'NUM',
      predictiveFlowId: scope.code === 'HQ' ? 'FLOW-PRED-HQ-V1' : 'FLOW-PRED-SH-V1',
      automaticFlowId: scope.code === 'HQ' ? 'FLOW-MAINTAIN-OUT-V4' : 'FLOW-MAINTAIN-SH-OUT-V4', providerIvrId: 91001 + scopeIndex,
      aftersalesSkillGroupId: prefix + 'SKILL-AFTER', aftersalesPhysicalGroupId: prefix + 'PHY-AFTER',
      manualPlanId: prefix + 'PLAN-MANUAL', inboundPlanId: prefix + 'PLAN-INBOUND', routeId: prefix + 'ROUTE',
      inboundFlowId: prefix + 'FLOW-INBOUND'
    });
    const existingBinding = binding(scope);
    if (existingBinding) scope.seatId = existingBinding.contactCenterIdentityId;
    ['SALES', 'AFTER'].forEach((kind, index) => {
      const name = index ? '售后关怀' : '试驾邀约';
      const templateId = prefix + 'TEMPLATE-' + kind;
      add('skillTemplates', 'skillTemplateId', {
        skillTemplateId: templateId, enterpriseId: scope.enterpriseId, name, code: 'SHOWCASE_' + kind,
        status: '启用', mappedTenantCount: 1, description: '用于演示租户独立的服务团队', updatedAt: kit.at(150)
      });
      add('physicalSkillGroups', 'physicalGroupId', {
        physicalGroupId: prefix + 'PHY-' + kind, skillGroupId: prefix + 'SKILL-' + kind,
        providerSkillId: 980101 + scopeIndex * 10 + index, skillTemplateId: templateId,
        tenantId: scope.tenantId, enterpriseId: scope.enterpriseId, name: scope.label + '·' + name,
        status: '已启用', syncStatus: '同步成功', memberCount: 0, referenceCount: index ? 1 : 2,
        updatedAt: kit.at(120), evidenceType: 'DEMO', realVerification: '未验证'
      });
    });
    const names = [scope.owner, scopeIndex ? '沈可欣' : '许佳宁', scopeIndex ? '高宇航' : '陆文博', scopeIndex ? '蒋心怡' : '唐悦'];
    for (let index = 0; index < 4; index++) {
      const identityId = prefix + 'SEAT-0' + (index + 1);
      const account = data.accounts.find(item => item.accountId === scope.accountId);
      add('agents', 'agentRecordId', {
        agentRecordId: identityId, contactCenterIdentityId: identityId,
        accountId: index === 0 && !existingBinding ? scope.accountId : '',
        userName: names[index], tenantId: scope.tenantId, enterpriseId: scope.enterpriseId,
        cno: availableCno(scope.cnos[index], identityId, scope), areaCode: '021',
        mobile: index === 0 ? account?.mobile || '' : '138****' + String(8100 + scopeIndex * 10 + index),
        loginName: prefix.toLowerCase() + 'seat-' + (index + 1), roleId: 'Agent', workMode: 'WEBRTC',
        lifecycleStatus: index === 3 ? '已停用' : '已启用', agentStatus: index === 1 ? '空闲' : '离线',
        syncStatus: '同步成功', callEnabled: index !== 3, currentCall: false,
        acceptNewTasks: index !== 3, isAsr: index === 0 ? 1 : 0, isQualityCheck: 1,
        evidenceType: 'DEMO', realVerification: '未验证', createdAt: kit.at(180), updatedAt: kit.at(90)
      });
      const kinds = index === 0 ? ['SALES', 'AFTER'] : [index === 1 ? 'SALES' : 'AFTER'];
      kinds.forEach((kind, relationIndex) => add('agentSkills', 'relationId', {
        relationId: identityId + '-' + kind, identityId,
        physicalGroupId: prefix + 'PHY-' + kind, skillLevel: [1, 3, 7, 10][index] + (index === 0 ? relationIndex : 0),
        status: '已生效', syncStatus: '同步成功', updatedAt: kit.at(85)
      }));
    }
    if (scope.seatId !== prefix + 'SEAT-01') {
      ['SALES', 'AFTER'].forEach((kind, index) => add('agentSkills', 'relationId', {
        relationId: prefix + 'OWNER-' + kind, identityId: scope.seatId,
        physicalGroupId: prefix + 'PHY-' + kind, skillLevel: index + 1,
        status: '已生效', syncStatus: '同步成功', updatedAt: kit.at(85)
      }));
    }
    const hotline = '02100006' + String(101 + scopeIndex);
    add('phoneNumbers', 'numberId', {
      numberId: scope.numberId, number: hotline, enterpriseId: scope.enterpriseId,
      usage: '呼入+呼出', aliyunUsage: 'Bidirection', status: '正常', businessStatus: '正常',
      contactFlowId: scope.inboundFlowId, authorizedTenantIds: [scope.tenantId],
      referenceCount: 3, restoreSnapshot: null,
      alictiNumber: {
        id: 981001 + scopeIndex, hotline, displayNumber: hotline, numberType: 2, status: 1,
        isIbRight: 1, isInUse: 1, isPredictiveLeft: 1, isPredictiveRight: 0, isPreviewRight: 0,
        isIntl: 0, isSipLeft: 0, isWebCallLeft: 0, isWebCallRight: 0
      },
      numberEvidence: '独立虚拟号码，仅用于本地演示', updatedAt: kit.at(95)
    });
    add('numberIntakePool', 'id', {
      id: prefix + 'POOL', number: '02100006' + String(201 + scopeIndex), enterpriseId: scope.enterpriseId,
      province: '上海', city: '上海', state: '已在号码池确认', assignedEnterpriseId: ''
    });
    add('callPlans', 'callPlanId', {
      callPlanId: scope.manualPlanId, tenantId: scope.tenantId, enterpriseId: scope.enterpriseId,
      name: scope.label + '人工客户跟进', description: '按所属服务团队与号码权限发起人工外呼',
      callType: '人工外呼', status: '已发布', publishedVersion: 'V1', isDefaultManualPlan: false,
      targetSkillGroupId: scope.skillGroupId, allowedCallerNumberIds: [scope.numberId],
      fallbackRule: '无可用号码时阻断呼叫', updatedAt: kit.at(80)
    });
    add('callPlans', 'callPlanId', {
      callPlanId: scope.inboundPlanId, tenantId: scope.tenantId, enterpriseId: scope.enterpriseId,
      name: scope.label + '来电服务', description: '来电按键进入本租户服务团队',
      callType: '呼入', status: '已发布', publishedVersion: 'V1', isDefaultManualPlan: false,
      targetSkillGroupId: scope.skillGroupId, allowedCallerNumberIds: [scope.numberId],
      fallbackRule: '本租户排队超时后播放提示', updatedAt: kit.at(75)
    });
    add('contactFlows', 'contactFlowId', {
      contactFlowId: scope.inboundFlowId, name: scope.label + '客户来电导航', version: 'V1', usage: '呼入入口',
      status: '已发布', enterpriseId: scope.enterpriseId, evidenceType: 'DEMO', realVerification: '未验证'
    });
    add('inboundRoutes', 'routeId', {
      routeId: scope.routeId, enterpriseId: scope.enterpriseId, numberId: scope.numberId,
      routeVersion: 'V1', status: '已发布', contactFlowId: scope.inboundFlowId, defaultTenantId: scope.tenantId,
      branches: [
        { branchCode: '1', label: '售前咨询', tenantId: scope.tenantId, callPlanId: scope.inboundPlanId, physicalGroupId: scope.physicalGroupId },
        { branchCode: '2', label: '售后预约', tenantId: scope.tenantId, callPlanId: scope.inboundPlanId, physicalGroupId: scope.aftersalesPhysicalGroupId }
      ],
      overrides: { [scope.tenantId]: { serviceTime: scopeIndex ? '09:00—19:00' : '08:30—20:30', queueTimeoutSeconds: scopeIndex ? 90 : 120, source: '租户覆盖' } },
      updatedAt: kit.at(70), evidenceType: 'DEMO', realVerification: '未验证'
    });
    ['MANUAL_OUTBOUND', 'PREDICTIVE', 'IVR_OUTBOUND', 'INBOUND'].forEach((scenarioType, index) => add('scenarioTests', 'testId', {
      testId: prefix + 'TEST-' + scenarioType, tenantId: scope.tenantId, enterpriseId: scope.enterpriseId,
      scenarioType, status: 'PASS', testedAt: kit.at(20 + index), method: '关联资源的本地演示样本',
      summary: '仅演示已配置资源与场景入口；未进行真实话务验证', evidenceType: 'DEMO', realVerification: '未验证'
    }));
    ['成功', '失败'].forEach((status, index) => {
      const objectId = index ? prefix + 'CREATE-PENDING' : scope.seatId;
      add('syncRecords', 'syncId', {
        syncId: prefix + 'SYNC-' + (index + 1), enterpriseId: scope.enterpriseId, tenantId: scope.tenantId,
        objectType: index ? '云呼叫坐席创建' : '坐席技能关系', objectId,
        objectName: index ? scope.label + '新增坐席' : scope.owner + ' / 试驾邀约、售后关怀',
        sourceVersion: 'V1', status, failureReason: index ? '工号已存在，请修改后重新提交' : '',
        requestId: prefix + 'REQUEST-' + (index + 1), retryCount: 0, updatedAt: kit.at(45 - index * 10)
      });
      if (index) add('exceptions', 'exceptionId', {
        exceptionId: prefix + 'EX-SEAT', enterpriseId: scope.enterpriseId, tenantId: scope.tenantId,
        source: '坐席配置', type: '坐席创建', objectId, title: '新增坐席工号重复',
        impact: '本次新增未完成，已有坐席可继续使用', responsibleRole: '租户管理员', status: '待处理',
        requestId: prefix + 'REQUEST-2', retryCount: 0, reason: '工号已存在，请修改后重新提交', updatedAt: kit.at(35),
        trace: [{ at: kit.at(35), action: '新增坐席', result: '保留输入，等待修改工号', operator: scope.owner }]
      });
    });
    [
      ['坐席技能更新', scope.seatId, '单一技能组', '试驾邀约、售后关怀'],
      ['号码授权', scope.numberId, '未分配', scope.label + '专属使用'],
      ['呼入规则保存', scope.routeId, '未配置', '售前咨询 / 售后预约']
    ].forEach(([action, object, before, after], index) => add('audits', 'auditId', {
      auditId: prefix + 'AUDIT-' + (index + 1), enterpriseId: scope.enterpriseId, tenantId: scope.tenantId,
      operator: scope.owner, action, object, before, after, at: kit.at(30 - index * 5)
    }));
    delete scope.cnos;
    return scope;
  });
  // Put current demo rows first without removing or rewriting existing objects.
  for (const name of ['skillTemplates', 'physicalSkillGroups', 'agentSkills', 'phoneNumbers', 'callPlans', 'inboundRoutes', 'syncRecords', 'exceptions', 'audits']) {
    const rows = data[name], demo = rows.filter(row => row.demoPack === marker), prior = rows.filter(row => row.demoPack !== marker);
    rows.splice(0, rows.length, ...demo, ...prior);
  }
})();
