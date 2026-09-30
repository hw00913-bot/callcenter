/** Local prototype of enterpriseTime CRUD and task references. No calendar execution engine. */
(function(root){
  'use strict';
  const storageKey='alicti-time-conditions-v1',lockKey=storageKey,clone=v=>JSON.parse(JSON.stringify(v));
  const state=()=>root.AppState?.get?.()||{},access=()=>root.AppState?.effectiveAccess?.()||{};
  const fail=message=>({ok:false,rows:[],message}),object=x=>x&&typeof x==='object'&&!Array.isArray(x),str=x=>typeof x==='string';
  const positive=x=>/^[1-9]\d*$/.test(String(x))&&Number.isSafeInteger(Number(x));
  const context=()=>JSON.stringify([state().accountId,state().sessionId,state().enterpriseId,state().tenantId,state().activeDomain,access().roleCode,access().valid]);
  const superUser=()=>access().roleCode==='SUPER_ADMIN';
  const ready=()=>root.AppState?.isReady?.()!==false&&access().valid&&!!state().accountId&&!!state().sessionId&&state().activeDomain==='CLOUD_CONTACT_CENTER';
  const canAccess=()=>ready()&&['ADMIN','SUPER_ADMIN'].includes(access().roleCode)&&root.AppState.canMenu('settings.times');
  const tenantValid=t=>t&&!t.builtIn&&t.enterpriseId===state().enterpriseId&&t.status==='启用'&&t.capabilitySet?.includes('CLOUD_CONTACT_CENTER');
  const tenants=()=>{if(!ready())return [];const owners=(root.CloudCallData?.tenants||[]).filter(t=>!t.builtIn&&t.tenantId!=='TENANT-SUPER-BUILTIN'&&t.enterpriseId===state().enterpriseId);return owners.length===1?owners.filter(t=>tenantValid(t)&&(superUser()||t.tenantId===state().tenantId)&&root.AppState.authorizeObject('',t)).map(clone):[];};
  const tenantAllowed=id=>tenants().some(t=>t.tenantId===id);
  const owned=row=>row.enterpriseId===state().enterpriseId&&(superUser()||row.tenantIds.includes(state().tenantId));
  const canEdit=row=>canAccess()&&!!row&&owned(row)&&row.tenantIds.length===1&&tenantAllowed(row.tenantIds[0]);
  const trace=[];let revisionSeen=0,rawSeen=null;
  const clock=value=>str(value)&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  function date(value){if(!str(value)||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
  function validateStored(data){
    if(!object(data)||data.version!==1||!Number.isSafeInteger(data.revision)||data.revision<0||!Array.isArray(data.rows))throw Error('invalid store');
    const ids=new Set(),names=new Set(),priorities=new Set();
    for(const row of data.rows){
      if(!object(row)||!positive(row.id)||!str(row.enterpriseId)||!row.enterpriseId||!str(row.name)||!row.name.trim()||![1,2].includes(Number(row.type))||![1,2].includes(Number(row.timeType))||!positive(row.priority)||!clock(row.startTime)||!clock(row.endTime)||row.startTime>row.endTime||!Array.isArray(row.tenantIds)||!row.tenantIds.length||row.tenantIds.some(x=>!str(x)||!x)||new Set(row.tenantIds).size!==row.tenantIds.length)throw Error('invalid row');
      if(Number(row.type)===1&&(!str(row.dayOfWeek)||!/^([1-7])(?:,[1-7])*$/.test(row.dayOfWeek)||new Set(row.dayOfWeek.split(',')).size!==row.dayOfWeek.split(',').length||row.fromDay!==''||row.toDay!==''))throw Error('invalid week');
      if(Number(row.type)===2&&(!date(row.fromDay)||!date(row.toDay)||row.fromDay>row.toDay||row.dayOfWeek!==''))throw Error('invalid dates');
      for(const [set,value] of [[ids,String(row.id)],[names,row.name],[priorities,String(row.priority)]]){const key=JSON.stringify([row.enterpriseId,value]);if(set.has(key))throw Error('duplicate');set.add(key);}
    }
    // Do not recycle deleted IDs: old task snapshots may still reference them.
    const maximum=Math.max(95999,...data.rows.map(r=>Number(r.id)));
    if(data.nextId===undefined)data.nextId=Math.max(maximum+1,data.revision?1000000+data.revision:96000);
    if(!Number.isSafeInteger(data.nextId)||data.nextId<=maximum)throw Error('invalid next id');
    return data;
  }
  function load(){
    const raw=root.localStorage.getItem(storageKey);
    if(raw===null){if(revisionSeen)throw Error('removed');if(!root.AliCtiTimeFixtures)throw Error('missing fixture');return {raw,data:validateStored({version:1,revision:0,rows:clone(root.AliCtiTimeFixtures.rows)})};}
    const data=validateStored(JSON.parse(raw));if(data.revision<revisionSeen||data.revision===revisionSeen&&rawSeen!==null&&rawSeen!==raw)throw Error('stale');
    revisionSeen=data.revision;rawSeen=raw;return {raw,data};
  }
  function catalog(tenantId){
    if(!ready()||!['ADMIN','SUPER_ADMIN','OPERATOR'].includes(access().roleCode))return fail('当前账号无权查看时间条件');
    if(tenantId!==undefined&&!tenantAllowed(tenantId))return fail('请选择当前账号内的有效租户');
    try{const {data}=load();return {ok:true,rows:clone(data.rows.filter(r=>owned(r)&&(tenantId===undefined||r.tenantIds.includes(tenantId))).sort((a,b)=>Number(a.priority)-Number(b.priority))),revision:data.revision,context:context()};}
    catch(_){return fail('时间条件暂时无法读取，原资料已保留，请核对后重试');}
  }
  function summary(row){
    const days={'1':'周日','2':'周一','3':'周二','4':'周三','5':'周四','6':'周五','7':'周六'};
    return (Number(row.type)===1?String(row.dayOfWeek).split(',').map(x=>days[x]||x).join('、'):`${row.fromDay} 至 ${row.toDay}`)+` · ${row.startTime}–${row.endTime} · ${Number(row.timeType)===2?'间隔':'连续'}`;
  }
  function ids(input){if(input==null||input==='')return [];if(Array.isArray(input))return input.map(String);if(str(input))return input.split(',');throw Error('invalid ids');}
  function referenced(record,id){
    const sections=[record,record?.values,record?.executionConfig,record?.planSnapshot,record?.alictiCreateDraft?.fields];
    return sections.some(x=>x&&['allowedTimeIds','forbiddenTimeIds','autoTriggerTimeStrategy','timeStrategy'].some(k=>ids(x[k]).includes(String(id))));
  }
  function usage(row){
    if(!canAccess()||!row||!owned(row))return fail('当前范围无权查看引用');
    try{
      const items=[],seen=new Set(),terminal=new Set(['已完成','已终止','已删除','已结束']);
      const add=(kind,r,key,status)=>{const unique=kind+':'+key;if(seen.has(unique))return;seen.add(unique);items.push({kind,id:key,name:r.name||r.taskName||key,status,active:kind==='任务'&&(['执行中','已暂停'].includes(status)||[1,2].includes(Number(r.providerStatusCode)))});};
      const parseRows=(storage,key)=>{if(!storage?.getItem)return [];const raw=storage.getItem(key);if(raw===null)return [];const rows=JSON.parse(raw);if(!Array.isArray(rows))throw Error('invalid references');return rows;};
      const tasks=[...(root.CloudCallData?.tasks||[]),...(root.CloudCallData?.predictiveTasks||[]),...(root.CloudCallData?.ivrTasks||[]),...(root.CloudTaskWorkspace?.storedTasks?root.CloudTaskWorkspace.storedTasks():parseRows(root.localStorage?.getItem?.('cloud-task-created-v1')!==null&&root.localStorage?.getItem?root.localStorage:root.sessionStorage,'cloud-task-created-v1'))];
      for(const task of tasks)if(task.enterpriseId===row.enterpriseId&&!terminal.has(task.status)&&referenced(task,row.id))add('任务',task,task.taskId,task.status||'待启动');
      for(const draft of parseRows(root.sessionStorage,'cloud-task-wizard-drafts-v1'))if(draft.enterpriseId===row.enterpriseId&&draft.status==='草稿'&&referenced(draft,row.id))add('草稿',draft,draft.draftId,'草稿');
      const raw=root.localStorage.getItem('alicti-inbound-router-v1'),inbound=raw===null?{rows:root.AliCtiInboundMock?.rows||[],pending:[]}:JSON.parse(raw);
      if(!object(inbound)||!Array.isArray(inbound.rows)||!Array.isArray(inbound.pending))throw Error('invalid inbound');
      if(inbound.pending.some(r=>String(r.enterpriseId)===row.enterpriseId))throw Error('inbound pending');
      for(const rule of inbound.rows)if(String(rule.enterpriseId)===row.enterpriseId&&String(rule.ruleTimeProperty||'').split(';').includes(String(row.id)))add('呼入规则',rule,String(rule.id),String(rule.active)==='1'?'启用':'停用');
      return {ok:true,count:items.length,items,rules:items.filter(x=>x.kind==='呼入规则'),blockedActive:items.some(x=>x.active),message:items.length?'该条件已被使用，删除前请先解除关联':''};
    }catch(_){return fail('时间条件引用暂时无法核对，请刷新后再操作');}
  }
  function normalize(input,previous,next){
    const keys=['name','priority','type','timeType','fromDay','toDay','dayOfWeek','startTime','endTime','tenantId'];
    if(!object(input)||Object.keys(input).some(k=>!keys.includes(k)))return fail('时间条件包含不支持的字段');
    const v={...(previous||{}),...input};
    if(!str(v.name)||!v.name.trim())return fail('请填写时间条件名称');
    if(previous&&v.name!==previous.name)return fail('时间条件名称不可直接修改，请另建条件');
    if(!positive(v.priority))return fail('优先级须为从1开始的整数');
    if(![1,2,'1','2'].includes(v.type)||![1,2,'1','2'].includes(v.timeType))return fail('请选择条件类型及时间类型');
    if(!clock(v.startTime)||!clock(v.endTime)||v.startTime>v.endTime)return fail('请填写有效的起止时间，开始时间不能晚于结束时间');
    const fields={name:v.name.trim(),priority:Number(v.priority),type:Number(v.type),timeType:Number(v.timeType),startTime:v.startTime,endTime:v.endTime,fromDay:'',toDay:'',dayOfWeek:''};
    if(fields.type===1){const days=Array.isArray(v.dayOfWeek)?v.dayOfWeek.map(String):str(v.dayOfWeek)?v.dayOfWeek.split(','):[];if(!days.length||days.some(x=>!/^([1-7])$/.test(x)))return fail('请至少选择一个星期');fields.dayOfWeek=[...new Set(days)].sort().join(',');}
    else{if(!date(v.fromDay)||!date(v.toDay)||v.fromDay>v.toDay)return fail('请选择有效日期范围，开始日期不能晚于结束日期');fields.fromDay=v.fromDay;fields.toDay=v.toDay;}
    const scope=tenants();if(scope.length!==1)return fail('当前账号须绑定唯一的有效租户');
    const tenantId=input.tenantId||previous?.tenantIds?.[0]||scope[0].tenantId;
    if(tenantId!==scope[0].tenantId)return fail('时间条件只能归属当前账号绑定的租户');
    if(!previous&&!tenantAllowed(tenantId))return fail('请选择当前账号下的使用租户');
    if(previous&&Object.hasOwn(input,'tenantId')&&(previous.tenantIds.length!==1||previous.tenantIds[0]!==tenantId))return fail('已建时间条件不能直接变更所属租户，请另建条件');
    if(next.rows.some(r=>r.enterpriseId===state().enterpriseId&&r.id!==previous?.id&&(r.name===fields.name||Number(r.priority)===fields.priority)))return fail('当前账号已有同名条件或相同优先级，请调整后重试');
    return {ok:true,fields,tenantId};
  }
  function request(endpoint,fields,response){trace.push({endpoint:'/interface/v10/enterpriseTime/'+endpoint,method:'POST',fields:{...(root.AliCtiFields?.authFields?.(state().enterpriseId)?.fields||{validateType:2,enterpriseId:state().enterpriseId}),...clone(fields)},response:clone(response),mock:true});}
  function provider(row){const {tenantIds,localUpdatedAt,...value}=row;return clone(value);}
  async function write(options,action){
    if(!canAccess())return fail('当前账号无时间条件维护权限');const captured=context();
    if(options?.expectedContext!==captured)return fail('账号或租户已变化，请重新打开');
    if(!root.navigator?.locks?.request)return fail('当前浏览器无法保护配置，请通过本地预览地址操作');
    try{return await root.navigator.locks.request(lockKey,{ifAvailable:true},lock=>{
      if(!lock)return fail('另一项时间条件正在保存，请稍后重试');
      if(!canAccess()||context()!==captured)return fail('账号或租户已变化，请重新打开');
      const loaded=load();if(loaded.data.revision!==options.expectedRevision)return fail('时间条件已更新，请重新打开后操作');
      const next=clone(loaded.data),result=action(next);if(!result.ok)return result;
      if(context()!==captured||root.localStorage.getItem(storageKey)!==loaded.raw)return fail('时间条件已变化，请重新打开后操作');
      const savedAt=new Date().toISOString();
      for(const row of next.rows){const previous=loaded.data.rows.find(old=>old.enterpriseId===row.enterpriseId&&old.id===row.id);if(!previous||JSON.stringify(previous)!==JSON.stringify(row))row.localUpdatedAt=savedAt;}
      next.revision++;validateStored(next);const raw=JSON.stringify(next);root.localStorage.setItem(storageKey,raw);revisionSeen=next.revision;rawSeen=raw;
      request(result.endpoint,result.fields,result.response);
      return {ok:true,row:result.row?clone(result.row):null,revision:next.revision,context:captured,message:result.message||'时间条件已保存'};
    });}catch(_){return fail('时间条件未保存，原资料已保留，请核对后重试');}
  }
  function create(input,options){return write(options,next=>{
    const parsed=normalize(input,null,next);if(!parsed.ok)return parsed;
    const row={...parsed.fields,id:String(next.nextId++),enterpriseId:state().enterpriseId,tenantIds:[parsed.tenantId],createTime:new Date().toLocaleString('sv-SE')};next.rows.push(row);
    return {ok:true,row,endpoint:'create',fields:parsed.fields,response:{result:'0',description:'成功',data:provider(row)}};
  });}
  function update(id,input,options){return write(options,next=>{
    const row=next.rows.find(r=>r.id===String(id)&&owned(r));if(!row||!canEdit(row))return fail('只能修改当前账号所属租户的时间条件');
    const used=usage(row);if(!used.ok)return used;if(used.blockedActive)return fail('该条件关联执行中或暂停的任务，请另建时间条件或待任务结束后修改');
    const parsed=normalize(input,row,next);if(!parsed.ok)return parsed;Object.assign(row,parsed.fields);
    const {name,...fields}=parsed.fields;
    return {ok:true,row,endpoint:'update',fields:{id:Number(row.id),...fields},response:{result:'0',description:'成功',data:provider(row)}};
  });}
  function remove(id,options){return write(options,next=>{
    const row=next.rows.find(r=>r.id===String(id)&&owned(r));if(!row||!canEdit(row))return fail('当前范围无权删除该时间条件');const used=usage(row);if(!used.ok)return used;if(used.count)return fail('该条件仍被任务、草稿或呼入规则使用，请先解除关联');
    next.rows=next.rows.filter(r=>r!==row);return {ok:true,endpoint:'delete',fields:{id:Number(row.id)},response:{result:'0',description:'成功'},message:'时间条件已删除'};
  });}
  function validateTask(input,tenantId){
    if(!object(input)||![0,1,'0','1',undefined].includes(input.autoTaskType))return fail('请选择有效的呼叫时段方式');
    const available=catalog(tenantId);if(!available.ok)return available;
    try{
      const type=Number(input.autoTaskType||0),allowed=type===1?ids(input.allowedTimeIds):[],forbidden=ids(input.forbiddenTimeIds);
      if(type===1&&!allowed.length)return fail('请至少选择一个可呼叫时段');
      if([...allowed,...forbidden].some(id=>!positive(id)||!available.rows.some(r=>String(r.id)===id)))return fail('所选时间条件已失效或不属于本租户，请重新选择');
      if(allowed.some(id=>forbidden.includes(id)))return fail('同一时间条件不能同时作为可呼叫和禁止呼叫时段');
      const fields={autoTaskType:type};if(type===1)fields.autoTriggerTimeStrategy=[...new Set(allowed)].join(',');if(forbidden.length)fields.timeStrategy=[...new Set(forbidden)].join(',');
      const selected=new Set([...allowed,...forbidden]);return {ok:true,fields,snapshot:clone(available.rows.filter(r=>selected.has(String(r.id)))),revision:available.revision,context:available.context};
    }catch(_){return fail('时间条件格式无效，请重新选择');}
  }
  root.AliCtiTimeConditions=Object.freeze({canAccess,context,catalog,tenants,canEdit,summary,usage,create,update,remove,validateTask,trace:()=>clone(trace)});
})(window);
