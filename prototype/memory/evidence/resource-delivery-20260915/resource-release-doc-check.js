async page=>{
 const checks=[],errors=[],bad=[]; const base='http://127.0.0.1:8772/Demo_Protype_2/prototype/';
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))bad.push(r.url())});
 const check=(n,v)=>{if(!v)throw Error(n);checks.push(n)};
 for(const [url,words] of [
 ['docs/functional-spec.html#FS-06',['设置使用坐席','enterpriseHotline/listPage']],
 ['docs/interaction.html#J-18',['J-24','号码']],
 ['docs/change-log.html',['D-026','五项变更']],
 ['docs/development.html',['153','290']],
 ['docs/remaining-confirmations.html',['CF-06']],
 ['flowcharts/business-process.html#SC-210',['设置号码使用坐席','D-026']],
 ['flowcharts/sequence-interaction.html#SEQ-210',['一次保存','D-026']]]) {
   const r=await page.goto(base+url);check(url+' loads',r.status()===200);
   const text=await page.locator('body').innerText();for(const w of words)check(url+' contains '+w,text.includes(w));
   if(url.includes('SC-210')){const card=page.locator('#SC-210');await card.scrollIntoViewIfNeeded();check('flow rendered',await card.locator('svg').count()>0);await card.locator('[data-diagram-action="zoom-in"]').click();await card.locator('[data-diagram-action="fit"]').click();await page.screenshot({path:'/private/tmp/resource-release-flow.png'});}
   if(url.includes('SEQ-210')){const card=page.locator('#SEQ-210');await card.scrollIntoViewIfNeeded();check('sequence rendered',await card.locator('svg').count()>0);await card.locator('[data-diagram-action="zoom-in"]').click();await card.locator('[data-diagram-action="fit"]').click();await page.screenshot({path:'/private/tmp/resource-release-sequence.png'});}
 }
 const zip=await page.request.get(base+'downloads/alicti-development-kit.zip');check('download available',zip.status()===200&&(await zip.body()).length>2000000);
 await page.goto(base+'docs/functional-spec.html#FS-06');await page.screenshot({path:'/private/tmp/resource-release-functional.png'});
 check('no page errors',errors.length===0);check('no missing local requests',bad.length===0);
 return{checks,errors,bad};
}
