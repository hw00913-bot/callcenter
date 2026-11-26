/* Read-only projection of already authorized task followups. No customer/name
 * matching, business state transitions or persistence belongs in this helper. */
(() => {
  'use strict';
  const text=value=>typeof value==='string'?value.trim():'';
  const object=value=>Boolean(value && typeof value==='object' && !Array.isArray(value));
  const completedStatuses=new Set(['已完成','已结束','已下发','已归档','已结案']);
  const scalar=value=>typeof value==='string'?value.trim():typeof value==='number'&&Number.isFinite(value)?String(value):'';

  function stamp(value) {
    if (value instanceof Date) return Number.isFinite(value.getTime())?value.getTime():-Infinity;
    if (typeof value!=='string') return -Infinity;
    const input=value.trim();
    const match=/^(\d{4})(?:-(\d{1,2})-(\d{1,2})|\/(\d{1,2})\/(\d{1,2})|年(\d{1,2})月(\d{1,2})日)(?:[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?(Z|[+-]\d{2}:\d{2})?$/.exec(input);
    if (!match) return -Infinity;
    const year=Number(match[1]),month=Number(match[2]||match[4]||match[6]),day=Number(match[3]||match[5]||match[7]);
    const hour=Number(match[8]||0),minute=Number(match[9]||0),second=Number(match[10]||0);
    const millisecond=Number((match[11]||'').padEnd(3,'0')),zone=match[12];
    const leap=year%4===0 && (year%100!==0 || year%400===0);
    const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
    if (month<1 || month>12 || day<1 || day>days[month-1] || hour>23 || minute>59 || second>59 ||
        zone && !match[8]) return -Infinity;
    let offset=480;
    if (zone==='Z') offset=0;
    else if (zone) {
      const hours=Number(zone.slice(1,3)),minutes=Number(zone.slice(4,6));
      if (hours>23 || minutes>59) return -Infinity;
      offset=(zone[0]==='-'?-1:1)*(hours*60+minutes);
    }
    const date=new Date(0);
    date.setUTCFullYear(year,month-1,day);date.setUTCHours(hour,minute,second,millisecond);
    const result=date.getTime()-offset*60_000;
    return Number.isFinite(result)?result:-Infinity;
  }

  function completed(record) {
    return object(record) && (completedStatuses.has(record.taskStatus) ||
      record.skynet?.delivery?.status==='已下发' || record.delivery?.status==='已下发');
  }
  const tenantOf=record=>scalar(record.tenant || record.tenantId);
  const brandOf=(record,brandId)=>scalar(record.brandId) || scalar(brandId);
  function inScope(record,{tenantId,brandId}) {
    return object(record) && Boolean(scalar(tenantId)) && tenantOf(record)===scalar(tenantId) &&
      (!scalar(brandId) || !scalar(record.brandId) || scalar(record.brandId)===scalar(brandId));
  }
  function lineage(record,scope) {
    const category=scalar(record.categoryContext || record.categoryId);
    const application=scalar(record.sourceApplicationId || record.skynet?.sourceApplicationId);
    const original=scalar(record.originalKey || record.sourceLeadCode || record.localLeadCode);
    if (!category || !application || !original) return '';
    return JSON.stringify([tenantOf(record),brandOf(record,scope.brandId),category,application,original]);
  }
  function savedVisit(visit) {
    if (!object(visit) || visit.draft===true || visit.isDraft===true || visit.saved===false ||
        ['draft','草稿'].includes(visit.status)) return false;
    return ['result','note','contact','date','at','seat'].some(key=>Boolean(scalar(visit[key]))) ||
      object(visit.details) && Object.keys(visit.details).length>0 ||
      Array.isArray(visit.detailFields) && visit.detailFields.length>0;
  }
  function legacyVisit(record) {
    if (!text(record.followupResult)) return null;
    const visit={result:record.followupResult,note:record.followupNote || '',date:record.lastFollowupAt || '',nextAt:record.nextAt || ''};
    if (scalar(record.taskId)) visit.taskId=record.taskId;
    if (scalar(record.roundId || record.skynet?.roundId)) visit.roundId=record.roundId || record.skynet.roundId;
    if (object(record.visitDetails)) visit.details={...record.visitDetails};
    if (record.leadStatus!=null) visit.leadStatus=record.leadStatus;
    if (!['requested','active','aftercall'].includes(record.callState)) {
      if (scalar(record.callMode)) visit.callMode=record.callMode;
      else if (scalar(record.callType)) visit.callType=record.callType;
    }
    const fields=record.detailFields || record.visitDetailFields;
    if (Array.isArray(fields)) visit.detailFields=fields.map(field=>Array.isArray(field)?[...field]:field);
    return visit;
  }
  const sourceText=value=>typeof value==='string'?value.trim():value instanceof Date && Number.isFinite(value.getTime())?value.toISOString():'';
  function timed(visit,sourceIndex) {
    for (const source of [visit.at,visit.date]) {
      const time=stamp(source);
      if (Number.isFinite(time)) return {visit,time,timeText:sourceText(source),sourceIndex};
    }
    return {visit,time:-Infinity,timeText:sourceText(visit.at)||sourceText(visit.date)||'时间未记录',sourceIndex};
  }
  function visitsOf(record) {
    const history=Array.isArray(record.followupHistory)?record.followupHistory:[];
    const source=history.length?history:[legacyVisit(record)].filter(Boolean);
    return source.flatMap((visit,index)=>{
      if (!savedVisit(visit) || scalar(visit.taskId) && scalar(visit.taskId)!==scalar(record.taskId)) return [];
      return [timed(visit,index)];
    }).sort((first,second)=>first.time===second.time?second.sourceIndex-first.sourceIndex:
      first.time>second.time?-1:1);
  }
  function related(authorizedRecords,selected,scope={}) {
    if (!Array.isArray(authorizedRecords) || !authorizedRecords.includes(selected) || !inScope(selected,scope)) return [];
    const selectedLineage=lineage(selected,scope);
    return [...new Set(authorizedRecords)].filter(record=>inScope(record,scope) &&
      (record===selected || selectedLineage && lineage(record,scope)===selectedLineage));
  }
  function collect(authorizedRecords,selected,scope={}) {
    if (!Array.isArray(authorizedRecords) || !authorizedRecords.includes(selected) || !inScope(selected,scope)) return [];
    const selectedLineage=lineage(selected,scope),groups=[],seen=new Set();
    const idCounts=new Map();
    for (const record of authorizedRecords) {
      if (object(record) && scalar(record.id)) idCounts.set(scalar(record.id),(idCounts.get(scalar(record.id)) || 0)+1);
    }
    authorizedRecords.forEach((record,index)=>{
      if (!inScope(record,scope) || seen.has(record)) return;
      seen.add(record);
      const isCurrent=record===selected;
      if (!isCurrent && (!selectedLineage || lineage(record,scope)!==selectedLineage || !completed(record))) return;
      const visits=visitsOf(record),isCompleted=completed(record);
      if (!isCompleted && !visits.length) return;
      const id=scalar(record.id),key=id?'record:'+encodeURIComponent(id)+(idCounts.get(id)>1?':'+index:''):'record-index:'+index;
      groups.push({key,taskId:scalar(record.taskId),
        record,completed:isCompleted,isCurrent,visits,latestTime:visits.length?visits[0].time:-Infinity});
    });
    return groups.sort((first,second)=>{
      if (first.latestTime!==second.latestTime) return first.latestTime>second.latestTime?-1:1;
      if (first.taskId!==second.taskId) return first.taskId<second.taskId?-1:1;
      return first.key<second.key?-1:first.key>second.key?1:0;
    });
  }
  window.DWorkbenchFollowupHistory=Object.freeze({stamp,completed,related,collect});
})();
