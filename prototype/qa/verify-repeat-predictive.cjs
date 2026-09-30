/* Business follow-up isolation and transaction recovery. No browser or network. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),checks=[],failures=[];
const key='customer-task-batches-v1',clone=value=>JSON.parse(JSON.stringify(value));
function check(name,fn){try{fn();checks.push(name);}catch(error){failures.push({name,message:error.message});}}
function fixture(){
  const state={tenantId:'T1',enterpriseId:'7522240',accountId:'A1',activeDomain:'CLOUD_CONTACT_CENTER',role:'ADMIN',ready:true,valid:true,canCreate:true};
  const store=new Map([[key,'[]']]),data={tasks:[],calls:[],tenants:[{tenantId:'T1',enterpriseId:'7522240',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']},{tenantId:'T2',enterpriseId:'7522240',status:'启用',capabilitySet:['CLOUD_CONTACT_CENTER']}],nativeWorkbench:{blockedNumbers:[]}};
  const normalize=value=>String(value??'').replace(/[\s()-]/g,'').replace(/^\+86/,'');
  const inScope=row=>String(row.enterpriseId)===state.enterpriseId&&(state.role==='SUPER_ADMIN'||row.tenantId===state.tenantId);
  const c={Date,JSON,Math,Map,Set,structuredClone,crypto,state,store,CloudCallData:data,failWrite:false,
    PlatformUI:{escape:value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')},
    AppState:{get:()=>state,isReady:()=>state.ready,effectiveAccess:()=>({valid:state.valid,roleCode:state.role}),canAction:()=>state.canCreate,authorizeObject:(_,row)=>state.valid&&inScope(row)},
    localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(c.failWrite)throw Error('storage unavailable');store.set(k,v);}},
    CloudReportMetrics:{state:call=>({ended:!!call.endedAt,answered:[41,42,43].includes(call.status)?true:call.status===40?false:null}),humanAnswer:call=>call.status===43?true:call.status===42?false:null,customerPhone:call=>call.callee,callTime:call=>Date.parse(call.ringingAt)},
    CustomerDirectory:{normalizePhone:normalize,list:()=>{
      const customers=new Map();
      for(const call of data.calls.filter(call=>inScope(call)&&(state.role!=='OPERATOR'||call.accountId===state.accountId))){
        const id=JSON.stringify([call.tenantId,call.enterpriseId,normalize(call.callee)]);
        if(!customers.has(id))customers.set(id,{id,tenantId:call.tenantId,enterpriseId:call.enterpriseId,phone:call.callee,calls:[]});
        customers.get(id).calls.push(call);
      }
      return [...customers.values()];
    }},showToast:()=>{}};
  c.CustomerDirectory.find=id=>c.CustomerDirectory.list().find(customer=>customer.id===id);
  c.window=c;vm.createContext(c);
  for(const file of ['customer-business.js','repeat-predictive.js'])vm.runInContext(fs.readFileSync(path.join(root,'js/components',file),'utf8'),c);
  c.batches=()=>JSON.parse(store.get(key));c.saveBatches=rows=>store.set(key,JSON.stringify(rows));
  let index=0;
  c.addSource=(options={})=>{
    const n=++index,tenantId=options.tenantId||'T1',enterpriseId=options.enterpriseId||'7522240';
    const task=options.task||{taskId:'SOURCE-TASK-'+n,name:'原预外呼任务 '+n,tenantId,enterpriseId,callType:'预外呼',status:'执行中',completed:1,scheduleAt:'手工启动'};
    const row={id:'SOURCE-ROW-'+n,name:'客户 '+n,phone:options.phone||'1380000000'+n,businessType:'lead',externalDocumentId:'00'+n,brandId:'BRAND-A',ownerId:'',method:'预外呼',taskId:task.taskId,taskName:task.name,followup:'待继续跟进',activeCallId:'',calls:[{callId:'SOURCE-CALL-'+n,result:'接通',at:'2026-09-16 10:01:00'}],history:[{action:'首次预外呼'}],...options.row};
    const call={callId:'SOURCE-CALL-'+n,taskId:task.taskId,customerTaskItemId:row.id,tenantId,enterpriseId,accountId:options.accountId||'A1',callee:row.phone,callType:'预外呼',status:options.status??43,ringingAt:'2026-09-16 10:00:00',endedAt:'2026-09-16 10:01:00',processingStatus:'已完成',agentDisposition:'需要再次联系',dispositionRemark:'约定明天联系',...options.call};
    const batch={id:'SOURCE-BATCH-'+n,name:'原客户名单 '+n,tenantId,enterpriseId,businessType:'lead',brandId:'BRAND-A',rows:[row],...options.batch};
    if(!data.tasks.includes(task))data.tasks.push(task);data.calls.push(call);c.saveBatches([...c.batches(),batch]);return {task,row,call,batch,ref:{batchId:batch.id,itemId:row.id,taskId:task.taskId,callId:call.callId}};
  };
  c.first=c.addSource();
  c.spec=(sources=[c.first])=>({version:1,sourceRefs:sources.map(source=>source.ref),sourceTaskId:sources[0].task.taskId,reason:'',note:''});
  c.newTask=(patch={})=>({taskId:'NEW-TASK',name:'再次预外呼任务',tenantId:'T1',enterpriseId:'7522240',callType:'预外呼',status:'待分配客户',completed:0,scheduleAt:'2026-09-17 14:00',...patch});
  c.prepare=(task=c.first.task,spec=c.spec())=>c.RepeatPredictive.prepareAttachment(task,spec);
  c.addPending=(patch={},task=c.first.task)=>{
    if(!data.tasks.includes(task))data.tasks.push(task);
    const n=++index;
    c.saveBatches([...c.batches(),{id:'PENDING-BATCH-'+n,name:'已有后续安排',tenantId:task.tenantId,enterpriseId:task.enterpriseId,rows:[{...clone(c.first.row),id:'PENDING-ROW-'+n,taskId:task.taskId,calls:[],followup:'待联系',activeCallId:'',...patch}]}]);return task;
  };
  c.loadCustomerTasks=()=>{
    c.Pages={};c.AppState.scoped=rows=>rows.filter(inScope);
    vm.runInContext(fs.readFileSync(path.join(root,'js/pages/customer-tasks.js'),'utf8'),c);
  };
  c.createOwnRepeatTask=()=>{
    const task=c.first.task,prepared=c.prepare(task);
    assert(prepared.ok,prepared.message);assert(c.RepeatPredictive.commitAttachment(prepared));return {task,prepared};
  };
  c.completeAppend=(prepared,patch={})=>{
    const batches=c.batches(),batch=batches.find(b=>b.id===prepared.newBatch.id),row=batch.rows[0];
    const record={...clone(c.first.call),callId:'REPEAT-CALL-'+row.id,taskId:row.taskId,customerTaskItemId:row.id,ringingAt:'2026-09-17 14:00:00',endedAt:'2026-09-17 14:01:00',...c.RepeatPredictive.callMetadata(row),...patch};
    row.calls.push({callId:record.callId,at:record.endedAt,...c.RepeatPredictive.callMetadata(row)});row.followup=record.agentDisposition==='已完成沟通'?'已完成':'待继续跟进';c.saveBatches(batches);data.calls.push(record);
    return {task:c.first.task,row,call:record,batch,ref:{batchId:batch.id,itemId:row.id,taskId:row.taskId,callId:record.callId}};
  };
  c.installSelectionUi=()=>{
    const decode=value=>value.replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
    c.wizardCalls=[];c.wizardResult=true;c.uiState=null;c.closedLayers=[];
    c.PlatformUI.table=(columns,rows)=>'<table>'+rows.map(row=>'<tr>'+columns.map(column=>'<td>'+(column.render?column.render(row[column.key],row):c.PlatformUI.escape(row[column.key]))+'</td>').join('')+'</tr>').join('')+'</table>';
    c.PlatformUI.openLayer=(id,html)=>{
      const checkboxes=[...html.matchAll(/<input\b[^>]*name="repeat-source"[^>]*>/g)].map(match=>{
        const tag=match[0],value=tag.match(/\bvalue="([^"]*)"/);
        assert(value,'Generated checkbox must have a value');
        return {value:decode(value[1]),checked:/\schecked(?:\s|>)/.test(tag),disabled:/\sdisabled(?:\s|>)/.test(tag)};
      });
      c.uiState={id,html,checkboxes,ids:{'repeat-selected-count':{textContent:''},'repeat-continue':{disabled:false},'repeat-contact-note':{value:''}}};
    };
    c.PlatformUI.closeLayer=id=>{c.closedLayers.push(id);c.uiState=null;};
    c.document={getElementById:id=>c.uiState?.ids[id]||null,querySelectorAll:selector=>{
      if(!selector.startsWith('#repeat-predictive ')||!selector.includes('[name="repeat-source"]'))return [];
      let rows=c.uiState?.checkboxes||[];
      if(selector.includes(':checked'))rows=rows.filter(row=>row.checked);
      if(selector.includes(':not(:disabled)'))rows=rows.filter(row=>!row.disabled);
      return rows;
    }};
    c.CloudTaskWorkspace={startRepeatPredictive:spec=>{c.wizardCalls.push(clone(spec));assert(c.uiState,'Keep the selection visible until append succeeds');return c.wizardResult;}};
  };
  c.installDeletionAdapter=()=>{
    c.deleteCalls=[];
    c.CloudTaskWorkspace={deleteTask(id,confirmed){c.deleteCalls.push({id,confirmed});const task=data.tasks.find(row=>row.taskId===id);return task?c.CustomerTasks.releaseUnstartedTask(task):'DRAFT-DELETED';}};
    c.document={body:null,documentElement:{},querySelector:()=>null};
    c.MutationObserver=class{observe(){}};c.DemoSwitch={open(){}};
    vm.runInContext(fs.readFileSync(path.join(root,'js/components/alicti-adapter.js'),'utf8'),c);
  };
  return c;
}

check('客户接通且已结束时可在原任务继续，准确区分人工接听结果',()=>{for(const status of [42,43]){const c=fixture();c.first.call.status=status;const r=c.RepeatPredictive.validateSpec(c.spec());assert(r.ok,r.message);assert.equal(r.rows[0].humanAnswer,status===43);assert.equal(r.sourceTaskId,c.first.task.taskId);assert.equal(r.rows[0].repeatReason,status===42?'客户已接通，待人工跟进':'坐席约定再次联系');}});
check('客户未接通、未知接通及未结束不能成为来源',()=>{for(const patch of [{status:40},{status:undefined},{endedAt:''}]){const c=fixture();Object.assign(c.first.call,patch);assert.equal(c.RepeatPredictive.validateSpec(c.spec()).ok,false);}});
check('准备与提交不增加任务，不改原任务、原行及通话',()=>{const c=fixture(),tasks=JSON.stringify(c.CloudCallData.tasks),calls=JSON.stringify(c.CloudCallData.calls),before=c.batches(),p=c.prepare();assert(p.ok,p.message);assert.deepStrictEqual(c.batches(),before);assert(c.RepeatPredictive.commitAttachment(p));assert.equal(JSON.stringify(c.CloudCallData.tasks),tasks);assert.equal(JSON.stringify(c.CloudCallData.calls),calls);assert.deepStrictEqual(c.batches().slice(1),before);assert.equal(p.taskId,c.first.task.taskId);assert.equal(p.newBatch.rows[0].taskId,c.first.task.taskId);assert.notEqual(p.newBatch.id,c.first.batch.id);assert.notEqual(p.newBatch.rows[0].id,c.first.row.id);});
check('追加执行行保留精确线索编码与品牌，清空新执行状态',()=>{const c=fixture(),b=c.batches();b[0].rows[0].externalDocumentId=' 0012 ';b[0].rows[0].brandId='BRAND-EXPLICIT';c.saveBatches(b);const p=c.prepare();assert(p.ok,p.message);const row=p.newBatch.rows[0];assert.equal(row.externalDocumentId,' 0012 ');assert.equal(row.brandId,'BRAND-EXPLICIT');assert.equal(row.ownerId,'');assert.equal(row.activeCallId,'');assert.equal(row.followup,'待联系');assert.equal(row.calls.length,0);assert.equal(row.taskName,c.first.task.name);assert(c.RepeatPredictive.commitAttachment(p));});
check('旧行仅在批次持有业务类型与品牌时继承其真实归属',()=>{const c=fixture(),b=c.batches();delete b[0].rows[0].businessType;delete b[0].rows[0].brandId;b[0].brandId='BRAND-BATCH';c.saveBatches(b);const p=c.prepare();assert(p.ok);assert.equal(p.newBatch.rows[0].businessType,'lead');assert.equal(p.newBatch.rows[0].brandId,'BRAND-BATCH');assert(c.RepeatPredictive.commitAttachment(p));});
check('线索编码须为有效字符串，不能悄悄改变业务身份',()=>{for(const value of [12,' ',null]){const c=fixture(),b=c.batches();b[0].rows[0].externalDocumentId=value;c.saveBatches(b);assert.equal(c.prepare().ok,false);}});
check('新联系来源与业务轮次独立于供应商重呼',()=>{const c=fixture(),p=c.prepare(),row=p.newBatch.rows[0],meta=row.repeatContact;assert.equal(meta.sourceTaskId,c.first.task.taskId);assert.equal(meta.sourceItemId,c.first.row.id);assert.equal(meta.sourceBatchId,c.first.batch.id);assert.equal(meta.sourceCallId,c.first.call.callId);assert.equal(meta.rootItemId,c.first.row.id);assert.equal(meta.businessContactNo,2);for(const key of ['round','retrystrategy','attemptNumber'])assert(!Object.hasOwn(row,key)&&!Object.hasOwn(meta,key));assert.equal(c.RepeatPredictive.callMetadata(row).repeatContact.businessContactNo,2);});
check('原任务预约设置保持不变，不将旧启动时间冒充本次联系时间',()=>{for(const scheduleAt of ['手工启动','2026-09-17 14:00']){const c=fixture();c.first.task.scheduleAt=scheduleAt;const p=c.prepare();assert(p.ok);assert.equal(p.newBatch.rows[0].repeatContact.plannedAt,'');assert.equal(c.first.task.scheduleAt,scheduleAt);}});
check('同一任务的多个客户可以批量追加',()=>{const c=fixture(),second=c.addSource({task:c.first.task}),p=c.prepare(c.first.task,c.spec([c.first,second]));assert(p.ok,p.message);assert.equal(p.newBatch.rows.length,2);assert(c.RepeatPredictive.commitAttachment(p));assert.equal(c.CloudCallData.tasks.length,1);assert(p.newBatch.rows.every(row=>row.taskId===c.first.task.taskId));});
check('不同任务不能合选，也不能缺省或伪造原任务ID',()=>{const c=fixture(),second=c.addSource();for(const spec of [c.spec([c.first,second]),{...c.spec(),sourceTaskId:''},{...c.spec(),sourceTaskId:second.task.taskId},{...c.spec(),sourceRefs:[null]}])assert.equal(c.RepeatPredictive.validateSpec(spec).ok,false);});
check('新建任务和同租户其他任务不能承接再次联系',()=>{const c=fixture(),other=c.addSource(),before=c.store.get(key);for(const task of [c.newTask(),other.task,{...c.first.task,tenantId:'T2'},{...c.first.task,enterpriseId:'OTHER'}])assert.equal(c.prepare(task).ok,false);assert.equal(c.store.get(key),before);});
check('同任务同号码不能批量混合业务记录或重复选择来源',()=>{const c=fixture(),second=c.addSource({task:c.first.task,phone:c.first.row.phone,row:{externalDocumentId:'OTHER-LEAD'}});assert.equal(c.RepeatPredictive.validateSpec(c.spec([c.first,second])).ok,false);assert.equal(c.RepeatPredictive.validateSpec(c.spec([c.first,c.first])).ok,false);assert(c.prepare(c.first.task,c.spec([second])).ok);});
check('等待池不会用其他任务的同号同线索覆盖来源或完成结果',()=>{for(const status of [42,43,40]){const c=fixture(),second=c.addSource({phone:c.first.row.phone,row:{externalDocumentId:c.first.row.externalDocumentId,followup:'已完成'},status,call:{agentDisposition:'已完成沟通',ringingAt:'2026-09-17 11:00:00'}});const waiting=c.RepeatPredictive.sources({waiting:true});assert(waiting.some(row=>row.id===c.first.row.id));assert(c.RepeatPredictive.validateSpec(c.spec()).ok);if(status===42)assert(waiting.some(row=>row.id===second.row.id));assert.equal(c.RepeatPredictive.sources({taskId:c.first.task.taskId,waiting:true}).length,1);}});
check('同任务同业务的等待原因只取最近通话且旧来源失效',()=>{const c=fixture(),latest=c.addSource({task:c.first.task,phone:c.first.row.phone,row:{externalDocumentId:c.first.row.externalDocumentId},status:42,call:{ringingAt:'2026-09-17 11:00:00',agentDisposition:''}}),waiting=c.RepeatPredictive.sources({waiting:true});assert.equal(waiting.length,1);assert.equal(waiting[0].id,latest.row.id);assert.equal(waiting[0].repeatReason,'客户已接通，待人工跟进');assert.equal(c.RepeatPredictive.validateSpec(c.spec()).ok,false);});
check('同任务最新联系完成或未接通时不复活更早等待要求',()=>{for(const status of [40,43]){const c=fixture();c.addSource({task:c.first.task,phone:c.first.row.phone,row:{externalDocumentId:c.first.row.externalDocumentId,followup:'已完成'},status,call:{agentDisposition:'已完成沟通',ringingAt:'2026-09-17 11:00:00'}});assert.equal(c.RepeatPredictive.sources({waiting:true}).length,0);assert.equal(c.RepeatPredictive.validateSpec(c.spec()).ok,false);}});
check('同任务不同业务或品牌保留各自等待来源',()=>{const c=fixture();c.addSource({task:c.first.task,phone:c.first.row.phone,row:{externalDocumentId:'ANOTHER-LEAD'}});c.addSource({task:c.first.task,phone:c.first.row.phone,row:{externalDocumentId:c.first.row.externalDocumentId,brandId:'BRAND-OTHER'}});assert.equal(c.RepeatPredictive.sources({waiting:true}).length,3);});
check('业务轮次不会从其他任务同号同线索继承',()=>{const c=fixture();c.addSource({phone:c.first.row.phone,row:{externalDocumentId:c.first.row.externalDocumentId,repeatContact:{businessContactNo:9,rootItemId:'OTHER-ROOT'}}});assert.equal(c.prepare().newBatch.rows[0].repeatContact.businessContactNo,2);});
check('同任务再次联系完成后可追加第三次，来源和历史轮次保持准确',()=>{const c=fixture(),p=c.prepare();assert(c.RepeatPredictive.commitAttachment(p));const second=c.completeAppend(p),third=c.prepare(c.first.task,c.spec([second]));assert(third.ok,third.message);assert.equal(third.newBatch.rows[0].repeatContact.businessContactNo,3);assert.equal(third.newBatch.rows[0].repeatContact.rootItemId,c.first.row.id);assert.equal(third.newBatch.rows[0].repeatContact.sourceCallId,second.call.callId);assert.equal(c.RepeatPredictive.contactLabel(c.first.call),'第 1 次联系');assert.equal(c.RepeatPredictive.contactLabel(second.call),'第 2 次联系');assert(c.RepeatPredictive.commitAttachment(third));assert.equal(c.RepeatPredictive.contactLabel(c.first.call),'第 1 次联系');});
check('未执行追加回滚后不虚增业务轮次',()=>{const c=fixture(),p=c.prepare();assert(c.RepeatPredictive.commitAttachment(p));assert(c.RepeatPredictive.rollbackAttachment(p));assert.equal(c.prepare().newBatch.rows[0].repeatContact.businessContactNo,2);});
check('同任务待执行记录阻止重复安排且识别规范化号码',()=>{for(const patch of [{},{phone:'+86 13800000001'},{pendingRetry:true},{pendingCall:true},{activeCallId:'ACTIVE'}]){const c=fixture();c.addPending(patch);assert.equal(c.prepare().ok,false);}});
check('其他任务的待执行、活动通话和话后处理不占用本任务',()=>{for(const patch of [{},{activeCallId:'ACTIVE'},{pendingRetry:true},{pendingCall:true}]){const c=fixture(),other=c.newTask({status:'执行中'});c.addPending(patch,other);assert(c.prepare().ok);}for(const patch of [{endedAt:''},{processingStatus:'待填写'}]){const c=fixture();c.CloudCallData.calls.push({...c.first.call,callId:'OTHER-ACTIVE',taskId:'OTHER',customerTaskItemId:'OTHER',...patch});assert(c.prepare().ok);}});
check('本任务正在通话或话后处理未完成不能再次安排',()=>{for(const patch of [{endedAt:''},{processingStatus:'待填写'}]){const c=fixture();c.CloudCallData.calls.push({...c.first.call,callId:'CURRENT-ACTIVE',customerTaskItemId:'OTHER',...patch});assert.equal(c.prepare().ok,false);}});
check('旧excludeTaskId参数不能绕过本任务占用',()=>{const c=fixture();c.addPending();assert.equal(c.RepeatPredictive.validateSpec(c.spec(),{excludeTaskId:c.first.task.taskId}).ok,false);});
check('跨任务拒绝联系和号码拒绝标记仍全局生效',()=>{for(const fromCall of [false,true]){const c=fixture();if(fromCall)c.CloudCallData.calls.push({...c.first.call,callId:'REFUSAL',taskId:'OTHER',customerTaskItemId:'OTHER',agentDisposition:'客户拒绝联系'});else c.CloudCallData.nativeWorkbench.blockedNumbers.push({tenantId:'T1',phone:c.first.row.phone});assert.equal(c.prepare().ok,false);}});
check('待启动、执行中和暂停均可追加且保持原状态和配置',()=>{for(const status of ['待启动','执行中','已暂停']){const c=fixture();Object.assign(c.first.task,{status,providerStatusCode:status==='待启动'?0:status==='执行中'?1:2,stopNewDialing:status!=='执行中',retryPolicy:{rounds:[1,2]},planSnapshot:{id:'FROZEN'}});const before=JSON.stringify(c.first.task),p=c.prepare();assert(p.ok,p.message);assert(c.RepeatPredictive.commitAttachment(p));assert.equal(JSON.stringify(c.first.task),before);}});
check('结束、完成、终止、删除、草稿及异常任务不能追加或重新开启',()=>{for(const status of ['已完成','已结束','已终止','已删除','待分配客户','草稿','异常','资源不足暂停']){const c=fixture();c.first.task.status=status;const before=JSON.stringify(c.first.task);assert.equal(c.prepare().ok,false,status);assert.equal(c.RepeatPredictive.listTaskAction(c.first.task),'');assert.equal(JSON.stringify(c.first.task),before);}});
check('供应商终态、未知状态或状态待核对阻止追加',()=>{for(const patch of [{providerStatusCode:3},{providerStatusCode:'3'},{alictiMockTaskProperty:{status:3}},{alictiControlResponse:{result:0,data:{taskProperty:{status:3}}}},{providerStatusCode:99},{alictiTaskControlPending:true},{displayOnly:true},{isWizardDraft:true}]){const c=fixture();Object.assign(c.first.task,patch);assert.equal(c.prepare().ok,false);}});
check('提交时重核最新任务状态，不接受过期任务副本',()=>{for(const patch of [{status:'已完成'},{providerStatusCode:3},{alictiTaskControlPending:true},{tenantId:'T2'}]){const c=fixture(),old=clone(c.first.task),p=c.prepare(),before=c.store.get(key);Object.assign(c.first.task,patch);assert.equal(c.prepare(old).ok,false);assert.equal(c.RepeatPredictive.commitAttachment(p),false);assert.equal(c.store.get(key),before);}});
check('目标任务消失或主键存在歧义时提交失败关闭',()=>{for(const duplicate of [false,true]){const c=fixture(),p=c.prepare(),before=c.store.get(key);if(duplicate)c.CloudCallData.tasks.push(clone(c.first.task));else c.CloudCallData.tasks.length=0;assert.equal(c.RepeatPredictive.commitAttachment(p),false);assert.equal(c.store.get(key),before);}});
check('普通坐席仅可安排本人可见来源，管理员保留租户范围',()=>{const c=fixture(),other=c.addSource({task:c.first.task,accountId:'A2'});c.state.role='OPERATOR';assert(c.prepare().ok);assert.equal(c.prepare(c.first.task,c.spec([other])).ok,false);c.state.role='ADMIN';assert(c.prepare(c.first.task,c.spec([other])).ok);c.state.tenantId='T2';assert.equal(c.prepare().ok,false);});
check('超级管理员也不能把不同租户或任务混合提交',()=>{const c=fixture(),other=c.addSource({tenantId:'T2'});c.state.role='SUPER_ADMIN';assert.equal(c.RepeatPredictive.validateSpec(c.spec([c.first,other])).ok,false);});
check('失去登录、权限或切换业务域后无法提交',()=>{for(const patch of [{ready:false},{valid:false},{canCreate:false},{activeDomain:'OTHER_DOMAIN'}]){const c=fixture(),p=c.prepare();Object.assign(c.state,patch);assert.equal(c.RepeatPredictive.validateSpec(c.spec()).ok,false);assert.equal(c.RepeatPredictive.commitAttachment(p),false);}});
check('切换账号、租户或企业后不能提交或回滚他人准备记录',()=>{for(const patch of [{accountId:'A2'},{tenantId:'T2'},{enterpriseId:'OTHER'}]){const c=fixture(),p=c.prepare();assert(c.RepeatPredictive.commitAttachment(p));Object.assign(c.state,patch);assert.equal(c.RepeatPredictive.commitAttachment(p),false);assert.equal(c.RepeatPredictive.rollbackAttachment(p),false);}});
check('同一追加附件重复提交保持幂等',()=>{const c=fixture(),p=c.prepare();assert(c.RepeatPredictive.commitAttachment(p));const before=c.store.get(key);assert(c.RepeatPredictive.commitAttachment(clone(p)));assert.equal(c.store.get(key),before);assert.equal(c.batches().length,2);});
check('并行准备同一来源只能提交一次',()=>{const c=fixture(),first=c.prepare(),second=c.prepare();assert(c.RepeatPredictive.commitAttachment(first));assert.equal(c.RepeatPredictive.commitAttachment(second),false);assert.equal(c.batches().length,2);});
check('并行追加同任务不同客户可分别成功',()=>{const c=fixture(),second=c.addSource({task:c.first.task}),a=c.prepare(),b=c.prepare(c.first.task,c.spec([second]));assert(c.RepeatPredictive.commitAttachment(a));assert(c.RepeatPredictive.commitAttachment(b));assert.equal(c.batches().length,4);});
check('准备后新增其他任务同号安排不影响提交',()=>{const c=fixture(),p=c.prepare();c.addPending({},c.newTask({status:'执行中'}));assert(c.RepeatPredictive.commitAttachment(p));});
check('准备后新增本任务同号安排会阻止过期提交',()=>{const c=fixture(),p=c.prepare();c.addPending();const before=c.store.get(key);assert.equal(c.RepeatPredictive.commitAttachment(p),false);assert.equal(c.store.get(key),before);});
check('准备后的原行、业务编码或来源通话变化不能提交旧快照',()=>{for(const change of ['note','externalDocumentId','call','latest']){const c=fixture(),p=c.prepare();if(change==='call')c.first.call.dispositionRemark='已重新约定';else if(change==='latest')c.CloudCallData.calls.push({...c.first.call,callId:'LATEST',ringingAt:'2026-09-17 12:00:00'});else{const b=c.batches();b[0].rows[0][change]='CHANGED';c.saveBatches(b);}const before=c.store.get(key);assert.equal(c.RepeatPredictive.commitAttachment(p),false);assert.equal(c.store.get(key),before);}});
check('提交不能篡改执行行身份、来源轮次、备注或历史',()=>{for(const edit of [row=>row.taskId='OTHER',row=>row.brandId='OTHER',row=>row.repeatContact.businessContactNo=99,row=>row.repeatContact.rootItemId='UNRELATED',row=>row.note='TAMPERED',row=>row.history=[]]){const c=fixture(),p=c.prepare();edit(p.newBatch.rows[0]);p.changes[0].after=clone(p.newBatch.rows[0]);assert.equal(c.RepeatPredictive.commitAttachment(p),false);}});
check('旧版跨任务附件和缺失来源快照的附件不能绕过校验',()=>{for(const mutate of [p=>p.taskId='NEW-TASK',p=>p.spec.sourceTaskId='OTHER',p=>delete p.sourceSnapshots]){const c=fixture(),p=c.prepare();mutate(p);assert.equal(c.RepeatPredictive.commitAttachment(p),false);assert.equal(c.batches().length,1);}});
check('存储失败不占用来源，恢复后可重试同一附件',()=>{const c=fixture(),p=c.prepare(),before=c.store.get(key);c.failWrite=true;assert.equal(c.RepeatPredictive.commitAttachment(p),false);assert.equal(c.store.get(key),before);c.failWrite=false;assert(c.RepeatPredictive.commitAttachment(p));});
check('回滚可重复且仅移除本次追加批次',()=>{const c=fixture(),p=c.prepare();assert(c.RepeatPredictive.commitAttachment(p));const b=c.batches();b.find(batch=>batch.id===c.first.batch.id).rows[0].note='其他操作的新备注';c.saveBatches(b);assert(c.RepeatPredictive.rollbackAttachment(p));assert(c.RepeatPredictive.rollbackAttachment(clone(p)));assert.equal(c.batches().length,1);assert.equal(c.batches()[0].rows[0].note,'其他操作的新备注');assert.equal(c.CloudCallData.tasks.length,1);});
check('回滚失败不丢记录，序列化记录可恢复',()=>{const c=fixture(),p=c.prepare();assert(c.RepeatPredictive.commitAttachment(p));c.failWrite=true;assert.equal(c.RepeatPredictive.rollbackAttachment(p),false);assert.equal(c.batches().length,2);c.failWrite=false;assert(c.RepeatPredictive.rollbackAttachment(clone(p)));});
check('已编辑、已开始或已有迟到话单的追加记录不能回滚删除',()=>{for(const variant of ['edited','active','call']){const c=fixture(),p=c.prepare();assert(c.RepeatPredictive.commitAttachment(p));if(variant==='call')c.CloudCallData.calls.push({...c.first.call,callId:'DELAYED',customerTaskItemId:p.newBatch.rows[0].id});else{const b=c.batches();b[0].rows[0][variant==='active'?'activeCallId':'note']='CHANGED';c.saveBatches(b);}const before=c.store.get(key);assert.equal(c.RepeatPredictive.rollbackAttachment(p),false);assert.equal(c.store.get(key),before);}});
check('任务进入终态后允许恢复未执行追加写入但不改任务终态',()=>{const c=fixture(),p=c.prepare();assert(c.RepeatPredictive.commitAttachment(p));c.first.task.status='已终止';assert.equal(c.RepeatPredictive.commitAttachment(p),false);assert(c.RepeatPredictive.rollbackAttachment(p));assert.equal(c.first.task.status,'已终止');});
check('客户名单存储损坏时失败关闭而不覆盖原始值',()=>{const c=fixture(),p=c.prepare();c.store.set(key,'{broken');assert.equal(c.RepeatPredictive.validateSpec(c.spec()).ok,false);assert.equal(c.RepeatPredictive.commitAttachment(p),false);assert.equal(c.RepeatPredictive.rollbackAttachment(p),false);assert.equal(c.store.get(key),'{broken');});
check('统一附件入口支持坐席原任务追加及回滚，执行名单含原行和新行',()=>{const c=fixture();c.state.role='OPERATOR';c.loadCustomerTasks();const p=c.prepare();assert(c.CustomerTasks.commitTaskAttachment(p));assert.equal(c.CustomerTasks.taskExecutionCustomers(c.first.task).length,2);assert(c.CustomerTasks.taskCustomers(c.first.task).some(row=>row.id===p.newBatch.rows[0].id));assert(c.CustomerTasks.rollbackTaskAttachment(p));assert.equal(c.CustomerTasks.taskExecutionCustomers(c.first.task).length,1);});
check('原任务不能被再次联系的旧删除入口释放',()=>{const c=fixture();c.loadCustomerTasks();const {task}=c.createOwnRepeatTask(),before=c.store.get(key);assert.equal(c.RepeatPredictive.releaseTask(task),false);assert.equal(c.CustomerTasks.releaseUnstartedTask(task),false);assert.equal(c.store.get(key),before);});
check('全局待联系入口移除，任务入口只显示当前任务数量',()=>{const c=fixture();c.addSource();assert.equal(c.RepeatPredictive.listAction(),'');const html=c.RepeatPredictive.listTaskAction(c.first.task);assert(html.includes('待再次联系 · 1'));assert(html.includes(c.first.task.taskId));assert(!html.includes('SOURCE-TASK-2'));assert(c.RepeatPredictive.taskToolbar(c.first.task).includes('待再次联系 · 1'));});
check('单客户档案只有一个原任务时直接打开该任务',()=>{const c=fixture(),customer=c.CustomerDirectory.list()[0],html=c.RepeatPredictive.customerActions(customer);assert(html.includes(c.first.task.taskId));assert(html.includes('本任务再次联系'));});
check('跨任务客户档案必须先选任务，不出现合并勾选',()=>{const c=fixture();c.addSource({phone:c.first.row.phone,row:{externalDocumentId:c.first.row.externalDocumentId}});c.installSelectionUi();const customer=c.CustomerDirectory.list()[0];assert(c.RepeatPredictive.customerActions(customer).includes('按任务再次联系'));assert(c.RepeatPredictive.open({customerId:customer.id}));assert(c.uiState.html.includes('选择原任务'));assert.equal(c.uiState.checkboxes.length,0);assert.equal(c.RepeatPredictive.continueToWizard(),false);assert.equal(c.wizardCalls.length,0);});
check('任务弹窗显示原任务与加入本任务，成功才关闭',()=>{const c=fixture();c.installSelectionUi();assert(c.RepeatPredictive.open({taskId:c.first.task.taskId,itemId:c.first.row.id}));assert(c.uiState.html.includes('本任务再次联系'));assert(c.uiState.html.includes('加入本任务'));assert(c.uiState.html.includes(c.first.task.name));assert(!c.uiState.html.includes('新建任务'));assert(c.uiState.checkboxes[0].checked);c.uiState.ids['repeat-contact-note'].value='  明天下午联系  ';assert(c.RepeatPredictive.continueToWizard());assert.equal(c.wizardCalls[0].sourceTaskId,c.first.task.taskId);assert.deepStrictEqual(c.wizardCalls[0].sourceRefs,[c.first.ref]);assert.equal(c.wizardCalls[0].note,'明天下午联系');assert.equal(c.closedLayers.length,1);assert.equal(c.uiState,null);});
check('同任务批量勾选保留来源引用且排除被占用客户',()=>{const c=fixture(),second=c.addSource({task:c.first.task});c.addPending();c.installSelectionUi();assert(c.RepeatPredictive.open({taskId:c.first.task.taskId}));assert.equal(c.uiState.checkboxes.filter(row=>row.disabled).length,1);c.RepeatPredictive.selectAll(true);assert.equal(c.uiState.ids['repeat-selected-count'].textContent,'已选择 1 位');assert(c.RepeatPredictive.continueToWizard());assert.deepStrictEqual(c.wizardCalls[0].sourceRefs,[second.ref]);});
check('追加失败保留当前选择与备注，不另开任务向导',()=>{const c=fixture();c.installSelectionUi();c.wizardResult=false;assert(c.RepeatPredictive.open({taskId:c.first.task.taskId,itemId:c.first.row.id}));c.uiState.ids['repeat-contact-note'].value='保留备注';const ui=c.uiState;assert.equal(c.RepeatPredictive.continueToWizard(),false);assert.equal(c.uiState,ui);assert(c.uiState.checkboxes[0].checked);assert.equal(c.uiState.ids['repeat-contact-note'].value,'保留备注');assert.equal(c.closedLayers.length,0);});
check('选择后切换账号、任务结束或出现本任务冲突须重新选择',()=>{for(const edit of [c=>c.state.accountId='A2',c=>c.first.task.status='已完成',c=>c.addPending()]){const c=fixture();c.installSelectionUi();assert(c.RepeatPredictive.open({taskId:c.first.task.taskId,itemId:c.first.row.id}));edit(c);assert.equal(c.RepeatPredictive.continueToWizard(),false);assert.equal(c.wizardCalls.length,0);assert(c.uiState);}});
check('通话与客户入口不放开终态或他人来源',()=>{const c=fixture();assert(c.RepeatPredictive.callAction(c.first.call));c.first.task.status='已完成';assert.equal(c.RepeatPredictive.callAction(c.first.call),'');assert.equal(c.RepeatPredictive.rowAction(c.first.task,c.first.row),'');assert.equal(c.RepeatPredictive.customerActions(c.CustomerDirectory.list()[0]),'');});

console.log(JSON.stringify({result:failures.length?'fail':'pass',count:checks.length,checks,failures},null,2));
if(failures.length)process.exitCode=1;
