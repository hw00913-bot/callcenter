/* AliCti field contracts, reviewed 2026-09-12. Pure mapping; never sends requests. */
(function(root){
  'use strict';
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
  const text=v=>v==null?'':String(v).trim();
  function integer(v){return v!==null&&v!==undefined&&v!==''&&typeof v!=='boolean'&&/^\d+$/.test(String(v))&&Number.isSafeInteger(Number(v))?Number(v):null;}
  function code(v){return v!==null&&v!==undefined&&v!==''&&typeof v!=='boolean'&&/^-?\d+$/.test(String(v))?Number(v):null;}
  function enumLabel(map,v){return own(map,v)?map[v]:'待确认';}
  const taskStatus=Object.freeze({0:'初始',1:'运行中',2:'暂停',3:'结束'});
  const callStrategies=Object.freeze({'1':'随机分配','2':'按顺序分配','3':'距离上次通话结束最久','4':'当前空闲时间最长'});
  // task/create uses String; TaskProperty may return Int. Missing values must be selected explicitly.
  function callStrategyValue(value){return ['string','number'].includes(typeof value)&&own(callStrategies,value)?String(value):'';}
  function callStrategyLabel(value){return callStrategies[callStrategyValue(value)]||'请重新选择分配方式';}
  const numberTypes=Object.freeze({1:'热线号码',2:'固话号码',3:'SIP手机号',4:'虚拟手机号'});
  const flag=v=>[0,1].includes(code(v))?code(v)===1:null;
  const hasTime=v=>integer(v)!==null&&integer(v)>0;
  // Existing supplier identities are opaque digit strings; creation length limits do not apply.
  function validExistingCno(value){return typeof value==='string'&&/^\d+$/.test(value)&&/[1-9]/.test(value);}
  // Official AliCti gno: length 2-20, starts with a letter, contains both letters and digits only.
  function validGno(value){return typeof value==='string'&&/^(?=.*[0-9])[a-zA-Z][a-zA-Z0-9]{1,19}$/.test(value.trim());}
  // Local format check only: the source requires an area code but specifies no exact length.
  function validAreaCode(value){return typeof value==='string'&&/^\d+$/.test(value.trim());}
  function authFields(enterpriseId,now=Date.now()){
    const id=integer(enterpriseId);
    return {fields:{validateType:2,enterpriseId:id,timestamp:Math.floor(now/1000),sign:'00000000000000000000000000000000'},pending:id>0?[]:['供应商账号ID待确认'],mock:true,signMode:'MD5格式占位，仅演示；未进行真实签名'};
  }
  // D-014: supplier corrected cno to String. Never remove leading zeroes.
  function authenticateFields(agent,now){const auth=authFields(agent.enterpriseId,now),cno=text(agent.cno);return {...auth,endpoint:'agentLogin/authenticateJsonp',fields:{...auth.fields,cno},pending:auth.pending.concat(typeof agent.cno==='string'&&/^\d+$/.test(cno)&&/[1-9]/.test(cno)?[]:['坐席工号须为非全零的数字文本'])};}
  function seatFields(agent){
    return {cno:text(agent.cno),name:text(agent.userName??agent.name),areaCode:text(agent.areaCode),active:agent.lifecycleStatus==='已停用'?0:1,isOb:agent.callEnabled===false?0:1,isAsr:code(agent.isAsr)??0,isQualityCheck:code(agent.isQualityCheck)??1,power:root.TenantSupervisorPolicy?.powerFor(agent)??0};
  }
  function previewFields(agent,tel,caller,source={},requestUniqueId){
    const variables=[];
    if(source.customerTaskItemId)variables.push({name:'batchCustomerId',value:String(source.customerTaskItemId),type:'1'});
    return {tel:text(tel),obClid:text(caller),requestUniqueId,callVariables:variables,...([0,1].includes(code(source.cdrIsAsr))?{cdrIsAsr:code(source.cdrIsAsr)}:{})};
  }
  function loginFields(agent,credentials={}){
    return {sessionKey:credentials.sessionKey||null,enterpriseId:integer(credentials.enterpriseId),cno:text(agent.cno),webSocketUrl:credentials.agentGateWayUrl||null,bindTel:credentials.bindTel||null,bindType:3,loginStatus:1,workingMode:'0'};
  }
  // API-311 customer-side caller settings. Pure helpers also work in isolated contract fixtures.
  const callerKeys=['callerMode','callerNumberId','customerClidsGroup','callerNavigationName','clidPoolList','customerTimeout'];
  function callerNavigationOptions(instance={}){
    const group=instance&&typeof instance==='object'&&!Array.isArray(instance)&&typeof instance.customerClidsGroup==='string'?instance.customerClidsGroup.trim():'';
    return group?[{name:'默认外显导航',customerClidsGroup:group}]:[];
  }
  function callerInteger(value){
    if(!['number','string'].includes(typeof value)||typeof value==='string'&&!/^-?\d+$/.test(value.trim()))return null;
    const number=Number(value);return Number.isSafeInteger(number)?number:null;
  }
  function taskCallerNormalize(values={}){
    const v=values&&typeof values==='object'&&!Array.isArray(values)?values:{};
    const mode=own(v,'callerMode')?v.callerMode:'fixed';
    const timeout=own(v,'customerTimeout')?v.customerTimeout:30;
    const result={callerMode:mode,callerNumberId:typeof v.callerNumberId==='string'?v.callerNumberId.trim():v.callerNumberId??'',customerClidsGroup:'',callerNavigationName:'',clidPoolList:[],customerTimeout:callerInteger(timeout)??timeout};
    if(mode==='navigation'){
      result.callerNumberId='';
      result.customerClidsGroup=typeof v.customerClidsGroup==='string'?v.customerClidsGroup.trim():v.customerClidsGroup;
      result.callerNavigationName=typeof v.callerNavigationName==='string'?v.callerNavigationName.trim():'';
      const pools=own(v,'clidPoolList')?v.clidPoolList:[];
      result.clidPoolList=Array.isArray(pools)?pools.map(pool=>{
        if(!pool||typeof pool!=='object'||Array.isArray(pool))return pool;
        const row={name:typeof pool.name==='string'?pool.name.trim():pool.name};
        if(own(pool,'poolId')&&pool.poolId!==undefined&&pool.poolId!==null&&pool.poolId!=='')row.poolId=String(pool.poolId).trim();
        if(own(pool,'priority')&&pool.priority!==undefined&&pool.priority!=='')row.priority=callerInteger(pool.priority)??pool.priority;
        return row;
      }):pools;
    }
    return result;
  }
  function taskCallerFields(values={},options={}){
    const value=taskCallerNormalize(values),errors=[];
    const issue=(message,target)=>errors.push({message,target});
    const checkPools=own(options,'availablePools');
    const availablePools=checkPools&&Array.isArray(options.availablePools)?options.availablePools:[];
    if(options.requireNavigation&&value.callerMode!=='navigation')issue('任务使用当前账号的默认外显导航','wizardCallerNavigation');
    else if(!['fixed','navigation'].includes(value.callerMode))issue('请选择有效的外显方式','wizardCallerMode');
    if(value.callerMode==='fixed'&&options.requireCallerNumber!==false&&(typeof value.callerNumberId!=='string'||!value.callerNumberId))issue('请选择客户看到的来电号码','wizard-callerNumberId');
    if(value.callerMode==='navigation'){
      if(typeof value.customerClidsGroup!=='string'||!value.customerClidsGroup)issue('当前账号未配置默认外显导航标识，请联系平台管理员','wizardCallerNavigation');
      if(!Array.isArray(value.clidPoolList))issue('号码池列表格式无效，请重新填写','wizardCallerPools');
      else {
        const names=new Set();
        value.clidPoolList.forEach((pool,index)=>{
          if(!pool||typeof pool!=='object'||Array.isArray(pool)||typeof pool.name!=='string'||!pool.name){issue('请填写第 '+(index+1)+' 个号码池的名称','wizardCallerPools');return;}
          if(names.has(pool.name))issue('同一任务的号码池名称不能重复','wizardCallerPools');
          names.add(pool.name);
          if(own(pool,'priority')&&callerInteger(pool.priority)===null)issue('号码池优先级须为整数，或留空','wizardCallerPools');
          if(checkPools){
            const matches=availablePools.filter(row=>row&&typeof row==='object'&&!Array.isArray(row)&&
              typeof row.name==='string'&&row.name===pool.name&&
              (!pool.poolId||String(row.id)===pool.poolId)&&
              (!own(options,'tenantId')||String(row.tenantId)===String(options.tenantId))&&
              (!own(options,'enterpriseId')||String(row.enterpriseId)===String(options.enterpriseId)));
            if(matches.length!==1)issue('第 '+(index+1)+' 个号码池已失效或不属于当前租户，请重新选择','wizardCallerPools');
          }
        });
      }
    }
    const timeout=callerInteger(value.customerTimeout);
    if(timeout===null||timeout<5||timeout>60)issue('客户接听等待时间须为 5–60 秒的整数','wizardCustomerTimeout');
    const fields={};
    if(!errors.length){
      fields.customerTimeout=timeout;
      if(value.callerMode==='navigation'){
        fields.customerClidsCategory=5;fields.customerClidsGroup=value.customerClidsGroup;
        if(value.clidPoolList.length)fields.clidPoolList=value.clidPoolList.map(pool=>({name:pool.name,...(own(pool,'priority')?{priority:pool.priority}:{})}));
      }
    }
    return {ok:!errors.length,message:errors[0]?.message||'',target:errors[0]?.target||'',errors,value,fields};
  }
  function taskCallerSettings(task={}){
    const values={};
    // Saved task data only: changing the account directory must not rewrite an existing task.
    const fields=task.alictiCreateDraft?.fields;
    const request=fields?{...fields,...(fields.customerClidsCategory===5?{callerMode:'navigation'}:{})}:null;
    for(const source of [task.executionConfig,request,task,task.planSnapshot]){
      if(!source||typeof source!=='object')continue;
      for(const key of callerKeys)if(own(source,key))values[key]=source[key];
    }
    return taskCallerNormalize(values);
  }
  function taskCallerFromAccount(instance={},values={}){
    const input=values&&typeof values==='object'&&!Array.isArray(values)?values:{};
    const group=callerNavigationOptions(instance)[0]?.customerClidsGroup||'';
    return taskCallerNormalize({...input,callerMode:'navigation',callerNumberId:'',customerClidsGroup:group,callerNavigationName:''});
  }
  function taskAccount(data,enterpriseId){
    return Array.isArray(data?.instances)?data.instances.find(row=>row?.enterpriseId===enterpriseId)||{}:{};
  }
  // Task time conditions are supplier resource references, never local timers.
  function taskTimeFields(values={},tenantId){
    const input={autoTaskType:own(values,'autoTaskType')?values.autoTaskType:0,allowedTimeIds:own(values,'allowedTimeIds')?values.allowedTimeIds:[],forbiddenTimeIds:own(values,'forbiddenTimeIds')?values.forbiddenTimeIds:[]};
    if(!Array.isArray(input.allowedTimeIds)||!Array.isArray(input.forbiddenTimeIds))return {ok:false,fields:{},message:'时间条件格式无效，请重新选择',target:'wizardTimeConditions'};
    const configured=input.autoTaskType!==0&&input.autoTaskType!=='0'||!Array.isArray(input.allowedTimeIds)||!Array.isArray(input.forbiddenTimeIds)||input.allowedTimeIds.length>0||input.forbiddenTimeIds.length>0;
    const checked=root.AliCtiTimeConditions?.validateTask ? root.AliCtiTimeConditions.validateTask(input,tenantId) : root.AliCtiTimeConditions||configured?{ok:false,message:'时间条件尚未就绪，请刷新后重新选择'}:{ok:true,fields:{autoTaskType:0},snapshot:[]};
    if(!checked.ok)return {...checked,fields:{},target:'wizardTimeConditions'};
    const fields={...checked.fields,autoStart:0,autoStop:0};
    if(own(values,'scheduleMode')&&!['定时执行','保存后手工启动'].includes(values.scheduleMode))return {ok:false,fields:{},message:'请选择开始呼叫的方式',target:'wizardScheduleAt'};
    if(values.scheduleMode==='定时执行'){
      const start=scheduleFields(values.scheduleAt);
      if(start.error)return {ok:false,fields:{},message:start.error,target:'wizardScheduleAt'};
      Object.assign(fields,start.fields);
    }
    if(own(values,'stopScheduled')&&typeof values.stopScheduled!=='boolean')return {ok:false,fields:{},message:'请重新选择是否设置结束时间',target:'wizardStopAt'};
    if(values.stopScheduled){
      const stop=scheduleFields(values.stopAt);
      if(stop.error)return {ok:false,fields:{},message:'请选择有效的计划结束时间',target:'wizardStopAt'};
      if(values.scheduleMode==='定时执行'&&new Date(values.stopAt).getTime()<=new Date(values.scheduleAt).getTime())return {ok:false,fields:{},message:'计划结束时间须晚于计划开始时间',target:'wizardStopAt'};
      Object.assign(fields,{autoStop:1,autoStopDay:stop.fields.autoStartDay,autoStopTime:stop.fields.autoStartTime});
    }
    return {...checked,ok:true,fields};
  }
  // API-311 task/create settings. Empty optional inputs use supplier defaults;
  // invalid supplied values are omitted and reported before submission.
  function taskSettings(values={},type){
    const v=values&&typeof values==='object'&&!Array.isArray(values)?values:{};
    const predictive=type==='预外呼',automatic=type==='IVR 外呼'||type==='自动外呼';
    const fields={},issues=[];
    const empty=value=>value==null||typeof value==='string'&&value.trim()==='';
    const issue=(message,target)=>issues.push({message,target});
    const whole=value=>{
      if(typeof value==='number')return Number.isSafeInteger(value)?value:null;
      if(typeof value!=='string'||!/^(0|[1-9]\d*)$/.test(value.trim()))return null;
      const parsed=Number(value.trim());return Number.isSafeInteger(parsed)?parsed:null;
    };
    const integerField=(key,min,max,target,label)=>{
      if(empty(v[key]))return;
      const parsed=whole(v[key]);
      if(parsed===null||parsed<min||max!==null&&parsed>max){issue(`${label}须为${max===null?`不小于 ${min}`:`${min}–${max}`} 的整数`,target);return;}
      fields[key]=parsed;
    };
    if(!predictive&&!automatic)issue('请选择有效的任务类型','wizardTaskType');
    if(!empty(v.description)){
      if(typeof v.description!=='string'||Array.from(v.description.trim()).length>=200)issue('任务描述须少于 200 字','wizardDescription');
      else fields.description=v.description.trim();
    }
    if(!empty(v.businessTagNames)){
      if(typeof v.businessTagNames!=='string'||/[，；;\r\n]/.test(v.businessTagNames)||v.businessTagNames.split(',').some(tag=>!tag.trim()))issue('业务标签请用英文逗号分隔，且每项不能为空','wizardBusinessTags');
      else fields.businessTagNames=v.businessTagNames.split(',').map(tag=>tag.trim()).join(',');
    }
    const completion=empty(v.autoComplete)?predictive?0:1:whole(v.autoComplete);
    if(completion!==0&&completion!==1)issue('名单呼完后的处理须选择暂停或自动完成','wizardAutoComplete');
    else fields.autoComplete=completion;
    if(v.stopScheduled===true)integerField('forceEndFlag',0,1,'wizardForceEndFlag','定时结束时的强制结束设置');
    integerField('retryStrategyOnlyToday',0,3,'wizardRetryToday','仅当天生效方式');
    if(!empty(v.callPriority)){
      const p=v.callPriority;
      if(!p||typeof p!=='object'||Array.isArray(p))issue('呼叫顺序格式无效','wizardRetryPriority');
      else {
        if(typeof p.retryFirst!=='boolean')issue('请选择重呼号码或未呼叫号码的优先顺序','wizardRetryPriority');
        if(![0,1].includes(whole(p.retryDesc)))issue('请选择重呼轮次顺序','wizardRetryOrder');
        if(![0,1,2].includes(whole(p.firstCallOrderType)))issue('请选择未呼叫号码顺序','wizardFirstCallOrder');
        if(!issues.some(item=>['wizardRetryPriority','wizardRetryOrder','wizardFirstCallOrder'].includes(item.target))){
          const retry={sort:p.retryFirst?1:2,type:'retryCall',desc:whole(p.retryDesc)};
          const first={sort:p.retryFirst?2:1,type:'firstCall',orderType:whole(p.firstCallOrderType)};
          fields.callPriorityStrategy=JSON.stringify({strategy:p.retryFirst?[retry,first]:[first,retry]});
        }
      }
    }
    if(!empty(v.concurrency)){
      const limit=whole(v.concurrency);
      if(limit===null||limit<0||limit===0&&!predictive)issue('最大并发须为正整数；仅预外呼可填 0 表示不限制','wizardConcurrency');
      else fields.concurrency=limit;
    }
    if(predictive){
      integerField('callRouteStrategy',1,2,'wizardCallRouteStrategy','座席呼转模式');
      integerField('agentTimeout',5,60,'wizardAgentTimeout','座席超时时间');
      integerField('wrapup',1,10800,'wizardWrapup','座席整理时间');
      integerField('maxWaitTime',10,600,'wizardMaxWaitTime','座席最大空闲等待时间');
      if(!empty(v.quotiety)){
        const raw=typeof v.quotiety==='number'&&Number.isFinite(v.quotiety)?String(v.quotiety):typeof v.quotiety==='string'?v.quotiety.trim():'';
        const value=Number(raw);
        if(!/^\d+(?:\.\d{1,2})?$/.test(raw)||!(value>0&&value<=20))issue('骚扰率系数须大于 0、不超过 20，最多两位小数','wizardQuotiety');
        else fields.quotiety=value;
      }
      integerField('predictAdjust',50,400,'wizardPredictAdjust','呼叫频度');
      integerField('answerRate',1,100,'wizardAnswerRate','初始预计客户接通率');
      integerField('warmUpDuration',60,600,'wizardWarmUpDuration','任务预热时间');
      integerField('isRewarm',0,1,'wizardIsRewarm','暂停后重新预热设置');
    }
    const errors=issues.map(item=>item.message);
    return {ok:issues.length===0,fields,errors,pending:errors,issues,message:issues[0]?.message||'',target:issues[0]?.target||''};
  }
  function taskFields(draft,data,options={}){
    const v=draft.values||{},predictive=draft.type==='预外呼',pending=[],errors=[],issues=[];
    const fields={name:text(v.name),type:predictive?1:2,autoStart:0,autoDelete:0};
    if(!predictive){
      const selected=root.AliCtiIvr?.resolve(v,draft,data);
      if(selected?.ok)fields.ivrId=selected.ivrId;
      else {const message=selected?.message||'自动外呼须先获取并选择当前组织可用的语音流程';pending.push(message);errors.push(message);}
    }else{
      const flow=(data.contactFlows||[]).find(f=>f.contactFlowId===v.contactFlowId&&f.enterpriseId===draft.enterpriseId);
      if(flow){
        if(integer(flow.providerIvrId)>0)fields.ivrId=integer(flow.providerIvrId);
        else if(flow.providerIvrName)fields.ivrName=text(flow.providerIvrName);
        else {const selected=root.AliCtiIvr?.resolve(v,draft,data,'predictive');if(selected?.ok)fields.ivrId=selected.ivrId;else {pending.push('语音流程尚未映射供应商ivrId或ivrName');errors.push('请重新核对坐席忙时使用的语音流程');}}
      }else if(v.contactFlowId||Number(v.callRouteStrategy)===2){
        const selected=root.AliCtiIvr?.resolve(v,draft,data,'predictive');
        if(selected?.ok)fields.ivrId=selected.ivrId;
      }
    }
    if(predictive){
      const isOutboundGroup = Number(v.callGroupType) === 2 || (!v.skillGroupId && !!v.outboundGroupId);
      const strategy=callStrategyValue(v.callStrategy);
      if(strategy)fields.callStrategy=strategy;else {const message='请选择有效的坐席分配方式';pending.push(message);errors.push(message);}
      if(isOutboundGroup){
        fields.callGroupType=2;
        const groupRes=root.OutboundGroups?.resolve ? root.OutboundGroups.resolve(v,draft) : null;
        if(groupRes?.ok){
          fields.agentGroup=groupRes.group.gno||groupRes.group.demoAgentGroup;
        }else{
          const message=groupRes?.message||'请选择有效的外呼组';
          pending.push(message);
          errors.push(message);
        }
      }else{
        fields.callGroupType=1;
        let cnoList = [];
        if (v.cnos) {
          cnoList = (Array.isArray(v.cnos) ? v.cnos : String(v.cnos).split(',')).map(text).filter(Boolean);
        } else if (Array.isArray(v.agentIdentityIds) && v.agentIdentityIds.length) {
          const idSet = new Set(v.agentIdentityIds);
          cnoList = (data.agents||[]).filter(a=>idSet.has(a.contactCenterIdentityId)&&a.tenantId===draft.tenantId&&a.enterpriseId===draft.enterpriseId).map(a=>a.cno);
        } else if (v.skillGroupId) {
          const group=(data.physicalSkillGroups||[]).find(g=>g.skillGroupId===v.skillGroupId&&g.tenantId===draft.tenantId&&g.enterpriseId===draft.enterpriseId);
          const ids=new Set((data.agentSkills||[]).filter(r=>r.physicalGroupId===group?.physicalGroupId&&r.status==='已生效'&&validSkillLevel(r.skillLevel)).map(r=>r.identityId));
          const eligible=(data.agents||[]).filter(a=>ids.has(a.contactCenterIdentityId)&&a.tenantId===draft.tenantId&&a.enterpriseId===draft.enterpriseId&&a.lifecycleStatus==='已启用'&&a.acceptNewTasks!==false);
          cnoList = eligible.map(a=>a.cno);
        }
        const validList = [...new Set(cnoList.filter(validExistingCno))];
        fields.cnos = validList.join(',');
        if (cnoList.some(c=>!validExistingCno(c))) {
          const message = '所选坐席存在无效工号，请核对坐席资料';
          pending.push(message); errors.push(message);
        }
        if (!fields.cnos) {
          const message = '请选择参与本次外呼的坐席工号';
          pending.push(message); errors.push(message);
        }
      }
      const count=integer(v.minAvailableAgentCount??10);
      if(count>=1&&count<=10)fields.minAvailableAgentCount=count;else pending.push('minAvailableAgentCount须为1–10');
    }
    const retryError=root.AliCtiRetry.validate(v.retryPolicy,draft.type);
    const retryIssue=root.AliCtiRetryEditor?.issue(v.retryPolicy,draft.type,v.retryEditor)||(retryError?{message:retryError}:null);
    const retry=root.AliCtiRetry.map(v.retryPolicy,draft.type);
    if(retryIssue){errors.push(retryIssue.message);pending.push(retryIssue.message);}else Object.assign(fields,retry.fields);
    pending.push(...retry.pending);
    const time=taskTimeFields(v,draft.tenantId);
    if(time.ok)Object.assign(fields,time.fields);else {pending.push(time.message);errors.push(time.message);}
    const caller=taskCallerFields(taskCallerFromAccount(taskAccount(data,draft.enterpriseId),v),{...options,tenantId:draft.tenantId,enterpriseId:draft.enterpriseId,requireCallerNumber:false,requireNavigation:true});
    if(caller.ok)Object.assign(fields,caller.fields);else for(const issue of caller.errors){pending.push(issue.message);errors.push(issue.message);}
    const settings=taskSettings(v,draft.type);
    Object.assign(fields,settings.fields);
    errors.push(...settings.errors);pending.push(...settings.pending);issues.push(...settings.issues);
    if(fields.callRouteStrategy===2&&!(integer(fields.ivrId)>0||typeof fields.ivrName==='string'&&fields.ivrName.trim())){
      const issue={message:'AI 转人工须选择有效的语音导航',target:'wizard-contactFlowId'};
      errors.push(issue.message);pending.push(issue.message);issues.push(issue);
    }
    if(!time.ok)issues.push({message:time.message,target:time.target||'wizardTimeConditions'});
    if(!caller.ok)issues.push(...caller.errors);
    return {endpoint:'task/create',fields,pending,errors,issues,target:issues[0]?.target||'',timeConditionSnapshot:time.ok?time.snapshot||[]:[],timeConditionRevision:time.revision,timeConditionContext:time.context,prerequisites:retry.prerequisites||[],mock:true};
  }
  // API task/update: only submit changed, documented settings from this task.
  // The supplier has not documented how omitted update fields are interpreted;
  // the caller must confirm the resulting TaskProperty with task/get.
  const taskUpdateKeys=Object.freeze([
    'name','description','businessTagNames','autoStart','autoStartDay','autoStartTime','autoStop','autoStopDay','autoStopTime',
    'forceEndFlag','autoTaskType','autoTriggerTimeStrategy','autoComplete','retryStrategy','retryStrategyTimeType',
    'retryStrategyOnlyToday','callPriorityStrategy','customerClidsCategory','customerClidsGroup','clidPoolList',
    'customerTimeout','concurrency','timeStrategy','callRouteStrategy','ivrId','ivrName','cnos','agentGroup',
    'callStrategy','agentTimeout','wrapup','maxWaitTime','minAvailableAgentCount','quotiety','predictAdjust',
    'answerRate','warmUpDuration','isRewarm'
  ]);
  function taskUpdateFields(draft,row,data={},options={}){
    const d=draft&&typeof draft==='object'?draft:{},task=row&&typeof row==='object'?row:{},v=d.values&&typeof d.values==='object'?d.values:{};
    const prior=task.alictiUpdateDraft?.fields||task.alictiCreateDraft?.fields||{};
    const type=d.type==='预外呼'?'预外呼':['IVR 外呼','自动外呼'].includes(d.type)?'IVR 外呼':'';
    const originalRawType=task.callType??task.type??prior.type;
    const originalType=originalRawType==='预外呼'||code(originalRawType)===1?'预外呼':originalRawType==='IVR 外呼'||originalRawType==='自动外呼'||code(originalRawType)===2?'IVR 外呼':'';
    const predictive=type==='预外呼',issues=[],errors=[],pending=[];
    const issue=(message,target='')=>{issues.push({message,target});errors.push(message);pending.push(message);};
    const explicit=d.editChangedKeys&&typeof d.editChangedKeys[Symbol.iterator]==='function'?new Set(d.editChangedKeys):null;
    const original=d.editOriginalValues&&typeof d.editOriginalValues==='object'?d.editOriginalValues:null;
    const changed=key=>explicit?explicit.has(key):original?JSON.stringify(v[key])!==JSON.stringify(original[key]):false;
    const changedAny=keys=>keys.some(changed);
    const callerChanged=changedAny(['callerMode','customerClidsGroup','clidPoolList']);
    const callerGuard=own(options,'availablePools')&&v.callerMode==='navigation'
      ?taskCallerFields(taskCallerFromAccount(taskAccount(data,d.enterpriseId),v),{...options,tenantId:d.tenantId,enterpriseId:d.enterpriseId,requireCallerNumber:false,requireNavigation:true})
      :null;
    if(!callerChanged&&callerGuard&&!callerGuard.ok)for(const item of callerGuard.errors)issue(item.message,item.target);
    const source=integer(task.providerTaskId)>0?task.providerTaskId:task.simulation===true&&task.localPrototypeTask===true&&integer(task.demoProviderTaskId)>0?task.demoProviderTaskId:root.AliCtiDemo?.taskControlSeed?.(task)?.id??null;
    const supplierId=typeof source==='string'||typeof source==='number'?String(source).trim():'';
    const auth=authFields(d.enterpriseId);
    const fields={...auth.fields,taskId:/^\d+$/.test(supplierId)&&/[1-9]/.test(supplierId)?supplierId:null};
    if(!fields.taskId)issue('供应商 taskId 待确认，不能传平台任务编号');
    if(auth.pending.length)issue(auth.pending[0]);
    if(!(integer(task.enterpriseId)>0)||String(task.enterpriseId)!==String(d.enterpriseId))issue('任务所属 AliCti 账号与当前账号不一致');
    if(task.tenantId&&d.tenantId&&task.tenantId!==d.tenantId)issue('任务所属租户与当前租户不一致');
    if(!type||!originalType||type!==originalType)issue('任务类型创建后不可修改或原类型待核对','wizardTaskType');
    if(!explicit&&!original)issue('缺少原任务设置快照，不能判断本次编辑了哪些字段');

    if(changed('name')){
      const name=text(v.name);
      if(!name||Array.from(name).length>=50)issue('任务名称须填写且少于 50 字','wizardName');
      else fields.name=name;
    }
    const settingKeys=['description','businessTagNames','autoComplete','retryStrategyOnlyToday','callPriority','concurrency',
      'callRouteStrategy','agentTimeout','wrapup','maxWaitTime','quotiety','predictAdjust','answerRate','warmUpDuration','isRewarm'];
    const settingInput={};
    for(const key of settingKeys)if(changed(key))settingInput[key]=v[key];
    if(changed('forceEndFlag')){settingInput.forceEndFlag=v.forceEndFlag;settingInput.stopScheduled=v.stopScheduled;}
    const settings=taskSettings(settingInput,type);
    for(const item of settings.issues)issue(item.message,item.target);
    for(const [key,value] of Object.entries(settings.fields))if(key!=='autoComplete'||changed('autoComplete'))fields[key]=value;
    if(changed('description'))fields.description=text(v.description);
    if(changed('businessTagNames'))fields.businessTagNames=text(v.businessTagNames);

    if(changedAny(['scheduleMode','scheduleAt'])){
      if(!['定时执行','保存后手工启动'].includes(v.scheduleMode))issue('请选择开始呼叫的方式','wizardScheduleAt');
      else if(v.scheduleMode==='保存后手工启动')fields.autoStart=0;
      else{
        const start=scheduleFields(v.scheduleAt);
        if(start.error)issue(start.error,'wizardScheduleAt');
        else Object.assign(fields,start.fields);
      }
    }
    if(changedAny(['stopScheduled','stopAt'])){
      if(typeof v.stopScheduled!=='boolean')issue('请重新选择是否设置结束时间','wizardStopAt');
      else if(!v.stopScheduled)fields.autoStop=0;
      else{
        const stop=scheduleFields(v.stopAt);
        if(stop.error)issue('请选择有效的计划结束时间','wizardStopAt');
        else{
          if(v.scheduleMode==='定时执行'&&new Date(v.stopAt).getTime()<=new Date(v.scheduleAt).getTime())issue('计划结束时间须晚于计划开始时间','wizardStopAt');
          Object.assign(fields,{autoStop:1,autoStopDay:stop.fields.autoStartDay,autoStopTime:stop.fields.autoStartTime});
          const endFlag=integer(v.forceEndFlag);
          if([0,1].includes(endFlag))fields.forceEndFlag=endFlag;
        }
      }
    }
    let timeSnapshot=[];
    if(changedAny(['autoTaskType','allowedTimeIds','forbiddenTimeIds'])){
      const requested={autoTaskType:v.autoTaskType,allowedTimeIds:v.allowedTimeIds,forbiddenTimeIds:v.forbiddenTimeIds};
      const configured=String(requested.autoTaskType)!=='0'||requested.allowedTimeIds?.length||requested.forbiddenTimeIds?.length;
      const checked=root.AliCtiTimeConditions?.validateTask?root.AliCtiTimeConditions.validateTask(requested,d.tenantId):configured?{ok:false,message:'时间条件尚未就绪，请刷新后重新选择'}:{ok:true,fields:{autoTaskType:0},snapshot:[]};
      if(!checked.ok)issue(checked.message||'时间条件格式无效，请重新选择','wizardTimeConditions');
      else{
        if(changedAny(['autoTaskType','allowedTimeIds'])){
          fields.autoTaskType=checked.fields.autoTaskType;
          if(Number(checked.fields.autoTaskType)===1)fields.autoTriggerTimeStrategy=checked.fields.autoTriggerTimeStrategy;
        }
        if(changed('forbiddenTimeIds'))fields.timeStrategy=checked.fields.timeStrategy??'';
        timeSnapshot=checked.snapshot||[];
      }
    }
    if(changed('customerTimeout')){
      const timeout=callerInteger(v.customerTimeout);
      if(timeout===null||timeout<5||timeout>60)issue('客户接听等待时间须为 5–60 秒的整数','wizardCustomerTimeout');
      else fields.customerTimeout=timeout;
    }
    if(callerChanged){
      const caller=callerGuard||taskCallerFields(taskCallerFromAccount(taskAccount(data,d.enterpriseId),v),{...options,tenantId:d.tenantId,enterpriseId:d.enterpriseId,requireCallerNumber:false,requireNavigation:true});
      if(!caller.ok)for(const item of caller.errors)issue(item.message,item.target);
      else{
        fields.customerClidsCategory=5;
        fields.customerClidsGroup=caller.value.customerClidsGroup;
        if(caller.value.clidPoolList.length||changed('clidPoolList'))fields.clidPoolList=caller.value.clidPoolList.map(pool=>({name:pool.name,...(own(pool,'priority')?{priority:pool.priority}:{})}));
      }
    }
    if(changed('callerNumberId'))issue('固定外显号码属于客户号码配置，不能通过更新任务修改','wizard-callerNumberId');
    if(changed('retryPolicy')){
      const retryError=root.AliCtiRetry.validate(v.retryPolicy,type);
      const retryIssue=root.AliCtiRetryEditor?.issue(v.retryPolicy,type,v.retryEditor)||(retryError?{message:retryError}:null);
      if(retryIssue)issue(retryIssue.message,'wizardRetryPolicy');
      else{
        const retry=root.AliCtiRetry.map(v.retryPolicy,type);
        Object.assign(fields,retry.fields);
        if(v.retryPolicy.mode==='unset')fields.retryStrategy='';
      }
    }
    if(changed('callGroupType')){
      const previous=code(prior.callGroupType??task.planSnapshot?.callGroupType??task.executionConfig?.callGroupType??task.callGroupType);
      if(previous!==code(v.callGroupType))issue('指定座席方式创建后不可修改','wizardCallGroupType');
    }
    if(changedAny(['sourceRef','isRepeat','total']))issue('客户名单与去重策略不属于任务更新接口','wizardSource');
    if(predictive){
      if(changed('callStrategy')){
        const strategy=callStrategyValue(v.callStrategy);
        if(!strategy)issue('请选择有效的坐席分配方式','wizardCallStrategy');else fields.callStrategy=strategy;
      }
      if(changed('minAvailableAgentCount')){
        const count=integer(v.minAvailableAgentCount);
        if(!(count>=1&&count<=10))issue('最小可用座席数须为 1–10','wizardMinAvailableAgentCount');
        else fields.minAvailableAgentCount=count;
      }
      if(changedAny(['cnos','agentIdentityIds','skillGroupId','agentGroup','outboundGroupId'])){
        const groupType=code(prior.callGroupType??task.planSnapshot?.callGroupType??task.executionConfig?.callGroupType??task.callGroupType);
        if(groupType===1){
          let cnos=Array.isArray(v.cnos)?v.cnos:typeof v.cnos==='string'?v.cnos.split(','):[];
          if(!cnos.length&&Array.isArray(v.agentIdentityIds)&&v.agentIdentityIds.length){
            const selected=new Set(v.agentIdentityIds);
            cnos=(data.agents||[]).filter(a=>selected.has(a.contactCenterIdentityId)&&a.tenantId===d.tenantId&&String(a.enterpriseId)===String(d.enterpriseId)).map(a=>a.cno);
          }
          cnos=cnos.map(text).filter(Boolean);
          if(!cnos.length||cnos.some(cno=>!validExistingCno(cno))||new Set(cnos).size!==cnos.length)issue('请选择有效且不重复的座席工号','wizardAgents');
          else if(!Array.isArray(data.agents)||cnos.some(cno=>!data.agents.some(a=>a.cno===cno&&a.tenantId===d.tenantId&&String(a.enterpriseId)===String(d.enterpriseId)&&a.lifecycleStatus==='已启用'&&a.acceptNewTasks!==false&&a.callEnabled!==false)))issue('所选坐席未在当前租户账号内核实为可外呼','wizardAgents');
          else fields.cnos=cnos.join(',');
        }else if(groupType===2){
          const found=root.OutboundGroups?.resolve?.(v,d);
          const group=found?.ok?text(found.group.gno||found.group.demoAgentGroup):'';
          if(!found?.ok)issue(found?.message||'请选择当前租户有效的外呼组','wizardOutboundGroup');
          else if(!validGno(group))issue('请选择有效的外呼组号','wizardOutboundGroup');
          else fields.agentGroup=group;
        }else issue('原任务指定座席方式未记录，不能安全更新坐席','wizardCallGroupType');
      }
      if(changedAny(['contactFlowId','providerIvrId'])){
        const selected=v.contactFlowId;
        const flow=(data.contactFlows||[]).find(item=>item.contactFlowId===selected&&String(item.enterpriseId)===String(d.enterpriseId));
        if(flow&&(integer(flow.providerIvrId)>0||text(flow.providerIvrName))){
          if(integer(flow.providerIvrId)>0)fields.ivrId=integer(flow.providerIvrId);
          else fields.ivrName=text(flow.providerIvrName);
        }else issue('所选语音流程尚未映射供应商导航','wizard-contactFlowId');
      }
      if(changed('callRouteStrategy')&&code(v.callRouteStrategy)===2&&!fields.ivrId&&!fields.ivrName&&!(integer(prior.ivrId)>0||text(prior.ivrName)))issue('AI 转人工须选择有效的语音导航','wizard-contactFlowId');
    }else{
      if(changedAny(['contactFlowId','providerIvrId']))
        issue('自动外呼语音流程修改尚未确认适用于 task/update','wizard-providerIvrId');
      if(changedAny(['cnos','agentGroup','callStrategy','callRouteStrategy','skillGroupId','agentIdentityIds','outboundGroupId',
        'minAvailableAgentCount','agentTimeout','wrapup','maxWaitTime','quotiety','predictAdjust','answerRate','warmUpDuration','isRewarm']))
        issue('坐席及预测拨号参数仅适用于预外呼任务','wizardTaskType');
    }
    const allowed=new Set(['validateType','enterpriseId','timestamp','sign','taskId',...taskUpdateKeys]);
    for(const key of Object.keys(fields))if(!allowed.has(key))delete fields[key];
    if(Object.keys(fields).every(key=>['validateType','enterpriseId','timestamp','sign','taskId'].includes(key))&&!issues.length)issue('请先修改任务设置');
    return {endpoint:'task/update',fields,authFields:auth.fields,pending:[...new Set(pending)],errors:[...new Set(errors)],issues,target:issues[0]?.target||'',changedKeys:explicit?[...explicit]:Object.keys(v).filter(changed),timeConditionSnapshot:timeSnapshot,prerequisites:[],mock:true,signMode:auth.signMode,verificationEndpoint:'task/get'};
  }
  function importFields(task,rows,batch){
    const taskId=integer(task.providerTaskId??(task.simulation?task.demoProviderTaskId:null)),pending=[];
    if(!(taskId>0))pending.push('供应商taskId待确认，不能传平台任务编号');
    if(![0,1,2,3].includes(code(batch.isRepeat)))pending.push('排重策略待确认，不能隐式使用任务内排重');
    rows.forEach((row,index)=>{if(row.clid&&!/^\+?\d+$/.test(text(row.clid)))pending.push('第 '+(index+1)+' 个客户的外显号码须为完整号码');});
    const fields={name:text(batch.name),taskId:taskId>0?taskId:null,importTelAutoStart:0,taskTelList:rows.map(r=>({tel:text(r.phone),...(r.clid?{clid:text(r.clid)}:{}),property:JSON.stringify({batchCustomerId:r.id,batchId:r.batchId})}))};
    if([0,1,2,3].includes(code(batch.isRepeat)))fields.isRepeat=code(batch.isRepeat);
    return {endpoint:'task/importTaskTel',sourceBatchId:text(batch.batchId),fields,pending,mock:true};
  }
  function validSkillLevel(value){const n=integer(value);return n>=1&&n<=10;}
  // D-017: pauseDuration is deliberately omitted, including legacy draft input.
  function pauseFields(){return {fields:{},pending:[]};}
  function seatQueryFields(start=0,limit=10){
    const s=integer(start),l=integer(limit),pending=[];
    if(s===null)pending.push('查询起点须为非负整数');
    if(!(l>=1&&l<=1000))pending.push('每页坐席数须为1–1000');
    return {endpoint:'agent/query',fields:{start:s,limit:l},pending,mock:true};
  }
  function seatQueryResult(response){
    const total=integer(response?.data?.total),items=response?.data?.agents;
    if(code(response?.result)!==0||total===null||!Array.isArray(items)||items.some(r=>!validExistingCno(r?.agent?.cno)))return {rows:[],total:null,pending:true,raw:response};
    return {rows:items.map(r=>({...r.agent,cno:text(r.agent.cno)})),total,pending:false,raw:response};
  }
  // D-051: `other` is the skill-binding-failed subset of successful main records.
  function seatBatchResult(response,requested,options={}){
    const unknown=()=>({createdCnos:[],notCreatedCnos:[],pending:true,raw:response});
    if(!Array.isArray(requested)||new Set(requested).size!==requested.length||requested.some(cno=>!validExistingCno(cno))||code(response?.result)!==0)return unknown();
    const d=response.data||{},success=integer(d.success),fail=integer(d.fail),other=integer(d.other);
    if(typeof d.cnos!=='string'||[success,fail,other].some(v=>v===null||v>requested.length))return unknown();
    const cnos=d.cnos.trim()?d.cnos.split(',').map(text):[];
    if(new Set(cnos).size!==cnos.length||cnos.some(c=>!requested.includes(c)))return unknown();
    if(cnos.length!==success||success+fail!==requested.length||other>success)return unknown();
    if(own(options,'skillIds')&&!text(options.skillIds)&&other!==0)return unknown();
    return {createdCnos:cnos,notCreatedCnos:requested.filter(c=>!cnos.includes(c)),pending:false,skillCheckRequired:other>0,counts:{success,fail,other},raw:response};
  }
  // DOC-331's official example returns data as an array, not data.agentSkills.
  function seatSkillQueryResult(response,requested,targetSkillIds,enterpriseId){
    const unknown=()=>({matchedCnos:[],missingSkills:[],pending:true,raw:response});
    const targets=(Array.isArray(targetSkillIds)?targetSkillIds:typeof targetSkillIds==='string'?targetSkillIds.split(','):[]).map(text);
    if(code(response?.result)!==0||!Array.isArray(response.data)||!Array.isArray(requested)||!requested.length||requested.some(cno=>!validExistingCno(cno))||new Set(requested).size!==requested.length||!targets.length||targets.some(id=>!(integer(id)>0))||new Set(targets).size!==targets.length)return unknown();
    const rows=response.data;
    if(rows.some(row=>!validExistingCno(row?.cno)||!requested.includes(row.cno)||!(integer(row.skillId)>0)||!validSkillLevel(row.skillLevel)||enterpriseId!=null&&String(row.enterpriseId)!==String(enterpriseId)))return unknown();
    const missingSkills=requested.map(cno=>({cno,skillIds:targets.filter(id=>!rows.some(row=>row.cno===cno&&String(row.skillId)===id))})).filter(row=>row.skillIds.length);
    return {matchedCnos:requested.filter(cno=>!missingSkills.some(row=>row.cno===cno)),missingSkills,pending:false,provesMainRecordCreated:false,raw:response};
  }
  function supplierDate(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(value))return NaN;
    return Date.parse(value.replace(' ','T'));
  }
  function seatBatchVerification(record,response){
    const requested=record?.cnos||[],fields=record?.request?.fields||{},start=supplierDate(record?.requestWindow?.startTime),end=supplierDate(record?.requestWindow?.endTime),parsed=seatQueryResult(response);
    const unknown=()=>({confirmedCnos:[],unresolvedCnos:[...requested],pending:true,raw:response});
    if(!(integer(fields.enterpriseId)>0)||!Array.isArray(requested)||!requested.length||requested.some(cno=>!validExistingCno(cno))||new Set(requested).size!==requested.length||parsed.pending||!Number.isFinite(start)||!Number.isFinite(end)||start>end||!record.precheck?.complete||!Array.isArray(record.precheck.rows))return unknown();
    if(parsed.total!==parsed.rows.length||new Set(parsed.rows.map(row=>row.cno)).size!==parsed.rows.length||parsed.rows.some(row=>!requested.includes(row.cno)||String(row.enterpriseId)!==String(fields.enterpriseId)))return unknown();
    const confirmedCnos=requested.filter(cno=>{
      const row=parsed.rows.find(item=>item.cno===cno),prior=record.precheck.rows.filter(item=>item.cno===cno),created=supplierDate(row?.createTime);
      return row&&integer(row.id)>0&&Number.isFinite(created)&&created>=start&&created<=end&&!prior.some(item=>!(integer(item.id)>0)||String(item.id)===String(row.id));
    });
    // Absence proves neither a failed write nor permission to repeat an unknown request.
    const unresolvedCnos=requested.filter(cno=>!confirmedCnos.includes(cno));
    return {confirmedCnos,unresolvedCnos,pending:unresolvedCnos.length>0,provesSkills:false,raw:response};
  }
  function seatBatchFields(input){
    const cno=text(input.cno),endCno=text(input.endCno),pending=[];
    if(!/^\d{3,10}$/.test(cno)||Number(cno)===0||!/^\d{3,10}$/.test(endCno)||Number(endCno)===0)pending.push('起止工号须为3–10位数字且非全零');
    if(cno.length!==endCno.length)pending.push('本次起止工号请使用相同位数');
    const count=Number(endCno)-Number(cno)+1;
    if(!Number.isSafeInteger(count)||count<1||count>100)pending.push('结束工号不能小于起始工号，一次最多100个坐席');
    if(!text(input.name))pending.push('请填写本批统一姓名');
    if(!validAreaCode(input.areaCode))pending.push('请填写有效的数字区号');
    const fields={cno,endCno,name:text(input.name),areaCode:text(input.areaCode),active:1,isOb:1,isAsr:0,isQualityCheck:1};
    return {endpoint:'agent/batchCreate',fields,pending,count:pending.length?0:count,cnos:pending.length?[]:Array.from({length:count},(_,i)=>String(Number(cno)+i).padStart(cno.length,'0')),mock:true};
  }
  function seatBatchOverlaps(record,enterpriseId,cnos){
    if(!record?.normalized?.pending||String(record.request?.fields?.enterpriseId)!==String(enterpriseId))return false;
    const fields=record.request.fields;
    const prior=Array.isArray(record.cnos)?record.cnos:seatBatchFields({...fields,name:fields.name||'历史批次',areaCode:fields.areaCode||'021'}).cnos;
    return cnos.some(cno=>prior.includes(cno));
  }
  const numberUseLabels=Object.freeze({isIbRight:'呼入转坐席时显示',isInUse:'预览外呼向客户显示',isPredictiveLeft:'预外呼向客户显示',isPredictiveRight:'预外呼向坐席显示',isPreviewRight:'预览外呼向坐席显示',isIntl:'国际呼叫显示',isSipLeft:'SIP呼叫向客户显示',isWebCallLeft:'双向呼叫第一侧显示',isWebCallRight:'双向呼叫第二侧显示'});
  function numberUpdateFields(numbers,changes){
    const list=Array.isArray(numbers)?numbers.map(text):[],pending=[],body={numberList:list};
    if(!list.length||list.length>1000||new Set(list).size!==list.length||list.some(n=>!/^\d{7,20}$/.test(n)))pending.push('请使用完整且不重复的号码，一次最多1000个；固定电话包含区号');
    for(const [key,value] of Object.entries(changes||{})){
      if(key!=='status'&&!own(numberUseLabels,key)){pending.push('不支持的号码修改字段：'+key);continue;}
      if(![0,1].includes(code(value))){pending.push('号码状态与外显用途只允许0或1');continue;}body[key]=code(value);
    }
    if(Object.keys(body).length===1)pending.push('请选择需要修改的号码属性');
    return {endpoint:'enterpriseHotline/batchUpdateNumber',method:'POST',body,pending,mock:true};
  }
  function skillUpdateFields(agent,relations,data,idFor){
    const pending=[],skillIds=[],levels=[],seen=new Set();
    if(!validExistingCno(agent.cno))pending.push('坐席工号须为非全零的数字文本');
    for(const relation of relations){
      const group=(data.physicalSkillGroups||[]).find(g=>g.physicalGroupId===relation.physicalGroupId);
      if(!group||relation.identityId!==agent.contactCenterIdentityId||group.tenantId!==agent.tenantId||group.enterpriseId!==agent.enterpriseId||seen.has(group.physicalGroupId)){pending.push('技能关联超出当前坐席范围或重复');continue;}
      seen.add(group.physicalGroupId);
      if(!validSkillLevel(relation.skillLevel)){pending.push('技能等级须为1–10的整数');continue;}
      const id=integer(group.providerSkillId??(idFor?idFor('skill',group):null));
      if(!(id>0)){pending.push('技能ID未配置');continue;}
      skillIds.push(id);levels.push(Number(relation.skillLevel));
    }
    const item={cno:text(agent.cno),skillIds:skillIds.length?skillIds.join(','):'0'};
    if(skillIds.length)item.skillLevels=levels.join(',');
    return {endpoint:'agent/batchUpdateAgentSkill',body:pending.length?[]:[item],pending,mock:true};
  }
  function skillUpdateResult(response,requested){
    const unknown=()=>({successCnos:[],failedCnos:[],pending:true,raw:response});
    if(code(response?.result)===-1)return {successCnos:[],failedCnos:[...requested],pending:false,raw:response};
    if(code(response?.result)!==0||!own(response.data,'failCno'))return unknown();
    const value=response.data.failCno;
    let items;
    if(typeof value==='string'){
      let s=value.trim();if(s.startsWith('[')&&s.endsWith(']'))s=s.slice(1,-1).trim();
      items=s?s.split(',').map(v=>v.trim().replace(/^['"]|['"]$/g,'')):[];
    }else return unknown();
    if(items.some(cno=>!validExistingCno(cno)||!requested.includes(cno)))return unknown();
    return {successCnos:requested.filter(cno=>!items.includes(cno)),failedCnos:[...new Set(items)],pending:false,raw:response};
  }
  function scheduleFields(value){
    const match=/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/.exec(text(value));
    const parsed=new Date(value),date=match?.[1].split('-').map(Number),time=match?.[2].split(':').map(Number);
    if(!match||!Number.isFinite(parsed.getTime())||parsed.getFullYear()!==date[0]||parsed.getMonth()+1!==date[1]||parsed.getDate()!==date[2]||parsed.getHours()!==time[0]||parsed.getMinutes()!==time[1]||parsed.getSeconds()!==Number(match[3]||0))return {fields:{},error:'请选择有效的计划开始时间'};
    return {fields:{autoStart:1,autoStartDay:match[1],autoStartTime:match[2]+':'+(match[3]||'00')},error:''};
  }
  function importResult(response={}){
    if(code(response.result)!==0)return {status:code(response.result)===-1?'导入失败':'待确认',raw:response};
    const d=response.data||{},total=integer(d.importTotal),success=integer(d.successTotal),invalid=integer(d.invalidTotal);
    if([total,success,invalid].some(v=>v===null)||success+invalid>total)return {status:'待确认',raw:response};
    return {status:'已返回统计',providerTaskId:integer(d.taskId),providerBatchId:integer(d.fileId),importTotal:total,successTotal:success,invalidTotal:invalid,unclassifiedTotal:total-success-invalid,raw:response};
  }
  function muteFields(direction){return ['in','out','all'].includes(direction)?{method:'CTILink.Session.mute',fields:{direction},mock:true}:{pending:['静音方向须为in/out/all'],fields:{},mock:true};}
  function recordingRequest(recordFile,options={}){
    const fields={recordFile:text(recordFile),recordFormat:code(options.recordFormat)??0,download:code(options.download)??0},pending=[];
    if(!fields.recordFile)pending.push('请指定录音文件名');
    if(![0,1].includes(fields.recordFormat)||![0,1].includes(fields.download))pending.push('录音格式或下载参数非法');
    if(fields.recordFormat===1&&options.recordSide!==''&&options.recordSide!=null){
      if(![1,2].includes(code(options.recordSide))||![1,2,4,5].includes(code(options.callType)))pending.push('分轨须选择客户侧/坐席侧及文档支持的呼叫类型');
      else {fields.recordSide=code(options.recordSide);fields.callType=code(options.callType);}
    }
    return {endpoint:'record/getUrl',fields:pending.length?{}:fields,pending,mock:true};
  }
  function cdrQuery(kind,startValue,endValue,offset=0,limit=10){
    const start=new Date(startValue),end=new Date(endValue),pending=[],requests=[];
    const endpoints={manual:'cc/list_cdr_ob',predictive:'cc/list_cdr_predictive_call',inbound:'cc/list_cdr_ib',automatic:'cc/list_cdr_auto_task'};
    if(!endpoints[kind])pending.push('请分别查询人工外呼、预测外呼、自动外呼或呼入话单');
    if(scheduleFields(startValue).error||scheduleFields(endValue).error||start>end)pending.push('请选择有效的开始与结束时间');
    if(integer(offset)===null||integer(limit)===null||Number(limit)<10||Number(limit)>1000||Number(offset)+Number(limit)>100000)pending.push('分页limit须为10–1000，且offset+limit≤100000');
    if(pending.length)return {requests,pending,mock:true};
    let cursor=start.getTime(),last=end.getTime();
    while(cursor<=last){
      const at=new Date(cursor),nextMonth=new Date(at.getFullYear(),at.getMonth()+1,1).getTime();
      const right=Math.min(last,nextMonth-1000);
      requests.push({endpoint:endpoints[kind],fields:{startTime:Math.floor(cursor/1000),startTimeEnd:Math.floor(right/1000),offset:Number(offset),limit:Number(limit)}});
      if(right===last)break;cursor=nextMonth;
    }
    return {requests,pending:[],mock:true};
  }
  function pushFields(input){
    const pending=[],fields={name:text(input.name),type:integer(input.type)};
    if(!fields.name||fields.type===null)pending.push('推送名称和推送类型必填');
    if(input.mode==='target'){
      if(!(integer(input.targetUrlId)>0))pending.push('目标接口ID须为正整数');else fields.targetUrlId=integer(input.targetUrlId);
    }else{
      try{const url=new URL(text(input.url));if(!['http:','https:'].includes(url.protocol)||!url.hostname)throw new Error();}catch(_){pending.push('请输入有效的http或https目标地址');}
      if(![0,1].includes(code(input.method))||![1,2].includes(code(input.contentType))||!(integer(input.timeout)>=1&&integer(input.timeout)<=10))pending.push('请求方式、内容类型或超时值不合法');
      Object.assign(fields,{url:text(input.url),method:code(input.method),contentType:code(input.contentType),timeout:integer(input.timeout)});
    }
    return {endpoint:'cc/create_push_action',fields:pending.length?{}:fields,pending,mock:true};
  }
  function pushState(raw){
    const type=code(raw?.type),status=code(raw?.status),batchStatus={0:'未导入号码',1:'导入',2:'缓存中',3:'结束',4:'已冻结'};
    const labels=type===1?taskStatus:type===2?batchStatus:{};
    return {type,status,kind:type===1?'任务':type===2?'批次':'待确认',label:enumLabel(labels,status),enterpriseId:integer(raw?.enterpriseId),taskId:integer(raw?.taskId),fileId:type===2?integer(raw?.fileId):null,raw};
  }
  function normalizeCdr(kind,raw={}){
    const s=code(raw.status),manual=kind==='manual',predictive=kind==='predictive',inbound=kind==='inbound',automatic=kind==='automatic';
    const customerAt=predictive||automatic?raw.upTime:manual?raw.bridgeTime:inbound?raw.answerTime:null;
    const agentAt=predictive||inbound?raw.bridgeTime:manual?raw.upTime:null;
    const accepted=manual?[1,2,3,4].includes(s):predictive?[40,41,42,43].includes(s):inbound?['人工接听','人工未接听','系统应答','系统未应答'].includes(raw.status):automatic?['客户接听','客户未接听'].includes(raw.status):false;
    let customerAnswered=null,agentAnswered=null;
    if(manual){customerAnswered=s===3?true:s===1?false:null;agentAnswered=s===4?true:s===2?false:null;}
    if(predictive){customerAnswered=[41,43].includes(s)?true:s===40?false:null;agentAnswered=s===43?true:s===42?false:null;}
    if(automatic){customerAnswered=raw.status==='客户接听'?true:raw.status==='客户未接听'?false:null;}
    if(inbound){customerAnswered=['人工接听','系统应答'].includes(raw.status)?true:raw.status==='系统未应答'?false:null;agentAnswered=raw.status==='人工接听'?true:raw.status==='人工未接听'?false:null;}
    const issues=[];
    // A positive timestamp is separate evidence; status-only records leave the other side unknown.
    if(hasTime(customerAt)){if(customerAnswered===false)issues.push('客户接听状态与时间冲突');customerAnswered=true;}
    if(hasTime(agentAt)){if(agentAnswered===false)issues.push('坐席接听状态与时间冲突');agentAnswered=true;}
    return {kind,rawStatus:raw.status,customerAnswered,agentAnswered,customerAnsweredAt:customerAt??null,agentAnsweredAt:agentAt??null,endedAt:raw.endTime??null,mainUniqueId:raw.mainUniqueId??null,requestUniqueId:raw.requestUniqueId??null,startTime:raw.startTime??null,customerBridgeDuration:raw.customerBridgeDuration??null,bridgeDuration:automatic?null:raw.bridgeDuration??null,firstJoinQueueTime:raw.firstJoinQueueTime??null,firstLeaveQueueTime:raw.firstLeaveQueueTime??null,firstQueueDuration:raw.firstQueueDuration??null,statusResult:raw.statusResult??null,status:accepted&&!issues.length?'已归一':'待确认',issues,raw};
  }
  function numberFields(raw={}){
    return {providerNumberId:integer(raw.id),number:text(raw.hotline),displayNumber:text(raw.displayNumber),numberType:enumLabel(numberTypes,raw.numberType),providerStatus:enumLabel({0:'停用',1:'启用'},raw.status),trunkGroupKey:text(raw.trunkGroupKey),labels:Array.isArray(raw.label)?raw.label:[],uses:Object.fromEntries(['isIbRight','isInUse','isPreviewRight','isPredictiveLeft','isPredictiveRight','isSipLeft','isWebCallLeft','isWebCallRight','isIntl'].map(k=>[k,flag(raw[k])])),createdAtMs:integer(raw.createTime),updatedAtMs:integer(raw.updateTime),raw};
  }
  function recordingFields(response={},options={}){
    const success=code(response.result)===0,url=success&&typeof response.data==='string'?response.data:'';
    // 120 minutes is the documented default, not a returned expiry or a guaranteed account setting.
    const expiresAt=Number.isFinite(options.expiresAt)?options.expiresAt:null;
    const expired=expiresAt!==null&&expiresAt<=(options.now??Date.now());
    return {url:expired?'':url,status:expired?'链接已过期':code(response.result)===-1?'获取失败':url?'可播放':code(response.result)===0?'未就绪':'录音状态待确认',expiresAt,expiryRule:'默认120分钟，可配置；实际有效期待确认',raw:response};
  }
  // D-015: query RASR only. The ASR get response is deliberately not accepted here.
  function rasrRequest(enterpriseId,uniqueId,now){
    const auth=authFields(enterpriseId,now),valid=typeof uniqueId==='string'&&uniqueId.trim().length>0;
    return {...auth,endpoint:'rasrEvent/query',method:'GET',fields:{...auth.fields,uniqueId:valid?uniqueId:''},pending:auth.pending.concat(valid?[]:['尚未取得本通话的供应商唯一标识'])};
  }
  function previewTranscriptionGate(input={}){
    const conditions={callKind:input.callKind,enterpriseAutoAsr:flag(input.enterpriseAutoAsr),filterBySeat:flag(input.filterBySeat),isAsr:code(input.isAsr),cdrIsAsr:input.cdrIsAsr==null||input.cdrIsAsr==='omit'?null:code(input.cdrIsAsr)};
    const base={conditions,guaranteesText:false,source:'D-015 供应商澄清：预览外呼转写规则'};
    if(conditions.callKind!=='preview'||conditions.enterpriseAutoAsr!==true||conditions.filterBySeat!==true)return {...base,eligible:null,label:'适用条件未满足',reason:'本规则仅适用于企业已开启自动转写且按坐席过滤的预览外呼；其他情形不据此推断。'};
    if(![0,1].includes(conditions.isAsr)||(input.cdrIsAsr!=null&&input.cdrIsAsr!=='omit'&&![0,1].includes(conditions.cdrIsAsr)))return {...base,eligible:null,label:'转写设置未完整提供',reason:'未取得有效转写开关，不推断本通是否允许转写。'};
    if(conditions.isAsr===0)return {...base,eligible:false,label:'不转写',reason:'坐席未开启转写，单次呼叫开启也不能覆盖。'};
    if(conditions.cdrIsAsr===0)return {...base,eligible:false,label:'不转写',reason:'本通呼叫已关闭转写。'};
    return {...base,eligible:true,label:'允许转写',reason:'仍需满足时长等服务规则，通话文本以实际查询返回为准。'};
  }
  function rasrFields(response,options={}){
    const result=code(response?.result),segments=[],issues=[];
    const base={endpoint:'rasrEvent/query',segments,issues,raw:response,timeUnit:'原值保留，不用于音频定位'};
    if(result===-1)return {...base,status:'文本获取失败'};
    if(result!==0)return {...base,status:'文本状态待核对'};
    if(!Array.isArray(response.data))return {...base,status:'文本数据待核对',issues:['data 应为数组']};
    const identity=(record,label)=>{
      if(options.enterpriseId!=null&&record.enterpriseId!=null&&String(record.enterpriseId)!==String(options.enterpriseId))issues.push(label+'供应商账号与查询上下文不一致');
      if(options.uniqueId&&record.uniqueId!=null&&(typeof record.uniqueId!=='string'||record.uniqueId!==options.uniqueId))issues.push(label+'通话唯一标识与查询上下文不一致');
    };
    identity(response,'返回');
    response.data.forEach((record,recordIndex)=>{
      if(!record||typeof record!=='object'||Array.isArray(record)){issues.push('第'+(recordIndex+1)+'条 RASR 记录结构无效');return;}
      identity(record,'第'+(recordIndex+1)+'条');
      const monitorSide=code(record.monitorSide);
      ['text','botText'].forEach(sourceField=>{
        const encoded=record[sourceField];if(encoded===undefined||encoded===null||encoded==='')return;
        let rows;try{if(typeof encoded!=='string')throw new Error('String required');rows=JSON.parse(encoded);if(!Array.isArray(rows))throw new Error('Array required');}catch(_){issues.push('第'+(recordIndex+1)+'条 '+sourceField+' 不是有效的 JSON 数组字符串');return;}
        rows.forEach((row,segmentIndex)=>{
          if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.text!=='string'){issues.push('第'+(recordIndex+1)+'条 '+sourceField+' 文本片段结构无效');return;}
          if(!row.text.trim())return;
          const role=sourceField==='botText'?'机器人':monitorSide===1?'坐席':monitorSide===2?'客户':'说话方未知';
          segments.push({text:row.text,role,monitorSide:record.monitorSide??null,sourceField,recordIndex,segmentIndex,beginTime:row.beginTime??null,endTime:row.endTime??null,sentenceId:row.sentenceId??null,fieldDescription:sourceField==='text'?'客户对话文本信息':'机器人对话文本信息',speakerEvidence:sourceField==='botText'?'botText 定义为机器人文本':'monitorSide：1 坐席侧（webcall 第二侧），2 客户侧（webcall 第一侧）',rawRecord:record,rawSegment:row});
        });
      });
    });
    // Reject the whole malformed payload; neither partial nor previously cached text implies success.
    if(issues.length)return {...base,segments:[],status:'文本数据待核对'};
    return {...base,status:segments.length?'已提供':'暂无通话文本'};
  }
  function taskResult(response={}){
    const row=code(response.result)===0?response.data?.taskProperty:null;
    return {providerTaskId:row?integer(row.id):null,providerStatus:row?enumLabel(taskStatus,row.status):'待确认',statusTriggerType:row?enumLabel({0:'系统变更',1:'人为变更'},row.statusTriggerType):'待确认',description:row?.statusDescription||response.description||'',raw:response};
  }
  const agentGroupFields=Object.freeze({
    validGno,
    create(input={}){
      const gno=text(input.gno),groupName=text(input.groupName||input.name),comment=text(input.comment);
      const errors=[],fields={gno,groupName};
      if(!validGno(gno))errors.push('外呼组编号须为2-20位，以字母开头，且同时包含字母和数字');
      if(!groupName||groupName.length>50)errors.push('外呼组名称不能为空且长度不能超过50个字符');
      if(comment){if(comment.length>100)errors.push('外呼组描述长度不能超过100个字符');else fields.comment=comment;}
      return {ok:errors.length===0,fields,errors};
    },
    update(input={}){
      const gno=text(input.gno),groupName=text(input.groupName||input.name),comment=text(input.comment);
      const errors=[],fields={gno};
      if(!validGno(gno))errors.push('外呼组编号须为2-20位，以字母开头，且同时包含字母和数字');
      if(input.groupName!==undefined||input.name!==undefined){if(!groupName||groupName.length>50)errors.push('外呼组名称不能为空且长度不能超过50个字符');else fields.groupName=groupName;}
      if(input.comment!==undefined){if(comment.length>100)errors.push('外呼组描述长度不能超过100个字符');else fields.comment=comment;}
      return {ok:errors.length===0,fields,errors};
    },
    assign(input={}){
      const gno=text(input.gno),cnos=Array.isArray(input.cnos)?input.cnos:typeof input.cnos==='string'?input.cnos.split(','):[];
      const errors=[],fields={gno,cnos:cnos.join(',')};
      if(!validGno(gno))errors.push('外呼组编号须为2-20位，以字母开头，且同时包含字母和数字');
      if(!cnos.length||cnos.some(cno=>!validExistingCno(cno))||new Set(cnos).size!==cnos.length)errors.push('座席工号须为不重复的原始字符串，保留前导零');
      if(cnos.length>1000)errors.push('一次最多支持分配1000个座席');
      return {ok:errors.length===0,fields,errors};
    },
    unassign(input={}){
      const gno=text(input.gno),cno=text(input.cno);
      const errors=[],fields={gno,cno};
      if(!validGno(gno))errors.push('外呼组编号须为2-20位，以字母开头，且同时包含字母和数字');
      if(!validExistingCno(input.cno))errors.push('座席编号须为原始字符串，保留前导零');
      return {ok:errors.length===0,fields,errors};
    },
    get(input={}){
      const gno=text(typeof input==='string'?input:input?.gno);
      const errors=[],fields={gno};
      if(!validGno(gno))errors.push('外呼组编号须为2-20位，以字母开头，且同时包含字母和数字');
      return {ok:errors.length===0,fields,errors};
    },
    delete(input={}){
      const gno=text(typeof input==='string'?input:input?.gno);
      const errors=[],fields={gno};
      if(!validGno(gno))errors.push('外呼组编号须为2-20位，以字母开头，且同时包含字母和数字');
      return {ok:errors.length===0,fields,errors};
    },
    list(input={}){
      const start=input.start===undefined?0:integer(input.start),limit=input.limit===undefined?10:integer(input.limit);
      const fields={start,limit},errors=[];
      if(start===null||start<0)errors.push('起始位置须为非负整数');
      if(limit===null||limit<1||limit>1000)errors.push('每页条数须为1～1000的整数');
      if(input.groupName)fields.groupName=text(input.groupName);
      if(input.gno)fields.gno=text(input.gno);
      return {ok:errors.length===0,fields,errors};
    },
    listAssigned(input={}){
      const gno=text(typeof input==='string'?input:input?.gno);
      const errors=[],fields={gno};
      if(!validGno(gno))errors.push('外呼组编号须为2-20位，以字母开头，且同时包含字母和数字');
      if(input.cno)fields.cno=text(input.cno);
      if(input.cname)fields.cname=text(input.cname);
      return {ok:errors.length===0,fields,errors};
    },
    queryAgentGroup(input={}){
      const cno=text(typeof input==='string'?input:input?.cno);
      const errors=[],fields={cno};
      if(!validExistingCno(typeof input==='string'?input:input.cno))errors.push('座席编号须为原始字符串，保留前导零');
      return {ok:errors.length===0,fields,errors};
    }
  });
  root.AliCtiFields=Object.freeze({callStrategies,callStrategyValue,callStrategyLabel,integer,code,validExistingCno,validGno,validAreaCode,authFields,authenticateFields,seatFields,previewFields,loginFields,callerNavigationOptions,normalizeCallerSettings:taskCallerNormalize,validateCallerSettings:taskCallerFields,snapshotCallerSettings:taskCallerNormalize,taskCallerSettings,callerSettingsFromAccount:taskCallerFromAccount,taskFields,taskUpdateFields,taskTimeFields,taskSettings,importFields,validSkillLevel,pauseFields,seatQueryFields,seatQueryResult,seatBatchFields,seatBatchResult,seatSkillQueryResult,seatBatchVerification,seatBatchOverlaps,numberUseLabels,numberUpdateFields,skillUpdateFields,skillUpdateResult,scheduleFields,importResult,muteFields,recordingRequest,cdrQuery,pushFields,pushState,normalizeCdr,numberFields,recordingFields,rasrRequest,rasrFields,previewTranscriptionGate,taskResult,taskStatus,numberTypes,agentGroupFields});
})(typeof window==='undefined'?globalThis:window);
