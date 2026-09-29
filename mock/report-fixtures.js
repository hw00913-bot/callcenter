/** Fictional lead cohorts and official-shaped CDRs for report demonstrations only. */
(function () {
  'use strict';
  const kit=window.DemoFixtureKit,data=window.CloudCallData;
  if(!kit||!data||kit.reportFixtureCohort===kit.cohort)return;
  kit.reportFixtureCohort=kit.cohort;
  const stamp=ms=>new Date(ms).toLocaleString('sv-SE'), marker={simulation:true,demoPack:kit.version,demoCohort:kit.cohort,reportFixture:true};
  for(const instance of data.instances||[])if(!instance.brandId&&['7522240','7522241','DEMO-ENT-003'].includes(instance.enterpriseId))instance.brandId=instance.enterpriseId!=='DEMO-ENT-003'?'BRAND-NISSAN':'BRAND-EPI';
  for(const scope of kit.scopes){const group=data.physicalSkillGroups.find(g=>g.skillGroupId===scope.skillGroupId&&g.tenantId===scope.tenantId);if(group&&!group.providerQueueNo){group.providerQueueNo=scope.code==='HQ'?'6101':'6201';group.queueMappingSource='DEMO_EXPLICIT_MAPPING';}}
  const hq=kit.scopes.find(s=>s.code==='HQ'),sh=kit.scopes.find(s=>s.code==='SH');if(!hq||!sh)return;
  const codes=Array.from({length:9},(_,i)=>'LEAD-'+kit.cohort+'-'+String(i+1).padStart(3,'0')).concat(['0012','12','']);
  const names=['林语','周宁','陈悦','徐安','许晨','沈薇','陆言','唐玥','顾宁','叶舒','高悦','程嘉'];
  const firstPhones=codes.map((_,i)=>'1390088'+String(1000+i).padStart(4,'0'));
  function makeBatch(scope,suffix,entries,age){
    const id=kit.prefix+scope.code+'-'+kit.cohort+'-REPORT-'+suffix;
    const batch={...marker,id,name:(scope.code==='HQ'?'总部':'上海门店')+'·线索专项·'+suffix,businessType:'lead',brandId:'BRAND-NISSAN',tenantId:scope.tenantId,enterpriseId:scope.enterpriseId,createdAt:stamp(kit.anchor-age*86400000),createdBy:scope.accountId,errors:[],rows:[]};
    entries.forEach(({index,code=codes[index],attempts= index%4,phone=firstPhones[index]},n)=>{
      const row={...marker,id:id+'-C'+String(n+1).padStart(2,'0'),businessType:'lead',externalDocumentId:code,brandId:'BRAND-NISSAN',name:names[index%names.length]+'女士',phone,note:'咨询车型与到店安排',ownerId:attempts?scope.accountId:'',method:attempts?'人工外呼':'',taskId:'',taskName:'',followup:attempts?'待继续跟进':'待联系',activeCallId:'',calls:[],history:[]};
      const seat=data.agents.find(a=>a.contactCenterIdentityId===scope.seatId),number=data.phoneNumbers.find(x=>x.numberId===scope.numberId);
      for(let attempt=0;attempt<attempts;attempt++){
        const at=kit.anchor-(age*86400000)+3600000+index*300000+attempt*7200000;
        const answered=attempt===attempts-1&&index%3!==1, duration=answered?90+index*13:0;
        const callId=row.id+'-CALL-'+(attempt+1),end=at+8000+duration*1000;
        const visit=index%3===0,drive=index%3===0;
        const values={leadLevel:['A级','B级','C级','D级'][index%4],intentionLevel:['高意向','中意向','低意向','无意向'][index%4],visitIntention:visit?'有意向':index%2?'暂不确定':'无意向',testDriveIntention:drive?'有意向':'暂不确定',plannedVisitAt:visit?stamp(kit.anchor+86400000+index*1800000).slice(0,16).replace(' ','T'):'',plannedStoreId:visit?sh.tenantId:'',plannedStoreName:visit?'上海华东门店':'',updatedAt:new Date(end+60000).toISOString(),updatedBy:scope.accountId};
        const raw={enterpriseId:Number(scope.enterpriseId),mainUniqueId:callId,requestUniqueId:row.id,customerNumber:phone,cno:String(seat?.cno||scope.cnos?.[0]||'0012'),startTime:Math.floor(at/1000),upTime:Math.floor((at+3000)/1000),endTime:Math.floor(end/1000),bridgeDuration:duration,totalDuration:Math.floor((end-at)/1000),status:answered?3:1};
        if(answered)raw.bridgeTime=Math.floor((at+8000)/1000);
        const c={...marker,callId,contactId:callId,enterpriseId:scope.enterpriseId,tenantId:scope.tenantId,brandId:'BRAND-NISSAN',businessType:'lead',externalDocumentId:code,customerTaskItemId:row.id,customerTaskBatchId:id,customerName:row.name,caller:number.number,callee:phone,customerPhone:phone,callType:'人工外呼',direction:'呼出',taskId:'',accountId:scope.accountId,callerNumberId:scope.numberId,contactCenterIdentityId:seat?.contactCenterIdentityId||'',agentIdentityId:seat?.contactCenterIdentityId||'',agentName:seat?.userName||'',skillGroupId:scope.skillGroupId,ringingAt:stamp(at),answeredAt:answered?stamp(at+8000):'—',endedAt:stamp(end),at:stamp(end),durationSeconds:duration,result:answered?'接通':'未接通',processingStatus:'已完成',callSource:'DEMO_FIXTURE_HISTORY',attemptNumber:attempt+1,attemptHistoryComplete:true,agentDisposition:answered?index%2?'需要再次联系':'已完成回访':'本次未接通',recordingApplicability:'不适用',recordingStatus:'演示无录音',alictiCdr:{kind:'manual',raw,mock:true}};
        if(answered)c.customerFollowup=values;
        kit.add(data.calls,'callId',c);row.calls.push(c);row.history.push({at:c.endedAt,action:'记录通话结果',callId,result:c.result});
        row.followup=answered&&index%2===0?'已完成':'待继续跟进';
      }
      batch.rows.push(row);
    });
    kit.add(kit.batches,'id',batch);
  }
  makeBatch(hq,'首次咨询',codes.map((code,index)=>({index,code,attempts:index===0?1:index===8?2:index%4})),3);
  makeBatch(hq,'再次跟进',[{index:1,attempts:2},{index:3,attempts:1},{index:9,attempts:2},{index:2,code:'LEAD-'+kit.cohort+'-OTHER',phone:firstPhones[0],attempts:1}],1);
  makeBatch(sh,'门店承接',[{index:3,attempts:2},{index:4,attempts:1}],1);
  // Same code across batches/organizations is intentional; each original row and call remains intact.
})(window);
