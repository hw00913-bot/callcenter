/* Focused offline checks for fixture selection, response precedence and chat HTML.
 * Loads the shipped mock data, media component, field parser and escape helper.
 * Browser media playback, layout and the application's authorization engine are
 * outside this harness; authorization is supplied as an explicit scoped boundary.
 */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), checks = [], failures = [];
const clone = value => structuredClone(value);
function check(name, run) {
  try { run(); checks.push(name); }
  catch (error) { failures.push({ name, message: error.message, stack: error.stack }); }
}
function setup() {
  const storage = () => {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
  };
  const state = { activeDomain: 'CLOUD_CONTACT_CENTER', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', authorized: true, accountId: 'QA' };
  const c = { URL, Date, JSON, structuredClone, console, state, localStorage: storage(), sessionStorage: storage() };
  c.window = c;
  c.addEventListener = () => {};
  c.document = { addEventListener: () => {} };
  c.AppState = {
    get: () => state,
    authorizeObject: (_action, row) => state.authorized && row.tenantId === state.tenantId && row.enterpriseId === state.enterpriseId,
    subscribe: () => {}
  };
  vm.createContext(c);
  for (const file of [
    'mock/data.js', 'mock/demo-kit.js',
    'mock/demo-resources.js', 'mock/demo-activity.js', 'mock/call-media.js',
    'js/components/platform-ui.js', 'js/components/alicti-fields.js', 'js/components/call-media.js'
  ]) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c, { filename: file });
  c.find = predicate => {
    const call = c.CloudCallData.calls.find(predicate);
    assert(call, 'required shipped call fixture was not found');
    return clone(call);
  };
  c.connected = kind => c.find(call => call.tenantId === 'TEN-NISSAN-HQ' && call.demoPack === 'alicti-showcase-v1' &&
    call.alictiCdr?.kind === kind && call.result === '接通' && !!call.endedAt &&
    (kind === 'automatic' || Number(call.alictiCdr.raw.bridgeDuration) > 0));
  c.resolve = call => c.CloudCallMedia.resolve(call);
  c.render = call => c.CloudCallMedia.render(call);
  return c;
}
function assertNoText(c, call) {
  const model = c.resolve(call), html = c.render(call);
  assert.equal(model.segments.length, 0);
  assert(!html.includes('data-segment='), 'unavailable text rendered a conversation');
  return model;
}
function assertTextOnly(c, call, model = c.resolve(call)) {
  assert(model.segments.length > 0 && model.segments.length <= 15);
  assert.equal(model.url, '');
  assert.equal(model.status, '演示无录音');
  assert.equal(model.demo, false, 'text fixture must not present itself as audio');
  assert.equal(model.canRefreshTranscript, false);
  const html = c.render(call);
  assert(!html.includes('<audio'));
  assert(!html.includes('call-media-play'));
  assert(!html.includes('刷新通话文本'));
}
function response(text, monitorSide = '1', extra = {}) {
  return { result: '0', data: [{ monitorSide, text: JSON.stringify([{ text }]), botText: '[]' }], ...extra };
}

for (const kind of ['manual', 'predictive', 'inbound', 'automatic']) {
  check(`${kind}：当前已接通 SHOWCASE 使用独立文本样例，无音频或刷新入口`, () => {
    const c = setup(), call = c.connected(kind), before = JSON.stringify(c.CloudCallData.calls);
    const model = c.resolve(call);
    assertTextOnly(c, call, model);
    assert.equal(model.transcriptDemo, true);
    assert.equal(model.transcriptStatus, '已提供');
    assert.equal(c.CloudCallMediaFixtures[call.callId].transcriptOnly, true);
    assert.equal(JSON.stringify(c.CloudCallData.calls), before, 'view must not create or rewrite call records');
    if (kind === 'automatic') assert(model.segments.every(segment => segment.role === '机器人'));
    else {
      assert(model.segments.some(segment => segment.role === '客户'));
      assert(model.segments.some(segment => segment.role === '坐席'));
    }
  });
  check(`${kind}：恢复的旧日期 SHOWCASE 也能显示对话，且保持原话单`, () => {
    const c = setup(), call = c.connected(kind), cohort = call.demoCohort;
    for (const key of ['callId', 'contactId', 'customerTaskItemId', 'taskId']) if (call[key]) call[key] = call[key].replace(cohort, '20260916');
    call.demoCohort = '20260916'; call.alictiCdr.raw.mainUniqueId = call.callId;
    const before = JSON.stringify(call);
    assertTextOnly(c, call);
    assert.equal(JSON.stringify(call), before);
  });
}

