(() => {
  'use strict';

  const pageId = 'PAGE-21017';
  const total = 'total';
  const e = value => DUI.esc(String(value ?? ''));
  const quality = () => window.DQualityInspection;
  const dayMs = 86400000;
  const chinaDay = new Intl.DateTimeFormat('sv-SE', {
    timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit'
  });
  const number = new Intl.NumberFormat('zh-CN', {maximumFractionDigits:1});
  const chartColors = ['#1677ff','#0e8c70','#9853c6','#cb6c18','#ce4867','#288aa4','#5a7029'];
  const list = value => Array.isArray(value) ? value : [];
  const show = value => value === '' || value == null ? '—' : value;
  const fmt = value => value == null ? '—' : number.format(value);
  const day = value => String(value || '').slice(0,10);
  const dayTime = value => Date.parse(value + 'T00:00:00Z');
  const iso = time => new Date(time).toISOString().slice(0,10);
  const offset = (value,days) => iso(dayTime(value) + days*dayMs);
  const today = () => chinaDay.format(new Date());
  const recent = days => [offset(today(),-days),offset(today(),-1)];
  const inspected = rows => rows.filter(row=>row.inspected && Number.isFinite(row.score));
  const deduction = row => Number.isFinite(row.dimensionScore) && Number.isFinite(row.score) ?
    Math.max(0,row.dimensionScore-row.score) : null;
  const dimensionRows = rows => rows.flatMap(row=>list(row.dimensions));
  const aggregate = (rows,key) => {
    const groups = new Map();
    for (const row of rows) {
      const id = key(row);
      if (!groups.has(id)) groups.set(id,[]);
      groups.get(id).push(row);
    }
    return [...groups.values()];
  };
  function mean(values) {
    const usable = values.filter(Number.isFinite);
    return usable.length ? usable.reduce((sum,n)=>sum+n,0)/usable.length : null;
  }
  function available(rows,key,label = key) {
    const options = new Map(rows.filter(row=>row[key]).map(row=>[row[key],row[label] || row[key]]));
    return [...options].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'zh-CN'));
  }
  function scopedLeads(rows) {
    return aggregate(rows,row=>row.leadCode || row.id);
  }
  function duration(seconds) {
    const rounded = Math.round(seconds || 0);
    return Math.floor(rounded/60) + '分' + rounded%60 + '秒';
  }
  function catalogFor(rows) {
    const dimensions = new Map();
    for (const sample of dimensionRows(rows)) {
      if (!dimensions.has(sample.id)) dimensions.set(sample.id,{id:sample.id,name:sample.name,groups:new Map()});
      const dimension = dimensions.get(sample.id);
      for (const entry of list(sample.groups)) {
        if (!dimension.groups.has(entry.id)) dimension.groups.set(entry.id,{id:entry.id,name:entry.name,items:new Map()});
        const group = dimension.groups.get(entry.id);
        for (const item of list(entry.items)) group.items.set(item.id,{id:item.id,name:item.name,description:item.description});
      }
    }
    return [...dimensions.values()];
  }
  function scoreOf(record,id) {
    if (id===total) return record.score;
    for (const dimension of list(record.dimensions)) {
      if (dimension.id===id) return dimension.weightedScore ?? dimension.score;
      for (const group of list(dimension.groups)) {
        const items = list(group.items);
        if (group.id===id) return group.weightedScore ?? items.reduce((sum,item)=>sum+(Number(item.score)||0),0);
        const item = items.find(item=>item.id===id);
        if (item) return item.score;
      }
    }
    return null;
  }
  function percentages(rows,id) {
    return mean(rows.map(row=>{
      const item = list(row.items).find(item=>item.id===id);
      return item?.maxScore>0 ? 100*item.score/item.maxScore : null;
    }));
  }
  function diagnostics(rows,catalog) {
    return catalog.map(dimension=>({name:dimension.name,id:dimension.id,
      value:mean(rows.map(row=>list(row.dimensions).find(item=>item.id===dimension.id)?.score))}));
  }
  const empty = message => `<p class="d-page-empty">${e(message)}</p>`;
  function checkbox(field,value,label,checked=false) {
    return `<label><input type="checkbox" name="${e(field)}" value="${e(value)}"${checked?' checked':''}> <span>${e(label)}</span></label>`;
  }
  function picker(label,name,options,selected=[]) {
    return `<details class="qid-picker" data-filter-label="${e(label)}"><summary>${e(label)}${selected.length?' · 已选 '+selected.length:''}</summary>
      <div class="qid-popover">${options.length?options.map(([id,label])=>checkbox(name,id,label,selected.includes(id))).join(''):empty('暂无可选项')}</div></details>`;
  }
  function metricPicker(catalog,values,area,required=false) {
    const make = (node,depth) => checkbox('metric',node.id,node.name,values.includes(node.id)).replace('<label>',`<label class="qid-metric-level-${depth}">`);
    const count = 1 + catalog.reduce((count,dimension)=>count+1+[...dimension.groups.values()]
      .reduce((groups,group)=>groups+1+(area==='trend'?0:group.items.size),0),0);
    return `<details class="qid-picker" data-metrics="${area}"><summary>诊断项 · 已选 ${values.length}</summary>
      <div class="qid-popover" aria-label="${e(area==='trend'?'趋势诊断项':'列表诊断项')}">
      ${checkbox('allMetrics','all','全选',values.length===count)}
      <label><input type="checkbox" name="metric" value="total" ${values.includes(total)?'checked ':''}${required?' disabled':''}> <span>质检总分</span></label>
      ${catalog.map(dimension=>make(dimension,0)+[...dimension.groups.values()].map(group=>make(group,1)+
        (area==='trend'?'':[...group.items.values()].map(item=>make(item,2)).join(''))).join('')).join('')}
      </div></details>`;
  }
  function metricColumns(catalog,selection) {
    const options = catalog.flatMap(dimension=>[dimension,...[...dimension.groups.values()].flatMap(group=>[group,...group.items.values()])]);
    return [{id:total,name:'质检总分'},...options].filter(option=>selection.includes(option.id));
  }
  function section(title,attribute,content='',actions='') {
    return `<section class="table-card qid-card" ${attribute}><div class="list-toolbar"><h2>${e(title)}</h2>${actions}</div>${content}</section>`;
  }

  function render(_context) {
    return '<section class="platform-page qid-page" data-quality-dashboard data-page="quality-dashboard"><header class="d-page-heading"><h1>质检看板</h1></header><div data-qid-body></div></section>';
  }

  function init(context) {
    const root = document.querySelector('[data-quality-dashboard]');
    const body = root?.querySelector('[data-qid-body]');
    if (!body) return;
    const sameScope = () => {
      const access = quality()?.access(context);
      const active = quality()?.access();
      return root.isConnected && DApp.currentPage()===pageId && Boolean(access && active &&
        access.tenantId===active.tenantId && access.brandId===active.brandId && access.accountId===active.accountId);
    };
    if (!sameScope()) {
      body.innerHTML = empty('请选择有权限的租户或坐席。');
      return;
    }

    const service = quality();
    const initial = () => ({range:recent(7),preset:7,seatIds:[],series:[]});
    let filters = initial();
    let rows = [], filtered = [], catalog = [], group = '', dimension = '', granularity = 'day', insightPeriod = 'week';
    let advancedClue = false;
    const tableState = {
      worker:{page:1,size:10,sort:total,direction:-1,metrics:[total]},
      clue:{page:1,size:10,sort:'firstCall',direction:-1,metrics:[total]},
      trend:{metrics:[total]}
    };
    const clueSearch = {};
    const initialWorkerSearch = () => ({field:'qualityAverage',operator:'min',value:''});
    let workerSearch = initialWorkerSearch();
    const workerFields = [['qualityAverage','质检均分','分'],['itemAverage','细项指标均分','分'],
      ['deductionAverage','合规及红线扣分','分'],['avgDuration','平均通话时长','秒']];
    const datePresets = [[1,'昨天'],[7,'前7天'],[30,'前30天']];
    const periods = [['day','天'],['week','周'],['month','月']];
    const clueSelectors = [['leadCode','线索编码'],['customerName','客户姓名'],['phone','联系电话'],
      ['leadType','线索类型','select'],['source','线索来源','select'],['channel','线索 R 渠道','select'],
      ['seatName','坐席名称'],['dealer','经销商名称']];
    const pick = selector => body.querySelector(selector);
    const rowSeat = row => row.seatId || row.accountId;
    const dateFilter = (range,key) => rows.filter(row=>{
      const date = day(row[key] || row.callAt);
      return date && date>=range[0] && date<=range[1] &&
        (!filters.seatIds.length || filters.seatIds.includes(rowSeat(row))) &&
        (!filters.series.length || filters.series.includes(row.series));
    });

    function refreshData() {
      rows = list(service.records()).map(row=>({...row,seatKey:rowSeat(row)}));
      filtered = dateFilter(filters.range,'callAt');
      catalog = catalogFor(rows);
    }

    function draw() {
      if (!sameScope()) return;
      refreshData();
      const [start,end] = filters.range;
      body.innerHTML = `<form class="filter-panel qid-main-filter" data-qid-filter aria-label="质检看板筛选">
        <div class="qid-segment" aria-label="日期快捷选项">${datePresets.map(([value,label])=>`<button type="button" class="btn" data-days="${value}" aria-pressed="${filters.preset===value}">${label}</button>`).join('')}</div>
        <label class="field"><span>开始日期</span><input type="date" name="start" value="${e(start)}" required></label>
        <label class="field"><span>结束日期</span><input type="date" name="end" value="${e(end)}" required></label>
        ${picker('车系','series',available(rows,'series'),filters.series)}
        ${picker('坐席账号','seatIds',available(rows,'seatKey','seatName').map(([id,label])=>[id,label+'（'+id+'）']),filters.seatIds)}
        <div class="filter-actions"><button type="button" class="btn" data-qid-reset>重置</button><button type="submit" class="btn btn-primary">查询</button></div>
      </form>
      <div class="qid-overview" data-qid-overview aria-label="质检总览"></div>
      ${section('员工质检','data-qid-breakdown')}
      ${section('诊断内容及建议','data-qid-diagnosis')}
      ${section('数据趋势','data-qid-trend')}
      ${section('员工诊断列表','data-qid-worker')}
      ${section('线索诊断列表','data-qid-clue')}
      <div data-qid-insights></div>`;
      const form = pick('[data-qid-filter]');
      form.oninput = event=>{
        if (event.target.type==='date') {
          form.dataset.preset = '';
          form.querySelectorAll('[data-days]').forEach(button=>button.setAttribute('aria-pressed','false'));
        }
      };
      form.onsubmit = event=>{
        event.preventDefault();
        if (!sameScope()) return;
        const data = new FormData(form);
        if (data.get('start')>data.get('end')) return DUI.toast('开始日期应早于或等于结束日期。');
        filters = {range:[data.get('start'),data.get('end')],preset:Number(form.dataset.preset ?? filters.preset),
          seatIds:data.getAll('seatIds'),series:data.getAll('series')};
        tableState.worker.page = tableState.clue.page = 1;
        draw();
      };
      drawOverview();
      drawBreakdown();
      drawTrend();
      drawWorkers();
      drawClues();
      window.DQualityInspectionInsights.draw(pick('[data-qid-insights]'),filtered,{period:insightPeriod,
        endDate:filters.range[1],onPeriodChange:next=>{insightPeriod=next;},isCurrent:sameScope});
    }

    function drawOverview() {
      const [start,end] = filters.range;
      const span = Math.round((dayTime(end)-dayTime(start))/dayMs)+1;
      const previous = [offset(start,-span),offset(start,-1)];
      const currentCalls = dateFilter(filters.range,'qualityAt').filter(row=>row.inspected);
      const priorCalls = dateFilter(previous,'qualityAt').filter(row=>row.inspected);
      const leadAverage = calls=>mean(scopedLeads(calls).map(group=>mean(group.map(row=>row.score))));
      const measures = [
        ['线索总量',scopedLeads(dateFilter(filters.range,'receivedAt')).length,scopedLeads(dateFilter(previous,'receivedAt')).length,'按线索接收日期统计'],
        ['诊断线索总量',scopedLeads(currentCalls).length,scopedLeads(priorCalls).length,'按完成质检的线索统计'],
        ['质检均分',leadAverage(currentCalls),leadAverage(priorCalls),'已诊断线索平均得分，满分 100']
      ];
      const access = service.access();
      const chosenSeats = available(rows,'seatKey','seatName').filter(([id])=>filters.seatIds.includes(id));
      const seatScope = access?.role==='seat' ? (access.accountName || '本人') :
        chosenSeats.map(([,label])=>label).join('、') || '全部坐席';
      const seatCard = `<article class="table-card qid-stat qid-seat-stat"><span>坐席范围</span><strong>${e(seatScope)}</strong></article>`;
      pick('[data-qid-overview]').innerHTML = seatCard+measures.map(([label,value,last,hint])=>{
        const change = last>0 && value!=null ? 100*(value-last)/last : null;
        return `<article class="table-card qid-stat" title="${e(hint)}"><span>${label}</span><strong>${fmt(value)}</strong>
          <small>环比 <b class="${change>0?'qid-up':change<0?'qid-down':''}">${change==null?'—':(change>0?'+':'')+fmt(change)+'%'}</b></small></article>`;
      }).join('');
      const completed = inspected(filtered);
      const scores = diagnostics(completed,catalog).filter(item=>item.value!=null).sort((a,b)=>a.value-b.value);
      const flags = completed.filter(row=>row.redLine).length;
      const sensitive = mean(completed.map(row=>row.sensitiveDeduction));
      const knowledge = mean(completed.map(row=>row.knowledgeDeduction));
      const weakest = scores[0];
      const weakCatalog = catalog.find(item=>item.id===weakest?.id);
      const weakItems = [...(weakCatalog?.groups.values() || [])].flatMap(group=>[...group.items.values()])
        .map(item=>({name:item.name,value:percentages(completed,item.id)}))
        .filter(item=>item.value!=null).sort((a,b)=>a.value-b.value).slice(0,2);
      const content = scores.length ?
        `<p class="qid-summary">当前筛选范围有 ${scopedLeads(completed).length} 条线索完成质检。得分较低的维度为「${e(weakest.name)}」${fmt(weakest.value)} 分，命中红线 ${flags} 次。服务禁语平均扣 ${fmt(sensitive)} 分，产品知识平均扣 ${fmt(knowledge)} 分。</p>
         <ul class="qid-advice"><li>优先复盘「${e(weakest.name)}」维度的低分话单。${weakItems.length?'重点检查'+e(weakItems.map(item=>item.name+'（'+fmt(item.value)+' 分）').join('、'))+'。':''}</li>
         ${flags?'<li>复核命中红线的会话片段，并检查对应扣分和申诉结果。</li>':''}</ul>` :
        empty('暂无已质检数据。');
      pick('[data-qid-diagnosis]').innerHTML = `<div class="list-toolbar"><h2>诊断内容及建议</h2></div>${content}`;
    }

    function drawBreakdown() {
      const completed = inspected(filtered);
      const scores = diagnostics(completed,catalog);
      const selected = catalog.find(item=>item.id===dimension) || catalog[0];
      dimension = selected?.id || '';
      const groups = selected ? [...selected.groups.values()] : [];
      const currentGroup = groups.find(item=>item.id===group);
      const scoreGroups = currentGroup ? [currentGroup] : groups;
      const present = pick('[data-qid-breakdown]');
      const compliance = [
        ['服务禁语均扣',mean(completed.map(row=>row.sensitiveDeduction)),'分'],
        ['产品知识均扣',mean(completed.map(row=>row.knowledgeDeduction)),'分'],
        ['违规下发次数',completed.filter(row=>row.violation).length,'次'],
        ['触发红线次数',completed.filter(row=>row.redLine).length,'次']
      ];
      const toggle = (action,id,label,on)=>`<button type="button" class="btn" data-${action}="${e(id)}" aria-pressed="${on}">${e(label)}</button>`;
      present.innerHTML = `<div class="list-toolbar"><h2>员工质检</h2></div>
        <div class="qid-breakdown">
          <div class="qid-chart"><h3>质检得分</h3>
            <p class="qid-indicator-average"><span>细项指标均分</span><strong>${fmt(mean(completed.map(row=>row.dimensionScore)))}</strong></p>
            ${completed.length?'<canvas width="580" height="306" role="img" aria-label="按质检维度展示得分的雷达图"></canvas>':empty('暂无质检得分。')}
            <dl class="qid-score-list">${scores.map((item,i)=>`<div><dt><span aria-hidden="true">${i+1}</span>${e(item.name)}</dt><dd>${fmt(item.value)}</dd></div>`).join('')}</dl>
          </div><div class="qid-detail-scores"><h3>细项拆解</h3>
            <div class="qid-segment" aria-label="一级分类">${catalog.map(item=>toggle('dimension',item.id,item.name,item.id===dimension)).join('')}</div>
            <div class="qid-segment qid-segment-light" aria-label="二级分类">${toggle('score-group','','全部',!currentGroup)}${groups.map(item=>toggle('score-group',item.id,item.name,item.id===group)).join('')}</div>
            ${scoreGroups.length && completed.length ? scoreGroups.map(entry=>`<section class="qid-score-group">
              ${currentGroup?'':`<h4>${e(entry.name)}</h4>`}
              ${[...entry.items.values()].map(item=>{
                const percent=percentages(completed,item.id);
                return `<div class="qid-progress" title="${e(item.description)}"><span>${e(item.name)}</span>
                  <progress max="100" value="${percent ?? 0}" aria-label="${e(item.name)}"></progress><b>${fmt(percent)}${percent==null?'':' 分'}</b></div>`;
              }).join('')}</section>`).join(''):empty('暂无细项得分。')}
          </div>
        </div>
        <div class="qid-compliance">
          <h3>合规及红线扣分汇总</h3>
          <dl>${compliance.map(([label,value,unit])=>`<div><dt>${label}</dt><dd>${fmt(value)}${value==null?'':' '+unit}</dd></div>`).join('')}</dl>
        </div>`;
      if (completed.length) drawRadar(present.querySelector('canvas'),scores.map(item=>item.value ?? 0));
    }

    function bucket(value) {
      if (granularity==='month') return value.slice(0,7);
      if (granularity==='week') {
        const weekDay = new Date(dayTime(value)).getUTCDay();
        return offset(value,-(weekDay+6)%7);
      }
      return value;
    }
    function drawTrend() {
      const node = pick('[data-qid-trend]');
      const selected = metricColumns(catalog,tableState.trend.metrics);
      const completed = inspected(filtered);
      const dates = new Map();
      for (const record of completed) {
        const key=bucket(day(record.callAt));
        if (!dates.has(key)) dates.set(key,[]);
        dates.get(key).push(record);
      }
      const keys = [...dates.keys()].sort();
      const series = selected.map((metric,index)=>({name:metric.name,color:chartColors[index%chartColors.length],
        values:keys.map(date=>mean(dates.get(date).map(record=>scoreOf(record,metric.id))))}));
      node.innerHTML = `<div class="list-toolbar"><h2>数据趋势</h2><div class="qid-actions">
        ${metricPicker(catalog,tableState.trend.metrics,'trend')}
        <div class="qid-segment" aria-label="趋势日期粒度">${periods.map(([value,label])=>`<button type="button" class="btn" data-trend-period="${value}" aria-pressed="${value===granularity}">${label}</button>`).join('')}</div></div></div>
        ${keys.length&&series.length?`<div class="qid-chart qid-trend-chart"><div class="qid-trend-plot"><canvas width="970" height="280" role="img" aria-label="按已选诊断项展示日、周或月质检得分"></canvas>
          <div class="qid-trend-tooltip" role="tooltip" hidden></div></div>
          <div class="qid-legend">${series.map(item=>`<span><i style="background:${item.color}"></i>${e(item.name)}</span>`).join('')}</div>
          <details><summary>趋势数据</summary><div class="table-scroll"><table class="platform-table">
          <thead><tr><th scope="col">${granularity==='week'?'周起始日期':'日期'}</th>${series.map(item=>`<th scope="col">${e(item.name)}</th>`).join('')}</tr></thead>
          <tbody>${keys.map((date,i)=>`<tr><th scope="row">${e(date)}</th>${series.map(item=>`<td>${fmt(item.values[i])}</td>`).join('')}</tr>`).join('')}</tbody>
          </table></div></details></div>`:empty('暂无符合条件的趋势数据。')}`;
      if (keys.length && series.length) drawLines(node.querySelector('canvas'),keys,series);
    }

    function workers() {
      return aggregate(filtered,row=>rowSeat(row)).map(calls=>{
        const completed = inspected(calls);
        const connected = calls.filter(row=>row.connected);
        const valid = calls.filter(row=>row.validCall);
        return {calls,completed,seatName:calls[0].seatName,
          connected:scopedLeads(connected).length,dialed:scopedLeads(calls).length,
          avgDuration:mean(connected.map(row=>row.duration)),validRate:connected.length ? 100*valid.length/connected.length : null,
          diagnosed:completed.length,qualityAverage:mean(completed.map(row=>row.score)),
          itemAverage:mean(completed.map(row=>row.dimensionScore)),deductionAverage:mean(completed.map(deduction))};
      }).filter(row=>{
        if (workerSearch.value==='') return true;
        const score = row[workerSearch.field];
        if (score==null) return false;
        const entered = Number(workerSearch.value);
        const displayed = Math.round(score*10)/10;
        return workerSearch.operator==='eq' ? displayed===entered :
          workerSearch.operator==='max' ? displayed<=entered : displayed>=entered;
      });
    }
    function clues() {
      return aggregate(filtered,row=>JSON.stringify([rowSeat(row),row.leadCode||row.id])).map(calls=>{
        const chronological = [...calls].sort((a,b)=>String(a.callAt).localeCompare(String(b.callAt)));
        const first = chronological[0], last = chronological.at(-1);
        const completed = inspected(chronological);
        const focal = completed.at(-1) || last;
        return {...last,calls,completed,recordId:focal.id,tagReview:focal.tagReview,firstCall:first.callAt,lastCall:last.callAt,
          callCount:calls.length,totalDuration:calls.reduce((sum,row)=>sum+(Number(row.duration)||0),0),
          appealCount:calls.reduce((sum,row)=>sum+(row.appealCount||0),0),
          itemAverage:mean(completed.map(row=>row.dimensionScore)),deductionAverage:mean(completed.map(deduction))};
      }).filter(row=>clueSelectors.every(([key,,type])=>!clueSearch[key] ||
        (type==='select' ? row[key]===clueSearch[key] : String(row[key]||'').toLocaleLowerCase().includes(clueSearch[key].toLocaleLowerCase()))));
    }
    const col = (key,label,format) => ({key,label,value:row=>row[key],format});
    const workerBase = [
      col('seatName','坐席名称'),col('dialed','拨打线索总量',fmt),col('connected','接通线索总量',fmt),
      col('avgDuration','平均通话时长',value=>value==null?'—':duration(value)),
      col('validRate','有效通话率',value=>value==null?'—':fmt(value)+'%'),col('diagnosed','诊断通话总量',fmt)
    ];
    const clueBase = [
      ...['leadCode','customerName','phone','leadType','source','channel'].map(key=>col(key,clueSelectors.find(field=>field[0]===key)[1])),
      col('series','车系'),col('seatName','坐席名称'),col('dealer','经销商名称'),col('appealCount','申诉细项个数',fmt),
      col('firstCall','首次通话时间'),col('lastCall','末次通话时间'),
      col('callCount','通话次数',fmt),col('totalDuration','通话总时长',duration)
    ];
    function tableColumns(base,state) {
      return [...base,...metricColumns(catalog,state.metrics).map(metric=>({key:metric.id,label:metric.id===total?'质检均分':metric.name,
        value:row=>mean(row.completed.map(record=>scoreOf(record,metric.id))),format:fmt})),
        col('itemAverage','细项指标均分',fmt),col('deductionAverage','合规及红线扣分',fmt)];
    }
    function sorted(values,columns,state) {
      const column = columns.find(entry=>entry.key===state.sort);
      if (!column) return values;
      return [...values].sort((a,b)=>{
        const av=column.value(a), bv=column.value(b);
        if (av==null || bv==null) return av==null ? Number(bv!=null) : -1;
        const order=typeof av==='number' && typeof bv==='number' ? av-bv : String(av).localeCompare(String(bv),'zh-CN');
        return state.direction*order;
      });
    }
    function table(area,values,columns,actions) {
      const state=tableState[area];
      const pages=Math.max(1,Math.ceil(values.length/state.size));
      state.page=Math.max(1,Math.min(state.page,pages));
      const offset=(state.page-1)*state.size;
      return `<div class="table-scroll" role="region" aria-label="${area==='worker'?'员工诊断列表':'线索诊断列表'}" tabindex="0">
      <table class="platform-table qid-table"><thead><tr><th scope="col">序号</th>${columns.map(column=>`<th scope="col"
        ${state.sort===column.key?'aria-sort="'+(state.direction===1?'ascending':'descending')+'"':''}><button type="button" class="btn-link"
          data-qid-sort="${e(column.key)}" data-table="${area}">${e(column.label)}${state.sort===column.key?(state.direction===1?' ▲':' ▼'):''}</button></th>`).join('')}
        ${actions?'<th scope="col">操作</th>':''}</tr></thead>
      <tbody>${values.slice(offset,offset+state.size).map((row,index)=>`<tr><td>${offset+index+1}</td>${columns.map(column=>{
        const value=column.value(row);
        return `<td>${e(column.format?column.format(value):show(value))}</td>`;
      }).join('')}${actions?'<td>'+actions(row)+'</td>':''}</tr>`).join('') ||
        `<tr><td colspan="${columns.length+(actions?2:1)}">暂无符合条件的数据</td></tr>`}</tbody></table></div>
      <div class="qid-pagination" aria-label="列表分页">
        <span>共 ${values.length} 条记录</span>
        <label>每页 <select data-qid-size="${area}" aria-label="每页条数">${[10,20,50,100].map(size=>`<option value="${size}" ${state.size===size?'selected':''}>${size} 条</option>`).join('')}</select></label>
        <button type="button" class="btn" data-qid-step="-1" data-table="${area}" ${state.page<=1?'disabled':''}>上一页</button>
        <label>页码 <select data-qid-page="${area}" aria-label="页码">${Array.from({length:pages},(_,i)=>`<option value="${i+1}" ${state.page===i+1?'selected':''}>第 ${i+1} 页</option>`).join('')}</select></label>
        <button type="button" class="btn" data-qid-step="1" data-table="${area}" ${state.page>=pages?'disabled':''}>下一页</button>
      </div>`;
    }
    function drawWorkers() {
      const state = tableState.worker, columns = tableColumns(workerBase,state);
      const node = pick('[data-qid-worker]');
      node.innerHTML = `<div class="list-toolbar"><h2>员工诊断列表</h2><div class="qid-actions">
        ${metricPicker(catalog,state.metrics,'worker',true)}<button type="button" class="btn" data-qid-export="worker">导出数据</button></div></div>
        <form class="filter-panel qid-worker-filter" data-qid-worker-filter aria-label="员工诊断筛选">
          <label class="field"><span>指标</span><select name="field">${workerFields.map(([id,label,unit])=>
            `<option value="${id}" data-unit="${unit}" ${workerSearch.field===id?'selected':''}>${label}</option>`).join('')}</select></label>
          <label class="field"><span>比较</span><select name="operator">${[['min','大于等于'],['max','小于等于'],['eq','等于']].map(([id,label])=>
            `<option value="${id}" ${workerSearch.operator===id?'selected':''}>${label}</option>`).join('')}</select></label>
          <label class="field"><span>数值（${workerFields.find(([id])=>id===workerSearch.field)[2]}）</span>
            <input type="number" min="0" step="any" name="value" value="${e(workerSearch.value)}" placeholder="输入查询数值"></label>
          <div class="filter-actions"><button type="button" class="btn" data-qid-clear-worker>重置</button><button class="btn btn-primary" type="submit">查询</button></div>
        </form>${table('worker',sorted(workers(),columns,state),columns)}`;
      const form = node.querySelector('form');
      form.elements.field.onchange = ()=>{form.elements.value.previousElementSibling.textContent =
        '数值（'+form.elements.field.selectedOptions[0].dataset.unit+'）';};
      form.onsubmit = event=>{
        event.preventDefault();
        if (!sameScope()) return;
        const data = new FormData(form);
        workerSearch = {field:data.get('field'),operator:data.get('operator'),value:data.get('value')};
        state.page=1;
        drawWorkers();
      };
    }
    function drawClues() {
      const state = tableState.clue, columns = tableColumns(clueBase,state);
      const node = pick('[data-qid-clue]');
      const canVerify = service.access()?.canVerifyTags;
      const field = ([key,label,type])=>`<label class="field"><span>${label}</span>
        ${type==='select'?`<select name="${key}"><option value="">全部</option>${available(filtered,key).map(([value,label])=>
          `<option value="${e(value)}" ${clueSearch[key]===value?'selected':''}>${e(label)}</option>`).join('')}</select>`:
          `<input type="search" name="${key}" value="${e(clueSearch[key])}" placeholder="请输入${label}">`}</label>`;
      node.innerHTML = `<div class="list-toolbar"><h2>线索诊断列表</h2><div class="qid-actions">
          <button type="button" class="btn" data-qid-export="clue">导出数据</button>
          <button type="button" class="btn" data-qid-export="details">导出质检明细</button></div></div>
        <form class="filter-panel qid-clue-filter" data-qid-clue-filter aria-label="线索诊断筛选">
          ${clueSelectors.slice(0,3).map(field).join('')}
          ${metricPicker(catalog,state.metrics,'clue',true)}<div class="filter-actions"><button type="button" class="btn" data-qid-clear-clue>重置</button><button class="btn btn-primary" type="submit">查询</button></div>
          <details class="qid-clue-more" data-qid-clue-more ${advancedClue?'open':''}><summary>更多筛选</summary>
            <div>${clueSelectors.slice(3).map(field).join('')}</div></details>
        </form>
        ${table('clue',sorted(clues(),columns,state),columns,row=>`<button class="btn-link" type="button" data-qid-record="${e(row.recordId)}">详情</button>
          <button class="btn-link" type="button" data-qid-record="${e(row.recordId)}" data-qid-record-tab="tags">${canVerify?(row.tagReview?'重新检核':'检核'):'查看检核'}</button>`)}`;
      pick('[data-qid-clue-more]').ontoggle = event=>{advancedClue=event.target.open;};
      pick('[data-qid-clue-filter]').onsubmit = event=>{
        event.preventDefault();
        if (!sameScope()) return;
        for (const [key] of clueSelectors) clueSearch[key]=event.target.elements[key].value.trim();
        state.page=1;
        drawClues();
      };
    }
    const tableDraw = {worker:drawWorkers,clue:drawClues,trend:drawTrend};
    function exportSelected(area,button) {
      const download = (name,headers,values) => values.length ?
        window.DQualityInspectionDetail.downloadXlsx(button,name+'_'+today(),headers,values) : DUI.toast('暂无可导出的数据。');
      if (area==='details') {
        const lines = clues().flatMap(row=>row.completed.flatMap(record=>[...list(record.items),...list(record.redLines)].map(item=>[
          record.leadCode,record.callId,record.seatName,record.qualityAt,record.score,item.name,item.score,item.maxScore,
          item.passed?'通过':'未通过',item.appealStatusLabel || ''])));
        return download('质检明细',['线索编码','通话编号','坐席名称','质检时间','质检总分','诊断项','得分','满分','判定','申诉状态'],lines);
      }
      const state = tableState[area];
      const columns = tableColumns(area==='worker'?workerBase:clueBase,state);
      const values = sorted(area==='worker'?workers():clues(),columns,state);
      download(area==='worker'?'员工诊断列表':'线索诊断列表',columns.map(column=>column.label),values.map(row=>columns.map(column=>{
        const value=column.value(row);
        return column.format?column.format(value):value;
      })));
    }
    body.onchange = event=>{
      if (!sameScope()) return;
      const control=event.target;
      const picker=control.closest('[data-metrics]');
      if (picker && ['metric','allMetrics'].includes(control.name)) {
        const area=picker.dataset.metrics, state=tableState[area];
        if (control.name==='allMetrics') {
          picker.querySelectorAll('input[name="metric"]:not(:disabled)').forEach(input=>{input.checked=control.checked||input.value===total;});
        }
        const values=[...picker.querySelectorAll('input[name="metric"]:checked')].map(input=>input.value);
        if (!values.length) {control.checked=true;return DUI.toast('请至少保留一个诊断项。');}
        state.metrics=values;
        if (Object.hasOwn(state,'page')) state.page=1;
        tableDraw[area]();
        const reopened=pick(`[data-metrics="${area}"]`);
        if (reopened) reopened.open=true;
      } else if (control.closest('[data-filter-label]')) {
        const filter = control.closest('[data-filter-label]');
        const count = filter.querySelectorAll('input:checked').length;
        filter.querySelector('summary').textContent = filter.dataset.filterLabel+(count?' · 已选 '+count:'');
      } else if (control.dataset.qidSize || control.dataset.qidPage) {
        const area=control.dataset.qidSize || control.dataset.qidPage;
        const state=tableState[area];
        if (control.dataset.qidSize) Object.assign(state,{size:Number(control.value),page:1});
        else state.page=Number(control.value);
        tableDraw[area]();
      }
    };
    body.onclick = event=>{
      if (!sameScope()) return;
      body.querySelectorAll('.qid-picker[open]').forEach(picker=>{if (!picker.contains(event.target)) picker.open=false;});
      const button=event.target.closest('button');
      if (!button || button.disabled) return;
      const data=button.dataset;
      if (data.days) {
        const form=pick('[data-qid-filter]'),range=recent(Number(data.days));
        form.elements.start.value=range[0];
        form.elements.end.value=range[1];
        form.dataset.preset=data.days;
        form.requestSubmit();
      } else if ('qidReset' in data) {
        filters=initial();
        tableState.worker.page=tableState.clue.page=1;
        draw();
      } else if ('dimension' in data || 'scoreGroup' in data) {
        if ('dimension' in data) {dimension=data.dimension;group='';}
        else group=data.scoreGroup;
        drawBreakdown();
      } else if (data.trendPeriod) {
        granularity=data.trendPeriod;
        drawTrend();
      } else if (data.qidSort || data.qidStep) {
        const state=tableState[data.table];
        if (data.qidSort) {
          state.direction=state.sort===data.qidSort ? -state.direction : -1;
          state.sort=data.qidSort;
          state.page=1;
        } else {
          state.page+=Number(data.qidStep);
        }
        tableDraw[data.table]();
      } else if ('qidClearWorker' in data) {
        workerSearch=initialWorkerSearch();
        tableState.worker.page=1;
        drawWorkers();
      } else if ('qidClearClue' in data) {
        for (const [key] of clueSelectors) clueSearch[key]='';
        tableState.clue.page=1;
        drawClues();
      } else if (data.qidExport) {
        exportSelected(data.qidExport,button);
      } else if (data.qidRecord && service.record(data.qidRecord)) {
        const detail=window.DQualityInspectionDetail;
        if (detail?.open) detail.open(data.qidRecord,{tab:data.qidRecordTab || 'staff',onSaved:draw});
        else DApp.openPage('PAGE-21019',{nativeOptions:{recordId:data.qidRecord}});
      }
    };
    draw();
  }

  function drawRadar(canvas,values) {
    const ctx=canvas.getContext('2d');
    if (!ctx || values.length<3) return;
    const x=canvas.width/2,y=canvas.height/2,radius=112;
    const points=(scale)=>values.map((_,i)=>{
      const a=2*Math.PI*i/values.length-Math.PI/2, r=radius*(Array.isArray(scale)?scale[i]:scale);
      return [x+Math.cos(a)*r,y+Math.sin(a)*r];
    });
    function polygon(coords,color,fill) {
      ctx.beginPath();
      coords.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
      ctx.closePath();
      ctx.strokeStyle=color;
      if (fill) {ctx.fillStyle=fill;ctx.fill();}
      ctx.stroke();
    }
    for (const level of [0.25,0.5,0.75,1]) polygon(points(level),'#d9e2ed');
    for (const [px,py] of points(1)) {
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(px,py);ctx.strokeStyle='#d9e2ed';ctx.stroke();
    }
    polygon(points(values.map(value=>Math.max(0,Math.min(100,value))/100)),'#1677ff','rgba(22,119,255,.2)');
    ctx.fillStyle='#345075';
    ctx.font='13px sans-serif';ctx.textAlign='center';
    points(1.21).forEach(([px,py],i)=>ctx.fillText(String(i+1),px,py+5));
  }
  function drawLines(canvas,dates,series) {
    const ctx=canvas.getContext('2d');
    if (!ctx) return;
    const width=canvas.width-67,height=canvas.height-68,left=43,top=18;
    const peak=Math.max(10,Math.ceil(Math.max(...series.flatMap(line=>line.values).filter(Number.isFinite))/10)*10);
    const x=i=>left+(dates.length===1?width/2:i*width/(dates.length-1));
    const y=value=>top+height*(1-value/peak);
    ctx.font='12px sans-serif';ctx.fillStyle='#536175';ctx.textAlign='right';
    for (let i=0;i<=5;i++) {
      const value=peak*i/5, py=y(value);
      ctx.beginPath();ctx.moveTo(left,py);ctx.lineTo(left+width,py);ctx.strokeStyle='#e1e7ef';ctx.stroke();
      ctx.fillText(String(value),left-6,py+4);
    }
    ctx.textAlign='center';
    const step=Math.max(1,Math.ceil(dates.length/9));
    dates.forEach((date,i)=>{if (i%step===0 || i===dates.length-1) ctx.fillText(date,x(i),top+height+20);});
    for (const item of series) {
      ctx.strokeStyle=item.color;ctx.fillStyle=item.color;ctx.lineWidth=2;
      ctx.beginPath();
      item.values.forEach((value,i)=>{
        if (Number.isFinite(value)) (i===0 || !Number.isFinite(item.values[i-1])) ? ctx.moveTo(x(i),y(value)) : ctx.lineTo(x(i),y(value));
      });
      ctx.stroke();
      if (dates.length<24) item.values.forEach((value,i)=>{
        if (!Number.isFinite(value)) return;
        ctx.beginPath(); ctx.arc(x(i),y(value),3,0,Math.PI*2); ctx.fill();
      });
    }
    const tooltip = canvas.parentElement.querySelector('[role="tooltip"]');
    canvas.onpointermove = event=>{
      const rect = canvas.getBoundingClientRect();
      const plotX = (event.clientX-rect.left)*canvas.width/rect.width;
      const index = dates.length===1 ? 0 : Math.round((plotX-left)*(dates.length-1)/width);
      if (!dates[index] || plotX<left || plotX>left+width) {
        tooltip.hidden = true;
        return;
      }
      tooltip.innerHTML = `<strong>${e(dates[index])}</strong>`+series.map(line=>
        `<span>${e(line.name)} · ${fmt(line.values[index])}</span>`).join('');
      tooltip.hidden = false;
      const position = x(index)*rect.width/canvas.width+10;
      tooltip.style.left = Math.max(0,Math.min(position,rect.width-tooltip.offsetWidth))+'px';
    };
    canvas.onpointerleave = ()=>{tooltip.hidden=true;};
  }

  window.Pages[pageId]={render,init};
})();
