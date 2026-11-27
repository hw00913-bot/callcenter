(() => {
  'use strict';

  const sourceNames = {native:'云外呼呼叫记录',workbench:'培育工作台'};
  const formatter = new Intl.DateTimeFormat('sv-SE',{
    timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  });
  const fail = error => ({ok:false,error});
  const rows = value => Array.isArray(value) ? value : [];
  const text = value => {
    const cleaned = typeof value==='string' ? value.trim() : Number.isFinite(value) ? String(value) : '';
    return ['—','--','-'].includes(cleaned) ? '' : cleaned;
  };
  const firstText = (...values) => values.map(text).find(Boolean) || '';

  function timestamp(value) {
    if (typeof value === 'number') return value>0 && value<=8640000000000000 ? value : 0;
    const cleaned = text(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return Date.parse(cleaned+'T00:00:00+08:00') || 0;
    const local = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(cleaned);
    const parsed = Date.parse(local ? cleaned.replace(' ','T')+'+08:00' : cleaned);
    return Number.isFinite(parsed) && parsed>0 ? parsed : 0;
  }

  const firstTime = (...values) => values.map(timestamp).find(Boolean) || 0;
  const seconds = value => value==null || value==='' || !Number.isFinite(Number(value)) || Number(value)<0
    ? null : Math.round(Number(value));
  const dateTime = value => value ? formatter.format(value) : '';
  const rowKey = (scope,callId) => 'QC-CALL:'+encodeURIComponent(scope.tenantId)+':'+encodeURIComponent(callId);
  const roundKey = (taskId,roundId) => JSON.stringify([taskId,roundId]);
  const sourceScope = context => window.DQualityInspection?.access(context);
  const sameScope = (a,b) => a && b && a.accountId===b.accountId && a.tenantId===b.tenantId && a.brandId===b.brandId;

  function nativeScope(frame, scope) {
    const native = frame?.DNativeContext?.context;
    return native?.scope?.kind==='tenant' && native.account?.id===scope.accountId &&
      native.scope.id===scope.tenantId && native.scope.tenant?.brandId===scope.brandId;
  }

  function inTenant(record, scope) {
    return (record?.tenantId || record?.tenant)===scope.tenantId && (!record.brandId || record.brandId===scope.brandId);
  }

  function mode(...values) {
    const current = firstText(...values);
    if (['人工外呼','预览外呼','MANUAL'].includes(current)) return '人工外呼';
    if (['预外呼','预测外呼','PREDICTIVE'].includes(current)) return '预外呼';
    if (['AI外呼','AI 外呼','AI'].includes(current)) return 'AI 外呼';
    return '';
  }

  function contact(...values) {
    const current = firstText(...values);
    if (['接通','已接通','已接听','ANSWERED'].includes(current)) return '已接通';
    if (['未接通','未接听','NO_ANSWER','未应答','无人接听'].includes(current)) return '未接通';
    return current || '结果待确认';
  }

  function maskedPhone(...values) {
    const phone = firstText(...values).replace(/[\s()-]/g,'').replace(/^\+86(?=\d{11}$)/,'');
    return /^\d{7,15}$/.test(phone) ? phone.slice(0,3)+'****'+phone.slice(-4) : phone.includes('*') ? phone : '';
  }

  function transcript(values) {
    return rows(values).flatMap(row => {
      const value = text(row?.text);
      if (!value) return [];
      return [{text:value,role:firstText(row.role,row.speaker) || '说话方未知',time:firstText(row.time,row.at)}];
    });
  }

  function tags(values) {
    return rows(values).flatMap(row=>{
      const label = typeof row==='string' ? text(row) : firstText(row?.label,row?.tagName,row?.name,row?.id);
      return label ? [{label,value:firstText(row?.value,row?.result) || label}] : [];
    });
  }

  function callFields(scope, raw, sourceType, ended, started, seat, evidence) {
    const callId = firstText(raw.callId,raw.cdrId,raw.contactId);
    const callMode = mode(raw.callMode,raw.callType,raw.mode);
    if (!callId || !callMode || !ended || !seat.seatId) return null;
    const outcome = contact(evidence?.answerLabel,raw.contact,raw.contactStatus,raw.result,raw.status);
    const connected = evidence?.answered===true || evidence?.answered===false ? evidence.answered :
      outcome==='已接通' ? true : outcome==='未接通' ? false : null;
    return {
      id:rowKey(scope,callId),callId,tenantId:scope.tenantId,brandId:scope.brandId,...seat,
      sourceType,sourceName:sourceNames[sourceType],callMode,contact:outcome,connected,
      taskId:firstText(raw.taskId),roundId:firstText(raw.roundId),
      leadCode:firstText(raw.leadCode,raw.localLeadCode,raw.sourceLeadCode,raw.externalDocumentId,raw.originalKey),
      customerName:firstText(raw.customerName,raw.name),
      phone:maskedPhone(raw.customerPhone,raw.phone,raw.direction==='呼入'?raw.caller:raw.callee),
      series:firstText(raw.series,raw.carSeries,raw.intentCarSeries),source:firstText(raw.source,raw.leadSource),
      channel:firstText(raw.channel,raw.rChannel),leadType:firstText(raw.leadType,raw.category,raw.businessType),
      dealer:firstText(raw.dealer,raw.intentStore,raw.dealerName),
      callAt:dateTime(started || ended),endedAt:dateTime(ended),duration:seconds(raw.duration ?? raw.durationSeconds),
      transcript:transcript(raw.transcript),tags:tags(raw.tags || raw.labels),
      followupResult:firstText(raw.followupResult,raw.agentDisposition),followupNote:firstText(raw.followupNote,raw.dispositionRemark),
      leadStatus:firstText(raw.leadStatus)
    };
  }

  function seatFields(seat) {
    return {seatId:firstText(seat?.agentRecordId,seat?.id,seat?.contactCenterIdentityId),seatName:firstText(seat?.name,seat?.userName),
      accountId:text(seat?.accountId),seatGroup:firstText(seat?.seatGroup,seat?.skillGroupName)};
  }

  function taskFields(record) {
    const values = record.businessImportSnapshot?.values || {};
    return {
      taskId:record.taskId,roundId:record.roundId,leadCode:firstText(record.localLeadCode,record.sourceLeadCode,record.originalKey),
      customerName:firstText(record.name,record.customerName),phone:firstText(record.phone,record.customerPhone),
      series:firstText(record.intentCarSeries,record.series,values.intentCarSeries,values.series),
      source:firstText(record.source,values.source,values.channel),channel:firstText(record.rChannel,values.rChannel,values.channel),
      leadType:firstText(record.category,record.leadType),dealer:firstText(record.dealer,values.dealer,values.intentStore),
      transcript:record.transcript,tags:record.tags
    };
  }

  function finishedWorkbench(scope, record, seat) {
    if (!inTenant(record,scope) || record.callState!=='aftercall' || !text(record.taskId) || !text(record.roundId) ||
        record.ownerId!==seat.seatId) return null;
    const started = timestamp(record.callTiming?.startedAt), ended = timestamp(record.callTiming?.endedAt);
    const callMode = mode(record.callMode);
    if (!started || ended<started || !['人工外呼','预外呼'].includes(callMode)) return null;
    const callId = 'WB-CALL:'+encodeURIComponent(record.taskId)+':'+encodeURIComponent(record.roundId)+':'+started;
    return callFields(scope,{...taskFields(record),callId,callMode,contact:record.callContact,
      duration:(ended-started)/1000},'workbench',ended,started,seat);
  }

  function stageWorkbenchCall(state, requested, record, seat) {
    const scope = sourceScope(requested);
    if (!scope || state?.tenant!==scope.tenantId || !rows(state.records).includes(record) || !rows(state.seats).includes(seat) ||
        !inTenant(seat,scope) || state.seatId!==seat.id || seat.accountId!==scope.accountId) return null;
    const call = finishedWorkbench(scope,record,seatFields(seat));
    if (!call) return null;
    const stored = rows(state.qualityCallAttempts);
    const existing = stored.find(row=>row.callId===call.callId && inTenant(row,scope));
    if (existing) return existing;
    state.qualityCallAttempts = [...stored,call];
    return call;
  }

  function finishedNative(scope, call, seats, frame, enterpriseId) {
    if (!inTenant(call,scope) || text(call.enterpriseId)!==enterpriseId || call.direction==='呼入' ||
        /呼入|IVR|自动外呼/i.test(firstText(call.callType,call.callMode))) return null;
    const seatId = firstText(call.agentRecordId,call.agentIdentityId,call.contactCenterIdentityId,call.seatId);
    const accountId = text(call.accountId);
    const matched = seatId ? seats.filter(seat =>
      [seat.agentRecordId,seat.contactCenterIdentityId].some(id=>text(id)===seatId)) :
      seats.filter(seat=>accountId && seat.accountId===accountId);
    const seat = matched.length===1 ? matched[0] : null;
    if ((!seatId && !seat) || matched.length>1) return null;
    const recordedName = firstText(call.agentName,call.seatName);
    const nativeSeat = seatFields(seat);
    const attributed = {...nativeSeat,seatId:firstText(nativeSeat.seatId,seatId),
      seatName:firstText(recordedName,nativeSeat.seatName),seatGroup:firstText(call.skillGroupName,nativeSeat.seatGroup),
      accountId:accountId || (recordedName && recordedName===nativeSeat.seatName ? nativeSeat.accountId : '')};
    const metrics = frame.CloudReportMetrics;
    const evidence = metrics?.state?.(call) || frame.CallState?.view?.(call);
    const ended = firstTime(call.endedMs,call.endedAt,evidence?.endedAt,evidence?.localEndedAt);
    const started = firstTime(call.ringingAt,call.startedAt,call.telephony?.startedAt,evidence?.customerEstablishedAt);
    if (!ended || started && ended<started || (call.alictiCdr != null && evidence?.ended===false && !call.endedAt)) return null;
    const answered = firstTime(evidence?.customerEstablishedAt,call.customerEstablishedAt,call.answeredAt);
    const duration = seconds(metrics?.recordedSeconds?.(call) ?? call.durationSeconds) ??
      (answered && ended>=answered ? seconds((ended-answered)/1000) : evidence?.answered===false ? 0 : null);
    let segments = call.transcript;
    if (!rows(segments).length && frame.CloudCallMedia?.resolve) {
      try { segments = frame.CloudCallMedia.resolve(call)?.segments; }
      catch (_) { /* Transcription is optional evidence; retain the original completed call. */ }
    }
    return callFields(scope,{...call,transcript:segments,duration},'native',ended,started,attributed,evidence);
  }

  function addLocalHistory(result, state, scope) {
    const seats = new Map(rows(state.seats).filter(seat=>inTenant(seat,scope)).map(seat=>[seat.id,seatFields(seat)]));
    for (const raw of [...rows(state.callRecords),...rows(state.qualityCallAttempts)]) {
      if (!inTenant(raw,scope) || !text(raw.callId)) continue;
      const seat = seats.get(raw.seatId);
      const call = callFields(scope,raw,'workbench',timestamp(raw.endedAt),timestamp(raw.callAt),{
        seatId:firstText(raw.seatId,seat?.seatId),seatName:firstText(raw.seatName,seat?.seatName),
        accountId:firstText(raw.accountId,seat?.accountId),seatGroup:firstText(raw.seatGroup,seat?.seatGroup)
      });
      if (call && !result.has(call.callId)) result.set(call.callId,call);
    }

    const oldVisits = [];
    for (const task of rows(state.records).filter(row=>inTenant(row,scope) && text(row.taskId))) {
      const seat = seats.get(task.ownerId);
      const ended = seat && finishedWorkbench(scope,task,seat);
      if (ended && !result.has(ended.callId)) result.set(ended.callId,ended);
      for (const visit of rows(task.followupHistory)) {
        const callMode = mode(visit.callMode,visit.callType);
        const submittedAt = timestamp(visit.at);
        if (visit.wecom || (visit.taskId && visit.taskId!==task.taskId) || !['人工外呼','预外呼'].includes(callMode) ||
            !text(visit.roundId) || !text(visit.contact) || !submittedAt || !seats.has(visit.seat)) continue;
        oldVisits.push({task,visit,callMode,submittedAt,seat:seats.get(visit.seat)});
      }
    }

    const byRound = new Map();
    for (const call of result.values()) {
      if (!call.taskId || !call.roundId) continue;
      const key = roundKey(call.taskId,call.roundId);
      byRound.set(key,[...(byRound.get(key) || []),call]);
    }
    for (const {task,visit,callMode,submittedAt,seat} of oldVisits) {
      const explicit = firstText(visit.qualityCallId,visit.callId,visit.cdrId,visit.callRecordId);
      const round = byRound.get(roundKey(task.taskId,visit.roundId)) || [];
      const existing = explicit ? result.get(explicit) : round.length===1 ? round[0] : null;
      if (existing) {
        if ((existing.accountId && seat.accountId && existing.accountId!==seat.accountId) ||
            (existing.taskId && existing.taskId!==task.taskId) ||
            (existing.roundId && existing.roundId!==visit.roundId)) continue;
        result.set(existing.callId,{...existing,taskId:task.taskId,roundId:visit.roundId,
          followupResult:text(visit.result),followupNote:text(visit.note),leadStatus:text(visit.leadStatus)});
        continue;
      }
      if (round.length || explicit) continue;
      // Older saved workbench records only had a report time; do not infer a call duration.
      const callId = 'WB-HISTORY:'+encodeURIComponent(task.taskId)+':'+encodeURIComponent(visit.roundId);
      const call = callFields(scope,{...taskFields(task),callId,callMode,roundId:visit.roundId,contact:visit.contact,
        followupResult:visit.result,followupNote:visit.note,leadStatus:visit.leadStatus,
        series:firstText(visit.details?.intentCarSeries,visit.details?.series,taskFields(task).series),
        transcript:visit.transcript,tags:visit.tags},'workbench',submittedAt,0,seat);
      if (call) result.set(call.callId,call);
    }
  }

  async function collect(requested) {
    const scope = sourceScope(requested);
    if (scope?.role!=='manager') return fail('当前账号无权读取本租户全量质检来源。');
    try {
      await window.DModuleHost.prepareIntegration();
      const state = await window.DReview21.ensureState({reload:true});
      const current = sourceScope();
      const frame = document.querySelector('iframe[data-native-module="cloud"]')?.contentWindow;
      const data = frame?.CloudCallData;
      const enterpriseId = text(window.DSession.context()?.scope?.tenant?.enterpriseId);
      if (!sameScope(current,scope) || !nativeScope(frame,scope) || !enterpriseId || state?.tenant!==scope.tenantId ||
          !Array.isArray(data?.calls) || !Array.isArray(data?.agents)) {
        return fail('质检通话来源暂未就绪，请确认当前租户后重试。');
      }
      const nativeCalls = frame.CustomerDirectory?.sync?.({readOnly:true}) || data.calls;
      if (!Array.isArray(nativeCalls)) return fail('云外呼通话记录暂不可读取。');
      const seats = data.agents.filter(seat=>inTenant(seat,scope) && text(seat.enterpriseId)===enterpriseId);
      const result = new Map();
      for (const row of nativeCalls) {
        const call = finishedNative(scope,row,seats,frame,enterpriseId);
        if (call && !result.has(call.callId)) result.set(call.callId,call);
      }
      addLocalHistory(result,state,scope);
      if (!sameScope(sourceScope(),scope)) return fail('使用范围已变化，请重新执行质检任务。');
      return {ok:true,calls:[...result.values()].sort((left,right)=>
        left.endedAt.localeCompare(right.endedAt) || left.callId.localeCompare(right.callId))};
    } catch (_) {
      return fail('质检通话记录暂不可读取，请稍后重试。');
    }
  }

  window.DQualityCallSource = Object.freeze({collect,stageWorkbenchCall});
})();
