(() => {
  'use strict';

  const pageId = 'PAGE-21014';
  const scores = window.DSkynetSeatScores;
  const e = DUI.esc;
  const shanghaiTime = new Intl.DateTimeFormat('zh-CN',{
    timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'short',hour12:false
  });
  const scopeKey = context => JSON.stringify([
    context?.account?.id,context?.scope?.id,context?.scope?.tenant?.brandId
  ]);

  function active(view) {
    const context = DSession.context();
    return view.root.isConnected && DApp.currentPage() === pageId &&
      scopeKey(context) === view.scope && scores.canManage(context);
  }

  function updateTime(record) {
    const time = Date.parse(record?.updatedAt);
    return Number.isFinite(time) ? shanghaiTime.format(time) : '—';
  }

  function scoreRow({seat,record}) {
    const hasScore = typeof record?.score === 'number';
    const source = record?.source === 'manual' ? (hasScore ? '人工评分' : '人工清空') :
      record?.source === 'algorithm' ? '算法更新' : '—';
    return '<tr data-seat-score-row="' + e(seat.id) + '"><th scope="row">' + e(seat.name) + '</th>' +
      '<td>' + e(seat.employeeNo || seat.id) + '</td>' +
      '<td data-seat-score-value' + (hasScore ? '' : ' class="ss-empty-score"') + '>' +
      (hasScore ? e(record.score) : '未评分') + '</td><td>' + e(source) + '</td>' +
      '<td>' + e(updateTime(record)) + '</td><td><div class="table-actions">' +
      '<button type="button" class="btn-link" data-seat-score-edit="' + e(seat.id) + '">编辑评分</button></div></td></tr>';
  }

  function draw(view) {
    const entries = scores.list(view.state,DSession.context());
    view.body.innerHTML = '<div class="table-card" data-seat-score-list><div class="table-scroll" role="region" ' +
      'tabindex="0" aria-label="坐席评分列表"><table class="platform-table"><thead><tr>' +
      '<th scope="col">坐席姓名</th><th scope="col">坐席编号</th><th scope="col">评分</th>' +
      '<th scope="col">评分来源</th><th scope="col">更新时间</th><th scope="col">操作</th></tr></thead><tbody>' +
      (entries.map(scoreRow).join('') || '<tr><td colspan="6"><div class="d-page-empty">当前租户暂无坐席</div></td></tr>') +
      '</tbody></table></div></div>';
    view.body.querySelectorAll('[data-seat-score-edit]').forEach(button => {
      button.onclick = () => openEditor(view,button.dataset.seatScoreEdit);
    });
  }

  function openEditor(view,seatId) {
    if (!active(view)) return;
    const entry = scores.list(view.state,DSession.context()).find(item => item.seat.id === seatId);
    if (!entry) return;
    const {seat,record} = entry;
    const clearable = record?.score !== null;
    const buttons = [{label:'取消',run:close => close()}];
    if (clearable) buttons.push({label:'清空评分',run:close => commit(close,null)});
    buttons.push({label:'保存',primary:true,run:close => {
      if (input.validity.badInput) return fail('请输入 0 至 100 的分数。');
      commit(close,input.value === '' ? null : input.valueAsNumber);
    }});
    const modal = DUI.dialog('编辑坐席评分','<form class="ss-edit-form" data-seat-score-editor novalidate>' +
      '<p class="ss-seat"><strong>' + e(seat.name) + '</strong><span>坐席编号 ' + e(seat.employeeNo || seat.id) + '</span></p>' +
      '<label class="field"><span>人工评分</span><input name="score" type="number" min="0" max="100" step="any" ' +
      'aria-describedby="seat-score-range" value="' + e(record?.score) + '" autocomplete="off"></label>' +
      '<p id="seat-score-range" class="ss-range">分值范围为 0–100，可填写小数。留空后按未评分处理。</p>' +
      '<p class="form-error" role="alert" hidden></p></form>',buttons,{stack:true,dismissible:true});
    modal.element.querySelector('.d-dialog').classList.add('ss-dialog');
    const form = modal.element.querySelector('[data-seat-score-editor]');
    const input = form.elements.score;
    const error = form.querySelector('[role="alert"]');
    const saveButton = modal.buttons.at(-1);
    saveButton.dataset.seatScoreSave = '';
    if (clearable) modal.buttons[1].dataset.seatScoreClear = '';
    form.onsubmit = event => {event.preventDefault();saveButton.click();};
    form.oninput = () => {error.hidden = true;error.textContent = '';};
    input.focus();

    function fail(message) {
      error.textContent = message;
      error.hidden = false;
    }

    function commit(close,value) {
      if (!active(view)) return fail('当前使用范围已变化，请重新打开坐席评分。');
      if (!DReview21.isLatest(view.state)) return fail(DReview21.saveFailure(view.state));
      const previous = view.state.skynetSeatScores;
      const result = scores.saveManual(view.state,DSession.context(),seatId,value);
      if (result.error) return fail(result.error);
      if (!DReview21.save(view.state)) {
        if (previous === undefined) delete view.state.skynetSeatScores;
        else view.state.skynetSeatScores = previous;
        return fail(DReview21.saveFailure(view.state,'评分未保存，请重试。'));
      }
      close();
      draw(view);
      view.body.querySelector('[data-seat-score-edit="' + CSS.escape(seatId) + '"]')?.focus({preventScroll:true});
      DUI.toast(value === null ? '已清空坐席评分。' : '已保存坐席评分。');
    }
  }

  const nearby = DNav.pages.findIndex(item => item.id === 'PAGE-21001');
  const seatPage = nearby >= 0 ? nearby : DNav.pages.findIndex(item => item.id === 'PAGE-2210');
  DNav.pages.splice(seatPage + 1,0,{
    id:pageId,name:'坐席评分',area:'呼叫中心',group:'坐席资源',menu:true,module:'public',route:'',phoneDomain:'outside'
  });
  const previousPage = DRolePermissions.page;
  DRolePermissions.page = (id,context,seat) => id === pageId ? scores.canManage(context) : previousPage(id,context,seat);
  const previousWritable = DRolePermissions.writable;
  DRolePermissions.writable = (id,context,seat) => id === pageId ? scores.canManage(context) : previousWritable(id,context,seat);

  window.Pages ||= {};
  Pages[pageId] = {
    render:() => '<section class="platform-page seat-score-page" data-seat-score-page><div class="d-page-heading">' +
      '<h1>坐席评分</h1><p>人工评分供跟进坐席分配中的「评分最高」使用。</p></div>' +
      '<div data-seat-score-body><p role="status">正在读取当前租户坐席…</p></div></section>',
    async init(context) {
      const root = document.querySelector('[data-seat-score-page]');
      if (!root) return;
      const state = await DReview21.ensureState();
      const view = {root,body:root.querySelector('[data-seat-score-body]'),state,scope:scopeKey(context)};
      if (!active(view)) return;
      if (!state) {
        view.body.innerHTML = '<p role="alert">未能读取当前租户坐席，请重试。</p>';
        return;
      }
      draw(view);
    }
  };
})();
