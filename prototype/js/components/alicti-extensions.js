/** exten API-shaped local demo; tenant ownership follows its enterprise account. No provider calls. */
(function(root){
  'use strict';
  const storageKey='alicti-extension-directory-v2',lockKey='alicti-seat-phone-config-v1';
  try{root.localStorage.removeItem('alicti-extension-directory-v1');}catch(_){/* Only discard this module's obsolete demo snapshot. */}
  const clone=value=>JSON.parse(JSON.stringify(value)),state=()=>root.AppState?.get?.()||{},access=()=>root.AppState?.effectiveAccess?.()||{};
  const text=value=>typeof value==='string'&&value===value.trim(),digits=value=>text(value)&&/^\d{3,11}$/.test(value);
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  const context=()=>JSON.stringify([state().accountId,state().sessionId,state().enterpriseId,state().tenantId,state().activeDomain,access().roleCode,access().valid]);
  const fail=message=>({ok:false,rows:[],message});
  const superUser=()=>access().roleCode==='SUPER_ADMIN';
  const canAccess=()=>root.AppState?.isReady?.()!==false&&access().valid&&!!state().accountId&&!!state().sessionId&&state().activeDomain==='CLOUD_CONTACT_CENTER'&&['ADMIN','SUPER_ADMIN'].includes(access().roleCode);
  const boundTenant=enterpriseId=>{
    if(root.AppState?.tenantForEnterprise)return root.AppState.tenantForEnterprise(enterpriseId);
    const rows=(root.CloudCallData?.tenants||[]).filter(t=>!t.builtIn&&t.tenantId!=='TENANT-SUPER-BUILTIN'&&t.enterpriseId===enterpriseId);
    return rows.length===1?rows[0]:null;
  };
  const tenantValid=t=>!!t&&!t.builtIn&&t.tenantId!=='TENANT-SUPER-BUILTIN'&&t.enterpriseId===state().enterpriseId&&t.status==='启用'&&t.capabilitySet?.includes('CLOUD_CONTACT_CENTER');
  const tenants=()=>{const tenant=boundTenant(state().enterpriseId);return canAccess()&&tenantValid(tenant)&&(superUser()||tenant.tenantId===state().tenantId)&&root.AppState.authorizeObject('',tenant)?[clone(tenant)]:[];};
  const scoped=row=>row.enterpriseId===state().enterpriseId&&(superUser()||row.tenantId===state().tenantId);
  const knownBinding=row=>Object.hasOwn(row,'bindCno')&&(row.bindCno===null||typeof row.bindCno==='string');
  const sameResource=(a,b)=>a.enterpriseId===b.enterpriseId&&a.exten===b.exten;
  const trace=[];
  let revisionSeen=0,rawSeen=null;
  function validateStored(data){
    if(!object(data)||data.schemaVersion!==2||!Number.isSafeInteger(data.revision)||data.revision<0||!Array.isArray(data.rows)||!Array.isArray(data.deleted))throw Error('invalid store');
    const keys=new Set(),ids=new Set();
    for(const row of data.rows){
      if(!object(row)||!text(row.id)||!row.id||!text(row.enterpriseId)||!row.enterpriseId||!digits(row.exten)||!text(row.tenantId)||![1,2,3].includes(row.type)||![0,1].includes(row.active)||Object.keys(row).some(k=>/password/i.test(k)))throw Error('invalid extension');
      if(!row.tenantId||boundTenant(row.enterpriseId)?.tenantId!==row.tenantId)throw Error('invalid tenant ownership');
      const key=JSON.stringify([row.enterpriseId,row.exten]),id=JSON.stringify([row.enterpriseId,row.id]);
      if(keys.has(key)||ids.has(id))throw Error('duplicate extension');keys.add(key);ids.add(id);
    }
    if(data.deleted.some(row=>!object(row)||!text(row.enterpriseId)||!digits(row.exten)))throw Error('invalid tombstone');
    return data;
  }
  function load(){
    const raw=root.localStorage.getItem(storageKey);
    if(raw===null){if(revisionSeen)throw Error('removed store');if(!root.AliCtiExtensionFixtures)throw Error('missing fixtures');return {raw,data:validateStored({schemaVersion:2,revision:0,rows:clone(root.AliCtiExtensionFixtures.rows),deleted:[]})};}
    const data=validateStored(JSON.parse(raw));
    if(data.revision<revisionSeen||data.revision===revisionSeen&&rawSeen!==null&&raw!==rawSeen)throw Error('revision conflict');
    revisionSeen=data.revision;rawSeen=raw;return {raw,data};
  }
  function directoryRevision(){try{return load().data.revision;}catch(_){return -1;}}
  function catalog(){
    if(!canAccess())return fail('当前账号无分机管理权限');
    try{const {data}=load();return {ok:true,rows:clone(data.rows.filter(scoped)),revision:data.revision,context:context()};}
    catch(_){return fail('分机资料暂时无法读取，原数据已保留，请核对后重试');}
  }
  function seatScope(agent){
    const a=access(),s=state();
    return !!agent&&a.valid&&!!s.accountId&&!!s.sessionId&&s.activeDomain==='CLOUD_CONTACT_CENTER'&&root.AppState?.isReady?.()!==false&&agent.enterpriseId===s.enterpriseId&&root.AppState.authorizeObject('',agent)&&(!['ADMIN','OPERATOR'].includes(a.roleCode)||agent.tenantId===s.tenantId)&&tenantValid(root.CloudCallData?.tenants?.find(t=>t.tenantId===agent.tenantId));
  }
  function allUsage(row){
    if(!root.SeatPhoneConfig?.assignedValue)throw Error('seat config unavailable');
    return (root.CloudCallData?.agents||[]).filter(a=>a.enterpriseId===row.enterpriseId&&a.lifecycleStatus!=='已删除'&&root.SeatPhoneConfig.assignedValue(a)===row.exten);
  }
  function usage(row){
    if(!canAccess()||!row||!scoped(row))return fail('当前范围无权查看分机使用情况');
    try{if(!knownBinding(row))return fail('供应商绑定状态待核对');const agents=allUsage(row);return {ok:true,count:Math.max(agents.length,row.bindCno?1:0),agents:agents.filter(a=>superUser()||a.tenantId===state().tenantId).map(a=>({identityId:a.contactCenterIdentityId,userName:a.userName,cno:a.cno,tenantId:a.tenantId,agentStatus:a.agentStatus})),message:row.bindCno?'AliCti 当前已有坐席绑定':''};}
    catch(_){return fail('坐席分机配置暂时无法核对，请核对后重试');}
  }
  function checkSelection(agent,value){
    if(!seatScope(agent))return fail('只能选择当前账号及本租户的分机');
    try{
      const {data}=load(),meta={revision:data.revision,context:context()};
      if(value==='')return {ok:true,...meta};
      if(!digits(value))return fail('请选择分机管理中登记的分机');
      const row=data.rows.find(r=>r.enterpriseId===agent.enterpriseId&&r.exten===value);
      if(!row||row.tenantId!==agent.tenantId)return fail('该分机不属于当前账号绑定租户，请在分机管理中核对');
      if(row.type!==2||row.active!==1)return fail('请选择已启用的软电话分机');
      if(!knownBinding(row))return fail('该分机的供应商绑定状态待核对，请刷新后再选择');
      if(row.bindCno!=null&&row.bindCno!==''&&row.bindCno!==agent.cno)return fail('该分机已被 AliCti 其他坐席绑定，请选择其他分机');
      if(allUsage(row).some(a=>a.contactCenterIdentityId!==agent.contactCenterIdentityId))return fail('该分机已分配给其他坐席，请选择其他分机');
      return {ok:true,...meta,row:clone(row)};
    }catch(_){return fail('分机或坐席配置暂时无法核对，请核对后重试');}
  }
  function choices(agent){
    if(!seatScope(agent))return fail('当前范围无权选择该坐席的分机');
    try{
      const {data}=load();
      // Validate occupancy once even if there are no candidate rows.
      if(!root.SeatPhoneConfig?.assignedValue)throw Error('seat config unavailable');
      for(const a of root.CloudCallData.agents.filter(a=>a.enterpriseId===agent.enterpriseId&&a.lifecycleStatus!=='已删除'))root.SeatPhoneConfig.assignedValue(a);
      return {ok:true,rows:clone(data.rows.filter(row=>row.enterpriseId===agent.enterpriseId&&row.tenantId===agent.tenantId&&checkSelection(agent,row.exten).ok)),revision:data.revision,context:context()};
    }catch(_){return fail('分机或坐席配置暂时无法核对，请核对后重试');}
  }
  function outboundEligibility(agent){
    let value;
    try{value=root.SeatPhoneConfig?.assignedValue(agent);}catch(_){return fail('坐席分机配置暂时无法核对');}
    if(!value)return fail('请先在坐席维护中选择软电话分机');
    const selected=checkSelection(agent,value);if(!selected.ok)return selected;
    if(String(selected.row.isOb)==='0')return fail('当前分机不允许外呼，请联系管理员调整');
    if(String(selected.row.callPower)==='3')return fail('当前分机仅允许内部呼叫，不能呼叫客户');
    return {ok:true};
  }
  function request(endpoint,fields,response){
    const safe=clone(fields);if(Object.hasOwn(safe,'password'))safe.password='[已隐藏]';
    trace.push({endpoint:'/interface/v10/exten/'+endpoint,fields:{validateType:2,enterpriseId:state().enterpriseId,...safe},response:clone(response),mock:true});
  }
  function normalize(input,previous){
    if(!object(input))return fail('请填写分机资料');
    const allowed=['exten','password','tenantId','type','areaCode','callPower','isOb','isDirect','ibRecord','obRecord','jitterBuffer','denoise','allow','active'];
    if(Object.keys(input).some(k=>!allowed.includes(k)))return fail('分机资料包含不支持的字段');
    const exten=input.exten??previous?.exten;
    if(!digits(exten))return fail('分机号须为3–11位数字，保留开头的0');
    if(previous&&previous.exten!==exten)return fail('分机号不可修改，请新建分机');
    if(input.type!==undefined&&Number(input.type)!==2)return fail('当前项目统一使用软电话分机');
    const tenantId=tenants()[0]?.tenantId;
    if(!tenantId)return fail('请先为当前 AliCti 账号绑定已启用云呼叫的业务租户');
    if(input.tenantId!==undefined&&input.tenantId!==tenantId||previous&&tenantId!==previous.tenantId)return fail('分机自动归属账号的唯一业务租户，不能更改归属');
    if(!text(input.areaCode)||!/^\d+$/.test(input.areaCode))return fail('请填写数字区号，例如021');
    if(!previous&&(typeof input.password!=='string'||!input.password))return fail('请设置分机密码');
    if(input.password!==undefined&&typeof input.password!=='string')return fail('分机密码格式无效');
    const fields={exten,areaCode:input.areaCode,type:2};
    if(input.password)fields.password=input.password;
    const defaults={callPower:'0',isOb:1,isDirect:1,ibRecord:1,obRecord:1,jitterBuffer:0,denoise:0,active:1,allow:'alaw,ulaw'};
    for(const key of Object.keys(defaults)){
      if(input[key]===undefined&&previous)continue;
      const value=input[key]??defaults[key];
      if(key==='callPower'){if(!['0','1','2','3'].includes(String(value)))return fail('请选择正确的呼叫范围');fields[key]=String(value);}
      else if(key==='allow'){if(!['alaw,ulaw','myopus,alaw,ulaw'].includes(value))return fail('请选择软电话支持的语音编码');fields[key]=value;}
      else{if(![0,1,'0','1'].includes(value))return fail('请选择正确的开关状态');fields[key]=!previous&&['isOb','denoise'].includes(key)?String(value):Number(value);}
    }
    return {ok:true,fields,tenantId};
  }
  function inboundReferences(row){
    const raw=root.localStorage.getItem('alicti-inbound-router-v1');
    const data=raw===null?{rows:root.AliCtiInboundMock?.rows||[]}:JSON.parse(raw);
    if(!object(data)||!Array.isArray(data.rows)||(data.pending||[]).some(r=>r.enterpriseId===row.enterpriseId))throw Error('inbound scope unknown');
    // Both active and paused rules retain their target until explicitly edited/deleted.
    return data.rows.filter(r=>String(r.enterpriseId)===row.enterpriseId&&String(r.routerType)==='3'&&String(r.routerProperty)===row.exten);
  }
  function activeUse(agent){
    if(agent.currentCall||agent.currentEndpoint||!['离线','未上线','未登录'].includes(agent.agentStatus))return true;
    const operation=root.AliCtiSeatOperations?.status?.(),session=operation?.session||root.AliCtiAdapter?.session;
    if(session&&session.enterpriseId===agent.enterpriseId&&session.cno===agent.cno)return true;
    const last=operation?.lastRequest;
    if((operation?.pending||operation?.inFlight)&&last?.enterpriseId===agent.enterpriseId&&last?.cno===agent.cno)return true;
    const management=root.AliCtiSeatOperations?.managementState?.();
    return !!((management?.pending||management?.inFlight)&&management.cno===agent.cno);
  }
  function mutationGuard(row,kind,input={}){
    if(!knownBinding(row))return '该分机的绑定状态待核对，请先核对后操作';
    const users=allUsage(row);
    if(kind!=='update'&&(users.length||row.bindCno))return '请先在坐席维护中解除分机选择，再删除';
    if(kind==='update'&&(row.bindCno||users.some(activeUse)))return '该分机正在使用或状态待核对，请先将使用坐席下线再修改';
    if((kind!=='update'||Number(input.active)===0)&&inboundReferences(row).length)return '该分机被呼入规则使用，请先调整对应规则';
    return '';
  }
  async function write(options,action,seatResourceId){
    if(!canAccess())return fail('当前账号无分机维护权限');
    const captured=context();
    if(!options||options.expectedContext!==captured)return fail('工作范围已变化，请重新打开分机页面');
    if(!root.navigator?.locks?.request)return fail('当前浏览器无法保护分机配置，请通过本地预览地址操作');
    try{return await root.navigator.locks.request(lockKey,{ifAvailable:true},async lock=>{
      if(!lock)return fail('分机或坐席配置正在保存，请稍后重试');
      if(!canAccess()||context()!==captured)return fail('工作范围已变化，请重新打开分机页面');
      const loaded=load();
      if(options.expectedRevision!==loaded.data.revision)return fail('分机资料已更新，请重新打开后操作');
      const resource=seatResourceId==null?null:loaded.data.rows.find(r=>r.id===String(seatResourceId)&&scoped(r));
      const identities=resource?[...new Set(allUsage(resource).map(a=>a.contactCenterIdentityId))].sort():[];
      const withSeatLocks=async index=>{
        if(index<identities.length)return root.navigator.locks.request('unified-call-seat:'+identities[index],{ifAvailable:true},seatLock=>seatLock?withSeatLocks(index+1):fail('该分机的坐席正在其他窗口使用，请先下线再修改'));
        if(!canAccess()||context()!==captured||root.localStorage.getItem(storageKey)!==loaded.raw)return fail('工作范围或分机资料已变化，请重新打开后操作');
        const next=clone(loaded.data),result=action(next);
        if(!result.ok)return result;
        if(context()!==captured||root.localStorage.getItem(storageKey)!==loaded.raw)return fail('分机资料已变化，请重新打开后操作');
        const savedAt=new Date().toISOString();
        for(const row of next.rows){const previous=loaded.data.rows.find(old=>old.enterpriseId===row.enterpriseId&&old.id===row.id);if(!previous||JSON.stringify(previous)!==JSON.stringify(row))row.localUpdatedAt=savedAt;}
        next.revision++;validateStored(next);
        const raw=JSON.stringify(next);root.localStorage.setItem(storageKey,raw);revisionSeen=next.revision;rawSeen=raw;
        for(const item of result.requests||[])request(item.endpoint,item.fields,item.response);
        return {ok:true,row:result.row?clone(result.row):null,revision:next.revision,context:captured,message:result.message||'分机资料已保存'};
      };
      return withSeatLocks(0);
    });}catch(_){return fail('分机资料未保存，原数据已保留，请核对后重试');}
  }
  function create(input,options){return write(options,next=>{
    const parsed=normalize(input);if(!parsed.ok)return parsed;
    const {fields,tenantId}=parsed,enterpriseId=state().enterpriseId;
    if([...next.rows,...(root.AliCtiExtensionFixtures.available||[]).filter(r=>!next.deleted.some(d=>sameResource(d,r)))].some(r=>r.enterpriseId===enterpriseId&&r.exten===fields.exten))return fail('该分机号已存在，请选择其他号码或从 AliCti 导入');
    const id=String(Math.max(98999,...next.rows.map(r=>Number(r.id)||0))+1),safe={...fields};delete safe.password;
    for(const k of ['isOb','denoise'])if(safe[k]!==undefined)safe[k]=Number(safe[k]);
    const row={...safe,id,enterpriseId,tenantId,bindCno:null,createTime:new Date().toLocaleString('sv-SE')};
    next.rows.push(row);next.deleted=next.deleted.filter(d=>!sameResource(d,row));
    const {tenantId:localTenant,localUpdatedAt,...response}=row;
    return {ok:true,row,message:'分机已新增，可在坐席维护中选择',requests:[{endpoint:'create',fields,response:{result:'0',description:'成功',data:response}}]};
  });}
  function update(id,input,options){return write(options,next=>{
    const row=next.rows.find(r=>r.id===String(id)&&scoped(r));if(!row)return fail('该分机不存在或已不在当前范围');
    if(row.type!==2)return fail('当前项目仅维护软电话分机');
    const parsed=normalize(input,row);if(!parsed.ok)return parsed;
    const blocked=mutationGuard(row,'update',parsed.fields);if(blocked)return fail(blocked);
    const safe={...parsed.fields};delete safe.password;Object.assign(row,safe);
    const {tenantId,localUpdatedAt,...response}=row;
    return {ok:true,row,requests:[{endpoint:'update',fields:parsed.fields,response:{result:'0',description:'成功',data:response}}]};
  },id);}
  function assign(){return Promise.resolve(fail('分机自动归属账号的唯一业务租户，不支持分配或取消归属'));}
  function remove(id,options){return write(options,next=>{
    const row=next.rows.find(r=>r.id===String(id)&&scoped(r));if(!row)return fail('该分机不存在或已不在当前范围');
    const blocked=mutationGuard(row,'delete');if(blocked)return fail(blocked);
    next.rows=next.rows.filter(r=>r!==row);next.deleted.push({enterpriseId:row.enterpriseId,exten:row.exten});
    // batchDelete documents extens:String. One-item deletion preserves leading zeros;
    // a successful count alone is insufficient: the following list response confirms absence.
    return {ok:true,message:'分机已删除',requests:[{endpoint:'batchDelete',fields:{extens:row.exten},response:{result:'0',description:'成功',data:{success:'1',fail:'0'}}},{endpoint:'list',fields:{exten:row.exten,limit:500,offset:0},response:{result:'0',description:'成功',data:{total:'0',list:[]}}}]};
  });}
  function importCandidates(){
    if(!canAccess()||!superUser())return fail('仅超级管理员可从 AliCti 导入分机');
    if(!tenants().length)return fail('请先为当前 AliCti 账号绑定已启用云呼叫的业务租户');
    try{const {data}=load();return {ok:true,rows:clone(root.AliCtiExtensionFixtures.available.filter(r=>r.enterpriseId===state().enterpriseId&&r.type===2&&!data.rows.some(x=>sameResource(x,r))&&!data.deleted.some(x=>sameResource(x,r)))),revision:data.revision,context:context()};}catch(_){return fail('分机列表暂时无法读取，请核对后重试');}
  }
  function importExisting(ids,options){return write(options,next=>{
    if(!superUser())return fail('仅超级管理员可从 AliCti 导入分机');
    const tenantId=tenants()[0]?.tenantId;
    if(!tenantId)return fail('请先为当前 AliCti 账号绑定已启用云呼叫的业务租户');
    if(!Array.isArray(ids)||!ids.length||ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)return fail('请选择有效分机');
    const candidates=importCandidates();if(!candidates.ok)return candidates;
    const rows=ids.map(id=>candidates.rows.find(row=>row.id===id));if(rows.some(row=>!row))return fail('可导入分机已变化，请重新获取');
    for(const row of rows)next.rows.push({...row,tenantId});
    return {ok:true,message:`已导入 ${rows.length} 个分机`,requests:[{endpoint:'list',fields:{type:2,limit:500,offset:0},response:{result:'0',description:'成功',data:{total:String(candidates.rows.length),list:candidates.rows.map(({tenantId,localUpdatedAt,...row})=>row)}}}]};
  });}
  root.AliCtiExtensions=Object.freeze({canAccess,context,catalog,tenants,usage,choices,checkSelection,outboundEligibility,directoryRevision,create,update,remove,assign,importCandidates,importExisting,trace:()=>clone(trace)});
})(window);
