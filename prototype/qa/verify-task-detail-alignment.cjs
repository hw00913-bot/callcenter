/* Task creation/detail alignment. Real workspace, field mapping and time model;
 * stable account/group catalog fixtures, no browser or supplier requests. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const { setup: baseSetup, startPredictive } = require('./verify-predictive-strategy.cjs');
const root = path.resolve(__dirname, '..'), checks = [], failures = [];
const scope = { tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240' };
const clone = value => JSON.parse(JSON.stringify(value));
const compact = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function load(c, file) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c, { filename: file }); }
function check(name, fn) { try { fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.message, stack: error.stack }); } }
function includes(html, values) { for (const value of values) assert(compact(html).includes(value), `missing ${value}`); }
function excludes(html, values) { for (const value of values) assert(!compact(html).includes(value), `unexpected ${value}`); }
function detailValue(html, label) {
  const match = html.match(new RegExp(`<dt>${label}</dt><dd>(.*?)</dd>`, 's'));
  assert(match, `missing detail field ${label}`);
  return compact(match[1]);
}

function setup() {
  const c = baseSetup();
  c.state.sessionId = 'TASK-DETAIL-QA'; c.localStorage = c.sessionStorage;
  c.AppState.isReady = () => true; c.AppState.scoped = rows => rows.filter(row => row.enterpriseId === scope.enterpriseId);
  c.navigator = { locks: { request: async (_key, _options, fn) => fn({}) } };
  c.PlatformUI.timeline = rows => rows.map(row => `${row.title} ${row.detail}`).join(' ');
  c.CallState = { view: () => ({ known: false, answered: null }) };
  c.OperationsMonitor = { taskPanel: () => '' };
  c.CloudCallData.calls = []; c.CloudCallData.exceptions = [];
  Object.assign(c.CloudCallData.agents[0], { userName: '前导零坐席' });
  c.CloudCallData.agents.push({ ...scope, contactCenterIdentityId: 'AG-12', cno: '12', userName: '普通工号坐席', lifecycleStatus: '已启用' });
  c.CloudCallData.contactFlows.push({ ...scope, contactFlowId: 'FLOW-BUSY', name: '坐席忙时等候流程', providerIvrId: 92001, usage: '预外呼', status: '已发布' });
  const group = { ...scope, outboundGroupId: 'OG-DETAIL', gno: '6201', name: '总部关怀外呼组', memberIdentityIds: ['AG', 'AG-12'], status: '已启用' };
  const belongs = s => s?.tenantId === scope.tenantId && s?.enterpriseId === scope.enterpriseId;
  // Group CRUD and eligibility are covered by verify-outbound-groups. This
  // catalog fixture exercises saving/displaying the selected group's identity.
  c.OutboundGroups = {
    choices: s => belongs(s) ? [group] : [],
    forTask: (id, s) => id === group.outboundGroupId && belongs(s) ? group : null,
    resolve: (v, s) => v.outboundGroupId === group.outboundGroupId && belongs(s)
      ? { ok: true, group, snapshot: clone(group), members: c.CloudCallData.agents }
      : { ok: false, message: '外呼组不在当前范围' },
    executionError: () => ''
  };
  c.group = group;
  load(c, 'mock/time-conditions.js'); load(c, 'js/components/alicti-time-conditions.js');
  c.lastToast = ''; c.showToast = message => { c.lastToast = message; };
  return c;
}
function timing(w) {
  w.update('scheduleMode', '定时执行'); w.update('scheduleAt', '2026-10-10T09:10');
  w.update('stopScheduled', true); w.update('stopAt', '2026-10-10T18:20');
  w.setTimeMode('1'); w.toggleTimeCondition('allowedTimeIds', '95001'); w.toggleTimeCondition('forbiddenTimeIds', '95005');
  w.setRetryMode('advanced'); w.toggleRetryCode(710, true); w.toggleRetryCode(718, true);
  w.setRetryTimeType(2); w.changeRetryCount('2'); w.setRetryLayout('custom');
  w.changeRetryInterval('round-0', '15', 'minutes'); w.changeRetryInterval('round-1', '1', 'hours');
}
function predictive(c, group = false, template = false) {
  const w = startPredictive(c); w.update('name', group ? '按外呼组接听专项' : '指定坐席详情专项');
  w.update('callStrategy', '2'); w.update('minAvailableAgentCount', '3'); w.update('isRepeat', '2');
  if (group) { w.setResource('callGroupType', 2); w.setResource('outboundGroupId', c.group.outboundGroupId); }
  else w.toggleAgent('12');
  w.setResource('contactFlowId', 'FLOW-BUSY');
  if (template) w.setResource('saveAsTemplate', true);
  w.next(); assert.equal(c.active().step, 5); timing(w); w.next(); assert.equal(c.active().step, 6);
  const review = w.render(); w.submit();
  const row = c.CloudCallData.predictiveTasks[0]; assert(row, `task not created: ${c.lastToast}`);
  return { row, review, w };
}
function details(c, row) { return c.CloudTaskWorkspace.renderCenter({ taskId: row.taskId, tab: 'resources' }); }
function freeze(c, row) {
  row.status = '执行中'; row.startedAt = '2026-10-10 09:10:00';
  assert(c.CloudTaskWorkspace.saveDemoTask(row, { confirmedInitialStart: true })); assert(row.planSnapshot);
}
function reload(c) {
  const fresh = setup();
  for (const [key, value] of c.storage) fresh.storage.set(key, value);
  load(fresh, 'js/pages/cloud-task-workspace.js');
  return fresh;
}
const sharedValues = ['总部外显 · NAV-HQ', '至少 3 人', '坐席忙时等候流程', '按顺序分配', '2026-10-10 09:10', '2026-10-10 18:20', '工作日营业时间', '午间休息', '占线', '无人接听', '15 分钟', '1 小时', '上次'];

check('指定坐席创建确认与任务设置显示同一组工号、阈值、流程和完整时间重呼', () => {
  const c = setup(), { row, review } = predictive(c), html = details(c, row);
  for (const source of [review, html]) includes(source, [...sharedValues, '前导零坐席', '0012', '普通工号坐席', '12']);
  includes(html, ['任务设置', '任务与客户', '接听团队配置', '时间与重呼', '本次导入号码去重']);
  excludes(html, ['历史方案', '配置快照', '方案编号', '修改模板不改变已有任务']);
  assert.equal(row.cnos, '0012,12'); assert.equal(row.scheduleMode, '定时执行');
  assert.equal(row.executionConfig.minAvailableAgentCount, 3);
  assert.equal(row.alictiCreateDraft.fields.cnos, '0012,12');
  assert.equal(row.alictiCreateDraft.fields.minAvailableAgentCount, 3);
  assert.deepEqual(clone(row.retryPolicy.codes), [710, 718]);
  assert.deepEqual(JSON.parse(row.alictiCreateDraft.fields.retryStrategy)[0].condition.sipCause, [710, 718]);
});

check('首次启动冻结完整选择，重新加载后详情与创建结果一致', () => {
  const c = setup(), { row } = predictive(c); freeze(c, row);
  assert.equal(row.planSnapshot.cnos, '0012,12'); assert.equal(row.planSnapshot.minAvailableAgentCount, 3);
  assert.deepEqual(clone(row.planSnapshot.retryPolicy), clone(row.retryPolicy));
  const before = JSON.stringify(row), html = details(c, row); assert.equal(JSON.stringify(row), before, 'render must not modify stored task');
  const fresh = reload(c), restored = fresh.CloudCallData.tasks.find(task => task.taskId === row.taskId);
  assert(restored); assert.deepEqual(clone(restored), clone(row));
  includes(details(fresh, restored), sharedValues); assert.equal(compact(details(fresh, restored)), compact(html));
});

check('共享模板及非冻结副本变化不改变已启动任务的显示', () => {
  const c = setup(), { row } = predictive(c, false, true); freeze(c, row);
  const frozen = JSON.stringify(row.planSnapshot), expected = details(c, row);
  Object.assign(c.CloudCallData.callPlans[0], { cnos: '9999', minAvailableAgentCount: 9, contactFlowId: 'FLOW-CHANGED', retryPolicy: { mode: 'unset' } });
  Object.assign(row.executionConfig, { cnos: '9999', minAvailableAgentCount: 9, contactFlowId: 'FLOW-CHANGED', retryPolicy: { mode: 'unset' } });
  row.retryPolicy = { mode: 'unset' };
  includes(details(c, row), sharedValues); assert.equal(JSON.stringify(row.planSnapshot), frozen);
  assert.equal(compact(details(c, row)), compact(expected));
});

check('旧快照缺字段可读取任务原保存值，查看不改写旧快照', () => {
  const c = setup(), { row } = predictive(c);
  row.planSnapshot = { snapshotId: 'OLD-SNAPSHOT', callStrategy: '2' }; row.planSnapshotId = 'OLD-SNAPSHOT';
  const before = JSON.stringify(row);
  includes(details(c, row), [...sharedValues, '0012', '普通工号坐席']);
  assert.equal(JSON.stringify(row), before);
});

check('旧快照缺分配策略不从新模板回填，显式空坐席不继承旧选择', () => {
  const c = setup(), { row } = predictive(c, false, true);
  row.planSnapshot = { snapshotId: 'OLD-SNAPSHOT', callGroupType: 1, cnos: '' }; row.planSnapshotId = 'OLD-SNAPSHOT';
  const before = JSON.stringify(row), html = details(c, row);
  assert(html.includes('<dt>坐席分配方式</dt><dd>未记录</dd>'));
  excludes(html, ['前导零坐席', '普通工号坐席']);
  assert.equal(JSON.stringify(row), before);
});

check('外呼组任务在未启动、冻结及重载后保留组名与组号', () => {
  const c = setup(), { row, review } = predictive(c, true);
  includes(review, ['总部关怀外呼组', '6201']); includes(details(c, row), ['总部关怀外呼组', '6201']);
  assert.equal(row.alictiCreateDraft.fields.callGroupType, 2); assert.equal(row.alictiCreateDraft.fields.agentGroup, '6201');
  assert(!Object.hasOwn(row.alictiCreateDraft.fields, 'cnos'));
  freeze(c, row); assert.equal(row.planSnapshot.callGroupType, 2); assert.equal(row.planSnapshot.agentGroup, '6201');
  assert.equal(row.planSnapshot.outboundGroupSnapshot.name, '总部关怀外呼组');
  c.group.name = '后来修改的组名'; includes(details(c, row), ['总部关怀外呼组', '6201']); excludes(details(c, row), ['后来修改的组名']);
  const fresh = reload(c), restored = fresh.CloudCallData.tasks.find(task => task.taskId === row.taskId);
  includes(details(fresh, restored), ['总部关怀外呼组', '6201', '至少 3 人']);
});

check('旧外呼组任务缺完整快照仍按保存的组类型展示，保持用户原数据', () => {
  const c = setup(), { row } = predictive(c, true);
  row.planSnapshot = { snapshotId: 'OLD-GROUP', callStrategy: '2' }; row.planSnapshotId = 'OLD-GROUP';
  const before = JSON.stringify(row), html = details(c, row);
  includes(html, ['执行外呼组', '总部关怀外呼组', '6201']); excludes(html, ['指定坐席（']);
  assert.equal(JSON.stringify(row), before);
});

check('自动外呼详情保留语音和重呼设置，不显示坐席配置', () => {
  const c = setup(), w = c.CloudTaskWorkspace;
  w.start('IVR 外呼'); w.update('name', '自动提醒详情专项'); w.setResource('providerIvrId', '91001'); w.next();w.setCallerNavigation('NAV-HQ');
  timing(w); w.next(); w.update('isRepeat', '1'); w.next(); assert.equal(c.active().step, 6);
  const review = w.render(); w.submit(); const row = c.CloudCallData.ivrTasks[0]; assert(row);
  const flowName = c.AliCtiIvr.resolve({ providerIvrId: '91001' }, scope).row.ivrName;
  const expected = ['总部外显 · NAV-HQ', flowName, '占线', '无人接听', '15 分钟', '1 小时', '工作日营业时间', '午间休息', '2026-10-10 09:10', '2026-10-10 18:20', '整个任务内去重'];
  for (const html of [review, details(c, row)]) { includes(html, expected); excludes(html, ['坐席分配方式', '可用坐席', '坐席忙时', '执行外呼组']); }
  assert.equal(row.isRepeat, 1); assert.equal(row.alictiCreateDraft.fields.ivrId, 91001);
  assert.equal(row.alictiCreateDraft.fields.autoStartTime, '09:10:00'); assert.equal(row.alictiCreateDraft.fields.autoStopTime, '18:20:00');
  freeze(c, row); includes(details(c, row), expected);
  c.CloudCallData.contactFlows.find(flow => flow.contactFlowId === row.contactFlowId).name = '后来修改的本地流程名称';
  row.executionConfig.contactFlowName = '后来修改的配置流程名称';
  includes(details(c, row), expected); excludes(details(c, row), ['后来修改的本地流程名称', '后来修改的配置流程名称']);
  const fresh = reload(c), restored = fresh.CloudCallData.tasks.find(task => task.taskId === row.taskId);
  includes(details(fresh, restored), expected);
  for (const field of ['cnos', 'callStrategy', 'agentGroup']) assert(!Object.hasOwn(row.alictiCreateDraft.fields, field));
});

check('历史自动外呼未保存客户等待时间时显示未记录，明确保存值仍按原值显示', () => {
  const c = setup(), row = { ...scope, taskId: 'LEGACY-IVR-TIMEOUT', name: '历史自动外呼',
    callType: 'IVR 外呼', status: '已完成', total: 0,
    planSnapshot: { snapshotId: 'OLD-IVR', contactFlowName: '历史任务语音流程' } };
  c.CloudCallData.tasks.push(row);
  const before = JSON.stringify(row);
  assert.equal(detailValue(details(c, row), '客户接听等待时间'), '未记录');
  assert.equal(JSON.stringify(row), before);
  row.alictiCreateDraft = { fields: { customerTimeout: 45 } };
  assert.equal(detailValue(details(c, row), '客户接听等待时间'), '45 秒');
});

check('自动外呼旧任务仅有流程 ID 时不借当前目录名称补成历史流程', () => {
  const c = setup(), row = { ...scope, taskId: 'LEGACY-IVR-ID', name: '旧自动外呼',
    callType: 'IVR 外呼', status: '已完成', total: 0,
    planSnapshot: { snapshotId: 'OLD-IVR-ID', providerIvrId: '91001' } };
  c.CloudCallData.tasks.push(row);
  const before = JSON.stringify(row);
  c.AliCtiIvr.fixtureRows.find(item => item.id === '91001' && item.enterpriseId === scope.enterpriseId).ivrName = '当前目录的新名称';
  const html = details(c, row);
  assert.equal(detailValue(html, '语音流程'), '语音流程 91001');
  excludes(html, ['当前目录的新名称']);
  assert.equal(JSON.stringify(row), before);
});

check('复制指定坐席任务保留冻结工号与设置，客户和旧预约日期不继承', () => {
  const c = setup(), { row, w } = predictive(c); freeze(c, row);
  row.executionConfig.cnos = '9999'; const before = JSON.stringify(row);
  w.copyTask(row.taskId); const values = c.active().values;
  assert.equal(Number(values.callGroupType), 1);
  assert.deepEqual(Array.isArray(values.cnos) ? values.cnos : String(values.cnos).split(','), ['0012', '12']);
  assert.equal(values.minAvailableAgentCount, 3); assert.equal(values.callStrategy, '2');
  assert.equal(values.scheduleMode, '保存后手工启动'); assert.equal(values.stopScheduled, false); assert.equal(values.stopAt, '');
  assert.equal((values.customerIds || []).length, 0); assert.equal(values.total, 0);
  assert.deepEqual(clone(values.allowedTimeIds), ['95001']); assert.deepEqual(clone(values.retryPolicy), clone(row.planSnapshot.retryPolicy));
  assert.equal(JSON.stringify(row), before);
});

check('复制外呼组任务保留冻结组号及组快照，客户和旧预约日期不继承', () => {
  const c = setup(), { row, w } = predictive(c, true); freeze(c, row);
  const before = JSON.stringify(row); c.group.name = '当前目录新组名';
  w.copyTask(row.taskId); const values = c.active().values;
  assert.equal(Number(values.callGroupType), 2); assert.equal(values.agentGroup, '6201'); assert.equal(values.outboundGroupId, 'OG-DETAIL');
  assert.equal(values.outboundGroupSnapshot.name, '总部关怀外呼组');
  assert.equal(values.scheduleMode, '保存后手工启动'); assert.equal(values.stopScheduled, false); assert.equal(values.stopAt, '');
  assert.equal((values.customerIds || []).length, 0); assert.equal(values.total, 0);
  assert.equal(JSON.stringify(row), before);
});

check('旧记录缺少设置时不虚构默认阈值、坐席或任务备注', () => {
  const c = setup(), row = { ...scope, taskId: 'LEGACY-DETAIL', name: '历史待核对任务', callType: '预外呼', status: '已暂停', total: 0, owner: '原负责人', note: '用户原有备注' };
  c.CloudCallData.tasks.push(row); const before = JSON.stringify(row), html = details(c, row);
  excludes(html, ['至少 10 人', '前导零坐席', '普通工号坐席', '总部关怀外呼组']);
  assert.equal(JSON.stringify(row), before); assert.equal(row.note, '用户原有备注');
});

check('AliCti 新任务设置贯通向导、请求、详情、启动快照和复制', () => {
  const c=setup(),w=c.CloudTaskWorkspace;
  w.start('预外呼');w.update('name','任务设置专项');w.update('description','试驾邀约客户回访');w.update('businessTagNames','邀约,总部');
  w.next();assert.equal(c.active().step,4);
  w.setResource('skillGroupId','G');w.setCallerNavigation('NAV-HQ');w.setResource('contactFlowId','FLOW-BUSY');
  w.update('callRouteStrategy','2');w.update('agentTimeout','22');w.update('wrapup','45');w.update('maxWaitTime','60');
  w.update('quotiety','1.25');w.update('predictAdjust','120');w.update('answerRate','55');w.update('warmUpDuration','360');w.update('isRewarm','0');
  includes(w.render(),['客户接通后如何流转','预测拨号参数','拨号系数（AliCti 骚扰率）']);
  w.next();assert.equal(c.active().step,5);
  timing(w);w.update('autoComplete','0');w.update('forceEndFlag','1');w.update('retryStrategyOnlyToday','2');w.update('concurrency','3');
  w.updatePriority('retryFirst',false);w.updatePriority('retryDesc','1');w.updatePriority('firstCallOrderType','2');
  includes(w.render(),['任务完成方式','呼叫顺序与高级设置','仅当天生效']);
  w.next();assert.equal(c.active().step,6);
  const review=w.render();w.submit();const row=c.CloudCallData.predictiveTasks[0];assert(row);
  const fields=row.alictiCreateDraft.fields;
  assert.equal(fields.description,'试驾邀约客户回访');assert.equal(fields.businessTagNames,'邀约,总部');
  assert.equal(fields.autoComplete,0);assert.equal(fields.forceEndFlag,1);assert.equal(fields.retryStrategyOnlyToday,2);
  assert.equal(fields.concurrency,3);assert.equal(fields.callRouteStrategy,2);assert.equal(fields.ivrId,92001);
  assert.equal(fields.agentTimeout,22);assert.equal(fields.wrapup,45);assert.equal(fields.maxWaitTime,60);
  assert.equal(fields.quotiety,1.25);assert.equal(fields.predictAdjust,120);assert.equal(fields.answerRate,55);
  assert.equal(fields.warmUpDuration,360);assert.equal(fields.isRewarm,0);
  assert.deepEqual(JSON.parse(fields.callPriorityStrategy).strategy.map(item=>item.type),['firstCall','retryCall']);
  for(const html of [review,details(c,row)])includes(html,['试驾邀约客户回访','邀约,总部','删除待重呼号码','首次呼叫优先','先进入 AI／语音流程','1.25','120%','360 秒']);
  freeze(c,row);assert.equal(row.planSnapshot.callRouteStrategy,2);
  const frozen=details(c,row);row.executionConfig.quotiety=9;assert.equal(compact(details(c,row)),compact(frozen));
  w.copyTask(row.taskId);const copied=c.active().values;
  assert.equal(copied.description,'试驾邀约客户回访');assert.equal(copied.quotiety,1.25);assert.equal(copied.callRouteStrategy,2);
  assert.equal(copied.forceEndFlag,0);assert.equal(copied.stopScheduled,false);
});

check('AI 转人工的创建确认与任务详情按接通后流程标注语音流程', () => {
  const c=setup(),w=c.CloudTaskWorkspace;
  startPredictive(c);w.update('name','AI 流转详情专项');w.setResource('contactFlowId','FLOW-BUSY');w.update('callRouteStrategy','2');
  w.next();assert.equal(c.active().step,5);w.next();assert.equal(c.active().step,6);
  const review=w.render();w.submit();const row=c.CloudCallData.predictiveTasks[0];assert(row);
  for(const html of [review,details(c,row)]){
    assert.equal(detailValue(html,'客户接通后的语音流程'),'坐席忙时等候流程');
    assert(!html.includes('<dt>坐席忙时</dt>'), 'AI 转人工的流程不应标为坐席忙时');
  }
  freeze(c,row);
  assert.equal(detailValue(details(c,row),'客户接通后的语音流程'),'坐席忙时等候流程');
});

check('旧任务缺少预测参数时如实显示未记录，不推断暂停后关闭预热', () => {
  const c=setup(),row={...scope,taskId:'LEGACY-METRICS',name:'旧任务预测参数',callType:'预外呼',status:'已暂停',total:0,owner:'原负责人'};
  c.CloudCallData.tasks.push(row);
  const before=JSON.stringify(row),html=details(c,row);
  for(const label of ['预测拨号','坐席等待与整理','任务预热'])assert.equal(detailValue(html,label),'未记录');
  assert.equal(JSON.stringify(row),before,'查看旧任务不应补写默认值');
  row.answerRate=55;row.warmUpDuration=360;
  const partial=detailValue(details(c,row),'任务预热');
  assert(partial.includes('55%')&&partial.includes('360 秒'));
  assert.match(partial,/暂停后.*未记录/);
  assert(!partial.includes('暂停后不重新预热')&&!partial.includes('暂停后重新预热'));
});

check('旧任务仅保存官方呼叫顺序 JSON 时详情和复制恢复原顺序', () => {
  const c=setup(),w=c.CloudTaskWorkspace;
  const callPriorityStrategy=JSON.stringify({strategy:[{sort:1,type:'firstCall',orderType:2},{sort:2,type:'retryCall',desc:1}]});
  const row={...scope,taskId:'LEGACY-PRIORITY',name:'旧任务呼叫顺序',callType:'预外呼',status:'已暂停',total:0,owner:'原负责人',
    planSnapshot:{snapshotId:'OLD-PRIORITY'},planSnapshotId:'OLD-PRIORITY',alictiCreateDraft:{fields:{callPriorityStrategy}}};
  c.CloudCallData.tasks.push(row);const before=JSON.stringify(row);
  assert.equal(detailValue(details(c,row),'拨打顺序'),'首次呼叫优先；重呼高轮次优先；首次按导入时间顺序');
  w.copyTask(row.taskId);
  assert.deepEqual(clone(c.active().values.callPriority),{retryFirst:false,retryDesc:1,firstCallOrderType:2});
  assert.equal(JSON.stringify(row),before,'查看和复制不应改写历史任务');
});

check('任务保存的指定坐席名称在目录改名后仍保持原名', () => {
  const c=setup(),{row}=predictive(c);
  const before=details(c,row);includes(before,['前导零坐席','0012']);
  c.CloudCallData.agents[0].userName='后来改名的坐席';
  includes(details(c,row),['前导零坐席','0012']);excludes(details(c,row),['后来改名的坐席']);
  freeze(c,row);
  includes(details(c,row),['前导零坐席','0012']);excludes(details(c,row),['后来改名的坐席']);
});

check('自动外呼旧任务并发值为零时不解释成无限制', () => {
  const c=setup(),row={...scope,taskId:'LEGACY-IVR-CONCURRENCY',name:'旧自动任务并发',callType:'IVR 外呼',status:'已暂停',total:0,owner:'原负责人',concurrency:0};
  c.CloudCallData.tasks.push(row);
  const value=detailValue(details(c,row),'同时呼叫上限');
  assert.match(value,/0|未记录/);
  assert(!value.includes('不设固定上限'),'只有预外呼的 0 有不限制语义');
});

check('旧任务完全缺少时间条件字段时不假定连续呼叫', () => {
  const c=setup(),row={...scope,taskId:'LEGACY-NO-TIME',name:'旧任务时间条件',callType:'预外呼',status:'已暂停',total:0,owner:'原负责人'};
  c.CloudCallData.tasks.push(row);const before=JSON.stringify(row),html=details(c,row);
  assert.equal(detailValue(html,'呼叫时段'),'未记录');
  assert.equal(detailValue(html,'禁止呼叫时段'),'未记录');
  assert.equal(JSON.stringify(row),before,'只读查看不应回填时间条件默认值');
  row.autoTaskType=0;row.allowedTimeIds=[];row.forbiddenTimeIds=[];
  assert.equal(detailValue(details(c,row),'呼叫时段'),'连续呼叫');
});

check('已有供应商任务标识不能本地删除，无删除权限的运营也看不到删除动作', () => {
  const c=setup(),w=c.CloudTaskWorkspace;
  const local={...scope,taskId:'LOCAL-UNSTARTED',name:'仅本地未启动任务',callType:'预外呼',status:'待启动',total:0,owner:'原负责人'};
  assert.equal(w.canDeleteTask(local),true,'对照：纯本地未启动任务仍允许删除');
  const provider={...local,taskId:'PROVIDER-UNSTARTED',providerTaskId:88002};
  c.CloudCallData.tasks.push(provider);
  assert.equal(w.canDeleteTask(provider),false,'真实 providerTaskId 的任务不能按本地任务删除');
  assert(!w.centerActions(provider).includes(`deleteTask('${provider.taskId}')`));
  const operator={...local,taskId:'OPERATOR-UNSTARTED'};
  c.CloudCallData.tasks.push(operator);
  c.AppState.effectiveAccess=()=>({valid:true,roleCode:'OPERATOR'});
  c.AppState.canAction=action=>action==='task.create';
  assert.equal(w.canDeleteTask(operator),false,'无删除权限的运营不能删除任务');
  assert(!w.centerActions(operator).includes(`deleteTask('${operator.taskId}')`));
});

check('任务设置非法值在对应向导步骤阻断且不创建任务', () => {
  const c=setup(),w=c.CloudTaskWorkspace;
  w.start('预外呼');w.update('name','非法参数专项');w.update('businessTagNames','错误，分隔');
  w.next();assert.equal(c.active().step,2);
  w.update('businessTagNames','已修正');w.next();assert.equal(c.active().step,4);
  w.setResource('skillGroupId','G');w.setCallerNavigation('NAV-HQ');w.update('callRouteStrategy','2');
  w.next();assert.equal(c.active().step,4);
  w.setResource('contactFlowId','FLOW-BUSY');w.update('agentTimeout','4');w.next();assert.equal(c.active().step,4);
  w.update('agentTimeout','10');w.next();assert.equal(c.active().step,5);
  w.update('concurrency','-1');w.next();assert.equal(c.active().step,5);
  assert.equal(c.CloudCallData.predictiveTasks.length,0);
});

check('自动外呼只保存通用任务设置，不混入预测外呼参数', () => {
  const c=setup(),w=c.CloudTaskWorkspace;
  w.start('IVR 外呼');w.update('name','自动外呼设置专项');w.update('description','服务提醒');w.setResource('providerIvrId','91001');
  w.next();w.setCallerNavigation('NAV-HQ');assert.equal(c.active().step,5);
  w.update('autoComplete','0');w.update('retryStrategyOnlyToday','3');w.update('concurrency','2');
  w.updatePriority('retryFirst',false);w.updatePriority('firstCallOrderType','1');
  excludes(w.render(),['预测拨号参数','坐席接听超时']);
  w.next();assert.equal(c.active().step,2);w.next();assert.equal(c.active().step,6);const review=w.render();w.submit();
  const row=c.CloudCallData.ivrTasks[0],fields=row.alictiCreateDraft.fields;
  assert.equal(fields.description,'服务提醒');assert.equal(fields.autoComplete,0);
  assert.equal(fields.retryStrategyOnlyToday,3);assert.equal(fields.concurrency,2);
  assert.equal(JSON.parse(fields.callPriorityStrategy).strategy[0].type,'firstCall');
  for(const html of [review,details(c,row)])includes(html,['服务提醒','删除待呼号码','首次呼叫优先','随机']);
  for(const source of [fields,row.executionConfig,row])assert(!Object.hasOwn(source,'callRouteStrategy'));
});

console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', count: checks.length, failed: failures.length, checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
