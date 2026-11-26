(() => {
  'use strict';

  const fixture = window.DQualityInspectionFixture;
  delete window.DQualityInspectionFixture;
  const prefix = 'd-contact-cloud-v210-review:quality-inspection-v1:';
  const statuses = {pending:'待审核',reviewing:'审核中',approved:'申诉通过',rejected:'申诉驳回',partial:'部分通过'};
  const adminRoles = new Set(['hq_admin','store_admin']);
  const seatRoles = new Set(['hq_ops','store_ops']);
  const copy = value => structuredClone(value);
  const fail = error => ({ok:false,error});
  const allowedText = value => typeof value==='string' && value.trim().length>0 && value.trim().length<=500;
  const timestamp = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value);
  const round = value => Math.round(value*100)/100;
  const recordKey = record => record.accountId+'|'+(record.leadCode || record.taskId || record.id);
  const identity = context => [context?.account?.id,context?.scope?.id,context?.scope?.tenant?.brandId];
  const dateTime = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',
    day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const now = () => dateTime.format(new Date());

  function access(requested = window.DSession?.context()) {
    const session = window.DSession;
    const current = session?.context();
    if (!current || current.scope?.kind!=='tenant' || requested?.scope?.kind!=='tenant' ||
        !current.scope.tenant || current.scope.tenant.enabled===false) return null;
    const [accountId,tenantId,brandId] = identity(current);
    const expected = identity(requested);
    if (![accountId,tenantId,brandId].every((value,index)=>value&&value===expected[index])) return null;
    const key = session.roleKey(current);
    const canReview = adminRoles.has(key);
    if (key==='super' && !session.isGlobalAdministrator?.(current)) return null;
    const manager = key==='super' || canReview;
    const canAppeal = seatRoles.has(key) && session.boundSeat(current)===true;
    if (!manager && !canAppeal) return null;
    return {role:manager?'manager':'seat',tenantId,tenantName:current.scope.tenant.name || current.scope.label,brandId,
      accountId,accountName:current.account.name,canAppeal,canReview,canVerifyTags:canReview};
  }

  function decisionsMatch(decisions,itemIds) {
    return Array.isArray(decisions) && decisions.length===itemIds.length &&
      new Set(decisions.map(item=>item?.itemId)).size===decisions.length &&
      decisions.every(item=>itemIds.includes(item?.itemId)&&typeof item.approve==='boolean');
  }

  function validAppeal(appeal, record) {
    if (!record || typeof appeal.id!=='string' || appeal.submittedByAccountId!==record.accountId ||
        !allowedText(appeal.reason) || !timestamp(appeal.submittedAt) ||
        !Array.isArray(appeal.itemIds) || !appeal.itemIds.length ||
        new Set(appeal.itemIds).size!==appeal.itemIds.length || !Array.isArray(appeal.decisions)) return false;
    const possible = new Set([...record.items,...record.redLines].filter(item=>item.appealable).map(item=>item.id));
    if (!appeal.itemIds.every(id=>possible.has(id))) return false;
    const validFinal = review => allowedText(review?.reply) && timestamp(review.repliedAt) &&
      decisionsMatch(review.decisions,appeal.itemIds);
    if (appeal.decisions.length && !validFinal(appeal)) return false;
    const draft = appeal.reviewDraft;
    if (draft && (!allowedText(draft.reply) || !timestamp(draft.submittedAt) ||
        !draft.submittedByAccountId || typeof draft.token!=='string' || !decisionsMatch(draft.decisions,appeal.itemIds))) return false;
    return appeal.reviewHistory===undefined || (Array.isArray(appeal.reviewHistory) &&
      appeal.reviewHistory.every(validFinal));
  }

  function load(scope) {
    const samples = fixture.records(scope.tenantId,scope.brandId);
    const key = prefix+encodeURIComponent(scope.brandId)+':'+encodeURIComponent(scope.tenantId);
    try {
      const original = localStorage.getItem(key);
      const data = original===null
        ? {version:1,revision:0,appeals:fixture.seededAppeals(samples),tagReviews:{},scheduledRecords:[]}
        : JSON.parse(original);
      const scheduled = data?.scheduledRecords ?? [];
      if (!Array.isArray(scheduled) || !scheduled.every(row=>validScheduledRecord(row,scope))) {
        return fail('定时质检记录无法读取，请刷新后重新核对。');
      }
      const records = [...samples,...scheduled];
      const byId = new Map(records.map(record=>[record.id,record]));
      const taskKeys = new Set(records.map(recordKey));
      if (data?.version!==1 || !Number.isSafeInteger(data.revision) || data.revision<0 ||
          byId.size!==records.length ||
          !Array.isArray(data.appeals) || !data.tagReviews || typeof data.tagReviews!=='object' || Array.isArray(data.tagReviews) ||
          new Set(data.appeals.map(appeal=>appeal.id)).size!==data.appeals.length ||
          !data.appeals.every(appeal=>validAppeal(appeal,byId.get(appeal.recordId))) ||
          Object.entries(data.tagReviews).some(([ref,review])=>!taskKeys.has(ref) || typeof review?.passed!=='boolean' ||
            !allowedText(review.reason) || !timestamp(review.reviewedAt))) {
        return fail('质检记录无法读取，请刷新后重新核对。');
      }
      return {ok:true,records,byId,data,original,key};
    } catch (_) {
      return fail('质检记录无法读取，请刷新后重新核对。');
    }
  }

  function save(entry, data, scope) {
    try {
      const current = access();
      if (!current || current.accountId!==scope.accountId || current.tenantId!==scope.tenantId ||
          current.brandId!==scope.brandId || localStorage.getItem(entry.key)!==entry.original) {
        return fail('质检记录或当前账号范围已变化，请刷新后重试。');
      }
      const stored = JSON.stringify({...data,revision:data.revision+1});
      localStorage.setItem(entry.key,stored);
      return {ok:true};
    } catch (_) {
      return fail('本地质检记录保存失败，请保留填写内容并重试。');
    }
  }

  const canSee = (scope,record) => Boolean(record && (scope.role==='manager' || record.accountId===scope.accountId));

  function resolution(appeal) {
    if (!appeal.decisions.length) return 'pending';
    const approved = appeal.decisions.filter(item=>item.approve).length;
    return approved===appeal.decisions.length?'approved':approved?'partial':'rejected';
  }
  const status = appeal => appeal.reviewDraft ? 'reviewing' : resolution(appeal);

  function projectRecord(record, data, scope) {
    const issues = new Map();
    for (const appeal of data.appeals) {
      if (appeal.recordId!==record.id) continue;
      for (const itemId of appeal.itemIds) {
        const decision = appeal.decisions.find(item=>item.itemId===itemId);
        issues.set(itemId,{id:appeal.id,status:decision?(decision.approve?'approved':'rejected'):'pending'});
      }
    }
    function projectItem(item) {
      const issue = issues.get(item.id);
      const restored = issue?.status==='approved';
      return {...item,originalScore:item.score,score:restored?item.maxScore:item.score,passed:restored||item.passed,
        appealable:scope.canAppeal && item.appealable && !issue,appealId:issue?.id || '',
        appealStatus:issue?.status || '',appealStatusLabel:issue?statuses[issue.status]:''};
    }
    const items = record.items.map(projectItem);
    const redLines = record.redLines.map(projectItem);
    const itemMap = new Map(items.map(item=>[item.id,item]));
    const dimensions = (record.rubric || fixture.rubric()).map(dimension=>{
      const groups = dimension.groups.map(group=>({...group,items:group.items.map(item=>itemMap.get(item.id)).filter(Boolean)}));
      const weighted = groups.flatMap(group=>group.items).reduce((value,item)=>value+item.score,0);
      return {...dimension,groups,weightedScore:record.inspected?round(weighted):null,
        score:record.inspected && dimension.weight>0?round(weighted/dimension.weight*100):null};
    });
    const activeRedLines = redLines.filter(item=>!item.passed);
    const totalDeduction = category => round(activeRedLines.filter(item=>item.category===category)
      .reduce((sum,item)=>sum+(Number(item.deduction) || 0),0));
    const sensitiveDeduction = totalDeduction('sensitive-word');
    const knowledgeDeduction = totalDeduction('knowledge');
    const redLine = activeRedLines.some(item=>item.category==='red-line');
    const violation = activeRedLines.some(item=>item.category==='violation');
    const dimensionScore = record.inspected?round(items.reduce((value,item)=>value+item.score,0)):null;
    const score = !record.inspected?null:redLine||violation?0:Math.max(0,round(dimensionScore-sensitiveDeduction-knowledgeDeduction));
    const grade = score===null?'':score>=91?'优秀':score>=80?'合格':'不合格';
    const tagReview = data.tagReviews[recordKey(record)];
    return {...record,items,redLines,dimensions,dimensionScore,sensitiveDeduction,knowledgeDeduction,redLine,violation,score,grade,
      appealCount:issues.size,tagReview:tagReview?{...tagReview}:null};
  }

  function projectAppeal(appeal, entry, scope) {
    const appealStatus = status(appeal);
    const projection = copy(appeal);
    if (!scope.canReview) delete projection.reviewDraft;
    return {...projection,status:appealStatus,statusLabel:statuses[appealStatus],
      record:projectRecord(entry.byId.get(appeal.recordId),entry.data,scope)};
  }

  function records(context) {
    const scope = access(context);
    if (!scope) return [];
    const entry = load(scope);
    if (!entry.ok) return [];
    return entry.records.filter(record=>canSee(scope,record)).map(record=>projectRecord(record,entry.data,scope))
      .sort((left,right)=>right.callAt.localeCompare(left.callAt));
  }

  function record(id, context) {
    const scope = access(context);
    if (!scope) return null;
    const entry = load(scope);
    const found = entry.byId?.get(id);
    return canSee(scope,found)?projectRecord(found,entry.data,scope):null;
  }

  function appeals(context) {
    const scope = access(context);
    if (!scope) return [];
    const entry = load(scope);
    if (!entry.ok) return [];
    return entry.data.appeals.filter(appeal=>canSee(scope,entry.byId.get(appeal.recordId)))
      .map(appeal=>projectAppeal(appeal,entry,scope)).sort((left,right)=>right.submittedAt.localeCompare(left.submittedAt));
  }

  function appeal(id, context) {
    const scope = access(context);
    if (!scope) return null;
    const entry = load(scope);
    const found = entry.data?.appeals.find(row=>row.id===id);
    return found && canSee(scope,entry.byId.get(found.recordId))?projectAppeal(found,entry,scope):null;
  }

  const string = value => typeof value==='string'?value.trim():'';
  const shanghai = value => {
    if (timestamp(value)) return value;
    const ms = typeof value==='number'?value:Date.parse(value);
    return Number.isFinite(ms)?dateTime.format(ms):'';
  };
  const validItems = items => Array.isArray(items) && new Set(items.map(item=>item?.id)).size===items.length &&
    items.every(item=>item && string(item.id) && Number.isFinite(item.score) &&
      Number.isFinite(item.maxScore) && item.score>=0 && item.score<=item.maxScore+1e-8 && item.maxScore<=100);

  function validScheduledRecord(row, scope) {
    return Boolean(row && string(row.id) && string(row.callId) && string(row.accountId) &&
      row.tenantId===scope.tenantId && row.brandId===scope.brandId &&
      timestamp(row.callAt) && timestamp(row.qualityAt) && typeof row.inspected==='boolean' &&
      validItems(row.items) && Array.isArray(row.redLines) && row.redLines.every(item=>item && string(item.id)) &&
      Array.isArray(row.tags) && Array.isArray(row.transcript) && Array.isArray(row.rubric) &&
      row.rubric.every(dimension=>dimension && string(dimension.id) && Number.isFinite(dimension.weight) &&
        Array.isArray(dimension.groups) && dimension.groups.every(group=>group && string(group.id) && Array.isArray(group.items))));
  }

  function scheduledRubric(categories) {
    return categories.map(category=>{
      const id = category.catalogId || category.id;
      return {id,name:category.name,weight:category.weight,groups:category.groups.map(group=>{
        const groupId = id+'/'+(group.catalogId || group.id);
        return {id:groupId,name:group.name,items:group.items.map(item=>({
          id:groupId+'/'+(item.catalogId || item.id),name:item.name,description:item.description,
          maxScore:category.weight*group.weight*item.weight/10000
        }))};
      })};
    });
  }

  function acceptedItems(rubric, rows) {
    if (!validItems(rows)) return null;
    const returned = new Map(rows.map(item=>[item.id,item]));
    const expected = rubric.flatMap(dimension=>dimension.groups.flatMap(group=>
      group.items.map(item=>({...item,dimensionId:dimension.id,groupId:group.id}))));
    if (expected.length !== rows.length || expected.some(item=>{
      const actual = returned.get(item.id);
      return !actual || Math.abs(actual.maxScore-item.maxScore)>0.000001 ||
        (actual.ratio!=null && (!Number.isFinite(actual.ratio) || actual.ratio<0 || actual.ratio>100));
    })) return null;
    return expected.map(item=>{
      const actual = returned.get(item.id);
      const score = Math.min(item.maxScore,actual.score);
      const passed = item.maxScore-score<=1e-8;
      return {...item,score,passed,appealable:!passed,evidenceTime:string(actual.evidenceTime),evidence:string(actual.evidence),
        ...(Number.isFinite(actual.ratio)?{ratio:actual.ratio}:{})};
    });
  }

  function acceptScheduledResult(result, context = window.DSession?.context()) {
    const scope = access(context);
    if (scope?.role!=='manager') return fail('当前账号无权接收本租户定时质检结果。');
    const {call,agent,model,requestId,outcome,reason} = result || {};
    if (!call || call.tenantId!==scope.tenantId || call.brandId!==scope.brandId ||
        !string(call.id) || !string(call.callId) || !string(call.accountId) || !string(call.seatId) ||
        requestId!=='QAR-'+call.id || !['inspected','notInspected'].includes(outcome)) {
      return fail('质检结果无法与本租户原通话记录对应。');
    }
    const entry = load(scope);
    if (!entry.ok) return entry;
    const prior = entry.byId.get(call.id) || entry.records.find(row=>row.requestId && row.callId===call.callId);
    if (prior) {
      const sameCall = ['callId','accountId','seatId','taskId','roundId']
        .every(field=>string(prior[field])===string(call[field]));
      return prior.requestId && sameCall
        ? {ok:true,already:true,record:projectRecord(prior,entry.data,scope)}
        : fail('原通话对应的质检编号已存在，请核对来源。');
    }
    const enabledAgent = window.DIntegrationApplications?.status(context,'qualityInspection');
    if (!string(agent?.id) || enabledAgent?.status!=='connected' || enabledAgent.application.id!==agent.id) {
      return fail('智能质检 Agent 的启用配置已变化，请重新执行。');
    }
    const frozen = window.DQualityModelConfig?.getVersion(model?.id,model?.version,context);
    if (!frozen || JSON.stringify(frozen.categories)!==JSON.stringify(model.categories)) {
      return fail('无法核对本次质检绑定的模型版本。');
    }
    const rubric = scheduledRubric(frozen.categories);
    const inspected = outcome==='inspected';
    const items = inspected ? acceptedItems(rubric,result.items) : [];
    const qualityAt = shanghai(result.qualityAt);
    const callAt = shanghai(call.callAt) || shanghai(call.endedAt);
    if (!items || !callAt || !qualityAt || !inspected && !string(reason)) return fail('智能质检返回的结果不完整。');
    const connected = call.connected===true || call.connected!==false && ['已接通','接通'].includes(call.contact);
    const duration = Number.isFinite(call.duration) && call.duration>=0?call.duration:null;
    const safeCallFields = ['id','callId','tenantId','brandId','accountId','seatId','seatName','seatGroup','taskId','roundId',
      'leadCode','customerName','phone','series','source','channel','leadType','dealer','callMode','contact',
      'followupResult','followupNote','leadStatus'];
    const tags = Array.isArray(result.tags)?result.tags:call.tags;
    const phone = string(call.phone).replace(/^(\d{3})\d{4}(\d{4})$/,'$1****$2');
    const record = {...Object.fromEntries(safeCallFields.map(key=>[key,string(call[key])])),
      phone,callAt,qualityAt,receivedAt:shanghai(call.receivedAt) || callAt,duration,connected,
      validCall:connected && duration!==null && duration>=30,inspected,notInspectedReason:inspected?'':string(reason),
      completeness:['完整','不完整'].includes(result.completeness)?result.completeness:connected?'完整':'不完整',
      excellent:inspected && result.excellent===true,items,redLines:[],rubric,
      transcript:Array.isArray(call.transcript)?call.transcript.filter(row=>row && string(row.text))
        .map(row=>({time:string(row.time),role:string(row.role),text:string(row.text)})):[],
      tags:Array.isArray(tags)?tags.filter(tag=>tag && string(tag.label) && string(tag.value))
        .map(tag=>({label:string(tag.label),value:string(tag.value)})):[],
      agentId:agent.id,agentName:string(agent.name),modelId:model.id,modelVersion:model.version,requestId};
    const data = {...entry.data,scheduledRecords:[...(entry.data.scheduledRecords || []),record]};
    const saved = save(entry,data,scope);
    return saved.ok?{ok:true,record:projectRecord(record,data,scope)}:saved;
  }

  function modelForRecords(rows) {
    const dimensions = new Map();
    for (const source of [fixture.rubric(),...rows.map(row=>row.rubric).filter(Boolean)]) {
      for (const dimension of source) {
        if (!dimensions.has(dimension.id)) dimensions.set(dimension.id,{...dimension,groups:new Map()});
        const stored = dimensions.get(dimension.id);
        for (const group of dimension.groups) {
          if (!stored.groups.has(group.id)) stored.groups.set(group.id,{...group,items:new Map()});
          const items = stored.groups.get(group.id).items;
          for (const item of group.items) items.set(item.id,item);
        }
      }
    }
    return [...dimensions.values()].map(dimension=>({...dimension,groups:[...dimension.groups.values()].map(group=>
      ({...group,items:[...group.items.values()]}))}));
  }

  function submitAppeal({recordId,itemIds,reason} = {}, context) {
    const scope = access(context);
    if (!scope?.canAppeal) return fail('只有负责本通质检的坐席可以提交申诉。');
    if (!allowedText(reason)) return fail('请填写申诉原因，最多 500 字。');
    if (!Array.isArray(itemIds) || !itemIds.length || new Set(itemIds).size!==itemIds.length) return fail('请选择要申诉的细项。');
    const entry = load(scope);
    if (!entry.ok) return entry;
    const found = entry.byId.get(recordId);
    if (!canSee(scope,found) || !found.inspected) return fail('当前账号无法申诉这条质检记录。');
    const projected = projectRecord(found,entry.data,scope);
    const eligible = new Set([...projected.items,...projected.redLines].filter(item=>item.appealable).map(item=>item.id));
    if (!itemIds.every(id=>eligible.has(id))) return fail('所选细项不可申诉或已提交过申诉。');
    const submitted = {id:'QA-APPEAL-'+recordId+'-'+(entry.data.revision+1),recordId,itemIds:[...itemIds],
      reason:reason.trim(),submittedAt:now(),submittedBy:scope.accountName,submittedByAccountId:scope.accountId,
      repliedAt:'',reviewedBy:'',reply:'',decisions:[]};
    const data = {...entry.data,appeals:[...entry.data.appeals,submitted]};
    const saved = save(entry,data,scope);
    return saved.ok?{ok:true,appeal:projectAppeal(submitted,{...entry,data},scope)}:saved;
  }

  function reviewAppeal({appealId,decisions,reply} = {}, context) {
    const scope = access(context);
    if (!scope?.canReview) return fail('只有本租户管理员可以审核申诉。');
    if (!allowedText(reply)) return fail('请填写审核回复，最多 500 字。');
    const entry = load(scope);
    if (!entry.ok) return entry;
    const pending = entry.data.appeals.find(row=>row.id===appealId);
    if (!pending || status(pending)!=='pending') return fail('申诉不存在或已审核，请刷新后查看。');
    if (!decisionsMatch(decisions,pending.itemIds)) {
      return fail('请为每个申诉细项选择审核结论。');
    }
    const reviewed = {...pending,decisions:decisions.map(({itemId,approve})=>({itemId,approve})),reply:reply.trim(),
      repliedAt:now(),reviewedBy:scope.accountName,reviewedByAccountId:scope.accountId};
    return saveAppeal(entry,reviewed,scope);
  }

  function saveAppeal(entry,reviewed,scope) {
    const data = {...entry.data,appeals:entry.data.appeals.map(row=>row.id===reviewed.id?reviewed:row)};
    const saved = save(entry,data,scope);
    return saved.ok?{ok:true,appeal:projectAppeal(reviewed,{...entry,data},scope)}:saved;
  }

  function stageAppealReview({appealId,decisions,reply,draftToken='',rework=false} = {}, context) {
    const scope = access(context);
    if (!scope?.canReview) return fail('只有本租户管理员可以审核申诉。');
    if (!allowedText(reply)) return fail('请填写审核回复，最多 500 字。');
    const entry = load(scope);
    if (!entry.ok) return entry;
    const appeal = entry.data.appeals.find(row=>row.id===appealId);
    if (!appeal || (appeal.reviewDraft?.token || '')!==draftToken) return fail('申诉审核已变化，请刷新后查看。');
    if (resolution(appeal)!=='pending' && !appeal.reviewDraft && rework!==true) return fail('请先选择重新提交审核。');
    if (!decisionsMatch(decisions,appeal.itemIds)) return fail('请为每个申诉细项选择审核结论。');
    const reviewDraft = {token:'AR-'+appeal.id+'-'+(entry.data.revision+1),reply:reply.trim(),submittedAt:now(),
      submittedBy:scope.accountName,submittedByAccountId:scope.accountId,
      decisions:decisions.map(({itemId,approve})=>({itemId,approve}))};
    return saveAppeal(entry,{...appeal,reviewDraft},scope);
  }

  function finalizeAppealReview({appealId,draftToken,approved} = {}, context) {
    const scope = access(context);
    if (!scope?.canReview) return fail('只有本租户管理员可以审批申诉。');
    if (typeof approved!=='boolean') return fail('请选择审批结论。');
    const entry = load(scope);
    if (!entry.ok) return entry;
    const appeal = entry.data.appeals.find(row=>row.id===appealId);
    const draft = appeal?.reviewDraft;
    if (!draft || draft.token!==draftToken) return fail('申诉审核已变化，请刷新后查看。');
    const {reviewDraft,...reviewed} = appeal;
    if (resolution(appeal)!=='pending') {
      const {decisions,reply,repliedAt,reviewedBy,reviewedByAccountId,reviewSubmittedAt,reviewSubmittedBy} = appeal;
      reviewed.reviewHistory = [...(appeal.reviewHistory || []),{
        decisions,reply,repliedAt,reviewedBy,reviewedByAccountId,reviewSubmittedAt,reviewSubmittedBy
      }];
    }
    Object.assign(reviewed,{reply:draft.reply,reviewSubmittedAt:draft.submittedAt,reviewSubmittedBy:draft.submittedBy,
      decisions:draft.decisions.map(({itemId,approve})=>({itemId,approve:approved&&approve})),
      repliedAt:now(),reviewedBy:scope.accountName,reviewedByAccountId:scope.accountId});
    return saveAppeal(entry,reviewed,scope);
  }

  function verifyTags({recordId,passed,reason} = {}, context) {
    const scope = access(context);
    if (!scope?.canVerifyTags) return fail('只有本租户管理员可以检核标签。');
    if (typeof passed!=='boolean' || !allowedText(reason)) return fail('请选择检核结果并填写原因，最多 500 字。');
    const entry = load(scope);
    if (!entry.ok) return entry;
    const found = entry.byId.get(recordId);
    if (!found?.tags.length) return fail('未找到可检核的线索标签。');
    const tagReview = {passed,reason:reason.trim(),reviewedAt:now(),reviewedBy:scope.accountId,
      reviewedByName:scope.accountName,recordId:found.id,callId:found.callId,taskId:found.taskId,roundId:found.roundId};
    const data = {...entry.data,tagReviews:{...entry.data.tagReviews,[recordKey(found)]:tagReview}};
    const saved = save(entry,data,scope);
    return saved.ok?{ok:true,tagReview,record:projectRecord(found,data,scope)}:saved;
  }

  window.DQualityInspection = Object.freeze({access,model:()=>fixture.rubric(),records,record,appeals,appeal,
    submitAppeal,reviewAppeal,stageAppealReview,finalizeAppealReview,verifyTags,acceptScheduledResult,modelForRecords});
})();
