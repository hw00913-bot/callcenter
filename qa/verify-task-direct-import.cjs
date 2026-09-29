/* Local fictional fixture integration checks. No browser UI, network, or supplier POC. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.resolve(__dirname, '..'), checks = [], failures = [];
const marker = 'alicti-showcase-v1', prefix = 'alicti-demo-v2:';
const files = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
const clone = value => JSON.parse(JSON.stringify(value));
function check(name, fn) { try { fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.message }); } }
function memory(initial = {}) { return new Map(Object.entries(initial)); }
function fixture(options = {}) {
  const local = options.local || memory(), session = options.session || memory();
  let uuid = 0;
  class Storage {
    constructor(map) { this.map = map; }
    getItem(key) { return this.map.get(String(key)) ?? null; }
    setItem(key, value) { this.map.set(String(key), String(value)); }
    removeItem(key) { this.map.delete(String(key)); }
    clear() { this.map.clear(); }
    key(index) { return [...this.map.keys()][index] ?? null; }
    get length() { return this.map.size; }
  }
  const element = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, insertBefore() {}, remove() {}, addEventListener() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1280, height: 800 }) });
  const document = { addEventListener() {}, dispatchEvent() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: element, createTreeWalker: () => ({ nextNode: () => null }), documentElement: element(), body: element(), head: element(), activeElement: null };
  const now = options.now || new Date(new Date().setHours(15, 0, 0, 0)).getTime();
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const ctx = { URL, URLSearchParams, structuredClone, console, Date: Clock, Storage, localStorage: new Storage(local), sessionStorage: new Storage(session), document,
    navigator: {}, NodeFilter: { SHOW_TEXT: 4 }, location: { hash: '', search: '', pathname: '/index.html', href: 'http://localhost/index.html' }, history: { replaceState() {}, pushState() {} },
    crypto: { randomUUID: () => 'SYNTHETIC-TEST-UUID-' + (++uuid) }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    addEventListener() {}, dispatchEvent() {}, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: false, addEventListener() {} }), MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} },
    fetch() { throw Error('Unexpected network request during fixture verification'); }, performance: { now: () => 0 }, innerWidth: 1280, innerHeight: 800 };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  ctx.testStores = { local, session };
  return ctx;
}
function signedIn(tenantId = 'TEN-NISSAN-HQ', accountId = 'ACC-ADMIN-018') {
  return memory({ [prefix + 'unified-call-context-v3']: JSON.stringify({ accountId, sessionId: 'fixture-only', tenantId, enterpriseId: '7522240', activeDomain: 'CLOUD_CONTACT_CENTER', authStage: 'READY', currentPage: 'home' }) });
}

const c=fixture({session:signedIn()}), api=c.CustomerTasks, nodes=new Map(), layers=new Map();
c.document.getElementById=id=>nodes.get(id)||null;
c.PlatformUI.openLayer=(id,html)=>layers.set(id,html);c.PlatformUI.closeLayer=id=>layers.delete(id);
c.navigateTo=(key,options)=>{c.lastNavigation={key,options};};c.showToast=(message)=>{c.lastToast=message;};
const field=(id,value='')=>nodes.set(id,{value,innerHTML:'',disabled:false});
const task={...c.CloudCallData.predictiveTasks.find(t=>t.tenantId==='TEN-NISSAN-HQ'),taskId:'TEST-DIRECT-IMPORT',name:'专项空客户任务',status:'待分配客户',total:0,completed:0,startedAt:'',campaignId:'',customerSourceMode:'assigned',displayOnly:false};
c.CloudCallData.tasks.unshift(task);c.CloudCallData.predictiveTasks.unshift(task);
assert(api.canImportToTask(task));
assert(c.Pages['cloud-call-tasks'].render({view:'predictive'}).includes(`CustomerTasks.importDialog('${task.taskId}')`));
api.importDialog(task.taskId);const html=layers.get('customer-import');assert(html.includes(task.name));assert(!html.includes('customer-method'));assert(!html.includes('customer-target'));
function preview(){field('customer-batch-name','专项导入');field('customer-import-business-type','lead');field('customer-import-text','客户甲,13800000011,邀约,LEAD-011');field('customer-import-preview');field('customer-import-confirm');api.previewImport();}
preview();api.confirmImport();assert.equal(task.total,1);assert.equal(task.status,'待启动');assert.equal(api.taskCustomers(task)[0].method,'预外呼');assert(task.alictiImportDrafts.length===1);assert.equal(c.lastNavigation.options.tab,'customers');assert(!api.canImportToTask(task));
const race={...task,taskId:'TEST-RACE',total:0,status:'待分配客户'};c.CloudCallData.tasks.unshift(race);api.importDialog(race.taskId);preview();race.status='已终止';const before=c.localStorage.getItem('customer-task-batches-v1');api.confirmImport();assert.equal(c.localStorage.getItem('customer-task-batches-v1'),before);assert(c.lastToast.includes('任务状态'));
api.importDialog();preview();api.confirmImport();assert(!JSON.parse(c.localStorage.getItem('customer-task-batches-v1'))[0].rows[0].taskId);
assert(!api.canImportToTask({...race,status:'待分配客户',tenantId:'OTHER'}));
console.log(JSON.stringify({result:'pass',count:1,failed:0,checks:['空任务导入完整流程：固定任务与方式、自动关联、待启动、AliCti导入批次、终止竞态、通用导入与租户隔离']},null,2));
