/** Local supplier-account directory. No credentials or supplier requests. */
(function () {
  'use strict';
  const data = window.CloudCallData;
  if (!data || !Array.isArray(data.instances)) return;
  const key = 'alicti-accounts-v2', lockName = 'alicti-account-directory-write-v2';
  const clone = value => structuredClone(value);
  const canonical = value => typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value)>0;
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const statusLabel = value => value === 'RUNNING' ? '运行中' : '已停止';
  const persistedFields = ['configId','enterpriseId','name','brandCustomerName','credentialConfigured','customerClidsGroup','remark','status','version','verification','aliases','seedEnterpriseId','createdAt','updatedAt','createdBy','updatedBy'];
  const inputFields = new Set(['enterpriseId','name','brandCustomerName','credentialConfigured','customerClidsGroup','remark','status']);
  const storedFields = new Set(persistedFields);
  const withoutRegion = row => { const copy=clone(row);delete copy.region;delete copy.regionCode;delete copy.callerNavigations;return copy; };
  const seeds = data.instances.map(row => ({...withoutRegion(row),configId:row.configId || 'ALICTI-CONFIG-SEED-'+encodeURIComponent(row.enterpriseId),seedEnterpriseId:row.enterpriseId,
    aliases:Array.isArray(row.aliases)?clone(row.aliases):[],
    customerClidsGroup:typeof row.customerClidsGroup==='string'?row.customerClidsGroup.trim():'',
    credentialConfigured:row.credentialConfigured === true,remark:typeof row.remark==='string'?row.remark:'',
    version:integer(row.version)&&row.version>0?row.version:1,verification:'unverified'}));
  const seedById = new Map(seeds.map(row => [row.configId,row]));
  const seedIdentifiers = new Set(seeds.map(row => row.enterpriseId));
  let revision = 0, lastError = '', lastRaw = null, hasRestored = false;
  function projected(row) { return Object.fromEntries(persistedFields.filter(field => row[field] !== undefined).map(field => [field,clone(row[field])])); }
  function currentContext() {
    const app=window.AppState,state=app?.get?.() || {};
    return {accountId:state.accountId || '',sessionId:state.sessionId || '',role:app?.isSuper?.()?'SUPER_ADMIN':app?.effectiveAccess?.().roleCode || '',domain:state.activeDomain || '',enterpriseId:state.enterpriseId || '',revision};
  }
  function authorized() {
    const app=window.AppState,state=app?.get?.();
    return !!(state?.accountId && state.sessionId && app?.isReady?.() && app?.isSuper?.() && app?.account?.().status==='启用');
  }
  function sameContext(captured) {
    const now=currentContext();
    return object(captured) && ['accountId','sessionId','role','domain','enterpriseId'].every(field => captured[field]===now[field]);
  }
  function canRead(row) {
    if (authorized()) return true;
    const app=window.AppState;
    return !!(app?.isReady?.() && app?.effectiveAccess?.().valid && row.enterpriseId===app.get().enterpriseId);
  }
  function list() { return clone(data.instances.filter(canRead)); }
  function find(configId) { const row=data.instances.find(r=>r.configId===configId);return row&&canRead(row)?clone(row):null; }
  function ownAudit(row) { return row?.source==='ALICTI_ACCOUNT_CONFIGURATION'; }
  const businessTenant = row => row && row.builtIn !== true && row.tenantId !== 'TENANT-SUPER-BUILTIN';
  function linked(row,ids) {
    if(!object(row))return false;
    if(row.enterpriseId!==undefined && row.enterpriseId!==null && row.enterpriseId!=='')return ids.has(String(row.enterpriseId));
    if(Array.isArray(row.enterpriseIds))return row.enterpriseIds.some(id=>ids.has(String(id)));
    const tenant=(data.tenants || []).find(t=>t.tenantId===row.tenantId);
    return !!(tenant && ids.has(String(tenant.enterpriseId)));
  }
  function history(configId,kind) {
    if(!authorized())return [];
    const row=data.instances.find(r=>r.configId===configId);if(!row)return [];
    if(kind==='tenants'){
      const tenants=(data.tenants || []).filter(tenant=>businessTenant(tenant)&&tenant.enterpriseId===row.enterpriseId);
      return tenants.length===1?clone(tenants):[];
    }
    const sources={tenants:['tenants'],agents:['agents','seats'],seats:['agents','seats'],numbers:['phoneNumbers'],tasks:['tasks','predictiveTasks','ivrTasks'],calls:['calls']}[kind];
    if(!sources)return [];
    const ids=new Set([row.enterpriseId,...(row.aliases || [])]),found=new Map();
    for(const source of sources)for(const [index,item] of (data[source] || []).entries())if(linked(item,ids)){
      const id=kind==='tenants'?item.tenantId:['agents','seats'].includes(kind)?item.contactCenterIdentityId||item.agentRecordId||item.seatId:kind==='numbers'?item.numberId:kind==='tasks'?item.taskId:item.callId||item.contactId;
      if(!found.has(id || source+':'+index))found.set(id || source+':'+index,item);
    }
    return clone([...found.values()]);
  }
  function usageFor(row) {
    if (!row) return {locked:true,identityLocked:true,tenantCount:0,seatCount:0,numberCount:0,taskCount:0,callCount:0,otherReferenceCount:0,referenceCount:0,tenants:[],error:'账号不存在'};
    const ids=new Set([row.enterpriseId,...(row.aliases || [])]),sets={tenant:new Map(),seat:new Map(),number:new Map(),task:new Map(),call:new Map(),other:new Map()},errors=[];
    const kindFor = name => name==='tenants'?'tenant':['agents','seats'].includes(name)?'seat':name==='phoneNumbers'?'number':['tasks','predictiveTasks','ivrTasks'].includes(name)?'task':name==='calls'?'call':'other';
    function add(kind,item,source,index) {
      if (!linked(item,ids) || ownAudit(item) || kind==='tenant'&&!businessTenant(item)) return;
      const id=kind==='tenant'?item.tenantId:kind==='seat'?item.contactCenterIdentityId||item.agentRecordId||item.seatId:kind==='number'?item.numberId||item.alictiNumber?.id:kind==='task'?item.taskId:kind==='call'?item.callId||item.contactId:null;
      sets[kind].set(id || source+':'+index,item);
    }
    for (const [name,rows] of Object.entries(data)) if (Array.isArray(rows) && !['instances','accounts','demoProfiles','memberships'].includes(name)) rows.forEach((item,i)=>add(kindFor(name),item,name,i));
    const storageSources=[['local','customer-task-batches-v1','other'],['local','native-workbench-records-v1','call'],['local','alicti-number-import-v1','number'],['local','cloud-task-creation-transaction-v1','other'],['session','cloud-task-created-v1','task'],['session','cloud-task-wizard-drafts-v1','other'],['session','alicti-seat-import-pool-v1','seat']];
    for (const [storageName,storageKey,kind] of storageSources) {
      try { const raw=(storageName==='local'?localStorage:sessionStorage).getItem(storageKey);if(raw===null)continue;const value=JSON.parse(raw);const rows=storageKey==='cloud-task-creation-transaction-v1'&&object(value)&&value.version===1?[value,value.attachment,value.draftBefore?.values].filter(Boolean):value;if(!Array.isArray(rows))throw Error();rows.forEach((item,i)=>add(kind,item,storageKey,i)); }
      catch (_) { errors.push('业务引用记录暂时无法核对'); }
    }
    try {
      const raw=sessionStorage.getItem('unified-call-demo-identities-v2');
      if(raw!==null){const saved=JSON.parse(raw);if(!object(saved)||!Array.isArray(saved.tenants))throw Error();saved.tenants.forEach((item,i)=>add('tenant',item,'saved-tenants',i));}
    }catch(_){errors.push('租户引用记录暂时无法核对');}
    const counts=Object.fromEntries(Object.entries(sets).map(([kind,rows])=>[(kind==='other'?'otherReference':kind)+'Count',rows.size]));
    const total=Object.values(counts).reduce((a,b)=>a+b,0);
    // References in another tab's session storage are invisible here. Identity never
    // depends on this local usage count once an account has been registered.
    return {...counts,referenceCount:total,locked:total>0||errors.length>0,identityLocked:true,tenants:clone([...sets.tenant.values()]),error:[...new Set(errors)].join('；')};
  }
  function usage(configId) { const row=find(configId);return usageFor(row); }
  function validateStoredRow(row) {
    const seed=seedById.get(row?.configId);
    return object(row) && Object.keys(row).every(field=>storedFields.has(field)) && typeof row.configId==='string' && row.configId.length>0 &&
      (canonical(row.enterpriseId) || seed?.enterpriseId===row.enterpriseId) && typeof row.name==='string' && !!row.name.trim() && row.name===row.name.trim() &&
      typeof row.customerClidsGroup==='string' && row.customerClidsGroup===row.customerClidsGroup.trim() &&
      typeof row.brandCustomerName==='string' && !!row.brandCustomerName.trim() && typeof row.credentialConfigured==='boolean' && typeof row.remark==='string' && ['RUNNING','STOPPED'].includes(row.status) &&
      integer(row.version) && row.version>0 && row.verification==='unverified' && Array.isArray(row.aliases) && new Set(row.aliases).size===row.aliases.length &&
      row.aliases.every(id=>typeof id==='string'&&(canonical(id)||seed?.enterpriseId===id)) && (!row.seedEnterpriseId || row.seedEnterpriseId===seed?.enterpriseId) &&
      ['createdAt','updatedAt','createdBy','updatedBy'].every(field=>row[field]===undefined||typeof row[field]==='string');
  }
  function materialize(row) {
    const seed=seedById.get(row.configId),existing=data.instances.find(r=>r.configId===row.configId);
    const base=seed || existing || {brandCustomerName:row.name,tenantIds:[]};
    return {...withoutRegion(base),...withoutRegion(row),statusLabel:statusLabel(row.status),syncStatus:'待验证',verification:'unverified',
      tenantIds:(data.tenants || []).filter(t=>businessTenant(t)&&t.enterpriseId===row.enterpriseId).map(t=>t.tenantId)};
  }
  function readSnapshot() {
    const raw=localStorage.getItem(key);
    if(raw===null){if(hasRestored&&revision>0)throw Error('账号配置存储已移除，请先恢复原记录，当前目录未被覆盖');return {raw,revision:0,accounts:seeds.map(projected),audits:[]};}
    let saved;try{saved=JSON.parse(raw);}catch(_){throw Error('账号配置存储已损坏，请先恢复原记录，当前目录未被覆盖');}
    if(!object(saved)||saved.schemaVersion!==2||!integer(saved.revision)||saved.revision<1||!Array.isArray(saved.accounts)||!Array.isArray(saved.audits))throw Error('账号配置存储格式无效，当前目录未被覆盖');
    if(!saved.accounts.every(validateStoredRow))throw Error('账号配置存储格式无效，当前目录未被覆盖');
    const merged=new Map(seeds.map(s=>[s.configId,projected(s)]));
    for(const row of saved.accounts)merged.set(row.configId,withoutRegion(row));
    const accounts=[...merged.values()];
    if(new Set(saved.accounts.map(r=>r.configId)).size!==saved.accounts.length || new Set(accounts.map(r=>r.enterpriseId)).size!==accounts.length)throw Error('账号配置存在重复标识，当前目录未被覆盖');
    for(const row of accounts){
      const seed=seedById.get(row.configId);
      if(!seed&&seedIdentifiers.has(row.enterpriseId))throw Error('内置账号标识不能被替换');
      if(seed&&(row.enterpriseId!==seed.enterpriseId || row.brandCustomerName!==seed.brandCustomerName))throw Error('已保存账号的账号 ID 和客户或品牌不能通过存储变更');
      const current=data.instances.find(r=>r.configId===row.configId);if(hasRestored&&current&&(row.enterpriseId!==current.enterpriseId||row.brandCustomerName!==current.brandCustomerName))throw Error('已保存账号的账号 ID 和客户或品牌不能通过存储变更');
    }
    if(hasRestored&&data.instances.some(row=>!accounts.some(r=>r.configId===row.configId)))throw Error('账号配置记录不完整，当前目录未被覆盖');
    if(hasRestored&&saved.revision<revision)throw Error('账号配置版本已回退，当前目录未被覆盖');
    if(hasRestored&&saved.revision===revision&&raw!==lastRaw)throw Error('账号配置已变化但版本未递增，当前目录未被覆盖');
    if(hasRestored&&accounts.some(row=>{const current=data.instances.find(r=>r.configId===row.configId);return current&&(row.version<current.version || row.version===current.version&&persistedFields.some(field=>JSON.stringify(row[field])!==JSON.stringify(current[field])));}))throw Error('账号对象版本冲突，当前目录未被覆盖');
    const auditFields=['auditId','source','configId','enterpriseId','previousEnterpriseId','tenantId','operator','action','object','before','after','at'];
    if(saved.audits.some(a=>!object(a)||!ownAudit(a)||!auditFields.every(f=>typeof a[f]==='string')||Object.keys(a).some(f=>!auditFields.includes(f)))||new Set(saved.audits.map(a=>a.auditId)).size!==saved.audits.length)throw Error('账号配置审计记录无效，当前目录未被覆盖');
    return {raw,revision:saved.revision,accounts,audits:clone(saved.audits)};
  }
  function publish(snapshot) {
    const rows=snapshot.accounts.map(materialize);
    data.instances.splice(0,data.instances.length,...rows);revision=snapshot.revision;lastRaw=snapshot.raw;hasRestored=true;lastError='';
    try { if(Array.isArray(data.audits)){const ids=new Set(data.audits.map(a=>a.auditId));for(const entry of snapshot.audits)if(!ids.has(entry.auditId)){data.audits.unshift(clone(entry));ids.add(entry.auditId);}} } catch (_) { /* Persisted audit remains authoritative if an optional display mirror fails. */ }
  }
  function notify(change) {
    try { const returned=window.AppState?.onSupplierAccountsChanged?.(clone(change));if(returned?.catch)returned.catch(()=>{}); }catch(_){ /* The committed save remains successful even if optional UI refresh fails. */ }
  }
  function restore() {
    try { const snapshot=readSnapshot();publish(snapshot);return true; }
    catch(error){lastError=error.message || '账号配置暂时无法读取，原记录保留';return false;}
  }
  function activeSessionWouldChange(before,after) {
    if(!before || before.enterpriseId!==currentContext().enterpriseId || ['status','enterpriseId','credentialConfigured'].every(field=>before[field]===after[field]))return false;
    try {
      const session=window.AgentWorkbench?.receivingContext?.();
      if(session?.busy || ['offered','answering','dialing','ringing','connected','wrap'].includes(session?.phase))return true;
      if(window.AgentWorkbench?.allowContextChange && window.AgentWorkbench.allowContextChange(true)===false)return true;
    }catch(_){return true;}
    return false;
  }
  function validateInput(input,before,accounts) {
    const errors={};
    if(!object(input))return {errors:{_form:'请填写账号配置'}};
    if(Object.keys(input).some(field=>!inputFields.has(field)))errors._form='只保存账号目录配置，请勿提交口令、令牌或其他字段';
    if(typeof input.name!=='string'||!input.name.trim())errors.name='请输入账号名称';
    const eid=input.enterpriseId;
    if(!canonical(eid)&&eid!==before?.enterpriseId)errors.enterpriseId=typeof eid==='string'&&/^[1-9]\d*$/.test(eid)?'账号 ID 超出接口适配可精确表示的整数范围':'请输入不含前导零的正整数账号 ID';
    if(eid===undefined||typeof eid!=='string')errors.enterpriseId='账号 ID 必须是正整数文本';
    if(accounts.some(row=>row.configId!==before?.configId&&(row.enterpriseId===eid||(row.aliases||[]).includes(eid))))errors.enterpriseId='该账号 ID 已存在或属于已有账号的历史标识';
    if(before&&eid!==before.enterpriseId)errors.enterpriseId='账号 ID 保存后不能修改，请登记正确账号并停用原账号';
    const brand=input.brandCustomerName===undefined?(before?.brandCustomerName || input.name):typeof input.brandCustomerName==='string'&&!input.brandCustomerName.trim()?input.name:input.brandCustomerName;
    if(typeof brand!=='string'||!brand.trim())errors.brandCustomerName='请输入客户或品牌名称';
    if(before&&typeof brand==='string'&&brand.trim()!==before.brandCustomerName)errors.brandCustomerName='客户或品牌保存后不能修改，请登记正确账号并停用原账号';
    if(typeof input.credentialConfigured!=='boolean')errors.credentialConfigured='请选择是否已准备接入凭据';
    if(input.customerClidsGroup!==undefined&&typeof input.customerClidsGroup!=='string')errors.customerClidsGroup='默认外显导航标识应为文本';
    if(input.remark!==undefined&&typeof input.remark!=='string')errors.remark='备注应为文本';
    const status=input.status===undefined?(before?.status || 'RUNNING'):input.status;if(!['RUNNING','STOPPED'].includes(status))errors.status='请选择启用或停用';
    return {errors,value:{enterpriseId:eid,brandCustomerName:typeof brand==='string'?brand.trim():'',name:typeof input.name==='string'?input.name.trim():'',credentialConfigured:input.credentialConfigured,customerClidsGroup:typeof input.customerClidsGroup==='string'?input.customerClidsGroup.trim():before?.customerClidsGroup || '',remark:typeof input.remark==='string'?input.remark.trim():'',status}};
  }
  const failure = (message,errors={_form:message}) => ({ok:false,message,errors});
  async function transact(input,options,statusOnly) {
    let submitted,opts;
    try{submitted=clone(input);opts=clone(options || {});}catch(_){return failure('账号配置格式无效，请重新填写');}
    if(!authorized())return failure('只有已登录的超级管理员可以维护 AliCti 账号');
    if(!sameContext(opts.context))return failure('当前登录或工作范围已变化，请重新打开账号配置');
    if(!navigator.locks?.request)return failure('当前浏览器不支持安全保存，请使用 Chrome 或本机预览地址重试');
    try {
      return await navigator.locks.request(lockName,{mode:'exclusive'},async()=>{
        if(!authorized()||!sameContext(opts.context))return failure('当前登录或工作范围已变化，请重新打开账号配置');
        let snapshot;try{snapshot=readSnapshot();}catch(error){lastError=error.message;return failure(lastError);}
        if(!integer(opts.context.revision)||opts.context.revision!==snapshot.revision||revision!==snapshot.revision)return failure('账号目录已更新，请刷新后重新打开配置');
        const before=opts.configId?snapshot.accounts.find(row=>row.configId===opts.configId):null;
        if(opts.configId&&!before)return failure('账号已不存在，请刷新后重新选择');
        if(before&&(!integer(opts.expectedVersion)||opts.expectedVersion!==before.version))return failure('账号配置已更新，请重新打开后再保存');
        const values=statusOnly?{...Object.fromEntries([...inputFields].map(f=>[f,before?.[f]])),status:submitted.status}:submitted;
        if(statusOnly&&!before)return failure('请先选择已有账号');
        const validation=validateInput(values,before,snapshot.accounts);
        if(Object.keys(validation.errors).length)return failure('请检查账号配置',validation.errors);
        const at=new Date().toISOString(),actor=currentContext().accountId;
        const after={...(before || {}),...validation.value,configId:before?.configId || 'ALICTI-CONFIG-'+crypto.randomUUID(),
          version:(before?.version || 0)+1,verification:'unverified',aliases:[...new Set([...(before?.aliases || []),...(before&&before.enterpriseId!==validation.value.enterpriseId?[before.enterpriseId]:[])])],
          createdAt:before?.createdAt || at,createdBy:before?.createdBy || actor,updatedAt:at,updatedBy:actor};
        if(activeSessionWouldChange(before,after))return failure('请先结束当前通话并保存处理结果，再修改这项接入配置');
        const action=!before?'create':statusOnly?'status':'update';
        const label=!before?'新增 AliCti 账号':statusOnly?(after.status==='RUNNING'?'启用 AliCti 账号':'停用 AliCti 账号'):'修改 AliCti 账号';
        const audit={auditId:'ALICTI-ACCOUNT-AUDIT-'+crypto.randomUUID(),source:'ALICTI_ACCOUNT_CONFIGURATION',configId:after.configId,enterpriseId:after.enterpriseId,previousEnterpriseId:before?.enterpriseId || '',tenantId:'',operator:window.AppState.account().displayName || window.AppState.account().name || actor,action:label,object:after.configId,before:before?JSON.stringify(projected(before)):'—',after:JSON.stringify(projected(after)),at};
        const accounts=before?snapshot.accounts.map(row=>row.configId===before.configId?after:row):snapshot.accounts.concat(after);
        const candidate={schemaVersion:2,revision:snapshot.revision+1,accounts:accounts.map(projected),audits:snapshot.audits.concat(audit)};
        // Recheck inside the shared lock immediately before the only durable write.
        if(!authorized()||!sameContext(opts.context))return failure('当前登录或工作范围已变化，请重新打开账号配置');
        if(localStorage.getItem(key)!==snapshot.raw)return failure('账号目录已更新，请刷新后重新打开配置');
        const raw=JSON.stringify(candidate);
        try{localStorage.setItem(key,raw);}catch(_){return failure('浏览器保存失败，账号配置尚未更改，请保留输入后重试');}
        publish({...candidate,raw});
        const committedRow=clone(data.instances.find(row=>row.configId===after.configId));
        notify({configId:after.configId,enterpriseId:after.enterpriseId,previousEnterpriseId:before?.enterpriseId || '',action});
        return {ok:true,row:committedRow};
      });
    }catch(_){return failure('账号配置保存未完成，请保留输入并重试');}
  }
  function save(input,options={}) { return transact(input,options,false); }
  function setStatus(configId,status,options={}) { return transact({status},{...options,configId},true); }
  window.AliCtiAccounts={list,find,history,captureContext:()=>clone(currentContext()),getRevision:()=>revision,storageError:()=>lastError,usage,save,setStatus,restore};
  // Stable seed identities remain usable for read-only review even if persisted data is corrupt.
  data.instances.splice(0,data.instances.length,...seeds.map(materialize));
  restore();
  window.addEventListener('storage',event=>{
    if(event.key!==key && event.key!==null || event.storageArea && event.storageArea!==localStorage)return;
    const before=data.instances.map(projected),oldRaw=lastRaw;
    if(!restore()||lastRaw===oldRaw)return;
    for(const row of data.instances){const previous=before.find(r=>r.configId===row.configId);if(!previous||JSON.stringify(previous)!==JSON.stringify(projected(row)))notify({configId:row.configId,enterpriseId:row.enterpriseId,previousEnterpriseId:previous?.enterpriseId || '',action:'storage'});}
  });
})();
