/** Tenant-owned import batches. Local prototype only; no provider dispatch. */
(function(){
  'use strict';
  const ui=PlatformUI,esc=ui.escape,key='customer-task-batches-v1';
  let batches=[],preview=null,selectedBatch='',keyword='',status='',assignmentView='pending';
  const methods=['人工外呼','预外呼','IVR 外呼'];
  let assignment=null;
  function taskOptions(method,b){return CloudCallData.tasks.filter(t=>t.tenantId===b.tenantId&&t.instanceId===b.instanceId&&t.callType===method&&['待分配客户','待启动'].includes(t.status)&&!Number(t.completed));}
  const now=()=>new Date().toLocaleString('sv-SE'),id=()=>crypto.randomUUID();
  const ctx=()=>AppState.get(),manager=()=>AppState.effectiveAccess().valid&&['ADMIN','SUPER_ADMIN'].includes(AppState.effectiveAccess().roleCode);
  const valid=()=>AppState.isReady()&&AppState.effectiveAccess().valid&&ctx().activeDomain==='CLOUD_CONTACT_CENTER';
  function load(){try{const v=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(v))batches=v;}catch(_){}}
  function commit(){try{localStorage.setItem(key,JSON.stringify(batches));return true;}catch(_){load();showToast('保存失败：浏览器存储不可用，请重试','error');return false;}}
  function visible(){load();if(!valid())return [];const scoped=AppState.scoped(batches);return manager()?scoped:scoped.filter(b=>b.rows.some(r=>r.ownerId===ctx().accountId));}
  function rows(b){return manager()?b.rows:b.rows.filter(r=>r.ownerId===ctx().accountId);}
  function find(batchId){return visible().find(b=>b.id===batchId);}
  function row(itemId){for(const b of visible()){const r=rows(b).find(r=>r.id===itemId);if(r)return {b,r};}return null;}
  function candidates(tenantId){
    if(!valid()||!manager()||!AppState.scoped(CloudCallData.tenants).some(t=>t.tenantId===tenantId))return [];
    return CloudCallData.agents.filter(s=>s.tenantId===tenantId&&s.instanceId===ctx().instanceId&&s.lifecycleStatus!=='已删除').map(s=>{
      const a=CloudCallData.accounts.find(a=>a.accountId===s.accountId),m=CloudCallData.memberships.find(m=>m.accountId===s.accountId&&m.tenantId===tenantId);
      const reason=!a?'尚未关联中台账号':a.status!=='启用'?'关联账号已停用':!m||m.status!=='启用'?'账号未在本租户启用':m.roleCode!=='OPERATOR'?'关联账号不是租户运营':s.lifecycleStatus!=='已启用'?'坐席未启用':s.syncStatus!=='同步成功'?'坐席尚未同步成功':!s.acceptNewTasks?'坐席已停止接收新任务':'';
      const skills=CloudCallData.agentSkills.filter(r=>r.identityId===s.contactCenterIdentityId&&r.status==='已生效'&&r.syncStatus==='同步成功').map(r=>CloudCallData.physicalSkillGroups.find(g=>g.physicalGroupId===r.physicalGroupId&&g.tenantId===tenantId&&g.instanceId===s.instanceId&&g.status==='已启用')?.name).filter(Boolean);
      return {seat:s,account:a,reason,skills};
    });
  }
  function owners(tenantId){return [...new Map(candidates(tenantId).filter(c=>!c.reason).map(c=>[c.account.accountId,c.account])).values()];}
  function assigned(r){return !!(r.ownerId||r.taskId);}
  function pendingForTask(tenantId,instanceId){return !valid()||!manager()?[]:visible().filter(b=>b.tenantId===tenantId&&b.instanceId===instanceId).flatMap(b=>b.rows.filter(r=>!assigned(r)&&!r.activeCallId&&r.followup!=='已完成').map(r=>({...r,batchId:b.id,batchName:b.name})));}
  function releaseUnstartedTask(task){
    if(!valid()||!manager())return false;const scoped=visible().filter(b=>b.tenantId===task.tenantId&&b.instanceId===task.instanceId),linked=scoped.flatMap(b=>b.rows.filter(r=>r.taskId===task.taskId));
    if(linked.some(r=>r.activeCallId||r.calls?.length||r.followup==='已完成'))return false;
    linked.forEach(r=>{(r.history||(r.history=[])).push({at:now(),action:'删除未启动任务，返回待分配',previousTask:task.taskId});r.taskId='';r.taskName='';r.ownerId='';r.method='';});return commit();
  }
  function validateTaskSelection(task,ids){const pool=pendingForTask(task.tenantId,task.instanceId);return Array.isArray(ids)&&new Set(ids).size===ids.length&&ids.every(id=>pool.some(r=>r.id===id));}
  function attachToNewTask(task,ids){
    if(!valid()||!manager()||!['预外呼','IVR 外呼'].includes(task.callType)||task.status!=='待分配客户'||Number(task.completed)||!validateTaskSelection(task,ids))return false;
    if(!ids.length)return true;
    for(const b of batches.filter(b=>b.tenantId===task.tenantId&&b.instanceId===task.instanceId))for(const r of b.rows.filter(r=>ids.includes(r.id))){r.method=task.callType;r.taskId=task.taskId;r.taskName=task.name;r.ownerId='';r.history=r.history||[];r.history.push({at:now(),action:'创建任务时分配',method:task.callType,targetId:task.taskId});}
    return commit();
  }
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
  function callResult(r){return r.calls?.at(-1)?.result||'未呼叫';}
  function summary(rs){return '客户 '+rs.length+' · 已分配 '+rs.filter(r=>r.ownerId||r.taskId).length+' · 已联系 '+rs.filter(r=>r.calls?.length).length+' · 跟进完成 '+rs.filter(r=>r.followup==='已完成').length;}
  function parse(text){
    text=String(text||'').replace(/^\uFEFF/,'');const separator=text.split('\n')[0].includes('\t')?'\t':',';
    const result=[];let cells=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===separator||c==='\n')){cells.push(cell.trim());cell='';if(c==='\n'){if(cells.some(Boolean))result.push(cells);cells=[];}}else if(c!=='\r')cell+=c;}
    if(quoted)throw Error('引号未闭合，请检查文件格式');cells.push(cell.trim());if(cells.some(Boolean))result.push(cells);return result;
  }
  function importDialog(){
    if(!valid()||!manager())return;preview=null;
    ui.openLayer('customer-import',`<div class="layer-header"><h2>导入客户名单</h2><button aria-label="关闭" onclick="PlatformUI.closeLayer('customer-import')">×</button></div>
      <div class="layer-body customer-import-body">
        <div class="customer-import-steps"><strong>1 填写名单</strong><span>→</span><span>2 检查数据</span><span>→</span><span>3 导入后分配</span></div>
        <label class="field customer-import-name"><span>批次名称 <em>*</em></span><input id="customer-batch-name" maxlength="50" placeholder="例如：9月试驾邀约" oninput="CustomerTasks.invalidatePreview()"></label>
        <section class="customer-import-section"><div class="customer-import-heading"><h3>准备客户名单</h3><button class="btn" onclick="CustomerTasks.fillSample()">填入模拟名单</button></div>
          <p class="customer-import-hint">选择 CSV 文件，或直接粘贴 Excel 数据；原三列格式仍可使用。模拟名单只用于本地演示。</p>
          <div class="customer-import-upload"><label for="customer-import-file" class="btn">选择 CSV 文件</label><input id="customer-import-file" type="file" hidden accept=".csv,text/csv" onchange="CustomerTasks.readFile(this.files[0])"><span id="customer-import-filename">未选择文件 · UTF-8 格式，最大 1 MB</span></div>
          <table class="customer-import-guide"><thead><tr><th>客户称呼 <em>*</em></th><th>客户号码 <em>*</em></th><th>联系备注（选填）</th><th>外部单据标识（选填）</th></tr></thead><tbody><tr><td>用于坐席识别客户，最多40字</td><td>手机号或带区号的固定电话</td><td>本次沟通要点，最多500字</td><td>如线索编码、售后工单号；无外部单据可留空</td></tr><tr class="customer-import-example"><td>模拟客户01</td><td>13800000001（演示）</td><td>确认试驾时间</td><td>LEAD-0001</td></tr></tbody></table>
          <label class="field"><span>粘贴或编辑名单 ${ui.help('顺序为客户称呼、客户号码、联系备注、外部单据标识；后两项选填，可包含表头，兼容原三列。外部单据标识按文本保存，Excel中请将该列设为文本以保留前导零。每次最多2000位客户。同批重复号码只保留第一条，单据标识不同也不重复导入；错误行单独展示。')}</span><textarea id="customer-import-text" rows="6" oninput="CustomerTasks.invalidatePreview()" placeholder="客户称呼,客户号码,联系备注,外部单据标识"></textarea></label>
        </section><div id="customer-import-preview" aria-live="polite"></div>
      </div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('customer-import')">取消</button><button class="btn" onclick="CustomerTasks.previewImport()">检查名单</button><button class="btn btn-primary" id="customer-import-confirm" disabled onclick="CustomerTasks.confirmImport()">确认导入</button></div>`,'large');
  }
  function invalidatePreview(){preview=null;const box=document.getElementById('customer-import-preview'),button=document.getElementById('customer-import-confirm');if(box)box.innerHTML='';if(button)button.disabled=true;}
  function fillSample(){
    if(!valid()||!manager())return;const input=document.getElementById('customer-import-text');if(!input)return;
    if(input.value.trim())return showToast('请先清空名单，再填入模拟数据，以免覆盖已填写内容','warning');
    const notes=['确认试驾时间','了解购车计划','预约到店体验','回访试驾感受','确认置换需求','沟通保养预约','活动报名回访','确认到店时间'];
    input.value='客户称呼,客户号码,联系备注,外部单据标识\n'+notes.map((note,i)=>'模拟客户'+String(i+1).padStart(2,'0')+',138000000'+String(i+1).padStart(2,'0')+','+note+','+(i%3===2?'':(i===4?'WO-':'LEAD-')+String(i+1).padStart(4,'0'))).join('\n');
    const name=document.getElementById('customer-batch-name');if(name&&!name.value.trim())name.value='模拟名单 · 客户邀约';invalidatePreview();showToast('已填入8位模拟客户，请检查名单后确认导入','success');
  }
  async function readFile(file){if(!file)return;const scope=ctx().tenantId;if(file.size>1024*1024)return showToast('文件不能超过1MB','error');if(!/\.csv$/i.test(file.name))return showToast('请将Excel另存为CSV后导入','error');try{const text=await file.text();if(scope!==ctx().tenantId||!manager())return;const el=document.getElementById('customer-import-text');if(el)el.value=text;const label=document.getElementById('customer-import-filename');if(label)label.textContent=file.name;invalidatePreview();}catch(_){showToast('文件读取失败，请重新选择','error');}}
  function prepare(name,text){
    if(!valid()||!manager())throw Error('没有导入权限');const tenant=AppState.currentTenant();if(!tenant||tenant.builtIn||tenant.tenantId==='ALL_IN_INSTANCE')throw Error('请进入实际业务租户后导入');
    if(!name.trim()||name.trim().length>50)throw Error('请填写50字以内的批次名称');const list=parse(text);if(!list.length||list.length>2001)throw Error('每次导入1至2000位客户');
    if(['客户称呼','客户姓名','姓名'].includes(list[0][0]))list.shift();if(!list.length||list.length>2000)throw Error('每次导入1至2000位客户');const seen=new Set(),good=[],errors=[];
    list.forEach((c,i)=>{const phone=(c[1]||'').replace(/[\s-]/g,'');let e='';if(!c[0]||c[0].length>40)e='称呼必填且不超过40字';else if(!/^(1[3-9]\d{9}|0\d{9,11})$/.test(phone))e='客户号码格式不正确';else if(c.length>4)e='最多四列：客户称呼、客户号码、联系备注、外部单据标识';else if(String(c[2]||'').length>500)e='备注不超过500字';else if(seen.has(phone))e='同批号码重复';if(e)errors.push({line:i+1,phone,reason:e});else{seen.add(phone);good.push({name:c[0],phone,note:c[2]||'',externalDocumentId:c[3]||''});}});
    return {name:name.trim(),text,tenantId:tenant.tenantId,instanceId:ctx().instanceId,accountId:ctx().accountId,good,errors};
  }
  function previewImport(){try{preview=prepare(document.getElementById('customer-batch-name').value,document.getElementById('customer-import-text').value);document.getElementById('customer-import-preview').innerHTML='<p>可导入 '+preview.good.length+' 位，未通过 '+preview.errors.length+' 行。确认后仅导入有效行。</p>'+(preview.good.length?'<h3>有效名单预览（最多展示前10位）</h3>'+ui.table([{key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'note',label:'联系备注'},{key:'externalDocumentId',label:'外部单据标识',render:v=>esc(v||'—')}],preview.good.slice(0,10)):'')+(preview.errors.length?ui.table([{key:'line',label:'行'},{key:'phone',label:'号码'},{key:'reason',label:'未通过原因'}],preview.errors.slice(0,30)):'');document.getElementById('customer-import-confirm').disabled=!preview.good.length;}catch(e){preview=null;showToast(e.message,'error');}}
  function confirmImport(){
    if(!preview||!valid()||!manager()||preview.tenantId!==ctx().tenantId||preview.accountId!==ctx().accountId)return showToast('工作范围已改变，请重新检查名单','error');
    if(document.getElementById('customer-batch-name').value.trim()!==preview.name||document.getElementById('customer-import-text').value!==preview.text)return showToast('名单已修改，请重新检查','warning');
    load();const b={id:id(),name:preview.name,tenantId:preview.tenantId,instanceId:preview.instanceId,createdAt:now(),createdBy:ctx().accountId,errors:preview.errors,rows:preview.good.map(c=>({...c,id:id(),ownerId:'',method:'',followup:'待联系',calls:[],history:[]}))};batches.unshift(b);if(!commit())return;window.CustomerDirectory?.sync();preview=null;ui.closeLayer('customer-import');open(b.id);showToast('名单已导入，请分配外呼方式和跟进人','success');
  }
  function assign(itemIds,method,ownerId){
    if(!valid()||!manager()||!methods.includes(method))return false;load();const b=find(selectedBatch);if(!b)return false;
    const task=method!=='人工外呼'?taskOptions(method,b).find(t=>t.taskId===ownerId):null;
    if(method==='人工外呼'?!owners(b.tenantId).some(a=>a.accountId===ownerId):!task)return false;
    const chosen=b.rows.filter(r=>itemIds.includes(r.id));if(!chosen.length||chosen.length!==new Set(itemIds).size||chosen.some(r=>r.activeCallId||r.followup==='已完成'))return false;
    if(chosen.some(r=>r.taskId&&!taskOptions(r.method,b).some(t=>t.taskId===r.taskId)))return false;
    chosen.forEach(r=>{r.history.push({at:now(),action:'分配',method,targetId:ownerId,previousOwner:r.ownerId,previousTask:r.taskId||''});r.method=method;r.ownerId=task?'':ownerId;r.taskId=task?.taskId||'';r.taskName=task?.name||'';});if(!commit())return false;window.CloudTaskWorkspace?.syncAssignedCustomers();return true;
  }
  function assignSelected(itemId){
    const ids=typeof itemId==='string'?[itemId]:Array.from(document.querySelectorAll('[name="customer-row"]:checked')).map(e=>e.value),b=find(selectedBatch);
    if(!manager()||!b)return;if(!ids.length)return showToast('请先勾选需要分配的客户','warning');
    if(ids.some(id=>!b.rows.some(r=>r.id===id&&reassignable(r,b)&&(!assigned(r)||typeof itemId==='string'))))return showToast('客户状态已变化，请刷新后重新选择','warning');
    assignment={ids,batchId:b.id,tenantId:ctx().tenantId,accountId:ctx().accountId};
    ui.openLayer('customer-assign',`<div class="layer-header"><h2>分配客户</h2><button onclick="PlatformUI.closeLayer('customer-assign')">×</button></div><div class="layer-body customer-import-body"><strong>已选择 ${ids.length} 位客户</strong><label class="field"><span>外呼方式 *</span><select id="customer-method" onchange="CustomerTasks.assignmentTarget()"><option value="">请选择外呼方式</option>${methods.map(m=>'<option>'+m+'</option>').join('')}</select></label><div id="customer-assignment-target">选择外呼方式后，设置坐席或外呼任务。</div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('customer-assign')">取消</button><button class="btn btn-primary" onclick="CustomerTasks.confirmAssignment()">确认分配</button></div>`,'small');
  }
  function assignmentTarget(){
    const b=find(assignment?.batchId),method=document.getElementById('customer-method')?.value,box=document.getElementById('customer-assignment-target');if(!b||!box)return;
    if(!method){box.textContent='请选择外呼方式';return;}
    const manual=method==='人工外呼',options=manual?candidates(b.tenantId).filter(c=>!c.reason).map(c=>({id:c.account.accountId,name:c.seat.userName+(c.seat.userName===c.account.name?' · 租户运营':' · 账号：'+c.account.name)})):taskOptions(method,b).map(t=>({id:t.taskId,name:t.name}));
    box.innerHTML='<label class="field"><span>'+ (manual?'分配坐席':'外呼任务')+' *</span><select id="customer-target"><option value="">请选择'+(manual?'坐席':'任务')+'</option>'+options.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join('')+'</select></label><p class="customer-import-hint">'+(manual?'客户将进入所选坐席的待联系名单。':'仅可加入本租户同类型、尚未开始的待分配客户或待启动任务；分配不会自动启动呼叫。')+'</p>'+(!options.length?'<p>暂无可选'+(manual?'坐席，请先在坐席维护关联运营账号。':'任务，请先在对应外呼页面创建并保存任务配置。')+'</p>':'')+(manual?'<button class="btn-link" onclick="CustomerTasks.candidateDetails()">查看坐席及不可选原因</button>':'');
  }
  function candidateDetails(){
    const b=find(assignment?.batchId);if(!b||!manager())return;
    ui.openLayer('customer-candidates','<div class="layer-header"><h2>坐席可分配情况</h2><button aria-label="关闭" onclick="PlatformUI.closeLayer(\'customer-candidates\')">×</button></div><div class="layer-body">'+ui.table([{key:'seat',label:'坐席',render:s=>esc(s.userName)},{key:'account',label:'关联账号',render:a=>esc(a?.name||'未关联')},{key:'skills',label:'生效技能',render:s=>esc(s.join('、')||'暂无；呼叫前需配置')},{key:'reason',label:'分配状态',render:r=>r?esc(r):ui.status('可分配')}],candidates(b.tenantId))+'</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'customer-candidates\')">返回分配</button></div>','large');
  }
  function confirmAssignment(){if(!assignment||assignment.accountId!==ctx().accountId||assignment.tenantId!==ctx().tenantId||assignment.batchId!==selectedBatch)return showToast('工作范围已变化，请重新选择客户','warning');if(!assign(assignment.ids,document.getElementById('customer-method')?.value,document.getElementById('customer-target')?.value))return showToast('请选择有效分配对象；已开始或完成的客户不能重新分配','warning');assignment=null;ui.closeLayer('customer-assign');open(selectedBatch);showToast('分配已保存，任务不会自动启动','success');}
  function taskCustomers(task){return visible().filter(b=>b.tenantId===task.tenantId&&b.instanceId===task.instanceId).flatMap(b=>rows(b).filter(r=>r.taskId===task.taskId).map(r=>({...r,batchName:b.name})));}
  function open(batchId){if(selectedBatch!==(batchId||'')){keyword='';status='';assignmentView='pending';}selectedBatch=batchId||'';navigateTo('customer-tasks',{batchId:selectedBatch});}
  function render(options){
    if(!valid())return ui.empty('请进入云联络中心');if(options&&'batchId'in options)selectedBatch=options.batchId||'';
    const b=find(selectedBatch);if(b)return detail(b);
    const bs=visible().filter(b=>!keyword||b.name.includes(keyword));return '<section class="platform-page customer-task-page">'+ui.pageHeader('导入与分配',manager()?'导入客户名单，分配工作，按批次查看联系进度。':'查看分配给我的客户及跟进进度。')+'<div class="filter-panel"><label class="field">批次名称<input id="customer-search" value="'+esc(keyword)+'" placeholder="请输入批次名称"></label><button class="btn btn-primary" onclick="CustomerTasks.query()">查询</button><button class="btn" onclick="CustomerTasks.reset()">重置</button></div><article class="panel-card"><div class="panel-header"><h2>导入批次</h2>'+(manager()?'<button class="btn btn-primary" onclick="CustomerTasks.importDialog()">导入客户</button>':'')+'</div>'+ui.table([{key:'name',label:'批次名称'},{key:'createdAt',label:'导入时间'},{key:'id',label:'联系进度',render:(_,b)=>esc(summary(rows(b)))},{key:'id',label:'操作',render:id=>'<button class="btn-link" onclick="CustomerTasks.open(\''+id+'\')">查看客户</button>'}],bs,{emptyText:manager()?'尚未导入名单，请先导入客户':'暂无分配给我的客户名单'})+'</article></section>';
  }
  function detail(b){
    const rs=rows(b).filter(r=>(!manager()||assignmentView==='all'||(assignmentView==='assigned'?assigned(r):!assigned(r)))&&(!keyword||(r.name+r.phone+(r.externalDocumentId||'')).includes(keyword))&&(!status||outcome(r)===status));
    return '<section class="platform-page customer-task-page">'+ui.pageHeader(b.name,summary(rows(b)),'<button class="btn" onclick="navigateTo(\'customer-directory\')">客户档案</button> <button class="btn" onclick="CustomerTasks.open()">返回导入与分配</button>')+(manager()?'<div class="customer-status-tabs" role="group" aria-label="客户分配状态">'+[['pending','待分配'],['assigned','已分配'],['all','全部客户']].map(([v,label])=>'<button class="btn '+(assignmentView===v?'btn-primary':'')+'" aria-pressed="'+(assignmentView===v)+'" onclick="CustomerTasks.setAssignmentView(\''+v+'\')">'+label+' · '+rows(b).filter(r=>v==='all'||(v==='assigned'?assigned(r):!assigned(r))).length+'</button>').join('')+'</div>':'')+'<div class="filter-panel"><label class="field">客户<input id="customer-search" value="'+esc(keyword)+'" placeholder="称呼、号码或单据标识"></label><label class="field">跟进状态<select id="customer-status"><option value="">全部</option>'+['待联系','待继续跟进','已完成'].map(s=>'<option'+(s===status?' selected':'')+'>'+s+'</option>').join('')+'</select></label><button class="btn btn-primary" onclick="CustomerTasks.query()">查询</button><button class="btn" onclick="CustomerTasks.reset()">重置</button></div><article class="panel-card"><div class="panel-header"><h2>客户名单</h2>'+ui.help('人工外呼分配给坐席；预外呼和IVR分配到待启动任务。加入任务不自动启动呼叫；真实自动执行和结果联调仍待完成。')+'</div>'+(manager()&&assignmentView!=='assigned'?'<div class="customer-assignment-toolbar"><button class="btn btn-primary" onclick="CustomerTasks.assignSelected()">分配客户</button><span id="customer-selected-count" class="customer-selected-count" aria-live="polite">已选择 0 位</span><button id="customer-clear-selection" class="btn-link" disabled onclick="CustomerTasks.selectAll(false)">取消选择</button><span class="customer-import-hint">全选仅包含当前筛选下可分配的客户</span></div>':'')+ui.table([
      ...(manager()?[{key:'id',label:'选择',width:'70px',headerRender:()=>'<label class="customer-select-label"><input id="customer-select-all" type="checkbox" aria-label="全选当前筛选下可分配客户" onchange="CustomerTasks.selectAll(this.checked)"'+(!rs.some(r=>!assigned(r)&&reassignable(r,b))?' disabled':'')+'> 全选</label>',render:(_,r)=>'<input type="checkbox" name="customer-row" onchange="CustomerTasks.updateSelection()" value="'+r.id+'" aria-label="选择'+esc(r.name)+'"'+(assigned(r)||!reassignable(r,b)?' disabled':'')+'>'}]:[]),
      {key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'externalDocumentId',label:'外部单据标识',help:'选填的线索编码、售后工单号等，按本批次客户保存；不改变手机号归档规则。',render:v=>esc(v||'—')},{key:'method',label:'外呼方式',render:m=>esc(m||'待分配')},{key:'ownerId',label:'分配对象',render:(v,r)=>esc(r.taskId?(r.taskName||r.taskId):(CloudCallData.accounts.find(a=>a.accountId===v)?.name||'待分配'))},{key:'id',label:'本批次最近通话',render:(_,r)=>esc(callResult(r))},{key:'id',label:'跟进状态',render:(_,r)=>esc(outcome(r))},{key:'id',label:'操作',render:(_,r)=>'<button class="btn-link" onclick="CustomerTasks.history(\''+r.id+'\')">客户档案</button>'+(manager()&&assigned(r)&&reassignable(r,b)?' <button class="btn-link" onclick="CustomerTasks.assignSelected(\''+r.id+'\')">重新分配</button>':'')+(canCall(r)?' <button class="btn-link" onclick="CustomerTasks.pick(\''+r.id+'\')">联系客户</button>':'')+(r.method&&r.method!=='人工外呼'?'<span> '+(r.taskId?'已加入任务':'需重新分配任务')+'</span>':'')}
    ],rs,{emptyText:manager()&&assignmentView==='pending'?'暂无待分配客户；可切换已分配查看跟进进度':'暂无符合条件的客户'})+'</article>'+(manager()&&b.errors.length?'<details class="technical-details"><summary>导入未通过记录 · '+b.errors.length+' 行</summary>'+ui.table([{key:'line',label:'行'},{key:'phone',label:'号码'},{key:'reason',label:'原因'}],b.errors)+'</details>':'')+'</section>';
  }
  function canCall(r){return valid()&&r.ownerId===ctx().accountId&&r.method==='人工外呼'&&r.followup!=='已完成'&&!r.activeCallId;}
  function mine(){return visible().flatMap(b=>rows(b).filter(r=>canCall(r)).map(r=>({...r,batchName:b.name})));}
  function pick(itemId){const item=row(itemId);if(!item||!canCall(item.r))return showToast('该客户已不可联系或不属于当前账号','warning');AgentWorkbench.selectAssigned(item.r);}
  function claim(itemId,call){const item=row(itemId);if(!item||!canCall(item.r))return false;item.r.activeCallId=call.callId;return commit();}
  function acceptTaskDemoResult(task,call){
    if(!valid()||!manager()||!call.simulation||task.status!=='执行中'||call.taskId!==task.taskId)return false;
    const item=row(call.customerTaskItemId);if(!item||item.b.tenantId!==task.tenantId||item.b.instanceId!==task.instanceId||item.r.taskId!==task.taskId||item.r.activeCallId)return false;
    if(item.r.calls.some(c=>c.callId===call.callId))return true;
    item.r.calls.push({callId:call.callId,externalDocumentId:call.externalDocumentId||'',result:call.result,at:call.endedAt,agentName:call.agentName,disposition:call.agentDisposition,remark:'本地任务演示'});
    item.r.followup=call.result==='接通'?'已完成':'待继续跟进';return commit();
  }
  function syncCall(call){if(!call.customerTaskItemId)return;load();const b=batches.find(b=>b.tenantId===call.tenantId&&b.instanceId===call.instanceId&&b.rows.some(r=>r.id===call.customerTaskItemId));const r=b?.rows.find(r=>r.id===call.customerTaskItemId);if(!r||r.activeCallId!==call.callId)return;const snapshot={callId:call.callId,externalDocumentId:call.externalDocumentId||'',result:call.result,at:call.endedAt,agentName:call.agentName,disposition:call.agentDisposition||'',remark:call.dispositionRemark||''};const i=r.calls.findIndex(c=>c.callId===call.callId);if(i<0)r.calls.push(snapshot);else r.calls[i]=snapshot;if(call.processingStatus==='已完成'){r.followup=call.agentDisposition==='需要再次联系'?'待继续跟进':'已完成';r.activeCallId='';}commit();}
  function history(itemId){const item=row(itemId);if(!item)return;window.CustomerDirectory?.open(item.r.phone,item.b.tenantId,item.b.instanceId);}
  function sidebar(selectedId){const list=mine();return '<aside class="seat-sidebar"><article class="panel-card"><div class="panel-header"><h2>分配给我的客户 · '+list.length+'</h2><button class="btn-link" onclick="CustomerTasks.open()">导入与分配</button></div><div class="seat-recent">'+(list.map(r=>'<button class="seat-recent-row" onclick="CustomerTasks.pick(\''+r.id+'\')"><span><strong>'+esc(r.name)+(r.id===selectedId?' · 已选择':'')+'</strong><small>'+esc(r.phone)+'</small><small>'+esc(r.batchName)+'</small></span><span>'+esc(r.followup)+'</span></button>').join('')||'<div class="seat-empty-recent">暂无其他待联系客户</div>')+'</div></article></aside>';}
  window.CustomerTasks={render,open,owners,prepare,importDialog,readFile,previewImport,confirmImport,assign,assignSelected,canCall,mine,pick,row,claim,syncCall,history,sidebar,query(){keyword=document.getElementById('customer-search')?.value.trim()||'';status=document.getElementById('customer-status')?.value||'';navigateTo('customer-tasks',{batchId:selectedBatch});},reset(){keyword='';status='';navigateTo('customer-tasks',{batchId:selectedBatch});}};
  Object.assign(window.CustomerTasks,{selectAll,updateSelection,releaseUnstartedTask,pendingForTask,validateTaskSelection,attachToNewTask,candidateDetails,setAssignmentView,candidates,fillSample,invalidatePreview,assignmentTarget,confirmAssignment,taskOptions,taskCustomers,acceptTaskDemoResult});
  Pages['customer-tasks']={render};
})();
