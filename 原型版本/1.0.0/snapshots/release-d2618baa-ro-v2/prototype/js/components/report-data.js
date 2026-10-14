/** Read-only, permission-scoped data models for the cloud reports and the lead cohort report. */
(function (root) {
  'use strict';
  const views = ['overview', 'customers', 'outbound', 'inbound', 'agents', 'skills', 'leads'];
  const types = ['人工外呼', '预外呼', 'IVR 外呼', '呼入'];
  const metrics = () => root.CloudReportMetrics, data = () => root.CloudCallData;
  const array = value => Array.isArray(value) ? value : [];
  const text = value => value === null || value === undefined ? '' : String(value);
  const sameScope = (a, b) => a.tenantId === b.tenantId && a.enterpriseId === b.enterpriseId;
  const identity = call => call.contactCenterIdentityId || call.agentIdentityId || '';
  const day = date => date.toLocaleDateString('sv-SE');
  function valid() { return root.AppState.effectiveAccess().valid && root.AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER' && root.AppState.canMenu('reports.cloud'); }
  function scopeKey() { const context = root.AppState.get(), access = root.AppState.effectiveAccess(); return JSON.stringify([context.accountId, context.tenantId, context.enterpriseId, context.activeDomain, access.roleCode]); }
  function defaults() {
    const end = new Date(), start = new Date(end.getFullYear(), end.getMonth(), end.getDate()); start.setDate(start.getDate() - 6);
    return { period: '近 7 日', startDate: day(start), endDate: day(end), tenantId: '', businessType: '', callType: '', batchId: '', taskId: '', agentId: '', skillGroupId: '', keyword: '', leadLevel: '', intentionLevel: '', visitIntention: '', testDriveIntention: '', plannedStoreId: '', plannedStoreName: '' };
  }
  function scoped(rows) {
    const access = root.AppState.effectiveAccess(), instance = root.AppState.get().enterpriseId;
    return root.AppState.scoped(array(rows)).filter(row => row.enterpriseId === instance && array(access.tenantIds).includes(row.tenantId));
  }
  function businessType(value, source) {
    if (typeof value !== 'string' || !value) return '';
    return root.CustomerBusiness?.get ? (root.CustomerBusiness.get(value, source) ? value : '') : value;
  }
  function businessOptions(tenantId = '') {
    if (!valid()) return [];
    const merged = new Map();
    scoped(data().tenants).filter(tenant => !tenantId || tenant.tenantId === tenantId).forEach(tenant => {
      const rows = root.CustomerBusiness?.list?.(tenant, true) || [];
      rows.forEach(row => {
        if (!merged.has(row.id)) merged.set(row.id, { id: row.id, labels: [] });
        const result = merged.get(row.id); if (!result.labels.includes(row.label)) result.labels.push(row.label);
      });
    });
    // Standalone read models may omit the dictionary; preserve their explicit source IDs.
    if (!root.CustomerBusiness?.list) {
      const batches = scoped(root.CustomerTasks?.reportSnapshot?.() || []);
      const sources = [...batches.flatMap(batch => [batch, ...array(batch.rows).map(row => ({ ...row, tenantId: batch.tenantId, enterpriseId: batch.enterpriseId }))]), ...scoped(data().calls)];
      sources.filter(row => !tenantId || row.tenantId === tenantId).forEach(row => { if (businessType(row.businessType, row) && !merged.has(row.businessType)) merged.set(row.businessType, { id: row.businessType, labels: [row.businessType] }); });
    }
    return [...merged.values()].map(row => ({ id: row.id, label: row.labels.join(' / ') }));
  }
  function fieldOptions(field, tenantId = '') {
    if (!valid()) return [];
    if (!root.CustomerBusiness?.fields) return array(root.CustomerFollowupOptions?.[field]);
    return [...new Set(scoped(data().tenants).filter(tenant => !tenantId || tenant.tenantId === tenantId)
      .flatMap(tenant => array(root.CustomerBusiness.fields('lead', tenant)).find(row => row.id === field)?.options || [])
      .map(option => typeof option === 'object' && option !== null ? text(option.id) : text(option)))];
  }
  // Supplier CDRs retain cno but do not identify a particular deleted/recreated
  // configuration. Scope first, then group historical instances for reporting only.
  function agentGroupKey(agent) {
    return typeof agent.cno === 'string' && agent.cno !== '' && agent.enterpriseId && agent.tenantId
      ? 'cno:' + JSON.stringify([agent.enterpriseId, agent.tenantId, agent.cno]) : '';
  }
  function reportAgents(instances) {
    const grouped = new Map();
    instances.forEach((agent, index) => {
      const key = agentGroupKey(agent) || 'instance:' + index;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(agent);
    });
    return [...grouped.entries()].map(([key, members]) => {
      if (members.length === 1) return { ...members[0], reportInstanceIds: [members[0].contactCenterIdentityId] };
      const first = members[0], name = `工号 ${first.cno}（含历史）`;
      return { id: key, agentRecordId: key, enterpriseId: first.enterpriseId, tenantId: first.tenantId, cno: first.cno,
        name, userName: name, lifecycleStatus: '工号汇总', reportCnoGroup: true,
        reportInstanceIds: members.map(agent => agent.contactCenterIdentityId),
        reportAliases: members.flatMap(agent => [agent.id, agent.agentRecordId, agent.contactCenterIdentityId]).filter(Boolean),
        reportNames: members.map(agent => agent.userName).filter(Boolean) };
    });
  }
  function options() {
    if (!valid()) return { tenants: [], batches: [], tasks: [], agents: [], skills: [], stores: [], instances: [] };
    const batches = scoped(root.CustomerTasks?.reportSnapshot?.() || []);
    const agentInstances = scoped(data().agents).map(row => ({ ...row, id: row.agentRecordId, name: row.userName }));
    return {
      tenants: scoped(data().tenants).map(row => ({ ...row, id: row.tenantId })),
      stores: scoped(data().tenants).filter(row => row.organizationScope === 'STORE').map(row => ({ ...row, id: row.tenantId })),
      instances: array(data().instances).filter(row => row.enterpriseId === root.AppState.get().enterpriseId).map(row => ({ ...row })),
      batches: batches.map(row => ({ ...row, rows: array(row.rows).map(item => ({ ...item })) })),
      tasks: scoped(data().tasks).filter(row => ['预外呼', 'IVR 外呼'].includes(row.callType)).map(row => ({ ...row, id: row.taskId })),
      agents: reportAgents(agentInstances), agentInstances,
      skills: scoped(data().physicalSkillGroups).map(row => ({ ...row, id: row.physicalGroupId }))
    };
  }
  function dateValue(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, date] = value.split('-').map(Number), at = new Date(year, month - 1, date);
    return at.getFullYear() === year && at.getMonth() === month - 1 && at.getDate() === date ? at : null;
  }
  function agentMatches(agent, id) { return !!id && [agent.id, agent.agentRecordId, agent.contactCenterIdentityId, agentGroupKey(agent), ...array(agent.reportAliases)].includes(id); }
  function skillMatches(group, id) { return [group.id, group.physicalGroupId, group.skillGroupId].includes(id); }
  function normalize(input = {}) {
    const result = defaults();
    Object.keys(result).forEach(key => { if (input[key] !== undefined && input[key] !== null) result[key] = text(input[key]).trim(); });
    if (!['今日', '近 7 日', '本月', '自定义'].includes(result.period)) return { ...result, error: '请选择有效的统计周期' };
    if (result.period !== '自定义') {
      const end = new Date(), start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      if (result.period === '近 7 日') start.setDate(start.getDate() - 6);
      if (result.period === '本月') start.setDate(1);
      result.startDate = day(start); result.endDate = day(end);
    }
    const start = dateValue(result.startDate), end = dateValue(result.endDate);
    if (!start || !end) return { ...result, error: '请填写有效的开始和结束日期' };
    if (start > end) return { ...result, error: '开始日期不能晚于结束日期' };
    const count = (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000 + 1;
    if (count > 366) return { ...result, error: '单次查询最多 366 天，请缩小日期范围' };
    if (result.businessType && ![...businessOptions(result.tenantId).map(row => row.id), 'unclassified'].includes(result.businessType)) return { ...result, error: '请选择有效的业务类型' };
    if (result.callType && !types.includes(result.callType)) return { ...result, error: '请选择有效的呼叫方式' };
    if (valid()) {
      const available = options();
      const checks = [
        ['tenantId', available.tenants, (row, id) => row.tenantId === id],
        ['batchId', available.batches, (row, id) => row.id === id],
        ['taskId', available.tasks, (row, id) => row.taskId === id],
        ['agentId', available.agents, agentMatches],
        ['skillGroupId', available.skills, skillMatches],
        ['plannedStoreId', available.stores, (row, id) => row.tenantId === id]
      ];
      if (checks.some(([key, rows, match]) => result[key] && !rows.some(row => match(row, result[key])))) return { ...result, error: '筛选项不在当前可查看范围，请重新选择' };
    }
    for (const field of ['leadLevel', 'intentionLevel', 'visitIntention', 'testDriveIntention']) {
      if (result[field] && !fieldOptions(field, result.tenantId).includes(result[field])) return { ...result, error: '请选择有效的业务信息筛选值' };
    }
    return result;
  }
  function uniqueCalls(calls) {
    const records = new Map();
    calls.forEach((call, index) => {
      const fact = root.AliCtiReportFacts?.read(call);
      const identity = fact?.present && fact.usable && fact.mainUniqueId ? ['provider', fact.mainUniqueId] : ['local', call.callId || ['missing-id', index]];
      records.set(JSON.stringify([call.tenantId, call.enterpriseId, ...identity]), call);
    });
    return [...records.values()];
  }
  function flatten(batches) {
    return batches.flatMap(batch => array(batch.rows).map(row => ({ ...row, id: row.id,
      key: JSON.stringify([batch.tenantId, batch.enterpriseId, batch.id, row.id]), batchId: batch.id, batchName: batch.name,
      tenantId: batch.tenantId, enterpriseId: batch.enterpriseId, createdAt: batch.createdAt,
      businessType: businessType(row.businessType, batch) || businessType(batch.businessType, batch),
      brandId: row.brandId || batch.brandId || '', externalDocumentId: row.externalDocumentId ?? '', phone: text(row.phone), name: text(row.name), ownerId: row.ownerId || '', taskId: row.taskId || '', method: row.method || '', followup: row.followup || '',
      journalCalls: array(row.calls).map(call => ({ ...call }))
    })));
  }
  function itemFor(call, items) {
    if (!call.customerTaskItemId) return null;
    const batchId = call.customerTaskBatchId || call.customerBatchId || call.batchId;
    const candidates = items.filter(item => sameScope(item, call) && item.id === call.customerTaskItemId && (!batchId || item.batchId === batchId));
    if (candidates.length === 1) return candidates[0];
    const journal = candidates.filter(item => call.callId && item.journalCalls.some(record => record.callId === call.callId));
    return journal.length === 1 ? journal[0] : null;
  }
  function tenantName(row, available) { return available.tenants.find(tenant => sameScope(tenant, row))?.name || row.tenantId || '未提供'; }
  function seconds(value) { return value === null || value === undefined ? '—' : String(Math.round(value * 10) / 10); }
  function percentage(part, count) { return part === null || count === null || count === 0 ? '—' : (part / count * 100).toFixed(1) + '%'; }
  function countValue(value) { if (value === '' || value === null || value === undefined || typeof value === 'boolean') return null; const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : null; }
  function matchesKeyword(values, keyword) { return !keyword || values.map(text).join(' ').toLocaleLowerCase().includes(keyword.toLocaleLowerCase()); }
  function within(value, filters) { const at = metrics().timestamp(value), start = dateValue(filters.startDate), end = dateValue(filters.endDate); end.setDate(end.getDate() + 1); return at !== null && at >= start.getTime() && at < end.getTime(); }
  function callContext(call, source) {
    const item = source.itemByCall.get(call), task = source.tasks.find(row => sameScope(row, call) && row.taskId === call.taskId), agent = source.agentByCall.get(call), skill = source.skillByCall.get(call);
    return { item, task, agent, skill, businessType: businessType(call.businessType, call) || item?.businessType || '' };
  }
  function callMatches(call, filters, source) {
    const context = callContext(call, source), batchId = context.item?.batchId || call.customerTaskBatchId || call.customerBatchId || call.batchId;
    if (filters.tenantId && call.tenantId !== filters.tenantId) return false;
    if (filters.businessType && (filters.businessType === 'unclassified' ? !!context.businessType : context.businessType !== filters.businessType)) return false;
    if (filters.callType && call.callType !== filters.callType) return false;
    if (filters.batchId && batchId !== filters.batchId) return false;
    if (filters.taskId && call.taskId !== filters.taskId) return false;
    if (filters.agentId && (!context.agent || !agentMatches(context.agent, filters.agentId))) return false;
    if (filters.skillGroupId && (!context.skill || !skillMatches(context.skill, filters.skillGroupId))) return false;
    return matchesKeyword([call.callId, call.contactId, call.caller, call.callee, call.customerName, call.externalDocumentId, call.agentName, call.callType, root.PlatformUI.callTypeLabel(call.callType), context.item?.name, context.item?.phone, context.item?.externalDocumentId, context.item?.batchName, context.task?.name, context.agent?.userName, context.agent?.cno, ...array(context.agent?.reportNames), context.skill?.name], filters.keyword);
  }
  function distinctItems(items) {
    const numbers = items.map(item => ({ ...item, callId: item.key, direction: '呼出', callee: item.phone }));
    return new Set(numbers.filter(row => metrics().customerPhone(row)).map(row => metrics().customerKey(row))).size;
  }
  function customerTotals(items) {
    return { totalItems: items.length, assigned: items.filter(item => item.ownerId || item.taskId).length, contacted: items.filter(item => item.contacted).length,
      completed: items.filter(item => item.followup === '已完成').length, followup: items.filter(item => item.followup === '待继续跟进').length,
      unassigned: items.filter(item => !item.ownerId && !item.taskId).length, distinctCustomers: distinctItems(items) };
  }
  function customersModel(model, source) {
    const filters = model.filters;
    const selected = source.items.filter(item => {
      if ((filters.tenantId && item.tenantId !== filters.tenantId) || (filters.batchId && item.batchId !== filters.batchId)) return false;
      if (filters.businessType && (filters.businessType === 'unclassified' ? !!item.businessType : item.businessType !== filters.businessType)) return false;
      if (filters.callType && item.method !== filters.callType) return false;
      if (filters.taskId && item.taskId !== filters.taskId) return false;
      const agent = source.agents.find(row => sameScope(row, item) && row.accountId && row.accountId === item.ownerId), task = source.tasks.find(row => sameScope(row, item) && row.taskId === item.taskId);
      if (filters.agentId && (!agent || !agentMatches(agent, filters.agentId))) return false;
      if (filters.skillGroupId) {
        const group = source.skills.find(row => sameScope(row, item) && skillMatches(row, filters.skillGroupId));
        if (!group || !(agent && array(data().agentSkills).some(relation => relation.identityId === agent.contactCenterIdentityId && relation.physicalGroupId === group.physicalGroupId && relation.status === '已生效'))) return false;
      }
      return matchesKeyword([item.name, item.phone, item.externalDocumentId, item.batchName, agent?.userName, task?.name], filters.keyword);
    });
    model.items = selected.filter(item => within(item.createdAt, filters)).map(item => {
      const matched = source.callsByItem.get(item.key) || [], calls = matched.filter(call => metrics().ended(call));
      return { ...item, calls, contacted: item.journalCalls.length > 0 || matched.length > 0 };
    });
    model.calls = uniqueCalls(model.items.flatMap(item => item.calls)).filter(call => metrics().ended(call));
    model.rows = source.batches.map(batch => {
      const items = model.items.filter(item => sameScope(item, batch) && item.batchId === batch.id), counts = customerTotals(items);
      return { ...batch, key: JSON.stringify([batch.tenantId, batch.enterpriseId, batch.id]), id: batch.id, name: batch.name, businessType: businessType(batch.businessType, batch),
        ...counts, total: counts.totalItems, items, calls: uniqueCalls(items.flatMap(item => item.calls)).filter(call => metrics().ended(call)) };
    }).filter(row => row.items.length);
    model.summary = { ...metrics().stats(model.calls, source.allCalls), ...customerTotals(model.items) };
    model.timeMissing = selected.filter(item => metrics().timestamp(item.createdAt) === null).length;
    model.timeFallback = 0;
    return model;
  }
  function taskMatches(task, calls, filters, source) {
    if (filters.tenantId && task.tenantId !== filters.tenantId) return false;
    if (filters.taskId && task.taskId !== filters.taskId) return false;
    if (filters.callType && task.callType !== filters.callType) return false;
    if (!calls.length && ![task.createdAt, task.scheduleAt, task.startedAt].some(value => within(value, filters))) return false;
    const linked = source.items.filter(item => sameScope(item, task) && item.taskId === task.taskId);
    if (!calls.length && filters.batchId && !linked.some(item => item.batchId === filters.batchId)) return false;
    if (!calls.length && filters.businessType && !linked.some(item => filters.businessType === 'unclassified' ? !item.businessType : item.businessType === filters.businessType)) return false;
    if (!calls.length && (filters.agentId || filters.skillGroupId)) return false;
    return calls.length > 0 || matchesKeyword([task.name, task.taskId, ...linked.flatMap(item => [item.name, item.phone, item.externalDocumentId, item.batchName])], filters.keyword);
  }
  function getModel(view, input = {}) {
    const filters = normalize(input), model = { view, filters, rows: [], calls: [], items: [], businessGroups: [], summary: metrics().stats([]), allCalls: [], timeMissing: 0, timeFallback: 0, excludedUnassociated: 0, excludedUnassociatedCalls: [] };
    if (!valid()) return { ...model, error: '当前账号没有云联络中心报表查看权限' };
    if (!views.includes(view)) return { ...model, error: '报表类型无效' };
    if (filters.error) return { ...model, error: filters.error };
    const source = options(); source.agentGroups = source.agents; source.agents = source.agentInstances; source.items = flatten(source.batches);
    const callRows = scoped(data().calls).filter(call => types.includes(call.callType)).map(call => ({ ...call }));
    source.allCalls = view === 'leads' ? callRows : uniqueCalls(callRows);
    source.itemByCall = new Map(); source.callsByItem = new Map(); source.agentByCall = new Map(); source.skillByCall = new Map();
    source.allCalls.forEach(call => {
      const item = itemFor(call, source.items); source.itemByCall.set(call, item);
      if (item) { if (!source.callsByItem.has(item.key)) source.callsByItem.set(item.key, []); source.callsByItem.get(item.key).push(call); }
      const fact = root.AliCtiReportFacts?.read(call);
      // Inbound firstCallCno/firstCallQno identify the first dial target, not the
      // answering segment; never charge the complete call duration to that target.
      const agents = fact?.present
        ? fact.usable && fact.kind !== 'inbound' && fact.primaryAgentCno ? source.agentGroups.filter(agent => sameScope(agent, call) && typeof agent.cno === 'string' && agent.cno === fact.primaryAgentCno) : []
        : identity(call) ? source.agentGroups.filter(agent => sameScope(agent, call) && array(agent.reportInstanceIds).includes(identity(call))) : [];
      const skills = fact?.present
        ? fact.usable && fact.kind !== 'inbound' && fact.primaryQueueNo ? source.skills.filter(group => sameScope(group, call) && [group.providerQueueNo, group.queueNo, group.qno].some(value => typeof value === 'string' && value === fact.primaryQueueNo)) : []
        : call.skillGroupId || call.physicalGroupId ? source.skills.filter(group => sameScope(group, call) && (!call.skillGroupId || group.skillGroupId === call.skillGroupId) && (!call.physicalGroupId || group.physicalGroupId === call.physicalGroupId)) : [];
      source.agentByCall.set(call, agents.length === 1 ? agents[0] : null);
      source.skillByCall.set(call, skills.length === 1 ? skills[0] : null);
    });
    root.CustomerFollowup?.overlay(source.allCalls);
    model.allCalls = source.allCalls;
    if (view === 'leads') return root.CloudLeadReport.build(model, source, { within, agentMatches, skillMatches });
    if (view === 'customers') return customersModel(model, source);
    const typed = source.allCalls.filter(call => metrics().ended(call) && (view !== 'inbound' || call.callType === '呼入') && (view !== 'outbound' || ['预外呼', 'IVR 外呼'].includes(call.callType)) && callMatches(call, filters, source));
    model.timeMissing = typed.filter(call => metrics().callTime(call) === null).length;
    model.calls = typed.filter(call => within(metrics().callTime(call), filters));
    model.timeFallback = model.calls.filter(call => { const fact = root.AliCtiReportFacts?.read(call); return fact?.present ? false : metrics().timestamp(call.ringingAt) === null; }).length;
    if (view === 'overview') {
      model.rows = types.filter(type => !filters.callType || type === filters.callType).map(type => {
        const calls = model.calls.filter(call => call.callType === type), summary = metrics().stats(calls, source.allCalls);
        return { key: type, id: type, type, ...summary, duration: seconds(summary.seconds), recording: calls.filter(call => call.recordingStatus === '可播放').length, calls };
      });
      const businessGroups = new Map();
      model.calls.forEach(call => {
        const type = callContext(call, source).businessType;
        const id = type || 'unclassified', label = type ? root.CustomerBusiness?.get?.(type, call)?.label || type : '未分类';
        // Categories belong to tenants: the same ID may have different names.
        // Keep those names distinct while sharing the report's exact call scope.
        const key = JSON.stringify([id, label]);
        if (!businessGroups.has(key)) businessGroups.set(key, { key, id, label, total: 0, calls: [] });
        const group = businessGroups.get(key); group.total++; group.calls.push(call);
      });
      model.businessGroups = [...businessGroups.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
    } else if (view === 'outbound') {
      model.rows = source.tasks.map(task => {
        const calls = model.calls.filter(call => sameScope(call, task) && call.taskId === task.taskId);
        if (!taskMatches(task, calls, filters, source)) return null;
        const summary = metrics().stats(calls, source.allCalls), total = countValue(task.total), completed = countValue(task.completed);
        const supplier = root.AliCtiReportSummary?.task(task);
        return { ...task, key: task.taskId, id: task.taskId, total, completed, cumulativeBasis: 'platform-task-progress',
          supplierSummaryAvailable: supplier?.available === true, supplierSummaryIssue: supplier?.issue || '',
          supplierTotal: supplier?.available ? supplier.totalCount : null, supplierCalled: supplier?.available ? supplier.calledCount : null,
          supplierAnswered: supplier?.available ? supplier.answerCount : null, supplierBridged: supplier?.available ? supplier.bridgeCount : null,
          supplierRetry: supplier?.available ? supplier.retryCalledCount : null, finishRate: percentage(completed, total), loaded: summary.total, connected: summary.connected, unanswered: summary.unanswered, pending: summary.pending, connectRate: summary.rate,
          firstCount: summary.firstCount, firstRate: summary.firstRate, repeatCount: summary.repeatCount, periodCustomers: summary.customers, customerUnknown: summary.customerUnknown, calls,
          plan: scoped(data().callPlans).find(plan => sameScope(plan, task) && plan.callPlanId === task.planId)?.name || task.executionConfig?.name || '历史配置' };
      }).filter(Boolean);
      model.calls = uniqueCalls(model.rows.flatMap(row => row.calls));
    } else if (view === 'inbound') {
      model.rows = model.calls.map(call => {
        const state = metrics().state(call), human = metrics().humanAnswer(call), fact = root.AliCtiReportFacts?.read(call);
        return { key: call.callId, id: call.callId, tenant: tenantName(call, source), route: fact?.present ? fact.primaryQueueNo || '—' : call.routeEvidence || '—', queue: fact?.present ? fact.firstJoinQueueAtMs ?? '—' : call.queueAt || '—', agent: source.agentByCall.get(call)?.userName || (fact?.present ? fact.primaryAgentCno || '—' : call.agentName || (human === true ? '已接通（姓名未记录）' : '—')),
          result: state.answerLabel, humanResult: human === true ? '人工已接通' : human === false ? '人工未接通' : '人工结果待确认', queueResult: fact?.present && fact.usable ? fact.queueOutcome || '—' : '—', duration: seconds(metrics().recordedSeconds(call)), calls: [call] };
      });
    } else {
      const agents = view === 'agents', entities = agents ? source.agentGroups : source.skills;
      model.excludedUnassociatedCalls = model.calls.filter(call => !(agents ? source.agentByCall.get(call) : source.skillByCall.get(call)));
      model.excludedUnassociated = model.excludedUnassociatedCalls.length;
      model.rows = entities.filter(entity => (!filters.tenantId || entity.tenantId === filters.tenantId) && (!filters.agentId || !agents || agentMatches(entity, filters.agentId)) && (!filters.skillGroupId || agents || skillMatches(entity, filters.skillGroupId))).map(entity => {
        const calls = model.calls.filter(call => (agents ? source.agentByCall.get(call) : source.skillByCall.get(call)) === entity);
        if (!calls.length && filters.keyword && !matchesKeyword([entity.userName, entity.name, entity.cno, ...array(entity.reportNames)], filters.keyword)) return null;
        const summary = metrics().stats(calls, source.allCalls), relations = array(data().agentSkills).filter(relation => relation.status === '已生效' && (agents ? array(entity.reportInstanceIds).includes(relation.identityId) && source.agents.some(agent => sameScope(agent, entity) && agent.contactCenterIdentityId === relation.identityId && agent.lifecycleStatus !== '已删除') && source.skills.some(group => sameScope(group, entity) && group.physicalGroupId === relation.physicalGroupId) : relation.physicalGroupId === entity.physicalGroupId && source.agents.some(agent => sameScope(agent, entity) && agent.contactCenterIdentityId === relation.identityId && agent.lifecycleStatus !== '已删除')));
        return { key: agents ? entity.agentRecordId : entity.physicalGroupId, id: agents ? entity.agentRecordId : entity.physicalGroupId, name: agents ? entity.userName : entity.name, tenant: tenantName(entity, source), status: agents ? entity.lifecycleStatus : entity.status,
          skills: agents ? new Set(relations.map(row => row.physicalGroupId)).size : undefined, members: agents ? undefined : new Set(relations.map(row => row.identityId)).size,
          total: summary.total, connected: summary.humanConnected, unanswered: summary.humanUnanswered, pending: summary.humanPending, rate: summary.humanRate,
          talk: seconds(summary.humanSeconds), queue: summary.queueAverage === null ? '—' : seconds(summary.queueAverage) + ' 秒', calls };
      }).filter(Boolean);
      model.calls = uniqueCalls(model.rows.flatMap(row => row.calls));
    }
    model.summary = metrics().stats(model.calls, source.allCalls);
    model.timeFallback = model.calls.filter(call => { const fact = root.AliCtiReportFacts?.read(call); return fact?.present ? false : metrics().timestamp(call.ringingAt) === null; }).length;
    if (view === 'inbound') {
      const outcomes = model.calls.map(call => root.AliCtiReportFacts?.read(call)).filter(fact => fact?.usable);
      model.summary.queueAbandoned = outcomes.filter(fact => fact.queueOutcome === '队列中放弃').length;
      model.summary.queueOverflow = outcomes.filter(fact => fact.queueOutcome === '队列中溢出').length;
    }
    return model;
  }
  root.CloudReportData = Object.freeze({ valid, scopeKey, defaults, normalize, options, businessOptions, fieldOptions, getModel });
})(typeof window === 'undefined' ? globalThis : window);
