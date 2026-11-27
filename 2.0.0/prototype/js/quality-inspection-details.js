(() => {
  'use strict';

  const pageId = 'PAGE-21019';
  const service = () => window.DQualityInspection;
  const e = DUI.esc;
  const value = input => input == null || input === '' ? '—' : input;
  const yesNo = input => typeof input === 'boolean' ? (input ? '是' : '否') : '—';
  const datePart = input => String(input || '').slice(0,10);
  const inRange = (input,from,to) => (!from && !to) || Boolean(input && (!from || input >= from) && (!to || input <= to));
  const numberInRange = (input,from,to) => (!from && !to) ||
    (typeof input === 'number' && (!from || input >= Number(from)) && (!to || input <= Number(to)));
  const scopeKey = () => {
    const access = service().access();
    return JSON.stringify([access?.tenantId,access?.brandId,access?.accountId,access?.role]);
  };
  const field = (label,name,type='text',attrs='') =>
    '<label class="field"><span>'+e(label)+'</span><input name="'+e(name)+'" type="'+e(type)+'" '+attrs+'></label>';
  const choice = (label,name,options,empty='全部') =>
    '<label class="field"><span>'+e(label)+'</span><select name="'+e(name)+'"><option value="">'+e(empty)+'</option>'+
    options.map(([key,text])=>'<option value="'+e(key)+'">'+e(text)+'</option>').join('')+'</select></label>';
  const rangeFields = (label,from,to,type,attrs = '') =>
    '<fieldset class="qi-range"><legend>'+e(label)+'</legend>'+
    '<input aria-label="'+e(label+'起始')+'" name="'+from+'" type="'+type+'" '+attrs+'><span aria-hidden="true">至</span>'+
    '<input aria-label="'+e(label+'结束')+'" name="'+to+'" type="'+type+'" '+attrs+'></fieldset>';
  const buttons = '<div class="filter-actions"><button type="reset" class="btn">重置</button>'+
    '<button type="submit" class="btn btn-primary">查询</button></div>';
  const errorMarkup = '<p class="form-error" data-qi-error role="alert" hidden></p>';
  const flag = [['true','是'],['false','否']];
  const detailTabs = [['task','任务详情'],['ai','AI 外呼录音'],['staff','员工质检'],['chat','对话标签']];
  const isAiCall = record => ['AI外呼','AI'].includes(String(record.callMode || '').replace(/\s+/g,'').toUpperCase());
  const visitKey = record => record.roundId || record.id;
  const appealStatusLabel = status => ({
    pending:'申诉中',approved:'审核通过',rejected:'审核不通过',partial:'部分通过'
  }[status] || '');

  function showError(host, message) {
    const box = host.querySelector('[data-qi-error]');
    if (!box) return;
    box.textContent = message;
    box.hidden = !message;
  }

  function chosenSeats(rows) {
    return [...new Map(rows.map(row=>[row.seatId || row.accountId,row.seatName])).entries()]
      .filter(([id,name])=>id && name).sort((a,b)=>a[1].localeCompare(b[1],'zh-CN'));
  }

  function seatFilter(rows,access) {
    if (access.role !== 'manager') return '';
    return '<details class="qi-pick" data-qi-seat-filter><summary>坐席名称 <span data-qi-seat-count>全部</span></summary>'+
      '<div class="qi-pick-body"><label class="field"><span>搜索坐席</span><input type="search" data-qi-seat-search autocomplete="off"></label>'+
      (chosenSeats(rows).map(([id,name])=>'<label data-qi-seat-label="'+e(name)+'"><input type="checkbox" name="seat" value="'+e(id)+'"> '+e(name)+'</label>').join('')||
      '<p class="d-muted">暂无可选坐席</p>')+'</div></details>';
  }

  function syncSeatFilter(form) {
    const count = form.querySelectorAll('[name="seat"]:checked').length;
    const label = form.querySelector('[data-qi-seat-count]');
    if (label) label.textContent = count ? '已选 '+count+' 人' : '全部';
  }

  function bindSeatFilter(form) {
    form.querySelector('[data-qi-seat-filter]')?.addEventListener('change',()=>syncSeatFilter(form));
    form.querySelector('[data-qi-seat-search]')?.addEventListener('input',event=>{
      const keyword = event.target.value.trim().toLowerCase();
      form.querySelectorAll('[data-qi-seat-label]').forEach(label=>{
        label.hidden = !label.dataset.qiSeatLabel.toLowerCase().includes(keyword);
      });
    });
  }

  function pagination(total,view) {
    const pages = Math.max(1,Math.ceil(total/view.size));
    view.page = Math.min(view.page,pages);
    return '<div class="qi-pagination" data-rtl-region="pagination"><span>共 '+total+' 条记录</span>'+
      '<div class="qi-pagination-controls"><label><span class="qi-sr-only">每页条数</span><select data-qi-size>'+
      [5,10,20,50,100].map(size=>'<option value="'+size+'"'+(size===view.size?' selected':'')+'>每页 '+size+' 条</option>').join('')+
      '</select></label><button type="button" class="btn" data-qi-move="-1"'+(view.page<=1?' disabled':'')+'>上一页</button>'+
      '<label><span class="qi-sr-only">页码</span><select data-qi-page>'+Array.from({length:pages},(_,index)=>
        '<option value="'+(index+1)+'"'+(index+1===view.page?' selected':'')+'>第 '+(index+1)+' / '+pages+' 页</option>').join('')+
      '</select></label><button type="button" class="btn" data-qi-move="1"'+(view.page>=pages?' disabled':'')+'>下一页</button></div></div>';
  }

  function bindPagination(host,view,draw) {
    host.querySelector('[data-qi-size]').onchange = event => {
      view.size=Number(event.target.value);view.page=1;draw();
    };
    host.querySelector('[data-qi-page]').onchange = event => {view.page=Number(event.target.value);draw();};
    host.querySelectorAll('[data-qi-move]').forEach(button=>button.onclick=()=>{
      view.page += Number(button.dataset.qiMove);draw();
    });
  }

  function textDownload(name,content) {
    const url = URL.createObjectURL(new Blob(['\ufeff',content],{type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href=url;link.download=name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function describeRecord(record) {
    return [
      ['通话 ID',record.callId],['坐席',record.seatName],['坐席组',record.seatGroup],['线索编码',record.leadCode],
      ['客户姓名',record.customerName],['联系电话',record.phone],['任务 ID',record.taskId],['轮次 ID',record.roundId],
      ['线索类型',record.leadType],['线索来源',record.source],['R 渠道',record.channel],['车系',record.series],
      ['经销商名称',record.dealer],['通话时长',typeof record.duration==='number' ? record.duration+' 秒' : null],
      ['通话时间',record.callAt],['质检时间',record.qualityAt],
      ...(record.requestId ? [
        ['智能质检 Agent',record.agentName || record.agentId],
        ['质检模型',[record.modelId,'v'+record.modelVersion].join(' ')],
        ['质检请求编号',record.requestId]
      ] : [])
    ];
  }

  function dataList(fields) {
    return '<dl class="qi-meta">'+fields.map(([label,input])=>
      '<div><dt>'+e(label)+'</dt><dd>'+e(value(input))+'</dd></div>').join('')+'</dl>';
  }

  function rowsForAppeal(record) {
    return [...(record.items || []),...(record.redLines || [])];
  }
  const hasUsableItem = item => item.appealable && !appealStatusLabel(item.appealStatus);

  function scoreSummary(record) {
    if (!record.inspected) return '<p class="qi-empty">本通话未质检'+(record.notInspectedReason?' · '+e(record.notInspectedReason):'')+'</p>';
    const fatal = [record.redLine?'触发合规红线':'',record.violation?'违规下发':''].filter(Boolean);
    if (fatal.length) return '<div class="qi-fatal-score" data-qi-fatal-score><strong>质检总分 '+e(value(record.score))+
      ' 分</strong><span>'+e(fatal.join('、'))+'，总分清零</span></div>';
    const detailScore = record.dimensionScore ?? record.rawScore;
    const pieces = [
      ['满分基准',100],['指标细项扣分',Number.isFinite(detailScore)?Math.max(0,Math.round((100-detailScore)*100)/100):null],
      ['服务禁语扣分',record.sensitiveDeduction],['产品知识扣分',record.knowledgeDeduction]
    ];
    return '<div class="qi-score-formula" data-qi-score-formula>'+[...pieces,['质检总分',record.score]].map(([label,input],index)=>
      (index?'<span aria-hidden="true">'+(index===pieces.length?'=':'−')+'</span>':'')+
      '<div><span>'+e(label)+'</span><strong>'+e(value(input))+'</strong></div>').join('')+
      '<span class="qi-grade" data-qi-grade="'+e(record.grade)+'">'+e(value(record.grade))+'</span></div>';
  }

  function radar(dimensions) {
    if (dimensions.length < 3) return '';
    const center = [174,112], radius = 68;
    const point = (i,ratio) => {
      const angle = i*2*Math.PI/dimensions.length-Math.PI/2;
      return [center[0]+radius*ratio*Math.cos(angle),center[1]+radius*ratio*Math.sin(angle)];
    };
    const points = ratios => ratios.map((ratio,i)=>point(i,ratio).join(',')).join(' ');
    const levels = [.25,.5,.75,1].map(level=>'<polygon class="qi-radar-grid" points="'+points(dimensions.map(()=>level))+'"/>').join('');
    const axes = dimensions.map((dimension,i)=>{
      const [x,y]=point(i,1),[lx,ly]=point(i,1.27);
      return '<line class="qi-radar-grid" x1="'+center[0]+'" y1="'+center[1]+'" x2="'+x+'" y2="'+y+'"/>'+
        '<text x="'+lx+'" y="'+(ly+4)+'" text-anchor="middle">'+e(dimension.name)+'</text>';
    }).join('');
    const scores = dimensions.map(dimension=>Math.max(0,Math.min(1,Number(dimension.score || 0)/100)));
    return '<div class="qi-radar"><svg viewBox="0 0 348 224" role="img" aria-label="质检维度雷达图">'+levels+axes+
      '<polygon class="qi-radar-score" points="'+points(scores)+'"/></svg>'+
      '<dl>'+dimensions.map(d=>'<div><dt>'+e(d.name)+'</dt><dd>'+e(value(d.score))+' 分'+
        (Number.isFinite(d.weight)?' · 权重 '+e(d.weight>1?d.weight:d.weight*100)+'%':'')+'</dd></div>').join('')+'</dl></div>';
  }

  function section(title,content,open=true) {
    return '<details class="qi-detail-card"'+(open?' open':'')+'><summary>'+e(title)+'</summary><div>'+content+'</div></details>';
  }

  function transcript(record) {
    return '<div class="qi-transcript">'+
      (record.transcript?.length?'<div class="qi-toolbar-actions"><button type="button" class="btn" data-qi-export-transcript>导出录音文本</button></div>':'')+
      '<p class="d-muted">暂无可播放录音</p>'+
      (record.transcript?.length?'<ol>'+record.transcript.map(line=>'<li><header><strong>'+e(line.role)+'</strong>'+
        '<time>'+e(line.time)+'</time></header><p>'+e(line.text)+'</p></li>').join('')+'</ol>':
        '<p class="qi-empty">暂无通话文本</p>')+'</div>';
  }

  function callOverview(record) {
    const conclusion = record.conclusion || record.followupResult || record.contact ||
      (typeof record.connected==='boolean'?(record.connected?'已接通':'未接通'):'');
    return dataList([
      ['通话完整性',record.completeness],['通话时长',typeof record.duration==='number'?record.duration+' 秒':null],
      ['通话结论',conclusion],['是否触发红线',record.inspected?(record.redLine?'已触发':'未触发'):null],
      ['红线结论',record.inspected?(record.redLine?'触发合规红线，总分清零':'未触发'):null]
    ]);
  }

  function diagnosis(record) {
    const missed = (record.items || []).filter(item=>!item.passed);
    const compliance = (record.redLines || []).filter(item=>!item.passed);
    const names = [...new Set([...compliance,...missed].map(item=>item.name))];
    const groups = record.dimensions || [];
    const lowest = groups.filter(group=>Number.isFinite(group.score)).sort((a,b)=>a.score-b.score)[0];
    const summary = record.diagnosis || (names.length ? names.slice(0,6).join('、')+(names.length>6?'等 '+names.length+' 项需要复核。':'需要复核。') :
      '本通话的质检细项已达成。');
    const advice = record.suggestion || (names.length && lowest ? '优先复盘「'+lowest.name+'」和对应会话证据。' : '');
    return '<p><strong>诊断内容</strong> '+e(summary)+'</p>'+
      (advice?'<p><strong>改进建议</strong> '+e(advice)+'</p>':'');
  }

  function itemChips(record,canAppeal,picked) {
    return '<div class="qi-score-chips">'+(record.dimensions || []).map(dimension=>'<div><strong>'+e(dimension.name)+'</strong><div>'+
      (record.items || []).filter(item=>item.dimensionId===dimension.id).map(item=>{
        const name = e(item.name), className = 'qi-score-chip '+(item.passed?'is-achieved':'is-missed');
        return canAppeal && hasUsableItem(item) ? '<button type="button" class="'+className+'" data-qi-appeal-chip="'+e(item.id)+
          '" aria-pressed="'+picked.has(item.id)+'" title="'+e('申诉 '+item.name)+'">'+name+'</button>' :
          '<span class="'+className+'">'+name+'</span>';
      }).join('')+'</div></div>').join('')+'</div>';
  }

  function visitNavigation(records,activeVisit,recordId) {
    if (!records.length) return '';
    const visits = [...new Set(records.map(visitKey))];
    const visible = activeVisit ? records.filter(row=>visitKey(row)===activeVisit) : records;
    return '<section class="qi-call-picker" aria-label="关联回访与通话">'+
      '<div class="qi-call-pills" role="group" aria-label="回访记录">'+
      [['','全部回访'],...visits.map((id,index)=>[id,'回访记录 '+(index+1)])].map(([id,label])=>
        '<button type="button" class="btn" aria-pressed="'+(id===activeVisit)+'" data-qi-visit="'+e(id)+'">'+e(label)+'</button>').join('')+'</div>'+
      '<div class="qi-call-pills" role="group" aria-label="通话记录">'+visible.map((row,index)=>
        '<button type="button" class="btn" aria-pressed="'+(row.id===recordId)+'" data-qi-call="'+e(row.id)+
        '" title="'+e([row.callId,row.callAt].filter(Boolean).join(' · '))+'">通话记录 '+(index+1)+'</button>').join('')+'</div></section>';
  }

  function taskHistory(related) {
    if (!related.length) return '<p class="qi-empty">暂无关联通话</p>';
    return '<div class="table-scroll"><table class="platform-table qi-point-table"><thead><tr><th scope="col">回访轮次</th>'+
      '<th scope="col">通话 ID</th><th scope="col">通话方式</th><th scope="col">通话时间</th><th scope="col">回访结果</th>'+
      '</tr></thead><tbody>'+related.map(row=>'<tr>'+[row.roundId,row.callId,row.callMode,row.callAt,row.followupResult || row.contact]
      .map(input=>'<td>'+e(value(input))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  }

  function pointsTable(items,canAppeal,picked) {
    const rows = items.map(item=>'<tr><th scope="row">'+e(item.name)+'</th><td>'+e(value(item.description))+
      (item.evidence?'<small>'+e([item.evidenceTime,item.evidence].filter(Boolean).join(' · '))+'</small>':'')+
      '</td><td>'+e(value(item.score))+(Number.isFinite(item.maxScore)?' / '+e(item.maxScore):'')+
      (Number.isFinite(item.originalScore) && item.originalScore!==item.score?'<small>原得分 '+e(item.originalScore)+'</small>':'')+'</td><td>'+
      e(typeof item.passed==='boolean'?(item.passed?'未触发':'触发'):'—')+'</td><td>'+
      (canAppeal && hasUsableItem(item) ? '<label><input type="checkbox" value="'+e(item.id)+'" data-qi-appeal-item aria-label="'+
        e('申诉 '+item.name)+'"'+(picked.has(item.id)?' checked':'')+'> 申诉</label>':e(appealStatusLabel(item.appealStatus)||'—'))+'</td></tr>');
    return rows.length ? '<div class="table-scroll"><table class="platform-table qi-point-table"><thead><tr>'+
      '<th scope="col">检查项</th><th scope="col">说明或依据</th><th scope="col">得分</th><th scope="col">判定</th><th scope="col">申诉状态</th></tr></thead><tbody>'+
      rows.join('')+'</tbody></table></div>' : '<p class="qi-empty">暂无记录</p>';
  }

  function compliance(record,canAppeal,picked) {
    const categories = [
      ['red-line','合规红线'],
      ['sensitive-word','外呼服务禁语检测'],
      ['knowledge','产品知识检测'],
      ['violation','违规下发检测']
    ];
    return categories.map(([kind,label])=>{
      const rows = (record.redLines || []).filter(item=>(item.category || 'red-line') === kind);
      return section(label,pointsTable(rows,canAppeal,picked),rows.length>0);
    }).join('');
  }

  function scoring(record,canAppeal,picked) {
    if (!record.dimensions?.length) return '<p class="qi-empty">暂无细项得分</p>';
    return record.dimensions.map((dimension,index)=>section(dimension.name+
      (Number.isFinite(dimension.score)?' · '+dimension.score+' 分':''),
      (dimension.groups || []).map(group=>{
        const itemIds = new Set((group.items || []).map(item=>typeof item==='string'?item:item.id));
        const rows = (record.items || []).filter(item=>itemIds.has(item.id) ||
          (item.groupId===group.id && item.dimensionId===dimension.id));
        return '<h4>'+e(group.name)+'</h4>'+pointsTable(rows,canAppeal,picked);
      }).join(''),index===0 || Boolean(canAppeal))).join('');
  }

  function chooseRelated(records,current) {
    return current.taskId ? records.filter(record=>record.taskId===current.taskId) :
      records.filter(record=>record.id===current.id || (current.leadCode && record.leadCode===current.leadCode));
  }

  function open(recordId,{tab='staff',onSaved,showSubmit=true}={}) {
    const access = service().access();
    const original = service().record(recordId);
    if (!access || !original) return false;
    const scope = scopeKey(), fromPage = DApp.currentPage();
    const canOpen = () => dialog.element.isConnected && scopeKey()===scope && DApp.currentPage()===fromPage;
    const picked = new Set();
    let selectedId = recordId, activeVisit = '', audioId = '', audioVisit = '', reason = '', tagChoice = '', tagReason = '';
    if (tab==='tags') tab='chat';
    if (!detailTabs.some(([id])=>id===tab)) tab='staff';
    const actions = [{label:'关闭',run:close=>close()}];
    const allowSubmit = showSubmit && access.canAppeal;
    if (allowSubmit) actions.push({label:'提交申诉',primary:true,run:close=>{
      if (!canOpen()) return;
      if (!picked.size) return showError(body,'请至少勾选一个可申诉细项。');
      if (!reason.trim()) return showError(body,'请填写申诉内容。');
      const result = service().submitAppeal({recordId:selectedId,itemIds:[...picked],reason});
      if (!result?.ok) return showError(body,result?.error || '申诉未保存，请重试。');
      close();
      DUI.toast('申诉已提交，可在「质检申诉」查看进度。');
      onSaved?.(result.appeal);
    }});
    const dialog = DUI.dialog('质检明细详情','<div class="qi-detail" data-qi-details-drawer></div>',actions,{drawer:true,stack:true,dismissible:true});
    dialog.element.querySelector('.d-dialog').classList.add('qi-drawer');
    const body = dialog.element.querySelector('[data-qi-details-drawer]');

    function draw() {
      if (!canOpen()) return;
      const record = service().record(selectedId);
      if (!record) return dialog.close();
      const canAppeal = allowSubmit && rowsForAppeal(record).some(hasUsableItem);
      if (allowSubmit) dialog.buttons[1].hidden = !canAppeal || tab!=='staff';
      const related = chooseRelated(service().records(),original).sort((a,b)=>String(a.callAt).localeCompare(String(b.callAt)));
      const aiRecords = related.filter(isAiCall);
      if (!aiRecords.some(row=>row.id===audioId)) audioId=aiRecords.at(0)?.id || '';
      const audio = aiRecords.find(row=>row.id===audioId);
      const siblings = tab==='ai' ? visitNavigation(aiRecords,audioVisit,audioId) :
        tab==='task' ? '' : visitNavigation(related,activeVisit,selectedId);
      const tabs = '<div class="platform-tabs qi-detail-tabs" role="tablist" aria-label="质检详情内容">'+
        detailTabs.map(([id,label])=>'<button type="button" role="tab" aria-selected="'+(tab===id)+
          '" class="'+(tab===id?'active':'')+'" data-qi-detail-tab="'+id+'">'+label+'</button>').join('')+'</div>';
      const selectedRecord = tab==='ai' ? audio : record;
      const selectedContent = tab==='staff'
        ? section('通话概况',callOverview(record))+section('质检计分',scoreSummary(record))+
          (record.inspected?section('细项指标',radar(record.dimensions || [])+itemChips(record,canAppeal,picked))+
            section('诊断内容及建议',diagnosis(record)):'')+
          section('会话记录',transcript(record))+section('合规及红线',compliance(record,canAppeal,picked))+
          section('客服规范',scoring(record,canAppeal,picked))
        : tab==='task' ? section('任务详情',dataList(describeRecord(record).concat([
          ['线索状态',record.leadStatus],['回访结果',record.followupResult],['回访备注',record.followupNote]
        ])))+section('关联回访与通话',taskHistory(related))
        : tab==='ai' ? (audio ? section('AI 外呼录音',callOverview(audio)+transcript(audio)) :
          '<p class="qi-empty" data-qi-ai-empty>当前任务暂无 AI 外呼录音记录。</p>')
        : section('基础信息',dataList(describeRecord(record)))+
          section('对话标签',record.tags?.length?dataList(record.tags.map(tag=>[tag.label,tag.value])):'<p class="qi-empty">暂无对话标签</p>')+
          (record.tags?.length ? section('标签检核',tagReviewMarkup(record)) : '')+
          section('会话记录',transcript(record));
      const comment = canAppeal && tab==='staff' ? '<div class="qi-comment"><label class="field"><span>申诉内容</span>'+
        '<textarea data-qi-appeal-reason maxlength="500" rows="3" placeholder="说明需要复核的依据">'+e(reason)+'</textarea></label>'+
        '<span data-qi-reason-count>'+reason.length+' / 500</span><p class="d-muted">勾选需要申诉的细项后提交。</p></div>' : '';
      body.innerHTML = '<div class="qi-record-heading"><strong>'+e(value(selectedRecord?.callId || record.taskId))+
        '</strong><span>'+e(selectedRecord?.seatName || record.seatName)+(selectedRecord?.callAt?' · '+e(selectedRecord.callAt):'')+
        '</span></div>'+tabs+siblings+selectedContent+comment+errorMarkup;
    }

    function tagReviewMarkup(record) {
      const review = record.tagReview;
      const prior = review ? dataList([
        ['检核结果',review.passed?'通过':'不通过'],['检核人',review.reviewedByName || review.reviewedBy],
        ['检核时间',review.reviewedAt],...(review.callId?[
          ['检核通话 ID',review.callId],['检核任务 ID',review.taskId],['检核轮次 ID',review.roundId]
        ]:[]),['说明',review.reason]
      ]) : '<p class="qi-empty">待检核</p>';
      if (!access.canVerifyTags) return prior;
      return prior+'<fieldset class="qi-review-point"><legend>检核结论</legend><div>'+
        '<label><input type="radio" name="tag-decision" value="yes"'+(tagChoice==='yes'?' checked':'')+'> 通过</label>'+
        '<label><input type="radio" name="tag-decision" value="no"'+(tagChoice==='no'?' checked':'')+'> 不通过</label>'+
        '</div><label class="field"><span>检核说明（必填）</span><textarea data-qi-tag-reason maxlength="500" rows="3">'+
        e(tagReason)+'</textarea></label><button type="button" class="btn btn-primary" data-qi-verify-tags>'+
        (review?'重新检核':'提交检核')+'</button></fieldset>';
    }

    body.addEventListener('click',event=>{
      if (!canOpen()) return;
      const next = event.target.closest('[data-qi-detail-tab]');
      if (next) {
        tab=next.dataset.qiDetailTab;draw();body.querySelector('[aria-selected="true"]')?.focus();return;
      }
      if (event.target.closest('[data-qi-export-transcript]')) {
        const record = service().record(tab==='ai'?audioId:selectedId);
        if (record?.transcript?.length) textDownload(record.callId+'-通话文本.txt',
          record.transcript.map(line=>[line.time,line.role,line.text].join(' ')).join('\n'));
      }
      const nav = event.target.closest('[data-qi-visit],[data-qi-call]');
      if (nav) {
        const ai = tab==='ai';
        const related = chooseRelated(service().records(),original).sort((a,b)=>String(a.callAt).localeCompare(String(b.callAt)));
        const source = ai?related.filter(isAiCall):related;
        const selected = ai?audioId:selectedId;
        const visit = nav.dataset.qiVisit;
        const calls = visit ? source.filter(row=>visitKey(row)===visit) : source;
        const nextId = visit===undefined ? nav.dataset.qiCall :
          (calls.some(row=>row.id===selected)?selected:calls.at(0)?.id);
        if (!source.some(row=>row.id===nextId)) return;
        if (ai) {
          if (visit!==undefined) audioVisit=visit;
          audioId=nextId;
        } else {
          if (visit!==undefined) activeVisit=visit;
          if (nextId!==selectedId) {
            selectedId=nextId;picked.clear();reason='';tagChoice='';tagReason='';
          }
        }
        draw();body.querySelector('[data-qi-call][aria-pressed="true"]')?.focus();return;
      }
      const chip = event.target.closest('[data-qi-appeal-chip]');
      if (chip) {
        const id = chip.dataset.qiAppealChip;
        const selected = !picked.has(id);
        setItemSelected(id,selected);
        return;
      }
      if (event.target.closest('[data-qi-verify-tags]')) {
        if (!tagChoice) return showError(body,'请选择检核结果。');
        if (!tagReason.trim()) return showError(body,'请填写检核说明。');
        const result = service().verifyTags({recordId:selectedId,passed:tagChoice==='yes',reason:tagReason});
        if (!result?.ok) return showError(body,result?.error || '检核未保存，请重试。');
        tagChoice='';tagReason='';draw();
        DUI.toast('已保存标签检核结果。');
        onSaved?.(result.record);
      }
    });
    body.addEventListener('change',event=>{
      if (!canOpen()) return;
      if (event.target.name==='tag-decision') tagChoice=event.target.value;
      if (event.target.matches('[data-qi-appeal-item]')) {
        setItemSelected(event.target.value,event.target.checked);
      }
    });
    function setItemSelected(id,selected) {
      if (selected) picked.add(id);
      else picked.delete(id);
      body.querySelectorAll('[data-qi-appeal-chip],[data-qi-appeal-item]').forEach(control=>{
        if (control.dataset.qiAppealChip===id) control.setAttribute('aria-pressed',String(selected));
        if (control.hasAttribute('data-qi-appeal-item') && control.value===id) control.checked=selected;
      });
      showError(body,'');
    }
    body.addEventListener('input',event=>{
      if (event.target.matches('[data-qi-tag-reason]')) {
        tagReason=event.target.value;showError(body,'');
      }
      if (event.target.matches('[data-qi-appeal-reason]')) {
        reason=event.target.value;
        body.querySelector('[data-qi-reason-count]').textContent=reason.length+' / 500';
        showError(body,'');
      }
    });
    draw();
    body.querySelector('[aria-selected="true"]')?.focus();
    return true;
  }

  const commonColumns = [
    ['坐席名称',row=>row.seatName],['坐席组',row=>row.seatGroup],['通话 ID',row=>row.callId],
    ['线索编码',row=>row.leadCode],['车系',row=>row.series],['是否质检',row=>yesNo(row.inspected)],
    ['不质检原因',row=>row.notInspectedReason],['通话完整性',row=>row.completeness],
    ['通话时长（秒）',row=>row.duration],['通话时间',row=>row.callAt],['是否触发红线',row=>row.inspected?yesNo(row.redLine):'—']
  ];
  const scoreColumns = [
    ['细项指标分',row=>row.inspected?(row.dimensionScore ?? row.rawScore):null],
    ['敏感词扣分',row=>row.inspected?row.sensitiveDeduction:null],
    ['产品知识扣分',row=>row.inspected?row.knowledgeDeduction:null],['是否违规下发',row=>row.inspected?yesNo(row.violation):'—'],
    ['质检等级',row=>row.grade],['是否优秀案例',row=>row.inspected?yesNo(row.excellent):'—'],['质检总分',row=>row.score]
  ];
  const modelItems = model => model.flatMap(dimension=>(dimension.groups || []).flatMap(group=>group.items || []));

  function itemPicker(model) {
    return '<details class="qi-pick" data-qi-columns><summary>细项列 <span data-qi-column-count>未选择</span></summary>'+
      '<div class="qi-pick-body qi-item-tree">'+model.map(dimension=>'<details open><summary>'+e(dimension.name)+'</summary>'+
        (dimension.groups || []).map(group=>'<fieldset><legend>'+e(group.name)+'</legend>'+
          (group.items || []).map(item=>'<label><input type="checkbox" value="'+e(item.id)+'" data-qi-column-id> '+e(item.name)+'</label>').join('')+
        '</fieldset>').join('')+'</details>').join('')+'</div></details>';
  }

  function detailRows(filters,seats) {
    return service().records().filter(row=>
      (!seats.length || seats.includes(row.seatId || row.accountId)) &&
      inRange(datePart(row.qualityAt),filters.dateFrom,filters.dateTo) &&
      numberInRange(row.duration,filters.durationFrom,filters.durationTo) &&
      numberInRange(row.score,filters.scoreFrom,filters.scoreTo) &&
      (!filters.completeness || row.completeness===filters.completeness) &&
      (!filters.excellent || (row.inspected && String(row.excellent)===filters.excellent)) &&
      (!filters.code || (row.leadCode || '').toLowerCase().includes(filters.code.toLowerCase())) &&
      (!filters.series || row.series===filters.series) &&
      (!filters.inspected || String(row.inspected)===filters.inspected) &&
      (!filters.grade || row.grade===filters.grade)
    ).sort((a,b)=>String(b.callAt).localeCompare(String(a.callAt)));
  }

  function inputError(filters,ranges) {
    for (const [start,end,label] of ranges) {
      const first=filters[start], last=filters[end];
      if (!first || !last) continue;
      if ((start.startsWith('date') || start.startsWith('appeal') || start.startsWith('reply') ?
        first > last : Number(first)>Number(last))) return label+'的起始值不能大于结束值。';
    }
    return '';
  }

  function dimensionGroups(model,items) {
    const visibleIds = new Set(items.map(item=>item.id));
    return model.map(dimension=>{
      const accepted = modelItems([dimension]).filter(item=>visibleIds.has(item.id));
      const score = row => row.dimensions?.find(item=>item.id===dimension.id)?.score;
      return {dimension,accepted,columns:[
        [dimension.name+'得分',score],
        ...accepted.map(item=>[item.name+'得分',row=>row.items?.find(result=>result.id===item.id)?.score])
      ]};
    });
  }

  function exportColumns(model,items) {
    return [...commonColumns,...dimensionGroups(model,items).flatMap(group=>group.columns),...scoreColumns];
  }

  function detailTableHeader(groups) {
    const fixedHeader = ([label])=>'<th scope="col" rowspan="2">'+e(label)+'</th>';
    const dimHeader = ({dimension,accepted,columns})=>'<th scope="colgroup" colspan="'+columns.length+'">'+
      '<button type="button" class="qi-sort" data-qi-expand-dimension="'+e(dimension.id)+'" aria-expanded="'+(accepted.length>0)+
      '" title="'+e((accepted.length?'收起':'展开')+dimension.name+'细项')+'">'+e(dimension.name)+
      '<span aria-hidden="true">'+(accepted.length?'−':'+')+'</span></button></th>';
    return '<thead><tr>'+commonColumns.map(fixedHeader).join('')+groups.map(dimHeader).join('')+
      scoreColumns.map(fixedHeader).join('')+'<th scope="col" rowspan="2">操作</th></tr><tr>'+
      groups.flatMap(group=>['得分',...group.accepted.map(item=>item.name)]).map(label=>'<th scope="col">'+e(label)+'</th>').join('')+
      '</tr></thead>';
  }

  async function downloadXlsx(button,fileName,headers,rows,expectedScope=scopeKey()) {
    const current = () => button.isConnected && Boolean(service().access()) && scopeKey()===expectedScope;
    if (!rows.length || !current()) return;
    button.disabled=true;
    try {
      await window.DModuleHost.prepareIntegration();
      const utility = document.querySelector('iframe[data-native-module=cloud]')?.contentWindow?.DImportFiles;
      if (!current()) return;
      if (!utility) throw Error('当前文件服务暂不可用，请稍后重试。');
      const file = await utility.template(headers.map((label,index)=>({key:'column'+index,label,type:'text'})),
        fileName,'xlsx','质检管理',rows);
      if (current()) utility.save({...file,fileName:fileName+'.xlsx'});
    } catch (error) {
      if (current()) DUI.toast(error.message || '文件未能生成。');
    } finally {
      if (button.isConnected) button.disabled=false;
    }
  }

  function downloadTable(button,view,model,all) {
    const columns = exportColumns(model,all?modelItems(model):view.items);
    const rows = detailRows(view.filters,view.seats).map(row=>columns.map(([,read])=>value(read(row))));
    return downloadXlsx(button,all?'质检明细':'质检结果',columns.map(([label])=>label),rows,view.scope);
  }

  function init(context,options={}) {
    const host = document.querySelector('[data-qi-detail-page]');
    const access = service().access(context);
    if (!host || !access) return;
    const scoped = service().records();
    const series = [...new Set(scoped.map(row=>row.series).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
    const model = service().modelForRecords(scoped);
    const view = {scope:scopeKey(),page:1,size:10,seats:[],items:[],filters:{}};
    host.querySelector('[data-qi-detail-content]').innerHTML =
      '<form class="filter-panel qi-filter" data-rtl-region="filters" aria-label="质检明细查询">'+seatFilter(scoped,access)+
      rangeFields('质检日期','dateFrom','dateTo','date')+
      rangeFields('通话时长（秒）','durationFrom','durationTo','number','min="0" step="1"')+
      choice('通话完整性','completeness',[['完整','完整'],['不完整','不完整']])+
      rangeFields('质检总分','scoreFrom','scoreTo','number','min="0" max="100" step="any"')+
      choice('是否优秀案例','excellent',flag)+field('线索编码','code','search','placeholder="输入编码"')+
      choice('车系','series',series.map(label=>[label,label]))+choice('是否质检','inspected',flag)+
      choice('质检等级','grade',[['优秀','优秀'],['合格','合格'],['不合格','不合格']])+buttons+errorMarkup+'</form>'+
      '<div class="table-card"><div class="list-toolbar" data-rtl-region="toolbar"><div class="qi-column-picker">'+itemPicker(model)+
      '<div class="qi-selected-columns" data-qi-selected-columns></div></div><div class="qi-toolbar-actions">'+
      '<button type="button" class="btn" data-qi-export="basic">导出 Excel</button>'+
      '<button type="button" class="btn" data-qi-export="all">导出质检明细</button></div></div><div data-qi-results></div></div>';
    const form = host.querySelector('form'), results=host.querySelector('[data-qi-results]');
    const picker = host.querySelector('[data-qi-columns]');
    bindSeatFilter(form);
    form.onsubmit = event => {
      event.preventDefault();
      const data = new FormData(form);
      const filters = Object.fromEntries([...data].map(([name,input])=>[name,input.trim()]));
      const error = inputError(filters,[['dateFrom','dateTo','质检日期'],['durationFrom','durationTo','通话时长'],['scoreFrom','scoreTo','质检总分']]);
      showError(form,error);
      if (error) return;
      view.filters=filters;view.seats=data.getAll('seat');view.page=1;
      form.querySelector('[data-qi-seat-filter]')?.removeAttribute('open');
      draw();
    };
    const selectedColumns = host.querySelector('[data-qi-selected-columns]');
    function applyColumns() {
      const ids = new Set([...picker.querySelectorAll('input:checked')].map(input=>input.value));
      view.items=modelItems(model).filter(item=>ids.has(item.id));
      picker.querySelector('[data-qi-column-count]').textContent=ids.size?'已选 '+ids.size+' 项':'未选择';
      selectedColumns.innerHTML = view.items.map(item=>'<button type="button" class="qi-column-chip" data-qi-remove-column="'+
        e(item.id)+'" title="'+e('移除 '+item.name)+'">'+e(item.name)+' ×</button>').join('');
      draw();
    }
    form.onreset = () => queueMicrotask(()=>{
      view.filters={};view.seats=[];view.page=1;
      form.querySelectorAll('[data-qi-seat-label]').forEach(label=>label.hidden=false);
      picker.querySelectorAll('input:checked').forEach(input=>input.checked=false);
      syncSeatFilter(form);showError(form,'');applyColumns();
    });
    picker.onchange = applyColumns;
    selectedColumns.onclick = event => {
      const button = event.target.closest('[data-qi-remove-column]');
      if (!button) return;
      const input = [...picker.querySelectorAll('[data-qi-column-id]')].find(row=>row.value===button.dataset.qiRemoveColumn);
      if (input) {input.checked=false;applyColumns();}
    };
    results.onclick = event => {
      const button = event.target.closest('[data-qi-expand-dimension]');
      if (!button) return;
      const dimension = model.find(item=>item.id===button.dataset.qiExpandDimension);
      if (!dimension) return;
      const ids = new Set(modelItems([dimension]).map(item=>item.id));
      const expand = button.getAttribute('aria-expanded')==='false';
      picker.querySelectorAll('[data-qi-column-id]').forEach(input=>{if (ids.has(input.value)) input.checked=expand;});
      applyColumns();
    };
    host.querySelectorAll('[data-qi-export]').forEach(button=>button.onclick=()=>downloadTable(button,view,model,button.dataset.qiExport==='all'));

    function draw() {
      if (!host.isConnected || scopeKey()!==view.scope) return;
      const rows = detailRows(view.filters,view.seats);
      const controls = pagination(rows.length,view);
      const columns = exportColumns(model,view.items);
      const first = (view.page-1)*view.size;
      const visible = rows.slice(first,first+view.size);
      results.innerHTML = '<div class="table-scroll qi-detail-table" data-rtl-region="table" role="region" tabindex="0" aria-label="质检明细列表">'+
        '<table class="platform-table">'+detailTableHeader(dimensionGroups(model,view.items))+'<tbody>'+
        (visible.map(row=>'<tr data-quality-record-id="'+e(row.id)+'">'+columns.map(([,read])=>'<td>'+e(value(read(row)))+'</td>').join('')+
          '<td><button type="button" class="btn-link" data-qi-open="'+e(row.id)+'">详情</button></td></tr>').join('')||
          '<tr><td colspan="'+(columns.length+1)+'" class="qi-empty">暂无符合条件的质检明细</td></tr>')+
        '</tbody></table></div>'+controls;
      host.querySelectorAll('[data-qi-export]').forEach(button=>button.disabled=!rows.length);
      bindPagination(results,view,draw);
      results.querySelectorAll('[data-qi-open]').forEach(button=>button.onclick=()=>{
        if (!open(button.dataset.qiOpen,{onSaved:draw})) DUI.toast('当前记录不可查看。');
      });
    }
    draw();
    if (options.recordId) {
      DApp.saveFilters({...options,recordId:''});
      open(options.recordId,{onSaved:draw});
    }
  }

  window.Pages ||= {};
  Pages[pageId] = {
    render:()=>'<section class="platform-page qi-page" data-qi-detail-page data-rtl-page-type="list">'+
      '<header class="d-page-heading" data-rtl-region="page-header"><h1>质检明细</h1></header><div data-qi-detail-content></div></section>',
    init
  };
  window.DQualityInspectionDetail = Object.freeze({
    open,describeRecord,dataList,rowsForAppeal,appealStatusLabel,
    scopeKey,inRange,datePart,seatFilter,syncSeatFilter,bindSeatFilter,rangeFields,choice,buttons,errorMarkup,showError,
    pagination,bindPagination,inputError,downloadXlsx
  });
})();
