/* Local fictional fixture integration checks. No browser UI, network, or supplier POC. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.resolve(__dirname, '..'), checks = [], failures = [];
const marker = 'alicti-showcase-v1', prefix = 'alicti-demo-v2:';
const files = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
const clone = value => JSON.parse(JSON.stringify(value));
const seatBusinessState = value => { const {localUpdatedAt, ...fields} = value; return JSON.stringify(fields); };
function check(name, fn) { try { fn(); checks.push(name); } catch (error) { failures.push({ name, message: error.message }); } }
function memory(initial = {}) { return new Map(Object.entries(initial)); }
function fixture(options = {}) {
  const local = options.local || memory(), session = options.session || memory();
  class Storage {
    constructor(map) { this.map = map; }
    getItem(key) { return this.map.get(String(key)) ?? null; }
    setItem(key, value) { this.map.set(String(key), String(value)); }
    removeItem(key) { this.map.delete(String(key)); }
    clear() { this.map.clear(); }
    key(index) { return [...this.map.keys()][index] ?? null; }
    get length() { return this.map.size; }
  }
  const element = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, scrollIntoView() {}, appendChild() {}, insertBefore() {}, remove() {}, addEventListener() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1280, height: 800 }) });
  const document = { addEventListener() {}, dispatchEvent() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: element, createTreeWalker: () => ({ nextNode: () => null }), documentElement: element(), body: element(), head: element(), activeElement: null };
  const now = options.now || new Date(new Date().setHours(15, 0, 0, 0)).getTime();
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const ctx = { URL, URLSearchParams, structuredClone, console, Date: Clock, Storage, localStorage: new Storage(local), sessionStorage: new Storage(session), document,
    navigator: {}, NodeFilter: { SHOW_TEXT: 4 }, location: { hash: '', search: '', pathname: '/index.html', href: 'http://localhost/index.html' }, history: { replaceState() {}, pushState() {} },
    crypto: { randomUUID: () => 'SYNTHETIC-TEST-UUID' }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
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
const HQ='TEN-NISSAN-HQ',SH='TEN-NISSAN-SH',bucket=prefix+'skill-groups-v2:7522240';
function setup(role='admin',local=new Map(),session){
  const c=fixture({local,session:session||signedIn(role==='super'?'ALL_IN_INSTANCE':HQ,role==='super'?'ACC-SUPER-001':role==='operator'?'ACC-OPS-108':'ACC-ADMIN-018')});
  c.nodes=new Map();c.layers=new Map();c.messages=[];
  c.field=(id,value)=>{const n={value,querySelector:()=>({prepend(){},scrollIntoView(){},querySelector(){return null;}}),scrollIntoView(){},focus(){}};c.nodes.set(id,n);return n;};
  c.document.getElementById=id=>c.nodes.get(id)||null;
  c.PlatformUI.openLayer=(id,html)=>{c.layers.set(id,html);c.field(id,'');};c.PlatformUI.closeLayer=id=>c.layers.delete(id);
  c.showToast=(message,level)=>c.messages.push({message,level});c.RouteRuntime.refreshCurrent=()=>{};
  c.p=c.Pages['contact-center-settings'];return c;
}
function save(c,name,type='TPL-SALES',tenant=HQ,id=''){c.p.openMapping(id);c.field('mappingName',name);c.field('mappingTenant',tenant);c.p.saveMapping(id);return c.CloudCallData.physicalSkillGroups.find(g=>g.name===name&&g.tenantId===tenant);}
function reload(c,role='admin'){return setup(role,new Map(c.testStores.local),new Map(c.testStores.session));}
check('租户管理员无需服务类型创建多个技能，配置保留标识及AliCti本地待确认状态',()=>{
 const c=setup(),html=c.p.render({view:'skill-mappings'});assert(html.includes('创建技能'));assert(!html.includes('新增服务类型'));assert(!html.includes('技能模板'));
 c.p.openMapping();assert(c.layers.get('skill-mapping').includes('id="mappingTenant" disabled'));
 const a=save(c,'售前白班'),b=save(c,'售前晚班');assert(a&&b);assert.notEqual(a.skillGroupId,b.skillGroupId);assert.equal(a.enterpriseId,'7522240');assert.equal(a.syncStatus,'本地已保存，真实结果待确认');
 save(c,'售前日班','TPL-AFTER',HQ,a.physicalGroupId);assert.equal(a.name,'售前日班');assert.equal(a.skillTemplateId,undefined);assert.equal(c.AliCtiDemo.lastSkillResource.endpoint,'skill/update');assert(c.p.captureNavigationState&&c.p.restoreNavigationState);
 const fresh=reload(c);assert(fresh.CloudCallData.physicalSkillGroups.some(g=>g.physicalGroupId===b.physicalGroupId));assert(fresh.CloudCallData.physicalSkillGroups.some(g=>g.physicalGroupId===a.physicalGroupId&&g.name==='售前日班'));
});
check('同租户重名拒绝，跨租户和跨供应商账号拒绝，运营拒绝',()=>{
 const c=setup(),a=save(c,'唯一组'),count=c.CloudCallData.physicalSkillGroups.length;save(c,'唯一组','TPL-AFTER');save(c,'越权','TPL-SALES',SH);assert.equal(c.CloudCallData.physicalSkillGroups.length,count);assert(a);
 const op=setup('operator');save(op,'运营不得创建');assert(!op.CloudCallData.physicalSkillGroups.some(g=>g.name==='运营不得创建'));assert.equal(op.p.openTemplate,undefined);assert.equal(op.layers.size,0);
});
check('所有角色移除服务类型字段和操作，无类型仍可保存与恢复',()=>{
 for(const role of ['super','admin']){const c=setup(role),html=c.p.render({view:'skill-mappings'});assert(!html.includes('服务类型'));assert(!html.includes('skillFilterTemplate'));assert.equal(c.p.openTemplate,undefined);assert.equal(c.p.saveTemplate,undefined);c.p.openMapping();assert(!c.layers.get('skill-mapping').includes('mappingTemplate'));assert(!c.layers.get('skill-mapping').includes('服务类型'));const g=save(c,'独立技能');assert(g);assert.equal(g.skillTemplateId,undefined);assert(!c.layers.get('skill-group-detail').includes('未设置'));assert(reload(c,role).CloudCallData.physicalSkillGroups.some(r=>r.physicalGroupId===g.physicalGroupId));}
});
check('失效会话和存储失败不保存，损坏v2保留',()=>{
 const c=setup();c.p.openMapping();c.field('mappingName','失效');c.field('mappingTemplate','TPL-SALES');c.field('mappingTenant',HQ);const old=c.AppState.get;c.AppState.get=()=>({...old(),sessionId:'changed'});c.p.saveMapping('');assert(!c.CloudCallData.physicalSkillGroups.some(g=>g.name==='失效'));
 const a=setup(),before=JSON.stringify(a.CloudCallData.physicalSkillGroups);a.localStorage.setItem=()=>{throw Error('storage denied');};save(a,'失败');assert.equal(JSON.stringify(a.CloudCallData.physicalSkillGroups),before);assert(a.layers.has('skill-mapping'));
 const b=setup();b.testStores.local.set(bucket,'{broken');save(b,'损坏');assert.equal(b.testStores.local.get(bucket),'{broken');assert(!b.CloudCallData.physicalSkillGroups.some(g=>g.name==='损坏'));
});
check('v1不读取不删除不改写；v2成员关系刷新保留，号码授权不依赖技能组',()=>{
 const c=setup(),a=save(c,'持久白班'),b=save(c,'持久晚班'),d=c.CloudCallData,agent=d.agents.find(a=>a.contactCenterIdentityId==='CCI-N-002');
 const relation={relationId:'QA-REL',identityId:agent.contactCenterIdentityId,physicalGroupId:a.physicalGroupId,skillLevel:2,status:'已生效',syncStatus:'同步成功'};assert(c.AccountSeat.persistAgent(agent,[...d.agentSkills.filter(r=>r.identityId===agent.contactCenterIdentityId),relation]));
 const n=d.phoneNumbers.find(n=>n.numberId==='NUM-021-6601');c.sessionStorage.setItem('cloud-number-resource-state-v1',JSON.stringify([{...n,boundSkillGroupIds:[a.skillGroupId]}]));
 let fresh=reload(c);assert(fresh.CloudCallData.agentSkills.some(r=>r.relationId==='QA-REL'));assert(fresh.CloudResourceRules.usableNumber(fresh.CloudCallData.phoneNumbers.find(n=>n.numberId==='NUM-021-6601'),HQ,'呼出'));assert(fresh.CloudCallData.physicalSkillGroups.some(g=>g.physicalGroupId===b.physicalGroupId));
 const saved=JSON.parse(c.testStores.local.get(bucket));saved.version=1;c.testStores.local.delete(bucket);c.testStores.local.set(prefix+'skill-groups-v1:7522240',JSON.stringify(saved));c.testStores.local.set('skill-groups-v1:CCC-NISSAN','OTHER-PROJECT');
 fresh=reload(c);assert(fresh.testStores.local.has(prefix+'skill-groups-v1:7522240'),'旧键不读取也不改写');assert.equal(fresh.testStores.local.get('skill-groups-v1:CCC-NISSAN'),'OTHER-PROJECT');assert(!fresh.CloudCallData.agentSkills.some(r=>r.relationId==='QA-REL'));assert(fresh.CloudResourceRules.usableNumber(fresh.CloudCallData.phoneNumbers.find(n=>n.numberId==='NUM-021-6601'),HQ,'呼出'));assert(fresh.CloudCallData.agents.some(x=>x.contactCenterIdentityId===agent.contactCenterIdentityId));
});
check('全部演示技能组都有同供应商账号服务类型；恢复拒绝双ID和组名重复',()=>{
 const c=setup();for(const g of c.CloudCallData.physicalSkillGroups)assert(c.CloudCallData.skillTemplates.some(t=>t.skillTemplateId===g.skillTemplateId&&t.enterpriseId===g.enterpriseId),g.physicalGroupId);
 const a=save(c,'恢复白班'),b=save(c,'恢复晚班'),raw=c.testStores.local.get(bucket);for(const key of ['physicalGroupId','skillGroupId','name']){const saved=JSON.parse(raw);saved.groups[1][key]=saved.groups[0][key];c.testStores.local.set(bucket,JSON.stringify(saved));const f=reload(c);assert(!f.CloudCallData.physicalSkillGroups.some(g=>g.physicalGroupId===a.physicalGroupId||g.physicalGroupId===b.physicalGroupId));}
});
check('通话中新增技能保存待提交；刷新保留，离线提交成功前不参与分配且不改变通话',()=>{
 const c=setup(),g=save(c,'通话中新增组'),a=c.CloudCallData.agents.find(a=>a.tenantId===HQ&&a.lifecycleStatus==='已启用'&&c.CloudCallData.agentSkills.filter(r=>r.identityId===a.contactCenterIdentityId).every(r=>c.AliCtiFields.validSkillLevel(r.skillLevel)));
 assert(a);a.agentStatus='通话中';a.currentCall=true;a.currentEndpoint='test-active-call';
 const old=c.CloudCallData.agentSkills.filter(r=>r.identityId===a.contactCenterIdentityId).map(r=>({...r})),before=seatBusinessState(a);
 const api=c.Pages['agent-center'];api.openSkillAssign(a.contactCenterIdentityId,g.physicalGroupId);
 c.field('assignAgent',a.contactCenterIdentityId);c.field('assignLevel','3');
 c.document.querySelectorAll=q=>q==='#assignGroups input:checked'?[{value:g.physicalGroupId,dataset:{linked:'false'}}]:[];
 const previousRequest=c.AliCtiDemo.lastSkill;api.saveSkill();
 const pending=c.CloudCallData.agentSkills.find(r=>r.identityId===a.contactCenterIdentityId&&r.physicalGroupId===g.physicalGroupId);
 assert(pending);assert.equal(pending.status,'待生效');assert.equal(pending.syncStatus,'待提交');assert.equal(c.AliCtiDemo.lastSkill,previousRequest);assert.equal(seatBusinessState(a),before);assert.equal(a.localUpdatedAt,new c.Date().toISOString());assert.equal(pending.localUpdatedAt,a.localUpdatedAt);
 for(const r of old)assert.deepEqual(c.CloudCallData.agentSkills.find(n=>n.relationId===r.relationId),r);
 assert.equal(c.CloudResourceRules.members(g).length,0);
 const fresh=reload(c);assert.equal(fresh.CloudCallData.agentSkills.find(r=>r.relationId===pending.relationId).syncStatus,'待提交');
 api.submitPendingSkills(pending.relationId);assert.equal(c.CloudCallData.agentSkills.find(r=>r.relationId===pending.relationId).syncStatus,'待提交');
 a.currentCall=false;a.currentEndpoint='';a.agentStatus='离线';
 for(const outcome of ['failure','unknown']){const beforeAttempt=JSON.stringify(a),beforeRelation=JSON.stringify(c.CloudCallData.agentSkills.find(r=>r.relationId===pending.relationId));c.AliCtiDemo.skillOutcome=outcome;api.submitPendingSkills(pending.relationId);assert.equal(c.CloudCallData.agentSkills.find(r=>r.relationId===pending.relationId).syncStatus,'待提交');assert.equal(JSON.stringify(a),beforeAttempt);assert.equal(JSON.stringify(c.CloudCallData.agentSkills.find(r=>r.relationId===pending.relationId)),beforeRelation);}
 c.AliCtiDemo.skillOutcome='success';api.submitPendingSkills(pending.relationId);
 assert.equal(c.CloudCallData.agentSkills.find(r=>r.relationId===pending.relationId).status,'已生效');assert.equal(c.CloudResourceRules.members(g).length,1);
 assert.equal(c.AliCtiDemo.lastSkill.request.body[0].skillIds.split(',').length,old.length+1);
});
check('在线新增技能存储失败保留原配置；不能借新增修改已有等级或移除技能',()=>{
 const c=setup(),g=save(c,'保存失败新增组'),a=c.CloudCallData.agents.find(a=>a.tenantId===HQ&&c.CloudCallData.agentSkills.some(r=>r.identityId===a.contactCenterIdentityId)&&c.CloudCallData.agentSkills.filter(r=>r.identityId===a.contactCenterIdentityId).every(r=>c.AliCtiFields.validSkillLevel(r.skillLevel)));
 a.agentStatus='通话中';a.currentCall=true;
 const old=c.CloudCallData.agentSkills.filter(r=>r.identityId===a.contactCenterIdentityId).map(r=>({...r}));
 const addition={relationId:'QA-PENDING',identityId:a.contactCenterIdentityId,physicalGroupId:g.physicalGroupId,skillLevel:3,status:'已生效',syncStatus:'同步成功'};
 assert.equal(c.AliCtiDemo.saveSkills(a,[...old.slice(1),addition]),false);
 assert.equal(c.AliCtiDemo.saveSkills(a,[{...old[0],skillLevel:old[0].skillLevel===1?2:1},...old.slice(1),addition]),false);
 const before=JSON.stringify(a),beforeRelations=JSON.stringify(c.CloudCallData.agentSkills);
 c.localStorage.setItem=()=>{throw Error('storage unavailable');};assert.equal(c.AliCtiDemo.saveSkills(a,[...old,addition]),false);assert.equal(JSON.stringify(a),before);assert.equal(JSON.stringify(c.CloudCallData.agentSkills),beforeRelations);
 assert(!c.CloudCallData.agentSkills.some(r=>r.relationId===addition.relationId));
});
check('技能无变化时保存不刷新坐席或关系的更新时间',()=>{
 const c=setup(),a=c.CloudCallData.agents.find(a=>a.tenantId===HQ&&c.CloudCallData.agentSkills.some(r=>r.identityId===a.contactCenterIdentityId)&&c.CloudCallData.agentSkills.filter(r=>r.identityId===a.contactCenterIdentityId).every(r=>c.AliCtiFields.validSkillLevel(r.skillLevel)&&r.status==='已生效'&&r.syncStatus==='同步成功'));
 assert(a);a.agentStatus='离线';a.currentCall=false;delete a.currentEndpoint;a.localUpdatedAt='2025-01-01T00:00:00.000Z';
 const relations=c.CloudCallData.agentSkills.filter(r=>r.identityId===a.contactCenterIdentityId).map(r=>({...r})),before=JSON.stringify(relations);
 assert(c.AliCtiDemo.saveSkills(a,relations));assert.equal(a.localUpdatedAt,'2025-01-01T00:00:00.000Z');assert.equal(JSON.stringify(c.CloudCallData.agentSkills.filter(r=>r.identityId===a.contactCenterIdentityId)),before);
});
console.log(JSON.stringify({passed:checks.length,failed:failures.length,checks,failures,scope:'local AliCti prototype, actual index script order, no supplier calls'},null,2));if(failures.length)process.exitCode=1;
