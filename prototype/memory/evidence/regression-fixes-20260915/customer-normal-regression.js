async page=>{
 const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));const check=(name,ok)=>checks.push({name,ok:!!ok});
 await page.evaluate(()=>{DemoSwitch.enter('ACC-ADMIN-018');if(AppState.get().authStage==='TENANT')AppState.chooseTenant('TEN-NISSAN-HQ');if(AppState.get().authStage==='DOMAIN')AppState.chooseDomain('CLOUD_CONTACT_CENTER');else AppState.requestDomainSwitch('CLOUD_CONTACT_CENTER');RouteRuntime.openPrimary('customer-tasks');});
 await page.locator('#page-content').getByRole('button',{name:'导入客户',exact:true}).click();
 await page.locator('#customer-import-business-type').selectOption('lead');await page.locator('#customer-batch-name').fill('全量回归客户');
 await page.locator('#customer-import-text').fill('客户称呼,客户号码,联系备注,线索编码\n回归甲,13900009871,"需要确认,含逗号",0012\n重复甲,13900009871,,0020\n回归乙,13900009872,,0021');
 await page.locator('#customer-import').getByRole('button',{name:'检查名单',exact:true}).click();
 check('CSV引用/重复展示',await page.locator('#customer-import-preview').innerText().then(t=>t.includes('可导入 2 位')&&t.includes('同批号码重复')));
 await page.locator('#customer-import-confirm').click();
 let batch=await page.evaluate(()=>CustomerTasks.reportSnapshot().find(b=>b.name==='全量回归客户'));
 check('两条有效数据与原值编码',batch?.rows?.length===2&&batch.rows[0].externalDocumentId==='0012'&&batch.rows[0].note==='需要确认,含逗号');
 await page.waitForFunction(()=>!document.querySelector('.drawer-entering'));
 await page.locator('[name="customer-row"]').first().check();
 await page.getByRole('button',{name:'分配客户',exact:true}).click();await page.locator('#customer-method').selectOption('人工外呼');await page.locator('#customer-target').selectOption('ACC-OPS-CHEN');
 await page.locator('#customer-assign').getByRole('button',{name:'确认分配',exact:true}).click();
 batch=await page.evaluate(id=>CustomerTasks.reportSnapshot().find(b=>b.id===id),batch.id);check('人工分配保存',batch.rows[0].ownerId==='ACC-OPS-CHEN');
 await page.evaluate(()=>{DemoSwitch.enter('ACC-OPS-CHEN');if(AppState.get().authStage==='TENANT')AppState.chooseTenant('TEN-NISSAN-HQ');if(AppState.get().authStage==='DOMAIN')AppState.chooseDomain('CLOUD_CONTACT_CENTER');else AppState.requestDomainSwitch('CLOUD_CONTACT_CENTER');RouteRuntime.openPrimary('customer-directory')});
 check('运营仅见本人分配客户',await page.evaluate(()=>{let rows=CustomerDirectory.list();return rows.some(r=>r.phone==='13900009871')&&!rows.some(r=>r.phone==='13900009872')}));
 await page.reload();await page.waitForFunction(()=>AppState.isReady());
 check('刷新后归属保留',await page.evaluate(()=>CustomerTasks.mine().some(r=>r.phone==='13900009871')));
 return{checks,errors,batchId:batch.id};
}
