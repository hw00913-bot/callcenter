/* SRC-054: local state aggregation. No SDK, network access, or vendor event fabrication. */
(function (root) {
  'use strict';

  const STAGES = { INIT: '待呼叫', DIALING: '拨号中', RINGING: '客户振铃', ANSWERED: '通话中', RELEASED: '已结束' };
  const RANK = { INIT: 0, DIALING: 1, RINGING: 2, ANSWERED: 3, RELEASED: 4 };
  const ANSWERS = { ANSWERED: '已接通', UNANSWERED: '未接通', UNKNOWN: '待确认' };
  // Internal demo outcomes are not the public number-recognition dictionary.
  const LOCAL_FAILURES = new Set(['NO_ANSWER', 'BUSY', 'POWER_OFF', 'NOT_EXIST', 'OUT_OF_SERVICE', 'RESTRICTED', 'NOT_CONNECTED', 'REJECTED', 'SYSTEM_ERROR', 'CANCELLED']);
  // Compatibility with saved local simulation events; never displayed as supplier number status.
  const EARLY_MEDIA = { NoAnswer: 'NO_ANSWER', Busy: 'BUSY', PowerOff: 'POWER_OFF', NotExist: 'NOT_EXIST', OutOfService: 'OUT_OF_SERVICE', Restricted: 'RESTRICTED', NotConnected: 'NOT_CONNECTED' };
  const TYPE = { dialing: 'DIALING', ringing: 'RINGING', established: 'ANSWERED', released: 'RELEASED' };
  const CONFIRMATIONS = { LIVE: '通话过程中', PENDING_CDR: '等待最终话单', CONFIRMED: '已完成校准', INSUFFICIENT: '证据不足，待确认', CONFLICT: '接通已确认，结束原因待核对', LEGACY: '历史记录，未核验原始事件' };

  function text(value) { return value === undefined || value === null ? '' : String(value).trim(); }
  function lookup(map, key) { return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined; }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
    return JSON.stringify(value);
  }
  function time(value) {
    if (value === undefined || value === null || value === '' || typeof value === 'boolean') return null;
    const input = text(value);
    if (!input || input === '—' || input === '-') return null;
    const number = typeof value === 'number' || /^\d+(\.\d+)?$/.test(input) ? Number(value) : Date.parse(input);
    return Number.isFinite(number) && number > 0 ? number : null;
  }
  function earlier(a, b) { return a === null ? b : b === null ? a : Math.min(a, b); }
  function later(a, b) { return a === null ? b : b === null ? a : Math.max(a, b); }
  function role(value) { return value === 'customer' || value === 'agent' ? value : 'unknown'; }
  function state(record) { return record && record.telephony && record.telephony.version === 1 ? record.telephony : null; }
  function advance(target, next) { if (RANK[next] > RANK[target.stage]) target.stage = next; }
  function scopeError(target, input, partial) {
    const enterpriseId = text(input.enterpriseId || input.EnterpriseId), contactId = text(input.contactId || input.ContactId);
    if ([input.enterpriseId, input.EnterpriseId].some(value => text(value) && text(value) !== target.enterpriseId)) return 'instance-mismatch';
    if ([input.contactId, input.ContactId].some(value => text(value) && text(value) !== target.contactId)) return 'contact-mismatch';
    if (!partial && (!enterpriseId || !contactId)) return 'missing-scope';
    return '';
  }
  function issue(target, code) { if (!target.issues.includes(code)) target.issues.push(code); }
  function evidence(target, participant, at, origin, reference) {
    const list = participant === 'customer' ? target.customerEvidence : target.agentEvidence;
    const fact = { at, origin, reference };
    if (!list.some(item => canonical(item) === canonical(fact))) list.push(fact);
    if (participant === 'agent') target.agentEstablishedAt = earlier(target.agentEstablishedAt, at);
    else {
      target.customerEstablishedAt = earlier(target.customerEstablishedAt, at);
      target.answerResult = 'ANSWERED';
      target.failureReason = null;
      target.possibleFailureReason = null;
      advance(target, 'ANSWERED');
    }
  }
  function restoreChannelEvidence(target, channel) {
    target.rawEvents.forEach((entry, index) => {
      if (!entry.accepted) return;
      const raw = entry.raw;
      if (text(raw.channelId || raw.ChannelId) !== channel.channelId || lookup(TYPE, text(raw.type || raw.Event).toLowerCase()) !== 'ANSWERED') return;
      const at = time(raw.at === undefined ? raw.EventTime : raw.at);
      if (at !== null) evidence(target, channel.role, at, 'channel-established', 'rawEvents[' + index + ']');
    });
  }
  function refreshConfirmation(target) {
    if (target.answerResult === 'ANSWERED' && target.finalUnanswered) {
      issue(target, 'customer-established-conflicts-with-final-unanswered');
      target.confirmation = 'CONFLICT';
    } else if (target.cdrFinal) target.confirmation = target.answerResult === 'UNKNOWN' ? 'INSUFFICIENT' : 'CONFIRMED';
    else target.confirmation = target.stage === 'RELEASED' ? 'PENDING_CDR' : 'LIVE';
  }
  function result(record, accepted, ignoredReason) { return Object.assign(view(record), { accepted, ignoredReason: ignoredReason || '' }); }

  function start(record, options) {
    options = options || {};
    if (!record || typeof record !== 'object') throw new TypeError('CallState.start requires a call record');
    if (state(record)) return view(record);
    const enterpriseId = text(options.enterpriseId || record.enterpriseId), contactId = text(options.contactId || record.contactId || record.callId);
    if (!enterpriseId || !contactId) throw new TypeError('CallState.start requires enterpriseId and contactId/callId');
    if (record.enterpriseId && text(record.enterpriseId) !== enterpriseId) throw new TypeError('CallState.start instance mismatch');
    if ((record.contactId || record.callId) && text(record.contactId || record.callId) !== contactId) throw new TypeError('CallState.start contact mismatch');
    record.telephony = {
      version: 1, enterpriseId, contactId, scenario: text(options.scenario || record.callType), source: text(options.source) || 'local-simulation',
      stage: 'INIT', answerResult: 'UNKNOWN', failureReason: null, possibleFailureReason: null, confirmation: 'LIVE',
      startedAt: time(options.at), customerEstablishedAt: null, agentEstablishedAt: null, endedAt: null,
      localEndedAt: null, releaseTime: null, cdrFinal: false, finalUnanswered: false,
      channels: [], rawEvents: [], reconciliations: [], operations: [], customerEvidence: [], agentEvidence: [], issues: []
    };
    return view(record);
  }

  function ingest(record, event) {
    const target = state(record);
    if (!target) throw new TypeError('CallState.start must precede ingest');
    const raw = copy(event || {}), channelId = text(raw.channelId || raw.ChannelId), eventRole = role(raw.role);
    const next = lookup(TYPE, text(raw.type || raw.Event).toLowerCase()), at = time(raw.at === undefined ? raw.EventTime : raw.at);
    const entry = { raw, accepted: false, disposition: 'rejected', reason: '', source: text(raw.source) || target.source };
    const rejection = scopeError(target, raw) || (!channelId ? 'missing-channel' : '') || (!next ? 'unsupported-event' : '') || (at === null ? 'missing-event-time' : '');
    if (rejection) {
      entry.reason = rejection;
      target.rawEvents.push(entry);
      return result(record, false, rejection);
    }
    // Event ids are scoped to the verified call; without an id, use the normalized event identity.
    const fingerprint = canonical({ channelId, role: eventRole, type: next, at });
    const eventId = text(raw.eventId || raw.EventId);
    const key = eventId ? 'id:' + eventId : 'event:' + fingerprint;
    const previous = target.rawEvents.find(item => item.accepted && item.key === key);
    entry.key = key;
    entry.fingerprint = fingerprint;
    if (previous) {
      entry.disposition = previous.fingerprint === fingerprint ? 'duplicate' : 'rejected';
      entry.reason = previous.fingerprint === fingerprint ? 'duplicate' : 'event-id-conflict';
      if (entry.reason === 'event-id-conflict') issue(target, entry.reason);
      target.rawEvents.push(entry);
      return result(record, false, entry.reason);
    }
    let channel = target.channels.find(item => item.channelId === channelId);
    if (channel && channel.role !== 'unknown' && eventRole !== 'unknown' && channel.role !== eventRole) {
      entry.reason = 'channel-role-conflict';
      target.rawEvents.push(entry);
      issue(target, entry.reason);
      return result(record, false, entry.reason);
    }
    if (!channel) {
      channel = { channelId, role: eventRole, stage: 'INIT', establishedAt: null, releasedAt: null };
      target.channels.push(channel);
    } else if (channel.role === 'unknown' && eventRole !== 'unknown') {
      channel.role = eventRole;
      // Identity can arrive after Established; preserve its original time and accepted receipt.
      restoreChannelEvidence(target, channel);
    }
    entry.accepted = true;
    entry.disposition = 'applied';
    target.rawEvents.push(entry);
    const reference = 'rawEvents[' + (target.rawEvents.length - 1) + ']';
    advance(channel, next);
    if (next === 'ANSWERED') {
      channel.establishedAt = earlier(channel.establishedAt, at);
      // The channel's explicit adapter association may resolve an otherwise unknown role.
      if (channel.role !== 'unknown') evidence(target, channel.role, at, 'channel-established', reference);
    }
    if (next === 'RELEASED') channel.releasedAt = later(channel.releasedAt, at);
    if (next === 'DIALING') advance(target, 'DIALING');
    if (next === 'RINGING' && channel.role === 'customer') advance(target, 'RINGING');
    // A channel Released event never proves that every participant has left the call.
    refreshConfirmation(target);
    return result(record, true);
  }

  function finish(record, options) {
    const target = state(record);
    if (!target) throw new TypeError('CallState.start must precede finish');
    options = options || {};
    if (target.localEndedAt === null) {
      const at = time(options.at) || Date.now();
      target.localEndedAt = at;
      target.endedAt = target.releaseTime || at;
      target.operations.push({ operation: 'local-session-finished', at, source: text(options.source) || target.source });
    }
    advance(target, 'RELEASED');
    refreshConfirmation(target);
    return view(record);
  }

  function cdrParticipantEvents(target, groups, participant, reference) {
    if (!Array.isArray(groups)) return;
    groups.forEach((group, groupIndex) => {
      if (!group || typeof group !== 'object') return;
      if ((group.EnterpriseId && text(group.EnterpriseId) !== target.enterpriseId) || (group.ContactId && text(group.ContactId) !== target.contactId)) {
        issue(target, 'cdr-participant-scope-mismatch');
        return;
      }
      if (!Array.isArray(group.EventSequence)) return;
      group.EventSequence.forEach((event, index) => {
        if (!event || typeof event !== 'object') return;
        const at = time(event.EventTime), next = lookup(TYPE, text(event.Event).toLowerCase());
        if (at === null || !next) return;
        if (next === 'ANSWERED') evidence(target, participant, at, 'cdr-' + participant + '-event', reference + '[' + groupIndex + '].EventSequence[' + index + ']');
        else if (participant === 'customer' && next === 'RINGING') advance(target, 'RINGING');
        // Released is still participant-level here; only top-level ReleaseTime ends the aggregate.
      });
    });
  }

  function reconcile(record, cdr, options) {
    const target = state(record);
    if (!target) throw new TypeError('CallState.start must precede reconcile');
    options = options || {};
    const raw = copy(cdr || {}), data = raw.Data && typeof raw.Data === 'object' && !Array.isArray(raw.Data) ? raw.Data : raw;
    const source = text(options.source) || target.source;
    const policy = { establishedTimeIsCustomer: options.establishedTimeIsCustomer === true, source, confirmedUnanswered: options.confirmedUnanswered === true, normalizedFailureReason: text(options.normalizedFailureReason) };
    const key = canonical({ raw, policy });
    const entry = { raw, policy, key, accepted: false, disposition: 'rejected', reason: '' };
    const associatedScope = { enterpriseId: data.enterpriseId || data.EnterpriseId || raw.enterpriseId || raw.EnterpriseId, contactId: data.contactId || data.ContactId || raw.contactId || raw.ContactId };
    const rejection = scopeError(target, raw, true) || scopeError(target, data, true) || scopeError(target, associatedScope) || (raw.Code && raw.Code !== 'OK' ? 'cdr-request-failed' : '');
    if (rejection) {
      entry.reason = rejection;
      target.reconciliations.push(entry);
      return result(record, false, rejection);
    }
    if (target.reconciliations.some(item => item.accepted && item.key === key)) {
      entry.disposition = 'duplicate';
      entry.reason = 'duplicate';
      target.reconciliations.push(entry);
      return result(record, false, 'duplicate');
    }
    entry.accepted = true;
    entry.disposition = 'applied';
    target.reconciliations.push(entry);
    const reference = 'reconciliations[' + (target.reconciliations.length - 1) + '].raw' + (data === raw ? '' : '.Data');
    cdrParticipantEvents(target, data.CustomerEvents, 'customer', reference + '.CustomerEvents');
    cdrParticipantEvents(target, data.AgentEvents, 'agent', reference + '.AgentEvents');
    const customerAt = time(data.CustomerEstablishedTime), agentAt = time(data.AgentEstablishedTime), establishedAt = time(data.EstablishedTime), releaseAt = time(data.ReleaseTime);
    if (customerAt !== null) evidence(target, 'customer', customerAt, 'cdr-customer-established-time', reference + '.CustomerEstablishedTime');
    if (agentAt !== null) evidence(target, 'agent', agentAt, 'cdr-agent-established-time', reference + '.AgentEstablishedTime');
    if (policy.establishedTimeIsCustomer && establishedAt !== null) evidence(target, 'customer', establishedAt, 'cdr-established-time-with-customer-context', reference + '.EstablishedTime');
    if (releaseAt !== null) {
      target.releaseTime = later(target.releaseTime, releaseAt);
      target.endedAt = target.releaseTime;
      target.cdrFinal = true;
      advance(target, 'RELEASED');
    }
    const disposition = text(data.ContactDisposition), possible = lookup(EARLY_MEDIA, text(data.EarlyMediaState)) || null;
    // Do not consume another product's DispositionCode, infer Success means answered,
    // or use missing EstablishedTime / early media alone as proof of an unanswered call.
    const explicitFailure = disposition === 'NoAnswer' ? 'NO_ANSWER' : disposition === 'Reject' ? 'REJECTED' : null;
    const localFailure = source === 'local-simulation' && policy.confirmedUnanswered && LOCAL_FAILURES.has(policy.normalizedFailureReason) ? policy.normalizedFailureReason : null;
    if (releaseAt !== null && (explicitFailure || localFailure)) {
      target.finalUnanswered = true;
      if (target.answerResult !== 'ANSWERED') {
        target.answerResult = 'UNANSWERED';
        target.failureReason = localFailure || explicitFailure;
        target.possibleFailureReason = explicitFailure === 'NO_ANSWER' ? possible : null;
      }
    } else if (target.answerResult === 'UNKNOWN' && possible) target.possibleFailureReason = possible;
    if (target.answerResult === 'ANSWERED') {
      target.failureReason = null;
      target.possibleFailureReason = null;
    }
    refreshConfirmation(target);
    return result(record, true);
  }

  function legacy(record) {
    record = record || {};
    const oldResult = text(record.result), answerAt = time(record.answeredAt || record.establishedAt), endedAt = time(record.endedAt);
    const duration = record.durationSeconds === '' || record.durationSeconds === null ? null : Number(record.durationSeconds);
    const interruption = /演示中断|待核对|待确认|未知/.test(oldResult);
    const explicitAnswered = oldResult === '接通' || oldResult === '已接通';
    const answered = !interruption && explicitAnswered && (answerAt !== null || (Number.isFinite(duration) && duration > 0));
    const oldReasons = { 未接通: 'UNKNOWN', 无人接听: 'NO_ANSWER', 客户未接: 'NO_ANSWER', 忙线: 'BUSY', 占线: 'BUSY', 关机: 'POWER_OFF', 空号: 'NOT_EXIST', 停机: 'OUT_OF_SERVICE', 呼叫受限: 'RESTRICTED', 无法接通: 'NOT_CONNECTED', 拒接: 'REJECTED', 客户拒接: 'REJECTED' };
    const unanswered = !interruption && Object.prototype.hasOwnProperty.call(oldReasons, oldResult);
    const answerResult = answered ? 'ANSWERED' : unanswered ? 'UNANSWERED' : 'UNKNOWN';
    let stage = 'INIT';
    if (endedAt !== null || explicitAnswered || unanswered || /完成|结束|中断|异常|取消/.test(oldResult)) stage = 'RELEASED';
    else if (/振铃/.test(oldResult)) stage = 'RINGING';
    else if (/呼叫中|拨号/.test(oldResult)) stage = 'DIALING';
    return { stage, answerResult, failureReason: unanswered ? oldReasons[oldResult] : null, possibleFailureReason: null, confirmation: 'LEGACY', source: 'legacy-record', customerEstablishedAt: answered ? answerAt : null, agentEstablishedAt: null, endedAt, issues: [] };
  }

  function view(record) {
    const eventState = state(record);
    let target = eventState || legacy(record);
    let agentAnswered = time(target.agentEstablishedAt) !== null ? true : null;
    const source=record?.alictiCdr, raw=source?.raw;
    if(source && root.AliCtiFields){
      const validRaw=raw && typeof raw==='object' && !Array.isArray(raw);
      const supplier=root.AliCtiFields.normalizeCdr(source.kind,validRaw?raw:{});
      const match=validRaw && (raw.enterpriseId==null || String(raw.enterpriseId)===String(record.providerEnterpriseId??record.enterpriseId));
      // Preserve positive event evidence, not a legacy page label. A returned
      // unknown status cannot inherit "接通" from an old local presentation.
      const establishedAt = time(eventState?.customerEstablishedAt);
      const answeredBefore = !!eventState && target.answerResult === 'ANSWERED' && establishedAt !== null && Array.isArray(eventState.customerEvidence) &&
        eventState.customerEvidence.some(entry => time(entry.at) === establishedAt && text(entry.origin) && text(entry.reference));
      const customerConflict = match && answeredBefore && supplier.customerAnswered === false;
      const agentConflict = match && agentAnswered === true && supplier.agentAnswered === false;
      const issues = [...(target.issues||[]),...supplier.issues,...(!validRaw?['话单原始响应不可用']:match?[]:['供应商账号不匹配'])];
      if (customerConflict) issues.push('customer-established-conflicts-with-final-unanswered');
      if (agentConflict) issues.push('agent-established-conflicts-with-final-unanswered');
      // A late or incomplete CDR cannot erase established positive evidence.
      // Keep the original payload intact and expose conflicts for reconciliation.
      const answerResult = !match ? 'UNKNOWN' : answeredBefore || supplier.customerAnswered === true ? 'ANSWERED' : supplier.customerAnswered === false ? 'UNANSWERED' : 'UNKNOWN';
      agentAnswered = !match ? null : agentAnswered === true || supplier.agentAnswered === true ? true : supplier.agentAnswered === false ? false : null;
      const confirmation = customerConflict || target.confirmation === 'CONFLICT' ? 'CONFLICT' : !match || agentConflict || supplier.status !== '已归一' ? 'INSUFFICIENT' : target.cdrFinal ? target.confirmation : 'PENDING_CDR';
      target={...target,answerResult,confirmation,source:'alicti-cdr',issues:[...new Set(issues)]};
    }
    const answerResult = lookup(ANSWERS, target.answerResult) ? target.answerResult : 'UNKNOWN';
    const known = answerResult !== 'UNKNOWN', possible = target.possibleFailureReason;
    const numberStatus = root.AliCtiNumberStatus.read(record), reasonLabel = numberStatus.label;
    return {
      stage: target.stage, stageLabel: STAGES[target.stage] || '待呼叫', answerResult, answerLabel: ANSWERS[answerResult],
      failureReason: target.failureReason, possibleFailureReason: possible, reasonLabel, numberStatus,
      confirmation: target.confirmation, confirmationLabel: CONFIRMATIONS[target.confirmation] || '待确认',
      answered: known ? answerResult === 'ANSWERED' : null, known, ended: target.stage === 'RELEASED',
      agentAnswered,
      customerEstablishedAt: target.customerEstablishedAt, agentEstablishedAt: target.agentEstablishedAt, endedAt: target.endedAt,
      source: target.source, sourceLabel: target.source === 'local-simulation' ? '本地模拟' : target.source === 'legacy-record' ? '历史记录' : '归一事件 / 话单',
      issues: (target.issues || []).slice()
    };
  }

  root.CallState = Object.freeze({ start, ingest, finish, reconcile, view });
})(typeof window === 'undefined' ? globalThis : window);
