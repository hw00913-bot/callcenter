/** 失败记录在所属业务页面处理；不建立独立工单或人工复检流程。 */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape;
  const routes = { '坐席创建': 'agent-maintenance', '技能同步': 'skill-mappings' };
  const command = (method, ...args) => esc(`BusinessIssues.${method}(${args.map(value => JSON.stringify(value)).join(',')})`);
  const context = () => { const s = AppState.get(); return [s.accountId,s.sessionId,s.tenantId,s.enterpriseId,s.activeDomain,AppState.effectiveAccess().roleCode].join('|'); };
  function allowed(row) {
    return !!row && AppState.effectiveAccess().valid && AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER' &&
      AppState.effectiveAccess().roleCode !== 'OPERATOR' && AppState.authorizeObject('', row) &&
      !!routes[row.type] && RouteRuntime.canRoute(routes[row.type]);
  }
  function find(id) { return CloudCallData.exceptions.find(row => row.exceptionId === id); }
  function sync(row) { return CloudCallData.syncRecords.find(item => item.objectId === row.objectId); }
  function pending(row) {
    const source = sync(row);
    return source ? source.status !== '成功' : !['已处理', '已关闭'].includes(row.status);
  }
  function record(row, action, result, success) {
    if (!allowed(row)) return;
    const at = new Date().toLocaleString('zh-CN', { hour12: false });
    row.trace = row.trace || [];
    row.trace.push({ at, action, result, operator: AppState.account().name });
    row.updatedAt = at; row.status = success ? '已处理' : '待处理';
    row.retryCount = (row.retryCount || 0) + 1;
    CloudCallRuntime.addAudit(action, row.objectId, row.tenantId, '失败记录保留', result);
    refresh();
  }
  function open(id) {
    const row = find(id);
    if (!allowed(row) || !routes[row.type]) return false;
    RouteRuntime.openSecondary(routes[row.type]);
    detail(id);
    return true;
  }
  function section(type) {
    const rows = listRows(type);
    if (!rows.length) return '';
    const count = rows.filter(pending).length;
    return `<div class="business-issue-notice" data-issue-type="${esc(type)}"><button type="button" class="issue-notice-button ${count?'has-pending':''}" aria-haspopup="dialog" onclick="${command('openList',type,context())}"><span class="issue-notice-copy"><span class="issue-notice-icon" aria-hidden="true">${count?'!':'✓'}</span><span>${count?'配置异常':'配置记录'}</span><strong>${count?count+' 项待处理':'全部已处理'}</strong></span><span class="issue-notice-action">${count?'查看列表':'查看记录'} <span aria-hidden="true">›</span></span></button></div>`;
  }
  function listRows(type) {
    return AppState.scoped(CloudCallData.exceptions).filter(row => row.type === type && allowed(row));
  }
  function listContent(type) {
    const rows = listRows(type), count = rows.filter(pending).length, key = context();
    return `<p class="issue-list-summary">${count} 项待处理 · ${rows.length-count} 项已处理</p>` +
      ui.table([{ key:'title',label:'事项' }, {key:'tenantId',label:'所属租户',render:id=>esc(CloudCallRuntime.tenant(id)?.name || id)},
        {key:'status',label:'状态',render:(_,row)=>ui.status(pending(row)?'待处理':'已处理')},
        {key:'exceptionId',label:'操作',render:(id,row)=>`<button class="btn-link" onclick="${command('detail',id,key)}">${pending(row)?'查看与处理':'查看记录'}</button>`}],ui.sortByUpdated?.(rows)||rows,{emptyText:'暂无配置异常记录'});
  }
  function openList(type, key) {
    if(key && key !== context() || !listRows(type).length)return;
    const title = type === '坐席创建' ? '坐席配置异常记录' : '技能配置异常记录';
    ui.openLayer('business-issues-list',`<div class="layer-header"><h2>${title}</h2><button type="button" onclick="BusinessIssues.closeList()">×</button></div><div class="layer-body" id="business-issues-list-content">${listContent(type)}</div><div class="layer-footer"><button class="btn" type="button" onclick="BusinessIssues.closeList()">关闭</button></div>`,'wide',{objectKey:type,onRestore:refresh});
    const node = document.getElementById('business-issues-list');node.dataset.issueType = type;node.dataset.issueContext = context();
  }
  function refresh() {
    document.querySelectorAll('[data-issue-type].business-issue-notice').forEach(node => {
      const template = document.createElement('template');template.innerHTML = section(node.dataset.issueType);
      const replacement = template.content.firstElementChild;
      if(!replacement){node.remove();return;}
      if(!node.isEqualNode(replacement)){
        const focused = node.contains(document.activeElement);node.replaceWith(replacement);
        if(focused)replacement.querySelector('button')?.focus({preventScroll:true});
      }
    });
    const node = document.getElementById('business-issues-list');
    if(node && node.dataset.issueContext === context()){
      const body = node.querySelector('#business-issues-list-content'),scrollTop = body.scrollTop;
      const template = document.createElement('template');template.innerHTML = listContent(node.dataset.issueType);
      if(body.innerHTML !== template.innerHTML)body.replaceChildren(template.content);
      body.scrollTop = scrollTop;
    }
  }
  function closeList() { ui.closeLayer('business-issues-list');refresh(); }
  function detail(id, key) {
    if(key && key !== context())return;
    const row = find(id);
    if (!allowed(row)) return;
    const source = sync(row);
    if(source && window.Pages?.['agent-center']?.openSyncRecord){Pages['agent-center'].openSyncRecord(source.syncId);return;}
    const reason = row.type === '坐席创建' ? '坐席登录名已被使用，请修改后重新提交。' : '尚未确认服务团队是否创建成功。先重新核对，不重复创建。';
    ui.openLayer('business-issue', '<div class="layer-header"><h2>'+esc(row.type === '技能同步' ? '服务技能配置未完成' : row.title)+'</h2><button onclick="PlatformUI.closeLayer(\'business-issue\')">×</button></div><div class="layer-body">'+
      ui.detailSection('处理说明','<p>'+esc(pending(row)?reason:'已处理，原失败记录继续保留。')+'</p><p>'+esc(row.impact)+'</p>')+
      ui.detailSection('操作记录',ui.timeline((row.trace||[]).map(item=>({title:item.action,time:item.at,detail:item.result}))))+
      '<details class="technical-details"><summary>技术信息</summary><p>'+esc(row.reason)+'</p><p>'+esc(source?.requestId||row.requestId)+'</p></details></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'business-issue\')">关闭</button>'+
      (pending(row)?'<button class="btn btn-primary" onclick="BusinessIssues.handle(\''+esc(id)+'\')">'+(row.type==='坐席创建'?'修改后重新提交':'重新核对')+'</button>':'')+'</div>','wide');
  }
  function handle(id) {
    const row = find(id);
    if (!allowed(row) || !pending(row)) return;
    if (row.type === '坐席创建') {
      ui.closeLayer('business-issue'); Pages['agent-center'].openSingle(sync(row)?.syncId); return;
    }
    if (row.type !== '技能同步') return;
    // 无厂商回执的演示样例保持未知，不能通过一次按钮操作宣布成功。
    const source = sync(row);
    if (!source) return;
    source.retryCount = (source.retryCount || 0)+1;
    source.status = '核查中';
    source.updatedAt = new Date().toLocaleString('zh-CN', {hour12:false});
    record(row,'重新核对服务技能','仍未取得明确结果，保留原配置，不重复创建（本地演示）',false);
    detail(id); showToast('尚未确认创建结果，已保留核对记录','warning');
  }
  window.BusinessIssues = { open, section, openList, closeList, detail, handle, pending, record, refresh };
})();
