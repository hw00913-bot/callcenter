/** Local softphone configuration and login integration; no network or provider SDK. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.join(__dirname, '..'), storageKey = 'alicti-seat-phone-config-v1', directoryKey = 'alicti-extension-directory-v2', checks = [];
const clone = value => JSON.parse(JSON.stringify(value));
function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}
function setup({ local = storage(), role = 'ADMIN', explicit, cno = '0012' } = {}) {
  const state = { accountId: 'ACC-OPS-108', sessionId: 'PHONE-CONFIG-QA', enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', activeDomain: 'CLOUD_CONTACT_CENTER' };
  const access = { valid: true, roleCode: role }, account = { accountId: state.accountId, status: '启用' };
  const agent = { contactCenterIdentityId: 'PHONE-QA', agentRecordId: 'PHONE-QA', accountId: state.accountId, enterpriseId: state.enterpriseId, tenantId: state.tenantId, cno, userName: '分机验证坐席', lifecycleStatus: '已启用', agentStatus: '离线', syncStatus: '同步成功', currentCall: false, callEnabled: true, acceptNewTasks: true };
  if (explicit !== undefined) agent.softphoneExtension = explicit;
  const data = { agents: [agent], accounts: [account], memberships: [], tenants: ['TEN-NISSAN-HQ', 'TEN-NISSAN-SH'].map(tenantId => ({ tenantId, enterpriseId: tenantId === 'TEN-NISSAN-SH' ? '7522241' : '7522240', status: '启用', capabilitySet: ['CLOUD_CONTACT_CENTER'] })) };
  const heldLocks = new Set(), callbacks = [], work = { phase: 'idle', busy: false };
  const ctx = { console, Date, Map, Set, JSON, Object, Array, Number, structuredClone, localStorage: local, CloudCallData: data,
    AppState: { get: () => state, effectiveAccess: () => access, account: () => account, isReady: () => true, hasCapability: () => true, authorizeObject: (_, row) => row.enterpriseId === state.enterpriseId && (access.roleCode === 'SUPER_ADMIN' || row.tenantId === state.tenantId) },
    navigator: { locks: { request: async (key, options, fn) => { if (heldLocks.has(key)) return fn(null); heldLocks.add(key); try { return await fn({ name: key }); } finally { heldLocks.delete(key); } } } },
    AgentWorkbench: { current: () => work }, AliCtiAdapter: { scenario: 'success', session: null },
    setTimeout: fn => { callbacks.push(fn); return callbacks.length; }, clearTimeout() {}, fetch() { throw Error('UNEXPECTED NETWORK'); } };
  ctx.window = ctx; vm.createContext(ctx);
  for (const file of ['js/components/tenant-supervisor-policy.js', 'mock/seat-operations.js', 'mock/extensions.js', 'js/components/alicti-fields.js', 'js/components/alicti-extensions.js', 'js/components/seat-phone-config.js', 'js/components/alicti-seat-operations.js']) {
    if (file === 'js/components/alicti-extensions.js') {
      ctx.AliCtiExtensionFixtures = clone(ctx.AliCtiExtensionFixtures);
      const seed = ctx.AliCtiExtensionFixtures.rows[0];
      // Independent, explicit inventory resources for concurrency/persistence scenarios.
      for (const exten of ['000123','006789','008888','1234','5678','000777','000888','005555','006666','1111','001111','002222','003333','12345','00123','00567','000444','000999','000909']) ctx.AliCtiExtensionFixtures.rows.push({...seed,id:'QA-'+exten,exten,enterpriseId:exten==='000777'?'7522241':'7522240',tenantId:exten==='000777'?'TEN-NISSAN-SH':'TEN-NISSAN-HQ'});
    }
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  }
  const api = ctx.SeatPhoneConfig, operations = ctx.AliCtiSeatOperations;
  const options = read => ({expectedContext:read.context,expectedRevision:read.revision,expectedDirectoryRevision:read.directoryRevision,expectedDirectoryContext:read.directoryContext});
  const save = value => api.save(agent.contactCenterIdentityId, value, options(api.read(agent)));
  const directory = () => clone(local.getItem(directoryKey) ? JSON.parse(local.getItem(directoryKey)) : {schemaVersion:2,revision:0,rows:ctx.AliCtiExtensionFixtures.rows,deleted:[]});
  const patchDirectory = fn => {const next=directory();fn(next.rows);next.revision+=1;local.setItem(directoryKey,JSON.stringify(next));return next;};
  const finish = async promise => { while (callbacks.length) callbacks.shift()(); return promise; };
  return { ctx, api, operations, state, access, agent, data, local, heldLocks, callbacks, work, save, options, directory, patchDirectory, finish, login: () => finish(operations.login(agent, { workingMode: '0' })) };
}
const good = value => assert.equal(value.ok, true, JSON.stringify(value));
async function check(name, fn) { await fn(); checks.push(name); }
(async () => {
  await check('显式演示分机可读，工号与手机号不会生成分机', async () => {
    const f = setup(); good(f.api.read({ ...f.agent })); assert.equal(f.api.extension(f.agent), '80000012'); assert.equal(f.local.getItem(storageKey), null);
    const blank = setup({ cno: '9921' }); blank.agent.mobile = '13912345678'; assert.equal(blank.api.extension(blank.agent), ''); assert(!(await blank.login()).ok); assert.equal(blank.operations.trace.length, 0);
  });
  await check('管理员保存后刷新恢复，前导零原样保留', async () => {
    const f = setup(); good(await f.save('000123')); assert.equal(f.api.extension(f.agent), '000123'); const next = setup({ local: f.local }); assert.equal(next.api.extension(next.agent), '000123');
    const r = await next.login(); good(r); assert.equal(r.request.params.bindTel, '000123'); assert.equal(r.request.params.bindType, 3); assert.equal(r.request.params.cno, '0012');
  });
  await check('清空明确覆盖新建和演示旧值并阻止上线', async () => {
    const f = setup({ explicit: '006789' }); good(await f.save('')); f.ctx.AliCtiDemo = { phoneSettings: { 'PHONE-QA': { bindTel: '008888' } } }; assert.equal(f.api.extension(f.agent), '');
    const next = setup({ local: f.local, explicit: '006789' }); assert.equal(next.api.extension(next.agent), ''); assert(!(await next.login()).ok); assert.equal(next.operations.trace.length, 0);
  });
  await check('新建空配置不回退演示分机且只能选择有效目录项', async () => {
    const f = setup({ explicit: '' }); assert.equal(f.api.extension(f.agent), '');
    for (const value of [123, true, null, ' 0012', '0012 ', '10-01', 'ABC']) assert(!(await f.save(value)).ok);
    assert(!(await f.save('0')).ok); assert(!(await f.save('987654')).ok); good(await f.save('0012')); assert.equal(f.api.extension(f.agent), '0012');
  });
  await check('普通坐席只读不能维护，管理员不能跨租户写入', async () => {
    const operator = setup({ role: 'OPERATOR' }); assert.equal(operator.api.extension(operator.agent), '80000012'); assert(!(await operator.save('1234')).ok);
    const f = setup(); const other = { ...f.agent, contactCenterIdentityId: 'OTHER', tenantId: 'TEN-NISSAN-SH' }; f.data.agents.push(other);
    assert(!f.api.read(other).ok); assert(!(await f.api.save(other.contactCenterIdentityId, '5678')).ok); assert.equal(f.local.getItem(storageKey), null);
  });
  await check('超级管理员仅当前企业内获授权租户可维护', async () => {
    const f = setup({ role: 'SUPER_ADMIN' }), other = { ...f.agent, contactCenterIdentityId: 'OTHER', enterpriseId: '7522241', tenantId: 'TEN-NISSAN-SH', softphoneExtension: '' }; f.data.agents.push(other);
    assert(!(await f.api.save(other.contactCenterIdentityId, '000777')).ok);
    f.state.enterpriseId = '7522241'; f.state.tenantId = 'TEN-NISSAN-SH';
    good(await f.api.save(other.contactCenterIdentityId, '000777')); assert.equal(f.api.extension(other), '000777');
    f.state.enterpriseId = '7522240'; f.state.tenantId = 'TEN-NISSAN-HQ'; assert.equal(f.api.extension(f.agent), '80000012');
    other.enterpriseId = 'OTHER-ENTERPRISE'; assert(!(await f.api.save(other.contactCenterIdentityId, '333')).ok);
  });
  await check('存储键精确区分企业租户身份和前导零工号', async () => {
    const f = setup(); good(await f.save('000888')); const rows = JSON.parse(f.local.getItem(storageKey)).extensions;
    assert.deepEqual(Object.keys(rows), [JSON.stringify(['7522240', 'TEN-NISSAN-HQ', 'PHONE-QA', '0012'])]);
    f.agent.cno = '12'; assert.equal(f.api.extension(f.agent), ''); f.agent.cno = '0012'; assert.equal(f.api.extension(f.agent), '000888');
    assert(!f.api.read({ ...f.agent, cno: '12' }).ok);
  });
  await check('存储失败保留原配置不修改坐席对象', async () => {
    const f = setup(); good(await f.save('005555')); const raw = f.local.getItem(storageKey), before = JSON.stringify(f.agent); f.local.setItem = () => { throw Error('quota'); };
    assert(!(await f.save('006666')).ok); assert.equal(f.local.getItem(storageKey), raw); assert.equal(f.api.extension(f.agent), '005555'); assert.equal(JSON.stringify(f.agent), before);
  });
  await check('配置损坏不会被读取保存或登录过程覆盖', async () => {
    const f = setup(); f.local.setItem(storageKey, '{broken'); assert(!f.api.read(f.agent).ok); assert(!f.operations.profile(f.agent).ok); assert(!(await f.save('1111')).ok); assert(!(await f.login()).ok); assert.equal(f.local.getItem(storageKey), '{broken');
  });
  await check('旧表单版本或工作范围变化后保存被拒绝', async () => {
    const f = setup(), initial = f.api.read(f.agent); good(await f.save('001111')); assert(!(await f.api.save(f.agent.contactCenterIdentityId, '002222', { expectedContext: initial.context, expectedRevision: initial.revision })).ok);
    const current = f.api.read(f.agent); f.state.sessionId = 'NEW'; assert(!(await f.api.save(f.agent.contactCenterIdentityId, '003333', { expectedContext: current.context, expectedRevision: current.revision })).ok); assert.equal(f.api.extension(f.agent), '001111');
  });
  await check('在线通话与未知状态不可修改分机', async () => {
    for (const status of ['空闲', '示忙', '通话中', '话后处理', '待核对', '']) { const f = setup(); f.agent.agentStatus = status; assert(!(await f.save('12345')).ok, status); }
    for (const field of ['currentCall', 'currentEndpoint']) { const f = setup(); f.agent[field] = true; assert(!(await f.save('12345')).ok, field); }
    const logged = setup(); good(await logged.login()); assert(!(await logged.save('12345')).ok);
    const unknown = setup(); unknown.ctx.AliCtiAdapter.scenario = 'unknown'; assert((await unknown.login()).pending); assert(!(await unknown.save('12345')).ok);
  });
  await check('跨窗口持有坐席锁时维护失败，释放后可保存', async () => {
    const f = setup(), lock = 'unified-call-seat:' + f.agent.contactCenterIdentityId; f.heldLocks.add(lock); assert(!(await f.save('00123')).ok); assert.equal(f.local.getItem(storageKey), null); f.heldLocks.delete(lock); good(await f.save('00123'));
  });
  await check('没有锁能力时不冒险写入配置', async () => {
    const f = setup(); delete f.ctx.navigator.locks; assert(!(await f.save('00567')).ok); assert.equal(f.local.getItem(storageKey), null);
  });
  await check('第二窗口更新后旧表单不能覆盖新值', async () => {
    const f = setup(), initial = f.api.read(f.agent), second = setup({ local: f.local }); good(await second.save('000444'));
    assert(!(await f.api.save(f.agent.contactCenterIdentityId, '000999', { expectedContext: initial.context, expectedRevision: initial.revision })).ok); assert.equal(f.api.extension(f.agent), '000444');
  });
  await check('上线进行中配置变化时不产生错误设备会话', async () => {
    const f = setup(), pending = f.operations.login(f.agent, { workingMode: '0' }); f.local.setItem(storageKey, JSON.stringify({ schemaVersion: 1, revision: 1, extensions: { [JSON.stringify(['7522240', 'TEN-NISSAN-HQ', 'PHONE-QA', '0012'])]: '000909' } }));
    assert(!(await f.finish(pending)).ok); assert.equal(f.operations.current(), null); assert.equal(f.operations.trace.length, 0);
  });
  await check('旧任意分机原值保留且不能上线，可重新选择有效分机', async () => {
    for (const explicit of ['7654321','ABC',123]) {
      const f=setup({explicit}),read=f.api.read(f.agent);good(read);assert.equal(read.value,explicit);assert.equal(read.eligible,false);assert.equal(f.api.assignedValue(f.agent),explicit);assert.equal(f.api.extension(f.agent),'');assert(!f.operations.profile(f.agent).ok);assert(!(await f.login()).ok);assert.equal(f.operations.trace.length,0);assert(!f.directory().rows.some(row=>row.exten===explicit));
      good(await f.save('8101'));assert.equal(f.api.read(f.agent).eligible,true);good(await f.login());
    }
  });
  await check('同企业本租户启用的WebRTC资源才可选择，绑定类型仍为3', async () => {
    for (const patch of [{type:1},{type:3},{active:0},{tenantId:'TEN-NISSAN-SH'},{tenantId:''},{enterpriseId:'OTHER'}]) {
      const f=setup();f.patchDirectory(rows=>Object.assign(rows.find(row=>row.exten==='8101'),patch));assert(!(await f.save('8101')).ok);assert(!f.ctx.AliCtiExtensions.choices(f.agent).rows.some(row=>row.exten==='8101'));
    }
    const f=setup();good(await f.save('8101'));const login=await f.login();good(login);assert.equal(login.request.params.bindType,3);assert.equal(f.directory().rows.find(row=>row.exten==='8101').type,2);
  });
  await check('供应商绑定其他工号或未知绑定均拒绝，精确同工号才允许', async () => {
    for (const binding of ['12','0099',12,undefined,{}]) {const f=setup();f.patchDirectory(rows=>{const row=rows.find(row=>row.exten==='8101');if(binding===undefined)delete row.bindCno;else row.bindCno=binding;});assert(!(await f.save('8101')).ok);}
    for(const binding of ['0012','',null]) {const f=setup();f.patchDirectory(rows=>rows.find(row=>row.exten==='8101').bindCno=binding);good(await f.save('8101'));}
  });
  await check('同企业其他未删除坐席跨租户占用也不可重复，删除或其他企业不占用', async () => {
    for (const extra of [{},{tenantId:'TEN-NISSAN-SH'},{lifecycleStatus:'已停用'}]) {const f=setup();f.data.agents.push({...f.agent,contactCenterIdentityId:'OTHER',cno:'1001',softphoneExtension:'8101',...extra});assert(!(await f.save('8101')).ok);assert(!f.ctx.AliCtiExtensions.choices(f.agent).rows.some(row=>row.exten==='8101'));}
    for(const extra of [{lifecycleStatus:'已删除'},{enterpriseId:'OTHER'}]) {const f=setup();f.data.agents.push({...f.agent,contactCenterIdentityId:'OTHER',cno:'1001',softphoneExtension:'8101',...extra});good(await f.save('8101'));}
  });
  await check('目录缺失或损坏时保留原值并关闭选择上线，损坏数据不覆盖', async () => {
    const missing=setup();missing.ctx.AliCtiExtensions=undefined;const read=missing.api.read(missing.agent);good(read);assert.equal(read.value,'80000012');assert.equal(read.eligible,false);assert(!(await missing.save('8101')).ok);assert(!(await missing.save('')).ok);assert(!(await missing.login()).ok);
    const damaged=setup();damaged.local.setItem(directoryKey,'{broken');good(damaged.api.read(damaged.agent));assert.equal(damaged.api.read(damaged.agent).eligible,false);assert(!(await damaged.save('8101')).ok);assert(!(await damaged.login()).ok);assert.equal(damaged.local.getItem(directoryKey),'{broken');
  });
  await check('目录版本或目录上下文过期不能保存', async () => {
    const f=setup(),read=f.api.read(f.agent);f.patchDirectory(rows=>rows.find(row=>row.exten==='8102').areaCode='010');assert(!(await f.api.save(f.agent.contactCenterIdentityId,'8101',f.options(read))).ok);assert.equal(f.local.getItem(storageKey),null);
    const current=f.api.read(f.agent);assert(!(await f.api.save(f.agent.contactCenterIdentityId,'8101',{...f.options(current),expectedDirectoryContext:'OLD'})).ok);good(await f.save('8101'));
  });
  await check('进入共享锁后重查目录与坐席占用，不能使用旧候选', async () => {
    for(const mutate of [f=>f.patchDirectory(rows=>rows.find(row=>row.exten==='8101').active=0),f=>f.data.agents.push({...f.agent,contactCenterIdentityId:'OTHER',cno:'1001',softphoneExtension:'8101'})]) {const f=setup(),request=f.ctx.navigator.locks.request;let changed=false;f.ctx.navigator.locks.request=(key,opts,fn)=>request(key,opts,lock=>{if(key===storageKey&&!changed){changed=true;mutate(f);}return fn(lock);});assert(!(await f.save('8101')).ok);assert.equal(f.local.getItem(storageKey),null);}
    const f=setup();f.heldLocks.add(storageKey);assert(!(await f.save('8101')).ok);f.heldLocks.delete(storageKey);good(await f.save('8101'));
  });
  await check('上线等待期间目录停用、分配变更或单纯版本变化均不生成会话', async () => {
    for(const patch of [{active:0},{tenantId:'TEN-NISSAN-SH'},{areaCode:'010'}]) {const f=setup(),pending=f.operations.login(f.agent,{workingMode:'0'});f.patchDirectory(rows=>Object.assign(rows.find(row=>row.exten==='80000012'),patch));assert(!(await f.finish(pending)).ok);assert.equal(f.operations.current(),null);assert.equal(f.operations.trace.length,0);}
  });
  await check('已登录会话不因目录变化阻断正常下线', async () => {
    const f=setup();good(await f.login());f.patchDirectory(rows=>rows.find(row=>row.exten==='80000012').active=0);assert(!f.operations.profile(f.agent).ok);good(await f.finish(f.operations.logout(f.agent,{removeBinding:0})));assert.equal(f.operations.current(),null);
  });
  await check('配置抽屉使用受控选择且旧值不可用仍能打开更正', async () => {
    const f=setup({explicit:'7654321'});let opened=null;const nodes=new Map();
    f.ctx.PlatformUI={escape:value=>String(value??''),openLayer:(id,html)=>{opened={id,html};},closeLayer(){}};f.ctx.AccountSeat={inUse:()=>false};f.ctx.Pages={};f.ctx.CloudResourceRules={id:prefix=>prefix+'-QA'};f.ctx.CloudCallRuntime={tenant:id=>f.data.tenants.find(t=>t.tenantId===id)};f.ctx.AppState.canMenu=()=>true;f.ctx.AppState.scoped=rows=>rows;f.ctx.document={getElementById:id=>nodes.get(id)||null};f.ctx.showToast=()=>{};
    vm.runInContext(fs.readFileSync(path.join(root,'js/pages/agent-center.js'),'utf8'),f.ctx);
    f.ctx.Pages['agent-center'].openPhoneConfig(f.agent.contactCenterIdentityId);assert.equal(opened.id,'agent-phone-config');assert.match(opened.html,/<select id="agent-softphone-extension"/);assert(!opened.html.includes('<input id="agent-softphone-extension"'));assert.match(opened.html,/value="7654321" selected disabled/);assert.match(opened.html,/value="8101"/);assert(!opened.html.includes('value="8201"'));
    const tenant=f.data.tenants[0],create={userName:'新坐席',cno:'0019',areaCode:'021'};for(const value of ['8101','7654321',12])assert(!f.ctx.Pages['agent-center'].buildAgent({...create,softphoneExtension:value},tenant).ok);good(f.ctx.Pages['agent-center'].buildAgent(create,tenant));assert.equal(f.ctx.Pages['agent-center'].buildAgent(create,tenant).agent.softphoneExtension,'');
  });
  await check('禁止外呼与仅内线分机拦截直接客户外呼，仍可接听和下线', async () => {
    for(const patch of [{isOb:0},{callPower:'3'}]) {
      const f=setup();f.ctx.document={body:null,documentElement:{}};f.ctx.MutationObserver=class{observe(){}};f.ctx.DemoSwitch={open(){}};f.ctx.crypto={randomUUID:()=> 'OUTBOUND-QA'};f.ctx.AliCtiDemo={previewAsr:0,transcriptionGate:()=>({eligible:false})};f.data.phoneNumbers=[];
      vm.runInContext(fs.readFileSync(path.join(root,'js/components/alicti-adapter.js'),'utf8'),f.ctx);
      good(await f.login());good(f.ctx.AliCtiAdapter.previewOutcall(f.agent,'13912345678','02100006101',{}));const prior=f.ctx.AliCtiAdapter.lastRequest;
      f.patchDirectory(rows=>Object.assign(rows.find(row=>row.exten==='80000012'),patch));assert(!f.operations.canDial());assert(f.operations.canReceive('inbound'));assert(f.operations.canReceive('predictive'));
      const blocked=f.ctx.AliCtiAdapter.previewOutcall(f.agent,'13912345678','02100006101',{});assert(!blocked.ok);assert(blocked.message);assert.equal(f.ctx.AliCtiAdapter.lastRequest,prior);good(await f.finish(f.operations.logout(f.agent,{removeBinding:0})));
    }
  });
  await check('目录方法未就绪不能直调外呼，未加载目录的独立旧夹具维持兼容', async () => {
    const f=setup();f.ctx.document={body:null,documentElement:{}};f.ctx.MutationObserver=class{observe(){}};f.ctx.DemoSwitch={open(){}};f.ctx.crypto={randomUUID:()=> 'OUTBOUND-QA'};f.ctx.AliCtiDemo={previewAsr:0,transcriptionGate:()=>({eligible:false})};f.data.phoneNumbers=[];
    vm.runInContext(fs.readFileSync(path.join(root,'js/components/alicti-adapter.js'),'utf8'),f.ctx);good(await f.login());const original=f.ctx.AliCtiExtensions,prior=f.ctx.AliCtiAdapter.lastRequest;f.ctx.AliCtiExtensions={};assert(!f.operations.canDial());assert(!f.ctx.AliCtiAdapter.previewOutcall(f.agent,'13912345678','02100006101',{}).ok);assert.equal(f.ctx.AliCtiAdapter.lastRequest,prior);
    f.ctx.AliCtiExtensions=undefined;assert(f.operations.canDial());good(f.ctx.AliCtiAdapter.previewOutcall(f.agent,'13912345678','02100006101',{}));f.ctx.AliCtiExtensions=original;
  });
  console.log(JSON.stringify({ result: 'pass', count: checks.length, checks }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
