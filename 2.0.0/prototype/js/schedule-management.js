(() => {
  'use strict';
  const page = 'PAGE-21001';
  const defaults = {早班:['09:00','18:00'],中班:['12:00','21:00'],晚班:['14:00','23:00']};
  const workingShifts = Object.keys(defaults);
  const names = [...workingShifts,'休息'];
  const validTime = value => typeof value==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  const validHours = range => Array.isArray(range) && range.length===2 &&
    range.every(validTime) && range[0]<range[1];
  function shiftHours(state,name,date=state?.today) {
    if (!Object.hasOwn(defaults,name)) return null;
    const history=state?.shiftHistory || [];
    const version=date<state?.today ? history.findLast(item=>item.effectiveOn<=date) || history[0] : null;
    const saved=(version?.hours || state?.shiftHours)?.[name];
    return [...(validHours(saved)?saved:defaults[name])];
  }
  window.DReview21Schedule={shiftHours};
  const views = new Map();
  const e = value => DUI.esc(value);
  const pad = value => String(value).padStart(2,'0');
  const validMonth = month => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
  const daysOf = month => {
    const [year,number] = month.split('-').map(Number);
    return Array.from({length:new Date(Date.UTC(year,number,0)).getUTCDate()},(_,i)=>month+'-'+pad(i+1));
  };
  const actor = () => DSession.context();
  const actorKey = () => actor()?.account?.id+'|'+actor()?.scope?.id;
  const canEdit = state => state.role==='admin' && DReview21.allowedScope(actor()) && DReview21.isAdmin(actor()) && actor()?.scope?.id===state.tenant && DApp.currentPage()===page;
  const seatsOf = state => state.seats.filter(s=>s.tenant===state.tenant && (state.role==='admin' || s.id===state.seatId));
  const shiftOf = (state,seat,date) => state.schedules?.[seat.id]?.[date] || '';
  const displayShift = value => value || '未配置';
  function shiftLabel(state,shift,date) {
    const hours=shiftHours(state,shift,date);
    return displayShift(shift)+(hours?'（'+hours.join('-')+'）':'');
  }

  function viewFor(state) {
    const key=actorKey();
    if (!views.has(key)) views.set(key,{month:state.today.slice(0,7),keyword:'',page:1,size:20,scroll:0});
    return views.get(key);
  }

  function applyShifts(state, changes) {
    for (const {seat,date,shift} of changes) {
      const previous=shiftOf(state,seat,date);
      if (previous===shift) continue;
      state.schedules ||= {};
      (state.schedules[seat.id] ||= {})[date]=shift;
      (state.changes ||= []).unshift({area:'排班',seatId:seat.id,tenant:state.tenant,date:state.today,detail:date+'：'+displayShift(previous)+' → '+shift});
    }
  }

  function scheduleTable(state, view) {
    const dates=daysOf(view.month), keyword=view.keyword.toLowerCase();
    const seats=seatsOf(state).filter(s=>[s.account,s.name,s.employeeNo].some(x=>String(x||'').toLowerCase().includes(keyword)));
    const total=Math.max(1,Math.ceil(seats.length/view.size));
    view.page=Math.min(view.page,total);
    const offset=(view.page-1)*view.size;
    const header=dates.map(d=>'<th scope="col" class="'+(d===state.today?'is-today':'')+'">'+Number(d.slice(8))+(d===state.today?'<small>今</small>':'')+'</th>').join('');
    const rows=seats.slice(offset,offset+view.size).map((seat,index)=>{
      const cells=dates.map(date=>{
        const shift=shiftOf(state,seat,date);
        const label=seat.name+' · '+date+' · '+shiftLabel(state,shift,date);
        const style='schedule-shift shift-'+names.indexOf(shift), text=shift?e(shift.charAt(0)):'—';
        const editable=canEdit(state)&&date>=state.today;
        return '<td class="'+(date===state.today?'is-today':'')+'">'+(editable
          ? '<button class="'+style+'" type="button" data-shift-seat="'+e(seat.id)+'" data-shift-date="'+date+'" title="'+e(label+'，点击切换班次')+'" aria-label="'+e(label+'，点击切换班次')+'">'+text+'</button>'
          : '<span class="'+style+'" data-shift-read-date="'+date+'" title="'+e(label)+'" aria-label="'+e(label)+'">'+text+'</span>')+'</td>';
      }).join('');
      return '<tr><td>'+ (offset+index+1) +'</td><td>'+e(seat.account||seat.employeeNo||'—')+'</td><td>'+e(seat.name)+'</td><td>'+e(seat.performanceScore??'—')+'</td><td>'+Number(view.month.slice(5))+'月</td>'+cells+'</tr>';
    }).join('');
    return '<section class="table-card schedule-card"><header class="schedule-toolbar schedule-table-heading"><div><h2>月度排班表</h2><p>共 '+seats.length+' 位坐席</p></div><span class="schedule-muted">横向滚动查看整月'+(canEdit(state)?' · 点击班次切换':'')+'</span></header>'+
      '<div class="table-scroll schedule-scroll" tabindex="0" aria-label="月度排班表，可横向滚动"><table class="platform-table schedule-grid"><thead><tr><th scope="col">序号</th><th scope="col">坐席账号</th><th scope="col">姓名</th><th scope="col">业绩评分</th><th scope="col">值班月份</th>' +header+'</tr></thead><tbody>'+
      (rows||'<tr><td colspan="'+(5+dates.length)+'"><div class="d-page-empty">没有符合条件的坐席</div></td></tr>')+
      '</tbody></table></div><div class="schedule-pagination" aria-label="排班列表分页"><span>第 '+view.page+' / '+total+' 页</span><label>每页 <select aria-label="每页显示条数" data-page-size>'+
      [5,10,20,50].map(n=>'<option value="'+n+'"'+(n===view.size?' selected':'')+'>'+n+'</option>').join('')+
      '</select> 条</label><select aria-label="选择页码" data-page-select>'+
      Array.from({length:total},(_,index)=>'<option value="'+(index+1)+'"'+(index+1===view.page?' selected':'')+'>第 '+(index+1)+' 页</option>').join('')+
      '</select><button type="button" class="btn" data-page-step="-1" '+(view.page===1?'disabled':'')+'>上一页</button><button type="button" class="btn" data-page-step="1" '+(view.page===total?'disabled':'')+'>下一页</button></div></section>';
  }

  function calendar(state,view) {
    const editable=canEdit(state);
    const hours=window.DSkynetSeatAssignment.workHours(state);
    const hoursText=hours ? hours.join('–') : '待核对';
    return '<form class="table-card schedule-filter" data-schedule-filter><h2>筛选查询</h2><div class="schedule-filter-row">'+
      '<div class="schedule-filter-fields"><label class="field"><span>值班月份</span><input name="month" type="month" value="'+e(view.month)+'" required></label>'+
      (state.role==='admin'?'<label class="field"><span>坐席账号或姓名</span><input name="keyword" value="'+e(view.keyword)+'" placeholder="输入账号或姓名"></label>':'')+
      '<button type="submit" class="btn btn-primary">查询</button><button type="button" class="btn" data-schedule-reset>重置</button></div>'+
      '<div class="schedule-buttons">'+(editable?'<button type="button" class="btn" data-schedule-work-hours title="北京时间 '+e(hoursText)+'">工作时间配置 · '+e(hoursText)+'</button>':'')+
      '<button type="button" class="btn" data-schedule-shifts>'+(editable?'班次管理':'班次说明')+'</button>'+
      (editable?'<button type="button" class="btn" data-schedule-import>导入排班</button>':'')+
      '<button type="button" class="btn" data-schedule-export>导出排班</button></div></div></form>'+
      '<div class="table-card schedule-legend"><span>图例：</span>'+names.map((name,index)=>
        '<span class="schedule-legend-item"><i class="shift-'+index+'" aria-hidden="true"></i>'+e(shiftLabel(state,name))+'</span>'
      ).join('')+'<span class="schedule-muted">'+(editable?'点击今天及之后的日期切换班次':'仅展示本人排班')+' · 历史日期显示当日时段</span></div>'+
      scheduleTable(state,view);
  }

  function showWorkHours(state,ui) {
    if (!canEdit(state)) return;
    const identity=actorKey();
    const settings=window.DSkynetSeatAssignment;
    const current=settings.workHours(state);
    const [start,end]=current || settings.workHours();
    const modal=DUI.dialog('工作时间配置',`<form class="schedule-shift-form" novalidate>
      <p class="schedule-shift-note">按北京时间每天生效，包含开始及结束分钟。命中人工外呼分配策略的新任务，在工作时间内按规则自动分配，非工作时间转管理员分配，不自动补派。该配置不改变班次。</p>
      ${current?'':'<p class="schedule-shift-note">原配置无法读取，已带入默认时间，请核对后保存。</p>'}
      <div class="schedule-shift-edit schedule-work-hours-edit">
        <label class="field"><span>开始时间</span><input type="time" name="workStart" value="${e(start)}" required></label>
        <span class="schedule-shift-separator" aria-hidden="true">至</span>
        <label class="field"><span>结束时间</span><input type="time" name="workEnd" value="${e(end)}" required></label>
      </div>
      <p class="form-error" role="alert" hidden></p></form>`,[
      {label:'取消',run:close=>close()},{label:'保存',primary:true,run:save}
    ],{stack:true,dismissible:true});
    modal.element.querySelector('.d-dialog').classList.add('schedule-shift-dialog');
    const form=modal.element.querySelector('form'), error=form.querySelector('.form-error');
    form.onsubmit=event=>{event.preventDefault();modal.buttons[1].click();};
    form.oninput=()=>{error.hidden=true;error.textContent='';};
    function fail(message) {
      error.textContent=message;error.hidden=false;
    }
    function save(close) {
      if(identity!==actorKey()||!canEdit(state)) return fail('当前使用范围已变化，请重新打开工作时间配置。');
      const next=[form.elements.workStart.value,form.elements.workEnd.value];
      if(!settings.validWorkHours(next)) return fail('请填写同一天内的有效时间，结束须晚于开始。');
      if(!ui.save('工作时间已更新。',()=>{state.manualAssignmentWorkHours=next;})) {
        return fail(DReview21.saveFailure(state,'工作时间未保存，请刷新后重试。'));
      }
      close();
      document.querySelector('#review21-schedule-content [data-schedule-work-hours]')?.focus({preventScroll:true});
    }
  }

  function showShifts(state,ui) {
    const editable=canEdit(state), identity=actorKey();
    const title=editable?'班次管理':'班次说明';
    const note=editable?'保存后用于今天的后续分派和未来排班。历史日期保留当日时段。时间为北京时间。':'以下为当前班次时间。月表的历史日期显示当日时段。';
    const rows=workingShifts.map((name,index)=>{
      const [start,end]=shiftHours(state,name);
      const readonly=editable?' required':' readonly';
      return `<div class="schedule-shift-edit">
        <span class="schedule-shift-name"><i class="shift-${index}" aria-hidden="true"></i>${e(name)}</span>
        <input type="time" name="start-${index}" aria-label="${e(name)}开始时间" value="${e(start)}"${readonly}>
        <span class="schedule-shift-separator" aria-hidden="true">至</span>
        <input type="time" name="end-${index}" aria-label="${e(name)}结束时间" value="${e(end)}"${readonly}>
      </div>`;
    }).join('');
    const actions=[{label:editable?'取消':'关闭',run:close=>close()}];
    if(editable) actions.push({label:'保存',primary:true,run:save});
    const modal=DUI.dialog(title,`<form class="schedule-shift-form" novalidate>
      <p class="schedule-shift-note">${e(note)}</p>${rows}
      <p class="form-error" role="alert" hidden></p></form>`,actions,{stack:true,dismissible:true});
    modal.element.querySelector('.d-dialog').classList.add('schedule-shift-dialog');
    const form=modal.element.querySelector('form'), error=form.querySelector('.form-error');
    form.onsubmit=event=>{event.preventDefault();modal.buttons[1]?.click();};
    form.oninput=()=>{error.hidden=true;error.textContent='';};

    function fail(message) {
      error.textContent=message;
      error.hidden=false;
    }

    function save(close) {
      if(identity!==actorKey()||!canEdit(state)) {
        fail('当前使用范围已变化，请重新打开班次管理。');
        return;
      }
      const next={};
      for(const [index,name] of workingShifts.entries()) {
        const start=form.elements['start-'+index], end=form.elements['end-'+index];
        const range=[start.value,end.value];
        if(!validHours(range)) {
          fail(name+(!validTime(start.value)||!validTime(end.value)?'请填写完整的起止时间。':'结束时间须晚于开始时间。'));
          (validTime(start.value)?end:start).focus();
          return;
        }
        next[name]=range;
      }
      if(workingShifts.every(name=>next[name].join('-')===shiftHours(state,name).join('-'))) {
        close();
        return;
      }
      if(!ui.save('班次时间已更新。',()=>{
        const history=state.shiftHistory ||= [{effectiveOn:'',hours:Object.fromEntries(workingShifts.map(name=>[name,shiftHours(state,name)]))}];
        const version={effectiveOn:state.today,hours:next};
        if (history.at(-1)?.effectiveOn===state.today) history[history.length-1]=version;
        else history.push(version);
        state.shiftHours=next;
      })) {
        fail(DReview21.saveFailure(state,'班次时间未保存，请重试。'));
        return;
      }
      close();
      document.querySelector('#review21-schedule-content [data-schedule-shifts]')?.focus({preventScroll:true});
    }
  }

  function exportSchedule(state,view) {
    const dates=daysOf(view.month);
    const heading='<tr><th>坐席账号</th><th>姓名</th>'+dates.map(d=>'<th>'+Number(d.slice(8))+'</th>').join('')+'</tr>';
    const rows=seatsOf(state).filter(s=>s.account).map(seat=>'<tr><td>'+e(seat.account)+'</td><td>'+e(seat.name)+'</td>'+
      dates.map(date=>'<td>'+e(shiftLabel(state,shiftOf(state,seat,date),date))+'</td>').join('')+'</tr>').join('');
    if(!rows) return DUI.toast('当前没有可导出的已关联坐席。');
    const url=URL.createObjectURL(new Blob(['\ufeff<html><meta charset="utf-8"><body><table data-month="'+view.month+'">'+heading+rows+'</table></body></html>'],{type:'application/vnd.ms-excel;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='坐席排班_'+view.month+'.xls';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function importSchedule(state,view,ui) {
    const identity=actorKey(), month=view.month, dates=daysOf(month);
    const modal=DUI.dialog('导入排班','<p>请使用当前月份导出的 .xls 表格。仅更新今天及之后的已配置班次，空白和「未配置」表示跳过。</p><label class="field"><span>排班文件</span><input type="file" accept=".xls"></label><p class="form-error" role="alert"></p>',[
      {label:'取消',run:close=>close()},
      {label:'确认导入',primary:true,run:async (close,button)=>{
        const error=modal.element.querySelector('.form-error'), file=modal.element.querySelector('input').files[0];
        if(!file||!/\.xls$/i.test(file.name)||file.size>2000000){error.textContent='请选择小于 2 MB 的 .xls 排班表。';return;}
        button.disabled=true;
        try{
          const source=document.createElement('template');source.innerHTML=await file.text();
          if(!modal.element.isConnected||actorKey()!==identity||!canEdit(state)||view.month!==month) return;
          const table=source.content.querySelector('table');
          const filenameMonth=/\d{4}-\d{2}/.exec(file.name)?.[0];
          if((table?.dataset.month||filenameMonth)!==month) throw Error('文件月份与当前月份不一致。');
          const rows=Array.from(table?.rows||[]);
          const headers=Array.from(rows.shift()?.cells||[],cell=>cell.textContent.trim());
          if(headers[0]!=='坐席账号'||headers[1]!=='姓名'||headers.length!==dates.length+2||headers.slice(2).some((v,i)=>v!==String(i+1))) throw Error('文件表头与当前月排班模板不一致。');
          const seats=seatsOf(state), seen=new Set(), changes=[];
          for(const row of rows){
            const cells=Array.from(row.cells,cell=>cell.textContent.trim()), account=cells[0];
            const matches=seats.filter(s=>s.account===account);
            if(!account||matches.length!==1||seen.has(account)||cells.length!==headers.length) throw Error('存在重复、无权限或格式不完整的坐席行。');
            seen.add(account);
            cells.slice(2).forEach((value,i)=>{
              const shift=value.replace(/（\d{2}:\d{2}-\d{2}:\d{2}）$/,'');
              if(!shift||shift==='未配置')return;
              if(!names.includes(shift))throw Error(account+' 第 '+(i+1)+' 日的班次无效。');
              if(dates[i]>=state.today)changes.push({seat:matches[0],date:dates[i],shift});
            });
          }
          const updates=changes.filter(({seat,date,shift})=>shiftOf(state,seat,date)!==shift);
          if(!updates.length){close();ui.toast('文件中没有需要更新的班次。');return;}
          if(ui.save('已导入 '+updates.length+' 项班次安排。',()=>applyShifts(state,updates)))close();
        }catch(err){error.textContent=err.message;}finally{button.disabled=false;}
      }}
    ]);
  }

  window.reviewSections.schedule={
    title:'排班管理',
    render(state) { return calendar(state,viewFor(state)); },
    bind(state,ui) {
      const root=document.getElementById('review21-schedule-content'), view=viewFor(state);
      if(!root)return;
      const filter=root.querySelector('[data-schedule-filter]'), scroll=root.querySelector('.schedule-scroll');
      const apply=()=>{
        const month=filter.elements.month.value;
        if(!validMonth(month))return;
        view.month=month;view.keyword=filter.elements.keyword?.value.trim()||'';view.page=1;view.scroll=0;ui.go('schedule');
      };
      filter.addEventListener('submit',event=>{event.preventDefault();apply();});
      filter.elements.month.addEventListener('change',apply);
      filter.querySelector('[data-schedule-reset]').onclick=()=>{
        view.keyword='';view.page=1;view.scroll=0;ui.go('schedule');
      };
      scroll.scrollLeft=view.scroll;
      scroll.addEventListener('scroll',()=>{view.scroll=scroll.scrollLeft;});
      root.querySelectorAll('[data-page-step]').forEach(button=>button.onclick=()=>{
        view.page+=Number(button.dataset.pageStep);view.scroll=scroll.scrollLeft;ui.go('schedule');
      });
      root.querySelector('[data-page-select]').onchange=event=>{view.page=Number(event.target.value);ui.go('schedule');};
      root.querySelector('[data-page-size]').onchange=event=>{view.size=Number(event.target.value);view.page=1;ui.go('schedule');};
      root.querySelector('[data-schedule-export]').onclick=()=>exportSchedule(state,view);
      root.querySelector('[data-schedule-work-hours]')?.addEventListener('click',()=>showWorkHours(state,ui));
      root.querySelector('[data-schedule-shifts]')?.addEventListener('click',()=>showShifts(state,ui));
      const importer=root.querySelector('[data-schedule-import]');
      if(importer)importer.onclick=()=>{if(canEdit(state))importSchedule(state,view,ui);};
      scroll.onclick=event=>{
        const button=event.target.closest('[data-shift-date]');
        if(!button||!canEdit(state))return;
        const seat=seatsOf(state).find(row=>row.id===button.dataset.shiftSeat), date=button.dataset.shiftDate;
        if(!seat||date<state.today||!daysOf(view.month).includes(date))return;
        const shift=names[(names.indexOf(shiftOf(state,seat,date))+1)%names.length];
        view.scroll=scroll.scrollLeft;
        if(!ui.save('已保存 '+seat.name+' · '+date+' · '+shift+'。',()=>applyShifts(state,[{seat,date,shift}])))return;
        Array.from(root.querySelectorAll('[data-shift-date]')).find(next=>next.dataset.shiftSeat===seat.id&&next.dataset.shiftDate===date)?.focus({preventScroll:true});
      };
    }
  };
})();
