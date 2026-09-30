async page => {
 const checks=[],errors=[],bad=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()})});
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 await page.setViewportSize({width:1440,height:1050});
 await page.goto('http://127.0.0.1:8772/Demo_Protype_2/prototype/reviews/regression-fixes-20260915.html');
 check('17 项逐项修复与验证证据可见',await page.locator('#findings details').count()===17);
 check('页面说明改动范围与验证限制',await page.locator('main').innerText().then(t=>t.includes('未提交GitLab')&&t.includes('未进行真实供应商')));
 await page.getByRole('textbox',{name:'搜索修复项'}).fill('RG-04');
 check('可按问题编号定位',await page.locator('#findings details:visible').count()===1);
 await page.getByRole('button',{name:'展开全部',exact:true}).click();
 check('能展开修复说明和验收',await page.locator('#RG-04').getAttribute('open')!==null&&await page.locator('#RG-04 .body').isVisible());
 await page.getByRole('textbox',{name:'搜索修复项'}).fill('没有这条问题');
 check('无匹配时计数准确',await page.locator('#count').innerText()==='0 / 17 项');
 await page.getByRole('textbox',{name:'搜索修复项'}).fill('');
 await page.getByRole('button',{name:'收起全部',exact:true}).click();
 check('收起后可扫描全部问题',await page.locator('#findings details[open]').count()===0);
 check('桌面无横向溢出',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/regression-fixes-20260915/report-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 check('窄屏无页面横向溢出',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto('http://127.0.0.1:8772/Demo_Protype_2/prototype/reviews/regression-fixes-20260915.html#RG-05');
 check('锚点直接展开目标',await page.locator('#RG-05').getAttribute('open')!==null);
 check('无页面错误或失败资源',errors.length===0&&bad.length===0);
 return {result:'pass',count:checks.length,checks,errors,bad};
}
