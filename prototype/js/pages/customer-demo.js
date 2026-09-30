/** Local, opt-in scenario fixture. Never calls AliCti or changes existing records. */
(function(){
  const d=CloudCallData, storageKey='customer-closed-loop-demo-v1', batchKey='customer-task-batches-v1';
  const tenantId='TEN-NISSAN-HQ',enterpriseId='7522240',ownerId='ACC-OPS-108';
  function add(list,key,item){if(!list.some(r=>r[key]===item[key]))list.push(item);}
  function resources(){
    ['预外呼','IVR 外呼'].forEach((type,i)=>{const base=d.tasks.find(t=>t.callType===type&&t.tenantId===tenantId);if(base)add(d.tasks,'taskId',{...base,taskId:'DEMO-CUSTOMER-TASK-'+i,name:(i?'IVR通知':'预外呼邀约')+'（名单分配演示）',customerSourceMode:'assigned',status:'待分配客户',total:0,completed:0,connected:0,campaignId:'',scheduleAt:'手工启动',startedAt:'',listSource:'客户名单分配',simulation:true});});
    let seat=d.agents.find(a=>a.accountId===ownerId&&a.tenantId===tenantId&&a.lifecycleStatus!=='已删除');
    if(!seat){seat={agentRecordId:'DEMO-CUSTOMER-AGENT',contactCenterIdentityId:'DEMO-CUSTOMER-IDENTITY',accountId:ownerId,userName:'王静（演示坐席）',mobile:'136****1108',tenantId,enterpriseId,cno:'8801',areaCode:'021',loginName:'demo_customer_agent',lifecycleStatus:'已启用',agentStatus:'空闲',syncStatus:'同步成功',callEnabled:true,currentCall:false,acceptNewTasks:true,simulation:true};d.agents.push(seat);}
    add(d.physicalSkillGroups,'physicalGroupId',{physicalGroupId:'DEMO-CUSTOMER-PHY',skillGroupId:'DEMO-CUSTOMER-SKILL',skillTemplateId:'TPL-SALES',tenantId,enterpriseId,name:'客户邀约（本地演示）',status:'已启用',syncStatus:'同步成功',memberCount:1,referenceCount:1,simulation:true});
    add(d.agentSkills,'relationId',{relationId:'DEMO-CUSTOMER-REL',identityId:seat.contactCenterIdentityId,physicalGroupId:'DEMO-CUSTOMER-PHY',skillLevel:1,status:'已生效',syncStatus:'同步成功',simulation:true});
    add(d.phoneNumbers,'numberId',{numberId:'DEMO-CUSTOMER-NUM',number:'02100009009',enterpriseId,usage:'仅呼出',aliyunUsage:'Outbound',status:'正常',businessStatus:'正常',authorizedTenantIds:[tenantId],referenceCount:1,alictiNumber:{id:983909,hotline:'02100009009',displayNumber:'02100009009',numberType:2,status:1,isIbRight:0,isInUse:1,isPredictiveLeft:1,isPredictiveRight:0,isPreviewRight:0,isIntl:0,isSipLeft:0,isWebCallLeft:0,isWebCallRight:0},simulation:true});
  }
  function prepare(){
    const c=AppState.get();if(!d.demoSwitchEnabled||c.tenantId!==tenantId||c.activeDomain!=='CLOUD_CONTACT_CENTER'||!['ADMIN','SUPER_ADMIN'].includes(AppState.effectiveAccess().roleCode))return false;
    try{
      const batches=JSON.parse(localStorage.getItem(batchKey)||'[]');if(!Array.isArray(batches))throw Error('数据异常');
      const id='DEMO-CUSTOMER-BATCH';if(!batches.some(b=>b.id===id)){
        const createdAt=new Date().toLocaleString('sv-SE');
        const rows=Array.from({length:8},(_,i)=>({id:'DEMO-CUSTOMER-ROW-'+(i+1),name:'流程演示客户'+(i+1),phone:'138000001'+String(i+1).padStart(2,'0'),note:['试驾邀约，请确认到店时间','购车需求回访','置换咨询','保养预约','前次未接通，请再次联系','已确认周末到店','活动邀请','售后关怀'][i],method:i<2?'':'人工外呼',ownerId:i<2?'':ownerId,followup:i===4?'待继续跟进':i===5?'已完成':'待联系',calls:[],history:[]}));
        [4,5].forEach(i=>rows[i].calls.push({callId:'DEMO-HISTORY-'+i,result:i===4?'未接通':'接通',at:createdAt,agentName:'王静（演示坐席）',disposition:i===4?'需要再次联系':'已完成沟通',remark:i===4?'模拟历史：约定再次联系':'模拟历史：确认周末到店'}));
        batches.unshift({id,name:'完整流程演示 · 客户邀约',tenantId,enterpriseId,createdAt,createdBy:c.accountId,errors:[],rows,simulation:true});
      }
      localStorage.setItem(batchKey,JSON.stringify(batches));localStorage.setItem(storageKey,'ready');resources();CustomerTasks.open(id);showToast('演示已准备：2位待分配客户，运营王静已有可联系客户','success');return true;
    }catch(_){showToast('演示数据保存失败，请检查浏览器存储','error');return false;}
  }
  window.CustomerDemo={prepare};
  try{if(localStorage.getItem(storageKey)==='ready')resources();}catch(_){}
})();
