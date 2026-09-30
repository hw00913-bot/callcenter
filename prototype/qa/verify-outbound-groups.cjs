/* Outbound groups management and predictive task integration regression.
 * Runs with real index scripts, AppState role/tenant boundaries and workspace wizard. No network.
 */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const base = path.resolve(__dirname, '..'), checks = [], failures = [];
const files = [...fs.readFileSync(path.join(base, 'index.html'), 'utf8').matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
const clone = value => JSON.parse(JSON.stringify(value)), storageKey = 'outbound-groups-v1';
async function check(name, fn) { try { await fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.stack }); } }

function fixture(options = {}) {
  const local = options.local || new Map(), session = options.session || new Map(), timers = new Map(), layers = new Map(), nodes = new Map();
  let timerId = 0, uuid = 0;
  session.set('alicti-demo-v2:unified-call-context-v3', JSON.stringify({ accountId: 'ACC-ADMIN-018', tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', ...options.scope, sessionId: 'outbound-group-test', activeDomain: options.domain || 'CLOUD_CONTACT_CENTER', authStage: 'READY', currentPage: 'home' }));
  class Storage {
    constructor(map) { this.map = map; }
    getItem(key) { return this.map.get(String(key)) ?? null; }
    setItem(key, value) { this.map.set(String(key), String(value)); }
    removeItem(key) { this.map.delete(String(key)); }
    clear() { this.map.clear(); }
    key(index) { return [...this.map.keys()][index] ?? null; }
    get length() { return this.map.size; }
  }
  const element = () => ({ style: {}, dataset: {}, value: '', checked: false, hidden: false, innerHTML: '', textContent: '', isConnected: true, scrollTop: 0, childNodes: [],
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, append() {}, prepend() {}, appendChild() {}, insertBefore() {}, remove() {}, addEventListener() {}, setAttribute() {}, getAttribute: () => null,
    querySelector: () => null, querySelectorAll: () => [], scrollIntoView() {}, focus() {}, getBoundingClientRect: () => ({ width: 1440, height: 1000 }) });
  for (const id of ['page-content', 'businessNavigation', 'breadcrumb']) nodes.set(id, element());
  const liveHtml = () => [...layers.values(), nodes.get('page-content').innerHTML].join('');
  const find = id => {
    if (nodes.has(id)) return nodes.get(id);
    if (layers.has(id) || liveHtml().includes(`id="${id}"`)) { const node = element(); nodes.set(id, node); return node; }
    return null;
  };
  const document = { addEventListener() {}, dispatchEvent() {}, getElementById: find, querySelector: () => null, querySelectorAll: () => [], createElement: element, createTreeWalker: () => ({ nextNode: () => null }), documentElement: element(), body: element(), head: element(), activeElement: null };
  const ctx = { URL, URLSearchParams, structuredClone, console, Date, Storage, localStorage: new Storage(local), sessionStorage: new Storage(session), document,
    navigator: { locks: { request: (_key, _options, fn) => Promise.resolve(fn({ name: 'test-outbound-group-lock' })) } }, NodeFilter: { SHOW_TEXT: 4 },
    location: { hash: '#outbound-group-management', search: '', pathname: '/index.html', href: 'http://localhost/index.html' }, history: { replaceState() {}, pushState() {} },
    crypto: { randomUUID: () => String(++uuid).padStart(8, '0') + '-0000-4000-8000-000000000000' }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }, addEventListener() {}, dispatchEvent() {},
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id), setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: false, addEventListener() {} }), MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} },
    fetch() { throw Error('Unexpected network request'); }, performance: { now: () => Date.now() }, innerWidth: 1440, innerHeight: 1000 };
  ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), ctx, { filename: file });
  const tables = [], toasts = [];
  const table = ctx.PlatformUI.table;
  ctx.PlatformUI.table = (columns, rows, ...rest) => { tables.push(clone(rows)); return table(columns, rows, ...rest); };
  ctx.PlatformUI.openLayer = (id, html) => { layers.set(id, html); nodes.set(id, element()); };
  ctx.PlatformUI.closeLayer = id => { layers.delete(id); nodes.delete(id); };
  ctx.showToast = (message, kind) => toasts.push({ message, kind });
  ctx.test = { local, session, layers, timers, nodes, tables, toasts,
    page: nodes.get('page-content'), nav: nodes.get('businessNavigation'),
    render() { const html = ctx.OutboundGroupManagement.render(); nodes.get('page-content').innerHTML = html; return html; },
    rows: () => tables.at(-1) || [], saved: () => ctx.localStorage.getItem(storageKey)
  };
  return ctx;
}

const admin = () => fixture();
const storeAdmin = () => fixture({ scope: { tenantId: 'TEN-NISSAN-SH' } });
const superAdmin = () => fixture({ scope: { accountId: 'ACC-SUPER-001', tenantId: 'ALL_IN_INSTANCE' } });
const operator = () => fixture({ scope: { accountId: 'ACC-OPS-108', tenantId: 'TEN-NISSAN-HQ' } });

