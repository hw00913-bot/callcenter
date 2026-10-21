/** Explicit missing-form recovery through the real catalog, followup and workbench. */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {setup}=require('./check-workbench-form-version.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const recordsKey='native-workbench-records-v1',sessionKey='native-workbench-session-v1';
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++;};
function form(h){return h.document.querySelector('.customer-followup-form');}
function click(h,selector,node){
  node=node || form(h)?.querySelector(selector);check(!!node,'actual generated recovery control is present: '+selector);
  h.w.eventNode=node;try{return vm.runInContext('(function(){return '+node.getAttribute('onclick')+'}).call(eventNode)',h.w);}finally{delete h.w.eventNode;}
}
function missing(raw={},options={}){
  const h=setup(),call=h.preview(options.untyped?'':'lead');if(options.untyped)h.A.setFollowup('businessType','lead');
  h.A.openDialog();h.A.setFollowup('plannedStoreName','原门店文字');h.A.setRemark('原沟通备注');
  Object.assign(h.peek().followup,copy(raw));h.connect();h.A.end();h.A.setDisposition('已完成沟通');
  const originalVersion=copy(call.businessFormVersion);
  delete call.businessFormVersion;delete call.businessFormType;
  const rows=JSON.parse(h.storage.get(recordsKey));delete rows.find(row=>row.callId===call.callId).businessFormVersion;delete rows.find(row=>row.callId===call.callId).businessFormType;h.storage.set(recordsKey,JSON.stringify(rows));
  const session=JSON.parse(h.session.get(sessionKey));delete session.call.businessFormVersion;delete session.call.businessFormType;h.session.set(sessionKey,JSON.stringify(session));
  if(options.restore!==false)h.reload();h.A.openDialog();return {...h,originalVersion};
}
function clear(h,id){return click(h,'[data-followup-recovery-clear="'+id+'"]');}
function recoveryIds(h){return h.peek().followup.__callFormRecovery?.types?.[h.peek().followup.businessType || 'lead']?.pending?.map(item=>item.fieldId) || [];}
function redraw(h){const old=form(h);old.outerHTML=h.C.form(h.peek().followup,h.peek().call,'seat-followup','AgentWorkbench.setFollowup');}
function assertUnchanged(h,before,message){check(!Object.hasOwn(h.peek().call,'businessFormVersion')&&JSON.stringify(h.peek().followup)===before.followup&&h.peek().remark===before.remark&&h.peek().disposition===before.disposition&&h.peek().phase===before.phase,message);}
function before(h){return {followup:JSON.stringify(h.peek().followup),remark:h.peek().remark,disposition:h.peek().disposition,phase:h.peek().phase,call:JSON.stringify(h.peek().call),records:h.storage.get(recordsKey),session:h.session.get(sessionKey)};}
function brokenCategory(h,type='repairCase'){
 require('./fixtures/current-generic.cjs').install(h.w,{scope:h.scope});const data=h.M.catalog(h.scope);
 const row={id:type,label:'待修复分类',codeLabel:'业务编码',prefix:'REPAIR',enabled:true,fields:[{fieldId:'genericSeries',enabled:false,required:false},{fieldId:'genericStore',enabled:true,required:false}]};
 const rows=type==='lead'?data.rows.map(value=>value.id===type?{...value,fields:value.fields.map(ref=>ref.fieldId==='genericSeries'?{...ref,enabled:false}:ref)}:value):[...data.rows,row];
 h.storage.set(h.M.storageKey,JSON.stringify({version:h.M.storageVersion,revision:99,scopes:[{...h.scope,types:copy(rows),fields:copy(data.fields)}]}));
 check(h.M.catalog(h.scope).ok&&!!h.M.configurationIssue(type,h.scope),'fixture has a structurally readable current directory with an explicit broken target dependency');redraw(h);
}

