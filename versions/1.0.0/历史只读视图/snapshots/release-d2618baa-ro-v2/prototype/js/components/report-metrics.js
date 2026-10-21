/** Shared call statistics for reports and workbenches; inputs remain unchanged. */
(function (root) {
  'use strict';

  function timestamp(value) {
    if (value === null || value === undefined || typeof value === 'boolean') return null;
    if (typeof value !== 'number' && typeof value !== 'string' && !(value instanceof Date)) return null;
    const text = typeof value === 'string' ? value.trim() : '';
    if (typeof value === 'string' && (!text || text === '—' || text === '-')) return null;
    const at = value instanceof Date ? value.getTime() : typeof value === 'number' || /^[-+]?\d+(?:\.\d+)?$/.test(text) ? Number(value) : Date.parse(text);
    return Number.isFinite(at) && Math.abs(at) <= 8640000000000000 ? at : null;
  }

  function facts(call) {
    return root.AliCtiReportFacts?.read(call) || { present: call?.alictiCdr != null, usable: false };
  }
  function callState(call) {
    const state = root.CallState.view(call), official = facts(call);
    if (!official.present) return state;
    if (!official.usable) return { ...state, answered: null, agentAnswered: null, known: false, ended: false, answerLabel: '通话结果待确认' };
    const normalized = root.AliCtiFields.normalizeCdr(official.kind, official.raw);
    // Actual event evidence survives a contradictory late CDR (RG-07); a local
    // presentation label is not evidence for a missing official response field.
    const eventState = call.telephony?.version === 1 ? call.telephony : null;
    const answered = eventState?.answerResult === 'ANSWERED' && state.answered === true ? true : normalized.customerAnswered;
    const agentAnswered = timestamp(eventState?.agentEstablishedAt) > 0 && state.agentAnswered === true ? true : normalized.agentAnswered;
    return { ...state, answered, agentAnswered, known: answered !== null, ended: official.ended === true,
      answerLabel: answered === true ? '已接通' : answered === false ? '未接通' : '通话结果待确认' };
  }
  function ended(call) { return callState(call).ended; }
  function firstTime(values) { return values.map(timestamp).find(value => value !== null) ?? null; }
  function callTime(call) {
    const official = facts(call);
    if (official.present) return official.usable ? official.startAtMs : null;
    const state = callState(call);
    return firstTime([call.ringingAt, state.customerEstablishedAt, call.customerEstablishedAt, call.answeredAt, state.endedAt, call.endedAt]);
  }

  function phone(value) {
    let normalized = String(value ?? '').normalize('NFKC').trim().replace(/[\s()（）\-－]/g, '');
    if (/^\+86\d{7,13}$/.test(normalized)) normalized = normalized.slice(3);
    else if (/^0086\d{7,13}$/.test(normalized)) normalized = normalized.slice(4);
    return /^\d{7,15}$/.test(normalized) ? normalized : '';
  }
  function customerKey(call) {
    const number = customerPhone(call);
    return JSON.stringify([call.tenantId || '', call.enterpriseId || '', number ? 'phone' : 'call', number || call.callId]);
  }
  function customerPhone(call) {
    const official = facts(call);
    if (official.present) return official.usable ? phone(official.customerNumber) : '';
    return phone(call.direction === '呼入' || call.callType === '呼入' ? call.caller : call.callee);
  }

  function attemptNumber(call) {
    const value = call.attemptNumber;
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    if (typeof value === 'string' && !value.trim()) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : null;
  }
  function sameScope(a, b) { return a.tenantId === b.tenantId && a.enterpriseId === b.enterpriseId; }
  function sameCall(a, b) { return a === b || !!(a.callId && b.callId && a.callId === b.callId && sameScope(a, b)); }
  function attemptKind(call, universe) {
    const number = attemptNumber(call);
    if (number !== null) return number === 1 ? 'first' : 'repeat';
    if (!call.customerTaskItemId || !call.tenantId || !call.enterpriseId || !Array.isArray(universe)) return 'unknown';
    const history = universe.filter(row => sameScope(row, call) && row.customerTaskItemId === call.customerTaskItemId);
    if (!history.some(row => sameCall(row, call))) return 'unknown';
    const at = callTime(call);
    if (at === null) return 'unknown';
    // A proven earlier attempt establishes a repeat, even if another timestamp is missing.
    if (history.some(row => !sameCall(row, call) && callTime(row) !== null && callTime(row) < at)) return 'repeat';
    // Missing dates, tied starts or an explicit earlier-attempt number cannot prove a first call.
    if (history.some(row => callTime(row) === null || (!sameCall(row, call) && callTime(row) === at))) return 'unknown';
    if (history.some(row => sameCall(row, call) && (attemptNumber(row) || 1) > 1)) return 'unknown';
    return call.attemptHistoryComplete === true ? 'first' : 'unknown';
  }

  function recordedSeconds(call) {
    const official = facts(call);
    if (official.present) return official.usable ? official.bridgeSeconds : null;
    const value = call.durationSeconds;
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    if (typeof value === 'string' && !/^[+]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())) return null;
    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
  }
  // Accept a call record or an already normalized CallState.view result.
  function humanState(value) {
    return value && typeof value.known === 'boolean' && typeof value.ended === 'boolean' && 'answered' in value ? value : callState(value);
  }
  function humanAnswer(value) {
    const state = humanState(value);
    if (state.answered === false || state.agentAnswered === false) return false;
    return state.answered === true && (state.agentAnswered === true || timestamp(state.customerEstablishedAt) !== null && timestamp(state.agentEstablishedAt) !== null) ? true : null;
  }
  function humanSeconds(call) {
    const state = callState(call);
    if (!state.ended || humanAnswer(state) !== true) return null;
    const official = facts(call);
    if (official.present) return official.usable ? official.bridgeSeconds : null;
    const customerAt = timestamp(state.customerEstablishedAt), agentAt = timestamp(state.agentEstablishedAt);
    if (customerAt === null || agentAt === null) return null;
    const start = Math.max(customerAt, agentAt), end = timestamp(state.endedAt);
    return end !== null && end >= start ? Math.floor((end - start) / 1000) : null;
  }
  function queueSeconds(call) {
    const official = facts(call);
    if (official.present) return official.usable ? official.queueSeconds : null;
    const state = callState(call);
    if (humanAnswer(state) !== true) return null;
    const entered = timestamp(call.queueAt), answered = timestamp(state.agentEstablishedAt);
    return entered !== null && answered !== null && answered >= entered ? (answered - entered) / 1000 : null;
  }
  function queueOutcome(call) {
    const official = facts(call);
    return official.present && official.usable ? official.queueOutcome : null;
  }
  function customerSeconds(call) {
    const official = facts(call);
    return official.present && official.usable ? official.customerSeconds : null;
  }
  function durationApplicable(call, state = callState(call)) {
    if (facts(call).kind === 'automatic') return false;
    return call.callType !== 'IVR 外呼' || humanAnswer(state) === true;
  }
  function percentage(part, total) { return total ? (100 * part / total).toFixed(1) + '%' : '—'; }
  function total(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) : null; }
  function stats(calls, universe = calls) {
    const ended = calls.filter(call => callState(call).ended), duration = [], humanDuration = [], customerDuration = [], queue = [];
    const identified = ended.filter(call => customerPhone(call));
    const result = { total: ended.length, connected: 0, unanswered: 0, pending: 0, known: 0, rate: '—', customers: new Set(identified.map(customerKey)).size, customerUnknown: ended.length - identified.length,
      firstCount: 0, firstConnected: 0, firstKnown: 0, firstRate: '—', repeatCount: 0, attemptUnknown: 0,
      seconds: null, durationSamples: 0, durationMissing: 0, durationNotApplicable: 0, avgSeconds: null,
      customerSeconds: null, customerDurationSamples: 0, customerDurationMissing: 0, customerAvgSeconds: null,
      humanConnected: 0, humanUnanswered: 0, humanPending: 0, humanKnown: 0, humanRate: '—',
      humanSeconds: null, humanDurationSamples: 0, humanDurationMissing: 0, humanAvgSeconds: null, queueAverage: null, queueSamples: 0, queueAbandoned: 0, queueOverflow: 0 };
    ended.forEach(call => {
      const state = callState(call), kind = attemptKind(call, universe), human = humanAnswer(state);
      if (state.answered === true) {
        result.connected++;
        if (durationApplicable(call, state)) {
          const value = recordedSeconds(call);
          if (value !== null) duration.push(value); else result.durationMissing++;
        } else result.durationNotApplicable++;
        const customerValue = customerSeconds(call);
        if (customerValue !== null) customerDuration.push(customerValue);
        else if (['predictive', 'automatic'].includes(facts(call).kind)) result.customerDurationMissing++;
      } else if (state.answered === false) result.unanswered++;
      else result.pending++;
      if (kind === 'first') {
        result.firstCount++;
        if (state.answered === true) result.firstConnected++;
        if (state.answered === true || state.answered === false) result.firstKnown++;
      } else if (kind === 'repeat') result.repeatCount++;
      else result.attemptUnknown++;
      if (human === true) {
        result.humanConnected++;
        const value = humanSeconds(call);
        if (value !== null) humanDuration.push(value);
      } else if (human === false) result.humanUnanswered++;
      else result.humanPending++;
      const queued = queueSeconds(call), outcome = queueOutcome(call);
      if (queued !== null) queue.push(queued);
      if (outcome === '队列中放弃') result.queueAbandoned++;
      if (outcome === '队列中溢出') result.queueOverflow++;
    });
    result.known = result.connected + result.unanswered;
    result.rate = percentage(result.connected, result.known);
    result.firstRate = percentage(result.firstConnected, result.firstKnown);
    result.seconds = total(duration);
    result.durationSamples = duration.length;
    result.avgSeconds = duration.length ? result.seconds / duration.length : null;
    result.customerSeconds = total(customerDuration);
    result.customerDurationSamples = customerDuration.length;
    result.customerAvgSeconds = customerDuration.length ? result.customerSeconds / customerDuration.length : null;
    result.humanKnown = result.humanConnected + result.humanUnanswered;
    result.humanRate = percentage(result.humanConnected, result.humanKnown);
    result.humanSeconds = total(humanDuration);
    result.humanDurationSamples = humanDuration.length;
    result.humanDurationMissing = result.humanConnected - humanDuration.length;
    result.humanAvgSeconds = humanDuration.length ? result.humanSeconds / humanDuration.length : null;
    result.queueSamples = queue.length;
    result.queueAverage = queue.length ? total(queue) / queue.length : null;
    return result;
  }

  root.CloudReportMetrics = Object.freeze({ timestamp, callTime, customerKey, customerPhone, attemptKind, stats, recordedSeconds, durationApplicable, humanSeconds, humanAnswer, customerSeconds, queueSeconds, queueOutcome, ended, state: callState });
})(typeof window === 'undefined' ? globalThis : window);
