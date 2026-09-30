/* Execute the queue detail UI and official field contracts. Fake only browser
 * surfaces and the persistence boundary to exercise recovery and access changes. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.join(__dirname, '..'), checks = [];
const clone = value => JSON.parse(JSON.stringify(value));
function setup(options = {}) {
  const nodes = new Map(), listeners = [], subscribers = [], writes = [], toasts = [];
  let scope = 'scope-A', visible = true, storageError = '', editable = true, dirty = false, revision = 4, fail = false, refreshes = 0;
  const queue = { enterpriseId: '7522240', tenantId: 'TENANT-QA', qno: '0012', name: '销售接听队列', strategy: 'leastrecent', weight: 1, queueTimeout: 600, memberTimeout: 25, wrapupTime: 30, maxLen: 0, musicClass: 'default', sayAgentno: false, retry: 5, serviceLevel: 10, vipSupport: 0, joinEmpty: 0, announceSound: 0, announcePosition: 0, announcePositionFrequency: 0 };
  if (options.legacy) for (const key of ['musicClass', 'sayAgentno', 'retry', 'serviceLevel', 'vipSupport', 'joinEmpty', 'announceSound', 'announcePosition', 'announcePositionFrequency']) delete queue[key];
  function close(id) { for (const key of nodes.get(id)?.children || []) nodes.delete(key); nodes.delete(id); }
  function node(id, props = {}) { const value = { id, hidden: false, innerHTML: '', textContent: '', scrollIntoView() {}, ...props }; nodes.set(id, value); return value; }
  function notify() { subscribers.forEach(callback => callback()); }
  function describe(qno) {
    if (qno !== queue.qno || !visible || storageError) return null;
    return { queue: clone(queue), tenantName: '上海门店', binding: options.bound === false ? null : { qno: queue.qno },
      groups: options.multi ? [{name:'销售团队',physicalGroupId:'GROUP-QA'}, {name:'售后关怀',physicalGroupId:'GROUP-AFTER'}] : undefined,
      group: options.bound === false ? null : { name: '销售团队', physicalGroupId: 'GROUP-QA', tenantId: queue.tenantId, enterpriseId: queue.enterpriseId },
      memberComparison: { actual: [{ name: '李四', cno: '0012' }, { name: '外部坐席姓名不应泄漏', cno: '9999', restricted: true }], expected: [{ name: '李四', cno: '0012' }], missing: [], extra: [] },
      skillComparison: options.bound === false ? null : { matched: true }, status: options.bound === false ? 'unbound' : 'matched', statusLabel: options.bound === false ? '未关联' : '成员一致',
      checkedAt: options.bound === false ? '' : '2026-09-18T00:00:00.000Z', message: '成员一致', revision, editable,
      blockedReason: editable ? '' : '该技能组有坐席正在通话，请完成后再调整接听队列' };
  }
  const ctx = {
    console, structuredClone, Date, Map, Set, Object, Array, JSON, Number, String,
    document: { getElementById: id => nodes.get(id) || null },
    location: { hash: '#queues' }, history: { state: {}, pushState(_state, _title, hash) { ctx.location.hash = hash; } },
    AppState: { setDirty(value) { dirty = value; notify(); }, subscribe(callback) { subscribers.push(callback); } },
    PlatformUI: {
      confirm(options) { node(options.id, { options }); },
      escape: value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])),
      openLayer(id, html, size, navigation) { close(id); const children = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]); node(id, { html, size, navigation, children }); children.forEach(key => node(key, { hidden: key === 'queue-detail-confirm' })); },
      closeLayer: close
    },
    AliCtiQueues: {
      contextKey: () => scope, canAccess: () => visible, storageError: () => storageError, describeQueue: describe,
      updateByNumber(qno, payload, expectedContext, expectedRevision) {
        if (fail) return { ok: false, message: '保存失败，原记录已保留' };
        if (expectedContext !== scope || expectedRevision !== revision || !visible) return { ok: false, message: '队列已更新，请重新打开配置' };
        writes.push({ qno, payload: clone(payload), expectedContext, expectedRevision }); Object.assign(queue, payload); revision++;
        return { ok: true, message: '队列已保存', revision };
      }
    },
    RouteRuntime: { refreshCurrent() { refreshes++; if (options.refreshCloses) close('queue-detail'); } },
    showToast(message, level) { toasts.push({ message, level }); },
    addEventListener(type, callback, capture) { listeners.push({ type, callback, capture: !!capture }); },
    fetch() { throw Error('Queue details must not make real network calls'); }
  };
  ctx.window = ctx; vm.createContext(ctx);
  for (const name of ['alicti-queue-contracts', 'queue-detail']) vm.runInContext(fs.readFileSync(path.join(root, 'js/components/' + name + '.js'), 'utf8'), ctx, { filename: name });
  return { ctx, nodes, writes, toasts, queue, get dirty() { return dirty; }, get refreshes() { return refreshes; },
    open(edit = true) { return ctx.QueueDetail.open(queue.qno, edit, scope); }, html() { return nodes.get('queue-detail')?.html || ''; },
    fail(value = true) { fail = value; }, storageFailure(value = '读取失败') { storageError = value; notify(); },
    busy(value = true) { editable = !value; notify(); }, revisionChange() { revision++; },
    scopeChange() { scope = 'scope-B'; notify(); }, revoke() { visible = false; notify(); }, removeLayer() { close('queue-detail'); },
    event(type) { const event = { prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } }; for (const entry of listeners.filter(item => item.type === type).sort((a,b) => Number(b.capture) - Number(a.capture))) { entry.callback(event); if (event.stopped) break; } return event; }
  };
}
function check(name, run) { run(); checks.push(name); }

check('查看仅展示归属、设置、供应商成员及已有核对状态，没有管理入口', () => {
  const f = setup(); f.open(false); const html = f.html();
  for (const value of ['队列详情', '上海门店', '销售团队', '7522240', '0012', '队列返回成员', '成员核对', '成员一致']) assert(html.includes(value));
  assert.doesNotMatch(html, /<(?:input|select|textarea)\b|QueueDetail\.(?:save|setField)|QueueConfig\.|实时在线|新增租户|管理租户/);
  f.ctx.QueueDetail.setField('name', '禁止编辑'); assert.equal(f.ctx.QueueDetail.save(), false); assert.equal(f.writes.length, 0);
});
check('多技能队列详情完整展示全部关联名称并标注去重核对', () => { const f=setup({multi:true}); f.open(false); assert.match(f.html(), /销售团队、售后关怀/); assert.match(f.html(), /所选技能(?:组)?成员（去重）/); assert.doesNotMatch(f.html(), /新增租户|管理租户/); });
check('成员受限时不泄漏坐席姓名及工号', () => { const f = setup(); f.open(false); assert.match(f.html(), /无法核对的坐席/); assert.doesNotMatch(f.html(), /外部坐席姓名|9999/); });
check('未关联队列独立可编辑并只展示供应商已有成员', () => { const f = setup({ bound: false }); f.open(); assert.match(f.html(), /尚未关联技能(?:组)?/); assert.doesNotMatch(f.html(), /成员核对|技能组成员及差异/); f.ctx.QueueDetail.setField('name', '后备队列'); assert.equal(f.ctx.QueueDetail.save(), true); assert.equal(f.queue.name, '后备队列'); });
check('按原始字符串编号查询，不接受数值或其他编号', () => { const f = setup(); assert.equal(f.ctx.QueueDetail.open(12, true), false); assert.equal(f.ctx.QueueDetail.open('12', true), false); assert.equal(f.nodes.has('queue-detail'), false); f.open(); assert.match(f.html(), /value="0012" disabled/); });
check('旧工作范围链接拒绝打开', () => { const f = setup(); assert.equal(f.ctx.QueueDetail.open('0012', true, 'old-scope'), false); assert.equal(f.nodes.size, 0); });
check('忙碌队列可查看但不允许打开编辑', () => { const f = setup(); f.busy(); assert.equal(f.open(), false); assert.equal(f.open(false), true); assert.match(f.html(), /正在通话/); });
check('关闭按钮由统一右侧抽屉处理并保留对象标识', () => { const f = setup(); f.open(); assert.equal(f.nodes.get('queue-detail').size, 'wide'); assert.equal(f.nodes.get('queue-detail').navigation.objectKey, '7522240:0012'); assert.match(f.html(), /aria-label="关闭" onclick="QueueDetail.close\(\)"/); });
check('只有变更字段发给服务，保留前导零，不回写未知供应商配置', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('weight', '7'); assert.equal(f.ctx.QueueDetail.save(), true); assert.deepEqual(f.writes[0], { qno: '0012', payload: { weight: 7 }, expectedContext: 'scope-A', expectedRevision: 4 }); assert.equal(f.dirty, false); });
check('未修改保存不发写请求，恢复原值清除草稿标记', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('weight', '2'); assert.equal(f.dirty, true); f.ctx.QueueDetail.setField('weight', '1'); assert.equal(f.dirty, false); assert.equal(f.ctx.QueueDetail.save(), true); assert.equal(f.writes.length, 0); });
check('队列编号与本期不开放字段无法通过表单改写', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('qno', '12'); f.ctx.QueueDetail.setField('maxPauseAgentFlag', 1); assert.equal(f.dirty, false); f.ctx.QueueDetail.save(); assert.equal(f.writes.length, 0); });
check('官方值域校验失败保留草稿且不发请求', () => { for (const [field, value] of [['name', ''], ['weight', 0], ['weight', 11], ['queueTimeout', 19], ['queueTimeout', 601], ['memberTimeout', 19], ['memberTimeout', 61], ['wrapupTime', 2], ['wrapupTime', 3601], ['maxLen', -1], ['maxLen', 1000], ['weight', '1.5'], ['weight', ''], ['strategy', 'invented'], ['retry', -1], ['serviceLevel', -1], ['vipSupport', 2], ['joinEmpty', 32], ['announceSound', 2], ['announcePosition', 3], ['announcePositionFrequency', -1], ['sayAgentno', 'maybe']]) { const f = setup(); f.open(); f.ctx.QueueDetail.setField(field, value); assert.equal(f.ctx.QueueDetail.save(), false, field + ':' + value); assert.equal(f.writes.length, 0); assert.equal(f.dirty, true); assert(f.nodes.has('queue-detail')); } });
check('详情编辑展示全部官方必选字段并预填默认值', () => { const f = setup(); f.open(); const html = f.html(); for (const [id, value] of [['queue-detail-musicClass', 'default'], ['queue-detail-retry', '5'], ['queue-detail-serviceLevel', '10'], ['queue-detail-announcePositionFrequency', '0']]) assert.match(html, new RegExp(`id="${id}"[^>]*value="${value}"`), id); for (const id of ['queue-detail-sayAgentno', 'queue-detail-vipSupport', 'queue-detail-joinEmpty-1', 'queue-detail-joinEmpty-16', 'queue-detail-announceSound', 'queue-detail-announcePosition']) assert.match(html, new RegExp(`id="${id}"`), id); assert.doesNotMatch(html, /queue-detail-announceSoundFrequency/); assert.doesNotMatch(html, /queue-detail-announcePositionParam/); assert.doesNotMatch(html, /queue-detail-maxPauseAgent(?:Flag|Type|Value)/); });
check('只读详情展示等待语音、工号播报与服务水平等新字段', () => { const f = setup(); f.open(false); const html = f.html(); assert.match(html, /等待语音/); assert.match(html, /default/); assert.match(html, /坐席工号播报|语音报号/); assert.match(html, /呼叫下一坐席/); assert.match(html, /服务水平/); assert.match(html, /VIP 支持/); assert.match(html, /固定语音|位置播报/); });
check('固定语音与位置播报条件联动，阈值不小于2', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('announceSound', '1'); assert.match(f.html(), /queue-detail-announceSoundFrequency/); assert.match(f.html(), /queue-detail-announceSoundFile/); assert.equal(f.ctx.QueueDetail.save(), false); assert.equal(f.writes.length, 0); f.ctx.QueueDetail.setField('announceSoundFrequency', '30'); f.ctx.QueueDetail.setField('announceSoundFile', 'welcome.wav'); f.ctx.QueueDetail.setField('announcePosition', '1'); assert.match(f.html(), /queue-detail-announcePositionParam/); f.ctx.QueueDetail.setField('announcePositionParam', '1'); assert.equal(f.ctx.QueueDetail.save(), false); assert.equal(f.writes.length, 0); f.ctx.QueueDetail.setField('announcePositionParam', '3'); assert.equal(f.ctx.QueueDetail.save(), true); assert.deepEqual(f.writes[0].payload, { announceSound: 1, announceSoundFrequency: 30, announceSoundFile: 'welcome.wav', announcePosition: 1, announcePositionParam: 3 }); });
check('快照缺字段按空值展示且未动不重发', () => { const f = setup({ legacy: true }); f.open(); assert.match(f.html(), /id="queue-detail-musicClass"[^>]*value=""/); f.ctx.QueueDetail.setField('weight', '7'); assert.equal(f.ctx.QueueDetail.save(), true); assert.deepEqual(f.writes[0].payload, { weight: 7 }); });
check('缺失供应商参数的只读详情显示未记录，编辑选择框不默选关闭',()=>{const f=setup({legacy:true});f.open(false);assert.match(f.html(),/未记录/);assert.doesNotMatch(f.html(),/<dd>default<\/dd>|<dd>5 秒<\/dd>|<dd>10 秒<\/dd>/);f.open(true);assert.match(f.html(),/未记录，请选择/);assert.equal(f.writes.length,0);});
check('保存失败保留输入与抽屉，再次保存沿用同一草稿', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('name', '保留输入'); f.fail(); assert.equal(f.ctx.QueueDetail.save(), false); assert.equal(f.dirty, true); assert.equal(f.queue.name, '销售接听队列'); f.fail(false); assert.equal(f.ctx.QueueDetail.save(), true); assert.equal(f.queue.name, '保留输入'); });
check('读取失败保留编辑草稿，恢复读取后可保存', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('name', '恢复后保存'); f.storageFailure(); assert(f.nodes.has('queue-detail')); assert.equal(f.ctx.QueueDetail.save(), false); assert.equal(f.dirty, true); f.storageFailure(''); assert.equal(f.ctx.QueueDetail.save(), true); assert.equal(f.queue.name, '恢复后保存'); });
check('并发修改不能覆盖最新版本，用户草稿不丢失', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('weight', 5); f.revisionChange(); assert.equal(f.ctx.QueueDetail.save(), false); assert.equal(f.writes.length, 0); assert.equal(f.dirty, true); assert.match(f.nodes.get('queue-detail-error').textContent, /已更新/); });
check('编辑期间坐席进入通话，保存受阻且保留草稿', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('weight', 5); f.busy(); assert.equal(f.ctx.QueueDetail.save(), false); assert.equal(f.dirty, true); assert.equal(f.writes.length, 0); f.busy(false); assert.equal(f.ctx.QueueDetail.save(), true); });
check('保存后刷新底层列表并恢复正确的同一队列抽屉', () => { const f = setup({ refreshCloses: true }); f.open(); f.ctx.QueueDetail.setField('name', '新队列名称'); f.ctx.QueueDetail.save(); assert.equal(f.refreshes, 1); assert.match(f.html(), /新队列名称/); assert.equal(f.dirty, false); f.ctx.QueueDetail.setField('weight', 2); f.ctx.QueueDetail.save(); assert.equal(f.writes[1].expectedRevision, 5); });
check('未保存关闭先确认，继续编辑保留内容，放弃后无写入', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('name', '未保存名称'); assert.equal(f.ctx.QueueDetail.close(), false); assert(f.nodes.has('queue-detail-decision')); f.ctx.QueueDetail.cancelConfirm(); assert(!f.nodes.has('queue-detail-decision')); assert.equal(f.dirty, true); f.ctx.QueueDetail.discard(); assert.equal(f.dirty, false); assert.equal(f.nodes.size, 0); assert.equal(f.writes.length, 0); });
check('脱离 DOM 的未保存抽屉重新打开时恢复草稿', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('name', '草稿名称'); f.removeLayer(); f.open(); assert.match(f.html(), /value="草稿名称"/); assert.equal(f.dirty, true); f.ctx.QueueDetail.save(); assert.equal(f.queue.name, '草稿名称'); });
check('工作范围变化关闭旧抽屉并阻止旧草稿提交', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('name', '旧范围'); f.scopeChange(); assert.equal(f.nodes.size, 0); assert.equal(f.dirty, false); f.ctx.QueueDetail.save(); assert.equal(f.writes.length, 0); });
check('管理权限撤销立即失效', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('name', '旧权限'); f.revoke(); assert.equal(f.nodes.size, 0); assert.equal(f.dirty, false); assert.equal(f.open(), false); });
check('业务范围切换与浏览器返回受到未保存保护', () => { const f = setup(); f.open(); f.ctx.QueueDetail.setField('name', '未完成'); assert.equal(f.event('app:save-draft').prevented, true); f.ctx.location.hash = '#home'; assert.equal(f.event('popstate').stopped, true); assert.equal(f.ctx.location.hash, '#queues'); f.ctx.QueueDetail.discard(); assert.equal(f.event('popstate').stopped, false); });
check('队列与成员文本正确转义', () => { const f = setup(); f.queue.name = '<img src=x onerror=alert(1)>'; f.open(false); assert.match(f.html(), /&lt;img/); assert.doesNotMatch(f.html(), /<img\b/); });

console.log(JSON.stringify({ result: 'pass', count: checks.length, checks }, null, 2));
