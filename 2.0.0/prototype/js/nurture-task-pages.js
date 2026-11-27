(() => {
  'use strict';

  const page = {id:'PAGE-21008',route:'nurture-task-assignment',name:'分配审核',
    description:'按分配场景查看任务并指派本租户坐席。'};
  const workbench = DNav.pages.findIndex(page=>page.id==='PAGE-2202');
  const seatPage = DNav.pages[workbench];
  DNav.areaAliases['管理员工作台'] = seatPage.area;
  DNav.pages.splice(workbench+1,0,{...seatPage,id:page.id,route:page.route,name:page.name});
  const originalPage = DRolePermissions.page;
  DRolePermissions.page = (id,context,seat) => id===page.id
    ? window.DReview21Operations?.canView(context) === true
    : originalPage(id,context,seat);

  const cloud = DNativeModules.cloud;
  const anchor = '  parent.DNav.pages.filter(p=>p.menu).forEach(p=>{';
  const {id,route,name,description} = page;
  const routeDefinition = `  routes[${JSON.stringify(route)}] = ${JSON.stringify({key:route,page:route,label:name,
    permission:'cloud.tasks',domain:'CLOUD_CONTACT_CENTER'})};
  window.Pages[${JSON.stringify(route)}] = {render:()=>'<section class="platform-page op-nurture-page" data-nurture-page="${id}" data-rtl-page-type="list">'+
    '<div data-rtl-region="page-header">'+PlatformUI.pageHeader(${JSON.stringify(name)},${JSON.stringify(description)})+'</div>'+
    '<div data-nurture-host><p role="status">正在读取本租户任务…</p></div></section>'};`;
  if (cloud.html.indexOf(anchor)===-1 || cloud.html.indexOf(anchor)!==cloud.html.lastIndexOf(anchor)) {
    throw new Error('无法定位坐席工作台的培育任务入口');
  }
  cloud.html = cloud.html.replace(anchor,routeDefinition+'\n'+anchor);

  const styles = `
    .op-nurture-page .filter-panel.op-filter{flex-wrap:nowrap;gap:12px;overflow-x:auto}
    .op-nurture-page .filter-panel.op-filter .field{flex:1 1 125px;min-width:128px;max-width:220px}
    .op-nurture-page .filter-panel.op-filter .field:first-child{flex-basis:220px;min-width:180px;max-width:330px}
    .op-nurture-page .filter-panel.op-filter .field :is(input,select){flex:1 1 0;min-width:60px;max-width:none;width:0}
    .op-nurture-page .filter-panel.op-filter .filter-actions{flex:0 0 auto;margin-left:auto}
    .op-nurture-page .list-toolbar,.op-nurture-page .toolbar-secondary{flex-wrap:wrap}
    .op-assignment-tabs{overflow-x:auto;white-space:nowrap}
    .op-assignment-tabs .platform-tab{flex:0 0 auto}
    .op-nurture-table :is(th,td){white-space:nowrap}
    .op-nurture-table .op-wait-reason{white-space:normal;min-width:125px}
    .op-nurture-table td>small{display:block;margin-top:4px}
    .op-nurture-table tbody .action-column{background:#fff}
    .op-nurture-table tbody tr:hover .action-column{background:#f5f8ff}
    .op-nurture-footer{flex-wrap:wrap}
    .op-nurture-footer .form-select{width:auto}
  `;
  const entries = new WeakMap();
  let pendingTask;
  const assignmentStatuses = [['待分配','人工外呼待分配'],['待指定','企微待指定'],['待改派','企微待改派'],['待下发','下发坐席待指派']];
  const assignmentLabels = new Map(assignmentStatuses);
  const e = value => DUI.esc(String(value??''));
  const statusTone = {待分配:'warning',待指定:'warning',待改派:'warning',待下发:'processing'};
  const available = (value,fallback='—') => value==null||value==='' ? fallback : value;
  const seatName = (state,id) => state.seats.find(seat=>seat.id===id)?.name || '—';
  const ops = () => window.DReview21Operations;
  const wecomAssignment = (state,task) => window.DSkynetIntake?.wecomAssignmentState?.(state,DSession.context(),task);
  const emptyFilters = () => ({keyword:''});
  function assignmentState(state,task) {
    if (!ops().isSkynetTask(task)) return '';
    const wecom = wecomAssignment(state,task);
    if (wecom) return ['待指定','待改派'].includes(wecom.status) ? wecom.status : '';
    if (ops().canQueue(state,task)) return ops().awaitsDeliveryOwner(task) ? '待下发' : '待分配';
    return '';
  }

  function taskRows(entry) {
    const {state} = entry;
    const context = DSession.context();
    const batches = new Map((state.skynetReceipts || [])
      .filter(receipt=>window.DSkynetIntake.canRead(context,receipt)).map(receipt=>[receipt.id,receipt]));
    return state.records.flatMap(task=>{
      if (task.tenant!==state.tenant || !task.taskId || !ops().canViewTask(task) ||
          task.requiredMode==='AI 外呼' && !task.skynet?.processing) return [];
      const status = assignmentState(state,task);
      if (!status) return [];
      const receipt = batches.get(task.skynet.intakeId);
      const batch = receipt && (receipt.taskId===task.taskId || !receipt.taskId && receipt.recordId===task.id) ? receipt : null;
      const localLeadCode = task.localLeadCode || batch?.localLeadCode ||
        (task.leadKind==='derived' || batch?.leadKind==='derived' ? '' : task.originalKey);
      return [{task,status,batchId:batch?.id,localLeadCode}];
    });
  }

  function filteredRows(entry,rows) {
    const keyword = entry.filters.keyword.toLowerCase();
    return rows.filter(({task,batchId,localLeadCode,status})=>status===entry.tab &&
      (!keyword || [task.name,task.phone,task.taskId,task.originalKey,task.smartCode,task.category,task.source,
        task.skynet?.roundId,task.skynet?.processing?.method,task.skynet?.processing?.destination,batchId,localLeadCode]
        .join(' ').toLowerCase().includes(keyword)));
  }

  function columns(entry) {
    const {state} = entry;
    const customer = [['客户',({task})=>task.name],['联系电话',({task})=>task.phone]];
    return [['导入批次',row=>row.batchId],['本地线索编码',row=>row.localLeadCode],['任务 ID',({task})=>task.taskId],
      ...customer,['业务分类',({task})=>task.category],['分配状态',row=>row.status],
      ['处理去向',({status})=>{
        if (status==='待指定') return '指定企微坐席';
        if (status==='待改派') return '改派企微坐席';
        if (status==='待下发') return '指派下发坐席';
        return '指派人工外呼坐席';
      }],
      ['跟进坐席',({task})=>seatName(state,task.ownerId)],
      ['等待原因',({task})=>ops().waitReason(state,task)||task.waitReason]];
  }

  function switchAssignmentTab(entry, tab) {
    if (entry.tab===tab || !assignmentLabels.has(tab)) return;
    const {page,filters,filterDraft} = entry;
    entry.tabViews.set(entry.tab,{page,filters,filterDraft});
    Object.assign(entry,entry.tabViews.get(tab) || {page:1,filters:emptyFilters(),filterDraft:null},{tab});
  }

  function assignmentTabs(entry,rows) {
    return '<div class="platform-tabs op-assignment-tabs" role="tablist" aria-label="分配场景">'+
      assignmentStatuses.map(([status,label],index)=>{
        const selected = status===entry.tab;
        const count = rows.filter(row=>row.status===status).length;
        return `<button type="button" id="op-assignment-tab-${index}" class="platform-tab${selected?' active':''}"
          role="tab" aria-selected="${selected}" aria-controls="op-assignment-list" tabindex="${selected?'0':'-1'}"
          data-assignment-tab="${e(status)}">${e(label)} <span class="op-pill" aria-hidden="true">${count}</span></button>`;
      }).join('')+'</div>';
  }

  function activateAssignmentTab(entry,tab) {
    if (!ops().current(entry)) return;
    switchAssignmentTab(entry,tab);
    draw(entry);
    entry.host.querySelector('[role="tab"][aria-selected="true"]')?.focus();
  }

  function options(values,selected) {
    return values.map(([value,label])=>`<option value="${e(value)}"${value===selected?' selected':''}>${e(label)}</option>`).join('');
  }

  function exportRows(entry,rows) {
    if (!ops().current(entry) || !rows.length) return;
    const files = entry.host.ownerDocument.defaultView.DImportFiles;
    const definition = columns(entry);
    const textCell = value => /^\s*[=+@-]/.test(String(value??'')) ? "'"+value : value;
    const csv = files.toCsv([definition.map(([label])=>label),...rows.map(row=>definition.map(([,read])=>textCell(read(row))))]);
    files.save({fileName:entry.name+'_'+entry.state.today+'.csv',bytes:new TextEncoder().encode('\uFEFF'+csv),mime:'text/csv;charset=utf-8'});
  }

  function listSignature(state,rows) {
    return JSON.stringify([rows,state.seats,state.seatModes,state.schedules]);
  }

  function draw(entry,rows=taskRows(entry)) {
    if (!ops().current(entry)) return;
    const {state,host} = entry;
    const tableScroll = host.querySelector('.op-nurture-scroll')?.scrollLeft || 0;
    const writable = ops().canManage();
    const filters = entry.filterDraft || entry.filters;
    const visible = filteredRows(entry,rows), definition = columns(entry);
    entry.signature=listSignature(state,rows);
    const max = Math.max(1,Math.ceil(visible.length/entry.size));
    entry.page = Math.min(entry.page,max);
    const list = visible.slice((entry.page-1)*entry.size,entry.page*entry.size);
    const heading = assignmentLabels.get(entry.tab);
    const rowMarkup = row=>{
      const {task,batchId,status} = row;
      return `<tr data-task-id="${e(task.taskId)}">
      ${definition.map(([label,read])=>{
        const value=available(read(row));
        let text=e(value);
        if (label==='导入批次' && batchId) {
          text=`<button type="button" class="btn-link" data-assignment-batch="${e(batchId)}">${e(value)}</button>`;
        } else if (label==='任务 ID') {
          text=`${e(value)}<small class="op-help">${e(task.source || '接入线索')} · ${e(task.skynet.roundId)}</small>`;
        } else if (label==='分配状态') {
          text=`<span class="status-badge ${statusTone[value]||'neutral'}"><i aria-hidden="true"></i>${e(value)}</span>`;
        }
        return `<td${label==='等待原因'?' class="op-wait-reason"':''}>${text}</td>`;
      }).join('')}
      <td class="action-column"><div class="table-actions"><button type="button" class="btn btn-sm" data-detail="${e(task.id)}">详情</button>
      ${writable&&ops().canAssign(state,task)?`<button type="button" class="btn btn-sm btn-primary" data-dispatch="${e(task.id)}">${status==='待改派'?'改派':'指派'}</button>`:''}</div></td></tr>`;
    };
    const tabIndex = assignmentStatuses.findIndex(([status])=>status===entry.tab);
    host.innerHTML = `${assignmentTabs(entry,rows)}<div id="op-assignment-list" role="tabpanel" aria-labelledby="op-assignment-tab-${tabIndex}">
      <form class="filter-panel op-filter" data-rtl-region="filters" aria-label="${e(heading)}筛选">
      <label class="field"><span>搜索任务</span><input class="form-control" type="search" name="keyword" placeholder="批次、线索、任务 ID、客户或电话" value="${e(filters.keyword)}"></label>
      <div class="filter-actions"><button class="btn btn-primary" type="submit">查询</button><button class="btn" type="button" data-reset>重置</button></div></form>
      <div class="table-card"><div class="list-toolbar" data-rtl-region="toolbar"><div><strong>${e(heading)}</strong> <span class="op-pill">${visible.length} 条</span></div>
      <div class="toolbar-secondary">${writable?'<button class="btn" type="button" data-assignment-generate-samples>生成模拟任务</button>':''}
      <button class="btn" type="button" data-export${visible.length?'':' disabled'}>导出</button></div></div>
      <div class="table-scroll op-nurture-scroll" data-rtl-region="table" role="region" tabindex="0" aria-label="${e(heading)}列表"><table class="platform-table op-nurture-table"><thead><tr>
      ${definition.map(([label])=>`<th scope="col">${e(label)}</th>`).join('')}<th class="action-column" scope="col">操作</th></tr></thead>
      <tbody>${list.map(rowMarkup).join('')||`<tr><td class="op-empty" colspan="${definition.length+1}">当前条件下暂无任务</td></tr>`}</tbody></table></div>
      <div class="list-pagination op-nurture-footer" data-rtl-region="pagination"><span>共 ${visible.length} 条记录</span><div>
      <button type="button" aria-label="上一页" data-step="-1"${entry.page<=1?' disabled':''}>‹</button><span>第 ${entry.page} / ${max} 页</span>
      <button type="button" aria-label="下一页" data-step="1"${entry.page>=max?' disabled':''}>›</button>
      <select class="form-select" aria-label="每页显示条数" data-size>${options([10,20,50].map(n=>[n,'每页 '+n+' 条']),entry.size)}</select></div></div></div></div>`;
    host.querySelector('.op-nurture-scroll').scrollLeft=tableScroll;
    const form = host.querySelector('form');
    const readFilters = () => ({...emptyFilters(),...Object.fromEntries(new host.ownerDocument.defaultView.FormData(form))});
    form.oninput = ()=>{entry.filterDraft=readFilters();};
    form.onsubmit = event=>{
      event.preventDefault();const values=readFilters();
      entry.filters={...values,keyword:values.keyword.trim()};entry.filterDraft=null;
      entry.page=1;draw(entry);
    };
    const generate = host.querySelector('[data-assignment-generate-samples]');
    if (generate) generate.onclick=()=>{
      if (!ops().current(entry) || !ops().canManage()) return;
      const state = DReview21.state({reload:true});
      if (!state) return DUI.toast('当前租户任务暂不可读取，请刷新后重试。');
      const result = window.DSkynetIntake.generateAssignmentSamples(state,DSession.context(),entry.tab);
      if (!result.ok) return DUI.toast(result.error);
      entry.state=state;
      entry.filters=emptyFilters();entry.filterDraft=null;entry.page=1;
      draw(entry);
      host.querySelector('[data-assignment-generate-samples]')?.focus();
      DUI.toast('已生成 '+result.count+' 条'+assignmentLabels.get(entry.tab)+'模拟任务。');
    };
    host.querySelector('[data-reset]').onclick=()=>{entry.filters=emptyFilters();entry.filterDraft=null;entry.page=1;draw(entry);};
    const tabs = Array.from(host.querySelectorAll('[data-assignment-tab]'));
    tabs.forEach((button,index)=>{
      button.onclick=()=>activateAssignmentTab(entry,button.dataset.assignmentTab);
      button.onkeydown=event=>{
        const next = {ArrowLeft:(index+tabs.length-1)%tabs.length,ArrowRight:(index+1)%tabs.length,
          Home:0,End:tabs.length-1}[event.key];
        if (!Number.isInteger(next)) return;
        event.preventDefault();
        activateAssignmentTab(entry,tabs[next].dataset.assignmentTab);
      };
    });
    host.querySelectorAll('[data-assignment-batch]').forEach(button=>button.onclick=()=>{
      if (!ops().current(entry)) return;
      const batchId = button.dataset.assignmentBatch;
      if (!taskRows(entry).some(row=>row.status===entry.tab && row.batchId===batchId)) return;
      if (!window.DReview21InlineIntake.openSkynetReceipt(batchId)) DUI.toast('当前无法打开这条导入批次。');
    });
    host.querySelectorAll('[data-detail],[data-dispatch]').forEach(button=>button.onclick=()=>{
      const row = taskRows(entry).find(item=>item.status===entry.tab &&
        item.task.id===(button.dataset.detail||button.dataset.dispatch));
      if (row) ops().showDetail(entry,row.task);
    });
    host.querySelector('[data-export]').onclick=()=>exportRows(entry,visible);
    host.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{entry.page+=Number(button.dataset.step);draw(entry);});
    host.querySelector('[data-size]').onchange=event=>{entry.size=Number(event.target.value);entry.page=1;draw(entry);};
  }

  function mount(options) {
    if (options.id!==page.id || !ops().canView(options.context)) return;
    const doc = options.frame.contentDocument;
    const root = doc?.querySelector('#page-content [data-nurture-page="'+page.id+'"]');
    const host = root?.querySelector('[data-nurture-host]');
    const state = host && options.getState();
    if (!state) return;
    if (!doc.getElementById('review21-nurture-task-style')) {
      const style = doc.createElement('style');style.id='review21-nurture-task-style';style.textContent=ops().style+styles;doc.head.append(style);
    }
    let entry = entries.get(host);
    if (!entry) {
      const {account,scope} = options.context;
      entry = {host,pageId:page.id,name:page.name,tab:assignmentStatuses[0][0],
        tabViews:new Map(),identity:account.id+'|'+scope.id,
        page:1,size:10,filters:emptyFilters(),refresh:draw};
      entries.set(host,entry);
    }
    entry.state=state;
    if (pendingTask?.identity===entry.identity) {
      const {taskId} = pendingTask;
      pendingTask = null;
      const task = state.records.find(row=>row.taskId===taskId && ops().isSkynetTask(row) && ops().canViewTask(row));
      if (task) {
        const status=assignmentState(state,task);
        if (status) switchAssignmentTab(entry,status);
        entry.filters={...emptyFilters(),keyword:status?taskId:''};
        entry.filterDraft=null;entry.page=1;
        draw(entry);ops().showDetail(entry,task);
        return;
      }
    }
    const rows=taskRows(entry);
    if (listSignature(state,rows)!==entry.signature) draw(entry,rows);
  }

  function openTask(taskId) {
    const context = DSession.context();
    if (!ops().canManage(context) || !DSession.allowed(page.id,context)) return false;
    const task = DReview21.state()?.records.find(row=>row.taskId===taskId && ops().isSkynetTask(row) && ops().canViewTask(row,context));
    if (!task) return false;
    pendingTask={taskId,identity:context.account.id+'|'+context.scope.id};
    return DApp.openPage(page.id);
  }

  window.DReview21NurtureTasks = {mount,openTask};
})();
