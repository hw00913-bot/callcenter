/** Business follow-up appends an execution row to the same task; source history stays untouched. */
(function(){
  'use strict';
  const data=CloudCallData,ui=PlatformUI,esc=ui.escape,batchKey='customer-task-batches-v1';
  const clone=value=>structuredClone(value),stamp=()=>new Date().toLocaleString('sv-SE');
  const phone=value=>CustomerDirectory.normalizePhone(value);
  const scope=(a,b)=>a.tenantId===b.tenantId&&String(a.enterpriseId)===String(b.enterpriseId);
  const refKey=ref=>JSON.stringify([ref.batchId,ref.itemId,ref.taskId,ref.callId]);
  const ctx=()=>AppState.get();
  let selection=null;
  function allowed(){return AppState.isReady()&&AppState.effectiveAccess().valid&&ctx().activeDomain==='CLOUD_CONTACT_CENTER'&&AppState.canAction('task.create');}
  function readBatches(){const value=JSON.parse(localStorage.getItem(batchKey)||'[]');if(!Array.isArray(value)||value.some(b=>!b||!Array.isArray(b.rows)))throw Error('客户名单暂时无法读取，请稍后重试');return value;}
  function taskAllowed(task){return allowed()&&task?.callType==='预外呼'&&AppState.authorizeObject('task.create',task)&&String(task.enterpriseId)===String(ctx().enterpriseId)&&data.tenants.some(t=>t.tenantId===task.tenantId&&String(t.enterpriseId)===String(task.enterpriseId)&&t.status==='启用'&&(t.capabilitySet||[]).includes('CLOUD_CONTACT_CENTER'));}
  function currentTask(identity){const matches=data.tasks.filter(task=>task.taskId===identity?.taskId&&scope(task,identity));return matches.length===1?matches[0]:null;}
  function taskBlockReason(task){
    if(!taskAllowed(task))return '当前任务不可安排再次联系';
    if(task.isWizardDraft||task.displayOnly||!['待启动','执行中','已暂停'].includes(task.status))return '仅待启动、执行中或已暂停的原任务可安排再次联系，已结束任务不能重新开启';
    const statuses=[task.providerStatusCode,task.alictiMockTaskProperty?.status,task.alictiControlResponse?.result===0?task.alictiControlResponse.data?.taskProperty?.status:null].filter(value=>value!==undefined&&value!==null&&value!=='');
    if(statuses.some(value=>String(value)==='3'))return '供应商任务已结束，不能再次加入客户';
    if(task.alictiTaskControlPending||statuses.some(value=>!['0','1','2'].includes(String(value))))return '任务状态待核对，请确认后再安排再次联系';
    return '';
  }
  const sourceRef=source=>({batchId:source.batchId,itemId:source.id,taskId:source.taskId,callId:source.sourceCall.callId});
  function callEnded(call){return CloudReportMetrics.state(call).ended===true;}
  function pendingReason(source,batches){
    const tel=phone(source.phone),where={tenantId:source.tenantId,enterpriseId:source.enterpriseId};
    if((data.nativeWorkbench?.blockedNumbers||[]).some(n=>n.tenantId===where.tenantId&&phone(n.phone)===tel)||data.calls.some(c=>scope(c,where)&&phone(CloudReportMetrics.customerPhone(c))===tel&&c.agentDisposition==='客户拒绝联系'))return '客户已拒绝联系，不能再次安排';
    if(data.calls.some(c=>scope(c,where)&&c.taskId===source.taskId&&phone(CloudReportMetrics.customerPhone(c))===tel&&(!callEnded(c)||c.processingStatus==='待填写')))return '该客户正在通话或尚未完成话后处理';
    for(const b of batches.filter(b=>scope(b,where)))for(const row of b.rows.filter(r=>r.taskId===source.taskId&&phone(r.phone)===tel)){
      if(row.activeCallId)return '该客户正在通话或尚未完成话后处理';
      if(row.pendingRetry===true||row.pendingCall===true)return '该客户已有待执行的呼叫安排';
      if(!(row.calls||[]).length&&row.followup!=='已完成'&&row.taskId)return '该客户已有待执行的呼叫安排';
    }
    return '';
  }
  function sources(filter={}){
    if(!allowed())return [];
    const batches=readBatches(),directory=filter.customerId?[CustomerDirectory.find(filter.customerId)].filter(Boolean):CustomerDirectory.list();
    const visibleCalls=new Map();for(const customer of directory)for(const call of customer.calls)visibleCalls.set(JSON.stringify([call.tenantId,String(call.enterpriseId),call.callId]),call);
    const result=[];
    for(const b of batches){
      for(const row of b.rows){
        if(row.method!=='预外呼'||!row.taskId||(filter.taskId&&row.taskId!==filter.taskId))continue;
        const task=data.tasks.find(t=>t.taskId===row.taskId&&scope(t,b));if(!taskAllowed(task))continue;
        const calls=[...visibleCalls.values()].filter(c=>scope(c,b)&&c.callType==='预外呼'&&c.taskId===row.taskId&&(c.customerTaskItemId===row.id||(c.directoryMeta?.rowIds||[]).includes(row.id)));
        calls.sort((a,b)=>(CloudReportMetrics.callTime(b)||0)-(CloudReportMetrics.callTime(a)||0));
        const last=calls[0];if(!last)continue;
        const state=CloudReportMetrics.state(last),eligible=state.answered===true&&state.ended;
        const human=CloudReportMetrics.humanAnswer(last),disposition=last.agentDisposition||last.disposition||'';
        const repeatReason=human===false?'客户已接通，待人工跟进':disposition==='需要再次联系'?'坐席约定再次联系':'业务再次跟进';
        const source={...clone(row),businessType:row.businessType||b.businessType||'',brandId:row.brandId||b.brandId||'',batchId:b.id,batchName:b.name,tenantId:b.tenantId,enterpriseId:b.enterpriseId,sourceTask:task,sourceCall:last,repeatReason,humanAnswer:human,eligible};
        source.blockReason=taskBlockReason(task)||(source.businessType==='lead'&&(typeof source.externalDocumentId!=='string'||!source.externalDocumentId.trim())?'该线索缺少有效的文本编码，请先核对原线索':pendingReason(source,batches));
        result.push(source);
      }
    }
    const latest=new Map();
    for(const row of result){const key=businessKey(row,row),previous=latest.get(key);if(!previous||(CloudReportMetrics.callTime(row.sourceCall)||0)>(CloudReportMetrics.callTime(previous.sourceCall)||0))latest.set(key,row);}
    return [...latest.values()].filter(row=>row.eligible&&(!filter.itemId||row.id===filter.itemId)&&(!filter.callId||row.sourceCall.callId===filter.callId)&&(!filter.waiting||row.humanAnswer===false||(row.sourceCall.agentDisposition||row.sourceCall.disposition)==='需要再次联系'||row.followup==='待继续跟进'));
  }
  function selectedRows(spec){try{const all=sources();return (spec?.sourceRefs||[]).map(ref=>all.find(row=>refKey(sourceRef(row))===refKey(ref))).filter(Boolean);}catch(_){return [];}}
  function validateSpec(spec){
    try{
      if(!allowed())return {ok:false,message:'当前没有安排预外呼的权限'};
      if(spec?.version!==1||!Array.isArray(spec.sourceRefs)||!spec.sourceRefs.length||spec.sourceRefs.length>2000)return {ok:false,message:'请选择 1 至 2000 位已接通且通话已结束的客户'};
      if(!spec.sourceTaskId||spec.sourceRefs.some(ref=>!ref||ref.taskId!==spec.sourceTaskId))return {ok:false,message:'请先选择原任务，仅可安排同一任务内的客户'};
      if(new Set(spec.sourceRefs.map(refKey)).size!==spec.sourceRefs.length)return {ok:false,message:'同一客户记录不能重复选择'};
      const all=sources({taskId:spec.sourceTaskId}),rows=spec.sourceRefs.map(ref=>all.find(row=>refKey(sourceRef(row))===refKey(ref)));
      if(rows.some(row=>!row))return {ok:false,message:'客户或最近通话已变化，请重新选择'};
      const first=rows[0];if(rows.some(row=>!scope(row,first)))return {ok:false,message:'请按同一个总部或门店分别安排'};
      if(new Set(rows.map(row=>phone(row.phone))).size!==rows.length)return {ok:false,message:'所选名单中有相同号码，请保留本次要跟进的一条业务记录，其他线索分次安排'};
      const blocked=rows.find(row=>row.blockReason);if(blocked)return {ok:false,message:blocked.blockReason};
      if(String(spec.note||'').length>500||String(spec.reason||'').length>100)return {ok:false,message:'联系备注最多 500 字，联系原因最多 100 字'};
      return {ok:true,rows,tenantId:first.tenantId,enterpriseId:first.enterpriseId,sourceTaskId:first.taskId};
    }catch(error){return {ok:false,message:error.message||'暂时无法核对客户，请重试'};}
  }
  function businessKey(row,batch){return JSON.stringify([batch.tenantId,String(batch.enterpriseId),row.taskId,row.brandId||batch.brandId||'',phone(row.phone),row.businessType||'',row.externalDocumentId||row.repeatContact?.rootItemId||row.id]);}
  function nextContactNumber(source,batches){const origin=batches.find(b=>b.id===source.batchId),key=businessKey(source,origin);return batches.flatMap(b=>b.rows.filter(r=>businessKey({...r,businessType:r.businessType||b.businessType||''},b)===key&&(r.calls||[]).length)).reduce((max,r)=>Math.max(max,Number(r.repeatContact?.businessContactNo)||1),1)+1;}
  function sourceSnapshot(source,batches){
    const batch=batches.find(b=>b.id===source.batchId&&scope(b,source)),row=batch?.rows.find(r=>r.id===source.id&&r.taskId===source.taskId),call=clone(source.sourceCall);
    delete call.directoryMeta;
    return {batchId:batch?.id,row:clone(row),call};
  }
  function executionRow(source,batches,task,spec,id,at){
    const origin=batches.find(b=>b.id===source.batchId);
    const repeatContact={sourceTaskId:source.taskId,sourceTaskName:source.sourceTask.name,sourceBatchId:source.batchId,sourceItemId:source.id,sourceCallId:source.sourceCall.callId,rootItemId:source.repeatContact?.rootItemId||source.id,businessContactNo:nextContactNumber(source,batches),reason:String(spec.reason||source.repeatReason),plannedAt:'',createdAt:at};
    return {id,name:source.name,phone:source.phone,note:String(spec.note||source.sourceCall.dispositionRemark||source.sourceCall.remark||source.note||'').slice(0,500),...CustomerBusiness.snapshot(source),...(source.brandId||origin.brandId?{brandId:source.brandId||origin.brandId}:{}),ownerId:'',method:'预外呼',taskId:task.taskId,taskName:task.name,followup:'待联系',calls:[],activeCallId:'',repeatContact,history:[{at,action:'加入原任务再次联系',targetId:task.taskId,sourceTaskId:source.taskId,sourceItemId:source.id,sourceCallId:source.sourceCall.callId}]};
  }
  function prepareAttachment(task,spec){
    try{
      const verified=validateSpec(spec);if(!verified.ok)return verified;
      if(task?.taskId!==verified.sourceTaskId||!scope(task,verified))return {ok:false,message:'再次联系只能加入原任务，不能创建或转入其他任务'};
      task=currentTask(task);const blocked=taskBlockReason(task);if(blocked)return {ok:false,message:blocked};
      const batches=readBatches(),batchId='REPEAT-BATCH-'+crypto.randomUUID(),at=stamp();
      const rows=verified.rows.map(source=>executionRow(source,batches,task,spec,'REPEAT-ITEM-'+crypto.randomUUID(),at));
      const newBatch={id:batchId,name:task.name+' · 再次联系名单',businessType:rows.every(r=>r.businessType===rows[0].businessType)?rows[0].businessType:'',tenantId:task.tenantId,enterpriseId:task.enterpriseId,createdAt:at,createdBy:ctx().accountId,simulation:true,errors:[],rows};
      return {ok:true,kind:'repeat-predictive',taskId:task.taskId,tenantId:task.tenantId,enterpriseId:task.enterpriseId,createdBy:ctx().accountId,spec:clone(spec),sourceSnapshots:verified.rows.map(source=>sourceSnapshot(source,batches)),newBatch,changes:rows.map(row=>({batchId,batchName:newBatch.name,rowId:row.id,before:null,after:clone(row)}))};
    }catch(error){return {ok:false,message:error.message||'暂时无法准备再次联系名单，请重试'};}
  }
  function applyAttachment(prepared,undo=false){
    try{
      if(!prepared?.ok||prepared.kind!=='repeat-predictive'||!allowed()||prepared.createdBy!==ctx().accountId||!AppState.authorizeObject('task.create',prepared)||String(prepared.enterpriseId)!==String(ctx().enterpriseId)||!prepared.newBatch||!scope(prepared,prepared.newBatch)||prepared.newBatch.createdBy!==prepared.createdBy||!Array.isArray(prepared.newBatch.rows)||!Array.isArray(prepared.changes))return false;
      const current=readBatches(),existing=current.find(b=>b.id===prepared.newBatch.id),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
      if(undo){
        if(!existing)return true;
        if(!equal(existing,prepared.newBatch)||data.calls.some(call=>scope(call,prepared)&&call.taskId===prepared.taskId&&existing.rows.some(row=>row.id===call.customerTaskItemId||(call.directoryMeta?.rowIds||[]).includes(row.id))))return false;
        localStorage.setItem(batchKey,JSON.stringify(current.filter(b=>b.id!==prepared.newBatch.id)));return true;
      }
      const task=currentTask(prepared);if(taskBlockReason(task)||prepared.taskId!==prepared.spec?.sourceTaskId)return false;
      if(existing)return equal(existing,prepared.newBatch);
      const checked=validateSpec(prepared.spec);if(!checked.ok||!scope(checked,prepared))return false;
      if(prepared.newBatch.rows.length!==checked.rows.length||prepared.changes.length!==checked.rows.length||prepared.sourceSnapshots?.length!==checked.rows.length||new Set(prepared.newBatch.rows.map(row=>row.id)).size!==checked.rows.length)return false;
      for(let i=0;i<checked.rows.length;i++){
        const row=prepared.newBatch.rows[i],source=checked.rows[i],change=prepared.changes[i];
        if(!row.id||current.some(b=>b.rows.some(r=>r.id===row.id))||!equal(prepared.sourceSnapshots[i],sourceSnapshot(source,current))||!equal(row,executionRow(source,current,task,prepared.spec,row.id,prepared.newBatch.createdAt))||change.before!==null||change.rowId!==row.id||change.batchId!==prepared.newBatch.id||change.batchName!==prepared.newBatch.name||!equal(change.after,row))return false;
      }
      localStorage.setItem(batchKey,JSON.stringify([prepared.newBatch,...current]));return true;
    }catch(_){return false;}
  }
  function open(filter={}){
    if(!allowed())return false;
    let rows;try{rows=sources(filter);}catch(error){showToast(error.message,'warning');return false;}
    rows=ui.sortByUpdated?.(rows,['sourceCall.updatedAt','sourceCall.dispositionUpdatedAt','sourceCall.endedAt','sourceCall.at'])||rows;
    if(!filter.taskId){
      const candidates=[...new Map(rows.map(row=>[row.taskId,row.sourceTask])).values()],tasks=ui.sortByUpdated?.(candidates)||candidates;
      if(tasks.length===1)return open({...filter,taskId:tasks[0].taskId});
      selection=null;
      ui.openLayer('repeat-predictive','<div class="layer-header"><div><h2>选择原任务</h2><p>同一客户在不同任务中的再次联系分别安排。</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer(\'repeat-predictive\')">×</button></div><div class="layer-body">'+ui.table([{key:'name',label:'原任务'},{key:'status',label:'任务状态'},{key:'taskId',label:'操作',render:(_,task)=>action({...filter,taskId:task.taskId},'查看本任务客户')}],tasks,{emptyText:'暂无可再次联系的任务'})+'</div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'repeat-predictive\')">关闭</button></div>','wide');
      return true;
    }
    const task=rows[0]?.sourceTask||data.tasks.find(task=>task.taskId===filter.taskId&&taskAllowed(task));
    if(!taskAllowed(task))return false;
    selection={filter:clone(filter),accountId:ctx().accountId,tenantId:ctx().tenantId,enterpriseId:ctx().enterpriseId,rows};
    const single=!!(filter.itemId||filter.callId);
    ui.openLayer('repeat-predictive','<div class="layer-header"><div><h2>本任务再次联系</h2><p>原任务：'+esc(task.name)+'。选择客户，继续在本任务中联系。</p></div><button aria-label="关闭" onclick="PlatformUI.closeLayer(\'repeat-predictive\')">×</button></div><div class="layer-body repeat-predictive-body"><div class="repeat-selection-head"><label><input type="checkbox" aria-label="全选可安排客户" onchange="RepeatPredictive.selectAll(this.checked)"> 全选可安排客户</label><span id="repeat-selected-count">已选择 0 位</span></div>'+ui.table([
      {key:'id',label:'选择',render:(_,r)=>'<input name="repeat-source" type="checkbox" value="'+esc(JSON.stringify(sourceRef(r)))+'" aria-label="选择'+esc(r.name)+'" onchange="RepeatPredictive.updateSelection()"'+(r.blockReason?' disabled':single?' checked':'')+'>'},
      {key:'name',label:'客户'},{key:'phone',label:'号码'},{key:'externalDocumentId',label:'业务编码',render:v=>esc(v||'—')},{key:'repeatReason',label:'再次联系原因'},{key:'blockReason',label:'安排状态',render:v=>v?'<span class="repeat-blocked">'+esc(v)+'</span>':'可安排'}
    ],rows,{emptyText:'暂无可再次安排的客户',emptyDetail:'仅选择本任务中已接通且通话已结束的预外呼客户。'})+'<label class="field"><span>本次联系备注（选填）</span><textarea id="repeat-contact-note" maxlength="500" rows="3" placeholder="例如：客户约定明天下午继续沟通"></textarea></label><p class="repeat-soft-note">沿用本任务的接听团队、号码与呼叫设置；暂停的任务仍需继续后执行。原客户和通话历史保留。</p></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer(\'repeat-predictive\')">取消</button><button class="btn btn-primary" id="repeat-continue" onclick="RepeatPredictive.continueToWizard()">加入本任务</button></div>','wide');
    updateSelection();return true;
  }
  function selectionCurrent(){return selection&&allowed()&&selection.accountId===ctx().accountId&&selection.tenantId===ctx().tenantId&&String(selection.enterpriseId)===String(ctx().enterpriseId);}
  function selectedRefs(){return [...document.querySelectorAll('#repeat-predictive [name="repeat-source"]:checked:not(:disabled)')].map(e=>JSON.parse(e.value));}
  function updateSelection(){const count=selectedRefs().length,label=document.getElementById('repeat-selected-count'),button=document.getElementById('repeat-continue');if(label)label.textContent='已选择 '+count+' 位';if(button)button.disabled=!count;}
  function selectAll(checked){if(!selectionCurrent())return;document.querySelectorAll('#repeat-predictive [name="repeat-source"]:not(:disabled)').forEach(e=>e.checked=checked);updateSelection();}
  function continueToWizard(){
    if(!selectionCurrent()){showToast('当前账号或租户已变化，请重新选择','warning');return false;}
    const spec={version:1,sourceRefs:selectedRefs(),sourceTaskId:selection.filter.taskId||'',reason:'',note:document.getElementById('repeat-contact-note')?.value.trim()||''},checked=validateSpec(spec);
    if(!checked.ok){showToast(checked.message,'warning');return false;}
    spec.sourceTaskId=checked.sourceTaskId;
    const result=CloudTaskWorkspace.startRepeatPredictive(spec);
    if(result===true){ui.closeLayer('repeat-predictive',false);selection=null;}
    return result;
  }
  function renderSelection(draft){
    const spec=draft.repeatPredictive,checked=validateSpec(spec),selected=selectedRows(spec),rows=ui.sortByUpdated?.(selected,['sourceCall.updatedAt','sourceCall.dispositionUpdatedAt','sourceCall.endedAt','sourceCall.at'])||selected;
    return '<section class="wizard-customers repeat-wizard-customers" id="wizardCustomers"><div class="wizard-section-title"><h3>本次再次联系的客户</h3><span>'+rows.length+' 位</span></div>'+(!checked.ok?'<p class="repeat-blocked" role="status">'+esc(checked.message)+'</p>':'')+ui.table([{key:'name',label:'客户'},{key:'phone',label:'号码'},{key:'externalDocumentId',label:'业务编码',render:v=>esc(v||'—')},{key:'repeatReason',label:'联系原因'},{key:'batchName',label:'原名单'}],rows)+'<p class="repeat-soft-note">'+esc(spec.note?'本次备注：'+spec.note:'原线索及通话历史保留，本次建立新的外呼安排。')+'</p></section>';
  }
  const action=(filter,label='本任务再次联系')=>'<button type="button" class="btn-link" onclick="RepeatPredictive.open('+esc(JSON.stringify(filter))+')">'+label+'</button>';
  function listTaskAction(task){if(taskBlockReason(task))return '';let count=0;try{count=sources({taskId:task.taskId,waiting:true}).filter(row=>!row.blockReason).length;}catch(_){}return count?action({taskId:task.taskId,waiting:true},'待再次联系 · '+count):'';}
  function taskToolbar(task){const button=listTaskAction(task);return button?'<div class="repeat-task-toolbar">'+button+'</div>':'';}
  function listAction(){return '';}
  function hasSource(filter){try{return sources(filter).some(row=>!row.blockReason);}catch(_){return false;}}
  function rowAction(task,row){const filter={taskId:task.taskId,itemId:row.id};return taskAllowed(task)&&(row.calls||[]).length&&hasSource(filter)?action(filter):'';}
  function customerActions(customer){
    if(!allowed()||!customer)return '';
    try{const tasks=[...new Set(sources({customerId:customer.id}).filter(row=>!row.blockReason).map(row=>row.taskId))];return tasks.length?action({customerId:customer.id,...(tasks.length===1?{taskId:tasks[0]}:{})},tasks.length===1?'本任务再次联系':'按任务再次联系'):'';}catch(_){return '';}
  }
  function callAction(call){const filter={taskId:call?.taskId,callId:call?.callId};return allowed()&&call?.callType==='预外呼'&&callEnded(call)&&CloudReportMetrics.state(call).answered===true&&hasSource(filter)?'<div class="repeat-call-action">'+action(filter)+'</div>':'';}
  function contactMeta(call){
    if(call?.repeatContact?.businessContactNo)return call.repeatContact;
    try{const b=readBatches().find(b=>scope(b,call)&&b.rows.some(r=>r.id===call.customerTaskItemId&&r.taskId===call.taskId));return b?.rows.find(r=>r.id===call.customerTaskItemId&&r.taskId===call.taskId)?.repeatContact||null;}catch(_){return null;}
  }
  function contactLabel(call){const meta=contactMeta(call);return meta?'第 '+Number(meta.businessContactNo)+' 次联系':call?.callType==='预外呼'&&call.customerTaskItemId?'第 1 次联系':'';}
  function contactOrigin(call){const meta=contactMeta(call);return meta?'<div class="repeat-contact-origin"><strong>'+esc(contactLabel(call))+'</strong><span>'+esc(meta.reason)+'</span><span>来源任务：'+esc(meta.sourceTaskName||meta.sourceTaskId)+'</span>'+(meta.plannedAt?'<span>计划联系：'+esc(meta.plannedAt)+'</span>':'')+'</div>':'';}
  function callMetadata(row){return row?.repeatContact?{repeatContact:clone(row.repeatContact),...(row.brandId?{brandId:row.brandId}:{})}:{};}
  function releaseTask(task){
    try{
      if(!taskAllowed(task)||!task.repeatContact||!['待启动','待分配客户','已终止'].includes(task.status)||task.startedAt||task.campaignId||Number(task.completed)||data.calls.some(c=>c.taskId===task.taskId&&scope(c,task)))return false;
      const current=readBatches(),linked=current.filter(b=>scope(b,task)&&b.rows.some(r=>r.taskId===task.taskId));
      if(linked.some(b=>b.createdBy!==ctx().accountId&&!['ADMIN','SUPER_ADMIN'].includes(AppState.effectiveAccess().roleCode)||b.rows.some(r=>r.taskId!==task.taskId||!r.repeatContact||r.activeCallId||(r.calls||[]).length)))return false;
      localStorage.setItem(batchKey,JSON.stringify(current.filter(b=>!linked.includes(b))));return true;
    }catch(_){return false;}
  }
  window.RepeatPredictive={sources,selectedRows,validateSpec,prepareAttachment,commitAttachment:p=>applyAttachment(p),rollbackAttachment:p=>applyAttachment(p,true),releaseTask,open,selectAll,updateSelection,continueToWizard,renderSelection,listAction,listTaskAction,taskToolbar,rowAction,customerActions,callAction,contactLabel,contactOrigin,callMetadata};
})();
