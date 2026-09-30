/* Offline contract checks. Loads the shipped adapter with no supplier access. */
'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const context = { window: {}, fetch() { throw new Error('Supplier requests are prohibited'); } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/components/alicti-queue-contracts.js'), 'utf8'), context);
const api = context.window.AliCtiQueueContracts;
const checks = [];
const plain = value => JSON.parse(JSON.stringify(value));
const skill = [{ skillId: '23', skillLevel: '5' }];
const create = input => api.createFields({ qno: '0012', name: '上海销售', ...input }, skill);
function check(name, fn) { fn(); checks.push(name); }
function invalid(result) { assert.equal(result.ok, false); assert.equal(result.fields, null); assert(result.errors.length); }

check('创建使用 queue 与 queueSkills 并补齐全部官方必填字段', () => {
  const result = create({}); assert.equal(result.ok, true, JSON.stringify(result.errors));
  for (const key of api.requiredCreateFields) assert(Object.hasOwn(result.fields.queue, key), key);
  assert.equal(result.fields.queue.description, '上海销售');
  assert(!Object.hasOwn(result.fields.queue, 'name'));
  assert.equal(result.fields.queue.qno, '0012');
  assert.deepEqual(plain(result.fields.queueSkills), skill);
  assert.deepEqual(Object.keys(result.fields).sort(), ['queue', 'queueSkills']);
});
check('公开区分官方默认与本地默认', () => {
  assert.equal(api.defaultSources.queueTimeout, 'official'); assert.equal(api.defaults.queueTimeout, 600);
  assert.equal(api.defaultSources.memberTimeout, 'official'); assert.equal(api.defaults.memberTimeout, 25);
  assert.equal(api.defaultSources.strategy, 'local'); assert.equal(api.defaults.strategy, 'leastrecent');
  assert(Object.isFrozen(api.defaults)); assert(Object.isFrozen(api.strategies));
});
check('仅允许官方六种队列策略，不能传预测任务数字枚举', () => {
  assert.equal(Object.keys(api.strategies).length, 6);
  for (const strategy of Object.keys(api.strategies)) assert.equal(create({ strategy }).ok, true);
  for (const strategy of ['longestidle', '3', 3, '', null, 'toString']) invalid(create({ strategy }));
});
check('队列优先级范围为 1～10，数字字符串规范化且拒绝小数和隐式转换', () => {
  for (const weight of [1, 10, '10']) assert.equal(create({ weight }).ok, true);
  assert.equal(create({ weight: '10' }).fields.queue.weight, 10);
  for (const weight of [0, 11, 1.5, '1.5', '', null, false, [], '1e1', Infinity]) invalid(create({ weight }));
});
check('排队时间、应答时间、整理时间和等待人数验证边界', () => {
  for (const [field, low, high] of [['queueTimeout', 20, 600], ['memberTimeout', 20, 60], ['wrapupTime', 3, 3600], ['maxLen', 0, 999]]) {
    assert.equal(create({ [field]: low }).ok, true, field); assert.equal(create({ [field]: high }).ok, true, field);
    invalid(create({ [field]: low - 1 })); invalid(create({ [field]: high + 1 }));
  }
});
check('队列号保留前导零，不臆造数字长度限制', () => {
  assert.equal(api.getFields('0012').fields.qno, '0012');
  assert.equal(api.getFields('SALES-QUEUE-000012').ok, true);
  for (const qno of ['', ' ', null, 12, false]) { invalid(api.getFields(qno)); invalid(create({ qno })); }
});
check('创建不把本地归属或坐席名单写入队列接口', () => {
  for (const extra of [{ cnos: ['0012'] }, { tenantId: 'TENANT-1' }, { queueSkills: skill }, { queueName: '别名' }]) invalid(create(extra));
  const fields = create({}).fields;
  assert(!Object.hasOwn(fields.queue, 'cnos')); assert(!Object.hasOwn(fields, 'tenantId'));
});
check('技能标识和值保留供应商原类型，移除只读关系元数据', () => {
  const original = [{ id: '9', queueId: '2', qno: '0012', skillId: '23', skillLevel: '5' }];
  const frozen = JSON.stringify(original);
  const result = api.createFields({ qno: '0012', name: '技能队列' }, original);
  assert.equal(result.ok, true); assert.deepEqual(plain(result.fields.queueSkills), skill);
  assert.equal(JSON.stringify(original), frozen);
  const numeric = api.createFields({ qno: '0012', name: '技能队列' }, [{ skillId: 23, skillLevel: 5 }]);
  assert.equal(numeric.fields.queueSkills[0].skillId, 23);
  assert.equal(numeric.fields.queueSkills[0].skillLevel, 5);
});
check('缺失或重复技能值返回错误，不推导成员与技能阈值', () => {
  for (const skills of [undefined, {}, [{ skillId: 1 }], [{ skillId: 'one', skillLevel: 1 }], [{ skillId: 1, skillLevel: 1 }, { skillId: '1', skillLevel: '2' }]]) {
    invalid(api.createFields({ qno: '0012', name: '销售' }, skills));
  }
  // The document requires an array, without claiming it must be non-empty or a
  // particular range for queueSkills.skillLevel. Business policy lives elsewhere.
  assert.equal(api.createFields({ qno: '0012', name: '销售' }, []).ok, true);
});
check('更新只提交显式字段，不发送 queueSkills 或创建默认值', () => {
  const result = api.updateFields('0012', { name: '新名称', weight: '10' });
  assert.equal(result.ok, true); assert.deepEqual(plain(result.fields), { queue: { description: '新名称', weight: 10, qno: '0012' } });
  assert(!Object.hasOwn(result.fields, 'queueSkills')); assert(!Object.hasOwn(result.fields.queue, 'strategy'));
  invalid(api.updateFields('0012', { queueSkills: skill })); invalid(api.updateFields('0012', {}));
  invalid(api.updateFields('0012', { qno: '12', name: '新名称' }));
  assert.deepEqual(plain(api.updateFields('0012', { announceSound: 1 }).fields), { queue: { announceSound: 1, qno: '0012' } });
});
check('不能以 undefined 或空值意外清空更新字段', () => {
  invalid(api.updateFields('0012', { name: '' })); invalid(api.updateFields('0012', { weight: undefined }));
  invalid(api.updateFields('0012', { strategy: null }));
});
check('固定语音启用时要求周期与文件，布尔和开关值严格验证', () => {
  invalid(create({ announceSound: 1 }));
  assert.equal(create({ announceSound: 1, announceSoundFrequency: 30, announceSoundFile: 'welcome' }).ok, true);
  assert.equal(create({ sayAgentno: 'false' }).fields.queue.sayAgentno, false);
  invalid(create({ sayAgentno: 1 })); invalid(create({ vipSupport: 2 })); invalid(create({ joinEmpty: 32 }));
  invalid(create({ maxPauseAgentFlag: 1, maxPauseAgentType: 0, maxPauseAgentValue: 101 }));
});
check('队列列表请求遵循 limit 与 offset，不误用坐席分页字段', () => {
  assert.deepEqual(plain(api.listFields().fields), { limit: 500, offset: 0 });
  assert.deepEqual(plain(api.listFields({ limit: '20', offset: '20', qno: '0012', order: 1 }).fields), { limit: 20, offset: 20, qno: '0012', order: 1 });
  for (const query of [{ limit: 501 }, { limit: 0 }, { offset: -1 }, { order: 2 }, { start: 20 }]) invalid(api.listFields(query));
});
check('列表从 data.list 读取并保留已返回的数字字符串', () => {
  const original = { result: '0', data: { list: [{ qno: '0012', description: '上海销售', strategy: 'rrmemory', weight: '1', announcePosition: '0', announcePositionParam: '0' }], total: '2' } };
  const result = api.parseListResponse(original);
  assert.equal(result.ok, true); assert.equal(result.total, 2); assert.equal(result.rows[0].weight, '1');
  result.rows[0].description = '修改副本'; assert.equal(original.data.list[0].description, '上海销售');
});
check('列表失败、错误路径、未知策略、异常数值都不会被当成有效快照', () => {
  for (const response of [null, { result: '-1', description: '鉴权失败' }, { result: 0, data: { rows: [], total: 0 } },
    { result: 0, data: { list: [], total: '' } }, { result: 0, data: { list: [{ qno: '1' }], total: 0 } },
    { result: 0, data: { list: [{ qno: '1', strategy: 'unknown' }], total: 1 } },
    { result: 0, data: { list: [{ qno: '1', weight: '11' }], total: 1 } }]) {
    const result = api.parseListResponse(response); assert.equal(result.ok, false); assert.equal(result.rows.length, 0); assert(result.errors.length);
  }
});
check('详情从 data.queue 与 data.queueSkills 读取，不丢供应商关系信息', () => {
  const related = [{ id: '99', qno: '0012', queueId: '8', skillId: '23', skillLevel: '5' }];
  const result = api.parseGetResponse({ result: 0, data: { queue: { qno: '0012', description: '销售', strategy: 'leastrecent' }, queueSkills: related } });
  assert.equal(result.ok, true); assert.deepEqual(plain(result.queueSkills), related);
  assert.equal(result.queue.qno, '0012');
  for (const data of [{ queue: { qno: '0012' } }, { queue: { qno: '0012' }, queueSkills: {} }, { qno: '0012', queueSkills: [] }]) {
    const invalid = api.parseGetResponse({ result: 0, data }); assert.equal(invalid.ok, false); assert.equal(invalid.queue, null);
  }
});
check('输入对象和技能列表不变，所有方法仅构建数据', () => {
  const input = Object.freeze({ qno: '0012', name: '销售', weight: '3' });
  const related = Object.freeze([Object.freeze({ skillId: '23', skillLevel: '5' })]);
  assert.equal(api.createFields(input, related).ok, true);
  assert.equal(api.updateFields('0012', Object.freeze({ weight: '3' })).ok, true);
  assert.equal(input.weight, '3'); assert.equal(related[0].skillLevel, '5');
});

console.log(JSON.stringify({ result: 'pass', count: checks.length, checks }, null, 2));
