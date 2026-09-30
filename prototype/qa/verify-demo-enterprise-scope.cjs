/* Fixture ownership and reference integrity after the one-enterprise/one-tenant split. */
'use strict';
const assert = require('assert');
const { fixture, signedIn, memory } = require('./verify-demo-fixtures.cjs');
const checks = [], failures = [];
function check(name, run) { try { run(); checks.push(name); } catch (error) { failures.push({ name, message: error.message }); } }
const c = fixture({ session: signedIn() }), d = c.CloudCallData;
const owner = enterpriseId => d.tenants.find(tenant => tenant.enterpriseId === String(enterpriseId));
const same = (a, b) => String(a.enterpriseId) === String(b.enterpriseId) && (!a.tenantId || !b.tenantId || a.tenantId === b.tenantId);
function owned(row, label) {
  if (!row?.enterpriseId) return;
  const tenant = owner(row.enterpriseId);
  const tenantIds = [row.tenantId, row.defaultTenantId, ...[row.tenantIds, row.authorizedTenantIds, row.localTenantIds].filter(Array.isArray).flat()].filter(Boolean);
  for (const tenantId of tenantIds) assert.equal(tenantId, tenant?.tenantId, label + ' belongs to the enterprise tenant');
}
function ref(row, list, key, id, label) {
  if (!id) return;
  const target = list.find(item => item[key] === id && same(row, item));
  assert(target, label + ': ' + id + ' must resolve inside ' + row.enterpriseId);
  return target;
}
check('总部与上海门店是同品牌的两个企业，每个企业只关联自己的租户', () => {
  const hq = d.instances.find(row => row.enterpriseId === '7522240');
  const sh = d.instances.find(row => row.enterpriseId === '7522241');
  assert.deepEqual([...hq.tenantIds], ['TEN-NISSAN-HQ']);
  assert.deepEqual([...sh.tenantIds], ['TEN-NISSAN-SH']);
  assert.equal(hq.brandId, 'BRAND-NISSAN'); assert.equal(sh.brandId, hq.brandId);
  assert.equal(owner('7522240').tenantId, 'TEN-NISSAN-HQ');
  assert.equal(owner('7522241').tenantId, 'TEN-NISSAN-SH');
  assert.equal(owner('DEMO-ENT-003').tenantId, 'TEN-EPI-HQ');
  for (const instance of d.instances) assert((instance.tenantIds || []).length <= 1);
  for (const rows of Object.values(d).filter(Array.isArray)) for (const row of rows) owned(row, JSON.stringify(row).slice(0, 70));
});
check('号码、线路、技能模板、技能关系与业务方案全部引用自己的企业资源', () => {
  for (const number of d.phoneNumbers) {
    if (number.lineId) assert(d.lines.some(line => line.lineId === number.lineId && line.enterpriseIds.includes(number.enterpriseId)));
    if (number.enterpriseId !== 'DEMO-ENT-003') ref(number, d.contactFlows, 'contactFlowId', number.contactFlowId, 'number flow');
    if (number.restoreSnapshot) owned({ ...number.restoreSnapshot, enterpriseId: number.enterpriseId }, 'number restore snapshot');
  }
  for (const group of d.physicalSkillGroups) ref(group, d.skillTemplates, 'skillTemplateId', group.skillTemplateId, 'skill template');
  for (const relation of d.agentSkills) {
    const seat = d.agents.find(agent => agent.contactCenterIdentityId === relation.identityId);
    assert(seat, relation.relationId);
    ref(seat, d.physicalSkillGroups, 'physicalGroupId', relation.physicalGroupId, 'seat skill');
  }
  for (const plan of d.callPlans) {
    for (const numberId of plan.allowedCallerNumberIds || []) ref(plan, d.phoneNumbers, 'numberId', numberId, 'plan number');
    ref(plan, d.physicalSkillGroups, 'skillGroupId', plan.targetSkillGroupId, 'plan skill');
    ref(plan, d.physicalSkillGroups, 'skillGroupId', plan.executionQueueId, 'plan execution group');
    ref(plan, d.contactFlows, 'contactFlowId', plan.contactFlowId, 'plan flow');
  }
});
check('任务执行配置、快照和原始供应商企业编号均属于任务企业', () => {
  for (const task of d.tasks) {
    owned(task, task.taskId);
    assert.equal(String(task.alictiMockTaskProperty.enterpriseId), task.enterpriseId);
    ref(task, d.phoneNumbers, 'numberId', task.callerNumberId, 'task number');
    for (const config of [task, task.executionConfig, task.planSnapshot].filter(Boolean)) {
      if (config.enterpriseId) assert(same(task, config));
      ref(task, d.contactFlows, 'contactFlowId', config.contactFlowId, 'task flow');
      for (const numberId of config.allowedCallerNumberIds || config.callerNumberIds || []) ref(task, d.phoneNumbers, 'numberId', numberId, 'task snapshot number');
      for (const groupId of [config.skillGroupId, config.targetSkillGroupId, config.executionQueueId]) ref(task, d.physicalSkillGroups, 'skillGroupId', groupId, 'task group');
    }
  }
});
check('总部和门店的自动与预测语音流程均可查询，现有任务及冻结快照能解析到本企业供应商流程', () => {
  for (const scope of c.DemoFixtureKit.scopes) {
    const current = fixture({ session: signedIn(scope.tenantId) }), api = current.AliCtiIvr;
    assert(api && current.AppState.get().enterpriseId === scope.enterpriseId, 'index must load the real IVR module in the matching enterprise');
    for (const [usage, flowId] of [['automatic', scope.automaticFlowId], ['predictive', scope.predictiveFlowId]]) {
      const listed = api.list(scope, current.CloudCallData, usage);
      assert(listed.ok && listed.rows.length > 0, scope.code + ': ' + usage + ' selectable');
      assert.equal(String(listed.request.fields.enterpriseId), scope.enterpriseId);
      assert(listed.rows.every(row => String(row.enterpriseId) === scope.enterpriseId && row.localAssignment.tenantId === scope.tenantId));
      const resolved = api.resolve({ contactFlowId: flowId }, scope, current.CloudCallData, usage);
      assert(resolved.ok, scope.code + ': ' + flowId + ' must resolve');
      assert.equal(resolved.row.localContactFlowId, flowId); assert.equal(String(resolved.row.enterpriseId), scope.enterpriseId);
      const tasks = current.CloudCallData.tasks.filter(task => same(task, scope) && task.callType === (usage === 'automatic' ? 'IVR 外呼' : '预外呼'));
      assert(tasks.length > 0);
      for (const task of tasks) for (const reference of [task, task.executionConfig, task.planSnapshot].filter(Boolean)) {
        const selected = api.resolve(reference, scope, current.CloudCallData, usage);
        assert(selected.ok, task.taskId + ': ' + selected.message);
        assert.equal(selected.ivrId, resolved.ivrId); assert.equal(selected.row.localContactFlowId, flowId);
      }
      const foreign = c.DemoFixtureKit.scopes.find(other => other.enterpriseId !== scope.enterpriseId);
      assert.equal(api.list(foreign, current.CloudCallData, usage).ok, false, 'current session must not query another enterprise');
      assert.equal(api.resolve({ contactFlowId: usage === 'automatic' ? foreign.automaticFlowId : foreign.predictiveFlowId }, scope, current.CloudCallData, usage).ok, false, 'a foreign local flow cannot resolve by a shared numeric provider ID');
    }
  }
});
check('客户批次、话单、原始话单与接听坐席引用同一企业', () => {
  const batches = JSON.parse(c.localStorage.getItem('customer-task-batches-v1'));
  for (const batch of batches) {
    owned(batch, batch.id);
    for (const row of batch.rows) {
      ref(batch, d.tasks, 'taskId', row.taskId, 'customer task');
      for (const call of row.calls || []) ref(batch, d.calls, 'callId', call.callId, 'customer history');
    }
  }
  for (const call of d.calls) {
    owned(call, call.callId);
    if (call.alictiCdr?.raw?.enterpriseId !== undefined) assert.equal(String(call.alictiCdr.raw.enterpriseId), call.enterpriseId, call.callId);
    ref(call, d.tasks, 'taskId', call.taskId, 'call task');
    ref(call, d.phoneNumbers, 'numberId', call.callerNumberId, 'call number');
    ref(call, d.physicalSkillGroups, 'skillGroupId', call.skillGroupId, 'call skill');
    for (const identity of [call.agentIdentityId, call.contactCenterIdentityId]) ref(call, d.agents, 'contactCenterIdentityId', identity, 'call seat');
  }
});
check('两个运营账号各自具备人工、预外呼、IVR和呼入样例，模块条数仍不超过15', () => {
  for (const scope of c.DemoFixtureKit.scopes) {
    assert(d.agents.some(agent => same(agent, scope) && agent.accountId === scope.accountId));
    for (const callType of ['人工外呼', '预外呼', 'IVR 外呼', '呼入']) assert(d.calls.some(call => same(call, scope) && call.callType === callType), scope.code + ': ' + callType);
    for (const type of ['预外呼', 'IVR 外呼']) assert(d.tasks.some(task => same(task, scope) && task.callType === type));
  }
  for (const name of ['instances', 'tenants', 'calls', 'tasks', 'agents', 'agentSkills', 'skillTemplates', 'physicalSkillGroups', 'phoneNumbers', 'lines', 'callPlans', 'inboundRoutes', 'contactFlows', 'syncRecords', 'exceptions', 'audits']) assert(d[name].length <= 15, name);
  assert(c.AliCtiTimeFixtures.rows.length <= 15); assert(c.AliCtiExtensionFixtures.rows.length <= 15);
  assert(c.AliCtiQueueFixtures.queues.length <= 15); assert(c.AliCtiInboundMock.rows.length <= 15);
});
check('队列、供应商技能、分机和电话登录样例不使用跨企业坐席或分机', () => {
  for (const queue of c.AliCtiQueueFixtures.queues) {
    owned(queue, 'queue ' + queue.qno);
    for (const cno of queue.cnos) ref(queue, d.agents, 'cno', cno, 'queue seat');
    for (const skill of queue.queueSkills) ref(queue, c.AliCtiQueueFixtures.supplierSkills, 'skillId', skill.skillId, 'queue skill');
  }
  for (const group of c.AliCtiQueueFixtures.supplierSkills) {
    ref(group, d.physicalSkillGroups, 'physicalGroupId', group.physicalGroupId, 'supplier skill');
    for (const cno of group.cnos) ref(group, d.agents, 'cno', cno, 'supplier skill seat');
  }
  for (const extension of [...c.AliCtiExtensionFixtures.rows, ...c.AliCtiExtensionFixtures.available]) owned(extension, 'extension ' + extension.exten);
  for (const seat of c.AliCtiSeatOperationFixtures.seats) {
    owned(seat, 'telephone ' + seat.cno);
    ref(seat, d.agents, 'cno', seat.cno, 'telephone seat');
    ref(seat, c.AliCtiExtensionFixtures.rows, 'exten', seat.bindTel, 'telephone extension');
    for (const qno of seat.qnos) ref(seat, c.AliCtiQueueFixtures.queues, 'qno', qno, 'telephone queue');
  }
});
check('呼入入口与供应商路由仅使用本企业时间条件、号码、分机与IVR', () => {
  for (const route of d.inboundRoutes) {
    owned(route, route.routeId);
    ref(route, d.phoneNumbers, 'numberId', route.numberId, 'route number');
    ref(route, d.contactFlows, 'contactFlowId', route.contactFlowId, 'route flow');
    for (const branch of route.branches) {
      owned({ ...branch, enterpriseId: route.enterpriseId }, 'route branch');
      ref(route, d.physicalSkillGroups, 'physicalGroupId', branch.physicalGroupId, 'route skill');
      ref(route, d.callPlans, 'callPlanId', branch.callPlanId, 'route plan');
    }
  }
  const resources = c.AliCtiInboundMock.resources;
  for (const rows of Object.values(resources)) for (const row of rows) owned(row, 'inbound resource');
  for (const row of c.AliCtiTimeFixtures.rows) owned(row, 'time condition');
  for (const route of c.AliCtiInboundMock.rows) {
    owned(route, 'supplier route');
    for (const id of route.ruleTimeProperty.split(';').filter(Boolean)) ref(route, c.AliCtiTimeFixtures.rows, 'id', id, 'supplier route time');
    for (const trunk of route.ruleTrunkProperty.split(';').filter(Boolean)) ref(route, resources.trunks, 'numberTrunk', trunk, 'supplier route trunk');
    if (route.routerType === '1') ref(route, resources.ivrs, 'id', route.routerProperty, 'supplier route IVR');
    if (route.routerType === '3') ref(route, c.AliCtiExtensionFixtures.rows, 'exten', route.routerProperty, 'supplier route extension');
  }
});
check('旧企业关系缓存仅重置已知原型模块，未知键保留，新版数据刷新继续保留', () => {
  const old = fixture({ session: signedIn() });
  const batches = JSON.parse(old.localStorage.getItem('customer-task-batches-v1'));
  for (const batch of batches) if (batch.tenantId === 'TEN-NISSAN-SH') batch.enterpriseId = '7522240';
  old.localStorage.setItem('customer-task-batches-v1', JSON.stringify(batches));
  old.localStorage.setItem('demo-enterprise-scope-schema-v2', '1');
  old.localStorage.setItem('unrelated-project-preference', 'retain');
  old.testStores.local.set('outside-project', 'retain too');
  old.sessionStorage.removeItem('demo-enterprise-scope-schema-v2');
  old.sessionStorage.setItem('cloud-task-created-v1', JSON.stringify([{ taskId: 'OLD-SH-TASK', tenantId: 'TEN-NISSAN-SH', enterpriseId: '7522240' }]));
  const next = fixture({ local: memory(Object.fromEntries(old.testStores.local)), session: memory(Object.fromEntries(old.testStores.session)) });
  assert.equal(next.localStorage.getItem('unrelated-project-preference'), 'retain');
  assert.equal(next.testStores.local.get('outside-project'), 'retain too');
  assert.equal(next.localStorage.getItem('demo-enterprise-scope-schema-v2'), '2');
  for (const batch of JSON.parse(next.localStorage.getItem('customer-task-batches-v1'))) owned(batch, 'reseeded batch');
  assert(!next.CloudCallData.tasks.some(task => task.taskId === 'OLD-SH-TASK'));
  const saved = JSON.parse(next.localStorage.getItem('customer-task-batches-v1')); saved[0].rows[0].note = '新版中保存的备注';
  next.localStorage.setItem('customer-task-batches-v1', JSON.stringify(saved));
  const reloaded = fixture({ local: next.testStores.local, session: next.testStores.session });
  assert.equal(JSON.parse(reloaded.localStorage.getItem('customer-task-batches-v1'))[0].rows[0].note, '新版中保存的备注');
});
console.log(JSON.stringify({ result: failures.length ? 'fail' : 'pass', count: checks.length, checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
