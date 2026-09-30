/** Tenant-owned import batches. Local prototype only; no provider dispatch. */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape,key='customer-task-batches-v1';
  let batches=[],preview=null,selectedBatch='',keyword='',status='',assignmentView='pending',businessFilter='',importRevision=0;
  const methods=['人工外呼','预外呼','IVR 外呼'];
  const sorted=(list,fallback)=>ui.sortByUpdated?.(list,fallback)||list;
  function latestTime(values){return values.reduce((latest,value)=>{const time=ui.timestamp?ui.timestamp(value):typeof value==='number'?(Math.abs(value)<1e11?value*1000:value):Date.parse(value||'');return Number.isFinite(time)&&time>latest?time:latest;},0)||null;}
  function rowUpdatedTime(row){return latestTime([ui.updatedTimestamp?.(row),row.updatedAt,row.updateTime,row.modifiedAt,...(row.history||[]).map(event=>event.at),...(row.calls||[]).flatMap(call=>[ui.updatedTimestamp?.(call),call.updatedAt,call.at,call.endedAt]),row.createdAt])||latestTime([row.batchUpdatedAt,row.batchCreatedAt]);}
  function sortRowsForDisplay(list){return sorted(list.map(row=>({...row,localUpdatedAt:rowUpdatedTime(row)})));}
  function batchUpdatedTime(batch){return latestTime([batch.updatedAt,batch.createdAt,...(batch.rows||[]).map(rowUpdatedTime)]);}
  let assignment=null,importTaskContext=null;
  function taskOptions(method,b){return CloudCallData.tasks.filter(t=>t.tenantId===b.tenantId&&t.enterpriseId===b.enterpriseId&&t.callType===method&&['待分配客户','待启动'].includes(t.status)&&!Number(t.completed));}
  const now=()=>new Date().toLocaleString('sv-SE'),id=()=>crypto.randomUUID();
  const ctx=()=>AppState.get(),manager=()=>AppState.effectiveAccess().valid&&['ADMIN','SUPER_ADMIN'].includes(AppState.effectiveAccess().roleCode);
  const valid=()=>AppState.isReady()&&AppState.effectiveAccess().valid&&ctx().activeDomain==='CLOUD_CONTACT_CENTER';
  function load(){try{const v=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(v))batches=v;}catch(_){}}
  function commit(){try{localStorage.setItem(key,JSON.stringify(batches));return true;}catch(_){load();showToast('保存失败：浏览器存储不可用，请重试','error');return false;}}
  function visible(){load();if(!valid())return [];const scoped=AppState.scoped(batches);return manager()?scoped:scoped.filter(b=>b.rows.some(r=>r.ownerId===ctx().accountId));}
  function rows(b){return manager()?b.rows:b.rows.filter(r=>r.ownerId===ctx().accountId);}
  function importTenant(){
    const source=importTaskContext||ctx();
    if(importTaskContext&&(source.accountId!==ctx().accountId||source.scopeTenantId!==ctx().tenantId||source.enterpriseId!==ctx().enterpriseId))return null;
    return AppState.scoped(CloudCallData.tenants).find(t=>t.tenantId===source.tenantId&&t.enterpriseId===source.enterpriseId&&!t.builtIn&&t.tenantId!=='ALL_IN_INSTANCE')||null;
  }
  function importBusiness(type){const tenant=importTenant(),meta=tenant&&CustomerBusiness.get(type,tenant);return meta&&meta.enabled!==false?meta:null;}
  function businessChoices(){
    const choices=new Map();
    AppState.scoped(CloudCallData.tenants).filter(t=>t.enterpriseId===ctx().enterpriseId&&!t.builtIn).forEach(tenant=>(CustomerBusiness.list?.(tenant,true)||[]).forEach(meta=>{
      if(!choices.has(meta.id))choices.set(meta.id,{id:meta.id,labels:[]});
      const row=choices.get(meta.id);if(!row.labels.includes(meta.label))row.labels.push(meta.label);
    }));
    return [...choices.values()].map(row=>[row.id,row.labels.join(' / ')]);
  }
  function find(batchId){return visible().find(b=>b.id===batchId);}
  function row(itemId){for(const b of visible()){const r=rows(b).find(r=>r.id===itemId);if(r)return {b,r};}return null;}
  function reportSnapshot(){
    load();if(!valid())return [];
    const personalCalls=manager()?[]:(window.CustomerDirectory?.list()||[]).flatMap(customer=>customer.calls||[]);
    return AppState.scoped(batches).map(b=>({...b,rows:manager()?b.rows:b.rows.filter(r=>r.ownerId===ctx().accountId||r.repeatContact&&b.createdBy===ctx().accountId||personalCalls.some(call=>call.tenantId===b.tenantId&&String(call.enterpriseId)===String(b.enterpriseId)&&call.customerTaskItemId===r.id&&call.taskId===r.taskId))})).filter(b=>b.rows.length).map(b=>structuredClone(b));
  }
  function candidates(tenantId){
    if(!valid()||!manager()||!AppState.scoped(CloudCallData.tenants).some(t=>t.tenantId===tenantId))return [];
    return CloudCallData.agents.filter(s=>s.tenantId===tenantId&&s.enterpriseId===ctx().enterpriseId&&s.lifecycleStatus!=='已删除').map(s=>{
      const a=CloudCallData.accounts.find(a=>a.accountId===s.accountId),m=CloudCallData.memberships.find(m=>m.accountId===s.accountId&&m.tenantId===tenantId);
      const reason=!a?'尚未关联中台账号':a.status!=='启用'?'关联账号已停用':!m||m.status!=='启用'?'账号未在本租户启用':!['ADMIN','OPERATOR'].includes(m.roleCode)?'关联账号不是租户管理员或租户运营':s.lifecycleStatus!=='已启用'?'坐席未启用':s.syncStatus!=='同步成功'?'坐席尚未同步成功':!s.acceptNewTasks?'坐席已停止接收新任务':'';
      const skills=CloudCallData.agentSkills.filter(r=>r.identityId===s.contactCenterIdentityId&&r.status==='已生效'&&r.syncStatus==='同步成功').map(r=>CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===r.physicalGroupId&&g.tenantId===tenantId&&g.enterpriseId===s.enterpriseId&&g.status==='已启用')?.name).filter(Boolean);
      return {seat:s,account:a,roleCode:m?.roleCode,reason,skills};
    });
  }
  function owners(tenantId){return [...new Map(candidates(tenantId).filter(c=>!c.reason).map(c=>[c.account.accountId,c.account])).values()];}
  function assigned(r){return !!(r.ownerId||r.taskId);}
  function pendingForTask(tenantId,enterpriseId){return !valid()||!manager()?[]:visible().filter(b=>b.tenantId===tenantId&&b.enterpriseId===enterpriseId).flatMap(b=>b.rows.filter(r=>!assigned(r)&&!r.activeCallId&&r.followup!=='已完成').map(r=>({...r,batchId:b.id,batchName:b.name,batchCreatedAt:b.createdAt,batchUpdatedAt:b.updatedAt,tenantId:b.tenantId,enterpriseId:b.enterpriseId})));}
  function releaseUnstartedTask(task){
    if(task?.repeatContact)return window.RepeatPredictive?.releaseTask(task)===true;
    if(!valid()||!manager())return false;const scoped=visible().filter(b=>b.tenantId===task.tenantId&&b.enterpriseId===task.enterpriseId),linked=scoped.flatMap(b=>b.rows.filter(r=>r.taskId===task.taskId));
    if(linked.some(r=>r.activeCallId||r.calls?.length||r.followup==='已完成'))return false;
    linked.forEach(r=>{(r.history||(r.history=[])).push({at:now(),action:'删除未启动任务，返回待分配',previousTask:task.taskId});r.taskId='';r.taskName='';r.ownerId='';r.method='';r.updatedAt=now();});return commit();
  }
  function validateTaskSelection(task,ids){const pool=pendingForTask(task.tenantId,task.enterpriseId);return Array.isArray(ids)&&new Set(ids).size===ids.length&&ids.every(id=>pool.some(r=>r.id===id));}
  function attachToNewTask(task,ids){
    if(!valid()||!manager()||!['预外呼','IVR 外呼'].includes(task.callType)||task.status!=='待分配客户'||Number(task.completed)||!validateTaskSelection(task,ids))return false;
    if(!ids.length)return true;
    for(const b of batches.filter(b=>b.tenantId===task.tenantId&&b.enterpriseId===task.enterpriseId))for(const r of b.rows.filter(r=>ids.includes(r.id))){r.method=task.callType;r.taskId=task.taskId;r.taskName=task.name;r.ownerId='';r.history=r.history||[];r.history.push({at:now(),action:'创建任务时分配',method:task.callType,targetId:task.taskId});r.updatedAt=now();}
    return commit();
  }
  // Serializable row snapshots let the task wizard compensate a partial local save.
  function prepareTaskAttachment(task,ids){
    if(!valid()||!manager()||!['预外呼','IVR 外呼'].includes(task.callType)||task.status!=='待分配客户'||Number(task.completed)||!validateTaskSelection(task,ids))return {ok:false};
    const changes=[];
    for(const b of batches.filter(b=>b.tenantId===task.tenantId&&b.enterpriseId===task.enterpriseId))for(const r of b.rows.filter(r=>ids.includes(r.id))){
      const before=structuredClone(r),after={...structuredClone(r),method:task.callType,taskId:task.taskId,taskName:task.name,ownerId:'',updatedAt:now()};
      after.history=[...(after.history||[]),{at:now(),action:'创建任务时分配',method:task.callType,targetId:task.taskId}];
      changes.push({batchId:b.id,batchName:b.name,rowId:r.id,before,after});
    }
    return {ok:true,taskId:task.taskId,tenantId:task.tenantId,enterpriseId:task.enterpriseId,changes};
  }
  function applyTaskAttachment(prepared,undo=false){
    if(prepared?.kind==='repeat-predictive')return undo?window.RepeatPredictive?.rollbackAttachment(prepared)===true:window.RepeatPredictive?.commitAttachment(prepared)===true;
    if(!prepared?.ok||!Array.isArray(prepared.changes)||!valid()||!manager()||!AppState.authorizeObject('',prepared))return false;
    load();const next=structuredClone(batches),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    for(const change of prepared.changes){
      const batch=next.find(b=>b.id===change.batchId&&b.tenantId===prepared.tenantId&&b.enterpriseId===prepared.enterpriseId),index=batch?.rows.findIndex(r=>r.id===change.rowId);
      if(!batch||index<0)return false;
      const current=batch.rows[index],desired=undo?change.before:change.after,expected=undo?change.after:change.before;
      if(equal(current,desired))continue;
      if(!equal(current,expected))return false;
      batch.rows[index]=structuredClone(desired);
    }
    try{localStorage.setItem(key,JSON.stringify(next));batches=next;return true;}catch(_){return false;}
  }
  function commitTaskAttachment(prepared){return applyTaskAttachment(prepared);}
  function rollbackTaskAttachment(prepared){return applyTaskAttachment(prepared,true);}
  function reassignable(r,b){return !r.activeCallId&&r.followup!=='已完成'&&(!r.taskId||taskOptions(r.method,b).some(t=>t.taskId===r.taskId));}
  function setAssignmentView(view){if(!['pending','assigned','all'].includes(view))return;assignmentView=view;navigateTo('customer-tasks',{batchId:selectedBatch});}
  function updateSelection(){
    const all=Array.from(document.querySelectorAll('[name="customer-row"]')).filter(e=>!e.disabled),chosen=all.filter(e=>e.checked);
    const control=document.getElementById('customer-select-all');if(control){control.checked=!!all.length&&chosen.length===all.length;control.indeterminate=chosen.length>0&&chosen.length<all.length;control.disabled=!all.length;}
    const count=document.getElementById('customer-selected-count');if(count)count.textContent='已选择 '+chosen.length+' 位';
    const clear=document.getElementById('customer-clear-selection');if(clear)clear.disabled=!chosen.length;
  }
  function selectAll(checked){if(!valid()||!manager()||!find(selectedBatch))return;document.querySelectorAll('[name="customer-row"]').forEach(e=>{if(!e.disabled)e.checked=!!checked;});updateSelection();}
  function outcome(r){return r.followup||'待联系';}
  function callResult(r){const call=r.calls?.at(-1);return call?CallState.view(call).answerLabel:'未呼叫';}
  function summary(rs){return '客户 '+rs.length+' · 已分配 '+rs.filter(r=>r.ownerId||r.taskId).length+' · 已联系 '+rs.filter(r=>r.calls?.length).length+' · 跟进完成 '+rs.filter(r=>r.followup==='已完成').length;}
  function parse(text){
    text=String(text||'').replace(/^\uFEFF/,'');const separator=text.split('\n')[0].includes('\t')?'\t':',';
    const result=[];let cells=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===separator||c==='\n')){cells.push(cell.trim());cell='';if(c==='\n'){if(cells.some(Boolean))result.push(cells);cells=[];}}else if(c!=='\r')cell+=c;}
    if(quoted)throw Error('引号未闭合，请检查文件格式');cells.push(cell.trim());if(cells.some(Boolean))result.push(cells);return result;
  }
  function canImportToTask(task){
    return valid()&&manager()&&!!task&&task.callType==='预外呼'&&!task.isWizardDraft&&!task.displayOnly&&task.customerSourceMode==='assigned'&&task.status==='待分配客户'&&!Number(task.total)&&!Number(task.completed)&&!task.startedAt&&!task.campaignId&&AppState.authorizeObject('task.create',task);
  }
  function importDialog(taskId){
    if(!valid()||!manager())return;
    const task=taskId?CloudCallData.tasks.find(t=>t.taskId===taskId):null;
    if(taskId&&!canImportToTask(task))return showToast('当前任务不可导入客户，请刷新任务状态','warning');
    importTaskContext=task?{taskId:task.taskId,tenantId:task.tenantId,enterpriseId:task.enterpriseId,accountId:ctx().accountId,scopeTenantId:ctx().tenantId}:null;
    const tenant=importTenant();if(!tenant)return showToast('请进入实际业务租户后导入','warning');
    preview=null;importRevision++;
    ui.openLayer('customer-import',`<div class="layer-header"><h2>导入客户名单</h2><button aria-label="关闭" onclick="PlatformUI.closeLayer('customer-import')">×</button></div>
      <div class="layer-body customer-import-body">
        <div class="customer-import-steps"><strong>1 填写名单</strong><span>→</span><span>2 检查数据</span><span>→</span><span>${task?'3 导入并加入当前任务':'3 导入后分配'}</span></div>
        ${task?`<p class="customer-import-hint">${esc(task.callType)} · 导入至任务：${esc(task.name)}</p>`:''}
        <div class="customer-import-basics"><label class="field"><span>业务类型 <em>*</em></span><select id="customer-import-business-type" onchange="CustomerTasks.importTypeChanged()"><option value="">请选择业务类型</option>${(CustomerBusiness.list(tenant)||[]).filter(meta=>meta.enabled!==false).map(meta=>'<option value="'+esc(meta.id)+'">'+esc(meta.label)+'</option>').join('')}</select></label>
        <label class="field customer-import-name"><span>批次名称 <em>*</em></span><input id="customer-batch-name" maxlength="50" placeholder="例如：9月试驾邀约" oninput="CustomerTasks.invalidatePreview()"></label></div>
        <section class="customer-import-section"><div class="customer-import-heading"><h3>准备客户名单</h3><button class="btn" onclick="CustomerTasks.fillSample()">填入示例</button></div>
          <div class="customer-import-upload"><label for="customer-import-file" class="btn">选择 CSV 文件</label><input id="customer-import-file" type="file" hidden accept=".csv,text/csv" onchange="CustomerTasks.readFile(this.files[0])"><span id="customer-import-filename">未选择文件 · UTF-8 格式，最大 1 MB</span></div>
          <div id="customer-import-schema">${importSchema('')}</div>
          <label class="field"><span>粘贴或编辑名单 ${ui.help('按上方四列顺序填写；备注为空也要保留第三列。业务编码在 Excel 中设为文本，保留前导零。可带表头，每批最多 2000 位客户，同批重复号码保留第一条有效记录。')}</span><textarea id="customer-import-text" rows="6" oninput="CustomerTasks.invalidatePreview()" placeholder="请选择业务类型后填写名单"></textarea></label>
        </section><div id="customer-import-preview" aria-live="polite"></div>
      </div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('customer-import')">取消</button><button class="btn" onclick="CustomerTasks.previewImport()">检查名单</button><button class="btn btn-primary" id="customer-import-confirm" disabled onclick="CustomerTasks.confirmImport()">确认导入</button></div>`,'large');
  }
  function importSchema(type){const meta=importBusiness(type);return '<table class="customer-import-guide"><thead><tr><th>客户称呼 <em>*</em></th><th>客户号码 <em>*</em></th><th>联系备注（选填）</th><th>'+(meta?esc(meta.codeLabel)+' <em>*</em>':'业务编码 <em>*</em>')+'</th></tr></thead><tbody><tr><td>最多40字</td><td>手机号或带区号的固定电话</td><td>本次沟通要点，最多500字</td><td>'+(meta?esc(meta.codeLabel)+'必填，文本格式，最多100字':'选择类型后显示对应字段')+'</td></tr></tbody></table>';}
  function importTypeChanged(){invalidatePreview();const type=document.getElementById('customer-import-business-type')?.value||'',meta=importBusiness(type),schema=document.getElementById('customer-import-schema'),input=document.getElementById('customer-import-text');if(schema)schema.innerHTML=importSchema(type);if(input)input.placeholder=meta?'客户称呼,客户号码,联系备注,'+meta.codeLabel:'请选择业务类型后填写名单';}
  function invalidatePreview(){preview=null;importRevision++;const box=document.getElementById('customer-import-preview'),button=document.getElementById('customer-import-confirm');if(box)box.innerHTML='';if(button)button.disabled=true;}
  function fillSample(){
    if(!valid()||!manager())return;const input=document.getElementById('customer-import-text');if(!input)return;
    if(input.value.trim())return showToast('请先清空名单，再填入示例，以免覆盖已填写内容','warning');
    const type=document.getElementById('customer-import-business-type')?.value,meta=importBusiness(type);if(!meta)return showToast('请先选择已启用的业务类型','warning');
    const sample=window.CustomerImportSamples?.[type]||{name:meta.label+'示例名单',rows:[1,2,3].map((n)=>({name:'示例客户'+n,phone:'1380000000'+n,note:n===1?'预约联系':'',externalDocumentId:(meta.prefix||type)+'-00'+n}))};
    const csv=value=>{const text=String(value??'');return /[,"\r\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;};
    input.value=['客户称呼','客户号码','联系备注',meta.codeLabel].map(csv).join(',')+'\n'+sample.rows.map(r=>[r.name,r.phone,r.note,r.externalDocumentId].map(csv).join(',')).join('\n');
    const name=document.getElementById('customer-batch-name');if(name&&!name.value.trim())name.value=sample.name;invalidatePreview();showToast('已填入 '+sample.rows.length+' 位示例客户','success');
  }
  async function readFile(file){if(!file)return;const scope=[ctx().tenantId,ctx().enterpriseId,ctx().accountId].join('|'),revision=++importRevision,el=document.getElementById('customer-import-text');if(file.size>1024*1024)return showToast('文件不能超过1MB','error');if(!/\.csv$/i.test(file.name))return showToast('请将Excel另存为CSV后导入','error');try{const text=await file.text();if(scope!==[ctx().tenantId,ctx().enterpriseId,ctx().accountId].join('|')||!valid()||!manager()||revision!==importRevision||el!==document.getElementById('customer-import-text'))return;if(el)el.value=text;const label=document.getElementById('customer-import-filename');if(label)label.textContent=file.name;invalidatePreview();}catch(_){showToast('文件读取失败，请重新选择','error');}}
  function prepare(name,text,businessType=''){
    if(!valid()||!manager())throw Error('没有导入权限');const tenant=importTenant();if(!tenant)throw Error('请进入实际业务租户后导入');
    const meta=importBusiness(businessType);if(!meta)throw Error('请选择已启用的业务类型');
    if(!name.trim()||name.trim().length>50)throw Error('请填写50字以内的批次名称');const list=parse(text);if(!list.length||list.length>2001)throw Error('每次导入1至2000位客户');
    if(['客户称呼','客户姓名','姓名'].includes(list[0][0])){const header=list.shift();if(meta&&header[3]&&![meta.codeLabel,'外部单据标识'].includes(header[3]))throw Error('当前为'+meta.label+'，第四列表头应为“'+meta.codeLabel+'”，请检查名单或业务类型');}if(!list.length||list.length>2000)throw Error('每次导入1至2000位客户');const seen=new Set(),good=[],errors=[];
    list.forEach((c,i)=>{const phone=(c[1]||'').replace(/[\s-]/g,'');let e='';if(!c[0]||c[0].length>40)e='称呼必填且不超过40字';else if(!/^(1[3-9]\d{9}|0\d{9,11})$/.test(phone))e='客户号码格式不正确';else if(c.length>4)e='最多四列：客户称呼、客户号码、联系备注、'+(meta?.codeLabel||'外部单据标识');else if(String(c[2]||'').length>500)e='备注不超过500字';else if(meta&&!c[3])e=meta.codeLabel+'必填';else if(meta&&c[3].length>100)e=meta.codeLabel+'不超过100字';else if(seen.has(phone))e='同批号码重复';if(e)errors.push({line:i+1,phone,reason:e});else{seen.add(phone);good.push({name:c[0],phone,note:c[2]||'',externalDocumentId:c[3]||'',businessType:meta?businessType:''});}});
    return {name:name.trim(),text,businessType:meta?businessType:'',tenantId:tenant.tenantId,enterpriseId:tenant.enterpriseId,accountId:ctx().accountId,codeLabel:meta.codeLabel,good,errors};
  }
  function previewImport(){invalidatePreview();try{const type=document.getElementById('customer-import-business-type')?.value;if(!importBusiness(type))throw Error('请先选择已启用的业务类型');preview=prepare(document.getElementById('customer-batch-name').value,document.getElementById('customer-import-text').value,type);document.getElementById('customer-import-preview').innerHTML='<p>'+esc(CustomerBusiness.typeLabel(preview))+' · 可导入 '+preview.good.length+' 位，未通过 '+preview.errors.length+' 行。确认后仅导入有效行。</p>'+(preview.good.length?'<h3>有效名单预览（最多展示前10位）</h3>'+ui.table([{key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'note',label:'联系备注'},{key:'externalDocumentId',label:CustomerBusiness.codeLabel(preview),render:v=>esc(v||'—')}],preview.good.slice(0,10)):'')+(preview.errors.length?ui.table([{key:'line',label:'行'},{key:'phone',label:'号码'},{key:'reason',label:'未通过原因'}],preview.errors.slice(0,30)):'');document.getElementById('customer-import-confirm').disabled=!preview.good.length;}catch(e){preview=null;showToast(e.message,'error');}}
  function confirmImport(){
    if(!preview||!valid()||!manager()||preview.tenantId!==(importTaskContext?.tenantId||ctx().tenantId)||preview.enterpriseId!==ctx().enterpriseId||preview.accountId!==ctx().accountId)return showToast('工作范围已改变，请重新检查名单','error');
    if(document.getElementById('customer-batch-name')?.value.trim()!==preview.name||document.getElementById('customer-import-text')?.value!==preview.text||document.getElementById('customer-import-business-type')?.value!==preview.businessType||!importBusiness(preview.businessType)||importBusiness(preview.businessType).codeLabel!==preview.codeLabel)return showToast('名单或业务类型已修改，请重新检查','warning');
    const task=importTaskContext?CloudCallData.tasks.find(t=>t.taskId===importTaskContext.taskId):null;
    if(importTaskContext&&(!canImportToTask(task)||task.tenantId!==importTaskContext.tenantId||task.enterpriseId!==importTaskContext.enterpriseId||ctx().accountId!==importTaskContext.accountId||ctx().tenantId!==importTaskContext.scopeTenantId))return showToast('任务状态或工作范围已改变，请重新打开导入','warning');
    load();const b={id:id(),name:preview.name,businessType:preview.businessType,tenantId:preview.tenantId,enterpriseId:preview.enterpriseId,createdAt:now(),createdBy:ctx().accountId,errors:preview.errors,rows:preview.good.map(c=>({...c,id:id(),ownerId:'',method:'',followup:'待联系',calls:[],history:[]}))};if(task)b.rows.forEach(r=>{r.method=task.callType;r.taskId=task.taskId;r.taskName=task.name;r.history.push({at:now(),action:'从任务导入并分配',method:task.callType,targetId:task.taskId});});
    if(task){const saved=window.CloudTaskWorkspace.commitDirectImport(task,b);if(!saved.ok)return showToast(saved.message,'error');}
    else if(!commitImportBatch(b))return showToast('导入未保存，填写内容已保留，请检查存储后重试','error');
    window.CustomerDirectory?.sync();preview=null;importTaskContext=null;ui.closeLayer('customer-import');
    if(task){window.CloudTaskWorkspace.openTask(task.taskId,'customers');showToast('已导入 '+b.rows.length+' 位客户并加入当前任务，任务待启动','success');}
    else {open(b.id);showToast('已导入 '+b.rows.length+' 位客户','success');}
  }
  // Import transactions change only their own batch, never a cached full list.
  function commitImportBatch(batch) {
    if(!valid()||!manager()||!batch?.id||!AppState.authorizeObject('',batch))return false;
    try {
      const raw=localStorage.getItem(key),current=JSON.parse(raw||'[]');if(!Array.isArray(current))return false;
      const existing=current.find(row=>row.id===batch.id);
      if(existing)return JSON.stringify(existing)===JSON.stringify(batch);
      if(localStorage.getItem(key)!==raw)return false;
      const next=[structuredClone(batch),...current];localStorage.setItem(key,JSON.stringify(next));batches=next;return true;
    }catch(_){return false;}
  }
  function rollbackImportBatch(batch) {
    if(!batch?.id)return false;
    try {
      const raw=localStorage.getItem(key),current=JSON.parse(raw||'[]');if(!Array.isArray(current))return false;
      const existing=current.find(row=>row.id===batch.id);if(!existing)return true;
      if(JSON.stringify(existing)!==JSON.stringify(batch)||localStorage.getItem(key)!==raw)return false;
      const next=current.filter(row=>row.id!==batch.id);localStorage.setItem(key,JSON.stringify(next));batches=next;return true;
    }catch(_){return false;}
  }
  function missingTaskRecoverable(r,b) {
    if(!valid()||!manager()||!r?.taskId||r.activeCallId||r.calls?.length||r.followup==='已完成')return false;
    const directoryStatus=window.CustomerDirectory?.status?.();
    if(directoryStatus?.storageIssue||directoryStatus?.conflictingCallIds?.length)return false;
    try {
      if(window.CloudTaskWorkspace?.taskStorageStatus?.())return false;
      const stored=window.CloudTaskWorkspace?.storedTasks?.()||[];
      if([...CloudCallData.tasks,...stored].some(task=>task.taskId===r.taskId&&task.tenantId===b.tenantId&&task.enterpriseId===b.enterpriseId&&task.status!=='已删除'))return false;
      return !(CloudCallData.calls||[]).some(call=>call.tenantId===b.tenantId&&call.enterpriseId===b.enterpriseId&&(call.customerTaskItemId===r.id||call.taskId===r.taskId));
    }catch(_){return false;}
  }
  function recoverMissingTask(itemId,confirmed=false) {
    window.CustomerDirectory?.sync();window.CloudTaskWorkspace?.refreshStoredTasks?.();
    const item=row(itemId);if(!item||!missingTaskRecoverable(item.r,item.b))return showToast('任务或客户状态已变化，无法恢复分配，请刷新后核对','warning');
    if(!confirmed)return ui.confirm({id:'customer-recover-task',title:'恢复到待分配',body:'<p>当前浏览器未找到原任务“'+esc(item.r.taskName||item.r.taskId)+'”，该客户尚无通话或处理中记录。确认解除旧任务关联，将客户恢复为待分配？原任务编号会保留在分配历史中。</p>',confirmText:'恢复待分配',onConfirm(){recoverMissingTask(itemId,true);}});
    const r=item.r;r.history=r.history||[];r.history.push({at:now(),action:'原任务记录缺失，手动恢复待分配',previousTask:r.taskId,previousTaskName:r.taskName||''});
    r.taskId='';r.taskName='';r.method='';r.ownerId='';r.updatedAt=now();
    if(!commit())return false;
    ui.closeLayer('customer-recover-task');open(item.b.id);showToast('客户已恢复待分配，原任务编号保留在分配历史中','success');return true;
  }
  function assign(itemIds,method,ownerId){
    if(!valid()||!manager()||!methods.includes(method))return false;load();const b=find(selectedBatch);if(!b)return false;
    const task=method!=='人工外呼'?taskOptions(method,b).find(t=>t.taskId===ownerId):null;
    if(method==='人工外呼'?!owners(b.tenantId).some(a=>a.accountId===ownerId):!task)return false;
    const chosen=b.rows.filter(r=>itemIds.includes(r.id));if(!chosen.length||chosen.length!==new Set(itemIds).size||chosen.some(r=>r.activeCallId||r.followup==='已完成'))return false;
    if(chosen.some(r=>r.taskId&&!taskOptions(r.method,b).some(t=>t.taskId===r.taskId)))return false;
    chosen.forEach(r=>{r.history.push({at:now(),action:'分配',method,targetId:ownerId,previousOwner:r.ownerId,previousTask:r.taskId||''});r.method=method;r.ownerId=task?'':ownerId;r.taskId=task?.taskId||'';r.taskName=task?.name||'';r.updatedAt=now();});if(!commit())return false;window.CloudTaskWorkspace?.syncAssignedCustomers();return true;
  }
  function assignSelected(itemId){
    const ids=typeof itemId==='string'?[itemId]:Array.from(document.querySelectorAll('[name="customer-row"]:checked')).map(e=>e.value),b=find(selectedBatch);
    if(!manager()||!b)return;if(!ids.length)return showToast('请先勾选需要分配的客户','warning');
    if(ids.some(id=>!b.rows.some(r=>r.id===id&&reassignable(r,b)&&(!assigned(r)||typeof itemId==='string'))))return showToast('客户状态已变化，请刷新后重新选择','warning');
    assignment={ids,batchId:b.id,tenantId:ctx().tenantId,accountId:ctx().accountId};
    ui.openLayer('customer-assign',`<div class="layer-header"><h2>分配客户</h2><button onclick="PlatformUI.closeLayer('customer-assign')">×</button></div><div class="layer-body customer-import-body"><strong>已选择 ${ids.length} 位客户</strong><label class="field"><span>外呼方式 *</span><select id="customer-method" onchange="CustomerTasks.assignmentTarget()"><option value="">请选择外呼方式</option>${methods.map(m=>'<option value="'+esc(m)+'">'+esc(ui.callTypeLabel(m))+'</option>').join('')}</select></label><div id="customer-assignment-target">选择外呼方式后，设置坐席或外呼任务。</div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('customer-assign')">取消</button><button class="btn btn-primary" onclick="CustomerTasks.confirmAssignment()">确认分配</button></div>`,'small');
  }
  function assignmentTarget(){
    const b=find(assignment?.batchId),method=document.getElementById('customer-method')?.value,box=document.getElementById('customer-assignment-target');if(!b||!box)return;
    if(!method){box.textContent='请选择外呼方式';return;}
    const manual=method==='人工外呼',options=manual?candidates(b.tenantId).filter(c=>!c.reason).map(c=>({id:c.account.accountId,name:c.seat.userName+' · '+(c.roleCode==='ADMIN'?'租户管理员':'租户运营')+(c.seat.userName===c.account.name?'':' · 账号：'+c.account.name)})):taskOptions(method,b).map(t=>({id:t.taskId,name:t.name}));
    box.innerHTML='<label class="field"><span>'+ (manual?'分配坐席':'外呼任务')+' *</span><select id="customer-target"><option value="">请选择'+(manual?'坐席':'任务')+'</option>'+options.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join('')+'</select></label>'+(!options.length?'<p>暂无可选'+(manual?'坐席，请先在账号管理为租户管理员或运营关联有效坐席。':'任务，请先在对应外呼页面创建并保存任务配置。')+'</p>':'')+(manual&&candidates(b.tenantId).some(c=>c.reason)?'<button class="btn-link" onclick="CustomerTasks.candidateDetails()">查看不可选坐席</button>':'');
  }
  function candidateDetails(){
    const b=find(assignment?.batchId);if(!b||!manager())return;
    ui.openLayer('customer-candidates','<div class="layer-header"><h2>坐席可分配情况</h2><button aria-label="关闭" onclick="PlatformUI.closeLayer(\'customer-candidates\')">×</button></div><div class="layer-body">'+ui.table([{key:'seat',label:'坐席',render:s=>esc(s.userName)},{key:'account',label:'关联账号',render:a=>esc(a?.name||'未关联')},{key:'skills',label:'生效技能',render:s=>esc(s.join('、')||'暂无')},{key:'reason',label:'分配状态',render:r=>r?esc(r):ui.status('可分配')}],sorted(candidates(b.tenantId),['seat.updatedAt','seat.createTime','account.updatedAt']))+'</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'customer-candidates\')">关闭</button></div>','large');
  }
  function confirmAssignment(){if(!assignment||assignment.accountId!==ctx().accountId||assignment.tenantId!==ctx().tenantId||assignment.batchId!==selectedBatch)return showToast('工作范围已变化，请重新选择客户','warning');if(!assign(assignment.ids,document.getElementById('customer-method')?.value,document.getElementById('customer-target')?.value))return showToast('请选择有效分配对象；已开始或完成的客户不能重新分配','warning');assignment=null;ui.closeLayer('customer-assign');open(selectedBatch);showToast('分配已保存','success');}
  function taskExecutionCustomers(task){
    if(!valid()||!task?.taskId||!AppState.authorizeObject('task.create',task)||!CloudCallData.tasks.some(t=>t.taskId===task.taskId&&t.tenantId===task.tenantId&&t.enterpriseId===task.enterpriseId))return null;
    load();return AppState.scoped(batches).filter(b=>b.tenantId===task.tenantId&&b.enterpriseId===task.enterpriseId).flatMap(b=>b.rows.filter(r=>r.taskId===task.taskId).map(r=>({...r,batchId:b.id,batchName:b.name,batchCreatedAt:b.createdAt,batchUpdatedAt:b.updatedAt,tenantId:b.tenantId,enterpriseId:b.enterpriseId,repeatCreatedBy:b.createdBy})));
  }
  function taskCustomers(task){return (taskExecutionCustomers(task)||[]).filter(r=>manager()||r.ownerId===ctx().accountId||r.repeatContact&&r.repeatCreatedBy===ctx().accountId);}
  function open(batchId){
    const target=batchId||'', current=RouteRuntime.snapshot();
    if(current?.key==='customer-tasks'&&(current.options?.batchId||'')===target)return navigateTo('customer-tasks',{batchId:target});
    return RouteRuntime.openSecondary('customer-tasks',{batchId:target,refreshOnClose:true});
  }
  function render(options){
    if(!valid())return ui.empty('请进入云联络中心');if(!options?.preserveFilters||Object.hasOwn(options||{},'batchId')){const requested=options?.batchId||'';if(requested!==selectedBatch){keyword='';status='';assignmentView='pending';}selectedBatch=requested;}
    const b=find(selectedBatch);if(b)return detail(b);
    const bs=sorted(visible().filter(b=>(!keyword||b.name.includes(keyword))&&(!businessFilter||(b.businessType||'legacy')===businessFilter)).map(b=>({...b,localUpdatedAt:batchUpdatedTime(b)}))); return '<section class="platform-page customer-task-page">'+ui.pageHeader('导入与分配',manager()?'导入客户名单，分配工作，按批次查看联系进度。':'查看分配给我的客户及跟进进度。')+'<div class="filter-panel"><label class="field">批次名称<input id="customer-search" value="'+esc(keyword)+'" placeholder="请输入批次名称"></label><label class="field">业务类型<select id="customer-business-filter"><option value="">全部类型</option>'+[...businessChoices(),['legacy','未分类']].map(([v,t])=>'<option value="'+esc(v)+'"'+(businessFilter===v?' selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label><button class="btn btn-primary" onclick="CustomerTasks.query()">查询</button><button class="btn" onclick="CustomerTasks.reset()">重置</button></div><article class="panel-card"><div class="panel-header"><h2>导入批次</h2>'+(manager()?'<button class="btn btn-primary" onclick="CustomerTasks.importDialog()">导入客户</button>':'')+'</div>'+ui.table([{key:'name',label:'批次名称'},{key:'businessType',label:'业务类型',render:(_,b)=>esc(CustomerBusiness.typeLabel(b))},{key:'createdAt',label:'导入时间'},{key:'id',label:'联系进度',render:(_,b)=>esc(summary(rows(b)))},{key:'id',label:'操作',render:id=>'<button class="btn-link" onclick="CustomerTasks.open(\''+id+'\')">查看客户</button>'}],bs,{emptyText:manager()?'尚未导入名单，请先导入客户':'暂无分配给我的客户名单'})+'</article></section>';
  }
  function detail(b){
    const rs=sortRowsForDisplay(rows(b).filter(r=>(!manager()||assignmentView==='all'||(assignmentView==='assigned'?assigned(r):!assigned(r)))&&(!keyword||(r.name+r.phone+(r.externalDocumentId||'')).includes(keyword))&&(!status||outcome(r)===status)).map(r=>({...r,batchCreatedAt:b.createdAt,batchUpdatedAt:b.updatedAt})));
    const showAssignment=!manager()||assignmentView!=='pending'||rs.some(r=>r.method||assigned(r));
    return '<section class="platform-page customer-task-page">'+ui.pageHeader(b.name,CustomerBusiness.typeLabel(b)+' · '+summary(rows(b)),'<button class="btn" onclick="RouteRuntime.openSecondary(\'customer-directory\')">客户档案</button> <button class="btn" onclick="RouteRuntime.back({fallback:\'customer-tasks\'})">返回</button>')+(manager()?'<div class="customer-status-tabs" role="group" aria-label="客户分配状态">'+[['pending','待分配'],['assigned','已分配'],['all','全部客户']].map(([v,label])=>'<button class="btn '+(assignmentView===v?'btn-primary':'')+'" aria-pressed="'+(assignmentView===v)+'" onclick="CustomerTasks.setAssignmentView(\''+v+'\')">'+label+' · '+rows(b).filter(r=>v==='all'||(v==='assigned'?assigned(r):!assigned(r))).length+'</button>').join('')+'</div>':'')+'<div class="filter-panel"><label class="field">客户<input id="customer-search" value="'+esc(keyword)+'" placeholder="称呼、号码或单据标识"></label><label class="field">跟进状态<select id="customer-status"><option value="">全部</option>'+['待联系','待继续跟进','已完成'].map(s=>'<option'+(s===status?' selected':'')+'>'+s+'</option>').join('')+'</select></label><button class="btn btn-primary" onclick="CustomerTasks.query()">查询</button><button class="btn" onclick="CustomerTasks.reset()">重置</button></div><article class="panel-card"><div class="panel-header"><h2>客户名单</h2></div>'+(manager()&&assignmentView!=='assigned'?'<div class="customer-assignment-toolbar"><button class="btn btn-primary" onclick="CustomerTasks.assignSelected()">分配客户</button><span id="customer-selected-count" class="customer-selected-count" aria-live="polite">已选择 0 位</span><button id="customer-clear-selection" class="btn-link" disabled onclick="CustomerTasks.selectAll(false)">取消选择</button></div>':'')+ui.table([
      ...(manager()&&assignmentView!=='assigned'?[{key:'id',label:'选择',width:'70px',headerRender:()=>'<label class="customer-select-label"><input id="customer-select-all" type="checkbox" aria-label="全选当前筛选下可分配客户" onchange="CustomerTasks.selectAll(this.checked)"'+(!rs.some(r=>!assigned(r)&&reassignable(r,b))?' disabled':'')+'> 全选</label>',render:(_,r)=>'<input type="checkbox" name="customer-row" onchange="CustomerTasks.updateSelection()" value="'+r.id+'" aria-label="选择'+esc(r.name)+'"'+(assigned(r)||!reassignable(r,b)?' disabled':'')+'>'}]:[]),
      {key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'externalDocumentId',label:CustomerBusiness.codeLabel(b),render:v=>esc(v||'—')},...(showAssignment?[{key:'method',label:'外呼方式',render:m=>esc(ui.callTypeLabel(m)||'待分配')},{key:'ownerId',label:'分配对象',render:(v,r)=>esc(r.taskId?(r.taskName||r.taskId):(CloudCallData.accounts.find(a=>a.accountId===v)?.name||'待分配'))}]:[]),{key:'id',label:'本批次最近通话',render:(_,r)=>esc(callResult(r))},{key:'id',label:'跟进状态',render:(_,r)=>esc(outcome(r))},{key:'id',label:'操作',render:(_,r)=>'<button class="btn-link" onclick="CustomerTasks.history(\''+r.id+'\')">客户档案</button>'+(manager()&&assigned(r)&&reassignable(r,b)?' <button class="btn-link" onclick="CustomerTasks.assignSelected(\''+r.id+'\')">重新分配</button>':'')+(missingTaskRecoverable(r,b)?' <button class="btn-link" onclick="CustomerTasks.recoverMissingTask(\''+r.id+'\')">原任务缺失 · 恢复待分配</button>':'')+(canCall(r)?' <button class="btn-link" onclick="CustomerTasks.pick(\''+r.id+'\')">联系客户</button>':'')+(r.method&&r.method!=='人工外呼'&&!r.taskId?'<span> 需重新分配任务</span>':'')}
    ],rs,{emptyText:manager()&&assignmentView==='pending'?'暂无待分配客户；可切换已分配查看跟进进度':'暂无符合条件的客户'})+'</article>'+(manager()&&b.errors?.length?'<details class="technical-details"><summary>导入未通过记录 · '+b.errors.length+' 行</summary>'+ui.table([{key:'line',label:'行'},{key:'phone',label:'号码'},{key:'reason',label:'原因'}],b.errors)+'</details>':'')+'</section>';
  }
  function canCall(r){return valid()&&r.ownerId===ctx().accountId&&r.method==='人工外呼'&&r.followup!=='已完成'&&!r.activeCallId;}
  function mine(){return visible().flatMap(b=>rows(b).filter(r=>canCall(r)).map(r=>({...r,batchId:b.id,batchName:b.name,batchCreatedAt:b.createdAt,batchUpdatedAt:b.updatedAt,tenantId:b.tenantId,enterpriseId:b.enterpriseId})));}
  function pick(itemId){const item=row(itemId);if(!item||!canCall(item.r))return showToast('该客户已不可联系或不属于当前账号','warning');AgentWorkbench.selectAssigned(item.r);}
  function claim(itemId,call){const item=row(itemId);if(!item||!canCall(item.r))return false;item.r.activeCallId=call.callId;item.r.updatedAt=now();return commit();}
  // A routed predictive call identifies a task row; it does not grant ownership of its batch.
  function receivingItem(taskId,itemId,agent){
    if(!valid()||!taskId||!itemId||!agent?.contactCenterIdentityId)return null;
    const context=ctx(),seats=CloudCallData.agents.filter(a=>a.contactCenterIdentityId===agent.contactCenterIdentityId&&a.accountId===context.accountId&&a.tenantId===context.tenantId&&a.enterpriseId===context.enterpriseId);
    if(seats.length!==1||agent.accountId!==context.accountId||agent.tenantId!==context.tenantId||agent.enterpriseId!==context.enterpriseId)return null;
    const tasks=CloudCallData.tasks.filter(t=>t.taskId===taskId&&t.callType==='预外呼'&&t.tenantId===context.tenantId&&t.enterpriseId===context.enterpriseId);
    if(tasks.length!==1)return null;
    let saved;try{saved=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(saved))return null;}catch(_){return null;}
    const matches=saved.filter(b=>b.tenantId===context.tenantId&&b.enterpriseId===context.enterpriseId).flatMap(batch=>batch.rows.filter(item=>item.id===itemId&&item.taskId===taskId&&item.method==='预外呼'&&!item.ownerId).map(item=>({task:tasks[0],batch,item})));
    if(matches.length!==1)return null;
    const match=matches[0];return structuredClone({...match,batch:{...match.batch,rows:[match.item]}});
  }
  function callSnapshot(call,remark){return {callId:call.callId,...CustomerBusiness.snapshot(call),...(window.RepeatPredictive?.callMetadata(call)||{}),result:call.result,at:call.endedAt,agentName:call.agentName,disposition:call.agentDisposition||'',remark:remark===undefined?call.dispositionRemark||'':remark,...(call.telephony?{telephony:structuredClone(call.telephony)}:{}),...(call.workbenchKind==='predictive'?{callSource:call.callSource,workbenchKind:call.workbenchKind,taskId:call.taskId,customerTaskItemId:call.customerTaskItemId,accountId:call.accountId,contactCenterIdentityId:call.contactCenterIdentityId,tenantId:call.tenantId,enterpriseId:call.enterpriseId,callee:call.callee,agentAnswerResult:call.agentAnswerResult,agentAnsweredAt:call.agentAnsweredAt}:{})};}
  function acceptTaskDemoResult(task,call){
    if(!valid()||!manager()||!call.simulation||task.status!=='执行中'||call.taskId!==task.taskId)return false;
    const item=row(call.customerTaskItemId);if(!item||item.b.tenantId!==task.tenantId||item.b.enterpriseId!==task.enterpriseId||item.r.taskId!==task.taskId||item.r.activeCallId)return false;
    if(item.r.calls.some(c=>c.callId===call.callId))return true;
    item.r.calls.push(callSnapshot(call,'本地任务演示'));
    const answered=CallState.view(call).answered===true;
    item.r.followup=answered&&call.agentDisposition!=='需要再次联系'&&(task.callType!=='预外呼'||window.CloudReportMetrics?.humanAnswer(call)===true)?'已完成':'待继续跟进';item.r.updatedAt=now();return commit();
  }
  function syncCall(call){
    if(!call.customerTaskItemId)return call.workbenchKind!=='predictive';load();
    const b=batches.find(b=>b.tenantId===call.tenantId&&b.enterpriseId===call.enterpriseId&&b.rows.some(r=>r.id===call.customerTaskItemId)),r=b?.rows.find(r=>r.id===call.customerTaskItemId);
    if(!r)return false;const beforeRow=JSON.stringify(r),i=r.calls.findIndex(c=>c.callId===call.callId),active=r.activeCallId===call.callId;
    let receiving=false;
    if(call.workbenchKind==='predictive'){
      const agent=CloudCallData.agents.find(a=>a.contactCenterIdentityId===call.contactCenterIdentityId&&a.tenantId===call.tenantId&&a.enterpriseId===call.enterpriseId),linked=receivingItem(call.taskId,call.customerTaskItemId,agent);
      if(!linked||linked.batch.id!==b.id||!call.callId||call.callSource!=='NATIVE_WORKBENCH'||call.simulation!==true||call.callType!=='预外呼'||call.direction!=='呼出'||call.accountId!==ctx().accountId||call.tenantId!==ctx().tenantId||call.enterpriseId!==ctx().enterpriseId||call.callee!==linked.item.phone||(call.agentIdentityId&&call.agentIdentityId!==agent.contactCenterIdentityId))return false;
      if(Object.entries(CustomerBusiness.snapshot({...linked.item,tenantId:linked.batch.tenantId,enterpriseId:linked.batch.enterpriseId})).some(([field,value])=>CustomerBusiness.snapshot(call)[field]!==value))return false;
      if(i>=0&&['callSource','workbenchKind','taskId','customerTaskItemId','accountId','contactCenterIdentityId','tenantId','enterpriseId','callee'].some(field=>r.calls[i][field]!==call[field]))return false;
      if(i<0&&(r.activeCallId||r.followup==='已完成'))return false;
      receiving=true;
    }
    if(!active&&i<0&&!receiving)return false;
    const snapshot=callSnapshot(call);if(i<0)r.calls.push(snapshot);else r.calls[i]=snapshot;
    if(receiving&&i<0&&call.processingStatus!=='已完成')r.activeCallId=call.callId;
    // Late telephony calibration updates this call's snapshot, never a newer call or saved business follow-up.
    if((active||receiving&&i<0)&&call.processingStatus==='已完成'){
      const receivedAnswer=call.agentAnswerResult==='已接听'||(window.CloudReportMetrics?.timestamp(call.agentAnsweredAt)>0);
      r.followup=call.agentDisposition==='需要再次联系'||receiving&&!receivedAnswer?'待继续跟进':'已完成';r.activeCallId='';
    }
    if(JSON.stringify(r)!==beforeRow)r.updatedAt=now();return commit();
  }
  function history(itemId){const item=row(itemId);if(!item)return;window.CustomerDirectory?.open(item.r.phone,item.b.tenantId,item.b.enterpriseId);}
  function sidebar(selectedId){const list=sortRowsForDisplay(mine());return '<aside class="seat-sidebar"><article class="panel-card"><div class="panel-header"><h2>分配给我的客户 · '+list.length+'</h2><button class="btn-link" onclick="CustomerTasks.open()">导入与分配</button></div><div class="seat-recent">'+(list.map(r=>'<button class="seat-recent-row" onclick="CustomerTasks.pick(\''+r.id+'\')"><span><strong>'+esc(r.name)+(r.id===selectedId?' · 已选择':'')+'</strong><small>'+esc(r.phone)+'</small><small>'+esc(r.batchName)+'</small></span><span>'+esc(r.followup)+'</span></button>').join('')||'<div class="seat-empty-recent">暂无其他待联系客户</div>')+'</div></article></aside>';}
  window.CustomerTasks={canImportToTask,render,open,owners,prepare,importDialog,readFile,previewImport,confirmImport,assign,assignSelected,canCall,mine,pick,row,claim,syncCall,history,sidebar,query(){businessFilter=document.getElementById('customer-business-filter')?.value||'';keyword=document.getElementById('customer-search')?.value.trim()||'';status=document.getElementById('customer-status')?.value||'';navigateTo('customer-tasks',{batchId:selectedBatch});},reset(){keyword='';status='';businessFilter='';navigateTo('customer-tasks',{batchId:selectedBatch});}};
  Object.assign(window.CustomerTasks,{selectAll,updateSelection,releaseUnstartedTask,pendingForTask,validateTaskSelection,attachToNewTask,candidateDetails,setAssignmentView,candidates,fillSample,invalidatePreview,importTypeChanged,assignmentTarget,confirmAssignment,taskOptions,taskCustomers,acceptTaskDemoResult});
  Object.assign(window.CustomerTasks,{reportSnapshot,receivingItem,taskExecutionCustomers,rowUpdatedTime,sortRowsForDisplay});
  Object.assign(window.CustomerTasks,{prepareTaskAttachment,commitTaskAttachment,rollbackTaskAttachment,commitImportBatch,rollbackImportBatch,missingTaskRecoverable,recoverMissingTask});
  Pages['customer-tasks']={render,
    captureNavigationState(){return {selectedBatch,keyword,status,assignmentView,businessFilter,assignment};},
    restoreNavigationState(state){if(state)({selectedBatch,keyword,status,assignmentView,businessFilter,assignment}=state);}
  };
})();
