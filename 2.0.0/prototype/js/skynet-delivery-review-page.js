(() => {
  'use strict';

  const pageId = 'PAGE-21015';
  const pageName = '下发审核';
  const e = DUI.esc;
  const statuses = new Map([['pending','待审核'],['approved','已通过'],['rejected','已驳回']]);
  const shanghaiTime = new Intl.DateTimeFormat('zh-CN',{
    timeZone:'Asia/Shanghai', dateStyle:'short', timeStyle:'short', hour12:false
  });
  const service = () => window.DSkynetIntake;
  const canManage = context => window.DReview21Operations?.canManage(context) === true;
  const sameScope = (a,b) => a?.account.id===b?.account.id && a?.scope.id===b?.scope.id &&
    a?.scope.tenant?.brandId===b?.scope.tenant?.brandId;
  const display = value => value == null || value==='' ? '—' : value;

  function current(view) {
    const context = DSession.context();
    return view.root.isConnected && DApp.currentPage()===pageId && sameScope(context,view.context) && canManage(context);
  }

  function timestamp(value) {
    const time = Date.parse(value);
    return Number.isFinite(time) ? shanghaiTime.format(time) : '—';
  }

  function actorName(state, actor) {
    if (typeof actor === 'object' && actor) return display(actor.name || actor.seatName || actor.accountId || actor.id);
    return display(state.seats?.find(seat => seat.accountId===actor || seat.id===actor)?.name || actor);
  }

  function taskRows(view) {
    const {state} = view;
    const context = DSession.context();
    const intake = service();
    const tasks = intake.deliveryReviewQueue(state,context);
    const receipts = new Map((state.skynetReceipts || []).filter(receipt=>intake.canRead(context,receipt)).map(receipt=>[receipt.id,receipt]));
    return tasks.flatMap(task=>{
      const {intakeId} = task.skynet;
      const receipt = receipts.get(intakeId);
      const delivery = task.skynet.delivery;
      if (!delivery) return [];
      const reviews = [...(delivery.reviewHistory || []),delivery.review];
      return reviews.flatMap((review,index)=>{
        const pending = delivery === task.skynet.delivery && review === delivery.review && review?.status === 'pending';
        if (review?.status!==view.status || view.status==='pending' && !pending) return [];
        const mode = review.selection?.mode || delivery.mode;
        const modeLabel = DSkynetConfig.deliveryModes.find(option=>option.value===mode)?.label ||
          DSkynetConfig.legacyDeliveryModes?.find(option=>option.value===mode)?.label;
        const targetLabels = (review.targets || []).map(target=>target.label || target.id).filter(Boolean);
        const storeNames = (review.storeNames || []).filter(Boolean);
        return [{task,delivery,review,pending,rowKey:JSON.stringify([task.id,index]),
          receiptId:receipt?.id,batchId:receipt?.importBatchId || intakeId,
          leadCode:task.localLeadCode || receipt?.localLeadCode || task.originalKey,
          mode:delivery.directStore ? '接入直发' : modeLabel || mode,
          target:targetLabels.join('、'),stores:storeNames.join('、')}];
      });
    }).sort((a,b)=>String(b.review.reviewedAt || b.review.submittedAt || '')
      .localeCompare(String(a.review.reviewedAt || a.review.submittedAt || '')));
  }

  const fields = [
    ['导入批次',row=>row.batchId],
    ['本地线索编码',row=>row.leadCode],
    ['任务 ID',row=>row.task.taskId],
    ['原轮次',row=>row.delivery.roundId || row.task.skynet.roundId],
    ['客户',row=>row.task.name],
    ['下发类型',row=>row.delivery.typeLabel],
    ['下发方式',row=>row.mode],
    ['所选目标',row=>row.target],
    ['提交时间',row=>timestamp(row.review.submittedAt)]
  ];
  const pageSize = 10;

  function render(view) {
    if (!current(view)) return;
    const rows = taskRows(view).filter(row=>!view.keyword || [row.task.phone,...fields.map(([,read])=>read(row))]
      .some(value=>String(value ?? '').toLowerCase().includes(view.keyword)));
    const totalPages = Math.max(1,Math.ceil(rows.length/pageSize));
    view.page = Math.min(view.page,totalPages);
    const onPage = rows.slice((view.page-1)*pageSize,view.page*pageSize);
    const markup = onPage.map(row=>`<tr data-delivery-review-task="${e(row.task.taskId)}">
      ${fields.map(([label,read])=>`<td>${label==='导入批次' && row.receiptId
        ? `<button type="button" class="btn-link" data-review-receipt="${e(row.receiptId)}">${e(display(read(row)))}</button>`
        : e(display(read(row)))}</td>`).join('')}
      <td><button type="button" class="btn-link" data-review-open="${e(row.rowKey)}">${row.pending?'审核':'查看'}</button></td>
    </tr>`).join('');
    view.body.innerHTML = `<form class="filter-panel" aria-label="下发审核筛选">
      <label class="field"><span>搜索</span><input name="keyword" type="search" placeholder="批次、线索、任务或客户" value="${e(view.keyword)}"></label>
      <label class="field"><span>审核状态</span><select name="status">${[...statuses].map(([status,label])=>
        `<option value="${status}"${status===view.status?' selected':''}>${label}</option>`).join('')}</select></label>
      <div class="filter-actions"><button type="submit" class="btn">查询</button><button type="button" class="btn" data-review-refresh>刷新</button></div>
    </form>
    <div class="table-card">
      <div class="list-toolbar"><strong>${statuses.get(view.status)} · ${rows.length} 条</strong>
        <button type="button" class="btn" data-review-generate>生成模拟数据</button></div>
      <div class="table-scroll" role="region" aria-label="下发审核列表" tabindex="0">
        <table class="platform-table"><thead><tr>${fields.map(([label])=>`<th scope="col">${label}</th>`).join('')}<th scope="col">操作</th></tr></thead>
        <tbody>${markup || `<tr><td colspan="${fields.length+1}" class="d-page-empty">暂无匹配的下发审核记录</td></tr>`}</tbody></table>
      </div>
      ${totalPages>1 ? `<div class="list-toolbar" aria-label="分页">
        <button type="button" class="btn btn-sm" data-review-step="-1"${view.page<=1?' disabled':''}>上一页</button>
        <span>第 ${view.page} / ${totalPages} 页</span>
        <button type="button" class="btn btn-sm" data-review-step="1"${view.page>=totalPages?' disabled':''}>下一页</button>
      </div>` : ''}
    </div>`;
    const filter = view.body.querySelector('form');
    filter.onsubmit = event=>{
      event.preventDefault();
      view.keyword = filter.elements.keyword.value.trim().toLowerCase();
      view.status = filter.elements.status.value;
      view.page = 1;
      render(view);
    };
    filter.elements.status.onchange = ()=>filter.requestSubmit();
    filter.querySelector('[data-review-refresh]').onclick = ()=>load(view);
    const generate = view.body.querySelector('[data-review-generate]');
    generate.onclick = ()=>generateSamples(view,generate);
    view.body.querySelectorAll('[data-review-open]').forEach(button=>button.onclick=()=>{
      if (!current(view)) return;
      const row = rows.find(item=>item.rowKey===button.dataset.reviewOpen);
      if (row) openDetail(view,row);
    });
    view.body.querySelectorAll('[data-review-receipt]').forEach(button=>button.onclick=()=>{
      if (!current(view)) return;
      if (!window.DReview21InlineIntake?.openSkynetReceipt(button.dataset.reviewReceipt)) DUI.toast('当前无法打开这条导入批次。');
    });
    view.body.querySelectorAll('[data-review-step]').forEach(button=>button.onclick=()=>{
      view.page += Number(button.dataset.reviewStep);
      render(view);
    });
  }

  async function generateSamples(view,button) {
    if (!current(view)) return;
    button.disabled = true;
    try {
      const state = await DReview21.ensureState({reload:true});
      if (!current(view)) return;
      const result = service().generateDeliveryReviewSamples(state,DSession.context());
      if (!result.ok) {
        DUI.toast(result.error || '未能生成下发审核样例。');
        return;
      }
      Object.assign(view,{state,status:'pending',keyword:'',page:1});
      render(view);
      DUI.toast('已生成 '+result.count+' 条待审核模拟数据。');
    } catch (_) {
      if (current(view)) DUI.toast('未能生成下发审核样例，请重试。');
    } finally {
      button.disabled = false;
    }
  }

  function openDetail(view,row) {
    const {task,delivery,review,pending} = row;
    const detail = [
      ...fields.slice(0,-1).map(([label,read])=>[label,read(row)]),
      ['意向门店或选定门店',row.stores],
      ['下发模板',delivery.templateName],
      ...(delivery.directDeliveryTarget?.fields || []).map(field=>['直发 · '+field.label,field.value]),
      ['提交坐席',review.submittedByName || actorName(view.state,review.submittedBy)],
      ['提交时间',timestamp(review.submittedAt)],
      ...(pending ? [] : [['审核人',review.reviewedByName || actorName(view.state,review.reviewedBy)],
        ['审核时间',timestamp(review.reviewedAt)],['审核意见',review.reason]])
    ];
    const actions = [{label:pending?'取消':'关闭',run:close=>close()}];
    if (pending) actions.push(
      {label:'驳回',run:close=>commit(close,'reject')},
      {label:'通过并下发',primary:true,run:close=>commit(close,'approve')});
    const modal = DUI.dialog(pending?'审核下发申请':'查看下发审核',
      '<dl class="detail-list">'+detail.map(([label,value])=>`<div><dt>${e(label)}</dt><dd>${e(display(value))}</dd></div>`).join('')+'</dl>'+
      (pending ? '<label class="field"><span>审核意见（驳回时必填）</span><textarea name="reason" maxlength="300" rows="3"></textarea></label>' : '')+
      '<p class="form-error" role="alert" hidden></p>',actions,{stack:true,dismissible:true});
    const error = modal.element.querySelector('[role="alert"]');
    const reasonField = modal.element.querySelector('textarea[name="reason"]');
    if (pending) {
      modal.buttons[1].dataset.reviewReject = '';
      modal.buttons[2].dataset.reviewApprove = '';
    }

    function showError(message) {
      error.textContent = message;
      error.hidden = false;
    }

    async function commit(close,decision) {
      const reason = reasonField.value.trim();
      if (decision==='reject' && !reason) {
        showError('请填写驳回意见。');
        reasonField.focus();
        return;
      }
      if (!current(view)) return showError('当前使用范围已变化，请重新打开下发审核。');
      if (!DReview21.isLatest(view.state)) return showError(DReview21.saveFailure(view.state));
      for (const button of modal.buttons) button.disabled = true;
      reasonField.disabled = true;
      error.hidden = true;
      try {
        const result = await service().reviewDelivery(view.state,DSession.context(),task,{decision,reason});
        if (result?.error || !result) {
          showError(result?.error || '审核结果未保存，请重试。');
          return;
        }
        close();
        if (!current(view)) return;
        render(view);
        DUI.toast(decision==='approve' ? '审核通过，已下发。' : '已驳回，申请已退回负责坐席。');
      } catch (_) {
        showError('未能提交审核，请刷新后核对记录。');
      } finally {
        for (const button of modal.buttons) button.disabled = false;
        reasonField.disabled = false;
      }
    }
  }

  async function load(view) {
    if (!current(view)) return;
    view.body.innerHTML = '<p role="status">正在读取本租户的下发审核…</p>';
    try {
      const state = await DReview21.ensureState({reload:true});
      if (!current(view)) return;
      if (!state || typeof service()?.deliveryReviewQueue !== 'function') throw Error();
      view.state = state;
      render(view);
    } catch (_) {
      if (!current(view)) return;
      view.body.innerHTML = '<p role="alert">未能读取本租户的下发审核。</p><button type="button" class="btn">重试</button>';
      view.body.querySelector('button').onclick = ()=>load(view);
    }
  }

  const index = DNav.pages.findIndex(page=>page.id==='PAGE-21008');
  DNav.pages.splice(index+1,0,{id:pageId,name:pageName,area:'坐席工作台',group:'培育作业',
    menu:true,module:'public',route:'',phoneDomain:'outside'});
  const pagePolicy = DRolePermissions.page;
  DRolePermissions.page = (id,context,seat) => id===pageId ? canManage(context) : pagePolicy(id,context,seat);
  const writePolicy = DRolePermissions.writable;
  DRolePermissions.writable = (id,context,seat) => id===pageId ? canManage(context) : writePolicy(id,context,seat);

  window.Pages ||= {};
  Pages[pageId] = {
    render:()=>'<section class="platform-page" data-delivery-review-page><div class="d-page-heading">'+
      '<h1>下发审核</h1><p>审核本租户待下发的线索及接收目标。</p></div><div data-delivery-review-body></div></section>',
    init(context) {
      const root = document.querySelector('[data-delivery-review-page]');
      if (!root) return;
      load({root,body:root.querySelector('[data-delivery-review-body]'),context,status:'pending',keyword:'',page:1});
    }
  };
})();
