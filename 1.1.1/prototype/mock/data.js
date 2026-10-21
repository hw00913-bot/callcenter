/**
 * 统一外呼中台桌面原型 Mock 数据。
 * 业务事实来自 memory/business-rules.md；不连接真实AliCti或线路。
 */
(function () {
  'use strict';

  const now = '2026-09-02 10:30:00';

  const instances = [
    {
      enterpriseId: '7522240', name: '东风日产总部联络中心', brandId: 'BRAND-NISSAN', brandCustomerName: '东风日产',
      status: 'RUNNING', statusLabel: '运行中', syncStatus: '已同步', region: '华东1（杭州）',
      tenantIds: ['TEN-NISSAN-HQ'], callerNavigations: [
        { name: '总部销售外显', customerClidsGroup: 'DEMO-HQ-DEFAULT-NAV' },
        { name: '总部售后外显', customerClidsGroup: 'DEMO-HQ-SERVICE-NAV' }
      ],
      defaultService: { weekdays: '周一至周日', timeRange: '08:30—20:30', queueTimeoutSeconds: 120, timeoutPrompt: '当前坐席忙，请稍后再拨' },
      updatedAt: '2026-09-02 09:10:00'
    },
    {
      enterpriseId: '7522241', name: '上海华东门店联络中心', brandId: 'BRAND-NISSAN', brandCustomerName: '东风日产',
      status: 'RUNNING', statusLabel: '运行中', syncStatus: '已同步', region: '华东1（杭州）',
      tenantIds: ['TEN-NISSAN-SH'], callerNavigations: [{ name: '门店外显', customerClidsGroup: 'DEMO-SH-DEFAULT-NAV' }],
      defaultService: { weekdays: '周一至周日', timeRange: '09:00—19:00', queueTimeoutSeconds: 90, timeoutPrompt: '当前坐席忙，请稍后再拨' },
      updatedAt: '2026-09-02 09:10:00'
    },
    {
      enterpriseId: 'DEMO-ENT-003', name: '东风奕派联络中心', brandId: 'BRAND-EPI', brandCustomerName: '东风奕派',
      status: 'RUNNING', statusLabel: '运行中', syncStatus: '已同步', region: '华东1（杭州）',
      tenantIds: ['TEN-EPI-HQ'], callerNavigations: [{ name: '奕派外显', customerClidsGroup: 'DEMO-EPI-DEFAULT-NAV' }],
      defaultService: { weekdays: '周一至周六', timeRange: '09:00—18:30', queueTimeoutSeconds: 90, timeoutPrompt: '非服务时间请关注官方服务号' },
      updatedAt: '2026-09-01 18:20:00'
    },
    {
      enterpriseId: 'CCC-TEST', name: '集成验证供应商账号', brandCustomerName: '项目联调',
      status: 'STOPPED', statusLabel: '已停止', syncStatus: '需关注', region: '华东1（杭州）',
      tenantIds: [],
      defaultService: { weekdays: '周一至周五', timeRange: '09:00—18:00', queueTimeoutSeconds: 60, timeoutPrompt: '测试供应商账号暂停服务' },
      updatedAt: '2026-08-29 17:00:00'
    }
  ];

  const tenants = [
    { tenantId: 'TEN-NISSAN-HQ', brandId: 'BRAND-NISSAN', name: '东风日产总部', organizationScope: 'HEADQUARTERS', organizationLabel: '总部', capabilitySet: ['CLOUD_CONTACT_CENTER'], enterpriseId: '7522240', status: '启用', hasBusinessData: true },
    { tenantId: 'TEN-NISSAN-SH', brandId: 'BRAND-NISSAN', name: '上海华东门店', organizationScope: 'STORE', organizationLabel: '门店', capabilitySet: ['CLOUD_CONTACT_CENTER'], enterpriseId: '7522241', status: '启用', hasBusinessData: true },
    { tenantId: 'TEN-EPI-HQ', name: '东风奕派总部', organizationScope: 'HEADQUARTERS', organizationLabel: '总部', capabilitySet: ['CLOUD_CONTACT_CENTER'], enterpriseId: 'DEMO-ENT-003', status: '启用', hasBusinessData: false }
  ];

  const accounts = [
    { accountId: 'ACC-SUPER-001', loginUsername: 'super-product', name: '平台超级管理员', nickname: '平台超管', mobile: '159****5393', loginMobile: '15975585393', avatar: '', password: '123456Aa@', status: '启用', builtIn: true, lastEnterpriseId: '7522240' },
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

  const agents = [
    { agentRecordId: 'AGT-001', contactCenterIdentityId: 'CCI-N-001', accountId: 'ACC-OPS-CHEN', userName: '陈敏', mobile: '138****5201', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', cno: '1001', areaCode: '021', loginName: 'seat_1001', email: 'c***@example.com', roleId: 'Agent@7522240', lifecycleStatus: '已启用', agentStatus: '空闲', syncStatus: '同步成功', callEnabled: true, currentCall: false, acceptNewTasks: true },
    { agentRecordId: 'AGT-002', contactCenterIdentityId: 'CCI-N-002', accountId: '', userName: '刘洋', mobile: '139****5202', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', cno: '1002', areaCode: '021', loginName: 'seat_1002', email: 'l***@example.com', roleId: 'Agent@7522240', lifecycleStatus: '已启用', agentStatus: '通话中', syncStatus: '同步成功', callEnabled: true, currentCall: true, acceptNewTasks: true },
    { agentRecordId: 'AGT-003', contactCenterIdentityId: 'CCI-SH-003', accountId: '', userName: '赵婷', mobile: '136****5203', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', cno: '1003', areaCode: '021', loginName: 'seat_1003', email: 'z***@example.com', roleId: 'Agent@7522241', lifecycleStatus: '已启用', agentStatus: '话后处理', syncStatus: '同步成功', callEnabled: true, currentCall: false, acceptNewTasks: true },
    { agentRecordId: 'AGT-004', contactCenterIdentityId: 'CCI-N-004', accountId: '', userName: '孙悦', mobile: '133****5198', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', cno: '0998', areaCode: '021', loginName: 'seat_0998', email: 's***@example.com', roleId: 'Agent@7522240', lifecycleStatus: '已停用', agentStatus: '离线', syncStatus: '同步成功', callEnabled: false, currentCall: false, acceptNewTasks: false }
  ];

  const skillTemplates = [
    { skillTemplateId: 'TPL-SALES', enterpriseId: '7522240', name: '售前咨询', code: 'SALES', status: '启用', mappedTenantCount: 1, updatedAt: now },
    { skillTemplateId: 'TPL-AFTER', enterpriseId: '7522240', name: '售后服务', code: 'AFTER_SALES', status: '启用', mappedTenantCount: 1, updatedAt: now },
    { skillTemplateId: 'TPL-EPI-AFTER', enterpriseId: 'DEMO-ENT-003', name: '售后服务', code: 'AFTER_SALES', status: '启用', mappedTenantCount: 1, updatedAt: now },
    { skillTemplateId: 'TPL-COMPLAINT', enterpriseId: '7522240', name: '投诉处理', code: 'COMPLAINT', status: '启用', mappedTenantCount: 1, updatedAt: now }
  ];
  skillTemplates.push(
    { skillTemplateId: 'TPL-SH-SALES', enterpriseId: '7522241', name: '售前咨询', code: 'SALES', status: '启用', mappedTenantCount: 1, updatedAt: now },
    { skillTemplateId: 'TPL-SH-AFTER', enterpriseId: '7522241', name: '售后服务', code: 'AFTER_SALES', status: '启用', mappedTenantCount: 1, updatedAt: now }
  );
  const physicalSkillGroups = [
    { physicalGroupId: 'PHY-HQ-SALES', skillGroupId: 'SG-ALI-HQ-SALES', skillTemplateId: 'TPL-SALES', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', name: '总部·售前咨询', status: '已启用', memberCount: 2, referenceCount: 2, syncStatus: '同步成功' },
    { physicalGroupId: 'PHY-HQ-AFTER', skillGroupId: 'SG-ALI-HQ-AFTER', skillTemplateId: 'TPL-AFTER', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', name: '总部·售后服务', status: '已启用', memberCount: 1, referenceCount: 2, syncStatus: '同步成功' },
    { physicalGroupId: 'PHY-SH-SALES', skillGroupId: 'SG-ALI-SH-SALES', skillTemplateId: 'TPL-SH-SALES', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', name: '上海门店·售前咨询', status: '已启用', memberCount: 1, referenceCount: 1, syncStatus: '同步成功' },
    { physicalGroupId: 'PHY-SH-AFTER', skillGroupId: 'SG-ALI-SH-AFTER', skillTemplateId: 'TPL-SH-AFTER', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', name: '上海门店·售后服务', status: '同步失败', memberCount: 0, referenceCount: 0, syncStatus: '同步失败' }
  ];
  const agentSkills = [
    { relationId: 'AS-001', identityId: 'CCI-N-001', physicalGroupId: 'PHY-HQ-SALES', skillLevel: 2, status: '已生效', syncStatus: '同步成功' },
    { relationId: 'AS-002', identityId: 'CCI-N-001', physicalGroupId: 'PHY-HQ-AFTER', skillLevel: 5, status: '已生效', syncStatus: '同步成功' },
    { relationId: 'AS-003', identityId: 'CCI-N-002', physicalGroupId: 'PHY-HQ-AFTER', skillLevel: 1, status: '已生效', syncStatus: '同步成功' },
    { relationId: 'AS-004', identityId: 'CCI-SH-003', physicalGroupId: 'PHY-SH-SALES', skillLevel: 3, status: '已生效', syncStatus: '同步成功' }
  ];

  const syncRecords = [
    { syncId: 'SYNC-3002', objectType: '云呼叫坐席创建', objectId: 'DEMO-CREATE-1043', objectName: '邓楠', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', sourceVersion: 'v42', status: '失败', failureReason: 'CreateUser 返回 LoginName 已存在；已保留输入和 RequestId', requestId: 'REQ-ALI-82431', retryCount: 0, updatedAt: '2026-09-02 10:06:41' },
    { syncId: 'SYNC-3003', objectType: '物理技能组映射', objectId: 'PHY-SH-AFTER', objectName: '上海门店·售后服务', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', sourceVersion: 'v3', status: '失败', failureReason: 'CreateSkillGroup 超时；需要先回查实际结果', requestId: 'REQ-ALI-82452', retryCount: 1, updatedAt: '2026-09-02 10:09:20' },
    { syncId: 'SYNC-3004', objectType: '坐席技能关系', objectId: 'AS-004', objectName: '赵婷 / 售前咨询', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', sourceVersion: 'v9', status: '成功', failureReason: '', retryCount: 0, updatedAt: '2026-09-02 10:11:02' }
  ];

  const lines = [
    { lineId: 'LINE-HOPE-01', sourceType: 'EXTERNAL', importAllowlisted: true, routingConfirmed: false, name: '厚朴 SIP 主线路', provider: '厚朴', enterpriseIds: ['7522240'], status: '联调中', acceptanceStatus: '待确认', pocStatus: '验证中', concurrentLimit: 80, ipWhitelist: '已提交', dtmf: '待验证', failover: '待验证', updatedAt: now },
    { lineId: 'LINE-ALI-01', sourceType: 'ALICTI', importAllowlisted: false, routingConfirmed: true, name: 'AliCti验证线路', provider: 'AliCti', enterpriseIds: ['7522240'], status: '启用', acceptanceStatus: '测试可用', pocStatus: '已通过', concurrentLimit: 20, ipWhitelist: '已完成', dtmf: '已通过', failover: '不适用', updatedAt: now },
    { lineId: 'LINE-EPI-01', sourceType: 'EXTERNAL', importAllowlisted: false, routingConfirmed: false, name: '奕派试运行线路', provider: '第三方线路商', enterpriseIds: ['DEMO-ENT-003'], status: '待加白', acceptanceStatus: '未开始', pocStatus: '未开始', concurrentLimit: 40, ipWhitelist: '待提交', dtmf: '未验证', failover: '未验证', updatedAt: now }
  ];

  lines.push({lineId:'LINE-ALI-VOICE-DEMO',name:'供应商语音服务接入（演示）',provider:'供应商演示',sourceType:'ALI_VOICE',enterpriseIds:['7522240'],importAllowlisted:true,routingConfirmed:false,concurrentLimit:null,status:'待验证',pocStatus:'未开始',acceptanceStatus:'待路由确认',dtmf:'待验证',failover:'待验证'});
  lines.push(
    { lineId: 'LINE-ALI-SH-01', sourceType: 'ALICTI', importAllowlisted: false, routingConfirmed: true, name: '上海门店 AliCti 验证线路', provider: 'AliCti', enterpriseIds: ['7522241'], status: '启用', acceptanceStatus: '测试可用', pocStatus: '已通过', concurrentLimit: 20, ipWhitelist: '已完成', dtmf: '已通过', failover: '不适用', updatedAt: now },
    { lineId: 'LINE-HOPE-SH-01', sourceType: 'EXTERNAL', importAllowlisted: true, routingConfirmed: false, name: '上海门店 SIP 线路', provider: '厚朴', enterpriseIds: ['7522241'], status: '联调中', acceptanceStatus: '待确认', pocStatus: '验证中', concurrentLimit: 20, ipWhitelist: '已提交', dtmf: '待验证', failover: '待验证', updatedAt: now },
    { lineId: 'LINE-ALI-VOICE-SH-DEMO', name: '上海门店供应商语音服务（演示）', provider: '供应商演示', sourceType: 'ALI_VOICE', enterpriseIds: ['7522241'], importAllowlisted: true, routingConfirmed: false, concurrentLimit: null, status: '待验证', pocStatus: '未开始', acceptanceStatus: '待路由确认', dtmf: '待验证', failover: '待验证' }
  );
  const numberIntakePool = [
    {id:'POOL-ALI-01',number:'02100009001',enterpriseId:'7522240',province:'上海',city:'上海',state:'已在号码池确认',assignedEnterpriseId:'',simulation:true},
    {id:'POOL-ALI-400',number:'4000009001',enterpriseId:'7522240',province:'上海',city:'上海',state:'已在号码池确认',assignedEnterpriseId:'',simulation:true}
  ];
  const numberImportJobs = [];
  const numberOnboardingBatches = [];
  // Test fixtures only; never expose simulated vendor responses in business forms.
  const numberOnboardingDemo = {importOutcome:'success',addOutcome:'success',addFailedNumbers:[],unconfirmedNumbers:[]};
  const phoneNumbers = [
    { numberId: 'NUM-400-8801', number: '400****801', enterpriseId: '7522240', lineId: 'LINE-ALI-01', usage: '呼入+呼出', aliyunUsage: 'Bidirection', status: '正常', businessStatus: '正常', contactFlowId: 'FLOW-NISSAN-ENTRY-V8', authorizedTenantIds: ['TEN-NISSAN-HQ'], referenceCount: 6, restoreSnapshot: null },
    { numberId: 'NUM-021-6601', number: '021****601', enterpriseId: '7522240', lineId: 'LINE-HOPE-01', usage: '呼入+呼出', aliyunUsage: 'Bidirection', status: '验证中', businessStatus: '正常', contactFlowId: 'FLOW-NISSAN-ENTRY-V8', authorizedTenantIds: ['TEN-NISSAN-HQ'], referenceCount: 2, restoreSnapshot: null },
    { numberId: 'NUM-400-8802', number: '400****802', enterpriseId: '7522240', lineId: 'LINE-ALI-01', usage: '呼入+呼出', aliyunUsage: 'Bidirection', status: '已隔离', businessStatus: '已隔离', contactFlowId: 'FLOW-NISSAN-ENTRY-V8', authorizedTenantIds: ['TEN-NISSAN-HQ'], referenceCount: 4, restoreSnapshot: { snapshotId: 'NS-20260901-01', kind: 'alicti-number-status', supplierStatus: 1, previousStatus: '正常', previousUsage: 'Bidirection', previousContactFlowId: 'FLOW-NISSAN-ENTRY-V8', authorizedTenantIds: ['TEN-NISSAN-HQ'], reason: '号码投诉核查', createdAt: '2026-09-01 15:20:00' } },
    { numberId: 'NUM-EPI-4001', number: '400****419', enterpriseId: 'DEMO-ENT-003', lineId: 'LINE-EPI-01', usage: '呼入+呼出', aliyunUsage: 'Bidirection', status: '待联调', businessStatus: '正常', contactFlowId: 'FLOW-EPI-ENTRY-V1', authorizedTenantIds: ['TEN-EPI-HQ'], referenceCount: 1, restoreSnapshot: null }
  ];

  phoneNumbers.push({ numberId: 'NUM-SH-4001', number: '400****901', enterpriseId: '7522241', lineId: 'LINE-ALI-SH-01', usage: '呼入+呼出', aliyunUsage: 'Bidirection', status: '正常', businessStatus: '正常', contactFlowId: 'FLOW-SH-ENTRY-V1', authorizedTenantIds: ['TEN-NISSAN-SH'], referenceCount: 4, restoreSnapshot: null });

  const callPlans = [
    { callPlanId: 'PLAN-HQ-MANUAL', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', name: '总部人工客户回访', description: '历史人工外呼规则快照（已停止维护）', callType: '人工外呼', status: '已发布', publishedVersion: 'V3', isDefaultManualPlan: true, targetSkillGroupId: 'SG-ALI-HQ-SALES', allowedCallerNumberIds: ['NUM-400-8801', 'NUM-021-6601'], fallbackRule: '无可用号码时阻断呼叫', updatedAt: now },
    { callPlanId: 'PLAN-HQ-PRED', executionQueueId: 'SG-ALI-HQ-AFTER', contactFlowId: 'FLOW-PRED-HQ-V1', transferEnabled: true, tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', name: '总部批量回访预外呼', description: '客户接通后分配总部坐席', callType: '预外呼', status: '已发布', publishedVersion: 'V2', isDefaultManualPlan: false, targetSkillGroupId: 'SG-ALI-HQ-AFTER', allowedCallerNumberIds: ['NUM-400-8801'], fallbackRule: '暂停新分配并进入待处理', updatedAt: now },
    { callPlanId: 'PLAN-HQ-IVR', executionQueueId: 'SG-ALI-HQ-AFTER', transferEnabled: false, tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', name: '保养到期自动提醒', description: '纯 IVR 通知与按键确认', callType: 'IVR 外呼', status: '已发布', publishedVersion: 'V4', isDefaultManualPlan: false, targetSkillGroupId: '', allowedCallerNumberIds: ['NUM-400-8801'], contactFlowId: 'FLOW-MAINTAIN-OUT-V4', fallbackRule: '无输入后标记可重呼', updatedAt: now },
    { callPlanId: 'PLAN-HQ-INBOUND', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', name: '总部客户服务热线', description: '总部售前与售后呼入承接', callType: '呼入', status: '已发布', publishedVersion: 'V5', isDefaultManualPlan: false, targetSkillGroupId: 'SG-ALI-HQ-SALES', allowedCallerNumberIds: ['NUM-400-8801'], fallbackRule: '本租户排队超时提示后挂断', updatedAt: now },
    { callPlanId: 'PLAN-SH-MANUAL', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', name: '上海门店人工跟进', description: '门店客户人工跟进默认规则', callType: '人工外呼', status: '已发布', publishedVersion: 'V1', isDefaultManualPlan: true, targetSkillGroupId: 'SG-ALI-SH-SALES', allowedCallerNumberIds: ['NUM-SH-4001'], fallbackRule: '无可用号码时阻断呼叫', updatedAt: now },
    { callPlanId: 'PLAN-DRAFT-01', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', name: '总部投诉回访草稿', description: '尚未完成资源校验', callType: '预外呼', status: '草稿', publishedVersion: '—', isDefaultManualPlan: false, targetSkillGroupId: 'SG-ALI-HQ-SALES', allowedCallerNumberIds: [], fallbackRule: '待配置', updatedAt: now }
  ];

  callPlans.push(
    { callPlanId: 'PLAN-SH-INBOUND', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', name: '上海门店客户服务热线', description: '上海门店独立服务入口', callType: '呼入', status: '已发布', publishedVersion: 'V1', isDefaultManualPlan: false, targetSkillGroupId: 'SG-ALI-SH-SALES', allowedCallerNumberIds: ['NUM-SH-4001'], fallbackRule: '排队超时提示后挂断', updatedAt: now }
  );

  const inboundRoutes = [
    { routeId: 'ROUTE-NISSAN-400', enterpriseId: '7522240', numberId: 'NUM-400-8801', routeVersion: 'V8', status: '已发布', contactFlowId: 'FLOW-NISSAN-ENTRY-V8', defaultTenantId: 'TEN-NISSAN-HQ', branches: [
      { branchCode: 'DTMF-1', label: '按 1 售前咨询', tenantId: 'TEN-NISSAN-HQ', callPlanId: 'PLAN-HQ-INBOUND', physicalGroupId: 'PHY-HQ-SALES' },
      { branchCode: 'DTMF-2', label: '按 2 售后服务', tenantId: 'TEN-NISSAN-HQ', callPlanId: 'PLAN-HQ-INBOUND', physicalGroupId: 'PHY-HQ-AFTER' }
    ], overrides: { 'TEN-NISSAN-HQ': { serviceTime: '08:30—21:00', queueTimeoutSeconds: 150, source: '租户覆盖' } }, updatedAt: now },
    { routeId: 'ROUTE-NISSAN-MAINT', enterpriseId: '7522240', numberId: 'NUM-400-8802', routeVersion: 'V2', status: '暂停服务', contactFlowId: 'FLOW-MAINTENANCE-IVR-V2', defaultTenantId: '', branches: [], overrides: {}, updatedAt: '2026-09-01 15:21:00' }
  ];

  inboundRoutes.push({ routeId: 'ROUTE-SH-400', enterpriseId: '7522241', numberId: 'NUM-SH-4001', routeVersion: 'V1', status: '已发布', contactFlowId: 'FLOW-SH-ENTRY-V1', defaultTenantId: 'TEN-NISSAN-SH', branches: [{ branchCode: 'DTMF-1', label: '按 1 门店咨询', tenantId: 'TEN-NISSAN-SH', callPlanId: 'PLAN-SH-INBOUND', physicalGroupId: 'PHY-SH-SALES' }], overrides: { 'TEN-NISSAN-SH': { serviceTime: '09:00—19:00', queueTimeoutSeconds: 90, source: '租户覆盖' } }, updatedAt: now });

  const predictiveTasks = [
    { taskId: 'TASK-PRED-0901', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', name: '9月保客满意度回访', callType: '预外呼', status: '执行中', total: 1200, completed: 486, connected: 302, planId: 'PLAN-HQ-PRED', planVersion: 'V2', planSnapshotId: 'SNAP-PRED-0901', campaignId: 'CAM-ALI-90281', listSource: '导入批次 DEMO-B-0901', scheduleAt: '2026-09-02 09:00', hasNextAttempt: true, stopNewDialing: false, owner: '王静' },
    { taskId: 'TASK-PRED-0830', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', name: '上海门店试驾邀约', callType: '预外呼', status: '已暂停', total: 360, completed: 140, connected: 82, planId: '', planVersion: 'V1', planSnapshotId: 'SNAP-PRED-0830', campaignId: 'CAM-ALI-90110', listSource: '导入批次 DEMO-B-SH0830', scheduleAt: '2026-08-30 10:00', hasNextAttempt: true, stopNewDialing: true, owner: '周岚' }
  ];
  const ivrTasks = [
    { taskId: 'TASK-IVR-0902', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', name: '保养到期自动提醒', callType: 'IVR 外呼', status: '执行中', total: 800, completed: 615, connected: 488, planId: 'PLAN-HQ-IVR', planVersion: 'V4', planSnapshotId: 'SNAP-IVR-0902', campaignId: 'CAM-IVR-90311', listSource: '导入批次 DEMO-MAINT-0902', scheduleAt: '2026-09-02 09:30', hasNextAttempt: false, owner: '王静' },
    { taskId: 'TASK-IVR-0831', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', name: '活动到期通知', callType: 'IVR 外呼', status: '已完成', total: 500, completed: 500, connected: 371, planId: 'PLAN-HQ-IVR', planVersion: 'V3', planSnapshotId: 'SNAP-IVR-0831', campaignId: 'CAM-IVR-90181', listSource: '接口名单 API-0831', scheduleAt: '2026-08-31 14:00', hasNextAttempt: false, owner: '王静' }
  ];
  const tasks = [...predictiveTasks, ...ivrTasks];

  const scenarioTests = [
    { testId: 'TEST-HQ-PRED-01', tenantId: 'TEN-NISSAN-HQ', scenarioType: 'PREDICTIVE', status: 'PASS', testedAt: '2026-09-01 16:20', method: '20 条客户数据的本地模拟', summary: '演示总部售后分配与结果、录音状态；未拨打真实号码或回收真实录音。', evidenceType: 'DEMO', realVerification: '未验证' },
    { testId: 'TEST-HQ-IVR-01', tenantId: 'TEN-NISSAN-HQ', scenarioType: 'IVR_OUTBOUND', status: 'PASS', testedAt: '2026-09-01 17:05', method: '预置 IVR 路径与轨迹的本地模拟', summary: '展示联系流版本、按键和结果样本；纯 IVR 录音不适用；无坐席执行仍待真实 POC。', evidenceType: 'DEMO', realVerification: '未验证' },
    { testId: 'TEST-HQ-IN-01', tenantId: 'TEN-NISSAN-HQ', scenarioType: 'INBOUND', status: 'PASS', testedAt: '2026-09-02 08:45', method: '共享号码总部售前分支的本地模拟', summary: '演示租户锁定、排队、人工接听与结果样本；未进行真实呼入验证。', evidenceType: 'DEMO', realVerification: '未验证' },
    { testId: 'TEST-SH-MAN-01', tenantId: 'TEN-NISSAN-SH', scenarioType: 'MANUAL_OUTBOUND', status: 'FAIL', testedAt: '2026-09-02 09:10', method: '门店坐席本人鉴权待联调样本', summary: '基础配置完整，但本人调用鉴权仍处于 POC，不能标记可用。', evidenceType: 'DEMO', realVerification: '未验证' }
  ];

  const calls = [
    { callId: 'CALL-MAN-1001', contactId: 'ALI-C-88001', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', callType: '人工外呼', direction: '呼出', taskId: '', caller: '400****801', callee: '138****6621', agentIdentityId: 'CCI-N-001', agentName: '陈敏', skillGroupId: 'SG-ALI-HQ-SALES', queueAt: '—', ringingAt: '2026-09-02 10:01:12', answeredAt: '2026-09-02 10:01:20', endedAt: '2026-09-02 10:04:46', durationSeconds: 206, result: '接通', recordingApplicability: '适用', recordingSource: 'AliCti', recordingScope: '全程', recordingStatus: '可播放', recordingUrlExpiresAt: '2026-09-03 10:05:12', agentDisposition: '客户有意向，已约到店' },
    { callId: 'CALL-PRED-1002', contactId: 'ALI-C-88002', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', callType: '预外呼', direction: '呼出', taskId: 'TASK-PRED-0901', caller: '400****801', callee: '139****0208', agentIdentityId: 'CCI-N-002', agentName: '刘洋', skillGroupId: 'SG-ALI-HQ-AFTER', queueAt: '2026-09-02 10:06:18', ringingAt: '2026-09-02 10:06:02', answeredAt: '2026-09-02 10:06:12', endedAt: '2026-09-02 10:09:35', durationSeconds: 203, result: '接通', recordingApplicability: '适用', recordingSource: 'AliCti', recordingScope: '全程', recordingStatus: '可播放', recordingUrlExpiresAt: '2026-09-03 10:10:02', agentDisposition: '完成满意度回访' },
    { callId: 'CALL-IVR-1003', contactId: 'ALI-C-88003', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', callType: 'IVR 外呼', direction: '呼出', taskId: 'TASK-IVR-0902', caller: '400****801', callee: '137****9012', agentIdentityId: '', agentName: '', skillGroupId: '', queueAt: '—', ringingAt: '2026-09-02 10:12:02', answeredAt: '2026-09-02 10:12:10', endedAt: '2026-09-02 10:12:48', durationSeconds: 38, result: '完成', recordingApplicability: 'NOT_APPLICABLE_PURE_IVR', recordingSource: 'NONE', recordingScope: '—', recordingStatus: '不适用', agentDisposition: '客户按 1 确认知悉', ivrEvidence: { contactFlow: '保养提醒流程', flowVersion: 'V4', mediaVersion: 'maintain-audio-v7', dialAt: '2026-09-02 10:12:01', nodes: [
      { at: '10:12:10', node: '欢迎语', action: '播放完成' }, { at: '10:12:31', node: '确认按键', action: 'DTMF=1' }, { at: '10:12:46', node: '结束语', action: 'EXIT_CONFIRMED' }
    ], exitCode: 'EXIT_CONFIRMED', finalState: '客户已确认' } },
    { callId: 'CALL-IVR-1004', contactId: 'ALI-C-88004', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', callType: 'IVR 外呼', direction: '呼出', taskId: 'TASK-IVR-0902', caller: '400****801', callee: '136****7709', agentIdentityId: 'CCI-N-001', agentName: '陈敏', skillGroupId: 'SG-ALI-HQ-AFTER', queueAt: '2026-09-02 10:17:40', ringingAt: '2026-09-02 10:17:02', answeredAt: '2026-09-02 10:17:10', endedAt: '2026-09-02 10:21:20', durationSeconds: 250, result: '接通', recordingApplicability: '适用', recordingSource: 'AliCti', recordingScope: '有人参与阶段', recordingStatus: '可播放', recordingUrlExpiresAt: '2026-09-03 10:21:45', agentDisposition: '已转人工完成预约', ivrEvidence: { contactFlow: '保养提醒流程', flowVersion: 'V4', mediaVersion: 'maintain-audio-v7', nodes: [{ at: '10:17:10', node: '欢迎语', action: '播放' }, { at: '10:17:35', node: '转人工', action: '进入有人参与阶段' }], exitCode: 'TRANSFER_AGENT', finalState: '人工完成' } },
    { callId: 'CALL-IN-1005', contactId: 'ALI-C-88005', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', callType: '呼入', direction: '呼入', taskId: '', caller: '135****8812', callee: '400****901', agentIdentityId: 'CCI-SH-003', agentName: '赵婷', skillGroupId: 'SG-ALI-SH-SALES', queueAt: '2026-09-02 10:20:14', ringingAt: '2026-09-02 10:20:32', answeredAt: '2026-09-02 10:20:40', endedAt: '2026-09-02 10:24:18', durationSeconds: 218, result: '接通', recordingApplicability: '适用', recordingSource: 'AliCti', recordingScope: '有人参与阶段', recordingStatus: '可播放', recordingUrlExpiresAt: '2026-09-03 10:24:30', agentDisposition: '售前咨询，已新增客户', routeEvidence: 'DTMF-1 → TEN-NISSAN-SH → PHY-SH-SALES' },
    { callId: 'CALL-IN-1006', contactId: 'ALI-C-88006', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', callType: '呼入', direction: '呼入', taskId: '', caller: '150****0201', callee: '400****801', agentIdentityId: '', agentName: '', skillGroupId: 'SG-ALI-HQ-SALES', queueAt: '2026-09-02 09:02:10', ringingAt: '—', answeredAt: '—', endedAt: '2026-09-02 09:04:10', durationSeconds: 0, result: '排队超时', recordingApplicability: '待判定', recordingSource: 'NONE', recordingScope: '—', recordingStatus: '不适用', agentDisposition: '', routeEvidence: 'DTMF-1 → TEN-NISSAN-HQ → 队列超时提示后挂断' }
  ];

  const callDataIssues = [
    { issueId: 'DEMO-DATA-01', callId: 'DEMO-CALL-DATA-01', enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', callee: '138****0001', callType: '人工外呼', type: '结束信息缺失', impact: '通话未正常结束展示，时长统计不完整', status: '待处理', detectedAt: '2026-09-08 09:20:00', lastResult: '自动核对后仍缺结束信息，需人工重新核对', readback: { result: '接通', endedAt: '2026-09-08 09:18:00', durationSeconds: 120 }, attempts: 0, trace: [] },
    { issueId: 'DEMO-DATA-02', callId: 'DEMO-CALL-DATA-02', enterpriseId: '7522241', tenantId: 'TEN-NISSAN-SH', callee: '139****0002', callType: '人工外呼', type: '通话结果待确认', impact: '结果暂不能确认，相关统计尚不完整', status: '待处理', detectedAt: '2026-09-08 09:25:00', lastResult: '自动核对尚未取得完整结果，需人工关注', readback: null, attempts: 0, trace: [] }
  ];
  callDataIssues.forEach(row => calls.push({ callId: row.callId, tenantId: row.tenantId, enterpriseId: row.enterpriseId, callee: row.callee, caller: row.enterpriseId === '7522241' ? '400****901' : '400****801', callType: row.callType, direction: '呼出', result: '待核对', endedAt: '', durationSeconds: null, answeredAt: '—', agentName: '—', simulation: true, recordingStatus: '演示无录音', callSource: 'NATIVE_WORKBENCH' }));

  const eventHealth = [
    { channelId: 'MQ-7522240', enterpriseId: '7522240', name: 'AliCti 话务事件', transport: 'RocketMQ', status: '健康', lagSeconds: 3, duplicateCount: 12, outOfOrderCount: 4, missingCount: 1, reconciledCount: 1, lastEventAt: '2026-09-02 10:29:58' },
    { channelId: 'MQ-7522241', enterpriseId: '7522241', name: '上海门店 AliCti 话务事件', transport: 'RocketMQ', status: '健康', lagSeconds: 1, duplicateCount: 0, outOfOrderCount: 0, missingCount: 0, reconciledCount: 0, lastEventAt: '2026-09-02 10:29:58' },
    { channelId: 'MQ-DEMO-ENT-003', enterpriseId: 'DEMO-ENT-003', name: '奕派话务事件', transport: 'RocketMQ', status: '待联调', lagSeconds: 0, duplicateCount: 0, outOfOrderCount: 0, missingCount: 0, reconciledCount: 0, lastEventAt: '—' }
  ];

  const exceptions = [
    { exceptionId: 'EX-9001', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', source: '坐席配置', type: '坐席创建', objectId: 'DEMO-CREATE-1043', title: '坐席登录名冲突', impact: '云呼叫坐席创建失败，尚未关联平台账号，其他坐席不受影响', responsibleRole: '租户管理员', status: '待处理', requestId: 'REQ-ALI-82431', retryCount: 0, reason: 'CreateUser 返回 LoginName 已存在', updatedAt: '2026-09-02 10:06:41', trace: [{ at: '2026-09-02 10:06:41', action: '管理员创建坐席失败', result: '保留输入、RequestId 与失败原因', operator: '系统' }] },
    { exceptionId: 'EX-9003', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522241', source: '技能同步', type: '技能同步', objectId: 'PHY-SH-AFTER', title: '物理技能组创建结果未知', impact: '上海门店售后场景不可上线，不影响售前技能组', responsibleRole: '租户管理员', status: '核查中', requestId: 'REQ-ALI-82452', retryCount: 1, reason: '请求超时，需 List/Get 回查', updatedAt: '2026-09-02 10:09:20', trace: [{ at: '2026-09-02 10:09:20', action: 'CreateSkillGroup 超时', result: '结果未知，进入回查', operator: '系统' }] }
  ];

  const audits = [
    { auditId: 'AUD-8001', enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', operator: '平台超级管理员', action: '号码业务隔离', object: 'NUM-400-8802', before: 'Both / FLOW-NISSAN-ENTRY-V8', after: 'Inbound / FLOW-MAINTENANCE-IVR-V2', at: '2026-09-01 15:21:00' },
    { auditId: 'AUD-8002', enterpriseId: '7522241', tenantId: 'TEN-NISSAN-SH', operator: '李明', action: '同步失败重试', object: 'PHY-SH-AFTER', before: '同步失败', after: '核查中', at: '2026-09-02 10:09:20' },
    { auditId: 'AUD-8003', enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', operator: '李明', action: '切换默认人工方案', object: 'PLAN-HQ-MANUAL', before: 'V2', after: 'V3', at: '2026-09-02 09:00:10' }
  ];

  const capabilityTaxonomy = [
    { key: 'official-composed', label: '公开能力覆盖 / 中台组合', description: '厂商动作有公开依据，租户隔离、权限、状态与补偿由中台实现。' },
    { key: 'platform', label: '中台二次开发', description: '不依赖 AliCti 呼叫中心或属于中台自有业务规则与数据。' },
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
      demoResults: ['接通', '无人接听', '客户忙线', '客户拒接', '结果待确认']
    },
    meta: { generatedAt: now, disclaimer: '静态 Mock 数据；不连接真实 AliCti 或线路。' },
    demoProfiles, instances, tenants, accounts, memberships,
    numberIntakePool, numberImportJobs, numberOnboardingBatches, numberOnboardingDemo, agents, skillTemplates, physicalSkillGroups, agentSkills, syncRecords,
    lines, phoneNumbers, callPlans, inboundRoutes, predictiveTasks, ivrTasks, tasks, scenarioTests, calls,
    eventHealth, callDataIssues, exceptions, audits, capabilityTaxonomy,
    resourceAlerts: exceptions.map(item => ({ alertId: item.exceptionId, enterpriseId: item.enterpriseId, poolId: '', title: item.title, detail: item.reason, status: item.status, occurredAt: item.updatedAt })),
    numberPools: [],
    predictiveStrategyTemplates: [],
    contactFlows: [
      { contactFlowId: 'FLOW-PRED-SH-V1', name: '上海门店预外呼转坐席流程（演示）', version: 'V1', usage: '预外呼', status: '已发布', enterpriseId: '7522241' },
      { contactFlowId: 'FLOW-SH-ENTRY-V1', name: '上海门店号码入口 IVR', version: 'V1', usage: '呼入入口', status: '已发布', enterpriseId: '7522241' },
      { contactFlowId: 'FLOW-MAINTAIN-SH-OUT-V4', name: '上海门店保养提醒外呼流程', version: 'V4', usage: 'IVR外呼', status: '已发布', enterpriseId: '7522241' },
      { contactFlowId: 'FLOW-PRED-HQ-V1', name: '总部预外呼转坐席流程（演示）', version: 'V1', usage: '预外呼', status: '已发布', enterpriseId: '7522240' },
      { contactFlowId: 'FLOW-NISSAN-ENTRY-V8', name: '日产总部号码入口 IVR', version: 'V8', usage: '呼入入口', status: '已发布', enterpriseId: '7522240' },
      { contactFlowId: 'FLOW-MAINTENANCE-IVR-V2', name: '暂停服务 IVR', version: 'V2', usage: '呼入暂停提示', status: '已发布', enterpriseId: '7522240' },
      { contactFlowId: 'FLOW-MAINTAIN-OUT-V4', name: '保养提醒外呼流程', version: 'V4', usage: 'IVR外呼', status: '已发布', enterpriseId: '7522240' }
    ]
  };

  function sequence(prefix, rows) {
    return `${prefix}-${String(rows.length + 1).padStart(4, '0')}`;
  }

  function addAudit(action, object, tenantId, before, after) {
    const state = window.AppState ? AppState.get() : {};
    const profile = window.AppState ? AppState.profile() : { label: '系统' };
    const row = {
      auditId: sequence('AUD', data.audits), enterpriseId: state.enterpriseId || '', tenantId: tenantId || state.tenantId || '',
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
    instance(id) { return data.instances.find(item => item.enterpriseId === id); },
    account(id) { return data.accounts.find(item => item.accountId === id); },
    call(id) { return data.calls.find(item => item.callId === id || item.contactId === id); },
    touch() { window.dispatchEvent(new CustomEvent('cloudcall:datachange')); }
  };
})();
