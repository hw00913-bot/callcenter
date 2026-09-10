/** Execute the actual navigation module; DOM/history doubles, not browser QA. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {setup,root}=require('./fixtures/prototype-vm.cjs');
function navigation(profile,domain='CLOUD_CONTACT_CENTER'){
  const x=setup(profile,domain);
  x.field('businessNavigation','');x.field('page-content','');x.field('breadcrumb','');
  const setHash=(_state,_unused,url)=>{x.ctx.location.hash=String(url).includes('#')?'#'+String(url).split('#')[1]:'';};
  x.ctx.history.pushState=setHash;x.ctx.history.replaceState=setHash;
  // The shared fixture normally traces navigation instead of mounting pages.
  // Re-evaluate the real module here to exercise its redirect/render handlers.
  vm.runInContext(fs.readFileSync(root+'/js/nav.js','utf8'),x.ctx,{filename:'js/nav.js'});
  return x;
}
const menu=x=>x.nodes.get('businessNavigation').innerHTML;
const content=x=>x.nodes.get('page-content').innerHTML;
for(const profile of ['super','admin','operator','operator-hq','operator-chen']){
  const x=navigation(profile),hasSeat=x.ctx.AgentWorkbench.hasSeat();
  assert.equal(x.ctx.navigateTo('home'),true);
  assert(menu(x).includes('>运营工作台</span>'));assert.equal(menu(x).includes('data-route="seat-workbench"'),hasSeat);
  assert(!menu(x).includes('data-route="manual-outbound"'));assert(!menu(x).includes('data-route="operations-monitor"'));
  assert(!content(x).includes('workbench-view-switch'));assert(!content(x).includes('id="seat-dial"'));
  assert.equal(x.ctx.navigateTo('manual-outbound'),true);
  assert.equal(x.ctx.RouteRuntime.snapshot().key,'seat-workbench');assert.equal(x.ctx.AppState.get().currentPage,'seat-workbench');assert.equal(x.ctx.location.hash,'#seat-workbench');
  assert(content(x).includes('坐席工作台'));assert(!content(x).includes('id="seat-dial"'));
  if(hasSeat){
    assert(content(x).includes('id="seat-temporary"'));assert(content(x).includes('首呼接通率'));
    x.ctx.AgentWorkbench.openTemporary();assert(x.layers.get('assigned-call-dialog').includes('id="seat-online"'));assert(!x.layers.get('assigned-call-dialog').includes('id="seat-dial"'));x.ctx.AgentWorkbench.closeDialog();
    x.ctx.WorkbenchOverview.open('calls','接通',true);assert.equal(x.ctx.RouteRuntime.snapshot().key,'seat-workbench');assert(content(x).includes('本人今日通话'));
  }else{assert(content(x).includes('当前账号尚未关联坐席'));assert(!content(x).includes('id="seat-temporary"'));}
  assert.equal(x.ctx.navigateTo('operations-monitor'),true);assert.equal(x.ctx.RouteRuntime.snapshot().key,'home');assert.equal(x.ctx.location.hash,'#home');
}

// A disabled local relation stays discoverable with a reason, but opening its
// modal is not permission to dial. Foreign relations do not create a menu item.
const disabled=navigation('operator-hq'),seat=disabled.ctx.AgentWorkbench.myAgent();seat.lifecycleStatus='已停用';
disabled.ctx.navigateTo('home');assert(menu(disabled).includes('data-route="seat-workbench"'));
disabled.ctx.navigateTo('seat-workbench');assert(content(disabled).includes('坐席已停用'));disabled.ctx.AgentWorkbench.openTemporary();assert.equal(disabled.ctx.AgentWorkbench.dial(),false);
seat.tenantId='TEN-NISSAN-SH';disabled.ctx.navigateTo('home');assert(!menu(disabled).includes('data-route="seat-workbench"'));

// Preserve the AI home/menu names and concrete page mappings. The new cloud
// workspace cannot be entered by its current or legacy URL from the AI domain.
for(const profile of ['super','admin','operator-hq']){
  const x=navigation(profile,'AI_OUTBOUND'),home=x.ctx.Pages.home.render();
  assert.equal(x.ctx.navigateTo('home'),true);assert.equal(content(x),home);
  assert(menu(x).includes('>工作台</span>'));assert(!menu(x).includes('运营工作台'));assert(!menu(x).includes('data-route="seat-workbench"'));
  const aiRoutes={'ai-tasks':'scene-list','ai-blocklist':'scene-block','ai-channels':'ai-domain','ai-scenes':'sys-scene','ai-tags':'sys-tags','ai-call-records':'result-records','ai-leads':'result-clue','ai-call-report':'report-call','ai-billing-report':'report-billing','ai-lead-report':'report-clue'};
  for(const [route,page]of Object.entries(aiRoutes)){assert.equal(x.ctx.RouteMap[route].page,page);assert.equal(x.ctx.RouteMap[route].domain,'AI_OUTBOUND');}
  for(const label of ['通话统计','计费统计','线索统计'])assert(menu(x).includes(label),label);
  for(const route of ['seat-workbench','manual-outbound']){assert.equal(x.ctx.navigateTo(route),false);assert(content(x).includes('当前身份无权访问'));}
}
// Demo selects an account only. Tenant/domain are chosen through normal login;
// seat is a separate authorized menu, never a shortcut-specific role or route.
const accounts=navigation('admin').d.demoAccountIds;
for(const accountId of accounts){
  const x=navigation('admin'),accountCount=x.d.accounts.length,membershipCount=x.d.memberships.length;
  assert.equal(x.ctx.DemoSwitch.enter(accountId),true,accountId);
  assert.equal(x.ctx.AppState.get().accountId,accountId);
  assert.equal(x.ctx.AppState.get().activeDomain,'');
  assert.equal(x.ctx.AppState.isReady(),false);
  if(x.ctx.AppState.get().authStage==='TENANT') assert.equal(x.ctx.AppState.chooseTenant('TEN-NISSAN-HQ'),true);
  assert.equal(x.ctx.AppState.get().authStage,'DOMAIN');
  assert.equal(x.ctx.AppState.chooseDomain('CLOUD_CONTACT_CENTER'),true);
  assert.equal(x.ctx.RouteRuntime.snapshot().key,'home',accountId);
  assert.equal(x.ctx.AppState.get().activeDomain,'CLOUD_CONTACT_CENTER');
  assert.equal(x.d.accounts.length,accountCount);assert.equal(x.d.memberships.length,membershipCount);
  if(x.ctx.AgentWorkbench.hasSeat()){assert.equal(x.ctx.navigateTo('seat-workbench'),true);assert(content(x).includes('id="seat-temporary"'));}
}
console.log('PASS VM: '+accounts.length+' 个真实演示账号，复用租户/业务域选择，坐席通过独立菜单进入');
console.log('PASS VM: 真实导航双工作台菜单、角色坐席可见性、无坐席/停用原因、旧人工与监控URL重定向、个人下钻、AI首页及既有路由/报表保留、跨业务域拒绝；非浏览器验收');
