/* Call detail alignment: real CDR field/state readers and page rendering.
 * Framework, media lifecycle and business-form rendering are HTML-only fixtures.
 * No browser, supplier calls, storage writes or changes to supplied call rows. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), checks = [], failures = [];
const scope = { tenantId: 'HQ', enterpriseId: '7522240' };
const start = 1758792120, end = start + 39;
const escape = value => String(value ?? '').replace(/[&<>"']/g, token => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[token]));
const decode = value => String(value).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const text = html => decode(String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const business = html => String(html).replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/g, '');
const time = seconds => new Date(seconds * 1000).toLocaleString('sv-SE');
function load(c, file) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c, { filename: file }); }
function check(name, fn) { try { fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.message, stack: error.stack }); } }
function includes(html, values) { for (const value of values) assert(text(html).includes(value), `missing ${value}`); }
function excludes(html, values) { for (const value of values) assert(!text(html).includes(value), `unexpected ${value}`); }
function fields(html) {
  return [...String(html).matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/g)]
    .map(match => ({ name: text(match[1]), value: text(match[2]) }));
}
function field(html, name) {
  const row = fields(html).find(item => item.name === name);
  assert(row, `missing field ${name}; found ${fields(html).map(item => item.name).join(', ')}`);
  return row.value;
}
const durationLabel = kind => kind === 'automatic' ? '客户接听时长' : kind === 'inbound' ? '通话时长' : '双方通话时长';
function setup() {
  const storage = new Map(), nodes = new Map(), layers = [], mediaEvents = [], navigations = [], toasts = [];
  const c = { console, Date, JSON, setTimeout, clearTimeout };
  c.window = c; c.document = { getElementById: id => nodes.get(id) || null };
  c.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
  c.localStorage = c.sessionStorage;
  c.AppState = {
    scoped: rows => rows.filter(row => String(row.enterpriseId) === scope.enterpriseId && row.tenantId === scope.tenantId),
    authorizeObject: (_key, row) => String(row.enterpriseId) === scope.enterpriseId && row.tenantId === scope.tenantId,
    effectiveAccess: () => ({ roleCode: 'TENANT_ADMIN', ...scope }), account: () => ({ accountId: 'QA-ADMIN', ...scope }),
    tenant: () => ({ ...scope, name: '总部租户' }), context: () => ({ ...scope })
  };
  c.CloudCallData = { calls: [], tasks: [], agents: [], physicalSkillGroups: [{ ...scope, skillGroupId: 'OLD-SKILL', name: '不应作为实际队列的旧技能' }], contactFlows: [] };
  c.CloudCallRuntime = { call: id => c.CloudCallData.calls.find(call => call.callId === id), tenant: id => ({ tenantId: id, name: id === 'HQ' ? '总部租户' : '门店租户' }) };
  c.CloudTaskWorkspace = { renderTaskSettings: task => `<section data-task-settings="${escape(task.taskId)}"><h3>${escape(task.name)}</h3><p>${escape(task.planSnapshot?.contactFlowName || '')}</p></section>` };
  c.PlatformUI = {
    escape, status: value => `<span>${escape(value)}</span>`, callTypeLabel: value => value === 'IVR 外呼' ? '自动外呼' : value,
    openLayer: (id, html, width) => { layers.push({ id, html, width }); nodes.set(id, {}); }, closeLayer: () => {},
    detailSection: (title, html) => `<section data-title="${escape(title)}"><h3>${escape(title)}</h3>${html}</section>`,
    timeline: rows => `<ol>${rows.map(row => `<li><strong>${escape(row.title)}</strong><time>${escape(row.time)}</time><p>${escape(row.detail)}</p></li>`).join('')}</ol>`,
    pageHeader: (title, note) => `<h1>${escape(title)}</h1><p>${escape(note)}</p>`, journey: () => '',
    toolbar: (left, right) => `${left}${right}`, help: () => '', pagination: () => '',
    table: (columns, rows) => `<table><thead><tr>${columns.map(column => `<th>${escape(column.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map(column => `<td>${column.render ? column.render(row[column.key], row) : escape(row[column.key])}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  };
  c.CloudCallMedia = { destroy: () => mediaEvents.push('destroy'), render: () => '<div data-media="fixture">录音与文本</div>', mount: (_element, call) => mediaEvents.push(`mount:${call.callId}`), resolve: () => ({ status: '未提供录音', url: '' }) };
  c.CustomerDirectory = { sync: () => {}, dispositionLabel: call => call.disposition || '' };
  c.CustomerFollowup = { canEdit: call => !!call.followupEditable, detail: (values, call) => `<div data-followup="${escape(call.callId)}">自定义字段：${escape(values?.values?.preferredModel || '未填写')}</div>` };
  c.CustomerBusiness = { typeLabel: call => call.businessType || '线索类', codeLabel: () => '线索编码' };
  c.RepeatPredictive = { contactLabel: call => call.businessContactLabel || '', contactOrigin: call => call.businessContactOrigin ? `<p>${escape(call.businessContactOrigin)}</p>` : '', callAction: call => call.repeatEligible ? '<button data-repeat="same-task">再次联系</button>' : '' };
  c.RouteRuntime = { openSecondary: (...args) => navigations.push(args), back: () => {} };
  c.navigateTo = (...args) => navigations.push(args); c.showToast = message => toasts.push(message);
  vm.createContext(c);
  for (const name of ['alicti-fields', 'alicti-number-status', 'call-state', 'alicti-report-facts', 'report-metrics']) load(c, `js/components/${name}.js`);
  load(c, 'js/pages/cloud-call-records.js');
  return { c, layers, nodes, mediaEvents, navigations, toasts, page: c.Pages['cloud-call-records'] };
}
function record(kind = 'predictive', raw = {}, extra = {}) {
  return { ...scope, callId: 'LOCAL-CALL', contactId: 'LOCAL-SESSION',
    callType: { manual: '人工外呼', predictive: '预外呼', inbound: '呼入', automatic: 'IVR 外呼' }[kind],
    direction: kind === 'inbound' ? '呼入' : '呼出', caller: 'LOCAL-CALLER', callee: 'LOCAL-CALLEE', skillGroupId: 'OLD-SKILL',
    alictiCdr: { kind, raw: { mainUniqueId: 'SUPPLIER-CALL', ...(kind === 'inbound' ? {} : { enterpriseId: 7522240 }), customerNumber: '13900001234', startTime: start, endTime: end, ...raw } }, ...extra };
}
function open(h, call) {
  h.c.CloudCallData.calls = [call]; const before = JSON.stringify(call), taskBefore = JSON.stringify(h.c.CloudCallData.tasks);
  h.page.openCall(call.callId); const layer = h.layers.at(-1);
  assert(layer, 'call detail did not open'); assert.equal(layer.id, 'cloud-call-detail');
  assert.equal(JSON.stringify(call), before, 'view must not rewrite the call');
  assert.equal(JSON.stringify(h.c.CloudCallData.tasks), taskBefore, 'view must not rewrite the task');
  return layer.html;
}

check('四类原始话单按各接口时间展示，秒值只转换一次且结束状态来自话单', () => {
  for (const [kind, raw, customerAt, agentAt] of [
    ['manual', { status: 3, upTime: start + 2, bridgeTime: start + 5, bridgeDuration: 34 }, start + 5, start + 2],
    ['predictive', { status: 43, upTime: start + 2, bridgeTime: start + 5, bridgeDuration: 34, customerBridgeDuration: 37 }, start + 2, start + 5],
    ['inbound', { status: '人工接听', answerTime: start + 1, bridgeTime: start + 6, bridgeDuration: 33 }, start + 1, start + 6],
    ['automatic', { status: '客户接听', upTime: start + 2, customerBridgeDuration: 37 }, start + 2, null]
  ]) {
    const h = setup(), call = record(kind, raw), html = business(open(h, call));
    const display = h.c.CloudCallRecords.display(call);
    assert.equal(display.startAt, start * 1000); assert.equal(display.endAt, end * 1000);
    assert.equal(display.customerAt, customerAt * 1000); assert.equal(display.agentAt, agentAt === null ? null : agentAt * 1000);
    assert.equal(display.state.ended, true);
    assert.equal(display.durationSeconds, kind === 'automatic' ? 37 : kind === 'inbound' ? 33 : 34);
    includes(html, [time(start), time(end), time(customerAt), '已结束']);
    if (agentAt) includes(html, [time(agentAt)]);
    excludes(html, ['1970-', '等待通话结束']);
    assert.deepEqual(h.mediaEvents, ['destroy', 'mount:LOCAL-CALL']);
  }
});

check('预测 status 42 优先于旧坐席已接听标签，缺少客户事实不猜已接通', () => {
  const h = setup(), call = record('predictive', { status: 42 }, { agentAnswerResult: '已接听', result: '已接通' }), html = open(h, call);
  assert.equal(h.c.CloudCallRecords.display(call).state.agentAnswered, false);
  assert.notEqual(h.c.CloudCallRecords.display(call).state.answered, true);
  assert.equal(field(html, '坐席接听'), '未接听');
  assert.notEqual(field(html, '客户是否接通'), '已接通');
});

check('接口缺失时长不能回填旧本地时长或零，接口零秒仍然展示零秒', () => {
  for (const value of [undefined, null, '', -1, true, 1.5]) {
    const html = open(setup(), record('manual', { status: 3, bridgeDuration: value }, { durationSeconds: 999 }));
    assert.equal(field(html, durationLabel('manual')), '未记录');
  }
  assert.equal(field(open(setup(), record('manual', { status: 3, bridgeDuration: 0 })), durationLabel('manual')), '00:00');
});

check('原始工号保留前导零，实际队列不借旧技能填充，数字工号不冒充 string', () => {
  for (const cno of ['0012', '12']) {
    const h = setup(), call = record('predictive', { status: 43, cno, clientName: '接口坐席姓名', qno: 'Q-007' }, { agentName: '旧本地坐席' }), html = business(open(h, call));
    assert.equal(h.c.CloudCallRecords.display(call).agentCno, cno);
    assert.equal(h.c.CloudCallRecords.display(call).queueNo, 'Q-007');
    includes(html, [cno, '接口坐席姓名', 'Q-007']); excludes(html, ['不应作为实际队列的旧技能', '旧本地坐席']);
  }
  const html = business(open(setup(), record('predictive', { status: 43, cno: 12, clientName: '数字工号对应名称' })));
  assert(!fields(html).some(row => /工号/.test(row.name) && row.value === '12'), 'numeric cno must not be converted to valid string identity');
});

check('呼入保留首次拨打坐席与流转工号，不把首次拨打冒充最终接听坐席', () => {
  const html = business(open(setup(), record('inbound', { status: '人工接听', firstCallCno: '0012', firstCallCname: '首次拨打坐席', firstCallQno: 'Q-01', firstCallQname: '首个队列', cnoFlow: ['0012', '12'], qnoFlow: ['Q-01', 'Q-02'], answerTime: start + 1, bridgeTime: start + 6 })));
  includes(html, ['0012', '12', 'Q-01', 'Q-02', '首次']);
  excludes(html, ['不应作为实际队列的旧技能']);
});

check('来源任务严格匹配本租户与账号的供应商任务 ID，保留原任务设置名称', () => {
  const h = setup(); h.c.CloudCallData.tasks = [
    { ...scope, tenantId: 'STORE', taskId: 'SHARED-LOCAL-ID', providerTaskId: 501, name: '错误门店任务' },
    { ...scope, enterpriseId: '7000001', taskId: 'SHARED-LOCAL-ID', providerTaskId: 501, name: '错误账号任务' },
    { ...scope, taskId: 'SHARED-LOCAL-ID', providerTaskId: 501, name: '本租户原任务', callType: '预外呼' }
  ];
  const call = record('predictive', { status: 43, taskId: 501, taskName: '供应商任务名' }, { taskId: 'SHARED-LOCAL-ID' }), html = business(open(h, call));
  assert.equal(h.c.CloudCallRecords.relatedTask(call), h.c.CloudCallData.tasks[2]);
  includes(html, ['本租户原任务', '501']); excludes(html, ['错误门店任务', '错误账号任务']);
});

check('本地关联与话单供应商 ID 冲突不绑定其他任务，保留可证明的供应商任务事实', () => {
  const h = setup(); h.c.CloudCallData.tasks = [
    { ...scope, taskId: 'LOCAL-TASK', providerTaskId: 502, name: '冲突本地任务', callType: '预外呼' },
    { ...scope, taskId: 'OTHER-TASK', providerTaskId: 501, name: '不能绕过冲突绑定的任务', callType: '预外呼' }
  ];
  const call = record('predictive', { status: 43, taskId: 501, taskName: '可证明的供应商任务' }, { taskId: 'LOCAL-TASK', repeatEligible: true }), html = business(open(h, call));
  assert.equal(h.c.CloudCallRecords.relatedTask(call), null);
  includes(html, ['501', '可证明的供应商任务']); excludes(html, ['冲突本地任务', '不能绕过冲突绑定的任务', '再次联系']);
  assert(!html.includes('data-repeat="same-task"'), 'conflicting task identity must not expose same-task follow-up action');
});

check('自动外呼展示实际执行语音而非模板名称，客户接听不推断坐席接听', () => {
  const h = setup(); h.c.CloudCallData.tasks = [{ ...scope, taskId: 'AUTO-LOCAL', providerTaskId: 601, name: '自动提醒任务', callType: 'IVR 外呼', executionConfig: { contactFlowName: '当前可变模板名称', cnos: '0012' }, planSnapshot: { contactFlowName: '任务原设置流程' } }];
  const call = record('automatic', { status: '客户接听', taskId: 601, taskName: '供应商自动任务', ivrName: '本通实际语音流程', cno: '0012', upTime: start + 2, customerBridgeDuration: 37, bridgeTime: start + 3, bridgeDuration: 36 }, { taskId: 'AUTO-LOCAL', agentAnswerResult: '已接听' }), html = business(open(h, call));
  const display = h.c.CloudCallRecords.display(call); assert.equal(display.ivrName, '本通实际语音流程'); assert.equal(display.durationSeconds, 37); assert.equal(display.state.agentAnswered, null);
  includes(html, ['本通实际语音流程', '00:37']); excludes(html, ['当前可变模板名称']);
  assert.notEqual(field(html, '坐席接听'), '已接听');
});

check('重呼轮次与最终呼叫标识仅描述当前话单，不推算下一次安排或混淆业务联系轮次', () => {
  for (const flag of [0, 1]) {
    const h = setup(); h.c.CloudCallData.tasks = [{ ...scope, taskId: 'REPEAT-LOCAL', providerTaskId: 701, name: '原任务再次联系', callType: '预外呼' }];
    const call = record('predictive', { status: 40, taskId: 701, telRetryRound: 3, finishRetryFlag: flag }, { taskId: 'REPEAT-LOCAL', hasNextAttempt: true, retryCount: 9, businessContactLabel: '第 2 次业务联系', businessContactOrigin: '沿用本任务的后续联系', repeatEligible: true }), html = business(open(h, call));
    assert.equal(h.c.CloudCallRecords.relatedTask(call), h.c.CloudCallData.tasks[0]);
    assert.equal(h.c.CloudCallRecords.display(call).retryRound, 3); assert.equal(h.c.CloudCallRecords.display(call).finishRetryFlag, flag);
    includes(html, ['3', '第 2 次业务联系', '沿用本任务的后续联系', '再次联系']);
    assert(html.includes('data-repeat="same-task"'), 'verified original task must retain eligible follow-up action');
    excludes(html, ['有下一次', '自动安排下一次', '后续重呼']);
  }
});

check('自定义客户业务信息和处理结果只读展示，详情不再提供填写入口', () => {
  const call = record('manual', { status: 3 }, { businessType: '线索类', externalDocumentId: 'LEAD-009', disposition: '已预约试驾', customerFollowup: { values: { preferredModel: '轩逸专项配置' } }, followupEditable: true, callSource: 'NATIVE_WORKBENCH', customerName: '测试客户', customerNote: '下午方便', dispositionRemark: '预约周末' });
  const html = business(open(setup(), call));
  includes(html, ['轩逸专项配置', '已预约试驾', 'LEAD-009']); excludes(html, ['坐席技能', '不应作为实际队列的旧技能', '填写业务信息', '编辑业务信息', 'CustomerFollowup.openEditor']);
});

check('账号或接口类型不匹配的原始响应不进入业务字段，不回填过期本地接通值', () => {
  for (const call of [record('manual', { enterpriseId: 7000001, status: 3, cno: 'FOREIGN-CNO', bridgeDuration: 39 }, { result: '已接通', durationSeconds: 999 }), { ...record('manual', { status: 3, cno: 'FOREIGN-CNO' }), callType: '呼入' }]) {
    const html = business(open(setup(), call)); excludes(html, ['FOREIGN-CNO']);
    assert.notEqual(field(html, '客户是否接通'), '已接通');
    assert.equal(field(html, durationLabel(call.callType === '呼入' ? 'inbound' : 'manual')), '未记录');
  }
});

check('未关联本地会话编号不充当供应商通话编号，明确 mainUniqueId 原样保留', () => {
  const html = open(setup(), record('predictive', { status: 43 }));
  assert.equal(field(html, '厂商通话编号'), 'SUPPLIER-CALL');
});

check('存在原始响应时缺失结束时间不继承旧本地已结束阶段', () => {
  const h = setup(), call = record('predictive', { status: 43, upTime: start + 2, bridgeTime: start + 5, endTime: null }, { result: '接通', endedAt: time(end), durationSeconds: 999 });
  assert.equal(h.c.CallState.view(call).ended, true, 'fixture must contain a stale ended stage');
  const data = h.c.CloudCallRecords.display(call), html = business(open(h, call));
  assert.equal(data.endAt, null); assert.equal(data.state.ended, false); assert.notEqual(data.state.stage, 'RELEASED');
  assert.equal(field(html, '结束时间'), '—'); assert.notEqual(field(html, '通话进度'), '已结束');
});

check('不匹配账号的号码识别不能出现在业务结果中', () => {
  const h = setup(), call = record('predictive', { enterpriseId: 7000001, status: 40, sipCause: 710, obSipCause: '占线' });
  assert.equal(h.c.AliCtiNumberStatus.fromCdr('predictive', call.alictiCdr.raw).code, '710', 'fixture must contain an otherwise valid recognition code');
  const html = business(open(h, call)); excludes(html, ['占线']);
  assert.notEqual(h.c.CloudCallRecords.display(call).state.numberStatus.code, '710');
});

check('自动外呼查询使用自己的话单接口，全部查询同时包含四类接口', () => {
  const h = setup(); h.nodes.set('recordStart', { value: '2026-09-15T00:00:00' }); h.nodes.set('recordEnd', { value: '2026-09-15T23:59:59' });
  h.page.setType('IVR 外呼'); h.page.query();
  assert.deepEqual(Array.from(h.page.captureNavigationState().queryPlan.requests, row => row.endpoint), ['cc/list_cdr_auto_task']);
  h.page.setType('全部'); h.page.query();
  assert.deepEqual(Array.from(h.page.captureNavigationState().queryPlan.requests, row => row.endpoint).sort(), ['cc/list_cdr_auto_task', 'cc/list_cdr_ib', 'cc/list_cdr_ob', 'cc/list_cdr_predictive_call'].sort());
  assert.deepEqual(h.toasts, []);
});

check('通话列表按实际话单日期筛选，缺失原始时间不回填本地日期', () => {
  const h = setup();
  h.c.CloudCallData.calls = [
    record('manual', { status: 3, startTime: start }, { callId: 'ACTUAL-IN-RANGE', ringingAt: '2001-01-01 00:00:00' }),
    record('manual', { status: 3, startTime: start - 86400 }, { callId: 'ACTUAL-OUT-RANGE', ringingAt: time(start) }),
    record('manual', { status: 3, startTime: null }, { callId: 'ACTUAL-MISSING-TIME', ringingAt: time(start) })
  ];
  h.nodes.set('recordStart', { value: time(start - 60).replace(' ', 'T') }); h.nodes.set('recordEnd', { value: time(end + 60).replace(' ', 'T') });
  h.page.query(); const html = h.page.render({ preserveContext: true });
  includes(html, ['ACTUAL-IN-RANGE']); excludes(html, ['ACTUAL-OUT-RANGE', 'ACTUAL-MISSING-TIME']);
});

console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', count: checks.length, checks, failures, sourceFiles: ['API-317.txt', 'API-318.txt', 'API-319.txt', 'API-362.txt'], network: false }, null, 2));
if (failures.length) process.exitCode = 1;
