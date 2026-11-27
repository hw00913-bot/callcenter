(() => {
  'use strict';

  const pageId = 'PAGE-21018';
  const service = () => window.DQualityInspection;
  const ui = () => window.DQualityInspectionDetail;
  const e = DUI.esc;
  const statusNames = {pending:'待审核',reviewing:'审核中',approved:'审核通过',rejected:'审核不通过',partial:'部分通过'};
  const appealStatus = row => row.statusLabel || statusNames[row.status] || '—';
  const active = view => view.host.isConnected && DApp.currentPage()===pageId && ui().scopeKey()===view.scope;

  function open(view,id,reviewMode) {
    if (!active(view)) return false;
    const appeal = service().appeal(id);
    if (!appeal?.record) return false;
    const canReview = service().access()?.canReview;
    const draft = appeal.reviewDraft;
    const rework = canReview && reviewMode==='rework' && !!appeal.decisions.length && !draft;
    const editing = rework || (canReview && reviewMode==='edit' && ['pending','reviewing'].includes(appeal.status));
    const confirming = canReview && reviewMode==='approve' && !!draft;
    const items = ui().rowsForAppeal(appeal.record).filter(item=>appeal.itemIds.includes(item.id));
    const decisions = new Map((rework?[]:draft?.decisions || appeal.decisions).map(item=>[item.itemId,item.approve]));
    const labels = [
      ['申诉编号',appeal.id],['坐席',appeal.record.seatName],['通话 ID',appeal.record.callId],
      ['线索编码',appeal.record.leadCode],['任务 ID',appeal.record.taskId],['轮次 ID',appeal.record.roundId],
      ['申诉状态',appealStatus(appeal)],['提交人',appeal.submittedBy],['申诉时间',appeal.submittedAt],
      ['审核人',appeal.reviewedBy],['回复时间',appeal.repliedAt],
      ['申诉内容',appeal.reason],['生效回复',appeal.reply],
      ...(draft ? [['审核意见',draft.reply],['审核回复提交时间',draft.submittedAt],['审核回复提交人',draft.submittedBy]] : []),
      ...(appeal.reviewedBy ? [['审批人',appeal.reviewedBy]] : [])
    ];
    const actions = [{label:'关闭',run:close=>close()}];
    if (editing) actions.push({label:'提交审核回复',primary:true,run:close=>{
      if (!active(view) || !dialog.element.isConnected) return;
      const reply = body.querySelector('[name="reply"]');
      if (!reply.value.trim()) {
        ui().showError(body,'请填写回复内容。');reply.focus();return;
      }
      const reviewed = items.map(item=>{
        const selected = [...body.querySelectorAll('[data-qi-decision]:checked')]
          .find(input=>input.dataset.qiDecision===item.id);
        return selected ? {itemId:item.id,approve:selected.value==='yes'} : null;
      });
      if (!reviewed.length || reviewed.some(item=>item===null)) {
        ui().showError(body,'请为本次申诉的每个细项选择审核结果。');return;
      }
      const result = service().stageAppealReview({appealId:id,decisions:reviewed,reply:reply.value.trim(),draftToken:draft?.token || '',rework});
      if (!result?.ok) return ui().showError(body,result?.error || '审核未保存，请重试。');
      close();view.draw();DUI.toast('审核回复已提交，等待审批。');open(view,id,'approve');
    }});
    if (confirming) {
      actions.push({label:'修改审核回复',run:close=>{close();open(view,id,'edit');}},
        {label:'审核不通过',run:close=>finalize(close,false)},
        {label:'审核通过',primary:true,run:close=>finalize(close,true)});
    }
    function finalize(close,approved) {
      if (!active(view) || !dialog.element.isConnected) return;
      const result = service().finalizeAppealReview({appealId:id,draftToken:draft.token,approved});
      if (!result?.ok) return ui().showError(body,result?.error || '审批未保存，请重试。');
      close();view.draw();DUI.toast('已保存审批结果。');
    }
    const points = items.map((item,index)=>{
      const decision = decisions.get(item.id);
      return '<fieldset class="qi-review-point"><legend>'+e(item.name)+'</legend>'+
        (item.description || item.evidence?'<p>'+e(item.description || item.evidence)+'</p>':'')+
        (editing?'<div><label><input type="radio" name="decision-'+index+'" value="yes" data-qi-decision="'+e(item.id)+'"'+
          (decision===true?' checked':'')+'> 通过</label><label><input type="radio" name="decision-'+index+'" value="no" data-qi-decision="'+
          e(item.id)+'"'+(decision===false?' checked':'')+'> 不通过</label></div>':
          '<p>'+e(typeof decision==='boolean'?((draft?'拟':'')+(decision?'通过':'不通过')):appealStatus(appeal))+'</p>')+'</fieldset>';
    }).join('');
    const history = appeal.reviewHistory?.length ? '<details class="qi-detail-card"><summary>历史审批</summary><div>'+
      appeal.reviewHistory.map(entry=>ui().dataList([['审批时间',entry.repliedAt],['审批人',entry.reviewedBy],
        ['回复内容',entry.reply],['通过细项数',entry.decisions.filter(item=>item.approve).length]])).join('')+'</div></details>' : '';
    const reply = rework?'':draft?.reply || '';
    const dialog = DUI.dialog(editing?'质检申诉审核':confirming?'质检申诉审批':'质检申诉详情',
      '<div class="qi-detail" data-qi-appeal-drawer>'+ui().dataList(labels)+
      '<div class="list-toolbar"><strong>申诉细项</strong><button type="button" class="btn" data-qi-appeal-record>查看质检明细</button></div>'+
      (points || '<p class="qi-empty">暂无申诉细项</p>')+history+
      (editing?'<label class="field"><span>回复内容（必填）</span><textarea name="reply" maxlength="500" rows="4">'+e(reply)+'</textarea></label>'+
        '<span class="d-muted" data-qi-reply-count>'+reply.length+' / 500</span>':'')+ui().errorMarkup+'</div>',
      actions,{drawer:true,stack:true,dismissible:true});
    dialog.element.querySelector('.d-dialog').classList.add('qi-drawer');
    const body = dialog.element.querySelector('[data-qi-appeal-drawer]');
    body.querySelector('[data-qi-appeal-record]').onclick = () => {
      if (active(view) && !ui().open(appeal.recordId,{showSubmit:false})) DUI.toast('当前质检记录不可查看。');
    };
    if (editing) body.addEventListener('input',event=>{
      if (event.target.name==='reply') body.querySelector('[data-qi-reply-count]').textContent=event.target.value.length+' / 500';
      ui().showError(body,'');
    });
    return true;
  }

  const columns = [
    ['序号',null],['坐席名称',row=>row.record.seatName],
    ['申诉细项个数',row=>row.itemIds.length,'count'],['申诉内容',row=>row.reason],
    ['回复内容',row=>row.reply],['申诉时间',row=>row.submittedAt,'submittedAt'],
    ['回复时间',row=>row.repliedAt,'repliedAt'],['状态',appealStatus]
  ];

  function init(context) {
    const host = document.querySelector('[data-qi-appeal-page]');
    const access = service().access(context);
    if (!host || !access) return;
    const shared = ui();
    const body = host.querySelector('[data-qi-appeal-content]');
    const view = {host,scope:shared.scopeKey(),page:1,size:10,filters:{},seats:[],sort:'submittedAt',direction:-1,draw};
    body.innerHTML = '<form class="filter-panel qi-filter" data-rtl-region="filters" aria-label="质检申诉查询">'+
      shared.seatFilter(service().records(),access)+shared.rangeFields('申诉时间','appealFrom','appealTo','date')+
      shared.rangeFields('回复时间','replyFrom','replyTo','date')+shared.choice('审核状态','status',Object.entries(statusNames))+
      shared.buttons+shared.errorMarkup+'</form><div class="table-card"><div class="list-toolbar" data-rtl-region="toolbar">'+
      '<strong>申诉记录</strong>'+(access.canAppeal?'<button type="button" class="btn" data-qi-to-details>前往质检明细发起申诉</button>':'')+
      '</div><div data-qi-appeal-results></div></div>';
    const form = body.querySelector('form'), results = body.querySelector('[data-qi-appeal-results]');
    shared.bindSeatFilter(form);
    body.querySelector('[data-qi-to-details]')?.addEventListener('click',()=>DApp.openPage('PAGE-21019'));
    form.onsubmit = event => {
      event.preventDefault();
      const data = new FormData(form), filters = Object.fromEntries([...data]);
      const error = shared.inputError(filters,[['appealFrom','appealTo','申诉时间'],['replyFrom','replyTo','回复时间']]);
      shared.showError(form,error);
      if (error) return;
      view.filters=filters;view.seats=data.getAll('seat');view.page=1;
      form.querySelector('[data-qi-seat-filter]')?.removeAttribute('open');draw();
    };
    form.onreset = () => queueMicrotask(()=>{
      view.filters={};view.seats=[];view.page=1;view.sort='submittedAt';view.direction=-1;
      form.querySelectorAll('[data-qi-seat-label]').forEach(label=>label.hidden=false);
      shared.syncSeatFilter(form);shared.showError(form,'');draw();
    });
    results.addEventListener('click',event=>{
      if (!active(view)) return;
      const action = event.target.closest('[data-qi-open-appeal],[data-qi-sort]');
      if (!action) return;
      if (action.dataset.qiSort) {
        view.direction = view.sort===action.dataset.qiSort ? -view.direction : -1;
        view.sort=action.dataset.qiSort;view.page=1;draw();return;
      }
      if (!open(view,action.dataset.qiOpenAppeal,action.dataset.qiReview)) DUI.toast('当前申诉不可查看。');
    });

    function draw() {
      if (!active(view)) return;
      const p = view.filters;
      const rows = service().appeals().filter(row=>
        (!view.seats.length || view.seats.includes(row.record.seatId || row.record.accountId)) &&
        (!p.status || p.status===row.status) &&
        shared.inRange(shared.datePart(row.submittedAt),p.appealFrom,p.appealTo) &&
        shared.inRange(shared.datePart(row.repliedAt),p.replyFrom,p.replyTo)
      ).sort((a,b)=>{
        const order = view.sort==='count' ? a.itemIds.length-b.itemIds.length :
          String(a[view.sort] || '').localeCompare(String(b[view.sort] || ''));
        return view.direction*order;
      });
      const controls = shared.pagination(rows.length,view);
      const first = (view.page-1)*view.size;
      results.innerHTML = '<div class="table-scroll qi-appeal-table" data-rtl-region="table" role="region" tabindex="0" aria-label="质检申诉列表">'+
        '<table class="platform-table"><thead><tr>'+columns.map(([label,,sort])=>
          '<th scope="col"'+(sort?' aria-sort="'+(view.sort===sort?(view.direction>0?'ascending':'descending'):'none')+'"':'')+'>'+
          (sort?'<button type="button" class="qi-sort" data-qi-sort="'+sort+'">'+e(label)+
            '<span aria-hidden="true">'+(view.sort===sort?(view.direction>0?'↑':'↓'):'↕')+'</span></button>':e(label))+'</th>').join('')+
        '<th scope="col">操作</th></tr></thead><tbody>'+
        (rows.slice(first,first+view.size).map((row,index)=>'<tr data-quality-appeal-id="'+e(row.id)+'">'+columns.map(([,read])=>{
          if (!read) return '<td>'+(first+index+1)+'</td>';
          const field = read(row);
          return '<td title="'+e(field)+'">'+e(field == null || field==='' ? '—' : field)+'</td>';
        }).join('')+'<td><div class="table-actions">'+
          '<button type="button" class="btn-link" data-qi-open-appeal="'+e(row.id)+'">详情</button>'+
          (access.canReview?reviewAction(row):'')+'</div></td></tr>').join('')||
          '<tr><td colspan="'+(columns.length+1)+'" class="qi-empty">暂无符合条件的申诉记录</td></tr>')+
        '</tbody></table></div>'+controls;
      shared.bindPagination(results,view,draw);
    }
    draw();
  }

  function reviewAction(row) {
    const [mode,label] = row.status==='pending' ? ['edit','审核'] :
      row.status==='reviewing' ? ['approve','审批'] : ['rework','重新提交'];
    return '<button type="button" class="btn-link" data-qi-open-appeal="'+e(row.id)+
      '" data-qi-review="'+mode+'">'+label+'</button>';
  }

  window.Pages ||= {};
  Pages[pageId] = {
    render:()=>'<section class="platform-page qi-page" data-qi-appeal-page data-rtl-page-type="list">'+
      '<header class="d-page-heading" data-rtl-region="page-header"><h1>质检申诉</h1></header><div data-qi-appeal-content></div></section>',
    init
  };
})();
