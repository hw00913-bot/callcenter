/** Independent, tenant-scoped queue details. Supplier writes stay in AliCtiQueues. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, layer = 'queue-detail';
  const service = () => window.AliCtiQueues;
  const fields = ['name', 'strategy', 'weight', 'queueTimeout', 'memberTimeout', 'wrapupTime', 'maxLen', 'musicClass', 'sayAgentno', 'retry', 'serviceLevel', 'vipSupport', 'joinEmpty', 'announceSound', 'announceSoundFrequency', 'announceSoundFile', 'announcePosition', 'announcePositionFrequency', 'announcePositionParam'];
  const numberFields = ['weight', 'queueTimeout', 'memberTimeout', 'wrapupTime', 'maxLen', 'retry', 'serviceLevel', 'vipSupport', 'joinEmpty', 'announceSound', 'announceSoundFrequency', 'announcePosition', 'announcePositionFrequency', 'announcePositionParam'];
  const conditionalKeys = ['announceSound', 'announcePosition'];
  const joinEmptyOptions = [[1, '置忙'], [2, '通话中'], [4, '振铃'], [8, '无效'], [16, '整理']];
  const string = value => value == null ? '' : String(value);
  let editor = null;

  function joinEmptyLabel(value) { if (value == null || value === '') return '未记录'; const n = Number(value) || 0; if (!n) return '未选择'; return joinEmptyOptions.filter(([bit]) => n & bit).map(([, label]) => label).join('、') || String(n); }
  function positionLabel(value) { if (value == null || value === '') return '未记录'; return ({ 0: '关闭', 1: '大于人数阈值时播放', 2: '小于等于人数阈值时播放' })[Number(value)] || '未记录'; }

  function formFor(queue) { return Object.fromEntries(fields.map(key => [key, queue?.[key] ?? ''])); }
  function storageError() { return service()?.storageError?.() || ''; }
  function sameContext() { return !!editor && editor.context === service()?.contextKey() && service()?.canAccess(); }
  function scopedValue() { return sameContext() ? service().describeQueue(editor.qno) : null; }
  function error(message) {
    const target = document.getElementById('queue-detail-error');
    if (target) { target.textContent = message; target.scrollIntoView?.({ block: 'nearest' }); }
    else showToast(message, 'warning');
    return false;
  }
  function dirty(value) {
    if (!editor) return;
    editor.dirty = value;
    try { AppState.setDirty(value); } catch (_) { /* A UI session failure must not discard the in-memory form. */ }
  }
  function changes() {
    const values = { ...editor.values };
    values.name = string(values.name).trim();
    for (const key of numberFields) values[key] = string(values[key]).trim() === '' ? '' : Number(values[key]);
    if (values.sayAgentno === 'true') values.sayAgentno = true;
    else if (values.sayAgentno === 'false') values.sayAgentno = false;
    return Object.fromEntries(fields.filter(key => string(values[key]) !== string(editor.current.queue[key])).map(key => [key, values[key]]));
  }
  function invalidate() {
    const ownedDirty = !!editor?.dirty;
    editor = null;
    ui.closeLayer(layer, false);
    if (ownedDirty) { try { AppState.setDirty(false); } catch (_) { /* Context changes always invalidate the old form. */ } }
  }
  function open(qno, editable = false, context) {
    const queues = service();
    if (typeof qno !== 'string' || !qno || !queues?.canAccess() || context !== undefined && context !== queues.contextKey()) return error('当前工作范围无队列查看权限，请重新打开页面。');
    if (editor && !sameContext()) invalidate();
    if (editor?.dirty) {
      if (!document.getElementById(layer)) draw();
      if (editor.qno === qno && editor.editable === !!editable) return true;
      return error('请先保存或关闭当前队列配置。');
    }
    const current = queues.describeQueue(qno);
    if (!current?.queue || current.queue.qno !== qno) return error(storageError() || '当前范围内没有此队列，请刷新列表后重试。');
    if (editable && !current.editable) return error(current.blockedReason || '此队列当前不可编辑。');
    editor = { qno, editable: !!editable, context: queues.contextKey(), revision: current.revision, current,
      values: formFor(current.queue), dirty: false, routeHash: location.hash };
    draw();
    return true;
  }
  function badge(value) { return `<span class="queue-badge queue-${esc(value.status || 'unbound')}">${esc(value.statusLabel || '未关联')}</span>`; }
  const recorded = (value, suffix = '') => value == null || value === '' ? '未记录' : String(value) + suffix;
  function attributes(queue) {
    return `<dl class="queue-attributes">${[
      ['队列编号', queue.qno], ['接听分配方式', AliCtiQueueContracts.strategies[queue.strategy] || '未记录'], ['队列优先级', queue.weight],
      ['最长排队时间', recorded(queue.queueTimeout, ' 秒')], ['坐席振铃时间', recorded(queue.memberTimeout, ' 秒')], ['呼叫下一坐席的间隔', recorded(queue.retry, ' 秒')], ['话后整理时间', recorded(queue.wrapupTime, ' 秒')],
      ['排队人数上限', queue.maxLen == null ? '未记录' : Number(queue.maxLen) === 0 ? '不限' : queue.maxLen + ' 人'], ['服务水平时间', recorded(queue.serviceLevel, ' 秒')],
      ['等待语音', recorded(queue.musicClass)], ['坐席工号播报', queue.sayAgentno == null ? '未记录' : queue.sayAgentno ? '播报' : '不播报'], ['VIP 支持', queue.vipSupport == null ? '未记录' : queue.vipSupport === 1 ? '支持' : '不支持'],
      ['允许排队的坐席状态', joinEmptyLabel(queue.joinEmpty)], ['固定语音播报', queue.announceSound == null ? '未记录' : queue.announceSound === 1 ? '开启' : '关闭'], ['排队位置播报', positionLabel(queue.announcePosition)], ['位置播报周期', recorded(queue.announcePositionFrequency, ' 秒')]
    ].map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
  }
  function memberNames(rows) {
    return (rows || []).map(row => row.restricted ? '无法核对的坐席' : `${esc(row.name || '未命名坐席')}${row.cno ? `（${esc(row.cno)}）` : ''}`).join('、') || '无';
  }
  function members(current) {
    const comparison = current.memberComparison || { actual: [], expected: [], missing: [], extra: [] };
    let html = `<section class="queue-section"><div class="queue-section-head"><h3>队列返回成员</h3><span class="queue-muted">${comparison.actual.length} 位</span></div><p class="queue-detail-members">${memberNames(comparison.actual)}</p>`;
    if ((current.groups || (current.group ? [current.group] : [])).length) {
      html += `<div class="queue-section-head"><h3>成员核对</h3>${badge(current)}</div><p class="queue-muted">${esc(current.message || '')}</p>`;
      if (current.skillComparison) html += `<p class="queue-muted">技能关联：${current.skillComparison.matched ? '一致' : '不一致，请核对队列关联的技能'}</p>`;
      html += `<details class="queue-disclosure"><summary>查看技能成员及差异</summary><dl class="queue-members"><dt>所选技能成员（去重）</dt><dd>${memberNames(comparison.expected)}</dd><dt>队列中缺少</dt><dd>${memberNames(comparison.missing)}</dd><dt>队列中额外存在</dt><dd>${memberNames(comparison.extra)}</dd></dl></details>`;
      if (current.checkedAt) html += `<p class="queue-muted">最近核对：${esc(new Date(current.checkedAt).toLocaleString('zh-CN'))}</p>`;
    } else html += '<p class="queue-muted">尚未关联技能，当前仅展示队列已有成员。</p>';
    return html + '</section>';
  }
  function field(key, label, settings = {}) {
    return `<label class="field"><span>${label} <b class="queue-required">*</b></span><input id="queue-detail-${key}" ${settings.numeric ? `type="number" step="1" min="${settings.min}" max="${settings.max}"` : 'type="text"'} value="${esc(editor.values[key])}" oninput="QueueDetail.setField('${key}',this.value)" required>${settings.hint ? `<small>${settings.hint}</small>` : ''}</label>`;
  }
  function selectField(key, label, options) {
    const selected = String(editor.values[key] ?? '');
    return `<label class="field"><span>${label} <b class="queue-required">*</b></span><select id="queue-detail-${key}" onchange="QueueDetail.setField('${key}',this.value)">${selected === '' ? '<option value="" selected>未记录，请选择</option>' : ''}${options.map(([value, text]) => `<option value="${esc(value)}" ${selected === String(value) ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></label>`;
  }
  function joinEmptyField() {
    const current = Number(editor.values.joinEmpty) || 0;
    return `<label class="field full"><span>允许排队的坐席状态 <b class="queue-required">*</b></span><div class="queue-check-grid">${joinEmptyOptions.map(([bit, label]) => `<label class="queue-check"><input type="checkbox" id="queue-detail-joinEmpty-${bit}" ${current & bit ? 'checked' : ''} onchange="QueueDetail.toggleJoinEmpty(${bit},this.checked)"><span>${esc(label)}</span></label>`).join('')}</div><small>可多选；接口值为所选状态数值之和，均不勾选为 0。</small></label>`;
  }
  function form() {
    const announceOn = Number(editor.values.announceSound) === 1;
    const positionOn = Number(editor.values.announcePosition) !== 0;
    return `<div class="form-grid queue-form">${field('name', '队列名称')}<label class="field"><span>队列编号</span><input value="${esc(editor.qno)}" disabled><small>队列编号创建后不可修改。</small></label><label class="field"><span>接听分配方式 <b class="queue-required">*</b></span><select id="queue-detail-strategy" onchange="QueueDetail.setField('strategy',this.value)">${Object.entries(AliCtiQueueContracts.strategies).map(([key, label]) => `<option value="${key}" ${key === editor.values.strategy ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>${field('weight', '队列优先级', { numeric: true, min: 1, max: 10, hint: '1～10，数值越大优先级越高。' })}</div><details class="queue-disclosure" open><summary>等待与接听设置</summary><div class="form-grid queue-form">${field('queueTimeout', '最长排队时间（秒）', { numeric: true, min: 20, max: 600 })}${field('memberTimeout', '坐席振铃时间（秒）', { numeric: true, min: 20, max: 60 })}${field('retry', '呼叫下一坐席的间隔（秒）', { numeric: true, min: 0, hint: '坐席超时无应答后，等待该秒数再呼叫下一坐席。' })}${field('wrapupTime', '话后整理时间（秒）', { numeric: true, min: 3, max: 3600 })}${field('maxLen', '排队人数上限', { numeric: true, min: 0, max: 999, hint: '填 0 表示不限制。' })}${field('serviceLevel', '服务水平时间（秒）', { numeric: true, min: 0 })}</div></details><details class="queue-disclosure"><summary>语音与播报设置</summary><div class="form-grid queue-form">${field('musicClass', '等待语音 class')}${selectField('sayAgentno', '坐席工号播报', [['false', '不播报'], ['true', '播报']])}${selectField('announceSound', '固定语音播报', [[0, '关闭'], [1, '开启']])}${announceOn ? field('announceSoundFrequency', '固定语音播报周期（秒）', { numeric: true, min: 0 }) + field('announceSoundFile', '固定语音文件') : ''}${selectField('announcePosition', '排队位置播报', [[0, '关闭'], [1, '大于人数阈值时播放'], [2, '小于等于人数阈值时播放']])}${field('announcePositionFrequency', '位置播报周期（秒）', { numeric: true, min: 0 })}${positionOn ? field('announcePositionParam', '位置播报人数阈值', { numeric: true, min: 2 }) : ''}</div></details><details class="queue-disclosure"><summary>高级设置</summary><div class="form-grid queue-form">${selectField('vipSupport', 'VIP 支持', [[0, '不支持'], [1, '支持']])}${joinEmptyField()}</div></details>`;
  }
  function draw() {
    if (!sameContext()) return invalidate();
    const current = editor.current, queue = current.queue;
    const body = `<div class="queue-context"><strong>${esc(queue.name)}</strong><span>${esc(current.tenantName || queue.tenantId)} · AliCti 账号 ${esc(queue.enterpriseId)}</span></div><dl class="queue-attributes queue-detail-ownership"><div><dt>归属租户</dt><dd>${esc(current.tenantName || queue.tenantId)}</dd></div><div><dt>关联技能</dt><dd>${esc((current.groups || (current.group ? [current.group] : [])).map(group => group.name).join('、') || '未关联')}</dd></div></dl>${editor.editable ? form() : attributes(queue)}${members(current)}${current.blockedReason ? `<p class="queue-muted">${esc(current.blockedReason)}</p>` : ''}<div id="queue-detail-error" class="queue-error" role="alert"></div><div id="queue-detail-confirm" class="queue-inline-confirm" hidden></div>`;
    ui.openLayer(layer, `<div class="layer-header"><h2>${editor.editable ? '编辑队列' : '队列详情'}</h2><button aria-label="关闭" onclick="QueueDetail.close()">×</button></div><div class="layer-body queue-content">${body}</div><div class="layer-footer"><button class="btn" onclick="QueueDetail.close()">${editor.editable ? '取消' : '关闭'}</button>${editor.editable ? '<button id="queue-detail-save" class="btn btn-primary" onclick="QueueDetail.save()">保存配置</button>' : ''}</div>`, 'wide', { objectKey: `${queue.enterpriseId}:${editor.qno}` });
  }
  function setField(key, value) {
    if (!sameContext() || !editor.editable || !fields.includes(key)) return;
    editor.values[key] = value;
    dirty(Object.keys(changes()).length > 0);
    if (conditionalKeys.includes(key)) draw();
  }
  function toggleJoinEmpty(bit, checked) { const current = Number(editor?.values?.joinEmpty) || 0; setField('joinEmpty', String(checked ? current | bit : current & ~bit)); }
  function save() {
    if (!sameContext() || !editor.editable) return error('工作范围已变化，请关闭后重新打开。');
    if (Number(editor.values.announceSound) === 1) {
      if (string(editor.values.announceSoundFrequency).trim() === '') return error('开启固定语音后须配置播报周期（秒）。');
      if (string(editor.values.announceSoundFile).trim() === '') return error('开启固定语音后须选择语音文件。');
    }
    if (Number(editor.values.announcePosition) !== 0 && string(editor.values.announcePositionParam).trim() === '') return error('开启位置播报后须配置人数阈值（不小于 2）。');
    const current = scopedValue();
    if (!current) return error(storageError() || '此队列已不在当前工作范围，请关闭后刷新列表。');
    if (!current.editable) return error(current.blockedReason || '此队列当前不可编辑，填写内容已保留。');
    const payload = changes();
    if (!Object.keys(payload).length) { dirty(false); showToast('配置未变化', 'success'); return true; }
    const validation = window.AliCtiQueueContracts?.updateFields(editor.qno, payload);
    if (!validation?.ok) return error(validation?.errors?.join('；') || '队列配置暂不可用，请刷新后重试。');
    const result = service().updateByNumber(editor.qno, payload, editor.context, editor.revision);
    if (!result?.ok) return error(result?.message || '保存失败，填写内容已保留，请重试。');
    const saved = service().describeQueue(editor.qno);
    dirty(false);
    if (!saved) { close(true); RouteRuntime.refreshCurrent(); showToast(result.message, 'success'); return true; }
    editor.current = saved;
    editor.values = formFor(saved.queue);
    editor.revision = saved.revision;
    editor.editable = !!saved.editable;
    RouteRuntime.refreshCurrent();
    draw();
    showToast(result.message, 'success');
    return true;
  }
  function close(force = false) {
    if (editor?.dirty && !force) {
      ui.confirm({id:'queue-detail-decision',title:'放弃修改？',body:'<p>当前修改尚未保存，是否放弃？</p>',confirmText:'放弃修改并关闭',onConfirm:discard});
      return false;
    }
    if (editor?.dirty) dirty(false);
    editor = null;
    ui.closeLayer(layer);
    return true;
  }
  function discard() { return close(true); }
  function cancelConfirm() { ui.closeLayer('queue-detail-decision'); }
  window.addEventListener('app:save-draft', event => {
    if (!editor?.dirty) return;
    event.preventDefault();
    showToast('请先保存或关闭队列配置，再切换工作范围。', 'warning');
  });
  window.addEventListener('popstate', event => {
    if (!editor?.dirty || !sameContext()) return;
    event.stopImmediatePropagation();
    history.pushState(history.state, '', editor.routeHash || '#queue-management');
    if (!document.getElementById(layer)) draw();
    error('请先保存配置，或使用关闭按钮放弃修改，再返回上一页。');
  }, true);
  AppState.subscribe?.(() => {
    if (!editor) return;
    if (!sameContext()) return invalidate();
    if (!scopedValue() && !storageError()) invalidate();
  });
  window.QueueDetail = { open, close, discard, cancelConfirm, setField, toggleJoinEmpty, save };
})();
