(function () {
  'use strict';
  const storageKey = 'd-contact-cloud-v210:member-external-accounts';
  const fieldLabels = { workWeChat: '企微员工号' };

  function load() {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return { rows: {}, audit: [] };
    const data = JSON.parse(raw);
    if (!data?.rows || !Array.isArray(data.audit)) throw Error('外部账号资料暂时无法读取，请重试。');
    return data;
  }

  function read(tenantId, accountId) {
    try {
      const data = load();
      const row = data.rows[tenantId]?.[accountId];
      // Keep older fields and audit rows intact, but expose only the WeCom association.
      const latest = data.audit.findLast(entry => entry?.tenantId === tenantId && entry.accountId === accountId && entry.field === 'workWeChat');
      return { workWeChat: row?.workWeChat || '', updatedAt: latest?.at || '' };
    } catch {
      return { workWeChat: '', updatedAt: '', unavailable: true };
    }
  }

  function canManage(tenantId) {
    const session = window.DSession;
    const store = window.DOrganization;
    const context = session?.context();
    if (!tenantId || !context || !session.allowed('PAGE-2003') || !store) return false;
    const role = session.roleKey(context);
    const scoped = role === 'super'
      ? session.platformAuthority(context)?.tenantIds?.includes(tenantId)
      : ['hq_admin', 'store_admin'].includes(role) && context.scope.kind === 'tenant' && context.scope.id === tenantId;
    return Boolean(scoped && store.permission('member.manage', tenantId));
  }

  function member(tenantId, accountId) {
    return window.DOrganization?.members(tenantId).find(row => row.account.id === accountId);
  }

  function activeTenant() {
    return document.querySelector('.d-org-accounts .account-tenant-card.active[data-org-tenant]')?.dataset.orgTenant;
  }

  function saveField(tenantId, accountId, field, value, expected) {
    if (field !== 'workWeChat') throw Error('此关联不再支持维护。');
    const target = member(tenantId, accountId);
    const tenant = DOrganization.tenants().find(row => row.id === tenantId);
    if (activeTenant() !== tenantId || !canManage(tenantId) || !target) throw Error('当前成员范围已变化，请重新打开。');
    if (!tenant?.enabled || !target.account.enabled || !target.member.enabled) throw Error('启用该租户及成员后可维护外部账号。');
    const data = load();
    const rows = data.rows[tenantId] ||= {};
    const row = rows[accountId] ||= {};
    const previous = row[field] || '';
    if (previous !== expected) throw Error('该关联已更新，请刷新后再保存。');
    if (previous === value) return false;
    if (value && DOrganization.members(tenantId).some(entry => entry.account.id !== accountId && rows[entry.account.id]?.[field] === value)) {
      throw Error('此' + fieldLabels[field] + '已关联本租户其他成员。');
    }
    const at = new Date().toISOString();
    row[field] = value;
    row.updatedAt = at;
    data.audit.push({ tenantId, accountId, field, before: previous, after: value, by: DSession.actor().id, at });
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  }

  function open(tenantId, accountId) {
    const target = member(tenantId, accountId);
    const tenant = DOrganization.tenants().find(row => row.id === tenantId);
    if (activeTenant() !== tenantId || !canManage(tenantId) || !target || !tenant) {
      DUI.toast('当前无法查看此成员的外部账号。');
      return;
    }
    const e = DUI.esc;
    const editable = tenant.enabled && target.account.enabled && target.member.enabled;
    const fields = Object.entries(fieldLabels).map(([field, label]) =>
      '<form class="d-org-form" data-v21-field="' + field + '"><label class="field"><span>' + e(label) + '</span><input name="externalValue" type="text" autocomplete="off"' + (editable ? '' : ' readonly') + '></label>' +
      '<p class="field-hint" data-v21-state></p>' +
      (editable ? '<div class="table-actions"><button type="submit" class="btn btn-primary">保存关联</button><button type="button" class="btn" data-v21-clear>清空关联</button></div>' : '') +
      '<p class="form-error" role="alert"></p></form>'
    ).join('');
    const dialog = DUI.dialog('企微员工号关联',
      '<p><strong>' + e(target.account.name) + '</strong> · ' + e(tenant.name) + '</p>' +
      (editable ? '<p class="field-hint">企微员工号可设置、换绑或清空。</p>' : '<p class="field-hint">当前成员或租户已停用，关联仅供查看。</p>') +
      fields + '<p class="field-hint" data-v21-updated></p>',
      [{ label: '关闭', run: close => close() }, { label: '刷新当前关联', run: () => refresh() }],
      { drawer: true, stack: true }
    );
    const forms = [...dialog.element.querySelectorAll('[data-v21-field]')];
    const loaded = {};

    function refresh(savedField) {
      if (activeTenant() !== tenantId || !canManage(tenantId) || !member(tenantId, accountId)) {
        dialog.close();
        return;
      }
      const values = read(tenantId, accountId);
      for (const form of forms) {
        const field = form.dataset.v21Field;
        const draft = form.elements.externalValue.value.trim() !== loaded[field];
        if (savedField && field !== savedField && draft && !values.unavailable) continue;
        loaded[field] = values[field];
        form.elements.externalValue.value = values[field];
        form.elements.externalValue.disabled = Boolean(values.unavailable);
        form.querySelector('[data-v21-state]').textContent = values.unavailable ? '读取失败，请刷新' : values[field] ? '已关联' : '未关联';
        form.querySelector('.form-error').textContent = '';
        const save = form.querySelector('[type="submit"]');
        const clear = form.querySelector('[data-v21-clear]');
        if (save) save.disabled = Boolean(values.unavailable);
        if (clear) clear.disabled = Boolean(values.unavailable || !values[field]);
      }
      dialog.element.querySelector('[data-v21-updated]').textContent = values.updatedAt
        ? '最近更新 ' + new Date(values.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
        : '';
    }

    function submit(form, clear) {
      const field = form.dataset.v21Field;
      if (field !== 'workWeChat') return;
      const error = form.querySelector('.form-error');
      const value = clear ? '' : form.elements.externalValue.value.trim();
      if (!clear && !value) {
        error.textContent = '请输入' + fieldLabels[field] + '。要取消关联时请选择「清空关联」。';
        form.elements.externalValue.focus();
        return;
      }
      try {
        const changed = saveField(tenantId, accountId, field, value, loaded[field]);
        refresh(field);
        mount('PAGE-2003');
        DUI.toast(changed ? (clear ? '关联已清空' : '关联已保存') : '关联保持原值');
      } catch (problem) {
        error.textContent = problem instanceof Error ? problem.message : '保存失败，请重试。';
      }
    }

    for (const form of forms) {
      form.addEventListener('submit', event => { event.preventDefault(); submit(form, false); });
      form.querySelector('[data-v21-clear]')?.addEventListener('click', () => submit(form, true));
    }
    refresh();
  }

  function mount(pageId) {
    if (pageId !== 'PAGE-2003') return;
    const tenantId = activeTenant();
    if (!canManage(tenantId)) return;
    const context = DSession.context();
    if (DSession.roleKey(context).endsWith('_admin')) {
      const description = document.querySelector('.d-org-accounts .d-page-heading p');
      if (description) {
        description.textContent = '当前租户 · ' + context.scope.tenant.name + '。可新增或关联账号、管理成员权限和状态' +
          (DSession.allowed('PAGE-2210', context) ? '，并为成员关联坐席。' : '。');
      }
    }
    const permitted = new Set(DOrganization.members(tenantId).map(({ account }) => account.id));
    for (const row of document.querySelectorAll('.d-org-accounts .account-content-panel tbody tr')) {
      const actions = row.querySelector('.table-actions');
      const accountId = actions?.querySelector('[data-org-action="account-view"][data-id]')?.dataset.id;
      if (!accountId || !permitted.has(accountId)) continue;
      let button = actions.querySelector('[data-v21-external-account]');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-link';
        button.dataset.v21ExternalAccount = '';
        button.textContent = '企微关联';
        button.onclick = () => open(tenantId, accountId);
        actions.append(button);
      }
      const values = read(tenantId, accountId);
      const label = values.unavailable ? '外部账号资料暂时无法读取'
        : '企微 ' + (values.workWeChat ? '已关联' : '未关联');
      if (button.title !== label) button.title = label;
    }
  }

  window.DReview21Accounts = { mount, read };
})();