check('人工外呼按线索、售后、活动采用不同对话，所有模板最多八条', () => {
  const c = setup(), texts = new Set();
  for (const category of ['LEAD', 'AFTERSALES', 'ACTIVITY']) {
    const call = c.find(row => row.callId.includes(`-MANUAL-${category}-C01-CALL-1`) && row.tenantId === c.state.tenantId);
    const model = c.resolve(call);
    assert.equal(model.segments.length, 8);
    texts.add(model.segments.map(segment => segment.text).join('\n'));
  }
  assert.equal(texts.size, 3);
});

check('未接通、结果未知、尚未结束和客户接通但坐席未接均无虚构对话', () => {
  const c = setup();
  const cases = [
    c.find(call => call.tenantId === c.state.tenantId && call.demoPack === 'alicti-showcase-v1' && call.result === '未接通'),
    c.find(call => call.tenantId === c.state.tenantId && call.demoPack === 'alicti-showcase-v1' && call.result === '待确认'),
    c.find(call => call.tenantId === c.state.tenantId && call.demoPack === 'alicti-showcase-v1' && !call.endedAt),
    c.find(call => call.tenantId === c.state.tenantId && call.alictiCdr?.kind === 'predictive' && call.alictiCdr.raw.status === 42)
  ];
  for (const call of cases) assertNoText(c, call);
});

check('已注册样例后纠正接通结果会清除旧文本，不能继续展示原气泡', () => {
  const c = setup(), call = c.connected('predictive');
  assert(c.resolve(call).segments.length);
  call.result = '未接通'; call.alictiCdr.raw.status = 40;
  assertNoText(c, call);
  assert.equal(c.CloudCallMediaFixtures[call.callId], undefined);
});

check('ID、日期、租户、企业与原始话单身份不匹配时不能借用样例', () => {
  const mutations = [
    call => { call.callId = 'UNRELATED-CALL'; },
    call => { call.demoCohort = '20260101'; },
    (call, c) => { call.tenantId = c.state.tenantId = 'TEN-NISSAN-SH'; },
    (call, c) => { call.enterpriseId = c.state.enterpriseId = '9999999'; },
    call => { call.alictiCdr.raw.mainUniqueId = 'OTHER-CALL'; },
    call => { call.alictiCdr.raw.enterpriseId = 9999999; },
    call => { call.alictiCdr.mock = false; },
    call => { call.alictiCdr.kind = 'predictive'; },
    call => { call.demoPack = 'unrelated-pack'; }
  ];
  for (const mutate of mutations) {
    const c = setup(), call = c.connected('manual');
    assert(c.resolve(call).segments.length);
    mutate(call, c);
    assertNoText(c, call);
  }
});

check('拒绝授权、跨当前租户/企业或切换业务域时，不注册也不展示对话', () => {
  for (const patch of [{ authorized: false }, { tenantId: 'TEN-NISSAN-SH' }, { enterpriseId: '9999999' }, { activeDomain: 'OTHER_DOMAIN' }]) {
    const c = setup(), call = c.connected('manual');
    Object.assign(c.state, patch);
    const model = assertNoText(c, call);
    assert.equal(model.status, '无权查看');
    assert.equal(c.CloudCallMediaFixtures[call.callId], undefined);
  }
});

check('仅历史摘要、普通本地模拟和未登记呼叫不补录音或通话文本', () => {
  for (const patch of [{ directoryMeta: { legacyOnly: true } }, { callSource: 'NATIVE_WORKBENCH' }, { callId: 'LOCAL-NEW-CALL' }]) {
    const c = setup(), call = { ...c.connected('manual'), ...patch, recordingStatus: '可播放', recordingUrl: 'assets/audio/manual-followup-demo.wav' };
    const model = assertNoText(c, call);
    assert.equal(model.url, '');
  }
});

for (const [label, value, expected] of [
  ['失败', { result: -1, description: '明确查询失败' }, '文本获取失败'],
  ['空返回', { result: 0, data: [] }, '暂无通话文本'],
  ['undefined 属性', undefined, '文本状态待核对'],
  ['null 属性', null, '文本状态待核对'],
  ['格式损坏', { result: 0, data: [{ monitorSide: 1, text: '损坏的 JSON' }] }, '文本数据待核对']
]) {
  check(`明确 alictiRasr ${label}不回落到旧演示文本`, () => {
    const c = setup(), call = c.connected('manual');
    assert(c.resolve(call).segments.length);
    call.alictiRasr = value;
    const model = assertNoText(c, call);
    assert.equal(model.transcriptStatus, expected);
    assert.equal(model.transcriptDemo, false);
  });
}

