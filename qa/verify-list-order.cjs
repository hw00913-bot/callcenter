/* List sorting and pending-customer pagination using the actual runtime, no network. */
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

(async()=>{
  const c=fixture(),ui=c.PlatformUI;
  const ids=rows=>Array.from(rows,row=>row.id);
  await check('Updated timestamps win over creation time; mixed seconds, milliseconds and date strings normalize',()=>{
    const rows=[{id:'older',updatedAt:'2026-09-01',createdAt:'2026-09-22'},{id:'newer',updatedAt:Date.parse('2026-09-20')/1000},{id:'newest',updateTime:Date.parse('2026-09-21')},{id:'missing',updatedAt:'未知'}];
    const before=JSON.stringify(rows);rows.forEach(Object.freeze);Object.freeze(rows);
    assert.deepEqual(ids(ui.sortByUpdated(rows)),['newest','newer','older','missing']);assert.equal(JSON.stringify(rows),before);
  });
  await check('Newest real local/provider update wins; fallback is first valid, nested paths work',()=>{
    assert.equal(ui.updatedTimestamp({localUpdatedAt:'2026-09-20',updatedAt:'2026-09-18'}),Date.parse('2026-09-20'));
    assert.equal(ui.updatedTimestamp({updatedAt:'2026-09-18',customerFollowup:{updatedAt:'2026-09-21'}}),Date.parse('2026-09-21'));
    assert.equal(ui.updatedTimestamp({raw:{end:'2026-09-10'},createdAt:'2026-09-01'},['absent','raw.end']),Date.parse('2026-09-10'));
    assert.equal(ui.updatedTimestamp({},()=>['bad','2026-09-10','2026-09-20']),Date.parse('2026-09-10'));
    assert.equal(ui.updatedTimestamp({createdAt:'2026-09-01'}),Date.parse('2026-09-01'));
    assert.equal(ui.updatedTimestamp({updatedAt:'—'}),null);
  });
  await check('Ties stay stable and all missing timestamps sort last without fabricated dates',()=>{
    const rows=[{id:'missing-a'},{id:'same-a',updatedAt:'2026-09-10'},{id:'missing-b',updatedAt:'未提供'},{id:'same-b',updatedAt:'2026-09-10'}];
    assert.deepEqual(ids(ui.sortByUpdated(rows)),['same-a','same-b','missing-a','missing-b']);
  });
  const start=Date.parse('2026-09-01T12:00:00+08:00');
  let pending=Array.from({length:25},(_,i)=>({id:'P'+String(i).padStart(2,'0'),name:'分页客户'+i,phone:'1390000'+String(i).padStart(4,'0'),ownerId:scope.accountId,method:'人工外呼',followup:'待联系',batchName:'分页测试',updatedAt:new Date(start+i*60000).toISOString()}));
  c.CustomerTasks.mine=()=>pending;
  c.CustomerTasks.row=id=>pending.some(row=>row.id===id)?{b:{tenantId:scope.tenantId,enterpriseId:scope.enterpriseId}}:null;
  c.CustomerTasks.canCall=()=>true;
  const rowIds=html=>Array.from(html.matchAll(/CustomerTasks.pick\('([^']+)'\)/g),match=>match[1]);
  let original;
  await check('Pending customers sort globally before pagination: 25 rows show 10/10/5 with continuous numbering',()=>{
    original=JSON.stringify(pending);let html=c.test.render();
    assert.deepEqual(rowIds(html),pending.slice(-10).reverse().map(row=>row.id));assert(html.includes('共 25 条'));assert(html.includes('<strong>1</strong><span>/ 3</span>'));
    assert(c.AgentWorkbench.setPendingPage(2));html=c.test.page.innerHTML;assert.deepEqual(rowIds(html),pending.slice(5,15).reverse().map(row=>row.id));assert(html.includes('>11</td>'));assert(html.includes('<strong>2</strong><span>/ 3</span>'));
    c.AgentWorkbench.setPendingPage(3);html=c.test.page.innerHTML;assert.deepEqual(rowIds(html),pending.slice(0,5).reverse().map(row=>row.id));assert(html.includes('>21</td>'));assert(html.includes('aria-label="下一页" disabled'));
    assert.equal(JSON.stringify(pending),original);
  });
  await check('Returning from a secondary view restores the pending page',()=>{
    c.AgentWorkbench.setPendingPage(2);const captured=c.Pages['seat-workbench'].captureNavigationState();
    c.test.render({dashboardSection:'customers'});assert.equal(rowIds(c.test.page.innerHTML).length,10);
    c.Pages['seat-workbench'].restoreNavigationState(captured);const html=c.test.render();assert(html.includes('<strong>2</strong><span>/ 3</span>'));assert.equal(rowIds(html)[0],'P14');
  });
  await check('Customer detail pagination shares the same page size and filters before paging',()=>{
    const options={dashboardSection:'customers',pendingPage:2,pendingScope:JSON.stringify([scope.accountId,scope.tenantId,scope.enterpriseId])};
    const html=c.WorkbenchOverview.renderSeat(options);assert.equal(rowIds(html).length,10);assert.equal(rowIds(html)[0],'P14');assert(html.includes('本人待联络客户'));
    pending.push({...pending[0],id:'FOREIGN',ownerId:'OTHER',updatedAt:'2026-10-01'});
    assert.equal(rowIds(c.WorkbenchOverview.renderSeat({})).includes('FOREIGN'),false);pending.pop();
  });
  await check('Page clamps after completion removes rows; a changed account/tenant page token resets to first page',()=>{
    c.AgentWorkbench.setPendingPage(3);pending=pending.slice(0,11);let html=c.test.render();assert(html.includes('<strong>2</strong><span>/ 2</span>'));assert.equal(rowIds(html).length,1);
    html=c.WorkbenchOverview.renderSeat({pendingPage:2,pendingScope:'another-account'});assert(html.includes('<strong>1</strong><span>/ 2</span>'));assert.equal(rowIds(html).length,10);
    pending=[];html=c.test.render();assert(html.includes('暂无待联络客户'));assert(html.includes('共 0 条'));assert(html.includes('<strong>1</strong><span>/ 1</span>'));
  });
  await check('Row history updates and epoch values override stale row times without reordering source execution',()=>{
    const rows=[{id:'old',updatedAt:'2026-09-18'},{id:'recent-history',updatedAt:'2026-09-01',history:[{at:Date.parse('2026-09-21')/1000}]}];
    const before=JSON.stringify(rows);assert.deepEqual(ids(c.CustomerTasks.sortRowsForDisplay(rows)),['recent-history','old']);assert.equal(JSON.stringify(rows),before);
  });
  await check('Customer directory keeps real assignment/followup update times without inventing a recent call',()=>{
    const ctx=c.AppState.get(),key='customer-task-batches-v1';
    const b={id:'SORT-BATCH',name:'客户归集排序验证',createdAt:'2026-09-01 12:00:00',tenantId:ctx.tenantId,enterpriseId:ctx.enterpriseId,rows:[{id:'SORT-ROW',phone:'13999990001',name:'归集排序客户',ownerId:ctx.accountId,history:[{at:'2026-09-20 15:00:00',action:'分配'}],followup:'待联系',method:'人工外呼'}]};
    c.localStorage.setItem(key,JSON.stringify([b]));
    const customer=c.CustomerDirectory.list().find(row=>row.phone==='13999990001');
    assert(customer);assert.equal(ui.timestamp(customer.updatedAt),Date.parse('2026-09-20 15:00:00'));assert.equal(customer.lastCall,null);assert.equal(customer.callCount,0);assert.equal(customer.batchCount,1);
  });
  process.stdout.write(JSON.stringify({passed:checks.length,failed:failures.length,checks,failures},null,2)+'\n');
  if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
