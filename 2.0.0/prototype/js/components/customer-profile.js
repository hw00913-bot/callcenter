/* Read-only customer profile projection. No source journal or directory mutation. */
(function(root){
  'use strict';
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const array=value=>Array.isArray(value)?value:[];
  const text=value=>typeof value==='string'?value.trim():'';
  const own=(object,key)=>!!object&&Object.prototype.hasOwnProperty.call(object,key);
  const methods={AI:'AI外呼',PREDICTIVE:'预外呼',MANUAL:'人工外呼'};
  function phone(value){
    if(typeof value!=='string'&&typeof value!=='number')return '';
    let normalized=String(value).normalize('NFKC').trim().replace(/[\s()（）\-－]/g,'');
    if(/^\+86\d{7,13}$/.test(normalized))normalized=normalized.slice(3);
    else if(/^0086\d{7,13}$/.test(normalized))normalized=normalized.slice(4);
    return /^\d{7,15}$/.test(normalized)?normalized:'';
  }
  function key(tenantId,enterpriseId,number){const p=phone(number);return text(tenantId)&&text(enterpriseId)&&p?JSON.stringify([tenantId,enterpriseId,p]):'';}
  function stamp(value){
    if(typeof value==='number')return Number.isFinite(value)?value:null;
    if(typeof value!=='string'||!value.trim())return null;
    let v=value.trim();const calendar=/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?/.exec(v);
    if(calendar){const y=Number(calendar[1]),m=Number(calendar[2]),d=Number(calendar[3]),leap=y%4===0&&(y%100!==0||y%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];if(m<1||m>12||d<1||d>days[m-1]||calendar[4]!==undefined&&(Number(calendar[4])>23||Number(calendar[5])>59||Number(calendar[6]||0)>59))return null;}
    if(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(v))v=v.replace(' ','T')+'+08:00';
    const result=Date.parse(v);return Number.isFinite(result)?result:null;
  }
  function latest(values){return array(values).filter(v=>stamp(v)!==null).sort((a,b)=>stamp(b)-stamp(a))[0]||'';}
  function duration(value){
    if(typeof value==='number')return Number.isFinite(value)&&value>=0?value:null;
    if(typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value.trim()))return Number(value.trim());
    return null;
  }
  function method(value){return methods[value]?value:({'预外呼':'PREDICTIVE','人工外呼':'MANUAL','AI外呼':'AI'})[value]||value||'UNKNOWN';}
  function resultLabel(row){return row.resultLabel||row.answerLabel||(row.answered===true||row.customerAnswered===true?'已接通':row.answered===false||row.customerAnswered===false?'未接通':'结果待核');}
  function aggregate(input={}){
    const context=input.context||{},customers=new Map(),issues=[],unlinked=[],callIdentities=new Map(),recordAssociations=new Map();
    if(context.valid===false)return {status:'failed',message:'当前客户读取资格已失效。',data:{customers:[],issues:[],unlinked:[],totalCustomers:0}};
    const inScope=(tenantId,enterpriseId)=>!!text(tenantId)&&!!text(enterpriseId)&&(context.roleCode==='SUPER_ADMIN'||context.regulationOnly===true||tenantId===context.tenantId&&enterpriseId===context.enterpriseId);
    const report=(source,message)=>{if(message&&!issues.some(v=>v.source===source&&v.message===message))issues.push({source,message});};
    const sourceRows=(ret,name,field)=>{
      if(!ret||!['success','partial','forbidden','not-applicable','loading'].includes(ret.status)){report(name,ret?.message||name+'来源暂无法读取，汇总不是完整零记录。');return [];}
      if(ret.status==='loading'){report(name,name+'记录正在读取，当前汇总尚未完整。');return [];}
      if(ret.status==='forbidden'||ret.status==='not-applicable')return [];
      for(const item of array(ret.data?.issues||ret.issues))report(name,typeof item==='string'?item:item.message||item.reason);
      if(ret.status==='partial'&&!array(ret.data?.issues||ret.issues).length)report(name,ret.message||name+'部分记录仍待核对。');
      const rows=Array.isArray(ret.data)?ret.data:ret.data?.[field];
      if(!Array.isArray(rows)){report(name,name+'来源结构暂无法可靠读取，汇总不是完整零记录。');return [];}
      return rows;
    };
    const enterpriseFor=(tenantId,explicit)=>{
      if(text(explicit))return explicit;
      const matches=array(input.tenants).filter(t=>t.tenantId===tenantId&&text(t.enterpriseId));
      const values=[...new Set(matches.map(t=>t.enterpriseId))];
      if(values.length===1)return values[0];
      if(values.length>1)return '';
      return tenantId===context.tenantId&&text(context.enterpriseId)?context.enterpriseId:'';
    };
    const get=(tenantId,enterpriseId,number,name='')=>{
      const id=key(tenantId,enterpriseId,number);if(!id)return null;
      if(!customers.has(id))customers.set(id,{id,tenantId,enterpriseId,phone:phone(number),name:text(name)||'未记录称呼',names:[],sources:[],businesses:[],followups:[],aiFollowups:[],calls:[],imports:[],updatedAt:'',lastContactAt:'',legacyCustomerIds:[]});
      const customer=customers.get(id);if(text(name)&&!customer.names.includes(text(name)))customer.names.push(text(name));if(customer.name==='未记录称呼'&&text(name))customer.name=text(name);return customer;
    };
    const source=(customer,kind)=>{if(!customer.sources.includes(kind))customer.sources.push(kind);};
    const addUnlinked=(sourceKind,row,reason)=>{report(sourceKind,reason);unlinked.push({sourceKind,sourceRef:clone(row.sourceRef||{}),label:row.customerName||row.name||'原来源记录',phoneLabel:row.phone||row.customerPhone||row.sourceRef?.phone||'号码未记录',resultLabel:resultLabel(row),at:row.occurredAt||row.sourceAt||row.updatedAt||'',reason});};
    const addBusiness=(customer,record)=>{
      if(!customer||!text(record.recordId))return;
      if(!customer.businesses.some(r=>r.recordId===record.recordId))customer.businesses.push({recordId:record.recordId,businessCode:record.businessCode||record.code||record.recordId,categoryName:record.categoryName||record.categorySnapshot?.name||record.categoryId||'未记录分类',handlingMode:record.handlingMode||record.mechanism||'TEMPLATE',method:method(record.directMethod||record.currentNode?.methods?.[0]||record.currentNode?.method||''),viewIdentity:record.viewIdentity||'current',cutoffAt:record.cutoffAt||'',updatedAt:record.updatedAt||record.createdAt||'',stateLabel:record.workState?.label||record.directStatus||record.run?.status||'状态待核',outcome:clone(record.businessOutcome||record.run?.businessOutcome||null),sourceRef:{kind:'BUSINESS',recordId:record.recordId}});
      source(customer,'BUSINESS');
      let group=recordAssociations.get(record.recordId);if(!group){group=new Set();recordAssociations.set(record.recordId,group);}group.add(customer.id);
    };
    const addCall=(customer,event)=>{
      if(!customer)return;
      event=clone(event);event.sourceRefs=array(event.sourceRefs).length?event.sourceRefs:[event.sourceRef];event.dialed=event.dialed===true?true:event.dialed===false?false:null;event.answered=event.answered===true?true:event.answered===false?false:null;event.durationSeconds=duration(event.durationSeconds);event.actualAt=stamp(event.actualAt)!==null?event.actualAt:'';event.sourceAt=stamp(event.sourceAt)!==null?event.sourceAt:'';
      const exact=JSON.stringify([customer.tenantId,customer.enterpriseId,event.sourceKind,event.supplier||event.platform||'',event.sourceId]);
      const previous=callIdentities.get(exact);
      if(previous){
        if(previous.conflict||previous.customerId!==customer.id){
          const reason='同一来源标识对应不同客户，原记录转为关联待核，未按首项归档或计数。';
          if(!previous.conflict){const owner=customers.get(previous.customerId);if(owner)owner.calls=owner.calls.filter(row=>row!==previous.event);addUnlinked(previous.event.sourceKind,{...previous.event,customerName:owner?.name||'',sourceRef:{}},reason);previous.conflict=true;}
          addUnlinked(event.sourceKind,{...event,customerName:customer.name,sourceRef:{}},reason);return;
        }
        if(JSON.stringify(previous.event)!==JSON.stringify(event)){report(event.sourceKind,'同一来源通话存在不一致副本，未以读取顺序覆盖原事实。');previous.event.sourceFacts=[...(previous.event.sourceFacts||[]),{sourceKind:event.sourceKind,dialed:event.dialed,answered:event.answered,durationSeconds:event.durationSeconds,resultLabel:event.resultLabel}];previous.event.conflict=true;previous.event.dialed=null;previous.event.answered=null;previous.event.durationSeconds=null;previous.event.resultLabel='来源事实待核';}
        return;
      }
      callIdentities.set(exact,{customerId:customer.id,event});customer.calls.push(event);source(customer,event.sourceKind);
    };
    for(const native of sourceRows(input.native,'原联系档案','customers')){
      const tenantId=text(native.tenantId),enterpriseId=enterpriseFor(tenantId,native.enterpriseId),customer=get(tenantId,enterpriseId,native.phone,native.name);
      if(!inScope(tenantId,enterpriseId)){if(customer)customers.delete(customer.id);if(!tenantId||!enterpriseId)report('来源','部分记录的准确租户企业归属未核定，未猜测关联。');continue;}
      if(!customer){addUnlinked('CLOUD',native,'部分原联系档案缺少准确归属或完整号码，未猜测关联。');continue;}
      customer.legacyCustomerIds.push(native.id||customer.id);for(const name of array(native.names))if(text(name)&&!customer.names.includes(name))customer.names.push(name);
      source(customer,'CLOUD');
      for(const item of array(native.batches))customer.imports.push({sourceKind:item.archiveLedgerRecord?'DCC':'CLOUD',batchId:item.batchId||'',rowId:item.rowId||item.recordId||'',label:item.batchName||item.businessBatchNo||'原导入记录',method:method(item.method),at:item.createdAt||'',updatedAt:item.updatedAt||'',stateLabel:item.followup||'状态未记录',sourceRef:item.archiveLedgerRecord?{kind:'DCC_IMPORT',taskId:item.taskId,recordId:item.recordId,customerId:native.id}:{kind:'NATIVE_CUSTOMER',customerId:native.id}});
      for(const call of array(native.calls)){
        if(call.tenantId!==tenantId||call.enterpriseId!==enterpriseId){report('CLOUD','原通话与客户归属不一致，未并入档案。');continue;}
        const original=phone(call.customerPhone||(call.direction==='呼入'?call.caller:call.callee));
        if(!original){addUnlinked('CLOUD',call,'部分原通话缺少完整实际号码，未借用当前号码。');continue;}
        const owner=get(tenantId,enterpriseId,original,call.customerName||native.name),dcc=call.directoryMeta?.ledgerResult===true,kind=dcc?'DCC':'CLOUD',sourceRef=dcc?{kind:'DCC_CALL',customerId:native.id,taskId:call.directoryMeta.sourceTaskId,resultId:call.directoryMeta.sourceResultId,callId:call.callId}:{kind:'NATIVE_CALL',customerId:native.id,callId:call.callId};
        const started=call.dialedAt||call.ringingAt||call.connectedAt||'',recorded=call.endedAt||call.ringingAt||call.recordedAt||call.updatedAt||'';
        addCall(owner,{sourceKind:kind,sourceId:JSON.stringify([tenantId,enterpriseId,call.callId,call.directoryMeta?.sourceTaskId||'',call.directoryMeta?.sourceResultId||'']),sourceRef,method:method(call.callType),phone:original,callId:call.callId||'',taskId:call.directoryMeta?.sourceTaskId||call.taskId||'',sceneName:call.sceneName||'',taskName:call.taskName||'',actorName:call.agentName||'',actorAccountId:call.actualAnswerAccountId||call.actualCallerAccountId||'',dialed:own(call,'profileActualDialed')?call.profileActualDialed:own(call,'dialed')?call.dialed:own(call,'actualDialed')?call.actualDialed:null,answered:typeof call.directoryMeta?.customerAnswered==='boolean'?call.directoryMeta.customerAnswered:typeof call.customerAnswered==='boolean'?call.customerAnswered:null,durationSeconds:call.durationSeconds,actualAt:started,sourceAt:recorded,receivedAt:call.receivedAt||'',resultLabel:call.profileResultLabel||call.answerLabel||call.resultLabel||(dcc?call.directoryMeta.resultPending?'结果待确认':call.directoryMeta.customerAnswered===true?'已接通':call.directoryMeta.customerAnswered===false?'未接通':'结果未知':call.agentDisposition||'原记录结果'),summary:[call.profileDispositionLabel||call.agentDisposition,call.dispositionRemark||call.customerNote].filter(Boolean).join('；'),businessRecordId:call.businessFlowRecordId||call.businessRecordId||call.fourNodeRecordId||'',segmentId:call.businessFlowSegmentId||call.followupId||'',providerCallId:call.providerCallId||'',originalSourceTenantId:call.tenantId,readOnly:true});
      }
    }
    for(const record of sourceRows(input.business,'统一业务','records')){
      if(!text(record.recordId))continue;
      const history=record.viewIdentity==='history',tenantId=history?context.tenantId:record.ownerTenantId,enterpriseId=enterpriseFor(tenantId,history?context.enterpriseId:record.enterpriseId),values=record.currentValues?.IMPORT||record.fields||{},currentPhone=phone(values.phone||record.customerPhone),name=values.name||record.customerName||'未记录称呼';
      if(!inScope(tenantId,enterpriseId)){if(!tenantId||!enterpriseId)report('BUSINESS','部分业务的准确企业归属未核定，未猜测关联。');continue;}
      const current=get(tenantId,enterpriseId,currentPhone,name);if(current)addBusiness(current,record);else report('BUSINESS','部分有权业务缺少准确客户归属或完整号码，保留在原业务入口，未猜测归档。');
      const segments=array(record.rounds).flatMap(round=>array(round.segments).map(segment=>({segment,round}))),seen=new Set();
      for(const {segment:seg,round} of segments){
        const segmentId=seg.segmentId||seg.followupId;if(!text(segmentId)){report('BUSINESS','部分历史跟进缺少准确段标识，仍可从原业务核对。');continue;}
        const segmentKey=JSON.stringify([record.recordId,segmentId]);if(seen.has(segmentKey))continue;seen.add(segmentKey);
        const basis=seg.contentSnapshot?.basis||seg.basis||{},original=phone(seg.phone||seg.customerPhone||basis.importValues?.phone),segmentCustomer=get(tenantId,enterpriseId,original,basis.importValues?.name||name),m=method(seg.method),follow={sourceKind:'BUSINESS',recordId:record.recordId,segmentId,method:m,summary:seg.summary||seg.result?.summary||'',stateLabel:seg.abandoned||seg.archiveState==='ABANDONED'?'废弃保留（未正常完成）':seg.archiveState||seg.status||'状态待核',saved:seg.contentSaved===true,archived:seg.archived===true,abandoned:seg.abandoned===true||seg.archiveState==='ABANDONED',actualAccountId:m==='PREDICTIVE'?seg.actualAnswerAccountId||'':m==='MANUAL'?seg.assignedAccountId||'':'',actorAccountId:seg.actorAccountId||'',at:seg.savedAt||seg.contentSnapshot?.savedAt||seg.startedAt||'',sourceRef:{kind:'BUSINESS_FOLLOWUP',recordId:record.recordId,segmentId},originalSourceTenantId:seg.tenantId||round.tenantId||''};
        if(segmentCustomer){addBusiness(segmentCustomer,record);segmentCustomer.followups.push(follow);}
        else report('BUSINESS','部分业务跟进原联系号码未核定，未把旧通话搬到当前新号码。');
        for(const call of array(seg.calls)){
          const actualPhone=phone(call.phone||call.customerPhone||original),owner=get(tenantId,enterpriseId,actualPhone,basis.importValues?.name||name);
          if(!owner){report('BUSINESS','部分业务通话实际号码未记录，未计入某个客户。');continue;}
          addBusiness(owner,record);
          const identity=call.attemptId||call.callId||call.providerCallId;if(!text(identity)){report('BUSINESS','部分通话缺少准确尝试标识，未生成虚构联系记录。');continue;}
          addCall(owner,{sourceKind:'BUSINESS',sourceId:JSON.stringify([record.recordId,segmentId,identity]),sourceRef:{kind:'BUSINESS_CALL',recordId:record.recordId,segmentId,attemptId:call.attemptId||'',callId:call.callId||call.providerCallId||call.attemptId},method:m,phone:actualPhone,callId:call.callId||call.providerCallId||'',attemptId:call.attemptId||'',providerCallId:call.providerCallId||'',businessRecordId:record.recordId,segmentId,taskId:seg.resourceSnapshot?.taskId||seg.resourceId||'',taskName:seg.resourceSnapshot?.name||'',sceneName:seg.sceneSnapshot?.name||basis.aiSceneSnapshot?.name||'',dialed:call.dialed===true?true:call.dialed===false?false:null,answered:typeof call.customerAnswered==='boolean'?call.customerAnswered:null,durationSeconds:call.durationSeconds,actualAt:call.dialedAt||call.resolvedDialedAt||'',sourceAt:call.endedAt||call.updatedAt||'',acceptedAt:call.startedAt||seg.startedAt||'',resultLabel:call.state==='QUEUED'&&call.dialed!==true?'尚未实际拨打':resultLabel(call),summary:follow.summary,actorAccountId:follow.actualAccountId,actorName:m==='AI'?'AI系统':'',originalSourceTenantId:seg.tenantId||round.tenantId||'',readOnly:true});
        }
      }
    }
    for(const row of sourceRows(input.ai,'AI外呼','rows')){
      const tenantId=text(row.tenantId),enterpriseId=enterpriseFor(tenantId,row.enterpriseId),number=phone(row.phone||row.customerPhone),customer=get(tenantId,enterpriseId,number,row.customerName||row.name);
      if(!inScope(tenantId,enterpriseId)){if(customer)customers.delete(customer.id);if(!tenantId||!enterpriseId)report('来源','部分记录的准确租户企业归属未核定，未猜测关联。');continue;}
      if(!customer){addUnlinked('AI',row,'部分AI原记录缺少可信完整号码或准确归属，保留原记录入口待核，未按脱敏号码猜测客户。');continue;}
      const sourceRef=clone(row.sourceRef||{}),sourceId=text(row.sourceId)||text(row.sourceKey)||JSON.stringify(sourceRef);if(!sourceId||sourceId==='{}'){report('AI','部分AI原记录缺少准确来源标识，未生成虚构通话。');continue;}
      if(row.recordType==='AI_FOLLOWUP'||row.kind==='AI_FOLLOWUP'||sourceRef.kind==='AI_FOLLOWUP'){
        if(customer.aiFollowups.some(f=>f.sourceId===sourceId))continue;
        const visits=array(row.visits).map(item=>({followupAt:item.followupAt||item.at||item.visitTime||'',summary:item.summary||item.content||item.record||'',actorName:item.actorName||item.operatorName||'',summaryOnly:false}));
        const latestFollowup=row.latestFollowup&&typeof row.latestFollowup==='object'?{followupAt:row.latestFollowup.followupAt||row.latestFollowup.at||row.followupAt||row.occurredAt||'',summary:row.latestFollowup.summary||row.latestFollowup.content||row.summary||'',actorName:row.latestFollowup.actorName||'',summaryOnly:row.latestFollowup.summaryOnly===true}:null;
        customer.aiFollowups.push({sourceId,sourceRef,method:'AI',sceneName:row.sceneName||'',taskName:row.taskName||row.taskId||'',at:row.followupAt||row.occurredAt||'',summary:row.summary||latestFollowup?.summary||'',visits,latestFollowup,reportedVisitCount:row.reportedVisitCount??null,resultLabel:row.resultLabel||row.statusLabel||'原回访资料',readOnly:true});source(customer,'AI');continue;
      }
      addCall(customer,{...clone(row),sourceKind:'AI',sourceId,sourceRef,method:'AI',phone:number,callId:row.callId||row.providerCallId||'',taskId:row.taskId||'',taskName:row.taskName||'',sceneName:row.sceneName||'',dialed:row.dialed===true?true:row.dialed===false?false:null,answered:typeof row.answered==='boolean'?row.answered:typeof row.customerAnswered==='boolean'?row.customerAnswered:null,durationSeconds:row.durationSeconds,actualAt:row.callAt||row.actualAt||row.dialedAt||'',sourceAt:row.sourceAt||row.occurredAt||row.updatedAt||'',resultLabel:resultLabel(row),summary:row.summary||row.resultSummary||'',actorName:'AI系统',readOnly:true});
    }
    // Collapse only explicitly linked native/business mirrors in the same customer.
    for(const customer of customers.values()){
      const removed=new Set();
      for(const business of customer.calls.filter(c=>c.sourceKind==='BUSINESS')){
        const mirrors=customer.calls.filter(native=>['CLOUD','DCC','AI'].includes(native.sourceKind)&&native.businessRecordId===business.businessRecordId&&native.segmentId===business.segmentId&&native.method===business.method&&((native.callId&&native.callId===business.callId)||(native.providerCallId&&native.providerCallId===business.providerCallId)));
        for(const native of mirrors){
          const conflict=native.dialed!==null&&business.dialed!==null&&native.dialed!==business.dialed||native.answered!==null&&business.answered!==null&&native.answered!==business.answered||native.durationSeconds!==null&&business.durationSeconds!==null&&native.durationSeconds!==business.durationSeconds;
          business.sourceRefs.push(...native.sourceRefs);
          business.sourceFacts=[...(business.sourceFacts||[]),{sourceKind:native.sourceKind,dialed:native.dialed,answered:native.answered,durationSeconds:native.durationSeconds,resultLabel:native.resultLabel}];
          if(conflict){report(native.sourceKind,'同一准确通话的镜像事实不一致，合为一次记录但事实保持待核，各原来源均可查看。');business.conflict=true;business.dialed=null;business.answered=null;business.durationSeconds=null;business.resultLabel='镜像事实待核';}
          else{if(business.durationSeconds===null)business.durationSeconds=native.durationSeconds;if(business.dialed===null)business.dialed=native.dialed;if(business.answered===null)business.answered=native.answered;}
          removed.add(native);
        }
      }
      customer.calls=customer.calls.filter(c=>!removed.has(c));
      for(const event of customer.calls){
        const candidates=customer.calls.filter(other=>other!==event&&other.sourceKind!==event.sourceKind&&event.taskId&&other.taskId===event.taskId&&event.callId&&other.callId===event.callId&&other.method===event.method);
        if(candidates.length){event.linkPending=true;report(event.sourceKind,'部分不同来源有相同任务与通话标识，但缺少完整镜像关联，原记录分列、次数关系待核。');}
      }
      customer.calls.sort((a,b)=>(stamp(b.actualAt||b.sourceAt)??-Infinity)-(stamp(a.actualAt||a.sourceAt)??-Infinity)||a.sourceId.localeCompare(b.sourceId));
      customer.followups.sort((a,b)=>(stamp(b.at)??-Infinity)-(stamp(a.at)??-Infinity)||a.segmentId.localeCompare(b.segmentId));
      customer.businessCount=customer.businesses.length;customer.followupCount=customer.followups.length;customer.archivedFollowupCount=customer.followups.filter(f=>f.archived&&!f.abandoned).length;customer.aiFollowupCount=customer.aiFollowups.length;customer.aiVisitDetailCount=customer.aiFollowups.reduce((sum,f)=>sum+f.visits.length,0);customer.aiLatestSummaryCount=customer.aiFollowups.filter(f=>!f.visits.length&&f.latestFollowup).length;customer.callRecordCount=customer.calls.length;customer.actualDialCount=customer.calls.filter(c=>c.dialed===true&&!c.linkPending).length;customer.pendingCallCount=customer.calls.filter(c=>c.dialed!==true||c.linkPending).length;customer.unknownDurationCount=customer.calls.filter(c=>c.durationSeconds===null||c.linkPending).length;customer.totalDurationSeconds=customer.calls.filter(c=>c.durationSeconds!==null&&!c.linkPending).reduce((sum,c)=>sum+c.durationSeconds,0);customer.lastContactAt=latest(customer.calls.filter(c=>c.dialed===true&&!c.linkPending).map(c=>c.actualAt));customer.updatedAt=latest([...customer.calls.flatMap(c=>[c.actualAt,c.sourceAt,c.receivedAt]),...customer.followups.map(f=>f.at),...customer.aiFollowups.flatMap(f=>[f.at,f.latestFollowup?.followupAt,...f.visits.map(v=>v.followupAt)]),...customer.imports.flatMap(i=>[i.updatedAt,i.at]),...customer.businesses.map(b=>b.updatedAt)]);
    }
    const result=[...customers.values()].filter(c=>c.businesses.length||c.followups.length||c.aiFollowups.length||c.calls.length||c.imports.length||c.legacyCustomerIds.length).sort((a,b)=>(stamp(b.updatedAt)??-Infinity)-(stamp(a.updatedAt)??-Infinity)||a.id.localeCompare(b.id));
    return {status:issues.length?'partial':'success',data:{customers:result,issues,unlinked,totalCustomers:result.length,scopeToken:input.scopeToken||''}};
  }
  root.CustomerProfile={aggregate,normalizePhone:phone,identity:key,stamp,duration,methodLabel:value=>methods[method(value)]||value||'来源未记录'};
})(window);
