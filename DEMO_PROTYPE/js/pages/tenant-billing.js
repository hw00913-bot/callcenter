/* 最新智能外呼套餐交互；当前平台身份/品牌/业务域由 AiBillingStore 重新核验。 */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape;
  let tenantId = '', context = '', tab = 'recharge', form = null;
  const S = () => RechargeService;
  const num = n => Number(n || 0).toLocaleString('zh-CN');
  const money = n => '¥' + Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const value = id => (document.getElementById(id)?.value || '').trim();
  const button = (label, action, primary, disabled) => `<button type="button" class="btn${primary ? ' btn-primary' : ''}" onclick="TenantBilling.${action}"${disabled ? ' disabled' : ''}>${label}</button>`;
  function key() { return AiBillingStore.contextKey(); }
  function allowed(id) {
    AiBillingStore.prepare();
    return AppState.get().activeDomain === 'AI_OUTBOUND' && AppState.canAction('ai.billing.manage') && S().mayManage(id);
  }
  function guard() {
    if (context !== key() || !allowed(tenantId)) {
      closeForm(); ui.closeLayer('tenant-billing');
      showToast('工作范围或权限已变化，请重新进入充值管理', 'warning'); return false;
    }
    return true;
  }
  function open(id) {
    if (!allowed(id)) return showToast('仅超级管理员可在智能外呼中管理当前品牌租户的充值', 'warning');
    closeForm(); tenantId = id; context = key(); tab = 'recharge'; draw();
  }
  function recordTable() {
    const rows = AiBillingStore.records(tenantId, tab);
    const common = [
      { key: 'operatorUsername', label: '操作账号', render: (_, r) => esc(S().operatorText(r)) },
      { key: 'operatedAt', label: '操作时间' },
      { key: 'reason', label: '原因', render: v => esc(v || '—') }
    ];
    const cols = tab === 'recharge' ? [
      { key: 'internalNo', label: '内部流水号' }, { key: 'productName', label: '充值类型' },
      { key: 'quantity', label: '数量' }, { key: 'price', label: '本次总价', render: money },
      { key: 'actualStartAt', label: '实际开始时间', render: v => esc(v || '原记录未保存') },
      { key: 'actualEndAt', label: '实际结束时间', render: v => esc(v || '原记录未保存') },
      { key: 'actualCreditMinutes', label: '入账分钟', render: num },
      { key: 'afterValue', label: '可用分钟前后', render: (_, r) => `${num(r.beforeValue)} → ${num(r.afterValue)}` }
    ] : [
      { key: 'adjustmentNo', label: '内部流水号' },
      { key: 'direction', label: '方向', render: v => v === 'increase' ? '调增' : '调减' },
      { key: 'target', label: '对象', render: v => v === 'duration_days' ? '使用时长' : '可用分钟' },
      { key: 'value', label: '调整量', render: (v, r) => r.mode === 'clear_duration' ? '全部调减至0' : `${num(v)} ${r.target === 'duration_days' ? '天' : '分钟'}` },
      { key: 'afterValue', label: '调整前后', render: (_, r) => r.target === 'duration_days' ? `${S().spanText(r.beforeValue)} → ${S().spanText(r.afterValue)}` : `${num(r.beforeValue)} → ${num(r.afterValue)} 分钟` },
      { key: 'afterEndAt', label: '服务结束时间', render: (_, r) => `${esc(r.beforeEndAt || '—')} → ${esc(r.afterEndAt || '—')}` }
    ];
    return `<div class="ai-billing-records">${ui.table(cols.concat(common), rows, { emptyText: tab === 'recharge' ? '暂无本方案充值记录' : '暂无手工调整记录' })}</div>`;
  }
  function draw() {
    if (!guard()) return;
    const summary = AiBillingStore.summary(tenantId), p = summary.profile;
    const active = ['active', 'pending', 'invalid'].includes(summary.status);
    const product = p.commercialFlag === 'trial' ? 'trial_package' : 'standard_annual';
    const unresolved = S().outstanding(tenantId);
    ui.openLayer('tenant-billing', `<div class="layer-header"><div><h2>充值管理</h2><p>${esc(p.name)} · ${p.commercialFlag === 'trial' ? '试用' : '商用'}</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer('tenant-billing')">×</button></div>
      <div class="layer-body ai-billing-body"><div class="ai-billing-overview">
        <article class="ai-billing-service"><span>${esc(summary.productName)}</span><strong>${esc(summary.statusLabel)}</strong><small>${esc(summary.validity)}</small></article>
        <article class="primary"><span>可用分钟 ${ui.help('大、小模型共用统一分钟池。充值成功即入账；服务待生效或到期时不能发起新外呼。', '可用分钟说明')}</span><strong>${num(summary.availableMinutes)}</strong><small>大/小模型共用</small></article>
        <article><span>冻结分钟</span><strong>${num(summary.frozenMinutes)}</strong><small>已被任务预占</small></article>
        <article><span>累计消耗</span><strong>${num(summary.consumedMinutes)}</strong><small>已接通通话结算</small></article>
      </div>
      <div class="ai-billing-actions">${button(p.commercialFlag === 'trial' ? '+ 开通试用套餐' : '+ 标准版开通', `openForm('recharge','${product}')`, true, active)}
        ${p.commercialFlag === 'commercial' ? button('+ 话费充值包', "openForm('recharge','call_credit_pack')", false, summary.status !== 'active') : ''}
        ${button('手工调整', "openForm('adjustment')")}${ui.help('服务有效或待生效时不重复开通套餐，使用手工调整修正期限；话费充值包仅有效商用服务可购买，不延长服务。所有操作仅本地模拟，不产生真实扣款。', '充值操作说明')}
      </div>
      ${unresolved ? `<div class="ai-billing-notice">上次提交结果待核对，请先核对后再发起新操作。${button('核对上次结果', "recover()")}</div>` : ''}
      <div class="platform-tabs">${[['recharge','内部充值记录'],['adjustment','手工调整流水']].map(([k,l])=>`<button class="platform-tab${tab === k ? ' active' : ''}" onclick="TenantBilling.switchTab('${k}')">${l}</button>`).join('')}</div>${recordTable()}</div>
      <div class="layer-footer"><span class="layer-footer-note">${esc(summary.demoLabel || '本地模拟账户')} · 北京时间；旧金额数据保留，不折算为分钟</span>${button('关闭', 'close()')}</div>`, 'wide');
    document.querySelector('#tenant-billing .layer-panel')?.classList.add('ai-billing-panel');
  }
  function close() { closeForm(); ui.closeLayer('tenant-billing'); }
  function switchTab(next) { if (!guard()) return; tab = next; draw(); }
  function field(id, label, control, help) { return `<label class="ai-billing-field" for="${id}"><span>${label}${help ? ' ' + ui.help(help, label + '说明') : ''}</span>${control}</label>`; }
  function input(id, type, v, attrs) { return `<input id="${id}" type="${type}" value="${esc(String(v))}" ${attrs || ''} oninput="TenantBilling.changed('${id}')">`; }
  function openForm(kind, productType) {
    if (!guard()) return;
    const outstanding = S().outstanding(tenantId);
    if (outstanding) return recover();
    const p = AiBillingStore.profile(tenantId), auth = S().auth();
    closeForm();
    form = { kind, productType, tenantId, contextKey: context, actorId: auth.id,
      expectedVersion: p.unifiedMinutePool.accountVersion, businessKey: S().businessKey(kind), dirty: {}, confirmed: false, busy: false };
    const d = kind === 'recharge' ? S().defaults(p, productType, 1) : null;
    const start = S().format(S().now()), pack = productType === 'call_credit_pack';
    const end = pack ? p.entitlement.expiresAt : d ? S().addDays(start, d.durationDays) : '';
    let fields;
    if (kind === 'recharge') fields = `<div class="ai-billing-product">${S().productsFor(p).map(t=>`<label><input type="radio" name="billingProduct" value="${t}"${t === productType ? ' checked' : ''} onchange="TenantBilling.openForm('recharge',this.value)">${esc(MockRechargeIteration.products[t].name)}</label>`).join('')}</div><div class="ai-billing-grid">
      ${field('billingPrice','套餐价格（本次总价）',input('billingPrice','number',d.price,'min="0" step="0.01"'), '价格与实际入账分钟独立填写，不按金额自动折算。')}
      ${pack ? field('billingQuantity','购买数量（包）',input('billingQuantity','number',1,'min="1" step="1"'), '每包默认1,000元、3,500分钟。') : ''}
      ${field('billingStart','开始时间',input('billingStart','datetime-local',S().input(start),'step="60"'),pack ? '可在当前服务区间内编辑，仅记录本次配置，不延迟分钟入账。' : '允许未来开始；开始前不能发起新外呼。')}
      ${field('billingEnd','结束时间',input('billingEnd','datetime-local',S().input(end),'step="60"' + (pack ? ' readonly' : '')), pack ? '跟随租户服务到期时间，不延长服务。' : `默认开始后${d.durationDays}天；手工修改后不再自动覆盖。`)}
      ${field('billingMinutes','实际入账分钟',input('billingMinutes','number',d.creditMinutes,'min="1" step="1"'),'成功即计入统一可用分钟，必须为正整数。')}
      </div><p class="ai-billing-defaults">${pack ? '每包默认' : '默认参考'}：${money(d.price)} / ${num(d.creditMinutes)} 分钟${pack ? '；结束跟随租户服务期' : ' / ' + d.durationDays + ' 天'}</p>`;
    else fields = `<div class="ai-billing-grid">
      ${field('billingDirection','调整方向','<select id="billingDirection" onchange="TenantBilling.adjustmentChanged()"><option value="increase">调增</option><option value="decrease">调减</option></select>')}
      ${field('billingTarget','调整对象','<select id="billingTarget" onchange="TenantBilling.adjustmentChanged()"><option value="available_minutes">可用分钟</option><option value="duration_days">使用时长</option></select>')}
      ${field('billingValue','调整量（<span id="billingUnit">分钟</span>）',input('billingValue','number','','min="1" step="1"'), '输入正整数；时长按天调整，仅移动结束时间，分钟调整不影响已冻结任务。')}
      </div><label id="billingClearRow" class="ai-billing-check" hidden><input id="billingClear" type="checkbox" onchange="TenantBilling.adjustmentChanged()">全部调减至0 ${ui.help('扣减完整服务区间而非剩余天数，结束设为开始；服务立即过期，保留可用、冻结和已消耗分钟。','时长归零说明')}</label>`;
    ui.openLayer('ai-billing-form', `<div class="layer-header"><div><h2>${kind === 'recharge' ? '新增充值' : '手工调整'}</h2><p>${esc(p.name)} · 北京时间</p></div><button aria-label="关闭" onclick="TenantBilling.closeForm()">×</button></div><div class="layer-body ai-billing-form-body">${fields}
      ${field('billingReason','调整原因', '<textarea id="billingReason" rows="2" maxlength="300" placeholder="' + (kind === 'recharge' ? '偏离默认价格、区间跨度或分钟时必填' : '请填写本次调整的业务原因') + '" oninput="TenantBilling.changed(\'billingReason\')"></textarea>')}
      <div id="billingPreview" class="ai-billing-preview" hidden></div><div id="billingError" class="ai-billing-error" role="alert" aria-live="polite"></div>
      <details class="ai-billing-demo"><summary>模拟异常</summary><label>本次结果 <select id="billingDemo"><option value="success">成功</option><option value="failed">明确失败（可重试）</option><option value="unknown">结果待核对</option></select></label></details>
      </div><div class="layer-footer"><span class="layer-footer-note">仅本地模拟，不发起真实支付</span>${button('取消','closeForm()')}<button id="billingSubmit" class="btn btn-primary" onclick="TenantBilling.submit()">核对${kind === 'recharge' ? '充值' : '调整'}</button></div>`, 'small');
    document.querySelector('#ai-billing-form .layer-panel')?.classList.add('ai-billing-form-panel');
  }
  function closeForm() { if (form?.busy) return; ui.closeLayer('ai-billing-form'); form = null; }
  function changed(id) {
    if (!form || form.busy || form.unknown) return;
    form.confirmed = false; form.dirty[id] = true;
    if (form.kind === 'recharge') {
      const p = AiBillingStore.profile(tenantId), d = S().defaults(p, form.productType, Number(value('billingQuantity') || 1));
      if (id === 'billingQuantity') {
        if (!form.dirty.billingPrice) document.getElementById('billingPrice').value = d.price;
        if (!form.dirty.billingMinutes) document.getElementById('billingMinutes').value = d.creditMinutes;
      }
      if (id === 'billingStart' && form.productType !== 'call_credit_pack' && !form.dirty.billingEnd)
        document.getElementById('billingEnd').value = S().input(S().addDays(value('billingStart'), d.durationDays));
    }
    document.getElementById('billingPreview').hidden = true;
    document.getElementById('billingError').textContent = '';
    document.getElementById('billingSubmit').textContent = form.kind === 'recharge' ? '核对充值' : '核对调整';
  }
  function adjustmentChanged() {
    const clearAllowed = value('billingTarget') === 'duration_days' && value('billingDirection') === 'decrease';
    document.getElementById('billingClearRow').hidden = !clearAllowed;
    if (!clearAllowed) document.getElementById('billingClear').checked = false;
    document.getElementById('billingValue').disabled = document.getElementById('billingClear').checked;
    document.getElementById('billingUnit').textContent = value('billingTarget') === 'duration_days' ? '天' : '分钟';
    changed('adjustment');
  }
  function request() {
    const common = { tenantId: form.tenantId, contextKey: form.contextKey, actorId: form.actorId,
      expectedVersion: form.expectedVersion, businessKey: form.businessKey, reason: value('billingReason') };
    return Object.assign(common, form.kind === 'recharge' ? { productType: form.productType, quantity: form.productType === 'call_credit_pack' ? Number(value('billingQuantity')) : 1,
      actualPrice: Number(value('billingPrice')), priceText: value('billingPrice'), actualStartAt: value('billingStart'), actualEndAt: value('billingEnd'), actualCreditMinutes: Number(value('billingMinutes')) }
      : { direction: value('billingDirection'), target: value('billingTarget'), mode: document.getElementById('billingClear').checked ? 'clear_duration' : 'amount', value: Number(value('billingValue')) });
  }
  function feedback(errors) { document.getElementById('billingError').textContent = errors.join('；'); }
  async function submit() {
    if (!form || form.busy || !guard()) return;
    if (form.unknown) return recover();
    const r = request(), preview = form.kind === 'recharge' ? S().previewRecharge(r) : S().previewAdjustment(r);
    if (preview.errors.length) { form.confirmed = false; return feedback(preview.errors); }
    if (!form.confirmed || form.previewRequest !== JSON.stringify(r)) {
      const duration = r.target === 'duration_days';
      const before = duration ? S().spanText(preview.beforeValue) : num(preview.beforeValue) + ' 分钟';
      const after = duration ? S().spanText(preview.afterValue) : num(preview.afterValue) + ' 分钟';
      document.getElementById('billingPreview').innerHTML = `<strong>请核对本次${form.kind === 'recharge' ? '充值' : '调整'}</strong><div>${duration ? '完整服务时长' : '可用分钟'}：${before} → <b>${after}</b></div>${form.kind === 'recharge' ? `<div>本次总价：${money(r.actualPrice)}</div><div>记录区间：${esc(preview.effectiveAt)} ～ ${esc(preview.expiresAt)}</div>` : `<div>调整后服务区间：${esc(preview.afterStartAt || '未开通')} ～ ${esc(preview.afterEndAt || '未开通')}</div>`}<div>服务状态：${esc(S().statusText(preview.status))}</div>`;
      document.getElementById('billingPreview').hidden = false;
      feedback([]); form.confirmed = true; form.previewRequest = JSON.stringify(r);
      document.getElementById('billingSubmit').textContent = form.kind === 'recharge' ? '确认充值' : '确认调整'; return;
    }
    const submittedForm = form, submittedTenant = tenantId, submittedContext = context;
    const kind = form.kind, demo = value('billingDemo');
    if (demo !== 'success') MockRechargeIteration.demoStates[(demo === 'failed' ? 'failNext' : 'unknownNext') + (kind === 'recharge' ? 'Recharge' : 'Adjustment')] = true;
    form.busy = true; document.getElementById('billingSubmit').disabled = true;
    let result;
    try { result = await AiBillingStore.commit(kind, r); }
    catch (_) { result = { status: 'unknown', errors: ['提交结果尚未确认，请先核对记录'] }; }
    submittedForm.busy = false;
    if (form !== submittedForm || tenantId !== submittedTenant || context !== submittedContext || !document.getElementById('ai-billing-form')) return;
    if (!guard()) return;
    handle(result);
  }
  function handle(result) {
    if (['success', 'duplicate'].includes(result.status)) {
      tab = form?.kind || tab; closeForm(); navigateTo('tenants'); draw(); showToast(result.duplicate ? '本次业务已处理，未重复入账' : '已保存，分钟与服务状态已更新', 'success'); return;
    }
    if (!form) return showToast((result.errors || ['核对结果尚未确认，请稍后重试']).join('；'), 'warning');
    const submitButton = document.getElementById('billingSubmit'); submitButton.disabled = false;
    if (result.status === 'unknown') {
      form.unknown = true;
      document.querySelectorAll('#ai-billing-form .layer-body input, #ai-billing-form .layer-body select, #ai-billing-form .layer-body textarea').forEach(el=>el.disabled=true);
      submitButton.textContent = '核对提交结果';
      return feedback(['提交结果待核对，不能重复充值或更改请求。请点击“核对提交结果”']);
    }
    form.confirmed = false;
    document.getElementById('billingPreview').hidden = true;
    submitButton.textContent = form.kind === 'recharge' ? '重新核对充值' : '重新核对调整';
    if (result.status === 'conflict') {
      AiBillingStore.prepare(); form.expectedVersion = AiBillingStore.profile(tenantId).unifiedMinutePool.accountVersion;
      form.confirmed = false; document.getElementById('billingPreview').hidden = true; submitButton.textContent = '重新核对';
    }
    if (document.getElementById('billingDemo')) document.getElementById('billingDemo').value = 'success';
    feedback(result.errors || result.message && [result.message] || ['未保存，请核对输入后重试']);
  }
  async function recover() {
    if (!guard() || form?.busy) return;
    const pending = S().outstanding(tenantId);
    const businessKey = form?.businessKey || pending?.businessKey;
    if (!businessKey) { draw(); return; }
    const oldKind = form?.kind || pending?.kind || tab;
    const recoveryForm = form, recoveryTenant = tenantId, recoveryContext = context;
    if (form) form.busy = true;
    let result;
    try { result = await AiBillingStore.reconcile(businessKey); }
    catch (_) { result = { status: 'unknown' }; }
    if (recoveryForm) recoveryForm.busy = false;
    if (form !== recoveryForm || tenantId !== recoveryTenant || context !== recoveryContext || !document.getElementById('tenant-billing')) return;
    if (!guard()) return;
    tab = oldKind;
    handle(result);
  }
  window.TenantBilling = { open, close, switchTab, openForm, closeForm, changed, adjustmentChanged, submit, recover };
})();
