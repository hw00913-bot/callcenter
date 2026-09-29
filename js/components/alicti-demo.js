/* Explicit local fixtures. No network, signing, or supplier operations. */
(function(root){
  'use strict';
  const stamp=()=>new Date().toLocaleString('sv-SE');
  let ids={};try{ids=JSON.parse(sessionStorage.getItem('alicti-contract-demo-ids-v1')||'{}');}catch(_){}
  function resourceId(kind,row){
    const actual=Number(row?.[{skill:'providerSkillId',ivr:'providerIvrId',task:'providerTaskId',batch:'providerBatchId',agent:'providerAgentId'}[kind]]);
    if(Number.isSafeInteger(actual)&&actual>0)return actual;
    const key=[row?.enterpriseId,kind,row?.[{skill:'skillGroupId',ivr:'contactFlowId',task:'taskId',batch:'batchId',agent:'contactCenterIdentityId'}[kind]]].join('|');
    if(!Number.isSafeInteger(ids[key])||ids[key]<1){ids[key]=Math.max(800000,...Object.values(ids).filter(Number.isSafeInteger))+1;sessionStorage.setItem('alicti-contract-demo-ids-v1',JSON.stringify(ids));}
    return ids[key];
  }
  let preferences={phoneSettings:{},previewAsr:{}};try{const stored=JSON.parse(sessionStorage.getItem('alicti-demo-preferences-v1')||'null');if(stored?.phoneSettings&&stored?.previewAsr)preferences=stored;}catch(_){}
  preferences.transcriptionConditions=preferences.transcriptionConditions||{};
  const demo={taskControlScenario:'success',rasrOutcome:'success',mode:'mock',enterpriseId:7522240,phoneSettings:preferences.phoneSettings,skillOutcome:'success',lastSkill:null,lastSkillResource:null,resourceId};
  // Independent synthetic supplier state for the four original task fixtures.
  // These values are fixture data, never derived from a row's displayed status.
  const taskServerSeeds=Object.freeze({
    'TASK-PRED-0901':{enterpriseId:7522240,tenantId:'TEN-NISSAN-HQ',callType:'预外呼',status:1,type:1},
    'TASK-PRED-0830':{enterpriseId:7522241,tenantId:'TEN-NISSAN-SH',callType:'预外呼',status:2,type:1},
    'TASK-IVR-0902':{enterpriseId:7522240,tenantId:'TEN-NISSAN-HQ',callType:'IVR 外呼',status:1,type:2},
    'TASK-IVR-0831':{enterpriseId:7522240,tenantId:'TEN-NISSAN-HQ',callType:'IVR 外呼',status:3,type:2}
  });
  demo.taskControlSeed=row=>{
    const seed=taskServerSeeds[row?.taskId];
    if(!seed||String(row.enterpriseId)!==String(seed.enterpriseId)||row.tenantId!==seed.tenantId||row.callType!==seed.callType)return null;
    if(Object.hasOwn(row,'alictiMockTaskProperty')||Object.hasOwn(row,'alictiControlResponse')||Object.hasOwn(row,'providerStatusCode'))return null;
    return {id:resourceId('task',row),enterpriseId:seed.enterpriseId,status:seed.status,type:seed.type};
  };
  demo.savePreferences=()=>sessionStorage.setItem('alicti-demo-preferences-v1',JSON.stringify(preferences));
  Object.defineProperty(demo,'previewAsr',{get(){return preferences.previewAsr[root.AppState?.get().enterpriseId]??1;},set(value){if(value==='omit'||[0,1].includes(Number(value))){preferences.previewAsr[root.AppState.get().enterpriseId]=value==='omit'?'omit':Number(value);demo.savePreferences();}}});
  demo.transcriptionConditions=enterpriseId=>({...preferences.transcriptionConditions[enterpriseId],mock:true,source:'明确的企业转写演示条件，不代表真实开通'});
  demo.setTranscriptionConditions=(enterpriseId,input)=>{preferences.transcriptionConditions[enterpriseId]={enterpriseAutoAsr:input.enterpriseAutoAsr,filterBySeat:input.filterBySeat};demo.savePreferences();};
  demo.transcriptionGate=(agent,cdrIsAsr=demo.previewAsr)=>({...AliCtiFields.previewTranscriptionGate({callKind:'preview',...demo.transcriptionConditions(agent.enterpriseId),isAsr:agent.isAsr,cdrIsAsr}),mock:true});
  demo.saveSeatAsr=(agent,value)=>{
    demo.lastSeatAsr=null;
    if(value==='')return true;
    const isAsr=AliCtiFields.code(value);if(![0,1].includes(isAsr))return false;
    if(isAsr===AliCtiFields.code(agent.isAsr))return true;
    if(AccountSeat.scopeError(agent.tenantId,agent.enterpriseId))return false;
    if(AccountSeat.inUse(agent)){showToast('请先下线，再修改坐席转写设置','warning');return false;}
    const auth=AliCtiFields.authFields(agent.enterpriseId);if(auth.pending.length)return false;
    const response=demo.seatUpdateOutcome==='unknown'?null:demo.seatUpdateOutcome==='failure'?{result:-1,errorCode:20023,description:'坐席在线（模拟）'}:{result:0,description:'成功（模拟）'};
    demo.lastSeatAsr={endpoint:'agent/update',fields:{...auth.fields,cno:agent.cno,isAsr,power:AliCtiFields.seatFields(agent).power},response,mock:true};
    if(response?.result!==0){showToast('未确认坐席设置成功，保留原转写设置','warning');return false;}
    return AccountSeat.persistAgent({...agent,isAsr});
  };
  demo.credentials=agent=>({enterpriseId:agent.enterpriseId,sessionKey:'DEMO-SESSION-'+agent.cno,agentGateWayUrl:'wss://demo.invalid/agent',bindTel:root.SeatPhoneConfig?.extension(agent)||'',bindType:3});
  demo.seatActive=(agent,active)=>{
    if(AccountSeat.scopeError(agent.tenantId,agent.enterpriseId))return false;
    if(AccountSeat.inUse(agent)){showToast('请先结束通话、完成话后处理并下线，再修改坐席配置','warning');return false;}
    const fields={...AliCtiFields.authFields(agent.enterpriseId).fields,cno:agent.cno,active,power:AliCtiFields.seatFields(agent).power};
    const isOb=agent.callEnabled===false?0:1;
    const auth=AliCtiFields.authFields(agent.enterpriseId);if(auth.pending.length)return false;
    const response=demo.seatUpdateOutcome==='unknown'?null:demo.seatUpdateOutcome==='failure'?{result:-1,errorCode:20023,description:'座席状态在线（模拟）'}:{result:0,data:{agent:{cno:agent.cno,active,isOb}}};
    demo.lastSeatUpdate={endpoint:'agent/update',fields,response,queries:response?.result===0?[{endpoint:'agent/get',fields:{...auth.fields,cno:agent.cno},response:{result:0,data:{agent:{cno:agent.cno,active,isOb}}}},{endpoint:'agentStatus/get',fields:{...auth.fields,cno:agent.cno},response:{result:0,data:{state:'离线',loginStatus:0}}}]:[],mock:true};
    root.AliCtiAdapter.lastRequest=demo.lastSeatUpdate;
    if(response?.result!==0){showToast(response?'坐席状态已变化，请先下线再修改（模拟）':'修改结果待核对，原配置保留','warning');return false;}return true;
  };
  demo.saveSkills=(agent,relations)=>{
    if(AccountSeat.scopeError(agent.tenantId,agent.enterpriseId))return false;

    const request=AliCtiFields.skillUpdateFields(agent,relations,CloudCallData,resourceId);
    if(request.pending.length){showToast(request.pending.join('；'),'warning');return false;}
    const current=CloudCallData.agentSkills.filter(r=>r.identityId===agent.contactCenterIdentityId);
    const savedAt=new Date().toISOString();
    const changedRelation=row=>{const previous=current.find(r=>r.relationId===row.relationId);return !previous||['identityId','physicalGroupId','skillLevel','status','syncStatus'].some(key=>previous[key]!==row[key]);};
    const persistSkills=rows=>{const changed=rows.length!==current.length||rows.some(changedRelation);return AccountSeat.persistAgent(changed?{...agent,localUpdatedAt:savedAt}:agent,rows.map(row=>changedRelation(row)?{...row,localUpdatedAt:savedAt}:{...row}));};
    if(AccountSeat.inUse(agent)){
      const additive=relations.length>current.length&&current.every(r=>relations.some(n=>n.relationId===r.relationId&&n.physicalGroupId===r.physicalGroupId&&n.identityId===r.identityId&&Number(n.skillLevel)===Number(r.skillLevel)));
      if(!additive){showToast('新增技能可先保存待提交；修改等级、移出或提交技能须等待坐席下线','warning');return false;}
      const next=relations.map(r=>{const existing=current.find(n=>n.relationId===r.relationId);return existing?{...existing}:{...r,status:'待生效',syncStatus:'待提交'};});
      if(!persistSkills(next))return false;
      CloudCallRuntime.addAudit('新增坐席技能待提交（本地演示）',agent.cno,agent.tenantId,'保留当前技能','坐席下线后由管理员提交新增技能');
      return true;
    }

    const response=demo.skillOutcome==='failure'?{result:0,data:{failCno:'['+agent.cno+']'}}:demo.skillOutcome==='unknown'?{result:0,data:{failCno:'无法识别'}}:{result:0,data:{failCno:'[]'}};
    const result=AliCtiFields.skillUpdateResult(response,[agent.cno]);
    demo.lastSkill={request,response,result,mock:true};
    if(!result.successCnos.includes(agent.cno)){showToast(result.pending?'返回的失败工号无法识别，保持原关联（模拟）':'本坐席技能更新失败，保持原关联（模拟）','warning');return false;}
    const next=relations.map(r=>({...r,status:'已生效',syncStatus:'同步成功'}));
    if(!persistSkills(next))return false;
    CloudCallRuntime.addAudit('更新坐席技能（本地演示）',agent.cno,agent.tenantId,'原技能集合',JSON.stringify(request.body));
    return true;
  };
  demo.skillResource=(next,existing)=>{
    const id=resourceId('skill',next),fields={name:next.name,...(existing?{id}:{} )};
    demo.lastSkillResource={endpoint:existing?'skill/update':'skill/create',fields,response:{result:0,data:{id,enterpriseId:Number(next.enterpriseId),name:next.name,comment:'',createTime:stamp()}},mock:true};
    return demo.lastSkillResource;
  };
  demo.taskCreated=row=>{
    row.simulation=true;row.demoProviderTaskId=resourceId('task',row);row.providerStatusCode=0;row.providerStatus='初始（模拟）';
    const caller=AliCtiFields.validateCallerSettings(AliCtiFields.taskCallerSettings(row),{requireCallerNumber:false});
    row.alictiMockTaskProperty={...(caller.ok?caller.fields:{}),id:row.demoProviderTaskId,status:0,type:row.providerType};
    row.alictiCreateResponse={result:0,data:{taskProperty:structuredClone(row.alictiMockTaskProperty)},mock:true};
  };
  demo.imported=(row,requests)=>{
    const previous=row.alictiImportResults||[];
    row.alictiImportResults=requests.filter(request=>!request.pending.length).map((request,index)=>{
      const total=request.fields.taskTelList.length,sourceBatchId=request.sourceBatchId||request.fields.name,old=previous.find(b=>b.sourceBatchId===sourceBatchId);
      const raw={result:0,data:{taskId:request.fields.taskId,fileId:resourceId('batch',{enterpriseId:row.enterpriseId,batchId:row.taskId+'|'+sourceBatchId}),importTotal:total,successTotal:total,invalidTotal:0}};
      return {...(old?.pushStatus?{pushStatus:old.pushStatus}:{}),sourceBatchId,batchName:request.fields.name,response:raw,normalized:AliCtiFields.importResult(raw),mock:true};
    });
  };
  demo.importSummary=row=>{
    if(!row.alictiImportResults?.length)return '';
    return '<details class="technical-details"><summary>接口导入统计（模拟）</summary><p>以下数值来自独立模拟响应，不代表真实导入；未分类数量不自动解释为排重数。</p>'+PlatformUI.table([{key:'batchName',label:'批次'},{key:'importTotal',label:'请求总数'},{key:'successTotal',label:'导入成功'},{key:'invalidTotal',label:'非法号码'},{key:'unclassifiedTotal',label:'未分类差额'}],row.alictiImportResults.map(item=>({batchName:item.batchName,...item.normalized})))+'</details>';
  };
  root.AliCtiDemo=demo;
})(window);
