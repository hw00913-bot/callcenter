/* Local Mock session and scope resolver. Native modules consume this single context. */
(function () {
  'use strict';
  const PREFIX = 'd-contact-cloud-v200-rebuild-20261026:';
  const copy = value => JSON.parse(JSON.stringify(value));
  function create(seed, navigation, persistent, transient) {
    let accountId = '', scopeId = '', listeners = [], pageAvailability=null,seatResolver=null;
    const page = id => navigation.pages.find(row => row.id === id);
    const actor = () => seed.accounts.find(row => row.id === accountId && row.enabled);
    function read(storage, key, fallback) {
      let value;
      try { value = storage.getItem(PREFIX + key); } catch (_) { throw new Error('无法读取本地保存内容，请检查浏览器存储权限后重试。'); }
      if (value === null) return copy(fallback);
      try { const parsed=JSON.parse(value); if (!parsed || typeof parsed!=='object' || Array.isArray(parsed)) throw Error(); return parsed; }
      catch (_) { throw new Error('本地保存内容无法读取，原数据已保留。请联系维护人员检查。'); }
    }
    function write(storage, key, value) {
      try { storage.setItem(PREFIX+key, JSON.stringify(value)); }
      catch (_) { throw new Error('保存失败，操作未生效。请检查浏览器存储空间及权限后重试。'); }
    }
    function managesTenants(a=actor()){return !!a&&seed.managedTenantAccounts?.[a.id]===true&&a.platform?.role==='super';}
    function productionAccount(a){return !!a&&!a.legacyDemonstration&&!(seed.legacyDemonstrationIds||[]).includes(a.id)&&!(seed.syntheticLegacy?.accounts||[]).some(x=>x.id===a.id)&&(managesTenants(a)||(a.memberships||[]).some(m=>['admin','operator','seat'].includes(m.role)));}
    function scopes() {
      const a=actor(); if (!a) return [];
      if(managesTenants(a)){
        const grant=copy(a.platform),brands=seed.brands.filter(b=>(grant.brandIds||[]).includes(b.id));
        const all=seed.tenants.filter(t=>(grant.tenantIds||[]).includes(t.id)&&(!t.brandId||brands.some(b=>b.id===t.brandId)));
        const result=all.filter(t=>t.enabled).map(t=>({id:t.id,label:t.name,kind:'tenant',tenant:copy(t),authorityScopeId:grant.id,grant:{...copy(grant),tenantIds:all.filter(x=>(x.brandId||'')===(t.brandId||'')).map(x=>x.id),brandIds:t.brandId?[t.brandId]:[],modules:Object.keys(t.modules).filter(m=>t.modules[m]),moduleRoles:{ai:grant.role,cloud:grant.role}}}));
        // Empty brands still need an ordinary empty data context for tenant setup.
        // They are not roles, report modes, or choices in the tenant selector.
        for(const b of brands)if(!result.some(x=>x.tenant?.brandId===b.id))result.push({id:'brand:'+b.id,label:b.name,kind:'platform',brandId:b.id,authorityScopeId:grant.id,grant:{...copy(grant),brandIds:[b.id],tenantIds:all.filter(t=>t.brandId===b.id).map(t=>t.id)}});
        if(!result.length)result.push({id:grant.id,label:grant.label,kind:'platform',grant});
        return result;
      }
      const result=(a.memberships||[]).filter(m=>m.enabled).map(m=>{
        const tenant=seed.tenants.find(t=>t.id===m.tenantId&&t.enabled);
        return tenant ? {id:tenant.id,label:tenant.name,kind:'tenant',tenant:copy(tenant),grant:effectiveMember(m)} : null;
      }).filter(Boolean);
      if(a.platform)result.push({id:a.platform.id,label:a.platform.label,kind:'platform',grant:copy(a.platform)});
      return result;
    }
    function effectiveMember(member){const m=copy(member);if(m.role==='seat')m.role='operator';if(['admin','operator'].includes(m.role)){m.moduleRoles={ai:m.modules.includes('ai')?m.role:'',cloud:m.modules.includes('cloud')?m.role:''};}return m;}
    const context = () => {
      const a=actor(),s=scopes().find(row=>row.id===scopeId);
      return a&&s?{account:{id:a.id,name:a.name,label:a.label,nativeProfile:a.nativeProfile||'',platformAdministrator:managesTenants(a)},scope:s}:null;
    };
    const isPlatformContext=c=>!!c&&(c.scope.kind==='platform'||!!c.scope.authorityScopeId);
    function authorityScopeId(c=context()){return c?.scope.authorityScopeId||c?.scope.id||'';}
    function platformAuthority(c=context()){
      if(!isPlatformContext(c))return null;
      const a=seed.accounts.find(a=>a.id===c.account.id&&a.enabled);
      return a?.platform?.id===authorityScopeId(c)?copy(a.platform):null;
    }
    function isGlobalAdministrator(c=context()){return !!c&&seed.managedTenantAccounts?.[c.account.id]===true&&platformAuthority(c)?.role==='super';}
    // Preserve the established management scope when display groups are renamed.
    function isGlobalManagementPage(id,c=context()){return isGlobalAdministrator(c)&&['PAGE-2003','PAGE-2004','PAGE-2005','PAGE-2219','PAGE-2220','PAGE-2112'].includes(id);}

    function regulation(target){
      const c=target||context(),r=seed.regulationGrants?.[c?.account.id];
      if(!isPlatformContext(c)||r?.scopeId!==authorityScopeId(c)||r.readOnly!==true)return null;
      const brandIds=(c.scope.grant.brandIds||[]).filter(id=>seed.brands.some(b=>b.id===id));
      const tenantIds=(c.scope.grant.tenantIds||[]).filter(id=>(!c.scope.tenant||id===c.scope.tenant.id)&&seed.tenants.some(t=>t.id===id&&t.enabled&&brandIds.includes(t.brandId)));
      return {accountId:c.account.id,scopeId:c.scope.id,pages:r.pages.filter(id=>c.scope.grant.pages.includes(id)),brandIds,tenantIds,readOnly:true};
    }
    function roleKey(target=context()){return window.DRolePermissions?.role(target)||'';}
    function boundSeat(target=context()){if(!target||!seatResolver)return false;try{return seatResolver(target)===true;}catch(_){return false;}}
    function policyPage(id,target=context()){const result=window.DRolePermissions?.page(id,target,id==='PAGE-2207'?boundSeat(target):false)??null,role=roleKey(target);if(result===true&&role!=='super'&&window.DRolePermissions.matrix.pages[id]?.[role]==='conditional'){const pages=target.scope.grant.pages||[];return pages.includes(id)||id==='PAGE-2223'&&pages.includes('PAGE-2006');}return result;}
    function can(id,target=context()){return window.DRolePermissions?.action(id,target,['F37','F59'].includes(id)?boundSeat(target):false)===true;}
    function serviceTenantIds(action='service.view',target=context()){
      if(!target||!roleKey(target))return [];const fid={'service.view':'F53','service.history':'F53','service.trial':'F54','service.annual':'F54','service.credit':'F54','service.adjust':'F55','service.export':'F56'}[action];if(!fid||!can(fid,target))return [];
      const ids=roleKey(target)==='super'?(platformAuthority(target)?.tenantIds||[]):window.DRolePermissions.moduleEnabled('ai',target)?[target.scope.id]:[];
      return ids.filter(id=>seed.tenants.some(t=>t.id===id&&t.enabled)&&typeof seed.aiTenantIds?.[id]==='string'&&seed.aiTenantIds[id]);
    }
    function allowed(id, target) {
      const p=page(id), c=target||context(); if (!p||!c) return false;
      if(roleKey(c)){const decision=policyPage(id,c);if(decision===false)return false;if(id==='PAGE-2112'||isGlobalManagementPage(id,c))return decision===true;if(decision===true){if(p.module!=='public'&&!window.DRolePermissions.moduleEnabled(p.module,c))return false;if(['PAGE-2226','PAGE-2227','PAGE-2225'].includes(id)&&!window.DRolePermissions.moduleEnabled('cloud',c))return false;if(pageAvailability&&pageAvailability(id,c)===false)return false;return true;}}
      if(id==='PAGE-2220'){const authority=platformAuthority(c);return !!authority&&authority.role==='super'&&c.scope.grant.pages.includes(id);}
      if(id==='PAGE-2112'){
        const authority=platformAuthority(c),financial=seed.financialGrants?.[c.account.id];
        return !!authority&&c.scope.grant.pages.includes(id)&&financial?.scopeId===authorityScopeId(c)&&financial.sourceRole==='super_admin'&&financial.actions.includes('service.view');
      }
      const regulator=regulation(c);
      if(regulator?.pages.includes(id))return true;
      if(pageAvailability&&pageAvailability(id,c)===false)return false;
      const s=c.scope, grant=s.grant;
      if(s.authorityScopeId){if(!grant.pages.includes(id)&&!(id==='PAGE-2223'&&grant.pages.includes('PAGE-2006')))return false;if((seed.superReportPages||[]).includes(id))return !s.tenant||s.tenant.modules[p.module]===true;return true;}
      const inheritedClassification=id==='PAGE-2006'&&s.kind==='tenant'&&grant.pages.includes('PAGE-2111')&&grant.moduleRoles?.ai==='admin'&&s.tenant.modules.ai===true;
      const inheritedSpecial=id==='PAGE-2007'&&s.kind==='tenant'&&grant.modules.includes('ai')&&s.tenant.modules.ai===true;
      const recordPage=['PAGE-2226','PAGE-2227'].includes(id);
      const inheritedBusiness=recordPage&&s.kind==='tenant'&&grant.pages.includes('PAGE-2204')&&(seed.rolePages?.cloud?.[grant.moduleRoles?.cloud]||[]).includes(id);
      if (!grant.pages.includes(id) && !(id==='PAGE-2223'&&grant.pages.includes('PAGE-2006'))&&!inheritedSpecial&&!inheritedBusiness&&!inheritedClassification) return false;
      if(recordPage&&s.kind==='tenant')return grant.modules.includes('cloud')&&s.tenant.modules.cloud===true&&!!grant.moduleRoles?.cloud;
      if (s.kind==='platform') return true; // Explicit original platform scope; no synthetic tenant membership.
      if (p.module==='public') return true;
      return grant.modules.includes(p.module) && s.tenant.modules[p.module]===true;
    }
    function available() { return navigation.pages.filter(p=>p.menu&&allowed(p.id)); }
    function brandChoices(){
      const choices=scopes(),a=actor(),ids=new Set(choices.map(s=>s.tenant?.brandId||s.brandId).filter(Boolean));
      if(managesTenants(a))for(const id of a.platform.brandIds||[])ids.add(id);
      const rows=seed.brands.filter(b=>ids.has(b.id)).map(b=>({id:b.id,name:b.name}));
      if(choices.some(s=>s.kind==='tenant'&&!s.tenant.brandId))rows.push({id:'',name:'待关联品牌'});
      return rows;
    }
    function currentBrand(){const s=context()?.scope;return s?.tenant?.brandId||s?.brandId||'';}
    function scopeChoices(){const brand=currentBrand();return scopes().filter(s=>s.kind==='tenant'&&(s.tenant.brandId||'')===brand);}
    function loginChoices(){const rows=scopes();if(!managesTenants())return rows;const tenants=rows.filter(s=>s.kind==='tenant');return tenants.length?tenants:rows.slice(0,1);}
    function preferredTenant(brandId){
      const rows=scopes().filter(s=>s.kind==='tenant'&&(brandId===undefined||(s.tenant.brandId||'')===brandId));
      const entry=preferences().accounts[accountId]||{},saved=brandId===undefined?entry.lastTenant:entry.brandTenants?.[brandId];
      return rows.find(s=>s.id===saved)||rows[0];
    }
    function resolveScope(id){
      if(managesTenants()){
        const a=actor();
        if(id===a.platform.id)return preferredTenant()?.id||scopes()[0]?.id;
        if(typeof id==='string'&&id.startsWith('brand:')){const brand=id.slice(6);if(!brandChoices().some(b=>b.id===brand))return '';return preferredTenant(brand)?.id||scopes().find(s=>s.id===id)?.id||'';}
      }
      return scopes().some(s=>s.id===id)?id:'';
    }
    function selectBrand(id){
      if(!brandChoices().some(b=>b.id===id))throw Error('当前没有该品牌的访问权限。');
      const target=preferredTenant(id)||scopes().find(s=>s.brandId===id);
      if(!target)throw Error('当前品牌暂无可访问的租户。');
      return selectScope(target.id);
    }
    function needsTenant(id){const c=context(),p=page(id);return managesTenants()&&!!c&&!c.scope.tenant&&!!p&&((p.module==='ai'&&id!=='PAGE-2112')||(p.module==='cloud'&&['PAGE-2202','PAGE-2203','PAGE-2205','PAGE-2206','PAGE-2207','PAGE-2208','PAGE-2209','PAGE-2225'].includes(id)));}

    function preferences() {
      const data=read(persistent,'positions',{version:1,accounts:{}});
      if(data.version!==1 || !data.accounts || typeof data.accounts!=='object' || Array.isArray(data.accounts)) throw new Error('工作位置记录格式异常，原记录已保留。');
      return data;
    }
    function storedPosition(id) {
      const c=context();if(!c)return null;const account=preferences().accounts[accountId]||{};const key=isGlobalManagementPage(id,c)?'global:'+authorityScopeId(c):scopeId;return (account.positions||{})[key]||null;
    }
    function hasPositionContext(id,filters) {return id==='PAGE-2227'?!!filters?.recordId:id==='PAGE-2226'?!!filters?.batchKey:true;}
    function position() {
      const saved=storedPosition();return saved&&allowed(saved.pageId)&&hasPositionContext(saved.pageId,saved.filters)?{...copy(saved),filters:isGlobalManagementPage(saved.pageId)?filters(saved.pageId):copy(saved.filters||{})}:null;
    }
    function landing() {
      const c=context(); if (!c) return '';
      const saved=position(); if (saved) return saved.pageId;
      const intent=c.scope.grant.landing;
      if(allowed(intent))return intent;
      const choices=available();
      // Re-resolve the original domain intent, never give all roles the import-first rule.
      const original=page(intent);
      const same=original && choices.find(p=>p.module===original.module);
      return (same||choices[0]||{}).id||'';
    }
    function loginLanding() {
      const c=context();if(!c)return '';
      const professional=navigation.pages.some(p=>allowed(p.id)&&(p.module!=='public'||p.phoneDomain==='cloud'));
      if(!professional){
        // SRC-2032/2034: fresh management-only login keeps the original menu intent;
        // same-login navigation and reload still use landing()/areaLanding().
        const first=(seed.rolePages?.publicAdmin||[]).find(id=>page(id)?.menu&&allowed(id));
        if(first)return first;
      }
      return landing();
    }
    function persistSession(nextAccount, nextScope) {
      write(transient,'session',{version:1,accountId:nextAccount,scopeId:nextScope});
      accountId=nextAccount;scopeId=nextScope;
    }
    function selectScope(id) {
      id=resolveScope(id);if(!id)throw new Error('你当前没有该租户的访问权限。');
      const enteringLogin=!scopeId;
      const pref=preferences(); const entry=pref.accounts[accountId]||{positions:{}};
      entry.lastScope=id;const selected=scopes().find(s=>s.id===id);if(selected?.tenant){entry.lastTenant=id;entry.brandTenants={...(entry.brandTenants||{}),[selected.tenant.brandId||'']:id};}pref.accounts[accountId]=entry;
      // Preference write succeeds before committing the scope transition.
      write(persistent,'positions',pref); persistSession(accountId,id); emit();
      return enteringLogin?loginLanding():landing();
    }
    function login(id) {
      const a=seed.accounts.find(row=>row.id===id&&row.enabled);
      if(!a||!productionAccount(a))throw new Error('此账号已停用或不属于当前可用角色。');
      persistSession(a.id,'');
      const choices=loginChoices(), pref=preferences().accounts[a.id]||{};
      const previous=resolveScope(pref.lastScope);if(previous)return {pageId:selectScope(previous),needsChoice:false};
      if (choices.length===1) return {pageId:selectScope(choices[0].id),needsChoice:false};
      emit(); return {needsChoice:choices.length>1,pageId:''};
    }
    // Public fixture credentials are separate from user-created local account profiles.
    function loginRecords(){
      const config=seed.demoLogin;
      if(!config)throw Error('演示登录配置暂时无法读取，请重新打开页面。');
      return seed.accounts.filter(a=>a.enabled&&productionAccount(a)).map(a=>{
        const fixture=config.accounts[a.id]||{};
        return {id:a.id,name:a.name,label:a.label,username:a.login&&a.login!==a.id?a.login:fixture.username||a.login||a.id,
          password:Object.hasOwn(a,'password')?a.password:fixture.password||config.defaultPassword,
          mobile:Object.hasOwn(a,'mobile')?a.mobile:fixture.mobile||''};
      });
    }
    function demoLoginOptions(){
      return loginRecords().filter(row=>{const a=seed.accounts.find(a=>a.id===row.id);return !a.mockCreated&&!a.credentialsUpdated&&!a.legacyDemonstration&&!(seed.legacyDemonstrationIds||[]).includes(a.id)&&!(seed.syntheticLegacy?.accounts||[]).some(x=>x.id===a.id)&&(managesTenants(a)||(a.memberships||[]).some(m=>['admin','operator','seat'].includes(m.role)));}).map(row=>{const a=seed.accounts.find(a=>a.id===row.id),labels=managesTenants(a)?['超级管理员']:[...new Set((a.memberships||[]).map(m=>window.DRolePermissions.matrix.roles[window.DRolePermissions.memberRole(m,seed.tenants.find(t=>t.id===m.tenantId))]).filter(Boolean))];return {...row,label:labels.join('／')};});
    }
    function mobileAccount(mobile) {
      if(!/^1\d{10}$/.test(mobile))throw Error('请输入正确的 11 位手机号码。');
      const rows=loginRecords().filter(a=>a.mobile===mobile);
      if(rows.length!==1)throw Error('该手机号未关联唯一可用账号。');
      return rows[0];
    }
    function demoSmsMessage(mobile) {
      mobileAccount(String(mobile||'').trim());
      return '本地演示验证码：'+seed.demoLogin.smsCode+'（未发送真实短信）';
    }
    function loginWithCredentials(input={}) {
      let selected;
      if(input.mode==='mobile') {
        selected=mobileAccount(String(input.mobile||'').trim());
        const code=String(input.code||'').trim();
        if(!code)throw Error('请输入短信验证码。');
        if(code!==seed.demoLogin.smsCode)throw Error('短信验证码错误。');
      } else if(input.mode==='password') {
        const username=String(input.username||'').trim(),password=String(input.password||'');
        const captcha=String(input.captcha||'').trim(),expected=String(input.expectedCaptcha||'');
        if(!username)throw Error('请输入账号。');
        if(!password)throw Error('请输入密码。');
        if(!captcha)throw Error('请输入图形验证码。');
        if(!/^[a-z0-9]{4}$/i.test(expected)||captcha.toLowerCase()!==expected.toLowerCase())throw Error('图形验证码错误。');
        const rows=loginRecords().filter(a=>a.username===username||seed.accounts.find(row=>row.id===a.id)?.login===username);
        if(rows.length!==1||rows[0].password!==password)throw Error('账号或密码错误，或账号已停用。');
        selected=rows[0];
      } else throw Error('请选择有效的登录方式。');
      return login(selected.id);
    }
    function restore() {
      const saved=read(transient,'session',{version:1,accountId:'',scopeId:''});
      if(saved.version!==1)throw new Error('登录记录格式异常，请重新选择演示身份。');
      accountId=typeof saved.accountId==='string'?saved.accountId:'';
      scopeId=typeof saved.scopeId==='string'?resolveScope(saved.scopeId)||'':'';
      if(!actor()||!productionAccount(actor())){accountId='';scopeId='';return {authenticated:false};}
      if(!scopes().some(s=>s.id===scopeId)) scopeId='';
      if(!scopeId&&loginChoices().length===1)selectScope(loginChoices()[0].id);
      return {authenticated:true,needsChoice:!scopeId,pageId:scopeId?landing():''};
    }
    function remember(id, filters) {
      if(!allowed(id))throw new Error('该页面当前不可访问。');
      const data=preferences(), entry=data.accounts[accountId]||{positions:{}};
      const positions=entry.positions||{};
      const prior=positions[scopeId]||{}, pageFilters=prior.pageFilters||{}, areaPages=prior.areaPages||{};
      areaPages[page(id).area]=id;
      const updatedAt=new Date().toISOString();
      if(isGlobalManagementPage(id)){
        const key='global:'+authorityScopeId(),global=positions[key]||{},shared=global.pageFilters||{};
        shared[id]=copy(filters||{});positions[key]={...global,pageId:id,pageFilters:shared,updatedAt};
        positions[scopeId]={pageId:id,filters:{},pageFilters,areaPages,updatedAt};
      }else{
        pageFilters[id]=copy(filters||{});positions[scopeId]={pageId:id,filters:copy(filters||{}),pageFilters,areaPages,updatedAt};
      }
      entry.positions=positions;entry.lastScope=scopeId;data.accounts[accountId]=entry;
      write(persistent,'positions',data);
    }
    function filters(id) {
      const saved=storedPosition(id);return allowed(id)&&saved&&saved.pageFilters&&saved.pageFilters[id]?copy(saved.pageFilters[id]):{};
    }
    function areaLanding(area) {
      area=navigation.areaAliases?.[area]||area;
      const saved=storedPosition(), legal=id=>id&&page(id)?.area===area&&allowed(id)&&hasPositionContext(id,saved?.pageFilters?.[id]);
      // Read old area keys without migrating or deleting existing positions/data.
      const aliases=Object.keys(navigation.areaAliases||{}).filter(key=>navigation.areaAliases[key]===area);
      const candidates=[saved?.pageId,saved?.areaPages?.[area],...aliases.map(key=>saved?.areaPages?.[key])];
      const remembered=candidates.find(legal);if(remembered)return remembered;
      const intent=context()?.scope.grant.landing;if(legal(intent))return intent;
      if(area==='业务&客户'&&allowed('PAGE-2204'))return 'PAGE-2204';
      return (available().find(p=>p.area===area)||{}).id;
    }
    function logout() { persistSession('','');emit(); }
    function emit() {listeners.forEach(fn=>fn(context()));}
    function refresh() {
      if(!actor()) {accountId='';scopeId='';}
      else if(!scopes().some(s=>s.id===scopeId))scopeId='';
      emit(); return context();
    }
    return {prefix:PREFIX,page,actor:()=>actor()?copy(actor()):null,context,scopes,loginChoices,brandChoices,currentBrand,scopeChoices,selectBrand,isPlatformContext,authorityScopeId,platformAuthority,isGlobalAdministrator,isGlobalManagementPage,needsTenant,regulation,allowed,available,landing,areaLanding,login,loginWithCredentials,demoLoginOptions,demoSmsMessage,restore,selectScope,remember,filters,logout,refresh,
      canResume(id){return allowed(id)&&hasPositionContext(id,filters(id));},
      nativeStoragePrefix(target=context()){const synthetic=seed.syntheticLegacy?.accounts?.find(a=>a.id===target?.account.id);return PREFIX+'cloud:'+(synthetic?'synthetic-'+(synthetic.fixtureStorageGroup||'legacy')+':':'');},
      setPageAvailability(fn){pageAvailability=fn;},
      roleKey,roleLabel:(target=context())=>window.DRolePermissions?.label(target)||'',can,policyPage,boundSeat,serviceTenantIds,setSeatResolver(fn){seatResolver=fn;},
      subscribe(fn){listeners.push(fn);return ()=>{listeners=listeners.filter(x=>x!==fn);};},
      canWrite(id){const c=context();if(regulation(c)?.pages.includes(id))return false;if(roleKey(c))return allowed(id)&&window.DRolePermissions.writable(id,c,boundSeat(c))===true;const p=page(id),recordPage=['PAGE-2226','PAGE-2227'].includes(id),role=c&&(recordPage?c.scope.grant.moduleRoles?.cloud:c.scope.grant.moduleRoles?.[p?.module]||c.scope.grant.role);return allowed(id)&&!!role&&role!=='reader';},
      getSeed:()=>copy(seed)};
  }
  window.createDSessionStore=create;
  let storeError=null;
  try {window.DSession=create(DSeed,DNav,window.localStorage,window.sessionStorage);} catch(error){storeError=error;}
  window.DSessionError=storeError;
})();
