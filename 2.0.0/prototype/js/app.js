(function () {
  'use strict';
  const e=DUI.esc;
  let activePage='', draftGuard=null,enteringShell=false,shellEpoch=0;
  const navGroups=new Map();
  const brandIcon='<svg width="22" height="22" viewBox="0 0 128 128" fill="none" aria-hidden="true"><path d="M64 12L116 64L64 116L12 64L64 12Z" stroke="#5b9bff" stroke-width="12"></path><path d="M64 36L92 64L64 92L36 64L64 36Z" fill="#ff6b6b"></path></svg>';
  const container=()=>document.getElementById('workspace');
  const roleLabel=c=>DSession.roleLabel(c);

  window.Pages=window.Pages||{};
  function errorScreen(error) {
    container().innerHTML='<div class="d-login"><section class="d-login-panel"><div class="d-wordmark"><b>D</b> D联络云</div><h1>暂时无法进入</h1><p class="d-error">'+e(error.message)+'</p><button class="btn btn-primary" id="retry">重新读取</button></section></div>';
    document.getElementById('retry').onclick=boot;
  }
  function loginScreen() {shellEpoch++;enteringShell=false;
    document.getElementById('dialog-root').innerHTML='';draftGuard=null;activePage='';
    DLoginScreen.mount(container(),{
      options:()=>DSession.demoLoginOptions(),
      sendSms:mobile=>{if(window.DOrganization)DOrganization.load();return DSession.demoSmsMessage(mobile);},
      submit:form=>{
        if(window.DOrganization)DOrganization.load();
        const result=DSession.loginWithCredentials(form);
        if(result.needsChoice)tenantScreen();else renderShell(result.pageId);
      }
    });
  }
  function tenantScreen() {shellEpoch++;enteringShell=false;
    document.getElementById('dialog-root').innerHTML='';draftGuard=null;const account=DSession.actor(); if(!account)return loginScreen();
    DLoginScreen.mountScope(container(),{account,scopes:DSession.loginChoices(),choose:id=>renderShell(DSession.selectScope(id)),back:()=>{DSession.logout();loginScreen();}});
  }
  function renderShell(id,options={}) {
    const epoch=++shellEpoch;enteringShell=true;activePage='';
    document.getElementById('dialog-root').innerHTML='';draftGuard=null;const c=DSession.context();if(!c)return tenantScreen();
    container().innerHTML='<div class="d-app"><header class="d-topbar"><div class="d-wordmark">D联络云</div><nav id="area-nav" aria-label="业务区域"></nav><div class="d-user"><label class="d-context-button"><small>品牌</small><select id="brand-switch" aria-label="当前品牌"></select></label><label class="d-context-button"><small>租户</small><select id="scope-switch" aria-label="当前租户"></select></label><span class="d-role-chip">'+e(roleLabel(c))+'</span><button type="button" class="d-current-user d-profile-trigger" id="account-profile" title="查看本人账号信息">'+e(c.account.name)+'</button><button id="logout" class="d-text-button">退出</button></div></header><div class="d-body"><aside class="d-sidebar"><div class="d-sidebar-heading">'+brandIcon+'<strong id="area-title"></strong></div><nav id="main-nav" aria-label="功能菜单"></nav><div class="d-sidebar-footnote">v2.0.0 · 模拟演示</div></aside><main id="page-host"><div id="app"></div></main></div></div>';
    renderContextSelectors();
    document.getElementById('account-profile').onclick=accountProfile;
    document.getElementById('logout').onclick=()=>leave(null,()=>{try{DSession.logout();if(window.DModuleHost)DModuleHost.dispose();loginScreen();}catch(error){DUI.toast(error.message);}});
    const identity=c.account.id+'|'+c.scope.id;
    const finish=warning=>{const now=DSession.context();if(epoch!==shellEpoch||identity!==now?.account.id+'|'+now?.scope.id)return;enteringShell=false;renderContextSelectors();document.getElementById('account-profile').disabled=false;const target=options.keepRequested&&DSession.canResume(id)?id:DSession.landing();if(target&&DSession.allowed(target))openPage(target,{initial:true});else emptyScope();if(warning)DUI.toast('坐席信息暂未读取完整，可先使用其他已授权功能。');};
    if(c.scope.kind==='tenant'&&!DSession.isPlatformContext(c)&&c.scope.tenant.modules.cloud&&c.scope.grant.modules.includes('cloud')){
      document.getElementById('app').innerHTML='<section class="platform-page"><p role="status">正在读取当前租户的坐席关联，请稍候…</p></section>';
      document.getElementById('brand-switch').disabled=true;document.getElementById('scope-switch').disabled=true;document.getElementById('account-profile').disabled=true;
      Promise.resolve(DModuleHost.prepareSeatCapabilities()).then(()=>finish(false),()=>finish(true));
    }else finish(false);
  }
  function accountProfile(){
    const c=DSession.context(),a=DSession.actor();if(!c||!a)return;
    const fixture=DSeed.demoLogin?.accounts?.[a.id]||{},login=a.login&&a.login!==a.id?a.login:fixture.username||a.login||a.id;
    const mobile=Object.hasOwn(a,'mobile')?a.mobile:fixture.mobile||'未登记',roles={reader:'只读',operator:'运营',admin:'管理员',super:'超级管理员'};
    const avatar=typeof a.avatar==='string'&&/^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/.test(a.avatar)?'<img src="'+e(a.avatar)+'" alt="本人头像">':e(String(a.name||'账').slice(0,1));
    const rows=[['登录账号',login],['账号昵称',a.name],['手机号码',mobile||'未登记'],['当前身份',roleLabel(c)],['当前租户',c.scope.tenant?.name||c.scope.label],['AI外呼权限',c.scope.grant.modules?.includes('ai')?'已授权':'未授权'],['云呼叫权限',c.scope.grant.modules?.includes('cloud')?'已授权':'未授权']];
    const actions=[{label:'关闭',run:close=>close()}];
    if(DSession.allowed('PAGE-2102'))actions.push({label:DSession.page('PAGE-2102').name,run:close=>{close();openPage('PAGE-2102');}});
    if(DSession.allowed('PAGE-2003'))actions.push({label:'账号管理',primary:true,run:close=>{close();openPage('PAGE-2003',{pageFilters:{tenantId:DSession.isGlobalAdministrator()?'':c.scope.id,search:login,role:'',status:'',accountPage:1}});}});
    DUI.dialog('账号信息','<div class="d-org-avatar d-profile-avatar"><span>'+avatar+'</span><strong>'+e(a.name)+'</strong></div><dl class="d-org-details">'+rows.map(([key,value])=>'<dt>'+e(key)+'</dt><dd>'+e(value)+'</dd>').join('')+'</dl>',actions,{drawer:true,stack:true});
  }
  function emptyScope() {
    document.getElementById('app').innerHTML='<div class="d-page-empty"><h2>暂无可访问的功能</h2><p>请联系管理员检查当前范围的使用权限。</p></div>';
    activePage='';renderNav('');
  }
  function renderNav(id) {
    const pages=DSession.available(), current=DSession.page(id), area=current?current.area:'';
    document.getElementById('area-title').textContent=area||'可用功能';
    document.getElementById('area-nav').innerHTML=DNav.areas.filter(a=>pages.some(p=>p.area===a)).map(a=>'<button data-area="'+e(a)+'" class="'+(a===area?'active':'')+'">'+e(a)+'</button>').join('');
    const areaPages=pages.filter(p=>p.area===area), ordered=[], used=new Set();
    areaPages.forEach(p=>{if(used.has(p.id))return;const members=p.group?areaPages.filter(x=>x.group===p.group):[p];members.forEach(x=>{ordered.push(x);used.add(x.id);});});
    const parentMenu={'PAGE-2227':'PAGE-2226','PAGE-2225':'PAGE-2202'};
    const currentId=parentMenu[id]||id;
    const item=(p,child)=>{const name=p.id==='PAGE-2106'&&DSession.context().scope.grant.role==='finance'?'服务汇总导出':p.name;return '<button data-page="'+e(p.id)+'" class="d-nav-item '+(child?'d-nav-child ':'')+(p.id===currentId?'active':'')+'" '+(p.id===currentId?'aria-current="page"':'')+'>'+(!child?'<span class="d-nav-icon" aria-hidden="true">'+e(name.slice(0,1))+'</span>':'')+e(name)+'</button>';};
    const rendered=new Set();
    document.getElementById('main-nav').innerHTML=ordered.map(p=>{
      if(!p.group)return item(p,false);
      if(rendered.has(p.group))return '';rendered.add(p.group);
      const members=ordered.filter(row=>row.group===p.group),selected=members.some(row=>row.id===currentId),key=area+'|'+p.group;
      if(!navGroups.has(key))navGroups.set(key,selected);
      if(selected)navGroups.set(key,true);
      const open=navGroups.get(key);
      return '<div class="d-nav-group-block '+(open?'open ':'')+(selected?'active-parent':'')+'"><button class="d-nav-item d-nav-group-trigger" data-nav-group="'+e(key)+'" aria-expanded="'+open+'"><span class="d-nav-icon" aria-hidden="true">'+e(p.group.slice(0,1))+'</span><span>'+e(p.group)+'</span><span class="d-nav-chevron" aria-hidden="true">⌄</span></button><div class="d-nav-children" '+(open?'':'hidden')+'>'+members.map(row=>item(row,true)).join('')+'</div></div>';
    }).join('');
    document.querySelectorAll('[data-nav-group]').forEach(button=>button.onclick=()=>{const open=button.getAttribute('aria-expanded')!=='true';navGroups.set(button.dataset.navGroup,open);button.setAttribute('aria-expanded',String(open));button.parentElement.classList.toggle('open',open);button.nextElementSibling.hidden=!open;});
    document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>openPage(b.dataset.page,{menuEntry:true}));
    document.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>{const id=DSession.areaLanding(b.dataset.area);if(id)openPage(id);});
  }
  function leave(target, proceed) {
    const run=()=>{
      if(draftGuard&&draftGuard.isDirty()){
        const guard=draftGuard;
        DUI.dialog('内容尚未保存','<p>离开前请选择如何处理当前填写的内容。</p>',[
          {label:'取消',run:close=>close()},
          {label:'放弃修改',run:close=>{if(draftGuard!==guard)return close();try{guard.discard();draftGuard=null;close();proceed();}catch(error){close();DUI.toast(error.message);}}},
          {label:'保存并继续',primary:true,run:async (close,button)=>{if(draftGuard!==guard)return close();button.disabled=true;try{const result=await guard.save({continueNavigation:true});close();if(result===false)return;draftGuard=null;proceed();}catch(error){close();DUI.toast(error.message);}finally{button.disabled=false;}}}
        ],{stack:true});return;
      }
      proceed();
    };
    if(window.DModuleHost&&typeof DModuleHost.beforeLeave==='function')DModuleHost.beforeLeave(target,run);else run();
  }
  function safePosition(options){const out={};for(const key of ['recordId','batchKey','batchId','mechanism','assignmentView','view','serviceTenantId','reportRoute','catalogScope','physicalGroupId','tenantId','fourNodeDirectoryView'])if(['string','number','boolean'].includes(typeof options?.[key]))out[key]=options[key];if(options?.originBatch&&typeof options.originBatch==='object')out.originBatch=Object.fromEntries(['batchKey','batchId','mechanism','sourceBatchId'].filter(k=>typeof options.originBatch[k]==='string').map(k=>[k,options.originBatch[k]]));return out;}
  function openPage(id, options) {
    options=options||{};
    if(!DSession.allowed(id)){DUI.toast('当前没有该功能的访问权限。');return false;}
    const next=DSession.page(id);
    const apply=()=>{
      try{
        const restored={...DSession.filters(id),...safePosition(options.nativeOptions),...(options.pageFilters||{})};
        if(options.menuEntry&&['PAGE-2204','PAGE-2226'].includes(id)){for(const key of ['recordId','batchKey','batchId','originBatch','mechanism','assignmentView','batchDetail','importCategoryId','importLaunchId','importBrandId'])delete restored[key];options.nativeOptions={recordId:'',batchKey:'',batchId:'',originBatch:null,batchDetail:false,primaryNavigation:true};}
        if(options.initial||activePage!==id||options.nativeOptions||options.pageFilters||options.menuEntry)DSession.remember(id,restored);
        activePage=id;renderNav(id);
        const host=document.getElementById('app');
        const page=Pages[id];
        if(page){if(window.DModuleHost)DModuleHost.hide();host.hidden=false;host.innerHTML=page.render(DSession.context(),restored);if(page.init)page.init(DSession.context(),restored);}
        else if(window.DModuleHost&&DModuleHost.supports(id)){host.hidden=true;DModuleHost.open(id,restored,options.nativeOptions);}
        else{if(window.DModuleHost)DModuleHost.hide();host.hidden=false;host.innerHTML='<div class="d-page-empty"><h1>'+e(next.name)+'</h1><p>此页面正在接入原有界面。</p><p class="d-muted">当前可核对登录、租户及菜单范围，专业功能尚未完成。</p></div>';}
        history.replaceState(null,'','#'+id);
      }catch(error){DUI.toast(error.message);}
    };
    if(options.initial)apply();else leave(next,apply);return true;
  }
  function changeContext(select,previous,apply){
    const value=select.value;select.value=previous;if(value===previous)return;
    const page=activePage;leave(null,()=>{try{const fallback=apply(value);if(window.DModuleHost)DModuleHost.dispose();renderShell(page,{keepRequested:true});}catch(error){renderContextSelectors();DUI.toast(error.message);}});
  }
  function renderContextSelectors(){
    const c=DSession.context();if(!c)return;
    const role=document.querySelector('.d-role-chip'),user=document.querySelector('.d-current-user');if(role)role.textContent=roleLabel(c);if(user)user.textContent=c.account.name;
    const brand=document.getElementById('brand-switch'),tenant=document.getElementById('scope-switch');if(!brand||!tenant)return;
    const brands=DSession.brandChoices(),tenants=DSession.scopeChoices();
    brand.innerHTML=brands.length?brands.map(b=>'<option value="'+e(b.id)+'">'+e(b.name)+'</option>').join(''):'<option value="">—</option>';
    brand.value=DSession.currentBrand();brand.disabled=brands.length<2;
    tenant.innerHTML=tenants.length?tenants.map(t=>'<option value="'+e(t.id)+'">'+e(t.label)+'</option>').join(''):'<option value="">'+e(c.scope.brandId?'暂无租户':c.scope.label)+'</option>';
    tenant.value=c.scope.kind==='tenant'?c.scope.id:'';tenant.disabled=tenants.length<2;
    brand.onchange=()=>changeContext(brand,DSession.currentBrand(),id=>DSession.selectBrand(id));
    tenant.onchange=()=>changeContext(tenant,DSession.context().scope.id,id=>DSession.selectScope(id));
  }
  function reconcileOrganization() {
    try{DOrganization.load();const valid=DSession.context()&&DSession.allowed(activePage);
      if(!valid&&window.DModuleHost?.finishRevokedCall()){
        document.querySelectorAll('.d-topbar button,.d-topbar select,#main-nav button').forEach(b=>b.disabled=true);
        let note=document.getElementById('limited-finish');if(!note){note=document.createElement('p');note.id='limited-finish';note.className='d-limited-finish';document.querySelector('.d-topbar').after(note);}note.textContent='当前使用权限已停用，仅可完成本次通话及必要话后记录。';return;
      }
      if(valid){renderContextSelectors();window.DContacts?.recheck();DApp.recheckNavigation();DUI.toast('管理资料已更新；提交时会重新核对权限和对象。');return;}
      DSession.refresh();if(window.DModuleHost)DModuleHost.dispose();boot();
    }catch(error){DUI.toast(error.message);}
  }
  window.addEventListener('storage',event=>{if(window.DOrganization&&event.key===DOrganization.key)reconcileOrganization();});
  function boot() {try{if(DSessionError)throw DSessionError;if(window.DOrganizationError)throw DOrganizationError;const state=DSession.restore();if(!state.authenticated)loginScreen();else if(state.needsChoice)tenantScreen();else renderShell(state.pageId);}catch(error){errorScreen(error);}}
  window.DApp={openPage,finishRevoked:reconcileOrganization,recheckNavigation(){if(enteringShell)return;if(!DSession.allowed(activePage)){document.getElementById('dialog-root').innerHTML='';draftGuard=null;const id=DSession.landing();if(id)openPage(id,{initial:true});else emptyScope();}else renderNav(activePage);},currentPage:()=>activePage,setDraftGuard:guard=>{draftGuard=guard;},saveFilters:filters=>DSession.remember(activePage,filters),refresh:()=>{DSession.refresh();if(window.DModuleHost)DModuleHost.dispose();boot();},leave};
  window.navigateTo=openPage;window.getCurrentPage=()=>activePage;
  boot();
})();
