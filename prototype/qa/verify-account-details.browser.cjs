async page => {
  // Run only in an isolated local-prototype browser profile. This resets that profile's demo data.
  const currentUrl = page.url();
  if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/.+\/prototype\//.test(currentUrl)) throw Error('Use an isolated local HTTP prototype browser');
  const base = currentUrl.slice(0, currentUrl.indexOf('/prototype/') + 11);
  const output = '/private/tmp/account-details-20260917';
  const checks = [], errors = [], badResponses = [], externalRequests = [], writes = [], screenshots = [];
  const check = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
  const settle = async () => {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForFunction(() => !document.querySelector('.drawer-exit-visual,.legacy-drawer-ghost') && !document.getAnimations().some(animation => animation.playState === 'running' && animation.effect.getTiming().iterations !== Infinity));
  };
  const capture = async name => { await settle(); await page.waitForFunction(() => !document.getElementById('toast-tip') || Number(getComputedStyle(document.getElementById('toast-tip')).opacity) < 0.01); const path = output + '/' + name + '.png'; await page.screenshot({ path, animations: 'disabled' }); screenshots.push(path); };
  const readonly = async (id, label) => {
    const layer = page.locator('#' + id);
    check(label + ' has no editable controls', await layer.locator('input,select,textarea,[contenteditable=true]').count() === 0);
    const actions = await layer.locator('button,a,[role=button]').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label') || node.textContent.trim()));
    const allowedActions = id === 'alicti-account-history' ? ['返回上一页', '关闭', '← 返回', '‹', '›'] : ['返回上一页', '关闭', '← 返回'];
    check(label + ' only return close and readonly pagination', actions.length >= 2 && actions.every(text => allowedActions.includes(text)));
    check(label + ' no management shortcuts', !/新增租户|管理租户|编辑账号|停用账号|启用账号/.test(await layer.innerText()));
  };
  const state = () => page.evaluate(() => {
    const s = AppState.get();
    return JSON.stringify({ scope: [s.accountId, s.tenantId, s.enterpriseId, s.activeDomain, s.roleCode], accounts: AliCtiAccounts.list(), tenants: CloudCallData.tenants, audits: CloudCallData.audits });
  });
  const layout = async label => {
    await settle();
    const bounds = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
      panels: [...document.querySelectorAll('.platform-layer.open .layer-content,.platform-layer.open .layer-dialog,.platform-layer.open > div')].map(node => { const b = node.getBoundingClientRect(); return { left: b.left, right: b.right }; }) }));
    check(label + ' page fits viewport', bounds.scroll <= bounds.width + 2);
    check(label + ' drawer fits viewport', bounds.panels.every(b => b.left >= -2 && b.right <= bounds.width + 2));
  };
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) badResponses.push({ url: response.url(), status: response.status() }); });
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method())) writes.push({ url: request.url(), method: request.method() });
    if (/^https?:/.test(request.url()) && !request.url().startsWith(base)) externalRequests.push(request.url());
  });
  await page.route('**/*', route => /^(data:|blob:)/.test(route.request().url()) || route.request().url().startsWith(base) ? route.continue() : route.abort());
  await page.goto(base + 'index.html?qa=account-details');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#authUsername').fill('super-product');
  await page.locator('#authPassword').fill('123456Aa@');
  await page.locator('#authCaptcha').fill('a8Cq');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  const navigation = page.getByRole('navigation', { name: '统一外呼中台主导航' });
  await navigation.getByRole('button', { name: /系统管理/ }).click();
  await page.locator('[data-route="alicti-accounts"]').click();
  check('account list opens from primary menu', await page.locator('.alicti-accounts-page').isVisible());
  const rows = () => page.locator('.alicti-accounts-page tbody tr');
  const beforeRead = await state();
  await rows().filter({ hasText: '7522240' }).getByRole('button', { name: '查看', exact: true }).click();
  await readonly('alicti-account-detail', 'enabled account detail');
  check('enabled detail shows only the bound headquarters tenant', (await page.locator('#alicti-account-detail').innerText()).includes('东风日产总部') && !(await page.locator('#alicti-account-detail').innerText()).includes('上海华东门店'));
  await layout('1440 enabled detail'); await capture('account-detail-1440');
  await page.setViewportSize({ width: 1366, height: 900 });
  await layout('1366 enabled detail'); await capture('account-detail-1366');
  await page.locator('#alicti-account-detail').getByRole('button', { name: '关闭', exact: true }).last().click();
  await rows().filter({ hasText: '集成验证供应商账号' }).getByRole('button', { name: '查看', exact: true }).click();
  await readonly('alicti-account-detail', 'stopped account detail');
  check('stopped detail shows status and empty association', /停用/.test(await page.locator('#alicti-account-detail').innerText()) && /尚未绑定租户/.test(await page.locator('#alicti-account-detail').innerText()));
  await page.locator('#alicti-account-detail').getByRole('button', { name: '返回上一页', exact: true }).click();
  check('readonly views do not alter data or business scope', await state() === beforeRead);
  await page.locator('#aliAccountKeyword').fill('7522240');
  await page.locator('.ali-account-filter').getByRole('button', { name: '查询', exact: true }).click();
  check('account row displays its single bound tenant without a count action', (await rows().first().innerText()).includes('东风日产总部') && await rows().first().getByRole('button', { name: /^\d+ 个$/ }).count() === 0);
  await rows().first().getByRole('button', { name: '查看', exact: true }).click();
  await readonly('alicti-account-detail', 'single tenant detail');
  check('account detail contains exactly one business tenant', await page.locator('#alicti-account-detail tbody tr').count() === 1);
  await layout('1366 association'); await capture('account-tenants-1366');
  await page.locator('#alicti-account-detail').getByRole('button', { name: '关闭', exact: true }).first().click();
  check('closing detail restores list filter', await page.locator('#aliAccountKeyword').inputValue() === '7522240' && await rows().count() === 1);
  check('association viewing does not switch business scope or write data', await state() === beforeRead);
  await page.locator('.ali-account-filter').getByRole('button', { name: '重置', exact: true }).click();
  await rows().filter({ hasText: 'DEMO-ENT-003' }).getByRole('button', { name: '编辑', exact: true }).click();
  await page.locator('#aliAccount-remark').fill('只读详情回归验证备注');
  await page.locator('#aliAccountSave').click();
  await page.locator('#alicti-account-editor').waitFor({ state: 'detached' });
  check('list edit saves and returns directly to list', await page.locator('#alicti-account-detail').count() === 0 && await page.evaluate(() => AliCtiAccounts.list().find(row => row.enterpriseId === 'DEMO-ENT-003').remark === '只读详情回归验证备注'));
  await rows().filter({ hasText: 'DEMO-ENT-003' }).getByRole('button', { name: '停用', exact: true }).click();
  await page.locator('#aliAccountStatusSave').click();
  await page.locator('#alicti-account-status').waitFor({ state: 'detached' });
  check('list disable remains operable', await page.evaluate(() => AliCtiAccounts.list().find(row => row.enterpriseId === 'DEMO-ENT-003').status === 'STOPPED'));
  await rows().filter({ hasText: 'DEMO-ENT-003' }).getByRole('button', { name: '启用', exact: true }).click();
  await page.waitForFunction(() => AliCtiAccounts.list().find(row => row.enterpriseId === 'DEMO-ENT-003').status === 'RUNNING');
  check('list enable remains operable', true);
  await page.locator('.alicti-accounts-page').getByRole('button', { name: '新增账号', exact: true }).click();
  const createdEnterpriseId = '8970917';
  await page.locator('#aliAccount-name').fill('页面验收新账号');
  await page.locator('#aliAccount-enterpriseId').fill(createdEnterpriseId);
  await page.locator('#aliAccount-brandCustomerName').fill('验收品牌');
  await page.locator('#aliAccountSave').click();
  await page.locator('#alicti-account-editor').waitFor({ state: 'detached' });
  check('new account save returns to list without nested detail', await page.locator('#alicti-account-detail').count() === 0 && await rows().filter({ hasText: createdEnterpriseId }).count() === 1);
  check('new account has no implicit tenant or scope switch', await page.evaluate(id => AppState.get().enterpriseId === '7522240' && !CloudCallData.tenants.some(row => row.enterpriseId === id), createdEnterpriseId));
  check('new account displays an unbound label', (await rows().filter({ hasText: createdEnterpriseId }).innerText()).includes('未绑定'));
  await rows().filter({ hasText: createdEnterpriseId }).getByRole('button', { name: '查看', exact: true }).click();
  await readonly('alicti-account-detail', 'new account empty association');
  check('unbound account has a readonly empty state', (await page.locator('#alicti-account-detail').innerText()).includes('尚未绑定租户'));
  await page.locator('#alicti-account-detail').getByRole('button', { name: '关闭', exact: true }).first().click();
  await navigation.getByRole('button', { name: /账号与租户/ }).click();
  await page.locator('[data-route="tenants"]').click();
  check('tenant management opens as primary page', await page.locator('.tenant-page').isVisible() && await page.locator('.platform-layer.open').count() === 0);
  await page.locator('#tenantKeyword').fill('先前筛选不应隐藏新增');
  await page.locator('.tenant-filter-panel').getByRole('button', { name: '查询', exact: true }).click();
  await page.locator('.tenant-page').getByRole('button', { name: '+ 新建', exact: true }).click();
  check('new account with no tenant is selectable in tenant form', await page.locator('#tenantInstance option[value="' + createdEnterpriseId + '"]').count() === 1);
  check('stopped supplier account unavailable for new association', await page.locator('#tenantInstance option[value="AliCti-TEST"]').count() === 0);
  await page.locator('#tenantName').fill('新账号首个门店');
  await page.locator('input[name="tenantOrg"][value="STORE"]').check();
  await page.locator('#tenantInstance').selectOption(createdEnterpriseId);
  await page.locator('#tenant-detail').getByRole('button', { name: '确定', exact: true }).click();
  await page.locator('#tenant-detail').waitFor({ state: 'detached' });
  check('saved tenant visible in target scope', await page.locator('.tenant-page tbody tr').filter({ hasText: '新账号首个门店' }).count() === 1 && await page.evaluate(id => AppState.get().enterpriseId === id, createdEnterpriseId));
  check('saved tenant clears stale filter', await page.locator('#tenantKeyword').inputValue() === '');
  await layout('1366 saved tenant'); await capture('new-tenant-1366');
  await page.reload();
  await page.locator('.tenant-page').waitFor();
  check('reload retains new account tenant and selected scope', await page.locator('.tenant-page tbody tr').filter({ hasText: '新账号首个门店' }).count() === 1 && await page.evaluate(id => AppState.get().enterpriseId === id && AliCtiAccounts.list().some(row => row.enterpriseId === id), createdEnterpriseId));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await layout('1440 saved tenant'); await capture('new-tenant-1440');
  for (const [index, failedKey] of ['unified-call-context-v3', 'unified-call-demo-preferences-v1'].entries()) {
    const name = '后置故障验证租户' + index;
    const targetAccount = '897092' + index;
    await page.evaluate(async id => {
      const result = await AliCtiAccounts.save({ enterpriseId: id, name: '后置故障空闲账号' + id, credentialConfigured: false, status: 'RUNNING', remark: '' }, { context: AliCtiAccounts.captureContext() });
      if (!result.ok) throw Error(JSON.stringify(result));
    }, targetAccount);
    await page.locator('.tenant-page').getByRole('button', { name: '+ 新建', exact: true }).click();
    await page.locator('#tenantName').fill(name);
    await page.locator('#tenantInstance').selectOption(targetAccount);
    await page.evaluate(key => {
      window.__accountDetailsOriginalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (this === sessionStorage && name === key) throw new DOMException('QA session write failure', 'QuotaExceededError');
        return window.__accountDetailsOriginalSetItem.call(this, name, value);
      };
    }, failedKey);
    await page.locator('#tenant-detail').getByRole('button', { name: '确定', exact: true }).click();
    await page.locator('#tenant-detail').waitFor({ state: 'detached' });
    check(failedKey + ' reports saved destination instead of save failure', (await page.locator('body').innerText()).includes('页面更新未完成，请刷新或切换至该账号查看'));
    check(failedKey + ' header and tenant rows match memory scope', await page.evaluate(() => {
      const names = CloudCallData.tenants.filter(row => row.enterpriseId === AppState.get().enterpriseId).map(row => row.name);
      return document.body.dataset.instance === AppState.get().enterpriseId && [...document.querySelectorAll('.tenant-page tbody tr')].every(row => names.some(name => row.textContent.includes(name)));
    }));
    check(failedKey + ' committed tenant is retained exactly once', await page.evaluate(label => {
      const stored = JSON.parse(sessionStorage.getItem('unified-call-demo-identities-v2'));
      return CloudCallData.tenants.filter(row => row.name === label).length === 1 && stored.tenants.filter(row => row.name === label).length === 1;
    }, name));
    await page.evaluate(() => { Storage.prototype.setItem = window.__accountDetailsOriginalSetItem; delete window.__accountDetailsOriginalSetItem; });
    await page.reload();
    check(failedKey + ' refresh retains committed tenant', await page.evaluate(label => CloudCallData.tenants.filter(row => row.name === label).length === 1, name));
    await page.locator('#instanceSwitcher').selectOption(targetAccount);
    const tenantNav = page.locator('[data-route="tenants"]');
    if (!await tenantNav.isVisible()) await navigation.getByRole('button', { name: /账号与租户/ }).click();
    await tenantNav.click();
    check(failedKey + ' saved tenant remains accessible after recovery', await page.locator('.tenant-page tbody tr').filter({ hasText: name }).count() === 1);
  }
  check('no JavaScript page errors', errors.length === 0);
  check('no local resource errors', badResponses.length === 0);
  check('no supplier or external network requests', externalRequests.length === 0 && writes.length === 0);
  return { result: 'pass', count: checks.length, checks, errors, badResponses, externalRequests, writes, screenshots, base };
}
