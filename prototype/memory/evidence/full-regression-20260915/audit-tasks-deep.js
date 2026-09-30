async page=>{
 const out={};await page.reload();await page.waitForFunction(()=>window.CustomerTasks&&window.AliCtiInbound);
 out.afterStorageReload=await page.evaluate(()=>({taskPresent:CloudCallData.tasks.some(t=>t.name==='审计-存储失败'),customer:CustomerTasks.row('SHOWCASE-HQ-20260915-POOL-LEAD-C02')?.r,canReassign:CustomerTasks.taskOptions('预外呼',{tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240'}).map(t=>t.taskId)}));
 await page.evaluate(()=>{CloudTaskWorkspace.clearActiveContext();RouteRuntime.openPrimary('predictive-tasks');CloudTaskWorkspace.start('预外呼');});await page.waitForSelector('#wizardName');
 out.masked=await page.evaluate(()=>{CloudTaskWorkspace.setTenant('TEN-NISSAN-HQ');CloudTaskWorkspace.update('name','审计-可选掩码号码');CloudTaskWorkspace.setResource('skillGroupId','SG-ALI-HQ-SALES');CloudTaskWorkspace.setResource('callerNumberId','NUM-400-8801');CloudTaskWorkspace.update('minAvailableAgentCount','1');const c=CustomerTasks.pendingForTask('TEN-NISSAN-HQ','7522240')[0];CloudTaskWorkspace.toggleCustomer(c.id,true);CloudTaskWorkspace.next();CloudTaskWorkspace.next();CloudTaskWorkspace.next();CloudTaskWorkspace.submit();const t=CloudCallData.tasks.find(t=>t.name==='审计-可选掩码号码');return t?{taskId:t.taskId,status:t.status,create:t.alictiCreateDraft,imports:t.alictiImportDrafts,selected:CloudCallData.phoneNumbers.find(n=>n.numberId===t.callerNumberId)}:{error:document.body.innerText.slice(-1500)};});
 // A provider-confirmed existing String cno must not be dropped by task-specific length rules.
 out.shortCno=await page.evaluate(()=>{const a=CloudCallData.agents.find(a=>a.contactCenterIdentityId==='CCI-N-001'),old=a.cno;a.cno='12';try{const d={type:'预外呼',tenantId:'TEN-NISSAN-HQ',enterpriseId:'7522240',values:{name:'已有12号坐席',skillGroupId:'SG-ALI-HQ-SALES',callerNumberId:'NUM-400-8801',minAvailableAgentCount:1,retryPolicy:AliCtiRetry.create('预外呼')}};return {memberVisible:CloudResourceRules.members(CloudCallData.physicalSkillGroups.find(g=>g.skillGroupId==='SG-ALI-HQ-SALES')).length,taskMap:AliCtiFields.taskFields(d,CloudCallData)};}finally{a.cno=old;}});
 await page.evaluate(()=>{RouteRuntime.openPrimary('inbound-service');Pages['inbound-routing'].openRoute('97001',AliCtiInbound.context());});await page.waitForSelector('#routePriority');
 out.staleBefore=await page.evaluate(()=>({formActive:document.getElementById('routeActive').value,before:AliCtiInbound.get('97001').row.active,externalUpdate:AliCtiInbound.setActive('97001',2,AliCtiInbound.context()),after:AliCtiInbound.get('97001').row.active}));
 await page.locator('#routeDescription').fill('只补充备注，保持暂停');await page.locator('#routeSave').click();
 out.staleAfter=await page.evaluate(()=>({current:AliCtiInbound.get('97001').row,latest:AliCtiInbound.last}));
 out.inboundBranches=await page.evaluate(()=>{
 const key=AliCtiInbound.context(),before=AliCtiInbound.get('97002').row;const bad=AliCtiInbound.save({routerType:2,tel:'13800000000',active:1,priority:1},{context:key});const activeDelete=AliCtiInbound.remove('97001',key);
 AliCtiInbound.scenario='failure';const fail=AliCtiInbound.setActive('97002',2,key);AliCtiInbound.scenario='success';const failPreserved=AliCtiInbound.get('97002').row.active===before.active;
 AliCtiInbound.scenario='unknown';const unknown=AliCtiInbound.setActive('97002',2,key);AliCtiInbound.scenario='success';const repeat=AliCtiInbound.setActive('97002',2,key);
 return {duplicatePriorityRejected:!bad.ok,activeDeleteRejected:!activeDelete.ok,knownFailure:fail,failPreserved,unknown,repeat};
 });return out;
}
