/* Reviewable interface examples inside the existing demo drawer; all state is local. */
(function(root){
  'use strict';
  const ui=PlatformUI,esc=ui.escape,read=id=>document.getElementById('contract-'+id)?.value||'';
  let context='',pushes=[],lastPush=null,lastEvent=null;try{const saved=JSON.parse(sessionStorage.getItem('alicti-demo-pushes-v1')||'[]');if(Array.isArray(saved))pushes=saved;}catch(_){}
  const scope=()=>[AppState.get().accountId,AppState.get().tenantId,AppState.get().enterpriseId].join('|');
  const allowed=()=>AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&['SUPER_ADMIN','ADMIN'].includes(AppState.effectiveAccess().roleCode);
  const valid=()=>allowed()&&context===scope();
  const json=value=>'<details class="contract-result"><summary>查看请求字段与模拟响应</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(JSON.stringify(value,null,2))+'</pre></details>';
  const options=(values,selected)=>Object.entries(values).map(([value,label])=>'<option value="'+esc(value)+'"'+(String(value)===String(selected)?' selected':'')+'>'+esc(label)+'</option>').join('');
  function open(){
    if(!allowed())return showToast('请以当前云联络中心管理员身份查看','warning');
    context=scope();const state=AppState.get(),agents=AppState.scoped(CloudCallData.agents),tasks=AppState.scoped(CloudCallData.tasks).filter(t=>t.simulation&&t.demoProviderTaskId);
    ui.openLayer('alicti-contract-panel',`<div class="layer-header"><div><h2>接口演示配置</h2><p>只生成本地参数与模拟响应，不连接供应商</p></div><button aria-label="关闭接口演示配置" onclick="PlatformUI.closeLayer('alicti-contract-panel')">×</button></div><div class="layer-body">
    <div class="seat-saved"><strong>供应商账号 ID：${esc(state.enterpriseId)}</strong><span>主账号已确认：7522240</span></div><p>签名以 32 位小写 MD5 格式占位，不计算真实签名。示例资源编号独立保存为演示编号。</p>
    <details open><summary>电话登录与单次转写</summary><div class="form-grid"><label class="field"><span>当前范围坐席</span><select id="contract-agent" onchange="AliCtiContractPanel.agentChanged()">${agents.map(a=>`<option value="${esc(a.contactCenterIdentityId)}">${esc(a.userName)} · ${esc(a.cno)}</option>`).join('')}</select></label><label class="field"><span>软电话分机号</span><input id="contract-bindTel" readonly placeholder="尚未配置"><small>在坐席管理中维护，此处只读。</small></label><label class="field"><span>单次预览呼叫转写</span><select id="contract-asr" onchange="AliCtiContractPanel.transcriptionChanged()">${options({1:'允许转写',0:'本通关闭',omit:'跟随默认（不传）'},AliCtiDemo.previewAsr)}</select></label><label class="field"><span>下次拨号结果（仅一次演示）</span><select id="contract-preview-error" onchange="AliCtiAdapter.previewDemoError=this.value">${options({'':'正常受理',20025:'分机未注册',20016:'无外呼权限',20031:'黑白名单限制',20051:'超过呼叫频次',20053:'禁拨时段',20055:'无可用线路'},AliCtiAdapter.previewDemoError)}</select></label><label class="field"><span>下次上线情景</span><select id="contract-login">${options({success:'正常上线',expired:'登录材料过期','media-error':'音频连接失败'},AliCtiAdapter.scenario)}</select></label></div><div class="form-grid"><label class="field"><span>企业自动转写（演示条件）</span><select id="contract-enterpriseAsr" onchange="AliCtiContractPanel.transcriptionChanged()">${options({'':'尚未设置',1:'已开启',0:'未开启'},AliCtiDemo.transcriptionConditions(state.enterpriseId).enterpriseAutoAsr??'')}</select></label><label class="field"><span>按坐席过滤（演示条件）</span><select id="contract-filterBySeat" onchange="AliCtiContractPanel.transcriptionChanged()">${options({'':'尚未设置',1:'已启用',0:'未启用'},AliCtiDemo.transcriptionConditions(state.enterpriseId).filterBySeat??'')}</select></label><label class="field"><span>坐席转写设置</span><select id="contract-seatAsr" onchange="AliCtiContractPanel.transcriptionChanged()">${options({'':'未提供，保持不变',1:'开启',0:'关闭'},'')}</select><small>修改坐席设置须先下线。</small></label></div><p>以下规则仅适用于企业已开启自动转写、按坐席过滤的预览外呼。允许转写仍需满足时长等规则，不代表一定生成文本。</p><div id="contract-transcription-rule" class="seat-saved" role="status"></div><button class="btn" onclick="AliCtiContractPanel.savePhone()">保存电话演示配置</button><div id="contract-phone-result"></div></details>
    <details><summary>通话文本查询演示</summary><p>通话记录统一通过 RASR 查询文本；仅显示本次有效返回，机器人文本独立标识。打开一条通话记录后点击“刷新通话文本”查看以下情景。</p><label class="field"><span>下次查询结果</span><select id="contract-rasr" onchange="AliCtiDemo.rasrOutcome=this.value">${options({success:'成功：返回当前样例',empty:'成功：暂无文本',failure:'获取失败',invalid:'文本格式异常',unknown:'未知返回状态'},AliCtiDemo.rasrOutcome)}</select></label></details>
    <details><summary>技能更新结果演示</summary><p>关联多技能、等级修改与移出都提交完整技能集合。等级统一为 1–10；失败或无法识别的回执不覆盖现有关联。</p><label class="field"><span>下次技能更新响应</span><select id="contract-skill" onchange="AliCtiDemo.skillOutcome=this.value">${options({success:'成功：failCno 为 [] 字符串',failure:'失败：failCno 含当前工号',unknown:'异常：failCno 无法识别'},AliCtiDemo.skillOutcome)}</select></label></details>
    <details><summary>推送设置</summary><div class="form-grid"><label class="field"><span>设置名称（账号内唯一）</span><input id="contract-name" value="任务状态演示"></label><label class="field"><span>推送类型</span><select id="contract-type">${options({42:'42 · 预测外呼任务状态',53:'53 · 预测外呼导入号码失败',9:'9 · 坐席状态变更',11:'11 · 号码状态识别',12:'12 · 录音状态',13:'13 · ASR 结果'},42)}</select></label><label class="field"><span>目标配置方式</span><select id="contract-mode" onchange="AliCtiContractPanel.targetChanged()"><option value="direct">直接配置地址</option><option value="target">已有目标接口 ID</option></select></label></div>
    <div id="contract-direct" class="form-grid"><label class="field"><span>目标地址</span><input id="contract-url" value="https://demo.invalid/callback"></label><label class="field"><span>请求方式</span><select id="contract-method">${options({0:'POST',1:'GET'},0)}</select></label><label class="field"><span>内容类型</span><select id="contract-contentType">${options({1:'form',2:'json'},2)}</select></label><label class="field"><span>超时值（文档范围 1–10）</span><input id="contract-timeout" type="number" min="1" max="10" step="1" value="8"></label></div><label class="field" id="contract-target" hidden><span>目标接口 ID（演示）</span><input id="contract-targetUrlId" type="number" min="1" step="1" value="4481"></label><p>两种配置只提交所选的一种。保存后只记录本地模拟返回的 requestId 和 id。</p><button class="btn" onclick="AliCtiContractPanel.savePush()">模拟创建推送设置</button><div id="contract-push-result"></div></details>
    <details><summary>任务与批次状态回调</summary><p>推送设置 type=42；以下消息体 type=1 为任务、type=2 为批次，两者含义不同。只更新当前租户已创建的演示任务。</p><div class="form-grid"><label class="field"><span>演示任务</span><select id="contract-task">${tasks.map(t=>`<option value="${esc(t.taskId)}">${esc(t.name)}</option>`).join('')}</select></label><label class="field"><span>事件对象</span><select id="contract-eventType" onchange="AliCtiContractPanel.eventChanged()"><option value="1">任务状态</option><option value="2">批次状态</option></select></label><label class="field"><span>状态</span><select id="contract-status"></select></label></div><button class="btn" onclick="AliCtiContractPanel.receive()"${tasks.length?'':' disabled'}>模拟接收状态</button>${tasks.length?'':'<p>先创建一项演示任务，再回到此处。</p>'}<div id="contract-event-result"></div></details></div>`,'large');
    agentChanged();eventChanged();
  }
  function agentChanged(){const a=AppState.scoped(CloudCallData.agents).find(a=>a.contactCenterIdentityId===read('agent'));document.getElementById('contract-bindTel').value=a?AliCtiDemo.credentials(a).bindTel:'';document.getElementById('contract-seatAsr').value=[0,1].includes(AliCtiFields.code(a?.isAsr))?String(a.isAsr):'';transcriptionChanged();}
  function transcriptionChanged(){const gate=AliCtiFields.previewTranscriptionGate({callKind:'preview',enterpriseAutoAsr:read('enterpriseAsr'),filterBySeat:read('filterBySeat'),isAsr:read('seatAsr'),cdrIsAsr:read('asr')});document.getElementById('contract-transcription-rule').innerHTML='<strong>'+esc(gate.label)+'</strong><span>'+esc(gate.reason)+'</span>';return gate;}
  function savePhone(){
    if(!valid())return;const a=AppState.scoped(CloudCallData.agents).find(a=>a.contactCenterIdentityId===read('agent'));
    if(!a)return showToast('请选择当前范围内的坐席','warning');
    if(!AliCtiDemo.saveSeatAsr(a,read('seatAsr')))return;
    AliCtiDemo.previewAsr=read('asr');AliCtiDemo.setTranscriptionConditions(a.enterpriseId,{enterpriseAutoAsr:read('enterpriseAsr'),filterBySeat:read('filterBySeat')});AliCtiAdapter.scenario=read('login');
    document.getElementById('contract-phone-result').innerHTML=json({mock:true,auth:AliCtiFields.authenticateFields(a),login:AliCtiFields.loginFields(a,AliCtiDemo.credentials(a)),preview:AliCtiFields.previewFields(a,'演示被叫','演示外显',{cdrIsAsr:AliCtiDemo.previewAsr}),transcriptionGate:transcriptionChanged(),seatUpdate:AliCtiDemo.lastSeatAsr||null});showToast('电话演示配置已保存','success');
  }
  function targetChanged(){const target=read('mode')==='target';document.getElementById('contract-direct').hidden=target;document.getElementById('contract-target').hidden=!target;}
  function savePush(){
    if(!valid())return;const input=Object.fromEntries(['name','type','mode','url','method','contentType','timeout','targetUrlId'].map(k=>[k,read(k)])),request=AliCtiFields.pushFields(input);
    if(request.pending.length)return showToast(request.pending.join('；'),'warning');
    const enterpriseId=AppState.get().enterpriseId;if(pushes.some(p=>p.enterpriseId===enterpriseId&&p.name===request.fields.name))return showToast('当前供应商账号内已有同名推送设置（演示）','warning');
    const response={requestId:'DEMO-PUSH-'+Date.now(),id:900001+pushes.length};pushes.push({enterpriseId,name:request.fields.name,response});sessionStorage.setItem('alicti-demo-pushes-v1',JSON.stringify(pushes));lastPush={request,response,mock:true};
    document.getElementById('contract-push-result').innerHTML=json(lastPush);
  }
  function eventChanged(){document.getElementById('contract-status').innerHTML=options(read('eventType')==='1'?{0:'初始',1:'运行中',2:'暂停',3:'结束'}:{0:'未导入号码',1:'导入',2:'缓存中',3:'结束',4:'已冻结'},0);}
  function applyEvent(raw){
    if(!valid())return {accepted:false,reason:'当前范围已改变'};
    const event=AliCtiFields.pushState(raw),task=AppState.scoped(CloudCallData.tasks).find(t=>t.simulation&&String(t.enterpriseId)===String(event.enterpriseId)&&t.demoProviderTaskId===event.taskId);
    if(!task||event.label==='待确认')return {accepted:false,reason:'事件无唯一授权归属或状态未识别',event};
    if(event.type===1){task.providerStatusCode=event.status;task.providerStatus=event.label+'（模拟推送）';task.alictiTaskPush=event;}
    else if(event.type===2&&event.fileId){const batch=task.alictiImportResults?.find(b=>b.normalized.providerBatchId===event.fileId);if(!batch)return {accepted:false,reason:'批次不属于当前任务',event};batch.pushStatus=event;}
    else return {accepted:false,reason:'批次编号缺失',event};
    CloudTaskWorkspace.saveDemoTask(task);return {accepted:true,event,mock:true};
  }
  function receive(){
    if(!valid())return;const task=AppState.scoped(CloudCallData.tasks).find(t=>t.taskId===read('task'));if(!task?.simulation)return;
    const type=Number(read('eventType')),raw={enterpriseId:Number(task.enterpriseId),time:Date.now(),taskId:task.demoProviderTaskId,type,status:Number(read('status')),description:'本地模拟推送',...(type===1?{statusTriggerType:1}:{fileId:task.alictiImportResults?.[0]?.normalized.providerBatchId})};
    lastEvent={raw,result:applyEvent(raw),mock:true};document.getElementById('contract-event-result').innerHTML=json(lastEvent);
  }
  root.AliCtiContractPanel={open,agentChanged,transcriptionChanged,savePhone,targetChanged,savePush,eventChanged,receive,applyEvent,get lastPush(){return lastPush},get lastEvent(){return lastEvent}};
})(window);
