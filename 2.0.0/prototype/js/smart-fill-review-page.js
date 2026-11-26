(() => {
  'use strict';

  const review = window.DSmartFillReview;
  const {pageId,statusName} = review;
  const name = '填单审核';
  const e = DUI.esc;
  const show = value => (Array.isArray(value) ? value.join('、') : value) || '—';
  const display = value => e(show(value));
  const date = value => value ? new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}) : '—';
  const scope = c => JSON.stringify([c?.account?.id,c?.scope?.id,c?.scope?.tenant?.brandId]);
  function current(view) {
    return view.root.isConnected && DApp.currentPage()===pageId &&
      scope(DSession.context())===scope(view.context) && review.canReview(view.context);
  }

  function columns(rows) {
    return rows.map(([label,value])=>'<div><dt>'+e(label)+'</dt><dd>'+display(value)+'</dd></div>').join('');
  }

  function open(view,row) {
    const proposed = new Map(row.suggestions.map(field=>[field.key,field]));
    const submitted = new Map((row.finalFields || []).map(field=>[field.key,field]));
    const keys = new Set([...proposed.keys(),...submitted.keys()]);
    const compare = keys.size ? '<div class="table-scroll"><table class="platform-table"><thead><tr>'+
      '<th>字段</th><th>AI 建议</th><th>坐席提交值</th></tr></thead><tbody>'+
      [...keys].map(key=>'<tr><td>'+display(submitted.get(key)?.label || proposed.get(key)?.label)+'</td><td>'+
        display(proposed.get(key)?.value)+'</td><td>'+display(submitted.get(key)?.value)+'</td></tr>').join('')+'</tbody></table></div>' :
      '<p class="muted">本次没有可核对的字段建议。</p>';
    const detail = '<div class="smart-fill-review-detail"><section><h3>通话依据</h3><dl class="detail-list">'+columns([
      ['接触状态',row.contact],['关联通话',row.callId],['填单应用',row.applicationName || row.applicationId],
      ['智能填单时间',date(row.createdAt)],['调用结果',({available:'返回建议',timeout:'超时',unavailable:'未返回可用建议'})[row.outcome]]])+'</dl></section><section><h3>线索与回访</h3><dl class="detail-list">'+columns([
      ['客户',row.customer],['手机号',row.phone],['业务分类',row.category],['任务编号',row.taskId],
      ['轮次',row.roundId],['回访记录',row.visitId],['提交坐席',row.seatName],['回访提交时间',date(row.submittedAt)],
      ['审核状态',statusName[row.status]],['审核人',row.review?.name],['审核时间',date(row.review?.at)],
      ['审核意见',row.review?.note]])+'</dl></section><section><h3>填单对照</h3>'+compare+'</section></div>';
    const demoNotice = row.demo ? '<p class="notice">这是模拟审核记录，不关联真实回访或通话。</p>' : '';
    const edits = row.status==='pending' ? '<label class="field"><span>审核意见（驳回时必填）</span>'+
      '<textarea name="note" maxlength="500" rows="3"></textarea></label>' : '';
    const buttons=[{label:'关闭',run:close=>close()}];
    if (row.status==='pending') buttons.push({label:'驳回',run:close=>decide(close,'rejected')},
      {label:'通过',primary:true,run:close=>decide(close,'approved')});
    const modal=DUI.dialog(row.status==='pending'?'审核智能填单':'查看智能填单记录',
      demoNotice+detail+edits+'<p class="form-error" role="alert" hidden></p>',buttons,{stack:true,dismissible:true});
    modal.element.querySelector('.d-dialog')?.classList.add('smart-fill-review-dialog');
    function decide(close,status) {
      const answer = current(view) ? review.decide(view.state,DSession.context(),row.id,status,
        modal.element.querySelector('[name=note]').value) : {error:'审核范围已变化，请重新打开。'};
      if (!answer.ok) {
        const feedback=modal.element.querySelector('[role=alert]');
        feedback.hidden=false;
        feedback.textContent=answer.error;
        return;
      }
      close(); render(view); DUI.toast(statusName[status]);
    }
  }

  function render(view) {
    if (!current(view)) return;
    const all = review.list(view.state,view.context);
    const search = view.keyword.toLowerCase();
    const rows = all.filter(row=>(view.status==='all' || row.status===view.status) &&
      (!search || [row.customer,row.phone,row.taskId,row.roundId,row.visitId,row.seatName,row.leadCode]
        .some(value=>String(value || '').toLowerCase().includes(search))));
    const pages = Math.max(1,Math.ceil(rows.length/15));
    view.page = Math.min(view.page,pages);
    const shown=rows.slice((view.page-1)*15,view.page*15);
    const pending=all.filter(row=>row.status==='pending').length;
    view.body.innerHTML='<section class="table-card"><form class="filter-bar" data-fill-review-filter>'+
      '<label class="field"><span>审核状态</span><select name="status">'+
      Object.entries({all:'全部记录',...statusName}).map(([status,label])=>'<option value="'+e(status)+'"'+
        (view.status===status?' selected':'')+'>'+e(label)+'</option>').join('')+'</select></label>'+
      '<label class="field"><span>关键词</span><input name="keyword" value="'+e(view.keyword)+'" placeholder="客户、手机号、任务号或坐席"></label>'+
      '<button class="btn btn-primary" type="submit">查询</button><button class="btn" type="button" data-fill-review-refresh>刷新</button>'+
      '<button class="btn" type="button" data-fill-review-samples>生成模拟数据</button></form>'+
      '<p class="muted">待审核 '+pending+' 条 · 当前结果 '+rows.length+' 条</p>'+
      '<div class="table-scroll"><table class="platform-table"><thead><tr>'+['回访记录','任务编号','客户','手机号','填写坐席','填单时间','状态','审核人','操作']
      .map(label=>'<th>'+label+'</th>').join('')+'</tr></thead><tbody>'+
      (shown.length?shown.map((row,index)=>'<tr data-fill-review-row'+(row.demo?' data-fill-review-demo':'')+'><td>'+display(row.visitId)+'</td><td>'+display(row.taskId)+
        '</td><td>'+display(row.customer)+'</td><td>'+display(row.phone)+'</td><td>'+display(row.seatName)+
        '</td><td>'+display(date(row.createdAt))+'</td><td>'+display(statusName[row.status])+'</td><td>'+display(row.review?.name)+
        '</td><td><button type="button" class="btn-link" data-fill-review-open="'+index+'">'+(row.status==='pending'?'审核':'详情')+'</button></td></tr>').join('') :
        '<tr><td colspan="9">暂无符合条件的填单记录。</td></tr>')+'</tbody></table></div>'+
      '<div class="table-actions smart-fill-review-pagination"><button class="btn" type="button" data-fill-review-page-step="-1"'+(view.page===1?' disabled':'')+
      '>上一页</button><span>第 '+view.page+' / '+pages+' 页</span><button class="btn" type="button" data-fill-review-page-step="1"'+
      (view.page===pages?' disabled':'')+'>下一页</button></div></section>';
    const filter=view.body.querySelector('[data-fill-review-filter]');
    filter.onsubmit=event=>{event.preventDefault();view.status=filter.elements.status.value;view.keyword=filter.elements.keyword.value.trim();view.page=1;render(view);};
    filter.elements.status.onchange=()=>filter.requestSubmit();
    view.body.querySelector('[data-fill-review-refresh]').onclick=()=>load(view);
    view.body.querySelector('[data-fill-review-samples]').onclick=()=>{
      if (!current(view)) return;
      const result=review.generateSamples(view.state,view.context);
      if (!result.ok) return DUI.toast(result.error);
      Object.assign(view,{status:'all',keyword:'',page:1});
      render(view);
      DUI.toast(result.count ? '已生成 '+result.count+' 条填单审核模拟数据。' : '当前租户已生成模拟数据，无需重复添加。');
    };
    view.body.querySelectorAll('[data-fill-review-open]').forEach(button=>button.onclick=()=>{if(current(view)) open(view,shown[Number(button.dataset.fillReviewOpen)]);});
    view.body.querySelectorAll('[data-fill-review-page-step]').forEach(button=>button.onclick=()=>{view.page+=Number(button.dataset.fillReviewPageStep);render(view);});
  }

  async function load(view) {
    if (!current(view)) return;
    const sequence=(view.sequence || 0)+1;
    view.sequence=sequence;
    view.body.innerHTML='<p role="status">正在读取本租户填单记录…</p>';
    try {
      const state=await DReview21.ensureState({reload:true});
      if (!current(view) || view.sequence!==sequence) return;
      if (!state) throw Error();
      view.state=state;render(view);
    } catch (_) {
      if (current(view) && view.sequence===sequence) view.body.innerHTML='<p role="alert">暂时无法读取填单记录，请刷新页面后重试。</p>';
    }
  }

  const near=DNav.pages.findIndex(page=>page.id==='PAGE-21015');
  DNav.pages.splice(near+1,0,{id:pageId,name,area:'坐席工作台',group:'培育作业',menu:true,module:'public',route:'',phoneDomain:'outside'});
  const canPage=DRolePermissions.page;
  DRolePermissions.page=(id,context,seat)=>id===pageId ? review.canReview(context) : canPage(id,context,seat);
  const canWrite=DRolePermissions.writable;
  DRolePermissions.writable=(id,context,seat)=>id===pageId ? review.canReview(context) : canWrite(id,context,seat);
  window.Pages ||= {};
  Pages[pageId]={
    render:()=>'<section class="platform-page" data-fill-review><div class="d-page-heading"><h1>填单审核</h1>'+
      '<p>核对智能填单建议与坐席提交值。审核结论只留痕，不改写回访或打断培育流转。</p></div><div data-fill-review-body></div></section>',
    init(context) {
      const root=document.querySelector('[data-fill-review]');
      if (root) void load({root,body:root.querySelector('[data-fill-review-body]'),context,status:'pending',keyword:'',page:1});
    }
  };
})();
