/* Supervisor workbench UI integration. Real runtime scripts and supplier mocks; no network. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const base = path.resolve(__dirname, '..'), checks = [], failures = [];
const files = [...fs.readFileSync(path.join(base, 'index.html'), 'utf8').matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
const prefix = 'alicti-demo-v2:', sessionKey = 'native-workbench-session-v1', recordsKey = 'native-workbench-records-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const scope = { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', accountId: 'ACC-OPS-108' };
const followup = { leadLevel: 'A级', intentionLevel: '高意向', visitIntention: '有意向', testDriveIntention: '有意向', plannedVisitAt: '2026-10-10T14:30', plannedStoreName: '客户指定的试驾门店' };
const remark = '客户偏好白色车型，约定下周再次确认到店时间。';
async function check(name, fn) { try { await fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.stack }); } }
function fixture(options = {}) {
  const local = options.local || new Map(), session = options.session || new Map(), timers = new Map(), layers = new Map();
  let now = new Date('2026-09-17T15:00:00+08:00').getTime(), timerId = 0, uuid = 0, sessionWriteFails = false;
  const signed = { ...scope, ...options.scope, sessionId: 'incall-test', activeDomain: 'CLOUD_CONTACT_CENTER', authStage: 'READY', currentPage: 'home' };
  session.set(prefix + 'unified-call-context-v3', JSON.stringify(signed));
  class Storage {
    constructor(map) { this.map = map; }
    getItem(key) { return this.map.get(String(key)) ?? null; }
    setItem(key, value) { if (this.map === session && String(key).endsWith(sessionKey) && sessionWriteFails) throw Error('Session quota exceeded'); this.map.set(String(key), String(value)); }
    removeItem(key) { this.map.delete(String(key)); }
    clear() { this.map.clear(); }
    key(index) { return [...this.map.keys()][index] ?? null; }
    get length() { return this.map.size; }
  }
  const element = () => ({ style: {setProperty(){},removeProperty(){}}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, append() {}, appendChild() {}, insertBefore() {}, remove() {}, addEventListener() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1440, height: 1000 }) });
  const nodes=new Map();
  const page=element();page.innerHTML='';page.scrollTop=0;const native=element(),monitor=element();
  const document = { addEventListener() {}, dispatchEvent() {}, getElementById: id => id==='page-content'?page:id==='native-seat-workspace'&&page.innerHTML.includes('id="native-seat-workspace"')?native:id==='tenant-call-monitor'&&page.innerHTML.includes('id="tenant-call-monitor"')?monitor:nodes.get(id)||null, querySelector: () => null, querySelectorAll: () => [], createElement: element, createTreeWalker: () => ({ nextNode: () => null }), documentElement: element(), body: element(), head: element(), activeElement: null };
  document.body.append=node=>nodes.set(node.id,node);
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const ctx = { URL, URLSearchParams, structuredClone, console, Date: Clock, Storage, localStorage: new Storage(local), sessionStorage: new Storage(session), document,
    navigator: { locks: { request: (_key, _options, fn) => Promise.resolve(fn({ name: 'test-seat-lock' })) } },
    NodeFilter: { SHOW_TEXT: 4 }, location: { hash: '#seat-workbench', search: '', pathname: '/index.html', href: 'http://localhost/index.html' }, history: { replaceState() {}, pushState() {} },
    crypto: { randomUUID: () => String(++uuid).padStart(8, '0') + '-0000-4000-8000-000000000000' },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }, addEventListener() {}, dispatchEvent() {},
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id), setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: false, addEventListener() {} }), MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} },
    fetch() { throw Error('Unexpected network request'); }, performance: { now: () => now }, innerWidth: 1440, innerHeight: 1000 };
  ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), ctx, { filename: file });
  ctx.PlatformUI.openLayer = (id, html) => layers.set(id, html);
  ctx.PlatformUI.closeLayer = id => layers.delete(id);
  ctx.navigateTo = (key,options) => {page.innerHTML=ctx.Pages[key]?.render(options)||'';};
  ctx.showToast = () => {};
  ctx.test = { local, session, layers, timers,page,
    render(options){page.innerHTML=ctx.AgentWorkbench.renderSeat(options);return page.innerHTML;},
    monitorHtml:()=>ctx.TenantCallMonitor.render(),
    dockHtml:()=>nodes.get('native-call-dock')?.innerHTML||'',
    saved: () => JSON.parse(ctx.sessionStorage.getItem(sessionKey) || 'null'),
    html: () => layers.get('assigned-call-dialog') || '',
    failSessionWrites(value) { sessionWriteFails = value; },
    advance(ms) { now += ms; },
    runTimer(ms) { const entry = [...timers].find(([, value]) => value.ms === ms); assert(entry, 'Expected timer ' + ms); timers.delete(entry[0]); now += ms; entry[1].fn(); }
  };
  return ctx;
}

async function pump(c,predicate=()=>false){
  for(let i=0;i<80;i++){
    await Promise.resolve();await Promise.resolve();
    const timer=[...c.test.timers].find(([,value])=>value.ms===220);
    if(timer)c.test.runTimer(220);
    if(predicate())return;
  }
  assert(predicate(),'Asynchronous runtime action did not finish');
}
async function finish(c,promise){let done=false,value,error;promise.then(result=>{value=result;done=true;},reason=>{error=reason;done=true;});await pump(c,()=>done);if(error)throw error;return value;}
async function start(c){c.test.render();void c.AgentWorkbench.signIn({loginStatus:1,pauseDescription:'',workingMode:'0'});await pump(c,()=>c.AgentWorkbench.current().online&&!c.AliCtiSeatOperations.status().inFlight);assert.equal(c.AgentWorkbench.current().online,true);}
const admin=()=>fixture({scope:{accountId:'ACC-ADMIN-018'}});
const tabSelected=(html,name)=>new RegExp('id="seat-tab-'+name+'"[^>]*aria-selected="true"').test(html);
const actionButton=(html,action,cno)=>html.match(new RegExp('<button[^>]*data-monitor-action="'+action+'"[^>]*data-monitor-cno="'+cno+'"[^>]*>'))?.[0];
function assertOneId(html,id){assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id+' must be unique');}
function managementWrites(c){return c.AliCtiSeatOperations.trace.filter(row=>row.request.method.startsWith('CTILink.Monitor.'));}
(async()=>{
  let c;
  await check('有效总部管理员默认进入班长页签，保留外呼页签且不重复外呼内容',()=>{
    c=admin();const html=c.test.render();
    assert(tabSelected(html,'monitor'));assert(html.includes('>外呼坐席</button>'));assert(html.includes('>班长监控</button>'));
    assertOneId(html,'tenant-call-monitor');assertOneId(html,'seat-workspace-panel');
    assert(!html.includes('id="seat-workspace-skill"'));assert(!html.includes('id="seat-temporary"'));
  });
  await check('管理员未上线即可看今日统计及本租户只读坐席状态，不触发队列查询',async()=>{
    assert.equal(c.AgentWorkbench.current().online,false);
    let html=c.test.monitorHtml();
    for(const label of ['今日外呼次数','客户接通','接通率','结果待确认'])assert(html.includes(label));
    const result=await finish(c,c.TenantCallMonitor.loadReadOnlyStatuses());
    assert.equal(result.ok,true,JSON.stringify(result));
    html=c.test.monitorHtml();
    assert(html.includes('1201'),'本租户坐席工号应在只读列表中');
    assert(!html.includes('2202'),'其他租户坐席不得进入当前监控');
    assert(!html.includes('data-monitor-action='),'未上线时不提供班长管理按钮');
    assert.equal(c.AgentWorkbench.current().online,false);
    assert.equal(c.AliCtiSeatOperations.trace.filter(row=>row.request.method==='CTILink.Agent.queueStatus').length,0);
    assert.equal(managementWrites(c).length,0);
  });
  await check('离线只读查询失败时标为待核对，不拿本地旧状态冒充实时结果',async()=>{
    const offline=admin();offline.test.render();
    offline.AliCtiSeatOperations.scenarios.agentStatusGet='failure';
    const result=await finish(offline,offline.TenantCallMonitor.loadReadOnlyStatuses());
    assert.equal(result.ok,false);
    assert(result.rows.length>0);
    assert(result.rows.every(row=>row.state==='待核对'));
    const html=offline.test.monitorHtml();
    assert(html.includes('待核对'));
    assert(!html.includes('data-monitor-action='));
    assert.equal(offline.AliCtiSeatOperations.trace.filter(row=>row.request.method==='CTILink.Agent.queueStatus').length,0);
  });
  await check('未上线直接调用队列和管理处理函数也不能执行写操作',async()=>{
    const offline=admin(),target='1201',before=offline.AliCtiSeatOperations.trace.length;
    offline.test.render();
    assert(!offline.SeatOperationUI.open('monitor'));
    assert(!offline.test.layers.has('seat-operation-drawer'));
    assert.equal((await offline.TenantCallMonitor.load()).ok,false);
    assert.equal(offline.TenantCallMonitor.openManage('pause',target),false);
    assert.equal(offline.TenantCallMonitor.openManage('unpause',target),false);
    assert.equal(offline.TenantCallMonitor.openManage('logout',target),false);
    assert.equal((await offline.TenantCallMonitor.submitManage()).ok,false);
    assert.equal((await offline.AliCtiSeatOperations.manageSeat(offline.AgentWorkbench.myAgent(),{action:'pause',cno:target})).ok,false);
    assert.equal(offline.AliCtiSeatOperations.trace.length,before);
    assert.equal(managementWrites(offline).length,0);
  });
  await check('监控的坐席事件日志可离线切换查看，返回概览仍显示只读状态',()=>{
    const seat=c.AgentWorkbench.myAgent();
    assert(c.SeatEventLog.record(seat,'signalLost',{source:'connection',fromState:'信令正常',toState:'信令中断'}));
    let html=c.test.monitorHtml();
    assert(html.includes('role="tablist"'));
    assert(html.includes('监控概览')&&html.includes('坐席事件日志'));
    assert(!html.includes('id="tenant-monitor-event-title"'));
    assert.equal(c.TenantCallMonitor.setTab('events'),true);
    html=c.test.monitorHtml();assert(html.includes('id="tenant-monitor-event-title"'));
    assert(html.includes('信令断线'));
    assert(html.includes('查看全部事件'));
    assert(!html.includes('<th class="">状态变化</th>'));
    assert(!html.includes('<th class="">说明</th>'));
    assert.equal(c.TenantCallMonitor.setTab('overview'),true);
    html=c.test.monitorHtml();assert(!html.includes('id="tenant-monitor-event-title"'));
    assert(html.includes('1201'));
  });
  await check('切换到外呼页签显示本人操作，移除班长监控和重复内容',()=>{
    assert(c.AgentWorkbench.setWorkspaceTab('outbound'));
    const html=c.test.page.innerHTML;assert(tabSelected(html,'outbound'));assert(!html.includes('id="seat-workspace-skill"')); assert(!html.includes('id="seat-temporary"'),'Telephone actions should not be duplicated inside the tab');assertOneId(c.test.dockHtml(),'seat-temporary');assert(!html.includes('id="tenant-call-monitor"'));
    assert(c.AgentWorkbench.setWorkspaceTab('monitor'));assertOneId(c.test.page.innerHTML,'tenant-call-monitor');
  });
  await check('导航返回恢复页签，旧入口参数不会覆盖刚选择的外呼页签',()=>{
    c.AgentWorkbench.setWorkspaceTab('outbound');const saved=c.Pages['seat-workbench'].captureNavigationState();
    c.AgentWorkbench.setWorkspaceTab('monitor');c.Pages['seat-workbench'].restoreNavigationState(saved);
    assert(tabSelected(c.test.render({workspaceTab:'monitor'}),'outbound'));
  });
  await check('普通运营没有班长页签且无法通过方法直接进入',()=>{
    const operator=fixture();let html=operator.test.render();assert(!html.includes('id="seat-tab-monitor"'));assert(!html.includes('id="tenant-call-monitor"'));
    assert.equal(operator.AgentWorkbench.setWorkspaceTab('monitor'),false);html=operator.test.render({workspaceTab:'monitor'});
    assert(!html.includes('id="tenant-call-monitor"'));assert(!html.includes('id="seat-workspace-skill"'));
  });
  await check('管理员成员权限撤销后页签与监控立即隐藏',()=>{
    const denied=admin();denied.test.render();denied.CloudCallData.memberships.find(row=>row.accountId==='ACC-ADMIN-018'&&row.tenantId==='TEN-NISSAN-HQ').roleCode='OPERATOR';
    const html=denied.test.render();assert(!html.includes('id="seat-tab-monitor"'));assert(!html.includes('id="tenant-call-monitor"'));assert.equal(denied.AgentWorkbench.setWorkspaceTab('monitor'),false);
  });
  await check('管理工作台仅提供进入班长监控的入口，不重复整块监控',()=>{
    const html=c.WorkbenchOverview.render();assert(html.includes('进入班长监控'));assert(!html.includes('id="tenant-call-monitor"'));
  });
  await check('班长上线查询后仅呈现本租户目标，本人和通话整理中无管理入口',async()=>{
    c.AgentWorkbench.setWorkspaceTab('monitor');await start(c);assert.equal((await finish(c,c.TenantCallMonitor.load())).ok,true);
    const html=c.test.monitorHtml();assert(actionButton(html,'pause','1201'));assert(actionButton(html,'logout','1201'));
    const self=c.AgentWorkbench.myAgent().cno;assert(!actionButton(html,'pause',self));assert(html.includes('本人'));
    for(const cno of ['0012','2103','2202'])for(const action of ['pause','unpause','logout'])assert(!actionButton(html,action,cno));
    assert(!html.includes('管理上线'));assert(!html.includes('data-monitor-action="login"'));
  });
  await check('管理置忙抽屉包含精确目标与影响，关闭不发送写请求',()=>{
    const before=managementWrites(c).length;assert(c.TenantCallMonitor.openManage('pause','1201'));
    const html=c.test.layers.get('tenant-seat-management');assert(html.includes('坐席置忙'));assert(html.includes('1201'));assert(html.includes('暂停接收新的来电'));
    assert(html.includes('aria-label="关闭"'));assert(html.includes('id="tenant-management-submit"'));assert(html.includes('确认置忙'));
    assert(!html.includes('<input'));assert(c.TenantCallMonitor.closeManage());assert.equal(managementWrites(c).length,before);
  });
  await check('置忙确认经原型服务执行并回读，完成前禁用确认与监控刷新',async()=>{
    c.TenantCallMonitor.openManage('pause','1201');const pending=c.TenantCallMonitor.submitManage();
    assert.match(c.test.layers.get('tenant-seat-management'),/id="tenant-management-submit"[^>]*disabled/);
    assert.match(c.test.monitorHtml(),/id="tenant-monitor-refresh"[^>]*disabled/);assert.equal(c.TenantCallMonitor.closeManage(),false);
    assert.equal((await finish(c,pending)).ok,true);assert(!c.test.layers.has('tenant-seat-management'));
    assert(actionButton(c.test.monitorHtml(),'unpause','1201'));assert(!actionButton(c.test.monitorHtml(),'pause','1201'));
    assert.equal(c.AliCtiSeatOperations.trace.at(-1).request.method,'CTILink.Agent.queueStatus');
  });
  await check('置闲抽屉恢复接听，失败保持抽屉并保留目标原状态',async()=>{
    assert(c.TenantCallMonitor.openManage('unpause','1201'));let html=c.test.layers.get('tenant-seat-management');assert(html.includes('确认置闲'));assert(html.includes('恢复接收新的来电'));
    c.AliCtiSeatOperations.scenarios.setUnpause='failure';assert.equal((await finish(c,c.TenantCallMonitor.submitManage())).ok,false);
    assert(c.test.layers.has('tenant-seat-management'));assert(actionButton(c.test.monitorHtml(),'unpause','1201'));
    c.AliCtiSeatOperations.scenarios.setUnpause='success';assert.equal((await finish(c,c.TenantCallMonitor.submitManage())).ok,true);assert(actionButton(c.test.monitorHtml(),'pause','1201'));
  });
  await check('管理结果未知关闭抽屉隐藏旧列表，只能刷新回读且不会重放写请求',async()=>{
    c.AliCtiSeatOperations.scenarios.setPause='unknown';assert(c.TenantCallMonitor.openManage('pause','1201'));
    assert.equal((await finish(c,c.TenantCallMonitor.submitManage())).pending,true);const before=managementWrites(c).length;
    assert(!c.test.layers.has('tenant-seat-management'));assert(!actionButton(c.test.monitorHtml(),'pause','1201'));assert.equal(c.TenantCallMonitor.openManage('pause','1201'),false);
    assert.equal((await finish(c,c.TenantCallMonitor.load())).ok,true);assert.equal(managementWrites(c).length,before);assert(actionButton(c.test.monitorHtml(),'unpause','1201'));
  });
  await check('下线确认保留绑定，回读离线后不提供管理上线入口',async()=>{
    assert(c.TenantCallMonitor.openManage('logout','1201'));const html=c.test.layers.get('tenant-seat-management');assert(html.includes('确认下线'));assert(html.includes('保留电话绑定'));assert(html.includes('再次上线由坐席本人操作'));
    assert.equal((await finish(c,c.TenantCallMonitor.submitManage())).ok,true);const monitor=c.test.monitorHtml();assert(monitor.includes('已离线'));assert(!actionButton(monitor,'logout','1201'));assert(!actionButton(monitor,'login','1201'));
    const count=managementWrites(c).length;assert.equal(c.TenantCallMonitor.openManage('login','1201'),false);assert.equal(managementWrites(c).length,count);
  });
  await check('接通中切换两页签保留沟通草稿、通话身份及可返回通话的入口',async()=>{
    c.AgentWorkbench.setWorkspaceTab('outbound');
    const seat=c.AgentWorkbench.myAgent(),offer={kind:'inbound',enterpriseId:'7522240',tenantId:'TEN-NISSAN-HQ',accountId:'ACC-ADMIN-018',cno:seat.cno,contactId:'SUPERVISOR-TAB-CALL',callId:'SUPERVISOR-TAB-CALL',customerNumber:'13991999991',hotline:'02100006101',customerName:'页签切换验证客户',mock:true,stateAction:'ringingIb'};
    assert(c.AgentWorkbench.receiveOffer(offer));assert(c.AgentWorkbench.answerIncoming());c.test.runTimer(1100);assert.equal(c.AgentWorkbench.current().phase,'connected');
    c.AgentWorkbench.setDisposition('需要再次联系');c.AgentWorkbench.setRemark(remark);for(const [key,value]of Object.entries(followup))c.AgentWorkbench.setFollowup(key,value);
    const before=clone(c.test.saved());c.AgentWorkbench.minimizeDialog();
    for(const tab of ['monitor','outbound','monitor']){
      assert(c.AgentWorkbench.setWorkspaceTab(tab));const html=c.test.render();assert(html.includes('data-seat-active-card'));assert(html.includes('通话与记录'));assert.equal(c.AgentWorkbench.current().phase,'connected');
      const after=c.test.saved();for(const key of ['remark','disposition','followup'])assert.deepEqual(clone(after[key]),before[key],key);assert.equal(after.call.callId,before.call.callId);assert(!after.call.endedAt);
    }
    c.AgentWorkbench.openDialog();assert(c.test.html().includes(remark));assert(c.test.html().includes('id="seat-remark"'));
  });
  console.log(JSON.stringify({result:failures.length?'fail':'pass',count:checks.length+failures.length,failed:failures.length,checks,failures},null,2));
  if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
