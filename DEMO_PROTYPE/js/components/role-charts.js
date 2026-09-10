/** Charts use scoped demo records. Missing observations are never invented. */
(function(){
  'use strict';
  const esc=v=>PlatformUI.escape(String(v)), colors=['#1677ff','#36a89b','#e6a23c','#8b95a5','#c76175'];
  const scoped=rows=>AppState.scoped(rows||[]);
  const panel=(title,body,note)=>'<article class="panel-card role-chart"><div class="panel-header"><h2>'+title+'</h2>'+PlatformUI.help(note)+'</div><div class="role-chart-body">'+body+'</div></article>';
  const empty=text=>'<div class="role-chart-empty">'+text+'</div>';
  const action=(code)=>' onclick="'+esc(code)+'"';
  function bars(rows,total){return rows.map((r,i)=>'<button class="role-bar-row"'+action(r.action||"navigateTo('cloud-call-records')")+'><span>'+esc(r.name)+'</span><span class="role-bar-track"><i style="width:'+Math.min(100,Math.max(0,total?r.value/total*100:0))+'%;background:'+colors[i%colors.length]+'"></i></span><strong>'+esc(r.label??r.value)+'</strong></button>').join('');}
  function distribution(rows,actionCode,unit='通'){
    const total=rows.reduce((s,r)=>s+r.value,0);let offset=0;
    const segments=rows.map((r,i)=>{const start=offset;offset+=total?r.value/total*100:0;return colors[i%colors.length]+' '+start+'% '+offset+'%';}).join(',');
    return '<div class="role-distribution"><div class="role-donut" role="img" aria-label="'+esc(rows.map(r=>r.name+' '+r.value).join('，'))+'" style="background:'+(total?'conic-gradient('+segments+')':'#eef1f5')+'"><div><strong>'+total+'</strong><span>'+unit+'</span></div></div><div class="role-legend">'+rows.map((r,i)=>'<button'+action(actionCode)+'><i style="background:'+colors[i%colors.length]+'"></i><span>'+esc(r.name)+'</span><strong>'+r.value+'</strong></button>').join('')+'</div></div>';
  }
  function admin(){
    const tasks=scoped(CloudCallData.tasks).filter(t=>['预外呼','IVR 外呼'].includes(t.callType));
    const rows=tasks.map(t=>({name:t.name,value:Math.min(Number(t.completed)||0,Number(t.total)||0),total:Number(t.total)||0,action:'CloudTaskWorkspace.openTask('+JSON.stringify(t.taskId)+',"overview")'}));
    const taskHtml=rows.length?rows.map(r=>bars([{...r,label:r.value+' / '+r.total}],r.total)).join(''):empty('暂无任务');
    const agents=scoped(CloudCallData.agents),groups=['通话中','空闲','话后处理','离线 / 暂停'];
    const counts=groups.map(name=>({name,value:0}));agents.forEach(a=>{const n=a.currentCall?0:/话后|整理/.test(a.agentStatus)?2:a.agentStatus==='空闲'&&a.acceptNewTasks?1:3;counts[n].value++;});
    return '<div class="role-chart-grid">'+panel('任务完成进度',taskHtml,'蓝色为已完成，灰色为未完成；右侧为已完成/任务总量，点击查看任务。')+panel('坐席负荷分布',distribution(counts,"OperationsMonitor.open('manual')",'人'),'当前租户演示状态，非实时采集；每名坐席仅归入一个状态。点击图例查看人员。')+'</div>';
  }
  function health(source){
    const flow=source.map((r,i)=>'<button class="role-health-node '+(r.items.length?'has-issue':'')+'"'+action(r.action?"OperationsMonitor.open('tasks')":"navigateTo('"+r.route+"')")+'><span>'+esc(r.name)+'</span><strong>'+r.items.length+'</strong><small>'+(r.items.length?'项待处理':'暂无异常记录')+'</small></button>').join('<span class="role-flow-separator">·</span>');
    return '<div class="role-chart-grid role-health-grid">'+panel('功能环节状态', '<div class="role-health-flow">'+flow+'</div>','功能环节概览，不代表所有功能按同一流水线执行。零记录不等于实时健康，点击进入原模块。')+panel('异常积压趋势',empty('待接入历史监测数据<br><small>暂不绘制趋势线</small>'),'当前只有异常现状，没有各时点积压快照，不能用异常更新时间冒充积压趋势。')+'</div>';
  }
  function businessData(){
    const calls=scoped(CloudCallData.calls),byDay={};
    calls.forEach(c=>{const date=[c.ringingAt,c.queueAt,c.answeredAt].map(v=>String(v||'').slice(0,10)).find(v=>/^\d{4}-\d{2}-\d{2}$/.test(v));if(!date)return;const row=byDay[date]||(byDay[date]={date,total:0,connected:0});row.total++;if(c.answeredAt&&c.answeredAt!=='—')row.connected++;});
    const counts=new Map();calls.forEach(c=>{const key=c.result||'待核对';counts.set(key,(counts.get(key)||0)+1);});
    return {days:Object.values(byDay).sort((a,b)=>a.date.localeCompare(b.date)),results:[...counts].map(([name,value])=>({name,value}))};
  }
  function trend(days){
    if(!days.length)return empty('暂无带日期的通话记录');
    const max=Math.max(1,...days.map(d=>d.total)),W=460,H=200,left=40,right=435,top=22,bottom=158;
    const first=Date.parse(days[0].date),last=Date.parse(days[days.length-1].date);
    const x=i=>first===last?(left+right)/2:left+(Date.parse(days[i].date)-first)/(last-first)*(right-left),y=v=>bottom-v/max*(bottom-top);
    const lines=[0,max].map(v=>'<line x1="40" x2="435" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e8ebf0"/><text x="32" y="'+(y(v)+4)+'" text-anchor="end">'+v+'</text>').join('');
    const series=['total','connected'].map((key,k)=>'<polyline fill="none" stroke="'+colors[k]+'" stroke-width="2" '+(k?'stroke-dasharray="5 4"':'')+' points="'+days.map((d,i)=>x(i)+','+y(d[key])).join(' ')+'"/>'+days.map((d,i)=>'<circle cx="'+x(i)+'" cy="'+y(d[key])+'" r="'+(k?3:5)+'" stroke="'+colors[k]+'" fill="'+(k?'#fff':colors[k])+'"><title>'+d.date+' '+(k?'接通':'呼叫')+' '+d[key]+'通</title></circle>').join('')).join('');
    return '<svg class="role-trend" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="按已有记录日期统计呼叫与接通量"><text x="8" y="14">通</text>'+lines+series+days.map((d,i)=>i===0||i===days.length-1||days.length<5?'<text x="'+x(i)+'" y="180" text-anchor="'+(i===0?'start':i===days.length-1?'end':'middle')+'">'+d.date.slice(5)+'</text>':'').join('')+'</svg><div class="role-trend-legend"><span>● 呼叫量</span><span>● 接通量</span><button class="btn-link" onclick="navigateTo(\'cloud-overview-report\')">查看报表</button></div>';
  }
  function business(){const d=businessData();return '<div class="role-chart-grid">'+panel('呼叫与接通趋势',trend(d.days),'仅统计当前范围已加载、有拨号或接通日期的演示记录。缺失日期不补零；点间连线不代表中间日期有观测。完整范围与日期筛选见报表。')+panel('通话结果分布',d.results.length?distribution(d.results,"navigateTo('cloud-call-records')"):empty('暂无通话记录'),'按记录原始结果分类，不推断客户意向；图例点击进入通话记录。')+'</div>';}
  function personal(agent){if(!agent)return '';const today=new Date().toLocaleDateString('sv-SE'),rows=scoped(CloudCallData.calls).filter(c=>c.agentIdentityId===agent.contactCenterIdentityId&&String(c.endedAt||'').slice(0,10)===today);const done=rows.filter(c=>c.agentDisposition);return '<div class="role-personal">今日已结束 <strong>'+rows.length+'</strong> 通<span class="role-bar-track"><i style="width:'+(rows.length?done.length/rows.length*100:0)+'%"></i></span>已填写结果 '+done.length+' 通</div>';}
  window.RoleCharts={admin,health,business,businessData,personal};
})();
