/* AliCti task/update contract demonstration. All responses are local fixtures. */
(function (root) {
  'use strict';

  const fields = root.AliCtiFields;
  const allowed = new Set([
    'name', 'description', 'businessTagNames',
    'autoStart', 'autoStartDay', 'autoStartTime', 'autoStop', 'autoStopDay', 'autoStopTime',
    'forceEndFlag', 'autoTaskType', 'autoTriggerTimeStrategy', 'autoComplete',
    'retryStrategy', 'retryStrategyTimeType', 'retryStrategyOnlyToday', 'callPriorityStrategy',
    'customerClidsCategory', 'customerClidsGroup', 'clidPoolList', 'customerTimeout',
    'concurrency', 'userFields', 'callVariables', 'timeStrategy',
    'callRouteStrategy', 'ivrId', 'ivrName', 'cnos', 'agentGroup', 'callStrategy',
    'agentTimeout', 'wrapup', 'maxWaitTime', 'minAvailableAgentCount', 'quotiety',
    'predictAdjust', 'callLimitStrategy', 'customerMoh', 'customerVoice',
    'answerRate', 'warmUpDuration', 'isRewarm'
  ]);
  const authKeys = new Set(['validateType', 'enterpriseId', 'timestamp', 'sign']);
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const integer = value => fields?.integer?.(value) ?? null;
  const statusCode = value => fields?.code?.(value) ?? null;
  const result = (ok, pending, message, trace, property) => ({
    ok, pending, message, trace: clone(trace), property: clone(property) ?? null, mock: true
  });
  const update = { scenario: 'success', trace: [] };

  function supplierId(row) {
    const real = integer(row?.providerTaskId);
    if (real > 0) return real;
    if (row?.simulation === true && row?.localPrototypeTask === true) {
      const demo = integer(row.demoProviderTaskId);
      if (demo > 0) return demo;
    }
    const seed = root.AliCtiDemo?.taskControlSeed?.(row);
    const id = integer(seed?.id);
    return id > 0 ? id : null;
  }

  function initialProperty(row, id) {
    const recorded = row.alictiMockTaskProperty ||
      (statusCode(row.alictiControlResponse?.result) === 0 ? row.alictiControlResponse?.data?.taskProperty : null);
    if (recorded) return clone(recorded);
    const seed = root.AliCtiDemo?.taskControlSeed?.(row);
    if (seed && integer(seed.id) === id) return clone(seed);
    const status = statusCode(row.providerStatusCode);
    return Object.hasOwn(fields.taskStatus, status) ? { id, status } : { id };
  }

  function verifiedProperty(response, id, enterpriseId, type) {
    const property = response?.data?.taskProperty;
    const status = statusCode(property?.status);
    if (statusCode(response?.result) !== 0 || integer(property?.id) !== id ||
      !Object.hasOwn(fields.taskStatus, status) ||
      (property && Object.hasOwn(property, 'type') && statusCode(property.type) !== type) ||
      (property && Object.hasOwn(property, 'enterpriseId') && integer(property.enterpriseId) !== enterpriseId)) return null;
    return property;
  }

  function record(trace, phase, endpoint, requestFields, response) {
    trace.push({ order: trace.length + 1, phase, endpoint, fields: clone(requestFields), response: clone(response), mock: true });
    update.trace = clone(trace);
  }

  function guard(row, request) {
    if (!row || typeof row !== 'object' || row.displayOnly || row.alictiTaskControlPending ||
      ['已完成', '已结束', '已终止', '已删除'].includes(row.status) ||
      [row.providerStatusCode, row.alictiMockTaskProperty?.status,
        row.alictiControlResponse?.data?.taskProperty?.status].some(value => statusCode(value) === 3))
      return '当前任务不可编辑';
    const enterpriseId = integer(row.enterpriseId);
    if (!(enterpriseId > 0)) return '任务所属 AliCti 账号待核对';
    const type = row.callType === '预外呼' ? 1 : row.callType === 'IVR 外呼' ? 2 : null;
    if (!type || (row.providerType != null && statusCode(row.providerType) !== type))
      return '任务类型与供应商类型不一致';
    const current = root.AppState?.get?.();
    if (current && (current.activeDomain !== 'CLOUD_CONTACT_CENTER' ||
      integer(current.enterpriseId) !== enterpriseId ||
      !root.AppState.authorizeObject('task.create', row) ||
      !root.AppState.scoped([row]).length)) return '当前无权编辑此任务';
    const id = supplierId(row);
    if (!(id > 0)) return '供应商任务编号待确认，不能提交更新';
    if (!request || request.endpoint !== 'task/update' || !request.fields ||
      typeof request.fields !== 'object' || Array.isArray(request.fields) ||
      request.errors?.length || request.pending?.length) return '任务更新字段尚未通过接口校验';
    if (integer(request.fields.taskId) !== id) return '更新请求的供应商任务编号与当前任务不一致';
    if (Object.hasOwn(request.fields, 'enterpriseId') && integer(request.fields.enterpriseId) !== enterpriseId)
      return '更新请求的 AliCti 账号与当前任务不一致';
    if (Object.hasOwn(request.fields, 'validateType') && statusCode(request.fields.validateType) !== 2)
      return '更新请求的账号鉴权方式不正确';
    const keys = Object.keys(request.fields).filter(key => key !== 'taskId' && !authKeys.has(key));
    if (!keys.length) return '任务设置没有变化';
    if (Object.keys(request.fields).some(key => key !== 'taskId' && !authKeys.has(key) && !allowed.has(key)))
      return '更新请求包含接口不支持的任务字段';
    return '';
  }

  update.submit = function submit(row, request) {
    const trace = [];
    update.trace = [];
    const problem = guard(row, request);
    if (problem) return result(false, false, problem, trace, null);

    const id = supplierId(row), enterpriseId = integer(row.enterpriseId);
    const type = row.callType === '预外呼' ? 1 : 2;
    const readFields = { enterpriseId, taskId: String(id) };
    const beforeResponse = { result: 0, data: { taskProperty: initialProperty(row, id) }, mock: true };
    record(trace, 'before', 'task/get', readFields, beforeResponse);
    const before = verifiedProperty(beforeResponse, id, enterpriseId, type);
    if (!before) return result(false, true, '操作前未能核对任务身份及状态，更新未提交', trace, null);
    if (statusCode(before.status) === 3) return result(false, false, '供应商任务已结束，不能更新', trace, before);
    // The task may have changed while the read fixture was produced. Do not
    // submit against an expired scope or another supplier task identity.
    const changed = guard(row, request);
    if (changed || supplierId(row) !== id) return result(false, false, changed || '任务身份已变化，更新未提交', trace, before);

    const scenario = update.scenario;
    const writeResponse = scenario === 'write-failure'
      ? { result: -1, description: '更新被拒绝（本地模拟）', mock: true }
      : { result: 0, description: '更新请求已受理（本地模拟）', mock: true };
    record(trace, 'write', 'task/update', request.fields, writeResponse);
    if (statusCode(writeResponse.result) !== 0) return result(false, false, '任务更新被拒绝，原配置未改变', trace, before);

    const changedFields = Object.fromEntries(Object.entries(request.fields).filter(([key]) => allowed.has(key)));
    const projected = { ...clone(before), ...clone(changedFields), id, status: statusCode(before.status) };
    const afterResponse = scenario === 'after-unknown'
      ? { result: -1, description: '更新后查询结果未知（本地模拟）', mock: true }
      : { result: 0, data: { taskProperty: projected }, mock: true };
    record(trace, 'after', 'task/get', readFields, afterResponse);
    const after = verifiedProperty(afterResponse, id, enterpriseId, type);
    if (!after || !Object.entries(changedFields).every(([key, value]) => same(after[key], value)))
      return result(false, true, '更新后的任务设置尚未查证，原配置未改变', trace, null);
    return result(true, false, '已核对原任务的更新设置（本地模拟）', trace, after);
  };

  root.AliCtiTaskUpdate = update;
})(window);
