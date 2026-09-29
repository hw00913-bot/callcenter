/* Queue drawer interaction regression. Executes the shipped drawer and contract
 * code; only DOM surfaces, AppState and queue persistence are replaced. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const root = path.join(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));
const checks = [];
const initialQueue = () => ({
  enterpriseId: '7522240', tenantId: 'TENANT-QA', qno: '0012', name: '销售接听队列',
  strategy: 'leastrecent', weight: 1, queueTimeout: 600, memberTimeout: 25,
  wrapupTime: 30, maxLen: 0, musicClass: 'default', sayAgentno: false, retry: 5,
  serviceLevel: 10, vipSupport: 0, joinEmpty: 0, announceSound: 0,
  announcePosition: 0, announcePositionFrequency: 0
});

function setup(options = {}) {
  const nodes = new Map(), subscribers = [], listeners = [], toasts = [], writes = [], historyWrites = [];
  let scope = 'scope-A', visible = true, manager = options.manager !== false;
  let queue = options.bound === false ? null : initialQueue();
  let revision = 4, checkedAt = queue ? '2026-09-18T00:00:00.000Z' : '';
  let dirty = false, rejectSession = false, failBusiness = false, refreshes = 0;
  const group = { physicalGroupId: 'GROUP-QA', enterpriseId: '7522240', tenantId: 'TENANT-QA', name: '销售团队' };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  function element(id, props = {}) { const value = { id, hidden: false, textContent: '', innerHTML: '', scrollIntoView() {}, ...props }; nodes.set(id, value); return value; }
  function close(id) {
    const existing = nodes.get(id);
    for (const child of existing?.children || []) nodes.delete(child);
    nodes.delete(id);
  }
  const ctx = {
    console, structuredClone, Date, Map, Set, Object, Array, JSON, Number, String,
    CloudCallData: { physicalSkillGroups: [group], tenants: [{ tenantId: group.tenantId, name: '上海门店' }], instances: [] },
    document: { getElementById: id => nodes.get(id) || null },
    location: { hash: '#skill-mappings' },
    history: { state: { routeKey: 'skill-mappings' }, pushState(state, _title, url) { historyWrites.push({ state, url }); ctx.location.hash = url; } },
    PlatformUI: {
      confirm(options) { element(options.id, { options }); },
      escape,
      openLayer(id, html, size, navigation) {
        close(id);
        const children = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
        element(id, { html, children, size, navigation });
        children.forEach(child => element(child, { hidden: child === 'queue-inline-confirm' }));
      },
      closeLayer: close
    },
    AppState: {
      setDirty(value) { dirty = !!value; if (rejectSession) throw Error('sessionStorage unavailable'); },
      subscribe(callback) { subscribers.push(callback); }
    },
    RouteRuntime: { refreshCurrent() { refreshes++; } },
    showToast(message, level) { toasts.push({ message, level }); },
    addEventListener(type, callback, capture = false) { listeners.push({ type, callback, capture: !!capture }); },
    fetch() { throw Error('The queue UI regression must not call supplier services'); }
  };
  function describe() {
    return { revision, queue: queue && plain(queue), binding: queue ? { qno: queue.qno } : null,
      status: queue ? (checkedAt ? 'matched' : 'unchecked') : 'unbound',
      statusLabel: queue ? (checkedAt ? '成员一致' : '待核对') : '未关联', checkedAt,
      memberComparison: { expected: [{ cno: '0012', name: '李四' }], actual: [{ cno: '0012', name: '李四' }], missing: [], extra: [] },
      skillComparison: { matched: true }, message: '成员核对结果', blockedReason: '' };
  }
  function commit(method, payload) {
    if (failBusiness) return { ok: false, message: '队列保存失败，原记录已保留' };
    writes.push({ method, payload: plain(payload) }); revision++; checkedAt = '';
    return { ok: true, revision, message: '接听队列已保存' };
  }
  ctx.AliCtiQueues = {
    contextKey: () => scope,
    canView: () => visible,
    canManage: () => visible && manager,
    describe,
    options: () => [initialQueue()],
    createForGroups(ids, values) { const result=this.createForGroup(ids[0],values); if(result.ok)writes.at(-1).groupIds=plain(ids); return result; },
    createForGroup(id, values) {
      const contract = ctx.AliCtiQueueContracts.createFields(values, [{ skillId: 12, skillLevel: 1 }]);
      if (!contract.ok) return { ok: false, message: contract.errors.join('；') };
      const result = commit('create', values);
      if (result.ok) queue = { ...contract.fields.queue, name: contract.fields.queue.description };
      return result;
    },
    updateQueue(id, changes) {
      const contract = ctx.AliCtiQueueContracts.updateFields(queue.qno, changes);
      if (!contract.ok) return { ok: false, message: contract.errors.join('；') };
      const result = commit('update', changes);
      if (result.ok) { Object.assign(queue, contract.fields.queue); if (contract.fields.queue.description) queue.name = contract.fields.queue.description; }
      return result;
    },
    saveBinding(id, qno) {
      const result = commit('bind', { qno });
      if (result.ok) queue = qno ? { ...initialQueue(), qno } : null;
      return result;
    },
    verify() { const result = commit('verify', {}); if (result.ok) checkedAt = '2026-09-18T01:00:00.000Z'; return result; }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const file of ['js/components/alicti-queue-contracts.js', 'js/components/queue-config.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  }
  return {
    ctx, nodes, toasts, writes, historyWrites, group,
    get dirty() { return dirty; }, get revision() { return revision; }, get checkedAt() { return checkedAt; },
    get refreshes() { return refreshes; }, get queue() { return queue; },
    html() { return nodes.get('queue-config')?.html || ''; },
    open(editable = true) { ctx.QueueConfig.open(group.physicalGroupId, editable, scope); },
    removeLayer() { close('queue-config'); },
    sessionFailure(value = true) { rejectSession = value; },
    businessFailure(value = true) { failBusiness = value; },
    changeScope(next, notify = true) { scope = next; dirty = false; if (notify) subscribers.forEach(callback => callback()); },
    loseAccess() { visible = false; subscribers.forEach(callback => callback()); },
    restoreAccess() { visible = true; },
    event(type) {
      const event = { type, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
      for (const entry of listeners.filter(entry => entry.type === type).sort((a, b) => Number(b.capture) - Number(a.capture))) {
        entry.callback(event); if (event.stopped) break;
      }
      return event;
    }
  };
}
function check(name, callback) { callback(); checks.push(name); }

check('只读详情保留账号、队列、策略和成员核对，不显示管理控件', () => {
  const f = setup({ manager: false }); f.open(false);
  const html = f.html(); assert.match(html, /销售接听队列/); assert.match(html, /0012/); assert.match(html, /7522240/);
  assert.match(html, /成员核对/); assert.match(html, /最长空闲时间/);
  assert.doesNotMatch(html, /<(?:input|select|textarea)\b/);
  assert.doesNotMatch(html, /QueueConfig\.(?:save|verify|askUnbind|unbind|changeMode|setField|selectQueue)\(/);
  assert.match(html, /aria-label="关闭"/); assert.match(html, /QueueConfig\.close\(\)/);
  f.ctx.QueueConfig.setField('name', '禁止修改'); f.ctx.QueueConfig.save(); f.ctx.QueueConfig.verify(); f.ctx.QueueConfig.askUnbind();
  assert.equal(f.writes.length, 0); assert.equal(f.dirty, false);
  assert.equal(f.queue.name, '销售接听队列');
});

check('旧抽屉被导航移除后可重新打开，不遗留不可关闭的脏状态', () => {
  const f = setup(); f.open(); f.ctx.QueueConfig.setField('name', '未保存名称'); assert.equal(f.dirty, true);
  f.removeLayer(); f.open();
  assert(f.nodes.has('queue-config')); assert.equal(f.dirty, false);
  assert.match(f.html(), /value="销售接听队列"/); assert.equal(f.writes.length, 0);
  assert(!f.toasts.some(item => item.message.includes('请先保存或关闭')));
});

check('登录或租户上下文变化清理旧抽屉，新范围可以正常打开', () => {
  const f = setup(); f.open(); f.ctx.QueueConfig.setField('name', '旧范围未保存');
  f.changeScope('scope-B'); assert.equal(f.nodes.has('queue-config'), false);
  f.open(); assert(f.nodes.has('queue-config')); assert.equal(f.dirty, false); assert.equal(f.writes.length, 0);
});

check('权限被撤销立即关闭抽屉，旧动作不能提交', () => {
  const f = setup(); f.open(); f.ctx.QueueConfig.setField('name', '旧权限未保存'); f.loseAccess();
  assert.equal(f.nodes.has('queue-config'), false); f.ctx.QueueConfig.save(); assert.equal(f.writes.length, 0);
  f.restoreAccess(); f.open(); assert(f.nodes.has('queue-config'));
});

check('脏表单阻止浏览器返回并恢复当前地址，保存或放弃后可返回', () => {
  const f = setup(); f.open(); f.ctx.QueueConfig.setField('name', '未保存名称'); f.ctx.location.hash = '#home';
  const event = f.event('popstate'); assert.equal(event.stopped, true);
  assert.equal(f.ctx.location.hash, '#skill-mappings'); assert.equal(f.historyWrites.length, 1);
  assert(f.nodes.has('queue-config')); assert.match(f.nodes.get('queue-form-error').textContent, /保存|放弃/);
  f.ctx.QueueConfig.discard(); assert.equal(f.dirty, false);
  assert.equal(f.event('popstate').stopped, false);
});

check('业务域保存草稿事件不能绕过未保存队列配置', () => {
  const f = setup(); f.open(); f.ctx.QueueConfig.setField('weight', '4');
  assert.equal(f.event('app:save-draft').prevented, true); assert.equal(f.writes.length, 0);
  f.ctx.QueueConfig.discard(); assert.equal(f.event('app:save-draft').prevented, false);
});

check('会话存储失败不影响已经成功持久化的创建及成功反馈', () => {
  const f = setup({ bound: false }); f.open(); f.ctx.QueueConfig.changeMode('new');
  f.ctx.QueueConfig.setField('qno', '0007'); f.ctx.QueueConfig.setField('name', '新接听队列');
  f.sessionFailure(); assert.doesNotThrow(() => assert.equal(f.ctx.QueueConfig.save(), true));
  assert.equal(f.writes.length, 1); assert.equal(f.writes[0].method, 'create'); assert.equal(f.queue.qno, '0007');
  assert.equal(f.dirty, false); assert(f.nodes.has('queue-config')); assert.equal(f.refreshes, 1);
  assert(f.toasts.some(item => item.level === 'success' && item.message.includes('已保存')));
  assert.doesNotMatch(f.html(), /创建并关联/); assert.match(f.html(), /保存配置/);
  assert.equal(f.ctx.QueueConfig.save(), true); assert.equal(f.writes.length, 1, '已保存后再次点击不可重复创建');
});

check('会话存储失败时仍可放弃编辑并关闭，不被关闭守卫卡死', () => {
  const f = setup(); f.open(); f.ctx.QueueConfig.setField('name', '未保存名称'); f.sessionFailure();
  assert.doesNotThrow(() => f.ctx.QueueConfig.close()); assert(f.nodes.has('queue-config-confirm'));
  assert.doesNotThrow(() => f.ctx.QueueConfig.discard());
  assert.equal(f.nodes.has('queue-config'), false); assert.equal(f.dirty, false); assert.equal(f.writes.length, 0);
});

check('未改动或改回原值时不提交，也不重置已有核对结果', () => {
  const f = setup(); f.open(); const revision = f.revision, stamp = f.checkedAt;
  assert.equal(f.ctx.QueueConfig.save(), true); assert.equal(f.writes.length, 0);
  f.ctx.QueueConfig.setField('weight', '8'); f.ctx.QueueConfig.setField('weight', '1');
  assert.equal(f.ctx.QueueConfig.save(), true); assert.equal(f.writes.length, 0);
  assert.equal(f.revision, revision); assert.equal(f.checkedAt, stamp); assert.equal(f.dirty, false);
  assert(f.toasts.some(item => item.message === '配置未变化'));
});

check('配置编辑仅传实际变化字段，队列编号与其余配置不重发', () => {
  const f = setup(); f.open(); f.ctx.QueueConfig.setField('weight', '7');
  assert.equal(f.ctx.QueueConfig.save(), true); assert.equal(f.writes.length, 1);
  assert.deepEqual(f.writes[0], { method: 'update', payload: { weight: 7 } });
  assert.equal(f.queue.qno, '0012'); assert.equal(f.queue.name, '销售接听队列'); assert.equal(f.checkedAt, '');
});

check('业务持久化失败保留表单和输入，恢复后只提交一次', () => {
  const f = setup(); f.open(); f.ctx.QueueConfig.setField('name', '新名称'); f.businessFailure();
  assert.equal(f.ctx.QueueConfig.save(), false); assert.equal(f.writes.length, 0); assert.equal(f.dirty, true);
  assert(f.nodes.has('queue-config')); assert.match(f.nodes.get('queue-form-error').textContent, /失败/);
  f.businessFailure(false); assert.equal(f.ctx.QueueConfig.save(), true);
  assert.equal(f.writes.length, 1); assert.equal(f.queue.name, '新名称');
});

check('关闭未保存表单先确认，继续编辑保留输入且不会写入', () => {
  const f = setup(); f.open(); f.ctx.QueueConfig.setField('name', '保留输入'); f.ctx.QueueConfig.close();
  assert(f.nodes.has('queue-config')); assert(f.nodes.has('queue-config-confirm'));
  f.ctx.QueueConfig.cancelConfirm(); assert(!f.nodes.has('queue-config-confirm'));
  assert.equal(f.ctx.QueueConfig.save(), true); assert.equal(f.queue.name, '保留输入'); assert.equal(f.writes.length, 1);
});

check('只读内容转义队列名，不生成外部元素', () => {
  const f = setup(); f.queue.name = '<img src=x onerror=alert(1)>'; f.open(false);
  assert.match(f.html(), /&lt;img src=x onerror=alert\(1\)&gt;/); assert.doesNotMatch(f.html(), /<img\b/);
});

check('多技能创建表单展示全部所选技能并完整传递数组，失败保留表单', () => {
  const f=setup({bound:false});f.ctx.CloudCallData.physicalSkillGroups.push({...f.group,physicalGroupId:'GROUP-QA-2',name:'售后团队'});
  f.ctx.QueueConfig.openCreate(['GROUP-QA','GROUP-QA-2'],'scope-A');assert.match(f.html(),/销售团队、售后团队/);assert.doesNotMatch(f.html(),/关联已有队列/);
  f.ctx.QueueConfig.setField('qno','0009');f.ctx.QueueConfig.setField('name','多技能接听');f.businessFailure();assert.equal(f.ctx.QueueConfig.save(),false);assert(f.nodes.has('queue-config'));assert(f.dirty);
  f.businessFailure(false);assert.equal(f.ctx.QueueConfig.save(),true);assert.deepEqual(f.writes[0].groupIds,['GROUP-QA','GROUP-QA-2']);
});
check('多技能创建拒绝跨租户或不在当前范围的技能组', () => {
  const f=setup({bound:false});f.ctx.CloudCallData.physicalSkillGroups.push({...f.group,physicalGroupId:'FOREIGN',tenantId:'OTHER',name:'其他租户'});
  f.ctx.QueueConfig.openCreate(['GROUP-QA','FOREIGN'],'scope-A');assert(!f.nodes.has('queue-config'));assert.equal(f.writes.length,0);
});
check('创建表单展示全部官方必选字段并预填默认值', () => {
  const f=setup({bound:false});f.open();f.ctx.QueueConfig.changeMode('new');
  const html=f.html();
  for(const [id,value] of [['queue-musicClass','default'],['queue-retry','5'],['queue-serviceLevel','10'],['queue-announcePositionFrequency','0']])assert.match(html,new RegExp(`id="${id}"[^>]*value="${value}"`),id);
  for(const id of ['queue-sayAgentno','queue-vipSupport','queue-joinEmpty-1','queue-joinEmpty-16','queue-announceSound','queue-announcePosition'])assert.match(html,new RegExp(`id="${id}"`),id);
  assert.doesNotMatch(html,/queue-announceSoundFrequency/);assert.doesNotMatch(html,/queue-announcePositionParam/);
  assert.doesNotMatch(html,/queue-maxPauseAgent(?:Flag|Type|Value)/);
});
check('固定语音开启联动周期与文件必填，关闭不显示', () => {
  const f=setup({bound:false});f.open();f.ctx.QueueConfig.changeMode('new');
  f.ctx.QueueConfig.setField('qno','0007');f.ctx.QueueConfig.setField('name','语音播报队列');
  f.ctx.QueueConfig.setField('announceSound','1');
  assert.match(f.html(),/queue-announceSoundFrequency/);assert.match(f.html(),/queue-announceSoundFile/);
  assert.equal(f.ctx.QueueConfig.save(),false);assert.equal(f.writes.length,0);
  f.ctx.QueueConfig.setField('announceSoundFrequency','30');f.ctx.QueueConfig.setField('announceSoundFile','welcome.wav');
  assert.equal(f.ctx.QueueConfig.save(),true);
  assert.equal(f.writes[0].payload.announceSound,1);assert.equal(f.writes[0].payload.announceSoundFrequency,30);assert.equal(f.writes[0].payload.announceSoundFile,'welcome.wav');
});
check('位置播报开启联动人数阈值且不小于2', () => {
  const f=setup({bound:false});f.open();f.ctx.QueueConfig.changeMode('new');
  f.ctx.QueueConfig.setField('qno','0007');f.ctx.QueueConfig.setField('name','位置播报队列');
  f.ctx.QueueConfig.setField('announcePosition','2');
  assert.match(f.html(),/queue-announcePositionParam/);
  f.ctx.QueueConfig.setField('announcePositionParam','1');assert.equal(f.ctx.QueueConfig.save(),false);assert.equal(f.writes.length,0);
  f.ctx.QueueConfig.setField('announcePositionParam','2');assert.equal(f.ctx.QueueConfig.save(),true);
  assert.equal(f.writes[0].payload.announcePosition,2);assert.equal(f.writes[0].payload.announcePositionParam,2);
});
check('joinEmpty 位求和与值域，sayAgentno 布尔及 retry/serviceLevel/vipSupport 值域', () => {
  const f=setup({bound:false});f.open();f.ctx.QueueConfig.changeMode('new');
  f.ctx.QueueConfig.setField('qno','0007');f.ctx.QueueConfig.setField('name','高级设置队列');
  f.ctx.QueueConfig.setField('joinEmpty','32');assert.equal(f.ctx.QueueConfig.save(),false);assert.equal(f.writes.length,0);
  f.ctx.QueueConfig.setField('joinEmpty','3');f.ctx.QueueConfig.setField('sayAgentno','true');
  f.ctx.QueueConfig.setField('vipSupport','2');assert.equal(f.ctx.QueueConfig.save(),false);assert.equal(f.writes.length,0);
  f.ctx.QueueConfig.setField('vipSupport','1');f.ctx.QueueConfig.setField('retry','-1');assert.equal(f.ctx.QueueConfig.save(),false);assert.equal(f.writes.length,0);
  f.ctx.QueueConfig.setField('retry','8');f.ctx.QueueConfig.setField('serviceLevel','20');
  assert.equal(f.ctx.QueueConfig.save(),true);
  const payload=f.writes[0].payload;
  assert.equal(payload.joinEmpty,3);assert.equal(payload.sayAgentno,true);assert.equal(payload.vipSupport,1);assert.equal(payload.retry,8);assert.equal(payload.serviceLevel,20);
});
check('创建请求包含全部官方必选字段默认值', () => {
  const f=setup({bound:false});f.open();f.ctx.QueueConfig.changeMode('new');
  f.ctx.QueueConfig.setField('qno','0007');f.ctx.QueueConfig.setField('name','默认队列');
  assert.equal(f.ctx.QueueConfig.save(),true);
  const payload=f.writes[0].payload;
  for(const [key,value] of [['musicClass','default'],['sayAgentno',false],['retry',5],['serviceLevel',10],['vipSupport',0],['joinEmpty',0],['announceSound',0],['announcePosition',0],['announcePositionFrequency',0]])assert.equal(payload[key],value,key);
});
check('绑定编辑仅传变化的新字段，未动新字段不重发', () => {
  const f=setup();f.open();f.ctx.QueueConfig.setField('retry','8');
  assert.equal(f.ctx.QueueConfig.save(),true);
  assert.deepEqual(f.writes[0],{method:'update',payload:{retry:8}});
  assert.equal(f.queue.musicClass,'default');assert.equal(f.queue.queueTimeout,600);
});
console.log(JSON.stringify({ result: 'pass', count: checks.length, checks }, null, 2));
