async page => {
 const out={checks:[],observations:[],errors:[],failedRequests:[],httpErrors:[]};
 const check=(ok,label)=>{if(!ok)throw Error(label);out.checks.push(label);};
 page.on('pageerror',e=>out.errors.push(e.message));page.on('requestfailed',r=>out.failedRequests.push({url:r.url(),failure:r.failure()}));page.on('response',r=>{if(r.status()>=400)out.httpErrors.push({url:r.url(),status:r.status()});});
 await page.evaluate(()=>{navigateTo('seat-workbench');AgentWorkbench.updateField('skillGroupId','SHOWCASE-HQ-SKILL-SALES');AliCtiAdapter.scenario='success';void AgentWorkbench.signIn();});await page.waitForFunction(()=>AgentWorkbench.myAgent()?.currentEndpoint==='NATIVE_WORKBENCH');
 await page.evaluate(()=>{const row=CustomerTasks.mine().find(r=>r.followup==='待联系'&&!r.calls.length);if(!row)throw Error('No unused fixture customer');CustomerTasks.pick(row.id);AgentWorkbench.dial();});await page.waitForFunction(()=>document.getElementById('assigned-call-dialog')?.innerText.includes('通话中'));
 const saved=await page.evaluate(()=>{AgentWorkbench.end();AgentWorkbench.setDisposition('已完成沟通');AgentWorkbench.setRemark('客户档案刷新单次失败');const call=JSON.parse(sessionStorage.getItem('native-workbench-session-v1')).call,original=CustomerDirectory.sync;let injected=0;CustomerDirectory.sync=function(){CustomerDirectory.sync=original;injected++;throw Error('one noncritical refresh error');};try{AgentWorkbench.saveDisposition();}finally{CustomerDirectory.sync=original;}const customer=CustomerTasks.row(call.customerTaskItemId).r,record=JSON.parse(localStorage.getItem('native-workbench-records-v1')).find(r=>r.callId===call.callId),session=JSON.parse(sessionStorage.getItem('native-workbench-session-v1'));return {injected,record:record.processingStatus,customer:customer.followup,active:customer.activeCallId,phase:session.phase,dialog:!!document.getElementById('assigned-call-dialog'),pending:record.pendingDisposition};});
 check(saved.injected===1&&saved.record==='已完成'&&saved.customer==='已完成'&&!saved.active&&saved.phase==='idle'&&!saved.dialog&&!saved.pending,'RG05客户与话后写入完成后，非关键档案刷新异常不伪装成提交失败');out.observations.push(saved);
 await page.evaluate(()=>AgentWorkbench.signOut());await page.reload();await page.waitForFunction(()=>!!window.CloudCallData);
 for(const route of ['seat-workbench','cloud-call-records','event-callbacks','operation-audit']) await page.evaluate(route=>navigateTo(route),route);
 check(out.errors.length===0,'最终运行没有浏览器脚本异常');check(out.failedRequests.length===0&&out.httpErrors.length===0,'最终页面刷新及相关模块加载没有失败资源或 HTTP 错误');
 out.complete=true;return out;
}
