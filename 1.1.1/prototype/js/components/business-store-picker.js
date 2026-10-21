/** 门店选择：临时筛选和多选集合留在弹窗，确认后一次回填跟进表单。 */
(function () {
  'use strict';

  const layerId = 'business-store-picker';
  const filterKeys = ['code', 'name', 'province', 'city', 'district', 'group', 'businessType', 'status'];
  const selectLabels = { province: '省份', city: '城市', district: '区县', group: '小组', businessType: '门店业务类型', status: '营业状态' };
  const dccMissingFields = ['group', 'businessType', 'status', 'phone'];
  const isDcc = state => state.demoProfile?.id === 'dcc';
  const missingFields = state => new Set(isDcc(state) ? state.demoProfile.missingFields || dccMissingFields : []);
  let current = null;
  const escape = value => window.PlatformUI.escape(value);
  const rowKey = item => JSON.stringify([String(item.type || ''), String(item.code || '')]);
  const blankFilters = () => Object.fromEntries(filterKeys.map(key => [key, '']));
  const isComplete = state => !!(state && state.active && state.available && state.ready && !state.configurationError && state.status === 'complete');
  const currentItems = state => {
    const items = Array.isArray(state.current) ? state.current : [];
    return [...new Map(items.filter(item => item && item.code).map(item => [rowKey(item), item])).values()];
  };
  const hasConditions = state => state.hasConditions === true;
  const optionalEmpty = state => hasConditions(state) && state.ready === true && state.conditionRequired === false && state.hasConditionValue === false;
  const dependencyName = state => state.dependencyName || state.dependencyLabel || '关联字段';
  const canChoose = (session, state) => !session.requesting && isComplete(state) && session.acceptedStamp === String(state.stamp || '');

  function observeScope(session, state) {
    const stamp = String(state.stamp || ''), available = !!(state.available && state.ready);
    if (session.stamp !== stamp || (session.available && !available)) {
      session.queryNumber++; // Invalidate an old request before a restored source can be queried again.
      session.requesting = false;
      session.staged.clear(); session.initialized = false; session.acceptedStamp = null; session.dropped = [];
    }
    session.stamp = stamp; session.available = available;
  }

  function acceptResult(session, state) {
    const items = new Map((state.items || []).map(item => [rowKey(item), item]));
    if (!session.initialized) {
      session.staged = new Map(currentItems(state).filter(item => items.has(rowKey(item))).map(item => [rowKey(item), items.get(rowKey(item))]));
      session.initialized = true;
    } else {
      session.dropped = [...session.staged].filter(([key]) => !items.has(key)).map(([, item]) => item);
      session.staged = new Map([...session.staged].filter(([key]) => items.has(key)).map(([key]) => [key, items.get(key)]));
    }
    session.acceptedStamp = String(state.stamp || '');
  }

  function snapshot(session) {
    try {
      const state = session.options.getState();
      if (state?.active && (!Array.isArray(state.current) || typeof state.hasConditions !== 'boolean')) return { active: false };
      return state;
    } catch (_) { return { active: false }; }
  }

  function element(session) {
    const node = document.getElementById(layerId);
    return current === session && node?.dataset.pickerKey === session.options.key ? node : null;
  }

  function close(restoreFocus = true) {
    const session = current;
    if (!session) return;
    current = null;
    window.PlatformUI.closeLayer(layerId, restoreFocus);
    if (restoreFocus) session.options.restoreFocus?.();
  }

  function selectMarkup(key) {
    return `<label class="store-picker-filter store-picker-filter-${key}"><span>${escape(selectLabels[key])}</span><select data-store-filter="${key}" aria-label="${escape(selectLabels[key])}"><option value="">全部${escape(selectLabels[key])}</option></select></label>`;
  }

  function markup(options) {
    return `<div class="layer-header"><div><h2>${escape(options.title || '选择意向门店')}</h2><p>可选择多家门店，勾选后点击“确认”带回</p></div><button type="button" aria-label="关闭" onclick="BusinessStorePicker.close()">×</button></div>
      <div class="layer-body store-picker-body">
        <form class="store-picker-filters" data-store-search-form>
          <label class="store-picker-filter"><span>门店编码</span><input data-store-filter="code" aria-label="门店编码" autocomplete="off" placeholder="请输入门店编码" maxlength="80"></label>
          <label class="store-picker-filter"><span>门店名称</span><input data-store-filter="name" aria-label="门店名称" autocomplete="off" placeholder="请输入门店名称" maxlength="100"></label>
          <div class="store-picker-filter store-picker-series-field" data-store-condition-field><span data-store-condition-label>关联字段</span><div class="store-picker-series" data-store-series aria-label="当前关联字段值"></div></div>
          ${selectMarkup('province')}
          <div class="store-picker-more" data-store-more>${['city', 'district', 'group', 'businessType', 'status'].map(selectMarkup).join('')}</div>
          <div class="store-picker-search-actions"><button type="button" class="btn btn-default" data-store-reset>重置</button><button type="submit" class="btn btn-primary" data-store-query>查询</button><button type="button" class="store-picker-expand" data-store-expand aria-expanded="true">收起 <span aria-hidden="true">⌃</span></button></div>
        </form>
        <div class="store-picker-message" data-store-scope hidden>当前租户全部可用门店</div>
        <div class="store-picker-message" data-store-message role="status" aria-live="polite"></div>
        <div class="store-picker-results-heading"><h3>门店选择</h3><span data-store-count></span></div>
        <div class="store-picker-table-scroll" data-store-table-scroll tabindex="0" aria-label="门店列表，可横向滚动">
          <table class="platform-table store-picker-table"><thead><tr><th class="store-picker-select-column"><span class="store-picker-sr-only">选择门店，可多选</span></th><th>序号</th><th>门店编码</th><th>门店名称</th><th>关联车系</th><th>门店地址</th><th>小组</th><th>门店业务类型</th><th>营业状态</th><th>门店售前电话</th></tr></thead><tbody data-store-rows></tbody></table>
        </div>
      </div>
      <div class="layer-footer store-picker-footer"><span class="store-picker-selection" data-store-selection role="status" aria-live="polite">已选 0 家</span><button type="button" class="btn btn-link store-picker-clear" data-store-clear disabled>清空已选</button><button type="button" class="btn btn-default" data-store-cancel>取消</button><button type="button" class="btn btn-primary" data-store-confirm disabled>确认</button></div>`;
  }

  function open(options) {
    if (!options || typeof options.getState !== 'function' || typeof options.query !== 'function' || typeof options.choose !== 'function') return false;
    if (current?.options.key === options.key && element(current)) return true;
    if (current) close(false);
    const session = { options, staged: new Map(), initialized: false, acceptedStamp: null, dropped: [], stamp: '', available: false, filters: blankFilters(), applied: blankFilters(), requesting: false, queryNumber: 0, seenState: '', expanded: true };
    const state = snapshot(session);
    if (!state?.active) return false;
    current = session;
    session.stamp = String(state.stamp || ''); session.available = !!(state.available && state.ready);
    window.PlatformUI.openLayer(layerId, markup(options), 'wide', { objectKey: options.key, backdropGuard: false });
    const node = document.getElementById(layerId);
    node.dataset.pickerKey = options.key;
    bind(session, node);
    refresh();
    runQuery(session);
    return true;
  }

  function bind(session, node) {
    node.querySelector('[data-store-search-form]').addEventListener('submit', event => {
      event.preventDefault();
      if (event.isComposing || session.composing) return;
      session.applied = { ...session.filters };
      runQuery(session);
    });
    node.querySelectorAll('[data-store-filter]').forEach(input => {
      input.addEventListener('compositionstart', () => { session.composing = true; });
      input.addEventListener('compositionend', () => { session.composing = false; session.filters[input.dataset.storeFilter] = input.value; });
      const change = () => {
        const key = input.dataset.storeFilter;
        session.filters[key] = input.value;
        if (key === 'province') { resetFilter(session, node, 'city'); resetFilter(session, node, 'district'); }
        if (key === 'city') resetFilter(session, node, 'district');
        if (key === 'province' || key === 'city') updateOptions(session, node, snapshot(session));
      };
      input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', change);
    });
    node.querySelector('[data-store-reset]').addEventListener('click', () => {
      session.filters = blankFilters(); session.applied = blankFilters();
      node.querySelectorAll('[data-store-filter]').forEach(input => { input.value = ''; });
      refresh();
    });
    node.querySelector('[data-store-expand]').addEventListener('click', event => {
      session.expanded = !session.expanded;
      node.querySelector('[data-store-more]').hidden = !session.expanded;
      event.currentTarget.setAttribute('aria-expanded', String(session.expanded));
      event.currentTarget.innerHTML = session.expanded ? '收起 <span aria-hidden="true">⌃</span>' : '展开 <span aria-hidden="true">⌄</span>';
    });
    node.querySelector('[data-store-cancel]').addEventListener('click', () => close());
    node.querySelector('[data-store-confirm]').addEventListener('click', () => commit(session));
    node.querySelector('[data-store-clear]').addEventListener('click', () => {
      const state = snapshot(session);
      if (!canChoose(session, state)) { refresh(); return; }
      session.staged.clear();
      updateSelection(session, node, state);
    });
    const tbody = node.querySelector('[data-store-rows]');
    tbody.addEventListener('click', event => {
      const row = event.target.closest('[data-store-row]');
      if (row && !event.target.closest('button,a,input')) stage(session, row.dataset.storeRow);
    });
    tbody.addEventListener('change', event => {
      if (event.target.matches('[data-store-checkbox]')) stage(session, event.target.value);
    });
    tbody.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key) || !event.target.matches('[data-store-row]')) return;
      event.preventDefault(); stage(session, event.target.dataset.storeRow);
    });
  }

  function resetFilter(session, node, key) {
    session.filters[key] = '';
    node.querySelector(`[data-store-filter="${key}"]`).value = '';
  }

  async function runQuery(session) {
    if (!element(session)) return;
    const state = snapshot(session);
    if (!state?.active) { close(); return; }
    observeScope(session, state);
    if (session.requesting || !state.available || !state.ready || state.configurationError) { refresh(); return; }
    const request = ++session.queryNumber, stamp = String(state.stamp || '');
    session.requesting = true;
    session.acceptedStamp = null; // Keep staged rows through a retry, but do not authorize them from old results.
    refresh();
    let returned = false;
    try { await session.options.query(); returned = true; }
    catch (_) { /* A rejected request never authorizes cached complete results. */ }
    finally {
      if (current !== session || request !== session.queryNumber || !element(session)) return;
      session.requesting = false;
      const latest = snapshot(session);
      observeScope(session, latest);
      if (returned && request === session.queryNumber && String(latest.stamp || '') === stamp && isComplete(latest)) acceptResult(session, latest);
      refresh();
    }
  }

  function updateOptions(session, node, state) {
    if (!isComplete(state)) return; // Keep entered filter values while a fresh request is in flight.
    const items = state.items || [];
    Object.keys(selectLabels).forEach(key => {
      if (missingFields(state).has(key)) return;
      let candidates = items;
      if (['city', 'district'].includes(key) && session.filters.province) candidates = candidates.filter(item => item.province === session.filters.province);
      if (key === 'district' && session.filters.city) candidates = candidates.filter(item => item.city === session.filters.city);
      const values = [...new Set(candidates.map(item => String(item[key] || '')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
      const input = node.querySelector(`[data-store-filter="${key}"]`);
      const signature = JSON.stringify(values);
      if (input.dataset.options === signature) return;
      input.dataset.options = signature;
      input.innerHTML = `<option value="">全部${escape(selectLabels[key])}</option>${values.map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join('')}`;
      if (values.includes(session.filters[key])) input.value = session.filters[key];
      else { input.value = ''; session.filters[key] = ''; session.applied[key] = ''; }
    });
  }

  function updateDemoProfile(session, node, state) {
    const missing = missingFields(state);
    Object.keys(selectLabels).forEach(key => {
      const input = node.querySelector(`[data-store-filter="${key}"]`), unavailable = missing.has(key);
      input.disabled = unavailable;
      input.title = unavailable ? `DCC 门店接口未提供${selectLabels[key]}，暂不支持按此条件筛选。` : '';
      if (unavailable) {
        session.filters[key] = ''; session.applied[key] = ''; input.value = '';
        input.innerHTML = '<option value="">接口未提供</option>';
        input.dataset.demoUnavailable = 'true';
        delete input.dataset.options;
      } else if (input.dataset.demoUnavailable === 'true') {
        delete input.dataset.demoUnavailable;
        input.innerHTML = `<option value="">全部${escape(selectLabels[key])}</option>`;
        delete input.dataset.options;
      }
    });
  }

  function filteredItems(session, items) {
    return items.filter(item => filterKeys.every(key => {
      const value = String(session.applied[key] || '').trim();
      if (!value) return true;
      return key === 'code' || key === 'name' ? String(item[key] || '').toLocaleLowerCase().includes(value.toLocaleLowerCase()) : String(item[key] || '') === value;
    }));
  }

  function messageFor(session, state) {
    if (!state.available) return state.message || '门店来源暂不可用，请稍后重试。';
    if (state.configurationError) {
      const previous=currentItems(state);
      return (state.configurationError.message || state.message || '查询条件配置不兼容，请管理员调整字段配置。')+(previous.length?'。原已选门店已保留：'+previous.map(item=>`${item.name}（${item.code}）`).join('、')+'；取消不会更改原填写。':'');
    }
    if (!state.ready) return state.message || (hasConditions(state) ? '请先在跟进表单中选择' + dependencyName(state) + '。' : '查询条件暂不可用，请检查字段配置。');
    if (session.requesting || state.status === 'loading') return '正在查询门店，请稍候…';
    if (state.status === 'failed') return state.message || '门店暂未查询完整，请点击“查询”重试。';
    if (!canChoose(session, state)) return '当前查询条件或来源已更新，请点击“查询”重新查找门店。';
    const keys = new Set((state.items || []).map(rowKey));
    const unmatched = currentItems(state).filter(item => !keys.has(rowKey(item)));
    const notices = [];
    if (unmatched.length) notices.push('原已选门店不再匹配当前查询条件：' + unmatched.map(item => `${item.name}（${item.code}）`).join('、') + '。');
    const dropped = session.dropped.filter(item => !unmatched.some(value => rowKey(value) === rowKey(item)));
    if (dropped.length) notices.push('本次暂选门店已不在最新查询结果：' + dropped.map(item => `${item.name}（${item.code}）`).join('、') + '。');
    if (notices.length) notices.push('请核对后确认；仅带回本次勾选的门店，未勾选的旧门店将移除。');
    return notices.join('\n');
  }

  function stage(session, key) {
    const node = element(session), state = snapshot(session);
    if (!node || !canChoose(session, state)) { refresh(); return; }
    const item = (state.items || []).find(item => rowKey(item) === key);
    if (!item) return;
    if (session.staged.has(key)) session.staged.delete(key);
    else session.staged.set(key, item);
    updateSelection(session, node, state);
  }

  function updateSelection(session, node, state) {
    const selectable = canChoose(session, state);
    node.querySelectorAll('[data-store-row]').forEach(row => {
      const selected = selectable && session.staged.has(row.dataset.storeRow);
      row.classList.toggle('is-selected', selected);
      row.setAttribute('aria-selected', String(selected));
      row.querySelector('[data-store-checkbox]').checked = selected;
    });
    const items = [...session.staged.values()];
    const label = `已选 ${items.length} 家` + (items.length ? '：' + items.map(item => `${item.name}（${item.code}）`).join('、') : '');
    const selection = node.querySelector('[data-store-selection]');
    selection.textContent = label; selection.setAttribute('title', label);
    node.querySelector('[data-store-clear]').disabled = !selectable || !items.length;
    node.querySelector('[data-store-confirm]').disabled = !selectable;
  }

  function rowsMarkup(items, state, session) {
    if (!items.length) {
      const text = state.configurationError ? '查询条件配置需调整，暂不能查询或选择门店。' : session.requesting || state.status === 'loading' ? '正在查询门店…' : !isComplete(state) ? '暂无可选择的门店' : (state.items || []).length ? '没有符合筛选条件的门店，请调整条件。' : hasConditions(state) && !optionalEmpty(state) ? '当前查询条件暂无匹配门店。' : '当前租户暂无可用门店。';
      return `<tr><td colspan="10"><div class="store-picker-empty">${escape(text)}</div></td></tr>`;
    }
    const missing = missingFields(state), display = (item, key) => missing.has(key) ? '接口未提供' : item[key] || '—';
    return items.map((item, index) => {
      const key = rowKey(item), name = `${item.name}（${item.code}）`;
      const relation = isDcc(state) && item.type === 'ICE' ? '不适用' : Array.isArray(item.seriesNames) && item.seriesNames.length ? item.seriesNames.join('、') : Array.isArray(item.seriesCodes) && item.seriesCodes.length ? item.seriesCodes.map(code => (state.series || []).find(series => series.code === code)?.name || code).join('、') : item.type || '—';
      const isCurrent = currentItems(state).some(item => rowKey(item) === key);
      return `<tr data-store-row="${escape(key)}" tabindex="0"><td class="store-picker-select-column"><input type="checkbox" data-store-checkbox value="${escape(key)}" aria-label="选择${escape(name)}"></td><td>${index + 1}</td><td><span class="store-picker-code">${escape(item.code)}</span></td><td class="store-picker-name">${escape(item.name)}${isCurrent ? '<span class="store-picker-current">原已选</span>' : ''}</td><td class="store-picker-related">${escape(relation)}</td><td class="store-picker-address">${escape(item.address || [item.province, item.city, missing.has('district') ? '' : item.district].filter(Boolean).join('') || '—')}</td><td>${escape(display(item, 'group'))}</td><td>${escape(display(item, 'businessType'))}</td><td>${escape(display(item, 'status'))}</td><td>${escape(display(item, 'phone'))}</td></tr>`;
    }).join('');
  }

  function refresh() {
    const session = current;
    if (!session) return;
    const node = element(session);
    if (!node) { current = null; return; }
    const state = snapshot(session);
    if (!state?.active) { close(); return; }
    observeScope(session, state);
    node.querySelector('[data-store-condition-field]').hidden = !hasConditions(state);
    node.querySelector('[data-store-condition-label]').textContent = dependencyName(state);
    const scope = node.querySelector('[data-store-scope]');
    scope.hidden = !isDcc(state) && hasConditions(state) && !optionalEmpty(state);
    scope.textContent = isDcc(state) ? [state.demoProfile.label || 'DCC v2返回结构模拟（全虚构）', state.demoProfile.note || 'NEV按车系匹配；ICE返回来源内全部可用门店。真实契约待核验。', '读全分页才可选；区县本地筛选。小组、业务类型、营业状态、售前电话缺失占位，相关筛选禁用。', state.demoProfile.pageSummary || ''].filter(Boolean).join(' ') : optionalEmpty(state) ? '未提供可选条件，当前租户全部可用门店' : '当前租户全部可用门店';
    const series = node.querySelector('[data-store-series]');
    const seriesMarkup = optionalEmpty(state) ? '<span class="store-picker-series-placeholder">未提供（可选）</span>' : (state.series || []).length ? state.series.map(item => `<span class="store-picker-series-chip" title="${escape(item.code)}">${escape(item.name || item.code)}</span>`).join('') : '<span class="store-picker-series-placeholder">尚未选择关联字段值</span>';
    if (series.innerHTML !== seriesMarkup) series.innerHTML = seriesMarkup;
    updateDemoProfile(session, node, state);
    updateOptions(session, node, state);
    const message = node.querySelector('[data-store-message]');
    message.textContent = messageFor(session, state);
    message.hidden = !message.textContent;
    message.classList.toggle('is-warning', !state.available || !state.ready || state.status === 'failed' || canChoose(session, state) && !!message.textContent);
    const queryButton = node.querySelector('[data-store-query]');
    queryButton.disabled = !!session.requesting || state.status === 'loading' || !state.available || !state.ready || !!state.configurationError;
    queryButton.textContent = session.requesting || state.status === 'loading' ? '查询中…' : '查询';
    const items = canChoose(session, state) ? filteredItems(session, state.items || []) : [];
    node.querySelector('[data-store-count]').textContent = canChoose(session, state) ? `共 ${items.length} 家${items.length !== (state.items || []).length ? ` / ${(state.items || []).length} 家` : ''}` : '';
    const signature = JSON.stringify([state.status, state.stamp, state.configurationError, session.requesting, state.current, items, state.demoProfile?.id, [...missingFields(state)]]);
    if (session.seenState !== signature) {
      session.seenState = signature;
      node.querySelector('[data-store-rows]').innerHTML = rowsMarkup(items, state, session);
    }
    updateSelection(session, node, state);
  }

  function commit(session) {
    const node = element(session), state = snapshot(session);
    if (!node || !canChoose(session, state) || [...session.staged.keys()].some(key => !(state.items || []).some(item => rowKey(item) === key))) { refresh(); return; }
    const keys = [...session.staged.keys()];
    if (session.options.choose(keys) === true && current === session) close();
    else refresh();
  }

  window.BusinessStorePicker = Object.freeze({ open, refresh, close });
})();
