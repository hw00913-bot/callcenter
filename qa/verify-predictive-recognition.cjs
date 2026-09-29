/* D-053: local CDR interpretation only; no polling, provider events, or writes. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..'), checks = [], failures = [], context = { console, Date };
context.window = context;
context.setTimeout = context.setInterval = context.fetch = () => { throw Error('Recognition must not start a timer or network request'); };
context.AliCtiRetry = new Proxy({}, { get() { throw Error('Reading recognition must not start or configure retries'); } });
vm.createContext(context);
for (const name of ['alicti-fields', 'alicti-number-status', 'call-state', 'alicti-report-facts', 'report-metrics']) vm.runInContext(fs.readFileSync(path.join(root, 'js/components', name + '.js'), 'utf8'), context, { filename: name });
const recognition = context.AliCtiNumberStatus;
function check(name, fn) { try { fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.message }); } }
function row(raw = {}, extra = {}) { return { enterpriseId: '7522240', tenantId: 'TEN-HQ', callId: 'LOCAL-1', contactId: 'MAIN-1', callType: '预外呼', result: '未接通', endedAt: '2026-09-20 12:00:00', ...extra, alictiCdr: { kind: 'predictive', raw: { enterpriseId: 7522240, mainUniqueId: 'MAIN-1', status: 40, startTime: 1790000000, endTime: 1790000010, ...raw } } }; }
check('字典保留官方重复编码原文，预测异步标识元数据采用 D053 且不外推其他类型', () => {
  const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'mock/alicti-number-status.json'), 'utf8'));
  assert.equal(JSON.stringify(dictionary.rows), JSON.stringify(recognition.rows));
  assert.equal(dictionary.rows.length, 20);
  assert.equal(dictionary.contracts.predictive.asyncFlagMeanings['0'], 'synchronous');
  assert.equal(dictionary.contracts.predictive.asyncFlagMeanings['1'], 'asynchronously_written_back_to_sipCause');
  assert.equal(dictionary.contracts.predictive.delayIsSla, false);
  assert.equal(dictionary.contracts.predictive.recognitionCanRemainUnknown, true);
  assert(!dictionary.contracts.manual.asyncFlagMeanings);
});
check('数字和字符串 0 均表示同步；不生成等待状态或完成截止时间', () => {
  for (const flag of [0, '0']) {
    const record = row({ sipCauseAsyncUpdateFlag: flag }), result = recognition.read(record);
    assert.strictEqual(result.asyncUpdateFlag, flag);
    assert.equal(result.asyncUpdateMode, 'synchronous');
    assert.equal(result.asyncUpdateLabel, '同步识别');
    assert.equal(result.status, 'missing');
    assert.equal(context.CallState.view(record).answered, false);
    assert(!Object.hasOwn(result, 'pendingUntil')); assert(!Object.hasOwn(result, 'deadline'));
  }
});
check('数字和字符串 1 表示已异步写回，号码结果来自同通 sipCause', () => {
  for (const flag of [1, '1']) {
    const result = recognition.read(row({ sipCause: 714, obSipCause: '关机', sipCauseAsyncUpdateFlag: flag }));
    assert.strictEqual(result.asyncUpdateFlag, flag); assert.equal(result.asyncUpdateMode, 'asynchronously_written_back_to_sipCause');
    assert.equal(result.code, '714'); assert.equal(result.description, '关机');
  }
});
check('已异步写回不保证结果可识别；空值、未知码和官方一对多编码仍保留', () => {
  for (const [raw, status] of [[{}, 'missing'], [{ sipCause: 999, obSipCause: '供应商未知结果' }, 'unknown'], [{ sipCause: 715 }, 'ambiguous'], [{ sipCause: 183 }, 'ambiguous']]) {
    const result = recognition.read(row({ ...raw, sipCauseAsyncUpdateFlag: 1 }));
    assert.equal(result.asyncUpdateMode, 'asynchronously_written_back_to_sipCause'); assert.equal(result.status, status);
    assert.strictEqual(result.rawCode, raw.sipCause);
  }
});
check('标识未知或缺失不归零、不阻止采用已有号码编码', () => {
  for (const flag of [undefined, null, '', false, true, 2, -1, '01', ' 1 ', [], {}]) {
    const result = recognition.read(row({ sipCause: 710, sipCauseAsyncUpdateFlag: flag }));
    assert.strictEqual(result.asyncUpdateFlag, flag); assert.equal(result.code, '710'); assert.equal(result.status, 'recognized');
    assert(!['synchronous', 'asynchronously_written_back_to_sipCause'].includes(result.asyncUpdateMode));
  }
});
check('同步与异步标识均不能确定客户或坐席接通', () => {
  for (const flag of [0, 1]) {
    const record = row({ status: undefined, sipCause: 719, sipCauseAsyncUpdateFlag: flag }, { result: '待确认' });
    const view = context.CallState.view(record);
    assert.equal(view.answered, null); assert.equal(view.agentAnswered, null);
    assert.equal(view.numberStatus.code, '719');
  }
});
check('识别为空或矛盾不覆盖已接通事实、通话时长和任务结果', () => {
  for (const flag of [0, 1]) {
    const record = row({ status: 43, upTime: 1790000001, bridgeTime: 1790000002, bridgeDuration: 8, sipCause: 714, sipCauseAsyncUpdateFlag: flag });
    const before = JSON.stringify(record), view = context.CallState.view(record);
    assert.equal(view.answered, true); assert.equal(view.agentAnswered, true); assert.equal(context.CloudReportMetrics.recordedSeconds(record), 8);
    assert.equal(JSON.stringify(record), before);
  }
});
check('异步标识不应用到人工外呼、自动外呼或呼入话单', () => {
  for (const kind of ['manual', 'automatic', 'inbound']) {
    const result = recognition.fromCdr(kind, { sipCause: 714, sipCauseCode: 710, sipCauseAsyncUpdateFlag: 1 });
    assert.equal(result.asyncUpdateMode, 'not-applicable'); assert.equal(result.asyncUpdateFlag, undefined);
    assert.equal(result.code, kind === 'manual' ? '710' : '');
  }
});
check('自动外呼和呼入不得借错误的预测话单类型显示预测号码识别', () => {
  for (const callType of ['IVR 外呼', '自动外呼', '呼入', '人工外呼']) {
    const result = recognition.read(row({ sipCause: 714, sipCauseAsyncUpdateFlag: 1 }, { callType }));
    assert.equal(result.status, 'context-mismatch'); assert.equal(result.code, ''); assert.equal(result.asyncUpdateFlag, undefined);
  }
});
check('外部账号结果不进入本通识别结果，原始负载仍可核对且未修改', () => {
  const record = row({ enterpriseId: '9999999', sipCause: 714, sipCauseAsyncUpdateFlag: 1 }), before = JSON.stringify(record);
  const view = context.CallState.view(record);
  assert.equal(view.numberStatus.code, ''); assert.equal(view.numberStatus.status, 'context-mismatch'); assert.equal(view.reasonLabel, '待确认');
  assert.strictEqual(view.numberStatus.raw, record.alictiCdr.raw); assert.equal(view.numberStatus.raw.sipCause, 714);
  assert.equal(JSON.stringify(record), before);
});
check('供应商账号显式映射优先于本地账号，数字和字符串账号可匹配', () => {
  const record = row({ sipCause: 710 }, { enterpriseId: 'LOCAL-ENTERPRISE', providerEnterpriseId: '7522240' });
  assert.equal(recognition.read(record).code, '710');
});
check('缺少账号归属时不能采用响应中任意账号的号码结果', () => {
  const record = row({ sipCause: 714 }); delete record.enterpriseId;
  assert.equal(recognition.read(record).status, 'context-mismatch');
});
check('已知主通话、请求、供应商通话和唯一标识冲突均拒绝采用结果', () => {
  for (const [key, localKey] of [['mainUniqueId', 'providerMainUniqueId'], ['requestUniqueId', 'requestUniqueId'], ['callId', 'providerCallId'], ['uniqueId', 'providerUniqueId']]) {
    const record = row({ [key]: 'OTHER', sipCause: 710, sipCauseAsyncUpdateFlag: 1 }, { [localKey]: 'EXPECTED' });
    assert.equal(recognition.read(record).status, 'context-mismatch'); assert.equal(recognition.read(record).code, '');
  }
});
check('供应商标识保持字符串，不把前导零或数字型标识合并', () => {
  for (const value of ['12', 12, '0012 ']) {
    const record = row({ uniqueId: value, sipCause: 710 }, { providerUniqueId: '0012' });
    assert.equal(recognition.read(record).status, 'context-mismatch');
  }
  assert.equal(recognition.read(row({ uniqueId: '0012', sipCause: 710 }, { providerUniqueId: '0012' })).code, '710');
});
check('本地记录编号与供应商 callId 不混为同一标识', () => {
  const record = row({ callId: 'SUPPLIER-CALL', sipCause: 710 });
  assert.equal(recognition.read(record).code, '710');
  record.providerCallId = 'SUPPLIER-CALL'; assert.equal(recognition.read(record).code, '710');
});
check('本地 contactId 与供应商 mainUniqueId 不混用，显式主通话映射仍严格核对', () => {
  const record = row({ mainUniqueId: 'PROVIDER-MAIN', sipCause: 710 }, { contactId: 'LOCAL-SESSION' });
  context.CallState.start(record, { at: 1790000000000 });
  assert.equal(record.telephony.contactId, 'LOCAL-SESSION');
  assert.equal(recognition.read(record).code, '710');
  for (const key of ['mainUniqueId', 'providerMainUniqueId']) {
    record[key] = 'PROVIDER-MAIN'; assert.equal(recognition.read(record).code, '710');
    record[key] = 'OTHER'; assert.equal(recognition.read(record).status, 'context-mismatch'); delete record[key];
  }
  assert.equal(record.contactId, 'LOCAL-SESSION'); assert.equal(record.alictiCdr.raw.mainUniqueId, 'PROVIDER-MAIN');
});
check('没有返回账号标识时保留已绑定话单及明确本地演示的可读能力', () => {
  const record = row({ enterpriseId: undefined, sipCause: 710 }); assert.equal(recognition.read(record).code, '710');
  record.alictiCdr = recognition.demoCdr('predictive', 718); assert.equal(recognition.read(record).code, '718'); assert.equal(recognition.read(record).mock, true);
});
check('同一通供应商结果后来变化仅重读原行；重复读取无新话单、重呼或计数变更', () => {
  const record = row({ sipCause: 183, sipCauseAsyncUpdateFlag: 0 }), calls = [record], tasks = [{ id: 'T', completed: 1, retry: 0 }];
  const first = recognition.read(record); assert.equal(first.status, 'ambiguous');
  // A caller supplies a later returned CDR. This test does not fabricate a
  // provider event/polling API or claim a production upsert implementation.
  record.alictiCdr.raw = { ...record.alictiCdr.raw, sipCause: 714, obSipCause: '关机', sipCauseAsyncUpdateFlag: 1 };
  const before = JSON.stringify({ calls, tasks });
  for (let attempt = 0; attempt < 3; attempt++) {
    assert.equal(recognition.read(record).code, '714'); assert.equal(context.CallState.view(record).answered, false);
    assert.equal(context.CloudReportMetrics.stats(calls).total, 1);
  }
  assert.equal(calls.length, 1); assert.equal(JSON.stringify({ calls, tasks }), before); assert.equal(first.raw.sipCause, 183);
});
check('不按经过一分钟或两分钟制造识别成功、识别失败或新的异步标识', () => {
  const record = row({ sipCauseAsyncUpdateFlag: 0 }); const before = JSON.stringify(record);
  for (const endedAt of ['2026-09-20 11:59:00', '2026-09-20 11:58:00', '2026-09-19 12:00:00']) {
    const result = recognition.read({ ...record, endedAt }); assert.equal(result.status, 'missing'); assert.equal(result.asyncUpdateMode, 'synchronous');
  }
  assert.equal(JSON.stringify(record), before);
});
check('异常原始响应不会当成正常已识别话单', () => {
  for (const raw of [null, undefined, 'invalid', []]) {
    const record = row(); record.alictiCdr.raw = raw; const result = recognition.read(record);
    assert.equal(result.status, 'context-mismatch'); assert.equal(result.code, ''); assert.strictEqual(result.raw, raw);
  }
});
console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', scope: 'local CDR interpretation, identity isolation and read-only late-data display; no provider integration', count: checks.length, checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
