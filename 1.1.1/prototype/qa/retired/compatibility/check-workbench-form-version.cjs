/* Real workbench lifecycle, call state, receiving, customer journal and business form versions.
 * Only browser/telephone surroundings are simulated. No network or real browser data is used. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const {harness,copy}=require(path.join(base,'qa/check-local-series-followup.cjs'));
let passed=0;
const check=(condition,message)=>{assert.ok(condition,message);passed++;};
function setup(initial={}){
 const h=harness(),w=h.win,d=w.CloudCallData,session=new Map(initial.session||[]),timers=new Map();let timerId=0;
 h.document.body.innerHTML='';d.calls=[];d.tasks=[];d.predictiveTasks=[];d.ivrTasks=[];d.physicalSkillGroups=[];d.agentSkills=[];
 const tenant=d.tenants.find(row=>row.tenantId===h.scope.tenantId),account={accountId:h.state.accountId,status:'启用'};
 const agent={...h.scope,accountId:account.accountId,contactCenterIdentityId:'FORM-VERSION-SEAT',userName:'模拟客服',cno:'001',lifecycleStatus:'已启用',callEnabled:true,acceptNewTasks:true,syncStatus:'同步成功',currentEndpoint:'NATIVE_WORKBENCH',currentCall:false,agentStatus:'空闲'};
 d.agents=[agent];
 Object.assign(w.AppState,{account:()=>account,currentTenant:()=>tenant,subscribe(){},canAction:()=>true,scoped:rows=>rows.filter(row=>row.tenantId===h.scope.tenantId&&String(row.enterpriseId)===String(h.scope.enterpriseId))});
 w.localStorage.removeItem=key=>h.storage.delete(key);
 if(initial.storage){h.storage.clear();for(const [key,value]of initial.storage)h.storage.set(key,value);}
 w.sessionStorage={getItem:key=>session.get(key)??null,setItem:(key,value)=>session.set(key,String(value)),removeItem:key=>session.delete(key)};
 w.setTimeout=(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;};w.clearTimeout=id=>timers.delete(id);w.setInterval=()=>++timerId;w.clearInterval=()=>{};
 w.ResizeObserver=class{observe(){}disconnect(){}};w.location={hash:'#seat-workbench'};
 const augment=node=>{node.classList.add=(...items)=>items.forEach(item=>node.classList.toggle(item,true));node.classList.remove=(...items)=>items.forEach(item=>node.classList.toggle(item,false));node.append=child=>node.appendChild(child);node.style.setProperty=(key,value)=>{node.style[key]=value;};node.style.removeProperty=key=>{delete node.style[key];};node.getBoundingClientRect=()=>({height:50});return node;};
 augment(h.document.body);h.document.createElement=tag=>augment(new h.document.body.constructor(tag,{},h.document));
 Object.assign(w.PlatformUI,{help:()=>'',nextLayerZIndex:()=>100,callTypeLabel:value=>value});
 Object.assign(w.CustomerDirectory,{phoneOf:row=>row?.direction==='呼入'?row.caller:row?.callee||row?.customerPhone,normalizePhone:value=>String(value).replace(/[\s-]/g,''),list:()=>[],sync(){}});
 w.ManualSkillAccess={numbers:()=>[{number:'02100000000',numberId:'FORM-VERSION-NUMBER'}]};
 w.AliCtiSeatOperations={canDial:()=>true,canReceive:()=>true,connectionStatus:()=>({blocked:false}),enterWrapup(){},status:()=>({}),invalidate(){},managementState:()=>({})};
 w.SeatOperationUI={presence:()=> '空闲',wrapupControl:()=>'',afterRecordSaved(){agent.agentStatus='空闲';},controls:()=>'',notice:()=>'',isBusy:()=>false};
 w.AliCtiAdapter={session:{...h.scope,accountId:account.accountId,cno:agent.cno,bindType:3,mock:true},previewOutcall:()=>({ok:true,requestUniqueId:'FORM-VERSION-REQUEST'})};
 w.CloudCallSync={begin(){},read:()=>null,restore(){}};w.CloudCallRuntime={addAudit(){}};
 Object.assign(w.RouteRuntime,{snapshot:()=>null,back(){},refreshCurrent(){}});w.navigateTo=()=>{};
 const load=file=>vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),w,{filename:file});
 for(const file of ['js/components/alicti-number-status.js','js/components/alicti-fields.js','js/components/call-state.js','js/components/alicti-receiving.js','js/pages/customer-tasks.js'])load(file);
 function loadWorkbench(){
  let source=fs.readFileSync(path.join(base,'js/pages/agent-workbench.js'),'utf8');
  source=source.replace(/\}\)\(\);\s*$/,`window.__formVersionWorkbenchQA={state:()=>({call,phase,followup,disposition,remark,error,draft,followupVersion}),activateDemoPhone(){online=true;seatId=myAgent().contactCenterIdentityId;},persist,ensureScope};})();`);
  vm.runInContext(source,w,{filename:'js/pages/agent-workbench.js'});
  w.AgentWorkbench.current();w.__formVersionWorkbenchQA.activateDemoPhone();return w.AgentWorkbench;
 }
 let A=loadWorkbench();
 function seed(kind='manual',type='lead'){
  const item={id:'FORM-ITEM-'+kind,name:'模拟客户',phone:'13800009001',businessType:type,externalDocumentId:'DOC-'+kind,method:kind==='predictive'?'预外呼':'人工外呼',ownerId:kind==='predictive'?'':account.accountId,taskId:kind==='predictive'?'FORM-PREDICTIVE':'',followup:'待联系',activeCallId:'',calls:[],history:[]};
  const batch={id:'FORM-BATCH-'+kind,name:'模拟名单',...h.scope,rows:[item]};
  h.storage.set('customer-task-batches-v1',JSON.stringify([batch]));
  if(kind==='predictive')d.tasks.push({taskId:item.taskId,...h.scope,name:'模拟预外呼任务',callType:'预外呼',status:'运行中',simulation:true,executionConfig:{callGroupType:1,cnos:[agent.cno]}});
  return {item,batch};
 }
 function offer(kind='inbound',type='lead'){
  const linked=kind==='predictive'?seed(kind,type):null;
  const payload={kind,...h.scope,accountId:account.accountId,cno:agent.cno,contactId:'CONTACT-'+kind,callId:'CALL-'+kind,customerNumber:'13800009001',customerName:'模拟来电客户',hotline:'02100000000',mock:true,...(linked?{taskId:linked.item.taskId,customerTaskItemId:linked.item.id,customerBatchId:linked.batch.id}:{})};
  check(A.receiveOffer(payload)===true,kind+' offer starts through actual validation and customer journal');
  return w.__formVersionWorkbenchQA.state().call;
 }
 function preview(type=''){
  if(type){const {item}=seed('manual',type);A.selectAssigned(item);}else{A.openTemporary();A.updateField('customerName','模拟预览客户');A.updateField('phone','13800009002');}
  check(A.dial()===true,'actual preview/task dialing starts');return w.__formVersionWorkbenchQA.state().call;
 }
 function connect(){const call=w.__formVersionWorkbenchQA.state().call;if(call.workbenchKind){check(A.receiveStatus({...call,kind:call.workbenchKind,stateAction:call.workbenchKind==='inbound'?'busyIb':'busyOb',source:'local-simulation',mock:true})===true,'actual receiving status establishes conversation');}else{const entry=[...timers].find(([,value])=>value.ms===2400);check(!!entry,'outbound answer timer exists');timers.delete(entry[0]);entry[1].fn();}}
 function choose(fieldId,value){const input=h.document.getElementById('seat-followup-'+fieldId);check(!!input,'actual workbench-generated field is present');input.value=value;w.eventNode=input;vm.runInContext('(function(){'+input.getAttribute('onchange')+'}).call(eventNode)',w);delete w.eventNode;}
 return {...h,w,d,session,agent,account,tenant,seed,offer,preview,connect,choose,peek:()=>w.__formVersionWorkbenchQA.state(),get A(){return A;},reload(){h.document.body.innerHTML='';A=loadWorkbench();return A;}};
}
function field(h){return h.M.localSeriesField(h.peek().call,'lead');}
function updateAdministrator(h){
 const live=h.M.localSeriesField(h.scope),old=copy(live.options[0]);live.options[0].label='管理员新车系';live.options[0].businessKey='NEW-2026';
 check(h.M.saveField(live,h.scope).ok,'administrator changes current local option');
 const category=h.M.get('lead',h.scope);category.label='新线索类别';category.fields.find(row=>row.fieldId===live.id).required=true;category.fields.find(row=>row.fieldId==='plannedStoreName').enabled=false;
 check(h.M.save(category,h.scope).ok,'administrator changes current category label, requiredness and visibility');
 return {id:live.id,old};
}
function finish(h){h.A.end();check(h.peek().phase==='wrap','actual workbench reaches wrap');h.A.setDisposition('已完成沟通');h.A.saveDisposition();check(h.peek().phase==='idle'&&h.peek().call===null,'actual save completes wrap and releases the active call');}

for(const kind of ['preview','manual','inbound','predictive']){
 const h=setup(),call=kind==='preview'?h.preview():kind==='manual'?h.preview('lead'):h.offer(kind),id=call.callId;
 check(!!call.businessFormVersion,kind+': form version binds before the first native call record');
 check(JSON.parse(h.storage.get('native-workbench-records-v1')).find(row=>row.callId===id).businessFormVersion,kind+': initial call journal includes the binding');
 if(kind==='inbound')h.connect();
 if(!call.businessType)h.A.setFollowup('businessType','lead');
 h.A.openDialog();const original=copy(field(h).options[0]);h.choose(field(h).id,original.id);h.A.setFollowup('plannedStoreName','本通话计划门店');h.A.setRemark('保留沟通备注');
 const changed=updateAdministrator(h),version=JSON.stringify(call.businessFormVersion);
 check(field(h).options[0].businessKey===original.businessKey,kind+': current call keeps its original option meaning');
 check(h.M.get('lead',call).label!=='新线索类别'&&h.M.fields('lead',call).some(row=>row.id==='plannedStoreName'),kind+': current call keeps category label and field visibility');
 if(kind!=='inbound')h.connect();finish(h);
 const saved=h.d.calls.find(row=>row.callId===id),selected=saved.customerFollowup.businessFieldSnapshot.fields.find(row=>row.fieldId===changed.id).selectedOptions[0];
 check(selected.businessOptionCode===original.businessKey&&selected.optionName===original.label,kind+': saved business snapshot uses the old code and name');
 check(saved.customerFollowup.plannedStoreName==='本通话计划门店'&&saved.dispositionRemark==='保留沟通备注',kind+': completed record retains other draft values');
 check(JSON.stringify(saved.businessFormVersion)===version,kind+': wrap and completed call retain the exact bound version');
 const next=h.preview();h.A.setFollowup('businessType','lead');h.A.openDialog();
 check(field(h).options[0].businessKey==='NEW-2026'&&!h.M.fields('lead',next).some(row=>row.id==='plannedStoreName'),kind+': next call adopts the administrator version');
 check(h.M.fields('lead',next).find(row=>row.id===changed.id).required===true,kind+': new requiredness applies only to the next call');
 h.choose(field(h).id,field(h).options[0].id);h.connect();finish(h);
}
{
 const h=setup(),call=h.preview();check(call.businessType==='','untyped preview begins without a fixed business type');
 const version=JSON.stringify(call.businessFormVersion);updateAdministrator(h);
 h.A.setFollowup('businessType','lead');check(h.peek().followup.businessType==='lead','later type selection reads the directory frozen at call start');
 check(field(h).options[0].businessKey!=='NEW-2026'&&JSON.stringify(call.businessFormVersion)===version,'later type selection does not capture the newer directory');
}
for(const mode of ['session','journal']){
 const h=setup(),call=h.preview('lead'),version=JSON.stringify(call.businessFormVersion);h.A.openDialog();const local=field(h);h.choose(local.id,local.options[0].id);h.A.setFollowup('plannedStoreName','刷新前草稿');h.A.setRemark('刷新前备注');h.connect();h.A.end();h.A.setDisposition('已完成沟通');
 updateAdministrator(h);
 if(mode==='journal')h.session.clear();
 h.reload();
 check(h.peek().phase==='wrap'&&h.peek().call.callId===call.callId,mode+': actual restoration resumes the same wrap call');
 check(JSON.stringify(h.peek().call.businessFormVersion)===version,mode+': restored call keeps the original bound directory');
 if(mode==='session')check(h.peek().followup.plannedStoreName==='刷新前草稿'&&h.peek().remark==='刷新前备注',mode+': existing session draft survives restoration');
 h.A.openDialog();if(mode==='journal'){h.A.setFollowup(local.id,local.options[0].id);h.A.setDisposition('已完成沟通');}
 h.A.saveDisposition();check(h.peek().phase==='idle',mode+': restored call can finish after current configuration changed');
}
{
 const h=setup(),call=h.preview('lead');h.A.setFollowup('plannedStoreName','旧演示正在填写');delete call.businessFormVersion;
 const record=JSON.parse(h.storage.get('native-workbench-records-v1'));delete record.find(row=>row.callId===call.callId).businessFormVersion;h.storage.set('native-workbench-records-v1',JSON.stringify(record));
 h.A.current();const version=JSON.stringify(call.businessFormVersion);
 check(!!call.businessFormVersion&&h.peek().followup.plannedStoreName==='旧演示正在填写','an active unbound demo adopts a version without clearing its current draft');
 check(JSON.parse(h.storage.get('native-workbench-records-v1')).find(row=>row.callId===call.callId).businessFormVersion,'the first adopted version is persisted to the existing call journal');
 updateAdministrator(h);h.A.current();check(JSON.stringify(call.businessFormVersion)===version,'subsequent same-scope reads cannot replace the adopted version');
}
{
 const h=setup(),call=h.preview('lead'),before=JSON.stringify(call.businessFormVersion),draft=JSON.stringify(h.peek().followup);
 const fresh=h.M.captureCallForm(h.M.liveFormSource(call));check(fresh.ok,'fixture can capture a fresh version for the same call identity');
 const rejected=h.A.persistBusinessForm({...call,businessFormVersion:fresh.version});
 check(!rejected.ok&&JSON.stringify(call.businessFormVersion)===before&&JSON.stringify(h.peek().followup)===draft,'the public repair bridge cannot replace a normally valid bound version');
 check(!h.A.persistBusinessForm({...call,callId:'ANOTHER-CALL'}).ok,'the repair bridge rejects a different call identity');
 h.setValid(false);check(!h.A.persistBusinessForm(copy(call)).ok,'the repair bridge rechecks current account permissions');
}
{
 const h=setup(),catalog=h.M.catalog(h.scope),bad={id:'repairCase',label:'待修复分类',codeLabel:'业务编码',enabled:true,fields:[{fieldId:'intendedSeries',enabled:false,required:false},{fieldId:'intendedStore',enabled:true,required:false},{fieldId:'serviceConcern',enabled:true,required:false}]};
 const bundle={...h.scope,types:[...copy(catalog.rows),bad],fields:copy(catalog.fields),localIntentProfileVersion:h.w.CustomerIntentProfile.revision};
 h.storage.set(h.M.storageKey,JSON.stringify({version:3,revision:1,seriesSelectionPolicy:'single',scopes:[bundle]}));
 check(h.M.catalog(h.scope).ok&&!!h.M.configurationIssue('repairCase',h.scope),'fixture is readable but has an actual required-upstream closure issue');
 const call=h.preview('repairCase');h.A.setFollowup('serviceConcern','修复前填写保留');h.A.openDialog();
 check(!!call.businessFormVersion.initialIssues.repairCase,'an initially invalid category still binds without blocking telephone initialization');
 const oldVersion=JSON.stringify(call.businessFormVersion),oldOther=h.M.fields('aftersales',call).map(row=>row.required);
 check(!!h.document.querySelector('[data-followup-reload-repaired]'),'the real initially invalid form exposes an explicit repair action');
 const repaired=h.M.get('repairCase',h.scope);repaired.fields.find(row=>row.fieldId==='intendedSeries').enabled=true;check(h.M.save(repaired,h.scope).ok,'administrator repairs the actual missing dependency');
 const changedField=h.M.getField('serviceConcern',h.scope);changedField.type='number';check(h.M.saveField(changedField,h.scope).ok,'administrator changes a repaired field type while the old value is retained');
 const aftersales=h.M.get('aftersales',h.scope);aftersales.fields[0].required=true;check(h.M.save(aftersales,h.scope).ok,'administrator also changes an unrelated valid category');
 let button=h.document.querySelector('[data-followup-reload-repaired]');
 const write=h.w.localStorage.setItem;h.w.localStorage.setItem=(key,value)=>{if(key==='native-workbench-records-v1')throw Error('synthetic journal write error');return write(key,value);};
 check(h.C.reloadRepairedCallForm('seat-followup',button)===false,'a failed existing journal write rejects the repair commit');
 check(JSON.stringify(call.businessFormVersion)===oldVersion&&h.peek().followup.serviceConcern==='修复前填写保留','failed repair preserves the old version and all draft input');
 check(!Object.hasOwn(h.peek().followup,'__callFormRecovery'),'failed repair rolls back its newly prepared recovery marker');
 h.w.localStorage.setItem=write;
 check(h.C.reloadRepairedCallForm('seat-followup',button)===true,'the explicit real control commits the repaired type through the workbench bridge');
 check(!!call.businessFormVersion.repairs.repairCase&&h.peek().followup.serviceConcern==='修复前填写保留','successful repair preserves user input and records only the allowed type repair');
 check(JSON.stringify(h.M.fields('aftersales',call).map(row=>row.required))===JSON.stringify(oldOther),'repair does not adopt newer settings for unrelated valid categories');
 const sessionDraft=JSON.parse(h.session.get('native-workbench-session-v1'));
 check(sessionDraft.call.businessFormVersion.repairs.repairCase,'session draft includes the committed repair version');
 check(sessionDraft.followup.__callFormRecovery.types.repairCase.pending.some(row=>row.fieldId==='serviceConcern')&&sessionDraft.followup.serviceConcern==='修复前填写保留','repair session atomically retains the original value and its pending recovery marker');
 check(JSON.parse(h.storage.get('native-workbench-records-v1')).find(row=>row.callId===call.callId).businessFormVersion.repairs.repairCase,'native journal also includes the committed repair version');
 check(!h.A.persistBusinessForm(copy(call)).ok,'the bridge cannot reapply or replace an already repaired version');
 h.connect();h.A.end();h.A.setDisposition('已完成沟通');h.A.saveDisposition();
 check(h.peek().phase==='wrap'&&h.peek().followup.serviceConcern==='修复前填写保留','a repaired type change keeps the original input pending until the operator resolves it');
 const clear=h.document.querySelector('[data-followup-recovery-clear="serviceConcern"]');check(!!clear&&h.C.clearRepairedField('seat-followup','serviceConcern',clear),'the actual recovery action explicitly clears the changed field');
 h.A.setFollowup('serviceConcern','2');h.A.saveDisposition();
 check(h.peek().phase==='idle'&&h.d.calls.find(row=>row.callId===call.callId).customerFollowup.serviceConcern==='2','the repaired call can truly complete after explicit input under the new type');
}
{
 const h=setup(),call=h.preview('lead');h.A.setFollowup('plannedStoreName','会话保留的填写');h.connect();h.A.end();
 const version=JSON.stringify(call.businessFormVersion),journal=JSON.parse(h.storage.get('native-workbench-records-v1'));
 delete journal.find(row=>row.callId===call.callId).businessFormVersion;h.storage.set('native-workbench-records-v1',JSON.stringify(journal));
 updateAdministrator(h);h.reload();
 check(JSON.stringify(h.peek().call.businessFormVersion)===version&&h.peek().followup.plannedStoreName==='会话保留的填写','a session binding survives restoration when the older native journal lacks it');
 check(JSON.stringify(JSON.parse(h.storage.get('native-workbench-records-v1')).find(row=>row.callId===call.callId).businessFormVersion)===version,'restoration persists the preserved session binding instead of capturing the newer live directory');
}
{
 const h=setup(),call=h.preview('lead');h.A.setFollowup('plannedStoreName','不确定版本仍保稿');h.connect();h.A.end();
 const snapshot=JSON.parse(h.session.get('native-workbench-session-v1'));snapshot.call.businessFormVersion=h.M.captureCallForm(h.M.liveFormSource(call)).version;
 h.session.set('native-workbench-session-v1',JSON.stringify(snapshot));const bytes=h.session.get('native-workbench-session-v1');h.reload();
 check(h.peek().error.includes('恢复')&&h.A.dial()===false,'conflicting valid session and journal bindings block a new call rather than silently replacing the draft version');
 check(h.peek().followup.plannedStoreName==='不确定版本仍保稿'&&h.session.get('native-workbench-session-v1')===bytes,'conflicting binding restoration preserves existing input and original session bytes');
}
for(const mode of ['active','restored']){
 const h=setup(),call=h.preview('lead'),id=call.callId;h.A.setFollowup('plannedStoreName','首绑前已填写的门店');
 if(mode==='restored'){h.connect();h.A.end();}
 delete call.businessFormVersion;delete call.businessFormType;
 const records=JSON.parse(h.storage.get('native-workbench-records-v1'));delete records.find(row=>row.callId===id).businessFormVersion;delete records.find(row=>row.callId===id).businessFormType;h.storage.set('native-workbench-records-v1',JSON.stringify(records));
 const rawSession=JSON.parse(h.session.get('native-workbench-session-v1'));delete rawSession.call.businessFormVersion;delete rawSession.call.businessFormType;h.session.set('native-workbench-session-v1',JSON.stringify(rawSession));
 const category=h.M.get('lead',h.scope);category.fields.find(row=>row.fieldId==='plannedStoreName').enabled=false;check(h.M.save(category,h.scope).ok,'administrator hides the already filled field before first version adoption');
 if(mode==='restored')h.reload();else h.A.current();h.A.openDialog();
 check(h.peek().followup.plannedStoreName==='首绑前已填写的门店'&&h.peek().followup.__callFormRecovery.types.lead.pending.some(row=>row.fieldId==='plannedStoreName'),mode+': first adoption keeps the orphaned value visibly pending');
 if(mode==='active'){h.connect();h.A.end();}
 h.A.setDisposition('已完成沟通');h.A.saveDisposition();
 check(h.peek().phase==='wrap'&&h.peek().followup.plannedStoreName==='首绑前已填写的门店',mode+': no save may silently drop the newly orphaned draft value');
 const clear=h.document.querySelector('[data-followup-recovery-clear="plannedStoreName"]');check(!!clear&&h.C.clearRepairedField('seat-followup','plannedStoreName',clear),mode+': operator can explicitly clear the unavailable field through the real recovery action');
 h.A.saveDisposition();check(h.peek().phase==='idle',mode+': explicit resolution allows the adopted call to finish');
}
console.log(JSON.stringify({passed,scope:'real workbench inbound, predictive, assigned and preview call binding, complete wrap save, next call and session/journal restoration'}));
