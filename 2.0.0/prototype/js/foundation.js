(() => {
  const sections = window.reviewSections ||= {};
  function visibleSeats(state) {
    const tenantSeats = state.seats.filter(seat => seat.tenant === state.tenant);
    return state.role === 'admin' ? tenantSeats : tenantSeats.filter(seat => seat.id === state.seatId);
  }

  function tag(ui, value, kind = '') {
    return `<span class="tag ${kind}">${ui.esc(value)}</span>`;
  }

  function workspace() {
    return document.querySelector('#workspace');
  }

  function formError(form, message, field) {
    const error = form.querySelector('[data-error]');
    error.textContent = message;
    error.hidden = false;
    field?.focus();
  }

  function recordChange(state, area, seat, detail) {
    state.changes ||= [];
    state.changes.unshift({ area, seatId: seat.id, tenant: seat.tenant, detail, date: state.today });
  }

  function history(state, ui, seats, area) {
    const allowed = new Map(seats.map(seat => [seat.id, seat.name]));
    const records = (state.changes || []).filter(change => change.area === area && (area !== '外部账号' || String(change.detail || '').startsWith('企微员工号：')) && change.tenant === state.tenant && allowed.has(change.seatId));
    if (!records.length) return '';
    return `<section class="panel"><h2 class="section-title">最近变更</h2>
      <div class="table-wrap"><table><thead><tr><th>日期</th><th>坐席</th><th>变更内容</th></tr></thead>
        <tbody>${records.slice(0, 8).map(record => `<tr><td>${ui.esc(record.date)}</td><td>${ui.esc(allowed.get(record.seatId))}</td><td>${ui.esc(record.detail)}</td></tr>`).join('')}</tbody></table></div></section>`;
  }

  function accountField(ui, seat, field, label) {
    return `<form class="toolbar" data-account-form data-seat="${ui.esc(seat.id)}" data-field="${field}">
      <label class="field">${label}<input name="value" value="${ui.esc(seat[field] ?? '')}" placeholder="未关联" autocomplete="off"></label>
      <button class="button primary" type="submit">保存${label}</button>
      ${seat[field] ? `<button class="button secondary" data-clear-account type="button" aria-label="清空${label}">清空</button>` : ''}
      <p class="notice" data-error role="alert" hidden></p></form>`;
  }

  sections.accounts = {
    title: '账号管理',
    render(state, ui) {
      const seats = visibleSeats(state);
      if (!seats.length) return '<section class="panel empty">当前没有可查看的成员账号。</section>';
      const canEdit = state.role === 'admin';
      return `<section class="panel"><div class="section-title"><h2>${canEdit ? '成员外部账号' : '我的关联账号'}</h2></div>
        <p class="muted">${canEdit ? '企微员工号选填，同一租户内不可重复。' : '这里显示本人当前关联。需要变更时请联系管理员。'}</p>
        <div class="table-wrap"><table><thead><tr><th>成员</th><th>登录账号</th><th>企微员工号</th>${canEdit ? '<th>操作</th>' : ''}</tr></thead>
        <tbody>${seats.map(seat => `<tr>
          <td><strong>${ui.esc(seat.name)}</strong></td><td>${ui.esc(seat.account || '—')}</td>
          <td>${seat.workWeChat ? ui.esc(seat.workWeChat) : tag(ui, '未关联')}</td>
          ${canEdit ? `<td><details><summary class="button secondary">维护关联</summary>
            ${accountField(ui, seat, 'workWeChat', '企微员工号')}</details></td>` : ''}
        </tr>`).join('')}</tbody></table></div></section>${canEdit ? history(state, ui, seats, '外部账号') : ''}`;
    },
    bind(state, ui) {
      if (state.role !== 'admin') return;
      for (const form of workspace().querySelectorAll('[data-account-form]')) {
        const seat = visibleSeats(state).find(item => item.id === form.dataset.seat);
        const field = form.dataset.field;
        if (!seat || field !== 'workWeChat') continue;
        const label = '企微员工号';
        const input = form.elements.namedItem('value');
        const change = value => {
          if(ui.canSave?.()===false)return;
          const previous = seat[field] || '';
          if (value === previous) { ui.toast('关联没有变化。'); return; }
          if (value && state.seats.some(item => item.id !== seat.id && item.tenant === seat.tenant && String(item[field] ?? '').trim() === value)) {
            formError(form, `此${label}已关联给同一租户的其他成员。`, input);
            return;
          }
          seat[field] = value;
          recordChange(state, '外部账号', seat, `${label}：${previous || '未关联'} → ${value || '未关联'}`);
          ui.save(value ? `已保存 ${seat.name}的${label}。` : `已清空 ${seat.name}的${label}。`);
        };
        form.addEventListener('submit', event => {
          event.preventDefault();
          const value = input.value.trim();
          if (!value) { formError(form, seat[field] ? '如需移除关联，请选择「清空」。' : `请输入${label}后保存。`, input); return; }
          change(value);
        });
        form.querySelector('[data-clear-account]')?.addEventListener('click', () => change(''));
      }
    }
  };

  function quotaRow(seat, state, ui, canEdit) {
    const maximum = seat.quotaMax;
    const minimum = seat.quotaMin;
    const configured = Number.isInteger(maximum) && maximum > 0 && Number.isInteger(minimum) && minimum > 0;
    const {newCount,followCount} = DReview21Workbench.seatUsage(state,seat);
    const hasCounts = Number.isInteger(newCount) && Number.isInteger(followCount);
    const total = hasCounts ? newCount + followCount : null;
    const remaining = configured && hasCounts ? Math.max(maximum - total, 0) : null;
    const gap = configured && hasCounts ? Math.max(minimum - newCount, 0) : null;
    const condition = !seat.enabled ? tag(ui, '已停用', 'warning') : !configured ? tag(ui, '未配置') : remaining === null ? tag(ui, '待核对', 'warning') : remaining > 0 ? tag(ui, '接收量有余', 'success') : tag(ui, '暂停接新任务', 'warning');
    const display = value => Number.isInteger(value) ? ui.esc(value) : '待核对';
    return `<tr><td><strong>${ui.esc(seat.name)}</strong><br><small class="muted">工号 ${ui.esc(seat.employeeNo || '—')}${seat.tenantName ? ` · ${ui.esc(seat.tenantName)}` : ''}</small>
      <br><small class="muted">${seat.account ? `登录账号 ${ui.esc(seat.account)}` : ui.esc(seat.bindingState || '未关联平台账号')}</small></td>
      <td>${tag(ui, state.schedules?.[seat.id]?.[state.today] || '未配置')}</td><td>${condition}</td>
      <td>${configured ? `${ui.esc(maximum)}<small class="muted"> / ${ui.esc(minimum)}</small>` : '未配置'}</td>
      <td>${display(newCount)}<small class="muted"> / ${display(followCount)}</small></td>
      <td>${display(total)}${configured && hasCounts && total > maximum ? `<br>${tag(ui, `超出 ${total - maximum}`, 'warning')}` : ''}</td>
      <td>${!configured ? '—' : display(remaining)}${gap > 0 ? `<br><small class="muted">保底还差 ${ui.esc(gap)}</small>` : ''}</td>
      ${canEdit ? `<td><details><summary class="button secondary">${configured ? '调整接收量' : '设置接收量'}</summary>
        <form class="toolbar" data-quota-form data-seat="${ui.esc(seat.id)}">
          <label class="field">当日最多接收<input type="number" min="1" step="1" name="maximum" value="${configured ? ui.esc(maximum) : ''}" required></label>
          <label class="field">保底新增<input type="number" min="1" step="1" name="minimum" value="${configured ? ui.esc(minimum) : ''}" required></label>
          <button class="button primary" type="submit">保存接收量</button><p class="notice" data-error role="alert" hidden></p>
        </form></details></td>` : ''}</tr>`;
  }

  sections.seats = {
    title: '坐席管理',
    render(state, ui) {
      const seats = visibleSeats(state).filter(seat => !ui.focusSeatId || seat.id === ui.focusSeatId);
      const canEdit = state.role === 'admin';
      if (!seats.length) return '<section class="panel empty">当前没有可查看的坐席。</section>';
      return `<section class="panel"><div class="section-title"><h2>${canEdit ? '坐席接收量' : '我的接收量'}</h2></div>
        <p class="muted">达到上限后暂停新增，已接事项仍可继续跟进。${canEdit ? '调整后即用于后续新增分派，当日已办理数量保留。' : ''}</p>
        <div class="table-wrap"><table><thead><tr><th>坐席</th><th>今日排班</th><th>接收量状态</th><th>上限 / 保底新增</th><th>新增 / 继续</th><th>当日合计</th><th>剩余接收量</th>${canEdit ? '<th>操作</th>' : ''}</tr></thead>
        <tbody>${seats.map(seat => quotaRow(seat, state, ui, canEdit)).join('')}</tbody></table></div></section>
        ${canEdit ? history(state, ui, seats, '接收量') : ''}`;
    },
    bind(state, ui) {
      if (state.role !== 'admin') return;
      for (const form of workspace().querySelectorAll('[data-quota-form]')) {
        form.addEventListener('submit', event => {
          event.preventDefault();
          const seat = visibleSeats(state).find(item => item.id === form.dataset.seat && (!ui.focusSeatId || item.id === ui.focusSeatId));
          if (!seat) return;
          const maxField = form.elements.namedItem('maximum');
          const minField = form.elements.namedItem('minimum');
          const maximum = maxField.valueAsNumber;
          const minimum = minField.valueAsNumber;
          if (!Number.isSafeInteger(maximum) || maximum < 1) { formError(form, '请输入大于 0 的当日接收上限。', maxField); return; }
          if (!Number.isSafeInteger(minimum) || minimum < 1 || minimum > maximum) { formError(form, '保底新增需大于 0，且不能超过当日接收上限。', minField); return; }
          if (maximum === seat.quotaMax && minimum === seat.quotaMin) { ui.toast('接收量没有变化。'); return; }
          if(ui.canSave?.()===false)return;
          const previous = seat.quotaMax == null || seat.quotaMin == null ? '未配置' : `${seat.quotaMax} / ${seat.quotaMin}`;
          seat.quotaMax = maximum;
          seat.quotaMin = minimum;
          recordChange(state, '接收量', seat, `当日上限 / 保底新增：${previous} → ${maximum} / ${minimum}`);
          ui.save('接收量已生效，已办理数量保留。');
        });
      }
    }
  };

})();
