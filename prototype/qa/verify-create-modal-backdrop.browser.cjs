async page => {
  // Run from an isolated local HTTP profile; this test clears that profile's demo session.
  const currentUrl = page.url();
  if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/.+\/prototype\//.test(currentUrl)) {
    throw Error('Use an isolated local HTTP prototype browser');
  }
  const base = currentUrl.slice(0, currentUrl.indexOf('/prototype/') + 11);
  const checks = [], errors = [], failedResources = [];
  const check = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
  const backdrop = id => page.locator('#' + id + ' .layer-backdrop').click({ position: { x: 15, y: 15 } });
  const editor = page.locator('#business-configuration-editor');
  const confirmation = page.locator('#unsaved-layer-discard-confirm');

  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(base) && response.status() >= 400) {
      failedResources.push({ url: response.url(), status: response.status() });
    }
  });
  await page.goto(base + 'index.html?qa=create-modal-backdrop');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#authUsername').fill('super-product');
  await page.locator('#authPassword').fill('123456Aa@');
  await page.locator('#authCaptcha').fill('a8Cq');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.getByRole('button', { name: /云 云联络中心/ }).click();
  await page.evaluate(() => RouteRuntime.openPrimary('business-categories'));
  check('business category list opened', await page.locator('.business-categories-page').isVisible());

  const openCategory = () => page.locator('.business-categories-page').getByRole('button', { name: '新增业务分类', exact: true }).click();
  const categoryName = editor.locator('.business-category-settings input').first();
  await openCategory();
  check('blank create form starts empty', await categoryName.inputValue() === '');
  await backdrop('business-configuration-editor');
  check('blank form closes without confirmation', await editor.count() === 0 && await confirmation.count() === 0);

  await openCategory();
  await categoryName.fill('遮罩保护回归业务');
  await backdrop('business-configuration-editor');
  check('filled form remains behind confirmation', await editor.count() === 1 && await confirmation.isVisible());
  check('confirmation offers both choices', await confirmation.getByRole('button', { name: '继续填写', exact: true }).count() === 1 && await confirmation.getByRole('button', { name: '放弃填写并关闭', exact: true }).count() === 1);
  await confirmation.getByRole('button', { name: '继续填写', exact: true }).click();
  check('continue preserves input and editor', await confirmation.count() === 0 && await editor.count() === 1 && await categoryName.inputValue() === '遮罩保护回归业务');

  await backdrop('business-configuration-editor');
  await confirmation.getByRole('button', { name: '放弃填写并关闭', exact: true }).click();
  check('discard closes the original editor', await confirmation.count() === 0 && await editor.count() === 0);
  await openCategory();
  check('discarded value does not reappear', await categoryName.inputValue() === '');
  await backdrop('business-configuration-editor');

  await openCategory();
  await categoryName.fill('父分类草稿');
  await editor.getByRole('button', { name: '＋ 新建字段', exact: true }).click();
  check('related field opens', await editor.getByRole('heading', { name: '新增自定义字段', exact: true }).count() === 1);
  await editor.getByRole('button', { name: '返回上一步', exact: true }).click();
  check('returning from blank field restores parent input', await categoryName.inputValue() === '父分类草稿');
  await backdrop('business-configuration-editor');
  check('parent category still asks before discard', await editor.count() === 1 && await confirmation.isVisible());
  await confirmation.getByRole('button', { name: '放弃填写并关闭', exact: true }).click();
  check('discard after related editor closes parent', await editor.count() === 0);

  await page.getByRole('tab', { name: '自定义字段', exact: true }).click();
  await page.locator('.business-categories-page').getByRole('button', { name: '新增自定义字段', exact: true }).click();
  await editor.locator('.business-category-settings input').first().fill('重绘后仍需保护');
  await editor.locator('.business-category-settings select').first().selectOption('select');
  check('dynamic redraw preserves entered field name', await editor.locator('.business-category-settings input').first().inputValue() === '重绘后仍需保护');
  await backdrop('business-configuration-editor');
  check('dynamic redraw still asks before discard', await editor.count() === 1 && await confirmation.isVisible());
  await confirmation.getByRole('button', { name: '放弃填写并关闭', exact: true }).click();
  check('dynamic redraw discard closes editor', await editor.count() === 0);

  await page.evaluate(() => RouteRuntime.openPrimary('alicti-accounts'));
  check('AliCti account list opened', await page.locator('.alicti-accounts-page').isVisible());
  await page.locator('.alicti-accounts-page').getByRole('button', { name: '新增账号', exact: true }).click();
  await page.locator('#aliAccount-name').fill('已有保护回归账号');
  await backdrop('alicti-account-editor');
  check('existing account guard handles backdrop once', await page.locator('#alicti-account-editor').count() === 1 && await page.locator('#alicti-account-discard').isVisible() && await confirmation.count() === 0);
  await page.locator('#alicti-account-discard').getByRole('button', { name: '继续编辑', exact: true }).click();
  check('existing guard continue preserves input', await page.locator('#aliAccount-name').inputValue() === '已有保护回归账号');
  await backdrop('alicti-account-editor');
  await page.locator('#alicti-account-discard').getByRole('button', { name: '放弃修改', exact: true }).click();
  check('existing guard discard closes editor', await page.locator('#alicti-account-editor').count() === 0 && await page.locator('#alicti-account-discard').count() === 0);

  await page.evaluate(() => RouteRuntime.openPrimary('agent-maintenance'));
  await page.locator('.agent-page').getByRole('button', { name: '新增坐席', exact: true }).click();
  check('ordinary create dialog opens', await page.locator('#agent-single').isVisible());
  await page.locator('#newAgentName').fill('误触遮罩测试坐席');
  await backdrop('agent-single');
  check('ordinary create dialog asks before discard', await page.locator('#agent-single').count() === 1 && await confirmation.isVisible());
  await confirmation.getByRole('button', { name: '放弃填写并关闭', exact: true }).click();
  check('ordinary create dialog really closes', await page.locator('#agent-single').count() === 0 && await confirmation.count() === 0);

  await page.evaluate(() => AppState.logout(false));
  await page.locator('#authUsername').fill('nissan-admin');
  await page.locator('#authPassword').fill('Abc@123456');
  await page.locator('#authCaptcha').fill('a8Cq');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.locator('.auth-choice-row').filter({ hasText: '东风日产总部' }).click();
  await page.getByRole('button', { name: /云 云联络中心/ }).click();
  await page.evaluate(() => RouteRuntime.openPrimary('outbound-group-management'));
  check('outbound group list opened', await page.locator('.outbound-group-page').isVisible());
  const openGroup = () => page.locator('.outbound-group-page').getByRole('button', { name: '新增外呼组', exact: true }).click();
  const groupNumber = page.locator('#outbound-group-edit #obg-gno');
  await openGroup();
  check('generated group number is populated', (await groupNumber.inputValue()).length > 0);
  await backdrop('outbound-group-edit');
  check('untouched generated number closes normally', await page.locator('#outbound-group-edit').count() === 0 && await confirmation.count() === 0);
  await openGroup();
  const originalNumber = await groupNumber.inputValue();
  for (let attempt = 0; attempt < 5 && await groupNumber.inputValue() === originalNumber; attempt++) {
    await page.locator('#outbound-group-edit').getByRole('button', { name: '随机生成', exact: true }).click();
  }
  check('random generation changes group number', await groupNumber.inputValue() !== originalNumber);
  await backdrop('outbound-group-edit');
  check('programmatic random number change asks before discard', await page.locator('#outbound-group-edit').count() === 1 && await confirmation.isVisible());
  await confirmation.getByRole('button', { name: '放弃填写并关闭', exact: true }).click();
  check('group form really closes after discard', await page.locator('#outbound-group-edit').count() === 0 && await confirmation.count() === 0);

  check('no page errors', errors.length === 0);
  check('no failed local resources', failedResources.length === 0);
  return { result: 'pass', count: checks.length, checks, errors, failedResources };
}
