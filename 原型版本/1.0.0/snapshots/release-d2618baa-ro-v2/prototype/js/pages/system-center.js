/** 系统设置：AliCti 通话数据异常和平台操作审计。 */
(function () {
  'use strict';
  const ui=PlatformUI,esc=ui.escape;
  const scoped=rows=>AppState.scoped(rows||[]);
  const tenantName=id=>CloudCallRuntime.tenant(id)?.name||id;
  let auditFilter={keyword:'',action:'全部动作'};
  function renderAudit() {
    if (!AppState.canMenu('system.audit')) return ui.empty('当前身份无权访问', '请使用有操作审计权限的账号。');
    const filtered = scoped(CloudCallData.audits).filter(r=>(!auditFilter.keyword||[r.operator,r.object,r.action].join(' ').includes(auditFilter.keyword))&&(auditFilter.action==='全部动作'||r.action===auditFilter.action));
    const rows = ui.sortByUpdated?.(filtered, ['at']) || filtered;
    return `<section class="platform-page audit-page">${ui.pageHeader('操作审计', '记录关键配置、状态变更、导出和重试行为，包括操作前后差异。', '<button class="btn" onclick="doExport(event)">导出审计</button>')}<div class="filter-panel"><label class="field grow"><span>操作人 / 对象</span><input id="auditKeyword" value="${esc(auditFilter.keyword)}" placeholder="输入关键词"></label><label class="field"><span>动作</span><select id="auditAction">${['全部动作',...new Set(scoped(CloudCallData.audits).map(r=>r.action))].map(a=>`<option ${a===auditFilter.action?'selected':''}>${esc(a)}</option>`).join('')}</select></label><button class="btn" onclick="window.Pages['system-center'].resetAudit()">重置</button><button class="btn btn-primary" onclick="window.Pages['system-center'].queryAudit()">查询</button></div>${ui.table([{ key: 'auditId', label: '审计编号', render: value => `<code>${esc(value)}</code>` }, { key: 'operator', label: '操作人' }, { key: 'action', label: '动作' }, { key: 'object', label: '对象', render: value => `<code>${esc(value)}</code>` }, { key: 'before', label: '操作前' }, { key: 'after', label: '操作后' }, { key: 'at', label: '操作时间' }, { key: 'auditId', label: '操作', render: value => `<button class="btn-link" onclick="window.Pages['system-center'].openAudit('${value}')">查看差异</button>` }], rows)}</section>`;
  }


  function render(options) {
    if (options?.view === 'audit') return renderAudit();
    if (options?.view === 'events') return CallDataIssues.render();
    return ui.empty('此入口已移除','请从左侧菜单进入本平台功能。');
  }
  function queryAudit(){auditFilter={keyword:document.getElementById('auditKeyword').value.trim(),action:document.getElementById('auditAction').value};navigateTo('audit');}
  function resetAudit(){auditFilter={keyword:'',action:'全部动作'};navigateTo('audit');}
  function openAudit(id) {
    const row = scoped(CloudCallData.audits).find(item => item.auditId === id);
    if (!AppState.canMenu('system.audit') || !row || !AppState.authorizeObject('', row)) {
      ui.closeLayer('audit-detail');
      return;
    }
    ui.openLayer('audit-detail', `<div class="layer-header"><div><h2>${esc(row.action)}</h2><p>${esc(row.auditId)} · ${esc(row.at)}</p></div><button onclick="PlatformUI.closeLayer('audit-detail')">×</button></div><div class="layer-body"><dl class="detail-grid"><dt>操作人</dt><dd>${esc(row.operator)}</dd><dt>对象</dt><dd><code>${esc(row.object)}</code></dd><dt>租户</dt><dd>${esc(tenantName(row.tenantId) || '供应商账号级')}</dd></dl><div class="diff-grid"><div><span>操作前</span><strong>${esc(row.before)}</strong></div><i>→</i><div><span>操作后</span><strong>${esc(row.after)}</strong></div></div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('audit-detail')">关闭</button></div>`, 'small');
  }


  function captureNavigationState(){return {auditFilter:{...auditFilter}};}
  function restoreNavigationState(state){if(state)auditFilter={...state.auditFilter};}
  window.Pages=window.Pages||{};
  window.Pages['system-center']={render,captureNavigationState,restoreNavigationState,init(){},reconcile:id=>CallDataIssues.open(id),queryAudit,resetAudit,openAudit};
})();
