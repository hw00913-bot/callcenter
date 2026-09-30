/** Customer-directory views: authorization is resolved again on every action. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, directory = CustomerDirectory;
  const api = "window.Pages['customer-directory']", detailId = 'customer-directory-detail';
  let keyword = '', contactFilter = '', sourceFilter = '', page = 1, context = '';
  let activeId = '', callPage = 1, batchPage = 1, callFilter = '';
  const pageSize = 10;
  const sorted=(rows,fallback)=>ui.sortByUpdated?.(rows,fallback)||rows;
  const arg = value => esc(JSON.stringify(String(value || '')));
  const tenantName = id => CloudCallData.tenants.find(row => row.tenantId === id)?.name || id;
  const accountName = id => CloudCallData.accounts.find(row => row.accountId === id)?.name || '待分配';
  function refresh() { navigateTo('customer-directory', { preserveFilters: true }); }
  function contextKey() { const c = AppState.get(); return [c.accountId, c.tenantId, c.enterpriseId, c.activeDomain].join(':'); }
  function reset(options) {
    if (options?.preserveFilters && context === contextKey()) return;
    keyword = ''; contactFilter = ''; sourceFilter = ''; page = 1; context = contextKey();
  }
  function source(customer) { return customer.batches.length ? '客户导入' : '直接联系'; }
  function follows(customer) { return [...new Set(customer.batches.map(row => row.followup || '待联系'))].join('、') || '无批次跟进'; }
  function rows() {
    return sorted(directory.list().filter(customer => (!keyword || [customer.name, customer.phone, ...customer.names, ...customer.batches.map(row => row.externalDocumentId || ''), ...customer.calls.map(call => call.externalDocumentId || '')].join(' ').toLowerCase().includes(keyword.toLowerCase())) &&
      (!contactFilter || (contactFilter === 'called' ? customer.callCount > 0 : customer.callCount === 0)) &&
      (!sourceFilter || source(customer) === sourceFilter)));
  }
  function storageNote() {
    const status = directory.status();
    if (status.storageIssue) return '<p class="customer-directory-warning" role="alert">' + esc(status.storageIssue) + '</p>';
    return '';
  }
  function render(options) {
    reset(options);
    const customers = rows(), pages = Math.max(1, Math.ceil(customers.length / pageSize)); page = Math.min(page, pages);
    return '<section class="platform-page customer-directory-page">' +
      ui.pageHeader('客户档案', '按客户号码查看联系历史，保留每次导入和跟进进度。', '<button class="btn" onclick="' + api + '.refresh()">刷新</button>') +
      '<div class="filter-panel"><label class="field"><span>客户 / 单据标识</span><input id="directory-keyword" value="' + esc(keyword) + '" placeholder="称呼、号码或外部单据标识"></label>' +
      '<label class="field"><span>联系情况</span><select id="directory-contact"><option value="">全部</option><option value="called"' + (contactFilter === 'called' ? ' selected' : '') + '>已有通话记录</option><option value="uncalled"' + (contactFilter === 'uncalled' ? ' selected' : '') + '>尚无通话记录</option></select></label>' +
      '<label class="field"><span>客户来源</span><select id="directory-source"><option value="">全部</option>' + ['客户导入', '直接联系'].map(value => '<option' + (sourceFilter === value ? ' selected' : '') + '>' + value + '</option>').join('') + '</select></label>' +
      '<div class="filter-actions"><button class="btn btn-primary" onclick="' + api + '.query()">查询</button><button class="btn" onclick="' + api + '.resetFilters()">重置</button></div></div>' + storageNote() +
      '<section class="panel-card"><div class="panel-header"><h2>客户列表</h2><span class="customer-directory-count">共 ' + customers.length + ' 位客户</span></div>' +
      ui.table([
        { key: 'name', label: '客户称呼', render: (value, row) => '<button class="table-link" onclick="' + api + '.openDetail(' + arg(row.id) + ')"><strong>' + esc(value) + '</strong></button>' },
        { key: 'phone', label: '客户号码' },
        ...(AppState.effectiveAccess().roleCode === 'SUPER_ADMIN' ? [{ key: 'tenantId', label: '所属租户', render: value => esc(tenantName(value)) }] : []),
        { key: 'batchCount', label: '导入批次', help: '同号客户可能在多批次出现，批次之间的分配和进度相互独立。', render: value => value ? value + ' 批' : '无导入批次' },
        { key: 'id', label: '批次跟进状态', help: '展示当前可见各批次的跟进状态，不用一次接通覆盖其他批次进度。', render: (_, row) => esc(follows(row)) },
        { key: 'callCount', label: '通话次数' },
        { key: 'lastCall', label: '最近联系', render: value => value ? esc(directory.at(value) || '时间未记录') + '<div class="table-sub">' + esc(directory.result(value)) + '</div>' : '尚未联系' },
        { key: 'id', label: '操作', className: 'action-column', render: value => '<button class="btn-link" onclick="' + api + '.openDetail(' + arg(value) + ')">查看档案</button>' }
      ], customers.slice((page - 1) * pageSize, page * pageSize), { rowOffset: (page - 1) * pageSize, emptyText: '暂无符合条件的客户档案', emptyDetail: '导入客户或完成临时拨号后，将在当前权限范围内归档。', footer: ui.pagination(customers.length, page, pageSize, api + '.setPage') }) + '</section></section>';
  }
  function callTable(customer) {
    const calls = sorted(customer.calls.filter(call => !callFilter || call.callType === callFilter),call=>{const data=window.CloudCallRecords?.display(call);return data?[data.endAt,data.startAt]:directory.at(call);});
    callPage = Math.min(callPage, Math.max(1, Math.ceil(calls.length / pageSize)));
    const types = [...new Set(customer.calls.map(call => call.callType || '历史通话'))];
    return '<section class="customer-directory-section"><div class="customer-directory-section-head"><h3>联系历史 <span>' + calls.length + ' 次</span></h3><label>外呼类型 <select aria-label="筛选联系历史类型" onchange="' + api + '.setCallFilter(this.value)"><option value="">全部</option>' + types.map(type => '<option value="' + esc(type) + '"' + (type === callFilter ? ' selected' : '') + '>' + esc(ui.callTypeLabel(type)) + '</option>').join('') + '</select></label></div>' +
      ui.table([
        { key: 'callId', label: '联系时间', render: (_, row) => esc(directory.at(row) || '未记录') },
        { key: 'callId', label: '联系轮次', render: (_, row) => esc(window.RepeatPredictive?.contactLabel(row) || '—') },
        { key: 'callType', label: '外呼类型' },
        { key: 'businessType', label: '业务类型', render: (_, row) => esc(CustomerBusiness.typeLabel(row)) },
        { key: 'externalDocumentId', label: '业务单据', render: (value, row) => esc(CustomerBusiness.codeLabel(row)) + '：' + esc(value || '—') },
        { key: 'agentName', label: '实际坐席', render: value => esc(value || '未记录 / 无人参与') },
        { key: 'result', label: '通话结果', render: (_, row) => esc(directory.result(row)) },
        { key: 'durationSeconds', label: '时长', help: '历史快照缺少时长时显示“未记录”，不计为 0 秒。', render: (_, row) => esc(directory.duration(row)) },
        { key: 'agentDisposition', label: '处理结果', render: (_, row) => esc(directory.dispositionLabel(row) || '未填写 / 未记录') },
        { key: 'callId', label: '操作', className: 'action-column', render: value => '<button class="btn-link" onclick="' + api + '.openCall(' + arg(value) + ')">通话详情</button>' }
      ], calls.slice((callPage - 1) * pageSize, callPage * pageSize), { rowOffset: (callPage - 1) * pageSize, emptyText: '尚无联系历史', emptyDetail: '只导入或分配客户不会生成通话；完成呼叫后可在此查看。', footer: ui.pagination(calls.length, callPage, pageSize, api + '.setCallPage') }) + '</section>';
  }
  function batchTable(customer) {
    const batches=sorted(customer.batches);
    batchPage = Math.min(batchPage, Math.max(1, Math.ceil(customer.batches.length / pageSize)));
    return '<section class="customer-directory-section"><div class="customer-directory-section-head"><h3>导入与分配记录 <span>' + customer.batches.length + ' 条</span></h3></div>' +
      ui.table([
        { key: 'batchName', label: '导入批次' }, { key: 'createdAt', label: '导入时间' },
        { key: 'name', label: '本批次称呼' },
        { key: 'businessType', label: '业务类型', render: (_, row) => esc(CustomerBusiness.typeLabel(row)) },
        { key: 'externalDocumentId', label: '业务单据', render: (value, row) => '<span class="customer-directory-note">' + esc(CustomerBusiness.codeLabel(row)) + '：' + esc(value || '—') + '</span>' },
        { key: 'method', label: '外呼方式', render: value => esc(ui.callTypeLabel(value) || '待分配') },
        { key: 'ownerId', label: '分配对象', render: (value, row) => esc(row.taskId ? row.taskName || row.taskId : accountName(value)) },
        { key: 'followup', label: '跟进状态' },
        { key: 'note', label: '联系备注', render: value => value ? '<span class="customer-directory-note">' + esc(value) + '</span>' : '—' }
      ], batches.slice((batchPage - 1) * pageSize, batchPage * pageSize), { rowOffset: (batchPage - 1) * pageSize, emptyText: '此客户尚无导入批次', emptyDetail: '临时拨号可独立归档，不自动新建或完成导入任务。', footer: ui.pagination(customer.batches.length, batchPage, pageSize, api + '.setBatchPage') }) + '</section>';
  }
  function openDetail(id, preserve) {
    const customer = directory.find(id);
    if (!customer) { ui.closeLayer(detailId); showToast('当前客户已不在可查看范围内', 'warning'); return false; }
    if (!preserve || id !== activeId) { callPage = 1; batchPage = 1; callFilter = ''; }
    activeId = id;
    const totalDuration = customer.callCount > 0 && customer.unknownDurationCount === customer.callCount ? '未记录' : directory.duration({ durationSeconds: customer.totalDurationSeconds });
    ui.openLayer(detailId, '<div class="layer-header"><div><h2>客户档案</h2><p>' + esc(customer.name) + ' · ' + esc(customer.phone) + '</p></div><button aria-label="关闭客户档案" onclick="PlatformUI.closeLayer(\'' + detailId + '\')">×</button></div>' +
      '<div class="layer-body customer-directory-detail">' + storageNote() +
      '<section class="customer-directory-summary"><div><span>所属租户</span><strong>' + esc(tenantName(customer.tenantId)) + '</strong></div><div><span>导入批次</span><strong>' + customer.batchCount + '</strong></div><div><span>通话次数</span><strong>' + customer.callCount + '</strong></div><div><span>已记录通话时长 ' + ui.help('只累计有明确时长的通话。', '累计时长口径') + '</span><strong>' + totalDuration + '</strong>' + (customer.unknownDurationCount ? '<small>' + customer.unknownDurationCount + ' 次时长未记录</small>' : '') + '</div></section>' +
      (customer.names.length > 1 ? '<p class="customer-directory-aliases">历史称呼：' + esc(customer.names.join('、')) + '</p>' : '') +
      '<section class="customer-directory-section"><div class="customer-directory-section-head"><h3>客户业务信息</h3>' + (window.RepeatPredictive?.customerActions(customer) || '') + '</div>' + CustomerFollowup.detail(customer.followup) + '</section>' +
      callTable(customer) + batchTable(customer) + '</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'' + detailId + '\')">关闭</button></div>', 'wide');
    return true;
  }
  window.Pages = window.Pages || {};
  window.Pages['customer-directory'] = {
    captureNavigationState(){return {keyword,contactFilter,sourceFilter,page,context,activeId,callPage,batchPage,callFilter};},
    restoreNavigationState(state){if(state)({keyword,contactFilter,sourceFilter,page,context,activeId,callPage,batchPage,callFilter}=state);},
    render, refresh, openDetail,
    refreshSummary() { const node = document.querySelector('.customer-directory-page'); if (node) node.outerHTML = render({ preserveFilters: true }); },
    init(options) { if (options?.customerId) openDetail(options.customerId); },
    query() { keyword = (document.getElementById('directory-keyword')?.value || '').trim(); contactFilter = document.getElementById('directory-contact')?.value || ''; sourceFilter = document.getElementById('directory-source')?.value || ''; page = 1; refresh(); },
    resetFilters() { reset(); refresh(); },
    setPage(value) { page = Math.max(1, Number(value) || 1); refresh(); },
    setCallPage(value) { callPage = Math.max(1, Number(value) || 1); openDetail(activeId, true); },
    setBatchPage(value) { batchPage = Math.max(1, Number(value) || 1); openDetail(activeId, true); },
    setCallFilter(value) { callFilter = value; callPage = 1; openDetail(activeId, true); },
    openCall(id) { const customer = directory.find(activeId); if (customer?.calls.some(call => call.callId === id)) window.Pages['cloud-call-records']?.openCall(id); else showToast('当前记录已不在客户授权范围内', 'warning'); }
  };
})();
