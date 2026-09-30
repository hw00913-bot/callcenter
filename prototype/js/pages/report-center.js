/** Call and lead reports. Read-only views over scoped official facts and platform follow-up. */
(function () {
  'use strict';
  const ui = PlatformUI, esc = ui.escape, data = CloudReportData, metrics = CloudReportMetrics;
  const definitions = {
    overview: ['通话总览', 'cloud-overview-report', '查看各类呼叫的整体表现', '按呼叫方式统计'],
    leads: ['线索成效', 'cloud-lead-report', '按线索编码汇总联系进展、客户意向和到店计划', '线索跟进明细'],
    customers: ['客户跟进', 'cloud-customer-report', '查看导入名单的分配与跟进情况', '导入批次跟进明细'],
    outbound: ['外呼任务', 'cloud-outbound-report', '对比预外呼和自动外呼任务的执行成效', '任务执行明细'],
    agents: ['坐席成效', 'cloud-agent-report', '查看坐席的客户联系与人工通话表现', '坐席成效明细'],
    inbound: ['呼入服务', 'cloud-inbound-report', '查看客户呼入、人工接待与排队情况', '呼入通话明细'],
    skills: ['服务技能', 'cloud-skill-report', '对比各服务技能的人工接待表现', '服务技能明细']
  };
  const filters = {}, pages = {}; let view = 'overview', context = '', drillState = null;
  const js = value => esc(JSON.stringify(String(value == null ? '' : value)));
  const action = (method, ...args) => `Pages['report-center'].${method}(${args.map(js).join(',')})`;
  const button = (label, method, ...args) => `<button type="button" class="text-link" onclick="${action(method, ...args)}">${esc(label)}</button>`;
  const humanView = () => ['agents', 'skills', 'inbound'].includes(view);
  const seconds = value => value === null || value === undefined || value === '—' ? '—' : `${Math.round(Number(value) * 10) / 10} 秒`;
  const dayText = value => { const at = metrics.timestamp(value); return at === null ? '—' : new Date(at).toLocaleDateString('sv-SE'); };
  const timeText = value => { const at = metrics.timestamp(value); return at === null ? '—' : new Date(at).toLocaleString('sv-SE'); };
  const businessLabel = (value, row) => value ? (window.CustomerBusiness?.get(value, row)?.label || value) : '未分类';
  const typeLabel = (value, row) => esc(businessLabel(value, row));
  const current = () => filters[view] || (filters[view] = data.defaults());
  const active = () => data.valid() && context === data.scopeKey();
  const sortRows = (rows, fallback) => ui.sortByUpdated?.(rows, fallback) || rows;
  const callFallback = call => [call.customerFollowup?.updatedAt, call.dispositionUpdatedAt, metrics.callTime(call), call.at];
  function leadListTime(row) {
    // A lead aggregates several source records; its latest real activity may be a follow-up edit.
    const items = row.items || [], calls = row.calls || [];
    const values = [...items.flatMap(item => [item.updatedAt, item.updateTime, item.localUpdatedAt, item.createdAt, item.at]), ...calls.flatMap(call => [call.updatedAt, call.updateTime, call.localUpdatedAt, ...callFallback(call)])];
    const times = values.map(metrics.timestamp).filter(at => at !== null);
    return times.length ? Math.max(...times) : row.lastContactAt ?? row.firstImportedAt;
  }
  const getModel = (key = view, overrides = {}) => {
    const model = data.getModel(key, { ...(filters[key] || data.defaults()), ...overrides });
    if (!model.error && Array.isArray(model.rows)) {
      if (key === 'leads') model.rows = sortRows(model.rows, leadListTime);
      else if (key === 'inbound') model.rows = sortRows(model.rows, row => {
        const call = row.calls?.[0];
        return call ? [call.updatedAt, call.updateTime, call.localUpdatedAt, ...callFallback(call)] : [];
      });
      else if (['customers', 'outbound'].includes(key)) model.rows = sortRows(model.rows);
    }
    return model;
  };
  const applied = () => active() ? getModel(view) : null;
  const navigate = () => navigateTo(definitions[view][1]);
  function select(id, label, value, options, change = '') {
    return `<label class="report-field"><span>${esc(label)}</span><select id="${id}" ${change ? `onchange="${action(change)}"` : ''}>${options.map(o => `<option value="${esc(o[0])}" ${String(value) === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
  }
  function filterHeader(model) {
    const f = model.filters, opts = data.options(), all = (rows, label) => [['', label], ...rows.map(r => [r.id, r.name])];
    if (view === 'leads') {
      const choices = (field,label) => select('report'+field[0].toUpperCase()+field.slice(1),label,f[field],[['','全部'],...data.fieldOptions(field,f.tenantId).map(v=>[v,v])]);
      const expanded=['leadLevel','intentionLevel','visitIntention','testDriveIntention','plannedStoreName','batchId','taskId','agentId'].some(k=>f[k]);
      return `${ui.pageHeader(definitions.leads[0],definitions.leads[2])}<section class="filter-panel report-filter"><div class="report-filter-line">${select('reportPeriod','线索导入周期',f.period,['今日','近 7 日','本月','自定义'].map(v=>[v,v]),'periodChanged')}<label class="report-field report-date"><span>开始日期</span><input id="reportStartDate" type="date" value="${esc(f.startDate)}" onchange="${action('dateChanged')}"></label><label class="report-field report-date"><span>结束日期</span><input id="reportEndDate" type="date" value="${esc(f.endDate)}" onchange="${action('dateChanged')}"></label><label class="report-field report-keyword"><span>搜索线索</span><input id="reportKeyword" value="${esc(f.keyword)}" placeholder="线索编码 / 姓名 / 手机号" onkeydown="if(event.key==='Enter')${action('query')}"></label><div class="report-query"><button class="btn btn-primary" onclick="${action('query')}">查询</button><button class="btn" onclick="${action('reset')}">重置</button></div></div><details class="report-more-filters" ${expanded?'open':''}><summary>更多筛选</summary><div class="report-filter-line">${choices('leadLevel','线索等级')}${choices('intentionLevel','意向等级')}${choices('visitIntention','到店意向')}${choices('testDriveIntention','试驾意向')}<label class="report-field"><span>计划到店门店</span><input id="reportPlannedStoreName" type="text" value="${esc(f.plannedStoreName)}" placeholder="输入门店名称" onkeydown="if(event.key==='Enter')${action('query')}"></label>${select('reportAgent','联系坐席',f.agentId,all(opts.agents,'全部坐席'))}${select('reportBatch','导入批次',f.batchId,all(opts.batches,'全部批次'))}${select('reportTask','关联任务',f.taskId,all(opts.tasks,'全部任务'))}</div></details><div id="reportFilterError" class="report-error" role="status"></div></section>`;
    }
    const fields = [];
    if (view !== 'inbound') fields.push(select('reportBusinessType', '业务类型', f.businessType, [['', '全部类型'], ...data.businessOptions(f.tenantId).map(row => [row.id, row.label]), ['unclassified', '未分类']]));
    if (view !== 'inbound') fields.push(select('reportCallType', '呼叫方式', f.callType, [['', '全部方式'], ...(view === 'outbound' ? ['预外呼', 'IVR 外呼'] : view === 'customers' ? ['人工外呼', '预外呼', 'IVR 外呼'] : ['人工外呼', '预外呼', 'IVR 外呼', '呼入']).map(t => [t, ui.callTypeLabel(t)])]));
    if (['overview', 'customers', 'outbound'].includes(view)) fields.push(select('reportBatch', '导入批次', f.batchId, all(opts.batches, '全部批次')), select('reportTask', '外呼任务', f.taskId, all(opts.tasks, '全部任务')));
    if (['overview', 'customers', 'agents', 'inbound', 'skills'].includes(view)) fields.push(select('reportAgent', '坐席', f.agentId, all(opts.agents, '全部坐席')));
    if (['overview', 'agents', 'inbound', 'skills'].includes(view)) fields.push(select('reportSkill', '服务技能', f.skillGroupId, all(opts.skills, '全部技能')));
    return `${ui.pageHeader(definitions[view][0], definitions[view][2])}<section class="filter-panel report-filter"><div class="report-filter-line">${select('reportPeriod', '统计周期', f.period, ['今日', '近 7 日', '本月', '自定义'].map(t => [t, t]), 'periodChanged')}<label class="report-field report-date"><span>开始日期</span><input id="reportStartDate" type="date" value="${esc(f.startDate)}" onchange="${action('dateChanged')}"></label><label class="report-field report-date"><span>结束日期</span><input id="reportEndDate" type="date" value="${esc(f.endDate)}" onchange="${action('dateChanged')}"></label><label class="report-field report-keyword"><span>关键词</span><input id="reportKeyword" value="${esc(f.keyword)}" placeholder="名称 / 号码 / 业务单据" onkeydown="if(event.key==='Enter')${action('query')}"></label><div class="report-query"><button type="button" class="btn btn-primary" onclick="${action('query')}">查询</button><button type="button" class="btn" onclick="${action('reset')}">重置</button></div></div><div class="report-filter-line">${fields.join('')}</div><div id="reportFilterError" class="report-error" role="status"></div></section>`;
  }
  function card(label, value, key, help, meta) {
    return `<div class="report-metric"><button type="button" onclick="${action('drill', 'metric', key)}" aria-label="查看${esc(label)}明细">${ui.kpi(label, value, esc(meta || ''))}</button>${ui.help(help, label)}</div>`;
  }
  function cards(m) {
    const s = m.summary, answerHelp = '接通率 = 确认接通 ÷（确认接通 + 确认未接通）。结果待确认不计入分母。';
    let items;
    if (view === 'leads') items = [
      card('线索量',s.leadCount,'leadCount','同品牌、同线索编码合并统计；没有编码的名单各自保留。',`已记录意向 ${s.intentionRecorded} 条`),
      card('已分配',s.assigned,'assigned','至少一条关联名单已分配坐席或任务的线索。'),
      card('已联系',s.contacted,'contacted','具有呼叫尝试记录的线索，多次呼叫只计一条线索。联系覆盖率以全部筛选线索为分母。',`联系覆盖率 ${s.leadCount?(s.contacted/s.leadCount*100).toFixed(1)+'%':'—'}`),
      card('已接通',s.connected,'connected','至少一次确认客户接通的线索，不等于跟进完成。线索接通率以全部筛选线索为分母。',`线索接通率 ${s.leadCount?(s.connected/s.leadCount*100).toFixed(1)+'%':'—'}`),
      card('待跟进',s.pendingFollowup,'pendingFollowup','尚未标记跟进完成的线索，包含待分配、待联系和待继续跟进。'),
      card('跟进完成',s.completed,'completed','按当前线索跟进结果统计，不表示成交或到店。'),
      card('有到店意向',s.visitIntended,'visitIntended','本线索最近已填写的到店意向为有意向。',`已计划到店 ${s.plannedVisit} 条`),
      card('有试驾意向',s.testDriveIntended,'testDriveIntended','本线索最近已填写的试驾意向为有意向，不代表已试驾。')
    ];
    else if (view === 'customers') items = [
      card('名单量', s.totalItems, 'totalItems', '同一手机号在不同批次出现时分别计为名单；客户数按租户与手机号去重。', `去重客户 ${s.distinctCustomers} 人`),
      card('已分配', s.assigned, 'assigned', '已分配给人工坐席或预外呼 / 自动外呼任务的名单。'),
      card('已联系', s.contacted, 'contacted', '有呼叫尝试记录的名单，未接通也计入；不代表成交或跟进完成。'),
      card('待继续跟进', s.followup, 'followup', '当前跟进状态为待继续跟进的名单。'),
      card('跟进完成', s.completed, 'completed', '运营标记为已完成的名单，不等同于业务成交或售后解决。'),
      card('待分配', s.unassigned, 'unassigned', '尚未分配到坐席或自动外呼任务的名单。')
    ];
    else if (view === 'outbound') items = [
      card('任务数', m.rows.length, 'tasks', '创建、计划或启动日期在周期内，或周期内产生通话记录的任务。'),
      card('周期呼叫量', s.total, 'total', '筛选周期内已结束的通话尝试；包含结果待确认。', `重呼 ${s.repeatCount} 次`),
      card('客户接通', s.connected, 'connected', answerHelp, `接通率 ${s.rate}`),
      card('结果待确认', s.pending, 'pending', '尚无足够证据确认接通与否，不能按未接通处理。')
    ];
    else if (view === 'inbound') items = [
      card('呼入量', s.total, 'total', '周期内已结束的呼入记录。'),
      card('人工接通', s.humanConnected, 'connected', '客户与坐席双方均有接通证据才算人工接通。' + answerHelp, `人工接通率 ${s.humanRate} · 人工结果待确认 ${s.humanPending} 条`),
      card('首队列平均等待', seconds(s.queueAverage), 'queue', '按接口返回的首次队列排队时长计算；不包含后续流转队列的等待。'),
      card('队列中放弃', s.queueAbandoned, 'queueAbandoned', '系统应答且官方呼叫结果为队列中放弃的来电。'),
      card('队列中溢出', s.queueOverflow, 'queueOverflow', '系统应答且官方呼叫结果为队列中溢出的来电，不推断为排队超时。')
    ];
    else if (humanView()) items = [
      card('联系客户数', s.customers, 'customers', '按当前租户和有效客户手机号去重。', `号码未识别 ${s.customerUnknown} 条`),
      card('关联通话', s.total, 'total', '当前坐席 / 服务技能所关联的已结束通话尝试。'),
      card('人工接通', s.humanConnected, 'connected', '客户与坐席双方均有接通证据。' + answerHelp, `人工接通率 ${s.humanRate}`),
      card('人工结果待确认', s.humanPending, 'pending', '仅客户或仅坐席接通，不能确认双方建立人工通话。'),
      card('人工通话时长', seconds(s.humanSeconds), 'duration', '采用接口返回的双方通话时长；流转记录不把整通时长重复分摊给每位坐席。', `有效样本 ${s.humanDurationSamples} 条`),
      card('平均人工时长', seconds(s.humanAvgSeconds), 'duration', '有效人工通话时长 ÷ 有效时长样本数；缺失数据不按零计算。', `时长缺失 ${s.humanDurationMissing} 条`)
    ];
    else items = [
      card('联系客户数', s.customers, 'customers', '按租户与有效客户手机号去重；同一客户多次呼叫只算一人。', `号码未识别 ${s.customerUnknown} 条`),
      card('呼叫量', s.total, 'total', '周期内已结束的呼叫尝试；一次重呼另算一次。', `重呼 ${s.repeatCount} 次`),
      card('客户接通', s.connected, 'connected', answerHelp, `接通率 ${s.rate}`),
      card('结果待确认', s.pending, 'pending', '接通证据不足的记录保留为待确认。'),
      card('首呼接通率', s.firstRate, 'firstCount', '首呼接通 ÷ 首呼已确认结果量。首呼基于完整可见历史识别，不按筛选周期重新起算。', `首呼 ${s.firstCount} 次 · 接通 ${s.firstConnected} 次`),
      card('双方通话时长', seconds(s.seconds), 'duration', '合计接口返回的双方通话时长，不包含纯自动外呼的客户接听时长。', `有效样本 ${s.durationSamples} 条`),
      card('平均双方时长', seconds(s.avgSeconds), 'duration', '有效通话时长 ÷ 有效时长样本数；零秒有效，缺失时长不按零计算。', `时长缺失 ${s.durationMissing} 条`),
      card('首重呼未识别', s.attemptUnknown, 'attemptUnknown', '缺少明确呼叫次数及足够历史证据，不能假定为首呼。')
    ];
    return `<div class="report-metrics report-metrics-${items.length}">${items.join('')}</div>`;
  }
  const col = (key, label, help, render, exportValue) => ({ key, label, help, render, exportValue, className: key === 'action' ? 'report-actions' : '' });
  function columns(key) {
    const rowAction = col('action', '操作', '', (_, r) => button('查看明细', 'drill', 'row', r.key));
    if (key === 'leads') return [col('code','线索编码','同品牌下相同编码合并，前导零保留。',(_,r)=>`<strong>${esc(r.code||'待补编号')}</strong><small class="lead-cell-sub">${esc((r.tenantNames||[]).join(' / '))}</small>`),col('name','客户', '',(_,r)=>`${esc(r.name||'未填写')}<small class="lead-cell-sub">${esc((r.phones||[]).join(' / '))}</small>`),col('followupStatus','跟进状态'),col('callCount','呼叫次数'),col('connectedCount','接通次数'),col('lastContactAt','最近联系','本线索最后一次联系时间。',v=>esc(timeText(v)),r=>timeText(r.lastContactAt)),col('intentionLevel','意向等级','本线索最近一次已填写值。',v=>esc(v||'未填写')),col('plannedVisitAt','计划到店','计划不代表实际到店。',(_,r)=>`${esc(r.plannedVisitAt?.replace('T',' ')||'未填写')}<small class="lead-cell-sub">${esc(r.plannedStoreName||'')}</small>`),col('action','操作','',(_,r)=>button('线索详情','openLead',r.key))];
    const counts = [col('total', '呼叫量', '本周期已结束的呼叫尝试量。'), col('connected', '客户接通', '具有客户接通证据。'), col('unanswered', '客户未接通', '具有明确未接通结果。'), col('pending', '结果待确认', '证据不足，不算未接通。'), col('rate', '接通率', '确认接通 ÷ 已确认结果量，不含待确认。')];
    if (key === 'overview') return [col('type', '呼叫方式'), ...counts, col('firstCount', '首呼量', '基于完整可见历史或明确呼叫次数识别。'), col('firstRate', '首呼接通率', '首呼接通 ÷ 首呼已确认结果量。'), col('repeatCount', '重呼量'), col('duration', '双方时长（秒）', '接口返回的双方通话时长合计。'), col('customerSeconds', '客户接听时长（秒）', '预测及自动外呼接口返回的客户接听时长；其他类型不补算。',v=>esc(v??'—')), rowAction];
    if (key === 'customers') return [col('name', '导入批次'), col('businessType', '业务类型', '按导入时选择的业务类型统计。', typeLabel, r => businessLabel(r.businessType, r)), col('total', '名单量', '每批次每条客户名单计一条。'), col('assigned', '已分配'), col('unassigned', '待分配'), col('contacted', '已联系', '有呼叫尝试记录，不代表接通。'), col('followup', '待继续跟进'), col('completed', '跟进完成', '运营标记完成，不代表成交。'), rowAction];
    if (key === 'outbound') return [col('name', '任务名称'), col('callType', '任务类型'), col('status', '当前状态'), col('supplierTotal','累计号码','供应商任务报表号码总数，不按当前统计周期裁剪。'), col('supplierCalled','累计呼叫','供应商任务报表的已呼叫次数，包含重呼。'), col('supplierRetry','累计重呼','供应商任务报表累计重试呼叫次数。'), col('completed', '平台已处理名单', '当前平台名单中已处理的客户行数量，不代表接通或供应商累计呼叫次数。'), col('finishRate', '平台处理率', '平台累计已处理名单 ÷ 平台累计名单，不是供应商执行进度。'), col('loaded', '周期呼叫量', '本周期已加载记录口径，与累计名单不同。'), col('connected', '客户接通'), col('unanswered', '客户未接通'), col('pending', '结果待确认'), col('connectRate', '周期接通率'), col('action', '操作', '', (_, r) => `${button('通话明细', 'drill', 'row', r.key)} ${button('任务详情', 'openTask', r.id)}`)];
    if (key === 'inbound') return [col('id', '通话编号'), col('tenant', '所属租户'), col('agent', '首呼坐席', '呼入接口返回的首呼目标，不代表所有流转后的实际接听者。'), col('result', '客户结果', '客户接通 IVR 不代表人工接通。'), col('humanResult', '人工结果', '双方均有接通证据才算人工接通。'), col('queueResult', '排队结果'), col('duration', '通话时长（秒）'), col('action', '操作', '', (_, r) => button('录音 / 文本', 'openCall', r.id))];
    return [col('name', key === 'agents' ? '坐席 / 工号' : '服务技能'), col('tenant', '所属租户'), col(key === 'agents' ? 'skills' : 'members', key === 'agents' ? '关联技能数' : '关联坐席数', '当前有效关联数量，不代表周期内历史数量。'), col('total', '关联通话'), col('connected', '人工接通'), col('unanswered', '人工未接通'), col('pending', '人工结果待确认'), col('rate', '人工接通率', '人工接通 ÷ 人工已确认结果量。'), col('talk', '人工时长（秒）'), ...(key === 'skills' ? [col('queue', '首队列平均等待')] : []), rowAction];
  }
  function trendBuckets(m) {
    const start = new Date(m.filters.startDate + 'T00:00:00'), end = new Date(m.filters.endDate + 'T00:00:00'), dates = [];
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) dates.push(dayText(d));
    const width = Math.max(1, Math.ceil(dates.length / 14)), buckets = [];
    for (let i = 0; i < dates.length; i += width) {
      const from = dates[i], to = dates[Math.min(i + width - 1, dates.length - 1)], calls = m.calls.filter(c => { const d = dayText(metrics.callTime(c)); return d >= from && d <= to; });
      buckets.push({ from, to, total: calls.length, connected: calls.filter(c => metrics.state(c).answered === true).length });
    }
    return buckets;
  }
  function compare(title, rows, kind, help) {
    const max = Math.max(1, ...rows.map(r => r.count));
    return `<section class="report-chart"><div class="report-chart-head"><h3>${esc(title)}</h3>${ui.help(help, title)}</div><div class="report-comparison">${rows.length ? rows.map(r => `<button type="button" onclick="${action('drill', kind, r.key)}"><span>${esc(r.label)}</span><i><b style="width:${Math.max(0, r.count / max * 100)}%"></b></i><strong>${esc(r.count)}</strong></button>`).join('') : ui.empty('暂无统计数据')}</div></section>`;
  }
  function charts(m) {
    if (view === 'leads') return `<div class="report-charts">${compare('线索联系进展',[{label:'已分配',key:'assigned',count:m.summary.assigned},{label:'已联系',key:'contacted',count:m.summary.contacted},{label:'已接通',key:'connected',count:m.summary.connected},{label:'跟进完成',key:'completed',count:m.summary.completed}],'metric','每条线索分别判断各项状态，几项可能重叠，不相加。')}${compare('意向等级分布',(m.summary.intentionDistribution||[]).map(r=>({label:r.value||'未填写',key:r.value||'',count:r.count})),'intention','按本线索最近已填写的意向等级统计，不从通话是否接通推测意向。')}</div>`;
    if (view === 'customers') return `<div class="report-charts">${compare('名单处理覆盖', [{ label: '已分配', key: 'assigned', count: m.summary.assigned }, { label: '已联系', key: 'contacted', count: m.summary.contacted }, { label: '跟进完成', key: 'completed', count: m.summary.completed }], 'metric', '三项分别统计当前状态，可能交叉；不是成交漏斗。')}${compare('名单业务类型', [...data.businessOptions(m.filters.tenantId), {id:'unclassified',label:'未分类'}].map(t => ({ label: t.label, key: t.id, count: m.items.filter(i => t.id === 'unclassified' ? !i.businessType : i.businessType === t.id).length })), 'business', '按业务类型统计当前筛选出的客户名单量。')}</div>`;
    const buckets = trendBuckets(m), max = Math.max(1, ...buckets.map(b => b.total));
    const trend = `<section class="report-chart"><div class="report-chart-head"><h3>呼叫趋势</h3><span class="report-legend"><i></i>呼叫量 <i class="connected"></i>客户接通</span></div><div class="report-trend">${buckets.map(b => `<button type="button" title="${esc(b.from === b.to ? b.from : b.from + ' 至 ' + b.to)}：呼叫 ${b.total}，客户接通 ${b.connected}" onclick="${action('drill', 'period', b.from + '|' + b.to)}"><span class="report-bars"><i style="height:${b.total / max * 100}%"></i><i class="connected" style="height:${b.connected / max * 100}%"></i></span><strong>${b.total}</strong><span>${esc(b.from.slice(5))}${b.to === b.from ? '' : '+'}</span></button>`).join('')}</div></section>`;
    const rows = view === 'inbound' ? [{ label: '人工接通', key: 'connected', count: m.summary.humanConnected }, { label: '人工未接通', key: 'unanswered', count: m.summary.humanUnanswered }, { label: '人工结果待确认', key: 'pending', count: m.summary.humanPending }] : m.rows.map(r => ({ label: r.name || ui.callTypeLabel(r.type), key: r.key, count: r.loaded == null ? r.total : r.loaded })).sort((a, b) => b.count - a.count).slice(0, 6);
    return `<div class="report-charts">${trend}${compare(view === 'overview' ? '呼叫方式分布' : view === 'inbound' ? '人工接待结果' : view === 'outbound' ? '任务呼叫量 · 前 6 项' : '关联通话量 · 前 6 项', rows, view === 'inbound' ? 'metric' : 'row', '与当前筛选保持一致；点击查看组成明细。')}</div>`;
  }
  function render(options) {
    if (!data.valid()) return ui.empty('暂无报表查看权限');
    if (context !== data.scopeKey()) { context = data.scopeKey(); Object.keys(filters).forEach(k => delete filters[k]); Object.keys(pages).forEach(k => delete pages[k]); drillState = null; ui.closeLayer('report-detail'); ui.closeLayer('lead-detail'); }
    view = definitions[options?.view] ? options.view : 'overview';
    const m = getModel(view); if (m.error) return '<div class="report-center">' + filterHeader(m) + '<div class="report-error" role="status">' + esc(m.error) + '，请重新选择筛选条件或重置。</div></div>';
    const page = pages[view] = Math.max(1, Math.min(pages[view] || 1, Math.ceil(m.rows.length / 10) || 1));
    const scopeHelp = view === 'leads' ? '以当前可见范围中首次导入日期选择线索，展示这些线索截至当前的累计联系与最新业务信息。仅统计当前账号绑定租户，按线索编码合并；不同编码不按手机号合并，不合并其他账号数据。' : view === 'customers' ? '统计周期选择导入批次，展示这些批次截至当前的累计分配和跟进状态，不是历史状态快照。' : '采用话单开始时间归期，缺失时只使用可核实的时间。未结束通话不计入报表。任务累计名单及完成量属于平台名单处理口径，与周期通话分别展示。';
    const quality = [m.timeMissing ? `${m.timeMissing} 条缺少时间，未计入周期` : '', m.timeFallback ? `${m.timeFallback} 条使用已知接通 / 结束时间归期` : '', ['agents','skills'].includes(view)&&m.excludedUnassociated ? `${m.excludedUnassociated} 条未关联${view === 'agents' ? '坐席' : '服务技能'}，未计入本页` : '',view==='leads'&&m.summary.missingCode?`${m.summary.missingCode} 条待补线索编码`: '',view==='leads'&&m.unassociatedCalls?.length?`当前范围 ${m.unassociatedCalls.length} 通电话待核对线索关联`: ''].filter(Boolean).join('；');
    const scopeLabel=view==='leads'?'线索首次导入 · 截至当前累计跟进':view==='customers'?'导入批次 · 截至当前累计跟进':'已结束通话 · 开始时间优先';
    const attribution=view==='agents'?'同租户同工号含历史坐席时合并统计，各次通话保留原记录。无法确认实际接听归属的呼入及多方流转单独待核对。':view==='skills'?'按首呼队列与服务技能的明确对应关系统计，不按当前坐席技能倒推历史。':'';
    return `<div class="report-center">${filterHeader(m)}<div class="report-scope"><span>${esc(m.filters.startDate)} — ${esc(m.filters.endDate)} <b>·</b> ${scopeLabel} ${ui.help(scopeHelp, '统计口径')}${attribution?ui.help(attribution,'归属口径'):''}</span>${quality ? `<span aria-label="已加载记录口径">${esc(quality)}</span>` : ''}</div>${cards(m)}${charts(m)}<section class="report-list">${ui.toolbar(`<h3>${definitions[view][3]}</h3>`, `<button type="button" class="btn" ${m.rows.length ? '' : 'disabled'} onclick="${action('exportReport')}">导出当前结果</button>`)}${ui.table(columns(view), m.rows.slice((page - 1) * 10, page * 10), { rowOffset: (page - 1) * 10, emptyText: '当前筛选暂无数据', emptyDetail: '请调整统计周期或筛选条件。', footer: ui.pagination(m.rows.length, page, 10, "Pages['report-center'].setPage") })}</section></div>`;
  }
  function periodChanged() {
    const period = document.getElementById('reportPeriod')?.value; if (!period || period === '自定义') return;
    const f = data.normalize({ ...current(), period }); ['startDate', 'endDate'].forEach(key => { const el = document.getElementById('report' + key[0].toUpperCase() + key.slice(1)); if (el) el.value = f[key]; });
  }
  function dateChanged() { const el = document.getElementById('reportPeriod'); if (el) el.value = '自定义'; }
  function query() {
    if (!active()) return false;
    const next = { ...current() }, map = { period: 'Period', startDate: 'StartDate', endDate: 'EndDate', tenantId: 'Tenant', businessType: 'BusinessType', callType: 'CallType', batchId: 'Batch', taskId: 'Task', agentId: 'Agent', skillGroupId: 'Skill', keyword: 'Keyword',leadLevel:'LeadLevel',intentionLevel:'IntentionLevel',visitIntention:'VisitIntention',testDriveIntention:'TestDriveIntention',plannedStoreName:'PlannedStoreName' };
    Object.entries(map).forEach(([key, suffix]) => { const el = document.getElementById('report' + suffix); if (el) next[key] = el.value; });
    if (view === 'leads') next.plannedStoreId = '';
    const normalized = data.normalize(next), model = data.getModel(view, normalized);
    if (normalized.error || model.error) { const error = normalized.error || model.error, el = document.getElementById('reportFilterError'); if (el) el.textContent = error; showToast(error, 'warning'); return false; }
    filters[view] = normalized; pages[view] = 1; drillState = null; ui.closeLayer('report-detail'); navigate(); return true;
  }
  function reset() { if (!active()) return; filters[view] = data.defaults(); pages[view] = 1; drillState = null; ui.closeLayer('report-detail'); navigate(); }
  function setPage(n) { const m = applied(); if (!m || m.error) return; pages[view] = Math.max(1, Math.min(Number(n) || 1, Math.ceil(m.rows.length / 10) || 1)); navigate(); }
  function metricCalls(m, key) {
    const answer = c => humanView() ? metrics.humanAnswer(c) : metrics.state(c).answered;
    if (key === 'total') return m.calls;
    if (['connected', 'unanswered', 'pending'].includes(key)) return m.calls.filter(c => key === 'connected' ? answer(c) === true : key === 'unanswered' ? answer(c) === false : answer(c) !== true && answer(c) !== false);
    if (['firstCount', 'firstConnected', 'repeatCount', 'attemptUnknown'].includes(key)) return m.calls.filter(c => { const kind = metrics.attemptKind(c, m.allCalls); return key === 'firstConnected' ? kind === 'first' && metrics.state(c).answered === true : kind === (key === 'firstCount' ? 'first' : key === 'repeatCount' ? 'repeat' : 'unknown'); });
    if (key === 'customers') return [...new Map(m.calls.filter(c => metrics.customerPhone(c)).map(c => [metrics.customerKey(c), c])).values()];
    if (key === 'duration') return m.calls.filter(c => humanView() ? metrics.humanSeconds(c) !== null : metrics.state(c).answered === true && metrics.durationApplicable(c) && metrics.recordedSeconds(c) !== null);
    if (key === 'queueAbandoned' || key === 'queueOverflow') return m.calls.filter(c => AliCtiReportFacts.read(c).queueOutcome === (key==='queueAbandoned'?'队列中放弃':'队列中溢出'));
    if (key === 'queue') return m.calls.filter(c => metrics.queueSeconds(c)!==null);
    return [];
  }
  function getDrillRows() {
    const m = applied(); if (!m || m.error || !drillState) return { kind: 'calls', rows: [] };
    const { kind, key } = drillState;
    if (view === 'leads') {
      const rows=kind==='intention'?m.rows.filter(r=>(r.intentionLevel||'')===key):kind==='row'?m.rows.filter(r=>r.key===key):m.rows.filter(r=>key==='leadCount'||r[key]===true);
      return {kind:'leads',rows};
    }
    if (kind === 'metric' && key === 'tasks' && view === 'outbound') return { kind: 'tasks', rows: m.rows };
    if (view === 'customers') {
      let rows = [];
      if (kind === 'row') rows = m.rows.find(r => String(r.key) === key)?.items || [];
      if (kind === 'business') rows = m.items.filter(i => key === 'unclassified' ? !i.businessType : i.businessType === key);
      if (kind === 'metric') rows = m.items.filter(i => key === 'totalItems' || key === 'assigned' && (i.ownerId || i.taskId) || key === 'unassigned' && !i.ownerId && !i.taskId || key === 'contacted' && i.contacted || key === 'completed' && i.followup === '已完成' || key === 'followup' && i.followup === '待继续跟进');
      return { kind: 'items', rows };
    }
    let rows = [];
    if (kind === 'row') rows = m.rows.find(r => String(r.key) === key)?.calls || [];
    if (kind === 'metric') rows = metricCalls(m, key);
    if (kind === 'period') { const b = trendBuckets(m).find(b => b.from + '|' + b.to === key); if (b) rows = m.calls.filter(c => { const d = dayText(metrics.callTime(c)); return d >= b.from && d <= b.to; }); }
    if (kind === 'day') rows = m.calls.filter(c => dayText(metrics.callTime(c)) === key);
    return { kind: 'calls', rows };
  }
  function drill(kind, key) { if (!active()) return; drillState = { kind, key: String(key), page: 1 }; showDrill(); }
  function drillPage(n) { if (!active() || !drillState) return; drillState.page = Math.max(1, Math.min(Number(n) || 1, Math.ceil(getDrillRows().rows.length / 10) || 1)); showDrill(); }
  function showDrill() {
    if (!active() || !drillState) return; const result = getDrillRows(), page = drillState.page;
    result.rows = sortRows(result.rows, result.kind === 'calls' ? callFallback : result.kind === 'leads' ? leadListTime : ['at']);
    const cols = result.kind === 'leads' ? columns('leads') : result.kind === 'tasks' ? [col('name', '任务名称'), col('callType', '任务类型'), col('status', '当前状态'), col('action', '操作', '', (_, r) => button('任务详情', 'openTask', r.id))] : result.kind === 'items' ? [col('name', '客户称呼'), col('phone', '客户号码'), col('batchName', '导入批次'), col('businessType', '业务类型', '', typeLabel), col('externalDocumentId', '业务单据标识', '导入时填写的对应业务编码。'), col('method', '外呼方式', '', v => esc(ui.callTypeLabel(v) || '待分配')), col('followup', '当前跟进状态'), col('action', '操作', '', (_, r) => button('客户档案', 'openCustomer', r.id))] : [col('callId', '通话编号'), col('callType', '呼叫方式'), col('phone', '客户号码', '', (_, c) => esc(metrics.customerPhone(c)||'未识别')), col('start', '统计时间', '优先开始时间，缺失时用已知接通或结束时间。', (_, c) => esc(timeText(metrics.callTime(c)))), col('result', '通话结果', '', (_, c) => esc(metrics.state(c).answerLabel)), col('agentName', '坐席'), col('durationSeconds', '双方时长（秒）', '纯自动外呼不适用。', (_, c) => esc(metrics.durationApplicable(c)?metrics.recordedSeconds(c) ?? '—':'不适用')), col('action', '操作', '', (_, c) => button('录音 / 文本', 'openCall', c.callId))];
    ui.openLayer('report-detail', `<div class="layer-header"><div><h2>${result.kind === 'leads' ? '线索明细' : result.kind === 'items' ? '客户名单明细' : result.kind === 'tasks' ? '任务明细' : '通话明细'}</h2><p>${esc(definitions[view][0])} · 共 ${result.rows.length} 条</p></div><button type="button" class="layer-close" aria-label="关闭" onclick="PlatformUI.closeLayer('report-detail')">×</button></div><div class="layer-body">${ui.table(cols, result.rows.slice((page - 1) * 10, page * 10), { rowOffset: (page - 1) * 10, emptyText: '当前条件暂无明细' })}</div><div class="layer-footer">${ui.pagination(result.rows.length, page, 10, "Pages['report-center'].drillPage")}</div>`, 'report-detail-panel');
  }
  function leadRow(key) { const m=applied();return m&&!m.error&&view==='leads'?m.rows.find(r=>r.key===key):null; }
  function openLead(key) {
    const row=leadRow(key);if(!row)return;
    const callColumns=[col('at','联系时间','',(_,c)=>esc(timeText(metrics.callTime(c)))),col('callType','呼叫方式','',v=>esc(ui.callTypeLabel(v))),col('agentName','坐席','',v=>esc(v||'未记录')),col('result','客户接通','',(_,c)=>esc(metrics.state(c).answerLabel)),col('agentDisposition','本次处理结果','',v=>esc(v||'未填写')),col('duration','双方时长','接口返回的双方通话时长；纯自动外呼不适用。',(_,c)=>esc(metrics.durationApplicable(c)?seconds(metrics.recordedSeconds(c)):'不适用')),col('action','操作','',(_,c)=>button('通话详情','openLeadCall',key,c.callId,c.tenantId,c.enterpriseId))];
    const itemColumns=[col('batchName','导入批次'),col('name','客户称呼'),col('phone','客户号码'),col('method','分配方式','',v=>esc(ui.callTypeLabel(v)||'待分配')),col('followup','跟进状态'),col('action','操作','',(_,i)=>button('客户档案','openLeadCustomer',key,i.id,i.tenantId,i.enterpriseId))];
    const taskLinks=(row.tasks||[]).map(t=>button(t.name||t.id,'openLeadTask',key,t.id,t.tenantId,t.enterpriseId||row.items?.find(i=>i.tenantId===t.tenantId)?.enterpriseId||'')).join(' ');
    const details=CustomerFollowup.detail(row);
    ui.openLayer('lead-detail',`<div class="layer-header"><div><h2>线索 ${esc(row.code||'待补编号')}</h2><p>${esc(row.name||'未填写客户称呼')} · ${esc((row.tenantNames||[]).join(' / '))}</p></div><button class="layer-close" aria-label="关闭线索详情" onclick="PlatformUI.closeLayer('lead-detail')">×</button></div><div class="layer-body"><section class="lead-summary-strip"><div><span>当前跟进</span><strong>${esc(row.followupStatus||'未联系')}</strong></div><div><span>呼叫次数</span><strong>${esc(row.callCount)}</strong></div><div><span>接通次数</span><strong>${esc(row.connectedCount)}</strong></div><div><span>首次导入</span><strong>${esc(timeText(row.firstImportedAt))}</strong></div></section><section class="lead-detail-section"><h3>客户业务信息 ${ui.help('取本线索各次通话最近已填写的信息；到店与试驾为客户意向。','业务信息口径')}</h3>${details}</section><section class="lead-detail-section"><h3>联系记录 <small>${row.calls.length} 次</small></h3>${ui.table(callColumns,sortRows(row.calls,callFallback),{emptyText:'尚无关联通话'})}</section><section class="lead-detail-section"><h3>来源与分配 <small>${row.items.length} 条名单</small></h3>${ui.table(itemColumns,sortRows(row.items,['at']),{emptyText:'暂无导入名单'})}${taskLinks?`<div class="lead-task-links"><span>关联任务</span>${taskLinks}</div>`:''}</section></div>`,'report-detail-panel lead-detail-panel',{objectKey:key,onRestore:()=>{const old=document.querySelector('#lead-detail .layer-body'),scroll=old?.scrollTop||0;openLead(key);const next=document.querySelector('#lead-detail .layer-body');if(next)next.scrollTop=scroll;}});
  }
  function openLeadCall(key,id,tenantId,enterpriseId) { const row=leadRow(key);if(row?.calls.some(c=>c.callId===id&&c.tenantId===tenantId&&String(c.enterpriseId)===enterpriseId))Pages['cloud-call-records'].openCall(id); }
  function openLeadCustomer(key,id,tenantId,enterpriseId) { const row=leadRow(key),item=row?.items.find(i=>i.id===id&&i.tenantId===tenantId&&String(i.enterpriseId)===enterpriseId);if(item?.phone)CustomerDirectory.open(item.phone,item.tenantId,item.enterpriseId); }
  function openLeadTask(key,id,tenantId,enterpriseId) { const row=leadRow(key);if(!row?.tasks.some(t=>t.id===id&&t.tenantId===tenantId))return;const task=CloudCallData.tasks.find(t=>t.taskId===id&&t.tenantId===tenantId&&String(t.enterpriseId)===enterpriseId);if(task&&AppState.authorizeObject('',task))CloudTaskWorkspace.openTask(id); }
  function exportColumns() {
    if(view!=='leads')return columns(view).filter(c=>c.key!=='action');
    return [col('code','线索编码','',null,r=>/^0\d+$/.test(r.code)?"'"+r.code:r.code||'待补编号'),col('name','客户称呼'),col('phones','客户号码','',null,r=>(r.phones||[]).join(' / ')),col('tenantNames','所属组织','',null,r=>(r.tenantNames||[]).join(' / ')),col('followupStatus','跟进状态'),col('callCount','呼叫次数'),col('connectedCount','接通次数'),col('lastContactAt','最近联系','',null,r=>timeText(r.lastContactAt)),col('latestDisposition','最近处理结果'),col('leadLevel','线索等级'),col('intentionLevel','意向等级'),col('visitIntention','到店意向'),col('testDriveIntention','试驾意向'),col('plannedVisitAt','计划到店时间'),col('plannedStoreName','计划到店门店'),col('batches','导入批次','',null,r=>(r.batches||[]).map(x=>x.name).join(' / ')),col('tasks','关联任务','',null,r=>(r.tasks||[]).map(x=>x.name).join(' / '))];
  }
  function openCall(id) { const m = applied(); if (!m || m.error || !m.calls.some(c => c.callId === id)) return; Pages['cloud-call-records'].openCall(id); }
  function openCustomer(id) { if (!active()) return; const item = getDrillRows().rows.find(r => r.id === id); if (item?.phone) CustomerDirectory.open(item.phone, item.tenantId, item.enterpriseId); }
  function openTask(id) { const m = applied(); if (!m || m.error || view !== 'outbound' || !m.rows.some(r => r.id === id)) return; CloudTaskWorkspace.openTask(id); }
  function csvCell(value) { let s = String(value == null ? '—' : value); if (/^[\s\u0000-\u001f]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }
  function exportCsv() { const m = applied(); if (!m || m.error || !m.rows.length) return ''; const cols = exportColumns(); return '\uFEFF' + [cols.map(c => csvCell(c.label)).join(','), ...m.rows.map(r => cols.map(c => csvCell(c.exportValue ? c.exportValue(r) : r[c.key])).join(','))].join('\r\n'); }
  function exportReport() {
    const csv = exportCsv(); if (!csv) return showToast('当前没有可导出的数据', 'warning');
    try { const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `${definitions[view][0]}_${current().startDate}_${current().endDate}.csv`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); showToast('已导出当前筛选的全部结果'); } catch (_) { showToast('导出失败，请重新尝试', 'error'); }
  }
  function captureNavigationState(){return {view,context,drillState,filters:structuredClone(filters),pages:{...pages}};}
  function restoreNavigationState(state){if(!state)return;({view,context,drillState}=state);Object.keys(filters).forEach(key=>delete filters[key]);Object.assign(filters,structuredClone(state.filters));Object.keys(pages).forEach(key=>delete pages[key]);Object.assign(pages,state.pages);}
  Pages['report-center'] = { render, captureNavigationState, restoreNavigationState, getModel, query, reset, setPage, periodChanged, dateChanged, drill, drillPage, getDrillRows, openLead, openLeadCall, openLeadCustomer, openLeadTask, openCall, openCustomer, openTask, exportCsv, exportReport };
})();