check('已有真实文本与 uniqueId 优先于已注册样例，不改原响应或演示音频状态', () => {
  const c = setup(), call = c.connected('manual');
  assert(c.resolve(call).segments.length);
  call.uniqueId = 'SUPPLIER-RASR-EXACT';
  call.alictiRasr = response('这一条来自明确提供的文本。', '2', { enterpriseId: call.enterpriseId, uniqueId: call.uniqueId });
  const before = JSON.stringify(call), model = c.resolve(call);
  assert.equal(model.segments.length, 1);
  assert.equal(model.segments[0].text, '这一条来自明确提供的文本。');
  assert.equal(model.segments[0].role, '客户');
  assert.equal(model.transcriptDemo, false);
  assert.equal(model.transcriptRequest.fields.uniqueId, call.uniqueId);
  assertTextOnly(c, call, model);
  assert.equal(JSON.stringify(call), before);
});

check('真实记录没有演示标记时，使用其独立响应且不合成媒体', () => {
  const c = setup(), call = { callId: 'REAL-CALL', tenantId: c.state.tenantId, enterpriseId: c.state.enterpriseId, uniqueId: 'REAL-RASR', alictiRasr: response('原始客户文本', '2') };
  const model = c.resolve(call);
  assert.equal(model.segments[0].text, '原始客户文本');
  assert.equal(model.transcriptDemo, false);
  assert.equal(model.url, '');
  assert.equal(model.canRefreshTranscript, false);
  assert.equal(c.CloudCallMediaFixtures[call.callId], undefined);
});

check('返回的企业或唯一标识与请求不一致时，既不显示错话单也不回落样例', () => {
  for (const extra of [{ enterpriseId: '9999999' }, { uniqueId: 'WRONG-RASR' }]) {
    const c = setup(), call = c.connected('manual');
    call.uniqueId = 'CORRECT-RASR'; call.alictiRasr = response('不可展示', '1', extra);
    assert.equal(assertNoText(c, call).transcriptStatus, '文本数据待核对');
  }
});

check('客户、坐席、机器人、未知角色各用对应气泡，正文中的 HTML 只显示文本', () => {
  const c = setup(), call = c.connected('manual');
  const unsafe = '<img src=x onerror="alert(1)"> & \'客户\'';
  call.alictiRasr = { result: 0, data: [
    { monitorSide: '2', text: JSON.stringify([{ text: unsafe }]) },
    { monitorSide: '1', text: JSON.stringify([{ text: '坐席回答' }]) },
    { monitorSide: '1', botText: JSON.stringify([{ text: '机器人播报' }]) },
    { monitorSide: '99', text: JSON.stringify([{ text: '尚未识别说话方' }]) }
  ] };
  const model = c.resolve(call), html = c.render(call);
  assert.equal(model.segments.map(segment => segment.role).join('|'), '客户|坐席|机器人|说话方未知');
  for (const role of ['customer', 'agent', 'robot', 'unknown']) assert(html.includes(`class="call-transcript-row ${role}"`));
  assert.equal((html.match(/class="call-transcript-bubble"/g) || []).length, 4);
  assert.equal((html.match(/class="call-transcript-avatar"/g) || []).length, 4);
  assert(html.includes('aria-label="对话记录"'));
  assert(html.includes(c.PlatformUI.escape(unsafe)));
  assert(!html.includes('<img'));
  assert(!html.includes('说话方未知</strong></div><p class="call-transcript-bubble">坐席'));
});

check('原有明确标注的合成录音样例仍可播放，且其样例查询入口保持可用', () => {
  const c = setup(), call = c.find(row => row.callId === 'CALL-MAN-1001');
  const model = c.resolve(call), html = c.render(call);
  assert.equal(model.url, 'assets/audio/manual-followup-demo.wav');
  assert.equal(model.status, '演示音频');
  assert.equal(model.demo, true);
  assert.equal(model.canRefreshTranscript, true);
  assert(html.includes('<audio'));
  assert(html.includes('刷新通话文本'));
});

console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', scope: 'local call transcript fixtures, parsing, authorization boundary and chat HTML; no supplier requests', count: checks.length, checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
