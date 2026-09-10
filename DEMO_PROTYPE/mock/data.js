/**
 * 统一外呼中台桌面原型 Mock 数据。
 * 业务事实来自 memory/business-rules.md；不连接真实阿里云、线路或业务系统。
 */
(function () {
  'use strict';

  const now = '2026-09-02 10:30:00';

  const instances = [
    {
      instanceId: 'CCC-NISSAN', name: '东风日产联络中心', brandCustomerName: '东风日产',
      status: 'RUNNING', statusLabel: '运行中', syncStatus: '已同步', region: '华东1（杭州）',
      tenantIds: ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH'],
      defaultService: { weekdays: '周一至周日', timeRange: '08:30—20:30', queueTimeoutSeconds: 120, timeoutPrompt: '当前坐席忙，请稍后再拨' },
      updatedAt: '2026-09-02 09:10:00'
    },
    {
      instanceId: 'CCC-EPI', name: '东风奕派联络中心', brandCustomerName: '东风奕派',
      status: 'RUNNING', statusLabel: '运行中', syncStatus: '已同步', region: '华东1（杭州）',
      tenantIds: ['TEN-EPI-HQ'],
      defaultService: { weekdays: '周一至周六', timeRange: '09:00—18:30', queueTimeoutSeconds: 90, timeoutPrompt: '非服务时间请关注官方服务号' },
      updatedAt: '2026-09-01 18:20:00'
    },
    {
      instanceId: 'CCC-TEST', name: '集成验证实例', brandCustomerName: '项目联调',
      status: 'STOPPED', statusLabel: '已停止', syncStatus: '需关注', region: '华东1（杭州）',
      tenantIds: [],
      defaultService: { weekdays: '周一至周五', timeRange: '09:00—18:00', queueTimeoutSeconds: 60, timeoutPrompt: '测试实例暂停服务' },
      updatedAt: '2026-08-29 17:00:00'
    }
  ];

  const tenants = [
    { tenantId: 'TEN-NISSAN-HQ', name: '东风日产总部', organizationScope: 'HEADQUARTERS', organizationLabel: '总部', capabilitySet: ['AI_OUTBOUND', 'CLOUD_CONTACT_CENTER'], instanceId: 'CCC-NISSAN', status: '启用', hasBusinessData: true, aiBilling: { largeModelUnitPrice: 0.40, smallModelUnitPrice: 0.26, balanceAmount: 12480.00, frozenAmount: 1450.40, validityFrom: '2026-06-01', validityTo: '2027-05-31', callControlEnabled: true, totalRechargeAmount: 20000.00, totalConsumedAmount: 7520.00 } },
    { tenantId: 'TEN-NISSAN-SH', name: '上海华东门店', organizationScope: 'STORE', organizationLabel: '门店', capabilitySet: ['AI_OUTBOUND', 'CLOUD_CONTACT_CENTER'], instanceId: 'CCC-NISSAN', status: '启用', hasBusinessData: true, aiBilling: { largeModelUnitPrice: 0.40, smallModelUnitPrice: 0.26, balanceAmount: 3680.00, frozenAmount: 520.00, validityFrom: '2026-07-01', validityTo: '2027-06-30', callControlEnabled: true, totalRechargeAmount: 5000.00, totalConsumedAmount: 1320.00 } },
    { tenantId: 'TEN-EPI-HQ', name: '东风奕派总部', organizationScope: 'HEADQUARTERS', organizationLabel: '总部', capabilitySet: ['CLOUD_CONTACT_CENTER'], instanceId: 'CCC-EPI', status: '启用', hasBusinessData: false }
  ];

  const accounts = [
    { accountId: 'ACC-SUPER-001', loginUsername: 'super-product', name: '平台超级管理员', nickname: '平台超管', mobile: '159****5393', loginMobile: '15975585393', avatar: '', password: '123456Aa@', status: '启用', builtIn: true, lastInstanceId: 'CCC-NISSAN' },
    { accountId: 'ACC-ADMIN-018', loginUsername: 'nissan-admin', name: '李明', nickname: '日产中台管理员', mobile: '138****2818', loginMobile: '13800002818', avatar: '', password: 'Abc@123456', status: '启用', builtIn: false },
    { accountId: 'ACC-OPS-CHEN', loginUsername: 'chenmin-operator', name: '陈敏', nickname: '总部坐席运营', mobile: '138****5201', loginMobile: '13800005201', avatar: '', password: 'Abc@123456', status: '启用', builtIn: false, linkedIdentityId: 'CCI-N-001', simulation: true },
    { accountId: 'ACC-OPS-066', loginUsername: 'store-operator', name: '周岚', nickname: '上海门店运营', mobile: '139****7066', loginMobile: '13900007066', avatar: '', password: 'Abc@123456', status: '启用', builtIn: false },
    { accountId: 'ACC-OPS-108', loginUsername: 'hq-operator', name: '王静', nickname: '总部外呼运营', mobile: '136****1108', loginMobile: '13600001108', avatar: '', password: 'Abc@123456', status: '启用', builtIn: false }
  ];

  const memberships = [
    { membershipId: 'MEM-HQ-CHEN', accountId: 'ACC-OPS-CHEN', tenantId: 'TEN-NISSAN-HQ', roleCode: 'OPERATOR', status: '启用' },
    { membershipId: 'MEM-SUPER', accountId: 'ACC-SUPER-001', tenantId: 'TENANT-SUPER-BUILTIN', roleCode: 'SUPER_ADMIN', status: '启用' },
    { membershipId: 'MEM-HQ-ADMIN', accountId: 'ACC-ADMIN-018', tenantId: 'TEN-NISSAN-HQ', roleCode: 'ADMIN', status: '启用' },
    { membershipId: 'MEM-SH-ADMIN', accountId: 'ACC-ADMIN-018', tenantId: 'TEN-NISSAN-SH', roleCode: 'ADMIN', status: '启用' },
    { membershipId: 'MEM-SH-OPS', accountId: 'ACC-OPS-066', tenantId: 'TEN-NISSAN-SH', roleCode: 'OPERATOR', status: '启用' },
    { membershipId: 'MEM-HQ-OPS', accountId: 'ACC-OPS-108', tenantId: 'TEN-NISSAN-HQ', roleCode: 'OPERATOR', status: '启用' }
  ];

  const demoProfiles = [
    { profileId: 'super', accountId: 'ACC-SUPER-001', label: '超级管理员', roleCode: 'SUPER_ADMIN', defaultTenantId: 'ALL_IN_INSTANCE' },
    { profileId: 'admin', accountId: 'ACC-ADMIN-018', label: '租户管理员', roleCode: 'ADMIN', defaultTenantId: 'TEN-NISSAN-HQ' },
    { profileId: 'operator-chen', accountId: 'ACC-OPS-CHEN', label: '租户运营', roleCode: 'OPERATOR', defaultTenantId: 'TEN-NISSAN-HQ' },
    { profileId: 'operator', accountId: 'ACC-OPS-066', label: '租户运营', roleCode: 'OPERATOR', defaultTenantId: 'TEN-NISSAN-SH' },
    { profileId: 'operator-hq', accountId: 'ACC-OPS-108', label: '租户运营', roleCode: 'OPERATOR', defaultTenantId: 'TEN-NISSAN-HQ' }
  ];

  const providerAccounts = [
    { providerAccountId: 'AI-ACCOUNT-NISSAN', name: '一知账号·日产总部', provider: '一知科技', vendorTenant: '东风日产总部', modelType: '大模型', environment: 'production', status: '正常' },
    { providerAccountId: 'AI-ACCOUNT-SH', name: '一知账号·上海门店', provider: '一知科技', vendorTenant: '上海华东门店', modelType: '小模型', environment: 'production', status: '正常' }
  ];
  const capabilities = providerAccounts.map((item, index) => ({ capabilityId: `CAP-AI-${index + 1}`, type: 'AI 外呼账号', resourceId: item.providerAccountId }));
  const capabilityGrants = [
    { grantId: 'GRANT-AI-HQ', tenantId: 'TEN-NISSAN-HQ', environment: 'production', status: '生效中', capabilityId: 'CAP-AI-1', sceneScope: ['AI外呼'] },
    { grantId: 'GRANT-AI-SH', tenantId: 'TEN-NISSAN-SH', environment: 'production', status: '生效中', capabilityId: 'CAP-AI-2', sceneScope: ['AI外呼'] }
  ];
  const aiRobots = [
    { robotId: 'AI-ROBOT-HQ', name: '日产总部回访机器人', providerAccountId: 'AI-ACCOUNT-NISSAN', integrationType: '第三方AI/非CCC', status: '启用' },
    { robotId: 'AI-ROBOT-SH', name: '上海门店邀约机器人', providerAccountId: 'AI-ACCOUNT-SH', integrationType: '第三方AI/非CCC', status: '启用' }
  ];
  const aiLegacyScenes = [
    { sceneId: 'AI-SCENE-01', sceneCode: 'AI-LEAD-ACTIVE', name: '新线索首次触达', tenantId: 'TEN-NISSAN-HQ', providerAccountId: 'AI-ACCOUNT-NISSAN', robotId: 'AI-ROBOT-HQ', environment: 'production' },
    { sceneId: 'AI-SCENE-02', sceneCode: 'AI-N6-RECOMMEND', name: 'N6车型推荐', tenantId: 'TEN-NISSAN-HQ', providerAccountId: 'AI-ACCOUNT-NISSAN', robotId: 'AI-ROBOT-HQ', environment: 'production' },
    { sceneId: 'AI-SCENE-03', sceneCode: 'AI-SERVICE-RETURN', name: '售后保养回访', tenantId: 'TEN-NISSAN-HQ', providerAccountId: 'AI-ACCOUNT-NISSAN', robotId: 'AI-ROBOT-HQ', environment: 'production' },
    { sceneId: 'AI-SCENE-04', sceneCode: 'AI-COLD-WAKE', name: '冷线索激活', tenantId: 'TEN-NISSAN-HQ', providerAccountId: 'AI-ACCOUNT-NISSAN', robotId: 'AI-ROBOT-HQ', environment: 'production' },
    { sceneId: 'AI-SCENE-05', sceneCode: 'AI-EVENT-NOTICE', name: '活动通知', tenantId: 'TEN-NISSAN-HQ', providerAccountId: 'AI-ACCOUNT-NISSAN', robotId: 'AI-ROBOT-HQ', environment: 'production' },
    { sceneId: 'AI-SCENE-06', sceneCode: 'AI-STORE-SALES', name: '门店售前邀约', tenantId: 'TEN-NISSAN-SH', providerAccountId: 'AI-ACCOUNT-SH', robotId: 'AI-ROBOT-SH', environment: 'production' },
    { sceneId: 'AI-SCENE-07', sceneCode: 'AI-STORE-AFTER', name: '门店售后回访', tenantId: 'TEN-NISSAN-SH', providerAccountId: 'AI-ACCOUNT-SH', robotId: 'AI-ROBOT-SH', environment: 'production' }
  ];

  const aiPaymentOrders = [
    { rechargeNo: 'DZL-NISSAN-20260901', tenantId: 'TEN-NISSAN-HQ', storeName: '东风日产总部', paymentStatus: '已支付', billingType: '坐席费+通话费', rechargeAmount: 5000.00, validityDays: 365 },
    { rechargeNo: 'DZL-SH-20260902', tenantId: 'TEN-NISSAN-SH', storeName: '上海华东门店', paymentStatus: '已支付', billingType: '仅通话费', rechargeAmount: 2000.00, validityDays: 0 },
    { rechargeNo: 'DZL-NISSAN-UNPAID', tenantId: 'TEN-NISSAN-HQ', storeName: '东风日产总部', paymentStatus: '未支付', billingType: '仅通话费', rechargeAmount: 3000.00, validityDays: 0 }
  ];
  const aiRechargeHistory = [
    { historyId: 'RCH-HQ-001', rechargeNo: 'DZL-NISSAN-20260601', tenantId: 'TEN-NISSAN-HQ', billingType: '坐席费+通话费', rechargeAmount: 20000.00, validityDays: 365, status: '已生效', operator: '平台超级管理员', createdAt: '2026-06-01 09:30:00', effectiveAt: '2026-06-01 09:35:12' },
    { historyId: 'RCH-SH-001', rechargeNo: 'DZL-SH-20260701', tenantId: 'TEN-NISSAN-SH', billingType: '坐席费+通话费', rechargeAmount: 5000.00, validityDays: 365, status: '已生效', operator: '平台超级管理员', createdAt: '2026-07-01 10:02:00', effectiveAt: '2026-07-01 10:08:20' }
  ];
  const aiBalanceAdjustments = [
    { adjustmentId: 'ADJ-HQ-001', tenantId: 'TEN-NISSAN-HQ', direction: 'OUT', amount: 100.00, reason: '线下业务处理后同步扣减余额', operator: '平台超级管理员', status: '已生效', effectiveAt: '2026-08-28 16:20:00' }
  ];
  const aiFrozenTasks = [
    { frozenId: 'FRZ-HQ-001', tenantId: 'TEN-NISSAN-HQ', taskId: 'LEGACY-AI-0020', taskName: '东风日产-新线索-电声', modelType: '大模型', frozenMinutes: 1800, unitPriceSnapshot: 0.40, frozenAmount: 720.00, status: '冻结中', createdAt: '2026-09-02 09:05:00' },
    { frozenId: 'FRZ-HQ-002', tenantId: 'TEN-NISSAN-HQ', taskId: 'LEGACY-AI-0002', taskName: '保客回访', modelType: '小模型', frozenMinutes: 2808, unitPriceSnapshot: 0.26, frozenAmount: 730.08, status: '冻结中', createdAt: '2026-09-02 10:05:00' },
    { frozenId: 'FRZ-SH-001', tenantId: 'TEN-NISSAN-SH', taskId: 'LEGACY-AI-0010', taskName: '华东店保客回访', modelType: '小模型', frozenMinutes: 2000, unitPriceSnapshot: 0.26, frozenAmount: 520.00, status: '冻结中', createdAt: '2026-09-02 08:30:00' }
  ];

  const businessSystems = [
    { businessSystemId: 'BIZ-DCC-HQ', name: '总部 DCC', owner: '东风日产', status: '已接入', instanceId: 'CCC-NISSAN', authorizedTenantIds: ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH'], accountQueryStatus: '可查询', accountValidationStatus: '可校验', phoneBarPocStatus: '验证中', callCapability: '条件可用', callbackStatus: '健康', lastSyncAt: '2026-09-02 10:18:00' },
    { businessSystemId: 'BIZ-CRM-EPI', name: '奕派客户运营系统', owner: '东风奕派', status: '接入准备', instanceId: 'CCC-EPI', authorizedTenantIds: [], accountQueryStatus: '未配置', accountValidationStatus: '未配置', phoneBarPocStatus: '未验证', callCapability: '未开放', callbackStatus: '未配置', lastSyncAt: '—' }
  ];

  // 模拟业务系统按手机号查询及按 ID 校验状态的响应数据；账号不会自动同步或创建到云呼叫。
  const businessUserDirectory = [
    { status: '启用', businessSystemId: 'BIZ-DCC-HQ', businessUserId: 'DCC-U-1001', name: '陈敏', mobile: '13800005201', organization: '总部售前服务组', tenantId: 'TEN-NISSAN-HQ' },
    { status: '启用', businessSystemId: 'BIZ-DCC-HQ', businessUserId: 'DCC-U-1002', name: '刘洋', mobile: '13900005202', organization: '总部售后服务组', tenantId: 'TEN-NISSAN-HQ' },
    { status: '启用', businessSystemId: 'BIZ-DCC-HQ', businessUserId: 'DCC-U-1003', name: '赵婷', mobile: '13600005203', organization: '上海华东门店', tenantId: 'TEN-NISSAN-SH' },
    { status: '启用', businessSystemId: 'BIZ-DCC-HQ', businessUserId: 'DCC-U-1041', name: '李雪', mobile: '13700005241', organization: '总部售前服务组', tenantId: 'TEN-NISSAN-HQ' },
    { status: '启用', businessSystemId: 'BIZ-DCC-HQ', businessUserId: 'DCC-U-1042', name: '曾一帆', mobile: '13500005242', organization: '总部售后服务组', tenantId: 'TEN-NISSAN-HQ' },
    { status: '启用', businessSystemId: 'BIZ-DCC-HQ', businessUserId: 'DCC-U-1043', name: '邓楠', mobile: '13400005243', organization: '上海华东门店', tenantId: 'TEN-NISSAN-SH' }
  ];

  const agents = [
    { agentRecordId: 'AGT-001', contactCenterIdentityId: 'CCI-N-001', businessSystemId: 'BIZ-DCC-HQ', businessUserId: 'DCC-U-1001', accountId: 'ACC-OPS-CHEN', userName: '陈敏', mobile: '138****5201', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', cccUserId: 'CCC-U-1001', ramId: 'RAM-91001', loginName: 'dcc_u_1001', email: 'c***@example.com', roleId: 'Agent@CCC-NISSAN', lifecycleStatus: '已启用', agentStatus: '空闲', syncStatus: '同步成功', phonebarPermission: true, currentCall: false, acceptNewTasks: true },
    { agentRecordId: 'AGT-002', contactCenterIdentityId: 'CCI-N-002', businessSystemId: 'BIZ-DCC-HQ', businessUserId: 'DCC-U-1002', accountId: '', userName: '刘洋', mobile: '139****5202', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', cccUserId: 'CCC-U-1002', ramId: 'RAM-91002', loginName: 'dcc_u_1002', email: 'l***@example.com', roleId: 'Agent@CCC-NISSAN', lifecycleStatus: '已启用', agentStatus: '通话中', syncStatus: '同步成功', phonebarPermission: true, currentCall: true, acceptNewTasks: true },
    { agentRecordId: 'AGT-003', contactCenterIdentityId: 'CCI-SH-003', businessSystemId: 'BIZ-DCC-HQ', businessUserId: 'DCC-U-1003', accountId: '', userName: '赵婷', mobile: '136****5203', tenantId: 'TEN-NISSAN-SH', instanceId: 'CCC-NISSAN', cccUserId: 'CCC-U-1003', ramId: 'RAM-91003', loginName: 'dcc_u_1003', email: 'z***@example.com', roleId: 'Agent@CCC-NISSAN', lifecycleStatus: '已启用', agentStatus: '话后处理', syncStatus: '同步成功', phonebarPermission: true, currentCall: false, acceptNewTasks: true },
    { agentRecordId: 'AGT-004', contactCenterIdentityId: 'CCI-N-004', businessSystemId: 'BIZ-DCC-HQ', businessUserId: 'DCC-U-0998', accountId: '', userName: '孙悦', mobile: '133****5198', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', cccUserId: 'CCC-U-0998', ramId: 'RAM-90998', loginName: 'dcc_u_0998', email: 's***@example.com', roleId: 'Agent@CCC-NISSAN', lifecycleStatus: '已停用', agentStatus: '离线', syncStatus: '同步成功', phonebarPermission: false, currentCall: false, acceptNewTasks: false }
  ];

  const skillTemplates = [
    { skillTemplateId: 'TPL-SALES', instanceId: 'CCC-NISSAN', name: '售前咨询', code: 'SALES', status: '启用', mappedTenantCount: 2, updatedAt: now },
    { skillTemplateId: 'TPL-AFTER', instanceId: 'CCC-NISSAN', name: '售后服务', code: 'AFTER_SALES', status: '启用', mappedTenantCount: 2, updatedAt: now },
    { skillTemplateId: 'TPL-COMPLAINT', instanceId: 'CCC-NISSAN', name: '投诉处理', code: 'COMPLAINT', status: '启用', mappedTenantCount: 1, updatedAt: now }
  ];
  const physicalSkillGroups = [
    { physicalGroupId: 'PHY-HQ-SALES', skillGroupId: 'SG-ALI-HQ-SALES', skillTemplateId: 'TPL-SALES', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', name: '总部·售前咨询', status: '已启用', memberCount: 2, referenceCount: 2, syncStatus: '同步成功' },
    { physicalGroupId: 'PHY-HQ-AFTER', skillGroupId: 'SG-ALI-HQ-AFTER', skillTemplateId: 'TPL-AFTER', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', name: '总部·售后服务', status: '已启用', memberCount: 1, referenceCount: 2, syncStatus: '同步成功' },
    { physicalGroupId: 'PHY-SH-SALES', skillGroupId: 'SG-ALI-SH-SALES', skillTemplateId: 'TPL-SALES', tenantId: 'TEN-NISSAN-SH', instanceId: 'CCC-NISSAN', name: '上海门店·售前咨询', status: '已启用', memberCount: 1, referenceCount: 1, syncStatus: '同步成功' },
    { physicalGroupId: 'PHY-SH-AFTER', skillGroupId: 'SG-ALI-SH-AFTER', skillTemplateId: 'TPL-AFTER', tenantId: 'TEN-NISSAN-SH', instanceId: 'CCC-NISSAN', name: '上海门店·售后服务', status: '同步失败', memberCount: 0, referenceCount: 0, syncStatus: '同步失败' }
  ];
  const agentSkills = [
    { relationId: 'AS-001', identityId: 'CCI-N-001', physicalGroupId: 'PHY-HQ-SALES', skillLevel: 2, status: '已生效', syncStatus: '同步成功' },
    { relationId: 'AS-002', identityId: 'CCI-N-001', physicalGroupId: 'PHY-HQ-AFTER', skillLevel: 5, status: '已生效', syncStatus: '同步成功' },
    { relationId: 'AS-003', identityId: 'CCI-N-002', physicalGroupId: 'PHY-HQ-AFTER', skillLevel: 1, status: '已生效', syncStatus: '同步成功' },
    { relationId: 'AS-004', identityId: 'CCI-SH-003', physicalGroupId: 'PHY-SH-SALES', skillLevel: 3, status: '已生效', syncStatus: '同步成功' }
  ];

  const syncRecords = [
    { syncId: 'SYNC-3001', objectType: '业务账号关联', objectId: 'DCC-U-1001', objectName: '陈敏', tenantId: 'TEN-NISSAN-HQ', sourceVersion: 'v184', status: '成功', failureReason: '管理员确认关联，双方账号 ID 已绑定', retryCount: 0, updatedAt: '2026-09-02 09:20:12' },
    { syncId: 'SYNC-3002', objectType: '云呼叫坐席创建', objectId: 'DEMO-CREATE-1043', objectName: '邓楠', tenantId: 'TEN-NISSAN-SH', sourceVersion: 'v42', status: '失败', failureReason: 'CreateUser 返回 LoginName 已存在；已保留输入和 RequestId', requestId: 'REQ-ALI-82431', retryCount: 0, updatedAt: '2026-09-02 10:06:41' },
    { syncId: 'SYNC-3003', objectType: '物理技能组映射', objectId: 'PHY-SH-AFTER', objectName: '上海门店·售后服务', tenantId: 'TEN-NISSAN-SH', sourceVersion: 'v3', status: '失败', failureReason: 'CreateSkillGroup 超时；需要先回查实际结果', requestId: 'REQ-ALI-82452', retryCount: 1, updatedAt: '2026-09-02 10:09:20' },
    { syncId: 'SYNC-3004', objectType: '坐席技能关系', objectId: 'AS-004', objectName: '赵婷 / 售前咨询', tenantId: 'TEN-NISSAN-SH', sourceVersion: 'v9', status: '成功', failureReason: '', retryCount: 0, updatedAt: '2026-09-02 10:11:02' }
  ];

  const lines = [
    { lineId: 'LINE-HOPE-01', sourceType: 'EXTERNAL', importAllowlisted: true, routingConfirmed: false, name: '厚朴 SIP 主线路', provider: '厚朴', instanceIds: ['CCC-NISSAN'], status: '联调中', acceptanceStatus: 'POC-02 未通过', pocStatus: '验证中', concurrentLimit: 80, ipWhitelist: '已提交', dtmf: '待验证', failover: '待验证', updatedAt: now },
    { lineId: 'LINE-ALI-01', sourceType: 'ALI_CCC', importAllowlisted: false, routingConfirmed: true, name: '阿里云验证线路', provider: '阿里云', instanceIds: ['CCC-NISSAN'], status: '启用', acceptanceStatus: '测试可用', pocStatus: '已通过', concurrentLimit: 20, ipWhitelist: '已完成', dtmf: '已通过', failover: '不适用', updatedAt: now },
    { lineId: 'LINE-EPI-01', sourceType: 'EXTERNAL', importAllowlisted: false, routingConfirmed: false, name: '奕派试运行线路', provider: '第三方线路商', instanceIds: ['CCC-EPI'], status: '待加白', acceptanceStatus: '未开始', pocStatus: '未开始', concurrentLimit: 40, ipWhitelist: '待提交', dtmf: '未验证', failover: '未验证', updatedAt: now }
  ];

  lines.push({lineId:'LINE-ALI-VOICE-DEMO',name:'阿里语音服务接入（演示）',provider:'阿里通信',sourceType:'ALI_VOICE',instanceIds:['CCC-NISSAN'],importAllowlisted:true,routingConfirmed:false,concurrentLimit:null,status:'待验证',pocStatus:'未开始',acceptanceStatus:'待路由确认',dtmf:'待验证',failover:'待验证'});
  const numberIntakePool = [
    {id:'POOL-ALI-01',number:'02100009001',lineId:'LINE-ALI-01',province:'上海',city:'上海',state:'已在号码池确认',assignedInstanceId:'',simulation:true},
    {id:'POOL-ALI-400',number:'4000009001',lineId:'LINE-ALI-01',province:'上海',city:'上海',state:'已在号码池确认',assignedInstanceId:'',simulation:true}
  ];
  const numberImportJobs = [];
  const numberOnboardingBatches = [];
  // Test fixtures only; never expose simulated vendor responses in business forms.
  const numberOnboardingDemo = {importOutcome:'success',addOutcome:'success',addFailedNumbers:[],unconfirmedNumbers:[]};
  const phoneNumbers = [
    { numberId: 'NUM-400-8801', boundSkillGroupIds: ['SG-ALI-HQ-SALES','SG-ALI-HQ-AFTER','SG-ALI-SH-SALES'], number: '400****801', instanceId: 'CCC-NISSAN', lineId: 'LINE-ALI-01', usage: '呼入+呼出', aliyunUsage: 'Bidirection', status: '正常', businessStatus: '正常', contactFlowId: 'FLOW-NISSAN-ENTRY-V8', authorizedTenantIds: ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH'], referenceCount: 6, restoreSnapshot: null },
    { numberId: 'NUM-021-6601', boundSkillGroupIds: ['SG-ALI-HQ-SALES'], number: '021****601', instanceId: 'CCC-NISSAN', lineId: 'LINE-HOPE-01', usage: '呼入+呼出', aliyunUsage: 'Bidirection', status: '验证中', businessStatus: '正常', contactFlowId: 'FLOW-NISSAN-ENTRY-V8', authorizedTenantIds: ['TEN-NISSAN-HQ'], referenceCount: 2, restoreSnapshot: null },
    { numberId: 'NUM-400-8802', number: '400****802', instanceId: 'CCC-NISSAN', lineId: 'LINE-ALI-01', usage: '仅呼入', aliyunUsage: 'Inbound', status: '已隔离', businessStatus: '已隔离', contactFlowId: 'FLOW-MAINTENANCE-IVR-V2', authorizedTenantIds: ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH'], referenceCount: 4, restoreSnapshot: { snapshotId: 'NS-20260901-01', previousUsage: 'Bidirection', previousContactFlowId: 'FLOW-NISSAN-ENTRY-V8', authorizedTenantIds: ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH'], reason: '线路投诉核查', createdAt: '2026-09-01 15:20:00' } },
    { numberId: 'NUM-EPI-4001', number: '400****419', instanceId: 'CCC-EPI', lineId: 'LINE-EPI-01', usage: '呼入+呼出', aliyunUsage: 'Bidirection', status: '待联调', businessStatus: '正常', contactFlowId: 'FLOW-EPI-ENTRY-V1', authorizedTenantIds: ['TEN-EPI-HQ'], referenceCount: 1, restoreSnapshot: null }
  ];

  const callPlans = [
    { callPlanId: 'PLAN-HQ-MANUAL', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', name: '总部人工客户回访', description: '业务系统人工联系客户的默认规则', callType: '人工外呼', status: '已发布', publishedVersion: 'V3', isDefaultManualPlan: true, targetSkillGroupId: 'SG-ALI-HQ-SALES', allowedCallerNumberIds: ['NUM-400-8801', 'NUM-021-6601'], fallbackRule: '无可用号码时阻断呼叫', updatedAt: now },
    { callPlanId: 'PLAN-HQ-PRED', executionQueueId: 'SG-ALI-HQ-AFTER', contactFlowId: 'FLOW-PRED-HQ-V1', transferEnabled: true, tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', name: '总部批量回访预外呼', description: '客户接通后分配总部坐席', callType: '预外呼', status: '已发布', publishedVersion: 'V2', isDefaultManualPlan: false, targetSkillGroupId: 'SG-ALI-HQ-AFTER', allowedCallerNumberIds: ['NUM-400-8801'], fallbackRule: '暂停新分配并进入待处理', updatedAt: now },
    { callPlanId: 'PLAN-HQ-IVR', executionQueueId: 'SG-ALI-HQ-AFTER', transferEnabled: false, tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', name: '保养到期自动提醒', description: '纯 IVR 通知与按键确认', callType: 'IVR 外呼', status: '已发布', publishedVersion: 'V4', isDefaultManualPlan: false, targetSkillGroupId: '', allowedCallerNumberIds: ['NUM-400-8801'], contactFlowId: 'FLOW-MAINTAIN-OUT-V4', fallbackRule: '无输入后标记可重呼', updatedAt: now },
    { callPlanId: 'PLAN-HQ-INBOUND', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', name: '总部客户服务热线', description: '总部售前与售后呼入承接', callType: '呼入', status: '已发布', publishedVersion: 'V5', isDefaultManualPlan: false, targetSkillGroupId: 'SG-ALI-HQ-SALES', allowedCallerNumberIds: ['NUM-400-8801'], fallbackRule: '本租户排队超时提示后挂断', updatedAt: now },
    { callPlanId: 'PLAN-SH-MANUAL', tenantId: 'TEN-NISSAN-SH', instanceId: 'CCC-NISSAN', name: '上海门店人工跟进', description: '门店客户人工跟进默认规则', callType: '人工外呼', status: '已发布', publishedVersion: 'V1', isDefaultManualPlan: true, targetSkillGroupId: 'SG-ALI-SH-SALES', allowedCallerNumberIds: ['NUM-400-8801'], fallbackRule: '无可用号码时阻断呼叫', updatedAt: now },
    { callPlanId: 'PLAN-DRAFT-01', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', name: '总部投诉回访草稿', description: '尚未完成资源校验', callType: '预外呼', status: '草稿', publishedVersion: '—', isDefaultManualPlan: false, targetSkillGroupId: 'SG-ALI-HQ-SALES', allowedCallerNumberIds: [], fallbackRule: '待配置', updatedAt: now }
  ];

  const inboundRoutes = [
    { routeId: 'ROUTE-NISSAN-400', instanceId: 'CCC-NISSAN', numberId: 'NUM-400-8801', routeVersion: 'V8', status: '已发布', contactFlowId: 'FLOW-NISSAN-ENTRY-V8', defaultTenantId: 'TEN-NISSAN-HQ', branches: [
      { branchCode: 'DTMF-1', label: '按 1 售前咨询', tenantId: 'TEN-NISSAN-HQ', callPlanId: 'PLAN-HQ-INBOUND', physicalGroupId: 'PHY-HQ-SALES' },
      { branchCode: 'DTMF-2', label: '按 2 售后服务', tenantId: 'TEN-NISSAN-HQ', callPlanId: 'PLAN-HQ-INBOUND', physicalGroupId: 'PHY-HQ-AFTER' },
      { branchCode: 'DTMF-3', label: '按 3 上海门店', tenantId: 'TEN-NISSAN-SH', callPlanId: '', physicalGroupId: 'PHY-SH-SALES' }
    ], overrides: { 'TEN-NISSAN-HQ': { serviceTime: '08:30—21:00', queueTimeoutSeconds: 150, source: '租户覆盖' }, 'TEN-NISSAN-SH': { serviceTime: '09:00—19:00', queueTimeoutSeconds: 90, source: '租户覆盖' } }, updatedAt: now },
    { routeId: 'ROUTE-NISSAN-MAINT', instanceId: 'CCC-NISSAN', numberId: 'NUM-400-8802', routeVersion: 'V2', status: '暂停服务', contactFlowId: 'FLOW-MAINTENANCE-IVR-V2', defaultTenantId: '', branches: [], overrides: {}, updatedAt: '2026-09-01 15:21:00' }
  ];

  const predictiveTasks = [
    { taskId: 'TASK-PRED-0901', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', name: '9月保客满意度回访', callType: '预外呼', status: '执行中', total: 1200, completed: 486, connected: 302, planId: 'PLAN-HQ-PRED', planVersion: 'V2', planSnapshotId: 'SNAP-PRED-0901', campaignId: 'CAM-ALI-90281', listSource: 'DCC批次 DCC-B-0901', scheduleAt: '2026-09-02 09:00', hasNextAttempt: true, stopNewDialing: false, owner: '王静' },
    { taskId: 'TASK-PRED-0830', tenantId: 'TEN-NISSAN-SH', instanceId: 'CCC-NISSAN', name: '上海门店试驾邀约', callType: '预外呼', status: '已暂停', total: 360, completed: 140, connected: 82, planId: '', planVersion: 'V1', planSnapshotId: 'SNAP-PRED-0830', campaignId: 'CAM-ALI-90110', listSource: 'DCC批次 DCC-B-SH0830', scheduleAt: '2026-08-30 10:00', hasNextAttempt: true, stopNewDialing: true, owner: '周岚' }
  ];
  const ivrTasks = [
    { taskId: 'TASK-IVR-0902', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', name: '保养到期自动提醒', callType: 'IVR 外呼', status: '执行中', total: 800, completed: 615, connected: 488, planId: 'PLAN-HQ-IVR', planVersion: 'V4', planSnapshotId: 'SNAP-IVR-0902', campaignId: 'CAM-IVR-90311', listSource: 'DCC批次 DCC-MAINT-0902', scheduleAt: '2026-09-02 09:30', hasNextAttempt: false, owner: '王静' },
    { taskId: 'TASK-IVR-0831', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', name: '活动到期通知', callType: 'IVR 外呼', status: '已完成', total: 500, completed: 500, connected: 371, planId: 'PLAN-HQ-IVR', planVersion: 'V3', planSnapshotId: 'SNAP-IVR-0831', campaignId: 'CAM-IVR-90181', listSource: '接口名单 API-0831', scheduleAt: '2026-08-31 14:00', hasNextAttempt: false, owner: '王静' }
  ];
  const tasks = [...predictiveTasks, ...ivrTasks];

  const scenarioTests = [
    { testId: 'TEST-HQ-PRED-01', tenantId: 'TEN-NISSAN-HQ', scenarioType: 'PREDICTIVE', status: 'PASS', testedAt: '2026-09-01 16:20', method: '20 条客户数据的本地模拟', summary: '演示总部售后分配与结果、录音状态；未拨打真实号码或回收真实录音。', evidenceType: 'DEMO', realVerification: '未验证' },
    { testId: 'TEST-HQ-IVR-01', tenantId: 'TEN-NISSAN-HQ', scenarioType: 'IVR_OUTBOUND', status: 'PASS', testedAt: '2026-09-01 17:05', method: '预置 IVR 路径与轨迹的本地模拟', summary: '展示联系流版本、按键和结果样本；纯 IVR 录音不适用；无坐席执行仍待真实 POC。', evidenceType: 'DEMO', realVerification: '未验证' },
    { testId: 'TEST-HQ-IN-01', tenantId: 'TEN-NISSAN-HQ', scenarioType: 'INBOUND', status: 'PASS', testedAt: '2026-09-02 08:45', method: '共享号码总部售前分支的本地模拟', summary: '演示租户锁定、排队、人工接听与结果样本；未进行真实呼入验证。', evidenceType: 'DEMO', realVerification: '未验证' },
    { testId: 'TEST-SH-MAN-01', tenantId: 'TEN-NISSAN-SH', scenarioType: 'MANUAL_OUTBOUND', status: 'FAIL', testedAt: '2026-09-02 09:10', method: '门店业务用户 PhoneBar 鉴权阻断样本', summary: '基础配置完整，但本人调用鉴权仍处于 POC，不能标记可用。', evidenceType: 'DEMO', realVerification: '未验证' }
  ];

  const calls = [
    { callId: 'CALL-MAN-1001', contactId: 'ALI-C-88001', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', callType: '人工外呼', direction: '呼出', taskId: '', caller: '400****801', callee: '138****6621', agentIdentityId: 'CCI-N-001', agentName: '陈敏', skillGroupId: 'SG-ALI-HQ-SALES', queueAt: '—', ringingAt: '2026-09-02 10:01:12', answeredAt: '2026-09-02 10:01:20', endedAt: '2026-09-02 10:04:46', durationSeconds: 206, result: '接通', recordingApplicability: '适用', recordingSource: 'CCC', recordingScope: '全程', recordingStatus: '可播放', recordingUrlExpiresAt: '2026-09-03 10:05:12', businessSystemId: 'BIZ-DCC-HQ', businessRecordId: 'DCC-LEAD-88201', agentDisposition: '客户有意向，已约到店', callbackStatus: '成功' },
    { callId: 'CALL-PRED-1002', contactId: 'ALI-C-88002', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', callType: '预外呼', direction: '呼出', taskId: 'TASK-PRED-0901', caller: '400****801', callee: '139****0208', agentIdentityId: 'CCI-N-002', agentName: '刘洋', skillGroupId: 'SG-ALI-HQ-AFTER', queueAt: '2026-09-02 10:06:18', ringingAt: '2026-09-02 10:06:02', answeredAt: '2026-09-02 10:06:12', endedAt: '2026-09-02 10:09:35', durationSeconds: 203, result: '接通', recordingApplicability: '适用', recordingSource: 'CCC', recordingScope: '全程', recordingStatus: '可播放', recordingUrlExpiresAt: '2026-09-03 10:10:02', businessSystemId: 'BIZ-DCC-HQ', businessRecordId: 'DCC-B-0901-208', agentDisposition: '完成满意度回访', callbackStatus: '失败' },
    { callId: 'CALL-IVR-1003', contactId: 'ALI-C-88003', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', callType: 'IVR 外呼', direction: '呼出', taskId: 'TASK-IVR-0902', caller: '400****801', callee: '137****9012', agentIdentityId: '', agentName: '', skillGroupId: '', queueAt: '—', ringingAt: '2026-09-02 10:12:02', answeredAt: '2026-09-02 10:12:10', endedAt: '2026-09-02 10:12:48', durationSeconds: 38, result: '完成', recordingApplicability: 'NOT_APPLICABLE_PURE_IVR', recordingSource: 'NONE', recordingScope: '—', recordingStatus: '不适用', businessSystemId: 'BIZ-DCC-HQ', businessRecordId: 'DCC-MAINT-0902-311', agentDisposition: '客户按 1 确认知悉', callbackStatus: '成功', ivrEvidence: { contactFlow: '保养提醒流程', flowVersion: 'V4', mediaVersion: 'maintain-audio-v7', dialAt: '2026-09-02 10:12:01', nodes: [
      { at: '10:12:10', node: '欢迎语', action: '播放完成' }, { at: '10:12:31', node: '确认按键', action: 'DTMF=1' }, { at: '10:12:46', node: '结束语', action: 'EXIT_CONFIRMED' }
    ], exitCode: 'EXIT_CONFIRMED', finalState: '客户已确认' } },
    { callId: 'CALL-IVR-1004', contactId: 'ALI-C-88004', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', callType: 'IVR 外呼', direction: '呼出', taskId: 'TASK-IVR-0902', caller: '400****801', callee: '136****7709', agentIdentityId: 'CCI-N-001', agentName: '陈敏', skillGroupId: 'SG-ALI-HQ-AFTER', queueAt: '2026-09-02 10:17:40', ringingAt: '2026-09-02 10:17:02', answeredAt: '2026-09-02 10:17:10', endedAt: '2026-09-02 10:21:20', durationSeconds: 250, result: '接通', recordingApplicability: '适用', recordingSource: 'CCC', recordingScope: '有人参与阶段', recordingStatus: '可播放', recordingUrlExpiresAt: '2026-09-03 10:21:45', businessSystemId: 'BIZ-DCC-HQ', businessRecordId: 'DCC-MAINT-0902-407', agentDisposition: '已转人工完成预约', callbackStatus: '成功', ivrEvidence: { contactFlow: '保养提醒流程', flowVersion: 'V4', mediaVersion: 'maintain-audio-v7', nodes: [{ at: '10:17:10', node: '欢迎语', action: '播放' }, { at: '10:17:35', node: '转人工', action: '进入有人参与阶段' }], exitCode: 'TRANSFER_AGENT', finalState: '人工完成' } },
    { callId: 'CALL-IN-1005', contactId: 'ALI-C-88005', tenantId: 'TEN-NISSAN-SH', instanceId: 'CCC-NISSAN', callType: '呼入', direction: '呼入', taskId: '', caller: '135****8812', callee: '400****801', agentIdentityId: 'CCI-SH-003', agentName: '赵婷', skillGroupId: 'SG-ALI-SH-SALES', queueAt: '2026-09-02 10:20:14', ringingAt: '2026-09-02 10:20:32', answeredAt: '2026-09-02 10:20:40', endedAt: '2026-09-02 10:24:18', durationSeconds: 218, result: '接通', recordingApplicability: '适用', recordingSource: 'CCC', recordingScope: '有人参与阶段', recordingStatus: '可播放', recordingUrlExpiresAt: '2026-09-03 10:24:30', businessSystemId: 'BIZ-DCC-HQ', businessRecordId: 'DCC-IN-66021', agentDisposition: '售前咨询，已新增客户', callbackStatus: '成功', routeEvidence: 'DTMF-3 → TEN-NISSAN-SH → PHY-SH-SALES' },
    { callId: 'CALL-IN-1006', contactId: 'ALI-C-88006', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', callType: '呼入', direction: '呼入', taskId: '', caller: '150****0201', callee: '400****801', agentIdentityId: '', agentName: '', skillGroupId: 'SG-ALI-HQ-SALES', queueAt: '2026-09-02 09:02:10', ringingAt: '—', answeredAt: '—', endedAt: '2026-09-02 09:04:10', durationSeconds: 0, result: '排队超时', recordingApplicability: '待判定', recordingSource: 'NONE', recordingScope: '—', recordingStatus: '不适用', businessSystemId: '', businessRecordId: '', agentDisposition: '', callbackStatus: '无需回流', routeEvidence: 'DTMF-1 → TEN-NISSAN-HQ → 队列超时提示后挂断' }
  ];

  const callbacks = [
    { callbackId: 'CB-7001', callId: 'CALL-MAN-1001', tenantId: 'TEN-NISSAN-HQ', businessSystemId: 'BIZ-DCC-HQ', businessRecordId: 'DCC-LEAD-88201', status: '成功', attempts: [{ at: '2026-09-02 10:04:51', result: 'HTTP 200', requestId: 'DCC-REQ-7001' }], error: '' },
    { callbackId: 'CB-7002', callId: 'CALL-PRED-1002', tenantId: 'TEN-NISSAN-HQ', businessSystemId: 'BIZ-DCC-HQ', businessRecordId: 'DCC-B-0901-208', status: '失败', attempts: [{ at: '2026-09-02 10:09:41', result: 'HTTP 503', requestId: 'DCC-REQ-7002' }, { at: '2026-09-02 10:10:12', result: 'HTTP 503', requestId: 'DCC-REQ-7002-R1' }], error: 'DCC 服务暂不可用，等待管理员重试' }
  ];

  // 本地异常样本及核对响应，不代表阿里云实时结果。
  const callDataIssues = [
    { issueId: 'DEMO-DATA-01', callId: 'DEMO-CALL-DATA-01', instanceId: 'CCC-NISSAN', tenantId: 'TEN-NISSAN-HQ', callee: '138****0001', callType: '人工外呼', type: '结束信息缺失', impact: '通话未正常结束展示，时长统计不完整', status: '待处理', detectedAt: '2026-09-08 09:20:00', lastResult: '自动核对后仍缺结束信息，需人工重新核对', readback: { result: '接通', endedAt: '2026-09-08 09:18:00', durationSeconds: 120 }, attempts: 0, trace: [] },
    { issueId: 'DEMO-DATA-02', callId: 'DEMO-CALL-DATA-02', instanceId: 'CCC-NISSAN', tenantId: 'TEN-NISSAN-SH', callee: '139****0002', callType: '人工外呼', type: '通话结果待确认', impact: '结果暂不能确认，相关统计尚不完整', status: '待处理', detectedAt: '2026-09-08 09:25:00', lastResult: '自动核对尚未取得完整结果，需人工关注', readback: null, attempts: 0, trace: [] }
  ];
  callDataIssues.forEach(row => calls.push({ callId: row.callId, tenantId: row.tenantId, instanceId: row.instanceId, callee: row.callee, caller: '400****801', callType: row.callType, direction: '呼出', result: '待核对', endedAt: '', durationSeconds: null, answeredAt: '—', agentName: '—', simulation: true, recordingStatus: '演示无录音', callbackStatus: '无需回流', callSource: 'NATIVE_WORKBENCH' }));

  const eventHealth = [
    { channelId: 'MQ-CCC-NISSAN', instanceId: 'CCC-NISSAN', name: 'CCC 话务事件', transport: 'RocketMQ', status: '健康', lagSeconds: 3, duplicateCount: 12, outOfOrderCount: 4, missingCount: 1, reconciledCount: 1, lastEventAt: '2026-09-02 10:29:58' },
    { channelId: 'MQ-CCC-EPI', instanceId: 'CCC-EPI', name: '奕派话务事件', transport: 'RocketMQ', status: '待联调', lagSeconds: 0, duplicateCount: 0, outOfOrderCount: 0, missingCount: 0, reconciledCount: 0, lastEventAt: '—' }
  ];

  const exceptions = [
    { exceptionId: 'EX-9001', tenantId: 'TEN-NISSAN-SH', instanceId: 'CCC-NISSAN', source: '坐席配置', type: '坐席创建', objectId: 'DEMO-CREATE-1043', title: '坐席登录名冲突', impact: '云呼叫坐席创建失败，尚未关联业务账号，其他坐席不受影响', responsibleRole: '租户管理员', status: '待处理', requestId: 'REQ-ALI-82431', retryCount: 0, reason: 'CreateUser 返回 LoginName 已存在', updatedAt: '2026-09-02 10:06:41', trace: [{ at: '2026-09-02 10:06:41', action: '管理员创建坐席失败', result: '保留输入、RequestId 与失败原因', operator: '系统' }] },
    { exceptionId: 'EX-9002', tenantId: 'TEN-NISSAN-HQ', instanceId: 'CCC-NISSAN', source: '结果回流', type: '结果回流', objectId: 'CB-7002', title: 'DCC 结果回流持续失败', impact: '业务系统暂未收到结果，通话终态与录音不受影响', responsibleRole: '租户管理员', status: '待处理', requestId: 'DCC-REQ-7002-R1', retryCount: 1, reason: 'HTTP 503', updatedAt: '2026-09-02 10:10:12', trace: [{ at: '2026-09-02 10:09:41', action: '首次回流失败', result: 'HTTP 503', operator: '系统' }, { at: '2026-09-02 10:10:12', action: '自动重试失败', result: 'HTTP 503，转人工处理', operator: '系统' }] },
    { exceptionId: 'EX-9003', tenantId: 'TEN-NISSAN-SH', instanceId: 'CCC-NISSAN', source: '技能同步', type: '技能同步', objectId: 'PHY-SH-AFTER', title: '物理技能组创建结果未知', impact: '上海门店售后场景不可上线，不影响售前技能组', responsibleRole: '租户管理员', status: '核查中', requestId: 'REQ-ALI-82452', retryCount: 1, reason: '请求超时，需 List/Get 回查', updatedAt: '2026-09-02 10:09:20', trace: [{ at: '2026-09-02 10:09:20', action: 'CreateSkillGroup 超时', result: '结果未知，进入回查', operator: '系统' }] }
  ];

  const audits = [
    { auditId: 'AUD-8001', instanceId: 'CCC-NISSAN', tenantId: 'TEN-NISSAN-HQ', operator: '平台超级管理员', action: '号码业务隔离', object: 'NUM-400-8802', before: 'Both / FLOW-NISSAN-ENTRY-V8', after: 'Inbound / FLOW-MAINTENANCE-IVR-V2', at: '2026-09-01 15:21:00' },
    { auditId: 'AUD-8002', instanceId: 'CCC-NISSAN', tenantId: 'TEN-NISSAN-SH', operator: '李明', action: '同步失败重试', object: 'PHY-SH-AFTER', before: '同步失败', after: '核查中', at: '2026-09-02 10:09:20' },
    { auditId: 'AUD-8003', instanceId: 'CCC-NISSAN', tenantId: 'TEN-NISSAN-HQ', operator: '李明', action: '切换默认人工方案', object: 'PLAN-HQ-MANUAL', before: 'V2', after: 'V3', at: '2026-09-02 09:00:10' }
  ];

  const capabilityTaxonomy = [
    { key: 'official-composed', label: '公开能力覆盖 / 中台组合', description: '厂商动作有公开依据，租户隔离、权限、状态与补偿由中台实现。' },
    { key: 'platform', label: '中台二次开发', description: '不依赖 CCC 或属于中台自有业务规则与数据。' },
    { key: 'conditional', label: '条件可行 / 阻断 POC', description: '主能力存在，但关键行为必须经真实环境 POC 后才能承诺投产。' },
    { key: 'unsupported', label: '公开能力不满足', description: '公开接口缺失或与目标冲突，必须调整产品方案。' }
  ];

  const data = {
    demoSwitchEnabled: true,
    demoAccountIds: ['ACC-ADMIN-018', 'ACC-OPS-CHEN', 'ACC-OPS-108', 'ACC-OPS-066', 'ACC-SUPER-001'],
    nativeWorkbench: {
      contacts: [
        { id: 'NATIVE-CUSTOMER-01', tenantId: 'TEN-NISSAN-HQ', name: '张先生（演示）', phone: '13800000001', note: '客户希望了解试驾安排' },
        { id: 'NATIVE-CUSTOMER-02', tenantId: 'TEN-NISSAN-HQ', name: '林女士（演示）', phone: '13800000002', note: '跟进上次沟通情况' },
        { id: 'NATIVE-CUSTOMER-03', tenantId: 'TEN-NISSAN-SH', name: '陈先生（演示）', phone: '13800000003', note: '确认到店时间' }
      ],
      outcomes: ['已完成沟通', '需要再次联系', '客户暂无需求', '号码有误', '客户拒绝联系'],
      blockedNumbers: [],
      demoResults: ['接通', '无人接听', '客户忙线']
    },
    meta: { generatedAt: now, disclaimer: '静态 Mock 数据；不连接真实阿里云、线路、AI 厂商或生产业务系统。' },
    demoProfiles, instances, tenants, accounts, memberships, businessAccountBindings: [],
    providerAccounts, capabilities, capabilityGrants, aiRobots, aiLegacyScenes,
    aiPaymentOrders, aiRechargeHistory, aiBalanceAdjustments, aiFrozenTasks,
    numberIntakePool, numberImportJobs, numberOnboardingBatches, numberOnboardingDemo, businessSystems, businessUserDirectory, agents, skillTemplates, physicalSkillGroups, agentSkills, syncRecords,
    lines, phoneNumbers, callPlans, inboundRoutes, predictiveTasks, ivrTasks, tasks, scenarioTests, calls, callbacks,
    eventHealth, callDataIssues, exceptions, audits, capabilityTaxonomy,
    resourceAlerts: exceptions.map(item => ({ alertId: item.exceptionId, instanceId: item.instanceId, poolId: '', title: item.title, detail: item.reason, status: item.status, occurredAt: item.updatedAt })),
    backflows: callbacks.map(item => ({ backflowId: item.callbackId, callAttemptId: item.callId, status: item.status === '失败' ? '持续失败' : '已投递', error: item.error, history: item.attempts })),
    numberPools: [],
    predictiveStrategyTemplates: [],
    contactFlows: [
      { contactFlowId: 'FLOW-PRED-HQ-V1', name: '总部预外呼转坐席流程（演示）', version: 'V1', usage: '预外呼', status: '已发布', instanceId: 'CCC-NISSAN' },
      { contactFlowId: 'FLOW-NISSAN-ENTRY-V8', name: '日产共享号码入口 IVR', version: 'V8', usage: '呼入入口', status: '已发布', instanceId: 'CCC-NISSAN' },
      { contactFlowId: 'FLOW-MAINTENANCE-IVR-V2', name: '暂停服务 IVR', version: 'V2', usage: '呼入暂停提示', status: '已发布', instanceId: 'CCC-NISSAN' },
      { contactFlowId: 'FLOW-MAINTAIN-OUT-V4', name: '保养提醒外呼流程', version: 'V4', usage: 'IVR外呼', status: '已发布', instanceId: 'CCC-NISSAN' }
    ]
  };

  if (Array.isArray(window.MockSceneList)) {
    window.MockSceneList.forEach((item, index) => {
      const isStore = [1, 2, 3, 4, 6, 10, 12].includes(item.id);
      const tenantId = isStore ? 'TEN-NISSAN-SH' : 'TEN-NISSAN-HQ';
      const providerAccountId = isStore ? 'AI-ACCOUNT-SH' : 'AI-ACCOUNT-NISSAN';
      const robotId = isStore ? 'AI-ROBOT-SH' : 'AI-ROBOT-HQ';
      const scene = aiLegacyScenes[index % aiLegacyScenes.length];
      Object.assign(item, {
        taskId: item.taskId || `LEGACY-AI-${String(item.id).padStart(4, '0')}`,
        tenantId, providerAccountId, robotId,
        environment: 'production', sceneId: scene.sceneId,
        integrationType: '第三方AI/非CCC', instanceId: null, skillGroupId: null, cccUserId: null
      });
    });
  }

  function sequence(prefix, rows) {
    return `${prefix}-${String(rows.length + 1).padStart(4, '0')}`;
  }

  function addAudit(action, object, tenantId, before, after) {
    const state = window.AppState ? AppState.get() : {};
    const profile = window.AppState ? AppState.profile() : { label: '系统' };
    const row = {
      auditId: sequence('AUD', data.audits), instanceId: state.instanceId || '', tenantId: tenantId || state.tenantId || '',
      operator: profile.label || '系统', action, object, before: before || '—', after: after || '—', at: new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-')
    };
    data.audits.unshift(row);
    return row;
  }

  window.CloudCallData = data;
  window.CloudCallRuntime = {
    sequence,
    addAudit,
    tenant(id) { return data.tenants.find(item => item.tenantId === id); },
    instance(id) { return data.instances.find(item => item.instanceId === id); },
    account(id) { return data.accounts.find(item => item.accountId === id); },
    call(id) { return data.calls.find(item => item.callId === id || item.contactId === id); },
    touch() { window.dispatchEvent(new CustomEvent('cloudcall:datachange')); }
  };
})();
