async page=>{
 const results=[],errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push({status:r.status(),url:r.url()})});
 await page.setViewportSize({width:1512,height:1100});
 for(const [account,tenant] of [['ACC-SUPER-001',''],['ACC-ADMIN-018','TEN-NISSAN-HQ'],['ACC-ADMIN-018','TEN-NISSAN-SH'],['ACC-OPS-CHEN','TEN-NISSAN-HQ'],['ACC-OPS-066','TEN-NISSAN-SH']]){
  const scope=await page.evaluate(({account,tenant})=>{DemoSwitch.enter(account);if(AppState.get().authStage==='INSTANCE')AppState.chooseInstance('7522240');if(AppState.get().authStage==='TENANT')AppState.chooseTenant(tenant);if(AppState.get().authStage==='DOMAIN')AppState.chooseDomain('CLOUD_CONTACT_CENTER');return{...AppState.get(),role:AppState.effectiveAccess().roleCode};},{account,tenant});
  if(scope.accountId!==account||scope.authStage!=='READY')throw Error('login context '+account+' '+JSON.stringify(scope));
  const domains=await page.evaluate(()=>AppState.availableDomains());
  for(const domain of domains){
   const actual=await page.evaluate(d=>{AppState.requestDomainSwitch(d);return AppState.get().activeDomain},domain);if(actual!==domain)throw Error('domain did not switch');
   const routes=await page.evaluate(()=>Object.entries(RouteRuntime.routes).filter(([k,r])=>!r.internal&&RouteRuntime.canRoute(k)&&(!r.requiresSeat||AgentWorkbench.hasSeat())).map(([k,r])=>({key:k,label:r.label,page:r.page})));
   for(const route of routes){
    const count=errors.length;const item=await page.evaluate(route=>{try{RouteRuntime.openPrimary(route.key);let root=document.getElementById('page-content');return{...route,title:root?.querySelector('h1,h2')?.textContent,textLength:root?.innerText.length,text:root?.innerText.slice(0,150),empty:!root?.children.length,missingPage:!Pages[route.page],buttons:root?.querySelectorAll('button').length,hash:location.hash,activeDomain:AppState.get().activeDomain};}catch(e){return{...route,error:e.message}}},route);
    results.push({account,tenant,role:scope.role,domain,...item,errors:errors.slice(count)});
   }
  }
 }
 return {results,errors,bad};
}
