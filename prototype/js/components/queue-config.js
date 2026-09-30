/** Queue configuration drawers. All writes use the scoped local queue service. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, layer = 'queue-config';
  const service = () => window.AliCtiQueues;
  const action = (method, ...args) => esc(`QueueConfig.${method}(${args.map(v => JSON.stringify(v)).join(',')})`);
  const groupFor = id => CloudCallData.physicalSkillGroups.find(g => g.physicalGroupId === id);
  const text = value => value == null ? '' : String(value);
  let editor = null;
  const fields = ['qno', 'name', 'strategy', 'weight', 'queueTimeout', 'memberTimeout', 'wrapupTime', 'maxLen', 'musicClass', 'sayAgentno', 'retry', 'serviceLevel', 'vipSupport', 'joinEmpty', 'announceSound', 'announceSoundFrequency', 'announceSoundFile', 'announcePosition', 'announcePositionFrequency', 'announcePositionParam'];
  const numberKeys = ['weight', 'queueTimeout', 'memberTimeout', 'wrapupTime', 'maxLen', 'retry', 'serviceLevel', 'vipSupport', 'joinEmpty', 'announceSound', 'announceSoundFrequency', 'announcePosition', 'announcePositionFrequency', 'announcePositionParam'];
  const defaults = name => ({ ...AliCtiQueueContracts.defaults, qno: '', name: name + '接听队列' });
  const formFor = queue => Object.fromEntries(fields.map(key => [key, queue?.[key] ?? '']));
  const joinEmptyOptions = [[1, '置忙'], [2, '通话中'], [4, '振铃'], [8, '无效'], [16, '整理']];
  function joinEmptyLabel(value) { if (value == null || value === '') return '未记录'; const n = Number(value) || 0; if (!n) return '未选择'; return joinEmptyOptions.filter(([bit]) => n & bit).map(([, label]) => label).join('、') || String(n); }
  function positionLabel(value) { if (value == null || value === '') return '未记录'; return ({ 0: '关闭', 1: '大于人数阈值时播放', 2: '小于等于人数阈值时播放' })[Number(value)] || '未记录'; }
  function badge(status, label) { return `<span class="queue-badge queue-${esc(status)}">${esc(label)}</span>`; }
  function listCell(id) {
    const value = service()?.describe(id); if (!value) return '—';
    const view=value.queue&&window.QueueDetail?esc(`QueueDetail.open(${JSON.stringify(value.queue.qno)},false,${JSON.stringify(service().contextKey())})`):action('open',id,false,service().contextKey());
    return `<button class="table-link queue-list-link" onclick="${view}"><span>${esc(value.queue?.name || value.statusLabel)}</span>${value.queue ? `<small>${esc(value.queue.qno)}</small>` : ''}${value.queue ? badge(value.status, value.statusLabel) : ''}</button>`;
  }
  const recorded = (value, suffix = '') => value == null || value === '' ? '未记录' : String(value) + suffix;
  function attributes(queue) {
    if (!queue) return '<p class="queue-muted">尚未关联接听队列。</p>';
    return `<dl class="queue-attributes">${[
      ['队列名称', queue.name], ['队列编号', queue.qno], ['接听分配方式', AliCtiQueueContracts.strategies[queue.strategy] || '未记录'], ['队列优先级', queue.weight],
      ['最长排队时间', recorded(queue.queueTimeout, ' 秒')], ['坐席振铃时间', recorded(queue.memberTimeout, ' 秒')], ['呼叫下一坐席的间隔', recorded(queue.retry, ' 秒')], ['话后整理时间', recorded(queue.wrapupTime, ' 秒')], ['排队人数上限', queue.maxLen == null ? '未记录' : Number(queue.maxLen) === 0 ? '不限' : queue.maxLen + ' 人'], ['服务水平时间', recorded(queue.serviceLevel, ' 秒')],
      ['等待语音', recorded(queue.musicClass)], ['坐席工号播报', queue.sayAgentno == null ? '未记录' : queue.sayAgentno ? '播报' : '不播报'], ['VIP 支持', queue.vipSupport == null ? '未记录' : queue.vipSupport === 1 ? '支持' : '不支持'], ['允许排队的坐席状态', joinEmptyLabel(queue.joinEmpty)], ['固定语音播报', queue.announceSound == null ? '未记录' : queue.announceSound === 1 ? '开启' : '关闭'], ['排队位置播报', positionLabel(queue.announcePosition)], ['位置播报周期', recorded(queue.announcePositionFrequency, ' 秒')]
    ].map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
  }
  function memberRows(rows) { return rows.map(row => `${esc(row.name || '未命名坐席')}${row.cno ? `（${esc(row.cno)}）` : ''}`).join('、') || '无'; }
  function comparison(value) {
    if (!value?.binding) return '';
    const m = value.memberComparison;
    return `<section class="queue-section"><div class="queue-section-head"><h3>成员核对</h3>${badge(value.status, value.statusLabel)}</div><div class="queue-counts"><div><span>所选技能成员（去重）</span><strong>${m.expected.length}</strong></div><div><span>队列返回成员</span><strong>${m.actual.length}</strong></div></div><p class="queue-muted">${esc(value.message)}</p>${value.skillComparison ? `<p class="queue-muted">技能关联：${value.skillComparison.matched ? '一致' : '不一致，请核对队列关联的技能'}</p>` : ''}<details class="queue-disclosure"><summary>查看成员与差异</summary><dl class="queue-members"><dt>所选技能成员（去重）</dt><dd>${memberRows(m.expected)}</dd><dt>队列成员</dt><dd>${memberRows(m.actual)}</dd><dt>队列中缺少</dt><dd>${memberRows(m.missing)}</dd><dt>队列中额外存在</dt><dd>${memberRows(m.extra)}</dd></dl></details><p class="queue-muted">${value.checkedAt ? '最近核对：' + esc(new Date(value.checkedAt).toLocaleString('zh-CN')) : '保存关联后可核对成员。'}</p></section>`;
  }
  function summary(id) { const value = service()?.describe(id); return value ? attributes(value.queue) + comparison(value) : '<p class="queue-muted">当前范围无队列查看权限。</p>'; }
  function contextValid() { return editor && editor.context === service()?.contextKey() && (editor.groupIds || [editor.id]).every(id => service().canView(id) && (!editor.editable || service().canManage(id))); }
  function openCreate(groupIds, context) {
    const ids = [...new Set(groupIds || [])], groups = ids.map(groupFor);
    if (!ids.length || groups.some(g => !g) || groups.some(g => g.tenantId !== groups[0].tenantId || g.enterpriseId !== groups[0].enterpriseId) || ids.some(id => !service().canManage(id) || service().describe(id)?.binding) || context !== service().contextKey()) return showToast('请选择当前租户尚未关联队列的技能', 'warning');
    if (editor && !document.getElementById(layer)) { if (editor.dirty) dirty(false); editor = null; }
    if (editor?.dirty) return error('请先保存或关闭当前接听配置。');
    const current = service().describe(ids[0]);
    editor = { id: ids[0], groupIds: ids, editable: true, context, revision: current.revision, current, mode: 'new', selected: '', values: defaults(groups[0].name), dirty: false, routeHash: location.hash };
    draw();
  }
  function open(id, editable = false, context) {
    if (!service()?.canView(id) || context !== undefined && context !== service().contextKey() || editable && !service().canManage(id)) return showToast('当前工作范围无接听配置权限，请重新打开页面', 'warning');
    if (editor && !document.getElementById(layer)) { if (editor.dirty && editor.context === service().contextKey()) dirty(false); editor = null; }
    if (editor?.dirty) return error('请先保存或关闭当前接听配置。');
    const current = service().describe(id), group = groupFor(id);
    editor = { id, editable, context: service().contextKey(), revision: current.revision, current, mode: current.queue ? 'bound' : 'existing', selected: current.binding?.qno || '', values: current.queue ? formFor(current.queue) : defaults(group.name), dirty: false, routeHash: location.hash };
    draw();
  }
  function field(key, label, settings = {}) {
    return `<label class="field ${settings.full ? 'full' : ''}"><span>${label}${settings.required ? ' <b class="queue-required">*</b>' : ''}</span><input id="queue-${key}" ${settings.disabled ? 'disabled' : ''} ${settings.numeric ? `type="number" step="1" min="${settings.min}" max="${settings.max}"` : 'type="text"'} value="${esc(editor.values[key])}" oninput="QueueConfig.setField('${key}',this.value)" ${settings.required ? 'required' : ''}>${settings.hint ? `<small>${settings.hint}</small>` : ''}</label>`;
  }
  function selectField(key, label, options, hint = '') {
    const selected = String(editor.values[key] ?? '');
    return `<label class="field"><span>${label} <b class="queue-required">*</b></span><select id="queue-${key}" onchange="QueueConfig.setField('${key}',this.value)">${selected === '' ? '<option value="" selected>未记录，请选择</option>' : ''}${options.map(([value, text]) => `<option value="${esc(value)}" ${selected === String(value) ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select>${hint ? `<small>${hint}</small>` : ''}</label>`;
  }
  function joinEmptyField() {
    const current = Number(editor.values.joinEmpty) || 0;
    return `<label class="field full"><span>允许排队的坐席状态 <b class="queue-required">*</b></span><div class="queue-check-grid">${joinEmptyOptions.map(([bit, label]) => `<label class="queue-check"><input type="checkbox" id="queue-joinEmpty-${bit}" ${current & bit ? 'checked' : ''} onchange="QueueConfig.toggleJoinEmpty(${bit},this.checked)"><span>${esc(label)}</span></label>`).join('')}</div><small>可多选；接口值为所选状态数值之和，均不勾选为 0。</small></label>`;
  }
  function queueForm() {
    const announceOn = Number(editor.values.announceSound) === 1;
    const positionOn = Number(editor.values.announcePosition) !== 0;
    return `<div class="form-grid queue-form">${field('name', '队列名称', { required: true })}${field('qno', '队列编号', { required: true, disabled: editor.mode === 'bound', hint: editor.mode === 'bound' ? '队列编号创建后不可修改。' : '同一 AliCti 账号内不可重复，保留前导 0。' })}<label class="field"><span>接听分配方式 <b class="queue-required">*</b></span><select id="queue-strategy" onchange="QueueConfig.setField('strategy',this.value)">${Object.entries(AliCtiQueueContracts.strategies).map(([key, label]) => `<option value="${key}" ${key === editor.values.strategy ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>${field('weight', '队列优先级', { numeric: true, min: 1, max: 10, required: true, hint: '1～10，数值越大优先级越高。' })}</div><details class="queue-disclosure"><summary>等待与接听设置</summary><div class="form-grid queue-form">${field('queueTimeout', '最长排队时间（秒）', { numeric: true, min: 20, max: 600, required: true })}${field('memberTimeout', '坐席振铃时间（秒）', { numeric: true, min: 20, max: 60, required: true })}${field('retry', '呼叫下一坐席的间隔（秒）', { numeric: true, min: 0, required: true, hint: '坐席超时无应答后，等待该秒数再呼叫下一坐席。' })}${field('wrapupTime', '话后整理时间（秒）', { numeric: true, min: 3, max: 3600, required: true })}${field('maxLen', '排队人数上限', { numeric: true, min: 0, max: 999, required: true, hint: '填 0 表示不限制。' })}${field('serviceLevel', '服务水平时间（秒）', { numeric: true, min: 0, required: true, hint: '在该秒数内接听的视为高服务水平。' })}</div></details><details class="queue-disclosure"><summary>语音与播报设置</summary><div class="form-grid queue-form">${field('musicClass', '等待语音 class', { required: true, hint: '供应商等待语音 class 名称。' })}${selectField('sayAgentno', '坐席工号播报', [['false', '不播报'], ['true', '播报']])}${selectField('announceSound', '固定语音播报', [[0, '关闭'], [1, '开启']])}${announceOn ? field('announceSoundFrequency', '固定语音播报周期（秒）', { numeric: true, min: 0, required: true }) + field('announceSoundFile', '固定语音文件', { required: true, hint: '供应商语音文件名称。' }) : ''}${selectField('announcePosition', '排队位置播报', [[0, '关闭'], [1, '大于人数阈值时播放'], [2, '小于等于人数阈值时播放']])}${field('announcePositionFrequency', '位置播报周期（秒）', { numeric: true, min: 0, required: true })}${positionOn ? field('announcePositionParam', '位置播报人数阈值', { numeric: true, min: 2, required: true }) : ''}</div></details><details class="queue-disclosure"><summary>高级设置</summary><div class="form-grid queue-form">${selectField('vipSupport', 'VIP 支持', [[0, '不支持'], [1, '支持']])}${joinEmptyField()}</div></details>`;
  }
  function draw() {
    if (!contextValid()) return error('工作范围已变化，请关闭后重新打开。');
    const state = editor, g = groupFor(state.id), current = state.current;
    const tenant = CloudCallData.tenants.find(t => t.tenantId === g.tenantId);
    let body = `<div class="queue-context"><strong>${esc((state.groupIds || [state.id]).map(id => groupFor(id)?.name).filter(Boolean).join('、'))}</strong><span>${esc(tenant?.name || g.tenantId)} · AliCti 账号 ${esc(g.enterpriseId)}</span></div>`;
    if (!state.editable) body += summary(state.id);
    else {
      if (state.mode === 'bound') {
        body += `<div class="queue-section-head"><h3>当前接听队列</h3>${badge(current.status, current.statusLabel)}</div>${queueForm()}${comparison(current)}${current.blockedReason ? `<p class="queue-muted">${esc(current.blockedReason)}</p>` : ''}<details class="queue-disclosure"><summary>更换或解除关联</summary><p class="queue-muted">一个队列可以关联本租户的多个技能。更换前请先处理仍在使用此队列的业务。</p><div class="queue-inline-actions"><button class="btn" onclick="${action('changeMode', 'existing')}" ${current.blockedReason ? 'disabled' : ''}>更换队列</button><button class="btn" onclick="QueueConfig.askUnbind()" ${current.blockedReason ? 'disabled' : ''}>解除关联</button></div></details>`;
      } else {
        if (!state.groupIds) body += `<div class="queue-mode" role="group" aria-label="接听队列配置方式"><button class="${state.mode === 'existing' ? 'active' : ''}" onclick="${action('changeMode', 'existing')}">关联已有队列</button>${!current.binding ? `<button class="${state.mode === 'new' ? 'active' : ''}" onclick="${action('changeMode', 'new')}">新增队列</button>` : ''}</div>`;
        if (state.mode === 'new') body += queueForm();
        else {
          const options = service().options(g);
          body += `<label class="field queue-picker"><span>选择接听队列 <b class="queue-required">*</b></span><select id="queue-existing" onchange="QueueConfig.selectQueue(this.value)"><option value="">请选择当前租户的队列</option>${options.map(q => `<option value="${esc(q.qno)}" ${q.qno === state.selected ? 'selected' : ''} ${q.disabled ? 'disabled' : ''}>${esc(q.name)} · ${esc(q.qno)}${q.reason ? '（' + esc(q.reason) + '）' : ''}</option>`).join('')}</select><small>同一队列可关联本租户的多个技能。</small></label>${attributes(options.find(q => q.qno === state.selected && !q.disabled))}`;
        }
        body += '<p class="queue-muted">坐席成员继续在“维护成员”中管理。关联后请核对队列返回的成员是否一致。</p>';
      }
    }
    body += '<div id="queue-form-error" class="queue-error" role="alert"></div><div id="queue-inline-confirm" class="queue-inline-confirm" hidden></div>';
    const footer = `<button class="btn" onclick="QueueConfig.close()">${state.editable ? '取消' : '关闭'}</button>${state.editable && current.binding ? `<button class="btn" onclick="QueueConfig.verify()">重新核对</button>` : ''}${state.editable ? `<button class="btn btn-primary" id="queue-save" onclick="QueueConfig.save()">${state.mode === 'new' ? '创建并关联' : state.mode === 'existing' ? '保存关联' : '保存配置'}</button>` : ''}`;
    ui.openLayer(layer, `<div class="layer-header"><h2>${state.editable ? (state.mode === 'new' ? '新增队列' : '接听配置') : '接听队列'}</h2><button aria-label="关闭" onclick="QueueConfig.close()">×</button></div><div class="layer-body queue-content">${body}</div><div class="layer-footer">${footer}</div>`, 'wide', { objectKey: state.id });
  }
  function error(message) { const el = document.getElementById('queue-form-error'); if (el) { el.textContent = message; el.scrollIntoView?.({ block: 'nearest' }); } else showToast(message, 'warning'); return false; }
  function dirty(value) { editor.dirty = value; try { AppState.setDirty(value); } catch (_) { /* Queue persistence is separate from session UI state. */ } }
  function setField(key, value) { if (!contextValid() || !editor.editable || !fields.includes(key) || key === 'qno' && editor.mode === 'bound') return; editor.values[key] = value; dirty(true); if (key === 'announceSound' || key === 'announcePosition') draw(); }
  function toggleJoinEmpty(bit, checked) { const current = Number(editor?.values?.joinEmpty) || 0; setField('joinEmpty', String(checked ? current | bit : current & ~bit)); }
  function changeMode(mode) {
    if (!contextValid() || !editor.editable || editor.groupIds || !['existing', 'new'].includes(mode) || mode === 'new' && editor.current.binding) return;
    if (editor.mode === mode) return;
    if (editor.dirty) return error('请先保存当前填写内容，或关闭后重新打开。');
    editor.mode = mode; editor.selected = ''; editor.values = defaults(groupFor(editor.id).name); draw();
  }
  function selectQueue(qno) { if (!contextValid() || !editor.editable) return; editor.selected = qno; dirty(qno !== (editor.current.binding?.qno || '')); draw(); }
  function save() {
    if (!contextValid() || !editor.editable) return error('工作范围已变化，请关闭后重新打开。');
    let result;
    if (editor.mode === 'existing') {
      if (!editor.selected) return error('请选择接听队列。');
      result = service().saveBinding(editor.id, editor.selected, editor.context, editor.revision);
    } else {
      const values = { ...editor.values };
      for (const key of numberKeys) values[key] = text(values[key]).trim() === '' ? '' : Number(values[key]);
      if (values.sayAgentno === 'true') values.sayAgentno = true;
      else if (values.sayAgentno === 'false') values.sayAgentno = false;
      if (Number(values.announceSound) === 1) {
        if (text(values.announceSoundFrequency).trim() === '') return error('开启固定语音后须配置播报周期（秒）。');
        if (text(values.announceSoundFile).trim() === '') return error('开启固定语音后须选择语音文件。');
      }
      if (Number(values.announcePosition) !== 0 && text(values.announcePositionParam).trim() === '') return error('开启位置播报后须配置人数阈值（不小于 2）。');
      if (editor.mode === 'new') {
        // 新建按全量提交；关闭的播报开关不附带空条件字段。
        if (Number(values.announceSound) !== 1) { delete values.announceSoundFrequency; delete values.announceSoundFile; }
        if (Number(values.announcePosition) === 0) delete values.announcePositionParam;
      }
      const payload = editor.mode === 'new' ? values : Object.fromEntries(Object.entries(values).filter(([key, value]) => key !== 'qno' && text(value) !== text(editor.current.queue?.[key])));
      if (editor.mode === 'bound' && !Object.keys(payload).length) { dirty(false); showToast('配置未变化', 'success'); return true; }
      result = editor.mode === 'new' && editor.groupIds ? service().createForGroups(editor.groupIds, payload, editor.context, editor.revision) : service()[editor.mode === 'new' ? 'createForGroup' : 'updateQueue'](editor.id, payload, editor.context, editor.revision);
    }
    if (!result.ok) return error(result.message);
    const id = editor.id; dirty(false); ui.closeLayer(layer, false); editor = null;
    RouteRuntime.refreshCurrent(); const savedQueue=service().describe(id)?.queue; if(window.QueueDetail&&AppState.get?.().currentPage==='queue-management'&&savedQueue)QueueDetail.open(savedQueue.qno,false,service().contextKey());else open(id, true); showToast(result.message, 'success');
    return true;
  }
  function verify() {
    if (!contextValid() || !editor.editable) return error('工作范围已变化，请关闭后重新打开。');
    if (editor.dirty) return error('请先保存配置，再核对成员。');
    const result = service().verify(editor.id, editor.context, editor.revision);
    if (!result.ok) return error(result.message);
    editor.current = service().describe(editor.id); editor.revision = result.revision; RouteRuntime.refreshCurrent(); draw(); showToast(result.message, 'success');
  }
  function confirmation(message, button, callback) {
    ui.confirm({id:'queue-config-confirm',title:'确认操作',body:'<p>'+esc(message)+'</p>',confirmText:button,
      onConfirm:()=>callback==='discard'?discard():unbind()});
  }
  function cancelConfirm() { ui.closeLayer('queue-config-confirm'); }
  function close(force = false) { if (editor?.dirty && !force) return confirmation('当前修改尚未保存，是否放弃？', '放弃修改并关闭', 'discard'); if (editor?.dirty) dirty(false); editor = null; ui.closeLayer(layer); }
  function discard() { close(true); }
  function askUnbind() { if (!contextValid() || !editor.editable) return; if (editor.dirty) return error('请先保存当前配置。'); confirmation('解除后此技能不再关联该接听队列，队列本身仍会保留。', '确认解除关联', 'unbind'); }
  function unbind() {
    if (!contextValid() || !editor.editable) return error('工作范围已变化，请重新打开。');
    const result = service().saveBinding(editor.id, '', editor.context, editor.revision);
    if (!result.ok) { cancelConfirm(); return error(result.message); }
    const id = editor.id; close(true); RouteRuntime.refreshCurrent(); open(id, true); showToast(result.message, 'success');
  }
  window.addEventListener('app:save-draft', event => { if (!editor?.dirty || !document.getElementById(layer)) return; event.preventDefault(); showToast('请先保存或关闭接听配置，再切换业务域。', 'warning'); });
  window.addEventListener('popstate', event => { if (!editor?.dirty || !document.getElementById(layer)) return; event.stopImmediatePropagation(); history.pushState(history.state, '', editor.routeHash || '#skill-mappings'); error('请先保存配置，或使用关闭按钮放弃修改，再返回上一页。'); }, true);
  AppState.subscribe?.(() => { if (editor && !contextValid()) { editor = null; ui.closeLayer(layer, false); } });
  window.QueueConfig = { open, openCreate, close, discard, cancelConfirm, listCell, summary, setField, toggleJoinEmpty, changeMode, selectQueue, save, verify, askUnbind, unbind };
})();
