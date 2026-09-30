async page => {
 const out={checks:[],cases:[],errors:[]};const check=(ok,label)=>{if(!ok)throw Error(label);out.checks.push(label);};page.on('pageerror',e=>out.errors.push(e.message));
 await page.getByRole('button',{name:'登录',exact:true}).click();
 await page.evaluate(()=>{AppState.chooseInstance('7522240');AppState.chooseDomain('CLOUD_CONTACT_CENTER');DemoSwitch.enter('ACC-OPS-108');AppState.chooseDomain('CLOUD_CONTACT_CENTER');navigateTo('seat-workbench');AgentWorkbench.updateField('skillGroupId','SHOWCASE-HQ-SKILL-SALES');});
 for(const scenario of ['expired','media-error']){
  const r=await page.evaluate(async scenario=>{AliCtiAdapter.scenario=scenario;await AgentWorkbench.signIn();return {error:document.getElementById('seat-error')?.textContent,endpoint:AgentWorkbench.myAgent().currentEndpoint||''};},scenario);
  check(r.error?.includes(scenario==='expired'?'登录材料已过期':'音频连接失败')&&!r.endpoint,'RG16 '+scenario+'首页显示失败且保持离线');out.cases.push({scenario,...r});
 }
 await page.evaluate(()=>{AliCtiAdapter.scenario='success';void AgentWorkbench.signIn();});await page.waitForFunction(()=>AgentWorkbench.myAgent()?.currentEndpoint==='NATIVE_WORKBENCH');
 check(await page.evaluate(()=>AliCtiAdapter.authDraft.fields.cno==='0012'&&AliCtiAdapter.loginDraft.fields.cno==='0012'),'正常上线及前导零工号保持');
 await page.evaluate(()=>{const row=CustomerTasks.mine().find(r=>r.followup==='待联系'&&!r.calls.length);window.fixCustomerId=row.id;CustomerTasks.pick(row.id);AgentWorkbench.dial();});
 await page.waitForFunction(()=>document.getElementById('assigned-call-dialog')?.innerText.includes('通话中'));
 await page.evaluate(()=>{AgentWorkbench.end();AgentWorkbench.setDisposition('需要再次联系');AgentWorkbench.setRemark('约定明天下午再次联系');AgentWorkbench.setFollowup('intentionLevel','高意向');window.fixCallId=CustomerTasks.row(window.fixCustomerId).r.activeCallId;});
 for(const storageKey of ['customer-task-batches-v1','native-workbench-records-v1','customer-followup-v1']){
  const r=await page.evaluate(key=>{const original=Storage.prototype.setItem;let failed=0;Storage.prototype.setItem=function(k,v){if(k===key){failed++;throw new DOMException('targeted failure','QuotaExceededError');}return original.call(this,k,v);};try{AgentWorkbench.saveDisposition();}finally{Storage.prototype.setItem=original;}
   const row=CustomerTasks.row(window.fixCustomerId).r,c=CloudCallData.calls.find(c=>c.callId===window.fixCallId),journal=JSON.parse(localStorage.getItem('native-workbench-records-v1')).find(c=>c.callId===window.fixCallId);
   return {key,failed,callStatus:c.processingStatus,journalStatus:journal.processingStatus,rowStatus:row.followup,active:row.activeCallId,phase:JSON.parse(sessionStorage.getItem('native-workbench-session-v1')).phase,disposition:document.getElementById('seat-disposition')?.value,remark:document.getElementById('seat-remark')?.value,intention:document.getElementById('seat-followup-intentionLevel')?.value,error:document.getElementById('seat-error')?.textContent};},storageKey);
  check(r.failed>0&&r.callStatus==='待填写'&&r.journalStatus==='待填写'&&r.phase==='wrap'&&!!r.active,'RG05 '+storageKey+'失败保持待填写与话后上下文');
  check(r.disposition==='需要再次联系'&&r.remark==='约定明天下午再次联系'&&r.intention==='高意向'&&!!r.error,'RG05 '+storageKey+'失败保留全部输入并显示错误');out.cases.push(r);
 }
 const saved=await page.evaluate(()=>{AgentWorkbench.saveDisposition();const row=CustomerTasks.row(window.fixCustomerId).r,c=CloudCallData.calls.find(c=>c.callId===window.fixCallId),journal=JSON.parse(localStorage.getItem('native-workbench-records-v1')).find(c=>c.callId===window.fixCallId);return {rowStatus:row.followup,active:row.activeCallId,canCall:CustomerTasks.canCall(row),history:row.calls.filter(c=>c.callId===window.fixCallId).length,callStatus:c.processingStatus,journalStatus:journal.processingStatus,intention:c.customerFollowup.intentionLevel,phase:JSON.parse(sessionStorage.getItem('native-workbench-session-v1')).phase,dialog:!!document.getElementById('assigned-call-dialog')};});
 check(saved.rowStatus==='待继续跟进'&&!saved.active&&saved.canCall&&saved.history===1&&saved.callStatus==='已完成'&&saved.journalStatus==='已完成'&&saved.phase==='idle'&&!saved.dialog,'RG05恢复存储后同一通话安全重试成功，仅一次历史且解除占用');out.cases.push(saved);
 await page.screenshot({path:'/private/tmp/fix-calls-workbench.png',fullPage:true,animations:'disabled'});
 await page.evaluate(()=>AgentWorkbench.signOut());check(out.errors.length===0,'话后修复流程无浏览器异常');return out;
}
