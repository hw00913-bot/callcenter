/** 本版 DCC 合成模型：管理权限与租户业务身份分离。 */
(function () {
  'use strict';
  const STORAGE_KEY = 'dcc-runtime-v1.1.0';
  const clone = value => JSON.parse(JSON.stringify(value));
  const fixtures = clone(window.DccMock?.applications || []);
  const tenants = () => (window.CloudCallData?.tenants || []).filter(row => row.builtIn !== true && row.status === '启用');
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

  // 本地应用管理只恢复合成凭证；不会从浏览器存储发放管理权限。
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.schemaVersion === '1.1.0' && Array.isArray(saved.applications)) {
      const allowed = new Set(tenants().map(row => row.tenantId)), seen = new Set(), names = new Set();
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
      state = {schemaVersion:'1.1.0',revision:Number.isSafeInteger(saved.revision)&&saved.revision>=0?saved.revision:0,applications:normalized};
    }
  } catch (_) { /* 无效合成配置不恢复。 */ }
  function canManageApplications() {
    return window.AppState?.isReady?.() === true && window.AppState?.isSuper?.() === true && window.AppState?.canAction?.('application.manage') === true;
  }
  function snapshot() {
    if (!canManageApplications()) return failure('FORBIDDEN', '仅超级管理员可读取应用配置。');
    return success(state);
  }
  function listApplications() {
    if (!canManageApplications()) return failure('FORBIDDEN', '仅超级管理员可访问应用接入。');
    return success(state.applications);
  }
  function applicationValues(input, current) {
    const name=text(input?.name ?? current?.name);
    if(!name||name.length>60)return failure('INVALID_NAME','请填写60字以内的应用名称。');
    if(state.applications.some(row=>row.applicationId!==current?.applicationId&&row.name===name))return failure('DUPLICATE_NAME','应用名称已存在。');
    const raw=input?.authorizedTenantIds ?? current?.authorizedTenantIds,allowed=new Set(tenants().map(row=>row.tenantId));
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
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}catch(_){return failure('STORAGE_FAILURE','保存失败，请检查本地存储后重试。');}
    state=next;return success(result);
  }
  let applicationSequence=0;
  const uniqueDemoId=()=>typeof window.crypto?.randomUUID==='function'?window.crypto.randomUUID():Date.now().toString(36)+'-'+(++applicationSequence);
  function createApplication(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    if(!canManageApplications())return failure('FORBIDDEN','仅超级管理员可新增应用。');
    const checked=applicationValues(input);if(!checked.ok)return checked;
    const now=new Date().toISOString(),row={applicationId:'DEMO-DCC-APP-'+uniqueDemoId(),credentialPlaceholder:'MOCK-SECRET-'+uniqueDemoId(),...checked.data,createdAt:now,savedAt:now,sourceTrace:'本地新增应用'};
    const next=clone(state);next.applications.push(row);return saveApplications(next,row);
  }
  function saveApplication(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    if(!canManageApplications())return failure('FORBIDDEN','仅超级管理员可修改应用。');
    const index=state.applications.findIndex(row=>row.applicationId===text(input?.applicationId));
    if(index<0)return failure('UNKNOWN_APPLICATION','应用不存在或已删除。');
    const checked=applicationValues(input,state.applications[index]);if(!checked.ok)return checked;
    const next=clone(state);Object.assign(next.applications[index],checked.data,{savedAt:new Date().toISOString()});
    return saveApplications(next,next.applications[index]);
  }
  function deleteApplication(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    if(!canManageApplications())return failure('FORBIDDEN','仅超级管理员可删除应用。');
    const id=text(input?.applicationId),row=state.applications.find(item=>item.applicationId===id);
    if(!row)return failure('UNKNOWN_APPLICATION','应用不存在或已删除。');
    const next=clone(state);next.applications=next.applications.filter(item=>item.applicationId!==id);
    const saved=saveApplications(next,{applicationId:id,deleted:true});
    if(saved.ok)for(const [key,identity] of issuedIdentities)if(identity.sourceApplicationId===id)issuedIdentities.delete(key);
    return saved;
  }
  function exchangeTenantIdentity(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
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
    const issued = issuedIdentities.get(text(identity?.identityId));
    if (!issued || identity.tenantId !== issued.tenantId || identity.sourceApplicationId !== issued.sourceApplicationId) return failure('INVALID_IDENTITY', '合成租户身份无效，请重新演示身份交换。');
    const application = state.applications.find(row => row.applicationId === issued.sourceApplicationId);
    if (!application?.authorizedTenantIds.includes(issued.tenantId) || !tenants().some(row => row.tenantId === issued.tenantId)) return failure('UNAUTHORIZED_TENANT', '应用租户授权已变化，请重新演示身份交换。');
    return success(issued);
  }
  const LEDGER_KEY = 'dcc-task-ledger-v1.1.0';
  let ledger = { schemaVersion: '1.1.0', sequence: 0, tasks: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null');
    if (saved?.schemaVersion === '1.1.0' && Number.isSafeInteger(saved.sequence) && saved.sequence >= 0 && saved.tasks && typeof saved.tasks === 'object' && !Array.isArray(saved.tasks)) ledger = saved;
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
    try { localStorage.setItem(LEDGER_KEY, JSON.stringify(next)); ledger = next; return true; }
    catch (_) { return false; }
  }
  function lockedTask(id) {
    const current = canonicalTask(id), entry = ledger.tasks[id];
    if (!current || current.status === '已删除') return failure('UNKNOWN_TASK', '任务不存在或已经删除。');
    if (current.dccManaged !== true || current.dccSourceLocked !== true || !sourceValid(current.dccImportSource)) return failure('LEGACY_TASK', '该任务没有本版锁定来源，不自动迁移旧任务。');
    if (!entry) return failure('UNREGISTERED_TASK', '本版任务记录尚未初始化，请重新打开任务记录。');
    const guard = guardTaskUpdate(current);
    if (!guard.ok) return guard;
    return { ok: true, reason: '', data: { current, entry } };
  }
  function registerTask(task, options = {}) {
    const current = canonicalTask(localId(task));
    if (!canAccessTask(current, true)) return failure('FORBIDDEN', '当前身份不能初始化该租户任务。');
    if (current.dccManaged !== true || current.dccSourceLocked !== true || !sourceValid(current.dccImportSource)) return failure('LEGACY_TASK', '只能初始化创建时已锁定来源的新任务，旧任务不迁移。');
    if (options.source && options.source !== current.dccImportSource || options.supplierTaskId && options.supplierTaskId !== current.dccSupplierTaskId) return failure('LOCKED_SOURCE', '注册不能改写创建时锁定的来源或供应商标识。');
    if (!text(current.dccSupplierTaskId)) return failure('MISSING_TASK_ID', '缺少合成供应商任务标识。');
    if (ledger.tasks[current.taskId]) {
      const guard = guardTaskUpdate(current); return guard.ok ? success(ledger.tasks[current.taskId].task) : guard;
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
  const pendingFor = entry => entry.records.filter(row => row.submissionState === 'pending' && !row.reviewReason).sort((a, b) => b.priority - a.priority || a.localReceivedSequence - b.localReceivedSequence);
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
  const businessAssociation = record => ({...(text(record?.requestId) ? {requestId:record.requestId,rowId:record.rowId,rootBatchId:record.rootBatchId} : {}),...(text(record?.businessType) ? {businessType:record.businessType,businessTypeLabel:record.businessTypeLabel||''} : {})});
  function importRows(entryId, rows, {sourceApplicationId='',scenarioId='',uniformPriority,requestId='',requestContent,businessType='',businessTypeLabel=''}={}) {
    if(isReadOnlyProjection())return readOnlyFailure();
    if(!Array.isArray(rows)||!rows.length)return failure('INVALID_ROWS','请提供逐行线索。');
    const found=lockedTask(entryId);if(!found.ok)return found;
    const next=clone(ledger),entry=next.tasks[entryId],results=[],api=entry.task.source==='api';
    for(let index=0;index<rows.length;index++){
      const rawRow=rows[index],row=rawRow&&typeof rawRow==='object'&&!Array.isArray(rawRow)?rawRow:{},leadCode=text(row.leadCode),phone=text(row.phone??row.tel),rowId=text(row.rowId)||String(index+1);
      const priorityRaw=row.priority===undefined?uniformPriority:row.priority;
      const priority=!['number','string'].includes(typeof priorityRaw)||typeof priorityRaw==='string'&&!priorityRaw.trim()?NaN:Number(priorityRaw);
      const isNewBatch=row.isNewBatch===true,matching=entry.records.filter(previous=>previous.leadCode===leadCode);
      const mains=matching.filter(previous=>previous.rootBatchId===previous.batchId&&previous.batchKind==='main').sort((a,b)=>a.localReceivedSequence-b.localReceivedSequence);
      const roots=new Set(mains.map(item=>item.batchId));
      let reason=!leadCode?'缺少必填线索编码':!phone?'缺少手机号':!Number.isFinite(priority)?'请填写有效优先级':'';
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
        ...(api?{requestId,rowId,isNewBatch,rootBatchId,batchKind:main?'main':'child',businessType,businessTypeLabel}:Object.fromEntries(['name','note','externalDocumentId','businessType','importBatchName'].filter(field=>Object.hasOwn(row,field)&&typeof row[field]==='string').map(field=>[field,row[field]]))),
        ...(window.CustomerBusiness?.importSnapshot(row)||{}),
        newBatchCreatedAt:receivedAt,localReceivedSequence:sequence,originalImportedAt:receivedAt,originalImportDay:new Date(receivedAt).toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}),
        lineageState:'confirmed',sourceApplicationId,source:entry.task.source,localState:'saved',submissionState:'pending',importState:'pending',callState:'not_observed',syncCounts:null,syncResponses:[],supplierFileId:'',scenarioId,reviewReason:''};
      entry.records.push(record);
      results.push({ok:true,recordId:record.recordId,batchId,...businessAssociation(record),tenantId:record.tenantId,supplierTaskId:record.supplierTaskId,leadCode,phone,localState:'saved',importState:'pending',pendingReview:false});
    }
    const receipt={taskId:entryId,...(api?{requestId,businessType}:{}),rows:results,savedCount:results.filter(row=>row.ok).length,rejectedCount:results.filter(row=>!row.ok).length,simulated:true};
    if(api){if(!Array.isArray(next.requestReceipts))next.requestReceipts=[];next.requestReceipts.push({sourceApplicationId,tenantId:entry.task.tenantId,requestId,content:requestContent,result:clone(receipt)});}
    if(!writeLedger(next))return failure('STORAGE_FAILURE','导入未保存，请保留输入后重试。');
    Promise.resolve().then(()=>dispatchPending(entryId));
    return success(receipt);
  }
  function receiveDcc(input) {
    if(isReadOnlyProjection())return readOnlyFailure();
    const resolved=resolveTenantIdentity(input?.identity);if(!resolved.ok)return resolved;
    const sourceApplication=state.applications.find(row=>row.applicationId===resolved.data.sourceApplicationId);
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
    const content=stable({tenantId:resolved.data.tenantId,taskId:text(input.taskId),businessType,rows:normalizedRows});
    const prior=ledger.requestReceipts?.find(row=>row.sourceApplicationId===resolved.data.sourceApplicationId&&row.tenantId===resolved.data.tenantId&&row.requestId===requestId);
    if(prior)return prior.content===content?success({...prior.result,replayed:true}):failure('REQUEST_CONTENT_CONFLICT','同一 requestId 的内容已改变，请使用新的业务请求编号。');
    // A replay only returns the persisted receipt. Changed configuration must not turn it into a new import.
    if(ledger.requestReceipts?.some(row=>!row.sourceApplicationId&&row.tenantId===resolved.data.tenantId&&row.requestId===requestId))return failure('LEGACY_REQUEST_SCOPE_UNKNOWN','历史请求的来源应用未确认，请核对原回执，不会再次导入。');
    if(!validCallbackUrl(sourceApplication?.callbackUrl))return failure('CALLBACK_NOT_CONFIGURED','请先为该接入应用配置有效回调地址，再导入客户。');
    const category=window.CustomerBusiness?.resolveImportType?.(businessType,{tenantId:resolved.data.tenantId,enterpriseId:found.data.entry.task.enterpriseId});
    if(!category?.ok)return failure(category?.code||'BUSINESS_CONFIG_UNAVAILABLE',category?.message||'业务类型配置暂时无法读取。');
    if(normalizedRows.some(row=>row&&Object.hasOwn(row,'businessType')&&row.businessType!==businessType))return failure('BUSINESS_TYPE_CONFLICT','一次导入只能使用请求指定的业务类型，请按类型分次导入。');
    return importRows(found.data.entry.task.taskId,normalizedRows,{sourceApplicationId:resolved.data.sourceApplicationId,scenarioId:text(input.scenarioId),requestId,requestContent:content,businessType,businessTypeLabel:category.row.label});
  }
  function importManual(input) {
    const found = lockedTask(text(input?.taskId)); if (!found.ok) return found;
    if (!canAccessTask(found.data.current, true)) return failure('FORBIDDEN', '当前身份不能导入该租户任务。');
    if (found.data.entry.task.source !== 'manual') return failure('LOCKED_SOURCE', '该任务锁定 DCC 接口来源，手工导入被拒绝。');
    return importRows(input.taskId, input.rows, { scenarioId: text(input.scenarioId), uniformPriority: input.uniformPriority });
  }
  function simulateDccImport(input) {
    const found = lockedTask(text(input?.taskId)); if (!found.ok) return found;
    if (!canAccessTask(found.data.current, true)) return failure('FORBIDDEN', '当前身份不能演示该租户的 DCC 传入。');
    if (found.data.entry.task.source !== 'api') return failure('LOCKED_SOURCE', '该任务锁定手工来源，不接受合成 DCC 传入。');
    const scenario = window.DccMock?.importScenarios?.[input?.scenarioId];
    if (!scenario) return failure('UNKNOWN_SCENARIO', '请选择已定义的合成线索样例。');
    const application = state.applications.find(row => row.authorizedTenantIds.includes(found.data.entry.task.tenantId));
    if (!application) return failure('UNAUTHORIZED_TENANT', '没有虚构应用授权该租户，合成 DCC 传入被拒绝。');
    const identity = exchangeTenantIdentity({ applicationId: application.applicationId, credentialPlaceholder: application.credentialPlaceholder, tenantId: found.data.entry.task.tenantId });
    if (!identity.ok) return identity;
    return receiveDcc({ identity: identity.data, taskId: found.data.entry.task.supplierTaskId, businessType: scenario.businessType, rows: clone(scenario.rows), scenarioId: input.scenarioId, requestId: text(input.requestId)||'DEMO-REQUEST-'+uniqueDemoId() });
  }
  // 导入失败、分片、交付及下载是独立维度；任何入口都不重做供应商导入。
  const stable = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.keys(item).sort().reduce((out,key)=>(out[key]=item[key],out),{}) : item);
  function failureState(entry) {
    ['failureEvents','failureDetails','failureGroups','deliveries','exportSnapshots'].forEach(key=>{if(!Array.isArray(entry[key]))entry[key]=[];});
    return entry;
  }
  function notifyRecords(taskId) { if(typeof window.dispatchEvent==='function'&&typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('dcc:records-changed',{detail:{taskId}})); }
  function deliveryAttempt(delivery,outcome) {
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
      const delivery={deliveryId:'DEMO-DELIVERY-'+event.failureId,failureId:event.failureId,taskId:entry.task.taskId,tenantId:entry.task.tenantId,target:'BACKEND_FIXED_DCC_RECEIVER',simulated:true,state:'pending',attempts:[],error:'',
        payload:{stage:'supplier_import',tenantId:event.tenantId,taskId:event.supplierTaskId,localTaskId:event.taskId,batchId:event.batchId,recordId:event.recordId,...businessAssociation(event),fileId:event.supplierFileId,leadCode:event.leadCode,phone:event.phone,failedReason:event.reason,originalData:clone(event.originalData)}};
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
    const snapshotId='DEMO-EXPORT-'+(++next.sequence),cell=value=>'"'+String(value??'').replaceAll('"','""')+'"';
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
    if(input.outcome==='succeeded'&&input.trustedSyntheticCompletion!==true)return failure('UNTRUSTED_COMPLETION','生成或点击文件不代表下载成功；需要独立的可信合成成功信号。');
    if(snapshot.state==='succeeded')return success(snapshot);
    snapshot.history.push({outcome:input.outcome,at:new Date().toISOString(),trustedSyntheticCompletion:input.outcome==='succeeded',simulated:true});snapshot.state=input.outcome;
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
    if(!delivery)return failure('UNKNOWN_DELIVERY','该交付不属于当前任务。');if(delivery.state==='succeeded')return success(delivery);
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
    const delivery={deliveryId:'DEMO-RESULT-DELIVERY-'+result.resultId+'-V'+result.version,resultId:result.resultId,resultVersion:result.version,stage,taskId:entry.task.taskId,tenantId:entry.task.tenantId,target:'BACKEND_FIXED_DCC_RECEIVER',simulated:true,state:'pending',attempts:[],error:'',
      payload:{stage,tenantId:entry.task.tenantId,taskId:entry.task.supplierTaskId,localTaskId:entry.task.taskId,recordId:result.recordId,batchId:result.batchId,...businessAssociation(result),fileId:result.supplierFileId,leadCode:result.leadCode,phone:result.phone,callID:result.callID||null,eventId:result.eventId||null,customerAnswered:result.customerAnswered,agentAnswered:result.agentAnswered,customerBridgeDuration:result.customerBridgeDuration,durationIsTrusted:result.durationIsTrusted,shortHangup:result.shortHangup,shortHangupState:result.shortHangupState,finishRetryFlag:clone(result.finishRetryFlag),failureReason:result.values.failureReason??null,obSipCause:result.values.obSipCause??null,obSipCode:result.values.obSipCode??null,sipCause:result.values.sipCause??null,sipCode:result.values.sipCode??null,sipCauseAsyncUpdateFlag:raw.sipCauseAsyncUpdateFlag??null,source:text(raw.source)||'合成每次结果',raw:clone(raw)}};
    entry.deliveries.push(delivery);result.deliveryIds.push(delivery.deliveryId);deliveryAttempt(delivery,deliveryOutcome==='succeeded'?'succeeded':'failed');
  }
  function resultView(taskId) {
    const found=lockedTask(taskId);if(!found.ok)return found;if(!canAccessTask(found.data.current))return failure('FORBIDDEN','当前身份不能查看该租户实际结果。');
    const next=clone(ledger),entry=resultState(next.tasks[taskId]);
    return success({...entry,callObjectCount:entry.actualResults.filter(row=>row.kind==='call').length,noCdrEventCount:entry.actualResults.filter(row=>row.kind==='no_cdr_failure').length,taskCompleteFromFinishFlag:false,dccPlanComplete:false,currentState:entry.actualResults.length?'observed':'unknown',simulated:true});
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
    const candidates=entry.records.filter(record=>(!raw.recordId||record.recordId===raw.recordId)&&(!raw.batchId||record.batchId===raw.batchId)&&(!raw.fileId||record.supplierFileId===raw.fileId)&&(!phone||record.phone===phone)&&(!Object.hasOwn(raw,'leadCode')||text(raw.leadCode)===record.leadCode));
    const record=hasSelector&&phone&&candidates.length===1?candidates[0]:existing&&!hasSelector&&(!phone||phone===existing.phone)&&(!Object.hasOwn(raw,'leadCode')||text(raw.leadCode)===existing.leadCode)?entry.records.find(row=>row.recordId===existing.recordId):null;
    if(!record)return pending('结果的本次任务/批次/原始号码不能唯一关联，不按最近同号盲配。');
    if(existing&&existing.recordId!==record.recordId)return pending('同一稳定结果标识的批次或号码关联冲突，保留原关联待核。');
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
    const result={resultId:'DEMO-RESULT-'+(++next.sequence),identityKey,kind,tenantId:scope.tenantId,enterpriseId:entry.task.enterpriseId,taskId:scope.taskId,supplierTaskId:scope.supplierTaskId,recordId:record.recordId,batchId:record.batchId,...businessAssociation(record),supplierFileId:record.supplierFileId,leadCode:record.leadCode,phone:record.phone,...(window.CustomerBusiness?.importSnapshot(record)||{}),callID,eventId,associationState:'confirmed',version:1,values:clone(raw),...deriveCallResult(raw),finishRetryFlag:finishInterpretation(raw,text(raw.source)||'合成每次结果'),evidence:[{source:text(raw.source)||'合成每次结果',receivedAt:new Date().toISOString(),fingerprint,raw:clone(raw)}],sipUpdates:[],reviewReasons:[],deliveryIds:[],createdAt:new Date().toISOString(),simulated:true};
    entry.actualResults.push(result);record.callState=entry.actualResults.some(row=>row.recordId===record.recordId&&row.kind==='call')?'observed':'failure_event_observed';
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
    const target={...input,tenantId:resolved.data.tenantId,supplierTaskId:found.data.entry.task.supplierTaskId};
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
      const delivery={deliveryId:'DEMO-DELETE-DELIVERY-'+(++next.sequence),deletionId:deletion.deletionId,taskId:entry.task.taskId,tenantId:entry.task.tenantId,target:'BACKEND_FIXED_DCC_RECEIVER',simulated:true,state:'pending',attempts:[],error:'',stage:'supplier_deletion',payload:{stage:'supplier_deletion',...clone(deletion.target),deletionId:deletion.deletionId,deletionState:deletion.state,observedOutcome:outcome,supplierDeleted:supplierDeleted(record),reason:text(response?.reason),source:evidence.source,raw:response}};
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
        const application=state.applications.find(item=>item.authorizedTenantIds.includes(entry.task.tenantId));if(!application)return failure('UNAUTHORIZED_TENANT','没有虚构应用授权本任务租户。');
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
    const application=state.applications.find(row=>row.authorizedTenantIds.includes(entry.task.tenantId));if(!application)return failure('UNAUTHORIZED_TENANT','没有应用授权本任务租户。');
    const identity=exchangeTenantIdentity({applicationId:application.applicationId,credentialPlaceholder:application.credentialPlaceholder,tenantId:entry.task.tenantId});if(!identity.ok)return identity;
    return receiveDcc({identity:identity.data,taskId:entry.task.supplierTaskId,businessType:original.businessType,requestId:text(input.requestId)||'DEMO-REQUEST-'+uniqueDemoId(),rows:[{leadCode:original.leadCode,phone:original.phone,priority:input.priority??window.DccMock?.reimportSample?.priority,isNewBatch:input.isNewBatch===true,...(Object.hasOwn(original,'R')?{R:original.R}:{})}],scenarioId:'STEP09-REPUSH'});
  }

  window.DccRuntime = Object.freeze({ storageKey: STORAGE_KEY, ledgerStorageKey: LEDGER_KEY, snapshot, canManageApplications, validCallbackUrl, listApplications, createApplication, saveApplication, deleteApplication, exchangeTenantIdentity, resolveTenantIdentity,
    registerTask, isManagedTask, guardLegacyWrite, guardTaskUpdate, taskRecords, pendingOrder, submitPending, applyImportResponse, receiveDcc, importManual, simulateDccImport, failureView, receiveImportFailure53, createFailureSnapshot, recordSnapshotDownload, retryDelivery, prepareFailureDemo, simulateFailure53, resultView, receiveCallResult, observeCdrQuery, prepareResultDemo, simulateCallResult, priorityView, queryCurrentStates, calculatePriorityDecay, preparePriorityDemo, simulateCurrentStates, simulatePriorityRepush, deletionView, requestSupplierDeletion, receiveDccDeletion, applySupplierDeletionResult, simulateSupplierDeletion, simulateLineageRepush });
}());
