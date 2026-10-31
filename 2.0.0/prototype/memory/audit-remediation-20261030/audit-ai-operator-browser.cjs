async (page) => {
  await page.evaluate(()=>{const ids=JSON.parse(sessionStorage.getItem('audit-ai-only-ids'));DSession.login(ids[1]);DSession.selectScope('TEN-NISSAN-HQ');DSession.remember('PAGE-2103',{});});
  await page.reload();await page.waitForFunction(()=>window.DModuleHost?.isReady('ai'));
  const cold=await page.evaluate(()=>({role:DSession.roleKey(),modules:DSession.context().scope.grant.modules,cloudReady:DModuleHost.isReady('cloud'),cloudAllowed:DSession.allowed('PAGE-2204')}));
  if(cold.cloudReady||cold.cloudAllowed||cold.role!=='hq_ops')throw Error('not an AI-only cold operator');
  const f=page.frameLocator('iframe[data-native-module=ai]');
  await f.locator("button[onclick=\"window.Pages['scene-list'].showDetail(24)\"]").click();
  await f.getByText('呼叫名单',{exact:true}).click();await f.getByRole('button',{name:'手动导入',exact:true}).click();
  await f.locator('#importModalBackdrop input[type=file]').setInputFiles('/private/tmp/audit-ai-operator.csv');
  await f.getByRole('button',{name:'开始上传',exact:true}).click();
  await f.locator('#importModalBackdrop').waitFor({state:'detached',timeout:15000});
  const result=await page.evaluate(()=>{const a=document.querySelector('iframe[data-native-module=ai]').contentWindow,doc=JSON.parse(a.localStorage.getItem(a.DAIConfigStore.key)),row=doc.data.imports.assigned[24].find(x=>x.rawPhone==='13966778802'),batch=doc.data.imports.history[0];
    if(!row||batch.success!==1||batch.op!==DSession.context().account.name)throw Error('new exact row/actor not persisted');
    return {row,batch,review:a.DAIConfigStore.reviewCurrent(),cloudAllowed:DSession.allowed('PAGE-2204'),cloudHidden:document.querySelector('iframe[data-native-module=cloud]').hidden,coordination:DModuleHost.readContactCoordination('TEN-NISSAN-HQ','13966778802')};});
  if(result.coordination.allowed!==false||result.coordination.state!=='CONTACT_OCCUPIED')throw Error('active queue did not block contact');
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'/private/tmp/audit-ai-operator-success.png'});
  return {cold,result};
}