(async()=>{
 {
  const raw={qaChoice:'choice-a',unknownOriginal:{code:'OPAQUE-001',name:'未知字段原值'},mappingIntendedSeries:{code:'910001',name:'原车系名',sourceValues:{relation_id:910001}}},h=missing(raw),old=before(h),id=h.peek().call.callId;
  check(h.peek().phase==='wrap'&&!Object.hasOwn(h.peek().call,'businessFormVersion'),'real restoration reproduces the original missing-form wrap state');
  check(form(h).textContent.includes('本通填写表单未能恢复')&&form(h).textContent.includes('将采用当前业务分类配置')&&!form(h).textContent.includes('业务分类配置需修复')&&form(h).querySelector('[data-followup-reload-missing]'),'missing-form explanation includes an actionable explicit control and current-configuration disclosure');
  h.A.saveDisposition();check(h.peek().phase==='wrap'&&h.peek().error.includes('本通填写表单未能恢复'),'save remains blocked until the explicit recovery action');
  h.w.RouteRuntime.canRoute=()=>false;check(h.A.renderSeat().includes('data-seat-open-form-recovery'),'the workbench error has a visible route back to the recovery editor');
  const host=h.document.createElement('section');host.innerHTML=h.A.renderSeat();h.document.body.appendChild(host);const remarkNode=h.document.getElementById('seat-remark');
  check(click(h,'[data-followup-reload-missing]')===true,'explicit real control commits a valid current form');
  const current=h.peek(),backup=current.call.businessFormRecovery,ids=recoveryIds(h);
  check(h.M.callForm(current.call).ok&&backup.origin==='current'&&backup.confirmedAt,'current form is bound only after explicit confirmation and records recovery time');
  check(h.document.querySelectorAll('#seat-error').every(node=>!node.textContent)&&!h.document.querySelector('.toolbar-error')&&!h.document.querySelector('[data-seat-open-form-recovery]'),'successful recovery clears every old workspace, dialog and toolbar error and obsolete recovery entry');
  check(h.document.getElementById('seat-remark')===remarkNode,'clearing old errors leaves the existing remark input node in place');
  check(JSON.stringify(backup.original.followup)===old.followup&&backup.original.remark===old.remark&&backup.original.disposition===old.disposition&&backup.original.phase===old.phase,'complete original draft, remark, result and phone phase are backed up');
  check(current.remark===old.remark&&current.disposition===old.disposition&&current.phase===old.phase&&current.call.endedAt===JSON.parse(old.call).endedAt,'recovery does not alter telephone completion or operator result inputs');
  check(['plannedStoreName','qaChoice','unknownOriginal','mappingIntendedSeries'].every(id=>ids.includes(id)),'every nonempty business value, including unknown and interface values, is pending');
  check(form(h).textContent.includes('未知字段原值')&&form(h).textContent.includes('OPAQUE-001')&&form(h).textContent.includes('原门店文字'),'unknown raw objects and former ordinary values remain visible');
  check(!h.document.getElementById('seat-followup-mappingIntendedSeries')&&!h.document.getElementById('seat-followup-qaChoice'),'pending choices are not silently displayed as confirmed current values');
  check(JSON.parse(h.session.get(sessionKey)).followup.__callFormRecovery.kind==='missing-form'&&JSON.parse(h.storage.get(recordsKey)).find(row=>row.callId===id).businessFormRecovery.original.followup.unknownOriginal.code==='OPAQUE-001','session and native journal persist both the pending state and full backup');
  check(!h.storage.has(h.C.storageKey),'recovery writes no completed business journal or callback');
  h.A.saveDisposition();check(h.peek().phase==='wrap'&&h.peek().error.includes('待核对'),'unresolved original values cannot complete the call');
  const held=JSON.stringify(h.peek().followup);h.A.setFollowup('qaChoice','choice-b');h.A.setFollowup('unknownOriginal','replaced');check(JSON.stringify(h.peek().followup)===held,'pending values cannot be overwritten to bypass explicit clearing');
  for(const fieldId of ids)check(clear(h,fieldId)===true,'explicit clearing resolves '+fieldId);
  check(h.peek().followup.unknownOriginal===''&&!h.peek().followup.__callFormRecovery,'unknown field is explicitly cleared and the pending marker resolves');
  h.A.setFollowup('plannedStoreName','核对后门店');h.choose('qaChoice','choice-b');
  const F=h.w.BusinessInterfaceField,schedule=h.w.setTimeout;h.w.setTimeout=fn=>{queueMicrotask(fn);return 0;};const q=await F.query('seat-followup','mappingIntendedSeries');h.w.setTimeout=schedule;check(q.ok&&q.items.length===3,'interface choices must be queried afresh after recovery');
  check(F.choose('seat-followup','mappingIntendedSeries',JSON.stringify([q.items[1].type || '',q.items[1].code])),'new interface choice goes through the real current picker');
  let communicationPayload;h.peek().call.apiOrigin={applicationId:'RECOVERY-QA-APP',leadCode:'RECOVERY-QA-LEAD'};h.w.DccRuntime={recordCommunicationCompletion(input){communicationPayload=input;return {ok:true};}};
  h.A.saveDisposition();check(h.peek().phase==='idle'&&!h.peek().call,'recovered real workbench actually completes wrap and releases the call');
  const saved=h.d.calls.find(row=>row.callId===id),values=saved.customerFollowup;
  check(values.plannedStoreName==='核对后门店'&&values.mappingIntendedSeries.code==='910002'&&saved.dispositionRemark==='原沟通备注','normal business save retains re-entered selections and the original remark');
  check(!Object.hasOwn(values,'unknownOriginal')&&!JSON.stringify(values).includes('__callFormRecovery')&&!JSON.stringify(values).includes('businessFormRecovery'),'backup and pending metadata never enter business values or callback');
  check(saved.businessFormRecovery.original.followup.unknownOriginal.code==='OPAQUE-001','normal saved call retains the explicit recovery backup outside its business callback');
  check(communicationPayload&&!Object.hasOwn(communicationPayload.call,'businessFormRecovery')&&!Object.hasOwn(communicationPayload.call.communicationCompletion.frozenCallSnapshot,'businessFormRecovery')&&!JSON.stringify(communicationPayload.savedBusinessSnapshot).includes('unknownOriginal'),'actual communication-completion callRecord snapshot and business callback exclude the recovery backup');
  const category=h.M.get('lead',h.scope);category.fields.find(ref=>ref.fieldId==='qaChoice').required=true;check(h.M.save(category,h.scope).ok,'administrator may change configuration after recovered completion');
  const next=h.preview('lead');check(next.businessFormVersion.id!==saved.businessFormVersion.id&&h.M.fields('lead',next).find(field=>field.id==='qaChoice').required,'next call captures its own latest version');
 }
 for(const failAt of ['native','session']){
  const h=missing({unknownOriginal:'写异常也保留'}),old=before(h),storage=failAt==='native'?h.w.localStorage:h.w.sessionStorage,key=failAt==='native'?recordsKey:sessionKey,write=storage.setItem;
  storage.setItem=(name,value)=>{if(name===key)throw Error('synthetic '+failAt+' write failure');return write(name,value);};
  check(click(h,'[data-followup-reload-missing]')===false,failAt+' write failure is not reported as a successful recovery');
  assertUnchanged(h,old,failAt+' failure preserves memory version, full draft, remark, result and phase');
  check(h.storage.get(recordsKey)===old.records&&h.session.get(sessionKey)===old.session,failAt+' failure leaves original native and session bytes intact');
  check(!h.storage.has(h.C.storageKey)&&!h.notices.some(args=>args[1]==='success'),failAt+' recovery failure never publishes a business save or success toast');
  storage.setItem=write;check(click(h,'[data-followup-reload-missing]')===true,failAt+' failed recovery can be retried without discarding input');
 }
 {
  const h=missing({unknownOriginal:'刷新仍保留'});check(click(h,'[data-followup-reload-missing]'),'recovery commits before a simulated refresh');const version=JSON.stringify(h.peek().call.businessFormVersion);h.reload();h.A.openDialog();
  check(JSON.stringify(h.peek().call.businessFormVersion)===version&&h.peek().followup.unknownOriginal==='刷新仍保留'&&recoveryIds(h).includes('unknownOriginal'),'same-call restoration retains the recovered version, raw input and unresolved pending state');
  check(h.peek().remark==='原沟通备注'&&h.peek().disposition==='已完成沟通','refresh retains original result and remark');
 }
 {
  const h=missing({unknownOriginal:'仅话单恢复仍保留'});check(click(h,'[data-followup-reload-missing]'),'recovery persists a same-call draft in the native recovery metadata');h.session.clear();h.reload();h.A.openDialog();
  check(h.peek().followup.unknownOriginal==='仅话单恢复仍保留'&&recoveryIds(h).includes('unknownOriginal')&&form(h).textContent.includes('仅话单恢复仍保留'),'native-only restoration never drops unresolved unknown input');
  check(h.peek().remark==='原沟通备注'&&h.peek().disposition==='已完成沟通'&&!h.C.validate(h.peek().followup,h.peek().call).ok,'native-only restoration retains result and remark and still requires explicit resolution');
 }
 for(const source of ['native','session']){
  const h=missing({unknownOriginal:'原版副本仍保稿'}),original=copy(h.originalVersion);
  const category=h.M.get('lead',h.scope);category.fields.find(ref=>ref.fieldId==='qaChoice').required=true;check(h.M.save(category,h.scope).ok,'live configuration changes before saved-version recovery');
  if(source==='native'){const rows=JSON.parse(h.storage.get(recordsKey));rows.find(row=>row.callId===h.peek().call.callId).businessFormVersion=original;h.storage.set(recordsKey,JSON.stringify(rows));}
  else {const saved=JSON.parse(h.session.get(sessionKey));saved.call.businessFormVersion=original;h.session.set(sessionKey,JSON.stringify(saved));}
  redraw(h);check(click(h,'[data-followup-reload-missing]')===true,source+' valid same-identity copy can be restored explicitly');
  check(JSON.stringify(h.peek().call.businessFormVersion)===JSON.stringify(original)&&h.peek().call.businessFormRecovery.origin==='saved',source+' copy wins over a newer administrator form');
  check(!h.M.fields('lead',h.peek().call).find(field=>field.id==='qaChoice').required&&recoveryIds(h).includes('unknownOriginal'),source+' original semantics stay fixed and unknown values remain pending');
 }
 for(const version of [null,{}, {version:1,owner:{callId:'OTHER'}}]){
  const h=missing();h.peek().call.businessFormVersion=copy(version);redraw(h);const old=before(h);
  check(!form(h).querySelector('[data-followup-reload-missing]')&&!h.M.missingCallFormStatus(h.peek().call).ok,'an existing null, malformed or foreign version is not genuinely absent');
  const proposed=h.M.captureCallForm(h.M.liveFormSource(h.peek().call));check(!h.A.recoverMissingBusinessForm({...h.peek().call,businessFormVersion:proposed.version},'forged',0).ok&&JSON.stringify(h.peek().call)===old.call,'damaged versions cannot be washed into a newer current form');
 }
 {
  const h=setup(),call=h.preview('lead');h.A.openDialog();const version=JSON.stringify(call.businessFormVersion);
  check(!form(h).querySelector('[data-followup-reload-missing]')&&!h.M.missingCallFormStatus(call).ok,'healthy bound versions never expose missing-form recovery');
  check(!h.A.recoverMissingBusinessForm({...call,businessFormVersion:h.M.captureCallForm(h.M.liveFormSource(call)).version},'forged',0).ok&&JSON.stringify(call.businessFormVersion)===version,'public recovery bridge cannot replace a healthy version');
 }
 for(const kind of ['permission','object','account','tenant','session','draft','remark','result','config','old-node']){
  const h=missing({unknownOriginal:'守卫原稿'}),node=form(h).querySelector('[data-followup-reload-missing]'),old=before(h);
  if(kind==='permission')h.setValid(false);if(kind==='object')h.setAuthorized(false);if(kind==='account')h.state.accountId='OTHER';if(kind==='tenant')h.state.tenantId='OTHER';if(kind==='session')h.state.sessionId='NEW';
  if(kind==='draft')h.peek().followup.unknownOriginal='后来填写';if(kind==='remark')h.A.setRemark('后来备注');if(kind==='result')h.A.setDisposition('需要再次联系');
  if(kind==='config'){const category=h.M.get('lead',h.scope);category.label='后来配置';check(h.M.save(category,h.scope).ok,'configuration race fixture uses the actual administrator API');}
  if(kind==='old-node')redraw(h);
  check(click(h,'old captured button',node)===false,'stale '+kind+' recovery action is rejected');
  check(!Object.hasOwn(h.peek().call,'businessFormVersion')&&!h.storage.has(h.C.storageKey),'stale '+kind+' action cannot create a version or completed business record');
  if(['draft','remark','result'].includes(kind))check(kind==='draft'?h.peek().followup.unknownOriginal==='后来填写':kind==='remark'?h.peek().remark==='后来备注':h.peek().disposition==='需要再次联系','newer '+kind+' input is not discarded');
  else check(JSON.stringify(h.peek().followup)===old.followup,'stale '+kind+' action keeps all existing raw input');
 }
 {
  const h=missing(),rows=JSON.parse(h.storage.get(recordsKey));rows.find(row=>row.callId===h.peek().call.callId).businessFormVersion=null;h.storage.set(recordsKey,JSON.stringify(rows));redraw(h);
  check(!form(h).querySelector('[data-followup-reload-missing]')&&!h.A.missingBusinessFormAvailability(h.peek().call).ok,'a corrupt existing stored version cannot be bypassed just because the live object is absent');
 }
 {
  const h=missing();brokenCategory(h);
  check(!!form(h).querySelector('[data-followup-reload-missing]')&&click(h,'[data-followup-reload-missing]'),'unrelated invalid category never blocks recovery of this valid fixed category');
  check(h.peek().call.businessFormVersion.initialIssues.repairCase&&!h.peek().call.businessFormVersion.initialIssues.lead&&!form(h).querySelector('[data-followup-reload-repaired]'),'unrelated initial issue stays explicit without changing the healthy target');
 }
 {
  const h=missing();brokenCategory(h,'lead');const old=before(h);
  check(!form(h).querySelector('[data-followup-reload-missing]')&&!h.A.missingBusinessFormAvailability(h.peek().call).ok,'a fixed current target with an invalid dependency cannot be adopted');assertUnchanged(h,old,'invalid target keeps all existing input and the missing version');
  const category=h.M.get('lead',h.scope);category.fields.find(ref=>ref.fieldId==='genericSeries').enabled=true;check(h.M.save(category,h.scope).ok,'administrator fixes the actual target dependency');redraw(h);check(click(h,'[data-followup-reload-missing]'),'fixed target becomes explicitly recoverable after actual configuration repair');
 }
 {
  const h=missing({}, {untyped:true});brokenCategory(h);check(click(h,'[data-followup-reload-missing]'),'untyped call can load a structurally valid directory containing unrelated initial issues');check(clear(h,'plannedStoreName'),'untyped original business input is explicitly resolved');h.A.setFollowup('businessType','repairCase');
  check(form(h).querySelector('[data-followup-reload-repaired]')&&!h.C.validate(h.peek().followup,h.peek().call).ok,'selecting the initially broken category uses the existing explicit configuration-repair flow');
 }
 {
  const h=missing(),category=h.M.get('lead',h.scope);category.fields.find(ref=>ref.fieldId==='plannedStoreName').enabled=false;check(h.M.save(category,h.scope).ok,'administrator hides a formerly filled field');redraw(h);check(click(h,'[data-followup-reload-missing]'),'missing recovery never relies on the former field remaining visible');
  check(recoveryIds(h).includes('plannedStoreName')&&form(h).textContent.includes('原门店文字')&&!h.document.getElementById('seat-followup-plannedStoreName'),'hidden original value stays visible in pending recovery instead of silently disappearing');
 }
 {
  const h=missing({}, {untyped:true}),old=JSON.stringify(h.peek().followup);check(click(h,'[data-followup-reload-missing]'),'untyped current call can explicitly recover its full directory');
  h.A.setFollowup('businessType','activity');check(h.peek().followup.businessType==='lead','changing category cannot hide unresolved original fields');
  check(clear(h,'plannedStoreName')&&h.peek().followup.plannedStoreName==='','untyped pending original text is explicitly cleared');h.A.setFollowup('businessType','activity');check(h.peek().followup.businessType==='activity','category choice becomes available after all original pending values are resolved');
 }
 console.log(JSON.stringify({passed,scope:'real missing-form wrap recovery, saved-copy precedence, full draft backup, explicit pending resolution, atomic persistence, stale actions, permissions and healthy-version isolation'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
