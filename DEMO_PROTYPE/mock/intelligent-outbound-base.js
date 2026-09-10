/**
 * mock/data.js - 统一中台全站 Mock 数据
 * 以中科金接入 demo 为底座，合并一知、电声、冰兰、厚朴、大众通信、充值方案、意向标签、线索报表数据。
 */

/* ===== 平台枚举 ===== */
var MockPlatforms = [
  { code: 'YZ', name: '一知科技' },
  { code: 'ZKJ', name: '中科金智能' },
  { code: 'DS', name: '电声' },
  { code: 'BL', name: '冰兰' },
  { code: 'HP', name: '厚朴' },
  { code: 'DZ', name: '大众通信' }
];

/* ===== 外呼列表 Mock 数据（六平台，raw 状态字段与中台 13 状态映射一致） ===== */
var MockSceneList = [
  { id: 13, name: '华北店-新线索-中科金', status: 'running', taskStatus: 2, source: '手动导入', platform: '中科金智能', assigned: 80, pending: 30, called: 50 },
  { id: 14, name: '华东店-保客回访-中科金', status: 'running', taskStatus: 2, source: '接口传入', platform: '中科金智能', assigned: 300, pending: 60, called: 240 },
  { id: 15, name: '华南店-试驾邀约-中科金', status: 'not_started', taskStatus: 1, source: '手动导入', platform: '中科金智能', assigned: 0, pending: 0, called: 0 },
  { id: 16, name: '西南店-流失预警-中科金', status: 'terminated', taskStatus: 4, source: '接口传入', platform: '中科金智能', assigned: 0, pending: 0, called: 980 },
  { id: 1, name: '渝兴店售后-临保邀约', status: 'running', taskStatus: 'IN_PROCESS', source: '手动导入', platform: '一知科技', assigned: 200, pending: 80, called: 120 },
  { id: 2, name: '渝兴店售后-流失招揽', status: 'running', taskStatus: 'IN_PROCESS', source: '自动传入', platform: '一知科技', assigned: 500, pending: 180, called: 320 },
  { id: 3, name: '渝发店售前-冷线索激活', status: 'completed', taskStatus: 'COMPLETED', source: '手动导入', platform: '一知科技', assigned: 1500, pending: 0, called: 1500 },
  { id: 4, name: '渝兴店售前-冷线索激活', status: 'paused', taskStatus: 'USER_PAUSE', source: '自动传入', platform: '一知科技', assigned: 300, pending: 150, called: 150 },
  { id: 5, name: 'NEV-留资未满-N6推荐', status: 'not_started', taskStatus: 'NOT_STARTED', source: '自动传入', platform: '一知科技', assigned: 100, pending: 100, called: 0 },
  { id: 6, name: 'NEV-留资未满-NX8推荐', status: 'terminated', taskStatus: 'TERMINATE', source: '手动导入', platform: '一知科技', assigned: 180, pending: 0, called: 180 },
  { id: 7, name: 'NEV-留资未满-天籁推荐', status: 'not_started', taskStatus: 'NOT_STARTED', source: '接口传入', platform: '一知科技', assigned: 10, pending: 2, called: 8 },
  { id: 8, name: 'NEV-留资未满-N7推荐', status: 'terminated', taskStatus: 'TERMINATE', source: '接口传入', platform: '一知科技', assigned: 1200, pending: 119, called: 1081 },
  { id: 9, name: '华北店-新线索跟进', status: 'running', taskStatus: 'IN_PROCESS', source: '手动导入', platform: '一知科技', assigned: 120, pending: 45, called: 75 },
  { id: 10, name: '华东店-保客回访', status: 'running', taskStatus: 'IN_PROCESS', source: '接口传入', platform: '一知科技', assigned: 500, pending: 80, called: 420 },
  { id: 11, name: '华南店-试驾邀约', status: 'paused', taskStatus: 'USER_PAUSE', source: '手动导入', platform: '一知科技', assigned: 200, pending: 0, called: 200 },
  { id: 12, name: '西南店-流失预警', status: 'terminated', taskStatus: 'TERMINATE', source: '接口传入', platform: '一知科技', assigned: 1560, pending: 0, called: 1560 },
  { id: 17, uuid: '9f6d9a40-2fb3-4c56-8b21-202607140017', name: '华东店-冷线索跟进-大众通信', status: 'running', remoteStatus: 2, source: '接口传入', platform: '大众通信', line: 'DT-SH-001', maximumcall: 20, billingType: '按通话时长', assigned: 150, pending: 30, called: 120 },
  { id: 18, uuid: '04d5eb55-6bce-43a5-962a-202607140018', name: '南京售后回访-大众通信', status: 'paused', remoteStatus: 1, source: '接口传入', platform: '大众通信', line: 'DT-NJ-001', maximumcall: 10, billingType: '按通话时长', assigned: 80, pending: 20, called: 60 },
  { id: 19, uuid: '7b6e87a1-5101-4380-8822-202607140019', name: '深圳新线索-大众通信', status: 'not_started', remoteStatus: 3, source: '接口传入', platform: '大众通信', line: 'DT-SZ-001', maximumcall: 20, billingType: '按通话时长', assigned: 0, pending: 0, called: 0 },
  { id: 20, strategyCode: 'NISSAN_NEW_LEAD_001', name: '东风日产-新线索-电声', status: 'running', statusType: 1, source: '接口传入', platform: '电声', assigned: 120, pending: 40, called: 80, robotName: '东风日产新线索机器人', batchCount: 3 },
  { id: 21, strategyCode: 'NISSAN_COLD_LEAD_002', name: '东风日产-冷线索-电声', status: 'paused', statusType: 0, source: '接口传入', platform: '电声', assigned: 200, pending: 90, called: 110, robotName: '东风日产冷线索机器人', batchCount: 2 },
  { id: 22, name: '燃油车新线索-冰兰', status: 'running', taskStatus: 1, source: '手动导入', platform: '冰兰', assigned: 80, pending: 20, called: 60, taskType: '新线索' },
  { id: 23, name: '燃油车保客回访-冰兰', status: 'terminated', taskStatus: 3, source: '接口传入', platform: '冰兰', assigned: 0, pending: 0, called: 320, taskType: '回访' },
  { id: 24, task_id: 'HP-TASK-20260714-001', taskName: 'HP-DEMO-新线索首访', name: '厚朴-新线索首访', status: 'running', taskStatus: 1, source: '手动导入', platform: '厚朴', assigned: 1000, pending: 600, called: 400, connected: 165, batchId: 'HP-BATCH-20260714-0001', validNumberCount: 998, createdAt: '2026-07-14 09:20:00' },
  { id: 25, task_id: 'HP-TASK-20260713-001', taskName: 'HP-DEMO-保客回访', name: '厚朴-保客回访', status: 'running', taskStatus: 4, source: '手动导入', platform: '厚朴', assigned: 800, pending: 300, called: 500, connected: 210, batchId: 'HP-BATCH-20260713-0003', validNumberCount: 796, createdAt: '2026-07-13 14:05:00' },
  { id: 26, task_id: 'HP-TASK-20260715-001', taskName: 'HP-DEMO-流失预警', name: '厚朴-流失预警', status: 'paused', taskStatus: 6, source: '接口传入', platform: '厚朴', assigned: 2000, pending: 1200, called: 800, connected: 330, batchId: 'HP-BATCH-20260715-0002', validNumberCount: 1995, createdAt: '2026-07-15 10:00:00' }
];

/* ===== 中科金 外呼任务详情 Mock ===== */
var MockZkjTaskDetail = {
  13: {
    taskCode: 'e9a0edb5e839eada14624f83df4c4dd0', taskName: '华北店-新线索-中科金', createdAt: '2026-06-03 09:15:00', taskStatus: 2, taskType: 1,
    outboundDate: '2026-06-03 09:00', outboundExpireDate: '2026-06-30', outboundStrategy: 2, outboundLevel: 3,
    robotId: '2f50535d41a44ec0afe9727a7a43a770', robotName: '东风日产新线索话术', outboundNo: '1070678044124068',
    outboundTotal: 80, outboundProgress: 50, outboundCircleType: 1, outboundCircleValue: '1,2,3,4,5,6,7',
    outboundTimeInterval: '["09:00-11:30","13:30-17:30"]', aiSeatsNum: 4, aiSeatsFlag: 1, answerTimeout: 45,
    recallModel: 1, recallStatus: '5,9,12,14,15', maxRecallTimes: 1, recallPeriodMin: 30,
    recallStrategy: '[{"status":5,"time":1,"period":30},{"status":9,"time":1,"period":60}]',
    dialogTaskId: 'flow_hb_xcl_001', dialogTaskName: '新线索标准流程', didStrategy: 1
  },
  14: {
    taskCode: 'fbe766f9679360af55cf89871370d3c4', taskName: '华东店-保客回访-中科金', createdAt: '2026-06-01 10:00:00', taskStatus: 2, taskType: 2,
    outboundDate: '2026-06-01 10:00', outboundExpireDate: '2026-07-31', outboundStrategy: 2, outboundLevel: 2,
    robotId: '3a60646e52b55db1bgf0838b84b881', robotName: '保客回访话术', outboundNo: '1070678044124069',
    outboundTotal: 300, outboundProgress: 240, outboundCircleType: 1, outboundCircleValue: '1,2,3,4,5,6,7',
    outboundTimeInterval: '["09:00-12:00","14:00-18:00"]', aiSeatsNum: 6, aiSeatsFlag: 0, answerTimeout: 40,
    recallModel: 2, recallStatus: '5,9,12,14,15,6', maxRecallTimes: 2, recallPeriodMin: 20,
    recallStrategy: '', dialogTaskId: 'flow_hd_hf_001', dialogTaskName: '保客回访标准流程', didStrategy: 0
  },
  15: {
    taskCode: 'c8d1fec694a047ebbf2593788249c5e5', taskName: '华南店-试驾邀约-中科金', createdAt: '2026-06-05 14:30:00', taskStatus: 1, taskType: 1,
    outboundDate: '', outboundExpireDate: '', outboundStrategy: 2, outboundLevel: 3,
    robotId: '4b71757f63c66ec2chg1949c95c992', robotName: '试驾邀约话术', outboundNo: '1070678044124070',
    outboundTotal: 0, outboundProgress: 0, outboundCircleType: 1, outboundCircleValue: '1,2,3,4,5,6,7',
    outboundTimeInterval: '["10:00-12:00","14:00-19:00"]', aiSeatsNum: 3, aiSeatsFlag: 0, answerTimeout: 45,
    recallModel: 0, recallStatus: '', maxRecallTimes: 0, recallPeriodMin: 0, recallStrategy: '',
    dialogTaskId: 'flow_hn_sj_001', dialogTaskName: '试驾邀约标准流程', didStrategy: 0
  },
  16: {
    taskCode: 'a492e8f048d00bcc723d62719e245546', taskName: '西南店-流失预警-中科金', createdAt: '2026-05-01 08:00:00', taskStatus: 4, taskType: 2,
    outboundDate: '2026-05-01 08:00', outboundExpireDate: '2026-06-30', outboundStrategy: 2, outboundLevel: 1,
    robotId: '5c82868g74d77fd3dih2050a06d0a3', robotName: '流失预警话术', outboundNo: '1070678044124071',
    outboundTotal: 980, outboundProgress: 980, outboundCircleType: 1, outboundCircleValue: '1,2,3,4,5,6,7',
    outboundTimeInterval: '["09:00-12:00","13:30-18:00","18:30-20:00"]', aiSeatsNum: 8, aiSeatsFlag: 1, answerTimeout: 50,
    recallModel: 1, recallStatus: '5,9,12,14,15,6,11', maxRecallTimes: 3, recallPeriodMin: 15,
    recallStrategy: '[{"status":5,"time":3,"period":15},{"status":9,"time":2,"period":30}]',
    dialogTaskId: 'flow_xn_ls_001', dialogTaskName: '流失预警标准流程', didStrategy: 1
  }
};

/* ===== 厚朴 已关联任务详情 Mock（按平台已有 task_id 关联；中台不创建任务） ===== */
var MockHoupuTaskDetail = {
  24: {
    task_id: 'HP-TASK-20260714-001', taskName: '厚朴-新线索首访',
    botId: 'bot_hp_nissan_001', botName: '东风日产新线索首访机器人',
    callPeriod: '每天 09:00-11:30、13:30-17:30', concurrency: 50,
    recall: '未接通间隔 30 分钟重呼，最多 2 次；已接通不重呼', unCalledPriority: true,
    batchId: 'HP-BATCH-20260714-0001', validNumberCount: 998,
    createdAt: '2026-07-14 09:20:00', progress: '400 / 1000'
  },
  25: {
    task_id: 'HP-TASK-20260713-001', taskName: '厚朴-保客回访',
    botId: 'bot_hp_nissan_002', botName: '东风日产保客回访机器人',
    callPeriod: '每天 09:30-12:00、14:00-18:00', concurrency: 30,
    recall: '未接通间隔 60 分钟重呼，最多 1 次', unCalledPriority: false,
    batchId: 'HP-BATCH-20260713-0003', validNumberCount: 796,
    createdAt: '2026-07-13 14:05:00', progress: '500 / 800'
  },
  26: {
    task_id: 'HP-TASK-20260715-001', taskName: '厚朴-流失预警',
    botId: 'bot_hp_nissan_003', botName: '东风日产流失预警机器人',
    callPeriod: '每天 09:00-12:00、14:00-19:00', concurrency: 60,
    recall: '不重呼', unCalledPriority: true,
    batchId: 'HP-BATCH-20260715-0002', validNumberCount: 1995,
    createdAt: '2026-07-15 10:00:00', progress: '800 / 2000'
  }
};

/* ===== 厚朴任务查询结果中的机器人 / 号码模板快照（只读，模板含动态字段明细） ===== */
var MockHoupuBots = [
  { botId: 'bot_hp_nissan_001', name: '东风日产新线索首访机器人', modelType: '大模型' },
  { botId: 'bot_hp_nissan_002', name: '东风日产保客回访机器人', modelType: '大模型' },
  { botId: 'bot_hp_nissan_003', name: '东风日产流失预警机器人', modelType: '大模型' }
];

var MockHoupuTemplates = [
  { templateId: 'TPL-HP-XXS-001', name: '新线索首访话术模板', fields: [
    { field: 'calleeNo', label: '被叫号码', required: true },
    { field: 'name', label: '客户名称', required: false },
    { field: 'company', label: '公司名称', required: false },
    { field: 'address', label: '地址', required: false },
    { field: 'remark', label: '备注', required: false },
    { field: 'ext1', label: '扩展字段1', required: false },
    { field: 'ext2', label: '扩展字段2', required: false }
  ]},
  { templateId: 'TPL-HP-BKHF-002', name: '保客回访话术模板', fields: [
    { field: 'calleeNo', label: '被叫号码', required: true },
    { field: 'name', label: '客户名称', required: false },
    { field: 'remark', label: '备注', required: false },
    { field: 'ext1', label: '扩展字段1', required: false }
  ]},
  { templateId: 'TPL-HP-LSYJ-003', name: '流失预警话术模板', fields: [
    { field: 'calleeNo', label: '被叫号码', required: true },
    { field: 'name', label: '客户名称', required: false },
    { field: 'company', label: '公司名称', required: false },
    { field: 'ext1', label: '扩展字段1', required: false }
  ]}
];

/* ===== 大众通信任务详情 Mock（2.0 编辑接口字段） ===== */
var MockDazhongTaskEditDetail = {
  17: {
    redialMode: 'scheduled', scheduledRedialTimes: 2,
    scheduledConfigConfirmed: true, redialConfirmedBy: '管理员', redialConfirmedAt: '2026-09-02 15:30:00', currentCallRound: 3,
    task_type: 7, maximumcall: 20, recycle_limit: 0, name: '华东店-冷线索跟进-大众通信', remark: '华东区域冷线索自动跟进',
    destination_extension: '215870475195883520', destination_extension_name: '东风日产冷线索跟进话术', random_assignment_number: 0,
    _originate_timeout: 60, bridge_group_id: null, auto_recycle_rule_id: null, dial_time_id: 96, end_action: null,
    llm_intention_id: '019e92ae-6771-706c-b360-94ae69593651', background_id: 52, caller_line_name: '上海营销线路',
    status: 2, call_status: true, status_str: '执行中', elasticity_task: false,
    new_task_extra: {
      id: '9f6d9a40-2fb3-4c56-8b21-202607140017', name: '华东店-冷线索跟进-大众通信', enable: true,
      line: [{ id: 'DT-SH-001', limit: 20 }], limit: 20, cps: 1,
      start_time: '2026-07-01 09:00:00', stop_time: '2026-12-31 21:00:00', holiday: [], work_week: [1, 2, 3, 4, 5, 6, 0],
      work_hour: [{ wday: 1, begin: '09:00', end: '12:00' }, { wday: 1, begin: '13:00', end: '21:00' }],
      destination_extension: '215870475195883520',
      redial_enabled: true, redial_new_number_policy: true, redial_interval: 30, redial_max_times: 2,
      redial_conditions: { hangup_cause: null, da_status: [2, 3, 4, 6, 8, 9, 12] }, pop_mode: 1, plan_stop_code: 0, account_id: 'DZ-SH-MAIN'
    }
  },
  18: {
    redialMode: 'scheduled', scheduledRedialTimes: 2,
    scheduledConfigConfirmed: true, redialConfirmedBy: '运营专员', redialConfirmedAt: '2026-09-02 16:05:00', currentCallRound: 2,
    task_type: 7, maximumcall: 10, recycle_limit: 1, name: '南京售后回访-大众通信', remark: '南京区域售后满意度回访',
    destination_extension: '215870475195883521', destination_extension_name: '售后满意度回访话术', random_assignment_number: 1,
    _originate_timeout: 45, bridge_group_id: 'BRIDGE-NJ-01', auto_recycle_rule_id: 28, dial_time_id: 88, end_action: '完成后停止',
    llm_intention_id: null, background_id: 39, caller_line_name: '南京售后线路', status: 1, call_status: false, status_str: '暂停中', elasticity_task: true,
    new_task_extra: {
      id: '04d5eb55-6bce-43a5-962a-202607140018', name: '南京售后回访-大众通信', enable: false,
      line: ['DT-NJ-001'], limit: 10, cps: 1, start_time: '2026-07-10 09:30:00', stop_time: '2026-09-30 18:30:00',
      holiday: [{ begin: '2026-08-01', end: '2026-08-03' }], work_week: [1, 2, 3, 4, 5], work_hour: [{ wday: 1, begin: '09:30', end: '18:30' }],
      destination_extension: '215870475195883521', destination_extension_list: [{ begin: '09:30', end: '18:30', destination_extension: '215870475195883521' }],
      redial_enabled: true, redial_new_number_policy: true, redial_interval: 20, redial_max_times: 2,
      redial_conditions: { hangup_cause: null, da_status: [3, 4, 8, 12] }, pop_mode: 2, plan_stop_code: 0, account_id: 'DZ-NJ-AFTERSALE'
    }
  },
  19: {
    redialMode: 'task', taskRedialRiskAccepted: true, currentCallRound: 1,
    task_type: 7, maximumcall: 20, recycle_limit: 0, name: '深圳新线索-大众通信', remark: '深圳新线索首次触达',
    destination_extension: '215870475195883522', destination_extension_name: '深圳新线索邀约话术', random_assignment_number: 0,
    _originate_timeout: 60, bridge_group_id: null, auto_recycle_rule_id: null, dial_time_id: 102, end_action: null,
    llm_intention_id: '019e92ae-6771-706c-b360-94ae69593653', background_id: 52, caller_line_name: '深圳营销线路',
    status: 3, call_status: false, status_str: '等待执行', elasticity_task: false,
    new_task_extra: {
      id: '7b6e87a1-5101-4380-8822-202607140019', name: '深圳新线索-大众通信', enable: true,
      line: [{ id: 'DT-SZ-001', limit: 20 }], limit: 20, cps: 2, start_time: '2026-07-23 09:00:00', stop_time: '2026-10-31 20:00:00',
      holiday: [], work_week: [1, 2, 3, 4, 5, 6], work_hour: [{ wday: 1, begin: '09:00', end: '20:00' }],
      destination_extension: '215870475195883522', destination_extension_list: [{ begin: '09:00', end: '20:00', destination_extension: '215870475195883522' }],
      redial_enabled: false, redial_new_number_policy: false, redial_interval: 3, redial_max_times: 3,
      redial_conditions: [{ hangup_cause: null, da_status: ['failed', 'not convenient', 'redial later', 'is not reachable'] }],
      pop_mode: 0, plan_stop_code: 0, account_id: 'DZ-SZ-MAIN'
    }
  }
};