(async () => {
  await check('真实入口按顺序加载外呼组服务与页面并配置导航菜单', () => {
    const c = admin();
    assert(c.OutboundGroups && c.OutboundGroupManagement && c.Pages['outbound-group-management']);
    assert(files.indexOf('js/components/outbound-groups.js') >= 0);
    assert(files.indexOf('js/pages/outbound-group-management.js') > files.indexOf('js/components/outbound-groups.js'));
    const menuItems = (c.UnifiedCallMenu || []).flatMap(g => g.children || [g]);
    assert(menuItems.some(item => item.page === 'outbound-group-management' && item.label === '外呼组管理'));
  });

  await check('超管与租户管理员有权访问，普通坐席无权访问', () => {
    const cSuper = superAdmin(); assert(cSuper.OutboundGroups.canAccess());
    const cAdmin = admin(); assert(cAdmin.OutboundGroups.canAccess());
    const cOp = operator(); assert(!cOp.OutboundGroups.canAccess());
    const rendered = cOp.test.render();
    assert(rendered.includes('没有外呼组管理权限'));
  });

  await check('租户数据隔离：租户管理员只能操作本租户外呼组', () => {
    const cHq = admin();
    const cSh = storeAdmin();
    const createdHq = cHq.OutboundGroups.create({ name: '总部外呼一组', tenantId: 'TEN-NISSAN-HQ' }, cHq.OutboundGroups.contextKey(), cHq.OutboundGroups.revision());
    assert(createdHq.ok);

    const shList = cSh.OutboundGroups.list();
    assert(!shList.some(g => g.name === '总部外呼一组'));

    const failCross = cSh.OutboundGroups.create({ name: '越权组', tenantId: 'TEN-NISSAN-HQ' }, cSh.OutboundGroups.contextKey(), cSh.OutboundGroups.revision());
    assert(!failCross.ok);
  });

  await check('新增外呼组重名校验与名称规范', () => {
    const c = admin();
    const r1 = c.OutboundGroups.create({ name: '销售邀约组', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(r1.ok);
    const r2 = c.OutboundGroups.create({ name: '销售邀约组', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(!r2.ok && r2.message.includes('已存在'));
    const rEmpty = c.OutboundGroups.create({ name: '', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(!rEmpty.ok);
  });

  await check('退役格式不自动迁移、不补供应商已核验，原始存储保留', () => {
    const local = new Map(), key = 'alicti-demo-v2:' + storageKey;
    const raw = JSON.stringify({schemaVersion:1,revision:1,groups:[{outboundGroupId:'OLD-1',name:'旧组',tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240',memberIdentityIds:[],revision:1,mock:true,providerVerified:false,demoAgentGroup:'DEMO-OLD-GROUP'}]});
    local.set(key, raw);
    const c = fixture({local});
    assert.equal(c.OutboundGroups.list().length,0);
    assert(c.OutboundGroups.storageError());
    assert.equal(local.get(key),raw);
    assert(!c.OutboundGroups.create({name:'拒绝覆盖旧存储',tenantId:'TEN-NISSAN-HQ'},c.OutboundGroups.contextKey(),c.OutboundGroups.revision()).ok);
    assert.equal(local.get(key),raw);
  });

  await check('维护成员限制为本租户有效坐席并持久化', () => {
    const c = admin();
    const r = c.OutboundGroups.create({ name: '回访专员组', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(r.ok);
    const gid = r.group.outboundGroupId;

    const candidates = c.OutboundGroups.candidates('TEN-NISSAN-HQ', '7522240');
    assert(candidates.length >= 2);
    const memberIds = candidates.slice(0, 2).map(a => a.contactCenterIdentityId);

    const setRes = c.OutboundGroups.setMembers(gid, memberIds, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(setRes.ok);

    const loaded = c.OutboundGroups.get(gid);
    assert.equal(loaded.memberCount, 2);
    assert.deepEqual(clone(loaded.memberIdentityIds), clone(memberIds));
  });

  await check('关联在途任务时阻止维护外呼组成员', () => {
    const c = admin();
    const r = c.OutboundGroups.create({ name: '锁定测试组', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(r.ok);
    const gid = r.group.outboundGroupId;
    const candidates = c.OutboundGroups.candidates('TEN-NISSAN-HQ', '7522240');
    c.OutboundGroups.setMembers(gid, [candidates[0].contactCenterIdentityId], c.OutboundGroups.contextKey(), c.OutboundGroups.revision());

    c.CloudCallData.tasks.push({
      taskId: 'TASK-OCCUPIED-001',
      name: '运行中的测试任务',
      status: '执行中',
      tenantId: 'TEN-NISSAN-HQ',
      enterpriseId: '7522240',
      callType: '预外呼',
      callGroupType: 2,
      outboundGroupId: gid,
      outboundGroupSnapshot: c.OutboundGroups.forTask(gid, { tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240' })
    });

    const setRes = c.OutboundGroups.setMembers(gid, [], c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(!setRes.ok);
    assert(setRes.message.includes('请先结束或删除关联任务'));
  });

  await check('AliCtiFields.taskFields 识别 callGroupType=2 并构建 agentGroup', () => {
    const c = admin();
    const r = c.OutboundGroups.create({ name: '预测外呼专组', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    const candidates = c.OutboundGroups.candidates('TEN-NISSAN-HQ', '7522240');
    c.OutboundGroups.setMembers(r.group.outboundGroupId, [candidates[0].contactCenterIdentityId], c.OutboundGroups.contextKey(), c.OutboundGroups.revision());

    const draft = {
      draftId: 'D-PRED-1',
      type: '预外呼',
      tenantId: 'TEN-NISSAN-HQ',
      enterpriseId: '7522240',
      values: {
        name: '外呼组预测任务',
        callGroupType: 2,
        outboundGroupId: r.group.outboundGroupId,
        callStrategy: '4',
        minAvailableAgentCount: 1,
        callerMode: 'navigation',
        customerClidsGroup: c.CloudCallData.instances.find(row=>row.enterpriseId==='7522240').callerNavigations[0].customerClidsGroup,
        retryPolicy: c.AliCtiRetry.create('预外呼')
      }
    };

    const taskFields = c.AliCtiFields.taskFields(draft, c.CloudCallData);
    assert.equal(taskFields.fields.type, 1);
    assert.equal(taskFields.fields.callGroupType, 2);
    assert.equal(taskFields.fields.agentGroup, r.group.gno);
    assert(!Object.hasOwn(taskFields.fields,'outboundGroupId'));
    assert.equal(taskFields.errors.length, 0);
  });

  await check('空成员外呼组在 taskFields 校验时报错拦截', () => {
    const c = admin();
    const r = c.OutboundGroups.create({ name: '空外呼组', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());

    const draft = {
      draftId: 'D-PRED-EMPTY',
      type: '预外呼',
      tenantId: 'TEN-NISSAN-HQ',
      enterpriseId: '7522240',
      values: {
        name: '空外呼组任务',
        callGroupType: 2,
        outboundGroupId: r.group.outboundGroupId,
        callStrategy: '4',
        minAvailableAgentCount: 1,
        retryPolicy: c.AliCtiRetry.create('预外呼')
      }
    };

    const taskFields = c.AliCtiFields.taskFields(draft, c.CloudCallData);
    assert(taskFields.errors.some(e => e.includes('暂无成员')));
  });

  await check('外呼组互斥：同一外呼组被其他运行中任务占用时拦截启动', () => {
    const c = admin();
    const r = c.OutboundGroups.create({ name: '互斥检查外呼组', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    const candidates = c.OutboundGroups.candidates('TEN-NISSAN-HQ', '7522240');
    c.OutboundGroups.setMembers(r.group.outboundGroupId, [candidates[0].contactCenterIdentityId], c.OutboundGroups.contextKey(), c.OutboundGroups.revision());

    const task1 = {
      taskId: 'TASK-MUTEX-01',
      name: '占用任务1',
      status: '执行中',
      tenantId: 'TEN-NISSAN-HQ',
      enterpriseId: '7522240',
      callType: '预外呼',
      simulation: true,
      callGroupType: 2,
      outboundGroupId: r.group.outboundGroupId,
      outboundGroupSnapshot: c.OutboundGroups.forTask(r.group.outboundGroupId, { tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240' })
    };
    c.CloudCallData.tasks.push(task1);

    const task2 = {
      taskId: 'TASK-MUTEX-02',
      name: '新任务2',
      status: '待启动',
      tenantId: 'TEN-NISSAN-HQ',
      enterpriseId: '7522240',
      callType: '预外呼',
      simulation: true,
      callGroupType: 2,
      outboundGroupId: r.group.outboundGroupId,
      outboundGroupSnapshot: c.OutboundGroups.forTask(r.group.outboundGroupId, { tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240' })
    };

    const err = c.OutboundGroups.executionError(task2);
    assert(err.includes('同一外呼组不能同时运行两个预测任务'));
  });

  await check('预测任务互斥覆盖指定坐席、外呼组及两种方式交叉，区分企业和前导零', () => {
    const c=admin();c.CloudCallData.tasks=[];
    const a=c.OutboundGroups.candidates('TEN-NISSAN-HQ','7522240')[0];
    const g=c.OutboundGroups.create({name:'互斥组',gno:'MUTEX1',tenantId:'TEN-NISSAN-HQ',memberIdentityIds:[a.contactCenterIdentityId]},c.OutboundGroups.contextKey(),c.OutboundGroups.revision()).group;
    const base={enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',callType:'预外呼'};
    const group={...base,taskId:'GROUP',name:'外呼组任务',status:'待启动',callGroupType:2,outboundGroupId:g.outboundGroupId,agentGroup:g.gno};
    const direct={...base,taskId:'DIRECT',name:'指定坐席任务',status:'执行中',planSnapshot:{callGroupType:1,cnos:a.cno}};
    c.CloudCallData.tasks=[direct];assert.match(c.OutboundGroups.executionError(group),/工号/);
    group.status='执行中';direct.status='待启动';c.CloudCallData.tasks=[group];assert.match(c.OutboundGroups.executionError(direct),/工号/);
    const direct2={...direct,taskId:'DIRECT2',status:'执行中'};c.CloudCallData.tasks=[direct2];assert.match(c.OutboundGroups.executionError(direct),/工号/);
    direct2.planSnapshot={callGroupType:1,cnos:'0'+a.cno};assert.equal(c.OutboundGroups.executionError(direct),'');
    direct2.planSnapshot=direct.planSnapshot;direct2.enterpriseId='OTHER';assert.equal(c.OutboundGroups.executionError(direct),'');
    direct2.enterpriseId=base.enterpriseId;direct2.status='已暂停';assert.equal(c.OutboundGroups.executionError(direct),'');
    direct2.alictiTaskControlPending=true;assert.match(c.OutboundGroups.executionError(direct),/待核对/);
    direct2.alictiTaskControlPending=false;direct2.status='执行中';direct2.callType='IVR 外呼';assert.equal(c.OutboundGroups.executionError(direct),'');
    direct2.callType='预外呼';direct2.displayOnly=true;assert.equal(c.OutboundGroups.executionError(direct),'');
    // A persisted illegal duplicate membership must fail closed without overwriting it.
    c.CloudCallData.tasks=[];
    const second=c.OutboundGroups.create({name:'另一组',gno:'MUTEX2',tenantId:base.tenantId},c.OutboundGroups.contextKey(),c.OutboundGroups.revision());assert(second.ok);
    const stored=JSON.parse(c.localStorage.getItem(storageKey));stored.revision++;stored.groups[1].memberIdentityIds=[a.contactCenterIdentityId];
    c.localStorage.setItem(storageKey,JSON.stringify(stored));assert.equal(c.OutboundGroups.refresh(),false);assert.match(c.OutboundGroups.storageError(),/多个外呼组/);
  });

  await check('任务工作台 optionsFor 返回当前租户外呼组列表', () => {
    const c = admin();
    c.OutboundGroups.create({ name: '工作台选项测试组', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    const opts = c.CloudTaskWorkspace.optionsFor ? c.CloudTaskWorkspace.optionsFor({ tenantId: 'TEN-NISSAN-HQ', enterpriseId: '7522240', type: '预外呼', values: {} }) : null;
    if (opts) {
      assert(Array.isArray(opts.outboundGroups));
      assert(opts.outboundGroups.some(g => g.name === '工作台选项测试组'));
    }
  });

  await check('随机编号始终包含数字且符合长度与字符约束', () => {
    const c=admin();
    for(const value of [0,0.8,0.999999999]) {
      vm.runInContext(`Math.random = () => ${value}`,c);
      for(const prefix of ['WH','ABCD','A','中文','123','']) {
        const generated=c.OutboundGroups.generateGno(prefix);
        assert(c.AliCtiFields.validGno(generated),generated);
      }
    }
    c.test.render();
    c.OutboundGroupManagement.create();
    assert(![...c.test.layers.values()].join('').includes('外呼外呼组编号'));
  });

  await check('gno 规范校验：字母开头、2-20位且同时含字母数字，拦截纯字母及跨组重复', () => {
    const c = admin();
    // 非法 gno 测试
    const rInvalid1 = c.OutboundGroups.create({ name: '非法组1', gno: '123ABC', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(!rInvalid1.ok && rInvalid1.message.includes('2-20位'));

    const rInvalid2 = c.OutboundGroups.create({ name: '非法组2', gno: 'A_B_C', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(!rInvalid2.ok && rInvalid2.message.includes('2-20位'));

    const rLetters = c.OutboundGroups.create({ name: '纯字母组', gno: 'ONLYLETTERS', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(!rLetters.ok && rLetters.message.includes('同时包含'));
    assert(!c.AliCtiFields.agentGroupFields.create({gno:'ONLYLETTERS',groupName:'纯字母组'}).ok);
    assert(!c.AliCtiFields.agentGroupFields.update({gno:'ONLYLETTERS',groupName:'纯字母组'}).ok);
    assert(c.AliCtiFields.validGno('A1'));
    assert(c.AliCtiFields.validGno('A1234567890123456789'));
    assert(!c.AliCtiFields.validGno('A12345678901234567890'));

    // 合规 gno 测试
    const rValid1 = c.OutboundGroups.create({ name: '合规组1', gno: 'GNO101', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(rValid1.ok);
    assert.equal(rValid1.group.gno, 'GNO101');

    // 重复 gno 测试
    const rDup = c.OutboundGroups.create({ name: '重复组', gno: 'GNO101', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(!rDup.ok && rDup.message.includes('已存在'));
  });

  await check('单租户多外呼组绑定与跨租户严格数据隔离验证', () => {
    const cHq = admin();
    const cSh = storeAdmin();

    // HQ 创建 2 个外呼组 (1 租户 : N 组)
    const gHq1 = cHq.OutboundGroups.create({ name: 'HQ-外呼组A', gno: 'HQ001', tenantId: 'TEN-NISSAN-HQ' }, cHq.OutboundGroups.contextKey(), cHq.OutboundGroups.revision());
    const gHq2 = cHq.OutboundGroups.create({ name: 'HQ-外呼组B', gno: 'HQ002', tenantId: 'TEN-NISSAN-HQ' }, cHq.OutboundGroups.contextKey(), cHq.OutboundGroups.revision());
    assert(gHq1.ok && gHq2.ok);

    // SH 创建 1 个外呼组
    const gSh = cSh.OutboundGroups.create({ name: 'SH-外呼组A', gno: 'SH001', tenantId: 'TEN-NISSAN-SH' }, cSh.OutboundGroups.contextKey(), cSh.OutboundGroups.revision());
    assert(gSh.ok);

    // HQ 管理员看不到 SH 的外呼组
    const hqList = cHq.OutboundGroups.list();
    assert(hqList.some(g => g.gno === 'HQ001') && hqList.some(g => g.gno === 'HQ002'));
    assert(!hqList.some(g => g.gno === 'SH001'));

    // 跨租户不能将 SH 坐席分配给 HQ 外呼组
    const shCandidates = cSh.OutboundGroups.candidates('TEN-NISSAN-SH', '7522241');
    assert(shCandidates.length > 0);
    const assignCross = cHq.OutboundGroups.setMembers(gHq1.group.outboundGroupId, [shCandidates[0].contactCenterIdentityId], cHq.OutboundGroups.contextKey(), cHq.OutboundGroups.revision());
    assert(!assignCross.ok);
  });

  await check('座席排他性机制：同一座席加入新外呼组时自动从原有外呼组移出', () => {
    const c = admin();
    const g1 = c.OutboundGroups.create({ name: '排他测试组1', gno: 'EX001', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    const g2 = c.OutboundGroups.create({ name: '排他测试组2', gno: 'EX002', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(g1.ok && g2.ok);

    const candidates = c.OutboundGroups.candidates('TEN-NISSAN-HQ', '7522240');
    const agentA = candidates[0].contactCenterIdentityId;
    const agentB = candidates[1].contactCenterIdentityId;

    // 将 agentA, agentB 分配给组 1
    const r1 = c.OutboundGroups.setMembers(g1.group.outboundGroupId, [agentA, agentB], c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(r1.ok);
    assert.equal(c.OutboundGroups.get(g1.group.outboundGroupId).memberCount, 2);

    // 将 agentA 分配给组 2
    const r2 = c.OutboundGroups.setMembers(g2.group.outboundGroupId, [agentA], c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(r2.ok);

    // 组 2 现在拥有 agentA
    const g2Now = c.OutboundGroups.get(g2.group.outboundGroupId);
    assert.equal(g2Now.memberCount, 1);
    assert(g2Now.memberIdentityIds.includes(agentA));

    // 组 1 现在只剩下 agentB，agentA 已被自动排他移出！
    const g1Now = c.OutboundGroups.get(g1.group.outboundGroupId);
    assert.equal(g1Now.memberCount, 1);
    assert(!g1Now.memberIdentityIds.includes(agentA));
    assert(g1Now.memberIdentityIds.includes(agentB));
  });

  await check('外呼组删除与在途任务占用拦截机制验证', () => {
    const c = admin();
    const g = c.OutboundGroups.create({ name: '待删除外呼组', gno: 'DEL001', tenantId: 'TEN-NISSAN-HQ' }, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(g.ok);
    const gid = g.group.outboundGroupId;

    // 关联在途执行任务
    c.CloudCallData.tasks.push({
      taskId: 'TASK-OCCUPIED-DEL',
      name: '删除拦截占用任务',
      status: '执行中',
      tenantId: 'TEN-NISSAN-HQ',
      enterpriseId: '7522240',
      callType: '预外呼',
      callGroupType: 2,
      outboundGroupId: gid
    });

    // 尝试删除，应被拦截
    const delFail = c.OutboundGroups.deleteGroup(gid, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(!delFail.ok);
    assert(delFail.message.includes('在途任务正在使用'));

    // 将任务置为完成状态
    const task = c.CloudCallData.tasks.find(t => t.taskId === 'TASK-OCCUPIED-DEL');
    task.status = '已完成';

    // 再次删除，成功
    const delSuccess = c.OutboundGroups.deleteGroup(gid, c.OutboundGroups.contextKey(), c.OutboundGroups.revision());
    assert(delSuccess.ok);
    assert.equal(c.OutboundGroups.get(gid), null);
  });

  await check('AliCti 官方 9 个 agentGroup API 适配器调用与返回值契约完整验证', async () => {
    const c = admin();
    const adapter = c.AliCtiAdapter.agentGroup;
    assert(adapter);

    // 1. agentGroup/create
    const resCreate = await adapter.create({ gno: 'API001', groupName: 'API测试外呼组', comment: '说明文本', tenantId: 'TEN-NISSAN-HQ' });
    assert.equal(resCreate.result, 0);
    assert.equal(resCreate.data.gno, 'API001');
    assert.equal(resCreate.data.groupName, 'API测试外呼组');

    // 2. agentGroup/get
    const resGet = await adapter.get({ gno: 'API001' });
    assert.equal(resGet.result, 0);
    assert.equal(resGet.data.gno, 'API001');

    // 3. agentGroup/update
    const resUpdate = await adapter.update({ gno: 'API001', groupName: 'API修改后名称', comment: '修改后说明' });
    assert.equal(resUpdate.result, 0);
    const resGetAfter = await adapter.get({ gno: 'API001' });
    assert.equal(resGetAfter.data.groupName, 'API修改后名称');

    // 4. agentGroup/assignAgent
    const candidates = c.OutboundGroups.candidates('TEN-NISSAN-HQ', '7522240');
    assert(candidates.length >= 2);
    const cno1 = candidates[0].cno;
    const cno2 = candidates[1].cno;
    const resAssign = await adapter.assignAgent({ gno: 'API001', cnos: `${cno1},${cno2}` });
    assert.equal(resAssign.result, 0);

    // 5. agentGroup/listAssignedAgent
    const resListAgents = await adapter.listAssignedAgent({ gno: 'API001' });
    assert.equal(resListAgents.result, 0);
    assert.equal(Number(resListAgents.total), 2);
    assert(resListAgents.data.some(a => a.cno === cno1));

    // 6. agentGroup/queryAgentGroup
    const resQuery = await adapter.queryAgentGroup({ cno: cno1 });
    assert.equal(resQuery.result, 0);
    assert.equal(resQuery.data.gno, 'API001');
    assert.equal(resQuery.data.groupName, 'API修改后名称');

    // 7. agentGroup/unassignAgent
    const resUnassign = await adapter.unassignAgent({ gno: 'API001', cno: cno1 });
    assert.equal(resUnassign.result, 0);
    const resListAfterUnassign = await adapter.listAssignedAgent({ gno: 'API001' });
    assert.equal(Number(resListAfterUnassign.total), 1);
    assert(!resListAfterUnassign.data.some(a => a.cno === cno1));

    // 8. agentGroup/list
    const resList = await adapter.list({ gno: 'API001' });
    assert.equal(resList.result, 0);
    assert(resList.data.some(g => g.ctiLinkAgentGroup.gno === 'API001'));
    assert.equal(resGet.data.id,resCreate.data.id);
    assert.equal(resList.data[0].ctiLinkAgentGroup.id,resCreate.data.id);
    assert.equal(resList.data[0].childGnos,null);
    assert.equal(resQuery.data.id,resCreate.data.id);
    assert.equal(resUpdate.data.groupName,'API修改后名称');
    assert(resListAgents.data.every(a=>a.cname&&a.gno==='API001'&&!Object.hasOwn(a,'tenantId')));

    // 9. agentGroup/delete
    const resDelete = await adapter.delete({ gno: 'API001' });
    assert.equal(resDelete.result, 0);
    const resGetDeleted = await adapter.get({ gno: 'API001' });
    assert.equal(resGetDeleted.result, -1);
  });

  await check('跨组转移、直接分配与解绑均保护在途任务，失败不部分改写', () => {
    for (const action of ['setMembers','create','assignAgent','unassignAgent']) {
      const c=admin(), api=c.OutboundGroups;
      const source=api.create({name:'被占用组',gno:'BUSY1',tenantId:'TEN-NISSAN-HQ'}).group;
      const target=api.create({name:'空闲组',gno:'FREE1',tenantId:'TEN-NISSAN-HQ'}).group;
      const agent=api.candidates('TEN-NISSAN-HQ','7522240')[0];
      assert(api.setMembers(source.outboundGroupId,[agent.contactCenterIdentityId]).ok);
      c.CloudCallData.tasks.push({taskId:'LOCK-TEST',name:'在途任务',status:'执行中',tenantId:source.tenantId,enterpriseId:source.enterpriseId,callGroupType:2,agentGroup:source.gno});
      const before=c.test.saved();
      const r=action==='setMembers'?api.setMembers(target.outboundGroupId,[agent.contactCenterIdentityId]):action==='create'?api.create({name:'偷移成员',gno:'STEAL1',tenantId:source.tenantId,memberIdentityIds:[agent.contactCenterIdentityId]}):action==='assignAgent'?api.assignAgent(target.gno,agent.cno):api.unassignAgent(source.gno,agent.cno);
      assert.equal(r.ok,false,action);assert.equal(c.test.saved(),before,action);
      assert.equal(api.get(source.outboundGroupId).memberCount,1);
      assert(!api.deleteGroup(source.outboundGroupId).ok,'按官方组号引用同样阻止删除');
    }
  });
  await check('外呼组工号原样保留，拒绝数值、歧义和不可用坐席', async () => {
    const c=admin(),api=c.OutboundGroups,g=api.create({name:'工号核对',gno:'CNO1',tenantId:'TEN-NISSAN-HQ'}).group;
    assert(!api.assignAgent(g.gno,[1001]).ok);
    assert(!c.AliCtiFields.agentGroupFields.assign({gno:g.gno,cnos:[1001]}).ok);
    assert(!c.AliCtiFields.agentGroupFields.unassign({gno:g.gno,cno:1001}).ok);
    const a=c.CloudCallData.agents.find(x=>x.tenantId==='TEN-NISSAN-HQ'&&x.lifecycleStatus==='已启用');
    a.cno='0012999'; assert(api.assignAgent(g.gno,['0012999']).ok);assert.equal(api.listAssignedAgent(g.gno).agents[0].cno,'0012999');
    a.lifecycleStatus='已停用'; assert(!api.assignAgent(g.gno,['0012999']).ok);
  });
  await check('相同组号跨企业各自修改，成员查询不显示损坏的外租户引用', () => {
    const c=admin(),api=c.OutboundGroups,g=api.create({name:'本企业组',gno:'SAME1',tenantId:'TEN-NISSAN-HQ'}).group;
    const state=JSON.parse(c.test.saved());
    state.groups.unshift({...state.groups[0],outboundGroupId:'OTHER-ID',enterpriseId:'OTHER-ENT',tenantId:'OTHER-TEN',name:'其他企业组'});state.revision++;
    c.localStorage.setItem(storageKey,JSON.stringify(state));assert(api.refresh());
    assert(api.update('SAME1',{name:'本企业更新'}).ok);
    assert.equal(JSON.parse(c.test.saved()).groups[0].name,'其他企业组');
    const x=c.CloudCallData.agents.find(x=>x.tenantId==='TEN-NISSAN-SH');
    const broken=JSON.parse(c.test.saved());broken.groups[1].memberIdentityIds=[x.contactCenterIdentityId];broken.revision++;
    c.localStorage.setItem(storageKey,JSON.stringify(broken));
    assert(!api.listAssignedAgent('SAME1').agents.some(a=>a.cno===x.cno));
    assert(!api.get(g.outboundGroupId)?.members.some(a=>a.cno===x.cno));
  });
  await check('外呼组接口分页和更新空值校验遵从官方值域', async () => {
    const c=admin(),f=c.AliCtiFields.agentGroupFields;
    for(const input of [{limit:0},{limit:1001},{start:-1},{limit:'abc'}])assert(!f.list(input).ok);
    assert.equal((await c.AliCtiAdapter.agentGroup.list({limit:0})).result,-1);
    assert(!f.update({gno:'AA01',groupName:''}).ok);
    assert.equal(f.update({gno:'AA01',comment:''}).fields.comment,'');
  });

  await check('外呼组列表使用业务用语，查看抽屉只展示资料和成员',()=>{
    const c=admin(),api=c.OutboundGroups,g=api.create({name:'查看组',gno:'VIEW1',tenantId:'TEN-NISSAN-HQ'}).group;
    assert(!c.test.render().includes('全面对接'));
    c.OutboundGroupManagement.detail(g.outboundGroupId,api.contextKey());
    const html=c.test.layers.get('outbound-group-detail');
    assert(html.includes('外呼组坐席成员'));assert(!html.includes('维护成员'));assert(!html.includes('契约对接信息'));
  });
  await check('读取异常与权限撤销不会伪造外呼组查询成功',async()=>{
    const c=admin();c.localStorage.setItem(storageKey,'{bad');
    assert.equal((await c.AliCtiAdapter.agentGroup.list()).result,-1);
    const op=operator();assert.equal((await op.AliCtiAdapter.agentGroup.list()).result,-1);
  });

  await check('CF08删除成员保留历史快照但当前外呼组不再包含旧身份',()=>{
    const c=admin(),api=c.OutboundGroups,old=c.CloudCallData.agents.find(a=>a.tenantId==='TEN-NISSAN-HQ'&&a.lifecycleStatus==='已启用');
    const r=api.create({name:'删除身份检查',gno:'DEL1',tenantId:old.tenantId,memberIdentityIds:[old.contactCenterIdentityId]});assert(r.ok);
    const raw=c.test.saved(),frozen=clone(api.get(r.group.outboundGroupId));old.lifecycleStatus='已删除';
    assert.equal(api.get(r.group.outboundGroupId).memberCount,0);assert.deepEqual(clone(api.get(r.group.outboundGroupId).memberIdentityIds),[]);
    assert.equal(api.listAssignedAgent(r.group.gno).total,0);assert.equal(api.queryAgentGroup(old.cno),null);assert.equal(c.test.saved(),raw);
    const replacement={...clone(old),contactCenterIdentityId:'CF08-NEW-ID',lifecycleStatus:'已启用'};c.CloudCallData.agents.push(replacement);
    assert.equal(api.queryAgentGroup(old.cno),null);assert.equal(api.listAssignedAgent(r.group.gno).total,0);
    assert(!api.resolve({callGroupType:2,outboundGroupId:r.group.outboundGroupId,outboundGroupSnapshot:frozen},replacement).ok);
    assert(api.candidates(old.tenantId,old.enterpriseId).some(a=>a.contactCenterIdentityId===replacement.contactCenterIdentityId));
    assert(!api.setMembers(r.group.gno,[old.contactCenterIdentityId]).ok);
    assert(api.assignAgent(r.group.gno,[old.cno]).ok);assert.deepEqual(clone(api.get(r.group.gno).memberIdentityIds),[replacement.contactCenterIdentityId]);
    assert.equal(api.listAssignedAgent(r.group.gno).agents[0].contactCenterIdentityId,replacement.contactCenterIdentityId);
    assert.equal(api.queryAgentGroup(old.cno).gno,r.group.gno);
    assert(api.unassignAgent(r.group.gno,old.cno).ok);assert.equal(api.listAssignedAgent(r.group.gno).total,0);
  });
  await check('CF08重新分配持久化失败不公布新成员，修复存储后可明确重试',()=>{
    const c=admin(),api=c.OutboundGroups,old=c.CloudCallData.agents.find(a=>a.tenantId==='TEN-NISSAN-HQ'&&a.lifecycleStatus==='已启用');
    const r=api.create({name:'重分配保存检查',gno:'DEL2',tenantId:old.tenantId,memberIdentityIds:[old.contactCenterIdentityId]});assert(r.ok);
    old.lifecycleStatus='已删除';const replacement={...clone(old),contactCenterIdentityId:'CF08-NEW-SAVE',lifecycleStatus:'已启用'};c.CloudCallData.agents.push(replacement);
    const raw=c.test.saved(),set=c.localStorage.setItem;c.localStorage.setItem=function(k,v){if(k===storageKey)throw Error('quota');return set.call(this,k,v);};
    assert(!api.assignAgent(r.group.gno,[old.cno]).ok);assert.equal(c.test.saved(),raw);assert.equal(api.listAssignedAgent(r.group.gno).total,0);assert.equal(api.queryAgentGroup(old.cno),null);
    c.localStorage.setItem=set;assert(api.assignAgent(r.group.gno,[old.cno]).ok);assert.equal(api.listAssignedAgent(r.group.gno).agents[0].contactCenterIdentityId,replacement.contactCenterIdentityId);
  });
  await check('CF08工号定位拒绝多个当前有效身份，已删除身份不占唯一性',()=>{
    const c=admin(),api=c.OutboundGroups,a=c.CloudCallData.agents.find(a=>a.tenantId==='TEN-NISSAN-HQ'&&a.lifecycleStatus==='已启用');
    const r=api.create({name:'当前工号唯一',gno:'DEL3',tenantId:a.tenantId});assert(r.ok);
    const other={...clone(a),contactCenterIdentityId:'CF08-CONFLICT'};c.CloudCallData.agents.push(other);
    assert(!api.assignAgent(r.group.gno,[a.cno]).ok);assert.equal(api.queryAgentGroup(a.cno),null);
    other.lifecycleStatus='已删除';assert(api.assignAgent(r.group.gno,[a.cno]).ok);assert.equal(api.listAssignedAgent(r.group.gno).agents[0].contactCenterIdentityId,a.contactCenterIdentityId);
  });

  console.log(JSON.stringify({
    result: failures.length ? 'fail' : 'pass',
    count: checks.length,
    failed: failures.length,
    scope: 'Outbound groups management, tenant isolation, task wizard and concurrency validation',
    checks,
    failures
  }, null, 2));

  if (failures.length) process.exit(1);
})();
