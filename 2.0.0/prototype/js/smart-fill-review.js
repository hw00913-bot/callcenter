(() => {
  'use strict';

  const pageId = 'PAGE-21027';
  const statusName = Object.freeze({
    draft:'未提交回访',pending:'待审核',approved:'审核通过',rejected:'审核驳回',
    failed:'未生成建议',superseded:'已被后次填单替代'
  });
  const session = () => window.DSession?.context();
  const identity = c => [c?.account?.id,c?.scope?.id,c?.scope?.tenant?.brandId];
  const sameActor = c => Boolean(c?.scope?.kind==='tenant' && identity(c).every((value,i)=>value && value===identity(session())[i]));
  const scopeMatches = (state,c) => sameActor(c) && state?.tenant===c.scope.id;
  const recordMatches = (row,c) => row.tenantId===c.scope.id && row.brandId===c.scope.tenant.brandId;
  const text = (value,max=120) => typeof value==='string' ? value.trim().slice(0,max) : '';
  const allowedRoles = new Set(['hq_admin','store_admin']);

  function canReview(context=session()) {
    if (!sameActor(context) || !window.DReview21?.allowedScope(context)) return false;
    const role = DSession.roleKey(context);
    return allowedRoles.has(role) || role==='super' &&
      DSession.platformAuthority(context)?.tenantIds?.includes(context.scope.id) === true;
  }

  function canCapture(state,context,record,roundId) {
    if (!scopeMatches(state,context) || window.DApp?.currentPage()!=='PAGE-2202' ||
        !DSession.allowed('PAGE-2202',context) || !DSession.can('F37',context) || !state.records?.includes(record) ||
        !record.id || !record.taskId || !roundId || record.roundId!==roundId ||
        record.tenant!==state.tenant || record.brandId && record.brandId!==context.scope.tenant.brandId ||
        record.ownerId!==state.seatId) return false;
    return state.seats?.some(seat=>seat.id===record.ownerId && seat.accountId===context.account.id &&
      seat.enabled===true && seat.bindingState==='已关联' && seat.tenant===state.tenant &&
      (!seat.brandId || seat.brandId===context.scope.tenant.brandId))===true;
  }

  function scalar(value) {
    if (typeof value==='string') return value.slice(0,2000);
    if (typeof value==='number' && Number.isFinite(value)) return String(value);
    if (Array.isArray(value)) return value.slice(0,40).flatMap(item=>
      typeof item==='string' || typeof item==='number' && Number.isFinite(item) ? [String(item).slice(0,300)] : []);
    return '';
  }

  function saveRows(state,rows,message) {
    const original = state.smartFillReviewRows;
    state.smartFillReviewRows = rows;
    if (window.DReview21.save(state)) return {ok:true};
    if (original===undefined) delete state.smartFillReviewRows;
    else state.smartFillReviewRows = original;
    return {error:window.DReview21.saveFailure(state,message)};
  }

  function retain(state,context,record,{roundId,application,outcome,values,labels,contact} = {}) {
    if (!canCapture(state,context,record,roundId)) return {error:'当前任务或坐席范围已变化，未保留填单记录。'};
    if (!window.DReview21.isLatest(state)) return {error:window.DReview21.saveFailure(state)};
    const keys = Object.keys(values || {}).filter(key=>labels?.has(key)).slice(0,50);
    const suggestions = keys.map(key=>({key,label:text(labels.get(key)),value:scalar(values[key])}))
      .filter(item=> item.value!=='' && (!Array.isArray(item.value) || item.value.length));
    const row = {
      id:window.crypto.randomUUID(),tenantId:state.tenant,brandId:context.scope.tenant.brandId,
      recordId:record.id,taskId:record.taskId,roundId,leadCode:text(record.localLeadCode || record.originalKey),
      customer:text(record.name),phone:text(record.phone,40),category:text(record.category),
      seatId:record.ownerId,seatAccountId:context.account.id,seatName:text(context.account.name),
      applicationId:text(application?.id),applicationName:text(application?.name),
      createdAt:new Date().toISOString(),contact:text(contact),suggestions,
      status:outcome==='available' && suggestions.length ? 'draft' : 'failed',
      outcome:['available','timeout','unavailable'].includes(outcome) ? outcome : 'unavailable'
    };
    return saveRows(state,[row,...(state.smartFillReviewRows || [])],'智能填单记录未保存，建议未填入。');
  }

  // Called before the workbench commits the visit. The caller rolls back this
  // staging together with the visit if the original write does not succeed.
  function stageVisit(state,context,record,visit) {
    if (!canCapture(state,context,record,visit?.roundId) || !visit.visitId ||
        !record.followupHistory?.includes(visit)) return;
    const previous = state.smartFillReviewRows;
    if (!Array.isArray(previous)) return;
    const ids = previous.filter(row=>row.status==='draft' && recordMatches(row,context) &&
      row.recordId===record.id && row.taskId===record.taskId && row.roundId===visit.roundId &&
      row.seatAccountId===context.account.id).map(row=>row.id);
    if (!ids.length) return;
    const active = ids[0];
    const keys = new Set(ids);
    const fields = new Map([['result','回访结果'],['note','回访描述'],['nextAt','下次回访时间'],...(visit.detailFields || [])]);
    const submitted = {result:visit.result,note:visit.note,nextAt:visit.nextAt,...visit.details};
    state.smartFillReviewRows = previous.map(row=>{
      if (!keys.has(row.id)) return row;
      const final = new Set([...row.suggestions.map(value=>value.key),'result','note','nextAt']);
      return {...row,status:row.id===active?'pending':'superseded',visitId:visit.visitId,submittedAt:visit.at,
        ...(row.id===active ? {callId:text(visit.qualityCallId || visit.callId),
          finalFields:[...final].map(key=>({key,label:fields.get(key) || row.suggestions.find(item=>item.key===key)?.label || key,
            value:scalar(Object.hasOwn(submitted,key)?submitted[key]:undefined)}))} : {})};
    });
    return ()=>{state.smartFillReviewRows=previous;};
  }

  function generateSamples(state,context=session()) {
    if (!scopeMatches(state,context) || !canReview(context) || DApp.currentPage()!==pageId) {
      return {error:'当前账号没有此租户的填单审核权限。'};
    }
    if (!window.DReview21.isLatest(state)) return {error:window.DReview21.saveFailure(state)};
    const existing = state.smartFillReviewRows || [];
    if (existing.some(row=>recordMatches(row,context) && row.demo===true)) return {ok:true,count:0};
    const fixtures = [
      ['pending','待考虑','待考虑','B','B','客户想先比较同级车型，下午再沟通。','客户要先比较同级车型，时间由下次沟通确认。',''],
      ['pending','有意向','下次回访','A','B','客户有意向，计划进一步了解。','客户只确认愿意再沟通，暂未明确购车意向。',''],
      ['approved','下次回访','下次回访','B','B','客户希望下周回电。','客户希望下周回电，已约定具体时间。','回访时间和客户意向均已核对。'],
      ['rejected','有意向','待考虑','A','C','客户确认购车意向。','客户仍在对比，未确认购车意向。','录入的建议意向偏高，与坐席核对的结果不一致。']
    ];
    const fields = (result,level,note)=>[
      {key:'result',label:'回访结果',value:result},{key:'intentLevel',label:'意向级别',value:level},
      {key:'note',label:'回访描述',value:note}
    ];
    const now = Date.now();
    const timestamp = minutes=>new Date(now-minutes*60000).toISOString();
    const samples = fixtures.map(([status,aiResult,finalResult,aiLevel,finalLevel,aiNote,finalNote,reviewNote],index)=>{
      const marker = 'DEMO-FILL-'+(index+1);
      const age = index*10+5;
      return {
        id:'fill-review-demo:'+encodeURIComponent(state.tenant)+':'+(index+1),demo:true,
        tenantId:state.tenant,brandId:context.scope.tenant.brandId,
        recordId:marker+'-LEAD',taskId:marker+'-TASK',roundId:marker+'-ROUND-01',visitId:marker+'-VISIT',
        leadCode:marker+'-LEAD',customer:'模拟客户 '+(index+1),phone:'138****000'+(index+1),category:'培育线索（模拟）',
        seatId:'DEMO-SEAT',seatAccountId:'DEMO-SEAT',seatName:'模拟坐席 '+(index%2+1),
        applicationId:'DEMO-FILL',applicationName:'智能填单模拟应用',
        createdAt:timestamp(age),submittedAt:timestamp(age-2),contact:'已接通',outcome:'available',
        suggestions:fields(aiResult,aiLevel,aiNote),finalFields:fields(finalResult,finalLevel,finalNote),status,
        ...(status==='pending' ? {} : {review:{accountId:'DEMO-REVIEWER',name:'模拟审核员',
          at:timestamp(age-3),note:reviewNote}})
      };
    });
    const saved = saveRows(state,[...samples,...existing],'模拟填单记录未保存，请重试。');
    return saved.ok ? {...saved,count:samples.length} : saved;
  }

  function list(state,context=session()) {
    if (!scopeMatches(state,context) || !canReview(context)) return [];
    return (state.smartFillReviewRows || []).filter(row=>recordMatches(row,context));
  }

  function decide(state,context,id,decision,note) {
    if (!scopeMatches(state,context) || !canReview(context) || DApp.currentPage()!==pageId) {
      return {error:'当前账号没有此租户的填单审核权限。'};
    }
    if (!window.DReview21.isLatest(state)) return {error:window.DReview21.saveFailure(state)};
    const rows = state.smartFillReviewRows || [];
    const entry = rows.find(row=>row.id===id && recordMatches(row,context));
    if (!entry || entry.status!=='pending' || !entry.visitId) return {error:'审核状态已变化，请刷新后重新查看。'};
    if (!['approved','rejected'].includes(decision) || typeof note!=='string' || note.trim().length>500 ||
        decision==='rejected' && !note.trim()) return {error:'驳回须填写审核意见，最多 500 字。'};
    const revised = {...entry,status:decision,review:{accountId:context.account.id,name:text(context.account.name),
      at:new Date().toISOString(),note:note.trim()}};
    return saveRows(state,rows.map(row=>row===entry?revised:row),'审核结果未保存，请重试。');
  }

  window.DSmartFillReview = Object.freeze({pageId,statusName,canReview,retain,stageVisit,list,decide,generateSamples});
})();
