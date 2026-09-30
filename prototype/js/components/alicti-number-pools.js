/** AliCti hybridGroup contract-shaped local simulator. No vendor call or real signature. */
(function (root) {
  'use strict';
  const storageKey = 'alicti-hybrid-groups-v1';
  const historyKey = 'alicti-hybrid-groups-request-history-v1';
  const endpoints = Object.freeze({
    list:   Object.freeze({method:'GET',  path:'/interface/v10/hybridGroup/list'}),
    create: Object.freeze({method:'POST', path:'/interface/v10/hybridGroup/create'}),
    update: Object.freeze({method:'POST', path:'/interface/v10/hybridGroup/update'}),
    delete: Object.freeze({method:'POST', path:'/interface/v10/hybridGroup/delete'})
  });
  const terminalStatuses = new Set(['已结束','已终止','已完成','已删除','已取消']);
  const clone = value => JSON.parse(JSON.stringify(value));
  const text = value => value == null ? '' : String(value);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  let lastStorageError = '';

  function contextKey() {
    const state = root.AppState?.get?.() || {};
    const access = root.AppState?.effectiveAccess?.() || {};
    return JSON.stringify([state.sessionId,state.accountId,state.enterpriseId,state.tenantId,state.activeDomain,access.roleCode,access.valid]);
  }
  function scopeFor(tenantId,write=false) {
    const state = root.AppState?.get?.() || {}, access = root.AppState?.effectiveAccess?.() || {};
    if (!access.valid || state.activeDomain !== 'CLOUD_CONTACT_CENTER' ||
      !['OPERATOR','ADMIN','SUPER_ADMIN'].includes(access.roleCode) ||
      (write ? (!['ADMIN','SUPER_ADMIN'].includes(access.roleCode) ||
        !root.AppState?.canMenu?.('settings.numberPools')) :
        !root.AppState?.canMenu?.('cloud.tasks'))) {
      return {ok:false,message:write?'当前账号无号码池管理权限':'当前账号无号码池读取权限'};
    }
    const enterpriseId = text(state.enterpriseId);
    const matches = (root.CloudCallData?.tenants || []).filter(row =>
      !row.builtIn && text(row.enterpriseId) === enterpriseId);
    if (matches.length !== 1) return {ok:false,message:'当前 AliCti 账号必须对应唯一业务租户'};
    const tenant = matches[0];
    if (tenantId && text(tenantId) !== text(tenant.tenantId)) return {ok:false,message:'只能访问当前 AliCti 账号所属租户的号码池'};
    if (tenant.status !== '启用' || !(tenant.capabilitySet || []).includes('CLOUD_CONTACT_CENTER') ||
      !root.AppState.authorizeObject('',tenant)) return {ok:false,message:'当前租户没有可用的云联络中心号码池权限'};
    return {ok:true,enterpriseId,tenantId:text(tenant.tenantId),tenant};
  }
  function canAccess(tenantId) { return scopeFor(tenantId,true).ok; }
  function storageError() { return lastStorageError; }
  function seedRows(enterpriseId) {
    return clone(root.AliCtiNumberPoolMock?.entries?.[enterpriseId] || []);
  }
  function publicRow(row,scope) {
    return {...clone(row),tenantId:scope.tenantId,enterpriseId:scope.enterpriseId,numbers:numberList(row.numbers).numbers};
  }
  function providerRow(row) {
    const {tenantId,enterpriseId,localUpdatedAt,...fields} = row;
    return fields;
  }
  function validText(value,max,required) {
    return typeof value === 'string' && (!required || !!value.trim()) &&
      value.trim().length <= max && !/[\u0000-\u001f\u007f]/.test(value);
  }
  function normalizeId(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const string = text(value);
    const id = Number(string);
    return /^\d+$/.test(string) && Number.isSafeInteger(id) && id > 0 ? id : null;
  }
  function numberList(input) {
    const source = Array.isArray(input) ? input : typeof input === 'string' ? (input.trim() ? input.split(',') : []) : null;
    if (!source || source.length >= 500) return {ok:false,message:'号码列表须为数组，且少于 500 个号码'};
    const numbers = source.map(value => text(value).trim());
    if (numbers.some(value => !/^\+?\d+$/.test(value) || value.length > 30)) return {ok:false,message:'号码只能包含数字或开头的 +，且每项不超过 30 字'};
    if (new Set(numbers).size !== numbers.length) return {ok:false,message:'同一号码池内不能重复添加号码'};
    return {ok:true,numbers,value:numbers.join(',')};
  }
  function validRow(row) {
    if (!object(row) || !normalizeId(row.id) || !validText(row.name,80,true) ||
      !validText(row.comment,500,false) || !validText(row.createTime,32,true) ||
      ![0,1].includes(row.type) || ![0,1,null].includes(row.isDefault) ||
      (row.localUpdatedAt !== undefined && (typeof row.localUpdatedAt !== 'string' ||
        !Number.isFinite(Date.parse(row.localUpdatedAt)))) ||
      typeof row.numbers !== 'string') return false;
    return numberList(row.numbers).ok;
  }
  function validScope(scope) {
    if (!object(scope) || !scope.enterpriseId || !scope.tenantId ||
      !Array.isArray(scope.rows)) return false;
    const ids = new Set(), names = new Set();
    let defaults = 0;
    for (const row of scope.rows) {
      if (!validRow(row)) return false;
      const name = row.name.trim().toLocaleLowerCase();
      if (ids.has(row.id) || names.has(name)) return false;
      ids.add(row.id); names.add(name);
      if (row.isDefault === 1) defaults++;
    }
    return defaults <= 1;
  }
  function readStore() {
    try {
      const raw = root.sessionStorage.getItem(storageKey);
      if (raw === null) { lastStorageError = ''; return {ok:true,raw,data:{version:1,revision:0,scopes:[]}}; }
      const data = JSON.parse(raw);
      if (!object(data) || data.version !== 1 || !Number.isSafeInteger(data.revision) ||
        data.revision < 0 || !Array.isArray(data.scopes)) throw Error('号码池会话数据结构无效');
      const seen = new Set();
      for (const scope of data.scopes) {
        if (!validScope(scope) || seen.has(scope.enterpriseId)) throw Error('号码池会话数据不完整或重复');
        seen.add(scope.enterpriseId);
      }
      lastStorageError = '';
      return {ok:true,raw,data};
    } catch (error) {
      lastStorageError = '号码池演示数据暂时无法读取：' + text(error?.message || error);
      return {ok:false,message:lastStorageError};
    }
  }
  function catalog(tenantId) {
    const scope = scopeFor(tenantId), context = contextKey();
    if (!scope.ok) return {ok:false,rows:[],revision:0,context,message:scope.message};
    const stored = readStore();
    if (!stored.ok) return {ok:false,rows:[],revision:0,context,message:stored.message};
    const entry = stored.data.scopes.find(row => row.enterpriseId === scope.enterpriseId);
    if (entry && entry.tenantId !== scope.tenantId) {
      return {ok:false,rows:[],revision:stored.data.revision,context,message:'当前 AliCti 账号的号码池仍属原租户，请核对账号绑定后再访问'};
    }
    const rows = entry ? clone(entry.rows) : seedRows(scope.enterpriseId);
    if (!validScope({enterpriseId:scope.enterpriseId,tenantId:scope.tenantId,rows})) {
      return {ok:false,rows:[],revision:stored.data.revision,context,message:'号码池演示数据校验失败'};
    }
    return {ok:true,rows:rows.map(row => publicRow(row,scope)),revision:stored.data.revision,context,tenantId:scope.tenantId,enterpriseId:scope.enterpriseId,message:''};
  }
  function auth(scope) {
    const value = text(scope.enterpriseId);
    const number = /^\d+$/.test(value) ? Number(value) : NaN;
    const enterpriseId = Number.isSafeInteger(number) && number > 0 ? number : null;
    return {validateType:2,enterpriseId,timestamp:Math.floor(Date.now()/1000),sign:'00000000000000000000000000000000'};
  }
  function request(action,scope,fields) {
    const spec = endpoints[action], params = {...auth(scope),...(fields || {})};
    return {method:spec.method,path:spec.path,...(spec.method === 'GET' ? {query:params} : {body:params}),
      mock:true,...(params.enterpriseId === null ? {localOnly:true,virtualEnterpriseId:scope.enterpriseId} : {})};
  }
  function response(result,description,data) { return {result,description,data,mock:true}; }
  function fail(message,result=-1) { return {ok:false,message,response:response(result,message,null)}; }
  function historyRows() {
    try {
      const value = JSON.parse(root.sessionStorage.getItem(historyKey) || '[]');
      if (!Array.isArray(value)) throw Error('请求记录结构无效');
      return value;
    } catch (error) {
      lastStorageError = '号码池请求记录暂时无法读取：' + text(error?.message || error);
      return [];
    }
  }
  function appendRequest(action,scope,req,res) {
    try {
      const rows = historyRows();
      rows.push({at:new Date().toISOString(),action,tenantId:scope.tenantId,enterpriseId:scope.enterpriseId,request:clone(req),response:clone(res)});
      root.sessionStorage.setItem(historyKey,JSON.stringify(rows.slice(-100)));
    } catch (error) {
      lastStorageError = '号码池请求记录未能保存：' + text(error?.message || error);
    }
  }
  function requestHistory(tenantId) {
    const scope = scopeFor(tenantId);
    return scope.ok ? clone(historyRows().filter(row => row.enterpriseId === scope.enterpriseId && row.tenantId === scope.tenantId)) : [];
  }
  function list(tenantId) {
    const scope = scopeFor(tenantId);
    if (!scope.ok) return fail(scope.message,403);
    const data = catalog(scope.tenantId);
    if (!data.ok) return fail(data.message);
    const req = request('list',scope);
    const res = response(0,'查询成功',data.rows.map(providerRow));
    appendRequest('list',scope,req,res);
    return {ok:true,message:res.description,rows:clone(data.rows),revision:data.revision,context:data.context,request:req,response:res};
  }
  function checkOptions(options,data) {
    if (options?.expectedContext !== undefined && options.expectedContext !== contextKey()) return fail('工作范围已变化，请重新打开后操作');
    if (options?.expectedRevision !== undefined && options.expectedRevision !== data.revision) return fail('号码池已更新，请刷新后重试');
    return null;
  }
  function mutate(scope,options,change) {
    const stored = readStore();
    if (!stored.ok) return fail(stored.message);
    const stale = checkOptions(options,stored.data);
    if (stale) return stale;
    const next = clone(stored.data);
    let entry = next.scopes.find(row => row.enterpriseId === scope.enterpriseId);
    if (!entry) {
      entry = {enterpriseId:scope.enterpriseId,tenantId:scope.tenantId,rows:seedRows(scope.enterpriseId)};
      next.scopes.push(entry);
    }
    if (entry.tenantId !== scope.tenantId) return fail('号码池租户归属与当前 AliCti 账号不一致');
    const result = change(entry.rows);
    if (!result.ok) return result;
    if (!validScope(entry)) return fail('号码池更新后校验失败，请核对默认池和号码');
    if (root.sessionStorage.getItem(storageKey) !== stored.raw) return fail('号码池已更新，请刷新后重试');
    try {
      next.revision++;
      root.sessionStorage.setItem(storageKey,JSON.stringify(next));
      lastStorageError = '';
      return {...result,revision:next.revision};
    } catch (error) {
      lastStorageError = '号码池演示数据未能保存：' + text(error?.message || error);
      return fail(lastStorageError);
    }
  }
  function createFields(input) {
    if (!object(input)) return fail('请填写号码池信息');
    const name = text(input.name).trim(), comment = text(input.comment).trim();
    if (!validText(name,80,true)) return fail('号码池名称必填，且不超过 80 字');
    if (!validText(comment,500,false)) return fail('备注不能超过 500 字或包含控制字符');
    if (![0,1].includes(input.type)) return fail('请选择有效的号码池类型');
    if (![0,1].includes(input.isDefault)) return fail('请选择是否为默认号码池');
    const numbers = numberList(input.numbers || []);
    if (!numbers.ok) return fail(numbers.message);
    return {ok:true,name,comment,type:input.type,isDefault:input.isDefault,numbers:numbers.numbers};
  }
  function timeText() {
    const now = new Date(), two = value => String(value).padStart(2,'0');
    return [now.getFullYear(),two(now.getMonth()+1),two(now.getDate())].join('-')+' '+
      [two(now.getHours()),two(now.getMinutes()),two(now.getSeconds())].join(':');
  }
  async function create(input,options={}) {
    const scope = scopeFor(options.tenantId,true);
    if (!scope.ok) return fail(scope.message,403);
    const parsed = createFields(input);
    if (!parsed.ok) return parsed;
    const req = request('create',scope,{name:parsed.name,isDefault:parsed.isDefault,type:parsed.type,
      ...(Object.hasOwn(input,'comment') ? {comment:parsed.comment} : {})});
    const saved = mutate(scope,options,rows => {
      if (rows.some(row => row.name.trim().toLocaleLowerCase() === parsed.name.toLocaleLowerCase())) return fail('当前 AliCti 账号已有同名号码池');
      if (parsed.isDefault === 1 && rows.some(row => row.isDefault === 1)) return fail('当前 AliCti 账号已有默认号码池');
      const id = Math.max(8000,...rows.map(row => row.id)) + 1;
      rows.push({id,name:parsed.name,comment:parsed.comment,createTime:timeText(),
        localUpdatedAt:new Date().toISOString(),numbers:'',type:parsed.type,isDefault:parsed.isDefault});
      return {ok:true};
    });
    if (!saved.ok) return saved;
    const createResponse = response(0,'创建成功',null); // Supplier create does not return a pool ID.
    appendRequest('create',scope,req,createResponse);
    const refreshed = list(scope.tenantId); // Query by unique name before assigning numbers.
    if (!refreshed.ok) return fail('号码池已创建，请刷新列表后再配置号码');
    const found = refreshed.rows.find(row => row.name === parsed.name);
    if (!found) return fail('号码池已创建，但重查列表未找到同名号码池');
    if (!parsed.numbers.length) return {ok:true,message:'号码池已创建',row:found,revision:refreshed.revision,
      request:req,response:createResponse,listResponse:refreshed.response};
    const updated = await update(found.id,{name:found.name,numbers:parsed.numbers,isDefault:found.isDefault,
      ...(Object.hasOwn(input,'comment') ? {comment:parsed.comment} : {})},
    {expectedContext:contextKey(),expectedRevision:refreshed.revision,tenantId:scope.tenantId});
    if (!updated.ok) return {...updated,message:'号码池已创建，但加入号码失败：'+updated.message,createdId:found.id};
    return {ok:true,message:'号码池及号码已创建',row:updated.row,revision:updated.revision,
      request:req,response:createResponse,listResponse:refreshed.response,updateResponse:updated.response};
  }
  function taskReferences(scope,pool) {
    const seen = new Set(), matches = [];
    const linked = source => {
      if (!object(source)) return false;
      return Array.isArray(source.clidPoolList) &&
        source.clidPoolList.some(item => item && (item.name === pool.name ||
          (item.poolId && String(item.poolId) === String(pool.id))));
    };
    const sources = [
      ...(root.CloudCallData?.tasks || []),
      ...(root.CloudCallData?.predictiveTasks || []),
      ...(root.CloudCallData?.ivrTasks || [])
    ];
    function storedRows(key) {
      const raw = root.sessionStorage.getItem(key);
      if (raw === null) return [];
      const rows = JSON.parse(raw);
      if (!Array.isArray(rows)) throw Error('任务引用数据结构无效');
      return rows;
    }
    try { sources.push(...storedRows('cloud-task-created-v1')); }
    catch (_) { return [{taskId:'未能核对任务引用',status:'待核对'}]; }
    for (const row of sources) {
      if (!row || text(row.enterpriseId) !== scope.enterpriseId || text(row.tenantId) !== scope.tenantId ||
        terminalStatuses.has(row.status)) continue;
      const values = [row,row.values,row.executionConfig,row.planSnapshot,row.alictiCreateDraft?.fields,row.alictiUpdateDraft?.fields];
      if (!values.some(linked)) continue;
      const id = text(row.taskId || row.id);
      if (seen.has(id)) continue;
      seen.add(id); matches.push({taskId:id,name:text(row.name),status:text(row.status)});
    }
    try {
      const drafts = storedRows('cloud-task-wizard-drafts-v1');
      drafts.forEach(row => {
        if (!row || text(row.enterpriseId) !== scope.enterpriseId || text(row.tenantId) !== scope.tenantId ||
          terminalStatuses.has(row.status) || row.status === '已提交' || !linked(row.values)) return;
        const id = text(row.draftId || row.taskId);
        if (!seen.has(id)) { seen.add(id); matches.push({taskId:id,name:text(row.name || row.values?.name),status:'草稿'}); }
      });
    } catch (_) { return [{taskId:'未能核对草稿引用',status:'待核对'}]; }
    return matches;
  }
  function updateFields(id,input,existing,scope) {
    if (!object(input)) return fail('请填写号码池更新信息');
    const name = text(input.name).trim();
    if (!validText(name,80,true)) return fail('号码池名称必填，且不超过 80 字');
    if (![0,1].includes(input.isDefault)) return fail('请选择是否为默认号码池');
    if (!Object.hasOwn(input,'numbers')) return fail('更新号码池必须提交完整号码列表');
    const numbers = numberList(input.numbers);
    if (!numbers.ok) return fail(numbers.message);
    const hasComment = Object.hasOwn(input,'comment');
    const comment = hasComment ? text(input.comment).trim() : existing.comment;
    if (!validText(comment,500,false)) return fail('备注不能超过 500 字或包含控制字符');
    if (existing.isDefault === 1 && (name !== existing.name || input.isDefault !== 1))
      return fail('默认号码池不能改名或取消默认');
    if (name !== existing.name && taskReferences(scope,existing).length)
      return fail('号码池仍被未结束任务或草稿使用，请先解除任务引用后再改名');
    return {ok:true,id,name,numbers:numbers.value,isDefault:input.isDefault,comment,hasComment};
  }
  async function update(groupId,input,options={}) {
    const scope = scopeFor(options.tenantId,true);
    if (!scope.ok) return fail(scope.message,403);
    const id = normalizeId(groupId);
    if (!id) return fail('请选择有效的号码池');
    const snapshot = catalog(scope.tenantId);
    if (!snapshot.ok) return fail(snapshot.message);
    const stale = checkOptions(options,snapshot);
    if (stale) return stale;
    const existing = snapshot.rows.find(row => row.id === id);
    if (!existing) return fail('当前 AliCti 账号没有此号码池');
    const parsed = updateFields(id,input,existing,scope);
    if (!parsed.ok) return parsed;
    const req = request('update',scope,{groupId:id,name:parsed.name,numbers:parsed.numbers,
      isDefault:parsed.isDefault,...(parsed.hasComment ? {comment:parsed.comment} : {})});
    const saved = mutate(scope,options,rows => {
      const index = rows.findIndex(row => row.id === id);
      if (index < 0) return fail('当前 AliCti 账号没有此号码池');
      if (rows.some(row => row.id !== id && row.name.trim().toLocaleLowerCase() === parsed.name.toLocaleLowerCase()))
        return fail('当前 AliCti 账号已有同名号码池');
      if (parsed.isDefault === 1 && rows.some(row => row.id !== id && row.isDefault === 1))
        return fail('当前 AliCti 账号已有默认号码池');
      const row = {...rows[index],name:parsed.name,numbers:parsed.numbers,isDefault:parsed.isDefault,
        localUpdatedAt:new Date().toISOString(),
        ...(parsed.hasComment ? {comment:parsed.comment} : {})};
      rows[index] = row;
      return {ok:true,row:clone(row)};
    });
    if (!saved.ok) return saved;
    const res = response(0,'更新成功',null);
    appendRequest('update',scope,req,res);
    return {ok:true,message:'号码池已更新',row:publicRow(saved.row,scope),revision:saved.revision,request:req,response:res};
  }
  async function remove(groupId,options={}) {
    const scope = scopeFor(options.tenantId,true);
    if (!scope.ok) return fail(scope.message,403);
    const id = normalizeId(groupId);
    if (!id) return fail('请选择有效的号码池');
    const snapshot = catalog(scope.tenantId);
    if (!snapshot.ok) return fail(snapshot.message);
    const stale = checkOptions(options,snapshot);
    if (stale) return stale;
    const existing = snapshot.rows.find(row => row.id === id);
    if (!existing) return fail('当前 AliCti 账号没有此号码池');
    const references = taskReferences(scope,existing);
    if (references.length) return fail(existing.isDefault === 1 ?
      '默认号码池配置仍被未结束任务或草稿使用，不能删除；请先解除任务引用' :
      '号码池仍被未结束任务或草稿使用，请先解除任务引用后再删除');
    const req = request('delete',scope,{groupId:id});
    const saved = mutate(scope,options,rows => {
      const index = rows.findIndex(row => row.id === id);
      if (index < 0) return fail('当前 AliCti 账号没有此号码池');
      rows.splice(index,1);
      return {ok:true};
    });
    if (!saved.ok) return saved;
    const res = response(0,'删除成功',null);
    appendRequest('delete',scope,req,res);
    return {ok:true,message:'号码池已删除',revision:saved.revision,request:req,response:res};
  }
  function describe(rowOrId,tenantId) {
    if (rowOrId === undefined) return {simulation:true,auth:'validateType=2；数字 enterpriseId 模拟为 Int；timestamp 与 sign 仅为模拟占位，不生成真实签名；非数字账号仅本地虚拟',
      endpoints:clone(endpoints),createId:'create 响应不含 ID，需重查 list 后按同企业唯一名称取回 ID'};
    const data = catalog(tenantId);
    if (!data.ok) return null;
    const row = object(rowOrId) ? data.rows.find(item => item.id === normalizeId(rowOrId.id)) :
      data.rows.find(item => item.id === normalizeId(rowOrId));
    if (!row) return null;
    const scope = scopeFor(tenantId), numbers = row.numbers;
    return {...clone(row),numberList:numbers,numberCount:numbers.length,
      typeLabel:row.type === 0 ? '类型 0' : '类型 1',
      defaultLabel:row.isDefault === 1 ? '默认' : row.isDefault === 0 ? '非默认' : '未设置',
      inUseBy:taskReferences(scope,row)};
  }

  root.AliCtiNumberPools = Object.freeze({
    storageKey,historyKey,contextKey,canAccess,catalog,list,create,update,remove,describe,
    requestHistory,storageError,endpoints
  });
})(window);
