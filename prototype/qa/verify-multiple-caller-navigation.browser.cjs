async page => {
  // Run in a fresh, isolated browser profile against the local static prototype.
  const base = page.url().split('index.html')[0];
  if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/.+\/prototype\/$/.test(base)) throw Error('Local prototype required');
  const checks = [], errors = [], badResponses = [], externalRequests = [], screenshots = [];
  const check = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) badResponses.push(response.url()); });
  await page.route('**/*', route => {
    const url = route.request().url();
    if (/^https?:/.test(url) && !url.startsWith(base)) { externalRequests.push(url); return route.abort(); }
    return route.continue();
  });
  page.setDefaultTimeout(12000);
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#authUsername').fill('super-product');
  await page.locator('#authPassword').fill('123456Aa@');
  await page.locator('#authCaptcha').fill('a8Cq');
  await page.getByRole('button',{name:'登录',exact:true}).click();
  const wizard = () => page.locator('.cloud-task-workspace');
  const next = () => wizard().getByRole('button',{name:/^下一步：/}).click();
  const task = name => page.evaluate(name => {
    const row=CloudCallData.tasks.find(row=>row.name===name);
    return row ? JSON.parse(JSON.stringify(row)) : null;
  },name);
  const choosePools = async () => {
    if (!await page.locator('#wizardCallerPools').evaluate(el=>el.open)) await page.locator('#wizardCallerPools > summary').click();
    await page.getByRole('button',{name:'添加号码池',exact:true}).click();
    const options=await page.getByLabel('号码池 1 名称',{exact:true}).locator('option').evaluateAll(nodes=>nodes.filter(n=>n.value).map(n=>({id:n.value,name:n.textContent})));
    check('当前租户提供多个可选号码池',options.length>=2);
    await page.getByLabel('号码池 1 名称',{exact:true}).selectOption(options[0].id);
    await page.getByLabel('号码池 1 优先级',{exact:true}).fill('1');
    await page.getByRole('button',{name:'添加号码池',exact:true}).click();
    await page.getByLabel('号码池 2 名称',{exact:true}).selectOption(options[1].id);
    return options.slice(0,2);
  };
  for (const [type,route,group,label,newGroup] of [
    ['预外呼','predictive-tasks','DEMO-HQ-SERVICE-NAV','总部售后外显','DEMO-HQ-DEFAULT-NAV'],
    ['自动外呼','ivr-tasks','DEMO-HQ-DEFAULT-NAV','总部销售外显','DEMO-HQ-SERVICE-NAV']
  ]) {
    const name='导航回归·'+type;
    await page.goto(base+'index.html?qa=multiple-navigation#'+route);
    await page.getByRole('button',{name:'+ 新建任务',exact:true}).click();
    await page.locator('#wizardName').fill(name);
    if(type==='自动外呼') {
      const ivr=await page.locator('#wizard-providerIvrId option').evaluateAll(nodes=>nodes.find(n=>n.value)?.value);
      check('自动外呼提供语音流程',!!ivr);
      await page.locator('#wizard-providerIvrId').selectOption(ivr);
    }
    await next();
    if(type==='预外呼') await page.locator('[name="wizard-agent-cno"]').first().check();
    check(type+'新建导航无默认选择',await page.locator('#wizardCallerNavigation').inputValue()==='');
    check(type+'同账号两个导航均可选择',await page.locator('#wizardCallerNavigation option').count()===3);
    await next();
    check(type+'未选择导航阻断下一步',await page.locator('#wizardCallerNavigation').isVisible() && (await wizard().innerText()).includes('请选择本任务使用的外显导航'));
    await page.locator('#wizardCallerNavigation').selectOption(group);
    const pools=await choosePools();
    await next();await next();
    const review=await wizard().innerText();
    check(type+'确认页展示所选导航与两个号码池',review.includes(label)&&pools.every(pool=>review.includes(pool.name)));
    await page.getByRole('button',{name:'确认创建任务',exact:true}).click();
    await wizard().waitFor({state:'hidden'});
    const created=await task(name);
    check(type+'请求为单个导航和两个号码池',created?.alictiCreateDraft.fields.customerClidsGroup===group&&created.alictiCreateDraft.fields.clidPoolList.length===2);
    check(type+'可选优先级留空时不传',created.alictiCreateDraft.fields.clidPoolList[0].priority===1&&!Object.hasOwn(created.alictiCreateDraft.fields.clidPoolList[1],'priority'));
    await page.locator('.cloud-task-list-shell tbody tr').filter({hasText:name}).getByRole('button',{name:'查看与管理',exact:true}).click();
    await page.getByRole('button',{name:'任务设置',exact:true}).click();
    check(type+'任务设置展示所选导航', (await page.locator('.task-settings').innerText()).includes(label));
    await page.getByRole('button',{name:'编辑任务',exact:true}).click();
    check(type+'编辑回填导航与两个池',await page.locator('#wizardCallerNavigation').inputValue()===group&&await page.locator('.wizard-pool-row').count()===2);
    await page.locator('#wizardCallerNavigation').selectOption(newGroup);
    check(type+'切换导航清空原号码池',await page.locator('.wizard-pool-row').count()===0);
    await choosePools();
    await page.getByRole('button',{name:'提交修改',exact:true}).click();
    await wizard().waitFor({state:'hidden'});
    const edited=await task(name);
    check(type+'更新原任务而不新建',edited.taskId===created.taskId&&edited.alictiUpdateDraft.endpoint==='task/update'&&edited.alictiUpdateDraft.fields.customerClidsGroup===newGroup);
    check(type+'更新后回查任务',edited.alictiUpdateTrace.map(row=>row.endpoint).join(',')==='task/get,task/update,task/get');
    await page.goto(base+'index.html?qa=multiple-navigation#'+route);
    const restored=await task(name);
    check(type+'刷新保留所选导航与多池',restored?.customerClidsGroup===newGroup&&restored.clidPoolList.length===2);
    await page.locator('.cloud-task-list-shell tbody tr').filter({hasText:name}).getByRole('button',{name:'查看与管理',exact:true}).click();
    await page.getByRole('button',{name:'任务设置',exact:true}).click();
    const path='/private/tmp/alicti-navigation-'+route+'.png';
    await page.screenshot({path,animations:'disabled'});screenshots.push(path);
    check(type+'页面没有整体横向溢出',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  }
  check('无页面脚本错误',errors.length===0);
  check('无资源加载失败',badResponses.length===0);
  check('不调用外部服务',externalRequests.length===0);
  return {result:'pass',count:checks.length,checks,errors,badResponses,externalRequests,screenshots};
}
