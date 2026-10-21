/** Clearly labelled display fixtures. Independent from runnable demo tasks. */
(function(){
  const d=CloudCallData,prefix='VIEW-DEMO-',key='workbench-view-fixtures-v2';
  const date=new Date().toLocaleDateString('sv-SE'),at=h=>date+' '+h;
  const pack={date,agents:[],physicalSkillGroups:[],agentSkills:[],phoneNumbers:[],tasks:[],calls:[],callDataIssues:[],batches:[]};
  const scopes=[['HQ','TEN-NISSAN-HQ','7522240','总部','ACC-OPS-108'],['SH','TEN-NISSAN-SH','7522241','门店',''],['EPI','TEN-EPI-HQ','DEMO-ENT-003','奕派','']];
  scopes.forEach(([code,tenantId,enterpriseId,label,accountId],si)=>{
    const group=prefix+code+'-GROUP',physical=prefix+code+'-PHY',numberId=prefix+code+'-NUM';
    ['空闲','通话中','话后处理','离线'].forEach((status,i)=>{
      const id=prefix+code+'-SEAT-'+i,cno=String(9700+si*10+i);
      // Do not bind the same account to two seats if an earlier demo has one.
      const bind=i===0&&accountId&&!d.agents.some(a=>a.accountId===accountId&&a.tenantId===tenantId&&a.enterpriseId===enterpriseId&&a.lifecycleStatus!=='已删除')?accountId:'';
      pack.agents.push({agentRecordId:id,contactCenterIdentityId:id,tenantId,enterpriseId,accountId:bind,userName:label+'演示坐席'+(i+1),mobile:'138****00'+(si*10+i),cno,loginName:cno,lifecycleStatus:'已启用',syncStatus:'同步成功',agentStatus:status,currentCall:status==='通话中',acceptNewTasks:true,callEnabled:true,simulation:true});
        pack.agentSkills.push({relationId:id+'-REL',identityId:id,physicalGroupId:physical,skillLevel:i+1,status:'已生效',syncStatus:'同步成功',simulation:true});
      });
      pack.physicalSkillGroups.push({physicalGroupId:physical,skillGroupId:group,skillTemplateId:enterpriseId==='DEMO-ENT-003'?'TPL-EPI-AFTER':code==='SH'?'TPL-SH-AFTER':'TPL-AFTER',tenantId,enterpriseId,name:label+'客户服务（演示）',status:'已启用',syncStatus:'同步成功',simulation:true});
      pack.phoneNumbers.push({numberId,number:'02100008'+String(si).padStart(3,'0'),enterpriseId,usage:'呼入/呼出',status:'正常',businessStatus:'正常',authorizedTenantIds:[tenantId],simulation:true});
      const batch={id:prefix+code+'-BATCH',name:label+'今日客户（演示）',tenantId,enterpriseId,createdAt:at('08:00:00'),createdBy:'演示数据',errors:[],rows:[],simulation:true};
      const existing=accountId&&d.agents.find(a=>a.accountId===accountId&&a.tenantId===tenantId&&a.enterpriseId===enterpriseId&&a.lifecycleStatus!=='已删除');
      const personalSeat=existing||pack.agents.find(a=>a.tenantId===tenantId&&a.accountId===accountId&&accountId)||pack.agents.find(a=>a.tenantId===tenantId);
      function call(id,customer,task,result,ordinal=1,seat=personalSeat){const time=at('09:'+String(pack.calls.length%50).padStart(2,'0')+':00'),ok=result==='接通';return {callId:id,contactId:'演示',tenantId,enterpriseId,taskId:task?.taskId||'',callType:task?.callType||'人工外呼',direction:'呼出',caller:pack.phoneNumbers.find(number=>number.numberId===numberId).number,callerNumberId:numberId,callee:customer.phone,customerName:customer.name,customerTaskItemId:customer.id,agentIdentityId:seat.contactCenterIdentityId,contactCenterIdentityId:seat.contactCenterIdentityId,agentName:seat.userName,skillGroupId:group,ringingAt:time,answeredAt:ok?time:'—',endedAt:time,durationSeconds:ok?60+ordinal*30:0,result,attemptNumber:ordinal,agentDisposition:ok?'模拟：已完成沟通':'模拟：需要再次联系',processingStatus:'已完成',recordingStatus:'演示无录音',recordingApplicability:'演示无录音',simulation:true,callSource:'WORKBENCH_VIEW_DEMO'};}
      ['执行中','已完成','异常'].forEach((status,t)=>{
        const total=6,completed=t===0?2:t===1?6:0,taskId=prefix+code+'-TASK-'+t;
        const task={taskId,tenantId,enterpriseId,name:label+['试驾邀约','保养通知','满意度回访'][t]+'（演示）',callType:t===1?'IVR 外呼':'预外呼',status,total,completed,connected:Math.ceil(completed/2),createdAt:at('08:00:00'),scheduleAt:at('09:00:00'),startedAt:at('09:00:00'),updatedAt:at('10:00:00'),owner:label+'管理员',simulation:true,displayOnly:true,listSource:batch.name,planId:'',campaignId:'',callerNumberId:numberId,targetSkillGroupId:group};
        pack.tasks.push(task);
        for(let i=0;i<total;i++){
          const customer={id:taskId+'-C'+i,name:label+'演示客户'+(t*6+i+1),phone:'138000'+si+String(t*6+i+1).padStart(4,'0'),method:task.callType,taskId,taskName:task.name,ownerId:'',followup:i<completed?'已完成':'待联系',calls:[],history:[],note:'仅演示，无真实客户'};
          if(i<completed){const record=call(customer.id+'-CALL',customer,task,i%2?'未接通':'接通');if(task.callType==='IVR 外呼'){record.agentIdentityId='';record.contactCenterIdentityId='';record.agentName='';record.recordingApplicability='NOT_APPLICABLE_PURE_IVR';record.recordingStatus='不适用';}pack.calls.push(record);customer.calls.push({callId:record.callId,result:record.result,at:record.endedAt,agentName:record.agentName,disposition:record.agentDisposition});}
          batch.rows.push(customer);
        }
      });
      for(let i=0;i<6;i++){
        const customer={id:prefix+code+'-MAN-'+i,name:label+'人工跟进客户'+(i+1),phone:'139000'+si+String(i).padStart(4,'0'),method:'人工外呼',ownerId:accountId,followup:i<2?'已完成':'待联系',calls:[],history:[],note:'演示：确认到店安排'};
        if(i<3){const record=call(customer.id+'-CALL',customer,null,i===1?'未接通':'接通');pack.calls.push(record);customer.calls.push({callId:record.callId,result:record.result,at:record.endedAt,agentName:record.agentName});if(i===1){customer.followup='待继续跟进';const retry=call(customer.id+'-RETRY',customer,null,'接通',2);pack.calls.push(retry);customer.calls.push({callId:retry.callId,result:retry.result,at:retry.endedAt,agentName:retry.agentName});}}
        batch.rows.push(customer);
      }
      const issueCall=pack.calls.find(c=>c.tenantId===tenantId);
      pack.callDataIssues.push({issueId:prefix+code+'-DATA',callId:issueCall.callId,tenantId,enterpriseId,status:'待处理',type:'历史异常依据待核对',impact:'需核对历史异常的具体原因，保留现有通话结果',reason:'历史异常依据待核对',callee:issueCall.callee,callType:issueCall.callType,createdAt:at('10:00:00'),detectedAt:at('10:00:00'),lastResult:'当前通话已有结果，尚缺历史异常依据，不自动改写',readback:null,attempts:0,trace:[],simulation:true});
      pack.batches.push(batch);
    });
  // Attach explicit official-code examples to these display fixtures.
  // Never infer recognition codes for user history or running calls from result text.
  for(const scope of ['HQ','SH','EPI']){
    const examples=[['-TASK-0-C1-CALL','predictive',710],['-MAN-1-CALL','manual',715]];
    for(const [suffix,kind,code] of examples){
      const row=pack.calls.find(item=>item.callId===prefix+scope+suffix&&item.simulation===true&&item.callSource==='WORKBENCH_VIEW_DEMO');
      if(row&&!row.alictiCdr){row.alictiCdr=AliCtiNumberStatus.demoCdr(kind,code);row.alictiCdr.raw.enterpriseId=row.enterpriseId;row.alictiCdr.raw.mainUniqueId=row.callId;}
    }
  }
  try{localStorage.setItem(key,JSON.stringify(pack));}catch(_){}
  for(const name of ['agents','physicalSkillGroups','agentSkills','phoneNumbers','tasks','calls','callDataIssues']){
    const ids={agents:'agentRecordId',physicalSkillGroups:'physicalGroupId',agentSkills:'relationId',phoneNumbers:'numberId',tasks:'taskId',calls:'callId',callDataIssues:'issueId'},id=ids[name];
    for(const r of pack[name])if(!d[name].some(x=>x[id]===r[id]))d[name].push(r);
  }
  for(const task of pack.tasks){const rows=task.callType==='预外呼'?d.predictiveTasks:d.ivrTasks;if(!rows.some(r=>r.taskId===task.taskId))rows.push(task);}
  try{const key='customer-task-batches-v1',batches=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(batches)||batches.some(b=>!b||typeof b.id!=='string'||!b.id)||new Set(batches.map(b=>b.id)).size!==batches.length)throw Error('保留异常名单存储');for(const b of pack.batches)if(!batches.some(x=>x.id===b.id))batches.push(b);localStorage.setItem(key,JSON.stringify(batches));}catch(_){}
  window.WorkbenchFixtureDate=pack.date;
})();
