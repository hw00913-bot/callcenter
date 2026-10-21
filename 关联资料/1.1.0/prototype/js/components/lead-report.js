/** Lead cohorts: aggregate authorized business rows by account, brand and exact lead code. */
(function (root) {
  'use strict';
  const array = value => Array.isArray(value) ? value : [];
  const text = value => value == null ? '' : String(value);
  const code = value => typeof value === 'string' ? value.trim() : '';
  // Business identifiers are compared as received; trimming is only an emptiness check.
  const leadCode = value => typeof value === 'string' && value.trim() ? value : '';
  const fields = ['leadLevel', 'intentionLevel', 'visitIntention', 'testDriveIntention', 'plannedVisitAt', 'plannedStoreName'];
  const flags = ['assigned', 'contacted', 'connected', 'pendingFollowup', 'completed', 'intentionRecorded', 'visitIntended', 'testDriveIntended', 'plannedVisit'];
  const unique = values => [...new Set(values.filter(Boolean))];
  const sameScope = (a, b) => a.tenantId === b.tenantId && a.enterpriseId === b.enterpriseId;
  const metrics = () => root.CloudReportMetrics;
  const at = value => metrics().timestamp(value);
  const maxTime = values => { const times = values.map(at).filter(value => value !== null); return times.length ? Math.max(...times) : null; };
  function brandOf(row, source, parent) {
    const explicit = code(row?.brandId) || code(row?.customerBrandId);
    if (explicit) return explicit;
    const inherited = code(parent?.brandId) || code(parent?.customerBrandId);
    if (inherited) return inherited;
    const tenant = source.tenants.find(t => sameScope(t, row));
    const instance = array(source.instances).find(i => i.enterpriseId === row.enterpriseId);
    // The existing platform models one customer/brand per supplier account.
    // An explicit brand always takes priority; different explicit brands never collapse.
    return code(tenant?.brandId) || code(instance?.brandId) || 'enterprise:' + row.enterpriseId;
  }
  function groupKey(item, source) {
    const value = leadCode(item.externalDocumentId), brand = brandOf(item, source);
    return JSON.stringify([item.enterpriseId, brand, value ? 'code' : 'missing', value || item.key]);
  }
  function callKey(call, source) {
    const fact = root.AliCtiReportFacts?.read(call);
    if (fact?.present) return fact.usable && fact.mainUniqueId ? JSON.stringify([call.enterpriseId, 'provider', fact.mainUniqueId]) : '';
    return call.callId ? JSON.stringify([call.enterpriseId, 'local', call.callId]) : '';
  }
  function importTime(item) { return at(item.createdAt); }
  function itemTime(item) { return maxTime([item.updatedAt, item.createdAt, ...item.journalCalls.map(c => c.updatedAt || c.at || c.endedAt)]); }
  function callTime(call) { return metrics().callTime(call) ?? maxTime([call.at, call.updatedAt]); }
  function updatedTime(call) { return maxTime([call.customerFollowup?.updatedAt, call.updatedAt, callTime(call)]); }
  function choices(field, source) {
    return root.CustomerBusiness?.fields
      ? array(array(root.CustomerBusiness.fields('lead', source)).find(row => row.id === field)?.options).map(option => typeof option === 'object' && option !== null ? text(option.id) : text(option))
      : array(root.CustomerFollowupOptions?.[field]);
  }
  function validField(field, source) {
    return !root.CustomerBusiness?.fields || array(root.CustomerBusiness.fields('lead', source)).some(row => row.id === field);
  }
  function followup(calls) {
    const result = Object.fromEntries(fields.map(field => [field, '']));
    result.plannedStoreId = ''; result.fieldSources = {};
    const sorted = calls.filter(call => call.customerFollowup && at(call.customerFollowup.updatedAt) !== null)
      .slice().sort((a, b) => at(a.customerFollowup.updatedAt) - at(b.customerFollowup.updatedAt) || text(a.callId).localeCompare(text(b.callId)));
    sorted.forEach(call => {
      const values = call.customerFollowup;
      fields.forEach(field => {
        const value = code(values[field]);
        if (!value || !validField(field, call) || choices(field, call).length && !choices(field, call).includes(value)) return;
        if (field === 'plannedVisitAt' && at(value) === null) return;
        result[field] = value;
        result.fieldSources[field] = { callId: call.callId || '', updatedAt: values.updatedAt, tenantId: call.tenantId, enterpriseId: call.enterpriseId };
        if (field === 'plannedStoreName') result.plannedStoreId = code(values.plannedStoreId);
      });
    });
    return result;
  }
  function currentFollowup(items, calls) {
    const candidates = items.filter(i => i.followup).map(i => ({ value: i.followup, time: itemTime(i) }));
    calls.filter(c => c.followupStatus).forEach(c => candidates.push({ value: c.followupStatus, time: updatedTime(c) }));
    if (!candidates.length) return '待联系';
    const known = candidates.filter(c => c.time !== null), latest = known.length ? Math.max(...known.map(c => c.time)) : null;
    const values = unique(candidates.filter(c => c.time === latest).map(c => c.value));
    return values.length === 1 ? values[0] : '待核对';
  }
  function matches(row, filters, source, helpers) {
    if (filters.batchId && !row.batches.some(b => b.id === filters.batchId)) return false;
    if (filters.taskId && !row.tasks.some(t => t.id === filters.taskId)) return false;
    if (filters.callType && !row.items.some(i => i.method === filters.callType) && !row.calls.some(c => c.callType === filters.callType)) return false;
    if (filters.businessType && filters.businessType !== 'lead') return false;
    for (const field of fields.filter(f => !['plannedVisitAt', 'plannedStoreName'].includes(f))) if (filters[field] && row[field] !== filters[field]) return false;
    if (filters.plannedStoreId && row.plannedStoreId !== filters.plannedStoreId) return false;
    if (filters.plannedStoreName && !row.plannedStoreName.toLocaleLowerCase().includes(filters.plannedStoreName.toLocaleLowerCase())) return false;
    if (filters.agentId && !row.calls.some(c => { const a = source.agentByCall.get(c); return a && helpers.agentMatches(a, filters.agentId); }) &&
      !row.items.some(i => source.agents.some(a => sameScope(a, i) && a.accountId && a.accountId === i.ownerId && helpers.agentMatches(a, filters.agentId)))) return false;
    if (filters.skillGroupId && !row.calls.some(c => { const g = source.skillByCall.get(c); return g && helpers.skillMatches(g, filters.skillGroupId); })) return false;
    return !filters.keyword || [row.code, row.name, ...row.phones, ...row.tenantNames, ...row.batches.map(b => b.name), ...row.tasks.map(t => t.name)]
      .join(' ').toLocaleLowerCase().includes(filters.keyword.toLocaleLowerCase());
  }
  function build(model, source, helpers) {
    const filters = model.filters, issues = [], groups = new Map();
    // Authorization has already scoped every source; tenant filters further narrow before merging.
    const items = source.items.filter(i => i.businessType === 'lead' && (!filters.tenantId || i.tenantId === filters.tenantId));
    items.forEach(item => {
      const key = groupKey(item, source);
      if (!groups.has(key)) groups.set(key, { key, id: key, enterpriseId: item.enterpriseId, brandId: brandOf(item, source), code: leadCode(item.externalDocumentId), items: [], calls: [] });
      groups.get(key).items.push(item);
    });
    const issue = (call, reason) => issues.push({ callId: call.callId || '', enterpriseId: call.enterpriseId, tenantId: call.tenantId, reason, call });
    const selectedCalls = source.allCalls.filter(c => !filters.tenantId || c.tenantId === filters.tenantId).slice();
    // A persisted business journal is explicit attempt evidence, not a phone-based association.
    items.forEach(item => item.journalCalls.forEach(record => {
      if (!record.callId || source.allCalls.some(c => c.enterpriseId === item.enterpriseId && c.callId === record.callId)) return;
      selectedCalls.push({ ...record, tenantId: item.tenantId, enterpriseId: item.enterpriseId, brandId: brandOf(item, source),
        businessType: 'lead', customerTaskItemId: item.id, customerTaskBatchId: item.batchId, externalDocumentId: item.externalDocumentId,
        customerName: item.name, callee: item.phone, callType: item.method, taskId: item.taskId, ringingAt: record.at || record.endedAt,
        agentDisposition: record.agentDisposition || record.disposition || '', journalEvidence: true });
    }));
    const pending = new Map();
    selectedCalls.forEach(call => {
      const candidates = items.filter(item => sameScope(item, call) && (
        call.customerTaskItemId && item.id === call.customerTaskItemId && (!(call.customerTaskBatchId || call.customerBatchId || call.batchId) || item.batchId === (call.customerTaskBatchId || call.customerBatchId || call.batchId)) ||
        call.callId && item.journalCalls.some(record => record.callId === call.callId)));
      if (call.businessType && call.businessType !== 'lead') { if (candidates.length) issue(call, '通话业务类型与关联线索不一致'); return; }
      if (call.businessType !== 'lead' && !candidates.length) return;
      const fact = root.AliCtiReportFacts?.read(call);
      if (fact?.present && !fact.usable) { issue(call, '供应商话单身份或字段未通过核对'); return; }
      const explicitCode = leadCode(call.externalDocumentId);
      let key = '', brand = brandOf(call, source);
      if (candidates.length) {
        const keys = unique(candidates.map(item => groupKey(item, source)));
        if (keys.length !== 1) { issue(call, '名单关联同时指向多个线索，未合并'); return; }
        const target = groups.get(keys[0]);
        const explicitBrand = code(call.brandId) || code(call.customerBrandId);
        if (explicitBrand && explicitBrand !== target.brandId || explicitCode && explicitCode !== target.code || call.externalDocumentId != null && typeof call.externalDocumentId !== 'string') {
          issue(call, '通话编码或客户品牌与关联名单冲突'); return;
        }
        key = keys[0]; brand = target.brandId;
      } else if (call.customerTaskItemId) { issue(call, '明确名单关联不在当前可见范围或已失效'); return;
      } else if (explicitCode) {
        key = JSON.stringify([call.enterpriseId, brand, 'code', explicitCode]);
        if (!groups.has(key)) { issue(call, '当前可见范围没有匹配编码的导入线索'); return; }
      } else { issue(call, '缺少线索编码或明确名单关联，未按手机号推断'); return; }
      const id = callKey(call, source);
      if (!id) { issue(call, '缺少可核对的通话唯一标识'); return; }
      if (!pending.has(id)) pending.set(id, []);
      pending.get(id).push({ key, call });
    });
    pending.forEach(records => {
      if (unique(records.map(r => r.key)).length !== 1) { records.forEach(r => issue(r.call, '同一通话被关联到不同线索，未重复计入')); return; }
      const ordered = records.slice().sort((a, b) => (updatedTime(b.call) ?? -Infinity) - (updatedTime(a.call) ?? -Infinity));
      groups.get(records[0].key).calls.push(ordered[0].call);
    });
    const rows = [...groups.values()].map(row => {
      const orderedItems = row.items.slice().sort((a, b) => (itemTime(b) ?? -Infinity) - (itemTime(a) ?? -Infinity));
      const times = row.items.map(importTime).filter(t => t !== null);
      const calls = row.calls.slice().sort((a, b) => (callTime(b) ?? -Infinity) - (callTime(a) ?? -Infinity));
      const fields = followup(calls), status = currentFollowup(row.items, calls);
      const last = calls.find(c => callTime(c) !== null), disposition = calls.filter(c => c.agentDisposition || c.disposition)
        .sort((a, b) => (maxTime([b.dispositionUpdatedAt, b.updatedAt, callTime(b)]) ?? -Infinity) - (maxTime([a.dispositionUpdatedAt, a.updatedAt, callTime(a)]) ?? -Infinity))[0];
      const batches = row.items.map(i => ({ id: i.batchId, name: i.batchName, tenantId: i.tenantId }));
      const references = [...row.items, ...calls];
      const taskReferences = references.filter(reference => reference.taskId).map(reference => ({ id: reference.taskId, tenantId: reference.tenantId, enterpriseId: reference.enterpriseId }));
      const tasks = [...new Map(taskReferences.map(reference => [JSON.stringify([reference.enterpriseId, reference.tenantId, reference.id]), reference])).values()]
        .map(reference => { const task = source.tasks.find(t => t.taskId === reference.id && sameScope(t, reference)); return { ...reference, name: task?.name || reference.id }; });
      const result = { ...row, name: orderedItems.find(i => i.name)?.name || calls.find(c => c.customerName)?.customerName || '未填写',
        codeStatus: row.code ? '已编号' : '待补编号', phones: unique([...row.items.map(i => i.phone), ...calls.map(c => metrics().customerPhone(c))]),
        tenantNames: unique(references.map(reference => source.tenants.find(t => sameScope(t, reference))?.name || reference.tenantId)),
        tenantIds: unique(references.map(reference => reference.tenantId)), batches: [...new Map(batches.map(b => [JSON.stringify([b.tenantId, b.id]), b])).values()], tasks,
        firstImportedAt: times.length ? Math.min(...times) : null, importTimeIncomplete: times.length !== row.items.length,
        calls, callCount: calls.length, connectedCount: calls.filter(c => metrics().state(c).answered === true).length,
        lastContactAt: last ? callTime(last) : null, latestDisposition: text(disposition?.agentDisposition || disposition?.disposition),
        ...fields, followupStatus: status, assigned: row.items.some(i => i.ownerId || i.taskId), contacted: calls.length > 0,
        connected: calls.some(c => metrics().state(c).answered === true), completed: status === '已完成', pendingFollowup: status !== '已完成',
        intentionRecorded: !!fields.intentionLevel, visitIntended: fields.visitIntention === '有意向', testDriveIntended: fields.testDriveIntention === '有意向',
        plannedVisit: !!fields.plannedVisitAt };
      result.flags = Object.fromEntries(flags.map(field => [field, result[field]]));
      return result;
    });
    const matched = rows.filter(row => matches(row, filters, source, helpers));
    model.rows = matched.filter(row => row.firstImportedAt !== null && helpers.within(row.firstImportedAt, filters)).sort((a, b) => (b.lastContactAt ?? b.firstImportedAt) - (a.lastContactAt ?? a.firstImportedAt) || a.key.localeCompare(b.key));
    model.items = model.rows.flatMap(row => row.items); model.calls = model.rows.flatMap(row => row.calls);
    model.summary = { ...metrics().stats(model.calls, source.allCalls), leadCount: model.rows.length, totalLeads: model.rows.length,
      ...Object.fromEntries(flags.map(field => [field, model.rows.filter(row => row[field]).length])), missingCode: model.rows.filter(row => !row.code).length,
      intentionDistribution: unique(source.tenants.filter(tenant => !filters.tenantId || tenant.tenantId === filters.tenantId).flatMap(tenant => choices('intentionLevel', tenant))).map(value => ({ value, count: model.rows.filter(row => row.intentionLevel === value).length })) };
    model.timeMissing = matched.filter(row => row.firstImportedAt === null).length;
    model.timeFallback = 0; model.cohortBasis = 'first-visible-import'; model.dataBasis = 'platform-lead-cohort';
    model.associationIssues = issues; model.unassociatedCalls = [...new Map(issues.map(i => [JSON.stringify([i.enterpriseId, i.tenantId, i.callId]), i.call])).values()];
    model.excludedUnassociatedCalls = model.unassociatedCalls; model.excludedUnassociated = model.unassociatedCalls.length;
    return model;
  }
  root.CloudLeadReport = Object.freeze({ build, brandOf, groupKey, fields, flags });
})(typeof window === 'undefined' ? globalThis : window);
