(() => {
  'use strict';

  const periods = [['day','日',1],['week','周',7],['month','月',30]];
  const dayMs = 86400000;
  const format = new Intl.NumberFormat('zh-CN');
  const percent = new Intl.NumberFormat('zh-CN',{style:'percent',maximumFractionDigits:1});
  const e = value => DUI.esc(value);
  const comparisonModels = [
    '理想 L7','问界 M7','蔚来 ES6','比亚迪 汉','特斯拉 Model Y','小鹏 P7','极氪 001','零跑 C11',
    '深蓝 SL03','哪吒 S','岚图 FREE','智己 LS6','阿维塔 12','领克 08 EM-P','长安 启源 A07'
  ];
  const options = value => Array.isArray(value) ? value : [];
  const asString = value => typeof value==='string' ? value.trim() : '';
  const day = value => asString(value).slice(0,10);
  const timestamp = value => Date.parse(value+'T00:00:00Z');
  const rank = groups => [...groups.values()].sort((left,right)=>right.count-left.count || left.name.localeCompare(right.name,'zh-CN'));
  const compact = value => value.normalize('NFKC').toLowerCase().replace(/[\s·-]+/g,'');
  const modelPatterns = comparisonModels.map(name=>[name,new RegExp(compact(name)+'(?![a-z0-9])','g')]);

  function count(map,name) {
    if (!map.has(name)) map.set(name,{name,count:0});
    return map.get(name);
  }

  function violationsFor(calls,period,endDate) {
    const selectedEnd = day(endDate);
    const lastCallDay = calls.map(call=>day(call.callAt)).sort().at(-1) || '';
    const end = timestamp(selectedEnd || lastCallDay);
    const span = periods.find(([key])=>key===period)?.[2] || 7;
    const first = end-(span-1)*dayMs;
    const counts = new Map();
    for (const call of calls) {
      const at = timestamp(day(call.callAt));
      if (!call.inspected || !(at>=first && at<=end)) continue;
      for (const item of options(call.redLines)) {
        const name = asString(item?.categoryLabel || item?.name);
        if (!name || item.passed===true || item.appealStatus==='approved') continue;
        const entry = count(counts,name);
        entry.count++;
        entry.seats ||= new Set();
        const seat = call.seatId || call.accountId;
        if (seat) entry.seats.add(seat);
      }
    }
    return rank(counts);
  }

  function customerAnalytics(calls) {
    const questions = new Map();
    const competitors = new Map();
    for (const call of calls) {
      for (const line of options(call.transcript)) {
        const text = asString(line?.text);
        if (!['客户','用户','customer'].includes(asString(line?.role).toLowerCase()) || !text) continue;
        const query = text.replace(/1[3-9]\d{9}/g,'1**********').replace(/\s+/g,' ')
          .replace(/[？?]+/g,'？').replace(/[。；;]+$/,'');
        if (/[？?]|(?:能不能|是否|可不可以|想问|有没有|多少钱|怎么|多久|什么时候|如何)/.test(query)) {
          count(questions,query).count++;
        }
        const normalized = compact(text);
        for (const [name,pattern] of modelPatterns) {
          const hits = normalized.match(pattern)?.length || 0;
          if (hits) count(competitors,name).count+=hits;
        }
      }
    }
    const sortedCompetitors = rank(competitors);
    const total = sortedCompetitors.reduce((sum,model)=>sum+model.count,0);
    return {questions:rank(questions).slice(0,10),
      competitors:sortedCompetitors.map(model=>({...model,share:model.count/total})),total};
  }

  const empty = message => `<p class="qii-empty">${e(message)}</p>`;
  function rankList(rows,emptyMessage,detail=()=>'') {
    return rows.length ? `<ol class="qii-ranks">${rows.map((row,index)=>
      `<li><span class="qii-rank" aria-hidden="true">${index+1}</span>
      <div class="qii-label"><span>${e(row.name)}</span>${detail(row)}</div>
      <strong>${format.format(row.count)} 次</strong></li>`).join('')}</ol>` : empty(emptyMessage);
  }

  function periodButtons(period) {
    return `<div class="qid-segment" role="group" aria-label="违规统计周期">${periods.map(([id,label])=>
      `<button type="button" class="btn" data-qii-period="${id}" aria-pressed="${id===period}">${label}</button>`).join('')}</div>`;
  }

  const percentText = share => percent.format(share);
  const progress = (model,max) => `<progress max="${max}" value="${model.count}"
    aria-label="${e(model.name+'提及次数 '+format.format(model.count))}"></progress>`;

  function competitorsPanel(competitors) {
    if (!competitors.length) return empty('当前范围暂无竞品车型提及。');
    return `<ol class="qii-models">${competitors.slice(0,3).map((model,index)=>
      `<li><span class="qii-rank" aria-hidden="true">${index+1}</span>
      <div class="qii-label"><span>${e(model.name)}</span><small>占比 ${percentText(model.share)}</small></div>
      ${progress(model,competitors[0].count)}<strong>${format.format(model.count)} 次</strong></li>`).join('')}</ol>`;
  }

  function showAllCompetitors(competitors,total) {
    if (!competitors.length) return;
    const rows = competitors.map((model,index)=>
      `<tr><td>${index+1}</td><th scope="row">${e(model.name)}</th><td>${format.format(model.count)}</td>
      <td>${percentText(model.share)}</td><td>${progress(model,competitors[0].count)}</td></tr>`).join('');
    const content = `<div class="table-scroll" tabindex="0" role="region" aria-label="竞品车型提及明细">
      <table class="platform-table qii-model-table"><thead><tr><th scope="col">排名</th><th scope="col">竞品车型</th>
      <th scope="col">提及次数</th><th scope="col">占比</th><th scope="col">提及分布</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="qii-totals">共 ${format.format(competitors.length)} 款车型，合计提及 ${format.format(total)} 次</p>`;
    const dialog = DUI.dialog('竞品车型高频提及 · 全部车型',content,
      [{label:'关闭',run:close=>close()}],{dismissible:true,stack:true});
    dialog.element.querySelector('[role="dialog"]')?.classList.add('qii-model-dialog');
  }

  function draw(host,calls,{period='week',endDate,onPeriodChange=()=>{},isCurrent=()=>host.isConnected} = {}) {
    const {questions,competitors,total} = customerAnalytics(calls);
    let currentPeriod = periods.some(([key])=>key===period) ? period : 'week';
    host.innerHTML = `<div class="qii-grid">
      <section class="table-card qid-card"><div class="list-toolbar"><h2>违规TOP榜</h2>${periodButtons(currentPeriod)}</div>
      <div data-qii-violation aria-live="polite"></div></section>
      <section class="table-card qid-card"><div class="list-toolbar"><h2>客户高频提问 TOP10</h2></div>
      <div data-qii-faq>${rankList(questions,'当前范围暂无可统计的客户提问。')}</div></section>
      <section class="table-card qid-card qii-competitors"><div class="list-toolbar"><h2>竞品车型高频提及 TOP3</h2>
      ${competitors.length?'<button type="button" class="btn-link" data-qii-models-all>查看全部</button>':''}</div>
      <div data-qii-models>${competitorsPanel(competitors)}</div></section></div>`;
    const violationPanel = host.querySelector('[data-qii-violation]');
    function drawViolations() {
      violationPanel.innerHTML=rankList(violationsFor(calls,currentPeriod,endDate),'当前周期暂无违规记录。',
        row=>`<small>涉及坐席 ${format.format(row.seats.size)} 人</small>`);
    }
    drawViolations();
    host.onclick = event=>{
      if (!isCurrent()) return;
      const periodButton = event.target.closest('[data-qii-period]');
      if (periodButton) {
        const next = periodButton.dataset.qiiPeriod;
        if (!periods.some(([key])=>key===next) || next===currentPeriod) return;
        currentPeriod = next;
        host.querySelectorAll('[data-qii-period]').forEach(button=>
          button.setAttribute('aria-pressed',String(button===periodButton)));
        drawViolations();
        onPeriodChange(next);
      } else if (event.target.closest('[data-qii-models-all]')) {
        showAllCompetitors(competitors,total);
      }
    };
  }

  window.DQualityInspectionInsights = Object.freeze({draw});
})();
