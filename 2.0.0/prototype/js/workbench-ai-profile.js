/* Read only the task's explicit saved AI results. The caller supplies authorized
 * tasks and local calls; no native AI directory or static profile is consulted. */
(() => {
  'use strict';
  const object=value=>Boolean(value && typeof value==='object' && !Array.isArray(value));
  const scalar=value=>typeof value==='string'?value.trim():typeof value==='number'&&Number.isFinite(value)?String(value):'';
  const mode=value=>scalar(value).replace(/\s+/g,'').toLowerCase();
  const aiModes=new Set(['ai','ai外呼','ai_outbound','aioutbound']);
  const nonAIModes=new Set(['人工外呼','人工','manual','manual_outbound','预外呼','predictive','predictive_outbound','企微培育','企微','wecom']);
  const statusTags=new Set(['已接通','正常接通','接通','未接听','未接通','无人接听','拒接','客户拒绝','占线','用户忙',
    '通话中','呼叫中','关机','停机','空号','错号','呼叫失败','呼叫成功','呼叫结束','已挂断',
    'connected','notconnected','noanswer','busy']);
  const excludedSources=new Set(['ai_followup','ai-followup','通话分析','callanalysis','call_analysis',
    '评级','线索评级','leadrating','lead_rating','rating','import','导入','initial_import']);
  const modes=(row,keys)=>keys.map(key=>mode(row?.[key])).filter(Boolean);
  const isAI=(row,keys)=>{const values=modes(row,keys);return values.some(value=>aiModes.has(value)) && !values.some(value=>nonAIModes.has(value));};
  const isNonAI=(row,keys)=>modes(row,keys).some(value=>nonAIModes.has(value));
  const foreignSource=row=>['sourceType','sourceKind','kind','source'].some(key=>excludedSources.has(mode(row?.[key])));
  const saved=row=>object(row) && row.draft!==true && row.isDraft!==true && row.saved!==false && row.saveFailed!==true &&
    !['draft','草稿','保存失败','save_failed'].includes(row.status) && !foreignSource(row);

  function inScope(row,scope,explicit=false) {
    if (!object(row)) return false;
    const tenant=scalar(scope.tenantId),brand=scalar(scope.brandId);
    if (!tenant) return false;
    const tenants=[row.tenant,row.tenantId,row.scope?.tenantId,
      row.scope?.kind==='tenant'?row.scope.id:null].map(scalar).filter(Boolean);
    const brands=[row.brandId,row.scope?.brandId,row.scope?.tenant?.brandId].map(scalar).filter(Boolean);
    const enterprises=[row.enterpriseId,row.scope?.enterpriseId].map(scalar).filter(Boolean);
    return !tenants.some(value=>value!==tenant) && (!brand || !brands.some(value=>value!==brand)) &&
      (!scalar(scope.enterpriseId) || !enterprises.some(value=>value!==scalar(scope.enterpriseId))) &&
      (!explicit || tenants.length>0 && (!brand || brands.length>0));
  }
  function timestamp(row,keys,stamp) {
    for (const key of keys) {
      const raw=row?.[key];
      const time=key==='endedMs' && typeof raw==='number' && Number.isFinite(raw) && raw>0 ? raw : stamp(raw);
      if (Number.isFinite(time)) return {time,timeText:typeof raw==='string'?raw.trim():new Date(time).toISOString()};
    }
    return null;
  }
  const empty=value=>value==null || typeof value==='string' && !value.trim();
  const valueText=value=>typeof value==='string'?value.trim():typeof value==='boolean'?String(value):
    typeof value==='number'&&Number.isFinite(value)?String(value):'';
  function tagValues(value) {
    if (empty(value)) return [];
    if (Array.isArray(value)) return value.flatMap(tagValues);
    if (!object(value)) {const label=valueText(value);return label?[label]:[];}
    const label=['name','label','tagName'].map(key=>valueText(value[key])).find(Boolean);
    if (label) {
      if (!Object.hasOwn(value,'value')) return [label];
      return tagValues(value.value).map(item=>item===label?label:label+'：'+item);
    }
    return Object.entries(value).flatMap(([key,item])=>{
      const name=key.trim();
      return name?tagValues(item).map(label=>label===name?name:name+'：'+label):[];
    });
  }
  function pureStatus(label) {
    if (statusTags.has(mode(label))) return true;
    const parts=label.split(/[:：]/).map(value=>value.trim());
    return parts.length===2 &&
      (['通话状态','接触状态','接通状态','呼叫状态','呼叫结果','通话结果'].includes(parts[0]) && statusTags.has(mode(parts[1])) ||
        statusTags.has(mode(parts[0])) && ['true','false','0','1'].includes(parts[1]));
  }
  function tags(row,round=false) {
    if (['tagCallMode','tagMethod'].some(key=>scalar(row[key]) && !aiModes.has(mode(row[key])))) return [];
    if (round) return [...new Set(tagValues(row.callTags).filter(label=>!pureStatus(label)))];
    const dedicated=['profileTags','customerProfileTags','portraitTags','aiTags'].find(key=>Object.hasOwn(row,key) && row[key]!=null);
    const values=dedicated?tagValues(row[dedicated]):tagValues([row.tags,row.labels]).filter(label=>!pureStatus(label));
    return [...new Set(values)];
  }
  function numberOf(row) {
    const value=row?.roundNumber ?? row?.number;
    return typeof value==='number'&&Number.isFinite(value)?value:scalar(value) || null;
  }
  function collect(authorizedRecords,selected,scope={}) {
    const history=window.DWorkbenchFollowupHistory;
    if (typeof history?.related!=='function' || typeof history?.stamp!=='function') return [];
    const records=history.related(authorizedRecords,selected,scope),stamp=history.stamp;
    const calls=Array.isArray(scope.calls)?scope.calls:[];
    const groups=[];
    records.filter(record=>inScope(record,scope)).forEach(record=>{
      const taskId=scalar(record.taskId),visits=Array.isArray(record.followupHistory)?record.followupHistory:[];
      const rounds=[...(Array.isArray(record.skynet?.completedRounds)?record.skynet.completedRounds:[]),record.skynet?.lastRound]
        .filter(row=>saved(row) && inScope(row,scope) && scalar(row.roundId) &&
          (!scalar(row.taskId) || scalar(row.taskId)===taskId));
      const taskVisits=visits.filter(row=>saved(row) && inScope(row,scope) && scalar(row.roundId) &&
        (!scalar(row.taskId) || scalar(row.taskId)===taskId));
      const taskCalls=calls.filter(row=>saved(row) && inScope(row,scope,true) && taskId &&
        scalar(row.taskId)===taskId && scalar(row.roundId));
      const conflicting=new Set([...taskVisits.filter(row=>isNonAI(row,['callMode','callType'])),
        ...taskCalls.filter(row=>isNonAI(row,['callType','callMode','method','mode']))].map(row=>scalar(row.roundId)));
      const roundNumber=(row,roundId)=>numberOf(row) ?? numberOf(taskVisits.find(item=>scalar(item.roundId)===roundId)) ??
        numberOf(rounds.find(item=>scalar(item.roundId)===roundId));
      const callsById=new Map();
      taskCalls.forEach((call,index)=>{
        if (!isAI(call,['callType','callMode','method','mode']) || !scalar(call.callId || call.id) || call.ended===false ||
            ['requested','active','calling','通话中','呼叫中'].includes(call.status)) return;
        const time=timestamp(call,['endedAt','endTime','finishedAt','endAt','endedMs'],stamp);
        if (!time) return;
        const roundId=scalar(call.roundId),callId=scalar(call.callId || call.id),key=JSON.stringify([roundId,callId]);
        const entry={roundId,roundNumber:roundNumber(call,roundId),callId,...time,source:'call',tags:tags(call),index};
        const previous=callsById.get(key);
        if (!previous || entry.time>previous.time || entry.time===previous.time && index>previous.index) callsById.set(key,entry);
      });
      const entries=[...callsById.values()],callRounds=new Set(entries.map(entry=>entry.roundId)),visitRounds=new Set(),visitsById=new Map();
      taskVisits.forEach((visit,index)=>{
        const roundId=scalar(visit.roundId);
        if (callRounds.has(roundId) || !isAI(visit,['callMode','callType'])) return;
        const time=timestamp(visit,['at','date'],stamp);
        if (!time) return;
        const callId=scalar(visit.callId || visit.cdrId || visit.callRecordId || visit.qualityCallId);
        const key=JSON.stringify([roundId,callId || scalar(visit.visitId || visit.id) || 'index:'+index]);
        const entry={roundId,roundNumber:roundNumber(visit,roundId),callId,...time,source:'visit',tags:tags(visit),index};
        const previous=visitsById.get(key);
        if (!previous || entry.time>previous.time || entry.time===previous.time && index>previous.index) visitsById.set(key,entry);
      });
      for (const entry of visitsById.values()) {entries.push(entry);visitRounds.add(entry.roundId);}
      const roundById=new Map();
      rounds.forEach((round,index)=>{
        const roundId=scalar(round.roundId),time=timestamp(round,['at'],stamp);
        if (!time) return;
        const previous=roundById.get(roundId);
        if (!previous || time.time>previous.time || time.time===previous.time && index>previous.index) {
          roundById.set(roundId,{round,...time,index});
        }
      });
      for (const [roundId,item] of roundById) {
        if (callRounds.has(roundId) || visitRounds.has(roundId) || conflicting.has(roundId) || !isAI(item.round,['callMethod'])) continue;
        entries.push({roundId,roundNumber:numberOf(item.round),callId:'',time:item.time,timeText:item.timeText,
          source:'round',tags:tags(item.round,true),index:item.index});
      }
      if (!entries.length) return;
      entries.sort((first,second)=>first.time!==second.time?first.time>second.time?-1:1:
        first.roundId!==second.roundId?first.roundId<second.roundId?-1:1:
        first.callId!==second.callId?first.callId<second.callId?-1:1:second.index-first.index);
      groups.push({taskId,record,entries:entries.map(({index,...entry})=>entry),latestTime:entries[0].time});
    });
    return groups.sort((first,second)=>first.latestTime!==second.latestTime?first.latestTime>second.latestTime?-1:1:
      first.taskId!==second.taskId?first.taskId<second.taskId?-1:1:
      scalar(first.record.id)<scalar(second.record.id)?-1:scalar(first.record.id)>scalar(second.record.id)?1:0);
  }
  window.DWorkbenchAIProfile=Object.freeze({collect});
})();
