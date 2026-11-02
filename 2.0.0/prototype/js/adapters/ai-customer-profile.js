/* Read-only AI call sources for the current customer profile. No source writes. */
(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const text=value=>typeof value==='string'?value.trim():'';
  const id=value=>typeof value==='string'&&value.trim()===value&&value.length>0&&value.length<=200?value:'';
  const brand=value=>{if(value===undefined||value===null||typeof value==='string'&&!value.trim())return '';const result=id(value);if(!result)throw problem('CONTEXT_CHANGED','AI来源品牌标识格式尚未核定。');return result;};
  const fail=(code,message)=>({status:'failed',code,message,data:{rows:[],issues:[]}});
  const problem=(code,message)=>{const error=new Error(message);error.code=code;return error;};
  const phone=value=>{if(typeof value!=='string')return '';let result=value.normalize('NFKC').trim().replace(/[\s()（）\-－]/g,'');if(/^\+86\d{7,13}$/.test(result))result=result.slice(3);else if(/^0086\d{7,13}$/.test(result))result=result.slice(4);return /^(?:1[3-9]\d{9}|0\d{9,11})$/.test(result)?result:'';};
  function access(kind='ANY',opening=false){
    const session=root.parent?.DSession,current=session?.context?.(),owner=root.DNativeContext?.context;
    if(!current||current.scope?.kind!=='tenant'||owner?.scope?.kind!=='tenant'||current.account?.enabled===false||current.scope.tenant?.enabled!==true||current.scope.grant?.enabled===false||current.account?.id!==owner.account?.id||current.scope.id!==owner.scope.id)throw problem('CONTEXT_CHANGED','当前AI来源账号或租户范围已变化。');
    const tenantId=id(current.scope.id),accountId=id(current.account.id),brandId=brand(current.scope.tenant.brandId),enterpriseId=id(current.scope.tenant.enterpriseId),grant=current.scope.grant;
    if(!tenantId||!accountId||!enterpriseId||brand(owner.scope.tenant?.brandId)!==brandId||owner.scope.tenant?.enterpriseId!==enterpriseId)throw problem('CONTEXT_CHANGED','AI来源的品牌或企业归属尚未核定。');
    const superReader=grant.role==='super'&&grant.moduleRoles?.ai==='super'&&session.isGlobalAdministrator?.(current)===true;
    const callsAllowed=session.allowed?.('PAGE-2108')===true,followupsAllowed=session.allowed?.('PAGE-2109')===true;
    if(root.parent?.DApp?.currentPage?.()!==(opening?'PAGE-2109':'PAGE-2203')||!session.allowed?.('PAGE-2203')||!callsAllowed&&!followupsAllowed||kind==='CALL'&&!callsAllowed||kind==='FOLLOWUP'&&!followupsAllowed||current.scope.tenant.modules?.ai!==true||!Array.isArray(grant.modules)||!grant.modules.includes('ai')||!['admin','operator','reader'].includes(grant.moduleRoles?.ai)&&!superReader)throw problem('PROFILE_AI_FORBIDDEN','当前没有本租户客户档案及对应AI来源的读取权限。');
    const role=grant.role,wide=role==='admin'||role==='reader'&&grant.moduleRoles.ai==='reader'||superReader;
    if(!wide&&!['operator','seat'].includes(role))throw problem('PROFILE_AI_FORBIDDEN','当前角色没有AI客户来源读取范围。');
    const aiTenantId=text(root.parent?.DSeed?.aiTenantIds?.[tenantId]);
    return {tenantId,accountId,brandId,enterpriseId,aiTenantId,role,wide,callsAllowed,followupsAllowed,scopeToken:JSON.stringify([accountId,tenantId,brandId,enterpriseId,role,grant.moduleRoles.ai,callsAllowed,followupsAllowed,text(root.DNativeContext?.storagePrefix)])};
  }
  function sourceScope(row,scope){
    const explicitTenant=['integrationTenantId','ownerTenantId','sourceTenantId'].filter(key=>Object.hasOwn(row,key));
    if(explicitTenant.some(key=>row[key]!==scope.tenantId))return false;
    if(Object.hasOwn(row,'tenantId')&&row.tenantId!==scope.tenantId&&(!scope.aiTenantId||String(row.tenantId)!==scope.aiTenantId))return false;
    if(Object.hasOwn(row,'aiTenantId')&&(!scope.aiTenantId||String(row.aiTenantId)!==scope.aiTenantId))return false;
    if(Object.hasOwn(row,'nativeTenantId')&&(!scope.aiTenantId||String(row.nativeTenantId)!==scope.aiTenantId))return false;
    if(Object.hasOwn(row,'brandId')){try{if(brand(row.brandId)!==scope.brandId)return false;}catch(_){return false;}}
    if(Object.hasOwn(row,'enterpriseId')&&String(row.enterpriseId)!==scope.enterpriseId)return false;
    return true;
  }
  function owned(row,scope){
    if(scope.wide)return true;
    if(['accountId','ownerAccountId','ownerId','assignedAccountId','actualAnswerAccountId','actualDialAccountId'].some(key=>id(row[key])===scope.accountId))return true;
    const assignmentId=id(row.assignmentId),assignmentTask=id(row.assignmentTask);
    if(!assignmentId||!assignmentTask)return false;
    const candidates=root.MockAssignedData?.[assignmentTask];
    if(!Array.isArray(candidates))return false;
    const matches=candidates.filter(item=>item?.assignmentId===assignmentId&&String(item.assignmentTask)===assignmentTask&&item.assignmentTenant===scope.tenantId);
    if(matches.length!==1)return false;
    const item=matches[0];return ['ownerId','ownerAccountId','accountId','assignedAccountId'].some(key=>id(item[key])===scope.accountId);
  }
  function sourceIdentity(row){const sessionId=id(row?.sessionId),platform=id(row?.platform);return sessionId&&platform?JSON.stringify([platform,sessionId]):'';}
  function knownTime(value){
    if(typeof value!=='string'||!value.trim())return '';
    const string=value.trim();
    if(root.DListOrder?.parse)return root.DListOrder.parse(string)===null?'':string;
    if(!/^\d{4}-\d\d-\d\d(?:[T ]\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:?\d\d)?)?$/.test(string))return '';
    const day=string.slice(0,10),calendar=new Date(day+'T00:00:00Z');
    return Number.isFinite(calendar.getTime())&&calendar.toISOString().slice(0,10)===day&&Number.isFinite(Date.parse(string))?string:'';
  }
  function duration(row){
    if(typeof row.durationSeconds==='number'&&Number.isFinite(row.durationSeconds)&&row.durationSeconds>=0)return row.durationSeconds;
    const value=text(row.duration);let match;
    if((match=/^(\d+)秒$/.exec(value)))return Number(match[1]);
    if((match=/^(\d+)分(?:(\d+)秒)?$/.exec(value))&&Number(match[2]||0)<60)return Number(match[1])*60+Number(match[2]||0);
    if((match=/^(\d+):([0-5]\d):([0-5]\d)$/.exec(value)))return Number(match[1])*3600+Number(match[2])*60+Number(match[3]);
    if((match=/^(\d+):([0-5]\d)$/.exec(value)))return Number(match[1])*60+Number(match[2]);
    return null;
  }
  const notDialed=new Set(['等待呼叫','待呼叫去重','黑名单过滤','拦截规则','线路拦截','呼叫受限','分机号错误','主叫欠费']);
  const dialResults=new Set(['已接通','秒挂','伪接通','无人接听','占线','拒接']);
  const notAnswered=new Set(['无人接听','占线','拒接','空号','关机','停机','欠费','无法接通','黑名单过滤','拦截规则','等待呼叫','待呼叫去重','分机号错误','呼叫受限','主叫欠费','线路拦截']);
  function facts(row,label){
    const seconds=duration(row),dialAt=knownTime(row.dialedAt)||knownTime(row.actualDialedAt),start=knownTime(row.startTime),ended=knownTime(row.endTime);
    const explicitAnswer=typeof row.answered==='boolean'?row.answered:typeof row.customerConnected==='boolean'?row.customerConnected:null;
    let dialed=typeof row.actualDialed==='boolean'?row.actualDialed:typeof row.dialed==='boolean'?row.dialed:null;
    if(notDialed.has(label))dialed=dialed===true||explicitAnswer===true||dialAt||seconds>0?null:false;
    else if(dialed===null&&(explicitAnswer===true||dialAt||dialResults.has(label)&&start||seconds>0))dialed=true;
    if(dialed===false&&(explicitAnswer===true||dialAt||seconds>0||['已接通','秒挂','伪接通'].includes(label)&&start))dialed=null;
    let answered=explicitAnswer;
    if(answered===null&&['已接通','秒挂'].includes(label))answered=true;
    if(answered===null&&notAnswered.has(label))answered=false;
    if(dialed!==true&&answered===true)answered=null;
    const callAt=dialed===true?(dialAt||start):'';
    return {dialed,actualDialed:dialed,answered,durationSeconds:seconds,callAt,callTimeKnown:!!callAt,occurredAt:start||ended,startedAt:start,endedAt:ended};
  }
  function projection(row,view,scope){
    const sessionId=id(row.sessionId),platform=id(row.platform),normalized=phone(row.phone),rawPhone=typeof row.phone==='string'?row.phone:'';
    const sourceRef={kind:'AI_NATIVE',scopeToken:scope.scopeToken,tenantId:scope.tenantId,enterpriseId:scope.enterpriseId,brandId:scope.brandId,sessionId,platform,phone:rawPhone};
    const resultLabel=text(view.resultLabel)||'未映射',tags=[...new Set([...(Array.isArray(view.tags)?view.tags:[]),...(Array.isArray(view.componentTags)?view.componentTags:[]),view.aiTagName,view.intention].filter(value=>typeof value==='string'&&value.trim()&&value.trim()!=='-').map(value=>value.trim()))];
    return {recordType:'AI_CALL',sourceRef,sourceKey:JSON.stringify(['AI_NATIVE',scope.tenantId,scope.enterpriseId,platform,sessionId]),tenantId:scope.tenantId,enterpriseId:scope.enterpriseId,brandId:scope.brandId,phone:normalized,phonePending:!normalized,customerName:text(row.customerName)||text(row.name),callId:id(row.callId)||id(row.callid)||sessionId,taskId:id(row.taskId)||id(row.taskUuid),sceneId:id(row.sceneId)||id(row.sceneCode),sceneName:text(row.sceneName),supplier:platform,platform,sourceLabel:'AI外呼 · 原通话记录',sourceScopeKind:Object.hasOwn(row,'tenantId')||Object.hasOwn(row,'integrationTenantId')?'EXPLICIT_SCOPE':'BOUND_LOCAL_FIXTURE',method:'AI',resultLabel,statusLabel:resultLabel,summary:typeof view.summary==='string'&&view.summary!=='-'?view.summary:'',tags,readOnly:true,...facts(view.factSource||row,resultLabel)};
  }
  function fromNativeRows(rows,nativeProjection){
    try{
      const scope=access('CALL'),all=root.MockCallRecordRows;
      if(!Array.isArray(rows)||!Array.isArray(all)||typeof nativeProjection!=='function'||rows.some(row=>!row||typeof row!=='object'||!all.includes(row)))throw problem('PROFILE_AI_SOURCE','AI原通话来源身份尚未核定。');
      const counts=new Map();for(const row of rows){const key=sourceIdentity(row);if(key)counts.set(key,(counts.get(key)||0)+1);}
      const output=[],issues=[];
      for(const row of rows){
        if(!sourceScope(row,scope)||!owned(row,scope))continue;
        const key=sourceIdentity(row);
        if(!key){issues.push({code:'AI_SOURCE_ID_UNKNOWN',message:'部分AI原通话缺少稳定来源身份，未猜测归集。'});continue;}
        if(counts.get(key)!==1){issues.push({code:'AI_SOURCE_ID_CONFLICT',message:'部分AI来源通话身份重复，需核对原记录。'});continue;}
        if(typeof row.phone!=='string'){issues.push({code:'AI_SOURCE_PHONE_SCHEMA',message:'部分AI通话的原号码格式待核，未猜测归集。'});continue;}
        const view=nativeProjection(row);if(!view||typeof view!=='object')throw problem('PROFILE_AI_SOURCE','AI通话状态或结果暂时无法核定。');
        if(view.scopeEvidence&&(!sourceScope(view.scopeEvidence,scope))){issues.push({code:'AI_SOURCE_DETAIL_SCOPE',message:'部分AI已取详情的归属与原通话不一致，未归集其结果。'});continue;}
        if(view.detailIdentity&&(view.detailIdentity.callid!==row.callid||view.detailIdentity.recordid!==row.callid||view.detailIdentity.phone!==row.phone)){issues.push({code:'AI_SOURCE_DETAIL_IDENTITY',message:'部分AI已取详情与原通话身份或号码不一致，未猜测关联。'});continue;}
        const item=projection(row,view,scope);if(item.phonePending)issues.push({code:'AI_SOURCE_PHONE_UNKNOWN',sourceRef:clone(item.sourceRef),message:'部分AI通话号码不完整，保留来源记录，未猜测合并客户。'});output.push(item);
      }
      const current=access('CALL');if(current.scopeToken!==scope.scopeToken||root.MockCallRecordRows!==all||output.some(item=>{const original=rows.find(row=>sourceIdentity(row)===JSON.stringify([item.platform,item.sourceRef.sessionId]));return !original||!sourceScope(original,current)||!owned(original,current);}))throw problem('CONTEXT_CHANGED','读取期间AI来源账号、租户或数据范围已变化。');
      return {status:'success',scopeToken:scope.scopeToken,data:{authorized:true,dataScope:scope.wide?'TENANT':'OWNED',scopeLabel:scope.wide?'当前租户有权AI记录':'仅原来源有明确本人归属的AI记录',rows:clone(output),issues:clone(issues)}};
    }catch(error){return fail(error.code||'PROFILE_AI_SOURCE',error.message||'AI原通话来源暂时无法读取。');}
  }
  const meaningful=value=>text(value)&&!['-','—'].includes(text(value))?text(value):'';
  function followupIdentity(row){return typeof row?.phone==='string'&&row.phone.length>0&&id(row.platform)?JSON.stringify([row.platform,row.phone]):'';}
  function followupProjection(row,scope,issues){
    const rawPhone=row.phone,platform=id(row.platform),normalized=phone(rawPhone),lastAt=knownTime(row.lastVisitTime),summary=meaningful(row.lastRecord),intention=meaningful(row.intention);
    const detailTags=row.detailTags&&typeof row.detailTags==='object'&&!Array.isArray(row.detailTags)?Object.entries(row.detailTags).filter(([key,value])=>!/url|uri|recording|audio|voice|录音|播放/i.test(key)&&typeof value==='string').map(([label,value])=>({label,value})):[];
    const visits=[];
    if(Array.isArray(row.visits))for(let index=0;index<row.visits.length;index++){
      const item=row.visits[index];if(!item||typeof item!=='object'||Array.isArray(item)){issues.push({code:'AI_FOLLOWUP_DETAIL_SCHEMA',message:'部分原AI回访明细格式待核，未生成替代明细。'});continue;}
      visits.push({followupAt:knownTime(item.time)||knownTime(item.followupAt),time:knownTime(item.time)||knownTime(item.followupAt),summary:meaningful(item.record)||meaningful(item.summary),record:meaningful(item.record)||meaningful(item.summary),resultLabel:meaningful(item.status),status:meaningful(item.status),intention:meaningful(item.intention),actorName:meaningful(item.actorName)||meaningful(item.actualAccountName),sourceVisitIndex:index,readOnly:true});
    }
    else if(Object.hasOwn(row,'visits')&&row.visits!==undefined&&row.visits!==null)issues.push({code:'AI_FOLLOWUP_DETAIL_SCHEMA',message:'部分原AI回访明细结构待核，未按统计次数补造明细。'});
    const latestFollowup=lastAt&&summary?{followupAt:lastAt,time:lastAt,summary,record:summary,resultLabel:meaningful(row.lastCallStatus),status:meaningful(row.lastCallStatus),intention,actorName:meaningful(row.lastActorName)||meaningful(row.actorName),summaryOnly:true,readOnly:true}:null;
    const times=visits.map(item=>item.followupAt).filter(Boolean),actualAt=lastAt||times.sort((a,b)=>(root.DListOrder?.parse?.(b)??Date.parse(b))-(root.DListOrder?.parse?.(a)??Date.parse(a)))[0]||'';
    const fields={phone:rawPhone,platform,customerName:text(row.customerName)||text(row.name),taskId:id(row.taskId)||id(row.taskUuid),sceneId:id(row.sceneId)||id(row.sceneCode),sceneName:text(row.sceneName),resultLabel:meaningful(row.lastCallStatus)||'未记录',summary,intention,detailTags,visits,latestFollowup,reportedVisitCount:Number.isSafeInteger(row.visitCount)&&row.visitCount>=0?row.visitCount:null,relatedCallId:id(row.callid)||id(row.sessionId),sourceRowId:id(row.id)||id(row.recordId),followupAt:actualAt};
    const sourceRef={kind:'AI_FOLLOWUP',scopeToken:scope.scopeToken,tenantId:scope.tenantId,enterpriseId:scope.enterpriseId,brandId:scope.brandId,platform,phone:rawPhone,rowFingerprint:JSON.stringify(fields)};
    return {...fields,recordType:'AI_FOLLOWUP',kind:'AI_FOLLOWUP',method:'AI',sourceRef,sourceKey:JSON.stringify(['AI_FOLLOWUP',scope.tenantId,scope.enterpriseId,platform,rawPhone]),tenantId:scope.tenantId,enterpriseId:scope.enterpriseId,brandId:scope.brandId,phone:normalized,phonePending:!normalized,supplier:platform,sourceLabel:'AI外呼 · 原回访资料',sourceScopeKind:Object.hasOwn(row,'tenantId')||Object.hasOwn(row,'integrationTenantId')?'EXPLICIT_SCOPE':'BOUND_LOCAL_FIXTURE',statusLabel:fields.resultLabel,tags:[intention,...detailTags.map(item=>item.label+'：'+item.value)].filter(Boolean),occurredAt:actualAt,callAt:'',callTimeKnown:false,dialed:null,actualDialed:null,answered:null,durationSeconds:null,readOnly:true,formalArchive:false};
  }
  function fromNativeFollowups(rows,opening=false){
    try{
      const scope=access('FOLLOWUP',opening),all=root.MockClueRecordRows;
      if(!Array.isArray(rows)||!Array.isArray(all)||rows.some(row=>!row||typeof row!=='object'||!all.includes(row)))throw problem('PROFILE_AI_SOURCE','原AI回访来源身份尚未核定。');
      const counts=new Map();for(const row of rows){const key=followupIdentity(row);if(key)counts.set(key,(counts.get(key)||0)+1);}
      const output=[],issues=[];
      for(const row of rows){
        if(!sourceScope(row,scope)||!owned(row,scope))continue;
        const key=followupIdentity(row);
        if(!key){issues.push({code:'AI_FOLLOWUP_ID_UNKNOWN',message:'部分原AI回访缺少准确来源定位字段，未猜测归集。'});continue;}
        if(counts.get(key)!==1){issues.push({code:'AI_FOLLOWUP_ID_CONFLICT',message:'部分原AI回访定位重复，需核对原记录。'});continue;}
        const item=followupProjection(row,scope,issues);if(item.phonePending)issues.push({code:'AI_FOLLOWUP_PHONE_UNKNOWN',sourceRef:clone(item.sourceRef),message:'部分原AI回访号码不完整，保留来源，未借通话标识补全或合并客户。'});output.push(item);
      }
      const current=access('FOLLOWUP',opening);if(current.scopeToken!==scope.scopeToken||root.MockClueRecordRows!==all||output.some(item=>{const original=rows.find(row=>followupIdentity(row)===JSON.stringify([item.platform,item.sourceRef.phone]));return !original||!sourceScope(original,current)||!owned(original,current);}))throw problem('CONTEXT_CHANGED','读取期间AI回访来源范围已变化。');
      return {status:'success',scopeToken:scope.scopeToken,data:{authorized:true,dataScope:scope.wide?'TENANT':'OWNED',scopeLabel:scope.wide?'当前租户有权AI记录':'仅原来源有明确本人归属的AI记录',rows:clone(output),issues:clone(issues)}};
    }catch(error){return fail(error.code||'PROFILE_AI_SOURCE',error.message||'原AI回访来源暂时无法读取。');}
  }
  function sourceRead(kind){const method=kind==='FOLLOWUP'?root.Pages?.['result-clue']?.integrationProfileFollowups:root.Pages?.['result-records']?.integrationProfileRows;return typeof method==='function'?method():fail('PROFILE_AI_UNAVAILABLE',kind==='FOLLOWUP'?'原AI回访读取接口尚未就绪。':'原AI通话读取接口尚未就绪。');}
  function read(){
    try{
      const scope=access(),rows=[],issues=[],sourceStates={};
      for(const [kind,allowed] of [['CALL',scope.callsAllowed],['FOLLOWUP',scope.followupsAllowed]]){
        if(!allowed){sourceStates[kind]={authorized:false,status:'unavailable'};continue;}
        const result=sourceRead(kind);if(result.status!=='success')return result;
        if(result.scopeToken!==scope.scopeToken)throw problem('CONTEXT_CHANGED','AI来源账号、租户或权限已变化。');
        rows.push(...result.data.rows);issues.push(...result.data.issues);sourceStates[kind]={authorized:true,status:'success'};
      }
      if(access().scopeToken!==scope.scopeToken)throw problem('CONTEXT_CHANGED','AI来源读取期间使用范围已变化。');
      return {status:'success',scopeToken:scope.scopeToken,data:{authorized:true,dataScope:scope.wide?'TENANT':'OWNED',scopeLabel:scope.wide?'当前租户有权AI记录':'仅原来源有明确本人归属的AI记录',rows,issues,sourceStates}};
    }catch(error){return fail(error.code||'PROFILE_AI_SOURCE',error.message||'AI原来源暂时无法读取。');}
  }
  function referenceScope(ref,scope,kind){return ref&&typeof ref==='object'&&ref.kind===kind&&ref.scopeToken===scope.scopeToken&&ref.tenantId===scope.tenantId&&ref.enterpriseId===scope.enterpriseId&&ref.brandId===scope.brandId&&id(ref.platform)&&typeof ref.phone==='string';}
  function resolve(ref){
    try{
      const followup=ref?.kind==='AI_FOLLOWUP',scope=access(followup?'FOLLOWUP':'CALL');if(!referenceScope(ref,scope,followup?'AI_FOLLOWUP':'AI_NATIVE')||!followup&&!id(ref.sessionId)||followup&&typeof ref.rowFingerprint!=='string')throw problem('PROFILE_AI_REFERENCE','AI来源引用或当前使用范围已变化，请刷新档案。');
      const result=sourceRead(followup?'FOLLOWUP':'CALL');if(result.status!=='success')return result;
      const matches=result.data.rows.filter(row=>row.platform===ref.platform&&row.sourceRef.phone===ref.phone&&(followup?row.sourceRef.rowFingerprint===ref.rowFingerprint:row.sourceRef.sessionId===ref.sessionId));
      if(matches.length!==1)throw problem('PROFILE_AI_REFERENCE','原AI记录已变化、无权查看或无法唯一定位。');
      if(access(followup?'FOLLOWUP':'CALL').scopeToken!==scope.scopeToken)throw problem('CONTEXT_CHANGED','当前AI来源范围已变化。');
      return {status:'success',scopeToken:scope.scopeToken,data:{nativeReference:followup?{pageId:'PAGE-2109',sourceCustomerProfileRef:clone(matches[0].sourceRef)}:{id:ref.sessionId,platform:ref.platform},sourceRef:clone(matches[0].sourceRef)}};
    }catch(error){return fail(error.code||'PROFILE_AI_REFERENCE',error.message||'原AI记录暂时无法准确定位。');}
  }
  const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  function openFollowupFromNative(rows,ref){
    try{
      const scope=access('FOLLOWUP',true);if(!referenceScope(ref,scope,'AI_FOLLOWUP')||typeof ref.rowFingerprint!=='string')throw problem('PROFILE_AI_REFERENCE','原AI回访引用或使用范围已变化，请刷新后查看。');
      const result=fromNativeFollowups(rows,true);if(result.status!=='success')return result;
      const matches=result.data.rows.filter(item=>item.platform===ref.platform&&item.sourceRef.phone===ref.phone&&item.sourceRef.rowFingerprint===ref.rowFingerprint);
      if(matches.length!==1)throw problem('PROFILE_AI_REFERENCE','原AI回访已变化或无法唯一定位，未打开其他记录。');
      const item=matches[0],entries=item.visits.length?item.visits:item.latestFollowup?[item.latestFollowup]:[],detail=entries.length?'<table class="record-table"><thead><tr><th>原回访时间</th><th>原状态</th><th>回访内容</th><th>意向</th><th>原办理人</th></tr></thead><tbody>'+entries.map(visit=>'<tr><td>'+esc(visit.followupAt||'未记录')+'</td><td>'+esc(visit.resultLabel||'未记录')+'</td><td>'+esc(visit.summary||'未记录')+'</td><td>'+esc(visit.intention||'未记录')+'</td><td>'+esc(visit.actorName||'未记录')+'</td></tr>').join('')+'</tbody></table>':'<p>原来源未提供可核验的回访内容或时间，未补造明细。</p>';
      const markup='<div class="record-detail-backdrop open" id="clueDetailBackdrop" onclick="window.Pages[\'result-clue\'].closeModal(event)" style="display:flex;align-items:center;justify-content:center;"><div class="billing-detail-modal" style="width:900px;max-width:92vw;max-height:90vh;overflow:auto;background:#fff;border-radius:8px;padding:24px;" onclick="event.stopPropagation()"><div class="billing-detail-header" style="display:flex;justify-content:space-between;align-items:center;"><h2>原AI回访资料</h2><button type="button" aria-label="关闭原AI回访资料" onclick="window.Pages[\'result-clue\'].closeModal()">×</button></div><p>'+esc(item.platform)+' · '+esc(ref.phone)+' · '+esc(item.sceneName||'未记录场景')+'</p><p>只读保留原回访内容，不代表本系统业务归档或新的实际拨打。'+(item.latestFollowup?.summaryOnly&&!item.visits.length?'本来源仅提供最近一次摘要，未按汇总次数生成明细。':'')+'</p>'+detail+'<p>原平台汇总次数：'+esc(item.reportedVisitCount===null?'未记录':item.reportedVisitCount)+'；该汇总不等于本档案可核验明细数。</p></div></div>';
      if(access('FOLLOWUP',true).scopeToken!==scope.scopeToken)throw problem('CONTEXT_CHANGED','打开期间AI回访范围已变化。');
      root.document.getElementById('clueDetailBackdrop')?.remove();root.document.body.insertAdjacentHTML('beforeend',markup);root.document.body.style.overflow='hidden';return {status:'success',scopeToken:scope.scopeToken,data:{opened:true}};
    }catch(error){return fail(error.code||'PROFILE_AI_REFERENCE',error.message||'原AI回访暂时无法准确定位。');}
  }
  function openOriginal(ref){try{access('FOLLOWUP',true);const method=root.Pages?.['result-clue']?.integrationOpenProfileFollowup;if(typeof method!=='function')return fail('PROFILE_AI_UNAVAILABLE','原AI回访详情接口尚未就绪。');const result=method(ref);if(result.status!=='success')root.showToast?.(result.message,'warning');return result;}catch(error){return fail(error.code||'PROFILE_AI_REFERENCE',error.message||'原AI回访暂时无法准确定位。');}}
  root.DCustomerProfileAI=Object.freeze({read,resolve,fromNativeRows,fromNativeFollowups,openOriginal,openFollowupFromNative});
})(window);