var DazhongTaskUuidByScene = {
  '华东店-冷线索跟进-大众通信': '9f6d9a40-2fb3-4c56-8b21-202607140017',
  '南京售后回访-大众通信': '04d5eb55-6bce-43a5-962a-202607140018',
  '深圳新线索-大众通信': '7b6e87a1-5101-4380-8822-202607140019'
};

var DazhongSceneCodeByScene = {
  '华东店-冷线索跟进-大众通信': 'AI-DZ-HD-COLD',
  '南京售后回访-大众通信': 'AI-DZ-NJ-SERVICE',
  '深圳新线索-大众通信': 'AI-DZ-SZ-NEW'
};

/* ===== 通话记录 Mock 数据 ===== */
var MockCallRecordRows = [
  { phone: '13144182367', startTime: '2026-08-20 13:42:26', endTime: '2026-08-20 13:42:36', duration: '-', sceneName: 'NEV-大模型-一知新线索-号码认证', status: '占线', summary: '', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029101', aiTagName: '-' },
  { phone: '17770372314', startTime: '2026-08-20 13:42:23', endTime: '2026-08-20 13:42:24', duration: '-', sceneName: 'NEV-大模型-一知新线索-号码认证', status: '无法接通', summary: '', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029102', aiTagName: '-' },
  { phone: '18307452158', startTime: '2026-08-20 13:41:33', endTime: '2026-08-20 13:42:04', duration: '-', sceneName: 'NEV-大模型-一知新线索-号码认证', status: '占线', summary: '', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029103', aiTagName: '-' },
  { phone: '18364940915', startTime: '2026-08-20 13:41:25', endTime: '2026-08-20 13:41:50', duration: '12秒', sceneName: 'NEV-大模型-一知新线索-号码认证', status: '已接通', summary: '客户接通电话后未回应其他内容，仅听到客服两次询问...', platform: '一知科技', lastNode: '意向确认', sessionId: '2059190973162029104', aiTagName: 'A-高意向' },
  { phone: '18982031848', startTime: '2026-08-20 13:41:22', endTime: '2026-08-20 13:41:51', duration: '-', sceneName: 'NEV-大模型-一知新线索-号码认证', status: '无人接听', summary: '', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029105', aiTagName: '-' },
  { phone: '15637077221', startTime: '2026-08-20 13:41:20', endTime: '2026-08-20 13:41:21', duration: '-', sceneName: 'NEV-大模型-一知新线索-号码认证', status: '无法接通', summary: '', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029106', aiTagName: '-' },
  { phone: '15305168633', startTime: '2026-06-03 16:10:58', endTime: '2026-06-03 16:11:28', duration: '30秒', sceneName: '华北店-新线索-中科金', status: '已接通', summary: '客户对中科金平台外呼活动感兴趣，预计1周内到店试驾，有购车意愿。', platform: '中科金智能', lastNode: '意向确认', sessionId: '2059190973162029057', callerNumber: '0755-88886666', aiTagName: '高意向', callerLocation: '广东深圳', calleeLocation: '中国-广东-广州' },
  { phone: '15926488867', startTime: '2026-06-03 15:30:49', endTime: '2026-06-03 15:31:19', duration: '30秒', sceneName: '华东店-保客回访-中科金', status: '已接通', summary: '客户满意保客回访服务，暂无换购需求，表示后续有需要会主动联系。', platform: '中科金智能', lastNode: '满意度调研', sessionId: '2059190973162029058', callerNumber: '021-66667777', aiTagName: '低意向', callerLocation: '上海', calleeLocation: '中国-上海-浦东' },
  { phone: '18153323979', startTime: '2026-06-03 14:10:33', endTime: '2026-06-03 14:11:04', duration: '-', sceneName: '华南店-试驾邀约-中科金', status: '占线', summary: '', platform: '中科金智能', lastNode: '-', sessionId: '2059190973162029059', callerNumber: '020-55554444', aiTagName: '-', callerLocation: '广东广州', calleeLocation: '中国-广东-深圳' },
  { phone: '18525601142', startTime: '2026-06-03 11:20:19', endTime: '2026-06-03 11:20:50', duration: '-', sceneName: '西南店-流失预警-中科金', status: '拒接', summary: '', platform: '中科金智能', lastNode: '-', sessionId: '2059190973162029060', callerNumber: '028-33332222', aiTagName: '-', callerLocation: '四川成都', calleeLocation: '中国-四川-成都' },
  { phone: '16674357576', startTime: '2026-06-02 16:10:16', endTime: '2026-06-02 16:10:54', duration: '27秒', sceneName: '燃油车新线索-一知', status: '已接通', summary: '客户预计1周内到店购车，有购车意愿。', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029055', callerNumber: '010-99998888', aiTagName: '高意向', callerLocation: '北京', calleeLocation: '中国-北京-朝阳' },
  { phone: '15158207682', startTime: '2026-06-02 15:10:15', endTime: '2026-06-02 15:11:05', duration: '50秒', sceneName: '燃油车新线索-一知', status: '已接通', summary: '客户未明确购车意愿、时间及城市。希望通过销售顾问加微信获取详细优惠信息。', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029056', callerNumber: '010-99998888', aiTagName: '低意向', callerLocation: '北京', calleeLocation: '中国-北京-海淀' },
  { phone: '19562456113', startTime: '2026-06-02 14:10:05', endTime: '2026-06-02 14:10:35', duration: '-', sceneName: 'DCC-一知-N7冷线索', status: '无人接听', summary: '', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029057', callerNumber: '020-55554444', aiTagName: '-', callerLocation: '广东广州', calleeLocation: '中国-广东-佛山' },
  { phone: '13375248621', startTime: '2026-06-02 10:09:58', endTime: '2026-06-02 10:10:41', duration: '32秒', sceneName: 'NEV-留资未满-N6推荐', status: '已接通', summary: '客户表示近期考虑看车，需要销售顾问进一步确认车型和到店时间。', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029058', callerNumber: '023-77776666', aiTagName: '中意向', callerLocation: '重庆', calleeLocation: '中国-重庆-渝北' },
  { phone: '18673642091', startTime: '2026-06-01 16:09:44', endTime: '2026-06-01 16:10:14', duration: '-', sceneName: '渝发店售前-冷线索激活', status: '关机', summary: '', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029059', callerNumber: '023-77776666', aiTagName: '-', callerLocation: '重庆', calleeLocation: '中国-重庆-渝北' },
  { phone: '17784269023', startTime: '2026-06-01 10:09:31', endTime: '2026-06-01 10:10:08', duration: '24秒', sceneName: '华北店-新线索跟进', status: '已接通', summary: '客户希望了解金融方案，已同意后续门店销售联系。', platform: '一知科技', lastNode: '-', sessionId: '2059190973162029060', callerNumber: '010-99998888', aiTagName: '高意向', callerLocation: '北京', calleeLocation: '中国-北京-朝阳' },
  { phone: '13712345678', startTime: '2026-07-14 09:00:00', endTime: '2026-07-14 09:00:35', duration: '35秒', sceneName: '华东店-冷线索跟进-大众通信', status: 1, summary: '客户对产品服务表达强烈兴趣，期待销售联系。', platform: '大众通信', lastNode: '需求确认', sessionId: '2059190973162029091', callid: '2059190973162029091', callbackReceivedAt: '2026-07-14 09:00:38', recordingUrl: 'https://record.dazhong.example/callback/2059190973162029091.mp3', callerNumber: '021-88887777', aiTagName: 'A-高意向', bailianSummary: '百炼智能体识别客户有明确兴趣，建议销售尽快联系。', bailianTagName: 'A-高意向', callerLocation: '上海', calleeLocation: '中国-上海-浦东' },
  { phone: '13888889999', startTime: '2026-07-14 09:01:00', endTime: '2026-07-14 09:01:00', duration: '-', sceneName: '华东店-冷线索跟进-大众通信', status: 3, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029092', callid: '2059190973162029092', callbackReceivedAt: '2026-07-14 09:01:03', callerNumber: '021-88887777', aiTagName: '-', bailianSummary: '百炼智能体判断客户拒接，本次暂不形成有效沟通。', bailianTagName: 'E-需再次跟进', callerLocation: '上海', calleeLocation: '中国-北京-朝阳' },
  { phone: '13911112222', startTime: '2026-07-14 09:02:00', endTime: '2026-07-14 09:02:00', duration: '-', sceneName: '华东店-冷线索跟进-大众通信', status: 8, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029093', callid: '2059190973162029093', callbackReceivedAt: '2026-07-14 09:02:04', callerNumber: '021-88887777', aiTagName: '-', bailianSummary: '百炼智能体判断用户正忙，建议稍后再次触达。', bailianTagName: 'E-需再次跟进', callerLocation: '上海', calleeLocation: '中国-广东-深圳' },
  { phone: '13900000000', startTime: '2026-07-14 09:03:00', endTime: '2026-07-14 09:03:00', duration: '-', sceneName: '南京售后回访-大众通信', status: 0, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029094', callerNumber: '025-88887777', aiTagName: '-' },
  { phone: '13900000002', startTime: '2026-07-14 09:04:00', endTime: '2026-07-14 09:04:00', duration: '-', sceneName: '南京售后回访-大众通信', status: 2, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029095', callerNumber: '025-88887777', aiTagName: '-' },
  { phone: '13900000004', startTime: '2026-07-14 09:05:00', endTime: '2026-07-14 09:05:00', duration: '-', sceneName: '南京售后回访-大众通信', status: 4, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029096', callerNumber: '025-88887777', aiTagName: '-' },
  { phone: '13900000005', startTime: '2026-07-14 09:06:00', endTime: '2026-07-14 09:06:00', duration: '-', sceneName: '南京售后回访-大众通信', status: 5, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029097', callerNumber: '025-88887777', aiTagName: '-' },
  { phone: '13900000006', startTime: '2026-07-14 09:07:00', endTime: '2026-07-14 09:07:00', duration: '-', sceneName: '南京售后回访-大众通信', status: 6, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029098', callerNumber: '025-88887777', aiTagName: '-' },
  { phone: '13900000007', startTime: '2026-07-14 09:08:00', endTime: '2026-07-14 09:08:00', duration: '-', sceneName: '南京售后回访-大众通信', status: 7, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029099', callerNumber: '025-88887777', aiTagName: '-' },
  { phone: '13900000009', startTime: '2026-07-14 09:09:00', endTime: '2026-07-14 09:09:00', duration: '-', sceneName: '深圳新线索-大众通信', status: 9, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029100', callerNumber: '0755-88887777', aiTagName: '-' },
  { phone: '13900000010', startTime: '2026-07-14 09:10:00', endTime: '2026-07-14 09:10:00', duration: '-', sceneName: '深圳新线索-大众通信', status: 10, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029101', callerNumber: '0755-88887777', aiTagName: '-' },
  { phone: '13900000011', startTime: '2026-07-14 09:11:00', endTime: '2026-07-14 09:11:00', duration: '-', sceneName: '深圳新线索-大众通信', status: 11, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029102', callerNumber: '0755-88887777', aiTagName: '-' },
  { phone: '13900000012', startTime: '2026-07-14 09:12:00', endTime: '2026-07-14 09:12:00', duration: '-', sceneName: '深圳新线索-大众通信', status: 12, summary: '', platform: '大众通信', lastNode: '-', sessionId: '2059190973162029103', callerNumber: '0755-88887777', aiTagName: '-' },
  { phone: '13511223344', startTime: '2026-07-15 10:00:00', endTime: '2026-07-15 10:01:02', duration: '62秒', sceneName: '东风日产-新线索-电声', status: '已接通', summary: '客户对电声外呼场景感兴趣，A类意向。', platform: '电声', lastNode: '意向确认', sessionId: 'DS-20260715-001', callerNumber: '0755-88223344', aiTagName: 'A', callerLocation: '广东深圳', calleeLocation: '中国-广东-深圳' },
  { phone: '13522334455', startTime: '2026-07-15 09:30:00', endTime: '2026-07-15 09:30:00', duration: '-', sceneName: '东风日产-冷线索-电声', status: '无人接听', summary: '', platform: '电声', lastNode: '-', sessionId: 'DS-20260715-002', callerNumber: '0755-88223344', aiTagName: '-', callerLocation: '广东深圳', calleeLocation: '中国-广东-广州' },
  { phone: '13633445566', startTime: '2026-07-16 09:20:00', endTime: '2026-07-16 09:20:45', duration: '45秒', sceneName: '燃油车新线索-冰兰', status: '已接通', summary: '客户愿意到店试驾，计划本周末到店。', platform: '冰兰', lastNode: '意向确认', sessionId: 'BL-20260716-001', callerNumber: '010-88990011', aiTagName: 'A', callerLocation: '北京', calleeLocation: '中国-北京-朝阳' },
  { phone: '13644556677', startTime: '2026-07-16 11:00:00', endTime: '2026-07-16 11:00:00', duration: '-', sceneName: '燃油车保客回访-冰兰', status: '拒接', summary: '', platform: '冰兰', lastNode: '-', sessionId: 'BL-20260716-002', callerNumber: '010-88990011', aiTagName: '-', callerLocation: '北京', calleeLocation: '中国-北京-海淀' },
  { phone: '13755667788', startTime: '2026-07-17 09:40:00', endTime: '2026-07-17 09:40:30', duration: '30秒', sceneName: '厚朴-新线索首访', status: '已接通', rawStatusCode: 785, rawStatusName: '自然人摘机', taskId: 'HP-TASK-20260714-001', batchId: 'HP-BATCH-20260714-0001', callId: 'HP-CALL-20260717-001', intention: 'A(高意向)', tags: ['高意向', '同意销售联系'], summary: '客户有购车意向，愿意接受后续跟进。', platform: '厚朴', lastNode: '-', sessionId: 'HP-20260717-001', callerNumber: '023-55667788', aiTagName: '高意向', callerLocation: '重庆', calleeLocation: '中国-重庆-南岸' },
  { phone: '13766778899', startTime: '2026-07-17 10:10:00', endTime: '2026-07-17 10:10:00', duration: '-', sceneName: '厚朴-保客回访', status: '无人接听', rawStatusCode: 790, rawStatusName: '摘机后未识别', taskId: 'HP-TASK-20260713-001', batchId: 'HP-BATCH-20260713-0003', callId: 'HP-CALL-20260717-002', intention: '-', tags: [], summary: '', platform: '厚朴', lastNode: '-', sessionId: 'HP-20260717-002', callerNumber: '023-55667788', aiTagName: '-', callerLocation: '重庆', calleeLocation: '中国-重庆-渝北' },
  { phone: '13777889900', startTime: '2026-07-16 15:30:00', endTime: '2026-07-16 15:30:00', duration: '-', sceneName: '厚朴-新线索首访', status: '呼叫受限', rawStatusCode: 779, rawStatusName: '呼出限制', taskId: 'HP-TASK-20260714-001', batchId: 'HP-BATCH-20260714-0001', callId: 'HP-CALL-20260716-001', intention: '-', tags: [], summary: '', platform: '厚朴', lastNode: '-', sessionId: 'HP-20260716-001', callerNumber: '023-55667788', aiTagName: '-', callerLocation: '重庆', calleeLocation: '中国-重庆-江北' },
  { phone: '13788990011', startTime: '2026-07-16 16:20:00', endTime: '2026-07-16 16:20:00', duration: '-', sceneName: '厚朴-保客回访', status: '无法接通', rawStatusCode: 782, rawStatusName: '呼叫转移', taskId: 'HP-TASK-20260713-001', batchId: 'HP-BATCH-20260713-0003', callId: 'HP-CALL-20260716-002', intention: '-', tags: [], summary: '号码已呼转，未能接通客户。', platform: '厚朴', lastNode: '-', sessionId: 'HP-20260716-002', callerNumber: '023-55667788', aiTagName: '-', callerLocation: '重庆', calleeLocation: '中国-重庆-渝中' }
];

/* 大众通信记录通过已关联任务 uuid 归集，中台不维护远端任务策略 */
MockCallRecordRows.forEach(function (row) {
  if (row.platform === '大众通信') {
    /* 通话记录由回调落库；出现在列表中即表示已获得 callid */
    row.callid = row.callid || row.sessionId;
    row.submitTime = row.submitTime || row.startTime;
    row.callbackReceivedAt = row.callbackReceivedAt || row.endTime;
    row.taskUuid = DazhongTaskUuidByScene[row.sceneName] || '-';
    row.sceneCode = DazhongSceneCodeByScene[row.sceneName] || '-';
  }
});

/* 大众通信通话详情：以回调 callid 的同值作为 recordid 查询 */
var MockDazhongCallDetailByRecordId = {
  '2059190973162029091': {
    recordid: '2059190973162029091',
    detailFetchedAt: '2026-07-14 09:00:39',
    duration: '35秒',
    billDuration: '36秒',
    recordingDuration: '0:35',
    componet: [
      { name: '通话总结', field: 'call_summary', value: '客户对产品服务表达强烈兴趣，已同意由门店销售进一步联系。' },
      { name: '金融方案关注', field: 'finance_interest', value: '是' },
      { name: '现车情况关注', field: 'stock_interest', value: '是' },
      { name: '销售跟进', field: 'sales_follow_up', value: '同意联系' }
    ],
    records: [
      { sequence: 1, question_index: 0, notify: 'answer_notify', question: '', answer_content: '您好，这里是华东门店客户服务中心，想了解一下您近期的购车计划。' },
      { sequence: 2, question_index: 1, notify: 'asrprogress_notify', question: '有在看，想再了解', answer_content: '' },
      { sequence: 2, question_index: 1, notify: 'asrmessage_notify', question: '有在看，想再了解一下金融方案和现车情况。', answer_content: '<break time="500ms"/>好的，我安排门店销售顾问尽快与您联系。' }
    ]
  },
  '2059190973162029092': {
    recordid: '2059190973162029092',
    detailFetchedAt: '2026-07-14 09:01:04',
    duration: '0秒',
    billDuration: '0秒',
    componet: [
      { name: '通话总结', field: 'call_summary', value: '客户拒接，本次未生成对话与录音。' },
      { name: '未接通原因', field: 'unconnected_reason', value: '拒接' }
    ],
    records: []
  },
  '2059190973162029093': {
    recordid: '2059190973162029093',
    detailFetchedAt: '2026-07-14 09:02:05',
    duration: '0秒',
    billDuration: '0秒',
    bailianSummary: '百炼智能体判断用户正忙，建议稍后再次触达。',
    bailianTagName: 'E-需再次跟进',
    records: []
  }
};

/* 演示数据中的大众记录都已经过回调落库；未接通记录的详情可查，但无录音和对话文本。 */
MockCallRecordRows.forEach(function (row) {
  if (row.platform !== '大众通信' || !row.callid || MockDazhongCallDetailByRecordId[row.callid]) return;
  MockDazhongCallDetailByRecordId[row.callid] = {
    recordid: row.callid,
    detailFetchedAt: row.callbackReceivedAt,
    duration: row.duration,
    billDuration: '0秒',
    recordingDuration: '0:00',
    bailianSummary: row.bailianSummary || row.summary || '百炼智能体判断本次呼叫未接通，未生成对话文本。',
    bailianTagName: row.bailianTagName || row.aiTagName || '-',
    records: []
  };
});

/* ===== 通话统计 Mock 数据 ===== */
var MockCallStatsRows = [
  { date: '2026-06-03', sceneName: '华北店-新线索-中科金', platformName: '中科金智能', dialTotal: 80, rosterTotal: 80, connectedTotal: 50, missedTotal: 12, duration: '23分15秒' },
  { date: '2026-06-03', sceneName: '华东店-保客回访-中科金', platformName: '中科金智能', dialTotal: 300, rosterTotal: 300, connectedTotal: 240, missedTotal: 30, duration: '1小时12分8秒' },
  { date: '2026-06-02', sceneName: '华南店-试驾邀约-中科金', platformName: '中科金智能', dialTotal: 0, rosterTotal: 0, connectedTotal: 0, missedTotal: 0, duration: '-' },
  { date: '2026-06-02', sceneName: '西南店-流失预警-中科金', platformName: '中科金智能', dialTotal: 980, rosterTotal: 980, connectedTotal: 620, missedTotal: 360, duration: '2小时18分42秒' },
  { date: '2026-06-03', sceneName: '渝兴店售后-临保邀约', platformName: '一知科技', dialTotal: 0, rosterTotal: 0, connectedTotal: 0, missedTotal: 0, duration: '-' },
  { date: '2026-06-03', sceneName: '华北店-新线索跟进', platformName: '一知科技', dialTotal: 120, rosterTotal: 120, connectedTotal: 75, missedTotal: 18, duration: '21分42秒' },
  { date: '2026-06-02', sceneName: '华东店-保客回访', platformName: '一知科技', dialTotal: 500, rosterTotal: 500, connectedTotal: 420, missedTotal: 40, duration: '1小时46分8秒' },
  { date: '2026-06-02', sceneName: '渝发店售前-冷线索激活', platformName: '一知科技', dialTotal: 1500, rosterTotal: 1500, connectedTotal: 980, missedTotal: 520, duration: '14小时5分' },
  { date: '2026-06-01', sceneName: 'NEV-留资未满-N6推荐', platformName: '一知科技', dialTotal: 0, rosterTotal: 0, connectedTotal: 0, missedTotal: 0, duration: '-' },
  { date: '2026-06-01', sceneName: 'NEV-留资未满-N7推荐', platformName: '一知科技', dialTotal: 1081, rosterTotal: 1081, connectedTotal: 720, missedTotal: 361, duration: '3小时5分17秒' },
  { date: '2026-07-15', sceneName: '东风日产-新线索-电声', platformName: '电声', dialTotal: 120, rosterTotal: 120, connectedTotal: 80, missedTotal: 40, duration: '35分20秒' },
  { date: '2026-07-15', sceneName: '东风日产-冷线索-电声', platformName: '电声', dialTotal: 200, rosterTotal: 200, connectedTotal: 110, missedTotal: 90, duration: '48分10秒' },
  { date: '2026-07-16', sceneName: '燃油车新线索-冰兰', platformName: '冰兰', dialTotal: 80, rosterTotal: 80, connectedTotal: 60, missedTotal: 20, duration: '22分15秒' },
  { date: '2026-07-17', sceneName: '厚朴-新线索首访', platformName: '厚朴', dialTotal: 400, rosterTotal: 1000, connectedTotal: 260, missedTotal: 140, duration: '1小时30分' },
  { date: '2026-07-14', sceneName: '华东店-冷线索跟进-大众通信', platformName: '大众通信', dialTotal: 200, rosterTotal: 200, connectedTotal: 160, missedTotal: 40, duration: '1小时38分15秒' },
  { date: '2026-07-13', sceneName: '南京售后回访-大众通信', platformName: '大众通信', dialTotal: 150, rosterTotal: 150, connectedTotal: 110, missedTotal: 40, duration: '58分42秒' }
];

/* ===== 计费统计 Mock 数据（按租户维度） ===== */
var MockBillingStatsRows = [
  { id: 1, dateFrom: '2026-06-01', dateTo: '2026-06-09', tenantName: '重庆东风南方渝兴', platformName: '一知科技', billingType: '按通话时长', durationMinutes: 105 },
  { id: 2, dateFrom: '2026-06-01', dateTo: '2026-06-09', tenantName: '东风日产-燃油车', platformName: '中科金智能', billingType: '按通话时长', durationMinutes: 65309 },
  { id: 3, dateFrom: '2026-07-01', dateTo: '2026-07-09', tenantName: '东风日产-燃油车', platformName: '电声', billingType: '按通话时长', durationMinutes: 6500 },
  { id: 4, dateFrom: '2026-07-01', dateTo: '2026-07-09', tenantName: '北京东风南方朝阳店', platformName: '冰兰', billingType: '按通话时长', durationMinutes: 2280 },
  { id: 5, dateFrom: '2026-07-14', dateTo: '2026-07-20', tenantName: '重庆东风南方渝兴', platformName: '厚朴', billingType: '按通话时长', durationMinutes: 3980 },
  { id: 6, dateFrom: '2026-07-01', dateTo: '2026-07-23', tenantName: '海南信州海星店', platformName: '大众通信', billingType: '按通话时长', durationMinutes: 115 },
  { id: 7, dateFrom: '2026-07-01', dateTo: '2026-07-23', tenantName: '昆明东风南方三佳专营店', platformName: '大众通信', billingType: '按通话时长', durationMinutes: 251 },
  { id: 8, dateFrom: '2026-07-01', dateTo: '2026-07-23', tenantName: '杭州东风南方杭城店', platformName: '大众通信', billingType: '按通话时长', durationMinutes: 5120 }
];

var MockBillingDetail = {
  1: [
    { date: '2026-06-09', tenantName: '重庆东风南方渝兴', modelType: '-', durationMinutes: '-' },
    { date: '2026-06-08', tenantName: '重庆东风南方渝兴', modelType: '-', durationMinutes: '-' },
    { date: '2026-06-07', tenantName: '重庆东风南方渝兴', modelType: '-', durationMinutes: '-' },
    { date: '2026-06-06', tenantName: '重庆东风南方渝兴', modelType: '-', durationMinutes: '-' },
    { date: '2026-06-05', tenantName: '重庆东风南方渝兴', modelType: '-', durationMinutes: '-' },
    { date: '2026-06-04', tenantName: '重庆东风南方渝兴', modelType: '-', durationMinutes: '-' },
    { date: '2026-06-03', tenantName: '重庆东风南方渝兴', modelType: '-', durationMinutes: '-' },
    { date: '2026-06-02', tenantName: '重庆东风南方渝兴', modelType: '-', durationMinutes: '-' },
    { date: '2026-06-01', tenantName: '重庆东风南方渝兴', modelType: '小模型', durationMinutes: '105分钟' }
  ],
  2: [
    { date: '2026-06-09', tenantName: '东风日产-燃油车', modelType: '大模型', durationMinutes: '8540分钟' },
    { date: '2026-06-08', tenantName: '东风日产-燃油车', modelType: '大模型', durationMinutes: '7230分钟' },
    { date: '2026-06-07', tenantName: '东风日产-燃油车', modelType: '大模型', durationMinutes: '6101分钟' },
    { date: '2026-06-06', tenantName: '东风日产-燃油车', modelType: '小模型', durationMinutes: '8125分钟' },
    { date: '2026-06-05', tenantName: '东风日产-燃油车', modelType: '大模型', durationMinutes: '7742分钟' },
    { date: '2026-06-04', tenantName: '东风日产-燃油车', modelType: '小模型', durationMinutes: '6803分钟' },
    { date: '2026-06-03', tenantName: '东风日产-燃油车', modelType: '小模型', durationMinutes: '9156分钟' },
    { date: '2026-06-02', tenantName: '东风日产-燃油车', modelType: '大模型', durationMinutes: '7230分钟' },
    { date: '2026-06-01', tenantName: '东风日产-燃油车', platformName: '中科金智能', modelType: '大模型', durationMinutes: '6382分钟' }
  ],
  3: [
    { date: '2026-07-02', tenantName: '东风日产-燃油车', platformName: '电声', modelType: '大模型', durationMinutes: '3500分钟' },
    { date: '2026-07-01', tenantName: '东风日产-燃油车', platformName: '电声', modelType: '大模型', durationMinutes: '3000分钟' }
  ],
  4: [
    { date: '2026-07-09', tenantName: '北京东风南方朝阳店', platformName: '冰兰', modelType: '小模型', durationMinutes: '1260分钟' },
    { date: '2026-07-08', tenantName: '北京东风南方朝阳店', platformName: '冰兰', modelType: '小模型', durationMinutes: '1020分钟' }
  ],
  5: [
    { date: '2026-07-20', tenantName: '重庆东风南方渝兴', platformName: '厚朴', modelType: '大模型', durationMinutes: '2180分钟' },
    { date: '2026-07-19', tenantName: '重庆东风南方渝兴', platformName: '厚朴', modelType: '大模型', durationMinutes: '1800分钟' }
  ],
  6: [
    { date: '2026-07-23', tenantName: '海南信州海星店', platformName: '大众通信', modelType: '大模型', durationMinutes: '115分钟' }
  ],
  7: [
    { date: '2026-07-23', tenantName: '昆明东风南方三佳专营店', platformName: '大众通信', modelType: '小模型', durationMinutes: '251分钟' }
  ],
  8: [
    { date: '2026-07-23', tenantName: '杭州东风南方杭城店', platformName: '大众通信', modelType: '大模型', durationMinutes: '5120分钟' }
  ]
};

var MockBillingCallDetail = {
  1: [
    { date: '2026-06-01', phone: '13988776655', startTime: '2026-06-01 09:15', endTime: '2026-06-01 09:16', duration: '22秒', billingMinutes: '1分钟', sceneName: '新线索' },
    { date: '2026-06-01', phone: '13422122345', startTime: '2026-06-01 10:30', endTime: '2026-06-01 10:31', duration: '45秒', billingMinutes: '1分钟', sceneName: '新线索' },
    { date: '2026-06-01', phone: '13367676565', startTime: '2026-06-01 11:00', endTime: '2026-06-01 11:02', duration: '1分34秒', billingMinutes: '2分钟', sceneName: '新线索' },
    { date: '2026-06-01', phone: '13567675454', startTime: '2026-06-01 14:20', endTime: '2026-06-01 14:21', duration: '1分34秒', billingMinutes: '2分钟', sceneName: '冷线索' },
    { date: '2026-06-01', phone: '13423344455', startTime: '2026-06-01 15:45', endTime: '2026-06-01 15:51', duration: '6分0秒', billingMinutes: '6分钟', sceneName: '冷线索' }
  ],
  2: [
    { date: '2026-06-01', phone: '15811223344', startTime: '2026-06-01 08:30', endTime: '2026-06-01 08:31', duration: '18秒', billingMinutes: '1分钟', sceneName: '新线索' },
    { date: '2026-06-01', phone: '13688990011', startTime: '2026-06-01 09:00', endTime: '2026-06-01 09:01', duration: '55秒', billingMinutes: '1分钟', sceneName: '冷线索' },
    { date: '2026-06-01', phone: '17766554433', startTime: '2026-06-01 10:15', endTime: '2026-06-01 10:16', duration: '1分12秒', billingMinutes: '2分钟', sceneName: '新线索' },
    { date: '2026-06-01', phone: '18900112233', startTime: '2026-06-01 11:45', endTime: '2026-06-01 11:48', duration: '2分38秒', billingMinutes: '3分钟', sceneName: '冷线索' },
    { date: '2026-06-01', phone: '13122334455', startTime: '2026-06-01 14:20', endTime: '2026-06-01 14:28', duration: '7分15秒', billingMinutes: '8分钟', sceneName: '新线索' },
    { date: '2026-06-01', phone: '15677889900', startTime: '2026-06-01 16:00', endTime: '2026-06-01 16:01', duration: '32秒', billingMinutes: '1分钟', sceneName: '新线索' }
  ],
  3: [
    { date: '2026-07-02', phone: '135****3344', startTime: '2026-07-02 10:00', endTime: '2026-07-02 10:01', duration: '45秒', billingMinutes: '1分钟', sceneName: '东风日产-新线索-电声' }
  ],
  4: [
    { date: '2026-07-09', phone: '136****5566', startTime: '2026-07-09 09:20', endTime: '2026-07-09 09:21', duration: '45秒', billingMinutes: '1分钟', sceneName: '燃油车新线索-冰兰' }
  ],
  5: [
    { date: '2026-07-20', phone: '137****7788', startTime: '2026-07-20 09:40', endTime: '2026-07-20 09:41', duration: '30秒', billingMinutes: '1分钟', sceneName: '厚朴-新线索首访' }
  ],
  6: [
    { date: '2026-07-23', phone: '137****5678', startTime: '2026-07-23 09:00', endTime: '2026-07-23 09:01', duration: '35秒', billingMinutes: '1分钟', sceneName: '华东店-冷线索跟进-大众通信' }
  ],
  7: [
    { date: '2026-07-23', phone: '138****9999', startTime: '2026-07-23 10:00', endTime: '2026-07-23 10:01', duration: '48秒', billingMinutes: '1分钟', sceneName: '南京售后回访-大众通信' }
  ],
  8: [
    { date: '2026-07-23', phone: '139****2222', startTime: '2026-07-23 11:00', endTime: '2026-07-23 11:02', duration: '1分12秒', billingMinutes: '2分钟', sceneName: '深圳新线索-大众通信' }
  ]
};

/* ===== 已呼叫数据 ===== */
var MockCalledRows = [
  { phone: '138****1234', submitTime: '2026-05-18 09:15:00', dialCount: 1, result: '已接听', channel: '通道A', lastCallTime: '2026-05-18 09:16:30', duration: '00:02:15', summary: '客户表示有兴趣', lastNode: '意向确认' },
  { phone: '139****5678', submitTime: '2026-05-18 10:20:00', dialCount: 2, result: '已接听', channel: '通道B', lastCallTime: '2026-05-18 10:22:00', duration: '00:01:45', summary: '客户需进一步跟进', lastNode: '信息确认' },
  { phone: '136****9012', submitTime: '2026-05-18 11:00:00', dialCount: 1, result: '未接听', channel: '通道A', lastCallTime: '2026-05-18 11:01:00', duration: '00:00:00', summary: '无人接听', lastNode: '外呼' }
];

var MockFailedRows = [
  { phone: '150****3456', submitTime: '2026-05-18 14:00:00', reason: '空号' },
  { phone: '151****7890', submitTime: '2026-05-18 14:30:00', reason: '停机' }
];

/* ===== 已分配数据（按场景 id 索引） ===== */
var MockAssignedData = {
  17: [
    { phone: '138****1111', assignedTime: '2026-07-24 09:15:00', waitTime: '排队中（通道 DT-SH-001）' },
    { phone: '139****2222', assignedTime: '2026-07-24 09:16:00', waitTime: '排队中（通道 DT-SH-001）' },
    { phone: '136****3333', assignedTime: '2026-07-24 09:17:00', waitTime: '排队中（通道 DT-SH-001）' }
  ],
  18: [
    { phone: '150****4444', assignedTime: '2026-07-23 14:00:00', waitTime: '排队中（通道 DT-NJ-001）' }
  ]
};

/* ===== 导入历史记录（含平台返回批次号与有效号码数） ===== */
var MockImportHistory = [
  { id: 1, sceneId: 17, name: '华东冷线索_0724.csv', total: 150, success: 148, fail: 2, batchId: 'DZ-BATCH-20260724-001', validNumberCount: 148, status: '已完成', time: '2026-07-24 09:20:00', op: '超管' },
  { id: 2, sceneId: 14, name: '保客回访名单.xlsx', total: 300, success: 298, fail: 2, batchId: 'ZKJ-BATCH-20260720-001', validNumberCount: 298, status: '已完成', time: '2026-07-20 14:30:00', op: '张三' },
  { id: 3, sceneId: 17, name: '补充名单_0725.csv', total: 80, success: 80, fail: 0, batchId: 'DZ-BATCH-20260725-001', validNumberCount: 80, status: '导入中', time: '2026-07-25 08:00:00', op: '超管' },
  { id: 4, sceneId: 24, name: '厚朴新线索首访_0714.csv', total: 1000, success: 998, fail: 2, batchId: 'HP-BATCH-20260714-0001', validNumberCount: 998, status: '已完成', time: '2026-07-14 09:25:00', op: '超管' }
];

/* ===== 线索统计 Mock 数据 ===== */
var MockClueStatNEV = [
  { no: 1, date: '2023-10-25', type: '新线索', importCount: 500, callCount: 480, connectedCount: 362, dispatchCount: 45, rate: '75.4%', avgDuration: '02:15', levelA: 45, levelB: 120, levelC: 80, levelD: 35, levelE: 200 },
  { no: 2, date: '2023-10-24', type: '新线索', importCount: 450, callCount: 430, connectedCount: 336, dispatchCount: 52, rate: '78.1%', avgDuration: '02:30', levelA: 52, levelB: 110, levelC: 75, levelD: 28, levelE: 180 },
  { no: 3, date: '2023-10-23', type: '冷线索', importCount: 600, callCount: 580, connectedCount: 377, dispatchCount: 30, rate: '65.0%', avgDuration: '01:45', levelA: 30, levelB: 150, levelC: 100, levelD: 50, levelE: 250 },
  { no: 4, date: '2023-10-22', type: '新线索', importCount: 700, callCount: 680, connectedCount: 558, dispatchCount: 80, rate: '82.1%', avgDuration: '02:50', levelA: 80, levelB: 180, levelC: 120, levelD: 40, levelE: 270 },
  { no: 5, date: '2023-10-21', type: '冷线索', importCount: 550, callCount: 520, connectedCount: 315, dispatchCount: 25, rate: '60.6%', avgDuration: '01:20', levelA: 25, levelB: 130, levelC: 90, levelD: 60, levelE: 225 }
];

var MockClueStatICE = [
  { no: 1, date: '2023-10-25', type: '冷线索', importCount: 800, callCount: 760, connectedCount: 477, dispatchCount: 20, rate: '62.8%', avgDuration: '01:30', levelA: 20, levelB: 90, levelC: 150, levelD: 120, levelE: 370 },
  { no: 2, date: '2023-10-24', type: '新线索', importCount: 300, callCount: 290, connectedCount: 232, dispatchCount: 40, rate: '80.0%', avgDuration: '02:40', levelA: 40, levelB: 80, levelC: 50, levelD: 25, levelE: 100 },
  { no: 3, date: '2023-10-23', type: '新线索', importCount: 400, callCount: 385, connectedCount: 297, dispatchCount: 35, rate: '77.1%', avgDuration: '02:20', levelA: 35, levelB: 100, levelC: 60, levelD: 30, levelE: 165 },
  { no: 4, date: '2023-10-22', type: '冷线索', importCount: 1000, callCount: 960, connectedCount: 533, dispatchCount: 15, rate: '55.5%', avgDuration: '01:05', levelA: 15, levelB: 110, levelC: 200, levelD: 150, levelE: 475 },
  { no: 5, date: '2023-10-21', type: '新线索', importCount: 350, callCount: 335, connectedCount: 273, dispatchCount: 42, rate: '81.5%', avgDuration: '02:55', levelA: 42, levelB: 90, levelC: 55, levelD: 20, levelE: 133 }
];

var MockClueDetailNEV = [
  { no: 1, importTime: '2023-10-25 10:00:00', clueCode: 'XS202310250001', sceneName: '一知-nev-新线索', type: '新线索', phone: '138****8888', storeCode: 'MD001', storeName: '杭州旗舰店', callTime: '2023-10-25 10:05:00', status: '已接听', statusTag: 'green', duration: '02:30', levelCenter: 'A (高意向)', levelCenterTag: 'blue', levelBiz: 'A (高意向)', levelBizTag: 'green', dispatchStore: '杭州西湖店' },
  { no: 2, importTime: '2023-10-25 10:15:00', clueCode: 'XS202310250003', sceneName: '一知-nev-新线索', type: '新线索', phone: '137****7777', storeCode: 'MD001', storeName: '杭州旗舰店', callTime: '2023-10-25 10:20:00', status: '已接听', statusTag: 'green', duration: '01:45', levelCenter: 'B (潜在)', levelCenterTag: 'blue', levelBiz: 'B (潜在)', levelBizTag: 'blue', dispatchStore: '杭州滨江店' },
  { no: 3, importTime: '2023-10-25 10:30:00', clueCode: 'XS202310250005', sceneName: '一知-保有客户-回访', type: '新线索', phone: '136****6666', storeCode: 'MD003', storeName: '上海静安店', callTime: '2023-10-25 10:35:00', status: '无应答', statusTag: 'red', duration: '00:00', levelCenter: 'C (一般)', levelCenterTag: 'gray', levelBiz: 'C (一般)', levelBizTag: 'gray', dispatchStore: '上海静安店' },
  { no: 4, importTime: '2023-10-25 10:45:00', clueCode: 'XS202310250007', sceneName: '一知-nev-新线索', type: '冷线索', phone: '135****5555', storeCode: 'MD001', storeName: '杭州旗舰店', callTime: '2023-10-25 10:50:00', status: '已接听', statusTag: 'green', duration: '03:10', levelCenter: 'A (高意向)', levelCenterTag: 'blue', levelBiz: 'A (高意向)', levelBizTag: 'green', dispatchStore: '杭州旗舰店' },
  { no: 5, importTime: '2023-10-25 11:00:00', clueCode: 'XS202310250009', sceneName: '一知-nev-新线索', type: '新线索', phone: '134****4444', storeCode: 'MD005', storeName: '杭州西湖店', callTime: '2023-10-25 11:05:00', status: '忙线中', statusTag: 'red', duration: '00:00', levelCenter: 'D (忙碌/敷衍)', levelCenterTag: 'gray', levelBiz: 'E (拒绝/无效/无应答)', levelBizTag: 'red', dispatchStore: '杭州西湖店' }
];

var MockClueDetailICE = [
  { no: 1, importTime: '2023-10-25 09:45:00', clueCode: 'XS202310250002', sceneName: '一知-燃油车-冷线索', type: '冷线索', phone: '139****9999', storeCode: 'MD002', storeName: '广州天河店', callTime: '--', status: '无应答', statusTag: 'red', duration: '00:00', levelCenter: 'B (潜在)', levelCenterTag: 'blue', levelBiz: 'B (潜在)', levelBizTag: 'blue', dispatchStore: '广州天河店' },
  { no: 2, importTime: '2023-10-25 10:20:00', clueCode: 'XS202310250004', sceneName: '一知-燃油车-冷线索', type: '冷线索', phone: '131****1111', storeCode: 'MD004', storeName: '深圳南山店', callTime: '2023-10-25 10:25:00', status: '已接听', statusTag: 'green', duration: '01:10', levelCenter: 'C (一般)', levelCenterTag: 'blue', levelBiz: 'A (高意向)', levelBizTag: 'green', dispatchStore: '深圳南山店' },
  { no: 3, importTime: '2023-10-25 10:55:00', clueCode: 'XS202310250006', sceneName: '一知-燃油车-冷线索', type: '冷线索', phone: '132****2222', storeCode: 'MD006', storeName: '北京朝阳店', callTime: '2023-10-25 11:00:00', status: '已接听', statusTag: 'green', duration: '02:05', levelCenter: 'A (高意向)', levelCenterTag: 'blue', levelBiz: 'A (高意向)', levelBizTag: 'green', dispatchStore: '北京朝阳店' },
  { no: 4, importTime: '2023-10-25 11:15:00', clueCode: 'XS202310250008', sceneName: '一知-燃油车-冷线索', type: '新线索', phone: '133****3333', storeCode: 'MD002', storeName: '广州天河店', callTime: '2023-10-25 11:20:00', status: '空号', statusTag: 'red', duration: '00:00', levelCenter: 'E (拒绝/无效/无应答)', levelCenterTag: 'gray', levelBiz: 'E (拒绝/无效/无应答)', levelBizTag: 'gray', dispatchStore: '广州天河店' },
  { no: 5, importTime: '2023-10-25 11:40:00', clueCode: 'XS202310250010', sceneName: '一知-燃油车-冷线索', type: '冷线索', phone: '130****0000', storeCode: 'MD008', storeName: '南京新街口店', callTime: '2023-10-25 11:45:00', status: '已接听', statusTag: 'green', duration: '00:55', levelCenter: 'B (潜在)', levelCenterTag: 'blue', levelBiz: 'B (潜在)', levelBizTag: 'blue', dispatchStore: '南京新街口店' }
];

var MockClueReturn = [
  { no: 1, date: '2015-10-10', scene: '燃油车新线索', importCount: 88, submitCount: 78, returnCount: 34 },
  { no: 2, date: '2015-10-09', scene: '燃油车新线索', importCount: 125, submitCount: 123, returnCount: 22 },
  { no: 3, date: '2015-10-08', scene: '燃油车新线索', importCount: 67, submitCount: 45, returnCount: 33 },
  { no: 4, date: '2015-10-07', scene: '燃油车新线索', importCount: 34, submitCount: 23, returnCount: 2 },
  { no: 5, date: '2015-10-06', scene: '燃油车新线索', importCount: 333, submitCount: 234, returnCount: 44 }
];

var MockStoreHierarchy = {
  "华东": {
    "浙江区": ["杭州旗舰店", "杭州西湖店", "杭州滨江店"],
    "上海区": ["上海静安店", "上海徐汇店"]
  },
  "华南": {
    "广东一区": ["广州天河店", "深圳南山店"],
    "广东二区": ["佛山顺德店"]
  },
  "华北": {
    "北京区": ["北京朝阳店", "北京海淀店"]
  }
};

/* ===== 线索记录 Mock（六平台统一维度，保留平台专属意向与回访详情） ===== */
var MockClueRecordRows = [
  { phone: '18782033152', platform: '一知科技', lastVisitTime: '2026-08-20 13:40:21', visitCount: 1, lastCallStatus: '已接通', lastRecord: '客户对东风日产天籁有明确购车意向。', sceneName: 'NEV-大模型-一知新线索-号码认证', intention: 'A(有购车意向)', hasTags: true, firstVisitTime: '2026-08-20 13:40:21', secondVisitTime: '-', thirdVisitTime: '-', detailTags: { '意向标签': 'A(有购车意向)', '意向车系': '天籁', '预计购车时间': '1个月内', '通话标签': '同意销售联系' } },
  { phone: '19011813593', platform: '一知科技', lastVisitTime: '2026-08-20 13:35:20', visitCount: 1, lastCallStatus: '拦截规则', lastRecord: '-', sceneName: 'NEV-大模型-一知新线索-号码认证', intention: '-', hasTags: false, firstVisitTime: '2026-08-20 13:35:20', secondVisitTime: '-', thirdVisitTime: '-' },
  { phone: '15672298532', platform: '一知科技', lastVisitTime: '2026-08-20 13:13:20', visitCount: 1, lastCallStatus: '已接通', lastRecord: '客户对东风日产 N6 感兴趣。', sceneName: 'NEV-大模型-一知新线索-号码认证', intention: 'A(有购车意向)', hasTags: true, firstVisitTime: '2026-08-20 13:13:20', secondVisitTime: '-', thirdVisitTime: '-', detailTags: { '意向标签': 'A(有购车意向)', '意向车系': 'N6', '客户关注': '金融优惠' } },
  { phone: '15305168633', platform: '中科金智能', lastVisitTime: '2026-08-20 12:58:12', visitCount: 1, lastCallStatus: '已接通', lastRecord: '客户计划一周内到店试驾。', sceneName: '华北店-新线索-中科金', intention: 'A(高意向)', hasTags: true, firstVisitTime: '2026-08-20 12:58:12', secondVisitTime: '-', thirdVisitTime: '-', detailTags: { '意向标签': 'A(高意向)', '业务场景': '新线索', '预计到店时间': '一周内' } },
  { phone: '135****3344', platform: '电声', lastVisitTime: '2026-08-20 12:42:18', visitCount: 2, lastCallStatus: '已接通', lastRecord: '第二次回访确认客户愿意接受门店联系。', sceneName: '东风日产-新线索-电声', intention: 'A（高意向）', hasTags: true, firstVisitTime: '2026-08-19 10:15:00', secondVisitTime: '2026-08-20 12:42:18', thirdVisitTime: '-', detailTags: { '意向标签': 'A（高意向）', '加微状态': '已同意', '外呼小结': '建议门店尽快跟进' }, visits: [
    { time: '2026-08-19 10:15:00', status: '无人接听', record: '首次呼叫无人接听。', intention: '-' },
    { time: '2026-08-20 12:42:18', status: '已接通', record: '客户愿意接受门店联系。', intention: 'A（高意向）' }
  ] },
  { phone: '135****4455', platform: '电声', lastVisitTime: '2026-08-20 12:35:10', visitCount: 1, lastCallStatus: '拒接', lastRecord: '客户拒接，本轮未形成有效对话。', sceneName: '东风日产-冷线索-电声', intention: 'D（无意向）', hasTags: true, firstVisitTime: '2026-08-20 12:35:10', secondVisitTime: '-', thirdVisitTime: '-', detailTags: { '意向标签': 'D（无意向）', '通话状态映射': '205 → 拒接' } },
  { phone: '13641248326', platform: '冰兰', lastVisitTime: '2026-08-20 13:26:20', visitCount: 1, lastCallStatus: '黑名单过滤', lastRecord: '呼叫未接通：命中黑名单。', sceneName: '燃油车新线索-冰兰', intention: '-', hasTags: true, firstVisitTime: '2026-08-20 13:26:20', secondVisitTime: '-', thirdVisitTime: '-', detailTags: { '过滤结果': '黑名单过滤', '风险策略': '默认分组' } },
  { phone: '137****7788', platform: '厚朴', lastVisitTime: '2026-08-20 11:55:30', visitCount: 1, lastCallStatus: '已接通', lastRecord: '客户有购车意向，愿意接受后续跟进。', sceneName: '厚朴-新线索首访', intention: 'A(高意向)', hasTags: true, firstVisitTime: '2026-08-20 11:55:30', secondVisitTime: '-', thirdVisitTime: '-', taskId: 'HP-TASK-20260714-001', batchId: 'HP-BATCH-20260714-0001', rawStatusCode: 785, rawStatusName: '自然人摘机', detailTags: { '意向标签': 'A(高意向)', '任务ID': 'HP-TASK-20260714-001', '批次号': 'HP-BATCH-20260714-0001', '原始状态': '785 自然人摘机' } },
  { phone: '135****0006', platform: '大众通信', lastVisitTime: '2026-07-14 14:15:00', visitCount: 1, lastCallStatus: '呼叫成功', lastRecord: '百炼智能体识别客户有明确兴趣，建议销售尽快联系。', sceneName: '华东店-冷线索跟进-大众通信', intention: 'A-高意向', hasTags: true, firstVisitTime: '2026-07-14 14:15:00', secondVisitTime: '-', thirdVisitTime: '-', callid: '2059190973162029091', detailTags: { '大众意向等级': 'A-高意向', '百炼标签': 'A-高意向', '关联任务 UUID': '9f6d9a40-2fb3-4c56-8b21-202607140017' } },
  { phone: '135****0007', platform: '大众通信', lastVisitTime: '2026-07-14 15:20:00', visitCount: 1, lastCallStatus: '占线', lastRecord: '用户正忙，建议稍后再次触达。', sceneName: '华东店-冷线索跟进-大众通信', intention: 'E-需再次跟进', hasTags: true, firstVisitTime: '2026-07-14 15:20:00', secondVisitTime: '-', thirdVisitTime: '-', callid: '2059190973162029093', detailTags: { '大众意向等级': 'E-需再次跟进', '百炼标签': 'E-需再次跟进', '通话状态码': '8' } },
  { phone: '135****0008', platform: '大众通信', lastVisitTime: '2026-07-14 16:10:00', visitCount: 1, lastCallStatus: '拒接', lastRecord: '客户拒接，本次未生成对话。', sceneName: '华东店-冷线索跟进-大众通信', intention: 'F-号码无效', hasTags: true, firstVisitTime: '2026-07-14 16:10:00', secondVisitTime: '-', thirdVisitTime: '-', callid: '2059190973162029092', detailTags: { '大众意向等级': 'F-号码无效', '通话状态码': '3', '结果': '未下发' } },
  { phone: '135****0009', platform: '大众通信', lastVisitTime: '2026-07-14 17:10:00', visitCount: 1, lastCallStatus: '呼入限制', lastRecord: '本次未形成有效评级。', sceneName: '深圳新线索-大众通信', intention: '未评级', hasTags: false, firstVisitTime: '2026-07-14 17:10:00', secondVisitTime: '-', thirdVisitTime: '-', callid: '2059190973162029100' }
];

/* 参考数据接入统一租户模型：场景带“店/区域”语义的记录归入门店租户，其余归入总部租户。 */
function applyUnifiedAiRecordScope(row, index, kind) {
  var scene = String(row.sceneName || '');
  var storeScoped = /华东店|华南店|华北店|西南店|南京|深圳|渝发店|渝兴店|门店/.test(scene);
  row.tenantId = row.tenantId || (storeScoped ? 'TEN-NISSAN-SH' : 'TEN-NISSAN-HQ');
  if (kind !== 'clue') return;
  row.clueId = row.clueId || ('AI-CLUE-' + String(index + 1).padStart(4, '0'));
  if (/深圳|华南/.test(scene)) {
    row.regionCode = '华南'; row.subRegionCode = '广东一区'; row.dealerCode = '深圳南山店';
  } else if (/南京/.test(scene)) {
    row.regionCode = '华东'; row.subRegionCode = '江苏区'; row.dealerCode = '南京新街口店';
  } else if (/华东/.test(scene)) {
    row.regionCode = '华东'; row.subRegionCode = '上海区'; row.dealerCode = '上海静安店';
  } else if (/华北/.test(scene)) {
    row.regionCode = '华北'; row.subRegionCode = '北京区'; row.dealerCode = '北京朝阳店';
  } else if (/西南|渝/.test(scene)) {
    row.regionCode = '西南'; row.subRegionCode = '重庆区'; row.dealerCode = '重庆东风南方门店';
  } else {
    row.regionCode = '全国总部'; row.subRegionCode = '总部业务'; row.dealerCode = '东风日产总部';
  }
}

MockCallRecordRows.forEach(function (row, index) { applyUnifiedAiRecordScope(row, index, 'call'); });
MockClueRecordRows.forEach(function (row, index) { applyUnifiedAiRecordScope(row, index, 'clue'); });

function unifiedAiReportTenant(text, index) {
  return /华东店|华南店|华北店|西南店|南京|深圳|渝兴|渝发|门店|杭州|海南|昆明|北京东风/.test(String(text || ''))
    ? 'TEN-NISSAN-SH'
    : (index % 2 ? 'TEN-NISSAN-SH' : 'TEN-NISSAN-HQ');
}

MockCallStatsRows.forEach(function (row, index) {
  row.tenantId = unifiedAiReportTenant(row.sceneName, index);
});

MockBillingStatsRows.forEach(function (row, index) {
  row.tenantId = unifiedAiReportTenant(row.tenantName, index);
  row.tenantName = row.tenantId === 'TEN-NISSAN-HQ' ? '东风日产总部' : '上海华东门店';
  row.modelType = row.modelType || (index % 2 ? '大模型' : '小模型');
  row.unitPriceSnapshot = row.unitPriceSnapshot || (row.modelType === '大模型' ? 0.40 : 0.26);
  row.consumeAmount = Number((Number(row.durationMinutes || 0) * row.unitPriceSnapshot).toFixed(2));
  (MockBillingDetail[row.id] || []).forEach(function (detail) {
    detail.tenantId = row.tenantId;
    detail.tenantName = row.tenantName;
    detail.unitPriceSnapshot = row.unitPriceSnapshot;
  });
  (MockBillingCallDetail[row.id] || []).forEach(function (detail) {
    detail.tenantId = row.tenantId;
    detail.unitPriceSnapshot = row.unitPriceSnapshot;
  });
});

[MockClueStatNEV, MockClueStatICE, MockClueDetailNEV, MockClueDetailICE, MockClueReturn].forEach(function (dataset, datasetIndex) {
  dataset.forEach(function (row, index) {
    row.tenantId = row.tenantId || unifiedAiReportTenant(row.storeName || row.sceneName || row.scene, index + datasetIndex);
  });
});

/* ===== 租户计费管理 Mock 数据 ===== */
var MockTenantBillingRows = [
  { id: 1, tenantName: '东风日产-燃油车', accountName: '一知账号 A', billingType: '坐席费+通话费', rechargeNo: 'RC20260601001', rechargeStatus: '已支付', modelType: '大模型', localAddedAt: '2026-06-01 09:30:00', seatFeePackage: '全年套餐', periodDays: 365, rechargeAmount: 2000, validFrom: '2026-06-01', validTo: '2027-05-31', enabled: true, validityActivated: true },
  { id: 2, tenantName: '重庆东南方渝兴', accountName: '一知账号 C', billingType: '仅坐席费', rechargeNo: 'RC20260602002', rechargeStatus: '未支付', modelType: '小模型', localAddedAt: '2026-06-02 10:10:00', seatFeePackage: '半年套餐', periodDays: 183, rechargeAmount: 0, validFrom: '-', validTo: '-', enabled: false, validityActivated: false },
  { id: 3, tenantName: '重庆东南方渝发', accountName: '一知账号 B', billingType: '其他', rechargeNo: 'RC20260501003', rechargeStatus: '已取消', modelType: '大模型', localAddedAt: '2026-05-01 14:20:00', seatFeePackage: '-', periodDays: 0, rechargeAmount: 0, validFrom: '-', validTo: '-', enabled: false, validityActivated: false },
  { id: 4, tenantName: '东风日产-点检', accountName: '一知账号 D', billingType: '仅坐席费', rechargeNo: 'RC20260605005', rechargeStatus: '已支付', modelType: '小模型', localAddedAt: '2026-06-05 09:00:00', seatFeePackage: '半年套餐', periodDays: 183, rechargeAmount: 0, validFrom: '-', validTo: '-', enabled: false, validityActivated: false }
];

var MockRechargeOrders = [
  { no: 'RC20260601001', tenantName: '东风日产-燃油车', storeCode: 'HQ-RY-001', storeName: '东风日产燃油车总部', status: '已支付', seatFeePackage: '全年套餐', periodDays: 365, billingType: '坐席费+通话费', rechargeAmount: 2000 },
  { no: 'RC20260602002', tenantName: '重庆东南方渝兴', storeCode: 'CQ-YX-001', storeName: '重庆东风南方渝兴店', status: '未支付', seatFeePackage: '半年套餐', periodDays: 183, billingType: '仅坐席费', rechargeAmount: 0 },
  { no: 'RC20260603003', tenantName: '重庆东南方渝发', storeCode: 'CQ-YF-001', storeName: '重庆东风南方渝发店', status: '查询失败', seatFeePackage: '半年套餐', periodDays: 183, billingType: '坐席费+通话费', rechargeAmount: 1000 },
  { no: 'RC20260604004', tenantName: '东风日产-点检', storeCode: 'HQ-DJ-001', storeName: '东风日产点检总部', status: '不存在', seatFeePackage: '半年套餐', periodDays: 183, billingType: '仅坐席费', rechargeAmount: 0 },
  { no: 'RC20260605005', tenantName: '超级管理组', storeCode: 'HQ-SYS-001', storeName: '超级管理组', status: '已取消', seatFeePackage: '-', periodDays: 0, billingType: '仅通话费', rechargeAmount: 3000 },
  { no: 'RC20260606006', tenantName: '重庆东南方渝发', storeCode: 'CQ-YF-001', storeName: '重庆东风南方渝发店', status: '已支付', seatFeePackage: '半年套餐', periodDays: 183, billingType: '仅坐席费', rechargeAmount: 0 },
  { no: 'RC20260607007', tenantName: '重庆东南方渝兴', storeCode: 'CQ-YX-001', storeName: '重庆东风南方渝兴店', status: '已支付', seatFeePackage: '-', periodDays: 0, billingType: '仅通话费', rechargeAmount: 1500 },
  { no: 'RC20260608008', tenantName: '重庆东南方渝兴', storeCode: 'CQ-YX-001', storeName: '重庆东风南方渝兴店', status: '已支付', seatFeePackage: '全年套餐', periodDays: 365, billingType: '坐席费+通话费', rechargeAmount: 2500 },
  { no: 'RC20260609009', tenantName: '东风日产-燃油车', storeCode: 'HQ-RY-001', storeName: '东风日产燃油车总部', status: '已支付', seatFeePackage: '-', periodDays: 0, billingType: '仅通话费', rechargeAmount: 520 },
  { no: 'RC20260610010', tenantName: '重庆东南方渝发', storeCode: 'CQ-YF-001', storeName: '重庆东风南方渝发店', status: '已支付', seatFeePackage: '-', periodDays: 0, billingType: '仅通话费', rechargeAmount: 800 },
  { no: 'RC20260615011', tenantName: '重庆东南方渝兴', storeCode: 'CQ-YX-001', storeName: '重庆东风南方渝兴店', status: '已支付', seatFeePackage: '半年套餐', periodDays: 183, billingType: '仅坐席费', rechargeAmount: 0 },
  { no: 'RC20260616012', tenantName: '重庆东南方渝兴', storeCode: 'CQ-YX-001', storeName: '重庆东风南方渝兴店', status: '已支付', seatFeePackage: '半年套餐', periodDays: 183, billingType: '坐席费+通话费', rechargeAmount: 1200 },
  { no: 'RC-HQ-001', tenantName: '东风日产-燃油车', storeCode: 'HQ-RY-001', storeName: '东风日产燃油车总部', status: '已支付', seatFeePackage: '全年套餐', periodDays: 365, billingType: '坐席费+通话费', rechargeAmount: 999999999 },
  { no: 'RC-HQ-002', tenantName: '东风日产-点检', storeCode: 'HQ-DJ-001', storeName: '东风日产点检总部', status: '已支付', seatFeePackage: '全年套餐', periodDays: 365, billingType: '坐席费+通话费', rechargeAmount: 999999999 },
  { no: 'RC-HQ-003', tenantName: '超级管理组', storeCode: 'HQ-SYS-001', storeName: '超级管理组', status: '已支付', seatFeePackage: '全年套餐', periodDays: 365, billingType: '坐席费+通话费', rechargeAmount: 999999999 }
];

var MockTenantAccounts = [
  { accountName: '一知账号 A', tenantName: '东风日产-燃油车', modelType: '大模型' },
  { accountName: '一知账号 B', tenantName: '重庆东南方渝发', modelType: '大模型' },
  { accountName: '一知账号 C', tenantName: '重庆东南方渝兴', modelType: '小模型' },
  { accountName: '一知账号 D', tenantName: '东风日产-点检', modelType: '小模型' }
];

var MockTenantRows = [
  { no: 1, name: '海南海粤店', consumedAmount: 150, type: '门店', tenantId: '2054091001122334455', desc: '-', status: '启用', updater: 'sj-lsy9527', updateTime: '2026-08-11 16:09:26' },
  { no: 2, name: '海南儋州海星店', consumedAmount: 80, type: '门店', tenantId: '2054082200233445566', desc: '-', status: '启用', updater: 'admin', updateTime: '2026-08-10 11:20:15' },
  { no: 3, name: '昆明东风南方三住专营店', consumedAmount: 210, type: '门店', tenantId: '2054073300344556677', desc: '-', status: '启用', updater: 'xtadmin', updateTime: '2026-08-09 14:05:00' },
  { no: 4, name: '杭州东风南方杭锐店', consumedAmount: 520, type: '门店', tenantId: '2054064400455667788', desc: '-', status: '启用', updater: 'admin', updateTime: '2026-08-12 09:30:00' },
  { no: 5, name: '宁波海达京汉店', consumedAmount: 90, type: '门店', tenantId: '2054055500566778899', desc: '-', status: '启用', updater: 'xtadmin', updateTime: '2026-08-08 17:00:00' },
  { no: 6, name: '东风日产-NEV培育', consumedAmount: 340, type: '总部', tenantId: '2016199900677889900', desc: '-', status: '启用', updater: 'xtadmin', updateTime: '2026-08-07 10:15:30' },
  { no: 7, name: '重庆东风南方渝兴', consumedAmount: 120, type: '门店', tenantId: '2054080803329462274', desc: '-', status: '启用', updater: 'xtadmin', updateTime: '2026-05-12 14:06:41' },
  { no: 8, name: '重庆东风南方渝发', consumedAmount: 260, type: '门店', tenantId: '2054073731284819970', desc: '-', status: '启用', updater: 'xtadmin', updateTime: '2026-05-12 13:38:35' },
  { no: 9, name: '东风日产-点检', consumedAmount: 0, type: '总部', tenantId: '2016181907299717121', desc: '-', status: '启用', updater: 'xtadmin', updateTime: '2026-01-28 00:10:00' },
  { no: 10, name: '东风日产-燃油车', consumedAmount: 180, type: '总部', tenantId: '2016155108954767361', desc: '请勿删除', status: '启用', updater: 'xtadmin', updateTime: '2026-01-28 00:09:27' },
  { no: 11, name: '超级管理组', consumedAmount: 0, type: '总部', tenantId: '1958770839827107842', desc: '系统默认组别，不可删除与修改', status: '启用', updater: 'xtadmin', updateTime: '2026-01-11 09:00:43' }
];

/* ===== 账号管理 Mock 数据 ===== */
var MockAccountRows = [
  { id: 1, tenantName: '海南海粤店', nickname: '东风日产海粤店', username: 'G3123', phone: '13768578915', role: '租户管理员', status: '启用', updater: 'sj-lsy9527', updateTime: '2026-08-11 16:09:26' },
  { id: 2, tenantName: '海南儋州海星店', nickname: '儋州海星管理员', username: 'G4055', phone: '13888880001', role: '租户管理员', status: '启用', updater: 'admin', updateTime: '2026-08-10 11:20:15' },
  { id: 3, tenantName: '昆明东风南方三住专营店', nickname: '三住店专员', username: 'G5021', phone: '13900002233', role: '普通坐席', status: '启用', updater: 'xtadmin', updateTime: '2026-08-09 14:05:00' },
  { id: 4, tenantName: '杭州东风南方杭锐店', nickname: '杭锐店店总', username: 'G6001', phone: '13612345678', role: '租户管理员', status: '启用', updater: 'admin', updateTime: '2026-08-12 09:30:00' },
  { id: 5, tenantName: '杭州东风南方杭锐店', nickname: '杭锐客服A', username: 'G6002', phone: '13612345679', role: '普通坐席', status: '启用', updater: 'admin', updateTime: '2026-08-12 09:35:00' },
  { id: 6, tenantName: '杭州东风南方杭锐店', nickname: '杭锐外呼专员B', username: 'G6003', phone: '13612345680', role: '外呼专员', status: '启用', updater: 'admin', updateTime: '2026-08-12 09:40:00' },
  { id: 7, tenantName: '杭州东风南方杭锐店', nickname: '杭锐财务', username: 'G6004', phone: '13612345681', role: '财务审核员', status: '启用', updater: 'admin', updateTime: '2026-08-12 09:45:00' },
  { id: 8, tenantName: '宁波海达京汉店', nickname: '宁波海达管理员', username: 'G7012', phone: '13566667788', role: '租户管理员', status: '启用', updater: 'xtadmin', updateTime: '2026-08-08 17:00:00' },
  { id: 9, tenantName: '东风日产-NEV培育', nickname: 'NEV培育专员', username: 'G8099', phone: '13311223344', role: '外呼专员', status: '启用', updater: 'xtadmin', updateTime: '2026-08-07 10:15:30' },
  { id: 10, tenantName: '重庆东风南方渝兴', nickname: '渝兴管理员', username: 'G9001', phone: '13899990001', role: '租户管理员', status: '启用', updater: 'xtadmin', updateTime: '2026-05-12 14:06:41' },
  { id: 11, tenantName: '重庆东风南方渝发', nickname: '渝发管理员', username: 'G9002', phone: '13899990002', role: '租户管理员', status: '启用', updater: 'xtadmin', updateTime: '2026-05-12 13:38:35' },
  { id: 12, tenantName: '东风日产-点检', nickname: '点检总控', username: 'G1001', phone: '13100001111', role: '租户管理员', status: '启用', updater: 'xtadmin', updateTime: '2026-01-28 00:10:00' },
  { id: 13, tenantName: '东风日产-燃油车', nickname: '燃油车总部运营', username: 'G2001', phone: '13200002222', role: '租户管理员', status: '启用', updater: 'xtadmin', updateTime: '2026-01-28 00:09:27' },
  { id: 14, tenantName: '超级管理组', nickname: '超级管理员', username: 'admin', phone: '18888888888', role: '系统管理员', status: '启用', updater: 'system', updateTime: '2026-01-11 09:00:43' }
];

/* 当前版本只配置模型默认价；providerCode 为空表示适用于该模型的所有供应商。 */
var MockTenantPriceRules = [
  { tenantName: '重庆东风南方渝兴', modelType: '大模型', providerCode: null, pricingScope: 'MODEL_DEFAULT', unitPrice: 0.42, status: '启用' },
  { tenantName: '重庆东风南方渝兴', modelType: '小模型', providerCode: null, pricingScope: 'MODEL_DEFAULT', unitPrice: 0.28, status: '启用' },
  { tenantName: '重庆东风南方渝发', modelType: '大模型', providerCode: null, pricingScope: 'MODEL_DEFAULT', unitPrice: 0.32, status: '启用' },
  { tenantName: '重庆东风南方渝发', modelType: '小模型', providerCode: null, pricingScope: 'MODEL_DEFAULT', unitPrice: 0.24, status: '启用' },
  { tenantName: '东风日产-点检', modelType: '大模型', providerCode: null, pricingScope: 'MODEL_DEFAULT', unitPrice: 0.48, status: '启用' },
  { tenantName: '东风日产-点检', modelType: '小模型', providerCode: null, pricingScope: 'MODEL_DEFAULT', unitPrice: 0.35, status: '启用' },
  { tenantName: '东风日产-燃油车', modelType: '大模型', providerCode: null, pricingScope: 'MODEL_DEFAULT', unitPrice: 0.40, status: '启用' },
  { tenantName: '东风日产-燃油车', modelType: '小模型', providerCode: null, pricingScope: 'MODEL_DEFAULT', unitPrice: 0.26, status: '启用' },
  { tenantName: '超级管理组', modelType: '大模型', providerCode: null, pricingScope: 'MODEL_DEFAULT', unitPrice: 0.45, status: '启用' },
  { tenantName: '超级管理组', modelType: '小模型', providerCode: null, pricingScope: 'MODEL_DEFAULT', unitPrice: 0.30, status: '启用' }
];

/* 供应商目录暂不参与当前计价，未来可通过 PROVIDER_OVERRIDE 规则覆盖模型默认价。 */
var MockBillingVendors = [
  { providerCode: 'IFLYTEK', providerName: '科大讯飞', status: '启用' },
  { providerCode: 'YIZHI', providerName: '一知科技', status: '启用' },
  { providerCode: 'ZKJ', providerName: '中科金', status: '启用' },
  { providerCode: 'BINGLAN', providerName: '冰兰', status: '启用' }
];

var MockTenantRechargeHistory = [
  { id: 1, tenantName: '重庆东风南方渝兴', rechargeNo: 'RC20250512001', status: '已支付', billingType: '仅坐席费', seatFeePackage: '全年套餐', periodDays: 365, rechargeAmount: 0, validFrom: '2025-05-12', validTo: '2026-05-11', operator: 'xtadmin', bindTime: '2025-05-12 14:12:08', activated: true, validityActivated: true },
  { id: 2, tenantName: '重庆东风南方渝兴', rechargeNo: 'RC20260412001', status: '已取消', billingType: '仅坐席费', seatFeePackage: '-', periodDays: 0, rechargeAmount: 0, validFrom: '-', validTo: '-', operator: 'xtadmin', bindTime: '2026-04-12 10:22:31', activated: false, validityActivated: false },
  { id: 7, tenantName: '重庆东风南方渝兴', rechargeNo: 'RC20260608008', status: '已支付', billingType: '坐席费+通话费', seatFeePackage: '全年套餐', periodDays: 365, rechargeAmount: 2500, validFrom: '2026-06-12', validTo: '2027-06-11', operator: 'xtadmin', bindTime: '2026-06-12 08:00:00', activated: true, validityActivated: true },
  { id: 8, tenantName: '重庆东风南方渝兴', rechargeNo: 'RC20260607007', status: '已支付', billingType: '仅通话费', seatFeePackage: '-', periodDays: 0, rechargeAmount: 1500, validFrom: '-', validTo: '-', operator: 'xtadmin', bindTime: '2026-06-07 10:15:00', activated: true, validityActivated: true },
  { id: 12, tenantName: '重庆东风南方渝兴', rechargeNo: 'RC20260615011', storeCode: 'CQ-YX-001', storeName: '重庆东风南方渝兴店', status: '已支付', billingType: '仅坐席费', seatFeePackage: '半年套餐', periodDays: 183, rechargeAmount: 0, validFrom: '-', validTo: '-', operator: 'xtadmin', bindTime: '2026-06-15 15:30:00', activated: false, validityActivated: false },
  { id: 13, tenantName: '重庆东风南方渝兴', rechargeNo: 'RC20260616012', storeCode: 'CQ-YX-001', storeName: '重庆东风南方渝兴店', status: '已支付', billingType: '坐席费+通话费', seatFeePackage: '半年套餐', periodDays: 183, rechargeAmount: 1200, validFrom: '-', validTo: '-', operator: 'xtadmin', bindTime: '2026-06-16 09:20:00', activated: false, validityActivated: false },
  { id: 3, tenantName: '重庆东风南方渝发', rechargeNo: 'RC20250512002', status: '未支付', billingType: '坐席费+通话费', seatFeePackage: '半年套餐', periodDays: 183, rechargeAmount: 1000, validFrom: '-', validTo: '-', operator: 'xtadmin', bindTime: '2025-05-12 13:45:20', activated: false, validityActivated: false },
  { id: 4, tenantName: '东风日产-燃油车', rechargeNo: 'RC20260601001', status: '已支付', billingType: '坐席费+通话费', seatFeePackage: '全年套餐', periodDays: 365, rechargeAmount: 2000, validFrom: '2026-06-01', validTo: '2027-05-31', operator: 'xtadmin', bindTime: '2026-06-01 09:30:00', activated: true, validityActivated: true },
  { id: 5, tenantName: '重庆东风南方渝发', rechargeNo: 'RC20260606006', storeCode: 'CQ-YF-001', storeName: '重庆东风南方渝发店', status: '已支付', billingType: '仅坐席费', seatFeePackage: '半年套餐', periodDays: 183, rechargeAmount: 0, validFrom: '-', validTo: '-', operator: 'xtadmin', bindTime: '2026-06-06 10:15:00', activated: false, validityActivated: false },
  { id: 6, tenantName: '东风日产-燃油车', rechargeNo: 'RC20260609009', status: '已支付', billingType: '仅通话费', seatFeePackage: '-', periodDays: 0, rechargeAmount: 520, validFrom: '-', validTo: '-', operator: 'xtadmin', bindTime: '2026-06-09 11:20:00', activated: false, validityActivated: false },
  { id: 9, tenantName: '东风日产-燃油车', rechargeNo: 'RC-HQ-001', status: '已支付', billingType: '坐席费+通话费', seatFeePackage: '全年套餐', periodDays: 365, rechargeAmount: 999999999, validFrom: '2026-01-01', validTo: '2099-12-31', operator: 'xtadmin', bindTime: '2026-01-01 00:00:00', activated: true, validityActivated: true },
  { id: 10, tenantName: '东风日产-点检', rechargeNo: 'RC-HQ-002', status: '已支付', billingType: '坐席费+通话费', seatFeePackage: '全年套餐', periodDays: 365, rechargeAmount: 999999999, validFrom: '2026-01-01', validTo: '2099-12-31', operator: 'xtadmin', bindTime: '2026-01-01 00:00:00', activated: true, validityActivated: true },
  { id: 11, tenantName: '超级管理组', rechargeNo: 'RC-HQ-003', status: '已支付', billingType: '坐席费+通话费', seatFeePackage: '全年套餐', periodDays: 365, rechargeAmount: 999999999, validFrom: '2026-01-01', validTo: '2099-12-31', operator: 'xtadmin', bindTime: '2026-01-01 00:00:00', activated: true, validityActivated: true }
];

/* 手工扣减只形成租户资金调整流水，不关联充值单，不修改冻结任务。 */
var MockTenantBalanceAdjustments = [
  { id: 1, adjustmentNo: 'ADJ20260610001', tenantName: '东风日产-燃油车', type: 'MANUAL_DEDUCT', direction: 'OUT', amount: 100, reason: '线下业务处理后同步扣减余额', operator: 'xtadmin', status: '已生效', effectiveAt: '2026-06-10 16:20:00' }
];

var MockTenantFrozenTasks = [
  { id: 1, tenantName: '重庆东风南方渝发', modelType: '小模型', vendorCode: 'YIZHI', vendorName: '一知科技', taskNo: 'CALL20260605001', sceneName: '渝发店售前-冷线索激活', frozenMinutes: 1250, unitPriceSnapshot: 0.26, taskStatus: '进行中', status: '冻结中', createdAt: '2026-06-12 08:00:00', releasedAt: '', releaseReason: '' },
  { id: 2, tenantName: '东风日产-燃油车', modelType: '大模型', vendorCode: 'IFLYTEK', vendorName: '科大讯飞', taskNo: 'CALL20260603002', sceneName: '燃油车-冷线索', frozenMinutes: 1800, unitPriceSnapshot: 0.40, taskStatus: '进行中', status: '冻结中', createdAt: '2026-06-12 10:05:00', releasedAt: '', releaseReason: '' },
  { id: 3, tenantName: '重庆东风南方渝兴', modelType: '小模型', vendorCode: 'ZKJ', vendorName: '中科金', taskNo: 'CALL20260602001', sceneName: '渝兴店售后-流失招揽', frozenMinutes: 800, unitPriceSnapshot: 0.32, taskStatus: '已完成', status: '已释放', createdAt: '2026-06-02 15:12:00', releasedAt: '2026-06-02 16:08:00', releaseReason: '任务已完成' },
  { id: 4, tenantName: '重庆东风南方渝发', modelType: '大模型', vendorCode: 'YIZHI', vendorName: '一知科技', taskNo: 'CALL20260601003', sceneName: '渝发店售后-临保邀约', frozenMinutes: 300, unitPriceSnapshot: 0.35, taskStatus: '已完成', status: '已扣费', createdAt: '2026-06-01 11:30:00', releasedAt: '2026-06-01 12:10:00', releaseReason: '任务结算完成' },
  { id: 5, tenantName: '东风日产-燃油车', modelType: '小模型', vendorCode: 'BINGLAN', vendorName: '冰兰', taskNo: 'CALL20260610004', sceneName: '历史超时任务', frozenMinutes: 500, unitPriceSnapshot: 0.26, taskStatus: '进行中', status: '冻结中', createdAt: '2026-06-10 08:00:00', releasedAt: '', releaseReason: '' },
  { id: 6, tenantName: '东风日产-燃油车', modelType: '大模型', vendorCode: 'ZKJ', vendorName: '中科金', taskNo: 'CALL20260612005', sceneName: '已终止演示任务', frozenMinutes: 200, unitPriceSnapshot: 0.40, taskStatus: '已终止', status: '冻结中', createdAt: '2026-06-12 14:00:00', releasedAt: '', releaseReason: '' }
];

/* ===== 外呼拦截（黑名单）Mock ===== */
var MockBlockGroups = [
  { id: 'harass', name: '骚扰电话', desc: '客户明确投诉或拒绝后续外呼', expire: '永久', count: 0, platformBindings: [binding('电声', 'NISSAN_HARASS', 'DSG100238', '骚扰电话', '已同步', 3, '2026-07-17 10:32', '')] },
  { id: 'complaint', name: '投诉名单', desc: '投诉处理期间暂停一切外呼', expire: '30 天', count: 0, platformBindings: [binding('电声', 'NISSAN_COMPLAINT', 'DSG100241', '投诉名单', '同步异常', 1, '2026-07-17 09:18', '电声服务超时，请重新同步')] },
  { id: 'staff', name: '内部员工', desc: '员工及测试号码', expire: '永久', count: 0, platformBindings: [] }
];

var MockBlockRows = [
  { phone: '13988776655', name: '王女士', groupId: 'harass', addType: 'DECLINE', reason: '客户明确拒绝外呼', source: '手工新增', sourceType: 'MANUAL', creator: '张三', createdAt: '2026-07-17 09:42', effective: '永久', platformSync: { '电声': sync('已同步', '2026-07-17 09:42', '') } },
  { phone: '13422122345', name: '李先生', groupId: 'harass', addType: 'INTENT', reason: '意向保护期暂停外呼', source: '批量导入', sourceType: 'API', creator: '张三', createdAt: '2026-07-16 16:08', effective: '永久', platformSync: { '电声': sync('已同步', '2026-07-16 16:09', '') } },
  { phone: '13367676565', name: '', groupId: 'harass', addType: 'OTHER', reason: '骚扰电话', source: '接口同步', sourceType: 'API', creator: '系统', createdAt: '2026-07-15 11:20', effective: '永久', platformSync: { '电声': sync('已同步', '2026-07-15 11:21', '') } },
  { phone: '13567675454', name: '赵女士', groupId: 'complaint', addType: 'DECLINE', reason: '投诉处理中', source: '手工新增', sourceType: 'MANUAL', creator: '李四', createdAt: '2026-07-17 09:12', effective: '30 天', platformSync: { '电声': sync('同步失败', '2026-07-17 09:18', '电声服务超时') } },
  { phone: '13423344455', name: '', groupId: 'staff', addType: 'OTHER', reason: '内部测试号码', source: '手工新增', sourceType: 'MANUAL', creator: '王五', createdAt: '2026-07-10 14:30', effective: '永久', platformSync: {} }
];

function binding(platformCode, externalGroupCode, externalGroupId, externalGroupName, status, recordCount, lastSync, lastError) {
  return { platformCode: platformCode, externalGroupCode: externalGroupCode, externalGroupId: externalGroupId, externalGroupName: externalGroupName, status: status, recordCount: recordCount, lastSync: lastSync, lastError: lastError };
}
function sync(status, lastSync, lastError) { return { status: status, lastSync: lastSync, lastError: lastError }; }

/* ===== 标签管理 Mock 数据 ===== */

/* 供应商列表 */
var MockTagSuppliers = [
  { id: 'kdxf',    localCode: 'SUP-KDXF',  name: '科大讯飞', status: 'enabled' },
  { id: 'blvcp',   localCode: 'SUP-BLVCP', name: '冰兰-vcp', status: 'enabled' },
  { id: 'bl',      localCode: 'SUP-BL',    name: '冰兰',     status: 'enabled' },
  { id: 'yzzh',    localCode: 'SUP-YZZH',  name: '一知科技', status: 'enabled' },
  { id: 'zkj',     localCode: 'SUP-ZKJ',   name: '中科金',   status: 'enabled' }
];

/* 租户类型常量 */
var MockTenantTypes = [
  { id: 'store',        name: '门店租户' },
  { id: 'headquarters', name: '总部租户' }
];

/* 场景列表 */
var MockTagScenes = [
  { id: 'db',  localCode: 'SCN-DB',  name: '督办',   status: 'enabled' },
  { id: 'fw',  localCode: 'SCN-FW',  name: '服务',   status: 'enabled' },
  { id: 'hf',  localCode: 'SCN-HF',  name: '回访',   status: 'enabled' },
  { id: 'xxs', localCode: 'SCN-XXS', name: '新线索', status: 'enabled' },
  { id: 'lxs', localCode: 'SCN-LXS', name: '冷线索', status: 'enabled' }
];

/* 各供应商标签池 */
var MockSupplierTagPool = {
  'kdxf': [
    { id: 'kdxf_1', localCode: 'TAG-KDXF-001', name: 'A-高意向',       sort: 1,  platformTagId: null },
    { id: 'kdxf_2', localCode: 'TAG-KDXF-002', name: 'B-意向客户',     sort: 2,  platformTagId: null },
    { id: 'kdxf_3', localCode: 'TAG-KDXF-003', name: 'C-潜在客户',     sort: 3,  platformTagId: null },
    { id: 'kdxf_4', localCode: 'TAG-KDXF-004', name: 'D-无意向',       sort: 4,  platformTagId: null },
    { id: 'kdxf_5', localCode: 'TAG-KDXF-005', name: 'E-需再次跟进',   sort: 5,  platformTagId: null },
    { id: 'kdxf_6', localCode: 'TAG-KDXF-006', name: 'F-号码无效',     sort: 6,  platformTagId: null },
    { id: 'kdxf_7', localCode: 'TAG-KDXF-007', name: 'G-空号/停机',    sort: 7,  platformTagId: null },
    { id: 'kdxf_8', localCode: 'TAG-KDXF-008', name: 'H-其他',         sort: 8,  platformTagId: null }
  ],
  'blvcp': [
    { id: 'blvcp_1', localCode: 'TAG-BLVCP-001', name: '高意向-近期成交',  sort: 1,  platformTagId: null },
    { id: 'blvcp_2', localCode: 'TAG-BLVCP-002', name: '中意向-考虑中',    sort: 2,  platformTagId: null },
    { id: 'blvcp_3', localCode: 'TAG-BLVCP-003', name: '一般意向',        sort: 3,  platformTagId: null },
    { id: 'blvcp_4', localCode: 'TAG-BLVCP-004', name: '低意向-暂不需要',  sort: 4,  platformTagId: null },
    { id: 'blvcp_5', localCode: 'TAG-BLVCP-005', name: '已成交',          sort: 5,  platformTagId: null },
    { id: 'blvcp_6', localCode: 'TAG-BLVCP-006', name: '无效号码',        sort: 6,  platformTagId: null },
    { id: 'blvcp_7', localCode: 'TAG-BLVCP-007', name: '空号',            sort: 7,  platformTagId: null },
    { id: 'blvcp_8', localCode: 'TAG-BLVCP-008', name: '拒接',            sort: 8,  platformTagId: null },
    { id: 'blvcp_9', localCode: 'TAG-BLVCP-009', name: '忙线/未接通',     sort: 9,  platformTagId: null },
    { id: 'blvcp_10', localCode: 'TAG-BLVCP-010', name: '需回访',         sort: 10, platformTagId: null }
  ],
  'bl': [
    { id: 'bl_1',  localCode: 'TAG-BL-001', name: 'S级-超高意向',    sort: 1,  platformTagId: null },
    { id: 'bl_2',  localCode: 'TAG-BL-002', name: 'A级-高意向',      sort: 2,  platformTagId: null },
    { id: 'bl_3',  localCode: 'TAG-BL-003', name: 'B级-中高意向',    sort: 3,  platformTagId: null },
    { id: 'bl_4',  localCode: 'TAG-BL-004', name: 'C级-中等意向',    sort: 4,  platformTagId: null },
    { id: 'bl_5',  localCode: 'TAG-BL-005', name: 'D级-一般意向',    sort: 5,  platformTagId: null },
    { id: 'bl_6',  localCode: 'TAG-BL-006', name: 'E级-低意向',      sort: 6,  platformTagId: null },
    { id: 'bl_7',  localCode: 'TAG-BL-007', name: 'F级-无意向',      sort: 7,  platformTagId: null },
    { id: 'bl_8',  localCode: 'TAG-BL-008', name: '已成交-待回访',   sort: 8,  platformTagId: null },
    { id: 'bl_9',  localCode: 'TAG-BL-009', name: '号码无效',        sort: 9,  platformTagId: null },
    { id: 'bl_10', localCode: 'TAG-BL-010', name: '空号',            sort: 10, platformTagId: null },
    { id: 'bl_11', localCode: 'TAG-BL-011', name: '停机',            sort: 11, platformTagId: null },
    { id: 'bl_12', localCode: 'TAG-BL-012', name: '其他无效',        sort: 12, platformTagId: null }
  ],
  'yzzh': [
    { id: 'yzzh_1', localCode: 'TAG-YZZH-001', name: '意向强烈',       sort: 1,  platformTagId: null },
    { id: 'yzzh_2', localCode: 'TAG-YZZH-002', name: '有意向',         sort: 2,  platformTagId: null },
    { id: 'yzzh_3', localCode: 'TAG-YZZH-003', name: '待跟进',         sort: 3,  platformTagId: null },
    { id: 'yzzh_4', localCode: 'TAG-YZZH-004', name: '无意向',         sort: 4,  platformTagId: null },
    { id: 'yzzh_5', localCode: 'TAG-YZZH-005', name: '已成交',         sort: 5,  platformTagId: null },
    { id: 'yzzh_6', localCode: 'TAG-YZZH-006', name: '无效客户',       sort: 6,  platformTagId: null },
    { id: 'yzzh_7', localCode: 'TAG-YZZH-007', name: '号码异常',       sort: 7,  platformTagId: null },
    { id: 'yzzh_8', localCode: 'TAG-YZZH-008', name: '投诉/敏感',      sort: 8,  platformTagId: null },
    { id: 'yzzh_9', localCode: 'TAG-YZZH-009', name: '需人工复核',     sort: 9,  platformTagId: null }
  ],
  'zkj': [
    { id: 'zkj_1', localCode: 'TAG-ZKJ-001', name: '高意向',          sort: 1,  platformTagId: null },
    { id: 'zkj_2', localCode: 'TAG-ZKJ-002', name: '中意向',          sort: 2,  platformTagId: null },
    { id: 'zkj_3', localCode: 'TAG-ZKJ-003', name: '低意向',          sort: 3,  platformTagId: null },
    { id: 'zkj_4', localCode: 'TAG-ZKJ-004', name: '无意向',          sort: 4,  platformTagId: null },
    { id: 'zkj_5', localCode: 'TAG-ZKJ-005', name: '非本人',          sort: 5,  platformTagId: null },
    { id: 'zkj_6', localCode: 'TAG-ZKJ-006', name: '无效号码',        sort: 6,  platformTagId: null }
  ]
};

/* 配置单元：key = "supplierId_tenantType_sceneId" → enabledTagIds[] */
var MockTagConfigs = {
  // ===== 科大讯飞 =====
  'kdxf_store_db':  { enabledTagIds: ['kdxf_1','kdxf_2','kdxf_3','kdxf_4','kdxf_5'] },
  'kdxf_store_fw':  { enabledTagIds: ['kdxf_1','kdxf_2','kdxf_3','kdxf_4','kdxf_5','kdxf_6'] },
  'kdxf_store_hf':  { enabledTagIds: ['kdxf_1','kdxf_2','kdxf_3','kdxf_4','kdxf_5','kdxf_6','kdxf_7','kdxf_8'] },
  'kdxf_store_xxs': { enabledTagIds: ['kdxf_1','kdxf_2','kdxf_3','kdxf_4'] },
  'kdxf_store_lxs': { enabledTagIds: ['kdxf_2','kdxf_3','kdxf_4','kdxf_5'] },
  'kdxf_headquarters_db':  { enabledTagIds: ['kdxf_1','kdxf_2','kdxf_3','kdxf_4','kdxf_5','kdxf_6','kdxf_7','kdxf_8'] },
  'kdxf_headquarters_hf':  { enabledTagIds: ['kdxf_1','kdxf_2','kdxf_3','kdxf_4','kdxf_5','kdxf_6','kdxf_7','kdxf_8'] },
  'kdxf_headquarters_xxs': { enabledTagIds: ['kdxf_1','kdxf_2','kdxf_3','kdxf_4','kdxf_5','kdxf_6'] },

  // ===== 冰兰-vcp =====
  'blvcp_store_db':  { enabledTagIds: ['blvcp_1','blvcp_2','blvcp_3','blvcp_4','blvcp_5','blvcp_6'] },
  'blvcp_store_fw':  { enabledTagIds: ['blvcp_1','blvcp_2','blvcp_3','blvcp_4','blvcp_5','blvcp_6','blvcp_7','blvcp_8'] },
  'blvcp_store_hf':  { enabledTagIds: ['blvcp_1','blvcp_2','blvcp_3','blvcp_4','blvcp_5','blvcp_6','blvcp_7','blvcp_8','blvcp_9','blvcp_10'] },
  'blvcp_headquarters_db':  { enabledTagIds: ['blvcp_1','blvcp_2','blvcp_3','blvcp_4','blvcp_5','blvcp_6','blvcp_7','blvcp_8','blvcp_9','blvcp_10'] },
  'blvcp_headquarters_xxs': { enabledTagIds: ['blvcp_1','blvcp_2','blvcp_3','blvcp_4'] },
  'blvcp_headquarters_lxs': { enabledTagIds: ['blvcp_2','blvcp_3','blvcp_4','blvcp_5'] },

  // ===== 冰兰 =====
  'bl_store_db':  { enabledTagIds: ['bl_1','bl_2','bl_3','bl_4','bl_5','bl_6','bl_7','bl_8'] },
  'bl_store_hf':  { enabledTagIds: ['bl_1','bl_2','bl_3','bl_4','bl_5','bl_6','bl_7','bl_8','bl_9','bl_10','bl_11','bl_12'] },
  'bl_store_xxs': { enabledTagIds: ['bl_1','bl_2','bl_3','bl_4','bl_5'] },
  'bl_headquarters_db':  { enabledTagIds: ['bl_1','bl_2','bl_3','bl_4','bl_5','bl_6','bl_7','bl_8','bl_9','bl_10','bl_11','bl_12'] },
  'bl_headquarters_fw':  { enabledTagIds: ['bl_1','bl_2','bl_3','bl_4','bl_5','bl_6','bl_7','bl_8'] },
  'bl_headquarters_lxs': { enabledTagIds: ['bl_2','bl_3','bl_4','bl_5','bl_6'] },

  // ===== 一知科技 =====
  'yzzh_store_db':  { enabledTagIds: ['yzzh_1','yzzh_2','yzzh_3','yzzh_4','yzzh_5'] },
  'yzzh_store_fw':  { enabledTagIds: ['yzzh_1','yzzh_2','yzzh_3','yzzh_4','yzzh_5','yzzh_6','yzzh_7'] },
  'yzzh_store_hf':  { enabledTagIds: ['yzzh_1','yzzh_2','yzzh_3','yzzh_4','yzzh_5','yzzh_6','yzzh_7','yzzh_8','yzzh_9'] },
  'yzzh_headquarters_db':  { enabledTagIds: ['yzzh_1','yzzh_2','yzzh_3','yzzh_4','yzzh_5','yzzh_6','yzzh_7','yzzh_8','yzzh_9'] },
  'yzzh_headquarters_xxs': { enabledTagIds: ['yzzh_1','yzzh_2','yzzh_3','yzzh_4'] },

  // ===== 中科金 =====
  'zkj_store_db':  { enabledTagIds: ['zkj_1','zkj_2','zkj_3','zkj_4'] },
  'zkj_store_hf':  { enabledTagIds: ['zkj_1','zkj_2','zkj_3','zkj_4','zkj_5','zkj_6'] },
  'zkj_store_xxs': { enabledTagIds: ['zkj_1','zkj_2','zkj_3'] },
  'zkj_headquarters_db':  { enabledTagIds: ['zkj_1','zkj_2','zkj_3','zkj_4','zkj_5','zkj_6'] },
  'zkj_headquarters_hf':  { enabledTagIds: ['zkj_1','zkj_2','zkj_3','zkj_4','zkj_5','zkj_6'] },
  'zkj_headquarters_xxs': { enabledTagIds: ['zkj_1','zkj_2','zkj_3','zkj_4'] }
};

/* 本地标准标签集：key = "tenantType_sceneId"。供应商标签最终映射到这里的唯一标签。 */
var MockLocalTagSets = {
  'store_db': [
    { id: 'local_store_db_1', localCode: 'LOCAL-STORE-DB-001', name: '高优先级', sort: 1 },
    { id: 'local_store_db_2', localCode: 'LOCAL-STORE-DB-002', name: '中优先级', sort: 2 },
    { id: 'local_store_db_3', localCode: 'LOCAL-STORE-DB-003', name: '低优先级', sort: 3 },
    { id: 'local_store_db_4', localCode: 'LOCAL-STORE-DB-004', name: '无需处理', sort: 4 },
    { id: 'local_store_db_5', localCode: 'LOCAL-STORE-DB-005', name: '无效客户', sort: 5 }
  ],
  'store_fw': [
    { id: 'local_store_fw_1', localCode: 'LOCAL-STORE-FW-001', name: '服务满意', sort: 1 },
    { id: 'local_store_fw_2', localCode: 'LOCAL-STORE-FW-002', name: '需跟进', sort: 2 },
    { id: 'local_store_fw_3', localCode: 'LOCAL-STORE-FW-003', name: '投诉风险', sort: 3 },
    { id: 'local_store_fw_4', localCode: 'LOCAL-STORE-FW-004', name: '无效客户', sort: 4 }
  ],
  'store_hf': [
    { id: 'local_store_hf_1', localCode: 'LOCAL-STORE-HF-001', name: '已确认', sort: 1 },
    { id: 'local_store_hf_2', localCode: 'LOCAL-STORE-HF-002', name: '待二次回访', sort: 2 },
    { id: 'local_store_hf_3', localCode: 'LOCAL-STORE-HF-003', name: '无意向', sort: 3 },
    { id: 'local_store_hf_4', localCode: 'LOCAL-STORE-HF-004', name: '无效客户', sort: 4 }
  ],
  'store_xxs': [
    { id: 'local_store_xxs_1', localCode: 'LOCAL-STORE-XXS-001', name: '高意向', sort: 1 },
    { id: 'local_store_xxs_2', localCode: 'LOCAL-STORE-XXS-002', name: '中意向', sort: 2 },
    { id: 'local_store_xxs_3', localCode: 'LOCAL-STORE-XXS-003', name: '低意向', sort: 3 },
    { id: 'local_store_xxs_4', localCode: 'LOCAL-STORE-XXS-004', name: '无意向', sort: 4 },
    { id: 'local_store_xxs_5', localCode: 'LOCAL-STORE-XXS-005', name: '无效客户', sort: 5 }
  ],
  'store_lxs': [
    { id: 'local_store_lxs_1', localCode: 'LOCAL-STORE-LXS-001', name: '可激活', sort: 1 },
    { id: 'local_store_lxs_2', localCode: 'LOCAL-STORE-LXS-002', name: '需培育', sort: 2 },
    { id: 'local_store_lxs_3', localCode: 'LOCAL-STORE-LXS-003', name: '无意向', sort: 3 },
    { id: 'local_store_lxs_4', localCode: 'LOCAL-STORE-LXS-004', name: '无效客户', sort: 4 }
  ],
  'headquarters_db': [
    { id: 'local_headquarters_db_1', localCode: 'LOCAL-HQ-DB-001', name: '总部重点跟进', sort: 1 },
    { id: 'local_headquarters_db_2', localCode: 'LOCAL-HQ-DB-002', name: '区域协同', sort: 2 },
    { id: 'local_headquarters_db_3', localCode: 'LOCAL-HQ-DB-003', name: '门店自处理', sort: 3 },
    { id: 'local_headquarters_db_4', localCode: 'LOCAL-HQ-DB-004', name: '无效客户', sort: 4 }
  ],
  'headquarters_fw': [
    { id: 'local_headquarters_fw_1', localCode: 'LOCAL-HQ-FW-001', name: '服务达标', sort: 1 },
    { id: 'local_headquarters_fw_2', localCode: 'LOCAL-HQ-FW-002', name: '服务预警', sort: 2 },
    { id: 'local_headquarters_fw_3', localCode: 'LOCAL-HQ-FW-003', name: '投诉风险', sort: 3 },
    { id: 'local_headquarters_fw_4', localCode: 'LOCAL-HQ-FW-004', name: '无效客户', sort: 4 }
  ],
  'headquarters_hf': [
    { id: 'local_headquarters_hf_1', localCode: 'LOCAL-HQ-HF-001', name: '已完成', sort: 1 },
    { id: 'local_headquarters_hf_2', localCode: 'LOCAL-HQ-HF-002', name: '需复访', sort: 2 },
    { id: 'local_headquarters_hf_3', localCode: 'LOCAL-HQ-HF-003', name: '无意向', sort: 3 },
    { id: 'local_headquarters_hf_4', localCode: 'LOCAL-HQ-HF-004', name: '无效客户', sort: 4 }
  ],
  'headquarters_xxs': [
    { id: 'local_headquarters_xxs_1', localCode: 'LOCAL-HQ-XXS-001', name: '高意向', sort: 1 },
    { id: 'local_headquarters_xxs_2', localCode: 'LOCAL-HQ-XXS-002', name: '中意向', sort: 2 },
    { id: 'local_headquarters_xxs_3', localCode: 'LOCAL-HQ-XXS-003', name: '低意向', sort: 3 },
    { id: 'local_headquarters_xxs_4', localCode: 'LOCAL-HQ-XXS-004', name: '无意向', sort: 4 },
    { id: 'local_headquarters_xxs_5', localCode: 'LOCAL-HQ-XXS-005', name: '无效客户', sort: 5 }
  ],
  'headquarters_lxs': [
    { id: 'local_headquarters_lxs_1', localCode: 'LOCAL-HQ-LXS-001', name: '可激活', sort: 1 },
    { id: 'local_headquarters_lxs_2', localCode: 'LOCAL-HQ-LXS-002', name: '需培育', sort: 2 },
    { id: 'local_headquarters_lxs_3', localCode: 'LOCAL-HQ-LXS-003', name: '无意向', sort: 3 },
    { id: 'local_headquarters_lxs_4', localCode: 'LOCAL-HQ-LXS-004', name: '无效客户', sort: 4 }
  ]
};

/* 供应商标签到本地标准标签映射：key = "supplierId_tenantType_sceneId"。 */
var MockSupplierLocalTagMappings = {};

/*
 * 工具函数：获取指定组合的标签配置
 * 参数：supplierId, tenantType('store'|'headquarters'), sceneId
 * 返回：{ tags: [...], configExists: bool, enabledTagIds: [...] }
 */
function getTagConfig(supplierId, tenantType, sceneId) {
  var key = supplierId + '_' + tenantType + '_' + sceneId;
  var config = MockTagConfigs[key];
  var pool = MockSupplierTagPool[supplierId] || [];
  if (config) {
    var enabledSet = {};
    config.enabledTagIds.forEach(function(tid) { enabledSet[tid] = true; });
    return {
      tags: pool,
      configExists: true,
      enabledTagIds: config.enabledTagIds.slice(),
      enabledSet: enabledSet
    };
  }
  return {
    tags: pool,
    configExists: false,
    enabledTagIds: [],
    enabledSet: {}
  };
}

/* ===== 业务场景 Mock ===== */
var MockSceneRows = [
  { id: 1, name: '燃油车新线索-一知', sceneId: '2021498427234983938', code: 'AI-XXY', category: '新线索', tenant: '东风日产-燃油车', platform: '一知科技', updater: '-', updateTime: '2026-05-19 08:30:10', status: 'running' },
  { id: 2, name: 'NEV-留资未满-N6推荐', sceneId: '2048744508251602945', code: 'NEV-LZWM-N6', category: '冷线索', tenant: '东风日产-燃油车', platform: '一知科技', updater: '-', updateTime: '2026-05-19 08:30:10' },
  { id: 3, name: 'NEV-留资未满-N7推荐', sceneId: '2048741810617876481', code: 'NEV-LZWM-N7', category: '冷线索', tenant: '东风日产-燃油车', platform: '一知科技', updater: '-', updateTime: '2026-05-19 08:30:10' },
  { id: 4, name: 'NEV-留资未满-天籁推荐', sceneId: '2048742457857703938', code: 'NEV-LZWM-TL', category: '冷线索', tenant: '东风日产-燃油车', platform: '一知科技', updater: '-', updateTime: '2026-05-19 08:30:10' },
  { id: 5, name: 'DCC-一知-N7冷线索', sceneId: '2027729970601218049', code: 'DCC-YZ-N7-LXS', category: '冷线索', tenant: '东风日产-燃油车', platform: '一知科技', updater: '-', updateTime: '2026-05-19 08:30:10' },
  { id: 6, name: '燃油车新线索-中科金', sceneId: 'ZKJ20260601001', code: 'ZKJ-XXY', category: '新线索', tenant: '东风日产-燃油车', platform: '中科金智能', updater: '-', updateTime: '2026-06-01 09:15:00' },
  { id: 7, name: 'NEV-冷线索-中科金', sceneId: 'ZKJ20260602002', code: 'ZKJ-LXS', category: '冷线索', tenant: '东风日产-燃油车', platform: '中科金智能', updater: '-', updateTime: '2026-06-02 10:30:00' },
  { id: 8, name: 'DCC-中科金-N7冷线索', sceneId: 'ZKJ20260603003', code: 'ZKJ-DCC-N7', category: '冷线索', tenant: '东风日产-燃油车', platform: '中科金智能', updater: '-', updateTime: '2026-06-03 14:00:00' },
  { id: 9, name: '东风日产-新线索-电声', sceneId: 'DS-SCENE-001', code: 'DS-XXY', category: '新线索', tenant: '东风日产-燃油车', platform: '电声', updater: '-', updateTime: '2026-07-15 09:00:00', strategyCode: 'NISSAN_NEW_LEAD_001', robotName: '东风日产新线索机器人' },
  {
    id: 10, name: '华东店-冷线索跟进-大众通信',
    sceneId: '9f6d9a40-2fb3-4c56-8b21-202607140017', taskUuid: '9f6d9a40-2fb3-4c56-8b21-202607140017',
    code: 'DZ-LXS', category: '冷线索', tenant: '东风日产-燃油车', platform: '大众通信', modelType: '大模型',
    updater: '-', updateTime: '2026-07-14 08:30:00',
    redialEnabled: true, redialMode: 'scheduled',
    scheduledRedialTimes: 2,
    scheduledConfigConfirmed: true, taskRedialRiskAccepted: false,
    redialConfirmedBy: '管理员', redialConfirmedAt: '2026-09-02 15:30:00'
  },
  { id: 11, name: '燃油车新线索-冰兰', sceneId: 'BL-SCENE-001', code: 'BL-XXY', category: '新线索', tenant: '东风日产-燃油车', platform: '冰兰', updater: '-', updateTime: '2026-07-16 09:00:00' },
  { id: 12, name: '厚朴-新线索首访', sceneId: 'HP-SCENE-001', code: 'HP-XXY', category: '新线索', tenant: '东风日产-燃油车', platform: '厚朴', modelType: '大模型', updater: '-', updateTime: '2026-07-17 09:00:00', taskName: 'HP-DEMO-新线索首访', taskId: 'HP-TASK-20260714-001', batchId: 'HP-BATCH-20260714-0001', taskStatus: 1, botId: 'bot_hp_nissan_001', taskType: 'streaming', schedule: { startTime: '09:00', endTime: '18:00' }, concurrency: 50, redial: true, uncalledFirst: true, templateId: 'TPL-HP-XXS-001', callbackConfigured: true },
  { id: 13, name: '厚朴-保客回访', sceneId: 'HP-SCENE-002', code: 'HP-BKHF', category: '回访', tenant: '东风日产-燃油车', platform: '厚朴', modelType: '大模型', updater: '-', updateTime: '2026-07-13 14:05:00', taskName: 'HP-DEMO-保客回访', taskId: 'HP-TASK-20260713-001', batchId: 'HP-BATCH-20260713-0003', taskStatus: 4, botId: 'bot_hp_nissan_002', taskType: 'same_day', schedule: null, concurrency: 30, redial: true, uncalledFirst: false, templateId: 'TPL-HP-BKHF-002', callbackConfigured: true },
  { id: 14, name: '厚朴-流失预警', sceneId: 'HP-SCENE-003', code: 'HP-LSYJ', category: '流失预警', tenant: '东风日产-燃油车', platform: '厚朴', modelType: '大模型', updater: '-', updateTime: '2026-07-15 10:00:00', taskName: 'HP-DEMO-流失预警', taskId: 'HP-TASK-20260715-001', batchId: 'HP-BATCH-20260715-0002', taskStatus: 6, botId: 'bot_hp_nissan_003', taskType: 'streaming', schedule: { startTime: '09:00', endTime: '19:00' }, concurrency: 60, redial: false, uncalledFirst: true, templateId: 'TPL-HP-LSYJ-003', callbackConfigured: true }
];

var MockTenantOptions = ['东风日产-燃油车', '东风日产-点检', '重庆东风南方渝兴', '重庆东风南方渝发', '超级管理组'];
var MockModelTypes = ['大模型', '小模型'];

/* ===== 厚朴服务端默认账号与任务查询 Mock =====
 * 演示环境使用服务端默认账号；凭据与令牌不进入浏览器。
 * MockHoupuRemoteTasks 模拟每次打开页面或主动查询时的厚朴 tasklist 接口返回。
 */
var MockHoupuAccounts = [
  { id: 'HP-DEFAULT-001', name: '厚朴默认账号', scope: '当前演示环境', isDefault: true, enabled: true }
];

var MockHoupuRemoteTasks = [
  { taskId: 'HP-TASK-20260714-001', accountId: 'HP-DEFAULT-001', taskName: 'HP-DEMO-新线索首访', taskType: 'streaming', botId: 'bot_hp_nissan_001', schedule: { startTime: '09:00', endTime: '18:00' }, concurrency: 50, redial: true, redialText: '未接通间隔 30 分钟重呼，最多 2 次；已接通不重呼', uncalledFirst: true, templateId: 'TPL-HP-XXS-001', callbackConfigured: true, taskStatus: 1, taskStatusName: '执行中' },
  { taskId: 'HP-TASK-20260713-001', accountId: 'HP-DEFAULT-001', taskName: 'HP-DEMO-保客回访', taskType: 'same_day', botId: 'bot_hp_nissan_002', schedule: null, concurrency: 30, redial: true, redialText: '未接通间隔 60 分钟重呼，最多 1 次', uncalledFirst: false, templateId: 'TPL-HP-BKHF-002', callbackConfigured: true, taskStatus: 4, taskStatusName: '任务异常' },
  { taskId: 'HP-TASK-20260715-001', accountId: 'HP-DEFAULT-001', taskName: 'HP-DEMO-流失预警', taskType: 'streaming', botId: 'bot_hp_nissan_003', schedule: { startTime: '09:00', endTime: '19:00' }, concurrency: 60, redial: false, redialText: '不重呼', uncalledFirst: true, templateId: 'TPL-HP-LSYJ-003', callbackConfigured: true, taskStatus: 6, taskStatusName: '禁呼中' },
  { taskId: 'HP-TASK-20260828-004', accountId: 'HP-DEFAULT-001', taskName: 'HP-DEMO-售后满意度回访', taskType: 'streaming', botId: 'bot_hp_nissan_002', schedule: { startTime: '10:00', endTime: '18:30' }, concurrency: 20, redial: true, redialText: '未接通间隔 60 分钟重呼，最多 1 次', uncalledFirst: true, templateId: 'TPL-HP-BKHF-002', callbackConfigured: true, taskStatus: 0, taskStatusName: '未开始' }
];

/* ===== 业务场景创建抽屉 Mock（对齐各平台参考源） ===== */

/* 场景类型枚举（中科金底座） */
var MockSceneTypeOptions = ['首访', '服务', '回访', '新线索', '冷线索'];
/* 数据导入方式（默认版 / 冰兰版） */
var MockImportTypeOptions = ['手动导入', '自动传入'];
var MockBinglanImportTypeOptions = ['手动导入', '接口传入'];

/* 一知科技：场景传入信息默认 7 字段（不可删除） */
var MockDefaultInputFields = [
  { id: 1, fieldName: '客户名字', paramName: 'customerName', required: true, canDelete: false },
  { id: 2, fieldName: '客户所在地', paramName: 'city', required: true, canDelete: false },
  { id: 3, fieldName: '意向车型', paramName: 'intentModel', required: true, canDelete: false },
  { id: 4, fieldName: '意向车系', paramName: 'intentSeries', required: true, canDelete: false },
  { id: 5, fieldName: '来源渠道', paramName: 'channel', required: true, canDelete: false },
  { id: 6, fieldName: '创建时间', paramName: 'createTime', required: true, canDelete: false },
  { id: 7, fieldName: '截止时间', paramName: 'deadline', required: true, canDelete: false }
];

/* 一知账号列表 */
var MockYizhiAccounts = [
  { id: 'acc-001', name: '一知账号-渝兴店' },
  { id: 'acc-002', name: '一知账号-渝发店' },
  { id: 'acc-003', name: '一知账号-海鹰店' },
  { id: 'acc-004', name: '一知账号-默认账号' }
];

/* 冰兰：呼叫通道 / 线路 / 机器人候选 */
var MockBinglanChannels = [
  { value: 'lianyou_vcp', label: '联友 VCP' },
  { value: 'binglan_channel', label: '冰兰外呼通道' }
];
var MockBinglanLines = [
  { id: '000001', name: '一知线路' }
];
var MockBinglanRobots = [
  { id: '0000001', name: '东风日产冷线索激活' }
];
/* 冰兰：场景传入信息默认字段（冰兰外呼通道时预填） */
var MockBinglanInputDefaults = [
  { fieldName: '客户名字', paramName: 'customerName', required: false },
  { fieldName: '客户所在地', paramName: 'city', required: false },
  { fieldName: '意向车型', paramName: 'intentModel', required: false },
  { fieldName: '意向车系', paramName: 'intentSeries', required: true },
  { fieldName: '来源渠道', paramName: 'channel', required: true },
  { fieldName: '创建时间', paramName: 'createTime', required: true },
  { fieldName: '截止时间', paramName: 'deadline', required: true }
];

/* 电声：场景类型 → 机器人映射 */
var MockDianshengRobotMappings = {
  NEW_LEAD: { sceneTypeName: '新线索', robotCode: 'robot_ds_nissan_001', robotName: '东风日产新线索机器人' },
  COLD_LEAD: { sceneTypeName: '冷线索', robotCode: 'robot_ds_nissan_002', robotName: '东风日产冷线索机器人' }
};
/* 电声：账号（按模型类型过滤） */
var MockDianshengAccounts = [
  { name: '电声账号 A', modelType: '大模型' },
  { name: '电声账号 B', modelType: '小模型' }
];
/* 电声：重呼间隔分钟数选项 */
/* 黑名单分组（电声/冰兰拦截下拉候选） */
var MockSceneBlacklistGroups = ['东风日产默认黑名单', '试驾退订黑名单'];

/* ===== 一知科技 外呼任务详情 Mock（对齐一知科技接入_v1.0） ===== */
var MockYizhiTaskDetail = {
  1: { taskCode: 'TASK-20260518-01', robotName: '一知智能AI销售助手-天籁专属版', createTime: '2026-05-18 09:00:00', callTimeWindow: '每天 09:00~11:30、14:00~18:30', redialConfig: '未接通间隔 30 分钟自动重拨，最多 2 次', modelType: '大模型', calledCount: 120, totalCount: 200, yizhiSceneId: 'yz-auto-8010', yizhiAccount: '一知账号-渝兴店' },
  2: { taskCode: 'TASK-20260518-02', robotName: '一知售后关怀客服', createTime: '2026-05-18 08:30:00', callTimeWindow: '每天 09:30~12:00、14:30~17:30', redialConfig: '未接通间隔 60 分钟重拨，最多 1 次', modelType: '小模型', calledCount: 320, totalCount: 500, yizhiSceneId: 'yz-auto-8020', yizhiAccount: '一知账号-渝兴店' },
  3: { taskCode: 'TASK-20260512-01', robotName: '一知线索激活助手', createTime: '2026-05-12 10:00:00', callTimeWindow: '每天 10:00~18:00', redialConfig: '不重拨', modelType: '大模型', calledCount: 1500, totalCount: 1500, yizhiSceneId: 'yz-auto-8030', yizhiAccount: '一知账号-渝发店' },
  4: { taskCode: 'TASK-20260512-02', robotName: '一知线索激活助手', createTime: '2026-05-12 10:30:00', callTimeWindow: '每天 09:00~18:00', redialConfig: '未接通间隔 45 分钟重拨 1 次', modelType: '大模型', calledCount: 150, totalCount: 300, yizhiSceneId: 'yz-auto-8030', yizhiAccount: '一知账号-渝兴店' },
  5: { taskCode: 'TASK-20260422-01', robotName: '一知NEV新能源专席', createTime: '2026-04-22 14:00:00', callTimeWindow: '每天 09:00~18:00', redialConfig: '未接通间隔 30 分钟自动重拨，最多 2 次', modelType: '大模型', calledCount: 0, totalCount: 100, yizhiSceneId: 'yz-auto-8040', yizhiAccount: '一知账号-默认账号' },
  6: { taskCode: 'TASK-20260422-02', robotName: '一知NEV新能源专席', createTime: '2026-04-22 14:30:00', callTimeWindow: '每天 09:00~17:00', redialConfig: '不重拨', modelType: '小模型', calledCount: 180, totalCount: 180, yizhiSceneId: 'yz-auto-8040', yizhiAccount: '一知账号-默认账号' },
  7: { taskCode: 'TASK-20260415-01', robotName: '一知智能AI销售助手-天籁专属版', createTime: '2026-04-15 11:00:00', callTimeWindow: '每天 09:00~18:00', redialConfig: '未接通不重拨', modelType: '大模型', calledCount: 8, totalCount: 10, yizhiSceneId: 'yz-auto-8050', yizhiAccount: '一知账号-默认账号' },
  8: { taskCode: 'TASK-20260415-02', robotName: '一知NEV新能源专席', createTime: '2026-04-15 09:30:00', callTimeWindow: '每天 09:00~18:00', redialConfig: '最多重拨 1 次', modelType: '大模型', calledCount: 1081, totalCount: 1200, yizhiSceneId: 'yz-auto-8040', yizhiAccount: '一知账号-渝兴店' },
  9: { taskCode: 'TASK-20260612-01', robotName: '一知智能AI销售助手', createTime: '2026-06-12 09:00:00', callTimeWindow: '每天 09:00~11:30、14:00~18:30', redialConfig: '未接通间隔 30 分钟自动重拨，最多 2 次', modelType: '大模型', calledCount: 75, totalCount: 120, yizhiSceneId: 'yz-auto-8010', yizhiAccount: '一知账号-渝兴店' },
  10: { taskCode: 'TASK-20260612-02', robotName: '一知售后关怀客服', createTime: '2026-06-12 08:30:00', callTimeWindow: '每天 09:30~12:00、14:30~17:30', redialConfig: '未接通间隔 60 分钟重拨，最多 1 次', modelType: '小模型', calledCount: 420, totalCount: 500, yizhiSceneId: 'yz-auto-8020', yizhiAccount: '一知账号-渝发店' },
  11: { taskCode: 'TASK-20260610-01', robotName: '一知智能AI销售助手', createTime: '2026-06-10 10:00:00', callTimeWindow: '每天 10:00~18:00', redialConfig: '不重拨', modelType: '大模型', calledCount: 200, totalCount: 200, yizhiSceneId: 'yz-auto-8010', yizhiAccount: '一知账号-海鹰店' },
  12: { taskCode: 'TASK-20260530-01', robotName: '一知售后关怀客服', createTime: '2026-05-30 14:00:00', callTimeWindow: '每天 09:00~18:00', redialConfig: '未接通间隔 45 分钟重拨 1 次', modelType: '小模型', calledCount: 1560, totalCount: 1560, yizhiSceneId: 'yz-auto-8020', yizhiAccount: '一知账号-渝发店' }
};

/* ===== 电声 外呼任务详情 Mock（对齐电声接入_demo_v1.0） ===== */
var MockDianshengTaskDetail = {
  20: {
    taskCode: 'job_ds_001_nissan_new', taskName: '东风日产-新线索-电声',
    strategyId: 10001, strategyCode: 'NISSAN_NEW_LEAD_001', strategyName: '东风日产新线索激活任务',
    sceneTypeName: '新线索', createdTime: '2026-07-02 08:30:00', updatedTime: '2026-07-02 08:30:00',
    leadTypeRobotMapping: { leadTypeCode: 'NEW_LEAD', leadTypeName: '新线索', robotCode: 'robot_ds_nissan_001' },
    callTimeWindow: { windows: [{ beginTime: '09:00', endTime: '11:30', weekdays: [1, 2, 3, 4, 5, 6, 7] }, { beginTime: '13:30', endTime: '17:30', weekdays: [1, 2, 3, 4, 5, 6, 7] }], excludeDates: [] },
    nDayMCallPolicy: { days: 3, maxAttempts: 3, intervalMinutes: [30, 60] },
    blacklistCheck: { enabled: true, blacklistGroupCode: 'nissan_default' },
    autoStart: { enabled: true }, remark: '日产新线索激活任务', robotId: 'robot_ds_nissan_001', robotName: '东风日产新线索机器人'
  },
  21: {
    taskCode: 'job_ds_002_nissan_cold', taskName: '东风日产-冷线索-电声',
    strategyId: 10002, strategyCode: 'NISSAN_COLD_LEAD_002', strategyName: '东风日产冷线索激活任务',
    sceneTypeName: '冷线索', createdTime: '2026-07-02 09:00:00', updatedTime: '2026-07-02 09:00:00',
    leadTypeRobotMapping: { leadTypeCode: 'COLD_LEAD', leadTypeName: '冷线索', robotCode: 'robot_ds_nissan_002' },
    callTimeWindow: { windows: [{ beginTime: '09:00', endTime: '12:00', weekdays: [1, 2, 3, 4, 5, 6, 7] }, { beginTime: '14:00', endTime: '18:00', weekdays: [1, 2, 3, 4, 5, 6, 7] }], excludeDates: ['2026-07-25', '2026-07-26'] },
    nDayMCallPolicy: { days: 3, maxAttempts: 4, intervalMinutes: [30, 60, 120] },
    blacklistCheck: { enabled: true, blacklistGroupCode: 'nissan_default' },
    autoStart: { enabled: true }, remark: '日产冷线索持续跟进任务', robotId: 'robot_ds_nissan_002', robotName: '东风日产冷线索机器人'
  }
};

/* ===== 冰兰 外呼任务详情 Mock（对齐冰兰接入_v1.0） ===== */
var MockBinglanTaskDetail = {
  22: {
    createTime: '2026年05月08日 15:15:37', robotName: '东风日产线索机器人', taskId: '1704345113275',
    taskDesc: '无', startMode: '自动', callWindow: '每天 09:00~21:30',
    riskCustom: '无', riskBlacklist: '默认分组',
    redialGroups: [
      { interval: 60, times: 1, conditions: '无应答、忙线中、拒接、关机、停机、无法接通、主叫欠费、外呼失败' },
      { interval: 30, times: 2, conditions: '空号' }
    ]
  },
  23: {
    createTime: '2026年04月26日 10:08:12', robotName: '东风日产保客关怀机器人', taskId: '1703228099541',
    taskDesc: '保客回访任务', startMode: '手动', callWindow: '每天 09:00~19:00',
    riskCustom: '无', riskBlacklist: '默认分组',
    redialGroups: [
      { interval: 60, times: 1, conditions: '无应答、忙线中、拒接' }
    ]
  }
};

/* ===== 数据概览 Mock（分平台对齐 releases_demo 六个接入原型） ===== */
var MockDataOverview = {
  /* 外呼数据卡片：中科金/冰兰/厚朴/电声/大众通信统一写死口径（对齐各接入 demo） */
  baselineStats: { imported: 6, called: 1, totalCalls: 2, filtered: 5, filteredRate: '83.33%', answered: 0, answerRate: '0%', avgDuration: 0 },
  /* 意向数据设置（分平台：default=中科金/冰兰/厚朴，diansheng=电声，dazhong=大众通信，yizhi=一知科技） */
  intentProfiles: {
    default: {
      levels: [
        { label: '意向等级1', tags: ['A (高意向)'] },
        { label: '意向等级2', tags: ['B (潜在)'] },
        { label: '意向等级3', tags: ['A (高意向)'] }
      ],
      options: ['A (高意向)', 'B (潜在)', 'C (一般)', 'D (忙碌/敷衍)', 'E (拒绝/无效/无应答)'],
      fallbacks: ['A (高意向)', 'B (潜在)'],
      titleFormat: 'default'
    },
    diansheng: {
      levels: [
        { label: '意向等级1', tags: ['A（高意向）'] },
        { label: '意向等级2', tags: ['B（中意向）'] },
        { label: '意向等级3', tags: ['C（低意向）'] }
      ],
      options: ['A（高意向）', 'B（中意向）', 'C（低意向）', 'D（无意向）'],
      fallbacks: ['A（高意向）', 'B（中意向）'],
      titleFormat: 'default'
    },
    dazhong: {
      levels: [
        { label: '意向等级1', tags: ['A-高意向'] },
        { label: '意向等级2', tags: ['B-意向客户'] },
        { label: '意向等级3', tags: ['C-潜在客户'] }
      ],
      options: ['A-高意向', 'B-意向客户', 'C-潜在客户', 'D-一般意向', 'E-需再次跟进', 'F-号码无效'],
      fallbacks: ['A-高意向', 'B-意向客户'],
      titleFormat: 'dazhong'
    },
    yizhi: {
      levels: [
        { label: '意向等级1', tags: ['A (高意向)'] },
        { label: '意向等级2', tags: ['B (意向客户)'] },
        { label: '意向等级3', tags: ['C (潜在客户)'] }
      ],
      options: ['A (高意向)', 'B (意向客户)', 'C (潜在客户)', 'D (一般意向)'],
      fallbacks: ['A (高意向)', 'B (意向客户)'],
      titleFormat: 'default',
      dynamic: true
    }
  },
  /* 意向洞察环形图（分平台文案；diansheng 附加 ringCls 专属渐变） */
  donuts: {
    default: [
      { cls: 'label-a', text: 'A(高意向): 1.65%' },
      { cls: 'label-b', text: 'B(低意向): 2.48%' },
      { cls: 'label-c', text: 'C(意向待定): 5.73%' },
      { cls: 'label-d', text: 'D(无意向): 31.34%' },
      { cls: 'label-e', text: 'E(未接通): 54.42%' },
      { cls: 'label-f', text: 'F(停机/空号): 4.38%' }
    ],
    diansheng: [
      { cls: 'label-a', text: 'A（高意向）：8.33%' },
      { cls: 'label-b', text: 'B（中意向）：16.67%' },
      { cls: 'label-c', text: 'C（低意向）：25%' },
      { cls: 'label-d', text: 'D（无意向）：50%' }
    ],
    dazhong: [
      { cls: 'label-a', text: 'A-高意向：1.65%' },
      { cls: 'label-b', text: 'B-意向客户：2.48%' },
      { cls: 'label-c', text: 'C-潜在客户：5.73%' },
      { cls: 'label-d', text: 'D-一般意向：31.34%' },
      { cls: 'label-e', text: 'E-需再次跟进：54.42%' },
      { cls: 'label-f', text: 'F-号码无效：4.38%' }
    ],
    yizhi: [
      { cls: 'label-a', text: 'A(有购车计划): 6.84%' },
      { cls: 'label-b', text: 'B(无购车计划): 13.94%' },
      { cls: 'label-c', text: 'C(待筛选): 12.56%' },
      { cls: 'label-d', text: 'D(不同意加微信): 1.09%' },
      { cls: 'label-e', text: 'E(未接通): 52.13%' },
      { cls: 'label-f', text: 'F(停机/空号): 1.63%' },
      { cls: 'label-g', text: 'H(客户已买车): 2.35%' },
      { cls: 'label-h', text: 'J(语音助手): 3.65%' }
    ]
  },
  /* 一知科技：客户关注点（focus-item + 前十/全部切换，万级数据千分位展示） */
  yizhiFocus: [
    { name: '询问地址', count: 26727 },
    { name: '询问价格', count: 14370 },
    { name: '询问身份', count: 3291 },
    { name: '机器人', count: 3026 },
    { name: '询问优惠', count: 2751 },
    { name: '什么车', count: 2541 },
    { name: '置换补贴', count: 2462 },
    { name: '询问活动', count: 2372 },
    { name: '介绍某款车', count: 1454 },
    { name: '售后服务', count: 1221 }
  ],
  /* 一知科技：通话时长（y 轴 25 万，千分位） */
  yizhiDuration: { max: 250000, thousand: true, yAxis: ['250,000', '200,000', '150,000', '100,000', '50,000', '0'], bars: [
    { label: '0s-5s', count: 210298 }, { label: '6s-10s', count: 14522 }, { label: '11s-30s', count: 66411 },
    { label: '31s-60s', count: 60294 }, { label: '61s-90s', count: 37127 }, { label: '>90s', count: 6654 }
  ] },
  /* 通话时长分布：中科金/冰兰/厚朴/电声/大众通信（无千分位） */
  durationDist: { max: 1500, yAxis: ['1500', '1200', '900', '600', '300', '0'], bars: [
    { label: '0s-5s', count: 180 }, { label: '6s-10s', count: 656 }, { label: '11s-30s', count: 1341 },
    { label: '31s-60s', count: 272 }, { label: '61s-90s', count: 45 }, { label: '>90s', count: 28 }
  ] }
};

/* ===== 一知科技：任务级动态统计（外呼数据/意向分类动态口径） ===== */
var MockYizhiTaskStats = {
  1:  { answeredCount: 75,  intentionStats: { a: 18, b: 35, c: 42, d: 25 },  avgDuration: '65秒' },
  2:  { answeredCount: 280, intentionStats: { a: 5,  b: 28, c: 120, d: 127 }, avgDuration: '48秒' },
  3:  { answeredCount: 980, intentionStats: { a: 85, b: 210, c: 380, d: 305 }, avgDuration: '52秒' },
  4:  { answeredCount: 95,  intentionStats: { a: 12, b: 25, c: 35, d: 23 },  avgDuration: '72秒' },
  5:  { answeredCount: 0,   intentionStats: { a: 0,  b: 0,  c: 0,  d: 0 },   avgDuration: '0秒' },
  6:  { answeredCount: 110, intentionStats: { a: 15, b: 30, c: 40, d: 25 },  avgDuration: '65秒' },
  7:  { answeredCount: 6,   intentionStats: { a: 1,  b: 2,  c: 2,  d: 1 },   avgDuration: '40秒' },
  8:  { answeredCount: 860, intentionStats: { a: 90, b: 230, c: 320, d: 220 }, avgDuration: '50秒' },
  9:  { answeredCount: 60,  intentionStats: { a: 10, b: 18, c: 20, d: 12 },  avgDuration: '58秒' },
  10: { answeredCount: 340, intentionStats: { a: 40, b: 90, c: 120, d: 90 }, avgDuration: '46秒' },
  11: { answeredCount: 160, intentionStats: { a: 20, b: 45, c: 55, d: 40 },  avgDuration: '62秒' },
  12: { answeredCount: 1200, intentionStats: { a: 130, b: 320, c: 420, d: 330 }, avgDuration: '53秒' }
};
