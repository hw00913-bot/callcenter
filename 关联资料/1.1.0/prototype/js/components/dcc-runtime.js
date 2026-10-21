/** 本版 DCC 合成模型：管理权限与租户业务身份分离。 */
(function () {
  'use strict';
  const STORAGE_KEY = 'dcc-runtime-v1.1.0';
  const clone = value => JSON.parse(JSON.stringify(value));
  const fixtures = clone(window.DccMock?.applications || []);
  const businessTenants = () => (window.CloudCallData?.tenants || []).filter(row => row.builtIn !== true);
  const tenants = () => businessTenants().filter(row => row.status === '启用');
  const text = value => typeof value === 'string' ? value.trim() : '';
  function validCallbackUrl(value) {
    if(typeof value!=='string'||!/^https?:\/\//i.test(value)||/[\u0000-\u0020\u007f]/.test(value))return false;
    try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!!url.hostname&&!url.username&&!url.password;}catch(_){return false;}
  }
  const failure = (code, reason) => ({ ok: false, code, reason, data: null });
  const success = data => ({ ok: true, reason: '', data: clone(data) });
  const isReadOnlyProjection = () => window.HistorySnapshot?.read_only === true;
  const readOnlyFailure = () => failure('READ_ONLY_PROJECTION', '当前历史演示只读，不能保存、接收合成数据、发放身份或补送。');
  let state = { schemaVersion: '1.1.0', revision: 0, applications: fixtures };
  let identitySequence = 0;
  const issuedIdentities = new Map();
  let applicationBytes = null, applicationPersisted = false;

  // 停用只限制使用，不删除原授权；坏记录不能回退到示例后覆盖正式保存的演示配置。
  function refreshApplications() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        if (applicationPersisted) throw Error('Application configuration removed');
        applicationBytes = null;
        return success(null);
      }
      const saved = JSON.parse(raw);
      if (saved?.schemaVersion !== '1.1.0' || !Array.isArray(saved.applications) || saved.revision !== undefined && (!Number.isSafeInteger(saved.revision) || saved.revision < 0)) throw Error('Invalid application configuration');
      const revision = saved.revision ?? 0;
      if (applicationPersisted && (revision < state.revision || revision === state.revision && raw !== applicationBytes)) throw Error('Application configuration version conflict');
      const allowed = new Set(businessTenants().map(row => row.tenantId)), seen = new Set(), names = new Set();
      const normalized = saved.applications.map(row => {
        const base = fixtures.find(item => item.applicationId === row?.applicationId);
        if (!row || !text(row.applicationId).startsWith('DEMO-DCC-APP-') || text(row.applicationId)!==row.applicationId || seen.has(row.applicationId) || !Array.isArray(row.authorizedTenantIds) || !row.authorizedTenantIds.length || !row.authorizedTenantIds.every(id => allowed.has(id))) throw Error('Invalid synthetic application');
        seen.add(row.applicationId);
        const name=Object.hasOwn(row,'name')?text(row.name):base?.name||row.applicationId;
        if(!name||name.length>60||names.has(name))throw Error('Invalid synthetic application name');
        names.add(name);
        const credential = base?.credentialPlaceholder || text(row.credentialPlaceholder);
        if (!credential.startsWith('MOCK-')) throw Error('Invalid synthetic credential');
        return {applicationId:row.applicationId,name,credentialPlaceholder:credential,authorizedTenantIds:[...new Set(row.authorizedTenantIds)],createdAt:text(row.createdAt)||base?.createdAt||'',savedAt:text(row.savedAt),callbackUrl:typeof row.callbackUrl==='string'?row.callbackUrl:'',sourceTrace:base?.sourceTrace||'本地新增应用'};
      });
      state = {schemaVersion:'1.1.0',revision,applications:normalized};
      applicationBytes = raw; applicationPersisted = true;
      return success(null);
    } catch (_) { return failure('APPLICATIONS_UNAVAILABLE', '应用配置暂时无法读取，已保存的资料不会被覆盖。请恢复原记录或刷新后重试。'); }
  }
  refreshApplications();
  function canManageApplications() {
    return window.AppState?.isReady?.() === true && window.AppState?.isSuper?.() === true && window.AppState?.canAction?.('application.manage') === true;
  }
  function snapshot() {
    if (!canManageApplications()) return failure('FORBIDDEN', '仅超级管理员可读取应用配置。');
    const fresh = refreshApplications(); if (!fresh.ok) return fresh;
    return success(state);
  }
  function listApplications() {
    if (!canManageApplications()) return failure('FORBIDDEN', '仅超级管理员可访问应用接入。');
    const fresh = refreshApplications(); if (!fresh.ok) return fresh;
    return {...success(state.applications),revision:state.revision};
  }
  function applicationValues(input, current) {
    const name=text(input?.name ?? current?.name);
    if(!name||name.length>60)return failure('INVALID_NAME','请填写60字以内的应用名称。');
    if(state.applications.some(row=>row.applicationId!==current?.applicationId&&row.name===name))return failure('DUPLICATE_NAME','应用名称已存在。');
    const raw=input?.authorizedTenantIds ?? current?.authorizedTenantIds,allowed=new Set(tenants().map(row=>row.tenantId));
    for(const id of current?.authorizedTenantIds || [])if(businessTenants().some(row=>row.tenantId===id))allowed.add(id);
    if(!Array.isArray(raw))return failure('INVALID_TENANT','请选择授权租户。');
    const ids=[...new Set(raw.map(text))];
    if(!ids.length||ids.some(id=>!allowed.has(id)))return failure('INVALID_TENANT','至少选择一个有效业务租户。');
    const rawCallback=Object.hasOwn(input||{},'callbackUrl')?input.callbackUrl:current?.callbackUrl??'';
    if(typeof rawCallback!=='string')return failure('INVALID_CALLBACK_URL','请填写完整的 http:// 或 https:// 回调地址。');
    const callbackUrl=rawCallback.trim();
    if(callbackUrl&&!validCallbackUrl(callbackUrl))return failure('INVALID_CALLBACK_URL','请填写完整的 http:// 或 https:// 回调地址，不要包含账号或密码。');
    return success({name,authorizedTenantIds:ids,callbackUrl});
  }
  function saveApplications(next, result) {
    next.revision++;
    try {
      if(localStorage.getItem(STORAGE_KEY)!==applicationBytes)return failure('APPLICATION_CONFLICT','应用配置已在其他窗口修改，请重新打开后保存。');
      const bytes=JSON.stringify(next);localStorage.setItem(STORAGE_KEY,bytes);
      state=next;applicationBytes=bytes;applicationPersisted=true;
    } catch(_){return failure('STORAGE_FAILURE','保存失败，请检查本地存储后重试。');}
    return success(result);
  }
  function applicationWriteGuard(input) {
    const fresh=refreshApplications();if(!fresh.ok)return fresh;
    if(Object.hasOwn(input||{},'expectedRevision')&&input.expectedRevision!==state.revision)return failure('APPLICATION_CONFLICT','应用配置已在其他窗口修改，填写内容已保留，请重新打开后保存。');
    return success(null);
  }
  let applicationSequence=0;
  const uniqueDemoId=()=>typeof window.crypto?.randomUUID==='function'?window.crypto.randomUUID():Date.now().toString(36)+'-'+(++applicationSequence);
  function createApplication(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    if(!canManageApplications())return failure('FORBIDDEN','仅超级管理员可新增应用。');
    const fresh=applicationWriteGuard(input);if(!fresh.ok)return fresh;
    const checked=applicationValues(input);if(!checked.ok)return checked;
    const now=new Date().toISOString(),row={applicationId:'DEMO-DCC-APP-'+uniqueDemoId(),credentialPlaceholder:'MOCK-SECRET-'+uniqueDemoId(),...checked.data,createdAt:now,savedAt:now,sourceTrace:'本地新增应用'};
    const next=clone(state);next.applications.push(row);return saveApplications(next,row);
  }
  function saveApplication(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    if(!canManageApplications())return failure('FORBIDDEN','仅超级管理员可修改应用。');
    const fresh=applicationWriteGuard(input);if(!fresh.ok)return fresh;
    const index=state.applications.findIndex(row=>row.applicationId===text(input?.applicationId));
    if(index<0)return failure('UNKNOWN_APPLICATION','应用不存在或已删除。');
    const checked=applicationValues(input,state.applications[index]);if(!checked.ok)return checked;
    const next=clone(state);Object.assign(next.applications[index],checked.data,{savedAt:new Date().toISOString()});
    return saveApplications(next,next.applications[index]);
  }
  function deleteApplication(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    if(!canManageApplications())return failure('FORBIDDEN','仅超级管理员可删除应用。');
    const fresh=applicationWriteGuard(input);if(!fresh.ok)return fresh;
    const id=text(input?.applicationId),row=state.applications.find(item=>item.applicationId===id);
    if(!row)return failure('UNKNOWN_APPLICATION','应用不存在或已删除。');
    const next=clone(state);next.applications=next.applications.filter(item=>item.applicationId!==id);
    const saved=saveApplications(next,{applicationId:id,deleted:true});
    if(saved.ok)for(const [key,identity] of issuedIdentities)if(identity.sourceApplicationId===id)issuedIdentities.delete(key);
    return saved;
  }
  function exchangeTenantIdentity(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    const fresh=refreshApplications();if(!fresh.ok)return fresh;
    const application = state.applications.find(row => row.applicationId === text(input?.applicationId));
    if (!application) return failure('UNKNOWN_APPLICATION', '虚构应用不存在，身份交换被拒绝。');
    if (input?.credentialPlaceholder !== application.credentialPlaceholder) return failure('INVALID_CREDENTIAL', '不可用凭证占位不匹配，身份交换被拒绝。');
    const tenantId = text(input?.tenantId);
    if (!tenants().some(row => row.tenantId === tenantId)) return failure('INVALID_TENANT', '指定业务租户不存在或不可用，身份交换被拒绝。');
    if (!application.authorizedTenantIds.includes(tenantId)) return failure('UNAUTHORIZED_TENANT', '该应用未授权此租户，身份交换被拒绝；配置未改变。');
    const identity = {
      identityId: 'demo-tenant-identity-' + (++identitySequence),
      kind: 'SYNTHETIC_TENANT_IDENTITY', simulated: true, usableToken: false,
      tenantId, taskOwnerTenantId: tenantId, sourceApplicationId: application.applicationId,
      scope: 'tenant-business', managementAuthority: false,
      sourceTrace: application.sourceTrace
    };
    issuedIdentities.set(identity.identityId, clone(identity));
    // 不调用 AppState 登录、租户切换或权限方法；业务身份只在合成模型内使用。
    return success(identity);
  }
  function resolveTenantIdentity(identity) {
    const fresh=refreshApplications();if(!fresh.ok)return fresh;
    const issued = issuedIdentities.get(text(identity?.identityId));
    if (!issued || identity.tenantId !== issued.tenantId || identity.sourceApplicationId !== issued.sourceApplicationId) return failure('INVALID_IDENTITY', '合成租户身份无效，请重新演示身份交换。');
    const application = state.applications.find(row => row.applicationId === issued.sourceApplicationId);
    if (!application?.authorizedTenantIds.includes(issued.tenantId) || !tenants().some(row => row.tenantId === issued.tenantId)) return failure('UNAUTHORIZED_TENANT', '应用租户授权已变化，请重新演示身份交换。');
    return success(issued);
  }
  const LEDGER_KEY = 'dcc-task-ledger-v1.1.0';
  let ledger = { schemaVersion: '1.1.0', sequence: 0, tasks: {} };
  let ledgerBytes = null,ledgerValidated=false;
  try {
    ledgerBytes=localStorage.getItem(LEDGER_KEY);const saved = JSON.parse(ledgerBytes || 'null');
    if (saved?.schemaVersion === '1.1.0' && Number.isSafeInteger(saved.sequence) && saved.sequence >= 0 && saved.tasks && typeof saved.tasks === 'object' && !Array.isArray(saved.tasks)) {ledger = saved;ledgerValidated=true;}
  } catch (_) { /* 合成账本损坏不推定业务成功。 */ }
  const taskCatalog = () => [...(window.CloudCallData?.tasks || []), ...(window.CloudCallData?.predictiveTasks || []), ...(window.CloudCallData?.ivrTasks || [])];
  const localId = task => typeof task === 'string' ? task : text(task?.taskId);
  const canonicalTask = id => taskCatalog().find(row => row.taskId === id);
  const sourceValid = source => ['api', 'manual'].includes(source);
  function isManagedTask(task) {
    const id = localId(task);
    return !!(id && (ledger.tasks[id] || taskCatalog().some(row => row.taskId === id && row.dccManaged === true))) || task?.dccManaged === true;
  }
  function guardLegacyWrite(task) {
    return isManagedTask(task) ? failure('LOCKED_SOURCE', '该任务已锁定本版导入来源，请从任务导入记录操作；旧名单、分配及平台再次联系不能写入。') : success(null);
  }
  function guardTaskUpdate(row) {
    const current = canonicalTask(localId(row)), registered = ledger.tasks[localId(row)]?.task;
    if (!current && !registered) return success(null);
    if (!isManagedTask(current) && !registered) return row?.dccManaged === true ? failure('LEGACY_TASK', '旧任务未声明本版来源，不能自动迁移。') : success(null);
    const expected = registered || current;
    if (row?.dccManaged !== true || row?.dccSourceLocked !== true || row?.dccImportSource !== (expected.dccImportSource || expected.source) || row?.dccSupplierTaskId !== (expected.dccSupplierTaskId || expected.supplierTaskId) || row?.tenantId !== expected.tenantId || row?.enterpriseId !== expected.enterpriseId) return failure('LOCKED_SOURCE', '任务租户、供应商标识及创建时锁定的导入来源不能改变。');
    return success(null);
  }
  function canAccessTask(task, writing = false) {
    const app = window.AppState;
    return !!task && app?.isReady?.() === true && app?.effectiveAccess?.().valid === true && app?.canMenu?.('cloud.tasks') === true && app?.authorizeObject?.(writing ? 'task.create' : '', task) === true && (!writing || !isReadOnlyProjection()&&app?.canAction?.('task.create') === true);
  }
  function writeLedger(next) {
    try {if(localStorage.getItem(LEDGER_KEY)!==ledgerBytes)return false;next._localRevision=(Number.isSafeInteger(ledger._localRevision)?ledger._localRevision:0)+1;const bytes=JSON.stringify(next);localStorage.setItem(LEDGER_KEY, bytes);ledger=next;ledgerBytes=bytes;ledgerValidated=true;return true;}
    catch (_) { return false; }
  }
  function lockedTask(id) {
    const refreshed=refreshBusinessLedger();if(!refreshed.ok)return refreshed;
    const current = canonicalTask(id), entry = ledger.tasks[id];
    if (!current || current.status === '已删除') return failure('UNKNOWN_TASK', '任务不存在或已经删除。');
    if (current.dccManaged !== true || current.dccSourceLocked !== true || !sourceValid(current.dccImportSource)) return failure('LEGACY_TASK', '该任务没有本版锁定来源，不自动迁移旧任务。');
    if (!entry) return failure('UNREGISTERED_TASK', '本版任务记录尚未初始化，请重新打开任务记录。');
    if(typeof entry!=='object'||Array.isArray(entry)||entry.task?.taskId!==id||!['records','localFailures','submissions'].every(key=>Array.isArray(entry[key])))return failure('LEDGER_UNAVAILABLE','当前任务的客户或提交记录结构不完整，请保留原始资料后核对。');
    const guard = guardTaskUpdate(current);
    if (!guard.ok) return guard;
    return { ok: true, reason: '', data: { current, entry } };
  }
  function registerTask(task, options = {}) {
    const fresh=refreshBusinessLedger();if(!fresh.ok)return fresh;
    const current = canonicalTask(localId(task));
    if (!canAccessTask(current, true)) return failure('FORBIDDEN', '当前身份不能初始化该租户任务。');
    if (current.dccManaged !== true || current.dccSourceLocked !== true || !sourceValid(current.dccImportSource)) return failure('LEGACY_TASK', '只能初始化创建时已锁定来源的新任务，旧任务不迁移。');
    if (options.source && options.source !== current.dccImportSource || options.supplierTaskId && options.supplierTaskId !== current.dccSupplierTaskId) return failure('LOCKED_SOURCE', '注册不能改写创建时锁定的来源或供应商标识。');
    if (!text(current.dccSupplierTaskId)) return failure('MISSING_TASK_ID', '缺少合成供应商任务标识。');
    if (Object.hasOwn(ledger.tasks,current.taskId)) {
      const checked=lockedTask(current.taskId);return checked.ok?success(checked.data.entry.task):checked;
    }
    if (Object.values(ledger.tasks).some(entry => entry.task.tenantId === current.tenantId && entry.task.supplierTaskId === current.dccSupplierTaskId)) return failure('TASK_CONFLICT', '该租户的供应商任务标识存在歧义，请核对。');
    const next = clone(ledger);
    const scope = { taskId: current.taskId, tenantId: current.tenantId, enterpriseId: current.enterpriseId, supplierTaskId: current.dccSupplierTaskId, source: current.dccImportSource, sourceLocked: true, simulated: true };
    next.tasks[current.taskId] = { task: scope, records: [], localFailures: [], submissions: [], failureEvents: [], failureDetails: [], failureGroups: [], deliveries: [], exportSnapshots: [] };
    if (!writeLedger(next)) return failure('STORAGE_FAILURE', '任务记录未保存，请保留当前任务后重试。');
    return success(scope);
  }
  function taskRecords(taskId) {
    const found = lockedTask(taskId);
    if (!found.ok) return found;
    if (!canAccessTask(found.data.current)) return failure('FORBIDDEN', '当前身份不能查看该租户任务记录。');
    return success(found.data.entry);
  }
  function directoryTaskCatalog() {
    const byId=new Map(taskCatalog().map(row=>[row.taskId,row])), durable=new Map(), independent=new Map();
    const sameIdentity=(a,b)=>['taskId','tenantId','enterpriseId'].every(key=>a?.[key]===b?.[key])&&(!a.callType||!b.callType||a.callType===b.callType);
    const revision=row=>Number.isSafeInteger(row?._localTaskRevision)&&row._localTaskRevision>=0?row._localTaskRevision:0;
    function merge(row,target=durable,strictRevision=false) {
      if(!row||!text(row.taskId)||!text(row.tenantId)||!text(row.enterpriseId)||!['预外呼','IVR 外呼'].includes(row.callType))throw Error('Invalid task record');
      const previous=target.get(row.taskId);
      if(previous&&!sameIdentity(previous,row))throw Error('Task identity conflict');
      if(previous&&revision(previous)===revision(row)&&strictRevision&&stable(previous)!==stable(row))throw Error('Task revision conflict');
      if(!previous||revision(row)>=revision(previous))target.set(row.taskId,row);
    }
    const raw=localStorage.getItem('cloud-task-created-v1');
    if(raw!==null){const rows=JSON.parse(raw);if(!Array.isArray(rows)||new Set(rows.map(row=>row?.taskId)).size!==rows.length)throw Error('Invalid task index');rows.forEach(row=>merge(row));}
    if(typeof localStorage.key==='function'&&typeof localStorage.length==='number')for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(key?.startsWith('cloud-task-record-v1:'))merge(JSON.parse(localStorage.getItem(key)),independent,true);
    }
    // Independent rows are authoritative; the whole-array index is a compatibility mirror.
    for(const [id,row] of independent){
      const indexed=durable.get(id);if(indexed&&!sameIdentity(indexed,row))throw Error('Task identity conflict');
      durable.set(id,row);
    }
    for(const [id,row] of durable){
      const live=byId.get(id);if(live&&!sameIdentity(live,row))throw Error('Live task identity conflict');
      if(!live||row.status==='已删除'||revision(row)>=revision(live))byId.set(id,row);
    }
    const journal=JSON.parse(localStorage.getItem('cloud-task-creation-transaction-v1')||'null');
    if(journal&&journal.committed!==true&&text(journal.taskId))byId.delete(journal.taskId);
    return byId;
  }
  // Customer archive reads a fresh, scoped projection. It never rewrites the import journal.
  function directoryView() {
    const app=window.AppState, access=app?.effectiveAccess?.();
    if(app?.isReady?.()!==true||access?.valid!==true||app.get().activeDomain!=='CLOUD_CONTACT_CENTER'||app.canMenu?.('cloud.tasks')!==true)return failure('FORBIDDEN','当前范围不能查看客户档案。');
    const fresh=refreshBusinessLedger();if(!fresh.ok)return failure('ARCHIVE_STORAGE_UNAVAILABLE','新版客户导入记录暂时无法读取，原始记录未改动，请刷新后重试。');const saved=ledger;
    let archiveTasks;
    try{archiveTasks=directoryTaskCatalog();}catch(_){return failure('ARCHIVE_TASKS_UNAVAILABLE','已保存任务资料暂时无法核对，原始任务和客户记录未改动，请刷新后重试。');}
    const accountId=app.get().accountId,operator=access.roleCode==='OPERATOR',records=[],results=[];
    let incomplete=false;
    const sameScope=(row,scope)=>row?.tenantId===scope.tenantId&&row?.enterpriseId===scope.enterpriseId;
    const seats=(window.CloudCallData?.agents||[]).filter(row=>row.lifecycleStatus!=='已删除');
    function ownsSeat(selector,field,scope) {
      if(!text(selector))return false;
      const matches=seats.filter(row=>sameScope(row,scope)&&String(row[field])===String(selector));
      return matches.length===1&&matches[0].accountId===accountId;
    }
    function ownsResult(row,scope) {
      const value=row.values||{};
      return row.kind==='call'&&value.evidenceTrusted===true&&(ownsSeat(value.cno,'cno',scope)||ownsSeat(value.agentIdentityId||value.contactCenterIdentityId,'contactCenterIdentityId',scope));
    }
    for(const [taskId,entry] of Object.entries(saved.tasks)) {
      const current=archiveTasks.get(taskId),scope=entry?.task;
      if(!current||current.status==='已删除'||!canAccessTask(current))continue;
      if(!scope||scope.taskId!==taskId||!sameScope(current,scope)||scope.supplierTaskId!==current.dccSupplierTaskId||scope.source!==current.dccImportSource||scope.sourceLocked!==true||current.dccManaged!==true||current.dccSourceLocked!==true||!sourceValid(scope.source)||!Array.isArray(entry.records)){incomplete=true;continue;}
      const recordIds=new Map();
      for(const row of entry.records)if(text(row?.recordId))recordIds.set(row.recordId,(recordIds.get(row.recordId)||0)+1);
      const exactRecords=entry.records.filter(row=>row&&recordIds.get(row.recordId)===1&&text(row.batchId)&&text(row.phone)&&row.taskId===taskId&&row.tenantId===scope.tenantId&&(!Object.hasOwn(row,'enterpriseId')||row.enterpriseId===scope.enterpriseId)&&(!Object.hasOwn(row,'supplierTaskId')||row.supplierTaskId===scope.supplierTaskId)).map(row=>({...row,enterpriseId:scope.enterpriseId}));
      if(exactRecords.length!==entry.records.length)incomplete=true;
      const rawResults=Array.isArray(entry.actualResults)?entry.actualResults:[], resultIds=new Map(),callIds=new Map();
      for(const row of rawResults){if(text(row?.resultId))resultIds.set(row.resultId,(resultIds.get(row.resultId)||0)+1);if(row?.kind==='call'&&text(row.callID))callIds.set(row.callID,(callIds.get(row.callID)||0)+1);}
      if(rawResults.some(row=>!row||resultIds.get(row.resultId)!==1||row.kind==='call'&&callIds.get(row.callID)!==1))incomplete=true;
      const exactResults=rawResults.filter(row=>{
        const record=exactRecords.find(item=>item.recordId===row?.recordId);
        const enterpriseMatches=Object.hasOwn(row||{},'enterpriseId')?row.enterpriseId===scope.enterpriseId:String(row?.values?.enterpriseId)===String(scope.enterpriseId)&&String(row?.values?.taskId)===scope.supplierTaskId&&(!Object.hasOwn(row.values,'tenantId')||row.values.tenantId===scope.tenantId);
        return record&&resultIds.get(row.resultId)===1&&(row.kind!=='call'||callIds.get(row.callID)===1)&&row.associationState==='confirmed'&&row.taskId===taskId&&row.tenantId===scope.tenantId&&enterpriseMatches&&(!Object.hasOwn(row,'supplierTaskId')||row.supplierTaskId===scope.supplierTaskId)&&row.batchId===record.batchId&&row.phone===record.phone&&row.leadCode===record.leadCode&&text(row.resultId)&&((row.kind==='call'&&text(row.callID))||row.kind==='no_cdr_failure');
      }).map(row=>({...row,enterpriseId:scope.enterpriseId}));
      for(const record of exactRecords) {
        const rowResults=exactResults.filter(row=>row.recordId===record.recordId);
        const assigned=record.workbenchAssignment?.accountId===accountId||record.ownerId===accountId||record.accountId===accountId||ownsSeat(record.assignedAgentCno,'cno',scope);
        const visibleResults=operator?rowResults.filter(row=>assigned||ownsResult(row,scope)):rowResults;
        if(operator&&!assigned&&!visibleResults.length)continue;
        const application=state.applications.find(row=>row.applicationId===record.sourceApplicationId);
        records.push({...clone(record),taskName:current.name||current.taskName||taskId,sourceApplicationName:application?.name||'',archiveTaskId:taskId});
        results.push(...visibleResults.map(clone));
      }
    }
    return success({records,results,incomplete,readOnly:true,simulated:true});
  }
  function directoryRecord(taskId,recordId) {
    const view=directoryView();if(!view.ok)return view;
    const record=view.data.records.find(row=>row.archiveTaskId===taskId&&row.recordId===recordId);
    return record?success({record,results:view.data.results.filter(row=>row.taskId===taskId&&row.recordId===recordId)}):failure('FORBIDDEN','该客户记录已不在当前档案授权范围内。');
  }
  function directoryResult(taskId,resultId) {
    const view=directoryView();if(!view.ok)return view;
    const result=view.data.results.find(row=>row.taskId===taskId&&row.resultId===resultId&&row.kind==='call');
    return result?success({actualResults:[result]}):failure('FORBIDDEN','该通话已不在当前档案授权范围内。');
  }
  const pendingFor = entry => entry.records.filter(row => row.submissionState === 'pending' && !row.reviewReason && (!row.creationTransactionId || entry.creationImports?.[row.creationTransactionId]?.state === 'committed')).sort((a, b) => b.priority - a.priority || a.localReceivedSequence - b.localReceivedSequence);
  function pendingOrder(taskId) {
    const found = lockedTask(taskId);
    if (!found.ok) return found;
    if (!canAccessTask(found.data.current)) return failure('FORBIDDEN', '当前身份不能查看该租户待提交顺序。');
    return success(pendingFor(found.data.entry));
  }
  function applyResponse(entry, record, response) {
    const raw = response == null ? null : clone(response), previous = record.syncResponses?.at(-1)?.raw;
    if (record.syncResponses?.length && JSON.stringify(previous) === JSON.stringify(raw)) return { duplicate: true };
    record.syncResponses = [...(record.syncResponses || []), { source: '合成 API-002 同步响应', receivedAt: new Date().toISOString(), raw }];
    const data = raw?.data;
    record.syncCounts = { importTotal: data?.importTotal ?? null, successTotal: data?.successTotal ?? null, invalidTotal: data?.invalidTotal ?? null, result: raw?.result ?? null, source: '合成 API-002 同步响应' };
    const markReview = reason => { record.importState = 'unknown'; record.reviewReason = reason; return { pendingReview: true }; };
    const historical=record.syncResponses.slice(0,-1).map(item=>item.raw);
    const previousSuccess=historical.some(item=>item?.result===0&&item.data?.taskId===entry.task.supplierTaskId&&item.data?.fileId===record.supplierFileId&&item.data?.importTotal===1&&item.data?.successTotal===1&&item.data?.invalidTotal===0);
    const previousRejection=historical.some(item=>typeof item?.result==='number'&&Number.isFinite(item.result)&&item.result!==0||item?.result===0&&item.data?.taskId===entry.task.supplierTaskId&&item.data?.fileId===record.supplierFileId&&item.data?.importTotal===1&&item.data?.successTotal===0&&item.data?.invalidTotal===1);
    if (!raw || raw.syntheticUnknown === true) return markReview('提交响应未知或超时；不能当作拒绝或重新提交。');
    if (raw.result !== 0) {
      if (typeof raw.result === 'number' && Number.isFinite(raw.result)) {
        if(previousSuccess)return markReview('准确同步成功与后到供应商拒绝冲突，保留各来源待核。');
        record.importState = 'rejected'; record.importReason = text(raw.description) || text(raw.message) || '供应商明确拒绝（合成）'; record.reviewReason = ''; return { rejected: true };
      }
      return markReview('响应 result 未明确，保留原始证据待核。');
    }
    if (!data || data.taskId !== entry.task.supplierTaskId || !text(data.fileId)) return markReview('同步任务或 fileId 无法准确关联当前单号批次。');
    if (record.supplierFileId && record.supplierFileId !== data.fileId) return markReview('同一批次收到矛盾 fileId，不能覆盖原关联。');
    record.supplierFileId = data.fileId;
    const values = [data.importTotal, data.successTotal, data.invalidTotal];
    if (values.some(value => !Number.isSafeInteger(value) || value < 0) || data.importTotal !== 1 || data.successTotal + data.invalidTotal > 1) return markReview('同步数量不符合当前单号请求，汇总或矛盾结果不能盲配成功行。');
    if (previous?.data && [previous.data.importTotal, previous.data.successTotal, previous.data.invalidTotal].every(value => Number.isSafeInteger(value)) && previous.result === 0 && previous.data.importTotal === 1 && previous.data.successTotal + previous.data.invalidTotal === 1 && (previous.data.successTotal !== data.successTotal || previous.data.invalidTotal !== data.invalidTotal)) return markReview('同一批次同步成功/失败声明冲突，保留历史响应待核。');
    if (data.successTotal === 1 && data.invalidTotal === 0) {
      if(previousRejection||record.importFailureEvidence?.length)return markReview('同步成功与已保留的导入失败证据冲突，保留各来源待核。');
      record.importState = 'accepted'; record.importReason = ''; record.reviewReason = ''; return { accepted: true };
    }
    if (data.invalidTotal === 1 && data.successTotal === 0) {
      if(previousSuccess)return markReview('同一批次同步成功/失败证据冲突，保留历史待核。');
      record.importState = 'rejected'; record.importReason = text(raw.description) || text(raw.message) || '同步明确非法号码（合成）'; record.reviewReason = ''; return { rejected: true };
    }
    return markReview('仅有请求汇总，尚未准确声明此号码的导入结果。');
  }
  function syntheticResponse(entry, record) {
    const scenario = window.DccMock?.importScenarios?.[record.scenarioId], outcome = scenario?.outcomes?.[record.leadCode] || 'accepted';
    if (outcome === 'unknown') return { syntheticUnknown: true };
    if (outcome === 'rejected') return { result: 1, message: '供应商明确拒绝此单号导入（合成）' };
    return { result: 0, data: { taskId: entry.task.supplierTaskId, fileId: 'DEMO-FILE-' + record.batchId, importTotal: outcome === 'conflict' ? 3 : 1, successTotal: outcome === 'conflict' ? 2 : outcome === 'aggregate' ? 0 : 1, invalidTotal: outcome === 'conflict' ? 1 : 0 } };
  }
  function dispatchPending(taskId) {
    if(isReadOnlyProjection())return readOnlyFailure();
    const found = lockedTask(taskId); if (!found.ok) return found;
    if(['已终止','已完成','已结束','已删除'].includes(found.data.current.status)||String(found.data.current.providerStatusCode)==='3')return failure('TASK_ENDED','任务已结束，保留已保存客户，不再提交号码。');
    const next = clone(ledger), entry = next.tasks[taskId], ordered = pendingFor(entry), submitted = [];
    for (const record of ordered) {
      const submittedAt = new Date().toISOString();
      record.submissionState = 'submitted'; record.submittedAt = submittedAt;
      const submission = { submissionId: 'DEMO-SUBMIT-' + (++next.sequence), recordId: record.recordId, batchId: record.batchId, submittedAt, request: { taskId: entry.task.supplierTaskId, taskTelList: [{ tel: record.phone, priority: record.priority }] }, simulated: true };
      entry.submissions.push(submission); submitted.push(submission);
      const raw=syntheticResponse(entry, record);
      applyResponse(entry, record, raw);captureImportFailure(next,entry,record,raw);
    }
    if (ordered.length && !writeLedger(next)) return failure('STORAGE_FAILURE', '合成提交结果未保存，未改变已保存账本。');
    if (ordered.length && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') window.dispatchEvent(new CustomEvent('dcc:records-changed', { detail: { taskId } }));
    return success(submitted);
  }
  function submitPending(taskId) {
    const found = lockedTask(taskId); if (!found.ok) return found;
    if (!canAccessTask(found.data.current, true)) return failure('FORBIDDEN', '当前身份不能操作该租户提交队列。');
    return dispatchPending(taskId);
  }
  function applyImportResponse(input) {
    const found = lockedTask(text(input?.taskId)); if (!found.ok) return found;
    if (!canAccessTask(found.data.current, true)) return failure('FORBIDDEN', '当前身份不能演示该租户同步响应。');
    const next = clone(ledger), entry = next.tasks[input.taskId], record = entry.records.find(row => row.batchId === input.batchId);
    if (!record || record.submissionState !== 'submitted') return failure('UNKNOWN_BATCH', '该批次不存在或尚未提交。');
    const outcome = applyResponse(entry, record, input.response);
    if(!outcome.duplicate)captureImportFailure(next,entry,record,input.response,input.deliveryOutcome==='succeeded'?'succeeded':'failed');
    if (!outcome.duplicate && !writeLedger(next)) return failure('STORAGE_FAILURE', '同步响应证据未保存。');
    return success({ ...outcome, record });
  }
  const businessAssociation = record => ({...Object.fromEntries(['sourceApplicationId','businessBatchNo','callMode'].filter(key=>Object.hasOwn(record||{},key)).map(key=>[key,record[key]])),...(text(record?.requestId) ? {requestId:record.requestId,rowId:record.rowId,rootBatchId:record.rootBatchId} : {}),...(text(record?.businessType) ? {businessType:record.businessType,businessTypeLabel:record.businessTypeLabel||''} : {})});
  function importRows(entryId, rows, {sourceApplicationId='',scenarioId='',uniformPriority,requestId='',requestContent,businessType='',businessTypeLabel='',businessBatchNo='',callMode='predictive',callbackUrlSnapshot='',creationTransactionId='',deferDispatch=false}={}) {
    if(isReadOnlyProjection())return readOnlyFailure();
    if(!Array.isArray(rows)||!rows.length)return failure('INVALID_ROWS','请提供逐行线索。');
    const found=lockedTask(entryId);if(!found.ok)return found;
    const next=clone(ledger),entry=next.tasks[entryId],results=[],api=entry.task.source==='api';
    const creationContent=creationTransactionId?stable({rows,uniformPriority}):'';
    const existingCreation=creationTransactionId&&entry.creationImports?.[creationTransactionId];
    if(existingCreation&&existingCreation.state!=='rolled_back')return existingCreation.content===creationContent?success({...existingCreation.receipt,replayed:true}):failure('CREATION_IMPORT_CONFLICT','本次创建导入已撤销或名单内容变化，请重新确认。');
    const previousFailures=new Set(entry.localFailures.map(row=>row.failureId)),importTransactionId='DEMO-IMPORT-'+uniqueDemoId();
    for(let index=0;index<rows.length;index++){
      const rawRow=rows[index],row=rawRow&&typeof rawRow==='object'&&!Array.isArray(rawRow)?rawRow:{},leadCode=text(row.leadCode),phone=text(row.phone??row.tel),rowId=text(row.rowId)||String(index+1);
      const priorityRaw=row.priority===undefined?uniformPriority:row.priority;
      const priority=!['number','string'].includes(typeof priorityRaw)||typeof priorityRaw==='string'&&!priorityRaw.trim()?NaN:Number(priorityRaw);
      const isNewBatch=row.isNewBatch===true,matching=entry.records.filter(previous=>previous.leadCode===leadCode);
      const mains=matching.filter(previous=>previous.rootBatchId===previous.batchId&&previous.batchKind==='main').sort((a,b)=>a.localReceivedSequence-b.localReceivedSequence);
      const roots=new Set(mains.map(item=>item.batchId));
      let reason=!leadCode?'缺少必填线索编码':!phone?'缺少手机号':!/^(1[3-9]\d{9}|0\d{9,11})$/.test(phone)?'请输入完整的手机号或带区号的固定电话':!Number.isFinite(priority)?'请填写有效优先级':'';
      if(!reason&&window.CustomerBusiness?.importedFields?.some(field=>row[field.key]!=null&&typeof row[field.key]!=='string'))reason='意向门店、意向车系、Smartcode 和留资时间请使用文本填写';
      if(!reason&&api&&Object.hasOwn(row,'isNewBatch')&&typeof row.isNewBatch!=='boolean')reason='isNewBatch 必须为布尔值';
      if(!reason&&api&&matching.some(previous=>previous.phone!==phone))reason='同一线索的手机号不一致，请核对';
      if(!reason&&api&&entry.records.some(previous=>previous.phone===phone&&previous.leadCode!==leadCode))reason='同一手机号关联多个线索尚未确认，请核对';
      if(!reason&&api&&matching.some(previous=>previous.lineageState!=='confirmed'||!roots.has(previous.rootBatchId)))reason='历史主批次关联不明确，请核对后再导入';
      if(reason){
        const failureId='DEMO-LOCAL-FAIL-'+(++next.sequence),scope={...(api?{requestId,rowId}:{}),tenantId:entry.task.tenantId,supplierTaskId:entry.task.supplierTaskId,leadCode,phone};
        entry.localFailures.push({failureId,stage:'local_validation',row:clone(row),reason,createdAt:new Date().toISOString(),sourceApplicationId,...scope});
        addFailure(next,entry,{failureId,dedupKey:'local_validation:'+failureId,stage:'local_validation',leadCode,phone,reason,originalData:row,source:'本地逐行校验',raw:row});
        results.push({ok:false,failureId,localState:'rejected',reason,...scope});continue;
      }
      const receivedAt=new Date().toISOString(),sequence=++next.sequence,batchId='DEMO-BATCH-'+sequence;
      const main=api&&(isNewBatch||!mains.length),rootBatchId=main?batchId:mains.at(-1)?.batchId;
      const record={recordId:'DEMO-RECORD-'+sequence,batchId,tenantId:entry.task.tenantId,enterpriseId:entry.task.enterpriseId,taskId:entry.task.taskId,supplierTaskId:entry.task.supplierTaskId,
        leadCode,phone,...(Object.hasOwn(row,'R')&&row.R!==undefined?{R:clone(row.R)}:{}),priorityRaw:clone(priorityRaw),priority,initialPriority:priority,
        ...(api?{requestId,rowId,isNewBatch,rootBatchId,batchKind:main?'main':'child',businessType,businessTypeLabel,businessBatchNo,callMode,callbackUrlSnapshot}:Object.fromEntries(['name','note','externalDocumentId','businessType','importBatchName','sourceCustomerBatchId','sourceCustomerRowId'].filter(field=>Object.hasOwn(row,field)&&typeof row[field]==='string').map(field=>[field,row[field]]))),
        ...(window.CustomerBusiness?.importSnapshot(row)||{}),
        importTransactionId,newBatchCreatedAt:receivedAt,localReceivedSequence:sequence,originalImportedAt:receivedAt,originalImportDay:new Date(receivedAt).toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}),
        ...(creationTransactionId?{creationTransactionId}:{}),lineageState:'confirmed',sourceApplicationId,source:entry.task.source,localState:'saved',submissionState:'pending',importState:'pending',callState:'not_observed',syncCounts:null,syncResponses:[],supplierFileId:'',scenarioId,reviewReason:''};
      entry.records.push(record);
      results.push({ok:true,recordId:record.recordId,batchId,...businessAssociation(record),tenantId:record.tenantId,supplierTaskId:record.supplierTaskId,leadCode,phone,localState:'saved',importState:'pending',pendingReview:false});
    }
    const receipt={taskId:entryId,...(api?{requestId,businessType,businessBatchNo,callMode}:{}),rows:results,savedCount:results.filter(row=>row.ok).length,rejectedCount:results.filter(row=>!row.ok).length,simulated:true};
    if(api){if(!Array.isArray(next.requestReceipts))next.requestReceipts=[];next.requestReceipts.push({sourceApplicationId,tenantId:entry.task.tenantId,requestId,content:requestContent,result:clone(receipt)});}
    if(creationTransactionId){if(!entry.creationImports)entry.creationImports={};entry.creationImports[creationTransactionId]={transactionId:creationTransactionId,state:'prepared',content:creationContent,recordIds:results.filter(row=>row.ok).map(row=>row.recordId),failureIds:entry.localFailures.filter(row=>!previousFailures.has(row.failureId)).map(row=>row.failureId),receipt:clone(receipt)};}
    if(!writeLedger(next))return failure('STORAGE_FAILURE','导入未保存，请保留输入后重试。');
    if(!deferDispatch&&!creationTransactionId)Promise.resolve().then(()=>dispatchPending(entryId));
    return success(receipt);
  }
  function receiveDcc(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    const resolved=resolveTenantIdentity(input?.identity);if(!resolved.ok)return resolved;
    const currentLedger=refreshBusinessLedger();if(!currentLedger.ok)return currentLedger;
    const sourceApplication=state.applications.find(row=>row.applicationId===resolved.data.sourceApplicationId);
    const callMode=input?.callMode;
    if(!['predictive','manual'].includes(callMode))return failure('INVALID_CALL_MODE','请明确指定 predictive（预外呼）或 manual（人工外呼）。');
    const businessBatchNo=input?.businessBatchNo;
    if(typeof businessBatchNo!=='string'||!businessBatchNo.trim())return failure('MISSING_BUSINESS_BATCH','请提供业务系统的业务批次号。');
    if(callMode==='manual')return receiveManualApi(input,resolved.data,sourceApplication);
    if(!text(input?.taskId))return failure('MISSING_TASK_ID','预外呼导入必须指定任务 taskId。');
    const matches=Object.values(ledger.tasks).filter(entry=>entry.task.supplierTaskId===text(input?.taskId)&&entry.task.tenantId===resolved.data.tenantId);
    if(matches.length!==1)return failure('UNKNOWN_TASK','租户身份无法准确匹配指定任务。');
    const found=lockedTask(matches[0].task.taskId);if(!found.ok)return found;
    if(found.data.entry.task.source!=='api')return failure('LOCKED_SOURCE','该任务仅允许手工导入。');
    const requestId=text(input?.requestId);if(!requestId)return failure('MISSING_REQUEST_ID','DCC 导入必须提供 requestId。');
    if(!Array.isArray(input.rows)||!input.rows.length)return failure('INVALID_ROWS','请提供逐行线索。');
    if(Object.hasOwn(input,'tenantId')&&input.tenantId!==resolved.data.tenantId)return failure('TENANT_SCOPE_CONFLICT','请求租户与业务身份不一致。');
    const rowIds=input.rows.map((row,index)=>row&&typeof row==='object'&&Object.hasOwn(row,'rowId')?text(row.rowId):String(index+1));
    if(rowIds.some(id=>!id)||new Set(rowIds).size!==rowIds.length)return failure('INVALID_ROW_ID','请求内的行标识必须有效且唯一。');
    const normalizedRows=input.rows.map(row=>row&&typeof row==='object'&&!Array.isArray(row)?{...clone(row),isNewBatch:Object.hasOwn(row,'isNewBatch')?row.isNewBatch:false}:clone(row??null));
    const businessType=input.businessType;
    const content=stable({tenantId:resolved.data.tenantId,taskId:text(input.taskId),businessType,businessBatchNo,callMode,rows:normalizedRows});
    const prior=ledger.requestReceipts?.find(row=>row.sourceApplicationId===resolved.data.sourceApplicationId&&row.tenantId===resolved.data.tenantId&&row.requestId===requestId);
    if(prior)return prior.content===content?success({...prior.result,replayed:true}):failure('REQUEST_CONTENT_CONFLICT','同一 requestId 的内容已改变，请使用新的业务请求编号。');
    // A replay only returns the persisted receipt. Changed configuration must not turn it into a new import.
    if(ledger.requestReceipts?.some(row=>!row.sourceApplicationId&&row.tenantId===resolved.data.tenantId&&row.requestId===requestId))return failure('LEGACY_REQUEST_SCOPE_UNKNOWN','历史请求的来源应用未确认，请核对原回执，不会再次导入。');
    if(['已终止','已完成','已结束','已删除'].includes(found.data.current.status)||String(found.data.current.providerStatusCode)==='3')return failure('TASK_ENDED','任务已经结束，不能导入新的客户。');
    if(found.data.current.alictiTaskControlPending||found.data.current.alictiTaskUpdatePending)return failure('TASK_PENDING','任务状态待确认，暂不接收新客户。');
    if(!validCallbackUrl(sourceApplication?.callbackUrl))return failure('CALLBACK_NOT_CONFIGURED','请先为该接入应用配置有效回调地址，再导入客户。');
    const category=window.CustomerBusiness?.resolveImportType?.(businessType,{tenantId:resolved.data.tenantId,enterpriseId:found.data.entry.task.enterpriseId});
    if(!category?.ok)return failure(category?.code||'BUSINESS_CONFIG_UNAVAILABLE',category?.message||'业务类型配置暂时无法读取。');
    if(normalizedRows.some(row=>row&&Object.hasOwn(row,'businessType')&&row.businessType!==businessType))return failure('BUSINESS_TYPE_CONFLICT','一次导入只能使用请求指定的业务类型，请按类型分次导入。');
    return importRows(found.data.entry.task.taskId,normalizedRows,{sourceApplicationId:resolved.data.sourceApplicationId,scenarioId:text(input.scenarioId),requestId,requestContent:content,businessType,businessTypeLabel:category.row.label,businessBatchNo,callMode,callbackUrlSnapshot:sourceApplication.callbackUrl});
  }
  function refreshBusinessLedger() {
    try{
      const raw=localStorage.getItem(LEDGER_KEY);
      // Reuse only the last successfully validated, persisted bytes. Every read
      // still compares storage, so removal, corruption and other tabs are visible.
      if(ledgerValidated&&raw===ledgerBytes&&raw!==null)return success(null);
      const saved=JSON.parse(raw||'null');
      if(!saved&&(Object.keys(ledger.tasks).length||ledgerBytes!==null))throw Error('Ledger removed');
      if(saved&&(saved.schemaVersion!=='1.1.0'||!Number.isSafeInteger(saved.sequence)||saved.sequence<0||!saved.tasks||typeof saved.tasks!=='object'||Array.isArray(saved.tasks)))throw Error('Invalid ledger');
      ledger=saved||{schemaVersion:'1.1.0',sequence:0,tasks:{}};ledgerBytes=raw;ledgerValidated=true;return success(null);
    }catch(_){return failure('LEDGER_UNAVAILABLE','客户记录暂时无法读取，请保留原始资料后重试。');}
  }
  function receiveManualApi(input,identity,application) {
    const refreshed=refreshBusinessLedger();if(!refreshed.ok)return refreshed;
    const tenant=(window.CloudCallData?.tenants||[]).find(row=>row.tenantId===identity.tenantId),requestId=text(input.requestId);
    if(!requestId)return failure('MISSING_REQUEST_ID','接口导入必须提供 requestId。');
    if(Object.hasOwn(input,'tenantId')&&input.tenantId!==identity.tenantId)return failure('TENANT_SCOPE_CONFLICT','请求租户与业务身份不一致。');
    if(Object.hasOwn(input,'taskId')&&text(input.taskId))return failure('MANUAL_TASK_CONFLICT','人工外呼不归属预外呼任务，请不要附带预外呼任务编号。');
    if(!Array.isArray(input.rows)||!input.rows.length||input.rows.length>2000)return failure('INVALID_ROWS','请提供1至2000行客户。');
    const rowIds=input.rows.map((row,index)=>Object.hasOwn(row||{},'rowId')?text(row.rowId):String(index+1));
    if(rowIds.some(id=>!id)||new Set(rowIds).size!==rowIds.length)return failure('INVALID_ROW_ID','请求内行标识必须有效且唯一。');
    // Only omitted, null and whitespace-only seat values are equivalent. A provided
    // nonempty work number stays exact; normalization must not conceal an invalid cno.
    const normalizedRows=input.rows.map(row=>row&&typeof row==='object'&&!Array.isArray(row)?{...clone(row),agentWorkNo:row.agentWorkNo==null||typeof row.agentWorkNo==='string'&&!row.agentWorkNo.trim()?'':row.agentWorkNo}:clone(row??null));
    const fingerprintRows=rows=>stable({tenantId:identity.tenantId,callMode:'manual',businessBatchNo:input.businessBatchNo,businessType:input.businessType,rows});
    const content=fingerprintRows(normalizedRows),legacyContent=fingerprintRows(input.rows);
    const same=row=>row.sourceApplicationId===identity.sourceApplicationId&&row.tenantId===identity.tenantId&&row.requestId===requestId;
    const previous=ledger.requestReceipts?.find(same);
    if(previous)return previous.content===(previous.manualFingerprintVersion===2?content:legacyContent)?success({...previous.result,replayed:true}):failure('REQUEST_CONTENT_CONFLICT','同一 requestId 的内容已改变，请使用新的业务请求编号。');
    const pending=ledger.manualImportTransactions?.find(same);
    if(pending&&pending.content!==(pending.manualFingerprintVersion===2?content:legacyContent))return failure('REQUEST_CONTENT_CONFLICT','同一 requestId 的暂存内容已改变，请核对原请求。');
    if(!validCallbackUrl(application?.callbackUrl))return failure('CALLBACK_NOT_CONFIGURED','请先为该接入应用配置有效回调地址，再导入客户。');
    let prepared=pending?.prepared;
    if(!prepared){
      const category=window.CustomerBusiness?.resolveImportType?.(input.businessType,{tenantId:identity.tenantId,enterpriseId:tenant?.enterpriseId});if(!category?.ok)return failure(category?.code||'BUSINESS_CONFIG_UNAVAILABLE',category?.message||'业务类型配置不可用。');
      const rows=[],rejects=[];
      for(let index=0;index<input.rows.length;index++){
        const raw=normalizedRows[index]||{},leadCode=text(raw.leadCode),phone=text(raw.phone),workNo=raw.agentWorkNo,priority=raw.priority;
        const seats=(window.CloudCallData?.agents||[]).filter(agent=>agent.tenantId===identity.tenantId&&agent.enterpriseId===tenant?.enterpriseId&&agent.cno===workNo&&agent.lifecycleStatus!=='已删除');
        const seat=seats[0],validSeat=seats.length===1&&text(seat.accountId)&&text(seat.contactCenterIdentityId)&&seat.lifecycleStatus==='已启用'&&seat.syncStatus==='同步成功'&&seat.acceptNewTasks!==false&&seat.callEnabled!==false&&(window.CloudCallData?.accounts||[]).filter(account=>account.accountId===seat.accountId&&account.status==='启用').length===1&&(window.CloudCallData?.memberships||[]).some(member=>member.accountId===seat.accountId&&member.tenantId===identity.tenantId&&member.status==='启用'&&['ADMIN','OPERATOR'].includes(member.roleCode));
        let reason=!leadCode?'缺少线索编码':!phone?'缺少客户号码':!/^(?:1[3-9]\d{9}|0\d{9,11})$/.test(phone)?'客户号码格式不正确':!['number','string'].includes(typeof priority)||typeof priority==='string'&&!priority.trim()||!Number.isFinite(Number(priority))?'优先级无效':typeof workNo!=='string'||workNo!==''&&!validSeat?'填写的坐席工号必须对应当前租户唯一有效的坐席':'';
        if(!reason&&Object.hasOwn(raw,'businessType')&&raw.businessType!==input.businessType)reason='该行业务类型与请求类型不一致';
        if(!reason&&window.CustomerBusiness?.importedFields?.some(field=>raw[field.key]!=null&&typeof raw[field.key]!=='string'))reason='选填来源字段请使用文本';
        if(reason){rejects.push({ok:false,rowId:rowIds[index],reason,leadCode,phone});continue;}
        const recordId='DEMO-MANUAL-RECORD-'+uniqueDemoId(),apiOrigin={schemaVersion:'1.1.0',sourceApplicationId:identity.sourceApplicationId,tenantId:identity.tenantId,enterpriseId:tenant.enterpriseId,requestId,rowId:rowIds[index],recordId,businessBatchNo:input.businessBatchNo,callMode:'manual',businessType:input.businessType,businessTypeLabel:category.row.label,callbackUrlSnapshot:application.callbackUrl,leadCode,phone,agentWorkNo:workNo,ownerId:workNo?seats[0].accountId:'',followupState:'跟进状态未同步'};
        rows.push({...clone(raw),recordId,rowId:rowIds[index],leadCode,phone,priority:Number(priority),agentWorkNo:workNo,ownerId:workNo?seats[0].accountId:'',followupState:'跟进状态未同步',assignedAgentIdentityId:workNo?seats[0].contactCenterIdentityId:'',followup:'跟进状态未同步',businessType:input.businessType,businessTypeLabel:category.row.label,apiOrigin});
      }
      if(!rows.length){const receipt={callMode:'manual',requestId,businessBatchNo:input.businessBatchNo,businessType:input.businessType,rows:rejects,savedCount:0,rejectedCount:rejects.length,simulated:true};const next=clone(ledger);(next.requestReceipts||=[]).push({sourceApplicationId:identity.sourceApplicationId,tenantId:identity.tenantId,requestId,content,manualFingerprintVersion:2,result:receipt});return writeLedger(next)?success(receipt):failure('STORAGE_FAILURE','导入回执未保存。');}
      const result=window.CustomerTasks?.prepareApiImportBatch?.({identity:input.identity,sourceApplicationId:identity.sourceApplicationId,sourceApplicationName:application.name,tenantId:identity.tenantId,enterpriseId:tenant.enterpriseId,requestId,businessBatchNo:input.businessBatchNo,businessType:input.businessType,businessTypeLabel:category.row.label,rows});
      if(!result?.ok)return failure(result?.code||'MANUAL_IMPORT_UNAVAILABLE',result?.reason||result?.message||'人工客户导入暂时不可用。');prepared=clone(result);delete prepared.identity;
      const next=clone(ledger);(next.manualImportTransactions||=[]).push({sourceApplicationId:identity.sourceApplicationId,tenantId:identity.tenantId,requestId,content,manualFingerprintVersion:2,prepared,rejects});
      if(!writeLedger(next))return failure('STORAGE_FAILURE','人工导入尚未准备，未分配客户。');
    }
    const committed=window.CustomerTasks?.commitApiImportBatch?.(prepared,{identity:input.identity});
    if(!committed?.ok)return failure(committed?.code||'MANUAL_IMPORT_PENDING',committed?.reason||committed?.message||'人工导入结果待确认，原请求已保留，请使用同一请求重试。');
    const transaction=ledger.manualImportTransactions.find(same),rows=prepared.batch?.rows||[],receipt={callMode:'manual',requestId,businessBatchNo:input.businessBatchNo,businessType:input.businessType,batchId:committed.batchId,rows:[...rows.map(row=>({ok:true,rowId:row.apiOrigin?.rowId||row.rowId,recordId:row.apiOrigin?.recordId||row.recordId||row.id,leadCode:row.leadCode,phone:row.phone,agentWorkNo:row.apiOrigin?.agentWorkNo||row.agentWorkNo,localState:'saved',assignmentState:row.ownerId?'assigned':'unassigned',followupState:row.followup||'跟进状态未同步',businessBatchNo:input.businessBatchNo,businessType:input.businessType})),...(transaction.rejects||[])],savedCount:rows.length,rejectedCount:(transaction.rejects||[]).length,simulated:true};
    const next=clone(ledger);(next.requestReceipts||=[]).push({sourceApplicationId:identity.sourceApplicationId,tenantId:identity.tenantId,requestId,content,manualFingerprintVersion:2,result:receipt});next.manualImportTransactions=next.manualImportTransactions.filter(row=>!same(row));
    if(!writeLedger(next))return failure('MANUAL_IMPORT_PENDING','客户已保存，原回执待恢复，请用同一请求重试，不要更换请求编号。');
    return success(receipt);
  }

  // A read-only import index. Business batches are not supplier single-number
  // batches, and repeated business batch numbers do not merge separate requests.
  function listUnifiedImportBatches() {
    const view=directoryView();if(!view.ok)return view;
    if(view.data.incomplete)return failure('IMPORT_INDEX_PENDING','部分导入记录关联待核对，暂不展示不完整的批次清单。');
    const grouped=new Map(),accountId=window.AppState.get().accountId;
    for(const record of view.data.records){
      if(record.sourceCustomerBatchId)continue; // The original manual journal already owns this batch.
      const entry=ledger.tasks[record.archiveTaskId],current=canonicalTask(record.archiveTaskId);
      if(!entry||!current)return failure('IMPORT_INDEX_PENDING','原任务无法准确关联，导入批次暂不可用。');
      const api=record.source==='api';
      if(['businessType','businessTypeLabel'].some(field=>Object.hasOwn(record,field)&&typeof record[field]!=='string'))return failure('IMPORT_INDEX_PENDING','原导入业务类型资料格式待核对。');
      const businessType=record.businessType||'',businessTypeLabel=businessType?(record.businessTypeLabel||'未记录'):'未分类';
      if(api&&(!text(record.sourceApplicationId)||!text(record.requestId)||!text(record.businessBatchNo)))return failure('IMPORT_INDEX_PENDING','历史接口导入缺少原应用或请求标识，请保留原记录核对。');
      const key='PREDICTIVE-IMPORT-'+encodeURIComponent(JSON.stringify(api?[record.sourceApplicationId,record.tenantId,record.requestId]:[record.tenantId,current.taskId,record.importTransactionId||record.creationTransactionId||record.batchId]));
      const projection=workbenchProjection(current,entry,record),item=projection.item;
      item.followup=record.workbenchAssignment?.followup||'跟进状态未同步';
      item.assignmentState='assigned';item.visibleToAccountId=accountId;
      item.calls=view.data.results.filter(result=>result.taskId===current.taskId&&result.recordId===record.recordId&&result.kind==='call').map(result=>({callId:result.callID,tenantId:record.tenantId,enterpriseId:record.enterpriseId,customerAnswered:result.customerAnswered,callType:'预外呼',callee:record.phone,cno:result.values?.cno||'',callState:result.customerAnswered===true?'已接通':result.customerAnswered===false?'未接通':'通话状态待确认',endedAt:result.values?.endedAt||'',simulation:true,source:'AliCti 结果（合成）'}));
      if(!grouped.has(key))grouped.set(key,{id:key,readOnly:true,source:record.source,sourceApplicationId:record.sourceApplicationId||'',sourceApplicationName:record.sourceApplicationName||'',callMode:'predictive',taskId:current.taskId,taskName:current.name||'',businessType,businessTypeLabel,businessBatchNo:record.businessBatchNo||'',name:record.businessBatchNo||record.importBatchName||'历史手工导入',tenantId:record.tenantId,enterpriseId:record.enterpriseId,requestId:record.requestId||'',createdAt:record.originalImportedAt||record.newBatchCreatedAt||'',simulation:true,rows:[]});
      const batch=grouped.get(key);
      if(batch.taskId!==current.taskId||batch.businessBatchNo!==(record.businessBatchNo||'')||batch.businessType!==businessType||batch.businessTypeLabel!==businessTypeLabel)return failure('IMPORT_INDEX_PENDING','同一导入请求的任务、业务批次或业务类型存在冲突，请核对原回执。');
      batch.rows.push(item);
    }
    return success({batches:[...grouped.values()],readOnly:true,simulated:true});
  }

  // External dialing is an explicitly synthetic contract candidate. It records
  // exact original record/call associations, never guesses by phone or agent and
  // never creates a platform communication-completed callback in the reverse direction.
  function externalManualRecord(selector) {
    if(!selector||!text(selector.sourceApplicationId)||!text(selector.tenantId)||!text(selector.recordId))return failure('EXTERNAL_RECORD_REQUIRED','请指定原应用、租户和准确导入记录。');
    try{
      const batches=JSON.parse(localStorage.getItem('customer-task-batches-v1')||'[]');
      if(!Array.isArray(batches)||batches.some(batch=>!batch||!text(batch.id)||!text(batch.tenantId)||!text(batch.enterpriseId)||!Array.isArray(batch.rows)||batch.rows.some(row=>!row||!text(row.id)||!text(row.phone)))||new Set(batches.map(batch=>batch.id)).size!==batches.length)throw Error('Invalid customer journal');
      const matches=batches.flatMap(batch=>batch.rows.filter(row=>row?.apiOrigin?.recordId===selector.recordId).map(row=>({batch,row,origin:row.apiOrigin})));
      if(matches.length!==1)return failure('EXTERNAL_RECORD_PENDING','原导入记录不存在或关联不唯一，请核对原回执。');
      const target=matches[0],{batch,row,origin}=target;
      if(origin.callMode!=='manual'||origin.sourceApplicationId!==selector.sourceApplicationId||origin.tenantId!==selector.tenantId||origin.tenantId!==batch.tenantId||origin.enterpriseId!==batch.enterpriseId||origin.recordId!==row.id||origin.phone!==row.phone||!text(origin.requestId)||!text(origin.rowId)||!text(origin.businessBatchNo)||!text(origin.businessType)||selector.enterpriseId&&selector.enterpriseId!==origin.enterpriseId)return failure('EXTERNAL_SCOPE_CONFLICT','原应用、租户或客户记录不匹配。');
      return success(target);
    }catch(_){return failure('EXTERNAL_JOURNAL_UNAVAILABLE','客户导入记录暂不可读取，原资料未修改。');}
  }
  function externalEvents() {
    const fresh=refreshBusinessLedger();if(!fresh.ok)return fresh;
    for(const key of ['externalCallEvents','externalFollowupEvents'])if(Object.hasOwn(ledger,key)&&(!Array.isArray(ledger[key])||ledger[key].some(row=>!row||!text(row.recordId)||!text(row.sourceApplicationId)||!text(row.tenantId)||!text(row.enterpriseId)||!text(row.callId)||!Number.isSafeInteger(row.version)||row.version<1||!text(row.content)||!externalScope(row,row.originSnapshot||{})||key==='externalCallEvents'&&(row.call?.callId!==row.callId||stable(row.call)!==row.content)||key==='externalFollowupEvents'&&(stable({callId:row.callId,disposition:row.disposition})!==row.content||!['继续跟进','需要再次联系','已完成沟通','暂无需求','号码有误','拒绝联系'].includes(row.disposition)||row.followup!==(['继续跟进','需要再次联系'].includes(row.disposition)?'待继续跟进':'已完成')))))return failure('EXTERNAL_EVENTS_UNAVAILABLE','外部通话同步记录待核对，未推定任何完成状态。');
    const keys=(ledger.externalCallEvents||[]).map(row=>JSON.stringify([row.tenantId,row.enterpriseId,row.callId]));
    const versions=(ledger.externalFollowupEvents||[]).map(row=>JSON.stringify([row.tenantId,row.sourceApplicationId,row.recordId,row.version]));
    if(new Set(keys).size!==keys.length||new Set(versions).size!==versions.length)return failure('EXTERNAL_EVENTS_UNAVAILABLE','外部通话或处理版本存在重复关联，请核对原始记录。');
    return success(null);
  }
  function externalScope(row,origin) {return ['recordId','sourceApplicationId','tenantId','enterpriseId'].every(key=>row[key]===origin[key]);}
  function externalRecordView(origin) {
    const target=externalManualRecord(origin);if(!target.ok)return target;
    const app=window.AppState,access=app?.effectiveAccess?.(),{batch,row}=target.data;
    if(app?.isReady?.()!==true||access?.valid!==true||app.get().activeDomain!=='CLOUD_CONTACT_CENTER'||app.canMenu?.('cloud.tasks')!==true||app.authorizeObject?.('',batch)!==true||access.roleCode==='OPERATOR'&&row.ownerId!==app.get().accountId&&row.followupAssignment?.ownerId!==app.get().accountId)return failure('FORBIDDEN','当前身份不能查看该客户的外部通话同步。');
    const events=externalEvents();if(!events.ok)return events;
    const calls=(ledger.externalCallEvents||[]).filter(event=>externalScope(event,target.data.origin)),outcomes=(ledger.externalFollowupEvents||[]).filter(event=>externalScope(event,target.data.origin));
    const latest=outcomes.sort((a,b)=>b.version-a.version)[0],last=calls.sort((a,b)=>b.sequence-a.sequence)[0];
    if(calls.some(event=>stable(event.originSnapshot)!==stable(target.data.origin))||outcomes.some(event=>stable(event.originSnapshot)!==stable(target.data.origin)))return failure('EXTERNAL_SCOPE_CONFLICT','原导入身份已变化，外部同步关联待核对。');
    return success({followup:latest?.followup||'跟进状态未同步',businessVersion:latest?.version||0,businessUpdatedAt:latest?.receivedAt||'',disposition:latest?.disposition||'',inProgress:calls.some(event=>!event.call.endedAt),callStatus:last?.call.customerAnswered===true?'已接通':last?.call.customerAnswered===false?'未接通':last?'通话状态待确认':'尚未同步通话',actualAgentWorkNo:last?.call.agentWorkNo||'',calls:calls.map(event=>({...clone(event.call),callId:event.callId,callType:'人工外呼',callee:target.data.origin.phone,tenantId:target.data.origin.tenantId,enterpriseId:target.data.origin.enterpriseId,customerAnswered:event.call.customerAnswered,callState:event.call.customerAnswered===true?'已接通':event.call.customerAnswered===false?'未接通':'通话状态待确认',cno:event.call.agentWorkNo||'',simulation:true,external:true})),readOnly:true,simulated:true});
  }
  function receiveExternalCall(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    const identity=resolveTenantIdentity(input?.identity);if(!identity.ok)return identity;
    if(Object.hasOwn(input,'sourceApplicationId')&&input.sourceApplicationId!==identity.data.sourceApplicationId||Object.hasOwn(input,'tenantId')&&input.tenantId!==identity.data.tenantId)return failure('EXTERNAL_SCOPE_CONFLICT','外部通话身份与原应用或租户不一致。');
    const target=externalManualRecord({...identity.data,recordId:input?.recordId});if(!target.ok)return target;
    if(Object.hasOwn(input,'enterpriseId')&&input.enterpriseId!==target.data.origin.enterpriseId)return failure('EXTERNAL_SCOPE_CONFLICT','外部同步供应商企业范围与原记录不一致。');
    const state=externalEvents();if(!state.ok)return state;
    const call=input?.call,callId=text(call?.callId),version=input?.version;
    if(!callId||!Number.isSafeInteger(version)||version<1||!call||!['boolean'].includes(typeof call.customerAnswered)&&call.customerAnswered!==null||Object.hasOwn(call,'agentWorkNo')&&typeof call.agentWorkNo!=='string'||Object.hasOwn(call,'phone')&&call.phone!==target.data.origin.phone)return failure('INVALID_EXTERNAL_CALL','请提供准确通话编号、版本和明确接通状态；号码如有提供必须与原记录一致。');
    const origin=target.data.origin;
    if(['tenantId','enterpriseId','sourceApplicationId','recordId'].some(key=>Object.hasOwn(call,key)&&call[key]!==origin[key])||['startedAt','endedAt'].some(key=>call[key]!==undefined&&call[key]!==''&&(typeof call[key]!=='string'||!Number.isFinite(Date.parse(call[key])))))return failure('EXTERNAL_SCOPE_CONFLICT','通话中的原应用、租户、记录或时间不匹配。');
    if(['instanceId','alictiInstanceId','supplierInstanceId'].some(key=>Object.hasOwn(call,key)||Object.hasOwn(input,key)))return failure('EXTERNAL_INSTANCE_UNCONFIRMED','本轮尚未建立供应商实例映射，不能接收无法验证实例的通话。');
    const normalized={callId,customerAnswered:call.customerAnswered,agentWorkNo:call.agentWorkNo||'',startedAt:text(call.startedAt),endedAt:text(call.endedAt)},content=stable(normalized);
    const existing=(ledger.externalCallEvents||[]).filter(row=>row.tenantId===origin.tenantId&&row.enterpriseId===origin.enterpriseId&&row.callId===callId);
    if(existing.length>1)return failure('EXTERNAL_CALL_CONFLICT','该通话已有多条关联，暂不更新。');
    const prior=existing[0];
    if(prior&&(!externalScope(prior,origin)||stable(prior.originSnapshot)!==stable(origin)))return failure('EXTERNAL_CALL_CONFLICT','该通话已关联其他原记录或原身份已变化。');
    if(prior&&version<=prior.version)return version===prior.version&&content===prior.content?success({...prior,replayed:true}):failure('EXTERNAL_CALL_VERSION_CONFLICT','该通话版本已处理或内容发生冲突。');
    if(prior&&prior.call.customerAnswered!==null&&normalized.customerAnswered!==prior.call.customerAnswered)return failure('EXTERNAL_CALL_FACT_CONFLICT','已确认的接通事实不能被相反结果覆盖。');
    const next=clone(ledger),event={...Object.fromEntries(['recordId','sourceApplicationId','tenantId','enterpriseId'].map(key=>[key,origin[key]])),originSnapshot:clone(origin),callId,version,content,call:normalized,sequence:++next.sequence,receivedAt:new Date().toISOString(),simulated:true};
    next.externalCallEvents=(next.externalCallEvents||[]).filter(row=>!(row.tenantId===origin.tenantId&&row.enterpriseId===origin.enterpriseId&&row.callId===callId));next.externalCallEvents.push(event);
    return writeLedger(next)?success(event):failure('STORAGE_FAILURE','外部通话结果未保存，跟进状态未改变。');
  }
  function receiveExternalFollowup(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    const identity=resolveTenantIdentity(input?.identity);if(!identity.ok)return identity;
    if(Object.hasOwn(input,'sourceApplicationId')&&input.sourceApplicationId!==identity.data.sourceApplicationId||Object.hasOwn(input,'tenantId')&&input.tenantId!==identity.data.tenantId)return failure('EXTERNAL_SCOPE_CONFLICT','业务处理结果身份与原应用或租户不一致。');
    const target=externalManualRecord({...identity.data,recordId:input?.recordId});if(!target.ok)return target;
    if(Object.hasOwn(input,'enterpriseId')&&input.enterpriseId!==target.data.origin.enterpriseId)return failure('EXTERNAL_SCOPE_CONFLICT','外部同步供应商企业范围与原记录不一致。');
    const state=externalEvents();if(!state.ok)return state;
    const origin=target.data.origin,callId=text(input.callId),version=input.businessVersion,disposition=input.disposition;
    if(!callId||!Number.isSafeInteger(version)||version<1||!['继续跟进','需要再次联系','已完成沟通','暂无需求','号码有误','拒绝联系'].includes(disposition))return failure('INVALID_EXTERNAL_FOLLOWUP','请提供准确通话编号、业务版本和已保存的处理结果。');
    const calls=(ledger.externalCallEvents||[]).filter(event=>event.callId===callId&&externalScope(event,origin));
    if(calls.length!==1||stable(calls[0].originSnapshot)!==stable(origin))return failure('EXTERNAL_CALL_REQUIRED','请先同步准确关联原记录的通话事实，再保存业务处理结果。');
    if(!calls[0].call.endedAt||disposition==='已完成沟通'&&calls[0].call.customerAnswered!==true)return failure('EXTERNAL_CALL_NOT_FINISHED','通话尚未结束，或没有已接通依据，不能确认该业务处理结果。');
    const content=stable({callId,disposition}),existing=(ledger.externalFollowupEvents||[]).filter(event=>externalScope(event,origin)),prior=existing.sort((a,b)=>b.version-a.version)[0];
    if(prior&&version<=prior.version)return version===prior.version&&content===prior.content?success({...prior,replayed:true}):failure('EXTERNAL_FOLLOWUP_VERSION_CONFLICT','原业务处理版本已保存，拒绝覆盖或倒退。');
    const next=clone(ledger),event={...Object.fromEntries(['recordId','sourceApplicationId','tenantId','enterpriseId'].map(key=>[key,origin[key]])),originSnapshot:clone(origin),callId,version,disposition,followup:['继续跟进','需要再次联系'].includes(disposition)?'待继续跟进':'已完成',content,receivedAt:new Date().toISOString(),simulated:true};
    (next.externalFollowupEvents||=[]).push(event);
    return writeLedger(next)?success(event):failure('STORAGE_FAILURE','外部业务处理结果未保存，跟进状态未改变。');
  }
  function simulateExternalCall(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    if(window.CloudCallData?.demoSwitchEnabled!==true)return failure('DEMO_DISABLED','当前未启用合成演示。');
    const target=externalManualRecord(input);if(!target.ok)return target;
    const view=externalRecordView(target.data.origin);if(!view.ok)return view;
    if(window.AppState?.canAction?.('task.create')!==true||window.AppState.authorizeObject?.('task.create',target.data.batch)!==true)return failure('FORBIDDEN','当前身份不能演示该客户的外部同步。');
    if(!['answered','not_answered','continue','completed'].includes(input.scenario))return failure('UNKNOWN_SCENARIO','请选择已定义的外部拨号合成样例。');
    const fresh=refreshApplications();if(!fresh.ok)return fresh;
    const origin=target.data.origin,application=state.applications.find(row=>row.applicationId===origin.sourceApplicationId);
    if(!application)return failure('UNKNOWN_APPLICATION','原应用已不存在，无法演示该应用同步。');
    const identity=exchangeTenantIdentity({applicationId:application.applicationId,credentialPlaceholder:application.credentialPlaceholder,tenantId:origin.tenantId});if(!identity.ok)return identity;
    const prior=(ledger.externalCallEvents||[]).filter(row=>externalScope(row,origin)).sort((a,b)=>b.sequence-a.sequence)[0];
    let result=prior?success(prior):null;
    if(['answered','not_answered'].includes(input.scenario)||!prior){const callId='DEMO-EXTERNAL-'+uniqueDemoId();result=receiveExternalCall({identity:identity.data,recordId:origin.recordId,version:1,call:{callId,customerAnswered:input.scenario==='not_answered'?false:true,agentWorkNo:'DCC-DEMO-AGENT',startedAt:new Date().toISOString(),endedAt:new Date().toISOString()}});if(!result.ok)return result;}
    if(['continue','completed'].includes(input.scenario))return receiveExternalFollowup({identity:identity.data,recordId:origin.recordId,callId:result.data.callId,businessVersion:view.data.businessVersion+1,disposition:input.scenario==='continue'?'继续跟进':'已完成沟通'});
    return result;
  }
  function workbenchAgent(agent) {
    const app=window.AppState,s=app?.get?.();if(isReadOnlyProjection()||app?.isReady?.()!==true||app?.effectiveAccess?.().valid!==true||s?.activeDomain!=='CLOUD_CONTACT_CENTER')return null;
    const rows=(window.CloudCallData?.agents||[]).filter(row=>row.accountId===s.accountId&&row.tenantId===s.tenantId&&row.enterpriseId===s.enterpriseId&&row.lifecycleStatus==='已启用'&&row.syncStatus==='同步成功'&&row.callEnabled!==false&&row.acceptNewTasks!==false&&(!agent||row.contactCenterIdentityId===agent.contactCenterIdentityId&&row.cno===agent.cno));
    return rows.length===1?rows[0]:null;
  }
  function predictiveApiOrigin(record,entry) {
    if(record.source!=='api'||!text(record.sourceApplicationId))return null;
    return {schemaVersion:'1.1.0',sourceApplicationId:record.sourceApplicationId,tenantId:entry.task.tenantId,enterpriseId:entry.task.enterpriseId,requestId:record.requestId||'',rowId:record.rowId||'',recordId:record.recordId,businessBatchNo:record.businessBatchNo||'',callMode:'predictive',businessType:record.businessType||'',businessTypeLabel:record.businessTypeLabel||'',callbackUrlSnapshot:record.callbackUrlSnapshot||'',leadCode:record.leadCode,phone:record.phone,taskId:entry.task.taskId,localTaskId:entry.task.taskId,supplierTaskId:entry.task.supplierTaskId,batchId:record.batchId,rootBatchId:record.rootBatchId||'',fileId:record.supplierFileId||''};
  }
  function recordNativeCalls(record,entry) {
    const ids=new Set(record.workbenchAssignment?.callIds||[]);let rows=[];
    try{const saved=JSON.parse(localStorage.getItem('native-workbench-records-v1')||'[]');if(!Array.isArray(saved))return [];rows=saved;}catch(_){return [];}
    const calls=new Map([...rows,...(window.CloudCallData?.calls||[])].filter(call=>ids.has(call.callId)&&call.tenantId===entry.task.tenantId&&call.enterpriseId===entry.task.enterpriseId&&call.customerTaskItemId===record.recordId).map(call=>[call.callId,call]));
    return [...calls.values()].map(clone);
  }
  function workbenchProjection(current,entry,record) {
    const assignment=record.workbenchAssignment||{},calls=recordNativeCalls(record,entry),apiOrigin=predictiveApiOrigin(record,entry),followupAssignment=assignment.followupAssignment;
    const item={...clone(record),id:record.recordId,ledgerRecord:true,name:record.name||record.leadCode,externalDocumentId:record.externalDocumentId||record.leadCode,taskId:current.taskId,taskName:current.name,tenantId:entry.task.tenantId,enterpriseId:entry.task.enterpriseId,ownerId:assignment.accountId||'',method:followupAssignment?'人工外呼':'预外呼',calls,activeCallId:assignment.activeCallId||'',followup:assignment.followup||'待联系',...(apiOrigin?{apiOrigin}:{}),...(followupAssignment?{followupAssignment:clone(followupAssignment)}:{})};
    const batch={id:record.batchId,name:record.businessBatchNo||record.importBatchName||record.batchId,tenantId:entry.task.tenantId,enterpriseId:entry.task.enterpriseId,createdAt:record.originalImportedAt||record.newBatchCreatedAt,source:record.source,simulation:true,rows:[item]};return {task:clone(current),batch,item};
  }
  function predictiveRecipient(task,agent) {
    const config={};for(const source of [task.executionConfig,task.alictiCreateDraft?.fields,task,task.planSnapshot])if(source)for(const key of ['callGroupType','cnos','outboundGroupId','agentGroup','outboundGroupSnapshot'])if(Object.hasOwn(source,key))config[key]=source[key];
    if(Number(config.callGroupType)===2){const group=window.OutboundGroups?.resolve?.(config,task);return group?.ok&&group.members.some(row=>row.contactCenterIdentityId===agent.contactCenterIdentityId&&row.tenantId===task.tenantId&&row.enterpriseId===task.enterpriseId);}
    const cnos=Array.isArray(config.cnos)?config.cnos:typeof config.cnos==='string'?config.cnos.split(',').map(value=>value.trim()):[];
    return cnos.includes(agent.cno)&&agent.tenantId===task.tenantId&&agent.enterpriseId===task.enterpriseId;
  }
  function predictiveReceivingItem(taskId,recordId,agent) {
    const seat=workbenchAgent(agent);if(!seat)return null;
    const found=lockedTask(text(taskId));if(!found.ok)return null;const {current,entry}=found.data;
    if(current.tenantId!==seat.tenantId||current.enterpriseId!==seat.enterpriseId||current.status!=='执行中'||current.stopNewDialing||current.resourcePause||current.alictiTaskControlPending||current.alictiTaskUpdatePending||String(current.providerStatusCode)!=='1'||!predictiveRecipient(current,seat))return null;
    const matches=entry.records.filter(row=>row.recordId===recordId);if(matches.length!==1)return null;const record=matches[0],assignment=record.workbenchAssignment;
    if(record.importState!=='accepted'||record.reviewReason||record.supplierDeleted===true||['pending','unknown','succeeded'].includes(record.deletionState)||record.submissionState!=='submitted'||!text(record.supplierFileId)||assignment?.activeCallId||assignment?.callIds?.length||(entry.actualResults||[]).some(row=>row.recordId===recordId))return null;
    return workbenchProjection(current,entry,record);
  }
  function predictiveReceivingCandidates(agent) {
    const seat=workbenchAgent(agent);if(!seat)return [];
    if(!refreshBusinessLedger().ok)return [];
    const result=[];for(const entry of Object.values(ledger.tasks))for(const record of entry.records||[]){const matched=predictiveReceivingItem(entry.task.taskId,record.recordId,seat);if(matched)result.push(matched);}return result;
  }
  function findWorkbenchRecord(recordId) {
    if(!text(recordId)||!refreshBusinessLedger().ok)return null;
    const matches=Object.values(ledger.tasks).flatMap(entry=>(entry.records||[]).filter(row=>row.recordId===recordId).map(record=>({entry,record,current:canonicalTask(entry.task.taskId)})));
    if(matches.length!==1||!matches[0].current)return null;const found=lockedTask(matches[0].entry.task.taskId);return found.ok?{entry:found.data.entry,record:found.data.entry.records.find(row=>row.recordId===recordId),current:found.data.current}:null;
  }
  function workbenchRow(recordId) {
    const seat=workbenchAgent();if(!seat)return null;const found=findWorkbenchRecord(recordId);if(!found||found.entry.task.tenantId!==seat.tenantId||found.entry.task.enterpriseId!==seat.enterpriseId||found.record.workbenchAssignment?.accountId!==seat.accountId||found.record.workbenchAssignment?.seatIdentityId!==seat.contactCenterIdentityId)return null;
    const view=workbenchProjection(found.current,found.entry,found.record);return {b:view.batch,r:view.item};
  }
  function workbenchMine() {
    const seat=workbenchAgent();if(!seat||!refreshBusinessLedger().ok)return [];
    const ids=Object.values(ledger.tasks).flatMap(entry=>(entry.records||[]).filter(row=>row.workbenchAssignment?.followupAssignment?.ownerId===seat.accountId&&row.workbenchAssignment.followup!=='已完成'&&!row.workbenchAssignment.activeCallId).map(row=>row.recordId));
    return ids.map(id=>workbenchRow(id)).filter(Boolean).map(({b,r})=>({...r,batchId:b.id,batchName:b.name,batchCreatedAt:b.createdAt}));
  }
  function workbenchCallBlockedReason(row) {
    const seat=workbenchAgent(),found=workbenchRow(row?.id);if(!seat||!found)return '当前客户不属于本人可联系名单';
    const record=findWorkbenchRecord(row.id),assignment=record?.record.workbenchAssignment;if(!record||!assignment?.followupAssignment||assignment.followup==='已完成'||assignment.activeCallId)return '当前客户尚不能人工联系';
    const task=record.current;if(task.alictiTaskControlPending||task.alictiTaskUpdatePending||!['0','1','2','3'].includes(String(task.providerStatusCode)))return '原预外呼任务状态待确认，请先核对';
    const paused=task.status==='已暂停'&&String(task.providerStatusCode)==='2',ended=['已终止','已完成','已结束'].includes(task.status)&&String(task.providerStatusCode)==='3';
    if(!paused&&!ended)return '请先确认原预外呼任务已暂停或结束，再人工跟进';
    return '';
  }
  const workbenchCanCall=row=>!!row&&row.ledgerRecord===true&&!workbenchCallBlockedReason(row);
  function currentWorkbenchCall(call) {
    const seat=workbenchAgent();if(!seat||!call||!text(call.callId)||call.callSource!=='NATIVE_WORKBENCH'||call.simulation!==true||call.accountId!==seat.accountId||call.contactCenterIdentityId!==seat.contactCenterIdentityId||call.tenantId!==seat.tenantId||call.enterpriseId!==seat.enterpriseId)return null;
    let candidates=[...(window.CloudCallData?.calls||[])];try{const saved=JSON.parse(localStorage.getItem('native-workbench-records-v1')||'[]');if(Array.isArray(saved))candidates.push(...saved);}catch(_){return null;}
    const active=window.AgentWorkbench?.receivingContext?.().call;if(active)candidates.push(active);
    const keys=['callId','tenantId','enterpriseId','accountId','contactCenterIdentityId','customerTaskItemId','callee'];
    return candidates.some(row=>keys.every(key=>row[key]===call[key])&&row.callSource==='NATIVE_WORKBENCH')?seat:null;
  }
  function claimWorkbenchCall(recordId,call) {
    if(!workbenchCanCall({id:recordId,ledgerRecord:true})||!currentWorkbenchCall(call))return false;
    const found=findWorkbenchRecord(recordId);if(!found||call.customerTaskItemId!==recordId||call.callee!==found.record.phone)return false;
    const next=clone(ledger),record=next.tasks[found.current.taskId].records.find(row=>row.recordId===recordId),assignment=record.workbenchAssignment;
    if(assignment.activeCallId)return false;assignment.activeCallId=call.callId;assignment.callIds=[...new Set([...(assignment.callIds||[]),call.callId])];record.assignedAgentCno=call.cno;return writeLedger(next);
  }
  function syncWorkbenchCall(call) {
    const seat=currentWorkbenchCall(call),found=findWorkbenchRecord(call?.customerTaskItemId);if(!seat||!found||call.callee!==found.record.phone||call.tenantId!==found.entry.task.tenantId||call.enterpriseId!==found.entry.task.enterpriseId)return false;
    const expected=predictiveApiOrigin(found.record,found.entry);if(stable(call.apiOrigin||null)!==stable(expected))return false;
    const existing=found.record.workbenchAssignment;
    if(!existing){if(call.workbenchKind!=='predictive'||call.callType!=='预外呼'||call.taskId!==found.current.taskId||!predictiveReceivingItem(found.current.taskId,found.record.recordId,seat))return false;}
    else if(existing.accountId!==seat.accountId||existing.seatIdentityId!==seat.contactCenterIdentityId||!existing.callIds?.includes(call.callId))return false;
    const next=clone(ledger),entry=next.tasks[found.current.taskId],record=entry.records.find(row=>row.recordId===found.record.recordId),assignment=record.workbenchAssignment||={accountId:seat.accountId,seatIdentityId:seat.contactCenterIdentityId,callIds:[],activeCallId:call.callId,followup:'待联系'};
    assignment.callIds=[...new Set([...assignment.callIds,call.callId])];record.assignedAgentCno=seat.cno;
    if(call.processingStatus==='已完成'&&assignment.activeCallId===call.callId){
      const continuing=['继续跟进','需要再次联系'].includes(call.agentDisposition);assignment.followup=continuing?'待继续跟进':'已完成';assignment.activeCallId='';
      if(continuing)assignment.followupAssignment={ownerId:seat.accountId,seatIdentityId:seat.contactCenterIdentityId,originalTaskId:found.current.taskId,originCallId:call.callId,assignedAt:call.dispositionAt||new Date().toISOString()};
    }
    if(call.endedAt&&!entry.actualResults?.some(row=>row.nativeWorkbenchCallId===call.callId)){
      resultState(entry);const state=window.CallState?.view?.(call)||{},raw={kind:'call',evidenceTrusted:true,source:call.callType==='人工外呼'?'本地人工跟进演示':'显式本地预外呼分配演示',enterpriseId:entry.task.enterpriseId,taskId:entry.task.supplierTaskId,recordId:record.recordId,batchId:record.batchId,fileId:record.supplierFileId,phone:record.phone,leadCode:record.leadCode,callID:call.callId,cno:call.cno,customerAnswered:state.answered===true?true:state.answered===false?false:null,agentAnswered:call.agentAnswerResult==='已接听',hangupParty:'unknown',customerBridgeDuration:call.alictiCdr?.raw?.customerBridgeDuration??null,durationIsTrusted:typeof call.alictiCdr?.raw?.customerBridgeDuration==='number',startedAt:call.ringingAt,endedAt:call.endedAt};
      const result={resultId:'DEMO-RESULT-'+(++next.sequence),identityKey:'call:'+call.callId,kind:'call',nativeWorkbenchCallId:call.callId,tenantId:entry.task.tenantId,enterpriseId:entry.task.enterpriseId,taskId:entry.task.taskId,supplierTaskId:entry.task.supplierTaskId,recordId:record.recordId,batchId:record.batchId,...businessAssociation(record),supplierFileId:record.supplierFileId,leadCode:record.leadCode,phone:record.phone,...(window.CustomerBusiness?.importSnapshot(record)||{}),callID:call.callId,eventId:'',associationState:'confirmed',version:1,values:raw,...deriveCallResult(raw),finishRetryFlag:finishInterpretation(raw,raw.source),evidence:[{source:raw.source,receivedAt:new Date().toISOString(),fingerprint:stable(raw),raw}],sipUpdates:[],reviewReasons:[],deliveryIds:[],createdAt:new Date().toISOString(),simulated:true};
      entry.actualResults.push(result);record.callState='observed';ensureFailureRetryPlan(next,entry,record,result);resultDelivery(next,entry,result,raw,'call_result');
    }
    return writeLedger(next);
  }

  function exactApiCall(input) {
    const supplied=input?.call,app=window.AppState;
    if(!supplied||!text(supplied.callId))return failure('UNKNOWN_CALL','缺少准确通话编号。');
    const matches=(window.CloudCallData?.calls||[]).filter(row=>row.callId===supplied.callId&&row.tenantId===supplied.tenantId&&row.enterpriseId===supplied.enterpriseId);
    if(matches.length!==1||app?.isReady?.()!==true||app?.authorizeObject?.('',matches[0])!==true)return failure('FORBIDDEN','当前身份不能处理这条通话。');
    const call=matches[0],origin=call.apiOrigin;
    if(!origin)return success({call,manualUi:true});
    if(origin.tenantId!==call.tenantId||origin.enterpriseId!==call.enterpriseId||!text(origin.recordId)||!text(origin.sourceApplicationId))return failure('CALL_ORIGIN_PENDING','原业务系统客户关联待确认。');
    if(origin.callMode==='predictive'){
      const found=findWorkbenchRecord(origin.recordId),expected=found&&predictiveApiOrigin(found.record,found.entry);
      if(!found||!expected||stable(expected)!==stable(origin)||!found.record.workbenchAssignment?.callIds?.includes(call.callId))return failure('CALL_ORIGIN_PENDING','原预外呼记录及本次坐席通话不能准确关联。');
      return success({call,origin,record:found.record});
    }
    let rows;try{const batches=JSON.parse(localStorage.getItem('customer-task-batches-v1')||'[]');if(!Array.isArray(batches))throw Error();rows=batches.filter(batch=>batch.tenantId===call.tenantId&&batch.enterpriseId===call.enterpriseId).flatMap(batch=>batch.rows||[]).filter(row=>row.id===call.customerTaskItemId&&row.apiOrigin?.recordId===origin.recordId&&stable(row.apiOrigin)===stable(origin));}catch(_){return failure('CALL_ORIGIN_PENDING','原客户资料暂不可核对。');}
    if(rows.length!==1||rows[0].phone!==origin.phone)return failure('CALL_ORIGIN_PENDING','原客户、应用和本次通话不能准确关联。');
    return success({call,origin,record:rows[0]});
  }
  function recordCommunicationCompletion(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    const checked=exactApiCall(input);if(!checked.ok)return checked;if(checked.data.manualUi)return success({externalCallback:false,reason:'手工界面客户仅平台保存'});
    const {call,origin,record}=checked.data,disposition=call.agentDisposition||call.disposition;
    if(disposition!=='已完成沟通'||!call.endedAt||call.processingStatus==='待填写')return failure('COMMUNICATION_NOT_COMPLETED','本次沟通尚未完成保存，不创建完成回调。');
    const refreshed=refreshBusinessLedger();if(!refreshed.ok)return refreshed;
    const intent=call.communicationCompletion;
    if(!intent||intent.eventId!==text(input.eventId)||!intent.frozenCallSnapshot||!intent.frozenBusinessSnapshot||stable(intent.frozenBusinessSnapshot)!==stable(input.savedBusinessSnapshot))return failure('COMPLETION_SNAPSHOT_PENDING','本次已保存事件快照尚未完整核对，保留待回传状态。');
    const savedBusinessSnapshot=intent.frozenBusinessSnapshot;
    if(!savedBusinessSnapshot||typeof savedBusinessSnapshot!=='object')return failure('MISSING_BUSINESS_SNAPSHOT','缺少本次已保存的业务信息快照。');
    const eventId=text(input.eventId);if(!eventId)return failure('MISSING_EVENT_ID','缺少本次保存事件版本。');
    const payload={stage:'communication_completed',...clone(origin),callId:call.callId,callRecord:clone(intent.frozenCallSnapshot),customerBusiness:clone(savedBusinessSnapshot),importedCustomerInfo:window.CustomerBusiness?.importSnapshot?.(intent.frozenCallSnapshot)||{},simulated:true};
    const content=stable(payload),prior=ledger.communicationEvents?.find(row=>row.eventId===eventId&&row.tenantId===origin.tenantId&&row.sourceApplicationId===origin.sourceApplicationId);
    if(prior)return prior.content===content?success({...prior,replayed:true}):failure('COMMUNICATION_EVENT_CONFLICT','本次保存事件的内容已变化，保留原回调快照待核。');
    const next=clone(ledger),delivery={deliveryId:'DEMO-COMMUNICATION-'+(++next.sequence),eventId,sourceApplicationId:origin.sourceApplicationId,tenantId:origin.tenantId,enterpriseId:origin.enterpriseId,recordId:origin.recordId,...callbackRoute(origin),stage:'communication_completed',payload,content,state:'pending',attempts:[],error:'',simulated:true};
    const filled=value=>value!==undefined&&value!==null&&value!==''&&(!Array.isArray(value)||value.length>0);
    const missing=[];for(const field of savedBusinessSnapshot.fields||[]){if(!filled(field.value))continue;if(!text(field.businessFieldCode))missing.push((field.fieldName||field.fieldId||'已填写字段')+'缺少业务字段编码');for(const option of field.selectedOptions||[])if(!text(option.businessOptionCode))missing.push((field.fieldName||field.fieldId||'已选项')+'的选项缺少业务编码');}
    if(missing.length){delivery.state='incomplete';delivery.routeState='pending_review';delivery.error='回调资料待完善：'+[...new Set(missing)].join('；');delivery.missingBusinessCodes=[...new Set(missing)];}
    else deliveryAttempt(delivery,input.outcome==='succeeded'?'succeeded':'failed');(next.communicationEvents||=[]).push(delivery);
    if(!writeLedger(next))return failure('STORAGE_FAILURE','完成回调快照尚未保存，客户填写内容继续保留。');return success(delivery);
  }
  function communicationCompletionView(call) {
    const checked=exactApiCall({call});if(!checked.ok)return checked;if(checked.data.manualUi)return success({deliveries:[],externalCallback:false});
    const read=refreshBusinessLedger();if(!read.ok)return read;
    return success({deliveries:(ledger.communicationEvents||[]).filter(row=>row.recordId===checked.data.origin.recordId&&row.payload?.callId===call.callId&&row.tenantId===call.tenantId&&row.sourceApplicationId===checked.data.origin.sourceApplicationId),externalCallback:true});
  }

  function importManual(input) {
    const found = lockedTask(text(input?.taskId)); if (!found.ok) return found;
    if (!canAccessTask(found.data.current, true)) return failure('FORBIDDEN', '当前身份不能导入该租户任务。');
    if (found.data.entry.task.source !== 'manual') return failure('LOCKED_SOURCE', '该任务锁定 DCC 接口来源，手工导入被拒绝。');
    const creationTransactionId=text(input.creationTransactionId);
    if(input.deferDispatch===true&&!creationTransactionId)return failure('MISSING_CREATION_TRANSACTION','暂存导入需要本次创建事务标识。');
    return importRows(input.taskId, input.rows, { scenarioId: text(input.scenarioId), uniformPriority: input.uniformPriority,creationTransactionId,deferDispatch:input.deferDispatch===true });
  }
  function commitCreationImport(taskId,transactionId) {
    const found=lockedTask(taskId);if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能确认创建导入。');
    const transaction=found.data.entry.creationImports?.[text(transactionId)];
    if(!transaction||transaction.state==='rolled_back')return failure('UNKNOWN_CREATION_IMPORT','本次暂存名单不存在或已撤销。');
    const next=clone(ledger),saved=next.tasks[taskId].creationImports[transactionId];saved.state='committed';
    if(!writeLedger(next))return failure('STORAGE_FAILURE','创建名单确认未保存，未提交号码。');
    return dispatchPending(taskId);
  }
  function rollbackCreationImport(taskId,transactionId) {
    const found=lockedTask(taskId);if(!found.ok){if(found.code==='UNREGISTERED_TASK'&&canAccessTask(canonicalTask(taskId),true))return success({rolledBack:true,absent:true});return found;}
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能撤销创建导入。');
    const transaction=found.data.entry.creationImports?.[text(transactionId)];
    if(!transaction)return success({rolledBack:true,absent:true});
    if(transaction.state==='rolled_back')return success({rolledBack:true,replayed:true});
    if(transaction.state==='committed'||found.data.entry.records.some(row=>transaction.recordIds.includes(row.recordId)&&row.submissionState!=='pending'))return failure('CREATION_ALREADY_SUBMITTED','名单已确认或已提交，不能当作未创建撤销。');
    const next=clone(ledger),entry=next.tasks[taskId];
    entry.records=entry.records.filter(row=>!transaction.recordIds.includes(row.recordId));
    entry.localFailures=entry.localFailures.filter(row=>!transaction.failureIds.includes(row.failureId));
    entry.failureEvents=entry.failureEvents.filter(row=>!transaction.failureIds.includes(row.failureId));
    entry.failureDetails=entry.failureDetails.filter(row=>!transaction.failureIds.includes(row.failureId));
    entry.creationImports[transactionId].state='rolled_back';
    if(!writeLedger(next))return failure('STORAGE_FAILURE','暂存名单撤销未保存，请保留创建状态后重试。');
    return success({rolledBack:true});
  }
  function applicationsForTask(taskId) {
    const found=lockedTask(text(taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current))return failure('FORBIDDEN','当前身份不能查看此任务接入来源。');
    const read=refreshApplications();if(!read.ok)return read;
    return success(state.applications.filter(row=>row.authorizedTenantIds.includes(found.data.entry.task.tenantId)).map(row=>({applicationId:row.applicationId,name:row.name,callbackConfigured:validCallbackUrl(row.callbackUrl)})));
  }
  function manualImportDemoScope(tenantId) {
    const app=window.AppState,current=app?.get?.(),tenant=tenants().find(row=>row.tenantId===tenantId);
    return window.CloudCallData?.demoSwitchEnabled===true&&!isReadOnlyProjection()&&app?.isReady?.()===true&&app?.effectiveAccess?.().valid===true&&current?.activeDomain==='CLOUD_CONTACT_CENTER'&&current.tenantId===tenantId&&tenant?.enterpriseId===current.enterpriseId&&app.canAction?.('customer.import')===true&&app.authorizeObject?.('customer.import',tenant)===true?tenant:null;
  }
  function applicationsForTenant(tenantId) {
    if(!manualImportDemoScope(text(tenantId)))return failure('FORBIDDEN','当前租户范围不能使用接口导入演示。');
    const fresh=refreshApplications();if(!fresh.ok)return fresh;
    return success(state.applications.filter(row=>row.authorizedTenantIds.includes(tenantId)).map(row=>({applicationId:row.applicationId,name:row.name,callbackConfigured:validCallbackUrl(row.callbackUrl)})));
  }
  function simulateManualApiImport(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    if(!manualImportDemoScope(text(input?.tenantId)))return failure('FORBIDDEN','当前租户范围不能使用接口导入演示。');
    const apps=applicationsForTenant(input.tenantId);if(!apps.ok)return apps;
    const selected=apps.data.find(row=>row.applicationId===input.sourceApplicationId);
    if(!selected)return failure('UNKNOWN_APPLICATION','请明确选择已授权当前租户的来源应用。');
    const application=state.applications.find(row=>row.applicationId===selected.applicationId);
    const identity=exchangeTenantIdentity({applicationId:application.applicationId,credentialPlaceholder:application.credentialPlaceholder,tenantId:input.tenantId});if(!identity.ok)return identity;
    const requestId=text(input.requestId)||'DEMO-MANUAL-REQUEST-'+uniqueDemoId();
    const rows=[1,2].map(index=>({leadCode:'DEMO-EXTERNAL-'+requestId+'-'+index,name:'接口演示客户'+index,phone:index===1?'18800001001':'18800001002',priority:index,...(Object.hasOwn(input,'agentWorkNo')?{agentWorkNo:input.agentWorkNo}:{})}));
    return receiveDcc({identity:identity.data,callMode:'manual',businessType:input.businessType,businessBatchNo:input.businessBatchNo,requestId,rows});
  }
  function simulateDccImport(input) {
    const found = lockedTask(text(input?.taskId)); if (!found.ok) return found;
    if (!canAccessTask(found.data.current, true)) return failure('FORBIDDEN', '当前身份不能演示该租户的 DCC 传入。');
    if (found.data.entry.task.source !== 'api') return failure('LOCKED_SOURCE', '该任务锁定手工来源，不接受合成 DCC 传入。');
    const scenario = window.DccMock?.importScenarios?.[input?.scenarioId];
    if (!scenario) return failure('UNKNOWN_SCENARIO', '请选择已定义的合成线索样例。');
    const candidates=state.applications.filter(row=>row.authorizedTenantIds.includes(found.data.entry.task.tenantId));
    const application=input.sourceApplicationId?candidates.find(row=>row.applicationId===input.sourceApplicationId):candidates.length===1?candidates[0]:null;
    if (!application) return failure('UNAUTHORIZED_TENANT', '请选择已授权当前租户的来源应用，不能猜测接入系统。');
    const identity = exchangeTenantIdentity({ applicationId: application.applicationId, credentialPlaceholder: application.credentialPlaceholder, tenantId: found.data.entry.task.tenantId });
    if (!identity.ok) return identity;
    return receiveDcc({ identity: identity.data, taskId: found.data.entry.task.supplierTaskId, businessType: scenario.businessType, callMode:'predictive',businessBatchNo:text(input.businessBatchNo)||'DEMO-BUSINESS-'+input.scenarioId, rows: clone(scenario.rows), scenarioId: input.scenarioId, requestId: text(input.requestId)||'DEMO-REQUEST-'+uniqueDemoId() });
  }
  // 导入失败、分片、交付及下载是独立维度；任何入口都不重做供应商导入。
  const stable = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.keys(item).sort().reduce((out,key)=>(out[key]=item[key],out),{}) : item);
  function failureState(entry) {
    ['failureEvents','failureDetails','failureGroups','deliveries','exportSnapshots'].forEach(key=>{if(!Array.isArray(entry[key]))entry[key]=[];});
    return entry;
  }
  function notifyRecords(taskId) { if(typeof window.dispatchEvent==='function'&&typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('dcc:records-changed',{detail:{taskId}})); }
  function callbackRoute(record,entry) {
    const applicationsRead=refreshApplications();
    const sourceApplicationId=text(record?.sourceApplicationId),tenantId=record?.tenantId||entry?.task?.tenantId;
    const application=state.applications.find(row=>row.applicationId===sourceApplicationId);
    const current=application?.callbackUrl,original=record?.callbackUrlSnapshot;
    const reason=!applicationsRead.ok?'应用配置暂不可核对':!sourceApplicationId?'原应用身份待确认':!application?'原应用已移除，接收地址待确认':!application.authorizedTenantIds.includes(tenantId)?'原应用租户授权已变化':!validCallbackUrl(current)?'原应用未配置有效回调地址':original&&original!==current?'回调地址已变化，积压结果接收地址待确认':'';
    return {target:'APPLICATION_CALLBACK',sourceApplicationId,callbackUrl:reason?'':current,callbackUrlSnapshot:original||current||'',routeState:reason?'pending_review':'configured',routeReason:reason};
  }
  function callbackRouteStillValid(delivery) {
    if(!refreshApplications().ok)return false;
    const application=state.applications.find(row=>row.applicationId===delivery.sourceApplicationId);
    return delivery.target==='APPLICATION_CALLBACK'&&delivery.routeState==='configured'&&validCallbackUrl(delivery.callbackUrl)&&application?.authorizedTenantIds.includes(delivery.tenantId)&&application.callbackUrl===delivery.callbackUrl;
  }
  function deliveryAttempt(delivery,outcome) {
    if(!callbackRouteStillValid(delivery)){delivery.state='pending';delivery.error=delivery.routeReason||'原应用及接收地址待确认；未发送结果。';return;}
    if(outcome==='pending')return;
    delivery.attempts.push({attempt:delivery.attempts.length+1,at:new Date().toISOString(),outcome,simulated:true});
    delivery.state=outcome;delivery.error=outcome==='failed'?'合成 DCC 交付失败，等待补送；不重新导入。':'';
  }
  function addFailure(next,entry,spec,deliveryOutcome='failed') {
    failureState(entry);
    let event=entry.failureEvents.find(row=>row.dedupKey===spec.dedupKey);
    const evidence={source:spec.source,raw:clone(spec.raw??null),receivedAt:new Date().toISOString()};
    if(event){
      if(event.evidence.some(row=>row.source===evidence.source&&stable(row.raw)===stable(evidence.raw)))return event;
      event.evidence.push(evidence);
      if(event.reason!==spec.reason||spec.outcomeState==='pending_review'){
        event.version++;event.outcomeState='pending_review';event.reviewReason=spec.reviewReason||'同一导入失败的原始原因或结果证据冲突，保留各来源待核。';
        const detail=entry.failureDetails.find(row=>row.failureId===event.failureId);
        if(detail)Object.assign(detail,clone(event));else entry.failureDetails.push(clone(event));
      }
      return event;
    }
    event={failureId:spec.failureId||'DEMO-FAIL-'+(++next.sequence),dedupKey:spec.dedupKey,version:1,exportedVersions:[],stage:spec.stage,associationState:spec.associationState||'confirmed',outcomeState:spec.outcomeState||'failed',
      tenantId:entry.task.tenantId,taskId:entry.task.taskId,supplierTaskId:entry.task.supplierTaskId,recordId:spec.recordId||'',batchId:spec.batchId||'',supplierFileId:spec.supplierFileId||'',leadCode:spec.leadCode||'',phone:spec.phone||'',reason:spec.reason,originalData:clone(spec.originalData??null),reviewReason:spec.reviewReason||'',evidence:[evidence],createdAt:evidence.receivedAt,deliveryId:''};
    const associated=entry.records.find(row=>row.recordId===event.recordId||event.batchId&&row.batchId===event.batchId);if(associated)Object.assign(event,businessAssociation(associated));
    entry.failureEvents.push(event);
    if(entry.task.source==='api'&&event.stage==='supplier_import'&&event.associationState==='confirmed'&&event.outcomeState==='failed'){
      const delivery={deliveryId:'DEMO-DELIVERY-'+event.failureId,failureId:event.failureId,taskId:entry.task.taskId,tenantId:entry.task.tenantId,...callbackRoute(associated,entry),simulated:true,state:'pending',attempts:[],error:'',
        payload:{stage:'supplier_import',tenantId:event.tenantId,taskId:event.supplierTaskId,localTaskId:event.taskId,batchId:event.batchId,recordId:event.recordId,...businessAssociation(event),...(window.CustomerBusiness?.importSnapshot(associated)||{}),fileId:event.supplierFileId,leadCode:event.leadCode,phone:event.phone,failedReason:event.reason,originalData:clone(event.originalData)}};
      event.deliveryId=delivery.deliveryId;entry.deliveries.push(delivery);deliveryAttempt(delivery,deliveryOutcome);
    }
    entry.failureDetails.push(clone(event));return event;
  }
  function originalRequest(entry,record) { return entry.submissions.find(row=>row.recordId===record.recordId)?.request?.taskTelList?.[0]||{tel:record.phone,priority:record.priorityRaw}; }
  function captureImportFailure(next,entry,record,raw,deliveryOutcome='failed') {
    if(record.importState!=='rejected'||record.reviewReason)return;
    return addFailure(next,entry,{failureId:'DEMO-IMPORT-FAIL-'+record.recordId,dedupKey:'supplier_import:'+record.batchId,stage:'supplier_import',recordId:record.recordId,batchId:record.batchId,supplierFileId:record.supplierFileId,leadCode:record.leadCode,phone:record.phone,reason:record.importReason||'供应商明确拒绝（合成）',originalData:originalRequest(entry,record),source:'合成 API-002 同步失败',raw},deliveryOutcome);
  }
  function seedKnownFailures(next,entry,deliveryOutcome='pending') {
    failureState(entry);
    for(const local of entry.localFailures){
      if(entry.failureEvents.some(event=>event.dedupKey==='local_validation:'+local.failureId))continue;
      addFailure(next,entry,{failureId:local.failureId,dedupKey:'local_validation:'+local.failureId,stage:'local_validation',leadCode:local.row?.leadCode,phone:local.row?.phone||local.row?.tel,reason:local.reason,originalData:local.row,source:'本地逐行校验',raw:local.row},deliveryOutcome);
    }
    for(const record of entry.records){
      if(entry.failureEvents.some(event=>event.dedupKey==='supplier_import:'+record.batchId))continue;
      captureImportFailure(next,entry,record,record.syncResponses?.at(-1)?.raw,deliveryOutcome);
    }
  }
  function failureCompleteness(entry) {
    if(!entry.failureGroups.length)return 'unknown';
    if(entry.failureGroups.some(group=>group.completeness==='pending_review'))return 'pending_review';
    return entry.failureGroups.every(group=>group.completeness==='complete')?'complete':'incomplete';
  }
  function failureView(taskId) {
    const found=lockedTask(taskId);if(!found.ok)return found;
    if(!canAccessTask(found.data.current))return failure('FORBIDDEN','当前身份不能查看该租户失败记录。');
    const next=clone(ledger),entry=next.tasks[taskId];seedKnownFailures(next,entry);
    return success({...entry,wholeImportTerminal:false,failureCompleteness:failureCompleteness(entry),simulated:true});
  }
  function eventRejected(code,reason,event) { return {...failure(code,reason),data:{pendingReview:true,evidence:clone(event??null),simulated:true}}; }
  function mappedTenant(enterpriseId) {
    const key=['string','number'].includes(typeof enterpriseId)?String(enterpriseId):'';
    const mappings=(window.DccMock?.tenantMappings||[]).filter(row=>row.mappingState==='synthetic-confirmed'&&String(row.enterpriseId)===key);
    const matches=[...new Set(mappings.map(row=>row.tenantId))];
    if(matches.length!==1)return null;
    const existing=(window.CloudCallData?.tenants||[]).filter(row=>row.builtIn!==true&&row.tenantId===matches[0]&&String(row.enterpriseId)===key);
    return existing.length===1?matches[0]:null;
  }
  function shardComplete(group) {
    group.seenShardNumbers=Object.keys(group.shards).map(Number).sort((a,b)=>a-b);
    const total=group.totalBatchCount,all=Number.isSafeInteger(total)&&total>0&&group.seenShardNumbers.length===total&&group.seenShardNumbers.every((number,index)=>number===index+1);
    if(all&&group.totalFailedCount!==null&&group.totalFailedCount!==group.failureIds.length)group.reviewReasons.push('已声明失败总数与可识别失败记录数冲突。');
    group.reviewReasons=[...new Set(group.reviewReasons)];
    group.completeness=group.reviewReasons.length?'pending_review':all?'complete':Number.isSafeInteger(total)&&total>0?'incomplete':'unknown';
    group.failurePushGroupComplete=group.completeness==='complete';group.wholeImportTerminal=false;
  }
  function originalMatches(entry,record,original) {
    if(!original||typeof original!=='object'||Array.isArray(original))return false;
    const phone=text(original.tel??original.phone);if(!phone||phone!==record.phone)return false;
    if(Object.hasOwn(original,'leadCode')&&text(original.leadCode)!==record.leadCode)return false;
    if(Object.hasOwn(original,'priority')){
      const raw=original.priority;if(!['string','number'].includes(typeof raw)||typeof raw==='string'&&!raw.trim()||!Number.isFinite(Number(raw))||Number(raw)!==Number(originalRequest(entry,record).priority))return false;
    }
    if(Object.hasOwn(original,'R')&&(!Object.hasOwn(record,'R')||stable(original.R)!==stable(record.R)))return false;
    return true;
  }
  function receiveImportFailure53(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能演示该租户的失败推送。');
    const raw=input?.event;if(!raw||raw.type!==53||!Array.isArray(raw.failedTelList))return eventRejected('INVALID_53','请选择明确的合成 53 失败事件。',raw);
    const tenantId=mappedTenant(raw.enterpriseId),scope=found.data.entry.task;
    if(!tenantId||tenantId!==scope.tenantId||String(raw.enterpriseId)!==String(scope.enterpriseId))return eventRejected('UNVERIFIED_TENANT_MAPPING','企业到租户映射不明或冲突；不回退当前租户，不写业务记录。',raw);
    if(!['string','number'].includes(typeof raw.taskId)||String(raw.taskId)!==scope.supplierTaskId||!text(raw.fileId))return eventRejected('UNKNOWN_SUPPLIER_SCOPE','供应商任务或 fileId 无法准确关联，保留原始事件待核。',raw);
    const next=clone(ledger),entry=next.tasks[input.taskId];seedKnownFailures(next,entry,'failed');
    const groupKey=[String(raw.enterpriseId),scope.supplierTaskId,text(raw.pushGroupId)||text(raw.fileId)].join('|');
    let group=entry.failureGroups.find(row=>row.groupKey===groupKey);
    if(!group){group={groupId:'DEMO-FAIL-GROUP-'+(++next.sequence),groupKey,tenantId,taskId:scope.taskId,supplierTaskId:scope.supplierTaskId,totalBatchCount:null,totalFailedCount:null,declarations:[],shards:{},seenShardNumbers:[],failureIds:[],reviewReasons:[],completeness:'unknown',failurePushGroupComplete:false,wholeImportTerminal:false,syntheticPushGroupId:text(raw.pushGroupId)};entry.failureGroups.push(group);}
    const fingerprint=stable(raw),index=raw.currentBatchCount,prior=group.shards[String(index)];
    if(prior?.versions.some(version=>version.fingerprint===fingerprint))return success({duplicate:true,group,failureIds:group.failureIds,wholeImportTerminal:false});
    const validTotal=Number.isSafeInteger(raw.totalBatchCount)&&raw.totalBatchCount>0,validIndex=Number.isSafeInteger(index)&&index>0&&validTotal&&index<=raw.totalBatchCount;
    group.declarations.push({receivedAt:new Date().toISOString(),totalBatchCount:raw.totalBatchCount??null,currentBatchCount:index??null,totalFailedCount:raw.totalFailedCount??null,fileId:raw.fileId,raw:clone(raw)});
    if(!validTotal||!validIndex)group.reviewReasons.push('总片数或片号缺失/非法，分片声明待核。');
    if(group.totalBatchCount===null&&validTotal)group.totalBatchCount=raw.totalBatchCount;else if(group.totalBatchCount!==raw.totalBatchCount)group.reviewReasons.push('同一失败推送组的总片数声明冲突。');
    if(Object.hasOwn(raw,'totalFailedCount')){
      if(!Number.isSafeInteger(raw.totalFailedCount)||raw.totalFailedCount<0)group.reviewReasons.push('失败总数声明缺失或非法。');
      else if(group.totalFailedCount===null)group.totalFailedCount=raw.totalFailedCount;
      else if(group.totalFailedCount!==raw.totalFailedCount)group.reviewReasons.push('同一失败推送组的失败总数声明冲突。');
    }
    if(prior)group.reviewReasons.push('同一片号收到不同原始内容，保留各版本待核。');
    const shard=prior||{versions:[]};shard.versions.push({fingerprint,receivedAt:new Date().toISOString(),raw:clone(raw)});group.shards[String(index)]=shard;
    for(const failed of raw.failedTelList){
      const original=failed?.originalData,candidates=entry.records.filter(record=>record.supplierFileId===raw.fileId&&originalMatches(entry,record,original));
      const record=candidates.length===1?candidates[0]:null,reason=text(failed?.failedReason);
      const contradicts=record?.syncResponses.some(response=>response.raw?.result===0&&response.raw.data?.taskId===scope.supplierTaskId&&response.raw.data?.fileId===raw.fileId&&response.raw.data?.importTotal===1&&response.raw.data?.successTotal===1&&response.raw.data?.invalidTotal===0);
      const reviewReason=!record?candidates.length?'企业/任务/fileId/原始数据仍有多个候选，不盲配本地批次。':'没有可准确关联的本地单号批次，保留原始数据待核。':!reason?'未明确返回 failedReason，不能补失败原因。':contradicts?'准确同步成功与后到 53 失败矛盾，保留两个来源待核。':group.reviewReasons.length?group.reviewReasons.join('；'):'';
      const event=addFailure(next,entry,{failureId:record?'DEMO-IMPORT-FAIL-'+record.recordId:undefined,dedupKey:record?'supplier_import:'+record.batchId:'review53:'+groupKey+':'+stable(original),stage:reviewReason?'association_review':'supplier_import',associationState:record?'confirmed':'pending_review',outcomeState:reviewReason?'pending_review':'failed',recordId:record?.recordId,batchId:record?.batchId,supplierFileId:raw.fileId,leadCode:record?.leadCode,phone:record?.phone||text(original?.tel??original?.phone),reason:reason||'失败原因未明确返回',originalData:original,reviewReason,source:'合成 API-003 / 53 异步失败',raw:{event:raw,failedRow:failed}},input.deliveryOutcome==='succeeded'?'succeeded':'failed');
      if(!group.failureIds.includes(event.failureId))group.failureIds.push(event.failureId);
      if(record){
        record.importFailureEvidence=[...(record.importFailureEvidence||[]),{source:'合成 53',receivedAt:new Date().toISOString(),raw:clone(failed),groupId:group.groupId}];
        if(reviewReason||event.outcomeState==='pending_review')record.reviewReason=reviewReason||event.reviewReason;
        else {record.importState='rejected';record.importReason=reason;record.reviewReason='';}
      }
    }
    shardComplete(group);
    if(!writeLedger(next))return failure('STORAGE_FAILURE','53 分片与失败证据未保存。');
    notifyRecords(scope.taskId);return success({duplicate:false,group,failureIds:group.failureIds,wholeImportTerminal:false});
  }
  function createFailureSnapshot(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能导出该租户失败明细。');
    const next=clone(ledger),entry=next.tasks[input.taskId];seedKnownFailures(next,entry,'failed');
    const selected=input.failureIds;if(selected!==undefined&&(!Array.isArray(selected)||selected.some(id=>!entry.failureDetails.some(row=>row.failureId===id))))return failure('UNKNOWN_FAILURE','选中的失败明细不存在于当前任务。');
    const details=entry.failureDetails.filter(row=>selected===undefined||selected.includes(row.failureId));if(!details.length)return failure('NO_FAILURE_DETAILS','没有本次可导出的失败明细；未收到 53 不推定零失败。');
    const snapshotId='DEMO-EXPORT-'+(++next.sequence),cell=value=>{let valueText=String(value??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(valueText))valueText="'"+valueText;return '"'+valueText.replaceAll('"','""')+'"';};
    const header=['stage','tenantId','taskId','supplierTaskId','batchId','leadCode','phone','reason','outcomeState'];
    const snapshot={snapshotId,taskId:entry.task.taskId,tenantId:entry.task.tenantId,createdAt:new Date().toISOString(),members:details.map(row=>({failureId:row.failureId,version:row.version})),memberIds:details.map(row=>row.failureId),details:clone(details),completeness:failureCompleteness(entry),groups:clone(entry.failureGroups),wholeImportTerminal:false,state:'generated',history:[],simulated:true,file:{name:snapshotId+'.csv',content:'\uFEFF'+[header.join(','),...details.map(row=>header.map(key=>cell(row[key])).join(','))].join('\r\n')}};
    entry.exportSnapshots.push(snapshot);if(!writeLedger(next))return failure('STORAGE_FAILURE','导出快照未保存。');notifyRecords(entry.task.taskId);return success(snapshot);
  }
  function recordSnapshotDownload(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能改变该租户下载状态。');
    const next=clone(ledger),entry=failureState(next.tasks[input.taskId]),snapshot=entry.exportSnapshots.find(row=>row.snapshotId===input.snapshotId);
    if(!snapshot)return failure('UNKNOWN_SNAPSHOT','该快照不属于当前任务。');
    if(!['clicked','failed','interrupted','succeeded'].includes(input.outcome))return failure('INVALID_OUTCOME','请选择明确的合成下载结果。');
    if(input.outcome==='succeeded'&&input.trustedSyntheticCompletion!==true&&!(input.trustedFileCompletion===true&&input.completionEvidence?.method==='file-system-access'&&input.completionEvidence.closed===true&&input.completionEvidence.readBackVerified===true&&input.completionEvidence.bytes===new Blob([snapshot.file?.content||'']).size))return failure('UNTRUSTED_COMPLETION','生成或点击文件不代表下载成功；需要独立的可信合成成功信号。');
    if(snapshot.state==='succeeded')return success(snapshot);
    snapshot.history.push({outcome:input.outcome,at:new Date().toISOString(),trustedSyntheticCompletion:input.trustedSyntheticCompletion===true,completionEvidence:input.completionEvidence?clone(input.completionEvidence):null,simulated:input.trustedFileCompletion!==true});snapshot.state=input.outcome;
    if(input.outcome==='succeeded'){
      entry.failureDetails=entry.failureDetails.filter(detail=>!snapshot.members.some(member=>member.failureId===detail.failureId&&member.version===detail.version));
      for(const member of snapshot.members){const event=entry.failureEvents.find(row=>row.failureId===member.failureId);if(event&&!event.exportedVersions.includes(member.version))event.exportedVersions.push(member.version);}
      snapshot.file=null;snapshot.details=[];
    }
    if(!writeLedger(next))return failure('STORAGE_FAILURE','下载状态未保存，明细与文件保持原样。');notifyRecords(entry.task.taskId);return success(snapshot);
  }
  function retryDelivery(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能补送该租户结果。');
    if(found.data.entry.task.source!=='api')return failure('LOCKED_SOURCE','手工任务仅平台查看，不向 DCC 交付。');
    if(!['succeeded','failed'].includes(input.outcome))return failure('INVALID_OUTCOME','请选择明确的合成交付结果。');
    const next=clone(ledger),entry=failureState(next.tasks[input.taskId]);seedKnownFailures(next,entry,'pending');
    const delivery=entry.deliveries.find(row=>row.deliveryId===input.deliveryId);
    if(!delivery)return failure('UNKNOWN_DELIVERY','该交付不属于当前任务。');if(!callbackRouteStillValid(delivery))return failure('CALLBACK_ROUTE_PENDING','原应用或回调地址已变化，不能向其他接收端补送。');if(delivery.state==='succeeded')return success(delivery);
    deliveryAttempt(delivery,input.outcome);if(!writeLedger(next))return failure('STORAGE_FAILURE','补送结果未保存。');notifyRecords(entry.task.taskId);return success(delivery);
  }
  function prepareFailureDemo(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能准备此任务合成样例。');
    const scenarioId='STEP06-THREE',scenario=window.DccMock?.importScenarios?.[scenarioId];if(!scenario)return failure('UNKNOWN_SCENARIO','合成分片样例尚未装载。');
    const result=found.data.entry.task.source==='api'?simulateDccImport({taskId:input.taskId,scenarioId}):importManual({taskId:input.taskId,scenarioId,rows:clone(scenario.rows)});if(!result.ok)return result;
    const next=clone(ledger),entry=next.tasks[input.taskId];failureState(entry);entry.failureDemo={groupId:'DEMO-PUSH-GROUP-'+(++next.sequence),recordIds:result.data.rows.filter(row=>row.ok).map(row=>row.recordId),simulated:true};
    if(!writeLedger(next))return failure('STORAGE_FAILURE','合成样例关联未保存。');notifyRecords(input.taskId);return success({...result.data,failureDemo:entry.failureDemo});
  }
  function simulateFailure53(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能演示此任务失败分片。');
    const scenario=window.DccMock?.failureShardScenarios?.[input.scenarioId],entry=found.data.entry;if(!scenario||!entry.failureDemo)return failure('UNKNOWN_SCENARIO','请先准备四条合成线索，再选择失败分片。');
    const record=entry.records.find(row=>row.recordId===entry.failureDemo.recordIds[scenario.rowIndex]);if(!record?.supplierFileId)return failure('UNKNOWN_FILE','合成单号尚无准确 fileId；请等待自动提交结果。');
    const event={type:53,enterpriseId:entry.task.enterpriseId,taskId:entry.task.supplierTaskId,fileId:record.supplierFileId,fileName:'合成单号批次',pushGroupId:entry.failureDemo.groupId,totalBatchCount:scenario.totalBatchCount,currentBatchCount:scenario.currentBatchCount,totalFailedCount:scenario.totalFailedCount,failedTelList:[{originalData:{...originalRequest(entry,record),leadCode:record.leadCode,...(Object.hasOwn(record,'R')?{R:record.R}:{})},failedReason:scenario.failedReason}]};
    return receiveImportFailure53({taskId:input.taskId,event,deliveryOutcome:scenario.deliveryOutcome});
  }

  function resultState(entry) {
    failureState(entry);['actualResults','resultReviews','queryEvidence'].forEach(key=>{if(!Array.isArray(entry[key]))entry[key]=[];});return entry;
  }
  function finishInterpretation(raw,source) {
    const provided=Object.hasOwn(raw,'finishRetryFlag'),value=provided?raw.finishRetryFlag:null;
    return {raw:value===undefined?null:clone(value),provided,interpretation:typeof value==='number'&&Number.isInteger(value)&&value===1?'last':typeof value==='number'&&Number.isInteger(value)&&value===0?'not_last':'unknown',source};
  }
  function deriveCallResult(raw) {
    const answered=typeof raw.customerAnswered==='boolean'?raw.customerAnswered:null;
    const duration=Object.hasOwn(raw,'customerBridgeDuration')?raw.customerBridgeDuration:null;
    const trusted=raw.durationIsTrusted===true&&typeof duration==='number'&&Number.isFinite(duration)&&duration>=0;
    const short=answered===true&&raw.hangupParty==='customer'&&trusted&&duration<=2;
    const shortState=short?'confirmed':answered===false||['agent','other'].includes(raw.hangupParty)||answered===true&&raw.hangupParty==='customer'&&trusted&&duration>2?'not_short':'pending_review';
    return {customerAnswered:answered,agentAnswered:typeof raw.agentAnswered==='boolean'?raw.agentAnswered:null,customerBridgeDuration:duration===undefined?null:clone(duration),durationIsTrusted:trusted,shortHangup:short,shortHangupState:shortState,outcomeState:raw.kind==='no_cdr_failure'?'failed':answered===null||shortState==='pending_review'?'unknown':answered?'answered':'not_answered'};
  }
  function addResultReview(next,entry,raw,reason,existing,blocksResult=true) {
    resultState(entry);const fingerprint=stable(raw),prior=entry.resultReviews.find(row=>row.fingerprint===fingerprint&&row.reason===reason);
    if(prior)return {duplicate:true,pendingReview:true,review:prior,result:existing||null,newCall:false};
    const review={reviewId:'DEMO-RESULT-REVIEW-'+(++next.sequence),resultId:existing?.resultId||'',associationState:'pending_review',reason,blocksResult,raw:clone(raw??null),source:text(raw?.source)||'合成结果证据',fingerprint,receivedAt:new Date().toISOString()};entry.resultReviews.push(review);
    if(existing){if(blocksResult)existing.reviewReasons=[...new Set([...existing.reviewReasons,reason])];existing.evidence.push({raw:clone(raw),source:review.source,fingerprint,receivedAt:review.receivedAt,pendingReview:true});}
    return {duplicate:false,pendingReview:true,review,result:existing||null,newCall:false};
  }
  function resultDelivery(next,entry,result,raw,stage,deliveryOutcome) {
    if(entry.task.source!=='api')return;
    const delivery={deliveryId:'DEMO-RESULT-DELIVERY-'+result.resultId+'-V'+result.version,resultId:result.resultId,resultVersion:result.version,stage,taskId:entry.task.taskId,tenantId:entry.task.tenantId,...callbackRoute(entry.records.find(row=>row.recordId===result.recordId),entry),simulated:true,state:'pending',attempts:[],error:'',
      payload:{stage,tenantId:entry.task.tenantId,taskId:entry.task.supplierTaskId,localTaskId:entry.task.taskId,recordId:result.recordId,batchId:result.batchId,...businessAssociation(result),...(window.CustomerBusiness?.importSnapshot(result)||{}),fileId:result.supplierFileId,leadCode:result.leadCode,phone:result.phone,callID:result.callID||null,eventId:result.eventId||null,customerAnswered:result.customerAnswered,agentAnswered:result.agentAnswered,customerBridgeDuration:result.customerBridgeDuration,durationIsTrusted:result.durationIsTrusted,shortHangup:result.shortHangup,shortHangupState:result.shortHangupState,finishRetryFlag:clone(result.finishRetryFlag),failureReason:result.values.failureReason??null,obSipCause:result.values.obSipCause??null,obSipCode:result.values.obSipCode??null,sipCause:result.values.sipCause??null,sipCode:result.values.sipCode??null,sipCauseAsyncUpdateFlag:raw.sipCauseAsyncUpdateFlag??null,source:text(raw.source)||'合成每次结果',raw:clone(raw)}};
    entry.deliveries.push(delivery);result.deliveryIds.push(delivery.deliveryId);deliveryAttempt(delivery,deliveryOutcome==='succeeded'?'succeeded':'failed');
  }
  function resultView(taskId) {
    const found=lockedTask(taskId);if(!found.ok)return found;if(!canAccessTask(found.data.current))return failure('FORBIDDEN','当前身份不能查看该租户实际结果。');
    const next=clone(ledger),entry=resultState(next.tasks[taskId]);
    return success({...entry,callObjectCount:entry.actualResults.filter(row=>row.kind==='call').length,noCdrEventCount:entry.actualResults.filter(row=>row.kind==='no_cdr_failure').length,taskCompleteFromFinishFlag:false,dccPlanComplete:false,currentState:entry.actualResults.length?'observed':'unknown',simulated:true});
  }
  // Display facts only: one completed/connected customer per original import row.
  // A known customer answer does not depend on a final CDR or short-hangup classification.
  function taskProgressView(taskId) {
    const found=lockedTask(taskId);if(!found.ok)return found;
    if(!canAccessTask(found.data.current))return failure('FORBIDDEN','当前身份不能查看该租户任务进展。');
    const entry=found.data.entry,scope=entry.task,records=new Map(),duplicates=new Set();
    for(const row of entry.records){if(!row||!text(row.recordId)||records.has(row.recordId)){if(row)duplicates.add(row.recordId);continue;}if(row.taskId===scope.taskId&&row.tenantId===scope.tenantId&&row.enterpriseId===scope.enterpriseId&&text(row.batchId)&&text(row.phone))records.set(row.recordId,row);}
    duplicates.forEach(id=>records.delete(id));
    let nativeRows=[];try{nativeRows=JSON.parse(localStorage.getItem('native-workbench-records-v1')||'[]');if(!Array.isArray(nativeRows))throw Error();}catch(_){return failure('NATIVE_RECORDS_UNAVAILABLE','已保存通话暂时无法核对，任务进展待确认。');}
    const native=new Map(),ambiguous=new Set();for(const call of nativeRows){if(!call||!text(call.callId))continue;if(native.has(call.callId))ambiguous.add(call.callId);else native.set(call.callId,call);}ambiguous.forEach(id=>native.delete(id));
    const calls=new Map(),completed=new Set(),connected=new Set();let anomalies=0,short=0,shortPending=0;
    const exactNative=(call,record)=>{
      const assignment=record.workbenchAssignment,origin=predictiveApiOrigin(record,entry);
      if(!assignment?.callIds?.includes(call?.callId)||call.callSource!=='NATIVE_WORKBENCH'||call.simulation!==true||call.tenantId!==scope.tenantId||call.enterpriseId!==scope.enterpriseId||call.customerTaskItemId!==record.recordId||call.callee!==record.phone||call.accountId!==assignment.accountId||call.contactCenterIdentityId!==assignment.seatIdentityId||stable(call.apiOrigin||null)!==stable(origin))return false;
      if(call.callType==='预外呼')return call.workbenchKind==='predictive'&&call.taskId===scope.taskId;
      return call.callType==='人工外呼'&&call.predictiveFollowupOrigin?.originalTaskId===scope.taskId&&assignment.callIds.includes(call.predictiveFollowupOrigin.originCallId);
    };
    for(const record of records.values())for(const id of record.workbenchAssignment?.callIds||[]){
      const call=native.get(id);if(!call||!exactNative(call,record))continue;
      const state=window.CallState?.view?.(call);if(!state)continue;
      const ended=state.ended===true&&!!text(call.endedAt),answered=typeof state.answered==='boolean'?state.answered:null;
      calls.set(id,{callId:id,recordId:record.recordId,answered,ended,source:'native',shortHangupState:'pending_review',shortHangup:false});
    }
    const rawResults=Array.isArray(entry.actualResults)?entry.actualResults:[],resultIds=new Set(),duplicateResults=new Set();
    for(const row of rawResults){const id=row?.kind==='call'?text(row.callID):text(row?.eventId||row?.resultId);if(id&&resultIds.has(id))duplicateResults.add(id);else if(id)resultIds.add(id);}
    for(const row of rawResults){
      const record=records.get(row?.recordId),id=row?.kind==='call'?text(row.callID):text(row?.eventId||row?.resultId);
      if(!record||!id||duplicateResults.has(id)||row.associationState!=='confirmed'||row.taskId!==scope.taskId||row.tenantId!==scope.tenantId||row.enterpriseId!==scope.enterpriseId||row.supplierTaskId!==scope.supplierTaskId||row.batchId!==record.batchId||row.phone!==record.phone||row.leadCode!==record.leadCode||row.values?.evidenceTrusted!==true)continue;
      if(row.nativeWorkbenchCallId){const fact=calls.get(row.nativeWorkbenchCallId);if(fact&&row.nativeWorkbenchCallId===id){fact.shortHangupState=row.shortHangupState;fact.shortHangup=row.shortHangup===true;}continue;}
      if(row.reviewReasons?.length)continue;
      if(row.kind==='no_cdr_failure'){anomalies++;continue;}
      if(row.kind!=='call'||calls.has(id))continue;
      calls.set(id,{callId:id,recordId:record.recordId,answered:typeof row.customerAnswered==='boolean'?row.customerAnswered:null,ended:!!text(row.values.endedAt),source:'result',shortHangupState:row.shortHangupState,shortHangup:row.shortHangup===true});
    }
    const facts=[...calls.values()];for(const call of facts){if(call.ended)completed.add(call.recordId);if(call.answered===true)connected.add(call.recordId);if(call.answered===true&&call.shortHangupState==='confirmed'&&call.shortHangup)short++;if(call.answered===true&&call.shortHangupState==='pending_review')shortPending++;}
    const callSummary={calls:facts.length,answered:facts.filter(call=>call.answered===true).length,unanswered:facts.filter(call=>call.answered===false).length,unknown:facts.filter(call=>call.ended&&call.answered===null).length,inFlight:facts.filter(call=>!call.ended).length,short,shortPending,anomalies,reviews:(entry.resultReviews||[]).length};
    return success({total:records.size,completed:completed.size,connected:connected.size,callSummary,readOnly:true,simulated:true});
  }
  function receiveCallResult(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能演示该租户每次结果。');
    const raw=input?.result,scope=found.data.entry.task;
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return failure('INVALID_RESULT','请提供明确的合成结果证据。');
    if(mappedTenant(raw.enterpriseId)!==scope.tenantId||String(raw.enterpriseId)!==String(scope.enterpriseId)||!['string','number'].includes(typeof raw.taskId)||String(raw.taskId)!==scope.supplierTaskId)return eventRejected('UNVERIFIED_RESULT_SCOPE','企业/租户/供应商任务范围不明或冲突，不写跨范围结果。',raw);
    const next=clone(ledger),entry=resultState(next.tasks[input.taskId]);
    const identity=value=>['string','number'].includes(typeof value)&&String(value).trim()?String(value).trim():'';
    const callID=identity(raw.callID),eventId=identity(raw.eventId),kind=raw.kind;
    const identityKey=kind==='no_cdr_failure'?(eventId?'event:'+eventId:callID?'call:'+callID:''):callID?'call:'+callID:'';
    const existing=identityKey?entry.actualResults.find(row=>row.identityKey===identityKey):null,fingerprint=stable(raw);
    const pending=(reason,blocksResult=true)=>{const result=addResultReview(next,entry,raw,reason,existing,blocksResult);if(!result.duplicate&&!writeLedger(next))return failure('STORAGE_FAILURE','结果待核证据未保存。');notifyRecords(scope.taskId);return success(result);};
    if(raw.evidenceTrusted!==true)return pending('实际事件、字段语义或来源尚未可信确认，不伪造真实结果。',false);
    if(!['call','no_cdr_failure','sip_update'].includes(kind)||!identityKey)return pending('缺少可信 callID 或稳定无话单事件标识，关联待核，不补造标识或话单。');
    if(existing?.evidence.some(row=>row.fingerprint===fingerprint))return success({duplicate:true,pendingReview:existing.reviewReasons.length>0,result:existing,newCall:false});
    const phone=text(raw.phone??raw.tel),hasSelector=!!(text(raw.recordId)||text(raw.batchId)||text(raw.fileId));
    const candidates=entry.records.filter(record=>(!raw.recordId||record.recordId===raw.recordId)&&(!raw.batchId||record.batchId===raw.batchId)&&(!raw.fileId||record.supplierFileId===raw.fileId||(entry.failureRetryAttempts||[]).some(attempt=>attempt.recordId===record.recordId&&attempt.supplierFileId===raw.fileId&&attempt.state==='accepted'))&&(!phone||record.phone===phone)&&(!Object.hasOwn(raw,'leadCode')||text(raw.leadCode)===record.leadCode));
    const record=hasSelector&&phone&&candidates.length===1?candidates[0]:existing&&!hasSelector&&(!phone||phone===existing.phone)&&(!Object.hasOwn(raw,'leadCode')||text(raw.leadCode)===existing.leadCode)?entry.records.find(row=>row.recordId===existing.recordId):null;
    if(!record)return pending('结果的本次任务/批次/原始号码不能唯一关联，不按最近同号盲配。');
    if(existing&&existing.recordId!==record.recordId)return pending('同一稳定结果标识的批次或号码关联冲突，保留原关联待核。');
    if(existing&&text(raw.fileId)&&text(raw.fileId)!==existing.supplierFileId)return pending('同一呼叫的供应商批次与原尝试不一致，保留原关联待核，不跨补提交尝试更新。');
    if(kind==='no_cdr_failure'&&!text(raw.failureReason))return pending('可信无话单失败还需原始原因，不能由空话单查询补造失败。');
    if(kind==='sip_update'&&!existing)return pending('SIP 晚更新缺少已准确关联的原呼叫对象，不新增呼叫。');
    if(existing){
      if(kind!=='sip_update'||existing.kind!=='call'||raw.sipCauseAsyncUpdateFlag!==1)return pending('同一呼叫或事件收到不同非 SIP 结果，保留原始来源待核，不替换原结果。');
      const fields=['customerAnswered','agentAnswered','hangupParty','onHookSource','customerBridgeDuration','durationIsTrusted','agentBridgeDuration','finishRetryFlag','failureReason','callStatus','status','statusDesc','degradeRound'];
      if(fields.some(key=>Object.hasOwn(raw,key)&&stable(raw[key])!==stable(existing.values[key])))return pending('SIP 更新同时改变非 SIP 业务结果或最后一通声明，保留冲突待核。');
      if(existing.reviewReasons.length)return pending('原呼叫已有非 SIP 结果冲突，晚更新保留待核，不覆盖其业务结果。');
      ['sipCause','obSipCause','obSipCode','sipCode','sipCauseAsyncUpdateFlag'].forEach(key=>{if(Object.hasOwn(raw,key))existing.values[key]=raw[key]===undefined?null:clone(raw[key]);});
      existing.version++;existing.updatedAt=new Date().toISOString();existing.sipUpdates.push({source:text(raw.source)||'合成 SIP 异步更新',receivedAt:existing.updatedAt,raw:clone(raw)});existing.evidence.push({source:text(raw.source)||'合成 SIP 异步更新',receivedAt:existing.updatedAt,fingerprint,raw:clone(raw)});
      resultDelivery(next,entry,existing,raw,'sip_update',input.deliveryOutcome);
      if(!writeLedger(next))return failure('STORAGE_FAILURE','同一呼叫 SIP 更新未保存。');notifyRecords(scope.taskId);return success({duplicate:false,updated:true,result:existing,newCall:false});
    }
    const result={resultId:'DEMO-RESULT-'+(++next.sequence),identityKey,kind,tenantId:scope.tenantId,enterpriseId:entry.task.enterpriseId,taskId:scope.taskId,supplierTaskId:scope.supplierTaskId,recordId:record.recordId,batchId:record.batchId,...businessAssociation(record),supplierFileId:text(raw.fileId)||record.supplierFileId,...((entry.failureRetryAttempts||[]).find(attempt=>attempt.recordId===record.recordId&&attempt.supplierFileId===text(raw.fileId))?{failureRetryAttemptId:entry.failureRetryAttempts.find(attempt=>attempt.recordId===record.recordId&&attempt.supplierFileId===text(raw.fileId)).attemptId}:{}),leadCode:record.leadCode,phone:record.phone,...(window.CustomerBusiness?.importSnapshot(record)||{}),callID,eventId,associationState:'confirmed',version:1,values:clone(raw),...deriveCallResult(raw),finishRetryFlag:finishInterpretation(raw,text(raw.source)||'合成每次结果'),evidence:[{source:text(raw.source)||'合成每次结果',receivedAt:new Date().toISOString(),fingerprint,raw:clone(raw)}],sipUpdates:[],reviewReasons:[],deliveryIds:[],createdAt:new Date().toISOString(),simulated:true};
    entry.actualResults.push(result);ensureFailureRetryPlan(next,entry,record,result);record.callState=entry.actualResults.some(row=>row.recordId===record.recordId&&row.kind==='call')?'observed':'failure_event_observed';
    resultDelivery(next,entry,result,raw,kind==='no_cdr_failure'?'no_cdr_failure':'call_result',input.deliveryOutcome);
    if(!writeLedger(next))return failure('STORAGE_FAILURE','本次实际结果未保存。');notifyRecords(scope.taskId);return success({duplicate:false,result,newCall:kind==='call'});
  }
  function observeCdrQuery(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能演示该租户查询证据。');
    if(!Array.isArray(input.rows)||input.rows.length)return failure('INVALID_QUERY','此合成入口仅记录空话单查询；非空结果需逐条准确关联。');
    const next=clone(ledger),entry=resultState(next.tasks[input.taskId]);const evidence={queryId:'DEMO-CDR-QUERY-'+(++next.sequence),source:text(input.source)||'合成 API-004 空查询',receivedAt:new Date().toISOString(),raw:[],currentState:'unknown',reason:'空查询不足以证明未拨、失败或最后一次；不产生呼叫或 DCC 失败交付。'};entry.queryEvidence.push(evidence);
    if(!writeLedger(next))return failure('STORAGE_FAILURE','空查询证据未保存。');notifyRecords(input.taskId);return success({evidence,resultCreated:false,currentState:'unknown'});
  }
  function prepareResultDemo(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能准备本任务结果样例。');
    const scenarioId='STEP07-BASE',scenario=window.DccMock?.importScenarios?.[scenarioId];if(!scenario)return failure('UNKNOWN_SCENARIO','合成结果线索尚未装载。');
    const imported=found.data.entry.task.source==='api'?simulateDccImport({taskId:input.taskId,scenarioId}):importManual({taskId:input.taskId,scenarioId,rows:clone(scenario.rows)});if(!imported.ok)return imported;
    const next=clone(ledger),entry=resultState(next.tasks[input.taskId]);entry.resultDemo={recordId:imported.data.rows.find(row=>row.ok)?.recordId||'',identityPrefix:'DEMO-ACTUAL-'+(++next.sequence),simulated:true};if(!writeLedger(next))return failure('STORAGE_FAILURE','结果样例关联未保存。');notifyRecords(input.taskId);return success({...imported.data,resultDemo:entry.resultDemo});
  }
  function simulateCallResult(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能演示本任务结果。');
    const scenario=window.DccMock?.resultScenarios?.[input.scenarioId],entry=found.data.entry;if(!scenario)return failure('UNKNOWN_SCENARIO','请选择已定义的合成结果样例。');
    if(scenario.kind==='empty_query')return observeCdrQuery({taskId:input.taskId,rows:[],source:'合成 API-004 空话单查询'});
    const record=entry.records.find(row=>row.recordId===entry.resultDemo?.recordId);if(!record?.supplierFileId)return failure('UNKNOWN_DEMO_RECORD','请先准备结果线索并等待自动提交返回准确 fileId。');
    const result={enterpriseId:entry.task.enterpriseId,taskId:entry.task.supplierTaskId,recordId:record.recordId,batchId:record.batchId,fileId:record.supplierFileId,phone:record.phone,leadCode:record.leadCode,...clone(scenario.result),...(scenario.callSuffix?{callID:entry.resultDemo.identityPrefix+'-'+scenario.callSuffix}:{}),...(scenario.eventSuffix?{eventId:entry.resultDemo.identityPrefix+'-'+scenario.eventSuffix}:{})};
    return receiveCallResult({taskId:input.taskId,result,deliveryOutcome:scenario.deliveryOutcome});
  }

  // 本地合成失败补提交：与业务系统结果补送、供应商原生重呼分别计账。
  const autoFailureReasons=['运营商禁呼','运营商限呼','外呼黑名单'];
  const manualFailureReasons=['无可用中继','bad tel','真实号码为空!','no clid','bad clid','无可用中继信息','wrong obClidGroup','bad timeout range'];
  const failureReasonAliases={'restrict tel':'外呼黑名单','真实号码为空！':'真实号码为空!'};
  const attemptStates=['dispatching','accepted','rejected','unknown'];
  const retryClock=input=>input?.now===undefined?Date.now():Date.parse(input.now);
  const retryKey=(entry,record)=>JSON.stringify([entry.task.tenantId,entry.task.taskId,record.leadCode,record.phone]);
  function retryState(entry){resultState(entry);for(const field of ['failureRetryPlans','failureRetryAttempts']){if(Object.hasOwn(entry,field)&&!Array.isArray(entry[field]))entry.failureRetryStateInvalid=true;if(!Array.isArray(entry[field]))entry[field]=[];}return entry;}
  function retryQuota(entry,record) {
    const key=retryKey(entry,record),attempts=entry.failureRetryAttempts||[];
    if(entry.failureRetryStateInvalid===true||attempts.some(row=>!row||!text(row.attemptId)||!text(row.quotaKey)||!attemptStates.includes(row.state)))return {key,limit:2,used:0,occupied:2,unknown:2,remaining:0,invalid:true};
    const same=attempts.filter(row=>row.quotaKey===key);
    return {key,limit:2,used:same.filter(row=>['accepted','rejected'].includes(row.state)).length,occupied:same.length,unknown:same.filter(row=>['unknown','dispatching'].includes(row.state)).length,remaining:Math.max(0,2-same.length),invalid:false};
  }
  function retryFailureReason(result) {
    const raw=result?.values||{},provided=text(raw.failureReason);
    // 不由含糊文本、号码编码或空话单猜测补提交类别。
    return failureReasonAliases[provided]||provided;
  }
  function retryEligibility(entry,record,result) {
    if(!record||!result||result.associationState!=='confirmed'||result.reviewReasons?.length||result.values?.evidenceTrusted!==true)return {allowed:false,reason:'失败结果或客户关联待确认'};
    if(result.shortHangupState==='confirmed'&&result.shortHangup===true)return {allowed:false,reason:'秒挂只保存并回传结果，不补提交'};
    if(result.customerAnswered!==false||!['no_cdr_failure','call'].includes(result.kind))return {allowed:false,reason:'本次不是已确认的未接通失败'};
    const reason=retryFailureReason(result);
    if(reason==='呼叫过频')return {allowed:false,reason:'呼叫过频按任务重呼规则处理，不补提交'};
    const mode=autoFailureReasons.includes(reason)?'auto':manualFailureReasons.includes(reason)?'manual':'';
    if(!mode)return {allowed:false,reason:'失败原因尚未纳入补提交范围'};
    if(!text(result.values.fileId)||result.values.fileId!==result.supplierFileId)return {allowed:false,reason:'本次供应商批次未准确确认'};
    return {allowed:true,mode,reason};
  }
  function ensureFailureRetryPlan(next,entry,record,result) {
    retryState(entry);
    const eligibility=retryEligibility(entry,record,result);
    result.failureRetryDecision={...eligibility,platformResubmitAllowed:eligibility.allowed===true,simulated:true};
    if(!eligibility.allowed)return;
    const generationKey=JSON.stringify([record.recordId,result.supplierFileId]);
    const existing=entry.failureRetryPlans.find(row=>row.generationKey===generationKey);
    if(existing){result.failureRetryPlanId=existing.planId;return;}
    const confirmedAt=result.createdAt,plan={planId:'DEMO-FAIL-RETRY-PLAN-'+(++next.sequence),generationKey,quotaKey:retryKey(entry,record),triggerResultId:result.resultId,recordId:record.recordId,tenantId:entry.task.tenantId,taskId:entry.task.taskId,supplierTaskId:entry.task.supplierTaskId,leadCode:record.leadCode,phone:record.phone,rootBatchId:record.rootBatchId||record.batchId,originalBatchId:record.batchId,triggerFileId:result.supplierFileId,priority:record.priority,sourceApplicationId:record.sourceApplicationId||'',mode:eligibility.mode,reason:eligibility.reason,confirmedAt,dueAt:eligibility.mode==='auto'?new Date(Date.parse(confirmedAt)+120000).toISOString():null,state:'queued',attemptId:'',simulated:true};
    entry.failureRetryPlans.push(plan);result.failureRetryPlanId=plan.planId;
  }
  function retryPlanBlock(entry,current,plan,record,clock) {
    const result=entry.actualResults.find(row=>row.resultId===plan.triggerResultId);
    const eligible=retryEligibility(entry,record,result);
    if(!eligible.allowed)return eligible.reason;
    if(plan.quotaKey!==retryKey(entry,record)||plan.phone!==record.phone||plan.leadCode!==record.leadCode||plan.originalBatchId!==record.batchId||plan.rootBatchId!==(record.rootBatchId||record.batchId)||plan.priority!==record.priority||plan.triggerFileId!==result.supplierFileId)return '原始导入关联已变化，请核对';
    if(record.supplierDeleted===true)return '该号码已移除，不再补提交';
    if(['已终止','已完成','已删除','结束'].includes(current.status)||String(current.providerStatusCode)==='3')return '任务已结束，不再补提交';
    if(current.status!=='执行中')return current.status==='已暂停'?'任务已暂停，恢复后再处理':'任务尚未运行';
    if(current.alictiTaskControlPending||current.resourcePause||current.stopNewDialing)return '任务正待核对或已停止新呼叫，暂不补提交';
    const statuses=[current.providerStatusCode,current.alictiMockTaskProperty?.status,current.alictiControlResponse?.result===0?current.alictiControlResponse.data?.taskProperty?.status:undefined].filter(value=>value!==undefined&&value!==null&&value!=='');if(statuses.some(value=>String(value)!=='1'))return '供应商运行状态待确认，暂不补提交';
    const quota=retryQuota(entry,record);
    if(quota.invalid)return '次数记录待确认，不能再次提交';
    if(quota.unknown)return '上次提交结果待确认，请勿重复提交';
    if(!quota.remaining)return '额外 2 次补提交已用完';
    if(plan.state!=='queued')return plan.state==='attempted'?'本次失败已经处理':'本次计划已经取消';
    const simulation=entry.failureRetrySimulation;
    if(simulation?.confirmed!==true||simulation.nativeRetryExcluded!==true||plan.mode==='auto'&&simulation.navigationReady!==true)return '演示执行条件待确认';
    if(plan.mode==='auto'&&(!Number.isFinite(clock)||clock<Date.parse(plan.dueAt)))return '等待 2 分钟后自动补提交';
    return '';
  }
  function failureRetryView(taskId) {
    const found=lockedTask(taskId);if(!found.ok)return found;
    if(!canAccessTask(found.data.current))return failure('FORBIDDEN','当前身份不能查看该任务补提交。');
    const entry=retryState(clone(found.data.entry)),clock=Date.now();
    const plans=entry.failureRetryPlans.map(plan=>{const record=entry.records.find(row=>row.recordId===plan.recordId),quota=record?retryQuota(entry,record):{limit:2,used:0,occupied:0,unknown:0,remaining:0};return {...plan,quota,secondsRemaining:plan.dueAt?Math.max(0,Math.ceil((Date.parse(plan.dueAt)-clock)/1000)):0,blockReason:record?retryPlanBlock(entry,found.data.current,plan,record,clock):'原客户记录待确认',canExecute:record&&canAccessTask(found.data.current,true)&&!retryPlanBlock(entry,found.data.current,plan,record,clock)};});
    return success({plans,attempts:entry.failureRetryAttempts,simulation:entry.failureRetrySimulation||null,simulated:true,productionReady:false});
  }
  function confirmFailureRetryDemo(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能确认本任务演示条件。');
    if(input.confirmed!==true||input.nativeRetryExcluded!==true||input.navigationReady!==true)return failure('UNCONFIRMED_DEMO','请明确确认仅用于合成演示的互斥和线路条件。');
    if(!['accepted','rejected','unknown'].includes(input.outcome||'accepted'))return failure('INVALID_OUTCOME','请选择明确的合成提交结果。');
    const next=clone(ledger),entry=retryState(next.tasks[input.taskId]);entry.failureRetrySimulation={confirmed:true,nativeRetryExcluded:true,navigationReady:true,outcome:input.outcome||'accepted',confirmedBy:window.AppState.get().accountId,confirmedAt:new Date().toISOString(),simulated:true,productionReady:false};
    if(!writeLedger(next))return failure('STORAGE_FAILURE','演示条件未保存。');notifyRecords(input.taskId);return success(entry.failureRetrySimulation);
  }
  function applyFailureRetryResponse(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能核对补提交结果。');
    const next=clone(ledger),entry=retryState(next.tasks[input.taskId]),attempt=entry.failureRetryAttempts.find(row=>row.attemptId===text(input.attemptId));
    if(!attempt)return failure('UNKNOWN_ATTEMPT','本次补提交不存在。');
    const raw=input.response==null?null:clone(input.response),fingerprint=stable(raw);
    if(attempt.responses?.some(row=>row.fingerprint===fingerprint))return success({...attempt,replayed:true});
    if(!['unknown','dispatching'].includes(attempt.state))return failure('ATTEMPT_ALREADY_CONFIRMED','本次提交已有明确结果，不能用新的响应覆盖。');
    if(!attempt.responses)attempt.responses=[];attempt.responses.push({raw,fingerprint,receivedAt:new Date().toISOString(),simulated:true});
    let state='unknown',reason='提交结果待确认，保留本次占用，请勿重复提交',fileId='';
    const record=entry.records.find(row=>row.recordId===attempt.recordId),declared={taskId:attempt.supplierTaskId,supplierTaskId:attempt.supplierTaskId,localTaskId:attempt.taskId,enterpriseId:entry.task.enterpriseId,tenantId:attempt.tenantId,attemptId:attempt.attemptId,failureRetryAttemptId:attempt.attemptId,recordId:attempt.recordId,batchId:attempt.originalBatchId,originalBatchId:attempt.originalBatchId,rootBatchId:attempt.rootBatchId,phone:attempt.phone,tel:attempt.phone,leadCode:attempt.leadCode,sourceApplicationId:attempt.sourceApplicationId};
    const conflicts=[];
    if(!record||attempt.taskId!==entry.task.taskId||attempt.tenantId!==entry.task.tenantId||attempt.supplierTaskId!==entry.task.supplierTaskId||attempt.phone!==record.phone||attempt.leadCode!==record.leadCode||attempt.sourceApplicationId!==record.sourceApplicationId||attempt.originalBatchId!==record.batchId||attempt.rootBatchId!==(record.rootBatchId||record.batchId)||attempt.quotaKey!==retryKey(entry,record))conflicts.push('原补提交关联');
    for(const source of [raw,raw?.data])if(source&&typeof source==='object')for(const [key,expected]of Object.entries(declared))if(Object.hasOwn(source,key)&&(!['string','number'].includes(typeof source[key])||String(source[key])!==String(expected??'')))conflicts.push(key);
    // An explicit identifier always constrains this attempt, including negative
    // responses. A foreign rejection cannot release an unknown-result hold.
    for(const source of [raw,raw?.data])if(source&&typeof source==='object'&&Object.hasOwn(source,'fileId')){const supplied=text(source.fileId);if(!supplied||attempt.supplierFileId&&supplied!==attempt.supplierFileId||entry.records.some(row=>row.supplierFileId===supplied)||entry.failureRetryAttempts.some(row=>row.attemptId!==attempt.attemptId&&row.supplierFileId===supplied))conflicts.push('fileId');}
    if(conflicts.length)reason='响应声明与原补提交不一致（'+[...new Set(conflicts)].join('、')+'），保留待确认和本次占用';
    else if(raw&&typeof raw.result==='number'&&Number.isFinite(raw.result)&&raw.result!==0){state='rejected';reason=text(raw.description)||'供应商明确拒绝（合成）';}
    else if(raw?.result===0&&raw.data?.taskId===entry.task.supplierTaskId&&text(raw.data.fileId)&&raw.data.importTotal===1&&[0,1].includes(raw.data.successTotal)&&[0,1].includes(raw.data.invalidTotal)&&raw.data.successTotal+raw.data.invalidTotal===1){
      const conflict=entry.records.some(row=>row.supplierFileId===raw.data.fileId)||entry.failureRetryAttempts.some(row=>row.attemptId!==attempt.attemptId&&row.supplierFileId===raw.data.fileId);
      if(!conflict){state=raw.data.successTotal===1?'accepted':'rejected';fileId=raw.data.fileId;reason=state==='accepted'?'补提交已受理（演示）':'供应商明确拒绝（合成）';}
      else reason='新供应商批次与已有记录冲突，保留本次占用';
    }
    Object.assign(attempt,{state,reason,supplierFileId:fileId,updatedAt:new Date().toISOString()});
    if(!writeLedger(next))return failure('STORAGE_FAILURE','补提交结果未保存，原尝试保持待确认占用。');notifyRecords(input.taskId);return success(attempt);
  }
  function executeFailureRetry(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能补提交本任务客户。');
    const next=clone(ledger),entry=retryState(next.tasks[input.taskId]),plan=entry.failureRetryPlans.find(row=>row.planId===text(input.planId));
    if(!plan)return failure('UNKNOWN_PLAN','当前失败处理计划不存在。');
    const record=entry.records.find(row=>row.recordId===plan.recordId);if(!record)return failure('UNKNOWN_RECORD','原客户记录不存在。');
    const block=retryPlanBlock(entry,found.data.current,plan,record,retryClock(input));if(block)return failure('RETRY_BLOCKED',block);
    if(plan.mode==='manual'&&input.manualConfirmed!==true)return failure('MANUAL_CONFIRMATION_REQUIRED','请确认只补提交当前失败客户。');
    const attemptId='DEMO-FAIL-RETRY-ATTEMPT-'+(++next.sequence),createdAt=new Date().toISOString(),attempt={attemptId,planId:plan.planId,quotaKey:plan.quotaKey,tenantId:plan.tenantId,taskId:plan.taskId,supplierTaskId:plan.supplierTaskId,recordId:record.recordId,leadCode:plan.leadCode,phone:plan.phone,rootBatchId:plan.rootBatchId,originalBatchId:plan.originalBatchId,triggerFileId:plan.triggerFileId,triggerResultId:plan.triggerResultId,priority:plan.priority,sourceApplicationId:plan.sourceApplicationId,state:'dispatching',supplierFileId:'',createdAt,updatedAt:createdAt,responses:[],mode:plan.mode,request:{taskId:plan.supplierTaskId,name:attemptId,taskTelList:[{tel:plan.phone,priority:plan.priority}]},simulated:true};
    plan.state='attempted';plan.attemptId=attemptId;entry.failureRetryAttempts.push(attempt);entry.submissions.push({submissionId:'DEMO-SUBMIT-'+(++next.sequence),recordId:record.recordId,batchId:record.batchId,failureRetryAttemptId:attemptId,submittedAt:createdAt,request:clone(attempt.request),simulated:true});
    if(!writeLedger(next))return failure('STORAGE_FAILURE','补提交未保存，未生成新尝试或消耗次数。');
    const outcome=entry.failureRetrySimulation.outcome;
    const response=outcome==='unknown'?null:outcome==='rejected'?{result:-1,description:'供应商明确拒绝（合成）'}:{result:0,data:{taskId:plan.supplierTaskId,fileId:'DEMO-RETRY-FILE-'+attemptId,importTotal:1,successTotal:1,invalidTotal:0}};
    return applyFailureRetryResponse({taskId:input.taskId,attemptId,response});
  }
  function processFailureRetryPlans(input={}) {
    if(isReadOnlyProjection())return readOnlyFailure();
    const fresh=refreshBusinessLedger();if(!fresh.ok)return fresh;
    const taskIds=input.taskId?[text(input.taskId)]:Object.keys(ledger.tasks),executed=[];
    for(const taskId of taskIds){
      const found=lockedTask(taskId);if(!found.ok||!canAccessTask(found.data.current,true))continue;
      // The one-second clock must not clone the entire historical import/call
      // journal when there is no queued retry to examine.
      if(!(found.data.entry.failureRetryPlans||[]).some(plan=>plan?.state==='queued'))continue;
      const entry=retryState(clone(found.data.entry));
      const terminal=['已终止','已完成','已删除','结束'].includes(found.data.current.status)||String(found.data.current.providerStatusCode)==='3';
      if(terminal&&entry.failureRetryPlans.some(plan=>plan.state==='queued')){const next=clone(ledger),saved=retryState(next.tasks[taskId]);saved.failureRetryPlans.forEach(plan=>{if(plan.state==='queued'){plan.state='cancelled';plan.cancelReason='任务已结束';}});if(writeLedger(next))notifyRecords(taskId);continue;}
      for(const plan of entry.failureRetryPlans.filter(row=>row.mode==='auto'&&row.state==='queued')){const result=executeFailureRetry({taskId,planId:plan.planId,...(input.now?{now:input.now}:{})});if(result.ok)executed.push(result.data);}
    }
    return success({executed,simulated:true});
  }

  function simulateFailureRetryFailure(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能接收本任务合成失败。');
    if(![...autoFailureReasons,...manualFailureReasons,'呼叫过频'].includes(input.reason))return failure('UNKNOWN_FAILURE_REASON','请选择已定义的准确失败原因。');
    const entry=found.data.entry,record=entry.records.find(row=>row.recordId===(text(input.recordId)||entry.resultDemo?.recordId));
    if(!record?.supplierFileId)return failure('UNKNOWN_DEMO_RECORD','请先准备合成结果客户，并等候本次导入受理。');
    const latest=(entry.failureRetryAttempts||[]).filter(row=>row.recordId===record.recordId&&row.state==='accepted'&&text(row.supplierFileId)).at(-1);
    return receiveCallResult({taskId:input.taskId,result:{kind:'no_cdr_failure',evidenceTrusted:true,enterpriseId:entry.task.enterpriseId,taskId:entry.task.supplierTaskId,recordId:record.recordId,batchId:record.batchId,fileId:latest?.supplierFileId||record.supplierFileId,phone:record.phone,leadCode:record.leadCode,eventId:'DEMO-RETRY-FAILURE-EVENT-'+input.taskId+'-'+(ledger.sequence+1),source:'本地准确失败原因合成样例',failureReason:input.reason,customerAnswered:false}});
  }
  function reconcileFailureRetries(observedAt=Date.now()) {const date=new Date(observedAt);if(!Number.isFinite(date.getTime()))return {changed:0,results:[],error:'INVALID_TIME'};const result=processFailureRetryPlans({now:date.toISOString()});return {changed:result.ok?result.data.executed.length:0,results:result.ok?result.data.executed:[],simulated:true};}
  function normalizedClock(value) {
    let clock=value===undefined?new Date().toISOString():value;
    if(typeof clock==='string'){
      clock=clock.trim().replace(' ','T');
      const calendar=clock.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/);
      if(!calendar||!Number.isFinite(naturalDayNumber(calendar[1])))return null;
      if(/^\d{4}-\d{2}-\d{2}$/.test(clock))clock+='T00:00:00+08:00';
      else if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(clock))clock+='+08:00';
    }
    if(!['string','number'].includes(typeof clock))return null;
    const date=new Date(clock);if(!Number.isFinite(date.getTime()))return null;
    const day=date.toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'});
    return {iso:date.toISOString(),day,epoch:date.getTime()};
  }
  const supplierDeleted = record => record.supplierDeleted===true;
  // 保留旧调用的明确退出反馈；不再查询、衰减或写回存量优先级。
  const retiredPriority=()=>failure('FEATURE_RETIRED','平台每日衰减已取消，本次优先级由 DCC 决定。');
  const queryCurrentStates=retiredPriority,calculatePriorityDecay=retiredPriority,preparePriorityDemo=retiredPriority,simulateCurrentStates=retiredPriority,simulatePriorityRepush=retiredPriority;
  function priorityView(taskId){const found=lockedTask(taskId);if(!found.ok)return found;if(!canAccessTask(found.data.current))return failure('FORBIDDEN','无权查看当前任务。');return success({...found.data.entry,decayEnabled:false,simulated:true});}
  function deletionState(entry) {
    failureState(entry);
    if(!Array.isArray(entry.deletionRequests))entry.deletionRequests=[];
    return entry;
  }
  function deletionView(taskId) {
    const found=lockedTask(taskId);if(!found.ok)return found;
    if(!canAccessTask(found.data.current))return failure('FORBIDDEN','当前身份不能查看此任务的精准删除记录。');
    return success(deletionState(clone(found.data.entry)));
  }
  function exactDeletionRecord(entry,input) {
    if(!text(input?.tenantId)||!text(input?.supplierTaskId)||!text(input?.batchId)||!text(input?.phone))return failure('INCOMPLETE_TARGET','请指定完整租户、供应商任务、批次和号码；仅同号不足以定位删除。');
    if(input.tenantId!==entry.task.tenantId||input.supplierTaskId!==entry.task.supplierTaskId)return failure('DELETION_SCOPE_CONFLICT','指定租户或供应商任务与当前任务不符，不写删除请求。');
    const matches=entry.records.filter(record=>record.batchId===input.batchId&&record.phone===input.phone&&(!Object.hasOwn(input,'recordId')||record.recordId===input.recordId)&&(!Object.hasOwn(input,'fileId')||record.supplierFileId===input.fileId));
    if(matches.length!==1)return failure('UNKNOWN_DELETION_TARGET','不能唯一定位此任务的准确批次号码，不按最近同号匹配。');
    const record=matches[0];
    if(input.sourceApplicationId&&record.sourceApplicationId!==input.sourceApplicationId)return failure('DELETION_SOURCE_CONFLICT','该记录不属于当前接入应用，不能跨应用删除。');
    if(record.submissionState!=='submitted'||!text(record.supplierFileId))return failure('UNCONFIRMED_SUPPLIER_BATCH','当前记录缺少已提交及准确供应商 fileId 证据，先待核；不能声称精准删除。');
    return {ok:true,reason:'',data:record};
  }
  function enqueueDeletion(entryId,input,source='platform',sourceApplicationId='') {
    const next=clone(ledger),entry=deletionState(next.tasks[entryId]),matched=exactDeletionRecord(entry,input);if(!matched.ok)return matched;
    const record=matched.data;
    if(supplierDeleted(record))return failure('ALREADY_DELETED','此精确批次已确认供应商删除，本地记录仍保留；不重复提交删除。');
    const target={tenantId:entry.task.tenantId,localTaskId:entry.task.taskId,taskId:entry.task.supplierTaskId,recordId:record.recordId,batchId:record.batchId,...businessAssociation(record),fileId:record.supplierFileId,leadCode:record.leadCode,phone:record.phone};
    const deletion={deletionId:'DEMO-DELETE-'+(++next.sequence),target,state:'pending',latestOutcome:'pending',responses:[],deliveryIds:[],source,sourceApplicationId,createdAt:new Date().toISOString(),simulated:true,contractState:'partial',reviewReason:'等待精确批次供应商删除确认；未声称撤销已经执行的呼叫。'};
    entry.deletionRequests.push(deletion);record.deletionState='pending';
    if(!writeLedger(next))return failure('STORAGE_FAILURE','精准删除请求未保存。');notifyRecords(entryId);return success({deletion,record});
  }
  function requestSupplierDeletion(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能申请此任务的精准供应商删除。');
    return enqueueDeletion(found.data.entry.task.taskId,input);
  }
  function receiveDccDeletion(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    const resolved=resolveTenantIdentity(input?.identity);if(!resolved.ok)return resolved;
    const matches=Object.values(ledger.tasks).filter(entry=>entry.task.supplierTaskId===text(input?.taskId)&&entry.task.tenantId===resolved.data.tenantId);
    if(matches.length!==1)return failure('UNKNOWN_TASK','租户身份无法准确匹配指定供应商 taskId。');
    const found=lockedTask(matches[0].task.taskId);if(!found.ok)return found;
    if(found.data.entry.task.source!=='api')return failure('LOCKED_SOURCE','手工任务不能接收 DCC 删除指令。');
    const target={...input,sourceApplicationId:resolved.data.sourceApplicationId,tenantId:resolved.data.tenantId,supplierTaskId:found.data.entry.task.supplierTaskId};
    if(Object.hasOwn(input,'tenantId')&&input.tenantId!==resolved.data.tenantId||Object.hasOwn(input,'supplierTaskId')&&input.supplierTaskId!==found.data.entry.task.supplierTaskId)return failure('DELETION_SCOPE_CONFLICT','删除指令指定范围与已发放租户身份冲突。');
    return enqueueDeletion(found.data.entry.task.taskId,target,'dcc',resolved.data.sourceApplicationId);
  }
  function applySupplierDeletionResult(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能记录此任务精准删除结果。');
    const next=clone(ledger),entry=deletionState(next.tasks[input.taskId]),deletion=entry.deletionRequests.find(item=>item.deletionId===input.deletionId);
    if(!deletion)return failure('UNKNOWN_DELETION','精准删除请求不属于当前任务。');
    const record=entry.records.find(item=>item.recordId===deletion.target.recordId&&item.batchId===deletion.target.batchId&&item.phone===deletion.target.phone&&item.supplierFileId===deletion.target.fileId);
    if(!record)return failure('UNKNOWN_DELETION_TARGET','原删除请求不能准确关联当前批次，不写结果。');
    const response=input.response&&typeof input.response==='object'?clone(input.response):null;
    if(response?.target&&Object.entries(response.target).some(([key,value])=>Object.hasOwn(deletion.target,key)&&deletion.target[key]!==value))return eventRejected('DELETION_TARGET_CONFLICT','结果目标与原精确请求冲突，不关联其他批次。',response);
    if(deletion.responses.some(item=>stable(item.raw)===stable(response)))return success({deletion,record,duplicate:true});
    const trusted=response?.evidenceTrusted===true,declared=response?.outcome;
    const outcome=trusted&&['succeeded','rejected','unknown'].includes(declared)?declared:'unknown';
    const evidence={raw:response,source:text(response?.source)||'合成 API-006 精准删除结果（真实契约 partial）',receivedAt:new Date().toISOString(),declaredOutcome:declared??null,outcome,evidenceTrusted:trusted};
    deletion.responses.push(evidence);deletion.latestOutcome=outcome;
    if(outcome==='succeeded'){
      record.supplierDeleted=true;record.supplierDeletedAt=record.supplierDeletedAt||evidence.receivedAt;record.supplierDeletionId=record.supplierDeletionId||deletion.deletionId;
      deletion.state='succeeded';deletion.confirmedAt=deletion.confirmedAt||evidence.receivedAt;deletion.reviewReason='';
    }else if(supplierDeleted(record)){
      deletion.state='succeeded';deletion.reviewReason='后到删除结果与已保留准确成功不一致，保留原成功及全部原始证据待核，不反向恢复供应商批次。';
    }else{
      deletion.state=outcome;deletion.reviewReason=outcome==='unknown'?'删除响应未知、缺失或语义未可信确认；保留本地记录及批次关联，等待准确删除确认。':'';
    }
    record.deletionState=supplierDeleted(record)?'succeeded':deletion.state;
    if(entry.task.source==='api'){
      const delivery={deliveryId:'DEMO-DELETE-DELIVERY-'+(++next.sequence),deletionId:deletion.deletionId,taskId:entry.task.taskId,tenantId:entry.task.tenantId,...callbackRoute(record,entry),simulated:true,state:'pending',attempts:[],error:'',stage:'supplier_deletion',payload:{stage:'supplier_deletion',...clone(deletion.target),...(window.CustomerBusiness?.importSnapshot(record)||{}),deletionId:deletion.deletionId,deletionState:deletion.state,observedOutcome:outcome,supplierDeleted:supplierDeleted(record),reason:text(response?.reason),source:evidence.source,raw:response}};
      deletion.deliveryIds.push(delivery.deliveryId);entry.deliveries.push(delivery);deliveryAttempt(delivery,input.deliveryOutcome==='succeeded'?'succeeded':'failed');
    }
    if(!writeLedger(next))return failure('STORAGE_FAILURE','精准删除结果未保存，保留当前请求状态。');notifyRecords(entry.task.taskId);return success({deletion,record});
  }
  function simulateSupplierDeletion(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能演示此任务精准删除。');
    const scenario=window.DccMock?.deletionScenarios?.[input.scenarioId];if(!scenario)return failure('UNKNOWN_SCENARIO','请选择已有合成精准删除结果。');
    const entry=deletionState(clone(found.data.entry)),record=entry.records.find(item=>item.recordId===input.recordId);
    if(!record)return failure('UNKNOWN_DELETION_TARGET','请明确选择本任务的一个批次号码。');
    if(supplierDeleted(record))return failure('ALREADY_DELETED','此批次已确认供应商删除，本地记录保留；补送不会再次删除。');
    let deletion=entry.deletionRequests.filter(item=>item.target.recordId===record.recordId&&['pending','unknown'].includes(item.state)).at(-1);
    if(!deletion){
      const target={taskId:entry.task.taskId,tenantId:entry.task.tenantId,supplierTaskId:entry.task.supplierTaskId,batchId:record.batchId,phone:record.phone,recordId:record.recordId,fileId:record.supplierFileId};
      let requested;
      if(entry.task.source==='api'){
        const application=state.applications.find(item=>item.applicationId===record.sourceApplicationId&&item.authorizedTenantIds.includes(entry.task.tenantId));if(!application)return failure('UNAUTHORIZED_TENANT','没有虚构应用授权本任务租户。');
        const identity=exchangeTenantIdentity({applicationId:application.applicationId,credentialPlaceholder:application.credentialPlaceholder,tenantId:entry.task.tenantId});if(!identity.ok)return identity;
        requested=receiveDccDeletion({...target,taskId:entry.task.supplierTaskId,identity:identity.data});
      }else requested=requestSupplierDeletion(target);
      if(!requested.ok)return requested;deletion=requested.data.deletion;
    }
    return applySupplierDeletionResult({taskId:entry.task.taskId,deletionId:deletion.deletionId,response:clone(scenario.response),deliveryOutcome:scenario.deliveryOutcome});
  }
  function simulateLineageRepush(input) {
    const found=lockedTask(text(input?.taskId));if(!found.ok)return found;
    if(!canAccessTask(found.data.current,true))return failure('FORBIDDEN','当前身份不能演示此任务再次导入。');
    const entry=found.data.entry;if(entry.task.source!=='api')return failure('LOCKED_SOURCE','手工任务不能接收 DCC 再次导入。');
    const original=entry.records.find(record=>record.recordId===input.recordId);if(!original)return failure('UNKNOWN_LINEAGE_RECORD','请选择准确的线索记录。');
    const application=state.applications.find(row=>row.applicationId===original.sourceApplicationId&&row.authorizedTenantIds.includes(entry.task.tenantId));if(!application)return failure('UNAUTHORIZED_TENANT','原应用未授权本任务租户。');
    const identity=exchangeTenantIdentity({applicationId:application.applicationId,credentialPlaceholder:application.credentialPlaceholder,tenantId:entry.task.tenantId});if(!identity.ok)return identity;
    return receiveDcc({identity:identity.data,taskId:entry.task.supplierTaskId,businessType:original.businessType,callMode:'predictive',businessBatchNo:text(input.businessBatchNo)||original.businessBatchNo||'DEMO-LINEAGE-BUSINESS',requestId:text(input.requestId)||'DEMO-REQUEST-'+uniqueDemoId(),rows:[{leadCode:original.leadCode,phone:original.phone,priority:input.priority??window.DccMock?.reimportSample?.priority,isNewBatch:input.isNewBatch===true,...(Object.hasOwn(original,'R')?{R:original.R}:{})}],scenarioId:'STEP09-REPUSH'});
  }

  window.DccRuntime = Object.freeze({ storageKey: STORAGE_KEY, ledgerStorageKey: LEDGER_KEY, snapshot, canManageApplications, validCallbackUrl, listApplications, createApplication, saveApplication, deleteApplication, exchangeTenantIdentity, resolveTenantIdentity,
    listUnifiedImportBatches,externalRecordView,receiveExternalCall,receiveExternalFollowup,simulateExternalCall,applicationsForTenant,simulateManualApiImport,predictiveReceivingCandidates,predictiveReceivingItem,workbenchRow,workbenchMine,workbenchCanCall,workbenchCallBlockedReason,claimWorkbenchCall,syncWorkbenchCall,applicationsForTask,recordCommunicationCompletion,communicationCompletionView,directoryView, directoryRecord, directoryResult, registerTask, isManagedTask, guardLegacyWrite, guardTaskUpdate, taskRecords, taskProgressView, pendingOrder, submitPending, applyImportResponse, receiveDcc, importManual, commitCreationImport, rollbackCreationImport, simulateDccImport, failureView, receiveImportFailure53, createFailureSnapshot, recordSnapshotDownload, retryDelivery, prepareFailureDemo, simulateFailure53, resultView, failureRetryView, confirmFailureRetryDemo, executeFailureRetry, processFailureRetryPlans, reconcileFailureRetries, simulateFailureRetryFailure, applyFailureRetryResponse, receiveCallResult, observeCdrQuery, prepareResultDemo, simulateCallResult, priorityView, queryCurrentStates, calculatePriorityDecay, preparePriorityDemo, simulateCurrentStates, simulatePriorityRepush, deletionView, requestSupplierDeletion, receiveDccDeletion, applySupplierDeletionResult, simulateSupplierDeletion, simulateLineageRepush });
}());
