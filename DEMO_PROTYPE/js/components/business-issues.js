/** 失败记录在所属业务页面处理；不建立独立工单或人工复检流程。 */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape;
  const routes = { '坐席创建': 'agent-maintenance', '技能同步': 'skill-mappings', '结果回流': 'cloud-callbacks' };
  function allowed(row) {
    return !!row && AppState.effectiveAccess().valid && AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER' &&
      AppState.effectiveAccess().roleCode !== 'OPERATOR' && AppState.authorizeObject('', row);
  }
  function find(id) { return CloudCallData.exceptions.find(row => row.exceptionId === id); }
  function sync(row) { return CloudCallData.syncRecords.find(item => item.objectId === row.objectId); }
  function pending(row) {
    const source = row.type === '结果回流' ? CloudCallData.callbacks.find(item => item.callbackId === row.objectId) : sync(row);
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
  }
  function open(id) {
    const row = find(id);
    if (!allowed(row) || !routes[row.type]) return false;
    navigateTo(routes[row.type]);
    if (row.type === '结果回流') Pages['cloud-call-records'].openCallback(row.objectId);
    else detail(id);
    return true;
  }
  function section(type) {
    const rows = AppState.scoped(CloudCallData.exceptions).filter(row => row.type === type && allowed(row));
    if (!rows.length) return '';
    return '<details class="panel-card"' + (rows.some(pending) ? ' open' : '') + '><summary style="padding:16px;cursor:pointer">配置失败记录（' + rows.filter(pending).length + ' 项待处理）</summary>' +
      ui.table([{ key:'title',label:'事项' }, {key:'tenantId',label:'所属租户',render:id=>esc(CloudCallRuntime.tenant(id)?.name || id)},
        {key:'status',label:'状态',render:(_,row)=>ui.status(pending(row)?'待处理':'已处理')},
        {key:'exceptionId',label:'操作',render:id=>'<button class="btn-link" onclick="BusinessIssues.detail(\''+esc(id)+'\')">查看与处理</button>'}],rows) + '</details>';
  }
  function detail(id) {
    const row = find(id);
    if (!allowed(row)) return;
    const source = sync(row);
    const reason = row.type === '坐席创建' ? '坐席登录名已被使用，请修改后重新提交。' : '尚未确认服务团队是否创建成功。先重新核对，不重复创建。';
    ui.openLayer('business-issue', '<div class="layer-header"><h2>'+esc(row.type === '技能同步' ? '服务技能配置未完成' : row.title)+'</h2><button onclick="PlatformUI.closeLayer(\'business-issue\')">×</button></div><div class="layer-body">'+
      ui.detailSection('处理说明','<p>'+esc(pending(row)?reason:'已处理，原失败记录继续保留。')+'</p><p>'+esc(row.impact)+'</p>')+
      ui.detailSection('操作记录',ui.timeline((row.trace||[]).map(item=>({title:item.action,time:item.at,detail:item.result}))))+
      '<details class="technical-details"><summary>技术信息</summary><p>'+esc(row.reason)+'</p><p>'+esc(source?.requestId||row.requestId)+'</p></details></div><div class="layer-footer"><span class="layer-footer-note">本地演示</span><button class="btn" onclick="PlatformUI.closeLayer(\'business-issue\')">关闭</button>'+
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
  window.BusinessIssues = { open, section, detail, handle, pending, record };
})();
