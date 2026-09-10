/** Online-reference account forms: actual scripts + DOM/storage doubles.
 * This file never modifies prototype files, evidence logs, or workflow state.
 * Passing is local regression evidence, not browser visual acceptance.
 */
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { setup } = require('./fixtures/prototype-vm.cjs');
const { createRunner } = require('./fixtures/test-runner.cjs');
const runner = createRunner();
const TEN = 'TEN-NISSAN-HQ', INSTANCE = 'CCC-NISSAN';
const decode = text => String(text || '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const textOf = html => decode(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
function attribute(tag, name) { return decode(tag.match(new RegExp('\\b' + name + '="([^"]*)"'))?.[1] || ''); }
function radio(f, name, value) { f.queries.set('input[name="' + name + '"]:checked', [{ value }]); }
function hydrate(f, id) {
  const html = f.layers.get(id); assert(html, 'Expected open form: ' + id);
  // Materialize only controls returned by the real form; preserve native IDs,
  // readOnly/disabled, maxlength and default radio selection from its markup.
  for (const [tag] of html.matchAll(/<[A-Za-z][^>]*\bid="[^"]+"[^>]*>/g)) {
    const id = attribute(tag, 'id'), el = f.field(id, attribute(tag, 'value'));
    el.type = attribute(tag, 'type') || 'text'; el.maxLength = Number(attribute(tag, 'maxlength')) || -1;
    el.readOnly = /\sreadonly(?:\s|>|=)/i.test(tag); el.disabled = /\sdisabled(?:\s|>|=)/i.test(tag); el.checked = /\schecked(?:\s|>|=)/i.test(tag);
    el.hidden = /\shidden(?:\s|>|=)/i.test(tag); el.nextElementSibling = f.field('qa-toggle-' + id, ''); el.parentElement = { hidden: false };
    el.nextElementSibling.setAttribute('aria-label', '显示密码'); el.nextElementSibling.setAttribute('aria-pressed', 'false');
    el.oninputSource = attribute(tag, 'oninput');
  }
  for (const [tag] of html.matchAll(/<input\b[^>]*\btype="radio"[^>]*>/g)) {
    if (/\schecked(?:\s|>|=)/i.test(tag)) radio(f, attribute(tag, 'name'), attribute(tag, 'value'));
  }
  return html;
}
function formRows(html) {
  return [...html.matchAll(/<label\b[^>]*class="[^"]*account-form-label[^\"]*"[^>]*>([\s\S]*?)<\/label>/g)]
    .map(match => ({ id: attribute(match[0].split('>')[0], 'for'), label: textOf(match[1]).replace(/[\s*：:?]/g, '') }));
}
function changed(f, id, value) {
  const el = f.field(id, value); assert(el.oninputSource, 'Missing live input handler: ' + id);
  vm.runInContext('(function(){' + el.oninputSource + '}).call(document.getElementById(' + JSON.stringify(id) + '))', f.ctx);
  return el;
}
function openNew(f, tenant = TEN) { f.ctx.AccountTenantForms.openAccount(tenant); return hydrate(f, 'member-add'); }
function openEdit(f, memberId = 'MEM-HQ-OPS') {
  const member = f.d.memberships.find(m => m.membershipId === memberId), account = f.d.accounts.find(a => a.accountId === member.accountId);
  f.ctx.Pages['account-tenant'].editMember(memberId);
  const html = hydrate(f, 'member-edit');
  return { member, account, html };
}
function prepareNew(f, username = 'online-qa-user', mobile = '13712340987') {
  openNew(f);
  f.field('newAccountUsername', username); f.field('newAccountNickname', '线上样式回归'); f.field('newAccountPassword', 'Abc@123456'); f.field('memberMobile', mobile);
  assert.equal(f.ctx.AccountTenantForms.lookup(true), true);
  f.field('explicitCreate', '').checked = true; radio(f, 'memberRole', 'OPERATOR'); radio(f, 'memberStatus', '启用');
}
function rowFor(f, nickname) {
  const html = f.ctx.Pages['account-tenant'].render({ view: 'accounts' });
  const header = html.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] || '';
  const labels = [...header.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map(m => textOf(m[1]));
  const index = labels.findIndex(label => /(?:是否.*开通.*坐席|坐席.*开通|开通.*坐席)/.test(label));
  assert(index >= 0, 'Account table should contain an explicit seat provisioning indicator');
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  const body = rows.find(m => m[1].includes(nickname)); assert(body, 'Missing account row: ' + nickname);
  const cells = [...body[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(m => textOf(m[1]));
  return { flag: cells[index], opened: attribute(body[1].match(/<[^>]*data-seat-opened="[^"]*"[^>]*>/)?.[0] || '', 'data-seat-opened'), html: body[1], labels };
}

(async () => {
  for (const domain of ['AI_OUTBOUND', 'CLOUD_CONTACT_CENTER']) {
    runner.test('新增字段顺序与单列行结构 · ' + domain, () => {
      const f = setup('admin', domain), html = openNew(f), rows = formRows(html);
      assert.deepEqual(rows.slice(0, 8).map(r => r.label), ['所属租户', '头像', '账号', '账号昵称', '手机号码', '登录密码', '角色', '状态']);
      assert.deepEqual(rows.slice(2, 8).map(r => r.id), ['newAccountUsername', 'newAccountNickname', 'memberMobile', 'newAccountPassword', 'memberRole', 'memberStatus']);
      assert.match(html, /account-form-modal-body/); assert.doesNotMatch(html, /class="form-grid"/);
      assert.equal(f.nodes.get('memberTenant').readOnly, true);
    });
    runner.test('编辑与新增相同字段顺序 · ' + domain, () => {
      const f = setup('super', domain), { html } = openEdit(f), rows = formRows(html);
      assert.deepEqual(rows.slice(0, 8).map(r => r.label), ['所属租户', '头像', '账号', '账号昵称', '手机号码', '登录密码', '角色', '状态']);
      assert.deepEqual(rows.slice(2, 8).map(r => r.id), ['editAccountUsername', 'editAccountNickname', 'editAccountMobile', 'editAccountPassword', 'editMemberRole', 'editMemberStatus']);
      assert.match(html, /account-form-modal-body/); assert.doesNotMatch(html, /class="form-grid"/); assert.doesNotMatch(html, /id="editAccountStatus"/);
    });
  }
  runner.test('新增、编辑角色与状态都是原值单选，不再读取旧select', () => {
    for (const edit of [false, true]) {
      const f = setup('super'), html = edit ? openEdit(f).html : openNew(f);
      for (const [name, expected] of [[edit ? 'editMemberRole' : 'memberRole', ['ADMIN', 'OPERATOR']], [edit ? 'editMemberStatus' : 'memberStatus', ['停用', '启用']]]) {
        const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(m => m[0]).filter(tag => attribute(tag, 'name') === name);
        assert.equal(inputs.length, 2); assert(inputs.every(tag => attribute(tag, 'type') === 'radio'));
        assert.deepEqual(inputs.map(tag => attribute(tag, 'value')).sort(), expected.sort());
        assert.equal(inputs.filter(tag => /\schecked(?:\s|>|=)/.test(tag)).length, 1);
        assert(!new RegExp('<select[^>]*id="' + name + '"').test(html));
      }
    }
  });
  runner.test('新增昵称和手机号都有实时计数，手机号计数不破坏复用检查', () => {
    const f = setup(); openNew(f);
    changed(f, 'newAccountNickname', '新的昵称'); assert.equal(f.nodes.get('newAccountNicknameCount')?.textContent, '4 / 20');
    changed(f, 'memberMobile', '13712340987'); assert.equal(f.nodes.get('memberMobileCount')?.textContent, '11 / 11');
    assert.equal(f.ctx.AccountTenantForms.lookup(true), true); assert.equal(f.nodes.get('newAccountConfirmation').hidden, false);
  });
  runner.test('编辑昵称和手机号保留计数及字段最大长度', () => {
    const f = setup('super'); openEdit(f);
    changed(f, 'editAccountNickname', '已改昵称'); assert.equal(f.nodes.get('editAccountNicknameCount')?.textContent, '4 / 20');
    changed(f, 'editAccountMobile', '13712340987'); assert.equal(f.nodes.get('editAccountMobileCount')?.textContent, '11 / 11');
    assert.equal(f.nodes.get('editAccountNickname').maxLength, 20); assert.equal(f.nodes.get('editAccountMobile').maxLength, 11);
  });
  runner.test('新增和编辑密码显隐仅影响显示，不改动输入或账号密码', () => {
    const f = setup('super'); openNew(f);
    const added = f.nodes.get('newAccountPassword'), initial = added.value;
    f.ctx.AccountTenantForms.togglePassword(); assert.equal(added.type, 'text'); assert.equal(added.value, initial); assert.equal(added.nextElementSibling.getAttribute('aria-label'), '隐藏密码'); assert.equal(added.nextElementSibling.getAttribute('aria-pressed'), 'true');
    f.ctx.AccountTenantForms.togglePassword(); assert.equal(added.type, 'password'); assert.equal(added.nextElementSibling.getAttribute('aria-pressed'), 'false');
    const { account } = openEdit(f), saved = account.password, password = f.nodes.get('editAccountPassword');
    const untouched = password.value;
    f.ctx.AccountTenantForms.togglePassword('editAccountPassword'); assert.equal(password.type, 'text'); assert.equal(password.value, untouched); assert.equal(account.password, saved); assert.equal(password.nextElementSibling.getAttribute('aria-label'), '隐藏密码');
    f.ctx.AccountTenantForms.togglePassword('editAccountPassword'); assert.equal(password.type, 'password'); assert.equal(password.nextElementSibling.getAttribute('aria-label'), '显示密码');
  });
  runner.test('未改密码时保存资料，不重置现有密码', () => {
    const f = setup('super'), { account, member } = openEdit(f), password = account.password, globalStatus = account.status;
    changed(f, 'editAccountNickname', '仅修改昵称'); radio(f, 'editMemberRole', member.roleCode); radio(f, 'editMemberStatus', '启用');
    f.ctx.Pages['account-tenant'].saveMemberEdit(); assert.equal(account.nickname, '仅修改昵称'); assert.equal(account.password, password); assert.equal(account.status, globalStatus);
  });
  runner.test('超管显式修改合法密码仍遵循旧密码规则', () => {
    const f = setup('super'), { account } = openEdit(f);
    f.field('editAccountPassword', 'New@123456'); f.ctx.Pages['account-tenant'].saveMemberEdit(); assert.equal(account.password, 'New@123456');
    openEdit(f); const before = account.password; f.field('editAccountPassword', 'weak'); f.ctx.Pages['account-tenant'].saveMemberEdit(); assert.equal(account.password, before);
  });
  runner.test('租户管理员全局字段只读，伪造表单输入也只更新当前租户成员', () => {
    const f = setup(), { account, member, html } = openEdit(f), original = JSON.stringify(account);
    for (const id of ['editAccountUsername', 'editAccountNickname', 'editAccountMobile']) assert.equal(f.nodes.get(id).readOnly || f.nodes.get(id).disabled, true, id);
    assert(/disabled|readonly/.test(html.match(/<input\b[^>]*id="editAccountPassword"[^>]*>/)?.[0] || ''), 'Administrator password field should remain read-only/disabled');
    for (const [id, value] of Object.entries({ editAccountUsername: 'attempt-hijack', editAccountNickname: '非法覆盖', editAccountMobile: '13712340987', editAccountPassword: 'New@123456', editAccountStatus: '停用' })) f.field(id, value);
    radio(f, 'editMemberRole', 'ADMIN'); radio(f, 'editMemberStatus', '停用');
    f.ctx.Pages['account-tenant'].saveMemberEdit(); assert.equal(JSON.stringify(account), original); assert.equal(member.roleCode, 'ADMIN'); assert.equal(member.status, '停用');
  });
  runner.test('成员停用不改变全局账号状态和其他租户成员权限', () => {
    const f = setup('super'), { account, member } = openEdit(f, 'MEM-HQ-ADMIN');
    const other = f.d.memberships.find(m => m.accountId === account.accountId && m.tenantId !== member.tenantId), before = JSON.stringify(other), status = account.status;
    radio(f, 'editMemberStatus', '停用'); f.field('editAccountStatus', '停用'); f.ctx.Pages['account-tenant'].saveMemberEdit();
    assert.equal(member.status, '停用'); assert.equal(account.status, status); assert.equal(JSON.stringify(other), before);
  });
  runner.test('已有手机号仅加入新租户，不新建账号或覆盖原密码资料', () => {
    const f = setup('super'), account = f.d.accounts.find(a => a.accountId === 'ACC-OPS-108'), before = JSON.stringify(account), count = f.d.accounts.length;
    openNew(f, 'TEN-NISSAN-SH'); f.field('memberMobile', account.loginMobile); assert.equal(f.ctx.AccountTenantForms.lookup(true), true);
    assert.equal(f.nodes.get('newAccountUsername').readOnly, true); assert.equal(f.nodes.get('newAccountPassword').value, '');
    assert.equal(f.nodes.get('newAccountPassword').parentElement.hidden, true);
    radio(f, 'memberRole', 'OPERATOR'); radio(f, 'memberStatus', '启用'); f.ctx.AccountTenantForms.saveAccount();
    assert.equal(f.d.accounts.length, count); assert.equal(JSON.stringify(account), before); assert(f.d.memberships.some(m => m.accountId === account.accountId && m.tenantId === 'TEN-NISSAN-SH'));
  });
  runner.test('创建新账号需显式确认，确认后可保存原登录资料与租户角色', () => {
    const f = setup(); prepareNew(f); f.nodes.get('explicitCreate').checked = false; const count = f.d.accounts.length;
    f.ctx.AccountTenantForms.saveAccount(); assert.equal(f.d.accounts.length, count);
    f.nodes.get('explicitCreate').checked = true; f.ctx.AccountTenantForms.saveAccount();
    const created = f.d.accounts.find(a => a.loginUsername === 'online-qa-user'); assert(created); assert.equal(created.password, 'Abc@123456'); assert.equal(created.loginMobile, '13712340987');
    assert.equal(f.d.memberships.find(m => m.accountId === created.accountId).roleCode, 'OPERATOR');
  });
  runner.test('失效登录上下文阻止新增及编辑提交', () => {
    const f = setup(); prepareNew(f); const before = JSON.stringify([f.d.accounts, f.d.memberships]); f.ctx.AppState.logout(false); f.ctx.AccountTenantForms.saveAccount();
    assert.equal(JSON.stringify([f.d.accounts, f.d.memberships]), before);
    const g = setup('super'), { account, member } = openEdit(g); const old = JSON.stringify({ account, member }); g.ctx.AppState.setInstance('CCC-EPI'); g.ctx.Pages['account-tenant'].saveMemberEdit();
    assert.equal(JSON.stringify({ account, member }), old);
  });
  runner.test('运营无新增/编辑入口；过期权限和目标租户迁移阻止提交', () => {
    const f = setup('operator-hq'); f.ctx.AccountTenantForms.openAccount(TEN); f.ctx.Pages['account-tenant'].editMember('MEM-HQ-OPS'); assert(!f.layers.has('member-add')); assert(!f.layers.has('member-edit'));
    for (const cause of ['role', 'target']) {
      const g = setup(), { account, member } = openEdit(g); radio(g, 'editMemberRole', 'ADMIN');
      if (cause === 'role') g.d.memberships.find(m => m.membershipId === 'MEM-HQ-ADMIN').roleCode = 'OPERATOR'; else member.tenantId = 'TEN-NISSAN-SH';
      const before = JSON.stringify({ account, member }); g.ctx.Pages['account-tenant'].saveMemberEdit(); assert.equal(JSON.stringify({ account, member }), before);
    }
  });
  runner.test('坐席开通标识基于当前租户真实关联，停用仍已开通、删除为未开通', () => {
    const f = setup(), account = f.d.accounts.find(a => a.accountId === 'ACC-OPS-CHEN'), seat = f.ctx.AccountSeat.forAccount(account.accountId, TEN, INSTANCE);
    assert.match(rowFor(f, account.nickname || account.name).flag, /已开通/); assert.equal(rowFor(f, account.nickname || account.name).opened, 'true');
    seat.lifecycleStatus = '已停用'; assert.match(rowFor(f, account.nickname || account.name).flag, /已开通/); assert.equal(rowFor(f, account.nickname || account.name).opened, 'true');
    seat.lifecycleStatus = '已删除'; assert.match(rowFor(f, account.nickname || account.name).flag, /未开通/); assert.equal(rowFor(f, account.nickname || account.name).opened, 'false');
  });
  await runner.testAsync('坐席开通失败不算成功；跨租户或跨实例同账号坐席也不算本租户开通', async () => {
    const f = setup(), account = f.d.accounts.find(a => a.accountId === 'ACC-ADMIN-018');
    assert.equal(f.ctx.AccountSeat.forAccount(account.accountId, TEN, INSTANCE), null);
    const result = await f.ctx.AccountSeat.create({ tenantId: TEN, userName: account.name, mobile: account.loginMobile, loginName: 'online-seat-fail', email: '' }, { accountId: account.accountId, requestId: 'ONLINE-FAIL' });
    assert.equal(result.ok, false); assert.match(rowFor(f, account.nickname || account.name).flag, /未开通/); assert.equal(rowFor(f, account.nickname || account.name).opened, 'false');
    const template = f.d.agents[0]; f.d.agents.push({ ...template, agentRecordId: 'OTHER-TEN-SEAT', contactCenterIdentityId: 'OTHER-TEN-SEAT', accountId: account.accountId, tenantId: 'TEN-NISSAN-SH' });
    f.d.agents.push({ ...template, agentRecordId: 'OTHER-BRAND-SEAT', contactCenterIdentityId: 'OTHER-BRAND-SEAT', accountId: account.accountId, instanceId: 'CCC-EPI' });
    assert.match(rowFor(f, account.nickname || account.name).flag, /未开通/);
  });
  runner.report('线上账号新增/编辑表单的DOM与逻辑替身回归；未包含浏览器排版、真实接口或阶段验收。');
})().catch(error => { console.error(error); process.exitCode = 1; });
