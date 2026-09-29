/* Business-facing editor. The supplier contract stays in AliCtiRetry. */
(function(root){
  'use strict';
  const retry=root.AliCtiRetry;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const units={minutes:{label:'分钟',factor:1},hours:{label:'小时',factor:60},days:{label:'天',factor:1440}};
  function gaps(policy){
    const times=(policy?.rounds||[]).map(retry.minutes);
    return times.map((time,index)=>policy.timeType===1?time-(times[index-1]||0):time);
  }
  function layout(policy,editor={}){
    if(editor.layout==='custom')return 'custom';
    const values=gaps(policy);
    return values.length&&values.every(n=>Number.isSafeInteger(n)&&n>0&&n===values[0])?'uniform':'custom';
  }
  function inputValue(total,preferred){
    const unit=units[preferred]?preferred:total>0&&total%1440===0?'days':total>0&&total%60===0?'hours':'minutes';
    return {value:Number.isFinite(total)?total/units[unit].factor:'',unit};
  }
  function rawIssue(policy,editor,active){
    // Raw values can survive a draft reload without their former error messages.
    // Validate them again instead of silently submitting the last valid policy.
    const raw=editor.raw||{};
    if(Object.hasOwn(raw,'count')){
      const count=Number(raw.count);
      if(!/^\d+$/.test(String(raw.count))||!Number.isSafeInteger(count)||count<1)return {message:'请填写大于 0 的整数次数。',target:'retryMaxCount'};
      if(count>1000)return {message:'一次最多设置 1000 次，请减少重呼次数。',target:'retryMaxCount'};
      if(count!==policy?.rounds?.length)return {message:'请重新填写重呼次数以应用此修改。',target:'retryMaxCount'};
    }
    const keys=active==='uniform'?['uniform']:(policy?.rounds||[]).map((_,index)=>'round-'+index);
    for(const key of keys){
      if(!Object.hasOwn(raw,key))continue;
      const index=key==='uniform'?null:Number(key.slice(6)),expected=index===null?gaps(policy)[0]:retry.minutes(policy.rounds[index]);
      const unit=inputValue(expected,editor.units?.[key]).unit,total=Number(raw[key])*units[unit].factor,target=index===null?'retryEveryInterval':'retryInterval'+index;
      if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(String(raw[key]))||!Number.isSafeInteger(total)||total<1||(index===null&&policy.timeType===1&&!Number.isSafeInteger(total*policy.rounds.length)))return {message:'请填写有效间隔，换算后至少为 1 个完整分钟。',target};
      if(total!==expected)return {message:'请重新填写间隔以应用此修改。',target};
    }
    return null;
  }
  function issue(policy,type,editor={}){
    if(policy?.mode==='unset')return null;
    const active=layout(policy,editor);
    const incomplete=rawIssue(policy,editor,active);if(incomplete)return incomplete;
    const key=Object.keys(editor.errors||{}).find(key=>key==='count'||(active==='uniform'?key==='uniform':key.startsWith('round-')));
    if(key)return editor.errors[key];
    const error=retry.validate(policy,type);
    if(!error)return null;
    const round=Number(/^第 (\d+) 轮/.exec(error)?.[1]);
    const target=/号码状态|呼叫状态/.test(error)?'retryStatusPicker':![1,2].includes(policy?.timeType)?'retryTimeType':active==='uniform'?'retryEveryInterval':round>0?'retryInterval'+(round-1):'retryTimingDetails';
    return {message:error,target};
  }
  function ruleText(policy,type,editor={}){
    if(policy?.mode==='unset')return '重呼开关已关闭。';
    if(issue(policy,type,editor))return '完成重呼条件、次数和间隔后，这里会显示完整安排。';
    const names=policy.codes.map(code=>retry.numberCodes.find(row=>row.code===code)?.label).join('、')+'时，';
    const count=policy.rounds.length, uniform=layout(policy,editor)==='uniform';
    const interval=uniform?'每隔 '+retry.duration(retry.fromMinutes(gaps(policy)[0]))+' 重呼':'按下方各次时间重呼';
    return names+interval+'，最多重呼 '+count+' 次。包括首次呼叫，最多拨打 '+(count+1)+' 次。';
  }
  function intervalField(policy,editor,key,index){
    const total=index===null?gaps(policy)[0]:retry.minutes(policy.rounds[index]);
    const input=inputValue(total,editor.units?.[key]),value=Object.hasOwn(editor.raw||{},key)?editor.raw[key]:input.value;
    const id=index===null?'retryEveryInterval':'retryInterval'+index;
    const error=editor.errors?.[key];
    return `<div class="retry-amount"><input id="${id}" type="number" min="0" step="any" required aria-required="true" value="${esc(value)}" aria-label="${index===null?'统一重呼间隔':'第 '+(index+1)+' 次重呼等待时间'}" aria-describedby="${id}Error" ${error?'aria-invalid="true"':''} oninput="CloudTaskWorkspace.changeRetryInterval('${key}',this.value,document.getElementById('${id}Unit').value)"><select id="${id}Unit" aria-label="${index===null?'统一重呼间隔单位':'第 '+(index+1)+' 次重呼时间单位'}" onchange="CloudTaskWorkspace.changeRetryInterval('${key}',document.getElementById('${id}').value,this.value)">${Object.entries(units).map(([key,row])=>`<option value="${key}" ${input.unit===key?'selected':''}>${row.label}</option>`).join('')}</select></div><small class="retry-input-error" id="${id}Error" ${error?'':'hidden'}>${esc(error?.message||'')}</small>`;
  }
  function basis(policy){
    return `<label class="field retry-basis-field"><span>间隔从何时开始 <em class="retry-required" aria-hidden="true">*</em></span><select id="retryTimeType" required aria-required="true" onchange="CloudTaskWorkspace.setRetryTimeType(this.value)"><option value="" disabled ${![1,2].includes(policy.timeType)?'selected':''}>请选择起算方式</option><option value="2" ${policy.timeType===2?'selected':''}>以上一次呼叫时间为准</option><option value="1" ${policy.timeType===1?'selected':''}>从首次呼叫时间开始</option></select></label>`;
  }
  function timing(policy,editor={}){
    const custom=layout(policy,editor)==='custom';
    if(!custom)return `<div class="retry-uniform-timing"><label class="field"><span>每次间隔 <em class="retry-required" aria-hidden="true">*</em></span>${intervalField(policy,editor,'uniform',null)}</label>${basis(policy)}</div><p class="retry-basis-note">${policy.timeType===1?'从首次呼叫时间开始，按相同间隔依次安排。':'以上一次呼叫时间为准。'}</p>`;
    return `<div class="retry-custom-timing">${basis(policy)}<div class="retry-custom-rounds">${(policy.rounds||[]).map((r,index)=>`<div class="retry-custom-row"><label class="field"><span>第 ${index+1} 次重呼 <em class="retry-required" aria-hidden="true">*</em><small>${policy.timeType===1?'首次呼叫后':'上一次呼叫后'}</small></span>${intervalField(policy,editor,'round-'+index,index)}</label></div>`).join('')}</div><p class="retry-basis-note">${policy.timeType===1?'按顺序填写距离首次呼叫的时间，例如 10、20、30 分钟；时间必须递增。':'每次等待时间可以不同，例如第一次等 10 分钟，第二次等 1 小时。'}</p></div>`;
  }
  function render(policy,type,editor={}){
    if(!policy||policy.version!==1)return '<section class="retry-editor retry-simple"><h3>重呼设置</h3><p>这份草稿尚未设置重呼安排。</p><button class="btn" onclick="CloudTaskWorkspace.resetRetry()">设置重呼</button></section>';
    const p=policy,enabled=p.mode!=='unset',custom=layout(p,editor)==='custom';
    const countError=editor.errors?.count;
    const selected=(p.codes||[]).map(code=>retry.numberCodes.find(row=>row.code===code)).filter(Boolean);
    return `<section class="retry-editor retry-simple" aria-label="重呼设置">
      <div class="retry-simple-heading"><div><h3>重呼设置</h3><p id="retrySwitchHelp">开启后须选择呼叫状态，并完整填写次数、间隔和起算方式。</p></div><div class="retry-switch-control"><span id="retrySwitchLabel">启用重呼<small aria-hidden="true">${enabled?'已开启':'已关闭'}</small></span><button id="retryEnabled" type="button" role="switch" aria-checked="${enabled}" aria-labelledby="retrySwitchLabel" aria-describedby="retrySwitchHelp" onclick="CloudTaskWorkspace.setRetryMode('${enabled?'unset':'advanced'}')"><span aria-hidden="true"></span></button></div></div>
      ${enabled?`
        <div class="retry-condition-heading"><span>需要重呼的呼叫状态 <em class="retry-required" aria-hidden="true">*</em></span><span class="retry-required-hint">至少选择 1 项</span></div>
        <div class="retry-condition-control"><details id="retryStatusMenu" class="retry-condition-menu"><summary aria-label="选择重呼状态" aria-required="true"><span>${selected.length?'已选 '+selected.length+' 种号码状态':'选择需要重呼的呼叫状态'}</span><span>⌄</span></summary><div class="retry-condition-popover"><label class="retry-search"><input id="retryStatusSearch" placeholder="搜索状态名称或编码" aria-label="搜索号码状态" oninput="AliCtiRetryEditor.filterStatuses(this.value)"></label><fieldset id="retryStatusPicker" tabindex="-1" aria-describedby="retryStatusPickerError"><legend>符合以下任一状态时重呼 <em class="retry-required" aria-hidden="true">*</em><span class="retry-required-hint">至少选择 1 项</span></legend><div class="retry-condition-options">${retry.numberCodes.map(row=>`<label data-retry-search="${esc(row.code+' '+row.label)}"><input type="checkbox" value="${row.code}" aria-label="${esc(row.code+' '+row.label)}" ${(p.codes||[]).includes(row.code)?'checked':''} onchange="CloudTaskWorkspace.toggleRetryCode(${row.code},this.checked)"><span>${esc(row.label)}<small>${row.code}</small></span></label>`).join('')}</div><p id="retryStatusNoMatch" hidden>没有找到符合条件的号码状态</p><small class="wizard-field-error" id="retryStatusPickerError" hidden></small></fieldset><div class="retry-picker-footer"><span>多个状态共用下方次数与间隔</span><button class="btn btn-primary" onclick="AliCtiRetryEditor.closePicker()">完成</button></div></div></details>
        ${selected.length?`<div class="retry-selected-tags">${selected.map(row=>`<span title="${esc(row.code+' '+row.label)}"><span>${esc(row.label)}</span><button aria-label="移除 ${esc(row.label)}" onclick="CloudTaskWorkspace.toggleRetryCode(${row.code},false)">×</button></span>`).join('')}</div>`:''}</div>
        <div class="retry-main-settings"><div class="retry-count-setting"><label class="field"><span>最多重呼 <em class="retry-required" aria-hidden="true">*</em></span><div class="retry-number-stepper"><button aria-label="减少重呼次数" ${p.rounds.length<=1?'disabled':''} onclick="CloudTaskWorkspace.adjustRetryCount(-1)">−</button><input id="retryMaxCount" type="number" min="1" step="1" required aria-required="true" value="${esc(Object.hasOwn(editor.raw||{},'count')?editor.raw.count:p.rounds.length)}" aria-label="最多重呼次数" aria-describedby="retryMaxCountError" ${countError?'aria-invalid="true"':''} oninput="CloudTaskWorkspace.changeRetryCount(this.value)"><button aria-label="增加重呼次数" onclick="CloudTaskWorkspace.adjustRetryCount(1)">＋</button><span>次</span></div><small class="retry-input-error" id="retryMaxCountError" ${countError?'':'hidden'}>${esc(countError?.message||'')}</small><small class="field-hint">不含首次呼叫</small></label></div>
        <div id="retryTimingDetails" tabindex="-1">${timing(p,editor)}</div></div>
        <div class="retry-layout-row"><span>${custom?'每次可以设置不同时间':'各次使用相同间隔'}</span><button class="wizard-text-button" onclick="CloudTaskWorkspace.setRetryLayout('${custom?'uniform':'custom'}')">${custom?'改为统一间隔':'分别设置每次间隔'}</button></div>
        <div class="retry-rule-preview"><span>重呼安排</span><p id="retryRuleSummary" aria-live="polite">${esc(ruleText(p,type,editor))}</p></div>
      `:'<div class="retry-unset-note"><strong>已关闭</strong><p>开启后可选择呼叫状态，设置重呼次数与间隔。</p></div>'}
      <p id="retryValidation" class="retry-validation" role="status" hidden></p>
    </section>`;
  }
  function closePicker(){
    const menu=document.querySelector('.retry-condition-menu');if(menu){menu.open=false;menu.querySelector('summary')?.focus({preventScroll:true});}
  }
  function filterStatuses(query){
    let count=0;document.querySelectorAll('[data-retry-search]').forEach(row=>{row.hidden=!row.dataset.retrySearch.includes(query.trim());if(!row.hidden)count++;});
    const empty=document.getElementById('retryStatusNoMatch');if(empty)empty.hidden=count>0;
  }
  if(typeof document!=='undefined'){
    document.addEventListener('pointerdown',event=>{const menu=document.querySelector('.retry-condition-menu[open]');if(menu&&!menu.contains(event.target))menu.open=false;});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.retry-condition-menu[open]')){closePicker();event.preventDefault();}});
  }
  root.AliCtiRetryEditor=Object.freeze({render,timing,ruleText,issue,layout,gaps,inputValue,units,filterStatuses,closePicker});
})(typeof window==='undefined'?globalThis:window);
