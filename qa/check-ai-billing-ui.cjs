/** AI billing UI contracts using real pages, store, service and auth.
 * DOM, locks and storage are VM doubles; these checks are not browser evidence.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { setup, root } = require('./fixtures/prototype-vm.cjs');
const HQ = 'TEN-NISSAN-HQ', SH = 'TEN-NISSAN-SH';
const NOW = Date.UTC(2026, 8, 10, 2, 30, 40);
const results = [];
const copy = value => JSON.parse(JSON.stringify(value));
const decode = text => String(text).replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function fixture(role = 'super', domain = 'AI_OUTBOUND') {
  const f = setup(role, domain);
  f.ctx.Date = class extends Date { static now() { return NOW; } };
  for (const [name, file] of [
    ['AiBillingMock', 'mock/ai-billing.js'], ['RechargeService', 'js/components/recharge-service.js'],
    ['AiBillingStore', 'js/components/ai-billing-store.js'], ['TenantBilling', 'js/pages/tenant-billing.js']
  ]) if (!f.ctx[name]) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), f.ctx, { filename: file });
  const nodeGroups = new Map(), baseOpen = f.ctx.PlatformUI.openLayer, baseClose = f.ctx.PlatformUI.closeLayer;
  function field(id, initial = '') {
    const node = f.nodes.get(id) || f.field(id, '');
    if (!node._nativeStringValue) {
      let current = String(node.value ?? '');
      Object.defineProperty(node, 'value', { configurable: true, get: () => current, set: v => { current = String(v); } });
      node._nativeStringValue = true;
    }
    node.value = initial; return node;
  }
  function removeNodes(id) {
    for (const nodeId of nodeGroups.get(id) || []) f.nodes.delete(nodeId);
    nodeGroups.delete(id);
    if (id === 'ai-billing-form') f.queries.set('#ai-billing-form .layer-body input, #ai-billing-form .layer-body select, #ai-billing-form .layer-body textarea', []);
  }
  f.ctx.PlatformUI.closeLayer = id => { removeNodes(id); baseClose(id); };
  f.ctx.PlatformUI.openLayer = (id, html) => {
    removeNodes(id); baseOpen(id, html);
    const group = [], controls = [];
    for (const match of html.matchAll(/<(input|textarea|select|div|button|span|label)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
      const [, tag, nodeId] = match, node = field(nodeId, decode(match[0].match(/\bvalue="([^"]*)"/)?.[1] || ''));
      node.disabled = /\sdisabled(?:\s|=|>)/.test(match[0]);
      node.hidden = /\shidden(?:\s|=|>)/.test(match[0]);
      node.checked = /\schecked(?:\s|=|>)/.test(match[0]);
      if (tag === 'select') {
        const tail = html.slice(match.index + match[0].length).split('</select>')[0];
        const options = [...tail.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)];
        const option = options.find(item => /\bselected\b/.test(item[1])) || options[0];
        node.value = option ? decode(option[1].match(/\bvalue="([^"]*)"/)?.[1] ?? option[2]) : '';
      }
      if (['input', 'textarea', 'select'].includes(tag)) controls.push(node);
      group.push(nodeId);
    }
    nodeGroups.set(id, group);
    if (id === 'ai-billing-form') {
      f.queries.set('#ai-billing-form .layer-body input, #ai-billing-form .layer-body select, #ai-billing-form .layer-body textarea', controls);
      f.queries.set('#ai-billing-form input, #ai-billing-form select, #ai-billing-form textarea', controls);
    }
  };
  f.ui = f.ctx.TenantBilling; f.store = f.ctx.AiBillingStore; f.service = f.ctx.RechargeService;
  f.store.prepare(); f.calls = []; f.recoveries = [];
  const rawCommit = f.store.commit, rawReconcile = f.store.reconcile;
  f.store.commit = (kind, request) => { f.calls.push({ kind, request: copy(request) }); return rawCommit(kind, request); };
  f.store.reconcile = key => { f.recoveries.push(key); return rawReconcile(key); };
  f.input = (id, v) => { field(id, v); f.ui.changed(id); };
  f.node = id => f.nodes.get(id);
  f.openPack = (id = HQ) => { f.ui.open(id); f.ui.openForm('recharge', 'call_credit_pack'); };
  f.openAdjustment = (id = HQ) => { f.ui.open(id); f.ui.openForm('adjustment'); };
  return f;
}
function holdNextResponse(f, method = 'commit') {
  const original = f.store[method];
  let release, beganResolve;
  const began = new Promise(resolve => { beganResolve = resolve; });
  f.store[method] = (...args) => {
    f.store[method] = original;
    return original(...args).then(result => new Promise(resolve => { release = () => resolve(result); beganResolve(result); }));
  };
  return { began, release: () => release() };
}
async function check(name, run) {
  try { await run(); results.push({ name, pass: true }); console.log('PASS ' + name); }
  catch (error) { results.push({ name, pass: false }); console.error('FAIL ' + name + '\n' + error.stack); }
}

(async () => {
  await check('recharge uses two confirmations and editing after preview requires a new preview', async () => {
    const f = fixture(); f.openPack();
    await f.ui.submit(); assert.equal(f.calls.length, 0); assert.equal(f.node('billingPreview').hidden, false);
    assert.match(f.node('billingSubmit').textContent, /确认充值/);
    f.input('billingMinutes', 4000); f.input('billingReason', '本地自定义分钟');
    assert.equal(f.node('billingPreview').hidden, true);
    await f.ui.submit(); assert.equal(f.calls.length, 0);
    await f.ui.submit(); assert.equal(f.calls.length, 1); assert.equal(f.store.summary(HQ).availableMinutes, 12200);
    assert.equal(f.store.records(HQ, 'recharge').length, 1); assert.equal(f.layers.has('ai-billing-form'), false);
  });
  await check('empty/nonpositive/noninteger pack quantity is rejected rather than silently treated as one', async () => {
    for (const quantity of ['', '0', '-1', '1.5']) {
      const f = fixture(); f.openPack(); f.input('billingQuantity', quantity); await f.ui.submit();
      assert.equal(f.calls.length, 0); assert.match(f.node('billingError').textContent, /数量.*正整数/);
      assert.equal(f.node('billingPreview').hidden, true); assert.equal(f.store.records(HQ).length, 0);
    }
  });
  await check('quantity updates total price/minutes until each value is manually edited', async () => {
    const f = fixture(); f.openPack(); f.input('billingQuantity', 3);
    assert.equal(f.node('billingPrice').value, '3000'); assert.equal(f.node('billingMinutes').value, '10500');
    f.input('billingPrice', '1600.50'); f.input('billingMinutes', '9000'); f.input('billingQuantity', 4);
    assert.equal(f.node('billingPrice').value, '1600.50'); assert.equal(f.node('billingMinutes').value, '9000');
    await f.ui.submit(); assert.match(f.node('billingError').textContent, /原因/);
    f.input('billingReason', '按已确认的演示合同填写'); await f.ui.submit(); await f.ui.submit();
    const r = f.store.records(HQ, 'recharge')[0];
    assert.equal(r.quantity, 4); assert.equal(r.price, 1600.5); assert.equal(r.actualCreditMinutes, 9000);
  });
  await check('service edited end survives a later start change and preview shows actual minute-precision interval', async () => {
    const f = fixture(), row = { tenantId: 'QA-UI-NEW', name: '新服务测试', instanceId: 'CCC-NISSAN', capabilitySet: ['AI_OUTBOUND'], commercialFlag: 'commercial', status: '启用' };
    f.d.tenants.push(row); f.store.initTenant(row); f.ui.open(row.tenantId); f.ui.openForm('recharge', 'standard_annual');
    f.input('billingEnd', '2027-01-19T17:45'); f.input('billingStart', '2026-09-11T09:15');
    assert.equal(f.node('billingEnd').value, '2027-01-19T17:45');
    f.input('billingReason', '本地自定义服务区间'); await f.ui.submit();
    assert.match(f.node('billingPreview').innerHTML, /2027-01-19 17:45/); assert.match(f.node('billingPreview').innerHTML, /待生效/);
    await f.ui.submit(); assert.equal(f.store.summary(row).status, 'pending'); assert.equal(f.store.summary(row).availableMinutes, 10000);
  });
  await check('adjustment has two confirmations and duration zero preserves minute balances and correct ledger display', async () => {
    const f = fixture(); f.openAdjustment();
    f.node('billingDirection').value = 'decrease'; f.node('billingTarget').value = 'duration_days'; f.ui.adjustmentChanged();
    assert.equal(f.node('billingClearRow').hidden, false);
    f.node('billingClear').checked = true; f.ui.adjustmentChanged(); assert.equal(f.node('billingValue').disabled, true);
    f.input('billingReason', '本地模拟归零'); await f.ui.submit(); assert.equal(f.calls.length, 0);
    assert.match(f.node('billingPreview').innerHTML, /365 天.*0 分钟/);
    await f.ui.submit(); const summary = f.store.summary(HQ);
    assert.equal(summary.status, 'expired'); assert.equal(summary.availableMinutes, 8200); assert.equal(summary.frozenMinutes, 400);
    assert.match(f.layers.get('tenant-billing'), /全部调减至0/); assert.match(f.layers.get('tenant-billing'), /365 天.*0 分钟/);
  });
  await check('explicit failure writes nothing, retains inputs, and retries the same business key only once', async () => {
    const f = fixture(); f.openPack(); f.node('billingDemo').value = 'failed';
    await f.ui.submit(); await f.ui.submit();
    assert.equal(f.store.records(HQ).length, 0); assert.equal(f.store.summary(HQ).availableMinutes, 8200);
    assert.equal(f.node('billingMinutes').value, '3500'); assert.match(f.node('billingError').textContent, /失败/);
    await f.ui.submit(); if (f.calls.length === 1) await f.ui.submit();
    assert.equal(f.calls.length, 2); assert.equal(f.calls[0].request.businessKey, f.calls[1].request.businessKey);
    assert.equal(f.store.records(HQ).length, 1); assert.equal(f.store.summary(HQ).availableMinutes, 11700);
  });
  await check('unknown recharge freezes inputs and recovers the same durable result without another credit', async () => {
    const f = fixture(); f.openPack(); f.node('billingDemo').value = 'unknown';
    await f.ui.submit(); await f.ui.submit();
    assert.equal(f.calls.length, 1); assert.equal(f.store.records(HQ).length, 1); assert.equal(f.node('billingPrice').disabled, true);
    assert.match(f.node('billingSubmit').textContent, /核对提交结果/);
    f.ctx.MockRechargeIteration.demoStates.lookupUnavailable = true; await f.ui.submit();
    assert.equal(f.calls.length, 1); assert.match(f.node('billingError').textContent, /待核对/);
    f.ctx.MockRechargeIteration.demoStates.lookupUnavailable = false; await f.ui.submit();
    assert.equal(f.calls.length, 1); assert.equal(f.recoveries.length, 2); assert.equal(new Set(f.recoveries).size, 1);
    assert.equal(f.store.summary(HQ).availableMinutes, 11700); assert.equal(f.layers.has('ai-billing-form'), false);
  });
  await check('closing unknown form and reopening restores the outstanding operation instead of creating a second recharge', async () => {
    const f = fixture(); f.openPack(); f.node('billingDemo').value = 'unknown'; await f.ui.submit(); await f.ui.submit();
    f.ui.close(); f.ui.open(HQ); assert.match(f.layers.get('tenant-billing'), /上次提交结果待核对/);
    await f.ui.recover(); assert.equal(f.store.records(HQ).length, 1); assert.equal(f.store.summary(HQ).availableMinutes, 11700);
    assert.equal(f.calls.length, 1); assert.doesNotMatch(f.layers.get('tenant-billing'), /上次提交结果待核对/);
  });
  await check('old recharge response cannot close or report success inside a newly opened tenant form', async () => {
    const f = fixture(); f.openPack(); await f.ui.submit(); const hold = holdNextResponse(f), submission = f.ui.submit();
    await hold.began; f.ctx.PlatformUI.closeLayer('ai-billing-form'); f.ui.open(SH); f.ui.openForm('recharge', 'call_credit_pack');
    const nextHtml = f.layers.get('ai-billing-form'), toastCount = f.messages.length;
    hold.release(); await submission;
    assert.equal(f.layers.get('ai-billing-form'), nextHtml); assert.equal(f.messages.length, toastCount);
    assert.equal(f.store.records(HQ).length, 1); assert.equal(f.store.records(SH).length, 0);
  });
  await check('old recovery response cannot close a newer tenant form', async () => {
    const f = fixture(); f.openPack(); f.node('billingDemo').value = 'unknown'; await f.ui.submit(); await f.ui.submit();
    const hold = holdNextResponse(f, 'reconcile'), recovery = f.ui.recover(); await hold.began;
    f.ctx.PlatformUI.closeLayer('ai-billing-form'); f.ui.open(SH); f.ui.openForm('recharge', 'call_credit_pack');
    const nextHtml = f.layers.get('ai-billing-form'); hold.release(); await recovery;
    assert.equal(f.layers.get('ai-billing-form'), nextHtml); assert.equal(f.store.records(SH).length, 0);
  });
  await check('inputs changed while awaiting a failed write cannot bypass renewed confirmation', async () => {
    const f = fixture(); f.openPack(); f.node('billingDemo').value = 'failed'; await f.ui.submit();
    const hold = holdNextResponse(f), submission = f.ui.submit(); await hold.began;
    const editable = !f.node('billingMinutes').disabled;
    if (editable) { f.input('billingMinutes', 9000); f.input('billingReason', '等待时修改输入'); }
    hold.release(); await submission;
    const before = f.calls.length; await f.ui.submit();
    if (editable) assert.equal(f.calls.length, before, 'Changed pending input must be previewed again before writing');
    else if (f.calls.length > before) assert.equal(f.calls.at(-1).request.actualCreditMinutes, 3500);
  });
  await check('identity/instance changes invalidate an open confirmation and cloud domain has no billing fields or entry', async () => {
    const f = fixture(); f.openPack(); await f.ui.submit(); f.ctx.AppState.setInstance('CCC-EPI'); await f.ui.submit();
    assert.equal(f.calls.length, 0); assert.equal(f.layers.has('ai-billing-form'), false);
    const cloud = fixture('super', 'CLOUD_CONTACT_CENTER');
    const html = cloud.ctx.Pages['account-tenant'].render({ view: 'tenants' });
    assert.doesNotMatch(html, /充值管理|可用分钟|服务区间|服务状态|商用\/试用/);
    cloud.ui.open(HQ); assert.equal(cloud.layers.has('tenant-billing'), false); assert.equal(cloud.ctx.Pages.home.showUsage(), false);
    for (const role of ['admin', 'operator-hq']) { const ordinary = fixture(role); ordinary.ui.open(HQ); assert.equal(ordinary.layers.has('tenant-billing'), false); }
  });
  await check('tenant list does not display zero minutes when the ledger is unreadable', () => {
    const f = fixture(); f.local.set(f.store.storageKey, '{unreadable ledger');
    const html = f.ctx.Pages['account-tenant'].render({ view: 'tenants' });
    assert.doesNotMatch(html, />0 分钟</, 'An unavailable balance must not be represented as a known zero');
    assert.match(html, /暂不可用|读取失败|待核对|无法读取/);
    f.ctx.Pages.home.showUsage(); assert.match(f.layers.get('home-ai-usage'), /暂不可用/);
  });
  const failed = results.filter(item => !item.pass);
  console.log(`\n${results.length - failed.length}/${results.length} AI billing UI VM checks passed; browser verification is separate.`);
  if (failed.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
