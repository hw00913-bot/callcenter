/** 超管通话数据异常：仅本地演示核对，不拨号、不模拟厂商验收。 */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape;
  let keyword = '', status = '待处理', page = 1;
  const allowed = () => AppState.canMenu('system.events');
  const context = () => JSON.stringify([AppState.get().sessionId, AppState.get().enterpriseId, AppState.get().activeDomain, AppState.account().accountId]);
  function normalize(row) {
    if (!['待处理','核对中','仍需处理','已恢复'].includes(row.status)) row.status = '待处理';
    if (!row.type) row.type = '异常类型待核对';
    if (!row.impact) row.impact = '具体影响待核对';
    if (!row.detectedAt) row.detectedAt = row.createdAt || '未记录';
    if (!row.lastResult) row.lastResult = '尚无完整核对结论，保留现有通话资料';
    if (!Array.isArray(row.trace)) row.trace = [];
    if (!Number.isSafeInteger(row.attempts) || row.attempts < 0) row.attempts = 0;
    return row;
  }
  const rows = () => { const list=allowed() ? (CloudCallData.callDataIssues || []).filter(r => r && r.enterpriseId === AppState.get().enterpriseId).map(normalize) : []; return ui.sortByUpdated?.(list,['detectedAt'])||list; };
  const find = id => rows().find(r => r.issueId === id);
  const call = row => CloudCallData.calls.find(c => c.callId === row.callId && c.enterpriseId === row.enterpriseId && c.tenantId === row.tenantId);
  const time = () => new Date().toLocaleString('zh-CN', { hour12: false });
  function refresh() { if (allowed()) navigateTo('event-callbacks'); }
  function render() {
    if (!allowed()) return ui.empty('当前身份无权访问', '通话数据异常由超级管理员处理。');
    const all = rows(), visible = all.filter(r => (status === '全部' || (status === '待处理' ? r.status !== '已恢复' : r.status === status)) && (!keyword || [r.callId, r.callee, CloudCallRuntime.tenant(r.tenantId)?.name].join(' ').includes(keyword)));
    page = Math.min(page, Math.max(1, Math.ceil(visible.length / 10)));
    return `<section class="platform-page event-page">${ui.pageHeader('通话数据异常', '处理自动核对后仍未恢复的通话记录。')}
      <div class="filter-panel"><label class="field"><span>通话 / 客户 / 租户</span><input id="callIssueKeyword" value="${esc(keyword)}" placeholder="输入通话编号、号码或租户"></label><label class="field"><span>处理状态</span><select id="callIssueStatus">${['待处理','核对中','仍需处理','已恢复','全部'].map(s => `<option ${status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label><div class="filter-actions"><button class="btn" onclick="CallDataIssues.reset()">重置</button><button class="btn btn-primary" onclick="CallDataIssues.query()">查询</button></div></div>
      <div class="management-list-shell">${ui.toolbar(`<span>待处理 ${all.filter(r => r.status !== '已恢复').length} 通</span>`, `<button class="btn" onclick="CallDataIssues.refresh()">刷新</button>${ui.help('系统自动去重、整理顺序并核对遗漏。本页仅列自动处理后仍需人工关注的记录；重新核对只补充通话数据，不重新拨打客户、不修改业务跟进结果。当前为本地演示。','处理说明')}`)}${ui.table([
        {key:'callId',label:'异常通话',render:(v,r)=>`<div><strong>${esc(v)}</strong></div><div><small>${esc(r.callee)} · ${esc(r.callType)}</small></div>`},
        {key:'tenantId',label:'所属租户',render:v=>esc(CloudCallRuntime.tenant(v)?.name || v)},
        {key:'type',label:'异常情况'}, {key:'impact',label:'业务影响'}, {key:'detectedAt',label:'发现时间'},
        {key:'status',label:'处理状态',render:v=>ui.status(v)},
        {key:'issueId',label:'操作',className:'action-column',render:(v,r)=>`<div class="table-actions"><button onclick="CallDataIssues.open('${v}')">查看${r.status === '已恢复' ? '结果' : '处理'}</button></div>`}
      ],visible.slice((page-1)*10,page*10),{rowOffset:(page-1)*10,emptyText: all.length ? '当前筛选下没有异常通话' : '当前客户/品牌暂无需要人工处理的通话数据异常'})}${ui.pagination(visible.length,page,10,'CallDataIssues.setPage')}</div>
    </section>`;
  }
  function open(id) {
    const r = find(id); if (!r) return;
    const c = call(r), token = context();
    const details = `<dl class="detail-grid"><dt>通话编号</dt><dd>${esc(r.callId)}</dd><dt>所属租户</dt><dd>${esc(CloudCallRuntime.tenant(r.tenantId)?.name || r.tenantId)}</dd><dt>客户号码</dt><dd>${esc(r.callee)}</dd><dt>异常情况</dt><dd>${esc(r.type)}</dd><dt>业务影响</dt><dd>${esc(r.impact)}</dd><dt>处理状态</dt><dd>${esc(r.status)}</dd></dl>`;
    const result = `<dl class="detail-grid"><dt>当前通话结果</dt><dd>${esc(c?.result || '尚未取得')}</dd><dt>结束时间</dt><dd>${esc(c?.endedAt || '尚未取得')}</dd><dt>通话时长</dt><dd>${c?.durationSeconds == null ? '尚未取得' : `${c.durationSeconds} 秒`}</dd><dt>最近核对</dt><dd>${esc(r.lastResult)}</dd></dl>`;
    ui.openLayer('call-data-issue', `<div class="layer-header"><h2>通话数据异常详情</h2><button onclick="PlatformUI.closeLayer('call-data-issue')">×</button></div><div class="layer-body">${ui.detailSection('异常信息',details)}${ui.detailSection('核对结果',result)}${ui.detailSection('处理记录',r.trace.length ? ui.timeline(r.trace.map(t=>({title:t.result,time:t.at,detail:t.operator}))) : '系统自动核对未恢复，等待人工处理。')}<p class="field-hint">演示数据：只核对这一通记录，不重新拨号，不修改坐席处理结果。</p></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('call-data-issue')">关闭</button>${r.status === '已恢复' ? '' : `<button class="btn btn-primary" id="call-data-recheck" ${r.status === '核对中' ? 'disabled' : ''}>${r.status === '核对中' ? '正在核对…' : '重新核对（演示）'}</button>`}</div>`, 'wide');
    const button = document.getElementById('call-data-recheck');
    if (button) button.onclick = () => { if (token !== context()) return showToast('工作范围已变化，请重新打开记录','warning'); recheck(id); };
  }
  function recheck(id) {
    const r = find(id); if (!r || ['核对中','已恢复'].includes(r.status)) return;
    const token = context(), operator = AppState.account().name || '超级管理员';
    r.status = '核对中'; r.updatedAt = new Date().toISOString(); r.attempts += 1; open(id);
    setTimeout(() => {
      if (token !== context() || !find(id)) { r.status = '仍需处理'; r.updatedAt = new Date().toISOString(); r.lastResult = '工作范围已变化，本次核对未应用，请重新核对'; return; }
      const c = call(r), response = r.readback;
      if (c && response?.result && response.endedAt && Number.isFinite(response.durationSeconds) && response.durationSeconds >= 0) {
        Object.assign(c, {result:response.result,endedAt:response.endedAt,durationSeconds:response.durationSeconds,updatedAt:new Date().toISOString()});
        r.status = '已恢复'; r.lastResult = '演示核对取得完整结果，已补齐本地通话记录';
      } else { r.status = '仍需处理'; r.lastResult = '暂未取得完整结果，未修改通话记录；请稍后重试或联系技术支持'; }
      r.updatedAt = new Date().toISOString();
      r.trace.push({at:time(),result:r.lastResult,operator});
      CloudCallRuntime.addAudit('通话数据核对（演示）',r.callId,r.tenantId,'待核对',r.status);
      const detailOpen = !!document.getElementById('call-data-issue');
      if (location.hash === '#event-callbacks') refresh();
      if (detailOpen) open(id);
      showToast(r.lastResult, r.status === '已恢复' ? 'success' : 'warning');
    }, 650);
  }
  window.CallDataIssues = {render,open,recheck,refresh,setPage(value){page=Math.max(1,Number(value)||1);refresh();},query(){page=1;keyword=document.getElementById('callIssueKeyword')?.value.trim() || '';status=document.getElementById('callIssueStatus')?.value || '待处理';refresh();},reset(){page=1;keyword='';status='待处理';refresh();}};
})();
