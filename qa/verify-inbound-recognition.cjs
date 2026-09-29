/* Inbound softphone answer status and supplementary recognition; no provider calls. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..'), checks = [], failures = [], context = { console, Date };
context.window = context;
context.fetch = context.setTimeout = context.setInterval = () => { throw Error('No live recognition request or timer is expected'); };
vm.createContext(context);
for (const name of ['alicti-fields', 'alicti-number-status', 'call-state', 'alicti-report-facts', 'report-metrics']) vm.runInContext(fs.readFileSync(path.join(root, 'js/components', name + '.js'), 'utf8'), context, { filename: name });
const { AliCtiFields: fields, AliCtiNumberStatus: recognition, AliCtiReportFacts: facts, CallState: state, CloudReportMetrics: metrics } = context;
const start = 1790000000, end = start + 20;
function call(status, raw = {}, extra = {}) {
  return { callId: 'LOCAL-IB', contactId: 'LOCAL-SESSION', providerMainUniqueId: 'PROVIDER-IB', enterpriseId: '7522240', tenantId: 'HQ', callType: '呼入', direction: '呼入', bindType: 3,
    result: '待确认', ringingAt: start * 1000, endedAt: end * 1000, ...extra,
    alictiCdr: { kind: 'inbound', raw: { mainUniqueId: 'PROVIDER-IB', customerNumber: '13900000001', status, startTime: start, endTime: end, ...raw } } };
}
function check(name, fn) { try { fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.message }); } }
check('API-319 原文明确四个文字接听枚举，statusResult 和 statusRobot 是独立字段', () => {
  const source = fs.readFileSync(path.join(root, 'references/alicti/API-319.txt'), 'utf8');
  assert(source.includes('接听状态。枚举：人工接听，人工未接听，系统应答，系统未应答'));
  assert(source.includes('statusResult')); assert(source.includes('statusRobot'));
});
check('无号码识别时四个官方 status 仍分别决定客户与坐席事实', () => {
  for (const [status, customer, agent] of [['人工接听', true, true], ['人工未接听', null, false], ['系统应答', true, null], ['系统未应答', false, null]]) {
    const record = call(status), result = fields.normalizeCdr('inbound', record.alictiCdr.raw), view = state.view(record);
    assert.strictEqual(result.customerAnswered, customer); assert.strictEqual(result.agentAnswered, agent); assert.equal(result.status, '已归一');
    assert.strictEqual(view.answered, customer); assert.strictEqual(view.agentAnswered, agent);
    assert.equal(view.numberStatus.label, '—'); assert.equal(view.numberStatus.issues.length, 0);
  }
});
check('软电话识别未提供只显示中性空值，不展示待确认、未接通或失败编码', () => {
  const record = call('人工接听'), view = state.view(record);
  assert.equal(view.answerLabel, '已接通'); assert.equal(view.agentAnswered, true);
  assert.equal(view.numberStatus.label, '—'); assert.equal(view.numberStatus.code, '');
  assert(!/待确认|等待核对|异常|失败/.test(view.numberStatus.help));
  assert.equal(view.numberStatus.asyncUpdateMode, 'not-applicable');
});
check('没有话单的本地呼入示例也不因号码识别缺失增加待确认提示', () => {
  const record = call('人工接听'); delete record.alictiCdr;
  const result = recognition.read(record); assert.equal(result.label, '—'); assert.equal(result.issues.length, 0);
  assert.equal(state.view(record).answered, null); // No fabricated official answer.
});
check('原始呼入话单存在但 status 未知时仍未知，不从旧页面结果猜测', () => {
  for (const status of [undefined, null, '', '未知', '人工接听 ', 43, 3, '43']) {
    const record = call(status, {}, { result: '接通', durationSeconds: 999 }), view = state.view(record), report = metrics.state(record);
    assert.strictEqual(view.answered, null); assert.strictEqual(view.agentAnswered, null);
    assert.strictEqual(report.answered, null); assert.strictEqual(report.agentAnswered, null);
    assert.equal(report.known, false); assert.equal(view.numberStatus.label, '—');
  }
});
check('空话单或仅结束时间不会绕过归一化后沿用旧接通标签', () => {
  for (const raw of [{}, { endTime: end }, null, []]) {
    const record = call(undefined, {}, { result: '接通', durationSeconds: 999 }); record.alictiCdr.raw = raw;
    assert.equal(state.view(record).answered, null); assert.equal(metrics.state(record).answered, null);
  }
});
check('telephony 仅存在或残留接通标签不构成真实接听事件证据', () => {
  const record = call('未知', {}, { result: '接通', durationSeconds: 999 });
  state.start(record, { at: start * 1000 }); assert.equal(record.telephony.answerResult, 'UNKNOWN');
  assert.equal(record.telephony.customerEvidence.length, 0); assert.equal(state.view(record).answered, null);
  record.telephony.answerResult = 'ANSWERED'; record.telephony.customerEstablishedAt = (start + 1) * 1000;
  assert.equal(state.view(record).answered, null); assert.equal(metrics.state(record).answered, null);
});
check('本地真实演示接听回调保留正向证据，不被空或迟到未知话单覆盖', () => {
  for (const raw of [{}, { endTime: end }, { status: '未知', endTime: end }]) {
    const record = call(undefined); record.alictiCdr.raw = raw;
    state.start(record, { at: start * 1000 });
    state.ingest(record, { enterpriseId: '7522240', contactId: record.contactId, channelId: 'CUSTOMER', role: 'customer', type: 'established', at: (start + 1) * 1000, source: 'local-simulation' });
    assert.equal(record.telephony.customerEvidence.length, 1); assert.equal(state.view(record).answered, true);
    assert.equal(metrics.state(record).answered, true);
  }
});
check('呼入不采用人工或预测 sipCause 字段，额外原字段保持原样', () => {
  const record = call('人工接听', { sipCause: 714, sipCauseCode: 710, obSipCause: '关机', obSipCauseRaw: '占线', sipCauseAsyncUpdateFlag: 1 });
  const before = JSON.stringify(record), result = recognition.read(record), view = state.view(record);
  assert.equal(result.code, ''); assert.equal(result.codeField, ''); assert.equal(result.descriptionField, '');
  assert.equal(result.asyncUpdateFlag, undefined); assert.strictEqual(result.raw, record.alictiCdr.raw);
  assert.equal(result.raw.sipCause, 714); assert.equal(view.answered, true); assert.equal(view.agentAnswered, true);
  assert.equal(JSON.stringify(record), before);
});
check('呼叫结果文本和彩铃不能反推号码编码或改写接听状态', () => {
  for (const statusResult of ['彩铃', '停机', '振铃未接', '座席拒接', '已进IVR', '队列中放弃']) {
    const record = call('未知', { statusResult, statusRobot: '机器人应答' }), result = recognition.read(record);
    assert.equal(result.code, ''); assert.equal(state.view(record).answered, null); assert.equal(state.view(record).agentAnswered, null);
    assert.equal(record.alictiCdr.raw.statusResult, statusResult);
  }
});
check('呼入类型不能通过预测话单套用异步识别标识或号码编码', () => {
  const record = call('人工接听'); record.alictiCdr = { kind: 'predictive', raw: { status: 43, sipCause: 710, sipCauseAsyncUpdateFlag: 1 } };
  assert.equal(recognition.read(record).status, 'context-mismatch'); assert.equal(recognition.read(record).code, '');
  assert.equal(facts.read(record).usable, false); assert.equal(metrics.stats([record]).total, 0);
});
check('身份错配仍保留校验异常，不被中性缺识别展示掩盖', () => {
  for (const raw of [{ enterpriseId: '9999999' }, { mainUniqueId: 'FOREIGN' }]) {
    const record = call('人工接听', raw); assert.equal(recognition.read(record).status, 'context-mismatch');
    assert.equal(facts.read(record).usable, false); assert.equal(metrics.stats([record]).total, 0);
  }
});
check('软电话人工接听完整计入报表，不因号码识别缺失损失接听和时长', () => {
  const record = call('人工接听', { answerTime: start + 1, bridgeTime: start + 2, bridgeDuration: 18 }), before = JSON.stringify(record);
  const summary = metrics.stats([record]); assert.equal(summary.total, 1); assert.equal(summary.connected, 1);
  assert.equal(summary.humanConnected, 1); assert.equal(summary.humanPending, 0); assert.equal(summary.pending, 0);
  assert.equal(metrics.humanSeconds(record), 18); assert.equal(JSON.stringify(record), before);
});
check('系统应答不是人工接听，明确人工未接听仍单独计数', () => {
  const system = call('系统应答'), missed = call('人工未接听', {}, { callId: 'LOCAL-IB-2' });
  assert.equal(metrics.stats([system]).connected, 1); assert.equal(metrics.stats([system]).humanConnected, 0);
  assert.equal(metrics.humanAnswer(system), null); assert.equal(metrics.humanAnswer(missed), false);
  assert.equal(metrics.stats([missed]).humanUnanswered, 1);
});
check('识别缺失不会让已最终归集的正常呼入重新进入待确认或生成异常', () => {
  const record = call('人工接听', { answerTime: start + 1, bridgeTime: start + 2 });
  state.start(record, { at: start * 1000 });
  state.ingest(record, { enterpriseId: '7522240', contactId: record.contactId, channelId: 'CUSTOMER', role: 'customer', type: 'established', at: (start + 1) * 1000 });
  state.ingest(record, { enterpriseId: '7522240', contactId: record.contactId, channelId: 'AGENT', role: 'agent', type: 'established', at: (start + 2) * 1000 });
  state.finish(record, { at: end * 1000 });
  const before = JSON.stringify(record), view = state.view(record);
  assert.equal(view.answered, true); assert.equal(view.agentAnswered, true); assert.equal(view.numberStatus.label, '—');
  assert.equal(view.issues.length, 0); assert.equal(view.numberStatus.issues.length, 0); assert.equal(JSON.stringify(record), before);
});
check('其他呼叫类型缺失识别仍沿用原有展示，不改变预测同步与异步含义', () => {
  for (const kind of ['manual', 'predictive', 'automatic']) assert.equal(recognition.fromCdr(kind, {}).label, '待确认');
  assert.equal(recognition.fromCdr('predictive', { sipCauseAsyncUpdateFlag: 0 }).asyncUpdateMode, 'synchronous');
  assert.equal(recognition.fromCdr('predictive', { sipCauseAsyncUpdateFlag: 1 }).asyncUpdateMode, 'asynchronously_written_back_to_sipCause');
});
console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', scope: 'local inbound status, supplementary recognition display, identity boundaries and report facts; no supplier integration', count: checks.length, checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
