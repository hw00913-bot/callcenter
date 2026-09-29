/** Read-only report facts from API-317/318/319 and /cc/list_cdr_auto_task response rows. */
(function (root) {
  'use strict';
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const identifier = value => typeof value === 'string' && value && value.trim() === value ? value : null;
  const integerId = value => (typeof value === 'string' && /^\d+$/.test(value) ? value : null) || (Number.isSafeInteger(value) && value >= 0 ? String(value) : null);
  const amount = value => {
    if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value))) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) && number >= 0 ? number : null;
  };
  // Response examples independently establish seconds: API-318 2159-2125=34;
  // API-319 firstLeaveQueueTime-firstJoinQueueTime=1=firstQueueDuration.
  // This is not magnitude detection or a rule copied from query parameters.
  function atMs(value) {
    const seconds = amount(value), ms = seconds === null ? null : seconds * 1000;
    return seconds > 0 && Number.isSafeInteger(ms) && Math.abs(ms) <= 8640000000000000 ? ms : null;
  }
  function read(call = {}) {
    const source = call.alictiCdr, present = source !== null && source !== undefined;
    const raw = object(source?.raw) ? source.raw : null, kind = source?.kind;
    const facts = { present, usable: false, kind: kind || null, raw, issues: [], sourceId: { manual: 'API-317', predictive: 'API-318', inbound: 'API-319', automatic: 'cc/list_cdr_auto_task' }[kind] || null,
      enterpriseId: null, customerNumber: null, mainUniqueId: null, requestUniqueId: null, callId: null, uniqueId: null, taskId: null,
      primaryAgentCno: null, primaryQueueNo: null, agentCnos: [], queueNos: [], agentAttributionAmbiguous: true, queueAttributionAmbiguous: true,
      startAtMs: null, endAtMs: null, ended: null, customerAnsweredAtMs: null, agentAnsweredAtMs: null,
      bridgeSeconds: null, customerSeconds: null, firstJoinQueueAtMs: null, firstLeaveQueueAtMs: null, queueSeconds: null,
      statusResult: null, queueOutcome: null, telRetryRound: null };
    if (!present) return facts;
    if (!raw || !facts.sourceId) { facts.issues.push('话单类型或原始响应不可用'); return facts; }
    const expectedKind = { '人工外呼': 'manual', '预外呼': 'predictive', 'IVR 外呼': 'predictive', '呼入': 'inbound' }[call.callType];
    if (expectedKind && kind !== expectedKind && !(call.callType === 'IVR 外呼' && kind === 'automatic')) { facts.issues.push('话单接口与通话类型不匹配'); return facts; }
    const expectedEnterprise = integerId(call.providerEnterpriseId ?? call.enterpriseId);
    if (!expectedEnterprise) { facts.issues.push('缺少话单所属供应商账号'); return facts; }
    if (raw.enterpriseId !== null && raw.enterpriseId !== undefined && integerId(raw.enterpriseId) !== expectedEnterprise) {
      facts.issues.push('供应商账号不匹配'); return facts;
    }
    // API-319 has no enterpriseId field: its verified query binding supplies scope,
    // while absent supplier fields stay null in the returned fact object.
    // CallState contactId may be a local session key or fallback callId. It is
    // not proof of AliCti mainUniqueId; use only an explicit provider mapping.
    const links = [
      ['mainUniqueId', call.providerMainUniqueId ?? call.mainUniqueId],
      ['requestUniqueId', call.requestUniqueId],
      ['callId', call.providerCallId ?? call.alictiCallId],
      ['uniqueId', call.providerUniqueId ?? call.uniqueId]
    ];
    for (const [key, expected] of links) {
      if (raw[key] !== null && raw[key] !== undefined && expected !== null && expected !== undefined && expected !== '' && identifier(raw[key]) !== identifier(expected)) {
        facts.issues.push('通话标识不匹配：' + key); return facts;
      }
    }
    facts.usable = true;
    facts.enterpriseId = integerId(raw.enterpriseId);
    facts.customerNumber = identifier(raw.customerNumber);
    for (const field of ['mainUniqueId', 'requestUniqueId', 'callId', 'uniqueId']) facts[field] = identifier(raw[field]);
    if (kind !== 'inbound') facts.taskId = integerId(raw.taskId);
    function field(name, convert) {
      const result = convert(raw[name]);
      if (own(raw, name) && raw[name] !== null && raw[name] !== undefined && raw[name] !== '' && result === null && !(convert === atMs && amount(raw[name]) === 0)) facts.issues.push('字段格式待核对：' + name);
      return result;
    }
    facts.startAtMs = field('startTime', atMs); facts.endAtMs = field('endTime', atMs);
    if (facts.startAtMs !== null && facts.endAtMs !== null && facts.endAtMs < facts.startAtMs) {
      facts.issues.push('结束时间早于开始时间'); facts.endAtMs = null;
    }
    facts.ended = facts.endAtMs === null ? null : true;
    facts.customerAnsweredAtMs = field(kind === 'manual' ? 'bridgeTime' : ['predictive', 'automatic'].includes(kind) ? 'upTime' : 'answerTime', atMs);
    facts.agentAnsweredAtMs = kind === 'automatic' ? null : field(kind === 'manual' ? 'upTime' : 'bridgeTime', atMs);
    facts.bridgeSeconds = kind === 'automatic' ? null : field('bridgeDuration', amount);
    facts.customerSeconds = ['predictive', 'automatic'].includes(kind) ? field('customerBridgeDuration', amount) : null;
    if (['predictive', 'automatic'].includes(kind)) facts.telRetryRound = field('telRetryRound', amount);
    const primaryAgent = kind === 'inbound' ? 'firstCallCno' : 'cno';
    facts.primaryAgentCno = field(primaryAgent, identifier);
    // qnos is a query filter, not an API-317 response field.
    facts.primaryQueueNo = ['manual', 'automatic'].includes(kind) ? null : field(kind === 'inbound' ? 'firstCallQno' : 'qno', identifier);
    facts.agentCnos = facts.primaryAgentCno === null ? [] : [facts.primaryAgentCno];
    facts.queueNos = facts.primaryQueueNo === null ? [] : [facts.primaryQueueNo];
    if (kind === 'inbound') {
      for (const [input, output] of [['cnoFlow', 'agentCnos'], ['qnoFlow', 'queueNos']]) {
        if (raw[input] === null || raw[input] === undefined) continue;
        if (!Array.isArray(raw[input])) { facts.issues.push('字段格式待核对：' + input); continue; }
        raw[input].forEach(value => { const id = identifier(value); if (id === null) facts.issues.push('流转编号格式待核对：' + input); else if (!facts[output].includes(id)) facts[output].push(id); });
      }
      facts.firstJoinQueueAtMs = field('firstJoinQueueTime', atMs);
      facts.firstLeaveQueueAtMs = field('firstLeaveQueueTime', atMs);
      facts.queueSeconds = field('firstQueueDuration', amount);
      if (facts.firstJoinQueueAtMs !== null && facts.firstLeaveQueueAtMs !== null && facts.firstLeaveQueueAtMs < facts.firstJoinQueueAtMs) {
        facts.issues.push('首次离开队列时间早于进入时间'); facts.queueSeconds = null;
      }
      facts.statusResult = identifier(raw.statusResult);
      if (raw.status === '系统应答' && ['队列中放弃', '队列中溢出'].includes(facts.statusResult)) facts.queueOutcome = facts.statusResult;
    }
    // First-call identities and participant flows are not per-leg duration rows.
    // A missing/partial flow or multiple participants cannot attribute the whole
    // call duration to the first dialled participant.
    facts.agentAttributionAmbiguous = kind === 'automatic' || facts.primaryAgentCno === null || (kind === 'inbound' &&
      (raw.status !== '人工接听' || !Array.isArray(raw.cnoFlow) || raw.cnoFlow.some(value => identifier(value) === null) ||
       facts.agentCnos.length !== 1 || !raw.cnoFlow.includes(facts.primaryAgentCno)));
    facts.queueAttributionAmbiguous = facts.primaryQueueNo === null || (kind === 'inbound' &&
      (!Array.isArray(raw.qnoFlow) || raw.qnoFlow.some(value => identifier(value) === null) ||
       facts.queueNos.length !== 1 || !raw.qnoFlow.includes(facts.primaryQueueNo)));
    return facts;
  }
  root.AliCtiReportFacts = Object.freeze({ read });
})(typeof window === 'undefined' ? globalThis : window);
