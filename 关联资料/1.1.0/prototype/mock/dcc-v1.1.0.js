/** v1.1.0 DCC 合成样例。不可用凭证，不构成真实接口契约。 */
(function () {
  'use strict';
  window.DccMock = Object.freeze({
    baseline: '21476e056b26e8cc',
    reviewRevision: '20261011-main-child-application-ui',
    applications: [
      { applicationId: 'DEMO-DCC-APP-A', name: 'DCC 总部应用', createdAt: '2026-10-10T02:00:00.000Z', credentialPlaceholder: 'MOCK-CREDENTIAL-A', authorizedTenantIds: ['TEN-NISSAN-HQ'], sourceTrace: '合成 DCC 接入样例 A' },
      { applicationId: 'DEMO-DCC-APP-B', name: 'DCC 上海应用', createdAt: '2026-10-10T03:00:00.000Z', credentialPlaceholder: 'MOCK-CREDENTIAL-B', authorizedTenantIds: ['TEN-NISSAN-SH'], sourceTrace: '合成 DCC 接入样例 B' }
    ],
    reimportSample: {priority:4,isNewBatch:false,label:'DCC 本次优先级 4'},
    manualImportSample: {
      label: '两条手工导入合成线索',
      importBatchName: '手工导入演示批次',
      rows: [
        { name: '演示客户甲', phone: '18800001901', externalDocumentId: 'DEMO-BIZ-M001', leadCode: 'DEMO-MANUAL-L001', priority: 6, note: '合成手工导入备注', R: '合成来源甲', intentionStoreCode:'00018', intentionStoreName:'合成示例门店', intentionSeriesCode:'00007', intentionSeries:'合成示例车系', smartCode:'AbC-001x', leadCreatedAt:'2026-10-01T09:30:00+08:00' },
        { name: '演示客户乙', phone: '18800001902', externalDocumentId: 'DEMO-BIZ-M002', leadCode: 'DEMO-MANUAL-L002', priority: 4 }
      ]
    },
    tenantMappings: [
      { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', mappingState: 'synthetic-confirmed', source: '现有租户实例的显式合成映射' },
      { enterpriseId: '7522241', tenantId: 'TEN-NISSAN-SH', mappingState: 'synthetic-confirmed', source: '现有租户实例的显式合成映射' }
    ],
    importScenarios: {
      'BATCH-FIRST': {businessType:'lead',label:'首次导入：自动建立主批次',rows:[{leadCode:'DEMO-BATCH-L1',phone:'18800001851',priority:6}],outcomes:{}},
      'BATCH-CHILD': {businessType:'lead',label:'再次导入：关联最近主批次',rows:[{leadCode:'DEMO-BATCH-L1',phone:'18800001851',priority:3,isNewBatch:false}],outcomes:{}},
      'BATCH-MAIN': {businessType:'lead',label:'再次导入：开启独立主批次',rows:[{leadCode:'DEMO-BATCH-L1',phone:'18800001851',priority:8,isNewBatch:true}],outcomes:{}},
      'STEP05-TWO': { businessType:'lead', label: '两条有效线索（含缺 R）', rows: [{ leadCode: 'DEMO-L001', phone: '18800001001', priority: 3, R: '合成渠道-任意值' }, { leadCode: 'DEMO-L002', phone: '18800001002', priority: 5 }], outcomes: {} },
      'STEP05-MIXED': { businessType:'lead', label: '逐行校验与明确拒绝', rows: [{ leadCode: 'DEMO-M001', phone: '18800001101', priority: 3 }, { leadCode: '', phone: '18800001102', priority: 5 }, { leadCode: 'DEMO-M003', phone: '18800001103' }, { leadCode: 'DEMO-M004', phone: '18800001104', priority: 4, R: '自定义来源' }], outcomes: { 'DEMO-M004': 'rejected' } },
      'STEP05-UNKNOWN': { businessType:'lead', label: '提交响应超时待核', rows: [{ leadCode: 'DEMO-U001', phone: '18800001201', priority: 6 }], outcomes: { 'DEMO-U001': 'unknown' } },
      'STEP05-CONFLICT': { businessType:'lead', label: '同步数量矛盾待核', rows: [{ leadCode: 'DEMO-C001', phone: '18800001301', priority: 2 }], outcomes: { 'DEMO-C001': 'conflict' } },
      'STEP08-BASE': { businessType:'lead', label: '同线索主／子批次演示', rows: [{ leadCode: 'DEMO-PRIORITY-L1', phone: '18800001801', priority: 8, R: '合成历史来源' }], outcomes: {} },
      'STEP07-BASE': { businessType:'lead', label: '每次结果演示的准确单号线索', rows: [{ leadCode: 'DEMO-RESULT-L1', phone: '18800001701', priority: 8, R: '合成结果来源' }], outcomes: {} },
      'STEP06-THREE': { businessType:'lead', label: '分片演示：三条待核与一条准确成功', rows: [{ leadCode: 'DEMO-F-A', phone: '18800001601', priority: 8, R: '合成分片来源' }, { leadCode: 'DEMO-F-B', phone: '18800001602', priority: 6 }, { leadCode: 'DEMO-F-C', phone: '18800001603', priority: 4 }, { leadCode: 'DEMO-F-OK', phone: '18800001604', priority: 2 }], outcomes: { 'DEMO-F-A': 'aggregate', 'DEMO-F-B': 'aggregate', 'DEMO-F-C': 'aggregate' } }
    },
    failureShardScenarios: {
      'STEP06-SHARD-2': { label: '2/3：失败 B（首送 DCC 失败）', rowIndex: 1, currentBatchCount: 2, totalBatchCount: 3, totalFailedCount: 3, failedReason: '合成供应商导入拒绝 B', deliveryOutcome: 'failed' },
      'STEP06-SHARD-1': { label: '1/3：失败 A（首送 DCC 失败）', rowIndex: 0, currentBatchCount: 1, totalBatchCount: 3, totalFailedCount: 3, failedReason: '合成供应商导入拒绝 A', deliveryOutcome: 'failed' },
      'STEP06-DUP-2': { label: '重复 2/3：相同 B，不新增', rowIndex: 1, currentBatchCount: 2, totalBatchCount: 3, totalFailedCount: 3, failedReason: '合成供应商导入拒绝 B', deliveryOutcome: 'failed' },
      'STEP06-SHARD-3': { label: '迟到 3/3：失败 C', rowIndex: 2, currentBatchCount: 3, totalBatchCount: 3, totalFailedCount: 3, failedReason: '合成供应商导入拒绝 C', deliveryOutcome: 'failed' },
      'STEP06-CONFLICT-2': { label: '同片号不同原因：保留冲突待核', rowIndex: 1, currentBatchCount: 2, totalBatchCount: 3, totalFailedCount: 3, failedReason: '合成矛盾的 B 拒绝原因', deliveryOutcome: 'failed' },
      'STEP06-DECLARATION-CONFLICT': { label: '总片数声明冲突：待核', rowIndex: 0, currentBatchCount: 1, totalBatchCount: 2, totalFailedCount: 2, failedReason: '合成供应商导入拒绝 A', deliveryOutcome: 'failed' }
    },
    resultScenarios: {
      'STEP07-SHORT-0': { label: '客户接听并主动挂断 · 0 秒', callSuffix: 'SHORT-0', result: { kind: 'call', evidenceTrusted: true, source: '合成客户真实话单', customerAnswered: true, agentAnswered: true, hangupParty: 'customer', onHookSource: '客户挂断（合成原字段）', customerBridgeDuration: 0, durationIsTrusted: true, agentBridgeDuration: 6, finishRetryFlag: 0 }, deliveryOutcome: 'failed' },
      'STEP07-SHORT-1': { label: '客户接听并主动挂断 · 1 秒', callSuffix: 'SHORT-1', result: { kind: 'call', evidenceTrusted: true, source: '合成客户真实话单', customerAnswered: true, agentAnswered: true, hangupParty: 'customer', onHookSource: '客户挂断（合成原字段）', customerBridgeDuration: 1, durationIsTrusted: true, agentBridgeDuration: 6, finishRetryFlag: 0 }, deliveryOutcome: 'failed' },
      'STEP07-SHORT-2': { label: '客户接听并主动挂断 · 2 秒 / 最后一条', callSuffix: 'SHORT-2', result: { kind: 'call', evidenceTrusted: true, source: '合成客户真实话单', customerAnswered: true, agentAnswered: true, hangupParty: 'customer', onHookSource: '客户挂断（合成原字段）', customerBridgeDuration: 2, durationIsTrusted: true, agentBridgeDuration: 6, finishRetryFlag: 1 }, deliveryOutcome: 'failed' },
      'STEP07-NORMAL': { label: '客户 6 秒、坐席桥接 1 秒 · 不是秒挂', callSuffix: 'NORMAL', result: { kind: 'call', evidenceTrusted: true, source: '合成客户真实话单', customerAnswered: true, agentAnswered: true, hangupParty: 'customer', onHookSource: '客户挂断（合成原字段）', customerBridgeDuration: 6, durationIsTrusted: true, agentBridgeDuration: 1, finishRetryFlag: null }, deliveryOutcome: 'failed' },
      'STEP07-MISSING-DURATION': { label: '客户时长缺失 · 待核，不补 0', callSuffix: 'MISSING-DURATION', result: { kind: 'call', evidenceTrusted: true, source: '合成缺客户时长话单', customerAnswered: true, hangupParty: 'customer', onHookSource: '客户挂断（合成原字段）', customerBridgeDuration: null, durationIsTrusted: true, agentBridgeDuration: 1 }, deliveryOutcome: 'failed' },
      'STEP07-UNKNOWN-ANSWER': { label: '客户接听未知 · 1 秒也保持待核', callSuffix: 'UNKNOWN-ANSWER', result: { kind: 'call', evidenceTrusted: true, source: '合成客户接听缺口话单', customerAnswered: null, hangupParty: 'customer', onHookSource: '客户挂断（合成原字段）', customerBridgeDuration: 1, durationIsTrusted: true, finishRetryFlag: null }, deliveryOutcome: 'failed' },
      'STEP07-UNTRUSTED-DURATION': { label: '客户时长语义未核 · 不判断秒挂', callSuffix: 'UNTRUSTED-DURATION', result: { kind: 'call', evidenceTrusted: true, source: '合成未核客户时长话单', customerAnswered: true, hangupParty: 'customer', customerBridgeDuration: 1, durationIsTrusted: false, agentBridgeDuration: 1, finishRetryFlag: 0 }, deliveryOutcome: 'failed' },
      'STEP07-ABNORMAL-DURATION': { label: '客户时长异常 -1 · 保持待核', callSuffix: 'ABNORMAL-DURATION', result: { kind: 'call', evidenceTrusted: true, source: '合成异常客户时长话单', customerAnswered: true, hangupParty: 'customer', customerBridgeDuration: -1, durationIsTrusted: true, finishRetryFlag: 0 }, deliveryOutcome: 'failed' },
      'STEP07-NOT-ANSWERED': { label: '客户未接听 · 0 秒也不是秒挂', callSuffix: 'NOT-ANSWERED', result: { kind: 'call', evidenceTrusted: true, source: '合成明确未接听结果', customerAnswered: false, hangupParty: 'customer', onHookSource: '客户挂断（合成原字段）', customerBridgeDuration: 0, durationIsTrusted: true, finishRetryFlag: '1' }, deliveryOutcome: 'failed' },
      'STEP07-AGENT-HANGUP': { label: '坐席挂断 · 1 秒不是秒挂', callSuffix: 'AGENT-HANGUP', result: { kind: 'call', evidenceTrusted: true, source: '合成坐席挂断话单', customerAnswered: true, agentAnswered: true, hangupParty: 'agent', onHookSource: '合成坐席挂断证据（真实映射待核）', customerBridgeDuration: 1, durationIsTrusted: true, finishRetryFlag: false }, deliveryOutcome: 'failed' },
      'STEP07-NOCDR-BAN': { label: '稳定无话单事件 · 禁呼未解禁', eventSuffix: 'BAN', result: { kind: 'no_cdr_failure', evidenceTrusted: true, source: '合成 52 稳定无话单事件', failureReason: '合成原始原因：禁呼未解禁', customerAnswered: false }, deliveryOutcome: 'failed' },
      'STEP07-NOCDR-LIMIT': { label: '稳定无话单事件 · 限呼未到期', eventSuffix: 'LIMIT', result: { kind: 'no_cdr_failure', evidenceTrusted: true, source: '合成 52 稳定无话单事件', failureReason: '合成原始原因：限呼未到期', customerAnswered: false }, deliveryOutcome: 'failed' },
      'STEP07-NOCDR-TRUNK': { label: '稳定无话单事件 · 无可用中继', eventSuffix: 'TRUNK', result: { kind: 'no_cdr_failure', evidenceTrusted: true, source: '合成 52 稳定无话单事件', failureReason: '合成原始原因：无可用中继', customerAnswered: false }, deliveryOutcome: 'failed' },
      'STEP07-REPLAY': { label: '重复 2 秒原结果 · 不新增呼叫', callSuffix: 'SHORT-2', result: { kind: 'call', evidenceTrusted: true, source: '合成客户真实话单', customerAnswered: true, agentAnswered: true, hangupParty: 'customer', onHookSource: '客户挂断（合成原字段）', customerBridgeDuration: 2, durationIsTrusted: true, agentBridgeDuration: 6, finishRetryFlag: 1 }, deliveryOutcome: 'failed' },
      'STEP07-SIP-LATE': { label: '同 2 秒呼叫 · SIP 晚更新 / 独立交付', callSuffix: 'SHORT-2', result: { kind: 'sip_update', evidenceTrusted: true, source: '合成话单主叫侧 SIP 异步更新', sipCauseAsyncUpdateFlag: 1, obSipCode: 503, obSipCause: '合成主叫侧线路风控', sipCause: 503 }, deliveryOutcome: 'failed' },
      'STEP07-CONFLICT': { label: '同 2 秒呼叫 · 非 SIP 结果矛盾待核', callSuffix: 'SHORT-2', result: { kind: 'call', evidenceTrusted: true, source: '合成矛盾话单', customerAnswered: false, hangupParty: 'customer', onHookSource: '客户挂断（合成原字段）', customerBridgeDuration: 0, durationIsTrusted: true, finishRetryFlag: 1 }, deliveryOutcome: 'failed' },
      'STEP07-EMPTY-CDR': { label: '空话单查询 · 不生成失败/未拨结论', kind: 'empty_query' }
    },
    deletionScenarios: {
      'STEP09-SUCCESS': { label: '准确供应商删除成功 · 本地保留', response: { outcome: 'succeeded', evidenceTrusted: true, reason: '合成精确批次号码删除确认', source: '合成 API-006 精准删除确认', raw: { simulatedConfirmation: 'succeeded' } }, deliveryOutcome: 'failed' },
      'STEP09-REJECTED': { label: '供应商明确拒绝 · 未删除', response: { outcome: 'rejected', evidenceTrusted: true, reason: '合成供应商拒绝此精确删除请求', source: '合成 API-006 精准删除拒绝', raw: { simulatedConfirmation: 'rejected' } }, deliveryOutcome: 'failed' },
      'STEP09-UNKNOWN': { label: '响应未知 · 保持待核', response: { outcome: 'unknown', evidenceTrusted: true, reason: '合成供应商删除响应超时', source: '合成 API-006 删除响应未知', raw: null }, deliveryOutcome: 'failed' },
      'STEP09-UNTRUSTED': { label: '成功语义未可信确认 · 保持待核', response: { outcome: 'succeeded', evidenceTrusted: false, reason: '合成原字段声明成功但语义未核', source: '合成 API-006 未核结果', raw: { simulatedUnverifiedValue: 0 } }, deliveryOutcome: 'failed' }
    },
    interfaces: [
      { id: 'API-001', title: '应用凭证、指定租户身份与 DCC 接收', status: 'missing', detail: '真实应用鉴权、租户身份和逐行接收契约待定；本页仅合成身份。' },
      { id: 'API-002', title: '供应商单号码批次导入', status: 'partial', detail: '导入数量不等于实际呼叫成功，真实提交与同步响应仍需核验。' },
      { id: 'API-003', title: '预测失败及导入失败事件', status: 'partial', detail: '推送设置是后台边界，不是完整业务回调契约；分片和稳定事件需核验。' },
      { id: 'API-004', title: '话单查询及秒挂候选数据', status: 'partial', detail: '秒挂依赖客户真实接通、客户挂断及真实有效时长；空查询不伪造失败。' },
      { id: 'API-005', title: '每日状态查询与优先级衰减', status: 'not_required', detail: '平台每日衰减已取消。' },
      { id: 'API-006', title: '任务批次号码精准删除', status: 'partial', detail: '精准关联及删除确认需核验，未确认成功不得标记已删除。' },
      { id: 'API-007', title: '平台换主叫', status: 'not_required', detail: '已退出本期平台范围；实际主叫选择由供应商调度，不承诺绝对换主叫。' },
      { id: 'API-008', title: '平台解除或恢复', status: 'not_required', detail: '已退出本期平台范围，恢复条件由 DCC 决策。' },
      { id: 'API-009', title: '本地记录与下载生命周期', status: 'not_required', detail: '本地合成能力，不代表真实下载成功信号已经联调。' },
      { id: 'API-010', title: '向 DCC 每次结果回传', status: 'missing', detail: '真实契约缺失；固定接收地址仅在后台配置边界，前台不配置地址。' }
    ]
  });
}());
