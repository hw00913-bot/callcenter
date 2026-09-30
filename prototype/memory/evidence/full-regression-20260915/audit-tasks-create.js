async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const out={};
 async function begin(type,name,group,number){
  await page.evaluate(({type})=>CloudTaskWorkspace.start(type),{type});
  await page.waitForSelector('#wizardName');
  return await page.evaluate(({type,name,group,number})=>{CloudTaskWorkspace.setTenant('TEN-NISSAN-HQ');CloudTaskWorkspace.update('name',name);if(type==='IVR 外呼')CloudTaskWorkspace.setResource('providerIvrId','91001');else CloudTaskWorkspace.setResource('skillGroupId',group);CloudTaskWorkspace.setResource('callerNumberId',number);CloudTaskWorkspace.update('minAvailableAgentCount','1');const c=CustomerTasks.pendingForTask('TEN-NISSAN-HQ','7522240')[0];CloudTaskWorkspace.toggleCustomer(c.id,true);return c.id;},{type,name,group,number});
 }
 out.maskedCustomer=await begin('预外呼','审计-掩码外显','SG-ALI-HQ-SALES','NUM-021-6601');
 out.masked=await page.evaluate(()=>{CloudTaskWorkspace.next();CloudTaskWorkspace.next();CloudTaskWorkspace.next();CloudTaskWorkspace.submit();const t=CloudCallData.tasks.find(t=>t.name==='审计-掩码外显');return t?{id:t.taskId,status:t.status,selected:CloudCallData.phoneNumbers.find(n=>n.numberId===t.callerNumberId),create:t.alictiCreateDraft,imports:t.alictiImportDrafts,importResults:t.alictiImportResults}: {error:document.body.innerText.slice(-2000)};});
 out.autoCustomer=await begin('IVR 外呼','审计-自动正常','','SHOWCASE-HQ-NUM');
 out.auto=await page.evaluate(()=>{CloudTaskWorkspace.setRetryMode('advanced');CloudTaskWorkspace.toggleRetryCode(710,true);CloudTaskWorkspace.toggleRetryCode(715,true);CloudTaskWorkspace.changeRetryCount('2');CloudTaskWorkspace.changeRetryInterval('uniform','1','hours');CloudTaskWorkspace.next();CloudTaskWorkspace.next();CloudTaskWorkspace.next();CloudTaskWorkspace.submit();const t=CloudCallData.tasks.find(t=>t.name==='审计-自动正常');return t?{id:t.taskId,status:t.status,create:t.alictiCreateDraft,imports:t.alictiImportDrafts}: {error:document.body.innerText.slice(-2000)};});
 out.storageCustomer=await begin('预外呼','审计-存储失败','SHOWCASE-HQ-SKILL-SALES','SHOWCASE-HQ-NUM');
 out.storage=await page.evaluate(()=>{CloudTaskWorkspace.next();CloudTaskWorkspace.next();CloudTaskWorkspace.next();const c=CustomerTasks.pendingForTask('TEN-NISSAN-HQ','7522240')[0];const draftId=sessionStorage.getItem('cloud-task-wizard-active-v1'),old=Storage.prototype.setItem;let thrown='';Storage.prototype.setItem=function(key,value){if(this===sessionStorage&&key==='cloud-task-created-v1')throw new DOMException('audit quota failure','QuotaExceededError');return old.call(this,key,value)};try{CloudTaskWorkspace.submit()}catch(e){thrown=e.name+':'+e.message}finally{Storage.prototype.setItem=old}const d=JSON.parse(sessionStorage.getItem('cloud-task-wizard-drafts-v1')).find(d=>d.draftId===draftId),t=CloudCallData.tasks.find(t=>t.name==='审计-存储失败');return {thrown,draft:d,createdInMemory:!!t,createdPersisted:JSON.parse(sessionStorage.getItem('cloud-task-created-v1')||'[]').some(t=>t.name==='审计-存储失败'),assignedCustomer:t?CustomerTasks.taskCustomers(t):[],retrySelectionValid:CustomerTasks.validateTaskSelection(d,d.values.customerIds)};});
 out.errors=errors;return out;
}
