async page => {
  const errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));
  const check=(name,ok)=>{checks.push({name,ok});if(!ok)throw Error(name)};
  await page.setViewportSize({width:1440,height:1050});
  await page.goto('http://127.0.0.1:8772/Demo_Protype_2/prototype/reviews/full-regression-20260915.html');
  check('16条问题',await page.locator('.finding-card').count()===16);
  check('无横向溢出',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.getByLabel('按问题类别筛选').selectOption('接口对齐');
  check('9条接口对齐',await page.locator('.finding-card:visible').count()===9);
  await page.getByLabel('按优先级筛选').selectOption('P1');
  check('4条接口P1',await page.locator('.finding-card:visible').count()===4);
  await page.getByLabel('搜索问题').fill('cnos');
  check('字段搜索',await page.locator('.finding-card:visible').count()===1);
  await page.getByRole('button',{name:'展开当前问题',exact:true}).click();
  check('展开匹配项',await page.locator('.finding-card:visible').getAttribute('open')!==null);
  await page.getByLabel('搜索问题').fill('无匹配测试词');
  check('空态提示',await page.locator('#no-results').isVisible());
  await page.getByLabel('搜索问题').fill('');
  await page.getByLabel('按优先级筛选').selectOption('');
  await page.getByLabel('按问题类别筛选').selectOption('');
  await page.getByRole('button',{name:'收起详情',exact:true}).click();
  await page.locator('a[href="#RG-06"]').first().click();
  check('定位并展开',await page.locator('#RG-06').getAttribute('open')!==null);
  check('详情有复现与验收',await page.locator('#RG-06').innerText().then(t=>t.includes('修复后验收')&&t.includes('实际结果')));
  const sources=await page.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.href).filter(u=>u.startsWith(location.origin)&&!u.includes('#')));
  const bad=[];
  for (const url of [...new Set(sources)]) {const r=await page.request.get(url);if(r.status()>=400)bad.push({url,status:r.status()});}
  check('报告链接可用',bad.length===0);
  await page.goto('http://127.0.0.1:8772/Demo_Protype_2/prototype/reviews/full-regression-20260915.html');
  await page.screenshot({path:'/private/tmp/full-regression-report.png',fullPage:false});
  check('无页面错误',errors.length===0);
  return {checks,errors,bad,localLinksChecked:new Set(sources).size,screenshot:'/private/tmp/full-regression-report.png'};
}
