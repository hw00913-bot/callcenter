/** Fictional, linked activity fixtures. No requests, dialing, timers, or provider evidence. */
(function () {
  'use strict';
  const kit = window.DemoFixtureKit, data = window.CloudCallData;
  if (!kit || !data || !Array.isArray(kit.scopes) || kit.activityFixtureCohort === kit.cohort) return;
  const currentCalls = [], customers = [], taskRows = [];
  kit.localTaskCallsForStorage = kit.localTaskCallsForStorage || [];
  const outcomes = ['connected', 'unanswered', 'busy', 'rejected', 'unknown', 'connected'];
  const businessTypes = ['lead', 'aftersales', 'activity'];
  const businessLabels = { lead: '试驾邀约', aftersales: '保养回访', activity: '周末活动' };
  const names = ['林悦', '周晨', '陈嘉', '徐宁', '许欣', '沈言', '陆珊', '唐宇', '顾明', '叶青', '高远', '程安'];
  const markers = { simulation: true, demoPack: 'alicti-showcase-v1', demoCohort: kit.cohort };
  const stamp = milliseconds => new Date(milliseconds).toLocaleString('sv-SE');
  let phoneIndex = 0;
  // Existing account/seat restoration runs later. Read only the selected identity
  // for historical participant evidence; never install or change a saved seat.
  const historicalSeats = new Map((data.agents || []).map(agent => [agent.contactCenterIdentityId, agent]));
  for (const storageKey of ['workbench-view-fixtures-v1', 'account-seat-v1']) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      const rows = storageKey === 'account-seat-v1' ? saved?.version === 1 ? saved.seats : [] : saved?.agents;
      for (const agent of Array.isArray(rows) ? rows : []) {
        if (!agent?.contactCenterIdentityId) continue;
        const previous = historicalSeats.get(agent.contactCenterIdentityId);
        if (!previous || previous.tenantId === agent.tenantId && previous.enterpriseId === agent.enterpriseId) historicalSeats.set(agent.contactCenterIdentityId, agent);
      }
    } catch (_) { /* Preserve malformed storage for the owning component. */ }
  }
  function historicalSeat(scope) {
    const agent = historicalSeats.get(scope.seatId);
    return agent?.tenantId === scope.tenantId && agent.enterpriseId === scope.enterpriseId ? agent : null;
  }
  function customer(scope, prefix, index, type, task) {
    const serial = ++phoneIndex;
    const row = {
      ...markers, id: prefix + '-C' + String(index + 1).padStart(2, '0'),
      name: names[(serial - 1) % names.length] + (serial % 2 ? '女士' : '先生'),
      phone: '139000' + String(serial).padStart(5, '0'),
      businessType: type, externalDocumentId: (type === 'lead' ? 'LEAD-' : type === 'aftersales' ? 'AS-' : 'ACT-') + scope.code + '-' + kit.cohort + '-' + (type === 'activity' ? '001' : String(serial).padStart(4, '0')),
      note: businessLabels[type] + (index % 2 ? '，优先下午联系' : '，确认客户意愿与合适时间'),
      ownerId: '', method: task?.callType || '', taskId: task?.taskId || '', taskName: task?.name || '',
      followup: '待联系', activeCallId: '', calls: [], history: []
    };
    customers.push(row);
    return row;
  }
  function batch(scope, id, name, type, rows, createdAt = kit.at(5 * 1440 + 300)) {
    const value = { ...markers, id, name, businessType: type, tenantId: scope.tenantId, enterpriseId: scope.enterpriseId, createdAt, createdBy: scope.accountId, errors: [], rows };
    kit.add(kit.batches, 'id', value);
    return value;
  }
  function plan(scope, taskId, type) {
    const automatic = type === 'IVR 外呼';
    return {
      ...markers, callPlanId: taskId + '-CONFIG', tenantId: scope.tenantId, enterpriseId: scope.enterpriseId,
      name: scope.label + (automatic ? '自动提醒配置' : '客户关怀配置'), callType: type,
      status: '已发布', publishedVersion: 'V1', allowedCallerNumberIds: [scope.numberId],
      targetSkillGroupId: automatic ? '' : scope.skillGroupId, executionQueueId: automatic ? '' : scope.skillGroupId,
      contactFlowId: automatic ? scope.automaticFlowId : scope.predictiveFlowId,
      providerIvrId: automatic ? scope.providerIvrId : '', transferEnabled: !automatic,
      description: automatic ? '客户接听后播放语音提醒' : '客户接听后进入本租户服务团队'
    };
  }
  function task(scope, scopeIndex, type, state, index) {
    const automatic = type === 'IVR 外呼', suffix = automatic ? 'AUTO' : 'PRED';
    const taskId = kit.prefix + scope.code + '-' + kit.cohort + '-' + suffix + '-' + state.key;
    const config = plan(scope, taskId, type), started = state.code !== 0;
    const providerTaskId = Number(kit.cohort) * 100 + scopeIndex * 20 + index + (automatic ? 5 : 1);
    const retryPolicy = { version: 1, mode: state.key === 'READY' ? 'unset' : 'advanced', timeType: 2, codes: state.key === 'READY' ? [] : [718, 710], rounds: [{ days: 0, hours: 0, minutes: 15 }, { days: 0, hours: 1, minutes: 0 }] };
    const row = {
      ...markers, taskId, tenantId: scope.tenantId, enterpriseId: scope.enterpriseId,
      name: scope.label + '·' + (automatic ? '保养提醒' : '试驾邀约') + '·' + state.label,
      callType: type, status: state.label, displayOnly: false, localPrototypeTask: true, customerSourceMode: 'assigned',
      total: 6, completed: 0, connected: 0, planId: config.callPlanId, executionConfig: config, planVersion: 'V1',
      planSnapshotId: started ? taskId + '-SNAPSHOT' : '', planSnapshot: null,
      campaignId: started ? taskId + '-CAMPAIGN' : '', listSource: '客户名单分配',
      scheduleAt: '手工启动', createdAt: kit.at(started ? 5 * 1440 + 300 : 75), updatedAt: kit.at(state.code === 3 ? 180 : 3),
      startedAt: started ? kit.at(5 * 1440 + 240) : '', owner: scope.owner || scope.label + '运营',
      callerNumberId: scope.numberId, targetSkillGroupId: config.targetSkillGroupId,
      executionQueueId: config.executionQueueId, contactFlowId: config.contactFlowId, providerIvrId: config.providerIvrId,
      transferEnabled: config.transferEnabled, retryPolicy, retryPolicySource: 'LOCAL_DEMO_FIXTURE', isRepeat: 1,
      providerTaskId, providerType: automatic ? 2 : 1, providerStatusCode: state.code,
      providerStatus: ['初始（模拟）', '运行（模拟）', '暂停（模拟）', '结束（模拟）'][state.code],
      alictiMockTaskProperty: { id: providerTaskId, enterpriseId: Number(scope.enterpriseId), type: automatic ? 2 : 1, status: state.code },
      autoStart: 0, importTelAutoStart: 0, autoComplete: 1, minAvailableAgentCount: automatic ? null : 1,
      hasNextAttempt: state.code === 1 || state.code === 2, stopNewDialing: state.code !== 1,
      endedAt: state.code === 3 ? kit.at(180) : '', dispatchHistory: []
    };
    if (started) row.planSnapshot = {
      snapshotId: row.planSnapshotId, planId: row.planId, planName: config.name, planVersion: 'V1',
      callerNumberIds: [scope.numberId], skillGroupId: config.targetSkillGroupId,
      contactFlowId: config.contactFlowId, providerIvrId: config.providerIvrId,
      executionQueueId: config.executionQueueId, transferEnabled: config.transferEnabled, frozenAt: row.startedAt
    };
    if (started) row.dispatchHistory.push({ at: row.startedAt, actor: scope.accountId, action: '启动', before: '待启动', after: '执行中', result: '演示任务已启动' });
    if (state.code === 2 || state.code === 3) row.dispatchHistory.push({ at: row.updatedAt, actor: scope.accountId, action: state.code === 2 ? '暂停' : '结束', before: '执行中', after: state.label, result: state.code === 2 ? '可继续同一任务' : '不再发起后续首次呼叫或重呼' });
    kit.add(data.tasks, 'taskId', row);
    const canonical = data.tasks.find(item => item.taskId === row.taskId);
    const target = automatic ? data.ivrTasks : data.predictiveTasks;
    if (!target.some(item => item.taskId === canonical.taskId)) target.unshift(canonical);
    kit.tasksForStorage.push(canonical); taskRows.push(canonical);
    return canonical;
  }
  function call(scope, row, linkedTask, outcome, index, options = {}) {
    const type = linkedTask?.callType || options.callType || '人工外呼';
    const automatic = type === 'IVR 外呼', incoming = type === '呼入';
    const live = outcome === 'ringing' || outcome === 'live';
    const answered = outcome === 'connected' || outcome === 'live';
    const unknown = outcome === 'unknown';
    const number = data.phoneNumbers.find(item => item.numberId === scope.numberId);
    const agent = !automatic && answered && options.agentAnswered !== false ? historicalSeat(scope) : null;
    const offset = options.offsetMinutes ?? (index % 3 === 0 ? 30 + index * 6 : (1 + index % 6) * 1440 + 30 + index * 4);
    const duration = answered ? automatic ? 26 + index % 4 * 7 : 95 + index % 6 * 21 : 0;
    const endedMs = Date.parse(kit.at(offset)), ringMs = live ? Date.parse(kit.at(1)) : endedMs - (duration + 8) * 1000;
    const answerMs = answered ? ringMs + 8000 : null;
    const callId = row.id + '-CALL-' + (options.attemptNumber || 1) + (incoming ? '-IN' : '');
    const result = live ? answered ? '通话中' : '客户振铃' : answered ? '接通' : unknown ? '待确认' : '未接通';
    const value = {
      ...markers, callId, contactId: callId, tenantId: scope.tenantId, enterpriseId: scope.enterpriseId,
      callType: type, direction: incoming ? '呼入' : '呼出', taskId: linkedTask?.taskId || '', customerTaskItemId: row.id,
      customerName: row.name, customerPhone: row.phone, customerNote: row.note,
      businessType: row.businessType, externalDocumentId: row.externalDocumentId,
      accountId: incoming || !linkedTask ? scope.accountId : '',
      caller: incoming ? row.phone : number?.number || '', callee: incoming ? number?.number || '' : row.phone,
      callerNumberId: scope.numberId, agentIdentityId: agent?.contactCenterIdentityId || '', contactCenterIdentityId: agent?.contactCenterIdentityId || '',
      agentName: agent?.userName || '', skillGroupId: automatic ? '' : scope.skillGroupId,
      executionQueueId: automatic ? '' : scope.skillGroupId, contactFlowId: linkedTask?.contactFlowId || (incoming ? scope.inboundFlowId : ''),
      ringingAt: stamp(ringMs), queueAt: agent ? stamp(ringMs + 7000) : '—',
      answeredAt: answerMs === null ? '—' : stamp(answerMs), endedAt: live ? '' : stamp(endedMs),
      recordedAt: stamp(ringMs), durationSeconds: live || unknown ? null : duration, durationSource: 'LOCAL_SIMULATION',
      attemptNumber: options.attemptNumber || 1, hasNextAttempt: options.hasNextAttempt === true && linkedTask?.providerStatusCode !== 3,
      result, processingStatus: live ? '进行中' : '已完成',
      agentDisposition: live ? '' : answered ? automatic ? '客户已收到提醒' : index % 2 ? '客户有意向，已约到店' : '已完成回访，后续按约定联系' : unknown ? '结果尚待核对' : '本次未接通',
      recordingApplicability: automatic ? 'NOT_APPLICABLE_PURE_IVR' : answered ? '适用' : '不适用',
      recordingStatus: automatic || !answered ? '不适用' : '演示无录音', recordingSource: '本地模拟，无音频', recordingScope: '不适用',
      callSource: linkedTask && !live ? 'LOCAL_TASK_SIMULATION' : live ? 'DEMO_FIXTURE_IN_FLIGHT' : 'DEMO_FIXTURE_HISTORY'
    };
    if (incoming) value.routeEvidence = '客户来电 → ' + scope.label + ' → ' + (answered ? '坐席接听' : '通话结果待核对');
    if (automatic) value.ivrEvidence = { contactFlow: scope.automaticFlowId, flowVersion: 'V1', dialAt: value.ringingAt, nodes: answered && !live ? [{ at: value.answeredAt, node: '语音提醒', action: '播放完成' }] : [], finalResult: result };
    // These are explicit official response samples, never inferred by the product from result labels.
    const kind = incoming ? 'inbound' : automatic ? 'automatic' : type === '人工外呼' ? 'manual' : 'predictive';
    const raw = { enterpriseId: Number(scope.enterpriseId), mainUniqueId: callId, requestUniqueId: row.id, customerNumber: row.phone, startTime: Math.floor(ringMs / 1000), ...(linkedTask ? { taskId: linkedTask.providerTaskId } : {}) };
    if (!live && !unknown) raw.status = incoming ? (answered ? '人工接听' : '人工未接听') : automatic ? (answered ? '客户接听' : '客户未接听') : kind === 'manual' ? answered ? 3 : 1 : answered ? 43 : 40;
    if (kind === 'predictive' && answered && options.agentAnswered === false) raw.status = 42;
    if (answerMs !== null) {
      raw[kind === 'manual' ? 'bridgeTime' : incoming ? 'answerTime' : 'upTime'] = Math.floor(answerMs / 1000);
      if (agent) raw[kind === 'manual' ? 'upTime' : 'bridgeTime'] = Math.floor(answerMs / 1000) + (kind === 'predictive' ? 1 : 0);
      if (agent) { if(incoming){raw.firstCallCno=String(agent.cno);raw.cnoFlow=[String(agent.cno)];}else raw.cno=String(agent.cno); }
    }
    if (!live) { raw.endTime = Math.floor(endedMs / 1000); raw.totalDuration=Math.floor((endedMs-ringMs)/1000); if(!unknown){if(!automatic)raw.bridgeDuration=answered?Math.max(0,duration-(kind==='predictive'?1:0)):0;if(kind==='predictive'||automatic)raw.customerBridgeDuration=answered?duration:0;} }
    if (kind === 'predictive' && options.agentAnswered === false) raw.bridgeDuration = 0;
    if(incoming&&agent){raw.firstJoinQueueTime=Math.floor(ringMs/1000)+7;raw.firstLeaveQueueTime=Math.floor(answerMs/1000);raw.firstQueueDuration=raw.firstLeaveQueueTime-raw.firstJoinQueueTime;raw.firstCallQno=scope.code==='HQ'?'6101':'6201';raw.qnoFlow=[raw.firstCallQno];}
    if(kind==='predictive'&&!automatic){raw.qno=scope.code==='HQ'?'6101':'6201';}
    const officialCode = { unanswered: 718, busy: 710, rejected: 712, unknown: 183 }[outcome];
    if (!incoming && officialCode) {
      raw[kind === 'manual' ? 'sipCauseCode' : 'sipCause'] = officialCode;
      raw[kind === 'manual' ? 'obSipCauseRaw' : 'obSipCause'] = { unanswered: '无人接听', busy: '占线', rejected: '拒接', unknown: '未知' }[outcome];
    }
    value.alictiCdr = { kind, raw, mock: true };
    kit.add(data.calls, 'callId', value);
    const canonical = data.calls.find(item => item.callId === callId);
    currentCalls.push({ call: canonical, row, outcome, agentId: agent?.contactCenterIdentityId || '', linkedTask });
    if (live) row.activeCallId = callId;
    row.calls.push(canonical);
    row.history.push({ at: value.endedAt || value.ringingAt, action: live ? '通话进行中' : '记录通话结果', callId, result });
    if (answered && !live) row.followup = '已完成';
    else if (!live) row.followup = unknown ? '待联系' : '需要再次联系';
    if (linkedTask && !live) kit.localTaskCallsForStorage.push(canonical);
    return canonical;
  }
  const states = [{ key: 'READY', code: 0, label: '待启动' }, { key: 'RUNNING', code: 1, label: '执行中' }, { key: 'PAUSED', code: 2, label: '已暂停' }, { key: 'ENDED', code: 3, label: '已终止' }];
  kit.scopes.forEach((scope, scopeIndex) => {
    ['预外呼', 'IVR 外呼'].forEach((type, typeIndex) => states.forEach((state, index) => {
      const t = task(scope, scopeIndex, type, state, index), businessType = typeIndex ? 'aftersales' : 'lead';
      const rows = Array.from({ length: 6 }, (_, i) => customer(scope, t.taskId, i, businessType, t));
      const b = batch(scope, t.taskId + '-BATCH', t.name + '名单', businessType, rows, t.createdAt);
      rows.forEach(row => row.history.push({ at: t.createdAt, action: '分配到任务', method: type, targetId: t.taskId }));
      t.listSource = b.name;
      if (state.code === 0) return;
      const completed = state.code === 3 && typeIndex ? 6 : 4;
      for (let i = 0; i < completed; i++) {
        // The second attempt belongs to the same customer, and its first attempt is retained.
        if (i === 0) call(scope, rows[i], t, 'unanswered', i + index * 6, { attemptNumber: 1, offsetMinutes: 4 * 1440 + 300, hasNextAttempt: false });
        call(scope, rows[i], t, outcomes[i], i + index * 6, { attemptNumber: i === 0 ? 2 : 1, offsetMinutes: state.code === 3 ? 2 * 1440 + 60 + i * 10 : i === 0 ? 20 : (i - 1) * 1440 + 40 + i * 10, hasNextAttempt: i === 1 && state.code !== 3 });
      }
      if (state.code === 1 || state.code === 2) call(scope, rows[4], t, state.code === 2 && typeIndex ? 'live' : 'ringing', index * 9);
      t.completed = rows.filter(row => row.calls.some(c => !!c.endedAt)).length;
      t.connected = rows.filter(row => row.calls.some(c => !!c.endedAt && c.result === '接通')).length;
      if (state.code === 3 && completed === 6) { t.status = '已完成'; t.dispatchHistory.at(-1).after = '已完成'; }
    }));
    businessTypes.forEach((type, index) => {
      const id = kit.prefix + scope.code + '-' + kit.cohort + '-POOL-' + type.toUpperCase();
      batch(scope, id, scope.label + '·待分配·' + businessLabels[type], type, Array.from({ length: 3 }, (_, i) => customer(scope, id, i, type)), kit.at(0));
      const manualId = kit.prefix + scope.code + '-' + kit.cohort + '-MANUAL-' + type.toUpperCase();
      const manualCreatedAt = kit.at(index === 0 ? 120 : (index + 1) * 1440 + 120);
      const rows = Array.from({ length: 4 }, (_, i) => customer(scope, manualId, i, type));
      rows.forEach(row => { row.ownerId = scope.accountId; row.method = '人工外呼'; row.history.push({ at: manualCreatedAt, action: '分配人工跟进', method: '人工外呼', targetId: scope.accountId }); });
      batch(scope, manualId, scope.label + '·人工跟进·' + businessLabels[type], type, rows, manualCreatedAt);
      call(scope, rows[0], null, 'connected', index + scopeIndex * 3, { offsetMinutes: 35 + index * 15 });
      call(scope, rows[1], null, ['unanswered', 'busy', 'unknown'][index], index + 4, { offsetMinutes: index === 0 ? 60 : (index + 1) * 1440 + 45 });
    });
    const incomingId = kit.prefix + scope.code + '-' + kit.cohort + '-INBOUND';
    const incoming = Array.from({ length: 4 }, (_, i) => customer(scope, incomingId, i, 'lead'));
    incoming.forEach((row, index) => { row.ownerId = scope.accountId; call(scope, row, null, index === 3 ? 'unknown' : 'connected', index, { callType: '呼入', offsetMinutes: index < 2 ? 15 + index * 25 : (index + 1) * 1440 + 35 }); });
    batch(scope, incomingId + '-BATCH', scope.label + '·来电客户', 'lead', incoming, kit.at(4 * 1440 + 120));
  });
  // A paused task can accept a new contact attempt under the same task identity.
  // New IDs keep the earlier terminal FOLLOWUP fixtures and user edits untouched.
  kit.scopes.forEach((scope, scopeIndex) => {
    const t = task(scope, scopeIndex, '预外呼', { key: 'SAME-TASK-FOLLOWUP', code: 2, label: '已暂停' }, 9);
    Object.assign(t, { name: scope.label + '·本任务再次联系', total: 4, completed: 4, connected: 4, autoComplete: 0, hasNextAttempt: false, retryPolicy: { version: 1, mode: 'unset', timeType: 2, codes: [], rounds: [] }, repeatContactFixture: true, repeatContactFixtureVersion: 2 });
    t.alictiMockTaskProperty.autoComplete = 0;
    const people = scopeIndex ? ['沈悦', '陆晨', '许宁', '顾言'] : ['林语', '周宁', '陈悦', '徐安'];
    // Names and numbers identify a fixed sample; changing the clock must not
    // turn the same customer/call ID into a different customer on the next day.
    const sampleDate = kit.cohort.slice(0, 4) + '-' + kit.cohort.slice(4, 6) + '-' + kit.cohort.slice(6, 8);
    const daySerial = Math.floor(Date.parse(sampleDate + 'T00:00:00Z') / 86400000);
    const rows = people.map((name, index) => {
      const row = customer(scope, t.taskId, index, 'lead', t), agentAnswered = index < 2;
      Object.assign(row, {
        name, phone: '13971' + String(daySerial * 10 + scopeIndex * 4 + index).padStart(6, '0'),
        externalDocumentId: 'LEAD-' + scope.code + '-' + kit.cohort + '-SAME-TASK-FOLLOWUP-' + (index + 1),
        ownerId: scope.accountId, repeatContactFixture: true,
        note: agentAnswered ? '客户希望再次沟通车型与到店安排' : '客户已接通，尚未接入人工，需要继续跟进'
      });
      row.history.push({ at: t.createdAt, action: '分配到任务', method: '预外呼', targetId: t.taskId });
      const c = call(scope, row, t, 'connected', index, { agentAnswered, offsetMinutes: 240 + index * 15 });
      Object.assign(c, {
        repeatContactFixture: true,
        agentDisposition: agentAnswered ? '需要再次联系' : '',
        dispositionRemark: agentAnswered ? '客户约定再次沟通，请安排合适时间联系' : '',
        recordingApplicability: agentAnswered ? '适用' : '不适用', recordingStatus: agentAnswered ? '演示无录音' : '不适用'
      });
      row.followup = '待继续跟进';
      return row;
    });
    const b = batch(scope, t.taskId + '-BATCH', t.name + '名单', 'lead', rows, t.createdAt);
    b.repeatContactFixture = true;
    t.listSource = b.name;
  });
  // Use the existing aggregator after business scripts are available. It keeps live calls
  // out of completed statistics, preserves separate customer/agent evidence, and keeps
  // unknown outcomes unknown. No new state-code translation or retry scheduler is added.
  kit.activityFixtureCohort = kit.cohort;
  kit.afterLoad.push(() => {
    for (const item of currentCalls) {
      const c = item.call, ring = Date.parse(c.ringingAt), ended = Date.parse(c.endedAt), answer = Date.parse(c.answeredAt);
      const live = !c.endedAt, answered = item.outcome === 'connected' || item.outcome === 'live';
      window.CallState.start(c, { at: ring, source: 'local-simulation', scenario: c.callType });
      const feed = (role, type, at) => window.CallState.ingest(c, { enterpriseId: c.enterpriseId, contactId: c.contactId, channelId: c.callId + '-' + role, role, type, at, source: 'local-simulation' });
      feed('customer', 'Dialing', ring); feed('customer', 'Ringing', ring);
      if (answered) feed('customer', 'Established', answer);
      const agentAt = answer + (c.callType === '预外呼' ? 1000 : 0);
      if (item.agentId && answered) { feed('agent', 'Ringing', answer); feed('agent', 'Established', agentAt); }
      if (!live) {
        feed('customer', 'Released', ended); if (item.agentId) feed('agent', 'Released', ended);
        window.CallState.finish(c, { at: ended });
        const final = { EnterpriseId: c.enterpriseId, ContactId: c.contactId, ReleaseTime: ended, ContactDisposition: answered ? 'Success' : item.outcome === 'unknown' ? '' : 'NoAnswer' };
        if (answered) final.CustomerEvents = [{ EventSequence: [{ Event: 'Established', EventTime: answer }] }];
        if (item.agentId && answered) final.AgentEvents = [{ EventSequence: [{ Event: 'Established', EventTime: agentAt }] }];
        window.CallState.reconcile(c, final, { source: 'local-simulation' });
      }
      // Batch snapshots and the local task journal use the exact same finished record.
      c.at = c.endedAt || '';
    }
    kit.activitySummary = {
      cohort: kit.cohort, tasks: taskRows.length, batches: kit.batches.filter(b => b.demoCohort === kit.cohort).length,
      customers: customers.length, calls: currentCalls.length,
      endedCalls: currentCalls.filter(item => window.CallState.view(item.call).ended).length,
      liveCalls: currentCalls.filter(item => !window.CallState.view(item.call).ended).length,
      note: '虚拟数据；所有通话、供应商返回样本和结果均为本地演示，不代表真实接口验证。'
    };
  });
})();
